import { describe, expect, it } from 'vitest';
import { useSynthStore } from '../../react/store/useSynthStore';

describe('useSynthStore', () => {
  it('updates and resets sandbox values', () => {
    const store = useSynthStore.getState();

    store.setDefaultNote('A4');
    store.setVolume(55);
    store.setVisType('wave');
    store.setVisualizationOn(false);

    const updated = useSynthStore.getState();
    expect(updated.defaultNote).toBe('A4');
    expect(updated.volume).toBe(55);
    expect(updated.visType).toBe('wave');
    expect(updated.visualizationOn).toBe(false);

    updated.resetSandbox();
    const reset = useSynthStore.getState();
    expect(reset.defaultNote).toBe('E3');
    expect(reset.volume).toBe(70);
    expect(reset.visType).toBe('spectrum');
    expect(reset.visualizationOn).toBe(true);
  });
});
