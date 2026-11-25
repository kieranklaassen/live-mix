import { type FactoryPreset, type Phrase } from '../types'

// Ways a note can begin. Fourteen phrases write out the old ornaments as notes (shake, mordent,
// turn, leaning note, slide, springer, crushed note, trembling, rolled chord, run), and twelve
// instruments are set by how they speak: how sharp the start is, how long the note stays, and
// what is left ringing around it.

// A cadence in C: a shake on B from the note above, slow at first and gathering, closed by A and
// B; G seventh, then C.
const SHAKE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.8, note: 55, gain: 0.63 },
    { atSec: 0.05, durSec: 3.75, note: 62, gain: 0.51 },
    { atSec: 0.1, durSec: 3.7, note: 65, gain: 0.48 },
    { atSec: 0.35, durSec: 0.441, note: 72, gain: 0.75 },
    { atSec: 0.782, durSec: 0.394, note: 71, gain: 0.74 },
    { atSec: 1.168, durSec: 0.351, note: 72, gain: 0.73 },
    { atSec: 1.512, durSec: 0.313, note: 71, gain: 0.72 },
    { atSec: 1.82, durSec: 0.28, note: 72, gain: 0.7 },
    { atSec: 2.094, durSec: 0.249, note: 71, gain: 0.69 },
    { atSec: 2.338, durSec: 0.223, note: 72, gain: 0.68 },
    { atSec: 2.556, durSec: 0.199, note: 71, gain: 0.67 },
    { atSec: 2.751, durSec: 0.177, note: 72, gain: 0.66 },
    { atSec: 2.925, durSec: 0.158, note: 71, gain: 0.65 },
    { atSec: 3.08, durSec: 0.141, note: 72, gain: 0.63 },
    { atSec: 3.218, durSec: 0.126, note: 71, gain: 0.62 },
    { atSec: 3.342, durSec: 0.112, note: 72, gain: 0.61 },
    { atSec: 3.452, durSec: 0.1, note: 71, gain: 0.6 },
    { atSec: 3.55, durSec: 0.14, note: 69, gain: 0.6 },
    { atSec: 3.69, durSec: 0.14, note: 71, gain: 0.63 },
    { atSec: 3.84, durSec: 2.1, note: 72, gain: 0.75 },
    { atSec: 3.85, durSec: 2, note: 48, gain: 0.63 },
    { atSec: 3.88, durSec: 2, note: 60, gain: 0.48 },
    { atSec: 3.91, durSec: 2, note: 64, gain: 0.51 },
  ],
}

// Two sighs: B leans on A for half its length over D minor, then F on E over A minor with C
// below.
const LEANING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.85, note: 71, gain: 0.84 },
    { atSec: 0, durSec: 3.5, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 3.5, note: 57, gain: 0.51 },
    { atSec: 0, durSec: 3.5, note: 65, gain: 0.42 },
    { atSec: 1.85, durSec: 1.7, note: 69, gain: 0.45 },
    { atSec: 3.6, durSec: 1.35, note: 65, gain: 0.78 },
    { atSec: 3.6, durSec: 2.6, note: 48, gain: 0.6 },
    { atSec: 3.6, durSec: 2.6, note: 57, gain: 0.51 },
    { atSec: 3.6, durSec: 2.6, note: 60, gain: 0.42 },
    { atSec: 4.95, durSec: 1.3, note: 64, gain: 0.42 },
  ],
}

// C major, then its first inversion: E sounds for a beat and turns through F, E, D; G is turned
// from the note above as it starts.
const TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.07, note: 64, gain: 0.69 },
    { atSec: 0, durSec: 2.9, note: 48, gain: 0.63 },
    { atSec: 0, durSec: 2.9, note: 55, gain: 0.51 },
    { atSec: 1.07, durSec: 0.14, note: 65, gain: 0.6 },
    { atSec: 1.21, durSec: 0.14, note: 64, gain: 0.54 },
    { atSec: 1.35, durSec: 0.14, note: 62, gain: 0.54 },
    { atSec: 1.49, durSec: 1.45, note: 64, gain: 0.63 },
    { atSec: 3, durSec: 2.9, note: 52, gain: 0.6 },
    { atSec: 3, durSec: 2.9, note: 60, gain: 0.48 },
    { atSec: 3.02, durSec: 0.13, note: 69, gain: 0.66 },
    { atSec: 3.15, durSec: 0.13, note: 67, gain: 0.57 },
    { atSec: 3.28, durSec: 0.13, note: 65, gain: 0.54 },
    { atSec: 3.41, durSec: 2.4, note: 67, gain: 0.69 },
  ],
}

// A fall through D minor, A then F then D, each note bitten once by the step below it.
const MORDENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.4, note: 50, gain: 0.6 },
    { atSec: 0.02, durSec: 5.4, note: 57, gain: 0.48 },
    { atSec: 0.04, durSec: 0.11, note: 69, gain: 0.75 },
    { atSec: 0.15, durSec: 0.11, note: 67, gain: 0.6 },
    { atSec: 0.26, durSec: 1.35, note: 69, gain: 0.72 },
    { atSec: 1.65, durSec: 0.11, note: 65, gain: 0.69 },
    { atSec: 1.76, durSec: 0.11, note: 64, gain: 0.57 },
    { atSec: 1.87, durSec: 1.35, note: 65, gain: 0.66 },
    { atSec: 3.26, durSec: 0.11, note: 62, gain: 0.66 },
    { atSec: 3.37, durSec: 0.11, note: 60, gain: 0.54 },
    { atSec: 3.48, durSec: 2.4, note: 62, gain: 0.66 },
  ],
}

// Slides of a third, two quick steps from below into E and G over C, then into A over F.
const SLIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.13, note: 60, gain: 0.54 },
    { atSec: 0, durSec: 3.2, note: 48, gain: 0.63 },
    { atSec: 0, durSec: 3.2, note: 55, gain: 0.48 },
    { atSec: 0.13, durSec: 0.13, note: 62, gain: 0.6 },
    { atSec: 0.26, durSec: 1.3, note: 64, gain: 0.75 },
    { atSec: 1.62, durSec: 0.13, note: 64, gain: 0.54 },
    { atSec: 1.75, durSec: 0.13, note: 65, gain: 0.6 },
    { atSec: 1.88, durSec: 1.3, note: 67, gain: 0.75 },
    { atSec: 3.24, durSec: 0.13, note: 65, gain: 0.54 },
    { atSec: 3.24, durSec: 2.5, note: 53, gain: 0.63 },
    { atSec: 3.24, durSec: 2.5, note: 57, gain: 0.48 },
    { atSec: 3.37, durSec: 0.13, note: 67, gain: 0.6 },
    { atSec: 3.5, durSec: 2.3, note: 69, gain: 0.75 },
  ],
}

