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
    specs: Record<Vowel, Array<{
      frequency: number;
      Q: number;
      on: boolean;
    }>>;
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

export type FormantSpecs = Settings['formants']['specs'];
export type FormantSpec = FormantSpecs[Vowel];
export type FormantBandSpec = FormantSpecs[Vowel][number];
export type Vibrato = Settings['vibrato'];

export const useSettings = defineStore('settings', () => {
  const _comp = new DynamicsCompressorNode(new AudioContext());
  const on = true, Q = .1;

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
    },
    f0: {
      on: true,
      keyGain: 0.04,
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
      threshold: 0.0, // _comp.threshold.value,
      knee: _comp.knee.value,
      ratio: _comp.ratio.value,
      attack: _comp.attack.value,
      release: _comp.release.value,
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
      specs: {
        [Vowels.ɑ]: [
          { frequency: 800, Q: Q ?? 0.0625, on },
          { frequency: 1200, Q: Q ?? 0.0833, on },
          { frequency: 2500, Q: Q ?? 0.04, on },
          { frequency: 2700, Q: Q ?? 0.037, on },
          { frequency: 2900, Q: Q ?? 0.0345, on },
          { frequency: 3500, Q: Q ?? 0.0345, on },
        ],
        [Vowels.i]: [
          { frequency: 300, Q: Q ?? 0.067, on },
          { frequency: 2200, Q: Q ?? 0.0455, on },
          { frequency: 2800, Q: Q ?? 0.0357, on },
        ],
        [Vowels.ɪ]: [
          { frequency: 400, Q: Q ?? 0.05, on },
          { frequency: 1700, Q: Q ?? 0.0353, on },
          { frequency: 2400, Q: Q ?? 0.0292, on },
        ],
        [Vowels.ɛ]: [
          { frequency: 600, Q: Q ?? 0.067, on },
          { frequency: 1700, Q: Q ?? 0.0471, on },
          { frequency: 2400, Q: Q ?? 0.0417, on },
        ],
        [Vowels.æ]: [
          { frequency: 730, Q: Q ?? 0.0548, on },
          { frequency: 1090, Q: Q ?? 0.0734, on },
          { frequency: 2560, Q: Q ?? 0.0391, on },
        ],
        [Vowels.ɔ]: [
          { frequency: 500, Q: Q ?? 0.16, on },
          { frequency: 800, Q: Q ?? 0.1125, on },
          { frequency: 2830, Q: Q ?? 0.0356, on },
        ],
        [Vowels.ʊ]: [
          { frequency: 325, Q: Q ?? 0.3077, on },
          { frequency: 700, Q: Q ?? 0.1429, on },
          { frequency: 2530, Q: Q ?? 0.0315, on },
        ],
        [Vowels.u]: [
          { frequency: 325, Q: Q ?? 0.3077, on },
          { frequency: 700, Q: Q ?? 0.1429, on },
          { frequency: 2530, Q: Q ?? 0.0315, on },
        ],
        [Vowels.ə]: [
          { frequency: 600, Q: Q ?? 0.1667, on },
          { frequency: 1000, Q: Q ?? 0.1, on },
          { frequency: 2400, Q: Q ?? 0.0417, on },
        ],
      },
    },
  });

  return { settings };
});
