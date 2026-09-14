---
'@kieranklaassen/live-mix': patch
---

Add automation lanes and modulators (U19): `ParamLane` breakpoints with step, linear,
exponential and smooth curves evaluated offline (`valueAt`, `render`); `LaneWriter`, which
writes a lane ahead into an AudioParam inside the scheduler window, follows loops, and
yields to a live override with cancel-and-hold (Firefox fallback included); the modulation
sources `Lfo` (free-running, Tides' breathing law `1 − depth·(1 − breathMod)`),
`ExternalPhase` (breath phase), `EnvelopeFollower`, `Random` (seeded sample-and-hold) and
`Macro`; and `ModMatrix`, which routes sources onto any AudioParam or device parameter with
depth and polarity as click-free ramps.
