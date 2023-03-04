<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { VisType } from '../stores/useVisType';
import type { Metrics } from '../stores/useMetrics';

interface Props {
  width: number;
  height: number;
  vtype?: VisType;
}

interface FFTBin {
  bufferIndex: number;
  freq1: number;
  freq2: number;
  x1: number;
  x2: number;
}

const player = usePlayer();
const { settings } = storeToRefs(useSettings());
const canvas = ref<HTMLCanvasElement>();

const props = withDefaults(defineProps<Props>(), {
  width: useWindowSize().width.value * .9,
  height: 140,
  vtype: settings.value.defaultVisType,
});

const id = computed(() => `viz-${props.vtype}-${Date.now()}`);
const app = computed<PIXI.Application>(() => {
  return new PIXI.Application({
    view: canvas.value,
    width: canvas.value?.scrollWidth,
    height: canvas.value?.scrollHeight,
    background: '#010101',
    antialias: true,
  });
});

const g = computed<PIXI.Graphics>(() => {
  const pg = new PIXI.Graphics();
  app.value.stage.addChild(pg);
  return pg;
});

const overlay = computed<PIXI.Graphics>(() => {
  const g = new PIXI.Graphics();
  app.value.stage.addChild(g);
  return g;
});


onMounted(() => {
  player.addAnalyzerListener(id.value, {
    onFrame: (data, analyzer) => {
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
    const x1 = freq2px(freq1, canvas.value.clientWidth);
    const x2 = freq2px(freq2, canvas.value.clientWidth)
    bins.push({ freq1, freq2, x1, x2, bufferIndex: i });
  }

  return bins;
}

function renderFreqLabels(bins: FFTBin[]) {
  if (!canvas.value) return;

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
  if (!canvas.value) return;

  const dataArray = data.freqData;
  if (dataArray.every(v => v === -Infinity)) return;

  const bins = makeFreqBins(data.freqData);
  renderFreqLabels(bins); // TODO: check if it's changed

  g.value.clear();
  g.value.lineStyle(2, 0xffffff);

  for (const bin of bins) {
    const db = dataArray[bin.bufferIndex];
    const { maxDecibels, minDecibels } = analyzer;
    const pct = dataArray instanceof Float32Array
      ? (db - minDecibels) / (maxDecibels - minDecibels)
      : db / 256.0;
    const h = (canvas.value.clientHeight - 1) * pct;
    const y = canvas.value.clientHeight - h + 5;
    // rectangles:
    //  g.moveTo(bin.x1, canvas.value.clientHeight);
    //  g.lineTo(bin.x1, y);
    //  g.lineTo(bin.x2, y);
    //  g.lineTo(bin.x2, canvas.value.clientHeight);
    // line:
    if (bin.bufferIndex === 0) g.value.moveTo(bin.x1, canvas.value.clientHeight);
    g.value.lineTo(bin.x2, y);
  }
}

function renderWave(data: Metrics) {
  if (!canvas.value) return;

  const dataArray = data.freqData;
  if (dataArray.every(v => v === 128)) return;

  g.value.clear();
  g.value.lineStyle(2, 0xffffff);

  const bufferLength = dataArray.length;
  const sliceWidth = (canvas.value.clientWidth * 1.0) / bufferLength;

  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const val = dataArray[i] / 128.0;
    const y = val * canvas.value.clientHeight / 2;
    if (i === 0) g.value.moveTo(x, y); else g.value.lineTo(x, y);
    x += sliceWidth;
  }
  g.value.lineTo(canvas.value.clientWidth, canvas.value.clientHeight / 2);
}

function clear() {
  g.value?.clear();
  overlay.value?.clear();
  overlay.value?.removeChildren();
  if (player.rafId) cancelAnimationFrame(player.rafId);
}

onUnmounted(() => {
  clear();
});
</script>

<template>
  <section class="visualizer">
    <canvas ref="canvas" />
  </section>
</template>

<style scoped lang="scss">
.visualizer {
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
