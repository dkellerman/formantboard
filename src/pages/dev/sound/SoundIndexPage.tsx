import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { SOUND_RESOURCES, SOUND_TOPICS } from "./soundTopics";

const shellClass = "mx-auto w-full max-w-5xl px-4 pb-24";
const panelClass =
  "rounded-[28px] border border-stone-200/80 bg-stone-50/90 shadow-[0_20px_80px_-50px_rgba(28,25,23,0.35)]";

export function SoundIndexPage() {
  return (
    <section className={cn(shellClass)}>
      <div
        className={cn(
          "overflow-hidden rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_45%,#ecfeff_100%)]",
          "p-6 shadow-[0_25px_90px_-55px_rgba(14,116,144,0.45)] sm:p-8",
        )}
      >
        <div className={cn("flex flex-wrap items-center justify-between gap-3")}>
          <div className={cn("space-y-3")}>
            <p className={cn("m-0 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700")}>
              Dev / Sound
            </p>
            <h1 className={cn("m-0 max-w-3xl font-serif text-4xl tracking-tight text-stone-900")}>
              App-grounded sound issues in FormantBoard
            </h1>
            <p className={cn("m-0 max-w-2xl text-sm leading-6 text-stone-700 sm:text-base")}>
              Ranked by what looks most worth fixing in the current synthesis engine. Each page is
              about what the app actually does today, why that limits the tone, and where to change
              the code.
            </p>
          </div>
          <Link
            to="/dev"
            className={cn(
              "inline-flex items-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm text-stone-700 no-underline transition-colors hover:bg-white",
            )}
          >
            Back to dev
          </Link>
        </div>
      </div>

      <div className={cn("mt-6 space-y-3")}>
        {SOUND_TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            to={`/dev/sound/${topic.slug}`}
            className={cn(
              panelClass,
              "block p-4 no-underline transition-transform motion-safe:hover:-translate-y-0.5 sm:p-5",
            )}
          >
            <div className={cn("flex flex-wrap items-start gap-4 sm:flex-nowrap")}>
              <div
                className={cn(
                  "inline-flex min-w-[4.5rem] shrink-0 rounded-full bg-teal-700 px-3 py-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white",
                )}
              >
                #{topic.priority}
              </div>
              <div className={cn("min-w-0 flex-1 space-y-2")}>
                <div className={cn("space-y-1")}>
                  <h2 className={cn("m-0 text-xl font-semibold tracking-tight text-stone-900")}>
                    {topic.title}
                  </h2>
                  <p className={cn("m-0 text-sm leading-6 text-stone-700")}>{topic.summary}</p>
                </div>
                <p className={cn("m-0 text-sm leading-6 text-stone-600")}>
                  {topic.currentBehavior}
                </p>
              </div>
              <div className={cn("text-sm font-medium text-teal-700")}>Open</div>
            </div>
          </Link>
        ))}
      </div>

      <div className={cn("mt-8 rounded-[28px] border border-stone-200/80 bg-white p-5 sm:p-6")}>
        <h2 className={cn("m-0 text-xl font-semibold tracking-tight text-stone-900")}>
          Resource Shelf
        </h2>
        <p className={cn("mt-2 m-0 max-w-3xl text-sm leading-6 text-stone-600")}>
          These references are here to support code decisions: source-filter modeling, explicit
          synthesis parameterization, and the acoustic reason singing often needs different tract
          behavior than speech.
        </p>
        <ul className={cn("mt-4 space-y-3 pl-5 text-sm leading-6 text-stone-700")}>
          {SOUND_RESOURCES.map((resource) => (
            <li key={resource.id}>
              <a
                href={resource.url}
                className={cn("font-medium text-teal-700 underline underline-offset-2")}
                target="_blank"
                rel="noreferrer"
              >
                {resource.title}
              </a>
              {" - "}
              {resource.note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
