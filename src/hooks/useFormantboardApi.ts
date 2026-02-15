import { useEffect, useRef } from "react";
import { useAPIValidation } from "@/hooks/useAPIValidation";
import { IPA_WORDS, VOWELS } from "@/constants";
import { useAppStore } from "@/store";
import type {
  FormantOverride,
  FormantboardAPI,
  FormantboardPlayEvent,
  FormantboardVoiceOptions,
  IPAType,
  PlayerState,
} from "@/types";
import { midi2note, type Note } from "@/utils";

const FORMANTBOARD_AI_CONTRACT_ID = "formantboard-ai-contract";
const FORMANTBOARD_AI_GUIDE_ID = "formantboard-ai-guide";
const NOTE_EVENT_FIELDS = [
  "vowel",
  "pitch",
  "duration",
  "timing",
  "volume",
  "tilt",
  "formants",
] as const;
const AVAILABLE_VOWELS = [...VOWELS] as IPAType[];
const AVAILABLE_VOWELS_SET = new Set<IPAType>(AVAILABLE_VOWELS);
const FB_BASIC_CAPABILITIES = [
  "tempo-accurate scheduled notes",
  "per-note vowel shaping",
  "per-note tilt control",
  "targeted per-formant enable/disable (F1/F2/F3)",
] as const;
const FB_ADVANCED_CAPABILITIES = ["per-note formant overrides"] as const;
const FB_CAPABILITIES = [...FB_BASIC_CAPABILITIES, ...FB_ADVANCED_CAPABILITIES] as const;
const FB_LIMITS = [
  "formant overrides currently target indexed formants (F1/F2/F3), not arbitrary count expansion",
  "vowel list is constrained to declared VOWELS",
] as const;
const FB_USAGE_GUIDANCE =
  "Always validate input first (validatePlay / validateFromJSON), then schedule notes. Keep note/time/dur stable; if you need formant control, target one formant at a time (F1/F2/F3).";
const FB_DISCOVERY = {
  docs: {
    ui: "/api",
    markdown: "/api.md",
    llms: "/llms.txt",
    agents: "/agents.txt",
  },
  startHere: [
    "Read /llms.txt (or /agents.txt).",
    "If method details are needed, read /api.md or /api.",
    "Use window.fb.validateFromJSON(payload) before window.fb.fromJSON(payload).",
  ],
} as const;
const FB_POLICY = {
  defaultMode: "basic",
  firstStep: "validate",
  strategy:
    "Prefer window.fb.play with pitch/timing/duration/volume/vowel; when needed, use window.fb.setFormantActive(index, on) for focused formant changes.",
  advancedOnlyWhen: [
    "you need a target timbre that vowel+tilt cannot reach",
    "you are matching known formant values",
    "the user explicitly asks for formant tweaking",
  ],
  avoidAdvancedWhen: [
    "you only need natural vowel articulation",
    "you are generating ordinary melodies/rhythms",
  ],
} as const;

const FORMANTBOARD_AI_CONTRACT = {
  version: 7,
  performance: {
    interaction: "press-release",
    timing: "audio-context",
    entrypoint: "window.fb.play",
    timeUnits: "seconds-from-now",
    polyphony: true,
    noteEventFields: NOTE_EVENT_FIELDS,
    noteEventMap: {
      pitch: "note",
      timing: "time",
      duration: "dur",
      volume: "volume",
      formants: "formants",
    },
  },
  keys: {
    selector: "[data-midi]",
  },
  discovery: FB_DISCOVERY,
  vowels: {
    selector: AVAILABLE_VOWELS,
    entrypoint: "window.fb.setVowel",
    words: IPA_WORDS,
  },
  validation: {
    engine: "zod",
    strictObjects: true,
    methods: ["window.fb.validatePlay", "window.fb.validateFromJSON"],
    schemaEntrypoints: ["window.fb.schemas", "window.fb.schemaJson", "window.fb.getSchemaJson"],
    supportedVowels: AVAILABLE_VOWELS,
  },
  policy: FB_POLICY,
  basicCapabilities: FB_BASIC_CAPABILITIES,
  advancedCapabilities: FB_ADVANCED_CAPABILITIES,
  capabilities: FB_CAPABILITIES,
  limits: FB_LIMITS,
} as const;

