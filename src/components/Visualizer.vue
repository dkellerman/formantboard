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
};

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

  const binCount = analyzer.value.frequencyBinCount;
  const bins: FFTBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const fwidth = props.input.context.sampleRate / binCount;
    const f1 = fwidth * i;
    const f2 = f1 + fwidth;
    const x1 = freq2px(f1, canvas.value.clientWidth);
    const x2 = freq2px(f2, canvas.value.clientWidth)
    bins.push({ freq1: f1, freq2: f2, x1, x2, bufferIndex: i });

    if (f2 < FREQUENCIES[0] || f1 > FREQUENCIES[FREQUENCIES.length - 1] || (x2 - x1 < 30))
      continue;

    const text = new PIXI.Text(`${f1.toFixed(0)}-${f2.toFixed(0)}`, { fill: 0xffffff, fontSize: 10 });
    text.x = x1 + 5;
    text.y = 5;
    app.value.stage.addChild(text);
  }

  console.log('fft bins', bins);
  fftBins.value = bins;
}

function render() {
  if (!graphics.value || !canvas.value || !analyzer.value || !dataArray.value || !fftBins.value)
    return;

  const g = graphics.value;
  analyzer.value.getByteFrequencyData(dataArray.value);

  g.clear();
  g.lineStyle(2, 0xffffff);
  if (dataArray.value.every(v => v === 0)) return;

  for (const bin of fftBins.value) {
    const pct = dataArray.value[bin.bufferIndex] / 256.0;
    const h = (canvas.value.clientHeight - 1) * pct;
    const y = canvas.value.clientHeight - h;
    g.moveTo(bin.x1, canvas.value.clientHeight);
    g.lineTo(bin.x1, y);
    g.lineTo(bin.x2, y);
    g.lineTo(bin.x2, canvas.value.clientHeight);
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
