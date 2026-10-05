---
'@kieranklaassen/live-mix': patch
---

`Meter` on a `source`: a meter that stayed mounted while its source changed (a strip's analyser made anew, another channel selected) kept what it had of the last one. The clip lamp of the `segments` look stayed lit for a signal that never clipped, the peak-hold mark stood where the last signal had peaked until its time was up, and a meter with `active={false}` went on showing the last source's level, since it reads its source only once. Another source is read at once, and the lamp and the mark start afresh with it.
