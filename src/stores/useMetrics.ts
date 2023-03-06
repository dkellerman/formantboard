export const useMetrics = defineStore('metrics', () => {
  const { settings } = useSettings();
  const rms = ref(0.0);
  const harmonics = ref<[number, number][]>([]);
  const compression = ref(0.0);
  const latency = ref(0.0);
  const sampleRate = ref<number>(settings.audioContextConfig.sampleRate);
  const frequencyBinCount = ref<number>(0);
  const DataArrayType = computed(() => settings.analyzer.useFloatData ? Float32Array : Uint8Array);
  const freqData = computed<Float32Array|Uint8Array>(() => new DataArrayType.value(frequencyBinCount.value));
  const timeData = computed<Float32Array|Uint8Array>(() => new DataArrayType.value(frequencyBinCount.value));

  return {
    rms,
    harmonics,
    compression,
    latency,
    frequencyBinCount,
    sampleRate,
    freqData,
    timeData,
  };
});

export type Metrics = ReturnType<typeof useMetrics>;
