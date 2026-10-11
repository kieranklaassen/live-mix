// What a factory sound is measured by beyond its level: how it starts, how it
// ends and how it comes round, by the measure a clip is entered and left with
// (core/clips/seam.ts), and how even it is on the way. The bench prints
// these; the tests hold every sound to the ones that are rules.

import { comesRound, entersOnStep, leavesOnStep, type SoundFrames } from '../../../core/clips/seam'
import { type PlanarAudio } from '../../../core/render/encode'
import { fft } from '../../__tests__/render-support'
import { peakOf } from '../../patch-render'
import { transposeFactorySound } from '..'
import { type FactorySound } from '../types'

/** Rendered audio in the shape the seam measure reads. */
export function soundFrames(audio: PlanarAudio): SoundFrames {
  return {
    numberOfChannels: audio.channels.length,
    length: audio.channels[0].length,
    sampleRate: audio.sampleRate,
    getChannelData: (channel) => audio.channels[channel],
  }
}

export interface SoundEnds {
  /** The whole sound comes round on itself: no step from its last frame to its first. */
  round: boolean
  /** Coming in from silence on the first frame is a step. */
  stepIn: boolean
  /** Going to silence after the last frame is a step. */
  stepOut: boolean
  /** Seconds before the level first comes within 40 dB of the peak. */
  leadSec: number
  /** The last 50 ms against the peak, dB. */
  endDb: number
  /** The loudest whole second against the quietest, dB: how much the level moves on the way. */
  swingDb: number
}

const db = (gain: number): number => (gain > 0 ? 20 * Math.log10(gain) : -Infinity)

function rms(channels: readonly Float32Array[], from: number, to: number): number {
  let sum = 0
  for (const channel of channels) {
    for (let i = from; i < to; i += 1) sum += channel[i] * channel[i]
  }
  return Math.sqrt(sum / Math.max(1, (to - from) * channels.length))
}

export function measureEnds(audio: PlanarAudio): SoundEnds {
  const frames = soundFrames(audio)
  const peak = peakOf(audio.channels)
  const floor = peak / 100
  let lead = frames.length
  for (const channel of audio.channels) {
    const first = channel.findIndex((sample) => Math.abs(sample) >= floor)
    if (first >= 0 && first < lead) lead = first
  }
  const second = audio.sampleRate
  const levels: number[] = []
  for (let start = 0; start + second <= frames.length; start += second) {
    levels.push(rms(audio.channels, start, start + second))
  }
  const last = Math.round(0.05 * audio.sampleRate)
  return {
    round: comesRound(frames, 0, frames.length),
    stepIn: entersOnStep(frames, 0),
    stepOut: leavesOnStep(frames, frames.length - 1),
    leadSec: lead / audio.sampleRate,
    endDb: db(rms(audio.channels, frames.length - last, frames.length)) - db(peak),
    swingDb: levels.length > 1 ? db(Math.max(...levels)) - db(Math.min(...levels)) : 0,
  }
}

/** The semitones the bank moves by, one for each of the twelve keys. */
export const EVERY_KEY = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] as const

/** The longest a sound's name gets in any key ("Low drone E♭" is longer than "Low drone D"). */
export function longestName(sound: FactorySound): string {
  return EVERY_KEY.map((by) => transposeFactorySound(sound, by).name).reduce((a, b) =>
    b.length > a.length ? b : a,
  )
}

/** Integrated loudness a sound of each kind sits in at the bank's peak level, LUFS. */
export const KIND_LOUDNESS: Readonly<Record<string, readonly [quietest: number, loudest: number]>> =
  {
    drone: [-19, -12],
    pad: [-22, -13],
    texture: [-25, -15],
    oneshot: [-24, -13],
    melodic: [-24, -13],
    beat: [-36, -13],
  }

const BLACK_KEYS: ReadonlySet<number> = new Set([1, 3, 6, 8, 10])

/**
 * How much of a sound's power between C2 and C7 lies on the black keys, 0 to
 * 1, each stretch of the spectrum counted for the key it is nearest to. The
 * bank is written on the white keys, so a sound in tune with it has little
 * there: what it has is overtones (the fifth partial of an E is a G sharp),
 * detuning and noise. Rain is near five twelfths, as any noise is. A pitched
 * sound far above the rest of the bank plays a note the key does not have:
 * a shifted fifth over a B, a major chord built on a D.
 */
export function blackKeyShare(audio: PlanarAudio): number {
  const [left, right = left] = audio.channels
  const size = 65536
  if (left.length < size) return 0
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  const lowest = 440 * 2 ** ((35.5 - 69) / 12)
  const highest = 440 * 2 ** ((96.5 - 69) / 12)
  let black = 0
  let all = 0
  const hops = Math.min(12, Math.max(1, Math.floor((left.length - size) / (size / 2)) + 1))
  const stride = hops > 1 ? Math.floor((left.length - size) / (hops - 1)) : 0
  for (let hop = 0; hop < hops; hop += 1) {
    const start = hop * stride
    for (let i = 0; i < size; i += 1) {
      const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size)
      re[i] = ((left[start + i] + right[start + i]) / 2) * window
      im[i] = 0
    }
    fft(re, im)
    for (let bin = 1; bin < size / 2; bin += 1) {
      const hz = (bin * audio.sampleRate) / size
      if (hz < lowest || hz >= highest) continue
      const power = re[bin] * re[bin] + im[bin] * im[bin]
      const key = Math.round(69 + 12 * Math.log2(hz / 440))
      if (BLACK_KEYS.has(((key % 12) + 12) % 12)) black += power
      all += power
    }
  }
  return all > 0 ? black / all : 0
}
