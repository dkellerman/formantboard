import type { ChangeEvent } from 'react';
import { useSynthStore, type VisType } from '../store/useSynthStore';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function SandboxPage() {
  const defaultNote = useSynthStore((state) => state.defaultNote);
  const visType = useSynthStore((state) => state.visType);
  const visualizationOn = useSynthStore((state) => state.visualizationOn);
  const harmonicTilt = useSynthStore((state) => state.harmonicTilt);
  const volume = useSynthStore((state) => state.volume);
  const setDefaultNote = useSynthStore((state) => state.setDefaultNote);
  const setVisType = useSynthStore((state) => state.setVisType);
  const setVisualizationOn = useSynthStore((state) => state.setVisualizationOn);
  const setHarmonicTilt = useSynthStore((state) => state.setHarmonicTilt);
  const setVolume = useSynthStore((state) => state.setVolume);
  const resetSandbox = useSynthStore((state) => state.resetSandbox);

  function onVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    setVolume(clamp(Number(event.target.value), 0, 100));
  }

  function onHarmonicTiltChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) setHarmonicTilt(clamp(next, -20, 0));
  }

  return (
    <section className="space-y-6 pb-10">
      <div className="rounded border border-zinc-300 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-zinc-900">Sandbox (React + Zustand)</h2>
        <p className="mt-2 text-zinc-700">
          First real migrated settings panel. These controls are native React components backed by Zustand.
        </p>
      </div>

      <div className="grid gap-4 rounded border border-zinc-300 bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Fundamental</span>
          <input
            className="h-11 border border-zinc-300 px-3 text-zinc-900 outline-none focus:border-zinc-500"
            type="text"
            value={defaultNote}
            onChange={(event) => setDefaultNote(event.target.value)}
          />
        </label>

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
          <button
            className="h-10 border border-zinc-300 bg-zinc-100 px-4 text-zinc-900 transition hover:bg-zinc-200"
            type="button"
            onClick={resetSandbox}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
