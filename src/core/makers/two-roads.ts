// Two Roads: a slow melody that goes up one way and comes down another. A map
// is a rising road and a falling road above a resting note, with a strong
// note to dwell on, a partner note beside it, and notes that may only be
// touched in passing. Whatever rises in the melody lands on the rising road
// and whatever falls lands on the falling one. Every phrase ends on the
// resting note.
//
// What is played starts the melody and says where it lies: the resting note
// is the one nearest the lowest key held, and a key that moves it takes the
// melody along the road to there. The melody goes on by itself for as long as
// anything is held, in phrases with a silence after each, and how far it may
// go from the resting note grows a step at a time and shrinks again. A key
// pressed in a silence begins the next phrase.
//
// A map takes the place of the key's scale: its notes are semitones above the
// resting note, which by default is the degree of the key where the map
// leaves the key least. Where a map has notes no such key has (a raised sixth
// going up, an augmented second), the melody leaves the key on them, unless
// the notes the key lacks are left out. In C major melodic minor rests on A
// and leaves the key on F# and G#, Rast on C on Bb, Bayati on D on Eb and Bb,
// Hijaz on E on G# and C#, and Nahawand on A on G#. The ragas and the gapped
// modes leave it nowhere, though most of them rest on another note than C.

import {
  HIGHEST_NOTE,
  LOWEST_NOTE,
  MakerBase,
  type HeldNote,
  type MadeNote,
  type TaskHandle,
} from './base'
import { degreeClass, inKey, mod, nearestOfClass, snapNote } from './key'
import { MakerRandom } from './random'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

/** One way up and another way down, in semitones above the resting note. */
export interface RoadMap {
  name: string
  /** The notes a rise may land on, the resting note among them. */
  up: readonly number[]
  /** The notes a fall may land on, the resting note among them. */
  down: readonly number[]
  /** Notes of `down` that are touched and not stayed on. No map here has one going up. */
  passing: readonly number[]
  /** The note that is dwelt on. */
  strong: number
  /** The note that is dwelt on half as long. */
  partner: number
  /** What the drone holds over the resting note. */
  drone: number
  /** The degree of a major key it is written on, in semitones: which of two keys that fit it as well is meant. */
  home: number
}

const MAJOR_PENTATONIC = [0, 2, 4, 7, 9]

