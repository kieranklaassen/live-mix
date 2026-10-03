import { type FactoryPreset } from '../types'

export const HANDPAN_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'courtyard-handpan',
    name: 'Courtyard handpan',
    category: 'bell',
    description: 'A handpan played with soft fingers in a small stone courtyard.',
    instrument: { deviceId: 'handpan', preset: 'Soft hands', params: { volume: -4 } },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'halo-pan',
    name: 'Halo pan',
    category: 'bell',
    description:
      'Long handpan notes whose shared overtones set each other ringing, left in a hall.',
    instrument: { deviceId: 'handpan', preset: 'Halo' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: 'keys',
  },
  {
    id: 'tongue-drum-echoes',
    name: 'Tongue drum echoes',
    category: 'bell',
    description: 'A steel tongue drum, pure and long, repeated by a tape echo on a small plate.',
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { volume: -3 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rain-taps',
    name: 'Rain taps',
    category: 'bell',
    description:
      'Short muted taps at the edge of the note, scattered into grains and caught by a room.',
    instrument: { deviceId: 'handpan', preset: 'Rain taps', params: { volume: -1 } },
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { mix: 0.3, feedback: 0.35 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cavern-ding',
    name: 'Cavern ding',
    category: 'bell',
    description:
      'The pan struck near its centre with the thump of its air under it, in a very large space.',
    instrument: { deviceId: 'handpan', preset: 'Low ding' },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
    preview: 'keys',
  },
  {
    id: 'handpan-up-close',
    name: 'Handpan up close',
    category: 'bell',
    description:
      'A handpan from the seat of the player: a firm touch and the thump of the shell, through a preamp in a dry booth.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 3, touch: 0.65, position: 0.65, cavity: 1, sympathy: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
    ],
    preview: 'keys',
  },
  {
    id: 'knuckle-pan-plate',
    name: 'Knuckle pan plate',
    category: 'bell',
    description:
      'A handpan rapped with the knuckles, the overtones blooming just after each hit, on a medium plate.',
    instrument: { deviceId: 'handpan', preset: 'Knuckles', params: { decay: 4.5, volume: -5 } },
    effects: [{ deviceId: 'dattorro', preset: 'Medium plate', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'mallet-tongue-drum',
    name: 'Mallet tongue drum',
    category: 'bell',
    description:
      'A steel tongue drum under a soft mallet: a quick clear note with a faint high ping, in a room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 5, touch: 0.8, position: 0.4, shimmer: 0.15, cavity: 0.4, volume: -5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } }],
    preview: 'keys',
  },
  {
    id: 'rim-tone-handpan',
    name: 'Rim tone handpan',
    category: 'bell',
    description:
      'The hand lands at the edge of the note, so its octave and fifth ring over a thin body, in bright air.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 5,
        position: 1,
        shimmer: 0.35,
        cavity: 0.15,
        sympathy: 0.7,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } }],
    preview: 'keys',
  },
  {
    id: 'muted-palm-pan',
    name: 'Muted palm pan',
    category: 'bell',
    description:
      'Each note is stopped by the hand as the key lets go: a round thud through a preamp, with a slap echo in a tight room.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 3,
        touch: 0.5,
        position: 0.2,
        shimmer: 0.2,
        cavity: 0.85,
        sympathy: 0.2,
        damp: 1,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Tight room' },
    ],
  },
  {
    id: 'shell-thump-drum',
    name: 'Shell thump drum',
    category: 'plucked',
    description:
      'Mostly the air in the shell: a soft tuned thump with hardly any ring, thickened by a transformer, in a gated room.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 0.6,
        touch: 0.15,
        position: 0,
        shimmer: 0,
        cavity: 1,
        sympathy: 0,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.3, output: -1.5 } },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'glass-rim-pan',
    name: 'Glass rim pan',
    category: 'bell',
    description:
      'Fingertips at the edge and no thump of air: thin overtones that turn slowly and ring long in an airy tail.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 9,
        touch: 0.05,
        position: 0.9,
        shimmer: 0.7,
        cavity: 0,
        sympathy: 0.9,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'zita-rev1', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-turning-steel',
    name: 'Slow turning steel',
    category: 'bell',
    description:
      'Overtones set far off true so each long note changes colour as it rings, rocked dark to bright in a long hall.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 10,
        position: 0.7,
        shimmer: 1,
        cavity: 0.4,
        sympathy: 0.2,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 12, mix: 0.35 } },
    ],
    preview: 'keys',
  },
  {
    id: 'tin-tongue-ping',
    name: 'Tin tongue ping',
    category: 'bell',
    description:
      'A tongue drum struck hard at the edge: short pings that a dotted tape echo repeats to the left and the right.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: {
        decay: 1.8,
        touch: 1,
        position: 0.7,
        shimmer: 0.5,
        cavity: 0.1,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'far-hall-handpan',
    name: 'Far hall handpan',
    category: 'bell',
    description: 'A handpan played over a loudspeaker in a hall and heard from the far end of it.',
    instrument: {
      deviceId: 'handpan',
      params: { decay: 4, touch: 0.5, position: 0.4, sympathy: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { noise: 0, output: -3.5 } },
      { deviceId: 'stereo-widener', params: { width: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'spring-drip-taps',
    name: 'Spring drip taps',
    category: 'bell',
    description:
      'Hard short taps at the rim of the pan, each one splashing and dripping in a slack spring tank.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 1.2,
        touch: 0.75,
        position: 0.9,
        cavity: 0.2,
        sympathy: 0.2,
        damp: 0.3,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Surf drip',
        params: { springs: 2, width: 0.15, decay: 3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handpan-and-cellos',
    name: 'Handpan and cellos',
    category: 'bell',
    description:
      'A handpan played softly near the centre, with a dark low string section swelling in behind each chord, in a hall.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 6,
        touch: 0.25,
        position: 0.35,
        shimmer: 0.3,
        cavity: 0.55,
        sympathy: 0.8,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.7 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'steel-shell-drone',
    name: 'Steel shell drone',
    category: 'drone',
    description:
      'Low notes struck once and caught by a sustainer: a dark bed that holds under the keys and sinks away after them.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 10,
        touch: 0.5,
        position: 0.15,
        shimmer: 0.6,
        cavity: 1,
        sympathy: 1,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { decay: 20, ensemble: 0.2 } },
      {
        deviceId: 'expanse',
        preset: 'Low cathedral',
        params: { decay: 12, width: 0.25, mix: 0.3 },
      },
    ],
  },
  {
    id: 'handpan-choir-tail',
    name: 'Handpan choir tail',
    category: 'bell',
    description:
      'Handpan notes whose tail comes back as a soft sung ah, as if voices were holding each note after the hand.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 6,
        touch: 0.35,
        position: 0.6,
        shimmer: 0.5,
        cavity: 0.3,
        sympathy: 0.7,
        volume: -4,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 8 } }],
    preview: 'keys',
  },
  {
    id: 'night-radio-pan',
    name: 'Night radio pan',
    category: 'bell',
    description:
      'A handpan struck hard and heard over shortwave at night: thin, fading in and out, with a little static under it.',
    instrument: {
      deviceId: 'handpan',
      params: {
        decay: 2.5,
        touch: 0.7,
        position: 0.65,
        shimmer: 0.5,
        cavity: 0.3,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { static: 0.08, interference: 0 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
]
