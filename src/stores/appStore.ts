/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStore } from 'zustand/vanilla';
import { logarithmic } from 'regression';
import regression from 'regression';
import { Input, WebMidi, type NoteMessageEvent } from 'webmidi';
import { arr2rms, type Note } from '../utils';
import type { IPAType } from './ipaEnum';
import { MidiStatus } from './midiTypes';
import { createDefaultSettings, type Settings } from './settingsDefaults';
import { VisType } from './visTypes';

type SettingsSlice = ReturnType<typeof createSettingsSlice>;
type IPASlice = ReturnType<typeof createIPASlice>;
type VisTypeSlice = ReturnType<typeof createVisTypeSlice>;
type KeyboardLayoutSlice = ReturnType<typeof createKeyboardLayoutSlice>;
type MetricsSlice = ReturnType<typeof createMetricsSlice>;
type MidiSlice = ReturnType<typeof createMidiSlice>;
type PlayerSlice = ReturnType<typeof createPlayerSlice>;

interface Pitch {
  freq: number;
  note: Note;
  cents: number;
}

interface AnalyzerListener {
  onFrame: (data: MetricsSlice, analyzer: AnalyserNode) => void;
}

function createSettingsSlice() {
  const settings = ref<Settings>(createDefaultSettings());

  function reset() {
    settings.value = createDefaultSettings();
  }

  return reactive({ settings, reset });
}

function createIPASlice(settingsSlice: SettingsSlice) {
  const ipa = ref<IPAType>(settingsSlice.settings.defaultIPA);
  const ipaSpec = computed(() => settingsSlice.settings.formants.ipa[ipa.value]);

  function reset() {
    ipa.value = settingsSlice.settings.defaultIPA;
  }

  return reactive({ ipa, ipaSpec, reset });
}

function createVisTypeSlice(settingsSlice: SettingsSlice) {
  const visType = ref<VisType>(settingsSlice.settings.defaultVisType);

  function reset() {
    visType.value = settingsSlice.settings.defaultVisType;
  }

  return reactive({ visType, reset });
}

function createKeyboardLayoutSlice() {
  const { width: winWidth } = useWindowSize();
  const keyboardWidth = computed(() => winWidth.value * 0.95);

  const layout = computed<InstanceType<typeof KeyboardLayout>>(() => {
    let bot = 0, top = NOTES.length - 1;
    while (bot < top) {
      const l = new KeyboardLayout(NOTES[bot], NOTES[top]);
      if (top - bot <= 36 || getKeyWidth(l) > 20) return l;
      bot += 1;
      top -= 1;
    }
    return FullKeyboard;
  });
  const fullKeyWidth = computed(() => getKeyWidth(layout.value));

  function getKeyWidth(l: InstanceType<typeof KeyboardLayout>) {
    return keyboardWidth.value / l.whiteKeys.length;
  }

  return reactive({ layout, keyboardWidth, fullKeyWidth });
}

function createMetricsSlice(settingsSlice: SettingsSlice) {
  const source = ref<string>();
  const rms = ref(0.0);
  const tilt = ref<ReturnType<typeof logarithmic>>();
  const harmonics = ref<[number, number, number][]>([]);
  const compression = ref(0.0);
  const latency = ref(0.0);
  const sampleRate = ref<number>(settingsSlice.settings.audioContextConfig.sampleRate);
  const frequencyBinCount = ref<number>(0);
  const pitch = ref<Pitch>();
  const DataArrayType = computed(() => settingsSlice.settings.analyzer.useFloatData ? Float32Array : Uint8Array);
  const freqData = computed<Float32Array | Uint8Array>(() => new DataArrayType.value(frequencyBinCount.value));
  const timeData = computed<Float32Array | Uint8Array>(() => new DataArrayType.value(frequencyBinCount.value));

  function reset() {
    source.value = undefined;
    rms.value = 0.0;
    tilt.value = undefined;
    harmonics.value = [];
    compression.value = 0.0;
    latency.value = 0.0;
    sampleRate.value = settingsSlice.settings.audioContextConfig.sampleRate;
    frequencyBinCount.value = 0;
    pitch.value = undefined;
  }

  return reactive({
    source,
    rms,
    tilt,
    harmonics,
    compression,
    latency,
    pitch,
    frequencyBinCount,
    sampleRate,
    freqData,
    timeData,
    reset,
  });
}

