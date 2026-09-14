# Samples, memory and streaming beds

**Browser-first, iPhone-honest** (R34): a 45-minute session on an iPhone must
not grow without bound, and long beds must not be decoded into PCM at all.
Decoded stereo PCM costs `channels × frames × 4` bytes — about **23 MB per
minute at 48 kHz** — so the library has one decoded-sample store with a
budget, and a streaming path for anything long.

## SampleStore

`engine.samples` decodes once and hands out `LoadedSample`s by id; clips
reference samples by `sourceId`. It is an LRU cache with an optional byte
budget, **off by default** (`budgetBytes: Infinity`) so Phase 0 behaviour is
unchanged; opt in per engine:

```ts
const engine = createEngine({
  context,
  samples: {
    budgetBytes: 192 * 1024 * 1024, // ≈ 8 minutes of stereo PCM
    peaks: 256, // min/max buckets at decode time, for waveforms (true = 512)
    fetchImpl: fetch.bind(globalThis), // injectable (tests, Rails CSRF fetch, …)
  },
})

await engine.samples.load('stinger', '/music/stinger.mp3') // URL, ArrayBuffer or AudioBuffer
engine.samples.pin('stinger') // never evicted until unpin
const release = engine.samples.retain('intro') // held while a clip uses it
engine.samples.get('intro') // { kind: 'buffer', id, buffer, durationSec, bytes, peaks }
engine.samples.forget('intro') // explicit drop
engine.samples.metrics // { bytes, budgetBytes, count, pinned, held, evictions, evictedBytes, loads, overBudget }
engine.samples.onChange(() => redraw())
```

When a load pushes the total past the budget, the least recently used
samples that are neither **pinned** nor **held** are dropped until it fits
again; a sounding voice keeps its own buffer reference, so a track that is
playing is never cut. Breathwork Live runs at 256 MiB — two long tracks
decoded at once (a crossfade plus the next preload) fit under it.

**Holds follow the schedule.** With `retainSamples` on (the default), every
`AudioTrack` gets a `SampleRetainer` that holds whatever its preload window is
about to play and releases it `DEFAULT_RETAIN_GRACE_SECONDS` after the clip
ends, so eviction can never take a sample the scheduler is about to start.
Adapters that call `AudioTrack.play` themselves (Breathwork Live's
`SectionPlaylist`) pass `retainSamples: false` and hold by hand.

## Streaming beds: `ElementSource` and `ElementTrack`

A 3-minute dawn bed is ~70 MB of PCM on an iPhone; streaming it costs
nothing. `ElementSource` wraps one `<audio>` element and a
`MediaElementAudioSourceNode` into the same graph; `ElementTrack` plays it
with `AudioTrack`'s envelope maths and the same clip records:

```ts
const beds = engine.addElementTrack('beds') // feeds the master unless told otherwise
const forest = beds.addSource(
  new ElementSource(engine.context, { id: 'forest', url: '/beds/forest.mp3' }),
)
beds.clips.add({
  id: 'forest-1',
  sourceId: 'forest',
  startSec: 0,
  offsetSec: 0,
  durationSec: 2700,
  fadeInSec: 4,
  fadeOutSec: 8,
  fadeCurve: 'linear',
  gainDb: -6,
})
await beds.unlockAll() // from the start gesture, so iOS allows the timer-driven play()
```

Element starts are timer-accurate (`ELEMENT_DRIFT_TOLERANCE_SECONDS`), not
sample-accurate; the envelope stays on the audio clock; a source loops behind
a clip that outlives it. The differences from `AudioTrack` and the iPhone
checklist (lock the screen, watch memory over 45 minutes, interruption
recovery) are in
[iphone-memory-and-element-source.md](../iphone-memory-and-element-source.md).
Breathwork Live's ambience is the first streaming consumer
([consumer guide](../consumers/breathwork-live.md)).

## The output terminus

Everything above ends at `engine.output`, the `OutputRouter` — in `element`
mode the one `<audio>` element that keeps playing through a locked iPhone
screen, with `MediaSession` metadata
([getting started §5](../getting-started.md#5-ios-element-output-mode-and-activation)).
Interruption recovery (a phone call) is the host's `context.resume()` on the
next gesture; the transport's anchor makes the position survive it.
