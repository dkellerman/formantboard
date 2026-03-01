import { useAppContext } from "@/store";
import { cn } from "@/lib/cn";

export function Readout() {
  const { metrics } = useAppContext();
  const rmsLabel = Number.isFinite(metrics.rms) ? `${metrics.rms.toFixed(1)}dB` : "";

  return (
    <section className={cn("mt-2")}>
      {metrics.pitch ? (
        <fieldset className={cn("w-fit border-0 font-mono text-sm text-foreground")}>
          {metrics.pitch.freq.toFixed(1)}hz [{metrics.pitch.note}]
          {metrics.pitch.cents ? (
            <span>
              {" "}
              {metrics.pitch.cents > 0 ? "+" : ""}
              {metrics.pitch.cents.toFixed(0)}c
            </span>
          ) : null}
          {rmsLabel ? <span className={cn("ml-2 text-foreground")}>{rmsLabel}</span> : null}
        </fieldset>
      ) : null}
    </section>
  );
}
