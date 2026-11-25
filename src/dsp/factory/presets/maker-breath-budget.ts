// Presets with the note maker Breath Budget (core/makers/breath-budget.ts) in
// front of an instrument: a held chord whose voices take their breaths in
// turn. Attacks and releases are short enough that a breath is a gap.

import { type FactoryPreset } from '../types'

export const BREATH_BUDGET_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'breath-budget-choir',
    name: 'Choir in turns',
    category: 'voice',
    description:
      'A held chord on an ah, every second voice a flute, each with its own lungs and never two taking a breath together.',
    maker: {
      makerId: 'breath-budget',
      preset: 'Six in a loft',
      params: { lung: 14, breath: 1.2 },
      parts: {
        second: {
          deviceId: 'flute',
          preset: 'Concert flute',
          params: { attack: 0.18, release: 0.6, volume: -16 },
        },
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { motion: 0.15, breath: 0.3, attack: 0.35, release: 0.9, tone: 5000, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'breath-budget-horns',
    name: 'Horns changing seats',
    category: 'wind',
    description:
      'A soft horn section: a player who has taken a breath comes back on the next note of the chord, so the voicing turns over.',
    maker: {
      makerId: 'breath-budget',
      preset: 'Turning voicing',
      params: { lung: 12, reach: 1, scatter: 0.9, level: 0.85 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { section: 0.35, blow: 0.45, attack: 0.2, release: 0.8, volume: -9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'breath-budget-bellows',
    name: 'Bellows and clarinets',
    category: 'organ',
    description:
      'A small flute organ that gives a note up to a clarinet at every other breath, and takes it back at the next.',
    maker: {
      makerId: 'breath-budget',
      preset: 'Catch breaths',
      params: { lung: 11, breath: 0.5, scatter: 0.9, vary: 0.3 },
      parts: {
        relief: {
          deviceId: 'clarinet',
          preset: 'Warm clarinet',
          params: { blow: 0.35, attack: 0.15, release: 0.4, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { release: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'breath-budget-overtones',
    name: 'Leaning overtones',
    category: 'drone',
    description:
      'A low fifth on overtone voices that lasts as long as it is held: the upper one leans a step of the key and comes home.',
    maker: {
      makerId: 'breath-budget',
      preset: 'Leaning notes',
      params: { breath: 0.6, level: 0.9 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { attack: 0.3, release: 0.8, volume: -11 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
]
