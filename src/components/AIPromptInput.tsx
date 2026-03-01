import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface AIPromptInputProps {
  isLoading?: boolean;
  onSubmitPrompt: (prompt: string) => Promise<void> | void;
  onRequestClose: () => void;
}

export function AIPromptInput({
  isLoading = false,
  onSubmitPrompt,
  onRequestClose,
}: AIPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const canSubmit = !isLoading && prompt.trim().length > 0;

  return (
    <div className={cn("fixed inset-0 z-[72] flex items-center justify-center")}>
      <button
        type="button"
        aria-label="Close AI prompt modal"
        className={cn("absolute inset-0 border-0 bg-background/70")}
        onClick={onRequestClose}
      />
      <section
        className={cn(
          "relative z-[73] w-[min(92vw,560px)] rounded-md border border-border bg-popover p-4 shadow-xl",
        )}
      >
        <div className={cn("mb-2 flex items-start justify-between gap-3")}>
          <h2 className={cn("m-0 text-lg font-medium text-popover-foreground")}>AI Prompt</h2>
          <button
            type="button"
            aria-label="Close AI prompt modal"
            className={cn(
              "h-8 w-8 rounded border border-input bg-background text-foreground hover:bg-accent",
            )}
            onClick={onRequestClose}
          >
            ×
          </button>
        </div>
        <form
          className={cn("flex flex-col")}
          onSubmit={(event) => {
            event.preventDefault();
            if (isLoading) {
              return;
            }
            const trimmedPrompt = prompt.trim();
            if (!trimmedPrompt) {
              return;
            }

            void (async () => {
              try {
                await onSubmitPrompt(trimmedPrompt);
              } finally {
                setPrompt("");
                onRequestClose();
              }
            })();
          }}
        >
          <textarea
            id="fb-ai-prompt"
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
              "leading-5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
              "resize-none",
            )}
            rows={3}
            disabled={isLoading}
            autoFocus
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              "Loop a C major scale up and down quickly, " +
              "alternating between ee and ah sounds"
            }
          />
          <div className={cn("mt-3 flex justify-end gap-2 border-t border-border pt-3")}>
            <Button type="button" variant="outline" onClick={onRequestClose}>
              Close
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={!canSubmit}
              className={cn("min-w-[112px] disabled:opacity-100")}
              aria-label={isLoading ? "Submitting prompt request" : "Submit prompt request"}
            >
              {isLoading ? (
                <span className={cn("inline-flex items-center gap-2")}>
                  <LoaderCircle className={cn("h-4 w-4 animate-spin")} aria-hidden="true" />
                  Submitting
                </span>
              ) : (
                <span className={cn("inline-flex items-center gap-2")}>
                  <Play className={cn("h-4 w-4")} aria-hidden="true" />
                  Submit
                </span>
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
