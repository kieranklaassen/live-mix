---
'@kieranklaassen/live-mix': patch
---

Two faults at the edges of a render and of a generated sound. No factory sound renders differently: all 2,600 are the same samples as before.

- `renderPatch`: a render with a NaN in it was handed back, scaled as if it were sound, where one with an infinity is refused ("rendered a non-finite sample"). `peakOf` skipped a NaN, which is larger than nothing, so the guard never saw it. `peakOf` now gives NaN for audio with a NaN in it, and the render throws as it does for an infinity. No stock device puts one out.
- `generateSound`: a mode that is no mode is taken as major, and so is now one named like something every object has (`constructor`, `toString`), which came out as a sound called "Drift pad undefined" in the mode "constructor".
