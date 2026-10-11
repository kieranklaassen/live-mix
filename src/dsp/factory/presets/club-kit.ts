// The Club Kit's presets in the bank: the firm kit of house music, mostly
// dry, each with one to four effects after it.

import { type FactoryPreset } from '../types'

export const CLUB_KIT_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'club-firm',
    name: 'Firm club kit',
    category: 'drum',
    description:
      'The firm house kit as it comes, a punchy kick and tight hats, evened a little by a clean fast tape stage.',
    instrument: { deviceId: 'club-kit', params: { kit: 0, punch: 0.6, snap: 0.5, volume: -1.3 } },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { wow: 0, flutter: 0, hiss: 0 } },
    ],
    preview: 'drum',
  },
  {
    id: 'club-deep-round',
    name: 'Deep round kit',
    category: 'drum',
    description:
      'The deep house kit, a lower longer kick on F under soft tops, its lows lifted by the head bump of a fast tape.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 1, punch: 0.4, snap: 0.3, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.45, wow: 0, flutter: 0, speed: 0, age: 0, hiss: 0, bump: 1 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-dusty',
    name: 'Dusty club kit',
    category: 'drum',
    description:
      'The dusty house kit, its hats and snare held at a low sample rate so they fold and darken, on a record with fine crackle.',
    instrument: { deviceId: 'club-kit', params: { kit: 2, snap: 0.5, volume: -1.5 } },
    effects: [
      {
        deviceId: 'vinyl',
        params: { warp: 0.05, crackle: 0.5, pops: 0, surface: 0.3, wear: 0.3 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-bright',
    name: 'Bright club kit',
    category: 'drum',
    description:
      'The bright house kit with hats, snare and cymbals forward and crisp, its drive half up, in a tight bright chamber.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 3, snap: 0.65, tone: 0.6, drive: 0.5, volume: -1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
    preview: 'drum',
  },
  {
    id: 'club-long-kick',
    name: 'Long kick kit',
    category: 'drum',
    description:
      'The deep house kit let ring, its kick a low boom of half a second and its open hat nearly as long, warmed by a soft tape curve.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 1, length: 1.7, punch: 0.5, tone: 0.55, volume: -4 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -5.5 } }],
    preview: 'drum',
  },
  {
    id: 'club-short-dry',
    name: 'Short dry kit',
    category: 'drum',
    description:
      'The firm house kit at half length and narrow with no room at all, its kick over in a tenth of a second, through a soft saturator.',
    instrument: {
      deviceId: 'club-kit',
      params: {
        kit: 0,
        length: 0.5,
        punch: 0.7,
        snap: 0.6,
        variation: 0.04,
        width: 0.3,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 0, driveDb: 12, toneDb: 0, outputDb: -8.5, adaa: 1 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-warm-driven',
    name: 'Warm driven kit',
    category: 'drum',
    description:
      'The deep house kit driven inside and again through a tape preamp, thick and dull, the snare and congas up near the kick.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 1, length: 1.1, punch: 0.55, tone: 0.42, drive: 0.7, volume: -3 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -10 } }],
    preview: 'drum',
  },
  {
    id: 'club-late-night',
    name: 'Late night kit',
    category: 'drum',
    description:
      'The deep house kit long, dull and wide with soft starts and no click, a dark hall faint behind it.',
    instrument: {
      deviceId: 'club-kit',
      params: {
        kit: 1,
        length: 1.6,
        punch: 0.3,
        snap: 0.2,
        tone: 0.3,
        width: 0.75,
        volume: -4,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.12 } }],
    preview: 'drum',
  },
  {
    id: 'club-small-room',
    name: 'Small room club kit',
    category: 'drum',
    description:
      'The firm house kit close in a small room, a tail of about a second faint behind every hit.',
    instrument: { deviceId: 'club-kit', params: { kit: 0, snap: 0.5, volume: -2.2 } },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { lowDecay: 1, midDecay: 1.2, mix: 0.35 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-big-hall',
    name: 'Big hall club kit',
    category: 'drum',
    description:
      'The bright house kit in a big hall, a tail of two and a half seconds opening wide behind every hit.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 3, length: 1.2, tone: 0.55, drive: 0.45, width: 0.6, volume: -2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } }],
    preview: 'drum',
  },
  {
    id: 'club-tape-worn',
    name: 'Tape worn club kit',
    category: 'drum',
    description:
      'The dusty house kit long and dull on a worn slow reel, every hit wavering a little in pitch over the hiss.',
    instrument: {
      deviceId: 'club-kit',
      params: {
        kit: 2,
        length: 1.3,
        punch: 0.4,
        snap: 0.35,
        tone: 0.4,
        drive: 0.3,
        variation: 0.2,
        width: 0.3,
        volume: -3,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Worn thin' }],
    preview: 'drum',
  },
  {
    id: 'club-low-tuned',
    name: 'Low tuned club kit',
    category: 'drum',
    description:
      'The firm house kit tuned a fourth down, on white keys with the kick on D, every drum lower and longer, in a small box of a room.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 0, tune: -5, punch: 0.6, snap: 0.4, volume: -2.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.15 } }],
    preview: 'drum',
  },
  {
    id: 'club-high-tuned',
    name: 'High tuned club kit',
    category: 'drum',
    description:
      'The bright house kit tuned a fifth up, on white keys with the kick on D, small and driven, on a small plate.',
    instrument: {
      deviceId: 'club-kit',
      params: {
        kit: 3,
        tune: 7,
        length: 1.15,
        punch: 0.7,
        snap: 0.6,
        drive: 0.6,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.1 } }],
    preview: 'drum',
  },
  {
    id: 'club-wide-tops',
    name: 'Wide tops kit',
    category: 'drum',
    description:
      'The bright house kit with hats, shaker and cymbals far out to the sides and ringing longer, kick and snare in the middle.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 3, length: 1.5, drive: 0.5, width: 0.9, volume: -1.8 },
    },
    effects: [{ deviceId: 'spread', preset: 'Air only', params: { make: 0 } }],
    preview: 'drum',
  },
  {
    id: 'club-narrow',
    name: 'Narrow club kit',
    category: 'drum',
    description:
      'The firm house kit drawn in to the middle, every drum almost in one place, driven a little.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 0, drive: 0.3, width: 0.1, volume: -2 },
    },
    effects: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    preview: 'drum',
  },
  {
    id: 'club-hard-hit',
    name: 'Hard hit kit',
    category: 'drum',
    description:
      'The firm house kit struck hard, the kick falling far and fast with a sharp click, snare and hats biting, through a hard clipper.',
    instrument: {
      deviceId: 'club-kit',
      params: {
        kit: 0,
        length: 0.85,
        punch: 0.95,
        snap: 0.9,
        tone: 0.6,
        variation: 0.03,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 10, toneDb: 0, outputDb: -10, adaa: 1 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-soft-touch',
    name: 'Soft touch club kit',
    category: 'drum',
    description:
      'The deep house kit played soft, no click and almost no fall in the kick, short and close, on a clean slow tape.',
    instrument: {
      deviceId: 'club-kit',
      params: {
        kit: 1,
        length: 0.6,
        punch: 0.12,
        snap: 0.08,
        tone: 0.4,
        variation: 0.15,
        width: 0.2,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.35, wow: 0, flutter: 0, speed: 1, age: 0.1, hiss: 0, bump: 0.6 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-dub-echo',
    name: 'Dub echo kit',
    category: 'drum',
    description:
      'The dusty house kit into a dotted eighth tape echo at 120 whose repeats lose their lows, so the kick is gone after one.',
    instrument: {
      deviceId: 'club-kit',
      params: { kit: 2, length: 0.8, snap: 0.5, volume: -1.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 375,
          feedback: 0.62,
          heads: 0,
          wow: 0.2,
          flutter: 0.1,
          drive: 0.4,
          lowCut: 800,
          highCut: 3000,
          spread: 0.6,
          mix: 0.27,
        },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-plate-clap',
    name: 'Plate clap kit',
    category: 'drum',
    description:
      'The dusty house kit on a bright plate with a gap before it, its tail above the lows loudest behind the clap and the snare.',
    instrument: { deviceId: 'club-kit', params: { kit: 2, snap: 0.55, width: 0.6, volume: -1 } },
    effects: [
      {
        deviceId: 'plate-reverb',
        params: { mix: 0.2, decay: 0.6, damping: 0.15, predelayMs: 30 },
      },
    ],
    preview: 'drum',
  },
  {
    id: 'club-pressed',
    name: 'Pressed club kit',
    category: 'drum',
    description:
      'The firm house kit driven, squeezed by a fast compressor and held under a limiter, the hats up near the kick.',
    instrument: { deviceId: 'club-kit', params: { kit: 0, drive: 0.5, volume: 0 } },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 6, outputGain: -3 } },
      { deviceId: 'ambient-limiter', params: { ceiling: -12, ride: 0 } },
    ],
    preview: 'drum',
  },
]
