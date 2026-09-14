---
'@kieranklaassen/live-mix': minor
---

`StretchTrack` (U31 follow-up): a scheduler-driven clip track over
`StretchSource` with the `AudioTrack` shape — stretch nodes built ahead by the
preload schedulable, rates from warp markers on `engine.tempo`, semitones, and
loop regions `[loopStartSec, loopEndSec)` entered anywhere (legato).
`engine.addStretchTrack/stretchTrack/stretchTracks/removeStretchTrack`
(`'stretch-track'` change events, PDC paths), `renderer.stretchTrack`/`clipTrack`,
score audio tracks may set `stretch: true` (renderer option `createStretch`),
`Clip.loopStartSec/loopEndSec` (validated, kept by `normaliseClip`; the session
sets them from the slot region so legato loops the slot, not the source tail;
`AudioTrack` honours them on buffer voices). `Session.liveTrack` finds stretch
tracks; the offline renderer awaits stretch node builds.
