---
'@kieranklaassen/live-mix': patch
---

Core spine: `createEngine`/`Engine` (adopts a context, owns `OutputRouter`, `MasterBus`, named `Bus`es, the `Transport` and `Scheduler`, and an injectable clock/timers), `OutputRouter` with iOS element mode + `MediaSession` (lifted from Breathwork Live), `Bus`/`MasterBus` with post-fader inserts, `Meter`. `Scheduler` accepts injectable `setIntervalFn`/`clearIntervalFn`.
