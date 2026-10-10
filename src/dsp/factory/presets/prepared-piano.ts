import { type FactoryPreset } from '../types'

export const PREPARED_PIANO_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'screws-and-erasers',
    name: 'Screws and erasers',
    category: 'keys',
    description:
      'Every key has its own bolt, eraser, felt or paper: a small percussion orchestra heard close in a small box of a room.',
    instrument: { deviceId: 'prepared-piano', preset: 'Small orchestra', params: { volume: -3.5 } },
    effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.15 } }],
  },
  {
    id: 'piano-under-the-lid',
    name: 'Piano under the lid',
    category: 'keys',
    description:
      'The piano with nothing on its strings, heard from close, with its other strings ringing in sympathy.',
    instrument: { deviceId: 'prepared-piano', preset: 'Plain piano', params: { volume: -4.5 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.25 } }],
  },
  {
    id: 'gong-garden',
    name: 'Gong garden',
    category: 'bell',
    description:
      'Bolted strings ring like small gongs, each leaving its sour overtones in a wide open space.',
    instrument: { deviceId: 'prepared-piano', preset: 'Bolt gongs', params: { volume: -1.5 } },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'bolted-upright',
    name: 'Bolted upright',
    category: 'keys',
    description:
      'A few light bolts make an upright a little sour and clangy, recorded to tape with a hint of spring.',
    instrument: { deviceId: 'prepared-piano', preset: 'Light bolts', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'loose-screws',
    name: 'Loose screws',
    category: 'keys',
    description:
      'Bolts left loose so every firm key buzzes, played through a small combo amplifier in a room.',
    instrument: { deviceId: 'prepared-piano', preset: 'Rattling bolts', params: { volume: -4 } },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
  },
  {
    id: 'eraser-marimba',
    name: 'Eraser marimba',
    category: 'keys',
    description:
      'Rubber wedged in the strings turns each note into a wooden thunk, with a short soft echo in a small dark room.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { hammer: 0.45, tone: 0.6, volume: 2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9, gain: 10 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'soft-mallet-piano',
    name: 'Soft mallet piano',
    category: 'keys',
    description:
      'Half-damped strings that sound struck by soft mallets, widened a little in a bright chamber.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { hammer: 0.55, tone: 0.9, volume: 4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'felted-strings',
    name: 'Felted strings',
    category: 'keys',
    description:
      'A felt strip laid across the strings: short, soft, rounded notes on a worn cassette.',
    instrument: { deviceId: 'prepared-piano', preset: 'Felt mute', params: { volume: 0.5 } },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
  },
  {
    id: 'attic-felt',
    name: 'Attic felt',
    category: 'keys',
    description: 'A barely touched felted piano in an empty room, with a plain hall far behind it.',
    instrument: { deviceId: 'prepared-piano', preset: 'Felt whisper', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { hold: 3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paper-on-the-strings',
    name: 'Paper on the strings',
    category: 'keys',
    description:
      'A sheet of paper lying on the strings buzzes with every firm key, close in a small dark room.',
    instrument: { deviceId: 'prepared-piano', preset: 'Paper buzz', params: { volume: -3 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'sizzle-harp',
    name: 'Sizzle harp',
    category: 'texture',
    description:
      'Strings sizzling against paper, their buzz scattered an octave up into glittering grains.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { hammer: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -11.5, gain: 8 } },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'wood-block-echoes',
    name: 'Wood block echoes',
    category: 'keys',
    description:
      'Strings damped at their middle knock like wood blocks, answered by a quick dark echo and a dark amp spring.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { amount: 0.8, hammer: 0.6, thud: 0.4, volume: 3 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -4.5, gain: 10 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 190, mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'temple-at-dusk',
    name: 'Temple at dusk',
    category: 'bell',
    description:
      'Soft-struck bolted strings with slowly beating unisons, like gongs heard across a cavern.',
    instrument: { deviceId: 'prepared-piano', preset: 'Temple gongs', params: { volume: -0.5 } },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'tin-music-box',
    name: 'Tin music box',
    category: 'bell',
    description:
      'Bright clanging chimes from bolts near the ends of the strings, through a toy sampler and a quick spring.',
    instrument: { deviceId: 'prepared-piano', preset: 'Tin chimes', params: { volume: 1 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.15 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'out-of-tune-parlour',
    name: 'Out of tune parlour',
    category: 'keys',
    description:
      'A prepared parlour piano with its unisons adrift, heard from an old shellac record.',
    instrument: { deviceId: 'prepared-piano', preset: 'Loose unisons', params: { volume: 0.5 } },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
  },
  {
    id: 'night-orchestra',
    name: 'Night orchestra',
    category: 'keys',
    description:
      'The mixed preparations struck softly and left to ring long and dark, into a slowly blooming tail.',
    instrument: { deviceId: 'prepared-piano', preset: 'Dark orchestra', params: { volume: -3 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.3 } }],
  },
  {
    id: 'gongs-in-reverse',
    name: 'Gongs in reverse',
    category: 'texture',
    description:
      'Each bolted gong is answered by itself played backwards, swelling up after the strike.',
    instrument: { deviceId: 'prepared-piano', preset: 'Bolt gongs', params: { volume: -1.5 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'thunks-into-mist',
    name: 'Thunks into mist',
    category: 'texture',
    description:
      'Dry rubber thunks whose pitch is caught and held as a mist that hangs after every note.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { hammer: 0.4, thud: 0.25, volume: 1 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.8, width: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'half-speed-gongs',
    name: 'Half-speed gongs',
    category: 'texture',
    description:
      'Bolted gongs with a copy of themselves at half speed an octave below, in a low cathedral.',
    instrument: { deviceId: 'prepared-piano', preset: 'Temple gongs', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -2 } },
    ],
    preview: 'bells',
  },
  {
    id: 'chimes-on-a-rotor',
    name: 'Chimes on a rotor',
    category: 'bell',
    description:
      'Clangy bolted chimes left to ring a little longer, turning slowly through a rotating speaker.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { decay: 1.5, hammer: 0.6, volume: -3.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
]
