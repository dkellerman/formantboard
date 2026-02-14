import { useEffect, useRef, useState } from "react";
import { countSlots, db2gain, note2freq } from "../utils";
import { useKeyboardLayoutSlice } from "../hooks/useStoreSlices";
import { Button } from "../components/ui/button";

export function DevTestPage() {
  const [started, setStarted] = useState(false);
  const keyboardLayout = useKeyboardLayoutSlice();

  const ctxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafCountRef = useRef(0);

  const frequency = 440;

  function draw() {
    const ctx = ctxRef.current;
    const analyzer = analyzerRef.current;
    if (!ctx || !analyzer) return;

    const data = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatFrequencyData(data);
    const sliceWidth = ctx.sampleRate / 2 / analyzer.frequencyBinCount;

    if (rafCountRef.current % 100 === 99) {
      for (let i = 0; i < analyzer.frequencyBinCount; i++) {
        const f1 = i * sliceWidth;
        const f2 = f1 + sliceWidth;
        if (frequency >= f1 && frequency < f2) {
          const db = data[i];
          console.log("db", db, "gain", db2gain(db));
        }
      }
    }

    rafCountRef.current += 1;
    rafRef.current = requestAnimationFrame(draw);
  }

  function toggle() {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    if (started) {
      osc1Ref.current?.stop();
      osc2Ref.current?.stop();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setStarted(false);
      return;
    }

    const osc1 = new OscillatorNode(ctx, { frequency });
    const gain1 = new GainNode(ctx, { gain: 1.0 });
    const osc2 = new OscillatorNode(ctx, { frequency });
    const gain2 = new GainNode(ctx, { gain: 1.0 });
    const analyzer = new AnalyserNode(ctx, { fftSize: 4096 });

    osc1.connect(gain1).connect(analyzer).connect(ctx.destination);
    osc2.connect(gain2).connect(analyzer).connect(ctx.destination);
    osc1.start();
    osc2.start();

    osc1Ref.current = osc1;
    osc2Ref.current = osc2;
    analyzerRef.current = analyzer;
    rafCountRef.current = 0;
    rafRef.current = requestAnimationFrame(draw);
    setStarted(true);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      osc1Ref.current?.stop();
      osc2Ref.current?.stop();
      void ctxRef.current?.close();
    };
  }, []);

  return (
    <section className="p-5">
      <Button variant="outline" onClick={toggle}>
        {started ? "Stop" : "Start"}
      </Button>

      {keyboardLayout.layout.notes.map((note) => (
        <div key={note}>
          {note} :: {countSlots("A0", note)} ::{" "}
          {keyboardLayout.layout.freq2px(note2freq(note), keyboardLayout.keyboardWidth)}
        </div>
      ))}
    </section>
  );
}
