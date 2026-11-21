// A hybrid separation model as a segment model. A hybrid model works on a
// segment twice at once, as a waveform and as its spectrogram, and answers
// twice: a spectrogram and a waveform for each stem. A stem is the waveform
// of the first plus the second. The transform is done here and not inside
// the model's graph, so the graph is one a browser's runtimes can run.
//
// The library holds no model and no runtime. A host loads an ONNX runtime,
// makes a session on an export of a model it has the right to use, and hands
// both in (docs/separation.md says what an export has to look like).

import { type SegmentModel } from './segments'
import { createSegmentTransform } from './stft'
import {
  STEM_NAMES,
  SeparationError,
  type Channels,
  type ModelRuntime,
  type StemName,
} from './types'

/** What a hybrid model was trained with. An export of another model of the kind says its own. */
export interface HybridModelSpec {
  /** The sample rate of the sound the model was trained on. */
  sampleRate: number
  /** The frames of the segment the model takes. */
  segmentFrames: number
  /** The size of the transform, a power of two. */
  fftSize: number
  /** The frames from one frame of the transform to the next: a quarter of its size. */
  hop: number
  /** The four stems in the order the model answers them. */
  stems: readonly StemName[]
}

/** The numbers of the four-stem hybrid model most exports are of: 7.8 s at 44.1 kHz. */
export const HYBRID_MODEL_SPEC: HybridModelSpec = {
  sampleRate: 44100,
  segmentFrames: 343980,
  fftSize: 4096,
  hop: 1024,
  stems: ['drums', 'bass', 'other', 'vocals'],
}

function counted(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** The numbers of an answer the session gave under `name`, which has to hold `length` of them. */
function answered(answer: Record<string, unknown>, name: string, length: number): Float32Array {
  const tensor = answer[name] as { data?: unknown; dims?: unknown } | undefined
  const data = tensor?.data
  if (!(data instanceof Float32Array) || data.length !== length) {
    const found =
      data instanceof Float32Array
        ? `${data.length} numbers (dimensions ${JSON.stringify(tensor?.dims)})`
        : 'no float tensor'
    throw new SeparationError(`the model's output "${name}" holds ${found}, not ${length}`)
  }
  return data
}

/**
 * The hybrid model behind `runtime.session` as a segment model, for
 * `createSegmentSeparator`. The session takes two inputs, the waveform
 * `[1, 2, segmentFrames]` and then its spectrogram `[1, 4, bins, frames]`
 * (for each channel its real parts, then its imaginary ones), and gives two
 * outputs, the stems' spectrograms `[1, 4, 4, bins, frames]` and then their
 * waveforms `[1, 4, 2, segmentFrames]`. They are fed and read by their place
 * in the session's lists, not by name: an export's names are whatever its
 * exporter left.
 */
export function createHybridModel<Tensor>(
  runtime: ModelRuntime<Tensor>,
  spec: HybridModelSpec = HYBRID_MODEL_SPEC,
): SegmentModel {
  const { session } = runtime
  if (session.inputNames.length !== 2 || session.outputNames.length !== 2) {
    throw new SeparationError(
      `a hybrid model takes a waveform and a spectrogram and gives the same two back: this session has ` +
        `${counted(session.inputNames.length, 'input')} and ${counted(session.outputNames.length, 'output')}`,
    )
  }
  const missing = STEM_NAMES.filter((name) => !spec.stems.includes(name))
  if (spec.stems.length !== STEM_NAMES.length || missing.length > 0) {
    throw new SeparationError(
      `a model's stems are ${STEM_NAMES.join(', ')}, each once: [${spec.stems.join(', ')}] leaves out ${missing.join(', ')}`,
    )
  }
  const { segmentFrames } = spec
  const transform = createSegmentTransform(segmentFrames, spec.fftSize, spec.hop)
  const { bins, frames } = transform
  /** One channel's spectrogram: its real parts and its imaginary ones. */
  const plane = 2 * bins * frames
  const [waveformIn, spectrogramIn] = session.inputNames
  const [spectrogramOut, waveformOut] = session.outputNames

  return {
    sampleRate: spec.sampleRate,
    segmentFrames,
    async run(segment: Channels) {
      if (segment.length !== 2 || segment.some((channel) => channel.length !== segmentFrames)) {
        throw new SeparationError(
          `a segment is two channels of ${segmentFrames} frames, not [${segment.map((channel) => channel.length).join(', ')}]`,
        )
      }
      const waveform = new Float32Array(2 * segmentFrames)
      const spectrogram = new Float32Array(2 * plane)
      segment.forEach((channel, index) => {
        waveform.set(channel, index * segmentFrames)
        transform.forward(channel, spectrogram, index * plane)
      })
      const answer = await session.run({
        [waveformIn]: new runtime.Tensor('float32', waveform, [1, 2, segmentFrames]),
        [spectrogramIn]: new runtime.Tensor('float32', spectrogram, [1, 4, bins, frames]),
      })
      const spectrograms = answered(answer, spectrogramOut, spec.stems.length * 2 * plane)
      const waveforms = answered(answer, waveformOut, spec.stems.length * 2 * segmentFrames)

      const stems = {} as Record<StemName, Channels>
      spec.stems.forEach((name, stem) => {
        stems[name] = [0, 1].map((channel) => {
          const at = stem * 2 + channel
          const out = waveforms.slice(at * segmentFrames, (at + 1) * segmentFrames)
          transform.inverse(spectrograms, at * plane, out)
          return out
        })
      })
      return stems
    },
  }
}
