// New sounds to paint with, made from a seed: a drone, a pad, a texture, a
// single struck note or a short phrase, in a key and on one of its chords.
// The seed decides which instrument plays, how it is set and what it plays;
// the key and the chord decide the notes. So the same seed in another key is
// the same sound moved there, and any sound can be made again from its seed.
//
// Every voice here starts from a recipe of the factory bank (./sounds/first.ts) and
// keeps what made that recipe loop: the held notes, slow motion at whole
// cycles per loop, and the two parts that let a steady tone fold (./parts.ts).

import { type SoundKind } from '../../core/analysis/sound-kind'
import { normaliseSeed, seededRandom } from '../../core/clips/chance'
import { type Patch, type PatchDevice } from '../../core/devices/patch'
import { type Phrase, type PhraseNote } from '../patch-render'
import {
  chordName,
  chordTakes,
  chordTones,
  type ChordColour,
  FACTORY_HOME_KEY,
  FACTORY_MODES,
  type FactoryKey,
  type FactoryMode,
  keyChord,
  type KeyChord,
  pitchClassName,
  relativeMajorRoot,
} from './key'
import { PURE_FIFTH, breathe, quarterTurn, soften, wholeCycles, zita } from './parts'

/** The kinds of sound that can be generated, as the library's analysis names them. */
export const GENERATED_KINDS = ['drone', 'pad', 'texture', 'oneshot', 'melodic'] as const

export type GeneratedKind = (typeof GENERATED_KINDS)[number]

export interface GenerateSoundOptions {
  /** Any whole number: the same seed, kind, key and degree always give the same sound. */
  seed: number
  /** What to make; drawn from the seed when absent. */
  kind?: GeneratedKind
  /** The key it is in (default C major). */
  key?: FactoryKey
  /**
   * The chord of the key it sits on: 0 for the key's own chord, up to 6.
   * Drawn from the seed when absent, the key's own chord most often.
   */
  degree?: number
}

/** A generated sound: a recipe `renderGeneratedSound` turns into audio. */
export interface GeneratedSound {
  seed: number
  kind: GeneratedKind
  key: FactoryKey
  /** The chord of the key it sits on, 0 to 6. */
  degree: number
  /** That chord, or its root for a single note, as the sound plays it: "Dm9", "F", "Gsus4". */
  chord: string
  /**
   * False for weather that has no pitch in it (rain, the sea, a fire, a
   * record): the key and the chord change nothing about it.
   */
  pitched: boolean
  name: string
  description: string
  /** The instrument with its settings and the effects after it. */
  patch: Patch
  phrase: Phrase
  /** Length of the rendered sound in seconds. */
  durationSec: number
  skipSec?: number
  /** Seconds of crossfade that make the sound loop without a seam; absent for a sound that ends. */
  loopCrossfadeSec?: number
  /** Fade at the end of a sound that does not loop. */
  fadeOutSec?: number
}

// --- Draws ------------------------------------------------------------------------

type Draw = () => number

const pick = <T>(draw: Draw, items: readonly T[]): T => items[Math.floor(draw() * items.length)]

/** A draw between two values, rounded to `step`. */
function between(draw: Draw, low: number, high: number, step = 0.01): number {
  const value = low + draw() * (high - low)
  return Math.round(value / step) * step
}

