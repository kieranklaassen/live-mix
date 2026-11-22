# Measuring

`@kieranklaassen/live-mix/analysis` says what a stretch of sound measures:
how loud it is, how high it peaks, where its level lies from low to high, and
how its left and right stand to each other. It works on plain arrays, a chunk
at a time, with no Web Audio and no DOM, so a worker reads a file by slices
and measures it without holding the whole of it.

Every figure is a number or null. It is null where the stretch gives the
figure nothing to be measured on, so a result is JSON as it stands: it holds
no infinity and nothing that is not a number.

Nothing in `.`, `./dsp` or `./testing` reaches this entry, and the entry
reaches seven files of arithmetic and no package.

## Using it

```ts
// In a worker, or anywhere else: a stretch as it is read.
import { Measurer } from '@kieranklaassen/live-mix/analysis'

const measurer = new Measurer(sampleRate, 2) // one or two channels
for await (const [left, right] of slicesOfTheFile) {
  measurer.push([left, right]) // a Float32Array a channel, all of one length
}
const measurement = measurer.finish() // once: a measurer is read once
postMessage(measurement) // plain numbers and nulls
```

```ts
// A whole buffer in hand.
import { measure } from '@kieranklaassen/live-mix/analysis'

const measurement = measure([left, right], sampleRate)
```

The sound is pushed in order, in chunks of any size. What comes back does not
depend on how the sound was cut: the same stretch fed whole, 1,000 frames at
a time and 16,384 at a time gives the same result to the last bit.

The entry exports `Measurer`, `measure` and the types `Measurement`,
`BandLevels` and `ShortTermSeries`.

`new Measurer(sampleRate, channels)` throws a `RangeError` for a channel
count other than one or two. `push` throws a `RangeError` for a chunk of
another channel count or with channels of unequal length, and `push` and
`finish` throw once the measurer has been read.

## What comes back

A `Measurement`:

| Field              | Unit            | What it is                                                                                     | Null when                                                   |
| ------------------ | --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `version`          |                 | The version of the measuring, 1. It changes when a figure's meaning or method does             | never                                                       |
| `sampleRate`       | Hz              | As given                                                                                       | never                                                       |
| `channels`         |                 | 1 or 2                                                                                         | never                                                       |
| `frames`           | frames          | How many were pushed                                                                           | never                                                       |
| `seconds`          | s               | `frames / sampleRate`                                                                          | never                                                       |
| `silent`           | true or false   | True when no sample is other than zero                                                         | never                                                       |
| `integratedLufs`   | LUFS            | Gated loudness of the whole stretch                                                            | under 400 ms, or no 400 ms of it is over -70 LUFS           |
| `maxMomentaryLufs` | LUFS            | The highest loudness of any 400 ms                                                             | under 400 ms, or silent                                     |
| `maxShortTermLufs` | LUFS            | The highest loudness of any three seconds                                                      | under three seconds, or silent                              |
| `shortTerm`        |                 | Short-term loudness over time, below                                                           | never. Its `lufs` is empty under three seconds              |
| `loudnessRangeLu`  | LU              | Loudness range                                                                                 | under three seconds, or no three seconds are over -70 LUFS  |
| `truePeakDbtp`     | dBTP            | The highest peak between samples, over every channel                                           | silent                                                      |
| `samplePeakDbfs`   | dBFS            | The largest sample, over every channel                                                         | silent                                                      |
| `rmsDbfs`          | dBFS            | The mean level: the mean square over every channel and frame                                   | silent                                                      |
| `crestDb`          | dB              | Crest factor: `samplePeakDbfs - rmsDbfs`                                                       | silent                                                      |
| `bands`            |                 | Seven `BandLevels`, lowest first, below                                                        | never                                                       |
| `widthDb`          | dB              | The side's level over the mid's, over the whole stretch                                        | one channel, or no side (left the same as right), or no mid |
| `correlation`      | -1 to 1         | The sum of left times right, over the root of the product of the two channels' sums of squares | one channel, or either channel silent                       |
| `dcOffset`         | 1 is full scale | The mean sample value of each channel, one entry a channel                                     | an entry is null when the stretch has no frames             |

