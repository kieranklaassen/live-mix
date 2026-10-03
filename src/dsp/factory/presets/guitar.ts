import { type FactoryPreset } from '../types'

export const GUITAR_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'glass-neck-guitar',
    name: 'Glass neck guitar',
    category: 'plucked',
    description:
      'A clean neck pickup through a slow chorus and a short tape echo: single notes that ring and widen.',
    instrument: { deviceId: 'guitar', preset: 'Glass neck', params: { volume: 0 } },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, mix: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'guitar-pedal-swells',
    name: 'Pedal swells',
    category: 'plucked',
    description:
      'Every note faded in as with a volume pedal, so no pick is heard, and left in a hall.',
    instrument: { deviceId: 'guitar', preset: 'Volume swell' },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.45, decay: 6 } }],
    preview: 'chord',
  },
  {
    id: 'slow-strum-bloom',
    name: 'Slow strum bloom',
    category: 'plucked',
    description:
      'An open chord dragged slowly across the strings into a reverb that opens after it.',
    instrument: { deviceId: 'guitar', preset: 'Slow strum' },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Bloom', params: { mix: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'baritone-twang',
    name: 'Baritone twang',
    category: 'plucked',
    description:
      'Low strings picked hard by the bridge, with amp tremolo and a dark spring: slow and wide open.',
    instrument: { deviceId: 'guitar', preset: 'Dark baritone' },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5, depth: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.35, tone: 2600 } },
    ],
    preview: 'low',
  },
  {
    id: 'muted-echo-pattern',
    name: 'Muted echo pattern',
    category: 'plucked',
    description:
      'Short muted notes from the bridge pickup into a three-head echo: play a pattern and it answers.',
    instrument: { deviceId: 'guitar', preset: 'Muted pattern' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 375, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15 } },
    ],
    preview: 'keys',
  },
]
