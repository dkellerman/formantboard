import { useMemo } from "react";
import { z, type ZodError } from "zod";
import { VOWELS } from "@/constants";
import type {
  FormantboardNormalizedPayload,
  FormantboardPlayEvent,
  FormantboardVoiceOptions,
  IPAType,
} from "@/types";

const IPA_VOWELS = [...VOWELS] as IPAType[];
const IPA_VOWEL_SCHEMA = z.enum(IPA_VOWELS as [IPAType, ...IPAType[]]);

const NOTE_SCHEMA = z.union([z.number().finite(), z.string().min(1)]);

const FORMANT_OVERRIDE_SCHEMA = z
  .object({
    index: z.number().int().nonnegative(),
    on: z.boolean().optional(),
    frequency: z.number().finite().optional(),
    Q: z.number().finite().optional(),
    gain: z.number().finite().optional(),
  })
  .strict();

const VOICE_OPTIONS_SCHEMA = z
  .object({
    vowel: IPA_VOWEL_SCHEMA.optional(),
    volume: z.number().finite().optional(),
    tilt: z.number().finite().optional(),
    formants: z.array(FORMANT_OVERRIDE_SCHEMA).optional(),
  })
  .strict();

const PLAY_EVENT_SCHEMA = z
  .object({
    note: NOTE_SCHEMA,
    time: z.number().finite().nonnegative(),
    dur: z.number().finite().positive(),
    velocity: z.number().finite().optional(),
    vowel: IPA_VOWEL_SCHEMA.optional(),
    volume: z.number().finite().optional(),
    tilt: z.number().finite().optional(),
    formants: z.array(FORMANT_OVERRIDE_SCHEMA).optional(),
  })
  .strict();

const JSON_NOTE_INPUT_SCHEMA = z
  .object({
    note: NOTE_SCHEMA.optional(),
    time: z.number().finite().nonnegative().optional(),
    dur: z.number().finite().positive().optional(),
    velocity: z.number().finite().optional(),
    vowel: IPA_VOWEL_SCHEMA.optional(),
    volume: z.number().finite().optional(),
    tilt: z.number().finite().optional(),
    formants: z.array(FORMANT_OVERRIDE_SCHEMA).optional(),
    // Legacy aliases accepted for backwards compatibility.
    m: z.number().int().optional(),
    t: z.number().finite().nonnegative().optional(),
    d: z.number().finite().positive().optional(),
    v: z.number().finite().optional(),
    ipa: IPA_VOWEL_SCHEMA.optional(),
    vol: z.number().finite().optional(),
    formantOverrides: z.array(FORMANT_OVERRIDE_SCHEMA).optional(),
  })
  .strict()
  .superRefine((note, ctx) => {
    if (note.note === undefined && note.m === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Note is required. Use "note" (preferred) or legacy "m".',
        path: ["note"],
      });
    }
    if (note.time === undefined && note.t === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Time is required. Use "time" (preferred) or legacy "t".',
        path: ["time"],
      });
    }
    if (note.dur === undefined && note.d === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration is required. Use "dur" (preferred) or legacy "d".',
        path: ["dur"],
      });
    }
    if (note.time !== undefined && note.t !== undefined && note.time !== note.t) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conflicting values for "time" and legacy alias "t".',
        path: ["time"],
      });
    }
    if (note.dur !== undefined && note.d !== undefined && note.dur !== note.d) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conflicting values for "dur" and legacy alias "d".',
        path: ["dur"],
      });
    }
    if (note.vowel !== undefined && note.ipa !== undefined && note.vowel !== note.ipa) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conflicting values for "vowel" and legacy alias "ipa".',
        path: ["vowel"],
      });
    }
  });

const JSON_PAYLOAD_INPUT_SCHEMA = z
  .object({
    bpm: z.number().positive().finite().optional(),
    voice: VOICE_OPTIONS_SCHEMA.optional(),
    notes: z.array(JSON_NOTE_INPUT_SCHEMA),
  })
  .strict();

