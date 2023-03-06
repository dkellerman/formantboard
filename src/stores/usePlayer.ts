/* eslint-disable @typescript-eslint/no-explicit-any */
import { Note } from '../utils';
import { Vowel } from './useVowel';
import type { Metrics } from './useMetrics';

interface AnalyzerListener {
  onFrame: (data: Metrics, analyzer: AnalyserNode) => void;
}

export const usePlayer = defineStore('player', () => {
  const { settings } = useSettings();
  const metrics = useMetrics();
  const playing: Record<number, (stopAnalysis: boolean) => void> = {};
  const volume = ref(100.0);
  const vowel = ref<Vowel>(settings.defaultVowel);
  const audioContext = computed(() => new AudioContext(settings.audioContextConfig));
  const noise = computed(() => {
    const n = createWhiteNoise(audioContext.value);
    n.start(audioContext.value.currentTime);
    return n;
  });
  const compressor = computed(() => new DynamicsCompressorNode(audioContext.value, settings.compression));
  const analyzer = computed(() => new AnalyserNode(audioContext.value, settings.analyzer));
  const analyzerListeners = ref<Record<string, AnalyzerListener>>({});
  const formantSpec = computed(() => settings.formants.specs[vowel.value]);
  const output = ref(new GainNode(audioContext.value, { gain: volume.value / 100.0 }));
  const rafId = ref<number>(); // requestAnimationFrame id

  watch(() => volume.value, () => {
    output.value.gain.value = clamp(volume.value, 0.0, 100.0) / 100.0;
  });

  function play(note: number|Note, velocity = 1.0) {
    const frequency = noteOrFreq2freq(note);
    if (frequency > MAX_FREQ || frequency < MIN_FREQ) return; // no one gets hurt

    const ctx = audioContext.value;
    const startTime = ctx.currentTime;

    // create basic source nodes
    const sourceType = settings.f0.sourceType as OscillatorType;
    const osc = new OscillatorNode(ctx, { frequency, type: sourceType });
    const oscGain = new GainNode(ctx, { gain: 0 });
    // const noiseGain = new GainNode(ctx, { gain: 0 });

    // set the audio source
    let source: AudioScheduledSourceNode;
    let sourceGain: GainNode;
    const mustControlSource = true;
    // if (settings.f0.source === 'noise')
    //   [source, sourceGain, mustControlSource] = [noise.value, noiseGain, false];
    // else
      [source, sourceGain] = [osc, oscGain, true];
    source.connect(sourceGain);
    const isTonalSource = 'frequency' in source;
    // if (!settings.f0.on && isTonalSource) (source as OscillatorNode).frequency.value = 0;

    // create harmonics (osc source only) -> oscillators feed into source node
    // and harmonics feed into harmonicsOutput
    let harmonics: [OscillatorNode, GainNode][];
    const harmonicsOutput = new GainNode(ctx, { gain: 1.0 });
    const h = settings.harmonics;
    if (h.on && isTonalSource) {
      harmonics = createHarmonics(ctx, frequency, h.max, h.maxFreq, h.tilt, sourceType);
      harmonics.forEach(([, hGain]) => hGain.connect(harmonicsOutput));
      metrics.harmonics = harmonics.map(([osc, gain]) => [osc.frequency.value, gain.gain.value]);
    } else {
      harmonics = metrics.harmonics = [];
    }

    // pre-emphasis
    // if (settings.preemphasis.on) {
    //   const preemph = createPreEmphasisFilter(ctx, settings.preemphasis);
    //   harmonicsOutput.connect(preemph);
    //   preemph.connect(sourceGain);
    // } else {
    //   harmonicsOutput.connect(sourceGain);
    // }

    // apply effects to source
    // let flutterGain: GainNode|null = null;
    // if (settings.flutter.on && isTonalSource) {
    //   flutterGain = new GainNode(ctx, { gain: settings.flutter.amount });
    //   noise.value.connect(flutterGain);
    //   flutterGain.connect((source as OscillatorNode).frequency);
    //   for (const [hosc] of harmonics) flutterGain.connect(hosc.frequency);
    // }

    // let vibratoOsc: OscillatorNode|null = null;
    // let vibratoGain: GainNode|null = null;
    // let vibratoJitter: GainNode|null = null;
    // if (settings.vibrato.on && isTonalSource) {
    //   vibratoOsc = new OscillatorNode(ctx, { frequency: settings.vibrato.rate });
    //   vibratoGain = new GainNode(ctx, { gain: 0 });
    //   vibratoOsc.connect(vibratoGain);
    //   vibratoGain.connect((source as OscillatorNode).frequency);
    //   for (const [hosc] of harmonics) vibratoGain.connect(hosc.frequency);
    //   if (settings.vibrato.jitter) {
    //     vibratoJitter = new GainNode(ctx, { gain: settings.vibrato.jitter });
    //     noise.value.connect(vibratoJitter);
    //     vibratoJitter.connect(vibratoOsc.frequency);
    //   }
    // }

    // create tube and apply formants
    // let tubeNode;
    // let tubeGain: GainNode = new GainNode(ctx, { gain: 1 });
    // if (settings.tube.on) {
    //   tubeNode = createTube(ctx, frequency);
    //   sourceGain.connect(tubeNode);
    //   tubeNode.connect(tubeGain);
    // } else {
    //   sourceGain.connect(tubeGain);
    // }

    // formants
    // let formants: BiquadFilterNode[];
    // if (settings.formants.on) {
    //   formants = createFormants(ctx, formantSpec.value);
    //   for (const formant of formants) {
    //     sourceGain.connect(formant);
    //     formant.connect(tubeGain);
    //   }
    // }

    // final leg: compression -> output
    // if (settings.compression.on) {
    //   tubeGain.connect(compressor.value);
    //   compressor.value.connect(output.value);
    // } else {
    //   tubeGain.connect(output.value);
    // }
    // tubeGain.connect(output.value);

    sourceGain.connect(output.value); // XXX
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
    // for (const [osc] of harmonics) osc.start(t);

    sourceGain.gain.linearRampToValueAtTime(velocity * settings.f0.keyGain, t + settings.f0.onsetTime);
    // if (vibratoOsc && vibratoGain) {
    //   vibratoOsc.start(t);
    //   vibratoGain.gain.linearRampToValueAtTime(settings.vibrato.extent, t + settings.vibrato.onsetTime);
    // }

    // store stop function
    playing[frequency] = (stopAnalysis = false) => {
      const t = ctx.currentTime + .05;
      sourceGain.gain.setTargetAtTime(0, t, settings.f0.decayTime);
      if (mustControlSource) source.stop(t + settings.f0.decayTime + 1);
      // harmonics.forEach(([osc]) => { osc.stop(t); osc = undefined as any; });
      // vibratoOsc?.stop(t);
      if (stopAnalysis && rafId.value) {
        cancelAnimationFrame(rafId.value);
        rafId.value = undefined;
      }
      // source = sourceGain = harmonics = vibratoOsc = tubeGain = undefined as any;
    };

    metrics.latency = ctx.currentTime - startTime;
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
      metrics.rms = 20.0 * Math.log10(rms([...metrics.freqData], 1.0)); // ??
    } else {
      analyzer.value.getByteTimeDomainData(metrics.timeData as Uint8Array);
      analyzer.value.getByteFrequencyData(metrics.freqData as Uint8Array);
      metrics.rms = 20.0 * Math.log10(rms([...metrics.freqData], 256.0));
    }

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
    volume,
    vowel,
  };
});
