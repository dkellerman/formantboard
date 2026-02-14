import { useAppStore } from './appStore';

export function resetAllStores() {
  useAppStore().resetAll();
}
