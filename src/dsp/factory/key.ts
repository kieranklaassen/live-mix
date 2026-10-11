// The key the bank's sounds are in. Every factory sound is written on the
// white keys, which are C major, A minor, D dorian and the other modes of the
// same seven notes at once; so one transposition moves the whole bank into
// any other key, and each sound stays inside it. A generated sound (see
// ./generate.ts) is written for a key from the start.
//
// Everything here is arithmetic on notes and the bank's own data: no audio.

import { type Patch, type PatchDevice, patchDeviceParams } from '../../core/devices/patch'
import { type Phrase } from '../patch-render'
import { describeStockWasmDevice } from '../registry'
import { mod12, pitchClassName } from './words'

export { PITCH_CLASS_NAMES, pitchClassName, transposeWords } from './words'

/** The seven-note modes a key can have, as semitones above its root. */
export const FACTORY_MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
} as const satisfies Record<string, readonly number[]>

export type FactoryMode = keyof typeof FACTORY_MODES

/** A key: `root` is a pitch class, 0 (C) to 11 (B). */
export interface FactoryKey {
  root: number
  mode: FactoryMode
}

/** The key the bank is written in: C major, which is every white-key mode. */
export const FACTORY_HOME_KEY: FactoryKey = { root: 0, mode: 'major' }

/** Where each mode sits on the white keys: D dorian, A minor and so on. */
const WHITE_KEY_ROOT: Readonly<Record<FactoryMode, number>> = {
  major: 0,
  dorian: 2,
  phrygian: 4,
  lydian: 5,
  mixolydian: 7,
  minor: 9,
}

/** The root of the major key with the same seven notes: C for A minor, for D dorian, for C major. */
export function relativeMajorRoot(key: FactoryKey): number {
  return mod12(key.root - WHITE_KEY_ROOT[key.mode])
}

/**
 * How far the bank moves to sit in `key`, in semitones: the shortest way, 5
 * down to 6 up. Nothing for C major and for any other white-key mode, since
 * the bank is in all of them already.
 */
export function factoryTranspose(key: FactoryKey): number {
  const up = relativeMajorRoot(key)
  return up > 6 ? up - 12 : up
}

// --- Devices that are set to a pitch ----------------------------------------------

/**
 * How a parameter names a pitch: a pitch class (0 to 11); a note, which goes
 * the octave that keeps it in the parameter's range; or a pitch class whose
 * octave is a parameter of its own (`octave` names it), the two together one
 * note: past B or under C the octave goes with it, as far as its range lets it.
 */
type PitchedParam = 'class' | 'note' | { readonly octave: string }

/** The parameters that name a pitch, and so move with the key. */
const PITCHED_PARAMS: Readonly<Record<string, Readonly<Record<string, PitchedParam>>>> = {
  sympathetic: { root: 'class' },
  thesis: { root: 'class', center: 'note' },
  lattice: { root: 'class', center: 'note' },
  // A kit's keys are drums, so its notes never move (./kits.ts): its tuning does.
  'drum-kit': { tune: 'note' },
  'glitch-kit': { tune: 'note' },
  // The note whose harmonics are sung, and the note the carrier stands on: a root and its
  // octave. With the octave left where it was, a root that passes B would drop the whistle
  // or the carrier an octave against the playing, and the bell would be another bell.
  'overtone-singer': { root: { octave: 'octave' } },
  ring: { root: { octave: 'octave' } },
}

function transposeDevice(device: PatchDevice, semitones: number): PatchDevice {
  // By the id of today: a patch may name the device by one it had before.
  const descriptor = describeStockWasmDevice(device.deviceId)
  const pitched = descriptor && PITCHED_PARAMS[descriptor.id]
  if (!pitched || !descriptor) return device
  // What the device is set to as the patch stands: its own value, else its preset's, else the default.
  const current = patchDeviceParams(descriptor, device)
  const params: Record<string, number> = { ...device.params }
  for (const [name, kind] of Object.entries(pitched)) {
    const spec = descriptor.params[name]
    if (!spec) continue
    if (kind === 'class') {
      params[name] = mod12(current[name] + semitones)
      continue
    }
    if (typeof kind === 'object') {
      const octaves = descriptor.params[kind.octave]
      const note = current[name] + semitones
      params[name] = mod12(note)
      if (!octaves) continue
      // Out of the octaves the control has: the nearest one, so the root is still the key's.
      const octave = current[kind.octave] + Math.floor(note / 12)
      params[kind.octave] = Math.min(octaves.max, Math.max(octaves.min, octave))
      continue
    }
    let moved = current[name] + semitones
    while (moved > spec.max) moved -= 12
    while (moved < spec.min) moved += 12
    params[name] = moved
  }
  return { ...device, params }
}

