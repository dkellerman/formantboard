export {};

class MockAudioContext {
  sampleRate: number;
  currentTime = 0;
  destination = {};

  constructor(config: { sampleRate?: number } = {}) {
    this.sampleRate = config.sampleRate ?? 44100;
  }
}

class MockDynamicsCompressorNode {
  threshold = 0;
  knee = 0;
  ratio = 20;
  attack = 0.005;
  release = 0.05;
  reduction = 0;

  constructor(_ctx: AudioContext, opts: Record<string, unknown> = {}) {
    Object.assign(this, opts);
  }
}

class MockGainNode {
  gain = {
    value: 1,
    linearRampToValueAtTime() { return undefined; },
    setTargetAtTime() { return undefined; },
  };

  constructor(_ctx: AudioContext, opts: { gain?: number } = {}) {
    this.gain.value = opts.gain ?? 1;
  }

  connect() { return this; }
  disconnect() { return this; }
}

class MockResizeObserver {
  observe() { return undefined; }
  unobserve() { return undefined; }
  disconnect() { return undefined; }
}

class MockAudioWorkletNode {
  port = {
    postMessage() { return undefined; },
    onmessage: null as ((event: MessageEvent) => void) | null,
  };
}

Object.defineProperty(globalThis, 'AudioContext', {
  configurable: true,
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(globalThis, 'DynamicsCompressorNode', {
  configurable: true,
  writable: true,
  value: MockDynamicsCompressorNode,
});

Object.defineProperty(globalThis, 'GainNode', {
  configurable: true,
  writable: true,
  value: MockGainNode,
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(globalThis, 'AudioWorkletNode', {
  configurable: true,
  writable: true,
  value: MockAudioWorkletNode,
});
