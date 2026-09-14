# Automation and modulation

Two ways a parameter moves without a hand on it, and one rule for what happens
when a hand arrives.

- **Automation** is _written_: a `ParamLane` of breakpoints in seconds,
  rendered ahead of the playhead onto an `AudioParam` inside the scheduler
  window (R13). It is part of the score.
- **Modulation** is _computed_: a `ModSource` (LFO, envelope follower, random,
  macro, external phase) read at control rate and applied to a `ModTarget`
  with depth and polarity (R14). Routes are part of the score; the source's
  phase is not.
- **Arbitration** (R29): a live override — a knob, a MIDI controller, the
  agent — takes a parameter with cancel-and-hold, and automation stays out of
  the way until it is explicitly released. The override is remembered, never
  timed out.

## Lanes

```ts
import { ParamLane, nodeDeviceParam } from '@kieranklaassen/live-mix'

const cutoff = new ParamLane({ min: 20, max: 20_000 })
cutoff.add({ timeSec: 0, value: 400 })
cutoff.add({ timeSec: 8, value: 4_000, curve: 'exponential' }) // towards the next breakpoint
cutoff.add({ timeSec: 16, value: 400, curve: 'smooth' })
cutoff.valueAt(4) // pure: what the lane says at 4 s
cutoff.onChange(() => redraw())

// Drive a real parameter while the transport plays. `ScheduledParam` is the
// AudioParam automation surface; a device param becomes one through a helper.
const writer = engine.automation.add(cutoff, nodeDeviceParam(filter, 'frequency'))
```

Curves are `step`, `linear`, `exponential` and `smooth` (an S-curve rendered
as `SMOOTH_SEGMENT_STEPS` linear pieces). The `Automation` control loop
(`engine.automation`, ticking with the scheduler, `lookaheadSec` default
0.2 s) gives every `LaneWriter` the window `[playhead, playhead + lookahead]`
each tick; the writer issues `setValueAtTime`/`…RampToValueAtTime` events for
the segments the window reaches into — **each segment whole**, because Chrome
and Safari render a ramp issued after its segment began as a jump to the
interpolated value (the real-audio golden's first catch) — so an edit to the
lane behind the window is heard within one tick and nothing far ahead is
committed. Seeks and loop
wraps hold the param at the lane's value for the new position and continue
(`holdParamAt`: `cancelAndHoldAtTime` where it exists, cancel + set where it
does not — Firefox).

### Two anchorings

`LaneWriter` (above) is **transport-anchored**: lane seconds are timeline
seconds, it is loop-aware, rejoins with a short ramp after a seek, stall,
edit or released fader, and dedupes same-time events. `ClockLaneWriter` is
the other anchoring: lane seconds are **audio-clock seconds from
`anchorSec`**, and every lane event in `[cursor, now + lookahead)` is written
verbatim at `anchorSec + timeSec` — no join ramps, no dedupe, no synthetic
anchor on the first tick — so a producer that already schedules its own
automation (Breathwork Live's breath guide) can publish it as a `ParamLane`
without one recorded event changing. `tick(nowSec, lookaheadSec)` is the
producer's loop; `override(t)` / `release(now)` hold and resume with a plain
set; `onEdit: 'append'` keeps scheduled events when the lane only grows
(`'rewrite'`, the default, cancels from now and rewrites).

## The override

```ts
// Pointer down on a knob, a MIDI controller's first move, an agent set:
writer.override(engine.now()) // cancel-and-hold at the current value; ticks write nothing
device.setParam('frequency', 1200) // the hand's value, ramped by the device
// Pointer up / explicit hand-back:
writer.release() // the lane resumes from the playhead on the next tick
```

Nothing releases an override for you. The UI kit's `Knob` and `Fader` bracket
a gesture with `onChangeStart`/`onChangeEnd` for exactly this; the
`ControlSurface` (MIDI/OSC) does it on the first controller write and on
`surface.release(target)`; the agent API is expected to do the same around a
parameter set. AE7 in the plan is the acceptance: the coach lowers the music,
the listener drags the fader, the fader wins, automation does not undo it,
undo restores the coach's value.

## Modulators

| Source            | Class              | Phase / value                                                                                                                                                                                                                       |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LFO               | `Lfo`              | Free-running on the audio clock (`rateHz`, `shape` sine/triangle/saw/square, `depth`, `phase`); value = `breathLaw(waveform, depth)`; rate changes re-anchor so phase stays continuous; **never reset from audio** (the Tides rule) |
| Envelope follower | `EnvelopeFollower` | One-pole attack/release; `push(level)` at control rate from a meter, or `process(block)` offline — same equation                                                                                                                    |
| Random / S&H      | `Random`           | Seeded, repeatable steps at `rateHz`, optional linear glide                                                                                                                                                                         |
| Macro             | `Macro`            | A 0..1 value set by hand, a lane, a rack macro or the control surface; also a source for other routes                                                                                                                               |
| External phase    | `ExternalPhase`    | A phase driven from outside — the breath guide's inhale/exhale progress, a conductor — holds the last value                                                                                                                         |

`renderModulator(source, fromSec, durationSec)` previews any of them, so a UI
can draw the exact curve the DSP follows. `breathLaw(breathMod, depth) = 1 − depth·(1 − breathMod)`
is Tides' breathing law, the same formula `FdnReverb` runs in C++ — the
visual = audio rule (KD9) made concrete.

## The matrix

```ts
import { Lfo, ExternalPhase, deviceParamTarget } from '@kieranklaassen/live-mix'

const breath = new ExternalPhase({ phaseOffset: -0.25 }) // sine starts at its trough
const target = deviceParamTarget(filter, 'frequency') // min/max/taper from the ParamSpec
engine.modulation.map(breath, target, { depth: 0.6, polarity: 'unipolar' })
engine.modulation.map(new Lfo({ rateHz: 0.1 }), deviceParamTarget(plate, 'mix'), 0.2)

conductor.onBreathPhase((phase) => breath.setPhase(phase)) // 0..1 per cycle
```

A `ModTarget` is `{ min, max, base, apply }`: `base` is the value with no
modulation — a number, or a `ParamLane` read at the playhead, so automation
and modulation stack (lane first, modulation on top). `depth` is −1..1 of the
target range (negative inverts); `bipolar` centres the swing on the base.
`engine.modulation` (`ModMatrix`) updates every route at control rate,
`attach(target)` binds a lane-based target without a modulator, `onChange`
notifies UIs, and `setRoute(route, { depth, polarity })` edits in place.
Rack macros are targets (`rack.macroTarget(i, { base })`) and sources.

## Where it is stored

Lanes (`ScoreLane`: target = a strip param or a device param, breakpoints),
modulators (`lfo | random | macro | external-phase` with their options) and
routes are all fields of the [score](./score.md); `loadScore` creates the
writers and routes and applies the ownership rule — routes over lanes over
static values ([score.md § Parameter ownership](../score.md#parameter-ownership)).
An `external-phase` modulator is declared in the score but driven by the app.
