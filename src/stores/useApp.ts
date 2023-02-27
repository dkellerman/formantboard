import type PianoBar from '../components/PianoBar.vue';
import type Keyboard from '../components/Keyboard.vue';
import type MidiInput from '../components/MidiInput.vue';
import type Player from '../components/Player.vue';
import type Visualizer from '../components/Visualizer.vue';
import type SettingsPanel from '../components/SettingsPanel.vue';
import type { Vowel } from './useSettings';

export const useApp = defineStore('app', () => {
  const { settings } = storeToRefs(useSettings());
  const keyboard = ref<typeof Keyboard>();
  const visualizer = ref<typeof Visualizer>();
  const settingsPanel = ref<typeof SettingsPanel>();
  const player = ref<typeof Player>();
  const midi = ref<typeof MidiInput>();
  const bar = ref<typeof PianoBar>();
  const vowel = ref<Vowel>(settings.value.defaultVowel);
  const volume = ref(100);


  const audioContext = computed(() => new AudioContext({
    ...settings.value.audioContextConfig,
    latencyHint: 'interactive',
  }));

  return {
    keyboard,
    player,
    visualizer,
    midi,
    bar,
    vowel,
    settings,
    settingsPanel,
    audioContext,
    volume,
  };
});
