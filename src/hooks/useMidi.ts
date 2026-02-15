import { useRef, useState } from "react";
import { WebMidi, type Input, type NoteMessageEvent } from "webmidi";
import { MidiStatus } from "@/constants";
import { midi2note, type Note } from "@/utils";
import type { MidiState } from "@/types";

export function useMidi(): MidiState {
  const [status, setStatus] = useState(MidiStatus.Disabled);
  const midiInRef = useRef<Input | null>(WebMidi.inputs[0] ?? null);

  function resolveInput() {
    if (!WebMidi.enabled) return null;
    if (WebMidi.inputs.length === 0) return null;
    const currentId = midiInRef.current?.id;
    if (currentId) return WebMidi.getInputById(currentId) ?? null;
    return WebMidi.inputs[0] ?? null;
  }

  async function enable() {
    await WebMidi.enable();
    const midiIn = resolveInput();
    midiInRef.current = midiIn;
    setStatus(WebMidi.enabled && midiIn ? MidiStatus.Enabled : MidiStatus.Failed);
  }

  function disable() {
    midiInRef.current?.removeListener();
  }

  function addNoteOnListener(cb: (note: Note, velocity: number) => void) {
    midiInRef.current?.addListener("noteon", (event: NoteMessageEvent) => {
      const note = midi2note(event.note.number);
      if (!note) return;
      cb(note, event.note.attack);
    });
  }

  function addNoteOffListener(cb: (note: Note) => void) {
    midiInRef.current?.addListener("noteoff", (event: NoteMessageEvent) => {
      const note = midi2note(event.note.number);
      if (!note) return;
      cb(note);
    });
  }

  function reset() {
    midiInRef.current?.removeListener();
    midiInRef.current = null;
    setStatus(MidiStatus.Disabled);
  }

  return { status, enable, disable, addNoteOnListener, addNoteOffListener, reset };
}
