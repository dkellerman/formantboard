export enum Vowel {
  a = 'a',
  e = 'e',
  i = 'i',
  o = 'o',
  u = 'u',
}

export type Formant = {
  frequency: number;
  Q: number;
};

export type Settings = {
  midiInDeviceId: string | null;
  midiInChannel: number | null;
  onsetTime: number;
  decayTime: number;
  tilt: number;
  formants: Record<Vowel, Array<Formant>>;
};
