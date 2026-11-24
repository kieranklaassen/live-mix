// Six voices from one line: each note played also sounds its mirror round a
// centre, the middle between it and the centre, the mirror of that middle,
// its octave flip and the centre itself. Everything is counted in steps of
// the key, so no voice leaves it. The centre is the key's second degree by
// default (D4 on the white keys) and may walk while notes are held: what it
// moves is voiced again one voice after another, softly, and a note that two
// voices share is kept and not struck again. The further a voice lies from the
// centre, the quieter it is played. The voices come one after another when
// `delay` is over zero, which makes a canon of short delays and a strum of
// very short ones.
//
// The arithmetic is that of cpp/devices/thesis/ThesisTransform.h: the middle
// is the lower of two where it falls between two steps, and the octave flip
// is the played note an octave towards the other side of the centre.

import { foldNote, MakerBase, type HeldNote, type MadeNote, type TaskHandle } from './base'
import { classNear, indexOf, noteAt } from './key'
import { MakerRandom } from './random'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

/** Where the centre goes, in steps of a seven-note scale from where it stands, one for each stretch of time. */
const WALKS: readonly (readonly number[])[] = [
  [0],
  [0, 1, 3, 0],
  [0, -1, -3, 0],
  [0, 1, 0, -1],
  [0, 3, 0, -3],
  [0, 2, 4, 2],
]

const PARAMS = {
  line: {
    id: 0,
    name: 'Line',
    min: 0,
    max: 1,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'How hard the note you play sounds itself, taken to the nearest note of the key. At zero only the voices made from it are heard.',
  },
  mirror: {
    id: 1,
    name: 'Mirror',
    min: 0,
    max: 1,
    default: 0.65,
    taper: 'linear',
    unit: '',
    description:
      'Level of the mirror: as many steps below the centre as the note is above it, and the other way round.',
  },
  middle: {
    id: 2,
    name: 'Middle',
    min: 0,
    max: 1,
    default: 0.4,
    taper: 'linear',
    unit: '',
    description: 'Level of the middle: the note halfway between yours and the centre.',
  },
  mirrorMiddle: {
    id: 3,
    name: 'Mirror middle',
    min: 0,
    max: 1,
    default: 0.35,
    taper: 'linear',
    unit: '',
    description: 'Level of the mirror of the middle: the halfway note on the other side.',
  },
  octaflip: {
    id: 4,
    name: 'Octave flip',
    min: 0,
    max: 1,
    default: 0.3,
    taper: 'linear',
    unit: '',
    description:
      'Level of the octave flip: your note an octave down when it is above the centre, an octave up when it is below.',
  },
  centreLevel: {
    id: 5,
    name: 'Centre level',
    min: 0,
    max: 1,
    default: 0.3,
    taper: 'linear',
    unit: '',
    description: 'Level of the centre: the note that stands still while the others turn round it.',
  },
  fall: {
    id: 6,
    name: 'Fall',
    min: 0,
    max: 4,
    default: 1,
    taper: 'linear',
    unit: '',
    description:
      'How much quieter a made voice is the further it lies from the centre. At one it halves for each octave; at zero distance does not count.',
  },
  delay: {
    id: 7,
    name: 'Delay',
    min: 0,
    max: 3,
    default: 0,
    taper: 'linear',
    unit: 's',
    description:
      'How long each voice waits after the one before it. A few hundredths strum the chord; half a second or more makes a canon.',
  },
  order: {
    id: 8,
    name: 'Order',
    min: 0,
    max: 5,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Voices', 'Pairs', 'Outward', 'Inward', 'Upward', 'Downward'],
    description:
      'Which voice comes first under Delay: mirror first, mirrors in pairs, nearest the centre, furthest from it, lowest or highest.',
  },
  hold: {
    id: 9,
    name: 'Centre hold',
    min: 0,
    max: 8,
    default: 0,
    taper: 'linear',
    unit: 's',
    description:
      'At zero the centre is struck with each note. Over zero it is one held note under all of them, and stays this long after the last key.',
  },
  human: {
    id: 10,
    name: 'Humanize',
    min: 0,
    max: 1,
    default: 0.2,
    taper: 'linear',
    unit: '',
    description:
      'Lets each made voice come up to eight hundredths of a second late and a little louder or softer, as players do.',
  },
  centre: {
    id: 11,
    name: 'Centre',
    min: -14,
    max: 14,
    default: 1,
    taper: 'linear',
    unit: 'st',
    step: 1,
    description:
      'The note everything turns round, in scale steps from the root near middle C. One is the second degree: D4 on the white keys.',
  },
  walk: {
    id: 12,
    name: 'Walk',
    min: 0,
    max: 5,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Still', 'Climb', 'Sink', 'Sway', 'Open', 'Triad'],
    description:
      'Moves the centre while you play, from D: Climb D E G D, Sink D C A D, Sway D E D C, Open D G D A, Triad D F A F.',
  },
  walkTime: {
    id: 13,
    name: 'Walk time',
    min: 1,
    max: 32,
    default: 8,
    taper: 'log',
    unit: 's',
    description:
      'How long the centre stays on each note of its walk. After a rest this long the walk begins again.',
  },
} as const satisfies NoteMakerDescriptor['params']

