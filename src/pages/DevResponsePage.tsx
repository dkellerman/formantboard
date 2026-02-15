import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilterConfig {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  gain: number;
}

interface NumberControlProps {
  label: string;
  value: number;
  min: number | string;
  max: number | string;
  step: number | string;
  className?: string;
  onValue: (value: number) => void;
  onCommit: () => void;
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  className,
  onValue,
  onCommit,
}: NumberControlProps) {
  return (
    <label className={["flex min-w-0 flex-col gap-1", className ?? ""].join(" ")}>
      <Label className="text-xs font-normal text-zinc-500">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onInput={(event) => onValue(Number((event.target as HTMLInputElement).value))}
        onChange={onCommit}
      />
    </label>
  );
}

export function DevResponsePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const graphicsRef = useRef(new PIXI.Graphics());
  const ctxRef = useRef(new AudioContext());

  const freqsRef = useRef(new Float32Array(ctxRef.current.sampleRate / 2).fill(0).map((_, i) => i));
  const magRef = useRef(new Float32Array(freqsRef.current.length));

  const [filtersOn, setFiltersOn] = useState([true, true, true]);
  const [filterVals, setFilterVals] = useState<FilterConfig[]>([
    { type: "peaking", frequency: 800, Q: 1, gain: 6 },
    { type: "peaking", frequency: 1200, Q: 1, gain: 6 },
    { type: "peaking", frequency: 2500, Q: 1, gain: 6 },
  ]);

  function draw() {
    const graphics = graphicsRef.current;
    const mag = magRef.current;
    const freqs = freqsRef.current;
    const canvas = canvasRef.current;

    if (!graphics || !canvas) return;

    for (let i = 0; i < mag.length; i++) mag[i] = 0;

    for (let i = 0; i < filterVals.length; i++) {
      if (!filtersOn[i]) continue;

      const config = filterVals[i];
      const filter = new BiquadFilterNode(ctxRef.current, config);
      const newMag = new Float32Array(mag.length);
      filter.getFrequencyResponse(freqs, newMag, new Float32Array(mag.length));

      for (let j = 0; j < newMag.length; j++) {
        mag[j] = Math.max(mag[j], newMag[j]);
      }
    }

    graphics.clear();
    graphics.lineStyle(2, 0xffffff);

    const { width, height } = canvas;
    for (let x = 0; x < width; x++) {
      const i = Math.floor((x / width) * freqs.length);
      const m = mag[i];
      const db = 20 * Math.log10(m);
      const pct = db / 20.0;
      const y = height - pct * height;
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new PIXI.Application({
      view: canvas,
      width: 500,
      height: 100,
      background: 0x000000,
      antialias: true,
    });

    const graphics = graphicsRef.current;
    app.stage.addChild(graphics);
    appRef.current = app;
    draw();

    return () => {
      graphics.clear();
      app.destroy(true, { children: true });
      appRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersOn, filterVals]);

  return (
    <section className="flex h-[70vh] flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold">Frequency Response</h2>
      <canvas ref={canvasRef} className="my-10" />

      {filterVals.map((config, idx) => (
        <fieldset key={idx} className="flex flex-row gap-2 border-0">
          <label>
            <input
              type="checkbox"
              checked={filtersOn[idx]}
              onChange={(event) => {
                setFiltersOn((prev) => {
                  const next = [...prev];
                  next[idx] = event.target.checked;
                  return next;
                });
              }}
            />{" "}
            F{idx + 1}
          </label>

          <NumberControl
            className="w-[85px]"
            label="Frequency"
            value={config.frequency}
            min="20"
            max="20000"
            step="10"
            onValue={(value) => {
              setFilterVals((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], frequency: value };
                return next;
              });
            }}
            onCommit={() => draw()}
          />

          <NumberControl
            className="w-[85px]"
            label="Q"
            value={config.Q}
            min="0.0001"
            max="1000"
            step="0.0001"
            onValue={(value) => {
              setFilterVals((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], Q: value };
                return next;
              });
            }}
            onCommit={() => draw()}
          />

          <NumberControl
            className="w-[85px]"
            label="Gain"
            value={config.gain}
            min="-40"
            max="40"
            step="0.1"
            onValue={(value) => {
              setFilterVals((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], gain: value };
                return next;
              });
            }}
            onCommit={() => draw()}
          />
        </fieldset>
      ))}
    </section>
  );
}
