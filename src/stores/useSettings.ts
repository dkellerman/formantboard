import { type IPAType, IPA } from "./useIPA";
import { VisType } from "./useVisType";

export type Settings = typeof defaultSettings;
export type IPASpecs = Settings['formants']['ipa'];
export type IPASpec = IPASpecs[IPAType];
export type Formant = IPASpec[number];
export type Vibrato = Settings['vibrato'];

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>(defaultSettings);
  return { settings };
});

const compressorDefaults = new DynamicsCompressorNode(new AudioContext());
const formantDefaults = { on: true, Q: 10, gain: 20 };

const defaultSettings = {
  defaultNote: 'E3',
  defaultIPA: IPA.ɑ,
  defaultVisType: VisType.POWER,
  audioContextConfig: {
    sampleRate: 44100,
    channels: 1,
  },
  viz: {
    on: true,
    antialias: true,
    background: '#010101',
    color: '#fff',
    lineWidth: 2,
    hue: 300,
    formantColorOn: 'forestgreen',
    formantColorOff: '#664444',
    harmonicColor: 'steelblue',
  },
  f0: {
    on: true,
    keyGain: .1,
    onsetTime: 0.02,
    decayTime: 0.05,
    source: 'osc',
    sourceType: 'sine',
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
    attack: .005,
    release: .050,
  },
  analyzer: {
    on: true,
    useFloatData: false,
    fftSize: 2**11,
    smoothingTimeConstant: .7,
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
