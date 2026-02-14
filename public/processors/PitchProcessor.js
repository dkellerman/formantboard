import WasmAudioProcessor from "./WasmAudioProcessor.js";
import init, { WasmPitchDetector } from "../lib/wasm-audio/wasm_audio.js";

class PitchProcessor extends WasmAudioProcessor {
  wasmClass = WasmPitchDetector;
  wasmInit = init;
  wasmFn = (samples) => this.processor.detect_pitch(samples);
}

registerProcessor("PitchProcessor", PitchProcessor);
