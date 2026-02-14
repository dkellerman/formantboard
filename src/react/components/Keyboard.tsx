import { useMemo } from 'react';
import { NOTES } from '../../utils';

interface KeyboardProps {
  onNoteOn: (note: string) => void;
  onNoteOff: (note: string) => void;
  activeNotes?: Set<string>;
}

export function Keyboard({ onNoteOn, onNoteOff, activeNotes }: KeyboardProps) {
  const notes = useMemo(
    () => NOTES.filter((note) => note.endsWith('3') || note.endsWith('4') || note.endsWith('5')),
    [],
  );

  return (
    <div className="w-full overflow-x-auto border border-zinc-300 bg-white p-2">
      <div className="flex min-w-[980px] gap-1">
        {notes.map((note) => {
          const isSharp = note.includes('#');
          const isActive = activeNotes?.has(note) ?? false;
          return (
            <button
              key={note}
              className={[
                'flex h-20 min-w-[44px] flex-col items-center justify-end border text-[11px] transition',
                isSharp ? 'border-zinc-700 bg-zinc-800 text-zinc-100' : 'border-zinc-300 bg-zinc-100 text-zinc-900',
                isActive ? 'ring-2 ring-sky-500' : '',
              ].join(' ')}
              type="button"
              onMouseDown={() => onNoteOn(note)}
              onMouseUp={() => onNoteOff(note)}
              onMouseLeave={() => onNoteOff(note)}
              onTouchStart={() => onNoteOn(note)}
              onTouchEnd={() => onNoteOff(note)}
            >
              {note}
            </button>
          );
        })}
      </div>
    </div>
  );
}
