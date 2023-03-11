<script setup lang="ts">
import * as PIXI from "pixi.js";

const ctx = new AudioContext();
const frequency = 220.0;
const delay = .05;
const onset = .2;
const offset = .1;
const keyGain = 0.25;

const canvas = ref();
const sawGain = ref(0);
const sqGain = ref(0);
const sinGain = ref(0);
const noiseGain = ref(0);
const tiltVal = ref(0);
const toneVal = ref(.5);
const power = ref(0.0);
const started = ref(false);

let saw: OscillatorNode;
const sawg: GainNode = new GainNode(ctx, { gain: sawGain.value });
let sq: OscillatorNode;
const sqg: GainNode = new GainNode(ctx, { gain: sqGain.value });
let sin: OscillatorNode;
const sing: GainNode = new GainNode(ctx, { gain: sinGain.value });
let noise: AudioBufferSourceNode;
const noiseg: GainNode = new GainNode(ctx, { gain: noiseGain.value });
const tilt: BiquadFilterNode = new BiquadFilterNode(ctx, { type: "lowpass", frequency, Q: tiltVal.value });
const mix: GainNode = new GainNode(ctx, { gain: 0 });
const analyzer = new AnalyserNode(ctx, { fftSize: 4096 });
let af: number = 0;
let g: PIXI.Graphics = new PIXI.Graphics();
let gw = 440, gh = 120;

sawg.connect(mix);
sqg.connect(mix);
sing.connect(mix);
noiseg.connect(mix);
tilt.connect(mix);
mix.connect(analyzer);
mix.connect(ctx.destination);

function adjustTone(val: number) {
  sawGain.value = sawg.gain.value = round(.7 + (val * .2), 2);
  sqGain.value = sqg.gain.value = round(val * .15, 2);
  sinGain.value = sing.gain.value = round((1 - val) * .2, 2);
  noiseGain.value = noiseg.gain.value = round(val * .005, 2);
  tiltVal.value = tilt.Q.value = round((val * 9.9) + .1, 2);
}

function analyze() {
  const data = new Float32Array(analyzer.frequencyBinCount);
  analyzer.getFloatTimeDomainData(data);

  const dataArr = [...data];
  power.value = rms(dataArr);

  g.clear();
  g.lineStyle(1, 0xffffff, 1);
  for (let i = 0; i < dataArr.length; i++) {
    const x = (i / dataArr.length) * gw;
    const y = (dataArr[i] + 1) * (gh / 2);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }

  af = requestAnimationFrame(analyze);
}

onMounted(() => {
  const app = new PIXI.Application({
    view: canvas.value,
    width: gw,
    height: gh,
    backgroundColor: 0x000000,
    antialias: true,
  });
  app.stage.addChild(g);

  watch(toneVal, adjustTone);
  adjustTone(toneVal.value);
});

onUnmounted(() => {
  ctx.close();
});

function toggle() {
  if (!started.value) {
    // construct
    saw = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    saw.connect(sawg);
    sq = new OscillatorNode(ctx, { type: "square", frequency });
    sq.connect(sqg);
    sin = new OscillatorNode(ctx, { type: "sine", frequency });
    sin.connect(sing);
    noise = createWhiteNoise(ctx);
    noise.connect(noiseg);

    // start
    const t = ctx.currentTime + delay;
    saw.start(t);
    sq.start(t);
    sin.start(t);
    noise.start(t);
    mix.gain.value = 0;
    mix.gain.exponentialRampToValueAtTime(keyGain, t + onset);
    af = requestAnimationFrame(analyze);
    started.value = true;
  }
  else {
    cancelAnimationFrame(af);
    const st = ctx.currentTime + 1;
    saw.stop(st);
    sin.stop(st);
    sq.stop(st);
    noise.stop(st);
    mix.gain.setTargetAtTime(0, ctx.currentTime + delay, offset);
    started.value = false;
  }
}
</script>

<template>
  <section>
    <h2>Tone</h2>
    <fieldset>
      <Knob label="" v-model="toneVal" />
    </fieldset>
    <fieldset>
      <canvas ref="canvas" />
    </fieldset>
    <fieldset>
      <Knob label="Saw" v-model="sawGain" @change="sawg.gain.value = $event" />
      <Knob label="Sine" v-model="sinGain" @change="sing.gain.value = $event" />
      <Knob label="Square" v-model="sqGain" @change="sqg.gain.value = $event" />
      <Knob label="Noise" v-model="noiseGain" @change="noiseg.gain.value = $event" :step=".01" />
      <Knob label="Tilt" v-model="tiltVal" @change="tilt.Q.value = $event" :min="0" :max="10" :step="1" />
    </fieldset>
    <fieldset>
      <label>
        Power:
        {{ power.toFixed(2) }}
        / {{ gain2db(power).toFixed(2) }}dB
      </label>
    </fieldset>
    <v-btn @click="toggle">
      {{ started ? 'Stop' : 'Start' }}
    </v-btn>
  </section>
</template>

<style lang="scss" scoped>
  section {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 20px;
  }
  fieldset {
    border: 0;
    padding: 0 0 0 0;
    display: flex;
    flex-direction: row;
    gap: 20px;
  }
</style>
