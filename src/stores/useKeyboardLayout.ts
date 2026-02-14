import { useAppStore } from './appStore';

export const useKeyboardLayout = () => useAppStore().keyboardLayout;
