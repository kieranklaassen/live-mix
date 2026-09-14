# The session grid: scenes, slots, quantised launch, follow actions (U31)

Scenes × clip slots over the same clip model as the arrangement (plan R8,
KD5). A slot holds a clip and its launch settings; launching places the clip
on its track at the next grid line of the tempo map; a scene launches a row
at once; follow actions chain slots into generative structure. Everything
the grid does is an operation on the score document, so the arrangement view
shows what the grid played and undo takes a launch back.

```ts
import { Session, ScoreDocument, TempoMap, createEngine, loadScore } from '@kieranklaassen/live-mix'

const engine = createEngine({ context })
const document = ScoreDocument.parse(json, { devices: engine.devices })
loadScore(engine, document) // the graph follows the document

const session = new Session({ document, engine, tempo: TempoMap.constant(124) })
session.launchScene('verse') // every slot in the row, on the next bar
session.launchSlot('kick-chorus') // one slot; the track's playing slot ends on the same line
session.stopAll() // on the next bar
document.undo() // the launch never happened
```

## Model

```
Score (format 2)
├─ transport.quantize: LaunchQuantize          global launch grid, default 'bar'
├─ scenes[]  { id, name }                       rows
└─ slots[]   { id, track, scene, clip: SlotClip | null, quantize?, launchMode, legato, follow? }
                                                one per audio track × scene

SlotClip         Clip without `id` and `startSec`: sourceId, offsetSec, durationSec, fades,
                 fadeCurve, gainDb, loop?, warp?, semitones?
LaunchQuantize   'none' | 'bar' | 'beat' | n (bars) | { seconds }
LaunchMode       'trigger' | 'gate' | 'toggle'
ScoreFollowAction { a, b: FollowActionKind, chance (P of A), time?: { unit: 'bars' | 'seconds', value } }
FollowActionKind 'none' | 'stop' | 'again' | 'previous' | 'next' | 'first' | 'last' | 'any' | 'other'
SlotState        'empty' | 'stopped' | 'queued' | 'playing' | 'recording'
```

A cell without a slot record is empty and a scene launch leaves that track
alone; a slot with `clip: null` is a **stop button** — launching it (or the
scene) stops the track on the grid. `recording` is reserved for the recorder
(U33); the runtime never enters it yet.

Format 1 documents migrate: `migrateScore` adds empty `scenes`/`slots` and
`transport.quantize: 'bar'`. Validation checks that a slot's track is an
audio track, its scene exists, its cell is unique, its clip's source exists,
and its settings are well-formed.

### Operations

| Operation            | Effect                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| `transport.quantize` | `{ quantize }` — the global launch grid                                            |
| `scene.add`          | `{ scene, index? }`                                                                |
| `scene.remove`       | `{ id }` — takes the scene's slots with it; inverse restores them at their indices |
| `scene.move`         | `{ id, index }`                                                                    |
| `scene.rename`       | `{ id, name }`                                                                     |
| `slot.add`           | `{ slot, index? }` — the cell must be a free audio track × scene                   |
| `slot.remove`        | `{ id }`                                                                           |
| `slot.update`        | `{ id, patch }` — cell, clip, `quantize`/`follow` (`null` clears), mode, legato    |

`track.remove` cascades onto the track's slots (and restores them on undo);
`source.remove` is refused while a slot clip uses the source. All are
discrete (never coalesce). Namespaced `scene.*` / `slot.*` so the agent
registry (U29) can pick them up without collisions.

## Launches are arrangement clips

**Decision: launched clips go on the track's arrangement lane**, not a
separate session lane.

- A launch is `clip.add` at the quantised time: `{ id: '<slot>@<n>', …slotClip, startSec }`.
  A looping slot clip is placed `openEndSec` long (default 3600 s) — "until
  stopped" — and a one-shot with its own duration.
- A stop is `clip.trim` to the stop boundary (`clip.remove` when the launch
  had not started). A scene launch or a stop-all is one `batch`; every
  launch is one undo step.
- Because the `ScoreRenderer` hands the placed clip to the track's
  `AudioTrack`, whose `Scheduler` window turns the start into
  `source.start(when)` at `transport.contextTimeAt(startSec)`, the grid
  plays through exactly the path the arrangement plays through — same
  voices, fades, trim and sample retention — and what you performed is what
  the arrangement now contains (the "grid ↔ arrangement capture" of R23).

