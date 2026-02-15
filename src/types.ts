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

export interface PlayerNoteOptions {
  vowel?: IPAType;
  tilt?: number;
  formants?: FormantOverride[];
}

export interface PlayerState {
  setVolume: (next: number) => void;
  setRafId: (next: number | undefined) => void;
  now: () => number;
  play: (
    note: number | Note,
    velocity?: number,
    atTime?: number,
    duration?: number,
    options?: PlayerNoteOptions,
  ) => void;
  stop: (note: number | Note, stopAnalysis?: boolean, atTime?: number) => void;
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
  playing: Record<number, (opts?: { stopAnalysis?: boolean; releaseAt?: number }) => void>;
  analyzerListeners: Record<string, AnalyzerListener>;
}

export interface FormantOverride {
  index: number;
  on?: boolean;
  frequency?: number;
  Q?: number;
  gain?: number;
}

export interface FormantboardVoiceOptions {
  vowel?: IPAType;
  volume?: number;
  tilt?: number;
  formants?: FormantOverride[];
}

export interface FormantboardPlayEvent {
  note: number | Note;
  time: number;
  dur: number;
  velocity?: number;
  vowel?: IPAType;
  volume?: number;
  tilt?: number;
  formants?: FormantOverride[];
}

export interface FormantboardJSONNote {
  note?: number | Note;
  time?: number;
  dur?: number;
  velocity?: number;
  vowel?: IPAType;
  volume?: number;
  tilt?: number;
  formants?: FormantOverride[];
  // Legacy aliases accepted by fromJSON for backward compatibility.
  m?: number;
  t?: number;
  d?: number;
  v?: number;
  ipa?: IPAType;
  vol?: number;
  formantOverrides?: FormantOverride[];
}

export interface FormantboardJSONPayload {
  bpm?: number;
  voice?: FormantboardVoiceOptions;
  notes: FormantboardJSONNote[];
}

export interface FormantboardNormalizedPayload {
  bpm?: number;
  voice?: FormantboardVoiceOptions;
  notes: FormantboardPlayEvent[];
}

export type FormantboardValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface FormantboardAPI {
  version: number;
  goal: string;
  defaultMode: "basic";
  usageGuidance: string;
  advancedFeatures: readonly string[];
  capabilities: readonly string[];
  limits: readonly string[];
  interaction: string;
  timing: string;
  timeUnits: string;
  keySelector: string;
  entrypoint: string;
  discovery: {
    docs: {
      ui: string;
      markdown: string;
      llms: string;
      agents: string;
    };
    startHere: readonly string[];
  };
  noteEventFields: readonly string[];
  vowels: readonly IPAType[];
  validationEngine: "zod";
  schemas: {
    playEvents: unknown;
    jsonPayload: unknown;
  };
  schemaJson: {
    playEvents: unknown;
    jsonPayload: unknown;
  };
  getSchemaJson: () => {
    playEvents: unknown;
    jsonPayload: unknown;
  };
  setVowel: (vowel: IPAType) => void;
  getVowels: () => readonly IPAType[];
  validatePlay: (events: unknown) => FormantboardValidationResult<FormantboardPlayEvent[]>;
  validateFromJSON: (input: unknown) => FormantboardValidationResult<FormantboardNormalizedPayload>;
  setVoice: (voice: FormantboardVoiceOptions) => void;
  setFormantActive: (index: number, on: boolean) => void;
  now: () => number;
  press: (
    note: number | Note,
    velocity?: number,
    atTime?: number,
    duration?: number,
    options?: FormantboardVoiceOptions,
  ) => void;
  clickKey: (midi: number, atTime?: number, duration?: number, velocity?: number) => void;
  play: (events: FormantboardPlayEvent[]) => void;
  fromJSON: (input: string | FormantboardJSONPayload) => void;
}
