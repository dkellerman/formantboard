import { useState } from "react";
import { cn } from "@/lib/cn";
import { apiJsonSchemas } from "@/hooks/useAPIValidation";
import type { API, JSONPayload } from "@/types";

const SUPPORTED_IPA_VOWELS = ["ɑ", "ɛ", "ə", "æ", "ɔ", "u", "ʊ", "ɪ", "i"] as const;
const SUPPORTED_IPA_VOWELS_TEXT = SUPPORTED_IPA_VOWELS.join(", ");
const PLAY_EVENTS_SCHEMA_JSON = JSON.stringify(apiJsonSchemas.playEvents, null, 2);
const JSON_PAYLOAD_SCHEMA_JSON = JSON.stringify(apiJsonSchemas.jsonPayload, null, 2);

const BASIC_SAMPLE = JSON.stringify(
  {
    bpm: 100,
    voice: {
      vowel: "ɑ",
      volume: 0.7,
      tilt: -3,
    },
    notes: [
      { note: 60, time: 0, dur: 0.5, vowel: "ɑ" },
      { note: 64, time: 0.5, dur: 0.5, vowel: "ɛ" },
      { note: 67, time: 1, dur: 0.5, vowel: "i" },
      { note: 72, time: 1.5, dur: 0.75, vowel: "u" },
    ],
  },
  null,
  2,
);

const ADVANCED_SAMPLE = JSON.stringify(
  {
    bpm: 92,
    voice: {
      vowel: "ɑ",
      volume: 0.75,
      tilt: -5,
    },
    notes: [
      {
        note: 60,
        time: 0,
        dur: 0.5,
        vowel: "ɑ",
        formants: [{ index: 0, frequency: 760 }],
      },
      {
        note: 62,
        time: 0.5,
        dur: 0.5,
        vowel: "ɛ",
        formants: [{ index: 1, frequency: 1950 }],
      },
      {
        note: 64,
        time: 1,
        dur: 0.6,
        vowel: "i",
        formants: [{ index: 2, gain: 24 }],
      },
    ],
  },
  null,
  2,
);

const LOOP_SAMPLE = JSON.stringify(
  {
    bpm: 96,
    loop: 4,
    voice: {
      vowel: "ɑ",
      volume: 0.72,
      tilt: -4,
    },
    notes: [
      { note: 60, time: 0, dur: 0.5, vowel: "ɑ" },
      { note: 64, time: 0.5, dur: 0.5, vowel: "ɛ" },
      { note: 67, time: 1, dur: 0.5, vowel: "i" },
      { note: 72, time: 1.5, dur: 0.5, vowel: "u" },
    ],
  },
  null,
  2,
);

type HappyBirthdayStep = {
  note: string;
  beats: number;
  vowel?: (typeof SUPPORTED_IPA_VOWELS)[number];
};

function buildTimedNotes(steps: HappyBirthdayStep[]) {
  let time = 0;
  return steps.map((step) => {
    const next = {
      note: step.note,
      time: Number(time.toFixed(3)),
      dur: step.beats,
    } as {
      note: string;
      time: number;
      dur: number;
      vowel?: (typeof SUPPORTED_IPA_VOWELS)[number];
    };
    if (step.vowel) next.vowel = step.vowel;
    time += step.beats;
    return next;
  });
}

const HAPPY_BIRTHDAY_STEPS: HappyBirthdayStep[] = [
  { note: "G3", beats: 0.5, vowel: "æ" },
  { note: "G3", beats: 0.5, vowel: "ɪ" },
  { note: "A3", beats: 1, vowel: "ə" },
  { note: "G3", beats: 1, vowel: "ɛ" },
  { note: "C4", beats: 1, vowel: "u" },
  { note: "B3", beats: 2, vowel: "u" },
  { note: "G3", beats: 0.5, vowel: "æ" },
  { note: "G3", beats: 0.5, vowel: "ɪ" },
  { note: "A3", beats: 1, vowel: "ə" },
  { note: "G3", beats: 1, vowel: "ɛ" },
  { note: "D4", beats: 1, vowel: "u" },
  { note: "C4", beats: 2, vowel: "u" },
  { note: "G3", beats: 0.5, vowel: "æ" },
  { note: "G3", beats: 0.5, vowel: "ɪ" },
  { note: "G4", beats: 1, vowel: "ə" },
  { note: "E4", beats: 1, vowel: "ɛ" },
  { note: "C4", beats: 1, vowel: "ɪ" },
  { note: "B3", beats: 1, vowel: "u" },
  { note: "A3", beats: 2, vowel: "u" },
  { note: "F4", beats: 0.5, vowel: "æ" },
  { note: "F4", beats: 0.5, vowel: "ɪ" },
  { note: "E4", beats: 1, vowel: "ə" },
  { note: "C4", beats: 1, vowel: "ɛ" },
  { note: "D4", beats: 1, vowel: "u" },
  { note: "C4", beats: 2, vowel: "u" },
];

