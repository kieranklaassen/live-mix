// Counting the takes a way gives on a sound: the turns are asked for, turns
// with the same notes are one take, and the round is the order the turns name
// the takes in.

import { type PhraseNote } from '../../patch-render'
import { type VariedPlaying, clamp, draw } from '../vary'
import { type FactoryKey } from '../key'
import { alongKey, lend, passKey, readSound } from './reading'
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

/**
 * A sound as a way reads it, or why no way can be asked of it. A held sound
 * of one note or two is read with the notes it is lent (`lend`), along `key`
 * where the sound is not written on the white keys.
 */
export function readFor(sound: VariedPlaying, key?: FactoryKey): Reading | string {
  if (sound.phrase.notes.length === 0) return 'It has no notes.'
  // What no sound of the bank is, and a host's sound may be: nothing here is counted on.
  if (!(sound.durationSec > 0)) return 'It has no length.'
  const numbers = (note: PhraseNote): boolean =>
    Number.isFinite(note.atSec) && Number.isFinite(note.durSec) && Number.isFinite(note.note)
  if (!sound.phrase.notes.every(numbers)) return 'A note of it is not written in numbers.'
  const reading = readSound(sound)
  if (reading.notes.length === 0) return 'It has no notes in its first pass.'
  if (reading.shape === 'irregular') return 'Its passes are not one pass repeated.'
  // A held chord takes its new strikes clear of the fold, and a loop that is all fold has no such place.
  if (reading.shape === 'held' && !(reading.toSec > reading.fromSec)) {
    return 'Its loop is all crossfade.'
  }
  return lend(reading, key)
}

/** The pass `way` gives on each turn, as `playing` asks for it. */
export function turnsOf(
  reading: Reading,
  way: Way,
  playing: WayPlaying,
): (turn: number) => PassNote[] {
  const given = playing.far ?? way.far.default
  // Further than all the way is all the way; only what is no number at all is the way's own.
  const far = Number.isNaN(given) ? way.far.default : clamp(given, 0, 1)
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
  const reading = readFor(sound, playing.key)
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
  // A round the turns asked for do not show twice is asked for once more: it is whole only
  // where the turns after it play it again, with no take it does not have.
  for (let turn = turns.length; !cut && turn < run * 2; turn += 1) {
    cut = keys.indexOf(passKey(play(turn))) !== turns[turn % run]
  }
  return { reading, passes, round: turns.slice(0, run), cut }
}
