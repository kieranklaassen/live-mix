// Hexatonic Walker: a held chord walks by moves that change one note of a
// triad and keep the other two. P turns a chord into its parallel (C to C
// minor), L takes it across a half step (C to E minor) and R to its relative
// (C to A minor); each move undoes itself. A word of moves, said over and
// over, is the walk: P L from C is C, Cm, Ab, Abm, E, Em and C again. Three
// voices sing the chord, each to its nearest note, and a voice that stays is
// held. P and L leave the key by nature, so the walk does too unless `keep`
// holds it there. A key struck starts the walk again from the chord it makes.

import { above, classNear, mod, snapNote } from './key'
import { type HeldNote, MakerBase, type MadeNote, type TaskHandle } from './base'
import { MakerRandom } from './random'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

const PARAMS = {
  word: {
    id: 0,
    name: 'Word',
    min: 0,
    max: 10,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: [
      'P L',
      'L P',
      'R L',
      'L R',
      'P R',
      'P R R P',
      'Keep root',
      'Keep third',
      'Keep fifth',
      'Own word',
      'Wander',
    ],
    description:
      'The moves, said over and over. Keep walks the six chords that share that note of the first one. Own word repeats moves drawn from the seed; Wander goes on drawing.',
  },
  moves: {
    id: 1,
    name: 'Moves',
    min: 1,
    max: 3,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'How many moves make one change of chord. One changes one note; two and three pass over the chords between, to the far side of the cycle.',
  },
  time: {
    id: 2,
    name: 'Chord time',
    min: 0.5,
    max: 24,
    default: 4,
    taper: 'log',
    unit: 's',
    description: 'How long each chord lasts before the next move.',
  },
  rhythm: {
    id: 3,
    name: 'Rhythm',
    min: 0,
    max: 4,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Melt', 'Stagger', 'Up', 'Down', 'Rock'],
    description:
      'Melt strikes only the voice that moves. Stagger strikes it, then the voices that stay. Up, Down and Rock break the chord, beginning with the voice that moved.',
  },
  step: {
    id: 4,
    name: 'Step',
    min: 0.1,
    max: 4,
    default: 0.4,
    taper: 'log',
    unit: 's',
    description:
      'The time from one voice to the next, where they come in one after another and where the chord is broken.',
  },
  ring: {
    id: 5,
    name: 'Ring',
    min: 0.1,
    max: 1,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'In Up, Down and Rock, how long each note is held, as a share of the time to three steps later. At full it holds until its voice is struck again or moves.',
  },
  keep: {
    id: 6,
    name: 'Keep',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Free', 'Nearly', 'In key'],
    description:
      'Free leaves the key as the moves do. Nearly takes only chords with two notes in the key, In key only chords wholly in it, with another move where the word leaves.',
  },
  turn: {
    id: 7,
    name: 'Turn back',
    min: 0,
    max: 5,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Goes on', 'After 8', 'After 6', 'After 4', 'After 3', 'After 2'],
    description:
      'Whether the walk goes on, or goes back the way it came after so many changes, to the chord it began on, and out again.',
  },
  bass: {
    id: 8,
    name: 'Bass',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Off', 'Root', 'Held'],
    description:
      'A low voice under the walk: the root of each chord, or the root of the first chord held under all of them.',
  },
  top: {
    id: 9,
    name: 'Top line',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Off', 'Mover', 'Keeper'],
    description:
      'A high voice half way through each chord: the note that has just moved, or a note that stayed where it was.',
  },
  octave: {
    id: 10,
    name: 'Octave',
    min: -1,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: 'oct',
    step: 1,
    description:
      'Moves the three voices and the top line by octaves from where the chord was played. The bass stays.',
  },
  seed: {
    id: 11,
    name: 'Seed',
    min: 1,
    max: 64,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'Which word Own word repeats and which way Wander goes. The same seed walks the same way.',
  },
} as const satisfies NoteMakerDescriptor['params']

export type Move = 'P' | 'L' | 'R'

/** A major or minor triad: its root as a pitch class. */
export interface Triad {
  root: number
  minor: boolean
}

const MOVES: readonly Move[] = ['R', 'L', 'P']

const FIXED_WORDS: readonly string[] = ['PL', 'LP', 'RL', 'LR', 'PR', 'PRRP']
/** From a major chord and from a minor one: the six chords that share its root, third, fifth. */
const SHARED_WORDS: readonly (readonly [string, string])[] = [
  ['RLP', 'LRP'],
  ['RPL', 'RPL'],
  ['LRP', 'RLP'],
]
const OWN_WORD = 9
const WANDER = 10

