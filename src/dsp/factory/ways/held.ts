// Held: the notes above the one a held chord stands on, coming in and going
// out. A held sound of one note or two is read with the notes it was lent
// (`lend`, ./reading.ts), so it has a chord here as well. The standing note
// is the written note untouched. A note that is
// struck where the sound does not strike it is struck inside the window a
// held chord gives (from a crossfade's length into the loop to the loop's
// end) and stays down to the end the written note has, past everything that
// is rendered, as the written chord does.

import { mod } from '../vary'
import { REFUSALS, gcd, standingNotes } from './pass'
import { MOST_TAKES } from './takes'
import { type PassNote, type Reading, type Turn, type Way } from './types'

/** Staggered entries: the share of the window the entries take at `far` 0. At 1 they take all of it. */
const LEAST_ENTRIES = 0.25
/** Voices come and go: how far through the window the trade is, at `far` 0 and at 1. */
const TRADE = { earliest: 0.1, latest: 0.9 } as const
/** Unequal rounds: how many times the longest count the finest grid is, where the round comes back and where it cannot. */
const FINEST = { back: 5, cut: 3 } as const

const fitsHeld = (reading: Reading): string | null => {
  if (!reading.pitched) return REFUSALS.notNotes
  if (reading.shape !== 'held') return REFUSALS.notHeld
  return reading.upper.length >= 2 ? null : 'Needs three notes held, or more.'
}

const HELD_NEEDS = 'A held note or chord'

/** The written notes above the standing note, low to high. */
function voices(reading: Reading): PassNote[] {
  const standing = standingNotes(reading)
  return reading.notes.filter((note) => !standing.includes(note)).sort((a, b) => a.note - b.note)
}

/** `note` struck at `at` and held to the end it is written to. */
const entering = (note: PassNote, at: number): PassNote => ({
  ...note,
  at,
  dur: note.at + note.dur - at,
})

/** A count for each of `voices` notes, shortest first, no two with a factor in common. */
function countsFor(voices: number): number[] {
  const counts: number[] = []
  for (let count = 2; counts.length < voices; count += 1) {
    if (counts.every((each) => gcd(each, count) === 1)) counts.push(count)
  }
  return counts
}

/**
 * The grids Unequal rounds may count on, coarsest first, as places in the
 * window. Every count goes into a grid twice at the least, so each note is
 * struck more than once in a pass. A count that divides the grid starts every
 * turn on the same place, and one that does not comes back after as many
 * turns as it has left over, so the round is as long as those counts
 * multiplied: the grids kept are the ones whose round is two takes to eight.
 * Five notes and more have no such grid, and take the coarser ones.
 */
function grids(counts: readonly number[]): number[] {
  const longest = counts[counts.length - 1]
  const turns = (grid: number): number =>
    counts.reduce((all, count) => (all * count) / gcd(grid, count), 1)
  const upTo = (times: number): number[] =>
    Array.from({ length: longest * (times - 2) + 1 }, (_, index) => 2 * longest + index)
  const back = upTo(FINEST.back).filter((grid) => turns(grid) >= 2 && turns(grid) <= MOST_TAKES)
  return back.length > 0 ? back : upTo(FINEST.cut).filter((grid) => turns(grid) >= 2)
}

export const HELD: readonly Way[] = [
  {
    id: 'staggered-entries',
    name: 'Staggered entries',
    family: 'held',
    words:
      'The note the chord stands on holds, and the notes above it come in one at a time through the pass, each held from where it enters. The order they enter in moves round by one each turn.',
    needs: HELD_NEEDS,
    far: { words: 'How much of the pass the entries take.', default: 0.5 },
    fits: fitsHeld,
    play: (reading, { turn, far }: Turn) => {
      const upper = voices(reading)
      const span = (reading.toSec - reading.fromSec) * (LEAST_ENTRIES + far * (1 - LEAST_ENTRIES))
      const entries = upper.map((_, place) =>
        entering(
          upper[(place + turn) % upper.length],
          reading.fromSec + (span * place) / upper.length,
        ),
      )
      return [...standingNotes(reading), ...entries]
    },
  },
  {
    id: 'voices-come-and-go',
    name: 'Voices come and go',
    family: 'held',
    words:
      'One note above the one the chord stands on leaves part way through the pass, and the note that left last turn comes back as it goes. The rest hold. The top note leaves first, then the next one down.',
    needs: HELD_NEEDS,
    far: { words: 'When in the pass they trade.', default: 0.5 },
    fits: fitsHeld,
    play: (reading, { turn, far }: Turn) => {
      const upper = voices(reading)
      // Which note leaves on a turn, from the top down; the turn before the first is the last of the round.
      const leaving = (on: number): PassNote => upper[upper.length - 1 - mod(on, upper.length)]
      const goes = leaving(turn)
      const comes = leaving(turn - 1)
      const through = TRADE.earliest + far * (TRADE.latest - TRADE.earliest)
      const at = reading.fromSec + (reading.toSec - reading.fromSec) * through
      return reading.notes.map((note) => {
        if (note === goes) return { ...note, dur: at - note.at }
        return note === comes ? entering(note, at) : note
      })
    },
  },
  {
    id: 'unequal-rounds',
    name: 'Unequal rounds',
    family: 'held',
    words:
      'Each note above the one the chord stands on is struck again at a count of its own, the top note the shortest, and no two counts have a factor in common. The counts carry on from turn to turn, so the notes fall together differently each time.',
    needs: HELD_NEEDS,
    far: { words: 'How fine the grid they count on is.', default: 0.25 },
    fits: fitsHeld,
    play: (reading, { turn, far }: Turn) => {
      const upper = voices(reading)
      const counts = countsFor(upper.length)
      const fine = grids(counts)
      const grid = fine[Math.min(fine.length - 1, Math.floor(far * fine.length))]
      const step = (reading.toSec - reading.fromSec) / grid
      const struck = upper.flatMap((note, voice) => {
        const count = counts[upper.length - 1 - voice]
        const strikes: number[] = []
        for (let place = 0; place < grid; place += 1) {
          if ((turn * grid + place) % count === 0) strikes.push(reading.fromSec + place * step)
        }
        // Held as written to its first strike, each strike to the next, the last to the written end.
        const ends = [...strikes.slice(1), note.at + note.dur]
        return [
          { ...note, dur: strikes[0] - note.at },
          ...strikes.map((at, index) => ({ ...note, at, dur: ends[index] - at })),
        ]
      })
      return [...standingNotes(reading), ...struck]
    },
  },
]
