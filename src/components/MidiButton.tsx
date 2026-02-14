import { useEffect, type RefObject } from "react";
import { MidiStatus } from "../constants";
import { note2freq, type Note } from "../utils";
import { useMidi, usePlayer } from "../hooks/useStoreSlices";
import type { KeyboardHandle } from "./Keyboard";
import { Button } from "./ui/button";

export interface MidiButtonProps {
  showButton?: boolean;
  text?: string;
  keyboardRef?: RefObject<KeyboardHandle | null>;
}

export function MidiButton({
  showButton = true,
  keyboardRef,
  text = "Enable MIDI",
}: MidiButtonProps) {
  const midi = useMidi();
  const player = usePlayer();

  async function enableMidi() {
    await midi.enable();

    midi.addNoteOnListener((note: Note, velocity: number) => {
      if (keyboardRef?.current) keyboardRef.current.play(note);
      else player.play(note2freq(note), velocity);
    });

    midi.addNoteOffListener((note: Note) => {
      if (keyboardRef?.current) keyboardRef.current.stop(note);
      else player.stop(note2freq(note));
    });
  }

  useEffect(() => {
    return () => {
      midi.disable();
    };
  }, [midi]);

  if (!showButton || midi.status !== MidiStatus.Disabled) {
    return <section className="midi" />;
  }

  return (
    <section className="midi">
      <Button variant="outline" onClick={enableMidi}>
        {text}
      </Button>
    </section>
  );
}