function createMidiSlice() {
  const midiInDeviceId = ref<string | null>();
  const midiInChannel = ref<number | null>();
  const midiIn = ref<Input | null>();
  const status = ref(MidiStatus.Disabled);

  function getMidiIn(): Input | null {
    if (!WebMidi.enabled) return null;

    if (WebMidi.inputs.length > 0) {
      const input = midiInDeviceId.value
        ? WebMidi.getInputById(midiInDeviceId.value)
        : WebMidi.inputs[0];
      console.log('using midi input', input.name);

      return input;
    }

    console.log('no midi inputs');
    return null;
  }

  async function enable() {
    await WebMidi.enable();
    console.log('midi', WebMidi.inputs);
    midiIn.value = getMidiIn();
    status.value = WebMidi.enabled && midiIn.value ? MidiStatus.Enabled : MidiStatus.Failed;
  }

  function disable() {
    midiIn.value?.removeListener();
  }

  function addNoteOnListener(cb: (note: Note, velocity: number) => void) {
    midiIn.value?.addListener('noteon', (e: NoteMessageEvent) => {
      const name = midi2note(e.note.number);
      if (!name) return;
      cb(name, e.note.attack);
    }, { channels: midiInChannel.value ?? undefined });
  }

  function addNoteOffListener(cb: (note: Note) => void) {
    midiIn.value?.addListener('noteoff', (e: NoteMessageEvent) => {
      const name = midi2note(e.note.number);
      if (!name) return;
      cb(name);
    }, { channels: midiInChannel.value ?? undefined });
  }

  function reset() {
    disable();
    midiInDeviceId.value = undefined;
    midiInChannel.value = undefined;
    midiIn.value = null;
    status.value = MidiStatus.Disabled;
  }

  return reactive({
    enable,
    disable,
    status,
    addNoteOnListener,
    addNoteOffListener,
    reset,
  });
}

