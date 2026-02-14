import { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { arr2rms, createWhiteNoise, gain2db } from "../utils";
import { F0Selector, type F0SelectorHandle } from "../components/F0Selector";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const delay = 0.01;
const onset = 0.1;
const offset = 0.05;
const keyGain = 0.05;
const defQ = 0.5;
const defGain = 20.0;
const graphWidth = 800;
const graphHeight = 80;

type FormantTriple = [number, number, number];
type FormantMap = Record<string, FormantTriple[]>;

const initialFormants: FormantMap = {
  ah: [
    [800.0, defQ, defGain],
    [1200.0, defQ, defGain],
    [2500.0, defQ, defGain],
  ],
  ee: [
    [270.0, defQ, defGain],
    [2300.0, defQ, defGain],
    [3000.0, defQ, defGain],
  ],
  oo: [
    [300.0, defQ, defGain],
    [870.0, defQ, defGain],
    [2250.0, defQ, defGain],
  ],
  ih: [
    [400.0, defQ, defGain],
    [2000.0, defQ, defGain],
    [2550.0, defQ, defGain],
  ],
  eh: [
    [530.0, defQ, defGain],
    [1850.0, defQ, defGain],
    [2500.0, defQ, defGain],
  ],
  uh: [
    [640.0, defQ, defGain],
    [1200.0, defQ, defGain],
    [2400.0, defQ, defGain],
  ],
  ae: [
    [660.0, defQ, defGain],
    [1700.0, defQ, defGain],
    [2400.0, defQ, defGain],
  ],
};

interface NumberControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  onValue: (value: number) => void;
}

function NumberControl({ label, value, min, max, step, className, onValue }: NumberControlProps) {
  return (
    <label className={["flex min-w-0 flex-col gap-1", className ?? ""].join(" ")}>
      <Label className="text-xs font-normal text-zinc-500">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(event) => onValue(Number((event.target as HTMLInputElement).value))}
      />
    </label>
  );
}

