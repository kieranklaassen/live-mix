---
'@kieranklaassen/live-mix': minor
---

Real-audio browser golden (`browser-tests/`, `pnpm test:browser`,
`scripts/ci-local.sh --browser`, `browser` CI job): headless Chrome with a real
`AudioContext` renders a scripted session through the real engine, worklets
and WASM on an `OfflineAudioContext`, plays it live and captures the master
through the recorder worklet; asserts the real offline schedule equals the mock
golden, and the live capture matches the render within loudness and spectral
tolerance; plus a playground smoke.

Fix it found: `LaneWriter` and `ClockLaneWriter` now hand a segment to the
graph whole as soon as the write window reaches into it (Chrome renders a ramp
issued after its segment began as a jump to the interpolated value). Same
events, issued earlier; `writtenUntilSec` now lands on segment ends.
`segmentEndAfter(lane, sec)` is exported from `ParamLane`.
