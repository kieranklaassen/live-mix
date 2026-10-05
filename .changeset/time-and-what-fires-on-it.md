---
'@kieranklaassen/live-mix': patch
---

Time and what fires on it: edges of the transport, the session grid, lanes, modulators and the performer.

- `Transport`: `start(NaN)`, a loop with `lengthSec: undefined` (which a partial loop lets a host write) and `setPass(Infinity)` throw a `RangeError` before anything is changed. The first left a position that is no number, the second a transport that says it plays with no anchor and no length, the last an elapsed time without end, on which a `Performer` told beats for ever.
- `ClockLaneWriter`: a lane edited while it was overridden keeps the value its `release` set. The next tick cancelled from the same time on and took that value with it, so the ramp that followed started from where the override had left the parameter.
- `nodeDeviceParam`: a segment with the curve `exponential` that ends on silence once the device has turned its units (a delay's `mix` at 1, a utility's `gainDb` at the bottom, its `width` at 1) is written as a straight ramp. The graph refuses an exponential ramp to 0, and the refusal stopped every lane and route written after it on each control pass.
- `EnvelopeFollower`: a level or a time that is no number is passed over and the envelope held. One such reading left the envelope at `NaN` until `reset()`.
- `Session`: a slot stopped and launched again before its stop had come has two launches, and a stop reached only the one already ending: a gate let go a second time inside the bar played on with no key down, and a toggle could not be stopped until the line had passed. A stop ends every launch of the slot, and a toggle reads the one placed last.
- `Session`: `stopSlot`, `stopTrack` and `stopAll` no longer start a transport that is not playing. `autoStart` is for launches.
- `Performer`: a dial named `constructor`, `toString` or the like is left where it is by a scene that does not name it (it was set to a function, and its targets to `NaN` or the bottom of their range), and `restore` puts back a ride on a track with such a name.
- `Performer`: a bar or beat inside the lookahead of a start is told once. It was told twice when the transport was started just short of the line, or when a second scheduler pass ran before the clock moved, and not at all, with its new time, after a pause just short of it.
- `Performer`: `load` with an edited follow rule for the scene in play leaves following switched on or off as `follow()` last put it. The set's own switch is taken only when it is the switch that changed.
- `Performer`: `dispose` puts every ride back at 1 though the `host` callback throws for a dial's target.
