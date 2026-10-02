import { type FactoryPreset } from '../types'

export const STRING_MACHINE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'ensemble-strings-hall',
    name: 'Ensemble strings, hall',
    category: 'string',
    description: 'The seventies string ensemble as it comes, with a long hall behind it.',
    instrument: { deviceId: 'string-machine', preset: 'Solina' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
  },
  {
    id: 'slow-tape-strings',
    name: 'Slow tape strings',
    category: 'string',
    description:
      'Strings that take three seconds to arrive, worn by tape and left in a very large room.',
    instrument: { deviceId: 'string-machine', preset: 'Slow strings', params: { width: 0.6 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'phased-string-ensemble',
    name: 'Phased ensemble',
    category: 'string',
    description:
      'The string machine through a slow phaser, the way it was recorded all through the seventies.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Solina',
      params: { attack: 0.9, release: 3, tone: 4200, width: 0.6, volume: -4 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow Swirl',
        params: { rate: 0.09, feedback: 45, stereo: 50 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2, decay: 0.7 } },
    ],
  },
  {
    id: 'glass-strings',
    name: 'Glass strings',
    category: 'pad',
    description: 'Only the top octave of the ensemble, with an octave halo above it.',
    instrument: { deviceId: 'string-machine', preset: 'Glass', params: { volume: -12 } },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4 } }],
  },
  {
    id: 'cello-section',
    name: 'Cello section',
    category: 'string',
    description: 'The low octave alone: a dark section sound for slow bass lines and drones.',
    instrument: { deviceId: 'string-machine', preset: 'Cellos', params: { volume: -5 } },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { outputDb: -4.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
    preview: 'low',
  },
]
