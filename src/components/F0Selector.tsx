import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { noteOrFreq2freq, stepNoteOrFreq } from "../utils";
import { usePlayer, useSettings } from "../hooks/useStoreSlices";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export interface F0SelectorProps {
  play?: (freq: number) => void;
  stop?: (freq: number, stopAnalysis?: boolean) => void;
  className?: string;
}

export interface F0SelectorHandle {
  f0: string;
  toggleF0: () => void;
  restartF0: () => void;
}

export const F0Selector = forwardRef<F0SelectorHandle, F0SelectorProps>(function F0Selector(
  { play: playProp, stop: stopProp, className }: F0SelectorProps,
  ref,
) {
  const player = usePlayer();
  const settings = useSettings();
  const [f0, setF0] = useState(String(settings.defaultNote));
  const [playingF0, setPlayingF0] = useState<number | undefined>();
  const playingF0Ref = useRef<number | undefined>(undefined);

  const play = useMemo(() => playProp ?? player.play, [playProp, player.play]);
  const stop = useMemo(() => stopProp ?? player.stop, [stopProp, player.stop]);

  const toggleF0 = useCallback(() => {
    if (playingF0Ref.current) {
      stop(playingF0Ref.current, true);
      playingF0Ref.current = undefined;
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
    if (!playingF0Ref.current) return;

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

  useImperativeHandle(
    ref,
    () => ({
      f0,
      toggleF0,
      restartF0,
    }),
    [f0, restartF0, toggleF0],
  );

  return (
    <label className={["flex min-w-0 flex-col gap-1", className ?? ""].join(" ")}>
      <Label className="text-xs font-normal text-zinc-500">Fundamental</Label>
      <div className="flex h-11 items-center gap-1 rounded-md border border-zinc-300 bg-transparent px-1">
        <Input
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-base shadow-none ring-0 focus-visible:ring-0"
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
          className={[
            "inline-flex h-8 min-w-[34px] items-center justify-center px-2 text-sm shadow-none",
            playingF0
              ? "text-red-600 hover:bg-red-100 hover:text-red-700"
              : "text-green-700 hover:bg-green-100 hover:text-green-800",
          ].join(" ")}
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleF0}
        >
          {playingF0 ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </Button>
      </div>
    </label>
  );
});
