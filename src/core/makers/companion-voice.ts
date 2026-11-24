// Companion Voice: a second voice written by rule beside a line. In Triad the
// companion has only the three notes of one chord of the key, and for each
// note of the line it takes the chord's nearest note under it (or over it), or
// the next but one: a line with a bell of its own. The other rules keep one
// distance: thirds, sixths, fifths or fourths of the key, or, in Fauxbourdon,
// two voices that make first-inversion triads with the line.
//
// Fifths and fourths are perfect: where the scale has only a tritone, a fifth
// gives way to a fourth and a fourth to a fifth. Fauxbourdon keeps the one
// diminished triad, as it was sung.
//
// A cadence is the last note before a rest, and a rest is not known before it
// comes. So what counts as one is a note held for some time, a note on the
// tonic, or a tonic that is held; there the companion is at the octave (the
// third voice at the fifth of it), or in the triad rules at the tonic.

import { above, below, degreeClass, inKey, mod, snapNote, stepFrom, triadOn } from './key'
import { foldNote, MakerBase, type HeldNote, type MadeNote, type TaskHandle } from './base'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

const PARAMS = {
  rule: {
    id: 0,
    name: 'Rule',
    min: 0,
    max: 7,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: [
      'Near triad',
      'Second triad',
      'Third triad',
      'Thirds',
      'Sixths',
      'Fifths',
      'Fourths',
      'Fauxbourdon',
    ],
    description:
      'The nearest note of the tonic triad, the second or the third one from the line; one interval of the key; or two voices that make an inverted triad with the line.',
  },
  side: {
    id: 1,
    name: 'Side',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Below', 'Above', 'Alternate', 'Behind'],
    description:
      'Which side of the line it keeps. Alternate changes at every note, from below. Behind is below while the line rises and above while it falls.',
  },
  tonic: {
    id: 2,
    name: 'Tonic',
    min: 1,
    max: 7,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'The degree of the key the triad stands on and cadences end on: 1 is the root, 6 of C is A minor. A scale of another size takes its note nearest to that degree of major.',
  },
  octave: {
    id: 3,
    name: 'Octave',
    min: -2,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: 'oct',
    step: 1,
    description: 'Moves the companion by whole octaves from where its rule puts it.',
  },
  follow: {
    id: 4,
    name: 'Follows',
    min: 0,
    max: 2,
    default: 1,
    taper: 'linear',
    unit: '',
    choices: ['All', 'Top', 'Bottom'],
    description:
      'Which notes of a chord have a companion: all of them, the highest held, or the lowest. Top and Bottom wait a thirtieth of a second to hear the whole chord.',
  },
  every: {
    id: 5,
    name: 'Every',
    min: 1,
    max: 4,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
    description: 'At 1 every note it follows is answered, at 2 every other one, and so on.',
  },
  delay: {
    id: 6,
    name: 'Delay',
    min: 0,
    max: 8,
    default: 0,
    taper: 'linear',
    unit: 's',
    description: 'How long the companion waits after the note. At zero they sound together.',
  },
  level: {
    id: 7,
    name: 'Level',
    min: 0,
    max: 1,
    default: 0.7,
    taper: 'linear',
    unit: '',
    description: 'How hard the companion is played, as a share of the note it goes with.',
  },
  melody: {
    id: 8,
    name: 'Line level',
    min: 0,
    max: 1,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'How hard the line itself is played, as a share of how it was struck. At zero the companion is heard alone.',
  },
  ring: {
    id: 9,
    name: 'Ring',
    min: 0,
    max: 8,
    default: 0,
    taper: 'linear',
    unit: 's',
    description: 'How long the companion goes on after its note is let go.',
  },
  cadence: {
    id: 10,
    name: 'Cadence',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['None', 'Held', 'On tonic', 'Held tonic'],
    description:
      'Which notes are a cadence, where the companion is at the octave, or in a triad rule at the tonic: none, any that is held, any on the tonic, or a tonic that is held.',
  },
  opens: {
    id: 11,
    name: 'Held for',
    min: 0.2,
    max: 8,
    default: 1.5,
    taper: 'log',
    unit: 's',
    description:
      'For a cadence that is held, how long a note is held before the companion moves on to the octave or the tonic.',
  },
} as const satisfies NoteMakerDescriptor['params']

const [THIRD_TRIAD, THIRDS, SIXTHS, FIFTHS, FOURTHS] = [2, 3, 4, 5, 6]
const [ABOVE, ALTERNATE, BEHIND] = [1, 2, 3]
const [ALL, TOP] = [0, 1]
const [HELD, ON_TONIC, HELD_TONIC] = [1, 2, 3]

