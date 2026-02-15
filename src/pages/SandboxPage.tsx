import { type ReactNode, useEffect, useState } from "react";
import { useAppContext } from "@/store";
import {
  ALL_IPA,
  COMMON_IPA,
  CONSONANTS,
  F0_OSC_SOURCE_TYPES,
  F0_SOURCE_OSC,
  F0_SOURCES,
  FRICATIVES,
  VOWELS,
  VisType,
} from "@/constants";
import { usePlayer } from "@/hooks/usePlayer";
import { F0Selector } from "@/components/F0Selector";
import { IPASelector } from "@/components/IPASelector";
import { Keyboard } from "@/components/Keyboard";
import { MicButton } from "@/components/MicButton";
import { MidiButton } from "@/components/MidiButton";
import { Visualizer } from "@/components/Visualizer";
import { cn } from "@/lib/cn";
import type { Formant } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { note2freq, type Note } from "@/utils";

interface NumberControlProps {
  className?: string;
  label?: ReactNode;
  modelValue?: string | number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  suffix?: string;
  readonly?: boolean;
  onChange?: (value: string | number) => void;
  onUpdateModelValue?: (value: string | number) => void;
}

function NumberControl({
  className,
  label,
  modelValue = "",
  min,
  max,
  step,
  suffix,
  readonly = false,
  onChange,
  onUpdateModelValue,
}: NumberControlProps) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      {label ? <Label className="text-xs font-normal text-zinc-500">{label}</Label> : null}
      <div className="flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-1">
        <Input
          className="h-full border-0 text-base shadow-none ring-0 focus-visible:ring-0"
          type="number"
          min={min}
          max={max}
          step={step}
          readOnly={readonly}
          value={modelValue}
          onInput={(event) => {
            const raw = (event.target as HTMLInputElement).value;
            const next = raw === "" ? raw : Number(raw);
            onUpdateModelValue?.(next);
          }}
          onChange={(event) => {
            const raw = event.target.value;
            const next = raw === "" ? raw : Number(raw);
            onChange?.(next);
          }}
        />
        {suffix ? <span className="text-sm text-zinc-700">{suffix}</span> : null}
      </div>
    </label>
  );
}

interface SwitchControlProps {
  className?: string;
  label: ReactNode;
  modelValue: boolean;
  onChange?: (value: boolean) => void;
  onUpdateModelValue?: (value: boolean) => void;
}

function SwitchControl({
  className,
  label,
  modelValue,
  onChange,
  onUpdateModelValue,
}: SwitchControlProps) {
  return (
    <label className={cn("inline-flex h-11 items-center gap-3", className)}>
      <Switch
        checked={modelValue}
        onCheckedChange={(checked) => {
          onUpdateModelValue?.(checked);
          onChange?.(checked);
        }}
      />
      <Label className="text-sm font-normal leading-none text-zinc-900">{label}</Label>
    </label>
  );
}

interface SelectControlItem {
  title: string;
  value: unknown;
}

interface SelectControlProps {
  className?: string;
  label?: ReactNode;
  modelValue?: unknown;
  items?: SelectControlItem[];
  onUpdateModelValue?: (value: unknown) => void;
}

