# Stem separation

`@kieranklaassen/live-mix/separation` takes a finished track apart: four
stems (vocals, drums, bass, other) and a remainder, the remainder being the
track minus the four. The five added together are the track again, to the
sample, whatever the separator got wrong. Laid on a score as five tracks and
left untouched, they bounce back to the track, so a mix starts from the track
as it was and every move after that is a change to it.

The entry runs a model through an ONNX runtime the host hands in. The library
imports no runtime, ships no model and names no address for one. Nothing in
`.`, `./dsp` or `./testing` reaches this entry.

## Using it

Separating needs no DOM, so it belongs in a worker: a model holds the thread
for seconds at a time, and bringing a 48 kHz track to the model's rate and
back is about 15 s of arithmetic for four minutes of stereo.

```ts
// In a worker. The host loads the runtime and the model; the library is handed both.
import * as ort from 'onnxruntime-web'
import {
  createHybridModel,
  createSegmentSeparator,
  separateTrack,
} from '@kieranklaassen/live-mix/separation'

const session = await ort.InferenceSession.create(modelBytes, { executionProviders: ['wasm'] })
const separator = createSegmentSeparator(createHybridModel({ Tensor: ort.Tensor, session }))

const separation = await separateTrack({ channels, sampleRate }, separator, {
  signal, // an AbortSignal: the run rejects with its reason
  onProgress: ({ done, total }) => postMessage({ done, total }),
})
// separation.stems.vocals, .drums, .bass, .other and separation.remainder:
// each a Float32Array a channel, at the track's rate, length and channel count.
```

```ts
// On the page, where there is an AudioBuffer to keep a part in.
import { ScoreDocument, createScore, renderScore } from '@kieranklaassen/live-mix'
import { separationTracks } from '@kieranklaassen/live-mix/separation'

const document = new ScoreDocument(createScore())
const laid = separationTracks(document.score, separation)
document.apply(laid.operation) // five sources and five tracks, one step to undo

const bounce = await renderScore(document.score, {
  ...laid.render,
  renderer: { resolveSource: laid.resolveSource },
})
// bounce.audio is the track, until something on the desk is moved.
```

## What comes back

`separateTrack(audio, separator, options)` takes a `PlanarAudio` of one or two
channels at any sample rate and resolves to a `Separation`:

| Field        | What it is                                                                            |
| ------------ | ------------------------------------------------------------------------------------- |
| `sampleRate` | The track's own                                                                       |
| `stems`      | `vocals`, `drums`, `bass`, `other`: the track's channel count and frames each         |
| `remainder`  | The track minus the four stems, sample by sample                                      |
| `report`     | `remainderDb`, `remainderPeak`, `modelSampleRate`, `resampled`: what the run measured |

The track goes to the separator at the separator's rate and in two channels.
A track at another rate is resampled there and its stems are resampled back
to exactly the track's frames (a windowed sinc, `src/separation/resample.ts`);
a mono track is given on both channels and its stems are the mean of the two
that come back. The remainder is taken last, at the track's rate, so what the
two resamplings lost is in the remainder and the sum still holds.

`report.remainderDb` is the remainder's level against the track's, both as
the mean square over every channel. It says how much of the track the stems
do not account for. A remainder that is not small is not an error: the
remainder is a track on the desk like the others.

The run rejects with a `SeparationError`, and gives nothing, when

- the track has no frames, more than two channels, or channels of unequal
  length;
- a stem holds a value that is not finite;
- a stem's largest sample is more than 12 dB over the track's. A model run on
  a graphics card can answer with numbers that are not sound and report no
  error; this is the check that catches it.

It rejects with the signal's reason when `options.signal` fires. The signal
is looked at before each segment, so a run ends within a segment's time.

## On a score

`separationTracks(score, separation)` returns what a host needs to put the
five parts on a desk. It changes nothing itself.

| Field           | What it is                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `operation`     | One `batch`: five `source.add` and five `track.add`, each track with one clip from 0 to the track's end |
| `parts`         | For each of the five, the `trackId` and `sourceId` it was given                                         |
| `buffers`       | Each new source's sound as an `AudioBuffer`, by source id                                               |
| `resolveSource` | For a render's `renderer.resolveSource`: one of these sources' sound, and nothing for any other         |
| `render`        | `durationSec`, `sampleRate`, `numberOfChannels` for `renderScore`, so the bounce has the track's frames |

The tracks are named Vocals, Drums, Bass, Other and Remainder, go to the
master, and have a strip at its defaults. Their ids are the parts' names; when
the score already has a track or a source under one of them, all five take
the same suffix (`vocals-2`, `drums-2`, and so on).

