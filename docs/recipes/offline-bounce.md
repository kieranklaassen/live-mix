# Recipe: an offline bounce

Render an arrangement to a WAV that is identical to what the live engine
would have played — F4 in the plan — plus stems, and the same from a score
document. Everything here runs in a browser (`OfflineAudioContext`) or, on
the recording mocks, in Node.

## 1. From code you already have

The `build` callback is the same code that builds the live session, run on a
fresh engine over an offline context:

```ts
import { renderOffline, wavBlob } from '@kieranklaassen/live-mix'
import { createDattorroReverb, createTruePeakLimiter } from '@kieranklaassen/live-mix/dsp'

const bounce = await renderOffline({
  durationSec: 180,
  sampleRate: 48_000,
  engine: { samples: { peaks: false } },
  build: async (engine) => {
    await engine.master.installLimiter((ctx) => createTruePeakLimiter(ctx)) // yes, offline too
    const hall = engine.addReturnTrack('hall', {
      device: await createDattorroReverb(engine.context),
    })
    const music = engine.addAudioTrack('music', { lookaheadSec: 5 })
    music.strip.sends.add(hall, { level: 0.3 })
    await engine.samples.load('a', '/music/a.mp3')
    music.clips.add({
      id: 'a',
      sourceId: 'a',
      startSec: 0,
      offsetSec: 0,
      durationSec: 180,
      fadeInSec: 2.5,
      fadeOutSec: 2.5,
      fadeCurve: 'equalPower',
      gainDb: -3,
    })
  },
})

const link = document.createElement('a')
link.href = URL.createObjectURL(wavBlob(bounce.audio, { bitDepth: 24 }))
link.download = 'bounce.wav'
link.click()
bounce.engine.dispose()
```

What happens: the renderer builds the engine with a virtual clock, runs
`alignLatency({ liveInputs: true })` so plugin delay compensation matches the
live mix, steps the scheduler and the automation loop through the whole
duration (plus lookahead) so every source start and `AudioParam` event is
issued exactly as live, then `startRendering()`. `bounce.latency` is the
report. WASM devices and worklets render offline in Chromium and Firefox;
the legacy main-thread `Ducker` and analyser meters cannot — use
`mode: 'worklet'` for a ducked bounce.

## 2. Stems

```ts
import { renderStems } from '@kieranklaassen/live-mix'

const stems = await renderStems({ durationSec: 180, stems: ['music', 'voice'], build })
stems.master.audio // the full mix
stems.music.audio // music soloed in place: its sends and returns follow
for (const result of Object.values(stems)) result.engine.dispose()
```

One render per stem, sequential to bound memory; the build runs again each
time with `info.stem` set, then the stem's track is soloed in place. Stems
share the master's alignment, so they sum back to it.

## 3. From a score

```ts
import { ScoreDocument, renderScore, renderScoreStems } from '@kieranklaassen/live-mix'

const document = ScoreDocument.parse(json, { devices })
const bounce = await renderScore(document.score, {
  durationSec: 240,
  renderer: { resolveSource: (source) => source.url }, // how a score source becomes a SampleSource
})
const stems = await renderScoreStems(document.score, { durationSec: 240, stems: ['pad', 'keys'] })
```

`renderScore` loads the document onto the offline engine through the same
`ScoreRenderer` `loadScore` uses live. Live-input and element tracks (media
elements play in real time only) are dropped first, with their lanes and
routes. The playground's **Render offline** button is exactly this call on
its demo document — agent edits included ([react § playground](../react.md#the-playground)).

## 4. Prove render equals live

```ts
import { maxAbsDifference } from '@kieranklaassen/live-mix'

const a = await renderOffline({ durationSec: 30, build })
const b = await renderOffline({ durationSec: 30, build })
maxAbsDifference(a.audio, b.audio) // 0: a bounce is a pure function of the arrangement
```

The library's own goldens go one step further: `src/core/render/__tests__`
and `src/score/__tests__` compare an offline render's source starts and
`AudioParam` events against a live engine following the same build or the
same score on the recording mocks, and `pnpm test:browser` does it with real
audio in headless Chrome — the offline schedule equals the mock golden, and a
live capture matches the offline render within tolerance
([render § goldens](../concepts/render.md#goldens)).

## 5. In Node

Node has no `OfflineAudioContext`; `createContext` is injectable, which is
how the goldens run:

```ts
import { createMockOfflineContext, scheduleSnapshotOf } from '@kieranklaassen/live-mix/testing'

const result = await renderOffline({
  durationSec: 8,
  createContext: (options) => createMockOfflineContext(options) as unknown as OfflineContextLike,
  build,
})
const offline = (result.engine.context as unknown as MockOfflineAudioContext).scheduleSnapshot()
const live = scheduleSnapshotOf(liveMockContext) // { sources, params }: every start/stop and AudioParam event
expect(offline).toEqual(live)
```

The mock offline context records the same node and parameter events as the
live mock, so `scheduleSnapshot()` is the render-equals-live comparison. For
real samples in Node, decode into `AudioBuffer`-shaped objects and pass them
to `engine.samples.load(id, buffer)`; the encoder side (`encodeWav`,
`decodeWav`) is pure and runs anywhere.
