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

const { settings } = storeToRefs(useSettings());

const canvas = ref<HTMLCanvasElement>();
const app = ref<PIXI.Application>();
const graphics = ref<PIXI.Graphics>();
const analyzer = ref<AnalyserNode>();
const dataArray = ref<Uint8Array>();
const fftBins = ref<FFTBin[]>();

const props = withDefaults(defineProps<Props>(), {});

const width = computed(() => props.width);

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
  a.fftSize = settings.value.fftSize;
  props.input.connect(a);

  analyzer.value = a;
  dataArray.value = new Uint8Array(a.frequencyBinCount);

  makeBins();
  app.value.ticker.add(render);
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
      gLabels.moveTo(x2, 0);
      gLabels.lineTo(x2, canvas.value.clientHeight);
    }

    if (w > 18) {
      const label = `${freq1.toFixed(0)}${w > 40 ? ' hz' : ''}`
      const text = new PIXI.Text(label, { fill: 0xffffff, fontSize: 10 });
      text.x = x1 + (i === 0 ? 5 : -10);
      text.y = 5;
      gLabels.addChild(text);
    }
  }

  console.log('fft bins', bins);
  app.value.stage.addChild(gLabels);
  fftBins.value = bins;
}

function render() {
  if (!graphics.value || !canvas.value || !analyzer.value || !dataArray.value || !fftBins.value)
    return;

  const g = graphics.value;
  analyzer.value.getByteFrequencyData(dataArray.value);

  g.clear();
  // if (dataArray.value.every(v => v === 0)) return;

  for (const bin of fftBins.value) {
    const pct = dataArray.value[bin.bufferIndex] / 256.0;
    const h = (canvas.value.clientHeight - 1) * pct;
    const y = canvas.value.clientHeight - h;
    g.lineStyle(2, 0xffffff);
    // g.moveTo(bin.x1, canvas.value.clientHeight);
    // g.lineTo(bin.x1, y);
    // g.lineTo(bin.x2, y);
    // g.lineTo(bin.x2, canvas.value.clientHeight);
    if (bin.bufferIndex === 0) g.moveTo(bin.x1, canvas.value.clientHeight);
    g.lineTo(bin.x2, y);
  }
}

watch(() => props.input, () => {
  app.value?.ticker.remove(render);
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
    height: 150px;
    margin: 0;
    margin-bottom: 10px;
    padding: 0;
    border: 1px dotted #999;
  }
}
</style>
