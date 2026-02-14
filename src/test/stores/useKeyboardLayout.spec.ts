import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useKeyboardLayout } from '../../stores/useKeyboardLayout';

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('useKeyboardLayout store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('tracks keyboard width from window size', () => {
    setWindowWidth(1000);
    const store = useKeyboardLayout();

    expect(store.keyboardWidth).toBeCloseTo(950, 3);
  });

  it('chooses a usable key width for compact screens', () => {
    setWindowWidth(320);
    const store = useKeyboardLayout();

    expect(store.layout.topFreq).toBeGreaterThan(store.layout.bottomFreq);
    expect(store.fullKeyWidth > 20 || store.layout.notes.length <= 37).toBe(true);
  });
});
