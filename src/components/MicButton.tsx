import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { createMicSource, createPitchDetectionNode, freq2noteCents, getHarmonics } from "../utils";
import { useMetrics, usePlayer, useSettings } from "../hooks/useStoreSlices";
import { Button } from "./ui/button";

export interface MicButtonProps {
  showButton?: boolean;
  startText?: string;
  stopText?: string;
}

export function MicButton({
  showButton = true,
  startText = "Listen",
  stopText = "Stop",
}: MicButtonProps) {
  const player = usePlayer();
  const metrics = useMetrics();
  const settings = useSettings();

  const micRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micRafIdRef = useRef<number | null>(null);
  const [listening, setListening] = useState(false);

  async function enableMic() {
    const ctx = player.analyzer.context as AudioContext;
    if (ctx.state === "suspended") await ctx.resume();

    if (player.rafId) {
      player.output.disconnect(player.analyzer);
    } else {
      micRafIdRef.current = requestAnimationFrame(player.analyze);
    }

    const mic = await createMicSource(ctx);
    mic.connect(player.analyzer);
    micRef.current = mic;

    const pitchDetection = await createPitchDetectionNode(ctx, (freq: number) => {
      const [note, cents] = freq2noteCents(freq);
      metrics.source = "mic";
      metrics.pitch = { freq, note, cents };
      const hcfg = settings.harmonics;
      metrics.harmonics = getHarmonics(freq, hcfg.tilt, hcfg.max, hcfg.maxFreq).map(([f, g]) => [
        f,
        g,
        0.0,
      ]);
    });

    mic.connect(pitchDetection);
    setListening(true);
  }

  function disableMic() {
    if (micRafIdRef.current !== null) cancelAnimationFrame(micRafIdRef.current);
    micRafIdRef.current = null;
    micRef.current?.disconnect();
    micRef.current = null;
    if (player.rafId) player.output.connect(player.analyzer);
    setListening(false);
  }

  useEffect(() => {
    return () => {
      disableMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showButton) return <section className="mic" />;

  return (
    <section className="mic">
      <Button
        variant="outline"
        onClick={() => {
          if (!listening) {
            void enableMic();
          } else {
            disableMic();
          }
        }}
      >
        {listening ? (
          <Square className="h-4 w-4 fill-current text-red-600" />
        ) : (
          <Mic className="h-4 w-4 text-red-600" />
        )}
        {listening ? stopText : startText}
      </Button>
    </section>
  );
}
