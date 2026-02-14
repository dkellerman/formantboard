import { type IPAType, IPA as IPAEnum } from "./ipaEnum";
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
  defaultIPA: IPAEnum.ɑ,
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
      [IPAEnum.ɑ]: [
        { ...formantDefaults, frequency: 800 },
        { ...formantDefaults, frequency: 1200 },
        { ...formantDefaults, frequency: 2500 },
      ],
      // [IPAEnum.ɑ]: [
      //   { ...formantDefaults, frequency: 750 },
      //   { ...formantDefaults, frequency: 940 },
      //   { ...formantDefaults, frequency: 190 },
      // ],
      [IPAEnum.i]: [
        { ...formantDefaults, frequency: 270 },
        { ...formantDefaults, frequency: 2300 },
        { ...formantDefaults, frequency: 3000 },
      ],
      // [IPAEnum.i]: [
      //   { ...formantDefaults, frequency: 240 },
      //   { ...formantDefaults, frequency: 2400 },
      //   { ...formantDefaults, frequency: 2160 },
      // ],
      [IPAEnum.ɪ]: [
        { ...formantDefaults, frequency: 400 },
        { ...formantDefaults, frequency: 2000 },
        { ...formantDefaults, frequency: 2550 },
      ],
      // [IPAEnum.ɪ]: [
      //   { ...formantDefaults, frequency: 390 },
      //   { ...formantDefaults, frequency: 1990 },
      //   { ...formantDefaults, frequency: 2550 },
      // ],
      [IPAEnum.ɛ]: [
        { ...formantDefaults, frequency: 530 },
        { ...formantDefaults, frequency: 1850 },
        { ...formantDefaults, frequency: 2500 },
      ],
      // [IPAEnum.ɛ]: [
      //   { ...formantDefaults, frequency: 610 },
      //   { ...formantDefaults, frequency: 1900 },
      //   { ...formantDefaults, frequency: 1290 },
      // ],
      [IPAEnum.æ]: [
        { ...formantDefaults, frequency: 660 },
        { ...formantDefaults, frequency: 1700 },
        { ...formantDefaults, frequency: 2400 },
      ],
      [IPAEnum.ɔ]: [
        { ...formantDefaults, frequency: 500 },
        { ...formantDefaults, frequency: 800 },
        { ...formantDefaults, frequency: 2830 },
      ],
      // [IPAEnum.ɔ]: [
      //   { ...formantDefaults, frequency: 500 },
      //   { ...formantDefaults, frequency: 700 },
      //   { ...formantDefaults, frequency: 200 },
      // ],
      [IPAEnum.ʊ]: [
        { ...formantDefaults, frequency: 640 },
        { ...formantDefaults, frequency: 1200 },
        { ...formantDefaults, frequency: 2400 },
      ],
      [IPAEnum.u]: [
        { ...formantDefaults, frequency: 300 },
        { ...formantDefaults, frequency: 870 },
        { ...formantDefaults, frequency: 2250 },
      ],
      // [IPAEnum.u]: [
      //   { ...formantDefaults, frequency: 250 },
      //   { ...formantDefaults, frequency: 595 },
      //   { ...formantDefaults, frequency: 345 },
      // ],
      [IPAEnum.ə]: [
        { ...formantDefaults, frequency: 600 },
        { ...formantDefaults, frequency: 1000 },
        { ...formantDefaults, frequency: 2400 },
      ],
      [IPAEnum.y]: [
        { ...formantDefaults, frequency: 235 },
        { ...formantDefaults, frequency: 2100 },
        { ...formantDefaults, frequency: 1865 },
      ],
      [IPAEnum.e]: [
        { ...formantDefaults, frequency: 390 },
        { ...formantDefaults, frequency: 2300 },
        { ...formantDefaults, frequency: 1910 },
      ],
      [IPAEnum.ø]: [
        { ...formantDefaults, frequency: 370 },
        { ...formantDefaults, frequency: 1900 },
        { ...formantDefaults, frequency: 1530 },
      ],
      [IPAEnum.œ]: [
        { ...formantDefaults, frequency: 585 },
        { ...formantDefaults, frequency: 1710 },
        { ...formantDefaults, frequency: 1125 },
      ],
      [IPAEnum.a]: [
        { ...formantDefaults, frequency: 850 },
        { ...formantDefaults, frequency: 1610 },
        { ...formantDefaults, frequency: 760 },
      ],
      [IPAEnum.ɶ]: [
        { ...formantDefaults, frequency: 820 },
        { ...formantDefaults, frequency: 1530 },
        { ...formantDefaults, frequency: 710 },
      ],
      [IPAEnum.ɒ]: [
        { ...formantDefaults, frequency: 700 },
        { ...formantDefaults, frequency: 760 },
        { ...formantDefaults, frequency: 60 },
      ],
      [IPAEnum.ʌ]: [
        { ...formantDefaults, frequency: 600 },
        { ...formantDefaults, frequency: 1170 },
        { ...formantDefaults, frequency: 570 },
      ],
      [IPAEnum.ɤ]: [
        { ...formantDefaults, frequency: 460 },
        { ...formantDefaults, frequency: 1310 },
        { ...formantDefaults, frequency: 850 },
      ],
      [IPAEnum.o]: [
        { ...formantDefaults, frequency: 360 },
        { ...formantDefaults, frequency: 640 },
        { ...formantDefaults, frequency: 280 },
      ],
      [IPAEnum.ɯ]: [
        { ...formantDefaults, frequency: 300 },
        { ...formantDefaults, frequency: 1390 },
        { ...formantDefaults, frequency: 1090 },
      ],
      // [IPAEnum.ʊ]: [
      //   { ...formantDefaults, frequency: 300 },
      //   { ...formantDefaults, frequency: 870 },
      //   { ...formantDefaults, frequency: 2240 },
      // ],
      // [IPAEnum.ə]: [
      //   { ...formantDefaults, frequency: 520 },
      //   { ...formantDefaults, frequency: 1190 },
      //   { ...formantDefaults, frequency: 2390 },
      // ],
      // [IPAEnum.æ]: [
      //   { ...formantDefaults, frequency: 660 },
      //   { ...formantDefaults, frequency: 1720 },
      //   { ...formantDefaults, frequency: 2410 },
      // ],
      [IPAEnum.ŋ]: [
        { ...formantDefaults, frequency: 325 },
        { ...formantDefaults, frequency: 1250 },
        { ...formantDefaults, frequency: 2500 },
      ],
      [IPAEnum.ʧ]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 1750 },
      ],
      [IPAEnum.θ]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 6000 },
      ],
      [IPAEnum.ð]: [
        { ...formantDefaults, frequency: 300 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 5250 },
      ],
      [IPAEnum.ʤ]: [
        { ...formantDefaults, frequency: 250 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2500 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.ʃ]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 1750 },
        { ...formantDefaults, frequency: 5000 },
      ],
      [IPAEnum.w]: [
        { ...formantDefaults, frequency: 525 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.n]: [
        { ...formantDefaults, frequency: 300 },
        { ...formantDefaults, frequency: 1250 },
        { ...formantDefaults, frequency: 2500 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.m]: [
        { ...formantDefaults, frequency: 300 },
        { ...formantDefaults, frequency: 1250 },
        { ...formantDefaults, frequency: 3000 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.r]: [
        { ...formantDefaults, frequency: 700 },
        { ...formantDefaults, frequency: 2250 },
        { ...formantDefaults, frequency: 2100 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.g]: [
        { ...formantDefaults, frequency: 250 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2000 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.j]: [
        { ...formantDefaults, frequency: 250 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2500 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.l]: [
        { ...formantDefaults, frequency: 325 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2500 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.d]: [
        { ...formantDefaults, frequency: 350 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2750 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.z]: [
        { ...formantDefaults, frequency: 250 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 4500 },
      ],
      [IPAEnum.v]: [
        { ...formantDefaults, frequency: 350 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 4000 },
      ],
      [IPAEnum.h]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 1750 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.p]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 1750 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.k]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2250 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.t]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 3000 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.s]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 5500 },
      ],
      [IPAEnum.f]: [
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 4500 },
      ],
      [IPAEnum.b]: [
        { ...formantDefaults, frequency: 350 },
        { ...formantDefaults, frequency: 0 },
        { ...formantDefaults, frequency: 2250 },
        { ...formantDefaults, frequency: 0 },
      ],
      [IPAEnum.ʒ]: [
        { ...formantDefaults, frequency: 500 },
        { ...formantDefaults, frequency: 1500 },
        { ...formantDefaults, frequency: 2500 },
      ],
    },
  },
};
