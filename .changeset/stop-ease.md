---
'@kieranklaassen/live-mix': patch
---

Stop, pause and a seek no longer click on an `AudioTrack`.

`stop(key)` and `stopAll()` without a time, which is what the transport's stop (with no fade), pause, end and seek come to, stopped each source dead: a step wherever the wave stood, up to ten times the sound's own largest move from one frame to the next. A voice that is sounding now falls silent over `JOIN_EASE_SECONDS` (5 ms) from the level its envelope has there, and is forgotten at once, so its key is free; its nodes go when its source ends. A voice that has not started is dropped as before, one in its tail is left to finish it, and `dispose()` still cuts, since the graph goes with the track.

A seek while playing is then a 5 ms crossfade from what was sounding onto the clips entered at the new place.

Measured in ambient-live (headless Chromium, an 8 second harmonium loop, the largest jump between frames around the press against the sound's own 0.016): Stop 0.163 before and 0.018 after, Pause 0.154 and 0.018, both over 60 presses; a seek 0.152 before, and after it the sound's own in all but about one in fifty, where the clip entered at the new place starts a block late.
