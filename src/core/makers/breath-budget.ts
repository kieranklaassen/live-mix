// Breath Budget: every held note is a voice with so many seconds of air, and
// a loud note spends it faster. A voice of gain 0.35 lasts as long as its
// lung, one twice as loud half as long. When the air is gone the voice stops,
// takes a breath and comes back, on the same note or on another of the chord.
// Nothing of the breath itself is heard: it is a gap in the note.
//
// The voices of a chord are a section that agrees never to breathe together.
// A voice stops only when so few are silent and the stop before was so long
// ago. The turns are planned from the last to the first: where two voices
// would run out too close together, the one that is due first goes early. A
// chord of two notes or more always has one that sings.
//
// A section can be too big for its air. Then, in this order: breaths become
// shorter, down to a catch breath; every voice holds on past its air, by a
// quarter of it at the most; the stops come closer together. A voice that
// lost its turn sings on until the next one is free, which is about a breath
// later. Only where all of that is not enough, such as ten loud voices with
// lungs of two seconds, does it wait however long that is: the number silent
// at once is never passed.

import { above, classNear, degreeClass, inKey, stepFrom } from './key'
import { foldNote, MakerBase, type HeldNote, type MadeNote, type TaskHandle } from './base'
import { MakerRandom } from './random'
import { type MakerOptions, type NoteMakerDescriptor } from './types'

const PARAMS = {
  lung: {
    id: 0,
    name: 'Lung',
    min: 2,
    max: 40,
    default: 14,
    taper: 'log',
    unit: 's',
    description:
      'How long a soft note (0.35) lasts on one breath. A note twice as loud lasts half as long.',
  },
  breath: {
    id: 1,
    name: 'Breath',
    min: 0.2,
    max: 6,
    default: 1.4,
    taper: 'log',
    unit: 's',
    description:
      'How long a voice is silent before it comes back. Shorter by itself when a section has too many voices to take turns.',
  },
  weight: {
    id: 2,
    name: 'Loud spends',
    min: 0,
    max: 2,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'How much loudness costs. At 1 twice as loud lasts half as long, at 0 every voice lasts the same, at 2 twice as loud lasts a quarter.',
  },
  register: {
    id: 3,
    name: 'High spends',
    min: -1,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'How much height costs, from the root near middle C: at 1 an octave higher lasts half as long and an octave lower twice, at -1 the other way.',
  },
  vary: {
    id: 4,
    name: 'Vary',
    min: 0,
    max: 0.6,
    default: 0.2,
    taper: 'linear',
    unit: '',
    description: 'How much one breath differs from another in how long it lasts, as a share of it.',
  },
  scatter: {
    id: 5,
    name: 'Start scatter',
    min: 0,
    max: 0.9,
    default: 0.75,
    taper: 'linear',
    unit: '',
    description:
      'How far apart the first breaths of a chord are: the share of its air a voice may begin without. The first note always begins with all of it.',
  },
  gap: {
    id: 6,
    name: 'Apart',
    min: 0,
    max: 6,
    default: 1,
    taper: 'linear',
    unit: 's',
    description:
      'The least time from one voice stopping to the next, so the chord never lets go together.',
  },
  most: {
    id: 7,
    name: 'Silent at once',
    min: 1,
    max: 6,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'How many voices may be taking a breath at one time. One of a chord always sings, whatever this says.',
  },
  back: {
    id: 8,
    name: 'Return',
    min: 0,
    max: 5,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Same', 'Next', 'Below', 'Octave', 'Neighbour', 'Any'],
    description:
      'Where a voice comes back: its own note, the next free chord note up or down, its own in another octave, a step of the key away and home, or any.',
  },
  reach: {
    id: 9,
    name: 'Reach',
    min: 0,
    max: 2,
    default: 1,
    taper: 'linear',
    unit: 'oct',
    step: 1,
    description:
      'How many octaves over the highest note held a voice may come back. At zero the chord turns over inside itself.',
  },
  bass: {
    id: 10,
    name: 'Bass',
    min: 0,
    max: 1,
    default: 1,
    taper: 'linear',
    unit: '',
    choices: ['Moves', 'Stays'],
    description:
      'Whether the lowest voice moves as the others do, or always comes back on its own note and keeps the chord standing on it.',
  },
  level: {
    id: 11,
    name: 'Return level',
    min: 0.2,
    max: 1,
    default: 0.9,
    taper: 'linear',
    unit: '',
    description:
      'How loud a voice comes back, as a share of how it was played. A softer one lasts longer.',
  },
} as const satisfies NoteMakerDescriptor['params']

