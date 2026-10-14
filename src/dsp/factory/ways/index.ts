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

import {
  HIGHEST_NOTE,
  LOWEST_NOTE,
  type SoundVariation,
  type VariedPlaying,
  alongWhiteKeys,
  describeVariant,
  mod,
  varySound,
} from '../vary'
import { cents, layOut, passKey, readSound, tick } from './reading'
import { RULES, wayRule } from './table'
import { type Counted, countTakes, hasTakes, readFor } from './takes'
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

/** No takes, and why. A list of its own each time: a host may keep what it is given. */
const nothing = (refusal: string): WayTakes => ({ takes: 0, round: [], cut: false, refusal })

/**
 * The takes `playing.way` gives on `sound`: how many different ones, and the
 * round the way itself plays them in. None, with the reason, where the way
 * has nothing to play there or the table has no such way. `playing.take` is
 * not read. A sound that is not written on the white keys (a generated
 * sound) is counted in its own key only where `playing.key` names it.
 */
export function wayTakes(sound: VariedPlaying, playing: WayPlaying): WayTakes {
  const way = wayRule(playing.way)
  if (!way) return nothing('No such way.')
  const counted = countTakes(sound, way, playing)
  if (typeof counted === 'string') return nothing(counted)
  return { takes: counted.passes.length, round: counted.round, cut: counted.cut }
}

/** The takes of the way `playing` names on `sound`; null where there are none. */
function takesOf(sound: VariedPlaying, playing: WayPlaying | undefined): Counted | null {
  const way = playing ? wayRule(playing.way) : undefined
  if (!playing || !way) return null
  const counted = countTakes(sound, way, playing)
  return typeof counted === 'string' ? null : counted
}

/** The pass of the take `playing` names, of the takes counted for it. */
function passOf({ passes }: Counted, playing: WayPlaying): PassNote[] {
  const asked = Number.isFinite(playing.take) ? Math.floor(playing.take ?? 0) : 0
  return passes[mod(asked, passes.length)]
}

/** The pass of the take `playing` names, with the sound's reading; null where there is no take. */
function takeOf(
  sound: VariedPlaying,
  playing: WayPlaying | undefined,
): { reading: Reading; pass: PassNote[] } | null {
  const counted = takesOf(sound, playing)
  if (!playing || !counted) return null
  return { reading: counted.reading, pass: passOf(counted, playing) }
}

/** `sound` with the notes of `pass`: the sound itself where the pass is the sound as written. */
function withPass<T extends VariedPlaying>(sound: T, reading: Reading, pass: PassNote[]): T {
  return passKey(pass) === passKey(reading.notes) ? sound : layOut(sound, reading, pass)
}

/**
 * `sound` played the way `playing` names: the sound with the notes of that
 * take, ready to be varied, transposed and rendered as the sound itself is.
 * Without a playing, with a way the table does not have, or where the way has
 * nothing to play, the sound itself comes back, the same object: nothing
 * about it is rendered differently. So does it for a take that is the sound
 * as written. A factory sound is played as it is written, on the white keys,
 * and transposed afterwards (`renderFactorySound` does both). A sound in
 * another key (a generated sound) says so in `playing.key`.
 */
export function playSound<T extends VariedPlaying>(sound: T, playing?: WayPlaying): T {
  const take = takeOf(sound, playing)
  return take ? withPass(sound, take.reading, take.pass) : sound
}

/**
 * How far every take of a way moves to stand on the chord a variant puts its
 * sound on: `steps` along the white keys where every note of every take stays
 * in range there, the same chord an octave the other way where it does not,
 * and nowhere where neither fits. Asked of all the takes at once, so they
 * all stand on one chord. Every take keeps the lowest note of its sound, so
 * a chord the sound may stand on is one its takes may stand on.
 */
function stepsForAll(passes: readonly PassNote[][], steps: number): number {
  if (steps === 0) return 0
  const fits = (by: number): boolean =>
    passes.every((pass) =>
      pass.every(({ note }) => {
        const moved = alongWhiteKeys(note, by)
        return moved >= LOWEST_NOTE && moved <= HIGHEST_NOTE
      }),
    )
  return [steps, steps > 0 ? steps - 7 : steps + 7].find(fits) ?? 0
}

/**
 * `sound` played the way `playing` names and then varied, as
 * `renderFactorySound` does with `plays` and `vary` together. Where the way
 * has takes on the sound, the way writes the notes and the variant gives its
 * chord and its touch, and nothing else of it is read:
 *
 * - The chord is the one the variant puts the sound as written on, decided
 *   once and stood on by every take, so the takes of one way are on one
 *   chord. Decided take by take it would be asked of each take's own notes,
 *   and a take with a higher note than another would land on another chord.
 * - Its speed and its pattern are left out. They are worked out from the
 *   notes they are given: asked of a take they would slow one take and not
 *   the next, and rest the notes the way put there, until two takes are the
 *   same notes.
 *
 * This holds for the take that is the sound as written too: it is one of the
 * takes, on their chord and at their speed. Without a way, with a way the
 * table does not have, or where the way has nothing to play, this is
 * `varySound(sound, variation)`. A host that wants the whole variant played
 * a way asks the way of the variant: `playSound(varySound(sound, variation),
 * playing)`, with `waysFor` and `wayTakes` asked of the varied sound as well.
 */
export function playAndVarySound<T extends VariedPlaying>(
  sound: T,
  playing?: WayPlaying,
  variation?: SoundVariation,
): T {
  const counted = takesOf(sound, playing)
  if (!playing || !counted) return varySound(sound, variation)
  const played = withPass(sound, counted.reading, passOf(counted, playing))
  if (!variation) return played
  const steps = stepsForAll(counted.passes, describeVariant(sound, variation).chordSteps)
  const stood =
    steps === 0
      ? played
      : {
          ...played,
          phrase: {
            ...played.phrase,
            notes: played.phrase.notes.map((note) => ({
              ...note,
              note: alongWhiteKeys(note.note, steps),
            })),
          },
        }
  return varySound(stood, { ...variation, speed: 0, pattern: 0, chord: 0 })
}

/**
 * The ids of the ways that have something to play on `sound`, in menu order,
 * without rendering anything. Each way is asked at the `far` it stands at
 * when a host names none, unless `at.far` says another. A sound that is not
 * written on the white keys (a generated sound) is asked in its own key only
 * where `at.key` names it.
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
 * sound rests. As everywhere, a sound that is not written on the white keys
 * says its key in `playing.key`.
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
