const LETTERS: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NOTES: string[] = ['A0', 'A#0', 'B0'];
for (let o = 1; o <= 7; o++) {
  for (const letter of LETTERS) {
    NOTES.push(`${letter}${o}`);
  }
}
NOTES.push('C8');

export type Note = typeof NOTES[number];

export const FREQUENCIES: number[] = Array(NOTES.length).fill(0);
NOTES.forEach((_, i) => FREQUENCIES[i] =
  i ? FREQUENCIES[i - 1] * Math.pow(2, 1 / 12) : 27.5
);

export type NoteFreq = typeof FREQUENCIES[number];

export function getSemitones(note: string) {
  return NOTES.indexOf(note);
}

export function freq(note: string) {
  return FREQUENCIES[NOTES.indexOf(note)];
}

export function note(frequency: number) {
  const f = FREQUENCIES.reduce((prev, curr) => {
    return (Math.abs(curr)- frequency) < Math.abs(prev - frequency) ? curr : prev;
  });
  return NOTES[FREQUENCIES.indexOf(f)];
}

export function midi2note(midi: number) {
  return NOTES[midi - 33];
}
