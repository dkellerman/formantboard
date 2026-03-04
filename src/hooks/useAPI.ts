import { useEffect, useRef } from "react";
import { useAPIValidation } from "@/hooks/useAPIValidation";
import { IPA_WORDS, VOWELS } from "@/constants";
import { useAppStore } from "@/store";
import type {
  FormantOverride,
  API,
  LoopSetting,
  PlayOptions,
  PlayEvent,
  VoiceOptions,
  IPAType,
  PlayerState,
} from "@/types";
import { midi2note, type Note } from "@/utils";

const vowels = [...VOWELS] as IPAType[];
const spec = {
  noteFields: ["vowel", "pitch", "duration", "timing", "volume", "tilt", "formants"] as const,
  basic: [
    "tempo-accurate scheduled notes",
    "opt-in loop playback (count or infinite)",
    "per-note vowel shaping",
    "per-note tilt control",
    "targeted per-formant enable/disable (F1/F2/F3)",
  ] as const,
  advanced: ["per-note formant overrides"] as const,
  capabilities: [
    "tempo-accurate scheduled notes",
    "opt-in loop playback (count or infinite)",
    "per-note vowel shaping",
    "per-note tilt control",
    "targeted per-formant enable/disable (F1/F2/F3)",
    "per-note formant overrides",
  ] as const,
  limits: [
    "formant overrides currently target indexed formants (F1/F2/F3), not arbitrary count expansion",
    "vowel list is constrained to declared VOWELS",
  ] as const,
  usage:
    "Always validate input first (validatePlay / validateFromJSON), then schedule notes. Keep note/time/dur stable; if you need formant control, target one formant at a time (F1/F2/F3). Keep looping off unless the user explicitly requests looping.",
  discovery: {
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
      "Keep loop off by default. Only set payload.loop or window.fb.setLoop(...) when requested.",
    ],
  } as const,
  policy: {
    defaultMode: "basic",
    firstStep: "validate",
    strategy:
      "Prefer window.fb.play with pitch/timing/duration/volume/vowel; when needed, use window.fb.setFormantActive(index, on) for focused formant changes.",
    advancedOnlyWhen: [
      "you need a target timbre that vowel+tilt cannot reach",
      "you are matching known formant values",
      "the user explicitly asks for formant tweaking",
    ],
    loopOnlyWhen: ["the user explicitly asks for looping"],
    avoidAdvancedWhen: [
      "you only need natural vowel articulation",
      "you are generating ordinary melodies/rhythms",
    ],
  } as const,
  goal:
    "Perform expressive notes by coordinating pitch and vowel/formant shape over time.",
} as const;

