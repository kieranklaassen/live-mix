# The score: document, operations, undo, rendering (U28)

The score is the source of truth for arrangement, automation and device
graphs (plan KTD8 / KTD16, approach C). It is plain JSON with a format
version; everything that edits it is an `Operation`; every operation is
logged with its author and time; undo and redo apply stored inverses; and a
`ScoreRenderer` makes a live `Engine` follow the document through nothing
but the engine's public API. Live input and in-flight gestures stay live —
the document declares them, it does not carry their audio.

```ts
import { createEngine, ScoreDocument, loadScore, parseScore } from '@kieranklaassen/live-mix'

const engine = createEngine({ context })
const document = ScoreDocument.parse(json, { devices: engine.devices })
const renderer = loadScore(engine, document) // the graph now follows the document

document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.6 }, { author })
document.apply({ type: 'clip.move', track: 'kick', id: 'b1', startSec: 6 })
document.undo() // one step, even for a whole fader drag
renderer.liveInput('voice').attach(stream) // live audio is the app's

localStorage.setItem('score', document.serialize())
```

## Schema (`format: 3`)

Seconds are the only time unit; the tempo map is a view on them. Every id is
a string chosen by the author; `'master'` is reserved. Track, element track,
group and return ids share one namespace (they are also the engine names);
device instance ids share another; clip ids are unique per track.

Format history: **1** (U28) — everything below except `tempo` and
`elementTracks`; **2** (U33) — adds them, migration `1 → 2` fills defaults
(120 BPM, no element tracks). U31 takes `format: 3` for scenes and slots.

```
Score
├─ format: 3, id, name
├─ transport.loop { enabled, lengthSec | null }       null = no end
├─ transport.quantize: LaunchQuantize                 session launch grid (U31), default 'bar'
├─ tempo[]     TempoSegment { atSec, bpm, beatsPerBar? }  ascending, first at 0 → engine.tempo (TempoMap)
├─ master { level, inserts: ScoreDevice[] }
├─ sources[]   { id, url?, durationSec?, analysis? }  what clips reference
├─ tracks[]    kind 'audio' | 'live' | 'instrument'
│    { id, name, destination, strip, …
│      audio:      lookaheadSec?, preloadSec?, clips: Clip[]
│      live:       (declared only — audio attached by the app)
│      instrument: device: ScoreDevice (a NoteDevice in the registry) }
├─ elementTracks[] { id, name, destination, lookaheadSec?, preloadSec?, clips: Clip[] }
│                  streamed beds (U18 ElementTrack): no strip, clips need a source with a url
├─ groups[]    { id, name, destination, strip }        summing strips; a forest
├─ returns[]   { id, name, destination, strip, device: ScoreDevice }
├─ lanes[]     { id, target: ParamTarget, defaultValue?, breakpoints: Breakpoint[] }
├─ modulators[] { id, kind: 'lfo' | 'random' | 'macro' | 'external-phase', … }
├─ routes[]    { id, source: modulatorId, target: ParamTarget, depth, polarity }
├─ scenes[]    { id, name }                            session grid rows (U31)
└─ slots[]     { id, track, scene, clip: SlotClip | null, quantize?, launchMode, legato, follow? }

ScoreDestination  { kind: 'master' } | { kind: 'group', id }
ScoreStrip        { level, pan, inputGain, mute, solo, soloSafe, inserts: ScoreDevice[], sends: ScoreSend[] }
ScoreDevice       { id, deviceId (registry id), preset?, params: { name: number }, bypass }
ScoreSend         { target: returnId, level: number | null }   null = direct connection
ParamTarget       { kind: 'strip', owner: id | 'master', param: 'level' | 'pan' | 'inputGain' }
                | { kind: 'device', device: instanceId, param: name }
Clip              the core `Clip` record (id, sourceId, startSec, offsetSec, durationSec, fades, gainDb, loop?)
Breakpoint        the core `Breakpoint` (timeSec, value, curve?)
```

A device's effective parameters are the descriptor defaults, overlaid by
the named `preset` (if any), overlaid by `params`. Unknown params are
ignored on render; a registry-aware validation (`validateScore(score, {
devices })`, which the renderer runs before touching the graph) reports
them.

- `createScore({ id, name })` — an empty document.
- `validateScore(input, { devices? })` → `ScoreIssue[]` (path + message);
  `assertValidScore` throws `ScoreValidationError`.
- `parseScore(json | object, { devices? })` — migrate → validate →
  normalise. `serializeScore(score)` is stable (canonical field order, clips
  sorted by start, `curve: 'linear'` and `loop: false` dropped), so equal
  documents serialise identically and diff well.
- `migrateScore(raw)` — migrations by format, applied in order (`1 → 2`:
  `elementTracks: []`, `tempo: defaultTempo()`; `2 → 3`: `scenes: []`,
  `slots: []`, `transport.quantize: 'bar'`). Newer formats throw.
