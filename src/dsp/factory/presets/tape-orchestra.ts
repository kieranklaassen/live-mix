import { type FactoryPreset } from '../types'

export const TAPE_ORCHESTRA_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'reel-of-strings',
    name: 'Reel of strings',
    category: 'string',
    description: 'A small violin section swelling in from tape, drifting slowly in a long plate.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Slow strings', params: { volume: -7 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'half-speed-horns',
    name: 'Half-speed horns',
    category: 'pad',
    description:
      'French horns on tape slowed to half speed, an octave down, in a very large space.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { volume: -11.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'worn-reel-choir',
    name: 'Worn reel choir',
    category: 'voice',
    description: 'A choir on tired tape that wobbles, drops out and repeats into a hall.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Worn choir', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { feedback: 0.45, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'eight-second-flutes',
    name: 'Eight-second flutes',
    category: 'wind',
    preview: 'keys',
    description:
      'Breathy flutes with eight seconds of tape under each key, an echo and a small plate.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Flutes on tape', params: { volume: -6 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.22 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lost-reel',
    name: 'Lost reel',
    category: 'texture',
    description:
      'A ruined flute tape at half speed: hiss, dropouts and seasick pitch in a long dark tail.',
    instrument: { deviceId: 'tape-orchestra', preset: 'Lost reel', params: { volume: -6.5 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.35 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'tape-cello-section',
    name: 'Tape cello section',
    category: 'string',
    preview: 'low',
    description: 'Cellos from clean tape at normal speed, bowed in gently, in a warm hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: {
        speed: 0,
        attack: 0.2,
        release: 0.9,
        players: 0.5,
        vibrato: 0.45,
        age: 0.2,
        hiss: 0.12,
        tone: 0.1,
        spread: 0.6,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, damping: 0.65 } }],
  },
  {
    id: 'brisk-tape-strings',
    name: 'Brisk tape strings',
    category: 'string',
    description:
      'A violin section from fresh tape that speaks at once, a little bright, in a room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        attack: 0.1,
        release: 0.5,
        players: 0.65,
        vibrato: 0.55,
        tone: 0.3,
        age: 0.15,
        hiss: 0.1,
        volume: -10.5,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'close-tape-horns',
    name: 'Close tape horns',
    category: 'wind',
    preview: 'chord',
    description:
      'French horns from clean tape, quick to speak with little vibrato, close in a tight chamber.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: {
        attack: 0.04,
        release: 0.4,
        tone: 0.6,
        age: 0.12,
        hiss: 0.08,
        vibrato: 0.12,
        players: 0.35,
        volume: -11,
      },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Tight chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'one-taped-reed',
    name: 'One taped reed',
    category: 'wind',
    description:
      'The reed tape with its players as one, a single line with vibrato, a faint echo and a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        players: 0,
        vibrato: 0.65,
        spread: 0.15,
        attack: 0.08,
        release: 0.5,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'tape-flute-pipes',
    name: 'Tape flute pipes',
    category: 'organ',
    description:
      'Tape flutes with no vibrato, played as one like small organ pipes, in a slow rotary speaker.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        length: 9,
        players: 0,
        vibrato: 0,
        release: 0.1,
        tone: -0.2,
        age: 0.1,
        hiss: 0.1,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'reed-organ-reel',
    name: 'Reed organ reel',
    category: 'organ',
    description:
      'Reeds from tape with no vibrato and octaves added below and above, like a reed organ under a slow tremolo.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        players: 0.2,
        vibrato: 0,
        release: 0.15,
        tone: -0.35,
        age: 0.35,
        hiss: 0.25,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ', params: { sub2: 0 } },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'short-bow-strings',
    name: 'Short bow strings',
    category: 'string',
    preview: 'bells',
    description:
      'A few violins with the bow scrape left in and a fast release, a slap echo and a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: {
        attack: 0.005,
        release: 0.07,
        players: 0.25,
        vibrato: 0,
        age: 0.3,
        hiss: 0.2,
        tone: 0.35,
        spread: 0.5,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'two-second-choir',
    name: 'Two second choir',
    category: 'voice',
    description:
      'A choir with two seconds of tape under each key: a held chord runs out into a murky echo.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { length: 2, attack: 0.03, vibrato: 0.3, spread: 0.8 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky' },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
  },
  {
    id: 'soprano-hall-choir',
    name: 'Soprano hall choir',
    category: 'voice',
    description:
      'A choir from fresh tape, opened up and slow to swell, in a hall whose long tail sings a high ah back.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: {
        tone: 1,
        age: 0.1,
        hiss: 0.05,
        vibrato: 0.15,
        players: 1,
        attack: 1.2,
        release: 3,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'muffled-horn-pad',
    name: 'Muffled horn pad',
    category: 'pad',
    description:
      'Horns turned fully dark and slow to swell, copied to a dull cassette, far back in a dark cave: the top octave is faint.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: {
        tone: -1,
        attack: 1.5,
        release: 3.5,
        players: 1,
        vibrato: 0.1,
        age: 0.4,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { tone: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'parlour-strings',
    name: 'Parlour strings',
    category: 'string',
    description:
      'Violins with heavy vibrato on a shellac disc playing in a small room: narrow, crackling, nearly mono.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        vibrato: 1,
        players: 1,
        attack: 0.25,
        release: 1.2,
        age: 0.6,
        hiss: 0.4,
        tone: 0.1,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78' },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'low-reed-drone',
    name: 'Low reed drone',
    category: 'drone',
    description:
      'Reeds at half speed with no vibrato, an octave down, under a slow flanger sweep in a dark hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        speed: 1,
        players: 0.15,
        vibrato: 0,
        attack: 1.5,
        release: 4,
        tone: 0.5,
        age: 0.3,
        hiss: 0.1,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Dark hall' },
    ],
  },
  {
    id: 'tape-flute-chimes',
    name: 'Tape flute chimes',
    category: 'bell',
    description:
      'Struck tape flute notes that ring on after the key, answered in climbing octaves by a grain delay, in an airy hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        length: 2,
        attack: 0.005,
        release: 2.2,
        tone: 0.8,
        vibrato: 0.2,
        age: 0.2,
        hiss: 0.1,
        spread: 0.35,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { spread: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Airy tail' },
    ],
  },
  {
    id: 'backwards-horns',
    name: 'Backwards horns',
    category: 'pad',
    description:
      'Horns from tape under their own reversed one second pieces, which swell and cut off, in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.4, release: 1.5, volume: -10 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards only', params: { spread: 0.15, mix: 0.7 } },
      { deviceId: 'zita-rev1', preset: 'Hall' },
    ],
  },
  {
    id: 'wireless-strings',
    name: 'Wireless strings',
    category: 'string',
    description: 'A mono string tape heard through a small medium wave radio speaker in a room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: {
        spread: 0,
        age: 0.6,
        hiss: 0.3,
        attack: 0.3,
        release: 1,
        tone: 0.3,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { interference: 0 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
]
