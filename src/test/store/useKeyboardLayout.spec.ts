import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { MOBILE_MIN_FULL_KEY_WIDTH } from "@/hooks/useKeyboardLayout";
import { resetStores } from "@/test/resetStores";
import { getTestApp } from "@/test/resetStores";

function setWindowWidth(width: number) {
  setWindowSize(width, window.innerHeight);
}

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
    writable: true,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

describe("useKeyboardLayout store", () => {
  beforeEach(() => {
    resetStores();
  });

  it("tracks keyboard width from window size", () => {
    setWindowWidth(1000);
    act(() => {
      getTestApp().keyboardLayout.recompute();
    });

    expect(getTestApp().keyboardLayout.keyboardWidth).toBeCloseTo(950, 3);
  });

  it("chooses a usable key width for compact screens", () => {
    setWindowWidth(320);
    const store = getTestApp().keyboardLayout;

    expect(store.layout.topFreq).toBeGreaterThan(store.layout.bottomFreq);
    expect(store.fullKeyWidth > MOBILE_MIN_FULL_KEY_WIDTH || store.layout.notes.length <= 37).toBe(
      true,
    );
  });

  it("prioritizes wider keys for mobile portrait", () => {
    const store = getTestApp().keyboardLayout;

    setWindowSize(320, 700);
    const portraitFullKeyWidth = store.fullKeyWidth;
    const portraitNoteCount = store.layout.notes.length;

    setWindowSize(320, 260);
    const landscapeFullKeyWidth = store.fullKeyWidth;
    const landscapeNoteCount = store.layout.notes.length;

    expect(portraitFullKeyWidth).toBeGreaterThanOrEqual(landscapeFullKeyWidth);
    expect(portraitNoteCount).toBeLessThanOrEqual(landscapeNoteCount);
  });
});
