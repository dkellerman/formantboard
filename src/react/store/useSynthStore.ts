import { create } from 'zustand';

export type VisType = 'spectrum' | 'wave';
export type PitchMetric = {
  freq: number;
  note: string;
  cents: number;
};

type SynthState = {
  drawerOpen: boolean;
  defaultNote: string;
  visType: VisType;
  visualizationOn: boolean;
  harmonicTilt: number;
  volume: number;
  rmsDb: number;
  pitch: PitchMetric | null;
  midiEnabled: boolean;
  micEnabled: boolean;
  fundamentalFrequency: number | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setDefaultNote: (value: string) => void;
  setVisType: (value: VisType) => void;
  setVisualizationOn: (value: boolean) => void;
  setHarmonicTilt: (value: number) => void;
  setVolume: (value: number) => void;
  setRmsDb: (value: number) => void;
  setPitch: (value: PitchMetric | null) => void;
  setMidiEnabled: (value: boolean) => void;
  setMicEnabled: (value: boolean) => void;
  setFundamentalFrequency: (value: number | null) => void;
  resetSandbox: () => void;
};

const defaults = {
  defaultNote: 'E3',
  visType: 'spectrum' as VisType,
  visualizationOn: true,
  harmonicTilt: -3,
  volume: 70,
  rmsDb: -60,
  pitch: null as PitchMetric | null,
  midiEnabled: false,
  micEnabled: false,
  fundamentalFrequency: null as number | null,
};

export const useSynthStore = create<SynthState>((set) => ({
  drawerOpen: false,
  ...defaults,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setDefaultNote: (value) => set({ defaultNote: value }),
  setVisType: (value) => set({ visType: value }),
  setVisualizationOn: (value) => set({ visualizationOn: value }),
  setHarmonicTilt: (value) => set({ harmonicTilt: value }),
  setVolume: (value) => set({ volume: value }),
  setRmsDb: (value) => set({ rmsDb: value }),
  setPitch: (value) => set({ pitch: value }),
  setMidiEnabled: (value) => set({ midiEnabled: value }),
  setMicEnabled: (value) => set({ micEnabled: value }),
  setFundamentalFrequency: (value) => set({ fundamentalFrequency: value }),
  resetSandbox: () => set({ ...defaults }),
}));