`shortTerm` is a `ShortTermSeries`:

| Field          | What it is                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `startSeconds` | 3: where the first point's three seconds end                                                                                                                                                                                                      |
| `hopSeconds`   | The time from one point to the next: 1, or `seconds / 120` when that is longer                                                                                                                                                                    |
| `lufs`         | At most 120 points. Point `n` is the loudness, in LUFS, of the three seconds that end at `startSeconds + n * hopSeconds`. A point is null where those three seconds hold no sound at all, at the head of the stretch or after its sound has ended |

Each of `bands` is a `BandLevels`:

| Field       | Unit | What it is                                           | Null when                                                    |
| ----------- | ---- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `fromHz`    | Hz   | The band's lower edge, which is in the band          | never                                                        |
| `toHz`      | Hz   | The band's upper edge, which is not                  | never                                                        |
| `levelDbfs` | dBFS | The level in the band, as the mean over the channels | nothing is in the band, or it lies over half the sample rate |
| `midDbfs`   | dBFS | The level in the band of (left + right) / 2          | one channel, or the stretch has no mid there                 |
| `sideDbfs`  | dBFS | The level in the band of (left - right) / 2          | one channel, or the stretch has no side there                |

The bands run from 20 to 60 Hz, 60 to 250, 250 to 500, 500 to 2,000, 2,000 to
4,000, 4,000 to 10,000 and 10,000 to 20,000.

A level in dBFS here is ten times the logarithm of a mean square, so a sine
that reaches full scale reads -3.01 and not 0. `rmsDbfs` and the bands share
that scale: the seven `levelDbfs` added as powers are `rmsDbfs`, less what
lies under 20 Hz and over 20 kHz, and in each band `midDbfs` and `sideDbfs`
added as powers are `levelDbfs`.

## How each figure is taken

**Loudness** is ITU-R BS.1770-4 as the engine's `LoudnessAnalyzer` does it:
both channels through the K weighting, 400 ms blocks every 100 ms, an
absolute gate at -70 LUFS and a relative gate 10 LU under the mean of what
passed the first. The measurer feeds the analyser up to the end of each of
its 100 ms steps and reads it there. The highest momentary loudness is the
highest of those readings from 400 ms in, and the highest short-term
loudness the highest from three seconds in. Sound after the last whole
100 ms step is in no loudness figure.

One channel is measured as one channel. A sine in one channel reads 3.01 LU
under the same sine in both, as the recommendation has it. A host that plays
a one-channel file out of two speakers at full level each has 3.01 LU more
than this figure.

**The short-term series** picks, from the readings taken every 100 ms, the
one nearest each point's time, so a point is never more than 50 ms from where
the table above puts it. For a second or two after a sound has ended a
point can read far under any sound, since the weighting still rings, and then
the points are null.

**The loudness range** is EBU Tech 3342: the short-term readings, every
100 ms from three seconds in, less those under -70 LUFS, less those more than
20 LU under the mean of the rest taken as powers. Sorted, the range is the
value 95% of the way up less the value 10% of the way up, each at the nearest
place in the list.

**True peak** is the engine's four-times oversampling filter from the same
recommendation, the highest value over both channels. **Sample peak** is the
largest sample. **Crest factor** is the sample peak over the mean level.

**The bands** come from a windowed FFT with half overlap. A frame is the
smallest power of two that holds a quarter of a second, which is 16,384
frames at 44,100 Hz and at 48,000 Hz. Its bins are then 2.7 or 2.9 Hz apart
and the lowest band holds 15 or 14 of them. A bin belongs to the band its
centre lies in. The window is a half sine. Its square and the square of the
window half a frame on add up to one, the first frame starts half a frame
ahead of the sound and the last ends after it, so every sample counts the
same and the bands add up to the sound's own power. In the tests a sine
inside a band puts 99.9% or more of the bands' power in that band, 15 Hz from
an edge as well as in the middle. What the window leaks further off was read
in one case: a 100 Hz sine left 86 dB less than itself in the band from 4 to
10 kHz, and a 6 kHz sine 67 dB less than itself in the band from 60 to
250 Hz.

