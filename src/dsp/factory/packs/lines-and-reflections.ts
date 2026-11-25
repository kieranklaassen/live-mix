import { type FactoryPreset, type Phrase } from '../types'

// What is played and the same turned upside down round D: together, in answer,
// a moment later, or the reflection alone. The hand's phrases are white-key
// lines and chords chosen so that the line and its inversion agree.

// A line that opens like a wedge against its own fall. Held notes are D, E and
// C, which meet their mirrors in unisons and thirds or sixths; each tritone of
// F and B closes by step to the third or opens by step to the sixth.
const WEDGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.78, note: 62, gain: 0.6 },
    { atSec: 0.8, durSec: 0.78, note: 64, gain: 0.62 },
    { atSec: 1.6, durSec: 0.38, note: 65, gain: 0.55 },
    { atSec: 2, durSec: 0.78, note: 64, gain: 0.6 },
    { atSec: 2.8, durSec: 0.38, note: 67, gain: 0.55 },
    { atSec: 3.2, durSec: 0.38, note: 69, gain: 0.58 },
    { atSec: 3.6, durSec: 0.38, note: 71, gain: 0.6 },
    { atSec: 4, durSec: 0.98, note: 72, gain: 0.66 },
    { atSec: 5, durSec: 1.4, note: 74, gain: 0.6 },
  ],
}

// A canon by inversion at 0.75 s: each note is consonant with the mirror of the one before it.
const FOLLOW: Phrase = {
  notes: [62, 65, 62, 69, 67, 72, 71, 69, 62].map((note, i) => ({
    atSec: i * 0.75,
    durSec: i === 8 ? 0.6 : 0.72,
    note,
    gain: note > 68 ? 0.64 : 0.57,
  })),
}

// The same at 1.25 s, in five long notes: D A B C E over D G F E C.
const LONG_FOLLOW: Phrase = {
  notes: [62, 69, 71, 72, 76].map((note, i) => ({
    atSec: i * 1.25,
    durSec: 1.22,
    note,
    gain: 0.6,
  })),
}

// Four close chords, C, F, G and C; turned they are A minor, E minor, D minor and A minor.
const TRIADS: Phrase = {
  notes: [
    [60, 64, 67],
    [60, 65, 69],
    [59, 62, 67],
    [60, 64, 67],
  ].flatMap((chord, i) =>
    chord.map((note) => ({
      atSec: i * 1.6,
      durSec: i === 3 ? 1.8 : 1.5,
      note,
      gain: 0.5,
    })),
  ),
}

// Four chords that agree with their mirrors, C, A minor, D minor and G: turned, A minor, C, G and
// D minor, so each pair is a sixth chord, a seventh or the ninth on G, with no semitone in it.
const KINDRED: Phrase = {
  notes: [
    [60, 64, 67],
    [60, 64, 69],
    [62, 65, 69],
    [62, 67, 71],
  ].flatMap((chord, i) =>
    chord.map((note) => ({
      atSec: i * 1.6,
      durSec: i === 3 ? 1.8 : 1.5,
      note,
      gain: 0.5,
    })),
  ),
}

// The same cut to half, so a mirror that comes 0.8 s late stands alone in the gap.
const KINDRED_SHORT: Phrase = {
  notes: KINDRED.notes.map((note) => ({ ...note, durSec: 0.78 })),
}

// Four open chords for a mirror one chord late, D minor, G, F and C: over them come the mirrors of
// the chord before, G over G, D minor over F, E minor over C, and A minor alone.
const MEETING: Phrase = {
  notes: [
    [50, 57, 65],
    [43, 50, 59],
    [53, 60, 69],
    [48, 55, 64],
  ].flatMap((chord, i) =>
    chord.map((note) => ({
      atSec: i * 1.5,
      durSec: 1.45,
      note,
      gain: 0.46,
    })),
  ),
}

// Four open chords, D minor, F, C and G over D; with their mirrors, G9 on D, F with its
// ninth and raised fourth, C with its sixth, and G9 on D again.
const OPEN: Phrase = {
  notes: [
    [50, 57, 65],
    [53, 60, 69],
    [48, 55, 64],
    [50, 59, 67],
  ].flatMap((chord, i) =>
    chord.map((note) => ({
      atSec: i * 1.65,
      durSec: i === 3 ? 1.8 : 1.58,
      note,
      gain: 0.46,
    })),
  ),
}

// Two rising calls, each played twice with a rest between, so every second one can come back falling.
const CALLS: Phrase = {
  notes: [
    [57, 60, 62, 64],
    [57, 60, 62, 64],
    [64, 67, 69, 72],
    [64, 67, 69, 72],
  ].flatMap((call, i) =>
    call.map((note, j) => ({
      atSec: i * 1.85 + j * 0.28,
      durSec: j === 3 ? 0.36 : 0.26,
      note,
      gain: 0.55 + j * 0.03,
    })),
  ),
}

// One call three times, for three sides: as played, turned, turned and brought back.
const THRICE: Phrase = {
  notes: [0, 1, 2].flatMap((i) =>
    [67, 69, 72, 74].map((note, j) => ({
      atSec: i * 2.2 + j * 0.36,
      durSec: j === 3 ? 0.42 : 0.34,
      note,
      gain: 0.6,
    })),
  ),
}

// Three bars of three: D minor, C, D minor, a bass and two chords to each.
const THREES: Phrase = {
  notes: [
    [[50], [65, 69], [65, 72]],
    [[48], [64, 67], [67, 72]],
    [[50], [65, 69], [62, 65]],
  ].flatMap((bar, i) =>
    bar.flatMap((chord, j) =>
      chord.map((note) => ({
        atSec: (i * 3 + j) * 0.72,
        durSec: j === 0 ? 0.7 : 0.62,
        note,
        gain: j === 0 ? 0.6 : 0.44,
      })),
    ),
  ),
}

// A bass falling D C B A under D minor, C, G seventh and A minor: turned, it is a descant rising D E F G.
const DESCANT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 50, gain: 0.6 },
    { atSec: 0.4, durSec: 1.1, note: 65, gain: 0.4 },
    { atSec: 0.4, durSec: 1.1, note: 69, gain: 0.42 },
    { atSec: 1.6, durSec: 1.55, note: 48, gain: 0.6 },
    { atSec: 2, durSec: 1.1, note: 64, gain: 0.4 },
    { atSec: 2, durSec: 1.1, note: 67, gain: 0.42 },
    { atSec: 3.2, durSec: 1.55, note: 47, gain: 0.6 },
    { atSec: 3.6, durSec: 1.1, note: 65, gain: 0.4 },
    { atSec: 3.6, durSec: 1.1, note: 67, gain: 0.42 },
    { atSec: 4.8, durSec: 1.9, note: 45, gain: 0.6 },
    { atSec: 5.2, durSec: 1.5, note: 64, gain: 0.4 },
    { atSec: 5.2, durSec: 1.5, note: 72, gain: 0.44 },
  ],
}

