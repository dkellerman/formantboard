import { useAppStore } from './appStore';

export const useMetrics = () => useAppStore().metrics;

export type Metrics = ReturnType<typeof useMetrics>;
