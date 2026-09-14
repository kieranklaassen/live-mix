---
'@kieranklaassen/live-mix': patch
---

StretchTrack / GridView follow-ups from review: a warped clip enters at its
`offsetSec` (legato carries a position) with the source position wrapped into
the loop region (`warpClipSecAt`, `wrapIntoLoop`); the preload schedulable keeps
offering a start until its stretch node is built (a late decode still builds
ahead); stretch tracks get a `SampleRetainer`; `renderStems`, control-surface
and React strip lookups, `MixerView`'s default list and the agent snapshot see
stretch tracks; buffer voices joining a looping clip late wrap into the region;
`GridView` ignores key auto-repeat and captures the pointer so a gate releases
when the finger slides off the pad.
