// Growth: a phrase that gathers, or moves a little further each turn and
// comes home. Gather changes only which moments sound, so it plays a beat and
// a sound made of another sound's audio as it plays a phrase. The other three
// change which pitch sounds on a moment and leave every moment where it is:
// One note slips moves notes along the key, one more each turn, and Climb and
// Lean deal the chord the phrase already has.

import { HIGHEST_NOTE, LOWEST_NOTE, mod } from '../vary'
import {
  PHRASE_NEEDS,
  PITCHES_NEEDS,
  fitsPhrase,
  fitsPitches,
  line,
  repitched,
  resting,
  singles,
  upperPlace,
} from './pass'
import { type PassNote, type Reading, type Turn, type Way } from './types'

/** How many steps Gather takes to the whole phrase. */
const STEPS = 4
/** How many notes have slipped before the round comes home. */
const SLIPS = 4

/** What One note slips draws from, so no two of its draws are the same one. */
const ORDER = 1
const UPWARD = 2

const HOME_FAR = {
  words: 'How many turns before it comes home: two, three or, at its furthest, four.',
  default: 1,
}

/** The notes that slip, in the order they do, each with the pitch it slips to. */
function slipping(reading: Reading, { far, draw, along }: Turn): [PassNote, number][] {
  const floor = reading.standing ?? LOWEST_NOTE
  const steps = far > 0.5 ? 2 : 1
  const inReach = (note: number): boolean =>
    note > floor && note >= LOWEST_NOTE && note <= HIGHEST_NOTE
  // Drawn without the turn: what one turn has moved, the next still has.
  return singles(reading)
    .filter((moment) => moment !== reading.moments[0])
    .map((moment, index) => {
      const note = moment.notes[0]
      // The way it is drawn to go, or the other way where that is out of reach.
      const drawn = draw(UPWARD, index) < 0.5 ? steps : -steps
      const to = [along(note.note, drawn), along(note.note, -drawn)].find(inReach)
      return { note, to, place: draw(ORDER, index) }
    })
    .sort((a, b) => a.place - b.place)
    .flatMap(({ note, to }): [PassNote, number][] => (to === undefined ? [] : [[note, to]]))
}

/** How many turns before Climb and Lean come home: two to four. */
const homeAfter = (far: number): number => 2 + Math.min(2, Math.floor(far * 3))

/** The note `by` notes further up the chord above the standing note, from its top round to its bottom. */
function higher(reading: Reading, note: number, by: number): number {
  const { upper } = reading
  return upper[(upperPlace(reading, note) + by) % upper.length]
}

export const GROWTH: readonly Way[] = [
  {
    id: 'gather',
    name: 'Gather',
    family: 'growth',
    words:
      "A quarter of the phrase's moments, then half, then three quarters, then all of it, one step a turn. The first moment always sounds, and so does every moment that holds the note the sound stands on.",
    needs: PHRASE_NEEDS,
    far: {
      words: 'Where it starts: a quarter of the phrase, or past half one moment.',
      default: 0.25,
    },
    fits: fitsPhrase,
    play: (reading, { turn, far }: Turn) => {
      const step = turn % STEPS
      const all = reading.moments.length
      const sounding = step === 0 && far > 0.5 ? 1 : Math.ceil((all * (step + 1)) / STEPS)
      return resting(reading, (place) => place >= sounding)
    },
  },
  {
    id: 'one-note-slips',
    name: 'One note slips',
    family: 'growth',
    words:
      'Each turn one more note has moved to its neighbour in the key, and stays there on the turns after. After four the phrase is as written again. The first note and the note the sound stands on never move.',
    needs: PITCHES_NEEDS,
    far: { words: 'How far a note slips: a step, or past half a third.', default: 0.25 },
    fits: fitsPitches,
    play: (reading, turn: Turn) => {
      const slips = slipping(reading, turn)
      const slipped = new Map(slips.slice(0, turn.turn % (Math.min(SLIPS, slips.length) + 1)))
      return reading.notes.map((note) => {
        const to = slipped.get(note)
        return to === undefined ? note : { ...note, note: to }
      })
    },
  },
  {
    id: 'climb',
    name: 'Climb',
    family: 'growth',
    words:
      'Every note above the note the sound stands on sits one note of the chord higher each turn, from the top of the chord round to the bottom, and comes home after four turns.',
    needs: PITCHES_NEEDS,
    far: HOME_FAR,
    fits: fitsPitches,
    play: (reading, { turn, far }: Turn) => {
      const up = turn % homeAfter(far)
      const written = line(reading)
      return repitched(reading, (index) => higher(reading, written[index], up))
    },
  },
  {
    id: 'lean',
    name: 'Lean',
    family: 'growth',
    words:
      'Each note is played one moment later and one note of the chord higher each turn, so the line leans across its own rhythm. The moments keep their times, lengths and touch. It comes home after four turns.',
    needs: PITCHES_NEEDS,
    far: HOME_FAR,
    fits: fitsPitches,
    play: (reading, { turn, far }: Turn) => {
      const on = turn % homeAfter(far)
      const written = line(reading)
      return repitched(reading, (index, count) =>
        // The moment `on` places back gives this one its note: every note is `on` moments later.
        higher(reading, written[mod(index - on, count)], on),
      )
    },
  },
]
