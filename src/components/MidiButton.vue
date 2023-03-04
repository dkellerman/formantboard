<script setup lang="ts">
import type { Note } from '../utils';
import Keyboard from './Keyboard.vue';

interface Props {
  showButton?: boolean;
  keyboard?: InstanceType<typeof Keyboard>;
}

const props = withDefaults(defineProps<Props>(), {
  showButton: true,
  keyboard: undefined,
});

const midi = useMidi();
const player = usePlayer();

async function enableMidi() {
  await midi.enable();

  midi.addNoteOnListener((note: Note, velocity: number) => {
    player.play(note2freq(note), velocity);
    props.keyboard?.play(note);
  });

  midi.addNoteOffListener((note: Note) => {
    player.stop(note2freq(note))
    props.keyboard?.stop(note);
  });
}

onUnmounted(() => {
  midi.disable();
});

defineExpose({
  enableMidi,
});
</script>

<template>
  <section class="midi">
    <v-btn v-if="props.showButton && midi.status === MidiStatus.Disabled" variant="outlined" @click="enableMidi">
      Enable MIDI
    </v-btn>
  </section>
</template>
