// Rule of the Octave: a bass is played, and the upper voices that belong on
// it follow. Every step of the scale has one chord when the bass came to it
// from below and another when it came from above. Rising in C: C, G7/D, C/E,
// Dm7/F, G, F/A, G7/B, C. Falling: C, G/B, D7/A, G, G7/F, C/E, G7/D, C. The
// F sharp of D7, and the raised seventh of a minor key, are written only
// under the full rule; in the key, the sixth step falling has its own triad.
//
// The voices go to the notes of the new chord by the shortest way: a note the
// two chords share stays where it is and is not struck again, and no two
// voices, the bass among them, move in fifths or octaves together where that
// can be helped.
//
// The lowest held key is the bass. Keys above it are not harmonised: they
// are played as they come, kept on top as a tune, or left out.

import { classNear, degreeClass, indexOf, inKey, mod, snapNote, triadOn } from './key'
import {
  HIGHEST_NOTE,
  MakerBase,
  foldNote,
  type HeldNote,
  type MadeNote,
  type TaskHandle,
} from './base'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

const PARAMS = {
  rule: {
    id: 0,
    name: 'Rule',
    min: 0,
    max: 4,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['In the key', 'Full rule', 'Triads', 'Sevenths', 'Sixths'],
    description:
      'The chord on each step: the old rule inside the key, the full rule with its notes outside the key, or a triad, a seventh or a sixth chord on every step.',
  },
  turn: {
    id: 1,
    name: 'Direction',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['As played', 'Rising', 'Falling'],
    description:
      'Which chord a step has in the first two rules: by whether the bass rose or fell to it, always the rising one, or always the falling one.',
  },
  voices: {
    id: 2,
    name: 'Voices',
    min: 2,
    max: 4,
    default: 3,
    taper: 'linear',
    unit: '',
    step: 1,
    description: 'How many upper voices there are over the bass.',
  },
  spacing: {
    id: 3,
    name: 'Spacing',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Close', 'Half open', 'Open', 'Wide'],
    description:
      'How far apart neighbouring upper voices lie: a fourth or less, about a fifth, about a sixth as strings are laid, or about an octave.',
  },
  height: {
    id: 4,
    name: 'Height',
    min: -12,
    max: 24,
    default: 7,
    taper: 'linear',
    unit: 'st',
    step: 1,
    description:
      "Where the upper voices lie, from the key's middle root to their middle. They stay above the bass, so a high bass lifts them.",
  },
  keys: {
    id: 5,
    name: 'Keys above',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Play', 'Tune on top', 'Silent'],
    description:
      'What held keys above the bass do: sound beside the voices, sound as a tune that the voices stay under and that outlasts the bass, or sound only as the bass.',
  },
  hold: {
    id: 6,
    name: 'Shared notes',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Held', 'Restruck'],
    description:
      'Whether a note that two chords share is held through the change or struck again with the new chord.',
  },
  delay: {
    id: 7,
    name: 'Late',
    min: 0,
    max: 4,
    default: 0,
    taper: 'linear',
    unit: 's',
    description:
      'How long the upper voices come after the bass. The old chord stays until then, so it is suspended over the new bass.',
  },
  strum: {
    id: 8,
    name: 'Spread',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: 's',
    description:
      'The time from the lowest upper voice to the highest. Each voice leaves its old note when its new one comes.',
  },
  sustain: {
    id: 9,
    name: 'Sustain',
    min: 0.05,
    max: 8,
    default: 0.4,
    taper: 'log',
    unit: 's',
    description:
      'How long the upper voices ring after the last key is let go. A bass played within that time takes them over.',
  },
  linger: {
    id: 10,
    name: 'Linger',
    min: 0,
    max: 4,
    default: 0,
    taper: 'linear',
    unit: 's',
    description:
      'How long a note that a voice leaves rings on into the next chord. At zero a voice has one note at a time.',
  },
  level: {
    id: 11,
    name: 'Level',
    min: 0.05,
    max: 1,
    default: 0.6,
    taper: 'linear',
    unit: '',
    description: 'How hard the upper voices are played, as a share of the bass.',
  },
} as const satisfies NoteMakerDescriptor['params']

const FULL = 1
const TRIADS = 2
const SEVENTHS = 3
const SIXTHS = 4
const TUNE = 1
const SILENT = 2