// A thumb under picked fingers, D minor and then C: the fingers can turn while the thumb stays.
const THUMB: Phrase = {
  notes: [50, 65, 69, 74, 57, 72, 69, 65, 48, 64, 67, 72, 55, 76, 72, 67, 50].map((note, i) => ({
    atSec: i * 0.4,
    durSec: i === 16 ? 0.9 : note < 60 ? 0.75 : 0.5,
    note,
    gain: note < 60 ? 0.6 : 0.48,
  })),
}

// A line over a held D, for a canon by inversion at 1.5 s in which the bass takes no part. It opens
// on D and A and closes on the mirror of that, D and G.
const OVER_A_PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.7, note: 50, gain: 0.5 },
    ...[69, 72, 71, 76, 74, 72, 69].map((note, i) => ({
      atSec: i * 0.75,
      durSec: i === 6 ? 1.2 : 0.72,
      note,
      gain: 0.56,
    })),
    { atSec: 3.75, durSec: 0.72, note: 45, gain: 0.5 },
    { atSec: 4.5, durSec: 2.6, note: 50, gain: 0.48 },
  ],
}

// A falling line over a slow bass, for a canon by inversion at 1.8 s: D C B G A D under which the
// mirror goes D E F A G D, each meeting a third, a sixth, a fourth over its root or a fifth.
const OVER_A_BASS: Phrase = {
  notes: [
    ...[
      [0, 2.65, 50],
      [2.7, 0.85, 48],
      [3.6, 0.85, 53],
      [4.5, 0.85, 50],
      [5.4, 0.85, 43],
      [6.3, 1, 50],
    ].map(([atSec = 0, durSec = 1, note = 50]) => ({ atSec, durSec, note, gain: 0.5 })),
    ...[74, 72, 71, 67, 69, 74].map((note, i) => ({
      atSec: i * 0.9,
      durSec: i === 5 ? 1.2 : 0.87,
      note,
      gain: 0.56,
    })),
  ],
}

// D F A C rising, then A D B E: 3.2 s later the first half comes down as D B G E under the second,
// and goes on alone to G and the low D.
const RIPPLE: Phrase = {
  notes: [62, 65, 69, 72, 69, 74, 71, 76].map((note, i) => ({
    atSec: i * 0.8,
    durSec: 0.77,
    note,
    gain: i < 4 ? 0.6 : 0.5,
  })),
}

// Hands on a pan: a low D and the tones round it, with room between.
const HANDS: Phrase = {
  notes: [
    [0, 50],
    [0.8, 57],
    [1.2, 60],
    [1.6, 62],
    [2.4, 64],
    [2.8, 60],
    [3.2, 50],
    [4, 62],
    [4.4, 65],
    [4.8, 64],
    [5.6, 60],
    [6, 57],
    [6.4, 50],
  ].map(([atSec = 0, note = 62]) => ({
    atSec,
    durSec: note === 50 ? 0.75 : 0.5,
    note,
    gain: note === 50 ? 0.62 : 0.52,
  })),
}

