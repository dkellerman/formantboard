import { useAppStore } from './appStore';

export const usePlayer = () => useAppStore().player;
