// Companion Voice: a second voice written by rule beside a line. In Triad the
// companion has only the three notes of one chord of the key, and for each
// note of the line it takes the chord's nearest note under it (or over it), or
// the next but one: a line with a bell of its own. The other rules keep one
// distance: thirds, sixths, fifths or fourths of the key, or, in Fauxbourdon,
// two voices that make first-inversion triads with the line.
//
// Fifths and fourths are perfect: where the scale has only a tritone, a fifth
// gives way to a fourth and a fourth to a fifth. Fauxbourdon keeps the one
// diminished triad, as it was sung; a triad of the triad rules that would be
// diminished has the sixth for its fifth.
//
// Where the companion is on the instrument of the line, a pitch the line holds
// is the line's: the companion is silent there, as it already sounds, and comes
// in when the line leaves it. So the line is never made softer or ended by it.
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
      'Which notes of a chord have a companion: all of them, the highest held, or the lowest. Top and Bottom wait a thirtieth of a second to hear the chord.',
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
    description:
      'How long the companion waits after the note. At zero they sound together, within the moment that Follows waits.',
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

/**
 * Follows hears a chord for so long before it says which of its notes is the
 * top: at least the first, and up to the second where the companion is late
 * anyway. Four notes of one hand lie within the first of each other nearly
 * always, and within a third of it often not.
 */
const ONE_CHORD_SEC = 1 / 30
const WIDE_CHORD_SEC = 0.06

/** With All there is nothing to choose, and the notes of one moment are still let in first. */
const ONE_MOMENT_SEC = 0.005

/** A note struck under (or over) one that is let go this soon after is the line going on, played legato. */
const LEGATO_SEC = 1

/** Keys let go together are not let go at one moment: what follows on a release waits so long. */
const SETTLED_SEC = 0.03

/** Controls that are turned together, as a preset turns them, are one change. */
const ONE_CHANGE_SEC = 0.03

/** A note let go at the very moment it would be a cadence is none: it has to be held on past it. */
const HELD_ON_SEC = 0.02

/** An octave or a tonic that would be over sooner than this is not moved to. */
const SHORTEST_SEC = 0.1

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

/**
 * The triad on a degree of the key, every note of it in the key. Where its
 * fifth is diminished and the key has the minor sixth, the sixth stands in.
 */
export function companionTriad(key: MakerKey, degree: number): number[] {
  const root = degreeClass(key, degree)
  const [, third, fifth] = triadOn(key, degree)
  const sixth = mod(root + 8, 12)
  const diminished = mod(third - root, 12) === 3 && mod(fifth - root, 12) === 6
  return [root, third, diminished && inKey(key, sixth) ? sixth : fifth].filter((pitchClass) =>
    inKey(key, pitchClass),
  )
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
  gain: number
}

/** One held key: its own note, and what goes beside it, which can be later. */
interface Voice {
  readonly note: number
  readonly gain: number
  readonly atSec: number
  /** How much later the companion is. */
  lag: number
  own: MadeNote | null
  ownGain: number
  beside: Beside[]
  /** Whether its chord was heard, whether the companion goes with it, whether Every chose it, and whether the companion has begun. */
  heard: boolean
  followed: boolean
  chosen: boolean
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
  /** The held keys; every key whose companion has not ended; the keys struck in the last moments. */
  private readonly voices = new Map<number, Voice>()
  private readonly answering = new Set<Voice>()
  private recent: Voice[] = []
  /** The parts that are on an instrument of their own. */
  private readonly apart: ReadonlySet<string>
  /** Notes that were followed, for Every; companions written, for Alternate. */
  private followed = 0
  private answered = 0
  private last: number | null = null
  private lastWay: 1 | -1 = -1
  private changing = false

  constructor(descriptor: NoteMakerDescriptor, options?: MakerOptions) {
    super(descriptor, options)
    this.apart = new Set(options?.parts)
  }

