import { type FactoryPreset } from '../types'

export const TAPE_ORCHESTRA_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'reel-of-strings',
    name: 'Reel of strings',
    category: 'string',
    description: 'A small violin section swelling in from tape, drifting slowly in a long plate.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Slow strings', params: { volume: -7 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'half-speed-horns',
    name: 'Half-speed horns',
    category: 'pad',
    description:
      'French horns on tape slowed to half speed, an octave down, in a very large space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'worn-reel-choir',
    name: 'Worn reel choir',
    category: 'voice',
    description: 'A choir on tired tape that wobbles, drops out and repeats into a hall.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Worn choir', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.45, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'eight-second-flutes',
    name: 'Eight-second flutes',
    category: 'wind',
    preview: 'keys',
    description:
      'Breathy flutes with eight seconds of tape under each key, an echo and a small plate.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Flutes on tape', params: { volume: -6 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.22 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lost-reel',
    name: 'Lost reel',
    category: 'texture',
    description:
      'A ruined flute tape at half speed: hiss, dropouts and seasick pitch in a long dark tail.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Lost reel', params: { volume: -6.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.35 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.45 } },
    ],
  },
]
