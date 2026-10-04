---
'@kieranklaassen/live-mix': patch
---

Plate displays, a fresh look by reviewers who did not build them.

- **The wheel over a display's point** goes by the size of the turn (a notch of 100 px is one step, as before; a trackpad's small events add up to the same), is one undo step for the whole gesture, and leaves a swipe that goes more across than up or down to the chain.
- **`ParamSpec.step`** (new, optional): `1` for a count or whole semitones. A parameter is a list of choices only when it has `choices`, or `step: 1` and no unit; the guess from a whole-number range is gone, so the eleven knobs that run -1 to 1 (and the vowel) set and show what is between. `device.json` takes `"step": 1`; `Filter.type` and the Spectral Drifter's five lists carry their `choices`.
- **A finger**: a swipe that starts on a display beside its points scrolls the chain (`touch-action: none` is off the canvas; a press on a point is kept by a `touchstart` listener), a point at the display's edge is taken where it stands, two quick nudges are not a double press, and a finger's first 4 px on a knob are held back so a swipe the browser takes turns nothing and leaves no undo step. A pointer the browser cancels puts a control back where it was taken.
- **Two points one on the other**: the one moved last is the one taken.
- **Compressor, Ambient Compressor, Ambient Limiter, Swell, Sidechain Ducker**: the line is the level coming out, the figure what the reduction comes to in what is heard (Mix and the make-up counted), a bypassed plate forgets its past, the Ducker says "no key" when nothing keys it, the Swell stays shut in silence.
- **Parametric EQ** draws its curve through each band's own frequency; **Lattice, Spectral Drifter, Octaves, Pitch Shifter** show what the device does (a root keeps its row, the drifter keeps its age, voices rise with Attack, the shift's sign follows Mode).
- A knob's value in hand is set whole on its patch instead of being cut at the knob's width.

No device's `process` changes.
