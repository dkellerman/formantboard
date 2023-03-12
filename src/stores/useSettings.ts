import { Note } from "../utils";
import { Vowel, Vowels } from "./useVowel";
import { VisType } from "./useVisType";

export type Settings = {
  defaultNote: Note;
  defaultVowel: Vowel;
  defaultVisType: VisType;
  f0: {
    on: boolean;
    keyGain: number;
    onsetTime: number;
    decayTime: number;
    source: string;
    sourceType: string;
  };
  viz: {
    on: boolean;
    antialias: boolean;
    background: string;
    color: string;
    lineWidth: number;
    hue: number;
    formantColorOn: string;
    formantColorOff: string;
    harmonicColor: string;
  };
  harmonics: {
    on: boolean;
    max: number;
    maxFreq: number;
    tilt: number;
  };
  preemphasis: {
    on: boolean;
    frequency: number;
    Q: number;
    gain: number;
  };
  tube: {
    on: boolean;
  };
  formants: {
    on: boolean;
    vowels: Record<Vowel, Array<Formant>>;
  };
  compression: DynamicsCompressorOptions & {
    on: boolean;
  };
  vibrato: {
    rate: number;
    extent: number;
    jitter: number;
    onsetTime: number;
    on: boolean;
  };
  flutter: {
    amount: number;
    on: boolean;
  };
  audioContextConfig: {
    sampleRate: number;
    channels: number;
  };
  analyzer: {
    on: boolean;
    useFloatData: boolean;
    fftSize: number;
    smoothingTimeConstant: number;
  };
};

export type Formant = {
  on: boolean;
  frequency: number;
  Q: number;
  gain: number;
};

export type VowelSpecs = Settings['formants']['vowels'];
export type VowelSpec = VowelSpecs[Vowel];
export type Vibrato = Settings['vibrato'];

export const useSettings = defineStore('settings', () => {
  const compressorDefaults = new DynamicsCompressorNode(new AudioContext());
  const formantDefaults = { on: true, Q: 10, gain: 20 };

  const settings = ref<Settings>({
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
      keyGain: 0.01,
      onsetTime: 0.02,
      decayTime: 0.05,
      source: 'osc',
      sourceType: 'sine',
    },
    harmonics: {
      on: true,
      max: 40,
      maxFreq: 22050,
      tilt: -1.0,
    },
    preemphasis: {
      on: true,
      frequency: 18000,
      Q: 0.1,
      gain: 12.0,
    },
    flutter: {
      on: true,
      amount: 1.0,
    },
    vibrato: {
      on: true,
      rate: 6.5,
      extent: 3.0,
      jitter: 0.0,
      onsetTime: 0.5,
    },
    compression: {
      on: false,
      threshold: 0.0, // compressorDefaults.threshold.value,
      knee: compressorDefaults.knee.value,
      ratio: compressorDefaults.ratio.value,
      attack: compressorDefaults.attack.value,
      release: compressorDefaults.release.value,
    },
    tube: {
      on: false,
    },
    analyzer: {
      on: true,
      useFloatData: false,
      fftSize: 4096,
      smoothingTimeConstant: 0,
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
  });

  return { settings };
});
