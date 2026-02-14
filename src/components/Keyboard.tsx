import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { note2freq, type Note } from "../utils";
import { useKeyboardLayoutSlice, useMetrics } from "../hooks/useStoreSlices";

export interface KeyboardProps {
  height?: number;
  onKeyOn?: (note: Note, velocity: number) => void;
  onKeyOff?: (note: Note) => void;
}

export interface KeyboardHandle {
  play: (id: string, velocity?: number) => void;
  stop: (id: string) => void;
}

export const Keyboard = forwardRef<KeyboardHandle, KeyboardProps>(function Keyboard(
  { height, onKeyOn, onKeyOff }: KeyboardProps,
  ref,
) {
  const keyboardLayout = useKeyboardLayoutSlice();
  const metrics = useMetrics();

  const layout = keyboardLayout.layout;
  const keyboardWidth = keyboardLayout.keyboardWidth;

  const noteIds = useMemo(
    () => layout.notes.map((note: string) => note.replace("#", "s")),
    [layout.notes],
  );
  const [dragging, setDragging] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [detectedNotes, setDetectedNotes] = useState<Set<string>>(new Set());

  const keyboardHeight = height ?? keyboardWidth / 10.0;
  const whiteKeyWidth = keyboardWidth / layout.whiteKeys.length;
  const blackKeyWidth = whiteKeyWidth * 0.65;

  const blackShadow =
    "shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.2),inset_0_-5px_2px_3px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.5)]";
  const blackShadowActive =
    "shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.2),inset_0_-2px_2px_3px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.5)]";
  const whiteShadow =
    "shadow-[inset_-1px_0_0_rgba(255,255,255,0.8),inset_0_0_5px_#d4d4d8,0_0_3px_rgba(0,0,0,0.2)]";
  const whiteShadowActive =
    "shadow-[inset_2px_0_3px_rgba(0,0,0,0.1),inset_-5px_5px_20px_rgba(0,0,0,0.2),0_0_3px_rgba(0,0,0,0.2)]";

  useEffect(() => {
    const note = metrics.pitch?.note;
    setDetectedNotes((prev) => {
      const next = new Set(prev);
      for (const key of [...next]) {
        next.delete(key);
      }
      if (note) next.add(note.replace("#", "s"));
      return next;
    });
  }, [metrics.pitch?.note]);

  function isBlack(id: string) {
    return id.length === 3;
  }

  function isActive(id: string) {
    return activeNotes.has(id);
  }

  function isDetected(id: string) {
    return detectedNotes.has(id);
  }

  function shouldShowLabel(id: string) {
    return (!isBlack(id) && id[0].toUpperCase() === "C") || isActive(id) || isDetected(id);
  }

  function getKeyClass(id: string) {
    const black = isBlack(id);
    const active = isActive(id);
    const detected = isDetected(id);

    if (black) {
      return [
        "group relative z-20 list-none border border-black text-white",
        "rounded-b-sm bg-gradient-to-r from-zinc-800 to-zinc-600",
        blackShadow,
        active ? `bg-gradient-to-r from-zinc-600 to-zinc-800 ${blackShadowActive}` : "",
        detected ? "border-sky-700" : "",
      ].join(" ");
    }

    return [
      "group relative h-full list-none border border-l-zinc-300 border-b-zinc-300 text-black",
      "rounded-b-md bg-gradient-to-b from-zinc-100 to-white",
      whiteShadow,
      active ? `border-zinc-400 bg-gradient-to-b from-white to-zinc-200 ${whiteShadowActive}` : "",
      detected ? "border-sky-700" : "",
    ].join(" ");
  }

  function getKeyStyle(id: string): CSSProperties {
    if (isBlack(id)) {
      return {
        minWidth: `${blackKeyWidth}px`,
        width: `${blackKeyWidth}px`,
        height: "57%",
        right: `-${blackKeyWidth / 2}px`,
      };
    }

    const letter = id.substring(0, id.length - 1).toUpperCase();
    const overlaps = new Set(["C", "D", "F", "G", "A"]);

    return {
      minWidth: `${whiteKeyWidth}px`,
      width: `${whiteKeyWidth}px`,
      marginRight: overlaps.has(letter) ? `-${blackKeyWidth}px` : undefined,
    };
  }

  function play(id: string, velocity = 1) {
    onKeyOn?.(id.replace("s", "#") as Note, velocity);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function stop(id: string) {
    onKeyOff?.(id.replace("s", "#") as Note);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  useImperativeHandle(ref, () => ({ play, stop }));

  return (
    <div
      className="w-full overflow-hidden border border-zinc-300 border-t-0"
      onMouseLeave={() => setDragging(false)}
    >
      <ul
        className="m-0 flex flex-row items-start p-0"
        style={{ height: `${keyboardHeight}px`, width: `${keyboardWidth}px` }}
      >
        {noteIds.map((id) => (
          <li
            id={id}
            key={id}
            className={[
              getKeyClass(id),
              "outline-none ring-0 focus:outline-none focus-visible:outline-none",
              "focus:ring-0 focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]",
            ].join(" ")}
            style={getKeyStyle(id)}
            tabIndex={-1}
            onMouseDown={(event) => {
              event.preventDefault();
              setDragging(true);
              play(id);
            }}
            onMouseUp={() => {
              setDragging(false);
              stop(id);
            }}
            onMouseEnter={() => {
              if (dragging) play(id);
            }}
            onMouseOut={() => {
              stop(id);
            }}
            onTouchStart={(event) => {
              event.preventDefault();
              setDragging(true);
              play(id);
            }}
            onTouchEnd={() => {
              setDragging(false);
              stop(id);
            }}
          >
            <label
              className={[
                "pointer-events-none absolute top-[calc(100%-30px)] bg-transparent",
                "px-0.5 text-center text-[10px] text-zinc-400",
                isBlack(id)
                  ? "w-auto border border-zinc-400 bg-white px-1 py-0.5 text-zinc-500"
                  : "w-full",
                shouldShowLabel(id) ? "block" : "hidden group-hover:block",
              ].join(" ")}
            >
              <div>{id.replace("s", "#")}</div>
              <div>{note2freq(id.replace("s", "#") as Note).toFixed(0)}</div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
});
