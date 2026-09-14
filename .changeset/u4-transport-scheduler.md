---
'@kieranklaassen/live-mix': patch
---

Add the transport and scheduler (U4): `Transport` (play, pause, stop with fade, seek,
loop with numbered passes, position derived from an anchor on the audio clock),
`Scheduler` (one lookahead timer over `Schedulable`s with per-schedulable
`lookaheadSec`, idempotent `clipId:iteration:startSec` keys, and catch-up from the
anchor after a throttled timer), plus `positionFromAnchor`, `startsInWindow`,
`scheduleKey`, `wrapPosition` and `isLooping` — ported from ambient-live's
`use-clip-transport` with parity tests against it and against Breathwork Live's
`MusicEngine` handoff rule.