/** Keys pressed within this are one chord, and only its lowest is a bass. */
const GATHER_SEC = 0.03
/** The bass let go with other keys held: the rest of the hand has this long to go with it. */
const LET_GO_SEC = 0.05

/** The least and the most two neighbouring voices are apart, by `spacing`, in semitones. */
const GAPS = [
  [1, 5],
  [4, 8],
  [7, 10],
  [10, 14],
] as const

/** About half of what the voices span, by `spacing`: how far their middle is over a high bass. */
const HALF_SPAN = [5, 8, 11, 13] as const

/** The upper voices of one chord as pitch classes: what it needs, first things first, and what may be doubled. */
export interface FiguredChord {
  need: readonly number[]
  double: readonly number[]
  /** What two voices can have of it as well, where that lets them move less. */
  two?: readonly number[]
}

/**
 * The chord over `bass`. `rising` is whether the bass came to it from below;
 * null, it came from nowhere and a phrase begins on a chord of its own. Written
 * in the steps of a seven-note scale; in any other scale a step has the triad of
 * its own scale.
 */
export function chordOver(
  key: MakerKey,
  bass: number,
  rule: number,
  rising: boolean | null,
): FiguredChord {
  const note = Math.round(bass)
  if (!inKey(key, note)) {
    // A note outside the key leads up to the step over it: a dominant in its first turn.
    const classes = [note + 8, note + 6, note + 3].map((upper) =>
      mod(rule === FULL ? upper : snapNote(key, upper), 12),
    )
    const need = [...new Set(classes)].filter((upper) => upper !== mod(note, 12))
    return { need, double: need }
  }
  const size = key.steps.length
  const degree = mod(indexOf(key, note), size)
  const [root, third, fifth] = triadOn(key, degree)
  const triad: FiguredChord = {
    need: distinct([third, fifth, root]),
    double: distinct([root, fifth]),
    two: [third, root],
  }
  if (rule === SEVENTHS) {
    const seventh = seventhOn(key, degree)
    return { need: distinct([third, seventh, fifth, root]), double: [root, fifth] }
  }
  if (rule === SIXTHS) {
    if (size === 7) {
      const under = degreeClass(key, degree + 5)
      const over = degreeClass(key, degree + 2)
      return { need: [under, over], double: [under, over, root] }
    }
    for (let down = 1; down < size; down += 1) {
      const [low, middle, high] = triadOn(key, degree - down)
      if (middle === root && low !== root && high !== root)
        return { need: [low, high], double: [low, high, root] }
    }
    return triad
  }
  if (rule === TRIADS || size !== 7) return triad

  const step = (n: number): number => degreeClass(key, n - 1)
  const perfect = mod(fifth - root, 12) === 7
  if (rising === null && perfect && [1, 3, 5].includes(degree)) return triad
  // The seventh of a minor key is raised where it is the third of the dominant.
  const raised = rule === FULL && key.steps[4] === 7 && key.steps[6] === 10
  const leading = raised ? mod(key.root + 11, 12) : step(7)
  switch (degree + 1) {
    case 2:
      return { need: [leading, step(4), step(5)], double: [step(5), step(2)] }
    case 3:
      return { need: [step(1), step(5)], double: [step(1), step(5), step(3)] }
    case 4:
      return rising !== false
        ? { need: [step(2), step(6), step(1)], double: [step(2), step(6)] }
        : { need: [leading, step(2), step(5)], double: [step(5), step(2)] }
    case 5:
      return { need: [leading, step(2), step(5)], double: [step(5), step(2)] }
    case 6:
      if (rising !== false) return { need: [step(4), step(1)], double: [step(4), step(1), step(6)] }
      // The major sixth falls to the fifth under the fifth's own dominant.
      if (rule === FULL && key.steps[5] === 9)
        return {
          need: [mod(key.root + 6, 12), step(1), step(2)],
          double: [step(2), step(6)],
        }
      return triad
    case 7:
      return rising === true
        ? { need: [step(5), step(4), step(2)], double: [step(5), step(2)] }
        : { need: [step(5), step(2)], double: [step(5), step(2)] }
    default:
      return triad
  }
}

function distinct(classes: readonly number[]): number[] {
  return [...new Set(classes)]
}