The one thing the document cannot express is the end of a voice already
sounding: the scheduler leaves sounding starts alone when their clip
changes (so an arrangement edit never cuts audio in flight). A stop
therefore also fades the live voice on the rendered `AudioTrack` (found on
the engine by the track's id): the clip's own `fadeOutSec` before the
boundary, or a 5 ms de-click when it has none. Pending voices need nothing —
the renderer re-derives them from the trimmed clip.

Consequences, by design:

- **Undo** removes the placed clip; the scheduler silences its voice at
  once. Redo restores the document; the runtime does not re-adopt a clip it
  no longer tracks (it is an arrangement clip from then on).
- **Transport stop / seek / loop change** trim every open launch to where
  the playhead was (a launch that never started is withdrawn) and clear the
  runtime; **pause** keeps them — resuming continues the clips. Seeking back
  into a placed clip replays it as arrangement audio while the slot reads
  `stopped`.
- **Transport loop on**: launches quantise inside the pass, a grid line past
  the loop end wraps into the next pass (the slot stays `queued` until the
  seam), and placed clips replay on every pass like any arrangement clip.
  A session performance is meant to run with the loop off.
- **Immediate launches** (`'none'`, or a grid line already reached) are
  placed `immediateLeadSec` (default 50 ms) ahead of the playhead: the
  scheduler skips a start behind the playhead rather than replaying it, and
  the renderer applies the edit a microtask later.

## Quantisation

`quantizeLaunch(tempo, sec, grid)`: the next grid line at or after `sec`, or
`sec` itself when it is on the grid. `'bar'` and `'beat'` are
`TempoMap.quantize`; a number `n` is the next multiple of `n` bars from the
origin (2, 4, 8 bars…); `{ seconds }` is the next multiple of a period on
the clock. Resolution order: the call's `quantize` → the slot's → the
score's `transport.quantize`. AE3 holds: a launch 300 ms before the bar
starts on the bar.

Follow times: `followTimeSeconds(tempo, fromSec, { unit, value })` — bars
are measured on the tempo map from the launch position (through tempo
changes), seconds pass through; absent, the follow time is the slot clip's
`durationSec` (one pass).

## Launch modes, legato, one clip per track

- `trigger`: press launches; pressing a playing slot retriggers it from the
  top on the next grid line; release is ignored.
- `gate`: press launches, `releaseSlot` stops — both quantised. A release
  before the start withdraws the launch.
- `toggle`: press launches when stopped (or when a stop is already placed),
  stops when queued or playing.
- **One clip per track**: launching a slot closes the track's queued launch
  (withdrawn) and its playing launch (trimmed to the new start, voice faded
  there).
- **Legato**: the incoming clip enters at the position the outgoing one had
  reached (modulo the outgoing clip's `durationSec` while it loops), wrapped
  into the incoming clip while that loops; a one-shot with nothing left only
  closes the outgoing slot. Note the `AudioTrack` loops a looping clip from
  its `offsetSec` to the source end, so a legato entry into a looping clip
  shifts its loop region — exact loop-region playback is the `StretchTrack`
  follow-up (see below).

## Follow actions

Evaluated on the scheduler tick, `lookaheadSec` (default 0.5 s) ahead of the
follow time so the next clip is placed before the scheduler's window reaches
its start. `drawFollowAction({ a, b, chance }, random)` picks A with
probability `chance` from the injected `random` (seed it in tests);
`resolveFollowAction(kind, slot, column, random)` resolves it against the
**column** — the track's slots that hold a clip, in scene order:

| Kind                | Outcome                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `none`              | keep playing; the follow time re-arms (the draw repeats)               |
| `stop`              | stop at the follow time                                                |
| `again`             | relaunch the slot from its start                                       |
| `previous` / `next` | the neighbour in the column, wrapping                                  |
| `first` / `last`    | the column's ends                                                      |
| `any`               | a uniform draw over the column, including the slot                     |
| `other`             | a uniform draw over the column excluding the slot (`again` when alone) |

A follow-driven launch is placed exactly at the follow time (no
quantisation) and closes the current slot there, so chains are gapless:
`[8, 10) verse, [10, 12) chorus, [12, 14) verse …`. Removing a slot mid-play
leaves its placed clip sounding; its follow action is gone with it.

## Runtime API

`new Session({ document, engine?, tempo?, random?, lookaheadSec?, immediateLeadSec?, autoStart?, openEndSec?, author? })`

- `launchSlot(id, { quantize? })`, `releaseSlot(id)`, `launchScene(id)`,
  `stopSlot(id)`, `stopTrack(trackId)`, `stopAll()`, `setQuantize(grid)`.
  With `autoStart` (default on) a launch starts a stopped transport.
- `status(slotId)` → `{ state, clipId, startSec, endSec, stopping, followAtSec }`,
  `statuses()`, `cellState(track, scene)`, `trackStatus(track)` →
  `{ playing, queued }`, `tracks()`, `quantize`, `score`, `version`.
- `onChange(listener)` fires after launches, stops, ticks that changed a
  state, and document changes. `tick(positionSec)` runs one evaluation by
  hand (the engine's `Scheduler.onTick` drives it otherwise); `dispose()`.
- Without an `engine` the session is a pure editor: operations on the
  document, states from hand-driven ticks.

`Scheduler.onTick(listener)` is new and additive: `{ position, timelineSec,
reason }` after every pass, `reason` being `timer | start | seek | loop |
refresh | register | manual`.

### React (`./react`)

`useSession(session)` → `{ scenes, tracks, cells[scene][track], statuses,
quantize, version, launchScene, launchSlot, releaseSlot, stopSlot,
stopTrack, stopAll, setQuantize }`; `useSlot(session, id)` → `{ slot,
status, state, playing, queued, stopping, launch, release, stop }`. Both
subscribe through `useSyncExternalStore` on `session.version`. The styled
grid component is the U25 kit's.

## Not in this unit

- Warped (tempo-synced) slot clips: `Clip.warp`/`semitones` are carried
  through slots and placed clips, but the `AudioTrack` plays them unwarped.
  A scheduler-driven `StretchTrack` over `StretchSource` (U32) is the
  integrator's follow-up; the session needs nothing more than a track kind
  whose clips it can place through `clip.add`.
- Recording into slots (`recording` state) — U33.
- Scene tempo / time signature, clip launch offsets, velocity, MIDI mapping
  (U36 maps controllers to `launchSlot`/`launchScene`).
