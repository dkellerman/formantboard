import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { F0Selector } from "@/components/F0Selector";
import { createDefaultSettings } from "@/constants";

type DemoMode = "legacy" | "fix";

type FormantSpec = {
  frequency: number;
  Q: number;
  gain: number;
};

type ManagedVoice = {
  stop: (atTime: number) => void;
};

type SourceLink = {
  label: string;
  url: string;
};

const VOWEL_FORMANTS: Record<string, FormantSpec[]> = {
  ɑ: [
    { frequency: 800, Q: 6.5, gain: 16 },
    { frequency: 1200, Q: 7.5, gain: 15 },
    { frequency: 2500, Q: 8, gain: 14 },
  ],
  i: [
    { frequency: 270, Q: 8, gain: 17 },
    { frequency: 2300, Q: 8, gain: 16 },
    { frequency: 3000, Q: 9, gain: 13 },
  ],
  u: [
    { frequency: 300, Q: 8, gain: 16 },
    { frequency: 870, Q: 7, gain: 15 },
    { frequency: 2250, Q: 8, gain: 14 },
  ],
  ɛ: [
    { frequency: 530, Q: 6, gain: 16 },
    { frequency: 1850, Q: 7, gain: 15 },
    { frequency: 2500, Q: 8, gain: 13 },
  ],
  ə: [
    { frequency: 600, Q: 6.5, gain: 15 },
    { frequency: 1000, Q: 7, gain: 14 },
    { frequency: 2400, Q: 8, gain: 12 },
  ],
};

const PROD_DEFAULTS = createDefaultSettings();
const DEMO_NOTE_LEVEL = PROD_DEFAULTS.f0.keyGain;
const DEMO_NOTE_ONSET_SEC = PROD_DEFAULTS.f0.onsetTime;
const DEMO_NOTE_DECAY_SEC = PROD_DEFAULTS.f0.decayTime;
const DEMO_HARMONICS_TILT = PROD_DEFAULTS.harmonics.tilt;
const DEMO_HARMONICS_MAX = PROD_DEFAULTS.harmonics.max;
const DEMO_VIBRATO_RATE_HZ = PROD_DEFAULTS.vibrato.rate;
const DEMO_VIBRATO_EXTENT_HZ = PROD_DEFAULTS.vibrato.extent;
const DEMO_VIBRATO_ONSET_SEC = PROD_DEFAULTS.vibrato.onsetTime;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

function createWhiteNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function stopAndDisconnect(
  ctx: AudioContext,
  stopAt: number,
  sources: AudioScheduledSourceNode[],
  nodes: AudioNode[],
) {
  sources.forEach((source) => {
    try {
      source.stop(stopAt);
    } catch {
      // Node may already be stopped.
    }
  });

  const cleanupMs = Math.max(0, (stopAt - ctx.currentTime + 0.35) * 1000);
  window.setTimeout(() => {
    nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Edge may already be disconnected.
      }
    });
  }, cleanupMs);
}

function applyEnvelope(
  gain: GainNode,
  startTime: number,
  attack = DEMO_NOTE_ONSET_SEC,
  level = DEMO_NOTE_LEVEL,
) {
  gain.gain.cancelScheduledValues(startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(level, startTime + attack);
}

function buildPeriodicWave(
  ctx: AudioContext,
  baseFrequency: number,
  maxHarmonics: number,
  tiltDbPerOctave: number,
  legacyIndexing: boolean,
) {
  const harmonics: number[] = [];
  const maxFreq = 12000;
  for (let i = 1; i <= maxHarmonics; i += 1) {
    const harmonicFrequency = i * baseFrequency;
    if (harmonicFrequency > maxFreq) break;
    const octaves = Math.log2(i);
    const gain = Math.pow(dbToGain(tiltDbPerOctave), octaves);
    harmonics.push(gain);
  }

  if (legacyIndexing) {
    const real = Float32Array.from(harmonics);
    const imag = new Float32Array(real.length);
    return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
  }

  const real = new Float32Array(harmonics.length + 1);
  const imag = new Float32Array(harmonics.length + 1);
  for (let i = 0; i < harmonics.length; i += 1) {
    real[i + 1] = harmonics[i];
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function useLocalAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const voiceRef = useRef<ManagedVoice | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !voiceRef.current) return;
    const stopAt = ctx.currentTime + 0.02;
    voiceRef.current.stop(stopAt);
    voiceRef.current = null;
  }, []);

  const play = useCallback(
    (factory: (ctx: AudioContext) => ManagedVoice) => {
      const ctx = ensureContext();
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      if (voiceRef.current) {
        const stopAt = ctx.currentTime + 0.01;
        voiceRef.current.stop(stopAt);
        voiceRef.current = null;
      }
      voiceRef.current = factory(ctx);
    },
    [ensureContext],
  );

  useEffect(() => {
    return () => {
      if (ctxRef.current && voiceRef.current) {
        const stopAt = ctxRef.current.currentTime + 0.01;
        voiceRef.current.stop(stopAt);
        voiceRef.current = null;
      }
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return {
    play,
    stopCurrent,
  };
}

interface NumberControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  onValue: (next: number) => void;
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  className,
  onValue,
}: NumberControlProps) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label className={cn("text-xs font-normal text-zinc-500")}>{label}</Label>
      <div className={cn("flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-2")}>
        <Input
          className={cn("h-full border-0 p-0 shadow-none ring-0 focus-visible:ring-0")}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onInput={(event) => onValue(Number((event.target as HTMLInputElement).value))}
        />
        {suffix ? <span className={cn("text-xs text-zinc-500")}>{suffix}</span> : null}
      </div>
    </label>
  );
}

