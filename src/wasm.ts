/* eslint-disable @typescript-eslint/no-explicit-any */
export type WASMCallback = (data: WASMCallbackData) => void;
export type WASMCallbackData = any;

function resolvePublicAsset(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(`${normalizedBase}${normalizedPath}`, window.location.origin).toString();
}

export class WASMNode extends AudioWorkletNode {
  callback?: WASMCallback;
  sampleSize?: number;

  init(wasmBytes: ArrayBuffer, callback: WASMCallback, sampleSize: number) {
    this.callback = callback;
    this.sampleSize = sampleSize;
    this.port.onmessage = (event) => this.onmessage(event.data);
    this.port.postMessage({ type: "send-wasm-module", wasmBytes });
  }

  onmessage(event: MessageEvent) {
    if (event.type === "wasm-module-loaded") {
      this.port.postMessage({
        type: "init",
        sampleRate: this.context.sampleRate,
        sampleSize: this.sampleSize,
      });
    } else if (event.type === "response") {
      this.callback?.(event.data);
    }
  }
}

export async function createWASMAudioWorkletNode(
  ctx: AudioContext,
  id: string,
  callback: WASMCallback,
  sampleSize = 1024,
  wasmUrl: string | undefined = undefined,
  processorUrl: string | undefined = undefined,
) {
  if (ctx.state === "suspended") await ctx.resume();

  wasmUrl ??= resolvePublicAsset("lib/wasm-audio/wasm_audio_bg.wasm");
  const response = await window.fetch(wasmUrl);
  const wasmBytes = await response.arrayBuffer();

  processorUrl ??= resolvePublicAsset(`processors/${id}.js`);
  await ctx.audioWorklet.addModule(processorUrl);

  const node = new WASMNode(ctx, id);
  node.init(wasmBytes, callback, sampleSize);

  return node;
}
