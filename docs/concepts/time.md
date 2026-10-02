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

Beside the position inside a pass, the transport counts **how far the
timeline has run since its origin**: `t.elapsed()`, in timeline seconds, with
every pass before the present one counted in, so it does not come back to 0
when the loop wraps. A pause keeps it. A `seek` moves it by as much as it
moves the position (a seek is a move within the pass the transport is in);
`t.seekElapsed(sec)` puts it anywhere on the run, with the position where
that falls in the loop; `stop()` puts it back to 0. `t.contextTimeAtElapsed`
is `contextTimeAt` for a point on the run. `Math.floor(t.elapsed() /
loop.lengthSec)` is the number of passes gone by, a count that survives a
pause and a seek where `iteration` (a name, not a count) does not.

## Loops of their own length

The transport has one loop. A `Cycle` is another, of any length, on the same
timeline: where the transport has run `elapsed()` seconds, the cycle is at
`elapsed() % lengthSec` of its own pass. An audio track follows one when it
is given a loop length:

```ts
const a = engine.addAudioTrack('a', { loopLengthSec: 23.5 })
const b = engine.addAudioTrack('b', { loopLengthSec: 25.9 })
b.loopLengthSec = 29.9 // while playing: moves over at once
b.loopLengthSec = null // back on the transport's loop
```

Such a track repeats its clips at that length over the time the transport has
run, whether or not the transport loops: a clip at `startSec` sounds at
`startSec`, one length later, and so on. Tracks of different lengths start
together at the origin (`elapsed() === 0`, where `stop()` and
`seekElapsed(0)` put the transport), slide apart, and are all at their starts
again when the elapsed time is a multiple of every length. That is how tape
loops of unequal length are made (Brian Eno describes loops of about 23.5,
25.9 and 29.9 s on _Music for Airports_).

A cycle is the slice of `Transport` the scheduler reads (`Timebase`:
`position`, `anchor`, `loop`, `contextTimeAt`) and keeps no clock of its own,
so everything above holds on it as it does on the transport: catch-up after a
stalled timer, the first window from the anchor, entering what is under the
position, `rejoin`. Its passes are numbered like the transport's, never
reused. A schedulable names its clock with `Schedulable.timebase`; when that
is swapped, or the cycle's length changes, the scheduler lets go of what it
handed over on the old clock (what sounds fades over 5 ms) and enters the
clips the new one stands inside. A lane follows a track's loop when
`Automation.add` is given the track's `timebase`; the score renderer does
that for every lane on the track's strip, inserts and device. In a score the
length is the audio track's `loopLengthSec`, set with the `track.loop`
operation. Stretch tracks and element tracks follow the transport's loop.
A cycle's length is in timeline seconds, so the transport's rate (below)
takes every cycle with it: the loops slide against each other exactly as
they would, only sooner or later by the clock.

A timeline stretched for a tempo change (`Transport.rescale`) stretches
`elapsed()` by the same ratio. A host that stretches its clips stretches a
track's `loopLengthSec` with them, and the track then stays where it was in
its own pass and what it has sounding plays on (`Scheduler.rescale`); a
length left as it was puts the track somewhere else in its loop.

A transport loop made shorter than where the position is folds the position
into it, and `elapsed()` moves by as much, so every cycle is somewhere else
too. As with any loop change, what sounds is left to sound; the scheduler
then enters the clips the transport and each cycle have landed inside, on a
track that can be entered partway, rather than waiting for their starts to
come round.

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

## Counted passes, the seed and chance

`iteration` names a handover: it is new after every re-pin, so it cannot say
how far into a piece the loop is. The transport also keeps a **counted pass**
for that:

```ts
t.pass() // 0 the first time through, one more each time the loop comes round
t.passOf(iteration) // the counted pass of a loop pass under the current anchor
t.setPass(13) // go to that pass: a seek to where the transport already is
```

A pause, a seek and a loop change keep the count; `stop()` goes back to 0.
The count and `elapsed()` are one run counted two ways: while the loop keeps
its length `pass()` is `Math.floor(elapsed() / loop.lengthSec)`, `setPass`
takes `elapsed()` to that pass (so every `Cycle` stands where it does on
it), and `seekElapsed` lands on the pass its point of the run is in. A track
on a loop of its own length counts its own passes
(`track.timebase.passOf(iteration)`: how many of its lengths the run held
when that pass began), and a clip on it is drawn on those.

A clip can be left to chance: `chance` (0 to 1, absent = 1) is how likely it
is to sound each time its start comes round. The scheduler draws once per
clip and counted pass, from its `seed`
(`soundsOnPass(clip, pass, seed)`, a hash of the three and nothing else):

```ts
engine.scheduler.setSeed(7) // or `transport.seed` in a score
engine.scheduler.sounds(clip) // on the pass the transport is in
soundsOnPass({ id: 'pad', chance: 2 / 3 }, 14, 7) // any pass, without playing up to it
```

On a pass a clip sits out it is neither started nor entered partway. Nothing
is drawn from the clock or from `Math.random`, so the same seed sits the same
passes out every time the piece is played, a bounce hears what a live pass
heard, and pass 14 can be asked about without playing the thirteen before it.
Raising a clip's chance only adds passes to the ones it already had. A new
seed while playing puts the clips left to chance in step with it at once
(`rejoin`); after changing one clip's `chance`, a host calls `rejoin` for it
like for any other edit. `seededUnit(seed, ...parts)` and
`seededRandom(seed, ...parts)` are the same draws for a host's own choices
(ambient-live's chord Drift), so one seed covers everything a piece leaves to
chance.

A render with the loop off has one pass, so a host that wants several in one
file lays them out end to end and asks `soundsOnPass` which clips each one
has (ambient-live's export does).

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
