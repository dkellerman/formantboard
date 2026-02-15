import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/store";
import { usePlayer } from "@/hooks/usePlayer";
import { VisType } from "@/constants";
import { Keyboard } from "@/components/Keyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Visualizer } from "@/components/Visualizer";
import { MidiButton } from "@/components/MidiButton";
import { MicButton } from "@/components/MicButton";
import { Readout } from "@/components/Readout";
import { Button } from "@/components/ui/button";
import type { FormantboardAPI, FormantboardJSONPayload } from "@/types";
import { note2freq, type Note } from "@/utils";

const HOME_API_SAMPLE = JSON.stringify(
  {
    bpm: 100,
    voice: { vowel: "ɑ", volume: 0.7, tilt: -3 },
    notes: [
      { note: 60, time: 0, dur: 0.5, vowel: "ɑ" },
      { note: 64, time: 0.5, dur: 0.5, vowel: "ɛ" },
      { note: 67, time: 1, dur: 0.5, vowel: "i" },
    ],
  },
  null,
  2,
);

export function HomePage() {
  const { settings } = useAppContext();
  const player = usePlayer();
  const [visType, setVisType] = useState<VisType>(settings.defaultVisType);
  const [midiNotes, setMidiNotes] = useState<Set<string>>(new Set());
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiPayload, setApiPayload] = useState("");
  const [apiPayloadSeeded, setApiPayloadSeeded] = useState(false);
  const [aiPasteStatus, setAiPasteStatus] = useState("Ready.");
  const [aiPrompt, setAiPrompt] = useState("");
  const [llmGenerating, setLlmGenerating] = useState(false);

  function runAIPayload(raw: string) {
    const text = raw.trim();
    if (!text) {
      setAiPasteStatus("Ignored empty payload.");
      return;
    }

    try {
      const fb = (window as Window & { fb?: FormantboardAPI }).fb;
      if (!fb) {
        throw new Error("window.fb is not available yet.");
      }

      const parsed = JSON.parse(text) as FormantboardJSONPayload;
      if (!Array.isArray(parsed.notes)) {
        throw new Error("Payload must include notes: []");
      }

      const validation = fb.validateFromJSON(parsed);
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      fb.fromJSON(parsed);
      setAiPasteStatus(`Scheduled ${parsed.notes.length} note event(s).`);
    } catch (error) {
      setAiPasteStatus(error instanceof Error ? error.message : "Could not run payload.");
    }
  }

  function noteId(note: Note) {
    return note.replace("#", "s");
  }

  function prettifyPayload() {
    try {
      const parsed = JSON.parse(apiPayload) as FormantboardJSONPayload;
      setApiPayload(JSON.stringify(parsed, null, 2));
      setAiPasteStatus("JSON formatted.");
    } catch (error) {
      setAiPasteStatus(error instanceof Error ? error.message : "Could not format JSON.");
    }
  }

  async function generateAndPlayFromPrompt() {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      return;
    }

    const fb = (window as Window & { fb?: FormantboardAPI }).fb;
    if (!fb) {
      return;
    }
    const apiKey = (import.meta.env.VITE_OPENAI_KEY as string | undefined)?.trim() ?? "";
    if (!apiKey) {
      return;
    }

    setLlmGenerating(true);

    try {
      const schema = JSON.stringify(fb.schemaJson?.jsonPayload ?? {}, null, 2);
      const system = [
        "You generate valid FormantBoard performance payload JSON only.",
        "Return exactly one JSON object and no markdown.",
        "It must satisfy the provided JSON schema.",
        "Keep phrases musical and concise, 8-24 notes unless requested otherwise.",
      ].join(" ");
      const user = [
        `Request: ${prompt}`,
        "Output format: JSON object with a notes array.",
        "Use this schema:",
        schema,
      ].join("\n\n");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM request failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Model returned empty content.");
      }

      const parsed = JSON.parse(content) as FormantboardJSONPayload;
      const validation = fb.validateFromJSON(parsed);
      if (!validation.ok) {
        throw new Error(`Validation failed: ${validation.error}`);
      }

      fb.fromJSON(parsed);
      const pretty = JSON.stringify(parsed, null, 2);
      setApiPayload(pretty);
      setAiPasteStatus(`Scheduled ${parsed.notes.length} note event(s).`);
    } catch (error) {
      void error;
    } finally {
      setLlmGenerating(false);
    }
  }

  return (
    <section className="flex flex-col items-center gap-0">
      <div className="w-[95vw]">
        <SettingsPanel className="mb-3" visType={visType} onVisTypeChange={setVisType} />
        {settings.viz.on ? <Visualizer vtype={visType} height={150} /> : null}
        <Keyboard
          activeNotes={midiNotes}
          onKeyOn={(note, velocity) => player.play(note, velocity)}
          onKeyOff={(note) => player.stop(note)}
        />
      </div>
      <div className="my-10 inline-flex gap-5">
        <MidiButton
          text="MIDI"
          onNoteOn={(note, velocity) => {
            player.play(note2freq(note), velocity);
            setMidiNotes((prev) => new Set(prev).add(noteId(note)));
          }}
          onNoteOff={(note) => {
            player.stop(note2freq(note));
            setMidiNotes((prev) => {
              const next = new Set(prev);
              next.delete(noteId(note));
              return next;
            });
          }}
        />
        <MicButton startText="Listen" stopText="Stop" />
        <Button
          variant="outline"
          onClick={() => {
            setApiModalOpen(true);
            if (!apiPayloadSeeded) {
              setApiPayload(HOME_API_SAMPLE);
              setApiPayloadSeeded(true);
            }
            setAiPasteStatus("Ready. Paste JSON and click Run.");
          }}
        >
          API
        </Button>
      </div>
      <Readout />
      <section className="mb-10 mt-6 w-[95vw] max-w-[560px] rounded-md border border-zinc-300 bg-zinc-50 p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void generateAndPlayFromPrompt();
            setAiPrompt("");
          }}
        >
          <input
            id="fb-ai-prompt"
            type="text"
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            placeholder="Type a song prompt, e.g. Play twinkle twinkle little star"
          />
          <Button
            variant="default"
            size="sm"
            className="bg-sky-600 px-4 text-white hover:bg-sky-500"
            disabled={llmGenerating}
            type="submit"
          >
            {llmGenerating ? "Sending..." : "Send"}
          </Button>
        </form>
      </section>

      {apiModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <button
            type="button"
            aria-label="Close API modal"
            className="absolute inset-0 border-0 bg-zinc-950/45"
            onClick={() => setApiModalOpen(false)}
          />
          <section className="relative z-[71] w-[min(92vw,700px)] rounded-md border border-zinc-300 bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h2 className="m-0 text-lg font-medium text-zinc-900">Run JSON API Payload</h2>
              <button
                type="button"
                className="h-8 w-8 rounded border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                aria-label="Close API modal"
                onClick={() => setApiModalOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="mb-2 mt-0 text-sm text-zinc-700">
              Paste payload JSON for <code>window.fb.fromJSON</code>. See{" "}
              <Link to="/api" className="text-zinc-900 underline">
                /api instructions
              </Link>
              .
            </p>
            <textarea
              id="fb-api-modal-json"
              name="fb-api-modal-json"
              data-testid="fb-api-modal-json"
              data-ai-json-input="true"
              className="h-60 w-full resize-y rounded-md border border-zinc-300 p-3 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder='{"notes":[{"note":60,"time":0,"dur":0.5}]}'
              spellCheck={false}
              value={apiPayload}
              onChange={(event) => setApiPayload(event.target.value)}
            />
            <output
              id="fb-ai-json-status"
              data-testid="fb-ai-json-status"
              data-ai-json-status="true"
              aria-live="polite"
              className="mt-2 block min-h-5 text-sm text-zinc-700"
            >
              {aiPasteStatus}
            </output>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="default" onClick={() => runAIPayload(apiPayload)}>
                Run
              </Button>
              <Button variant="secondary" onClick={prettifyPayload}>
                Format
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setApiPayload("");
                  setAiPasteStatus("Cleared.");
                }}
              >
                Clear
              </Button>
              <Button variant="outline" onClick={() => setApiModalOpen(false)}>
                Close
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
