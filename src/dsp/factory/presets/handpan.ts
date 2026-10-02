import { type FactoryPreset } from '../types'

export const HANDPAN_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'courtyard-handpan',
    name: 'Courtyard handpan',
    category: 'bell',
    description: 'A handpan played with soft fingers in a small stone courtyard.',
    instrument: { deviceId: 'handpan', preset: 'Soft hands', params: { volume: -4 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'halo-pan',
    name: 'Halo pan',
    category: 'bell',
    description:
      'Long handpan notes whose shared overtones set each other ringing, left in a hall.',
    instrument: { deviceId: 'handpan', preset: 'Halo' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'keys',
  },
  {
    id: 'tongue-drum-echoes',
    name: 'Tongue drum echoes',
    category: 'bell',
    description: 'A steel tongue drum, pure and long, repeated by a tape echo on a small plate.',
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Space echo', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rain-taps',
    name: 'Rain taps',
    category: 'bell',
    description:
      'Short muted taps at the edge of the note, scattered into grains and caught by a room.',
    instrument: { deviceId: 'handpan', preset: 'Rain taps', params: { volume: -1 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { mix: 0.3, feedback: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cavern-ding',
    name: 'Cavern ding',
    category: 'bell',
    description:
      'The pan struck near its centre with the thump of its air under it, in a very large space.',
    instrument: { deviceId: 'handpan', preset: 'Low ding' },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'keys',
  },
]
