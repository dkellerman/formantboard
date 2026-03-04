import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/hooks/usePlayer";
import { useAPI } from "@/hooks/useAPI";
import { useThemeMode } from "@/hooks/useThemeMode";
import { ThemeModeSelect } from "@/components/ThemeModeSelect";

export function App() {
  const [drawer, setDrawer] = useState(false);
  const { themeMode, setThemeMode } = useThemeMode();
  const location = useLocation();
  const player = usePlayer();
  useAPI(player);

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  return (
    <div className={cn("min-h-screen")}>
      <header
        className={cn(
          "sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border",
          "bg-gradient-to-r from-primary/10 via-accent/45 to-accent/30",
          "dark:from-accent/30 dark:via-accent/45 dark:to-primary/10",
          "px-3 text-foreground shadow-sm backdrop-blur",
        )}
      >
        <button
          className={cn(
            "relative z-[60] inline-flex size-9 items-center justify-center text-muted-foreground",
            "transition-colors hover:bg-accent hover:text-accent-foreground",
            "motion-safe:transition-transform motion-safe:hover:scale-[1.04]",
          )}
          type="button"
          aria-label="Toggle menu"
          onClick={() => setDrawer((open) => !open)}
        >
          <Menu className={cn("size-5")} />
        </button>
        <h1 className={cn("m-0 text-xl font-medium tracking-tight")}>
          <Link to="/" className={cn("text-foreground no-underline hover:underline")}>
            FormantBoard
          </Link>
        </h1>
      </header>

      <aside
        aria-hidden={!drawer}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-[85vw] max-w-[375px] border-r border-border",
          "bg-accent/60 dark:bg-accent/40",
          "p-5 text-card-foreground shadow-lg backdrop-blur",
          "transform-gpu transition-transform duration-300 ease-out",
          drawer ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className={cn("mt-14 flex flex-col gap-4 text-xl")}>
          <Link to="/" className={cn("text-foreground no-underline hover:underline")}>
            Home
          </Link>
          <Link to="/sandbox" className={cn("text-foreground no-underline hover:underline")}>
            Advanced sandbox
          </Link>
          <Link to="/api" className={cn("text-foreground no-underline hover:underline")}>
            API / AI Instructions
          </Link>
          <a
            href="https://github.com/dkellerman/formantboard"
            className={cn("text-foreground no-underline hover:underline")}
          >
            Code
          </a>
          <a
            href="https://bipium.com"
            className={cn("text-foreground no-underline hover:underline")}
          >
            Metronome
          </a>
        </nav>
        <div className={cn("mt-6 border-t border-border pt-4")}>
          <div
            className={cn("mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground")}
          >
            Theme mode
          </div>
          <ThemeModeSelect value={themeMode} onChange={setThemeMode} className={cn("h-9 w-full")} />
        </div>
      </aside>

      <button
        className={cn(
          "fixed inset-0 z-[35] h-screen w-screen border-0 bg-background/70",
          "transition-opacity duration-300 ease-out",
          drawer ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        type="button"
        aria-label="Close menu"
        onClick={() => setDrawer(false)}
      />

      <main className={cn("pt-8")}>
        <Outlet />
      </main>
    </div>
  );
}
