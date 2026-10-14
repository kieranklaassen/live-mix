// What the rules share: which moments of a phrase a way may deal or rest, a
// pass with those moments at other pitches or resting, and the words a way
// refuses a sound with.

import { cents } from './reading'
import { type Moment, type PassNote, type Reading } from './types'

/** Why a way cannot be asked of a sound, where more than one way says the same. */
export const REFUSALS = {
  notNotes: 'Its keys are not notes.',
  notPhrase: 'Needs a phrase.',
  notHeld: 'Needs a held chord.',
  threePitches: 'Needs a phrase of three pitches.',
} as const

/** What a way needs of a sound, where more than one way says the same. */
export const PHRASE_NEEDS = 'A phrase or a beat'
export const PITCHES_NEEDS = 'A phrase of three pitches'

export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** A phrase: notes struck one moment after another, played round or left to end. */
export const isPhrase = (reading: Reading): boolean =>
  reading.shape === 'round' || reading.shape === 'ended'

/** Why a way that deals the pitches of a phrase cannot be asked of a sound that has none: null where it has. */
export const pitchedPhrase = (reading: Reading): string | null => {
  if (!reading.pitched) return REFUSALS.notNotes
  return isPhrase(reading) ? null : REFUSALS.notPhrase
}

/** A phrase to count on: two moments or more. */
export const fitsPhrase = (reading: Reading): string | null =>
  isPhrase(reading) && reading.moments.length >= 2 ? null : REFUSALS.notPhrase

/**
 * The moments a way may deal: one note each, and not the note the sound
 * stands on. A chord struck together stays as it is written, and so does
 * every moment that holds the standing note.
 */
export function singles(reading: Reading): Moment[] {
  return reading.moments.filter((moment) => moment.notes.length === 1 && !moment.standing)
}

/** Two moments to deal and two pitches above the standing note: three pitches to deal among. */
export const hasThreePitches = (reading: Reading): boolean =>
  singles(reading).length >= 2 && reading.upper.length >= 2

/** A phrase of pitches with three to deal among, or why it is not one. */
export const fitsPitches = (reading: Reading): string | null =>
  pitchedPhrase(reading) ?? (hasThreePitches(reading) ? null : REFUSALS.threePitches)

/** The pitches of the moments a way may deal, in the order they are played. */
export const line = (reading: Reading): number[] =>
  singles(reading).map((moment) => moment.notes[0].note)

/** Where `note` is in the chord above the standing note, from its bottom: -1 where it is not in it. */
export const upperPlace = (reading: Reading, note: number): number =>
  reading.upper.findIndex((each) => cents(each) === cents(note))

/** The places, among the moments of a pass, of the ones that may rest: not the first, and none that holds the standing note. */
export function mayRest(reading: Reading): number[] {
  return reading.moments.flatMap((moment, place) => (place > 0 && !moment.standing ? [place] : []))
}

/** The pass as written without the moments `rests` names, of the ones that may rest. */
export function resting(reading: Reading, rests: (place: number) => boolean): PassNote[] {
  const gone = new Set(
    mayRest(reading)
      .filter(rests)
      .flatMap((place) => reading.moments[place].notes),
  )
  return reading.notes.filter((note) => !gone.has(note))
}

/** The pass as written, with the note of each dealt moment at the pitch `pitchOf` gives it. */
export function repitched(
  reading: Reading,
  pitchOf: (index: number, count: number) => number,
): PassNote[] {
  const dealt = singles(reading).map((moment) => moment.notes[0])
  return reading.notes.map((note) => {
    const index = dealt.indexOf(note)
    return index < 0 ? note : { ...note, note: pitchOf(index, dealt.length) }
  })
}

/** The notes of a pass at the pitch the sound stands on: a held way leaves them as written. */
export function standingNotes(reading: Reading): PassNote[] {
  const { standing } = reading
  return standing === null
    ? []
    : reading.notes.filter((note) => cents(note.note) === cents(standing))
}

/** How hard the sound plays `pitch`, or the same note an octave under it; its hardest note where it has neither. */
export function gainAt(reading: Reading, pitch: number): number {
  const at = (each: number): PassNote | undefined =>
    reading.notes.find((note) => cents(note.note) === cents(each))
  return (at(pitch) ?? at(pitch - 12))?.gain ?? Math.max(...reading.notes.map((note) => note.gain))
}
