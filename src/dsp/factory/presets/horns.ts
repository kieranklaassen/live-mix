import { type FactoryPreset } from '../types'

// Brass belongs under a `wind` category; until the bank has one these sit
// with the pads.
export const HORNS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'horn-section-hall',
    name: 'Horns in a hall',
    category: 'pad',
    description:
      'Three horns to a key, swelling in and warming as they grow, with a concert hall behind them.',
    instrument: { deviceId: 'horns', preset: 'Horn swell' },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'chord',
  },
  {
    id: 'breathy-fifths-trumpet',
    name: 'Trumpet in fifths',
    category: 'pad',
    description:
      'A soft trumpet that is half air, shadowed a fifth above, its tape echoes trailing into open space.',
    instrument: { deviceId: 'horns', preset: 'Parallel fifths', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Space echo', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'flugelhorn-close',
    name: 'Flugelhorn up close',
    category: 'pad',
    description:
      'One flugelhorn played quietly into the microphone, breath and all, in a small warm room.',
    instrument: { deviceId: 'horns', preset: 'Flugel breath', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
    preview: 'line',
  },
  {
    id: 'low-brass-choir',
    name: 'Low brass choir',
    category: 'pad',
    description:
      'Trombones and tuba, four to a note, rising slowly out of a very large and dark space.',
    instrument: { deviceId: 'horns', preset: 'Low brass choir', params: { attack: 2.5 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'muted-trumpet-far',
    name: 'Muted trumpet, far off',
    category: 'pad',
    description:
      'A thin, nasal muted trumpet heard from a distance through worn tape echo and a long hall.',
    instrument: { deviceId: 'horns', preset: 'Muted distance', params: { volume: -2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
]
