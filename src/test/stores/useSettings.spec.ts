import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { IPA as IPAEnum } from '../../stores/ipaEnum';
import { useSettings } from '../../stores/useSettings';
import { VisType } from '../../stores/useVisType';

describe('useSettings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('exposes expected default settings', () => {
    const store = useSettings();

    expect(store.settings.defaultNote).toBe('E3');
    expect(store.settings.defaultIPA).toBe(IPAEnum.ɑ);
    expect(store.settings.defaultVisType).toBe(VisType.POWER);
    expect(store.settings.audioContextConfig.sampleRate).toBe(44100);
    expect(store.settings.formants.ipa[IPAEnum.ɑ]).toHaveLength(3);
  });

  it('allows basic runtime settings changes', () => {
    const store = useSettings();
    const prevF0On = store.settings.f0.on;
    const prevHarmonicsMax = store.settings.harmonics.max;
    const prevBackground = store.settings.viz.background;

    store.settings.f0.on = false;
    store.settings.harmonics.max = 12;
    store.settings.viz.background = '#111111';

    expect(store.settings.f0.on).toBe(false);
    expect(store.settings.harmonics.max).toBe(12);
    expect(store.settings.viz.background).toBe('#111111');

    store.settings.f0.on = prevF0On;
    store.settings.harmonics.max = prevHarmonicsMax;
    store.settings.viz.background = prevBackground;
  });
});