- Lookups: `findTrack/findElementTrack/findGroup/findReturn/findStripHost`,
  `stripHosts`, `allDevices`, `findDevice`, `targetKey`; `normaliseTempo`,
  `sameTempo`; `findScene`, `findSlot`, `slotAt`.

## Operations

Plain JSON records with a stable `type` — the vocabulary the agent API (U29)
will expose. `apply(score, op)` is pure and returns a new score (untouched
branches are shared); `invert(score, op)` computes the undo against the
pre-state; `applyWithInverse` does both. Anything that does not fit the
score throws `ScoreOperationError`, so a failed operation changes nothing.

| Group                                                             | Operations                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document                                                          | `score.rename`, `transport.loop`                                                                                                                                   |
| Sources                                                           | `source.add`, `source.remove` (refused while a clip uses it)                                                                                                       |
| Tracks                                                            | `track.add`, `track.remove`, `track.move`                                                                                                                          |
| Groups                                                            | `group.add`, `group.remove` (members re-route to where it fed), `group.move`                                                                                       |
| Returns                                                           | `return.add`, `return.remove` (sends to it are dropped), `return.move`                                                                                             |
| Strips (any track/group/return; `'master'` for level and inserts) | `strip.rename`, `strip.route`, `strip.set` (level/pan/inputGain), `strip.mute`, `strip.solo`, `strip.soloSafe`                                                     |
| Clips                                                             | `clip.add`, `clip.remove`, `clip.move`, `clip.trim`, `clip.update`, `clip.replaceFrom` (Breathwork Live's steer: drop everything from `fromSec`, add the new plan) |
| Devices (by instance id)                                          | `device.add`, `device.remove`, `device.move`, `device.setParam`, `device.setParams` (`null` clears), `device.preset`, `device.bypass`                              |
| Sends                                                             | `send.add`, `send.remove`, `send.set`                                                                                                                              |
| Lanes                                                             | `lane.add` (one per parameter), `lane.remove`, `lane.setBreakpoints`, `lane.addBreakpoint`, `lane.removeBreakpoint`                                                |
| Modulators                                                        | `modulator.add`, `modulator.remove` (routes go with it), `modulator.update`                                                                                        |
| Routes                                                            | `route.add`, `route.remove`, `route.update`                                                                                                                        |
| Session grid (U31, [`docs/session.md`](./session.md))             | `transport.quantize`, `scene.add`, `scene.remove` (its slots go with it), `scene.move`, `scene.rename`, `slot.add`, `slot.remove`, `slot.update`                   |
| Composite                                                         | `batch { ops, label? }` — one step; inverse is the reversed inverses                                                                                               |

Removals cascade: a track takes the lanes and routes on its strip and
devices with it (and its session slots), a group re-routes its members, a
return drops the sends that fed it, a device drops its lanes and routes, a
modulator its routes, a scene its slots.
Their inverses are `batch` operations that restore every piece at its
original index, so `apply(invert(op), apply(op)) ≡ score` for every
operation — the property test in `operations.test.ts` applies 150 random
operations per seed and checks undo, redo and the inverse of the inverse.

`OPERATION_TYPES` lists the vocabulary, `isOperation` recognises a record,
`describeOperation` gives a short label for history lists.

## Log and history

`OperationLog` is append-only: every `apply`, `undo` and `redo` becomes an
entry `{ seq, op, inverse, author: { id, kind: 'human' | 'agent' | 'system'
}, atMs, kind, ref?, gesture?, label? }`. Undo does not rewind the log —
it appends the inverse (with `ref` to the entry it undoes), so the log is a
complete transcript for feedback loops. Checkpoints (full score snapshots,
every 50 entries by default, plus seq 0) make `scoreAt(seq)` a bounded
replay. `serializeLog` / `parseLog` round-trip it.

`History` holds the undo and redo stacks over that log. `ScoreDocument` ties
score, log and history together and notifies listeners.

### Undo granularity for continuous gestures (decision)

One undo step per gesture. A fader drag, a knob turn, a clip drag or a lane
paint stroke emits many operations; consecutive operations with the same
`coalesceKey` (same operation type and same target — `strip.set` on one
strip parameter, `device.setParam` on one device parameter, `send.set`,
`clip.move`, `clip.trim`, `lane.setBreakpoints`, `modulator.update`,
`route.update`) from the same author fold into one history step while they
belong to the same gesture:

- tagged: `document.apply(op, { gesture: 'drag-42' })` — operations with the
  same id coalesce regardless of timing; a different id, or a tagged op after
  an untagged one, starts a new step;
- untagged: operations arriving within `coalesceWindowMs` (default 500 ms)
  of the previous one coalesce; a longer gap starts a new step;
- `document.endGesture()` (pointer-up, an agent turn boundary) and any undo
  or redo end the current step.

The step keeps the _first_ inverse and the _latest_ operation, so undo lands
where the hand started and redo where it let go. Discrete edits (add,
remove, route, mute, preset, batch) never coalesce. The log still records
every intermediate operation. 500 ms is the default because it separates
"the hand moved again" from "the hand came back": UIs that know their
pointer lifecycle should tag gestures instead. U30 layers controller
arbitration (human vs agent vs automation) on top of this.

## Rendering: the graph follows the document

`loadScore(engine, scoreOrDocument, options)` installs a `ScoreRenderer`
(one per engine; `scoreRendererOf(engine)`, `unloadScore(engine)`). Given a
document it renders on every change (bursts fold into one pass); given a
plain score it renders once. `renderer.render(score)` is serialised — a
request during a pass lands afterwards with the latest score — and
`whenIdle()` resolves when the engine reflects the last request. The
renderer validates against the device registry before touching the graph,
so an unknown device or preset never leaves the engine half-changed
(`onError` receives failures from document-driven renders).

The renderer diffs the previously rendered score against the next one and
issues exactly the calls an app would make by hand: `addGroup` (parents
first) → `addReturnTrack` → `addAudioTrack` / `addLiveInputTrack` /
`addInstrumentTrack` → `strip.connectTo` → `setLevel/setPan/setInputGain/
setMute/setSolo` → `addInsert`/`removeInsert` + `setParam`/`bypass` →
`strip.sends.add/remove` → `clips.set` → lanes and routes. Defaults are never
written, so an untouched strip stays node-free and Phase 0 node order holds.
The golden test (`golden.test.ts`) builds the same arrangement through the
document and by hand and asserts identical node kinds, creation order,
connections and AudioParam event streams — before playback, after six
seconds of ticks, and after a burst of edits (operations on one side,
imperative calls on the other).

Handles: `renderer.audioTrack(id)`, `liveInput(id)`, `instrument(id)`,
`group(id)`, `returnTrack(id)`, `device(instanceId)`, `lane(id)`,
`modulator(id)`, `rendered`.

### Parameter ownership

On one parameter: **routes** (`ModMatrix`, base = the lane if there is one,
else the static value) **> lane** (`LaneWriter`, sample-accurate) **> static
value**. A parameter with a lane or a route is owned by that binding — the
renderer does not also write its static value (`strip.set` on an automated
fader updates the document, and the base of a matrix binding, but not the
fader itself); when the last lane/route goes, the parameter is handed back
at the document's static value. A lane on a `NodeDevice` parameter runs
through `nodeDeviceParam` and a `LaneWriter`; on any other device it runs
through the matrix at control rate. Modulation ranges for strip parameters
are `STRIP_PARAM_RANGES` (level 0..2, pan −1..1, inputGain 0..2). LFOs are
anchored at audio-clock zero so a re-render lands on the same phase.

### What stays live

- **Live input**: `kind: 'live'` tracks are created with their strip,
  inserts, sends and routing; the app attaches the `MediaStream` or node
  (`renderer.liveInput(id).attach(...)`). Nothing about the stream is in the
  document.
- **External phase**: an `external-phase` modulator's phase is driven by the
  app (`(renderer.modulator(id) as ExternalPhase).setPhase(p)`); only its
  offset, depth and shape are in the document.
- **Gestures in flight**: KTD8 says direct gesture writes bypass the score
  until the gesture ends. U28 gives that a home — apply the operations as the
  gesture goes (they coalesce into one undo step) or write the engine
  directly and commit one operation on release; the arbitration rule between
  human, agent and automation is U30.

### Bouncing a score (U33)

`renderScore(score, { durationSec, sampleRate, … })` loads the document on an
offline engine and renders it (`renderScoreStems` per track id). What cannot
render offline is dropped first (`renderableScore`): live-input tracks and
element tracks (media elements play in real time only), with any lanes and
routes on them. The score-driven golden renders a document offline and
compares every source start/stop and AudioParam event with a live engine
following the same document.

## Not in this unit

- Buses as score destinations, per-send lanes, markers/locators, version
  history and structural diff (U30), score-level presets/fragments. Element
  tracks and the tempo map arrived with format 2 (U33): operations
  `tempo.set`, `elementTrack.add/remove/route/setClips`; the renderer creates
  element tracks through `createElementSource` (default `<audio>` elements)
  and keeps `engine.tempo` in step. The session grid arrived with format 3
  (U31, [`docs/session.md`](./session.md)).
- Engine hooks added for the renderer, all additive: `engine.onDispose`,
  `removeLiveInputTrack` / `liveInputs`, `removeReturnTrack` /
  `returnTracks`, `removeInstrumentTrack` / `instruments`.