function SelectControl({
  className,
  label,
  modelValue,
  items = [],
  onUpdateModelValue,
}: SelectControlProps) {
  const selectedIndex = items.findIndex((item) => Object.is(item.value, modelValue));
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      {label ? <Label className="text-xs font-normal text-zinc-500">{label}</Label> : null}
      <Select
        value={selectedIndex >= 0 ? String(selectedIndex) : undefined}
        onValueChange={(value) => onUpdateModelValue?.(items[Number(value)]?.value)}
      >
        <SelectTrigger className="h-11 text-base">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {items.map((item, idx) => (
            <SelectItem key={`${idx}-${item.title}`} value={String(idx)}>
              {item.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

interface CheckboxControlProps {
  label: ReactNode;
  modelValue: boolean;
  onUpdateModelValue?: (value: boolean) => void;
}

function CheckboxControl({ label, modelValue, onUpdateModelValue }: CheckboxControlProps) {
  return (
    <label className="inline-flex h-11 items-center gap-2">
      <Checkbox
        checked={modelValue}
        onCheckedChange={(value) => onUpdateModelValue?.(value === true)}
      />
      <Label className="text-sm font-normal leading-none text-zinc-900">{label}</Label>
    </label>
  );
}

export function SandboxPage() {
  const { metrics, settings, setSettings, ipa, setIPA, player: playerState } = useAppContext();
  const player = usePlayer();
  const ipaSpec = settings.formants.ipa[ipa];

  const [allEffects, setAllEffects] = useState(true);
  const [showHGains, setShowHGains] = useState(false);
  const [restartSignal, setRestartSignal] = useState(0);
  const [toggleSignal, setToggleSignal] = useState(0);
  const [midiNotes, setMidiNotes] = useState<Set<string>>(new Set());

  const sourceTypes: SelectControlItem[] =
    settings.f0.source === F0_SOURCE_OSC ? [...F0_OSC_SOURCE_TYPES] : [];

  const { flutter, harmonics, compression, formants, vibrato, f0 } = settings;

  function restartF0() {
    setRestartSignal((current) => current + 1);
  }

  function toggleF0() {
    setToggleSignal((current) => current + 1);
  }

  function noteId(note: Note) {
    return note.replace("#", "s");
  }

  function toggleEffects(value: boolean) {
    setAllEffects(value);
    setSettings((current) => ({
      ...current,
      compression: { ...current.compression, on: value },
      harmonics: { ...current.harmonics, on: value },
      flutter: { ...current.flutter, on: value },
      vibrato: { ...current.vibrato, on: value },
      formants: { ...current.formants, on: value },
    }));
    restartF0();
  }

  function setF0On(value: boolean) {
    setSettings((current) => ({ ...current, f0: { ...current.f0, on: value } }));
  }
  function setF0KeyGain(value: number) {
    setSettings((current) => ({ ...current, f0: { ...current.f0, keyGain: value } }));
  }
  function setF0OnsetTime(value: number) {
    setSettings((current) => ({ ...current, f0: { ...current.f0, onsetTime: value } }));
  }
  function setF0DecayTime(value: number) {
    setSettings((current) => ({ ...current, f0: { ...current.f0, decayTime: value } }));
  }
  function setF0Source(value: (typeof F0_SOURCES)[number]["value"]) {
    setSettings((current) => ({ ...current, f0: { ...current.f0, source: value } }));
  }
  function setF0SourceType(value: (typeof F0_OSC_SOURCE_TYPES)[number]["value"]) {
    setSettings((current) => ({ ...current, f0: { ...current.f0, sourceType: value } }));
  }
  function setHarmonicsOn(value: boolean) {
    setSettings((current) => ({ ...current, harmonics: { ...current.harmonics, on: value } }));
  }
  function setHarmonicsMax(value: number) {
    setSettings((current) => ({ ...current, harmonics: { ...current.harmonics, max: value } }));
  }
  function setHarmonicsMaxFreq(value: number) {
    setSettings((current) => ({ ...current, harmonics: { ...current.harmonics, maxFreq: value } }));
  }
  function setHarmonicsTilt(value: number) {
    setSettings((current) => ({ ...current, harmonics: { ...current.harmonics, tilt: value } }));
  }
  function setFlutterOn(value: boolean) {
    setSettings((current) => ({ ...current, flutter: { ...current.flutter, on: value } }));
  }
  function setFlutterAmount(value: number) {
    setSettings((current) => ({ ...current, flutter: { ...current.flutter, amount: value } }));
  }
  function setVibratoOn(value: boolean) {
    setSettings((current) => ({ ...current, vibrato: { ...current.vibrato, on: value } }));
  }
  function setVibratoRate(value: number) {
    setSettings((current) => ({ ...current, vibrato: { ...current.vibrato, rate: value } }));
  }
  function setVibratoExtent(value: number) {
    setSettings((current) => ({ ...current, vibrato: { ...current.vibrato, extent: value } }));
  }
  function setVibratoJitter(value: number) {
    setSettings((current) => ({ ...current, vibrato: { ...current.vibrato, jitter: value } }));
  }
  function setVibratoOnsetTime(value: number) {
    setSettings((current) => ({ ...current, vibrato: { ...current.vibrato, onsetTime: value } }));
  }
  function setFormantsOn(value: boolean) {
    setSettings((current) => ({ ...current, formants: { ...current.formants, on: value } }));
  }
  function setFormantEnabled(idx: number, value: boolean) {
    setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [ipa]: current.formants.ipa[ipa].map((formant, i) =>
            i === idx ? { ...formant, on: value } : formant,
          ),
        },
      },
    }));
  }
  function setFormantFrequency(idx: number, value: number) {
    setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [ipa]: current.formants.ipa[ipa].map((formant, i) =>
            i === idx ? { ...formant, frequency: value } : formant,
          ),
        },
      },
    }));
  }
  function setFormantQ(idx: number, value: number) {
    setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [ipa]: current.formants.ipa[ipa].map((formant, i) =>
            i === idx ? { ...formant, Q: value } : formant,
          ),
        },
      },
    }));
  }
  function setFormantGain(idx: number, value: number) {
    setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [ipa]: current.formants.ipa[ipa].map((formant, i) =>
            i === idx ? { ...formant, gain: value } : formant,
          ),
        },
      },
    }));
  }
  function setCompressionOn(value: boolean) {
    setSettings((current) => ({ ...current, compression: { ...current.compression, on: value } }));
  }
  function setCompressionThreshold(value: number) {
    setSettings((current) => ({
      ...current,
      compression: { ...current.compression, threshold: value },
    }));
  }
  function setCompressionKnee(value: number) {
    setSettings((current) => ({
      ...current,
      compression: { ...current.compression, knee: value },
    }));
  }
  function setCompressionRatio(value: number) {
    setSettings((current) => ({
      ...current,
      compression: { ...current.compression, ratio: value },
    }));
  }
  function setCompressionAttack(value: number) {
    setSettings((current) => ({
      ...current,
      compression: { ...current.compression, attack: value },
    }));
  }
  function setCompressionRelease(value: number) {
    setSettings((current) => ({
      ...current,
      compression: { ...current.compression, release: value },
    }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        toggleF0();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <section
      className={cn(
        "px-5 pb-8 text-xs",
        "[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]",
        "[&_.vui-switch-label]:text-xs [&_.vui-checkbox-label]:text-xs",
      )}
    >
      <fieldset className="border-0 pb-2">
        <div className="flex items-center gap-3 pr-8">
          <MidiButton
            text="MIDI"
            onNoteOn={(note, velocity) => {
              player.play(note2freq(note), velocity);
              setMidiNotes((prev) => new Set(prev).add(noteId(note)));
            }}
            onNoteOff={(note) => {
              player.stop(note2freq(note));
              setMidiNotes((prev) => {
                const next = new Set(prev);
                next.delete(noteId(note));
                return next;
              });
            }}
          />
          <MicButton />
          {metrics.pitch ? (
            <div className="ml-5 font-mono text-sm">
              Pitch: {metrics.pitch.freq.toFixed(1)}hz [{metrics.pitch.note}{" "}
              {metrics.pitch.cents > 0 ? "+" : ""}
              {metrics.pitch.cents}c]
            </div>
          ) : null}
        </div>
      </fieldset>

      <div className="mb-6 w-[95vw]">
        <Visualizer vtype={VisType.POWER} height={80} combined />
        <Keyboard
          activeNotes={midiNotes}
          onKeyOn={player.play}
          onKeyOff={player.stop}
          height={80}
        />
      </div>

      <fieldset
        className={cn(
          "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
          "py-3",
        )}
      >
        <label className="min-w-[170px]">
          <SwitchControl
            label="F0"
            modelValue={f0.on}
            onChange={restartF0}
            onUpdateModelValue={(v) => {
              setF0On(v);
            }}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <F0Selector
            className="w-[150px]"
            restartSignal={restartSignal}
            toggleSignal={toggleSignal}
          />
          <NumberControl
            className="w-[150px]"
            label="Volume"
            modelValue={playerState.volume}
            max="100"
            onUpdateModelValue={(v) => {
              player.setVolume(Number(v));
            }}
          />
          <NumberControl
            className="w-[150px]"
            label="Key Gain"
            modelValue={f0.keyGain}
            max="1"
            step=".1"
            onUpdateModelValue={(v) => {
              setF0KeyGain(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Onset time"
            modelValue={f0.onsetTime}
            suffix="s"
            step=".01"
            onUpdateModelValue={(v) => {
              setF0OnsetTime(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Decay time"
            modelValue={f0.decayTime}
            suffix="s"
            step=".01"
            onUpdateModelValue={(v) => {
              setF0DecayTime(Number(v));
            }}
            onChange={restartF0}
          />
          <SelectControl
            className="w-[150px]"
            label="Source"
            modelValue={f0.source}
            items={[...F0_SOURCES]}
            onUpdateModelValue={(v) => {
              setF0Source(v as (typeof F0_SOURCES)[number]["value"]);
              restartF0();
            }}
          />
          <SelectControl
            className="w-[150px]"
            label="Source Type"
            modelValue={f0.sourceType}
            items={sourceTypes}
            onUpdateModelValue={(v) => {
              setF0SourceType(v as (typeof F0_OSC_SOURCE_TYPES)[number]["value"]);
              restartF0();
            }}
          />
          <NumberControl
            className="w-[150px]"
            label="Latency"
            modelValue={metrics.latency}
            readonly
            suffix="s"
          />
          <NumberControl
            className="w-[150px] font-mono"
            label="RMS Vol"
            modelValue={metrics.rms}
            readonly
            suffix="dB"
          />
        </div>
      </fieldset>

      <fieldset className="border-0 p-0">
        <SwitchControl
          label="All effects"
          modelValue={allEffects}
          onChange={toggleEffects}
          onUpdateModelValue={toggleEffects}
        />
      </fieldset>

      <fieldset
        className={cn(
          "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
          "py-3",
        )}
      >
        <label className="min-w-[170px]">
          <SwitchControl
            label="Harmonics"
            modelValue={harmonics.on}
            onUpdateModelValue={(v) => {
              setHarmonicsOn(v);
            }}
            onChange={restartF0}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <NumberControl
            className="w-[150px]"
            label="Max num"
            modelValue={harmonics.max}
            onUpdateModelValue={(v) => {
              setHarmonicsMax(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Max freq"
            modelValue={harmonics.maxFreq}
            suffix="hz"
            step="50"
            onUpdateModelValue={(v) => {
              setHarmonicsMaxFreq(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px] [&_.vui-suffix]:text-zinc-500"
            label="Tilt"
            modelValue={harmonics.tilt}
            min="-40"
            max="12"
            suffix="dB/oct"
            step=".5"
            onUpdateModelValue={(v) => {
              setHarmonicsTilt(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Actual"
            modelValue={metrics.harmonics.length}
            readonly
          />
          <div className="flex h-11 items-center pt-4">
            <CheckboxControl
              label="Show gains"
              modelValue={showHGains}
              onUpdateModelValue={setShowHGains}
            />
          </div>
          {showHGains ? (
            <div className="basis-full overflow-auto bg-white pb-3 font-mono text-xs">
              {metrics.harmonics
                .slice(0, 40)
                .map(([, g]: [number, number, number], idx: number) => (
                  <span key={idx}>
                    [H{idx + 1}={g.toFixed(2)}]&nbsp;
                    {idx > 0 && idx % 6 === 0 ? <br /> : null}
                  </span>
                ))}
            </div>
          ) : null}
        </div>
      </fieldset>

      <fieldset
        className={cn(
          "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
          "py-3",
        )}
      >
        <label className="min-w-[170px]">
          <SwitchControl
            label="Flutter"
            modelValue={flutter.on}
            onUpdateModelValue={(v) => {
              setFlutterOn(v);
            }}
            onChange={restartF0}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <NumberControl
            className="w-[150px]"
            label="Amount"
            modelValue={flutter.amount}
            step=".5"
            onUpdateModelValue={(v) => {
              setFlutterAmount(Number(v));
            }}
            onChange={restartF0}
          />
        </div>
      </fieldset>

      <fieldset
        className={cn(
          "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
          "py-3",
        )}
      >
        <label className="min-w-[170px]">
          <SwitchControl
            label="Vibrato"
            modelValue={vibrato.on}
            onUpdateModelValue={(v) => {
              setVibratoOn(v);
            }}
            onChange={restartF0}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <NumberControl
            className="w-[150px]"
            label="Rate"
            modelValue={vibrato.rate}
            suffix="hz"
            step=".5"
            onUpdateModelValue={(v) => {
              setVibratoRate(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Extent"
            modelValue={vibrato.extent}
            suffix="hz"
            step=".5"
            onUpdateModelValue={(v) => {
              setVibratoExtent(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Jitter"
            modelValue={vibrato.jitter}
            step=".5"
            onUpdateModelValue={(v) => {
              setVibratoJitter(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Onset time"
            modelValue={vibrato.onsetTime}
            suffix="s"
            step=".1"
            onUpdateModelValue={(v) => {
              setVibratoOnsetTime(Number(v));
            }}
            onChange={restartF0}
          />
        </div>
      </fieldset>

      <fieldset
        className={cn(
          "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
          "py-3",
        )}
      >
        <label className="min-w-[170px]">
          <SwitchControl
            label="Formants"
            modelValue={formants.on}
            onUpdateModelValue={(v) => {
              setFormantsOn(v);
            }}
            onChange={restartF0}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={ALL_IPA}
            value={ipa}
            onSelect={setIPA}
          />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={COMMON_IPA}
            title="Common"
            value={ipa}
            onSelect={setIPA}
          />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={VOWELS}
            title="Vowels"
            value={ipa}
            onSelect={setIPA}
          />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={CONSONANTS}
            title="Consonants"
            value={ipa}
            onSelect={setIPA}
          />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={FRICATIVES}
            title="Fricatives"
            value={ipa}
            onSelect={setIPA}
          />
        </div>
      </fieldset>

      {ipaSpec.map((formantSpec: Formant, idx: number) => (
        <div key={idx}>
          <fieldset
            className={cn(
              "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
              "py-3",
            )}
          >
            <label className="min-w-[170px]">
              <SwitchControl
                label={`F${idx + 1}`}
                modelValue={formantSpec.on}
                onUpdateModelValue={(value) => {
                  setFormantEnabled(idx, value);
                }}
                onChange={restartF0}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <NumberControl
                className="w-[150px]"
                label="Freq"
                modelValue={formantSpec.frequency}
                suffix="hz"
                step="50"
                onUpdateModelValue={(v) => {
                  setFormantFrequency(idx, Number(v));
                }}
                onChange={restartF0}
              />
              <NumberControl
                className="w-[150px]"
                label="Q"
                modelValue={formantSpec.Q}
                max="1"
                step=".01"
                onUpdateModelValue={(v) => {
                  setFormantQ(idx, Number(v));
                }}
                onChange={restartF0}
              />
              <NumberControl
                className="w-[150px]"
                label="Gain"
                modelValue={formantSpec.gain}
                step=".1"
                onUpdateModelValue={(v) => {
                  setFormantGain(idx, Number(v));
                }}
                onChange={restartF0}
              />
            </div>
          </fieldset>
        </div>
      ))}

      <fieldset
        className={cn(
          "mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300",
          "py-3",
        )}
      >
        <label className="min-w-[170px]">
          <SwitchControl
            label="Compression"
            modelValue={compression.on}
            onUpdateModelValue={(v) => {
              setCompressionOn(v);
            }}
            onChange={restartF0}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <NumberControl
            className="w-[150px]"
            label="Treshold"
            modelValue={compression.threshold}
            onUpdateModelValue={(v) => {
              setCompressionThreshold(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Knee"
            modelValue={compression.knee}
            onUpdateModelValue={(v) => {
              setCompressionKnee(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Ratio"
            modelValue={compression.ratio}
            onUpdateModelValue={(v) => {
              setCompressionRatio(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Attack"
            modelValue={compression.attack}
            onUpdateModelValue={(v) => {
              setCompressionAttack(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Release"
            modelValue={compression.release}
            onUpdateModelValue={(v) => {
              setCompressionRelease(Number(v));
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Reduction"
            modelValue={metrics.compression}
            readonly
            suffix="dB"
          />
          <meter
            className="mt-2"
            max={20}
            optimum={0}
            low={0}
            high={1}
            value={Math.abs(metrics.compression)}
          />
        </div>
      </fieldset>
    </section>
  );
}