export function VowelsPage() {
  const f0Ref = useRef<F0SelectorHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const appRef = useRef<PIXI.Application | null>(null);
  const graphicsRef = useRef<PIXI.Graphics>(new PIXI.Graphics());

  const ctxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const mixRef = useRef<GainNode | null>(null);
  const sourceMixRef = useRef<GainNode | null>(null);

  const sawGainNodeRef = useRef<GainNode | null>(null);
  const sineGainNodeRef = useRef<GainNode | null>(null);
  const squareGainNodeRef = useRef<GainNode | null>(null);
  const noiseGainNodeRef = useRef<GainNode | null>(null);

  const sawOscRef = useRef<OscillatorNode | null>(null);
  const sineOscRef = useRef<OscillatorNode | null>(null);
  const squareOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const formantNodesRef = useRef<BiquadFilterNode[]>([]);
  const formantGainNodesRef = useRef<GainNode[]>([]);
  const formantsThruRef = useRef<GainNode | null>(null);

  const analyzeRafRef = useRef<number | null>(null);

  const [started, setStarted] = useState(false);
  const [power, setPower] = useState(0);
  const [sawGain, setSawGain] = useState(1.0);
  const [sineGain, setSineGain] = useState(0.1);
  const [squareGain, setSquareGain] = useState(0.2);
  const [noiseGain, setNoiseGain] = useState(0.01);
  const [formantsOn, setFormantsOn] = useState(true);
  const [vowel, setVowel] = useState<keyof FormantMap>("ah");
  const [formantVals, setFormantVals] = useState<FormantMap>(initialFormants);

  const vowelKeys = useMemo(
    () => Object.keys(formantVals) as Array<keyof FormantMap>,
    [formantVals],
  );

  function ensureAudioGraph() {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    const mix = new GainNode(ctx, { gain: 0 });
    const sourceMix = new GainNode(ctx, { gain: 1 });
    const analyzer = new AnalyserNode(ctx, { fftSize: 4096 });

    const sawGainNode = new GainNode(ctx, { gain: sawGain });
    const sineGainNode = new GainNode(ctx, { gain: sineGain });
    const squareGainNode = new GainNode(ctx, { gain: squareGain });
    const noiseGainNode = new GainNode(ctx, { gain: noiseGain });

    sawGainNode.connect(sourceMix);
    sineGainNode.connect(sourceMix);
    squareGainNode.connect(sourceMix);
    noiseGainNode.connect(sourceMix);

    const formantNodes: BiquadFilterNode[] = [];
    const formantGains: GainNode[] = [];

    for (const [frequency, q, gain] of formantVals[vowel]) {
      const node = new BiquadFilterNode(ctx, {
        type: "peaking",
        frequency,
        Q: q,
        gain,
      });
      const gainNode = new GainNode(ctx, { gain: formantsOn ? 1.0 : 0.0 });
      sourceMix.connect(node);
      node.connect(gainNode);
      gainNode.connect(mix);
      formantNodes.push(node);
      formantGains.push(gainNode);
    }

    const formantsThru = new GainNode(ctx, { gain: formantsOn ? 0.0 : 1.0 });
    sourceMix.connect(formantsThru);
    formantsThru.connect(mix);

    mix.connect(analyzer);
    mix.connect(ctx.destination);

    ctxRef.current = ctx;
    mixRef.current = mix;
    sourceMixRef.current = sourceMix;
    analyzerRef.current = analyzer;
    sawGainNodeRef.current = sawGainNode;
    sineGainNodeRef.current = sineGainNode;
    squareGainNodeRef.current = squareGainNode;
    noiseGainNodeRef.current = noiseGainNode;
    formantNodesRef.current = formantNodes;
    formantGainNodesRef.current = formantGains;
    formantsThruRef.current = formantsThru;
  }

  function renderWave(data: Float32Array) {
    const graphics = graphicsRef.current;
    graphics.clear();
    graphics.lineStyle(1, 0xffffff, 1);

    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * graphWidth;
      const y = (data[i] + 1) * (graphHeight / 2);
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
  }

  function analyze() {
    const analyzer = analyzerRef.current;
    if (!analyzer) return;

    const data = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatTimeDomainData(data);
    setPower(arr2rms([...data]));
    renderWave(data);
    analyzeRafRef.current = requestAnimationFrame(analyze);
  }

  function play(frequency: number) {
    ensureAudioGraph();

    const ctx = ctxRef.current;
    const sawGainNode = sawGainNodeRef.current;
    const sineGainNode = sineGainNodeRef.current;
    const squareGainNode = squareGainNodeRef.current;
    const noiseGainNode = noiseGainNodeRef.current;
    const mix = mixRef.current;

    if (!ctx || !sawGainNode || !sineGainNode || !squareGainNode || !noiseGainNode || !mix) return;

    const saw = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    const sine = new OscillatorNode(ctx, { type: "sine", frequency });
    const square = new OscillatorNode(ctx, { type: "square", frequency });
    const noise = createWhiteNoise(ctx);

    saw.connect(sawGainNode);
    sine.connect(sineGainNode);
    square.connect(squareGainNode);
    noise.connect(noiseGainNode);

    const t = ctx.currentTime + delay;
    saw.start(t);
    sine.start(t);
    square.start(t);
    noise.start(t);

    mix.gain.exponentialRampToValueAtTime(keyGain, t + onset);

    sawOscRef.current = saw;
    sineOscRef.current = sine;
    squareOscRef.current = square;
    noiseSourceRef.current = noise;

    if (analyzeRafRef.current !== null) cancelAnimationFrame(analyzeRafRef.current);
    analyzeRafRef.current = requestAnimationFrame(analyze);
    setStarted(true);
  }

  function stop(_freq: number, stopAnalysis = true) {
    const ctx = ctxRef.current;
    const mix = mixRef.current;
    if (!ctx || !mix) return;

    if (stopAnalysis && analyzeRafRef.current !== null) {
      cancelAnimationFrame(analyzeRafRef.current);
      analyzeRafRef.current = null;
    }

    const t = ctx.currentTime + delay;
    const stopTime = t + offset + delay;
    sawOscRef.current?.stop(stopTime);
    sineOscRef.current?.stop(stopTime);
    squareOscRef.current?.stop(stopTime);
    noiseSourceRef.current?.stop(stopTime);
    mix.gain.setTargetAtTime(0, t, offset);
    mix.gain.value = 0;

    sawOscRef.current = null;
    sineOscRef.current = null;
    squareOscRef.current = null;
    noiseSourceRef.current = null;
    setStarted(false);
  }

  function updateFormantsOn(next: boolean) {
    setFormantsOn(next);
    for (const gainNode of formantGainNodesRef.current) {
      gainNode.gain.value = next ? 1.0 : 0.0;
    }
    if (formantsThruRef.current) {
      formantsThruRef.current.gain.value = next ? 0.0 : 1.0;
    }
  }

  function updateFormantNodeValues(activeVowel: keyof FormantMap, nextVals: FormantMap) {
    const vals = nextVals[activeVowel];
    vals.forEach(([freq, q, gain], idx) => {
      const node = formantNodesRef.current[idx];
      if (!node) return;
      node.frequency.value = freq;
      node.Q.value = q;
      node.gain.value = gain;
    });
  }

  function setFormantValue(idx: number, field: 0 | 1 | 2, value: number) {
    setFormantVals((prev) => {
      const next: FormantMap = Object.fromEntries(
        Object.entries(prev).map(([key, triples]) => [
          key,
          triples.map((triple) => [...triple] as FormantTriple),
        ]),
      ) as FormantMap;

      next[vowel][idx][field] = value;
      updateFormantNodeValues(vowel, next);
      return next;
    });
  }

  useEffect(() => {
    ensureAudioGraph();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new PIXI.Application({
      view: canvas,
      width: graphWidth,
      height: graphHeight,
      backgroundColor: 0x000000,
      antialias: true,
    });

    app.stage.addChild(graphicsRef.current);
    appRef.current = app;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        f0Ref.current?.toggleF0();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (analyzeRafRef.current !== null) cancelAnimationFrame(analyzeRafRef.current);
      app.destroy(true, { children: true });
      appRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateFormantNodeValues(vowel, formantVals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vowel]);

  useEffect(() => {
    if (sawGainNodeRef.current) sawGainNodeRef.current.gain.value = sawGain;
  }, [sawGain]);

  useEffect(() => {
    if (sineGainNodeRef.current) sineGainNodeRef.current.gain.value = sineGain;
  }, [sineGain]);

  useEffect(() => {
    if (squareGainNodeRef.current) squareGainNodeRef.current.gain.value = squareGain;
  }, [squareGain]);

  useEffect(() => {
    if (noiseGainNodeRef.current) noiseGainNodeRef.current.gain.value = noiseGain;
  }, [noiseGain]);

  return (
    <section className="mt-[-10px] flex w-full flex-col items-center justify-center gap-5 pb-24">
      <fieldset className="flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        <canvas ref={canvasRef} />
      </fieldset>

      <fieldset className="flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        <label className="self-center text-sm">
          Power: {power.toFixed(2)} / {gain2db(power).toFixed(2)}dB
        </label>
      </fieldset>

      <fieldset className="flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        <h3>Source {started ? "(Playing)" : ""}</h3>
      </fieldset>

      <fieldset className="flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        <F0Selector ref={f0Ref} className="w-[120px]" play={play} stop={stop} />
      </fieldset>

      <fieldset className="flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        <NumberControl
          className="w-[110px]"
          label="Saw"
          value={sawGain}
          step={0.01}
          onValue={setSawGain}
        />
        <NumberControl
          className="w-[110px]"
          label="Sine"
          value={sineGain}
          step={0.01}
          onValue={setSineGain}
        />
        <NumberControl
          className="w-[110px]"
          label="Square"
          value={squareGain}
          step={0.01}
          onValue={setSquareGain}
        />
        <NumberControl
          className="w-[110px]"
          label="Noise"
          value={noiseGain}
          step={0.01}
          onValue={setNoiseGain}
        />
      </fieldset>

      <fieldset className="mt-5 flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        <label>
          <input
            type="checkbox"
            checked={formantsOn}
            onChange={(event) => updateFormantsOn(event.target.checked)}
          />{" "}
          Formants
        </label>
      </fieldset>

      <fieldset className="mb-2.5 flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5">
        {vowelKeys.map((key) => (
          <Button
            key={key}
            variant={vowel === key ? "secondary" : "outline"}
            onClick={() => setVowel(key)}
          >
            {key}
          </Button>
        ))}
      </fieldset>

      {formantVals[vowel].map((triple, idx) => (
        <fieldset
          key={`${vowel}-${idx}`}
          className="flex flex-row flex-wrap justify-center gap-5 border-0 pl-2.5"
        >
          <label className="self-center text-sm">F{idx + 1}</label>

          <NumberControl
            label="Freq"
            value={triple[0]}
            min={0}
            max={22050}
            step={100}
            onValue={(v) => setFormantValue(idx, 0, v)}
          />
          <NumberControl
            label="Q"
            value={triple[1]}
            min={0}
            max={10}
            step={0.5}
            onValue={(v) => setFormantValue(idx, 1, v)}
          />
          <NumberControl
            label="Gain"
            value={triple[2]}
            min={0}
            max={20}
            step={0.1}
            onValue={(v) => setFormantValue(idx, 2, v)}
          />
        </fieldset>
      ))}
    </section>
  );
}
