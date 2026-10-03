---
'@kieranklaassen/live-mix': patch
---

The factory bank has a hundred sounds: sixty-six new ones (numbers 135 to 200) beside the first thirty-four, which render as they did.

- Held drones on acoustic and modelled instruments, synthesizer drones, synthesizer and acoustic pads, textures (water, weather, night, rooms, a radio), one-shots, phrases, and sounds made from other sounds of the bank. Every one is a recipe rendered from the stock devices; no audio ships.
- `loopFold: 'linear'` on `renderPatch` and on a `FactorySound`: the loop's end is folded over its start at equal amplitude instead of equal power, for a phrase played round again, where the two are alike. Seven of the new phrases and one pad use it and come round on themselves.
- A factory loop is held to the clip seam measure (`comesRound`), and a factory sound that ends to `entersOnStep` and `leavesOnStep`, in the bank's tests.
- A shipped sound keeps its number, id, length and whether it loops (`shipped-sounds.test.ts`): hosts store a sound by its number and paint strokes to its length.
- The sounds are in `src/dsp/factory/sounds/`, a file per family. `docs/factory.md` says how one is written and what the new sounds showed about the devices.
