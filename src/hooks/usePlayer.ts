import { useAppStore } from "../store";

export const usePlayer = () => useAppStore().player;
