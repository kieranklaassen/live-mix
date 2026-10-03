// Textures: weather, places and noise with little or no pitch, looping without a seam.
// Numbers 161 to 170. What every sound here is held to is in docs/factory.md.
//
// Six are scenes of the outdoors instrument. Its birds, crickets and frogs are
// pitched calls, and a few of them close by are a phrase, not a texture: here
// each is a crowd (several keys held, every key another group of animals in
// another register) set far enough off to run together.

import { type PatchDevice } from '../../../core/devices/patch'
import { breathe, soften, hall } from '../parts'
import { type FactorySound } from '../types'
import { looped, sound, weather } from './recipe'

const outdoors = (preset: string, params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'outdoors',
  preset,
  params,
})

export const TEXTURES: readonly FactorySound[] = [
  sound({
    id: 'brook-over-stones',
    number: 161,
    name: 'Brook over stones',
    kind: 'texture',
    description: 'A small stream heard from beside it: single bubbles over a soft rush of water.',
    instrument: outdoors('Small stream', { density: 0.4, distance: 0.1, attack: 0.5, width: 0.8 }),
    effects: [],
    ...looped(8, 3, 2, [64]),
  }),
  sound({
    id: 'wood-at-dawn',
    number: 162,
    name: 'Wood at dawn',
    kind: 'texture',
    description: 'Birds all through a wood, far off in a long reverb, the level coming and going.',
    instrument: outdoors('Dawn chorus', {
      density: 1,
      distance: 0.9,
      movement: 1,
      tone: 0.3,
      attack: 1,
      width: 0.6,
    }),
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.6, width: 0.7 } },
      breathe(0.0625, 0.6),
    ],
    ...looped(16, 4, 3, [48, 53, 57, 60, 64, 67, 72, 77]),
  }),
  sound({
    id: 'falls-in-a-gorge',
    number: 163,
    name: 'Falls in a gorge',
    kind: 'texture',
    description: 'Fast water falling a long way off: an even roar with a hall reverb behind it.',
    instrument: outdoors('Fast water', { distance: 0.8, tone: 0.3, attack: 1, width: 0.7 }),
    effects: [hall('Hall', 0.3)],
    ...looped(8, 3, 2, [43]),
  }),
  sound({
    id: 'steady-downpour',
    number: 164,
    name: 'Steady downpour',
    kind: 'texture',
    description: 'Heavy rain heard from a distance: a dense hiss with no single drop in front.',
    instrument: weather('Distant downpour'),
    effects: [],
    ...looped(8, 2, 2, [55]),
  }),
  sound({
    id: 'rolling-thunder',
    number: 165,
    name: 'Rolling thunder',
    kind: 'texture',
    description: 'A storm far off whose rolls of thunder overlap, one dying away under the next.',
    instrument: outdoors('Far storm', { density: 1, tone: 0.65, movement: 0.4, width: 0.8 }),
    effects: [soften(8)],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  }),
  sound({
    id: 'frog-pond-at-night',
    number: 166,
    name: 'Frog pond at night',
    kind: 'texture',
    description: 'A pond full of frogs after dark: croaks, trills and peeps on every side.',
    instrument: outdoors('Pond at dusk', { density: 1, distance: 0.6, attack: 1 }),
    effects: [soften(12)],
    ...looped(16, 3, 3, [43, 48, 55, 60, 65]),
  }),
  sound({
    id: 'field-of-crickets',
    number: 167,
    name: 'Field of crickets',
    kind: 'texture',
    description: 'Crickets across a field at night, each chirp scattered by a grain cloud.',
    instrument: outdoors('Evening field', { distance: 0.8, movement: 0.4, tone: 0.6, attack: 1 }),
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 12, scatter: 1, feedback: 0.3, mix: 0.7 },
      },
    ],
    ...looped(8, 6, 2, [41, 47, 52, 57, 62, 67, 72, 77]),
  }),
  sound({
    id: 'wind-in-the-chimney',
    number: 168,
    name: 'Wind in the chimney',
    kind: 'texture',
    description:
      'Gusts across a chimney top heard from the room below: a hollow moan, rising and falling.',
    instrument: weather('Whistling gap', { resonance: 0.35, size: 0.5 }),
    effects: [hall('Room', 0.3)],
    ...looped(16, 6, 3, [50]),
  }),
  sound({
    id: 'hum-in-an-empty-room',
    number: 169,
    name: 'Hum in an empty room',
    kind: 'texture',
    description:
      'Something left switched on: mains hum on a low {G} over the rumble of a bare room.',
    instrument: weather('Mains hum', { volume: -14 }),
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -30, width: 0.7 } },
    ],
    ...looped(8, 3, 2, [43]),
  }),
  sound({
    id: 'radio-between-stations',
    number: 170,
    name: 'Radio between stations',
    kind: 'texture',
    description: 'Bands of tuned noise on a shortwave radio, fading in and out of its static.',
    instrument: { deviceId: 'thesis', params: { resonance: 20, attack: 0.3, breatheRate: 0.25 } },
    effects: [{ deviceId: 'radio', preset: 'Night shortwave' }, hall('Room', 0.5)],
    ...looped(8, 6, 2, [55, 62]),
  }),
]
