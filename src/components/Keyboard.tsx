import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/cn";
import { note2freq, note2midi, type Note } from "@/utils";
import { useKeyboardLayout } from "@/hooks/useKeyboardLayout";

const TYPICAL_VOCAL_RANGE_MIN_MIDI = note2midi("E2");
const TYPICAL_VOCAL_RANGE_MAX_MIDI = note2midi("C6");

function buildHotkeyMap(noteIds: string[]) {
  const noteByHotkey = new Map<string, string>();
  const hotkeyByNote = new Map<string, string>();
  if (noteIds.length === 0) return { noteByHotkey, hotkeyByNote };

  const lowerKeys = "zxcvbnm,./";
  const middleKeys = "asdfghjkl;'";
  const upperKeys = "qwertyuiop[]\\";
  const overflowKeys = "67890-=";
  const middleCount = Math.min(middleKeys.length, noteIds.length);
  const maxMiddleStart = Math.max(0, noteIds.length - middleCount);
  const c4Index = noteIds.indexOf("C4");
  const fallbackMiddleStart = Math.max(0, Math.min(Math.floor(noteIds.length / 2), maxMiddleStart));
  const middleStart =
    c4Index >= 0 ? Math.max(0, Math.min(c4Index, maxMiddleStart)) : fallbackMiddleStart;
  const middleEnd = Math.min(noteIds.length, middleStart + middleCount);
  const lowerStart = Math.max(0, middleStart - lowerKeys.length);
  const upperStart = middleEnd;
  const upperEnd = Math.min(noteIds.length, upperStart + upperKeys.length);
  const overflowStart = upperEnd;

  function assignRange(keys: string, start: number, end: number) {
    let keyIndex = 0;
    for (let noteIndex = start; noteIndex < end && keyIndex < keys.length; noteIndex += 1) {
      const noteId = noteIds[noteIndex];
      noteByHotkey.set(keys[keyIndex], noteId);
      hotkeyByNote.set(noteId, keys[keyIndex]);
      keyIndex += 1;
    }
  }

  assignRange(lowerKeys, lowerStart, middleStart);
  assignRange(middleKeys, middleStart, middleEnd);
  assignRange(upperKeys, upperStart, upperEnd);
  assignRange(overflowKeys, overflowStart, noteIds.length);

  return { noteByHotkey, hotkeyByNote };
}

function resolveHotkey(event: KeyboardEvent) {
  const code = event.code;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);

  switch (code) {
    case "Backquote":
      return "`";
    case "Minus":
      return "-";
    case "Equal":
      return "=";
    case "BracketLeft":
      return "[";
    case "BracketRight":
      return "]";
    case "Backslash":
      return "\\";
    case "Semicolon":
      return ";";
    case "Quote":
      return "'";
    case "Comma":
      return ",";
    case "Period":
      return ".";
    case "Slash":
      return "/";
    default:
      return event.key.length === 1 ? event.key.toLowerCase() : "";
  }
}

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

type TouchPoint = {
  clientX: number;
  clientY: number;
};

function getKeyIdAtTouchPoint(touch: TouchPoint) {
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!(target instanceof HTMLElement)) {
    return null;
  }
  const keyElement = target.closest<HTMLLIElement>("li[data-key-id]");
  return keyElement?.id ?? null;
}

export interface KeyboardProps {
  height?: number;
  activeNotes?: Set<string>;
  onKeyOn?: (note: Note, velocity: number) => void;
  onKeyOff?: (note: Note, options?: { immediate?: boolean }) => void;
}

