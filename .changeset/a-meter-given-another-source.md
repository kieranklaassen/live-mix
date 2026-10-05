---
'@kieranklaassen/live-mix': patch
---

`Meter` on a `source`: a meter that stayed mounted while its source changed (a strip's analyser made anew, another channel selected) kept what it had of the last one. The clip lamp of the `segments` look stayed lit for a signal that never clipped, the peak-hold mark stood where the last signal had peaked until its time was up, and a meter with `active={false}` went on showing the last source's level, since it reads its source only once. A meter is now its source's: given another source it is made anew, so that source is read at once and the lamp and the mark start afresh with it. Its elements are new ones from then on; a host that kept hold of the meter's element across a change of source holds one that is no longer on the page.
