import { useMemo } from "react";
import { COMMON_IPA, IPA_WORDS, type IPAType } from "../hooks/useIPA";
import { useIPASlice } from "../hooks/useStoreSlices";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export interface IPASelectorProps {
  ipaSet?: IPAType[];
  title?: string;
  className?: string;
  onChange?: (value: unknown) => void;
}

export function IPASelector({ ipaSet, title, className, onChange }: IPASelectorProps) {
  const ipaStore = useIPASlice();

  const items = useMemo(
    () =>
      Object.values(ipaSet ?? COMMON_IPA).map((value) => ({
        value,
        title: `${value} (${IPA_WORDS[value as IPAType]})`,
      })),
    [ipaSet],
  );

  return (
    <section className={["flex flex-row items-center", className ?? ""].join(" ")}>
      <label className="flex w-full min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">{title ?? "Sound"}</Label>
        <Select
          value={String(ipaStore.ipa)}
          onValueChange={(value) => {
            ipaStore.ipa = value as IPAType;
            onChange?.(value);
          }}
        >
          <SelectTrigger className="h-11 text-base">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
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
