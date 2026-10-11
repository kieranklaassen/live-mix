// What a factory sound is measured by beyond its level: how it starts, how it
// ends and how it comes round, by the measure a clip is entered and left with
// (core/clips/seam.ts), and how even it is on the way. The bench prints
// these; the tests hold every sound to the ones that are rules.

import { BEAT_MIN_ONSETS } from '../../../core/analysis/sound-kind'
import { comesRound, entersOnStep, leavesOnStep, type SoundFrames } from '../../../core/clips/seam'
import { type PlanarAudio } from '../../../core/render/encode'
import { fft } from '../../__tests__/render-support'
import { peakOf } from '../../patch-render'
import { FACTORY_PEAK_DB, transposeFactorySound } from '..'
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

/**
 * How far under the bank's peak one part of a kit may peak, in dB: a ghost
 * of a shaker is the softest thing a kit plays, and the kit's hardest kick
 * is at the peak (`KIT_LEVEL_DB`).
 */
export const KIT_LEVEL_REACH_DB = 20

/**
 * Whether a render is at the level its sound is meant to have: at the bank's
 * peak, or for one part of a kit (`kitLevel`) where the kit has that drum,
 * which is under the peak by no more than `KIT_LEVEL_REACH_DB` and never
 * more than a dB over it.
 */
export function atItsLevel(sound: FactorySound, peakDb: number): boolean {
  if (!sound.kitLevel) return Math.abs(peakDb - FACTORY_PEAK_DB) < 0.05
  return peakDb <= FACTORY_PEAK_DB + 1 && peakDb >= FACTORY_PEAK_DB - KIT_LEVEL_REACH_DB
}

/** The quietest a sound may be, LUFS: one part of a kit is as much quieter as it lies under the kick. */
export function quietestLufs(sound: FactorySound): number {
  return sound.kitLevel ? -40 - KIT_LEVEL_REACH_DB / 2 : -40
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

/** How far off a straight sixteenth a stroke may be written and still be on it, in seconds. */
const ON_THE_GRID_SEC = 0.002

/**
 * True for a sound on a kit that keeps time and that the analysis cannot be
 * asked about: one with a row that is swung, laid back or faster than
 * sixteenths, or with fewer hits in a round than the analysis wants before it
 * says `beat`. The analysis holds the hits it hears to a straight grid and
 * asks for four of them (core/analysis), so it reads no tempo from sixteenths
 * swung by more than a few milliseconds, from a roll in thirty-seconds, nor
 * from one crash in four bars. Such a loop or fill is written on a beat all
 * the same, and `beat` is the bank's word for it.
 */
export function beatTheAnalysisLoses(sound: FactorySound): boolean {
  if (!sound.kit || sound.bpm === undefined) return false
  const step = 60 / sound.bpm / 4
  const from = sound.skipSec ?? 0
  const round = sound.phrase.notes.filter(
    (note) => note.atSec >= from - 1e-9 && note.atSec < from + sound.durationSec - 1e-9,
  )
  const offTheGrid = round.some(
    (note) => Math.abs(note.atSec - Math.round(note.atSec / step) * step) > ON_THE_GRID_SEC,
  )
  const hits = new Set(round.map((note) => Math.round(note.atSec * 1000))).size
  return offTheGrid || hits < BEAT_MIN_ONSETS
}
