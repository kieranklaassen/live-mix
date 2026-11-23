// A model that separates one segment of fixed length, run over a whole
// track. The track is cut into segments that overlap by a quarter, each is
// handed to the model, and the answers are added back together with the most
// weight on the middle of each, where a model is surest. The cutting and the
// weights are the model's reference implementation's, since a model answers
// best to what it was trained on, and so is the bringing of the track to a
// mean of 0 and a deviation of 1 first. The runner knows nothing else about the
// model: one of another kind takes its place by answering `run`.
//
// A track can be gone over more than once. The first pass cuts it as above.
// Each later one has some silence in front of the track, up to half a second
// of it, so its segments fall elsewhere and a frame that sat at the edge of
// one pass's segment sits further into another's. Every pass adds into the
// same sums. How much silence each pass has is drawn from a seed, so a run
// is the same twice.

import { seededUnit } from '../core/clips/chance'
import { saidNames, unnamedKey } from './names'
import {
  SeparationError,
  type Channels,
  type SeparateOptions,
  type Separator,
  type StemName,
} from './types'

/** A model that separates a segment of exactly `segmentFrames` frames. */
export interface SegmentModel<Name extends string = StemName> {
  /** The sample rate the model was trained at. */
  readonly sampleRate: number
  /** The frames of a segment. */
  readonly segmentFrames: number
  /** The stems the model answers with, in the order a desk lists them. One that says none answers the four. */
  readonly stems?: readonly Name[]
  /**
   * Whether the track is brought to a mean of 0 and a deviation of 1 before
   * the model is run, and back after. One that says nothing is run so.
   */
  readonly standardize?: boolean
  /**
   * Two channels of `segmentFrames` in; for each stem, two channels of
   * `segmentFrames` out, and no stem the model does not name.
   */
  run(segment: Channels): Promise<Record<Name, Channels>>
}

export interface SegmentSeparatorOptions {
  /** How much of a segment the next one covers again: 0 or more, and less than 1. Default 0.25. */
  overlap?: number
  /**
   * How many times a track is gone over: a whole number from 1. Each pass
   * after the first cuts the track at an offset of its own, of up to half a
   * second, and the passes' answers are averaged. A pass costs about what
   * the first does. Default 1.
   */
  shifts?: number
  /**
   * What the offsets of the passes after the first are drawn from, brought
   * to a whole number as the engine's other seeds are. The same seed gives
   * the same offsets for every track, and with one pass it does nothing.
   * Default 0.
   */
  seed?: number
}

