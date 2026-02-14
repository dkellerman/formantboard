import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { VisType } from "../constants";
import { ALL_IPA, COMMON_IPA, CONSONANTS, FRICATIVES, VOWELS } from "../hooks/useIPA";
import { useIPASlice, useMetrics, usePlayer, useSettings } from "../hooks/useStoreSlices";
import { F0Selector, type F0SelectorHandle } from "../components/F0Selector";
import { IPASelector } from "../components/IPASelector";
import { Keyboard, type KeyboardHandle } from "../components/Keyboard";
import { MicButton } from "../components/MicButton";
import { MidiButton } from "../components/MidiButton";
import { Visualizer } from "../components/Visualizer";
import { cn } from "../lib/cn";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";

const sources = [
  { title: "Tone", value: "osc" },
  { title: "Noise", value: "noise" },
];

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
  const metrics = useMetrics();
  const player = usePlayer();
  const ipaStore = useIPASlice();
  const settings = useSettings();

  const f0SelectorRef = useRef<F0SelectorHandle>(null);
  const keyboardRef = useRef<KeyboardHandle>(null);

  const [allEffects, setAllEffects] = useState(true);
  const [showHGains, setShowHGains] = useState(false);

  const sourceTypes = useMemo(
    () =>
      settings.f0.source === "osc"
        ? [
            { title: "Sine", value: "sine" },
            { title: "Sawtooth", value: "sawtooth" },
            { title: "Square", value: "square" },
          ]
        : [],
    [settings.f0.source],
  );

  const { flutter, harmonics, compression, formants, vibrato, f0 } = settings;

  function restartF0() {
    f0SelectorRef.current?.restartF0();
  }

  function toggleEffects(value: boolean) {
    setAllEffects(value);
    compression.on = value;
    harmonics.on = value;
    flutter.on = value;
    vibrato.on = value;
    formants.on = value;
    restartF0();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        f0SelectorRef.current?.toggleF0();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <section
      className={[
        "px-5 pb-8 text-xs",
        "[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]",
        "[&_.vui-switch-label]:text-xs [&_.vui-checkbox-label]:text-xs",
      ].join(" ")}
    >
      <fieldset className="border-0 pb-2">
        <div className="flex items-center gap-3 pr-8">
          <MidiButton keyboardRef={keyboardRef} text="MIDI" />
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
        <Keyboard ref={keyboardRef} onKeyOn={player.play} onKeyOff={player.stop} height={80} />
      </div>

      <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label className="min-w-[170px]">
          <SwitchControl
            label="F0"
            modelValue={f0.on}
            onChange={restartF0}
            onUpdateModelValue={(v) => {
              f0.on = v;
            }}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <F0Selector ref={f0SelectorRef} className="w-[150px]" />
          <NumberControl
            className="w-[150px]"
            label="Volume"
            modelValue={player.volume}
            max="100"
            onUpdateModelValue={(v) => {
              player.volume = Number(v);
            }}
          />
          <NumberControl
            className="w-[150px]"
            label="Key Gain"
            modelValue={f0.keyGain}
            max="1"
            step=".1"
            onUpdateModelValue={(v) => {
              f0.keyGain = Number(v);
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
              f0.onsetTime = Number(v);
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
              f0.decayTime = Number(v);
            }}
            onChange={restartF0}
          />
          <SelectControl
            className="w-[150px]"
            label="Source"
            modelValue={f0.source}
            items={sources}
            onUpdateModelValue={(v) => {
              f0.source = String(v);
              restartF0();
            }}
          />
          <SelectControl
            className="w-[150px]"
            label="Source Type"
            modelValue={f0.sourceType}
            items={sourceTypes}
            onUpdateModelValue={(v) => {
              f0.sourceType = String(v);
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

      <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label className="min-w-[170px]">
          <SwitchControl
            label="Harmonics"
            modelValue={harmonics.on}
            onUpdateModelValue={(v) => {
              harmonics.on = v;
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
              harmonics.max = Number(v);
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
              harmonics.maxFreq = Number(v);
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
              harmonics.tilt = Number(v);
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

      <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label className="min-w-[170px]">
          <SwitchControl
            label="Flutter"
            modelValue={flutter.on}
            onUpdateModelValue={(v) => {
              flutter.on = v;
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
              flutter.amount = Number(v);
            }}
            onChange={restartF0}
          />
        </div>
      </fieldset>

      <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label className="min-w-[170px]">
          <SwitchControl
            label="Vibrato"
            modelValue={vibrato.on}
            onUpdateModelValue={(v) => {
              vibrato.on = v;
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
              vibrato.rate = Number(v);
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
              vibrato.extent = Number(v);
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Jitter"
            modelValue={vibrato.jitter}
            step=".5"
            onUpdateModelValue={(v) => {
              vibrato.jitter = Number(v);
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
              vibrato.onsetTime = Number(v);
            }}
            onChange={restartF0}
          />
        </div>
      </fieldset>

      <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label className="min-w-[170px]">
          <SwitchControl
            label="Formants"
            modelValue={formants.on}
            onUpdateModelValue={(v) => {
              formants.on = v;
            }}
            onChange={restartF0}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <IPASelector className="w-[200px]" onChange={restartF0} ipaSet={ALL_IPA} />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={COMMON_IPA}
            title="Common"
          />
          <IPASelector className="w-[200px]" onChange={restartF0} ipaSet={VOWELS} title="Vowels" />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={CONSONANTS}
            title="Consonants"
          />
          <IPASelector
            className="w-[200px]"
            onChange={restartF0}
            ipaSet={FRICATIVES}
            title="Fricatives"
          />
        </div>
      </fieldset>

      {ipaStore.ipaSpec.map((formantSpec, idx) => (
        <div key={idx}>
          <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
            <label className="min-w-[170px]">
              <SwitchControl
                label={`F${idx + 1}`}
                modelValue={formantSpec.on}
                onUpdateModelValue={(value) => {
                  formantSpec.on = value;
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
                  formantSpec.frequency = Number(v);
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
                  formantSpec.Q = Number(v);
                }}
                onChange={restartF0}
              />
              <NumberControl
                className="w-[150px]"
                label="Gain"
                modelValue={formantSpec.gain}
                step=".1"
                onUpdateModelValue={(v) => {
                  formantSpec.gain = Number(v);
                }}
                onChange={restartF0}
              />
            </div>
          </fieldset>
        </div>
      ))}

      <fieldset className="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label className="min-w-[170px]">
          <SwitchControl
            label="Compression"
            modelValue={compression.on}
            onUpdateModelValue={(v) => {
              compression.on = v;
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
              compression.threshold = Number(v);
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Knee"
            modelValue={compression.knee}
            onUpdateModelValue={(v) => {
              compression.knee = Number(v);
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Ratio"
            modelValue={compression.ratio}
            onUpdateModelValue={(v) => {
              compression.ratio = Number(v);
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Attack"
            modelValue={compression.attack}
            onUpdateModelValue={(v) => {
              compression.attack = Number(v);
            }}
            onChange={restartF0}
          />
          <NumberControl
            className="w-[150px]"
            label="Release"
            modelValue={compression.release}
            onUpdateModelValue={(v) => {
              compression.release = Number(v);
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
