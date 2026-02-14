export {};

class MockAudioWorkletNode {
  port = {
    postMessage() {
      return undefined;
    },
    onmessage: null as ((event: MessageEvent) => void) | null,
  };
}

Object.defineProperty(globalThis, 'AudioWorkletNode', {
  configurable: true,
  writable: true,
  value: MockAudioWorkletNode,
});
