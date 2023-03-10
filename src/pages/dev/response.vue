<script setup lang="ts">
import * as PIXI from 'pixi.js';

const ctx = new AudioContext();
const canvas = ref();
const g = new PIXI.Graphics();
const freqs = new Float32Array(ctx.sampleRate / 2).fill(0).map((_, i) => i);
const mag = new Float32Array(freqs.length);
const filtersOn = ref([true, true, true]);
const filterVals = ref<BiquadFilterOptions[]>([
  { type: "peaking", frequency: 800, Q: 1, gain: 6 },
  { type: "peaking", frequency: 1200, Q: 1, gain: 6 },
  { type: "peaking", frequency: 2500, Q: 1, gain: 6 },
]);

function init() {
  const app = new PIXI.Application({
    view: canvas.value,
    width: 500,
    height: 100,
    background: 0x000000,
    antialias: true,
  });
  app.stage.addChild(g);
  draw();
}

function draw() {
  if (!g) return;

  for (let i = 0; i < mag.length; i++) mag[i] = 0;

  for (let i = 0; i < filterVals.value.length; i++) {
    if (!filtersOn.value[i]) continue;

    const vals = filterVals.value[i];
    const filter = new BiquadFilterNode(ctx, vals);
    const newMag = new Float32Array(mag.length);
    filter.getFrequencyResponse(freqs, newMag, new Float32Array(mag.length));
    for (let j = 0; j < newMag.length; j++)
      mag[j] = Math.max(mag[j], newMag[j]);
  }

  g.clear();
  g.lineStyle(2, 0xffffff);

  const { width, height } = canvas.value;
  for (let x = 0; x < width; x++) {
    const i = Math.floor(x / width * freqs.length);
    const [f, m] = [freqs[i], mag[i]];
    const db = 20 * Math.log10(m);
    const pct = db / 20.0; // (maxDecibels - minDecibels);
    const y = height - (pct * height);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y)
  }
}

onMounted(() => init());
</script>

<template>
  <section>
    <h2>Frequency Response</h2>
    <canvas ref="canvas"></canvas>
    <fieldset v-for="f, idx in filterVals">
      <label>
        <input type="checkbox" v-model="filtersOn[idx]" @change="draw" />
        F{{idx+1}}
      </label>
      <v-num @change="draw" label="Frequency" v-model="filterVals[idx].frequency" min="20" max="20000" step="10" />
      <v-num @change="draw" label="Q" v-model="filterVals[idx].Q" min="0.0001" max="1000" step="0.0001" />
      <v-num @change="draw" label="Gain" v-model="filterVals[idx].gain" min="-40" max="40" step="0.1" />
    </fieldset>
  </section>
</template>

<style scoped lang="scss">
  section {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 70vh;
    flex-direction: column;
  }
  canvas {
    margin: 40px;
  }
  fieldset {
    display: flex;
    flex-direction: row;
    border: 0;
    gap: 10px;
    .v-text-field {
      width: 85px;
    }
  }
</style>
