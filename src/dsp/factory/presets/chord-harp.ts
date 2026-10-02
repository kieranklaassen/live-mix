import { type FactoryPreset } from '../types'

export const CHORD_HARP_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'evening-chord-harp',
    name: 'Evening chord harp',
    category: 'keys',
    description:
      'A held chord strummed up three octaves of soft electronic strings, in a slow chorus and a hall.',
    instrument: { deviceId: 'chord-harp', preset: 'Evening strum', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'harp-slow-cascade',
    name: 'Slow harp cascade',
    category: 'keys',
    description:
      'The chord climbs four octaves one dark string at a time and comes back down, with tape repeats.',
    instrument: { deviceId: 'chord-harp', preset: 'Slow cascade' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.5, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'harp-chime-keys',
    name: 'Chime keys',
    category: 'keys',
    description: 'No strum: every key is one bright electronic pluck, ringing into a long spring.',
    instrument: { deviceId: 'chord-harp', preset: 'Single chimes' },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'harp-pad-and-sparkle',
    name: 'Pad and sparkle',
    category: 'keys',
    description:
      'A soft organ chord with its notes scattered above it in no order, wide, in a very large space.',
    instrument: { deviceId: 'chord-harp', preset: 'Pad and sparkle' },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.75 } },
    ],
    preview: 'chord',
  },
  {
    id: 'toy-harp-tape',
    name: 'Toy harp on tape',
    category: 'keys',
    description:
      'A quick downward strum of short, bright strings over two octaves, on tape in a small room.',
    instrument: { deviceId: 'chord-harp', preset: 'Toy harp' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
]