// What each map is and how it was checked.
//
// Melodic minor is the textbook one: sixth and seventh raised going up and
// natural coming down, with the fifth as the strong note.
//
// The ragas are written on the white keys, each on its own tonic, so none of
// them needs a black key. Their roads were compared with published ascents
// and descents (Sanskrit degrees, capital letters for the natural or raised
// form, d n r g for the lowered ones):
//   Bhimpalasi  S g M P n S / S n D P M g R S, on D; strong Ma, partner Sa.
//   Bageshri    S g M D n S / S n D M g R S, on D, with Pa touched coming
//               down; strong Ma, partner Sa. Published descents have Pa in
//               a turn of its own (M P D M g), which is not written: here it
//               is touched on the straight way from Dha to Ma.
//   Yaman       N R G M' D N S / S N D P M' G R S (M' is the raised fourth),
//               on F; strong Ga, partner Ni.
//   Bihag       S G M P N S / S N D P M G R S, on C; strong Ga, partner Ni,
//               with Re and Dha touched coming down. The raised fourth that
//               many players add is left out, as older practice does.
//   Bilaskhani  Bilaskhani Todi: S r g P d S / S n d M g r S, on E; strong
//               dha, partner ga. Its ornamental turns are not written, nor
//               its descent from the upper re past Sa (r n d).
//   Rageshri    S G M D n S / S n D M G M R S, on G; strong Ga, partner Ni,
//               with Re touched on the way to Sa.
//   Asavari     S R M P d S / S n d P M g R S, on A; strong Pa and partner Sa
//               as two references have it (another tradition has dha and ga).
// A raga is more than its two roads: these are the roads and the strong notes
// and nothing else.
//
// The maqam paths are twelve-tone approximations. A half-flat note is written
// as a key a piano has: the third and, going up, the seventh of Rast are the
// natural ones; the second of Bayati is the natural one going up and the flat
// one coming down, because it lies between the two; the sixth of Bayati and
// Hijaz is natural in the path's Rast on the fourth degree (going up) and
// flat in its Nahawand on the fourth (coming down). Nahawand needs no
// approximation: Hijaz on the fifth going up, Kurd on the fifth coming down.
// Which of the two upper halves belongs to which direction is the common
// teaching, and players do not always keep to it. The strong note is where
// the upper half begins.
//
// The gapped modes are four of the five a five-note scale has, named for the
// note of the scale that is their tonic (Do, Re, Sol, La; the rare one on Mi
// is not here). Both roads are the same five notes. The one note the fall
// touches besides fills one of the gaps as a singer's passing note might; that
// note, and which note is strong, is this maker's own reading.
export const ROAD_MAPS: readonly RoadMap[] = [
  {
    name: 'Melodic minor',
    up: [0, 2, 3, 5, 7, 9, 11],
    down: [0, 2, 3, 5, 7, 8, 10],
    passing: [],
    strong: 7,
    partner: 0,
    drone: 7,
    home: 9,
  },
  {
    name: 'Bhimpalasi',
    up: [0, 3, 5, 7, 10],
    down: [0, 2, 3, 5, 7, 9, 10],
    passing: [2, 9],
    strong: 5,
    partner: 0,
    drone: 5,
    home: 2,
  },
  {
    name: 'Bageshri',
    up: [0, 3, 5, 9, 10],
    down: [0, 2, 3, 5, 7, 9, 10],
    passing: [7],
    strong: 5,
    partner: 0,
    drone: 5,
    home: 2,
  },
  {
    name: 'Yaman',
    up: [0, 2, 4, 6, 9, 11],
    down: [0, 2, 4, 6, 7, 9, 11],
    passing: [],
    strong: 4,
    partner: 11,
    drone: 7,
    home: 5,
  },
  {
    name: 'Bihag',
    up: [0, 4, 5, 7, 11],
    down: [0, 2, 4, 5, 7, 9, 11],
    passing: [2, 9],
    strong: 4,
    partner: 11,
    drone: 7,
    home: 0,
  },
  {
    name: 'Bilaskhani',
    up: [0, 1, 3, 7, 8],
    down: [0, 1, 3, 5, 8, 10],
    passing: [],
    strong: 8,
    partner: 3,
    drone: 8,
    home: 4,
  },
  {
    name: 'Rageshri',
    up: [0, 4, 5, 9, 10],
    down: [0, 2, 4, 5, 9, 10],
    passing: [2],
    strong: 4,
    partner: 10,
    drone: 5,
    home: 7,
  },
  {
    name: 'Asavari',
    up: [0, 2, 5, 7, 8],
    down: [0, 2, 3, 5, 7, 8, 10],
    passing: [],
    strong: 7,
    partner: 0,
    drone: 7,
    home: 9,
  },
  {
    name: 'Rast',
    up: [0, 2, 4, 5, 7, 9, 11],
    down: [0, 2, 4, 5, 7, 9, 10],
    passing: [],
    strong: 7,
    partner: 0,
    drone: 7,
    home: 0,
  },
  {
    name: 'Bayati',
    up: [0, 2, 3, 5, 7, 9, 10],
    down: [0, 1, 3, 5, 7, 8, 10],
    passing: [],
    strong: 5,
    partner: 0,
    drone: 5,
    home: 2,
  },
  {
    name: 'Hijaz',
    up: [0, 1, 4, 5, 7, 9, 10],
    down: [0, 1, 4, 5, 7, 8, 10],
    passing: [],
    strong: 5,
    partner: 0,
    drone: 7,
    home: 4,
  },
  {
    name: 'Nahawand',
    up: [0, 2, 3, 5, 7, 8, 11],
    down: [0, 2, 3, 5, 7, 8, 10],
    passing: [],
    strong: 7,
    partner: 0,
    drone: 7,
    home: 9,
  },
  {
    name: 'Do gapped',
    up: MAJOR_PENTATONIC,
    down: [...MAJOR_PENTATONIC, 5],
    passing: [5],
    strong: 7,
    partner: 0,
    drone: 7,
    home: 0,
  },
  {
    name: 'Re gapped',
    up: [0, 2, 5, 7, 10],
    down: [0, 2, 5, 7, 9, 10],
    passing: [9],
    strong: 5,
    partner: 10,
    drone: 5,
    home: 2,
  },
  {
    name: 'Sol gapped',
    up: [0, 2, 5, 7, 9],
    down: [0, 2, 4, 5, 7, 9],
    passing: [4],
    strong: 5,
    partner: 0,
    drone: 5,
    home: 7,
  },
  {
    name: 'La gapped',
    up: [0, 3, 5, 7, 10],
    down: [0, 2, 3, 5, 7, 10],
    passing: [2],
    strong: 7,
    partner: 0,
    drone: 7,
    home: 9,
  },
]

/** A map on its resting note: pitch classes a walk reads. */
export interface Roads {
  up: ReadonlySet<number>
  down: ReadonlySet<number>
  passing: ReadonlySet<number>
  /** Every note of either road, rising, in semitones above the resting note. */
  all: readonly number[]
  /** The road with more notes, rising: the steps a range is counted in. */
  steps: readonly number[]
  strong: number
  partner: number
  drone: number
}

const TONIC_FIT = 0
const TONIC_ROOT = 1

/** The degree of the key (a pitch class) where a map leaves the key least. */
export function bestTonic(map: RoadMap, key: MakerKey): number {
  let best = key.root
  let most = -1
  for (let degree = 0; degree < key.steps.length; degree += 1) {
    const tonic = degreeClass(key, degree)
    const inside = (notes: readonly number[]): number =>
      notes.filter((note) => inKey(key, tonic + note)).length
    // As many notes on two degrees: where the map is written, then the one
    // whose way down stays inside, then the lower.
    const fits =
      inside(map.up) +
      inside(map.down) +
      (mod(tonic - key.root, 12) === map.home ? 0.5 : 0) +
      inside(map.down) / 100
    if (fits > most + 1e-9) {
      most = fits
      best = tonic
    }
  }
  return best
}

const FEWEST_KEPT = 4

