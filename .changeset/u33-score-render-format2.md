---
'@kieranklaassen/live-mix': minor
---

Score format 2 and score bouncing (U33): `tempo` (TempoMap segments, kept in
step on the new `engine.tempo`) and `elementTracks` (streamed beds, no strip)
join the document with a `1 → 2` migration; operations `tempo.set`,
`elementTrack.add/remove/route/setClips`; the renderer creates element tracks
through `createElementSource`. `renderScore`/`renderScoreStems` bounce a
document offline (`renderableScore` drops live inputs and element tracks); the
score-driven render-equals-live golden compares the offline schedule with a
live engine following the same document. `scheduleAhead` now awaits decodes
a tick asks for (`SampleStore.settled()`/`pendingCount`).
