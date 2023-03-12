import { WASMCallback } from 'wasm';
import type { VowelSpec } from './stores/useSettings';

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
  maxFrequency = 22050,
  tilt = 0.0,
  sourceType: OscillatorType = 'sine',
  customGains: Record<number, number> = {},
): [OscillatorNode, GainNode][] {
  const harmonics: [OscillatorNode, GainNode][] = [];

  for (let i = 0; i < maxHarmonics; i++) {
    const freq = baseFrequency * (i + 1);
    if (freq > Math.min(maxFrequency, 22050)) break;
    const hOsc = new OscillatorNode(ctx, { type: sourceType, frequency: freq });
    const gainVal = customGains[i] ?? (10 ** (tilt / 20)) ** i;
    const hGain = new GainNode(ctx, { gain: gainVal });
    hOsc.connect(hGain);
    harmonics.push([hOsc, hGain]);
  }

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
