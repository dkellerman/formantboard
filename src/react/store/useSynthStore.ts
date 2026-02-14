import { create } from 'zustand';

export type VisType = 'spectrum' | 'wave';

type SynthState = {
  drawerOpen: boolean;
  defaultNote: string;
  visType: VisType;
  visualizationOn: boolean;
  harmonicTilt: number;
  volume: number;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setDefaultNote: (value: string) => void;
  setVisType: (value: VisType) => void;
  setVisualizationOn: (value: boolean) => void;
  setHarmonicTilt: (value: number) => void;
  setVolume: (value: number) => void;
  resetSandbox: () => void;
};

const defaults = {
  defaultNote: 'E3',
  visType: 'spectrum' as VisType,
  visualizationOn: true,
  harmonicTilt: -3,
  volume: 70,
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
  resetSandbox: () => set(defaults),
}));