/**
 * A map as it is walked. `keep` leaves out the notes the key lacks; a road
 * with fewer than four left takes each of its notes to the nearest of the key.
 */
export function roadsOf(map: RoadMap, tonic: number, key: MakerKey | null): Roads {
  const keep = (notes: readonly number[]): Set<number> => {
    if (!key) return new Set(notes)
    const inside = notes.filter((note) => note === 0 || inKey(key, tonic + note))
    if (inside.length >= FEWEST_KEPT) return new Set(inside)
    return new Set([0, ...notes.map((note) => mod(snapNote(key, tonic + note) - tonic, 12))])
  }
  const up = keep(map.up)
  const down = keep(map.down)
  const all = [...new Set([...up, ...down])].sort((a, b) => a - b)
  const nearest = (wanted: number): number =>
    all.reduce((best, note) => (Math.abs(note - wanted) < Math.abs(best - wanted) ? note : best))
  const strong = nearest(map.strong)
  const partner = nearest(map.partner)
  const drone = nearest(map.drone)
  const stays = new Set([0, strong, partner])
  const steps = [...(up.size > down.size ? up : down)].sort((a, b) => a - b)
  return {
    up,
    down,
    steps,
    passing: new Set(map.passing.filter((note) => down.has(note) && !stays.has(note))),
    all,
    strong,
    partner,
    drone,
  }
}

/** The next note of a road from `from` upwards or downwards; `rest` is a resting note. */
export function nextOn(roads: Roads, rest: number, from: number, direction: 1 | -1): number {
  const road = direction > 0 ? roads.up : roads.down
  const first = direction > 0 ? Math.floor(from + 1) : Math.ceil(from - 1)
  for (let i = 0; i < 12; i += 1) {
    const note = first + direction * i
    if (road.has(mod(note - rest, 12))) return note
  }
  return from + 12 * direction
}

/** A fall this far has a turn in it. */
const FOURTH = 5
const TRITONE = 6

/**
 * The notes from `from` to `to` along the road that leads there, `to` the
 * last. A fall of a fourth may have a turn inside it: before the note that
 * completes it the line goes back to where the fall began (G F E, G again,
 * then D), or to the nearest note under that which a rise may land on.
 */
export function walk(
  roads: Roads,
  rest: number,
  from: number,
  to: number,
  turns: () => boolean,
): number[] {
  const path: number[] = []
  if (from === to) return path
  const direction = to > from ? 1 : -1
  let at = from
  let top = from
  while (at !== to) {
    let next = nextOn(roads, rest, at, direction)
    if ((to - next) * direction < 0) next = to
    if (direction < 0 && top - next >= FOURTH) {
      const back = at === top ? null : turnTo(roads, rest, at, top)
      // Never into the leap of a tritone.
      if (back !== null && back - next !== TRITONE && turns()) path.push(back)
      top = next
    }
    path.push(next)
    at = next
  }
  return path
}

/** The highest note over `at`, and no higher than `top`, that a rise may land on and a fall go on from. */
function turnTo(roads: Roads, rest: number, at: number, top: number): number | null {
  for (let note = Math.floor(top); note > at; note -= 1) {
    const step = mod(note - rest, 12)
    if (roads.up.has(step) && roads.down.has(step) && !roads.passing.has(step)) return note
  }
  return null
}

const PARAMS = {
  map: {
    id: 0,
    name: 'Map',
    min: 0,
    max: 15,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: [
      'Melodic minor',
      'Bhimpalasi',
      'Bageshri',
      'Yaman',
      'Bihag',
      'Bilaskhani',
      'Rageshri',
      'Asavari',
      'Rast',
      'Bayati',
      'Hijaz',
      'Nahawand',
      'Do gapped',
      'Re gapped',
      'Sol gapped',
      'La gapped',
    ],
    description:
      "The way up and down, in place of the key's scale. At best fit ragas and gapped modes stay in a major or natural minor key; melodic minor and the maqam paths leave it.",
  },
  tonic: {
    id: 1,
    name: 'Resting note',
    min: 0,
    max: 5,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Best fit', 'Fit, kept', 'Key root', 'Root, kept', 'Played', 'Played, kept'],
    description:
      'Where phrases end: the degree on which the map leaves the key least, the root of the key, or the lowest key held. Kept leaves out the notes the key lacks.',
  },
  pace: {
    id: 2,
    name: 'Pace',
    min: 0.2,
    max: 6,
    default: 0.7,
    taper: 'log',
    unit: 's',
    description:
      'How long an ordinary note lasts, about. Passing notes are shorter, the strong note and its partner longer.',
  },
  dwell: {
    id: 3,
    name: 'Dwell',
    min: 0.1,
    max: 0.5,
    default: 0.4,
    taper: 'linear',
    unit: '',
    description:
      'The share of the singing time the strong note takes. Its partner takes half as much, or more where it is the resting note, and the others share what is left.',
  },
  zigzag: {
    id: 4,
    name: 'Zigzag',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
    description:
      'How many of the falls of a fourth have a turn inside: G F E, back to G, and only then D. At zero every fall goes straight down.',
  },
  range: {
    id: 5,
    name: 'Range',
    min: 3,
    max: 15,
    default: 9,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'How many steps of the map over the resting note the melody reaches at its widest. Under it, half as many, or to the strong note when that is within a fifth.',
  },
  grow: {
    id: 6,
    name: 'Growth',
    min: 0,
    max: 90,
    default: 32,
    taper: 'linear',
    unit: 's',
    description:
      'How long the range takes to grow by one step; grown, it shrinks as slowly and grows again. At zero the whole range is there at once.',
  },
  phrase: {
    id: 7,
    name: 'Phrase',
    min: 2,
    max: 40,
    default: 8,
    taper: 'log',
    unit: 's',
    description:
      'How long a phrase is, about. No two are quite the same length, and each ends on the resting note.',
  },
  rest: {
    id: 8,
    name: 'Silence',
    min: 0,
    max: 20,
    default: 2.5,
    taper: 'linear',
    unit: 's',
    description:
      'How long the melody is silent between two phrases, about. A key pressed in it begins the next phrase. A drone goes on.',
  },
  tail: {
    id: 9,
    name: 'Tail',
    min: 0,
    max: 30,
    default: 8,
    taper: 'linear',
    unit: 's',
    description:
      'How long the melody has to bring its phrase home after the last key is let go. At zero it stops at once.',
  },
  drone: {
    id: 10,
    name: 'Drone',
    min: 0,
    max: 1,
    default: 0.4,
    taper: 'linear',
    unit: '',
    description:
      'How hard a drone under the melody is played: the resting note an octave down and one more, struck anew with each phrase. At zero there is none.',
  },
  seed: {
    id: 11,
    name: 'Take',
    min: 1,
    max: 64,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
    description:
      'Another number is another melody under the same rules. The same number plays it again.',
  },
} as const satisfies NoteMakerDescriptor['params']

