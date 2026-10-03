// Drones of blown, bowed and plucked instruments: one note, or a note with its octave or its
// fifth, held for as long as the loop lasts.
// Numbers 135 to 140. What every sound here is held to is in docs/factory.md.

import { quarterTurn, hall } from '../parts'
import { type FactorySound } from '../types'
import { looped, sound } from './recipe'

export const DRONES_HELD: readonly FactorySound[] = [
  sound({
    id: 'plucked-tanpura-e',
    number: 135,
    name: 'Plucked tanpura {E}',
    kind: 'drone',
    description:
      'Four buzzing strings on {E} and {B} plucked in turn, three rounds to the loop, in a room.',
    // The first string is a fourth under the key and the last an octave under it. The player's
    // time is uneven by a few hundredths of a second a pluck, the same way in every key: at
    // this speed the twelve plucks from the fifth one on take 8 s to within 2 ms, so the
    // plucking comes round with the loop.
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { speed: 2.698, decay: 30, jawari: 0.8, volume: 6 },
    },
    effects: [
      // A pluck stands 6 dB over the strings still ringing, which reads as a note and not as
      // a drone: the limiter takes the pluck down and the compressor brings the ringing back
      // up behind it.
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 8,
          attack: 10,
          release: 0.15,
          knee: 6,
          tails: 1,
          scLowCut: 40,
          makeup: 18,
        },
      },
      hall('Room', 0.3),
    ],
    // The fifth pluck falls at 2.69 s and the sixth at 3.35 s: the loop starts just after the
    // one, with every string plucked once, and its fold is over before the other.
    ...looped(8, 2.77, 0.45, [52]),
  }),
  sound({
    id: 'bass-clarinet-f',
    number: 136,
    name: 'Bass clarinet {F}',
    kind: 'drone',
    description: 'One low {F} held on a bass clarinet, reedy and breathy, in a small room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.94, breath: 0.5, attack: 0.6 },
    },
    // No more of the room than this: its low resonances take one key up and the next down, and
    // at half and half the level moved by 4.5 LU and the width by 12 dB from key to key.
    effects: [hall('Room', 0.3), quarterTurn(8)],
    // The breath wanders by a dB or so, the same way in every key: from here the two ends of
    // the loop are as loud as each other.
    ...looped(8, 5.5, 1, [41]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'horn-drone-g',
    number: 137,
    name: 'Horn drone {G}',
    kind: 'drone',
    description:
      'Two horns holding {G} and the {D} above it, breathy and with no vibrato, in a hall.',
    // One player a note: a section beats against itself and swells. The air in the tone keeps
    // the higher keys, where a horn is nearly a pure tone, from coming out loud.
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { section: 0, breath: 0.5, attack: 1 },
    },
    effects: [hall('Hall', 0.4), quarterTurn(8)],
    ...looped(8, 5, 2, [55, [62, 0.7]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'flute-octaves-b',
    number: 138,
    name: 'Flute octaves {B}',
    kind: 'drone',
    description: 'Two flutes an octave apart on {B}, blown softly with air in the tone, in a hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { breath: 0.8, blow: 0.2, vibrato: 0, chiff: 0, scoop: 0, attack: 0.5, volume: 0 },
    },
    effects: [
      // A flute's breath wanders by a couple of dB: this holds it level.
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -60,
          ratio: 8,
          attack: 20,
          release: 0.15,
          knee: 6,
          tails: 1,
          makeup: 24,
        },
      },
      hall('Hall', 0.3),
      quarterTurn(8),
    ],
    // Both at the touch where a flute is in tune (blown harder it goes sharp). It holds its
    // pitch well enough for the two ends to meet in step, so it is folded as a steady tone is.
    ...looped(8, 5, 1, [
      [71, 0.75],
      [83, 0.75],
    ]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'violin-drone-c',
    number: 139,
    name: 'Violin drone {C}',
    kind: 'drone',
    description:
      'Two violins on a high {C} and {G}, bowed over the fingerboard with no vibrato, in a hall.',
    // One player a note, each on the pitch: a section, or a longer room, makes it swell.
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { players: 1, scatter: 0 },
    },
    effects: [hall('Hall', 0.4), quarterTurn(8)],
    ...looped(8, 5, 2, [72, [79, 0.7]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'steel-guitar-drone-a',
    number: 140,
    name: 'Steel guitar drone {A}',
    kind: 'drone',
    description:
      'A steel guitar on {A} and {E}, caught after the pick by a sustainer and held, in a hall.',
    instrument: { deviceId: 'pedal-steel', preset: 'Still glass' },
    effects: [
      // The held sound alone: under it the strings themselves darken and die away.
      {
        deviceId: 'sustainer',
        preset: 'Glass organ',
        params: { tone: -0.3, motion: 0.15, lowCut: 60, mix: 1 },
      },
      hall('Hall', 0.35),
    ],
    ...looped(8, 6, 1, [57, [64, 0.7]]),
  }),
]
