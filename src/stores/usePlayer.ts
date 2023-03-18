/* eslint-disable @typescript-eslint/no-explicit-any */
import { arr2rms, Note } from '../utils';
import type { Metrics } from './useMetrics';
import regression from 'regression';

interface AnalyzerListener {
  onFrame: (data: Metrics, analyzer: AnalyserNode) => void;
}

export const usePlayer = defineStore('player', () => {
  const { settings } = useSettings();
  const { vowelSpec } = storeToRefs(useVowel());
  const metrics = useMetrics();
  const playing: Record<number, (stopAnalysis: boolean) => void> = {};
  const volume = ref(100.0);
  const audioContext = computed(() => new AudioContext(settings.audioContextConfig));
  const noise = computed(() => {
    const n = createWhiteNoise(audioContext.value);
    n.start(audioContext.value.currentTime);
    return n;
  });
  const compressor = computed(() => new DynamicsCompressorNode(audioContext.value, settings.compression));
  const analyzer = computed(() => new AnalyserNode(audioContext.value, settings.analyzer));
  const analyzerListeners = ref<Record<string, AnalyzerListener>>({});
  const output = ref(new GainNode(audioContext.value, { gain: volume.value / 100.0 }));
  const rafId = ref<number>(); // requestAnimationFrame id

  watch(() => volume.value, () => {
    output.value.gain.value = clamp(volume.value, 0.0, 100.0) / 100.0;
  });

  function play(note: number|Note, velocity = 1.0) {
    const ctx = audioContext.value;
    const perfStartTime = ctx.currentTime;

    const frequency = noteOrFreq2freq(note);
    if (frequency > CAP_FREQ) return; // no one gets hurt

    // create basic source nodes
    const sourceType = settings.f0.sourceType as OscillatorType;
    const osc = new OscillatorNode(ctx, { frequency, type: sourceType });
    const oscGain = new GainNode(ctx, { gain: 0 });
    const noiseGain = new GainNode(ctx, { gain: 0 });
    metrics.source = sourceType;

    // set the audio source
    let source: AudioScheduledSourceNode;
    let sourceGain: GainNode;
    let mustControlSource = true;
    if (settings.f0.source === 'noise')
      [source, sourceGain, mustControlSource] = [noise.value, noiseGain, false];
    else
      [source, sourceGain] = [osc, oscGain, true];
    source.connect(sourceGain);
    const isTonalSource = 'frequency' in source;
    if (!settings.f0.on && isTonalSource) (source as OscillatorNode).frequency.value = 0;

    // create harmonics
    const h = settings.harmonics;
    if (h.on && isTonalSource) {
      const [harmonics, periodicWave] = createHarmonics(ctx, frequency, h.max, h.maxFreq, h.tilt);
      (source as OscillatorNode).setPeriodicWave(periodicWave);
      metrics.harmonics = harmonics.map(([freq, gain]) => [freq, gain, 0.0]);
    } else {
      metrics.harmonics = [[frequency, 1.0, 0.0]];
    }
    metrics.pitch = { freq: frequency, note: freq2note(frequency), cents: 0 };

    // apply effects to source
    let flutterGain: GainNode|null = null;
    if (settings.flutter.on && isTonalSource) {
      flutterGain = new GainNode(ctx, { gain: settings.flutter.amount });
      noise.value.connect(flutterGain);
      flutterGain.connect((source as OscillatorNode).frequency);
    }

    let vibratoOsc: OscillatorNode|null = null;
    let vibratoGain: GainNode|null = null;
    let vibratoJitter: GainNode|null = null;
    if (settings.vibrato.on && isTonalSource) {
      vibratoOsc = new OscillatorNode(ctx, { frequency: settings.vibrato.rate });
      vibratoGain = new GainNode(ctx, { gain: 0 });
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect((source as OscillatorNode).frequency);
      if (settings.vibrato.jitter) {
        vibratoJitter = new GainNode(ctx, { gain: settings.vibrato.jitter });
        noise.value.connect(vibratoJitter);
        vibratoJitter.connect(vibratoOsc.frequency);
      }
    }

    // formants
    let formants: BiquadFilterNode[];
    const formantsGain: GainNode = new GainNode(ctx, { gain: 1 });
    if (settings.formants.on) {
      formants = createFormants(ctx, vowelSpec.value);
      for (const formant of formants) {
        sourceGain.connect(formant);
        formant.connect(formantsGain);
      }
    } else {
      sourceGain.connect(formantsGain);
    }

    // final leg: compression -> output
    if (settings.compression.on) {
      formantsGain.connect(compressor.value);
      compressor.value.connect(output.value);
    } else {
      formantsGain.connect(output.value);
    }

    // output -> analyzer
    if (settings.analyzer.on) {
      output.value.connect(analyzer.value);
      rafId.value ??= requestAnimationFrame(analyze);
    }

    // output -> destination
    output.value.connect(ctx.destination);

    // start/ramp source nodes
    const t = ctx.currentTime + .002;
    if (mustControlSource) source.start(t);

    const keyGain = velocity * settings.f0.keyGain;
    sourceGain.gain.linearRampToValueAtTime(keyGain, t + settings.f0.onsetTime);
    if (vibratoOsc && vibratoGain) {
      vibratoOsc.start(t);
      vibratoGain.gain.linearRampToValueAtTime(settings.vibrato.extent, t + settings.vibrato.onsetTime);
    }

    // store stop function
    playing[frequency] = (stopAnalysis = false) => {
      const t = ctx.currentTime + .05;
      sourceGain.gain.setTargetAtTime(0, t, settings.f0.decayTime);
      if (mustControlSource) source.stop(t + settings.f0.decayTime + 1);
      vibratoOsc?.stop(t);
      if (stopAnalysis && rafId.value) {
        cancelAnimationFrame(rafId.value);
        rafId.value = undefined;
      }
      source = sourceGain = vibratoOsc = undefined as any;
    };

    metrics.latency = ctx.currentTime - perfStartTime;
  }

  function stop(note: number|Note, stopAnalysis = false) {
    const frequency = noteOrFreq2freq(note);
    playing[frequency]?.(stopAnalysis); // stop fn
    delete playing[frequency];
  }

  function addAnalyzerListener(id: string, listener: AnalyzerListener) {
    analyzerListeners.value[id] = listener;
  }

  function removeAnalyzerListener(id: string) {
    delete analyzerListeners.value[id];
  }

  function analyze() {
    metrics.compression = compressor.value.reduction;
    metrics.sampleRate = analyzer.value.context.sampleRate;
    metrics.frequencyBinCount = analyzer.value.frequencyBinCount;

    if (settings.analyzer.useFloatData) {
      analyzer.value.getFloatTimeDomainData(metrics.timeData as Float32Array);
      analyzer.value.getFloatFrequencyData(metrics.freqData as Float32Array);
      metrics.rms = gain2db(arr2rms([...metrics.freqData], 1.0)); // ??
    } else {
      analyzer.value.getByteTimeDomainData(metrics.timeData as Uint8Array);
      analyzer.value.getByteFrequencyData(metrics.freqData as Uint8Array);
      metrics.rms = gain2db(arr2rms([...metrics.freqData], 256.0));
    }

    metrics.harmonics.forEach(h => {
      const [f] = h;
      const sliceWidth = (metrics.sampleRate / 2) / metrics.frequencyBinCount;
      metrics.freqData.forEach((v, i) => {
        const f1 = i * sliceWidth;
        const f2 = f1 + sliceWidth;
        if (f >= f1 && f < f2) {
          h[2] = settings.analyzer.useFloatData ? db2gain(v) : v / 256.0;
        }
      });
    });

    metrics.tilt = regression.logarithmic(metrics.harmonics.map(h => [h[0], h[2]]));

    for (const l of Object.values(analyzerListeners.value)) {
      l.onFrame(metrics, analyzer.value);
    }
    rafId.value = requestAnimationFrame(analyze);
  }

  return {
    play,
    stop,
    output,
    rafId,
    addAnalyzerListener,
    removeAnalyzerListener,
    analyze,
    analyzer,
    volume,
  };
});
