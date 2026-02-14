import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { IPA } from '../../stores/ipaEnum';
import { useIPA } from '../../stores/useIPA';
import { useSettings } from '../../stores/useSettings';

describe('useIPA store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes from app defaults', () => {
    const settings = useSettings();
    const store = useIPA();

    expect(store.ipa).toBe(settings.settings.defaultIPA);
    expect(store.ipaSpec[0].frequency).toBe(800);
  });

  it('switches IPA profile and formant set', () => {
    const store = useIPA();
    store.ipa = IPA.i;

    expect(store.ipaSpec[0].frequency).toBe(270);
    expect(store.ipaSpec[1].frequency).toBe(2300);
  });
});
