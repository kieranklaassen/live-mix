import { type FactoryPreset } from '../types'

// Wooden bars, bronze and skin played with soft mallets in a real room: short
// figures set against their own echoes so patterns turn round each other.
// Rooms stay small and tape stays light, so every attack is still heard.

export const PRESETS: readonly FactoryPreset[] = [
  // Mallets: the marimba and its patterns, vibraphone, dry bars.
  {
    id: 'rosewood-yarn-pattern',
    name: 'Yarn pattern',
    category: 'bell',
    description:
      'A soft marimba figure with an echo three quarters of a beat behind, so two patterns turn round each other in a room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.3, resonator: 0.85, width: 0.6, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.3, modDepth: 0.08, tone: 5000, age: 0.15, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-five-against-four',
    name: 'Five against four',
    category: 'bell',
    description:
      'Harder mallets on short bars, with echoes at four fifths of the beat: five repeats lie across every four notes.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.75, decay: 0.6, resonator: 0.45, width: 0.4, volume: -2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: {
          time: 400,
          feedback: 0.5,
          modDepth: 0.05,
          tone: 6000,
          age: 0.1,
          spread: 0.8,
          mix: 0.35,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-two-passes',
    name: 'Two passes',
    category: 'bell',
    description:
      'Bars touched so softly there is no knock, only the tone of the tubes, laid over itself on a two-second tape loop.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.05, decay: 1.3, resonator: 1, width: 0.6, volume: -6 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.55, wear: 0.4, wow: 0.15, spread: 0.4, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.18 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-low-bars-rolling',
    name: 'Low bars rolling',
    category: 'bell',
    description:
      'The lowest bars rolled fast with soft mallets into a steady deep hum of wood and tube, on clean tape in a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.35, decay: 1.5, roll: 12, width: 0.5, volume: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4, hiss: 0.05 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.28 } },
    ],
    preview: 'low',
  },
  {
    id: 'rosewood-held-roll',
    name: 'Held roll',
    category: 'bell',
    description:
      'A chord held by slow rolling, each stroke heard, with a bank of tuned strings ringing in sympathy behind it.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.25, resonator: 0.9, roll: 4.5, width: 0.7, volume: -14 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { strings: 8, decay: 4, mix: 0.25, width: 0.7 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'rosewood-motor-off',
    name: 'Motor off',
    category: 'bell',
    description:
      'A vibraphone with its fans stopped, played with soft mallets: plain metal tones ringing into a short plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.2, decay: 2.2, damper: 0.2, width: 0.6, volume: -7.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { decay: 0.55, mix: 0.25 } }],
  },
  {
    id: 'rosewood-slow-fans',
    name: 'Slow fans',
    category: 'bell',
    description:
      'A vibraphone with the fans turning slowly, about twice a second, the low tone throbbing on tape in a hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.35, decay: 1.8, motor: 0.8, motorRate: 2.2, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.15, flutter: 0.1, hiss: 0.1 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'rosewood-gourd-bars',
    name: 'Gourd bars',
    category: 'bell',
    description:
      'Hard sticks on dry wooden bars with a little buzz added, as a gourd xylophone has, close in a small dark room.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.9, decay: 0.5, resonator: 0.7, volume: -3 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube Preamp',
        params: { driveDb: 9, bias: 0.25, toneDb: 0, outputDb: -4, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.22 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-restruck-bars',
    name: 'Restruck bars',
    category: 'bell',
    description:
      'Small steel bars struck once and restruck by a cascade, some an octave up, quieter each time, in a short halo.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, resonator: 0.2, width: 0.4, volume: -8 },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Restruck',
        params: { time: 250, repeats: 5, decay: 0.45, high: 0.4, mix: 0.3 },
      },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.3 } },
    ],
  },

  // Handpan: steel and tongue drums played as slit logs, hand drums and gongs.
  {
    id: 'rosewood-slit-log',
    name: 'Slit log',
    category: 'bell',
    description:
      'A tongue drum damped short and struck firmly so it knocks like a slit log, with the air of the box under it.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: {
        decay: 1.5,
        touch: 0.55,
        position: 0.3,
        shimmer: 0.1,
        cavity: 0.85,
        sympathy: 0.2,
        damp: 0.4,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Small swarm', params: { mix: 0.25 } }],
    preview: 'keys',
  },
  {
    id: 'rosewood-palm-pattern',
    name: 'Palm pattern',
    category: 'bell',
    description:
      'Damped taps near the rim, repeated on the half beat by a dark echo until hands and echoes make one drum pattern.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { decay: 1, touch: 0.7, cavity: 0.7, damp: 0.85, volume: -1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.45, modDepth: 0.1, tone: 3500, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-centre-note',
    name: 'Centre note',
    category: 'bell',
    description:
      'The low centre note of the pan struck with the flat of the hand, with tuned strings humming after it in a hall.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 9, touch: 0.3, cavity: 1, sympathy: 0.7, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long resonance',
        params: { sympathy: 0.5, decay: 7, mix: 0.3, width: 0.6 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-edge-and-patter',
    name: 'Edge and patter',
    category: 'bell',
    description:
      'Knuckles on the edge of the pan, hard and short, scattered by a patter of close echoes like other players.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { decay: 2, touch: 0.85, position: 1, shimmer: 0.6, damp: 0.3, volume: -4 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'rosewood-answering-steel',
    name: 'Answering steel',
    category: 'bell',
    description:
      'The pan touched as lightly as it will speak, so the notes already ringing answer each new one, in a still room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { decay: 7, touch: 0.05, position: 0.5, shimmer: 0.5, sympathy: 1, volume: -3.5 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } }],
    preview: 'keys',
  },
  {
    id: 'rosewood-sunk-drum',
    name: 'Sunk drum',
    category: 'bell',
    description:
      'A tongue drum whose notes come back an octave lower and half as fast underneath it, in a wooden room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 7, touch: 0.2, position: 0.2, volume: -4 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1000, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.6, mix: 0.25 } },
    ],
    preview: 'keys',
  },

  // Bells: bowls, gongs, hanging bells, thumb piano.
  {
    id: 'rosewood-struck-bowl',
    name: 'Struck bowl',
    category: 'bell',
    description:
      'A bronze bowl struck with a wooden stick and left alone: two close tones beating slowly in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { decay: 14, damping: 0.35, hardness: 0.55, position: 0.2, detune: 1.2, volume: -8 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'rosewood-rubbed-rim',
    name: 'Rubbed rim',
    category: 'bell',
    description:
      'One bowl rubbed round its rim until it sings without a strike, with tuned strings humming along behind it.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { decay: 20, hardness: 0.15, detune: 0.8, release: 0.1, volume: -5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 0.5, decay: 5, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
    preview: 'hold',
  },
  {
    id: 'rosewood-great-gong',
    name: 'Great gong',
    category: 'bell',
    description:
      'A large gong struck off centre with a heavy beater, the crash settling into a long hum, on tape in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { damping: 0.3, hardness: 0.7, brightness: 0.75, spread: 0.7, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { lowDecay: 4, mix: 0.35 } },
    ],
    preview: 'hold',
  },
  {
    id: 'rosewood-kettle-gongs',
    name: 'Kettle gongs',
    category: 'bell',
    description:
      'Small bossed gongs with a short ring, each stroke echoed every third of a second so a slow pattern forms.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        decay: 3,
        damping: 0.65,
        hardness: 0.8,
        position: 0.1,
        detune: 0.5,
        brightness: 0.7,
        spread: 0.4,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 333, feedback: 0.4, modDepth: 0.1, tone: 5000, mix: 0.3 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-thumb-piano',
    name: 'Thumb piano',
    category: 'bell',
    description:
      'Metal tongues on a wooden box plucked with the thumbs, a thin buzz riding on each note, in a room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { hardness: 0.7, brightness: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit', params: { drive: 0.6, mix: 0.2 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-bowed-bars',
    name: 'Bowed bars',
    category: 'bell',
    description:
      'Tuned metal bars with the strike taken off by a swell, so each one speaks as if drawn with a bow, in a plain hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 6, hardness: 0.6, position: 0.15, brightness: 0.55, volume: 2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rosewood-hanging-bell',
    name: 'Hanging bell',
    category: 'bell',
    description:
      'A bronze temple bell struck by a swinging beam: a soft thud, a dark hum and a slow beat, in an open hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 30, damping: 0.55, hardness: 0.3, detune: 0.4, brightness: 0.3, volume: -5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.3 } }],
    preview: 'hold',
  },

  // Harp: koto and its relatives, plucked hard, pressed, damped and swept.
  {
    id: 'rosewood-koto-figure',
    name: 'Koto figure',
    category: 'plucked',
    description:
      'Koto strings plucked firmly near the bridge onto hot tape, with echoes at two thirds of the beat weaving a second line.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.12, touch: 0.55, decay: 1.4, volume: 0 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: 0 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: {
          time: 333,
          feedback: 0.35,
          modDepth: 0.1,
          tone: 5500,
          age: 0.2,
          spread: 0.7,
          mix: 0.28,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-pressed-silk',
    name: 'Pressed silk',
    category: 'plucked',
    description:
      'Silk strings plucked softly while the other hand presses behind the bridge, bending every note, on light tape.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { touch: 0.3, decay: 1.8, halo: 0.6, bend: 150, body: 0.85, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.12, flutter: 0.08, hiss: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-bridge-taps',
    name: 'Bridge taps',
    category: 'plucked',
    description:
      'A koto plucked right at the bridge and damped by the hand, pushed into grit: more drum than string.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { pluck: 0.05, touch: 0.8, decay: 0.7, damp: 0.3, halo: 0.15, body: 0.9, volume: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm Glue', params: { driveDb: 15, outputDb: -6.5 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { predelayMs: 0, mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-swept-zheng',
    name: 'Swept zheng',
    category: 'plucked',
    description:
      'A hand swept across the strings of a zheng for each chord, with a bank of tuned strings ringing on after it.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { touch: 0.6, halo: 0.9, sweep: 1.2, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Glass harp',
        params: { root: 0, sympathy: 0.6, decay: 6, mix: 0.35, width: 0.7 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
    preview: 'chord',
  },
  {
    id: 'rosewood-stopped-harp',
    name: 'Stopped harp',
    category: 'plucked',
    description:
      'Harp strings stopped with the palm, dry as wooden bars, repeated by two tape heads in a small dark room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { touch: 0.45, volume: -2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Discreet',
        params: { time: 250, feedback: 0.35, heads: 1, highCut: 5000, spread: 0.5, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-mid-string',
    name: 'Mid string',
    category: 'plucked',
    description:
      'A harp plucked softly at the middle of the string for a hollow, long tone, heard from across a quiet room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.5, body: 0.4, volume: -2 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -46 } },
    ],
  },

  // Flute: bamboo, blown bottles, clay whistles and bird calls.
  {
    id: 'rosewood-bamboo-breath',
    name: 'Bamboo breath',
    category: 'wind',
    description:
      'An end-blown bamboo flute, more breath than tone, scooping up into each note, in a hall that whispers back.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.7, blow: 0.5, chiff: 1, release: 0.9, scoop: 150, volume: -12 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering hall', params: { mix: 0.3 } }],
  },
  {
    id: 'rosewood-blown-bottles',
    name: 'Blown bottles',
    category: 'wind',
    description:
      'Breath across the necks of tuned bottles, short and hollow, echoed on the half beat into a hocket.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.7, blow: 0.35, chiff: 1, release: 0.3, scoop: 10, volume: -13 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.4, modDepth: 0.1, tone: 4500, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-clay-whistle',
    name: 'Clay whistle',
    category: 'wind',
    description:
      'A small clay vessel flute: nearly a pure tone with a little chiff, and one close tape echo in a small room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        breath: 0.2,
        blow: 0.2,
        chiff: 0.25,
        attack: 0.03,
        release: 0.3,
        vibrato: 0.1,
        scoop: 30,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Discreet', params: { time: 180, feedback: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-breath-bed',
    name: 'Breath bed',
    category: 'wind',
    description:
      'Low flutes blown so softly they are mostly air, swelling in slowly as a bed under struck things.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.9, blow: 0.2, release: 3, vibrato: 0.15, volume: -16 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
  {
    id: 'rosewood-painted-birds',
    name: 'Painted birds',
    category: 'wind',
    description:
      'Short calls on a wooden whistle, each scooping up like a bird, with stray calls and far echoes drifting back.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        breath: 0.25,
        blow: 0.6,
        chiff: 0.8,
        attack: 0.008,
        release: 0.15,
        vibrato: 0.9,
        scoop: 200,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 6, mix: 0.25 } },
    ],
    preview: 'bells',
  },
  {
    id: 'rosewood-far-bamboo',
    name: 'Far bamboo',
    category: 'wind',
    description:
      'A bamboo flute blown hard at the far end of a stone hall, so the room speaks as much as the player.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.4,
        blow: 0.7,
        chiff: 0.5,
        attack: 0.08,
        release: 1.2,
        vibrato: 0.7,
        scoop: 80,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Dark', params: { highCut: 6000 } },
      { deviceId: 'zita-rev1', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
  },

  // Zither: hammered courses, a long bridged zither, open strums.
  {
    id: 'rosewood-hammered-figure',
    name: 'Hammered figure',
    category: 'plucked',
    description:
      'Light hammers on paired strings over a wooden box, with a dotted tape echo answering and the open strings ringing.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        chord: 0,
        strum: 0,
        roll: 0,
        decay: 4,
        release: 2,
        brightness: 0.55,
        courses: 0.4,
        sympathy: 0.4,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Space echo',
        params: { time: 330, feedback: 0.3, heads: 3, wow: 0.15, highCut: 5000, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-rolled-courses',
    name: 'Rolled courses',
    category: 'plucked',
    description:
      'Paired strings rolled with two light hammers and doubled at the octave, until the chord shimmers over its box.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 11, decay: 6, sympathy: 0.7, volume: -14 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Long plate', params: { decay: 0.75, mix: 0.22 } }],
    preview: 'chord',
  },
  {
    id: 'rosewood-thirteen-strings',
    name: 'Thirteen strings',
    category: 'plucked',
    description:
      'A long zither with movable bridges picked close to the bridge, the unplayed strings answering, in a still room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 4, release: 2, brightness: 0.7, position: 0.08, sympathy: 0.5, volume: -4 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-open-strum',
    name: 'Open strum',
    category: 'plucked',
    description:
      'A slow thumb drawn across an open tuning, up and then down, each chord left to ring through a plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        exciter: 0,
        chord: 5,
        strum: 400,
        direction: 2,
        decay: 9,
        courses: 0.3,
        sympathy: 0.5,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'ambient-live', params: { decay: 0.6, mix: 0.25 } }],
  },
  {
    id: 'rosewood-felt-hammer-string',
    name: 'Felt hammer string',
    category: 'plucked',
    description:
      'One string under a felt hammer: a soft knock and a dull long tone, on tape in a small room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 6, brightness: 0.3, position: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.15, hiss: 0.15 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-strings-behind',
    name: 'Strings behind',
    category: 'plucked',
    description:
      'Short plucked notes that stop at once, leaving only the twelve sympathetic strings ringing behind them.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        exciter: 0,
        chord: 0,
        strum: 0,
        decay: 1.2,
        release: 0.2,
        brightness: 0.5,
        position: 0.15,
        courses: 0,
        sympathy: 1,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 6000, mix: 0.2 } },
    ],
  },

  // Tanpura: a drone that is also a slow pattern.
  {
    id: 'rosewood-four-string-round',
    name: 'Four string round',
    category: 'drone',
    description:
      'Four strings plucked round and round, one every half second, so the drone is also a slow pattern.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.4, speed: 2, decay: 5, body: 0.5, volume: -4 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-monochord-floor',
    name: 'Monochord floor',
    category: 'drone',
    description:
      'Plain strings with no buzz, plucked rarely and left to ring, with a bank of tuned strings humming under them.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 9, spread: 0.6, volume: -4 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { root: 0, sympathy: 0.5, strings: 6, decay: 8, mix: 0.3, width: 0.6 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
  },
  {
    id: 'rosewood-buzzing-bridge',
    name: 'Buzzing bridge',
    category: 'drone',
    description:
      'The bridge set to its fullest buzz, so every pluck opens into a slow sweep of overtones, on clean tape.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 1, decay: 14, spread: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-evening-seventh',
    name: 'Evening seventh',
    category: 'drone',
    description:
      'The seventh in place of the fifth, laid over itself on a slow tape loop so the plucks drift out of step.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { jawari: 0.6, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3.3, feedback: 0.6, wear: 0.3, spread: 0.5, mix: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-bridge-overtones',
    name: 'Bridge overtones',
    category: 'drone',
    description:
      'The low strings cut away so only the slow sweep of overtones off the curved bridge is left, thin and high, on a plate.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { jawari: 0.9, speed: 6, decay: 20, body: 0.1, volume: 3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 400, body: -6, presence: 3 } },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rosewood-fourth-and-octave',
    name: 'Fourth and octave',
    category: 'drone',
    description:
      'Plucks in the fourth tuning, each echoed an octave higher by a stepped delay, like harmonics touched after.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { speed: 4, decay: 10, volume: -3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 500, feedback: 0.35, tone: 5000, mix: 0.3 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // Acoustic guitar: stopped strings as wood blocks, a plectrum lute.
  {
    id: 'rosewood-stopped-nylon',
    name: 'Stopped nylon',
    category: 'plucked',
    description:
      'Nylon strings choked by the heel of the hand into dry knocks, hot on tape, with a plain repeat close behind.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { type: 1, body: 0.9, nail: 0.2, sustain: 1.5, release: 0.15, tone: 0.45, volume: 6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.9, output: 0 } },
      {
        deviceId: 'grain-delay',
        preset: 'Plain repeat',
        params: { time: 375, feedback: 0.3, tone: 6000, spread: 0.4, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-broad-plectrum-strings',
    name: 'Broad plectrum strings',
    category: 'plucked',
    description:
      'Steel strings struck near the bridge with a broad plectrum: a snap and a thin short tone, in a bare room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: {
        body: 0.8,
        position: 0.1,
        nail: 0.7,
        sustain: 2.5,
        release: 0.6,
        tone: 0.7,
        strum: 0,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Atmosphere: weather outside the studio door.
  {
    id: 'rosewood-rain-on-leaves',
    name: 'Rain on leaves',
    category: 'texture',
    description:
      'Steady rain on broad leaves outside the studio door, close and dry, for a pattern to sit under.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.6, tone: 0.4, size: 0.25, attack: 1.5, width: 0.7, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.9, hiss: 0 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-wind-in-cane',
    name: 'Wind in cane',
    category: 'texture',
    description:
      'Wind whistling across cut cane at the pitch of the key, rising and dying away, in a hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { density: 0.5, movement: 0.7, tone: 0.5, resonance: 0.85, width: 0.7, volume: -2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } }],
  },

  // Aurora: bronze made from a ring modulator.
  {
    id: 'rosewood-bronze-swell',
    name: 'Bronze swell',
    category: 'pad',
    description:
      'A ring-modulated chord that rises like a gong rubbed with a soft beater, metallic and slow, in a hall.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 1400, attack: 1.5, swell: 0.8, ring: 0.7, volume: -10 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'rosewood-bowed-metal',
    name: 'Bowed metal',
    category: 'pad',
    description:
      'One metallic tone swelling over three seconds, like a cymbal edge under a bow, on a short plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: {
        brilliance: 5000,
        lowCut: 250,
        resonance: 0.4,
        contour: 0.2,
        attack: 3,
        swell: 1,
        release: 5,
        ring: 1,
        volume: 0,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3 } }],
    preview: 'hold',
  },

  // Bow: strings bowed like metal bars, and a low gut fifth.
  {
    id: 'rosewood-whistling-bow',
    name: 'Whistling bow',
    category: 'string',
    description:
      'Strings bowed lightly and slowly without vibrato, a pale even tone like a bowed metal bar, in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 2, pressure: 0.2, body: 0.2, vibrato: 0, detune: 4, volume: -15 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } }],
  },
  {
    id: 'rosewood-low-gut-bow',
    name: 'Low gut bow',
    category: 'string',
    description:
      'A low open fifth under a slow heavy bow, all body and rosin, close in a wooden room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 1, pressure: 0.6, body: 0.9, vibrato: 0.05, volume: -9 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'low',
  },

  // Chamber strings: a still floor, and one fiddle.
  {
    id: 'rosewood-still-section',
    name: 'Still section',
    category: 'string',
    description:
      'A small muted section holding a chord without vibrato, entering slowly, as a still floor under mallets.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 1.5, bow: 0.2, air: 0.4, mute: 0.6, scatter: 0.2, volume: -9 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-spike-fiddle',
    name: 'Spike fiddle',
    category: 'string',
    description:
      'One bowed fiddle played close with a pressed, nasal tone and a wide shake, in a small room.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.1, bow: 0.7, air: 0.35, vibrato: 25, volume: -4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'line',
  },

  // Choir: chant in a temple hall.
  {
    id: 'rosewood-low-chant',
    name: 'Low chant',
    category: 'voice',
    description:
      'Low voices of men on one closed vowel over an open fifth, without vibrato, in a hall that hums the vowel back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { ensemble: 0.6, attack: 1.2, tone: 3000, volume: -7 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 6, mix: 0.3 } }],
    preview: 'low',
  },
  {
    id: 'rosewood-hummed-line',
    name: 'Hummed line',
    category: 'voice',
    description:
      'One singer humming a slow line on a closed vowel, with a small chapel singing the vowel back.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 1,
        voice: 1.2,
        breath: 0.3,
        ensemble: 0.15,
        vibrato: 6,
        attack: 0.25,
        release: 1,
        tone: 5000,
        volume: -5.5,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { vowel: 4, mix: 0.25 } },
    ],
    preview: 'line',
  },

  // Chord harp: single plates and a slow downstroke.
  {
    id: 'rosewood-single-plates',
    name: 'Single plates',
    category: 'plucked',
    description:
      'Single plucked chimes with no strum, each followed by quieter copies that step up in octaves and fifths.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { sustain: 2, tone: 0.55, volume: -3 },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Rising steps',
        params: { time: 250, repeats: 4, decay: 0.5, high: 0.6, mix: 0.25 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-slow-downstroke',
    name: 'Slow downstroke',
    category: 'plucked',
    description:
      'Each chord drawn slowly from the top down across four octaves of plucked strings, close on a short plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 150, direction: 1, sustain: 5, tone: 0.15, pad: 0.1, volume: -1.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } }],
  },

  // Clarinet: a hard nasal reed, and a bass reed under its tone.
  {
    id: 'rosewood-court-reed',
    name: 'Court reed',
    category: 'wind',
    description:
      'A reed pipe blown hard and nasal with a slow shake and a little growl, the lead of a court ensemble, in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { blow: 0.6, breath: 0.4, attack: 0.3, vibrato: 0.5, growl: 0.2, volume: -3 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'rosewood-bass-reed-breath',
    name: 'Bass reed breath',
    category: 'wind',
    description:
      'A bass clarinet blown under its tone, half air, holding a low fifth with slow entries in a room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.3, breath: 0.7, attack: 0.5, release: 1.5, volume: -6 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
    preview: 'low',
  },

  // Drone: what bronze leaves behind.
  {
    id: 'rosewood-after-the-gong',
    name: 'After the gong',
    category: 'drone',
    description:
      'The hum a large gong leaves once the crash has gone: low partials rising and falling against each other.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        shape: 3,
        partials: 0.7,
        wave: 0.1,
        movement: 0.6,
        rate: 0.05,
        sub: 0.4,
        air: 0.05,
        cutoff: 700,
        attack: 4,
        release: 10,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.25 } }],
  },
  {
    id: 'rosewood-seven-bowls',
    name: 'Seven bowls',
    category: 'drone',
    description:
      'A cluster of close pure tones wandering in level, like bowls of several sizes all left ringing.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: {
        partials: 0.8,
        movement: 0.8,
        rate: 0.1,
        air: 0.2,
        cutoff: 2500,
        attack: 6,
        volume: -2,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } }],
    preview: 'hold',
  },

  // Dusk: the one synthesizer among the wood.
  {
    id: 'rosewood-square-figure',
    name: 'Square figure',
    category: 'keys',
    description:
      'Square-wave notes with a quick start and a short fall, a synthesizer taking a mallet part, with dark repeats and a spring.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: {
        sub: 0.2,
        cutoff: 700,
        resonance: 0.2,
        envelope: 0.6,
        attack: 0.002,
        release: 0.35,
        chorus: 1,
        volume: -11,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-studio-dusk',
    name: 'Studio dusk',
    category: 'pad',
    description:
      'A low-passed chorus pad that takes a second and a half to arrive, on tape: the one synthesizer among the wood.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0.5, cutoff: 500, attack: 1.5, release: 4, chorus: 2, volume: -12 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // Ember: a gong from two sines, a rattle from noise.
  {
    id: 'rosewood-sine-gong',
    name: 'Sine gong',
    category: 'bell',
    description:
      'Two sines a twelfth apart pushed out of tune by a frequency shifter until they clang like a small gong.',
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { oscMix: 0.35, cutoff: 6000, ampDecay: 4, ampRelease: 4, volume: 2 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Bell metal',
        params: { shift: 87, feedback: 0.2, width: 0.5, mix: 0.45 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rosewood-seed-rattle',
    name: 'Seed rattle',
    category: 'texture',
    description:
      'Filtered noise shaken eight times a second for as long as a key is held, seeds in a gourd, with a quick echo.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        filterSlope: 0,
        cutoff: 2600,
        resonance: 0.1,
        filterEnvAmount: 0,
        ampAttack: 0.005,
        ampDecay: 0.3,
        ampSustain: 0.8,
        ampRelease: 0.1,
        lfo1Shape: 2,
        lfo1Rate: 8,
        lfo1Dest: 2,
        lfo1Amount: 1,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 125, feedback: 0.3, modDepth: 0.1, tone: 6000, mix: 0.25 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },

  // Felt piano: a figure that keeps itself going, and a piano made to clank.
  {
    id: 'rosewood-felt-ostinato',
    name: 'Felt ostinato',
    category: 'keys',
    description:
      'A felted piano figure with its last two seconds looping softly underneath, as if a second player kept it going.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { hardness: 0.2, reverbMix: 0.1, polyphony: 16, outputDb: -13.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 2, mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-wedged-strings',
    name: 'Wedged strings',
    category: 'keys',
    description:
      'A piano with stiff, mistuned strings and hard hammers, so each note clanks a little like struck metal.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        hardness: 0.8,
        detune: 0.9,
        stiffness: 1.9,
        grit: 0.4,
        resonance: 0.3,
        reverbMix: 0,
        polyphony: 16,
        outputDb: -10,
      },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } }],
  },

  // FM bells: bronze pots and temple blocks from four operators.
  {
    id: 'rosewood-bronze-pots',
    name: 'Bronze pots',
    category: 'bell',
    description:
      'Inharmonic bell tones with a slow beat between detuned pairs, like a rack of small bronze pots, on tape.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        ratio: 2,
        brightness: 0.35,
        decay: 5,
        release: 4,
        detune: 8,
        feedback: 0,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.15, hiss: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rosewood-temple-blocks',
    name: 'Temple blocks',
    category: 'bell',
    description:
      'Short hollow knocks tuned like wooden temple blocks, with echoes at two thirds of the beat filling in a pattern.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        ratio: 6,
        brightness: 0.5,
        decay: 0.18,
        release: 0.1,
        detune: 0,
        velocity: 0.9,
        spread: 0.5,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 333, feedback: 0.5, modDepth: 0.05, tone: 5000, mix: 0.35 },
      },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.25 } },
    ],
    preview: 'keys',
  },

  // Grain: whatever is loaded, rolled or held still.
  {
    id: 'rosewood-loaded-roll',
    name: 'Loaded roll',
    category: 'pad',
    description:
      'Whatever is loaded, cut to one short grain and repeated fast from the same spot, like a roll with two mallets.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: {
        position: 0.2,
        scan: 0,
        size: 90,
        density: 1.2,
        shape: 0.7,
        attack: 0.01,
        release: 0.5,
        tone: 9000,
        volume: -14,
      },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-held-resonance',
    name: 'Held resonance',
    category: 'pad',
    description:
      'One instant of whatever is loaded held still, like the ring of a struck thing stopped in time, in a hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: { position: 0.5, size: 500, attack: 0.8, release: 4, tone: 5000, volume: -20 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } }],
  },

  // Guitar: a small canon, and steel rubbed like a gong.
  {
    id: 'rosewood-small-canon',
    name: 'Small canon',
    category: 'plucked',
    description:
      'Palm-muted steel notes answered a beat later by copies a fifth above and a fourth below: a small canon.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { hardness: 0.3, sustain: 2.5, tone: 3000, warmth: 0.9, volume: 2 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octaves both',
        params: {
          pitchA: 7,
          pitchB: -5,
          levelB: 0.7,
          delay: 307,
          tone: 6000,
          spread: 0.7,
          mix: 0.4,
        },
      },
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.85, output: 0 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-rubbed-wire',
    name: 'Rubbed wire',
    category: 'pad',
    description:
      'Steel strings with the pick taken away by a slow swell, so a chord rises like a rubbed gong, in a hall.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { hardness: 0.3, sustain: 20, tone: 2500, swell: 1.5, volume: 6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue', params: { makeup: 5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // Horns: a shell trumpet, and a low floor for gongs.
  {
    id: 'rosewood-shell-horns',
    name: 'Shell horns',
    category: 'wind',
    description:
      'A horn blown like a shell trumpet, each call answered by two more, a fourth below and a third above, in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.45, breath: 0.4, section: 0, attack: 0.5, release: 1.5, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Diatonic thirds',
        params: {
          root: 2,
          scale: 4,
          v1Degrees: -3,
          v1Level: -6,
          v1Pan: -60,
          v1Delay: 400,
          v2Degrees: 2,
          v2Level: -9,
          v2Pan: 60,
          v2Delay: 500,
          output: 4,
        },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'rosewood-brass-under-the-gongs',
    name: 'Brass under the gongs',
    category: 'wind',
    description:
      'Low brass entering over three seconds and barely blown, a soft floor for gongs to stand on, on tape.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.3, section: 0.8, attack: 3, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.25 } },
    ],
    preview: 'low',
  },

  // Ladder bass: a big drum and a pedal.
  {
    id: 'rosewood-big-drum',
    name: 'Big drum',
    category: 'keys',
    description:
      'A synthesizer bass shut down to a thump and tuned low like a big skin drum, a slow tape echo keeping time.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: {
        wave: 0.8,
        sub: 0.6,
        cutoff: 200,
        emphasis: 0.3,
        contour: 1,
        decay: 0.3,
        drive: 0.6,
        glide: 0,
        volume: 1.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Space echo',
        params: { time: 500, feedback: 0.4, lowCut: 40, highCut: 3000, mix: 0.35 },
      },
      { deviceId: 'shaped-reverb', preset: 'Gated room', params: { lowCut: 40, mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'rosewood-pedal-under-bars',
    name: 'Pedal under bars',
    category: 'keys',
    description:
      'A plain low pedal with slow beating and a sub octave, to hold the ground under a marimba pattern.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 4, sub: 0.7, cutoff: 350, drive: 0.2, volume: -12.5 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } }],
    preview: 'low',
  },

  // Organ: the pump organ in the corner of the studio.
  {
    id: 'rosewood-pump-reeds',
    name: 'Pump reeds',
    category: 'organ',
    description:
      'A small pump organ with its reeds out and the bellows audibly breathing, close in a room.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { reed: 0.8, breath: 0.5, bellows: 0.9, attack: 0.25, volume: -15 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.22 } }],
  },
  {
    id: 'rosewood-reed-floor',
    name: 'Reed floor',
    category: 'organ',
    description:
      'A harmonium holding an open fifth while the bellows rise and fall, two reed ranks beating, on tape.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0.6,
        octave: 0.3,
        reed: 0.5,
        celeste: 0.5,
        bellows: 0.6,
        attack: 1,
        release: 3,
        tone: 2000,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { breathDepth: 0, mix: 0.2 } },
    ],
    preview: 'low',
  },

  // Outdoors: birds and chimes let into the room.
  {
    id: 'rosewood-canopy-birds',
    name: 'Canopy birds',
    category: 'texture',
    description:
      'Many small birds calling high in the canopy at first light, a little way off, with a hall round them.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.8, distance: 0.5, movement: 0.6, tone: 0.55, attack: 1.5, volume: -3 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.2 } }],
  },
  {
    id: 'rosewood-hanging-chimes',
    name: 'Hanging chimes',
    category: 'texture',
    description:
      'Wind chimes tuned to the key and stirred by a light wind, close, with a short plate behind them.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.5, distance: 0.2, movement: 0.8, tone: 0.5, volume: -3.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } }],
  },

  // Pedal steel: a pressed string and a wire with no pick.
  {
    id: 'rosewood-pressed-string',
    name: 'Pressed string',
    category: 'plucked',
    description:
      'Picked steel with a slow shake; a neighbouring note bends the held one, as a pressed zither string does.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 5, glide: 300, vibrato: 12, rate: 4, pick: 0.6, tone: 4500, volume: -9.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { drip: 0.2, mix: 0.22 } },
    ],
  },
  {
    id: 'rosewood-wire-without-pick',
    name: 'Wire without pick',
    category: 'string',
    description:
      'Steel strings with no pick at all, each note swelling in over two seconds and ringing on, plain and still.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.8, pick: 0.2, tone: 1500, volume: -11 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.25 } }],
  },

  // Sampler: whatever is loaded, struck or held.
  {
    id: 'rosewood-one-hit-answered',
    name: 'One hit answered',
    category: 'keys',
    description:
      'Whatever is loaded, played once per key from its start and answered by an echo three quarters of a beat behind.',
    instrument: {
      deviceId: 'sampler',
      preset: 'One shot',
      params: { release: 0.5, tone: 10000, volume: -13 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.4, modDepth: 0.1, tone: 4500, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'rosewood-low-octave-loop',
    name: 'Low octave loop',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down on a short back-and-forth loop: a dull held tone for under a pattern.',
    instrument: {
      deviceId: 'sampler',
      preset: 'There and back',
      params: { attack: 0.3, release: 2, tone: 2500, wobble: 0.15, volume: -18 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Fresh tape', params: { tone: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.22 } },
    ],
  },

  // String machine: a thin shade above, a dark floor below.
  {
    id: 'rosewood-high-string-shade',
    name: 'High string shade',
    category: 'string',
    description:
      'Only the top octave of a string ensemble, entering slowly: a thin shade of strings above the percussion.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 2.5, release: 5, high: 0.8, tone: 4000, ensemble: 0.6, volume: -11 },
    },
    effects: [{ deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-low-ensemble',
    name: 'Low ensemble',
    category: 'string',
    description:
      'The bottom octave of a string ensemble with the tone turned down, dark and slow, on tape in a room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 1.5, tone: 900, ensemble: 0.5, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Tape orchestra: sections off a strip of tape, played as figures.
  {
    id: 'rosewood-reel-flute-figure',
    name: 'Reel flute figure',
    category: 'wind',
    description:
      'Flute notes off a worn tape strip, played short as a figure, with a tape echo three quarters of a beat behind.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { age: 0.55, attack: 0.01, release: 0.2, volume: -9 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Space echo',
        params: { time: 375, feedback: 0.35, wow: 0.2, highCut: 5000, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-reed-strip-chord',
    name: 'Reed strip chord',
    category: 'wind',
    description:
      'A section of reeds off tape holding a chord, a little unsteady and hissing, on a plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { age: 0.4, hiss: 0.3, attack: 0.2, release: 1, volume: -11 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'ambient-live', params: { decay: 0.6, mix: 0.25 } }],
    preview: 'chord',
  },

  // Thesis: wind in pipes and brushes on skin, from bands of noise.
  {
    id: 'rosewood-wind-in-pipes',
    name: 'Wind in pipes',
    category: 'texture',
    description:
      'Narrow bands of noise that whistle like wind across open bamboo pipes, swelling and sinking in turn.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { resonance: 80, attack: 1.5, release: 3 },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 14, outputGain: -6.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rosewood-brushed-skin',
    name: 'Brushed skin',
    category: 'texture',
    description:
      'Broad bands of noise rising and falling four times a second under a tremolo, like brushes sweeping a drum skin.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        resonance: 6,
        width: 80,
        attack: 0.01,
        release: 0.25,
        strum: 30,
        scale: 4,
        root: 2,
      },
    },
    effects: [
      { deviceId: 'limiter-1176', params: { inputGain: 12, outputGain: -5 } },
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 4, depth: 0.7, shape: 0, drift: 0, smooth: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },

  // Tine: an electric piano standing in for the vibraphone.
  {
    id: 'rosewood-tine-vibraphone',
    name: 'Tine vibraphone',
    category: 'keys',
    description:
      'An electric piano voiced all bell with a slow tremolo, standing in for a vibraphone, on a short plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.95, bark: 0.1, decay: 1.5, tremolo: 0.5, volume: -12.5 },
    },
    effects: [{ deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-slipping-tines',
    name: 'Slipping tines',
    category: 'keys',
    description:
      'Soft dark tines with a plain echo at four fifths of the beat, slipping slowly across the figure, in a spring.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { hardness: 0.35, tone: 0.3, volume: -16 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 400, feedback: 0.4, spread: 0.5, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { drip: 0.25, mix: 0.2 } },
    ],
  },

  // Wavetable: a mouth organ cluster and the tubes without the bars.
  {
    id: 'rosewood-mouth-organ-cluster',
    name: 'Mouth organ cluster',
    category: 'pad',
    description:
      'A reedy chord held without movement, swelling in slowly: the cluster of a bamboo mouth organ.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.5,
        motion: 0,
        rate: 0.2,
        detune: 4,
        sub: 0,
        cutoff: 9000,
        attack: 1.5,
        release: 2.5,
        spread: 0.6,
        volume: -13,
      },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25 } }],
  },
  {
    id: 'rosewood-tubes-alone',
    name: 'Tubes alone',
    category: 'pad',
    description:
      'A hollow, pipe-like pad with little movement: the sound of resonator tubes without the bars, in a room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { position: 0.3, motion: 0.3, sub: 0.4, cutoff: 1500, attack: 0.8, volume: -11 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } }],
  },

  // West coast: hand drums and an electronic marimba through a gate.
  {
    id: 'rosewood-hand-drums',
    name: 'Hand drums',
    category: 'bell',
    description:
      'Hollow tuned knocks through a gate that shuts fast, like small hand drums, with a dark echo on the half beat.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { decay: 0.45, chance: 0.2, volume: 2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tape Print', params: { driveDb: 12, outputDb: -9.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 250, feedback: 0.5, modDepth: 0.1, tone: 3000, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
    preview: 'keys',
  },
  {
    id: 'rosewood-gated-mallet',
    name: 'Gated mallet',
    category: 'bell',
    description:
      'A pure tone struck through a gate that darkens as it fades: an electronic marimba, on light tape in a room.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { fold: 0.2, decay: 2, volume: -2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Studio master', params: { drive: 0.4, wow: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
    preview: 'keys',
  },
]
