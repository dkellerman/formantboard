export {};

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  writable: true,
  value: true,
});

class MockAudioContext {
  sampleRate: number;
  currentTime = 0;
  destination = {};
  audioWorklet = {
    addModule: async () => undefined,
  };

  constructor(config: { sampleRate?: number } = {}) {
    this.sampleRate = config.sampleRate ?? 44100;
  }

  createBuffer(_numChannels: number, length: number) {
    return {
      length,
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      buffer: null as unknown,
      loop: false,
      connect() {
        return this;
      },
      disconnect() {
        return this;
      },
      start() {
        return undefined;
      },
      stop() {
        return undefined;
      },
    };
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
    linearRampToValueAtTime() {
      return undefined;
    },
    setTargetAtTime() {
      return undefined;
    },
  };

  constructor(_ctx: AudioContext, opts: { gain?: number } = {}) {
    this.gain.value = opts.gain ?? 1;
  }

  connect() {
    return this;
  }
  disconnect() {
    return this;
  }
}

class MockAnalyserNode {
  context: AudioContext;
  frequencyBinCount = 1024;

  constructor(ctx: AudioContext) {
    this.context = ctx;
  }

  connect() {
    return this;
  }
  disconnect() {
    return this;
  }
  getFloatTimeDomainData(array: Float32Array) {
    void array;
    return undefined;
  }
  getFloatFrequencyData(array: Float32Array) {
    void array;
    return undefined;
  }
  getByteTimeDomainData(array: Uint8Array) {
    void array;
    return undefined;
  }
  getByteFrequencyData(array: Uint8Array) {
    void array;
    return undefined;
  }
}

class MockResizeObserver {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

class MockAudioWorkletNode {
  port = {
    postMessage() {
      return undefined;
    },
    onmessage: null as ((event: MessageEvent) => void) | null,
  };
}

Object.defineProperty(globalThis, "AudioContext", {
  configurable: true,
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(globalThis, "DynamicsCompressorNode", {
  configurable: true,
  writable: true,
  value: MockDynamicsCompressorNode,
});

Object.defineProperty(globalThis, "GainNode", {
  configurable: true,
  writable: true,
  value: MockGainNode,
});

Object.defineProperty(globalThis, "AnalyserNode", {
  configurable: true,
  writable: true,
  value: MockAnalyserNode,
});

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(globalThis, "AudioWorkletNode", {
  configurable: true,
  writable: true,
  value: MockAudioWorkletNode,
});
