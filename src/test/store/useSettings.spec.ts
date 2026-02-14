import { beforeEach, describe, expect, it } from "vitest";
import { resetAllStores } from "../resetStores";
import { IPA, VisType } from "../../constants";
import { useSettings } from "../../hooks/useSettings";

describe("useSettings store", () => {
  beforeEach(() => {
    resetAllStores();
  });

  it("exposes expected default settings", () => {
    const store = useSettings();

    expect(store.settings.defaultNote).toBe("E3");
    expect(store.settings.defaultIPA).toBe(IPA.ɑ);
    expect(store.settings.defaultVisType).toBe(VisType.POWER);
    expect(store.settings.audioContextConfig.sampleRate).toBe(44100);
    expect(store.settings.formants.ipa[IPA.ɑ]).toHaveLength(3);
  });

  it("allows basic runtime settings changes", () => {
    const store = useSettings();
    const prevF0On = store.settings.f0.on;
    const prevHarmonicsMax = store.settings.harmonics.max;
    const prevBackground = store.settings.viz.background;

    store.settings.f0.on = false;
    store.settings.harmonics.max = 12;
    store.settings.viz.background = "#111111";

    expect(store.settings.f0.on).toBe(false);
    expect(store.settings.harmonics.max).toBe(12);
    expect(store.settings.viz.background).toBe("#111111");

    store.settings.f0.on = prevF0On;
    store.settings.harmonics.max = prevHarmonicsMax;
    store.settings.viz.background = prevBackground;
  });
});
