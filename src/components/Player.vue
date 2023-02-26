<script setup lang="ts">
const playing: Ref<Record<number, [OscillatorNode, GainNode]>> = ref({});
const harmonics = ref<[number, number][]>([]);

const { audioContext, settings } = storeToRefs(useSettings());

function play(frequency: number, velocity = 1) {
  const ctx = audioContext.value;
  const osc = new OscillatorNode(ctx, { frequency });
  const gain = new GainNode(ctx, { gain: 0 });
  harmonics.value = getHarmonics(frequency, settings.value.maxHarmonics).map(h => [h, 1]);

  const t = ctx.currentTime + .001;
  osc.connect(gain);
  gain.connect(ctx.destination);
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
