import { useCallback, useRef, useState } from "react";
import type { API, JSONPayload } from "@/types";

interface UsePromptOptions {
  onPayloadReady: (prettyPayload: string) => void;
  onStatusChange: (status: string) => void;
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

async function requestPayloadFromServer(params: {
  prompt: string;
  signal?: AbortSignal;
}): Promise<unknown> {
  llmDebug("payload: request", {
    promptChars: params.prompt.length,
  });

  const response = await fetch("/api/ai-payload", {
    method: "POST",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: params.prompt }),
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let errorBody: { error?: string } | null = null;
    if (rawBody) {
      try {
        errorBody = JSON.parse(rawBody) as { error?: string };
      } catch {
        errorBody = null;
      }
    }

    const vercelError = response.headers.get("x-vercel-error");
    const responseText = rawBody.trim();
    const fallbackMessage = `LLM request failed (${response.status}${vercelError ? `: ${vercelError}` : ""}).`;
    const message =
      errorBody?.error ??
      (responseText && !responseText.startsWith("<!doctype html") ? responseText : fallbackMessage);

    llmDebug("payload: error body", {
      status: response.status,
      vercelError,
      message,
      rawBody: responseText,
    });
    throw new Error(message);
  }

  const data = (await response.json()) as unknown;
  llmDebug("payload: output", data);
  return data;
}

export function usePrompt({ onPayloadReady, onStatusChange }: UsePromptOptions) {
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
        return false;
      }

      const api =
        (window as Window & { api?: API; fb?: API }).api ??
        (window as Window & { api?: API; fb?: API }).fb;
      if (!api) {
        onStatusChange("window.api is not available yet.");
        return false;
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

        onStatusChange("Generating playback payload...");
        const parsedRaw = await requestPayloadFromServer({
          prompt,
          signal: controller.signal,
        });

        if (requestId !== activeRequestIdRef.current) {
          return false;
        }

        const parsed = parsedRaw as JSONPayload;
        llmDebug("generator output summary", {
          notesCount: parsed.notes.length,
          loop: parsed.loop,
          firstNote: parsed.notes[0] ?? null,
        });

        const validation = api.validateFromJSON(parsed);
        if (!validation.ok) {
          throw new Error(`Validation failed: ${validation.error}`);
        }

        api.fromJSON(parsed);
        const pretty = JSON.stringify(parsed, null, 2);
        onPayloadReady(pretty);
        onStatusChange(`Scheduled ${parsed.notes.length} note event(s).`);
        return true;
      } catch (error) {
        if (requestId !== activeRequestIdRef.current) {
          return false;
        }
        if (error instanceof Error && error.name === "AbortError") {
          onStatusChange("Prompt canceled.");
          return false;
        }
        const message = error instanceof Error ? error.message : "Unknown LLM error.";
        onStatusChange(`LLM error: ${message}`);
        console.error(error);
        return false;
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
