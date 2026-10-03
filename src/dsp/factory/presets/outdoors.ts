import { type FactoryPreset } from '../types'

export const OUTDOORS_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'garden-at-dawn',
    name: 'Garden at dawn',
    category: 'texture',
    description: 'A thrush up front and a handful of smaller birds behind it, in open air.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { attack: 1, width: 0.9, volume: -3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.22, decay: 5 } }],
  },
  {
    id: 'crickets-after-dark',
    name: 'Crickets after dark',
    category: 'texture',
    description: 'Crickets close by on a warm night, each keeping its own time, on worn tape.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { attack: 1.5, volume: -2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1, wow: 0.1 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2, highCut: 8000 } },
    ],
  },
  {
    id: 'brook-under-trees',
    name: 'Brook under trees',
    category: 'texture',
    description:
      'A small stream over stones, close enough to hear single bubbles; higher keys run brighter.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { attack: 1.5, volume: -4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 120 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25, highCut: 6000 } },
    ],
  },
  {
    id: 'storm-over-the-hills',
    name: 'Storm over the hills',
    category: 'texture',
    description:
      'Thunder from far off: the first roll comes with the key, then one about every half minute.',
    instrument: { deviceId: 'outdoors', preset: 'Far storm', params: { volume: -2 } },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, decay: 8, lowCut: 30 } },
    ],
  },
  {
    id: 'porch-chimes',
    name: 'Porch chimes',
    category: 'bell',
    preview: 'chord',
    description:
      'Wind chimes tuned to the keys you hold, struck by a light breeze, with a soft echo.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.55, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 420, mix: 0.2 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3, decay: 5 } },
    ],
  },
  {
    id: 'pond-frogs-up-close',
    name: 'Pond frogs up close',
    category: 'texture',
    description:
      'A full pond a few steps away, nearly dry: two croakers answering each other, a peeper, a triller and a deep one.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { density: 1, distance: 0.1, movement: 0, attack: 0.3, width: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Tight chamber', params: { mix: 0.15 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'bullfrog-hollow',
    name: 'Bullfrog hollow',
    category: 'texture',
    preview: 'low',
    description:
      'A full pond tuned dark: low keys bring out big, slow frogs, heard a field away in a dark hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Spring pond',
      params: { distance: 0.55, movement: 0.5, tone: 0.1, attack: 1.5, width: 0.8, volume: -3 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'peepers-past-dusk',
    name: 'Peepers past dusk',
    category: 'texture',
    description:
      'Small high frogs on the far bank calling in waves: croaks, a trill and a whistle in open air.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Spring pond',
      params: { density: 0.75, distance: 0.9, movement: 1, tone: 0.9, attack: 1, volume: 2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 6 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2, gain: 2 } },
    ],
  },
  {
    id: 'one-cricket-indoors',
    name: 'One cricket indoors',
    category: 'texture',
    description: 'A single cricket somewhere in the room, close and steady, almost in the middle.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: {
        density: 0,
        distance: 0.08,
        movement: 0,
        tone: 0.4,
        attack: 0.2,
        width: 0.4,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small box', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'cold-night-crickets',
    name: 'Cold night crickets',
    category: 'texture',
    preview: 'low',
    description:
      'Two crickets a key, tuned as low as they go, in thin open air: low keys drop them further and slow the chirps, as a cold night does.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Summer night',
      params: { density: 0.25, distance: 0.3, movement: 0.8, tone: 0, attack: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.2, decay: 6 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'weir-in-flood',
    name: 'Weir in flood',
    category: 'texture',
    description:
      'Heavy water going over a weir some way off: a steady, dulled roar with no single bubbles.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { density: 1, distance: 0.9, movement: 0.1, tone: 0, attack: 2.5, volume: -1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 6, highCut: 6000 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'trickle-in-a-cave',
    name: 'Trickle in a cave',
    category: 'texture',
    description:
      'The thinnest trickle close up, bubble by bubble, with a swarm of dark echoes from the cave behind it.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0, distance: 0.05, movement: 1, tone: 0.3, attack: 0.5, volume: 2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 150 } },
      { deviceId: 'saturator', preset: 'Init', params: { driveDb: 8, outputDb: -6 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'thunder-overhead',
    name: 'Thunder overhead',
    category: 'texture',
    description:
      'A storm right above: the crack comes with the key and the rumble after it, in a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Storm overhead',
      params: { movement: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'thunder-held-low',
    name: 'Thunder held low',
    category: 'drone',
    description:
      'Thunder smeared until each roll hangs on for seconds: a low dark drone that swells and sinks.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: {
        density: 1,
        distance: 0.45,
        movement: 0.3,
        tone: 0.8,
        release: 10,
        width: 0,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { blur: 0.92, tilt: -1.5, lowCut: 45, width: 0, mix: 0.8 },
      },
      { deviceId: 'zita-rev1', preset: 'Dark hall', params: { mix: 0.18 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming' },
    ],
  },
  {
    id: 'long-garden-tubes',
    name: 'Long garden tubes',
    category: 'bell',
    preview: 'low',
    description:
      'Big low chimes, dark and slow to die, struck one at a time by a light wind, in a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: {
        density: 0.2,
        distance: 0.3,
        movement: 0.3,
        tone: 0.15,
        release: 10,
        width: 0.2,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'chime-shower',
    name: 'Chime shower',
    category: 'bell',
    preview: 'chord',
    description:
      'Chimes struck several times a second with no gusts and the lows cut: a steady glitter on a plate.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: {
        density: 1,
        distance: 0.2,
        movement: 0.1,
        tone: 0.9,
        release: 5,
        width: 0.5,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 450, presence: 5 } },
      { deviceId: 'dattorro', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reversed-wind-chimes',
    name: 'Reversed wind chimes',
    category: 'bell',
    preview: 'chord',
    description:
      'Wind chimes heard only backwards, a second late: each ring swells up to its strike and stops.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { density: 0.5, distance: 0.25, movement: 0.5, tone: 0.6, width: 0.15, volume: -8 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { smooth: 0.3, spread: 0.15 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, breathDepth: 0 } },
    ],
  },
  {
    id: 'birdsong-on-shellac',
    name: 'Birdsong on shellac',
    category: 'texture',
    description:
      'A few garden birds on an old shellac record: narrow, nearly mono, the crackle never stopping.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.4, distance: 0.3, movement: 0.3, attack: 0.5, width: 0.3, volume: -6 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Parlour 78',
        params: { warp: 0.35, crackle: 0.5, pops: 0.15, surface: 0.5 },
      },
    ],
  },
  {
    id: 'bird-across-a-valley',
    name: 'Bird across a valley',
    category: 'texture',
    description:
      'One songbird a long way off, its phrases coming back as separate echoes from the far side.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'One blackbird',
      params: {
        distance: 0.8,
        movement: 0.4,
        tone: 0.4,
        attack: 0.3,
        release: 5,
        width: 0.35,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 700, feedback: 0.5, tone: 4000, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'night-birds-low',
    name: 'Night birds, low',
    category: 'texture',
    description:
      'A few birds tuned dark and dropped two octaves, so their songs turn to hoots in a dark hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: {
        density: 0.4,
        distance: 0.5,
        movement: 0.3,
        tone: 0,
        attack: 0.5,
        width: 0.4,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Two octaves',
        params: { levelB: 0, tone: 3000, mix: 1 },
      },
      { deviceId: 'zita-rev1', preset: 'Dark hall', params: { midDecay: 5 } },
    ],
  },
]
