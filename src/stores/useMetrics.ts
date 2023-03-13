import type { Note } from "../utils";
import { logarithmic } from 'regression';

interface Pitch {
  freq: number;
  note: Note;
  cents: number;
}

export const useMetrics = defineStore('metrics', () => {
  const { settings } = useSettings();
  const source = ref<string>();
  const rms = ref(0.0);
  const tilt = ref<ReturnType<typeof logarithmic>>();
  const harmonics = ref<[number, number, number][]>([]);
  const compression = ref(0.0);
  const latency = ref(0.0);
  const sampleRate = ref<number>(settings.audioContextConfig.sampleRate);
  const frequencyBinCount = ref<number>(0);
  const pitch = ref<Pitch>();
  const DataArrayType = computed(() => settings.analyzer.useFloatData ? Float32Array : Uint8Array);
  const freqData = computed<Float32Array|Uint8Array>(() => new DataArrayType.value(frequencyBinCount.value));
  const timeData = computed<Float32Array|Uint8Array>(() => new DataArrayType.value(frequencyBinCount.value));

  return {
    source,
    rms,
    tilt,
    harmonics,
    compression,
    latency,
    pitch,
    frequencyBinCount,
    sampleRate,
    freqData,
    timeData,
  };
});

export type Metrics = ReturnType<typeof useMetrics>;
