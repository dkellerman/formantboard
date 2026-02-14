import type { IPA, createDefaultSettings } from "./constants";

export type IPAType = (typeof IPA)[keyof typeof IPA];
export type Settings = ReturnType<typeof createDefaultSettings>;
export type IPASpecs = Settings["formants"]["ipa"];
export type IPASpec = IPASpecs[IPAType];
export type Formant = IPASpec[number];
export type Vibrato = Settings["vibrato"];
