import { useEffect, useMemo, useRef } from "react";
import * as PIXI from "pixi.js";
import { VisType } from "../constants";
import { fillRect, hsl, str2hexColor } from "../utils";
import {
  useIPASlice,
  useKeyboardLayoutSlice,
  usePlayer,
  useSettings,
} from "../hooks/useStoreSlices";

interface FFTBin {
  bufferIndex: number;
  freq1: number;
  freq2: number;
  x1: number;
  x2: number;
}

interface AnalyzerFrameData {
  freqData: Float32Array | Uint8Array;
  timeData: Float32Array | Uint8Array;
  harmonics: [number, number, number][];
}

export interface VisualizerProps {
  width?: number;
  height?: number;
  vtype?: VisType;
  combined?: boolean;
}

export function Visualizer({
  width: widthProp,
  height: heightProp,
  vtype = VisType.POWER,
  combined = false,
}: VisualizerProps) {
  const player = usePlayer();
  const keyboardLayout = useKeyboardLayoutSlice();
  const ipaStore = useIPASlice();
  const settings = useSettings();

  const id = useMemo(() => `viz-${vtype}-${Math.random().toString(36).slice(2, 9)}`, [vtype]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const waveRef = useRef<PIXI.Graphics | null>(null);
  const powerRef = useRef<PIXI.Graphics | null>(null);
  const overlayRef = useRef<PIXI.Graphics | null>(null);

  const width = widthProp ?? keyboardLayout.keyboardWidth;
  const height = heightProp ?? 140;

  const latestRef = useRef({
    width,
    height,
    vtype,
    combined,
    viz: settings.viz,
    layout: keyboardLayout.layout,
    ipaSpec: ipaStore.ipaSpec,
  });

  latestRef.current = {
    width,
    height,
    vtype,
    combined,
    viz: settings.viz,
    layout: keyboardLayout.layout,
    ipaSpec: ipaStore.ipaSpec,
  };

  function makeFreqBins(binCount: number): FFTBin[] {
    const { layout } = latestRef.current;
    const bins: FFTBin[] = [];
    const sampleRate = player.analyzer.context.sampleRate;
    const fwidth = sampleRate / 2 / binCount;

    for (let i = 0; i < binCount; i++) {
      const freq1 = Math.max(fwidth * i, layout.bottomFreq);
      const freq2 = Math.min(freq1 + fwidth, layout.topFreq);
      const x1 = layout.freq2px(freq1, latestRef.current.width);
      const x2 = layout.freq2px(freq2, latestRef.current.width);
      bins.push({ freq1, freq2, x1, x2, bufferIndex: i });
    }

    return bins;
  }

  function renderOverlay() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.clear();

    const { ipaSpec, viz, layout, width: currentWidth, height: currentHeight } = latestRef.current;

    for (const formant of ipaSpec) {
      const [fx1, fx2] = layout.formantPxRange(formant, currentWidth);
      const color = formant.on ? viz.formantColorOn : viz.formantColorOff;
      fillRect(overlay, fx1, 0, fx2 - fx1, currentHeight, color, 0.4, viz.background, 1);
    }
  }

  function renderPower(data: AnalyzerFrameData, analyzer: AnalyserNode) {
    const canvas = canvasRef.current;
    const gPower = powerRef.current;
    if (!canvas || !gPower) return;

    const dataArray = data.freqData as Float32Array | Uint8Array;
    if ([...dataArray].every((value) => value === -Infinity)) return;

    const bins = makeFreqBins(dataArray.length);
    const { maxDecibels, minDecibels } = analyzer;
    const { viz, height: currentHeight, width: currentWidth, layout } = latestRef.current;

    gPower.clear();

    for (const bin of bins) {
      const db = dataArray[bin.bufferIndex];
      const pct =
        dataArray instanceof Float32Array
          ? (db - minDecibels) / (maxDecibels - minDecibels)
          : db / 256.0;
      const h = (canvas.clientHeight - 1) * pct;
      const y = canvas.clientHeight - h + 5;
      const color = hsl(viz.hue, 100, (pct * 100) / 2);
      fillRect(gPower, bin.x1, y, bin.x2 - bin.x1, h, color);
    }

    for (const [hfreq, hsrcgain, hgain] of data.harmonics) {
      const hx = layout.freq2px(hfreq, currentWidth);
      const hy = currentHeight - currentHeight * hgain;
      gPower.lineStyle(3, str2hexColor(viz.harmonicColor));
      gPower.moveTo(hx, currentHeight);
      gPower.lineTo(hx, hy);

      gPower.lineStyle(1, 0xffffff);
      gPower.moveTo(hx - 2, currentHeight);
      gPower.lineTo(hx - 2, currentHeight - currentHeight * hsrcgain);
    }
  }

  function renderWave(data: AnalyzerFrameData) {
    const canvas = canvasRef.current;
    const gWave = waveRef.current;
    if (!canvas || !gWave) return;

    const { viz, width: currentWidth, height: currentHeight } = latestRef.current;
    const dataArray = data.timeData as Float32Array | Uint8Array;

    if ([...dataArray].every((value) => value === 128)) return;

    gWave.clear();
    gWave.lineStyle(viz.lineWidth, str2hexColor(viz.color));

    const bufferLength = dataArray.length;
    const sliceWidth = currentWidth / bufferLength;

    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] / 128.0;
      const y = val * (currentHeight / 2);
      if (i === 0) gWave.moveTo(x, y);
      else gWave.lineTo(x, y);
      x += sliceWidth;
    }
    gWave.lineTo(currentWidth, currentHeight / 2);
  }

  function clear() {
    waveRef.current?.clear();
    waveRef.current?.removeChildren();
    powerRef.current?.clear();
    powerRef.current?.removeChildren();
    overlayRef.current?.clear();
    overlayRef.current?.removeChildren();
    appRef.current?.stage.removeChildren();

    if (player.rafId) cancelAnimationFrame(player.rafId);
    player.rafId = undefined;

    appRef.current = null;
    waveRef.current = null;
    powerRef.current = null;
    overlayRef.current = null;
  }

  function init() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    clear();

    const viz = latestRef.current.viz;
    const app = new PIXI.Application({
      view: canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      background: str2hexColor(viz.background),
      antialias: viz.antialias,
    });

    const wave = new PIXI.Graphics();
    const power = new PIXI.Graphics();
    const overlay = new PIXI.Graphics();

    app.stage.addChild(overlay);
    app.stage.addChild(power);
    app.stage.addChild(wave);

    appRef.current = app;
    waveRef.current = wave;
    powerRef.current = power;
    overlayRef.current = overlay;

    if (latestRef.current.vtype === VisType.POWER) {
      renderOverlay();
    }
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vtype, width, height]);

  useEffect(() => {
    renderOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ipaStore.ipaSpec)]);

  useEffect(() => {
    player.addAnalyzerListener(id, {
      onFrame: (data: AnalyzerFrameData, analyzer: AnalyserNode) => {
        if (!appRef.current) init();

        if (latestRef.current.vtype === VisType.POWER) {
          renderPower(data, analyzer);
          if (latestRef.current.combined) renderWave(data);
          return;
        }

        if (latestRef.current.vtype === VisType.WAVE) {
          renderWave(data);
        }
      },
    });

    return () => {
      player.removeAnalyzerListener(id);
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <section className={`visualizer vtype-${vtype} m-0 p-0`}>
      <canvas
        ref={canvasRef}
        className="m-0 block w-full border border-zinc-400 p-0"
        width={width}
        height={height}
      />
    </section>
  );
}
