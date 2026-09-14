# Controller arbitration (U30)

Several writers move the same parameters: the listener at the UI, a MIDI or
OSC fader, the coach (an agent), automation lanes, and the library's own
rails. R29 asks that they share predictably — "a human touch is not silently
undone by automation" — and KD10 that the listener's protection outranks the
agent's intent. The `Arbiter` is one gate in front of `ScoreDocument.apply`
that every writer goes through, so competing writes to the same target
resolve by a stated policy instead of arrival order, and every write is
attributed in the operation log.

```ts
import {
  AgentController,
  Arbiter,
  ControlSurface,
  ScoreDocument,
  arbitratedControlWriter,
  createEngine,
  loadScore,
} from '@kieranklaassen/live-mix'

const engine = createEngine({ context })
const document = ScoreDocument.parse(json, { devices: engine.devices })
const renderer = loadScore(engine, document)
const arbiter = new Arbiter(document, { renderer }) // author defaults to the document's (the human)

// The UI: hooks write through it when the provider has it (see below).
arbiter.touch({ kind: 'strip', owner: 'music', param: 'level' }) // pointer down
arbiter.apply(
  { type: 'strip.set', owner: 'music', param: 'level', value: 0.8 },
  { gesture: 'drag' },
)
arbiter.release({ kind: 'strip', owner: 'music', param: 'level' }) // pointer up: held 5 s more

// MIDI/OSC: controller-authored operations instead of direct engine writes.
const surface = new ControlSurface({ engine, write: arbitratedControlWriter(arbiter) })

// The coach: its writes into a held target wait and land when the hand lets go.
const coach = new AgentController({ engine, document, arbiter, roles })

arbiter.onChange((event) => {
  /* 'held' | 'freed' | 'locked' | 'unlocked' | 'deferred' | 'landed' | 'dropped' | 'overridden' | 'resumed' */
})
```

## Authors

`Author.kind` is the arbitration class (`WriterKind`):

| kind         | who                                                                                   | constant            |
| ------------ | ------------------------------------------------------------------------------------- | ------------------- |
| `human`      | the user at the UI or a knob (the hooks, `document.author` by default)                | `LOCAL_AUTHOR`      |
| `controller` | a MIDI/OSC surface (`arbitratedControlWriter`)                                        | `CONTROLLER_AUTHOR` |
| `agent`      | an LLM tool call (`AgentController`, label `agent:<tool>#<callId>`)                   | `AGENT_AUTHOR`      |
| `automation` | a lane, follow action or generator writing through the document                       | `AUTOMATION_AUTHOR` |
| `system`     | the rails, restores, migrations — anything acting for the listener rather than a hand | `SYSTEM_AUTHOR`     |

## Policy table

`DEFAULT_ARBITRATION_POLICY`; `policyTable()` returns it as data and
`formatPolicyTable()` prints exactly this:

| writer ↓ / held by → | free  | system | human | controller | agent | automation | places hold   |
| -------------------- | ----- | ------ | ----- | ---------- | ----- | ---------- | ------------- |
| system               | apply | apply  | apply | apply      | apply | apply      | no            |
| human                | apply | drop   | apply | apply      | apply | apply      | yes (5000 ms) |
| controller           | apply | drop   | apply | apply      | apply | apply      | yes (5000 ms) |
| agent                | apply | defer  | defer | defer      | apply | apply      | no            |
| automation           | apply | drop   | drop  | drop       | drop  | apply      | no            |

Rules behind the table (`decide(policy, writer, holder)`):

- **Ranks**: system 4 > human 3 = controller 3 > agent 2 > automation 1. A
  writer ranked at or above the holder applies; a lower-ranked one follows
  its `onHeld` entry (`defer` for the agent, `drop` for the rest).
- **Touch hold**: a `human` or `controller` write takes the target and keeps
  it for `holdMs` (5 s) after the last write or `release`; `touch()` holds
  open-ended until `release()` (pointer down → up), then the timer runs.
  This is the plan's "override memory" — nothing lower-ranked slides a
  parameter back under the hand.
- **Latest wins within a class**: a controller write over a human hold (or
  the reverse) applies and takes the hold over (`freed { reason: 'taken' }`
  then `held`).
- **Agent defers**: a write into a held target is queued (latest per author
  and target set; the older one is `dropped { reason: 'superseded' }`) and
  lands when the hold lapses — attributed to the agent, with its label — as
  long as it is younger than `deferTtlMs` (15 s); older ones drop as
  `stale`. A queued write that no longer applies (its clip is gone) drops as
  `failed`. Set `onHeld: { agent: 'drop' }` to refuse instead; the coach
  then gets a `rejected` tool result naming the holder and can ask again.
