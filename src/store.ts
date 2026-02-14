/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStore } from "zustand/vanilla";
import regression, { logarithmic } from "regression";
import { Input, WebMidi, type NoteMessageEvent } from "webmidi";
import {
  CAP_FREQ,
  clamp,
  createFormants,
  createHarmonics,
  createWhiteNoise,
  db2gain,
  freq2note,
  gain2db,
  KeyboardLayout,
  midi2note,
  noteOrFreq2freq,
  NOTES,
  arr2rms,
  FullKeyboard,
  type Note,
} from "./utils";
import { createDefaultSettings, MidiStatus, VisType } from "./constants";
import type { IPAType, Settings } from "./types";

type NotifyFn = () => void;

type SettingsSlice = ReturnType<typeof createSettingsSlice>;
type IPASlice = ReturnType<typeof createIPASlice>;
type MetricsSlice = ReturnType<typeof createMetricsSlice>;

interface Pitch {
  freq: number;
  note: Note;
  cents: number;
}

interface AnalyzerListener {
  onFrame: (data: MetricsSlice, analyzer: AnalyserNode) => void;
}

type HarmonicFrame = [number, number, number];
type MetricsDataArray = Float32Array | Uint8Array;

interface MetricsSliceState {
  source: string | undefined;
  rms: number;
  tilt: ReturnType<typeof logarithmic> | undefined;
  harmonics: HarmonicFrame[];
  compression: number;
  latency: number;
  sampleRate: number;
  frequencyBinCount: number;
  pitch: Pitch | undefined;
  readonly freqData: MetricsDataArray;
  readonly timeData: MetricsDataArray;
  reset: () => void;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function shouldProxy(value: unknown): value is Record<string, unknown> | unknown[] {
  return Array.isArray(value) || isPlainObject(value);
}

function createMutableProxy<T extends object>(target: T, notify: NotifyFn): T {
  const cache = new WeakMap<object, any>();

  const wrap = <V extends object>(value: V): V => {
    if (!shouldProxy(value)) return value;
    if (cache.has(value)) return cache.get(value);

    const proxy = new Proxy(value as Record<string | symbol, unknown>, {
      get(obj, prop, receiver) {
        const out = Reflect.get(obj, prop, receiver);
        if (shouldProxy(out)) return wrap(out as object);
        return out;
      },
      set(obj, prop, next, receiver) {
        const prev = Reflect.get(obj, prop, receiver);
        const result = Reflect.set(obj, prop, next, receiver);
        if (result && !Object.is(prev, next)) notify();
        return result;
      },
      deleteProperty(obj, prop) {
        const hadProp = Reflect.has(obj, prop);
        const result = Reflect.deleteProperty(obj, prop);
        if (hadProp && result) notify();
        return result;
      },
    });

    cache.set(value, proxy);
    return proxy as V;
  };

  return wrap(target);
}

function createSettingsSlice(notify: NotifyFn) {
  const settings = createMutableProxy<Settings>(createDefaultSettings(), notify);

  function reset() {
    const defaults = createDefaultSettings();
    for (const key of Object.keys(settings)) {
      delete (settings as Record<string, unknown>)[key];
    }
    Object.assign(settings, defaults);
  }

  return { settings, reset };
}

function createIPASlice(settingsSlice: SettingsSlice, notify: NotifyFn) {
  let ipa: IPAType = settingsSlice.settings.defaultIPA;

  const slice = createMutableProxy(
    {
      get ipa() {
        return ipa;
      },
      set ipa(next: IPAType) {
        ipa = next;
        notify();
      },
      get ipaSpec() {
        return settingsSlice.settings.formants.ipa[ipa];
      },
      reset() {
        ipa = settingsSlice.settings.defaultIPA;
        notify();
      },
    },
    notify,
  );

  return slice;
}

function createVisTypeSlice(settingsSlice: SettingsSlice, notify: NotifyFn) {
  let visType: VisType = settingsSlice.settings.defaultVisType;

  const slice = createMutableProxy(
    {
      get visType() {
        return visType;
      },
      set visType(next: VisType) {
        visType = next;
        notify();
      },
      reset() {
        visType = settingsSlice.settings.defaultVisType;
        notify();
      },
    },
    notify,
  );

  return slice;
}

function createKeyboardLayoutSlice(notify: NotifyFn) {
  const slice = createMutableProxy(
    {
      layout: FullKeyboard,
      keyboardWidth: 0,
      fullKeyWidth: 0,
    },
    notify,
  );

  const calcWindowWidth = () => (typeof window !== "undefined" ? window.innerWidth : 1000);

  function getKeyWidth(layout: InstanceType<typeof KeyboardLayout>) {
    return slice.keyboardWidth / layout.whiteKeys.length;
  }

  function recompute() {
    slice.keyboardWidth = calcWindowWidth() * 0.95;

    let bot = 0;
    let top = NOTES.length - 1;
    while (bot < top) {
      const layout = new KeyboardLayout(NOTES[bot], NOTES[top]);
      if (top - bot <= 36 || getKeyWidth(layout) > 20) {
        slice.layout = layout;
        slice.fullKeyWidth = getKeyWidth(layout);
        return;
      }
      bot += 1;
      top -= 1;
    }

    slice.layout = FullKeyboard;
    slice.fullKeyWidth = getKeyWidth(FullKeyboard);
  }

  recompute();

  if (typeof window !== "undefined") {
    window.addEventListener("resize", recompute);
  }

  return slice;
}

function createMetricsSlice(settingsSlice: SettingsSlice, notify: NotifyFn): MetricsSliceState {
  const slice: MetricsSliceState = createMutableProxy(
    {
      source: undefined as string | undefined,
      rms: 0.0,
      tilt: undefined as ReturnType<typeof logarithmic> | undefined,
      harmonics: [] as HarmonicFrame[],
      compression: 0.0,
      latency: 0.0,
      sampleRate: settingsSlice.settings.audioContextConfig.sampleRate,
      frequencyBinCount: 0,
      pitch: undefined as Pitch | undefined,
      get freqData(): MetricsDataArray {
        const DataArrayType = settingsSlice.settings.analyzer.useFloatData
          ? Float32Array
          : Uint8Array;
        return new DataArrayType(slice.frequencyBinCount) as MetricsDataArray;
      },
      get timeData(): MetricsDataArray {
        const DataArrayType = settingsSlice.settings.analyzer.useFloatData
          ? Float32Array
          : Uint8Array;
        return new DataArrayType(slice.frequencyBinCount) as MetricsDataArray;
      },
      reset() {
        slice.source = undefined;
        slice.rms = 0.0;
        slice.tilt = undefined;
        slice.harmonics = [];
        slice.compression = 0.0;
        slice.latency = 0.0;
        slice.sampleRate = settingsSlice.settings.audioContextConfig.sampleRate;
        slice.frequencyBinCount = 0;
        slice.pitch = undefined;
      },
    },
    notify,
  );

  return slice;
}

function createMidiSlice(notify: NotifyFn) {
  const slice = createMutableProxy(
    {
      midiInDeviceId: undefined as string | null | undefined,
      midiInChannel: undefined as number | null | undefined,
      midiIn: null as Input | null,
      status: MidiStatus.Disabled,
      getMidiIn() {
        if (!WebMidi.enabled) return null;

        if (WebMidi.inputs.length > 0) {
          const input = slice.midiInDeviceId
            ? WebMidi.getInputById(slice.midiInDeviceId)
            : WebMidi.inputs[0];

          if (input) return input;
        }

        return null;
      },
      async enable() {
        await WebMidi.enable();
        slice.midiIn = slice.getMidiIn();
        slice.status = WebMidi.enabled && slice.midiIn ? MidiStatus.Enabled : MidiStatus.Failed;
      },
      disable() {
        slice.midiIn?.removeListener();
      },
      addNoteOnListener(cb: (note: Note, velocity: number) => void) {
        slice.midiIn?.addListener(
          "noteon",
          (event: NoteMessageEvent) => {
            const name = midi2note(event.note.number);
            if (!name) return;
            cb(name, event.note.attack);
          },
          { channels: slice.midiInChannel ?? undefined },
        );
      },
      addNoteOffListener(cb: (note: Note) => void) {
        slice.midiIn?.addListener(
          "noteoff",
          (event: NoteMessageEvent) => {
            const name = midi2note(event.note.number);
            if (!name) return;
            cb(name);
          },
          { channels: slice.midiInChannel ?? undefined },
        );
      },
      reset() {
        slice.disable();
        slice.midiInDeviceId = undefined;
        slice.midiInChannel = undefined;
        slice.midiIn = null;
        slice.status = MidiStatus.Disabled;
      },
    },
    notify,
  );

  return slice;
}

function createPlayerSlice(
  settingsSlice: SettingsSlice,
  ipaSlice: IPASlice,
  metrics: MetricsSlice,
  notify: NotifyFn,
) {
  const playing: Record<number, (stopAnalysis: boolean) => void> = {};
  const analyzerListeners: Record<string, AnalyzerListener> = {};

  const audioContext = new AudioContext(settingsSlice.settings.audioContextConfig as any);
  const noise = createWhiteNoise(audioContext);
  noise.start(audioContext.currentTime);

  const compressor = new DynamicsCompressorNode(audioContext, settingsSlice.settings.compression);
  const analyzer = new AnalyserNode(audioContext, settingsSlice.settings.analyzer);
  const output = new GainNode(audioContext, { gain: 1 });

  let volume = 100.0;

  const slice = createMutableProxy(
    {
      get volume() {
        return volume;
      },
      set volume(next: number) {
        volume = next;
        output.gain.value = clamp(volume, 0.0, 100.0) / 100.0;
        notify();
      },
      output,
      rafId: undefined as number | undefined,
      analyzer,
      play(note: number | Note, velocity = 1.0) {
        const settings = settingsSlice.settings;
        const ctx = audioContext;
        const perfStartTime = ctx.currentTime;

        const frequency = noteOrFreq2freq(note);
        if (frequency > CAP_FREQ) return;

        const sourceType = settings.f0.sourceType as OscillatorType;
        const osc = new OscillatorNode(ctx, { frequency, type: sourceType });
        const oscGain = new GainNode(ctx, { gain: 0 });
        const noiseGain = new GainNode(ctx, { gain: 0 });
        metrics.source = sourceType;

        let source: AudioScheduledSourceNode;
        let sourceGain: GainNode;
        let mustControlSource = true;
        if (settings.f0.source === "noise") {
          source = noise;
          sourceGain = noiseGain;
          mustControlSource = false;
        } else {
          source = osc;
          sourceGain = oscGain;
        }

        source.connect(sourceGain);
        const isTonalSource = "frequency" in source;
        if (!settings.f0.on && isTonalSource) {
          (source as OscillatorNode).frequency.value = 0;
        }

        const harmonicsConfig = settings.harmonics;
        if (harmonicsConfig.on && isTonalSource) {
          const [harmonics, periodicWave] = createHarmonics(
            ctx,
            frequency,
            harmonicsConfig.max,
            harmonicsConfig.maxFreq,
            harmonicsConfig.tilt,
          );
          (source as OscillatorNode).setPeriodicWave(periodicWave);
          metrics.harmonics = harmonics.map(([freq, gain]) => [freq, gain, 0.0]);
        } else {
          metrics.harmonics = [[frequency, 1.0, 0.0]];
        }
        metrics.pitch = { freq: frequency, note: freq2note(frequency), cents: 0 };

        let flutterGain: GainNode | null = null;
        if (settings.flutter.on && isTonalSource) {
          flutterGain = new GainNode(ctx, { gain: settings.flutter.amount });
          noise.connect(flutterGain);
          flutterGain.connect((source as OscillatorNode).frequency);
        }

        let vibratoOsc: OscillatorNode | null = null;
        let vibratoGain: GainNode | null = null;
        let vibratoJitter: GainNode | null = null;
        if (settings.vibrato.on && isTonalSource) {
          vibratoOsc = new OscillatorNode(ctx, { frequency: settings.vibrato.rate });
          vibratoGain = new GainNode(ctx, { gain: 0 });
          vibratoOsc.connect(vibratoGain);
          vibratoGain.connect((source as OscillatorNode).frequency);

          if (settings.vibrato.jitter) {
            vibratoJitter = new GainNode(ctx, { gain: settings.vibrato.jitter });
            noise.connect(vibratoJitter);
            vibratoJitter.connect(vibratoOsc.frequency);
          }
        }

        const formantsGain = new GainNode(ctx, { gain: 1 });
        if (settings.formants.on) {
          const formants = createFormants(ctx, ipaSlice.ipaSpec);
          for (const formant of formants) {
            sourceGain.connect(formant);
            formant.connect(formantsGain);
          }
        } else {
          sourceGain.connect(formantsGain);
        }

        if (settings.compression.on) {
          formantsGain.connect(compressor);
          compressor.connect(output);
        } else {
          formantsGain.connect(output);
        }

        if (settings.analyzer.on) {
          output.connect(analyzer);
          slice.rafId ??= requestAnimationFrame(slice.analyze);
        }

        output.connect(ctx.destination);

        const t = ctx.currentTime + 0.002;
        if (mustControlSource) source.start(t);

        const f0Gain = velocity * settings.f0.keyGain;
        sourceGain.gain.linearRampToValueAtTime(f0Gain, t + settings.f0.onsetTime);
        if (vibratoOsc && vibratoGain) {
          vibratoOsc.start(t);
          vibratoGain.gain.linearRampToValueAtTime(
            settings.vibrato.extent,
            t + settings.vibrato.onsetTime,
          );
        }

        playing[frequency] = (stopAnalysis = false) => {
          const t2 = ctx.currentTime + 0.05;
          sourceGain.gain.setTargetAtTime(0, t2, settings.f0.decayTime);
          if (mustControlSource) source.stop(t2 + settings.f0.decayTime + 1);
          vibratoOsc?.stop(t2);

          if (stopAnalysis && slice.rafId !== undefined) {
            cancelAnimationFrame(slice.rafId);
            slice.rafId = undefined;
          }

          source = sourceGain = vibratoOsc = undefined as any;
          flutterGain = vibratoGain = vibratoJitter = null;
        };

        metrics.latency = ctx.currentTime - perfStartTime;
      },
      stop(note: number | Note, stopAnalysis = false) {
        const frequency = noteOrFreq2freq(note);
        playing[frequency]?.(stopAnalysis);
        delete playing[frequency];
      },
      addAnalyzerListener(id: string, listener: AnalyzerListener) {
        analyzerListeners[id] = listener;
        notify();
      },
      removeAnalyzerListener(id: string) {
        delete analyzerListeners[id];
        notify();
      },
      analyze() {
        const settings = settingsSlice.settings;
        metrics.compression = compressor.reduction;
        metrics.sampleRate = analyzer.context.sampleRate;
        metrics.frequencyBinCount = analyzer.frequencyBinCount;

        const timeData = metrics.timeData;
        const freqData = metrics.freqData;

        if (settings.analyzer.useFloatData) {
          analyzer.getFloatTimeDomainData(timeData as Float32Array);
          analyzer.getFloatFrequencyData(freqData as Float32Array);
          metrics.rms = gain2db(arr2rms([...freqData], 1.0));
        } else {
          analyzer.getByteTimeDomainData(timeData as Uint8Array);
          analyzer.getByteFrequencyData(freqData as Uint8Array);
          metrics.rms = gain2db(arr2rms([...freqData], 256.0));
        }

        metrics.harmonics.forEach((harmonic: HarmonicFrame) => {
          const [freq] = harmonic;
          const sliceWidth = metrics.sampleRate / 2 / metrics.frequencyBinCount;

          for (let i = 0; i < freqData.length; i += 1) {
            const value = freqData[i];
            const f1 = i * sliceWidth;
            const f2 = f1 + sliceWidth;
            if (freq >= f1 && freq < f2) {
              harmonic[2] = settings.analyzer.useFloatData ? db2gain(value) : value / 256.0;
            }
          }
        });

        metrics.tilt = regression.logarithmic(
          metrics.harmonics.map((harmonic: HarmonicFrame) => [harmonic[0], harmonic[2]]),
        );

        for (const listener of Object.values(analyzerListeners)) {
          listener.onFrame(metrics, analyzer);
        }

        slice.rafId = requestAnimationFrame(slice.analyze);
      },
      reset() {
        Object.keys(playing).forEach((key) => {
          const freq = Number(key);
          playing[freq]?.(true);
          delete playing[freq];
        });

        Object.keys(analyzerListeners).forEach((key) => {
          delete analyzerListeners[key];
        });

        slice.volume = 100.0;
        if (slice.rafId !== undefined) {
          cancelAnimationFrame(slice.rafId);
          slice.rafId = undefined;
        }
      },
    },
    notify,
  );

  output.gain.value = clamp(slice.volume, 0.0, 100.0) / 100.0;
  return slice;
}

function createAppStoreState(notify: NotifyFn) {
  const settings = createSettingsSlice(notify);
  const ipa = createIPASlice(settings, notify);
  const visType = createVisTypeSlice(settings, notify);
  const keyboardLayout = createKeyboardLayoutSlice(notify);
  const metrics = createMetricsSlice(settings, notify);
  const midi = createMidiSlice(notify);
  const player = createPlayerSlice(settings, ipa, metrics, notify);

  const state = createMutableProxy(
    {
      settings,
      ipa,
      visType,
      keyboardLayout,
      metrics,
      midi,
      player,
      resetAll() {
        player.reset();
        midi.reset();
        settings.reset();
        ipa.reset();
        visType.reset();
        metrics.reset();
        notify();
      },
    },
    notify,
  );

  return state;
}

type StoreState = ReturnType<typeof createAppStoreState> & { __version: number };
export type AppStore = ReturnType<typeof createAppStoreState>;

let enqueueNotify: NotifyFn = () => undefined;

const initialState = createAppStoreState(() => enqueueNotify());

export const appStore = createStore<StoreState>(() => ({
  ...initialState,
  __version: 0,
}));

let notifyQueued = false;
enqueueNotify = () => {
  if (notifyQueued) return;
  notifyQueued = true;
  queueMicrotask(() => {
    notifyQueued = false;
    appStore.setState((state) => ({ __version: state.__version + 1 }));
  });
};

export const useAppStore = () => appStore.getState() as AppStore;
