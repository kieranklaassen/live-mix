import { type FactoryPreset } from '../types'

export const TANPURA_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'tanpura-room',
    name: 'Tanpura in a room',
    category: 'drone',
    description:
      'Four strings plucked round and round, each pluck opening into its buzz of overtones, in a small room.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { spread: 0.8, volume: -4 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room' }],
    preview: 'low',
  },
  {
    id: 'slow-overtone-wall',
    name: 'Slow overtone wall',
    category: 'drone',
    description:
      'A slow round on long strings with the bridge wide open, through tape into a very large space.',
    instrument: { deviceId: 'tanpura', preset: 'Slow wall', params: { volume: -5 } },
    effects: [
      // The drive the preset had when this was tuned.
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, decay: 16 } },
    ],
    preview: 'low',
  },
  {
    id: 'ma-sympathetic-strings',
    name: 'Ma with sympathetics',
    category: 'drone',
    description:
      'The suspended Ma tuning with a bank of sympathetic strings answering each pluck, in a hall.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { spread: 0.75, volume: -4.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'closed-jawari-echo',
    name: 'Closed jawari echo',
    category: 'drone',
    description:
      'A drier, quicker buzz with a tape echo trailing every pluck and a long spring behind it.',
    instrument: { deviceId: 'tanpura', preset: 'Closed jawari', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'monochord-halo',
    name: 'Monochord halo',
    category: 'drone',
    description:
      'Four plain long strings with no buzz, beating slowly, under a plate and an octave halo.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { spread: 0.45, volume: -3 } },
    effects: [
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3, width: 0.5 } },
    ],
    preview: 'low',
  },
]
