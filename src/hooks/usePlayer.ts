import regression from "regression";
import { useAppContext } from "@/store";
import { F0_SOURCE_NOISE } from "@/constants";
import {
  CAP_FREQ,
  clamp,
  createFormants,
  createHarmonics,
  createWhiteNoise,
  db2gain,
  freq2note,
  gain2db,
  noteOrFreq2freq,
  arr2rms,
  type Note,
} from "@/utils";
import type { HarmonicFrame, MetricsData, PlayerNoteOptions, PlayerState } from "@/types";

export function usePlayer(): PlayerState {
  const { settings, ipa, setMetrics, player, setPlayer, playerRuntimeRef } = useAppContext();

  if (!playerRuntimeRef.current) {
    const audioContext = new AudioContext(settings.audioContextConfig);
    const noise = createWhiteNoise(audioContext);
    noise.start(audioContext.currentTime);

    const compressor = new DynamicsCompressorNode(audioContext, settings.compression);
    const analyzer = new AnalyserNode(audioContext, settings.analyzer);
    const output = new GainNode(audioContext, { gain: clamp(player.volume, 0.0, 100.0) / 100.0 });

    playerRuntimeRef.current = {
      audioContext,
      noise,
      compressor,
      analyzer,
      output,
      outputConnectedToDestination: false,
      outputConnectedToAnalyzer: false,
      compressorConnectedToOutput: false,
      analyzeRafId: undefined,
      micAnalyzing: false,
      playing: {},
      voices: {},
      nextVoiceId: 1,
      nextStartOrder: 1,
      analyzerListeners: {},
    };
  }

  const runtime = playerRuntimeRef.current!;
  const analyzer = runtime.analyzer;
  const output = runtime.output;
  const compressor = runtime.compressor;

  function setVolume(next: number) {
    output.gain.value = clamp(next, 0.0, 100.0) / 100.0;
    setPlayer((current) => ({ ...current, volume: next }));
  }

  function setRafId(next: number | undefined) {
    runtime.analyzeRafId = next;
    setPlayer((current) => ({ ...current, rafId: next }));
  }

  function setMicAnalyzing(next: boolean) {
    runtime.micAnalyzing = next;
    if (!settings.analyzer.on) return;

    if (next) {
      if (runtime.analyzeRafId === undefined) {
        setRafId(requestAnimationFrame(analyze));
      }
      return;
    }

    if (Object.keys(runtime.playing).length === 0 && runtime.analyzeRafId !== undefined) {
      cancelAnimationFrame(runtime.analyzeRafId);
      setRafId(undefined);
    }
  }

  function now() {
    return runtime.audioContext.currentTime;
  }

  function play(
    note: number | Note,
    velocity = 1,
    atTime = 0,
    duration?: number,
    options?: PlayerNoteOptions,
  ) {
    const perfStartTime = runtime.audioContext.currentTime;
    const frequency = noteOrFreq2freq(note);
    if (frequency > CAP_FREQ) return;
    const timeOffset = Math.max(0, atTime);
    const startTime = runtime.audioContext.currentTime + timeOffset + 0.002;
    const harmonicTilt = options?.tilt ?? settings.harmonics.tilt;
    const activeIpa = options?.vowel ?? ipa;
    const formantOverrides = options?.formants;

    // Only pre-stop for immediate retriggers. Scheduled sequences may include repeated
    // pitches, and canceling by frequency here drops future notes.
    if (timeOffset <= 0.01) {
      runtime.playing[frequency]?.({
        releaseAt: runtime.audioContext.currentTime + 0.01,
      });
      delete runtime.playing[frequency];
    }

    const { sourceType, source, sourceGain, controlSource } = createSource(frequency);
    applyHarmonics(source, sourceType, frequency, harmonicTilt);
    applyFlutter(source);
    const vibratoOsc = createVibrato(source);
    const formantsGain = connectFormants(sourceGain, activeIpa, formantOverrides);
    connectOutput(formantsGain);

    if (controlSource) source.start(startTime);
    sourceGain.gain.setValueAtTime(0, startTime);
    sourceGain.gain.linearRampToValueAtTime(
      velocity * settings.f0.keyGain,
      startTime + settings.f0.onsetTime,
    );

    const stopVoice: (typeof runtime.playing)[number] = (opts) => {
      const stopAnalysis = opts?.stopAnalysis ?? false;
      const releaseAt = opts?.releaseAt ?? runtime.audioContext.currentTime + 0.05;
      sourceGain.gain.setTargetAtTime(0, releaseAt, settings.f0.decayTime);
      const stopAt = releaseAt + settings.f0.decayTime + 1;
      if (controlSource) {
        try {
          source.stop(stopAt);
        } catch {
          // Source may already be stopped when external callers overlap stop schedules.
        }
      }
      if (vibratoOsc) {
        try {
          vibratoOsc.stop(stopAt);
        } catch {
          // Vibrato may already be stopped for the same reason.
        }
      }
      if (stopAnalysis && runtime.analyzeRafId !== undefined) {
        cancelAnimationFrame(runtime.analyzeRafId);
        setRafId(undefined);
      }
    };
    runtime.playing[frequency] = stopVoice;

    if (duration !== undefined) {
      const holdDuration = Math.max(0, duration);
      stopVoice({ releaseAt: startTime + holdDuration });
      scheduleStopCleanup(frequency, stopVoice, timeOffset + holdDuration);
    }

    setMetrics((current) => ({
      ...current,
      latency: runtime.audioContext.currentTime - perfStartTime,
    }));
  }

  function stop(note: number | Note, stopAnalysis = false, atTime = 0) {
    const frequency = noteOrFreq2freq(note);
    const stopVoice = runtime.playing[frequency];
    if (!stopVoice) return;
    const time = runtime.audioContext.currentTime + Math.max(0, atTime);
    stopVoice({ stopAnalysis, releaseAt: time });
    if (atTime <= 0) {
      delete runtime.playing[frequency];
    } else {
      scheduleStopCleanup(frequency, stopVoice, atTime);
    }
  }

  function stopApiPlayback() {
    const releaseAt = runtime.audioContext.currentTime + 0.01;
    Object.keys(runtime.playing).forEach((key) => {
      runtime.playing[Number(key)]?.({ releaseAt });
    });
  }

  function analyze() {
    const useFloatData = settings.analyzer.useFloatData;
    const count = analyzer.frequencyBinCount;
    let timeData: Float32Array | Uint8Array;
    let freqData: Float32Array | Uint8Array;

    if (useFloatData) {
      const floatTimeData: Float32Array<ArrayBuffer> = new Float32Array(
        new ArrayBuffer(count * Float32Array.BYTES_PER_ELEMENT),
      );
      const floatFreqData: Float32Array<ArrayBuffer> = new Float32Array(
        new ArrayBuffer(count * Float32Array.BYTES_PER_ELEMENT),
      );
      analyzer.getFloatTimeDomainData(floatTimeData);
      analyzer.getFloatFrequencyData(floatFreqData);
      timeData = floatTimeData;
      freqData = floatFreqData;
    } else {
      const byteTimeData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(count));
      const byteFreqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(count));
      analyzer.getByteTimeDomainData(byteTimeData);
      analyzer.getByteFrequencyData(byteFreqData);
      timeData = byteTimeData;
      freqData = byteFreqData;
    }

    let frameMetrics: MetricsData = {
      source: undefined,
      rms: 0,
      tilt: undefined,
      harmonics: [],
      compression: compressor.reduction,
      latency: 0,
      sampleRate: analyzer.context.sampleRate,
      frequencyBinCount: count,
      pitch: undefined,
      freqData,
      timeData,
    };

    setMetrics((current) => {
      const harmonics = current.harmonics.map<HarmonicFrame>(([freq, gain]) => [freq, gain, 0]);
      harmonics.forEach((harmonic) => {
        const [freq] = harmonic;
        const bucketWidth = analyzer.context.sampleRate / 2 / count;
        for (let i = 0; i < freqData.length; i += 1) {
          const value = freqData[i];
          const f1 = i * bucketWidth;
          const f2 = f1 + bucketWidth;
          if (freq >= f1 && freq < f2) {
            harmonic[2] = useFloatData ? db2gain(value) : value / 256.0;
          }
        }
      });

      const rms = useFloatData
        ? gain2db(arr2rms([...freqData], 1.0))
        : gain2db(arr2rms([...freqData], 256.0));
      const tilt = regression.logarithmic(harmonics.map((harmonic) => [harmonic[0], harmonic[2]]));
      const nextMetrics = {
        ...current,
        compression: compressor.reduction,
        sampleRate: analyzer.context.sampleRate,
        frequencyBinCount: count,
        freqData,
        timeData,
        rms,
        harmonics,
        tilt,
      };
      frameMetrics = nextMetrics;
      return nextMetrics;
    });

    Object.values(runtime.analyzerListeners).forEach((listener) => {
      listener.onFrame(frameMetrics, analyzer);
    });

    setRafId(requestAnimationFrame(analyze));
  }

  function reset() {
    Object.keys(runtime.playing).forEach((key) => {
      const frequency = Number(key);
      runtime.playing[frequency]?.({ stopAnalysis: true });
      delete runtime.playing[frequency];
    });
    Object.keys(runtime.analyzerListeners).forEach((key) => {
      delete runtime.analyzerListeners[key];
    });
    setVolume(100);
    if (runtime.analyzeRafId !== undefined) {
      cancelAnimationFrame(runtime.analyzeRafId);
      setRafId(undefined);
    }
  }

  function addAnalyzerListener(id: string, listener: (typeof runtime.analyzerListeners)[string]) {
    runtime.analyzerListeners[id] = listener;
  }

  function removeAnalyzerListener(id: string) {
    delete runtime.analyzerListeners[id];
  }

  function scheduleStopCleanup(
    frequency: number,
    stopVoice: NonNullable<(typeof runtime.playing)[number]>,
    afterSeconds: number,
  ) {
    const cleanupMs = Math.max(0, afterSeconds + settings.f0.decayTime + 1.1) * 1000;
    window.setTimeout(() => {
      if (runtime.playing[frequency] === stopVoice) {
        delete runtime.playing[frequency];
      }
    }, cleanupMs);
  }

  function createSource(frequency: number) {
    const sourceType = settings.f0.sourceType;
    const oscillator = new OscillatorNode(runtime.audioContext, { frequency, type: sourceType });
    const oscGain = new GainNode(runtime.audioContext, { gain: 0 });
    const noiseGain = new GainNode(runtime.audioContext, { gain: 0 });
    let source: AudioScheduledSourceNode = oscillator;
    let sourceGain: GainNode = oscGain;
    let controlSource = true;

    if (settings.f0.source === F0_SOURCE_NOISE) {
      source = runtime.noise;
      sourceGain = noiseGain;
      controlSource = false;
    }

    source.connect(sourceGain);

    if (!settings.f0.on && source instanceof OscillatorNode) {
      source.frequency.value = 0;
    }

    return { sourceType, source, sourceGain, controlSource };
  }

  function applyHarmonics(
    source: AudioScheduledSourceNode,
    sourceType: OscillatorType,
    frequency: number,
    harmonicTilt: number,
  ) {
    if (settings.harmonics.on && source instanceof OscillatorNode) {
      const [harmonics, periodicWave] = createHarmonics(
        runtime.audioContext,
        frequency,
        settings.harmonics.max,
        settings.harmonics.maxFreq,
        harmonicTilt,
      );
      source.setPeriodicWave(periodicWave);
      setMetrics((current) => ({
        ...current,
        source: sourceType,
        pitch: { freq: frequency, note: freq2note(frequency), cents: 0 },
        harmonics: harmonics.map(([freq, gain]) => [freq, gain, 0]),
      }));
    } else {
      setMetrics((current) => ({
        ...current,
        source: sourceType,
        pitch: { freq: frequency, note: freq2note(frequency), cents: 0 },
        harmonics: [[frequency, 1, 0]],
      }));
    }
  }

  function applyFlutter(source: AudioScheduledSourceNode) {
    if (settings.flutter.on && source instanceof OscillatorNode) {
      const flutterGain = new GainNode(runtime.audioContext, { gain: settings.flutter.amount });
      runtime.noise.connect(flutterGain);
      flutterGain.connect(source.frequency);
    }
  }

  function createVibrato(source: AudioScheduledSourceNode) {
    let vibratoOsc: OscillatorNode | null = null;
    if (settings.vibrato.on && source instanceof OscillatorNode) {
      vibratoOsc = new OscillatorNode(runtime.audioContext, { frequency: settings.vibrato.rate });
      const vibratoGain = new GainNode(runtime.audioContext, { gain: 0 });
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(source.frequency);
      if (settings.vibrato.jitter) {
        const vibratoJitter = new GainNode(runtime.audioContext, { gain: settings.vibrato.jitter });
        runtime.noise.connect(vibratoJitter);
        vibratoJitter.connect(vibratoOsc.frequency);
      }
    }

    return vibratoOsc;
  }

  function connectFormants(
    sourceGain: GainNode,
    activeIpa: typeof ipa,
    formantOverrides: PlayerNoteOptions["formants"],
  ) {
    const formantsGain = new GainNode(runtime.audioContext, { gain: 1 });
    const activeFormantSpec =
      formantOverrides && formantOverrides.length > 0
        ? settings.formants.ipa[activeIpa].map((formant, index) => {
            const patch = formantOverrides.find((item) => item.index === index);
            if (!patch) return formant;
            const next = { ...patch };
            delete (next as { index?: number }).index;
            return { ...formant, ...next };
          })
        : settings.formants.ipa[activeIpa];
    const formants = createFormants(runtime.audioContext, activeFormantSpec);
    if (formants.length > 0) {
      formants.forEach((formant) => {
        sourceGain.connect(formant);
        formant.connect(formantsGain);
      });
    } else {
      sourceGain.connect(formantsGain);
    }
    return formantsGain;
  }

  function connectOutput(formantsGain: GainNode) {
    if (settings.compression.on) {
      formantsGain.connect(compressor);
      if (!runtime.compressorConnectedToOutput) {
        compressor.connect(output);
        runtime.compressorConnectedToOutput = true;
      }
    } else {
      if (runtime.compressorConnectedToOutput) {
        try {
          compressor.disconnect(output);
        } catch {
          // Disconnect may throw when the edge is already absent.
        }
        runtime.compressorConnectedToOutput = false;
      }
      formantsGain.connect(output);
    }

    if (settings.analyzer.on) {
      if (!runtime.outputConnectedToAnalyzer) {
        output.connect(analyzer);
        runtime.outputConnectedToAnalyzer = true;
      }
      if (runtime.analyzeRafId === undefined) setRafId(requestAnimationFrame(analyze));
    } else if (runtime.outputConnectedToAnalyzer && !runtime.micAnalyzing) {
      try {
        output.disconnect(analyzer);
      } catch {
        // Disconnect may throw when the edge is already absent.
      }
      runtime.outputConnectedToAnalyzer = false;
    }

    if (!runtime.outputConnectedToDestination) {
      output.connect(runtime.audioContext.destination);
      runtime.outputConnectedToDestination = true;
    }
  }

  return {
    setVolume,
    setRafId,
    setMicAnalyzing,
    now,
    play,
    stop,
    stopApiPlayback,
    addAnalyzerListener,
    removeAnalyzerListener,
    analyze,
    reset,
  };
}
