// What the rules share: which moments of a phrase a way may deal, a pass with
// those moments at other pitches, and the words a way refuses a sound with.

import { cents } from './reading'
import { type Moment, type PassNote, type Reading } from './types'

/** Why a way cannot be asked of a sound, where more than one way says the same. */
export const REFUSALS = {
  notNotes: 'Its keys are not notes.',
  notPhrase: 'Needs a phrase.',
  notHeld: 'Needs a held chord.',
} as const

/** A phrase: notes struck one moment after another, played round or left to end. */
export const isPhrase = (reading: Reading): boolean =>
  reading.shape === 'round' || reading.shape === 'ended'

/**
 * The moments a way may deal: one note each, and not the note the sound
 * stands on. A chord struck together stays as it is written, and so does
 * every moment that holds the standing note.
 */
export function singles(reading: Reading): Moment[] {
  return reading.moments.filter((moment) => moment.notes.length === 1 && !moment.standing)
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
