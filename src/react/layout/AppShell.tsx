import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSynthStore } from '../store/useSynthStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-zinc-900 no-underline hover:underline ${isActive ? 'font-semibold underline' : ''}`;

const headerClass =
  'sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-zinc-300 bg-sky-50/95 px-3 shadow-sm backdrop-blur';

const menuButtonClass =
  'inline-flex h-9 w-9 items-center justify-center text-xl text-zinc-700 transition-colors hover:bg-zinc-200';

const asideClass =
  'fixed left-0 top-0 z-40 h-screen w-[85vw] max-w-[375px] border-r border-zinc-300 bg-sky-50 p-5 shadow-lg';

export function AppShell() {
  const location = useLocation();
  const drawerOpen = useSynthStore((state) => state.drawerOpen);
  const toggleDrawer = useSynthStore((state) => state.toggleDrawer);
  const closeDrawer = useSynthStore((state) => state.closeDrawer);

  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-zinc-50 to-white">
      <header className={headerClass}>
        <button
          className={menuButtonClass}
          type="button"
          aria-label="Toggle menu"
          onClick={toggleDrawer}
        >
          ☰
        </button>
        <h1 className="m-0 text-xl font-medium tracking-tight">
          <NavLink className="text-zinc-900 no-underline hover:underline" to="/sandbox">
            FormantBoard
          </NavLink>
        </h1>
      </header>

      {drawerOpen ? (
        <>
          <aside className={asideClass}>
            <nav className="mt-14 flex flex-col gap-4 text-xl">
              <NavLink className={navLinkClass} to="/sandbox">
                Home
              </NavLink>
              <NavLink className={navLinkClass} to="/sandbox">
                Sandbox
              </NavLink>
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
          <button
            className="fixed inset-0 z-[35] h-screen w-screen border-0 bg-transparent"
            type="button"
            aria-label="Close menu"
            onClick={closeDrawer}
          />
        </>
      ) : null}

      <main className="mx-auto w-[95vw] max-w-6xl pt-8">
        <Outlet />
      </main>
    </div>
  );
}