const contract = {
  version: 8,
  performance: {
    interaction: "press-release",
    timing: "audio-context",
    entrypoint: "window.fb.play",
    timeUnits: "seconds-from-now",
    polyphony: true,
    noteEventFields: spec.noteFields,
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
  discovery: spec.discovery,
  vowels: {
    selector: vowels,
    entrypoint: "window.fb.setVowel",
    words: IPA_WORDS,
  },
  validation: {
    engine: "zod",
    strictObjects: true,
    methods: ["window.fb.validatePlay", "window.fb.validateFromJSON"],
    schemaEntrypoints: ["window.fb.schemas", "window.fb.schemaJson", "window.fb.getSchemaJson"],
    supportedVowels: vowels,
  },
  policy: spec.policy,
  basicCapabilities: spec.basic,
  advancedCapabilities: spec.advanced,
  capabilities: spec.capabilities,
  limits: spec.limits,
} as const;

const guide = {
  version: 1,
  intent: {
    primaryGoal: spec.goal,
    whatToDo: [
      "Treat each note as an articulatory event, not just a pitch trigger.",
      "Validate payloads before playback and stop if validation fails.",
      "Prefer scheduled playback via window.fb.play for tempo accuracy.",
      "Use vowel/formant controls to simulate timbre movement while notes are playing.",
    ],
  },
  policy: spec.policy,
  discovery: spec.discovery,
  capabilities: {
    eventFields: spec.noteFields,
    basicControls: [
      "play",
      "press",
      "stop",
      "setVoice",
      "setLoop",
      "getLoop",
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
  limits: spec.limits,
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
  if (!vowels.includes(vowel)) {
    throw new Error(`Unsupported vowel "${vowel}". Supported vowels: ${vowels.join(", ")}`);
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

type NormalizedLoopMode =
  | { kind: "off"; value: false }
  | { kind: "count"; value: number }
  | { kind: "infinite"; value: "infinite" };

function normalizeLoopSetting(
  loop: LoopSetting | undefined,
  label = "loop",
): NormalizedLoopMode {
  if (loop === undefined || loop === false) {
    return { kind: "off", value: false };
  }

  if (loop === true || loop === "infinite") {
    return { kind: "infinite", value: "infinite" };
  }

  if (!Number.isInteger(loop) || loop <= 0) {
    throw new Error(
      `Invalid ${label} value "${String(loop)}". Use false, true, "infinite", or a positive integer.`,
    );
  }

  return { kind: "count", value: loop };
}

export function useAPI(player: PlayerState) {
  const validation = useAPIValidation();
  const playerRef = useRef(player);
  const apiRef = useRef<API | undefined>(undefined);
  const schemaJsonRef = useRef(validation.schemaJson);
  const loopModeRef = useRef<LoopSetting>(false);
  const loopTimerRef = useRef<number | undefined>(undefined);
  const loopSequenceRef = useRef(0);
  const voiceRef = useRef<VoiceOptions>({
    vowel: resolveVowel(useAppStore.getState().ipa),
    volume: 1,
  });

  function stopLoopScheduler() {
    loopSequenceRef.current += 1;
    if (loopTimerRef.current !== undefined) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = undefined;
    }
  }

  function setVowel(vowel: IPAType) {
    const nextVowel = resolveVowel(vowel);
    if (!nextVowel) return;
    voiceRef.current = { ...voiceRef.current, vowel: nextVowel };
    useAppStore.getState().setIPA(nextVowel);
  }

  function setVoice(voice: VoiceOptions) {
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

  function setLoop(loop: LoopSetting) {
    const normalized = normalizeLoopSetting(loop);
    loopModeRef.current = normalized.kind === "off" ? false : normalized.value;
  }

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  if (!apiRef.current) {
    apiRef.current = {
      version: contract.version,
      goal: guide.intent.primaryGoal,
      defaultMode: spec.policy.defaultMode,
      usageGuidance: spec.usage,
      advancedFeatures: spec.advanced,
      capabilities: spec.capabilities,
      limits: spec.limits,
      interaction: contract.performance.interaction,
      timing: contract.performance.timing,
      timeUnits: contract.performance.timeUnits,
      keySelector: contract.keys.selector,
      entrypoint: contract.performance.entrypoint,
      discovery: spec.discovery,
      noteEventFields: contract.performance.noteEventFields,
      vowels,
      validationEngine: "zod",
      schemas: validation.schemas,
      schemaJson: schemaJsonRef.current,
      getSchemaJson: () => schemaJsonRef.current,
      setVowel,
      getVowels: () => vowels,
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
      setLoop,
      getLoop: () => loopModeRef.current,
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
            source: "api",
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
      stop: () => {
        stopLoopScheduler();
        playerRef.current.stopApiPlayback();
      },
      play: (events: PlayEvent[], options?: PlayOptions) => {
        const validation = apiRef.current?.validatePlay(events);
        if (!validation || !validation.ok) {
          throw new Error(
            `Invalid play payload: ${validation?.error ?? "unknown validation error"}`,
          );
        }

        const loopInput = options?.loop === undefined ? loopModeRef.current : options.loop;
        const loop = normalizeLoopSetting(loopInput);
        const schedule = (atOffset = 0) => {
          for (const event of validation.value) {
            apiRef.current?.press(event.note, event.velocity, atOffset + event.time, event.dur, {
              vowel: event.vowel,
              volume: event.volume,
              tilt: event.tilt,
              formants: event.formants,
            });
          }
        };

        stopLoopScheduler();

        if (validation.value.length === 0) {
          return;
        }

        if (loop.kind === "off") {
          schedule(0);
          return;
        }

        const cycleDuration = validation.value.reduce((maxEnd, event) => {
          return Math.max(maxEnd, event.time + event.dur);
        }, 0);
        if (cycleDuration <= 0) {
          throw new Error("Invalid loop payload: total cycle duration must be positive.");
        }

        const sequenceId = loopSequenceRef.current;
        const initialCycleStart = playerRef.current.now();
        const maxCycles = loop.kind === "count" ? loop.value : Number.POSITIVE_INFINITY;

        const scheduleCycle = (cycleIndex: number, cycleStart: number) => {
          if (sequenceId !== loopSequenceRef.current) {
            return;
          }

          const offset = Math.max(0, cycleStart - playerRef.current.now());
          schedule(offset);

          if (cycleIndex + 1 >= maxCycles) {
            loopTimerRef.current = undefined;
            return;
          }

          const nextCycleStart = initialCycleStart + (cycleIndex + 1) * cycleDuration;
          const waitMs = Math.max(0, (nextCycleStart - playerRef.current.now()) * 1000);
          loopTimerRef.current = window.setTimeout(() => {
            scheduleCycle(cycleIndex + 1, nextCycleStart);
          }, waitMs);
        };

        scheduleCycle(0, initialCycleStart);
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
          { loop: parsed.loop },
        );
      },
    };
  }

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const globalWindow = window as Window & { fb?: API };

    let appendedContractNode = false;
    let appendedGuideNode = false;
    let contractNode = document.getElementById(
      "formantboard-ai-contract",
    ) as HTMLScriptElement | null;
    if (!contractNode) {
      contractNode = document.createElement("script");
      contractNode.id = "formantboard-ai-contract";
      contractNode.type = "application/json";
      document.head.appendChild(contractNode);
      appendedContractNode = true;
    }
    contractNode.textContent = JSON.stringify(contract, null, 2);

    let guideNode = document.getElementById("formantboard-ai-guide") as HTMLScriptElement | null;
    if (!guideNode) {
      guideNode = document.createElement("script");
      guideNode.id = "formantboard-ai-guide";
      guideNode.type = "application/json";
      document.head.appendChild(guideNode);
      appendedGuideNode = true;
    }
    guideNode.textContent = JSON.stringify(guide, null, 2);

    globalWindow.fb = api;
    return () => {
      loopSequenceRef.current += 1;
      if (loopTimerRef.current !== undefined) {
        window.clearTimeout(loopTimerRef.current);
        loopTimerRef.current = undefined;
      }
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
