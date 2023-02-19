import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Settings, Vowel } from '../types';

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>({
    midiInDeviceId: null,
    midiInChannel: null,
    onsetTime: 0.01,
    decayTime: 0.1,
    tilt: -6.0,
    formants: {
      [Vowel.a]: [
        { frequency: 800, Q: 0.1 },
        { frequency: 1200, Q: 0.1 },
        { frequency: 2500, Q: 0.1 },
        { frequency: 2700, Q: 0.1 },
        { frequency: 2900, Q: 0.1 },
      ],
      [Vowel.e]: [],
      [Vowel.i]: [],
      [Vowel.o]: [],
      [Vowel.u]: [],
    },
  });

  // TODO: from URL, local storage
  return { settings };
});
