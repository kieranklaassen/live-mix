import { type FactoryPreset } from '../types'

// Climbing Gong is a stroke whose energy climbs, so a preset here is first of
// all how far the light goes up, how long it takes and what it is made of: two
// presets for each of ten directions. Rooms are kept behind the metal, since a
// tail that is louder than the climb would cover it, and effects that add
// pitches of their own are left out of the tuned metals.

export const CLIMBING_GONG_PRESETS: readonly FactoryPreset[] = [
  // Dawn pads: a roll that rises out of nothing.
  {
    id: 'climbing-gong-before-sunrise',
    name: 'Gong before sunrise',
    category: 'pad',
    description:
      'A soft yarn roll on golden metal grows for several seconds, and its upper tones wake above it in a vast nave.',
    instrument: {
      deviceId: 'climbing-gong',
      preset: 'Dawn gong pad',
      params: { roll: 0.95, rollSwell: 4.5, climb: 0.72, volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'climbing-gong-sixths-daylight',
    name: 'Sixths into daylight',
    category: 'pad',
    description:
      'A felt roll on metal tuned in sixths opens clear and slow over three seconds, with no rush of air in it.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 2,
        hardness: 0.55,
        place: 0.5,
        ground: 0.35,
        climb: 0.95,
        threshold: 0.05,
        climbTime: 1.4,
        roar: 0.05,
        shimmer: 0.6,
        lowRing: 24,
        highRing: 14,
        roll: 1,
        rollSpeed: 12,
        rollSwell: 3,
        choke: 0.15,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  // Soft plates: keys with hardly any climb.
  {
    id: 'climbing-gong-plate-keys-room',
    name: 'Soft plates, small room',
    category: 'keys',
    description:
      'Felt on harmonic metal, close and round, each key with one brief glow above it, on tape in a small room.',
    instrument: { deviceId: 'climbing-gong', preset: 'Soft plate keys', params: { volume: -9 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'climbing-gong-sixths-keys',
    name: 'Yarn keys in sixths',
    category: 'keys',
    description:
      'Soft yarn on short sixths, warm in the middle and stopped soon after the key, on a medium plate.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 2,
        beater: 1,
        hardness: 0.2,
        place: 0.3,
        ground: 0.45,
        climb: 0.35,
        threshold: 0.2,
        climbTime: 0.3,
        roar: 0.05,
        shimmer: 1.2,
        lowRing: 7,
        highRing: 3,
        roll: 0,
        sympathy: 0.5,
        choke: 0.55,
        width: 0.6,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  // Bowed metal.
  {
    id: 'climbing-gong-bow-on-fifths',
    name: 'Bow on open fifths',
    category: 'string',
    description:
      'A bow draws fifths out of the metal and holds them, and the first rung comes up to shine over the bow in a hall.',
    instrument: { deviceId: 'climbing-gong', preset: 'Bowed metal', params: { volume: -9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'climbing-gong-bow-in-the-cellar',
    name: 'Bowed plate in a cave',
    category: 'drone',
    description:
      'A hard bow on an untuned plate, low and grainy, whose light goes up and comes down again in waves in a dark cave.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 5,
        beater: 4,
        hardness: 0.75,
        place: 0.55,
        ground: 0.6,
        climb: 0.8,
        threshold: 0.2,
        climbTime: 0.6,
        fallBack: 0.75,
        roar: 0.5,
        shimmer: 0.9,
        lowRing: 14,
        highRing: 3,
        choke: 0.2,
        width: 0.9,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
  },
  // The temple of fifths: long bells.
  {
    id: 'climbing-gong-temple-of-fifths',
    name: 'Temple of open fifths',
    category: 'bell',
    description:
      'Yarn strokes on fifths that ring on over one another for ten seconds and more, in a cathedral.',
    instrument: {
      deviceId: 'climbing-gong',
      preset: 'Fifths temple',
      params: { roll: 0, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
  },
  {
    id: 'climbing-gong-temple-far-shore',
    name: 'Temple across the water',
    category: 'drone',
    description:
      'One deep felt stroke that bends home as it dies and rolls on softly, heard over water from a far shore.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 0,
        beater: 0,
        hardness: 0.4,
        place: 0.35,
        ground: 0.6,
        climb: 0.7,
        threshold: 0.1,
        climbTime: 1.4,
        roar: 0.2,
        shimmer: 0.8,
        bend: 30,
        lowRing: 36,
        highRing: 8,
        roll: 0.15,
        sympathy: 0.6,
        choke: 0,
        volume: -9,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },
  // Choked mallets: short, stopped by a hand.
  {
    id: 'climbing-gong-hand-on-the-metal',
    name: 'Hand on the metal',
    category: 'plucked',
    description:
      'A yarn mallet on sixths, lit for a moment and stopped by the hand as soon as the key is let go, dry and near.',
    instrument: {
      deviceId: 'climbing-gong',
      preset: 'Choked mallet',
      params: { roll: 0, choke: 1, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
  },
  {
    id: 'climbing-gong-wood-and-echo',
    name: 'Wood on fifths, echo',
    category: 'plucked',
    description:
      'Wooden sticks on short bright fifths, choked early, with warm tape repeats falling in the gaps.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 0,
        beater: 2,
        hardness: 0.4,
        place: 0.45,
        ground: 0.35,
        climb: 0.5,
        threshold: 0.1,
        climbTime: 0.2,
        roar: 0.05,
        shimmer: 0.3,
        lowRing: 2.2,
        highRing: 0.9,
        roll: 0,
        sympathy: 0,
        choke: 0.8,
        width: 0.4,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.35 } }],
  },
  // Silver: glass more than bronze.
  {
    id: 'climbing-gong-silver-window',
    name: 'Silver in the window',
    category: 'bell',
    description:
      'Soft wood on silver metal, clear as glass and touched again and again while the key is held, on a bright plate.',
    instrument: { deviceId: 'climbing-gong', preset: 'Silver glass', params: { volume: -2 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } }],
  },
  {
    id: 'climbing-gong-silver-wakes-late',
    name: 'Silver that wakes late',
    category: 'pad',
    description:
      'A dark felt stroke on silver metal whose upper glass only comes alight a second or two on, with a faint glint above.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 4,
        beater: 0,
        hardness: 0.45,
        place: 0.45,
        ground: 0.7,
        climb: 0.9,
        threshold: 0.02,
        climbTime: 3,
        roar: 0.1,
        shimmer: 1.4,
        lowRing: 24,
        highRing: 16,
        roll: 0.3,
        rollSpeed: 6,
        choke: 0.1,
        width: 0.9,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  // Sub earth: the middle of a great gong.
  {
    id: 'climbing-gong-earth-below',
    name: 'Earth below the gong',
    category: 'bass',
    description:
      'Felt in the very middle of a harmonic gong: the low key alone, pulled a little sharp by the stroke, through warm lows.',
    instrument: {
      deviceId: 'climbing-gong',
      preset: 'Sub earth',
      params: { roll: 0.1, choke: 0.55, volume: -12 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'climbing-gong-buried-plate',
    name: 'Buried plate bass',
    category: 'bass',
    description:
      'A yarn stroke on an untuned plate that rises to its note from below, short and dull, on warm tape.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 5,
        beater: 1,
        hardness: 0.2,
        place: 0.05,
        ground: 0.85,
        climb: 0.3,
        threshold: 0.3,
        climbTime: 0.3,
        roar: 0.4,
        shimmer: 0.4,
        bend: -120,
        lowRing: 5,
        highRing: 1,
        roll: 0,
        sympathy: 0,
        choke: 0.6,
        width: 0.2,
        volume: -6,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  // Brushed air.
  {
    id: 'climbing-gong-brush-on-fifths',
    name: 'Brush goes round',
    category: 'texture',
    description:
      'A brush goes round and round on metal tuned in fifths, more air than tone, each sweep waking the rungs, in an airy hall.',
    instrument: { deviceId: 'climbing-gong', preset: 'Brushed air', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'climbing-gong-brushed-silver-fog',
    name: 'Silver brushed in fog',
    category: 'pad',
    description:
      'A firm brush on silver metal near the rim, quick and thin, blurred behind a thin veil in an open valley.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 4,
        beater: 3,
        hardness: 0.85,
        place: 0.6,
        ground: 0.3,
        climb: 0.35,
        threshold: 0.1,
        climbTime: 0.6,
        roar: 0.3,
        shimmer: 3,
        lowRing: 8,
        highRing: 4,
        roll: 0,
        sympathy: 0.5,
        choke: 0.2,
        width: 1,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
  },
  // Rolling walls: full climb.
  {
    id: 'climbing-gong-rolling-wall-of-plates',
    name: 'Wall of rolling plates',
    category: 'pad',
    description:
      'A full quick roll on an untuned plate with everything alight and roaring, held in a dark hall.',
    instrument: { deviceId: 'climbing-gong', preset: 'Rolling wall', params: { volume: -7.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } }],
  },
  {
    id: 'climbing-gong-fifths-in-waves',
    name: 'Fifths roll in waves',
    category: 'drone',
    description:
      'A slow roll on deep fifths: the light goes up, the low tone gives way and is given back, and it goes up again.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 0,
        beater: 1,
        hardness: 0.5,
        place: 0.5,
        ground: 0.5,
        climb: 1,
        threshold: 0.1,
        climbTime: 0.5,
        fallBack: 0.9,
        roar: 0.45,
        shimmer: 1,
        lowRing: 20,
        highRing: 5,
        roll: 0.9,
        rollSpeed: 6,
        rollSwell: 1,
        choke: 0.2,
        width: 1,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } }],
  },
  // Velvet bells.
  {
    id: 'climbing-gong-velvet-plate',
    name: 'Velvet bell, long plate',
    category: 'bell',
    description:
      'A round yarn bell on harmonic metal, its pairs beating slowly and one soft rung above it, on a long plate.',
    instrument: {
      deviceId: 'climbing-gong',
      preset: 'Velvet bells',
      params: { roll: 0, volume: -5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } }],
  },
  {
    id: 'climbing-gong-felt-bells-strings',
    name: 'Felt bells over strings',
    category: 'bell',
    description:
      'Golden metal under soft felt, dark and low with a fall in its pitch, over a pedal of strings that rings along.',
    instrument: {
      deviceId: 'climbing-gong',
      params: {
        metal: 3,
        beater: 0,
        hardness: 0.2,
        place: 0.1,
        ground: 0.5,
        climb: 0.45,
        threshold: 0.3,
        climbTime: 0.6,
        roar: 0.1,
        shimmer: 0.7,
        bend: 45,
        lowRing: 9,
        highRing: 3,
        roll: 0,
        sympathy: 0.2,
        choke: 0.05,
        width: 0.6,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
  },
]
