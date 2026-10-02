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
t.setRate(0.98) // the timeline runs 2% slow against the clock from here on
t.onChange(({ reason, state, position, fadeSec }) => …) // reason: start | pause | stop | seek | loop | end | rate
```

Loop passes are **numbered** and never reused across re-pins, so a scheduled
start is identified for ever by `clipId:iteration:startSec`. With the loop off
and a `lengthSec` set, the transport pauses at the end (reason `end`,
`position().finished`); with no length it runs on.

## Rate: the timeline against the clock

`transport.rate` is how many timeline seconds pass in one second of the audio
clock: 1 by default, and `setRate` changes it while the transport plays, the
way a hand on a tape reel does. The transport re-pins where it is, on the pass
it is in, so the position carries on without a jump and no pass is renumbered;
`position()` and `contextTimeAt()` take the rate into account, and listeners
hear reason `rate`.

Everything positioned on the timeline stays in timeline seconds (clip starts
and lengths, fades, lane breakpoints, the loop). What changes is how far apart
those fall on the clock:

- The **scheduler** looks the same clock time ahead, so further along a faster
  timeline. On a change it cancels starts that have not begun and hands them
  over again at their new clock times, and tells each schedulable the rate
  (`Schedulable.retime`).
- An **audio track** plays its linear clips at the rate as tape would: the
  buffer is read that much faster or slower (`playbackRate`), so a clip sounds
  higher and shorter or lower and longer, and what is left of a sounding
  clip's fades and its end are written again where the clip now reaches them.
  `track.setRate(rate, at)` does the same for a track played by hand.
- **Lane automation** writes its breakpoints at the clock times the rate gives
  them and, on a change, holds and ramps back onto the lane like after a seek.

What does not follow: equal-power clips (Breathwork Live's, which runs on the
clock alone) play at the clock's speed; stretch and element tracks start their
clips at the right moment but play them at the clock's speed; instruments,
live input and device tails are not on the tape at all. The rate is a live
control, not part of the score, and `renderOffline` renders at whatever rate
the engine's transport has (1 unless the host set one).

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
- **The first window starts at the anchor.** The audio clock is the audio
  thread's, so it can move on between `start()` (or `seek()`) pinning the
  anchor and the scheduler's first look, in the same task. That first window
  runs from the anchor's own position, not from wherever the clock has got
  to, so a clip that starts exactly where you pressed Play is handed over
  (and joined a few milliseconds late) rather than left until the loop comes
  round.
- **What is under the playhead sounds.** A track that can enter a clip
  partway (`joinsLate`: audio and stretch tracks) is also handed the clips
  the position is already inside, so pressing Play in the middle of a clip,
  or seeking into one while playing, plays it from that point in it instead
  of leaving it silent until its start comes round. The same goes for a start
  the track declined (its sample was still decoding when the playhead reached
  it): it comes in where the clip has got to as soon as it can be taken. A
  clip entered this way eases in over 5 ms (`JOIN_EASE_SECONDS`), since there
  is no silence before it to hide a cut. Equal-power clips are the exception:
  their envelope is written from the start, so they wait for it. So is the
  far side of the loop: a clip that runs past the loop's end keeps sounding
  into the next pass when the loop comes round by itself, but a start or a
  jump enters only what is drawn under the playhead, not what would have
  carried over from a pass that was never played.
- **Edits while playing.** `refresh()` (which every clip-list change calls)
  keeps what is sounding and re-derives what is pending; a clip cut short of
  the playhead stops. It does not start anything whose start has passed. To
  hear an edited clip at once, call `engine.scheduler.rejoin([clipId, …])`
  after the edit: what those clips have sounding fades out over 5 ms, and each
  one the playhead is inside is entered again as it now is (moved under the
  playhead, lengthened over it, new fades, another slice, reversed). A clip
  still sounding over the loop's end from the pass before comes back under
  the start it had; the scheduler remembers a handover until its clip is
  over, through a loop change too, so the old voice is always the one let go.
  A clip that is sounding but could not come back at once is left as it sounds
  (`Schedulable.keeps`): an equal-power clip, and any clip on a stretch
  track, whose source takes time to build. A host decides which edits ask for
  this; the library does not rejoin by itself, because a host may already be
  playing that pass of a clip by other means.

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

`StretchTrack` (`engine.addStretchTrack(name, { createStretch })`) is the clip
track over it, with the `AudioTrack` shape (`clips`, `strip`, `attach` /
`detach`, `voices()`, `fadeOutVoice`, `stop`, `stopAll`): stretch nodes are
built ahead by the preload schedulable (one per start; a start whose node is
not ready is declined and offered again), rates come from the clip's warp
markers on `engine.tempo` (a late join rebases the remaining segments), and a
looping clip cycles `[loopStartSec, loopEndSec)` while entering anywhere in it
— what the session grid's legato launches need. In the score an audio track
marked `stretch: true` renders as a `StretchTrack` when `loadScore(engine,
doc, { createStretch })` has the factory; without it the render fails loudly
rather than playing unwarped.

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
