/* eslint-disable @typescript-eslint/no-explicit-any */
import * as PIXI from 'pixi.js';
import tinycolor from 'tinycolor2';

export const NOTE_LETTERS: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NOTES: string[] = ['A0', 'A#0', 'B0']
  .concat([...Array(7)].flatMap((_, i) => NOTE_LETTERS.map(l => `${l}${i + 1}`)))
  .concat(['C8']);

export const FREQUENCIES: number[] = [...Array(NOTES.length)];
NOTES.forEach((_, i) => FREQUENCIES[i] = i ? FREQUENCIES[i - 1] * Math.pow(2, 1 / 12) : 27.5);

export const WHITE_KEYS = NOTES.filter(n => !n.includes('#'));
export const BLACK_KEYS = NOTES.filter(n => n.includes('#'));
export const TOP_NOTE = NOTES[NOTES.length - 1];
export const BOTTOM_NOTE = NOTES[0];
export const MIN_FREQ = FREQUENCIES[0];
export const MAX_FREQ = FREQUENCIES[FREQUENCIES.length - 1];
export const NUM_KEY_SLOTS = WHITE_KEYS.length * 2;
export const KEY_SLOTS_PER_OCTAVE = 15;

export type Note = typeof NOTES[number];
export type NoteFreq = typeof FREQUENCIES[number];

export function note2semitones(note: string) {
  return NOTES.indexOf(note);
}

export function freq2semitones(freq: number) {
  return FREQUENCIES.indexOf(freq);
}

export function note2freq(note: string) {
  return FREQUENCIES[NOTES.indexOf(note)];
}

export function freq2note(freq: number) {
  const f = FREQUENCIES.reduce((prev, curr) => {
    return (Math.abs(curr)- freq) < Math.abs(prev - freq) ? curr : prev;
  });
  return NOTES[FREQUENCIES.indexOf(f)];
}

export function noteOrFreq2freq(val: Note|number) {
  const freq = parseFloat(String(val));
  if (Number.isNaN(freq)) return note2freq(val as Note);
  return freq;
}

export function midi2note(midi: number) {
  return NOTES[midi - 33];
}

export function freq2px(freq: number, width: number) {
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

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export function fillRect(
  g: PIXI.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  borderColor?: string,
  borderWidth?: number,
) {
  const c = parseInt(tinycolor(color).toHexString().slice(1), 16);
  const bc = borderColor ? parseInt(tinycolor(borderColor).toHexString().slice(1), 16) : c;
  g.beginFill(c);
  g.lineStyle(borderWidth ?? 1, bc);
  g.drawRect(x, y, w, h);
  g.endFill();
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
