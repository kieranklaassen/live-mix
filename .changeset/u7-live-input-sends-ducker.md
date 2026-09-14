---
'@kieranklaassen/live-mix': patch
---

`LiveInputTrack` (MediaStream or node, dry gain per attach, sends re-wired on re-attach, `onAttach` hook), `ReturnTrack` + `SendList`, `ConvolverReverb` with Breathwork Live's generated hall IR, main-thread `Ducker` with the identical envelope follower and `setTargetAtTime` writes; `engine.addLiveInputTrack/addReturnTrack/addDucker`, `engine.stop()` stops duckers.
