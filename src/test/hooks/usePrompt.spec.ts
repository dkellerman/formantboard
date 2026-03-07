import { describe, expect, it } from "vitest";
import { deriveLoopFromPrompt } from "../../../api/ai";

describe("deriveLoopFromPrompt", () => {
  it("returns undefined when loop is not requested", () => {
    expect(deriveLoopFromPrompt("play a short major scale")).toBeUndefined();
  });

  it("defaults to infinite when loop is requested without a count", () => {
    expect(deriveLoopFromPrompt("loop a scale")).toBe("infinite");
  });

  it("extracts numeric loop counts from natural language", () => {
    expect(deriveLoopFromPrompt("loop this 4 times")).toBe(4);
    expect(deriveLoopFromPrompt("loop 3x")).toBe(3);
  });

  it("supports explicit no-loop instructions", () => {
    expect(deriveLoopFromPrompt("do not loop this")).toBe(false);
  });
});
