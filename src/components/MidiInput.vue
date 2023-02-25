<script setup lang="ts">
import { WebMidi, Input } from 'webmidi';
import type { NoteMessageEvent } from 'webmidi';
import type { Note } from 'utils';

const emit = defineEmits<{
  (e: 'noteOn', note: Note, attack: number): void
  (e: 'noteOff', note: Note): void
}>();

const midiInDeviceId = ref<string|null>();
const midiInChannel = ref<number|null>();
const midiIn = ref<Input|null>();
const status = ref('disabled');

function getMidiIn(): Input | null {
  if (!WebMidi.enabled) return null;

  if (WebMidi.inputs.length > 0) {
    const input = midiInDeviceId.value
      ? WebMidi.getInputById(midiInDeviceId.value)
      : WebMidi.inputs[0];
    console.log('using midi input', input.name);

    input.addListener('noteon', (e: NoteMessageEvent) => {
      const name = midi2note(e.note.number);
      emit('noteOn', name, e.note.attack);
    }, { channels: midiInChannel.value ?? undefined });

    input.addListener('noteoff', (e: NoteMessageEvent) => {
      const name = midi2note(e.note.number);
      emit('noteOff', name);
    }, { channels: midiInChannel.value ?? undefined });

    return input;
  }

  console.log('no midi inputs');
  return null;
}

async function enable() {
  await WebMidi.enable();
  console.log('midi', WebMidi.inputs);
  midiIn.value = getMidiIn();
  status.value = WebMidi.enabled && midiIn.value ? 'enabled' : 'failed';
}

function disable() {
  midiIn.value?.removeListener();
}

defineExpose({
  enable,
  disable,
  status,
});
</script>

<template>
  <section />
</template>