/** The loudness at which a voice lasts exactly as long as its lung. */
const SOFT = 0.35
/** The shortest a breath is made when a section has too many voices to take turns. */
const CATCH_SEC = 0.35
/** How far past its air a voice holds on before the stops of a section come closer, as a share of it. */
const MOST_STRETCH = 0.25
/** How full the turns of a section may be: a little room, so that unlike lungs still fit. */
const FULLEST = 0.95
/** A voice sings at least this long before a breath, so quick playing is left alone (half its air if that is less). */
const LEAST_SEC = 1
/** How long after a key moved the voices that no longer fit are moved: a hand lifts its keys one by one. */
const GATHER_SEC = 0.08
/** How full a breath that is cut short leaves a voice at the least. */
const LEAST_FILL = 0.3
/** Spreads any number of voices evenly: each next one falls in the widest gap left. */
const GOLDEN = 0.6180339887498949

/** The choices of `back`, by what they are. */
const SAME = 0
const BELOW = 2
const OCTAVE = 3
const NEIGHBOUR = 4
const ANY = 5

/** One pitch held: a singer. Two keys of one pitch are one. */
interface Voice {
  /** The note that was played, where an instrument can play it. */
  readonly home: number
  readonly keys: Set<number>
  /** Which of the section it is, in the order they came. */
  readonly order: number
  /** As it was played. */
  gain: number
  /** As it sings now. */
  sung: number
  /** Where it sings, or sang before the breath it is taking. */
  pitch: number
  made: MadeNote | null
  startedAt: number
  /** Seconds a whole breath lasts it, at what it sings. */
  life: number
  /** How this breath differs from the mean of them. */
  factor: number
  /** When its air is gone. */
  airEnd: number
  /** How often it has come back. */
  phrase: number
  leftAt: number
  backAt: number
  backTask: TaskHandle | null
  /** The breath it takes began while others sang. */
  covered: boolean
}

/** How a section shares its turns: how long a breath is, how far apart the stops are, how far air is stretched. */
interface Pace {
  breath: number
  gap: number
  stretch: number
}

/** The largest value from `low` to `high` for which `holds`, which is true up to some point and false after. */
function largest(low: number, high: number, holds: (value: number) => boolean): number {
  if (holds(high)) return high
  let under = low
  let over = high
  for (let i = 0; i < 24; i += 1) {
    const middle = (under + over) / 2
    if (holds(middle)) under = middle
    else over = middle
  }
  return under
}

class BreathBudget extends MakerBase {
  private readonly voices = new Map<number, Voice>()
  private random = new MakerRandom(1)
  private count = 0
  private lastStop = -Infinity
  private turn: TaskHandle | null = null
  private gathering: TaskHandle | null = null

  protected onNote(atSec: number, held: HeldNote): void {
    const home = foldNote(held.note)
    const there = this.voices.get(home)
    if (there) {
      // The key again: it is struck again, on its own note and with new air.
      there.keys.add(held.id)
      there.gain = held.gain
      this.restart(there, atSec, home, held.gain)
    } else {
      if (this.voices.size === 0) {
        this.count = 0
        this.lastStop = -Infinity
      }
      const voice: Voice = {
        home,
        keys: new Set([held.id]),
        order: this.count,
        gain: held.gain,
        sung: held.gain,
        pitch: home,
        made: null,
        startedAt: atSec,
        life: 0,
        factor: 1,
        airEnd: 0,
        phrase: 0,
        leftAt: 0,
        backAt: 0,
        backTask: null,
        covered: false,
      }
      this.count += 1
      this.voices.set(home, voice)
      this.sing(voice, atSec, home, held.gain)
      const without = this.params.scatter * ((voice.order * GOLDEN) % 1)
      voice.airEnd = atSec + Math.max(this.least(voice), voice.life * (1 - without))
    }
    this.gatherSoon(atSec)
    this.plan(atSec)
  }

