import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetAllStores } from "@/test/resetStores";
import { getTestApp } from "@/test/resetStores";

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

describe("useKeyboardLayout store", () => {
  beforeEach(() => {
    resetAllStores();
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
    expect(store.fullKeyWidth > 20 || store.layout.notes.length <= 37).toBe(true);
  });
});
