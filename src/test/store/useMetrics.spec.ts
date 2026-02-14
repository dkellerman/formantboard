import { beforeEach, describe, expect, it } from "vitest";
import { resetAllStores } from "../resetStores";
import { useMetrics } from "../../hooks/useMetrics";
import { useSettings } from "../../hooks/useSettings";

describe("useMetrics store", () => {
  beforeEach(() => {
    resetAllStores();
  });

  it("starts with expected sampling defaults", () => {
    const settings = useSettings();
    const metrics = useMetrics();

    expect(metrics.sampleRate).toBe(settings.settings.audioContextConfig.sampleRate);
    expect(metrics.frequencyBinCount).toBe(0);
  });

  it("builds data arrays from analyzer settings", () => {
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