interface SourceListProps {
  sources: SourceLink[];
}

function SourceList({ sources }: SourceListProps) {
  return (
    <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm")}>
      <div className={cn("mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500")}>
        Sources
      </div>
      <ul className={cn("m-0 list-disc space-y-1 pl-5")}>
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className={cn("text-sky-700 underline")}
            >
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  summary: string;
  sources: SourceLink[];
  children: ReactNode;
  details: ReactNode;
}

function AnalysisSection({ id, title, summary, sources, children, details }: SectionProps) {
  return (
    <section id={id} className={cn("rounded-lg border border-zinc-200 bg-white p-5 shadow-sm")}>
      <h2 className={cn("m-0 text-xl font-semibold text-zinc-900")}>{title}</h2>
      <p className={cn("mt-2 text-sm leading-6 text-zinc-700")}>{summary}</p>
      <SourceList sources={sources} />
      <div className={cn("mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4")}>{children}</div>
      <details className={cn("mt-4 rounded-md border border-zinc-200 bg-white p-3")}>
        <summary className={cn("cursor-pointer text-sm font-medium text-zinc-800")}>
          Acoustic + code details
        </summary>
        <div className={cn("mt-3 text-sm leading-6 text-zinc-700")}>{details}</div>
      </details>
    </section>
  );
}

function ModeToggle({ mode, onMode }: { mode: DemoMode; onMode: (mode: DemoMode) => void }) {
  return (
    <div className={cn("inline-flex rounded-md border border-zinc-300 bg-white p-1")}>
      <Button
        variant={mode === "legacy" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onMode("legacy")}
      >
        Legacy
      </Button>
      <Button
        variant={mode === "fix" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onMode("fix")}
      >
        Fix
      </Button>
    </div>
  );
}

function TerminologyPrimer() {
  return (
    <details className={cn("rounded-lg border border-zinc-200 bg-white p-4 shadow-sm")}>
      <summary className={cn("cursor-pointer text-sm font-semibold text-zinc-900")}>
        Glossary: Basic Audio / Acoustics Terms
      </summary>
      <div className={cn("mt-3 grid gap-3 text-sm leading-6 text-zinc-700 md:grid-cols-2")}>
        <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
          <strong>DC (Direct Current)</strong>
          <br />A constant offset in the waveform, equivalent to <strong>0 Hz</strong>. In
          `PeriodicWave`, coefficient index `0` is the DC term, not a musical harmonic. If you put
          the fundamental there, you shift the whole harmonic map.
        </div>
        <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
          <strong>Fundamental (F0)</strong>
          <br />
          The base pitch frequency (for example 220 Hz). Harmonics occur at integer multiples of F0:
          `2*F0`, `3*F0`, etc.
        </div>
        <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
          <strong>Harmonics / Overtones</strong>
          <br />
          Spectral partials above the fundamental. Their relative amplitudes shape the source timbre
          (bright, dark, buzzy, breathy).
        </div>
        <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
          <strong>Formants</strong>
          <br />
          Resonance peaks of the vocal tract (commonly F1/F2/F3). They define vowel identity more
          than the raw source does.
        </div>
        <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
          <strong>Q (Quality Factor)</strong>
          <br />
          Controls resonance sharpness. Higher Q means narrower, sharper peak; lower Q means broader
          peak.
        </div>
        <div className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
          <strong>Bandwidth</strong>
          <br />
          Approx width around a resonance center. Rough rule: `bandwidth ~= centerFrequency / Q`.
        </div>
      </div>
    </details>
  );
}

function HarmonicIndexDemo() {
  const engine = useLocalAudioEngine();
  const [mode, setMode] = useState<DemoMode>("legacy");
  const [tilt, setTilt] = useState(DEMO_HARMONICS_TILT);
  const [maxHarmonics, setMaxHarmonics] = useState(DEMO_HARMONICS_MAX);
  const [restartSignal, setRestartSignal] = useState(0);

  useEffect(() => {
    setRestartSignal((current) => current + 1);
  }, [mode, tilt, maxHarmonics]);

  const play = useCallback(
    (frequency: number) => {
      engine.play((ctx) => {
        const wave = buildPeriodicWave(ctx, frequency, maxHarmonics, tilt, mode === "legacy");
        const osc = new OscillatorNode(ctx, { frequency, type: "sine" });
        osc.setPeriodicWave(wave);
        const gain = new GainNode(ctx, { gain: 0 });

        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = ctx.currentTime + 0.01;
        applyEnvelope(gain, startTime);
        osc.start(startTime);

        return {
          stop: (stopAt) => {
            gain.gain.setTargetAtTime(0, stopAt, DEMO_NOTE_DECAY_SEC);
            stopAndDisconnect(ctx, stopAt + 0.2, [osc], [osc, gain]);
          },
        };
      });
    },
    [engine, maxHarmonics, mode, tilt],
  );

  return (
    <div className={cn("space-y-4")}>
      <div className={cn("flex flex-wrap items-center gap-3")}>
        <ModeToggle mode={mode} onMode={setMode} />
        <F0Selector
          className="w-[180px]"
          play={play}
          stop={() => engine.stopCurrent()}
          restartSignal={restartSignal}
        />
      </div>
      <div className={cn("grid gap-3 md:grid-cols-2")}>
        <NumberControl
          label="Spectral tilt"
          value={tilt}
          min={-24}
          max={0}
          step={0.5}
          suffix="dB/oct"
          onValue={(next) => setTilt(clamp(next, -24, 0))}
        />
        <NumberControl
          label="Max harmonics"
          value={maxHarmonics}
          min={2}
          max={60}
          step={1}
          onValue={(next) => setMaxHarmonics(clamp(Math.round(next), 2, 60))}
        />
      </div>
      <p className={cn("m-0 text-xs text-zinc-600")}>
        Legacy mode intentionally maps harmonic 1 into index 0 (DC slot). Fix mode inserts DC=0 and
        starts harmonics at index 1.
      </p>
    </div>
  );
}

function TopologyDiagram({ mode }: { mode: DemoMode }) {
  if (mode === "legacy") {
    return (
      <svg viewBox="0 0 720 140" className={cn("h-[100px] w-full")}>
        <text x="16" y="22" fontSize="14" fill="#334155">
          Source
        </text>
        <rect x="12" y="30" width="95" height="34" rx="6" fill="#dbeafe" stroke="#93c5fd" />
        <line x1="107" y1="47" x2="190" y2="47" stroke="#64748b" strokeWidth="2" />
        <text x="200" y="24" fontSize="12" fill="#334155">
          parallel peaking filters
        </text>
        <rect x="198" y="34" width="80" height="26" rx="6" fill="#fef3c7" stroke="#f59e0b" />
        <rect x="290" y="34" width="80" height="26" rx="6" fill="#fef3c7" stroke="#f59e0b" />
        <rect x="382" y="34" width="80" height="26" rx="6" fill="#fef3c7" stroke="#f59e0b" />
        <line x1="278" y1="47" x2="290" y2="47" stroke="#64748b" strokeWidth="2" />
        <line x1="370" y1="47" x2="382" y2="47" stroke="#64748b" strokeWidth="2" />
        <line x1="462" y1="47" x2="560" y2="47" stroke="#64748b" strokeWidth="2" />
        <rect x="560" y="30" width="110" height="34" rx="6" fill="#fee2e2" stroke="#fca5a5" />
        <text x="581" y="52" fontSize="13" fill="#7f1d1d">
          summed out
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 720 140" className={cn("h-[100px] w-full")}>
      <text x="16" y="22" fontSize="14" fill="#334155">
        Source
      </text>
      <rect x="12" y="30" width="95" height="34" rx="6" fill="#dbeafe" stroke="#93c5fd" />
      <line x1="107" y1="47" x2="188" y2="47" stroke="#64748b" strokeWidth="2" />
      <text x="200" y="24" fontSize="12" fill="#334155">
        cascade tract approximation
      </text>
      <rect x="198" y="34" width="80" height="26" rx="6" fill="#dcfce7" stroke="#4ade80" />
      <rect x="290" y="34" width="80" height="26" rx="6" fill="#dcfce7" stroke="#4ade80" />
      <rect x="382" y="34" width="80" height="26" rx="6" fill="#dcfce7" stroke="#4ade80" />
      <line x1="278" y1="47" x2="290" y2="47" stroke="#64748b" strokeWidth="2" />
      <line x1="370" y1="47" x2="382" y2="47" stroke="#64748b" strokeWidth="2" />
      <line x1="462" y1="47" x2="560" y2="47" stroke="#64748b" strokeWidth="2" />
      <rect x="560" y="30" width="110" height="34" rx="6" fill="#dcfce7" stroke="#4ade80" />
      <text x="588" y="52" fontSize="13" fill="#166534">
        tract out
      </text>
    </svg>
  );
}

function FormantTopologyDemo() {
  const engine = useLocalAudioEngine();
  const [mode, setMode] = useState<DemoMode>("legacy");
  const [vowel, setVowel] = useState<keyof typeof VOWEL_FORMANTS>("ɑ");
  const [restartSignal, setRestartSignal] = useState(0);

  useEffect(() => {
    setRestartSignal((current) => current + 1);
  }, [mode, vowel]);

  const play = useCallback(
    (frequency: number) => {
      const specs = VOWEL_FORMANTS[vowel];
      engine.play((ctx) => {
        const source: AudioScheduledSourceNode = new OscillatorNode(ctx, {
          type: "sawtooth",
          frequency,
        });
        const sourceGain = new GainNode(ctx, { gain: 0 });
        const mix = new GainNode(ctx, { gain: 1 });

        source.connect(sourceGain);

        const filters = specs.map(
          (formant) =>
            new BiquadFilterNode(ctx, {
              type: "peaking",
              frequency: formant.frequency,
              Q: formant.Q,
              gain: formant.gain,
            }),
        );
        const branchGains: GainNode[] = [];

        if (mode === "legacy") {
          const branchNorm = 1 / Math.sqrt(filters.length);
          filters.forEach((filter) => {
            const branchGain = new GainNode(ctx, { gain: branchNorm });
            sourceGain.connect(filter);
            filter.connect(branchGain);
            branchGain.connect(mix);
            branchGains.push(branchGain);
          });
        } else {
          let cursor: AudioNode = sourceGain;
          filters.forEach((filter) => {
            cursor.connect(filter);
            cursor = filter;
          });
          cursor.connect(mix);
        }

        mix.connect(ctx.destination);

        const startTime = ctx.currentTime + 0.01;
        applyEnvelope(sourceGain, startTime);
        source.start(startTime);

        return {
          stop: (stopAt) => {
            sourceGain.gain.setTargetAtTime(0, stopAt, DEMO_NOTE_DECAY_SEC);
            stopAndDisconnect(
              ctx,
              stopAt + 0.22,
              [source],
              [source, sourceGain, mix, ...filters, ...branchGains],
            );
          },
        };
      });
    },
    [engine, mode, vowel],
  );

  return (
    <div className={cn("space-y-4")}>
      <TopologyDiagram mode={mode} />
      <div className={cn("flex flex-wrap items-center gap-3")}>
        <ModeToggle mode={mode} onMode={setMode} />
        <F0Selector
          className="w-[180px]"
          play={play}
          stop={() => engine.stopCurrent()}
          restartSignal={restartSignal}
        />
        <label className={cn("flex min-w-[120px] flex-col gap-1")}>
          <Label className={cn("text-xs font-normal text-zinc-500")}>Vowel target</Label>
          <Select
            value={vowel}
            onValueChange={(value) => setVowel(value as keyof typeof VOWEL_FORMANTS)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(VOWEL_FORMANTS).map((ipa) => (
                <SelectItem key={ipa} value={ipa}>
                  {ipa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <p className={cn("m-0 text-xs text-zinc-600")}>
        Legacy path sums independent formant boosts; fix path routes one tract-like cascade so
        spectral shaping compounds stage by stage. Parallel branches are normalized by `1/sqrt(N)`
        to keep level comparison fair as branch count changes.
      </p>
    </div>
  );
}

function QBandwidthDemo() {
  const engine = useLocalAudioEngine();
  const [mode, setMode] = useState<DemoMode>("legacy");
  const [requestedQ, setRequestedQ] = useState(6);
  const [restartSignal, setRestartSignal] = useState(0);

  const effectiveLegacyQ = Math.min(1, requestedQ) / 10;
  const effectiveFixQ = requestedQ;

  useEffect(() => {
    setRestartSignal((current) => current + 1);
  }, [mode, requestedQ]);

  const play = useCallback(
    (frequency: number) => {
      const effectiveQ = mode === "legacy" ? effectiveLegacyQ : effectiveFixQ;
      engine.play((ctx) => {
        const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
        const src = new GainNode(ctx, { gain: 0 });
        const out = new GainNode(ctx, { gain: 1 });
        const filters = [800, 1200, 2500].map(
          (formantFrequency) =>
            new BiquadFilterNode(ctx, {
              type: "peaking",
              frequency: formantFrequency,
              Q: Math.max(0.01, effectiveQ),
              gain: 18,
            }),
        );

        osc.connect(src);

        let cursor: AudioNode = src;
        filters.forEach((filter) => {
          cursor.connect(filter);
          cursor = filter;
        });
        cursor.connect(out);
        out.connect(ctx.destination);

        const startTime = ctx.currentTime + 0.01;
        applyEnvelope(src, startTime);
        osc.start(startTime);

        return {
          stop: (stopAt) => {
            src.gain.setTargetAtTime(0, stopAt, DEMO_NOTE_DECAY_SEC);
            stopAndDisconnect(ctx, stopAt + 0.22, [osc], [osc, src, out, ...filters]);
          },
        };
      });
    },
    [effectiveFixQ, effectiveLegacyQ, engine, mode],
  );

  const f2BandwidthLegacy = (1200 / Math.max(0.01, effectiveLegacyQ)).toFixed(0);
  const f2BandwidthFix = (1200 / Math.max(0.01, effectiveFixQ)).toFixed(0);

  return (
    <div className={cn("space-y-4")}>
      <div className={cn("flex flex-wrap items-center gap-3")}>
        <ModeToggle mode={mode} onMode={setMode} />
        <F0Selector
          className="w-[180px]"
          play={play}
          stop={() => engine.stopCurrent()}
          restartSignal={restartSignal}
        />
      </div>
      <NumberControl
        label="Requested Q"
        value={requestedQ}
        min={0.1}
        max={12}
        step={0.1}
        onValue={(next) => setRequestedQ(clamp(next, 0.1, 12))}
      />
      <div
        className={cn(
          "grid gap-2 rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-700 md:grid-cols-2",
        )}
      >
        <div>
          <strong>Legacy effective Q:</strong> {effectiveLegacyQ.toFixed(2)} (UI cap 1, then `/10`)
          <br />
          <strong>Approx F2 bandwidth:</strong> {f2BandwidthLegacy} Hz
        </div>
        <div>
          <strong>Fix effective Q:</strong> {effectiveFixQ.toFixed(2)} (direct mapping)
          <br />
          <strong>Approx F2 bandwidth:</strong> {f2BandwidthFix} Hz
        </div>
      </div>
    </div>
  );
}

function VibratoDemo() {
  const engine = useLocalAudioEngine();
  const [mode, setMode] = useState<DemoMode>("legacy");
  const [rateHz, setRateHz] = useState(DEMO_VIBRATO_RATE_HZ);
  const [extentHz, setExtentHz] = useState(DEMO_VIBRATO_EXTENT_HZ);
  const [onsetSec, setOnsetSec] = useState(DEMO_VIBRATO_ONSET_SEC);
  const [restartSignal, setRestartSignal] = useState(0);

  useEffect(() => {
    setRestartSignal((current) => current + 1);
  }, [mode, rateHz, extentHz, onsetSec]);

  const play = useCallback(
    (frequency: number) => {
      engine.play((ctx) => {
        const carrier = new OscillatorNode(ctx, { type: "sawtooth", frequency });
        const carrierGain = new GainNode(ctx, { gain: 0 });

        const vibLfo = new OscillatorNode(ctx, { type: "sine", frequency: rateHz });
        const vibGain = new GainNode(ctx, { gain: 0 });

        vibLfo.connect(vibGain);
        vibGain.connect(carrier.frequency);

        carrier.connect(carrierGain);
        carrierGain.connect(ctx.destination);

        const startTime = ctx.currentTime + 0.01;
        applyEnvelope(carrierGain, startTime);

        vibGain.gain.setValueAtTime(0, startTime);
        if (mode === "fix") {
          vibGain.gain.linearRampToValueAtTime(extentHz, startTime + onsetSec);
        }

        carrier.start(startTime);
        vibLfo.start(startTime);

        return {
          stop: (stopAt) => {
            carrierGain.gain.setTargetAtTime(0, stopAt, DEMO_NOTE_DECAY_SEC);
            stopAndDisconnect(
              ctx,
              stopAt + 0.25,
              [carrier, vibLfo],
              [carrier, carrierGain, vibLfo, vibGain],
            );
          },
        };
      });
    },
    [engine, extentHz, mode, onsetSec, rateHz],
  );

  return (
    <div className={cn("space-y-4")}>
      <div className={cn("flex flex-wrap items-center gap-3")}>
        <ModeToggle mode={mode} onMode={setMode} />
        <F0Selector
          className="w-[180px]"
          play={play}
          stop={() => engine.stopCurrent()}
          restartSignal={restartSignal}
        />
      </div>
      <div className={cn("grid gap-3 md:grid-cols-3")}>
        <NumberControl
          label="Rate"
          value={rateHz}
          min={2}
          max={9}
          step={0.1}
          suffix="Hz"
          onValue={(next) => setRateHz(clamp(next, 2, 9))}
        />
        <NumberControl
          label="Extent"
          value={extentHz}
          min={0}
          max={12}
          step={0.1}
          suffix="Hz"
          onValue={(next) => setExtentHz(clamp(next, 0, 12))}
        />
        <NumberControl
          label="Onset"
          value={onsetSec}
          min={0}
          max={2}
          step={0.05}
          suffix="s"
          onValue={(next) => setOnsetSec(clamp(next, 0, 2))}
        />
      </div>
      <p className={cn("m-0 text-xs text-zinc-600")}>
        Legacy mode keeps vibrato depth at zero (inaudible). Fix mode applies depth and onset
        directly to oscillator frequency modulation.
      </p>
    </div>
  );
}

function ArticulationDemo() {
  const engine = useLocalAudioEngine();
  const [mode, setMode] = useState<DemoMode>("legacy");
  const [targetVowel, setTargetVowel] = useState<keyof typeof VOWEL_FORMANTS>("i");
  const [startVowel, setStartVowel] = useState<keyof typeof VOWEL_FORMANTS>("ə");
  const [restartSignal, setRestartSignal] = useState(0);

  useEffect(() => {
    setRestartSignal((current) => current + 1);
  }, [mode, startVowel, targetVowel]);

  const play = useCallback(
    (frequency: number) => {
      const targetSpecs = VOWEL_FORMANTS[targetVowel];
      const startSpecs = VOWEL_FORMANTS[startVowel];

      engine.play((ctx) => {
        const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
        const sourceGain = new GainNode(ctx, { gain: 0 });
        const out = new GainNode(ctx, { gain: 1 });

        const noise = createWhiteNoise(ctx);
        const aspirationGain = new GainNode(ctx, { gain: 0 });

        const filters = targetSpecs.map(
          (spec, index) =>
            new BiquadFilterNode(ctx, {
              type: "peaking",
              frequency: mode === "legacy" ? spec.frequency : startSpecs[index].frequency,
              Q: spec.Q,
              gain: spec.gain,
            }),
        );

        osc.connect(sourceGain);
        noise.connect(aspirationGain);

        let cursor: AudioNode = sourceGain;
        filters.forEach((filter) => {
          cursor.connect(filter);
          cursor = filter;
        });
        cursor.connect(out);

        aspirationGain.connect(out);
        out.connect(ctx.destination);

        const t = ctx.currentTime + 0.01;

        if (mode === "legacy") {
          applyEnvelope(sourceGain, t);
        } else {
          sourceGain.gain.setValueAtTime(0, t);
          sourceGain.gain.linearRampToValueAtTime(DEMO_NOTE_LEVEL * 1.4, t + 0.008);
          sourceGain.gain.linearRampToValueAtTime(DEMO_NOTE_LEVEL, t + 0.14);

          osc.frequency.setValueAtTime(frequency * 1.02, t);
          osc.frequency.exponentialRampToValueAtTime(frequency, t + 0.08);

          filters.forEach((filter, idx) => {
            filter.frequency.setValueAtTime(startSpecs[idx].frequency, t);
            filter.frequency.linearRampToValueAtTime(targetSpecs[idx].frequency, t + 0.16);
          });

          aspirationGain.gain.setValueAtTime(0.03, t);
          aspirationGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        }

        osc.start(t);
        noise.start(t);

        return {
          stop: (stopAt) => {
            sourceGain.gain.setTargetAtTime(0, stopAt, DEMO_NOTE_DECAY_SEC);
            aspirationGain.gain.setTargetAtTime(0.0001, stopAt, 0.03);
            stopAndDisconnect(
              ctx,
              stopAt + 0.25,
              [osc, noise],
              [osc, noise, sourceGain, aspirationGain, out, ...filters],
            );
          },
        };
      });
    },
    [engine, mode, startVowel, targetVowel],
  );

  return (
    <div className={cn("space-y-4")}>
      <div className={cn("flex flex-wrap items-center gap-3")}>
        <ModeToggle mode={mode} onMode={setMode} />
        <F0Selector
          className="w-[180px]"
          play={play}
          stop={() => engine.stopCurrent()}
          restartSignal={restartSignal}
        />
      </div>
      <div className={cn("grid gap-3 md:grid-cols-2")}>
        <label className={cn("flex min-w-0 flex-col gap-1")}>
          <Label className={cn("text-xs font-normal text-zinc-500")}>Start vowel</Label>
          <Select
            value={startVowel}
            onValueChange={(value) => setStartVowel(value as keyof typeof VOWEL_FORMANTS)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(VOWEL_FORMANTS).map((ipa) => (
                <SelectItem key={`start-${ipa}`} value={ipa}>
                  {ipa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className={cn("flex min-w-0 flex-col gap-1")}>
          <Label className={cn("text-xs font-normal text-zinc-500")}>Target vowel</Label>
          <Select
            value={targetVowel}
            onValueChange={(value) => setTargetVowel(value as keyof typeof VOWEL_FORMANTS)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(VOWEL_FORMANTS).map((ipa) => (
                <SelectItem key={`target-${ipa}`} value={ipa}>
                  {ipa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <p className={cn("m-0 text-xs text-zinc-600")}>
        Legacy mode uses static timbre + basic amplitude onset. Fix mode adds dynamic formant
        movement, brief aspiration burst, and pitch settling.
      </p>
    </div>
  );
}

export function DevAnalysisPage() {
  const { topic } = useParams<{ topic?: string }>();
  const quickLinks = useMemo(
    () => [
      {
        id: "harmonic-indexing",
        slug: "harmonic-indexing",
        label: "1. Harmonic indexing",
      },
      {
        id: "formant-topology",
        slug: "formant-topology",
        label: "2. Formant topology",
      },
      {
        id: "q-bandwidth",
        slug: "q-bandwidth",
        label: "3. Q / bandwidth mapping",
      },
      {
        id: "vibrato-controls",
        slug: "vibrato-controls",
        label: "4. Vibrato controls",
      },
      {
        id: "articulation-dynamics",
        slug: "articulation-dynamics",
        label: "5. Articulation dynamics",
      },
    ],
    [],
  );

  const sectionMap: Record<string, ReactNode> = {
    "harmonic-indexing": (
      <AnalysisSection
        id="harmonic-indexing"
        title="1) Harmonic Indexing + DC Slot"
        summary="Current harmonic wavetable construction can shift components by one index because PeriodicWave index 0 is DC. That creates spectral coloration that does not match intended glottal harmonic structure."
        sources={[
          {
            label: "Web Audio API: PeriodicWave coefficient indexing (W3C)",
            url: "https://www.w3.org/TR/webaudio-1.0/#PeriodicWaveOptions",
          },
          {
            label: "MDN: setPeriodicWave / createPeriodicWave usage",
            url: "https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/setPeriodicWave",
          },
          {
            label: "Current project harmonic builder (utils.ts)",
            url: "https://github.com/dkellerman/formantboard/blob/main/src/utils.ts",
          },
        ]}
        details={
          <div>
            <h4 className={cn("m-0 text-sm font-semibold text-zinc-900")}>What is happening?</h4>
            <p>
              A periodic waveform can be represented as a sum of sinusoidal components. In Web
              Audio, `createPeriodicWave(real, imag)` expects coefficient arrays where index `0` is
              the DC term (constant offset, 0 Hz), index `1` is H1 (fundamental), index `2` is H2,
              and so on.
            </p>
            <p>
              So when you hear me say "DC slot", I mean "array index 0 in the periodic wave
              coefficients." That slot does not represent pitch. If H1 is accidentally written into
              index 0, the harmonic structure is shifted and the source timbre is wrong before
              formants even run.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              Implementation in Web Audio
            </h4>
            <p className={cn("mb-2")}>
              Correct coefficient mapping for N harmonics should look like this:
            </p>
            <pre className={cn("overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}>
              <code>{`const real = new Float32Array(numHarmonics + 1); // +1 for DC
const imag = new Float32Array(numHarmonics + 1);

real[0] = 0; // DC offset (usually 0 for centered waveform)
for (let h = 1; h <= numHarmonics; h += 1) {
  real[h] = harmonicGain[h]; // H1 -> index 1, H2 -> index 2 ...
}

const wave = audioContext.createPeriodicWave(real, imag);
osc.setPeriodicWave(wave);`}</code>
            </pre>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>How to verify</h4>
            <p>
              Use a fixed F0 (for example 220 Hz) with no formants. In a spectrum view, strongest
              lines should occur at integer multiples: 220, 440, 660, 880... Hz. In the waveform
              view, the signal should be centered around 0 with no obvious baseline shift unless you
              intentionally add DC.
            </p>
            <p>
              In this codebase, the production fix was made in `createHarmonics` by allocating one
              extra slot and copying harmonic gains into `hmReal[i + 1]`.
            </p>
          </div>
        }
      >
        <HarmonicIndexDemo />
      </AnalysisSection>
    ),
    "formant-topology": (
      <AnalysisSection
        id="formant-topology"
        title="2) Parallel Peaking Sum vs Tract-Like Topology"
        summary="Summing independent peaking filters tends to sound like static EQ boosts. A tract-like cascade produces stronger interaction between resonances and a more speech-like envelope."
        sources={[
          {
            label: "Holmes (1983): Formant synthesizers, cascade vs parallel",
            url: "https://doi.org/10.1016/0167-6393(83)90044-4",
          },
          {
            label: "Klatt (1980): cascade/parallel formant synthesizer",
            url: "https://doi.org/10.1121/1.383940",
          },
          {
            label: "Current project formant wiring (usePlayer.ts)",
            url: "https://github.com/dkellerman/formantboard/blob/main/src/hooks/usePlayer.ts",
          },
        ]}
        details={
          <div>
            <h4 className={cn("m-0 text-sm font-semibold text-zinc-900")}>What is happening?</h4>
            <p>
              Formants are resonances of the vocal tract transfer function. In DSP terms, the tract
              is one system that shapes the source. In your legacy path, each peaking filter
              receives the same input and outputs are summed in parallel, which behaves more like
              stacked EQ boosts than a tract.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              Parallel vs cascade
            </h4>
            <p>
              Parallel means: `out = F1(x) + F2(x) + F3(x)`. Cascade means: `out = F3(F2(F1(x)))`.
              In cascade, each stage modifies what the next stage sees, so interactions between
              resonances are stronger and usually more voice-like.
            </p>
            <pre className={cn("overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}>
              <code>{`// parallel
source.connect(f1); f1.connect(sum);
source.connect(f2); f2.connect(sum);
source.connect(f3); f3.connect(sum);

// cascade
source.connect(f1);
f1.connect(f2);
f2.connect(f3);
f3.connect(out);`}</code>
            </pre>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              How to implement safely
            </h4>
            <p>
              Add a topology setting (`"parallel"` or `"cascade"`) and keep both paths while tuning.
              Start by moving only vowels to cascade, compare recordings, then retune
              frequency/Q/gain tables because the same numbers will not sound identical across
              topologies.
            </p>
            <p>
              Level handling in this demo follows a production-style comparison: no mode-specific
              boost is applied. The only normalization is `1/sqrt(N)` on parallel branch sums to
              avoid accidental loudness jumps when multiple branches are added.
            </p>
            <p>
              Validation target: with a fixed source and vowel set, cascade should improve vowel
              cohesion and reduce the "three independent EQ bumps" character.
            </p>
          </div>
        }
      >
        <FormantTopologyDemo />
      </AnalysisSection>
    ),
    "q-bandwidth": (
      <AnalysisSection
        id="q-bandwidth"
        title="3) Q Mapping and Bandwidth Control"
        summary="The current Q control path can collapse to very broad resonances (wide bandwidth), which blurs vowel identity. Direct Q mapping preserves narrow resonant peaks where needed."
        sources={[
          {
            label: "Current project formant Q transform (utils.ts)",
            url: "https://github.com/dkellerman/formantboard/blob/main/src/utils.ts",
          },
          {
            label: "Current Sandbox Q control range (SandboxPage.tsx)",
            url: "https://github.com/dkellerman/formantboard/blob/main/src/pages/SandboxPage.tsx",
          },
          {
            label: "Formant bandwidth relevance to intelligibility (Journal of Voice)",
            url: "https://doi.org/10.1016/j.jvoice.2020.10.012",
          },
        ]}
        details={
          <div>
            <h4 className={cn("m-0 text-sm font-semibold text-zinc-900")}>What is happening?</h4>
            <p>
              Q controls resonance sharpness. Bandwidth is approximately `centerFrequency / Q`. If Q
              is extremely small, each formant is very broad and the vowel spectrum gets smeared.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              Why the legacy mapping breaks
            </h4>
            <p>
              Legacy behavior effectively did two compressions: UI constrained Q to 1 or below, then
              DSP divided by `10`, producing values like `0.1`. For F2 around 1200 Hz, that implies
              a huge bandwidth (~12 kHz), which is far wider than typical speech-formant peaks.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              Implementation pattern
            </h4>
            <pre className={cn("overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}>
              <code>{`// preferred: one canonical Q definition everywhere
// UI
const q = clamp(userQ, 0.5, 20);

// DSP
new BiquadFilterNode(ctx, {
  type: "peaking",
  frequency: f,
  Q: q,        // no hidden scaling
  gain: dbGain
});`}</code>
            </pre>
            <p>
              Choose a single range that is meaningful for your model, then keep that same meaning
              in UI, state, API payloads, and filter construction.
            </p>
            <p>
              Validation target: sweep Q while listening to one vowel and one F0. You should hear
              gradual sharpening/broadening, not sudden collapse into a broad EQ wash.
            </p>
          </div>
        }
      >
        <QBandwidthDemo />
      </AnalysisSection>
    ),
    "vibrato-controls": (
      <AnalysisSection
        id="vibrato-controls"
        title="4) Vibrato Parameters Exposed but Under-Applied"
        summary="Rate/extent/onset controls are present in settings, but the runtime modulation depth can remain zero. The fix maps controls directly to frequency modulation depth over time."
        sources={[
          {
            label: "Current vibrato runtime wiring (usePlayer.ts)",
            url: "https://github.com/dkellerman/formantboard/blob/main/src/hooks/usePlayer.ts",
          },
          {
            label: "Current vibrato UI controls (SandboxPage.tsx)",
            url: "https://github.com/dkellerman/formantboard/blob/main/src/pages/SandboxPage.tsx",
          },
          {
            label: "Vibrato acoustic ranges in singing literature",
            url: "https://www.sciencedirect.com/science/article/pii/S0892199708000611",
          },
        ]}
        details={
          <div>
            <h4 className={cn("m-0 text-sm font-semibold text-zinc-900")}>What is happening?</h4>
            <p>
              Vibrato is low-frequency modulation of pitch. You need three pieces: rate (how fast),
              extent (how deep), and onset (how quickly depth ramps in). If extent is zero, vibrato
              is mathematically present but acoustically inaudible.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              Web Audio wiring
            </h4>
            <pre className={cn("overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}>
              <code>{`const lfo = new OscillatorNode(ctx, { frequency: rateHz });
const depth = new GainNode(ctx, { gain: 0 });
lfo.connect(depth);
depth.connect(carrier.frequency); // modulates pitch

depth.gain.setValueAtTime(0, t0);
depth.gain.linearRampToValueAtTime(extentHz, t0 + onsetSec);`}</code>
            </pre>
            <p>
              This is the key implementation point: `extent` must drive `depth.gain`, and onset must
              schedule that gain over time.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>Hz vs cents</h4>
            <p>
              If you store extent in cents, convert per note so perceived vibrato depth stays
              consistent across pitch: `extentHz = f0 * (2^(cents/1200) - 1)`.
            </p>
            <p>
              Validation target: keep rate constant and vary extent from 0 upward; you should hear
              clean emergence of vibrato. Then vary onset to hear immediate vs delayed vibrato
              entry.
            </p>
          </div>
        }
      >
        <VibratoDemo />
      </AnalysisSection>
    ),
    "articulation-dynamics": (
      <AnalysisSection
        id="articulation-dynamics"
        title="5) Missing Time-Varying Articulation"
        summary="Natural voice relies on rapid time movement: formant trajectories, source transients, aspiration, and pitch settling. A static steady-state vowel plus simple envelope sounds instrument-like."
        sources={[
          {
            label: "Stevens, Acoustic Phonetics (MIT Press)",
            url: "https://doi.org/10.7551/mitpress/1072.001.0001",
          },
          {
            label: "Synthetic stop cues: formant transitions + aspiration context",
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4139934/",
          },
          {
            label: "Klatt parameterized time-varying source/filter control",
            url: "https://doi.org/10.1121/1.383940",
          },
        ]}
        details={
          <div>
            <h4 className={cn("m-0 text-sm font-semibold text-zinc-900")}>What is happening?</h4>
            <p>
              Real speech is trajectory-driven. The listener uses time movement (formant
              transitions, pitch settling, noise bursts) as major cues for naturalness. Static
              per-note settings miss those cues.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>Key terms</h4>
            <p>
              Coarticulation: neighboring phonemes influence each other. Transition: parameters move
              between targets. Aspiration: noise-like airflow component. Onset transient: brief
              early-time event that colors attack.
            </p>
            <h4 className={cn("mb-0 mt-4 text-sm font-semibold text-zinc-900")}>
              Implementation pattern
            </h4>
            <pre className={cn("overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}>
              <code>{`// Example: per-note envelopes
formant1.frequency.setValueAtTime(f1Start, t0);
formant1.frequency.linearRampToValueAtTime(f1Target, t0 + 0.12);

carrier.frequency.setValueAtTime(f0 * 1.02, t0);
carrier.frequency.exponentialRampToValueAtTime(f0, t0 + 0.08);

aspiration.gain.setValueAtTime(0.03, t0);
aspiration.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);`}</code>
            </pre>
            <p>
              Treat each note as phases: onset, steady state, release. For each phase, schedule
              envelopes for amplitude, F0, and key formants. This is more effective than only
              changing static values.
            </p>
            <p>
              Validation target: with identical note sequence, compare static vs envelope-driven
              articulation. The envelope-driven version should sound less organ-like and more
              speech-like even at the same nominal vowel targets.
            </p>
          </div>
        }
      >
        <ArticulationDemo />
      </AnalysisSection>
    ),
  };

  const validTopics = new Set(Object.keys(sectionMap));
  const isSingleTopicView = topic !== undefined;
  const isValidTopic = topic !== undefined ? validTopics.has(topic) : true;
  const sectionEntries = quickLinks.map((item) => sectionMap[item.slug]);

  return (
    <section className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24")}>
      <header className={cn("space-y-3")}>
        <h1 className={cn("m-0 text-3xl font-semibold tracking-tight text-zinc-900")}>
          Dev Analysis: Voice Realism A/B
        </h1>
        <p className={cn("m-0 max-w-4xl text-sm leading-6 text-zinc-700")}>
          This page demos five concrete reasons the current synth sounds less voice-like. Each
          section is self-contained: read the diagnosis, review sources, then audition{" "}
          <strong>Legacy</strong> vs
          <strong> Fix</strong> using the same pitch input.
        </p>
        <div className={cn("flex flex-wrap gap-2")}>
          {quickLinks.map((item) => (
            <Link
              key={`topic-${item.slug}`}
              to={`/dev/analysis/${item.slug}`}
              className={cn(
                "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700",
                "no-underline hover:border-zinc-400 hover:text-zinc-900",
              )}
            >
              {item.label}
            </Link>
          ))}
          {isSingleTopicView ? (
            <Link
              to="/dev/analysis"
              className={cn(
                "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700",
                "no-underline hover:border-emerald-300 hover:text-emerald-900",
              )}
            >
              Full index
            </Link>
          ) : null}
          <Link
            to="/dev/naturalness"
            className={cn(
              "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700",
              "no-underline hover:border-amber-300 hover:text-amber-900",
            )}
          >
            Natural voice docs
          </Link>
          <Link
            to="/sandbox"
            className={cn(
              "rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700",
              "no-underline hover:border-sky-300 hover:text-sky-900",
            )}
          >
            Back to sandbox
          </Link>
        </div>
        {!isSingleTopicView ? (
          <div className={cn("flex flex-wrap gap-2")}>
            {quickLinks.map((item) => (
              <a
                key={`anchor-${item.id}`}
                href={`#${item.id}`}
                className={cn(
                  "rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600",
                  "no-underline hover:border-zinc-300 hover:text-zinc-800",
                )}
              >
                Jump: {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      {isValidTopic ? (
        isSingleTopicView ? (
          sectionMap[topic]
        ) : (
          sectionEntries
        )
      ) : (
        <section className={cn("rounded-lg border border-zinc-200 bg-white p-5")}>
          <h2 className={cn("m-0 text-lg font-semibold text-zinc-900")}>Unknown Analysis Topic</h2>
          <p className={cn("mt-2 text-sm text-zinc-700")}>
            The topic <code>{topic}</code> does not exist.
          </p>
          <Link to="/dev/analysis" className={cn("text-sm text-sky-700 underline")}>
            Go to /dev/analysis index
          </Link>
        </section>
      )}

      <TerminologyPrimer />
    </section>
  );
}
