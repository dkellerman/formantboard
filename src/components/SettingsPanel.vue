<script setup lang="ts">
import { useApp } from '../stores/useApp';
import F0Selector from './F0Selector.vue';

const visTypes = [
  { title: 'Spectrum', value: 'power' },
  { title: 'Wave', value: 'waveform' },
];

const { settings, vowel, visType } = storeToRefs(useApp());
const f0selector = ref<typeof F0Selector>();
const formantButtons = ref();

function setFormants() {
  const btns: number[] = [];
  settings.value.formants.specs[vowel.value].forEach((f, idx) => {
    if (f.on) btns.push(idx)
  });
  formantButtons.value = btns;
}

function updateFormants(btns: number[]) {
  settings.value.formants.specs[vowel.value].forEach((f, idx) => {
    f.on = btns.includes(idx);
  });
  f0selector.value?.restartF0();
}


onMounted(setFormants);
watch([settings.value.formants.specs[vowel.value]], setFormants);
</script>

<template>
  <section class="settings">
    <F0Selector ref="f0selector" />

    <v-btn-toggle
      multiple
      variant="outlined"
      density="compact"
      divided
      v-model="formantButtons"
      @update:model-value="updateFormants($event)"
    >
      <v-btn
        v-for="f, idx in settings.formants.specs[vowel]"
        :key="idx"
      >
        F{{ idx + 1 }}
        <v-tooltip
          activator="parent"
          location="top"
          :open-on-hover="true"
        >
          <div>Formant F{{ idx + 1 }} [{{ f.on ? 'ON' : 'OFF' }}]</div>
          <div>
            {{ f.frequency - (f.frequency * f.Q) }}-{{ f.frequency + (f.frequency * f.Q) }}hz
          </div>
        </v-tooltip>
      </v-btn>
    </v-btn-toggle>

    <VowelSelector @change="f0selector?.restartF0" />

    <v-text-field
      class="max-harmonics"
      label="Harmonics"
      v-model="settings.harmonics.max"
      density="compact"
      variant="outlined"
      @change="f0selector?.restartF0"
      type="number"
      suffix="max"
      :min="0"
      :max="100"
    />

    <v-text-field
      class="tilt"
      label="Tilt"
      v-model="settings.harmonics.tilt"
      density="compact"
      variant="outlined"
      @change="f0selector?.restartF0"
      type="number"
      suffix="dB/oct"
      :min="-20.0"
      :max="1.0"
    />

    <v-select
      class="viz-type"
      v-model="visType"
      :items="visTypes"
      variant="outlined"
      label="Visualzation"
      density="compact"
    />
  </section>
</template>

<style scoped lang="scss">
.settings {
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  column-gap: 20px;
  row-gap: 0;

  .max-harmonics { max-width: 110px; }
  .tilt { max-width: 120px; }
  .viz-type { max-width: 130px; }
}
</style>
