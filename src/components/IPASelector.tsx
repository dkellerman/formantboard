import { useMemo, useState } from "react";
import { SquareArrowOutUpRight, X } from "lucide-react";
import { useAppStore } from "@/store";
import { COMMON_IPA, COMMON_IPA_DETAILS, type CommonIPAPlacement, IPA_WORDS } from "@/constants";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const setIPA = useAppStore((state) => state.setIPA);
  const [pickerOpen, setPickerOpen] = useState(false);

  const values = useMemo(() => ipaSet ?? COMMON_IPA, [ipaSet]);

  const items = useMemo(
    () =>
      values.map((item) => ({
        value: item,
        title: `${item} (${IPA_WORDS[item as IPAType]})`,
      })),
    [values],
  );

  const isCommonVowelSet = useMemo(() => {
    const commonSet = new Set(COMMON_IPA);
    return values.every((item) => commonSet.has(item as (typeof COMMON_IPA)[number]));
  }, [values]);

  const groupedVowels = useMemo(() => {
    if (!isCommonVowelSet) return [];

    const placementByIPA = new Map<IPAType, CommonIPAPlacement>(
      COMMON_IPA_DETAILS.map((item) => [item.value, item.placement]),
    );
    const groupTitleByPlacement: Record<CommonIPAPlacement, string> = {
      front: "Front",
      central: "Central",
      back: "Back",
    };
    const placementsInOrder: CommonIPAPlacement[] = ["front", "central", "back"];

    return placementsInOrder
      .map((placement) => ({
        title: groupTitleByPlacement[placement],
        items: items.filter((item) => placementByIPA.get(item.value as IPAType) === placement),
      }))
      .filter((group) => group.items.length > 0);
  }, [isCommonVowelSet, items]);

  const fallbackItems = useMemo(() => {
    if (!isCommonVowelSet) return items;
    const grouped = new Set(
      groupedVowels.flatMap((group) => group.items.map((item) => item.value)),
    );
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
        <div className={cn("flex min-h-4 items-center gap-1")}>
          {showPopout ? (
            <Popover modal={false} open={pickerOpen} onOpenChange={setPickerOpen}>
              <Label className={cn("text-xs font-normal text-foreground")}>
                {title ?? "Vowel"}
              </Label>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded",
                    "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1",
                    "focus-visible:ring-ring",
                  )}
                  aria-label="Open vowel picker"
                  title="Open vowel picker"
                >
                  <SquareArrowOutUpRight className={cn("size-3.5")} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className={cn("w-[min(92vw,520px)] p-2")}
                avoidCollisions={true}
                onInteractOutside={(event) => event.preventDefault()}
              >
                <header
                  className={cn(
                    "mb-2 flex items-center justify-between gap-1.5 border-b border-border pb-1.5",
                  )}
                >
                  <h3 className={cn("text-xs font-semibold text-foreground")}>Vowel Picker</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6 text-muted-foreground")}
                    onClick={() => setPickerOpen(false)}
                    aria-label="Close vowel picker"
                  >
                    <X className={cn("size-3.5")} />
                  </Button>
                </header>

                {groupedVowels.length > 0 ? (
                  <div className={cn("grid gap-2 sm:grid-cols-3")}>
                    {groupedVowels.map((group) => (
                      <section
                        key={group.title}
                        className={cn("rounded-md border border-border p-1.5")}
                      >
                        <h4
                          className={cn(
                            "mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                          )}
                        >
                          {group.title}
                        </h4>
                        <div className={cn("grid gap-1.5")}>
                          {group.items.map((item) => {
                            const selected = item.value === value;
                            return (
                              <button
                                key={String(item.value)}
                                type="button"
                                className={cn(
                                  "flex items-center justify-between rounded-md border px-2 py-1.5 text-left",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input bg-background text-foreground hover:bg-accent",
                                )}
                                onClick={() => handleSelect(item.value as IPAType)}
                              >
                                <span className={cn("text-base leading-none")}>{item.value}</span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    selected
                                      ? "text-primary-foreground/80"
                                      : "text-muted-foreground",
                                  )}
                                >
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
                      <h4
                        className={cn(
                          "mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                        )}
                      >
                        Other
                      </h4>
                    ) : null}
                    <div className={cn("grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4")}>
                      {fallbackItems.map((item) => {
                        const selected = item.value === value;
                        return (
                          <button
                            key={String(item.value)}
                            type="button"
                            className={cn(
                              "rounded-md border px-2 py-1.5 text-left",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background text-foreground hover:bg-accent",
                            )}
                            onClick={() => handleSelect(item.value as IPAType)}
                          >
                            <div className={cn("text-base leading-none")}>{item.value}</div>
                            <div
                              className={cn(
                                "text-xs",
                                selected ? "text-primary-foreground/80" : "text-muted-foreground",
                              )}
                            >
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
            <Label className={cn("text-xs font-normal text-foreground")}>{title ?? "Vowel"}</Label>
          )}
        </div>

        <Select
          value={value ? String(value) : undefined}
          onValueChange={(nextValue) => {
            handleSelect(nextValue as IPAType);
          }}
        >
          <SelectTrigger className={cn("h-11 text-base")}>
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
