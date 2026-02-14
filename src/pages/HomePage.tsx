import { useRef } from "react";
import { usePlayer, useSettings, useVisTypeSlice } from "../hooks/useStoreSlices";
import { Keyboard, type KeyboardHandle } from "../components/Keyboard";
import { SettingsPanel } from "../components/SettingsPanel";
import { Visualizer } from "../components/Visualizer";
import { MidiButton } from "../components/MidiButton";
import { MicButton } from "../components/MicButton";
import { Readout } from "../components/Readout";

export function HomePage() {
  const player = usePlayer();
  const settings = useSettings();
  const visTypeStore = useVisTypeSlice();
  const keyboardRef = useRef<KeyboardHandle>(null);

  return (
    <section className="flex flex-col items-center gap-0">
      <div className="w-[95vw]">
        <SettingsPanel className="mb-3" />
        {settings.viz.on ? <Visualizer vtype={visTypeStore.visType} height={150} /> : null}
        <Keyboard
          ref={keyboardRef}
          onKeyOn={(note, velocity) => player.play(note, velocity)}
          onKeyOff={(note) => player.stop(note)}
        />
      </div>
      <div className="my-10 inline-flex gap-5">
        <MidiButton keyboardRef={keyboardRef} text="MIDI" />
        <MicButton startText="Listen" stopText="Stop" />
      </div>
      <Readout />
    </section>
  );
}
