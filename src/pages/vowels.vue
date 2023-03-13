<script setup lang="ts">
import * as PIXI from "pixi.js";

const ctx = new AudioContext();
const delay = 0.01;
const onset = 0.1;
const offset = 0.05;
const keyGain = 0.05;
const defq = 0.5;
const defg = 20.0;

const f0 = ref();
const canvas = ref();
const sawGain = ref(1.0);
const sqGain = ref(0.2);
const sinGain = ref(0.1);
const noiseGain = ref(0.01);
const power = ref(0);
const vowel = ref("ah");

const formantVals: Record<string, Array<Ref<number>[]>> = {
  ah: [
    [ref(800.0), ref(defq), ref(defg)],
    [ref(1200.0), ref(defq), ref(defg)],
    [ref(2500.0), ref(defq), ref(defg)],
  ],
  ee: [
    [ref(270.0), ref(defq), ref(defg)],
    [ref(2300.0), ref(defq), ref(defg)],
    [ref(3000.0), ref(defq), ref(defg)],
  ],
  oo: [
    [ref(300.0), ref(defq), ref(defg)],
    [ref(870.0), ref(defq), ref(defg)],
    [ref(2250.0), ref(defq), ref(defg)],
  ],
  ih: [
    [ref(400.0), ref(defq), ref(defg)],
    [ref(2000.0), ref(defq), ref(defg)],
    [ref(2550.0), ref(defq), ref(defg)],
  ],
  eh: [
    [ref(530.0), ref(defq), ref(defg)],
    [ref(1850.0), ref(defq), ref(defg)],
    [ref(2500.0), ref(defq), ref(defg)],
  ],
  uh: [
    [ref(640.0), ref(defq), ref(defg)],
    [ref(1200.0), ref(defq), ref(defg)],
    [ref(2400.0), ref(defq), ref(defg)],
  ],
  ae: [
    [ref(660.0), ref(defq), ref(defg)],
    [ref(1700.0), ref(defq), ref(defg)],
    [ref(2400.0), ref(defq), ref(defg)],
  ],
};

const formantsOn = ref(true);
const started = ref(false);

const mix: GainNode = new GainNode(ctx, { gain: 0 });
const sourceMix: GainNode = new GainNode(ctx, { gain: 1 });
const analyzer = new AnalyserNode(ctx, { fftSize: 4096 });
mix.connect(analyzer);
mix.connect(ctx.destination);

let saw: OscillatorNode;
const sawg: GainNode = new GainNode(ctx, { gain: sawGain.value });
sawg.connect(sourceMix);

let sq: OscillatorNode;
const sqg: GainNode = new GainNode(ctx, { gain: sqGain.value });
sqg.connect(sourceMix);

let sin: OscillatorNode;
const sing: GainNode = new GainNode(ctx, { gain: sinGain.value });
sing.connect(sourceMix);

let noise: AudioBufferSourceNode;
const noiseg: GainNode = new GainNode(ctx, { gain: noiseGain.value });
noiseg.connect(sourceMix);

const formants: BiquadFilterNode[] = [];
const formantsg: GainNode[] = [];
for (const [frequency, Q, gain] of formantVals[vowel.value]) {
  const f = new BiquadFilterNode(ctx, {
    type: "peaking",
    frequency: frequency.value,
    Q: Q.value,
    gain: gain.value,
  });
  const fg = new GainNode(ctx, { gain: formantsOn.value ? 1.0 : 0.0 });
  sourceMix.connect(f);
  f.connect(fg);
  fg.connect(mix);
  formants.push(f);
  formantsg.push(fg);
}

const formantsThru: GainNode = new GainNode(ctx, {
  gain: formantsOn.value ? 0.0 : 1.0,
});
sourceMix.connect(formantsThru);
formantsThru.connect(mix);

let af = 0;
const g: PIXI.Graphics = new PIXI.Graphics();
const gw = 800,
  gh = 80;

function play(frequency: number) {
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

  mix.gain.exponentialRampToValueAtTime(keyGain, t + onset);

  af = requestAnimationFrame(analyze);
  started.value = true;
}

