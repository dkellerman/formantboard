import { MUSIC_RESOURCES, type MusicResource } from "../src/lib/resources.js";

export type ResponsesApiOutput = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export interface ResourceRoutingResult {
  resourceIds: string[];
  notes?: string;
}

export const AI_VOWELS = ["ɑ", "ɛ", "ə", "æ", "ɔ", "u", "ʊ", "ɪ", "i"] as const;

export const RESOURCE_ROUTER_SYSTEM_PROMPT = `
  You are a routing assistant.
  Select the most relevant resources from the provided catalog for the user request.
  Return JSON only.
`.trim();

export const RESOURCE_ROUTER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    resourceIds: {
      type: "array",
      items: { type: "string" },
      maxItems: 16,
    },
    notes: { type: "string" },
  },
  required: ["resourceIds"],
} as const;

export const PAYLOAD_SYSTEM_PROMPT = `
  You generate valid performance payload JSON only.
  Return exactly one JSON object and no markdown.
  Use canonical lead melodies for named songs and widely known variants.
  Search authoritative notation sources when needed.
  Every note must include note, time, dur, and vowel.
  Use only supported IPA vowels.
  Include root "loop" only when looping is requested.
`.trim();

export const RESPONSE_PAYLOAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    loop: {
      anyOf: [
        { type: "boolean" },
        { type: "integer", minimum: 1 },
        { type: "string", enum: ["infinite"] },
      ],
    },
    notes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          note: { type: "number" },
          time: { type: "number" },
          dur: { type: "number" },
          vowel: { type: "string", enum: [...AI_VOWELS] },
        },
        required: ["note", "time", "dur", "vowel"],
      },
    },
  },
  required: ["notes"],
} as const;

const RESOURCE_BY_ID = new Map(MUSIC_RESOURCES.map((resource) => [resource.id, resource]));
const LOOP_WORD_RE = /\bloop(?:ing|ed|s)?\b/;
const NO_LOOP_RE = /\b(?:don't|do not|dont|without|no)\s+loop(?:ing|ed|s)?\b|\bno\s+loop\b/;
const LOOP_FOREVER_RE = /\b(?:forever|infinite(?:ly)?|endless(?:ly)?|indefinite(?:ly)?)\b/;
const LOOP_COUNT_PATTERNS = [
  /\bloop(?:\s+\w+){0,6}\s+(\d+)\s*(?:x|times?)\b/,
  /\bloop\s+(\d+)\b/,
  /\b(\d+)\s*(?:x|times?)\s*(?:in\s+)?(?:a\s+)?loop\b/,
  /\brepeat\s+(\d+)\s*(?:x|times?)\b/,
];

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

function buildResourceCatalogText(resources: readonly MusicResource[]) {
  return resources
    .map((resource) => {
      const parts = [
        `id=${resource.id}`,
        `name=${resource.name}`,
        `url=${resource.url}`,
        `type=${resource.type}`,
        `categories=${resource.categories.join("|")}`,
        `tags=${resource.tags.join("|")}`,
        `license=${resource.license}`,
        `cost=${resource.cost}`,
        `api=${yesNo(resource.apiAvailable)}`,
        `auth=${yesNo(resource.requiresAuth)}`,
        `confidence=${resource.confidence.toFixed(2)}`,
      ];
      if (resource.notes) {
        parts.push(`notes=${resource.notes}`);
      }
      return `- ${parts.join("; ")}`;
    })
    .join("\n");
}

export function buildResourceRoutingPrompt(prompt: string) {
  return [
    "User request:",
    prompt,
    "",
    "Resource catalog:",
    buildResourceCatalogText(MUSIC_RESOURCES),
    "",
    "Task:",
    "- Pick 0-16 resource IDs from the catalog that are most relevant.",
    "- Keep only highly relevant resources.",
    '- Return JSON matching: {"resourceIds":["id1","id2"],"notes":"optional short note"}.',
  ].join("\n");
}

export function buildSelectedResourceContext(resources: readonly MusicResource[]) {
  if (!resources.length) return "";
  const rows = resources.map(
    (resource) =>
      `- ${resource.name}: ${resource.url} (id=${resource.id}; categories=${resource.categories.join("|")}; type=${resource.type}; license=${resource.license}; cost=${resource.cost}; api=${yesNo(resource.apiAvailable)}; auth=${yesNo(resource.requiresAuth)}; confidence=${resource.confidence.toFixed(2)})`,
  );
  return ["[MUSIC_RESOURCES]", ...rows].join("\n");
}

export function buildUserPrompt(
  prompt: string,
  selectedResourceContext: string,
  routingNotes?: string,
) {
  const lines = [
    `Request: ${prompt}`,
    selectedResourceContext,
    "",
    "Output format:",
    '- Return JSON matching this shape exactly: {"notes":[{"note":60,"time":0,"dur":1,"vowel":"ɑ"}]}',
    '- Optional root field: "loop" (false/true, positive integer, or "infinite").',
    '- Only include "loop" if looping is explicitly requested.',
    "- Use MIDI note numbers for note.",
    "- Use beat units for time and dur.",
    "- Start the first note at time 0.",
    "- Include a vowel on every note.",
    `- Allowed vowels: ${AI_VOWELS.join(", ")}`,
    "",
    "Priority rules:",
    "1. Match the requested melody first.",
    "2. Keep rhythm recognizably close to the tune.",
    "3. Do not improvise unless the prompt explicitly asks for variation.",
    "4. Do not substitute scales or exercises for named songs.",
    "5. Use [MUSIC_RESOURCES] context when relevant.",
  ];

  if (routingNotes) {
    lines.push(`- Router notes: ${routingNotes}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function deriveLoopFromPrompt(prompt: string): boolean | number | "infinite" | undefined {
  const normalized = prompt.toLowerCase();
  if (!LOOP_WORD_RE.test(normalized)) return undefined;
  if (NO_LOOP_RE.test(normalized)) {
    return false;
  }

  for (const pattern of LOOP_COUNT_PATTERNS) {
    const match = normalized.match(pattern);
    const parsed = Number(match?.[1] ?? NaN);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  if (/\bonce\b/.test(normalized)) return 1;
  if (LOOP_FOREVER_RE.test(normalized)) {
    return "infinite";
  }

  return "infinite";
}

export function extractOutputText(data: ResponsesApiOutput) {
  return (
    data.output
      ?.filter((item) => item.type === "message")
      .flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text" && item.text)?.text ?? null
  );
}

export function toSelectedResources(resourceIds: readonly string[]): MusicResource[] {
  const selected: MusicResource[] = [];
  const seen = new Set<string>();

  for (const id of resourceIds) {
    if (seen.has(id)) continue;
    const resource = RESOURCE_BY_ID.get(id);
    if (!resource) continue;
    selected.push(resource);
    seen.add(id);
  }

  return selected;
}
