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
    // route to keyboard if one is specified (and assume keyboard will play note)
    // otherwise play note directly
    if (props.keyboard)
      props.keyboard?.play(note);
    else
      player.play(note2freq(note), velocity);
  });

  midi.addNoteOffListener((note: Note) => {
    if (props.keyboard)
      props.keyboard?.stop(note);
    else
      player.stop(note2freq(note))
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
    <v-btn v-if="props.showButton && midi.status === MidiStatus.Disabled" @click="enableMidi">
      Enable MIDI
    </v-btn>
  </section>
</template>
