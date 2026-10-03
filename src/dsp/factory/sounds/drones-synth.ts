// Drones of the synthesizers: oscillators, partials and filtered noise held still or barely moving.
// Numbers 141 to 146. What every sound here is held to is in docs/factory.md.

import { quarterTurn, hall } from '../parts'
import { type FactorySound } from '../types'
import { looped, sound } from './recipe'

export const DRONES_SYNTH: readonly FactorySound[] = [
  sound({
    id: 'sub-drone-e',
    number: 141,
    name: 'Sub drone {E}',
    kind: 'drone',
    description:
      'A low {E} on a filtered sawtooth with a sine an octave below it, round and held still.',
    // The filter lets the first harmonics through: the sine and the note alone are too low
    // for small speakers.
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 0, cutoff: 700, emphasis: 0.25, drive: 0.3, glide: 0 },
    },
    effects: [hall('Hall', 0.3), quarterTurn(8)],
    ...looped(8, 4, 2, [40]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'folding-drone-f',
    number: 142,
    name: 'Folding drone {F}',
    kind: 'drone',
    description:
      'A wavefolded tone on {F} with {C} above it, its buzzing overtones shifting in a small room.',
    // F, its octave and the C that is its third harmonic: one series, so the three share a period.
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { ratio: 1, drift: 0.4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.125 } },
      hall('Room', 0.25),
    ],
    ...looped(16, 6, 3, [41, 53, [60, 0.6]]),
  }),
  sound({
    id: 'hollow-drone-b',
    number: 143,
    name: 'Hollow drone {B}',
    kind: 'drone',
    description:
      'A square wave on {B} over its sub octave, hollow as a pipe, drifting side to side in a cathedral.',
    // Its own chorus turns 4.1 times in 8 s: it is off, and a pan that turns once moves the tone.
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { wave: 1, sub: 0.5, lowCut: 0, cutoff: 2500, attack: 0.5, chorus: 0 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.125, depth: 0.7, drift: 0 } },
      hall('Cathedral', 0.3),
      quarterTurn(8),
    ],
    ...looped(8, 4, 2, [59]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'glass-drone-c',
    number: 144,
    name: 'Glass drone {C}',
    kind: 'drone',
    description:
      'Glassy FM tones on {C} and {G} through three octaves, bright and almost still, in a hall.',
    // No detune: the two halves of a note beat to nothing in mono. A slow chorus moves it instead.
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { ratio: 6, brightness: 0.45, detune: 0, velocity: 0.9, attack: 0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.2 } },
      hall('Hall', 0.4),
      quarterTurn(8),
    ],
    ...looped(8, 5, 2, [[60, 0.4], [67, 0.4], 72, [79, 0.8], [84, 0.6], [91, 0.4]]),
    tuning: 'whole-cycles',
  }),
  sound({
    id: 'air-drone-g',
    number: 145,
    name: 'Air drone {G}',
    kind: 'drone',
    description:
      'Soft sines in a just {G} major chord with tuned noise around them, drifting a little.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { partials: 0.75, air: 0.65, movement: 0.2, rate: 0.0625, attack: 1, width: 0.7 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } }],
    ...looped(16, 6, 3, [67]),
  }),
  sound({
    id: 'synth-horn-drone-a',
    number: 146,
    name: 'Synth horn drone {A}',
    kind: 'drone',
    description:
      'Two soft synthesizer horns a fifth apart on {A}, held after their swell has settled.',
    instrument: { deviceId: 'aurora', preset: 'Soft horns', params: { attack: 0.5, detune: 0 } },
    effects: [hall('Hall', 0.3), quarterTurn(8)],
    ...looped(8, 8, 2, [57, [64, 0.7]]),
    tuning: 'whole-cycles',
  }),
]
