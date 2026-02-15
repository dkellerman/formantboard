import { useEffect, useState } from "react";
import { FullKeyboard, KeyboardLayout, NOTES } from "@/utils";

export function useKeyboardLayout() {
  const [layout, setLayout] = useState(FullKeyboard);
  const [keyboardWidth, setKeyboardWidth] = useState(window.innerWidth * 0.95);
  const [fullKeyWidth, setFullKeyWidth] = useState(keyboardWidth / FullKeyboard.whiteKeys.length);

  function recompute() {
    const width = window.innerWidth * 0.95;
    let bot = 0;
    let top = NOTES.length - 1;

    while (bot < top) {
      const nextLayout = new KeyboardLayout(NOTES[bot], NOTES[top]);
      const nextFullKeyWidth = width / nextLayout.whiteKeys.length;
      if (top - bot <= 36 || nextFullKeyWidth > 20) {
        setLayout(nextLayout);
        setKeyboardWidth(width);
        setFullKeyWidth(nextFullKeyWidth);
        return;
      }
      bot += 1;
      top -= 1;
    }

    setLayout(FullKeyboard);
    setKeyboardWidth(width);
    setFullKeyWidth(width / FullKeyboard.whiteKeys.length);
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
    recompute,
  };
}
