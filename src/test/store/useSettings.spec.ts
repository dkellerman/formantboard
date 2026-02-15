import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetAllStores } from "@/test/resetStores";
import { IPA, VisType } from "@/constants";
import { getTestApp } from "@/test/resetStores";

describe("useSettings store", () => {
  beforeEach(() => {
    resetAllStores();
  });

  it("exposes expected default settings", () => {
    const settings = getTestApp().context.settings;

    expect(settings.defaultNote).toBe("E3");
    expect(settings.defaultIPA).toBe(IPA.ɑ);
    expect(settings.defaultVisType).toBe(VisType.POWER);
    expect(settings.audioContextConfig.sampleRate).toBe(44100);
    expect(settings.formants.ipa[IPA.ɑ]).toHaveLength(3);
  });

  it("allows basic runtime settings changes", () => {
    act(() => {
      getTestApp().context.setSettings((current) => ({
        ...current,
        f0: { ...current.f0, on: false },
        harmonics: { ...current.harmonics, max: 12 },
      }));
    });

    expect(getTestApp().context.settings.f0.on).toBe(false);
    expect(getTestApp().context.settings.harmonics.max).toBe(12);
  });
});
