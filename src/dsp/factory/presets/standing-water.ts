import { type FactoryPreset } from '../types'

// Standing Water rises from a splash: what a preset decides first is how much
// of the key is the splash and how much the figure that grows behind it. All
// that is in a note is a multiple of it, or of half of it with Below, so an
// effect that adds pitches of its own is left out.

export const STANDING_WATER_PRESETS: readonly FactoryPreset[] = [
  // Pool pads: hexagons in the light on the floor.
  {
    id: 'standing-water-tiled-pool',
    name: 'Tiled pool at dusk',
    category: 'pad',
    description:
      'A chord splashes into a round pool and swells as hexagons of light on the tiles, in a warm hall.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Pool pad',
      params: { splash: 0.3, lag: 1.2, calm: 4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'standing-water-sea-in-hexagons',
    name: 'Hexagons out at sea',
    category: 'pad',
    description:
      'Deep hexagons on the open sea, so every wave travels on and the light surges slowly, wide, with a cloud behind it.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Pool pad',
      params: {
        pool: 2,
        depth: 0.6,
        layers: 0.5,
        lag: 2.2,
        splash: 0.12,
        stray: 0.6,
        calm: 6,
        width: 0.85,
        volume: -5.0,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.35 } },
    ],
  },
  // Late basses: half the pitch wakes behind the note.
  {
    id: 'standing-water-late-cellar',
    name: 'Late bass in a cellar',
    category: 'bass',
    description:
      'A dull drop first, then the bass, and a moment behind it the octave under it, round and narrow in a small room.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Late bass',
      params: { lag: 0.5, calm: 0.5, volume: 0.0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } }],
    preview: 'bass',
  },
  {
    id: 'standing-water-slope-sub',
    name: 'Leaning bass, dubbed',
    category: 'bass',
    description:
      'Slopes of thick water folded into a softly buzzing bass with half its pitch under it, and dub echoes trailing off.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Late bass',
      params: {
        reading: 1,
        depth: 0.3,
        lag: 0.15,
        circle: 0.6,
        splash: 0.6,
        stone: 0.5,
        calm: 0.35,
        thickness: 0.5,
        below: 0.6,
        foam: 0.1,
        volume: -3.0,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { mix: 0.22 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: 'bass',
  },
  // Ripple keys: no threshold, so every touch answers at once.
  {
    id: 'standing-water-ripple-rail',
    name: 'Ripples on a rail',
    category: 'keys',
    description:
      'Keys of thin eightfold ripples that answer at once, soft or hard, with a short bright plate round them.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Ripple keys',
      params: {
        pattern: 3,
        circle: 0.12,
        depth: 0.3,
        calm: 1.2,
        splash: 0.6,
        layers: 0.3,
        volume: 0.0,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } }],
    preview: 'keys',
  },
  {
    id: 'standing-water-ripple-low-light',
    name: 'Low light ripples',
    category: 'keys',
    description:
      'Square ripples read as height, mellow, quick to speak and soon still, on a cassette in a room.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Ripple keys',
      params: {
        pattern: 1,
        reading: 0,
        circle: 0.45,
        depth: 0.6,
        splash: 0.45,
        stone: 0.15,
        thickness: 0.3,
        calm: 0.6,
        drift: 0.2,
        foam: 0.08,
        width: 0.4,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  // Stripe flutes: one wave, a small circle, and air on it.
  {
    id: 'standing-water-stripe-flute-nave',
    name: 'Stripe flute, stone nave',
    category: 'wind',
    description:
      'One wave read along a small circle, breath on every note, close up with a cathedral behind it.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Stripe flute',
      params: { foam: 0.5, width: 0.3, volume: 1.0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
    preview: 'line',
  },
  {
    id: 'standing-water-stripe-bottle-quartet',
    name: 'Quartet of bottles',
    category: 'wind',
    description:
      'Hollow stripes in thick water, low on breath and quick to speak, as four blown bottles in a wooden room.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Stripe flute',
      params: {
        reading: 1,
        depth: 0.02,
        circle: 0.3,
        foam: 0.35,
        thickness: 0.75,
        splash: 0.22,
        stone: 0.1,
        lag: 0.25,
        calm: 0.35,
        drift: 0.4,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  // Mercury bells: under the threshold, only the splash and what it wakes.
  {
    id: 'standing-water-mercury-bright-air',
    name: 'Mercury in bright air',
    category: 'bell',
    description:
      'Pins dropped on thin bright water, each a small bright bell with beads that fall back, in bright air.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Mercury bells',
      params: { splash: 0.8, calm: 5, volume: 4.0 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } }],
    preview: 'bells',
  },
  {
    id: 'standing-water-mercury-slow-gong',
    name: 'Mercury gong, long dark',
    category: 'bell',
    description:
      'A heavier stone on hexagons of mercury with half the pitch under it, long and low, in a dark hall.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Mercury bells',
      params: {
        pattern: 2,
        stone: 0.75,
        circle: 0.6,
        below: 0.7,
        threshold: 0.25,
        shake: 0.34,
        lag: 0.4,
        depth: 0.6,
        calm: 9,
        layers: 0.6,
        volume: -3.0,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
    preview: 'low',
  },
  // Oil drones: thick water, slow to rise.
  {
    id: 'standing-water-oil-low-tide',
    name: 'Oil at low tide',
    category: 'drone',
    description:
      'A low fifth in oil: slow round hexagons rise over four seconds with their octave below, through a dark bank of fog.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Oil drone',
      params: { circle: 0.5, volume: -1.5 },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
    preview: 'low',
  },
  {
    id: 'standing-water-oil-burning-slick',
    name: 'Burning slick',
    category: 'drone',
    description:
      'Oil read by its slope and bent far past the edge, a grinding low drone in a long channel under a low cathedral.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Oil drone',
      params: {
        reading: 1,
        pool: 1,
        depth: 0.75,
        circle: 0.9,
        thickness: 0.6,
        lag: 2,
        foam: 0.35,
        unrest: 0.8,
        drift: 0.15,
        width: 0.8,
        volume: -1.0,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
    preview: 'low',
  },
  // Eightfold shimmers: three octaves up, and quick.
  {
    id: 'standing-water-eightfold-rain-glass',
    name: 'Eightfold behind glass',
    category: 'pad',
    description:
      'Eight waves crossing at once, a fine quick glitter three octaves over a soft chord, behind wet glass.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Eightfold shimmer',
      params: { drift: 1.4, circle: 0.25, depth: 0.25, thickness: 0.3, calm: 4, volume: -2.0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Behind glass' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'standing-water-eightfold-ice-choir',
    name: 'Choir under thin ice',
    category: 'texture',
    description:
      'Eightfold slopes flickering five times a second over a long pool, with backward echoes rising out of them.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Eightfold shimmer',
      params: {
        reading: 1,
        pool: 1,
        drift: 5,
        circle: 0.5,
        depth: 0.12,
        lag: 2.5,
        layers: 0.2,
        foam: 0.2,
        width: 0.8,
        volume: 3.5,
      },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
  // Quarrelling swells: six free waves that take turns.
  {
    id: 'standing-water-quarrel-tide-hall',
    name: 'Six waves, one hall',
    category: 'pad',
    description:
      'Six waves that chase each other and never settle, each chord hollow and full in turn, in a large hall.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Quarrelling swells',
      params: { lag: 1.2, drift: 0.35, volume: -3.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'standing-water-quarrel-storm-drum',
    name: 'Quarrel in a cistern',
    category: 'texture',
    description:
      'Free waves at full shake with a boulder thrown in, foam and half the pitch beneath, inside a stone cistern.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Quarrelling swells',
      params: {
        reading: 2,
        shake: 1,
        unrest: 1,
        splash: 0.8,
        stone: 1,
        foam: 0.7,
        below: 0.6,
        lag: 0.3,
        drift: 1.8,
        depth: 0.7,
        volume: -1.0,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },
  // Pin plucks: a pin, a ring and no swell.
  {
    id: 'standing-water-pin-two-springs',
    name: 'Pins and two springs',
    category: 'plucked',
    description:
      'A pin for every key, high and short with a quick ring after it, in a tank of two springs.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Pin pluck',
      params: { splash: 0.9, calm: 0.35, volume: 0.0 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank' }],
    preview: 'keys',
  },
  {
    id: 'standing-water-pin-dotted-wood',
    name: 'Pebble strings, dotted',
    category: 'plucked',
    description:
      'Pebbles in thick water, plucked like gut: a drop and a short round tone, with dotted echoes on tape.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Pin pluck',
      params: {
        reading: 0,
        stone: 0.4,
        thickness: 0.75,
        circle: 0.7,
        depth: 0.7,
        threshold: 0.15,
        shake: 0.35,
        lag: 0.15,
        calm: 0.3,
        splash: 0.75,
        pattern: 0,
        volume: -3.0,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } }],
    preview: 'keys',
  },
  // Throats of water: slopes in a long pool, which speak vowels.
  {
    id: 'standing-water-throat-far-shore',
    name: 'Throat on a far shore',
    category: 'voice',
    description:
      'Stripes leaning in a narrow channel, a wet open vowel that slides about, heard from a far shore.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Throat of water',
      params: { drift: 0.35, foam: 0.25, volume: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
    preview: 'line',
  },
  {
    id: 'standing-water-throat-drowned-choir',
    name: 'Drowned choir',
    category: 'voice',
    description:
      'Hexagons in a channel hum a dark vowel in chords, thick and breathy, under a surface that wavers.',
    instrument: {
      deviceId: 'standing-water',
      preset: 'Throat of water',
      params: {
        pattern: 2,
        reading: 0,
        thickness: 0.55,
        circle: 0.6,
        depth: 0.45,
        lag: 1.3,
        unrest: 0.5,
        foam: 0.6,
        calm: 3,
        splash: 0.06,
        width: 0.85,
      },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
]
