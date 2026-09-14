---
'@kieranklaassen/live-mix': patch
---

Engine wiring for automation and memory: `engine.automation` (control-rate loop driving `LaneWriter`s inside the lookahead while playing, resetting them on stop/pause/end) and `engine.modulation` (a `ModMatrix` updated on every control tick, lazily started); a `SampleRetainer` per audio track (`retainSamples`, default on); `engine.addElementTrack`; `activateOutput()` now returns a promise that resolves once element tracks are unlocked; `Clock` gains `setTimeoutFn`/`clearTimeoutFn`.