/** After how many changes the walk turns back; 0 where it goes on. */
const TURNS: readonly number[] = [0, 8, 6, 4, 3, 2]

const MELT = 0
const STAGGER = 1
const DOWN = 3
const ROCK = 4

/** Keys this near to one another are one chord. */
const GATHER_SEC = 0.03
/** A chord let go before it was read, or just after, sounds this long. */
const SHORTEST_SEC = 0.15

/** The triad one move away. Every move undoes itself. */
export function moved({ root, minor }: Triad, move: Move): Triad {
  if (move === 'P') return { root, minor: !minor }
  if (move === 'L') return { root: mod(root + (minor ? 8 : 4), 12), minor: !minor }
  return { root: mod(root + (minor ? 3 : 9), 12), minor: !minor }
}

export function classesOf({ root, minor }: Triad): [number, number, number] {
  return [root, mod(root + (minor ? 3 : 4), 12), mod(root + 7, 12)]
}

function same(a: Triad, b: Triad): boolean {
  return a.root === b.root && a.minor === b.minor
}

/** How many of a triad's notes are in the key. */
export function inKeyCount(key: MakerKey, triad: Triad): number {
  return classesOf(triad).filter((c) => key.steps.includes(mod(c - key.root, 12))).length
}

/** A key that was played, for reading a chord: `fresh` where others were held before it. */
export interface HeardKey {
  note: number
  fresh: boolean
}

/**
 * The major or minor triad some keys are taken for. One with all of them in
 * it, on the lowest of them where it can be, with the rest of its notes from
 * the key: C alone is C major, D and A are D minor on the white keys. What
 * was just struck counts for more than what was held before. `need` asks for
 * so many of its notes in the key, as far as there is one.
 */
export function readTriad(key: MakerKey, keys: readonly HeardKey[], need: number): Triad {
  const heard = keys.map(({ note, fresh }) => ({
    note: need === 3 ? snapNote(key, note) : Math.round(note),
    fresh,
  }))
  const weights = new Map<number, number>()
  for (const { note, fresh } of heard) {
    const pitchClass = mod(note, 12)
    weights.set(pitchClass, Math.max(weights.get(pitchClass) ?? 0, fresh ? 7 : 4))
  }
  const lowest = mod(Math.min(...heard.map(({ note }) => note)), 12)
  const onLowest = weights.size === 1 ? 3.5 : 2.5
  let best: Triad = { root: lowest, minor: false }
  let bestScore = -Infinity
  // Counted from the key's root, so another key decides the same way.
  for (let i = 0; i < 24; i += 1) {
    const triad = { root: mod(key.root + (i >> 1), 12), minor: i % 2 === 1 }
    let score = -10 * Math.max(0, need - inKeyCount(key, triad))
    if (triad.root === lowest) score += onLowest
    for (const pitchClass of classesOf(triad)) {
      const weight = weights.get(pitchClass)
      score += weight ?? (key.steps.includes(mod(pitchClass - key.root, 12)) ? 1 : -2)
    }
    if (score > bestScore + 1e-9) {
      best = triad
      bestScore = score
    }
  }
  return best
}

/** The triad in close position, low to high, whose middle lies nearest to `centre`. */
export function closeVoicing(triad: Triad, centre: number): [number, number, number] {
  const classes = classesOf(triad)
  let best: [number, number, number] = [0, 0, 0]
  let distance = Infinity
  const floor = Math.floor(centre) - 18
  for (const pitchClass of classes) {
    for (let octave = 0; octave < 3; octave += 1) {
      const low = above([pitchClass], floor, true) + 12 * octave
      const others = classes
        .filter((other) => other !== pitchClass)
        .map((other) => above([other], low))
        .sort((a, b) => a - b)
      const away = Math.abs((low + others[0] + others[1]) / 3 - centre)
      if (away < distance - 1e-9) {
        best = [low, others[0], others[1]]
        distance = away
      }
    }
  }
  return best
}

interface Voice {
  /** Where the voice is in the chord. */
  pitch: number
  /** What it sounds, which in a broken chord may be nothing. */
  made: MadeNote | null
  sounds: number
  /** Where a note of a broken chord ends by itself. */
  ring: TaskHandle | null
}

