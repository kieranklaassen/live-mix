---
'@kieranklaassen/live-mix': patch
---

A plate can stand upright, as a pedal on a board (`./react`):

- `DevicePlate` takes `upright`, and `DeviceChainView` takes it for every plate
  it draws (a panel stays as it is). An upright plate is 220 px wide and 300
  high. The display or the picture lies across the top, a display at 204 by
  100; the knobs stand under it in two rows, eight on the face where the device
  has that many, the ones its skin chose first. Up to four knobs stand two
  abreast and are 36 px, and a lone one has the middle. Under them are the
  `+n` cell at the left and the tools at the right, then the host's
  `presetPicker` in a row of the plate's whole width, then the foot with the
  name tag and the lamp.
- A plate with no display and no picture has four rows of four knobs from the
  top. Opened, an upright plate widens by columns, its rows stand in the
  middle and its display stretches with it; the height stays.
- With no picker of the host's, the kit's own list of presets has four cells of
  the tools' row, so the name it shows can be read.
- `plateLayout` takes `upright` as its fourth argument and then answers with
  an `upright` field too: the plate's height, where its knobs start, a row's
  height and a knob's size.
- Without `upright` a plate is as it was: 140 px high, the same face, the same
  layout.
