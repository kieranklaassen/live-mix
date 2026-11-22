---
'@kieranklaassen/live-mix': patch
---

`@kieranklaassen/live-mix/analysis`, a new entry that measures a stretch of sound on plain arrays, with no Web Audio and no DOM. `new Measurer(sampleRate, channels)` takes one or two channels a chunk at a time (`push`) and gives the figures once (`finish`), so a worker can read a file by slices; `measure(channels, sampleRate)` does a whole buffer. A `Measurement` holds the integrated loudness, the highest momentary and short-term loudness, a short-term series of at most 120 points and the loudness range (ITU-R BS.1770-4, EBU Tech 3341 and 3342), the true peak and the sample peak, the mean level and the crest factor, the level in seven bands from 20 Hz to 20 kHz for the sound, its mid and its side, the width, the correlation of left and right, each channel's DC offset, whether the stretch is silent, and the version of the measuring. A figure the stretch cannot give is null, so a result is JSON as it stands (docs/analysis.md).
