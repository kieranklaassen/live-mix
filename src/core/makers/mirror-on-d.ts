// Mirror on D: what is played, turned upside down round the one note the
// scale reads the same from both ways. On the white keys that note is D, so
// note n becomes 124 - n: C E G becomes E C A, a rising line falls, and
// nothing leaves the key. In any other key it is that key's own such note,
// and a note outside the key is as far outside it on the other side.

import { classNear, degreeClass, indexOf, mirrorDegree, noteAt } from './key'
import { MakerBase, type HeldNote, type MadeNote } from './base'
import { type MakerKey, type MakerOptions, type NoteMakerDescriptor } from './types'

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
      'How many octaves a mirror may be moved back towards the note it came from, so a mirrored bass stays low. At zero it lies where it falls.',
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
    description: 'In Answer, how long nothing has to be held before the next phrase begins.',
  },
} as const satisfies NoteMakerDescriptor['params']

/** `note` turned round the axis `axis`, which may lie between two notes. */
export function mirrored(key: MakerKey, note: number, axis: number): number {
  const centre = indexOf(key, note)
  const inScale = noteAt(key, centre)
  return 2 * axis - inScale - (note - inScale)
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

/** What one held key plays: its own note, and its mirror, which can be later than it. */
interface Voice {
  own: MadeNote | null
  mirror: MadeNote | null
  delay: number
}

class MirrorOnD extends MakerBase {
  private readonly voices = new Map<number, Voice>()
  /** In Answer, whether the phrase being played is one that is mirrored. */
  private turned = false
  private begun = false
  private emptySince = 0

  protected onNote(atSec: number, held: HeldNote): void {
    const { mode, octave, fold, turns, delay, level } = this.params
    if (this.held.size === 1) {
      if (this.begun && atSec - this.emptySince >= this.params.rest) this.turned = !this.turned
      this.begun = true
    }
    const axis = axisNote(this.key, octave, this.params.axis === 1)
    const stays = (turns === 1 && held.note < axis) || (turns === 2 && held.note > axis)
    const plays = stays || mode === 1 || (mode === 2 && !this.turned)
    const voice: Voice = {
      own: plays ? this.start(held.note, held.gain) : null,
      mirror: null,
      delay,
    }
    this.voices.set(held.id, voice)
    if (stays || (mode === 2 && !this.turned)) return
    const turn = foldTowards(mirrored(this.key, held.note, axis), held.note, fold)
    const begin = (): void => {
      voice.mirror = this.start(turn, held.gain * level, 'mirror')
    }
    if (delay <= 0) begin()
    else this.at(atSec + delay, begin)
  }

  protected onRelease(atSec: number, held: HeldNote): void {
    this.emptySince = atSec
    const voice = this.voices.get(held.id)
    this.voices.delete(held.id)
    if (!voice) return
    this.end(voice.own)
    // As late as the mirror began, it is held as long as the note was.
    this.at(atSec + voice.delay, () => this.end(voice.mirror))
  }

  protected override onSilence(): void {
    this.voices.clear()
    this.turned = false
    this.begun = false
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
  timed: { delay: 'time' },
  presets: {
    'Both ways': {},
  },
  create: (options?: MakerOptions) => new MirrorOnD(MIRROR_ON_D, options),
}
