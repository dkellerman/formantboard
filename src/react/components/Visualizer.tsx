import { useEffect, useRef } from 'react';
import type { VisType } from '../store/useSynthStore';
import { audioEngine } from '../audio/engine';

interface VisualizerProps {
  mode: VisType;
  enabled?: boolean;
  height?: number;
}

export function Visualizer({ mode, enabled = true, height = 160 }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const drawCanvas = canvas;
    const drawCtx = ctx;

    function clear() {
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      drawCtx.fillStyle = '#0a0a0a';
      drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    clear();
    if (!enabled) return undefined;

    return audioEngine.subscribeFrames((frame) => {
      clear();
      if (mode === 'wave') {
        drawCtx.lineWidth = 2;
        drawCtx.strokeStyle = '#e5e7eb';
        drawCtx.beginPath();
        const step = drawCanvas.width / frame.timeData.length;
        let x = 0;
        for (let i = 0; i < frame.timeData.length; i += 1) {
          const y = (frame.timeData[i] / 255) * drawCanvas.height;
          if (i === 0) drawCtx.moveTo(x, y);
          else drawCtx.lineTo(x, y);
          x += step;
        }
        drawCtx.stroke();
      } else {
        const barWidth = Math.max(1, drawCanvas.width / frame.freqData.length);
        for (let i = 0; i < frame.freqData.length; i += 1) {
          const pct = frame.freqData[i] / 255;
          const h = pct * drawCanvas.height;
          const x = i * barWidth;
          const y = drawCanvas.height - h;
          drawCtx.fillStyle = `hsl(${170 + pct * 140}, 85%, ${30 + pct * 40}%)`;
          drawCtx.fillRect(x, y, barWidth, h);
        }
      }
    });
  }, [enabled, mode]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full border border-zinc-400 bg-black"
      height={height}
      width={1024}
    />
  );
}
