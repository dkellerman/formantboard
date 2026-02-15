import { useState } from "react";
import { useAppContext } from "@/store";
import { VIS_TYPES, type VisType } from "@/constants";
import { cn } from "@/lib/cn";
import type { Formant } from "@/types";
import { formantRange } from "@/utils";
import { F0Selector } from "@/components/F0Selector";
import { IPASelector } from "@/components/IPASelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const ipaSpec = settings.formants.ipa[ipa];

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
      <F0Selector className="w-[140px] sm:w-[150px]" restartSignal={restartSignal} />

      <div className="inline-flex min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">Formants</Label>
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
              <div key={idx} className="group relative flex h-full flex-1">
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
        className="w-[200px] max-w-full sm:w-[220px]"
        value={ipa}
        onSelect={setIPA}
        onChange={restartF0}
      />

      <label className="flex w-[136px] max-w-full min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">Tilt</Label>
        <div className="flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-1">
          <Input
            className="h-full border-0 shadow-none ring-0 focus-visible:ring-0"
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
          <span className="px-1 text-sm text-zinc-500">dB/oct</span>
        </div>
      </label>

      <label className="flex w-[130px] max-w-full min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">Visualzation</Label>
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
