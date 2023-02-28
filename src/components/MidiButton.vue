<script setup lang="ts">
import { MidiStatus } from '../types';
import { useMidi } from '../stores/useMidi';

interface Props {
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), { show: true });
const { keyboard } = storeToRefs(useApp());
const midi = useMidi();

async function enableMidi() {
  await midi.enable();
  midi.addNoteOnListener((id) => keyboard.value?.play(id));
  midi.addNoteOffListener((id) => keyboard.value?.stop(id));
}

onUnmounted(() => {
  midi.disable();
});
</script>

<template>
  <section class="midi">
    <v-btn v-if="props.show && midi.status === MidiStatus.Disabled" variant="outlined" @click="enableMidi">
      Enable MIDI
    </v-btn>
  </section>
</template>
