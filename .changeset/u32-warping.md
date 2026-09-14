---
'@kieranklaassen/live-mix': patch
---

Warping (U32): `TempoMap` (seconds ↔ beats/bars, quantize), `StretchSource` over a `signalsmith-stretch` node (optional peer, injected factory; rates from warp markers, semitones, reported latency), warp math (`warpSegments`, `warpRateAt`, `warpSourceSecAt`), and Camelot key matching (`camelotCompatible`, `camelotDistance`, `transposeCamelot`, `keyMatch`, `rankByKeyMatch`) with parity to Breathwork Live's selector rule. `Clip` gains optional `warp` and `semitones`.