type MadeKind = 'mirror' | 'middle' | 'mirrorMiddle' | 'octaflip' | 'centre'
type Kind = 'line' | MadeKind

const MADE: readonly MadeKind[] = ['mirror', 'middle', 'mirrorMiddle', 'octaflip', 'centre']

const LEVELS = {
  line: 'line',
  mirror: 'mirror',
  middle: 'middle',
  mirrorMiddle: 'mirrorMiddle',
  octaflip: 'octaflip',
  centre: 'centreLevel',
} as const satisfies Record<Kind, keyof typeof PARAMS>

const PARTS: Record<MadeKind, string> = {
  mirror: 'mirror',
  middle: 'middle',
  mirrorMiddle: 'mirror-middle',
  octaflip: 'octaflip',
  centre: 'centre',
}

/** Which of the made voices come together under the order Pairs. */
const PAIRS: Record<MadeKind, number> = {
  mirror: 0,
  octaflip: 0,
  middle: 1,
  mirrorMiddle: 1,
  centre: 2,
}

/** A made voice is this much behind the key, so the keys of a chord are struck before what they share is joined. */
const LEAD_SEC = 0.002
/** The most a voice is late at a full Humanize. */
const LATE_SEC = 0.08
/** Two strikes of a pitch nearer than this are one attack; of two made voices, as late as they may be. */
const ONE_ATTACK_SEC = 0.02
const MADE_ATTACK_SEC = 0.1
/** After a control was moved, how long it has to rest before what sounds follows it. */
const SETTLE_SEC = 0.12
/** A voice that moves with the centre is struck at this share of its level. */
const SOFT = 0.75
/** The first voice moves this long after the centre, each next one this much later, all inside the last. */
const MOVE_SEC = 0.03
const MOVE_GAP_SEC = 0.06
const MOVE_ALL_SEC = 0.6
/** How long a voice that moves holds the note it leaves. */
const OVERLAP_SEC = 0.2
/** No more notes than this at once: a voice that would be one more is left out. */
const MOST_SOUNDING = 48

/** The index of the key's root near middle C, whatever the key. */
export function rootIndex(key: MakerKey): number {
  return indexOf(key, classNear(key.root, 60))
}

/** Scale steps of a seven-note scale as steps of this one: D E G is D E G on five notes too. */
export function scaledSteps(key: MakerKey, steps: number): number {
  return Math.round((steps * key.steps.length) / 7)
}

/** The step index of a voice, for a note at step `at` and a centre at step `centre`. */
export function voiceIndex(kind: Kind, at: number, centre: number, size: number): number {
  const middle = Math.floor((at + centre) / 2)
  switch (kind) {
    case 'line':
      return at
    case 'mirror':
      return 2 * centre - at
    case 'middle':
      return middle
    case 'mirrorMiddle':
      return 2 * centre - middle
    case 'octaflip':
      return at > centre ? at - size : at < centre ? at + size : at
    case 'centre':
      return centre
  }
}

/** A pitch that sounds on an instrument, and how many voices are on it. */
interface Sound {
  key: string
  made: MadeNote
  gain: number
  atSec: number
  voices: number
}

type Coming = 'play' | 'strike' | 'meet' | 'again'

