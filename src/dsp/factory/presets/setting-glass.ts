import { type FactoryPreset } from '../types'

// Setting Glass clears while a key is held, so most previews hold a chord and
// let it go: what a preset decides first is how hot the glass is when the key
// goes down and how soon it sets. The pitches of a note do not move as it
// sets, and the effects after it add none of their own.

export const SETTING_GLASS_PRESETS: readonly FactoryPreset[] = [
  // Crystal dawn: slow cooling, octaves and twelfths, a long ring.
  {
    id: 'setting-glass-dawn-long-nave',
    name: 'Crystal before sunrise',
    category: 'pad',
    description:
      'Crystal that takes six seconds to clear from its top tone down, every tone left ringing in a vast nave.',
    instrument: { deviceId: 'setting-glass', preset: 'Crystal dawn' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'setting-glass-dawn-low-fifth',
    name: 'First light on crystal',
    category: 'drone',
    description:
      'A low fifth of molten crystal under a strong breath, still half soft after five seconds, in an open valley.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Crystal dawn',
      params: { cooling: 11, breath: 0.8, bright: 0.34, blows: 0, ring: 22, edge: 0.7, volume: 3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  // Quenched keys: set almost at once, and cracked by water as they are let go.
  {
    id: 'setting-glass-quench-small-plate',
    name: 'Keys put out in water',
    category: 'keys',
    description:
      'Short keys tapped on glass that sets in half a second, each flashed and cracked by water as it is let go.',
    instrument: { deviceId: 'setting-glass', preset: 'Quenched keys', params: { volume: 0 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } }],
    preview: 'keys',
  },
  {
    id: 'setting-glass-quench-dotted-steam',
    name: 'Steam between the keys',
    category: 'keys',
    description:
      'Crystal keys under an iron rod, quenched to a crackle that a dotted tape echo throws back.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Quenched keys',
      params: {
        strike: 1,
        matter: 1,
        ring: 1.6,
        heat: 0.6,
        cooling: 0.8,
        tail: 2.2,
        bright: 0.45,
        ticks: 0.5,
        breath: 0.25,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  // Molten bass: kept too warm to clear, so only what is over it rings.
  {
    id: 'setting-glass-bass-warm-chamber',
    name: 'Glass that never sets',
    category: 'bass',
    description:
      'A dark bass of drops into glass kept warm, blurred by a wide border, close up in a tight chamber.',
    instrument: { deviceId: 'setting-glass', preset: 'Molten bass', params: { volume: -2.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } }],
    preview: 'bass',
  },
  {
    id: 'setting-glass-bass-bronze-poured',
    name: 'Poured bronze floor',
    category: 'bass',
    description:
      'Bronze tapped by a palm, its hum an octave below each note and its ring cut short, pressed on tape.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Molten bass',
      params: {
        matter: 5,
        strike: 2,
        heat: 0.3,
        rest: 0.1,
        cooling: 1,
        ring: 3,
        breath: 0.1,
        blows: 0,
        bright: 0.3,
        edge: 0.3,
        tail: 0.6,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
    ],
    preview: 'bass',
  },
  // Salt drone: odd tones, full of breath, with grains in them.
  {
    id: 'setting-glass-salt-dark-cave',
    name: 'Salt under the lamp',
    category: 'drone',
    description:
      'Salt blown hard so its hollow odd tones never stop, heated again every two seconds in a dark cave.',
    instrument: { deviceId: 'setting-glass', preset: 'Salt drone', params: { volume: -8.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
    preview: 'low',
  },
  {
    id: 'setting-glass-salt-grains-mist',
    name: 'Salt pans at evening',
    category: 'drone',
    description:
      'A slowly cooling low fifth of salt, ticking all over as it shrinks, its breath smoothed into a hanging mist.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Salt drone',
      params: {
        heat: 0.95,
        cooling: 9,
        remelt: 0,
        ticks: 0.9,
        breath: 0.7,
        edge: 0.15,
        bright: 0.5,
        ring: 12,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  // Shattered bells: pieces that set too soon, out of true.
  {
    id: 'setting-glass-shatter-bronze-hall',
    name: 'Bell that set too soon',
    category: 'bell',
    description:
      'Bronze under an iron rod, its tones scattered and some of them missing, ringing for ten seconds in a hall.',
    instrument: { deviceId: 'setting-glass', preset: 'Shattered bells', params: { volume: 3.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
    preview: 'bells',
  },
  {
    id: 'setting-glass-shatter-waiting-glints',
    name: 'Shards that wait',
    category: 'bell',
    description:
      'Stretched glass struck only once it has set, about a second after the key, each piece a little off and glinting.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Waiting chimes',
      params: { order: 0.45, stretch: 0.6, cooling: 1, heat: 0.75, ticks: 0.8, matter: 0 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
    preview: 'chord',
  },
  // Pouring: a stream of small hot drops.
  {
    id: 'setting-glass-pour-open-space',
    name: 'Two seconds of pouring',
    category: 'texture',
    description:
      'A stream of small hot drops poured over every note and again every two seconds, in a wide open space.',
    instrument: { deviceId: 'setting-glass', preset: 'Pouring texture' },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  {
    id: 'setting-glass-pour-sugar-springs',
    name: 'Syrup over cold tin',
    category: 'texture',
    description:
      'Hot sugar poured thin and bright, crackling as it shrinks, thrown into a tank of two springs.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Pouring texture',
      params: {
        matter: 3,
        turn: 0.8,
        bright: 0.5,
        ticks: 1,
        ring: 18,
        breath: 0.15,
        cooling: 1.4,
        edge: 0.2,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  // Remelting swells: back to the fire and out again.
  {
    id: 'setting-glass-swells-back-to-fire',
    name: 'In and out of the fire',
    category: 'pad',
    description:
      'Glass that goes back to the fire every second and a half: the chord dissolves from below and clears again.',
    instrument: { deviceId: 'setting-glass', preset: 'Remelting swells' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
    preview: 'chord',
  },
  {
    id: 'setting-glass-swells-slow-tide',
    name: 'The slow furnace door',
    category: 'pad',
    description:
      'Crystal heated through every three and a half seconds, its upper tones first to come back, on a long plate.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Remelting swells',
      params: {
        matter: 1,
        every: 3.5,
        cooling: 2,
        strike: 0,
        ring: 10,
        tail: 6,
        bright: 0.3,
        release: 1,
        width: 0.6,
        edge: 0.35,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  // Sugar plucks: brittle and soon over.
  {
    id: 'setting-glass-sugar-booth',
    name: 'Sugar snapped in half',
    category: 'plucked',
    description:
      'Brittle plucks of barely warm sugar, every overtone there and gone in about a second, in a small booth.',
    instrument: { deviceId: 'setting-glass', preset: 'Sugar plucks', params: { volume: 0 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } }],
    preview: 'keys',
  },
  {
    id: 'setting-glass-sugar-drops-echo',
    name: 'Sugar on the windowsill',
    category: 'plucked',
    description:
      'Warm drops of sugar stretched wide and dull at first, each with one clean echo a third of a second late.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Sugar plucks',
      params: {
        strike: 0,
        heat: 0.55,
        cooling: 0.9,
        stretch: 0.5,
        ring: 26,
        ticks: 0.8,
        bright: 0.5,
        blows: 0,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 333, feedback: 0, mix: 0.3 },
      },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  // Obsidian voices: a wide border, tones grouped as in a mouth.
  {
    id: 'setting-glass-obsidian-chapel',
    name: 'Voices in black stone',
    category: 'voice',
    description:
      'Obsidian poured and blown with a wide border, so its tones come up together like an open mouth, in a hall.',
    instrument: { deviceId: 'setting-glass', preset: 'Obsidian voices' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'setting-glass-obsidian-low-line',
    name: 'One voice of obsidian',
    category: 'voice',
    description:
      'A single line rubbed into being in obsidian, warmed by each drop, its vowel bright, across the room.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Obsidian voices',
      params: {
        strike: 0,
        blows: 0.2,
        turn: 0.5,
        edge: 0.55,
        bright: 0.78,
        breath: 1,
        cooling: 1.4,
        remelt: 0,
        tail: 3,
        volume: 2.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  // Frozen pad: cold from the first moment.
  {
    id: 'setting-glass-frozen-cold-hall',
    name: 'Glass already cold',
    category: 'pad',
    description:
      'Glass with no heat in it at all, poured on from above and ringing for eighteen seconds in an airy tail.',
    instrument: { deviceId: 'setting-glass', preset: 'Frozen pad' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'setting-glass-frozen-bronze-shared',
    name: 'Chord of cold bronze',
    category: 'pad',
    description:
      'Cold bronze tapped again and again, each blow on one key shaking all the others, behind a thin veil.',
    instrument: {
      deviceId: 'setting-glass',
      preset: 'Frozen pad',
      params: {
        matter: 5,
        strike: 2,
        blows: 0.7,
        turn: 1.1,
        neighbours: 1,
        breath: 0.35,
        ring: 12,
        order: 0.95,
        bright: 0.45,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
]
