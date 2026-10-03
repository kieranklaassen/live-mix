// Motion: modulation.

import { type FactoryChain } from '../types'

export const MOTION_CHAINS: readonly FactoryChain[] = [
  {
    id: 'slow-chorus',
    name: 'Slow chorus',
    category: 'motion',
    description: 'Three voices drifting over twelve seconds: width and movement without wobble.',
    effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
  },
  {
    id: 'phaser-sweep',
    name: 'Phaser sweep',
    category: 'motion',
    description: 'Eight resonant stages swept up and down once every sixteen seconds.',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { rate: 0.06, depth: 85, shape: 1, stereo: 60, feedback: 55, mix: 0.42 },
      },
    ],
  },
  {
    id: 'rotary-chorale',
    name: 'Rotary chorale',
    category: 'motion',
    description: 'A rotating speaker on its slow speed, heard from across the room.',
    effects: [{ deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.6 } }],
  },
  {
    id: 'tremolo-and-pan',
    name: 'Tremolo and pan',
    category: 'motion',
    description:
      'A harmonic tremolo that shimmers rather than pulses, then drifts from side to side.',
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.8, depth: 0.55 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
    ],
  },
  {
    id: 'filter-tide',
    name: 'Filter tide',
    category: 'motion',
    description:
      'A low-pass filter that starts closed and takes a hundred seconds to open and close again.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 900, resonance: 1, lfoAmount: 40, lfoRateHz: 0.01, lfoShape: 1 },
      },
    ],
  },

  {
    id: 'breathing-pulses',
    name: 'Breathing pulses',
    category: 'motion',
    description:
      'The reverb comes in three slow waves and comes round again, quieter each time, into a plate.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
]
