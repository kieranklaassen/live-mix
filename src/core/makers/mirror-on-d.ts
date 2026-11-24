// Mirror on D: what is played, turned upside down round the one note the
// scale reads the same from both ways. On the white keys that note is D, so
// note n becomes 124 - n: C E G becomes E C A, a rising line falls, and
// nothing leaves the key. In any other key it is that key's own such note,
// and a note outside the key is as far outside it on the other side. A scale
// that has no such note (a harmonic minor) is turned by its own steps round
// its root, so it too stays in the key.
//
// A phrase is what is played between two rests. Answer turns every other one,
// and the fold moves a whole phrase by the same octaves, so a line that rose
// still falls without a leap, or every note by its own. A phrase that began
// low and has climbed so far that its mirror lies out of reach of what is
// played is folded anew from that note on. Fingers do not land together, so
// the mirrors of a chord a phrase is folded by wait for the whole of it, and
// come at once and in their places.

import { classNear, degreeClass, indexOf, mirrorDegree, mod, noteAt } from './key'
import { foldNote, MakerBase, type HeldNote, type MadeNote } from './base'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

/** Notes that begin no further than this after the first of them are one strike: a chord, as fingers land. */
const STRIKE_SEC = 0.065
/** Two starts of one pitch nearer than this are one attack, as ./base.ts has it. */
const ONE_ATTACK_SEC = 0.02
/** Held notes are moved no oftener than this, however fast a control is turned. */
const MOVE_SEC = 0.05
/** Room for the rounding of a sum of seconds: a rest of exactly the length asked for is one. */
const ROUNDING_SEC = 1e-6

/** A mirror further than this from what is played, two octaves, has a phrase folded anew. */
const REACH = 24

const REPLACE = 0
const BOTH = 1
const ANSWER = 2

const PARAMS = {
  mode: {
    id: 0,
    name: 'Mode',
    min: 0,
    max: 2,
    default: 1,
    taper: 'linear',
    unit: '',
    choices: ['Replace', 'Both', 'Answer'],
    description:
      'Replace plays the mirror alone. Both plays the note and its mirror. Answer mirrors every other phrase, a phrase ending at a rest.',
  },
  axis: {
    id: 1,
    name: 'Axis',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Centre', 'Across'],
    description:
      "The note everything turns round: the key's centre (D on the white keys), or the point a tritone above it, which gives the same notes an octave higher.",
  },
  octave: {
    id: 2,
    name: 'Octave',
    min: 2,
    max: 6,
    default: 4,
    taper: 'linear',
    unit: '',
    step: 1,
    description: 'Which octave the axis is in. A higher axis puts every mirror higher.',
  },
  fold: {
    id: 3,
    name: 'Fold',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: 'oct',
    step: 1,
    description:
      'How many octaves a mirror may be moved back towards where it was played, so a mirrored bass stays low. At zero it lies where it falls.',
  },
  turns: {
    id: 4,
    name: 'Turns',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['All', 'Above', 'Below'],
    description:
      'Which notes turn: all of them, only those above the axis so the bass stays, or only those below it.',
  },
  delay: {
    id: 5,
    name: 'Delay',
    min: 0,
    max: 8,
    default: 0,
    taper: 'linear',
    unit: 's',
    description: 'How long the mirror waits after the note. At zero they sound together.',
  },
  level: {
    id: 6,
    name: 'Mirror level',
    min: 0,
    max: 1,
    default: 0.7,
    taper: 'linear',
    unit: '',
    description: 'How hard the mirror is played, as a share of the note it came from.',
  },
  rest: {
    id: 7,
    name: 'Rest',
    min: 0.1,
    max: 4,
    default: 0.6,
    taper: 'log',
    unit: 's',
    description:
      'How long nothing has to be held before the next note begins a new phrase, which Answer turns by and Fold moves as one.',
  },
  strikes: {
    id: 8,
    name: 'Strikes',
    min: 0,
    max: 8,
    default: 0,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'How many strikes a phrase has at the most, a chord being one: one turns every other chord, held or not. At zero only a rest ends a phrase.',
  },
  round: {
    id: 9,
    name: 'Round',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Two', 'Three'],
    description:
      'In Answer, two phrases to the round: as played, then mirrored. With three, a third is mirrored and brought back by octaves to where it was played.',
  },
  foldBy: {
    id: 10,
    name: 'Fold by',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Phrase', 'Note'],
    description:
      'What Fold moves as one: the phrase, by its first chord, whose mirror waits a moment for all of it, so a line keeps its shape; or each note, so a bass stays a bass.',
  },
} as const satisfies NoteMakerDescriptor['params']

