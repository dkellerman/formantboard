import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useAppContext } from "@/store";
import { cn } from "@/lib/cn";
import { createMicSource, createPitchDetectionNode, freq2noteCents, getHarmonics } from "@/utils";
import { usePlayer } from "@/hooks/usePlayer";
import { Button } from "@/components/ui/button";

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
  const playerActions = usePlayer();
  const { settings, setMetrics, player, playerRuntimeRef } = useAppContext();

  const micRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [listening, setListening] = useState(false);

  async function enableMic() {
    const runtime = playerRuntimeRef.current;
    if (!runtime) return;
    const analyzer = runtime.analyzer;
    const output = runtime.output;
    const ctx = analyzer.context as AudioContext;
    if (ctx.state === "suspended") await ctx.resume();

    if (runtime.outputConnectedToAnalyzer) {
      output.disconnect(analyzer);
      runtime.outputConnectedToAnalyzer = false;
    }
    playerActions.setMicAnalyzing(true);

    const mic = await createMicSource(ctx);
    mic.connect(analyzer);
    micRef.current = mic;

    const pitchDetection = await createPitchDetectionNode(ctx, (freq: number) => {
      const [note, cents] = freq2noteCents(freq);
      const hcfg = settings.harmonics;
      setMetrics((current) => ({
        ...current,
        source: "mic",
        pitch: { freq, note, cents },
        harmonics: getHarmonics(freq, hcfg.tilt, hcfg.max, hcfg.maxFreq).map(([f, g]) => [
          f,
          g,
          0.0,
        ]),
      }));
    });

    mic.connect(pitchDetection);
    setListening(true);
  }

  function disableMic() {
    micRef.current?.disconnect();
    micRef.current = null;
    if (player.isPlaying && settings.analyzer.on) {
      const runtime = playerRuntimeRef.current;
      if (runtime && !runtime.outputConnectedToAnalyzer) {
        runtime.output.connect(runtime.analyzer);
        runtime.outputConnectedToAnalyzer = true;
      }
    }
    playerActions.setMicAnalyzing(false);
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
          <Square className={cn("h-4 w-4 fill-current text-red-600")} />
        ) : (
          <Mic className={cn("h-4 w-4 text-red-600")} />
        )}
        {listening ? stopText : startText}
      </Button>
    </section>
  );
}