// Crushed notes over C, F and C on one held C: B with C, E with F, D with E, the lower of each
// pair let go at once; two upper voices over the C, in sixths.
const CRUSHED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.07, note: 71, gain: 0.63 },
    { atSec: 0, durSec: 1.8, note: 72, gain: 0.75 },
    { atSec: 0, durSec: 1.85, note: 64, gain: 0.48 },
    { atSec: 0, durSec: 5.8, note: 60, gain: 0.54 },
    { atSec: 1.9, durSec: 0.07, note: 76, gain: 0.63 },
    { atSec: 1.9, durSec: 1.8, note: 77, gain: 0.72 },
    { atSec: 1.9, durSec: 1.85, note: 69, gain: 0.48 },
    { atSec: 3.8, durSec: 0.07, note: 74, gain: 0.6 },
    { atSec: 3.8, durSec: 2, note: 76, gain: 0.69 },
    { atSec: 3.8, durSec: 2, note: 67, gain: 0.48 },
  ],
}

// Two rolled chords, C and F over A, each with a note struck in passing and let go: F between E
// and G, G between F and A.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 48, gain: 0.63 },
    { atSec: 0.17, durSec: 2.75, note: 55, gain: 0.54 },
    { atSec: 0.34, durSec: 2.55, note: 60, gain: 0.54 },
    { atSec: 0.51, durSec: 2.4, note: 64, gain: 0.57 },
    { atSec: 0.66, durSec: 0.16, note: 65, gain: 0.51 },
    { atSec: 0.81, durSec: 2.1, note: 67, gain: 0.66 },
    { atSec: 3, durSec: 2.9, note: 45, gain: 0.63 },
    { atSec: 3.18, durSec: 2.7, note: 53, gain: 0.54 },
    { atSec: 3.36, durSec: 2.55, note: 60, gain: 0.54 },
    { atSec: 3.54, durSec: 2.35, note: 65, gain: 0.57 },
    { atSec: 3.7, durSec: 0.17, note: 67, gain: 0.51 },
    { atSec: 3.86, durSec: 2.1, note: 69, gain: 0.66 },
  ],
}

// One A struck again and again, slowly and then faster, over F with C; it settles on G as the
// bass steps to E.
const TREMBLING: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 53, gain: 0.6 },
    { atSec: 0, durSec: 6, note: 60, gain: 0.48 },
    { atSec: 0.1, durSec: 0.588, note: 69, gain: 0.78 },
    { atSec: 0.677, durSec: 0.504, note: 69, gain: 0.75 },
    { atSec: 1.171, durSec: 0.432, note: 69, gain: 0.72 },
    { atSec: 1.594, durSec: 0.37, note: 69, gain: 0.69 },
    { atSec: 1.957, durSec: 0.317, note: 69, gain: 0.66 },
    { atSec: 2.268, durSec: 0.272, note: 69, gain: 0.63 },
    { atSec: 2.535, durSec: 0.233, note: 69, gain: 0.6 },
    { atSec: 2.763, durSec: 0.2, note: 69, gain: 0.57 },
    { atSec: 2.959, durSec: 0.171, note: 69, gain: 0.54 },
    { atSec: 3.127, durSec: 0.147, note: 69, gain: 0.51 },
    { atSec: 3.271, durSec: 0.126, note: 69, gain: 0.48 },
    { atSec: 3.394, durSec: 0.108, note: 69, gain: 0.45 },
    { atSec: 3.55, durSec: 2.5, note: 52, gain: 0.63 },
    { atSec: 3.57, durSec: 2.5, note: 67, gain: 0.69 },
  ],
}

// Falling thirds filled with a light passing note: E to C over C, C to A and A to F over F, home
// on E.
const FILLED_THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.68, note: 76, gain: 0.72 },
    { atSec: 0, durSec: 1.55, note: 48, gain: 0.63 },
    { atSec: 0, durSec: 1.55, note: 55, gain: 0.48 },
    { atSec: 0.67, durSec: 0.27, note: 74, gain: 0.51 },
    { atSec: 0.93, durSec: 0.63, note: 72, gain: 0.66 },
    { atSec: 1.6, durSec: 0.68, note: 72, gain: 0.69 },
    { atSec: 1.6, durSec: 3, note: 53, gain: 0.6 },
    { atSec: 1.6, durSec: 3, note: 57, gain: 0.48 },
    { atSec: 2.27, durSec: 0.27, note: 71, gain: 0.51 },
    { atSec: 2.53, durSec: 0.6, note: 69, gain: 0.63 },
    { atSec: 3.14, durSec: 0.68, note: 69, gain: 0.66 },
    { atSec: 3.81, durSec: 0.27, note: 67, gain: 0.48 },
    { atSec: 4.07, durSec: 0.57, note: 65, gain: 0.6 },
    { atSec: 4.65, durSec: 1.9, note: 48, gain: 0.63 },
    { atSec: 4.65, durSec: 1.9, note: 55, gain: 0.48 },
    { atSec: 4.66, durSec: 1.9, note: 64, gain: 0.69 },
  ],
}

// A line down from E to B, each note but the last sprung at its very end by the step above it.
const SPRINGER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 76, gain: 0.78 },
    { atSec: 1.3, durSec: 0.13, note: 77, gain: 0.54 },
    { atSec: 1.43, durSec: 1.3, note: 74, gain: 0.75 },
    { atSec: 2.73, durSec: 0.13, note: 76, gain: 0.54 },
    { atSec: 2.86, durSec: 1.3, note: 72, gain: 0.72 },
    { atSec: 4.16, durSec: 0.13, note: 74, gain: 0.51 },
    { atSec: 4.29, durSec: 2, note: 71, gain: 0.69 },
  ],
}

// Leaning notes from below for what speaks slowly, B into C, D into E and G into A: each takes
// half of the time and is louder than the note it leans on.
const RISING_LEAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 71, gain: 0.81 },
    { atSec: 1.08, durSec: 1, note: 72, gain: 0.57 },
    { atSec: 2.15, durSec: 1.1, note: 74, gain: 0.81 },
    { atSec: 3.23, durSec: 1, note: 76, gain: 0.57 },
    { atSec: 4.3, durSec: 1.1, note: 67, gain: 0.78 },
    { atSec: 5.38, durSec: 1.4, note: 69, gain: 0.57 },
  ],
}

