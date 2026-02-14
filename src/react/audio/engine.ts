import { Input, WebMidi, type NoteMessageEvent } from 'webmidi';
import {
  arr2rms,
  clamp,
  createMicSource,
  createPitchDetectionNode,
  freq2noteCents,
  gain2db,
  midi2note,
  noteOrFreq2freq,
  type Note,
} from '../../utils';

export type AudioFrame = {
  timeData: Uint8Array;
  freqData: Uint8Array;
  rmsDb: number;
};

type FrameListener = (frame: AudioFrame) => void;
type PitchListener = (pitch: { freq: number; note: string; cents: number }) => void;

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private output: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private rafId: number | null = null;
  private frameListeners = new Set<FrameListener>();
  private playing = new Map<number, { source: OscillatorNode; gain: GainNode }>();
  private midiInput: Input | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micPitchNode: AudioWorkletNode | null = null;

  private ensureGraph() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 44100 });
    }
    if (!this.output || !this.analyser) {
      this.output = new GainNode(this.audioContext, { gain: 0.7 });
      this.analyser = new AnalyserNode(this.audioContext, {
        fftSize: 2048,
        smoothingTimeConstant: 0.72,
      });
      this.output.connect(this.analyser);
      this.output.connect(this.audioContext.destination);
    }
  }

  async resume() {
    this.ensureGraph();
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setVolume(percent: number) {
    this.ensureGraph();
    if (!this.output) return;
    this.output.gain.value = clamp(percent, 0, 100) / 100;
  }

  async play(noteOrFrequency: string | number, velocity = 1) {
    await this.resume();
    if (!this.audioContext || !this.output) return;

    const freq = noteOrFreq2freq(noteOrFrequency as Note | number);
    if (!Number.isFinite(freq) || freq <= 0) return;

    const osc = new OscillatorNode(this.audioContext, { type: 'sine', frequency: freq });
    const gain = new GainNode(this.audioContext, { gain: 0 });
    osc.connect(gain);
    gain.connect(this.output);
    const now = this.audioContext.currentTime + 0.002;
    osc.start(now);
    gain.gain.linearRampToValueAtTime(clamp(velocity, 0.05, 1), now + 0.02);
    this.playing.set(freq, { source: osc, gain });
    this.startFrameLoop();
  }

  stop(noteOrFrequency: string | number) {
    if (!this.audioContext) return;
    const freq = noteOrFreq2freq(noteOrFrequency as Note | number);
    const voice = this.playing.get(freq);
    if (!voice) return;
    const now = this.audioContext.currentTime;
    voice.gain.gain.setTargetAtTime(0, now, 0.05);
    voice.source.stop(now + 0.25);
    this.playing.delete(freq);
  }

  stopAll() {
    for (const freq of this.playing.keys()) {
      this.stop(freq);
    }
  }

  subscribeFrames(listener: FrameListener) {
    this.frameListeners.add(listener);
    this.startFrameLoop();
    return () => {
      this.frameListeners.delete(listener);
      this.stopFrameLoopIfIdle();
    };
  }

  async enableMidi(
    onNoteOn: (note: Note, velocity: number) => void,
    onNoteOff: (note: Note) => void,
  ) {
    await WebMidi.enable();
    const input = WebMidi.inputs[0];
    if (!input) return false;
    this.midiInput = input;
    this.midiInput.addListener('noteon', (event: NoteMessageEvent) => {
      const note = midi2note(event.note.number);
      if (!note) return;
      onNoteOn(note, event.note.attack);
    });
    this.midiInput.addListener('noteoff', (event: NoteMessageEvent) => {
      const note = midi2note(event.note.number);
      if (!note) return;
      onNoteOff(note);
    });
    return true;
  }

  disableMidi() {
    this.midiInput?.removeListener();
    this.midiInput = null;
  }

  async enableMic(onPitch: PitchListener) {
    await this.resume();
    if (!this.audioContext || !this.analyser) return false;

    this.micSource = await createMicSource(this.audioContext);
    this.micPitchNode = await createPitchDetectionNode(this.audioContext, (freq: number) => {
      const [note, cents] = freq2noteCents(freq);
      onPitch({ freq, note, cents });
    });

    this.micSource.connect(this.analyser);
    this.micSource.connect(this.micPitchNode);
    this.startFrameLoop();
    return true;
  }

  disableMic() {
    this.micSource?.disconnect();
    this.micPitchNode?.disconnect();
    this.micSource = null;
    this.micPitchNode = null;
  }

  private startFrameLoop() {
    if (this.rafId != null) return;
    this.ensureGraph();
    this.rafId = requestAnimationFrame(this.onAnimationFrame);
  }

  private stopFrameLoopIfIdle() {
    const hasPlayback = this.playing.size > 0 || Boolean(this.micSource);
    const hasSubscribers = this.frameListeners.size > 0;
    if (hasPlayback || hasSubscribers) return;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private onAnimationFrame = () => {
    if (!this.analyser) {
      this.rafId = null;
      return;
    }
    const timeData = new Uint8Array(this.analyser.frequencyBinCount);
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(timeData);
    this.analyser.getByteFrequencyData(freqData);
    const rmsDb = gain2db(arr2rms([...freqData], 256));

    const frame: AudioFrame = { timeData, freqData, rmsDb };
    for (const listener of this.frameListeners) listener(frame);

    this.rafId = requestAnimationFrame(this.onAnimationFrame);
  };
}

export const audioEngine = new AudioEngine();
