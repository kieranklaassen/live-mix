// Counting the takes a way gives on a sound: the turns are asked for, turns
// with the same notes are one take, and the round is the order the turns name
// the takes in.

import { type VariedPlaying, clamp, draw } from '../vary'
import { alongKey, passKey, readSound } from './reading'
import { type PassNote, type Reading, type Way, type WayPlaying } from './types'

/** How many turns a rule is asked for. */
const TURNS = 16
/** How many different takes a way may give. */
export const MOST_TAKES = 8

/** A number for a way's id, so that no two ways draw the same. */
function wayNumber(id: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 0x01000193)
  }
  return hash
}

export interface Counted {
  reading: Reading
  /** The different takes, in the order the turns first play them. */
  passes: PassNote[][]
  round: number[]
  cut: boolean
}

/** A sound as a way reads it, or why no way can be asked of it. */
export function readFor(sound: VariedPlaying): Reading | string {
  if (sound.phrase.notes.length === 0) return 'It has no notes.'
  const reading = readSound(sound)
  return reading.shape === 'irregular' ? 'Its passes are not one pass repeated.' : reading
}

/** The pass `way` gives on each turn, as `playing` asks for it. */
function turnsOf(reading: Reading, way: Way, playing: WayPlaying): (turn: number) => PassNote[] {
  const given = playing.far ?? way.far.default
  const far = Number.isFinite(given) ? clamp(given, 0, 1) : way.far.default
  const seed = Number.isFinite(playing.seed) ? playing.seed : 0
  const number = wayNumber(way.id)
  const along = (note: number, steps: number): number => alongKey(note, steps, playing.key)
  return (turn) =>
    way.play(reading, { turn, far, along, draw: (...of) => draw(seed, number, ...of) })
}

/**
 * Whether `way` has something to play on a sound read as `reading`: what
 * `countTakes` finds, without counting past the second take.
 */
export function hasTakes(reading: Reading, way: Way, playing: WayPlaying): boolean {
  if (way.fits(reading) !== null) return false
  const play = turnsOf(reading, way, playing)
  const first = passKey(play(0))
  for (let turn = 1; turn < TURNS; turn += 1) {
    if (passKey(play(turn)) !== first) return true
  }
  return false
}

/** The takes of `way` on `sound`, or why there are none. */
export function countTakes(sound: VariedPlaying, way: Way, playing: WayPlaying): Counted | string {
  const reading = readFor(sound)
  if (typeof reading === 'string') return reading
  const refusal = way.fits(reading)
  if (refusal !== null) return refusal

  const play = turnsOf(reading, way, playing)
  const keys: string[] = []
  const passes: PassNote[][] = []
  const turns: number[] = []
  let cut = false
  for (let turn = 0; turn < TURNS; turn += 1) {
    const pass = play(turn)
    const key = passKey(pass)
    let take = keys.indexOf(key)
    if (take < 0) {
      if (passes.length === MOST_TAKES) {
        cut = true
        break
      }
      take = keys.push(key) - 1
      passes.push(pass)
    }
    turns.push(take)
  }
  if (passes.length < 2) return 'Every take of it comes out the same.'

  // The round: the shortest run of turns that all the turns asked for repeat. A turn that
  // only happens to equal the first does not end it.
  let run = 1
  while (run < turns.length && !turns.every((take, turn) => take === turns[turn % run])) run += 1
  return { reading, passes, round: turns.slice(0, run), cut }
}