/** Keys that come within this of the first are one chord: the lowest of them says where the melody lies. */
const GATHER_SEC = 0.03
/** Keys let go within this of one another are one chord let go: the lowest of them stays the lowest. */
const LET_GO_SEC = 0.08
/** A knob of the drone that has stood still for this long strikes it again at its new level. */
const DRONE_STILL_SEC = 0.2
/** A phrase that was asked for while the last one went home waits this long at the most. */
const BREATH_SEC = 0.5
/** A strong note no further than this under the resting note is inside the range from the start. */
const FIFTH = 7
/** The resting note is moved by octaves into this span, so the whole range is on the keyboard. */
const LOWEST_REST = 36
const HIGHEST_REST = 84
/** At the least, the range begins this many steps over the resting note. */
const FIRST_REACH = 3
/** The shortest a passing note is, in seconds, however quick the pace. */
const SHORTEST_PASSING = 0.1

/** Lengths of ordinary notes one after another, as shares of the pace: each row makes the pace on average. */
const CELLS: readonly (readonly number[])[] = [
  [1, 1],
  [1.3, 0.7],
  [0.75, 0.75, 1.4],
  [1.3, 0.85, 0.85],
  [1.4, 0.6, 0.6, 1.4],
]

type Phase = 'idle' | 'gather' | 'sing' | 'silent'

class TwoRoads extends MakerBase {
  private random = new MakerRandom(this.params.seed)
  private phase: Phase = 'idle'
  private roads: Roads = roadsOf(ROAD_MAPS[0], 9, null)
  private rest = 57
  /** The lowest key held, kept while a tail goes on with none. */
  private lowest = 57
  private gain = 0.8
  private beganSec = 0
  private releasedSec: number | null = null
  private stop: TaskHandle | null = null
  private settling: TaskHandle | null = null
  private striking: TaskHandle | null = null
  /** A key was pressed while the phrase went home: the next one comes after a breath. */
  private asked = false

  /** The next thing the melody does. */
  private upcoming: TaskHandle | null = null
  private nextSec = 0
  private voice: MadeNote | null = null
  private drones: MadeNote[] = []
  private position: number | null = null
  private path: number[] = []
  private homeward = false
  private written = 0
  private endsBy = 0
  private silentSec = 0
  private silenceShare = 1
  private cell: readonly number[] = CELLS[0]
  private beat = 0

  /** Seconds written since the melody began, and how many of them were the strong note and its partner. */
  private total = 0
  private onStrong = 0
  private onPartner = 0

  protected onNote(atSec: number, held: HeldNote): void {
    const before = this.lowest
    this.lowest = this.lowestHeld()
    this.gain = held.gain
    if (this.releasedSec !== null) {
      this.releasedSec = null
      this.stop?.cancel()
    }
    if (this.phase === 'idle') {
      this.phase = 'gather'
      this.beganSec = atSec
      this.forgetShares()
      this.position = null
      this.later(atSec + GATHER_SEC, (at) => this.beginPhrase(at))
      return
    }
    if (this.phase === 'gather') return
    if (this.phase === 'silent') {
      this.later(Math.min(this.nextSec, atSec + GATHER_SEC), (at) => this.beginPhrase(at))
      return
    }
    if (this.homeward) this.asked = true
    if (this.lowest !== before) this.settleLater(atSec + GATHER_SEC)
  }

