import { type FactoryPreset } from '../types'

export const ZITHER_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'open-zither-hall',
    name: 'Open zither hall',
    category: 'plucked',
    preview: 'chord',
    description:
      'A picked chord zither strummed across open fifths and octaves, on tape, in a plain hall.',
    instrument: { deviceId: 'zither', preset: 'Open zither', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'harp-glissando-space',
    name: 'Harp glissando space',
    category: 'plucked',
    preview: 'hold',
    description:
      'Every key sweeps a harp slowly across an added-ninth chord into a very large space.',
    instrument: { deviceId: 'zither', preset: 'Harp glissando', params: { volume: -5 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
  },
  {
    id: 'hammered-glass-shimmer',
    name: 'Hammered glass shimmer',
    category: 'plucked',
    preview: 'line',
    description:
      'A hammered dulcimer rolled in octaves, with quiet tape echoes and a glassy shimmer behind it.',
    instrument: { deviceId: 'zither', preset: 'Hammered shimmer' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-string-haze-drift',
    name: 'Twelve-string haze',
    category: 'pad',
    description:
      'Wide double strings in octaves that beat slowly, through a drifting chorus into a long dark reverb.',
    instrument: { deviceId: 'zither', preset: 'Twelve-string haze', params: { volume: -4 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'koto-three-heads',
    name: 'Koto and three heads',
    category: 'plucked',
    preview: 'bells',
    description:
      'A dry, nasal string plucked near the bridge, answered by three tape heads in a small dark room.',
    instrument: { deviceId: 'zither', preset: 'Koto pluck', params: { volume: -2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
]
