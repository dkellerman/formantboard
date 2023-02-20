import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Settings, Vowel } from '../types';

export const useSettings = defineStore('settings', () => {
  const on = true;
  const settings = ref<Settings>({
    onsetTime: 0.01,
    decayTime: 0.1,
    tilt: -3,
    vowel: Vowel.ɑ,
    vibrato: {
      rate: 4,
      extent: .75,
      jitter: 0.1,
      onsetTime: .75,
      on: true,
    },
    formantSpecs: {
      [Vowel.ɑ]: [  // as in "father"
        { frequency: 800, Q: 0.0625, on },
        { frequency: 1200, Q: 0.0833, on },
        { frequency: 2500, Q: 0.04, on },
        { frequency: 2700, Q: 0.037, on },
        { frequency: 2900, Q: 0.0345, on },
      ],
      [Vowel.i]: [  // as in "fleece"
        { frequency: 300, Q: 0.067, on },
        { frequency: 2200, Q: 0.0455, on },
        { frequency: 2800, Q: 0.0357, on },
      ],
      [Vowel.ɪ]: [  // as in "kit"
        { frequency: 400, Q: 0.05, on },
        { frequency: 1700, Q: 0.0353, on },
        { frequency: 2400, Q: 0.0292, on },
      ],
      [Vowel.ɛ]: [  // as in "dress"
        { frequency: 600, Q: 0.067, on },
        { frequency: 1700, Q: 0.0471, on },
        { frequency: 2400, Q: 0.0417, on },
      ],
      [Vowel.æ]: [  // as in "trap"
        { frequency: 730, Q: 0.0548, on },
        { frequency: 1090, Q: 0.0734, on },
        { frequency: 2560, Q: 0.0391, on },
      ],
      [Vowel.ɑ]: [  // as in "father"
        { frequency: 800, Q: 0.0625, on },
        { frequency: 1200, Q: 0.0833, on },
        { frequency: 2500, Q: 0.04, on },
        { frequency: 2700, Q: 0.037, on },
        { frequency: 2900, Q: 0.0345, on },
      ],
      [Vowel.ɔ]: [  // as in "thought"
        { frequency: 500, Q: 0.16, on },
        { frequency: 800, Q: 0.1125, on },
        { frequency: 2830, Q: 0.0356, on },
      ],
      [Vowel.ʊ]: [  // as in "foot"
        { frequency: 325, Q: 0.3077, on },
        { frequency: 700, Q: 0.1429, on },
        { frequency: 2530, Q: 0.0315, on },
      ],
      [Vowel.u]: [  // as in "goose"
        { frequency: 325, Q: 0.3077, on },
        { frequency: 700, Q: 0.1429, on },
        { frequency: 2530, Q: 0.0315, on },
      ],
      [Vowel.ə]: [  // as in "sofa"
        { frequency: 600, Q: 0.1667, on },
        { frequency: 1000, Q: 0.1, on },
        { frequency: 2400, Q: 0.0417, on },
      ],
    },
  });

  // TODO: from URL, local storage
  return { settings };
});
