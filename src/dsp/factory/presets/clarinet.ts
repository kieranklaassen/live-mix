import { type FactoryPreset } from '../types'

export const CLARINET_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'clarinet-in-a-room',
    name: 'Clarinet in a room',
    category: 'wind',
    description: 'A warm low clarinet, hollow and a little breathy, close up in a small room.',
    instrument: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -4 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'subtone-tenor-plate',
    name: 'Subtone tenor',
    category: 'wind',
    description:
      'A tenor saxophone blown so softly that it is more breath than note, on tape with a long plate.',
    instrument: { deviceId: 'clarinet', preset: 'Subtone tenor' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'clarinets-from-nothing',
    name: 'Clarinets from nothing',
    category: 'wind',
    description:
      'A chord of clarinets that fades in from silence, air first, and leaves through a hall.',
    instrument: { deviceId: 'clarinet', preset: 'From nothing', params: { volume: -10 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'bass-clarinet-drone',
    name: 'Bass clarinet drone',
    category: 'wind',
    description:
      'The bottom of a bass clarinet, woody and slow to speak, held as a fifth in a very large space.',
    instrument: { deviceId: 'clarinet', preset: 'Bass clarinet', params: { volume: -5 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'low',
  },
  {
    id: 'soprano-tape-echo',
    name: 'Soprano into tape echo',
    category: 'wind',
    description:
      'A bright soprano saxophone line caught by a tape echo that keeps its last phrases turning.',
    instrument: { deviceId: 'clarinet', preset: 'Bright soprano', params: { volume: -4 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.65, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
]
