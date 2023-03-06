/* eslint-disable @typescript-eslint/no-explicit-any */
export type WASMCallback = (data: WASMCallbackData) => void;
export type WASMCallbackData = any;

export async function createWASMAudioWorklet(
  ctx: AudioContext,
  id: string,
  wasmUrl: string,
  callback: () => void,
  sampleSize = 1024,
) {
  const response = await window.fetch(wasmUrl);
  const wasmBytes = await response.arrayBuffer();
  const processorUrl = `${id}.js`;
  try {
    await ctx.audioWorklet.addModule(processorUrl);
  } catch (e: any) {
    throw new Error(
      `Failed to load audio analyzer worklet at url: ${processorUrl}. Further info: ${e.message}`
    );
  }
  const node = new WASMNode(ctx, id);
  node.init(wasmBytes, callback, sampleSize);
  return node;
}

export class WASMNode extends AudioWorkletNode {
  callback?: WASMCallback;
  sampleSize?: number;

  init(wasmBytes: ArrayBuffer, callback: WASMCallback, sampleSize: number) {
    this.callback = callback;
    this.sampleSize = sampleSize;
    this.port.onmessage = (event) => this.onmessage(event.data);
    this.port.postMessage({
      type: "send-wasm-module",
      wasmBytes,
    });
  }

  onmessage(event: MessageEvent) {
    if (event.type === 'wasm-module-loaded') {
      this.port.postMessage({
        type: "init-processor",
        sampleRate: this.context.sampleRate,
        sampleSize: this.sampleSize,
      });
    } else if (event.type === "response") {
      this.callback?.(event.data);
    }
  }
}