/**
 * `note` turned round the axis `axis`, which may lie between two notes. Where
 * the scale is not the same from both sides of the axis, it is turned by its
 * own steps, so that a note of the key is always given a note of the key.
 */
export function mirrored(key: MakerKey, note: number, axis: number): number {
  const even = key.steps.every((step) =>
    key.steps.includes(mod(2 * axis - key.root - step - key.root, 12)),
  )
  if (even) return 2 * axis - note
  const centre = indexOf(key, note)
  return noteAt(key, 2 * indexOf(key, axis) - centre) - (note - noteAt(key, centre))
}

/** Where the axis lies: the key's own centre in an octave (D of it on the white keys), or a tritone above. */
export function axisNote(key: MakerKey, octave: number, across: boolean): number {
  const home = classNear(degreeClass(key, mirrorDegree(key)), 2 + 12 * (octave + 1))
  return home + (across ? 6 : 0)
}

/** `note` moved by octaves, `most` at the most, to lie as near `home` as they bring it. */
export function foldTowards(note: number, home: number, most: number): number {
  let folded = note
  for (let i = 0; i < most; i += 1) {
    const next = folded + (home > folded ? 12 : -12)
    if (Math.abs(next - home) >= Math.abs(folded - home)) break
    folded = next
  }
  return folded
}

/** Notes that are moved by the same octaves: those of a phrase, until it goes out of reach. */
interface Fold {
  /** The notes it is measured by: those of its first strike that turn. */
  opening: number[]
  openedSec: number
}

/** What is played between two rests. */
interface Phrase {
  /** How many came before it since Answer began. */
  index: number
  strikes: number
  fold: Fold
}

/** What one key plays: its own note, and its mirror, which can be later than it. */
interface Voice {
  readonly held: HeldNote
  readonly phrase: Phrase
  fold: Fold
  own: MadeNote | null
  ownSec: number
  mirror: MadeNote | null
  /** The note its mirror is to play; null while it has none. */
  turn: number | null
  /** When the mirror is to begin, and whether that time has come. */
  dueSec: number
  due: boolean
  mirrorSec: number
  mirrorGain: number
}

class MirrorOnD extends MakerBase {
  /** One for each held key, in the order they were played. */
  private readonly voices = new Map<number, Voice>()
  /** Keys let go whose mirrors are still to come or to end. */
  private readonly tails = new Set<Voice>()
  /** How many more than one hold a note that a played note and a mirror share. */
  private readonly shared = new Map<MadeNote, number>()
  /** Whether the mirrors have an instrument of their own, where they meet no played note. */
  private readonly apart: boolean
  private phrase: Phrase | null = null
  private strikeSec = -Infinity
  private emptySince = 0
  private movedSec = -Infinity
  private moving = false

  constructor(descriptor: NoteMakerDescriptor, options: MakerOptions = {}) {
    const parts = [...(options.parts ?? [])]
    super(descriptor, { ...options, parts })
    this.apart = parts.includes('mirror')
  }

  protected onNote(atSec: number, held: HeldNote): void {
    const phrase = this.phraseOf(atSec)
    const voice: Voice = {
      held,
      phrase,
      fold: phrase.fold,
      own: null,
      ownSec: -Infinity,
      mirror: null,
      turn: null,
      dueSec: atSec + this.params.delay,
      due: false,
      mirrorSec: -Infinity,
      mirrorGain: 0,
    }
    this.voices.set(held.id, voice)
    if (!this.stays(held.note)) {
      if (this.outOfReach(atSec, voice)) phrase.fold = { opening: [], openedSec: atSec }
      const { fold } = phrase
      if (fold.opening.length === 0) fold.openedSec = atSec
      if (atSec - fold.openedSec < STRIKE_SEC) fold.opening.push(held.note)
      voice.fold = fold
      // A mirror begun before its chord is whole would be begun again elsewhere.
      if (this.gathers(voice)) voice.dueSec = Math.max(voice.dueSec, fold.openedSec + STRIKE_SEC)
    }
    voice.due = voice.dueSec <= atSec
    // A note that joins the first chord of a fold may move what that chord folds by.
    for (const other of this.voices.values()) if (other.fold === voice.fold) this.place(other)
    for (const other of this.tails) if (other.fold === voice.fold) this.placeTail(other)
    if (voice.due) return
    this.at(voice.dueSec, () => {
      voice.due = true
      this.sound(voice)
    })
  }