const HAPPY_BIRTHDAY_SAMPLE = JSON.stringify(
  {
    bpm: 100,
    voice: {
      volume: 0.75,
      tilt: -3,
    },
    notes: buildTimedNotes(HAPPY_BIRTHDAY_STEPS),
  },
  null,
  2,
);

type Status = {
  tone: "idle" | "ok" | "error";
  text: string;
};

type MethodParamDoc = {
  method: string;
  summary: string;
  signature: string;
  caveat?: string;
  params: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  shape?: string;
};

const METHOD_PARAM_DOCS: MethodParamDoc[] = [
  {
    method: "fb.schemas",
    summary:
      "Live Zod schema objects (safeParse-capable). Not JSON-serializable, so they may look empty when stringified.",
    signature: "fb.schemas = { playEvents: ZodSchema, jsonPayload: ZodSchema }",
    params: [],
  },
  {
    method: "fb.getSchemaJson()",
    summary: "Returns the plain JSON schemas as a fresh value for logging/tooling.",
    signature: "fb.getSchemaJson(): { playEvents: JSONSchema, jsonPayload: JSONSchema }",
    params: [],
  },
  {
    method: "fb.schemaJson",
    summary: "JSON Schema snapshots exported from the active Zod schemas.",
    signature: "fb.schemaJson = { playEvents: JSONSchema, jsonPayload: JSONSchema }",
    params: [],
  },
  {
    method: "fb.validatePlay(events)",
    summary: "Pre-validate events with Zod before scheduling.",
    signature:
      "fb.validatePlay(events: unknown): { ok: true; value: PlayEvent[] } | { ok: false; error: string }",
    caveat: `vowel must be one of: ${SUPPORTED_IPA_VOWELS_TEXT}`,
    params: [
      {
        name: "events",
        type: "unknown",
        required: true,
        description: "Any input. Use this for preflight before fb.play(events).",
      },
    ],
  },
  {
    method: "fb.validateFromJSON(payload)",
    summary: "Pre-validate JSON/object payload with Zod before scheduling.",
    signature:
      "fb.validateFromJSON(payload: unknown): { ok: true; value: NormalizedPerformancePayload } | { ok: false; error: string }",
    caveat: `voice.vowel and notes[].vowel must be one of: ${SUPPORTED_IPA_VOWELS_TEXT}`,
    params: [
      {
        name: "payload",
        type: "unknown",
        required: true,
        description: "Any input. Accepts JSON string or object and normalizes legacy aliases.",
      },
    ],
  },
  {
    method: "fb.play(events)",
    summary: "Schedule multiple note events using seconds from now.",
    signature:
      "fb.play(events: PlayEvent[], options?: { loop?: false | true | number | 'infinite' })",
    caveat: `vowel must be one of: ${SUPPORTED_IPA_VOWELS_TEXT}`,
    params: [
      {
        name: "events",
        type: "PlayEvent[]",
        required: true,
        description: "Each item is one note event. time/dur are in seconds from now.",
      },
      {
        name: "options.loop",
        type: "false | true | number | 'infinite'",
        required: false,
        description:
          "Loop mode override for this call: false=once, true/'infinite'=repeat until stop, number=total iterations.",
      },
    ],
    shape: `type PlayEvent = {
  note: number | string; // MIDI or note name like "C4"
  time: number; // seconds from now
  dur: number; // seconds
  velocity?: number; // 0..1
  vowel?: SupportedIPA;
  volume?: number; // 0..1
  tilt?: number;
  formants?: Array<{ index: number; on?: boolean; frequency?: number; Q?: number; gain?: number }>;
}`,
  },
  {
    method: "fb.fromJSON(payload)",
    summary: "Parse a payload using the same note fields as fb.play (optionally BPM-based).",
    signature: "fb.fromJSON(payload: string | PerformancePayload)",
    caveat: `voice.vowel and notes[].vowel must be one of: ${SUPPORTED_IPA_VOWELS_TEXT}`,
    params: [
      {
        name: "payload",
        type: "string | object",
        required: true,
        description: "Either JSON text or object with bpm/voice/notes.",
      },
    ],
    shape: `type PerformancePayload = {
  bpm?: number; // if set, time/dur are interpreted as beats
  loop?: false | true | number | "infinite"; // false=once, true/"infinite"=until stop, number=total iterations
  voice?: { vowel?: SupportedIPA; volume?: number; tilt?: number; formants?: FormantOverride[] };
  notes: Array<{
    note: number | string;
    time: number;
    dur: number;
    velocity?: number;
    vowel?: SupportedIPA;
    volume?: number;
    tilt?: number;
    formants?: FormantOverride[];
    // legacy aliases accepted but deprecated:
    m?: number; t?: number; d?: number; v?: number; ipa?: SupportedIPA; vol?: number; formantOverrides?: FormantOverride[];
  }>;
}`,
  },
  {
    method: "fb.setVoice(opts)",
    summary: "Set default voice settings used by later notes.",
    signature: "fb.setVoice(opts: VoiceOptions)",
    caveat: `vowel must be one of: ${SUPPORTED_IPA_VOWELS_TEXT}`,
    params: [
      {
        name: "opts",
        type: "VoiceOptions",
        required: true,
        description: "Default vowel/volume/tilt and optional formant overrides.",
      },
    ],
    shape: `type VoiceOptions = {
  vowel?: SupportedIPA;
  volume?: number; // 0..1
  tilt?: number;
  formants?: Array<{ index: number; on?: boolean; frequency?: number; Q?: number; gain?: number }>;
}`,
  },
  {
    method: "fb.setLoop(mode)",
    summary: "Set default loop mode used by future fb.play/fb.fromJSON calls.",
    signature: "fb.setLoop(mode: false | true | number | 'infinite')",
    params: [
      {
        name: "mode",
        type: "false | true | number | 'infinite'",
        required: true,
        description:
          "false=once, true/'infinite'=repeat until stop, number=total iterations (1 = once).",
      },
    ],
  },
  {
    method: "fb.getLoop()",
    summary: "Read current default loop mode.",
    signature: "fb.getLoop(): false | 'infinite' | number",
    params: [],
  },
  {
    method: "fb.setFormantActive(index, on)",
    summary: "Enable/disable one formant index (usually F1/F2/F3).",
    signature: "fb.setFormantActive(index: number, on: boolean)",
    params: [
      {
        name: "index",
        type: "number",
        required: true,
        description: "Formant index: 0=F1, 1=F2, 2=F3.",
      },
      {
        name: "on",
        type: "boolean",
        required: true,
        description: "Whether this formant should be active.",
      },
    ],
  },
];

