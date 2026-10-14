// Counting the takes a way gives on a sound: the turns are asked for, turns
// with the same notes are one take, and the round is the order the turns name
// the takes in.

import { type VariedPlaying, draw } from '../vary'
import { alongKey, passKey, readSound } from './reading'
import { type PassNote, type Reading, type Way, type WayPlaying } from './types'

/** How many turns a rule is asked for. */
const TURNS = 16
/** How many different takes a way may give. */
const MOST_TAKES = 8

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

/** The takes of `way` on `sound`, or why there are none. */
export function countTakes(sound: VariedPlaying, way: Way, playing: WayPlaying): Counted | string {
  if (sound.phrase.notes.length === 0) return 'It has no notes.'
  const reading = readSound(sound)
  if (reading.shape === 'irregular') return 'Its passes are not one pass repeated.'
  const refusal = way.fits(reading)
  if (refusal !== null) return refusal

  const given = playing.far ?? way.far.default
  const far = Number.isFinite(given) ? Math.min(1, Math.max(0, given)) : way.far.default
  const seed = Number.isFinite(playing.seed) ? playing.seed : 0
  const number = wayNumber(way.id)
  const along = (note: number, steps: number): number => alongKey(note, steps, playing.key)

  const keys: string[] = []
  const passes: PassNote[][] = []
  const turns: number[] = []
  let cut = false
  for (let turn = 0; turn < TURNS; turn += 1) {
    const pass = way.play(reading, {
      turn,
      far,
      along,
      draw: (...of) => draw(seed, number, ...of),
    })
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
