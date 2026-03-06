import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

const DEV_LINKS = [
  { to: "/dev/sound", label: "Sound: high-impact vowel tone ideas" },
  { to: "/dev/response", label: "Response sandbox" },
  { to: "/dev/test", label: "Audio test bench" },
];

export function DevIndexPage() {
  return (
    <section className={cn("mx-auto w-full max-w-3xl px-4 pb-20")}>
      <header className={cn("space-y-2")}>
        <h1 className={cn("m-0 text-2xl font-semibold tracking-tight text-zinc-900")}>Dev</h1>
        <p className={cn("m-0 text-sm text-zinc-600")}>
          Internal notes, analysis, and experiments.
        </p>
        <Link to="/" className={cn("text-xs text-sky-700 underline")}>
          Back to home
        </Link>
      </header>
      <ul className={cn("mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-700")}>
        {DEV_LINKS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className={cn("text-sky-700 underline")}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
