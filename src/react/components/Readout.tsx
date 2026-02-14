import { useSynthStore } from '../store/useSynthStore';

export function Readout() {
  const pitch = useSynthStore((state) => state.pitch);
  const rmsDb = useSynthStore((state) => state.rmsDb);
  const volume = useSynthStore((state) => state.volume);
  const midiEnabled = useSynthStore((state) => state.midiEnabled);
  const micEnabled = useSynthStore((state) => state.micEnabled);

  return (
    <section className="grid gap-3 rounded border border-zinc-300 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <h3 className="text-xs uppercase tracking-wide text-zinc-500">Pitch</h3>
        <p className="text-sm text-zinc-900">
          {pitch ? `${pitch.note} (${pitch.freq.toFixed(1)}hz, ${pitch.cents >= 0 ? '+' : ''}${pitch.cents}c)` : '—'}
        </p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wide text-zinc-500">RMS</h3>
        <p className="text-sm text-zinc-900">{Number.isFinite(rmsDb) ? `${rmsDb.toFixed(1)} dB` : '—'}</p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wide text-zinc-500">Volume</h3>
        <p className="text-sm text-zinc-900">{volume}</p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wide text-zinc-500">MIDI</h3>
        <p className="text-sm text-zinc-900">{midiEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wide text-zinc-500">Mic</h3>
        <p className="text-sm text-zinc-900">{micEnabled ? 'Listening' : 'Off'}</p>
      </div>
    </section>
  );
}
