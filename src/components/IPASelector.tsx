import { useAppContext } from "@/store";
import { COMMON_IPA, IPA_WORDS } from "@/constants";
import type { IPAType } from "@/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface IPASelectorProps {
  ipaSet?: IPAType[];
  value?: IPAType;
  onSelect?: (value: IPAType) => void;
  title?: string;
  className?: string;
  onChange?: (value: unknown) => void;
}

export function IPASelector({
  ipaSet,
  value,
  onSelect,
  title,
  className,
  onChange,
}: IPASelectorProps) {
  const { setIPA } = useAppContext();

  const items = Object.values(ipaSet ?? COMMON_IPA).map((item) => ({
    value: item,
    title: `${item} (${IPA_WORDS[item as IPAType]})`,
  }));

  return (
    <section className={["flex flex-row items-center", className ?? ""].join(" ")}>
      <label className="flex w-full min-w-0 flex-col gap-1">
        <Label className="text-xs font-normal text-zinc-500">{title ?? "Sound"}</Label>
        <Select
          value={value ? String(value) : undefined}
          onValueChange={(value) => {
            setIPA(value as IPAType);
            onSelect?.(value as IPAType);
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