interface Voice {
  kind: Kind
  /** The note played, which is taken to the key anew when the key changes. */
  note: number
  /** The played note's velocity, with the voice's own chance in it. */
  gain: number
  /** How long after the key the voice begins, and so after its end it ends. */
  delay: number
  state: 'waiting' | 'on' | 'over'
  pitch: number
  level: number
  sound: Sound | null
}

class SixVoices extends MakerBase {
  private readonly own: ReadonlySet<string>
  private readonly sounds = new Map<string, Sound>()
  /** The voices of each held key. */
  private readonly byKey = new Map<number, Voice[]>()
  private readonly live = new Set<Voice>()
  private random = new MakerRandom(6)
  private drone: Voice | null = null
  private droneEnd: TaskHandle | null = null
  private settling: TaskHandle | null = null
  private walking: TaskHandle | null = null
  /** The walk: when the stretch `walkFrom` began, and how long a stretch is. */
  private walkStart = 0
  private walkFrom = 0
  private walkEvery: number
  private begun = false
  private lastUp = 0

  constructor(descriptor: NoteMakerDescriptor, options?: MakerOptions) {
    super(descriptor, options)
    this.own = new Set(options?.parts)
    this.walkEvery = this.params.walkTime
  }

  protected onNote(atSec: number, held: HeldNote): void {
    if (this.held.size === 1) {
      if (!this.begun || atSec - this.lastUp >= this.walkEvery) {
        this.walkStart = atSec
        this.walkFrom = 0
        this.walking?.cancel()
        this.walking = null
        // What still sounds from before the rest follows the centre back.
        this.settleSoon(atSec)
      }
      this.begun = true
    }
    const { human, hold } = this.params
    const voices: Voice[] = [this.voice('line', held.note, held.gain, 0)]
    const delays = this.delays(held.note)
    for (const kind of MADE) {
      const late = human * LATE_SEC * this.random.next()
      const gain = held.gain * (1 + human * 0.5 * (this.random.next() - 0.5))
      const voice = this.voice(kind, held.note, gain, LEAD_SEC + (delays.get(kind) ?? 0) + late)
      if (kind !== 'centre' || hold <= 0) voices.push(voice)
      else if (!this.drone) {
        this.drone = voice
        this.beginAfter(atSec, voice)
      } else continue
      this.live.add(voice)
    }
    this.droneEnd?.cancel()
    this.droneEnd = null
    this.live.add(voices[0])
    this.byKey.set(held.id, voices)
    for (const voice of voices) this.beginAfter(atSec, voice)
    this.keepWalking()
  }

  protected onRelease(atSec: number, held: HeldNote): void {
    const voices = this.byKey.get(held.id) ?? []
    this.byKey.delete(held.id)
    for (const voice of voices) {
      if (voice.delay <= 0) this.finish(voice)
      else this.at(atSec + voice.delay, () => this.finish(voice))
    }
    if (this.held.size > 0) return
    this.lastUp = atSec
    this.endDrone()
  }

  protected override onParam(atSec: number, name: string): void {
    if (name === 'hold') {
      if (this.held.size === 0) this.endDrone()
    } else if (name === 'walkTime' || name === 'walk') {
      const through = (atSec - this.walkStart) / this.walkEvery
      const whole = Math.floor(through + 1e-9)
      this.walkEvery = this.params.walkTime
      if (name === 'walk') {
        this.walkFrom = 0
        this.walkStart = atSec
      } else {
        // As far through its stretch as it was, at the new length.
        this.walkFrom += whole
        this.walkStart = atSec - Math.max(0, through - whole) * this.walkEvery
      }
      this.walking?.cancel()
      this.walking = null
      this.keepWalking()
    }
    if (name !== 'delay' && name !== 'order' && name !== 'human') this.settleSoon(atSec)
  }

  protected override onKey(atSec: number): void {
    this.settleSoon(atSec)
  }

  protected override onSilence(): void {
    this.sounds.clear()
    this.byKey.clear()
    this.live.clear()
    this.drone = this.droneEnd = this.settling = this.walking = null
    this.random = new MakerRandom(6)
    this.begun = false
    this.walkFrom = 0
  }

  // --- The rule -------------------------------------------------------------

  /** The step index of the centre now, with its walk in it. */
  private centreIndex(): number {
    const path = WALKS[this.params.walk]
    const gone = Math.floor((this.now - this.walkStart) / this.walkEvery + 1e-9)
    const step = path[Math.max(0, this.walkFrom + gone) % path.length]
    return rootIndex(this.key) + this.params.centre + scaledSteps(this.key, step)
  }

