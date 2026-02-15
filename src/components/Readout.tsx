import { useAppContext } from "@/store";

export function Readout() {
  const { metrics } = useAppContext();

  return (
    <section className="mt-2">
      {metrics.pitch ? (
        <fieldset className="w-fit border-0 font-mono text-sm text-zinc-700">
          {metrics.pitch.freq.toFixed(1)}hz [{metrics.pitch.note}]
          {metrics.pitch.cents ? (
            <span>
              {" "}
              {metrics.pitch.cents > 0 ? "+" : ""}
              {metrics.pitch.cents.toFixed(0)}c
            </span>
          ) : null}
        </fieldset>
      ) : null}
    </section>
  );
}
