import { create } from "zustand";
import type { SetStateAction } from "react";
import { createDefaultSettings } from "./constants";
import type { Settings, IPAType, MetricsData, PlayerData, PlayerRuntime } from "./types";

function resolveStateAction<T>(next: SetStateAction<T>, current: T): T {
  return typeof next === "function" ? (next as (prev: T) => T)(current) : next;
}

function createInitialState() {
  const defaults = createDefaultSettings();
  return {
    settings: defaults as Settings,
    ipa: defaults.defaultIPA as IPAType,
    metrics: {
      source: undefined,
      rms: 0,
      tilt: undefined,
      harmonics: [],
      compression: 0,
      latency: 0,
      sampleRate: defaults.audioContextConfig.sampleRate,
      frequencyBinCount: 0,
      pitch: undefined,
      freqData: new Uint8Array(0),
      timeData: new Uint8Array(0),
    } as MetricsData,
    player: {
      volume: 100,
      rafId: undefined,
    } as PlayerData,
    playerRuntimeRef: { current: null } as { current: PlayerRuntime | null },
  };
}

interface AppStoreState {
  settings: Settings;
  setSettings: (next: SetStateAction<Settings>) => void;
  ipa: IPAType;
  setIPA: (next: SetStateAction<IPAType>) => void;
  metrics: MetricsData;
  setMetrics: (next: SetStateAction<MetricsData>) => void;
  player: PlayerData;
  setPlayer: (next: SetStateAction<PlayerData>) => void;
  playerRuntimeRef: { current: PlayerRuntime | null };
}

export const useAppStore = create<AppStoreState>((set) => ({
  ...createInitialState(),
  setSettings: (next) =>
    set((state) => ({
      settings: resolveStateAction(next, state.settings),
    })),
  setIPA: (next) =>
    set((state) => ({
      ipa: resolveStateAction(next, state.ipa),
    })),
  setMetrics: (next) =>
    set((state) => ({
      metrics: resolveStateAction(next, state.metrics),
    })),
  setPlayer: (next) =>
    set((state) => ({
      player: resolveStateAction(next, state.player),
    })),
}));

export function resetAppStore() {
  const runtime = useAppStore.getState().playerRuntimeRef.current;
  if (runtime && typeof runtime.audioContext.close === "function") {
    void runtime.audioContext.close().catch(() => undefined);
  }

  useAppStore.setState({
    ...createInitialState(),
  });
}

export function useAppContext() {
  return useAppStore();
}
