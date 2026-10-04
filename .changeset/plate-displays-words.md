---
'@kieranklaassen/live-mix': patch
---

Plate displays: words that can be read.

- A word on a display is never drawn fainter than 0.8 of the plate's ink (it was 0.62, which measured about 2.5 to 1 against the ground on the Octaves and Lattice plates). A word that stands for the part in use is drawn in full ink: the "0" of Octaves, the root note of the Lattice, the kind the Glitch plays now, the rows a Cascade uses.
- The Cascade names its half-speed rows ".5" and "1.5": the fraction in one glyph sets its figures at half the type's size.
- Echo Memory's reach ("20 s") and the Vowel Reverb's "1k" stand on a patch of the plate, as the Compressor's figures do: both were set straight onto a fill in the same ink. The helper is `label` in the display kit.
- `TEXT_LEAST` is exported, and the test every display passes holds each word to it and refuses a one-glyph fraction.
