// Phrases: a few notes in free time, either ending inside their length or coming round on themselves.
// Numbers 185 to 194. What every sound here is held to is in docs/factory.md.

import { soften, hall } from '../parts'
import { type FactorySound } from '../types'
import { cycled, played, sound } from './recipe'

export const PHRASES: readonly FactorySound[] = [
  sound({
    id: 'harp-phrase-dm',
    number: 185,
    name: 'Harp phrase {D}m',
    kind: 'melodic',
    description:
      'A harp climbs from a low {D} to the dorian sixth and steps back down; it comes round.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { decay: 2, halo: 0.7 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } }],
    ...cycled(8, [
      [0, 2.5, 50, 0.7],
      [0.09, 2.5, 57, 0.55],
      [1.1, 2, 65, 0.6],
      [2.03, 2, 69, 0.6],
      [3.12, 2.5, 71, 0.7],
      [4.65, 2, 67, 0.5],
      [5.37, 2, 64, 0.55],
      [6.96, 2, 62, 0.6],
    ]),
  }),
  sound({
    id: 'handpan-round-am',
    number: 186,
    name: 'Handpan round {A}m',
    kind: 'melodic',
    description: 'Soft hands circling a handpan in {A} minor, never on a pulse; it comes round.',
    // A struck note meets what still rings of it from the pass before: two passes are dropped, not one.
    instrument: { deviceId: 'handpan', preset: 'Soft hands' },
    effects: [hall('Room', 0.3)],
    ...cycled(
      8,
      [
        [0, 1.5, 57, 0.75],
        [0.63, 1, 64, 0.5],
        [1.04, 1, 67, 0.6],
        [1.94, 1.2, 65, 0.5],
        [3, 1, 64, 0.6],
        [3.34, 1, 60, 0.45],
        [4.17, 1.5, 57, 0.7],
        [4.6, 1, 62, 0.5],
        [5.78, 1, 67, 0.6],
        [6.55, 1, 64, 0.5],
        [7.21, 1, 60, 0.55],
      ],
      { passes: 2 },
    ),
  }),
  sound({
    id: 'nylon-guitar-fall-em',
    number: 187,
    name: 'Nylon guitar fall {E}m',
    kind: 'melodic',
    description:
      'A nylon guitar steps down the phrygian scale to {E}, then rolls an open fifth slowly and rings out.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { sustain: 9, release: 4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } }],
    ...played(
      8,
      [
        [0, 4.7, 52, 0.5],
        [0.04, 1.4, 71, 0.65],
        [1.26, 0.9, 69, 0.6],
        [1.92, 1.7, 67, 0.6],
        [3.39, 1.8, 65, 0.7],
        [4.97, 2.6, 52, 0.55],
        [5.41, 2.2, 59, 0.5],
        [5.76, 1.9, 64, 0.6],
      ],
      0.5,
    ),
  }),
  sound({
    id: 'pedal-steel-sigh-c',
    number: 188,
    name: 'Pedal steel sigh {C}',
    kind: 'melodic',
    description:
      'Pedal steel: {C} then {D} minor, each picked with a string bent up and back and a high note; it comes round.',
    // The F over the held E and the G over the held F are not picked: the string bends up and back.
    // No swell, so each pick is heard as a hit; a reverb that does not drift, since a plate's drift was heard as hits too.
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0, pick: 0.6, vibrato: 5, sustain: 24 },
    },
    effects: [hall('Cathedral', 0.4)],
    ...cycled(12, [
      [0, 4.9, 48, 0.65],
      [0.03, 4.9, 64, 0.7],
      [1.62, 1.45, 65, 0.6],
      [3.93, 3, 72, 0.55],
      [6.24, 5.45, 50, 0.65],
      [6.27, 5.45, 65, 0.6],
      [7.96, 1.2, 67, 0.6],
      [9.84, 2, 74, 0.5],
    ]),
  }),
  sound({
    id: 'marimba-phrase-g',
    number: 189,
    name: 'Marimba phrase {G}',
    kind: 'melodic',
    description:
      'A marimba rolls a low chord on {G}, steps down three notes above it and answers lower; it rings out.',
    // Bars that ring a little longer than a marimba's: short ones left the hall's tail to be heard as hits.
    instrument: { deviceId: 'mallets', preset: 'Soft marimba', params: { decay: 2.2 } },
    effects: [hall('Hall', 0.3)],
    ...played(
      8,
      [
        [0, 2, 43, 0.58],
        [0.07, 2, 50, 0.5],
        [0.15, 2, 57, 0.45],
        [0.24, 2, 59, 0.5],
        [1.46, 1.5, 65, 0.7],
        [2.39, 1.5, 64, 0.6],
        [3.2, 1.5, 62, 0.55],
        [4.15, 2, 43, 0.6],
        [4.22, 2, 50, 0.5],
        [5.61, 2, 59, 0.65],
      ],
      0.5,
    ),
  }),
  sound({
    id: 'zither-wash-f',
    number: 190,
    name: 'Zither wash {F}',
    kind: 'melodic',
    description:
      'Doubled zither strings picked slowly through {F} lydian in a hall; it comes round.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 9, release: 6 },
    },
    effects: [soften(12), hall('Hall', 0.45)],
    ...cycled(8, [
      [0, 2, 65, 0.7],
      [1.22, 2, 72, 0.55],
      [1.78, 2, 76, 0.6],
      [3.27, 2, 71, 0.65],
      [4.55, 2, 69, 0.5],
      [5.51, 2, 67, 0.55],
      [6.85, 2, 60, 0.6],
    ]),
  }),
  sound({
    id: 'tremolo-guitar-dm',
    number: 191,
    name: 'Tremolo guitar {D}m',
    kind: 'melodic',
    description:
      'A baritone guitar on a low {D}, slow notes through an amp tremolo and a spring; it comes round.',
    // The pick stands far above the string, so it is rounded off; the tremolo turns 54 times a loop.
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { hardness: 0.4, position: 0.16, sustain: 20 },
    },
    effects: [
      soften(21),
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4.5, depth: 0.35, drift: 0 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    ...cycled(12, [
      [0, 4, 38, 0.7],
      [0.05, 4, 45, 0.6],
      [1.38, 2.6, 53, 0.55],
      [2.38, 4, 52, 0.5],
      [4.06, 6.6, 48, 0.65],
      [4.11, 7.6, 55, 0.55],
      [5.65, 3, 59, 0.5],
      [6.84, 4.5, 57, 0.6],
      [9.11, 2.7, 52, 0.5],
      [10.81, 1.1, 45, 0.45],
    ]),
  }),
  sound({
    id: 'wooden-plucks-g',
    number: 192,
    name: 'Wooden plucks {G}',
    kind: 'melodic',
    description: 'Woody plucks of a folded tone wandering over {G} mixolydian; it comes round.',
    instrument: { deviceId: 'west-coast', preset: 'Wooden pluck', params: { decay: 2.2 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } }],
    ...cycled(8, [
      [0, 1, 67, 0.7],
      [0.52, 1, 74, 0.5],
      [1.28, 1, 77, 0.6],
      [1.7, 1, 76, 0.5],
      [2.56, 1, 71, 0.55],
      [3.21, 1, 74, 0.6],
      [4.36, 1, 67, 0.65],
      [4.67, 1, 69, 0.5],
      [5.71, 1, 77, 0.6],
      [6.15, 1, 76, 0.5],
      [7.18, 1, 74, 0.55],
    ]),
  }),
  sound({
    id: 'shakuhachi-call-am',
    number: 193,
    name: 'Shakuhachi call {A}m',
    kind: 'melodic',
    description:
      'A breathy bamboo flute rises from {A} to a long {E}, leans up to {F} and falls back, in a hall; it rings out.',
    // Chiff and a fast attack make each note a hit; less breath than the preset keeps the line tonal.
    // A blown note holds its level, so the line is one strong note among soft ones: played evenly it sat 3 LU over the rest.
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.5, vibrato: 0.35 },
    },
    effects: [hall('Hall', 0.35)],
    ...played(
      8,
      [
        [0, 1.15, 69, 0.42],
        [1.36, 0.5, 74, 0.38],
        [2.1, 1.4, 76, 1],
        [3.74, 0.38, 77, 0.48],
        [4.32, 0.7, 76, 0.4],
        [5.26, 0.3, 71, 0.34],
        [5.7, 1.25, 69, 0.46],
      ],
      0.5,
    ),
  }),
  sound({
    id: 'felt-piano-round-c',
    number: 194,
    name: 'Felt piano round {C}',
    kind: 'melodic',
    description:
      'A felted piano in a small room, slow notes over {C} and then over {G}; it comes round.',
    // The felt takes far more from a soft note above the middle of the keyboard than from a low one, so
    // the melody is played hard and the bass lightly. The piano's own room rings on some notes: a room after it.
    instrument: { deviceId: 'felt-piano', preset: 'Felt', params: { resonance: 0, reverbMix: 0 } },
    effects: [hall('Room', 0.3)],
    ...cycled(12, [
      [0, 5.9, 48, 0.55],
      [0.07, 5.9, 55, 0.45],
      [1.47, 3.9, 64, 0.9],
      [2.33, 3.2, 62, 0.85],
      [3.37, 2.6, 67, 0.95],
      [4.82, 1.2, 64, 0.75],
      [6.2, 5.6, 43, 0.55],
      [6.26, 5.6, 50, 0.45],
      [7.52, 3.2, 71, 0.95],
      [8.3, 3.2, 69, 0.85],
      [9.74, 2, 64, 0.85],
      [11.06, 0.8, 62, 0.8],
    ]),
  }),
]
