import { type FactoryPreset } from '../types'

export const LADDER_BASS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'rolling-sequence-bass',
    name: 'Rolling sequence bass',
    category: 'keys',
    description:
      'Short bass notes that start bright and close, with a tape echo that turns a pattern into a rolling pulse.',
    instrument: { deviceId: 'ladder-bass', preset: 'Sequence bass', params: { volume: -4 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 375, mix: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
    preview: 'line',
  },
  {
    id: 'pedal-drone-hall',
    name: 'Pedal drone',
    category: 'drone',
    description:
      'Two sawtooths beating slowly under a half-closed filter, held for as long as the key is down, in a hall.',
    instrument: { deviceId: 'ladder-bass', preset: 'Pedal drone', params: { volume: -6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'soft-sub-floor',
    name: 'Soft sub',
    category: 'drone',
    description:
      'A sub tone with almost nothing above it, warmed a little so small speakers can still find it.',
    instrument: { deviceId: 'ladder-bass', preset: 'Soft sub', params: { volume: -15 } },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
    preview: 'low',
  },
  {
    id: 'singing-ladder-lead',
    name: 'Singing lead',
    category: 'keys',
    description:
      'A round solo voice that slides between overlapping notes, with three echoes and a long plate behind it.',
    instrument: { deviceId: 'ladder-bass', preset: 'Singing lead' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'slow-opening-bass',
    name: 'Slow opener',
    category: 'drone',
    description:
      'Each note opens bright and resonant and closes over six seconds, on worn tape in a hall.',
    instrument: { deviceId: 'ladder-bass', preset: 'Slow opener', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'low',
  },
]
