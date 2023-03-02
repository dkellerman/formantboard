/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHarmonics, createWhiteNoise, createFormants, createTube } from '../nodes';
import { useApp } from './useApp';

export const usePlayer = defineStore('player', () => {
  const { audioContext, settings, volume, vowel } = storeToRefs(useApp());
  const playing: Ref<Record<number, () => void>> = ref({});
  const harmonics = ref<[number, number][]>([]);
  const noise = ref(createWhiteNoise(audioContext.value));
  const master = ref(new GainNode(audioContext.value, { gain: volume.value / 100 }));
  const compressor = ref(new DynamicsCompressorNode(audioContext.value, settings.value.compression));

  noise.value.start(audioContext.value.currentTime);

  function play(frequency: number, velocity = 1.0) {
    if (frequency > MAX_FREQ || frequency < MIN_FREQ) return; // no one gets hurt

    const ctx = audioContext.value;
    const startTime = ctx.currentTime;
    const { vibrato, flutter, harmonics: hmcfg, f0, compression, formants, tube } = settings.value;

    // create basic source nodes
    const osc = new OscillatorNode(ctx, { frequency, type: f0.sourceType as OscillatorType });
    const oscGain = new GainNode(ctx, { gain: 0 });
    const noiseGain = new GainNode(ctx, { gain: 0 });

    // set the audio source
    let source: AudioScheduledSourceNode;
    let sourceGain: GainNode;
    if (f0.sourceType === 'noise') [source, sourceGain] = [noise.value, noiseGain];
    else [source, sourceGain] = [osc, oscGain];
    source.connect(sourceGain);
    const isTonalSource = 'frequency' in source;
    if (!f0.on && isTonalSource) (source as OscillatorNode).frequency.value = 0;

    // create harmonics (osc source only) -> oscillators feed into source node
    let hmNodes: [OscillatorNode, GainNode][];
    if (hmcfg.on && isTonalSource) {
      hmNodes = createHarmonics(ctx, frequency, hmcfg.max, hmcfg.maxFreq, hmcfg.tilt);
      hmNodes.forEach(([, hGain]) => hGain.connect(sourceGain));
      harmonics.value = hmNodes.map(([osc, gain]) => [osc.frequency.value, gain.gain.value]);
      console.log("*", [...harmonics.value.map(x => [...x])]);
    } else {
      hmNodes = [];
      harmonics.value = [];
    }

    // apply effects to source
    let flutterGain: GainNode|null = null;
    if (flutter.on && isTonalSource) {
      flutterGain = new GainNode(ctx, { gain: flutter.amount });
      noise.value.connect(flutterGain);
      flutterGain.connect((source as OscillatorNode).frequency);
    }

    let vibratoOsc: OscillatorNode|null = null;
    let vibratoGain: GainNode|null = null;
    let vibratoJitter: GainNode|null = null;
    if (vibrato.on && isTonalSource) {
      vibratoOsc = new OscillatorNode(ctx, { frequency: vibrato.rate });
      vibratoGain = new GainNode(ctx, { gain: 0 });
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect((source as OscillatorNode).frequency);
      if (vibrato.jitter) {
        vibratoJitter = new GainNode(ctx, { gain: vibrato.jitter });
        noise.value.connect(vibratoJitter);
        vibratoJitter.connect(vibratoOsc.frequency);
      }
    }

    // create tube and apply formants
    let tubeNode;
    let tubeGain: GainNode = new GainNode(ctx, { gain: 1 });
    if (tube.on) {
      tubeNode = createTube(ctx, frequency);
      sourceGain.connect(tubeNode);
      tubeNode.connect(tubeGain);
    } else {
      sourceGain.connect(tubeGain);
    }

    // formants
    let formantNodes: BiquadFilterNode[];
    if (formants.on) {
      const formantSpec = formants.specs[vowel.value];
      formantNodes = createFormants(ctx, formantSpec);
      for (const fnode of formantNodes) {
        sourceGain.connect(fnode);
        fnode.connect(tubeGain);
      }
    }

    // final leg: compression -> master
    if (compression.on) {
      tubeGain.connect(compressor.value);
      compressor.value.connect(master.value);
    } else {
      tubeGain.connect(master.value);
    }

    // master -> destination
    tubeGain.connect(master.value);
    master.value.connect(ctx.destination);

    // start/ramp source nodes
    const t = ctx.currentTime + .002;
    source.start(t);
    for (const [osc] of hmNodes) osc.start(t);

    sourceGain.gain.linearRampToValueAtTime(velocity * f0.keyGain, t + f0.onsetTime);
    if (vibratoOsc && vibratoGain) {
      vibratoOsc.start(t);
      vibratoGain.gain.linearRampToValueAtTime(vibrato.extent, t + vibrato.onsetTime);
    }

    // store stop function
    playing.value[frequency] = () => {
      const t = ctx.currentTime + .001;
      sourceGain.gain.setTargetAtTime(0, t, f0.decayTime);
      source.stop(t + f0.decayTime + 2);
      hmNodes?.forEach(([osc]) => { osc.stop(t); osc = undefined as any; });
      vibratoOsc?.stop(t);
      source = sourceGain = hmNodes = vibratoOsc = tubeGain = undefined as any;
    };

    console.log("player latency", (ctx.currentTime - startTime) * 1000.0, 'ms');
  }

  function stop(frequency: number) {
    playing.value[frequency]?.(); // stop fn
    delete playing.value[frequency];
  }

  return {
    play,
    stop,
    harmonics,
    master,
  };
});