function normalizeJSONNote(note: z.infer<typeof JSON_NOTE_INPUT_SCHEMA>): FormantboardPlayEvent {
  const normalized: FormantboardPlayEvent = {
    note: note.note ?? (note.m as number),
    time: note.time ?? (note.t as number),
    dur: note.dur ?? (note.d as number),
  };

  const velocity = note.velocity ?? note.v;
  if (velocity !== undefined) normalized.velocity = velocity;

  const vowel = note.vowel ?? note.ipa;
  if (vowel !== undefined) normalized.vowel = vowel;

  const volume = note.volume ?? note.vol;
  if (volume !== undefined) normalized.volume = volume;

  if (note.tilt !== undefined) normalized.tilt = note.tilt;

  const formants = note.formants ?? note.formantOverrides;
  if (formants !== undefined) normalized.formants = formants;

  return normalized;
}

const NORMALIZED_JSON_PAYLOAD_SCHEMA = JSON_PAYLOAD_INPUT_SCHEMA.transform((payload) => {
  const normalized: FormantboardNormalizedPayload = {
    bpm: payload.bpm,
    notes: payload.notes.map((note) => normalizeJSONNote(note)),
  };

  if (payload.voice) {
    normalized.voice = payload.voice as FormantboardVoiceOptions;
  }

  return normalized;
});

export const formantboardSchemas = {
  playEvents: z.array(PLAY_EVENT_SCHEMA),
  jsonPayload: JSON_PAYLOAD_INPUT_SCHEMA,
};

const PLAY_EVENTS_JSON_SCHEMA = z.toJSONSchema(formantboardSchemas.playEvents);
const JSON_PAYLOAD_JSON_SCHEMA = z.toJSONSchema(formantboardSchemas.jsonPayload);

export const formantboardJsonSchemas = {
  // Force plain JSON objects so consumers don't see framework-specific prototypes.
  playEvents: JSON.parse(JSON.stringify(PLAY_EVENTS_JSON_SCHEMA)),
  jsonPayload: JSON.parse(JSON.stringify(JSON_PAYLOAD_JSON_SCHEMA)),
};

function issuePath(path: PropertyKey[]) {
  if (path.length === 0) return "input";
  let out = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      out += `[${segment}]`;
      continue;
    }
    if (typeof segment === "symbol") {
      out += out ? `.${String(segment)}` : String(segment);
      continue;
    }
    out += out ? `.${segment}` : segment;
  }
  return out.replaceAll(".[", "[");
}

function formatZodError(prefix: string, error: ZodError) {
  const issues = error.issues.slice(0, 3).map((issue) => {
    const path = issuePath(issue.path);
    const fullPath = path.startsWith("[") ? `${prefix}${path}` : `${prefix}.${path}`;
    return `${fullPath}: ${issue.message}`;
  });
  return issues.join("; ");
}

export function validatePlayEventsInput(
  input: unknown,
): { ok: true; value: FormantboardPlayEvent[] } | { ok: false; error: string } {
  const parsed = formantboardSchemas.playEvents.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: formatZodError("events", parsed.error),
    };
  }
  return {
    ok: true,
    value: parsed.data as FormantboardPlayEvent[],
  };
}

export function validateJSONPayloadInput(
  input: unknown,
): { ok: true; value: FormantboardNormalizedPayload } | { ok: false; error: string } {
  const parsed = NORMALIZED_JSON_PAYLOAD_SCHEMA.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: formatZodError("payload", parsed.error),
    };
  }
  return {
    ok: true,
    value: parsed.data,
  };
}

export const SUPPORTED_IPA_VOWELS = IPA_VOWELS;

export function useAPIValidation() {
  return useMemo(
    () => ({
      schemas: formantboardSchemas,
      schemaJson: formantboardJsonSchemas,
      validatePlay: validatePlayEventsInput,
      validateFromJSON: validateJSONPayloadInput,
      supportedVowels: SUPPORTED_IPA_VOWELS,
    }),
    [],
  );
}
