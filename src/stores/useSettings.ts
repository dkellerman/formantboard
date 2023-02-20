import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Settings, Vowel } from '../types';

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>({
    midiInDeviceId: null,
    midiInChannel: null,
    onsetTime: 0.01,
    decayTime: 0.1,
    tilt: -3,
    vowel: Vowel.ɑ,
    formantSpecs: {
      [Vowel.ɑ]: [  // as in "father"
        { frequency: 800, Q: 0.0625 },
        { frequency: 1200, Q: 0.0833 },
        { frequency: 2500, Q: 0.04 },
        { frequency: 2700, Q: 0.037 },
        { frequency: 2900, Q: 0.0345 },
      ],
      [Vowel.i]: [  // as in "fleece"
        { frequency: 300, Q: 0.067 },
        { frequency: 2200, Q: 0.0455 },
        { frequency: 2800, Q: 0.0357 },
      ],
      [Vowel.ɪ]: [  // as in "kit"
        { frequency: 400, Q: 0.05 },
        { frequency: 1700, Q: 0.0353 },
        { frequency: 2400, Q: 0.0292 },
      ],
      [Vowel.ɛ]: [  // as in "dress"
        { frequency: 600, Q: 0.067 },
        { frequency: 1700, Q: 0.0471 },
        { frequency: 2400, Q: 0.0417 },
      ],
      [Vowel.æ]: [  // as in "trap"
        { frequency: 730, Q: 0.0548 },
        { frequency: 1090, Q: 0.0734 },
        { frequency: 2560, Q: 0.0391 },
      ],
      [Vowel.ɑ]: [  // as in "father"
        { frequency: 800, Q: 0.0625 },
        { frequency: 1200, Q: 0.0833 },
        { frequency: 2500, Q: 0.04 },
        { frequency: 2700, Q: 0.037 },
        { frequency: 2900, Q: 0.0345 },
      ],
      [Vowel.ɔ]: [  // as in "thought"
        { frequency: 500, Q: 0.16 },
        { frequency: 800, Q: 0.1125 },
        { frequency: 2830, Q: 0.0356 },
      ],
      [Vowel.ʊ]: [  // as in "foot"
        { frequency: 325, Q: 0.3077 },
        { frequency: 700, Q: 0.1429 },
        { frequency: 2530, Q: 0.0315 },
      ],
      [Vowel.u]: [  // as in "goose"
        { frequency: 325, Q: 0.3077 },
        { frequency: 700, Q: 0.1429 },
        { frequency: 2530, Q: 0.0315 },
      ],
      [Vowel.ə]: [  // as in "sofa"
        { frequency: 600, Q: 0.1667 },
        { frequency: 1000, Q: 0.1 },
        { frequency: 2400, Q: 0.0417 },
      ],
      [Vowel.eɪ]: [  // as in "face"
        { frequency: 500, Q: 0.14 },
        { frequency: 1700, Q: 0.0588 },
        { frequency: 2400, Q: 0.0417 },
      ],
      [Vowel.aɪ]: [  // as in "price"
        { frequency: 500, Q: 0.14 },
        { frequency: 1500, Q: 0.0667 },
        { frequency: 2400, Q: 0.0417 },
      ],
      [Vowel.oʊ]: [  // as in "goat"
        { frequency: 450, Q: 0.1778 },
        { frequency: 800, Q: 0.0875 },
        { frequency: 2830, Q: 0.0356 },
      ],
      [Vowel.aʊ]: [  // as in "mouth"
        { frequency: 700, Q: 0.1429 },
        { frequency: 1230, Q: 0.0813 },
        { frequency: 2450, Q: 0.0408 },
      ],
      [Vowel.ɔɪ]: [  // as in "choice"
        { frequency: 500, Q: 0.14 },
        { frequency: 1330, Q: 0.0752 },
        { frequency: 2500, Q: 0.04 },
      ],
    },
  });

  // TODO: from URL, local storage
  return { settings };
});
