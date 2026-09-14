---
'@kieranklaassen/live-mix': minor
---

Offline rendering, stems, WAV export and live capture (U33): `renderOffline`
pre-schedules an arrangement from a virtual clock and renders it on an
`OfflineAudioContext` (deterministic, plugin-delay aligned via
`alignLatency()`), `renderStems` solos each track in place per render,
`encodeWav`/`audioBufferToWav`/`wavBlob`/`decodeWav`, and `createRecorder`
taps the master or any bus/track through a capture worklet
(`dist/worklets/recorder.js`) or `MediaStreamDestination + MediaRecorder`.
`./testing` gains `MockOfflineAudioContext` and `scheduleSnapshotOf`.

Hooks follow-ups: `engine.onChange` (track/group/return/live-input/instrument/
element-track/bus added|removed, dispose), `Bus.targetLevel` + `Bus.onChange`,
`engine.ioLatency()` (base + output + live-input latency),
`LiveInputTrack.inputLatencySec`, `removeLiveInput`/`removeReturnTrack`/
`removeInstrument` and `liveInputs`/`returns`/`instruments`;
`MockAudioContext` takes `baseLatency`/`outputLatency` options.