  protected onRelease(atSec: number, held: HeldNote): void {
    const voice = this.voices.get(foldNote(held.note))
    if (!voice?.keys.delete(held.id) || voice.keys.size > 0) return
    this.voices.delete(voice.home)
    voice.backTask?.cancel()
    this.end(voice.made)
    this.gatherSoon(atSec)
    this.plan(atSec)
  }

  protected override onParam(atSec: number, name: string): void {
    if (name === 'lung' || name === 'weight' || name === 'register') this.measure(atSec)
    if (name === 'breath') {
      for (const voice of this.voices.values()) {
        if (voice.made) continue
        const sooner = Math.max(atSec, voice.leftAt + this.params.breath)
        if (sooner < voice.backAt) this.returnAt(voice, sooner)
      }
    }
    this.plan(atSec)
  }

  protected override onKey(atSec: number): void {
    this.measure(atSec)
    this.gatherSoon(atSec)
    this.plan(atSec)
  }

  protected override onSilence(): void {
    this.voices.clear()
    this.random = new MakerRandom(1)
    this.count = 0
    this.lastStop = -Infinity
    this.turn = null
    this.gathering = null
  }

  // --- Singing and breathing ------------------------------------------------

  /** How long a whole breath lasts a voice at a loudness and a pitch, in seconds. */
  private lifeAt(gain: number, pitch: number): number {
    const { lung, weight, register } = this.params
    const middle = classNear(degreeClass(this.key, 0), 60)
    const life =
      lung * (SOFT / Math.max(0.05, gain)) ** weight * 2 ** ((-register * (pitch - middle)) / 12)
    return Math.min(180, Math.max(0.5, life))
  }

  /** A voice begins a note with its lungs full. */
  private sing(voice: Voice, atSec: number, pitch: number, gain: number): void {
    const { vary } = this.params
    voice.pitch = pitch
    voice.sung = gain
    voice.startedAt = atSec
    voice.factor = 1 + vary * (2 * this.random.next() - 1)
    voice.life = this.lifeAt(gain, pitch) * voice.factor
    voice.airEnd = atSec + voice.life
    voice.made = this.start(pitch, gain, this.partOf(voice))
  }

  /** Every second voice, and of the others every second phrase, may have an instrument of its own. */
  private partOf(voice: Voice): string | undefined {
    if (voice.order % 2 === 1) return 'second'
    return voice.phrase % 2 === 1 ? 'relief' : undefined
  }

  /** A voice goes to another pitch, or is struck again, with no breath between. */
  private restart(voice: Voice, atSec: number, pitch: number, gain: number): void {
    const before = voice.made
    voice.backTask?.cancel()
    voice.backTask = null
    // What is struck again is struck while the first still sounds, so that it is one voice.
    if (before && before.note !== pitch) this.end(before)
    this.sing(voice, atSec, pitch, gain)
    if (before?.note === pitch) this.end(before)
  }

  private stop(voice: Voice, atSec: number, breath: number): void {
    this.end(voice.made)
    voice.made = null
    voice.leftAt = atSec
    voice.covered = this.voices.size > 1
    this.lastStop = atSec
    this.returnAt(voice, atSec + breath)
    this.plan(atSec)
  }

  private returnAt(voice: Voice, atSec: number): void {
    voice.backTask?.cancel()
    voice.backAt = atSec
    voice.backTask = this.at(atSec, (at) => {
      this.comeBack(voice, at)
      this.plan(at)
    })
  }

  private comeBack(voice: Voice, atSec: number): void {
    voice.backTask = null
    voice.phrase += 1
    this.sing(voice, atSec, this.backTo(voice), voice.gain * this.params.level)
  }

  /** How long a voice sings at the least before it stops. */
  private least(voice: Voice): number {
    return Math.min(LEAST_SEC, voice.life / 2)
  }

  /** The controls moved: what is left of every breath is the same share of a new whole. */
  private measure(atSec: number): void {
    for (const voice of this.voices.values()) {
      if (!voice.made) continue
      const share = (voice.airEnd - atSec) / voice.life
      voice.life = this.lifeAt(voice.sung, voice.pitch) * voice.factor
      voice.airEnd = atSec + share * voice.life
    }
  }

