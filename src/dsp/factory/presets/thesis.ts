import { type FactoryPreset } from '../types'

export const THESIS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'whistling-voices',
    name: 'Whistling voices',
    category: 'voice',
    description:
      'Three narrow bands of noise from one key, swelling in turn like distant whistlers.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 71, attack: 0.7, release: 2.5 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 14, outputGain: -3.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'soft-air-chords',
    name: 'Soft air chords',
    category: 'pad',
    description:
      'All six bands at a low resonance, so one key gives a soft breathy chord from the scale.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { center: 67, resonance: 14, width: 85, attack: 2, release: 4, strum: 0, mode: 1 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 8 } },
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'drifting-minor-bands',
    name: 'Drifting minor bands',
    category: 'pad',
    description:
      'A minor triad of noise whose pitches wander slightly, through tape and a long space.',
    instrument: { deviceId: 'thesis', preset: 'Drifting Minor', params: { center: 59 } },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 7 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'low-wind-fifths',
    name: 'Low wind fifths',
    category: 'pad',
    description:
      'Broad dark bands that mirror low notes far above themselves, like wind across a pipe.',
    instrument: { deviceId: 'thesis', preset: 'Dark Phrygian', params: { attack: 3 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } }],
    preview: 'low',
  },
  {
    id: 'mirror-line-echo',
    name: 'Mirror line echo',
    category: 'voice',
    description: 'Each note of a melody with its mirror moving the other way, on a tape echo.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { center: 60, attack: 0.12, release: 1.5 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 7 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
]
