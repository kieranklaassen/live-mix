// Hits and voices: notes the sound does not have, after a hit or beside a
// phrase. The written notes stay exactly as they are in all three ways, so
// the note the sound stands on and the attack it starts on are never dealt:
// a turn only says which notes are added, and where. An added note is never
// harder than a written one and never ahead of the attack, and in a sound
// that keeps time it falls where the sound's own notes could.

import { HIGHEST_NOTE } from '../vary'
import { PITCHES_NEEDS, fitsPitches, gainAt, gcd, line, pitchedPhrase } from './pass'
import { cents, tick } from './reading'
import { MOST_TAKES } from './takes'
import { type Moment, type PassNote, type Reading, type Turn, type Way } from './types'

// --- Echoes --------------------------------------------------------------------------

/** How hard a repeat is against the strike before it. */
const SOFTER = 0.6
/** How far apart the repeats of a turn are, as shares of the widest they may be. */
const SPACINGS = [1, 1 / 2, 3 / 4, 1 / 4]
/** A sound that keeps time is repeated whole sixteenths of its length apart. */
const DIVISIONS = 16

/**
 * The hit, and one to three softer repeats of all of it after it. The number
 * of repeats comes round every `most` turns and their spacing every 5 less
 * `most`, which have no factor in common: every number meets every spacing,
 * in four takes or six.
 *
 * The written note is often still down when a repeat strikes its key. Each
 * note of a phrase is pressed and lifted by a number of its own
 * (`phraseEvents` in ../../patch-render.ts), so the strike reaches the
 * instrument as one more key and none is lost. What becomes of the note that
 * rang is the instrument's to say: the felt piano lets its damper fall on it
 * and strikes again, a bass of one voice plays on from it, the others ring
 * both. Lifting a repeat at the next strike changes no render where a strike
 * is taken so, and elsewhere only stops a ring, so no key is lifted.
 */
function echoes(reading: Reading, { turn, far }: Turn): PassNote[] {
  const hit = reading.notes
  const struck = reading.moments[0].at
  const most = far > 2 / 3 ? 3 : far > 1 / 3 ? 2 : 1
  // The last repeat is struck by three tenths of the sound's length, and by seven tenths at a
  // `far` of 1: short of the three quarters past which `vary()` holds the notes a sound ends on.
  const latest = reading.passSec * (0.3 + 0.4 * far)
  const spacings = SPACINGS.slice(0, 5 - most)
  const count = 1 + (turn % most)
  let space = ((latest - struck) / most) * spacings[turn % spacings.length]
  if (reading.timed) {
    // Its tempo is not in the reading. A sound that keeps time and ends is whole bars long, so
    // sixteenths of its length are on its beat.
    const division = reading.passSec / DIVISIONS
    space = Math.floor(space / division + 1e-9) * division
  }
  // A hit too late in its sound to be repeated inside it is played as written.
  if (!(space > 0)) return [...hit]
  const repeats = Array.from({ length: count }, (_, index) =>
    hit.map((note): PassNote => {
      const at = note.at + (index + 1) * space
      return {
        at,
        // As long as the hit, or to the end of the sound: the take dies away inside its length.
        dur: Math.min(note.dur, reading.passSec - at),
        note: note.note,
        gain: note.gain * SOFTER ** (index + 1),
      }
    }),
  )
  return [...hit, ...repeats.flat()]
}

// --- Two readers ---------------------------------------------------------------------

/** The second voice joins every third moment of the phrase, from the third. */
const EVERY = 3

/**
 * How many notes of a line of `length` the second voice reads, `step` of
 * them a turn: all of it where that comes round within the takes a round may
 * have, and otherwise with as few of its last notes left off as bring it
 * round.
 */
function readOf(length: number, step: number): number {
  for (let read = length; read >= 2; read -= 1) {
    const round = read / gcd(read, step)
    if (round >= 2 && round <= MOST_TAKES) return read
  }
  return length
}

/**
 * The written phrase, and a second voice that reads its line a fifth higher
 * at every third moment. A moment that holds the note the sound stands on is
 * left as written, so the voice is silent there, and it never reads a note at
 * or under that one: the sound would stand on the voice.
 */
function twoReaders(reading: Reading, { turn, far, along }: Turn): PassNote[] {
  const notes = line(reading)
  const joined = reading.moments.filter((_, index) => index % EVERY === EVERY - 1)
  const floor = reading.standing ?? -Infinity
  const read = readOf(notes.length, joined.length)
  // Softer than the note it joins at any `far`: from three tenths as hard to nine tenths.
  const level = 0.3 + 0.6 * far
  const voice = joined.flatMap((moment, index): PassNote[] => {
    if (moment.standing) return []
    const [beside] = moment.notes
    // Carried on: a turn starts on the note after the last one the turn before read.
    const fifth = along(notes[(turn * joined.length + index) % read], 4)
    // An octave above is further out still: over the range, the fifth is taken an octave lower.
    const note = [fifth, fifth - 12].find((each) => each <= HIGHEST_NOTE && each > floor)
    if (note === undefined) return []
    // A key the moment already strikes cannot be struck twice at once: the voices are one there.
    if (moment.notes.some((each) => cents(each.note) === cents(note))) return []
    return [{ at: moment.at, dur: beside.dur, note, gain: beside.gain * level }]
  })
  return [...reading.notes, ...voice]
}

