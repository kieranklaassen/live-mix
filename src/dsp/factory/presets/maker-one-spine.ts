import { type FactoryPreset } from '../types'

// A chord lasts about two seconds here, so a preview goes through three of
// the eight. In a piece a longer chord length suits most of them.
export const MAKER_ONE_SPINE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'one-spine-five-players',
    name: 'One spine, five players',
    category: 'string',
    description:
      'One key plays a whole progression: string chords, a plucked bass, a harp, a bell line and a low tonic, in one hall.',
    maker: {
      makerId: 'one-spine',
      preset: 'All five',
      params: { chord: 2, common: 1 },
      parts: {
        bass: {
          deviceId: 'string-bass',
          preset: 'Quiet deep fretless',
          params: { volume: -3 },
        },
        arp: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -2 } },
        bell: {
          deviceId: 'modal-bells',
          preset: 'Vibraphone',
          params: { release: 0.4, volume: -2 },
        },
        drone: { deviceId: 'organ', preset: 'Chapel flutes', params: { volume: -14 } },
      },
    },
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.5, release: 1.6, volume: -12.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'hold',
  },
  {
    id: 'one-spine-lament-harp',
    name: 'Lament on a harp',
    category: 'plucked',
    description:
      'A harp breaks the chords of a falling lament while soft voices hold them and a bass walks down underneath.',
    maker: {
      makerId: 'one-spine',
      preset: 'Lament for strings',
      params: { role: 2, voicing: 3, steps: 6, chord: 2.2, pad: 0.5, bass: 0.7 },
      parts: {
        pad: { deviceId: 'choir', preset: 'Boys ooh', params: { attack: 0.6, volume: -11 } },
        bass: { deviceId: 'string-bass', preset: 'Let it ring', params: { volume: -6 } },
      },
    },
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { volume: -11 } },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'hold',
  },
  {
    id: 'one-spine-stair-bells',
    name: 'Bells on the stairs',
    category: 'bell',
    description:
      'A bell for every chord, over a bass that comes down the scale a step at a time on a soft piano, as long as a key is held.',
    maker: {
      makerId: 'one-spine',
      preset: 'Bell tower',
      params: { chord: 1.4, bass: 0.6, drone: 0, pad: 0.35, voicing: 4 },
      parts: {
        bass: {
          deviceId: 'felt-piano',
          preset: 'Felt',
          params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -15 },
        },
        pad: {
          deviceId: 'felt-piano',
          preset: 'Felt',
          params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { release: 0.6, volume: -8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } }],
    preview: 'hold',
  },
  {
    id: 'one-spine-tidal-pad',
    name: 'Two chords like a tide',
    category: 'pad',
    description:
      'A string machine that rocks between two open ninth chords and ties over what they share, the tonic always under it.',
    maker: {
      makerId: 'one-spine',
      preset: 'Tides',
      params: { chord: 2.4 },
    },
    instrument: {
      deviceId: 'string-machine',
      params: { volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
    preview: 'hold',
  },
]
