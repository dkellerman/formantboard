import { useStore } from "zustand";
import { appStore, useAppStore, type AppStore } from "../store";

function useAppSlice<T>(selector: (store: AppStore) => T): T {
  useStore(appStore, (state) => state.__version);
  return selector(useAppStore());
}

export const usePlayer = () => useAppSlice((store) => store.player);
export const useSettings = () => useAppSlice((store) => store.settings.settings);
export const useIPASlice = () => useAppSlice((store) => store.ipa);
export const useVisTypeSlice = () => useAppSlice((store) => store.visType);
export const useKeyboardLayoutSlice = () => useAppSlice((store) => store.keyboardLayout);
export const useMetrics = () => useAppSlice((store) => store.metrics);
export const useMidi = () => useAppSlice((store) => store.midi);