  // --- Taking turns -----------------------------------------------------------

  /** How many may be silent at once: of a chord one always sings. */
  private mostSilent(): number {
    return Math.max(1, Math.min(this.params.most, this.voices.size - 1))
  }

  private pace(): Pace {
    const { breath, gap, level } = this.params
    if (this.voices.size < 2) return { breath, gap: 0, stretch: 0 }
    const lives = [...this.voices.values()].map((voice) =>
      this.lifeAt(voice.gain * level, voice.home),
    )
    const turns = this.mostSilent() * FULLEST
    /** Stops a second, with breaths so long and air stretched so far. */
    const rate = (each: number, stretch: number): number =>
      lives.reduce((sum, life) => sum + 1 / (life * (1 + stretch) + each), 0)
    const each = largest(Math.min(CATCH_SEC, breath), breath, (b) => b * rate(b, 0) <= turns)
    const fits = (stretch: number): boolean =>
      each * rate(each, stretch) <= turns && gap * rate(each, stretch) <= FULLEST
    const stretch =
      MOST_STRETCH - largest(0, MOST_STRETCH, (room) => fits(MOST_STRETCH - room) || room === 0)
    return { breath: each, gap: Math.min(gap, FULLEST / rate(each, stretch)), stretch }
  }

  /** Who stops next, and when. */
  private plan(atSec: number): void {
    this.turn?.cancel()
    this.turn = null
    const singing = [...this.voices.values()].filter((voice) => voice.made)
    if (singing.length === 0) return
    const pace = this.pace()
    const due: { voice: Voice | null; atSec: number; order: number }[] = singing.map((voice) => ({
      voice,
      atSec: voice.airEnd + voice.life * pace.stretch,
      order: voice.order,
    }))
    let silent = 0
    let soonest = Infinity
    for (const voice of this.voices.values()) {
      if (voice.made) continue
      silent += 1
      soonest = Math.min(soonest, voice.backAt)
      // One that takes a breath will want its next turn too.
      const life = this.lifeAt(voice.gain * this.params.level, voice.pitch)
      due.push({ voice: null, atSec: voice.backAt + life, order: voice.order })
    }
    due.sort((a, b) => a.atSec - b.atSec || a.order - b.order)

    // From the last to the first: each as late as its air and those after it let it be.
    const most = this.mostSilent()
    for (let i = due.length - 2; i >= 0; i -= 1) {
      due[i].atSec = Math.min(
        due[i].atSec,
        due[i + 1].atSec - pace.gap,
        i + most < due.length ? due[i + most].atSec - pace.breath : Infinity,
      )
    }
    const first = due.find((turn) => turn.voice)
    if (!first) return
    let target = Math.max(atSec, first.atSec, this.lastStop + pace.gap)
    if (silent >= most) target = Math.max(target, soonest)

    let who: Voice | null = null
    let when = Infinity
    for (const { voice } of due) {
      if (!voice) continue
      const may = Math.max(target, voice.startedAt + this.least(voice))
      if (may < when - 1e-9) {
        who = voice
        when = may
      }
    }
    if (who === null) return
    const next = who
    this.turn = this.at(when, (at) => {
      this.turn = null
      this.stop(next, at, pace.breath)
    })
  }

  // --- Where a voice comes back --------------------------------------------------

  /** The pitches others sing. */
  private taken(voice: Voice): Set<number> {
    const taken = new Set<number>()
    for (const other of this.voices.values())
      if (other !== voice && other.made) taken.add(other.pitch)
    return taken
  }

  /** Every note of the chord from the lowest held to as far over the highest as voices may go. */
  private rungs(): number[] {
    const homes = [...this.voices.keys()]
    const low = Math.min(...homes)
    const high = Math.max(...homes)
    const ceiling = Math.max(high, classNear(degreeClass(this.key, 0), 96))
    const top = Math.min(high + 12 * this.params.reach, ceiling)
    const rungs = new Set<number>()
    for (const home of homes) {
      for (let note = above([home % 12], low, true); note <= top; note += 12) rungs.add(note)
    }
    if (this.params.bass === 1) rungs.delete(low)
    return [...rungs].sort((a, b) => a - b)
  }

