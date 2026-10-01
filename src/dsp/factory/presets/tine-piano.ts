import { type FactoryPreset } from '../types'

export const TINE_PIANO_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'suitcase-phaser',
    name: 'Suitcase phaser',
    category: 'keys',
    description:
      'The soft electric piano with its tremolo on, through a slow phaser in a small room.',
    instrument: { deviceId: 'tine-piano', preset: 'Soft suitcase', params: { volume: -11.5 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'tine-tape-echo',
    name: 'Tines and tape echo',
    category: 'keys',
    description: 'Dark, round tines with three tape heads repeating behind them and a plate.',
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -11 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.65, mix: 0.4 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bell-tine-chorus',
    name: 'Bell tine chorus',
    category: 'keys',
    description: 'All bell and little bark: a glassy electric piano in a slow chorus and a hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, hardness: 0.95, tone: 0.9 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'night-tines',
    name: 'Night tines',
    category: 'keys',
    description: 'Long tines that drift from side to side and dissolve into a very large space.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0.6, tremoloRate: 0.45, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, width: 0.75 } },
    ],
  },
  {
    id: 'rotary-stage-piano',
    name: 'Rotary stage piano',
    category: 'keys',
    description:
      'A stage piano that barks when played hard, through a slowly turning speaker and a spring.',
    instrument: { deviceId: 'tine-piano', preset: 'Barking stage', params: { volume: -13 } },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { hornDepth: 0.8, drive: 0.5, balance: 0.6, spread: 1 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
]
