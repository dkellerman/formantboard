import regression from "regression";
import { useAppContext } from "@/store";
import { DEFAULT_FORMANT_CASCADE_PCT, F0_SOURCE_NOISE } from "@/constants";
import {
  CAP_FREQ,
  clamp,
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

type FormantTopology = "parallel" | "cascade";
type FormantLike = {
  on: boolean;
  frequency: number;
  Q: number;
  gain: number;
};

const COMPENSATION_SAMPLE_COUNT = 96;
const COMPENSATION_MIN_HZ = 80;
const COMPENSATION_MAX_HZ = 8000;
const COMPENSATION_BODY_MIN_HZ = 120;
const COMPENSATION_BODY_MAX_HZ = 1400;
const COMPENSATION_AIR_MIN_HZ = 1600;
const COMPENSATION_AIR_MAX_HZ = 6000;
const COMPENSATION_BODY_SHELF_HZ = 320;
const COMPENSATION_BODY_SHELF_MAX_DB = 8;

function toBiquadQ(formantQ: number) {
  return Math.max(0.0001, formantQ / 10);
}

function complexMultiply(ar: number, ai: number, br: number, bi: number): [number, number] {
  return [ar * br - ai * bi, ar * bi + ai * br];
}

function computeCombinedResponseRms(
  mags: Float32Array[],
  phases: Float32Array[],
  topology: FormantTopology,
  cascadePct = 1,
  frequencies?: Float32Array,
  minHz = Number.NEGATIVE_INFINITY,
  maxHz = Number.POSITIVE_INFINITY,
) {
  if (mags.length === 0) return 1;
  const bins = mags[0]?.length ?? 0;
  if (bins === 0) return 1;

  let sumSquares = 0;
  let includedBins = 0;
  const mix = clamp(cascadePct, 0, 1);
  for (let i = 0; i < bins; i += 1) {
    const hz = frequencies?.[i];
    if (hz !== undefined && (hz < minHz || hz > maxHz)) continue;
    let parallelRe = 0;
    let parallelIm = 0;
    let cascadeRe = 1;
    let cascadeIm = 0;
    for (let j = 0; j < mags.length; j += 1) {
      const mag = mags[j][i];
      const phase = phases[j][i];
      const fr = mag * Math.cos(phase);
      const fi = mag * Math.sin(phase);
      parallelRe += fr;
      parallelIm += fi;
      [cascadeRe, cascadeIm] = complexMultiply(cascadeRe, cascadeIm, fr, fi);
    }
    let re = parallelRe;
    let im = parallelIm;
    if (topology === "cascade") {
      re = cascadeRe * mix + parallelRe * (1 - mix);
      im = cascadeIm * mix + parallelIm * (1 - mix);
    }
    const magnitude = Math.max(1e-6, Math.hypot(re, im));
    sumSquares += magnitude * magnitude;
    includedBins += 1;
  }
  if (includedBins === 0) return 1;
  return Math.sqrt(sumSquares / includedBins);
}

function createLogFrequencyGrid(sampleRate: number, count = COMPENSATION_SAMPLE_COUNT) {
  const maxNyquist = Math.max(COMPENSATION_MIN_HZ + 1, sampleRate / 2 - 100);
  const maxHz = Math.min(COMPENSATION_MAX_HZ, maxNyquist);
  const points = new Float32Array(count);
  const minLog = Math.log10(COMPENSATION_MIN_HZ);
  const maxLog = Math.log10(maxHz);
  for (let i = 0; i < count; i += 1) {
    const pct = count <= 1 ? 0 : i / (count - 1);
    points[i] = Math.pow(10, minLog + (maxLog - minLog) * pct);
  }
  return points;
}

function connectFormantNodes(
  input: AudioNode,
  formants: BiquadFilterNode[],
  output: AudioNode,
  topology: FormantTopology,
) {
  if (formants.length === 0) {
    input.connect(output);
    return;
  }

  if (topology === "parallel") {
    formants.forEach((formant) => {
      input.connect(formant);
      formant.connect(output);
    });
    return;
  }

  let cursor: AudioNode = input;
  formants.forEach((formant) => {
    cursor.connect(formant);
    cursor = formant;
  });
  cursor.connect(output);
}

function computeDynamicCompensationGain(
  ctx: AudioContext,
  formants: FormantLike[],
  cascadePct: number,
  enabled: boolean,
  maxBoostDb = 18,
  maxCutDb = 18,
) {
  if (!enabled) {
    return { gain: 1, bodyBoostDb: 0 };
  }
  const active = formants.filter((formant) => formant.on && formant.frequency > 0);
  if (active.length === 0) {
    return { gain: 1, bodyBoostDb: 0 };
  }

  const frequencies = createLogFrequencyGrid(ctx.sampleRate);
  const probes = active.map(
    (formant) =>
      new BiquadFilterNode(ctx, {
        type: "peaking",
        frequency: formant.frequency,
        Q: toBiquadQ(formant.Q),
        gain: formant.gain,
      }),
  );
  if (probes.some((probe) => typeof probe.getFrequencyResponse !== "function")) {
    return { gain: 1, bodyBoostDb: 0 };
  }
  const mags = probes.map(() => new Float32Array(frequencies.length));
  const phases = probes.map(() => new Float32Array(frequencies.length));
  probes.forEach((probe, idx) => {
    probe.getFrequencyResponse(frequencies, mags[idx], phases[idx]);
  });

  const legacyParallelRms = computeCombinedResponseRms(mags, phases, "parallel", 0);
  const currentTopologyRms = computeCombinedResponseRms(mags, phases, "cascade", cascadePct);
  const legacyBodyRms = computeCombinedResponseRms(
    mags,
    phases,
    "parallel",
    0,
    frequencies,
    COMPENSATION_BODY_MIN_HZ,
    COMPENSATION_BODY_MAX_HZ,
  );
  const currentBodyRms = computeCombinedResponseRms(
    mags,
    phases,
    "cascade",
    cascadePct,
    frequencies,
    COMPENSATION_BODY_MIN_HZ,
    COMPENSATION_BODY_MAX_HZ,
  );
  const legacyAirRms = computeCombinedResponseRms(
    mags,
    phases,
    "parallel",
    0,
    frequencies,
    COMPENSATION_AIR_MIN_HZ,
    COMPENSATION_AIR_MAX_HZ,
  );
  const currentAirRms = computeCombinedResponseRms(
    mags,
    phases,
    "cascade",
    cascadePct,
    frequencies,
    COMPENSATION_AIR_MIN_HZ,
    COMPENSATION_AIR_MAX_HZ,
  );
  if (
    !Number.isFinite(legacyParallelRms) ||
    !Number.isFinite(currentTopologyRms) ||
    !Number.isFinite(legacyBodyRms) ||
    !Number.isFinite(currentBodyRms) ||
    !Number.isFinite(legacyAirRms) ||
    !Number.isFinite(currentAirRms) ||
    legacyParallelRms <= 0 ||
    currentTopologyRms <= 0 ||
    legacyBodyRms <= 0 ||
    currentBodyRms <= 0 ||
    legacyAirRms <= 0 ||
    currentAirRms <= 0
  ) {
    return { gain: 1, bodyBoostDb: 0 };
  }

  const fullBandDb = 20 * Math.log10(legacyParallelRms / currentTopologyRms);
  const bodyBandDb = 20 * Math.log10(legacyBodyRms / currentBodyRms);

  // Makeup mode: preserve old loudness/body, avoid attenuation that can sound thin.
  const targetDb = Math.max(0, fullBandDb, bodyBandDb);
  const clampedDb = clamp(targetDb, -Math.abs(maxCutDb), Math.abs(maxBoostDb));
  const gain = db2gain(clampedDb);

  // Restore low-mid body if cascade tilts too bright relative to legacy parallel.
  const legacyBodyRatioDb = 20 * Math.log10(legacyBodyRms / legacyAirRms);
  const currentBodyRatioDb = 20 * Math.log10(currentBodyRms / currentAirRms);
  const bodyDeltaDb = legacyBodyRatioDb - currentBodyRatioDb;
  const bodyBoostDb = clamp(bodyDeltaDb * 0.8, 0, COMPENSATION_BODY_SHELF_MAX_DB);
  return { gain, bodyBoostDb };
}

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
    const playbackSource = options?.source ?? "ui";
    const timeOffset = Math.max(0, atTime);
    const startTime = runtime.audioContext.currentTime + timeOffset + 0.002;
    const harmonicTilt = options?.tilt ?? settings.harmonics.tilt;
    const activeIpa = options?.vowel ?? ipa;
    const formantOverrides = options?.formants;

    // API-triggered immediate retriggers should replace the current voice.
    // UI playback (keyboard/F0/MIDI) should not pre-stop by frequency.
    if (playbackSource === "api" && timeOffset <= 0.01) {
      runtime.playing[frequency]?.({
        releaseAt: runtime.audioContext.currentTime + 0.01,
      });
      delete runtime.playing[frequency];
    }

    const { sourceType, source, sourceGain, controlSource } = createSource(frequency);
    applyHarmonics(source, sourceType, frequency, harmonicTilt);
    applyFlutter(source);
    const vibratoOsc = createVibrato(source, startTime);
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

  function createVibrato(source: AudioScheduledSourceNode, startTime: number) {
    let vibratoOsc: OscillatorNode | null = null;
    if (settings.vibrato.on && source instanceof OscillatorNode) {
      vibratoOsc = new OscillatorNode(runtime.audioContext, { frequency: settings.vibrato.rate });
      const vibratoGain = new GainNode(runtime.audioContext, { gain: 0 });
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(source.frequency);
      const extentHz = Math.max(0, settings.vibrato.extent);
      const onsetSec = Math.max(0, settings.vibrato.onsetTime);
      vibratoGain.gain.cancelScheduledValues(startTime);
      vibratoGain.gain.setValueAtTime(0, startTime);
      if (onsetSec > 0) {
        vibratoGain.gain.linearRampToValueAtTime(extentHz, startTime + onsetSec);
      } else {
        vibratoGain.gain.setValueAtTime(extentHz, startTime);
      }
      vibratoOsc.start(startTime);
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
  ): AudioNode {
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
    const activeFormants = activeFormantSpec.filter(
      (formant) => formant.on && formant.frequency > 0,
    ) as FormantLike[];
    const cascadePctDefault = settings.formants.cascadePctDefault ?? DEFAULT_FORMANT_CASCADE_PCT;
    const cascadePctMultiplier = Math.max(0, settings.formants.cascadePctByIPA?.[activeIpa] ?? 1);
    const cascadePct = clamp(cascadePctDefault * cascadePctMultiplier, 0, 1);

    if (activeFormants.length === 0) {
      sourceGain.connect(formantsGain);
    } else {
      const createNodes = () =>
        activeFormants.map(
          (formant) =>
            new BiquadFilterNode(runtime.audioContext, {
              type: "peaking",
              frequency: formant.frequency,
              Q: toBiquadQ(formant.Q),
              gain: formant.gain,
            }),
        );
      const cascadeWeight = cascadePct;
      const parallelWeight = 1 - cascadeWeight;
      if (cascadeWeight > 0) {
        const cascadeMixGain = new GainNode(runtime.audioContext, { gain: cascadeWeight });
        const cascade = createNodes();
        connectFormantNodes(sourceGain, cascade, cascadeMixGain, "cascade");
        cascadeMixGain.connect(formantsGain);
      }
      if (parallelWeight > 0) {
        const parallelMixGain = new GainNode(runtime.audioContext, { gain: parallelWeight });
        const parallel = createNodes();
        connectFormantNodes(sourceGain, parallel, parallelMixGain, "parallel");
        parallelMixGain.connect(formantsGain);
      }
    }

    const compensation = computeDynamicCompensationGain(
      runtime.audioContext,
      activeFormants,
      cascadePct,
      settings.formants.compensation.on,
      settings.formants.compensation.maxBoostDb,
      settings.formants.compensation.maxCutDb,
    );
    formantsGain.gain.value = compensation.gain;
    if (compensation.bodyBoostDb <= 0) return formantsGain;

    const bodyShelf = new BiquadFilterNode(runtime.audioContext, {
      type: "lowshelf",
      frequency: COMPENSATION_BODY_SHELF_HZ,
      gain: compensation.bodyBoostDb,
    });
    formantsGain.connect(bodyShelf);
    return bodyShelf;
  }

  function connectOutput(formantsOutput: AudioNode) {
    if (settings.compression.on) {
      formantsOutput.connect(compressor);
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
      formantsOutput.connect(output);
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