  protected onRelease(atSec: number): void {
    if (this.phase === 'idle') return
    if (this.held.size > 0) {
      this.settleLater(atSec + LET_GO_SEC)
      return
    }
    this.releasedSec = atSec
    if (this.params.tail <= 0 || this.phase === 'silent') this.finish()
    else this.hurry(atSec)
  }

  protected override onParam(atSec: number, name: string): void {
    if (name === 'seed') this.random = new MakerRandom(this.params.seed)
    if (this.phase === 'idle') return
    if (name === 'map' || name === 'tonic') this.resettle()
    if (name === 'dwell') this.forgetShares()
    if (name === 'drone') this.turnDrone(atSec)
    if (name === 'pace' && this.phase === 'sing')
      this.moveUp(Math.min(this.nextSec, atSec + 2 * this.params.pace))
    if (name === 'phrase' && this.phase === 'sing')
      this.endsBy = Math.min(this.endsBy, atSec + this.params.phrase)
    if (name === 'rest' && this.phase === 'silent')
      this.moveUp(this.silentSec + this.params.rest * this.silenceShare)
    if (name === 'tail' && this.releasedSec !== null) {
      if (atSec >= this.releasedSec + this.params.tail) this.finish()
      else this.hurry(this.releasedSec)
    }
  }

  protected override onKey(): void {
    if (this.phase !== 'idle') this.resettle()
  }

  protected override onSilence(): void {
    this.phase = 'idle'
    this.random = new MakerRandom(this.params.seed)
    this.releasedSec = null
    this.voice = null
    this.drones = []
    this.path = []
    this.position = null
  }

  // --- Where it lies ----------------------------------------------------------

  private lowestHeld(): number {
    let lowest = Infinity
    for (const { note } of this.held.values()) lowest = Math.min(lowest, note)
    return Number.isFinite(lowest) ? lowest : this.lowest
  }

  /** The map, its resting note and its register, as the controls and the keys held have them now. */
  private place(): void {
    const map = ROAD_MAPS[this.params.map]
    const kept = this.params.tonic % 2 === 1
    const from = Math.floor(this.params.tonic / 2)
    const played = Math.round(kept ? snapNote(this.key, this.lowest) : this.lowest)
    let rest = played
    if (from === TONIC_FIT) rest = nearestOfClass(bestTonic(map, this.key), this.lowest)
    if (from === TONIC_ROOT) rest = nearestOfClass(this.key.root, this.lowest)
    while (rest < LOWEST_REST) rest += 12
    while (rest > HIGHEST_REST) rest -= 12
    this.rest = rest
    this.roads = roadsOf(map, rest, kept ? this.key : null)
  }

  /** The keys held are others: where the lowest of them moves the resting note, the melody goes there. */
  private settleLater(atSec: number): void {
    this.settling?.cancel()
    this.settling = this.at(atSec, () => {
      this.lowest = this.lowestHeld()
      if (this.phase !== 'sing' && this.phase !== 'silent') return
      const { rest } = this
      this.place()
      if (this.rest === rest) return
      this.takeRoad(true)
      // Too far to walk: the next note is the resting note there.
      if (Math.abs(this.rest - rest) > 12) this.path = [this.rest]
    })
  }

  /** The map, its resting note or the key is another one: the melody takes the new road from where it is. */
  private resettle(): void {
    if (this.phase === 'gather') return
    const { rest, roads } = this
    this.place()
    this.takeRoad(rest !== this.rest || roads.drone !== this.roads.drone)
  }

  private takeRoad(drone: boolean): void {
    this.path =
      this.homeward && this.position !== null ? this.walkTo(this.position, this.rest, 0) : []
    if (this.phase === 'silent') this.position = this.rest
    else this.moveUp(Math.min(this.nextSec, this.now + this.params.pace))
    if (drone) this.strikeLater(this.now + GATHER_SEC)
  }

  /** The note so many steps of the road over the resting note. */
  private stepNote(step: number): number {
    const { steps } = this.roads
    return this.rest + 12 * Math.floor(step / steps.length) + steps[mod(step, steps.length)]
  }

  /** How many steps over the resting note the melody may go at this moment. */
  private reach(atSec: number): number {
    const { range, grow } = this.params
    const { steps, strong } = this.roads
    const first = Math.min(range, Math.max(FIRST_REACH, steps.filter((s) => s < strong).length))
    const span = range - first
    if (grow <= 0 || span <= 0) return range
    const step = Math.floor((atSec - this.beganSec) / grow) % (2 * span)
    return first + (step <= span ? step : 2 * span - step)
  }

  /**
   * The notes of either road the melody may go to at this moment, rising. Half
   * as far under the resting note as over it; the strong note under it is
   * reached from the start where it is near, for the part of an octave the
   * roads part in is mostly the one just under the resting note.
   */
  private within(atSec: number): number[] {
    const reach = this.reach(atSec)
    const { all, strong } = this.roads
    const high = Math.min(HIGHEST_NOTE, this.stepNote(reach))
    let low = this.stepNote(-Math.floor(reach / 2))
    if (12 - strong <= FIFTH) low = Math.min(low, this.rest + strong - 12)
    const notes: number[] = []
    for (let note = Math.max(LOWEST_NOTE, low); note <= high; note += 1)
      if (all.includes(this.classOf(note))) notes.push(note)
    return notes
  }

