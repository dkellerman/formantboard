import { useAppStore } from "../store";

export const useMetrics = () => useAppStore().metrics;

export type Metrics = ReturnType<typeof useMetrics>;
