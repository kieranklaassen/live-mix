import { type FactoryPreset } from '../types'

// Turned Time is played by what comes next: a new key sends the sounds before
// it back, and a key left alone turns by itself. So a preset decides first what
// turns the sand, how long it runs and how the beginning is met again. The
// pitches stay true on every way back, and no effect here adds any of its own.

const D = 'turned-time'

export const TURNED_TIME_PRESETS: readonly FactoryPreset[] = [
  // Hovering pads: time runs slow near the neck, and never stands.
  {
    id: 'turned-time-hover-glass-nave',
    name: 'Glass held at the neck',
    category: 'pad',
    description:
      'A slow pad of glass that lingers in a soft light each time it nears its beginning, in a vast nave.',
    instrument: { deviceId: D, preset: 'Hovering glass pad', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'turned-time-hover-string-drift',
    name: 'Bowed hour, waiting',
    category: 'pad',
    description:
      'Strings that swell in over two seconds and hang about their beginning, dark and wide on a slow chorus.',
    instrument: {
      deviceId: D,
      preset: 'Hovering glass pad',
      params: {
        body: 2,
        tilt: -0.5,
        frame: 380,
        strike: 0,
        attack: 2,
        sand: 1.6,
        depth: 0.5,
        exchange: 0.9,
        grains: 0,
        beat: 1.2,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
  },
  // Turning keys: each new key sends the keys before it back.
  {
    id: 'turned-time-keys-small-room',
    name: 'Each key turns the last',
    category: 'keys',
    description:
      'Plucked keys that turn on the spot: every new one sends the ones before it back to their pluck, in a room.',
    instrument: { deviceId: D, preset: 'Keys that turn', params: { volume: 0 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } }],
  },
  {
    id: 'turned-time-keys-bar-tape',
    name: 'Wooden hour on tape',
    category: 'keys',
    description:
      'Round wooden bars with a knock at every landing, leaning into each turn before it runs back, on quarter inch tape.',
    instrument: {
      deviceId: D,
      preset: 'Keys that turn',
      params: {
        body: 1,
        tilt: 0.2,
        frame: 340,
        strike: 0.75,
        sand: 1,
        depth: 0.45,
        pour: 0.55,
        inertia: 0.55,
        exchange: 0.1,
        memory: 0.7,
        beat: 0.6,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
  // Short sand plucks: the sand is out at once.
  {
    id: 'turned-time-plucks-dotted',
    name: 'A pinch of sand',
    category: 'plucked',
    description:
      'Bright dry plucks whose sand is out in less than a second, thrown back by a dotted tape echo.',
    instrument: { deviceId: D, preset: 'Short sand plucks', params: { volume: 2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5.5 } },
    ],
  },
  {
    id: 'turned-time-plucks-glass-springs',
    name: 'Seeds on a pane',
    category: 'plucked',
    description:
      'Tiny glass plucks that bounce back from empty, softer each time and bent at each tap, in a spring tank.',
    instrument: {
      deviceId: D,
      preset: 'Short sand plucks',
      params: {
        body: 4,
        tilt: -0.2,
        frame: 800,
        strike: 0.8,
        sand: 0.28,
        depth: 0.9,
        pour: 0.6,
        memory: 0.6,
        settling: 70,
        grains: 0.3,
        release: 1.6,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
    ],
  },
  // Reed basses: heavy sand that leans into the turn.
  {
    id: 'turned-time-bass-reed-chamber',
    name: 'Heavy sand, low reed',
    category: 'bass',
    description:
      'A dark reed bass that sinks and is drawn up again with weight, close up in a tight chamber.',
    instrument: { deviceId: D, preset: 'Reed bass', params: { volume: 0 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } }],
  },
  {
    id: 'turned-time-bass-string-thump',
    name: 'Bass with a way back',
    category: 'bass',
    description:
      'A plucked low string that fades at once and leans back towards its pluck, pressed warm on tape.',
    instrument: {
      deviceId: D,
      preset: 'Reed bass',
      params: {
        body: 2,
        tilt: -0.3,
        frame: 240,
        strike: 0.7,
        attack: 0.01,
        sand: 0.6,
        depth: 0.6,
        pour: 0.3,
        turn: 1,
        inertia: 0.45,
        memory: 0.5,
        release: 0.35,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.1 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5 } },
    ],
  },
  // Palindrome bells: letting go sends a bell back to its strike.
  {
    id: 'turned-time-palindrome-cathedral',
    name: 'Bells read both ways',
    category: 'bell',
    description:
      'Clear bells that run back to their own strike when the key is let go, in a cathedral.',
    instrument: {
      deviceId: D,
      preset: 'Palindrome bells',
      params: { sand: 0.9, release: 2.6, volume: -1 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
    ],
    preview: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 69 },
        { atSec: 1.5, durSec: 0.9, note: 76, gain: 0.7 },
        { atSec: 3, durSec: 0.9, note: 72, gain: 0.7 },
        { atSec: 4, durSec: 0.9, note: 64 },
      ],
    },
  },
  {
    id: 'turned-time-palindrome-dark-plate',
    name: 'Last strike comes first',
    category: 'bell',
    description:
      'Low dull bells that ring on far down before they are called back slowly to their strike, on a long plate.',
    instrument: {
      deviceId: D,
      preset: 'Palindrome bells',
      params: {
        tilt: -0.55,
        frame: 300,
        strike: 0.55,
        sand: 0.5,
        depth: 0.7,
        pour: 0.6,
        settling: 35,
        exchange: 0.75,
        beat: 1.4,
        release: 5,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 57 },
        { atSec: 1.2, durSec: 1.1, note: 64, gain: 0.7 },
        { atSec: 2.8, durSec: 1.2, note: 60, gain: 0.7 },
      ],
    },
  },
  // Opposed drones: half of the overtones run the other way.
  {
    id: 'turned-time-opposed-reed-cave',
    name: 'Odd and even, crossing',
    category: 'drone',
    description:
      'A low fifth of reeds whose even overtones grow while the odd ones fade, and back again, in a dark cave.',
    instrument: { deviceId: D, preset: 'Opposed drone', params: { volume: 1 } },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.28 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
    ],
  },
  {
    id: 'turned-time-opposed-string-veil',
    name: 'High light, low shade',
    category: 'drone',
    description:
      'A bowed low fifth whose high overtones rise out of it as the note sinks, wide and slow on a glacial sweep.',
    instrument: {
      deviceId: D,
      preset: 'Opposed drone',
      params: {
        body: 2,
        tilt: 0.55,
        frame: 1500,
        attack: 0.8,
        sand: 2,
        depth: 0.65,
        split: -0.9,
        neck: 3,
        exchange: 0.25,
        beat: 0.8,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  // Falling textures: a chord let fall along the sand, landing one by one.
  {
    id: 'turned-time-falling-glass-valley',
    name: 'Grains down a slope',
    category: 'texture',
    description:
      'A chord of glass that lands key by key in a rain of grains, bent and shimmering, across an open valley.',
    instrument: { deviceId: D, preset: 'Falling texture', params: { volume: -7 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
    preview: 'chord',
  },
  {
    id: 'turned-time-falling-skins-far',
    name: 'Slow rockfall, far off',
    category: 'texture',
    description:
      'Low drums that tumble out of step with each other and knock as they land, heard from a far shore.',
    instrument: {
      deviceId: D,
      preset: 'Falling texture',
      params: {
        body: 3,
        tilt: -0.4,
        frame: 160,
        strike: 0.9,
        sand: 0.5,
        depth: 0.7,
        apart: 1,
        settling: 120,
        grains: 0.6,
        beat: 0.4,
        inertia: 0.4,
        volume: -3,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
    preview: 'chord',
  },
  // Returning voices: reeds that come back as a soft wave.
  {
    id: 'turned-time-voices-undertow',
    name: 'Voices called home',
    category: 'voice',
    description:
      'Reed voices that fade and come back as a soft dark wave, beating slowly, in a warm hall.',
    instrument: { deviceId: D, preset: 'Returning voices', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'turned-time-voices-bright-chapel',
    name: 'Answer from the far side',
    category: 'voice',
    description:
      'Nasal voices that pass through their beginning and answer from the other side in another vowel, in a chapel.',
    instrument: {
      deviceId: D,
      preset: 'Returning voices',
      params: {
        neck: 3,
        tilt: 0.35,
        frame: 1300,
        attack: 0.12,
        sand: 0.8,
        depth: 0.75,
        inertia: 0.3,
        exchange: 0.25,
        beat: 0.6,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { mix: 0.25 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.22 } },
    ],
  },
  // Neighbour pulses: short sand, and a key that turns only the keys beside it.
  {
    id: 'turned-time-pulses-bars-booth',
    name: 'Neighbours keep turning',
    category: 'keys',
    description:
      'Short wooden bars that knock at every landing, each chord spread out along the sand, close up in a small booth.',
    instrument: { deviceId: D, preset: 'Neighbour pulses', params: { volume: -3.5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } }],
    preview: 'chord',
  },
  {
    id: 'turned-time-pulses-reed-echo',
    name: 'Quick reeds, out of step',
    category: 'keys',
    description:
      'Quick soft reed pulses that never fall together, with a clean echo a third of a second behind.',
    instrument: {
      deviceId: D,
      preset: 'Neighbour pulses',
      params: {
        body: 5,
        tilt: 0.1,
        frame: 900,
        strike: 0.3,
        sand: 0.22,
        depth: 0.95,
        stagger: 0.6,
        neck: 0,
        ears: 0.8,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 333, feedback: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.15 } },
    ],
    preview: 'chord',
  },
  // Long glasses: sand for a quarter of a minute and more.
  {
    id: 'turned-time-long-glass-hall',
    name: 'Quarter minute glass',
    category: 'pad',
    description:
      'A struck chord of glass whose overtones hand their light on for fourteen seconds, in an airy hall.',
    instrument: { deviceId: D, preset: 'Long glass', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
  },
  {
    id: 'turned-time-long-bell-blur',
    name: 'An afternoon of one bell',
    category: 'bell',
    description:
      'One slow bell with half a minute of sand, its overtones trading places as it thins, held in a faint haze.',
    instrument: {
      deviceId: D,
      preset: 'Long glass',
      params: {
        body: 0,
        tilt: -0.2,
        frame: 600,
        sand: 28,
        depth: 1,
        pour: 0.2,
        split: 0.6,
        grains: 0.15,
        beat: 0.9,
        settling: 60,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2.5 } },
    ],
    preview: 'hold',
  },
]
