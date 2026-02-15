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

- `window.fb.play(events)`
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

### `PerformancePayload`

```ts
{
  bpm?: number; // if present: time/dur are beats
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
- `window.fb.setVowel(vowel)`
- `window.fb.setFormantActive(index, on)`

## Discovery Helpers

- `window.fb.discovery`
- `window.fb.schemas`
- `window.fb.schemaJson`
- `window.fb.getSchemaJson()`