/** A turn of the event loop, so a page or a worker can answer between two long steps. */
export function turn(): Promise<void> {
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

/**
 * A separator that runs `model` over a track of any length, a segment at a
 * time. Its stems are the model's. Throws a `SeparationError` when the
 * model's stems are no list of names, the overlap is not one, or `shifts`
 * is not a whole number from 1.
 */
export function createSegmentSeparator<Name extends string = StemName>(
  model: SegmentModel<Name>,
  options: SegmentSeparatorOptions = {},
): Separator<Name> {
  const names = saidNames(model.stems, "a model's stems")
  const segmentFrames = model.segmentFrames
  const overlap = options.overlap ?? 0.25
  // Refused here and not found out later: at 1 a run would ask the model
  // once for every frame, and under 0 it would leave frames no segment covers.
  if (!(overlap >= 0 && overlap < 1)) {
    throw new SeparationError(`an overlap is 0 or more and less than 1, not ${overlap}`)
  }
  const shifts = options.shifts ?? 1
  // Refused here as an overlap is, before a model is asked.
  if (!(Number.isInteger(shifts) && shifts >= 1)) {
    throw new SeparationError(`a track is gone over a whole number of times from 1, not ${shifts}`)
  }
  const seed = options.seed ?? 0
  const stride = Math.max(1, Math.floor((1 - overlap) * segmentFrames))
  const weight = weights(segmentFrames)
  /** The most silence a pass has in front of the track: half a second. */
  const longestLead = Math.floor(0.5 * model.sampleRate)
  /**
   * The frames of silence in front of the track in each pass. The first has
   * none and is not drawn. A later one's is drawn from the seed and the
   * pass's number alone, so it is the same whenever and for whatever track
   * it is asked, and one pass draws nothing.
   */
  const leads = (): number[] => {
    const drawn = [0]
    for (let pass = 2; pass <= shifts; pass += 1) {
      drawn.push(Math.floor(seededUnit(seed, 'separation-shift', pass) * (longestLead + 1)))
    }
    return drawn
  }
  /** The segments of one pass over `frames` frames with `lead` frames of silence in front. */
  const segmentsOf = (frames: number, lead: number): number => Math.ceil((frames + lead) / stride)
  /** The segments of every pass over a track of `frames` frames: one step each. */
  const stepsOf = (frames: number, drawn: readonly number[]): number =>
    drawn.reduce((sum, lead) => sum + segmentsOf(frames, lead), 0)
  const steps = (frames: number): number => stepsOf(frames, leads())

  return {
    sampleRate: model.sampleRate,
    stems: names,
    steps,
    async separate(channels: Channels, run: SeparateOptions = {}) {
      if (channels.length !== 2) {
        throw new SeparationError(`a model takes two channels, not ${channels.length}`)
      }
      const [left, right] = channels
      const length = left.length
      // The track's own, taken once: the silence in front of a later pass is no part of them.
      const { mean, scale } = standardOf(left, right)
      // Every pass's silence is drawn before the first segment, so the count of steps is known.
      const drawn = leads()
      const total = stepsOf(length, drawn)
      const summed = {} as Record<Name, Float32Array[]>
      for (const name of names) {
        summed[name] = [new Float32Array(length), new Float32Array(length)]
      }
      const weighed = new Float32Array(length)
      const segment = [new Float32Array(segmentFrames), new Float32Array(segmentFrames)]

      let done = 0
      for (const lead of drawn) {
        // A pass is cut as a track that begins with `lead` frames of silence.
        const framesOfPass = length + lead
        const segments = segmentsOf(length, lead)
        for (let index = 0; index < segments; index += 1) {
          run.signal?.throwIfAborted()
          const offset = index * stride
          const pieceFrames = Math.min(segmentFrames, framesOfPass - offset)
          // A piece shorter than a segment sits in the middle of one, with the
          // track on both sides of it where there is some and silence where not.
          const before = Math.floor((segmentFrames - pieceFrames) / 2)
          // Where the piece, and where the segment, begins in the track: before
          // the track's first frame where the pass's silence still is.
          const at = offset - lead
          const first = at - before
          for (let channel = 0; channel < 2; channel += 1) {
            const source = channels[channel]
            const into = segment[channel]
            for (let i = 0; i < segmentFrames; i += 1) {
              const frame = first + i
              into[i] = frame >= 0 && frame < length ? (source[frame] - mean) / scale : 0
            }
          }
          const answer: Partial<Record<string, Channels>> = await model.run(segment)
          // A stem the model did not name would be left in the remainder without a word.
          const unnamed = unnamedKey(Object.keys(answer), names)
          if (unnamed !== undefined) {
            throw new SeparationError(
              `the model answered a stem it does not name, ${unnamed}: its stems are [${names.join(', ')}]`,
            )
          }
          // What the model answered to the silence in front of the track is left out.
          const silent = Math.max(0, -at)
          for (const name of names) {
            const stem = Object.hasOwn(answer, name) ? answer[name] : undefined
            for (let channel = 0; channel < 2; channel += 1) {
              const from = stem?.[channel]
              if (from?.length !== segmentFrames) {
                throw new SeparationError(
                  `the model answered ${from?.length ?? 'nothing'} for ${name}, not a segment of ${segmentFrames} frames`,
                )
              }
              const into = summed[name][channel]
              for (let i = silent; i < pieceFrames; i += 1) {
                into[at + i] += weight[i] * from[before + i]
              }
            }
          }
          for (let i = silent; i < pieceFrames; i += 1) weighed[at + i] += weight[i]
          done += 1
          run.onProgress?.({ done, total })
          if (done < total) await turn()
        }
      }

      // The level comes back and the mean does not. The reference adds the
      // mean to each stem, which leaves a track that stands off zero with
      // its offset in the stems once for each of them. Left out, the offset
      // is no stem's, and stays in what the track has over the stems. The
      // passes are averaged here, by the weights all of them added.
      for (const name of names) {
        for (const channel of summed[name]) {
          for (let i = 0; i < length; i += 1) channel[i] = (channel[i] / weighed[i]) * scale
        }
      }
      return summed
    },
  }
}