/** The seventh over a degree: the key's note nearest to a minor or a major one that its triad lacks. */
function seventhOn(key: MakerKey, degree: number): number {
  if (key.steps.length === 7) return degreeClass(key, degree + 6)
  const triad = triadOn(key, degree)
  let best = triad[0]
  let distance = Infinity
  for (let i = 1; i < key.steps.length; i += 1) {
    const pitchClass = degreeClass(key, degree + i)
    if (triad.includes(pitchClass)) continue
    const over = mod(pitchClass - triad[0], 12)
    const away = Math.min(Math.abs(over - 10), Math.abs(over - 11) + 0.1)
    if (away < distance) {
      best = pitchClass
      distance = away
    }
  }
  return best
}

/** What the voices are led by from one chord to the next. */
export interface Leading {
  bass: number
  voices: number
  spacing: number
  /** Where the middle of the voices lies. */
  home: number
  /** Under this a voice keeps a fifth from the bass where it can. */
  thick: number
  /** Every voice stays under it. */
  under: number
  /** Notes that sound already under other hands. */
  taken: readonly number[]
  /** The voices and the bass from before. */
  from: readonly number[]
  fromBass: number
  /** How much it counts that a voice stays near its note. */
  still: number
  /** The pitch class a semitone under the root, when the chord before had it. */
  leading: number | null
}

/** The notes of `chord` the voices go to, from low to high; fewer than asked when there is no room. */
export function leadVoices(chord: FiguredChord, how: Leading): number[] {
  for (let count = how.voices; count >= 1; count -= 1) {
    let best: number[] | null = null
    let least = Infinity
    for (const [classes, doubled] of shares(chord, count)) {
      for (const voicing of voicings(classes, how)) {
        const cost = doubled + costOf(voicing, how)
        if (cost < least - 1e-6) {
          best = voicing
          least = cost
        }
      }
    }
    if (best) return best
  }
  return []
}

/** The ways `count` voices can share the notes of a chord, with what each doubling costs. */
function shares(chord: FiguredChord, count: number): [readonly number[], number][] {
  const { need, double } = chord
  let rows: [readonly number[], number][] = [[need.slice(0, count), 0]]
  if (count === 2 && chord.two) rows.push([chord.two, 3])
  const missing = count - Math.min(count, need.length)
  for (let i = 0; i < missing; i += 1) {
    rows = rows.flatMap(([classes, cost]) =>
      double.map((pitchClass, rank): [readonly number[], number] => [
        [...classes, pitchClass],
        cost + rank * 1.5,
      ]),
    )
  }
  return rows
}

/** Every way of laying the classes out, as rising notes with no note twice. */
function voicings(classes: readonly number[], how: Leading): number[][] {
  const low = Math.max(how.bass + 3, how.home - 22)
  const high = Math.min(how.under - 1, how.home + 22, HIGHEST_NOTE)
  const places = classes.map((pitchClass) => {
    const notes: number[] = []
    for (let note = low + mod(pitchClass - low, 12); note <= high; note += 12) notes.push(note)
    return notes
  })
  let rows: number[][] = [[]]
  for (const notes of places) {
    rows = rows.flatMap((row) =>
      notes.filter((note) => !row.includes(note)).map((note) => [...row, note]),
    )
  }
  const seen = new Set<string>()
  const out: number[][] = []
  for (const row of rows) {
    const sorted = row.sort((a, b) => a - b)
    const name = sorted.join()
    if (seen.has(name)) continue
    seen.add(name)
    out.push(sorted)
  }
  return out
}

