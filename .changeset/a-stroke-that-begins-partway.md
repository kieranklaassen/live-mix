---
'@kieranklaassen/live-mix': patch
---

`Stroke` takes a `phase`: how far into a pass of its sound the stroke begins, as a fraction of one (0 up to 1). A host that cuts a repeating stroke inside a repeat can draw the piece after the cut as it plays: the wave goes on from where the cut fell, the hits move back by as much, the first seam stands where the sound comes round to its top, and the passes after that sit back. `strokeLevels`, `strokeWavePaths`, `repeatSeams` and `hitPositions` take the same `phase`; `passPhase` and `strokeRepeats` are exported with them. With no `phase`, or 0, every stroke is drawn as it was, to the last bit.
