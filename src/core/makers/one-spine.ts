// One Spine, Five Roles: a progression of eight chords runs while a key is
// held, and whoever plays it takes one role. The pad plays the chords, the
// bass their lowest notes, the arpeggio the chord tones one by one, the bell
// the top note of each chord as a line, and the drone the tonic. Sounds that
// take the same spine and the same chord length fit each other, whatever role
// each has.
//
// Where the spine is depends on time alone. The first chord begins when the
// first key goes down and each chord lasts the same number of seconds, so the
// chord at t is the one numbered floor(t / chord length), round and round the
// eight. Adding and releasing keys does not move it. Nor does a gap shorter
// than one chord: the count goes on through it. After a longer gap the next
// key starts again at the first chord. Two patches begun together therefore
// agree for as long as they are held.
//
// The chords are degrees of the key and take their notes from it. The voicing
// of the pad and the octave of the bass are decided for all eight chords
// together, so that the round moves as little as it can and its end leads
// into its beginning: the voicing does not depend on where a performance
// came in. A pad that went along with the bass in octaves, or a top note that
// stood still, costs as much as a farther move.

import { below, classNear, indexOf, mod } from './key'
import { MakerBase, type MadeNote, type TaskHandle } from './base'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

// --- The spines -------------------------------------------------------------

/**
 * Each chord as its degree, counted from 1, with what is added to the triad
 * after a colon and another lowest note after a stroke. `7` and `9` leave the
 * root to the bass: third, fifth and seventh, or third, seventh and ninth.
 * `turn` takes the other third, minor for major and major for minor.
 */
const SPINES: readonly (readonly [name: string, chords: string])[] = [
  ['Sevenths', '4:7 3:7 2:7 1:7 6 3:7 4:7 5:sus4'],
  ['Lament', '6 5 4 3 2 3 4 5'],
  ['Turning', '1 6 2 5 3 6 4 5'],
  ['Borrowed', '1 4 4:turn 1 6 3 4 4:turn'],
  ['Circle', '6:7 2:7 5:7 1:7 4:7 7:7 3:sus4 3'],
  ['Tides', '1:9 4:9 1:9 4:9 6:7 4:9 6:7 4:9'],
  ['Climb', '1 2:7 3:7 4 5:sus4 6:7 4:7 5'],
  ['Pedal', '1 4/1 5/1 1:sus2 6/1 4/1 2/1 5/1'],
  ['Rocking', '2:7 5 2:7 5 4:7 1 4:7 1'],
  ['Open road', '6 4 1 5 6 1 4 2'],
  ['Fifths up', '4 1 5 2 6 3 6 1'],
  ['Narrow gate', '3:sus4 3 4:7 2:7 3 6 2 4'],
  ['Bright sill', '4 5/4 6/4 5/4 4:9 5/4 3 1/3'],
  ['Stairs', '1 5/7 6 3/5 4 1/3 2 5'],
  ['Long stay', '6 6:9 4 4:7 1 1:9 5:sus4 5'],
  ['Open fourths', '1:sus4 5:sus4 2:sus4 6:sus4 4:sus2 1:sus2 2:sus4 3:sus4'],
]

type Colour = 'triad' | '7' | '9' | 'sus2' | 'sus4' | 'turn'

interface SpineChord {
  /** From 0. */
  degree: number
  colour: Colour
  /** The degree of the lowest note, where it is not the chord's own. */
  bass: number
}

function readSpine(chords: string): SpineChord[] {
  return chords.split(' ').map((written) => {
    const [over, under] = written.split('/')
    const [degree, colour] = over.split(':')
    return {
      degree: Number(degree) - 1,
      colour: (colour ?? 'triad') as Colour,
      bass: Number(under ?? degree) - 1,
    }
  })
}

const READ = SPINES.map(([, chords]) => readSpine(chords))
const CHORDS = 8

// --- The chords in a key ----------------------------------------------------

/** The scales of seven that a scale of another size is taken for a part of. */
const MAJOR: MakerKey = { root: 0, steps: [0, 2, 4, 5, 7, 9, 11] }
const MINOR: MakerKey = { root: 0, steps: [0, 2, 3, 5, 7, 8, 10] }

/** The scale of seven the spine is read in: the key's own, else major or minor by its third. */
function readIn(key: MakerKey): MakerKey {
  if (key.steps.length === 7) return key
  return key.steps.includes(3) && !key.steps.includes(4) ? MINOR : MAJOR
}