export function Keyboard({ height, activeNotes, onKeyOn, onKeyOff }: KeyboardProps) {
  const keyboardLayout = useKeyboardLayout();
  const metrics = useAppStore((state) => state.metrics);
  const player = useAppStore((state) => state.player);

  const layout = keyboardLayout.layout;
  const keyboardWidth = keyboardLayout.keyboardWidth;
  const isMobile = keyboardLayout.isMobile;
  const noteIds = useMemo(
    () => layout.notes.map((note: string) => note.replace("#", "s")),
    [layout.notes],
  );
  const hotkeyMap = useMemo(() => buildHotkeyMap(noteIds), [noteIds]);
  const playerActiveNotes = player.activeNoteIds;

  const [dragging, setDragging] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const activeNoteRef = useRef<string | null>(null);
  const [detectedNotes, setDetectedNotes] = useState<Set<string>>(new Set());
  const [showHotkeyHints, setShowHotkeyHints] = useState(false);
  const [activeHotkeyNotes, setActiveHotkeyNotes] = useState<Set<string>>(new Set());
  const [hotkeyCenters, setHotkeyCenters] = useState<Record<string, number>>({});
  const pressedHotkeysRef = useRef(new Map<string, string>());
  const keyboardListRef = useRef<HTMLUListElement | null>(null);
  const hotkeyMapRef = useRef(hotkeyMap);
  const onKeyOnRef = useRef(onKeyOn);
  const onKeyOffRef = useRef(onKeyOff);

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
    return (
      activeNote === id ||
      activeHotkeyNotes.has(id) ||
      activeNotes?.has(id) === true ||
      playerActiveNotes.includes(id)
    );
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

    return {
      minWidth: `${whiteKeyWidth}px`,
      width: `${whiteKeyWidth}px`,
      marginRight: ["C", "D", "F", "G", "A"].includes(letter) ? `-${blackKeyWidth}px` : undefined,
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

  function stop(id: string, options?: { immediate?: boolean }) {
    if (activeNoteRef.current !== id) return;
    onKeyOff?.(id.replace("s", "#") as Note, options);
    activeNoteRef.current = null;
    setActiveNote(null);
  }

  function stopActiveNote(options?: { immediate?: boolean }) {
    const current = activeNoteRef.current;
    if (!current) return;
    onKeyOff?.(current.replace("s", "#") as Note, options);
    activeNoteRef.current = null;
    setActiveNote(null);
  }

  useEffect(() => {
    hotkeyMapRef.current = hotkeyMap;
  }, [hotkeyMap]);

  useLayoutEffect(() => {
    const listNode = keyboardListRef.current;
    if (!listNode) return;
    const listEl: HTMLUListElement = listNode;

    function recomputeHotkeyCenters() {
      const next: Record<string, number> = {};
      const listRect = listEl.getBoundingClientRect();
      noteIds.forEach((id) => {
        const key = listEl.querySelector<HTMLElement>(`li#${CSS.escape(id)}`);
        if (!key) return;
        const keyRect = key.getBoundingClientRect();
        next[id] = keyRect.left - listRect.left + keyRect.width / 2;
      });
      setHotkeyCenters(next);
    }

    recomputeHotkeyCenters();
    const observer = new ResizeObserver(() => {
      recomputeHotkeyCenters();
    });
    observer.observe(listEl);
    return () => {
      observer.disconnect();
    };
  }, [noteIds, keyboardWidth]);

  useEffect(() => {
    onKeyOnRef.current = onKeyOn;
    onKeyOffRef.current = onKeyOff;
  }, [onKeyOff, onKeyOn]);

  useEffect(() => {
    function releaseHotkey(code: string) {
      const noteId = pressedHotkeysRef.current.get(code);
      if (!noteId) return;
      pressedHotkeysRef.current.delete(code);
      onKeyOffRef.current?.(noteId.replace("s", "#") as Note, { immediate: true });
      setActiveHotkeyNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }

    function releaseAllHotkeys() {
      const pressed = [...pressedHotkeysRef.current.entries()];
      pressedHotkeysRef.current.clear();
      if (pressed.length === 0) return;

      setActiveHotkeyNotes(new Set());
      for (const [, noteId] of pressed) {
        onKeyOffRef.current?.(noteId.replace("s", "#") as Note, { immediate: true });
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }

      const hotkey = resolveHotkey(event);
      if (!hotkey) return;
      const noteId = hotkeyMapRef.current.noteByHotkey.get(hotkey);
      if (!noteId) return;
      if (pressedHotkeysRef.current.has(event.code)) return;

      pressedHotkeysRef.current.set(event.code, noteId);
      onKeyOnRef.current?.(noteId.replace("s", "#") as Note, 1);
      setActiveHotkeyNotes((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });
      event.preventDefault();
    }

    function onKeyUp(event: KeyboardEvent) {
      releaseHotkey(event.code);
    }

    function onBlur() {
      releaseAllHotkeys();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      releaseAllHotkeys();
    };
  }, []);

  return (
    <div className={cn("w-full")}>
      <div
        className={cn("w-full overflow-hidden border border-zinc-300 border-t-0")}
        onMouseLeave={() => {
          if (isMobile) return;
          stopActiveNote();
          setDragging(false);
        }}
      >
        <ul
          ref={keyboardListRef}
          className={cn(
            "m-0 flex flex-row items-start p-0 touch-none select-none",
            "[-webkit-user-select:none] [-webkit-touch-callout:none]",
          )}
          style={{ height: `${keyboardHeight}px`, width: `${keyboardWidth}px` }}
          onTouchMove={(event) => {
            if (!isMobile || !dragging) return;
            const touch = event.touches[0];
            if (!touch) return;
            const nextId = getKeyIdAtTouchPoint(touch);
            if (!nextId) return;
            play(nextId);
          }}
          onTouchEnd={() => {
            if (!isMobile) return;
            setDragging(false);
            stopActiveNote({ immediate: true });
          }}
          onTouchCancel={() => {
            if (!isMobile) return;
            setDragging(false);
            stopActiveNote({ immediate: true });
          }}
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
                  "touch-none select-none",
                  "[-webkit-user-select:none] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]",
                )}
                style={getKeyStyle(id)}
                tabIndex={-1}
                onContextMenu={(event) => {
                  event.preventDefault();
                }}
                onMouseDown={(event) => {
                  if (isMobile) return;
                  event.preventDefault();
                  setDragging(true);
                  play(id);
                }}
                onMouseUp={() => {
                  if (isMobile) return;
                  setDragging(false);
                  stop(id);
                }}
                onMouseEnter={() => {
                  if (isMobile) return;
                  if (dragging) play(id);
                }}
                onMouseOut={() => {
                  if (isMobile) return;
                  if (dragging) stop(id);
                }}
                onTouchStart={(event) => {
                  if (!isMobile) return;
                  setDragging(true);
                  const touch = event.touches[0];
                  const nextId = touch ? getKeyIdAtTouchPoint(touch) : id;
                  play(nextId ?? id);
                }}
                onTouchEnd={() => {
                  if (!isMobile) return;
                  setDragging(false);
                  stop(id, { immediate: true });
                }}
                onTouchCancel={() => {
                  if (!isMobile) return;
                  setDragging(false);
                  stop(id, { immediate: true });
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
      {!isMobile ? (
        <div className={cn("relative mt-1 h-[20px]")} style={{ width: `${keyboardWidth}px` }}>
          <div
            className={cn(
              "absolute inset-0 overflow-hidden",
              "font-mono text-[14px] leading-none text-zinc-900 dark:text-zinc-100",
              showHotkeyHints ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!showHotkeyHints}
          >
            <div className={cn("relative h-[18px]")} style={{ width: `${keyboardWidth}px` }}>
              {noteIds.map((id) => {
                const hotkey = hotkeyMap.hotkeyByNote.get(id);
                const center = hotkeyCenters[id];
                if (!hotkey || center === undefined) return null;
                return (
                  <span
                    key={`${id}-${hotkey}`}
                    className={cn(
                      "pointer-events-none absolute top-0 -translate-x-1/2 text-center leading-none",
                      "asdfghjkl;'".includes(hotkey) ? "font-semibold" : undefined,
                    )}
                    style={{ left: `${center}px` }}
                  >
                    {hotkey}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "absolute right-0 top-0 rounded border border-transparent bg-white/90 px-1 py-0",
              "font-mono text-[11px] text-zinc-500 underline decoration-dotted",
              "hover:text-zinc-700",
            )}
            onClick={() => setShowHotkeyHints((current) => !current)}
            aria-pressed={showHotkeyHints}
          >
            {showHotkeyHints ? "Hide hotkeys" : "Show hotkeys"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
