---
'@kieranklaassen/live-mix': patch
---

A linear clip that stops partway through its sound ends on a 5 ms ease-out instead of a hard stop.

A clip with no fade-out used to end with `source.stop()` wherever its length ran out. Where that is the middle of the sound (a clip shorter than what is left of its source, or a looping clip whose end does not fall where its region comes round) the output stepped from the wave's level to nothing in one frame: a click, on every pass when the clip ends at the loop's end. `AudioTrack` now ends such a clip on `JOIN_EASE_SECONDS`, the ease a clip entered partway already comes in on. A fade-out the clip carries itself wins when it is longer, a clip that runs to the end of its sound (within a millisecond) is left as it was made, a rate change moves the ease with the clip's end, and equal-power clips are untouched.

Measured in ambient-live with an 8 second drone looping across a 14 second piece: the step where the stroke is cut fell from 0.126 to 0.011 in an export (the sound's own largest step is 0.016).