// --- In the gaps ---------------------------------------------------------------------

/** How many gaps the way goes round: as many as a round may have takes. */
const MOST_GAPS = MOST_TAKES

/** The stretch from one moment of a phrase to the next. */
interface Gap {
  from: Moment
  sec: number
  /** How far into it its note is struck. */
  into: number
}

/**
 * The gaps of a phrase, in time. A phrase played round has one more than a
 * phrase that ends: from its last moment round to its first, which is as wide
 * as a listener hears it, the start of the next pass included. Nothing is
 * added after the last note of a phrase that ends.
 *
 * A gap is filled in its middle. A sound that keeps time is filled on its own
 * grid: as many of its narrowest gaps on from the moment before as come
 * nearest the middle.
 */
function gapsOf(reading: Reading): Gap[] {
  const { moments } = reading
  const ends = moments.slice(1).map((moment) => moment.at)
  if (reading.shape === 'round') ends.push(reading.passSec + moments[0].at)
  const widths = ends.map((end, index) => end - moments[index].at)
  const narrowest = Math.min(...widths)
  return widths.map((sec, index) => ({
    from: moments[index],
    sec,
    into: reading.timed
      ? narrowest * Math.max(1, Math.round(tick(sec) / tick(narrowest) / 2))
      : sec / 2,
  }))
}

/**
 * The gaps a note may sound in: every gap wider than the narrowest whose note
 * falls inside the pass, widest first and the earlier first of two as wide,
 * eight at most. The gap round to the first moment of a phrase that starts
 * late is measured whole and filled only where its middle is before the pass
 * ends: a note laid past the end would come ahead of the phrase's attack.
 */
function widestOf(reading: Reading): Gap[] {
  const gaps = gapsOf(reading)
  const narrowest = tick(Math.min(...gaps.map((gap) => gap.sec)))
  return gaps
    .filter(
      (gap) => tick(gap.sec) > narrowest && tick(gap.from.at + gap.into) < tick(reading.passSec),
    )
    .sort((a, b) => tick(b.sec) - tick(a.sec))
    .slice(0, MOST_GAPS)
}

/** The written phrase, and a note of its chord in one of its widest gaps, or in two. */
function inTheGaps(reading: Reading, { turn, far }: Turn): PassNote[] {
  const gaps = widestOf(reading)
  // Two gaps of two would be the same two every turn.
  const filled = far > 0.5 && gaps.length >= 3 ? 2 : 1
  const notes = Array.from({ length: filled }, (_, index): PassNote => {
    const which = (turn + index) % gaps.length
    const { from, sec, into } = gaps[which]
    const at = from.at + into
    // The widest gap takes the lowest note of the chord above the standing note, the next the next.
    const note = reading.upper[which % reading.upper.length]
    return {
      at,
      // As long as the note before the gap, and lifted by the end of the gap and of the pass.
      dur: Math.min(from.notes[0].dur, sec - into, reading.passSec - at),
      note,
      gain: gainAt(reading, note),
    }
  })
  return [...reading.notes, ...notes]
}

export const VOICES: readonly Way[] = [
  {
    id: 'echoes',
    name: 'Echoes',
    family: 'voices',
    words:
      'One to three softer repeats of the hit after it, at its own pitch, each softer than the one before. How many there are and how far apart they come changes every turn. The hit itself stays as it is.',
    needs: 'One hit that ends',
    far: {
      words: 'How many repeats there may be, one to three, and how late the last may come.',
      default: 0.5,
    },
    fits: (reading) => {
      if (reading.shape !== 'ended' || reading.moments.length !== 1) {
        return 'Needs one hit that ends.'
      }
      // One key held on a sound that keeps time and is made of another sound: it reads that
      // sound's audio, and the key is how fast. A variant leaves it alone too (`vary()`). One
      // stroke of a kit that keeps time is a hit like any other.
      return reading.fromAudio && reading.timed ? 'Its one key reads other audio in time.' : null
    },
    play: echoes,
  },
  {
    id: 'two-readers',
    name: 'Two readers',
    family: 'voices',
    words:
      'A second, softer voice joins every third moment of the phrase. It reads the notes of the phrase in order, a fifth higher in the key, and carries on each turn from where it stopped. The written notes stay as they are, and it keeps out of the moments that hold the lowest note.',
    needs: PITCHES_NEEDS,
    far: {
      words:
        'How soft the second voice is: the further, the less soft, and never as hard as the note it joins.',
      default: 0.5,
    },
    fits: fitsPitches,
    play: twoReaders,
  },
  {
    id: 'in-the-gaps',
    name: 'In the gaps',
    family: 'voices',
    words:
      'The phrase stays as written. A note of its chord sounds in one of its widest gaps, a different gap each turn.',
    needs: 'A phrase with rests',
    far: { words: 'Past half, two gaps are filled each turn.', default: 0.25 },
    fits: (reading) => {
      const refusal = pitchedPhrase(reading)
      if (refusal !== null) return refusal
      if (widestOf(reading).length === 0) return 'Needs a phrase with rests.'
      return reading.upper.length > 0 ? null : 'Needs a phrase of two pitches.'
    },
    play: inTheGaps,
  },
]
