import { type FactoryPreset } from '../types'

/** What Mirror on D writes: a line and its inversion, together or in turn. */
export const MAKER_MIRROR_ON_D_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'mirror-on-d-harp-and-piano',
    name: 'Harp meets its fall',
    category: 'plucked',
    description:
      'A harp going up and a felt piano coming down a moment later, each the other upside down, in one hall.',
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Both ways',
      params: { delay: 0.25, level: 0.7 },
      parts: {
        mirror: {
          deviceId: 'felt-piano',
          preset: 'Felt',
          params: { reverbMix: 0, polyphony: 16, outputDb: -14 },
        },
      },
    },
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -4.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.32 } }],
    preview: 'keys',
  },
  {
    id: 'mirror-on-d-flute-over-choir',
    name: 'Flute over its choir',
    category: 'wind',
    description:
      'A wood flute rises and a choir sings the same line falling, half a second behind it, in open space.',
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Both ways',
      params: { delay: 0.5, level: 0.8 },
      parts: {
        mirror: { deviceId: 'choir', preset: 'Slow vowels', params: { volume: -3 } },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Canyon flute', params: { volume: -9 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.38 } }],
    preview: 'line',
  },
  {
    id: 'mirror-on-d-bells-answer',
    name: 'Bells say and answer',
    category: 'bell',
    description:
      'Struck vibraphone bars where every other phrase comes back upside down; leave a rest and the next one turns.',
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Say and answer',
      params: { octave: 5, axis: 1, rest: 0.5 },
    },
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { hardness: 0.4, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.38 } },
    ],
    preview: 'bells',
  },
  {
    id: 'mirror-on-d-drone-and-voices',
    name: 'Drone and its reflection',
    category: 'drone',
    description:
      'A bowed fifth standing on its root, and a second later voices on the fifth that hangs from the same note.',
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Fold by the phrase',
      params: { fold: 2, delay: 1, level: 0.7 },
      parts: {
        mirror: { deviceId: 'choir', preset: 'Airport ah', params: { volume: -12 } },
      },
    },
    instrument: { deviceId: 'chamber-strings', preset: 'Slow dark bows', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },
]
