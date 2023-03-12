<script setup lang="ts">
import F0Selector from './F0Selector.vue';

const f0selector = ref<InstanceType<typeof F0Selector>>();
const { vowelSpec } = storeToRefs(useVowel());
const { settings } = storeToRefs(useSettings());
const { visType } = storeToRefs(useVisType());
const formantButtons = ref();

function setFormants() {
  const btns: number[] = [];
  vowelSpec.value.forEach((f, idx) => {
    if (f.on) btns.push(idx);
  });
  formantButtons.value = btns;
}

function updateFormants(btns: number[]) {
  vowelSpec.value.forEach((f, idx) => {
    f.on = btns.includes(idx);
  });
  f0selector.value?.restartF0();
}

onMounted(setFormants);
watch([vowelSpec.value], setFormants);
</script>

<template>
  <section class="settings">
    <F0Selector ref="f0selector" />

    <v-btn-toggle multiple v-model="formantButtons" @update:model-value="updateFormants($event)">
      <v-btn v-for="f, idx in vowelSpec" :key="idx">
        F{{ idx + 1 }}
        <v-tooltip activator="parent" location="top">
          <div>Formant F{{ idx + 1 }} [{{ f.on ? 'ON' : 'OFF' }}]</div>
          <div>
            {{ formantRange(f).join('-') }}hz
          </div>
        </v-tooltip>
      </v-btn>
    </v-btn-toggle>

    <VowelSelector @change="f0selector?.restartF0" />

    <v-text-field
      class="tilt"
      label="Tilt"
      v-model="settings.harmonics.tilt"
      @change="f0selector?.restartF0"
      type="number"
      suffix="dB/oct"
      :min="-20.0"
      :max="0.0"
    />

    <v-select
      class="viz-type"
      v-model="visType"
      :items="VIS_TYPES"
      label="Visualzation"
    />
  </section>
</template>

<style scoped lang="scss">
.settings {
  width: 100%;
  padding: 0 40px;
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
