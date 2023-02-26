<script setup lang="ts">
import Keyboard from 'components/Keyboard.vue';
import MidiInput from 'components/MidiInput.vue';
import { MidiStatus } from 'types';

const keyboard = ref<typeof Keyboard>();
const midi = ref<typeof MidiInput>();
const { audioContext } = storeToRefs(useSettings());

onUnmounted(() => {
  midi.value?.disable();
});
</script>

<template>
  <section>
    <Keyboard ref="keyboard" @play="(f, v) => playFreq(audioContext, f, v)" @stop="(f) => stopFreq(audioContext, f)" />
    <v-btn v-if="midi?.status === MidiStatus.Disabled" variant="outlined" @click="midi?.enable()">
      Enable MIDI
    </v-btn>
  </section>
  <MidiInput ref="midi" @note-on="keyboard?.play" @note-off="keyboard?.stop" />
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