/** The step of a scale that stands for a degree of the spine: itself in a scale of seven, else the nearest. */
function stepFor(key: MakerKey, degree: number): number {
  const size = key.steps.length
  if (size === 7) return degree
  return mod(indexOf({ root: 0, steps: key.steps }, readIn(key).steps[degree]), size)
}

/**
 * The steps the eight chords stand on. In a scale of five or six, two degrees
 * can fall on one step. Where that would make a chord its neighbour again, it
 * goes one step further the way the spine was going.
 */
function rootSteps(key: MakerKey, spine: readonly SpineChord[]): number[] {
  const size = key.steps.length
  const steps: number[] = []
  spine.forEach(({ degree }, i) => {
    let step = stepFor(key, degree)
    if (i > 0 && size !== 7 && degree !== spine[i - 1].degree && step === steps[i - 1]) {
      const away = mod(degree - spine[i - 1].degree, 7)
      step = mod(step + (away > 3 ? -1 : 1), size)
    }
    steps.push(step)
  })
  return steps
}

/** Semitones from one step of the scale up to the step `count` over it. */
function semitones(key: MakerKey, step: number, count: number): number {
  const size = key.steps.length
  const at = step + count
  return key.steps[mod(at, size)] + 12 * Math.floor(at / size) - key.steps[step]
}

/** The steps over its root that each colour plays, in a scale of seven. */
const TONES: Readonly<Record<Colour, readonly number[]>> = {
  triad: [0, 2, 4],
  turn: [0, 2, 4],
  '7': [2, 4, 6],
  '9': [2, 6, 8],
  sus2: [0, 1, 4],
  sus4: [0, 3, 4],
}

/** The steps over its root a chord plays in a scale of seven. */
function tonesOf(key: MakerKey, degree: number, colour: Colour): readonly number[] {
  if (colour !== 'sus2' && colour !== 'sus4') return TONES[colour]
  // A fourth or a fifth that is not perfect leaves no open chord: the other one
  // is taken, and where neither is open, fourths one on the other over the root.
  const open = (tones: readonly number[]): boolean =>
    tones.every((count) => [0, 2, 5, 7].includes(semitones(key, degree, count)))
  const other = colour === 'sus2' ? 'sus4' : 'sus2'
  if (open(TONES[colour])) return TONES[colour]
  return open(TONES[other]) ? TONES[other] : [3, 6, 9]
}

/** The third of a triad changed for the other one, where there is a perfect fifth over it. */
function turned(over: readonly number[]): number[] {
  const changes = over[2] === 7 && (over[1] === 3 || over[1] === 4)
  return changes ? [over[0], 7 - over[1], over[2]] : [...over]
}

/** Semitones over its root of a chord on `degree` of a scale of seven, in the order its colour names them. */
function overRoot(key: MakerKey, degree: number, colour: Colour): number[] {
  const over = tonesOf(key, degree, colour).map((count) => semitones(key, degree, count))
  return colour === 'turn' ? turned(over) : over
}

/**
 * The steps that stand for a chord in a scale that has no seven: its root on
 * `root`, for each other tone the step nearest to it, and no step twice. A
 * chord never has the same notes as one of `unlike`, its neighbours: the next
 * nearest steps are taken then, so that every chord is a change.
 */
function nearestSteps(
  key: MakerKey,
  root: number,
  { degree, colour }: SpineChord,
  unlike: readonly (readonly number[])[],
): number[] {
  const parent = readIn(key)
  const wishes = overRoot(parent, degree, colour)
  let found: { cost: number; steps: number[] }[] = [{ cost: 0, steps: [] }]
  for (const wish of wishes) {
    if (wish === 0) {
      found = found.map(({ cost, steps }) => ({ cost, steps: [...steps, root] }))
      continue
    }
    const at = parent.steps[degree] + wish
    found = found.flatMap(({ cost, steps }) =>
      key.steps.flatMap((semis, step) => {
        // The root stays the root's: another tone near it takes the step beside it.
        if (step === root || steps.includes(step)) return []
        const apart = mod(semis - at, 12)
        return [{ cost: cost + Math.min(apart, 12 - apart), steps: [...steps, step] }]
      }),
    )
  }
  if (found.length === 0) return [root]
  found.sort((a, b) => a.cost - b.cost)
  const same = (steps: readonly number[]): boolean =>
    unlike.some((other) => steps.every((step) => other.includes(step)))
  return (found.find(({ steps }) => !same(steps)) ?? found[0]).steps
}

