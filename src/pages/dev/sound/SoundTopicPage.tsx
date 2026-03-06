import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { SOUND_NOTE_OPTIONS, useSoundDemo } from "./soundAudio";
import { SOUND_RESOURCE_BY_ID, SOUND_TOPICS, SOUND_TOPIC_BY_SLUG } from "./soundTopics";

const shellClass = "mx-auto w-full max-w-5xl px-4 pb-24";
const cardClass =
  "rounded-[28px] border border-stone-200/80 bg-stone-50/90 p-5 shadow-[0_20px_80px_-50px_rgba(28,25,23,0.35)] sm:p-6";

function TopicNav({ index }: { index: number }) {
  const prev = SOUND_TOPICS[index - 1];
  const next = SOUND_TOPICS[index + 1];

  return (
    <div className={cn("flex flex-wrap gap-3")}>
      {prev ? (
        <Link
          to={`/dev/sound/${prev.slug}`}
          className={cn(
            "inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 no-underline hover:bg-white",
          )}
        >
          Previous
        </Link>
      ) : null}
      {next ? (
        <Link
          to={`/dev/sound/${next.slug}`}
          className={cn(
            "inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 no-underline hover:bg-white",
          )}
        >
          Next
        </Link>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  items,
  open = false,
}: {
  title: string;
  items: string[];
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className={cn("rounded-2xl border border-stone-200 bg-white/80 p-4", "group")}
    >
      <summary
        className={cn(
          "cursor-pointer list-none text-sm font-semibold tracking-tight text-stone-900",
          "marker:hidden",
        )}
      >
        {title}
      </summary>
      <ul className={cn("mt-3 space-y-2 pl-5 text-sm leading-7 text-stone-700")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

function CodeTargetsSection({
  targets,
}: {
  targets: Array<{ file: string; symbol: string; note: string }>;
}) {
  return (
    <details open className={cn("rounded-2xl border border-stone-200 bg-white/80 p-4")}>
      <summary
        className={cn(
          "cursor-pointer list-none text-sm font-semibold tracking-tight text-stone-900",
          "marker:hidden",
        )}
      >
        Code targets
      </summary>
      <div className={cn("mt-3 space-y-3")}>
        {targets.map((target) => (
          <div key={`${target.file}:${target.symbol}`} className={cn("rounded-xl border border-stone-200 p-3")}>
            <div className={cn("text-xs font-semibold uppercase tracking-[0.16em] text-stone-500")}>
              {target.file}
            </div>
            <div className={cn("mt-1 text-sm font-medium text-stone-900")}>{target.symbol}</div>
            <p className={cn("mt-2 m-0 text-sm leading-6 text-stone-700")}>{target.note}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

export function SoundTopicPage() {
  const { topic: topicSlug } = useParams();
  const topic = topicSlug ? SOUND_TOPIC_BY_SLUG[topicSlug] : null;
  const topicIndex = topic ? SOUND_TOPICS.findIndex((item) => item.slug === topic.slug) : -1;
  const { activeDemo, play, stop } = useSoundDemo();
  const [note, setNote] = useState(topic?.recommendedNote ?? "E3");

  useEffect(() => {
    if (!topic) return;
    stop();
    setNote(topic.recommendedNote);
  }, [stop, topic]);

  if (!topic || topicIndex < 0) {
    return <Navigate to="/dev/sound" replace />;
  }

  const isPlayingProblem =
    activeDemo?.demoId === topic.demoId && activeDemo.variant === "problem";
  const isPlayingBetter =
    activeDemo?.demoId === topic.demoId && activeDemo.variant === "better";
  const resources = topic.resourceIds.map((resourceId) => SOUND_RESOURCE_BY_ID[resourceId]);

  return (
    <section className={cn(shellClass)}>
      <div className={cn("flex flex-wrap items-center gap-3 text-sm text-stone-600")}>
        <Link to="/dev" className={cn("text-teal-700 underline underline-offset-2")}>
          Dev
        </Link>
        <span>/</span>
        <Link to="/dev/sound" className={cn("text-teal-700 underline underline-offset-2")}>
          Sound
        </Link>
      </div>

      <div
        className={cn(
          "mt-4 overflow-hidden rounded-[32px] border border-stone-200 bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_42%,#ecfeff_100%)]",
          "p-6 shadow-[0_25px_90px_-55px_rgba(14,116,144,0.45)] sm:p-8",
        )}
      >
        <div className={cn("flex flex-wrap items-start justify-between gap-4")}>
          <div className={cn("max-w-3xl space-y-3")}>
            <p
              className={cn("m-0 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700")}
            >
              Priority #{topic.priority}
            </p>
            <h1 className={cn("m-0 font-serif text-4xl tracking-tight text-stone-900")}>
              {topic.title}
            </h1>
            <p className={cn("m-0 text-base leading-7 text-stone-700")}>{topic.summary}</p>
          </div>
          <TopicNav index={topicIndex} />
        </div>
      </div>

      <div className={cn("mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]")}>
        <div className={cn("space-y-6")}>
          <article className={cn(cardClass)}>
            <h2 className={cn("m-0 text-lg font-semibold tracking-tight text-stone-900")}>
              What The App Does Now
            </h2>
            <p className={cn("mt-3 m-0 text-sm leading-7 text-stone-700")}>
              {topic.currentBehavior}
            </p>
            <p className={cn("mt-4 m-0 text-sm leading-7 text-stone-700")}>
              <span className={cn("font-semibold text-stone-900")}>Why this matters:</span>{" "}
              {topic.whyItMatters}
            </p>
          </article>

          <article className={cn(cardClass)}>
            <h2 className={cn("m-0 text-lg font-semibold tracking-tight text-stone-900")}>
              Acoustic Target
            </h2>
            <p className={cn("mt-3 m-0 text-sm leading-7 text-stone-700")}>
              {topic.acousticModel}
            </p>
            <details className={cn("mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4")}>
              <summary
                className={cn(
                  "cursor-pointer list-none text-sm font-semibold tracking-tight text-stone-900",
                  "marker:hidden",
                )}
              >
                Generic singing takeaway
              </summary>
              <p className={cn("mt-3 m-0 text-sm leading-7 text-stone-700")}>
                {topic.genericAdvice}
              </p>
            </details>
          </article>

          <article className={cn(cardClass)}>
            <h2 className={cn("m-0 text-lg font-semibold tracking-tight text-stone-900")}>
              Rewrite Plan
            </h2>
            <div className={cn("mt-4 space-y-3")}>
              <DetailSection title="Root cause in the current architecture" items={topic.rootCause} open />
              <DetailSection title="Implementation moves" items={topic.implementationMoves} />
              <CodeTargetsSection targets={topic.codeTargets} />
              <DetailSection title="How to verify the change" items={topic.verification} />
              <DetailSection title="Fastest prototype path" items={topic.prototype} />
            </div>
          </article>
        </div>

        <aside className={cn("space-y-6")}>
          <div
            className={cn(
              cardClass,
              "bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(236,254,255,0.88)_100%)]",
            )}
          >
            <div className={cn("space-y-2")}>
              <p className={cn("m-0 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700")}>
                Audio Example
              </p>
              <h2 className={cn("m-0 text-lg font-semibold tracking-tight text-stone-900")}>
                {topic.exampleLabel}
              </h2>
              <p className={cn("m-0 text-sm leading-6 text-stone-600")}>
                This A/B uses the real FormantBoard player. The dev page temporarily patches live
                player settings or per-note overrides, then plays the note through the actual runtime.
              </p>
            </div>

            <div className={cn("mt-5 space-y-2")}>
              <div className={cn("text-xs font-semibold uppercase tracking-[0.18em] text-stone-500")}>
                Demo note
              </div>
              <Select value={note} onValueChange={setNote}>
                <SelectTrigger className={cn("h-11 bg-white/90")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUND_NOTE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cn("mt-5 space-y-3")}>
              <div className={cn("rounded-2xl border border-rose-200 bg-rose-50/90 p-4")}>
                <p className={cn("m-0 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700")}>
                  Problem
                </p>
                <p className={cn("mt-2 m-0 text-sm leading-6 text-stone-700")}>
                  {topic.exampleProblem}
                </p>
                <Button
                  className={cn("mt-3 w-full")}
                  variant={isPlayingProblem ? "secondary" : "outline"}
                  onClick={() => play(topic.demoId, "problem", note)}
                >
                  {isPlayingProblem ? "Playing problem..." : "Play problem"}
                </Button>
              </div>

              <div className={cn("rounded-2xl border border-teal-200 bg-teal-50/90 p-4")}>
                <p className={cn("m-0 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700")}>
                  Better
                </p>
                <p className={cn("mt-2 m-0 text-sm leading-6 text-stone-700")}>
                  {topic.exampleBetter}
                </p>
                <Button
                  className={cn("mt-3 w-full")}
                  variant={isPlayingBetter ? "secondary" : "default"}
                  onClick={() => play(topic.demoId, "better", note)}
                >
                  {isPlayingBetter ? "Playing better..." : "Play better"}
                </Button>
              </div>

              <Button className={cn("w-full")} variant="ghost" onClick={stop}>
                Stop audio
              </Button>
            </div>
          </div>

          <div className={cn(cardClass)}>
            <h2 className={cn("m-0 text-lg font-semibold tracking-tight text-stone-900")}>
              What to Listen For
            </h2>
            <ul className={cn("mt-3 space-y-2 pl-5 text-sm leading-6 text-stone-700")}>
              {topic.listenFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={cn(cardClass)}>
            <h2 className={cn("m-0 text-lg font-semibold tracking-tight text-stone-900")}>
              References
            </h2>
            <ul className={cn("mt-3 space-y-3 pl-5 text-sm leading-6 text-stone-700")}>
              {resources.map((resource) => (
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
        </aside>
      </div>
    </section>
  );
}