  /** The shares of the time begin anew: what was sung under other rules is not made up for. */
  private forgetShares(): void {
    this.total = this.onStrong = this.onPartner = 0
  }

  private classOf(note: number): number {
    return mod(note - this.rest, 12)
  }

  private walkTo(from: number, to: number, zigzag = this.params.zigzag): number[] {
    return walk(
      this.roads,
      this.rest,
      from,
      to,
      zigzag <= 0 ? () => false : () => this.random.next() < zigzag,
    )
  }

  // --- The phrase -------------------------------------------------------------

  private later(atSec: number, run: (atSec: number) => void): void {
    this.upcoming?.cancel()
    this.nextSec = atSec
    this.upcoming = this.at(atSec, run)
  }

  /** What is due next is due at another time. */
  private moveUp(atSec: number): void {
    if (this.phase === 'sing') this.later(atSec, (at) => this.step(at))
    if (this.phase === 'silent') this.later(atSec, (at) => this.beginPhrase(at))
  }

  private beginPhrase(atSec: number): void {
    this.place()
    this.phase = 'sing'
    this.homeward = false
    this.asked = false
    this.written = 0
    this.path = []
    this.beat = 0
    this.endsBy = atSec + this.params.phrase * this.random.between(0.75, 1.3)
    if (this.releasedSec !== null)
      this.endsBy = Math.min(this.endsBy, this.releasedSec + this.params.tail)
    this.strikeDrone()
    const first = this.position === null
    this.position = null
    this.sing(atSec, first ? this.rest : this.firstNote(atSec))
  }

  /** Where a phrase begins: on the resting note, the strong one, its partner, or the note a rise to rest comes from. */
  private firstNote(atSec: number): number {
    const choices: [number, number][] = [[this.rest, 2]]
    for (const note of this.within(atSec)) {
      if (note === this.rest) continue
      const at = this.classOf(note)
      if (at === this.roads.strong) choices.push([note, 2])
      else if (at === this.roads.partner) choices.push([note, 1.5])
      else if (
        note < this.rest &&
        nextOn(this.roads, this.rest, note, 1) === this.rest &&
        this.roads.up.has(at)
      )
        choices.push([note, 2])
    }
    return this.random.weighted(choices, ([, weight]) => weight)[0]
  }

  private step(atSec: number): void {
    const position = this.position ?? this.rest
    if (!this.homeward && this.mustGoHome(atSec, position)) {
      this.homeward = true
      if (this.path.length !== 1 || this.path[0] !== this.rest)
        this.path = this.walkTo(position, this.rest)
    }
    // No time to walk: the resting note straight away.
    if (this.homeward && this.path.length > 1 && this.leftSec(atSec) < this.homeSec(position))
      this.path = [this.rest]
    if (this.homeward && this.path.length === 0) {
      this.endPhrase(atSec)
      return
    }
    if (this.path.length === 0) this.path = this.setOut(atSec, position)
    const note = this.path.shift()
    if (note === undefined) this.endPhrase(atSec)
    else this.sing(atSec, note)
  }

  private leftSec(atSec: number): number {
    return this.releasedSec === null ? Infinity : this.releasedSec + this.params.tail - atSec
  }

  /** About how long the way home takes from a note, its last note with it. */
  private homeSec(position: number): number {
    const steps = this.walkTo(position, this.rest, 0).length
    const turns = position > this.rest ? 1 + this.params.zigzag * 0.3 : 1
    return (steps * turns + 1) * this.params.pace
  }

  private mustGoHome(atSec: number, position: number): boolean {
    if (this.written < 2 && this.releasedSec === null) return false
    if (this.path.length > 0 && !this.turnsOn(position)) return false
    return atSec + this.homeSec(position) >= this.endsBy
  }

  /** The line turns round on a note of both roads: from F#, which only goes on up, it would fall to F. */
  private turnsOn(note: number): boolean {
    const { up, down, passing } = this.roads
    const at = this.classOf(note)
    return up.has(at) && down.has(at) && !passing.has(at)
  }

  /** The way to the next note worth going to. */
  private setOut(atSec: number, position: number): number[] {
    const { strong, partner, up, down, passing } = this.roads
    const { dwell } = this.params
    const within = this.within(atSec)
    const behind = this.total > 0 ? dwell - this.onStrong / this.total : dwell
    const choices: [number, number][] = []
    for (const note of within) {
      if (note === position) continue
      const at = this.classOf(note)
      const road = note > position ? up : down
      if (!road.has(at) || passing.has(at)) continue
      if (at !== strong && at !== partner && !this.turnsOn(note)) continue
      let weight = note === within[within.length - 1] ? 1.2 : 0.6
      if (at === strong) weight = Math.max(0.2, 2 + 14 * behind)
      else if (at === partner) weight = 1.6
      else if (at === 0) weight = 1
      const far = Math.abs(note - position)
      if (far <= 2) weight *= 0.5
      if (far > 9) weight *= 0.5
      choices.push([note, weight])
    }
    if (choices.length === 0) return position === this.rest ? [] : this.walkTo(position, this.rest)
    const [goal] = this.random.weighted(choices, ([, weight]) => weight)
    this.cell = CELLS[this.random.below(CELLS.length)]
    this.beat = 0
    const far = Math.abs(goal - position)
    const firm = [0, strong, partner].includes(this.classOf(goal))
    const leaps = firm && far >= 3 && far <= FIFTH && far !== TRITONE
    // A fall of a fourth that should have a turn in it is not leapt.
    const straight = goal > position || far < FOURTH || this.random.next() >= this.params.zigzag
    if (this.random.next() < 0.2 && leaps && straight) return [goal]
    return this.walkTo(position, goal)
  }