export const PRESETS: readonly FactoryPreset[] = [
  // Acoustic guitar.
  {
    id: 'lines-and-reflections-wedge-in-steel',
    name: 'Wedge in steel',
    category: 'plucked',
    description:
      'A steel-string line and its mirror struck together, opening away from each other, on a small plate.',
    preview: WEDGE,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.8 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { body: 0.6, position: 0.12, sustain: 5, volume: 1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.24 } }],
  },
  {
    id: 'lines-and-reflections-strummed-face-down',
    name: 'Strummed face down',
    category: 'plucked',
    description:
      'Only the mirror of each chord, strummed slowly on steel strings, with a chorus and a hint of spring tank.',
    preview: TRIADS,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down' },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { strum: 95, tone: 0.55, release: 1, volume: -0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'lines-and-reflections-bamboo-comes-after',
    name: 'Bamboo comes after',
    category: 'plucked',
    description:
      'A ringing guitar line answered 1.25 s later, turned round the G sharp, by a bamboo flute, both in the open air.',
    preview: LONG_FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { axis: 1, delay: 1.25, level: 0.75 },
      parts: {
        mirror: {
          deviceId: 'flute',
          preset: 'Bamboo vibrato',
          params: { attack: 0.15, release: 0.9, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { nail: 0.2, position: 0.3, release: 3, volume: -0.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'lines-and-reflections-nylon-asks-tines-tell',
    name: 'Nylon asks, tines tell',
    category: 'plucked',
    description:
      'Short nylon calls where every other one comes back falling on kalimba tines, heard inside a wooden box.',
    preview: CALLS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Say and answer',
      params: { rest: 0.5, level: 1 },
      parts: { mirror: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -9 } } },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { sustain: 1, release: 0.2, volume: 4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'lines-and-reflections-three-facets-of-a-call',
    name: 'Three facets of a call',
    category: 'plucked',
    description:
      'A twelve-string call, its mirror falling from high over it, then the same brought down to where the call began.',
    preview: THRICE,
    maker: { makerId: 'mirror-on-d', preset: 'Three sides', params: { octave: 5, rest: 0.4 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { sustain: 4, release: 0.6, volume: 5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.22 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 18, outputGain: -10 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'lines-and-reflections-thumb-keeps-its-place',
    name: 'Thumb keeps its place',
    category: 'plucked',
    description:
      'A fingerpicked nylon guitar whose thumb notes stay as played while all the fingers turn down below D.',
    preview: THUMB,
    maker: { makerId: 'mirror-on-d', preset: 'The bass stays', params: { level: 1 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { sustain: 4, release: 0.8, strum: 0, volume: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lines-and-reflections-picked-from-the-far-side',
    name: 'Picked from the far side',
    category: 'plucked',
    description:
      'A glassy picked pattern, its high notes doubled by their mirrors round the G sharp over D, so both share one register.',
    preview: THUMB,
    maker: { makerId: 'mirror-on-d', preset: 'Far side', params: { level: 0.6, turns: 1 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { sustain: 5, release: 1.5, tone: 0.8, volume: 1.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 24, outputGain: -10.5 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-descant-of-the-floor',
    name: 'Descant of the floor',
    category: 'plucked',
    description:
      'A falling guitar bass whose mirror rises over the chords on thin sine chimes, all of it on drifting tape.',
    preview: DESCANT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass rises',
      params: { level: 0.75 },
      parts: {
        mirror: {
          deviceId: 'fm-glass',
          preset: 'Sine chimes',
          params: { release: 3, volume: -8.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { sustain: 5, volume: 1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-steel-bar-in-canon',
    name: 'Steel bar in canon',
    category: 'plucked',
    description:
      'A dark guitar line over a held bass, followed 1.5 s later by its inversion on a swelling pedal steel.',
    preview: OVER_A_PEDAL,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.5, level: 0.8 },
      parts: {
        mirror: {
          deviceId: 'pedal-steel',
          preset: 'Slow steel',
          params: { swell: 0.15, range: 0, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { tone: 0.3, sustain: 7, release: 2, volume: -4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'lines-and-reflections-faint-hand-inside',
    name: 'Faint hand inside',
    category: 'plucked',
    description:
      'Muted steel-string chords, their mirrors folded in among them note by note and soft, then a detuned double of it all.',
    preview: KINDRED,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Faint inner voices',
      params: { level: 0.5, delay: 0.3 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { sustain: 1.8, release: 0.25, body: 0.9, volume: 1.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'lines-and-reflections-chords-take-turns',
    name: 'Chords take turns',
    category: 'plucked',
    description:
      'Every other chord comes back as its mirror, C and then E minor, on nylon near the bridge with a short tape echo.',
    preview: TRIADS,
    maker: { makerId: 'mirror-on-d', preset: 'Every other chord', params: { level: 1 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { sustain: 4, strum: 40, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.22 } },
      { deviceId: 'analog-drive', preset: 'First hint' },
    ],
  },
  {
    id: 'lines-and-reflections-waltz-facing-itself',
    name: 'Waltz facing itself',
    category: 'plucked',
    description:
      'Bars of three on a twelve string: one as played, one turned so its bass is on top, one turned and brought back down.',
    preview: THREES,
    maker: { makerId: 'mirror-on-d', preset: 'Three at a time', params: { fold: 0, level: 0.95 } },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { sustain: 3, release: 0.4, tone: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-four-tones-come-down',
    name: 'Four tones come down',
    category: 'plucked',
    description:
      'Four nylon notes rising, and 3.2 s later the same four falling on a low reed under what is played by then.',
    preview: RIPPLE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Slow ripple',
      params: { delay: 3.2, fold: 0, level: 0.7 },
      parts: {
        mirror: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.12, release: 0.5, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { sustain: 6, release: 2, volume: 1 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-high-water-on-wire',
    name: 'High water on wire',
    category: 'plucked',
    description:
      'A bare wire guitar rising while its mirror falls from two octaves over it on soft celesta bars, an eighth of a second late.',
    preview: WEDGE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'High water',
      params: { level: 0.6, delay: 0.125 },
      parts: { mirror: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -8 } } },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { sustain: 4, release: 1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
    ],
  },

  // Handpan.
  {
    id: 'lines-and-reflections-two-pairs-of-hands',
    name: 'Two pairs of hands',
    category: 'bell',
    description:
      'A handpan and its mirror tapped together, the low D answered by a high one, over a bank of strings in sympathy.',
    preview: HANDS,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.6 } },
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 2.2, touch: 0.15, sympathy: 0.8, volume: 4 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo' },
      { deviceId: 'spread', preset: 'Everything wide' },
    ],
  },
  {
    id: 'lines-and-reflections-pan-asks-the-breath',
    name: 'Pan asks the breath',
    category: 'bell',
    description:
      'Calls on the edge of a pan, every other one returned falling by pan pipes round the D above, then scattered echoes.',
    preview: CALLS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Say and answer',
      params: { octave: 5, fold: 1, rest: 0.5, level: 0.95 },
      parts: { mirror: { deviceId: 'flute', preset: 'Pan pipes', params: { volume: -9 } } },
    },
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { decay: 2.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'lines-and-reflections-halo-seen-thrice',
    name: 'Halo seen thrice',
    category: 'bell',
    description:
      'A singing pan plays a call, its low mirror and the mirror lifted back, over a slow swirl of phase.',
    preview: THRICE,
    maker: { makerId: 'mirror-on-d', preset: 'Three sides', params: { rest: 0.5, level: 1 } },
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 4, volume: 3 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lines-and-reflections-ding-becomes-the-sky',
    name: 'Ding becomes the sky',
    category: 'bell',
    description:
      'Only the mirror of what the hands play, so a low steel ding sounds at the top; one short slap and a warm spring follow.',
    preview: HANDS,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down' },
    instrument: { deviceId: 'handpan', preset: 'Clean steel', params: { decay: 3, volume: -4 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-wood-follows-steel',
    name: 'Wood follows steel',
    category: 'bell',
    description:
      'A soft pan line and its inversion on marimba bars three quarters of a second behind, consonant at every step.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 0.75, level: 0.85 },
      parts: { mirror: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -5.5 } } },
    },
    instrument: { deviceId: 'handpan', preset: 'Centre tone', params: { decay: 2.5, volume: -2 } },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-tongue-in-its-own-place',
    name: 'Tongue in its own place',
    category: 'bell',
    description:
      'A tongue drum playing only mirrors, each note folded by octaves to where it was struck, through a worn cassette.',
    preview: HANDS,
    maker: { makerId: 'mirror-on-d', preset: 'In its own place' },
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { decay: 3, volume: 0 } },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
  },
  {
    id: 'lines-and-reflections-frost-over-the-drum',
    name: 'Frost over the drum',
    category: 'bell',
    description:
      'A palm-muted pan with its mirror, one to three octaves up, on glockenspiel bars, soft and a fifth of a second late.',
    preview: HANDS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'High water',
      params: { fold: 1, level: 0.4, delay: 0.2 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Resonator bells', params: { decay: 1, volume: 1 } },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Palm mute', params: { volume: 0.5 } },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'shimmer', preset: 'Narrow fifth', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-low-hand-up-high',
    name: 'Low hand up high',
    category: 'bell',
    description:
      'The tones of a pan below D sound again above it on an altos choir, short and half a second behind.',
    preview: HANDS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass rises',
      params: { level: 0.6, delay: 0.5 },
      parts: {
        mirror: {
          deviceId: 'choir',
          preset: 'Altos eh',
          params: { attack: 0.08, release: 0.7, volume: -6.5 },
        },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { decay: 3.5, volume: -1.5 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.25 } }],
  },
  {
    id: 'lines-and-reflections-rings-on-still-water',
    name: 'Rings on still water',
    category: 'bell',
    description:
      'A slow shimmering pan whose rising notes fall back 3.2 s later on the same steel, its bands rippling.',
    preview: RIPPLE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Slow ripple',
      params: { delay: 3.2, level: 0.8, fold: 1 },
    },
    instrument: { deviceId: 'handpan', preset: 'Slow shimmer', params: { decay: 5, volume: -1 } },
    effects: [
      { deviceId: 'currents', preset: 'Ripples' },
      { deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-knuckles-say-it-back',
    name: 'Knuckles say it back',
    category: 'bell',
    description:
      'Hard knuckle calls on a pan, each second one the same call inverted in its own octave, with a mono room slap.',
    preview: CALLS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Answer in place',
      params: { rest: 0.5, level: 0.95 },
    },
    instrument: { deviceId: 'handpan', preset: 'Knuckles', params: { volume: -3.5 } },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lines-and-reflections-deeper-rooted-tongue',
    name: 'Deeper rooted tongue',
    category: 'bell',
    description:
      'A pure tongue drum where every tone above low A flat gets a mirror beneath it on a plucked upright bass.',
    preview: HANDS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A deeper root',
      params: { level: 1 },
      parts: {
        mirror: { deviceId: 'string-bass', preset: 'Round upright', params: { volume: 6 } },
      },
    },
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { decay: 3, volume: 3.5 } },
    effects: [
      { deviceId: 'around', preset: 'Barely moving' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-pairs-of-taps',
    name: 'Pairs of taps',
    category: 'bell',
    description:
      'Rain taps on a pan: two as played, the next two turned, and so on round, thrown into a swarm of short echoes.',
    preview: HANDS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Every other chord',
      params: { strikes: 2, level: 1, fold: 1 },
    },
    instrument: { deviceId: 'handpan', preset: 'Rain taps', params: { damp: 0.4, volume: 4 } },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.25 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },

  // Electric guitar.
  {
    id: 'lines-and-reflections-violas-shadow-the-amp',
    name: 'Violas shadow the amp',
    category: 'plucked',
    description:
      'A clean neck-pickup line and its inversion on dark ensemble strings three quarters of a second behind, in a combo room.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 0.75, level: 0.8 },
      parts: {
        mirror: {
          deviceId: 'string-machine',
          preset: 'Violas',
          params: { attack: 0.06, release: 0.5, volume: -5.5 },
        },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Glass neck', params: { volume: -2 } },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
  },
  {
    id: 'lines-and-reflections-no-pick-both-ways',
    name: 'No pick, both ways',
    category: 'plucked',
    description:
      'A guitar line with its picks hidden by a short swell, meeting its own fall under a loose double of itself.',
    preview: WEDGE,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.9 } },
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { swell: 0.12, sustain: 12, volume: 6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'lines-and-reflections-mute-in-the-next-street',
    name: 'Mute in the next street',
    category: 'plucked',
    description:
      'Twanging bridge calls, each second one turned and given to a muted trumpet, both a few steps back.',
    preview: CALLS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Say and answer',
      params: { rest: 0.5, level: 1 },
      parts: {
        mirror: {
          deviceId: 'horns',
          preset: 'Muted distance',
          params: { attack: 0.03, release: 0.4, volume: 0.5 },
        },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { hardness: 0.6, tone: 4200, volume: 3.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-floor-hung-from-ceiling',
    name: 'Floor hung from ceiling',
    category: 'plucked',
    description:
      'Open guitar chords heard only as their mirrors, high and slowly strummed, with a harmonic tremolo.',
    preview: OPEN,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down' },
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { strum: 70, volume: -1 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-what-climbed-comes-down',
    name: 'What climbed comes down',
    category: 'plucked',
    description:
      'Only the fall of each rising call, moved by octaves to where it was played, on a growling driven guitar.',
    preview: CALLS,
    maker: { makerId: 'mirror-on-d', preset: 'The line falls', params: { rest: 0.5, level: 1 } },
    instrument: { deviceId: 'guitar', preset: 'Warm breakup', params: { sustain: 4, volume: -6 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'lines-and-reflections-chapel-answers-the-fret',
    name: 'Chapel answers the fret',
    category: 'plucked',
    description:
      'A line over a held low D, inverted 1.5 s later on small chapel flutes while the bass takes no part.',
    preview: OVER_A_PEDAL,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.5, level: 0.75 },
      parts: {
        mirror: { deviceId: 'organ', preset: 'Chapel flutes', params: { sub: 0.1, volume: -11.5 } },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { sustain: 8, volume: -2 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Plain hall', params: { mix: 0.22 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'lines-and-reflections-flutes-past-the-tritone',
    name: 'Flutes past the tritone',
    category: 'plucked',
    description:
      'Rolled open chords doubled round the far axis by soft flutes, an octave higher than the plain mirror would lie.',
    preview: OPEN,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Far side',
      params: { level: 0.6 },
      parts: {
        mirror: {
          deviceId: 'flute',
          preset: 'Soft wind lead',
          params: { vibrato: 0.2, scoop: 5, volume: -14 },
        },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Harp roll', params: { strum: 60, volume: -2 } },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'lines-and-reflections-one-bar-turns-the-next',
    name: 'One bar turns the next',
    category: 'plucked',
    description:
      'Stopped dark guitar bars in three: one as played, then two turned and kept near by octaves, with a short halo of room.',
    preview: THREES,
    maker: { makerId: 'mirror-on-d', preset: 'Three at a time', params: { level: 1 } },
    instrument: { deviceId: 'guitar', preset: 'Dark stops', params: { sustain: 2.2, volume: 1 } },
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'lines-and-reflections-tape-cellos-fall-back',
    name: 'Tape cellos fall back',
    category: 'plucked',
    description:
      'Four baritone guitar tones go up, and 3.2 s later taped cellos bring the same four down beneath the tune.',
    preview: RIPPLE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Slow ripple',
      params: { delay: 3.2, fold: 0, level: 0.85 },
      parts: {
        mirror: {
          deviceId: 'tape-orchestra',
          preset: 'Cello section',
          params: { hiss: 0.05, attack: 0.08, release: 0.6, volume: -5.5 },
        },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Dark baritone', params: { volume: -3 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.22 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'lines-and-reflections-bass-sung-by-magnets',
    name: 'Bass sung by magnets',
    category: 'plucked',
    description:
      'A twelve-string guitar whose falling bass goes up as a descant of magnet-sung strings, 0.4 s late.',
    preview: DESCANT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass rises',
      params: { level: 0.7, delay: 0.4 },
      parts: {
        mirror: {
          deviceId: 'magnet-piano',
          preset: 'Bowed glass',
          params: { bloom: 0.15, shimmer: 0.2, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { shimmer: 0.7, volume: 1.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'lines-and-reflections-relative-on-the-off-beat',
    name: 'Relative on the off beat',
    category: 'plucked',
    description:
      'Each bell-clean chord and, half a chord later, its mirror folded to the same place: C then A minor, D minor then G.',
    preview: KINDRED_SHORT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Fold by the phrase',
      params: { delay: 0.8, level: 0.7 },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { hardness: 0.6, position: 0.09, sustain: 6, strum: 12, volume: 1 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Faint ripple' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'lines-and-reflections-thumb-and-taking-turns',
    name: 'Thumb and taking turns',
    category: 'plucked',
    description:
      'A muted picking pattern over a steady thumb: the high notes are turned in every second pair, round the far axis.',
    preview: THUMB,
    maker: { makerId: 'mirror-on-d', preset: 'Answer over a bass', params: { level: 1, fold: 0 } },
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { sustain: 2, warmth: 0.4, volume: 5.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { envAmount: 25 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'lines-and-reflections-wires-in-the-treetops',
    name: 'Wires in the treetops',
    category: 'plucked',
    description:
      'A thick slow guitar line, and 0.75 s after each note its mirror far above on guzheng strings.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Reflected sky',
      params: { level: 0.85, delay: 0.75, turns: 0 },
      parts: {
        mirror: {
          deviceId: 'harp',
          preset: 'Guzheng',
          params: { decay: 0.6, damp: 0.5, volume: 4.5 },
        },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Thick growl',
      params: { strum: 0, sustain: 10, tone: 2000, warmth: 0.5, volume: -1 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-breath-held-then-turned',
    name: 'Breath held, then turned',
    category: 'plucked',
    description:
      'Swelled guitar calls, the second of each pair turned round the D above and brought down one octave.',
    preview: CALLS,
    maker: { makerId: 'mirror-on-d', preset: 'Long breaths', params: { rest: 0.55, level: 0.95 } },
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.09, sustain: 14, volume: 4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.25 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25 } },
    ],
  },

  // Glass.
  {
    id: 'lines-and-reflections-two-panes-opening',
    name: 'Two panes opening',
    category: 'bell',
    description:
      'A glass bell line opening against its own mirror, each tritone resolved by step, on a bright plate.',
    preview: WEDGE,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.65 } },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { release: 1.5, brightness: 0.35, volume: -9 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } }],
  },
  {
    id: 'lines-and-reflections-crystal-held-to-light',
    name: 'Crystal held to light',
    category: 'pad',
    description:
      'A crystal pad playing nothing but the mirrors of open chords, each band of it glinting in its own time.',
    preview: OPEN,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down', params: { level: 0.9 } },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { attack: 0.35, release: 1.4, volume: -12 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'lines-and-reflections-ice-repeats-the-call',
    name: 'Ice repeats the call',
    category: 'bell',
    description:
      'Ice chime calls with every second one inverted note by note in its own octave, skipping away as they end.',
    preview: CALLS,
    maker: { makerId: 'mirror-on-d', preset: 'Answer in place', params: { rest: 0.5, level: 0.9 } },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { release: 1.5, volume: -4.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.22 } }],
  },
  {
    id: 'lines-and-reflections-tine-page-turned-twice',
    name: 'Tine page turned twice',
    category: 'keys',
    description:
      'A tine call, its mirror an octave over it round the D above, then that mirror where the call was, through a slow rotor.',
    preview: THRICE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Three sides',
      params: { octave: 5, rest: 0.4, level: 0.95 },
    },
    instrument: { deviceId: 'fm-glass', preset: 'Tine keys', params: { decay: 2.4, volume: -9 } },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'lines-and-reflections-one-bow-under-metal',
    name: 'One bow under metal',
    category: 'pad',
    description:
      'Bowed metal in long notes and a single close bow playing the inversion 1.25 s behind, every meeting consonant.',
    preview: LONG_FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 1.25, level: 0.85 },
      parts: {
        mirror: { deviceId: 'chamber-strings', preset: 'Close solo', params: { volume: -5 } },
      },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { attack: 0.2, release: 1.2, volume: -12 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'lines-and-reflections-organ-of-inner-panes',
    name: 'Organ of inner panes',
    category: 'organ',
    description:
      'A glass organ chord with its mirror folded softly inside it, a quarter second late, gently breathing.',
    preview: KINDRED,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Faint inner voices',
      params: { level: 0.55, delay: 0.25 },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { attack: 0.08, volume: -15 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Barely there' },
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'lines-and-reflections-warm-glass-cool-pipes',
    name: 'Warm glass, cool pipes',
    category: 'pad',
    description:
      'Every other chord leaves a warm detuned glass pad and comes back turned on still synthesizer pipes, with a distant plate.',
    preview: TRIADS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Every other chord',
      params: { level: 1 },
      parts: {
        mirror: {
          deviceId: 'aurora',
          preset: 'Still pipes',
          params: { release: 0.7, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { attack: 0.12, release: 0.8, volume: -12 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-rim-and-needle',
    name: 'Rim and needle',
    category: 'bell',
    description:
      'Rubbed glass in long notes and its mirror needle-high on glockenspiel bars, turned round the D two octaves up, 1.25 s late.',
    preview: LONG_FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'High water',
      params: { octave: 6, fold: 1, delay: 1.25, level: 0.55 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Glockenspiel', params: { mallet: 0.4, volume: 4 } },
      },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { attack: 0.18, release: 1.2, volume: -12 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.22, decay: 5 } },
    ],
  },
  {
    id: 'lines-and-reflections-toy-canon-overhead',
    name: 'Toy canon overhead',
    category: 'keys',
    description:
      'Small toy keys in canon with their inversion round the far axis, an octave over the plain mirror and 0.75 s late.',
    preview: FOLLOW,
    maker: { makerId: 'mirror-on-d', preset: 'Far side', params: { delay: 0.75, level: 0.8 } },
    instrument: { deviceId: 'fm-glass', preset: 'Toy keys', params: { decay: 1, volume: -11 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { mix: 0.18, time: 375, feedback: 0.3 },
      },
    ],
  },
  {
    id: 'lines-and-reflections-vibes-above-an-upright',
    name: 'Vibes above an upright',
    category: 'bell',
    description:
      'An FM vibraphone line whose inversion walks as a plucked upright bass, three quarters of a second behind.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A deeper root',
      params: { delay: 0.75, level: 1 },
      parts: {
        mirror: {
          deviceId: 'string-bass',
          preset: 'Round upright',
          params: { sustain: 4, volume: 0 },
        },
      },
    },
    instrument: { deviceId: 'fm-glass', preset: 'Vibes', params: { volume: -9 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-bowl-remembers-rising',
    name: 'Bowl remembers rising',
    category: 'bell',
    description:
      'Temple bowls struck in a rising chord that returns as a falling one 3.2 s later, on a table of tuned bowls.',
    preview: RIPPLE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Slow ripple',
      params: { delay: 3.2, fold: 0, level: 0.8 },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { decay: 4, release: 2.5, volume: -10 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Short chime', params: { mix: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'lines-and-reflections-recorder-behind-the-bars',
    name: 'Recorder behind the bars',
    category: 'bell',
    description:
      'Chime bars over a held D and a plain wood recorder following them upside down, a second and a half behind.',
    preview: OVER_A_PEDAL,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.5, level: 0.8 },
      parts: {
        mirror: {
          deviceId: 'flute',
          preset: 'Soft recorder',
          params: { attack: 0.05, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { release: 1.6, volume: -12 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-pings-turned-under',
    name: 'Pings turned under',
    category: 'texture',
    description:
      'Short glass pings: a thumb line as played, and everything over the G sharp turned back beneath it, with grains in echo.',
    preview: THUMB,
    maker: { makerId: 'mirror-on-d', preset: 'The bass stays', params: { axis: 1, level: 1 } },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { decay: 0.6, release: 0.8, volume: -6 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Plain repeat', params: { mix: 0.25 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'lines-and-reflections-sky-taps-the-window',
    name: 'Sky taps the window',
    category: 'pad',
    description:
      'A slow glass chord and, half a chord later, the mirror of it tapped on small glasses high over the keyboard.',
    preview: KINDRED,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Reflected sky',
      params: { delay: 0.8, level: 0.6 },
      parts: {
        mirror: {
          deviceId: 'modal-bells',
          preset: 'Tapped glass',
          params: { decay: 2, volume: -2.5 },
        },
      },
    },
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { attack: 0.3, release: 1.4, volume: -13 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.28 } },
    ],
  },

  // West coast.
  {
    id: 'lines-and-reflections-gate-and-counter-gate',
    name: 'Gate and counter gate',
    category: 'plucked',
    description:
      'A gated wooden pluck and its mirror struck as one, opening and closing round D, bounced off two tape heads.',
    preview: HANDS,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.7 } },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { chance: 0.05, volume: -1.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.2 } }],
  },
  {
    id: 'lines-and-reflections-thumb-tines-reed-reply',
    name: 'Thumb tines, reed reply',
    category: 'plucked',
    description:
      'A thumb piano call, and the two turned versions of it, low and then level, on an open clarinet.',
    preview: THRICE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Three sides',
      params: { rest: 0.4, level: 1 },
      parts: { mirror: { deviceId: 'clarinet', preset: 'Open clarinet', params: { volume: 6 } } },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 1, volume: 4.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'lines-and-reflections-every-second-chime',
    name: 'Every second chime',
    category: 'bell',
    description:
      'Small chimes in which every second note struck is turned in its own octave, so one hand plays two crossed lines.',
    preview: HANDS,
    maker: { makerId: 'mirror-on-d', preset: 'Every other chord', params: { fold: 3, level: 1 } },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { decay: 1.8, colour: 0.8, volume: 3.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-quarter-second-fold',
    name: 'Quarter-second fold',
    category: 'plucked',
    description:
      'A bright folded pluck with its inversion a quarter second behind, opening away from it, under a faint flanger.',
    preview: WEDGE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Fold by the phrase',
      params: { delay: 0.25, level: 0.65 },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 2, colour: 0.75, volume: -1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Faint air' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'lines-and-reflections-two-pipes-in-a-yard',
    name: 'Two pipes in a yard',
    category: 'wind',
    description:
      'A hollow pipe in canon with its inversion round the far axis, 0.75 s on, the second one on breathy pan pipes in a wind.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { axis: 1, delay: 0.75, level: 0.9 },
      parts: {
        mirror: {
          deviceId: 'flute',
          preset: 'Whisper pipes',
          params: { attack: 0.06, release: 0.4, blow: 0.3, breath: 0.7, volume: -9.5 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { attack: 0.06, decay: 1.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.15 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-blooming-ninths',
    name: 'Blooming ninths',
    category: 'pad',
    description:
      'Open chords that bloom as they fold, with their mirrors over them half as hard, so G and D minor make a ninth.',
    preview: OPEN,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.5, delay: 0.1 } },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 0.3, decay: 1.2, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { mix: 0.35 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'lines-and-reflections-a-tune-digs-its-cellar',
    name: 'A tune digs its cellar',
    category: 'plucked',
    description:
      'A soft mallet line inverted 0.75 s later into a gliding sub bass, so the tune writes its own low part.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A deeper root',
      params: { delay: 0.75, level: 0.9 },
      parts: {
        mirror: {
          deviceId: 'sub-bass',
          preset: 'Gliding sub',
          params: { release: 0.4, glide: 0.12, volume: -21.5 },
        },
      },
    },
    instrument: { deviceId: 'west-coast', preset: 'Soft mallet', params: { volume: -2 } },
    effects: [
      { deviceId: 'spread', preset: 'Firm bass' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-call-answered-from-below',
    name: 'Call answered from below',
    category: 'bass',
    description:
      'A round low-pass pluck whose every other call is turned round the low D and falls into the bass, as far as bottom E.',
    preview: CALLS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Say and answer',
      params: { octave: 3, rest: 0.5, level: 1 },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { colour: 0.25, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-alto-trails-the-reeds',
    name: 'Alto trails the reeds',
    category: 'wind',
    description:
      'A folded reed tune over its own held D, followed upside down at 1.5 s by a ballad alto with some vibrato.',
    preview: OVER_A_PEDAL,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.5, level: 0.9 },
      parts: {
        mirror: {
          deviceId: 'clarinet',
          preset: 'Ballad alto',
          params: { vibrato: 0.5, volume: -4.5 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { symmetry: 0.6, colour: 0.35, volume: -8.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
    ],
  },
  {
    id: 'lines-and-reflections-straight-toned-descant',
    name: 'Straight-toned descant',
    category: 'plucked',
    description:
      'Hollow plucks on a falling bass, the bass also rising over them as a straight flute with no vibrato.',
    preview: DESCANT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass rises',
      params: { level: 0.7 },
      parts: {
        mirror: {
          deviceId: 'flute',
          preset: 'Straight tone',
          params: { attack: 0.12, release: 0.5, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { decay: 1.1, fm: 0.25, volume: -1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-gongs-counted-backwards',
    name: 'Gongs counted backwards',
    category: 'bell',
    description:
      'Long FM gongs that sound only the inversion of a slow rising line, so it goes down, two voices of it wandering close by.',
    preview: LONG_FOLLOW,
    maker: { makerId: 'mirror-on-d', preset: 'The line falls', params: { level: 1, fold: 0 } },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { decay: 4, fm: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-box-above-the-pulse',
    name: 'Box above the pulse',
    category: 'plucked',
    description:
      'A deep soft pulse, and half a second after each of its notes the mirror of it on a music box over the keyboard.',
    preview: HANDS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Reflected sky',
      params: { fold: 1, level: 0.5, delay: 0.5 },
      parts: {
        mirror: { deviceId: 'modal-bells', preset: 'Music box', params: { decay: 1.5, volume: 6 } },
      },
    },
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { colour: 0.35, decay: 0.8, sustain: 0.4, volume: -2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.4 } },
    ],
  },

  // Chord harp.
  {
    id: 'lines-and-reflections-plates-swept-apart',
    name: 'Plates swept apart',
    category: 'plucked',
    description:
      'A chord harp swept upward and, at once, a second one sweeping its mirror chord down, so C lies over A minor.',
    preview: KINDRED,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Both ways',
      params: { level: 0.8 },
      parts: {
        mirror: {
          deviceId: 'chord-harp',
          preset: 'Falling harp',
          params: { sustain: 1.5, volume: -3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { sustain: 1.8, pad: 0.1, volume: -2.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } }],
  },
  {
    id: 'lines-and-reflections-open-then-shut',
    name: 'Open, then shut',
    category: 'plucked',
    description:
      'Wide chords on a brushed strum plate, every second one turned and folded near, under a quick harmonic tremolo.',
    preview: OPEN,
    maker: { makerId: 'mirror-on-d', preset: 'Every other chord', params: { fold: 1, level: 1 } },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { sustain: 2.5, volume: -4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { depth: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-toy-plate-face-down',
    name: 'Toy plate, face down',
    category: 'plucked',
    description:
      'A short bright toy strum of each chord turned over, A minor for C and E minor for F, through an early sampler.',
    preview: TRIADS,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down' },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { sustain: 1.6, strum: 30, volume: -3 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-glass-climbs-the-steps',
    name: 'Glass climbs the steps',
    category: 'plucked',
    description:
      'Muffled slow strums over a bass going down, whose mirror climbs D E F G above them on soft glass bars.',
    preview: DESCANT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass rises',
      params: { level: 0.8 },
      parts: {
        mirror: {
          deviceId: 'twin-bars',
          preset: 'Glass, middle',
          params: { decay: 4, volume: -3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { strum: 60, sustain: 2.5, pad: 0.2, volume: -7 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'lines-and-reflections-short-voices-off-plate',
    name: 'Short voices off plate',
    category: 'voice',
    description:
      'A scattered chord harp with the mirror of each chord sung over it on short open vowels, half a chord later.',
    preview: MEETING,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 0.8, level: 0.6 },
      parts: {
        mirror: {
          deviceId: 'choir',
          preset: 'Short ah',
          params: { attack: 0.06, release: 0.4, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Scattered glints',
      params: { strum: 60, tone: 0.6, sustain: 1.4, volume: 2 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'lines-and-reflections-sparkle-of-both-chords',
    name: 'Sparkle of both chords',
    category: 'pad',
    description:
      'Pad and plucked sparkle holding each chord with its mirror round the G sharp, so every sweep is of six notes.',
    preview: KINDRED,
    maker: { makerId: 'mirror-on-d', preset: 'Far side', params: { level: 0.5 } },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { sustain: 1.2, pad: 0.6, volume: -13 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-boxed-waltz-turned',
    name: 'Boxed waltz, turned',
    category: 'bell',
    description:
      'A small music box of a chord harp in bars of three: as played, turned with the bass on top, and turned back into place.',
    preview: THREES,
    maker: { makerId: 'mirror-on-d', preset: 'Three at a time', params: { fold: 0, level: 1 } },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Small music box',
      params: { sustain: 1.4, span: 0, volume: -4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-silk-behind-the-chimes',
    name: 'Silk behind the chimes',
    category: 'plucked',
    description:
      'A chiming line over its slow bass, returned upside down 1.8 s later on soft silk strings with a slight press.',
    preview: OVER_A_BASS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.8, fold: 1, level: 0.9 },
      parts: {
        mirror: {
          deviceId: 'harp',
          preset: 'Soft silk',
          params: { bend: 25, decay: 1, damp: 0.4, volume: 4.5 },
        },
      },
    },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { span: 0, sustain: 2.5, volume: -7 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-dust-on-the-plate',
    name: 'Dust on the plate',
    category: 'plucked',
    description:
      'A falling strum of each chord with a tremolo celesta over it playing the mirror, two octaves up and 0.4 s late.',
    preview: KINDRED,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'High water',
      params: { level: 0.6, delay: 0.4 },
      parts: {
        mirror: { deviceId: 'mallets', preset: 'Tremolo celesta', params: { volume: -2.5 } },
      },
    },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow falling pad',
      params: { strum: 70, sustain: 2, pad: 0.3, volume: -7.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-ripple-returns-in-place',
    name: 'Ripple returns in place',
    category: 'plucked',
    description:
      'Calls that ripple an octave on each note, every other call inverted note by note where it lies, pulsed by two gates.',
    preview: CALLS,
    maker: { makerId: 'mirror-on-d', preset: 'Answer in place', params: { rest: 0.5, level: 1 } },
    instrument: {
      deviceId: 'chord-harp',
      preset: 'One octave ripple',
      params: { strum: 45, sustain: 1.6, volume: -3 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift', params: { mix: 0.5 } },
      { deviceId: 'reverse-delay', preset: 'Tight stutter', params: { mix: 0.2 } },
    ],
  },

  // Aurora.
  {
    id: 'lines-and-reflections-brass-and-bowed-ninths',
    name: 'Brass and bowed ninths',
    category: 'pad',
    description:
      'A slow brass pad in open chords and their mirrors above it on a warm bowed section: D minor and G become one ninth.',
    preview: OPEN,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Both ways',
      params: { level: 0.6 },
      parts: {
        mirror: {
          deviceId: 'chamber-strings',
          preset: 'Warm section',
          params: { attack: 0.3, release: 0.8, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { attack: 0.22, release: 1.1, volume: -8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } }],
  },
  {
    id: 'lines-and-reflections-horns-hand-it-to-tenors',
    name: 'Horns hand it to tenors',
    category: 'pad',
    description:
      'Soft synthesizer horns play a chord and tenors sing the next one turned over, through a quarter inch reel.',
    preview: TRIADS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Every other chord',
      params: { level: 1 },
      parts: {
        mirror: {
          deviceId: 'choir',
          preset: 'Tenors oh',
          params: { attack: 0.15, release: 0.8, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.25, release: 1, volume: -12 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.1 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-night-seen-from-above',
    name: 'Night seen from above',
    category: 'voice',
    description:
      'A vowel-like pad that plays only the mirrors of low open chords, so basses become tops, drifting in its bands.',
    preview: OPEN,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down', params: { level: 0.9 } },
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 0.35, release: 1.4, volume: -11 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-horn-after-the-vowel',
    name: 'Horn after the vowel',
    category: 'pad',
    description:
      'Long notes that open like a vowel, with a solo horn going the other way 1.25 s behind them.',
    preview: LONG_FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 1.25, level: 0.9 },
      parts: {
        mirror: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.12, release: 0.7, volume: -2.5 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.25, release: 1.5, resonance: 0.6, volume: -7.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'lines-and-reflections-pipes-part-like-doors',
    name: 'Pipes part like doors',
    category: 'organ',
    description:
      'Still synthesizer pipes playing a line and its mirror together, with organ stops of their own drawn over both.',
    preview: WEDGE,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 1 } },
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 0.8, volume: -13 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-mute-answers-mute',
    name: 'Mute answers mute',
    category: 'wind',
    description:
      'A nasal muted lead asking in short calls, the second of each turned round the D above and folded an octave down.',
    preview: CALLS,
    maker: { makerId: 'mirror-on-d', preset: 'Long breaths', params: { rest: 0.6, level: 0.9 } },
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { attack: 0.04, release: 0.5, resonance: 0.6, volume: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-cello-beneath-the-reeds',
    name: 'Cello beneath the reeds',
    category: 'pad',
    description:
      'Loose detuned reeds over a slow bass and a bowed cello coming after the tune, inverted and 1.8 s late.',
    preview: OVER_A_BASS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.8, fold: 1, level: 0.85 },
      parts: {
        mirror: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.12, release: 0.5, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.1, release: 0.8, detune: 16, volume: -5.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-chime-inside-the-chord',
    name: 'Chime inside the chord',
    category: 'pad',
    description:
      'Ringing chime strings and, half a chord on, the mirror of each chord folded in softly note by note.',
    preview: KINDRED_SHORT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Faint inner voices',
      params: { delay: 0.8, level: 0.6 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { ring: 0.6, release: 1.4, volume: -10 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Falling ripple' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-tines-under-metal',
    name: 'Tines under metal',
    category: 'pad',
    description:
      'A metal pad rises through four tones and dark tines let the same four down again under it 3.2 s later.',
    preview: RIPPLE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Slow ripple',
      params: { delay: 3.2, fold: 0, level: 0.9 },
      parts: { mirror: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -10.5 } } },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.1, release: 1.6, ring: 0.35, volume: -0.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Late answer', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-next-chord-meets-last',
    name: 'Next chord meets last',
    category: 'pad',
    description:
      'Deep swelling chords, each under the mirror of the one before: G on G, D minor over F, E minor over C, 1.5 s a chord.',
    preview: MEETING,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 1.5, level: 0.55 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { brilliance: 600, attack: 0.4, release: 1.4, volume: -6 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
  },

  // Harp.
  {
    id: 'lines-and-reflections-silk-a-step-behind',
    name: 'Silk a step behind',
    category: 'plucked',
    description:
      'A muted concert harp and a bright koto-strung one playing its inversion three quarters of a second later.',
    preview: FOLLOW,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'A second behind',
      params: { delay: 0.75, level: 0.95 },
      parts: { mirror: { deviceId: 'harp', preset: 'Koto', params: { damp: 0.5, volume: 0 } } },
    },
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { damp: 0.5, volume: -5 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring' },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
  },
  {
    id: 'lines-and-reflections-rolled-then-overturned',
    name: 'Rolled, then overturned',
    category: 'plucked',
    description:
      'Slowly rolled harp chords of which only the mirrors are heard, A minor, E minor, D minor, in a warm low hall.',
    preview: TRIADS,
    maker: { makerId: 'mirror-on-d', preset: 'Upside down' },
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.6, decay: 1.2, damp: 0.4, volume: -2.5 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lines-and-reflections-left-hand-of-dark-tines',
    name: 'Left hand of dark tines',
    category: 'plucked',
    description:
      'A picked harp keeps its low notes and doubles each high one with its mirror on short dull tines, a tenth late.',
    preview: THUMB,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass stays',
      params: { mode: 1, level: 0.7, delay: 0.1 },
      parts: {
        mirror: {
          deviceId: 'tine-piano',
          preset: 'Short tines',
          params: { decay: 0.6, release: 0.2, tone: 0.3, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { damp: 0.3, volume: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-dark-harp-three-panes',
    name: 'Dark harp, three panes',
    category: 'plucked',
    description:
      'A hollow dark harp says a call, says it inverted and lower, then inverted where it stood.',
    preview: THRICE,
    maker: { makerId: 'mirror-on-d', preset: 'Three sides', params: { rest: 0.4, level: 1 } },
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { damp: 0.5, decay: 1, volume: -2 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers' },
      { deviceId: 'prism', preset: 'Faint trail' },
    ],
  },
  {
    id: 'lines-and-reflections-steel-fan-spread-twice',
    name: 'Steel fan spread twice',
    category: 'plucked',
    description:
      'A bright steel-strung zither line and its mirror kept in its own register, four tenths of a second apart.',
    preview: WEDGE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Fold by the phrase',
      params: { delay: 0.4, level: 0.8 },
    },
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { decay: 1.5, damp: 0.5, halo: 0.6, touch: 0.45, pluck: 0.1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-soloist-climbs-the-harp',
    name: 'Soloist climbs the harp',
    category: 'plucked',
    description:
      'A long-ringing harp steps down under its chords while one voice with a slight vibrato sings those steps going up.',
    preview: DESCANT,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'The bass rises',
      params: { level: 0.8, delay: 0.2 },
      parts: {
        mirror: { deviceId: 'choir', preset: 'Soloist', params: { vibrato: 18, volume: -8 } },
      },
    },
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { decay: 1.6, damp: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'lines-and-reflections-harp-of-both-relatives',
    name: 'Harp of both relatives',
    category: 'plucked',
    description:
      'Open harp chords with their mirrors high over them on soft glass bars, half a second behind and an octave over the plain turn.',
    preview: OPEN,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Far side',
      params: { level: 0.5, delay: 0.55 },
      parts: {
        mirror: {
          deviceId: 'fm-glass',
          preset: 'Chime bars',
          params: { release: 1.5, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { sweep: 0.25, damp: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Wide halo', params: { mix: 0.12 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } },
    ],
  },

  // Felt piano.
  {
    id: 'lines-and-reflections-two-hands-one-mirror',
    name: 'Two hands, one mirror',
    category: 'keys',
    description:
      'Open chords on a thick-felted piano with their attacks softened, and their mirrors, half as hard, over them.',
    preview: OPEN,
    maker: { makerId: 'mirror-on-d', preset: 'Both ways', params: { level: 0.5 } },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.9,
        hardness: 0.15,
        thump: 0.2,
        width: 0.9,
        resonance: 0,
        reverbMix: 0,
        polyphony: 24,
        outputDb: -14.5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lines-and-reflections-hammer-then-bellows',
    name: 'Hammer, then bellows',
    category: 'keys',
    description:
      'An old upright plays one chord and a harmonium the next one turned: C, E minor, G, A minor.',
    preview: TRIADS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Every other chord',
      params: { level: 1 },
      parts: {
        mirror: {
          deviceId: 'organ',
          preset: 'Pump organ',
          params: { attack: 0.06, sub: 0, volume: -14.5 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { resonance: 0.2, reverbMix: 0.05, polyphony: 20, outputDb: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.08 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'lines-and-reflections-breath-lets-it-down',
    name: 'Breath lets it down',
    category: 'keys',
    description:
      'A bare bright piano goes up four notes, and 3.2 s later a breathy flugelhorn lets the same four down beneath.',
    preview: RIPPLE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Slow ripple',
      params: { delay: 3.2, fold: 0, level: 0.95 },
      parts: {
        mirror: {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { attack: 0.12, release: 0.6, volume: -3 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { resonance: 0.2, polyphony: 16, outputDb: -8 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.16 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-tenor-hand-follows',
    name: 'Tenor hand follows',
    category: 'keys',
    description:
      'A half-pedalled piano line over a slow bass, answered 1.8 s later by its own inversion, rising under its fall.',
    preview: OVER_A_BASS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Canon over a bass',
      params: { delay: 1.8, fold: 1, level: 0.7 },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { sustain: 0.2, polyphony: 20, outputDb: -16.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'lines-and-reflections-hammers-ask-bells-nod',
    name: 'Hammers ask, bells nod',
    category: 'keys',
    description:
      'A close felted piano asks and bell tines answer upside down round the D above, each reply folded down an octave.',
    preview: CALLS,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Say and answer',
      params: { octave: 5, fold: 1, rest: 0.5, level: 0.9 },
      parts: {
        mirror: {
          deviceId: 'tine-piano',
          preset: 'Bell tines',
          params: { release: 0.5, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { action: 0.5, pedalNoise: 0.2, resonance: 0.2, polyphony: 16, outputDb: -7 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow wander', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'lines-and-reflections-upright-turns-the-dance',
    name: 'Upright turns the dance',
    category: 'keys',
    description:
      'A glassy upright in bars of three with every second bar turned to its relative chord, each note in its own octave.',
    preview: THREES,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Three at a time',
      params: { round: 0, fold: 3, foldBy: 1, level: 1 },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: {
        hardness: 0.7,
        stiffness: 1.4,
        detune: 0.6,
        thump: 0.5,
        reverbMix: 0.1,
        resonance: 0.2,
        polyphony: 20,
        outputDb: -13,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.5 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'lines-and-reflections-harp-drops-from-the-sky',
    name: 'Harp drops from the sky',
    category: 'keys',
    description:
      'A soft thudding piano line and, 0.4 s on, its inversion coming down from two octaves up on a damped harp.',
    preview: WEDGE,
    maker: {
      makerId: 'mirror-on-d',
      preset: 'Reflected sky',
      params: { turns: 0, delay: 0.4, level: 0.7 },
      parts: {
        mirror: {
          deviceId: 'harp',
          preset: 'Short dry pluck',
          params: { decay: 0.8, damp: 0.6, volume: 5 },
        },
      },
    },
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.6, resonance: 0.2, reverbMix: 0, polyphony: 16, outputDb: -2 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.22 } },
      { deviceId: 'spread', preset: 'Soft tilt' },
    ],
  },
]
