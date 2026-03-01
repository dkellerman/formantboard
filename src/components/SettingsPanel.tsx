import { useState } from "react";
import { SquareArrowOutUpRight, X } from "lucide-react";
import { useAppContext } from "@/store";
import { DEFAULT_FORMANT_CASCADE_PCT, VIS_TYPES, type VisType } from "@/constants";
import { cn } from "@/lib/cn";
import type { Formant, Vibrato } from "@/types";
import { formantRange } from "@/utils";
import { F0Selector } from "@/components/F0Selector";
import { IPASelector } from "@/components/IPASelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface SettingsPanelProps {
  className?: string;
  visType: VisType;
  onVisTypeChange: (value: VisType) => void;
}

export function SettingsPanel({ className, visType, onVisTypeChange }: SettingsPanelProps) {
  const { settings, setSettings, ipa, setIPA } = useAppContext();
  const [restartSignal, setRestartSignal] = useState(0);
  const [formantPopoverOpen, setFormantPopoverOpen] = useState(false);
  const [vibratoPopoverOpen, setVibratoPopoverOpen] = useState(false);
  const ipaSpec = settings.formants.ipa[ipa];
  const cascadePctDefault = Math.max(
    0,
    Math.min(1, settings.formants.cascadePctDefault ?? DEFAULT_FORMANT_CASCADE_PCT),
  );
  const cascadePctMultiplierForIPA = Math.max(0, settings.formants.cascadePctByIPA?.[ipa] ?? 1);
  const cascadePctForIPA = Math.max(0, Math.min(1, cascadePctDefault * cascadePctMultiplierForIPA));
  const hasCascadePctOverride = Object.prototype.hasOwnProperty.call(
    settings.formants.cascadePctByIPA ?? {},
    ipa,
  );
  const vibrato = settings.vibrato;

  function restartF0() {
    setRestartSignal((current) => current + 1);
  }

  const formantButtons = (() => {
    const selected: string[] = [];
    ipaSpec.forEach((formant: Formant, idx: number) => {
      if (formant.on) selected.push(String(idx));
    });
    return selected;
  })();

  function updateFormants(btns: string[]) {
    const selected = new Set(btns.map((value) => Number(value)));
    setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [ipa]: current.formants.ipa[ipa].map((formant, idx) => ({
            ...formant,
            on: selected.has(idx),
          })),
        },
      },
    }));
    restartF0();
  }

  function updateTemporaryFormant(index: number, patch: Partial<Formant>) {
    setSettings((current) => ({
      ...current,
      formants: {
        ...current.formants,
        ipa: {
          ...current.formants.ipa,
          [ipa]: current.formants.ipa[ipa].map((formant, idx) =>
            idx === index ? { ...formant, ...patch } : formant,
          ),
        },
      },
    }));
    restartF0();
  }

  function normalizeCascadePct(value: number) {
    const next = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(1, next));
  }

  function normalizeCascadeMultiplier(value: number) {
    const next = Number.isFinite(value) ? value : 1;
    return Math.max(0, Math.min(4, next));
  }

  function updateFormantCascadePct(value: number) {
    setSettings((current) => ({
      ...current,
      formants: (() => {
        const cascadePctDefaultCurrent = Math.max(
          0,
          Math.min(1, current.formants.cascadePctDefault ?? DEFAULT_FORMANT_CASCADE_PCT),
        );
        const nextPct = normalizeCascadePct(value);
        const nextMultiplier =
          cascadePctDefaultCurrent <= 0
            ? 1
            : normalizeCascadeMultiplier(nextPct / cascadePctDefaultCurrent);
        const nextByIPA = { ...(current.formants.cascadePctByIPA ?? {}) };
        if (Math.abs(nextMultiplier - 1) < 1e-6) {
          delete nextByIPA[ipa];
        } else {
          nextByIPA[ipa] = nextMultiplier;
        }
        return {
          ...current.formants,
          cascadePctByIPA: nextByIPA,
        };
      })(),
    }));
    restartF0();
  }

  function patchVibrato(patch: Partial<Vibrato>) {
    setSettings((current) => ({
      ...current,
      vibrato: {
        ...current.vibrato,
        ...patch,
      },
    }));
  }

  function commitVibrato(patch: Partial<Vibrato>) {
    patchVibrato(patch);
    restartF0();
  }

  return (
    <section
      className={cn(
        "mb-5 flex w-full flex-row flex-wrap items-start gap-2 sm:gap-3",
        "[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]",
        "[&_.vui-field]:min-w-0",
        "[&_.vui-btn]:text-sm",
        className,
      )}
    >
      <F0Selector className={cn("w-[140px] sm:w-[150px]")} restartSignal={restartSignal} />

      <div className={cn("inline-flex min-w-0 flex-col gap-1")}>
        <div className="flex items-center gap-1">
          <Label className={cn("text-xs font-normal text-zinc-500")}>Formants</Label>
          <Popover modal={false} open={formantPopoverOpen} onOpenChange={setFormantPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-4 w-4 items-center justify-center rounded",
                  "text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1",
                  "focus-visible:ring-zinc-950",
                )}
                aria-label="Open formant controls"
                title="Open formant controls"
              >
                <SquareArrowOutUpRight className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[220px] p-1.5"
              onInteractOutside={(event) => event.preventDefault()}
            >
              <header className="mb-1.5 flex items-center justify-between gap-1 border-b border-zinc-200 pb-1">
                <h3 className="text-xs font-semibold text-zinc-900">Formants</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-zinc-500"
                  onClick={() => setFormantPopoverOpen(false)}
                  aria-label="Close formant controls"
                >
                  <X className="size-3" />
                </Button>
              </header>

              <div className="grid gap-1">
                {ipaSpec.map((formant, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[24px_40px_minmax(0,1fr)_16px] items-center gap-1 rounded border border-zinc-200 px-1 py-1"
                  >
                    <div className="text-[11px] font-medium text-zinc-900">F{idx + 1}</div>
                    <button
                      type="button"
                      className={cn(
                        "rounded border px-1 py-0.5 text-[10px] leading-none",
                        formant.on
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
                      )}
                      onClick={() => updateTemporaryFormant(idx, { on: !formant.on })}
                    >
                      {formant.on ? "On" : "Off"}
                    </button>
                    <Input
                      className="h-6 px-1 text-xs"
                      type="number"
                      step={10}
                      min={50}
                      max={5000}
                      value={Number.isFinite(formant.frequency) ? formant.frequency : 0}
                      onInput={(event) => {
                        const next = Number((event.target as HTMLInputElement).value);
                        if (!Number.isFinite(next)) return;
                        updateTemporaryFormant(idx, { frequency: next });
                      }}
                    />
                    <div className="text-[10px] text-zinc-500">Hz</div>
                  </div>
                ))}

                <label className="grid grid-cols-[52px_minmax(0,1fr)_42px_12px] items-center gap-1 rounded border border-zinc-200 px-1 py-1">
                  <span className="flex flex-col leading-none">
                    <span className="text-[11px] text-zinc-500">Cascade</span>
                    <span className="text-[9px] text-zinc-400">
                      {hasCascadePctOverride ? "IPA" : "Default"}
                    </span>
                  </span>
                  <input
                    className="h-2 w-full accent-zinc-900"
                    type="range"
                    step={1}
                    min={0}
                    max={100}
                    value={Math.round(cascadePctForIPA * 100)}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      updateFormantCascadePct(next / 100);
                    }}
                  />
                  <Input
                    className="h-6 px-1 text-right text-xs"
                    type="number"
                    step={1}
                    min={0}
                    max={100}
                    value={Math.round(cascadePctForIPA * 100)}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      updateFormantCascadePct(next / 100);
                    }}
                  />
                  <span className="text-[10px] text-zinc-500">%</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <ToggleGroup
          className={cn(
            "h-11 w-[140px] gap-0 rounded-md border border-zinc-300",
            "bg-zinc-200 sm:w-[150px]",
          )}
          type="multiple"
          value={formantButtons}
          onValueChange={updateFormants}
        >
          {ipaSpec.map((formant: Formant, idx: number) => {
            return (
              <div key={idx} className={cn("group relative flex h-full flex-1")}>
                <ToggleGroupItem
                  value={String(idx)}
                  variant="outline"
                  size="default"
                  title={
                    "Formant F" +
                    (idx + 1) +
                    " [" +
                    (formant.on ? "ON" : "OFF") +
                    "] " +
                    formantRange(formant).join("-") +
                    "hz"
                  }
                  aria-label={
                    "Formant F" +
                    (idx + 1) +
                    " [" +
                    (formant.on ? "ON" : "OFF") +
                    "] " +
                    formantRange(formant).join("-") +
                    "hz"
                  }
                  className={cn(
                    "h-full w-full rounded-none border-0",
                    idx === 0 ? "border-l-0" : "border-l border-zinc-300",
                    "px-0 py-0 text-base font-normal leading-none",
                    "bg-zinc-200 text-zinc-900 hover:bg-zinc-300",
                    "data-[state=on]:bg-white data-[state=on]:text-zinc-900",
                    "data-[state=on]:hover:bg-white",
                  )}
                >
                  F{idx + 1}
                </ToggleGroupItem>
                <div
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-full z-[70]",
                    "mt-1 hidden -translate-x-1/2",
                    "whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg",
                    "group-hover:block",
                  )}
                >
                  <div>
                    Formant F{idx + 1} [{formant.on ? "ON" : "OFF"}]
                  </div>
                  <div>{formantRange(formant).join("-")}hz</div>
                </div>
              </div>
            );
          })}
        </ToggleGroup>
      </div>

      <IPASelector
        className={cn("w-[200px] max-w-full sm:w-[220px]")}
        value={ipa}
        onSelect={setIPA}
        onChange={restartF0}
      />

      <label className={cn("flex w-[136px] max-w-full min-w-0 flex-col gap-1")}>
        <Label className={cn("text-xs font-normal text-zinc-500")}>Tilt</Label>
        <div className={cn("flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-1")}>
          <Input
            className={cn("h-full border-0 shadow-none ring-0 focus-visible:ring-0")}
            type="number"
            min={-20.0}
            max={0.0}
            value={settings.harmonics.tilt}
            onInput={(event) => {
              const value = Number((event.target as HTMLInputElement).value);
              setSettings((current) => ({
                ...current,
                harmonics: { ...current.harmonics, tilt: value },
              }));
            }}
            onChange={restartF0}
          />
          <span className={cn("px-1 text-sm text-zinc-500")}>dB/oct</span>
        </div>
      </label>

      <div className={cn("flex w-[150px] max-w-full min-w-0 flex-col gap-1")}>
        <div className="flex min-h-4 items-center gap-1">
          <Switch
            checked={vibrato.on}
            onCheckedChange={(value) => commitVibrato({ on: value })}
            className={cn(
              "h-4 w-7 shrink-0",
              "[&>span]:h-3 [&>span]:w-3",
              "data-[state=checked]:[&>span]:translate-x-3",
              "data-[state=checked]:bg-zinc-900 data-[state=unchecked]:bg-zinc-300",
            )}
            aria-label="Toggle vibrato"
          />
          <Popover modal={false} open={vibratoPopoverOpen} onOpenChange={setVibratoPopoverOpen}>
            <Label className={cn("text-xs font-normal text-zinc-500")}>Vibrato</Label>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-4 w-4 items-center justify-center rounded",
                  "text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1",
                  "focus-visible:ring-zinc-950",
                )}
                aria-label="Open vibrato controls"
                title="Open vibrato controls"
              >
                <SquareArrowOutUpRight className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[220px] p-1.5"
              onInteractOutside={(event) => event.preventDefault()}
            >
              <header className="mb-1.5 flex items-center justify-between gap-1 border-b border-zinc-200 pb-1">
                <h3 className="text-xs font-semibold text-zinc-900">Vibrato</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-zinc-500"
                  onClick={() => setVibratoPopoverOpen(false)}
                  aria-label="Close vibrato controls"
                >
                  <X className="size-3" />
                </Button>
              </header>

              <div className="grid gap-1">
                <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-1 rounded border border-zinc-200 px-1 py-1">
                  <span className="text-[11px] text-zinc-500">On</span>
                  <button
                    type="button"
                    className={cn(
                      "rounded border px-1 py-0.5 text-[10px] leading-none",
                      vibrato.on
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
                    )}
                    onClick={() => commitVibrato({ on: !vibrato.on })}
                  >
                    {vibrato.on ? "On" : "Off"}
                  </button>
                </div>

                <label className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-zinc-200 px-1 py-1">
                  <span className="text-[11px] text-zinc-500">Rate</span>
                  <input
                    className="h-2 w-full accent-zinc-900"
                    type="range"
                    step={0.1}
                    min={0}
                    max={20}
                    value={vibrato.rate}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ rate: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className="h-6 px-1 text-right text-xs"
                    type="number"
                    step={0.1}
                    min={0}
                    max={20}
                    value={vibrato.rate}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ rate: next });
                    }}
                    onChange={restartF0}
                  />
                </label>

                <label className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-zinc-200 px-1 py-1">
                  <span className="text-[11px] text-zinc-500">Extent</span>
                  <input
                    className="h-2 w-full accent-zinc-900"
                    type="range"
                    step={0.1}
                    min={0}
                    max={20}
                    value={vibrato.extent}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ extent: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className="h-6 px-1 text-right text-xs"
                    type="number"
                    step={0.1}
                    min={0}
                    max={20}
                    value={vibrato.extent}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ extent: next });
                    }}
                    onChange={restartF0}
                  />
                </label>

                <label className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-zinc-200 px-1 py-1">
                  <span className="text-[11px] text-zinc-500">Jitter</span>
                  <input
                    className="h-2 w-full accent-zinc-900"
                    type="range"
                    step={0.1}
                    min={0}
                    max={20}
                    value={vibrato.jitter}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ jitter: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className="h-6 px-1 text-right text-xs"
                    type="number"
                    step={0.1}
                    min={0}
                    max={20}
                    value={vibrato.jitter}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ jitter: next });
                    }}
                    onChange={restartF0}
                  />
                </label>

                <label className="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-zinc-200 px-1 py-1">
                  <span className="text-[11px] text-zinc-500">Onset</span>
                  <input
                    className="h-2 w-full accent-zinc-900"
                    type="range"
                    step={0.1}
                    min={0}
                    max={8}
                    value={vibrato.onsetTime}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ onsetTime: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className="h-6 px-1 text-right text-xs"
                    type="number"
                    step={0.1}
                    min={0}
                    max={8}
                    value={vibrato.onsetTime}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ onsetTime: next });
                    }}
                    onChange={restartF0}
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className={cn("flex h-11 items-center gap-1 rounded-md border border-zinc-300 px-2")}>
          <span className="text-[11px] text-zinc-500">Rate</span>
          <input
            className="h-2 w-full accent-zinc-900"
            type="range"
            min={0}
            max={20}
            step={0.1}
            value={vibrato.rate}
            onInput={(event) => {
              const next = Number((event.target as HTMLInputElement).value);
              if (!Number.isFinite(next)) return;
              patchVibrato({ rate: next });
            }}
            onChange={restartF0}
          />
          <span className="w-8 text-right text-[11px] text-zinc-500">
            {vibrato.rate.toFixed(1)}
          </span>
        </div>
      </div>

      <label className={cn("flex w-[130px] max-w-full min-w-0 flex-col gap-1")}>
        <Label className={cn("text-xs font-normal text-zinc-500")}>Visualzation</Label>
        <Select
          value={String(visType)}
          onValueChange={(value) => {
            const selected = VIS_TYPES.find((item) => String(item.value) === value);
            if (selected) onVisTypeChange(selected.value);
          }}
        >
          <SelectTrigger className="h-11 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIS_TYPES.map((item) => (
              <SelectItem key={String(item.value)} value={String(item.value)}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </section>
  );
}
