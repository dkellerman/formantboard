import { useMemo, useState } from "react";
import { SquareArrowOutUpRight, X } from "lucide-react";
import { useAppContext } from "@/store";
import { COMMON_IPA, IPA_WORDS } from "@/constants";
import { cn } from "@/lib/cn";
import type { IPAType } from "@/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const VOWEL_LAYOUT = [
  {
    title: "Front",
    values: ["i", "ɪ", "ɛ", "æ"],
  },
  {
    title: "Central",
    values: ["ə"],
  },
  {
    title: "Back",
    values: ["u", "ʊ", "ɔ", "ɑ"],
  },
] as const;

export interface IPASelectorProps {
  ipaSet?: IPAType[];
  value?: IPAType;
  onSelect?: (value: IPAType) => void;
  title?: string;
  className?: string;
  onChange?: (value: unknown) => void;
  showPopout?: boolean;
}

export function IPASelector({
  ipaSet,
  value,
  onSelect,
  title,
  className,
  onChange,
  showPopout = true,
}: IPASelectorProps) {
  const { setIPA } = useAppContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  const values = useMemo(() => Object.values(ipaSet ?? COMMON_IPA), [ipaSet]);

  const items = useMemo(
    () =>
      values.map((item) => ({
        value: item,
        title: `${item} (${IPA_WORDS[item as IPAType]})`,
      })),
    [values],
  );

  const itemsMap = useMemo(() => new Map(items.map((item) => [item.value, item])), [items]);

  const isCommonVowelSet = useMemo(() => {
    const commonSet = new Set(COMMON_IPA);
    return values.every((item) => commonSet.has(item as (typeof COMMON_IPA)[number]));
  }, [values]);

  const groupedVowels = useMemo(() => {
    if (!isCommonVowelSet) return [];

    return VOWEL_LAYOUT.map((group) => ({
      ...group,
      items: group.values
        .map((vowel) => itemsMap.get(vowel as IPAType))
        .filter((item): item is { value: IPAType; title: string } => Boolean(item)),
    })).filter((group) => group.items.length > 0);
  }, [isCommonVowelSet, itemsMap]);

  const fallbackItems = useMemo(() => {
    if (!isCommonVowelSet) return items;
    const grouped = new Set(groupedVowels.flatMap((group) => group.items.map((item) => item.value)));
    return items.filter((item) => !grouped.has(item.value));
  }, [groupedVowels, isCommonVowelSet, items]);

  function handleSelect(nextValue: IPAType) {
    setIPA(nextValue);
    onSelect?.(nextValue);
    onChange?.(nextValue);
  }

  return (
    <section className={cn("flex flex-row items-center", className)}>
      <div className={cn("flex w-full min-w-0 flex-col gap-1")}>
        <div className="flex min-h-4 items-center gap-1">
          {showPopout ? (
            <Popover modal={false} open={pickerOpen} onOpenChange={setPickerOpen}>
              <Label className={cn("text-xs font-normal text-zinc-500")}>{title ?? "Vowel"}</Label>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded",
                    "text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-1",
                    "focus-visible:ring-zinc-950",
                  )}
                  aria-label="Open vowel picker"
                  title="Open vowel picker"
                >
                  <SquareArrowOutUpRight className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverAnchor asChild>
                <div className="pointer-events-none fixed right-3 top-3 h-0 w-0" />
              </PopoverAnchor>

              <PopoverContent
                side="bottom"
                align="end"
                className="w-[min(92vw,520px)] p-2"
                avoidCollisions={true}
                onInteractOutside={(event) => event.preventDefault()}
              >
                <header className="mb-2 flex items-center justify-between gap-1.5 border-b border-zinc-200 pb-1.5">
                  <h3 className="text-xs font-semibold text-zinc-900">Vowel Picker</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-500"
                    onClick={() => setPickerOpen(false)}
                    aria-label="Close vowel picker"
                  >
                    <X className="size-3.5" />
                  </Button>
                </header>

                {groupedVowels.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {groupedVowels.map((group) => (
                      <section key={group.title} className="rounded-md border border-zinc-200 p-1.5">
                        <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          {group.title}
                        </h4>
                        <div className="grid gap-1.5">
                          {group.items.map((item) => {
                            const selected = item.value === value;
                            return (
                              <button
                                key={String(item.value)}
                                type="button"
                                className={cn(
                                  "flex items-center justify-between rounded-md border px-2 py-1.5 text-left",
                                  selected
                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                    : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
                                )}
                                onClick={() => handleSelect(item.value as IPAType)}
                              >
                                <span className="text-base leading-none">{item.value}</span>
                                <span className={cn("text-xs", selected ? "text-zinc-200" : "text-zinc-500")}>
                                  {IPA_WORDS[item.value as IPAType]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : null}

                {fallbackItems.length > 0 ? (
                  <section className={cn(groupedVowels.length > 0 ? "mt-2" : "")}>
                    {groupedVowels.length > 0 ? (
                      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Other
                      </h4>
                    ) : null}
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                      {fallbackItems.map((item) => {
                        const selected = item.value === value;
                        return (
                          <button
                            key={String(item.value)}
                            type="button"
                            className={cn(
                              "rounded-md border px-2 py-1.5 text-left",
                              selected
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
                            )}
                            onClick={() => handleSelect(item.value as IPAType)}
                          >
                            <div className="text-base leading-none">{item.value}</div>
                            <div className={cn("text-xs", selected ? "text-zinc-200" : "text-zinc-500")}>
                              {IPA_WORDS[item.value as IPAType]}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </PopoverContent>
            </Popover>
          ) : (
            <Label className={cn("text-xs font-normal text-zinc-500")}>{title ?? "Vowel"}</Label>
          )}
        </div>

        <Select
          value={value ? String(value) : undefined}
          onValueChange={(nextValue) => {
            handleSelect(nextValue as IPAType);
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
      </div>
    </section>
  );
}
