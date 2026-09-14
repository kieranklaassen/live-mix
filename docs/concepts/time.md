# Time: seconds first, one clock, one scheduler

**Seconds are the primary time unit; bars and beats are a view** (KD5).
Breathwork Live is clock-driven — a section lasts as long as the coach needs;
ambient-live loops a 32-second canvas. Neither has a tempo, so nothing in the
core does either: clip positions, fades, lane breakpoints, loop lengths and
score fields are all seconds. A `TempoMap` layers bars over that clock for the
grid, quantised launches and warping, and can be absent.

## The anchor

`Transport` never accumulates ticks. It pins one anchor —
`contextTime ↔ positionSec` — when it starts, seeks or re-pins at a loop
boundary, and derives the position from the audio clock on demand:

```ts
const t = engine.transport
t.start() // pins now ↔ position
t.position() // { positionSec, iteration, finished } from context.currentTime
t.pause() // keeps the position; start() re-pins there
t.seek(42) // re-pins; sounding clips are re-evaluated by the scheduler
t.setLoop({ enabled: true, lengthSec: 32 }) // numbered passes: iteration 0, 1, 2 …
t.stop({ fadeSec: 0.75 }) // ramps sounding audio down over fadeSec, then position 0
t.onChange(({ reason, state, position, fadeSec }) => …) // reason: start | pause | stop | seek | loop | end
```

Loop passes are **numbered** and never reused across re-pins, so a scheduled
start is identified for ever by `clipId:iteration:startSec`. With the loop off
and a `lengthSec` set, the transport pauses at the end (reason `end`,
`position().finished`); with no length it runs on.

## The scheduler

One `Scheduler` loop runs on a timer (never `requestAnimationFrame`: background
tabs keep playing), ticking every `tickMs` (ambient-live 40, Breathwork Live
100). On each tick it asks every schedulable track for the clips whose starts
fall inside `[now, now + lookaheadSec]` — wrapping into the next loop pass —
and hands each one to the graph exactly once, keyed by
`clipId:iteration:startSec`. Two consequences the apps depend on (R7):

- **Catch-up, not replay.** After a throttled timer (a backgrounded tab, a
  4-second stall) the next tick sees everything due since the anchor and
  schedules it at its true time; nothing due is skipped, nothing plays twice.
- **Late join.** A clip that should already be sounding starts mid-way
  (`offsetSec` advanced, fade-in shortened), the way ambient-live's
  `clip-player` did.

Per track, `lookaheadSec` is how far ahead starts are handed to the graph and
`preloadSec` how far ahead decoding begins (Breathwork Live: 5 s and 12 s).
The same loop drives automation lanes ahead of the playhead
([automation](./automation.md)).

## Clips

A clip is a plain record — nothing to construct:

```ts
interface Clip {
  id: string
  sourceId: string // key in the SampleStore
  startSec: number
  offsetSec: number // where playback enters the source
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  fadeCurve: 'linear' | 'equalPower'
  gainDb: number // per-clip loudness trim, clamped to ±MAX_CLIP_GAIN_DB
  loop?: boolean // loop the source when the clip outlives it
  warp?: { sourceSec: number; beat: number }[] // stretch source only
  semitones?: number // stretch source only
}
```

`track.clips` is a `ClipList`: `add`, `update`, `remove`, `set`, `clear`, and
`replaceFrom(fromSec, clips)` — the steer primitive: everything from `fromSec`
on is replaced **without truncating what is sounding**, boundaries move
instead of cutting (R6; Breathwork Live's calmer/stronger/change). The pure
clip maths (`fadeGain`, `clipsInWindow`, `computePeaks`, equal-power curves)
is exported from the core entry for UIs and tests.

## Tempo, warping and key

`TempoMap` is piecewise-constant BPM and meter: `secondsToBeats`,
`beatsToSeconds`, `barBeatAt`, `quantize(sec, 'bar' | 'beat' | n)`. It is a
view: the score carries it (`format ≥ 2`), the [session grid](./session-grid.md)
quantises launches on it (`quantizeLaunch`: the next bar, beat, n bars or a
period in seconds), nothing in the transport depends on it.

`StretchSource` plays a decoded buffer through a
[`signalsmith-stretch`](https://www.npmjs.com/package/signalsmith-stretch)
worklet (MIT; an **optional peer** — the library imports nothing from it and
takes the package's factory as an argument) with tempo-synced rates from warp
markers and pitch in semitones, and reports the node's latency for delay
compensation.

Key matching is the Camelot rule Breathwork Live's selector and server share
(same number or ±1 wrapping 1–12, letter-agnostic, unparseable codes compatible
with everything): `camelotCompatible`, `camelotDistance`, `transposeCamelot`,
`keyMatch(anchor, candidate, { maxSemitones })`, `rankByKeyMatch`.

## Offline is the same clock

`renderOffline` builds the same engine on an `OfflineAudioContext`, replaces
the timers with a virtual clock and steps the scheduler and automation through
the whole duration before `startRendering()`. Because everything is anchored
to one clock, the offline render issues the same source starts and the same
`AudioParam` events the live engine does — the render-equals-live golden in
`src/core/render/__tests__` asserts exactly that ([render](./render.md)).
