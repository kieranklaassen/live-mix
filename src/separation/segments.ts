// A model that separates one segment of fixed length, run over a whole
// track. The track is cut into segments that overlap by a quarter, each is
// handed to the model, and the answers are added back together with the most
// weight on the middle of each, where a model is surest. The cutting and the
// weights are the model's reference implementation's, since a model answers
// best to what it was trained on, and so is the bringing of the track to a
// mean of 0 and a deviation of 1 first. The runner knows nothing else about the
// model: one of another kind takes its place by answering `run`.

import {
  STEM_NAMES,
  SeparationError,
  type Channels,
  type SeparateOptions,
  type Separator,
  type StemName,
} from './types'

/** A model that separates a segment of exactly `segmentFrames` frames. */
export interface SegmentModel {
  /** The sample rate the model was trained at. */
  readonly sampleRate: number
  /** The frames of a segment. */
  readonly segmentFrames: number
  /** Two channels of `segmentFrames` in; for each stem, two channels of `segmentFrames` out. */
  run(segment: Channels): Promise<Record<StemName, Channels>>
}

export interface SegmentSeparatorOptions {
  /** How much of a segment the next one covers again, 0 up to 1. Default 0.25. */
  overlap?: number
}

/** A turn of the event loop, so a page or a worker can answer between segments. */
function turn(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** A triangle over a segment: 1 in the middle, next to nothing at the ends. */
function weights(segmentFrames: number): Float32Array {
  const half = Math.floor(segmentFrames / 2)
  const top = Math.max(half, segmentFrames - half)
  const weight = new Float32Array(segmentFrames)
  for (let i = 0; i < half; i += 1) weight[i] = (i + 1) / top
  for (let i = half; i < segmentFrames; i += 1) weight[i] = (segmentFrames - i) / top
  return weight
}

/** The mean and the deviation of the track as one channel, which a model's input is brought to 0 and 1 by. */
function standardOf(left: Float32Array, right: Float32Array): { mean: number; scale: number } {
  const length = left.length
  let sum = 0
  for (let i = 0; i < length; i += 1) sum += (left[i] + right[i]) / 2
  const mean = sum / length
  let squares = 0
  for (let i = 0; i < length; i += 1) squares += ((left[i] + right[i]) / 2 - mean) ** 2
  const deviation = length > 1 ? Math.sqrt(squares / (length - 1)) : 0
  // The little added keeps a track that stands still from dividing by nothing.
  return { mean, scale: deviation + 1e-8 }
}

/** A separator that runs `model` over a track of any length, a segment at a time. */
export function createSegmentSeparator(
  model: SegmentModel,
  options: SegmentSeparatorOptions = {},
): Separator {
  const segmentFrames = model.segmentFrames
  const stride = Math.max(1, Math.floor((1 - (options.overlap ?? 0.25)) * segmentFrames))
  const weight = weights(segmentFrames)

  return {
    sampleRate: model.sampleRate,
    async separate(channels: Channels, run: SeparateOptions = {}) {
      if (channels.length !== 2) {
        throw new SeparationError(`a model takes two channels, not ${channels.length}`)
      }
      const [left, right] = channels
      const length = left.length
      const { mean, scale } = standardOf(left, right)
      const total = Math.ceil(length / stride)
      const summed = {} as Record<StemName, Float32Array[]>
      for (const name of STEM_NAMES) {
        summed[name] = [new Float32Array(length), new Float32Array(length)]
      }
      const weighed = new Float32Array(length)
      const segment = [new Float32Array(segmentFrames), new Float32Array(segmentFrames)]

      for (let done = 0; done < total; done += 1) {
        run.signal?.throwIfAborted()
        const offset = done * stride
        const pieceFrames = Math.min(segmentFrames, length - offset)
        // A piece shorter than a segment sits in the middle of one, with the
        // track on both sides of it where there is some and silence where not.
        const lead = Math.floor((segmentFrames - pieceFrames) / 2)
        const first = offset - lead
        for (let channel = 0; channel < 2; channel += 1) {
          const source = channels[channel]
          const into = segment[channel]
          for (let i = 0; i < segmentFrames; i += 1) {
            const at = first + i
            into[i] = at >= 0 && at < length ? (source[at] - mean) / scale : 0
          }
        }
        const answer = await model.run(segment)
        for (const name of STEM_NAMES) {
          for (let channel = 0; channel < 2; channel += 1) {
            const from = answer[name]?.[channel]
            if (from?.length !== segmentFrames) {
              throw new SeparationError(
                `the model answered ${from?.length ?? 'nothing'} for ${name}, not a segment of ${segmentFrames} frames`,
              )
            }
            const into = summed[name][channel]
            for (let i = 0; i < pieceFrames; i += 1) into[offset + i] += weight[i] * from[lead + i]
          }
        }
        for (let i = 0; i < pieceFrames; i += 1) weighed[offset + i] += weight[i]
        run.onProgress?.({ done: done + 1, total })
        if (done + 1 < total) await turn()
      }

      // The level comes back and the mean does not. The reference adds the
      // mean to each of the four, which leaves a track that stands off zero
      // with four times its offset in the stems. Left out, the offset is no
      // stem's, and stays in what the track has over the stems.
      for (const name of STEM_NAMES) {
        for (const channel of summed[name]) {
          for (let i = 0; i < length; i += 1) channel[i] = (channel[i] / weighed[i]) * scale
        }
      }
      return summed
    },
  }
}
