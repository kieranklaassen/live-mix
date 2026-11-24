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
// came in.

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
  ['Climb', '1 2:7 3:7 4 5:sus4 6 4:7 5'],
  ['Pedal', '1 4/1 5/1 1:sus2 6/1 4/1 2/1 5/1'],
  ['Rocking', '2:7 5 2:7 5 4:7 1 4:7 1'],
  ['Open road', '6 4 1 5 6 1 4 2'],
  ['Fifths up', '4 1 5 2 6 3 6 1'],
  ['Narrow gate', '3:sus4 3 4:7 2:7 3 6 2 4'],
  ['Bright sill', '4 5/4 6/4 5/4 4:9 5/4 3 1/3'],
  ['Stairs', '1 5/7 6 3/5 4 1/3 2 5'],
  ['Long stay', '6 6:9 4 4:7 1 1:9 5:sus4 5'],
  ['Open fourths', '1:sus2 5:sus4 2:sus4 6:sus4 4:sus2 1:sus2 2:sus4 3:sus4'],
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

/** Where the degrees of a seven-note spine lie in major, for a scale that has no seven of them. */
const MAJOR_KEY: MakerKey = { root: 0, steps: [0, 2, 4, 5, 7, 9, 11] }

/** The step of a scale that stands for a degree of the spine: itself in a scale of seven, else the nearest. */
function stepFor(key: MakerKey, degree: number): number {
  const size = key.steps.length
  if (size === 7) return degree
  return mod(indexOf({ root: 0, steps: key.steps }, MAJOR_KEY.steps[degree]), size)
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

/**
 * The pitch classes of a chord over the tonic, in the order its colour names
 * them. A scale that has no seven steps gives, for each tone, the step of its
 * own nearest to where the tone lies in major, and no step twice.
 */
function chordClasses(key: MakerKey, step: number, { degree, colour }: SpineChord): number[] {
  const size = key.steps.length
  const root = key.steps[step]
  if (size === 7) {
    const over = TONES[colour].map((count) => semitones(key, step, count))
    // Only a third under a perfect fifth has another to change places with.
    if (colour === 'turn' && over[2] === 7 && (over[1] === 3 || over[1] === 4))
      over[1] = 7 - over[1]
    return over.map((semis) => mod(root + semis, 12))
  }
  const taken: number[] = []
  for (const count of TONES[colour]) {
    const wish = mod(semitones(MAJOR_KEY, degree, count), 12)
    let best = -1
    let distance = Infinity
    // The root stays the root's: another tone near it takes the step beside it.
    for (let i = count === 0 ? 0 : 1; i < (count === 0 ? 1 : size); i += 1) {
      const over = semitones(key, step, i)
      if (taken.includes(over) || Math.abs(over - wish) >= distance) continue
      best = over
      distance = Math.abs(over - wish)
    }
    if (best >= 0) taken.push(best)
  }
  return (taken.length > 0 ? taken : [0]).map((semis) => mod(root + semis, 12))
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
  /** Turned from the order its colour names, which is a little less to the point. */
  turned: boolean
}

function padOptions(classes: readonly number[]): PadOption[] {
  const options: PadOption[] = []
  for (let first = 0; first < classes.length; first += 1) {
    for (let octave = -24; octave <= 24; octave += 12) {
      const notes = [classes[first] + octave]
      for (let i = 1; i < classes.length; i += 1) {
        const last = notes[i - 1]
        notes.push(last + mod(classes[(first + i) % classes.length] - last - 1, 12) + 1)
      }
      notes.sort((a, b) => a - b)
      if (notes[0] >= PAD_LOWEST && notes[notes.length - 1] <= PAD_HIGHEST)
        options.push({ notes, turned: first > 0 })
    }
  }
  if (options.length > 0) return options
  return [{ notes: classes.map((semis) => semis - 12).sort((a, b) => a - b), turned: false }]
}

function mean(notes: readonly number[]): number {
  return notes.reduce((sum, note) => sum + note, 0) / notes.length
}

/** The eight chords of a spine in a key, `shift` degrees up, as notes. */
export function voicedSpine(key: MakerKey, spineIndex: number, shift = 0): VoicedChord[] {
  const spine = READ[spineIndex]
  const size = key.steps.length
  const roots = rootSteps(key, spine).map((step) => mod(step + shift, size))
  const pads = leastRound<PadOption>(
    roots.map((step, i) => padOptions(chordClasses(key, step, spine[i]))),
    ({ notes, turned }) => 0.25 * Math.abs(mean(notes) - PAD_CENTRE) + (turned ? 1 : 0),
    (a, b) => {
      let sum = 0
      for (let i = 0; i < Math.min(a.notes.length, b.notes.length); i += 1)
        sum += Math.abs(a.notes[i] - b.notes[i])
      return sum / 3
    },
  )
  const basses = leastRound<number>(
    spine.map(({ degree, bass }, i) => {
      const step = bass === degree ? roots[i] : mod(stepFor(key, bass) + shift, size)
      const options: number[] = []
      for (let note = key.steps[step] - 48; note <= BASS_HIGHEST; note += 12)
        if (note >= BASS_LOWEST) options.push(note)
      return options
    }),
    (note) => 0.3 * Math.abs(note - BASS_HOME),
    (a, b) => Math.abs(a - b),
  )
  const tonic = classNear(key.root, 60)
  return pads.map(({ notes }, i) => ({
    close: notes.map((note) => note + tonic),
    bass: basses[i] + tonic,
  }))
}

const VOICINGS = ['Close', 'Open', 'Wide', 'Full', 'Thin'] as const

/** A chord laid out: what the pad plays, and an octave up the arpeggio. */
function laidOut({ close, bass }: VoicedChord, voicing: number): number[] {
  const last = close.length - 1
  switch (VOICINGS[voicing]) {
    case 'Open':
      return close.map((note, i) => (i > 0 && i < last ? note + 12 : note)).sort((a, b) => a - b)
    case 'Wide':
      return [close[0] - 12, ...close.slice(1)]
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
      'Which eight chords run. All are made of the notes of the key but Borrowed, which turns its fourth chord minor for one chord.',
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
      'How the chord is laid out for the pad and the arpeggio: close, with its middle raised, with its floor lowered, with the bass note under it, or outer notes alone.',
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
      'How hard the chords are played beside the main role. At zero there are none, unless the pad is the main role.',
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
      'How hard the bass is played beside the main role. At zero there is none, unless the bass is the main role.',
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
      'How hard the arpeggio is played beside the main role. At zero there is none, unless the arpeggio is the main role.',
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
      'How hard the bell line is played beside the main role. At zero there is none, unless the bell is the main role.',
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
      'How hard the tonic is held beside the main role. At zero there is none, unless the drone is the main role.',
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
    if (this.held.size > 0 || !this.running) return
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
    this.chordTask = this.arpTask = this.bellTask = null
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
    for (const held of this.held.values()) gain = Math.max(gain, held.gain)
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
