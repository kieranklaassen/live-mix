import { type FactoryPreset, type Phrase } from '../types'

// A chord stacked up the harmonic series (4:5:6:7, and on to 9 and 11) and its twin hung down the
// subharmonic one (the same numbers as divisors). The two share a pure fifth, so from one to the
// other the fifth stands still while the 5/4 sinks to 6/5 (70 cents) and the 7/4 to 12/7 (36 cents).
// The presets come in pairs too: a bright one first, then its dark twin, each chain turned over.

// C E(-14) G B flat(-31) over C3, then A(+33) C E flat(+16) G: C and G are held throughout.
const BREATHES_OUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 55.02, gain: 0.5 },
    { atSec: 0, durSec: 3.45, note: 63.863, gain: 0.46 },
    { atSec: 0, durSec: 3.45, note: 69.688, gain: 0.38 },
    { atSec: 3.45, durSec: 3.75, note: 63.156, gain: 0.46 },
    { atSec: 3.45, durSec: 3.75, note: 69.331, gain: 0.42 },
  ],
}

// The other way on G and D, the weight on top: G D E(+33) B flat(+16), then G D F(-31) B(-14).
const BREATHES_IN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 43, gain: 0.36 },
    { atSec: 0, durSec: 7.2, note: 50.02, gain: 0.42 },
    { atSec: 0, durSec: 3.45, note: 64.331, gain: 0.48 },
    { atSec: 0, durSec: 3.45, note: 70.156, gain: 0.58 },
    { atSec: 3.45, durSec: 3.75, note: 64.688, gain: 0.48 },
    { atSec: 3.45, durSec: 3.75, note: 70.863, gain: 0.54 },
  ],
}

// Partials 4 5 6 7 9 11 of a C2 that is not played, each at 1/n, so the six fuse over it.
const SIX_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 60, gain: 0.84 },
    { atSec: 0, durSec: 7, note: 63.863, gain: 0.67 },
    { atSec: 0, durSec: 7, note: 67.02, gain: 0.56 },
    { atSec: 0, durSec: 7, note: 69.688, gain: 0.48 },
    { atSec: 0, durSec: 7, note: 74.039, gain: 0.37 },
    { atSec: 0, durSec: 7, note: 77.513, gain: 0.31 },
  ],
}

// One high note divided by 4 5 6 7 9 11 (A F D B G and a note half way from E flat to E),
// from the top down; 7 and 9 an octave under their own place, 11 two octaves under.
const SIX_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 81.02, gain: 0.5 },
    { atSec: 0.6, durSec: 6.6, note: 77.156, gain: 0.46 },
    { atSec: 1.2, durSec: 6, note: 74, gain: 0.44 },
    { atSec: 1.8, durSec: 5.4, note: 59.331, gain: 0.42 },
    { atSec: 2.4, durSec: 4.8, note: 54.98, gain: 0.38 },
    { atSec: 3, durSec: 4.2, note: 39.506, gain: 0.36 },
  ],
}

// F A C E flat (4:5:6:7), C E G B flat as 6:7:8:10 and back: C held, A up 84 cents to B flat, E flat up 119 to E.
const SWAY: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.48 },
    { atSec: 0, durSec: 2.4, note: 52.98, gain: 0.5 },
    { atSec: 0, durSec: 2.4, note: 56.844, gain: 0.44 },
    { atSec: 0, durSec: 2.4, note: 62.669, gain: 0.46 },
    { atSec: 2.4, durSec: 2.4, note: 55.02, gain: 0.5 },
    { atSec: 2.4, durSec: 2.4, note: 57.688, gain: 0.44 },
    { atSec: 2.4, durSec: 2.4, note: 63.863, gain: 0.46 },
    { atSec: 4.8, durSec: 2.4, note: 52.98, gain: 0.5 },
    { atSec: 4.8, durSec: 2.4, note: 56.844, gain: 0.44 },
    { atSec: 4.8, durSec: 2.4, note: 62.669, gain: 0.46 },
  ],
}

// Bare septimal triads on D: 6:7:9 and 14:18:21 by turns, between a held D and A.
const BARE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 69.02, gain: 0.46 },
    { atSec: 0, durSec: 1.8, note: 64.669, gain: 0.5 },
    { atSec: 1.8, durSec: 1.8, note: 66.351, gain: 0.5 },
    { atSec: 3.6, durSec: 1.8, note: 64.669, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 66.351, gain: 0.5 },
  ],
}

// Twins on the white keys: G D F G B (4:5:6:7), then D F A B (the same as divisors). D is held, B and F rise 49 cents, G goes to A.
const WHITE_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.48 },
    { atSec: 0, durSec: 3.5, note: 42.98, gain: 0.44 },
    { atSec: 0, durSec: 3.5, note: 64.668, gain: 0.44 },
    { atSec: 0, durSec: 3.5, note: 66.98, gain: 0.44 },
    { atSec: 0, durSec: 3.5, note: 70.844, gain: 0.42 },
    { atSec: 3.5, durSec: 3.7, note: 50, gain: 0.4 },
    { atSec: 3.5, durSec: 3.7, note: 65.156, gain: 0.44 },
    { atSec: 3.5, durSec: 3.7, note: 69.02, gain: 0.48 },
    { atSec: 3.5, durSec: 3.7, note: 71.331, gain: 0.42 },
  ],
}

// A subharmonic bass: A F D B, the roots of which the held A is in turn the 4th, 5th, 6th and 7th partial.
const UNDER_ONE_NOTE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 69, gain: 0.42 },
    { atSec: 0, durSec: 1.8, note: 45, gain: 0.62 },
    { atSec: 1.8, durSec: 1.8, note: 41.137, gain: 0.62 },
    { atSec: 3.6, durSec: 1.8, note: 37.98, gain: 0.62 },
    { atSec: 5.4, durSec: 1.8, note: 35.312, gain: 0.62 },
  ],
}

