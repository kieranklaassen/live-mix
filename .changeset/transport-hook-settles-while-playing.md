---
'@kieranklaassen/live-mix': patch
---

`useTransport` no longer takes two readings of a playing transport for two states. Its snapshot carried the position, which is the clock's while the transport plays, so on a real `AudioContext` a render that took longer than one step of the clock found the store changed, asked for another render, and so on until React gave up with "Maximum update depth exceeded" and the page went blank (the playground did, on a scene launched while playing). While it plays the position is now left out of that comparison; the playhead is sampled on frames as before, and a pause, a seek, a loop change and a stop still come through at once.
