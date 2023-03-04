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

export const VOWEL_WORDS: Record<Vowel, string> = {
  [Vowels.i]: "fleece",
  [Vowels.ɪ]: "kit",
  [Vowels.ɛ]: "dress",
  [Vowels.æ]: "trap",
  [Vowels.ɑ]: "father",
  [Vowels.ɔ]: "thought",
  [Vowels.ʊ]: "foot",
  [Vowels.u]: "goose",
  [Vowels.ə]: "sofa",
};

export type Vowel = typeof Vowels[keyof typeof Vowels];

export const useVowel = defineStore('vowel', () => {
  const { settings } = storeToRefs(useSettings());
  const vowel = ref<Vowel>(settings.value.defaultVowel);
  return { vowel };
});
