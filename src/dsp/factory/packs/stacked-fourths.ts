import { type FactoryPreset, type Phrase } from '../types'

// Chords built in fourths, hollow and even, with no third at the bottom to say major or minor.
// Tines, pianos, bars, bells, strings and pads are laid out by four registers and by how fast
// they beat: still, once in many seconds, once a second, a few times a second, a flutter.

// E A D G B over D, rolled upward, then A D G C E over A: three notes stay where they are.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.3, note: 38, gain: 0.5 },
    { atSec: 0.05, durSec: 3.2, note: 52, gain: 0.45 },
    { atSec: 0.18, durSec: 3.1, note: 57, gain: 0.45 },
    { atSec: 0.31, durSec: 3, note: 62, gain: 0.45 },
    { atSec: 0.44, durSec: 2.9, note: 67, gain: 0.45 },
    { atSec: 0.57, durSec: 2.8, note: 71, gain: 0.5 },
    { atSec: 3.5, durSec: 3, note: 45, gain: 0.5 },
    { atSec: 3.55, durSec: 2.9, note: 57, gain: 0.42 },
    { atSec: 3.68, durSec: 2.8, note: 62, gain: 0.42 },
    { atSec: 3.81, durSec: 2.7, note: 67, gain: 0.42 },
    { atSec: 3.94, durSec: 2.6, note: 72, gain: 0.42 },
    { atSec: 4.07, durSec: 2.5, note: 76, gain: 0.48 },
  ],
}

// One shape slid up a scale step at a time: F B E A C and G C F B D have the tritone in them,
// A D G C E is all perfect fourths with a major third on top.
const PLANED: Phrase = {
  notes: [
    ...[53, 59, 64, 69, 72].map((note) => ({ atSec: 0, durSec: 2, note, gain: 0.45 })),
    ...[55, 60, 65, 71, 74].map((note) => ({ atSec: 2.1, durSec: 2, note, gain: 0.45 })),
    ...[57, 62, 67, 72, 76].map((note) => ({ atSec: 4.2, durSec: 2.4, note, gain: 0.5 })),
  ],
}

// The three pure stacks of the white keys, on D, on E and on A, over a low D.
const THREE_PURE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 38, gain: 0.45 },
    ...[50, 55, 60, 65, 69].map((note) => ({ atSec: 0, durSec: 2.2, note, gain: 0.4 })),
    ...[52, 57, 62, 67, 71].map((note) => ({ atSec: 2.3, durSec: 2.2, note, gain: 0.4 })),
    ...[57, 62, 67, 72, 76].map((note) => ({ atSec: 4.6, durSec: 2.2, note, gain: 0.4 })),
  ],
}

// Four perfect fourths, B E A D G, climbing over F and C: the raised fourth of F is the lowest rung.
const LYDIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 41, gain: 0.45 },
    { atSec: 0, durSec: 6.8, note: 48, gain: 0.38 },
    { atSec: 0.5, durSec: 5.8, note: 59, gain: 0.42 },
    { atSec: 1, durSec: 5.3, note: 64, gain: 0.42 },
    { atSec: 1.5, durSec: 4.8, note: 69, gain: 0.42 },
    { atSec: 2, durSec: 4.3, note: 74, gain: 0.42 },
    { atSec: 2.5, durSec: 3.8, note: 79, gain: 0.5 },
  ],
}

// A tune walks under held fourths, D G C F and then E A D G, and closes A G E D with no third over its D.
const UNDER: Phrase = {
  notes: [
    ...[62, 67, 72, 77].map((note) => ({ atSec: 0, durSec: 3.5, note, gain: 0.34 })),
    { atSec: 0.5, durSec: 0.8, note: 57, gain: 0.6 },
    { atSec: 1.3, durSec: 0.7, note: 60, gain: 0.6 },
    { atSec: 2, durSec: 0.5, note: 57, gain: 0.55 },
    { atSec: 2.5, durSec: 1.1, note: 55, gain: 0.6 },
    ...[64, 69, 74, 79].map((note) => ({ atSec: 3.7, durSec: 3.2, note, gain: 0.34 })),
    { atSec: 3.7, durSec: 0.8, note: 57, gain: 0.6 },
    { atSec: 4.5, durSec: 0.7, note: 55, gain: 0.6 },
    { atSec: 5.2, durSec: 0.6, note: 52, gain: 0.55 },
    { atSec: 5.8, durSec: 1.1, note: 50, gain: 0.6 },
  ],
}

// Two stacks one note at a time, up D G C F A and down C G D A E. There is no B in them, so a copy
// a fourth below or a fifth above every note is on the white keys too.
const RUNGS: Phrase = {
  notes: [
    ...[62, 67, 72, 77, 81].map((note, i) => ({ atSec: i * 0.45, durSec: 1.4, note, gain: 0.6 })),
    ...[84, 79, 74, 69, 64].map((note, i) => ({
      atSec: 3.2 + i * 0.45,
      durSec: 1.4,
      note,
      gain: 0.55,
    })),
  ],
}

// Three notes deep, down the scale from A: A D G, G C F, F B E with its tritone, E A D.
const STEPS_DOWN: Phrase = {
  notes: [
    ...[69, 74, 79].map((note) => ({ atSec: 0, durSec: 1.5, note, gain: 0.5 })),
    ...[67, 72, 77].map((note) => ({ atSec: 1.6, durSec: 1.5, note, gain: 0.5 })),
    ...[65, 71, 76].map((note) => ({ atSec: 3.2, durSec: 1.5, note, gain: 0.5 })),
    ...[64, 69, 74].map((note) => ({ atSec: 4.8, durSec: 1.8, note, gain: 0.5 })),
  ],
}

