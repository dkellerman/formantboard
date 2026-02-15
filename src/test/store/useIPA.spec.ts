import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetAllStores } from "@/test/resetStores";
import { IPA } from "@/constants";
import { getTestApp } from "@/test/resetStores";

describe("useIPA store", () => {
  beforeEach(() => {
    resetAllStores();
  });

  it("initializes from app defaults", () => {
    const settings = getTestApp().context.settings;
    const ipa = getTestApp().context.ipa;
    const ipaSpec = settings.formants.ipa[ipa];

    expect(ipa).toBe(settings.defaultIPA);
    expect(ipaSpec[0].frequency).toBe(800);
  });

  it("switches IPA profile and formant set", () => {
    act(() => {
      getTestApp().context.setIPA(IPA.i);
    });

    const settings = getTestApp().context.settings;
    const ipaSpec = settings.formants.ipa[getTestApp().context.ipa];
    expect(ipaSpec[0].frequency).toBe(270);
    expect(ipaSpec[1].frequency).toBe(2300);
  });
});
