<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { VisType } from '../stores/useVisType';
import type { Metrics } from '../stores/useMetrics';

interface Props {
  width?: number;
  height?: number;
  vtype?: VisType;
  combined?: boolean;
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
  combined: false,
});

const player = usePlayer();
const metrics = useMetrics();
const { vowelSpec } = storeToRefs(useVowel());
const { settings } = storeToRefs(useSettings());
const id = computed(() => `viz-${props.vtype}`);
const app = ref<PIXI.Application>();
const gWave = ref<PIXI.Graphics>();
const gPower = ref<PIXI.Graphics>();
const overlay = ref<PIXI.Graphics>();
const canvas = ref<HTMLCanvasElement>();
const winSize = useWindowSize();
const width = computed(() => props.width ?? winSize.width.value * .95);
const height = computed(() => props.height ?? 140);
const viz = settings.value.viz;

function init() {
  clear();
  app.value = new PIXI.Application({
    view: canvas.value,
    width: canvas.value?.clientWidth,
    height: canvas.value?.clientHeight,
    background: str2hexColor(viz.background),
    antialias: viz.antialias,
  });
  gWave.value = new PIXI.Graphics();
  gPower.value = new PIXI.Graphics();
  overlay.value = new PIXI.Graphics();
  app.value.stage.addChild(overlay.value);
  app.value.stage.addChild(gPower.value);
  app.value.stage.addChild(gWave.value);

  if (props.vtype === VisType.POWER) {
    renderOverlay();
  }
}

function clear() {
  gWave.value?.clear();
  gWave.value?.removeChildren();
  gPower.value?.clear();
  gPower.value?.removeChildren();
  overlay.value?.clear();
  overlay.value?.removeChildren();
  app.value?.stage.removeChildren();
  if (player.rafId) cancelAnimationFrame(player.rafId);
  player.rafId = app.value = gWave.value = gPower.value = overlay.value = undefined;
}


watch(() => props.vtype, init);
watch(() => JSON.stringify(vowelSpec.value), renderOverlay);

onMounted(() => {
  init();
  player.addAnalyzerListener(id.value, {
    onFrame: (data, analyzer) => {
      if (!app.value) init();
      if (props.vtype === VisType.POWER) {
        renderPower(data, analyzer);
        if (props.combined) renderWave(data);
      } else if (props.vtype === VisType.WAVE) {
        renderWave(data);
      }
    }
  });
});

onUnmounted(() => {
  player.removeAnalyzerListener(id.value);
});

function makeFreqBins(binCount: number) {
  if (!canvas.value) return [];

  const bins: FFTBin[] = [];
  const fwidth = (metrics.sampleRate / 2) / binCount;

  for (let i = 0; i < binCount; i++) {
    const freq1 = Math.max(fwidth * i, FREQUENCIES[0]);
    const freq2 = Math.min(freq1 + fwidth, FREQUENCIES[FREQUENCIES.length - 1]);
    const x1 = freq2px(freq1, width.value);
    const x2 = freq2px(freq2, width.value)
    bins.push({ freq1, freq2, x1, x2, bufferIndex: i });
  }

  return bins;
}

function renderOverlay() {
  if (!overlay.value || !canvas.value) return;
  overlay.value.clear();

  const bins = makeFreqBins(settings.value.analyzer.fftSize / 2);
  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (bin.freq2 < FREQUENCIES[0] || bin.freq1 > FREQUENCIES[FREQUENCIES.length - 1])
      continue;

    // bin lines
    overlay.value.lineStyle(1, 0x444444);
    if (bin.freq1 < 650) {
      overlay.value.moveTo(bin.x1, 0);
      overlay.value.lineTo(bin.x1, canvas.value.clientHeight);
    }

    // labels:
    // if (i < 15 || i % 50 === 0) {
    //   const w = bin.x2 - bin.x1;
    //   const label = `${bin.freq1.toFixed(0)}${w > 40 ? ' hz' : ''}`
    //   const text = new PIXI.Text(label, { fill: str2hexColor(viz.color), fontSize: 10 });
    //   text.x = bin.x1 + 3;
    //   text.y = 5;
    //   overlay.value.addChild(text);
  }

  // formants
  overlay.value.lineStyle(2, 0x000000);
  for (const formant of vowelSpec.value) {
    const [fx1, fx2] = formantPxRange(formant, width.value);
    const clr = formant.on ? 'forestgreen' : '#664444';
    fillRect(overlay.value, fx1, 0, fx2 - fx1, height.value, clr, 0.4, 'black', 1);
  }
}

function renderPower(data: Metrics, analyzer: AnalyserNode) {
  if (!canvas.value || !gPower.value) return;

  const dataArray = data.freqData;
  if (dataArray.every(v => v === -Infinity)) return;

  const bins = makeFreqBins(data.freqData.length);
  const { maxDecibels, minDecibels } = analyzer;

  gPower.value.clear();
  for (const bin of bins) {
    const db = dataArray[bin.bufferIndex];
    const pct = dataArray instanceof Float32Array
      ? (db - minDecibels) / (maxDecibels - minDecibels)
      : db / 256.0;
    const h = (canvas.value.clientHeight - 1) * pct;
    const y = canvas.value.clientHeight - h + 5;
    fillRect(gPower.value, bin.x1, y, bin.x2 - bin.x1, h, hsl(viz.hue, 100, (pct * 100) / 2));
  }
}

function renderWave(data: Metrics) {
  if (!canvas.value || !gWave.value) return;

  const dataArray = data.timeData;
  if (dataArray.every(v => v === 128)) return;

  gWave.value.clear();
  gWave.value.lineStyle(viz.lineWidth, str2hexColor(viz.color));

  const bufferLength = dataArray.length;
  const sliceWidth = width.value / bufferLength;

  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const val = dataArray[i] / 128.0;
    const y = val * (height.value / 2);
    if (i === 0) gWave.value.moveTo(x, y); else gWave.value.lineTo(x, y);
    x += sliceWidth;
  }
  gWave.value.lineTo(width.value, height.value / 2);
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
