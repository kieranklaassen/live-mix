import { type FactoryPreset } from '../types'

export const OUTDOORS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'garden-at-dawn',
    name: 'Garden at dawn',
    category: 'texture',
    description: 'A thrush up front and a handful of smaller birds behind it, in open air.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { attack: 1, width: 0.9, volume: -3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.22, decay: 5 } }],
  },
  {
    id: 'crickets-after-dark',
    name: 'Crickets after dark',
    category: 'texture',
    description: 'Crickets close by on a warm night, each keeping its own time, on worn tape.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { attack: 1.5, volume: -2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1, wow: 0.1 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2, highCut: 8000 } },
    ],
  },
  {
    id: 'brook-under-trees',
    name: 'Brook under trees',
    category: 'texture',
    description:
      'A small stream over stones, close enough to hear single bubbles; higher keys run brighter.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { attack: 1.5, volume: -4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble Cut', params: { cutoffHz: 120 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25, highCut: 6000 } },
    ],
  },
  {
    id: 'storm-over-the-hills',
    name: 'Storm over the hills',
    category: 'texture',
    description:
      'Thunder from far off: the first roll comes with the key, then one about every half minute.',
    instrument: { deviceId: 'outdoors', preset: 'Far storm', params: { volume: -2 } },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 8, lowCut: 30 } },
    ],
  },
  {
    id: 'porch-chimes',
    name: 'Porch chimes',
    category: 'bell',
    preview: 'chord',
    description:
      'Wind chimes tuned to the keys you hold, struck by a light breeze, with a soft echo.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.55, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Discreet', params: { time: 420, mix: 0.2 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3, decay: 5 } },
    ],
  },
]
