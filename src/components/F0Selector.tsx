import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/cn";
import { noteOrFreq2freq, stepNoteOrFreq } from "@/utils";
import { usePlayer } from "@/hooks/usePlayer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface F0SelectorProps {
  play?: (freq: number) => void;
  stop?: (freq: number, stopAnalysis?: boolean) => void;
  className?: string;
  restartSignal?: number;
  toggleSignal?: number;
}

export function F0Selector({
  play: playProp,
  stop: stopProp,
  className,
  restartSignal = 0,
  toggleSignal = 0,
}: F0SelectorProps) {
  const settings = useAppStore((state) => state.settings);
  const player = usePlayer();
  const [f0, setF0] = useState(String(settings.defaultNote));
  const [playingF0, setPlayingF0] = useState<number>();
  const playingF0Ref = useRef<number | null>(null);
  const prevRestartRef = useRef(restartSignal);
  const prevToggleRef = useRef(toggleSignal);

  const play = playProp ?? player.play;
  const stop = stopProp ?? player.stop;

  const toggleF0 = useCallback(() => {
    if (playingF0Ref.current !== null) {
      stop(playingF0Ref.current, true);
      playingF0Ref.current = null;
      setPlayingF0(undefined);
      return;
    }

    let freq: number;
    try {
      freq = noteOrFreq2freq(f0);
    } catch {
      alert('Invalid note or frequency: "' + f0 + '". Examples: 440, 27.5, A4, Bb3, or D#5');
      return;
    }

    if (freq) {
      playingF0Ref.current = freq;
      setPlayingF0(freq);
      play(freq);
    }
  }, [f0, play, stop]);

  const restartF0 = useCallback(() => {
    if (playingF0Ref.current === null) return;

    let freq: number;
    try {
      freq = noteOrFreq2freq(f0);
    } catch {
      alert('Invalid note or frequency: "' + f0 + '". Examples: 440, 27.5, A4, Bb3, or D#5');
      return;
    }

    stop(playingF0Ref.current, true);
    playingF0Ref.current = freq;
    setPlayingF0(freq);
    play(freq);
  }, [f0, play, stop]);

  useEffect(() => {
    if (restartSignal !== prevRestartRef.current) {
      prevRestartRef.current = restartSignal;
      restartF0();
    }
  }, [restartSignal, restartF0]);

  useEffect(() => {
    if (toggleSignal !== prevToggleRef.current) {
      prevToggleRef.current = toggleSignal;
      toggleF0();
    }
  }, [toggleSignal, toggleF0]);

  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label className={cn("text-xs font-normal text-foreground")}>Fundamental</Label>
      <div
        className={cn(
          "flex h-11 items-center gap-1 rounded-md border border-input",
          "bg-transparent px-1",
        )}
      >
        <Input
          className={cn(
            "h-8 min-w-0 flex-1 border-0 bg-transparent px-2 text-base text-foreground",
            "shadow-none ring-0 focus-visible:ring-0",
          )}
          value={f0}
          onInput={(event) => setF0((event.target as HTMLInputElement).value)}
          onChange={restartF0}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              restartF0();
              return;
            }

            if (event.key === "ArrowUp") {
              setF0((curr) => String(stepNoteOrFreq(curr, 1, 5)));
              restartF0();
              return;
            }

            if (event.key === "ArrowDown") {
              setF0((curr) => String(stepNoteOrFreq(curr, -1, -5)));
              restartF0();
            }
          }}
        />
        <Button
          className={cn(
            "inline-flex h-8 min-w-[34px] items-center justify-center px-2 text-sm shadow-none",
            playingF0
              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600",
          )}
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleF0}
        >
          {playingF0 ? (
            <Square className={cn("h-4 w-4 fill-current")} />
          ) : (
            <Play className={cn("h-4 w-4 fill-current")} />
          )}
        </Button>
      </div>
    </label>
  );
}
