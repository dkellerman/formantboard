import type { FormantSpec } from './stores/useSettings';

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
    const gainVal = customGains[i] ?? (10 ** (tilt / 20)) ** (i + 1);
    // const prevGain = harmonics[i - 1]?.[1].gain.value ?? 1.0;
    // const gainVal = prevGain * (10 ** (tilt / 20));
    // const gainVal = Math.min(9, customGains[i] ?? (10 ** (tilt / 20)) ** (i + 1));
    const hGain = new GainNode(ctx, { gain: gainVal });
    hOsc.connect(hGain);
    harmonics.push([hOsc, hGain]);
  }

  return harmonics;
}

export function createFormants(ctx: AudioContext, formantSpec: FormantSpec): BiquadFilterNode[] {
  const formants: BiquadFilterNode[] = [];

  for (const bandSpec of formantSpec) {
    if (!bandSpec.on) continue;
    const formant = new BiquadFilterNode(ctx, {
      type: 'peaking',
      frequency: bandSpec.frequency,
      gain: 2.0,
      Q: bandSpec.Q,
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
