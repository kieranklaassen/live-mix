---
'@kieranklaassen/live-mix': patch
---

A stretch of sound is measured in under half the time, with the same figures.

The loudness analyser interpolates only the runs that can pass the highest true
peak so far, keeps its filters in the loop that runs them, and the transform
behind the bands takes its stages two at a time. Every figure is the same to the
last bit. A minute of two channels took 753 ms of one core and takes about 300.
`TruePeakDetector` has `pushBlock`, which takes a block of samples at once. The
transform is also the one a separation and the two spectral clean-up devices
use.
