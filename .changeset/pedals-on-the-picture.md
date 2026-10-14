---
'@kieranklaassen/live-mix': patch
---

`./visuals`: pedals laid on the picture.

- A `VisualSet` gains `pedals`: the piece's devices that lie on the picture as
  their own plates, as gear lies on a table that is filmed from above. A
  `VisualPedal` is a device's id, where its middle lies (`x`, `y`, 0 to 1), how
  tall it is as a share of the picture (`size`) and how far it is turned
  (`turn`, degrees). `layPedal`, `movePedal`, `liftPedal`, `liftPedals`,
  `pedalOf`, `freePedalSpot`, `withoutLostPedals` and `carryPedals` are the
  edits; each hands back the next set. `pedals` is written only where one
  lies, and a build from before keeps it as it was written. Drawing the plates
  is the host's (`DevicePlate` over the canvas).
- `VisualSet.pedals` is a field every set has: a set a host builds by hand
  needs `pedals: []`.
- `./react`: a plate drawn into another window's document (a host that opened
  a window for a second screen and renders into it) asks that window for its
  screen's pixel ratio, its computed colours and its observers, where it asked
  the page's own before.

See `docs/visuals.md`.
