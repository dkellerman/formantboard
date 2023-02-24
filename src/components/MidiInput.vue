<script setup lang="ts">
import { WebMidi, Input } from 'webmidi';
import type { NoteMessageEvent } from 'webmidi';
import { onMounted, onUnmounted, ref } from 'vue';

const emit = defineEmits<{
  (e: 'noteOn', note: number, attack: number): void
  (e: 'noteOff', note: number): void
}>();

const midiInDeviceId = ref<string|null>();
const midiInChannel = ref<number|null>();
const midiIn = ref<Input | null>();

function getMidiIn(): Input | null {
  if (!WebMidi.enabled) return null;

  if (WebMidi.inputs.length > 0) {
    const input = midiInDeviceId.value
      ? WebMidi.getInputById(midiInDeviceId.value)
      : WebMidi.inputs[0];
    console.log('using midi input', input.name);

    input.addListener('noteon', (e: NoteMessageEvent) => {
      emit('noteOn', e.note.number, e.note.attack);
    }, { channels: midiInChannel.value ?? undefined });

    input.addListener('noteoff', (e: NoteMessageEvent) => {
      emit('noteOff', e.note.number);
    }, { channels: midiInChannel.value ?? undefined });

    return input;
  }

  console.log('no midi inputs');
  return null;
}

onMounted(async () => {
  await WebMidi.enable();
  console.log('midi', WebMidi.enabled ? 'enabled' : 'disabled', WebMidi.inputs);
  midiIn.value = getMidiIn();
  if (midiIn.value) console.log('using midi input', midiIn.value?.name);
});

onUnmounted(() => {
  midiIn.value?.removeListener();
});
</script>
