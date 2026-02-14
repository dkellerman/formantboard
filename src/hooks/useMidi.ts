import { useAppStore } from "../store";

export const useMidi = () => useAppStore().midi;
