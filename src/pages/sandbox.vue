<script setup lang="ts">
/* eslint-disable */
import VowelSelector from '../components/VowelSelector.vue';
import F0Selector from '../components/F0Selector.vue';
import Visualizer from '../components/Visualizer.vue';
import MidiButton from '../components/MidiButton.vue';

const midi = useMidi();
const f0selector = ref<InstanceType<typeof F0Selector>>();
const allEffects = ref(true);
const metrics = useMetrics();
const player = usePlayer();
const { vowel } = storeToRefs(useVowel());
const { settings } = storeToRefs(useSettings());
const { width } = useWindowSize();

function toggleEffects() {
  allEffects.value = settings.value.compression.on = settings.value.harmonics.on =
  settings.value.flutter.on = settings.value.vibrato.on = settings.value.tube.on =
  settings.value.formants.on = allEffects.value;
  f0selector.value?.restartF0();
}

</script>

<template>
  <section class="sandbox">
    <MidiButton />

    <Visualizer :vtype="VisType.WAVE" :width="width * .9" :height="80" />
    <Visualizer :vtype="VisType.POWER" :width="width * .9" :height="80" />

    <fieldset>
      <F0Selector ref="f0selector" />
      <v-text-field label="Volume" v-model="player.volume" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" max="100" />
      <v-text-field label="Key Gain" v-model="settings.f0.keyGain" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" max="1" />
      <v-text-field label="Onset time" v-model="settings.f0.onsetTime" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="s" />
      <v-text-field label="Decay time" v-model="settings.f0.decayTime" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="s" />
      <v-text-field label="Source type" v-model="settings.f0.sourceType" @change="f0selector?.restartF0" density="compact" variant="outlined" />
      <v-text-field label="Latency" v-model="metrics.latency" :readonly="true" density="compact" variant="outlined" suffix="ms" />
      <v-switch label="All effects" v-model="allEffects" @change="toggleEffects" density="compact" variant="outlined" />
    </fieldset>
    <fieldset>
      <v-switch label="Compression" v-model="settings.compression.on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
      <v-text-field label="Treshold" v-model="settings.compression.threshold" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" />
      <v-text-field label="Knee" v-model="settings.compression.knee" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" />
      <v-text-field label="Ratio" v-model="settings.compression.ratio" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" />
      <v-text-field label="Attack" v-model="settings.compression.attack" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" />
      <v-text-field label="Release" v-model="settings.compression.release" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" />
      <v-text-field label="Reduction" v-model="metrics.compression" :readonly="true" density="compact" variant="outlined" suffix="dB" />
    </fieldset>
    <fieldset>
      <v-switch label="Harmonics" v-model="settings.harmonics.on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
      <v-text-field label="Max num" v-model="settings.harmonics.max" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" />
      <v-text-field label="Max freq" v-model="settings.harmonics.maxFreq" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="hz" />
      <v-text-field label="Tilt" v-model="settings.harmonics.tilt" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="-40" max="6" suffix="dB/oct" />
    </fieldset>
    <fieldset>
      <v-switch label="Flutter" v-model="settings.flutter.on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
      <v-text-field label="Amount" v-model="settings.flutter.amount" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" />
    </fieldset>
    <fieldset>
      <v-switch label="Vibrato" v-model="settings.vibrato.on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
      <v-text-field label="Rate" v-model="settings.vibrato.rate" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="hz" />
      <v-text-field label="Extent" v-model="settings.vibrato.extent" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="hz" />
      <v-text-field label="Jitter" v-model="settings.vibrato.jitter" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" />
      <v-text-field label="Onset time" v-model="settings.vibrato.onsetTime" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="s" />
    </fieldset>
    <fieldset>
      <v-switch label="Tube" v-model="settings.tube.on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
    </fieldset>
    <fieldset>
      <v-switch label="Formants" v-model="settings.formants.on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
      <VowelSelector />
    </fieldset>
    <fieldset v-for="_, idx in [...Array(5).fill(0)]">
      <div v-if="settings.formants.specs[vowel][idx]">
        <v-switch :label="`F${idx+1}`" v-model="settings.formants.specs[vowel][idx].on" @change="f0selector?.restartF0" density="compact" variant="outlined" />
        <v-text-field label="Freq" v-model="settings.formants.specs[vowel][idx].frequency" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" suffix="hz" />
        <v-text-field label="Q" v-model="settings.formants.specs[vowel][idx].Q" @change="f0selector?.restartF0" density="compact" variant="outlined" type="number" min="0" max="1" />
      </div>
    </fieldset>
  </section>
</template>

<style scoped lang="scss">
section {
  padding: 20px;

  fieldset {
    padding: 0px;
    margin-bottom: 10px;
    border: 0;
    border-bottom: 1px dotted #ccc;
    padding-top: 10px;
    .v-text-field, .v-switch, .vowel-selector {
      width: 150px;
      margin-right: 10px;
      display: inline-block;
    }
    .v-text-field { width: 130px; }
  }

  .midi button {
    float: right;
    position: fixed;
    top: 15px;
    right: 25px;
    z-index: 2000;
  }
}
</style>
