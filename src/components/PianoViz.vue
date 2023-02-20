<script setup lang="ts">
import { ref, inject } from 'vue';

const canvas = ref<HTMLCanvasElement>();
const pianoFullWidth = inject('pianoFullWidth');
</script>

<template>
  <section class="visualizer">
    <canvas
      id="canvas"
      ref="canvas"
    />
  </section>
</template>

<style scoped lang="scss">
#canvas {
  width: calc(1px * v-bind(pianoFullWidth));
  height: 80px;
  background: #010101;
  margin: 0;
  padding: 0;
  margin-bottom: -10px;
  display: none;
}
</style>