function costOf(notes: readonly number[], how: Leading): number {
  let cost = 0
  const [least, most] = GAPS[how.spacing]
  for (let i = 1; i < notes.length; i += 1) {
    const gap = notes[i] - notes[i - 1]
    if (gap > most) cost += 2 * (gap - most)
    if (gap < least) cost += 2 * (least - gap)
  }
  // Low down a voice near the bass is thick.
  if (notes[0] < how.thick) cost += Math.max(0, how.bass + 7 - notes[0])
  // Whole numbers from the home note, so that it comes out the same in every key.
  const away = Math.abs(notes.reduce((sum, note) => sum + (note - how.home), 0)) / notes.length
  cost += 0.5 * away + 2 * Math.max(0, away - 4)
  for (const note of notes) if (how.taken.includes(note)) cost += 4
  if (how.from.length === 0) return cost

  const pairs = matched(how.from, notes)
  for (const [from, to] of pairs) {
    // A leap is worse than as many steps.
    const far = Math.abs(to - from)
    cost += how.still * (far + Math.max(0, far - 4))
    if (how.leading !== null && mod(from, 12) === how.leading) {
      const rise = to - from
      if (rise !== 0 && rise !== 1) cost += 3
    }
  }
  const all: [number, number][] = [[how.fromBass, how.bass], ...pairs]
  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) {
      const [low, high] = [all[i], all[j]]
      if (low[0] === low[1] || high[0] === high[1]) continue
      const before = mod(high[0] - low[0], 12)
      const after = mod(high[1] - low[1], 12)
      if (before === after && (after === 0 || after === 7)) cost += 40
    }
  }
  return cost
}

/** Which old note goes to which new one: in order, and the odd ones to or from the nearest. */
function matched(from: readonly number[], to: readonly number[]): [number, number][] {
  if (from.length === to.length) return to.map((note, i) => [from[i], note])
  return to.map((note) => [
    from.reduce((a, b) => (Math.abs(b - note) < Math.abs(a - note) ? b : a)),
    note,
  ])
}

/** One upper voice on one note. */
interface Voice {
  note: number
  made: MadeNote | null
  /** Set while it is still to come. */
  begin: TaskHandle | null
  /** When it comes, or came. */
  dueSec: number
  /** When it has to have come, however often the bass moves on before. */
  bySec: number
  /** The notes it takes over from when it comes. */
  before: Voice[]
  /** Set once it is let go and rings on. */
  ends: TaskHandle | null
}

interface Bass {
  note: number
  gain: number
  rising: boolean | null
}

class RuleOfTheOctave extends MakerBase {
  /** What the keys themselves sound. */
  private readonly own = new Map<number, MadeNote>()
  /** The key that is the bass; null once it is let go. */
  private bassKey: HeldNote | null = null
  /** The keys that were held with a lower one: part of a chord, and no bass for being short. */
  private readonly covered = new WeakSet<HeldNote>()
  private lastNote: number | null = null
  /** No key has been the bass since the hand was last up. */
  private rested = true
  /** When the bass was last let go. */
  private bassUpSec = 0
  /** Null until the bass has moved. */
  private rising: boolean | null = null
  private pending: { atSec: number; task: TaskHandle } | null = null

  // The hand of the upper voices, which can be later than the keys.
  private asked = 0
  private done = 0
  private bass: Bass | null = null
  private down = false
  private upper: Voice[] = []
  private readonly tails = new Set<Voice>()
  private from: readonly number[] = []
  private fromBass = 0
  private fromUnder = Infinity
  private fromHome = 0
  private fromChord: FiguredChord | null = null
  /** A control moved since the voices were last led. */
  private stale = false
  private leading: number | null = null

  protected onNote(atSec: number, held: HeldNote): void {
    for (const other of this.held.values()) {
      if (other.note < held.note) this.covered.add(held)
      else if (other.note > held.note) this.covered.add(other)
    }
    if (this.params.keys !== SILENT) this.sound(held)
    if (this.lowest() === held || this.params.keys === TUNE) this.decide(atSec + GATHER_SEC)
  }

  protected onRelease(atSec: number, held: HeldNote): void {
    const lowest = this.lowest()
    // Pressed and let go before the hand was read: it was a bass all the same.
    const fresh = this.pending !== null && atSec - held.atSec < GATHER_SEC
    const short = fresh && held !== this.bassKey && !this.covered.has(held)
    if (short && !this.isTune(held)) this.takeBass(atSec, held)
    this.end(this.own.get(held.id))
    this.own.delete(held.id)
    const wasBass = held === this.bassKey
    if (wasBass) {
      this.bassKey = null
      this.bassUpSec = atSec
    }
    if (!lowest) {
      this.pending?.task.cancel()
      this.pending = null
      this.rested = true
      this.later(atSec, (at) => this.lift(at))
    } else if (wasBass || this.params.keys === TUNE) {
      this.decide(atSec + LET_GO_SEC)
    }
  }