class HexatonicWalker extends MakerBase {
  private voices: Voice[] = []
  private chord: Triad | null = null
  private before: Triad | null = null
  private first: Triad = { root: 0, minor: false }
  /** Where the middle of the voices is kept. */
  private centre = 0
  private shift = 0
  private gain = 0.8
  private spoken = 0
  private lastMove: Move | null = null
  private own = ''
  private random = new MakerRandom(1)
  /** The changes made since the walk began or last came home, for the way back. */
  private path: Move[][] = []
  private returning = false
  private changedAt = 0
  private begunAt = 0
  private bassNote: MadeNote | null = null
  private bassAt = NaN
  private topNote: MadeNote | null = null
  private struck: HeldNote[] = []
  private gathering = false
  private change: TaskHandle | null = null
  private later: TaskHandle[] = []
  private topTask: TaskHandle | null = null
  private letGo: TaskHandle | null = null
  /** The note last struck of a chord that is broken; null where chords are not. */
  private broken: { atSec: number; order: readonly number[]; count: number } | null = null

  // --- What is played -----------------------------------------------------------

  protected onNote(atSec: number, held: HeldNote): void {
    this.struck.push(held)
    if (this.gathering) return
    this.gathering = true
    this.at(atSec + GATHER_SEC, (at) => this.begin(at))
  }

  protected onRelease(atSec: number): void {
    if (this.held.size === 0 && !this.gathering) this.finish(atSec)
  }

  protected override onSilence(): void {
    this.stop()
    this.struck = []
    this.gathering = false
  }

  protected override onParam(atSec: number, name: string): void {
    if (!this.chord) return
    if (name === 'word' || name === 'seed') this.startWord(this.chord)
    if (name === 'turn') {
      this.path = []
      this.returning = false
    }
    if (name === 'time') this.await(atSec)
    if (name === 'time' || name === 'step') this.awaitStep(atSec)
    if (name === 'octave') {
      const by = 12 * (this.params.octave - this.shift)
      this.shift = this.params.octave
      this.centre += by
      for (const voice of this.voices) voice.pitch += by
    }
    if (name === 'bass') this.layBass(false)
    if (name === 'top') {
      if (this.params.top === 0) this.endTop()
      else this.awaitTop(atSec, [])
    }
    if (name === 'rhythm' || name === 'octave') this.lay(atSec, [])
  }

  // --- The walk -------------------------------------------------------------------

  private get need(): number {
    return [0, 2, 3][this.params.keep]
  }

  /** The chord that is played starts the walk. */
  private begin(atSec: number): void {
    const struck = this.struck
    this.struck = []
    this.gathering = false
    const playing = new Map([...this.held.values(), ...struck].map((held) => [held.id, held]))
    const fresh = new Set(struck.map((held) => held.id))
    // A whole chord struck over another is that chord.
    const whole = new Set(struck.map((held) => mod(Math.round(held.note), 12))).size >= 3
    const read = whole ? struck : [...playing.values()]
    const newer = fresh.size < read.length
    this.chord = readTriad(
      this.key,
      read.map(({ id, note }) => ({ note, fresh: newer && fresh.has(id) })),
      this.need,
    )
    this.first = this.chord
    this.before = null
    this.path = []
    this.returning = false
    this.gain = read.reduce((sum, held) => sum + held.gain, 0) / read.length
    this.shift = this.params.octave
    // The middle of the hand, brought by octaves to where a chord is clear.
    const home = classNear(this.key.root, 60)
    let middle = read.reduce((sum, held) => sum + Math.round(held.note), 0) / read.length
    while (middle < home - 5) middle += 12
    while (middle > home + 19) middle -= 12
    this.centre = middle + 12 * this.shift
    this.place(closeVoicing(this.chord, this.centre))
    this.startWord(this.chord)
    this.begunAt = atSec
    this.changedAt = atSec
    this.layBass(true)
    this.lay(atSec, [])
    this.awaitTop(atSec, [])
    this.await(atSec)
    this.letGo?.cancel()
    if (this.held.size === 0) this.finish(atSec)
  }

  /** The last key is up: the end of it, when the chord has sounded for long enough to be one. */
  private finish(atSec: number): void {
    this.letGo?.cancel()
    const end = (): void => {
      if (this.held.size === 0 && !this.gathering) this.stop()
    }
    const at = this.begunAt + SHORTEST_SEC
    if (at <= atSec) end()
    else this.letGo = this.at(at, end)
  }