/**
 * The pitch classes over the tonic of the chords of a spine, `shift` steps
 * up, each in the order its colour names them.
 */
function chordClasses(
  key: MakerKey,
  spine: readonly SpineChord[],
  roots: readonly number[],
  shift: number,
): number[][] {
  const size = key.steps.length
  if (size === 7)
    return spine.map(({ colour }, i) => {
      const root = mod(roots[i] + shift, 7)
      return overRoot(key, root, colour).map((over) => mod(key.steps[root] + over, 12))
    })
  const chords: number[][] = []
  for (const [i, chord] of spine.entries()) {
    const unlike = i === CHORDS - 1 ? [chords[i - 1], chords[0]] : chords.slice(-1)
    chords.push(nearestSteps(key, roots[i], chord, unlike))
  }
  return chords.map((steps) => steps.map((step) => key.steps[mod(step + shift, size)]))
}

/**
 * One of the options for each chord, so that the whole round, its end back to
 * its beginning too, costs least. Of two that cost the same, the first.
 */
function leastRound<T>(
  options: readonly (readonly T[])[],
  own: (option: T) => number,
  move: (from: T, to: T) => number,
): T[] {
  let best: T[] = []
  let least = Infinity
  for (const first of options[0]) {
    let paths = [{ cost: own(first), path: [first] }]
    for (const next of options.slice(1)) {
      const before = paths
      paths = next.map((option) => {
        let from = before[0]
        let cost = Infinity
        for (const path of before) {
          const total = path.cost + move(path.path[path.path.length - 1], option)
          if (total < cost - 1e-9) [from, cost] = [path, total]
        }
        return { cost: cost + own(option), path: [...from.path, option] }
      })
    }
    for (const { cost, path } of paths) {
      const total = cost + move(path[path.length - 1], first)
      if (total < least - 1e-9) [best, least] = [path, total]
    }
  }
  return best
}

/** Where things lie on the white keys, as notes over the tonic nearest middle C. */
const PAD_CENTRE = -2
const PAD_LOWEST = -11
const PAD_HIGHEST = 7
const BASS_HOME = -20
const BASS_LOWEST = -29
const BASS_HIGHEST = -12
const DRONE_NOTE = -12

export interface VoicedChord {
  /** The close position, rising: what the other voicings and the bell are made from. */
  close: readonly number[]
  bass: number
}

interface PadOption {
  notes: number[]
  bass: number
  /** What the notes cost by themselves, wherever they come from. */
  cost: number
}

/**
 * A chord whose root is left to the bass is turned from the order its colour
 * names only for a good reason: the seventh or the ninth belongs on top.
 */
const TURNED_COST = 2
/** A semitone between neighbours of a close chord is a rub. */
const RUB_COST = 1
/** An outer voice of the pad that goes along with the bass in octaves is no voice of its own; an inner one is hidden. */
const OUTER_OCTAVES_COST = 3
const INNER_OCTAVES_COST = 1
/** A top note that comes again gives the bell no line. */
const SAME_TOP_COST = 1.2

function padOptions(classes: readonly number[], colour: Colour, bass: number): PadOption[] {
  const options: PadOption[] = []
  const rootless = colour === '7' || colour === '9'
  for (let first = 0; first < classes.length; first += 1) {
    for (let octave = -24; octave <= 24; octave += 12) {
      const notes = [classes[first] + octave]
      for (let i = 1; i < classes.length; i += 1) {
        const last = notes[i - 1]
        notes.push(last + mod(classes[(first + i) % classes.length] - last - 1, 12) + 1)
      }
      notes.sort((a, b) => a - b)
      if (notes[0] < PAD_LOWEST || notes[notes.length - 1] > PAD_HIGHEST) continue
      let cost = 0.25 * Math.abs(mean(notes) - PAD_CENTRE)
      if (rootless && first > 0) cost += TURNED_COST
      if (notes.some((note, i) => i > 0 && note - notes[i - 1] === 1)) cost += RUB_COST
      options.push({ notes, bass, cost })
    }
  }
  if (options.length > 0) return options
  return [{ notes: classes.map((semis) => semis - 12).sort((a, b) => a - b), bass, cost: 0 }]
}

