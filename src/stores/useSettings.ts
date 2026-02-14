import { useAppStore } from './appStore';

export type {
  Formant,
  IPASpec,
  IPASpecs,
  Settings,
  Vibrato,
} from './settingsDefaults';

export const useSettings = () => useAppStore().settings;