  protected onRelease(atSec: number, held: HeldNote): void {
    this.emptySince = atSec
    const voice = this.voices.get(held.id)
    this.voices.delete(held.id)
    if (!voice) return
    this.letGo(voice.own)
    voice.own = null
    this.tails.add(voice)
    // As late as the mirror began, it is held as long as the note was.
    this.at(Math.max(voice.dueSec, atSec + (voice.dueSec - held.atSec)), () => {
      this.tails.delete(voice)
      this.letGo(voice.mirror)
    })
  }

  protected override onParam(_atSec: number, name: string): void {
    // How late a mirror comes is settled when its note is played, how hard when it begins.
    if (name === 'level' || name === 'delay' || name === 'rest' || name === 'strikes') return
    if (name === 'mode' && this.params.mode === ANSWER) {
      // Answer counts from the phrase it is turned on in, or the next one, which is as played.
      if (this.held.size === 0) this.phrase = null
      else if (this.phrase) this.phrase.index = 0
      for (const voice of this.voices.values()) voice.phrase.index = 0
    }
    this.move()
  }

  protected override onKey(): void {
    this.move()
  }

  protected override onSilence(): void {
    this.voices.clear()
    this.tails.clear()
    this.shared.clear()
    this.phrase = null
    this.strikeSec = -Infinity
    this.movedSec = -Infinity
    this.moving = false
  }

  /** The phrase a note that begins now belongs to. */
  private phraseOf(atSec: number): Phrase {
    const newStrike = atSec - this.strikeSec >= STRIKE_SEC
    if (newStrike) this.strikeSec = atSec
    const before = this.phrase
    const rested =
      this.held.size === 1 && atSec - this.emptySince >= this.params.rest - ROUNDING_SEC
    const full =
      before !== null &&
      newStrike &&
      this.params.strikes > 0 &&
      before.strikes >= this.params.strikes
    if (before && !rested && !full) {
      if (newStrike) before.strikes += 1
      return before
    }
    this.phrase = {
      index: before ? before.index + 1 : 0,
      strikes: 1,
      fold: { opening: [], openedSec: -Infinity },
    }
    return this.phrase
  }

  private get axis(): number {
    return axisNote(this.key, this.params.octave, this.params.axis === 1)
  }

  /** Whether a note is on the side of the axis that does not turn. */
  private stays(note: number): boolean {
    const { turns } = this.params
    return (turns === 1 && note < this.axis) || (turns === 2 && note > this.axis)
  }

  /** `note` turned, before any fold. A tritone further up the axis is an octave further up the mirror. */
  private turned(note: number): number {
    const centre = axisNote(this.key, this.params.octave, false)
    return mirrored(this.key, note, centre) + (this.params.axis === 1 ? 12 : 0)
  }

  /** Whether a mirror waits for the rest of the chord it is folded with. */
  private gathers({ phrase }: Voice): boolean {
    return this.params.foldBy === 0 && this.pass(phrase) !== 0 && this.mostOctaves(phrase) > 0
  }

  /** What is held is placed anew: at once, or a moment after the last time. */
  private move(): void {
    if (this.moving) return
    const at = this.movedSec + MOVE_SEC
    if (this.movedSec === this.now || at <= this.now) {
      this.replace()
      return
    }
    this.moving = true
    this.at(at, () => {
      this.moving = false
      this.replace()
    })
  }

