import { useAppStore } from "../store";

export const useKeyboardLayout = () => useAppStore().keyboardLayout;