  protected override onParam(atSec: number, name: string): void {
    if (name === 'keys') {
      for (const held of this.held.values()) {
        if (this.params.keys !== SILENT || held === this.bassKey) this.sound(held)
        else {
          this.end(this.own.get(held.id))
          this.own.delete(held.id)
        }
      }
    }
    if (['rule', 'turn', 'voices', 'spacing', 'height', 'keys'].includes(name)) {
      this.stale = true
      this.lead(atSec, true)
    }
  }

  protected override onKey(atSec: number): void {
    this.stale = true
    this.lead(atSec, true)
  }

  protected override onSilence(): void {
    this.own.clear()
    this.bassKey = null
    this.lastNote = null
    this.rested = true
    this.rising = null
    this.pending = null
    this.done = this.asked
    this.bass = null
    this.down = false
    this.upper = []
    this.tails.clear()
    this.from = []
    this.leading = null
    this.fromChord = null
  }

  // --- The keys ---------------------------------------------------------------

  private lowest(): HeldNote | null {
    let lowest: HeldNote | null = null
    for (const held of this.held.values()) if (!lowest || held.note < lowest.note) lowest = held
    return lowest
  }

  private sound(held: HeldNote): void {
    if (!this.own.has(held.id)) this.own.set(held.id, this.start(held.note, held.gain))
  }

  /** Read the hand at `atSec`, or before if that was asked already. */
  private decide(atSec: number): void {
    if (this.pending && this.pending.atSec <= atSec) return
    this.pending?.task.cancel()
    this.pending = {
      atSec,
      task: this.at(atSec, (at) => {
        this.pending = null
        const lowest = this.lowest()
        if (!lowest) return
        if (lowest !== this.bassKey && !this.isTune(lowest)) this.takeBass(at, lowest)
        else if (this.params.keys === TUNE && this.crossed()) this.lead(at, true)
      }),
    }
  }

  /** Whether the lowest key left is the tune over a bass that was let go, and not the next bass. */
  private isTune(lowest: HeldNote): boolean {
    if (this.params.keys !== TUNE || this.bassKey !== null || this.lastNote === null) return false
    if (this.rested || lowest.note - this.lastNote < 12) return false
    // What was held over the bass, and what moves on near the tune.
    return lowest.atSec <= this.bassUpSec || this.top() - lowest.note < 12
  }

  private takeBass(atSec: number, held: HeldNote): void {
    const before = this.bassKey
    this.bassKey = held
    this.rested = false
    if (this.params.keys === SILENT && before !== null && before !== held) {
      this.end(this.own.get(before.id))
      this.own.delete(before.id)
    }
    this.sound(held)
    if (this.lastNote !== null && held.note !== this.lastNote)
      this.rising = held.note > this.lastNote
    this.lastNote = held.note
    const bass: Bass = {
      note: foldNote(Math.round(held.note)),
      gain: held.gain,
      rising: this.rising,
    }
    // Counted from the key, not from when the hand was read.
    this.later(Math.max(held.atSec, atSec - LET_GO_SEC), (at) => {
      this.bass = bass
      this.down = true
      this.lead(at, false)
    })
  }

  /** The hand of the upper voices does it, as late as it is. What was asked before something done is not done. */
  private later(atSec: number, run: (atSec: number) => void): void {
    const order = (this.asked += 1)
    this.at(atSec + this.params.delay, (at) => {
      if (order < this.done) return
      this.done = order
      run(at)
    })
  }

  // --- The upper voices ---------------------------------------------------------

  private top(): number {
    let top = -Infinity
    for (const held of this.held.values()) top = Math.max(top, held.note)
    return top
  }

  private tune(): number {
    if (this.params.keys !== TUNE || !this.bass) return Infinity
    const top = this.top()
    return top - this.bass.note >= 12 ? Math.ceil(top) : Infinity
  }

  private crossed(): boolean {
    const under = this.tune()
    return this.down && this.upper.some((voice) => voice.note >= under)
  }

