import { type FactoryPreset } from '../types'

export const SHORTWAVE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'night-band-whistles',
    name: 'Night band whistles',
    category: 'pad',
    description:
      'Far stations whistle a chord, each sliding in to its note and fading, in a vast nave.',
    instrument: { deviceId: 'shortwave', preset: 'Far whistle', params: { volume: -17 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.45 } }],
  },
  {
    id: 'clear-carrier-plate',
    name: 'Clear carrier',
    category: 'pad',
    description:
      'Steady pure tones with no slide, no fading and no static, close on a small plate.',
    instrument: { deviceId: 'shortwave', preset: 'Clear carrier', params: { volume: -15 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
  },
  {
    id: 'slow-dial-valley',
    name: 'Slow dial in',
    category: 'pad',
    description:
      'Each note starts far off and takes seconds to arrive on pitch, across an open valley.',
    instrument: { deviceId: 'shortwave', preset: 'Slow dial', params: { volume: -16 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'swell-across-the-sea',
    name: 'Swell across the sea',
    category: 'pad',
    description:
      'A chord of whistles that rises slowly, each sinking and swelling by itself, in a wide open space.',
    instrument: { deviceId: 'shortwave', preset: 'Night swell', params: { volume: -15.5 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
  },
  {
    id: 'two-stations-close',
    name: 'Two stations close',
    category: 'drone',
    description:
      'A low fifth where each tone has a fainter neighbour that beats against it slowly.',
    instrument: { deviceId: 'shortwave', preset: 'Beating pair', params: { volume: -13.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'fluttering-carrier',
    name: 'Fluttering carrier',
    category: 'texture',
    description:
      'One whistle with a fast beat on it in a narrow, hissing band, repeated by a warm tape echo.',
    instrument: { deviceId: 'shortwave', preset: 'Fast flutter' },
    effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } }],
  },
  {
    id: 'two-tone-call-sign',
    name: 'Two tone call sign',
    category: 'texture',
    description: 'A station keying between a note and its octave twice a second, with a dark echo.',
    instrument: { deviceId: 'shortwave', preset: 'Two tone call', params: { volume: -11 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } }],
  },
  {
    id: 'low-answer-plate',
    name: 'Low answer',
    category: 'drone',
    preview: 'hold',
    description: 'A tone that drops an octave and comes back, two seconds each, on a long plate.',
    instrument: { deviceId: 'shortwave', preset: 'Low answer', params: { volume: -9.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'high-chatter-spring',
    name: 'High chatter',
    category: 'texture',
    description: 'Fast keying two octaves up through a narrow band and static, into a spring tank.',
    instrument: { deviceId: 'shortwave', preset: 'High chatter', params: { volume: -10.5 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } }],
  },
  {
    id: 'time-signal-pips',
    name: 'Time signal pips',
    category: 'texture',
    description: 'One short pip a second, exactly on the note, with a single quiet slap behind it.',
    instrument: { deviceId: 'shortwave', preset: 'Time pips', params: { volume: -8 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } }],
  },
  {
    id: 'pips-in-the-nave',
    name: 'Pips in the nave',
    category: 'texture',
    description: 'Quick pips that fade and return, smeared into a long tail by a cathedral.',
    instrument: { deviceId: 'shortwave', preset: 'Quick pips', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
  },
  {
    id: 'voices-far-off',
    name: 'Voices far off',
    category: 'pad',
    description:
      'A chord of breathy voices, each murmuring in syllables like speech from far off, never in words.',
    instrument: { deviceId: 'shortwave', preset: 'Far voices', params: { volume: -14 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'slow-murmur-drone',
    name: 'Slow murmur',
    category: 'drone',
    description:
      'A low murmur over a faint steady tone, its mouth opening and closing slowly, in a plain hall.',
    instrument: { deviceId: 'shortwave', preset: 'Slow murmur', params: { volume: -12.5 } },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } }],
  },
  {
    id: 'lost-station-tape',
    name: 'Lost station',
    category: 'texture',
    description: 'A whistle that wanders a quarter tone and sinks into its static, on worn tape.',
    instrument: { deviceId: 'shortwave', preset: 'Lost station', params: { volume: -12 } },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'storm-on-the-band',
    name: 'Storm on the band',
    category: 'texture',
    description: 'One fading whistle with heavy hiss and crackle close under it, in a dark spring.',
    instrument: { deviceId: 'shortwave', preset: 'Storm static' },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25 } }],
  },
  {
    id: 'thin-line-chorus',
    name: 'Thin line',
    category: 'pad',
    description: 'A chord through a narrow telephone band, thickened a little and kept in a booth.',
    instrument: { deviceId: 'shortwave', preset: 'Telephone line', params: { volume: -9 } },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'whistles-in-a-swirl',
    name: 'Whistles in a swirl',
    category: 'pad',
    description:
      'Far whistles under a slow phaser, so the hollow sweep of fading doubles, on a plate.',
    instrument: { deviceId: 'shortwave', preset: 'Far whistle', params: { volume: -12.5 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'murmur-turning',
    name: 'Murmur turning',
    category: 'texture',
    description:
      'One breathy voice murmuring on a note, through a slow rotating speaker across a room.',
    instrument: { deviceId: 'shortwave', preset: 'Far voices', params: { volume: -8.5 } },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stations-on-a-loop',
    name: 'Stations on a loop',
    category: 'drone',
    description: 'A slow low swell caught by a tape loop that layers it over itself as it fades.',
    instrument: { deviceId: 'shortwave', preset: 'Night swell', params: { volume: -13.5 } },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.4 } }],
  },
  {
    id: 'carrier-and-shadow',
    name: 'Carrier and shadow',
    category: 'drone',
    description: 'Steady low tones with a quiet octave under them, blurred into a hanging mist.',
    instrument: { deviceId: 'shortwave', preset: 'Clear carrier', params: { volume: -16 } },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
    ],
  },
]