  private sing(atSec: number, note: number): void {
    const { pace, dwell, phrase, tail } = this.params
    const at = this.classOf(note)
    const passing =
      this.position !== null &&
      note < this.position &&
      this.roads.passing.has(at) &&
      note !== this.rest
    const closing = this.homeward && this.path.length === 0
    // On the way home in a tail there is no time to dwell.
    const hurried = this.homeward && this.releasedSec !== null
    const longest = Math.max(4 * pace, (0.25 + 0.7 * dwell) * phrase)
    let dur = pace * this.cell[this.beat % this.cell.length]
    let level = 0.85
    if (passing) {
      dur = Math.max(SHORTEST_PASSING, pace * 0.4)
      level = 0.6
    } else {
      this.beat += 1
      if (at === this.roads.strong) {
        if (!hurried) dur = this.owed(dwell, this.onStrong, longest)
        level = 1
      } else if (at === this.roads.partner) {
        if (!hurried) dur = this.owed(dwell / 2, this.onPartner, longest)
        level = 0.92
      }
    }
    if (closing) {
      dur = Math.max(dur, 2 * pace)
      level = 0.78
    }
    if (this.releasedSec !== null) {
      const left = this.releasedSec + tail - atSec
      if (!closing) dur = Math.min(dur, Math.max(0.02, left / 2))
      else dur = Math.min(dur, Math.max(0.02, left))
    }
    this.end(this.voice)
    this.voice = this.start(note, this.gain * level)
    this.position = note
    this.written += 1
    this.total += dur
    if (at === this.roads.strong) this.onStrong += dur
    else if (at === this.roads.partner) this.onPartner += dur
    this.later(atSec + dur, (next) => this.step(next))
  }

  /** How long a note has to last to have its share of the time again. */
  private owed(share: number, had: number, longest: number): number {
    if (this.total === 0) return this.params.pace
    const owed = (share * this.total - had) / (1 - share)
    return Math.min(longest, Math.max(0.6 * this.params.pace, owed))
  }

  private endPhrase(atSec: number): void {
    this.end(this.voice)
    this.voice = null
    this.position = this.rest
    if (this.releasedSec !== null) {
      this.finish()
      return
    }
    this.phase = 'silent'
    this.silentSec = atSec
    this.silenceShare = this.random.between(0.7, 1.4)
    const silence = this.params.rest * this.silenceShare
    const wait = this.asked ? Math.min(BREATH_SEC, silence) : silence
    this.later(atSec + wait, (at) => this.beginPhrase(at))
  }

  /** The last key was let go: the phrase comes home, within the tail. */
  private hurry(releasedSec: number): void {
    const { tail } = this.params
    const stopSec = releasedSec + tail
    this.stop?.cancel()
    this.stop = this.at(stopSec, () => this.finish())
    this.endsBy = Math.min(this.endsBy, stopSec)
    const closing = this.homeward && this.path.length === 0
    if (this.phase === 'sing' && !closing && this.nextSec > this.now + (stopSec - this.now) / 2)
      this.moveUp(this.now + (stopSec - this.now) / 2)
  }

  private finish(): void {
    this.phase = 'idle'
    this.upcoming?.cancel()
    this.stop?.cancel()
    this.settling?.cancel()
    this.releasedSec = null
    this.asked = false
    this.end(this.voice)
    this.voice = null
    this.endDrone()
    this.path = []
    this.position = null
  }

  // --- The drone ----------------------------------------------------------------

  private endDrone(): void {
    this.striking?.cancel()
    for (const note of this.drones) this.end(note)
    this.drones = []
  }

  /** Struck again once, however often what asks for it is asked before then. */
  private strikeLater(atSec: number): void {
    this.striking?.cancel()
    this.striking = this.at(atSec, () => this.strikeDrone())
  }

  /** The drone's own knob: off at once, on soon, and at its new level when the knob stands still. */
  private turnDrone(atSec: number): void {
    if (this.params.drone <= 0) this.endDrone()
    else this.strikeLater(atSec + (this.drones.length > 0 ? DRONE_STILL_SEC : GATHER_SEC))
  }

  private strikeDrone(): void {
    if (this.phase === 'idle' || this.phase === 'gather') return
    this.endDrone()
    const level = this.gain * this.params.drone
    if (level <= 0) return
    const low = this.rest - 12
    this.drones = [this.start(low, level, 'drone')]
    if (this.roads.drone > 0)
      this.drones.push(this.start(low + this.roads.drone, level * 0.8, 'drone'))
  }
}

const MAP = Object.fromEntries(ROAD_MAPS.map((map, index) => [map.name, index])) as Readonly<
  Record<string, number>
