import { beforeEach, describe, expect, it } from "vitest";
import { IPA } from "@/constants";
import { resetAppStore, useAppStore } from "@/store";
import { createDefaultSettings } from "@/constants";

describe("useAppStore IPA slice", () => {
  beforeEach(() => {
    resetAppStore();
  });

  it("initializes from app defaults", () => {
    const settings = useAppStore.getState().settings;
    const ipa = useAppStore.getState().ipa;
    const ipaSpec = settings.formants.ipa[ipa];

    expect(ipa).toBe(settings.defaultIPA);
    expect(ipaSpec[0].frequency).toBe(800);
  });

  it("supports direct and functional IPA updates without touching settings", () => {
    const initialSettings = useAppStore.getState().settings;

    useAppStore.getState().setIPA(IPA.i);
    let ipa = useAppStore.getState().ipa;
    let ipaSpec = useAppStore.getState().settings.formants.ipa[ipa];
    expect(ipaSpec[0].frequency).toBe(270);
    expect(ipaSpec[1].frequency).toBe(2300);
    expect(useAppStore.getState().settings).toBe(initialSettings);

    useAppStore.getState().setIPA((current) => (current === IPA.i ? IPA.ɑ : IPA.i));
    ipa = useAppStore.getState().ipa;
    ipaSpec = useAppStore.getState().settings.formants.ipa[ipa];
    const defaults = createDefaultSettings();
    expect(ipa).toBe(defaults.defaultIPA);
    expect(ipaSpec[0].frequency).toBe(800);
  });
});
