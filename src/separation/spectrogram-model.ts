// A one-stem spectrogram separation model as a segment model. Such a model
// takes a segment's spectrogram and answers one stem's spectrogram, so a set
// of them, one for each stem, is joined to take a track apart
// (`joinSeparators`). The transform is done here and not inside the model's
// graph, at the size, the hop and the count of kept bins the model was
// trained with: a model of this kind is cut off above the last bin it keeps,
// and what lies above is no part of its stem. It is trained on sound as it
// is, so the track is not brought to a standard level for it.
//
// The library holds no model and no runtime. A host loads an ONNX runtime,
// makes a session on an export of a model it has the right to use, and hands
// both in (docs/separation.md says what an export has to look like).

import { createCentredTransform } from './centred-transform'
import { answered, counted } from './model-session'
import { checkedNames } from './names'
import { type SegmentModel } from './segments'
import { SeparationError, type Channels, type ModelRuntime } from './types'

/** What a one-stem spectrogram model was trained with. An export says its own. */
export interface SpectrogramModelSpec<Name extends string = string> {
  /** The sample rate of the sound the model was trained on. */
  sampleRate: number
  /** The size of the transform: a power of two times 1, 3, 5 or 15. */
  fftSize: number
  /** The frames from one frame of the transform to the next. It does not have to divide the size. */
  hop: number
  /** How many of a frame's `fftSize / 2 + 1` bins the model takes, from the lowest up. */
  bins: number
  /** The frames of spectrogram the model takes. A segment is `hop × (frames − 1)` frames of sound. */
  frames: number
  /** The one stem the model answers. */
  stem: Name
  /** What the stem's sound is multiplied by. Default 1. */
  gain?: number
}

/**
 * The one-stem spectrogram model behind `runtime.session` as a segment
 * model, for `createSegmentSeparator`. The session takes one input, the
 * segment's spectrogram `[1, 4, bins, frames]` as the left channel's real
 * parts, its imaginary ones, then the right channel's real parts and its
 * imaginary ones, and gives one output, the stem's spectrogram in the same
 * shape. They are fed and read by their place in the session's lists, not by
 * name: an export's names are whatever its exporter left.
 *
 * The transform is centred, with half a size reflected at each end of a
 * segment, a periodic Hann window and no scale. The bins above the kept ones
 * are read back as silence, and the stem is the sound of the answer times
 * the spec's `gain`.
 *
 * The model says its one stem, and says that it is run on the track's own
 * values and not at a standard level. Throws a `SeparationError` when the
 * session does not take one input and give one output, when the spec's stem
 * is no name for one, when its gain is not a finite number, and when its
 * size, hop, bins and frames are not ones the transform takes.
 */
export function createSpectrogramModel<Tensor, Name extends string>(
  runtime: ModelRuntime<Tensor>,
  spec: SpectrogramModelSpec<Name>,
): SegmentModel<Name> {
  const { session } = runtime
  if (session.inputNames.length !== 1 || session.outputNames.length !== 1) {
    throw new SeparationError(
      `a spectrogram model takes a segment's spectrogram and gives one stem's back: this session has ` +
        `${counted(session.inputNames.length, 'input')} and ${counted(session.outputNames.length, 'output')}`,
    )
  }
  const [stem] = checkedNames([spec.stem], "a spec's stems")
  const gain = spec.gain ?? 1
  if (!Number.isFinite(gain)) {
    throw new SeparationError(`a spec's gain is a finite number, not ${gain}`)
  }
  const segmentFrames = spec.hop * (spec.frames - 1)
  const transform = createCentredTransform(segmentFrames, spec.fftSize, spec.hop, spec.bins)
  const { bins, frames } = transform
  /** One channel's spectrogram: its real parts and its imaginary ones. */
  const plane = 2 * bins * frames
  const [input] = session.inputNames
  const [output] = session.outputNames

  return {
    sampleRate: spec.sampleRate,
    segmentFrames,
    stems: [stem],
    standardize: false,
    async run(segment: Channels) {
      const spectrogram = new Float32Array(2 * plane)
      transform.forward(segment[0], spectrogram, 0)
      transform.forward(segment[1], spectrogram, plane)
      const answer = await session.run({
        [input]: new runtime.Tensor('float32', spectrogram, [1, 4, bins, frames]),
      })
      const data = answered(answer, output, 2 * plane)

      const sound = [0, 1].map((channel) => {
        const out = new Float32Array(segmentFrames)
        transform.inverse(data, channel * plane, out)
        if (gain !== 1) {
          for (let i = 0; i < segmentFrames; i += 1) out[i] *= gain
        }
        return out
      })
      const stems = {} as Record<Name, Channels>
      stems[stem] = sound
      return stems
    },
  }
}