- **Automation drops**: while a hand holds a target, automation writes
  through the document are refused, and the target's `LaneWriter` (when the
  renderer binds one) is overridden — cancel-and-hold, as the control
  surface did — and the hand's value goes straight to the graph. The lane
  resumes when the hold ends (`automationResume: 'after-hold'`), or on
  `releaseAutomation()` with `'manual'` (Ableton's "back to arrangement").
- **Rails always win**: `system` writes land through any hold and never take
  one. A `lock(target, { author: SYSTEM_AUTHOR, ttlMs, reason })` refuses
  everything ranked below it — the listener's own fader during a fade-out —
  until it lapses or `unlock`. Locks by other kinds work the same way at
  their rank (a human lock parks the agent and drops automation).
- **Own hold**: a writer's own hold never blocks it; each write refreshes it.

Every knob is in `ArbiterOptions`: `rank`, `onHeld`, `holds`, `overrides`,
`holdMs`, `deferTtlMs`, `automationResume`, plus `now` (ms clock),
`setTimeoutFn`/`clearTimeoutFn` (so holds lapse and queued writes land
without another write), `renderer` (lane override and device id lookup) and
`author`.

## Targets

Writes key on strings (`arbiterTargets(op)`): parameters use `targetKey`
(`strip:music:level`, `device:verb:wet`, `strip:master:level`), mute/solo
`strip:music:mute`, sends `send:music:hall`, clips `clips:music:<id>`
(`clip.replaceFrom` → `clips:music`), structure on the entity
(`strip:music` for remove/rename/route, `device:<id>`, `lane:<id>`, …),
document-level ops `score`, and `score.replace` every key. Keys conflict
when equal or nested (`strip:music` vs `strip:music:level`), so an agent
removing a track the listener is riding waits like a fader write would. A
`batch` takes the union of its children and is decided as one write.

## Results and events

`apply()` returns `{ outcome: 'applied' | 'deferred' | 'dropped', entry?,
targets, holder?, reason?, ticket? }` — `reason` is `held`, `locked`,
`stale`, `superseded`, `failed` or `cancelled`. `stateOf(target)` gives a
control its badge: `{ hold, lock, holder, pending, overridden }`.
`holds()`, `locks()`, `pending()`, `cancel(ticket)`, `clearHold(target)`,
`tick(atMs)` (tests with an injected clock), `undo()`/`redo()`/`endGesture()`
pass through to the document. A `load` on the document clears every hold and
cancels every wait.

## Where each writer plugs in

- **Hooks** (`./react`): `<LiveMixProvider engine arbiter>` makes
  `useStrip`/`useTrack`/`useGroup` level, pan, trim, mute, solo, solo-safe
  and `useDevice`/`useDeviceParam` sets apply operations as the provider's
  human author (a strip or device the score does not carry keeps the direct
  engine write; `attributed` tells which). `touch(param)`/`release(param)`
  bracket a drag: a fresh gesture id per touch, so two drags are two undo
  steps. The kit's `ChannelStripView` and `DevicePanel` already wire
  `onChangeStart`/`onChangeEnd` to them. `useArbiter()` reads holds, locks
  and pending writes; `useArbiterTarget(target)` gives one control its
  `status` (`held by you`, `held by coach`, `coach pending`, `locked by
rails`).
- **Control surface**: `new ControlSurface({ engine, write:
arbitratedControlWriter(arbiter) })`. Strip, send, master and device
  targets become `strip.set` / `strip.mute` / `strip.solo` / `send.set` /
  `device.setParam` under `CONTROLLER_AUTHOR` with a per-target gesture
  (`controller:<key>`) so a fader ride coalesces into one undo step. Macros,
  transport and devices the score lacks fall back to the surface's direct
  write. Register devices under their score instance ids (or pass
  `deviceId`) so the mapping resolves.
- **Agent**: `new AgentController({ document, arbiter, … })`. Each planned
  operation goes through the arbiter: a deferred one adds an
  `{ rail: 'arbitration', action: 'deferred' }` note and `result.deferred`,
  the call still succeeds, and the write lands later under the call's
  label; a dropped one fails the call with `rejected` and rolls back what
  the call already applied (queued writes of a failed call are cancelled).
  The `undo` tool is arbitrated too.
- **Rails/system**: write with `SYSTEM_AUTHOR` or `lock` with it.

## Acceptance (AE7)

`scenario.coach-vs-listener.test.ts` runs the full stack on the recording
mocks: the coach lowers the music (lands), the listener drags the fader
(lands, holds), the coach's next write waits, a MIDI move takes the hold,
automation is refused, the rails clamp through, the coach's newer intent
supersedes the older one and lands when the hold lapses, a system lock
refuses the listener and parks the coach. The music fader's `AudioParam`
events are exactly `[0.3, 0.5, 0.9, 0.6, 0.55, 0.25, 0.35]`, the log's
authors `agent, human, human, controller, system, agent, agent`, and undo
walks back to the coach's first value. `Arbiter.test.ts` pins the whole
matrix (every writer × every holder × strip, device, send, master and
structure targets).

## Not in this unit

- Targets the `ModMatrix` drives (a lane with modulation routes, or a lane on
  a device that cannot schedule its params) are not overridden by a touch;
  the routes keep modulating around the document value.
- Holds are not persisted; they are session state.
- `ScoreDocument.undo()`/`redo()` are not arbitrated (they are the human's).