A live engine is handed the sounds before the operation is applied:
`engine.samples.load(sourceId, buffer)` for each entry of `buffers`. The same
buffers serve the engine and a render. Once they exist the planar copy in the
`Separation` can be dropped: four minutes of stereo at 44.1 kHz is about
420 MB as five parts, and as much again as buffers.

`separationTracks` makes each buffer with `new AudioBuffer`, which a page has
and a worker has not. Pass `createBuffer` to make them another way.

### Why each part ends in silence

Each buffer holds its part and then 20 ms of silence, and each clip ends
where the track does, ahead of its buffer's end. An audio track eases a clip
in or out over 5 ms where the sound would step, and it decides from the sound
alone. A stem that ends partway through a wave would be faded where the stem
beside it was not, and the five would no longer add up. A clip that ends
ahead of its sound's end, where what follows is silence, is left square. With
the silence the untouched bounce is the track to 138 dB under full scale;
without it the same bounce is 10 dB under (both measured, below).

## A separator

`separateTrack` takes anything that answers this:

```ts
interface Separator {
  readonly sampleRate: number
  separate(channels: Channels, options?: SeparateOptions): Promise<Record<StemName, Channels>>
}
```

Two channels at `sampleRate` in, and for each stem two channels of the same
length out. A host that sends a track to a service of its own writes one of
these around the call, and gets the resampling, the guard, the remainder and
the tracks for nothing.

`createSegmentSeparator(model, { overlap })` is the separator for a model
that takes a segment of fixed length. It cuts the track into segments that
overlap by a quarter, hands each to the model, and adds the answers back with
the most weight on the middle of each. It knows nothing else about the model:

```ts
interface SegmentModel {
  readonly sampleRate: number
  readonly segmentFrames: number
  run(segment: Channels): Promise<Record<StemName, Channels>>
}
```