  /** Held keys, and the mirrors of those let go, placed anew after a control or the key moved. */
  private replace(): void {
    this.movedSec = this.now
    // What turns, and where to, may have changed: a phrase folds by what is held of it.
    const phrases = new Set([...this.voices.values()].map((voice) => voice.phrase))
    if (this.phrase) phrases.add(this.phrase)
    for (const phrase of phrases) phrase.fold = { opening: [], openedSec: -Infinity }
    for (const voice of this.voices.values()) {
      voice.fold = voice.phrase.fold
      if (this.stays(voice.held.note)) continue
      voice.fold.opening.push(voice.held.note)
      voice.fold.openedSec = voice.held.atSec
    }
    for (const voice of this.voices.values()) this.place(voice)
    for (const voice of this.tails) this.placeTail(voice)
  }

  /** Whether a phrase that was folded by an earlier note puts the mirror of this one too far off. */
  private outOfReach(atSec: number, { phrase, fold, held }: Voice): boolean {
    if (fold.opening.length === 0 || atSec - fold.openedSec < STRIKE_SEC) return false
    const most = this.mostOctaves(phrase)
    const turn = this.turned(held.note)
    return (
      Math.abs(turn + this.shift(fold, most) - held.note) > REACH &&
      Math.abs(foldTowards(turn, held.note, most) - held.note) <= REACH
    )
  }

  /** Which phrase of the round it is in Answer: 0 as played, 1 mirrored, 2 mirrored and brought back. */
  private pass({ index }: Phrase): number {
    if (this.params.mode !== ANSWER) return 1
    return index % (this.params.round === 1 ? 3 : 2)
  }

  /** How many octaves the mirrors of a phrase may be moved by. */
  private mostOctaves(phrase: Phrase): number {
    return this.pass(phrase) === 2 ? 3 : this.params.fold
  }

  /** The octaves a phrase is moved by, in semitones. */
  private shift({ opening }: Fold, most: number): number {
    if (opening.length === 0) return 0
    const played = opening.reduce((sum, note) => sum + note, 0)
    const turned = opening.reduce((sum, note) => sum + this.turned(note), 0)
    const away = (turned - played) / opening.length
    return 12 * Math.round((foldTowards(away, 0, most) - away) / 12)
  }

  /** What a held key plays now: its own note, its mirror or both. */
  private place(voice: Voice): void {
    const { mode } = this.params
    const pass = this.pass(voice.phrase)
    const stays = this.stays(voice.held.note)
    voice.turn = stays || pass === 0 ? null : this.turnOf(voice)
    if (stays || mode === BOTH || (mode !== REPLACE && pass === 0)) {
      if (!voice.own) {
        voice.own = this.strike(voice.held)
        voice.ownSec = this.now
      }
    } else {
      this.letGo(voice.own)
      voice.own = null
    }
    this.sound(voice)
  }

  /** What a key let go still has to play: the mirror it had, where it lies now. */
  private placeTail(voice: Voice): void {
    if (voice.turn === null || this.stays(voice.held.note)) return
    voice.turn = this.turnOf(voice)
    this.sound(voice)
  }

  /** The note of a key's mirror, where its fold puts it. */
  private turnOf({ held, phrase, fold }: Voice): number {
    const most = this.mostOctaves(phrase)
    const turn = this.turned(held.note)
    return this.params.foldBy === 1
      ? foldTowards(turn, held.note, most)
      : turn + this.shift(fold, most)
  }

  /**
   * A played note. When the mirror of another has just begun at its pitch the
   * two are one attack, and it is as hard as it was played, not as the mirror.
   * When that was within the same strike, a chord played a finger at a time,
   * it takes over the mirror and is not struck a second time, unless the
   * mirror was much the softer of the two.
   */
  private strike(held: HeldNote): MadeNote {
    const pitch = foldNote(held.note)
    const there = [...this.voices.values(), ...this.tails].filter(
      ({ mirror, mirrorSec }) =>
        mirror?.note === pitch && mirror.on === undefined && this.now - mirrorSec < STRIKE_SEC,
    )
    const near = there.find(
      ({ mirrorSec, mirrorGain }) =>
        this.now - mirrorSec >= ONE_ATTACK_SEC && mirrorGain >= held.gain / 2,
    )
    if (near?.mirror) return this.share(near.mirror)
    const meeting = there.filter(
      ({ mirrorSec, mirrorGain }) =>
        this.now - mirrorSec < ONE_ATTACK_SEC && mirrorGain < held.gain,
    )
    for (const voice of meeting) this.letGo(voice.mirror)
    const own = this.start(held.note, held.gain)
    for (const voice of meeting) voice.mirror = this.start(pitch, held.gain, 'mirror')
    return own
  }