Two channels are transformed as mid and side, in one transform, as its real
and imaginary parts. A frame with no side at all adds exactly nothing to the
side, and likewise the mid, which is why left equal to right reads a null
side and not a very small number.

**Width** is the side's level over the mid's over the whole stretch, in dB.
Two channels with nothing in common read 0, and the figure falls as they come
to agree. **Correlation** is the sum of left times right over the root of the
product of the channels' sums of squares. **DC offset** is the mean of each
channel's samples.

**Silent** means every sample is zero. A stretch that holds only low noise is
not silent: its integrated loudness and range are null when it never reaches
-70 LUFS, and its peak and its bands say how low it is.

## How long it takes

Measured on 22 November 2026 in Node 22.23.5 on a cloud container with four
cores of a 2.1 GHz Xeon, with the entry's source bundled into one file by
esbuild and run by a script that is not in the repository. The sound was ten
minutes of white noise in two channels at 44,100 Hz, made in memory. Other
work ran on the machine at the same time (a load of 4 to 5 on its four
cores), so a machine left alone would be somewhat faster.

| What                                                    | Time         |
| ------------------------------------------------------- | ------------ |
| `measure` over the ten minutes, two channels, four runs | 8.1 to 8.8 s |
| The same sound pushed a second at a time, one run       | 8.1 s        |
| `measure` over one of the channels alone, one run       | 7.2 s        |
| Of the two channels: the loudness analyser by itself    | 4.8 s        |
| Of the two channels: the bands by themselves            | 2.9 s        |

That is about 70 times faster than the sound plays. A run is on one thread
and holds it for as long as it takes, which is why it belongs in a worker.

The frame's size was chosen for the lowest band and not for speed. Every
sample is in two frames whatever the size, and a transform's work grows only
with the logarithm of its size, so a frame of half the length would save
about a fourteenth of the transforms' time and leave the lowest band seven
bins. What did change the time was one transform for mid and side in place of
two: the bands by themselves took 4.6 s with two.

Beside the chunk it is handed, a measurer holds its frames for the transform
(under 1 MB at these rates) and ten short-term readings for each second of
sound. Its memory was not measured.

## What has been checked, and where

| Check                                                                                                                                                                                                                 | Where it runs                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Every figure against a signal whose answer follows from how it was made: sines, steps and ramps of level, noise, silence                                                                                              | `pnpm test` (`src/analysis/__tests__`), in Node    |
| The same result however the sound is cut into chunks                                                                                                                                                                  | the same                                           |
| Every result is JSON as it stands                                                                                                                                                                                     | the same                                           |
| The entry exports two values, `.` exports neither, and the entry reaches seven files and no package                                                                                                                   | `pnpm test` (`src/__tests__/public-entry.test.ts`) |
| Each figure's test fails when the trait it measures is taken out of the code: 63 one-line changes, each of which failed a test. One, the crest taken from the true peak, passed at first, and a test was added for it | by hand, once, on 22 November 2026                 |
| The times above                                                                                                                                                                                                       | by hand, once, on 22 November 2026                 |

The loudness figures follow ITU-R BS.1770-4 and EBU Tech 3341 and 3342 from
their definitions as they are known here. No outside source was fetched
while this was written, so the tests use signals whose answers follow from
those definitions, and not the documents' own test files.

Not checked anywhere:

- The figures against another meter, or against the test signals that come
  with EBU Tech 3341 and 3342. They were not fetched.
- The entry in a browser or in a worker. It ran in Node only.
- The built entry (`dist/analysis/index.js`). The tests run the source, and
  the times were taken on a bundle of the source.
- A real recording. Every signal was made by arithmetic.
- A sample rate other than 8,000, 16,000, 44,100 and 48,000 Hz.
- A stretch longer than ten minutes, and how much memory a run holds.
- More than two channels. A measurer refuses them, and the weights the
  recommendation gives to surround channels are not here.
