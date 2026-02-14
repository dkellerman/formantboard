import { useMemo, useState } from 'react';
import { noteOrFreq2freq, stepNoteOrFreq } from '../../utils';

interface F0ControlProps {
  value: string;
  playing: boolean;
  onValueChange: (value: string) => void;
  onStart: (value: string) => Promise<void>;
  onStop: () => void;
}

export function F0Control({ value, playing, onValueChange, onStart, onStop }: F0ControlProps) {
  const [error, setError] = useState<string | null>(null);
  const buttonLabel = useMemo(() => (playing ? 'Stop' : 'Play'), [playing]);

  async function toggle() {
    if (playing) {
      onStop();
      setError(null);
      return;
    }
    try {
      noteOrFreq2freq(value as never);
      setError(null);
      await onStart(value);
    } catch {
      setError('Invalid note/frequency');
    }
  }

  return (
    <div className="grid gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Fundamental</span>
        <div className="flex gap-2">
          <input
            className="h-11 flex-1 border border-zinc-300 px-3 text-zinc-900 outline-none focus:border-zinc-500"
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
          <button
            className="h-11 border border-zinc-300 bg-zinc-100 px-4 text-zinc-900 transition hover:bg-zinc-200"
            type="button"
            onClick={() => onValueChange(String(stepNoteOrFreq(value as never, 1, 5)))}
          >
            +
          </button>
          <button
            className="h-11 border border-zinc-300 bg-zinc-100 px-4 text-zinc-900 transition hover:bg-zinc-200"
            type="button"
            onClick={() => onValueChange(String(stepNoteOrFreq(value as never, -1, -5)))}
          >
            -
          </button>
          <button
            className="h-11 border border-zinc-300 bg-sky-100 px-4 text-zinc-900 transition hover:bg-sky-200"
            type="button"
            onClick={() => void toggle()}
          >
            {buttonLabel}
          </button>
        </div>
      </label>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
