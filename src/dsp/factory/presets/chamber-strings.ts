import { type FactoryPreset } from '../types'

export const CHAMBER_STRINGS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'chamber-strings-hall',
    name: 'Strings in a hall',
    category: 'string',
    description:
      'A small section as it comes, four players on every note, heard from a few rows back.',
    instrument: { deviceId: 'chamber-strings', preset: 'Chamber section' },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall' }],
    preview: 'chord',
  },
  {
    id: 'muted-tape-swell',
    name: 'Muted tape swell',
    category: 'string',
    description:
      'Muted strings without vibrato that take seconds to arrive, on tape, in a very large room.',
    instrument: { deviceId: 'chamber-strings', preset: 'Muted swell' },
    effects: [
      { deviceId: 'tape', preset: 'Studio master' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
    preview: 'chord',
  },
  {
    id: 'whisper-bow-halo',
    name: 'Whisper bow halo',
    category: 'string',
    description:
      'Light bows over the fingerboard, more air than tone, with a reverb that climbs an octave.',
    instrument: { deviceId: 'chamber-strings', preset: 'Whisper bows' },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'low-dark-strings',
    name: 'Low dark strings',
    category: 'string',
    description:
      'Five players a note with slow bows and wide tuning, a long way down a stone nave.',
    instrument: { deviceId: 'chamber-strings', preset: 'Slow dark bows' },
    effects: [{ deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.4 } }],
    preview: 'chord',
  },
  {
    id: 'close-solo-strings',
    name: 'Close solo strings',
    category: 'string',
    description:
      'One player on each note, close and quick, with vibrato and bow changes, in a small room.',
    instrument: { deviceId: 'chamber-strings', preset: 'Close solo', params: { width: 0.7 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'chord',
  },
]