// A run of eight notes from D up to D, another from A up to A, then a quick fall of a fifth back
// to D.
const RUN_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.095, note: 62, gain: 0.45 },
    { atSec: 0.095, durSec: 0.095, note: 64, gain: 0.48 },
    { atSec: 0.19, durSec: 0.095, note: 65, gain: 0.51 },
    { atSec: 0.285, durSec: 0.095, note: 67, gain: 0.54 },
    { atSec: 0.38, durSec: 0.095, note: 69, gain: 0.57 },
    { atSec: 0.475, durSec: 0.095, note: 71, gain: 0.6 },
    { atSec: 0.57, durSec: 0.095, note: 72, gain: 0.63 },
    { atSec: 0.665, durSec: 1.7, note: 74, gain: 0.75 },
    { atSec: 2.45, durSec: 0.09, note: 69, gain: 0.45 },
    { atSec: 2.54, durSec: 0.09, note: 71, gain: 0.48 },
    { atSec: 2.63, durSec: 0.09, note: 72, gain: 0.51 },
    { atSec: 2.72, durSec: 0.09, note: 74, gain: 0.54 },
    { atSec: 2.81, durSec: 0.09, note: 76, gain: 0.57 },
    { atSec: 2.9, durSec: 0.09, note: 77, gain: 0.6 },
    { atSec: 2.99, durSec: 0.09, note: 79, gain: 0.63 },
    { atSec: 3.08, durSec: 1.5, note: 81, gain: 0.75 },
    { atSec: 4.65, durSec: 0.1, note: 79, gain: 0.6 },
    { atSec: 4.75, durSec: 0.1, note: 77, gain: 0.57 },
    { atSec: 4.85, durSec: 0.1, note: 76, gain: 0.57 },
    { atSec: 4.95, durSec: 1.6, note: 74, gain: 0.66 },
  ],
}

// A closing line alone: E, then D turned after it has sounded, a gathering shake on B from C,
// and C.
const CADENCE_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 76, gain: 0.72 },
    { atSec: 0.85, durSec: 0.6, note: 74, gain: 0.69 },
    { atSec: 1.45, durSec: 0.13, note: 76, gain: 0.57 },
    { atSec: 1.58, durSec: 0.13, note: 74, gain: 0.54 },
    { atSec: 1.71, durSec: 0.13, note: 72, gain: 0.54 },
    { atSec: 1.84, durSec: 0.45, note: 74, gain: 0.63 },
    { atSec: 2.32, durSec: 0.325, note: 72, gain: 0.72 },
    { atSec: 2.638, durSec: 0.289, note: 71, gain: 0.71 },
    { atSec: 2.922, durSec: 0.257, note: 72, gain: 0.69 },
    { atSec: 3.174, durSec: 0.229, note: 71, gain: 0.68 },
    { atSec: 3.398, durSec: 0.204, note: 72, gain: 0.67 },
    { atSec: 3.598, durSec: 0.181, note: 71, gain: 0.65 },
    { atSec: 3.776, durSec: 0.161, note: 72, gain: 0.64 },
    { atSec: 3.934, durSec: 0.144, note: 71, gain: 0.62 },
    { atSec: 4.075, durSec: 0.128, note: 72, gain: 0.61 },
    { atSec: 4.201, durSec: 0.114, note: 71, gain: 0.6 },
    { atSec: 4.312, durSec: 0.101, note: 72, gain: 0.58 },
    { atSec: 4.412, durSec: 0.09, note: 71, gain: 0.57 },
    { atSec: 4.5, durSec: 0.13, note: 69, gain: 0.57 },
    { atSec: 4.63, durSec: 0.13, note: 71, gain: 0.6 },
    { atSec: 4.76, durSec: 1.6, note: 72, gain: 0.72 },
  ],
}

