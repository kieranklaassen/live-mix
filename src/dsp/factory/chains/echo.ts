// Echo: delays.

import { type FactoryChain } from '../types'

export const ECHO_CHAINS: readonly FactoryChain[] = [
  {
    id: 'tape-echo-wash',
    name: 'Tape echo wash',
    category: 'echo',
    description: 'Dotted tape repeats that darken as they pile up, left to blur in a hall.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { feedback: 0.72, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'backwards-repeats',
    name: 'Backwards repeats',
    category: 'echo',
    description: 'Each phrase comes back reversed, swelling in and cutting off, in a quiet hall.',
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, smooth: 0.6, mix: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, midDecay: 3.5, mix: 0.15 } },
    ],
  },
  {
    id: 'grain-crystals',
    name: 'Grain crystals',
    category: 'echo',
    description: 'Repeats rebuilt from grains an octave up, each pass climbing again into a plate.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'three-head-echo',
    name: 'Three head echo',
    category: 'echo',
    description: 'Three tape heads in a row and a spring behind them, the old echo box sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },

  {
    id: 'echoes-remembered',
    name: 'Echoes remembered',
    category: 'echo',
    description:
      'A soft echo while phrases from the last twenty seconds drift back under what you play, in a wide plate.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'half-remembered-hall',
    name: 'Half-remembered hall',
    category: 'echo',
    description:
      'Dark recollections from up to a minute ago, some backwards or an octave down, blurred in a hall.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { reach: 60, mix: 0.38 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'murky-analog-echo',
    name: 'Murky analog echo',
    category: 'echo',
    description:
      'Long, dark bucket-brigade repeats with a slow chorus and a little hiss, set back in a plate.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { feedback: 0.55, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'memory-bed',
    name: 'Memory bed',
    category: 'echo',
    description:
      'Each phrase comes back as a soft loop that fades under what is played next, in a plate.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed' },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
]