/** Follows hears a chord for so long before it says which of its notes is the top. */
const ONE_CHORD_SEC = 1 / 30

/** Controls that are turned together, as a preset turns them, are one change. */
const ONE_CHANGE_SEC = 0.03

/** A note let go at the very moment it would be a cadence is none: it has to be held on past it. */
const HELD_ON_SEC = 0.02

/** The white keys' scale, to place a degree by in a scale of another size. */
const MAJOR = [0, 2, 4, 5, 7, 9, 11]

/**
 * What an interval is looked for as: the semitones it may be, and what stands
 * in where a scale has none of them. In a seven-note scale it is its steps.
 */
interface Interval {
  steps: number
  own: readonly number[]
  instead: readonly number[]
}

const THIRD: Interval = { steps: 2, own: [4, 3], instead: [5, 7, 12] }
const SIXTH: Interval = { steps: 5, own: [9, 8], instead: [7, 12] }
const FIFTH: Interval = { steps: 4, own: [7], instead: [5, 12] }
const FOURTH: Interval = { steps: 3, own: [5], instead: [7, 12] }
/** The fourth inside a first-inversion triad: a tritone in the diminished one. */
const INNER_FOURTH: Interval = { steps: 3, own: [5, 6], instead: [7, 12] }

/** The key's note an interval over `note` (`way` 1) or under it (-1). */
export function intervalFrom(key: MakerKey, note: number, way: 1 | -1, interval: Interval): number {
  const from = snapNote(key, note)
  const { steps, own, instead } = interval
  if (key.steps.length === 7) {
    const stepped = stepFrom(key, from, way * steps)
    if (own.includes(Math.abs(stepped - from))) return stepped
  }
  for (const semitones of [...own, ...instead]) {
    if (inKey(key, from + way * semitones)) return from + way * semitones
  }
  return from + way * 12
}

/**
 * The degree of the key, from 0, that is called `degree` from 1. In a scale
 * that has not seven notes, its note nearest to that degree of major;
 * halfway, the lower.
 */
export function tonicDegree(key: MakerKey, degree: number): number {
  const at = Math.round(degree) - 1
  const size = key.steps.length
  if (size === 7) return mod(at, 7)
  const wanted = MAJOR[mod(at, 7)]
  let best = 0
  let distance = Infinity
  for (let i = 0; i <= size; i += 1) {
    const away = Math.abs((i === size ? 12 : key.steps[i]) - wanted)
    if (away < distance) {
      best = mod(i, size)
      distance = away
    }
  }
  return best
}

/** The `count`th note of `classes` strictly over or under `note`. */
export function nthOfClasses(
  classes: readonly number[],
  note: number,
  way: 1 | -1,
  count: number,
): number {
  let found = note
  for (let i = 0; i < count; i += 1) {
    found = way === 1 ? above(classes, found) : below(classes, found)
  }
  return found
}

/** A note of a companion that sounds. */
interface Beside {
  part: 'companion' | 'third'
  made: MadeNote
}

/** One held key: its own note, and what goes beside it, which can be later. */
interface Voice {
  readonly note: number
  readonly gain: number
  readonly atSec: number
  /** How much later the companion is. */
  lag: number
  own: MadeNote | null
  beside: Beside[]
  /** Whether the companion has begun. */
  begun: boolean
  /** When its key was let go, and whether its companion has ended too. */
  releasedAt: number
  done: boolean
  /** Which side each way of choosing one gives it, fixed when it was played. */
  alternate: 1 | -1
  behind: 1 | -1
  /** Whether it has come to its cadence, and the thing to do that brings it there. */
  opened: boolean
  opening: TaskHandle | null
}

class CompanionVoice extends MakerBase {
  private readonly voices = new Map<number, Voice>()
  /** Notes that were followed, for Every; companions written, for Alternate. */
  private followed = 0
  private answered = 0
  private last: number | null = null
  private lastWay: 1 | -1 = -1
  private changing = false

