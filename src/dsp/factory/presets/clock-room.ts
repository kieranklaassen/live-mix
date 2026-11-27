import { type FactoryPreset } from '../types'

// Clock Room is first of all what the clocks do to each other while a chord is
// held, so most previews here are held chords: the words say when they strike
// and how the wall has them keep time. A preset that is played key by key has
// its own strikes turned down or off.

export const CLOCK_ROOM_PRESETS: readonly FactoryPreset[] = [
  // Walls that learn: pads whose clocks come to strike together.
  {
    id: 'clock-room-learned-by-evening',
    name: 'Learned by evening',
    category: 'pad',
    description:
      'Deep nested gongs under soft felt that strike apart and fall into step within a few swings, in a warm hall.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Long wall',
      params: { learn: 0.6, volume: -10 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'clock-room-house-asleep',
    name: 'The house asleep',
    category: 'pad',
    description:
      'Coils in iron that strike together eleven times a minute, each stroke blooming late over a deep glow, on worn tape.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Night hall',
      params: {
        gong: 0,
        case: 2,
        beat: 0.18,
        learn: 0.9,
        glow: 0.5,
        hammer: 0.2,
        decay: 12,
        width: 0.6,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.25 } },
    ],
  },
  // Opposed pairs: two sides that answer each other.
  {
    id: 'clock-room-question-answer',
    name: 'Two sides of a room',
    category: 'plucked',
    description:
      'Clear rods in marble that answer each other from left and right 72 times a minute, with a braked single blow.',
    instrument: { deviceId: 'clock-room', preset: 'Two parties', params: { volume: -1.6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  {
    id: 'clock-room-slow-argument',
    name: 'A slow argument',
    category: 'bell',
    description:
      'Warbling cups in a dome strike in two parties, left and then right, over a dotted echo and a long bright plate.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Two parties',
      params: {
        gong: 2,
        case: 3,
        beat: 0.7,
        hammer: 0.3,
        decay: 14,
        escapement: 1,
        interval: -12,
        second: 0.7,
        width: 0.8,
        hush: 0.2,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  // Parlour keys: the key's strike and nothing else.
  {
    id: 'clock-room-parlour-keys',
    name: 'Parlour keys',
    category: 'keys',
    description:
      'A coil and its octave struck by the key alone and stopped soon after it is let go, close up in a small room.',
    instrument: { deviceId: 'clock-room', preset: 'Parlour keys', params: { volume: 1.4 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'clock-room-key-and-answer',
    name: 'Every key says it twice',
    category: 'keys',
    description:
      'Felt on clear rods in oak: every key is answered once on a second rod a fifth above, half a second late, in a chorus.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Parlour keys',
      params: {
        gong: 1,
        beat: 1,
        strikes: 0.8,
        interval: 7,
        second: 0.8,
        hammer: 0.2,
        decay: 5,
        hush: 0.4,
        width: 0.9,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  // Tubes.
  {
    id: 'clock-room-tube-bells',
    name: 'Tubes in the stairwell',
    category: 'bell',
    description:
      'Hanging tubes with a second set an octave under, each struck once and answered, ringing long in a cathedral.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Tube bells',
      params: { volume: 6, strikes: 0.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
  },
  {
    id: 'clock-room-noon-from-the-hill',
    name: 'Noon from the hill',
    category: 'bell',
    description:
      'Iron tubes passed along from low to high in a wave as long as two swings, heard across the water from a far shore.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Tube bells',
      params: {
        escapement: 1,
        case: 2,
        wall: 3,
        learn: 1,
        beat: 1.1,
        strikes: 0.8,
        decay: 9,
        hammer: 0.5,
        bloom: 0.5,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
    preview: 'chord',
  },
  // Rubbed drones.
  {
    id: 'clock-room-rubbed-drone',
    name: 'Rubbed by hand',
    category: 'drone',
    description:
      'Nested gongs and their fifths rubbed and never struck, each swelling in its own time, with a dark bloom behind.',
    instrument: { deviceId: 'clock-room', preset: 'Rubbed drone', params: { volume: 0 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.3 } }],
  },
  {
    id: 'clock-room-iron-under-floor',
    name: 'Iron under the floor',
    category: 'drone',
    description:
      'Coils rubbed in iron with the tuning let half go, beating slowly against an octave under, deep in a dark cave.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Rubbed drone',
      params: {
        gong: 0,
        case: 2,
        true: 0.6,
        interval: -12,
        hammer: 0.1,
        bloom: 0.3,
        swing: 0.5,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.2 } },
    ],
  },
  // Cups.
  {
    id: 'clock-room-cup-plucks',
    name: 'Cups under glass',
    category: 'plucked',
    description:
      'Small warbling cups struck hard under a glass dome, high and clear, each key answered once, in bright air.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Cup plucks',
      params: { volume: 5, strikes: 0.4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } }],
  },
  {
    id: 'clock-room-felt-cups',
    name: 'Felt on little cups',
    category: 'plucked',
    description:
      'Cups in oak under soft felt with an octave below, round and short, repeated by two heads of an old tape echo.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Cup plucks',
      params: { case: 0, hammer: 0.1, second: 0.8, interval: -12, strikes: 0, decay: 9, volume: 5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  // Basses.
  {
    id: 'clock-room-coil-bass',
    name: 'Coil in the case',
    category: 'bass',
    description:
      'A coil under the softest felt with an octave below, round and short, stilled soon after the key, on warm tape.',
    instrument: { deviceId: 'clock-room', preset: 'Coil bass', params: { volume: -3.5 } },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'clock-room-long-case-low',
    name: 'Long case, low gong',
    category: 'bass',
    description:
      'A braked rod in iron that answers the bass note once a second and stops itself dead, in a tight chamber.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Coil bass',
      params: {
        escapement: 2,
        gong: 1,
        case: 2,
        beat: 1,
        strikes: 0.7,
        hammer: 0.35,
        interval: 12,
        second: 0.4,
        decay: 1.6,
        glow: 0.1,
        volume: 4.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
  },
  // Splayed and chained: the chord as a pattern.
  {
    id: 'clock-room-splayed-arpeggio',
    name: 'Fifths of a second',
    category: 'plucked',
    description:
      'A held chord shares the swing out: five clear rods strike evenly one after another, high octaves on top, in a hall.',
    instrument: { deviceId: 'clock-room', preset: 'Splayed arpeggio', params: { volume: -0.8 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'clock-room-passed-upstairs',
    name: 'Passed upstairs',
    category: 'plucked',
    description:
      'Coils in iron hand each swing up from the low key to the high one in a wave, softer below and brighter above.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Passed along',
      params: { volume: -1.5, width: 0.7 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
    preview: 'chord',
  },
  // Ticks.
  {
    id: 'clock-room-tick-texture',
    name: 'A shop full of clocks',
    category: 'texture',
    description:
      'Quick light cups and tuned ticks in marble, never even and never quite together, answered by echoes of their past.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Tick texture',
      params: { volume: 5, tick: 0.45, decay: 3.5, glow: 0.2 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -11, gain: 3.5 } },
    ],
    preview: 'chord',
  },
  {
    id: 'clock-room-winding-itself-out',
    name: 'Winding itself out',
    category: 'texture',
    description:
      'Wound once by the key, each coil rolls, slows and stops, ticking, with grains of it left behind in the dark.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Wound once',
      params: { volume: -3, runDown: 0.9 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  // Breathing.
  {
    id: 'clock-room-breathing-voices',
    name: 'Breathing in turns',
    category: 'voice',
    description:
      'Rubbed coils breathe in two parties, one side in as the other goes out, with the vowel of a choir behind them.',
    instrument: { deviceId: 'clock-room', preset: 'Breathing voices', params: { volume: -1.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3 } }],
  },
  {
    id: 'clock-room-glass-morning',
    name: 'Glass before sunrise',
    category: 'voice',
    description:
      'Tubes rubbed under a glass dome, high and thin, whose swells the wall shares out evenly, under a slow shimmer.',
    instrument: {
      deviceId: 'clock-room',
      preset: 'Glass morning',
      params: { volume: 0, hammer: 0.5, swing: 0.8 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
]