function createPlayerSlice(settingsSlice: SettingsSlice, ipaSlice: IPASlice, metrics: MetricsSlice) {
  const playing: Record<number, (stopAnalysis: boolean) => void> = {};
  const volume = ref(100.0);
  const audioContext = computed(() => new AudioContext(settingsSlice.settings.audioContextConfig));
  const noise = computed(() => {
    const n = createWhiteNoise(audioContext.value);
    n.start(audioContext.value.currentTime);
    return n;
  });
  const compressor = computed(() => new DynamicsCompressorNode(audioContext.value, settingsSlice.settings.compression));
  const analyzer = computed(() => new AnalyserNode(audioContext.value, settingsSlice.settings.analyzer));
  const analyzerListeners = ref<Record<string, AnalyzerListener>>({});
  const output = ref(new GainNode(audioContext.value, { gain: volume.value / 100.0 }));
  const rafId = ref<number>();

  watch(() => volume.value, () => {
    output.value.gain.value = clamp(volume.value, 0.0, 100.0) / 100.0;
  });

  function play(note: number | Note, velocity = 1.0) {
    const settings = settingsSlice.settings;
    const ctx = audioContext.value;
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
    if (settings.f0.source === 'noise')
      [source, sourceGain, mustControlSource] = [noise.value, noiseGain, false];
    else
      [source, sourceGain] = [osc, oscGain, true];
    source.connect(sourceGain);
    const isTonalSource = 'frequency' in source;
    if (!settings.f0.on && isTonalSource) (source as OscillatorNode).frequency.value = 0;

    const h = settings.harmonics;
    if (h.on && isTonalSource) {
      const [harmonics, periodicWave] = createHarmonics(ctx, frequency, h.max, h.maxFreq, h.tilt);
      (source as OscillatorNode).setPeriodicWave(periodicWave);
      metrics.harmonics = harmonics.map(([freq, gain]) => [freq, gain, 0.0]);
    } else {
      metrics.harmonics = [[frequency, 1.0, 0.0]];
    }
    metrics.pitch = { freq: frequency, note: freq2note(frequency), cents: 0 };

    let flutterGain: GainNode | null = null;
    if (settings.flutter.on && isTonalSource) {
      flutterGain = new GainNode(ctx, { gain: settings.flutter.amount });
      noise.value.connect(flutterGain);
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
        noise.value.connect(vibratoJitter);
        vibratoJitter.connect(vibratoOsc.frequency);
      }
    }

    let formants: BiquadFilterNode[];
    const formantsGain: GainNode = new GainNode(ctx, { gain: 1 });
    if (settings.formants.on) {
      formants = createFormants(ctx, ipaSlice.ipaSpec);
      for (const formant of formants) {
        sourceGain.connect(formant);
        formant.connect(formantsGain);
      }
    } else {
      sourceGain.connect(formantsGain);
    }

    if (settings.compression.on) {
      formantsGain.connect(compressor.value);
      compressor.value.connect(output.value);
    } else {
      formantsGain.connect(output.value);
    }

    if (settings.analyzer.on) {
      output.value.connect(analyzer.value);
      rafId.value ??= requestAnimationFrame(analyze);
    }

    output.value.connect(ctx.destination);

    const t = ctx.currentTime + 0.002;
    if (mustControlSource) source.start(t);

    const keyGain = velocity * settings.f0.keyGain;
    sourceGain.gain.linearRampToValueAtTime(keyGain, t + settings.f0.onsetTime);
    if (vibratoOsc && vibratoGain) {
      vibratoOsc.start(t);
      vibratoGain.gain.linearRampToValueAtTime(settings.vibrato.extent, t + settings.vibrato.onsetTime);
    }

    playing[frequency] = (stopAnalysis = false) => {
      const t2 = ctx.currentTime + 0.05;
      sourceGain.gain.setTargetAtTime(0, t2, settings.f0.decayTime);
      if (mustControlSource) source.stop(t2 + settings.f0.decayTime + 1);
      vibratoOsc?.stop(t2);
      if (stopAnalysis && rafId.value) {
        cancelAnimationFrame(rafId.value);
        rafId.value = undefined;
      }
      source = sourceGain = vibratoOsc = undefined as any;
    };

    metrics.latency = ctx.currentTime - perfStartTime;
  }

  function stop(note: number | Note, stopAnalysis = false) {
    const frequency = noteOrFreq2freq(note);
    playing[frequency]?.(stopAnalysis);
    delete playing[frequency];
  }

  function addAnalyzerListener(id: string, listener: AnalyzerListener) {
    analyzerListeners.value[id] = listener;
  }

  function removeAnalyzerListener(id: string) {
    delete analyzerListeners.value[id];
  }

  function analyze() {
    const settings = settingsSlice.settings;
    metrics.compression = compressor.value.reduction;
    metrics.sampleRate = analyzer.value.context.sampleRate;
    metrics.frequencyBinCount = analyzer.value.frequencyBinCount;

    if (settings.analyzer.useFloatData) {
      analyzer.value.getFloatTimeDomainData(metrics.timeData as Float32Array);
      analyzer.value.getFloatFrequencyData(metrics.freqData as Float32Array);
      metrics.rms = gain2db(arr2rms([...metrics.freqData], 1.0));
    } else {
      analyzer.value.getByteTimeDomainData(metrics.timeData as Uint8Array);
      analyzer.value.getByteFrequencyData(metrics.freqData as Uint8Array);
      metrics.rms = gain2db(arr2rms([...metrics.freqData], 256.0));
    }

    metrics.harmonics.forEach(h => {
      const [f] = h;
      const sliceWidth = (metrics.sampleRate / 2) / metrics.frequencyBinCount;
      metrics.freqData.forEach((v, i) => {
        const f1 = i * sliceWidth;
        const f2 = f1 + sliceWidth;
        if (f >= f1 && f < f2) {
          h[2] = settings.analyzer.useFloatData ? db2gain(v) : v / 256.0;
        }
      });
    });

    metrics.tilt = regression.logarithmic(metrics.harmonics.map(h => [h[0], h[2]]));

    for (const listener of Object.values(analyzerListeners.value)) {
      listener.onFrame(metrics, analyzer.value);
    }
    rafId.value = requestAnimationFrame(analyze);
  }

  function reset() {
    Object.keys(playing).forEach((k) => {
      playing[Number(k)]?.(true);
      delete playing[Number(k)];
    });
    analyzerListeners.value = {};
    volume.value = 100.0;
    if (rafId.value) {
      cancelAnimationFrame(rafId.value);
      rafId.value = undefined;
    }
  }

  return reactive({
    play,
    stop,
    output,
    rafId,
    addAnalyzerListener,
    removeAnalyzerListener,
    analyze,
    analyzer,
    volume,
    reset,
  });
}

function createAppStoreState() {
  const settings = createSettingsSlice();
  const ipa = createIPASlice(settings);
  const visType = createVisTypeSlice(settings);
  const keyboardLayout = createKeyboardLayoutSlice();
  const metrics = createMetricsSlice(settings);
  const midi = createMidiSlice();
  const player = createPlayerSlice(settings, ipa, metrics);

  function resetAll() {
    player.reset();
    midi.reset();
    settings.reset();
    ipa.reset();
    visType.reset();
    metrics.reset();
  }

  return reactive({
    settings,
    ipa,
    visType,
    keyboardLayout,
    metrics,
    midi,
    player,
    resetAll,
  });
}

export type AppStore = ReturnType<typeof createAppStoreState>;

const appStore = createStore<AppStore>(() => createAppStoreState());

export const useAppStore = () => appStore.getState();
