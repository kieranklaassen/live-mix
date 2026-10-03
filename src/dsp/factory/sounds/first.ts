// The factory sounds: what someone paints with before they have loaded a
// sample of their own. Each is a recipe (a patch, a phrase and a length) that
// `renderFactorySound` turns into audio on demand.
//
// Everything tonal stays on the white keys (C major, A minor, D dorian), so
// any sound sits with any other, and one transposition moves the whole bank
// into another key (./key.ts). A name or description gives each note it
// mentions in braces, so the words move with the notes. Sustained sounds loop without a seam: the
// notes are held through the whole render, the attack and the build-up of the
// reverb are skipped, and the end is folded over the start. Their slow
// movement runs at a whole number of cycles per loop where the device allows
// it. Sounds that end are left to ring out inside their length. Phrases are
// played in free time: notes on a grid would make them beats, not melodies.

import { breathe, quarterTurn, soften, hall } from '../parts'
import { type FactorySound } from '../types'
import { FELT_PIANO, bells, looped, played, sound, weather } from './recipe'

export const FIRST_SOUNDS: readonly FactorySound[] = [
  // --- Drones -------------------------------------------------------------------
  sound({
    id: 'low-drone-d',
    number: 101,
    name: 'Low drone {D}',
    kind: 'drone',
    description: 'A stack of fifths on a low {D} with a sub octave under it, slowly shifting.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { partials: 0.75, wave: 0.5, movement: 0.3, sub: 0.4, cutoff: 2000, attack: 1 },
    },
    effects: [hall('Hall', 0.3)],
    ...looped(16, 5, 3, [38]),
  }),
  sound({
    id: 'low-drone-a',
    number: 102,
    name: 'Low drone {A}',
    kind: 'drone',
    description: 'Octaves stacked on a low {A}, darker than the {D} and moving more slowly.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { partials: 0.8, wave: 0.6, movement: 0.12, sub: 0, cutoff: 1600, attack: 1 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathDepth: 0 } }],
    ...looped(16, 5, 3, [33]),
  }),
  sound({
    id: 'tanpura-d',
    number: 103,
    name: 'Tanpura {D}',
    kind: 'drone',
    description:
      'The buzzing strings of a tanpura on {D} and {A}, with sympathetic strings behind.',
    // Four partials only: the fifth would be an F sharp as loud as the root.
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { partials: 0.5, wave: 0.8, movement: 0.35, attack: 0.8, width: 0.8 },
    },
    effects: [
      // Strings on the C major scale: the white keys.
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { root: 0, mix: 0.3, width: 0.7 } },
      hall('Hall', 0.25),
    ],
    ...looped(16, 5, 3, [38, [45, 0.6]]),
  }),
  sound({
    id: 'organ-drone-c',
    number: 104,
    name: 'Organ drone {C}',
    kind: 'drone',
    description:
      'Low pipes with a beating celeste on {C} and {G}, heard from the back of a chapel.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.6, bellows: 0.2, celeste: 0.25 },
    },
    effects: [hall('Cathedral', 0.35), quarterTurn(16)],
    ...looped(16, 4, 3, [48, [55, 0.7], [60, 0.6]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'harmonium-drone-g',
    number: 105,
    name: 'Harmonium drone {G}',
    kind: 'drone',
    description: 'A reedy pump organ holding {G} and {D}, close and a little worn by tape.',
    instrument: { deviceId: 'organ', preset: 'Pump organ', params: { bellows: 0.3, attack: 0.4 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      hall('Hall', 0.35),
    ],
    ...looped(8, 4, 2, [43, [50, 0.7], [55, 0.5]]),
  }),
  sound({
    id: 'cello-drone-d',
    number: 106,
    name: 'Cello drone {D}',
    kind: 'drone',
    description: 'Two bowed strings a fifth apart on {D}, with the wood of the body and a hall.',
    instrument: { deviceId: 'bowed-string', preset: 'Cello drone' },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.3 } },
      hall('Hall', 0.4),
      quarterTurn(8),
    ],
    ...looped(8, 4, 2, [38, [45, 0.7]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'choir-drone-a',
    number: 107,
    name: 'Choir drone {A}',
    kind: 'drone',
    description: 'Two low voices holding an open fifth on {A}, a dark Oh in a long stone room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.8, motion: 0.1, ensemble: 0 },
    },
    effects: [hall('Cathedral', 0.5)],
    ...looped(16, 4, 3, [45, [52, 0.5]]),
  }),

  // --- Pads ---------------------------------------------------------------------
  sound({
    id: 'warm-pad-dm9',
    number: 108,
    name: 'Warm pad {D}m9',
    kind: 'pad',
    description:
      'Two detuned saws holding {D} minor ninth, the filter opening and closing every 8 s.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { unisonVoices: 1, osc2Fine: 5, ampAttack: 0.3, lfo1Rate: 0.125, lfo1Amount: -0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    ...looped(16, 3.5, 2, [50, 57, [65, 0.7], [72, 0.6], [76, 0.5]]),
  }),
  sound({
    id: 'soft-pad-fmaj7',
    number: 109,
    name: 'Soft pad {F}maj7',
    kind: 'pad',
    description:
      'A hollow square and a triangle an octave up on {F} major seventh, in a wide space.',
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { unisonVoices: 1, ampAttack: 0.3, osc2Fine: 3, lfo1Rate: 0.0625, lfo1Amount: 0.4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    ...looped(16, 4, 2, [53, 60, 64, [69, 0.7]]),
  }),
  sound({
    id: 'strings-am7',
    number: 110,
    name: 'Strings {A}m7',
    kind: 'pad',
    description: 'A string ensemble on {A} minor seventh through tape, swelling once every 16 s.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1, tone: 1400, ensemble: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
      breathe(0.0625, 0.4),
      quarterTurn(16),
    ],
    // The swell is lowest 13 s after the keys go down: the loop starts on its way up.
    ...looped(16, 15, 2, [[45, 0.8], 55, 60, [64, 0.8]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'glass-pad-cmaj9',
    number: 111,
    name: 'Glass pad {C}maj9',
    kind: 'pad',
    description: 'Glassy FM tones beating slowly against each other on {C} major ninth.',
    instrument: { deviceId: 'fm-glass', preset: 'Crystal pad', params: { attack: 0.5 } },
    effects: [hall('Hall', 0.4), breathe(0.125, 0.3)],
    ...looped(16, 7.5, 2, [48, 55, 64, 71, [74, 0.6]]),
  }),
  sound({
    id: 'drift-pad-g6',
    number: 112,
    name: 'Drift pad {G}6',
    kind: 'pad',
    description:
      'A hollow wavetable travelling through its table on {G} sixth, swelling every 8 s.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.5, rate: 0.125 },
    },
    effects: [hall('Hall', 0.4), breathe(0.125, 0.4)],
    ...looped(16, 7.5, 2, [43, 50, 59, [64, 0.7]]),
  }),
  sound({
    id: 'choir-chord-am',
    number: 113,
    name: 'Choir chord {A}m',
    kind: 'pad',
    description: 'Voices on an open Ah holding {A} minor, drifting against each other in a nave.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { ensemble: 0, vibrato: 0, attack: 0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      hall('Cathedral', 0.45),
      breathe(0.125, 0.3),
    ],
    ...looped(16, 7.5, 3, [45, 57, 60, 64, [69, 0.6]]),
  }),
  sound({
    id: 'shimmer-pad-csus2',
    number: 114,
    name: 'Shimmer pad {C}sus2',
    kind: 'pad',
    description:
      'High strings on {C}, {G} and {D} with a reverb that climbs an octave on every pass.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { volume: -12, attack: 0.5, ensemble: 0.5 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.45 } },
      breathe(0.125, 0.4),
    ],
    ...looped(16, 7.5, 2, [60, 67, [74, 0.7]]),
  }),

  // --- Textures -----------------------------------------------------------------
  sound({
    id: 'hill-wind',
    number: 115,
    name: 'Hill wind',
    kind: 'texture',
    description: 'Wind over open ground, gusting and falling away, with a faint pitch on {D}.',
    instrument: weather('Hill wind'),
    effects: [hall('Room', 0.2)],
    ...looped(16, 8, 3, [62]),
  }),
  sound({
    id: 'rain-on-the-window',
    number: 116,
    name: 'Rain on the window',
    kind: 'texture',
    description: 'Steady rain against glass from inside the room, each drop a small tap.',
    instrument: weather('Rain on the window', { density: 0.55, size: 0.3 }),
    effects: [soften(24)],
    ...looped(16, 3, 3, [60]),
  }),
  sound({
    id: 'waves-on-sand',
    number: 117,
    name: 'Waves on sand',
    kind: 'texture',
    description: 'Two long waves that build, break and run back down the sand.',
    instrument: weather('Slow shore', { movement: 0.7 }),
    effects: [],
    ...looped(16, 3, 3, [60]),
  }),
  sound({
    id: 'record-crackle',
    number: 118,
    name: 'Record crackle',
    kind: 'texture',
    description: 'The run-in groove of an old record: hiss, clicks and a turning rumble.',
    instrument: weather('Old record', { width: 0.7 }),
    effects: [soften(24)],
    ...looped(8, 2, 2, [60]),
  }),
  sound({
    id: 'hearth',
    number: 119,
    name: 'Hearth',
    kind: 'texture',
    description: 'A fire in the grate: a low flickering roar with crackles on either side.',
    instrument: weather('Hearth', { width: 0.7 }),
    effects: [soften(20)],
    ...looped(16, 3, 3, [57]),
  }),
  sound({
    id: 'grain-cloud',
    number: 120,
    name: 'Grain cloud',
    kind: 'texture',
    description: 'Bands of tuned noise broken into short grains and scattered through a hall.',
    instrument: { deviceId: 'thesis', params: { resonance: 12, attack: 0.3 } },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: {
          size: 140,
          density: 24,
          spray: 0.5,
          scatter: 0.5,
          texture: 0.3,
          spread: 1,
          mix: 0.85,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    ...looped(16, 6, 3, [57, 64]),
  }),

  // --- One-shots ----------------------------------------------------------------
  sound({
    id: 'glass-bell-a',
    number: 121,
    name: 'Glass bell {A}',
    kind: 'oneshot',
    description: 'One FM bell on {A} with a glassy strike and a hall behind it.',
    instrument: { deviceId: 'fm-glass', preset: 'Glass bell', params: { decay: 3.2, release: 3 } },
    effects: [hall('Hall', 0.35)],
    ...played(6, [[0, 5, 69]], 0.3),
  }),
  sound({
    id: 'singing-bowl-d',
    number: 122,
    name: 'Singing bowl {D}',
    kind: 'oneshot',
    description: 'A struck metal bowl on {D} whose paired modes beat slowly as it rings down.',
    instrument: bells('Singing bowl', { decay: 9 }),
    effects: [hall('Hall', 0.25)],
    ...played(8, [[0, 7.8, 62]], 0.4),
  }),
  sound({
    id: 'kalimba-e',
    number: 123,
    name: 'Kalimba {E}',
    kind: 'oneshot',
    description: 'One plucked tine on a high {E}, woody and short, in a small room.',
    instrument: bells('Kalimba', { decay: 3.5, spread: 0.6 }),
    effects: [hall('Room', 0.3)],
    ...played(3, [[0, 2.8, 76]], 0.2),
  }),
  sound({
    id: 'vibraphone-g',
    number: 124,
    name: 'Vibraphone {G}',
    kind: 'oneshot',
    description: 'A soft mallet on the {G} bar with the motor turning and the pedal held down.',
    instrument: bells('Vibraphone', { spread: 0.6 }),
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.3 } },
      hall('Hall', 0.3),
    ],
    ...played(6, [[0, 5.8, 67]], 0.3),
  }),
  sound({
    id: 'gong-d',
    number: 125,
    name: 'Gong {D}',
    kind: 'oneshot',
    description:
      'A large gong struck off centre: a dark low {D} that beats slowly from side to side.',
    instrument: bells('Gong', { decay: 9, hardness: 0.65, brightness: 1, position: 0.6 }),
    effects: [hall('Hall', 0.3)],
    ...played(8, [[0, 7.8, 38]], 0.5),
  }),
  sound({
    id: 'music-box-a',
    number: 126,
    name: 'Music box {A}',
    kind: 'oneshot',
    description: 'One bright comb tooth of a music box on a high {A}, in a small room.',
    instrument: bells('Music box', { spread: 0.8 }),
    effects: [hall('Room', 0.3)],
    ...played(3, [[0, 2.8, 81]], 0.2),
  }),
  sound({
    id: 'felt-piano-c',
    number: 127,
    name: 'Felt piano {C}',
    kind: 'oneshot',
    description: 'One low {C} on a felted piano, the key held until the note has rung out.',
    instrument: FELT_PIANO,
    effects: [],
    ...played(8, [[0, 7.8, 48]], 0.4),
  }),

  // --- Phrases ------------------------------------------------------------------
  sound({
    id: 'felt-piano-phrase-am',
    number: 128,
    name: 'Felt piano phrase {A}m',
    kind: 'melodic',
    description:
      'A few slow notes over a low {A} and then over {F} on a felted piano, in free time.',
    instrument: FELT_PIANO,
    effects: [],
    ...played(
      16,
      [
        [0, 7.5, 45, 0.7],
        [0.05, 7.5, 52, 0.55],
        [1.61, 5.5, 60, 0.6],
        [2.83, 5, 64, 0.65],
        [3.57, 5, 71, 0.7],
        [6.11, 4.5, 69, 0.55],
        [8.4, 6.5, 53, 0.65],
        [9.62, 5.5, 64, 0.5],
        [10.47, 4.6, 67, 0.6],
      ],
      0.5,
    ),
  }),
  sound({
    id: 'electric-piano-dm9',
    number: 129,
    name: 'Electric piano {D}m9',
    kind: 'melodic',
    description: 'Two rolled chords and a short answer on a tine piano, {D} minor ninth to {G}.',
    instrument: { deviceId: 'tine-piano', preset: 'Soft suitcase' },
    effects: [{ deviceId: 'chorus', preset: 'Subtle widener' }, hall('Hall', 0.3)],
    ...played(
      8,
      [
        [0, 3.3, 50, 0.7],
        [0.06, 3.3, 57, 0.6],
        [0.14, 3.2, 65, 0.6],
        [0.24, 3.1, 72, 0.65],
        [1.58, 1.6, 76, 0.6],
        [2.31, 1.2, 74, 0.5],
        [3.62, 3, 55, 0.65],
        [3.7, 3, 59, 0.55],
        [3.79, 3, 62, 0.55],
        [3.9, 2.9, 69, 0.6],
        [5.27, 1.6, 67, 0.5],
      ],
      0.3,
    ),
  }),
  sound({
    id: 'bell-phrase-c',
    number: 130,
    name: 'Bell phrase {C}',
    kind: 'melodic',
    description:
      'Five strokes of glass bells wandering down through {C} major, with an octave halo.',
    instrument: { deviceId: 'fm-glass', preset: 'Glass bell' },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3, decay: 2.5 } }],
    ...played(
      8,
      [
        [0, 2, 79, 0.7],
        [0.93, 2, 76, 0.55],
        [2.21, 2, 84, 0.5],
        [3.02, 2, 74, 0.6],
        [3.94, 2, 67, 0.65],
        [3.98, 2, 72, 0.5],
      ],
      0.5,
    ),
  }),
  sound({
    id: 'kalimba-pattern-am',
    number: 131,
    name: 'Kalimba pattern {A}m',
    kind: 'melodic',
    description:
      'A rising kalimba figure in {A} minor pentatonic, played twice and slowing each time.',
    instrument: bells('Kalimba', { spread: 0.6 }),
    effects: [hall('Room', 0.3)],
    ...played(
      8,
      [
        [0, 1, 69, 0.75],
        [0.36, 1, 72, 0.6],
        [0.76, 1, 76, 0.65],
        [1.22, 1, 79, 0.6],
        [1.77, 1, 76, 0.55],
        [2.47, 1.2, 74, 0.6],
        [3.4, 1, 69, 0.75],
        [3.77, 1, 74, 0.6],
        [4.19, 1, 76, 0.65],
        [4.68, 1, 81, 0.6],
        [5.28, 1, 79, 0.55],
        [6.06, 1.5, 76, 0.6],
      ],
      0.3,
    ),
  }),

  // --- Made from another sound ----------------------------------------------------
  sound({
    id: 'piano-cloud-am',
    number: 132,
    name: 'Piano cloud {A}m',
    kind: 'pad',
    description: 'The chord left ringing in the felt piano phrase, held as a slow cloud of grains.',
    source: 'felt-piano-phrase-am',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Cloud',
      // Grains from 4.5 to 5.9 s of the phrase, between two of its notes, so none holds an attack.
      params: {
        position: 0.3,
        scan: 0,
        size: 800,
        density: 13,
        spray: 0.2,
        octaves: 0,
        reverse: 0.5,
        attack: 0.5,
        tone: 4000,
      },
    },
    effects: [hall('Hall', 0.5)],
    ...looped(16, 3, 3, [60]),
  }),
  sound({
    id: 'frozen-bell-a',
    number: 133,
    name: 'Frozen bell {A}',
    kind: 'pad',
    description: 'The glass bell held still a moment after its strike, with the octave below.',
    source: 'glass-bell-a',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.05, spray: 0, size: 800, density: 12, detune: 0, attack: 0.5 },
    },
    effects: [hall('Hall', 0.4)],
    ...looped(8, 4, 2, [60, [48, 0.6]]),
  }),
  sound({
    id: 'reversed-piano-c',
    number: 134,
    name: 'Reversed piano {C}',
    kind: 'pad',
    description: 'The felt piano note played backwards: a slow swell that stops into a hall.',
    source: 'felt-piano-c',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: { end: 0.7, attack: 0.3, release: 0.3 },
    },
    effects: [hall('Hall', 0.35)],
    ...played(8, [[0, 7.5, 60]], 0.5),
  }),
]