const FORMANTBOARD_AI_GUIDE = {
  version: 1,
  intent: {
    primaryGoal:
      "Perform expressive notes by coordinating pitch and vowel/formant shape over time.",
    whatToDo: [
      "Treat each note as an articulatory event, not just a pitch trigger.",
      "Validate payloads before playback and stop if validation fails.",
      "Prefer scheduled playback via window.fb.play for tempo accuracy.",
      "Use vowel/formant controls to simulate timbre movement while notes are playing.",
    ],
  },
  policy: FB_POLICY,
  discovery: FB_DISCOVERY,
  capabilities: {
    eventFields: NOTE_EVENT_FIELDS,
    basicControls: [
      "play",
      "press",
      "setVoice",
      "setVowel",
      "setFormantActive",
      "validatePlay",
      "schemas",
      "schemaJson",
      "getSchemaJson",
    ],
    advancedControls: ["per-note formants"],
    validationControls: ["validateFromJSON"],
    keyTargeting: "[data-midi]",
  },
  examples: {
    expressiveEvent: {
      note: 60,
      time: 0,
      dur: 0.5,
      volume: 0.8,
      vowel: "i",
      tilt: -6,
      formants: [{ index: 1, frequency: 2100 }],
    },
  },
  limits: FB_LIMITS,
} as const;

function clampToPositiveSeconds(value: number | undefined, fallback: number) {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.max(0, value);
}

function clampToUnit(value: number | undefined, fallback = 1) {
  if (value === undefined || Number.isNaN(value)) return Math.max(0, Math.min(fallback, 1));
  if (value > 1) return Math.max(0, Math.min(value / 100, 1));
  return Math.max(0, Math.min(value, 1));
}

function normalizeTilt(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return value;
}

function resolveNote(note: number | Note): number | Note {
  if (typeof note !== "number" || !Number.isInteger(note)) return note;
  return midi2note(note) ?? note;
}

function resolveVowel(vowel: IPAType | undefined) {
  if (!vowel) return undefined;
  if (!AVAILABLE_VOWELS_SET.has(vowel)) {
    throw new Error(
      `Unsupported vowel "${vowel}". Supported vowels: ${AVAILABLE_VOWELS.join(", ")}`,
    );
  }
  return vowel;
}

function normalizeFormantOverrides(overrides: FormantOverride[] | undefined) {
  if (!overrides || overrides.length === 0) return undefined;
  const normalized = overrides
    .filter((item) => Number.isInteger(item.index) && item.index >= 0)
    .map((item) => {
      const next: FormantOverride = { index: item.index };
      if (item.on !== undefined) next.on = item.on;
      if (item.frequency !== undefined && Number.isFinite(item.frequency)) {
        next.frequency = item.frequency;
      }
      if (item.Q !== undefined && Number.isFinite(item.Q)) next.Q = item.Q;
      if (item.gain !== undefined && Number.isFinite(item.gain)) next.gain = item.gain;
      return next;
    });
  return normalized.length > 0 ? normalized : undefined;
}

function upsertFormantOverride(
  existing: FormantOverride[] | undefined,
  index: number,
  patch: Omit<FormantOverride, "index">,
) {
  const source = [...(existing ?? [])];
  const at = source.findIndex((item) => item.index === index);
  const next = { index, ...patch };
  if (at === -1) source.push(next);
  else source[at] = { ...source[at], ...next };
  return source;
}

