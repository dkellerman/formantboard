import { Link } from 'react-router-dom';
import { useSynthStore } from '../store/useSynthStore';

export function HomePage() {
  const defaultNote = useSynthStore((state) => state.defaultNote);
  const visType = useSynthStore((state) => state.visType);
  const visualizationOn = useSynthStore((state) => state.visualizationOn);

  return (
    <section className="space-y-6 pb-10">
      <div className="rounded border border-zinc-300 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-zinc-900">FormantBoard</h2>
        <p className="mt-2 text-zinc-700">
          React app with Zustand state and live audio controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded border border-zinc-300 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Default Note</h3>
          <p className="mt-2 text-xl text-zinc-900">{defaultNote}</p>
        </article>
        <article className="rounded border border-zinc-300 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Visualizer Mode</h3>
          <p className="mt-2 text-xl capitalize text-zinc-900">{visType}</p>
        </article>
        <article className="rounded border border-zinc-300 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Visualization</h3>
          <p className="mt-2 text-xl text-zinc-900">{visualizationOn ? 'On' : 'Off'}</p>
        </article>
      </div>

      <div className="rounded border border-zinc-300 bg-sky-50 p-4 text-zinc-800">
        <p className="text-sm">
          Open <Link className="font-semibold underline" to="/sandbox">Sandbox</Link> to play notes and tune settings.
        </p>
      </div>
    </section>
  );
}
