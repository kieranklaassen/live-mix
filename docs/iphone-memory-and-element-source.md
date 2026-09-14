# iPhone verification: sample eviction and streaming ElementSource (U18)

Manual checks for R34's memory half — a 45-minute session on an iPhone must
not grow without bound — and for the streaming `ElementSource`, whose
constraints only show on a real device. Run them once on Safari (PWA or tab)
on the phone Kieran uses for sessions, with the screen allowed to lock.

## What changed

- `SampleStore` is now an LRU cache with a byte budget. Decoded stereo PCM
  costs `channels × frames × 4` bytes — about 23 MB per minute at 48 kHz —
  and nothing was ever evicted before. With `budgetBytes` set, the least
  recently used samples that are neither **pinned** (`samples.pin(id)`) nor
  **held** (`samples.retain(id)`, or a `SampleRetainer` following a track's
  preload window) are dropped once a load passes the budget. Defaults are
  unchanged (`budgetBytes: Infinity`, `evictOnRelease: false`).
- `ElementSource` streams long media through an `<audio>` element and a
  `MediaElementAudioSourceNode` into the same graph; `ElementTrack` plays it
  with `AudioTrack`'s envelope math and Schedulable contract.

## Setup

```ts
const engine = createEngine({
  context,
  output: { mode: isIOSWebKit() ? 'element' : 'direct', mediaTitle: 'Session' },
  samples: { budgetBytes: 192 * 1024 * 1024 }, // ≈ 8 minutes of stereo PCM
})
const music = engine.addAudioTrack('music', { lookaheadSec: 5, preloadSec: 12 })
const retainer = new SampleRetainer({
  samples: engine.samples,
  track: music,
  now: engine.now.bind(engine),
  scheduler: engine.scheduler,
})

const bed = new ElementSource(engine.context, { id: 'bed', url: '/beds/forest.mp3' })
const beds = new ElementTrack(engine.context, {
  name: 'beds',
  destination: engine.master,
  now: engine.now.bind(engine),
  lookaheadSec: 5,
  sources: [bed],
  scheduler: engine.scheduler,
})
beds.clips.add({
  id: 'forest',
  sourceId: 'bed',
  startSec: 0,
  offsetSec: 0,
  durationSec: 2700,
  fadeInSec: 4,
  fadeOutSec: 8,
  fadeCurve: 'linear',
  gainDb: -6,
})

startButton.onclick = async () => {
  await context.resume()
  engine.activateOutput() // element-mode output + MediaSession
  await beds.unlockAll() // lets the timer-driven element.play() through later
  engine.transport.start()
}
```

## Checks

1. **Memory stays bounded.** Play a 45-minute playlist of 3-minute tracks with
   `budgetBytes` at 192 MB. Every few minutes log `engine.samples.metrics`:
   `bytes` must stay ≤ `budgetBytes` (or `overBudget` must be true only
   while a track is held), `evictions` must climb by one per finished track,
   and `count` must settle at 2–3. In Safari Web Inspector → Timelines →
   Memory (or Settings → Safari → Advanced → Web Inspector on the phone with
   a Mac attached) the JavaScript heap should plateau instead of climbing
   ~70 MB per track. Without a budget the same run climbs monotonically.
2. **No re-decode thrash.** `metrics.loads` should equal the number of
   distinct tracks played (plus one per deliberate repeat). If `loads` runs
   ahead of that, a sample needed inside the preload window was evicted:
   check the `SampleRetainer` is attached and `graceSec` covers the fade.
3. **No audible seam.** Eviction happens on the main thread after a decode;
   listen through two track boundaries with the budget set low enough (say
   2 tracks) that every boundary evicts. No dropout, no click.
4. **ElementSource bed plays through element-mode output.** With
   `output.mode: 'element'`, the bed must come out of the same `<audio>` the
   mix uses (lock-screen metadata shows, pause on the lock screen mutes the
   whole mix including the bed). Confirm no second lock-screen "now playing"
   card appears for the bed's own element.
5. **Lock the screen.** The bed and the music keep playing with the screen
   locked for at least 10 minutes. The bed's fade-out at `durationSec` lands
   on time (the gain envelope is on the audio clock even though the element
   is paused by a timer).
6. **Scheduled starts after unlock.** A bed clip whose `startSec` is minutes
   into the session must start on its own (timer-driven `element.play()`).
   If it stays silent, `unlockAll()` was not called from the start gesture,
   or Safari refused `play()` — `source.play()` resolves `false` in that case;
   log it.
7. **Late join.** Seek the transport into the middle of a bed clip
   (`transport.seek`). The element must seek to `offsetSec + late` and the
   drawn fade slope still apply (linear) or play from `offsetSec` (equal
   power), as the `AudioTrack` rules say.
8. **CORS.** A bed served from another origin without
   `Access-Control-Allow-Origin` produces silence in the graph (the element
   would play by itself, but the source node receives zeros). Serve beds
   same-origin or with CORS headers; `crossOrigin: 'anonymous'` is the
   default.

## Known differences from AudioTrack (by design)

Listed in `src/core/sources/ElementTrack.ts`: timer-accurate starts and
stops (tens of milliseconds) with drift re-seek, one voice per element,
`loop` from 0 rather than `offsetSec`, seeks instead of `start(offset)` for
late joins, retimed pauses instead of `source.stop(at)`. Keep anything that
must land on a beat on an `AudioTrack`; use elements for beds.

## Record

Note the phone model, iOS version, the metrics log from check 1, and a yes/no
per check in the U18 PR (or the follow-up issue) so the result is on record
before U14 removes the legacy engine.
