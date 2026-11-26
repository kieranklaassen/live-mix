---
'@kieranklaassen/live-mix': patch
---

A meter is read in a sixth of the time, with the same figures.

Reading the level of a window, and every other loop of the engine over samples,
walked its array with an iterator, which takes six times as long as an index: 23
µs for a meter's window of 2,048 samples, and 3.5 now. A page with a dozen meters
reads seven hundred windows a second, at rest too. The same goes for the peak of
a render, the parts of a separation, the Ducker's key, the picture's ear and a
WAV's samples.
