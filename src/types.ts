export enum Vowel {
  i = 'i', // as in "fleece"
  ɪ = 'ɪ', // as in "kit"
  ɛ = 'ɛ', // as in "dress"
  æ = 'æ', // as in "trap"
  ɑ = 'ɑ', // as in "father"
  ɔ = 'ɔ', // as in "thought"
  ʊ = 'ʊ', // as in "foot"
  u = 'u', // as in "goose"
  ə = 'ə', // as in "sofa"
  eɪ = 'eɪ', // as in "face"
  aɪ = 'aɪ', // as in "price"
  oʊ = 'oʊ', // as in "goat"
  aʊ = 'aʊ', // as in "mouth"
  ɔɪ = 'ɔɪ', // as in "choice"
}

export type FormantSpec = {
  frequency: number;
  Q: number;
  on?: boolean;
};

export type Settings = {
  midiInDeviceId: string | null;
  midiInChannel: number | null;
  onsetTime: number;
  decayTime: number;
  tilt: number;
  formantSpecs: Record<Vowel, Array<FormantSpec>>;
  vowel: Vowel;
};
