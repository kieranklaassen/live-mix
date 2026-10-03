import { type FactoryPreset } from '../types'

export const WEST_COAST_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'wooden-plucks-echo',
    name: 'Wooden plucks and echo',
    category: 'plucked',
    description:
      'Woody plucks through a low-pass gate, with a quiet tape echo behind them and a small dark room.',
    instrument: { deviceId: 'west-coast', preset: 'Wooden pluck', params: { volume: -1.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'gate-glass-bells',
    name: 'Glass gate bells',
    category: 'bell',
    description:
      'Clangorous bell strikes that dull to a pure ring, widened a little and left in a still room.',
    instrument: { deviceId: 'west-coast', preset: 'Glass bell', params: { volume: -1 } },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'folding-drone-space',
    name: 'Folding drone',
    category: 'drone',
    description:
      'A low fifth that swells in and keeps folding over itself, on tape, in a very large space.',
    instrument: { deviceId: 'west-coast', preset: 'Folding drone', params: { volume: -8 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slow-bloom-pad',
    name: 'Slow bloom',
    category: 'pad',
    description:
      'A chord that opens slowly, its overtones blooming with the gate, in an ensemble chorus and a blooming reverb.',
    instrument: { deviceId: 'west-coast', preset: 'Slow bloom', params: { volume: -9 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Bloom', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bright-gate-harp',
    name: 'Bright gate harp',
    category: 'plucked',
    preview: 'chord',
    description:
      'A bright strummed chord, each string a little different from the last, ringing into a plain hall.',
    instrument: { deviceId: 'west-coast', preset: 'Bright harp', params: { volume: -8.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
]
