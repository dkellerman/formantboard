import { useState } from "react";
import { LoaderCircle, Play, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface AIPromptInputProps {
  isLoading?: boolean;
  isPlaying?: boolean;
  onSubmitPrompt: (prompt: string) => Promise<void> | void;
  onStopPlayback?: () => void;
}

export function AIPromptInput({
  isLoading = false,
  isPlaying = false,
  onSubmitPrompt,
  onStopPlayback,
}: AIPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const canSubmit = !isLoading && !isPlaying && prompt.trim().length > 0;

  return (
    <section
      className={cn(
        "mb-10 mt-6 w-[95vw] max-w-[560px] rounded-md border border-zinc-300 bg-zinc-50 p-3",
      )}
    >
      <form
        className={cn("flex items-end gap-2")}
        onSubmit={(event) => {
          event.preventDefault();
          if (isLoading || isPlaying) {
            return;
          }
          const trimmedPrompt = prompt.trim();
          if (!trimmedPrompt) {
            return;
          }
          void onSubmitPrompt(trimmedPrompt);
          setPrompt("");
        }}
      >
        <textarea
          id="fb-ai-prompt"
          className={cn(
            "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900",
            "leading-5",
            "focus:outline-none focus:ring-1 focus:ring-zinc-900",
            "resize-none",
          )}
          rows={2}
          disabled={isLoading}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Enter request, e.g.: Play a C major scale alternating between ee and ah sounds"
        />
        <Button
          variant="default"
          size="sm"
          className={cn("min-w-[92px] bg-sky-600 px-4 text-white hover:bg-sky-500")}
          disabled={isLoading ? true : isPlaying ? false : !canSubmit}
          type={isPlaying ? "button" : "submit"}
          onClick={isPlaying ? onStopPlayback : undefined}
          aria-label={isLoading ? "Loading" : isPlaying ? "Stop playback" : "Play"}
        >
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-label="Loading" />
          ) : isPlaying ? (
            <span className={cn("inline-flex items-center gap-1")}>
              <Square className="h-4 w-4" />
              Stop
            </span>
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </form>
    </section>
  );
}
