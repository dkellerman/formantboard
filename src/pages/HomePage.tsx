import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/store";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/hooks/usePlayer";
import { usePromptToPayload } from "@/hooks/usePromptToPayload";
import { VisType } from "@/constants";
import { AIPromptInput } from "@/components/AIPromptInput";
import { Keyboard } from "@/components/Keyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Visualizer } from "@/components/Visualizer";
import { MidiButton } from "@/components/MidiButton";
import { MicButton } from "@/components/MicButton";
import { Readout } from "@/components/Readout";
import { Button } from "@/components/ui/button";
import type { FormantboardAPI, FormantboardJSONPayload } from "@/types";
import { note2freq } from "@/utils";

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
  const { settings, player: playerState } = useAppContext();
  const player = usePlayer();
  const [visType, setVisType] = useState<VisType>(settings.defaultVisType);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiPayload, setApiPayload] = useState("");
  const [apiPayloadSeeded, setApiPayloadSeeded] = useState(false);
  const [aiPasteStatus, setAiPasteStatus] = useState("Ready.");
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  const handlePromptPayloadReady = useCallback((prettyPayload: string) => {
    setApiPayload(prettyPayload);
  }, []);
  const handlePromptStatusChange = useCallback((status: string) => {
    setAiPasteStatus(status);
  }, []);
  const { llmGenerating, generateAndPlayFromPrompt } = usePromptToPayload({
    onPayloadReady: handlePromptPayloadReady,
    onStatusChange: handlePromptStatusChange,
  });

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

  function prettifyPayload() {
    try {
      const parsed = JSON.parse(apiPayload) as FormantboardJSONPayload;
      setApiPayload(JSON.stringify(parsed, null, 2));
      setAiPasteStatus("JSON formatted.");
    } catch (error) {
      setAiPasteStatus(error instanceof Error ? error.message : "Could not format JSON.");
    }
  }

  return (
    <section className={cn("flex flex-col items-center gap-0")}>
      <div className="w-[95vw]">
        <SettingsPanel className="mb-3" visType={visType} onVisTypeChange={setVisType} />
        {settings.viz.on ? <Visualizer vtype={visType} height={150} /> : null}
        <Keyboard
          onKeyOn={(note, velocity) => player.play(note, velocity)}
          onKeyOff={(note) => player.stop(note)}
        />
      </div>
      <div className={cn("my-10 inline-flex gap-5")}>
        <MidiButton
          text="MIDI"
          onNoteOn={(note, velocity) => {
            player.play(note2freq(note), velocity);
          }}
          onNoteOff={(note) => {
            player.stop(note2freq(note));
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
        <Button
          variant={showAIPrompt ? "secondary" : "outline"}
          onClick={() => setShowAIPrompt((current) => !current)}
          aria-pressed={showAIPrompt}
        >
          AI Prompt
        </Button>
      </div>
      <Readout />
      {showAIPrompt ? (
        <AIPromptInput
          isLoading={llmGenerating}
          isPlaying={playerState.isApiPlaying}
          onSubmitPrompt={generateAndPlayFromPrompt}
          onStopPlayback={() => {
            player.stopApiPlayback();
            setAiPasteStatus("Stopped API playback.");
          }}
        />
      ) : null}

      {apiModalOpen ? (
        <div className={cn("fixed inset-0 z-[70] flex items-center justify-center")}>
          <button
            type="button"
            aria-label="Close API modal"
            className={cn("absolute inset-0 border-0 bg-zinc-950/45")}
            onClick={() => setApiModalOpen(false)}
          />
          <section
            className={cn(
              "relative z-[71] w-[min(92vw,700px)] rounded-md border border-zinc-300",
              "bg-white p-4 shadow-xl",
            )}
          >
            <div className={cn("mb-2 flex items-start justify-between gap-3")}>
              <h2 className={cn("m-0 text-lg font-medium text-zinc-900")}>Run JSON API Payload</h2>
              <button
                type="button"
                className={cn(
                  "h-8 w-8 rounded border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
                )}
                aria-label="Close API modal"
                onClick={() => setApiModalOpen(false)}
              >
                ×
              </button>
            </div>
            <p className={cn("mb-2 mt-0 text-sm text-zinc-700")}>
              Paste payload JSON for <code>window.fb.fromJSON</code>. See{" "}
              <Link to="/api" className={cn("text-zinc-900 underline")}>
                /api instructions
              </Link>
              .
            </p>
            <textarea
              id="fb-api-modal-json"
              name="fb-api-modal-json"
              data-testid="fb-api-modal-json"
              data-ai-json-input="true"
              className={cn(
                "h-60 w-full resize-y rounded-md border border-zinc-300 p-3 font-mono",
                "text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900",
              )}
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
              className={cn("mt-2 block min-h-5 text-sm text-zinc-700")}
            >
              {aiPasteStatus}
            </output>
            <div className={cn("mt-3 flex flex-wrap gap-2")}>
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
