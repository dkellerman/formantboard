# FormantBoard API (Machine Reference)

## Entry Point

- Global runtime object: `window.fb`

## Validate First

- `window.fb.validatePlay(events)`
- `window.fb.validateFromJSON(payload)`

Both return:

- success: `{ ok: true, value: ... }`
- failure: `{ ok: false, error: string }`

Do not call playback methods until validation succeeds.

## Playback Methods

- `window.fb.play(events, options?)`
- `window.fb.fromJSON(payload)`

### `PlayEvent`

```ts
{
  note: number | string;
  time: number; // seconds from now
  dur: number;  // seconds
  velocity?: number;
  vowel?: "ɑ" | "ɛ" | "ə" | "æ" | "ɔ" | "u" | "ʊ" | "ɪ" | "i";
  volume?: number;
  tilt?: number;
  formants?: Array<{ index: number; on?: boolean; frequency?: number; Q?: number; gain?: number }>;
}
```

### `PlayOptions`

```ts
{
  loop?: false | true | number | "infinite";
  // false: play once
  // true or "infinite": repeat until window.fb.stop()
  // number (>=1): total number of full sequence iterations
}
```

### `PerformancePayload`

```ts
{
  bpm?: number; // if present: time/dur are beats
  loop?: false | true | number | "infinite"; // same behavior as PlayOptions.loop
  voice?: {
    vowel?: "ɑ" | "ɛ" | "ə" | "æ" | "ɔ" | "u" | "ʊ" | "ɪ" | "i";
    volume?: number;
    tilt?: number;
    formants?: Array<{ index: number; on?: boolean; frequency?: number; Q?: number; gain?: number }>;
  };
  notes: PlayEvent[];
}
```

Legacy aliases are accepted in `fromJSON` payload notes (`m/t/d/v/ipa/vol/formantOverrides`) but canonical fields are preferred.

## Voice Methods

- `window.fb.setVoice(opts)`
- `window.fb.setLoop(mode)` // sets default loop mode for future play/fromJSON calls
- `window.fb.getLoop()` // returns current default loop mode
- `window.fb.setVowel(vowel)`
- `window.fb.setFormantActive(index, on)`

Loop guidance:

- Keep looping off by default.
- Only enable loop when the user explicitly asks for it.

## Discovery Helpers

- `window.fb.discovery`
- `window.fb.schemas`
- `window.fb.schemaJson`
- `window.fb.getSchemaJson()`