  protected onNote(atSec: number, held: HeldNote): void {
    const { follow, delay, melody } = this.params
    const wait = follow === ALL ? 0 : ONE_CHORD_SEC
    const voice: Voice = {
      note: held.note,
      gain: held.gain,
      atSec,
      lag: Math.max(wait, delay),
      own: melody > 0 ? this.start(held.note, held.gain * melody) : null,
      beside: [],
      begun: false,
      releasedAt: Infinity,
      done: false,
      alternate: -1,
      behind: -1,
      opened: false,
      opening: null,
    }
    this.voices.set(held.id, voice)
    const decide = (): void => {
      if (!this.follows(voice, held.id, follow)) return
      if (this.last !== null && this.last !== voice.note) {
        this.lastWay = voice.note > this.last ? -1 : 1
      }
      this.last = voice.note
      voice.behind = this.lastWay
      this.followed += 1
      if ((this.followed - 1) % this.params.every !== 0) return
      voice.alternate = this.answered % 2 === 0 ? -1 : 1
      this.answered += 1
      if (atSec + voice.lag <= this.now) this.begin(voice)
      else this.at(atSec + voice.lag, () => this.begin(voice))
    }
    if (wait === 0) decide()
    else this.at(atSec + wait, decide)
  }

  protected onRelease(atSec: number, held: HeldNote): void {
    const voice = this.voices.get(held.id)
    this.voices.delete(held.id)
    if (!voice) return
    voice.releasedAt = atSec
    this.end(voice.own)
    // As late as it began, it is held as long as the note was, and rings on.
    this.at(atSec + voice.lag + this.params.ring, () => {
      voice.done = true
      voice.opening?.cancel()
      for (const { made } of voice.beside) this.end(made)
      voice.beside = []
    })
  }

  protected override onParam(atSec: number, name: string): void {
    if (name === 'delay' || name === 'ring' || name === 'follow' || name === 'every') return
    this.change(atSec)
  }

  protected override onKey(atSec: number): void {
    this.change(atSec)
  }

  protected override onSilence(): void {
    this.voices.clear()
    this.followed = 0
    this.answered = 0
    this.last = null
    this.lastWay = -1
    this.changing = false
  }

  /** Whether a note is one the companion goes with, once its chord is all there. */
  private follows(voice: Voice, id: number, follow: number): boolean {
    if (follow === ALL) return true
    for (const other of this.held.values()) {
      if (other.id === id) continue
      if (follow === TOP ? other.note > voice.note : other.note < voice.note) return false
    }
    return true
  }

  private begin(voice: Voice): void {
    if (voice.done) return
    voice.begun = true
    this.planOpening(voice)
    this.write(voice)
  }

  /** What goes beside a note by the controls as they stand, replaced where it is another note. */
  private write(voice: Voice): void {
    const { level } = this.params
    const wanted = level > 0 ? this.beside(voice) : []
    const kept: Beside[] = []
    for (const now of voice.beside) {
      const same = wanted.some(
        ({ part, note }) => part === now.part && foldNote(note) === now.made.note,
      )
      if (same) kept.push(now)
      else this.end(now.made)
    }
    for (const { part, note } of wanted) {
      if (kept.some((now) => now.part === part)) continue
      kept.push({ part, made: this.start(note, voice.gain * level, part) })
    }
    voice.beside = kept
  }

  /** The notes the rule puts beside a note. */
  private beside(voice: Voice): { part: Beside['part']; note: number }[] {
    const { rule, side, tonic, octave } = this.params
    const way =
      side === ALTERNATE
        ? voice.alternate
        : side === BEHIND
          ? voice.behind
          : side === ABOVE
            ? 1
            : -1
    const shift = 12 * octave
    const by = (interval: Interval): number =>
      intervalFrom(this.key, voice.note, way, interval) + shift
    const outer = (note: number) => ({ part: 'companion' as const, note })
    if (rule <= THIRD_TRIAD) {
      const degree = tonicDegree(this.key, tonic)
      const classes = voice.opened ? [degreeClass(this.key, degree)] : triadOn(this.key, degree)
      const count = voice.opened ? 1 : rule + 1
      return [outer(nthOfClasses(classes, voice.note, way, count) + shift)]
    }
    const octaveAway = snapNote(this.key, voice.note) + way * 12 + shift
    if (rule >= THIRDS && rule <= FOURTHS) {
      if (voice.opened) return [outer(octaveAway)]
      if (rule === THIRDS) return [outer(by(THIRD))]
      if (rule === SIXTHS) return [outer(by(SIXTH))]
      return [outer(by(rule === FIFTHS ? FIFTH : FOURTH))]
    }
    // A sixth and a fourth under the line, or a third and a sixth over it: the
    // line is the top of a first-inversion triad or its bottom. At a cadence
    // the outer voices are an octave apart and the third a fifth over the lower.
    const inner = voice.opened ? (way === 1 ? FIFTH : FOURTH) : way === 1 ? THIRD : INNER_FOURTH
    return [
      outer(voice.opened ? octaveAway : by(SIXTH)),
      { part: 'third' as const, note: by(inner) },
    ]
  }

