import { useCallback, useRef, useState } from "react";
import { VOWELS } from "@/constants";
import { MUSIC_RESOURCES, type MusicResource } from "@/lib/musicResources";
import type { API, JSONPayload, LoopSetting } from "@/types";

type ChatCompletionsResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

interface UsePromptToPayloadOptions {
  onPayloadReady: (prettyPayload: string) => void;
  onStatusChange: (status: string) => void;
}

interface ResourceRoutingResult {
  resourceIds: string[];
  notes?: string;
}

const LLM_DEBUG_ENABLED =
  import.meta.env.DEV ||
  ((import.meta.env.VITE_LLM_DEBUG as string | undefined)?.toLowerCase() ?? "") === "true";

function llmDebug(message: string, data?: unknown) {
  if (!LLM_DEBUG_ENABLED) return;
  if (data === undefined) {
    console.debug(`[llm] ${message}`);
    return;
  }
  console.debug(`[llm] ${message}`, data);
}

const RESOURCE_ROUTER_SYSTEM_PROMPT = `
  You are a routing assistant.
  Select the most relevant resources from the provided catalog for the user request.
  Return JSON only.
`.trim();

const RESOURCE_ROUTER_SCHEMA = {
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

const PAYLOAD_SYSTEM_PROMPT = `
  You generate valid FormantBoard performance payload JSON only.
  Return exactly one JSON object and no markdown.
  Use canonical lead melodies for named songs and widely known variants.
  Search authoritative notation sources when needed.
  Every note must include note, time, dur, and vowel.
  Use only supported IPA vowels.
  Include root "loop" only when looping is requested.
`.trim();

const RESPONSE_PAYLOAD_SCHEMA = {
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
          vowel: { type: "string", enum: [...VOWELS] },
        },
        required: ["note", "time", "dur", "vowel"],
      },
    },
  },
  required: ["notes"],
} as const;

function buildResourceCatalogText(resources: readonly MusicResource[]): string {
  return resources
    .map((resource) => {
      const categories = resource.categories.join("|");
      const tags = resource.tags.join("|");
      const notes = resource.notes ? ` notes=${resource.notes}` : "";
      return [
        `- id=${resource.id}`,
        `name=${resource.name}`,
        `url=${resource.url}`,
        `type=${resource.type}`,
        `categories=${categories}`,
        `tags=${tags}`,
        `license=${resource.license}`,
        `cost=${resource.cost}`,
        `api=${resource.apiAvailable ? "yes" : "no"}`,
        `auth=${resource.requiresAuth ? "yes" : "no"}`,
        `confidence=${resource.confidence.toFixed(2)}${notes}`,
      ].join("; ");
    })
    .join("\n");
}

function buildResourceRoutingPrompt(prompt: string) {
  return `
    User request:
    ${prompt}

    Resource catalog:
    ${buildResourceCatalogText(MUSIC_RESOURCES)}

    Task:
    - Pick 0-16 resource IDs from the catalog that are most relevant.
    - Keep only highly relevant resources.
    - Return JSON matching: {"resourceIds":["id1","id2"],"notes":"optional short note"}.
  `.trim();
}

function buildSelectedResourceContext(resources: readonly MusicResource[]) {
  if (!resources.length) return "";
  const rows = resources.map((resource) => {
    const categories = resource.categories.join("|");
    return `- ${resource.name}: ${resource.url} (id=${resource.id}; categories=${categories}; type=${resource.type}; license=${resource.license}; cost=${resource.cost}; api=${resource.apiAvailable ? "yes" : "no"}; auth=${resource.requiresAuth ? "yes" : "no"}; confidence=${resource.confidence.toFixed(2)})`;
  });
  return ["[MUSIC_RESOURCES]", ...rows].join("\n");
}

