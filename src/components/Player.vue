<script setup lang="ts">
import { useApp } from '../stores/useApp';

const playing: Ref<Record<number, [OscillatorNode, GainNode]>> = ref({});
const harmonics = ref<[number, number][]>([]);
const { audioContext, settings, volume } = storeToRefs(useApp());
const compressor = computed<DynamicsCompressorNode>(() => new DynamicsCompressorNode(audioContext.value));
const master = computed<GainNode>(() => new GainNode(audioContext.value, { gain: volume.value / 100 }));

function play(frequency: number, velocity = 1) {
  const ctx = audioContext.value;
  const osc = new OscillatorNode(ctx, { frequency });
  const gain = new GainNode(ctx, { gain: 0 });
  harmonics.value = getHarmonics(frequency, settings.value.maxHarmonics).map(h => [h, 1]);

  osc.connect(gain);
  gain.connect(compressor.value);
  compressor.value.connect(master.value);
  master.value.connect(ctx.destination);

  const t = ctx.currentTime + .001;
  osc.start(t);
  gain.gain.linearRampToValueAtTime(velocity, t + settings.value.onsetTime);
  playing.value[frequency] = [osc, gain];
}

function stop(frequency: number) {
  const ctx = audioContext.value;
  const [osc, gain] = playing.value[frequency] ?? [];
  if (!osc) return;
  const t = ctx.currentTime + .001;
  gain.gain.setTargetAtTime(0, t, settings.value.decayTime);
  osc.stop(t + settings.value.decayTime);
  delete playing.value[frequency];
}

defineExpose({
  play,
  stop,
  harmonics,
});
</script>

<template>
  <section />
</template>

<style scoped lang="scss">
</style>
