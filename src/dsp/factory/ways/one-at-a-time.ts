// One at a time: the chord's notes dealt out in an order, a different start
// each turn. On a held chord the note the sound stands on holds as written
// and the notes above it are struck in turn across the loop, the notes a
// held sound of one note or two was lent among them; on a phrase the
// notes above it are laid on the moments that do not hold it, so the phrase
// keeps its rhythm and the note it stands on.

import { HIGHEST_NOTE } from '../vary'
import {
  REFUSALS,
  gainAt,
  hasThreePitches,
  line,
  pitchedPhrase,
  repitched,
  singles,
  standingNotes,
} from './pass'
import { cents } from './reading'
import { type PassNote, type Reading, type Turn, type Way } from './types'

/** How many times a held chord is struck in a pass. */
const STRIKES = 8
/** How many strikes a note struck on a held chord rings for. */
const RINGS = 3

/** The notes above the standing note, low to high; past half of `far`, on into the octave above. */
function ladder(reading: Reading, far: number): number[] {
  const upper = [...reading.upper]
  if (far <= 0.5) return upper
  const above = upper
    .map((note) => note + 12)
    .filter((note) => note <= HIGHEST_NOTE && !upper.some((each) => cents(each) === cents(note)))
  return [...upper, ...above].sort((a, b) => a - b)
}

/** The pass with `pitchOf` dealt over it: struck across a held chord, or laid on a phrase's own moments. */
function dealt(reading: Reading, pitchOf: (index: number, count: number) => number): PassNote[] {
  if (reading.shape !== 'held') return repitched(reading, pitchOf)
  const step = (reading.toSec - reading.fromSec) / STRIKES
  const strikes = Array.from({ length: STRIKES }, (_, index): PassNote => {
    const at = reading.fromSec + index * step
    const note = pitchOf(index, STRIKES)
    return {
      at,
      dur: Math.min(RINGS * step, reading.endSec - at),
      note,
      gain: gainAt(reading, note),
    }
  })
  return [...standingNotes(reading), ...strikes]
}

const fitsChord = (reading: Reading): string | null => {
  if (!reading.pitched) return REFUSALS.notNotes
  if (reading.shape === 'held') {
    return reading.upper.length >= 1 ? null : 'Needs two notes held, or more.'
  }
  return hasThreePitches(reading) ? null : REFUSALS.threePitches
}

const CHORD_NEEDS = 'A held note or chord, or a phrase of three pitches'
const OCTAVE_FAR = { words: 'Past half, the notes run on into the octave above.', default: 0.25 }

/** Lowest, highest, then inwards from both ends. */
function inwards(notes: readonly number[]): number[] {
  const out: number[] = []
  for (let low = 0, high = notes.length - 1; low <= high; low += 1, high -= 1) {
    out.push(notes[low])
    if (low < high) out.push(notes[high])
  }
  return out
}

export const ONE_AT_A_TIME: readonly Way[] = [
  {
    id: 'rising',
    name: 'Rising',
    family: 'one-at-a-time',
    words:
      'The notes of the chord one after another, low to high. Each turn starts one note further up. The note the sound stands on stays where it is.',
    needs: CHORD_NEEDS,
    far: OCTAVE_FAR,
    fits: fitsChord,
    play: (reading, { turn, far }: Turn) => {
      const notes = ladder(reading, far)
      return dealt(reading, (index) => notes[(index + turn) % notes.length])
    },
  },
  {
    id: 'there-and-back',
    name: 'There and back',
    family: 'one-at-a-time',
    words:
      'Up through the chord and down again, carried on from where the last turn stopped. The note the sound stands on stays where it is.',
    needs: CHORD_NEEDS,
    far: OCTAVE_FAR,
    fits: fitsChord,
    play: (reading, { turn, far }: Turn) => {
      const up = ladder(reading, far)
      const path = [...up, ...up.slice(1, -1).reverse()]
      return dealt(reading, (index, count) => {
        // Carried on: a turn starts where the one before stopped, and one further where that is the same place.
        const on = count % path.length === 0 ? 1 : count
        return path[(turn * on + index) % path.length]
      })
    },
  },
  {
    id: 'outside-in',
    name: 'Outside in',
    family: 'one-at-a-time',
    words:
      'The lowest note of the chord, then the highest, then inwards from both ends. Each turn starts one place further on. The note the sound stands on stays where it is.',
    needs: CHORD_NEEDS,
    far: OCTAVE_FAR,
    fits: fitsChord,
    play: (reading, { turn, far }: Turn) => {
      const notes = inwards(ladder(reading, far))
      return dealt(reading, (index) => notes[(index + turn) % notes.length])
    },
  },
  {
    id: 'carry-on',
    name: 'Carry on',
    family: 'one-at-a-time',
    words:
      'The phrase reads its own notes with the last left off, and carries on from turn to turn, so the same rhythm plays a line that comes round a note later each time.',
    needs: 'A phrase of three single notes',
    far: { words: 'Past half, two notes are left off.', default: 0.25 },
    fits: (reading) =>
      pitchedPhrase(reading) ??
      (singles(reading).length >= 3 ? null : 'Needs a phrase of three single notes.'),
    play: (reading, { turn, far }: Turn) => {
      const notes = line(reading)
      const off = far > 0.5 && notes.length >= 5 ? 2 : 1
      const kept = notes.length - off
      return repitched(reading, (index, count) => notes[(turn * count + index) % kept])
    },
  },
]
