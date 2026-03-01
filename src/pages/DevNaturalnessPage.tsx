import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

type SourceLink = {
  label: string;
  url: string;
};

type DocSection = {
  id: string;
  title: string;
  summary: string;
  acousticDetail: string;
  implementationDetail: string;
  avoid: string;
  sources: SourceLink[];
  code: string;
};

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
    avoid:
      "Avoid trying to mimic nasality by only boosting a fixed low-mid formant.",
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
      <h3 className={cn("mb-0 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-600")}>
        Sources
      </h3>
      <ul className={cn("mt-2 space-y-1 pl-5 text-sm text-zinc-700")}>
        {section.sources.map((source) => (
          <li key={`${section.id}-${source.url}`}>
            <a href={source.url} target="_blank" rel="noreferrer" className={cn("text-sky-700 underline")}>
              {source.label}
            </a>
          </li>
        ))}
      </ul>
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
        <pre className={cn("mt-3 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100")}>
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
          This page documents the most physiologically grounded ways to make the instrument sound more
          human. Each section includes acoustic rationale, specific Web Audio implementation guidance, and
          references.
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
