// A waveform separation model as a segment model. A waveform model takes a
// segment's sound and answers every stem's sound: whatever transform it
// works through is inside its graph, so nothing is done here but laying the
// segment into one tensor and reading the stems out of one. The stems are
// the ones its spec names, as many as the spec names.
//
// The library holds no model and no runtime. A host loads an ONNX runtime,
// makes a session on an export of a model it has the right to use, and hands
// both in (docs/separation.md says what an export has to look like).

import { answered, counted } from './model-session'
import { checkedNames, inDeskOrder } from './names'
import { type SegmentModel } from './segments'
import { SeparationError, type Channels, type ModelRuntime, type StemName } from './types'

/** What a waveform model was trained with. An export says its own. */
export interface WaveformModelSpec<Name extends string = StemName> {
  /** The sample rate of the sound the model was trained on. */
  sampleRate: number
  /** The frames of the segment the model takes. */
  segmentFrames: number
  /** The stems in the order the model answers them: the order of its tensor, not a desk's. */
  stems: readonly Name[]
}

/**
 * The waveform model behind `runtime.session` as a segment model, for
 * `createSegmentSeparator`. The session takes one input, the segment
 * `[1, 2, segmentFrames]` with its left channel first, and gives one output,
 * every stem's sound `[1, stems, 2, segmentFrames]`, `stems` being how many
 * the spec names. They are fed and read by their place in the session's
 * lists, not by name: an export's names are whatever its exporter left.
 *
 * A model whose spec names exactly the four says them as a desk lists them,
 * vocals first, in whatever order its tensor holds them. A model of other
 * stems says them in its spec's order. The track is brought to a standard
 * level before the model is run, as for the hybrid kind. Throws a
 * `SeparationError` when the session does not take one input and give one
 * output, and when the spec's stems are no list of names: none, one twice,
 * or a name that is no stem's.
 */
export function createWaveformModel<Tensor, Name extends string = StemName>(
  runtime: ModelRuntime<Tensor>,
  spec: WaveformModelSpec<Name>,
): SegmentModel<Name> {
  const { session } = runtime
  if (session.inputNames.length !== 1 || session.outputNames.length !== 1) {
    throw new SeparationError(
      `a waveform model takes a segment's sound and gives every stem's sound back: this session has ` +
        `${counted(session.inputNames.length, 'input')} and ${counted(session.outputNames.length, 'output')}`,
    )
  }
  /** The stems in the order of the session's tensor. */
  const names = checkedNames(spec.stems, "a spec's stems")
  const { segmentFrames } = spec
  const [input] = session.inputNames
  const [output] = session.outputNames
  const length = names.length * 2 * segmentFrames

  return {
    sampleRate: spec.sampleRate,
    segmentFrames,
    stems: inDeskOrder(names),
    async run(segment: Channels) {
      const sound = new Float32Array(2 * segmentFrames)
      segment.forEach((channel, index) => sound.set(channel, index * segmentFrames))
      const answer = await session.run({
        [input]: new runtime.Tensor('float32', sound, [1, 2, segmentFrames]),
      })
      const data = answered(answer, output, length)

      const stems = {} as Record<Name, Channels>
      names.forEach((name, stem) => {
        stems[name] = [0, 1].map((channel) => {
          const at = stem * 2 + channel
          return data.slice(at * segmentFrames, (at + 1) * segmentFrames)
        })
      })
      return stems
    },
  }
}
