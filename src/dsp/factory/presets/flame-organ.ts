import { type FactoryPreset } from '../types'

// Flame Organ is a flame, a tube and the moment the two agree: a preset decides
// what burns and in what first, then which harmonic of the key sings, and then
// how the key is lit and how it goes out. Two presets a direction: one close to
// the instrument's own, one that takes it somewhere else.

export const FLAME_ORGAN_PRESETS: readonly FactoryPreset[] = [
  // Warm flame pads: gas in an open tube, caught slowly.
  {
    id: 'flame-organ-lamplight-nave',
    name: 'Lamplit nave',
    category: 'pad',
    description:
      'A gas flame under every key, caught softly, with a fainter second flame that beats slowly against it in a warm hall.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Warm flame pad',
      params: { catch: 0.9, embers: 3, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
  },
  {
    id: 'flame-organ-warm-gas-bloom',
    name: 'Gaslight in bloom',
    category: 'pad',
    description:
      'Taller gas flames in double tubes, an octave deep and nearly covered, under a slow chorus on a long plate.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Warm flame pad',
      params: {
        tube: 4,
        flame: 0.65,
        catch: 1.6,
        mouth: 0.35,
        lift: 0.1,
        secondFlame: 0.5,
        embers: 4,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  // Candle flutes: soft, narrow, with the breath of the wick.
  {
    id: 'flame-organ-candle-flute-chapel',
    name: 'Wick flute in a chapel',
    category: 'wind',
    description:
      'A candle in a narrow tube, a soft flute with a flutter before each note and a chapel behind it.',
    instrument: { deviceId: 'flame-organ', preset: 'Candle flute', params: { volume: -3 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } }],
    preview: 'line',
  },
  {
    id: 'flame-organ-candle-flute-far-shore',
    name: 'Spirit flame twelfths',
    category: 'wind',
    description:
      'A spirit flame in a narrow tube that sings the twelfth of the key, clear and thin, thrown into dark tape echoes.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Candle flute',
      params: {
        fuel: 2,
        lag: 0.42,
        place: 0.08,
        draught: 0.04,
        roar: 0.12,
        flame: 0.25,
        mouth: 0.35,
        embers: 1.2,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.22 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  // Coal basses: odd harmonics and a rough low flame.
  {
    id: 'flame-organ-coal-bass-cellar',
    name: 'Coal cellar bass',
    category: 'bass',
    description:
      'Coal in a half closed tube: a round hollow bass with a rasp in it that burns down while the key is held.',
    instrument: { deviceId: 'flame-organ', preset: 'Coal bass' },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.1 } },
    ],
    preview: 'bass',
  },
  {
    id: 'flame-organ-coal-bass-furnace',
    name: 'Furnace floor bass',
    category: 'bass',
    description:
      'Coal in double tubes with a tall flame, a wide rough bass an octave deeper, pushed through a warm stack.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Coal bass',
      params: { tube: 4, flame: 1, mouth: 0.5, roar: 0.45, burn: 12, flicker: 0.4, volume: -3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { mix: 0.6 } }],
    preview: 'bass',
  },
  // Beating pairs: two flames a hair apart.
  {
    id: 'flame-organ-beating-pair-drift',
    name: 'Two flames adrift',
    category: 'pad',
    description:
      'Two flames in narrow tubes, too far apart to lock: pure tones that beat a few times a second across the speakers.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Beating pair',
      params: { between: 0.58, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } }],
  },
  {
    id: 'flame-organ-beating-pair-slip',
    name: 'Slipping pair',
    category: 'string',
    description:
      'Two spirit flames in open tubes at the edge of locking, slipping and pulling, bowed in by a slow draught.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Beating pair',
      params: {
        tube: 0,
        fuel: 2,
        between: 0.5,
        flame: 0.22,
        mouth: 0.35,
        catch: 0.7,
        draught: 0.22,
        lag: 0.2,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  // Octave lifters: keys that leave for the next harmonic and come back.
  {
    id: 'flame-organ-octave-lifter-ladder',
    name: 'Lifting lanterns',
    category: 'pad',
    description:
      'Every key lifts to its octave and sinks again in its own time, over a bright hall that keeps both.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Octave lifter',
      params: { tube: 3, lift: 0.45, draught: 0.12, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } }],
  },
  {
    id: 'flame-organ-octave-lifter-twelfths',
    name: 'Rising to the twelfth',
    category: 'texture',
    description:
      'Candles in half closed tubes that let go of the key and lift to its twelfth, heard from far off with slow echoes.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Octave lifter',
      params: {
        tube: 1,
        fuel: 1,
        lift: 0.55,
        flicker: 0.5,
        catch: 0.6,
        embers: 2.5,
        mouth: 0.85,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.3 } },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  // Roaring drones: the burning itself.
  {
    id: 'flame-organ-roaring-drone-chimneys',
    name: 'Row of chimneys',
    category: 'drone',
    description:
      'Flared tubes with tall gas flames, a wide roaring drone whose air leans slowly from colour to colour in a vast nave.',
    instrument: { deviceId: 'flame-organ', preset: 'Roaring drone', params: { volume: -9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.22 } }],
    preview: 'low',
  },
  {
    id: 'flame-organ-roaring-drone-storm',
    name: 'Storm in the flue',
    category: 'drone',
    description:
      'Coal roaring in double tubes under a hard draught, its crackle and low tone blurred in a dark cave.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Roaring drone',
      params: {
        fuel: 3,
        tube: 4,
        roar: 0.7,
        draught: 0.9,
        flicker: 0.5,
        mouth: 0.3,
        secondFlame: 0.6,
        between: 0.2,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
    preview: 'low',
  },
  // Glass taps: the tube struck as the flame is lit.
  {
    id: 'flame-organ-glass-tap-keys',
    name: 'Tapped glass keys',
    category: 'keys',
    description:
      'Half closed tubes tapped as they light: a clear ring of glass over a round hollow note that burns away.',
    instrument: { deviceId: 'flame-organ', preset: 'Glass tap keys', params: { volume: -3.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
  },
  {
    id: 'flame-organ-glass-tap-struck-spirit',
    name: 'Struck match',
    category: 'plucked',
    description:
      'Spirit lit in an instant in open tubes: a bright reedy pluck with a chink of glass, gone in a second, echoing aside.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Spirit pluck',
      params: {
        tube: 0,
        glass: 0.35,
        burn: 1.4,
        mouth: 0.5,
        flame: 0.55,
        embers: 0.4,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.28 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  // Dying embers: coal and candles that thin and gutter.
  {
    id: 'flame-organ-dying-embers-hearth',
    name: 'Last of the hearth',
    category: 'texture',
    description:
      'Coal that gutters and crackles as it burns out over eight seconds, close by on worn tape.',
    instrument: { deviceId: 'flame-organ', preset: 'Dying embers', params: { volume: 0 } },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'flame-organ-dying-embers-cold-wick',
    name: 'Going out one by one',
    category: 'texture',
    description:
      'Candles in narrow tubes with little left to burn, each sinking in its own time into a soft cloud.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Dying embers',
      params: {
        fuel: 1,
        tube: 3,
        burn: 14,
        flicker: 0.6,
        flame: 0.8,
        catch: 0.05,
        embers: 6,
        roar: 0.3,
        mouth: 0.7,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.25 } },
    ],
  },
  // Furnace choirs: double tubes, two flames each.
  {
    id: 'flame-organ-furnace-choir-loft',
    name: 'Furnace choir, loft',
    category: 'voice',
    description:
      'Double tubes with two flames each, a broad low choir that swells in over a second and sings under a cathedral.',
    instrument: { deviceId: 'flame-organ', preset: 'Furnace choir', params: { volume: -8.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
  },
  {
    id: 'flame-organ-furnace-choir-humming',
    name: 'Choir behind the grate',
    category: 'voice',
    description:
      'Candles in double tubes, nearly covered, a close humming choir coloured by slow dark vowels.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Furnace choir',
      params: { fuel: 1, mouth: 0.5, catch: 0.6, roar: 0.2, between: 0.15, volume: -10 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }],
  },
  // Blue bells: the glass first, a thin flame after it.
  {
    id: 'flame-organ-blue-bell-cold-air',
    name: 'Blue flame bells',
    category: 'bell',
    description:
      'Glass tapped hard, and a thin spirit flame high in a narrow tube that sings on two octaves up, in bright air.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Blue bell',
      params: { lag: 0.18, draught: 0.04, volume: -11 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.28 } }],
    preview: 'bells',
  },
  {
    id: 'flame-organ-blue-bell-warm-tubes',
    name: 'Bells that stay lit',
    category: 'bell',
    description:
      'Open tubes tapped and left burning: each bell swells into a held gas tone as its ring dies, on a long plate.',
    instrument: {
      deviceId: 'flame-organ',
      preset: 'Blue bell',
      params: {
        tube: 0,
        fuel: 0,
        place: 0.25,
        catch: 0.9,
        flame: 0.35,
        glass: 0.8,
        burn: 9,
        lift: 0.2,
        mouth: 0.5,
        volume: -2,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
]
