import "../lib/TextEncoder.js";

export default class WasmAudioProcessor extends AudioWorkletProcessor {
  wasmClass;
  wasmInit;
  wasmFn;

  constructor() {
    super();
    this.samples = [];
    this.totalSamples = 0;
    this.port.onmessage = (event) => this.onmessage(event.data);
    this.processor = null;
  }

  onmessage(event) {
    if (event.type === "send-wasm-module") {
      this.wasmInit(WebAssembly.compile(event.wasmBytes)).then(() => {
        this.port.postMessage({ type: "wasm-module-loaded" });
      });
    } else if (event.type === "init") {
      const { sampleRate, sampleSize } = event;
      this.sampleSize = sampleSize;
      this.processor = this.wasmClass.new(sampleRate, sampleSize);
      this.samples = new Array(sampleSize).fill(0);
      this.totalSamples = 0;
    }
  }

  process(inputs) {
    const inputChannels = inputs[0];
    const inputSamples = inputChannels[0];
    if (!inputSamples) return;

    if (this.totalSamples < this.sampleSize) {
      for (const sampleValue of inputSamples) {
        this.samples[this.totalSamples++] = sampleValue;
      }
    } else {
      // shift the existing samples to the left
      const numNewSamples = inputSamples.length;
      const numExistingSamples = this.samples.length - numNewSamples;
      for (let i = 0; i < numExistingSamples; i++) {
        this.samples[i] = this.samples[i + numNewSamples];
      }
      for (let i = 0; i < numNewSamples; i++) {
        this.samples[numExistingSamples + i] = inputSamples[i];
      }
      this.totalSamples += inputSamples.length;
    }

    if (this.totalSamples >= this.sampleSize && this.processor) {
      const result = this.wasmFn(this.samples);

      if (result !== 0) {
        this.port.postMessage({ type: "response", data: result });
      }
    }

    // returning true tells the audio system to keep going
    return true;
  }
}