export function ApiPage() {
  const [payload, setPayload] = useState(BASIC_SAMPLE);
  const [status, setStatus] = useState<Status>({
    tone: "idle",
    text: "Ready. Edit JSON and click Run.",
  });

  function runPayload() {
    try {
      const fb = (window as Window & { fb?: API }).fb;
      if (!fb) {
        throw new Error("window.fb is not available yet.");
      }
      const parsed = JSON.parse(payload) as JSONPayload;
      if (!Array.isArray(parsed.notes)) {
        throw new Error("Payload must include notes: []");
      }
      const validation = fb.validateFromJSON(parsed);
      if (!validation.ok) {
        throw new Error(validation.error);
      }
      fb.fromJSON(parsed);
      setStatus({
        tone: "ok",
        text: `Scheduled ${parsed.notes.length} note event(s).`,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not run payload.",
      });
    }
  }

  function prettifyPayload() {
    try {
      const parsed = JSON.parse(payload) as JSONPayload;
      setPayload(JSON.stringify(parsed, null, 2));
      setStatus({ tone: "ok", text: "JSON formatted." });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not format JSON.",
      });
    }
  }

  let statusColorClass = "text-muted-foreground";
  if (status.tone === "error") statusColorClass = "text-rose-700 dark:text-rose-400";
  if (status.tone === "ok") statusColorClass = "text-emerald-700 dark:text-emerald-400";

  return (
    <section className={cn("mx-auto flex w-[95vw] max-w-5xl flex-col gap-6 pb-10 text-sm")}>
      <header
        className={cn(
          "rounded-lg border border-sky-200 bg-sky-50 p-5 dark:border-sky-900/60 dark:bg-sky-950/30",
        )}
      >
        <h2 className={cn("m-0 text-2xl font-semibold text-foreground")}>FormantBoard API</h2>
        <p className={cn("mb-0 mt-2 text-muted-foreground")}>
          Use <code>window.fb</code> to schedule notes and shape vowels while playing.
        </p>
      </header>

      <section className={cn("rounded-lg border border-border bg-background p-5")}>
        <h3 className={cn("m-0 text-lg font-semibold text-foreground")}>AI Discovery</h3>
        <p className={cn("mb-0 mt-2 text-muted-foreground")}>
          For autonomous agents, publish these stable entrypoints:
        </p>
        <ul className={cn("mb-0 mt-2 list-disc space-y-1 pl-5 text-muted-foreground")}>
          <li>
            <code>/llms.txt</code> (primary machine-readable index)
          </li>
          <li>
            <code>/agents.txt</code> (compatibility mirror)
          </li>
          <li>
            <code>/api.md</code> (compact markdown method reference)
          </li>
          <li>
            runtime entrypoint: <code>window.fb</code>
          </li>
        </ul>
      </section>

      <section className={cn("rounded-lg border border-border bg-background p-5")}>
        <h3 className={cn("m-0 text-lg font-semibold text-foreground")}>Quick Start</h3>
        <ol className={cn("mb-0 mt-3 list-decimal space-y-1 pl-5 text-muted-foreground")}>
          <li>Write a payload with note events.</li>
          <li>
            Run <code>fb.validatePlay(...)</code> or <code>fb.validateFromJSON(...)</code> first. If
            invalid, stop and fix payload before playback.
          </li>
          <li>Set pitch + timing + duration on every event.</li>
          <li>Add vowel (and optional tilt) for articulation.</li>
          <li>Keep loop off unless the user explicitly asks for looping.</li>
          <li>Use only supported IPA vowels: {SUPPORTED_IPA_VOWELS_TEXT}.</li>
          <li>When formants are needed, usually target one formant (F1/F2/F3) at a time.</li>
        </ol>
      </section>

      <section className={cn("rounded-lg border border-border bg-background p-5")}>
        <h3 className={cn("m-0 text-lg font-semibold text-foreground")}>Core Methods</h3>
        <div className={cn("mt-3 overflow-x-auto")}>
          <table className={cn("w-full border-collapse text-left")}>
            <thead>
              <tr className={cn("border-b border-border text-muted-foreground")}>
                <th className={cn("py-2 pr-3 font-medium")}>Method</th>
                <th className={cn("py-2 pr-3 font-medium")}>Use</th>
                <th className="py-2 font-medium">Default vs Advanced</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.schemas</td>
                <td className="py-2 pr-3">Zod schema objects for play/fromJSON payloads</td>
                <td className="py-2">Default for agent introspection</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.getSchemaJson()</td>
                <td className="py-2 pr-3">Returns plain JSON schemas (best for logs/tools)</td>
                <td className="py-2">Default for non-JS tooling</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.schemaJson</td>
                <td className="py-2 pr-3">JSON Schema snapshots exported from zod</td>
                <td className="py-2">Default for direct property access</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.validatePlay(events)</td>
                <td className="py-2 pr-3">Pre-validate event arrays with Zod</td>
                <td className="py-2">Default before play</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.validateFromJSON(payload)</td>
                <td className="py-2 pr-3">Pre-validate JSON/object payloads with Zod</td>
                <td className="py-2">Default before fromJSON</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.play(events, options?)</td>
                <td className="py-2 pr-3">Schedule tempo-accurate note events</td>
                <td className="py-2">Default</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.fromJSON(payload)</td>
                <td className="py-2 pr-3">Run full JSON payload (BPM + voice + notes)</td>
                <td className="py-2">Default</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.setVoice(opts)</td>
                <td className="py-2 pr-3">Set default vowel/volume/tilt</td>
                <td className="py-2">Default</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.setLoop(mode)</td>
                <td className="py-2 pr-3">Set default loop mode (off / count / infinite)</td>
                <td className="py-2">Only when user explicitly requests looping</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.getLoop()</td>
                <td className="py-2 pr-3">Read current default loop mode</td>
                <td className="py-2">Inspection helper</td>
              </tr>
              <tr className={cn("border-b border-border/60")}>
                <td className="py-2 pr-3 font-mono">fb.setFormantActive(index, on)</td>
                <td className="py-2 pr-3">Toggle one formant (F1/F2/F3) for the active vowel</td>
                <td className="py-2">Default when formants are needed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={cn("rounded-lg border border-border bg-background p-5")}>
        <h3 className={cn("m-0 text-lg font-semibold text-foreground")}>Method Parameters</h3>
        <p className={cn("mb-0 mt-2 text-muted-foreground")}>
          Expand each method to see exact params and object shapes.
        </p>
        <p className={cn("mb-0 mt-1 font-mono text-xs text-muted-foreground")}>
          SupportedIPA = {SUPPORTED_IPA_VOWELS_TEXT}
        </p>
        <details className={cn("mt-2 rounded border border-border bg-muted/40 p-3")}>
          <summary className={cn("cursor-pointer font-medium text-foreground")}>
            Zod Schema Snapshot
          </summary>
          <p className={cn("mb-0 mt-2 text-xs text-muted-foreground")}>
            These are the same schemas exposed at <code>window.fb.schemaJson</code>.
          </p>
          <p className={cn("mb-0 mt-1 text-xs text-muted-foreground")}>
            Note: <code>window.fb.schemas</code> are live Zod objects and are not meant to be
            JSON-stringified.
          </p>
          <p className={cn("mb-0 mt-2 font-mono text-xs text-foreground")}>playEvents</p>
          <pre
            className={cn(
              "mt-1 max-h-40 overflow-auto rounded border border-border bg-background p-2 font-mono text-[11px] text-foreground",
            )}
          >
            {PLAY_EVENTS_SCHEMA_JSON}
          </pre>
          <p className={cn("mb-0 mt-2 font-mono text-xs text-foreground")}>jsonPayload</p>
          <pre
            className={cn(
              "mt-1 max-h-40 overflow-auto rounded border border-border bg-background p-2 font-mono text-[11px] text-foreground",
            )}
          >
            {JSON_PAYLOAD_SCHEMA_JSON}
          </pre>
        </details>
        <div className="mt-3 space-y-2">
          {METHOD_PARAM_DOCS.map((doc) => (
            <details
              key={doc.method}
              className={cn("rounded border border-border bg-muted/40 p-3")}
            >
              <summary className={cn("cursor-pointer font-mono text-sm text-foreground")}>
                {doc.method}
              </summary>
              <p className={cn("mb-0 mt-2 text-muted-foreground")}>{doc.summary}</p>
              {doc.caveat ? (
                <p className={cn("mb-0 mt-1 text-xs text-rose-700 dark:text-rose-400")}>
                  {doc.caveat}
                </p>
              ) : null}
              <p className={cn("mb-0 mt-2 font-mono text-xs text-foreground")}>{doc.signature}</p>
              <div className={cn("mt-2 overflow-x-auto rounded border border-border bg-background")}>
                <table className={cn("w-full border-collapse text-left text-xs")}>
                  <thead>
                    <tr className={cn("border-b border-border text-muted-foreground")}>
                      <th className={cn("px-2 py-1.5 font-medium")}>Param</th>
                      <th className={cn("px-2 py-1.5 font-medium")}>Type</th>
                      <th className={cn("px-2 py-1.5 font-medium")}>Required</th>
                      <th className={cn("px-2 py-1.5 font-medium")}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.params.map((param) => (
                      <tr
                        key={`${doc.method}-${param.name}`}
                        className={cn("border-b border-border/60")}
                      >
                        <td className={cn("px-2 py-1.5 font-mono text-foreground")}>{param.name}</td>
                        <td className={cn("px-2 py-1.5 font-mono text-foreground")}>{param.type}</td>
                        <td className={cn("px-2 py-1.5 text-foreground")}>
                          {param.required ? "yes" : "no"}
                        </td>
                        <td className={cn("px-2 py-1.5 text-muted-foreground")}>{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {doc.shape ? (
                <pre
                  className={cn(
                    "mt-2 overflow-x-auto rounded border border-border bg-background p-2 font-mono text-xs text-foreground",
                  )}
                >
                  {doc.shape}
                </pre>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      <section className={cn("rounded-lg border border-border bg-background p-5")}>
        <h3 className={cn("m-0 text-lg font-semibold text-foreground")}>Instructions for AI</h3>
        <details className={cn("mt-3 rounded border border-border bg-muted/40 p-3")}>
          <summary className={cn("cursor-pointer font-medium text-foreground")}>
            Melody Construction Process (with gotchas)
          </summary>
          <ol className={cn("mb-0 mt-3 list-decimal space-y-1 pl-5 text-muted-foreground")}>
            <li>
              Start melody-first: define full note+rhythm sequence front to back before vowel
              tweaks.
            </li>
            <li>Represent rhythm in beats, not ad-hoc seconds.</li>
            <li>
              Convert beats to cumulative start times: each note start = sum(previous durations).
            </li>
            <li>
              Use one canonical event shape: note, time, dur, velocity, vowel, volume, tilt,
              formants.
            </li>
            <li>
              Validate first, always: use <code>fb.validateFromJSON(payload)</code> before{" "}
              <code>fb.fromJSON(payload)</code> and abort on any validation error.
            </li>
            <li>
              Only after melody is correct, add IPA vowels while keeping note/time/dur unchanged.
            </li>
          </ol>
          <p className={cn("mb-0 mt-3 text-muted-foreground")}>
            Critical gotcha fixed here: scheduled repeated pitches (ex: G3, G3) were getting
            canceled by an immediate pre-stop path in the player. The player now only pre-stops on
            immediate retriggers, so repeated notes in scheduled melodies render correctly.
          </p>
          <p className={cn("mb-0 mt-3 font-mono text-xs text-foreground")}>
            Happy Birthday example in this page follows this exact process.
          </p>
        </details>
      </section>

      <section className={cn("rounded-lg border border-border bg-background p-5")}>
        <h3 className={cn("m-0 text-lg font-semibold text-foreground")}>Live JSON Sandbox</h3>
        <p className={cn("mb-0 mt-2 text-muted-foreground")}>
          Start with the basic sample. Switch to advanced only when you need explicit formant edits.
        </p>
        <p className={cn("mb-0 mt-1 text-muted-foreground")}>
          Happy Birthday sample is melody-first with IPA applied after timing. Loop sample
          demonstrates count-based looping.
        </p>
        <div className={cn("mt-3 flex flex-wrap gap-2")}>
          <button
            className={cn(
              "rounded border border-border bg-muted/40 px-3 py-1.5 text-foreground hover:bg-accent",
            )}
            type="button"
            onClick={() => setPayload(BASIC_SAMPLE)}
          >
            Load Basic Sample
          </button>
          <button
            className={cn(
              "rounded border border-border bg-muted/40 px-3 py-1.5 text-foreground hover:bg-accent",
            )}
            type="button"
            onClick={() => setPayload(ADVANCED_SAMPLE)}
          >
            Load Advanced Sample
          </button>
          <button
            className={cn(
              "rounded border border-border bg-muted/40 px-3 py-1.5 text-foreground hover:bg-accent",
            )}
            type="button"
            onClick={() => setPayload(LOOP_SAMPLE)}
          >
            Load Loop Sample
          </button>
          <button
            className={cn(
              "rounded border border-border bg-muted/40 px-3 py-1.5 text-foreground hover:bg-accent",
            )}
            type="button"
            onClick={() => setPayload(HAPPY_BIRTHDAY_SAMPLE)}
          >
            Load Happy Birthday (IPA)
          </button>
          <button
            className={cn(
              "rounded border border-border bg-muted/40 px-3 py-1.5 text-foreground hover:bg-accent",
            )}
            type="button"
            onClick={prettifyPayload}
          >
            Format JSON
          </button>
          <button
            className={cn(
              "rounded border border-sky-600 bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-700",
            )}
            type="button"
            onClick={runPayload}
          >
            Run Live
          </button>
        </div>
        <textarea
          className={cn(
            "mt-3 h-[360px] w-full rounded border border-border bg-background p-3 font-mono text-xs text-foreground",
          )}
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          spellCheck={false}
        />
        <p className={cn("mt-2", statusColorClass)}>{status.text}</p>
      </section>
    </section>
  );
}
