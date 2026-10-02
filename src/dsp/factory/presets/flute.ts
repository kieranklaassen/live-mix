import { type FactoryPreset } from '../types'

// The category these want is `wind`. Until the bank has it, the four lines
// sit under `voice` and the pad under `pad`, each with its own preview phrase.
export const FLUTE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'flute-in-a-hall',
    name: 'Flute in a hall',
    category: 'voice',
    description:
      'A concert flute as it comes, a little breath in the tone, with a long hall behind it.',
    instrument: { deviceId: 'flute', preset: 'Concert flute', params: { volume: -7 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'temple-shakuhachi',
    name: 'Temple shakuhachi',
    category: 'voice',
    description:
      'A breathy bamboo flute that bends up into each note, alone in a very large stone room.',
    instrument: { deviceId: 'flute', preset: 'Shakuhachi', params: { volume: -11 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'line',
  },
  {
    id: 'pan-pipes-on-tape',
    name: 'Pan pipes on tape',
    category: 'voice',
    description: 'Hollow stopped pipes with a puff on every note, repeated by three tape heads.',
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'canyon-flute',
    name: 'Canyon flute',
    category: 'voice',
    description:
      'A round wood flute with a small scoop and a gentle vibrato, far off in open space.',
    instrument: { deviceId: 'flute', preset: 'Canyon flute' },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'line',
  },
  {
    id: 'low-flute-breath-pad',
    name: 'Breath pad',
    category: 'pad',
    description:
      'Low flutes blown so softly they are mostly air, swelling in slowly with an octave halo above.',
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { volume: -17 } },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } }],
    preview: 'chord',
  },
]
