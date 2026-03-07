import { useCallback, useState } from "react";
import { Braces, ChevronDown, KeyboardMusic, MoreVertical, Sparkles, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/hooks/usePlayer";
import { usePromptToPayload } from "@/hooks/usePromptToPayload";
import { useViewport } from "@/hooks/useViewport";
import { VisType } from "@/constants";
import { AIPromptInput } from "@/components/AIPromptInput";
import { Keyboard } from "@/components/Keyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Visualizer } from "@/components/Visualizer";
import { MidiButton } from "@/components/MidiButton";
import { MicButton } from "@/components/MicButton";
import { Readout } from "@/components/Readout";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { API, JSONPayload } from "@/types";
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
  const settings = useAppStore((state) => state.settings);
  const aiStopMode = useAppStore((state) => state.player.isApiPlaying);
  const player = usePlayer();
  const [visType, setVisType] = useState<VisType>(settings.defaultVisType);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiPayload, setApiPayload] = useState("");
  const [apiPayloadSeeded, setApiPayloadSeeded] = useState(false);
  const [aiPasteStatus, setAiPasteStatus] = useState("Ready.");
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [controlsMenuOpen, setControlsMenuOpen] = useState(false);
  const viewport = useViewport();
  const isMobile = viewport.isMobile;
  const keyboardHeight = isMobile
    ? viewport.isMobileLandscape
      ? Math.round(Math.max(84, Math.min(98, viewport.height * 0.22)))
      : Math.round(Math.max(76, Math.min(108, viewport.height * 0.15)))
    : undefined;
  const visualizerHeight = isMobile ? (viewport.isMobileLandscape ? 64 : 92) : 150;

  const handlePromptPayloadReady = useCallback((prettyPayload: string) => {
    setApiPayload(prettyPayload);
  }, []);
  const handlePromptStatusChange = useCallback((status: string) => {
    setAiPasteStatus(status);
  }, []);
  const { llmGenerating, generateAndPlayFromPrompt, cancelPromptGeneration } = usePromptToPayload({
    onPayloadReady: handlePromptPayloadReady,
    onStatusChange: handlePromptStatusChange,
  });

  function openApiModal() {
    setApiModalOpen(true);
    if (!apiPayloadSeeded) {
      setApiPayload(HOME_API_SAMPLE);
      setApiPayloadSeeded(true);
    }
    setAiPasteStatus("Ready. Paste JSON and click Run.");
  }

  function runAIPayload(raw: string) {
    const text = raw.trim();
    if (!text) {
      setAiPasteStatus("Ignored empty payload.");
      return;
    }

    try {
      const api =
        (window as Window & { api?: API; fb?: API }).api ??
        (window as Window & { api?: API; fb?: API }).fb;
      if (!api) {
        throw new Error("window.api is not available yet.");
      }

      const parsed = JSON.parse(text) as JSONPayload;
      if (!Array.isArray(parsed.notes)) {
        throw new Error("Payload must include notes: []");
      }

      const validation = api.validateFromJSON(parsed);
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      api.fromJSON(parsed);
      setAiPasteStatus(`Scheduled ${parsed.notes.length} note event(s).`);
    } catch (error) {
      setAiPasteStatus(error instanceof Error ? error.message : "Could not run payload.");
    }
  }

  function prettifyPayload() {
    try {
      const parsed = JSON.parse(apiPayload) as JSONPayload;
      setApiPayload(JSON.stringify(parsed, null, 2));
      setAiPasteStatus("JSON formatted.");
    } catch (error) {
      setAiPasteStatus(error instanceof Error ? error.message : "Could not format JSON.");
    }
  }

  return (
    <section className={cn("flex flex-col items-center gap-0")}>
      <div className={cn("w-[95vw]")}>
        {isMobile ? (
          <SettingsPanel
            className={cn("mb-3")}
            visType={visType}
            onVisTypeChange={setVisType}
            showAdvanced={mobileSettingsOpen}
            compactVowelFullWidth={!viewport.isMobileLandscape}
            compactToggle={
              <button
                type="button"
                className={cn(
                  "flex h-11 min-w-[92px] items-center justify-between rounded-md border border-input",
                  "bg-muted/40 px-2.5 text-sm font-medium text-foreground",
                )}
                onClick={() => setMobileSettingsOpen((current) => !current)}
                aria-expanded={mobileSettingsOpen}
              >
                <span>Settings</span>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    mobileSettingsOpen ? "rotate-180" : "rotate-0",
                  )}
                  aria-hidden="true"
                />
              </button>
            }
          />
        ) : (
          <SettingsPanel className={cn("mb-3")} visType={visType} onVisTypeChange={setVisType} />
        )}
        {settings.viz.on ? <Visualizer vtype={visType} height={visualizerHeight} /> : null}
        <Keyboard
          height={keyboardHeight}
          onKeyOn={(note, velocity) => player.play(note, velocity)}
          onKeyOff={(note, options) => player.stop(note, false, 0, options?.immediate)}
        />
      </div>
      <div
        className={cn(
          "my-10 inline-flex items-stretch overflow-hidden rounded-lg border border-input",
          "divide-x divide-border bg-muted/40 shadow-sm",
        )}
        role="group"
        aria-label="Playback controls"
      >
        {!isMobile ? (
          <MidiButton
            text="MIDI"
            icon={<KeyboardMusic className={cn("size-4")} />}
            title="Enable MIDI"
            ariaLabel="Enable MIDI"
            buttonVariant="ghost"
            buttonClassName={cn(
              "h-10 rounded-none rounded-l-lg px-3 text-muted-foreground hover:text-foreground",
            )}
            onNoteOn={(note, velocity) => {
              player.play(note2freq(note), velocity);
            }}
            onNoteOff={(note) => {
              player.stop(note2freq(note));
            }}
          />
        ) : null}
        <MicButton
          startText="Listen"
          stopText="Stop"
          buttonVariant="ghost"
          buttonClassName={cn("h-10 rounded-none px-3", isMobile && "rounded-l-lg")}
          title="Mic input"
          ariaLabel="Mic input"
        />
        {!isMobile ? (
          <Button
            variant="ghost"
            className={cn("h-10 rounded-none px-3")}
            onClick={openApiModal}
            title="Open API runner"
            aria-label="Open API runner"
          >
            <Braces className={cn("size-4")} aria-hidden="true" />
            <span>API</span>
          </Button>
        ) : null}
        <Button
          variant={showAIPrompt || aiStopMode ? "secondary" : "ghost"}
          className={cn("h-10 min-w-[96px] rounded-none px-3", !isMobile && "rounded-r-lg")}
          onClick={() => {
            if (aiStopMode) {
              cancelPromptGeneration();
              const api =
                (window as Window & { api?: API; fb?: API }).api ??
                (window as Window & { api?: API; fb?: API }).fb;
              if (api) {
                api.stop();
              } else {
                player.stopApiPlayback();
              }
              setAiPasteStatus("Stopped API playback.");
              return;
            }
            setShowAIPrompt((current) => !current);
          }}
          aria-pressed={showAIPrompt || aiStopMode}
          title={aiStopMode ? "Stop AI playback" : "AI prompt"}
          aria-label={aiStopMode ? "Stop AI playback" : "AI prompt"}
        >
          {aiStopMode ? (
            <span className={cn("inline-flex items-center gap-2")}>
              <Square className={cn("size-4")} aria-hidden="true" />
              Stop AI
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-2")}>
              <Sparkles className={cn("size-4")} aria-hidden="true" />
              AI
            </span>
          )}
        </Button>
        {isMobile ? (
          <Popover open={controlsMenuOpen} onOpenChange={setControlsMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-10 rounded-none rounded-r-lg px-2 text-muted-foreground hover:text-foreground",
                )}
                aria-label="More controls"
              >
                <MoreVertical className={cn("size-4")} aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className={cn("w-44 p-1")}>
              <div className={cn("flex flex-col gap-1")}>
                <MidiButton
                  text="MIDI"
                  icon={<KeyboardMusic className={cn("size-4")} />}
                  title="Enable MIDI"
                  ariaLabel="Enable MIDI"
                  buttonVariant="ghost"
                  className={cn("w-full")}
                  buttonClassName={cn(
                    "h-9 w-full justify-start px-2 text-muted-foreground hover:text-foreground",
                  )}
                  onNoteOn={(note, velocity) => {
                    player.play(note2freq(note), velocity);
                  }}
                  onNoteOff={(note) => {
                    player.stop(note2freq(note));
                  }}
                />
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 w-full justify-start px-2 text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => {
                    setControlsMenuOpen(false);
                    openApiModal();
                  }}
                  title="Open API runner"
                  aria-label="Open API runner"
                >
                  <Braces className={cn("size-4")} aria-hidden="true" />
                  <span>API</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      <Readout />
      {showAIPrompt ? (
        <AIPromptInput
          isLoading={llmGenerating}
          onSubmitPrompt={generateAndPlayFromPrompt}
          onRequestClose={() => {
            cancelPromptGeneration();
            setShowAIPrompt(false);
          }}
        />
      ) : null}

      {apiModalOpen ? (
        <div className={cn("fixed inset-0 z-[70] flex items-center justify-center")}>
          <button
            type="button"
            aria-label="Close API modal"
            className={cn("absolute inset-0 border-0 bg-background/70")}
            onClick={() => setApiModalOpen(false)}
          />
          <section
            className={cn(
              "relative z-[71] w-[min(92vw,700px)] rounded-md border border-border",
              "bg-popover p-4 text-popover-foreground shadow-xl",
            )}
          >
            <div className={cn("mb-2 flex items-start justify-between gap-3")}>
              <h2 className={cn("m-0 text-lg font-medium text-popover-foreground")}>
                Run JSON API Payload
              </h2>
              <button
                type="button"
                className={cn(
                  "size-8 rounded border border-input bg-background text-foreground hover:bg-accent",
                )}
                aria-label="Close API modal"
                onClick={() => setApiModalOpen(false)}
              >
                ×
              </button>
            </div>
            <p className={cn("mb-2 mt-0 text-sm text-popover-foreground")}>
              Paste payload JSON for <code>window.api.fromJSON</code>. See{" "}
              <Link to="/apidocs" className={cn("text-foreground underline")}>
                /apidocs instructions
              </Link>
              .
            </p>
            <textarea
              id="fb-api-modal-json"
              name="fb-api-modal-json"
              data-testid="fb-api-modal-json"
              data-ai-json-input="true"
              className={cn(
                "h-60 w-full resize-y rounded-md border border-input bg-background p-3 font-mono",
                "text-xs text-foreground",
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
              className={cn("mt-2 block min-h-5 text-sm text-popover-foreground")}
            >
              {aiPasteStatus}
            </output>
            <div className={cn("mt-3 flex flex-wrap gap-2")}>
              <Button variant="default" onClick={() => runAIPayload(apiPayload)}>
                Run
              </Button>
              <Button variant="outline" onClick={prettifyPayload}>
                Format
              </Button>
              <Button
                variant="outline"
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
