<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { VisType } from '../stores/visTypes';
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
const { layout, keyboardWidth } = toRefs(useKeyboardLayout());
const { ipaSpec } = toRefs(useIPA());
const { settings } = toRefs(useSettings());
const id = computed(() => `viz-${props.vtype}`);
const app = ref<PIXI.Application>();
const gWave = ref<PIXI.Graphics>();
const gPower = ref<PIXI.Graphics>();
const overlay = ref<PIXI.Graphics>();
const canvas = ref<HTMLCanvasElement>();
const width = computed(() => props.width ?? keyboardWidth.value);
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
watch(() => JSON.stringify(ipaSpec.value), renderOverlay);

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
  const bins: FFTBin[] = [];
  const fwidth = (metrics.sampleRate / 2) / binCount;

  for (let i = 0; i < binCount; i++) {
    const freq1 = Math.max(fwidth * i, layout.value.bottomFreq);
    const freq2 = Math.min(freq1 + fwidth, layout.value.topFreq);
    const x1 = layout.value.freq2px(freq1, width.value);
    const x2 = layout.value.freq2px(freq2, width.value)
    bins.push({ freq1, freq2, x1, x2, bufferIndex: i });
  }

  return bins;
}

function renderOverlay() {
  if (!overlay.value || !canvas.value) return;
  overlay.value.clear();

  // formants
  for (const formant of ipaSpec.value) {
    const [fx1, fx2] = layout.value.formantPxRange(formant, width.value);
    const clr = formant.on ? viz.formantColorOn : viz.formantColorOff;
    fillRect(overlay.value, fx1, 0, fx2 - fx1, height.value, clr, 0.4, viz.background, 1);
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
    const c = hsl(viz.hue, 100, (pct * 100) / 2);
    fillRect(gPower.value, bin.x1, y, bin.x2 - bin.x1, h, c);
  }

  // harmonics
  for (const [hfreq, hsrcgain, hgain] of metrics.harmonics) {
    const hx = layout.value.freq2px(hfreq, width.value);
    const hy = height.value - (height.value * hgain);
    gPower.value.lineStyle(3, str2hexColor(viz.harmonicColor));
    gPower.value.moveTo(hx, height.value);
    gPower.value.lineTo(hx, hy);

    // src gain:
    gPower.value.lineStyle(1, 0xffffff);
    gPower.value.moveTo(hx - 2, height.value);
    gPower.value.lineTo(hx - 2, height.value - (height.value * hsrcgain));
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
  <section :class="`visualizer vtype-${vtype}`" class="m-0 p-0">
    <canvas
      ref="canvas"
      class="m-0 block w-full border border-zinc-400 p-0"
      :width="width"
      :height="height"
    />
  </section>
</template>