  /** Take the voices to the chord over the bass; `again` is the same bass once more, as a control moved. */
  private lead(atSec: number, again: boolean): void {
    const { bass } = this
    if (!bass || (again && !this.down)) return
    const { rule, turn, voices, spacing, height, level } = this.params
    const rising = turn === 0 ? bass.rising : turn === 1
    const chord = chordOver(this.key, bass.note, rule, rising)
    const middle = classNear(this.key.root, 60) + height
    const under = this.tune()
    const half = HALF_SPAN[spacing]
    const home = Math.min(Math.max(middle, bass.note + 4 + half), under - half)
    const taken: number[] = []
    // A silent key is in nobody's way.
    if (this.params.keys !== SILENT) for (const held of this.held.values()) taken.push(held.note)
    // The tune that pressed them down has gone up.
    const freed = under > this.fromUnder && home - this.fromHome > 4
    // The same chord over the same bass is the same notes.
    const stays =
      !again &&
      !this.stale &&
      !freed &&
      bass.note === this.fromBass &&
      String(chord.need) === String(this.fromChord?.need) &&
      this.from.length === voices &&
      this.from.every((note) => note < under)
    const notes = stays
      ? this.from
      : leadVoices(chord, {
          bass: bass.note,
          voices,
          spacing,
          home,
          thick: classNear(this.key.root, 60) - 5,
          under,
          taken,
          from: this.from,
          fromBass: this.fromBass,
          // A control that moved may move the voices further than a chord would, and so may room.
          still: again || this.stale || freed ? 0.3 : 1,
          leading: this.leading,
        })
    this.stale = false
    this.move(atSec, notes, bass.gain * level, again)
    if (notes.length === 0) return
    this.from = notes
    this.fromBass = bass.note
    this.fromUnder = under
    this.fromHome = home
    this.fromChord = chord
    const leading = mod(this.key.root + 11, 12)
    this.leading = chord.need.includes(leading) ? leading : null
  }

  private move(atSec: number, notes: readonly number[], gain: number, again: boolean): void {
    const { strum, linger } = this.params
    const keep = this.params.hold === 0 || again
    const left = this.upper
    const free: Voice[] = []
    const next = notes.map((note, i) => {
      const same = keep ? this.already(note, left) : undefined
      if (same) {
        same.ends?.cancel()
        same.ends = null
        this.tails.delete(same)
        return same
      }
      const dueSec = atSec + (strum * i) / Math.max(1, notes.length - 1)
      // A roll that is struck again keeps its order if it can, and may be put off once.
      const bySec = atSec + (keep ? strum : 2 * strum)
      const voice: Voice = { note, made: null, begin: null, dueSec, bySec, before: [], ends: null }
      free.push(voice)
      return voice
    })
    let leaving = left.filter((voice) => !next.includes(voice))
    // One that has nothing to leave gives its place to one that sounds.
    const idle = leaving
      .filter((voice) => voice.begin && voice.before.length === 0)
      .slice(0, Math.max(0, leaving.length - free.length))
    for (const voice of idle) this.leave(voice, 0)
    leaving = leaving.filter((voice) => !idle.includes(voice))
    free.forEach((voice, i) => {
      if (i < leaving.length) {
        const old = leaving[i]
        // A voice on its way to a note it never reached leaves the one it is on, and
        // a bass that moves on and on does not put it off for ever.
        if (old.begin) {
          voice.bySec = Math.min(voice.bySec, old.bySec)
          voice.dueSec = Math.min(voice.dueSec, voice.bySec)
          old.begin.cancel()
          old.ends?.cancel()
          voice.before.push(...old.before)
        } else {
          old.ends?.cancel()
          old.ends = null
          voice.before.push(old)
        }
      }
      const begin = (): void => {
        voice.begin = null
        for (const old of voice.before) this.leave(old, linger)
        voice.before = []
        voice.made = this.start(voice.note, gain, 'upper')
      }
      if (voice.dueSec <= this.now) begin()
      else voice.begin = this.at(voice.dueSec, begin)
    })
    for (const voice of leaving.slice(free.length)) {
      // Its place is taken by one that kept its note; it stays for the one still to come.
      const heir = next.find((other) => other.begin && other.before.length === 0)
      if (heir && !voice.begin && voice.made) {
        voice.ends?.cancel()
        voice.ends = null
        heir.before.push(voice)
      } else this.leave(voice, linger)
    }
    this.upper = next
  }

  /** A voice that is on this note, or on its way to it, or still there as the next is late. */
  private already(note: number, upper: readonly Voice[]): Voice | undefined {
    const there = (voice: Voice): boolean =>
      voice.note === note && (voice.made !== null || voice.begin !== null)
    const found = upper.find(there) ?? [...this.tails].find(there)
    if (found) return found
    for (const voice of upper) {
      const i = voice.before.findIndex((old) => old.note === note && old.made !== null)
      if (i >= 0) return voice.before.splice(i, 1)[0]
    }
    return undefined
  }

