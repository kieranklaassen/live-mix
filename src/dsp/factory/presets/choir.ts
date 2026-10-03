import { type FactoryPreset } from '../types'

export const CHOIR_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'worn-tape-choir',
    name: 'Worn tape choir',
    category: 'voice',
    description: 'An open ah that speaks quickly, played back from a cassette with wow and hiss.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        motion: 0.15,
        vibrato: 14,
        attack: 0.25,
        release: 1.6,
        tone: 4200,
        width: 0.6,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'low-monks-cathedral',
    name: 'Monks in a cathedral',
    category: 'voice',
    description: 'Bass voices on a closed oh without vibrato, a long way down a stone nave.',
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { volume: -8 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'boys-ooh-halo',
    name: 'Treble ooh halo',
    category: 'voice',
    description: 'Small high voices singing ooh, with a reverb that climbs an octave above them.',
    instrument: { deviceId: 'choir', preset: 'Boys ooh' },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.35 } }],
  },
  {
    id: 'slow-vowel-choir',
    name: 'Slow vowel choir',
    category: 'voice',
    description:
      'A large section that drifts from vowel to vowel and takes three seconds to enter.',
    instrument: { deviceId: 'choir', preset: 'Slow vowels', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'breath-voices',
    name: 'Breath voices',
    category: 'voice',
    description:
      'More air than tone: a whispered chord for the top of a mix, in a very large room.',
    instrument: { deviceId: 'choir', preset: 'Breath', params: { width: 0.8, volume: -14 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
  },
]
