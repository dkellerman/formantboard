export const useMetrics = defineStore('metrics', () => {
  const { settings } = useSettings();
  const harmonics = ref<[number, number][]>([]);
  const compression = ref(0.0);
  const latency = ref(0.0);
  const freqData = ref<Float32Array|Uint8Array>(settings.analyzer.useFloatData
    ? new Float32Array(settings.analyzer.fftSize)
    : new Uint8Array(settings.analyzer.fftSize));
  const timeData = ref<Float32Array|Uint8Array>(settings.analyzer.useFloatData
    ? new Float32Array(settings.analyzer.fftSize)
    : new Uint8Array(settings.analyzer.fftSize));

  return {
    harmonics,
    compression,
    latency,
    freqData,
    timeData,
  };
});

export type Metrics = ReturnType<typeof useMetrics>;