function mean(notes: readonly number[]): number {
  return notes.reduce((sum, note) => sum + note, 0) / notes.length
}

/** What it costs the pad to go from one chord to the next: how far its voices move, and how. */
function padMove(a: PadOption, b: PadOption): number {
  let cost = 0
  const bassUp = b.bass - a.bass
  const voices = Math.min(a.notes.length, b.notes.length)
  for (let i = 0; i < voices; i += 1) {
    const up = b.notes[i] - a.notes[i]
    cost += Math.abs(up) / 3
    if (up !== 0 && up === bassUp && mod(a.notes[i] - a.bass, 12) === 0)
      cost += i > 0 && i < voices - 1 ? INNER_OCTAVES_COST : OUTER_OCTAVES_COST
  }
  if (a.notes[voices - 1] === b.notes[voices - 1]) cost += SAME_TOP_COST
  return cost
}

/** The eight chords of a spine in a key, `shift` degrees up, as notes. */
export function voicedSpine(key: MakerKey, spineIndex: number, shift = 0): VoicedChord[] {
  const spine = READ[spineIndex]
  const size = key.steps.length
  const roots = rootSteps(key, spine)
  const basses = leastRound<number>(
    spine.map(({ degree, bass }, i) => {
      const step = mod((bass === degree ? roots[i] : stepFor(key, bass)) + shift, size)
      const options: number[] = []
      for (let note = key.steps[step] - 48; note <= BASS_HIGHEST; note += 12)
        if (note >= BASS_LOWEST) options.push(note)
      return options
    }),
    (note) => 0.3 * Math.abs(note - BASS_HOME),
    (a, b) => Math.abs(a - b),
  )
  const pads = leastRound<PadOption>(
    chordClasses(key, spine, roots, shift).map((classes, i) =>
      padOptions(classes, spine[i].colour, basses[i]),
    ),
    ({ cost }) => cost,
    padMove,
  )
  const tonic = classNear(key.root, 60)
  return pads.map(({ notes }, i) => ({
    close: notes.map((note) => note + tonic),
    bass: basses[i] + tonic,
  }))
}

const VOICINGS = ['Close', 'Open', 'Wide', 'Full', 'Thin'] as const

/** How far under the rest of the chord a wide voicing has its floor, at least: a fifth. */
const WIDE_SEMITONES = 7

/**
 * The chord with the note it shares with the bass well under the rest, or its
 * lowest note an octave down where it shares none. Nothing goes under the bass.
 */
function lowered(close: readonly number[], bass: number): number[] {
  const shared = close.findIndex((note) => mod(note - bass, 12) === 0)
  const moved = Math.max(0, shared)
  const rest = close.filter((_, i) => i !== moved)
  let floor = close[moved] - (shared < 0 ? 12 : 0)
  while (shared >= 0 && rest.length > 0 && rest[0] - floor < WIDE_SEMITONES) floor -= 12
  return [floor >= bass ? floor : close[moved], ...rest].sort((a, b) => a - b)
}

/** A chord laid out: what the pad plays, and an octave up the arpeggio. */
function laidOut({ close, bass }: VoicedChord, voicing: number): number[] {
  const last = close.length - 1
  switch (VOICINGS[voicing]) {
    case 'Open':
      return close.map((note, i) => (i > 0 && i < last ? note + 12 : note)).sort((a, b) => a - b)
    case 'Wide':
      return lowered(close, bass)
    case 'Full':
      return [below([mod(bass, 12)], close[0]), ...close]
    case 'Thin':
      return last > 0 ? [close[0], close[last]] : [close[0]]
    default:
      return [...close]
  }
}

/** Which of `count` tones the arpeggio plays at a slot: up, and down again without its ends twice. */
function upAndDown(slot: number, count: number): number {
  if (count < 2) return 0
  const round = 2 * (count - 1)
  const at = slot % round
  return at < count ? at : round - at
}

// --- The controls -----------------------------------------------------------

const ROLES = ['pad', 'bass', 'arp', 'bell', 'drone'] as const
type Role = (typeof ROLES)[number]