  /** The mirror of a key as it is to be: begun when its time has come, moved when its note has. */
  private sound(voice: Voice): void {
    if (!voice.due) return
    const before = voice.mirror
    const gain = voice.held.gain * this.params.level
    if (voice.turn === null) {
      voice.mirror = null
    } else if (before?.note !== foldNote(voice.turn)) {
      // One with no level would silence a held note of its pitch.
      voice.mirror = gain > 0 ? this.mirrorAt(foldNote(voice.turn), gain) : null
      voice.mirrorSec = this.now
      voice.mirrorGain = gain
    }
    if (before !== voice.mirror) this.letGo(before)
  }

  /** A mirror begun, or one with a note as hard that was played in the same strike. */
  private mirrorAt(pitch: number, gain: number): MadeNote {
    for (const { own, ownSec, held } of this.apart ? [] : this.voices.values()) {
      const near = own?.note === pitch && this.now - ownSec < STRIKE_SEC
      if (near && held.gain >= gain) return this.share(own)
    }
    return this.start(pitch, gain, 'mirror')
  }

  /** A note held once more without being struck again. */
  private share(made: MadeNote): MadeNote {
    this.shared.set(made, (this.shared.get(made) ?? 0) + 1)
    return made
  }

  /** Let go of a note; one that is shared ends with the last who holds it. */
  private letGo(made: MadeNote | null): void {
    const more = made ? (this.shared.get(made) ?? 0) : 0
    if (!made || more === 0) this.end(made)
    else if (more === 1) this.shared.delete(made)
    else this.shared.set(made, more - 1)
  }
}

export const MIRROR_ON_D: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'mirror-on-d',
  name: 'Mirror on D',
  description:
    'Turns what is played upside down round the note its scale reads the same from both ways: major turns minor, rising turns falling, and nothing leaves the key.',
  kind: 'answers',
  version: 1,
  params: PARAMS,
  parts: [{ id: 'mirror', name: 'Mirror', description: 'The notes that were turned.' }],
  timed: { delay: 'time', rest: 'time' },
  presets: {
    'Both ways': {},
    'Upside down': { mode: 0, level: 1 },
    'In its own place': { mode: 0, level: 1, fold: 3, foldBy: 1 },
    'The line falls': { mode: 0, level: 0.9, fold: 2 },
    'The bass stays': { mode: 0, turns: 1, level: 0.85 },
    'The bass rises': { mode: 1, turns: 2, level: 0.45 },
    'Far side': { axis: 1, level: 0.45 },
    'High water': { octave: 5, level: 0.35, delay: 0.12 },
    'A deeper root': { octave: 3, axis: 1, turns: 1, level: 0.5 },
    'Faint inner voices': { fold: 3, foldBy: 1, level: 0.35 },
    'Fold by the phrase': { fold: 3, level: 0.55, delay: 0.25 },
    'A second behind': { delay: 1, level: 0.6 },
    'Slow ripple': { delay: 4, fold: 1, level: 0.5 },
    'Reflected sky': { octave: 5, turns: 2, delay: 0.5, level: 0.4 },
    'Canon over a bass': { turns: 1, delay: 2, fold: 2, level: 0.65 },
    'Say and answer': { mode: 2, level: 0.8 },
    'Answer in place': { mode: 2, level: 0.8, fold: 3, foldBy: 1 },
    'Three sides': { mode: 2, round: 1, level: 0.85, rest: 0.3 },
    'Long breaths': { mode: 2, rest: 1.5, octave: 5, fold: 1, level: 0.75 },
    'Every other chord': { mode: 2, strikes: 1, rest: 4, fold: 2, foldBy: 1, level: 0.9 },
    'Three at a time': { mode: 2, strikes: 3, fold: 2, round: 1, level: 0.85 },
    'Answer over a bass': { mode: 2, turns: 1, strikes: 2, level: 0.8, axis: 1, fold: 1 },
  },
  create: (options?: MakerOptions) => new MirrorOnD(MIRROR_ON_D, options),
}