// The stack on D becomes the stack on E, every voice one step up, long enough for a slow bow.
const SLID: Phrase = {
  notes: [
    ...[50, 55, 60, 65, 69].map((note) => ({ atSec: 0, durSec: 3.4, note, gain: 0.5 })),
    ...[52, 57, 62, 67, 71].map((note) => ({ atSec: 3.5, durSec: 3.2, note, gain: 0.5 })),
  ],
}

// One stack, E A D G B over a low D, and nothing else.
const ONE_STACK: Phrase = {
  notes: [38, 52, 57, 62, 67, 71].map((note) => ({ atSec: 0, durSec: 5.6, note, gain: 0.5 })),
}

// Stacks on D, E, F and G broken upward in fives, the last two with the tritone left in.
const BROKEN: Phrase = {
  notes: [50, 55, 60, 65, 69, 52, 57, 62, 67, 71, 53, 59, 64, 69, 72, 55, 60, 65, 71, 74].map(
    (note, i) => ({ atSec: i * 0.32, durSec: 0.6, note, gain: i % 5 === 0 ? 0.65 : 0.5 }),
  ),
}

// Roots in fourths and fifths, one at a time: E down to A, up to D, up to G, down to D.
const ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 40, gain: 0.6 },
    { atSec: 1.35, durSec: 1.3, note: 33, gain: 0.6 },
    { atSec: 2.7, durSec: 1.3, note: 38, gain: 0.6 },
    { atSec: 4.05, durSec: 1.3, note: 43, gain: 0.6 },
    { atSec: 5.4, durSec: 1.4, note: 38, gain: 0.6 },
  ],
}

// The same fourths turned over into fifths: C G D A E, then F C G D A, with no B in either.
const TURNED: Phrase = {
  notes: [
    ...[48, 55, 62, 69, 76].map((note) => ({ atSec: 0, durSec: 3.4, note, gain: 0.48 })),
    ...[53, 60, 67, 74, 81].map((note) => ({ atSec: 3.5, durSec: 3.2, note, gain: 0.44 })),
  ],
}

// A D G C E climbs a fourth to D G C F A: three tones of the first stack are three of the second.
const CLIMB: Phrase = {
  notes: [
    ...[57, 62, 67, 72, 76].map((note) => ({ atSec: 0, durSec: 3.4, note, gain: 0.48 })),
    ...[62, 67, 72, 77, 81].map((note) => ({ atSec: 3.5, durSec: 3.2, note, gain: 0.45 })),
  ],
}