  /** Steps between a voice and the centre, and the note it plays. */
  private place(kind: Kind, note: number): { steps: number; pitch: number } {
    const centre = this.centreIndex()
    const index = voiceIndex(kind, indexOf(this.key, note), centre, this.key.steps.length)
    const pitch = noteAt(this.key, index)
    return {
      steps: index - centre,
      pitch: foldNote(kind === 'line' ? pitch : this.inside(pitch)),
    }
  }

  /** A made voice stays in the range of a piece: from A1 to E7 in C, so far up or down in another key. */
  private inside(pitch: number): number {
    const root = classNear(this.key.root, 60)
    let folded = pitch
    while (folded < root - 27) folded += 12
    while (folded > root + 40) folded -= 12
    return folded
  }

  private levelOf(voice: Voice): number {
    const level = this.params[LEVELS[voice.kind]] * voice.gain
    if (voice.kind === 'line') return level
    const octaves = Math.abs(this.place(voice.kind, voice.note).steps) / this.key.steps.length
    return level * Math.pow(2, -this.params.fall * octaves)
  }

  /** How long after the key each made voice comes. Voices that are off take no turn. */
  private delays(note: number): Map<MadeKind, number> {
    const { delay, order, line } = this.params
    const sounding = MADE.filter((kind) => this.params[LEVELS[kind]] > 0)
    const rank = (kind: MadeKind): number => {
      const { steps, pitch } = this.place(kind, note)
      if (order === 1) return PAIRS[kind]
      if (order === 2) return Math.abs(steps)
      if (order === 3) return -Math.abs(steps)
      if (order === 4) return pitch
      if (order === 5) return -pitch
      return MADE.indexOf(kind)
    }
    const turns = [...new Set(sounding.map(rank))].sort((a, b) => a - b)
    // Where the line is off, the first voice does not wait for it.
    const first = line > 0 ? 1 : 0
    return new Map(sounding.map((kind) => [kind, delay * (first + turns.indexOf(rank(kind)))]))
  }

  // --- The voices -------------------------------------------------------------

  private voice(kind: Kind, note: number, gain: number, delay: number): Voice {
    return { kind, note, gain, delay, state: 'waiting', pitch: 0, level: 0, sound: null }
  }

  private beginAfter(atSec: number, voice: Voice): void {
    if (voice.delay <= 0) this.begin(voice)
    else this.at(atSec + voice.delay, () => this.begin(voice))
  }

  private begin(voice: Voice): void {
    if (voice.state !== 'waiting') return
    voice.state = 'on'
    this.sing(voice, 1, voice.kind === 'line' ? 'play' : 'strike')
  }

  /** Put a voice on the note it has now, and let go of the one it had before. */
  private sing(voice: Voice, share: number, how: Coming): void {
    const before = voice.sound
    voice.level = this.levelOf(voice)
    voice.pitch = this.place(voice.kind, voice.note).pitch
    const part = voice.kind === 'line' ? undefined : PARTS[voice.kind]
    voice.sound = voice.level > 0 ? this.take(voice.pitch, part, voice.level * share, how) : null
    if (!before) return
    if (voice.sound === before || !voice.sound) this.leave(before)
    else this.at(this.now + OVERLAP_SEC, () => this.leave(before))
  }

  private finish(voice: Voice): void {
    if (voice.state === 'over') return
    voice.state = 'over'
    this.live.delete(voice)
    this.leave(voice.sound)
    voice.sound = null
  }

  private endDrone(): void {
    const drone = this.drone
    if (!drone) return
    this.droneEnd?.cancel()
    this.droneEnd = this.at(this.lastUp + drone.delay + this.params.hold, () => {
      this.drone = this.droneEnd = null
      this.finish(drone)
    })
  }

  // --- What sounds --------------------------------------------------------------

