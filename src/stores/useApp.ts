import type PianoBar from '../components/PianoBar.vue';
import type Keyboard from '../components/Keyboard.vue';
import type MidiInput from '../components/MidiInput.vue';
import type Player from '../components/Player.vue';
import type { Vowel } from './useSettings';

export const useApp = defineStore('app', () => {
  const keyboard = ref<typeof Keyboard>();
  const player = ref<typeof Player>();
  const midi = ref<typeof MidiInput>();
  const bar = ref<typeof PianoBar>();
  const vowel = ref<Vowel>();
  const { settings, audioContext } = useSettings();

  return {
    keyboard,
    player,
    midi,
    bar,
    vowel,
    settings,
    audioContext,
  };
});
