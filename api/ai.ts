import {
  PAYLOAD_SYSTEM_PROMPT,
  RESOURCE_ROUTER_SCHEMA,
  RESOURCE_ROUTER_SYSTEM_PROMPT,
  RESPONSE_PAYLOAD_SCHEMA,
  buildResourceRoutingPrompt,
  buildSelectedResourceContext,
  buildUserPrompt,
  deriveLoopFromPrompt,
  extractOutputText,
  toSelectedResources,
  type ResourceRoutingResult,
  type ResponsesApiOutput,
} from "./ai-lib.js";
import { MUSIC_RESOURCES } from "../src/lib/resources.js";

type AiPayloadRequestBody = {
  prompt: string;
};

type JSONPayload = {
  loop?: boolean | number | "infinite";
  notes: Array<Record<string, unknown>>;
};

class RequestValidationError extends Error {}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePrompt(value: unknown) {
  if (typeof value !== "string") {
    throw new RequestValidationError("prompt must be a string.");
  }

  const prompt = value.trim();
  if (!prompt) {
    throw new RequestValidationError("prompt must not be empty.");
  }
  if (prompt.length > 4000) {
    throw new RequestValidationError("prompt must be at most 4000 characters.");
  }

  return prompt;
}

function parseRequestBody(payload: unknown): AiPayloadRequestBody {
  if (!isPlainObject(payload)) {
    throw new RequestValidationError("Request body must be a JSON object.");
  }

  return {
    prompt: validatePrompt(payload.prompt),
  };
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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as ResponsesApiOutput;
  const content = extractOutputText(data);
  if (!content) {
    throw new Error(`Model returned empty ${params.requestName} content.`);
  }

  return JSON.parse(content) as unknown;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
    if (!apiKey) {
      return createJsonResponse({ error: "Missing OPENAI_API_KEY on the server." }, 500);
    }

    let requestJson: unknown;
    try {
      requestJson = await request.json();
    } catch {
      return createJsonResponse({ error: "Request body must be valid JSON." }, 400);
    }

    const body = parseRequestBody(requestJson);
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1";
    const routerModel = process.env.OPENAI_ROUTER_MODEL?.trim() || "gpt-4.1-mini";

    const routingRaw = await requestPayloadFromModel({
      requestName: "router",
      apiKey,
      model: routerModel,
      system: RESOURCE_ROUTER_SYSTEM_PROMPT,
      user: buildResourceRoutingPrompt(body.prompt),
      temperature: 0,
      schemaName: "music_resource_routing",
      schema: RESOURCE_ROUTER_SCHEMA,
      signal: request.signal,
    });

    const routing = routingRaw as ResourceRoutingResult;
    const selectedResources = toSelectedResources(routing.resourceIds ?? []);
    const resourcesForGeneration = selectedResources.length ? selectedResources : MUSIC_RESOURCES;

    const parsedRaw = await requestPayloadFromModel({
      requestName: "generator",
      apiKey,
      model,
      system: PAYLOAD_SYSTEM_PROMPT,
      user: buildUserPrompt(
        body.prompt,
        buildSelectedResourceContext(resourcesForGeneration),
        routing.notes,
      ),
      temperature: 0,
      schemaName: "api_payload",
      schema: RESPONSE_PAYLOAD_SCHEMA,
      tools: [{ type: "web_search_preview" }],
      signal: request.signal,
    });

    const parsed = parsedRaw as JSONPayload;
    parsed.loop = deriveLoopFromPrompt(body.prompt) ?? false;

    return createJsonResponse(parsed);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return createJsonResponse({ error: error.message }, 400);
    }

    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error("ai POST failed", error);
    return createJsonResponse({ error: message }, 500);
  }
}
