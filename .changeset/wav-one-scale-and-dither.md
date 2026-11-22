---
'@kieranklaassen/live-mix': patch
---

The WAV writer and reader use one scale, and the writer can dither.

`encodeWav` multiplies a sample by 32,768 at 16 bits and by 8,388,608 at 24, the counts `decodeWav` divides by, where it used to multiply by 32,767 and 8,388,607. A 16 or 24 bit file read and written again at its depth is now the same file, byte for byte. The highest number a file holds is one step under full scale and the lowest is full scale itself, and a sample past either is held there, so a sample of exactly 1 is written one step low.

What changes for a host: every 16 and 24 bit file the engine writes (`encodeWav`, `wavBlob`, `audioBufferToWav`, and the WAV of an authored score's render) differs from the one it wrote before by at most one step in a sample. A 32 bit float file is the same bytes as before.

`WavEncodeOptions` has a new `dither` (`{ seed }`). With it, each sample of a 16 or 24 bit file has triangular noise added before the rounding: one random number less another, two steps from its lowest to its highest, as strong at every frequency. A sample is then within a step and a half of the sound, the error is right on average, and silence is written as -1, 0 and 1. The noise is drawn from the seed in the order the samples are written, so the same sound, depth and seed give the same file and another seed gives another. Left out, the file is undithered as before, and at 32 bits the option does nothing (docs/concepts/render.md).