const PARAMS = {
  spine: {
    id: 0,
    name: 'Spine',
    min: 0,
    max: SPINES.length - 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: SPINES.map(([name]) => name),
    description:
      'Which eight chords run. All keep to the key but Borrowed, which plays the chord on the fourth degree with its other third: minor in major, major in minor.',
  },
  role: {
    id: 1,
    name: 'Role',
    min: 0,
    max: ROLES.length - 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Pad', 'Bass', 'Arpeggio', 'Bell', 'Drone'],
    description:
      'What the main instrument plays: the chords, their lowest notes, the chord tones one by one, the top note of each chord, or the tonic.',
  },
  chord: {
    id: 2,
    name: 'Chord length',
    min: 1,
    max: 24,
    default: 4,
    taper: 'log',
    unit: 's',
    description:
      'How long each chord lasts. Sounds with the same spine and the same length, begun together, stay together. A rest longer than this starts over.',
  },
  voicing: {
    id: 3,
    name: 'Voicing',
    min: 0,
    max: VOICINGS.length - 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: VOICINGS,
    description:
      'How the pad and the arpeggio lay the chord out: close, the middle an octave up, the root (or the lowest) set low, the bass note added below, or the outer two alone.',
  },
  steps: {
    id: 4,
    name: 'Arp notes',
    min: 2,
    max: 16,
    default: 4,
    taper: 'linear',
    unit: '',
    step: 1,
    description: 'How many notes the arpeggio plays in each chord, going up through it and down.',
  },
  keys: {
    id: 5,
    name: 'Keys',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Timing', 'Octave', 'Degree'],
    description:
      'What the lowest held key decides besides when the spine runs: nothing more, the octave of the main role, or the degree the spine stands on.',
  },
  common: {
    id: 6,
    name: 'Common notes',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Struck', 'Held'],
    description:
      'A note of the pad, the bass or the drone that the next chord has too: struck again with it, or held on.',
  },
  pad: {
    id: 7,
    name: 'Pad',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'How hard the chords are played beside the main role; none at zero. Does nothing while Role is Pad, which then plays as hard as the keys.',
  },
  bass: {
    id: 8,
    name: 'Bass',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'How hard the bass is played beside the main role; none at zero. Does nothing while Role is Bass, which then plays as hard as the keys.',
  },
  arp: {
    id: 9,
    name: 'Arpeggio',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'How hard the arpeggio is played beside the main role; none at zero. Does nothing while Role is Arpeggio, which then plays as hard as the keys.',
  },
  bell: {
    id: 10,
    name: 'Bell',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'How hard the bell line is played beside the main role; none at zero. Does nothing while Role is Bell, which then plays as hard as the keys.',
  },
  drone: {
    id: 11,
    name: 'Drone',
    min: 0,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
    description:
      'How hard the tonic is held beside the main role; none at zero. Does nothing while Role is Drone, which then plays as hard as the keys.',
  },
} as const satisfies NoteMakerDescriptor['params']

// --- At work ----------------------------------------------------------------

/** Where each role lies on the white keys, over the tonic nearest middle C: what Octave brings to the lowest key. */
const HOMES: Readonly<Record<Role, number>> = { pad: -6, bass: -20, arp: 6, bell: 12, drone: -12 }
const MOST_OCTAVES = 2
/** The bell lets go before the chord does. */
const BELL_SHARE = 0.75
/** Less than this left of an arpeggio's slot, and the note waits for the next one. */
const LEAST_SLOT_SEC = 0.05
/** How long after a key is let go the lowest of those left is asked for. */
const LIFT_SEC = 0.08

/** A note of a role as it should sound now. */
interface Wanted {
  note: number
  level: number
  part: string | undefined
}

interface Standing extends Wanted {
  made: MadeNote
}

type Sustained = Exclude<Role, 'arp'>
const SUSTAINED: readonly Sustained[] = ['drone', 'bass', 'pad', 'bell']

class OneSpine extends MakerBase {
  private running = false
  /** When the first chord of the first round began, or would have at the present chord length. */
  private origin = 0
  /** The chord that sounds, counted on from the first through every round. */
  private index = 0
  private gapSince = -Infinity
  private slot = 0
  private octaves = 0
  private shift = 0
  private voiced: VoicedChord[] | null = null
  private readonly standing = new Map<Sustained, Standing[]>()
  private arpNote: Standing | null = null
  private chordTask: TaskHandle | null = null
  private arpTask: TaskHandle | null = null
  private bellTask: TaskHandle | null = null
  private liftTask: TaskHandle | null = null

