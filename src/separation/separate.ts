// The one call a host makes: a track in, its four stems and a remainder out.
// Whatever separator does the work, its answer passes through here, where it
// is brought back to the track's rate, length and channels, refused when it
// cannot be sound, and subtracted from the track to leave the remainder. So
// the five parts added together are the track, whatever the separator got
// wrong and whatever two resamplings lost.

import { type PlanarAudio } from '../core/render/encode'
import { resample, resampledLength } from './resample'
import {
  STEM_NAMES,
  SeparationError,
  type Channels,
  type SeparateOptions,
  type Separation,
  type Separator,
  type StemName,
} from './types'

/** A stem this many times the track's largest sample is no stem (12 dB over). */
const LOUDEST_STEM = 4
/** Under this (-120 dB) a stem is let be, however quiet the track. */
const NEAR_SILENCE = 1e-6

function peakOf(channels: Channels): number {
  let peak = 0
  for (const channel of channels) {
    for (const sample of channel) {
      const size = Math.abs(sample)
      // A value that is no number is larger than nothing: it is looked for by itself.
      if (size > peak) peak = size
    }
  }
  return peak
}

function squaresOf(channels: Channels): number {
  let sum = 0
  for (const channel of channels) {
    for (const sample of channel) sum += sample * sample
  }
  return sum
}

/**
 * `audio` as four stems and a remainder, each at the track's own sample
 * rate, length and channel count (one or two). The track goes to the
 * separator at the separator's rate and in two channels, a mono track on
 * both, and a mono track's stems are the mean of the two that come back.
 *
 * Rejects with a `SeparationError`, and gives nothing, when the track has no
 * frames or more than two channels, or when a stem holds a value that is not
 * finite or is more than 12 dB over the track's largest sample: a model run
 * on a graphics card can answer with numbers that are not sound, and say
 * nothing. Rejects with the signal's reason when `options.signal` fires.
 */
export async function separateTrack(
  audio: PlanarAudio,
  separator: Separator,
  options: SeparateOptions = {},
): Promise<Separation> {
  const { channels, sampleRate } = audio
  if (channels.length < 1 || channels.length > 2) {
    throw new SeparationError(`a track has one or two channels, not ${channels.length}`)
  }
  const frames = channels[0].length
  if (frames === 0 || channels.some((channel) => channel.length !== frames)) {
    throw new SeparationError(
      `a track's channels have the same length, over zero: [${channels.map((channel) => channel.length).join(', ')}]`,
    )
  }
  options.signal?.throwIfAborted()

  const modelRate = separator.sampleRate
  const resampled = modelRate !== sampleRate
  const modelFrames = resampled ? resampledLength(frames, sampleRate, modelRate) : frames
  const atModelRate = channels.map((channel) =>
    resample(channel, sampleRate, modelRate, modelFrames),
  )
  const answer = await separator.separate(
    atModelRate.length === 1 ? [atModelRate[0], atModelRate[0]] : atModelRate,
    options,
  )
  options.signal?.throwIfAborted()

  const limit = LOUDEST_STEM * peakOf(channels) + NEAR_SILENCE
  const stems = {} as Record<StemName, Channels>
  for (const name of STEM_NAMES) {
    const stem = answer[name]
    if (stem?.length !== 2 || stem.some((channel) => channel.length !== modelFrames)) {
      throw new SeparationError(
        `the separator answered [${stem?.map((channel) => channel.length).join(', ') ?? 'nothing'}] for ${name}, ` +
          `not two channels of ${modelFrames} frames`,
      )
    }
    const [left, right] = stem
    const own = channels.length === 1 ? [left.map((sample, i) => (sample + right[i]) / 2)] : stem
    stems[name] = own.map((channel) => resample(channel, modelRate, sampleRate, frames))
    if (stems[name].some((channel) => !channel.every(Number.isFinite))) {
      throw new SeparationError(`the ${name} stem holds a value that is not a number`)
    }
    const peak = peakOf(stems[name])
    if (peak > limit) {
      throw new SeparationError(
        `the ${name} stem peaks at ${peak.toPrecision(3)}, more than 12 dB over the track`,
      )
    }
  }

  const remainder = channels.map((channel, index) => {
    const rest = new Float32Array(frames)
    for (let i = 0; i < frames; i += 1) {
      let sum = 0
      for (const name of STEM_NAMES) sum += stems[name][index][i]
      rest[i] = channel[i] - sum
    }
    return rest
  })

  const remainderSquares = squaresOf(remainder)
  return {
    sampleRate,
    stems,
    remainder,
    report: {
      remainderDb:
        remainderSquares === 0
          ? -Infinity
          : 10 * Math.log10(remainderSquares / squaresOf(channels)),
      remainderPeak: peakOf(remainder),
      modelSampleRate: modelRate,
      resampled,
    },
  }
}
