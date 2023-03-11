<script setup lang="ts">
const ctx = new AudioContext();
const frequency = 220.0;
const delay = .05;
const onset = .2;
const offset = .1;

const sawGain = ref(.5);
const sqGain = ref(.25);
const sinGain = ref(.25);
const noiseGain = ref(.01);
const tiltVal = ref(1);
const toneVal = ref(0);
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

watch(toneVal, () => {
  // @tone=0 :: saw: .5, sq: 0, sin: .5, noise: 0, tilt: 0
  // @tone=1 :: saw: .5, sq: .5, sin: 0, noise: .02, tilt: 1
  sqGain.value = sqg.gain.value = toneVal.value * .7;
  sinGain.value = sing.gain.value = (1 - toneVal.value) * .7;
  noiseGain.value = noiseg.gain.value = toneVal.value * .1;
  tiltVal.value = tilt.Q.value = toneVal.value * 10.0;
});

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
