import { createWhiteNoiseNode } from '../nodes';
import { useApp } from './useApp';

export const usePlayer = defineStore('player', () => {
  const { audioContext, settings, volume } = storeToRefs(useApp());
  const playing: Ref<Record<number, [AudioScheduledSourceNode, GainNode]>> = ref({});
  const harmonics = ref<[number, number][]>([]);
  const compressor = ref(new DynamicsCompressorNode(audioContext.value));
  const master = ref(new GainNode(audioContext.value, { gain: volume.value / 100 }));

  function play(frequency: number, velocity = 1.0) {
    const ctx = audioContext.value;
    const noise = createWhiteNoiseNode(audioContext.value);
    const noiseGain = new GainNode(ctx, { gain: 0 });
    const flutterGain = new GainNode(ctx, { gain: 0 });
    const osc = new OscillatorNode(ctx, { frequency });
    const oscGain = new GainNode(ctx, { gain: 0 });
    harmonics.value = getHarmonics(frequency, settings.value.maxHarmonics).map(h => [h, 1]);

    if (settings.value.flutter.on) {
      noise.connect(flutterGain);
      flutterGain.connect(osc.frequency);
      flutterGain.gain.value = settings.value.flutter.amount;
    }

    const sourceType = settings.value.sourceType;
    let source: AudioScheduledSourceNode, sourceGain: GainNode;
    if (sourceType === 'noise') {
      [source, sourceGain] = [noise, noiseGain];
    } else { // osc
      [source, sourceGain] = [osc, oscGain];
      osc.type = sourceType as OscillatorType;
    }
    source.connect(sourceGain);

    if (settings.value.compress) {
      sourceGain.connect(compressor.value);
      compressor.value.connect(master.value);
    } else {
      sourceGain.connect(master.value);
    }

    master.value.connect(ctx.destination);

    const t = ctx.currentTime + .001;
    if (noise !== source) noise.start(t);
    source.start(t);
    sourceGain.gain.linearRampToValueAtTime(velocity * settings.value.keyGain, t + settings.value.onsetTime);
    playing.value[frequency] = [source, sourceGain];
  }

  function stop(frequency: number) {
    const ctx = audioContext.value;
    const [source, sourceGain] = playing.value[frequency] ?? [];
    if (!source) return;
    const t = ctx.currentTime + .001;
    sourceGain.gain.setTargetAtTime(0, t, settings.value.decayTime);
    source.stop(t + settings.value.decayTime + 2);
    delete playing.value[frequency];
  }

  return {
    play,
    stop,
    harmonics,
    master,
  };
});
