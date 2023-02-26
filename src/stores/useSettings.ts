export enum Vowels {
  ɑ = 'ɑ', // as in "father"
  ɛ = 'ɛ', // as in "dress"
  ə = 'ə', // as in "sofa"
  æ = 'æ', // as in "trap"
  ɔ = 'ɔ', // as in "thought"
  u = 'u', // as in "goose"
  ʊ = 'ʊ', // as in "foot"
  ɪ = 'ɪ', // as in "kit"
  i = 'i', // as in "fleece"
}

export type Vowel = typeof Vowels[keyof typeof Vowels];

export type Settings = {
  onsetTime: number;
  decayTime: number;
  tilt: number;
  maxHarmonics: number;
  formantSpecs: Record<Vowel, Array<{
    frequency: number;
    Q: number;
    on: boolean;
  }>>;
  vowel: Vowel;
  vibrato: {
    rate: number;
    extent: number;
    jitter: number;
    onsetTime: number;
    on: boolean;
  };
  audioContextConfig: {
    sampleRate: number;
    channels: number;
  },
};

export type FormantSpecs = Settings['formantSpecs'];
export type FormantSpec = FormantSpecs[Vowel];
export type Vibrato = Settings['vibrato'];

export const useSettings = defineStore('settings', () => {
  const on = true;
  const settings = ref<Settings>({
    audioContextConfig: {
      sampleRate: 44100,
      channels: 1,
    },
    onsetTime: 0.01,
    decayTime: 0.1,
    tilt: -3,
    vowel: Vowels.ɑ,
    maxHarmonics: 40,
    vibrato: {
      rate: 5,
      extent: 1,
      jitter: 0.1,
      onsetTime: .5,
      on: true,
    },
    formantSpecs: {
      [Vowels.ɑ]: [
        { frequency: 800, Q: 0.0625, on },
        { frequency: 1200, Q: 0.0833, on },
        { frequency: 2500, Q: 0.04, on },
        { frequency: 2700, Q: 0.037, on },
        { frequency: 2900, Q: 0.0345, on },
      ],
      [Vowels.i]: [
        { frequency: 300, Q: 0.067, on },
        { frequency: 2200, Q: 0.0455, on },
        { frequency: 2800, Q: 0.0357, on },
      ],
      [Vowels.ɪ]: [
        { frequency: 400, Q: 0.05, on },
        { frequency: 1700, Q: 0.0353, on },
        { frequency: 2400, Q: 0.0292, on },
      ],
      [Vowels.ɛ]: [
        { frequency: 600, Q: 0.067, on },
        { frequency: 1700, Q: 0.0471, on },
        { frequency: 2400, Q: 0.0417, on },
      ],
      [Vowels.æ]: [
        { frequency: 730, Q: 0.0548, on },
        { frequency: 1090, Q: 0.0734, on },
        { frequency: 2560, Q: 0.0391, on },
      ],
      [Vowels.ɑ]: [
        { frequency: 800, Q: 0.0625, on },
        { frequency: 1200, Q: 0.0833, on },
        { frequency: 2500, Q: 0.04, on },
        { frequency: 2700, Q: 0.037, on },
        { frequency: 2900, Q: 0.0345, on },
      ],
      [Vowels.ɔ]: [
        { frequency: 500, Q: 0.16, on },
        { frequency: 800, Q: 0.1125, on },
        { frequency: 2830, Q: 0.0356, on },
      ],
      [Vowels.ʊ]: [
        { frequency: 325, Q: 0.3077, on },
        { frequency: 700, Q: 0.1429, on },
        { frequency: 2530, Q: 0.0315, on },
      ],
      [Vowels.u]: [
        { frequency: 325, Q: 0.3077, on },
        { frequency: 700, Q: 0.1429, on },
        { frequency: 2530, Q: 0.0315, on },
      ],
      [Vowels.ə]: [
        { frequency: 600, Q: 0.1667, on },
        { frequency: 1000, Q: 0.1, on },
        { frequency: 2400, Q: 0.0417, on },
      ],
    },
  });

  // TODO: from URL, local storage
  return {
    settings,
    audioContext: computed(() => new AudioContext({
      ...settings.value.audioContextConfig,
      latencyHint: 'interactive',
    })),
  };
});
