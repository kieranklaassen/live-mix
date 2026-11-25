import { type FactoryPreset } from '../types'

export const MAKER_SIX_VOICES_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'six-voices-winds',
    name: 'A flute and five winds',
    category: 'wind',
    description:
      'A flute line with its mirror on a clarinet, the notes between on reeds and a soft horn held at the centre.',
    maker: {
      makerId: 'six-voices',
      preset: 'All six',
      params: {
        mirror: 0.8,
        middle: 0.55,
        mirrorMiddle: 0.5,
        octaflip: 0.45,
        centreLevel: 0.5,
        fall: 0.5,
        delay: 0.1,
        order: 2,
        hold: 0.5,
        human: 0.3,
      },
      parts: {
        mirror: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -10.5 } },
        middle: { deviceId: 'flute', preset: 'Canyon flute', params: { volume: -16.5 } },
        'mirror-middle': {
          deviceId: 'clarinet',
          preset: 'Hollow section',
          params: { volume: -16.5 },
        },
        octaflip: { deviceId: 'clarinet', preset: 'Bass clarinet', params: { volume: -12.5 } },
        centre: { deviceId: 'horns', preset: 'Flugel breath', params: { volume: -16.5 } },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Concert flute', params: { volume: -9.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'line',
  },
  {
    id: 'six-voices-string-canon',
    name: 'Four bows in canon',
    category: 'string',
    description:
      'One bowed line, its mirror half a second behind it, then the two notes between them, in a wide hall.',
    maker: {
      makerId: 'six-voices',
      preset: 'Four in canon',
      params: { human: 0.15 },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.35, release: 1.4, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'six-voices-piano-bells',
    name: 'Felt piano, four bells',
    category: 'keys',
    description:
      'A felt piano note and the bells made from it, coming out from the middle one after another.',
    maker: {
      makerId: 'six-voices',
      preset: 'Out from the middle',
      params: { delay: 0.24, centre: 8, line: 1, octaflip: 0.55, mirror: 0.6, human: 0.4 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -5 } },
        middle: { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -6 } },
        'mirror-middle': { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -6 } },
        centre: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -6 } },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { reverbMix: 0, polyphony: 16, outputDb: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'bells',
  },
  {
    id: 'six-voices-choir-walk',
    name: 'Choir round a walk',
    category: 'voice',
    description:
      'Voices that stay in the key and move by themselves under a held note, as the note they turn round walks.',
    maker: {
      makerId: 'six-voices',
      preset: 'Slow hills',
      params: {
        walkTime: 1.5,
        hold: 0.8,
        octaflip: 0.4,
        centreLevel: 0.55,
        mirror: 0.75,
        fall: 0.5,
      },
    },
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.5, release: 1.8, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: 'hold',
  },
]
