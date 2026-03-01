import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { F0Selector } from "@/components/F0Selector";
import { createDefaultSettings } from "@/constants";

type SourceLink = {
  label: string;
  url: string;
};

type PracticalExample = {
  title: string;
  steps: string[];
  hear: string;
  code?: string;
};

type DemoMode = "legacy" | "fix";

type FormantSpec = {
  frequency: number;
  Q: number;
  gain: number;
};

type ManagedVoice = {
  stop: (atTime: number) => void;
};

type DocSection = {
  id: string;
  title: string;
  summary: string;
  acousticDetail: string;
  implementationDetail: string;
  avoid: string;
  sources: SourceLink[];
  examples: PracticalExample[];
  code: string;
};

const PROD_DEFAULTS = createDefaultSettings();
const DEMO_LEVEL = PROD_DEFAULTS.f0.keyGain;
const DEMO_ATTACK_SEC = PROD_DEFAULTS.f0.onsetTime;
const DEMO_DECAY_SEC = PROD_DEFAULTS.f0.decayTime;
const DEMO_HARMONICS_MAX = PROD_DEFAULTS.harmonics.max;
const DEMO_TILT = PROD_DEFAULTS.harmonics.tilt;
const DEMO_VIB_RATE = PROD_DEFAULTS.vibrato.rate;
const DEMO_VIB_EXTENT = PROD_DEFAULTS.vibrato.extent;
const DEMO_VIB_ONSET = PROD_DEFAULTS.vibrato.onsetTime;

const IPA_FORMANTS = PROD_DEFAULTS.formants.ipa as Record<
  string,
  Array<{ on: boolean; frequency: number; Q: number; gain: number }>
>;

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

function toBiquadQ(formantQ: number) {
  return Math.max(0.0001, formantQ / 10);
}

