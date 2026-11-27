import { type FactoryPreset } from '../types'

// Closed Eyes is two sounds and a moment between them, so a preset here is
// first of all a pair: what is looked at, and what is left when the key goes.
// Two presets for each of ten directions. The opposites are already in other
// registers, so effects that add pitches of their own are left out.

export const CLOSED_EYES_PRESETS: readonly FactoryPreset[] = [
  // Amber then blue: odd partials while a key is held, even ones after it.
  {
    id: 'closed-eyes-lamp-turned-blue',
    name: 'Lamp, then its blue',
    category: 'pad',
    description:
      'A hollow lamp that blooms in a second and leaves its even partials an octave up, eighteen seconds long, in a hall.',
    instrument: { deviceId: 'closed-eyes', preset: 'Amber then blue' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -2.5 } },
    ],
  },
  {
    id: 'closed-eyes-window-at-dusk',
    name: 'Window after the lamp',
    category: 'keys',
    description:
      'A quick bright lamp that tires in half a second and leaves a sharp octave behind each key, with warm echoes.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Amber then blue',
      params: {
        attack: 0.02,
        tire: 0.5,
        depth: 0.8,
        form: 0.35,
        colour: 0.55,
        length: 7,
        rise: 0.12,
        edge: 0.75,
        seep: 0.3,
        release: 0.3,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4.0 } },
    ],
    preview: 'keys',
  },
  // Struck after-bells: what is struck leaves a bell or a warmth elsewhere.
  {
    id: 'closed-eyes-bells-across-keys',
    name: 'Bells across the keys',
    category: 'bell',
    description:
      'Struck bells in an open valley, each leaving its mirror: low strokes a high bell, high strokes a low warmth.',
    instrument: { deviceId: 'closed-eyes', preset: 'Struck after-bells' },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -2.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'closed-eyes-glass-low-answer',
    name: 'Glass with a low answer',
    category: 'bell',
    description:
      'Thin glass struck high, and under each stroke a hollow octave that comes a second late, on a long plate.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Struck after-bells',
      params: {
        opposite: 5,
        form: 0.95,
        colour: 0.7,
        air: 0.06,
        rise: 1.1,
        length: 16,
        after: 0.95,
        edge: 0.3,
        seep: 0,
        drift: 0.5,
        release: 0.4,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -1.5 } },
    ],
  },
  // Vowel ghost: a sung vowel and its two sides.
  {
    id: 'closed-eyes-voice-steps-aside',
    name: 'Voice that steps aside',
    category: 'voice',
    description:
      'A soft oh with breath in it; when it stops, its trembling sides are left to the far left and right, in a cathedral.',
    instrument: { deviceId: 'closed-eyes', preset: 'Vowel ghost' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
  },
  {
    id: 'closed-eyes-ee-turned-to-air',
    name: 'Bright vowel, torn after',
    category: 'voice',
    description:
      'A bright ee that leaves torn, rough bands behind it as soon as a key is let go, through a slow swirl and a room.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Vowel ghost',
      params: {
        opposite: 3,
        form: 0.9,
        colour: 0.6,
        air: 0.2,
        attack: 0.2,
        tire: 0.7,
        depth: 0.7,
        rise: 0.2,
        length: 7,
        edge: 0.5,
        after: 0.85,
        seep: 0.1,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6.5 } },
    ],
    preview: 'line',
  },
  // Tiring bass: a reed that gives out under the finger.
  {
    id: 'closed-eyes-reed-gives-out',
    name: 'Bass that gives out',
    category: 'bass',
    description:
      'A reed bass that pales within a third of a second and leaves a high shade of itself, warm and close.',
    instrument: { deviceId: 'closed-eyes', preset: 'Tiring bass' },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
    ],
  },
  {
    id: 'closed-eyes-full-reed-even-ghost',
    name: 'Full reed, octave ghost',
    category: 'bass',
    description:
      'A full, bright reed bass that holds on longer and leaves even partials a moment late, on a cassette.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Tiring bass',
      params: {
        opposite: 0,
        form: 0.85,
        colour: 0.45,
        tire: 1.4,
        depth: 0.55,
        after: 0.8,
        length: 2.2,
        rise: 0.3,
        seep: 0.3,
        edge: 0.45,
        width: 0.5,
        release: 0.2,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -3.5 } },
    ],
  },
  // Blinking pulse: the eyes close again and again.
  {
    id: 'closed-eyes-eyes-in-time',
    name: 'Eyes open and close',
    category: 'pad',
    description:
      'An octave lamp that goes dark nearly two and a half times a second while its even partials flash, in bright air.',
    instrument: { deviceId: 'closed-eyes', preset: 'Blinking pulse' },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -1 } },
    ],
  },
  {
    id: 'closed-eyes-slow-lids-choir',
    name: 'Slow lids over a choir',
    category: 'pad',
    description:
      'Reeds under lids that close once in four seconds and show torn bands behind them, with a slow drift of chorus.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Blinking pulse',
      params: {
        source: 1,
        opposite: 3,
        form: 0.6,
        colour: 0.4,
        attack: 0.6,
        blink: 1,
        blinkRate: 0.25,
        depth: 0.6,
        length: 8,
        edge: 0.3,
        width: 1,
        release: 1.2,
        drift: 0.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
  },
  // Bowl drone: a rubbed rim that tires slowly.
  {
    id: 'closed-eyes-rim-and-its-cellar',
    name: 'Rim and what is under it',
    category: 'drone',
    description:
      'A low fifth of rubbed bowls that takes nine seconds to tire and shows a stopped pipe an octave down, in a vast nave.',
    instrument: { deviceId: 'closed-eyes', preset: 'Bowl drone' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -2 } },
    ],
  },
  {
    id: 'closed-eyes-bright-rim-wheel',
    name: 'Bright rim, slow wheel',
    category: 'drone',
    description:
      'Bright wide bowls that turn as they sound and let breath through in waves, through a slow rotor and a dark cave.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Bowl drone',
      params: {
        opposite: 4,
        form: 0.85,
        colour: 0.65,
        attack: 1.2,
        tire: 3,
        seep: 0.75,
        after: 0.8,
        length: 12,
        edge: 0.4,
        rise: 1,
        drift: 0.9,
        width: 1,
        air: 0.4,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -2.5 } },
    ],
  },
  // Breath after: a bright note leaves a dark breath.
  {
    id: 'closed-eyes-breath-after-glow',
    name: 'Breath after the glow',
    category: 'pad',
    description:
      'A bright lamp that is gone in a third of a second and leaves a breath that comes in slow waves, in a room.',
    instrument: { deviceId: 'closed-eyes', preset: 'Breath after' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2.0 } },
    ],
    preview: 'keys',
  },
  {
    id: 'closed-eyes-string-turns-to-wind',
    name: 'Strings turn into wind',
    category: 'string',
    description:
      'Bright wiry strings that pale early under the finger while a dry wind comes up where they were, across a valley.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Breath after',
      params: {
        source: 5,
        form: 0.15,
        colour: 0.75,
        attack: 0.01,
        tire: 0.5,
        depth: 0.9,
        after: 0.9,
        length: 11,
        edge: 0.5,
        rise: 0.8,
        seep: 0.2,
        release: 0.6,
        air: 0.2,
      },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -3 } },
    ],
  },
  // Keys that leave: a string under a hand, and an octave below when it lifts.
  {
    id: 'closed-eyes-hand-lifts-off',
    name: 'As the hand lifts off',
    category: 'keys',
    description:
      'A plucked string that keeps its ring, and a hollow octave down that swells when the hand lifts, in a small room.',
    instrument: { deviceId: 'closed-eyes', preset: 'Keys that leave' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1.5 } },
    ],
  },
  {
    id: 'closed-eyes-felt-bar-mirror',
    name: 'Soft bars, far mirror',
    category: 'keys',
    description:
      'Soft wooden bars that sink at once and leave their mirror, high over the low keys and low under the high, in mist.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Keys that leave',
      params: {
        source: 4,
        opposite: 1,
        form: 0.2,
        colour: 0.25,
        air: 0.3,
        tire: 0.4,
        depth: 0.8,
        length: 14,
        rise: 0.4,
        after: 0.9,
        edge: 0.3,
        seep: 0.35,
        drift: 0.4,
        release: 0.8,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
    ],
  },
  // Remembered texture: everything held tires together.
  {
    id: 'closed-eyes-everything-was-here',
    name: 'All that was held here',
    category: 'texture',
    description:
      'Bowls that remember the whole chord for twenty seconds and come back pale, torn bands already in them, far away.',
    instrument: { deviceId: 'closed-eyes', preset: 'Remembered texture' },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'closed-eyes-lamp-haunted-chord',
    name: 'Lamp haunted by a chord',
    category: 'texture',
    description:
      'Lamps that tire together in a third of a second, so each new key comes back with trembling sides around it.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Remembered texture',
      params: {
        source: 0,
        opposite: 2,
        form: 0.65,
        colour: 0.4,
        attack: 0.3,
        tire: 0.35,
        depth: 0.75,
        length: 10,
        rise: 0.3,
        edge: 0.25,
        seep: 0.6,
        drift: 0.6,
        release: 1,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
    ],
    preview: 'keys',
  },
  // Pluck and shade: a short pluck with its octave already in it.
  {
    id: 'closed-eyes-pluck-with-shade',
    name: 'Pluck with its shade',
    category: 'plucked',
    description:
      'A hollow damped pluck that tires in a fifth of a second and gives way to its round octave, with a dotted echo.',
    instrument: { deviceId: 'closed-eyes', preset: 'Pluck and shade' },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -0.5 } },
    ],
  },
  {
    id: 'closed-eyes-wire-torn-shade',
    name: 'Wire with a torn shade',
    category: 'plucked',
    description:
      'A wiry bright pluck that rings on over a torn, whispering band of its own, short and wide, in a tight chamber.',
    instrument: {
      deviceId: 'closed-eyes',
      preset: 'Pluck and shade',
      params: {
        opposite: 3,
        form: 0.08,
        colour: 0.7,
        air: 0.4,
        tire: 0.6,
        depth: 0.6,
        length: 2.6,
        edge: 0.6,
        seep: 0.15,
        after: 0.9,
        width: 0.9,
        memory: 0,
        release: 0.4,
      },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: -1.5 } },
    ],
  },
]
