import type { SoundDemoId } from "./soundAudio";

export type SoundResource = {
  id: string;
  title: string;
  url: string;
  note: string;
};

export type CodeTarget = {
  file: string;
  symbol: string;
  note: string;
};

export type SoundTopic = {
  slug: string;
  priority: number;
  title: string;
  summary: string;
  currentBehavior: string;
  whyItMatters: string;
  acousticModel: string;
  genericAdvice: string;
  rootCause: string[];
  implementationMoves: string[];
  codeTargets: CodeTarget[];
  verification: string[];
  prototype: string[];
  exampleLabel: string;
  exampleProblem: string;
  exampleBetter: string;
  listenFor: string[];
  recommendedNote: string;
  demoId: SoundDemoId;
  resourceIds: string[];
};

export const SOUND_RESOURCES: SoundResource[] = [
  {
    id: "praat-source-filter",
    title: "Praat manual: source-filter synthesis",
    url: "https://www.fon.hum.uva.nl/praat/manual/Source-filter_synthesis.html",
    note: "Core reference for separating excitation from resonance.",
  },
  {
    id: "praat-klattgrid",
    title: "Praat manual: KlattGrid",
    url: "https://www.fon.hum.uva.nl/praat/manual/KlattGrid.html",
    note: "Concrete parameter inventory for voice source, aspiration, frication, and formants.",
  },
  {
    id: "mit-acoustic-phonetics",
    title: "MIT OpenCourseWare: acoustic phonetics summary",
    url: "https://ocw.mit.edu/courses/24-900-introduction-to-linguistics-fall-2012/32672c0c9668c2aded8defe2bf1a373a_MIT24_900F12_Acostc_sumary.pdf",
    note: "Good quick refresher on how vowel identity emerges from resonances.",
  },
  {
    id: "nats-vowel-modification",
    title: "NATS: vowel modification exercises",
    url: "https://www.nats.org/_Library/Science_Informed_Voice_Pedagogy_Resource/modifying_vowels_exercises_with_VoceVista.pdf",
    note: "Useful for range-aware retuning once the basic engine is already believable.",
  },
  {
    id: "nats-bozeman-essentials",
    title: "NATS: The Essentials of Acoustic Voice Pedagogy",
    url: "https://www.nats.org/_Library/Las_Vegas_2018_presentations_handouts/Kenneth_Bozeman_-_Bozeman_NATS_2018_Breakout_Session.pdf",
    note: "Good explanation of why higher notes often need modified tract targets.",
  },
  {
    id: "pmc-resonance-effects",
    title: "Resonance Effects and the Vocalization of Speech",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7591156/",
    note: "Broad review of the acoustic changes that separate speech-like tone from more vocalized singing tone.",
  },
];

export const SOUND_RESOURCE_BY_ID = Object.fromEntries(
  SOUND_RESOURCES.map((resource) => [resource.id, resource]),
) as Record<string, SoundResource>;