// Slides of a third into E, C and A, and a bitten G to end.
const SLIDING_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.13, note: 72, gain: 0.54 },
    { atSec: 0.13, durSec: 0.13, note: 74, gain: 0.6 },
    { atSec: 0.26, durSec: 1.2, note: 76, gain: 0.78 },
    { atSec: 1.55, durSec: 0.13, note: 69, gain: 0.54 },
    { atSec: 1.68, durSec: 0.13, note: 71, gain: 0.6 },
    { atSec: 1.81, durSec: 1.2, note: 72, gain: 0.75 },
    { atSec: 3.1, durSec: 0.13, note: 65, gain: 0.54 },
    { atSec: 3.23, durSec: 0.13, note: 67, gain: 0.6 },
    { atSec: 3.36, durSec: 1.1, note: 69, gain: 0.72 },
    { atSec: 4.55, durSec: 0.11, note: 67, gain: 0.66 },
    { atSec: 4.66, durSec: 0.11, note: 65, gain: 0.54 },
    { atSec: 4.77, durSec: 1.6, note: 67, gain: 0.66 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // West coast: how hard the gate is struck, how far the tone folds, how long it stays open.
  {
    id: 'ornament-book-pen-dipped-once',
    name: 'Pen dipped once',
    category: 'plucked',
    description:
      'A dark wooden knock of nine tenths of a second with one to one modulation, its strike carried on by three long springs.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: -5, fold: 0.22, fm: 0.3, ratio: 1, decay: 0.9, colour: 0.35, chance: 0 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.38 } }],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-engraved-in-copper',
    name: 'Engraved in copper',
    category: 'plucked',
    description:
      'A hard folded pluck that starts bright and closes over two and a half seconds, with soft skipping echoes on a dark plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { volume: -4.5, fold: 0.8, symmetry: 0.55, timbreEnv: 1, decay: 2.6, colour: 0.75 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-grace-before-the-bell',
    name: 'Grace before the bell',
    category: 'bell',
    description:
      'A glassy seven to two bell with its strike rounded, ringing a table of bowls tuned to A minor in an airy hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { volume: -5, attack: 0.03, fm: 0.42, decay: 5, colour: 0.7 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Faint halo', params: { root: 9, scale: 3, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
    preview: SLIDING_LINE,
  },
  {
    id: 'ornament-book-wavy-line-above',
    name: 'Wavy line above',
    category: 'plucked',
    description:
      'A soft mallet held open for three seconds, its lows and highs shaken against each other, in a dark hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { attack: 0.012, decay: 3, fold: 0.35, symmetry: 0.4, colour: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 5.5, depth: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
    preview: TREMBLING,
  },
  {
    id: 'ornament-book-leaned-on-and-let-go',
    name: 'Leaned on and let go',
    category: 'pad',
    description:
      'A tone that blooms in a third of a second and sinks to half, its tail sagging in pitch in a six second hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { attack: 0.35, decay: 3, sustain: 0.5, fold: 0.2, timbreEnv: 0.6 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, mix: 0.35 } },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-thumb-runs-up',
    name: 'Thumb runs up',
    category: 'plucked',
    description:
      'A clinking seven to two tine with a second and a half of ring, a short soft tape echo and a small bright chamber.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 1.4, symmetry: 0.3, fm: 0.5, ratio: 5, colour: 0.6 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-reed-in-a-drawer',
    name: 'Reed in a drawer',
    category: 'wind',
    description:
      'A folded reed tone with a soft start, turned by a slow rotor and heard from the back of a hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { volume: -5, attack: 0.07, sustain: 0.8, fold: 0.4, symmetry: 0.7, colour: 0.35 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.6 } },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
    preview: FILLED_THIRDS,
  },
  {
    id: 'ornament-book-pipe-that-leans-up',
    name: 'Pipe that leans up',
    category: 'wind',
    description:
      'A hollow pipe at two to one that starts straight and sways once it is held, on a long plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { volume: -5.5, attack: 0.18, ratio: 3, fm: 0.45, sustain: 0.6, colour: 0.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-gong-in-the-margin',
    name: 'Gong in the margin',
    category: 'bell',
    description:
      'A three to one gong with six seconds of decay, darkened as it fades and spread wide in a dark cave.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -1.5, attack: 0.02, fm: 0.6, ratio: 4, decay: 6, colour: 0.4 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
    preview: TREMBLING,
  },
  {
    id: 'ornament-book-low-hand-of-the-table',
    name: 'Low hand of the table',
    category: 'pad',
    description:
      'A dull asymmetric tone that falls to a third of its level, under a deep slow chorus and a hall with long lows.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { volume: -2.5, attack: 0.04, decay: 2.2, sustain: 0.35, fold: 0.5, colour: 0.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-shaken-drops',
    name: 'Shaken drops',
    category: 'plucked',
    description:
      'A third of a second of folded wood with some chance in each strike, scattered as seven echoes over a plate.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { volume: 2, decay: 0.35, chance: 0.3, fold: 0.35, timbreEnv: 0.8 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-knuckle-and-grace',
    name: 'Knuckle and grace',
    category: 'plucked',
    description:
      'A hollow tap of half a second inside a wooden body, followed by murky echoes nearly a second apart.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { volume: -3.5, decay: 0.55, fm: 0.25, ratio: 1, colour: 0.45, chance: 0.1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.55 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.28 } },
    ],
    preview: CRUSHED,
  },
  {
    id: 'ornament-book-crushed-chime',
    name: 'Crushed chime',
    category: 'bell',
    description:
      'A three to one chime of under two seconds, its top spread wide and a faint octave rising in the tail.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: -7, fm: 0.3, ratio: 4, decay: 1.8, colour: 0.8, attack: 0.006 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.28 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
    preview: CRUSHED,
  },
  {
    id: 'ornament-book-air-before-a-turn',
    name: 'Air before a turn',
    category: 'pad',
    description:
      'A nearly pure tone that opens within a tenth of a second, shadowed by sines an octave above in a seven second tank.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { attack: 0.08, decay: 4, fold: 0.1, fm: 0.06 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 7, mix: 0.35 } },
    ],
    preview: TURN,
  },

  // Zither: nail, pick or hammer, one string or its octave, and what the open strings add.
  {
    id: 'ornament-book-silk-before-the-string',
    name: 'Silk before the string',
    category: 'plucked',
    description:
      'A fingertip close to the bridge of a koto body, five seconds of ring and some sympathy, in a plain hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { exciter: 0, decay: 5, release: 2, position: 0.08, sympathy: 0.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    preview: SLIDE,
  },
  {
    id: 'ornament-book-hammers-beside-a-note',
    name: 'Hammers beside a note',
    category: 'plucked',
    description:
      'Dulcimer hammers repeat each held note seven times a second, duller than usual, on a dark plate.',
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { volume: -5, roll: 7, decay: 3.5, release: 1.5, brightness: 0.5, courses: 0.3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.4 } }],
    preview: LEANING,
  },
  {
    id: 'ornament-book-box-of-small-notes',
    name: 'Box of small notes',
    category: 'plucked',
    description:
      'Single strings picked near the middle, kept dull, doubled twenty cents apart and sent through a narrow warm spring.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { courses: 0, chord: 0, strum: 0, position: 0.4, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.35 } },
    ],
    preview: TREMBLING,
  },
  {
    id: 'ornament-book-felt-tongue',
    name: 'Felt tongue',
    category: 'string',
    description:
      'A felt hammer on a single string with ten seconds of ring, its attack blurred away before a seven second hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 10, release: 1.5, brightness: 0.2, sympathy: 0.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 120, mix: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, mix: 0.4 } },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-shaken-courses',
    name: 'Shaken courses',
    category: 'plucked',
    description:
      'Doubled strings picked near the end, the two of each course well apart in tune, under a slow phaser in a small hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { volume: -1, chord: 0, courses: 1, decay: 7, release: 1, position: 0.1 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-halo-after-the-bite',
    name: 'Halo after the bite',
    category: 'string',
    description:
      'A soft hammer on one string and every sympathetic string ringing behind it, answered by a hall that sings oo.',
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { volume: -11, courses: 0, release: 2, chord: 0, brightness: 0.2, decay: 12 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.4 } }],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-lace-on-the-roll',
    name: 'Lace on the roll',
    category: 'plucked',
    description:
      'Finger strokes split into octaves a quarter second apart, with one faint copy following nine tenths behind.',
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { volume: -4.5, chord: 1, strum: 260, release: 2, brightness: 0.75, position: 0.12 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: ROLLED,
  },
  {
    id: 'ornament-book-wire-turned-twice',
    name: 'Wire turned twice',
    category: 'plucked',
    description:
      'Hammered wire on a zither box with no roll, played back from a thin worn tape into a dark hall.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { chord: 0, roll: 0, body: 1, decay: 5, sympathy: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { output: 1 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
    preview: TURN,
  },
  {
    id: 'ornament-book-nasal-little-turn',
    name: 'Nasal little turn',
    category: 'plucked',
    description:
      'A koto string picked hard at the bridge, its tone opened by each stroke, with plain repeats.',
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: 4.5, chord: 0, strum: 0, position: 0.05, decay: 2.5, release: 1.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.5 } },
      { deviceId: 'echo-memory', preset: 'Plain echo', params: { mix: 0.35 } },
    ],
    preview: TURN,
  },
  {
    id: 'ornament-book-octave-falls-a-page',
    name: 'Octave falls a page',
    category: 'string',
    description:
      'Fingered octaves struck from the top down, faintly played back in reverse, in a hall that comes late.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: { volume: -10, release: 2.5, chord: 1, strum: 420, brightness: 0.4, decay: 8 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-glass-between-thirds',
    name: 'Glass between thirds',
    category: 'plucked',
    description:
      'A bright doubled string picked at its middle point, nine seconds long, opened from low to high by a slow fan of delays.',
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { chord: 0, strum: 0, courses: 0.7, decay: 9, release: 2, brightness: 0.85 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.4 } }],
    preview: FILLED_THIRDS,
  },
  {
    id: 'ornament-book-rowed-up-the-scale',
    name: 'Rowed up the scale',
    category: 'plucked',
    description:
      'Fingered strings in wide courses on a dulcimer body, caught by three short loops that turn out of step in a room.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: {
        release: 1.2,
        volume: -5,
        chord: 0,
        strum: 0,
        roll: 0,
        decay: 6,
        position: 0.15,
        courses: 0.6,
        body: 2,
      },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Short canon', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: RUN_UP,
  },

  // Guitar: what plucks, where along the string, and what is left ringing.
  {
    id: 'ornament-book-hammered-on-grace',
    name: 'Hammered-on grace',
    category: 'plucked',
    description:
      'A steel string played with little nail away from the bridge, with strings tuned to A minor ringing behind it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { nail: 0.25, position: 0.28, sustain: 7, release: 4 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-nylon-sigh',
    name: 'Nylon sigh',
    category: 'plucked',
    description:
      'Nylon strings under the fingertip alone, nine seconds of sustain in a dark hall, then printed on quarter inch tape.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: -4, nail: 0, sustain: 9, release: 1.2, tone: 0.35 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-courses-that-turn',
    name: 'Courses that turn',
    category: 'plucked',
    description:
      'Twelve strings picked softly with wide shimmer between the courses, a light chorus and six seconds of open space.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { volume: 0, nail: 0.4, position: 0.22, shimmer: 0.9, sustain: 8, release: 4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, mix: 0.25 } },
    ],
    preview: TURN,
  },
  {
    id: 'ornament-book-pulled-off-the-fret',
    name: 'Pulled off the fret',
    category: 'plucked',
    description:
      'A ringing steel string with more nail near the bridge, its echoes skipping out to both sides.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { release: 1.2, volume: -3, position: 0.1, nail: 0.7, tone: 0.75, body: 0.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.32 } }],
    preview: SPRINGER,
  },
  {
    id: 'ornament-book-bells-across-strings',
    name: 'Bells across strings',
    category: 'plucked',
    description:
      'Nylon plucked at the bridge and left to ring ten seconds, so a run overlaps like bells in a still four second room.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: 0.5, sustain: 10, release: 8, tone: 0.6 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 4, mix: 0.4 } }],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-short-nails',
    name: 'Short nails',
    category: 'plucked',
    description:
      'A muted steel string of little more than a second, followed by a round of three at six tenths of a second.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { volume: 2, sustain: 1.4, release: 0.3, tone: 0.7, body: 0.8 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Round of three', params: { gap: 0.6, mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-thumb-on-the-rosette',
    name: 'Thumb on the rosette',
    category: 'plucked',
    description:
      'The flesh of the thumb over the sound hole, sounding inside a clay pot in a dark hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: -3, sustain: 6, release: 4, strum: 20 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
    preview: ROLLED,
  },
  {
    id: 'ornament-book-bare-fret-far-door',
    name: 'Bare fret, far door',
    category: 'plucked',
    description:
      'A string with hardly any body behind it, played through a small combo at the other end of a hall.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -5, tone: 0.6, shimmer: 0.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
    preview: SLIDE,
  },
  {
    id: 'ornament-book-nail-at-the-saddle',
    name: 'Nail at the saddle',
    category: 'plucked',
    description:
      'All nail at the saddle of a thin steel guitar, throwing off sparks an octave and a fifth above in bright air.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: -5.5, nail: 1, body: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.35 } },
    ],
    preview: CRUSHED,
  },
  {
    id: 'ornament-book-dark-wood-long-lean',
    name: 'Dark wood, long lean',
    category: 'pad',
    description:
      'A full-bodied steel guitar plucked toward the middle, a thin bright halo smeared above it and left to hang.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { release: 1.8, position: 0.36, sustain: 12, shimmer: 1, tone: 0.4 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } }],
    preview: LEANING,
  },
  {
    id: 'ornament-book-plucked-dots',
    name: 'Plucked dots',
    category: 'plucked',
    description:
      'Nylon stopped after a second, a few faint points of echo to either side, and a cathedral for the rest.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: 2.5, sustain: 1, release: 0.25, position: 0.1 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-roll-kept-on-a-loop',
    name: 'Roll kept on a loop',
    category: 'plucked',
    description:
      'A loosely strummed steel guitar over a bed of its own last three seconds played backwards.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { volume: 0, sustain: 5, release: 2, body: 0.7, strum: 60 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
    preview: ROLLED,
  },

  // Flute: how much breath comes before the tone, how it is reached, and whether it shakes.
  {
    id: 'ornament-book-finger-over-the-rim',
    name: 'Finger over the rim',
    category: 'wind',
    description:
      'A concert flute with no vibrato of its own; a held note begins to tremble after a moment, in a bright hall.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { vibrato: 0, chiff: 0.3, attack: 0.07, release: 0.9, breath: 0.25 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { depth: 24, rate: 4.6 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
    ],
    preview: SPRINGER,
  },
  {
    id: 'ornament-book-low-flute-lets-go',
    name: 'Low flute lets go',
    category: 'wind',
    description:
      'A low flute blown hard with a full puff at each start, echoed darkly inside a cave.',
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { breath: 0.6, chiff: 0.9, attack: 0.05, release: 2.5 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.22 } },
    ],
    preview: SLIDING_LINE,
  },
  {
    id: 'ornament-book-bent-up-to-pitch',
    name: 'Bent up to pitch',
    category: 'wind',
    description:
      'A bamboo flute that bends nearly a whole tone up into every note, heard through slack springs and far echoes.',
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { scoop: 180, breath: 0.45, vibrato: 0.2, chiff: 0.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-pipe-with-one-chiff',
    name: 'Pipe with one chiff',
    category: 'wind',
    description:
      'A pan pipe with a strong puff and little breath after it, its echoes coming closer together on a bright plate.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.2, blow: 0.7, release: 0.25 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
    preview: CADENCE_LINE,
  },
  {
    id: 'ornament-book-wood-flute-shutter-open',
    name: 'Wood flute, shutter open',
    category: 'wind',
    description:
      'A wood flute blown full with no scoop, shadowed an octave down four tenths of a second later in a nine second space.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { volume: -17, scoop: 0, chiff: 0.8, breath: 0.15, blow: 0.75, vibrato: 0.15 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 9, mix: 0.35 } },
    ],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-breath-on-the-long-lean',
    name: 'Breath on the long lean',
    category: 'pad',
    description:
      'Low flutes that are mostly breath, rising over half a second through a wide phaser into a whispering room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { volume: -9.5, attack: 0.6, breath: 0.8, blow: 0.3, release: 3.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.35 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-small-beak-plain-turn',
    name: 'Small beak, plain turn',
    category: 'wind',
    description:
      'A straight recorder with a hard chiff, flute pipes an octave below and above it, in a tight chamber.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.02, chiff: 0.9, breath: 0.2, blow: 0.45, release: 1.4, scoop: 0 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
    preview: CADENCE_LINE,
  },
  {
    id: 'ornament-book-trembling-reed-of-air',
    name: 'Trembling reed of air',
    category: 'wind',
    description:
      'A bamboo flute with deep vibrato, a slow start, and its own phrases swelling up backwards beneath it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.25, breath: 0.5, scoop: 25, vibrato: 0.8 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-overblown-flourish',
    name: 'Overblown flourish',
    category: 'wind',
    description:
      'A flute blown as hard as it goes, with worn tape repeats near half a second and a long hall with its top closed.',
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { breath: 0.4, vibrato: 0.3, release: 0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 480, mix: 0.32 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.3 } },
    ],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-straight-into-the-light',
    name: 'Straight into the light',
    category: 'wind',
    description:
      'A flute with no vibrato and two others flying close by it, the tail climbing in fifths for five seconds.',
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.05, blow: 0.4, release: 2.2 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { decay: 5, mix: 0.28 } },
    ],
    preview: SLIDING_LINE,
  },

  // Clarinet: how the reed is started, how dark the bore, and what carries the end of the note.
  {
    id: 'ornament-book-tongue-barely-touches',
    name: 'Tongue barely touches',
    category: 'wind',
    description:
      'A clarinet started by a light tongue in three hundredths of a second, a little wide, in a hall with long lows.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { attack: 0.03, release: 0.6, breath: 0.2, blow: 0.45 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
    preview: TREMBLING,
  },
  {
    id: 'ornament-book-low-reed-bites-softly',
    name: 'Low reed bites softly',
    category: 'wind',
    description:
      'Bass clarinets tongued quickly but kept quiet, loosened by a drifting tape and held in a dark hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { volume: -10.5, attack: 0.03, release: 1, blow: 0.3, breath: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-subtone-in-the-gutter',
    name: 'Subtone in the gutter',
    category: 'wind',
    description:
      'A breathy conical reed barely blown, its tone smeared into a mist behind it on a dark plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { vibrato: 0.1, attack: 0.05, release: 1.4 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
    preview: SPRINGER,
  },
  {
    id: 'ornament-book-ink-drawn-out-of-water',
    name: 'Ink drawn out of water',
    category: 'wind',
    description:
      'A clarinet that takes half a second to appear, just under the surface of water, with a wide valley around it.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 0.5, release: 3.5, blow: 0.75 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-two-steps-into-a-third',
    name: 'Two steps into a third',
    category: 'wind',
    description:
      'A hollow reed section with a quick start, loosely doubled to either side over a small dark spring.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: -0.5, attack: 0.06, blow: 0.7, breath: 0.1, release: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
    ],
    preview: SLIDING_LINE,
  },
  {
    id: 'ornament-book-apricot-pipe-bent-cry',
    name: 'Apricot pipe, bent cry',
    category: 'wind',
    description:
      'A breathy reed with wide vibrato, its tail sagging in pitch as it dies in a cathedral.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.09, release: 1.2, vibrato: 0.75, breath: 0.7 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { sag: -14, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-bright-reed-on-a-wall',
    name: 'Bright reed on a wall',
    category: 'wind',
    description:
      'A bright conical reed with no vibrato, half of it through a horn speaker on a platform, with one slap.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.02, vibrato: 0, release: 0.4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { mix: 0.5 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 130 } },
    ],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-rough-shake',
    name: 'Rough shake',
    category: 'wind',
    description:
      'A tenor reed with a third of a growl, turned slowly by a rotor in a small dark room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 0.3, blow: 0.5, attack: 0.03, release: 0.7 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35 } },
    ],
    preview: CADENCE_LINE,
  },
  {
    id: 'ornament-book-hum-under-the-hand',
    name: 'Hum under the hand',
    category: 'wind',
    description:
      'A reed so lightly blown that it hums, sounding inside a short glass tube with a faint glow after it.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.06, release: 2.2, vibrato: 0.25 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.45 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.35 } },
    ],
    preview: SLIDING_LINE,
  },
  {
    id: 'ornament-book-flutter-written-out',
    name: 'Flutter written out',
    category: 'texture',
    description:
      'A fluttered clarinet split into its breath and its tone and set at a distance on a hazy plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.7, blow: 0.3, attack: 0.05, release: 1.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Breath and tone' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.5 } },
    ],
    preview: SLIDING_LINE,
  },

  // Bowed string: plucked, held or bowed, and how the bow or the finger takes the note.
  {
    id: 'ornament-book-bow-leans-then-leaves',
    name: 'Bow leans, then leaves',
    category: 'string',
    description:
      'A light bow with no vibrato, its pair ten cents apart, setting strings of A minor ringing in a cathedral.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        volume: -14,
        attack: 0.15,
        release: 1.5,
        vibrato: 0,
        pressure: 0.3,
        brightness: 0.65,
        position: 0.25,
        body: 0.5,
        detune: 10,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-flautando-sigh',
    name: 'Flautando sigh',
    category: 'string',
    description:
      'A very light bow over the fingerboard, spread wide, in a six second space that opens and closes slowly.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { volume: -5, attack: 0.25, release: 3.5, detune: 8, body: 0.4 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 6, mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-glass-bow-late-shake',
    name: 'Glass bow, late shake',
    category: 'string',
    description:
      'A thin bow near the bridge with a shimmer that starts four tenths of a second into each note and a tail two octaves up.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.3, release: 4, vibrato: 0, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Wide shimmer', params: { wait: 400 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-rasp-on-the-crushed',
    name: 'Rasp on the crushed',
    category: 'string',
    description:
      'A pressed bow at the bridge with a fast bite, its lows raised and its top lowered, in a bright chamber.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.015, release: 1.6, brightness: 0.6, pressure: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.35 } },
    ],
    preview: CRUSHED,
  },
  {
    id: 'ornament-book-felt-finger-long-page',
    name: 'Felt finger, long page',
    category: 'plucked',
    description:
      'A soft pluck in a big body with a nine second ring, coming back every two and a half seconds on a worn loop.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { release: 5, decay: 9, position: 0.35, body: 0.8 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { length: 2.6, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: SLIDE,
  },
  {
    id: 'ornament-book-wire-run-open-gate',
    name: 'Wire run, open gate',
    category: 'plucked',
    description:
      'A bright wire string let ring for eight seconds, under a slow wide chorus on a long plate.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -3, decay: 8, release: 5, brightness: 0.65, position: 0.16 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-damped-with-a-dot',
    name: 'Damped, with a dot',
    category: 'plucked',
    description:
      'A dull pluck stopped within two seconds, its echoes in tight clusters in a dark hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -4, decay: 2, release: 0.8, brightness: 0.2, position: 0.3 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-sung-note-two-strings',
    name: 'Sung note, two strings',
    category: 'string',
    description:
      'A sustained string that comes in quickly, its pair fifteen cents apart, warmed by a triode before two springs.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.12, release: 1.6, detune: 15, brightness: 0.5, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { mix: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.32 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-beating-under-a-trill',
    name: 'Beating under a trill',
    category: 'plucked',
    description:
      'A plucked pair sixteen cents apart, where the pitches a shake keeps coming back to are left hanging.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { detune: 16, decay: 12, release: 5, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.3 } },
    ],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-section-in-the-corner',
    name: 'Section in the corner',
    category: 'pad',
    description:
      'A wide bowed section that fades in over seven tenths of a second, dulled and set back as if through fog.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.7, release: 2, vibrato: 0.3, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Through fog' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
    preview: LEANING,
  },

  // Choir: one throat or many, the vowel of the note, and how it is let in.
  {
    id: 'ornament-book-cantor-with-a-springer',
    name: 'Cantor with a springer',
    category: 'voice',
    description:
      'One voice on ah, nearly straight, in a chapel of three seconds whose tail is an ah as well.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -5, vibrato: 6, attack: 0.06, release: 1.2, vowel: 0.04, breath: 0.25 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { vowel: 0, decay: 3, mix: 0.4 } },
    ],
    preview: SPRINGER,
  },
  {
    id: 'ornament-book-goat-on-the-gallery',
    name: 'Goat on the gallery',
    category: 'voice',
    description: 'A few altos on eh with a fast wide tremble, started hard, in a bright hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { vibrato: 45, vibratoRate: 7.5, attack: 0.04, release: 0.8, ensemble: 0.2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.4 } }],
    preview: SLIDING_LINE,
  },
  {
    id: 'ornament-book-monks-leaning-over',
    name: 'Monks leaning over',
    category: 'voice',
    description:
      'Dark voices on a closed oo that begin in half a second and fade over two and a half, in a low cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.5, release: 2.5, tone: 2200, vowel: 0.95 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-boys-on-the-top-note',
    name: 'Boys on the top note',
    category: 'voice',
    description:
      'Treble voices between oh and oo with hardly any breath, clouded by a few cents and placed on a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { volume: -2.5, attack: 0.12, release: 2.5, vowel: 0.9, breath: 0.05 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-breath-before-the-word',
    name: 'Breath before the word',
    category: 'texture',
    description:
      'Singers who give breath and almost no tone on ee, with the pitches drawn out behind them as slow sines.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.06, release: 3, vowel: 0.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.4 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.5 } },
    ],
    preview: TURN,
  },
  {
    id: 'ornament-book-short-ah-long-stone',
    name: 'Short ah, long stone',
    category: 'voice',
    description:
      'Short sung ahs with an immediate start, whose room swells up after each of them over two and a half seconds.',
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.5, breath: 0.25, voice: 1, tone: 6000 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.45 } }],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-hummed-behind-a-door',
    name: 'Hummed behind a door',
    category: 'pad',
    description:
      'A hum with its top closed, coming from next door and rising and falling in level every two and a half seconds.',
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.1, release: 2.5, tone: 1100 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { room: 0.4 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.4 } },
    ],
    preview: FILLED_THIRDS,
  },
  {
    id: 'ornament-book-ee-on-the-thin-paper',
    name: 'Ee on the thin paper',
    category: 'voice',
    description:
      'Voices on ee that start at once, with a faint octave above them and twelve seconds of cathedral.',
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.03, release: 0.8, ensemble: 0.6, voice: 1.14 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 12, mix: 0.32 } },
    ],
    preview: CADENCE_LINE,
  },
  {
    id: 'ornament-book-tenors-round-the-turn',
    name: 'Tenors round the turn',
    category: 'voice',
    description:
      'Straight tenors on a darkened oh who walk slowly round the listener in a four second cave.',
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { volume: -3.5, attack: 0.05, vowel: 0.75, vibrato: 4, tone: 3500, release: 1.6 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.12 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 4, mix: 0.35 } },
    ],
    preview: TURN,
  },

  // Harp: where the string is plucked, how it bends, and what is damped.
  {
    id: 'ornament-book-koto-thumb-two-steps-up',
    name: 'Koto thumb, two steps up',
    category: 'plucked',
    description:
      'Koto strings plucked away from the bridge and left unbent, twice the usual ring and half damped, in a hall of four seconds.',
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: {
        body: 0.4,
        pluck: 0.28,
        volume: -2.5,
        bend: 0,
        decay: 2,
        halo: 0.3,
        touch: 0.45,
        damp: 0.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, mix: 0.35 } }],
    preview: SLIDE,
  },
  {
    id: 'ornament-book-harp-close-to-the-wood',
    name: 'Harp close to the wood',
    category: 'plucked',
    description:
      'A harp plucked at the soundboard and lightly damped, with three tape heads behind it and the whole thing dulled.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: 0, decay: 1, damp: 0.2, body: 0.8 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-guzheng-shaken-by-hand',
    name: 'Guzheng shaken by hand',
    category: 'plucked',
    description:
      'Steel guzheng strings plucked a quarter of the way along, wavering in pitch five or six times a second on a plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 1, bend: 0, decay: 2.2, pluck: 0.25, halo: 0.7 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { rate: 5.6, depth: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.35 } },
    ],
    preview: TREMBLING,
  },
  {
    id: 'ornament-book-run-left-undamped',
    name: 'Run left undamped',
    category: 'plucked',
    description:
      'A harp whose strings ring through every run, small octave repeats raining over it in a plain tank.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.3, touch: 0.45, decay: 1.6, halo: 0.7 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.22 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.3 } },
    ],
    preview: RUN_UP,
  },
  {
    id: 'ornament-book-muffled-arpeggio',
    name: 'Muffled arpeggio',
    category: 'plucked',
    description:
      'A half damped harp with a soft finger, blurred into a cloud and recorded again through a small room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.5, body: 1, touch: 0.1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 220, mix: 0.7 } },
      { deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.35 } },
    ],
    preview: ROLLED,
  },
  {
    id: 'ornament-book-silk-crushed-softly',
    name: 'Silk crushed softly',
    category: 'plucked',
    description:
      'Silk strings without any bend, long while held and damped when let go, in a tight swarm of echoes and an airy hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: -3, bend: 0, decay: 2.5, touch: 0.3, damp: 0.6, body: 0.5 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
    preview: CRUSHED,
  },
  {
    id: 'ornament-book-hollow-harp-lean-note',
    name: 'Hollow harp, lean note',
    category: 'string',
    description:
      'A dark harp with its plucks taken off by a quarter second swell, drifting downward in a fourteen second tail.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -3, decay: 2.5, halo: 0.9, touch: 0.15, damp: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 250 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 14, mix: 0.4 } },
    ],
    preview: LEANING,
  },

  // Felt piano: hammer, pedal and what the ornament leaves on the strings.
  {
    id: 'ornament-book-shake-with-both-pedals',
    name: 'Shake with both pedals',
    category: 'keys',
    description:
      'A soft-pedalled piano with the sustain pedal most of the way down, so a shake blurs as it gathers, in a dark hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -13.5, soft: 1, felt: 0.5, sustain: 0.6, reverbMix: 0, resonance: 0.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-crushed-then-held',
    name: 'Crushed, then held',
    category: 'keys',
    description:
      'A bare hard piano whose crushed notes are kept ringing by strings that learn the tune.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -13, hardness: 0.75, resonance: 0.7, reverbMix: 0, stiffness: 1.4 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
    preview: CRUSHED,
  },
  {
    id: 'ornament-book-upright-page-of-turns',
    name: 'Upright, page of turns',
    category: 'keys',
    description:
      'An old upright, out of tune with itself, on a record with a little crackle and a hint of spring.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -18, grit: 0.2, action: 0.5, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.22 } },
    ],
    preview: TURN,
  },
  {
    id: 'ornament-book-roll-in-the-next-room',
    name: 'Roll in the next room',
    category: 'keys',
    description:
      'A heavily felted piano half in the next room, under a slow hollow chorus and muffled tape.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { outputDb: -12.5, width: 0.6, felt: 0.95, reverbMix: 0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
    preview: ROLLED,
  },
  {
    id: 'ornament-book-thud-then-a-third',
    name: 'Thud, then a third',
    category: 'keys',
    description:
      'A piano of felt and little hammer, each note caught at once and held as an even tone for a few seconds.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -15, thump: 0.5, hardness: 0.15, width: 0.8, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch', params: { decay: 5, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: FILLED_THIRDS,
  },

  // Thesis: chord tones of noise around a centre, opened quickly or slowly.
  {
    id: 'ornament-book-mirror-of-the-mordent',
    name: 'Mirror of the mordent',
    category: 'pad',
    description:
      'Each note and one mirrored band around E in C major, narrow and quick to open, on a long plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { center: 64, resonance: 90, attack: 0.04, release: 1.8, mode: 0 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 8, outputGain: -7 } },
    ],
    preview: MORDENT,
  },
  {
    id: 'ornament-book-strummed-around-d',
    name: 'Strummed around D',
    category: 'pad',
    description:
      'Bands around D in D dorian, strummed sixty milliseconds apart, answered by one backward copy.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { scale: 4, root: 2, center: 62, attack: 0.02, release: 2.5, strum: 60 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Mirror answer', params: { mix: 0.3 } },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { makeup: -3 } },
    ],
    preview: ROLLED,
  },
  {
    id: 'ornament-book-shake-in-a-whisper',
    name: 'Shake in a whisper',
    category: 'texture',
    description:
      'Wide noisy bands in C major that open at once and close within a second, into a whispering room.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: { scale: 0, resonance: 22, attack: 0.03, release: 0.9, breatheRate: 0.2, width: 90 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
    preview: SHAKE,
  },
  {
    id: 'ornament-book-leaning-by-gravity',
    name: 'Leaning by gravity',
    category: 'pad',
    description:
      'Bands pulled toward A in C major, half a second to open, through a very slow phaser and a warm tape.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { attack: 0.5, release: 2, resonance: 60, width: 70, center: 57, root: 0 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -4.5 } },
    ],
    preview: LEANING,
  },
  {
    id: 'ornament-book-phrygian-finely-ruled',
    name: 'Phrygian, finely ruled',
    category: 'pad',
    description:
      'Narrow bands around C in E phrygian, four seconds in dying away, with a thin stretched glow and a veil of room.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 70, attack: 0.3, release: 4, width: 80, center: 60, mode: 0 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Thin glow', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.25 } },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { makeup: 4 } },
    ],
    preview: RISING_LEAN,
  },

  // Rewind and feedback: the note that arrives late, and the one that is caught.
  {
    id: 'ornament-book-bell-lands-on-the-beat',
    name: 'Bell lands on the beat',
    category: 'bell',
    description:
      'Bells played backwards that take half a second to land and then ring on almost whole in a bright hall.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: -1, swell: 0.5, tail: 0.9, snap: 0.15, ghost: 0.1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } }],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-pluck-drawn-inward',
    name: 'Pluck drawn inward',
    category: 'plucked',
    description:
      'A reversed pluck of three tenths of a second with some of its tail left on, flickering backwards on a dark plate.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: 3.5, swell: 0.3, tail: 0.6, snap: 0.3, tone: 0.7 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Flicker', params: { time: 210, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
    preview: SPRINGER,
  },
  {
    id: 'ornament-book-bowl-before-its-grace',
    name: 'Bowl before its grace',
    category: 'bell',
    description:
      'A bowl that gathers for nine tenths of a second and rings out in full, held by a reverb that neither climbs nor sinks.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: -3.5, swell: 0.9, ghost: 0.3, shimmer: 0.15, rise: 0.6 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Held still', params: { mix: 0.35 } }],
    preview: RISING_LEAN,
  },
  {
    id: 'ornament-book-caught-on-the-octave',
    name: 'Caught on the octave',
    category: 'string',
    description:
      'A plucked string that feedback lifts to its octave in a third of a second, with little grit, over three long springs.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Singing string',
      params: { volume: -13, distance: 2, bloom: 0.3, grit: 0.1, pick: 0.4, release: 2.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.35 } }],
    preview: SPRINGER,
  },
  {
    id: 'ornament-book-plucked-never-caught',
    name: 'Plucked, never caught',
    category: 'plucked',
    description:
      'A string whose amplifier is turned too low to catch it, followed by a long dark trail of tape.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Plucked and gone',
      params: { volume: -1, gain: 0.2, damp: 0.5, release: 1.8, grit: 0.05 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
    preview: TREMBLING,
  },
  {
    id: 'ornament-book-dark-hold-slow-lean',
    name: 'Dark hold, slow lean',
    category: 'string',
    description:
      'Damped strings that the amplifier takes most of a second to catch, dulled and left in a dark cave.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { volume: -5, bloom: 0.8, pick: 0.3, release: 1.8, gain: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } },
    ],
    preview: LEANING,
  },
]
