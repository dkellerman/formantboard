import { WASMCallback } from 'wasm';
import type { VowelSpec } from './stores/useSettings';
import { getHarmonics } from './utils';

export function createWhiteNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    channel[i] = Math.random() * 2 - 1;
  }

  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  return node;
}

export function createHarmonics(
  ctx: AudioContext,
  baseFrequency: number,
  maxHarmonics: number = Number.POSITIVE_INFINITY,
  maxFrequency = 10000,
  tilt = 0.0,
  sourceType: OscillatorType = 'sine',
  customGains: Record<number, number> = {},
): [OscillatorNode, GainNode][] {
  const hvals = getHarmonics(baseFrequency, tilt, maxHarmonics, maxFrequency, customGains);
  const harmonics: [OscillatorNode, GainNode][] = hvals.map(([freq, gain]) => {
    const osc = new OscillatorNode(ctx, { type: sourceType, frequency: freq });
    const g = new GainNode(ctx, { gain });
    osc.connect(g);
    return [osc, g];
  });
  return harmonics;
}

export function createFormants(ctx: AudioContext, vowelSpec: VowelSpec): BiquadFilterNode[] {
  const formants: BiquadFilterNode[] = [];

  for (const formantConfig of vowelSpec) {
    if (!formantConfig.on) continue;
    const formant = new BiquadFilterNode(ctx, {
      type: 'peaking',
      frequency: formantConfig.frequency,
      Q: formantConfig.Q / 10.0,
      gain: formantConfig.gain,
    });
    formants.push(formant);
  }
  return formants;
}

export function createTube(ctx: AudioContext, frequency: number): BiquadFilterNode {
  return new BiquadFilterNode(ctx, {
    type: 'bandpass',
    frequency,
    Q: 1,
  });
}

export function createPreEmphasisFilter(ctx: AudioContext, { frequency, Q, gain }: {
  frequency: number;
  Q: number;
  gain: number;
}): BiquadFilterNode {
  const filter = new BiquadFilterNode(ctx, { type: 'peaking', frequency, Q, gain });
  return filter;
}

export async function createMicSource(ctx: AudioContext): Promise<MediaStreamAudioSourceNode> {
  const mediaStream = await window.navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  });
  const audioSource = ctx.createMediaStreamSource(mediaStream);
  return audioSource;
}

export async function createPitchDetectionNode(ctx: AudioContext, callback: WASMCallback) {
  return createWASMAudioWorkletNode(ctx, 'PitchProcessor', callback, 4096);
}
