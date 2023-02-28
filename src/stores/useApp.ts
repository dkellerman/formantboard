import type PianoBar from '../components/PianoBar.vue';
import type Keyboard from '../components/Keyboard.vue';
import type Visualizer from '../components/Visualizer.vue';
import type SettingsPanel from '../components/SettingsPanel.vue';
import type { Vowel } from './useSettings';

export const useApp = defineStore('app', () => {
  const { settings } = storeToRefs(useSettings());
  const keyboard = ref<typeof Keyboard>();
  const visualizer = ref<typeof Visualizer>();
  const settingsPanel = ref<typeof SettingsPanel>();
  const bar = ref<typeof PianoBar>();
  const vowel = ref<Vowel>(Vowels.ɑ);
  const volume = ref(100);
  const f0 = ref<string>('A3');
  const vizType = ref<string>('power');

  const audioContext = computed(() => new AudioContext({
    ...settings.value.audioContextConfig,
    latencyHint: 'interactive',
  }));

  return {
    keyboard,
    visualizer,
    bar,
    vowel,
    settings,
    settingsPanel,
    audioContext,
    volume,
    f0,
    vizType,
  };
});
