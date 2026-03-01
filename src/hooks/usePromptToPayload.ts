import { useCallback, useRef, useState } from "react";
import { VOWELS } from "@/constants";
import type { FormantboardAPI, FormantboardJSONPayload, FormantboardLoopSetting } from "@/types";

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

const SYSTEM_PROMPT = `
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

function buildUserPrompt(prompt: string) {
  const vowels = VOWELS.join(", ");
  return `
    Request: ${prompt}

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
  `.trim();
}

export function deriveLoopFromPrompt(prompt: string): FormantboardLoopSetting | undefined {
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
  apiKey: string;
  model: string;
  system: string;
  user: string;
  temperature: number;
  signal?: AbortSignal;
}): Promise<FormantboardJSONPayload> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      temperature: params.temperature,
      tools: [{ type: "web_search_preview" }],
      text: {
        format: {
          type: "json_schema",
          name: "formantboard_payload",
          schema: RESPONSE_PAYLOAD_SCHEMA,
          strict: false,
        },
      },
      input: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as ChatCompletionsResponse;
  const content = extractOutputText(data);
  if (!content) {
    throw new Error("Model returned empty content.");
  }

  return JSON.parse(content) as FormantboardJSONPayload;
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

      const fb = (window as Window & { fb?: FormantboardAPI }).fb;
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
        const model =
          (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || "gpt-4.1";
        const user = buildUserPrompt(prompt);

        const parsed = await requestPayloadFromModel({
          apiKey,
          model,
          system: SYSTEM_PROMPT,
          user,
          temperature: 0,
          signal: controller.signal,
        });

        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        const inferredLoop = deriveLoopFromPrompt(prompt);
        parsed.loop = inferredLoop ?? false;

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
