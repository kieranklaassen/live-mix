// What a way of playing is made of: the row a host lists, the reading of a
// sound a rule works on, and the pass of notes a rule gives back. The rules
// themselves are the files beside this one, a family each.

import { type FactoryKey } from '../key'

/** The families a host lists ways under, in menu order. */
export const WAY_FAMILIES = [
  { id: 'one-at-a-time', name: 'One at a time' },
  { id: 'counting', name: 'Counting' },
  { id: 'growth', name: 'Growth' },
  { id: 'trades', name: 'Trades' },
  { id: 'held', name: 'Held' },
  { id: 'voices', name: 'Hits and voices' },
] as const

export type WayFamily = (typeof WAY_FAMILIES)[number]['id']

/** One way of playing as a host lists it. */
export interface WayRow {
  /** Stable id: a host that keeps it has kept the way. */
  id: string
  /** At most 24 characters. */
  name: string
  family: WayFamily
  /** What it does, in at most 300 characters. */
  words: string
  /** What it needs of a sound, in a few words. */
  needs: string
  /** What `far` changes, and where it stands when a host names none. */
  far: { words: string; default: number }
}

/** Which way a sound is played, and which take of it. */
export interface WayPlaying {
  /** The id of a row of `WAYS`. */
  way: string
  /** Any whole number: with the way and `far` it decides every take. */
  seed: number
  /** 0 to 1: what it changes is the row's to say. Absent, the row's own. */
  far?: number
  /** Which take, from 0. One past the last is the first again. */
  take?: number
  /**
   * The key the sound is in, for one that is not written on the white keys
   * (a generated sound, a sound a host made). Absent, the white keys.
   */
  key?: FactoryKey
}

/** The takes a way gives on a sound, or why it gives none. */
export interface WayTakes {
  /** How many different takes there are: 2 to 8, or 0 where the way has nothing to play. */
  takes: number
  /**
   * The order the way itself plays its takes in, as take numbers: one for
   * each turn until the turns come round. A take may be named more than once.
   */
  round: readonly number[]
  /**
   * The round is not the whole of what the way plays: it was cut at eight
   * takes, or it does not come round in the turns a way is asked for. Its
   * last take does not lead back into its first.
   */
  cut: boolean
  /** Why there is nothing to play, in a few words. Only where `takes` is 0. */
  refusal?: string
}

/** What a take does to its sound, in notes of one pass. */
export interface TakeChanges {
  /** How many notes the take plays. */
  sounding: number
  /** How many of the sound's notes it does not play. */
  resting: number
  /** How many notes are where one was written, at another pitch. */
  moved: number
  /** How many notes are at a written pitch, at another time. */
  shifted: number
  /** How many notes the sound does not have at all. */
  added: number
}

/** How a sound is laid out in time. */
export type SoundShape =
  /** A chord held through everything that is rendered. */
  | 'held'
  /** One pass played again for every pass that is rendered. */
  | 'round'
  /** A phrase that ends inside the sound's length. */
  | 'ended'
  /** Played round with passes that are not one pass repeated: no way plays it. */
  | 'irregular'

/** A note of one pass: seconds from the start of the pass, and how hard. */
export interface PassNote {
  at: number
  dur: number
  note: number
  gain: number
}

/** The notes of a pass that are struck together. */
export interface Moment {
  at: number
  notes: readonly PassNote[]
  /** One of its notes is the note the sound stands on: every way leaves it as written. */
  standing: boolean
}

/** A sound as a rule reads it. */
export interface Reading {
  shape: SoundShape
  /**
   * One pass, in the order it is written, with the notes the sound was lent
   * after them: what a rule reads as the sound's notes.
   */
  notes: readonly PassNote[]
  /**
   * The notes of `notes` the sound does not have. A held sound of one note
   * or two has no chord to deal, so it is lent notes of its key above the
   * note it stands on, until three are above it (`lend`, ./reading.ts).
   * Each is written as the standing note is, and a rule holds, strikes and
   * rests it as it does the sound's own. None where the sound has a chord of
   * its own, and none for a phrase.
   */
  lent: readonly PassNote[]
  /** The same notes by the moment they are struck at, earliest first. */
  moments: readonly Moment[]
  /** The sound's own pitches, low to high. */
  chord: readonly number[]
  /** The note the sound stands on: its lowest. None where its keys are not pitches. */
  standing: number | null
  /** The chord above the note the sound stands on. */
  upper: readonly number[]
  /** Its keys are pitches: not drums, and not how far another sound's audio is moved. */
  pitched: boolean
  /** It is made of another sound: its keys are how far that sound's audio is moved. */
  fromAudio: boolean
  /** It keeps time: it has a tempo of its own. */
  timed: boolean
  /** The length of a pass, seconds. */
  passSec: number
  /**
   * Where in a pass a way may strike a note the sound does not have. A held
   * chord takes one from a crossfade's length into the loop, so that no
   * attack lies under the fold, to the loop's end; a phrase anywhere from
   * its first note to its last.
   */
  fromSec: number
  toSec: number
  /** Where the render stops: a note held to here is held through everything. */
  endSec: number
}

/** What a rule is asked for: one turn. */
export interface Turn {
  /** Which turn, from 0. A rule that carries on across turns works out where it is from this. */
  turn: number
  /** 0 to 1. */
  far: number
  /**
   * 0 up to 1, the same for the same seed, way and `of`. A rule that wants a
   * draw of its own for each turn names the turn in `of`; one whose turns
   * build on each other leaves it out, so what one turn drew the next still has.
   */
  draw: (...of: number[]) => number
  /** A note `steps` along the sound's key. */
  along: (note: number, steps: number) => number
}

/** A row with its rule. */
export interface Way extends WayRow {
  /** Null where the way can be asked of this sound, or why it cannot, in a few words. */
  fits: (reading: Reading) => string | null
  /** One pass of notes for one turn. Never none. */
  play: (reading: Reading, turn: Turn) => PassNote[]
}
