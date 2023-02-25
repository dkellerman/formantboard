<script setup lang="ts">
import Piano from '../components/Piano.vue';
import MidiInput from '../components/MidiInput.vue';
import { MidiStatus } from '../types';
import { playFreq, stopFreq } from '../utils';

const piano = ref<typeof Piano>();
const midi = ref<typeof MidiInput>();
const { audioContext } = storeToRefs(useSettings());

onUnmounted(() => {
  midi.value?.disable();
});
</script>

<template>
  <section>
    <Piano ref="piano" @play="(f, v) => playFreq(audioContext, f, v)" @stop="(f) => stopFreq(audioContext, f)" />
    <v-btn v-if="midi?.status === MidiStatus.Disabled" variant="outlined" @click="midi?.enable()">
      Enable MIDI
    </v-btn>
  </section>
  <MidiInput ref="midi" @note-on="piano?.play" @note-off="piano?.stop" />
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: column;
  align-items: center;
}
button {
  margin-top: 20px;
  position: absolute;
  right: 15px;
  top: -5px;
  z-index: 2000;
}
</style>
