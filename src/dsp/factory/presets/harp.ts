import { type FactoryPreset } from '../types'

// `string` until the bank has a `plucked` category; these belong there.
export const HARP_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'concert-harp-hall',
    name: 'Concert harp',
    category: 'plucked',
    description: 'A pedal harp plucked near the middle of its strings, ringing on in a hall.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -4 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'harp-glissando-plate',
    name: 'Harp glissando',
    category: 'plucked',
    description:
      'Notes played together are rolled from the lowest to the highest, over a long plate.',
    instrument: { deviceId: 'harp', preset: 'Glissando', params: { volume: -3 } },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'harp-glass-halo',
    name: 'Harp with a halo',
    category: 'plucked',
    description:
      'Soft, long strings that ring into each other, with an octave of reverb opening above them.',
    instrument: { deviceId: 'harp', preset: 'Long glass ring' },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } }],
    preview: 'keys',
  },
  {
    id: 'koto-rising-echo',
    name: 'Rising koto',
    category: 'plucked',
    description:
      'A hard pick near the bridge and every note pressed a semitone sharp after it sounds, with a quiet tape echo in a room.',
    instrument: { deviceId: 'harp', preset: 'Rising koto', params: { volume: 0 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Discreet' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'guzheng-cascade-space',
    name: 'Guzheng cascade',
    category: 'plucked',
    description: 'Bright steel strings rolled into one another, left in a very large space.',
    instrument: { deviceId: 'harp', preset: 'Guzheng cascade', params: { volume: 1 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
    preview: 'keys',
  },
]