function buildUserPrompt(prompt: string, selectedResourceContext: string, routingNotes?: string) {
  const vowels = VOWELS.join(", ");
  const routingLine = routingNotes ? `- Router notes: ${routingNotes}` : "";
  return `
    Request: ${prompt}
    ${selectedResourceContext}

    Output format:
    - Return JSON matching this shape exactly: {"notes":[{"note":60,"time":0,"dur":1,"vowel":"ɑ"}]}
    - Optional root field: "loop" (false/true, positive integer, or "infinite").
    - Only include "loop" if looping is explicitly requested.
    - Use MIDI note numbers for note.
    - Use beat units for time and dur.
    - Start the first note at time 0.
    - Include a vowel on every note.
    - Allowed vowels: ${vowels}

    Priority rules:
    1. Match the requested melody first.
    2. Keep rhythm recognizably close to the tune.
    3. Do not improvise unless the prompt explicitly asks for variation.
    4. Do not substitute scales or exercises for named songs.
    5. Use [MUSIC_RESOURCES] context when relevant.
    ${routingLine}
  `.trim();
}

export function deriveLoopFromPrompt(prompt: string): LoopSetting | undefined {
  const normalized = prompt.toLowerCase();
  const hasLoopWord = /\bloop(?:ing|ed|s)?\b/.test(normalized);
  if (!hasLoopWord) return undefined;

  if (
    /\b(?:don't|do not|dont|without|no)\s+loop(?:ing|ed|s)?\b/.test(normalized) ||
    /\bno\s+loop\b/.test(normalized)
  ) {
    return false;
  }

  const countPatterns = [
    /\bloop(?:\s+\w+){0,6}\s+(\d+)\s*(?:x|times?)\b/,
    /\bloop\s+(\d+)\b/,
    /\b(\d+)\s*(?:x|times?)\s*(?:in\s+)?(?:a\s+)?loop\b/,
    /\brepeat\s+(\d+)\s*(?:x|times?)\b/,
  ];
  for (const pattern of countPatterns) {
    const match = normalized.match(pattern);
    const parsed = Number(match?.[1] ?? NaN);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  if (/\bonce\b/.test(normalized)) return 1;
  if (/\b(?:forever|infinite(?:ly)?|endless(?:ly)?|indefinite(?:ly)?)\b/.test(normalized)) {
    return "infinite";
  }

  return "infinite";
}

function extractOutputText(data: ChatCompletionsResponse) {
  for (const outputItem of data.output ?? []) {
    if (outputItem.type !== "message") {
      continue;
    }
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.type === "output_text" && contentItem.text) {
        return contentItem.text;
      }
    }
  }
  return null;
}