  protected onNote(atSec: number, held: HeldNote): void {
    const { follow, delay, melody } = this.params
    const wait =
      follow === ALL ? ONE_MOMENT_SEC : Math.min(WIDE_CHORD_SEC, Math.max(ONE_CHORD_SEC, delay))
    const voice: Voice = {
      note: held.note,
      gain: held.gain,
      atSec,
      lag: Math.max(wait, delay),
      own: null,
      ownGain: 0,
      beside: [],
      heard: false,
      followed: false,
      chosen: false,
      begun: false,
      releasedAt: Infinity,
      done: false,
      alternate: -1,
      behind: -1,
      opened: false,
      opening: null,
    }
    this.voices.set(held.id, voice)
    this.answering.add(voice)
    this.recent = this.recent.filter((other) => other.atSec > atSec - 2 * WIDE_CHORD_SEC)
    this.recent.push(voice)
    if (melody > 0) this.strike(voice)
    this.at(atSec + wait, () => {
      voice.heard = true
      if (this.follows(voice, follow)) this.answer(voice)
    })
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
      this.answering.delete(voice)
    })
    this.at(atSec + SETTLED_SEC, () => this.left(voice))
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
    this.answering.clear()
    this.recent = []
    this.followed = 0
    this.answered = 0
    this.last = null
    this.lastWay = -1
    this.changing = false
  }

  /** The line's own note. A softer companion on its instrument at that pitch gives way to it. */
  private strike(voice: Voice): void {
    const gain = voice.gain * this.params.melody
    const pitch = foldNote(voice.note)
    for (const other of this.answering) {
      other.beside = other.beside.filter((now) => {
        const gives = now.made.on === undefined && now.made.note === pitch && now.gain <= gain
        if (gives) this.end(now.made)
        return !gives
      })
    }
    voice.own = this.start(voice.note, gain)
    voice.ownGain = gain
  }

  /** Whether the line holds a pitch, and no softer than `gain`, on the instrument of a part. */
  private lineHolds(part: Beside['part'], pitch: number, gain: number): boolean {
    if (this.apart.has(part)) return false
    for (const { own, ownGain } of this.voices.values())
      if (own?.note === pitch && ownGain >= gain) return true
    return false
  }

  /** A key was let go a moment ago: what it stood in the way of, for the keys that are still held. */
  private left(gone: Voice): void {
    for (const voice of this.voices.values()) {
      if (voice.begun) this.write(voice)
      if (voice.followed || this.params.follow === ALL) continue
      const after = voice.atSec - gone.atSec > WIDE_CHORD_SEC
      const overlapped = gone.releasedAt - voice.atSec <= LEGATO_SEC
      if (voice.heard && after && overlapped && this.follows(voice, this.params.follow))
        this.answer(voice)
    }
  }

  /** Whether a note is one the companion goes with, once its chord is all there. */
  private follows(voice: Voice, follow: number): boolean {
    if (follow === ALL) return true
    // Beside what is held, the notes of its chord, which a short one lets go of at once.
    const chord = this.recent.filter((other) => Math.abs(other.atSec - voice.atSec) < ONE_CHORD_SEC)
    for (const other of new Set([...this.voices.values(), ...chord])) {
      if (other === voice) continue
      if (follow === TOP ? other.note > voice.note : other.note < voice.note) return false
    }
    return true
  }

  /** The companion goes with this note: which side it would be on, and when. */
  private answer(voice: Voice): void {
    voice.followed = true
    // One pitch held under two keys is one note of the line, and counts once.
    const twin = [...this.voices.values()].find(
      (other) =>
        other !== voice &&
        other.followed &&
        other.note === voice.note &&
        Math.abs(other.atSec - voice.atSec) < ONE_CHORD_SEC,
    )
    if (twin) {
      voice.chosen = twin.chosen
      voice.alternate = twin.alternate
      voice.behind = twin.behind
    } else {
      if (this.last !== null && this.last !== voice.note) {
        this.lastWay = voice.note > this.last ? -1 : 1
      }
      this.last = voice.note
      voice.behind = this.lastWay
      voice.chosen = this.followed % this.params.every === 0
      this.followed += 1
      if (voice.chosen) {
        voice.alternate = this.answered % 2 === 0 ? -1 : 1
        this.answered += 1
      }
    }
    if (!voice.chosen) return
    this.at(voice.atSec + voice.lag, () => this.begin(voice))
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
      const gain = voice.gain * level
      if (this.lineHolds(part, foldNote(note), gain)) continue
      kept.push({ part, gain, made: this.start(note, gain, part) })
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
      const classes = voice.opened
        ? [degreeClass(this.key, degree)]
        : companionTriad(this.key, degree)
      const count = voice.opened ? 1 : rule + 1
      return [outer(nthOfClasses(classes, this.placed(voice), way, count) + shift)]
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

  /** Where a note of the line is taken to be: one sung between the keys is the note of the key beside it. */
  private placed(voice: Voice): number {
    const near = snapNote(this.key, voice.note)
    return Math.abs(near - voice.note) <= 0.5 ? near : voice.note
  }

  /** Whether a note is at its cadence now, and the thing to do that brings it there if it is not. */
  private planOpening(voice: Voice): void {
    voice.opening?.cancel()
    voice.opening = null
    const { cadence, opens, tonic } = this.params
    const home = degreeClass(this.key, tonicDegree(this.key, tonic))
    // A note outside the key is no cadence: the octave of the note beside it would grate.
    const inside = inKey(this.key, this.placed(voice))
    const onTonic = mod(this.placed(voice) - home, 12) === 0
    if (cadence === ON_TONIC) {
      voice.opened = onTonic
      return
    }
    voice.opened = false
    if (!inside || (cadence !== HELD && !(cadence === HELD_TONIC && onTonic))) return
    const long = opens + HELD_ON_SEC
    const due = voice.atSec + voice.lag + long
    // Late as the companion is, it opens only for a note that was held so long.
    const open = (): boolean =>
      voice.releasedAt >= voice.atSec + long + Math.min(voice.lag, SHORTEST_SEC)
    if (this.now >= due) {
      voice.opened = open()
      return
    }
    voice.opening = this.at(due, () => {
      if (!open()) return
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
        } else if (!voice.own) this.strike(voice)
      }
      for (const voice of this.answering) {
        // One whose key is up is moved for as long as its companion is held, and then only rings.
        if (!voice.begun || this.now >= voice.releasedAt + voice.lag) continue
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
