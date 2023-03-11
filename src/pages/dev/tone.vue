<script setup lang="ts">
const ctx = new AudioContext();
const frequency = 220.0;
const delay = .05;
const onset = .2;
const offset = .1;

const sawGain = ref(0);
const sqGain = ref(0);
const sinGain = ref(0);
const noiseGain = ref(0);
const tiltVal = ref(0);
const toneVal = ref(.5);
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

sawg.connect(mix);
sqg.connect(mix);
sing.connect(mix);
noiseg.connect(mix);
tilt.connect(mix);
mix.connect(ctx.destination);

function adjustTone(val: number) {
  sawGain.value = round(.4 + (val * .2), 2);
  sqGain.value = sqg.gain.value = round(val * .7, 2);
  sinGain.value = sing.gain.value = round((1 - val) * .7, 2);
  noiseGain.value = noiseg.gain.value = round(val * .03, 2);
  tiltVal.value = tilt.Q.value = round(val * 10.0, 2);
}

watch(toneVal, adjustTone);
adjustTone(toneVal.value);

function toggle() {
  if (!started.value) {
    saw = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    saw.connect(sawg);
    sq = new OscillatorNode(ctx, { type: "square", frequency });
    sq.connect(sqg);
    sin = new OscillatorNode(ctx, { type: "sine", frequency });
    sin.connect(sing);
    noise = createWhiteNoise(ctx);
    noise.connect(noiseg);

    const t = ctx.currentTime + delay;
    saw.start(t);
    sq.start(t);
    sin.start(t);
    noise.start(t);
    mix.gain.value = 0;
    mix.gain.exponentialRampToValueAtTime(1.0, t + onset);
    started.value = true;
  }
  else {
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
    <fieldset>
      <Knob label="Saw" v-model="sawGain" @change="sawg.gain.value = $event" />
      <Knob label="Sine" v-model="sinGain" @change="sing.gain.value = $event" />
      <Knob label="Square" v-model="sqGain" @change="sqg.gain.value = $event" />
      <Knob label="Noise" v-model="noiseGain" @change="noiseg.gain.value = $event" :step=".01" />
      <Knob label="Tilt" v-model="tiltVal" @change="tilt.Q.value = $event" :min="0" :max="10" :step="1" />
    </fieldset>
    <fieldset>
      <Knob label="Tone" v-model="toneVal" />
    </fieldset>
    <v-btn @click="toggle">
      {{ started ? 'Stop' : 'Start' }}
    </v-btn>
  </section>
</template>

<style lang="scss" scoped>
  section {
    padding: 40px;
  }
  fieldset {
    border: 0;
    padding: 0 0 20px 0;
    display: flex;
    flex-direction: row;
    gap: 15px;
  }
</style>
