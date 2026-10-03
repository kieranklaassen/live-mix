import { type FactoryPreset } from '../types'

// `string` until the bank has a `plucked` category; these belong there.
export const HARP_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'concert-harp-hall',
    name: 'Concert harp',
    category: 'plucked',
    description: 'A pedal harp plucked near the middle of its strings, ringing on in a hall.',
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -4 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'harp-glissando-plate',
    name: 'Harp glissando',
    category: 'plucked',
    description:
      'Notes played together are rolled from the lowest to the highest, over a long plate.',
    instrument: { deviceId: 'harp', preset: 'Glissando', params: { volume: -3 } },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'harp-glass-halo',
    name: 'Harp with a halo',
    category: 'plucked',
    description:
      'Soft, long strings that ring into each other, with an octave of reverb opening above them.',
    instrument: { deviceId: 'harp', preset: 'Long glass ring' },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } }],
    preview: 'keys',
  },
  {
    id: 'koto-rising-echo',
    name: 'Rising koto',
    category: 'plucked',
    description:
      'A hard pick near the bridge and every note pressed a semitone sharp after it sounds, with a quiet tape echo in a room.',
    instrument: { deviceId: 'harp', preset: 'Rising koto', params: { volume: 0 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'guzheng-cascade-space',
    name: 'Guzheng cascade',
    category: 'plucked',
    description: 'Bright steel strings rolled into one another, left in a very large space.',
    instrument: { deviceId: 'harp', preset: 'Guzheng cascade', params: { volume: 1 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'small-harp-room',
    name: 'Small harp, room',
    category: 'plucked',
    description:
      'A small harp plucked firmly, with a short ring and a full wooden body, close by in a room.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.3, touch: 0.55, decay: 0.75, halo: 0.35, body: 0.8, volume: -4 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'wire-strung-harp',
    name: 'Wire strung harp',
    category: 'plucked',
    description:
      'Steel strings plucked softly toward the middle and left to ring into each other, in a bright reverb.',
    instrument: {
      deviceId: 'harp',
      params: {
        strings: 2,
        pluck: 0.32,
        touch: 0.25,
        decay: 1.6,
        halo: 0.85,
        body: 0.35,
        volume: -1.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } }],
  },
  {
    id: 'bent-guzheng',
    name: 'Bent guzheng',
    category: 'plucked',
    description:
      'A guzheng whose every note is pressed a quarter tone sharp after the pick, in a small plate.',
    instrument: {
      deviceId: 'harp',
      params: {
        strings: 2,
        pluck: 0.11,
        touch: 0.7,
        decay: 1.6,
        halo: 0.4,
        bend: 50,
        body: 0.7,
        volume: 3.5,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate' }],
  },
  {
    id: 'harp-under-wool',
    name: 'Harp under wool',
    category: 'plucked',
    description:
      'A harp touched with the soft of the finger at mid string, dulled on cassette in a small dark room.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.5, touch: 0, decay: 1.1, halo: 0.2, body: 1, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { damping: 2000, mix: 0.2 } },
    ],
  },
  {
    id: 'fingernail-harp',
    name: 'Fingernail harp',
    category: 'plucked',
    description:
      'Bare harp strings plucked with the nails right by the soundboard, thin and bright, in a long bright plate.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.04, touch: 1, decay: 2, halo: 0.9, body: 0, volume: 4 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Bright plate', params: { decay: 0.8, mix: 0.3 } }],
  },
  {
    id: 'harp-raindrops',
    name: 'Harp raindrops',
    category: 'plucked',
    description:
      'Very short damped harp notes, each one scattered into a patter of separate echoes.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.22, decay: 0.4, damp: 1, halo: 0, body: 1, volume: 4 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Pattering',
        params: { length: 0.45, feedback: 0.55, width: 0.4, mix: 0.65 },
      },
    ],
    preview: 'bells',
  },
  {
    id: 'far-off-koto',
    name: 'Far off koto',
    category: 'plucked',
    description:
      'A koto picked toward the middle and left to ring, heard from far off down a dark hall.',
    instrument: {
      deviceId: 'harp',
      params: {
        strings: 1,
        pluck: 0.25,
        touch: 0.5,
        decay: 2.5,
        halo: 0.6,
        body: 0.5,
        volume: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Plain hall',
        params: { decay: 4.5, highCut: 3000, mix: 0.75 },
      },
    ],
  },
  {
    id: 'turning-harp',
    name: 'Turning harp',
    category: 'plucked',
    description: 'A long ringing harp played through a slowly turning rotary speaker, in a hall.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.2, touch: 0.6, decay: 2.2, halo: 0.7, body: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
  },
  {
    id: 'raked-koto',
    name: 'Raked koto',
    category: 'plucked',
    description:
      'Notes played together are raked up the koto with a pick near the bridge, repeated by two tape heads in a room.',
    instrument: {
      deviceId: 'harp',
      params: {
        strings: 1,
        pluck: 0.1,
        touch: 0.6,
        decay: 1.5,
        sweep: 0.25,
        body: 1,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { feedback: 0.6, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'shellac-harp',
    name: 'Shellac harp',
    category: 'plucked',
    description:
      'A parlour harp in a room, played back from a shellac record: narrow, nearly mono, with crackle.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.28, touch: 0.6, decay: 0.9, body: 0.7, volume: -2.5 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Room' },
      { deviceId: 'vinyl', preset: 'Parlour 78' },
    ],
  },
  {
    id: 'harp-with-paper',
    name: 'Harp with paper',
    category: 'plucked',
    description:
      'Hard plucks by the soundboard, driven until they buzz like paper threaded through the strings.',
    instrument: {
      deviceId: 'harp',
      params: {
        pluck: 0.07,
        touch: 0.9,
        decay: 0.5,
        damp: 0.3,
        halo: 0.1,
        body: 0.25,
        volume: 1.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Torn cone',
        params: { tone: 0.3, highCut: 9000, output: -2, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'harp-sung-tail',
    name: 'Harp, sung tail',
    category: 'plucked',
    description:
      'Clear harp notes plucked low on the string, each answered by a reverb that sings an ah behind it.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.15, touch: 0.6, decay: 1.2, halo: 0.4, volume: 0 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { resonance: 0.85, voice: 0.6, decay: 8, mix: 0.6 },
      },
    ],
  },
  {
    id: 'harp-harmonics',
    name: 'Harp harmonics',
    category: 'plucked',
    description:
      'Soft plucks at the middle of bare strings, sounding mostly an octave up as harmonics do, in a bright chamber.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.5, touch: 0.1, decay: 1.3, body: 0.05, volume: -1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { dry: 0.3, spread: 0.1 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
    preview: 'bells',
  },
  {
    id: 'bass-koto',
    name: 'Bass koto',
    category: 'plucked',
    description:
      'Low koto strings under a hard pick, thickened by a driven transformer and kept in the centre, in a hall that holds on to the lows.',
    instrument: {
      deviceId: 'harp',
      params: { strings: 1, pluck: 0.2, touch: 0.9, decay: 3, body: 1, volume: -4.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
      { deviceId: 'zita-rev1', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'guzheng-twang',
    name: 'Guzheng twang',
    category: 'plucked',
    description:
      'A guzheng picked hard at the bridge with a small upward twang, splashing in a two spring tank.',
    instrument: {
      deviceId: 'harp',
      params: {
        strings: 2,
        pluck: 0.06,
        touch: 0.85,
        decay: 0.7,
        halo: 0.3,
        bend: 25,
        body: 0.8,
        volume: 3,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { width: 0.6 } }],
  },
]
