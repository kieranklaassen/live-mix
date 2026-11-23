// The one call a host makes: a track in, its stems and a remainder out.
// Whatever separator does the work, its answer passes through here, where it
// is held to the stems the separator names, brought back to the track's
// rate, length and channels, refused when it cannot be sound, and subtracted
// from the track to leave the remainder. So the parts added together are the
// track, whatever the separator got wrong and whatever two resamplings lost.
//
// A part split by a second separator (`splitPart`) is the same run with the
// part as the track. It asks through `separatorStems` and subtracts through
// `leftOf`, so a part's stems are held to what a track's are.

import { type PlanarAudio } from '../core/render/encode'
import { saidNames, unnamedKey } from './names'
import { resample, resampledLength } from './resample'
import { turn } from './segments'
import {
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

/** The largest sample of `channels`, and whether every one of them is a finite number. */
function peakOf(channels: Channels): { peak: number; finite: boolean } {
  let peak = 0
  let finite = true
  for (const channel of channels) {
    for (const sample of channel) {
      if (!Number.isFinite(sample)) finite = false
      const size = Math.abs(sample)
      if (size > peak) peak = size
    }
  }
  return { peak, finite }
}

function squaresOf(channels: Channels): number {
  let sum = 0
  for (const channel of channels) {
    for (const sample of channel) sum += sample * sample
  }
  return sum
}

/** What a separator gave of a sound, and how it was asked. */
export interface SeparatorStems<Name extends string> {
  /** The separator's stems, in its order. */
  names: readonly Name[]
  /** Each of them at the sound's own sample rate, length and channel count. */
  stems: Record<Name, Channels>
  /** The sample rate the separator worked at. */
  modelSampleRate: number
  /** Whether the sound was resampled to that rate, and the stems back. */
  resampled: boolean
}

/**
 * The stems `separator` gives of `audio`, a track or a part of one, each at
 * the sound's own sample rate, length and channel count (one or two). The
 * sound goes to the separator at the separator's rate and in two channels, a
 * mono sound on both, and a mono sound's stems are the mean of the two that
 * come back. `sound` says in a refusal what was handed in: `track`, or a
 * part by its name.
 *
 * Rejects as `separateTrack` says it does, with the limit on a stem's
 * largest sample taken from the sound that was handed in.
 */
export async function separatorStems<Name extends string>(
  audio: PlanarAudio,
  separator: Separator<Name>,
  options: SeparateOptions,
  sound: string,
): Promise<SeparatorStems<Name>> {
  const { channels, sampleRate } = audio
  if (channels.length < 1 || channels.length > 2) {
    throw new SeparationError(`a ${sound} has one or two channels, not ${channels.length}`)
  }
  const frames = channels[0].length
  if (frames === 0 || channels.some((channel) => channel.length !== frames)) {
    throw new SeparationError(
      `a ${sound}'s channels have the same length, over zero: [${channels.map((channel) => channel.length).join(', ')}]`,
    )
  }
  const names = saidNames(separator.stems, "a separator's stems")
  options.signal?.throwIfAborted()

  const modelRate = separator.sampleRate
  const resampled = modelRate !== sampleRate
  const modelFrames = resampled ? resampledLength(frames, sampleRate, modelRate) : frames
  // What is held at the separator's rate is let go as soon as it has been
  // used: the sound there once the separator has answered, and each stem
  // once it is back at the sound's rate. Four minutes of stereo is 85 MB a
  // part, and the parts at the separator's rate need not be held beside the
  // ones that are kept.
  const ask = (): Promise<Record<Name, Channels>> => {
    const atModelRate = channels.map((channel) =>
      resample(channel, sampleRate, modelRate, modelFrames),
    )
    return separator.separate(
      atModelRate.length === 1 ? [atModelRate[0], atModelRate[0]] : atModelRate,
      options,
    )
  }
  // The answer's own keys, and nothing it inherits.
  const answer = new Map<string, Channels>(Object.entries(await ask()))
  options.signal?.throwIfAborted()
  // A stem the separator did not name would be left in the remainder without a word.
  const unnamed = unnamedKey(answer.keys(), names)
  if (unnamed !== undefined) {
    throw new SeparationError(
      `the separator answered a stem it does not name, ${unnamed}: its stems are [${names.join(', ')}]`,
    )
  }

  const limit = LOUDEST_STEM * peakOf(channels).peak + NEAR_SILENCE
  const stems = {} as Record<Name, Channels>
  for (const name of names) {
    const stem = answer.get(name)
    answer.delete(name)
    if (stem?.length !== 2 || stem.some((channel) => channel.length !== modelFrames)) {
      throw new SeparationError(
        `the separator answered [${stem?.map((channel) => channel.length).join(', ') ?? 'nothing'}] for ${name}, ` +
          `not two channels of ${modelFrames} frames`,
      )
    }
    const [left, right] = stem
    const own = channels.length === 1 ? [left.map((sample, i) => (sample + right[i]) / 2)] : stem
    stems[name] = own.map((channel) => resample(channel, modelRate, sampleRate, frames))
    const { peak, finite } = peakOf(stems[name])
    if (!finite) {
      throw new SeparationError(`the ${name} stem holds a value that is not a number`)
    }
    if (peak > limit) {
      throw new SeparationError(
        `the ${name} stem peaks at ${peak.toPrecision(3)}, more than 12 dB over the ${sound}`,
      )
    }
    // Bringing a stem back to the track's rate takes seconds of a long
    // track. A turn lets a page or a worker hear that the run is to stop,
    // and the signal is looked at before the next stem.
    if (resampled) {
      await turn()
      options.signal?.throwIfAborted()
    }
  }
  return { names, stems, modelSampleRate: modelRate, resampled }
}

/** What stems leave of a sound, and how much of the sound that is. */
export interface Left {
  /** The sound minus every stem, sample by sample. */
  channels: Channels
  /**
   * Its level against the sound's, in dB, both as the mean square over every
   * channel. `-Infinity` when the stems add up to the sound.
   */
  db: number
  /** Its largest sample. */
  peak: number
}

/**
 * What `stems` leave of `whole`, a track or a part of one. For each sample
 * the stems are added in double precision, in the order they are given, and
 * the sum is taken from the sample and kept in single precision.
 */
export function leftOf(whole: Channels, stems: readonly Channels[]): Left {
  const channels = whole.map((channel, index) => {
    const parts = stems.map((stem) => stem[index])
    const rest = new Float32Array(channel.length)
    for (let i = 0; i < rest.length; i += 1) {
      let sum = 0
      for (const part of parts) sum += part[i]
      rest[i] = channel[i] - sum
    }
    return rest
  })
  const squares = squaresOf(channels)
  return {
    channels,
    db: squares === 0 ? -Infinity : 10 * Math.log10(squares / squaresOf(whole)),
    peak: peakOf(channels).peak,
  }
}

/**
 * `audio` as the separator's stems and a remainder, each at the track's own
 * sample rate, length and channel count (one or two). The stems are the ones
 * the separator names, in its order, or the four when it names none, and the
 * separation says them as its `names`. The track goes to the separator at
 * the separator's rate and in two channels, a mono track on both, and a mono
 * track's stems are the mean of the two that come back.
 *
 * Rejects with a `SeparationError`, and gives nothing, when the track has no
 * frames or more than two channels, when the separator's stems are no list
 * of names, when its answer leaves a named stem out or holds one it did not
 * name, or when a stem holds a value that is not finite or is more than
 * 12 dB over the track's largest sample: a model run on a graphics card can
 * answer with numbers that are not sound, and say nothing. Rejects with the
 * signal's reason when `options.signal` fires.
 */
export async function separateTrack<Name extends string = StemName>(
  audio: PlanarAudio,
  separator: Separator<Name>,
  options: SeparateOptions = {},
): Promise<Separation<Name>> {
  const { names, stems, modelSampleRate, resampled } = await separatorStems(
    audio,
    separator,
    options,
    'track',
  )
  const remainder = leftOf(
    audio.channels,
    names.map((name) => stems[name]),
  )
  return {
    sampleRate: audio.sampleRate,
    names,
    stems,
    remainder: remainder.channels,
    report: {
      remainderDb: remainder.db,
      remainderPeak: remainder.peak,
      modelSampleRate,
      resampled,
    },
  }
}
