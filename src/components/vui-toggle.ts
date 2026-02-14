import type { InjectionKey } from 'vue';

export interface ToggleContext {
  isSelected: (value: unknown) => boolean;
  toggle: (value: unknown) => void;
}

export const ToggleContextKey: InjectionKey<ToggleContext> = Symbol('toggle-context');