  /** Whether a note is at its cadence now, and the thing to do that brings it there if it is not. */
  private planOpening(voice: Voice): void {
    voice.opening?.cancel()
    voice.opening = null
    const { cadence, opens, tonic } = this.params
    const home = degreeClass(this.key, tonicDegree(this.key, tonic))
    const onTonic = mod(snapNote(this.key, voice.note) - home, 12) === 0
    if (cadence === ON_TONIC) {
      voice.opened = onTonic
      return
    }
    voice.opened = false
    if (cadence !== HELD && !(cadence === HELD_TONIC && onTonic)) return
    const long = opens + HELD_ON_SEC
    const due = voice.atSec + voice.lag + long
    if (this.now >= due) {
      voice.opened = true
      return
    }
    voice.opening = this.at(due, () => {
      // Late as the companion is, it opens only for a note that was held so long.
      if (voice.releasedAt < voice.atSec + long) return
      voice.opened = true
      this.write(voice)
    })
  }

  /** Controls or the key moved: in a moment, what sounds for held keys is what they ask for. */
  private change(atSec: number): void {
    if (this.changing) return
    this.changing = true
    this.at(atSec + ONE_CHANGE_SEC, () => {
      this.changing = false
      const { melody } = this.params
      for (const voice of this.voices.values()) {
        if (melody <= 0) {
          this.end(voice.own)
          voice.own = null
        } else voice.own ??= this.start(voice.note, voice.gain * melody)
        if (!voice.begun) continue
        this.planOpening(voice)
        this.write(voice)
      }
    })
  }
}

export const COMPANION_VOICE: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'companion-voice',
  name: 'Companion Voice',
  description:
    'Writes a second voice beside a line by rule: the nearest note of one triad, like a bell of its own, or thirds, sixths, fifths, fourths, or two voices of fauxbourdon.',
  kind: 'answers',
  version: 1,
  params: PARAMS,
  parts: [
    {
      id: 'companion',
      name: 'Companion',
      description: 'The second voice, and the outer one of the two in Fauxbourdon.',
    },
    {
      id: 'third',
      name: 'Third voice',
      description: 'The inner voice of Fauxbourdon, between the line and the companion.',
    },
  ],
  timed: { delay: 'time', ring: 'time', opens: 'time' },
  presets: {
    'Bell under': { tonic: 6, ring: 1.5 },
    'Bell over': { tonic: 6, side: 1, ring: 2.5, level: 0.5 },
    'Either hand': { tonic: 6, side: 2, ring: 1 },
    'Second bell': { rule: 1, ring: 1 },
    'Far bells': { rule: 2, tonic: 6, side: 1, octave: 1, every: 2, ring: 5, level: 0.4 },
    'Late bell': { tonic: 2, delay: 2, ring: 3, level: 0.55 },
    'Bell of the fourth': { tonic: 4, side: 3, ring: 1.5 },
    Homecoming: { rule: 1, tonic: 2, side: 1, cadence: 1, opens: 1.5, ring: 0.5 },
    'Deep bell': { rule: 1, follow: 2, tonic: 6, ring: 3, level: 0.8 },
    'Only the bell': { tonic: 6, melody: 0, side: 1, ring: 2, level: 1 },
    'Chord and shadow': { tonic: 5, follow: 0, delay: 1, level: 0.4, ring: 1 },
    'Close thirds': { rule: 3, level: 0.8 },
    'Slow tenths': { rule: 3, octave: -1, cadence: 3, opens: 3, ring: 0.3 },
    'Thirds in answer': { rule: 3, side: 2, delay: 1.5, level: 0.6, ring: 0.5 },
    'Warm sixths': { rule: 4, cadence: 1, opens: 1.2 },
    'Sixths from behind': { rule: 4, side: 3, delay: 0.25, level: 0.6 },
    'Bare fifths': { rule: 5, follow: 0, level: 0.75 },
    'Fifths overhead': { rule: 5, side: 1, octave: 1, every: 3, ring: 4, level: 0.4 },
    'Stone fourths': { rule: 6, delay: 0.4, ring: 0.8, cadence: 2, tonic: 2 },
    'Sung in three': { rule: 7, cadence: 1, opens: 1.5, level: 0.8 },
    'Three rising': { rule: 7, side: 1, cadence: 2, level: 0.6 },
    'Over the bass': { rule: 7, side: 1, follow: 2, delay: 0.5, ring: 1, level: 0.7 },
    'Distant choirbook': { rule: 7, side: 2, melody: 0.6, delay: 3, ring: 2, level: 0.5 },
  },
  create: (options?: MakerOptions) => new CompanionVoice(COMPANION_VOICE, options),
}
