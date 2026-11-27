---
'@kieranklaassen/live-mix': minor
---

Ten presets for each of the 141 visual styles, 1,410 in all: a style drawn in another world of the same kind, with numbers of its own that the style's shader reads, colours, light, pace and how the eye stands to it. `loadVisualPresets(style)` loads those of one style, and `loadPresetWords()` the names and sentences of all of them (docs/visuals.md). Every shader reads four to eight numbers of its own; with none of them set a style draws the picture it drew before.

A style's own numbers are written into its program as plain numbers rather than read from a uniform, so what a preset does not use costs nothing: each set of numbers is a program, compiled when it is first drawn, and the picture that was there stays up until it is ready.