  /** The voices on a new chord: one that sounds a note of it keeps that note, and the others are let go. */
  private place(pitches: readonly number[]): void {
    const open = [...pitches]
    const free: Voice[] = []
    for (const voice of this.voices) {
      const at = voice.made ? open.indexOf(voice.sounds) : -1
      if (at >= 0) [voice.pitch] = open.splice(at, 1)
      else free.push(voice)
    }
    for (const pitch of open) {
      const voice = free.shift() ?? { pitch, made: null, sounds: NaN, ring: null }
      if (!this.voices.includes(voice)) this.voices.push(voice)
      this.hush(voice)
      voice.pitch = pitch
    }
  }

  private stop(): void {
    this.change?.cancel()
    this.change = null
    this.cancelLater()
    this.broken = null
    this.endTop()
    this.end(this.bassNote)
    this.bassNote = null
    this.bassAt = NaN
    for (const voice of this.voices) this.hush(voice)
    this.voices = []
    this.chord = null
  }

  private await(atSec: number): void {
    this.change?.cancel()
    this.change = this.at(Math.max(atSec, this.changedAt + this.params.time), (at) => this.walk(at))
  }

  /** The next chord. */
  private walk(atSec: number): void {
    const was = this.chord
    if (!was) return
    const home = this.voices.map((voice) => voice.pitch)
    const turn = TURNS[this.params.turn]
    if (this.returning) {
      for (const move of [...(this.path.pop() ?? [])].reverse()) this.go(move)
      if (this.path.length === 0) {
        this.returning = false
        this.spoken = 0
        this.lastMove = null
      }
    } else {
      const taken: Move[] = []
      for (let i = 0; i < this.params.moves; i += 1) {
        const move = this.choose()
        if (!move) continue
        taken.push(move)
        this.go(move)
      }
      if (turn > 0) {
        this.path.push(taken)
        this.returning = this.path.length >= turn
      }
    }
    const changed = this.voices.map((_, i) => i).filter((i) => this.voices[i].pitch !== home[i])
    this.changedAt = atSec
    this.layBass(this.params.rhythm !== MELT)
    this.lay(atSec, changed)
    this.awaitTop(atSec, changed)
    this.await(atSec)
  }

  private startWord(chord: Triad): void {
    const { word, seed } = this.params
    this.spoken = 0
    this.lastMove = null
    this.random = new MakerRandom(seed * 7919)
    if (word < FIXED_WORDS.length) this.own = FIXED_WORDS[word]
    else if (word < OWN_WORD)
      this.own = SHARED_WORDS[word - FIXED_WORDS.length][chord.minor ? 1 : 0]
    else {
      const letters: Move[] = []
      const count = 3 + this.random.below(4)
      while (letters.length < count) {
        // The last is not the first either: the word is said round and round.
        const not = [letters.at(-1), letters.length === count - 1 ? letters[0] : undefined]
        const open = MOVES.filter((move) => !not.includes(move))
        letters.push(open[this.random.below(open.length)])
      }
      this.own = letters.join('')
    }
  }

  /** The move the word says next, or the one `keep` puts in its place; none where every move leaves. */
  private choose(): Move | null {
    const { chord, before, need } = this
    if (!chord) return null
    let said: Move
    if (this.params.word === WANDER) {
      const open = MOVES.filter((move) => move !== this.lastMove)
      said = open[this.random.below(open.length)]
    } else said = this.own[mod(this.spoken, this.own.length)] as Move
    this.spoken += 1
    const twice = said === this.lastMove
    this.lastMove = said
    if (need === 0) return said
    const all = [said, ...MOVES.filter((move) => move !== said)]
    const count = (move: Move): number => inKeyCount(this.key, moved(chord, move))
    let open = all.filter((move) => count(move) >= need)
    if (open.length === 0) {
      if (inKeyCount(this.key, chord) >= need) return null
      const most = Math.max(...all.map(count))
      open = all.filter((move) => count(move) === most)
    }
    const back = (move: Move): boolean => before !== null && same(moved(chord, move), before)
    if (open[0] === said && twice) return said
    return open.find((move) => !back(move)) ?? open[0]
  }

