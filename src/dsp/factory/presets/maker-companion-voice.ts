import { type FactoryPreset } from '../types'

// Lines with a second voice beside them, written by the note maker.
export const COMPANION_VOICE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'companion-voice-flute-bell',
    name: 'Flute and late bell',
    category: 'wind',
    description:
      'A concert flute whose every note is answered half a second on by the next note of one triad, struck on a soft bar.',
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { tonic: 2, delay: 0.5, ring: 2.5, level: 0.55 },
      parts: {
        companion: { deviceId: 'modal-bells', preset: 'Vibraphone', params: { volume: 0 } },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Concert flute', params: { volume: -9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'companion-voice-three-singers',
    name: 'Voice, reed and bows',
    category: 'voice',
    description:
      'A solo voice with a reed a fourth under it and bows a sixth under it; on a held note the bows sink to the octave.',
    maker: {
      makerId: 'companion-voice',
      preset: 'Sung in three',
      params: { opens: 1, ring: 0.15 },
      parts: {
        companion: { deviceId: 'chamber-strings', preset: 'Viol consort' },
        third: { deviceId: 'clarinet', preset: 'Warm clarinet' },
      },
    },
    instrument: { deviceId: 'choir', preset: 'Soloist', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'companion-voice-harp-sixths',
    name: 'Harp in late sixths',
    category: 'plucked',
    description:
      'A concert harp where each string is followed, three quarters of a second later, by the sixth over it if that one is free, softer.',
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { side: 1, follow: 0, delay: 0.75, level: 0.5, ring: 0.8, cadence: 0 },
    },
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -4 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'companion-voice-glass-hands',
    name: 'Glass and felt by turns',
    category: 'bell',
    description:
      'Tapped glass with a felt piano beside it, under one note and over the next, on the three notes of A minor alone.',
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { delay: 0.35, ring: 1.6, level: 0.8 },
      parts: { companion: { deviceId: 'felt-piano', preset: 'Felt', params: { outputDb: -15 } } },
    },
    instrument: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -9 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'bells',
  },
]
