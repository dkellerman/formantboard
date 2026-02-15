import { describe, expect, it } from "vitest";
import {
  CAP_FREQ,
  KeyboardLayout,
  arr2rms,
  db2gain,
  freq2note,
  freq2noteCents,
  gain2db,
  getHarmonics,
  midi2note,
  note2canon,
  note2freq,
  note2midi,
  noteOrFreq2freq,
  round,
  stepNoteOrFreq,
} from "@/utils";

describe("utils", () => {
  it("normalizes note spellings to canonical names", () => {
    expect(note2canon("db4" as never)).toBe("C#4");
    expect(note2canon("f sharp" as never)).toBe("F#3");
    expect(() => note2canon("H9" as never)).toThrow("Invalid note");
  });

  it("converts notes and frequencies both ways", () => {
    const a4 = note2freq("A4");
    expect(round(a4, 2)).toBe(440);
    expect(freq2note(a4)).toBe("A4");

    const [note, cents] = freq2noteCents(445);
    expect(note).toBe("A4");
    expect(cents).toBeGreaterThan(0);
  });

  it("steps note and numeric frequencies safely", () => {
    expect(stepNoteOrFreq("A4", 2)).toBe("B4");
    expect(stepNoteOrFreq(100, 1, 15)).toBe(115);
    expect(stepNoteOrFreq(CAP_FREQ - 1, 1, 50)).toBe(CAP_FREQ);
    expect(noteOrFreq2freq("A4")).toBeCloseTo(440, 5);
  });

  it("builds keyboard geometry with bounded pixel mapping", () => {
    const layout = new KeyboardLayout("C3", "C4");
    const pxBottom = layout.freq2px(layout.bottomFreq, 400);
    const pxTop = layout.freq2px(layout.topFreq, 400);

    expect(layout.whiteKeys.length).toBeGreaterThan(0);
    expect(layout.blackKeys.length).toBeGreaterThan(0);
    expect(layout.freq2px(layout.bottomFreq - 1, 400)).toBe(0);
    expect(layout.freq2px(layout.topFreq + 1, 400)).toBe(400);
    expect(pxBottom).toBeLessThan(pxTop);
  });

  it("computes harmonics and gain/db helpers", () => {
    const harmonics = getHarmonics(100, -6, 5, 450, { 1: 0.5 });

    expect(harmonics.map(([freq]) => freq)).toEqual([100, 200, 300, 400]);
    expect(harmonics[1][1]).toBe(0.5);
    expect(round(gain2db(db2gain(-12)), 4)).toBeCloseTo(-12, 4);
    expect(round(arr2rms([3, 4]), 3)).toBe(3.536);
    expect(midi2note(69)).toBe("A3");
    expect(note2midi("A3")).toBe(69);
    expect(midi2note(0)).toBeNull();
  });
});
