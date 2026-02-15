export enum IPA {
  ɑ = "ɑ",
  ɛ = "ɛ",
  ə = "ə",
  æ = "æ",
  ɔ = "ɔ",
  u = "u",
  ʊ = "ʊ",
  ɪ = "ɪ",
  i = "i",
  e = "e",
  ø = "ø",
  ɶ = "ɶ",
  ɒ = "ɒ",
  ʌ = "ʌ",
  ɤ = "ɤ",
  o = "o",
  ɯ = "ɯ",
  ŋ = "ŋ",
  ʧ = "ʧ",
  θ = "θ",
  ð = "ð",
  ʤ = "ʤ",
  ʃ = "ʃ",
  w = "w",
  n = "n",
  m = "m",
  r = "r",
  g = "g",
  j = "j",
  l = "l",
  d = "d",
  z = "z",
  v = "v",
  h = "h",
  p = "p",
  k = "k",
  t = "t",
  s = "s",
  f = "f",
  b = "b",
  y = "y",
  œ = "œ",
  a = "a",
  ʒ = "ʒ",
}

export const IPA_WORDS: Record<IPA, string> = {
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

export const ALL_IPA = Object.values(IPA) as IPA[];
export const VOWELS = [IPA.ɑ, IPA.ɛ, IPA.ə, IPA.æ, IPA.ɔ, IPA.u, IPA.ʊ, IPA.ɪ, IPA.i];
export const COMMON_IPA = VOWELS;
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

export enum MidiStatus {
  Disabled,
  Enabled,
  Failed,
}

export enum VisType {
  POWER,
  WAVE,
}

export const VIS_TYPES = [
  { title: "Spectrum", value: VisType.POWER },
  { title: "Wave", value: VisType.WAVE },
];

export const F0_SOURCE_OSC = "osc";
export const F0_SOURCE_NOISE = "noise";
export const OSC_TYPE_SINE = "sine";
export const OSC_TYPE_SAWTOOTH = "sawtooth";
export const OSC_TYPE_SQUARE = "square";

export const F0_SOURCES = [
  { title: "Tone", value: F0_SOURCE_OSC },
  { title: "Noise", value: F0_SOURCE_NOISE },
] as const;

export const F0_OSC_SOURCE_TYPES = [
  { title: "Sine", value: OSC_TYPE_SINE },
  { title: "Sawtooth", value: OSC_TYPE_SAWTOOTH },
  { title: "Square", value: OSC_TYPE_SQUARE },
] as const;

const compressorDefaults = new DynamicsCompressorNode(new AudioContext());
const formantDefaults = { on: true, Q: 10, gain: 20 };

export function createDefaultSettings() {
  return {
    defaultNote: "E3",
    defaultIPA: IPA.ɑ,
    defaultVisType: VisType.POWER,
    audioContextConfig: {
      sampleRate: 44100,
      channels: 1,
    },
    viz: {
      on: true,
      antialias: true,
      background: "#010101",
      color: "#fff",
      lineWidth: 2,
      hue: 300,
      formantColorOn: "forestgreen",
      formantColorOff: "#664444",
      harmonicColor: "steelblue",
    },
    f0: {
      on: true,
      keyGain: 0.1,
      onsetTime: 0.02,
      decayTime: 0.05,
      source: F0_SOURCE_OSC as typeof F0_SOURCE_OSC | typeof F0_SOURCE_NOISE,
      sourceType: F0_OSC_SOURCE_TYPES[0].value as OscillatorType,
    },
    harmonics: {
      on: true,
      max: 40,
      maxFreq: 12000,
      tilt: -3.0,
    },
    flutter: {
      on: true,
      amount: 1.0,
    },
    vibrato: {
      on: true,
      rate: 5,
      extent: 2.0,
      jitter: 0.0,
      onsetTime: 0.5,
    },
    compression: {
      on: false,
      ...compressorDefaults,
      threshold: 0.0,
      knee: 0.0,
      ratio: 20.0,
      attack: 0.005,
      release: 0.05,
    },
    analyzer: {
      on: true,
      useFloatData: false,
      fftSize: 2 ** 11,
      smoothingTimeConstant: 0.7,
    },
    formants: {
      on: true,
      ipa: {
        [IPA.ɑ]: [
          { ...formantDefaults, frequency: 800 },
          { ...formantDefaults, frequency: 1200 },
          { ...formantDefaults, frequency: 2500 },
        ],
        // [IPA.ɑ]: [
        //   { ...formantDefaults, frequency: 750 },
        //   { ...formantDefaults, frequency: 940 },
        //   { ...formantDefaults, frequency: 190 },
        // ],
        [IPA.i]: [
          { ...formantDefaults, frequency: 270 },
          { ...formantDefaults, frequency: 2300 },
          { ...formantDefaults, frequency: 3000 },
        ],
        // [IPA.i]: [
        //   { ...formantDefaults, frequency: 240 },
        //   { ...formantDefaults, frequency: 2400 },
        //   { ...formantDefaults, frequency: 2160 },
        // ],
        [IPA.ɪ]: [
          { ...formantDefaults, frequency: 400 },
          { ...formantDefaults, frequency: 2000 },
          { ...formantDefaults, frequency: 2550 },
        ],
        // [IPA.ɪ]: [
        //   { ...formantDefaults, frequency: 390 },
        //   { ...formantDefaults, frequency: 1990 },
        //   { ...formantDefaults, frequency: 2550 },
        // ],
        [IPA.ɛ]: [
          { ...formantDefaults, frequency: 530 },
          { ...formantDefaults, frequency: 1850 },
          { ...formantDefaults, frequency: 2500 },
        ],
        // [IPA.ɛ]: [
        //   { ...formantDefaults, frequency: 610 },
        //   { ...formantDefaults, frequency: 1900 },
        //   { ...formantDefaults, frequency: 1290 },
        // ],
        [IPA.æ]: [
          { ...formantDefaults, frequency: 660 },
          { ...formantDefaults, frequency: 1700 },
          { ...formantDefaults, frequency: 2400 },
        ],
        [IPA.ɔ]: [
          { ...formantDefaults, frequency: 500 },
          { ...formantDefaults, frequency: 800 },
          { ...formantDefaults, frequency: 2830 },
        ],
        // [IPA.ɔ]: [
        //   { ...formantDefaults, frequency: 500 },
        //   { ...formantDefaults, frequency: 700 },
        //   { ...formantDefaults, frequency: 200 },
        // ],
        [IPA.ʊ]: [
          { ...formantDefaults, frequency: 640 },
          { ...formantDefaults, frequency: 1200 },
          { ...formantDefaults, frequency: 2400 },
        ],
        [IPA.u]: [
          { ...formantDefaults, frequency: 300 },
          { ...formantDefaults, frequency: 870 },
          { ...formantDefaults, frequency: 2250 },
        ],
        // [IPA.u]: [
        //   { ...formantDefaults, frequency: 250 },
        //   { ...formantDefaults, frequency: 595 },
        //   { ...formantDefaults, frequency: 345 },
        // ],
        [IPA.ə]: [
          { ...formantDefaults, frequency: 600 },
          { ...formantDefaults, frequency: 1000 },
          { ...formantDefaults, frequency: 2400 },
        ],
        [IPA.y]: [
          { ...formantDefaults, frequency: 235 },
          { ...formantDefaults, frequency: 2100 },
          { ...formantDefaults, frequency: 1865 },
        ],
        [IPA.e]: [
          { ...formantDefaults, frequency: 390 },
          { ...formantDefaults, frequency: 2300 },
          { ...formantDefaults, frequency: 1910 },
        ],
        [IPA.ø]: [
          { ...formantDefaults, frequency: 370 },
          { ...formantDefaults, frequency: 1900 },
          { ...formantDefaults, frequency: 1530 },
        ],
        [IPA.œ]: [
          { ...formantDefaults, frequency: 585 },
          { ...formantDefaults, frequency: 1710 },
          { ...formantDefaults, frequency: 1125 },
        ],
        [IPA.a]: [
          { ...formantDefaults, frequency: 850 },
          { ...formantDefaults, frequency: 1610 },
          { ...formantDefaults, frequency: 760 },
        ],
        [IPA.ɶ]: [
          { ...formantDefaults, frequency: 820 },
          { ...formantDefaults, frequency: 1530 },
          { ...formantDefaults, frequency: 710 },
        ],
        [IPA.ɒ]: [
          { ...formantDefaults, frequency: 700 },
          { ...formantDefaults, frequency: 760 },
          { ...formantDefaults, frequency: 60 },
        ],
        [IPA.ʌ]: [
          { ...formantDefaults, frequency: 600 },
          { ...formantDefaults, frequency: 1170 },
          { ...formantDefaults, frequency: 570 },
        ],
        [IPA.ɤ]: [
          { ...formantDefaults, frequency: 460 },
          { ...formantDefaults, frequency: 1310 },
          { ...formantDefaults, frequency: 850 },
        ],
        [IPA.o]: [
          { ...formantDefaults, frequency: 360 },
          { ...formantDefaults, frequency: 640 },
          { ...formantDefaults, frequency: 280 },
        ],
        [IPA.ɯ]: [
          { ...formantDefaults, frequency: 300 },
          { ...formantDefaults, frequency: 1390 },
          { ...formantDefaults, frequency: 1090 },
        ],
        // [IPA.ʊ]: [
        //   { ...formantDefaults, frequency: 300 },
        //   { ...formantDefaults, frequency: 870 },
        //   { ...formantDefaults, frequency: 2240 },
        // ],
        // [IPA.ə]: [
        //   { ...formantDefaults, frequency: 520 },
        //   { ...formantDefaults, frequency: 1190 },
        //   { ...formantDefaults, frequency: 2390 },
        // ],
        // [IPA.æ]: [
        //   { ...formantDefaults, frequency: 660 },
        //   { ...formantDefaults, frequency: 1720 },
        //   { ...formantDefaults, frequency: 2410 },
        // ],
        [IPA.ŋ]: [
          { ...formantDefaults, frequency: 325 },
          { ...formantDefaults, frequency: 1250 },
          { ...formantDefaults, frequency: 2500 },
        ],
        [IPA.ʧ]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 1750 },
        ],
        [IPA.θ]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 6000 },
        ],
        [IPA.ð]: [
          { ...formantDefaults, frequency: 300 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 5250 },
        ],
        [IPA.ʤ]: [
          { ...formantDefaults, frequency: 250 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2500 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.ʃ]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 1750 },
          { ...formantDefaults, frequency: 5000 },
        ],
        [IPA.w]: [
          { ...formantDefaults, frequency: 525 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.n]: [
          { ...formantDefaults, frequency: 300 },
          { ...formantDefaults, frequency: 1250 },
          { ...formantDefaults, frequency: 2500 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.m]: [
          { ...formantDefaults, frequency: 300 },
          { ...formantDefaults, frequency: 1250 },
          { ...formantDefaults, frequency: 3000 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.r]: [
          { ...formantDefaults, frequency: 700 },
          { ...formantDefaults, frequency: 2250 },
          { ...formantDefaults, frequency: 2100 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.g]: [
          { ...formantDefaults, frequency: 250 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2000 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.j]: [
          { ...formantDefaults, frequency: 250 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2500 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.l]: [
          { ...formantDefaults, frequency: 325 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2500 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.d]: [
          { ...formantDefaults, frequency: 350 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2750 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.z]: [
          { ...formantDefaults, frequency: 250 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 4500 },
        ],
        [IPA.v]: [
          { ...formantDefaults, frequency: 350 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 4000 },
        ],
        [IPA.h]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 1750 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.p]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 1750 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.k]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2250 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.t]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 3000 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.s]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 5500 },
        ],
        [IPA.f]: [
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 4500 },
        ],
        [IPA.b]: [
          { ...formantDefaults, frequency: 350 },
          { ...formantDefaults, frequency: 0 },
          { ...formantDefaults, frequency: 2250 },
          { ...formantDefaults, frequency: 0 },
        ],
        [IPA.ʒ]: [
          { ...formantDefaults, frequency: 500 },
          { ...formantDefaults, frequency: 1500 },
          { ...formantDefaults, frequency: 2500 },
        ],
      },
    },
  };
}