function stop(freq: number, stopAnalysis = true) {
  if (stopAnalysis) cancelAnimationFrame(af);
  const t = ctx.currentTime + delay;
  const st = t + offset + delay;
  saw.stop(st);
  sin.stop(st);
  sq.stop(st);
  noise.stop(st);
  mix.gain.setTargetAtTime(0, t, offset);
  mix.gain.value = 0;
  started.value = false;
}

function toggle() {
  f0.value.toggleF0();
}

function updateFormantsOn() {
  for (const fg of formantsg) {
    fg.gain.value = formantsOn.value ? 1.0 : 0.0;
  }
  formantsThru.gain.value = formantsOn.value ? 0.0 : 1.0;
}

function updateFormantVals() {
  for (const [frequency, Q, gain] of formantVals[vowel.value]) {
    for (const f of formants) {
      f.frequency.value = frequency.value;
      f.Q.value = Q.value;
      f.gain.value = gain.value;
    }
  }
}

function analyze() {
  const data = new Float32Array(analyzer.frequencyBinCount);
  analyzer.getFloatTimeDomainData(data);

  const dataArr = [...data];
  power.value = arr2rms(dataArr);

  g.clear();
  g.lineStyle(1, 0xffffff, 1);
  for (let i = 0; i < dataArr.length; i++) {
    const x = (i / dataArr.length) * gw;
    const y = (dataArr[i] + 1) * (gh / 2);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }

  af = requestAnimationFrame(analyze);
}

watch(vowel, updateFormantVals);

onMounted(() => {
  const app = new PIXI.Application({
    view: canvas.value,
    width: gw,
    height: gh,
    backgroundColor: 0x000000,
    antialias: true,
  });
  app.stage.addChild(g);

  window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
});

onUnmounted(() => {
  ctx.close();
});
</script>

<template>
  <section>
    <fieldset>
      <canvas ref="canvas" />
    </fieldset>
    <fieldset>
      <label>Power: {{ power.toFixed(2) }} /
        {{ gain2db(power).toFixed(2) }}dB</label>
    </fieldset>
    <fieldset>
      <h3>Source</h3>
    </fieldset>
    <fieldset>
      <F0Selector ref="f0" :play="play" :stop="stop" />
    </fieldset>
    <fieldset>
      <Knob label="Saw" v-model="sawGain" @change="sawg.gain.value = $event" />
      <Knob label="Sine" v-model="sinGain" @change="sing.gain.value = $event" />
      <Knob label="Square" v-model="sqGain" @change="sqg.gain.value = $event" />
      <Knob
        label="Noise"
        v-model="noiseGain"
        @change="noiseg.gain.value = $event"
        :step="0.01"
      />
    </fieldset>
    <fieldset divider>
      <input type="checkbox" v-model="formantsOn" @change="updateFormantsOn">
      <h3>Formants</h3>
    </fieldset>
    <fieldset class="formants">
      <v-btn
        v-for="v in Object.keys(formantVals)"
        @click="vowel = v"
        :key="v"
        :color="vowel === v ? '#ddd' : ''"
      >
        {{ v }}
      </v-btn>
    </fieldset>
    <fieldset v-for="(fval, idx) in formantVals[vowel]" :key="idx" class="formant">
      <label>F{{ idx + 1 }}</label>
      <Knob
        label="Freq"
        v-model="fval[0].value"
        @change="formants[idx].frequency.value = $event"
        :min="0"
        :max="22050"
        :step="100"
      />
      <Knob
        label="Q"
        v-model="fval[1].value"
        @change="formants[idx].Q.value = $event"
        :min="0"
        :max="10"
        :step="0.5"
      />
      <Knob
        label="Gain"
        v-model="fval[2].value"
        @change="formants[idx].gain.value = $event"
        :min="0"
        :max="20"
        :step="0.1"
      />
    </fieldset>
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
  padding-bottom: 100px;
  margin-top: -10px;
}
fieldset {
  border: 0;
  padding: 0 0 0 10px;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 20px;
  &[divider] {
    margin-top: 20px;
  }
  &[compact] {
    margin: 0;
  }
}
label {
  font-size: 13px;
  align-self: center;
}
.f0 {
  width: 100px;
}
.formants {
  margin-bottom: 10px;
}
</style>
