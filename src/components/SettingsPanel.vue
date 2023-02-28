<script setup lang="ts">
import { useApp } from '../stores/useApp';

const { keyboard, f0, player, vizType } = storeToRefs(useApp());
const playingF0 = ref<number>();

const vizTypes = [
  { title: 'Spectrum', value: 'power' },
  { title: 'Waveform', value: 'waveform' },
];

function toggleF0() {
  const val = f0.value;
  const hz = parseFloat(val);
  const freq = Number.isNaN(hz) ? note2freq(val) : hz;

  if (playingF0.value) {
    player.value?.stop(playingF0.value);
    playingF0.value = undefined;
    return;
  }

  if (freq) {
    playingF0.value = freq;
    player.value?.play(playingF0.value);
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
      @click:append-inner="toggleF0()"
      @keyup.enter="toggleF0"
    />

    <VowelSelector />

    <v-select
      class="viz-type"
      v-model="vizType"
      :items="vizTypes"
      variant="outlined"
      label="Visualzation"
      density="compact"
    />

    <MidiInput ref="midi" @note-on="keyboard?.play" @note-off="keyboard?.stop" />
  </section>
</template>

<style scoped lang="scss">
.settings {
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 20px;
  .midi {
    flex: 1;
    text-align: right;
  }
  .f0 {
    max-width: 100px;
  }
  .viz-type {
    max-width: 150px;
  }
  :deep(.mdi-play::before) {
    color: rgb(16, 116, 16);
  }
  :deep(.mdi-stop::before) {
    color: rgb(163, 11, 11);
  }
}
</style>
