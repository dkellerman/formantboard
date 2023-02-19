import { Settings, Vowel } from '../types';

export class VocalNode {
  _output?: AudioNode;
  _oscillator: OscillatorNode;
  _tilter: BiquadFilterNode;
  _gain: GainNode;
  _formants: BiquadFilterNode[];
  _compressor: DynamicsCompressorNode;

  constructor(
    public ctx: AudioContext,
    public params: Settings & {
      frequency: number;
      velocity: number;
      vowel: Vowel;
    }
  ) {
    const { frequency, formants, tilt, vowel } = params;
    this._oscillator = new OscillatorNode(ctx, { frequency, type: 'sawtooth' });
    this._tilter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency, Q: tilt });
    this._gain = new GainNode(ctx, { gain: 0 });

    this._formants = [];
    for (const formant of formants[vowel]) {
      const f = new BiquadFilterNode(ctx, {
        type: 'peaking',
        frequency: formant.frequency,
        Q: formant.Q,
      });
      this._formants.push(f);
      f.connect(this._gain);
    }

    this._compressor = new DynamicsCompressorNode(ctx, {
      threshold: -24,
      knee: 30,
      ratio: 12,
      attack: 0.003,
      release: 0.25,
    });

    this._oscillator.connect(this._tilter);
    this._tilter.connect(this._formants[0]);
    for (const f of this._formants) {
      f.connect(this._formants[this._formants.indexOf(f) + 1] ?? this._gain);
    }
    this._gain.connect(this._compressor);
  }

  start(t = 0) {
    const { velocity, onsetTime } = this.params;
    this._oscillator.start(t);
    this._gain.gain.setTargetAtTime(velocity, this.ctx.currentTime, onsetTime);
  }

  stop() {
    const { decayTime } = this.params;
    this._gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + decayTime);
    this._oscillator.stop(this.ctx.currentTime + decayTime);
  }

  connect(destination: AudioNode) {
    this._output = destination;
    this._compressor.connect(destination);
  }

  disconnect() {
    this._compressor.disconnect();
    this._output = undefined;
  }
}
