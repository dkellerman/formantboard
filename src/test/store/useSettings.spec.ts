import { beforeEach, describe, expect, it, vi } from "vitest";
import { IPA, VisType } from "@/constants";
import { resetAppStore, useAppStore } from "@/store";
import type { PlayerRuntime } from "@/types";

describe("useAppStore core slices", () => {
  beforeEach(() => {
    resetAppStore();
  });

  it("exposes expected default settings", () => {
    const { settings, metrics, player } = useAppStore.getState();

    expect(settings.defaultNote).toBe("E3");
    expect(settings.defaultIPA).toBe(IPA.ɑ);
    expect(settings.defaultVisType).toBe(VisType.POWER);
    expect(settings.audioContextConfig.sampleRate).toBe(44100);
    expect(settings.formants.ipa[IPA.ɑ]).toHaveLength(3);
    expect(metrics.sampleRate).toBe(44100);
    expect(metrics.freqData).toBeInstanceOf(Uint8Array);
    expect(metrics.timeData).toBeInstanceOf(Uint8Array);
    expect(player.volume).toBe(100);
    expect(player.rafId).toBeUndefined();
  });

  it("applies settings, metrics, and player updates via setStateAction", () => {
    const initialIPA = useAppStore.getState().ipa;

    useAppStore.getState().setSettings((current) => ({
      ...current,
      f0: { ...current.f0, on: false },
      harmonics: { ...current.harmonics, max: 12 },
    }));
    useAppStore.getState().setMetrics((current) => ({
      ...current,
      rms: -18,
      compression: 3,
    }));
    useAppStore.getState().setPlayer({ volume: 72, rafId: 9 });

    expect(useAppStore.getState().settings.f0.on).toBe(false);
    expect(useAppStore.getState().settings.harmonics.max).toBe(12);
    expect(useAppStore.getState().metrics.rms).toBe(-18);
    expect(useAppStore.getState().metrics.compression).toBe(3);
    expect(useAppStore.getState().player.volume).toBe(72);
    expect(useAppStore.getState().player.rafId).toBe(9);
    expect(useAppStore.getState().ipa).toBe(initialIPA);
  });

  it("resets state and closes active player runtime", async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const runtime = {
      audioContext: { close },
      noise: {},
      compressor: {},
      analyzer: {},
      output: {},
      playing: {},
      analyzerListeners: {},
    } as unknown as PlayerRuntime;

    useAppStore.setState({
      ipa: IPA.i,
      playerRuntimeRef: { current: runtime },
      player: { volume: 30, rafId: 42 },
    });

    resetAppStore();
    await Promise.resolve();

    expect(close).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().ipa).toBe(IPA.ɑ);
    expect(useAppStore.getState().player.volume).toBe(100);
    expect(useAppStore.getState().player.rafId).toBeUndefined();
    expect(useAppStore.getState().playerRuntimeRef.current).toBeNull();
  });
});
