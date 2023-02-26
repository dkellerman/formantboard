export const NOTE_LETTERS: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES: string[] = ['A0', 'A#0', 'B0']
  .concat([...Array(7)].flatMap((_, i) => NOTE_LETTERS.map(l => `${l}${i + 1}`)))
  .concat(['C8']);
export const FREQUENCIES: number[] = [...Array(NOTES.length)];
NOTES.forEach((_, i) => FREQUENCIES[i] = i ? FREQUENCIES[i - 1] * Math.pow(2, 1 / 12) : 27.5);

export const
  A0 = note2freq('A0'),
  C1 = note2freq('C1'),
  A2 = note2freq('A2'),
  A3 = note2freq('A3'),
  A4 = note2freq('A4'),
  C8 = note2freq('C8')
;

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
  const stepPx = width / 103;
  const semitones = 12 * Math.log2(freq / A0);
  const octaves = Math.floor(semitones / 12);
  let stepsIntoOctave = semitones % 12;
  if (stepsIntoOctave > 8) stepsIntoOctave += 2;
  else if (stepsIntoOctave > 3) stepsIntoOctave += 1;
  return (octaves * 14 * stepPx) + (stepsIntoOctave * stepPx);
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

for (const f of FREQUENCIES) {
  console.log('->', freq2note(f), f, freq2px(f, 1000));
}
