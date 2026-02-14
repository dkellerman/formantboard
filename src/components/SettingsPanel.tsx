import { useRef } from "react";
import { VIS_TYPES } from "../constants";
import { useIPASlice, useSettings, useVisTypeSlice } from "../hooks/useStoreSlices";
import { formantRange } from "../utils";
import { F0Selector, type F0SelectorHandle } from "./F0Selector";
import { IPASelector } from "./IPASelector";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export interface SettingsPanelProps {
  className?: string;
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  const f0SelectorRef = useRef<F0SelectorHandle>(null);
  const ipaStore = useIPASlice();
  const settings = useSettings();
  const visTypeStore = useVisTypeSlice();

  const formantButtons = (() => {
    const selected: string[] = [];
    ipaStore.ipaSpec.forEach((formant, idx) => {
      if (formant.on) selected.push(String(idx));
    });
    return selected;
  })();

  function updateFormants(btns: string[]) {
    const selected = new Set(btns.map((value) => Number(value)));
    ipaStore.ipaSpec.forEach((formant, idx) => {
      formant.on = selected.has(idx);
    });
    f0SelectorRef.current?.restartF0();
  }

  return (
    <section
      className={[
        "mb-5 flex w-full flex-row flex-wrap items-start gap-2 sm:gap-3",
        "[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]",
        "[&_.vui-field]:min-w-0",
        "[&_.vui-btn]:text-sm",
        className ?? "",
      ].join(" ")}
    >
      <F0Selector ref={f0SelectorRef} className="w-[140px] sm:w-[150px]" />

      <div className="inline-flex min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">Formants</Label>
        <ToggleGroup
          className="h-11 w-[140px] gap-0 rounded-md border border-zinc-300 bg-zinc-200 sm:w-[150px]"
          type="multiple"
          value={formantButtons}
          onValueChange={updateFormants}
        >
          {ipaStore.ipaSpec.map((formant, idx) => (
            <div key={idx} className="group relative flex h-full flex-1">
              <ToggleGroupItem
                value={String(idx)}
                variant="outline"
                size="default"
                title={`Formant F${idx + 1} [${formant.on ? "ON" : "OFF"}] ${formantRange(formant).join("-")}hz`}
                aria-label={`Formant F${idx + 1} [${formant.on ? "ON" : "OFF"}] ${formantRange(formant).join("-")}hz`}
                className={[
                  "h-full w-full rounded-none border-0",
                  idx === 0 ? "border-l-0" : "border-l border-zinc-300",
                  "px-0 py-0 text-base font-normal leading-none",
                  "bg-zinc-200 text-zinc-900 hover:bg-zinc-300",
                  "data-[state=on]:bg-white data-[state=on]:text-zinc-900 data-[state=on]:hover:bg-white",
                ].join(" ")}
              >
                F{idx + 1}
              </ToggleGroupItem>
              <div
                className={[
                  "pointer-events-none absolute left-1/2 top-full z-[70] mt-1 hidden -translate-x-1/2",
                  "whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg",
                  "group-hover:block",
                ].join(" ")}
              >
                <div>
                  Formant F{idx + 1} [{formant.on ? "ON" : "OFF"}]
                </div>
                <div>{formantRange(formant).join("-")}hz</div>
              </div>
            </div>
          ))}
        </ToggleGroup>
      </div>

      <IPASelector
        className="w-[200px] max-w-full sm:w-[220px]"
        onChange={() => f0SelectorRef.current?.restartF0()}
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
              settings.harmonics.tilt = Number((event.target as HTMLInputElement).value);
            }}
            onChange={() => f0SelectorRef.current?.restartF0()}
          />
          <span className="px-1 text-sm text-zinc-500">dB/oct</span>
        </div>
      </label>

      <label className="flex w-[130px] max-w-full min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">Visualzation</Label>
        <Select
          value={String(visTypeStore.visType)}
          onValueChange={(value) => {
            visTypeStore.visType = Number(value);
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
