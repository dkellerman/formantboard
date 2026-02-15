import { useState } from "react";
import { useAppContext } from "@/store";
import { usePlayer } from "@/hooks/usePlayer";
import { VisType } from "@/constants";
import { Keyboard } from "@/components/Keyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Visualizer } from "@/components/Visualizer";
import { MidiButton } from "@/components/MidiButton";
import { MicButton } from "@/components/MicButton";
import { Readout } from "@/components/Readout";
import { note2freq, type Note } from "@/utils";

export function HomePage() {
  const { settings } = useAppContext();
  const player = usePlayer();
  const [visType, setVisType] = useState<VisType>(settings.defaultVisType);
  const [midiNotes, setMidiNotes] = useState<Set<string>>(new Set());

  function noteId(note: Note) {
    return note.replace("#", "s");
  }

  return (
    <section className="flex flex-col items-center gap-0">
      <div className="w-[95vw]">
        <SettingsPanel className="mb-3" visType={visType} onVisTypeChange={setVisType} />
        {settings.viz.on ? <Visualizer vtype={visType} height={150} /> : null}
        <Keyboard
          activeNotes={midiNotes}
          onKeyOn={(note, velocity) => player.play(note, velocity)}
          onKeyOff={(note) => player.stop(note)}
        />
      </div>
      <div className="my-10 inline-flex gap-5">
        <MidiButton
          text="MIDI"
          onNoteOn={(note, velocity) => {
            player.play(note2freq(note), velocity);
            setMidiNotes((prev) => new Set(prev).add(noteId(note)));
          }}
          onNoteOff={(note) => {
            player.stop(note2freq(note));
            setMidiNotes((prev) => {
              const next = new Set(prev);
              next.delete(noteId(note));
              return next;
            });
          }}
        />
        <MicButton startText="Listen" stopText="Stop" />
      </div>
      <Readout />
    </section>
  );
}
