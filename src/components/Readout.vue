<script setup lang="ts">
const metrics = useMetrics();
</script>

<template>
  <section class="mt-2">
    <fieldset v-if="metrics.pitch" class="w-fit border-0 font-mono text-sm text-zinc-700">
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
