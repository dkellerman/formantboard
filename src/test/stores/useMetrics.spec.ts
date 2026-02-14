import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMetrics } from '../../stores/useMetrics';
import { useSettings } from '../../stores/useSettings';

describe('useMetrics store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with expected sampling defaults', () => {
    const settings = useSettings();
    const metrics = useMetrics();

    expect(metrics.sampleRate).toBe(settings.settings.audioContextConfig.sampleRate);
    expect(metrics.frequencyBinCount).toBe(0);
  });

  it('builds data arrays from analyzer settings', () => {
    const settings = useSettings();
    const metrics = useMetrics();
    const prevUseFloatData = settings.settings.analyzer.useFloatData;

    metrics.frequencyBinCount = 16;
    expect(metrics.freqData).toBeInstanceOf(Uint8Array);
    expect(metrics.timeData).toBeInstanceOf(Uint8Array);
    expect(metrics.freqData).toHaveLength(16);

    settings.settings.analyzer.useFloatData = true;
    expect(metrics.freqData).toBeInstanceOf(Float32Array);
    expect(metrics.timeData).toBeInstanceOf(Float32Array);

    settings.settings.analyzer.useFloatData = prevUseFloatData;
  });
});