  /**
   * A voice comes to a pitch. A key strikes it. A made voice strikes it too,
   * but joins a note that was played harder, and one that comes to it by
   * moving joins whatever is there. One that is there already and has
   * another level is struck again, unless another voice holds it.
   */
  private take(pitch: number, part: string | undefined, gain: number, how: Coming): Sound | null {
    const key = `${part !== undefined && this.own.has(part) ? part : ''}:${pitch}`
    const there = this.sounds.get(key)
    if (!there) {
      if (how !== 'play' && this.sounds.size >= MOST_SOUNDING) return null
      const sound: Sound = {
        key,
        made: this.start(pitch, gain, part),
        gain,
        atSec: this.now,
        voices: 1,
      }
      this.sounds.set(key, sound)
      return sound
    }
    there.voices += 1
    const enough =
      this.now - there.atSec < (how === 'play' ? ONE_ATTACK_SEC : MADE_ATTACK_SEC)
        ? gain <= there.gain * (how === 'play' ? 1.1 : 2)
        : how === 'strike' && there.gain > gain * 1.25
    const joins = how === 'meet' || (how === 'again' && there.voices > 2) || enough
    if (!joins) {
      this.end(there.made)
      there.made = this.start(pitch, gain, part)
      there.gain = gain
      there.atSec = this.now
    }
    return there
  }

  private leave(sound: Sound | null): void {
    if (!sound) return
    sound.voices -= 1
    if (sound.voices > 0) return
    this.sounds.delete(sound.key)
    this.end(sound.made)
  }

  // --- While notes are held -----------------------------------------------------

  private keepWalking(): void {
    if (this.walking || this.params.walk === 0 || this.live.size === 0) return
    const gone = Math.floor((this.now - this.walkStart) / this.walkEvery + 1e-9)
    this.walking = this.at(this.walkStart + (gone + 1) * this.walkEvery, () => {
      this.walking = null
      this.revoice()
      this.keepWalking()
    })
  }

  private settleSoon(atSec: number): void {
    this.settling?.cancel()
    this.settling =
      this.live.size === 0
        ? null
        : this.at(atSec + SETTLE_SEC, () => {
            this.settling = null
            this.revoice()
          })
  }

  /** What has moved, or come or gone by its level, goes there one voice after another. */
  private revoice(): void {
    const moving = [...this.live].filter((voice) => this.off(voice))
    // Voices on one note move together.
    const turns = [...new Set(moving.map((voice) => voice.pitch))].sort((a, b) => a - b)
    const gap = Math.min(MOVE_GAP_SEC, MOVE_ALL_SEC / Math.max(1, turns.length))
    for (const voice of moving) {
      this.at(this.now + MOVE_SEC + turns.indexOf(voice.pitch) * gap, () => {
        if (!this.off(voice)) return
        const moves = voice.pitch !== this.place(voice.kind, voice.note).pitch
        if (!voice.sound) this.sing(voice, SOFT, 'strike')
        else if (moves) this.sing(voice, SOFT, 'meet')
        else this.sing(voice, 1, 'again')
      })
    }
  }

  /** Whether a voice is not where it should be, or not as loud. */
  private off(voice: Voice): boolean {
    if (voice.state !== 'on') return false
    const level = this.levelOf(voice)
    if (level <= 0 || !voice.sound) return level > 0 !== (voice.sound !== null)
    if (voice.pitch !== this.place(voice.kind, voice.note).pitch) return true
    return level > voice.level * 1.2 || level < voice.level / 1.2
  }
}