  /** One move: the voice whose note is no longer in the chord goes to the nearest note that is. */
  private go(move: Move): void {
    const { chord } = this
    if (!chord) return
    const next = moved(chord, move)
    const classes = classesOf(next)
    const old = classesOf(chord)
    this.before = chord
    this.chord = next
    const voice = this.voices.find(({ pitch }) => !classes.includes(mod(pitch, 12)))
    const to = classes.find((pitchClass) => !old.includes(pitchClass))
    if (!voice || to === undefined) return
    const up = mod(to - voice.pitch, 12)
    const others = this.voices.filter((other) => other !== voice).map(({ pitch }) => pitch)
    let pitch = voice.pitch + (up > 6 ? up - 12 : up)
    // A walk that climbs for ever does not: the outer voice changes ends.
    const middle = (others[0] + others[1] + pitch) / 3
    if (middle > this.centre + 5 && pitch > Math.max(...others)) pitch -= 12
    else if (middle < this.centre - 5 && pitch < Math.min(...others)) pitch += 12
    voice.pitch = pitch
  }

  // --- The voices -----------------------------------------------------------------

  private cancelLater(): void {
    for (const task of this.later) task.cancel()
    this.later = []
  }

  private hush(voice: Voice): void {
    voice.ring?.cancel()
    voice.ring = null
    this.end(voice.made)
    voice.made = null
    voice.sounds = NaN
  }

  private strike(voice: Voice, gain: number): void {
    this.hush(voice)
    voice.made = this.start(voice.pitch, gain)
    voice.sounds = voice.pitch
  }

  /** Begin the chord as it stands now, `changed` being the voices that have just moved. */
  private lay(atSec: number, changed: readonly number[]): void {
    this.cancelLater()
    this.broken = null
    const { rhythm, step, time } = this.params
    const byPitch = this.voices
      .map((_, i) => i)
      .sort((a, b) => this.voices[a].pitch - this.voices[b].pitch)
    const first = byPitch.filter((i) => changed.includes(i))
    const stay = byPitch.filter((i) => !changed.includes(i))
    if (rhythm > STAGGER) {
      this.breakChord(atSec, byPitch, first[0] ?? byPitch[rhythm === DOWN ? 2 : 0])
      return
    }
    for (const voice of this.voices) voice.ring?.cancel()
    const gap = Math.min(step, time / 4)
    const order = [...first, ...stay].filter((i) => {
      const voice = this.voices[i]
      // In Melt a voice on its note already is left to sound.
      return rhythm === STAGGER || voice.made === null || voice.sounds !== voice.pitch
    })
    order.forEach((i, rank) => {
      const voice = this.voices[i]
      const gain = this.gain * (rhythm === STAGGER && rank > 0 && changed.length > 0 ? 0.75 : 1)
      if (rank === 0) this.strike(voice, gain)
      else this.later.push(this.at(atSec + rank * gap, () => this.strike(voice, gain)))
    })
  }

  private breakChord(atSec: number, byPitch: readonly number[], lead: number): void {
    const { rhythm } = this.params
    for (const voice of this.voices) if (voice.sounds !== voice.pitch) this.hush(voice)
    let order = byPitch
    if (rhythm === DOWN) order = [...byPitch].reverse()
    const from = order.indexOf(lead)
    order = [...order.slice(from), ...order.slice(0, from)]
    if (rhythm === ROCK) {
      const [low, high] = byPitch.filter((i) => i !== lead)
      order = [lead, high, low, high]
    }
    this.sound(atSec, order, 0)
  }

  private sound(atSec: number, order: readonly number[], count: number): void {
    const { step, ring } = this.params
    const voice = this.voices[order[count % order.length]]
    this.strike(voice, this.gain * (count === 0 ? 1 : 0.75))
    if (ring < 1) {
      voice.ring = this.at(atSec + Math.max(0.05, ring * 3 * step), () => this.hush(voice))
    }
    this.broken = { atSec, order, count }
    this.awaitStep(atSec)
  }

  /** The next note of a broken chord. One that would fall just before the next chord is left to it. */
  private awaitStep(atSec: number): void {
    const { broken } = this
    if (!broken) return
    const { step, time } = this.params
    this.cancelLater()
    const next = Math.max(atSec, broken.atSec + step)
    if (this.changedAt + time - next < 0.4 * step) return
    this.later = [this.at(next, (at) => this.sound(at, broken.order, broken.count + 1))]
  }

  private layBass(again: boolean): void {
    const { bass } = this.params
    if (!this.chord || bass === 0) {
      this.end(this.bassNote)
      this.bassNote = null
      this.bassAt = NaN
      return
    }
    const { root } = bass === 1 ? this.chord : this.first
    const pitch = above([root], classNear(this.key.root, 36) - 5, true)
    if (pitch === this.bassAt && !again) return
    this.end(this.bassNote)
    this.bassNote = this.start(pitch, this.gain * 0.9, 'bass')
    this.bassAt = pitch
  }

