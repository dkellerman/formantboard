import { Vowel, Vowels } from "./useVowel";
import { VisType } from "./useVisType";

export type Settings = typeof defaultSettings;
export type VowelSpecs = Settings['formants']['vowels'];
export type VowelSpec = VowelSpecs[Vowel];
export type Formant = VowelSpec[number];
export type Vibrato = Settings['vibrato'];

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>(defaultSettings);
  return { settings };
});

const compressorDefaults = new DynamicsCompressorNode(new AudioContext());
const formantDefaults = { on: true, Q: 10, gain: 20 };

const defaultSettings = {
  defaultNote: 'E3',
  defaultVowel: Vowels.ɑ,
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
    vowels: {
      [Vowels.ɑ]: [
        { ...formantDefaults, frequency: 800 },
        { ...formantDefaults, frequency: 1200 },
        { ...formantDefaults, frequency: 2500 },
      ],
      [Vowels.i]: [
        { ...formantDefaults, frequency: 270 },
        { ...formantDefaults, frequency: 2300 },
        { ...formantDefaults, frequency: 3000 },
      ],
      [Vowels.ɪ]: [
        { ...formantDefaults, frequency: 400 },
        { ...formantDefaults, frequency: 2000 },
        { ...formantDefaults, frequency: 2550 },
      ],
      [Vowels.ɛ]: [
        { ...formantDefaults, frequency: 530 },
        { ...formantDefaults, frequency: 1850 },
        { ...formantDefaults, frequency: 2500 },
      ],
      [Vowels.æ]: [
        { ...formantDefaults, frequency: 660 },
        { ...formantDefaults, frequency: 1700 },
        { ...formantDefaults, frequency: 2400 },
      ],
      [Vowels.ɔ]: [
        { ...formantDefaults, frequency: 500 },
        { ...formantDefaults, frequency: 800 },
        { ...formantDefaults, frequency: 2830 },
      ],
      [Vowels.ʊ]: [
        { ...formantDefaults, frequency: 640 },
        { ...formantDefaults, frequency: 1200 },
        { ...formantDefaults, frequency: 2400 },
      ],
      [Vowels.u]: [
        { ...formantDefaults, frequency: 300 },
        { ...formantDefaults, frequency: 870 },
        { ...formantDefaults, frequency: 2250 },
      ],
      [Vowels.ə]: [
        { ...formantDefaults, frequency: 600 },
        { ...formantDefaults, frequency: 1000 },
        { ...formantDefaults, frequency: 2400 },
      ],
    },
  },
};
