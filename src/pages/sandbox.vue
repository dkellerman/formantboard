<script setup lang="ts">
/* eslint-disable */
import VowelSelector from '../components/VowelSelector.vue';
import F0Selector from '../components/F0Selector.vue';
import Visualizer from '../components/Visualizer.vue';
import MidiButton from '../components/MidiButton.vue';

const sources = [
  { title: 'Tone', value: 'osc' },
  { title: 'Noise', value: 'noise' },
];

const sourceTypes = computed(() => f0.source === 'osc' ? [
  { title: 'Sine', value: 'sine' },
  { title: 'Sawtooth', value: 'sawtooth' },
  { title: 'Square', value: 'square' },
] : []);

const f0selector = ref<InstanceType<typeof F0Selector>>();
const allEffects = ref(true);
const metrics = useMetrics();
const player = usePlayer();
const { vowel } = storeToRefs(useVowel());
const { settings } = storeToRefs(useSettings());
const { flutter, harmonics, compression, formants, tube, vibrato, f0 } = settings.value;

function restartF0() {
  f0selector.value?.restartF0();
}

function toggleEffects() {
  compression.on = harmonics.on = flutter.on = vibrato.on = tube.on = formants.on = allEffects.value;
  restartF0();
}
</script>

<template>
  <section class="sandbox">
    <MidiButton />
    <Visualizer :vtype="VisType.WAVE" :height="80" />
    <Visualizer :vtype="VisType.POWER" :height="80" />

    <fieldset>
      <v-switch label="F0" v-model="f0.on" @change="restartF0" />
      <F0Selector ref="f0selector" />
      <v-text-field label="Volume" v-model="player.volume" type="number" min="0" max="100" />
      <v-text-field label="Key Gain" v-model="f0.keyGain" @change="restartF0" type="number" min="0" max="1" />
      <v-text-field label="Onset time" v-model="f0.onsetTime" @change="restartF0" type="number" min="0" suffix="s" />
      <v-text-field label="Decay time" v-model="f0.decayTime" @change="restartF0" type="number" min="0" suffix="s" />
      <v-select label="Source" v-model="f0.source" :items="sources" @update:model-value="restartF0" />
      <v-select label="Source Type" v-model="f0.sourceType" :items="sourceTypes" @update:model-value="restartF0" />
      <v-text-field label="Latency" v-model="metrics.latency" readonly suffix="s" />
      <v-text-field label="RMS" v-model="metrics.rms" readonly suffix="dB" />
      <v-switch label="All effects" v-model="allEffects" @change="toggleEffects" />
    </fieldset>
    <fieldset>
      <v-switch label="Compression" v-model="compression.on" @change="restartF0" />
      <v-text-field label="Treshold" v-model="compression.threshold" @change="restartF0" type="number" />
      <v-text-field label="Knee" v-model="compression.knee" @change="restartF0" type="number" />
      <v-text-field label="Ratio" v-model="compression.ratio" @change="restartF0" type="number" />
      <v-text-field label="Attack" v-model="compression.attack" @change="restartF0" type="number" />
      <v-text-field label="Release" v-model="compression.release" @change="restartF0" type="number" />
      <v-text-field label="Reduction" v-model="metrics.compression" readonly suffix="dB"></v-text-field>
      <meter min="0" max="20" optimum="0" low="0" high="1" :value="Math.abs(metrics.compression)" />
    </fieldset>
    <fieldset>
      <v-switch label="Harmonics" v-model="harmonics.on" @change="restartF0" />
      <v-text-field label="Max num" v-model="harmonics.max" @change="restartF0" type="number" min="0" />
      <v-text-field label="Max freq" v-model="harmonics.maxFreq" @change="restartF0" type="number" min="0" suffix="hz" />
      <v-text-field label="Tilt" v-model="harmonics.tilt" @change="restartF0" type="number" min="-40" max="6" suffix="dB/oct" />
      <v-text-field label="Actual" v-model="metrics.harmonics.length" readonly></v-text-field>
    </fieldset>
    <fieldset>
      <v-switch label="Flutter" v-model="flutter.on" @change="restartF0" />
      <v-text-field label="Amount" v-model="flutter.amount" @change="restartF0" type="number" min="0" />
    </fieldset>
    <fieldset>
      <v-switch label="Vibrato" v-model="vibrato.on" @change="restartF0" />
      <v-text-field label="Rate" v-model="vibrato.rate" @change="restartF0" type="number" min="0" suffix="hz" />
      <v-text-field label="Extent" v-model="vibrato.extent" @change="restartF0" type="number" min="0" suffix="hz" />
      <v-text-field label="Jitter" v-model="vibrato.jitter" @change="restartF0" type="number" min="0" />
      <v-text-field label="Onset time" v-model="vibrato.onsetTime" @change="restartF0" type="number" min="0" suffix="s" />
    </fieldset>
    <fieldset>
      <v-switch label="Tube" v-model="tube.on" @change="restartF0" />
    </fieldset>
    <fieldset>
      <v-switch label="Formants" v-model="formants.on" @change="restartF0" />
      <VowelSelector />
    </fieldset>
    <div v-for="_, idx in [...Array(5).fill(0)]">
      <fieldset v-if="formants.specs[vowel][idx]">
        <v-switch :label="`F${idx+1}`" v-model="formants.specs[vowel][idx].on" @change="restartF0" />
        <v-text-field label="Freq" v-model="formants.specs[vowel][idx].frequency" @change="restartF0" type="number" min="0" suffix="hz" />
        <v-text-field label="Q" v-model="formants.specs[vowel][idx].Q" @change="restartF0" type="number" min="0" max="1" />
      </fieldset>
    </div>
  </section>
</template>

<style scoped lang="scss">
section.sandbox {
  padding: 20px;
  .visualizer, .keyboard {
    margin-top: -10px;
  }
  fieldset {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    padding: 0px;
    margin-bottom: 10px;
    border: 0;
    border-bottom: 1px dotted #ccc;
    padding-top: 10px;
    .v-text-field, .v-switch, .vowel-selector {
      width: 150px;
      margin-right: 10px;
      flex: unset;
    }
    .vowel-selector {
      width: 200px;
    }
  }
  .midi {
    position: fixed;
    top: 15px;
    right: 35px;
    z-index: 2000;
    padding: 0;
  }

  meter {
    margin-top: -20px;
  }
}
</style>
