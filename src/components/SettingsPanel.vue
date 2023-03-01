<script setup lang="ts">
import { usePlayer } from '../stores/usePlayer';
import { useApp } from '../stores/useApp';

const { f0, vizType, settings } = storeToRefs(useApp());
const player = usePlayer();
const playingF0 = ref<number>();

const vizTypes = [
  { title: 'Spectrum', value: 'power' },
  { title: 'Wave', value: 'waveform' },
];

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
    />

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

    <VowelSelector @change="restartF0" />

    <v-select
      class="viz-type"
      v-model="vizType"
      :items="vizTypes"
      variant="outlined"
      label="Visualzation"
      density="compact"
    />
    <MidiButton />
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
  .midi {
    flex: 1;
    text-align: right;
    position: absolute;
    top: 15px;
    right: 25px;
    z-index: 2000;
  }
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
