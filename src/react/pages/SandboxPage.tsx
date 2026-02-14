import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { audioEngine } from '../audio/engine';
import { F0Control } from '../components/F0Control';
import { Keyboard } from '../components/Keyboard';
import { Readout } from '../components/Readout';
import { Visualizer } from '../components/Visualizer';
import { useSynthStore, type VisType } from '../store/useSynthStore';
import { freq2note, noteOrFreq2freq, type Note } from '../../utils';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function SandboxPage() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [playingF0, setPlayingF0] = useState(false);
  const defaultNote = useSynthStore((state) => state.defaultNote);
  const visType = useSynthStore((state) => state.visType);
  const visualizationOn = useSynthStore((state) => state.visualizationOn);
  const harmonicTilt = useSynthStore((state) => state.harmonicTilt);
  const volume = useSynthStore((state) => state.volume);
  const midiEnabled = useSynthStore((state) => state.midiEnabled);
  const micEnabled = useSynthStore((state) => state.micEnabled);
  const setDefaultNote = useSynthStore((state) => state.setDefaultNote);
  const setVisType = useSynthStore((state) => state.setVisType);
  const setVisualizationOn = useSynthStore((state) => state.setVisualizationOn);
  const setHarmonicTilt = useSynthStore((state) => state.setHarmonicTilt);
  const setVolume = useSynthStore((state) => state.setVolume);
  const setRmsDb = useSynthStore((state) => state.setRmsDb);
  const setPitch = useSynthStore((state) => state.setPitch);
  const setMidiEnabled = useSynthStore((state) => state.setMidiEnabled);
  const setMicEnabled = useSynthStore((state) => state.setMicEnabled);
  const setFundamentalFrequency = useSynthStore((state) => state.setFundamentalFrequency);
  const resetSandbox = useSynthStore((state) => state.resetSandbox);

  const activeWithF0 = useMemo(() => {
    const next = new Set(activeNotes);
    if (playingF0) {
      try {
        const freq = noteOrFreq2freq(defaultNote as never);
        next.add(freq2note(freq));
      } catch {
        // ignore invalid default note while user edits
      }
    }
    return next;
  }, [activeNotes, defaultNote, playingF0]);

  useEffect(() => {
    void audioEngine.resume();
    const unsubscribe = audioEngine.subscribeFrames((frame) => {
      setRmsDb(frame.rmsDb);
    });
    return () => {
      unsubscribe();
      audioEngine.stopAll();
      audioEngine.disableMidi();
      audioEngine.disableMic();
    };
  }, [setRmsDb]);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  function onVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    setVolume(clamp(Number(event.target.value), 0, 100));
  }

  function onHarmonicTiltChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) setHarmonicTilt(clamp(next, -20, 0));
  }

  function addActive(note: string) {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.add(note);
      return next;
    });
  }

  function removeActive(note: string) {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }

  async function onKeyOn(note: string) {
    addActive(note);
    await audioEngine.play(note);
  }

  function onKeyOff(note: string) {
    removeActive(note);
    audioEngine.stop(note);
  }

  async function onStartF0(value: string) {
    const freq = noteOrFreq2freq(value as never);
    setFundamentalFrequency(freq);
    await audioEngine.play(value);
    setPlayingF0(true);
  }

  function onStopF0() {
    audioEngine.stop(defaultNote);
    setPlayingF0(false);
    setFundamentalFrequency(null);
  }

  async function toggleMidi() {
    if (midiEnabled) {
      audioEngine.disableMidi();
      setMidiEnabled(false);
      return;
    }
    const ok = await audioEngine.enableMidi(
      async (note: Note) => {
        addActive(note);
        await audioEngine.play(note);
      },
      (note: Note) => {
        removeActive(note);
        audioEngine.stop(note);
      },
    );
    setMidiEnabled(ok);
  }

  async function toggleMic() {
    if (micEnabled) {
      audioEngine.disableMic();
      setMicEnabled(false);
      setPitch(null);
      return;
    }
    const ok = await audioEngine.enableMic((pitch) => {
      setPitch(pitch);
    });
    setMicEnabled(ok);
  }

  return (
    <section className="space-y-6 pb-10">
      <div className="grid gap-4 rounded border border-zinc-300 bg-white p-5 shadow-sm md:grid-cols-2">
        <div className="md:col-span-2">
          <F0Control
            value={defaultNote}
            playing={playingF0}
            onValueChange={setDefaultNote}
            onStart={onStartF0}
            onStop={onStopF0}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Visualizer</span>
          <select
            className="h-11 border border-zinc-300 px-3 text-zinc-900 outline-none focus:border-zinc-500"
            value={visType}
            onChange={(event) => setVisType(event.target.value as VisType)}
          >
            <option value="spectrum">Spectrum</option>
            <option value="wave">Wave</option>
          </select>
        </label>

        <label className="flex items-center gap-3">
          <input
            checked={visualizationOn}
            className="h-4 w-4 accent-emerald-700"
            type="checkbox"
            onChange={(event) => setVisualizationOn(event.target.checked)}
          />
          <span className="text-zinc-800">Visualization enabled</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Harmonic Tilt (dB/oct)</span>
          <input
            className="h-11 border border-zinc-300 px-3 text-zinc-900 outline-none focus:border-zinc-500"
            type="number"
            min={-20}
            max={0}
            step={0.5}
            value={harmonicTilt}
            onChange={onHarmonicTiltChange}
          />
        </label>

        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Output Volume ({volume})</span>
          <input
            className="w-full accent-sky-600"
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={onVolumeChange}
          />
        </label>

        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 border border-zinc-300 bg-zinc-100 px-4 text-zinc-900 transition hover:bg-zinc-200"
              type="button"
              onClick={() => void toggleMidi()}
            >
              {midiEnabled ? 'Disable MIDI' : 'Enable MIDI'}
            </button>
            <button
              className="h-10 border border-zinc-300 bg-zinc-100 px-4 text-zinc-900 transition hover:bg-zinc-200"
              type="button"
              onClick={() => void toggleMic()}
            >
              {micEnabled ? 'Stop Mic' : 'Listen Mic'}
            </button>
            <button
              className="h-10 border border-zinc-300 bg-zinc-100 px-4 text-zinc-900 transition hover:bg-zinc-200"
              type="button"
              onClick={resetSandbox}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <Visualizer mode={visType} enabled={visualizationOn} />
      <Keyboard onNoteOn={onKeyOn} onNoteOff={onKeyOff} activeNotes={activeWithF0} />
      <Readout />
    </section>
  );
}
