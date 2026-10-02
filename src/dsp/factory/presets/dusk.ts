import { type FactoryPreset } from '../types'

// The built-in chorus is the sound of this instrument, so nothing here puts a
// chorus effect after it: only rooms, tape and echo.

export const DUSK_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'dusk-strings',
    name: 'Dusk strings',
    category: 'pad',
    description:
      'The eighties chorus pad as it comes: sawtooth and moving pulse over a sub octave, with a hall behind it.',
    instrument: { deviceId: 'dusk', preset: 'Soft strings' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'cassette-pulse-pad',
    name: 'Cassette pulse pad',
    category: 'pad',
    description:
      'A thin moving pulse under the deeper chorus, worn by a cassette and left in a very large room.',
    instrument: { deviceId: 'dusk', preset: 'Wide pulse', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'evening-swell',
    name: 'Evening swell',
    category: 'pad',
    description:
      'A dark chord whose filter opens over three seconds and closes for longer, in a long plate.',
    instrument: { deviceId: 'dusk', preset: 'Slow bloom' },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'filter-song',
    name: 'Filter song',
    category: 'pad',
    description:
      'The filter singing two octaves above each key, almost a sine, repeated by tape heads in a cathedral.',
    instrument: { deviceId: 'dusk', preset: 'Singing filter' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral' },
    ],
    preview: 'line',
  },
  {
    id: 'low-tide-pad',
    name: 'Low tide pad',
    category: 'pad',
    description:
      'Square and full sub octave with the filter nearly shut: a dark bed for low chords and drones.',
    instrument: { deviceId: 'dusk', preset: 'Sub floor', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
    preview: 'low',
  },
]
