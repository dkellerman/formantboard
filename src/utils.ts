/* eslint-disable @typescript-eslint/no-explicit-any */
import * as PIXI from 'pixi.js';
import type { Formant } from 'stores/useSettings';
import tinycolor from 'tinycolor2';
import { WASMCallback } from 'wasm';
import type { VowelSpec } from './stores/useSettings';

export const NOTE_RE = /^([a-gA-G])(#|b)?([0-8])?$/;
export const CANONICAL_NOTES: Record<string, string> = {
  'C': 'C', 'C#': 'C#', 'Db': 'C#', 'D': 'D', 'D#': 'D#', 'Eb': 'D#', 'E': 'E',
  'F': 'F', 'F#': 'F#', 'Gb': 'F#', 'G': 'G', 'G#': 'G#', 'Ab': 'G#', 'A': 'A',
  'A#': 'A#', 'Bb': 'A#', 'B': 'B', 'B#': 'C', 'E#': 'F', 'Fb': 'E', 'Cb': 'B',
};
export const NOTE_LETTERS: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES: string[] = ['A0', 'A#0', 'B0']
  .concat([...Array(7)]
  .flatMap((_, i) => NOTE_LETTERS
  .map(l => `${l}${i + 1}`)))
  .concat(['C8']);

export const FREQUENCIES: number[] = [...Array(NOTES.length)];
NOTES.forEach((_, i) => FREQUENCIES[i] = i ? FREQUENCIES[i - 1] * Math.pow(2, 1 / 12) : 27.5);

export type Note = typeof NOTES[number];
export type NoteFreq = typeof FREQUENCIES[number];

export const KEY_SLOTS_PER_OCTAVE = 15;
export const CAP_FREQ = 22050;

export function note2canon(note: Note): string {
  const n = note?.replaceAll(' ', '')
    .replace(/flat|-/i, 'b')
    .replace(/(s(harp)?)|\+/i, '#');
  const m = n.match(NOTE_RE);
  if (!m) throw new Error(`Invalid note: ${note}`);
  const letter = m[1].toUpperCase(), inc = m[2] ?? '', octave = m[3] ?? '3';
  if (!inc) return letter + octave;
  return CANONICAL_NOTES[letter + inc] + octave;
}

export function note2semitones(note: Note) {
  return NOTES.indexOf(note2canon(note));
}

export function freq2semitones(freq: number): number {
  const idx = FREQUENCIES.indexOf(freq);
  if (idx === -1) throw new Error(`Invalid freq: ${freq}`);
  return idx;
}

export function note2freq(note: Note): number {
  return FREQUENCIES[NOTES.indexOf(note2canon(note))];
}

export function freq2note(freq: number): Note {
  const f = FREQUENCIES.reduce((prev, curr) => {
    return (Math.abs(curr) - freq) < Math.abs(prev - freq) ? curr : prev;
  });
  return NOTES[FREQUENCIES.indexOf(f)];
}

export function freq2noteCents(freq: number): [Note, number] {
  const note = freq2note(freq);
  const noteFreq = note2freq(note);
  const cents = Math.round(1200 * Math.log2(freq / noteFreq));
  return [note, cents];
}

export function noteOrFreq2freq(val: Note|number): number {
  const freq = parseFloat(String(val));
  if (Number.isNaN(freq)) return note2freq(val as Note);
  return freq;
}

export function midi2note(midi: number): Note|null {
  return NOTES[midi - 33] ?? null;
}

export function stepNoteOrFreq(val: Note|number, stepNote = 1, stepFreq = 5): Note|number {
  const freq = parseFloat(String(val));
  if (!Number.isNaN(freq)) return clamp(freq + stepFreq, 0, CAP_FREQ);
  const idx = NOTES.indexOf(val as Note);
  return NOTES[idx + stepNote] ?? val as Note;
}

export function countSlots(note1: Note, note2: Note): number {
  let slots = 0;
  for (let i = NOTES.indexOf(note1) + 1; i <= NOTES.indexOf(note2); i++) {
    const noteName = NOTES[i].substring(0, NOTES[i].length - 1);
    if (['C', 'F'].includes(noteName)) slots += 2;
    else slots += 1;
  }
  return slots;
}

export function formantRange(f: Formant) {
  const rad = f.frequency / (f.Q);
  return [f.frequency - rad, f.frequency + rad];
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

export class KeyboardLayout {
  notes: Note[];
  frequencies: NoteFreq[];
  topFreq: NoteFreq;
  bottomFreq: NoteFreq;
  numKeySlots: number;
  whiteKeys: Note[];
  blackKeys: Note[];

  constructor(public bottomNote: Note, public topNote: Note) {
    this.notes = NOTES.slice(NOTES.indexOf(bottomNote), NOTES.indexOf(topNote) + 1);
    this.frequencies = FREQUENCIES.slice(NOTES.indexOf(bottomNote), NOTES.indexOf(topNote) + 1);
    this.topFreq = this.frequencies[this.frequencies.length - 1];
    this.bottomFreq = this.frequencies[0];
    this.numKeySlots = countSlots(this.bottomNote, this.topNote);
    this.whiteKeys = this.notes.filter(n => !n.includes('#'));
    this.blackKeys = this.notes.filter(n => n.includes('#'));
  }

  freq2px(freq: number, width: number): number {
    if (freq < this.bottomFreq) return 0;
    if (freq > this.topFreq) return width;

    const slotPx = width / this.numKeySlots;
    const semitones = 12 * Math.log2(freq / this.bottomFreq);
    const octaves = Math.floor(semitones / 12);
    let slotsIntoOctave = semitones % 12;
    if (slotsIntoOctave >= 8) slotsIntoOctave += 2;
    else if (slotsIntoOctave >= 3) slotsIntoOctave += 1;
    const px = (octaves * (KEY_SLOTS_PER_OCTAVE - 1) * slotPx) + ((slotsIntoOctave + 1) * slotPx);
    return px;
  }

  formantPxRange(f: Formant, width: number): [number, number] {
    const [f1, f2] = formantRange(f);
    return [this.freq2px(f1, width), this.freq2px(f2, width)];
  }

  clampFreq(n: number): number {
    return clamp(n, this.bottomFreq, this.topFreq);
  }
}

export const FullKeyboard = new KeyboardLayout('A0', 'C8');

export function getHarmonics(
  baseFrequency: number,
  tilt = 0,
  maxHarmonics = Number.POSITIVE_INFINITY,
  maxFrequency = 5000,
  customGains: Record<number, number> = {}
) {
  const vals: [number, number][] = [];
  for (let i = 0; i < maxHarmonics; i++) {
    const freq = baseFrequency * (i + 1);
    if (freq > maxFrequency) break;
    const octaves = Math.log2(freq / baseFrequency);
    const gain = customGains[i] ?? db2gain(tilt) ** octaves;
    vals.push([freq, gain]);
  }
  return vals;
}

export function fillRect(
  g: PIXI.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  alpha?: number,
  borderColor?: string,
  borderWidth?: number,
) {
  const c = str2hexColor(color);
  const bc = borderColor ? str2hexColor(borderColor) : c;
  g.beginFill(c, alpha);
  g.lineStyle(borderWidth ?? 1, bc);
  g.drawRect(x, y, w, h);
  g.endFill();
}

export function str2hexColor(val: string) {
  return parseInt(tinycolor(val).toHexString().slice(1), 16);
}

export function hsl(h: number, s: number, l: number) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function debug(...args: any[]) {
  console.log('->', ...args);
}

export function debugt(...args: any[]) {
  const w = window as any;
  const dt = w.__debug_ts ? performance.now() - w.__debug_ts : 0;
  console.log(dt, '->', ...args);
  w.__debug_ts = performance.now();
}

export function arr2rms(arr: number[], normFactor = 1.0) {
  return Math.sqrt(arr.reduce((prev, curr) => (prev + (curr/normFactor) * (curr/normFactor)), 0.0) / arr.length);
}

export function gain2db(gain: number) {
  return 20 * Math.log10(gain);
}

export function db2gain(db: number) {
  return Math.pow(10, db / 20);
}

export function round(n: number, decimals = 0) {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

export function createWhiteNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    channel[i] = Math.random() * 2 - 1;
  }

  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  return node;
}

export function createHarmonics(
  ctx: AudioContext,
  baseFrequency: number,
  maxHarmonics: number = Number.POSITIVE_INFINITY,
  maxFrequency = 10000,
  tilt = 0.0,
  customGains: Record<number, number> = {},
): [ReturnType<typeof getHarmonics>, PeriodicWave] {
  const hvals = getHarmonics(baseFrequency, tilt, maxHarmonics, maxFrequency, customGains);
  const hmReal = new Float32Array(hvals.map(([, gain]) => gain));
  const hmImag = new Float32Array(hvals.length);
  return [hvals, ctx.createPeriodicWave(hmReal, hmImag)];
}

export function createFormants(ctx: AudioContext, vowelSpec: VowelSpec): BiquadFilterNode[] {
  const formants: BiquadFilterNode[] = [];

  for (const formantConfig of vowelSpec) {
    if (!formantConfig.on) continue;
    const formant = new BiquadFilterNode(ctx, {
      type: 'peaking',
      frequency: formantConfig.frequency,
      Q: formantConfig.Q / 10.0,
      gain: formantConfig.gain,
    });
    formants.push(formant);
  }
  return formants;
}

export async function createMicSource(ctx: AudioContext): Promise<MediaStreamAudioSourceNode> {
  const mediaStream = await window.navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  });
  const audioSource = ctx.createMediaStreamSource(mediaStream);
  return audioSource;
}

export async function createPitchDetectionNode(ctx: AudioContext, callback: WASMCallback) {
  return createWASMAudioWorkletNode(ctx, 'PitchProcessor', callback, 4096);
}
