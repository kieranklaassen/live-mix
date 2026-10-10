import { type FactoryPreset } from '../types'

export const STAIRCASE_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'chord-stairs-hall',
    name: 'Chord stairs hall',
    category: 'pad',
    description:
      'The held chord climbs through its own notes about once a second, octave after octave, in a hall.',
    instrument: { deviceId: 'staircase', preset: 'Chord stairs', params: { volume: -10.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'sliding-chord-plate',
    name: 'Sliding chord plate',
    category: 'pad',
    description:
      'Every voice slides without stopping to the next note of the chord above it, on a long plate.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Sliding chord',
      params: { speed: 0.36, volume: -10 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'hollow-stair-pad',
    name: 'Hollow stair pad',
    category: 'pad',
    description:
      'A still pad of every third octave, hollow and soft, thickened by an ensemble in a hall.',
    instrument: { deviceId: 'staircase', preset: 'Hollow pad', params: { volume: -7 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-chord-tape',
    name: 'Falling chord tape',
    category: 'pad',
    description:
      'The chord walks down through its own notes on quarter inch tape, each step caught by a tape echo.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord descent',
      params: { speed: -0.55, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'quick-stair-arpeggio',
    name: 'Quick stair arpeggio',
    category: 'pad',
    description:
      'The chord runs up its own notes three times a second and never arrives, bounced by an echo in a room.',
    instrument: { deviceId: 'staircase', preset: 'Quick arpeggio', params: { volume: -10 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'chord-stairs-close',
    name: 'Chord stairs close',
    category: 'pad',
    description:
      'The climbing chord dry and near, with one set of octaves and a hint of a small booth.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord stairs',
      params: {
        speed: 0.6,
        slide: 0.15,
        chorus: 0,
        attack: 0.05,
        release: 0.6,
        width: 0.4,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } }],
  },
  {
    id: 'narrow-beam-echo',
    name: 'Narrow beam echo',
    category: 'pad',
    description:
      'A thin clear register that hands the chord up from octave to octave, trailed by a dark echo.',
    instrument: { deviceId: 'staircase', preset: 'Narrow beam', params: { volume: -10.5 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } }],
  },
  {
    id: 'choir-on-the-stairs',
    name: 'Choir on the stairs',
    category: 'pad',
    description:
      'The sliding chord sung back by a reverb of open vowels, slow to speak and slow to leave.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Sliding chord',
      params: { speed: 0.4, shape: 0.3, volume: -11 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
  {
    id: 'still-stair-organ',
    name: 'Still stair organ',
    category: 'organ',
    description:
      'A plain organ of stacked octaves that stays on the note and speaks at once, in a cathedral.',
    instrument: { deviceId: 'staircase', preset: 'Still organ', params: { volume: -10.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'reed-stairs-rotary',
    name: 'Reed stairs rotary',
    category: 'organ',
    description:
      'A reedy organ whose chord steps up through its own notes, through a slow rotating speaker in a room.',
    instrument: { deviceId: 'staircase', preset: 'Reed stairs', params: { volume: -12 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'warm-stair-organ',
    name: 'Warm stair organ',
    category: 'organ',
    description:
      'A still organ of octaves with a reedy edge, warmed by a valve stage and a slow tremolo, in a tight chamber.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { centre: 300, shape: 0.6, chorus: 0.3, volume: -12.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'octave-stair-pipes',
    name: 'Octave stair pipes',
    category: 'organ',
    description:
      'A bright narrow organ whose chord climbs in quick steps, an octave added above and below, on a plate.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Reed stairs',
      params: { speed: 0.6, centre: 800, shape: 0.35, slide: 0, volume: -10.6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-descent-cavern',
    name: 'Slow descent cavern',
    category: 'drone',
    description:
      'A low fifth that sinks for ever in a cavern without getting lower, gliding off the key.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Slow descent',
      params: { speed: -0.45, volume: -7 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } }],
  },
  {
    id: 'low-tide-stairs',
    name: 'Low tide stairs',
    category: 'drone',
    description:
      'A dark reedy drone on worn tape in a dark hall, ebbing slowly downward off the key.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Low tide',
      params: { speed: -0.3, centre: 180, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'wide-drift-valley',
    name: 'Wide drift valley',
    category: 'drone',
    description:
      'Eight octaves of pure tones in two sets across an open valley, rising off the key too slowly to follow.',
    instrument: { deviceId: 'staircase', preset: 'Wide drift', params: { volume: -6.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
  },
  {
    id: 'stairwell-mist',
    name: 'Stairwell mist',
    category: 'drone',
    description:
      'A still hollow fifth, low and dark, blurred into a mist that hangs after the keys are let go.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Hollow pad',
      params: { centre: 240, shape: 0.3 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.5 } }],
  },
  {
    id: 'semitone-climb-room',
    name: 'Semitone climb room',
    category: 'texture',
    description:
      'One note in a room climbs a semitone at a time, twice a second, leaving the key and never getting higher.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Semitone climb',
      params: { speed: 0.7, volume: -6.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'falling-steps-spring',
    name: 'Falling steps spring',
    category: 'texture',
    description:
      'Clear semitone steps falling away from the key without end, each one splashing in a spring tank.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Falling steps',
      params: { speed: -0.7, width: 0.4, volume: -7 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } }],
  },
  {
    id: 'glass-spiral-air',
    name: 'Glass spiral air',
    category: 'texture',
    description:
      'High pure tones gliding slowly up off the key, doubled a fifth above in bright air.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Glass spiral',
      params: { speed: 0.5, attack: 0.8, width: 0.6, volume: -5 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'siren-rise-phaser',
    name: 'Siren rise phaser',
    category: 'texture',
    description:
      'A reedy tone gliding off the key, an octave up every ten seconds and never arriving, through a slow phaser on a plate.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Siren rise',
      params: { width: 0.4, volume: 1.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
]
