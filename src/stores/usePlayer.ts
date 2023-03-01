import { createHarmonics, createWhiteNoiseNode } from '../nodes';
import { useApp } from './useApp';

export const usePlayer = defineStore('player', () => {
  const { audioContext, settings, volume } = storeToRefs(useApp());
  const playing: Ref<Record<number, [AudioScheduledSourceNode, GainNode]>> = ref({});
  const harmonics = ref<[number, number][]>([]);
  const master = ref(new GainNode(audioContext.value, { gain: volume.value / 100 }));

  function play(frequency: number, velocity = 1.0) {
    const ctx = audioContext.value;
    const { vibrato, flutter, harmonics: hmcfg, f0, compression } = settings.value;

    // create basic source nodes
    const osc = new OscillatorNode(ctx, { frequency, type: f0.sourceType as OscillatorType });
    const oscGain = new GainNode(ctx, { gain: 0 });
    const noise = createWhiteNoiseNode(ctx);
    const noiseGain = new GainNode(ctx, { gain: 0 });

    // set the audio source
    let source: AudioScheduledSourceNode;
    let sourceGain: GainNode;
    if (f0.sourceType === 'noise') [source, sourceGain] = [noise, noiseGain];
    else [source, sourceGain] = [osc, oscGain];
    source.connect(sourceGain);
    const isTonalSource = 'frequency' in source;

    // create harmonics (osc source only) -> oscillators feed into source node
    let hmNodes: [OscillatorNode, GainNode][];
    if (hmcfg.on && isTonalSource) {
      hmNodes = createHarmonics(ctx, frequency, hmcfg.max, hmcfg.maxFreq, hmcfg.tilt);
      hmNodes.forEach(([osc]) => osc.connect(sourceGain));
      harmonics.value = hmNodes.map(([osc, gain]) => [osc.frequency.value, gain.gain.value]);
    } else {
      hmNodes = [];
      harmonics.value = [];
    }

    // apply effects to source
    let flutterGain, vibratoOsc, vibratoGain;
    if (flutter.on && isTonalSource) {
      flutterGain = new GainNode(ctx, { gain: flutter.amount });
      noise.connect(flutterGain);
      flutterGain.connect((source as OscillatorNode).frequency);
    }
    if (vibrato.on && isTonalSource) {
      vibratoOsc = new OscillatorNode(ctx, { frequency: vibrato.rate });
      vibratoGain = new GainNode(ctx, { gain: 0 });
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect((source as OscillatorNode).frequency);
    }

    // final leg: compression -> master
    let compressor;
    if (compression.on) {
      compressor = new DynamicsCompressorNode(ctx, compression);
      sourceGain.connect(compressor);
      compressor.connect(master.value);
    } else {
      sourceGain.connect(master.value);
    }

    // master -> destination
    master.value.connect(ctx.destination);

    // start/ramp source nodes
    const t = ctx.currentTime + .001;
    if (noise !== source) noise.start(t);
    source.start(t);
    hmNodes.forEach(([osc]) => osc.start(t));
    sourceGain.gain.linearRampToValueAtTime(velocity * f0.keyGain, t + f0.onsetTime);
    if (vibratoOsc && vibratoGain) {
      vibratoOsc.start(t);
      vibratoGain.gain.linearRampToValueAtTime(vibrato.extent, t + vibrato.onsetTime);
    }

    playing.value[frequency] = [source, sourceGain];
  }

  function stop(frequency: number) {
    const ctx = audioContext.value;
    const { f0 } = settings.value;
    const [source, sourceGain] = playing.value[frequency] ?? [];

    if (!source) return;

    const t = ctx.currentTime + .001;
    sourceGain.gain.setTargetAtTime(0, t, f0.decayTime);
    source.stop(t + f0.decayTime + 2);
    delete playing.value[frequency];
  }

  return {
    play,
    stop,
    harmonics,
    master,
  };
});
