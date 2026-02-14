import { useAppStore } from "../store";

export type { Formant, IPASpec, IPASpecs, Settings, Vibrato } from "../types";

export const useSettings = () => useAppStore().settings;
