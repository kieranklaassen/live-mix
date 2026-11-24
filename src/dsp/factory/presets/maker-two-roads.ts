import { type FactoryPreset } from '../types'

// Presets with the maker Two Roads in front: a held key and a melody that goes
// up one way and down another. The paces are quicker and the range is whole
// from the start, so a preview has a phrase in it.
export const TWO_ROADS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'two-roads-felt-minor',
    name: 'Felt on two roads',
    category: 'keys',
    description:
      'Hold a key and a felt piano plays melodic minor, raised going up and natural coming down, over a fifth of its own.',
    maker: {
      makerId: 'two-roads',
      preset: 'Melodic minor',
      params: { pace: 0.36, phrase: 5.5, rest: 1.2, grow: 0, drone: 0.5, seed: 37 },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, polyphony: 16, outputDb: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'two-roads-bamboo-drone',
    name: 'Bamboo over a drone',
    category: 'wind',
    description:
      'A bamboo flute walks Bhimpalasi over a plucked drone: five notes going up, seven coming down, two of them only touched.',
    maker: {
      makerId: 'two-roads',
      preset: 'Afternoon longing',
      params: { pace: 0.5, phrase: 5.5, rest: 1.5, grow: 0, drone: 0.55, seed: 38 },
      parts: {
        drone: { deviceId: 'tanpura', preset: 'Morning raga', params: { spread: 0.6, volume: -6 } },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Bamboo vibrato', params: { volume: -9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'hold',
  },
  {
    id: 'two-roads-hijaz-bow',
    name: 'Far caravan bow',
    category: 'string',
    description:
      'A bowed solo line on the Hijaz path, its sixth higher going up than coming down, over a soft reed drone.',
    maker: {
      makerId: 'two-roads',
      preset: 'Far caravan',
      params: { pace: 0.55, phrase: 5.5, rest: 1.5, grow: 0, drone: 0.4, seed: 26 },
      parts: { drone: { deviceId: 'organ', preset: 'Shruti box', params: { volume: -14 } } },
    },
    instrument: { deviceId: 'chamber-strings', preset: 'Close solo', params: { volume: -6 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.18 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } },
    ],
    preview: 'hold',
  },
  {
    id: 'two-roads-gapped-steel',
    name: 'Gapped air on steel',
    category: 'plucked',
    description:
      'A pedal steel in a five-note mode, with one more note touched coming down and a soft organ fifth under it.',
    maker: {
      makerId: 'two-roads',
      preset: 'Lament',
      params: { pace: 0.6, phrase: 5.5, rest: 1.5, zigzag: 0.4, drone: 0.35, seed: 36 },
      parts: { drone: { deviceId: 'organ', preset: 'Chapel flutes', params: { volume: -14 } } },
    },
    instrument: { deviceId: 'pedal-steel', preset: 'Soft bends', params: { volume: -8 } },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
]
