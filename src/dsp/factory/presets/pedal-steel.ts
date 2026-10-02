import { type FactoryPreset } from '../types'

export const PEDAL_STEEL_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'steel-slow-chords',
    name: 'Slow steel chords',
    category: 'plucked',
    description:
      'A pedal steel swelled in with the volume pedal, so chords rise out of an amp spring and a long plate.',
    instrument: { deviceId: 'pedal-steel', preset: 'Slow steel' },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'steel-still-glass',
    name: 'Still glass steel',
    category: 'plucked',
    description:
      'Steel strings with no vibrato, faded in over a second and a half and held in a very large, dark space.',
    instrument: { deviceId: 'pedal-steel', preset: 'Still glass', params: { volume: -10.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45 } },
    ],
    preview: 'chord',
  },
  {
    id: 'steel-long-slides',
    name: 'Long steel slides',
    category: 'plucked',
    description:
      'One string that slides to every overlapping note within an octave, trailing tape echo into a hall.',
    instrument: { deviceId: 'pedal-steel', preset: 'Long slides', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28, spread: 0.8 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },
  {
    id: 'steel-singing-lead',
    name: 'Singing steel lead',
    category: 'plucked',
    description:
      'A lead that bends between neighbouring notes under a slow, deep bar vibrato, with three echoes and a plate.',
    instrument: { deviceId: 'pedal-steel', preset: 'Singing lead', params: { volume: -6 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.22 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'lap-steel-tremolo',
    name: 'Lap steel tremolo',
    category: 'plucked',
    description:
      'A bright lap steel picked hard with no swell, through amp tremolo and a dripping spring tank.',
    instrument: { deviceId: 'pedal-steel', preset: 'Lap slide', params: { volume: -6 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
]
