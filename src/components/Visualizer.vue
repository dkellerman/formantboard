<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { freq2px } from '../utils';

interface Props {
  input: AudioNode;
  width: number;
}

interface FFTBin {
  bufferIndex: number;
  freq1: number;
  freq2: number;
  x1: number;
  x2: number;
}

const { settings, vizType } = storeToRefs(useApp());

const canvas = ref<HTMLCanvasElement>();
const app = ref<PIXI.Application>();
const graphics = ref<PIXI.Graphics>();
const overlay = ref<PIXI.Graphics>();
const analyzer = ref<AnalyserNode>();
const dataArray = ref<Float32Array|Uint8Array>();
const fftBins = ref<FFTBin[]>();
const width = computed(() => props.width);

const props = withDefaults(defineProps<Props>(), {});

function initPixi() {
  app.value = new PIXI.Application({
    view: canvas.value,
    width: canvas.value?.scrollWidth,
    height: canvas.value?.scrollHeight,
    background: '#010101',
    antialias: true,
  });
  graphics.value = new PIXI.Graphics();
  app.value.stage.addChild(graphics.value);
}

function initAnalyzer() {
  if (!app.value || !props.input || !canvas.value) return;

  const a = props.input.context.createAnalyser();
  props.input.connect(a);

  analyzer.value = a;
  const DataArrType = settings.value.viz.useFloatData ? Float32Array : Uint8Array;
  dataArray.value = new DataArrType(a.frequencyBinCount);

  let renderFn;
  if (vizType.value === 'power') {
    a.fftSize = settings.value.viz.fftSize;
    a.smoothingTimeConstant = settings.value.viz.fftSmoothing;
    makeBins();
    renderFn = renderFrequency;
  } else {
    renderFn = renderTime;
  }

  app.value.ticker.add(renderFn);
}

function makeBins() {
  if (!canvas.value || !app.value || !analyzer.value || !graphics.value) return;

  const g = graphics.value;
  g.clear();

  const gLabels = new PIXI.Graphics();
  gLabels.lineStyle(1, 0x444444);

  const binCount = analyzer.value.frequencyBinCount;
  const bins: FFTBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const fwidth = props.input.context.sampleRate / binCount;
    const freq1 = Math.max(fwidth * i, FREQUENCIES[0]);
    const freq2 = Math.min(freq1 + fwidth, FREQUENCIES[FREQUENCIES.length - 1]);
    const x1 = freq2px(freq1, canvas.value.clientWidth);
    const x2 = freq2px(freq2, canvas.value.clientWidth)
    bins.push({ freq1, freq2, x1, x2, bufferIndex: i });

    if (freq2 < FREQUENCIES[0] || freq1 > FREQUENCIES[FREQUENCIES.length - 1])
      continue;

    const w = x2 - x1;
    if (w > 5) {
      gLabels.moveTo(x1, 0);
      gLabels.lineTo(x1, canvas.value.clientHeight);
    }

    if (w > 18 || (i % 30 === 0)) {
      const label = `${freq1.toFixed(0)}${w > 40 ? ' hz' : ''}`
      const text = new PIXI.Text(label, { fill: 0xffffff, fontSize: 10 });
      text.x = x1 + 3;
      text.y = 5;
      gLabels.addChild(text);
    }
  }

  app.value.stage.addChild(gLabels);
  fftBins.value = bins;
  overlay.value = gLabels;
}

function renderFrequency() {
  if (!graphics.value || !canvas.value || !analyzer.value || !dataArray.value || !fftBins.value)
    return;

  const g = graphics.value;
  const useFloatData = settings.value.viz.useFloatData;

  if (useFloatData)
    analyzer.value.getFloatFrequencyData(dataArray.value as Float32Array);
  else
    analyzer.value.getByteFrequencyData(dataArray.value as Uint8Array);

  g.clear();
  if (dataArray.value.every(v => v === -Infinity)) return;
  g.lineStyle(2, 0xffffff);

  for (const bin of fftBins.value) {
    const db = dataArray.value[bin.bufferIndex];
    const { maxDecibels, minDecibels } = analyzer.value;
    const pct = useFloatData
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
    if (bin.bufferIndex === 0) g.moveTo(bin.x1, canvas.value.clientHeight);
    g.lineTo(bin.x2, y);
  }
}

function renderTime() {
  if (!graphics.value || !canvas.value || !analyzer.value || !dataArray.value)
    return;

  const g = graphics.value;
  const useFloatData = settings.value.viz.useFloatData;

  if (useFloatData)
    analyzer.value.getFloatTimeDomainData(dataArray.value as Float32Array);
  else
    analyzer.value.getByteTimeDomainData(dataArray.value as Uint8Array);

  g.clear();
  if (dataArray.value.every(v => v === 128)) return;
  g.lineStyle(2, 0xffffff);

  // console.log(dataArray.value);

  const bufferLength = dataArray.value.length;
  const sliceWidth = (canvas.value.clientWidth * 1.0) / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const val = dataArray.value[i] / 128.0;
    const y = val * canvas.value.clientHeight / 2;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    x += sliceWidth;
  }
  g.lineTo(canvas.value.clientWidth, canvas.value.clientHeight / 2);
}

function cleanup() {
  graphics.value?.clear();
  overlay.value?.clear();
  overlay.value?.removeChildren();
  app.value?.ticker.remove(renderFrequency);
  app.value?.ticker.remove(renderTime);
}

watch(() => [props.input, vizType.value], () => {
  cleanup();
  initAnalyzer();
});

onMounted(() => {
  initPixi();
  initAnalyzer();
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
    height: 140px;
    margin: 0;
    margin-bottom: 10px;
    padding: 0;
    border: 1px dotted #999;
  }
}
</style>
