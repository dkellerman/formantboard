import { IPA } from "../constants";
import type { IPAType } from "../types";
import { useAppStore } from "../store";

export type { IPAType } from "../types";

export const IPA_WORDS: Record<IPAType, string> = {
  [IPA.i]: "fleece",
  [IPA.y]: "mule",
  [IPA.e]: "face",
  [IPA.ø]: "bird",
  [IPA.ɛ]: "dress",
  [IPA.œ]: "goat",
  [IPA.a]: "father",
  [IPA.ɶ]: "nurse",
  [IPA.ɑ]: "cot",
  [IPA.ɒ]: "lot",
  [IPA.ɔ]: "thought",
  [IPA.ʌ]: "strut",
  [IPA.ɤ]: "goose",
  [IPA.o]: "boat",
  [IPA.ɯ]: "fleece",
  [IPA.u]: "boot",
  [IPA.ɪ]: "kit",
  [IPA.ʊ]: "foot",
  [IPA.ə]: "sofa",
  [IPA.æ]: "trap",
  [IPA.ŋ]: "sing",
  [IPA.ʧ]: "church",
  [IPA.θ]: "think",
  [IPA.ð]: "this",
  [IPA.ʤ]: "judge",
  [IPA.ʃ]: "ship",
  [IPA.w]: "we",
  [IPA.n]: "no",
  [IPA.m]: "me",
  [IPA.r]: "red",
  [IPA.g]: "go",
  [IPA.j]: "yes",
  [IPA.l]: "low",
  [IPA.d]: "do",
  [IPA.z]: "zoo",
  [IPA.v]: "view",
  [IPA.h]: "he",
  [IPA.p]: "pie",
  [IPA.k]: "key",
  [IPA.t]: "tea",
  [IPA.s]: "sea",
  [IPA.f]: "fee",
  [IPA.b]: "be",
  [IPA.ʒ]: "pleasure",
};

export const ALL_IPA = Object.keys(IPA) as IPAType[];
export const COMMON_IPA = [IPA.ɑ, IPA.ɛ, IPA.ə, IPA.æ, IPA.ɔ, IPA.u, IPA.ʊ, IPA.ɪ, IPA.i];
export const VOWELS = [IPA.ɑ, IPA.ɛ, IPA.ə, IPA.æ, IPA.ɔ, IPA.u, IPA.ʊ, IPA.ɪ, IPA.i];
export const CONSONANTS = [
  IPA.m,
  IPA.r,
  IPA.g,
  IPA.j,
  IPA.l,
  IPA.d,
  IPA.z,
  IPA.v,
  IPA.h,
  IPA.p,
  IPA.k,
  IPA.t,
  IPA.s,
  IPA.f,
  IPA.b,
];
export const FRICATIVES = [IPA.ʃ, IPA.ʒ, IPA.f, IPA.v, IPA.s, IPA.z, IPA.h];
export const PLOSIVES = [IPA.p, IPA.b, IPA.t, IPA.d, IPA.k, IPA.g];

export const useIPA = () => useAppStore().ipa;
