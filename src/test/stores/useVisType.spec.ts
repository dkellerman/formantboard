import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../stores/useSettings';
import { VisType, useVisType } from '../../stores/useVisType';

describe('useVisType store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('defaults to the configured visualization type', () => {
    const settings = useSettings();
    const store = useVisType();

    expect(store.visType).toBe(settings.settings.defaultVisType);
    expect(store.visType).toBe(VisType.POWER);
  });

  it('supports switching visualization mode', () => {
    const store = useVisType();
    store.visType = VisType.WAVE;

    expect(store.visType).toBe(VisType.WAVE);
  });
});
