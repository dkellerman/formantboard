<script setup lang="ts">
const started = ref(false);
const ctx = new AudioContext();
const frequency = 440;
let osc: OscillatorNode, osc2: OscillatorNode;
let gain: GainNode, gain2: GainNode, a: AnalyserNode;
let raf: number|undefined;
let rafct = 0;

const { layout, keyboardWidth } = storeToRefs(useKeyboardLayout());

function toggle() {
  if (started.value) {
    osc?.stop();
    osc2?.stop();
    if (raf) cancelAnimationFrame(raf);
    raf = undefined;
  } else {
    osc = new OscillatorNode(ctx, { frequency });
    gain = new GainNode(ctx, { gain: 1.0 });
    osc2 = new OscillatorNode(ctx, { frequency });
    gain2 = new GainNode(ctx, { gain: 1.0 });

    a = new AnalyserNode(ctx, { fftSize: 4096 });
    osc.connect(gain).connect(a).connect(ctx.destination);
    osc2.connect(gain2).connect(a).connect(ctx.destination);
    osc.start();
    osc2.start();
    rafct = 0;
    raf = requestAnimationFrame(draw);
  }
  started.value = !started.value;
}

function draw() {
  const data = new Float32Array(a.frequencyBinCount);
  a.getFloatFrequencyData(data);
  const sliceWidth = (ctx.sampleRate / 2) / a.frequencyBinCount;
  if (rafct % 100 === 99) {
    for (let i = 0; i < a.frequencyBinCount; i++) {
      const f1 = i * sliceWidth;
      const f2 = f1 + sliceWidth;
      if (frequency >= f1 && frequency < f2) {
        const db = data[i];
        debug(db, db2gain(db));
      }
    }
  }
  rafct++;
  raf = requestAnimationFrame(draw);
}
</script>

<template>
  <section class="foo">
    <v-btn @click="toggle">
      {{ started ? 'Stop' : 'Start' }}
    </v-btn>

    <div v-for="note in layout.notes" :key="note">
      {{ note }} :: {{ countSlots('A0', note) }} :: {{ layout.freq2px(note2freq(note), keyboardWidth) }}
    </div>
  </section>
</template>

<style lang="scss" scoped>
section {
  padding: 20px;
}
</style>