  protected onNote(atSec: number): void {
    if (this.running) {
      if (this.listen()) this.revoice(atSec)
      return
    }
    this.running = true
    const { chord } = this.params
    // A rest shorter than a chord does not stop the count; a longer one starts it over.
    if (atSec - this.gapSince >= chord) this.origin = atSec
    this.index = Math.floor((atSec - this.origin) / chord + 1e-6)
    this.listen()
    this.strikeChord()
    this.startArp(atSec)
    this.planChord()
  }

  protected onRelease(atSec: number): void {
    if (!this.running) return
    if (this.held.size > 0) {
      // Fingers of one chord leave a little apart: what is left then is what is held.
      this.liftTask?.cancel()
      this.liftTask = this.at(atSec + LIFT_SEC, (due) => {
        if (this.listen()) this.revoice(due)
      })
      return
    }
    this.running = false
    this.gapSince = atSec
    this.stop()
  }

  protected override onParam(atSec: number, name: string): void {
    if (name === 'spine') this.voiced = null
    if (name === 'chord') {
      this.takeLength(atSec)
      return
    }
    if (!this.running) return
    if (name === 'steps') {
      this.slot = this.slotAt(atSec)
      this.planSlot()
      return
    }
    this.listen()
    this.revoice(atSec)
  }

  protected override onKey(atSec: number): void {
    this.voiced = null
    if (!this.running) return
    this.listen()
    this.revoice(atSec)
  }

  protected override onSilence(): void {
    this.running = false
    this.gapSince = -Infinity
    this.standing.clear()
    this.arpNote = null
    this.chordTask = this.arpTask = this.bellTask = this.liftTask = null
  }

  // --- The clock of the spine ------------------------------------------------

  private length = this.params.chord

  /** The chord that sounds keeps the share of itself that is over, and the count goes on at the new length. */
  private takeLength(atSec: number): void {
    const before = this.length
    this.length = this.params.chord
    // Through a gap as well: the count is in chords.
    this.origin = atSec - ((atSec - this.origin) / before) * this.length
    if (!this.running) return
    this.planChord()
    this.planBell()
    this.planSlot()
  }

  private begins(index: number): number {
    return this.origin + index * this.params.chord
  }

  private planChord(): void {
    this.chordTask?.cancel()
    this.chordTask = this.at(this.begins(this.index + 1), (atSec) => {
      this.index += 1
      this.endArp()
      this.listen()
      this.strikeChord()
      this.startArp(atSec)
      this.planChord()
    })
  }

  // --- What the keys decide --------------------------------------------------

  /** Take the place of the spine from the lowest key; true when that moved it. */
  private listen(): boolean {
    const low = Math.min(...[...this.held.values()].map((held) => held.note))
    let octaves = 0
    let shift = 0
    if (this.params.keys === 1) {
      const home = classNear(this.key.root, 60) + HOMES[this.mainRole()]
      octaves = Math.round((low - home) / 12)
      octaves = Math.max(-MOST_OCTAVES, Math.min(MOST_OCTAVES, octaves))
    } else if (this.params.keys === 2) {
      shift = mod(indexOf(this.key, low), this.key.steps.length)
    }
    if (octaves === this.octaves && shift === this.shift) return false
    if (shift !== this.shift) this.voiced = null
    this.octaves = octaves
    this.shift = shift
    return true
  }

  private loudest(): number {
    let gain = 0
    for (const held of this.held.values()) if (held.gain > gain) gain = held.gain
    return gain
  }

  // --- The roles ---------------------------------------------------------------

  private mainRole(): Role {
    return ROLES[this.params.role]
  }

  private levelOf(role: Role): number {
    return role === this.mainRole() ? 1 : this.params[role]
  }

  private chordNow(): VoicedChord {
    this.voiced ??= voicedSpine(this.key, this.params.spine, this.shift)
    return this.voiced[mod(this.index, CHORDS)]
  }

  /** The notes a role has in the chord that sounds. */
  private wanted(role: Role): Wanted[] {
    const level = this.levelOf(role)
    if (level <= 0) return []
    const main = role === this.mainRole()
    const part = main ? undefined : role
    const up = main ? 12 * this.octaves : 0
    return this.notesOf(role).map((note) => ({ note: note + up, level, part }))
  }

