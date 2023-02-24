import { FormantSpec, Settings, Vibrato, Vowel } from '../types';

export class VocalNode {
  _harmonics: OscillatorNode[] = [];
  _harmonicsGain: GainNode;
  _vibratoNode: OscillatorNode;
  _vibratoGain: GainNode;
  _tube: BiquadFilterNode;
  _tubeGain: GainNode;
  _formants: BiquadFilterNode[];
  _formantsGain: GainNode;
  _gain: GainNode;
  _output?: AudioNode;

  constructor(
    public ctx: AudioContext,
    public params: Settings & {
      frequency: number;
      velocity: number;
      vowel: Vowel;
    }
  ) {
    const { frequency, formantSpecs, tilt, vowel } = params;

    [this._harmonics, this._harmonicsGain] = this._makeHarmonics(frequency, tilt);
    [this._vibratoNode, this._vibratoGain] = this._makeVibrato(params.vibrato);
    for (const h of this._harmonics) this._vibratoGain.connect(h.frequency);
    [this._formants, this._formantsGain] = this._makeFormants(formantSpecs[vowel]);
    [this._tube, this._tubeGain] = this._makeTube(frequency);
    this._gain = new GainNode(ctx, { gain: 0 });
    this._harmonicsGain.connect(this._tube);

    if (this._formants.length > 0) {
      for (const f of this._formants) this._tubeGain.connect(f);
      this._formantsGain.connect(this._gain);
    } else {
      this._tubeGain.connect(this._gain);
    }
  }

  _makeHarmonics(frequency: number, tilt: number): [OscillatorNode[], GainNode] {
    const harmonicsGain = new GainNode(this.ctx, { gain: 1 });
    const harmonics: OscillatorNode[] = [];
    while (harmonics.length < 40) {
      const f = frequency * (harmonics.length + 1);
      if (f > 22050) break;
      const h = new OscillatorNode(this.ctx, {
        type: 'sine',
        frequency: f,
      });
      const hGain = (10 ** (tilt / 20)) ** harmonics.length;
      const g = new GainNode(this.ctx, { gain: hGain });
      h.connect(g);
      g.connect(harmonicsGain);
      harmonics.push(h);
    }
    return [harmonics, harmonicsGain];
  }

  _makeTube(frequency: number): [BiquadFilterNode, GainNode] {
    const tube = new BiquadFilterNode(this.ctx, {
      type: 'bandpass',
      frequency,
      Q: 1,
    });
    const tubeGain = new GainNode(this.ctx, { gain: 1 });
    tube.connect(tubeGain);
    return [tube, tubeGain];
  }

  _makeFormants(formantSpecs: Array<FormantSpec>): [BiquadFilterNode[], GainNode] {
    const formantsGain = new GainNode(this.ctx, { gain: 1 });
    const formants: BiquadFilterNode[] = [];

    for (const formantSpec of formantSpecs) {
      if (!formantSpec.on) continue;
      const formant = new BiquadFilterNode(this.ctx, {
        type: 'peaking',
        frequency: formantSpec.frequency,
        Q: formantSpec.Q,
      });
      formants.push(formant);
      formant.connect(formantsGain);
    }
    return [formants, formantsGain];
  }

  _makeVibrato(vibrato: Vibrato): [OscillatorNode, GainNode] {
    const vibNode = new OscillatorNode(this.ctx, { frequency: vibrato.rate });
    const vibGain = new GainNode(this.ctx, { gain: vibrato.extent });
    vibNode.connect(vibGain);
    return [vibNode, vibGain];
  }

  start(t = this.ctx.currentTime) {
    const { velocity, onsetTime, vibrato } = this.params;
    for (const h of this._harmonics) h.start(t);

    if (vibrato.on) {
      const vf = this._vibratoNode.frequency.value;
      const vg = this._vibratoGain.gain.value;
      this._vibratoNode.start();
      this._vibratoGain.gain.value = 0;
      this._vibratoNode.frequency.value = 0;
      this._vibratoNode.frequency.linearRampToValueAtTime(vf, t + vibrato.onsetTime);
      this._vibratoGain.gain.linearRampToValueAtTime(vg, t + vibrato.onsetTime);
    }

    this._gain.gain.setTargetAtTime(velocity, this.ctx.currentTime, onsetTime);
  }

  stop() {
    const { decayTime } = this.params;
    this._gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + decayTime);
    for (const h of this._harmonics) h.stop(this.ctx.currentTime + decayTime);
    if (this.params.vibrato.on) {
      try {
        this._vibratoNode.stop();
      } catch (e) {
        console.warn('nope');
      }
    }
  }

  connect(destination: AudioNode) {
    this._output = destination;
    this._gain.connect(destination);
  }

  disconnect() {
    this._gain.disconnect();
    this._output = undefined;
  }
}
