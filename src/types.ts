export enum Vowel {
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

export type FormantSpec = {
  frequency: number;
  Q: number;
  on: boolean;
};

export type Vibrato = {
  rate: number;
  extent: number;
  jitter: number;
  onsetTime: number;
  on: boolean;
};

export type Settings = {
  midiInDeviceId: string | null;
  midiInChannel: number | null;
  onsetTime: number;
  decayTime: number;
  tilt: number;
  formantSpecs: Record<Vowel, Array<FormantSpec>>;
  vowel: Vowel;
  vibrato: Vibrato;
};
