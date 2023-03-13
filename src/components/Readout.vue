<script setup lang="ts">
const metrics = useMetrics();
</script>

<template>
  <section>
    <fieldset v-if="metrics.pitch">
      {{ metrics.pitch.freq.toFixed(1) }}hz
      [{{ metrics.pitch.note }}]
      <span v-if="metrics.pitch.cents">
        {{ metrics.pitch.cents > 0 ? '+' : '' }}{{ metrics.pitch.cents.toFixed(0) }}c
      </span>
    </fieldset>
    <!-- <fieldset v-if="metrics.tilt?.equation[1]">
      Tilt:
      {{ metrics.tilt.equation[1] > 0 ? '+' : '' }}{{ metrics.tilt.equation[1]?.toFixed(1) }}
    </fieldset> -->
  </section>
</template>

<style scoped lang="scss">
fieldset {
  font-family: monospace;
  border: 0;
  width: fit-content;
}
</style>
