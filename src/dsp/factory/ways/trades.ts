// Trades: notes of a phrase that change places. Both ways deal pitches only,
// over the moments that hold one note and not the note the sound stands on,
// so a phrase keeps its rhythm, its lengths and its touch, and every moment
// that holds the standing note is as written.

import {
  PITCHES_NEEDS,
  REFUSALS,
  line,
  pitchedPhrase,
  repitched,
  singles,
  upperPlace,
} from './pass'
import { type Reading, type Turn, type Way } from './types'

/** The fewest and the most turns Neighbours swap takes to come home. */
const HOME_TURNS = { fewest: 4, most: 8 } as const

/** Where the pairs start: the first note of a pass is in no pair, whether it is dealt or not. */
const firstPair = (reading: Reading): number => (singles(reading)[0] === reading.moments[0] ? 1 : 0)

/**
 * `notes` after `rounds` rounds of swaps. A round swaps every second pair of
 * neighbours, the pairs starting on the note at `first` and then the pairs
 * starting one note later, by turns, so a note keeps walking the way it set
 * out until it meets an end.
 */
function swapped(notes: readonly number[], rounds: number, first: number): number[] {
  const out = [...notes]
  for (let round = 0; round < rounds; round += 1) {
    for (let low = first + (round % 2); low + 1 < out.length; low += 2) {
      ;[out[low], out[low + 1]] = [out[low + 1], out[low]]
    }
  }
  return out
}

/** The note of the sound's upper chord as far from its top as `note` is from its bottom. */
function mirrored(reading: Reading, note: number): number {
  const { upper } = reading
  const place = upperPlace(reading, note)
  return place < 0 ? note : upper[upper.length - 1 - place]
}

export const TRADES: readonly Way[] = [
  {
    id: 'neighbours-swap',
    name: 'Neighbours swap',
    family: 'trades',
    words:
      'Neighbouring notes of the phrase change places each turn, one set of pairs and then the other, so the notes walk through each other. Each turn builds on the last. The first note of the phrase and the note the sound stands on stay where they are.',
    needs: 'A phrase of four single notes',
    far: { words: 'How many turns before it comes home: four to eight.', default: 0.5 },
    fits: (reading) =>
      pitchedPhrase(reading) ??
      (singles(reading).length >= 4 ? null : 'Needs a phrase of four single notes.'),
    play: (reading, { turn, far }: Turn) => {
      const home = HOME_TURNS.fewest + Math.round(far * (HOME_TURNS.most - HOME_TURNS.fewest))
      const notes = swapped(line(reading), turn % home, firstPair(reading))
      return repitched(reading, (index) => notes[index])
    },
  },
  {
    id: 'home-and-away',
    name: 'Home and away',
    family: 'trades',
    words:
      'Three turns as written, then one upside down within its own chord: a note that is so far from the bottom of the chord plays the note that far from the top. The rhythm and the note the sound stands on stay.',
    needs: PITCHES_NEEDS,
    far: { words: 'Past half, one turn at home for each turn away, not three.', default: 0.25 },
    fits: (reading) =>
      pitchedPhrase(reading) ??
      (singles(reading).length >= 1 && reading.upper.length >= 2 ? null : REFUSALS.threePitches),
    play: (reading, { turn, far }: Turn) => {
      const round = far > 0.5 ? 2 : 4
      if (turn % round !== round - 1) return [...reading.notes]
      const notes = line(reading).map((note) => mirrored(reading, note))
      return repitched(reading, (index) => notes[index])
    },
  },
]
