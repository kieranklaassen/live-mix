---
'@kieranklaassen/live-mix': minor
---

Breathwork Live U26 follow-ups: linear fade-outs on `AudioTrack` and
`ElementTrack` anchor at the current gain before ramping (a fade-out landing
mid-fade-in no longer snaps to the cancelled ramp's start); `OutputRouter.
setMediaTitle(title, artist?)` and `metadata` for the lock-screen title switch
at takeover; `ClockLaneWriter` — a clock-anchored, verbatim `ParamLane` writer
(no join ramps or dedupe, `onEdit: 'rewrite' | 'append'`, override/release) so
the breath guide can publish its cycles as a lane without changing its events.