// A held C2 and its partials 4 5 6 7 9 11, one after another.
const LADDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 36, gain: 0.5 },
    { atSec: 0.4, durSec: 1.5, note: 60, gain: 0.5 },
    { atSec: 1.5, durSec: 1.5, note: 63.863, gain: 0.5 },
    { atSec: 2.6, durSec: 1.5, note: 67.02, gain: 0.5 },
    { atSec: 3.7, durSec: 1.5, note: 69.688, gain: 0.5 },
    { atSec: 4.8, durSec: 1.5, note: 74.039, gain: 0.46 },
    { atSec: 5.8, durSec: 1.5, note: 77.513, gain: 0.44 },
  ],
}

// A fifth opened from the top by the partials 7 and 9, shut, and opened from the bottom by their reciprocals: every two notes are the mirror of two before. For horns.
const WEDGE_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 67.02, gain: 0.55 },
    { atSec: 1.2, durSec: 1.2, note: 69.688, gain: 0.55 },
    { atSec: 2.4, durSec: 1.2, note: 74.039, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 67.02, gain: 0.52 },
    { atSec: 0, durSec: 4.8, note: 60, gain: 0.55 },
    { atSec: 4.8, durSec: 1.2, note: 57.331, gain: 0.55 },
    { atSec: 6, durSec: 1.2, note: 52.98, gain: 0.55 },
  ],
}

// The same wedge an octave up for two flutes, out to the eleventh on each side.
const WEDGE_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 79.02, gain: 0.55 },
    { atSec: 0.9, durSec: 0.9, note: 81.688, gain: 0.52 },
    { atSec: 1.8, durSec: 0.9, note: 86.039, gain: 0.48 },
    { atSec: 2.7, durSec: 0.9, note: 89.513, gain: 0.44 },
    { atSec: 3.6, durSec: 3.6, note: 79.02, gain: 0.5 },
    { atSec: 0, durSec: 4.5, note: 72, gain: 0.52 },
    { atSec: 4.5, durSec: 0.9, note: 69.331, gain: 0.55 },
    { atSec: 5.4, durSec: 0.9, note: 64.98, gain: 0.55 },
    { atSec: 6.3, durSec: 0.9, note: 61.506, gain: 0.58 },
  ],
}

// The twins rolled: C G E B flat D (partials 4 6 5 7 9), then C G E flat A F (the same as divisors).
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.6 },
    { atSec: 0.3, durSec: 6.9, note: 55.02, gain: 0.56 },
    { atSec: 0.6, durSec: 2.9, note: 63.863, gain: 0.54 },
    { atSec: 0.9, durSec: 2.6, note: 69.688, gain: 0.5 },
    { atSec: 1.2, durSec: 2.3, note: 74.039, gain: 0.48 },
    { atSec: 3.6, durSec: 3.6, note: 63.156, gain: 0.54 },
    { atSec: 3.9, durSec: 3.3, note: 69.331, gain: 0.52 },
    { atSec: 4.3, durSec: 2.9, note: 76.98, gain: 0.5 },
  ],
}

// One flute: up C E G B flat D by the partials 4 5 6 7 9, then down G E flat C A F by the divisors.
const THERE_AND_UNDER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.65, note: 72, gain: 0.55 },
    { atSec: 0.7, durSec: 0.65, note: 75.863, gain: 0.55 },
    { atSec: 1.4, durSec: 0.65, note: 79.02, gain: 0.55 },
    { atSec: 2.1, durSec: 0.65, note: 81.688, gain: 0.52 },
    { atSec: 2.8, durSec: 1, note: 86.039, gain: 0.48 },
    { atSec: 3.9, durSec: 0.65, note: 79.02, gain: 0.55 },
    { atSec: 4.6, durSec: 0.65, note: 75.156, gain: 0.55 },
    { atSec: 5.3, durSec: 0.65, note: 72, gain: 0.55 },
    { atSec: 6, durSec: 0.6, note: 69.331, gain: 0.58 },
    { atSec: 6.6, durSec: 0.8, note: 64.98, gain: 0.6 },
  ],
}

// A drone's root sinks by 7:6, from D to B, and comes back.
const SEPTIMAL_STEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.5, note: 38, gain: 0.6 },
    { atSec: 2.4, durSec: 2.5, note: 35.331, gain: 0.6 },
    { atSec: 4.8, durSec: 2.5, note: 38, gain: 0.6 },
  ],
}