// A line of D, E, G, A and B, one at a time: each has a white key a fourth and two fourths above it.
const ONE_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 57, gain: 0.6 },
    { atSec: 1.2, durSec: 0.6, note: 62, gain: 0.55 },
    { atSec: 1.8, durSec: 0.6, note: 64, gain: 0.55 },
    { atSec: 2.4, durSec: 1.4, note: 67, gain: 0.6 },
    { atSec: 3.8, durSec: 0.6, note: 64, gain: 0.55 },
    { atSec: 4.4, durSec: 0.6, note: 59, gain: 0.5 },
    { atSec: 5, durSec: 1.8, note: 62, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tine piano: from no beating at all to a flutter, low and dark to high and glassy.
  {
    id: 'stacked-fourths-shelf-by-the-stove',
    name: 'Shelf by the stove',
    category: 'keys',
    description:
      'Dark tines with the tremolo off and a long decay, warmed by a transformer drive and set in a small room.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bark: 0.3, decay: 2, release: 0.8, tone: 0.3, volume: -16.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'stacked-fourths-landing-without-rail',
    name: 'Landing without rail',
    category: 'keys',
    description:
      'Long still tines, bell and bark both low, with a dark tape echo a second and a half behind them.',
    preview: UNDER,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.25, bark: 0.1, tremolo: 0, release: 2.2, tone: 0.38, volume: -14 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 1500, feedback: 0.5, mix: 0.34 },
      },
    ],
  },
  {
    id: 'stacked-fourths-slate-through-glass',
    name: 'Slate through glass',
    category: 'bell',
    description:
      'Glassy tines that ring longer than usual, each chord fanned out from its low notes to its high ones on every repeat.',
    preview: PLANED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { bell: 0.85, decay: 1.6, tone: 0.8, hardness: 0.75, volume: -10 },
    },
    effects: [
      {
        deviceId: 'prism',
        preset: 'Low to high',
        params: { time: 900, bands: 20, feedback: 0.5, mix: 0.42 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'stacked-fourths-once-a-second-rungs',
    name: 'Once a second, rungs',
    category: 'keys',
    description:
      'Bell tines that pulse once a second from side to side, a detuned copy on each, in a ten second valley.',
    preview: RUNGS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0.85, tremoloRate: 1, release: 1.2, volume: -9 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.38 } },
    ],
  },
  {
    id: 'stacked-fourths-chord-next-door',
    name: 'Chord next door',
    category: 'keys',
    description:
      'A plain suitcase tine piano heard through a wall, dark and narrow, then put on a slowly wavering reel.',
    preview: THREE_PURE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tone: 0.35, tremolo: 0.15, bark: 0.55, decay: 1.4, volume: -15 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { level: 0.9 } },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'stacked-fourths-boiler-room-rungs',
    name: 'Boiler room rungs',
    category: 'keys',
    description:
      'Throbbing dark tines with an octave added under them and a cassette low-end bump, all of it near mono.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremoloRate: 0.8, tone: 0.22, decay: 3.2, volume: -21.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.9, filter: 700 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'stacked-fourths-stairwell-flicker',
    name: 'Stairwell flicker',
    category: 'keys',
    description:
      'Bright tines with the amplifier shaking seven times a second, and five faint points of echo scattered wide.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremoloRate: 7, tremolo: 1, decay: 1, pan: 0.4, tone: 0.8, volume: -12 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.3, again: 0.4 } },
    ],
  },
  {
    id: 'stacked-fourths-fans-out-of-step',
    name: 'Fans out of step',
    category: 'keys',
    description:
      'Slowly panning tines sent through a turning horn and drum at their slow speed, two turns against each other.',
    preview: PLANED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremoloRate: 0.3, tremolo: 0.9, bell: 0.3, tone: 0.65, volume: -13.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { hornDepth: 0.9, drive: 0.2 } },
    ],
  },
  {
    id: 'stacked-fourths-newel-post-knock',
    name: 'Newel post knock',
    category: 'keys',
    description:
      'Short tines with little bark, played inside a clay pot, where a pair of small springs answers each knock.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.4, release: 0.08, bark: 0.4, tone: 0.5, volume: -9.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'stacked-fourths-tenement-supper',
    name: 'Tenement supper',
    category: 'keys',
    description: 'Overdriven warm tines coming out of a combo amplifier at the far end of a hall.',
    preview: UNDER,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { drive: 0.7, bark: 0.8, tone: 0.5, decay: 2, volume: -10 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
  },
  {
    id: 'stacked-fourths-skylight-ladder',
    name: 'Skylight ladder',
    category: 'bell',
    description:
      'All bell and no bark, with small sparks from its overtones and a reverb that climbs two octaves.',
    preview: RUNGS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 0.8, release: 2, tone: 0.95, volume: -13.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.22 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stacked-fourths-lamp-passes-slowly',
    name: 'Lamp passes slowly',
    category: 'keys',
    description:
      'Tines that swing from side to side once in eight seconds, their six bands drifting apart on cycles of their own.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { decay: 3, bark: 0.25, tone: 0.5, volume: -10.5 },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.75, rate: 0.2 } }],
  },
  {
    id: 'stacked-fourths-scaffold-in-mist',
    name: 'Scaffold in mist',
    category: 'pad',
    description:
      'Undamped tines with their attacks taken off, fading in over most of a second and smeared into three layers of fog.',
    preview: SLID,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.35, bark: 0.35, tone: 0.45, volume: -12.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 800 } },
      { deviceId: 'fog', preset: 'Deep fog' },
    ],
  },
  {
    id: 'stacked-fourths-hung-from-joists',
    name: 'Hung from joists',
    category: 'keys',
    description:
      'Undamped bright tines over sixteen strings that learn the notes and ring on with them for nine seconds.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { decay: 2, release: 1.5, hardness: 0.8, bell: 0.9, volume: -20 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.5 } }],
  },
  {
    id: 'stacked-fourths-wet-roof-slates',
    name: 'Wet roof slates',
    category: 'texture',
    description:
      'A tremolo tine piano left out in the rain, the drops tapping at its level and adding their own thin sound.',
    preview: THREE_PURE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremolo: 0.35, tremoloRate: 4.4, tone: 0.45, decay: 1.6, drive: 0.1, volume: -9 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { exposure: 0.8, voice: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'stacked-fourths-echo-up-a-fourth',
    name: 'Echo up a fourth',
    category: 'keys',
    description:
      'Soft tines whose echoes are clocked up a fourth every other time, so a chord goes on stacking itself.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.6, tremolo: 0, decay: 1.2, tone: 0.6, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: {
          intervalA: 4,
          intervalB: 0,
          time: 560,
          feedback: 0.35,
          tone: 3000,
          spread: 0.9,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'stacked-fourths-reed-in-the-rafters',
    name: 'Reed in the rafters',
    category: 'organ',
    description:
      'Tines turned to a reedy buzz and widened, a fifth and a twelfth added by pipes that speak late, in an airy hall.',
    preview: TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { release: 0.6, tone: 0.6, tremolo: 0.2, volume: -14 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Hollow fifths', params: { mix: 0.6 } },
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-fourths-worn-treads',
    name: 'Worn treads',
    category: 'keys',
    description:
      'A barking tine piano softened and put on a worn cassette, then swept by a deep slow phaser.',
    preview: UNDER,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: {
        hardness: 0.6,
        bark: 0.6,
        drive: 0.2,
        decay: 0.8,
        release: 0.5,
        tone: 0.4,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.7, noise: 0.3 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.35 } },
    ],
  },
  {
    id: 'stacked-fourths-flooded-gallery',
    name: 'Flooded gallery',
    category: 'pad',
    description:
      'The darkest tines, hardly struck, what they play from 120 to 3500 Hz hanging in a spectral blur.',
    preview: TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tone: 0.2, tremolo: 0.6, tremoloRate: 0.5, volume: -19 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { lowCut: 120, highCut: 3500 } },
    ],
  },
  {
    id: 'stacked-fourths-stair-at-half-pace',
    name: 'Stair at half pace',
    category: 'keys',
    description:
      'Bell tines with the same chords coming up from below at half speed, an octave down, under the dry keys.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.7, tremolo: 0, decay: 0.7, tone: 0.65, volume: -8 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2000, mix: 0.5, highCut: 5000 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },

  // Felt piano: the stack as hammers, as dust, as no hammers at all.
  {
    id: 'stacked-fourths-lid-up-upper-storey',
    name: 'Lid up, upper storey',
    category: 'keys',
    description:
      'A bare piano with its strikes sifted down and its air spread wide, in a short bright chamber.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.75, stiffness: 1.4, reverbMix: 0, width: 0.8, outputDb: -8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'stacked-fourths-dust-on-a-top-board',
    name: 'Dust on a top board',
    category: 'keys',
    description:
      'A worn mono piano cut to a record, played with a dull stylus and a slow warp in the disc.',
    preview: THREE_PURE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { hardness: 0.35, grit: 0.5, outputDb: -19.5 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Dull stylus', params: { warp: 0.6 } }],
  },
  {
    id: 'stacked-fourths-blurred-mezzanine',
    name: 'Blurred mezzanine',
    category: 'pad',
    description:
      'A felted piano with the pedal down, its own room turned low, answered by a reverb that swells up and fades.',
    preview: PLANED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { hardness: 0.15, reverbMix: 0.15, reverbSize: 0.5, outputDb: -4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 3.2, mix: 0.6 } }],
  },
  {
    id: 'stacked-fourths-stairhead-in-frost',
    name: 'Stairhead in frost',
    category: 'keys',
    description:
      'A hard stiff upright whose notes skip away like a stone, six throws that close up from side to side.',
    preview: RUNGS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { hardness: 0.8, stiffness: 1.7, reverbMix: 0.1, outputDb: -6 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Thrown again',
        params: { again: 0.4, throw: 1, mix: 0.36 },
      },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'stacked-fourths-half-pedal-with-bowls',
    name: 'Half pedal, with bowls',
    category: 'keys',
    description:
      'A half-pedalled piano and five metal bowls tuned in fifths, D, A and E, which take up its notes and ring nine seconds.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { hardness: 0.3, felt: 0.6, outputDb: -19 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 2, ring: 9, mix: 0.42, register: 0.5 },
      },
    ],
  },
  {
    id: 'stacked-fourths-lumber-room-thud',
    name: 'Lumber room thud',
    category: 'keys',
    description:
      'A thick felt thud with one and two octaves added under it below 350 Hz, on tape with the top rolled off.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { hardness: 0.1, reverbMix: 0.1, outputDb: -15 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.6, sub1: 0.6 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'stacked-fourths-hammers-left-outside',
    name: 'Hammers left outside',
    category: 'pad',
    description:
      'A pedalled piano that fades in like a bow, with a slow string pad grown out of the same chord behind it.',
    preview: SLID,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { pedalNoise: 0, thump: 0.1, reverbMix: 0, outputDb: -5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'pad-follower', preset: 'String pad', params: { octaves: -0.3, mix: 0.5 } },
    ],
  },

  // Prepared piano: each rung has its own object between the strings.
  {
    id: 'stacked-fourths-bolt-at-each-landing',
    name: 'Bolt at each landing',
    category: 'bell',
    description:
      'Bolted strings like small gongs, shifted by a fraction of a hertz so they beat slowly, in a dark hall.',
    preview: RUNGS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { hammer: 0.3, decay: 2.2, rattle: 0.1, volume: -0.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { fine: 0.7, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-rubber-banister',
    name: 'Rubber banister',
    category: 'plucked',
    description:
      'Softly rubbered strings, woody and short, with a short soft tape echo and a band pulsing four times a second.',
    preview: BROKEN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { decay: 0.9, position: 0.35, tone: 0.6, volume: 6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 220, feedback: 0.5, mix: 0.4 },
      },
      { deviceId: 'band-pulse', preset: 'Four a second', params: { depth: 0.7 } },
    ],
  },
  {
    id: 'stacked-fourths-paper-under-a-beam',
    name: 'Paper under a beam',
    category: 'keys',
    description:
      'Paper buzzing on every string, played through a wooden soundboard that takes the edge off.',
    preview: ROLLED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { rattle: 0.5, amount: 0.6, hammer: 0.4, tone: 0.55, volume: -1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.75, size: 1.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'stacked-fourths-tin-treads',
    name: 'Tin treads',
    category: 'plucked',
    description:
      'Short tin chimes near the end of the string, wandering from side to side under a bright plate.',
    preview: BROKEN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { hammer: 0.6, decay: 0.9, tone: 0.85, volume: 4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 1.4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'stacked-fourths-gongs-in-the-plaster',
    name: 'Gongs in the plaster',
    category: 'bell',
    description:
      'Heavily bolted gongs with loose unisons, muffled above 1200 Hz and blurred by a dark fog.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { detune: 0.9, decay: 3.6, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1200 } },
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'stacked-fourths-felted-truss',
    name: 'Felted truss',
    category: 'keys',
    description:
      'Quietly felted strings caught by two loops that differ a little in length, so the repeats walk out of step.',
    preview: UNDER,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { decay: 1.4, amount: 0.75, tone: 0.75, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.2, feedback: 0.6, mix: 0.42 },
      },
    ],
  },

  // Bells: five speeds of beating in the metal, from a bowl that barely turns to glass that shivers.
  {
    id: 'stacked-fourths-fourth-bell-of-five',
    name: 'Fourth bell of five',
    category: 'bell',
    description:
      'A church bell struck with medium hardness, stood at the back of a hall and left to ring undamped.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { hardness: 0.4, brightness: 0.4, detune: 0.3, volume: -3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.6 } }],
  },
  {
    id: 'stacked-fourths-bowls-on-four-sills',
    name: 'Bowls on four sills',
    category: 'bell',
    description:
      'Singing bowls that beat three times a second, carried round the listener on a slow figure of eight.',
    preview: RUNGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { detune: 3, hardness: 0.6, decay: 8, brightness: 0.65, volume: -2.5 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow eight', params: { rate: 0.2 } }],
  },
  {
    id: 'stacked-fourths-rim-of-the-water-tank',
    name: 'Rim of the water tank',
    category: 'pad',
    description:
      'Bowls rubbed at the rim for as long as a key is held, thickened by three slow chorus voices.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { brightness: 0.35, detune: 0.4, volume: -7.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.15, depth: 80 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'stacked-fourths-bars-crossed-over',
    name: 'Bars crossed over',
    category: 'bell',
    description:
      'Vibraphone bars struck with a medium mallet, their lows and highs traded back and forth three times a second.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { position: 0.5, hardness: 0.5, release: 0.4, volume: 5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3, depth: 1 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'stacked-fourths-drawer-of-combs',
    name: 'Drawer of combs',
    category: 'bell',
    description:
      'A music box through an early sampler at a reduced rate, then a pair of tight long springs.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 2, detune: 0.8, brightness: 0.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy', params: { rate: 11000 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-thumbs-climb-the-box',
    name: 'Thumbs climb the box',
    category: 'plucked',
    description:
      'A dull kalimba with dotted tape echoes bouncing across the speakers, mixed half and half with the notes.',
    preview: RUNGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { hardness: 0.4, decay: 1.6, brightness: 0.4, volume: -1.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 480, mix: 0.5 } }],
  },
  {
    id: 'stacked-fourths-wet-fingers-five-rims',
    name: 'Wet fingers, five rims',
    category: 'pad',
    description:
      'Rubbed glasses beating once or twice a second, with a slow sway that grows the longer a chord is held.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { brightness: 0.6, sustain: 1, hardness: 0.1, release: 0.15, volume: -14 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow drift', params: { depth: 22, rate: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-base-of-the-tower',
    name: 'Base of the tower',
    category: 'bell',
    description:
      'Softly struck gongs with their partials drawn in and their middle scooped, held together by a slow compressor.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { stretch: 0.8, hardness: 0.15, brightness: 0.25, detune: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { air: 0 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { makeup: 4 } },
    ],
  },
  {
    id: 'stacked-fourths-tumblers-on-a-ledge',
    name: 'Tumblers on a ledge',
    category: 'bell',
    description:
      'Tapped glass, each tap followed by twelve echoes packed inside a fifth of a second.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { hardness: 0.55, decay: 3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Close flicker',
        params: { span: 200, again: 0.6, tone: 5000, mix: 0.6 },
      },
    ],
  },
  {
    id: 'stacked-fourths-pane-rattled-by-wind',
    name: 'Pane rattled by wind',
    category: 'texture',
    description:
      'Glass beating eight times a second, every band given a quick small tremolo of its own, under a long plate.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { detune: 8, hardness: 0.3, brightness: 0.45, volume: -3 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer', params: { depth: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stacked-fourths-ridge-after-ridge',
    name: 'Ridge after ridge',
    category: 'bell',
    description:
      'Far soft bells smeared into a wash that hangs on after them, with nothing of it under 80 Hz.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { brightness: 0.25, decay: 18, volume: -2.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.8 } }],
  },
  {
    id: 'stacked-fourths-bowed-bronze-lintel',
    name: 'Bowed bronze lintel',
    category: 'organ',
    description:
      'A bell bowed instead of struck, with octave pipes above and below speaking a tenth of a second after it.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { detune: 1.5, brightness: 0.2, volume: -14 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Principal chorus', params: { tone: 0.25, mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'stacked-fourths-cellar-bowl-lid-on',
    name: 'Cellar bowl, lid on',
    category: 'bell',
    description:
      'The darkest bowl, struck with something soft, driven through an iron transformer and cut at 2 kHz.',
    preview: CLIMB,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { decay: 14, detune: 0.15, volume: -6.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { highCut: 2000 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-gong-rubbed-at-noon',
    name: 'Gong rubbed at noon',
    category: 'pad',
    description:
      'Gongs rubbed until they sing, a low ring modulation on D blended in and a small bright tank behind.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { brightness: 0.55, stretch: 1, volume: -14 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Wide drone', params: { root: 2, mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-kindling-in-a-rack',
    name: 'Kindling in a rack',
    category: 'plucked',
    description:
      'Dry wooden bars knocked inside a small kettle of a drum, with no tail but the body it lends.',
    preview: RUNGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { hardness: 0.7, decay: 0.8, volume: 2 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { size: 0.8, mix: 0.5 } }],
  },
  {
    id: 'stacked-fourths-chimes-off-the-gutter',
    name: 'Chimes off the gutter',
    category: 'bell',
    description:
      'Thin bright chimes answered backwards an octave up, the reversed chunks feeding back into themselves.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { hardness: 0.6, damping: 0.2, decay: 5, volume: -2 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.45 } }],
  },
  {
    id: 'stacked-fourths-bar-calls-two-above',
    name: 'Bar calls two above',
    category: 'bell',
    description:
      'Struck bars with the notes a fourth and two fourths above every key sounding with it, so one finger plays a stack.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { hardness: 0.3, decay: 5, damping: 0.5, brightness: 0.35, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 5, pitchB: 10, detune: 0, levelB: 0.9, mix: 0.55 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },

  // Mallets: motor speeds and rolls, over tubes that are open, shut or half stopped.
  {
    id: 'stacked-fourths-planed-boards',
    name: 'Planed boards',
    category: 'plucked',
    description:
      'A soft marimba with three tape heads repeating each chord, the tape wavering a little.',
    preview: PLANED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.5, decay: 1.4, volume: -7 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.45 } }],
  },
  {
    id: 'stacked-fourths-rolled-timber',
    name: 'Rolled timber',
    category: 'texture',
    description:
      'Rolled marimba chords in five bands, each swelling and sinking about every seven seconds, in a hall.',
    preview: SLID,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 7, mallet: 0.1, width: 1, volume: -11 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breathing' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-fan-at-two-and-a-half',
    name: 'Fan at two and a half',
    category: 'bell',
    description:
      'Vibraphone bars with the motor deep at two and a half turns a second, their cabinet turning at another speed.',
    preview: CLIMB,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 1, motorRate: 2.5, decay: 1.8, mallet: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'stacked-fourths-no-motor-no-pedal',
    name: 'No motor, no pedal',
    category: 'bell',
    description:
      'Still vibraphone bars, mostly damped, with their quiet overtones brought up and a small room added.',
    preview: CLIMB,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { damper: 0.75, mallet: 0.5, resonator: 0.4, decay: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'stacked-fourths-vibes-behind-a-sheet',
    name: 'Vibes behind a sheet',
    category: 'pad',
    description:
      'Rolled vibraphone with its strikes blurred away, a slow motor in it, dulled and spread by a rising fog.',
    preview: PLANED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { roll: 12, motor: 0.6, motorRate: 1.2, volume: -11 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'stacked-fourths-nails-in-a-jar',
    name: 'Nails in a jar',
    category: 'bell',
    description:
      'A hard glockenspiel scattered into a swarm of short echoes that bends a little as it rings.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, resonator: 0.2, decay: 1.5, volume: -5 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Glinting', params: { wander: 0.3, mix: 0.5 } }],
  },
  {
    id: 'stacked-fourths-nursery-landing',
    name: 'Nursery landing',
    category: 'keys',
    description:
      'A softly struck celesta into a bucket-brigade delay whose echoes are chorused and as wide as they go.',
    preview: RUNGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.15, decay: 1.3, damper: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 340, spread: 1, mix: 0.5 } },
    ],
  },
  {
    id: 'stacked-fourths-ladder-on-concrete',
    name: 'Ladder on concrete',
    category: 'plucked',
    description: 'A hard, short xylophone into two quick springs that twang after every note.',
    preview: RUNGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 0.8, mallet: 0.65, volume: -0.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.42, drive: 0.2 } },
    ],
  },
  {
    id: 'stacked-fourths-beams-from-the-barn',
    name: 'Beams from the barn',
    category: 'plucked',
    description:
      'A warm long xylophone piling up on a tape loop just under two seconds round, a little worn on each pass.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { decay: 2.5, mallet: 0.2, volume: -4 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { feedback: 0.6, wear: 0.5 } }],
  },
  {
    id: 'stacked-fourths-hail-on-the-planks',
    name: 'Hail on the planks',
    category: 'texture',
    description:
      'A fast xylophone roll that opens a resonant low-pass as it gets louder and closes it as it dies.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { roll: 10, resonator: 1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { resonance: 3, cutoffHz: 320, driveDb: 4 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'stacked-fourths-vapour-off-the-bells',
    name: 'Vapour off the bells',
    category: 'bell',
    description:
      'Glockenspiel bars over resonators, their tails lifting in pitch and thinning as if they evaporated.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.3, decay: 1.4, volume: -11 },
    },
    effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { sag: 22, mix: 0.55 } }],
  },
  {
    id: 'stacked-fourths-starlings-on-the-eave',
    name: 'Starlings on the eave',
    category: 'texture',
    description: 'A rolled glockenspiel turned into twelve wheeling copies at different distances.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 9, decay: 1, damper: 0.2, mallet: 0.5, volume: -11 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Wheeling', params: { mix: 0.75 } }],
  },
  {
    id: 'stacked-fourths-celesta-in-the-loft',
    name: 'Celesta in the loft',
    category: 'bell',
    description:
      'A long open celesta whose tail is read back in pieces and climbs by fifths, mixed under the keys.',
    preview: RUNGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { decay: 2, mallet: 0.25, volume: -13 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.38 } }],
  },
  {
    id: 'stacked-fourths-moth-on-the-treads',
    name: 'Moth on the treads',
    category: 'keys',
    description:
      'A celesta whose motor flutters ten times a second, gated by two soft patterns that drift apart.',
    preview: CLIMB,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { decay: 2.5, damper: 0.1, motorRate: 10, volume: -10 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Wide weave' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-one-turn-a-second',
    name: 'One turn a second',
    category: 'pad',
    description:
      'Long vibraphone bars with the motor at its slowest and deepest, in a wide space with the lows cut off.',
    preview: CLIMB,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1, mallet: 0.35, volume: -10 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.42 } }],
  },
  {
    id: 'stacked-fourths-marimba-rung-by-rung',
    name: 'Marimba, rung by rung',
    category: 'plucked',
    description:
      'A soft humming marimba with two followers, the first a fourth higher and the second a fourth above that.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { mallet: 0.3, decay: 1.8, volume: -4 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: {
          followers: 2,
          gap: 0.3,
          interval1: 5,
          interval2: 10,
          fade: 0.1,
          spread: 0.8,
          mix: 0.5,
        },
      },
    ],
  },

  // Chamber strings: the stack as five even voices, from bare viols to a mass of slow bows.
  {
    id: 'stacked-fourths-viols-round-the-newel',
    name: 'Viols round the newel',
    category: 'string',
    description:
      'Muted viols with no vibrato, ten sympathetic strings that learn the notes ringing along with them.',
    preview: SLID,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { players: 2, release: 1.4, volume: -13.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'stacked-fourths-scarf-round-the-bridge',
    name: 'Scarf round the bridge',
    category: 'pad',
    description:
      'Fully muted strings swelling in late, opened and closed by a breath of four seconds in and eight out.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 1.4, scatter: 0.7, volume: -7 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Long held breath', params: { hold: 1, depth: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-hair-on-five-strings',
    name: 'Hair on five strings',
    category: 'texture',
    description:
      'Nearly all bow hair and little tone, its air thrown wide and louder than the notes, on a faint plate.',
    preview: SLID,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.6, air: 1, mute: 0.3, volume: -1.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Breath and tone', params: { tones: -8, scatter: 1 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'stacked-fourths-halo-over-the-joist',
    name: 'Halo over the joist',
    category: 'pad',
    description:
      'Three players with no vibrato, and voices one and two octaves up that come in after the bow, in a soft wash.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.9, release: 3, volume: -7 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { up1: 0.5, up2: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'stacked-fourths-glass-bow-in-a-duct',
    name: 'Glass bow in a duct',
    category: 'string',
    description:
      'Bows hard up on the bridge, combed by a twelve stage phaser that takes eight seconds to come round.',
    preview: PLANED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.5, release: 2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { depth: 90 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'stacked-fourths-short-bows-remembered',
    name: 'Short bows, remembered',
    category: 'string',
    description:
      'Short bows with a plain echo, and earlier strokes drifting back under it, some of them in reverse.',
    preview: BROKEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { bow: 0.4, release: 0.35, mute: 0.4, volume: -5 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards', params: { time: 480, mix: 0.5 } }],
  },
  {
    id: 'stacked-fourths-six-who-disagree',
    name: 'Six who disagree',
    category: 'string',
    description:
      'Six players as far apart in pitch as they go, on slow swaying tape, with a dull detuned shadow a moment behind.',
    preview: SLID,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.4, bow: 0.5, mute: 0.1, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.1, age: 0.3 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'stacked-fourths-bows-under-the-floor',
    name: 'Bows under the floor',
    category: 'pad',
    description:
      'Six slow bows with a reverb that sinks an octave on every pass, so the stack settles into the cellar.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 1.8, release: 4, mute: 0.7, volume: -10 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.45, decay: 8 } }],
  },
  {
    id: 'stacked-fourths-four-beats-in-the-air',
    name: 'Four beats in the air',
    category: 'string',
    description:
      'Strings with a wide vibrato, their middle shifted so that it beats four times a second in the air, and long springs behind.',
    preview: THREE_PURE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { vibrato: 18, bow: 0.3, mute: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'ear-shift', preset: 'Four in the air' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'stacked-fourths-one-bow-plays-three',
    name: 'One bow plays three',
    category: 'string',
    description:
      'A single wandering player doubled a fourth and two fourths higher, so a lone line moves as a hollow chord.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.25, release: 1.2, scatter: 0.5, vibrato: 5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth',
        params: { pitchA: 5, pitchB: 10, levelB: 0.8, detune: 2, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // Wavetable: beating between two oscillators, from none to a slow sour roll.
  {
    id: 'stacked-fourths-drainpipe-chord',
    name: 'Drainpipe chord',
    category: 'pad',
    description:
      'A hollow table turning slowly, played in an open pipe twice the usual size and swung behind the head.',
    preview: TURNED,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.8, release: 3, cutoff: 2600, volume: -9 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 2, mix: 0.5 } },
      { deviceId: 'around', preset: 'Dark swing' },
    ],
  },
  {
    id: 'stacked-fourths-two-sines-a-rung',
    name: 'Two sines a rung',
    category: 'pad',
    description:
      'Two sines on every key, tuned far enough apart to beat, a faint sub under them and the quiet end of each note brought up.',
    preview: SLID,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { detune: 14, spread: 0.5, sub: 0.15, attack: 0.3, release: 4, volume: -20.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -27 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-fourths-narrow-door-ajar',
    name: 'Narrow door ajar',
    category: 'keys',
    description:
      'A thin pulse with a quick attack, its highs heard first and its lows after them on each repeat.',
    preview: PLANED,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { cutoff: 2800, release: 1.2, detune: 7, volume: -10 },
    },
    effects: [
      { deviceId: 'prism', preset: 'High to low', params: { time: 800, feedback: 0.5, mix: 0.42 } },
    ],
  },
  {
    id: 'stacked-fourths-lamp-losing-pace',
    name: 'Lamp losing pace',
    category: 'drone',
    description:
      'A nearly pure sine with a sub under it, pulsed in layers that seem to slow down for as long as they last.',
    preview: THREE_PURE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.5, release: 2.5, cutoff: 2000, position: 0.12, volume: -10 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Soft swell', params: { rate: 2, halving: 24 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'stacked-fourths-harmonium-in-the-porch',
    name: 'Harmonium in the porch',
    category: 'organ',
    description:
      'A reed table, barely moving, through a small driven radio loudspeaker, then thickened by a light chorus.',
    preview: UNDER,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.3, attack: 0.08, sub: 0.2, volume: -10 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stacked-fourths-overtones-in-a-shaft',
    name: 'Overtones in a shaft',
    category: 'texture',
    description:
      'A spectral table with the filter ringing on its partials, dissolved into clouds of small overlapping grains.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { resonance: 0.6, rate: 0.5, attack: 1, volume: -6 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.65 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'stacked-fourths-bells-of-no-metal',
    name: 'Bells of no metal',
    category: 'bell',
    description:
      'Glassy wavetable keys with a long release, each chord struck again by short loops of itself, some an octave up.',
    preview: RUNGS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { position: 0.7, cutoff: 6000, release: 3, detune: 9, volume: -12 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Restruck', params: { mix: 0.45 } }],
  },

  // Ice: struck fourths that settle out of a falling chirp.
  {
    id: 'stacked-fourths-frozen-quay-steps',
    name: 'Frozen quay steps',
    category: 'bell',
    description:
      'Clean ringing ice with the cracking off, its six strongest partials redrawn as sines an octave above.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: { ring: 6, bright: 0.45, volume: 2.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-fourths-thick-shelf-off-shore',
    name: 'Thick shelf off shore',
    category: 'bell',
    description: 'Thick dark ice with a bed two octaves under it at a quarter of the speed.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: { shore: 0.2, cracks: 0.1, volume: 3 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Two octaves', params: { mix: 0.45 } }],
  },
  {
    id: 'stacked-fourths-skin-on-the-basin',
    name: 'Skin on the basin',
    category: 'plucked',
    description:
      'Thin bright ice that snaps at the start, with seven echoes of it scattered wide over nearly two seconds.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { stretch: 0.2, ring: 2, cracks: 0.1, volume: 3.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.55 } }],
  },
  {
    id: 'stacked-fourths-cracks-after-vespers',
    name: 'Cracks after vespers',
    category: 'texture',
    description:
      'A restless lake that goes on cracking under a held stack, sung back by a hall with a low dark vowel.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'ice',
      preset: 'Lake at night',
      params: { distance: 0.4, cracks: 0.9, ring: 5, volume: -1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 6, mix: 0.45 } }],
  },
  {
    id: 'stacked-fourths-plates-slid-together',
    name: 'Plates slid together',
    category: 'bell',
    description:
      'Plates of ice with their partials fully stretched, passed through an overdriven spring and widened at the top.',
    preview: STEPS_DOWN,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { ring: 3.5, thick: 0.7, bright: 0.4, volume: -1.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { mix: 0.4 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'stacked-fourths-ping-falls-a-fourth',
    name: 'Ping falls a fourth',
    category: 'bell',
    description:
      'A clear ping with nothing around it, and grain echoes that drop a fourth each time they come round.',
    preview: RUNGS,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { ring: 2.5, thick: 0.3, volume: 4 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { feedback: 0.4, mix: 0.35 } },
    ],
  },
  {
    id: 'stacked-fourths-thaw-over-the-slipway',
    name: 'Thaw over the slipway',
    category: 'pad',
    description:
      'Far dark ice with a twenty second ring and no crack in it, pieces of it sagging a semitone as they fade.',
    preview: SLID,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { distance: 0.6, cracks: 0, volume: -6 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { fall: -1, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.5 } },
    ],
  },

  // Ember: the fourth built into the oscillators, the roots under it, and the stack as a plain pad.
  {
    id: 'stacked-fourths-pad-with-its-own-fourth',
    name: 'Pad with its own fourth',
    category: 'pad',
    description:
      'A warm pad with its second oscillator a fourth above the first, so every key is already a rung.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc2Coarse: 5,
        osc2Fine: 0,
        oscMix: 0.5,
        ampAttack: 0.15,
        filterAttack: 0.3,
        ampRelease: 2,
        cutoff: 1800,
        subLevel: 0,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'stacked-fourths-footings',
    name: 'Footings',
    category: 'bass',
    description:
      'A one-voice saw bass that slides between its roots, softened by a gentle saturator and kept to the centre.',
    preview: ROOTS,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm Bass',
      params: {
        glide: 0.12,
        cutoff: 260,
        filterEnvAmount: 0.25,
        filterDecay: 0.8,
        ampAttack: 0.03,
        ampRelease: 0.4,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'stacked-fourths-empty-grain-store',
    name: 'Empty grain store',
    category: 'pad',
    description:
      'A hollow square and triangle pad with the filter swept by a slow wave, every band swelling and fading on its own.',
    preview: PLANED,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: {
        osc2Coarse: 0,
        cutoff: 1100,
        ampAttack: 0.4,
        lfo1Amount: 0.4,
        unisonDetune: 4,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'stacked-fourths-pegs-along-the-wall',
    name: 'Pegs along the wall',
    category: 'plucked',
    description:
      'A short plucked triangle with its octave, in even echoes that cross from side to side and never close up.',
    preview: BROKEN,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { resonance: 0.2, ampDecay: 0.7, filterDecay: 0.25, cutoff: 450, volume: 6 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Even steps', params: { first: 320, mix: 0.42 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'stacked-fourths-undercroft-left-open',
    name: 'Undercroft left open',
    category: 'drone',
    description:
      'A dark drone of saw and pulse an octave apart, breathing open slowly under a band pulsing once every two seconds.',
    preview: ONE_STACK,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        ampAttack: 0.8,
        ampRelease: 2,
        cutoff: 420,
        resonance: 0.15,
        subLevel: 0.2,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'One up, one down', params: { depth: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },

  // Aurora: pipes and brass holding the stack, from dead still to slow phasing.
  {
    id: 'stacked-fourths-what-both-stacks-share',
    name: 'What both stacks share',
    category: 'organ',
    description:
      'Still pipes filtered by what was sounding half a second ago, so tones two chords share hang over the change.',
    preview: ROLLED,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { brilliance: 2200, release: 1, volume: -12 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Common tones',
        params: { ago: 500, ring: 0.65, mix: 0.7 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'stacked-fourths-tin-roof-at-first-light',
    name: 'Tin roof at first light',
    category: 'pad',
    description:
      'A bright ring-modulated chord with a quick start, swept by a flanger with negative feedback, in a hall.',
    preview: THREE_PURE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 4000, attack: 0.05, swell: 0.1, ring: 0.7, release: 1.5, volume: -10 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-fourths-beat-slower-than-breath',
    name: 'Beat slower than breath',
    category: 'pad',
    description:
      'Two layers a cent and a half apart, one beat taking several seconds low down, in a spectral halo tilted to the top.',
    preview: TURNED,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow phasing',
      params: { attack: 0.9, release: 4, brilliance: 3000, volume: -11 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { shimmer: 0.3 } }],
  },
  {
    id: 'stacked-fourths-horns-through-a-hatch',
    name: 'Horns through a hatch',
    category: 'wind',
    description:
      'A thin muted brass line with its tone pressed into a hollow tube, and an echo of it from far off.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { resonance: 0.4, lowCut: 600, attack: 0.08, volume: 0.5 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.8 } },
      { deviceId: 'constellation', preset: 'One far star', params: { span: 1200, mix: 0.4 } },
    ],
  },
  {
    id: 'stacked-fourths-swell-from-the-cistern',
    name: 'Swell from the cistern',
    category: 'pad',
    description:
      'A dark pad that opens as it is held, inside a long stopped pipe with some breath in it, under wide drifting fog.',
    preview: SLID,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { attack: 0.9, swell: 0.8, brilliance: 500, release: 3, volume: -10 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.5, size: 2.5 } },
      { deviceId: 'fog', preset: 'Wide drone', params: { mix: 0.5 } },
    ],
  },
]
