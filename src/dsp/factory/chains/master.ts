// Master: last on the mix.

import { type FactoryChain } from '../types'

export const MASTER_CHAINS: readonly FactoryChain[] = [
  {
    id: 'gentle-glue',
    name: 'Gentle glue',
    category: 'master',
    description: 'A few decibels of soft saturation and a limiter that only catches peaks.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 3, outputDb: -4 } },
      { deviceId: 'limiter-1176', params: { inputGain: 3, outputGain: -3 } },
    ],
  },
  {
    id: 'wide-and-safe',
    name: 'Wide and safe',
    category: 'master',
    description:
      'A little more side signal with the bass kept in the middle, then a safety limiter.',
    effects: [
      { deviceId: 'stereo-widener', params: { width: 0.62 } },
      { deviceId: 'limiter-1176', preset: 'Safety' },
    ],
  },
  {
    id: 'tape-master',
    name: 'Tape master',
    category: 'master',
    description:
      'The mix printed to clean tape at fifteen inches a second, a touch wider, then limited.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.25, hiss: 0 } },
      { deviceId: 'stereo-widener', params: { width: 0.56 } },
      { deviceId: 'limiter-1176', preset: 'Safety' },
    ],
  },
  {
    id: 'ambient-master',
    name: 'Ambient master',
    category: 'master',
    description:
      'Made for long layered sound: what rings on is eased, swells are ridden over seconds, and a true-peak ceiling holds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
]