  /** Two notes that rub: a minor ninth, or less than a fourth apart where it is low, or a second not much higher. */
  private rubs(note: number, others: ReadonlySet<number>): boolean {
    const low = classNear(degreeClass(this.key, 0), 48)
    for (const other of others) {
      const apart = Math.abs(note - other)
      if (apart === 13) return true
      if (apart === 0) continue
      const lower = Math.min(note, other)
      if ((apart < 5 && lower < low) || (apart < 3 && lower < low + 9)) return true
    }
    return false
  }

  private backTo(voice: Voice): number {
    const { home, pitch } = voice
    const homes = [...this.voices.keys()]
    const isBass = home === Math.min(...homes)
    if (isBass && this.params.bass === 1) return home
    const taken = this.taken(voice)
    const rungs = this.rungs()
    const found = this.move(voice, rungs, taken)
    if (found !== undefined) return found
    if (!taken.has(pitch) && rungs.includes(pitch)) return pitch
    return this.freeHome(voice, rungs, taken)
  }

  /** The note the rule of return sends a voice to, where there is one that suits. */
  private move(
    { home, pitch }: Voice,
    rungs: readonly number[],
    taken: ReadonlySet<number>,
  ): number | undefined {
    const { back } = this.params
    const suits = (note: number): boolean => !taken.has(note) && !this.rubs(note, taken)
    if (back === SAME || (back === NEIGHBOUR && pitch !== home))
      return taken.has(home) ? undefined : home
    if (back === NEIGHBOUR) {
      return [stepFrom(this.key, home, 1), stepFrom(this.key, home, -1)].find(
        (note) => suits(note) && !taken.has(note - 1) && !taken.has(note + 1),
      )
    }
    if (back === ANY) {
      const free = rungs.filter((note) => note !== pitch && suits(note))
      if (free.length === 0) return undefined
      return this.random.weighted(free, (note) => 1 / (2 + Math.abs(note - pitch)))
    }
    const own = back === OCTAVE ? rungs.filter((note) => (note - home) % 12 === 0) : rungs
    const on = back === BELOW ? [...own].reverse() : own
    const past = on.filter((note) => (back === BELOW ? note < pitch : note > pitch))
    // No further than an octave, and it waits while others have all of that; past the end it
    // begins again at the other.
    const near = past.filter((note) => Math.abs(note - pitch) <= 12 && !this.rubs(note, taken))
    return near.length > 0 ? near.find((note) => !taken.has(note)) : on.find(suits)
  }

  /** A voice's own note, or where another has it the chord note nearest to it that is free. */
  private freeHome({ home }: Voice, rungs: readonly number[], taken: ReadonlySet<number>): number {
    if (!taken.has(home)) return home
    let best = home
    let distance = Infinity
    for (const note of rungs) {
      const away = Math.abs(note - home)
      if (taken.has(note) || away >= distance) continue
      best = note
      distance = away
    }
    return best
  }

  // --- After a key moved ---------------------------------------------------------

  private gatherSoon(atSec: number): void {
    this.gathering?.cancel()
    this.gathering = this.at(atSec + GATHER_SEC, (at) => {
      this.gathering = null
      this.gather(at)
      this.plan(at)
    })
  }

  /** Voices that moved and no longer fit what is held go home; a section left all in a breath has one back. */
  private gather(atSec: number): void {
    const all = [...this.voices.values()]
    const singing = all.filter((voice) => voice.made)
    for (const voice of singing) {
      const taken = this.taken(voice)
      if (voice.pitch === voice.home || this.fits(voice.pitch, taken)) continue
      const { startedAt, airEnd, life } = voice
      const share = (airEnd - atSec) / life
      this.restart(voice, atSec, this.freeHome(voice, this.rungs(), taken), voice.sung)
      // It moves on the air it has.
      voice.airEnd = atSec + share * voice.life
      voice.startedAt = startedAt
    }
    if (singing.length > 0) return
    const [first] = all.filter((voice) => voice.covered).sort((a, b) => a.backAt - b.backAt)
    if (!first) return
    const share = (atSec - first.leftAt) / (first.backAt - first.leftAt)
    first.backTask?.cancel()
    this.comeBack(first, atSec)
    // A breath cut short fills it so far.
    first.airEnd = atSec + first.life * Math.max(LEAST_FILL, share)
  }

