import { type FactoryPreset } from '../types'

// Spun Wire is how fast its wheels turn: a preset decides first whether its
// passes are plucks, a sung tone, or the way from one to the other, and then
// what the wheel does when the key is let go. Echoes are set apart from the
// wheel's own count, so that the one is not heard as the other.

export const SPUN_WIRE_PRESETS: readonly FactoryPreset[] = [
  // Feather wheel pads: fast, all wires alike.
  {
    id: 'spun-wire-feather-dusk',
    name: 'Feathered wheel at dusk',
    category: 'pad',
    description:
      'Six wires to a key, all alike, spun up into one shimmering tone that coasts down again in a warm hall.',
    instrument: { deviceId: 'spun-wire', preset: 'Feather wheel', params: { volume: -7 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
  },
  {
    id: 'spun-wire-feather-slow-glass',
    name: 'Wheel of quiet glass',
    category: 'pad',
    description:
      'Octaves of steel wire touched in the middle, hollow and clear, melting slowly into a wide chorus on a long plate.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Feather wheel',
      params: {
        tuning: 1,
        hub: 0,
        rim: 0.35,
        point: 0.5,
        edge: 0.4,
        damp: 0.3,
        rise: 3.5,
        wobble: 0.35,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  // Last turns: thrown once and left to slow.
  {
    id: 'spun-wire-last-turns-nave',
    name: 'Last turns in a nave',
    category: 'texture',
    description:
      'A steel wheel thrown once: held, its plucks slow for ten seconds, softer and further apart, in a vast nave.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Last turns',
      params: { coast: 10, spin: 12, release: 6, volume: -3 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.32 } }],
  },
  {
    id: 'spun-wire-last-turns-wound-down',
    name: 'Nearly wound down',
    category: 'texture',
    description:
      'Two dry wooden wires thrown slowly on worn tape, stumbling on an uneven rim until the last note.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Last turns',
      params: {
        strung: 2,
        tuning: 3,
        hub: 1,
        spin: 5,
        coast: 9,
        wobble: 0.7,
        ring: 5,
        rim: 0.6,
        edge: 0.4,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } },
    ],
    preview: 'line',
  },
  // Overtone fans: the wires stand on the key's own overtones.
  {
    id: 'spun-wire-overtone-valley',
    name: 'Overtones over a valley',
    category: 'plucked',
    description:
      'Each key steps up its own overtones to the ninth, eight to the second, across an open valley.',
    instrument: { deviceId: 'spun-wire', preset: 'Overtone ladder', params: { volume: -4 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'hold',
  },
  {
    id: 'spun-wire-overtone-mist',
    name: 'Ninth overtone, mist',
    category: 'pad',
    description:
      'Overtones rubbed on wood until no pluck is left, each coming forward as it passes, under bright air.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Overtone ladder',
      params: {
        spin: 22,
        melt: 5,
        rise: 1.8,
        hub: 1,
        rim: 0.3,
        ring: 6,
        damp: 0.35,
        edge: 0.35,
        lacing: 0.1,
        gear: 0,
        wobble: 0.5,
        release: 4,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  // Card keys: one slap a pass.
  {
    id: 'spun-wire-card-street',
    name: 'Card on a fan of wires',
    category: 'keys',
    description:
      'A card slapped round an open fan of fifths, thirteen to the second, dry on wood and then in a room.',
    instrument: { deviceId: 'spun-wire', preset: 'Card in the wheel', params: { volume: -2 } },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1.5 } },
    ],
  },
  {
    id: 'spun-wire-card-turned-once',
    name: 'Paper keys, one round',
    category: 'keys',
    description:
      'Six quick slaps of a blunt card up and down four octaves at every key, with short tape echoes behind.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Card in the wheel',
      params: {
        tuning: 1,
        gesture: 2,
        spin: 16,
        hub: 0,
        ring: 14,
        edge: 0.3,
        wobble: 0.2,
        gear: 0,
        release: 1.5,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
  },
  // Skin basses: one low wire on a drum head.
  {
    id: 'spun-wire-skin-bass-floor',
    name: 'Skin and floor bass',
    category: 'bass',
    description:
      'One low wire on a skin, held by a steady rub and stopped as the key is let go, close up on warm tape.',
    instrument: { deviceId: 'spun-wire', preset: 'Skin bass', params: { volume: -13 } },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
    ],
  },
  {
    id: 'spun-wire-skin-bass-drum-turn',
    name: 'Turning drum bass',
    category: 'bass',
    description:
      'Three wires of a fan struck one by one on a skin, five to the second: a low line that keeps its own pulse.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Skin bass',
      params: {
        tuning: 3,
        strung: 3,
        spin: 5,
        melt: 40,
        edge: 0.7,
        point: 0.12,
        rim: 0.4,
        lacing: 0.1,
        release: 0.8,
        width: 0.4,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 9.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  // Nail bells: heavy wire, turned once.
  {
    id: 'spun-wire-nail-bells-court',
    name: 'Nail bells in a court',
    category: 'bell',
    description:
      'Heavy steel wires over four octaves turned once past a nail: a quick run of small bells in a tight chamber.',
    instrument: { deviceId: 'spun-wire', preset: 'Nail bells', params: { volume: -10 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } }],
  },
  {
    id: 'spun-wire-nail-bells-still',
    name: 'Iron chime, dark hall',
    category: 'bell',
    description:
      'Two thick wires struck by a blunt feather on steel, beating slowly with one another in a dark hall.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Nail bells',
      params: {
        tuning: 0,
        plucker: 0,
        strung: 2,
        gauge: 1,
        spin: 50,
        beat: 1.4,
        edge: 0.75,
        damp: 0.15,
        ring: 20,
        rim: 0.4,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  // Air drones: breath on the wires.
  {
    id: 'spun-wire-air-drone-ridge',
    name: 'Air on the ridge wires',
    category: 'drone',
    description:
      'Wind turned round an open fan of wires on wood, one fifth after another coming forward, far off.',
    instrument: { deviceId: 'spun-wire', preset: 'Air drone', params: { volume: 3 } },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
    ],
  },
  {
    id: 'spun-wire-air-drone-cave',
    name: 'Breath under the cave',
    category: 'drone',
    description:
      'Three wires of one pitch on a skin, blown slowly and swelling with each turn of a crooked wheel, in a cave.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Air drone',
      params: {
        tuning: 0,
        strung: 3,
        hub: 2,
        spin: 4,
        melt: 2,
        wobble: 0.9,
        ring: 20,
        rim: 0.5,
        edge: 0.45,
        lacing: 0.6,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
    ],
  },
  // Geared arpeggios: the wheels of a chord in whole ratios.
  {
    id: 'spun-wire-geared-plate',
    name: 'Three to four to five',
    category: 'plucked',
    description:
      'The keys of a chord turn three to four to five, so their overtones cross and meet again, on a bright plate.',
    instrument: { deviceId: 'spun-wire', preset: 'Geared arpeggio', params: { volume: -10.2 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  {
    id: 'spun-wire-geared-low-wheel',
    name: 'High keys turn slowly',
    category: 'plucked',
    description:
      'Four wires of a fan on wood; the low key runs and every higher key is geared slower, with dotted echoes.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Geared arpeggio',
      params: {
        tuning: 3,
        strung: 4,
        gear: 4,
        spin: 6,
        hub: 1,
        rim: 0.5,
        ring: 6,
        edge: 0.45,
        coast: 4,
        release: 2.5,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  // Woven voices: tied fast at the rim.
  {
    id: 'spun-wire-woven-choir-loft',
    name: 'Woven wire, choir loft',
    category: 'voice',
    description:
      'Wires tied fast at the rim and touched near the end: a nasal, beating hum of many, high in a cathedral.',
    instrument: { deviceId: 'spun-wire', preset: 'Woven voices', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'spun-wire-woven-to-and-fro',
    name: 'Humming rim, to and fro',
    category: 'voice',
    description:
      'A fan of rubbed wires that rocks forward and back like breath, round and dark, through a slow swirl.',
    instrument: {
      deviceId: 'spun-wire',
      preset: 'Woven voices',
      params: {
        tuning: 3,
        gesture: 3,
        spin: 26,
        melt: 4,
        rise: 0.8,
        coast: 5,
        edge: 0.45,
        point: 0.3,
        beat: 0.8,
        release: 4,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.32 } },
    ],
  },
  // Plain plucks: a wheel with no weight.
  {
    id: 'spun-wire-plain-pluck-room',
    name: 'Twin wire keys',
    category: 'plucked',
    description:
      'Two wires on wood plucked together at each key and damped when it is let go: a plain instrument in a room.',
    instrument: { deviceId: 'spun-wire', preset: 'Plain plucked keys', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'spun-wire-plain-pluck-strummed',
    name: 'One strum, two springs',
    category: 'string',
    description:
      'Six wires of an open fan strummed once past a blunt nail and left to ring, in a tank of two springs.',
    instrument: { deviceId: 'spun-wire', preset: 'Strummed fan', params: { volume: -5 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } }],
  },
]
