import { WebMidi, Input } from 'webmidi';
import type { NoteMessageEvent } from 'webmidi';
import { Note } from '../utils';

export enum MidiStatus {
  Disabled,
  Enabled,
  Failed,
}

export const useMidi = defineStore('midi', () => {
  const midiInDeviceId = ref<string|null>();
  const midiInChannel = ref<number|null>();
  const midiIn = ref<Input|null>();
  const status = ref(MidiStatus.Disabled);

  function getMidiIn(): Input | null {
    if (!WebMidi.enabled) return null;

    if (WebMidi.inputs.length > 0) {
      const input = midiInDeviceId.value
        ? WebMidi.getInputById(midiInDeviceId.value)
        : WebMidi.inputs[0];
      console.log('using midi input', input.name);

      return input;
    }

    console.log('no midi inputs');
    return null;
  }

  async function enable() {
    await WebMidi.enable();
    console.log('midi', WebMidi.inputs);
    midiIn.value = getMidiIn();
    status.value = WebMidi.enabled && midiIn.value ? MidiStatus.Enabled : MidiStatus.Failed;
  }

  function disable() {
    midiIn.value?.removeListener();
  }

  function addNoteOnListener(cb: (note: Note, velocity: number) => void) {
    midiIn.value?.addListener('noteon', (e: NoteMessageEvent) => {
      const name = midi2note(e.note.number);
      if (!name) return;
      cb(name, e.note.attack);
    }, { channels: midiInChannel.value ?? undefined });
  }

  function addNoteOffListener(cb: (note: Note) => void) {
    midiIn.value?.addListener('noteoff', (e: NoteMessageEvent) => {
      const name = midi2note(e.note.number);
      if (!name) return;
      cb(name);
    }, { channels: midiInChannel.value ?? undefined });
  }

  return {
    enable,
    disable,
    status,
    addNoteOnListener,
    addNoteOffListener,
  };
});
