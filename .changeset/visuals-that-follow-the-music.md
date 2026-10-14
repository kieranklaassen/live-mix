---
'@kieranklaassen/live-mix': patch
---

A new entry, `@kieranklaassen/live-mix/visuals`: pictures that follow the
music, moved here from Ambient Town so that other software can show them.

- Forty shader styles in four groups (dots, worlds, gradients, earth and sky),
  each in two variations, four bends that work on what was drawn (trails,
  mirror, spin, more grain), sixteen palettes and film grain over all of it.
- A piece's visuals are plain data (`VisualSet`): a visual is placed on a row
  for a stretch of beats or for the whole piece, or linked to a stroke, and
  every edit is a function from one set to the next. `visualsToJson` and
  `visualsFromJson` write and read the shape a score's `meta.visuals` keeps,
  and `carryVisualLinks` moves a link on when a stroke is cut.
- Every knob of a visual can follow something: the whole mix, its low, middle
  or high part, one kind of sound, the keys, the live input, a performer's
  dial or the place in the piece. `VisualDesk` turns the piece and what is
  heard into one frame a frame, and `createEar` listens to the master, or with
  `tapOf` to any node, through a tap of its own.
- `showVisuals(canvas, frameAt)` paints it. One WebGL 2 context serves every
  canvas of a page, a style's shader is a script of its own that is loaded
  when that style is first drawn, and a style that cannot be made is given up
  on alone.

The entry takes only the JSON types from the rest of the library, so a page
that only draws loads none of the audio engine. Nothing else in the package
changes. See `docs/visuals.md`.
