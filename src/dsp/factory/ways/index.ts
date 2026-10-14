// A way of playing a sound: a named rule that writes the notes of the sound's
// takes from the sound's own notes, its key, a seed and one amount, `far`.
// Where a variant (../vary.ts) is the sound played once more, differently,
// and is then the same on every pass, a way gives a few takes that differ
// from one another, to be played in turn: a host renders each as it renders a
// variant and names them in a clip's turns.
//
// A rule is asked for one turn at a time and gives one pass of notes. The
// takes are counted here and not declared by the rule: the turns are asked
// for, turns with the same notes are one take, and the round is the order the
// turns name the takes in. A way that gives fewer than two different takes on
// a sound has nothing to play there, and says so.
//
// A take keeps what a variant keeps. The instrument, the effects and the
// lengths stay, so every take of a sound is as long as it and loops where it
// loops. It is in the sound's key. Every moment that holds the note the sound
// stands on is left as written: a way deals the others. The hardest note is
// as hard as the sound's hardest. Everything is decided by the sound, the
// way, the seed and `far`, and by nothing else.

import { type SoundVariation, type VariedPlaying, mod, varySound } from '../vary'
import { cents, layOut, passKey, readSound, tick } from './reading'
import { RULES, wayRule } from './table'
import { countTakes, hasTakes, readFor } from './takes'
import {
  type PassNote,
  type Reading,
  type TakeChanges,
  type WayPlaying,
  type WayTakes,
} from './types'

export { WAYS } from './table'
export { TAKE_ORDERS, takeOrder, type TakeOrder, type TakeOrderOptions } from './take-order'
export {
  WAY_FAMILIES,
  type TakeChanges,
  type WayFamily,
  type WayPlaying,
  type WayRow,
  type WayTakes,
} from './types'

const NOTHING = { takes: 0, round: [], cut: false } as const

/**
 * The takes `playing.way` gives on `sound`: how many different ones, and the
 * round the way itself plays them in. None, with the reason, where the way
 * has nothing to play there or the table has no such way. `playing.take` is
 * not read.
 */
export function wayTakes(sound: VariedPlaying, playing: WayPlaying): WayTakes {
  const way = wayRule(playing.way)
  if (!way) return { ...NOTHING, refusal: 'No such way.' }
  const counted = countTakes(sound, way, playing)
  if (typeof counted === 'string') return { ...NOTHING, refusal: counted }
  return { takes: counted.passes.length, round: counted.round, cut: counted.cut }
}

/** The pass of the take `playing` names, with the sound's reading; null where there is no take. */
function takeOf(
  sound: VariedPlaying,
  playing: WayPlaying | undefined,
): { reading: Reading; pass: PassNote[] } | null {
  const way = playing ? wayRule(playing.way) : undefined
  if (!playing || !way) return null
  const counted = countTakes(sound, way, playing)
  if (typeof counted === 'string') return null
  const { passes, reading } = counted
  const asked = Number.isFinite(playing.take) ? Math.floor(playing.take ?? 0) : 0
  return { reading, pass: passes[mod(asked, passes.length)] }
}

/**
 * `sound` played the way `playing` names: the sound with the notes of that
 * take, ready to be varied, transposed and rendered as the sound itself is.
 * Without a playing, with a way the table does not have, or where the way has
 * nothing to play, the sound itself comes back, the same object: nothing
 * about it is rendered differently. So does it for a take that is the sound
 * as written. A factory sound is played as it is written, on the white keys,
 * and transposed afterwards (`renderFactorySound` does both).
 */
export function playSound<T extends VariedPlaying>(sound: T, playing?: WayPlaying): T {
  const take = takeOf(sound, playing)
  if (!take || passKey(take.pass) === passKey(take.reading.notes)) return sound
  return layOut(sound, take.reading, take.pass)
}

/**
 * `sound` played the way `playing` names and then varied: the way writes the
 * notes and the variant touches them up, as `renderFactorySound` does with
 * `plays` and `vary` together. A take of a held chord is varied as a held
 * chord is, by its chords and its touch. Its notes no longer all hold through
 * the loop, so `varySound` would read them as a phrase played round, play it
 * at half time and strike the note it stands on a second time.
 */
export function playAndVarySound<T extends VariedPlaying>(
  sound: T,
  playing?: WayPlaying,
  variation?: SoundVariation,
): T {
  const played = playSound(sound, playing)
  const held = variation && played !== sound && readSound(sound).shape === 'held'
  return varySound(played, held ? { ...variation, speed: 0, pattern: 0 } : variation)
}

/**
 * The ids of the ways that have something to play on `sound`, in menu order,
 * without rendering anything. Each way is asked at the `far` it stands at
 * when a host names none, unless `at.far` says another.
 */
export function waysFor(
  sound: VariedPlaying,
  at: Partial<Pick<WayPlaying, 'seed' | 'far' | 'key'>> = {},
): string[] {
  const reading = readFor(sound)
  if (typeof reading === 'string') return []
  return RULES.filter((way) => hasTakes(reading, way, { seed: 0, ...at, way: way.id })).map(
    (way) => way.id,
  )
}

/**
 * What the take `playing` names does to its sound, in notes of one pass. A
 * note at a written time and pitch is neither moved nor shifted; one at a
 * written time and another pitch is moved; one at a written pitch and another
 * time is shifted; what is left of the take is added, and what is left of the
 * sound rests.
 */
export function describeTake(sound: VariedPlaying, playing?: WayPlaying): TakeChanges {
  const take = takeOf(sound, playing)
  const written = [...(take?.reading.notes ?? readSound(sound).notes)]
  const played = [...(take?.pass ?? written)]
  const changes: TakeChanges = {
    sounding: played.length,
    resting: 0,
    moved: 0,
    shifted: 0,
    added: 0,
  }
  // Each note of the take is paired with one written note at most: the same note first, then
  // one at its time, then one at its pitch.
  const pair = (same: (a: PassNote, b: PassNote) => boolean): number => {
    let pairs = 0
    for (let index = played.length - 1; index >= 0; index -= 1) {
      const from = written.findIndex((note) => same(played[index], note))
      if (from < 0) continue
      written.splice(from, 1)
      played.splice(index, 1)
      pairs += 1
    }
    return pairs
  }
  const sameTime = (a: PassNote, b: PassNote): boolean => tick(a.at) === tick(b.at)
  const samePitch = (a: PassNote, b: PassNote): boolean => cents(a.note) === cents(b.note)
  pair((a, b) => sameTime(a, b) && samePitch(a, b))
  changes.moved = pair(sameTime)
  changes.shifted = pair(samePitch)
  changes.added = played.length
  changes.resting = written.length
  return changes
}
