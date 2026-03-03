import { useEffect, useState } from "react";
import { FullKeyboard, KeyboardLayout, NOTES } from "@/utils";
import { MOBILE_MAX_WIDTH } from "@/hooks/useViewport";

export const MOBILE_MIN_FULL_KEY_WIDTH = 36;
export const MOBILE_PORTRAIT_MIN_FULL_KEY_WIDTH = 42;
export const DESKTOP_MIN_FULL_KEY_WIDTH = 24;
const MOBILE_PORTRAIT_MAX_SEMITONE_SPAN = 24;
const DEFAULT_MAX_SEMITONE_SPAN = 36;

export function useKeyboardLayout() {
  const [layout, setLayout] = useState(FullKeyboard);
  const [keyboardWidth, setKeyboardWidth] = useState(window.innerWidth * 0.95);
  const [fullKeyWidth, setFullKeyWidth] = useState(keyboardWidth / FullKeyboard.whiteKeys.length);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_MAX_WIDTH);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  function recompute() {
    const width = window.innerWidth * 0.95;
    const nextIsMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
    const nextIsLandscape = window.innerWidth > window.innerHeight;
    const minKeyWidth = nextIsMobile
      ? nextIsLandscape
        ? MOBILE_MIN_FULL_KEY_WIDTH
        : MOBILE_PORTRAIT_MIN_FULL_KEY_WIDTH
      : DESKTOP_MIN_FULL_KEY_WIDTH;
    const maxSemitoneSpan =
      nextIsMobile && !nextIsLandscape
        ? MOBILE_PORTRAIT_MAX_SEMITONE_SPAN
        : DEFAULT_MAX_SEMITONE_SPAN;
    let bot = 0;
    let top = NOTES.length - 1;

    while (bot < top) {
      const nextLayout = new KeyboardLayout(NOTES[bot], NOTES[top]);
      const nextFullKeyWidth = width / nextLayout.whiteKeys.length;
      if (top - bot <= maxSemitoneSpan || nextFullKeyWidth > minKeyWidth) {
        setLayout(nextLayout);
        setKeyboardWidth(width);
        setFullKeyWidth(nextFullKeyWidth);
        setIsMobile(nextIsMobile);
        setIsLandscape(nextIsLandscape);
        return;
      }
      bot += 1;
      top -= 1;
    }

    setLayout(FullKeyboard);
    setKeyboardWidth(width);
    setFullKeyWidth(width / FullKeyboard.whiteKeys.length);
    setIsMobile(nextIsMobile);
    setIsLandscape(nextIsLandscape);
  }

  useEffect(() => {
    recompute();
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
    };
  }, []);

  return {
    layout,
    keyboardWidth,
    fullKeyWidth,
    isMobile,
    isLandscape,
    isMobileLandscape: isMobile && isLandscape,
    recompute,
  };
}
