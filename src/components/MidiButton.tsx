import { useEffect } from "react";
import { MidiStatus } from "@/constants";
import { note2freq, type Note } from "@/utils";
import { useMidi } from "@/hooks/useMidi";
import { usePlayer } from "@/hooks/usePlayer";
import { Button } from "@/components/ui/button";

export interface MidiButtonProps {
  showButton?: boolean;
  text?: string;
  onNoteOn?: (note: Note, velocity: number) => void;
  onNoteOff?: (note: Note) => void;
}

export function MidiButton({
  showButton = true,
  onNoteOn,
  onNoteOff,
  text = "Enable MIDI",
}: MidiButtonProps) {
  const midi = useMidi();
  const player = usePlayer();

  async function enableMidi() {
    await midi.enable();

    midi.addNoteOnListener((note: Note, velocity: number) => {
      if (onNoteOn) onNoteOn(note, velocity);
      else player.play(note2freq(note), velocity);
    });

    midi.addNoteOffListener((note: Note) => {
      if (onNoteOff) onNoteOff(note);
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
