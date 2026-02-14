import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import './tailwind.css';

function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-zinc-300 bg-sky-50 px-3 shadow-sm">
        <button
          className="relative z-[60] inline-flex h-9 w-9 items-center justify-center text-xl text-zinc-700 transition-colors hover:bg-zinc-200"
          type="button"
          onClick={() => setDrawer((value) => !value)}
        >
          ☰
        </button>
        <h1 className="m-0 text-xl font-medium tracking-tight">
          <Link className="text-zinc-900 no-underline hover:underline" to="/">
            FormantBoard
          </Link>
        </h1>
      </header>

      {drawer ? (
        <aside className="fixed left-0 top-0 z-40 h-screen w-[85vw] max-w-[375px] border-r border-zinc-300 bg-sky-50 p-5 shadow-lg">
          <nav className="mt-14 flex flex-col gap-4 text-xl">
            <Link className="text-zinc-900 no-underline hover:underline" to="/">
              Home
            </Link>
            <Link className="text-zinc-900 no-underline hover:underline" to="/sandbox">
              Sandbox
            </Link>
            <a
              className="text-zinc-900 no-underline hover:underline"
              href="https://github.com/dkellerman/formantboard"
            >
              Github
            </a>
            <a className="text-zinc-900 no-underline hover:underline" href="https://bipium.com">
              Metronome
            </a>
          </nav>
        </aside>
      ) : null}

      {drawer ? (
        <button
          className="fixed inset-0 z-[35] h-screen w-screen border-0 bg-transparent"
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
        />
      ) : null}

      <main className="pt-8">
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <section className="mx-auto flex w-[95vw] max-w-5xl flex-col gap-4 pb-10">
      <h2 className="text-2xl font-semibold text-zinc-900">Home</h2>
      <p className="text-zinc-700">
        React Router is now active. Home page migration can proceed here once the Zustand thread lands.
      </p>
    </section>
  );
}

function SandboxPage() {
  return (
    <section className="mx-auto flex w-[95vw] max-w-5xl flex-col gap-4 pb-10">
      <h2 className="text-2xl font-semibold text-zinc-900">Sandbox</h2>
      <p className="text-zinc-700">
        Sandbox route is wired with React Router and ready for component-by-component migration.
      </p>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="mx-auto flex w-[95vw] max-w-5xl flex-col gap-4 pb-10">
      <h2 className="text-2xl font-semibold text-zinc-900">Not found</h2>
      <p className="text-zinc-700">The requested route does not exist.</p>
    </section>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'sandbox', element: <SandboxPage /> },
      { path: 'index.html', element: <Navigate to="/" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById('app') as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