  /** Whether a voice that moved still sings a note of the chord that no other has, or a step of the key that is clear. */
  private fits(pitch: number, taken: ReadonlySet<number>): boolean {
    const homes = [...this.voices.keys()]
    if (taken.has(pitch) || pitch < Math.min(...homes)) return false
    if (homes.some((home) => (home - pitch) % 12 === 0)) return true
    if (this.params.back !== NEIGHBOUR || !inKey(this.key, pitch)) return false
    return !taken.has(pitch - 1) && !taken.has(pitch + 1)
  }
}

export const BREATH_BUDGET: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'breath-budget',
  name: 'Breath Budget',
  description:
    'Gives every held note so many seconds of air, less the louder it is, and then a breath: a held chord becomes a section that never breathes together.',
  kind: 'walks',
  version: 1,
  params: PARAMS,
  parts: [
    {
      id: 'second',
      name: 'Second desk',
      description: 'Every second voice of the section, in the order they were played.',
    },
    {
      id: 'relief',
      name: 'Relief',
      description: 'Every other breath of the voices that are not of the second desk.',
    },
  ],
  timed: { lung: 'time', breath: 'time', gap: 'time' },
  presets: {
    Section: {},
    'Six in a loft': { lung: 9, scatter: 0.9, vary: 0.25 },
    'Long lungs': { lung: 26, breath: 2.4, scatter: 0.9, vary: 0.3, gap: 2 },
    'Catch breaths': { lung: 7, breath: 0.35, gap: 0.8, vary: 0.35, level: 0.95 },
    'Turning voicing': { lung: 9, back: 1, reach: 0, breath: 1.1 },
    'Climbing choir': { lung: 7, back: 1, reach: 2, breath: 0.9, level: 0.75, scatter: 0.85 },
    'Coming down': { lung: 8, back: 2, reach: 1, breath: 1.2, scatter: 0.85, level: 0.8 },
    'Octave relay': { lung: 7, back: 3, reach: 2, breath: 0.8, level: 0.65, scatter: 0.9 },
    'Leaning notes': { lung: 8, back: 4, breath: 0.7, level: 0.8, scatter: 0.9, vary: 0.3 },
    'Change of seats': { lung: 7, back: 5, reach: 1, breath: 0.6, vary: 0.45, scatter: 0.9 },
    'High voices tire': { lung: 13, register: 0.9, scatter: 0.6, level: 0.8 },
    'Low voices tire': { lung: 12, register: -0.8, scatter: 0.6, breath: 2, bass: 0, back: 1 },
    'Loud ones tire': { lung: 22, weight: 2, breath: 1.8, gap: 1.5, level: 0.7 },
    'All lungs alike': { lung: 5, weight: 0, vary: 0, breath: 2, scatter: 0.9, gap: 1.5 },
    'Two at a time': { lung: 10, most: 2, breath: 2.6, gap: 1.3, scatter: 0.9 },
    'Half the room': { lung: 9, most: 4, breath: 4, gap: 0.5, vary: 0.5, scatter: 0.9, back: 5 },
    'Soft returns': { lung: 8, level: 0.35, breath: 1, scatter: 0.9 },
    'No floor': { lung: 8, back: 1, reach: 1, bass: 0, breath: 0.8, scatter: 0.9 },
    'One player': { lung: 5.5, breath: 0.6, vary: 0.4, scatter: 0.4, gap: 0.6, weight: 0.6 },
    'Far apart': { lung: 20, breath: 3.5, gap: 3.5, scatter: 0.9, vary: 0.1, most: 3 },
    'Bass walks': {
      lung: 10,
      register: -0.5,
      back: 3,
      reach: 1,
      bass: 0,
      breath: 1.2,
      scatter: 0.85,
    },
    'Restless hymn': {
      lung: 6,
      back: 4,
      breath: 0.4,
      gap: 0.6,
      vary: 0.5,
      level: 1,
      scatter: 0.85,
    },
  },
  create: (options?: MakerOptions) => new BreathBudget(BREATH_BUDGET, options),
}
