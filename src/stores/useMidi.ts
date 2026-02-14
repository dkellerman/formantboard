import { useAppStore } from './appStore';

export const useMidi = () => useAppStore().midi;
