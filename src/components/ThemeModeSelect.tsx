import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ThemeMode } from "@/hooks/useThemeMode";

export interface ThemeModeSelectProps {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
  className?: string;
}

export function ThemeModeSelect({ value, onChange, className }: ThemeModeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        onChange(nextValue as ThemeMode);
      }}
    >
      <SelectTrigger aria-label="Select color mode" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  );
}