  private endTop(): void {
    this.topTask?.cancel()
    this.topTask = null
    this.end(this.topNote)
    this.topNote = null
  }

  private awaitTop(atSec: number, changed: readonly number[]): void {
    this.topTask?.cancel()
    this.topTask = null
    // A high note the chord no longer has is let go, and one it still has rings into it.
    if (this.topNote && this.chord && !classesOf(this.chord).includes(mod(this.topNote.note, 12))) {
      this.end(this.topNote)
      this.topNote = null
    }
    if (this.params.top === 0) return
    this.topTask = this.at(Math.max(atSec, this.changedAt + this.params.time / 2), () => {
      const mover = this.params.top === 1
      const open = this.voices.filter((_, i) => changed.includes(i) === mover)
      const pitches = (open.length > 0 ? open : this.voices).map((voice) => voice.pitch)
      const over = Math.max(...this.voices.map((voice) => voice.pitch))
      const pitch = above([mod(Math.max(...pitches), 12)], over + 2)
      this.end(this.topNote)
      this.topNote = this.start(pitch, this.gain * 0.8, 'top')
    })
  }
}

export const HEXATONIC_WALKER: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'hexatonic-walker',
  name: 'Hexatonic Walker',
  description:
    'Walks a held chord by moves that change one note and keep two, C to C minor to A flat and on, so each chord melts into the next. It leaves the key unless it is kept there.',
  kind: 'walks',
  version: 1,
  params: PARAMS,
  parts: [
    { id: 'bass', name: 'Bass', description: 'The low root, of each chord or held under all.' },
    { id: 'top', name: 'Top line', description: 'The high note half way through each chord.' },
  ],
  timed: { time: 'time', step: 'time' },
  presets: {
    'Hexatonic melt': {},
    'Six chords round': { time: 6, rhythm: 1, step: 0.6, bass: 1 },
    'Other way round': { word: 1, time: 5, bass: 2, top: 1 },
    'Thirds descending': { word: 2, time: 3, rhythm: 2, step: 0.5, bass: 1 },
    'Thirds climbing': { word: 3, time: 5, rhythm: 4, step: 0.35, ring: 0.6 },
    'White key wander': { word: 2, keep: 2, time: 4, step: 0.5, rhythm: 4, top: 2 },
    'Slow white keys': { word: 10, keep: 2, time: 9, step: 1.2, rhythm: 1, bass: 1, seed: 5 },
    'Minor thirds': { word: 4, time: 4.5, step: 0.8, bass: 1, top: 2 },
    'Four chord loop': { word: 5, time: 3, rhythm: 4, step: 0.5, bass: 2 },
    'One root, six skies': { word: 6, time: 6, bass: 2, rhythm: 1, step: 0.9 },
    'One third, six ways': { word: 7, time: 5, step: 0.3, rhythm: 3, ring: 0.5 },
    'One fifth holding': { word: 8, time: 7, top: 2, bass: 1 },
    'Far pole': { moves: 3, time: 8, step: 1.4 },
    'Falling fifths': { word: 2, moves: 2, time: 4, rhythm: 2, step: 0.4, ring: 0.4, bass: 1 },
    'Major thirds': { moves: 2, time: 6, rhythm: 1, step: 0.75, octave: 1, bass: 1 },
    'There and back': { word: 4, turn: 3, time: 3.5, rhythm: 3, step: 0.7, top: 1 },
    'Borrowed light': { word: 10, keep: 1, time: 5, rhythm: 4, step: 0.6, bass: 1, seed: 11 },
    'Own word, rolling': { word: 9, seed: 3, time: 1.5, rhythm: 2, step: 0.25, ring: 0.7 },
    'Own word, hushed': { word: 9, seed: 17, time: 8, rhythm: 0, top: 1, octave: -1 },
    'Two out, two home': { word: 2, time: 1.25, step: 0.3, rhythm: 1, turn: 5, bass: 1, octave: 1 },
    'Long drift': { word: 10, seed: 23, time: 12, moves: 1, rhythm: 1, step: 2, bass: 2, top: 2 },
  },
  create: (options?: MakerOptions) => new HexatonicWalker(HEXATONIC_WALKER, options),
}
