import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAppContext } from "@/store";
import { cn } from "@/lib/cn";
import { note2freq, note2midi, type Note } from "@/utils";
import { useKeyboardLayout } from "@/hooks/useKeyboardLayout";

const TYPICAL_VOCAL_RANGE_MIN_MIDI = note2midi("E2");
const TYPICAL_VOCAL_RANGE_MAX_MIDI = note2midi("C6");

export interface KeyboardProps {
  height?: number;
  activeNotes?: Set<string>;
  onKeyOn?: (note: Note, velocity: number) => void;
  onKeyOff?: (note: Note) => void;
}

export function Keyboard({ height, activeNotes, onKeyOn, onKeyOff }: KeyboardProps) {
  const keyboardLayout = useKeyboardLayout();
  const { metrics, player } = useAppContext();

  const layout = keyboardLayout.layout;
  const keyboardWidth = keyboardLayout.keyboardWidth;
  const noteIds = layout.notes.map((note: string) => note.replace("#", "s"));
  const playerActiveNotes = new Set(player.activeNoteIds);

  const [dragging, setDragging] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const activeNoteRef = useRef<string | null>(null);
  const [detectedNotes, setDetectedNotes] = useState<Set<string>>(new Set());

  const keyboardHeight = height ?? keyboardWidth / 10.0;
  const whiteKeyWidth = keyboardWidth / layout.whiteKeys.length;
  const blackKeyWidth = whiteKeyWidth * 0.65;

  useEffect(() => {
    const note = metrics.pitch?.note;
    setDetectedNotes((prev) => {
      const next = new Set(prev);
      for (const key of [...next]) next.delete(key);
      if (note) next.add(note.replace("#", "s"));
      return next;
    });
  }, [metrics.pitch?.note]);

  function isBlack(id: string) {
    return id.length === 3;
  }

  function isActive(id: string) {
    return activeNote === id || activeNotes?.has(id) === true || playerActiveNotes.has(id);
  }

  function isDetected(id: string) {
    return detectedNotes.has(id);
  }

  function shouldShowLabel(id: string) {
    return (!isBlack(id) && id[0].toUpperCase() === "C") || isActive(id) || isDetected(id);
  }

  function isOutOfTypicalVocalRange(midi: number | null) {
    if (
      midi === null ||
      TYPICAL_VOCAL_RANGE_MIN_MIDI === null ||
      TYPICAL_VOCAL_RANGE_MAX_MIDI === null
    ) {
      return false;
    }

    return midi < TYPICAL_VOCAL_RANGE_MIN_MIDI || midi > TYPICAL_VOCAL_RANGE_MAX_MIDI;
  }

  function getKeyClass(id: string, midi: number | null) {
    const black = isBlack(id);
    const active = isActive(id);
    const detected = isDetected(id);
    const outOfRange = isOutOfTypicalVocalRange(midi);

    if (black) {
      return cn(
        "group relative z-20 list-none border border-zinc-950 text-zinc-50",
        "rounded-b-sm bg-gradient-to-r from-zinc-800 to-zinc-600",
        "shadow-md",
        outOfRange && "border-zinc-600 bg-gradient-to-r from-zinc-600 to-zinc-500",
        active && "border-zinc-700 bg-gradient-to-r from-zinc-600 to-zinc-800 brightness-95",
        active && "shadow-sm",
        detected && "border-sky-700",
      );
    }

    return cn(
      "group relative h-full list-none border border-l-zinc-300 border-b-zinc-300 text-zinc-950",
      "rounded-b-md bg-gradient-to-b from-zinc-100 to-zinc-50",
      "shadow-sm",
      outOfRange && "bg-gradient-to-b from-zinc-100 to-zinc-200",
      active && "border-zinc-400 bg-gradient-to-b from-zinc-50 to-zinc-200 brightness-95",
      active && "shadow-inner",
      detected && "border-sky-700",
    );
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
    const previous = activeNoteRef.current;
    if (previous === id) return;
    if (previous) {
      onKeyOff?.(previous.replace("s", "#") as Note);
    }
    onKeyOn?.(id.replace("s", "#") as Note, velocity);
    activeNoteRef.current = id;
    setActiveNote(id);
  }

  function stop(id: string) {
    if (activeNoteRef.current !== id) return;
    onKeyOff?.(id.replace("s", "#") as Note);
    activeNoteRef.current = null;
    setActiveNote(null);
  }

  function stopActiveNote() {
    const current = activeNoteRef.current;
    if (!current) return;
    onKeyOff?.(current.replace("s", "#") as Note);
    activeNoteRef.current = null;
    setActiveNote(null);
  }

  return (
    <div
      className={cn("w-full overflow-hidden border border-zinc-300 border-t-0")}
      onMouseLeave={() => {
        stopActiveNote();
        setDragging(false);
      }}
    >
      <ul
        className={cn("m-0 flex flex-row items-start p-0")}
        style={{ height: `${keyboardHeight}px`, width: `${keyboardWidth}px` }}
      >
        {noteIds.map((id: string) => {
          const note = id.replace("s", "#") as Note;
          const frequency = note2freq(note);
          const midi = note2midi(note);
          const keyId = midi !== null ? `k${midi}` : `k-${id}`;

          return (
            <li
              id={id}
              key={id}
              data-key-id={keyId}
              data-note={note}
              data-frequency={frequency.toFixed(2)}
              data-midi={midi ?? undefined}
              className={cn(
                getKeyClass(id, midi),
                "outline-none ring-0 focus:outline-none focus-visible:outline-none",
                "focus:ring-0 focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]",
              )}
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
                if (dragging) stop(id);
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
                className={cn(
                  "pointer-events-none absolute top-[calc(100%-30px)] bg-transparent",
                  "px-0.5 text-center text-[10px] text-zinc-400",
                  isBlack(id)
                    ? "w-auto border border-zinc-400 bg-white px-1 py-0.5 text-zinc-500"
                    : "w-full",
                  shouldShowLabel(id) ? "block" : "hidden group-hover:block",
                )}
              >
                <div>{note}</div>
                <div>{frequency.toFixed(0)}</div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
