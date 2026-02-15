import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/hooks/usePlayer";
import { useFormantboardApi } from "@/hooks/useFormantboardApi";

export function App() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const player = usePlayer();
  useFormantboardApi(player);

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <header
        className={cn(
          "sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-zinc-300",
          "bg-sky-50 px-3 shadow-sm",
        )}
      >
        <button
          className={cn(
            "relative z-[60] inline-flex h-9 w-9 items-center justify-center text-zinc-700",
            "transition-colors hover:bg-zinc-200",
          )}
          type="button"
          aria-label="Toggle menu"
          onClick={() => setDrawer((open) => !open)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="m-0 text-xl font-medium tracking-tight">
          <Link to="/" className="text-zinc-900 no-underline hover:underline">
            FormantBoard
          </Link>
        </h1>
      </header>

      {drawer ? (
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen w-[85vw] max-w-[375px] border-r border-zinc-300",
            "bg-sky-50 p-5 shadow-lg",
          )}
        >
          <nav className="mt-14 flex flex-col gap-4 text-xl">
            <Link to="/" className="text-zinc-900 no-underline hover:underline">
              Home
            </Link>
            <Link to="/sandbox" className="text-zinc-900 no-underline hover:underline">
              Sandbox
            </Link>
            <Link to="/api" className="text-zinc-900 no-underline hover:underline">
              API / AI Instructions
            </Link>
            <a
              href="https://github.com/dkellerman/formantboard"
              className="text-zinc-900 no-underline hover:underline"
            >
              Github
            </a>
            <a href="https://bipium.com" className="text-zinc-900 no-underline hover:underline">
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
