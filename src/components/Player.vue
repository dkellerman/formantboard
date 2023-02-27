<script setup lang="ts">
import { useApp } from '../stores/useApp';

const { audioContext, settings, volume } = storeToRefs(useApp());

const playing: Ref<Record<number, [OscillatorNode, GainNode]>> = ref({});
const harmonics = ref<[number, number][]>([]);
const compressor = ref(new DynamicsCompressorNode(audioContext.value));
const master = ref(new GainNode(audioContext.value, { gain: volume.value / 100 }));

function play(frequency: number, velocity = 1) {
  const ctx = audioContext.value;
  const osc = new OscillatorNode(ctx, { frequency });
  const gain = new GainNode(ctx, { gain: 0 });
  harmonics.value = getHarmonics(frequency, settings.value.maxHarmonics).map(h => [h, 1]);
  osc.connect(gain);

  if (settings.value.compress) {
    gain.connect(compressor.value);
    compressor.value.connect(master.value);
  } else {
    gain.connect(master.value);
  }

  master.value.connect(ctx.destination);
  const t = ctx.currentTime + .001;
  osc.start(t);
  gain.gain.linearRampToValueAtTime(velocity * settings.value.keyGain, t + settings.value.onsetTime);
  playing.value[frequency] = [osc, gain];
}

function stop(frequency: number) {
  const ctx = audioContext.value;
  const [osc, gain] = playing.value[frequency] ?? [];
  if (!osc) return;
  const t = ctx.currentTime + .001;
  gain.gain.setTargetAtTime(0, t, settings.value.decayTime);
  osc.stop(t + settings.value.decayTime + 2);
  delete playing.value[frequency];
}

defineExpose<{
  play: (frequency: number, velocity?: number) => void;
  stop: (frequency: number) => void;
  harmonics: Ref<[number, number][]>;
  master: Ref<GainNode>;
}>({ play, stop, harmonics, master });
</script>

<template>
  <section />
</template>

<style scoped lang="scss">
</style>