/** A patch with every device that is set to a pitch moved by `semitones`. */
export function transposePatch<T extends Pick<Patch, 'instrument' | 'effects'>>(
  patch: T,
  semitones: number,
): T {
  if (semitones === 0) return patch
  return {
    ...patch,
    ...(patch.instrument ? { instrument: transposeDevice(patch.instrument, semitones) } : {}),
    effects: patch.effects.map((effect) => transposeDevice(effect, semitones)),
  }
}

/** A phrase with every note moved by `semitones`. */
export function transposePhrase(phrase: Phrase, semitones: number): Phrase {
  if (semitones === 0) return phrase
  return { notes: phrase.notes.map((note) => ({ ...note, note: note.note + semitones })) }
}

// --- Chords of a key --------------------------------------------------------------

/** One of the seven chords of a key, as the distances of its notes above its root. */
export interface KeyChord {
  /** 0 for the key's own chord, up to 6. */
  degree: number
  /** The chord's root as a pitch class. */
  root: number
  /** Semitones above the root of the scale notes over it: its second, third and so on. */
  second: number
  third: number
  fourth: number
  fifth: number
  sixth: number
  seventh: number
}

/** The chord a key has on `degree` (taken round the seven). */
export function keyChord(key: FactoryKey, degree: number): KeyChord {
  const steps = FACTORY_MODES[key.mode]
  const at = ((Math.round(degree) % 7) + 7) % 7
  const above = (offset: number): number =>
    steps[(at + offset) % 7] + (at + offset >= 7 ? 12 : 0) - steps[at]
  return {
    degree: at,
    root: mod12(key.root + steps[at]),
    second: above(1),
    third: above(2),
    fourth: above(3),
    fifth: above(4),
    sixth: above(5),
    seventh: above(6),
  }
}

/** What a pad plays of a chord: which of its notes, and so what it is called. */
export type ChordColour =
  'triad' | 'seventh' | 'ninth' | 'add9' | 'sus2' | 'sus4' | 'six' | 'fifths'

export const CHORD_COLOURS: readonly ChordColour[] = [
  'triad',
  'seventh',
  'ninth',
  'add9',
  'sus2',
  'sus4',
  'six',
  'fifths',
]

/**
 * Whether a chord takes a colour without leaving the key or turning sour: a
 * ninth has to be a whole tone above the root, a suspended fourth a perfect
 * one, a sixth only goes over a major third, and the chord with a tritone in
 * it (a dominant seventh) keeps to its triad, since a held tritone asks to
 * move on and a pad does not.
 */
export function chordTakes(chord: KeyChord, colour: ChordColour): boolean {
  const perfect = chord.fifth === 7
  const dominant = chord.third === 4 && chord.seventh === 10
  switch (colour) {
    case 'triad':
      return true
    case 'seventh':
      return !dominant
    case 'ninth':
      return perfect && chord.second === 2 && !dominant
    case 'add9':
    case 'sus2':
      return perfect && chord.second === 2
    case 'sus4':
      return perfect && chord.fourth === 5
    case 'six':
      return perfect && chord.third === 4 && chord.sixth === 9
    case 'fifths':
      return perfect
  }
}

/** The semitones above its root a chord plays in a colour, in the order a voicing stacks them. */
export function chordTones(chord: KeyChord, colour: ChordColour): number[] {
  const { second, third, fourth, fifth, sixth, seventh } = chord
  switch (colour) {
    case 'triad':
      return [0, fifth, third]
    case 'seventh':
      return [0, fifth, seventh, third]
    case 'ninth':
      return [0, fifth, third, seventh, second]
    case 'add9':
      return [0, fifth, second, third]
    case 'sus2':
      return [0, fifth, second]
    case 'sus4':
      return [0, fifth, fourth]
    case 'six':
      return [0, fifth, third, sixth]
    case 'fifths':
      // The root again on top: a voicing puts it an octave up.
      return [0, fifth, 0]
  }
}

/** A chord's name in a colour: "Dm9", "Fmaj7", "Gsus4", "B°". */
export function chordName(chord: KeyChord, colour: ChordColour = 'triad'): string {
  const root = pitchClassName(chord.root)
  const minor = chord.third === 3
  const diminished = chord.fifth === 6
  switch (colour) {
    case 'triad':
      return `${root}${diminished ? '°' : minor ? 'm' : ''}`
    case 'seventh':
      if (diminished) return `${root}m7♭5`
      return `${root}${minor ? 'm7' : chord.seventh === 11 ? 'maj7' : '7'}`
    case 'ninth':
      return `${root}${minor ? 'm9' : chord.seventh === 11 ? 'maj9' : '9'}`
    case 'add9':
      return `${root}${minor ? 'm' : ''}add9`
    case 'sus2':
      return `${root}sus2`
    case 'sus4':
      return `${root}sus4`
    case 'six':
      return `${root}6`
    case 'fifths':
      return `${root}5`
  }
}
