import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="rounded border border-zinc-300 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-zinc-900">Not Found</h2>
      <p className="mt-2 text-zinc-700">The route you requested does not exist.</p>
      <Link className="mt-4 inline-block text-zinc-900 underline" to="/">
        Go Home
      </Link>
    </section>
  );
}
