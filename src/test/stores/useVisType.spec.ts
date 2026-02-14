import { beforeEach, describe, expect, it } from 'vitest';
import { resetAllStores } from '../../stores/zustand';
import { useSettings } from '../../stores/useSettings';
import { useVisType } from '../../stores/useVisType';
import { VisType } from '../../stores/visTypes';

describe('useVisType store', () => {
  beforeEach(() => {
    resetAllStores();
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