  private notesOf(role: Role): number[] {
    const chord = this.chordNow()
    switch (role) {
      case 'pad':
        return laidOut(chord, this.params.voicing)
      case 'bass':
        return [chord.bass]
      case 'bell':
        return [chord.close[chord.close.length - 1] + 12]
      case 'drone':
        return [classNear(this.key.root, 60) + DRONE_NOTE]
      case 'arp':
        return laidOut(chord, this.params.voicing).map((note) => note + 12)
    }
  }

  private begin(want: Wanted): Standing {
    return { ...want, made: this.start(want.note, this.loudest() * want.level, want.part) }
  }

  /** The next chord, on its time: everything that does not go on ends before anything begins. */
  private strikeChord(): void {
    const holds = this.params.common === 1
    this.settleOn(
      SUSTAINED,
      (role, was, want) => holds && role !== 'bell' && was.level === want.level,
    )
    this.planBell()
  }

  /** The same chord as it stands now, after something moved: only what differs is touched. */
  private revoice(atSec: number): void {
    // A bell that has rung in this chord has rung, and one that is out of place is let go.
    const rung = atSec >= this.bellEnd() - 1e-6
    this.settleOn(
      SUSTAINED.filter((role) => role !== 'bell' || !rung),
      () => true,
    )
    if (rung) {
      const [bell] = this.standing.get('bell') ?? []
      if (bell && !this.stillWanted('bell', bell)) this.endBell()
    } else this.planBell()
    const { arpNote } = this
    const stays = arpNote ? this.stillWanted('arp', arpNote) : this.levelOf('arp') <= 0
    if (!stays) this.startArp(atSec)
  }

  private stillWanted(role: Role, had: Standing): boolean {
    return this.wanted(role).some((want) => want.note === had.note && want.part === had.part)
  }

  private settleOn(
    roles: readonly Sustained[],
    goesOn: (role: Sustained, was: Standing, want: Wanted) => boolean,
  ): void {
    const starts: [Sustained, Standing[], Wanted[]][] = []
    for (const role of roles) {
      const before = this.standing.get(role) ?? []
      const kept: Standing[] = []
      const fresh: Wanted[] = []
      for (const want of this.wanted(role)) {
        const was = before.find(
          (had) => had.note === want.note && had.part === want.part && goesOn(role, had, want),
        )
        if (was) kept.push(was)
        else fresh.push(want)
      }
      for (const had of before) if (!kept.includes(had)) this.end(had.made)
      starts.push([role, kept, fresh])
    }
    for (const [role, kept, fresh] of starts)
      this.standing.set(role, [...kept, ...fresh.map((want) => this.begin(want))])
  }

  private bellEnd(): number {
    return this.begins(this.index) + BELL_SHARE * this.params.chord
  }

  private planBell(): void {
    this.bellTask?.cancel()
    this.bellTask = null
    if (!this.standing.get('bell')?.length) return
    // A key that came late in the chord still rings to the end of it.
    const due = this.bellEnd()
    const until = due > this.now + LEAST_SLOT_SEC ? due : this.begins(this.index + 1)
    this.bellTask = this.at(until, () => this.endBell())
  }

  private endBell(): void {
    for (const had of this.standing.get('bell') ?? []) this.end(had.made)
    this.standing.delete('bell')
  }

  // --- The arpeggio ------------------------------------------------------------

  private slotLength(): number {
    return this.params.chord / this.params.steps
  }

  private endArp(): void {
    this.arpTask?.cancel()
    this.arpTask = null
    this.end(this.arpNote?.made)
    this.arpNote = null
  }

  /** The arpeggio from where the chord stands: the slot that is running, or the next when that is nearly over. */
  private startArp(atSec: number): void {
    this.endArp()
    if (this.levelOf('arp') <= 0) return
    const slot = this.slotLength()
    this.slot = this.slotAt(atSec)
    const began = this.begins(this.index) + this.slot * slot
    if (atSec - began < 1e-6 || began + slot - atSec >= LEAST_SLOT_SEC) this.playSlot()
    this.planSlot()
  }

  private slotAt(atSec: number): number {
    const into = (atSec - this.begins(this.index)) / this.slotLength()
    return Math.max(0, Math.floor(into + 1e-6))
  }