`createHybridModel(runtime, spec)` is the first kind of model: one that takes
a segment's waveform and its spectrogram, and answers with a spectrogram and
a waveform for each stem, a stem being the inverse transform of the first
plus the second. `runtime` is `{ Tensor, session }`: the tensor class of the
ONNX runtime the host loaded and the inference session it made
(`onnxruntime-web`'s fit as they are, checked against the types of 1.31.1).
Tensors are fed and read by position, the waveform first going in and the
spectrogram first coming out, since an export's names are generated.

`HYBRID_MODEL_SPEC` holds the numbers of the one export this was run with: a
sample rate of 44,100, a segment of 343,980 frames (7.8 s), a transform of
4,096 with a hop of 1,024, and the stems in the order drums, bass, other,
vocals. An export with other numbers passes its own spec.

## What a host serves and loads

- **The runtime.** `onnxruntime-web`, an optional dependency of the host and
  not of this library. Its WebAssembly files are served beside the page.
- **The model.** One `.onnx` file, 174 MB for the export this was run with.
  The host fetches it, keeps it (the Cache API or the origin's private file
  system), and hands the bytes to `InferenceSession.create`.
- **Threads.** The runtime's WebAssembly build uses several threads only on a
  page that is cross-origin isolated (`Cross-Origin-Opener-Policy: same-origin`
  and `Cross-Origin-Embedder-Policy: require-corp`). Without that it runs on
  one, about three times slower in the figures below.
- **A worker.** For the reasons above. The channels and the parts move
  between the worker and the page as transferable buffers.
- **Memory.** The run below held 2.9 GB in Node on the WebAssembly build.
  Nobody has measured a browser tab.

## Weights and their license

The library ships no weights, and the choice of weights is the host's. This
section exists because a host has to know where that choice stands.

`HYBRID_MODEL_SPEC` describes the four-stem Hybrid Transformer Demucs model
(`htdemucs`) published with the Demucs project. Its code is under the MIT
license. Its weights are not covered by that license: the export this was run
with (the npm package `demucs`, version 1.0.0, file `htdemucs.onnx`) says the
file "is derived from a weights file provided by Meta, which is made
available for personal and research use only". Whether a product may serve
those weights to its users has not been settled here and is not this
library's to settle. A separator of another kind, with weights under a stated
license, takes the same place behind `Separator` or `SegmentModel`.

## Measured

On 21 November 2026, with `scripts/try-separation.mjs`, which runs the built
entry in Node on the runtime's WebAssembly build. The machine is a cloud
container with four cores of a 2.1 GHz Xeon and no graphics card. The
recording is a 10.9 s excerpt of a song with a voice, a kit, a bass and
guitars, released under Creative Commons Attribution 3.0, at 44.1 kHz stereo
and again resampled to 48 kHz. It is two segments long.

| What                                                            | Figure                           |
| --------------------------------------------------------------- | -------------------------------- |
| A segment (7.8 s of sound), four threads                        | 5.7 to 6.6 s                     |
| A segment, one thread                                           | 16.7 to 17.7 s                   |
| Making the session from the model's bytes                       | 1.3 s                            |
| Resident memory at the end of the run                           | 2.9 GB                           |
| The remainder against the track (`report.remainderDb`)          | -29.6 dB at both rates           |
| The five parts added together against the track, largest sample | 138 dB under full scale, or less |
| Each stem against the track: vocals, drums, bass, other         | -6.8, -4.9, -8.3, -7.1 dB        |
| Where each stem's spectrum sits: vocals, drums, bass, other     | 2,439 Hz, 523 Hz, 127 Hz, 623 Hz |

Each segment after the first adds 5.85 s of track, so on that machine a
track takes about as long as it plays on four threads and about three times
as long on one. That is an estimate from two segments, not a measured song.

The remainder is not even over the track. Through the body of the recording
it is 25 to 31 dB under the track. In the first 35 ms it is 14 dB under: the
model's transform has no frames from before a segment's start, so there the
stems come up short of the track, and the remainder holds the rest. In the
last 35 ms, where the recording has faded to almost nothing, it is 12 dB
under, and most of that is the recording's own offset from zero.

The untouched bounce, in headless Chromium on the same machine with a
stand-in separator (`browser-tests/specs/separation.spec.ts`): the bounce
minus the track is 138 dB under full scale for a stereo track at 44.1 kHz and
at 48 kHz and for a mono track at 48 kHz, and 144 dB under for a mono track
at 44.1 kHz. With the remainder's track muted the same measure is 1.4 dB
under full scale, and with no silence after each part it is 10.4 dB under, so
the check fails when either is taken away.

## How it follows the model's reference

A model answers best to what it was trained on, so the signal conventions are
those of the model's reference implementation:

- The transform is a Hann window of 4,096 with a hop of 1,024, scaled by one
  over the square root of the size, on a segment reflected 1,536 frames past
  each end, with the first two and last two frames and the top bin left out.
  The inverse puts those frames back as silence, which is why a segment's
  first and last 1,536 frames fall to half level at its very edge.
- Segments are 343,980 frames and start every 257,985. Each is weighted by a
  triangle, so where two overlap the edge of one counts for next to nothing.
  A last piece shorter than a segment sits in the middle of one, with the
  track on both sides of it where there is some.
- The track is brought to a mean of 0 and a deviation of 1 as one channel
  before the model, and its answers are brought back to the track's level.

Where it departs:

- **The mean is not added back.** The reference adds the track's mean to each
  of the four stems. A recording that stands off zero then has its offset on
  every stem and three times it, turned over, in the remainder. Here the
  offset stays out of the stems. The recording above has a mean of 0.0012,
  which is how this was found.
- **No shifts.** The reference can run a track several times at small offsets
  and average. This runs it once.

## What has been checked, and where

| Check                                                                                                                                                  | Where it runs                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The transform and its inverse, the resampler, the segment runner, the model adapter, the remainder and the guard, the tracks and what a render is told | `pnpm test` (`src/separation/__tests__`, stand-in models and the mock graph)                                                                           |
| The entry reaches no ONNX runtime, and `.` exports none of it                                                                                          | `pnpm test` (`src/__tests__/public-entry.test.ts`)                                                                                                     |
| An untouched bounce of the five tracks is the track, at two rates, stereo and mono                                                                     | `pnpm test:browser`, real `OfflineAudioContext` in headless Chromium, stand-in separator                                                               |
| A real model on a real recording: it runs, the parts add up, the bass comes out lowest                                                                 | `scripts/try-separation.mjs` by hand, Node, WebAssembly, once                                                                                          |
| The transform against the one that comes with the export                                                                                               | by hand, once: equal to 141 dB under in every frame but a segment's first two, where that code fills the start with silence in place of the reflection |

Not checked anywhere:

- **Nobody has listened to a stem.** Every figure above is a measurement.
- The stems against the model's reference implementation. It was not
  installed here, so the conventions rest on the figures above and on the
  comparison of the transform.
- The real model in a browser, on a graphics card (WebGPU), or on a phone.
- A whole song: the longest run is 10.9 s. Time and memory for four minutes
  are estimates.
- The five tracks played by a live engine. The render is checked; the live
  path is the same tracks and buffers and has not been run.
- A model of any other kind or with other numbers than `HYBRID_MODEL_SPEC`.