export const SOUND_TOPICS: SoundTopic[] = [
  {
    slug: "source-shape",
    priority: 1,
    title: "The source harmonic shape is still the biggest first lever",
    summary:
      "If the excitation already sounds like a plain synth, the filter stage is being asked to do too much.",
    currentBehavior:
      "The real player builds a periodic-wave source from harmonic amplitudes and a global tilt value in `createHarmonics()` and `applyHarmonics()`. The dev demo now uses that exact path and only changes real settings the player already supports.",
    whyItMatters:
      "This is a true needle mover because the ear hears the source before it hears your theory about the vowel. A more vocal buzz can make the same formant settings suddenly feel more like a sung vowel instead of filtered oscillator tone.",
    acousticModel:
      "Singing starts with a believable voiced excitation. The tract filter should refine that source, not rescue a fundamentally synthetic one.",
    genericAdvice:
      "Generic singing takeaway: if the raw buzz does not feel vocal, the vowel will struggle no matter how carefully you shape it.",
    rootCause: [
      "The player currently relies on a periodic-wave source plus tilt as its main vocal-source model.",
      "That is efficient and controllable, but still easy to hear as a synth if the harmonic balance is off.",
      "When the source is too dull or too plain, every vowel reads more like filtered tone than like singing.",
    ],
    implementationMoves: [
      "Use the real player to A/B more starved versus more vocal source settings first.",
      "Once the best current-source direction is obvious, decide whether the next step is a better harmonic table or a more explicit glottal model.",
      "Do not chase tract micro-issues before the raw source feels closer to a voice.",
    ],
    codeTargets: [
      {
        file: "src/utils.ts",
        symbol: "createHarmonics() / getHarmonics()",
        note: "Primary source-shape generator.",
      },
      {
        file: "src/hooks/usePlayer.ts",
        symbol: "applyHarmonics()",
        note: "Runtime entry point that turns the harmonic table into the actual player source.",
      },
    ],
    verification: [
      "Listen to the same vowel with the current player but different harmonic max/tilt values.",
      "If the better source immediately reduces the 'plain synth' impression, you found a real first-order lever.",
      "Judge by big realism shift, not by subtle preference.",
    ],
    prototype: [
      "Keep the current player path and compare a starved source versus a fuller one.",
      "Only if that still sounds fundamentally synthetic should you invest in a more glottal-like source model.",
      "Use formant settings unchanged while making this decision.",
    ],
    exampleLabel: "Actual player A/B: starved source versus fuller voiced source",
    exampleProblem: "Problem: the vowel is being shaped on top of a source that already sounds too synthetic.",
    exampleBetter: "Better: the same player path feeds the formants a source that sounds more like a vocal buzz.",
    listenFor: [
      "Whether the tone already hints at a voice before you focus on vowel detail.",
      "Whether the same formants suddenly read as more human without extra tricks.",
      "Whether the change feels big and basic rather than polished and subtle.",
    ],
    recommendedNote: "A3",
    demoId: "source-shape",
    resourceIds: ["praat-source-filter", "praat-klattgrid", "pmc-resonance-effects"],
  },
  {
    slug: "tract-topology",
    priority: 2,
    title: "The resonance stage still risks sounding like EQ instead of a vocal tract",
    summary:
      "A lot of the current realism question is really about whether the formant stage behaves like tract resonance or like boosted bands on a synth.",
    currentBehavior:
      "The real player builds peaking filters and can blend parallel and cascade behavior through `cascadePctDefault`, with optional compensation logic. The dev A/B now uses that actual topology path instead of a separate toy engine.",
    whyItMatters:
      "This is another major needle mover because if the resonator sounds like EQ, the whole instrument sounds like EQ on a synth. Listeners do not hear 'a vocal tract' just because the peak frequencies are in the right neighborhood.",
    acousticModel:
      "A vocal tract is a coupled resonant system. The more the resonances interact like a shaped tube instead of isolated boosts, the easier it is to hear an actual vowel.",
    genericAdvice:
      "Generic singing takeaway: vowel identity depends on resonance, but resonance has to feel like one system, not like a few separate tone controls.",
    rootCause: [
      "The player uses peaking biquads rather than an explicitly physical tract model.",
      "Parallel routing can sound especially EQ-like.",
      "Compensation can make comparisons harder by rescuing body and level even when the raw tract behavior is not convincing.",
    ],
    implementationMoves: [
      "Use the actual player to compare raw parallel and raw cascade behavior first.",
      "Only after that decide how much compensation should be helping the default path.",
      "Treat 'sounds more vocal' as the main criterion, not 'matches loudness best'.",
    ],
    codeTargets: [
      {
        file: "src/hooks/usePlayer.ts",
        symbol: "connectFormants()",
        note: "Main tract/resonance construction path.",
      },
      {
        file: "src/hooks/usePlayer.ts",
        symbol: "computeDynamicCompensationGain()",
        note: "Current rescue logic that can obscure the raw topology difference.",
      },
    ],
    verification: [
      "Use the actual player to compare the same vowel in pure parallel and pure cascade mode.",
      "Listen for a shift from 'filtered synth' toward 'tract-shaped vowel'.",
      "If the difference is obvious, this belongs high in the roadmap.",
    ],
    prototype: [
      "Keep the live player and temporarily force `cascadePctDefault` to `0` versus `1` in dev playback.",
      "Leave everything else the same.",
      "Decide whether compensation belongs in the first comparison or only after raw behavior is understood.",
    ],
    exampleLabel: "Actual player A/B: EQ-like routing versus more tract-like routing",
    exampleProblem: "Problem: the vowel sounds like tone shaping on a synth.",
    exampleBetter: "Better: the resonance feels more like a vocal tube acting on a buzz source.",
    listenFor: [
      "Whether the vowel feels like one resonant object instead of a few highlighted bands.",
      "Whether front/back vowel contrast sounds more human.",
      "Whether the change is obvious enough to justify code work immediately.",
    ],
    recommendedNote: "E3",
    demoId: "tract-topology",
    resourceIds: ["praat-source-filter", "mit-acoustic-phonetics", "pmc-resonance-effects"],
  },
  {
    slug: "formant-bandwidth",
    priority: 3,
    title: "The effective formant bandwidth is probably smearing the vowels",
    summary:
      "The current `toBiquadQ(formant.Q / 10)` path likely makes the default resonances broader than they need to be.",
    currentBehavior:
      "The real player converts stored formant `Q` values through `toBiquadQ()`. With the common presets, that often yields very broad effective peaks. The dev A/B now demonstrates that with actual player overrides instead of a separate demo engine.",
    whyItMatters:
      "If the resonances are too broad, the vowel envelope gets smeared and all vowels start to sound like variations of the same synthetic body color. That is a direct threat to the basic 'clear sung vowel' goal.",
    acousticModel:
      "Clear vowels need resonances that are defined enough to mark identity without becoming brittle. Overly broad peaks flatten the tract signature into generic coloration.",
    genericAdvice:
      "Generic singing takeaway: if every vowel feels kind of open and generic, the resonances may be too smeared to define a real vowel.",
    rootCause: [
      "Stored preset Q values and Web Audio effective Q are not on the same scale.",
      "The current conversion is simple but easy to make too broad.",
      "Broad resonances reduce vowel contrast before any lyric nuance enters.",
    ],
    implementationMoves: [
      "Use actual-player formant overrides to hear narrower effective bandwidth right away.",
      "Once the better neighborhood is obvious, revisit either the conversion function or the preset table.",
      "Tune for vowel clarity, not just brightness.",
    ],
    codeTargets: [
      {
        file: "src/hooks/usePlayer.ts",
        symbol: "toBiquadQ()",
        note: "Current Q conversion rule.",
      },
      {
        file: "src/constants.ts",
        symbol: "formantDefaults / common vowel presets",
        note: "Current stored Q values that feed the conversion.",
      },
    ],
    verification: [
      "Use the same note and vowel on the real player with broad versus tighter Q values.",
      "Check whether vowel identity becomes clearer in a big way.",
      "Confirm the improvement is tract definition, not just extra edge.",
    ],
    prototype: [
      "First prove the effect with per-note overrides in dev.",
      "Then decide whether the real fix belongs in the conversion helper or in the stored presets.",
      "Retune only a few representative vowels before touching the whole table.",
    ],
    exampleLabel: "Actual player A/B: smeared bandwidth versus clearer bandwidth",
    exampleProblem: "Problem: the resonances are too broad to give the ear a distinct vowel.",
    exampleBetter: "Better: the same player path yields a more clearly defined vowel envelope.",
    listenFor: [
      "Whether `i`, `ɑ`, and `u` separate more clearly.",
      "Whether the vowel suddenly becomes easier to name.",
      "Whether the change is strong enough to feel like a real fix.",
    ],
    recommendedNote: "E3",
    demoId: "formant-bandwidth",
    resourceIds: ["mit-acoustic-phonetics", "praat-source-filter"],
  },
  {
    slug: "note-phases",
    priority: 4,
    title: "The note still arrives and leaves more like a synth event than a sung event",
    summary:
      "The current player mostly gives you gain-ramp onset and generic release, so note phases are simpler than the vocal event you probably want.",
    currentBehavior:
      "In live playback, onset is mostly `sourceGain.gain.linearRampToValueAtTime(...)` and release is mostly `setTargetAtTime(...)`. The dev A/B now uses those exact live controls rather than a custom articulation sandbox.",
    whyItMatters:
      "Once source and tract are credible, this becomes the next obvious realism gap. Notes that begin and end like bare keyboard envelopes undermine the illusion even if the middle is better.",
    acousticModel:
      "A sung vowel is not only a steady-state timbre. It also has a characteristic arrival into pitch and resonance and a characteristic taper out of that state.",
    genericAdvice:
      "Generic singing takeaway: if the attack and release feel like generic envelopes, the note still will not fully read as sung.",
    rootCause: [
      "The main player has one broad onset control and one broad release behavior.",
      "It does not yet have the richer onset ingredients explored in the older dev analysis sandbox.",
      "So the player can sound clean, but still not especially vocal in note-phase behavior.",
    ],
    implementationMoves: [
      "Use the real player to A/B more speechy/generic phase settings versus tighter note-phase settings first.",
      "If the difference is large enough, port richer onset/release modeling into the live engine next.",
      "Keep source and formants frozen while testing phase behavior so you do not confuse variables.",
    ],
    codeTargets: [
      {
        file: "src/hooks/usePlayer.ts",
        symbol: "play() sourceGain scheduling / stopVoice() release scheduling",
        note: "Current live note-phase controls.",
      },
      {
        file: "src/pages/dev/DevAnalysisPage.tsx",
        symbol: "ArticulationDemo",
        note: "Older sandbox sketch of richer articulation behavior that may be worth porting.",
      },
    ],
    verification: [
      "Use the actual player to compare slower duller onset/release settings against tighter phase settings.",
      "Listen only to the first and last quarter-second if needed.",
      "If the difference is obvious, this is a real next-step fix rather than polish.",
    ],
    prototype: [
      "Start by proving the effect with real onsetTime/decayTime and vibrato-onset differences.",
      "Then add richer onset ingredients only if the simplified A/B confirms the importance of note phases.",
      "Avoid overcomplicating onset before source and tract are already improved.",
    ],
    exampleLabel: "Actual player A/B: bare envelope versus more vocal note phases",
    exampleProblem: "Problem: the note starts and stops like a clean synth event.",
    exampleBetter: "Better: the same live player settings feel more like a sung arrival and taper.",
    listenFor: [
      "Whether the note start feels more placed.",
      "Whether the release preserves the sense of one sung event.",
      "Whether the difference is obvious even without lyric content.",
    ],
    recommendedNote: "A3",
    demoId: "note-phases",
    resourceIds: ["praat-klattgrid", "praat-source-filter"],
  },
  {
    slug: "range-retuning",
    priority: 5,
    title: "Range-aware vowel retuning should come after the basic realism fixes",
    summary:
      "This is important, but it is not the first reason the app fails to sound sung.",
    currentBehavior:
      "The real player currently uses one IPA preset per note unless the API or dev page supplies explicit formant overrides. The dev A/B now uses that actual override path to compare static and slightly retuned high-note targets.",
    whyItMatters:
      "Once source, resonance model, and bandwidth are believable, static speech-like vowel targets across the whole range will become the next obvious limiter, especially on high close vowels.",
    acousticModel:
      "Singing often preserves word identity while allowing the tract target to move a little with pitch. That is a second-wave realism improvement, not the first emergency fix.",
    genericAdvice:
      "Generic singing takeaway: keep the lyric recognizable, but let the vowel retune when pitch forces the issue.",
    rootCause: [
      "The base vowel table is static by IPA.",
      "There is no automatic pitch-aware resolver in the live player.",
      "Only explicit per-note overrides can currently simulate that behavior.",
    ],
    implementationMoves: [
      "Use the actual player to prove the benefit with per-note overrides first.",
      "If the win is clear, add a frequency-aware formant resolver ahead of node creation.",
      "Keep this below source and tract fixes in priority, because it cannot rescue a basically synthetic tone by itself.",
    ],
    codeTargets: [
      {
        file: "src/hooks/usePlayer.ts",
        symbol: "connectFormants()",
        note: "Natural place to resolve pitch-aware formant values before node creation.",
      },
      {
        file: "src/constants.ts",
        symbol: "formants.ipa",
        note: "Current base table to layer pitch-aware retuning on top of.",
      },
      {
        file: "src/hooks/useAPI.ts",
        symbol: "per-note formant overrides",
        note: "Current real path for simulating this behavior today.",
      },
    ],
    verification: [
      "Use the actual player to compare static and slightly retuned formants on a high `i` note.",
      "Listen for freer resonance without changing the word too much.",
      "Treat this as a later-stage lever after the earlier big ones.",
    ],
    prototype: [
      "Start with one high-note vowel and one small override recipe.",
      "If that works, build a real `resolveFormantSpec(activeIpa, frequency)` helper.",
      "Only broaden the rule set once the basic source/tract issues are already improved.",
    ],
    exampleLabel: "Actual player A/B: static high-note target versus slightly retuned target",
    exampleProblem: "Problem: the high note stays locked to the base speech-like target and feels trapped.",
    exampleBetter: "Better: a small retune frees the note while keeping the lyric recognizable.",
    listenFor: [
      "Whether the high note opens up in a real way.",
      "Whether the word still reads correctly.",
      "Whether the difference feels useful but secondary to the earlier fixes.",
    ],
    recommendedNote: "A4",
    demoId: "range-retuning",
    resourceIds: ["nats-bozeman-essentials", "nats-vowel-modification", "pmc-resonance-effects"],
  },
];

export const SOUND_TOPIC_BY_SLUG = Object.fromEntries(
  SOUND_TOPICS.map((topic) => [topic.slug, topic]),
) as Record<string, SoundTopic>;