export const SIX_VOICES: NoteMakerDescriptor<typeof PARAMS> = {
  id: 'six-voices',
  name: 'Six Voices From One Line',
  description:
    'Plays each note with its mirror round a centre, the middle, the mirror of the middle, its octave flip and the centre, all in the key: one line becomes a choir.',
  kind: 'answers',
  version: 1,
  params: PARAMS,
  parts: [
    { id: 'mirror', name: 'Mirror', description: 'The note turned round the centre.' },
    { id: 'middle', name: 'Middle', description: 'The note halfway to the centre.' },
    {
      id: 'mirror-middle',
      name: 'Mirror middle',
      description: 'The halfway note turned round the centre.',
    },
    {
      id: 'octaflip',
      name: 'Octave flip',
      description: 'The played note an octave towards the other side.',
    },
    { id: 'centre', name: 'Centre', description: 'The note the others turn round.' },
  ],
  timed: { delay: 'time', hold: 'time', walkTime: 'time' },
  presets: {
    'All six': {},
    'Open fan': { middle: 0, mirrorMiddle: 0, octaflip: 0, centreLevel: 0, mirror: 0.8, fall: 0.4 },
    'Filled fan': { mirror: 0.7, middle: 0.5, mirrorMiddle: 0, octaflip: 0, centreLevel: 0 },
    'Over one note': {
      mirror: 0,
      middle: 0,
      mirrorMiddle: 0,
      octaflip: 0,
      centreLevel: 0.6,
      hold: 4,
      centre: -6,
    },
    'Four in canon': {
      mirror: 0.8,
      middle: 0.6,
      mirrorMiddle: 0.55,
      octaflip: 0,
      centreLevel: 0,
      delay: 0.5,
      fall: 0.4,
      human: 0.1,
    },
    'Long canon': {
      mirror: 0.75,
      middle: 0,
      mirrorMiddle: 0.6,
      octaflip: 0.5,
      centreLevel: 0.3,
      delay: 2,
      hold: 6,
      fall: 0.5,
    },
    'Rolled up': { delay: 0.05, order: 4, mirror: 0.7, middle: 0.5, octaflip: 0.5, human: 0.4 },
    'Falling water': {
      delay: 0.22,
      order: 5,
      octaflip: 0.6,
      mirror: 0.6,
      mirrorMiddle: 0.5,
      fall: 0.6,
    },
    'Out from the middle': {
      delay: 0.35,
      order: 2,
      centreLevel: 0.5,
      middle: 0.5,
      mirrorMiddle: 0.5,
      mirror: 0.6,
      octaflip: 0.5,
      fall: 0.8,
      line: 0.8,
    },
    'Closing in': {
      delay: 0.6,
      order: 3,
      octaflip: 0.7,
      mirror: 0.7,
      middle: 0.5,
      mirrorMiddle: 0.45,
      centreLevel: 0.4,
      fall: 0,
    },
    'By twos': { delay: 0.75, order: 1, mirror: 0.6, octaflip: 0.4, fall: 0.5, human: 0.3 },
    'Hidden tune': {
      line: 0,
      mirror: 0.8,
      middle: 0.6,
      mirrorMiddle: 0.5,
      octaflip: 0.4,
      fall: 0.5,
    },
    'Slow hills': { walk: 1, walkTime: 8, hold: 5, centreLevel: 0.45, mirror: 0.6 },
    'Slow valleys': {
      walk: 2,
      walkTime: 6,
      hold: 5,
      centreLevel: 0.45,
      octaflip: 0.4,
      middle: 0.3,
      mirrorMiddle: 0,
    },
    Breathing: { walk: 3, walkTime: 3, hold: 2, middle: 0.5, mirrorMiddle: 0.5, mirror: 0.45 },
    'Two pillars': {
      walk: 4,
      walkTime: 12,
      hold: 8,
      centre: -6,
      centreLevel: 0.6,
      mirror: 0,
      middle: 0.35,
      mirrorMiddle: 0,
      octaflip: 0.4,
      fall: 0.5,
    },
    'Turning chord': {
      walk: 5,
      walkTime: 4,
      mirror: 0.55,
      middle: 0.45,
      mirrorMiddle: 0.4,
      octaflip: 0,
      hold: 1,
      delay: 0.12,
      order: 2,
    },
    'High round': {
      centre: 8,
      mirror: 0.6,
      middle: 0.5,
      mirrorMiddle: 0.4,
      octaflip: 0,
      fall: 0.6,
    },
    'Deep round': {
      centre: -6,
      mirror: 0.45,
      middle: 0.5,
      mirrorMiddle: 0.2,
      octaflip: 0.45,
      fall: 1,
    },
    'On the fifth': {
      centre: 4,
      mirror: 0.7,
      middle: 0.4,
      mirrorMiddle: 0.4,
      centreLevel: 0.5,
      hold: 3,
    },
    'Octave shadow': {
      mirror: 0,
      middle: 0,
      mirrorMiddle: 0,
      octaflip: 0.7,
      centreLevel: 0.25,
      delay: 0.3,
      fall: 0.3,
      hold: 2,
    },
    'Bell answers': {
      mirror: 0.6,
      middle: 0.5,
      mirrorMiddle: 0.45,
      octaflip: 0.55,
      centreLevel: 0.5,
      centre: 8,
      delay: 0.9,
      fall: 0.3,
      human: 0.5,
    },
  },
  create: (options?: MakerOptions) => new SixVoices(SIX_VOICES, options),
}