function getFormants(ipa: string): FormantSpec[] {
  const raw = IPA_FORMANTS[ipa] ?? [];
  const filtered = raw.filter((item) => item.on && item.frequency > 0).slice(0, 3);
  if (filtered.length > 0) {
    return filtered.map((item) => ({
      frequency: item.frequency,
      Q: toBiquadQ(item.Q),
      gain: item.gain,
    }));
  }
  return [
    { frequency: 600, Q: 1, gain: 12 },
    { frequency: 1200, Q: 1, gain: 10 },
    { frequency: 2400, Q: 1, gain: 8 },
  ];
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
      // Source may already be stopped.
    }
  });
  const cleanupMs = Math.max(0, (stopAt - ctx.currentTime + 0.3) * 1000);
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
  level = DEMO_LEVEL,
  attack = DEMO_ATTACK_SEC,
) {
  gain.gain.cancelScheduledValues(startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(level, startTime + attack);
}

function buildPeriodicWave(
  ctx: AudioContext,
  frequency: number,
  maxHarmonics: number,
  tiltDbPerOct: number,
) {
  const harmonics: number[] = [];
  for (let h = 1; h <= maxHarmonics; h += 1) {
    const f = h * frequency;
    if (f > 12000) break;
    const oct = Math.log2(h);
    const gain = Math.pow(dbToGain(tiltDbPerOct), oct);
    harmonics.push(gain);
  }
  const real = new Float32Array(harmonics.length + 1);
  const imag = new Float32Array(harmonics.length + 1);
  for (let i = 0; i < harmonics.length; i += 1) {
    real[i + 1] = harmonics[i];
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function makeFormantCascade(
  ctx: AudioContext,
  input: AudioNode,
  specs: FormantSpec[],
  output: AudioNode,
) {
  if (specs.length === 0) {
    input.connect(output);
    return [] as BiquadFilterNode[];
  }
  const filters = specs.map(
    (spec) =>
      new BiquadFilterNode(ctx, {
        type: "peaking",
        frequency: spec.frequency,
        Q: spec.Q,
        gain: spec.gain,
      }),
  );
  let cursor: AudioNode = input;
  filters.forEach((filter) => {
    cursor.connect(filter);
    cursor = filter;
  });
  cursor.connect(output);
  return filters;
}

function useLocalAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const voiceRef = useRef<ManagedVoice | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !voiceRef.current) return;
    voiceRef.current.stop(ctx.currentTime + 0.02);
    voiceRef.current = null;
  }, []);

  const play = useCallback(
    (factory: (ctx: AudioContext) => ManagedVoice) => {
      const ctx = ensureContext();
      if (ctx.state === "suspended") void ctx.resume();
      if (voiceRef.current) {
        voiceRef.current.stop(ctx.currentTime + 0.01);
        voiceRef.current = null;
      }
      voiceRef.current = factory(ctx);
    },
    [ensureContext],
  );

  useEffect(() => {
    return () => {
      if (ctxRef.current && voiceRef.current) {
        voiceRef.current.stop(ctxRef.current.currentTime + 0.01);
      }
      voiceRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return { play, stopCurrent };
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

function buildSectionVoice(
  ctx: AudioContext,
  sectionId: string,
  mode: DemoMode,
  frequency: number,
): ManagedVoice {
  const t0 = ctx.currentTime + 0.01;
  const out = new GainNode(ctx, { gain: 1 });
  out.connect(ctx.destination);

  if (sectionId === "glottal-source") {
    const osc = new OscillatorNode(ctx, {
      type: mode === "legacy" ? "sawtooth" : "sine",
      frequency,
    });
    if (mode === "fix") {
      osc.setPeriodicWave(buildPeriodicWave(ctx, frequency, DEMO_HARMONICS_MAX, DEMO_TILT));
    }
    const srcGain = new GainNode(ctx, { gain: 0 });
    const tone = new BiquadFilterNode(ctx, {
      type: "lowpass",
      frequency: mode === "legacy" ? 2200 : 3200,
      Q: 0.5,
    });
    osc.connect(srcGain);
    srcGain.connect(tone);
    tone.connect(out);
    applyEnvelope(srcGain, t0);
    if (mode === "fix") {
      tone.frequency.setValueAtTime(2600, t0);
      tone.frequency.linearRampToValueAtTime(3400, t0 + 0.12);
    }
    osc.start(t0);
    return {
      stop: (at) => {
        srcGain.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
        stopAndDisconnect(ctx, at + 0.2, [osc], [osc, srcGain, tone, out]);
      },
    };
  }

  if (sectionId === "articulation") {
    const startSpecs = getFormants("ə");
    const targetSpecs = getFormants("i");
    const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    const srcGain = new GainNode(ctx, { gain: 0 });
    osc.connect(srcGain);
    const filters = makeFormantCascade(
      ctx,
      srcGain,
      mode === "legacy" ? targetSpecs : startSpecs,
      out,
    );
    applyEnvelope(srcGain, t0);
    if (mode === "fix") {
      osc.frequency.setValueAtTime(frequency * 1.02, t0);
      osc.frequency.exponentialRampToValueAtTime(frequency, t0 + 0.08);
      filters.forEach((filter, index) => {
        filter.frequency.setValueAtTime(startSpecs[index].frequency, t0);
        filter.frequency.linearRampToValueAtTime(targetSpecs[index].frequency, t0 + 0.15);
      });
    }
    osc.start(t0);
    return {
      stop: (at) => {
        srcGain.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
        stopAndDisconnect(ctx, at + 0.22, [osc], [osc, srcGain, out, ...filters]);
      },
    };
  }

  if (sectionId === "noise-path") {
    const specs = getFormants("ɑ");
    const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    const srcGain = new GainNode(ctx, { gain: 0 });
    osc.connect(srcGain);
    const filters = makeFormantCascade(ctx, srcGain, specs, out);
    const noise = createWhiteNoise(ctx);
    const noiseBand = new BiquadFilterNode(ctx, { type: "bandpass", frequency: 2600, Q: 1 });
    const aspGain = new GainNode(ctx, { gain: 0 });
    if (mode === "fix") {
      noise.connect(noiseBand);
      noiseBand.connect(aspGain);
      aspGain.connect(out);
      aspGain.gain.setValueAtTime(0.03, t0);
      aspGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      noise.start(t0);
    }
    applyEnvelope(srcGain, t0);
    osc.start(t0);
    return {
      stop: (at) => {
        srcGain.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
        aspGain.gain.setTargetAtTime(0.0001, at, 0.03);
        stopAndDisconnect(ctx, at + 0.25, mode === "fix" ? [osc, noise] : [osc], [
          osc,
          srcGain,
          out,
          ...filters,
          noiseBand,
          aspGain,
          noise,
        ]);
      },
    };
  }

  if (sectionId === "coupling") {
    const specs = getFormants("ɑ");
    const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    const srcGain = new GainNode(ctx, { gain: 0 });
    const sourceTone = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 2200, Q: 0.7 });
    osc.connect(srcGain);
    srcGain.connect(sourceTone);
    const filters = makeFormantCascade(ctx, sourceTone, specs, out);
    const couplingGain = new GainNode(ctx, { gain: mode === "fix" ? 180 : 0 });
    if (mode === "fix") {
      out.connect(couplingGain);
      couplingGain.connect(sourceTone.frequency);
    }
    applyEnvelope(srcGain, t0);
    sourceTone.frequency.setValueAtTime(2000, t0);
    osc.start(t0);
    return {
      stop: (at) => {
        srcGain.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
        stopAndDisconnect(
          ctx,
          at + 0.22,
          [osc],
          [osc, srcGain, sourceTone, couplingGain, out, ...filters],
        );
      },
    };
  }

  if (sectionId === "prosody") {
    const carrier = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    const gain = new GainNode(ctx, { gain: 0 });
    carrier.connect(gain);
    gain.connect(out);

    const vib = new OscillatorNode(ctx, { type: "sine", frequency: DEMO_VIB_RATE });
    const vibGain = new GainNode(ctx, { gain: 0 });
    vib.connect(vibGain);
    vibGain.connect(carrier.frequency);

    applyEnvelope(gain, t0);
    if (mode === "fix") {
      carrier.frequency.setValueAtTime(frequency * 1.01, t0);
      carrier.frequency.exponentialRampToValueAtTime(frequency, t0 + 0.08);
      vibGain.gain.setValueAtTime(0, t0);
      vibGain.gain.linearRampToValueAtTime(DEMO_VIB_EXTENT, t0 + DEMO_VIB_ONSET);
    }
    carrier.start(t0);
    vib.start(t0);
    return {
      stop: (at) => {
        gain.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
        stopAndDisconnect(ctx, at + 0.25, [carrier, vib], [carrier, vib, vibGain, gain, out]);
      },
    };
  }

  if (sectionId === "speaker-scaling") {
    const scale = mode === "fix" ? 0.9 : 1.0;
    const specs = getFormants("ɑ").map((item) => ({ ...item, frequency: item.frequency / scale }));
    const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
    const gain = new GainNode(ctx, { gain: 0 });
    osc.connect(gain);
    const filters = makeFormantCascade(ctx, gain, specs, out);
    applyEnvelope(gain, t0);
    osc.start(t0);
    return {
      stop: (at) => {
        gain.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
        stopAndDisconnect(ctx, at + 0.22, [osc], [osc, gain, out, ...filters]);
      },
    };
  }

  const oralSpecs = getFormants("ɑ");
  const osc = new OscillatorNode(ctx, { type: "sawtooth", frequency });
  const src = new GainNode(ctx, { gain: 0 });
  const oralOut = new GainNode(ctx, { gain: 1 });
  osc.connect(src);
  const oralFilters = makeFormantCascade(ctx, src, oralSpecs, oralOut);
  oralOut.connect(out);

  const nasalMix = new GainNode(ctx, { gain: 0 });
  const nasalBand = new BiquadFilterNode(ctx, { type: "bandpass", frequency: 1000, Q: 1.2 });
  const nasalNotch = new BiquadFilterNode(ctx, { type: "notch", frequency: 900, Q: 2.2 });
  if (mode === "fix") {
    src.connect(nasalBand);
    nasalBand.connect(nasalNotch);
    nasalNotch.connect(nasalMix);
    nasalMix.connect(out);
    nasalMix.gain.setValueAtTime(0, t0);
    nasalMix.gain.linearRampToValueAtTime(0.25, t0 + 0.05);
  }

  applyEnvelope(src, t0);
  osc.start(t0);
  return {
    stop: (at) => {
      src.gain.setTargetAtTime(0, at, DEMO_DECAY_SEC);
      nasalMix.gain.setTargetAtTime(0, at, 0.03);
      stopAndDisconnect(
        ctx,
        at + 0.24,
        [osc],
        [osc, src, oralOut, out, nasalMix, nasalBand, nasalNotch, ...oralFilters],
      );
    },
  };
}

function SectionAudioDemo({ sectionId }: { sectionId: string }) {
  const engine = useLocalAudioEngine();
  const [mode, setMode] = useState<DemoMode>("legacy");
  const [restartSignal, setRestartSignal] = useState(0);

  useEffect(() => {
    setRestartSignal((current) => current + 1);
  }, [mode, sectionId]);

  const play = useCallback(
    (frequency: number) => {
      engine.play((ctx) => buildSectionVoice(ctx, sectionId, mode, frequency));
    },
    [engine, mode, sectionId],
  );

  return (
    <div className={cn("mt-4 rounded-md border border-zinc-200 bg-white p-3")}>
      <div className={cn("mb-2 flex flex-wrap items-center gap-3")}>
        <ModeToggle mode={mode} onMode={setMode} />
        <F0Selector
          className="w-[190px]"
          play={play}
          stop={() => engine.stopCurrent()}
          restartSignal={restartSignal}
        />
      </div>
      <p className={cn("m-0 text-xs text-zinc-600")}>
        Play a note, then A/B <strong>Legacy</strong> vs <strong>Fix</strong> for this section.
      </p>
    </div>
  );
}

const SECTIONS: DocSection[] = [
  {
    id: "glottal-source",
    title: "1) Physiologic Glottal Source Model",
    summary:
      "Use a glottal source model (LF/Rosenberg style) so excitation has realistic open/close behavior rather than a static oscillator spectrum.",
    acousticDetail:
      "Real voice source spectra change with open quotient, closing speed, and subglottal pressure. A static harmonic table misses this and sounds synthetic or buzzy.",
    implementationDetail:
      "Move excitation generation into an AudioWorklet or periodic-wave generator that accepts source-shape params per note. Drive those params from note intensity and pitch, then rebuild or morph source shape over note phases.",
    avoid:
      "Avoid treating source as a fixed periodic waveform for all notes. That forces the tract filter to do all realism work and creates an over-filtered, tube-like result.",
    sources: [
      {
        label: "Klatt (1980) software cascade/parallel formant synthesizer",
        url: "https://doi.org/10.1121/1.383940",
      },
      {
        label: "Titze, Principles of Voice Production",
        url: "https://books.google.com/books/about/Principles_of_Voice_Production.html?id=-sEEAQAAIAAJ",
      },
      {
        label: "Current app source path (usePlayer.ts)",
        url: "https://github.com/dkellerman/formantboard/blob/main/src/hooks/usePlayer.ts",
      },
    ],
    examples: [
      {
        title: "Soft vowel onset (E3)",
        steps: [
          "Set open quotient from 0.66 to 0.56 over first 120 ms.",
          "Set source tilt from -18 dB/oct toward -14 dB/oct during onset.",
          "Keep formant gains unchanged to isolate source change.",
        ],
        hear: "Attack sounds less buzzy and more breath-voiced before stabilizing.",
        code: `source.parameters.get("openQuotient")?.setValueAtTime(0.66, t0);
source.parameters.get("openQuotient")?.linearRampToValueAtTime(0.56, t0 + 0.12);
source.parameters.get("tiltDbPerOct")?.setValueAtTime(-18, t0);
source.parameters.get("tiltDbPerOct")?.linearRampToValueAtTime(-14, t0 + 0.12);`,
      },
    ],
    code: `// sketch: source shape params vary over time
const source = new AudioWorkletNode(ctx, "glottal-source");
source.parameters.get("openQuotient")?.setValueAtTime(0.62, t0);
source.parameters.get("openQuotient")?.linearRampToValueAtTime(0.52, t0 + 0.12);
source.parameters.get("tiltDbPerOct")?.setValueAtTime(-15, t0);`,
  },
  {
    id: "articulation",
    title: "2) Time-Varying Articulation and Coarticulation",
    summary:
      "Treat speech as trajectories, not static targets. Formants and source parameters should move into and out of vowels based on context.",
    acousticDetail:
      "Perceived naturalness depends heavily on transitions (20-200 ms). Static F1/F2/F3 creates an organ-like vowel even if steady-state targets are accurate.",
    implementationDetail:
      "Add note-phase envelopes (onset, sustain, release) for formant frequency/Q/gain and source tilt. When scheduling note sequences, derive start targets from previous vowel and ramp into next targets.",
    avoid:
      "Avoid single-frame parameter jumps or static per-note constants. That erases coarticulation cues listeners rely on.",
    sources: [
      {
        label: "Stevens, Acoustic Phonetics",
        url: "https://doi.org/10.7551/mitpress/1072.001.0001",
      },
      {
        label: "Source-filter + temporal cues in synthetic speech",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4139934/",
      },
      {
        label: "Web Audio automation timing model",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/AudioParam",
      },
    ],
    examples: [
      {
        title: "Coarticulation test (/ə/ -> /i/)",
        steps: [
          "Start F1/F2/F3 at schwa values.",
          "Ramp to /i/ values in 100-160 ms.",
          "Keep note pitch constant so movement heard as articulation only.",
        ],
        hear: "The vowel sounds like a moving vocal gesture instead of a static filter snapshot.",
        code: `f1.frequency.setValueAtTime(600, t0);
f1.frequency.linearRampToValueAtTime(270, t0 + 0.12);
f2.frequency.setValueAtTime(1000, t0);
f2.frequency.linearRampToValueAtTime(2300, t0 + 0.16);`,
      },
    ],
    code: `// sketch: transition into target vowel
f1.frequency.setValueAtTime(prevF1, t0);
f1.frequency.linearRampToValueAtTime(nextF1, t0 + 0.10);
f2.frequency.setValueAtTime(prevF2, t0);
f2.frequency.linearRampToValueAtTime(nextF2, t0 + 0.13);`,
  },
  {
    id: "noise-path",
    title: "3) Separate Noise Excitation Path",
    summary:
      "Model aspiration/frication as a dedicated noise branch with its own envelopes and filters, mixed with voicing.",
    acousticDetail:
      "Breathy onset and fricative energy come from turbulent airflow, not harmonic voicing. Without a separate path, consonants and attack transients feel dead.",
    implementationDetail:
      "Route white noise through band-pass/high-pass filters, shape amplitude with short envelopes, and mix post-source or pre-tract depending on phoneme class.",
    avoid:
      "Avoid constant background noise with fixed level. It sounds like hiss, not speech excitation.",
    sources: [
      {
        label: "Klatt (1980) separate source controls for voicing/noise",
        url: "https://doi.org/10.1121/1.383940",
      },
      {
        label: "MDN AudioBufferSourceNode (noise source patterns)",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode",
      },
      {
        label: "Current app white-noise source usage",
        url: "https://github.com/dkellerman/formantboard/blob/main/src/hooks/usePlayer.ts",
      },
    ],
    examples: [
      {
        title: "Breathy consonant onset",
        steps: [
          "Add aspiration gain burst at note start (0.02 to 0.04 gain).",
          "Decay aspiration exponentially to near zero by 70-90 ms.",
          "Band-limit noise to upper mids for clearer breath cue.",
        ],
        hear: "Attack has human breath cue rather than a pure synth start.",
        code: `asp.gain.setValueAtTime(0.03, t0);
asp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
noiseBand.type = "bandpass";
noiseBand.frequency.value = 2500;`,
      },
    ],
    code: `// sketch: aspiration burst
const asp = new GainNode(ctx, { gain: 0 });
noise.connect(asp);
asp.connect(vocalTractIn);
asp.gain.setValueAtTime(0.03, t0);
asp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);`,
  },
  {
    id: "coupling",
    title: "4) Source-Filter Coupling",
    summary:
      "Add light coupling between tract state and source behavior (tilt, amplitude, jitter) so they are not fully independent.",
    acousticDetail:
      "Human phonation is not a strict linear source->filter chain. Tract loading changes effective glottal behavior and perceived brightness/body.",
    implementationDetail:
      "Start with weak coupling terms only: derive a low-rate control signal from tract energy (for example low-mid RMS) and apply small modulation to source tilt or gain.",
    avoid:
      "Avoid hard feedback loops with strong gain. Keep coupling subtle and bounded to preserve stability.",
    sources: [
      {
        label: "Speech production modeling overview (source-filter limits)",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK594203/",
      },
      {
        label: "Source-filter interaction in speech/voice literature overview",
        url: "https://pubmed.ncbi.nlm.nih.gov/17471752/",
      },
      {
        label: "Web Audio dynamics + control building blocks",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API",
      },
    ],
    examples: [
      {
        title: "Tilt follows tract energy",
        steps: [
          "Measure low-mid RMS (150-1200 Hz) once per render frame.",
          "Map that energy to small tilt offsets (+/-2 dB/oct max).",
          "Slew-limit update rate so it moves smoothly.",
        ],
        hear: "Tone feels less disconnected from vowel shaping and less static.",
        code: `const e = measureBandRms(analyser, 150, 1200);
const offset = clamp((e - ref) * 3, -2, 2);
setSourceTiltAtTime(baseTilt + offset, t + 0.02);`,
      },
    ],
    code: `// sketch: weak coupling from tract energy to source tilt
const tractEnergy = measureBandRms(analyser, 150, 1200); // app-side metric
const tilt = clamp(baseTilt + tractEnergy * 0.2, -24, -6);
setSourceTiltAtTime(tilt, t0 + 0.02);`,
  },
  {
    id: "prosody",
    title: "5) Prosody and Micro-Perturbation",
    summary:
      "Natural pitch, timing, jitter/shimmer, and phrase-level dynamics matter more than static vibrato.",
    acousticDetail:
      "Voice naturalness depends on low-frequency prosodic motion and tiny non-periodic variations. Purely periodic modulation sounds synthetic.",
    implementationDetail:
      "Layer phrase F0 contour, note-level target ramps, and small random perturbations with bounded variance. Keep jitter/shimmer small and correlated over short windows.",
    avoid:
      "Avoid a single fixed vibrato profile for all notes. That reads as instrument vibrato, not speech/voice prosody.",
    sources: [
      {
        label: "Vibrato and pitch modulation in singing voice studies",
        url: "https://www.sciencedirect.com/science/article/pii/S0892199708000611",
      },
      {
        label: "Current vibrato controls in sandbox",
        url: "https://github.com/dkellerman/formantboard/blob/main/src/pages/SandboxPage.tsx",
      },
      {
        label: "Current playback modulation path",
        url: "https://github.com/dkellerman/formantboard/blob/main/src/hooks/usePlayer.ts",
      },
    ],
    examples: [
      {
        title: "Phrase-like pitch motion",
        steps: [
          "Start note 15 cents high and settle in first 80 ms.",
          "Use vibrato onset around 0.4-0.6 s, not immediate.",
          "Add tiny random +/-4 cent perturbation at low rate.",
        ],
        hear: "Pitch feels voiced and expressive instead of mechanically steady.",
        code: `carrier.frequency.setValueAtTime(f0 * 1.009, t0);
carrier.frequency.exponentialRampToValueAtTime(f0, t0 + 0.08);
vibratoDepth.gain.linearRampToValueAtTime(extentHz, t0 + 0.5);`,
      },
    ],
    code: `// sketch: layered pitch control
carrier.frequency.setValueAtTime(f0Start, t0);
carrier.frequency.linearRampToValueAtTime(f0Target, t0 + 0.14);
vibratoDepth.gain.setValueAtTime(0, t0);
vibratoDepth.gain.linearRampToValueAtTime(extentHz, t0 + onsetSec);`,
  },
  {
    id: "speaker-scaling",
    title: "6) Speaker-Dependent Tract Scaling",
    summary:
      "Use tract-length scaling and speaker profiles so formant sets are not one-size-fits-all.",
    acousticDetail:
      "Different tract lengths shift resonances globally. One fixed table across voices sounds generic and less human.",
    implementationDetail:
      "Store canonical vowel tables, then apply a multiplicative scale to all formant frequencies per speaker profile. Keep optional per-vowel offsets for fine tuning.",
    avoid:
      "Avoid manually copying separate full tables for every speaker variant unless you have measured data.",
    sources: [
      {
        label: "Acoustic phonetics references for formant scaling",
        url: "https://doi.org/10.7551/mitpress/1072.001.0001",
      },
      {
        label: "Current IPA formant table location",
        url: "https://github.com/dkellerman/formantboard/blob/main/src/constants.ts",
      },
      {
        label: "VTLN background (tract-length normalization)",
        url: "https://ieeexplore.ieee.org/document/275953",
      },
    ],
    examples: [
      {
        title: "Two speaker presets",
        steps: [
          "Create a short-tract preset (scale 0.90) and long-tract preset (scale 1.10).",
          "Apply scale globally to all vowel formant frequencies.",
          "Keep source settings identical while A/B testing.",
        ],
        hear: "Same vowel identity but clearly different speaker character/size.",
        code: `const shortTract = 0.90;
const longTract = 1.10;
const scaled = (f: number, s: number) => f / s;`,
      },
    ],
    code: `// sketch: global tract scale
const tractScale = 0.92; // shorter tract -> higher formants
const scaled = baseFormants.map((f) => ({ ...f, frequency: f.frequency / tractScale }));`,
  },
  {
    id: "nasal-branch",
    title: "7) Nasal Branch and Antiresonances",
    summary:
      "For nasalized sounds and many consonants, include antiresonance behavior (zeros/notches), not just resonance peaks.",
    acousticDetail:
      "Nasal coupling introduces antiresonances that shape timbre in ways pure peaking-filter stacks cannot reproduce.",
    implementationDetail:
      "Add a nasal branch (band-pass + notch/all-pass chain) mixed with oral path under phoneme-dependent control. Use envelopes to open/close nasal contribution over time.",
    avoid: "Avoid trying to mimic nasality by only boosting a fixed low-mid formant.",
    sources: [
      {
        label: "Acoustic-phonetic treatment of nasality and antiresonance",
        url: "https://doi.org/10.7551/mitpress/1072.001.0001",
      },
      {
        label: "Overview of nasal acoustics in speech production",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK594203/",
      },
      {
        label: "Web Audio BiquadFilter types (notch/bandpass)",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type",
      },
    ],
    examples: [
      {
        title: "Nasalized onset",
        steps: [
          "Ramp nasal branch mix from 0 to 0.25 over ~50 ms.",
          "Insert one notch around 700-1200 Hz in nasal branch.",
          "Blend back toward oral path on release.",
        ],
        hear: "Nasal color appears as cavity-coupled timbre, not just EQ boost.",
        code: `nasalMix.gain.setValueAtTime(0, t0);
nasalMix.gain.linearRampToValueAtTime(0.25, t0 + 0.05);
nasalNotch.type = "notch";
nasalNotch.frequency.value = 900;`,
      },
    ],
    code: `// sketch: oral + nasal branches
source.connect(oralPath);
source.connect(nasalPath); // includes notch filters
oralPath.connect(sum);
nasalPath.connect(sum);
nasalMix.gain.setValueAtTime(0, t0);
nasalMix.gain.linearRampToValueAtTime(0.25, t0 + 0.05);`,
  },
];

function DocsCard({ section }: { section: DocSection }) {
  return (
    <article id={section.id} className={cn("rounded-lg border border-zinc-200 bg-white p-5")}>
      <h2 className={cn("m-0 text-lg font-semibold text-zinc-900")}>{section.title}</h2>
      <p className={cn("mt-2 text-sm text-zinc-700")}>{section.summary}</p>
      <SectionAudioDemo sectionId={section.id} />
      <h3 className={cn("mb-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-600")}>
        Sources
      </h3>
      <ul className={cn("mt-2 space-y-1 pl-5 text-sm text-zinc-700")}>
        {section.sources.map((source) => (
          <li key={`${section.id}-${source.url}`}>
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
      <h3 className={cn("mb-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-600")}>
        Examples
      </h3>
      <div className={cn("mt-2 grid gap-2")}>
        {section.examples.map((example) => (
          <div
            key={`${section.id}-${example.title}`}
            className={cn("rounded-md border border-zinc-200 bg-zinc-50 p-3")}
          >
            <div className={cn("text-sm font-semibold text-zinc-900")}>{example.title}</div>
            <ul className={cn("mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700")}>
              {example.steps.map((step) => (
                <li key={`${section.id}-${example.title}-${step}`}>{step}</li>
              ))}
            </ul>
            <p className={cn("mt-2 text-sm text-zinc-700")}>
              <strong>What you should hear:</strong> {example.hear}
            </p>
            {example.code ? (
              <pre
                className={cn(
                  "mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100",
                )}
              >
                <code>{example.code}</code>
              </pre>
            ) : null}
          </div>
        ))}
      </div>
      <details className={cn("mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3")}>
        <summary className={cn("cursor-pointer text-sm font-medium text-zinc-900")}>
          Acoustic detail and implementation plan
        </summary>
        <p className={cn("mt-3 text-sm text-zinc-700")}>
          <strong>Acoustic:</strong> {section.acousticDetail}
        </p>
        <p className={cn("mt-2 text-sm text-zinc-700")}>
          <strong>Code plan:</strong> {section.implementationDetail}
        </p>
        <p className={cn("mt-2 text-sm text-zinc-700")}>
          <strong>Avoid:</strong> {section.avoid}
        </p>
        <pre
          className={cn("mt-3 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}
        >
          <code>{section.code}</code>
        </pre>
      </details>
    </article>
  );
}

export function DevNaturalnessPage() {
  return (
    <section className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-24")}>
      <header className={cn("space-y-3")}>
        <h1 className={cn("m-0 text-3xl font-semibold tracking-tight text-zinc-900")}>
          Dev Docs: Natural Voice Roadmap
        </h1>
        <p className={cn("m-0 max-w-4xl text-sm leading-6 text-zinc-700")}>
          This page documents the most physiologically grounded ways to make the instrument sound
          more human. Each section includes acoustic rationale, specific Web Audio implementation
          guidance, and references.
        </p>
        <div className={cn("flex flex-wrap gap-2")}>
          <Link
            to="/dev/analysis"
            className={cn(
              "rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700",
              "no-underline hover:border-sky-300 hover:text-sky-900",
            )}
          >
            Back to analysis
          </Link>
          <Link
            to="/sandbox"
            className={cn(
              "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700",
              "no-underline hover:border-zinc-400 hover:text-zinc-900",
            )}
          >
            Back to sandbox
          </Link>
        </div>
        <div className={cn("flex flex-wrap gap-2")}>
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600",
                "no-underline hover:border-zinc-300 hover:text-zinc-800",
              )}
            >
              {section.title}
            </a>
          ))}
        </div>
      </header>

      <div className={cn("grid gap-5")}>
        {SECTIONS.map((section) => (
          <DocsCard key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}
