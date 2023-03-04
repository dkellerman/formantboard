<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { VisType } from '../stores/useVisType';
import type { Metrics } from '../stores/useMetrics';

interface Props {
  width?: number;
  height?: number;
  vtype?: VisType;
}

interface FFTBin {
  bufferIndex: number;
  freq1: number;
  freq2: number;
  x1: number;
  x2: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: undefined,
  height: undefined,
  vtype: VisType.POWER,
});

const player = usePlayer();
const { settings } = storeToRefs(useSettings());
const id = computed(() => `viz-${props.vtype}`);
const app = ref<PIXI.Application>();
const g = ref<PIXI.Graphics>();
const overlay = ref<PIXI.Graphics>();
const canvas = ref<HTMLCanvasElement>();
const renderedOverlay = ref(false);
const winSize = useWindowSize();
const width = computed(() => props.width ?? winSize.width.value * .95);
const height = computed(() => props.height ?? 140);

function init() {
  app.value = new PIXI.Application({
    view: canvas.value,
    width: canvas.value?.clientWidth,
    height: canvas.value?.clientHeight,
    background: '#010101',
    antialias: true,
  });
  g.value = new PIXI.Graphics();
  app.value.stage.addChild(g.value);
  overlay.value = new PIXI.Graphics();
  app.value.stage.addChild(overlay.value);
  renderedOverlay.value = false;
}

watch(() => props.vtype, init);

onMounted(() => {
  init();
  player.addAnalyzerListener(id.value, {
    onFrame: (data, analyzer) => {
      if (!app.value) init();
      if (props.vtype === VisType.POWER) {
        renderPower(data, analyzer);
      } else if (props.vtype === VisType.WAVE) {
        renderWave(data);
      }
    }
  });
});

onUnmounted(() => {
  player.removeAnalyzerListener(id.value);
});

function makeFreqBins(data: Float32Array|Uint8Array) {
  if (!canvas.value) return [];

  const binCount = data.length;
  const bins: FFTBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const fwidth = settings.value.audioContextConfig.sampleRate / binCount;
    const freq1 = Math.max(fwidth * i, FREQUENCIES[0]);
    const freq2 = Math.min(freq1 + fwidth, FREQUENCIES[FREQUENCIES.length - 1]);
    const x1 = freq2px(freq1, width.value);
    const x2 = freq2px(freq2, width.value)
    bins.push({ freq1, freq2, x1, x2, bufferIndex: i });
  }

  return bins;
}

function renderFreqLabels(bins: FFTBin[]) {
  if (!canvas.value || !overlay.value) return;

  overlay.value.clear();
  overlay.value.lineStyle(1, 0x444444);

  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (bin.freq2 < FREQUENCIES[0] || bin.freq1 > FREQUENCIES[FREQUENCIES.length - 1])
      continue;

    const w = bin.x2 - bin.x1;
    if (w > 5) {
      overlay.value.moveTo(bin.x1, 0);
      overlay.value.lineTo(bin.x1, canvas.value.clientHeight);
    }

    if (w > 18 || (i % 30 === 0)) {
      const label = `${bin.freq1.toFixed(0)}${w > 40 ? ' hz' : ''}`
      const text = new PIXI.Text(label, { fill: 0xffffff, fontSize: 10 });
      text.x = bin.x1 + 3;
      text.y = 5;
      overlay.value.addChild(text);
    }
  }
}

function renderPower(data: Metrics, analyzer: AnalyserNode) {
  if (!canvas.value || !g.value) return;

  const dataArray = data.freqData;

  // render overlay once
  let bins;
  if (!renderedOverlay.value) {
    bins = makeFreqBins(data.freqData);
    renderFreqLabels(bins);
    renderedOverlay.value = true;
  }
  // otherwise check that we have any values to render
  if (dataArray.every(v => v === -Infinity)) return;
  bins = bins || makeFreqBins(data.freqData);

  g.value.clear();
  g.value.lineStyle(2, 0xffffff);
  const { maxDecibels, minDecibels } = analyzer;

  for (const bin of bins) {
    const db = dataArray[bin.bufferIndex];
    const pct = dataArray instanceof Float32Array
      ? (db - minDecibels) / (maxDecibels - minDecibels)
      : db / 256.0;
    const h = (canvas.value.clientHeight - 1) * pct;
    const y = canvas.value.clientHeight - h + 5;
    // rectangles:
    //  g.value.moveTo(bin.x1, canvas.value.clientHeight);
    //  g.value.lineTo(bin.x1, y);
    //  g.value.lineTo(bin.x2, y);
    //  g.value.lineTo(bin.x2, canvas.value.clientHeight);
    // line:
    if (bin.bufferIndex === 0) g.value.moveTo(bin.x1, canvas.value.clientHeight);
    g.value.lineTo(bin.x2, y);
  }
}

function renderWave(data: Metrics) {
  if (!canvas.value || !g.value) return;

  const dataArray = data.timeData;
  if (dataArray.every(v => v === 128)) return;

  g.value.clear();
  g.value.lineStyle(2, 0xffffff);

  const bufferLength = dataArray.length;
  const sliceWidth = width.value / bufferLength;

  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const val = dataArray[i] / 128.0;
    const y = val * (height.value / 2);
    if (i === 0) g.value.moveTo(x, y); else g.value.lineTo(x, y);
    x += sliceWidth;
  }
  g.value.lineTo(width.value, height.value / 2);
}

function clear() {
  g.value?.clear();
  overlay.value?.clear();
  overlay.value?.removeChildren();
  if (player.rafId) cancelAnimationFrame(player.rafId);
  player.rafId = app.value = g.value = overlay.value = undefined;
}

onUnmounted(() => {
  clear();
});
</script>

<template>
  <section :class="`visualizer vtype-${vtype}`">
    <canvas ref="canvas" />
  </section>
</template>

<style scoped lang="scss">
.visualizer {
  padding: 0;
  margin: 0;
  canvas {
    width: calc(1px * v-bind(width));
    height: calc(1px * v-bind(height));
    margin: 0;
    margin-bottom: 10px;
    padding: 0;
    border: 1px dotted #999;
  }
}
</style>
