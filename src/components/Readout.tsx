import { useAppStore } from "@/store";
import { cn } from "@/lib/cn";

export function Readout() {
  const metrics = useAppStore((state) => state.metrics);
  const loopStatus = useAppStore((state) => state.player.loopStatus);
  const rmsLabel = Number.isFinite(metrics.rms) ? `${metrics.rms.toFixed(1)}dB` : "";
  const tiltLabel = Number.isFinite(metrics.effectiveTilt ?? NaN)
    ? `${metrics.effectiveTilt?.toFixed(2)}dB/oct`
    : "";
  const loopLabel = loopStatus
    ? `Loop: ${loopStatus.total === "infinite" ? "On" : `${loopStatus.current}/${loopStatus.total}`}`
    : "";
  const hasReadout = Boolean(metrics.pitch || loopLabel);

  return (
    <section className={cn("mt-2")}>
      {hasReadout ? (
        <fieldset className={cn("w-fit border-0 font-mono text-sm text-foreground")}>
          {metrics.pitch ? (
            <span>
              {metrics.pitch.freq.toFixed(1)}hz [{metrics.pitch.note}]
              {metrics.pitch.cents ? (
                <span>
                  {" "}
                  {metrics.pitch.cents > 0 ? "+" : ""}
                  {metrics.pitch.cents.toFixed(0)}c
                </span>
              ) : null}
            </span>
          ) : null}
          {loopLabel ? (
            <span className={cn(metrics.pitch ? "ml-2 text-foreground" : "text-foreground")}>
              {metrics.pitch ? "|" : ""}
              {metrics.pitch ? " " : ""}
              {loopLabel}
            </span>
          ) : null}
          {rmsLabel ? <span className={cn("ml-2 text-foreground")}>| {rmsLabel}</span> : null}
          {tiltLabel ? <span className={cn("ml-2 text-foreground")}>| {tiltLabel}</span> : null}
        </fieldset>
      ) : null}
    </section>
  );
}
