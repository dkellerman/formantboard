import type { IPA, createDefaultSettings } from "./constants";
import type { MidiStatus } from "./constants";
import type { Note } from "./utils";

export type IPAType = (typeof IPA)[keyof typeof IPA];
export type Settings = ReturnType<typeof createDefaultSettings>;
export type IPASpecs = Settings["formants"]["ipa"];
export type IPASpec = IPASpecs[IPAType];
export type Formant = IPASpec[number];
export type Vibrato = Settings["vibrato"];

export type NotifyFn = () => void;
export type HarmonicFrame = [number, number, number];
export type AudioFloatArray = Float32Array;
export type AudioByteArray = Uint8Array;
export type MetricsDataArray = AudioFloatArray | AudioByteArray;

export interface Pitch {
  freq: number;
  note: Note;
  cents: number;
}

export interface MidiState {
  status: MidiStatus;
  enable: () => Promise<void>;
  disable: () => void;
  addNoteOnListener: (cb: (note: Note, velocity: number) => void) => void;
  addNoteOffListener: (cb: (note: Note) => void) => void;
  reset: () => void;
}

export interface AnalyzerListener {
  onFrame: (data: MetricsData, analyzer: AnalyserNode) => void;
}

export interface PlayerState {
  setVolume: (next: number) => void;
  setRafId: (next: number | undefined) => void;
  play: (note: number | Note, velocity?: number) => void;
  stop: (note: number | Note, stopAnalysis?: boolean) => void;
  addAnalyzerListener: (id: string, listener: AnalyzerListener) => void;
  removeAnalyzerListener: (id: string) => void;
  analyze: () => void;
  reset: () => void;
}

export interface MetricsData {
  source: string | undefined;
  rms: number;
  tilt: ReturnType<typeof import("regression").logarithmic> | undefined;
  harmonics: HarmonicFrame[];
  compression: number;
  latency: number;
  sampleRate: number;
  frequencyBinCount: number;
  pitch: Pitch | undefined;
  freqData: MetricsDataArray;
  timeData: MetricsDataArray;
}

export interface PlayerData {
  volume: number;
  rafId: number | undefined;
}

export interface PlayerRuntime {
  audioContext: AudioContext;
  noise: AudioBufferSourceNode;
  compressor: DynamicsCompressorNode;
  analyzer: AnalyserNode;
  output: GainNode;
  playing: Record<number, (stopAnalysis: boolean) => void>;
  analyzerListeners: Record<string, AnalyzerListener>;
}
