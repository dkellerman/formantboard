export interface ADSRNodeOptions {
  attack?: AudioParam | number;
  decay?: AudioParam | number;
  sustain?: AudioParam | number;
  release?: AudioParam | number;
}

export class ADSRNode extends GainNode {
  attack: AudioParam;
  decay: AudioParam;
  sustain: AudioParam;
  release: AudioParam;

  constructor(ctx: AudioContext, public options: ADSRNodeOptions) {
    super(ctx, { gain: 0 });
    this.attack = this._getOption('attack', 0);
    this.decay = this._getOption('decay', 0);
    this.sustain = this._getOption('sustain', 1);
    this.release = this._getOption('release', 1);
  }

  start(time: number = 0) {
    const t = this.context.currentTime + time;
    this.gain.cancelScheduledValues(t);
    this.gain.setValueAtTime(0, t);
    this.gain.linearRampToValueAtTime(1, t + this.attack.value);
    // this.gain.linearRampToValueAtTime(this.sustain.value, t + this.attack.value + this.decay.value);
  }

  stop(time: number = 0) {
    const t = this.context.currentTime + time + .001;
    this.gain.setTargetAtTime(0, t, this.release.value);
  }

  _getOption(key: keyof ADSRNodeOptions, defaultValue = 0) {
    const option = this.options[key];
    if (option instanceof AudioParam) return option;
    return new GainNode(this.context, { gain: option ?? defaultValue }).gain;
  }
}
