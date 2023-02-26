<script setup lang="ts">
import * as PIXI from 'pixi.js';

interface Props {
  node: AudioNode;
}

const canvas = ref<HTMLCanvasElement>();
const pianoFullWidth = inject('pianoFullWidth');
const app = ref<PIXI.Application>();
const graphics = ref<PIXI.Graphics>();
const analyzer = ref<AnalyserNode>();
const dataArray = ref<Uint8Array>();
const props = defineProps<Props>();

function initPixi() {
  app.value = new PIXI.Application({
    view: canvas.value,
    width: canvas.value?.scrollWidth,
    height: canvas.value?.scrollHeight,
    background: 'white',
    antialias: true,
  });
  graphics.value = new PIXI.Graphics();
  app.value.stage.addChild(graphics.value);
}

function initAnalyzer() {
  if (!app.value) return;

  const a = props.node.context.createAnalyser();
  a.fftSize = 2048;
  props.node.connect(a);
  const arr = new Uint8Array(a.frequencyBinCount);
  analyzer.value = a;
  dataArray.value = arr;

  app.value.ticker.add(render);
}

function render() {
  if (!graphics.value || !canvas.value || !analyzer.value || !dataArray.value) return;

  const bufferLength = dataArray.value.length;
  analyzer.value.getByteFrequencyData(dataArray.value);

  const g = graphics.value;
  g.clear();
  g.lineStyle(1, 0xcccccc);

  const sliceWidth = canvas.value.scrollWidth / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray.value[i] / 128.0;
    const y = v * canvas.value.clientHeight;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    x += sliceWidth;
  }
}

watch(() => props.node, () => {
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
  margin: 0;
  padding: 0;
  margin-bottom: -10px;
  border: 1px dotted #999;
}
</style>
