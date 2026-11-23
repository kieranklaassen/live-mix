# Stem separation

`@kieranklaassen/live-mix/separation` takes a finished track apart: its stems
and a remainder, the remainder being the track minus every stem. A separator
says which stems it answers with, and one that says none answers four: vocals,
drums, bass and other. The parts added together are the track again, to the
sample, whatever the separator got wrong and however many parts there are.
Laid on a score as tracks and left untouched, they bounce back to the track,
so a mix starts from the track as it was and every move after that is a
change to it.

More parts come three ways, and the three combine: a model that answers more
stems ([the three kinds of model](#the-three-kinds-of-model)), several
separators that stand as one ([joining](#joining-separators)), and a part
taken apart further by a second separator ([splitting](#splitting-a-part)).
The same model can also be asked to go over a track more than once
([more than one pass](#more-than-one-pass)). What each costs, and what is
published of each, is under
[more parts, or more passes](#more-parts-or-more-passes-what-each-costs).

The entry runs a model through an ONNX runtime the host hands in. The library
imports no runtime, ships no model and names no address for one. Nothing in
`.`, `./dsp` or `./testing` reaches this entry.

## Using it

Separating needs no DOM, so it belongs in a worker: a model holds the thread
for seconds at a time, and bringing a 48 kHz track to the model's rate and
back is about 15 s of arithmetic for four minutes of stereo and four stems.
Each further stem is one more resampling on the way back.

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
document.apply(laid.operation) // a source and a track for each part, one step to undo

const bounce = await renderScore(document.score, {
  ...laid.render,
  renderer: { resolveSource: laid.resolveSource },
})
// bounce.audio is the track, until something on the desk is moved.
```

That is the default: one model of the four stems, run once. Every call
written against four stems and a remainder compiles and behaves as it did
before the entry took other stems, and for that run the samples are the same
bits (`src/separation/__tests__/default-run.test.ts` holds them to a
checksum).

## What comes back

`separateTrack(audio, separator, options)` takes a `PlanarAudio` of one or two
channels at any sample rate and resolves to a `Separation`:

| Field        | What it is                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `sampleRate` | The track's own                                                                                             |
| `names`      | The stems in order, as the separator names them: `vocals`, `drums`, `bass`, `other` for one that names none |
| `stems`      | A record by name: for each stem the track's channel count and frames                                        |
| `remainder`  | The track minus every stem, sample by sample                                                                |
| `report`     | `remainderDb`, `remainderPeak`, `modelSampleRate`, `resampled`, and `splits` once a part has been split     |

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
- the separator's stems are no list of names ([naming stems](#naming-stems));
- the separator's answer leaves out a stem it names, or holds a stem it does
  not name. A model of six parts run without its list would otherwise lose
  two stems into the remainder without a word;
- a stem holds a value that is not finite;
- a stem's largest sample is more than 12 dB over the track's. A model run on
  a graphics card can answer with numbers that are not sound and report no
  error; this is the check that catches it.

It rejects with the signal's reason when `options.signal` fires
([progress and stopping](#progress-and-stopping)).

## Naming stems

A separator says its stems in `stems`, a list in the order a desk lists them.
A separator that says none answers the four, in the order of `STEM_NAMES`.

```ts
import { partNames, separateTrack, type Separator } from '@kieranklaassen/live-mix/separation'

const separator: Separator<'vocals' | 'accompaniment'> = {
  sampleRate: 44100,
  stems: ['vocals', 'accompaniment'],
  separate, // two channels in, two channels for each of the two names out
}
const separation = await separateTrack(audio, separator)
partNames(separation) // ['vocals', 'accompaniment', 'remainder']
separation.stems.accompaniment // typed: the record has the two names and no other
```

A name is a lower-case letter followed by lower-case letters, digits or
hyphens: `kick`, `lead-2` and `a` are names. A list is refused, with the name
that is refused, when it is empty, names a stem twice, holds a name of another
shape (`Kick`, `2nd`, `a/b`, `__proto__`, an empty one), or names `remainder`,
which is what the stems leave of a track and no stem. A stem's name is a key
of a record, an id on a score and a host's file name as it stands, which is
why the shape is this narrow.

The same check holds every list of names that enters: a separator's `stems`,
a model's, a spec's, the `take` of a joined set, a separation's `names` and a
split's `rest`. It runs before a model is asked or a track resampled. An
answer is read by its own keys only, so nothing an object inherits is taken
for a stem.

A separation carries its stems' order in `names`, which `separateTrack` and
`splitPart` always set. Two functions read it:

| Function                | What it gives                          |
| ----------------------- | -------------------------------------- |
| `stemNames(separation)` | The stems in order                     |
| `partNames(separation)` | The stems in order, then `'remainder'` |

A separation written by hand may leave `names` out and is then read as the
four. Both functions refuse a separation whose record is not exactly its
names: a record with a stem the names do not say, or names that say a stem
the record does not hold, each by that stem's name. So a separation written
by hand with six stems and no `names` is refused, and is never laid or split
as four.

The types take the stems' names as a parameter that defaults to the four:
`Separator<Name>`, `SegmentModel<Name>`, `Separation<Name>`,
`SeparationTracks<Name>` and `HybridModelSpec<Name>`. `STEM_NAMES`, `StemName`,
`PART_NAMES` and `PartName` stay the four and the five. A separation of other
names does not compile where a `Separation` of the four is asked for.

## On a score

`separationTracks(score, separation)` returns what a host needs to put the
parts on a desk, however many there are. It changes nothing itself.

| Field           | What it is                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| `operation`     | One `batch`: a `source.add` and a `track.add` for each part, each track with one clip from 0 to the track's end |
| `parts`         | For each part, by its name, the `trackId` and `sourceId` it was given                                           |
| `buffers`       | Each new source's sound as an `AudioBuffer`, by source id                                                       |
| `resolveSource` | For a render's `renderer.resolveSource`: one of these sources' sound, and nothing for any other                 |
| `render`        | `durationSec`, `sampleRate`, `numberOfChannels` for `renderScore`, so the bounce has the track's frames         |

There is a track for each part, the stems in the separation's order and the
remainder last. That order is `partNames(separation)`: the result holds no
list of its own. A track is named after its part with a capital first letter
and a space for each hyphen, so the five are Vocals, Drums, Bass, Other and
Remainder, `guitar` is Guitar and `lead-vocals` is Lead vocals. The tracks go
to the master and have a strip at its defaults.

The ids are the parts' names. When one of them is taken, by a track, a group,
a return, an element track or a source of the score, or by the score's
`master`, every part takes the same suffix (`vocals-2`, `drums-2`, and so
on), the first under which none is taken.

`separationTracks` throws a `SeparationError` when the separation's record is
not its names, and when a part has another length or channel count than the
remainder, with that part's name.

A host splits before it lays. Nothing here replaces a part that is already on
a score by its split, and laying a separation a second time adds every part
again, under the next suffix.

A live engine is handed the sounds before the operation is applied:
`engine.samples.load(sourceId, buffer)` for each entry of `buffers`. The same
buffers serve the engine and a render. Once they exist the planar copy in the
`Separation` can be dropped: four minutes of stereo at 44.1 kHz is about
85 MB a part, so about 425 MB as five parts, and as much again as buffers.

`separationTracks` makes each buffer with `new AudioBuffer`, which a page has
and a worker has not. Pass `createBuffer` to make them another way.

### Why each part ends in silence

Each buffer holds its part and then 20 ms of silence, and each clip ends
where the track does, ahead of its buffer's end. An audio track eases a clip
in or out over 5 ms where the sound would step, and it decides from the sound
alone. A stem that ends partway through a wave would be faded where the stem
beside it was not, and the parts would no longer add up. A clip that ends
ahead of its sound's end, where what follows is silence, is left square. With
the silence the untouched bounce of five parts is the track to 138 dB under
full scale; without it the same bounce is 10 dB under (both measured, below).

## A separator

`separateTrack` takes anything that answers this:

```ts
interface Separator<Name extends string = StemName> {
  readonly sampleRate: number
  readonly stems?: readonly Name[]
  steps?(frames: number): number
  separate(channels: Channels, options?: SeparateOptions): Promise<Record<Name, Channels>>
}
```

Two channels at `sampleRate` in, and for each stem it names two channels of
the same length out, with no stem it does not name. The channels handed in
are not written to. `steps` is optional: how many times a run over a track of
that many frames, counted at `sampleRate`, calls `onProgress`
([progress and stopping](#progress-and-stopping)).

### A separator that is a service

A host that sends a track to a service of its own writes a separator around
the call, and gets the resampling, the guard, the remainder, the joining, the
splitting and the tracks for nothing. The library calls no service and names
none: this is the interface a host fills.

```ts
import { type Channels, type Separator } from '@kieranklaassen/live-mix/separation'

// The host's own: where the sound is sent, how it is signed in, and how the
// stems come back are its to write. Nothing of it is in the library.
declare function askService(
  channels: Channels,
  signal?: AbortSignal,
): Promise<{ vocals: Channels; accompaniment: Channels }>

const service: Separator<'vocals' | 'accompaniment'> = {
  sampleRate: 44100,
  stems: ['vocals', 'accompaniment'],
  async separate(channels, options = {}) {
    const { vocals, accompaniment } = await askService(channels, options.signal)
    return { vocals, accompaniment }
  },
}
```

It says no `steps`, so a joined set counts it as one step. Its answer is held
to its names, its length and the guard like any other.

## A model run a segment at a time

`createSegmentSeparator(model, { overlap, shifts, seed })` is the separator
for a model that takes a segment of fixed length. It cuts the track into
segments that overlap by a quarter, hands each to the model, and adds the
answers back with the most weight on the middle of each. `overlap` is how
much of a segment the next one covers again, 0 or more and less than 1;
anything else is refused when the separator is made. Its stems are the
model's. It knows nothing else about the model:

```ts
interface SegmentModel<Name extends string = StemName> {
  readonly sampleRate: number
  readonly segmentFrames: number
  readonly stems?: readonly Name[]
  readonly standardize?: boolean
  run(segment: Channels): Promise<Record<Name, Channels>>
}
```

`stems` is the model's list, the four when it says none, and each segment's
answer is held to it as a separator's is. `standardize` says whether the
track is brought to a mean of 0 and a deviation of 1 before the model is run,
and its level brought back after. A model that says nothing is run so. One
that says `false` was trained on sound as it is: it is handed the track's own
values, and what it answers is kept at the level it answered.

### More than one pass

`shifts` is how many times the track is gone over, a whole number from 1,
refused otherwise when the separator is made. The first pass cuts the track
as above. Each later pass has some silence in front of the track, so its
segments fall elsewhere, and a frame that sat at the edge of one pass's
segment sits further into another's.

```ts
const separator = createSegmentSeparator(model, { shifts: 3, seed: 7 })
```

| Pass     | Silence in front of the track                                                                          | Segments                         |
| -------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 1        | None                                                                                                   | `ceil(frames / stride)`          |
| 2 and on | A whole number of frames from 0 to half a second, both ends included, drawn from the seed and the pass | `ceil((frames + lead) / stride)` |

`stride` is `floor((1 - overlap) × segmentFrames)`, `frames` is the track's
at the model's rate and `lead` is that pass's silence.

- Every pass adds its weighted answers and its weights into the same sums,
  and the division by the summed weights comes once at the end. The passes
  are pooled frame by frame, and a frame leans most on the passes where it
  sits furthest into a segment. What a model answers to the silence in front
  of the track is left out.
- The mean and the deviation are the track's alone, taken once, and the same
  in every pass.
- The offsets come from `seed` (default 0, brought to a whole number as the
  engine's other seeds are) and the pass's number, and from nothing else. A
  run is the same twice, and the same seed draws the same offsets for every
  track and for every separator made with it. Another seed draws others.
- One pass, the default, draws nothing: it does what the runner did before it
  had passes, in the same order, and a seed with one pass does nothing.
- **The cost.** A pass takes about the time of the first: the same segments,
  and one more where its silence carries the track over a stride. Three
  passes are about three times the run. Memory does not grow with the passes:
  the sums are one set, and no pass's answer is held beside another's.

Whether more passes give a closer separation has not been measured here
([what each costs](#more-parts-or-more-passes-what-each-costs)).

## The three kinds of model

Each is a `SegmentModel` made from `runtime`, which is `{ Tensor, session }`:
the tensor class of the ONNX runtime the host loaded and the inference
session it made (`onnxruntime-web`'s fit as they are, checked against the
types of 1.31.1). Every kind takes a segment's sound and answers stems'
sound, so `createSegmentSeparator` runs all three the same way. What differs
is what the session behind it takes and gives:

| Kind                 | Made by                  | The session takes                                                                        | The session gives                                                                                              | The transform                       | Stems           | Standard level |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------- | -------------- |
| Hybrid               | `createHybridModel`      | The segment's sound `[1, 2, segmentFrames]`, then its spectrogram `[1, 4, bins, frames]` | Every stem's spectrogram `[1, stems, 4, bins, frames]`, then every stem's sound `[1, stems, 2, segmentFrames]` | Outside the graph, at a quarter hop | The spec's list | Yes            |
| Waveform             | `createWaveformModel`    | The segment's sound `[1, 2, segmentFrames]`                                              | Every stem's sound `[1, stems, 2, segmentFrames]`                                                              | Inside the graph                    | The spec's list | Yes            |
| One-stem spectrogram | `createSpectrogramModel` | The segment's spectrogram `[1, 4, bins, frames]`                                         | One stem's spectrogram `[1, 4, bins, frames]`                                                                  | Outside the graph, the centred one  | One name        | No             |

What holds for an export of any kind:

- Tensors are `float32`, one segment to a run, and are fed and read by their
  place in the session's lists of inputs and outputs, not by name: an
  export's names are whatever its exporter left.
- A segment has the frames the export was made with. A sound tensor holds the
  left channel, then the right. A spectrogram's four planes are the left
  channel's real parts, its imaginary parts, the right channel's real parts
  and its imaginary parts, each as `bins` rows of `frames`.
- A session with another count of inputs or outputs is refused when the model
  is made, and an answer of another size is refused when it comes, with what
  was found.
- A spec's `stems` are in the order of the session's tensor. A model whose
  spec names exactly the four says them as a desk lists them, vocals first,
  whatever order its tensor holds them in, so the default separation is laid
  as it always was. A model of other names says them in its spec's order. A
  host that wants another order joins a set of one and takes the names in
  that order ([joining](#joining-separators)).

### Hybrid

`createHybridModel(runtime, spec)` is the first kind: a model that takes a
segment's waveform and its spectrogram, and answers with a spectrogram and a
waveform for each stem, a stem being the inverse transform of the first plus
the second. The transform is done here, at a size that is a power of two with
a hop of a quarter of it ([how it follows the reference](#how-it-follows-the-models-reference)).

`HYBRID_MODEL_SPEC` holds the numbers of the one export this was run with: a
sample rate of 44,100, a segment of 343,980 frames (7.8 s), a transform of
4,096 with a hop of 1,024, and the stems in the order drums, bass, other,
vocals. `createHybridModel(runtime)` with no spec is that model. An export
with other numbers or other stems passes its own spec, and the session's
tensors are then as many stems wide as the spec names:

```ts
const six = createHybridModel(runtime, {
  ...HYBRID_MODEL_SPEC,
  // The order of this file's tensor, read off the file itself.
  stems: ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'],
})
```

There is no constant for a spec of six parts. Published exports of a six-part
model disagree on the order of their last two stems, so a host writes the
spec from its own file.

### Waveform

`createWaveformModel(runtime, spec)` is for an export that keeps its
transform inside the graph: sound in, every stem's sound out. Nothing is done
here but laying the segment into one tensor and reading the stems out of one.
The spec is `{ sampleRate, segmentFrames, stems }`.

```ts
const model = createWaveformModel(runtime, {
  sampleRate: 44100,
  segmentFrames: 343980,
  stems: ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'],
})
const separator = createSegmentSeparator(model)
```

The track is brought to a standard level for this kind as for the hybrid one:
the reference of the family these exports come from does so before the model,
whatever is inside the graph.

### One-stem spectrogram

`createSpectrogramModel(runtime, spec)` is for an export that takes a
segment's spectrogram and answers one stem's, with the transform outside the
graph. A set of them, one for each stem, is joined to take a track apart.

| Field of the spec | What it is                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `sampleRate`      | The sample rate of the sound the model was trained on                                        |
| `fftSize`         | The size of the transform: a power of two times 1, 3, 5 or 15                                |
| `hop`             | The frames from one frame of the transform to the next. It does not have to divide the size  |
| `bins`            | How many of a frame's `fftSize / 2 + 1` bins the model takes, from the lowest up             |
| `frames`          | The frames of spectrogram the model takes. A segment is `hop × (frames - 1)` frames of sound |
| `stem`            | The one stem the model answers                                                               |
| `gain`            | What the stem's sound is multiplied by. Default 1                                            |

```ts
const voice = createSpectrogramModel(runtime, {
  sampleRate: 44100,
  fftSize: 6144,
  hop: 1024,
  bins: 2048,
  frames: 512, // a segment of 523,264 frames, 11.87 s
  stem: 'vocals',
})
```

- **The transform** is centred: half a size of frames is reflected on each
  side of the segment, the window is a periodic Hann, and nothing is scaled.
  A segment of `n` frames gives `n / hop + 1` frames of spectrogram. The
  inverse divides each frame of sound by the squared windows that cover it,
  so a segment comes back whole from its first frame to its last.
- **The sizes.** A table published with one-stem files of this kind gives,
  for 44 files, transform sizes of 4,096 (2 files), 5,120 (6), 6,144 (15),
  7,680 (17), 8,192 (2) and 16,384 (2), with 2,048 or 3,072 bins kept and 256
  or 512 frames at a hop of 1,024 (read on 23 November 2026). That is why the
  transform takes a power of two times 1, 3, 5 or 15, and why a hop need not
  divide the size: 1,024 does not divide 7,680.
- **The cut-off.** The model takes the first `bins` bins and the ones above
  are read back as silence. So the stem is cut off above
  `bins × sampleRate / fftSize`: 14,700 Hz for the spec above. What lies
  above is no part of the stem and goes to the remainder.
- **No standard level.** A model of this kind is trained on sound as it is,
  so it says `standardize: false` and the runner hands it the track's own
  values. One consequence: it does not answer silence with silence
  ([one silent segment before a track](#one-silent-segment-before-a-track)).
- **The gain.** A table published with such files gives each a factor: 1.035
  for five of the seven files run here, 1.065 and 1.021 for the other two.
  Its use is disputed. The code the first files of this kind were published
  with applies none. One program that runs them multiplies the stem's sound
  by it, and another leaves the stem as the model gave it and uses the factor
  only when it takes the stem from the track. Here `gain` multiplies the
  stem, and left out it is 1. A run with the factor and one without settle
  nothing either way ([measured](#four-one-stem-files-joined)).
- The spec is checked when the model is made: a size, a hop, a count of bins
  or of frames the transform does not take, a stem that is no name, and a
  gain that is no finite number are each refused there.

## Joining separators

`joinSeparators(set)` makes one separator of several. Each is run over the
track in turn and the stems the set keeps of it are kept. It covers a set of
one-stem models, a set of models each kept for the one stem it was tuned for,
and one model's vocals beside another's three.

```ts
import { joinSeparators } from '@kieranklaassen/live-mix/separation'

// One model's drums, bass and other beside another's vocals.
const joined = joinSeparators([
  { separator: hybrid, take: ['drums', 'bass', 'other'] },
  { separator: voice }, // a one-stem separator that answers `vocals`
])
// joined.stems: ['drums', 'bass', 'other', 'vocals']
const separation = await separateTrack(audio, joined)
```

- A member is `{ separator, take }`. `take` is the stems kept of that
  separator, in the order the set says them. Left out, every stem of the
  separator is kept, in the separator's order.
- The joined separator's `stems` are the kept names in order: each member's
  in the order it names them, the members in the order they are given.
- A set of one is allowed. It is how a host picks some of a separator's
  stems, or says them in another order:
  `joinSeparators([{ separator, take: ['other', 'vocals'] }])`.
- The separators run one after another and never two at once, each handed the
  same channels. A stem the set does not keep is let go before the next
  separator starts. A model makes every stem it has, so what is held at once
  is one separator's whole answer and the stems kept so far.
- Each separator's answer is held to the stems that separator names. A
  separator that rejects makes the joined one reject with the same error.

The set is refused when it is joined, with a `SeparationError`: an empty set,
a separator's stems or a `take` that are no list of names (an empty `take`
among them), a `take` that names a stem its separator does not answer, one
name kept twice across the set, and separators at different sample rates,
with both rates in the message.

A stem the set does not keep is let go and is in no part. With
`take: ['drums', 'bass', 'other']` of a model of four, that model's vocals
are in no part, and whatever of the track no kept stem holds is in the
remainder.

## Splitting a part

`splitPart(separation, name, separator, options)` takes one part apart with a
second separator: the drums into a kick, a snare, toms and cymbals, the
vocals into a lead and a backing. It answers a new separation in which the
part is replaced, in its place, by the second separator's stems in their
order and then by what they leave of the part.

```ts
import { splitPart } from '@kieranklaassen/live-mix/separation'

// separation.names: ['vocals', 'drums', 'bass', 'other']
const kit = await splitPart(separation, 'drums', drumSeparator)
// kit.names: ['vocals', 'kick', 'snare', 'toms', 'cymbals', 'drums', 'bass', 'other']
// kit.stems.drums = the old drums - kick - snare - toms - cymbals

const both = await splitPart(kit, 'vocals', leadSeparator, { rest: 'backing' })
// both.names: ['lead', 'backing', 'kick', 'snare', 'toms', 'cymbals', 'drums', 'bass', 'other']
```

After `drums` is split, the part named `drums` is what the kick, snare, toms
and cymbals left of it, unless `rest` names it. A level or a chain a host
keeps under the name `drums` then lands on that leftover and not on the drums
as a whole. `rest` gives what is left another name, as `backing` above.

- The separator is run over the part as `separateTrack` runs one over a
  track: the part goes to it at its rate and in two channels, and its stems
  come back at the part's rate, length and channel count.
- The stems and what they leave add up to the part, to the sample, as the
  stems and the remainder add up to the track. So every part of the new
  separation still adds up to the track.
- The separation's one remainder is not touched. It is the same array in the
  answer, and so is every part that was not split. The separation handed in
  is not written to, so a split that is refused or stopped leaves the host
  what it had.
- The answer can be split again, and so can a part that a split made.
- `report.splits` gains an entry for each split, in the order they were made:
  `part`, the `names` that stand in its place, `restDb` and `restPeak` (what
  is left against the part, as `remainderDb` and `remainderPeak` are against
  the track), `modelSampleRate` and `resampled`. The report's four figures of
  the remainder stay as they were.

It rejects with a `SeparationError` before the separator is asked when the
separation's record is not its names, when it has no part of that name, when
the part is `remainder` (which no separator gave and is not split), when the
separation has no report (a split is of a separation the engine made), when
the separator's stems or `rest` are no names, when what is left would have
the name of one of the separator's stems, and when a name the part is split
into is another part's already. Once the separator is asked it rejects as
`separateTrack` does, with a sub-stem held to 12 dB over the part's largest
sample and a message that names the sub-stem and the part.

**A silent part.** A stem whose largest sample is under 0.000001, 120 dB
under full scale, is let be however quiet the part. A part that is silence,
split by a model that is run at a standard level, comes back as silent stems
and a silent rest and is not refused: the model's answer is brought back to
the part's level, which is nothing. A one-stem spectrogram model is not run
at a standard level and does not answer silence with silence. A silent
segment through each of the four one-stem files run here came back with a
largest sample 46.8 to 57.4 dB under full scale, and the guard refused that
answer of a silent track: "the vocals stem peaks at 0.00208, more than 12 dB
over the track" ([measured](#silence)). So a host should expect a split of a
silent part by a file of that kind to be refused, and looks at the part's
level before it splits. A split of a silent part was not itself run: the
limit of a split is taken from the part's largest sample by the same code.

**Splits are chained.** A session is asked for one segment at a time, so two
splits are awaited one after the other and not run side by side. Each also
answers a new separation made from the one it was handed, so the second split
is of the first one's answer, as above.

**A host splits before it lays.** `separationTracks` lays the separation it
is handed. A separation laid, split and laid again is on the score twice.

## Progress and stopping

`options.onProgress` is called with `{ done, total }`, once a step. Within one
call `total` never changes, `done` rises by one from 1, and the last call has
`done` equal to `total`. That holds through every pass of a segment separator
and across every separator of a joined set.

| Separator           | A step                          | `steps(frames)`                                                               |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| A segment separator | One segment of one pass         | The segments of every pass, added                                             |
| A joined set        | A step of one of its separators | The sum of its separators' counts, a separator that says none counting as one |

A separator that says no `steps` reports as it likes, or not at all.

`frames` is counted at the separator's own `sampleRate`, which is what
`separateTrack` hands it after resampling. Every offset of a later pass is
drawn before the first segment, so the count is known from the start. In a
joined set a separator that says its steps has each of its reports passed
on, counted on from the separators before it. One that does not is counted
once, when it has answered, and what it reports itself is not passed on.

`separateTrack` and `splitPart` hand `onProgress` to the separator and add no
step of their own: bringing a track to the separator's rate and its stems
back is not counted.

A run that is stopped rejects with the signal's reason and returns nothing.
Where the signal is looked at:

| Stage                                  | The signal is looked at                        | What is left                              |
| -------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| Before a separator is asked            | Once the track and the names are checked       | Nothing                                   |
| A segment in a model                   | Before each segment, in every pass             | Nothing                                   |
| The separators of a joined set         | Before the first, and when each has answered   | Nothing: the stems kept so far are let go |
| When a separator has answered          | At once                                        | Nothing                                   |
| Stems brought back to the track's rate | After each stem, where the track was resampled | Nothing                                   |
| A split                                | As a run on the part                           | The separation handed in, unchanged       |

So a run ends within a segment's time, or within the time one stem takes to
come back to the track's rate. Bringing the track to the separator's rate at
the start is not broken into. A separator of a joined set that comes after a
stop is not asked at all. A separator of the host's own looks at
`options.signal` itself for as long as it works.

## What a host serves and loads

- **The runtime.** `onnxruntime-web`, an optional dependency of the host and
  not of this library. Its WebAssembly files are served beside the page.
- **The model.** One `.onnx` file a model, 174 MB for the hybrid export this
  was run with. The host fetches it, keeps it (the Cache API or the origin's
  private file system), and hands the bytes to `InferenceSession.create`. A
  joined set and a split take a file and a session for each model.
- **Threads.** The runtime's WebAssembly build uses several threads only on a
  page that is cross-origin isolated (`Cross-Origin-Opener-Policy: same-origin`
  and `Cross-Origin-Embedder-Policy: require-corp`). Without that it runs on
  one, about three times slower in the first run's figures below.
- **A worker.** For the reasons above. The channels and the parts move
  between the worker and the page as transferable buffers.
- **Memory.** A run with the hybrid export held 2.8 to 3.1 GB at its peak in
  Node on the WebAssembly build, and a run of four one-stem files 1.6 GB
  ([measured](#time-and-memory-by-kind)). Nobody has measured a browser
  tab. What more parts hold is given as arithmetic under
  [what has not been checked](#what-has-been-checked-and-where).

### One silent segment before a track

Before a track is spent on a model, run one segment of silence through it:

```ts
const silence = new Float32Array(model.segmentFrames)
await model.run([silence, silence])
```

It says whether the file runs on this runtime at all, and how long a segment
takes, before the first minute of a run
([time and memory by kind](#time-and-memory-by-kind)). What comes back need
not be silence: the four one-stem files run here, which are not run at a
standard level, answered sound 47 to 57 dB under full scale, where the hybrid
export answered exact zeros ([measured](#silence)).

### One segment at a time, and one session at a time

A session is asked for one segment and awaited before the next. The runner
and a joined set do so themselves. A host does the same with two splits and
with two tracks: it awaits one before it starts the other.

A joined set of four files is four sessions when each is made ahead. A host
that cannot hold every session writes a `Separator` that makes its session
inside `separate` and lets it go when the run is over, so one is held at a
time:

```ts
function heldForARun<Name extends string>(
  sampleRate: number,
  stems: readonly Name[],
  open: () => Promise<{ separator: Separator<Name>; release: () => Promise<void> }>,
): Separator<Name> {
  return {
    sampleRate,
    stems,
    async separate(channels, options) {
      const { separator, release } = await open()
      try {
        return await separator.separate(channels, options)
      } finally {
        await release()
      }
    },
  }
}
```

It says no `steps`, so a joined set counts it as one step.

## More parts, or more passes: what each costs

Each way has a cost in runs, and what is published of each is thin. What is
said of published measures below was read on 23 November 2026, and none of
those measures was made here. The times are of the runs under
[Measured](#measured).

- **A model that answers six parts**, the four with a guitar and a piano, is
  one run. Two public tables that measure such a model beside the four-part
  model of its family both put it lower on drums, bass and vocals, the stems
  the two share. Its makers call it experimental and its piano weak.
- **A set of four models, each tuned for one stem**, is four runs: each model
  answers all four stems and the set keeps one of each (`joinSeparators` with
  a `take`). Its makers say it takes four times as long and might be a bit
  better.
- **More passes** take as many times the run as there are passes: three
  passes took 2.7 and 3.0 times one pass here. The reference states a gain
  for an earlier model of the family. No figure was found for the hybrid
  model of `HYBRID_MODEL_SPEC`, and the paper that describes that model does
  not speak of passes.
- **A set of one-stem files** is a run for each stem. Each file is cut off
  above a frequency of its own, `bins × sampleRate / fftSize`. The four run
  here keep 2,048 bins at sizes of 16,384, 8,192, 6,144 and 4,096, so they
  are cut off above 5,512.5 Hz (bass), 11,025 Hz (other), 14,700 Hz (vocals)
  and 22,050 Hz (drums), the last being the top of the band at 44.1 kHz. What
  lies above a file's cut-off is no part of its stem, so it is in the
  remainder. A joined set's remainder is therefore not to be read against one
  model's: it holds the top of three stems as well as what the models
  missed.
- **The four one-stem files run here are the four stems again.** A run of
  them is a check of the kind and of the join on real files, and took 2.4
  times the hybrid file's time for the same track at about half its memory.
  It is not offered as a closer separation. The paper published with these
  files gives its networks alone a lower measure than the paper of the hybrid
  model gives that model, on two forms of one test set
  ([the two papers and their figures](#weights-and-their-license)).
- **A split** is one more run, over the part alone, and one more file and
  session. The two splits of the vocals made here took 38.6 s and 58.8 s for
  35.6 s of track.

No figure of how close a stem is to the sound it is named for can be stated
here, for any model, set, split or count of passes: no recording with its own
stems is on the machine. Every figure in this doc is a level, a difference
between two runs, a time or a memory.

## Weights and their license

The library ships no weights, and the choice of weights is the host's. This
section exists because a host has to know where that choice stands. It is the
one place in this doc where a model is called by its published name. Each
statement is what a page said when it was read, and the ones that are new
here were read on 23 November 2026.

**The four-stem hybrid model.** `HYBRID_MODEL_SPEC` describes the four-stem
Hybrid Transformer Demucs model (`htdemucs`) published with the Demucs
project. Its code is under the MIT license. Its weights are not covered by
that license: the export this was run with (the npm package `demucs`, version
1.0.0, file `htdemucs.onnx`) says the file "is derived from a weights file
provided by Meta, which is made available for personal and research use
only". Whether a product may serve those weights to its users has not been
settled here and is not this library's to settle.

**The four one-stem files.** They are the `kuielab` track A models of the code
`kuielab/mdx-net-submission`. That code is under the MIT license, copyright
AIcrowd. The track A weights are at Zenodo, record 5717356, under CC BY 4.0.
They were trained on MUSDB18-HQ, whose own record gives its license as "Other
(Non-Commercial)". No page read settles whether the dataset's terms reach the
weights.

**Two files that take a lead voice from its backing, and a voice file
transformed at 7,680.** `UVR_MDXNET_KARA`, `UVR_MDXNET_KARA_2` and
`UVR-MDX-NET-Voc_FT` were fetched from the public release
`all_public_uvr_models` of the repository `TRvlvr/model_repo`. The
application they are distributed with states the MIT license, with credit,
for its code. No license for these weights was found, and no word of what
they were trained on.

**The six-part model** (`htdemucs_6s`, published with the Demucs project) was
not run here. Its makers' README calls it experimental and says of its
weights that their license is "not clear".

Which of these were run here, all on 23 November 2026 but the first run:

| File                                      | Runs                                                                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `htdemucs.onnx`                           | Every run of the hybrid kind: the first run, one pass and three, a silent segment, the three stems of a joined set, and the separation each split was made of              |
| The four track A files                    | Joined as one separator, with the factor and without; one segment each against a second transform; one silent segment each; the vocals file joined with the hybrid's three |
| `UVR_MDXNET_KARA` and `UVR_MDXNET_KARA_2` | One split of the hybrid's vocals each, and one segment each against a second transform                                                                                     |
| `UVR-MDX-NET-Voc_FT`                      | Alone, joined with the hybrid's three, and one segment against a second transform                                                                                          |
| `htdemucs_6s`                             | Not run                                                                                                                                                                    |

The sizes and the factor the runs were told of the four track A files were
read from the table of model data that came beside them. Those of the other
three files, and which of them answers the lead voice, everything but it or
the voice, are from the published table of such files.

**What is published of how well they separate.** None of this was measured
here. The paper of the track A models (arXiv 2111.12203) gives its networks
alone an average of 6.26 dB of signal to distortion over the four stems, on
the MUSDB18 test set. The paper of the hybrid model (arXiv 2211.08553) gives
that model 7.52 dB trained with no extra data and 8.80 dB with it, on the
test set of MUSDB18-HQ. The first is a median over the test set's songs. The
two forms of the test set differ, and the two papers' ways of measuring may,
so the two are not strictly to be set side by side.

A separator of another kind, with weights under a stated license, takes the
same place behind `Separator` or `SegmentModel`.

## Measured

### The first run, 21 November 2026

With `scripts/try-separation.mjs`, which runs the built entry in Node on the
runtime's WebAssembly build. The machine is a cloud container with four cores
of a 2.1 GHz Xeon and no graphics card. The recording is a 10.9 s excerpt of
a song with a voice, a kit, a bass and guitars, released under Creative
Commons Attribution 3.0, at 44.1 kHz stereo and again resampled to 48 kHz. It
is two segments long. The model is the four-stem hybrid export, run once.

| What                                                            | Figure                           |
| --------------------------------------------------------------- | -------------------------------- |
| A segment (7.8 s of sound), four threads                        | 5.7 to 6.6 s, over two segments  |
| A segment, one thread                                           | 16.7 to 17.7 s                   |
| Making the session from the model's bytes                       | 1.3 s                            |
| Resident memory at the end of the run                           | 2.9 GB                           |
| The remainder against the track (`report.remainderDb`)          | -29.6 dB at both rates           |
| The five parts added together against the track, largest sample | 138 dB under full scale, or less |
| Each stem against the track: vocals, drums, bass, other         | -6.8, -4.9, -8.3, -7.1 dB        |
| Where each stem's spectrum sits: vocals, drums, bass, other     | 2,439 Hz, 523 Hz, 127 Hz, 623 Hz |

Each segment after the first adds 5.85 s of track. From these two segments
this doc used to estimate that a track takes about as long as it plays on
four threads. That was too low: on 23 November the same file on the same
kind of machine took 5.7 to 8.5 s a segment over 56 segments, and 35.6 s of
track took 51.8 s, about one and a half times as long as it plays
([time and memory by kind](#time-and-memory-by-kind)). One thread was about
three times slower than four in this first run and was not run again.

The remainder is not even over the track. Through the body of the recording
it is 25 to 31 dB under the track. In the first 35 ms it is 14 dB under: the
model's transform has no frames from before a segment's start, so there the
stems come up short of the track, and the remainder holds the rest. In the
last 35 ms, where the recording has faded to almost nothing, it is 12 dB
under, and most of that is the recording's own offset from zero.

The untouched bounce of five parts, in headless Chromium on the same machine
with a stand-in separator (`browser-tests/specs/separation.spec.ts`): the
bounce minus the track is 138 dB under full scale for a stereo track at
44.1 kHz and at 48 kHz and for a mono track at 48 kHz, and 144 dB under for a
mono track at 44.1 kHz. With the remainder's track muted the same measure is
1.4 dB under full scale, and with no silence after each part it is 10.4 dB
under, so the check fails when either is taken away.

### The floor of the sum, by count of parts

The parts add up to the track to the last bits of a sample, and each part is
one more addition in single precision, so the floor rises a little with the
count. Measured on 23 November 2026, on stand-in stems and not on a model's:

| Parts                                            | Where                                                 | The sum against the track, largest sample                  | Held by the test at |
| ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- | ------------------- |
| 11: the four, drums split in four, vocals in two | Vitest, added in single precision                     | 150.5 dB under, and 144.5 dB under for a track at 48 kHz   | 138 dB under        |
| 13: twelve stems and a remainder                 | Vitest, added in single precision                     | 144.5 dB under, and 141.0 dB under for a track at 48 kHz   | 135 dB under        |
| 7: six stems and a remainder                     | Headless Chromium, the untouched bounce, over 40 runs | 138.5 dB under at its least and 132.4 dB under at its most | 120 dB under        |
| 11: the four, drums split in four, vocals in two | Headless Chromium, the untouched bounce, over 40 runs | 138.5 dB under at its least and 130.5 dB under at its most | 120 dB under        |

In Vitest each stand-in stem is the track, or the part that is split, times a
gain of its own, the twelve stems of about the same level, and the parts are
added as a mixer adds them. In the browser the stems are made with gains and
low-passes, some of them stand away from zero at both ends, and the sum is
the engine's own, through real sources, gains, panners and the master. There
the figure is not the same in every run, which is why a range is given. The
seven parts were measured in two channels at 44.1 kHz and in one at 48 kHz,
with the same range.

That each of these can fail: in the browser, with the piano's track muted the
bounce of seven parts is 12.2 dB under full scale from the track, with the
snare's muted the bounce of eleven is 19.1 dB under, and with the track that
holds what is left of the drums muted it is 13.7 dB under.

### More parts and more passes on real files, 23 November 2026

Every run here is `scripts/try-separation.mjs` on the built entry, in Node
v22.23.5 on the WebAssembly build of `onnxruntime-web` 1.31.1, with four
threads and one run at a time. The machine is a cloud container with four
cores of a 2.1 GHz Xeon, 16 GB and no graphics card. Nothing was fetched
while they ran.

**The recordings.** Two, both at 44.1 kHz in two channels. One is the 10.9 s
excerpt of the first run, the only recording on the machine. The other is
35.6 s long, which is three segments of a one-stem file, and it is that
excerpt three times end to end and then its first 2.95 s again. It is a
10.9 s recording repeated, so its segments are not three different pieces of
music, and no run has had more than 10.9 s of music.

**The files.** Where each comes from, and where its weights stand, is under
[weights and their license](#weights-and-their-license).

| File                                                | Bytes       | Transform size | Bins kept | Frames | A segment               | Factor |
| --------------------------------------------------- | ----------- | -------------- | --------- | ------ | ----------------------- | ------ |
| The four-stem hybrid export                         | 174,263,526 | 4,096          |           |        | 343,980 frames, 7.8 s   |        |
| One-stem vocals                                     | 29,703,204  | 6,144          | 2,048     | 512    | 523,264 frames, 11.87 s | 1.035  |
| One-stem drums                                      | 29,703,204  | 4,096          | 2,048     | 512    | 523,264 frames, 11.87 s | 1.035  |
| One-stem bass                                       | 29,703,204  | 16,384         | 2,048     | 512    | 523,264 frames, 11.87 s | 1.035  |
| One-stem other                                      | 29,703,204  | 8,192          | 2,048     | 512    | 523,264 frames, 11.87 s | 1.035  |
| A file that answers the lead voice                  | 29,704,436  | 6,144          | 2,048     | 256    | 261,120 frames, 5.92 s  | 1.035  |
| A file that answers everything but the lead voice   | 52,786,726  | 5,120          | 2,048     | 256    | 261,120 frames, 5.92 s  | 1.065  |
| A file that answers the voice, transformed at 7,680 | 66,762,490  | 7,680          | 3,072     | 256    | 261,120 frames, 5.92 s  | 1.021  |

Every one-stem file's hop is 1,024, and each says one input and one output of
the shape `[batch, 4, bins, frames]`, read with a local runtime. The size and
the factor of the four that answer vocals, drums, bass and other were read
from the table of model data that came beside them. The size, the factor and
the answer of the last three are from the published table of such files. The
factor is what a spec's `gain` was set to, unless a run says otherwise.

**What the figures are.** A part's level is its mean square over every
channel against the track's, in dB. Where a part's spectrum sits is the mean
frequency of its power. A difference between two parts is the mean square of
a run's part minus the other's, against the mean square of the other's, in
dB: two unrelated sounds of one level give 0 dB, and a part of the same
sound gives well under 0. "The same samples" means that no sample of the two
files differs. Peak memory is the most the process held, as Node reports it.

**What they are not.** A difference between two runs is no measure of how
close either is to the sound a stem is named for. No recording with its own
stems is on the machine, so nothing below says which of two answers is the
better separation.

#### One pass and three

The hybrid export on the 10.9 s recording, one pass, the default: all five
parts are the same samples as the parts written on 21 November, before the
entry took other stems than the four.

Three passes with a seed of 1 drew offsets of 0, 6,296 and 9,411 frames:

| What                                                 | The 10.9 s recording              | The 35.6 s recording              |
| ---------------------------------------------------- | --------------------------------- | --------------------------------- |
| Segments, one pass and three                         | 2 and 6                           | 7 and 21                          |
| Time, one pass and three                             | 14.3 s and 39.1 s                 | 51.8 s and 153.6 s                |
| Peak memory, one pass and three                      | 2.81 GB and 3.00 GB               | 3.00 GB and 2.98 GB               |
| The remainder against the track, one pass and three  | -29.64 dB and -30.60 dB           | -29.66 dB and -30.66 dB           |
| Three passes against one: vocals, drums, bass, other | -32.28, -26.18, -22.11, -23.12 dB | -32.26, -26.08, -21.84, -22.77 dB |

Run again with the same seed on the 10.9 s recording, three passes gave the
same samples in all five parts (41.1 s, 2.90 GB). So three passes moved each
stem by a sound 22 to 32 dB under it and left a remainder 1 dB lower. They
moved the stems. Whether they made them better is not measured.

#### Four one-stem files joined

The four one-stem files of the stems as one separator (`joinSeparators`), on
the 35.6 s recording: 16 segments, four of each file. Once with the factor
1.035 as each one's `gain` and once with no gain.

| What                                                               | With the factor               | With no gain                  |
| ------------------------------------------------------------------ | ----------------------------- | ----------------------------- |
| Time                                                               | 126.4 s                       | 126.7 s                       |
| Peak memory                                                        | 1.58 GB                       | 1.56 GB                       |
| Each part against the track: vocals, drums, bass, other            | -8.20, -6.70, -7.72, -7.65 dB | -8.50, -7.00, -8.02, -7.95 dB |
| Where each part's spectrum sits                                    | 1,695, 565, 119, 712 Hz       | 1,695, 565, 119, 712 Hz       |
| The remainder against the track                                    | -10.61 dB                     | -10.34 dB                     |
| Each part against the hybrid run's part of the same name           | -8.86, -8.56, -9.78, -7.99 dB | -8.71, -8.34, -9.98, -8.01 dB |
| Each part against the hybrid run's three other stems, twelve pairs | 1.64 to 3.51 dB               | 1.54 to 3.34 dB               |
| The remainder against the hybrid run's remainder                   | 18.92 dB                      | 19.19 dB                      |

The hybrid export took 51.8 s on the same recording and held 3.00 GB, so the
set took 2.4 times as long and held about half the memory.

What this shows: each file's part is 8 to 10 dB under the hybrid's part of
the same name and 1.5 to 3.5 dB over every other stem. Each is far closer to
its namesake than to any stranger, so each file's size, layout and stem were
read rightly. It is no measure of quality: the hybrid's answer is not the
truth. The factor moves a part's difference from its namesake by 0.02 to
0.22 dB, toward the hybrid's answer for vocals and drums and away from it
for bass and other, and moves the remainder by 0.27 dB. That settles nothing
either way about the factor. The set's remainder is about 19 dB over the
hybrid's,
as is to be expected of four files that are each cut off above a frequency
of their own and were not trained to add up.

#### The one-stem transform against a second one

The engine's transform, layout and inverse were held against a second
writing of them: a script in Python 3.13.18 with numpy 2.5.3 for the
transform and `onnxruntime` 1.29.0 on a processor for the model, which reads
none of the engine's code. Each of the seven one-stem files was run on one
segment both ways with the factor as gain, the engine with an overlap of 0,
so that a track of one segment is one call of the model. The figure is the
engine's stem minus the other's, against the other's stem.

| File                                  | Transform size                                 | Bins kept | Frames | Difference |
| ------------------------------------- | ---------------------------------------------- | --------- | ------ | ---------- |
| One-stem vocals                       | 6,144, 3 × 2^11                                | 2,048     | 512    | -127.99 dB |
| One-stem drums                        | 4,096, 2^12                                    | 2,048     | 512    | -126.14 dB |
| One-stem bass                         | 16,384, 2^14                                   | 2,048     | 512    | -132.32 dB |
| One-stem other                        | 8,192, 2^13                                    | 2,048     | 512    | -127.94 dB |
| Answers the lead voice                | 6,144, 3 × 2^11                                | 2,048     | 256    | -130.12 dB |
| Answers everything but the lead voice | 5,120, 5 × 2^10                                | 2,048     | 256    | -130.67 dB |
| Answers the voice                     | 7,680, 15 × 2^9, which the hop does not divide | 3,072     | 256    | -128.23 dB |

The two agree to between 126 and 132 dB under the stem, which is the level
of single-precision arithmetic, at a size of each family the transform takes
(a power of two times 1, 3, 5 and 15) and at both counts of frames. Both were
written here, from one reading of the definition. So the agreement shows that
the two agree. It does not show that either is the makers' own code, which
was not installed, or that the reading is right. What stands for the reading
is each file's part landing on the hybrid's namesake, above.

#### Silence

One segment of silence was run through a separator alone, and its answer was
then handed to `separateTrack` as a separator's own, to see what the guard
says of it.

| File                                  | The largest sample of its answer to silence |
| ------------------------------------- | ------------------------------------------- |
| One-stem vocals                       | 0.002081, 53.6 dB under full scale          |
| One-stem drums                        | 0.004569, 46.8 dB under full scale          |
| One-stem bass                         | 0.001355, 57.4 dB under full scale          |
| One-stem other                        | 0.003823, 48.4 dB under full scale          |
| The hybrid export, each of four stems | 0                                           |

The guard refuses the one-stem file's answer: "live-mix: the vocals stem
peaks at 0.00208, more than 12 dB over the track". With the four joined it
says the same, and names only the first stem that is over the limit. The
hybrid export, which is run at a standard level, answered exact zeros, and
the guard takes them. So a host should expect a silent track to be refused
when a one-stem file of this kind separates it, and a split of a silent part
by one as well, since a split's limit is taken from the part's largest
sample by the same rule. A split of a silent part was not itself run.

#### One model's three stems beside another's vocals

The hybrid export kept for drums, bass and other, joined with a one-stem file
kept for vocals, on the 35.6 s recording. Once with the one-stem vocals file
of the four, and once with the voice file transformed at 7,680.

| What                                                  | With the one-stem vocals of the four | With the voice file transformed at 7,680 |
| ----------------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| Segments                                              | 11                                   | 16                                       |
| Time                                                  | 84.0 s                               | 134.8 s                                  |
| Peak memory                                           | 3.00 GB                              | 3.04 GB                                  |
| Drums, bass and other against the hybrid export alone | the same samples                     | the same samples                         |
| The vocals against the hybrid export's vocals         | -8.86 dB                             | -15.55 dB                                |
| The remainder against the track                       | -15.73 dB                            | -21.85 dB                                |

In each run the vocals are the same samples as that file's vocals elsewhere:
the one-stem vocals as in the set of four, the voice file's as when it ran
alone. The hybrid export alone leaves a remainder of -29.66 dB on this recording, so a
set that takes its vocals from another model leaves more. The voice file
alone (9 segments, 90.8 s, 1.51 GB) gives a vocals that is 2.03, 3.55 and
2.94 dB over the hybrid's drums, bass and other, and leaves a remainder of
-1.07 dB, which is the rest of the track.

#### A part split by a real file

The hybrid export's `vocals` on the 35.6 s recording, split with `splitPart`
by each of two files, once in each direction of naming.

| What                                                           | By the file that answers the lead voice | By the file that answers everything but it |
| -------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| The separator's stem, and the name of the rest                 | `lead`, and `backing`                   | `backing`, and `lead`                      |
| The separation before the split                                | 7 segments, 51.1 s                      | 7 segments, 44.9 s                         |
| The split                                                      | 9 segments, 38.6 s                      | 9 segments, 58.8 s                         |
| Peak memory of the whole run                                   | 3.06 GB                                 | 2.98 GB                                    |
| `lead` against the track, and where its spectrum sits          | -7.23 dB, 2,257 Hz                      | -7.19 dB, 2,199 Hz                         |
| `backing` against the track, and where its spectrum sits       | -26.02 dB, 11,712 Hz                    | -25.42 dB, 11,603 Hz                       |
| `backing` against the vocals it was split from                 | -18.99 dB                               | -18.39 dB                                  |
| Drums, bass, other and the remainder against the run not split | the same samples                        | the same samples                           |
| The six parts added together against the track, largest sample | 137.5 dB under full scale               | 137.3 dB under full scale                  |

Between the two runs `lead` differs from `lead` by -21.03 dB, `backing` from
`backing` by -2.23 dB, and one run's `lead` from the other's `backing` by
18.72 dB.

So a split with a real file runs in both directions of naming, leaves every
other part and the remainder as they were, and the six parts still add up to
the track. On this recording both files leave a `backing` 18 to 19 dB under
the vocals, with its weight near 11.6 to 11.7 kHz. That is consistent with
one voice and with the files' cut-offs: what lies above a split model's cut
goes to whichever part is the rest. It is not evidence that a second voice
was found. A split of the drums was not run: no file that splits drums is
here.

#### The sum, in every run

In the 19 runs with a recording, of 2 to 6 parts each, the parts added
together in single precision are the track to between 137.3 and 150.5 dB
under full scale at the largest sample.

#### Time and memory by kind

| Kind of file, and the sound of one segment           | Time a segment                                      | Peak memory                                        |
| ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| The hybrid export, 7.8 s                             | 5.7 to 8.5 s, 56 segments in seven runs             | 2.81 to 3.00 GB in the five runs of it alone       |
| The hybrid export with a second file joined or split | Each file's as alone                                | 2.98 to 3.06 GB in four runs                       |
| A one-stem file of 512 frames, 11.87 s               | 6.5 to 10.2 s, 32 segments in the two runs of four  | 1.56 and 1.58 GB for four, 1.24 to 1.29 GB for one |
| The file that answers the lead voice, 5.92 s         | 3.7 to 5.0 s, 9 segments, and 3.2 s for one alone   | 0.78 GB for one segment                            |
| The file that answers everything but it, 5.92 s      | 6.0 to 7.2 s, 9 segments, and 6.6 s for one alone   | 1.09 GB for one segment                            |
| The voice file transformed at 7,680, 5.92 s          | 9.7 to 10.5 s, 9 segments, and 10.5 s for one alone | 1.51 GB, and 1.46 GB for one segment               |

The first run's figure of 5.7 to 6.6 s a segment for the hybrid export, from
two segments, was 5.7 to 8.5 s on this day over 56. The 35.6 s recording took
51.8 s in one pass, about one and a half times as long as it plays.

Not run on this day: the waveform kind with a real file, a track at 48 kHz,
more than one pass with a one-stem file, a split of the drums, a six-part
model, a browser, a graphics card, and any kind's reference implementation.
Each is under [what has been checked](#what-has-been-checked-and-where).

### Running it again

`scripts/try-separation.mjs` is the script every figure of a real file above
came from. It needs an ONNX runtime, a model's file and a WAV file, and the
repository holds none of the three.

```sh
pnpm build
node scripts/try-separation.mjs \
  --runtime <path to onnxruntime-web's dist/ort.node.min.mjs> \
  --model <path to a hybrid model's .onnx> \
  --wav <path to a WAV file> \
  [--out <folder for the parts and report.json>] [--threads <n>]
```

That is one hybrid model of the four stems, run once over the track. The
rest is said with these:

| Option                 | What it is                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--separator '<json>'` | A model, as `{ "kind", "model", "spec", "take" }`. `kind` is `hybrid`, `waveform` or `spectrogram`, `model` the path of its file, `spec` the kind's spec written out or the path of a JSON file that holds it, and `take` the stems kept of it, every one when left out. A hybrid model with no spec is one of the four. Repeated, the set is joined into one separator |
| `--overlap <x>`        | How much of a segment the next one covers again. Default 0.25                                                                                                                                                                                                                                                                                                           |
| `--shifts <n>`         | How many times each model goes over the track. Default 1                                                                                                                                                                                                                                                                                                                |
| `--seed <n>`           | What the offsets of the later passes are drawn from. Default 0                                                                                                                                                                                                                                                                                                          |
| `--split '<json>'`     | A part split by a second model, as `{ "part", "rest", "kind", "model", "spec", "take" }`: the part, the name of what the model leaves of it (the part's own when left out), and the model as above. Repeated, the splits are made in order                                                                                                                              |
| `--compare <folder>`   | An earlier run's `--out`. Each part of this run is held against the file of the same name there                                                                                                                                                                                                                                                                         |
| `--compare-as <a>=<b>` | This run's part `a` held against the earlier run's part `b` as well. Repeated for more pairs                                                                                                                                                                                                                                                                            |
| `--silence <frames>`   | In place of `--wav`: a silent track of two channels and that many frames at 44,100 Hz. The separator is run alone and not through `separateTrack`, so what it answers to silence is measured whether or not the guard would take it, and the report says which. It takes no split and no comparison                                                                     |

`--model <path>` is a hybrid model with no spec and no `take`, the first of
the set. The overlap, the passes and the seed are handed to every model's
runner. A one-stem vocals file beside a hybrid model's three, held against
an earlier run:

```sh
node scripts/try-separation.mjs \
  --runtime <path to ort.node.min.mjs> --threads 4 \
  --wav <path to a WAV file> \
  --separator '{"kind":"spectrogram","model":"<path>","spec":"<path to its spec as JSON>"}' \
  --separator '{"kind":"hybrid","model":"<path>","take":["drums","bass","other"]}' \
  --compare <an earlier run's folder> --out <folder>
```

A hybrid model's vocals split in two by a file that answers the lead voice:

```sh
node scripts/try-separation.mjs \
  --runtime <path to ort.node.min.mjs> --threads 4 \
  --model <path to a hybrid model's .onnx> --wav <path to a WAV file> \
  --split '{"part":"vocals","rest":"backing","kind":"spectrogram","model":"<path>","spec":"<path>"}' \
  --out <folder>
```

The report is printed, and written as `report.json` where `--out` is given.
A run that fails says its error there and exits with 1.

## How it follows the model's reference

A model answers best to what it was trained on, so the signal conventions are
those of each kind's reference implementation.

The hybrid kind:

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

The one-stem spectrogram kind:

- The transform is centred, with half a size reflected at each end, a
  periodic Hann window and no scale, at the size, the hop and the count of
  kept bins the file was made with. The bins above the kept ones go back as
  silence. Centred frames and the periodic window were read in the code
  these files were published with. That the ends are reflected and nothing
  is scaled was not read there: it is recalled as what that code's transform
  does when it is told nothing else. What stands for it is the run in which
  each file's part lands on the hybrid's namesake
  ([measured](#four-one-stem-files-joined)).
- The four planes are the left channel's real and imaginary parts, then the
  right's.
- The track is not brought to a standard level.

The waveform kind: the track is brought to a standard level as for the hybrid
kind, and the rest of its conventions are inside its graph.

Where it departs:

- **The mean is not added back.** The hybrid kind's reference adds the
  track's mean to each of the four stems. A recording that stands off zero
  then has its offset on every stem and three times it, turned over, in the
  remainder. Here the offset stays out of the stems. The recording of the
  first run has a mean of 0.0012, which is how this was found.
- **Passes are pooled by the runner's weights.** The reference runs the whole
  track once for each pass and averages the whole runs. Here every pass adds
  into one set of weighted sums, so a frame leans on the passes where it sits
  further into a segment.
- **A single run draws no offset.** The reference draws an offset for its one
  default run as well, so its default is not the same twice. Here one pass is
  on the plain grid and is the same samples every time.
- **The offsets come from a seed.** The reference draws them from a shared
  source of chance, afresh for each model of a set. Here they are a function
  of the seed and the pass's number, so a run is the same twice and two
  separators made with one seed draw the same.
- **The silence of a pass is in front of the track only.** The reference pads
  the track on both sides and cuts a stretch of it at the offset.
- **The one-stem kind's chunks are the runner's.** That kind's reference cuts
  a track into chunks, trims half a transform's size off each end of every
  answer and butts the middles together with no crossfade. Here its segments
  overlap by a quarter and are added back by the runner's triangle weights,
  as for every kind.

Not built, each of them done by a reference or by a program that runs these
models:

- A second run on the negated segment, averaged with the first.
- Zeroing the lowest bins of a one-stem model's input.
- A learned mixer over several models' answers, and a weighted blend of two
  models' answers for one stem. A joined set keeps each stem of one model.
- Several segments in one batch. A session is handed one segment a run.

## What has been checked, and where

| Check                                                                                                                                                                                | Where it runs                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The transform and its inverse, the resampler, the segment runner, the hybrid adapter, the remainder and the guard, the tracks and what a render is told                              | `pnpm test` (`src/separation/__tests__`, stand-in models and the mock graph)                                                                           |
| The entry reaches no ONNX runtime, `.` exports none of it, and every value it exports is pinned                                                                                      | `pnpm test` (`src/__tests__/public-entry.test.ts`)                                                                                                     |
| The default run of the four gives the samples it gave before the entry took other stems, to the bit                                                                                  | `pnpm test` (`default-run.test.ts`, checksums written from the code before the change)                                                                 |
| What a host of the four writes against the types still compiles with no cast, and a separation of six names is not taken where the four are asked for                                | `pnpm typecheck` and `pnpm test` (`default-shapes.test.ts`)                                                                                            |
| Names: the shape of a name, each refusal of a list, an answer held to its list, the two readers, one stem, six and twelve stems that add up to the track, a hybrid spec of six stems | `pnpm test` (`names.test.ts`, `separate.test.ts`, `segments.test.ts`, `hybrid-model.test.ts`), stand-ins                                               |
| More than one pass: 1, 2 and 5 passes give the track back from a model that returns it, the same seed the same bits, another seed another answer, the steps                          | `pnpm test` (`segments.test.ts`), stand-in models                                                                                                      |
| Joining: whose stem is whose, the order, each refusal, one count of steps across the set, a stop between two separators                                                              | `pnpm test` (`join.test.ts`), stand-in separators                                                                                                      |
| Splitting: the names and their order, the stems and the rest add up to the part, the remainder the same array, a split of a split, each refusal, a stop                              | `pnpm test` (`split.test.ts`), stand-in separators                                                                                                     |
| Any number of parts laid on a score: seven and eleven tracks in order, the ids, the names, each refusal                                                                              | `pnpm test` (`tracks.test.ts`), the mock graph                                                                                                         |
| The waveform kind: the tensor fed and read, four and six stems, the parts add up through the runner                                                                                  | `pnpm test` (`waveform-model.test.ts`), a stand-in session                                                                                             |
| The centred transform against a plain sum over every bin, at sizes that are a power of two times 1, 3, 5 and 15, 5,120, 6,144 and 7,680 among them                                   | `pnpm test` (`centred-transform.test.ts`)                                                                                                              |
| The one-stem spectrogram kind: the tensor fed and read, the cut, the gain, four of them joined with the remainder holding what lies above each cut                                   | `pnpm test` (`spectrogram-model.test.ts`), stand-in sessions                                                                                           |
| An untouched bounce of the five tracks is the track, at two rates, stereo and mono                                                                                                   | `pnpm test:browser`, real `OfflineAudioContext` in headless Chromium, stand-in separator                                                               |
| An untouched bounce of seven parts (six stems) and of eleven (drums split in four, vocals in two) is the track, and is not with one part muted                                       | `pnpm test:browser`, real `OfflineAudioContext` in headless Chromium, stand-in separators                                                              |
| A real model on a real recording: it runs, the parts add up, the bass comes out lowest                                                                                               | `scripts/try-separation.mjs` by hand, Node, WebAssembly, once                                                                                          |
| The transform against the one that comes with the export                                                                                                                             | by hand, once: equal to 141 dB under in every frame but a segment's first two, where that code fills the start with silence in place of the reflection |
| The default run with a real model gives the samples the parts of 21 November have                                                                                                    | `scripts/try-separation.mjs` by hand, Node, WebAssembly, once                                                                                          |
| Three passes with a real model: another answer than one pass, and the same seed the same samples                                                                                     | by hand, the same way: twice on 10.9 s with one seed, once on 35.6 s                                                                                   |
| Four one-stem files joined on real files: each part lands on the hybrid's namesake and on no other stem                                                                              | by hand, the same way, once with the factor and once without                                                                                           |
| The one-stem transform against a second one written from its definition, seven files at six sizes                                                                                    | by hand, one segment each: equal to 126 to 132 dB under the stem                                                                                       |
| A silent segment through each of four one-stem files and through the hybrid file, and what the guard says of each                                                                    | by hand, the same way, once                                                                                                                            |
| One model's drums, bass and other joined with a one-stem vocals: the three are the samples that model gives alone                                                                    | by hand, the same way, once with each of two vocals files                                                                                              |
| A split with a real file, the vocals in two: the untouched parts and the remainder the same samples, the six parts add up                                                            | by hand, the same way, once with each of two files                                                                                                     |

Not checked anywhere:

- **Nobody has listened to a stem.** Every figure above is a measurement.
- **No stem has been held against the sound it is named for.** No recording
  with its own stems is on the machine, so no figure of quality is stated,
  and nothing here shows that more passes, a tuned set or a set of one-stem
  files give a closer separation than one run of one model.
- The stems against a kind's reference implementation. None was installed
  here, for any kind. The conventions rest on the figures above: for the
  hybrid kind on the comparison of its transform with the one that comes
  with the export, and for the one-stem kind on a second transform written
  here and on each file's part landing on the hybrid's namesake.
- The waveform kind with a real file. No export of that shape is on the
  machine, so it has run on a stand-in session only. The six-part model was
  not run in either shape, and the hybrid kind has run with a real file only
  at the numbers of `HYBRID_MODEL_SPEC`.
- More than one pass with a one-stem file, and a split of the drums: no file
  that splits drums is here. A real split was run on the hybrid's vocals
  only.
- A track at 48 kHz through any of the kinds that are new. The first run did
  it for the hybrid file. The runs of 23 November were all at 44.1 kHz.
- A real model in a browser, on a graphics card (WebGPU), or on a phone.
  Every run with a real file was in Node.
- A whole song. The longest run is 35.6 s, and that is a 10.9 s recording
  repeated, so no run has had more than 10.9 s of music. Time and memory for
  four minutes are estimates.
- **The memory of more parts.** It is arithmetic and has not been measured. A
  part of four minutes of stereo at 44.1 kHz is about 85 MB, so a finished
  separation at the track's rate is about 595 MB for six stems and a
  remainder and about 935 MB for eleven parts, and as much again once the
  parts are buffers. While a joined set runs, one model's whole answer is
  held beside the stems kept so far.
- The parts played by a live engine. The render is checked; the live path is
  the same tracks and buffers and has not been run.
- The floor of the sum on a model's stems at more than six parts. Up to six
  it was measured on real files, and beyond that on stand-in stems.
