import { useCallback, useEffect, useRef, useState } from "react";
import { IPA } from "@/constants";
import { usePlayer } from "@/hooks/usePlayer";
import { useAppStore } from "@/store";
import type { FormantOverride, IPAType, PlayerNoteOptions, Settings } from "@/types";
import { noteOrFreq2freq } from "@/utils";

export type SoundDemoId =
  | "source-shape"
  | "tract-topology"
  | "formant-bandwidth"
  | "note-phases"
  | "range-retuning";

export type SoundDemoVariant = "problem" | "better";

type DemoConfig = {
  duration: number;
  velocity?: number;
  vowel: IPAType;
  tilt?: number;
  formants?: FormantOverride[];
  patchSettings?: (settings: Settings) => Settings;
};

type DemoState = {
  demoId: SoundDemoId;
  variant: SoundDemoVariant;
};

function patchFormants(
  settings: Settings,
  ipa: IPAType,
  formants: FormantOverride[],
): Settings {
  const base = settings.formants.ipa[ipa];
  const nextSpec = base.map((formant, index) => {
    const patch = formants.find((item) => item.index === index);
    if (!patch) return formant;
    const next = { ...patch };
    delete (next as { index?: number }).index;
    return { ...formant, ...next };
  });

  return {
    ...settings,
    formants: {
      ...settings.formants,
      ipa: {
        ...settings.formants.ipa,
        [ipa]: nextSpec,
      },
    },
  };
}

function createDemoConfig(
  demoId: SoundDemoId,
  variant: SoundDemoVariant,
  note: string,
): DemoConfig {
  switch (demoId) {
    case "source-shape":
      return variant === "problem"
        ? {
            duration: 2,
            vowel: IPA.ɑ,
            tilt: -7.5,
            patchSettings: (settings) => ({
              ...settings,
              harmonics: {
                ...settings.harmonics,
                max: 14,
              },
            }),
          }
        : {
            duration: 2,
            vowel: IPA.ɑ,
            tilt: -3.2,
            patchSettings: (settings) => ({
              ...settings,
              harmonics: {
                ...settings.harmonics,
                max: 40,
              },
            }),
          };
    case "tract-topology":
      return variant === "problem"
        ? {
            duration: 2.1,
            vowel: IPA.ɑ,
            patchSettings: (settings) => ({
              ...settings,
              formants: {
                ...settings.formants,
                cascadePctDefault: 0,
                compensation: {
                  ...settings.formants.compensation,
                  on: false,
                },
              },
            }),
          }
        : {
            duration: 2.1,
            vowel: IPA.ɑ,
            patchSettings: (settings) => ({
              ...settings,
              formants: {
                ...settings.formants,
                cascadePctDefault: 1,
                compensation: {
                  ...settings.formants.compensation,
                  on: false,
                },
              },
            }),
          };
    case "formant-bandwidth":
      return variant === "problem"
        ? {
            duration: 2,
            vowel: IPA.i,
            formants: [
              { index: 0, Q: 10 },
              { index: 1, Q: 10 },
              { index: 2, Q: 10 },
            ],
          }
        : {
            duration: 2,
            vowel: IPA.i,
            formants: [
              { index: 0, Q: 34, gain: 18 },
              { index: 1, Q: 32, gain: 18 },
              { index: 2, Q: 28, gain: 16 },
            ],
          };
    case "note-phases":
      return variant === "problem"
        ? {
            duration: 1.9,
            vowel: IPA.ɑ,
            patchSettings: (settings) => ({
              ...settings,
              f0: {
                ...settings.f0,
                onsetTime: 0.18,
                decayTime: 0.04,
              },
              vibrato: {
                ...settings.vibrato,
                onsetTime: 0.05,
                extent: 0.8,
              },
            }),
          }
        : {
            duration: 2.1,
            vowel: IPA.ɑ,
            patchSettings: (settings) => ({
              ...settings,
              f0: {
                ...settings.f0,
                onsetTime: 0.025,
                decayTime: 0.18,
              },
              vibrato: {
                ...settings.vibrato,
                onsetTime: 0.55,
                extent: 0.5,
              },
            }),
          };
    case "range-retuning": {
      const isHigh = noteOrFreq2freq(note) >= noteOrFreq2freq("A4");
      return variant === "problem"
        ? {
            duration: 2,
            vowel: IPA.i,
          }
        : {
            duration: 2,
            vowel: IPA.i,
            formants: isHigh
              ? [
                  { index: 0, frequency: 360, Q: 26, gain: 18 },
                  { index: 1, frequency: 2200, Q: 28, gain: 18 },
                  { index: 2, frequency: 2950, Q: 24, gain: 15 },
                ]
              : [
                  { index: 0, frequency: 310, Q: 22, gain: 18 },
                  { index: 1, frequency: 2320, Q: 24, gain: 18 },
                  { index: 2, frequency: 3050, Q: 22, gain: 15 },
                ],
          };
    }
  }
}

export const SOUND_NOTE_OPTIONS = ["A2", "C3", "E3", "A3", "C4", "E4", "A4"] as const;

export function parseSoundNote(note: string) {
  return noteOrFreq2freq(note);
}

export function useSoundDemo() {
  const player = usePlayer();
  const [activeDemo, setActiveDemo] = useState<DemoState | null>(null);
  const clearActiveTimerRef = useRef<number | null>(null);
  const playerRef = useRef(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const clearActiveTimer = useCallback(() => {
    if (clearActiveTimerRef.current !== null) {
      window.clearTimeout(clearActiveTimerRef.current);
      clearActiveTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearActiveTimer();
    playerRef.current.stopApiPlayback();
    setActiveDemo(null);
  }, [clearActiveTimer]);

  const play = useCallback(
    (demoId: SoundDemoId, variant: SoundDemoVariant, note: string) => {
      clearActiveTimer();
      playerRef.current.stopApiPlayback();

      const config = createDemoConfig(demoId, variant, note);
      const store = useAppStore.getState();
      const originalSettings = store.settings;
      const originalIpa = store.ipa;

      let nextSettings = config.patchSettings ? config.patchSettings(originalSettings) : originalSettings;
      if (config.formants && config.formants.length > 0) {
        nextSettings = patchFormants(nextSettings, config.vowel, config.formants);
      }

      store.setSettings(nextSettings);
      store.setIPA(config.vowel);

      const playOptions: PlayerNoteOptions = {
        source: "api",
        vowel: config.vowel,
        tilt: config.tilt,
        formants: config.formants,
      };

      playerRef.current.play(
        parseSoundNote(note),
        config.velocity ?? 1,
        0,
        config.duration,
        playOptions,
      );

      useAppStore.getState().setSettings(originalSettings);
      useAppStore.getState().setIPA(originalIpa);
      setActiveDemo({ demoId, variant });
      clearActiveTimerRef.current = window.setTimeout(() => {
        setActiveDemo((current) =>
          current?.demoId === demoId && current.variant === variant ? null : current,
        );
        clearActiveTimerRef.current = null;
      }, (config.duration + 0.25) * 1000);
    },
    [clearActiveTimer],
  );

  useEffect(() => {
    return () => {
      clearActiveTimer();
      playerRef.current.stopApiPlayback();
    };
  }, [clearActiveTimer]);

  return {
    activeDemo,
    play,
    stop,
  };
}
