import { describe, expect, it } from "vitest";
import {
  SUPPORTED_IPA_VOWELS,
  formantboardJsonSchemas,
  validateJSONPayloadInput,
  validatePlayEventsInput,
} from "@/hooks/useAPIValidation";

describe("formantboard API validation", () => {
  it("accepts canonical play events", () => {
    const result = validatePlayEventsInput([
      {
        note: "C4",
        time: 0,
        dur: 0.5,
        velocity: 0.9,
        vowel: "ɑ",
        volume: 0.8,
        tilt: -2,
        formants: [{ index: 1, on: true }],
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.value[0].note).toBe("C4");
    expect(result.value[0].vowel).toBe("ɑ");
  });

  it("rejects invalid vowels in play events with a specific path", () => {
    const result = validatePlayEventsInput([
      {
        note: "C4",
        time: 0,
        dur: 1,
        vowel: "e",
      },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected validation to fail");
    expect(result.error).toContain("events[0].vowel");
  });

  it("rejects invalid timing in play events", () => {
    const result = validatePlayEventsInput([
      {
        note: "C4",
        time: -0.1,
        dur: 0,
      },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected validation to fail");
    expect(result.error).toContain("events[0].time");
  });

  it("normalizes canonical fromJSON payload into play events", () => {
    const result = validateJSONPayloadInput({
      bpm: 100,
      voice: { vowel: "ə", volume: 0.8 },
      notes: [
        {
          note: "G3",
          time: 0,
          dur: 0.5,
          vowel: "æ",
          volume: 0.7,
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.value.bpm).toBe(100);
    expect(result.value.voice?.vowel).toBe("ə");
    expect(result.value.notes[0]).toEqual(
      expect.objectContaining({
        note: "G3",
        time: 0,
        dur: 0.5,
        vowel: "æ",
        volume: 0.7,
      }),
    );
  });

  it("normalizes legacy fromJSON aliases to canonical fields", () => {
    const result = validateJSONPayloadInput({
      bpm: 92,
      notes: [
        {
          m: 60,
          t: 1,
          d: 0.5,
          v: 0.6,
          ipa: "ɪ",
          vol: 0.5,
          formantOverrides: [{ index: 2, gain: 12 }],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.value.notes[0]).toEqual(
      expect.objectContaining({
        note: 60,
        time: 1,
        dur: 0.5,
        velocity: 0.6,
        vowel: "ɪ",
        volume: 0.5,
        formants: [{ index: 2, gain: 12 }],
      }),
    );
  });

  it("rejects conflicting canonical and legacy alias values", () => {
    const result = validateJSONPayloadInput({
      notes: [
        {
          note: "C4",
          time: 0,
          t: 1,
          dur: 0.5,
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected validation to fail");
    expect(result.error).toContain("payload.notes[0].time");
    expect(result.error).toContain("Conflicting values");
  });

  it("exports non-empty JSON schemas and supported vowels", () => {
    expect(SUPPORTED_IPA_VOWELS).toEqual(["ɑ", "ɛ", "ə", "æ", "ɔ", "u", "ʊ", "ɪ", "i"]);
    expect(formantboardJsonSchemas.playEvents).toEqual(
      expect.objectContaining({
        type: "array",
      }),
    );
    expect(formantboardJsonSchemas.jsonPayload).toEqual(
      expect.objectContaining({
        type: "object",
      }),
    );
  });
});
