import * as PIXI from 'pixi.js';
import tinycolor from 'tinycolor2';

export const NOTE_LETTERS: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NOTES: string[] = ['A0', 'A#0', 'B0']
  .concat([...Array(7)].flatMap((_, i) => NOTE_LETTERS.map(l => `${l}${i + 1}`)))
  .concat(['C8']);

export const FREQUENCIES: number[] = [...Array(NOTES.length)];
NOTES.forEach((_, i) => FREQUENCIES[i] = i ? FREQUENCIES[i - 1] * Math.pow(2, 1 / 12) : 27.5);

export const TOP_NOTE = NOTES[NOTES.length - 1];
export const BOTTOM_NOTE = NOTES[0];
export const MIN_FREQ = FREQUENCIES[0];
export const MAX_FREQ = FREQUENCIES[FREQUENCIES.length - 1];
export const NUM_KEY_SLOTS = countKeySlots(NOTES[0], NOTES[NOTES.length - 1]);
export const KEY_SLOTS_PER_OCTAVE = countKeySlots(NOTES[0], NOTES[12]);

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

export function midi2note(midi: number) {
  return NOTES[midi - 33];
}

export function freq2px(freq: number, width: number) {
  if (freq <= MIN_FREQ) return 0;
  if (freq >= MAX_FREQ) return width;

  const stepPx = width / NUM_KEY_SLOTS;
  const semitones = 12 * Math.log2(freq / MIN_FREQ);
  const octaves = Math.floor(semitones / 12);
  let slotsIntoOctave = semitones % 12;
  if (slotsIntoOctave > 8) slotsIntoOctave += 2;
  else if (slotsIntoOctave > 3) slotsIntoOctave += 1;
  return (octaves * KEY_SLOTS_PER_OCTAVE * stepPx) + (slotsIntoOctave * stepPx);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export function getHarmonics(note: Note|number, max = 40, top = 22050) {
  const baseFreq = typeof note === 'number' ? note : note2freq(note);
  const harmonics: number[] = [];
  while (harmonics.length < max) {
    const h = harmonics.length + 1;
    const f = h * baseFreq;
    if (f > top) break;
    harmonics.push(f);
  }
  return harmonics;
}

export function countKeySlots(start: Note, end: Note) {
  const startIndex = NOTES.indexOf(start);
  const endIndex = NOTES.indexOf(end);
  const notes = NOTES.slice(startIndex, endIndex + 1);
  return notes.reduce((prev, curr) => {
    if (curr.includes('F') || curr.includes('C') && !curr.includes("#")) return prev + 2;
    return prev + 1;
  }, 0) - 1;
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
  let c = parseInt(tinycolor(color).toHexString().slice(1), 16);
  const bc = c; // borderColor ? Number(tinycolor(borderColor).toHexString()) : c;
  g.beginFill(c);
  g.lineStyle(borderWidth ?? 1, bc);
  g.drawRect(x, y, w, h);
  g.endFill();
}