  private planSlot(): void {
    this.arpTask?.cancel()
    this.arpTask = null
    if (this.levelOf('arp') <= 0) return
    // The chord that comes starts its own.
    if (this.slot + 1 >= this.params.steps) return
    this.arpTask = this.at(this.begins(this.index) + (this.slot + 1) * this.slotLength(), () => {
      this.endArp()
      this.slot += 1
      this.playSlot()
      this.planSlot()
    })
  }

  private playSlot(): void {
    const wanted = this.wanted('arp')
    if (wanted.length === 0) return
    this.arpNote = this.begin(wanted[upAndDown(this.slot, wanted.length)])
  }

  private stop(): void {
    this.chordTask?.cancel()
    this.chordTask = null
    this.bellTask?.cancel()
    this.bellTask = null
    this.liftTask?.cancel()
    this.liftTask = null
    this.endArp()
    for (const notes of this.standing.values()) for (const had of notes) this.end(had.made)
    this.standing.clear()
  }
}

/** What a set of five plays beside its main role. */
const BAND = { pad: 0.6, bass: 0.75, arp: 0.5, bell: 0.6, drone: 0.45 } as const

export const ONE_SPINE: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'one-spine',
  name: 'One Spine Five Roles',
  description:
    'Runs a progression of eight chords while a key is held, and plays one role of it or all: pad, bass, arpeggio, bell line, drone. Sounds on one spine fit each other.',
  kind: 'walks',
  version: 1,
  params: PARAMS,
  parts: [
    { id: 'pad', name: 'Pad', description: 'The chords, unless the pad is the main role.' },
    {
      id: 'bass',
      name: 'Bass',
      description: 'The lowest note of each chord, unless the bass is the main role.',
    },
    {
      id: 'arp',
      name: 'Arpeggio',
      description: 'The chord tones one by one, unless the arpeggio is the main role.',
    },
    {
      id: 'bell',
      name: 'Bell',
      description: 'The top note of each chord, unless the bell is the main role.',
    },
    { id: 'drone', name: 'Drone', description: 'The tonic, unless the drone is the main role.' },
  ],
  timed: { chord: 'time' },
  presets: {
    'Falling sevenths': {},
    'All five': { ...BAND },
    'Lament bass': { spine: 1, role: 1, chord: 6 },
    'Lament for strings': { spine: 1, voicing: 2, chord: 8, common: 1, bass: 0.7 },
    'Turning harp': { spine: 2, role: 2, steps: 8, voicing: 3, chord: 4 },
    'Borrowed evening': { spine: 3, voicing: 3, chord: 5, bell: 0.5 },
    'Circle, unhurried': { spine: 4, chord: 7, common: 1, bass: 0.7, bell: 0.45 },
    Tides: { spine: 5, voicing: 1, chord: 9, common: 1, drone: 0.4 },
    'Morning climb': { spine: 6, role: 2, steps: 6, chord: 5, pad: 0.45 },
    'Over one note': { spine: 7, common: 1, chord: 7, bass: 0.7, voicing: 1 },
    'Rocking boat': { spine: 8, role: 2, voicing: 2, steps: 6, chord: 3, bass: 0.7 },
    'Open road': { spine: 9, ...BAND, steps: 8, chord: 6, drone: 0 },
    'Rising fifths': { spine: 10, role: 3, chord: 3, pad: 0.4 },
    'Narrow gate': { spine: 11, voicing: 4, chord: 4, drone: 0.5, common: 1 },
    'Bright sill': { spine: 12, role: 2, steps: 12, chord: 8, voicing: 1, bass: 0.6 },
    'Stairs down': { spine: 13, role: 1, chord: 2.5, arp: 0.5, steps: 3 },
    'Long stay': { spine: 14, voicing: 3, chord: 14, common: 1, bell: 0.4 },
    'Open fourths': { spine: 15, role: 2, steps: 5, chord: 5, drone: 0.5, voicing: 0 },
    'Bell tower': { spine: 13, role: 3, chord: 3, bass: 0.55, drone: 0.35 },
    'Tonic and air': { spine: 5, role: 4, chord: 12, bell: 0.5, arp: 0.35, steps: 3 },
    'Where you stand': { spine: 2, keys: 2, chord: 4, bass: 0.7 },
    'Your own octave': { spine: 10, keys: 1, voicing: 4, chord: 3, bass: 0.6 },
  },
  create: (options?: MakerOptions) => new OneSpine(ONE_SPINE, options),
}
