/* eslint-disable @typescript-eslint/no-explicit-any */
import * as PIXI from 'pixi.js';
import type { Formant } from 'stores/useSettings';
import tinycolor from 'tinycolor2';

export const CANONICAL_NOTES: Record<string, string> = {
  'C': 'C', 'C#': 'C#', 'Db': 'C#', 'D': 'D', 'D#': 'D#', 'Eb': 'D#', 'E': 'E',
  'F': 'F', 'F#': 'F#', 'Gb': 'F#', 'G': 'G', 'G#': 'G#', 'Ab': 'G#', 'A': 'A',
  'A#': 'A#', 'Bb': 'A#', 'B': 'B',
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

export const WHITE_KEYS = NOTES.filter(n => !n.includes('#'));
export const BLACK_KEYS = NOTES.filter(n => n.includes('#'));
export const TOP_NOTE = NOTES[NOTES.length - 1];
export const BOTTOM_NOTE = NOTES[0];
export const MIN_FREQ = FREQUENCIES[0];
export const MAX_FREQ = FREQUENCIES[FREQUENCIES.length - 1];
export const NUM_KEY_SLOTS = WHITE_KEYS.length * 2;
export const KEY_SLOTS_PER_OCTAVE = 15;
export const NOTE_RE = /^([a-gA-G])(#|b)?([0-8])?$/;

export function note2canon(note: Note): string {
  const m = note.match(NOTE_RE);
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
  if (!Number.isNaN(freq)) return clampFreq(freq + stepFreq);
  const idx = NOTES.indexOf(val as Note);
  return NOTES[idx + stepNote] ?? val as Note;
}

export function freq2px(freq: number, width: number): number {
  if (freq < MIN_FREQ) return 0;
  if (freq > MAX_FREQ) return width;

  const slotPx = width / NUM_KEY_SLOTS;
  const semitones = 12 * Math.log2(freq / MIN_FREQ);
  const octaves = Math.floor(semitones / 12);
  let slotsIntoOctave = semitones % 12;
  if (slotsIntoOctave >= 8) slotsIntoOctave += 2;
  else if (slotsIntoOctave >= 3) slotsIntoOctave += 1;
  const px = (octaves * (KEY_SLOTS_PER_OCTAVE - 1) * slotPx) + ((slotsIntoOctave + 1) * slotPx);
  return px;
}

export function formantPxRange(f: Formant, width: number): [number, number] {
  const bandwidth = f.frequency * f.Q;
  const x1 = freq2px(f.frequency - (bandwidth / 2), width);
  const x2 = freq2px(f.frequency + (bandwidth / 2), width);
  return [x1, x2];
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

export function clampFreq(n: number): number {
  return clamp(n, MIN_FREQ, MAX_FREQ);
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

export function rms(arr: number[], normFactor = 1.0) {
  return Math.sqrt(arr.reduce((prev, curr) => (prev + (curr/normFactor) * (curr/normFactor)), 0.0) / arr.length);
}