// The twins in close position for slow winds: C E G B flat (4:5:6:7), then C E flat G A.
const CLOSE_TWINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 72, gain: 0.48 },
    { atSec: 0, durSec: 7.2, note: 79.02, gain: 0.44 },
    { atSec: 0, durSec: 3.5, note: 75.863, gain: 0.46 },
    { atSec: 0, durSec: 3.5, note: 81.688, gain: 0.42 },
    { atSec: 3.5, durSec: 3.7, note: 75.156, gain: 0.48 },
    { atSec: 3.5, durSec: 3.7, note: 81.331, gain: 0.46 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Still point: a sine crosses the held ratios. Warm and quick above, plain and slow below.
  {
    id: 'harmonic-twins-crossing-at-noon',
    name: 'Crossing at noon',
    category: 'pad',
    description:
      'Tones with bright overtones crossed by one sine in seven seconds, echoed from low bands to high on a bright plate.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'still-point',
      preset: 'Quick sweep',
      params: { time: 7, reach: 0.5, warmth: 0.8, attack: 0.3, release: 2, level: 0.7 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { feedback: 0.25, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'harmonic-twins-crossing-at-midnight',
    name: 'Crossing at midnight',
    category: 'pad',
    description:
      'Plain sines crossed by one more, with an octave under them, their echoes falling from high bands to low in a dark hall.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'still-point',
      preset: 'Near unison',
      params: { volume: -10.5, time: 7, reach: 0.5, warmth: 0, attack: 1.2, release: 6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'prism', preset: 'High to low', params: { time: 1100, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'harmonic-twins-rope-ladder-sunlit',
    name: 'Rope ladder, sunlit',
    category: 'keys',
    description:
      'Full short tones with an organ octave above, small tremolos rising band by band through them.',
    preview: LADDER,
    instrument: {
      deviceId: 'still-point',
      preset: 'Full short tones',
      params: { time: 5, release: 0.9, level: 0.4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { detune: 0, tone: 0.8, mix: 0.7 } },
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { rate: 1.4 } },
    ],
  },
  {
    id: 'harmonic-twins-rope-down-a-shaft',
    name: 'Rope down a shaft',
    category: 'pad',
    description:
      'Long-released tones with one and two octaves added under them, small tremolos falling band by band.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'still-point',
      preset: 'Long tail',
      params: { volume: -12, time: 7, reach: 1, warmth: 0.1, attack: 0.8, release: 8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.35, sub1: 0.65 } },
      { deviceId: 'glimmer', preset: 'Falling ripple' },
    ],
  },
  {
    id: 'harmonic-twins-third-that-leans-up',
    name: 'Third that leans up',
    category: 'pad',
    description:
      'Quick tones swept a third past each end, with their own octave above in a small bright chamber.',
    preview: SWAY,
    instrument: {
      deviceId: 'still-point',
      preset: 'Third each side',
      params: { time: 5, warmth: 0.45 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'harmonic-twins-third-that-lets-go',
    name: 'Third that lets go',
    category: 'pad',
    description:
      'Softly swelling warm tones with the octave below mixed in, in a hall with no top left in its tail.',
    preview: BARE,
    instrument: {
      deviceId: 'still-point',
      preset: 'Warm crossing',
      params: { time: 8, reach: 2, warmth: 0.3, attack: 0.7 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { mix: 0.65 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'harmonic-twins-sevenths-in-april',
    name: 'Sevenths in April',
    category: 'pad',
    description:
      'Full tones and their sine leaning to opposite ears, turned bright and quick by the spring of the year.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'still-point',
      preset: 'Full and split',
      params: { time: 6, reach: 1, attack: 0.5, release: 2.5 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Spring turning', params: { turn: 0 } }],
  },
  {
    id: 'harmonic-twins-sixths-in-january',
    name: 'Sixths in January',
    category: 'pad',
    description:
      'Pure sines and a sweeping one, part way to opposite ears, thinned and frozen by deep winter, on muffled tape.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'still-point',
      preset: 'Split and pure',
      params: { volume: -10.5, time: 9, ears: 0.6, attack: 1.4, release: 5 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Deep winter' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { wow: 0.05 } },
    ],
  },
  {
    id: 'harmonic-twins-ribs-opening',
    name: 'Ribs opening',
    category: 'pad',
    description:
      'Tones full of overtones, opened and closed in width by a three second breath, with air made wide on top.',
    preview: LADDER,
    instrument: {
      deviceId: 'still-point',
      preset: 'Even match',
      params: { time: 6, warmth: 1, attack: 0.6, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Opening wide',
        params: { in: 1.4, out: 1.6, hold: 0.1, depth: 0.6 },
      },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'harmonic-twins-ribs-closing',
    name: 'Ribs closing',
    category: 'pad',
    description:
      'Slowly swelling tones that a dark breath dims and reopens, set back narrow and dull in a small room.',
    preview: UNDER_ONE_NOTE,
    instrument: {
      deviceId: 'still-point',
      preset: 'Slow swell',
      params: { time: 8, attack: 1.2, release: 6 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Dark lungs', params: { in: 1.6, out: 2.4, depth: 0.6 } },
      { deviceId: 'distance', preset: 'Dark and narrow' },
    ],
  },
  {
    id: 'harmonic-twins-quickening-upward',
    name: 'Quickening upward',
    category: 'keys',
    description:
      'Short warm tones crossed every six seconds, under layers of one pulse that quicken without arriving.',
    preview: SWAY,
    instrument: {
      deviceId: 'still-point',
      preset: 'Short tones',
      params: { volume: -1.5, warmth: 0.75, attack: 0.03, release: 0.5 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Four quickening', params: { depth: 0.85 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'harmonic-twins-slackening-downward',
    name: 'Slackening downward',
    category: 'drone',
    description:
      'A loud crossing sine beats slowly with plain tones, under pulses that keep slowing, in a dark cave.',
    preview: UNDER_ONE_NOTE,
    instrument: {
      deviceId: 'still-point',
      preset: 'Deep slow beat',
      params: { time: 10, attack: 0.5 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Four slowing', params: { depth: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'harmonic-twins-sparks-off-the-seven',
    name: 'Sparks off the seven',
    category: 'texture',
    description:
      'A sine sweeps an octave past each end of the chord, which throws off small sparks of its own overtones.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'still-point',
      preset: 'Octave reach',
      params: { volume: -7, time: 7, attack: 0.3, warmth: 0.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'harmonic-twins-silt-under-the-twelve',
    name: 'Silt under the twelve',
    category: 'drone',
    description:
      'Full tones swelling over two seconds, put under deep water with the sides closed in.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'still-point',
      preset: 'Soft bloom',
      params: { time: 8, attack: 2, release: 6 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sea floor', params: { resonance: 0.4 } }],
  },
  {
    id: 'harmonic-twins-figure-of-two',
    name: 'Figure of two',
    category: 'pad',
    description:
      'Keys in one ear and the crossing sine in the other, both carried slowly round a figure of eight with their top lifted.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'still-point',
      preset: 'Sine in one ear',
      params: { time: 6, warmth: 1, attack: 0.2, release: 4, level: 0.9 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'harmonic-twins-far-side-of-the-fifth',
    name: 'Far side of the fifth',
    category: 'pad',
    description:
      'Pure sines on a slow circle that fade on its far side, through a low-pass filter that hardly moves.',
    preview: BARE,
    instrument: {
      deviceId: 'still-point',
      preset: 'Pure crossing',
      params: { time: 8, attack: 0.5, release: 3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 420 } },
      { deviceId: 'around', preset: 'Far side fades', params: { rate: 0.3 } },
    ],
  },
  {
    id: 'harmonic-twins-seventh-into-thin-air',
    name: 'Seventh into thin air',
    category: 'pad',
    description:
      'Quick tones split half way between the ears, their tail lifting in pitch as it thins out.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Half split',
      params: { time: 5, attack: 0.12, release: 1.2 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.55 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'harmonic-twins-sixth-turned-to-wax',
    name: 'Sixth turned to wax',
    category: 'pad',
    description:
      'Warm tones swelling over a second with a quieter sine across them, their tail sagging and darkening like wax.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Slow split pass',
      params: { volume: -10.5, time: 10, attack: 1, release: 5 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.6 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },

  // Drone: the seven-partial shape and the just major above, the just minor and the octaves below.
  {
    id: 'harmonic-twins-fourth-rung-and-up',
    name: 'Fourth rung and up',
    category: 'drone',
    description:
      'Eight harmonics on every key with a bright wave, the quietest of them brought forward partial by partial.',
    preview: UNDER_ONE_NOTE,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { volume: -5, movement: 0.3, attack: 0.5, release: 4, cutoff: 6000 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'harmonic-twins-minor-hung-low',
    name: 'Minor hung low',
    category: 'drone',
    description:
      'A just minor shape with a strong sub under it, its warm low end turned up into a hall that keeps its lows.',
    preview: SEPTIMAL_STEP,
    instrument: { deviceId: 'drone', preset: 'Minor dusk', params: { attack: 0.8, release: 5 } },
    effects: [
      { deviceId: 'reveal', preset: 'Warm body' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'harmonic-twins-major-at-first-light',
    name: 'Major at first light',
    category: 'drone',
    description:
      'A just major drone with air round it, its long tail climbing an octave on every pass.',
    preview: SEPTIMAL_STEP,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { volume: -4.5, attack: 0.7, release: 4, sub: 0.05 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir' }],
  },
  {
    id: 'harmonic-twins-fifths-at-last-light',
    name: 'Fifths at last light',
    category: 'drone',
    description:
      'Open fifths under a low cutoff, the tail of their reverb stepping down an octave on every pass.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { cutoff: 600, sub: 0.6, air: 0, attack: 1, release: 5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.45, decay: 7 } }],
  },
  {
    id: 'harmonic-twins-octaves-on-a-spindle',
    name: 'Octaves on a spindle',
    category: 'pad',
    description: 'Octave partials with the cutoff wide open, spun by a fast bright horn.',
    preview: LADDER,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { volume: -5, rate: 0.4, attack: 0.5, release: 2 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Bright horn' }],
  },
  {
    id: 'harmonic-twins-octaves-in-a-barrel',
    name: 'Octaves in a barrel',
    category: 'drone',
    description:
      'Low octaves with a heavy sub, turned slowly by the bass drum of a rotating cabinet.',
    preview: UNDER_ONE_NOTE,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { volume: -14, attack: 0.8, release: 5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'harmonic-twins-unison-catching-sun',
    name: 'Unison catching sun',
    category: 'pad',
    description:
      'A unison of eight voices on each key held nearly still, its upper bands shimmering while the low end stays put.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: { hold: 0, movement: 0.15, sub: 0.05, attack: 0.6, release: 3, cutoff: 5500 },
    },
    effects: [{ deviceId: 'currents', preset: 'Shimmer on top' }],
  },
  {
    id: 'harmonic-twins-unison-in-the-shade',
    name: 'Unison in the shade',
    category: 'drone',
    description:
      'Few partials under a low cutoff with the sub octave full up, swelling in three broad bands.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { shape: 0, cutoff: 420, attack: 0.8, release: 6 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'harmonic-twins-bugle-from-the-d',
    name: 'Bugle from the D',
    category: 'drone',
    description:
      'Harmonics of each key as a still organ, a resonance leaping through partials three to six of D.',
    preview: BARE,
    instrument: { deviceId: 'drone', preset: 'Still organ' },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Bugle call', params: { root: 2 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'harmonic-twins-chant-under-the-d',
    name: 'Chant under the D',
    category: 'drone',
    description:
      'A motionless stack of harmonics with a low resonance gliding through partials four to nine of D, in a narrow warm spring.',
    preview: SEPTIMAL_STEP,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { attack: 0.8, release: 4, cutoff: 800 },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Low chant', params: { root: 2 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'harmonic-twins-wind-over-a-high-wire',
    name: 'Wind over a high wire',
    category: 'texture',
    description:
      'Mostly tuned air on each key, left out in gusts that move its level and its tone.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { partials: 0.15, attack: 0.8, release: 4 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day' }],
  },
  {
    id: 'harmonic-twins-surf-under-a-low-wire',
    name: 'Surf under a low wire',
    category: 'texture',
    description:
      'A glassy just minor brought down to a dark cutoff, with slow surf washing through half of it.',
    preview: SEPTIMAL_STEP,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { cutoff: 1400, sub: 0.35, attack: 0.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Far shore' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },

  // String machine: the bright registers and the low ones.
  {
    id: 'harmonic-twins-upper-desks-in-tune',
    name: 'Upper desks in tune',
    category: 'string',
    description:
      'Strings with the high octave full up and no low one, the tone filter open and the air lifted further.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { tone: 9000, attack: 0.5, release: 2.4, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'harmonic-twins-lower-desks-in-tune',
    name: 'Lower desks in tune',
    category: 'string',
    description:
      'Strings with the low octave full up and no high one behind a dark filter, their lows lifted into a cathedral.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { tone: 800, attack: 0.9, release: 4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2200 } },
    ],
  },
  {
    id: 'harmonic-twins-six-saws-as-one',
    name: 'Six saws as one',
    category: 'pad',
    description:
      'Plain sawtooths with no chorus at all, fused by a soft saturation and a trace of spring.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { volume: -15.5, attack: 0.35, release: 1.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'harmonic-twins-saws-let-into-fog',
    name: 'Saws let into fog',
    category: 'pad',
    description:
      'Strings and the octave below them under a very low filter, thickened by a transformer and a narrow warm spring tank.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 0.8, release: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'harmonic-twins-sway-seen-from-above',
    name: 'Sway seen from above',
    category: 'string',
    description:
      'High strings with little ensemble, highs and lows trading places in a slow harmonic tremolo on a bright plate.',
    preview: SWAY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -5, attack: 0.8, release: 3, ensemble: 0.25, tone: 7000 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.1 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'harmonic-twins-sway-seen-from-below',
    name: 'Sway seen from below',
    category: 'string',
    description:
      'High strings behind a low filter, muted, that rise and fall by irregular slow swells.',
    preview: SWAY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -1, attack: 0.6, release: 3.5, tone: 700 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'fog', preset: 'Slow rise' },
    ],
  },
  {
    id: 'harmonic-twins-white-keys-climbing',
    name: 'White keys climbing',
    category: 'pad',
    description:
      'All three octaves of strings open, their tail rising by fifths the longer it rings.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.15, release: 1 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths' }],
  },
  {
    id: 'harmonic-twins-white-keys-sinking',
    name: 'White keys sinking',
    category: 'pad',
    description:
      'Low strings swelling over a second and a half, their tail falling by fifths as it rings.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 1.5, release: 6 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-only-the-moving-voices',
    name: 'Only the moving voices',
    category: 'pad',
    description:
      'Plain stops with no chorus where each newly struck note rings out and what is held sinks back.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -2.5, attack: 0.03, release: 0.9, tone: 5000 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'New notes ring' }],
  },
  {
    id: 'harmonic-twins-only-the-standing-fifth',
    name: 'Only the standing fifth',
    category: 'pad',
    description:
      'Slow strings where the notes two chords share hang on and the ones that move melt away.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1, release: 3 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'harmonic-twins-strings-cast-in-bell',
    name: 'Strings cast in bell',
    category: 'string',
    description:
      'Hollow strings with the fixed colour of a bright bell pressed on them and two wide echoes.',
    preview: LADDER,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.1, release: 1.4, ensemble: 0.2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Bright bell' },
      { deviceId: 'constellation', preset: 'Wide pair' },
    ],
  },
  {
    id: 'harmonic-twins-strings-kept-in-a-box',
    name: 'Strings kept in a box',
    category: 'string',
    description:
      'Middle strings narrowed and pressed into the colour of a dark box, then onto worn tape.',
    preview: BARE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.4, release: 1.6 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box', params: { amount: 1.6 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.05 } },
    ],
  },

  // Magnet piano: sung strings on a high harmonic, or on the lowest with the body forward.
  {
    id: 'harmonic-twins-nine-blown-as-glass',
    name: 'Nine, blown as glass',
    category: 'keys',
    description:
      'Sung piano strings with much shimmer and no body, small grains an octave up raining after them.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { volume: -10, bloom: 0.2, damper: 1.5 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-nine-drawn-as-lead',
    name: 'Nine, drawn as lead',
    category: 'keys',
    description:
      'Bright low magnets with much of the piano body, long grains an octave down drawn under them.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { volume: -14.5, bloom: 0.5, damper: 3 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'harmonic-twins-fourth-harmonic-sown',
    name: 'Fourth harmonic, sown',
    category: 'keys',
    description:
      'Magnets on and around the fourth harmonic of each string, with twelve close echoes shimmering wide.',
    preview: LADDER,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { volume: -9, bloom: 0.3, damper: 1, bright: 0.35 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Shimmer field' }],
  },
  {
    id: 'harmonic-twins-fourth-divisor-buried',
    name: 'Fourth divisor, buried',
    category: 'keys',
    description:
      'A half-hammered piano all body and wood, followed by dark echoes that lose their top.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { bloom: 0.6, bright: 0.2 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Dark field' }],
  },
  {
    id: 'harmonic-twins-answered-from-the-loft',
    name: 'Answered from the loft',
    category: 'keys',
    description:
      'Strings sung on their third harmonic, a twelfth up, each answered once an octave higher.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { volume: -10.5, damper: 0.8 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { followers: 1, gap: 1.2, interval1: 12, mix: 0.4 },
      },
    ],
  },
  {
    id: 'harmonic-twins-answered-from-below',
    name: 'Answered from below',
    category: 'keys',
    description:
      'Strings sung on their second harmonic with the rest ringing along, each answered once an octave lower.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { volume: -12, bloom: 0.7 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { followers: 1, gap: 2.1, interval1: -12, tone: 2000, mix: 0.6 },
      },
    ],
  },
  {
    id: 'harmonic-twins-pale-light-through-six',
    name: 'Pale light through six',
    category: 'pad',
    description: 'Wide shimmering magnets smeared into a bright halo that hangs above the notes.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { volume: -15.5, bloom: 1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.6 } }],
  },
  {
    id: 'harmonic-twins-dark-water-over-six',
    name: 'Dark water over six',
    category: 'pad',
    description:
      'A soft hammer, then a tone that takes a second and a half to bloom, smeared into a dark wash.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { volume: -18, bloom: 1.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water' }],
  },
  {
    id: 'harmonic-twins-reed-on-the-fifth-rung',
    name: 'Reed on the fifth rung',
    category: 'keys',
    description:
      'Quick reedy strings with their quiet top brought up, followed by thin fading tape echoes.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { volume: -20.5, damper: 0.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Top alone', params: { hear: 0, threshold: -28 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
    ],
  },
  {
    id: 'harmonic-twins-tide-on-the-fifth-root',
    name: 'Tide on the fifth root',
    category: 'keys',
    description:
      'Strings blooming for a second while the magnets sweep, their warm floor lifted, with long dark tape echoes.',
    preview: UNDER_ONE_NOTE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { volume: -10.5, bloom: 0.9, bright: 0.1 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Warm floor' },
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { wow: 0.05, feedback: 0.5, lowCut: 160 },
      },
    ],
  },

  // Horns: open bells near by, low brass at the far end.
  {
    id: 'harmonic-twins-open-bells-near-by',
    name: 'Open bells near by',
    category: 'wind',
    description:
      'A few open trumpets blown hard and close to the microphone, with a short bright halo behind them.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.85, section: 0.3, attack: 0.15, release: 0.8 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Close mic' },
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
    ],
  },
  {
    id: 'harmonic-twins-low-bells-past-the-lake',
    name: 'Low bells past the lake',
    category: 'wind',
    description:
      'A low brass choir swelling over a second, heard from a far shore with more room in it than horn.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 1, release: 4, blow: 0.25 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },
  {
    id: 'harmonic-twins-trumpets-opening-out',
    name: 'Trumpets opening out',
    category: 'wind',
    description:
      'One plain trumpet to each note, its body made smaller and its vibrato nearly gone.',
    preview: WEDGE_LOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { volume: -1.5, vibrato: 0.08, attack: 0.08 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.6 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'harmonic-twins-tubas-opening-out',
    name: 'Tubas opening out',
    category: 'wind',
    description:
      'One soft tuba to each note, blown gently with air in it, in a giant body, with a one second loop behind.',
    preview: WEDGE_LOW,
    instrument: { deviceId: 'horns', preset: 'Soft tuba', params: { attack: 0.3 } },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { tone: 0 } },
      { deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.3, feedback: 0.4 } },
    ],
  },
  {
    id: 'harmonic-twins-flugels-sing-ee',
    name: 'Flugels sing ee',
    category: 'wind',
    description: 'A choir of flugelhorns whose hall answers with a high sung ee.',
    preview: SWAY,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.4, release: 1.5, blow: 0.6 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High ee', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-horns-sing-oh',
    name: 'Horns sing oh',
    category: 'wind',
    description: 'Horns swelling for a second into a large hall that answers with low monks.',
    preview: SWAY,
    instrument: { deviceId: 'horns', preset: 'Horn swell', params: { attack: 0.9, blow: 0.35 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.6 } }],
  },
  {
    id: 'harmonic-twins-mutes-on-a-bright-amp',
    name: 'Mutes on a bright amp',
    category: 'wind',
    description:
      'Muted brass swelling within a second, played again through a clean bright loudspeaker.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: -13.5, attack: 0.7, release: 2 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Clean and bright', params: { room: 0.6 } }],
  },
  {
    id: 'harmonic-twins-bells-in-a-woollen-amp',
    name: 'Bells in a woollen amp',
    category: 'wind',
    description:
      'A large section of horns blown hard, then played through a dark driven stack with the microphone turned away.',
    preview: BARE,
    instrument: { deviceId: 'horns', preset: 'Glacial horns', params: { attack: 0.6, release: 3 } },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly' }],
  },
  {
    id: 'harmonic-twins-horn-turned-to-rise',
    name: 'Horn turned to rise',
    category: 'wind',
    description:
      'One horn to each note with backward echoes an octave higher swelling up behind it.',
    preview: WHITE_KEYS,
    instrument: { deviceId: 'horns', preset: 'Solo horn', params: { blow: 0.55 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.45 } }],
  },
  {
    id: 'harmonic-twins-trombone-turned-down',
    name: 'Trombone turned down',
    category: 'wind',
    description:
      'Trombones that speak at once, with backward echoes sinking an octave at a time beneath them.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { vibrato: 0, blow: 0.6, release: 1.5 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Undertow', params: { mix: 0.5 } }],
  },

  // Organ: principals and reeds above, flutes and pedals below.
  {
    id: 'harmonic-twins-mixture-fused-on-c',
    name: 'Mixture fused on C',
    category: 'organ',
    description:
      'A full organ without its celeste, its upper ranks blurred into a thin bright haze.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { volume: -16, celeste: 0, bellows: 0, release: 1.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Bright haze', params: { mix: 0.5 } },
      { deviceId: 'saturator', preset: 'Parallel shine' },
    ],
  },
  {
    id: 'harmonic-twins-flutes-let-down-from-a',
    name: 'Flutes let down from A',
    category: 'organ',
    description:
      'Chapel flutes with the sub rank forward, every attack lost in a dark bank of fog.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.8, octave: 0.1, attack: 0.5, release: 2, tone: 1200 },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
  },
  {
    id: 'harmonic-twins-ball-on-the-rungs',
    name: 'Ball on the rungs',
    category: 'organ',
    description:
      'A flute with its fifteenth drawn and a slight tremulant, each note bouncing like a ball on glass.',
    preview: LADDER,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 0.15, attack: 0.02, release: 0.2, fifteenth: 0.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Ball on glass' }],
  },
  {
    id: 'harmonic-twins-stone-past-the-roots',
    name: 'Stone past the roots',
    category: 'organ',
    description:
      'A deep pedal, its sub rank full and its reed slight, its echoes skipping under and growing dull.',
    preview: UNDER_ONE_NOTE,
    instrument: { deviceId: 'organ', preset: 'Deep pedal', params: { attack: 0.2, release: 1.2 } },
    effects: [{ deviceId: 'skipping-stone', preset: 'Deep water' }],
  },
  {
    id: 'harmonic-twins-pipes-on-the-up-stair',
    name: 'Pipes on the up stair',
    category: 'organ',
    description:
      'All the high ranks swelling in over a second, into a tail that climbs and never arrives.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { celeste: 0, attack: 0.9, release: 3 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { tone: 9000 } }],
  },
  {
    id: 'harmonic-twins-pipes-on-the-down-stair',
    name: 'Pipes on the down stair',
    category: 'organ',
    description:
      'Distant dark pipes swelling in over a second, into a tail that sinks and never lands.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { celeste: 0.1, attack: 1, release: 3, tone: 900 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-quint-caught-in-glass',
    name: 'Quint caught in glass',
    category: 'organ',
    description:
      'A flute with its twelfth pulled full, each chord caught and held as a bright even pad.',
    preview: BARE,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { fifteenth: 0.4, tone: 6000, attack: 0.05 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Glass organ' }],
  },
  {
    id: 'harmonic-twins-quint-through-plaster',
    name: 'Quint through plaster',
    category: 'organ',
    description: 'An organ heard through a wall, each chord caught and held as a dark gliding bed.',
    preview: BARE,
    instrument: { deviceId: 'organ', preset: 'Through the wall', params: { release: 2.5 } },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Dark bed',
        params: { decay: 12, motion: 0.2, ensemble: 0 },
      },
    ],
  },
  {
    id: 'harmonic-twins-free-reeds-at-noon',
    name: 'Free reeds at noon',
    category: 'organ',
    description:
      'Accordion reeds without their beating rank, the air brought up and scattered wide.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { celeste: 0, bellows: 0.2, release: 0.6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
    ],
  },
  {
    id: 'harmonic-twins-reed-box-after-dark',
    name: 'Reed box after dark',
    category: 'organ',
    description:
      'A reed box on deep bellows with its air taken out and only the tones kept, on warm tape in a small room.',
    preview: WHITE_KEYS,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.5, celeste: 0, tone: 900 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'tape', preset: 'Warm thump', params: { wow: 0.05 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // Bow: one string, with its overtones lit or its body.
  {
    id: 'harmonic-twins-six-bows-one-low-c',
    name: 'Six bows, one low C',
    category: 'string',
    description:
      'Glassy bows near the bridge with no detune, sines an octave up swelling in behind them.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { volume: -15, attack: 0.6, release: 3, detune: 0, vibrato: 0 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo' }],
  },
  {
    id: 'harmonic-twins-six-bows-one-high-a',
    name: 'Six bows, one high A',
    category: 'string',
    description: 'Straight cello bows with much body, sines an octave down lingering beneath them.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { vibrato: 0, brightness: 0.2 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.55 } }],
  },
  {
    id: 'harmonic-twins-string-under-a-halo',
    name: 'String under a halo',
    category: 'string',
    description:
      'Strings that speak at once and are sustained, with a light fuzz and an octave glowing over them.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { vibrato: 0, detune: 0, release: 1 },
    },
    effects: [{ deviceId: 'haze', preset: 'Glass halo', params: { mix: 0.35 } }],
  },
  {
    id: 'harmonic-twins-string-over-a-rumble',
    name: 'String over a rumble',
    category: 'string',
    description:
      'A sustained string swelling slowly above its own fuzz, blurred into a low rumble.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -12.5, attack: 1.3, release: 5, detune: 3 },
    },
    effects: [{ deviceId: 'haze', preset: 'Low rumble' }],
  },
  {
    id: 'harmonic-twins-wire-raining-upward',
    name: 'Wire raining upward',
    category: 'plucked',
    description:
      'A plucked wire left to ring, its notes coming back as quick loops an octave higher.',
    preview: ROLLED,
    instrument: { deviceId: 'bowed-string', preset: 'Wire harp', params: { detune: 0 } },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'harmonic-twins-felt-drawn-under',
    name: 'Felt drawn under',
    category: 'plucked',
    description:
      'A felted pluck with a wooden body, its loops drawn backward and an octave lower beneath it.',
    preview: ROLLED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: -3, detune: 0, release: 2.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Undertow' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'harmonic-twins-twelfth-inside-a-tube',
    name: 'Twelfth inside a tube',
    category: 'string',
    description:
      'A sustained string fed near its middle and left very bright, inside a glass tube.',
    preview: SWAY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.6, detune: 0, vibrato: 0 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Glass tube' }],
  },
  {
    id: 'harmonic-twins-flautando-in-a-tank',
    name: 'Flautando in a tank',
    category: 'string',
    description:
      'A bow with no pressure far up the string, resonating inside a large stopped tank.',
    preview: SWAY,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.8, vibrato: 0, detune: 0 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Cistern' }],
  },

  // Flute: straight tones for the bright half, breath and low bores for the dark.
  {
    id: 'harmonic-twins-up-by-the-partials',
    name: 'Up by the partials',
    category: 'wind',
    description: 'A straight concert flute without vibrato in a cavern of fine glinting echoes.',
    preview: THERE_AND_UNDER,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.06, release: 0.8 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Glinting', params: { modulation: 0.4 } }],
  },
  {
    id: 'harmonic-twins-down-by-the-divisors',
    name: 'Down by the divisors',
    category: 'wind',
    description: 'An alto flute blown firmly, its vibrato small, over a dark well of echoes.',
    preview: THERE_AND_UNDER,
    instrument: { deviceId: 'flute', preset: 'Alto flute', params: { vibrato: 0.1, scoop: 0 } },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.6 } }],
  },
  {
    id: 'harmonic-twins-wedge-in-a-tiled-room',
    name: 'Wedge in a tiled room',
    category: 'wind',
    description:
      'Hard blown concert flutes with quick tongues in a small bright modulated chamber.',
    preview: WEDGE_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0.1, scoop: 0, release: 0.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { modDepth: 0.1 } }],
  },
  {
    id: 'harmonic-twins-twins-in-a-cold-nave',
    name: 'Twins in a cold nave',
    category: 'wind',
    description:
      'Wooden flutes swelling in with no tongue at all, in a vast space with only lows in its tail.',
    preview: CLOSE_TWINS,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 0.6, release: 3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 14, mix: 0.6 } }],
  },
  {
    id: 'harmonic-twins-pipes-struck-by-light',
    name: 'Pipes struck by light',
    category: 'wind',
    description:
      'Pan pipes with a little chiff, flickering on three short bright pulses of every eight, on each side.',
    preview: WEDGE_HIGH,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { volume: -6, scoop: 0, chiff: 0.35, blow: 0.7, release: 1.2 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Bright sparks', params: { floor: 0.6, length: 0.5 } }],
  },
  {
    id: 'harmonic-twins-pipes-filled-by-tide',
    name: 'Pipes filled by tide',
    category: 'wind',
    description:
      'Airy pan pipes held as a pad, coming and going on a long slow pattern that darkens them.',
    preview: CLOSE_TWINS,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { volume: -14.5, attack: 0.5, vibrato: 0 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Long tide', params: { rate: 0.5, floor: 0.2 } },
      { deviceId: 'underwater', preset: 'Just under' },
    ],
  },
  {
    id: 'harmonic-twins-recorder-hops-upstairs',
    name: 'Recorder hops upstairs',
    category: 'wind',
    description: 'A soft recorder with almost no breath, whose echoes hop up an octave and back.',
    preview: THERE_AND_UNDER,
    instrument: { deviceId: 'flute', preset: 'Soft recorder', params: { chiff: 0.5 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Octave hop' }],
  },
  {
    id: 'harmonic-twins-breath-waits-downstairs',
    name: 'Breath waits downstairs',
    category: 'wind',
    description:
      'Mostly breath from a low flute, with murky echoes of nearly a second, all from a small radio by a bed.',
    preview: CLOSE_TWINS,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { volume: -19.5, attack: 0.5, vibrato: 0, breath: 0.8 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { modDepth: 0.1 } },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },

  // Choir: high vowels without vibrato, and low ones hummed.
  {
    id: 'harmonic-twins-ooh-that-brightens',
    name: 'Ooh that brightens',
    category: 'voice',
    description:
      'High voices on ooh with no vibrato, small pieces of them rising an octave as they fade.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { vibrato: 0, motion: 0, breath: 0.05 },
    },
    effects: [{ deviceId: 'falling', preset: 'Rising mist' }],
  },
  {
    id: 'harmonic-twins-oh-that-breathes-out',
    name: 'Oh that breathes out',
    category: 'voice',
    description:
      'Low voices near oh with no vibrato, long pieces of them sinking a fourth as they fade.',
    preview: BREATHES_IN,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { motion: 0, attack: 1, tone: 1600 },
    },
    effects: [{ deviceId: 'falling', preset: 'Sinking drone', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-ee-stretched-to-mist',
    name: 'Ee stretched to mist',
    category: 'voice',
    description: 'Voices on a glassy ee, slowed sixfold at pitch into a bright mist behind them.',
    preview: SIX_UP,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.7, release: 2, motion: 0, width: 0.5 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Bright mist', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-hum-stretched-to-dusk',
    name: 'Hum stretched to dusk',
    category: 'voice',
    description: 'A closed hum, slowed tenfold at pitch into a dark drift that covers it.',
    preview: SIX_DOWN,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { volume: -2.5, vibrato: 0, voice: 0.85, attack: 0.5 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Dark drift' }],
  },
  {
    id: 'harmonic-twins-altos-on-two-sides',
    name: 'Altos on two sides',
    category: 'voice',
    description: 'Altos on eh, straight, doubled by two voices that fly close by on either side.',
    preview: SWAY,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { vibrato: 0, attack: 0.15, release: 0.8, tone: 11000, ensemble: 0.2 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'saturator', preset: 'Parallel shine' },
    ],
  },
  {
    id: 'harmonic-twins-basses-in-the-valley',
    name: 'Basses in the valley',
    category: 'voice',
    description:
      'Basses on ah, straight, scattered into sixteen far-off voices that cover most of them.',
    preview: BARE,
    instrument: { deviceId: 'choir', preset: 'Basses ah', params: { vibrato: 0, tone: 2200 } },
    effects: [
      { deviceId: 'murmuration', preset: 'Cloud far off', params: { mix: 0.8 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'harmonic-twins-one-singer-in-five',
    name: 'One singer in five',
    category: 'voice',
    description:
      'One nearly straight voice to each note, caught by five tiny loops that ring like glass.',
    preview: BREATHES_OUT,
    instrument: { deviceId: 'choir', preset: 'Soloist', params: { vibrato: 4, release: 0.5 } },
    effects: [{ deviceId: 'orbits', preset: 'Glass cluster', params: { mix: 0.5 } }],
  },
  {
    id: 'harmonic-twins-many-singers-in-one',
    name: 'Many singers in one',
    category: 'voice',
    description:
      'A far dark choir swelling over a second and a half, with low sung resonances on C following it.',
    preview: BREATHES_OUT,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 1.4, release: 6, breath: 0.25, vibrato: 0 },
    },
    effects: [
      { deviceId: 'overtone-singer', preset: 'Low chant', params: { root: 0, mix: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },

  // Thesis: it keeps whole keys and answers each with its mirror, so it plays the still chord round the twins.
  {
    id: 'harmonic-twins-mirror-held-upright',
    name: 'Mirror held upright',
    category: 'texture',
    description:
      'Each key with its mirror round D as narrow bands of noise, a glassy string pad following an octave up.',
    preview: 'chord',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 62, scale: 4, root: 2, octaflipEnabled: 0, attack: 0.4, release: 2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: 0 } },
    ],
  },
  {
    id: 'harmonic-twins-mirror-laid-flat',
    name: 'Mirror laid flat',
    category: 'texture',
    description:
      'Each key with its mirror round a low D as wide bands of noise, dark cellos growing behind them.',
    preview: 'chord',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { scale: 4, root: 2, resonance: 14, attack: 1.2, release: 4 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'harmonic-twins-mirror-rolled-out',
    name: 'Mirror rolled out',
    category: 'texture',
    description:
      'Mirrored keys and the notes half way between, strummed, dissolving into a small bright room.',
    preview: 'keys',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { scale: 0, resonance: 90 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Small bright room' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -4 } },
    ],
  },
  {
    id: 'harmonic-twins-mirror-pulled-under',
    name: 'Mirror pulled under',
    category: 'texture',
    description:
      'Mirrored keys pulled slowly toward a centre and dulled, dissolving round after round into a large dark room.',
    preview: 'chord',
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { center: 57, scale: 1, root: 9, attack: 0.8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 900 } },
      { deviceId: 'generations', preset: 'Large dark room' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -6 } },
    ],
  },
]