export function useFormantboardApi(player: PlayerState) {
  const validation = useAPIValidation();
  const playerRef = useRef(player);
  const apiRef = useRef<FormantboardAPI | undefined>(undefined);
  const schemaJsonRef = useRef(validation.schemaJson);
  const voiceRef = useRef<FormantboardVoiceOptions>({
    vowel: resolveVowel(useAppStore.getState().ipa),
    volume: 1,
  });

  function setVowel(vowel: IPAType) {
    const nextVowel = resolveVowel(vowel);
    if (!nextVowel) return;
    voiceRef.current = { ...voiceRef.current, vowel: nextVowel };
    useAppStore.getState().setIPA(nextVowel);
  }

  function setVoice(voice: FormantboardVoiceOptions) {
    const nextVowel = resolveVowel(voice.vowel);
    const nextFormants = normalizeFormantOverrides(voice.formants);
    voiceRef.current = {
      ...voiceRef.current,
      ...voice,
      vowel: nextVowel ?? voiceRef.current.vowel,
      volume: voice.volume === undefined ? voiceRef.current.volume : clampToUnit(voice.volume, 1),
      tilt: normalizeTilt(voice.tilt) ?? voiceRef.current.tilt,
      formants: nextFormants ?? voiceRef.current.formants,
    };
    if (nextVowel) {
      useAppStore.getState().setIPA(nextVowel);
    }
  }

  function patchFormant(index: number, patch: Omit<FormantOverride, "index">, vowel?: IPAType) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`Invalid formant index "${index}".`);
    }

    const targetVowel = resolveVowel(vowel ?? voiceRef.current.vowel ?? useAppStore.getState().ipa);
    if (!targetVowel) return;

    const normalized = normalizeFormantOverrides([{ index, ...patch }])?.[0];
    if (!normalized) return;
    const { index: normalizedIndex, ...patchValues } = normalized;
    void normalizedIndex;

    useAppStore.getState().setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [targetVowel]: current.formants.ipa[targetVowel].map((formant, formantIndex) =>
            formantIndex === index ? { ...formant, ...patchValues } : formant,
          ),
        },
      },
    }));

    voiceRef.current = {
      ...voiceRef.current,
      formants: upsertFormantOverride(voiceRef.current.formants, index, patchValues),
    };
  }

  function setFormantActive(index: number, on: boolean) {
    patchFormant(index, { on });
  }

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  if (!apiRef.current) {
    apiRef.current = {
      version: FORMANTBOARD_AI_CONTRACT.version,
      goal: FORMANTBOARD_AI_GUIDE.intent.primaryGoal,
      defaultMode: FB_POLICY.defaultMode,
      usageGuidance: FB_USAGE_GUIDANCE,
      advancedFeatures: FB_ADVANCED_CAPABILITIES,
      capabilities: FB_CAPABILITIES,
      limits: FB_LIMITS,
      interaction: FORMANTBOARD_AI_CONTRACT.performance.interaction,
      timing: FORMANTBOARD_AI_CONTRACT.performance.timing,
      timeUnits: FORMANTBOARD_AI_CONTRACT.performance.timeUnits,
      keySelector: FORMANTBOARD_AI_CONTRACT.keys.selector,
      entrypoint: FORMANTBOARD_AI_CONTRACT.performance.entrypoint,
      discovery: FB_DISCOVERY,
      noteEventFields: FORMANTBOARD_AI_CONTRACT.performance.noteEventFields,
      vowels: AVAILABLE_VOWELS,
      validationEngine: "zod",
      schemas: validation.schemas,
      schemaJson: schemaJsonRef.current,
      getSchemaJson: () => schemaJsonRef.current,
      setVowel,
      getVowels: () => AVAILABLE_VOWELS,
      validatePlay: (events) => validation.validatePlay(events),
      validateFromJSON: (input) => {
        if (typeof input === "string") {
          try {
            return validation.validateFromJSON(JSON.parse(input));
          } catch (error) {
            return {
              ok: false,
              error:
                error instanceof Error
                  ? `payload.input: ${error.message}`
                  : "payload.input: invalid JSON",
            };
          }
        }
        return validation.validateFromJSON(input);
      },
      setVoice,
      setFormantActive,
      now: () => playerRef.current.now(),
      press: (note, velocity, atTime = 0, duration = 0.25, options) => {
        const requestedVowel = resolveVowel(options?.vowel ?? voiceRef.current.vowel);
        if (requestedVowel) {
          useAppStore.getState().setIPA(requestedVowel);
        }
        const noteVelocity = clampToUnit(options?.volume, velocity ?? voiceRef.current.volume ?? 1);
        const formants = normalizeFormantOverrides(options?.formants ?? voiceRef.current.formants);
        playerRef.current.play(
          resolveNote(note),
          noteVelocity,
          clampToPositiveSeconds(atTime, 0),
          clampToPositiveSeconds(duration, 0.25),
          {
            vowel: requestedVowel,
            tilt: normalizeTilt(options?.tilt ?? voiceRef.current.tilt),
            formants,
          },
        );
      },
      clickKey: (midi, atTime = 0, duration = 0.25, velocity = 1) => {
        const keyNode = document.querySelector(`[data-midi="${midi}"]`) as HTMLElement | null;
        if (keyNode && keyNode.dataset.note) {
          apiRef.current?.press(keyNode.dataset.note as Note, velocity, atTime, duration);
          return;
        }
        apiRef.current?.press(resolveNote(midi), velocity, atTime, duration);
      },
      play: (events: FormantboardPlayEvent[]) => {
        const validation = apiRef.current?.validatePlay(events);
        if (!validation || !validation.ok) {
          throw new Error(
            `Invalid play payload: ${validation?.error ?? "unknown validation error"}`,
          );
        }

        for (const event of validation.value) {
          apiRef.current?.press(event.note, event.velocity, event.time, event.dur, {
            vowel: event.vowel,
            volume: event.volume,
            tilt: event.tilt,
            formants: event.formants,
          });
        }
      },
      fromJSON: (input) => {
        const validation = apiRef.current?.validateFromJSON(input);
        if (!validation || !validation.ok) {
          throw new Error(
            `Invalid performance payload: ${validation?.error ?? "unknown validation error"}`,
          );
        }
        const parsed = validation.value;
        if (parsed.voice) {
          setVoice(parsed.voice);
        }
        const secondsPerBeat = parsed.bpm ? 60 / parsed.bpm : 1;
        apiRef.current?.play(
          parsed.notes.map((entry) => {
            return {
              note: entry.note,
              time: entry.time * secondsPerBeat,
              dur: entry.dur * secondsPerBeat,
              velocity: entry.velocity,
              vowel: entry.vowel,
              volume: entry.volume,
              tilt: entry.tilt,
              formants: entry.formants,
            };
          }),
        );
      },
    };
  }

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const globalWindow = window as Window & { fb?: FormantboardAPI };

    let appendedContractNode = false;
    let appendedGuideNode = false;
    let contractNode = document.getElementById(
      FORMANTBOARD_AI_CONTRACT_ID,
    ) as HTMLScriptElement | null;
    if (!contractNode) {
      contractNode = document.createElement("script");
      contractNode.id = FORMANTBOARD_AI_CONTRACT_ID;
      contractNode.type = "application/json";
      document.head.appendChild(contractNode);
      appendedContractNode = true;
    }
    contractNode.textContent = JSON.stringify(FORMANTBOARD_AI_CONTRACT, null, 2);

    let guideNode = document.getElementById(FORMANTBOARD_AI_GUIDE_ID) as HTMLScriptElement | null;
    if (!guideNode) {
      guideNode = document.createElement("script");
      guideNode.id = FORMANTBOARD_AI_GUIDE_ID;
      guideNode.type = "application/json";
      document.head.appendChild(guideNode);
      appendedGuideNode = true;
    }
    guideNode.textContent = JSON.stringify(FORMANTBOARD_AI_GUIDE, null, 2);

    globalWindow.fb = api;
    return () => {
      if (globalWindow.fb === api) {
        delete globalWindow.fb;
      }
      if (appendedContractNode) {
        contractNode?.remove();
      }
      if (appendedGuideNode) {
        guideNode?.remove();
      }
    };
  }, []);
}