/** The items in a drawn order; always takes one draw per item. */
function shuffled<T>(draw: Draw, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(draw() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const mod12 = (value: number): number => ((value % 12) + 12) % 12

/** The note with pitch class `pitch` in the octave that starts at `low`. */
const noteFrom = (low: number, pitch: number): number => low + mod12(pitch - low)

// --- What a voice is given and gives back -----------------------------------------

interface Scene {
  /** Draws for the instrument and how it is set: the same in every key. */
  voice: Draw
  /** Draws for what it plays. */
  notes: Draw
  key: FactoryKey
  chord: KeyChord
}

interface Made {
  name: string
  description: string
  /** The chord as the sound plays it. */
  chord: string
  /** Weather with no pitch in it: the same in every key. */
  unpitched?: boolean
  instrument: PatchDevice
  effects: PatchDevice[]
  notes: PhraseNote[]
  durationSec: number
  skipSec?: number
  loopCrossfadeSec?: number
  fadeOutSec?: number
  /** A sound of steady tones: its notes are tuned to whole cycles per loop. */
  steady?: boolean
}

interface Voice {
  /** Needs a perfect fifth over the chord's root: the next voice is taken when there is none. */
  fifth?: boolean
  make: (scene: Scene) => Made
}

/** A note of a held chord: the MIDI note, or the note with its velocity. */
type HeldNote = number | readonly [note: number, gain: number]

/** Notes held through everything rendered for a loop: the skipped start, the loop and its fold. */
function held(
  durationSec: number,
  skipSec: number,
  loopCrossfadeSec: number,
  notes: readonly HeldNote[],
): Pick<Made, 'notes' | 'durationSec' | 'skipSec' | 'loopCrossfadeSec'> {
  const durSec = skipSec + durationSec + loopCrossfadeSec + 1
  return {
    notes: notes.map((entry) =>
      typeof entry === 'number'
        ? { atSec: 0, durSec, note: entry }
        : { atSec: 0, durSec, note: entry[0], gain: entry[1] },
    ),
    durationSec,
    skipSec,
    loopCrossfadeSec,
  }
}

/** Where a swell of `period` seconds is on its way up: the loop starts there. */
const risingAt = (period: number): number => (period * 15) / 16

/**
 * A chord's notes stacked upward from its root in the octave that starts at
 * `low`, each one the next of its kind above the last, the way the bank's
 * pads are voiced (D minor ninth is D3 A3 F4 C5 E5).
 */
function voicing(chord: KeyChord, colour: ChordColour, low: number): number[] {
  const root = noteFrom(low, chord.root)
  const stack: number[] = []
  for (const tone of chordTones(chord, colour)) {
    let note = root + tone
    while (stack.length > 0 && note <= stack[stack.length - 1]) note += 12
    stack.push(note)
  }
  return stack
}

/** A voicing with its upper notes played more softly, the top one softest. */
function softTop(notes: readonly number[]): HeldNote[] {
  return notes.map((note, index) => {
    if (index < 2) return note
    const fromTop = notes.length - 1 - index
    if (fromTop === 0) return [note, notes.length > 3 ? 0.6 : 0.7]
    if (fromTop === 1 && notes.length > 4) return [note, 0.7]
    return note
  })
}

/** The first colour, in a drawn order of the ones a voice likes, that the chord takes. */
function colourFor(scene: Scene, liked: readonly ChordColour[]): ChordColour {
  const order = shuffled(scene.voice, liked)
  return order.find((colour) => chordTakes(scene.chord, colour)) ?? 'triad'
}

const rootName = (chord: KeyChord): string => pitchClassName(chord.root)
const fifthName = (chord: KeyChord): string => pitchClassName(chord.root + chord.fifth)

// --- Drones -----------------------------------------------------------------------

const DRONES: readonly Voice[] = [
  {
    fifth: true,
    make: ({ voice, chord }) => ({
      name: `Low drone ${rootName(chord)}`,
      description: `A stack of fifths on a low ${rootName(chord)} with a sub octave under it, slowly shifting.`,
      chord: rootName(chord),
      instrument: {
        deviceId: 'drone',
        preset: 'Open fifths',
        params: {
          partials: between(voice, 0.6, 0.85),
          wave: between(voice, 0.35, 0.6),
          movement: between(voice, 0.2, 0.4),
          sub: between(voice, 0.2, 0.5),
          cutoff: between(voice, 1600, 2400, 100),
          attack: 1,
        },
      },
      effects: [zita('Hall', between(voice, 0.25, 0.35))],
      ...held(16, 5, 3, [noteFrom(33, chord.root)]),
    }),
  },
  {
    fifth: true,
    make: ({ voice, key, chord }) => {
      const root = noteFrom(36, chord.root)
      return {
        name: `Tanpura ${rootName(chord)}`,
        description: `The buzzing strings of a tanpura on ${rootName(chord)} and ${fifthName(chord)}, with sympathetic strings behind.`,
        chord: rootName(chord),
        // Four partials only: the fifth would be a major third as loud as the root.
        instrument: {
          deviceId: 'drone',
          preset: 'Tanpura',
          params: {
            partials: 0.5,
            wave: between(voice, 0.7, 0.85),
            movement: between(voice, 0.25, 0.4),
            attack: 0.8,
            width: 0.8,
          },
        },
        effects: [
          // Strings on the notes of the key: the major scale that holds them.
          {
            deviceId: 'sympathetic',
            preset: 'Sitar drone',
            params: { root: relativeMajorRoot(key), mix: between(voice, 0.2, 0.35), width: 0.7 },
          },
          zita('Hall', 0.25),
        ],
        ...held(16, 5, 3, [root, [root + PURE_FIFTH, 0.6]]),
      }
    },
  },
  {
    make: ({ voice, chord }) => {
      const root = noteFrom(43, chord.root)
      const open = chord.fifth === 7
      return {
        name: `Organ drone ${rootName(chord)}`,
        description: `Low pipes with a beating celeste on ${open ? `${rootName(chord)} and ${fifthName(chord)}` : `${rootName(chord)} in octaves`}, heard from the back of a chapel.`,
        chord: rootName(chord),
        instrument: {
          deviceId: 'organ',
          preset: 'Celeste drone',
          params: { attack: 0.6, bellows: 0.2, celeste: between(voice, 0.15, 0.3) },
        },
        effects: [zita('Cathedral', between(voice, 0.3, 0.4)), quarterTurn(16)],
        ...held(16, 4, 3, [root, ...(open ? [[root + 7, 0.7] as const] : []), [root + 12, 0.6]]),
        steady: true,
      }
    },
  },
  {
    fifth: true,
    make: ({ voice, chord }) => {
      const root = noteFrom(38, chord.root)
      return {
        name: `Harmonium drone ${rootName(chord)}`,
        description: `A reedy pump organ holding ${rootName(chord)} and ${fifthName(chord)}, close and a little worn by tape.`,
        chord: rootName(chord),
        instrument: {
          deviceId: 'organ',
          preset: 'Pump organ',
          params: { bellows: between(voice, 0.2, 0.35), attack: 0.4 },
        },
        effects: [
          { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
          zita('Hall', between(voice, 0.3, 0.4)),
        ],
        ...held(8, 4, 2, [root, [root + 7, 0.7], [root + 12, 0.5]]),
      }
    },
  },
  {
    make: ({ voice, chord }) => {
      const root = noteFrom(36, chord.root)
      const open = chord.fifth === 7
      return {
        name: `Cello drone ${rootName(chord)}`,
        description: `Two bowed strings ${open ? 'a fifth' : 'an octave'} apart on ${rootName(chord)}, with the wood of the body and a hall.`,
        chord: rootName(chord),
        instrument: { deviceId: 'bowed-string', preset: 'Cello drone' },
        effects: [
          { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
          zita('Hall', between(voice, 0.35, 0.45)),
          quarterTurn(8),
        ],
        ...held(8, 4, 2, [root, [root + (open ? 7 : 12), 0.7]]),
        steady: true,
      }
    },
  },
  {
    fifth: true,
    make: ({ voice, chord }) => {
      const root = noteFrom(36, chord.root)
      return {
        name: `Choir drone ${rootName(chord)}`,
        description: `Two low voices holding an open fifth on ${rootName(chord)}, a dark Oh in a long stone room.`,
        chord: rootName(chord),
        instrument: {
          deviceId: 'choir',
          preset: 'Low monks',
          params: { attack: 0.8, motion: 0.06, ensemble: 0 },
        },
        effects: [zita('Cathedral', between(voice, 0.4, 0.5))],
        ...held(16, 4, 3, [root, [root + PURE_FIFTH, 0.5]]),
      }
    },
  },
]

// --- Pads -------------------------------------------------------------------------

const FULL: readonly ChordColour[] = ['ninth', 'seventh', 'add9', 'six', 'triad']
const OPEN: readonly ChordColour[] = ['sus2', 'add9', 'sus4', 'triad']

const PADS: readonly Voice[] = [
  {
    make: (scene) => {
      const colour = colourFor(scene, FULL)
      const chord = chordName(scene.chord, colour)
      return {
        name: `Warm pad ${chord}`,
        description: `Two detuned saws holding ${chord}, the filter opening and closing every 8 s.`,
        chord,
        instrument: {
          deviceId: 'ember',
          preset: 'Warm pad',
          params: {
            unisonVoices: 1,
            osc2Fine: between(scene.voice, 3, 7, 1),
            ampAttack: 0.3,
            lfo1Rate: 0.125,
            lfo1Amount: -between(scene.voice, 0.35, 0.5),
          },
        },
        effects: [
          { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
          {
            deviceId: 'fdn-reverb',
            preset: 'Hall',
            params: { mix: between(scene.voice, 0.35, 0.45) },
          },
        ],
        ...held(16, 3.5, 2, softTop(voicing(scene.chord, colour, 43))),
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, FULL)
      const chord = chordName(scene.chord, colour)
      return {
        name: `Soft pad ${chord}`,
        description: `A hollow square and a triangle an octave up on ${chord}, in a wide space.`,
        chord,
        instrument: {
          deviceId: 'ember',
          preset: 'Hollow Pad',
          params: {
            unisonVoices: 1,
            ampAttack: 0.3,
            osc2Fine: between(scene.voice, 2, 5, 1),
            lfo1Rate: 0.0625,
            lfo1Amount: between(scene.voice, 0.3, 0.45),
          },
        },
        effects: [
          { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
          {
            deviceId: 'expanse',
            preset: 'Open space',
            params: { mix: between(scene.voice, 0.35, 0.45) },
          },
        ],
        ...held(16, 4, 2, softTop(voicing(scene.chord, colour, 43))),
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, ['seventh', 'triad', 'add9', 'six'])
      const chord = chordName(scene.chord, colour)
      // Spread wider than the other pads: a string machine is three octaves
      // of saws on every key, and close low notes turn to noise in it.
      const [root, ...upper] = voicing(scene.chord, colour, 43)
      const notes = [root, ...upper.map((note) => note + (note - root < 10 ? 12 : 0))].sort(
        (a, b) => a - b,
      )
      return {
        name: `Strings ${chord}`,
        description: `A string ensemble on ${chord} through tape, swelling once every 16 s.`,
        chord,
        instrument: {
          deviceId: 'string-machine',
          preset: 'Slow strings',
          params: { attack: 1, tone: between(scene.voice, 1200, 1600, 100), ensemble: 0.6 },
        },
        effects: [
          { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
          {
            deviceId: 'expanse',
            preset: 'Open space',
            params: { mix: between(scene.voice, 0.35, 0.45) },
          },
          breathe(0.0625, 0.4),
          quarterTurn(16),
        ],
        // The swell is lowest 13 s after the keys go down: the loop starts on its way up.
        ...held(16, risingAt(16), 2, [
          [notes[0], 0.8],
          ...notes.slice(1, -1),
          [notes[notes.length - 1], 0.8],
        ]),
        steady: true,
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, FULL)
      const chord = chordName(scene.chord, colour)
      return {
        name: `Glass pad ${chord}`,
        description: `Glassy FM tones beating slowly against each other on ${chord}.`,
        chord,
        instrument: { deviceId: 'fm-glass', preset: 'Crystal pad', params: { attack: 0.5 } },
        effects: [zita('Hall', between(scene.voice, 0.35, 0.45)), breathe(0.125, 0.3)],
        ...held(16, risingAt(8), 2, softTop(voicing(scene.chord, colour, 43))),
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, ['six', 'add9', 'seventh', 'triad'])
      const chord = chordName(scene.chord, colour)
      return {
        name: `Drift pad ${chord}`,
        description: `A hollow wavetable travelling through its table on ${chord}, swelling every 8 s.`,
        chord,
        instrument: {
          deviceId: 'wavetable',
          preset: 'Hollow drift',
          params: { attack: 0.5, rate: 0.125 },
        },
        effects: [zita('Hall', between(scene.voice, 0.35, 0.45)), breathe(0.125, 0.4)],
        ...held(16, risingAt(8), 2, softTop(voicing(scene.chord, colour, 43))),
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, ['triad', 'add9', 'sus2'])
      const chord = chordName(scene.chord, colour)
      const notes = voicing(scene.chord, colour, 45)
      // The root again an octave up, under the rest, as a choir doubles it.
      const doubled = [notes[0], notes[0] + 12, ...notes.slice(1).map((note) => note + 12)]
      return {
        name: `Choir chord ${chord}`,
        description: `Voices on an open Ah holding ${chord}, drifting against each other in a nave.`,
        chord,
        instrument: {
          deviceId: 'choir',
          preset: 'Airport ah',
          params: { ensemble: 0, vibrato: 0, attack: 0.5 },
        },
        effects: [
          { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
          zita('Cathedral', between(scene.voice, 0.4, 0.5)),
          breathe(0.125, 0.3),
        ],
        ...held(16, risingAt(8), 3, softTop(doubled)),
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, OPEN)
      const chord = chordName(scene.chord, colour)
      return {
        name: `Shimmer pad ${chord}`,
        description: `High strings on ${chord} with a reverb that climbs an octave on every pass.`,
        chord,
        instrument: {
          deviceId: 'string-machine',
          preset: 'Glass',
          params: { volume: -12, attack: 0.5, ensemble: 0.5 },
        },
        effects: [
          {
            deviceId: 'shimmer',
            preset: 'Rising choir',
            params: { mix: between(scene.voice, 0.4, 0.5) },
          },
          breathe(0.125, 0.4),
        ],
        ...held(16, risingAt(8), 2, softTop(voicing(scene.chord, colour, 55))),
      }
    },
  },
]

// --- Textures ---------------------------------------------------------------------

const weather = (preset: string, params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'atmosphere',
  preset,
  params: { attack: 0.5, width: 0.6, ...params },
})

/** The scale a Thesis is set to for each mode of a key. */
const THESIS_SCALE: Readonly<Record<FactoryMode, number>> = {
  major: 0,
  minor: 1,
  dorian: 4,
  phrygian: 5,
  lydian: 6,
  mixolydian: 7,
}

const TEXTURES: readonly Voice[] = [
  {
    make: ({ voice, chord }) => ({
      name: 'Hill wind',
      description: `Wind over open ground, gusting and falling away, with a faint pitch on ${rootName(chord)}.`,
      chord: rootName(chord),
      instrument: weather('Hill wind', {
        density: between(voice, 0.3, 0.5),
        movement: between(voice, 0.5, 0.7),
        tone: between(voice, 0.4, 0.6),
      }),
      effects: [zita('Room', 0.2)],
      ...held(16, 8, 3, [noteFrom(57, chord.root)]),
    }),
  },
  {
    make: ({ voice, chord }) => ({
      name: 'Rain on the window',
      unpitched: true,
      description: 'Steady rain against glass from inside the room, each drop a small tap.',
      chord: rootName(chord),
      instrument: weather('Rain on the window', {
        density: between(voice, 0.45, 0.65),
        size: between(voice, 0.2, 0.4),
      }),
      effects: [soften(24)],
      ...held(16, 3, 3, [60]),
    }),
  },
  {
    make: ({ voice, chord }) => ({
      name: 'Distant downpour',
      unpitched: true,
      description: 'Heavy rain a street away: a wide wash with no single drop in it.',
      chord: rootName(chord),
      instrument: weather('Distant downpour', {
        density: between(voice, 0.8, 0.95),
        tone: between(voice, 0.3, 0.5),
      }),
      effects: [soften(18)],
      ...held(16, 6, 3, [60]),
    }),
  },
  {
    make: ({ voice, chord }) => ({
      name: 'Waves on sand',
      unpitched: true,
      description: 'Two long waves that build, break and run back down the sand.',
      chord: rootName(chord),
      // The waves come at a rate the movement sets: two of them to this loop.
      instrument: weather('Slow shore', { movement: 0.7, tone: between(voice, 0.4, 0.6) }),
      effects: [],
      ...held(16, 3, 3, [60]),
    }),
  },
  {
    make: ({ voice, chord }) => ({
      name: 'Hearth',
      unpitched: true,
      description: 'A fire in the grate: a low flickering roar with crackles on either side.',
      chord: rootName(chord),
      instrument: weather('Hearth', { width: 0.7, density: between(voice, 0.35, 0.55) }),
      effects: [soften(20)],
      ...held(16, 3, 3, [57]),
    }),
  },
  {
    make: ({ voice, chord }) => ({
      name: 'Record crackle',
      unpitched: true,
      description: 'The run-in groove of an old record: hiss, clicks and a turning rumble.',
      chord: rootName(chord),
      instrument: weather('Old record', { width: 0.7, density: between(voice, 0.3, 0.5) }),
      effects: [soften(24)],
      ...held(8, 2, 2, [60]),
    }),
  },
  {
    make: ({ voice, key, chord }): Made => {
      const root = noteFrom(52, chord.root)
      return {
        name: `Grain cloud ${rootName(chord)}`,
        description: `Bands of noise tuned to ${rootName(chord)} and ${fifthName(chord)}, broken into short grains and scattered through a hall.`,
        chord: rootName(chord),
        instrument: {
          deviceId: 'thesis',
          params: {
            resonance: between(voice, 10, 16, 1),
            attack: 0.3,
            scale: THESIS_SCALE[key.mode],
            root: key.root,
          },
        },
        effects: [
          {
            deviceId: 'grain-cloud',
            preset: 'Soft cloud',
            params: {
              size: between(voice, 110, 180, 10),
              density: between(voice, 18, 28, 1),
              spray: 0.5,
              scatter: 0.5,
              texture: 0.3,
              spread: 1,
              mix: 0.85,
            },
          },
          { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
        ],
        ...held(16, 6, 3, [root, root + chord.fifth]),
      }
    },
  },
]

// --- One-shots --------------------------------------------------------------------

const bells = (preset: string, params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'modal-bells',
  preset,
  params,
})

/** The felt piano of the single note and the phrase, in its own hall. */
const FELT_PIANO: PatchDevice = { deviceId: 'felt-piano', preset: 'Hall', params: { felt: 0.7 } }

/** One note struck at the start and left to ring for `durationSec`. */
function struck(
  durationSec: number,
  note: number,
  fadeOutSec: number,
): Pick<Made, 'notes' | 'durationSec' | 'fadeOutSec'> {
  return { notes: [{ atSec: 0, durSec: durationSec - 0.2, note }], durationSec, fadeOutSec }
}

/** A one-shot voice: an instrument, its room and the octave its note is taken from. */
function oneShot(
  label: string,
  describe: (note: string) => string,
  low: number,
  durationSec: number,
  fadeOutSec: number,
  devices: (voice: Draw) => { instrument: PatchDevice; effects: PatchDevice[] },
): Voice {
  return {
    make: ({ voice, chord }) => ({
      name: `${label} ${rootName(chord)}`,
      description: describe(rootName(chord)),
      chord: rootName(chord),
      ...devices(voice),
      ...struck(durationSec, noteFrom(low, chord.root), fadeOutSec),
    }),
  }
}

const ONE_SHOTS: readonly Voice[] = [
  oneShot(
    'Glass bell',
    (note) => `One FM bell on ${note} with a glassy strike and a hall behind it.`,
    64,
    6,
    0.3,
    (voice) => ({
      instrument: {
        deviceId: 'fm-glass',
        preset: 'Glass bell',
        params: { decay: between(voice, 2.6, 3.4, 0.1), release: 3 },
      },
      effects: [zita('Hall', between(voice, 0.3, 0.4))],
    }),
  ),
  oneShot(
    'Singing bowl',
    (note) => `A struck metal bowl on ${note} whose paired modes beat slowly as it rings down.`,
    57,
    8,
    0.4,
    (voice) => ({
      instrument: bells('Singing bowl', { decay: between(voice, 7, 10, 0.5) }),
      effects: [zita('Hall', 0.25)],
    }),
  ),
  oneShot(
    'Kalimba',
    (note) => `One plucked tine on a high ${note}, woody and short, in a small room.`,
    69,
    3,
    0.2,
    (voice) => ({
      instrument: bells('Kalimba', { decay: between(voice, 3, 4, 0.1), spread: 0.6 }),
      effects: [zita('Room', 0.3)],
    }),
  ),
  oneShot(
    'Vibraphone',
    (note) => `A soft mallet on the ${note} bar with the motor turning and the pedal held down.`,
    60,
    6,
    0.3,
    (voice) => ({
      instrument: bells('Vibraphone', { spread: 0.6 }),
      effects: [
        {
          deviceId: 'tremolo',
          preset: 'Amp tremolo',
          params: { depth: between(voice, 0.2, 0.35) },
        },
        zita('Hall', 0.3),
      ],
    }),
  ),
  oneShot(
    'Gong',
    (note) =>
      `A large gong struck off centre: a dark low ${note} that beats slowly from side to side.`,
    33,
    8,
    0.5,
    (voice) => ({
      instrument: bells('Gong', {
        decay: 9,
        hardness: between(voice, 0.55, 0.7),
        brightness: 1,
        position: 0.6,
      }),
      effects: [zita('Hall', 0.3)],
    }),
  ),
  oneShot(
    'Music box',
    (note) => `One bright comb tooth of a music box on a high ${note}, in a small room.`,
    76,
    3,
    0.2,
    () => ({ instrument: bells('Music box', { spread: 0.8 }), effects: [zita('Room', 0.3)] }),
  ),
  oneShot(
    'Felt piano',
    (note) => `One low ${note} on a felted piano, the key held until the note has rung out.`,
    43,
    8,
    0.4,
    () => ({ instrument: FELT_PIANO, effects: [] }),
  ),
  oneShot(
    'Temple bowl',
    (note) => `A deep FM bowl on ${note}, struck softly and left to ring in a hall.`,
    50,
    8,
    0.5,
    (voice) => ({
      instrument: {
        deviceId: 'fm-glass',
        preset: 'Temple bowl',
        params: { decay: between(voice, 5, 7, 0.5) },
      },
      effects: [zita('Hall', 0.3)],
    }),
  ),
  oneShot(
    'Electric piano',
    (note) => `One ${note} on a tine piano, soft and round, through its suitcase amplifier.`,
    52,
    5,
    0.3,
    () => ({
      instrument: { deviceId: 'tine-piano', preset: 'Soft suitcase' },
      effects: [{ deviceId: 'chorus', preset: 'Subtle widener' }, zita('Hall', 0.3)],
    }),
  ),
]

// --- Phrases ----------------------------------------------------------------------

/**
 * The notes a phrase moves through, upward from the chord's root in the
 * octave that starts at `low`: the chord's own and the steps of the key that
 * sit well over it, five to the octave (major pentatonic over a major chord,
 * minor pentatonic over a minor one). Counted from the root, so the same
 * phrase is the same shape in every key.
 */
function phraseNotes(chord: KeyChord, low: number, span: number): number[] {
  const steps = new Set([0, chord.third, chord.fifth])
  if (chord.third === 4) {
    if (chord.second === 2) steps.add(2)
    if (chord.sixth === 9) steps.add(9)
  } else {
    if (chord.fourth === 5) steps.add(5)
    if (chord.seventh === 10) steps.add(10)
  }
  const root = noteFrom(low, chord.root)
  const notes: number[] = []
  for (let above = 0; above <= span; above += 1) {
    if (steps.has(above % 12)) notes.push(root + above)
  }
  return notes
}

interface Line {
  /** How many notes, least and most. */
  count: readonly [number, number]
  /** The octave its lowest note is taken from, and how far above that it reaches. */
  low: number
  span: number
  /** Seconds to the second note, and how much longer each gap is than the last. */
  gapSec: number
  slowing: number
  /** How long each key is held, and how hard it is struck at most (default 0.75). */
  holdSec: number
  loudest?: number
  /** When the first note sounds, and the latest the last one may. */
  fromSec: number
  untilSec: number
}

/**
 * A line in free time: it starts on a note of the chord, moves by a step or
 * two at a time, takes one long breath on the way and comes to rest on the
 * chord. Every gap is drawn, and each is longer than the one before, so no
 * pulse is heard in it.
 */
function line(draw: Draw, chord: KeyChord, shape: Line): PhraseNote[] {
  const notes = phraseNotes(chord, shape.low, shape.span)
  const rests = notes
    .map((note, index) => ({ note, index }))
    .filter(({ note }) => [0, chord.fifth].includes(mod12(note - chord.root)))
  const loudest = shape.loudest ?? 0.75
  const count = shape.count[0] + Math.floor(draw() * (shape.count[1] - shape.count[0] + 1))
  const breath = 1 + Math.floor(draw() * (count - 2))
  let at = pick(draw, rests).index
  let atSec = shape.fromSec
  let gap = shape.gapSec
  const played: PhraseNote[] = []
  for (let i = 0; i < count; i += 1) {
    const last = i === count - 1
    if (last) {
      // The nearest note to rest on.
      at = rests.reduce((best, rest) =>
        Math.abs(rest.index - at) < Math.abs(best.index - at) ? rest : best,
      ).index
    }
    played.push({
      atSec,
      durSec: last ? shape.holdSec * 1.3 : shape.holdSec,
      note: notes[at],
      gain: between(draw, loudest - 0.25, loudest),
    })
    const step = pick(draw, [-2, -1, -1, 1, 1, 2])
    const next = at + step
    at = next < 0 || next >= notes.length ? at - step : next
    atSec += gap * between(draw, 0.8, 1.3) * (i + 1 === breath ? 1.9 : 1)
    gap *= shape.slowing
  }
  // A line that would run past its time is played that much faster.
  const first = played[0].atSec
  const lastAt = played[played.length - 1].atSec
  const squeeze = lastAt > shape.untilSec ? (shape.untilSec - first) / (lastAt - first) : 1
  return played.map((note) => ({
    ...note,
    atSec: Math.round((first + (note.atSec - first) * squeeze) * 100) / 100,
  }))
}

const PHRASES: readonly Voice[] = [
  {
    fifth: true,
    make: ({ notes, chord }) => {
      const bass = noteFrom(43, chord.root)
      return {
        name: `Felt piano phrase ${chordName(chord)}`,
        description: `A few slow notes over a low ${rootName(chord)} and ${fifthName(chord)} on a felted piano, in free time.`,
        chord: chordName(chord),
        instrument: FELT_PIANO,
        effects: [],
        notes: [
          { atSec: 0, durSec: 7.5, note: bass, gain: 0.6 },
          { atSec: 0.05, durSec: 7.5, note: bass + 7, gain: 0.45 },
          ...line(notes, chord, {
            count: [4, 6],
            low: 55,
            span: 19,
            gapSec: 1.2,
            slowing: 1.15,
            holdSec: 5,
            // Above the two bass notes it has to be heard as more than their echo.
            loudest: 0.9,
            fromSec: 1.6,
            untilSec: 10.5,
          }),
        ],
        durationSec: 16,
        fadeOutSec: 0.5,
      }
    },
  },
  {
    make: (scene) => {
      const colour = colourFor(scene, ['ninth', 'seventh', 'add9', 'triad'])
      const chord = chordName(scene.chord, colour)
      const roll = [0, 0.06, 0.14, 0.24, 0.32]
      return {
        name: `Electric piano ${chord}`,
        description: `A rolled ${chord} and a short answer above it on a tine piano.`,
        chord,
        instrument: { deviceId: 'tine-piano', preset: 'Soft suitcase' },
        effects: [{ deviceId: 'chorus', preset: 'Subtle widener' }, zita('Hall', 0.3)],
        notes: [
          ...voicing(scene.chord, colour, 43).map((note, index) => ({
            atSec: roll[index],
            durSec: 3.3,
            note,
            gain: index === 0 ? 0.7 : 0.6,
          })),
          ...line(scene.notes, scene.chord, {
            count: [3, 5],
            low: 60,
            span: 17,
            gapSec: 0.8,
            slowing: 1.2,
            holdSec: 1.6,
            fromSec: 1.5,
            untilSec: 5.2,
          }),
        ],
        durationSec: 8,
        fadeOutSec: 0.3,
      }
    },
  },
  {
    make: ({ notes, chord }) => ({
      name: `Bell phrase ${chordName(chord)}`,
      description: `A few strokes of glass bells wandering through ${chordName(chord)}, with an octave halo.`,
      chord: chordName(chord),
      instrument: { deviceId: 'fm-glass', preset: 'Glass bell' },
      effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3, decay: 2.5 } }],
      notes: line(notes, chord, {
        count: [4, 6],
        low: 65,
        span: 17,
        gapSec: 0.85,
        slowing: 1.12,
        holdSec: 2,
        fromSec: 0,
        untilSec: 4,
      }),
      durationSec: 8,
      fadeOutSec: 0.5,
    }),
  },
  {
    make: ({ voice, notes, chord }) => ({
      name: `Kalimba phrase ${chordName(chord)}`,
      description: `A kalimba figure on the five notes around ${chordName(chord)}, slowing as it goes.`,
      chord: chordName(chord),
      instrument: bells('Kalimba', { spread: 0.6, decay: between(voice, 2.5, 3.5, 0.1) }),
      effects: [zita('Room', 0.3)],
      notes: line(notes, chord, {
        count: [6, 9],
        low: 64,
        span: 17,
        gapSec: 0.36,
        slowing: 1.16,
        holdSec: 1,
        fromSec: 0,
        untilSec: 6,
      }),
      durationSec: 8,
      fadeOutSec: 0.3,
    }),
  },
  {
    make: ({ notes, chord }) => ({
      name: `Music box phrase ${chordName(chord)}`,
      description: `A music box picking out a few high notes of ${chordName(chord)} as its spring runs down.`,
      chord: chordName(chord),
      instrument: bells('Music box', { spread: 0.8 }),
      effects: [zita('Room', 0.3)],
      notes: line(notes, chord, {
        count: [6, 8],
        low: 72,
        span: 15,
        gapSec: 0.4,
        slowing: 1.18,
        holdSec: 1.5,
        fromSec: 0,
        untilSec: 5.5,
      }),
      durationSec: 8,
      fadeOutSec: 0.3,
    }),
  },
  {
    make: ({ notes, chord }) => ({
      name: `Vibraphone phrase ${chordName(chord)}`,
      description: `Soft mallets on a few bars of ${chordName(chord)} with the pedal down, in free time.`,
      chord: chordName(chord),
      instrument: bells('Vibraphone', { spread: 0.6 }),
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.3 } },
        zita('Hall', 0.3),
      ],
      notes: line(notes, chord, {
        count: [4, 6],
        low: 57,
        span: 19,
        gapSec: 0.9,
        slowing: 1.14,
        holdSec: 3,
        fromSec: 0,
        untilSec: 4.5,
      }),
      durationSec: 8,
      fadeOutSec: 0.5,
    }),
  },
]

// --- The generator ----------------------------------------------------------------

const VOICES: Readonly<Record<GeneratedKind, readonly Voice[]>> = {
  drone: DRONES,
  pad: PADS,
  texture: TEXTURES,
  oneshot: ONE_SHOTS,
  melodic: PHRASES,
}

/**
 * How often each chord of a key is drawn: its own most, then the ones a
 * fourth and a fifth away, the others now and then.
 */
const DEGREE_WEIGHTS = [6, 2, 1, 3, 3, 2, 1]

function drawDegree(draw: Draw, key: FactoryKey): number {
  // The chord with a diminished fifth is never drawn: it is there to be asked for.
  const weights = DEGREE_WEIGHTS.map((weight, degree) =>
    keyChord(key, degree).fifth === 7 ? weight : 0,
  )
  let left = draw() * weights.reduce((sum, weight) => sum + weight, 0)
  for (let degree = 0; degree < 7; degree += 1) {
    left -= weights[degree]
    if (left < 0) return degree
  }
  return 0
}

function cleanKey(key: FactoryKey | undefined): FactoryKey {
  if (!key) return FACTORY_HOME_KEY
  const root = Number.isFinite(key.root) ? mod12(Math.round(key.root)) : 0
  return { root, mode: key.mode in FACTORY_MODES ? key.mode : 'major' }
}

/**
 * A new sound from a seed: which instrument, how it is set and what it plays
 * all follow from the seed, in the key and on the chord asked for. Nothing is
 * rendered; `renderGeneratedSound` does that.
 */
export function generateSound(options: GenerateSoundOptions): GeneratedSound {
  const seed = normaliseSeed(options.seed)
  const kind = options.kind ?? pick(seededRandom(seed, 'kind'), GENERATED_KINDS)
  const key = cleanKey(options.key)
  const degree =
    options.degree !== undefined && Number.isFinite(options.degree)
      ? ((Math.round(options.degree) % 7) + 7) % 7
      : drawDegree(seededRandom(seed, kind, 'degree'), key)
  const chord = keyChord(key, degree)

  // The seed's voice, or the next one after it that this chord can carry.
  const voices = VOICES[kind]
  const voice = seededRandom(seed, kind, 'voice')
  const first = Math.floor(voice() * voices.length)
  let chosen = voices[first]
  for (let i = 0; i < voices.length; i += 1) {
    const candidate = voices[(first + i) % voices.length]
    if (!candidate.fifth || chord.fifth === 7) {
      chosen = candidate
      break
    }
  }

  const made = chosen.make({ voice, notes: seededRandom(seed, kind, 'notes'), key, chord })
  const notes = made.steady
    ? made.notes.map((note) => ({ ...note, note: wholeCycles(note.note, made.durationSec) }))
    : made.notes
  return {
    seed,
    kind,
    key,
    degree,
    chord: made.chord,
    pitched: !made.unpitched,
    name: made.name,
    description: made.description,
    patch: {
      id: `generated-${kind}-${seed}`,
      name: made.name,
      category: kind satisfies SoundKind,
      description: made.description,
      instrument: made.instrument,
      effects: made.effects,
    },
    phrase: { notes },
    durationSec: made.durationSec,
    ...(made.skipSec !== undefined ? { skipSec: made.skipSec } : {}),
    ...(made.loopCrossfadeSec !== undefined ? { loopCrossfadeSec: made.loopCrossfadeSec } : {}),
    ...(made.fadeOutSec !== undefined ? { fadeOutSec: made.fadeOutSec } : {}),
  }
}