>

export const TWO_ROADS: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'two-roads',
  name: 'Two Roads',
  description:
    'A slow melody that goes up one road and down another, dwells on a strong note and ends each phrase on its resting note: melodic minor, ragas, maqam paths and gapped modes.',
  kind: 'walks',
  version: 1,
  params: PARAMS,
  parts: [
    {
      id: 'drone',
      name: 'Drone',
      description: 'The resting note an octave down and one note over it, struck with each phrase.',
    },
  ],
  timed: { pace: 'time', grow: 'time', phrase: 'time', rest: 'time', tail: 'time' },
  presets: {
    'Melodic minor': {},
    'Afternoon longing': {
      map: MAP.Bhimpalasi,
      pace: 0.9,
      phrase: 10,
      rest: 3,
      zigzag: 0.8,
      range: 8,
    },
    'Past midnight': {
      map: MAP.Bageshri,
      pace: 1.3,
      phrase: 14,
      rest: 5,
      grow: 20,
      zigzag: 0.4,
      seed: 3,
    },
    'First lamps': {
      map: MAP.Yaman,
      pace: 1,
      phrase: 12,
      rest: 4,
      range: 10,
      zigzag: 0.3,
      drone: 0.5,
      seed: 5,
    },
    'Night garden': {
      map: MAP.Bihag,
      pace: 0.6,
      phrase: 7,
      rest: 2,
      range: 8,
      zigzag: 0.2,
      grow: 16,
      seed: 4,
    },
    'Grey morning': {
      map: MAP.Bilaskhani,
      pace: 1.6,
      phrase: 16,
      rest: 6,
      range: 7,
      dwell: 0.45,
      zigzag: 0.2,
      seed: 9,
    },
    'Sixths and fourths': {
      map: MAP.Rageshri,
      pace: 0.8,
      phrase: 9,
      rest: 3,
      range: 7,
      grow: 12,
      zigzag: 0.5,
      seed: 2,
    },
    'Late morning': {
      map: MAP.Asavari,
      pace: 0.75,
      phrase: 8,
      rest: 3.5,
      range: 10,
      grow: 24,
      zigzag: 0.7,
      seed: 6,
    },
    'Straight road': {
      map: MAP.Rast,
      pace: 0.5,
      phrase: 6,
      rest: 1.5,
      zigzag: 0.1,
      dwell: 0.3,
      range: 9,
      grow: 8,
      seed: 7,
    },
    Courtyard: {
      map: MAP.Bayati,
      pace: 0.6,
      phrase: 7,
      rest: 2,
      zigzag: 0.35,
      range: 8,
      dwell: 0.35,
      seed: 8,
    },
    'Far caravan': {
      map: MAP.Hijaz,
      pace: 1.1,
      phrase: 13,
      rest: 5,
      zigzag: 0.4,
      range: 8,
      drone: 0.6,
      seed: 10,
    },
    'Letter home': {
      map: MAP.Nahawand,
      pace: 0.85,
      phrase: 10,
      rest: 2.5,
      zigzag: 0.6,
      range: 11,
      grow: 10,
      seed: 11,
    },
    'Harbour air': {
      map: MAP['Do gapped'],
      pace: 0.55,
      phrase: 6,
      rest: 2,
      zigzag: 0.3,
      range: 8,
      grow: 0,
      dwell: 0.25,
      seed: 12,
    },
    'Standing stones': {
      map: MAP['Re gapped'],
      pace: 1.8,
      phrase: 18,
      rest: 7,
      zigzag: 0,
      range: 7,
      grow: 0,
      seed: 13,
    },
    'Cold loch': {
      map: MAP['Sol gapped'],
      pace: 1.2,
      phrase: 11,
      rest: 4,
      zigzag: 0.4,
      range: 9,
      grow: 15,
      dwell: 0.35,
      seed: 14,
    },
    Lament: {
      map: MAP['La gapped'],
      pace: 0.9,
      phrase: 9,
      rest: 4,
      zigzag: 1,
      range: 7,
      grow: 0,
      dwell: 0.35,
      seed: 15,
    },
    'Slow opening': {
      map: MAP.Bhimpalasi,
      pace: 3,
      phrase: 36,
      rest: 8,
      range: 12,
      grow: 32,
      zigzag: 1,
      dwell: 0.5,
      tail: 20,
      drone: 0.6,
      seed: 16,
    },
    'Running water': {
      map: MAP.Yaman,
      pace: 0.25,
      phrase: 5,
      rest: 1,
      range: 13,
      grow: 0,
      dwell: 0.2,
      zigzag: 0.9,
      drone: 0.3,
      seed: 17,
    },
    'Wherever you are': {
      map: MAP['La gapped'],
      tonic: 4,
      pace: 0.7,
      phrase: 7,
      rest: 2,
      range: 8,
      grow: 0,
      zigzag: 0.3,
      seed: 18,
    },
    'Inside the key': {
      tonic: 1,
      pace: 1,
      phrase: 9,
      rest: 3,
      range: 8,
      grow: 0,
      zigzag: 0.6,
      seed: 19,
    },
  },
  create: (options?: MakerOptions) => new TwoRoads(TWO_ROADS, options),
}
