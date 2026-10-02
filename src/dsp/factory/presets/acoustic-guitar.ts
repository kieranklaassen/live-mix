import { type FactoryPreset } from '../types'

export const ACOUSTIC_GUITAR_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'steel-fingerstyle-room',
    name: 'Steel fingerstyle room',
    category: 'plucked',
    description: 'A steel-string guitar picked with the fingers, close, in a small wooden room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { volume: -4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'nylon-at-dusk',
    name: 'Nylon at dusk',
    category: 'plucked',
    description:
      'A few round nylon notes played with the pad of the finger, on worn tape, left in a very large space.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Nylon dusk', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'twelve-string-hall',
    name: 'Twelve string hall',
    category: 'plucked',
    description:
      'Twelve strings in octave and unison pairs, strummed with a pick and heard in a hall.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Twelve string', params: { volume: -5 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.4 } }],
    preview: 'keys',
  },
  {
    id: 'open-strings-ringing',
    name: 'Open strings ringing',
    category: 'plucked',
    description:
      'Steel strings left to ring into each other, with tuned strings that answer and a quiet room behind.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Let ring', params: { volume: -6 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long resonance', params: { mix: 0.3 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'muted-acoustic-echo',
    name: 'Muted acoustic echo',
    category: 'plucked',
    description:
      'Short muted plucks near the bridge that a three-head tape echo turns into a pattern, with a spring behind.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Muted pattern', params: { volume: 0 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 375, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
]
