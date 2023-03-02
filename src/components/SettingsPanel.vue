<script setup lang="ts">
import { usePlayer } from '../stores/usePlayer';
import { useApp } from '../stores/useApp';

const vizTypes = [
  { title: 'Spectrum', value: 'power' },
  { title: 'Wave', value: 'waveform' },
];

const { f0, vizType, settings, vowel } = storeToRefs(useApp());
const player = usePlayer();
const playingF0 = ref<number>();
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
  restartF0();
}

function toggleF0() {
  if (playingF0.value) {
    player?.stop(playingF0.value);
    playingF0.value = undefined;
    return;
  }

  const val = f0.value;
  const hz = parseFloat(val);
  const freq = Number.isNaN(hz) ? note2freq(val) : hz;
  if (freq) {
    playingF0.value = freq;
    player?.play(playingF0.value);
  }
}

function restartF0() {
  if (playingF0.value) {
    toggleF0();
    toggleF0();
  }
}

onMounted(setFormants);
watch([settings.value.formants.specs[vowel.value]], setFormants);

</script>

<template>
  <section class="settings">
    <v-text-field
      class="f0"
      label="F0"
      v-model="f0"
      :append-inner-icon="!!playingF0 ? 'mdi-stop' : 'mdi-play'"
      density="compact"
      variant="outlined"
      @click:append-inner="toggleF0"
      @change="restartF0"
      @keyup.enter="restartF0"
    />

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

    <VowelSelector @change="restartF0" />

    <v-text-field
      class="max-harmonics"
      label="Harmonics"
      v-model="settings.harmonics.max"
      density="compact"
      variant="outlined"
      @change="restartF0"
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
      @change="restartF0"
      type="number"
      suffix="dB/oct"
      :min="-20.0"
      :max="1.0"
    />

    <v-select
      class="viz-type"
      v-model="vizType"
      :items="vizTypes"
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
  .f0 { max-width: 100px; }
  .max-harmonics { max-width: 110px; }
  .tilt { max-width: 120px; }
  .viz-type { max-width: 130px; }

  :deep(.mdi-play::before) {
    color: rgb(16, 116, 16);
  }
  :deep(.mdi-stop::before) {
    color: rgb(163, 11, 11);
  }
}
</style>