  /** Let a note ring `seconds` more. */
  private leave(voice: Voice, seconds: number): void {
    voice.begin?.cancel()
    voice.begin = null
    for (const old of voice.before) this.leave(old, seconds)
    voice.before = []
    voice.ends?.cancel()
    voice.ends = null
    if (!voice.made) return
    if (seconds <= 0) {
      this.finish(voice)
      return
    }
    this.tails.add(voice)
    voice.ends = this.at(this.now + seconds, () => this.finish(voice))
  }

  private finish(voice: Voice): void {
    voice.begin?.cancel()
    voice.begin = null
    for (const old of voice.before) this.finish(old)
    voice.before = []
    voice.ends = null
    this.tails.delete(voice)
    this.end(voice.made)
    voice.made = null
  }

  /** The last key is up: what sounds and what is still to come rings out. */
  private lift(atSec: number): void {
    this.down = false
    for (const voice of this.upper) {
      voice.ends?.cancel()
      voice.ends = this.at(atSec + this.params.sustain, () => this.finish(voice))
    }
  }
}

export const RULE_OF_THE_OCTAVE: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'rule-of-the-octave',
  name: 'Rule of the Octave',
  description:
    'Plays the upper voices over a bass: each step of the scale has one chord when the bass rises to it and another when it falls, and the voices move as little as they can.',
  kind: 'answers',
  version: 1,
  params: PARAMS,
  parts: [{ id: 'upper', name: 'Upper voices', description: 'The chord over the bass.' }],
  timed: { delay: 'time', strum: 'time', sustain: 'time', linger: 'time' },
  presets: {
    'First lesson': {},
    'With its sharps': { rule: 1, sustain: 0.6 },
    'Open strings': { rule: 1, spacing: 2, height: 4, sustain: 1.2, level: 0.55 },
    'Four voice choir': { rule: 1, voices: 4, spacing: 1, height: 3, sustain: 1.6, level: 0.5 },
    'Always falling': { rule: 1, turn: 2, height: 5, sustain: 0.8 },
    'Always rising': { turn: 1, voices: 4, sustain: 0.8, level: 0.5 },
    'Plain triads': { rule: 2, hold: 1, sustain: 0.3 },
    'Soft sevenths': { rule: 3, voices: 3, spacing: 1, height: 2, sustain: 2.5, level: 0.5 },
    'Wide sevenths': { rule: 3, voices: 4, spacing: 3, height: 6, sustain: 4, level: 0.45 },
    'String of sixths': { rule: 4, voices: 2, height: 0, sustain: 0.3, level: 0.7 },
    'Late hand': { rule: 1, delay: 0.75, sustain: 1, level: 0.6 },
    'Slow suspensions': { delay: 1.5, strum: 1.5, spacing: 2, height: 4, sustain: 3 },
    'Rolled chords': { rule: 1, hold: 1, strum: 0.5, voices: 4, spacing: 1, sustain: 2 },
    'Long harp roll': {
      rule: 3,
      hold: 1,
      strum: 1.6,
      voices: 4,
      spacing: 2,
      height: 8,
      sustain: 5,
    },
    'Melting choir': { rule: 1, linger: 2.5, spacing: 1, height: 9, sustain: 4, level: 0.4 },
    'Two above': { voices: 2, spacing: 2, height: 10, sustain: 1.2 },
    'Tune on top': { rule: 1, keys: 1, spacing: 0, height: 2, sustain: 0.8 },
    'Bass alone speaks': { rule: 1, keys: 2, voices: 4, height: 7, sustain: 1.5 },
    'High and thin': { rule: 2, voices: 2, spacing: 1, height: 21, sustain: 3, level: 0.35 },
    'Low consort': { rule: 1, voices: 3, height: -5, spacing: 1, sustain: 1, level: 0.5 },
    'Afterglow hand': { rule: 4, delay: 0.4, linger: 1.2, voices: 3, spacing: 2, sustain: 6 },
  },
  create: (options?: MakerOptions) => new RuleOfTheOctave(RULE_OF_THE_OCTAVE, options),
}