async function requestPayloadFromModel(params: {
  requestName: "router" | "generator";
  apiKey: string;
  model: string;
  system: string;
  user: string;
  temperature: number;
  schemaName: string;
  schema: object;
  tools?: Array<{ type: string }>;
  signal?: AbortSignal;
}): Promise<unknown> {
  const payload: Record<string, unknown> = {
    model: params.model,
    temperature: params.temperature,
    text: {
      format: {
        type: "json_schema",
        name: params.schemaName,
        schema: params.schema,
        strict: false,
      },
    },
    input: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  };

  if (params.tools?.length) {
    payload.tools = params.tools;
  }

  llmDebug(`${params.requestName}: request`, {
    model: params.model,
    schemaName: params.schemaName,
    temperature: params.temperature,
    hasTools: Boolean(params.tools?.length),
    systemChars: params.system.length,
    userChars: params.user.length,
  });

  const startedAt = performance.now();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const durationMs = Math.round(performance.now() - startedAt);
  llmDebug(`${params.requestName}: response`, {
    status: response.status,
    ok: response.ok,
    durationMs,
  });

  if (!response.ok) {
    const text = await response.text();
    llmDebug(`${params.requestName}: error body`, { preview: text.slice(0, 600) });
    throw new Error(`LLM request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as ChatCompletionsResponse;
  const content = extractOutputText(data);
  if (!content) {
    llmDebug(`${params.requestName}: empty output`, data);
    throw new Error("Model returned empty content.");
  }
  llmDebug(`${params.requestName}: output`, { outputChars: content.length });

  try {
    return JSON.parse(content) as unknown;
  } catch (error) {
    llmDebug(`${params.requestName}: json parse failed`, {
      preview: content.slice(0, 600),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

const RESOURCE_BY_ID = new Map(MUSIC_RESOURCES.map((resource) => [resource.id, resource]));

function toSelectedResources(resourceIds: readonly string[]): MusicResource[] {
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

export function usePromptToPayload({ onPayloadReady, onStatusChange }: UsePromptToPayloadOptions) {
  const [llmGenerating, setLlmGenerating] = useState(false);
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const cancelPromptGeneration = useCallback(() => {
    activeRequestIdRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
    setLlmGenerating(false);
  }, []);

  const generateAndPlayFromPrompt = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt) {
        onStatusChange("Enter a prompt first.");
        return;
      }

      const fb = (window as Window & { fb?: API }).fb;
      if (!fb) {
        onStatusChange("window.fb is not available yet.");
        return;
      }

      const apiKey = (import.meta.env.VITE_OPENAI_KEY as string | undefined)?.trim() ?? "";
      if (!apiKey) {
        onStatusChange("Missing VITE_OPENAI_KEY.");
        return;
      }

      cancelPromptGeneration();
      setLlmGenerating(true);
      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        llmDebug("prompt received", {
          promptChars: prompt.length,
          promptPreview: prompt.slice(0, 180),
        });
        const model =
          (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || "gpt-4.1";
        const routerModel =
          (import.meta.env.VITE_OPENAI_ROUTER_MODEL as string | undefined)?.trim() ||
          "gpt-4.1-mini";

        onStatusChange("Routing music resources...");
        const routingRaw = await requestPayloadFromModel({
          requestName: "router",
          apiKey,
          model: routerModel,
          system: RESOURCE_ROUTER_SYSTEM_PROMPT,
          user: buildResourceRoutingPrompt(prompt),
          temperature: 0,
          schemaName: "music_resource_routing",
          schema: RESOURCE_ROUTER_SCHEMA,
          signal: controller.signal,
        });

        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        const routing = routingRaw as ResourceRoutingResult;
        const selectedResources = toSelectedResources(routing.resourceIds ?? []);
        const resourcesForGeneration = selectedResources.length
          ? selectedResources
          : MUSIC_RESOURCES;
        llmDebug("router selection", {
          selectedIds: routing.resourceIds ?? [],
          selectedCount: selectedResources.length,
          fallbackToFullCatalog: selectedResources.length === 0,
          selectedNames: selectedResources.map((resource) => resource.name),
          notes: routing.notes,
        });
        const selectedResourceContext = buildSelectedResourceContext(resourcesForGeneration);
        const user = buildUserPrompt(prompt, selectedResourceContext, routing.notes);

        onStatusChange("Generating playback payload...");
        const parsedRaw = await requestPayloadFromModel({
          requestName: "generator",
          apiKey,
          model,
          system: PAYLOAD_SYSTEM_PROMPT,
          user,
          temperature: 0,
          schemaName: "formantboard_payload",
          schema: RESPONSE_PAYLOAD_SCHEMA,
          tools: [{ type: "web_search_preview" }],
          signal: controller.signal,
        });

        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        const parsed = parsedRaw as JSONPayload;
        const inferredLoop = deriveLoopFromPrompt(prompt);
        parsed.loop = inferredLoop ?? false;
        llmDebug("generator output summary", {
          notesCount: parsed.notes.length,
          loop: parsed.loop,
          firstNote: parsed.notes[0] ?? null,
        });

        const validation = fb.validateFromJSON(parsed);
        if (!validation.ok) {
          throw new Error(`Validation failed: ${validation.error}`);
        }

        fb.fromJSON(parsed);
        const pretty = JSON.stringify(parsed, null, 2);
        onPayloadReady(pretty);
        onStatusChange(`Scheduled ${parsed.notes.length} note event(s).`);
      } catch (error) {
        if (requestId !== activeRequestIdRef.current) {
          return;
        }
        if (error instanceof Error && error.name === "AbortError") {
          onStatusChange("Prompt canceled.");
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown LLM error.";
        onStatusChange(`LLM error: ${message}`);
        console.error(error);
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLlmGenerating(false);
          abortControllerRef.current = undefined;
        }
      }
    },
    [cancelPromptGeneration, onPayloadReady, onStatusChange],
  );

  return {
    llmGenerating,
    generateAndPlayFromPrompt,
    cancelPromptGeneration,
  };
}
