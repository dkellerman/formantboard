import { type ReactNode, useState } from "react";
import { RotateCcw, SquareArrowOutUpRight, X } from "lucide-react";
import { useAppStore } from "@/store";
import {
  createDefaultSettings,
  DEFAULT_FORMANT_CASCADE_PCT,
  VIS_TYPES,
  type VisType,
} from "@/constants";
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
  showAdvanced?: boolean;
  compactToggle?: ReactNode;
  compactVowelFullWidth?: boolean;
}

export function SettingsPanel({
  className,
  visType,
  onVisTypeChange,
  showAdvanced = true,
  compactToggle,
  compactVowelFullWidth = true,
}: SettingsPanelProps) {
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);
  const ipa = useAppStore((state) => state.ipa);
  const setIPA = useAppStore((state) => state.setIPA);
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
  const vibrato = settings.vibrato;

  function restartF0() {
    setRestartSignal((current) => current + 1);
  }

  function resetSettings() {
    const defaults = createDefaultSettings();
    setSettings(defaults);
    setIPA(defaults.defaultIPA);
    onVisTypeChange(defaults.defaultVisType);
    restartF0();
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

  const rangeInputClass = cn(
    "h-2 w-full appearance-none bg-transparent",
    "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
    "[&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border",
    "[&::-webkit-slider-runnable-track]:bg-secondary",
    "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full",
    "[&::-moz-range-track]:border [&::-moz-range-track]:border-border",
    "[&::-moz-range-track]:bg-secondary",
    "[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
    "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary",
    "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
    "[&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-background",
    "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full",
    "[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary",
    "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  );

  return (
    <section
      className={cn(
        "mb-5 flex w-full flex-row gap-2 sm:gap-3",
        showAdvanced ? "flex-wrap items-start" : "flex-nowrap items-end",
        "[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]",
        "[&_.vui-field]:min-w-0",
        "[&_.vui-btn]:text-sm",
        className,
      )}
    >
      <F0Selector
        className={cn(showAdvanced ? "w-[84px] sm:w-[96px]" : "min-w-[98px] flex-[0_0_98px]")}
        restartSignal={restartSignal}
      />

      <IPASelector
        className={cn(
          showAdvanced
            ? "w-[150px] max-w-full"
            : compactVowelFullWidth
              ? "min-w-[110px] flex-1"
              : "w-[150px] max-w-[150px] flex-[0_0_150px]",
        )}
        value={ipa}
        onSelect={setIPA}
        onChange={restartF0}
      />
      {compactToggle ? (
        <div className={cn("flex flex-[0_0_auto] flex-col gap-1")}>
          <span className={cn("text-xs font-normal text-transparent select-none")}>Settings</span>
          {compactToggle}
        </div>
      ) : null}
      {showAdvanced ? (
        <>
          <div className={cn("inline-flex min-w-0 flex-col gap-1")}>
        <div className={cn("flex items-center gap-1")}>
          <Label className={cn("text-xs font-normal text-foreground")}>Formants</Label>
          <Popover modal={false} open={formantPopoverOpen} onOpenChange={setFormantPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-4 w-4 items-center justify-center rounded",
                  "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1",
                  "focus-visible:ring-ring",
                )}
                aria-label="Open formant controls"
                title="Open formant controls"
              >
                <SquareArrowOutUpRight className={cn("size-3.5")} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className={cn("w-[260px] p-1.5")}
              onInteractOutside={(event) => event.preventDefault()}
            >
              <header
                className={cn(
                  "mb-1.5 flex items-center justify-between gap-1 border-b border-border pb-1",
                )}
              >
                <h3 className={cn("text-xs font-semibold text-foreground")}>Formants</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-5 w-5 text-muted-foreground")}
                  onClick={() => setFormantPopoverOpen(false)}
                  aria-label="Close formant controls"
                >
                  <X className={cn("size-3")} />
                </Button>
              </header>

              <div className={cn("grid gap-1")}>
                <div
                  className={cn(
                    "grid grid-cols-[20px_30px_repeat(3,minmax(0,1fr))] items-center gap-1 px-1 text-[9px] uppercase tracking-wide text-muted-foreground",
                  )}
                >
                  <span />
                  <span />
                  <span className={cn("text-center")}>Freq</span>
                  <span className={cn("text-center")}>Q</span>
                  <span className={cn("text-center")}>Gain</span>
                </div>

                {ipaSpec.map((formant, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "grid grid-cols-[20px_30px_repeat(3,minmax(0,1fr))] items-center gap-1 rounded border border-border px-1 py-1",
                    )}
                  >
                    <div className={cn("text-[10px] font-medium text-foreground")}>F{idx + 1}</div>
                    <button
                      type="button"
                      className={cn(
                        "rounded border px-0 py-0.5 text-[9px] leading-none",
                        formant.on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-accent",
                      )}
                      onClick={() => updateTemporaryFormant(idx, { on: !formant.on })}
                    >
                      {formant.on ? "On" : "Off"}
                    </button>
                    <Input
                      aria-label={`Formant F${idx + 1} frequency`}
                      className={cn("h-6 px-1 text-[11px]")}
                      type="number"
                      step={10}
                      min={0}
                      max={12000}
                      value={Number.isFinite(formant.frequency) ? formant.frequency : 0}
                      onInput={(event) => {
                        const next = Number((event.target as HTMLInputElement).value);
                        if (!Number.isFinite(next)) return;
                        updateTemporaryFormant(idx, { frequency: next });
                      }}
                    />
                    <Input
                      aria-label={`Formant F${idx + 1} Q`}
                      className={cn("h-6 px-1 text-[11px]")}
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={40}
                      value={Number.isFinite(formant.Q) ? formant.Q : 0}
                      onInput={(event) => {
                        const next = Number((event.target as HTMLInputElement).value);
                        if (!Number.isFinite(next)) return;
                        updateTemporaryFormant(idx, { Q: next });
                      }}
                    />
                    <Input
                      aria-label={`Formant F${idx + 1} gain`}
                      className={cn("h-6 px-1 text-[11px]")}
                      type="number"
                      step={0.1}
                      min={-40}
                      max={60}
                      value={Number.isFinite(formant.gain) ? formant.gain : 0}
                      onInput={(event) => {
                        const next = Number((event.target as HTMLInputElement).value);
                        if (!Number.isFinite(next)) return;
                        updateTemporaryFormant(idx, { gain: next });
                      }}
                    />
                  </div>
                ))}

                <label
                  className={cn(
                    "grid grid-cols-[52px_minmax(0,1fr)_42px_12px] items-center gap-1 rounded border border-border px-1 py-1",
                  )}
                >
                  <span className={cn("flex flex-col leading-none")}>
                    <span className={cn("text-[11px] text-muted-foreground")}>Cascade</span>
                  </span>
                  <input
                    className={rangeInputClass}
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
                    className={cn("h-6 px-1 text-right text-xs")}
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
                  <span className={cn("text-[10px] text-muted-foreground")}>%</span>
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <ToggleGroup
          className={cn(
            "h-11 w-[140px] gap-0 rounded-md border border-input",
            "bg-muted sm:w-[150px]",
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
                    idx === 0 ? "border-l-0" : "border-l border-border",
                    "px-0 py-0 text-base font-normal leading-none",
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    "data-[state=on]:bg-background data-[state=on]:text-foreground",
                    "data-[state=on]:hover:bg-background",
                    "dark:data-[state=on]:bg-black dark:data-[state=on]:text-white",
                    "dark:data-[state=on]:hover:bg-black",
                  )}
                >
                  F{idx + 1}
                </ToggleGroupItem>
                <div
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-full z-[70]",
                    "mt-1 hidden -translate-x-1/2",
                    "whitespace-nowrap rounded border border-border bg-popover px-2 py-1",
                    "text-xs text-popover-foreground shadow-lg",
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

      <label className={cn("flex w-[118px] max-w-full min-w-0 flex-col gap-1")}>
        <Label className={cn("text-xs font-normal text-foreground")}>Tilt</Label>
        <div
          className={cn(
            "flex h-11 w-full items-center gap-0.5 rounded-md border border-input px-1",
          )}
        >
          <Input
            className={cn(
              "h-8 min-w-0 flex-1 border-0 bg-transparent px-2 text-foreground",
              "shadow-none ring-0 focus-visible:ring-0",
            )}
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
          <span className={cn("shrink-0 px-1 text-sm text-muted-foreground")}>dB/oct</span>
        </div>
      </label>

      <div className={cn("flex w-[150px] max-w-full min-w-0 flex-col gap-1")}>
        <div className={cn("flex min-h-4 items-center gap-1")}>
          <Switch
            checked={vibrato.on}
            onCheckedChange={(value) => commitVibrato({ on: value })}
            className={cn(
              "h-4 w-7 shrink-0",
              "[&>span]:h-3 [&>span]:w-3",
              "data-[state=checked]:[&>span]:translate-x-3",
            )}
            aria-label="Toggle vibrato"
          />
          <Popover modal={false} open={vibratoPopoverOpen} onOpenChange={setVibratoPopoverOpen}>
            <Label className={cn("text-xs font-normal text-foreground")}>Vibrato</Label>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-4 w-4 items-center justify-center rounded",
                  "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1",
                  "focus-visible:ring-ring",
                )}
                aria-label="Open vibrato controls"
                title="Open vibrato controls"
              >
                <SquareArrowOutUpRight className={cn("size-3.5")} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className={cn("w-[220px] p-1.5")}
              onInteractOutside={(event) => event.preventDefault()}
            >
              <header
                className={cn(
                  "mb-1.5 flex items-center justify-between gap-1 border-b border-border pb-1",
                )}
              >
                <h3 className={cn("text-xs font-semibold text-foreground")}>Vibrato</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-5 w-5 text-muted-foreground")}
                  onClick={() => setVibratoPopoverOpen(false)}
                  aria-label="Close vibrato controls"
                >
                  <X className={cn("size-3")} />
                </Button>
              </header>

              <div className={cn("grid gap-1")}>
                <div
                  className={cn(
                    "grid grid-cols-[42px_minmax(0,1fr)] items-center gap-1 rounded border border-border px-1 py-1",
                  )}
                >
                  <span className={cn("text-[11px] text-muted-foreground")}>On</span>
                  <button
                    type="button"
                    className={cn(
                      "rounded border px-1 py-0.5 text-[10px] leading-none",
                      vibrato.on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-foreground hover:bg-accent",
                    )}
                    onClick={() => commitVibrato({ on: !vibrato.on })}
                  >
                    {vibrato.on ? "On" : "Off"}
                  </button>
                </div>

                <label
                  className={cn(
                    "grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-border px-1 py-1",
                  )}
                >
                  <span className={cn("text-[11px] text-muted-foreground")}>Rate</span>
                  <input
                    className={rangeInputClass}
                    type="range"
                    step={0.1}
                    min={0}
                    max={10}
                    value={vibrato.rate}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ rate: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className={cn("h-6 px-1 text-right text-xs")}
                    type="number"
                    step={0.1}
                    min={0}
                    max={10}
                    value={vibrato.rate}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ rate: next });
                    }}
                    onChange={restartF0}
                  />
                </label>

                <label
                  className={cn(
                    "grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-border px-1 py-1",
                  )}
                >
                  <span className={cn("text-[11px] text-muted-foreground")}>Extent</span>
                  <input
                    className={rangeInputClass}
                    type="range"
                    step={0.1}
                    min={0}
                    max={5}
                    value={vibrato.extent}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ extent: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className={cn("h-6 px-1 text-right text-xs")}
                    type="number"
                    step={0.1}
                    min={0}
                    max={5}
                    value={vibrato.extent}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ extent: next });
                    }}
                    onChange={restartF0}
                  />
                </label>

                <label
                  className={cn(
                    "grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-border px-1 py-1",
                  )}
                >
                  <span className={cn("text-[11px] text-muted-foreground")}>Jitter</span>
                  <input
                    className={rangeInputClass}
                    type="range"
                    step={0.1}
                    min={0}
                    max={2}
                    value={vibrato.jitter}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ jitter: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className={cn("h-6 px-1 text-right text-xs")}
                    type="number"
                    step={0.1}
                    min={0}
                    max={2}
                    value={vibrato.jitter}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ jitter: next });
                    }}
                    onChange={restartF0}
                  />
                </label>

                <label
                  className={cn(
                    "grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-1 rounded border border-border px-1 py-1",
                  )}
                >
                  <span className={cn("text-[11px] text-muted-foreground")}>Onset</span>
                  <input
                    className={rangeInputClass}
                    type="range"
                    step={0.1}
                    min={0}
                    max={3}
                    value={vibrato.onsetTime}
                    onInput={(event) => {
                      const next = Number((event.target as HTMLInputElement).value);
                      if (!Number.isFinite(next)) return;
                      patchVibrato({ onsetTime: next });
                    }}
                    onChange={restartF0}
                  />
                  <Input
                    className={cn("h-6 px-1 text-right text-xs")}
                    type="number"
                    step={0.1}
                    min={0}
                    max={3}
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

        <div className={cn("flex h-11 items-center gap-1 rounded-md border border-input px-2")}>
          <span className={cn("text-[11px] text-muted-foreground")}>Rate</span>
          <input
            className={rangeInputClass}
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={vibrato.rate}
            onInput={(event) => {
              const next = Number((event.target as HTMLInputElement).value);
              if (!Number.isFinite(next)) return;
              patchVibrato({ rate: next });
            }}
            onChange={restartF0}
          />
          <span className={cn("w-8 text-right text-[11px] text-muted-foreground")}>
            {vibrato.rate.toFixed(1)}
          </span>
        </div>
      </div>

      <label className={cn("flex w-[130px] max-w-full min-w-0 flex-col gap-1")}>
        <Label className={cn("text-xs font-normal text-foreground")}>Visualization</Label>
        <Select
          value={String(visType)}
          onValueChange={(value) => {
            const selected = VIS_TYPES.find((item) => String(item.value) === value);
            if (selected) onVisTypeChange(selected.value);
          }}
        >
          <SelectTrigger className={cn("h-11 text-base")}>
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

          <div className={cn("flex w-11 flex-col gap-1")}>
        <span className={cn("text-xs font-normal text-transparent select-none")}>Reset</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-11 w-11 text-muted-foreground hover:text-foreground")}
          onClick={resetSettings}
          aria-label="Reset settings"
          title="Reset settings"
        >
          <RotateCcw />
        </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}
