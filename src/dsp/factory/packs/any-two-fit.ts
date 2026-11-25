import { type FactoryPreset, type Phrase } from '../types'

// Parts for an eight-bar ground in A, in three, one bar to a pulse. Twelve lines were found by
// search so that all 66 pairs agree either way up. On beat one a pair makes a third, a sixth or an
// octave, or a suspension that falls a step. Off it a fourth, a fifth or a passing note is let in.
// No pair moves in parallel fifths, fourths or octaves from one note to the next. The previews play
// all twelve, most of them in twos and threes, with the ground and without it.

// The ground: A G F C D E F E, one note to a bar of three, eight bars.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 45, gain: 0.5 },
    { atSec: 0.87, durSec: 0.85, note: 43, gain: 0.5 },
    { atSec: 1.74, durSec: 0.85, note: 41, gain: 0.5 },
    { atSec: 2.61, durSec: 0.85, note: 36, gain: 0.5 },
    { atSec: 3.48, durSec: 0.85, note: 38, gain: 0.5 },
    { atSec: 4.35, durSec: 0.85, note: 40, gain: 0.5 },
    { atSec: 5.22, durSec: 0.85, note: 41, gain: 0.5 },
    { atSec: 6.09, durSec: 0.85, note: 40, gain: 0.5 },
  ],
}

// The ground in tenths, its last five bars an octave higher.
const TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 45, gain: 0.42 },
    { atSec: 0, durSec: 0.85, note: 60, gain: 0.36 },
    { atSec: 0.87, durSec: 0.85, note: 43, gain: 0.42 },
    { atSec: 0.87, durSec: 0.85, note: 59, gain: 0.36 },
    { atSec: 1.74, durSec: 0.85, note: 41, gain: 0.42 },
    { atSec: 1.74, durSec: 0.85, note: 57, gain: 0.36 },
    { atSec: 2.61, durSec: 0.85, note: 48, gain: 0.42 },
    { atSec: 2.61, durSec: 0.85, note: 64, gain: 0.36 },
    { atSec: 3.48, durSec: 0.85, note: 50, gain: 0.42 },
    { atSec: 3.48, durSec: 0.85, note: 65, gain: 0.36 },
    { atSec: 4.35, durSec: 0.85, note: 52, gain: 0.42 },
    { atSec: 4.35, durSec: 0.85, note: 67, gain: 0.36 },
    { atSec: 5.22, durSec: 0.85, note: 53, gain: 0.42 },
    { atSec: 5.22, durSec: 0.85, note: 69, gain: 0.36 },
    { atSec: 6.09, durSec: 0.85, note: 52, gain: 0.42 },
    { atSec: 6.09, durSec: 0.85, note: 67, gain: 0.36 },
  ],
}

// The ground short, beat two of every bar left out, line eleven answering on beat three.
const BEAT_TWO_OUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.25, note: 45, gain: 0.5 },
    { atSec: 0.54, durSec: 0.26, note: 76, gain: 0.4 },
    { atSec: 0.81, durSec: 0.25, note: 43, gain: 0.5 },
    { atSec: 1.35, durSec: 0.26, note: 74, gain: 0.4 },
    { atSec: 1.62, durSec: 0.25, note: 41, gain: 0.5 },
    { atSec: 2.16, durSec: 0.26, note: 72, gain: 0.4 },
    { atSec: 2.43, durSec: 0.25, note: 36, gain: 0.5 },
    { atSec: 2.97, durSec: 0.26, note: 76, gain: 0.4 },
    { atSec: 3.24, durSec: 0.25, note: 38, gain: 0.5 },
    { atSec: 3.78, durSec: 0.26, note: 69, gain: 0.4 },
    { atSec: 4.05, durSec: 0.25, note: 40, gain: 0.5 },
    { atSec: 4.59, durSec: 0.26, note: 71, gain: 0.4 },
    { atSec: 4.86, durSec: 0.25, note: 41, gain: 0.5 },
    { atSec: 5.4, durSec: 0.26, note: 69, gain: 0.4 },
    { atSec: 5.67, durSec: 0.25, note: 40, gain: 0.5 },
    { atSec: 6.21, durSec: 0.26, note: 67, gain: 0.4 },
  ],
}

// Line one: E held over G, D over F, A over E, each falling a step.
const TIED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.15, note: 76, gain: 0.42 },
    { atSec: 1.16, durSec: 0.86, note: 74, gain: 0.42 },
    { atSec: 2.03, durSec: 0.86, note: 72, gain: 0.42 },
    { atSec: 2.9, durSec: 1.73, note: 69, gain: 0.42 },
    { atSec: 4.64, durSec: 0.57, note: 67, gain: 0.42 },
    { atSec: 5.22, durSec: 0.57, note: 69, gain: 0.42 },
    { atSec: 5.8, durSec: 0.57, note: 72, gain: 0.42 },
    { atSec: 6.38, durSec: 0.57, note: 71, gain: 0.42 },
  ],
}

// Line two, in quarter notes, under line seven, which has only A, C and E.
const QUARTERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.28, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 0.86, note: 76, gain: 0.3 },
    { atSec: 0.29, durSec: 0.28, note: 57, gain: 0.42 },
    { atSec: 0.58, durSec: 0.28, note: 64, gain: 0.42 },
    { atSec: 0.87, durSec: 0.28, note: 64, gain: 0.3 },
    { atSec: 0.87, durSec: 0.57, note: 67, gain: 0.42 },
    { atSec: 1.45, durSec: 0.28, note: 62, gain: 0.42 },
    { atSec: 1.74, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 1.74, durSec: 0.28, note: 69, gain: 0.3 },
    { atSec: 2.03, durSec: 0.28, note: 65, gain: 0.42 },
    { atSec: 2.32, durSec: 0.28, note: 60, gain: 0.42 },
    { atSec: 2.61, durSec: 0.86, note: 64, gain: 0.42 },
    { atSec: 2.61, durSec: 0.86, note: 72, gain: 0.3 },
    { atSec: 3.48, durSec: 0.28, note: 65, gain: 0.42 },
    { atSec: 3.48, durSec: 0.86, note: 69, gain: 0.3 },
    { atSec: 3.77, durSec: 0.28, note: 62, gain: 0.42 },
    { atSec: 4.06, durSec: 0.28, note: 57, gain: 0.42 },
    { atSec: 4.35, durSec: 0.57, note: 60, gain: 0.42 },
    { atSec: 4.35, durSec: 0.28, note: 76, gain: 0.3 },
    { atSec: 4.93, durSec: 0.28, note: 62, gain: 0.42 },
    { atSec: 5.22, durSec: 0.28, note: 60, gain: 0.42 },
    { atSec: 5.22, durSec: 0.86, note: 72, gain: 0.3 },
    { atSec: 5.51, durSec: 0.28, note: 65, gain: 0.42 },
    { atSec: 5.8, durSec: 0.28, note: 60, gain: 0.42 },
    { atSec: 6.09, durSec: 0.57, note: 64, gain: 0.42 },
    { atSec: 6.09, durSec: 0.28, note: 72, gain: 0.3 },
    { atSec: 6.67, durSec: 0.28, note: 59, gain: 0.42 },
  ],
}

// Line three, half notes that make three of two out of two bars of three, under line ten.
const HEMIOLA: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.57, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 0.57, note: 76, gain: 0.34 },
    { atSec: 0.58, durSec: 0.57, note: 64, gain: 0.42 },
    { atSec: 0.58, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 0.87, durSec: 0.57, note: 67, gain: 0.34 },
    { atSec: 1.16, durSec: 0.57, note: 67, gain: 0.42 },
    { atSec: 1.45, durSec: 0.28, note: 71, gain: 0.34 },
    { atSec: 1.74, durSec: 0.57, note: 69, gain: 0.42 },
    { atSec: 1.74, durSec: 0.57, note: 69, gain: 0.34 },
    { atSec: 2.32, durSec: 0.57, note: 72, gain: 0.42 },
    { atSec: 2.32, durSec: 0.28, note: 77, gain: 0.34 },
    { atSec: 2.61, durSec: 0.57, note: 76, gain: 0.34 },
    { atSec: 2.9, durSec: 0.57, note: 72, gain: 0.42 },
    { atSec: 3.19, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 3.48, durSec: 0.57, note: 65, gain: 0.42 },
    { atSec: 3.48, durSec: 0.57, note: 69, gain: 0.34 },
    { atSec: 4.06, durSec: 0.57, note: 65, gain: 0.42 },
    { atSec: 4.06, durSec: 0.28, note: 74, gain: 0.34 },
    { atSec: 4.35, durSec: 0.57, note: 72, gain: 0.34 },
    { atSec: 4.64, durSec: 0.57, note: 64, gain: 0.42 },
    { atSec: 4.93, durSec: 0.28, note: 76, gain: 0.34 },
    { atSec: 5.22, durSec: 0.57, note: 60, gain: 0.42 },
    { atSec: 5.22, durSec: 0.57, note: 69, gain: 0.34 },
    { atSec: 5.8, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 5.8, durSec: 0.57, note: 69, gain: 0.42 },
    { atSec: 6.09, durSec: 0.57, note: 76, gain: 0.34 },
    { atSec: 6.38, durSec: 0.57, note: 67, gain: 0.42 },
    { atSec: 6.67, durSec: 0.28, note: 79, gain: 0.34 },
  ],
}

// Lines four and twelve: both rest on every beat one.
const OFFBEATS: Phrase = {
  notes: [
    { atSec: 0.29, durSec: 0.57, note: 72, gain: 0.36 },
    { atSec: 0.29, durSec: 0.28, note: 81, gain: 0.4 },
    { atSec: 0.58, durSec: 0.28, note: 84, gain: 0.4 },
    { atSec: 1.16, durSec: 0.57, note: 71, gain: 0.36 },
    { atSec: 1.16, durSec: 0.28, note: 86, gain: 0.4 },
    { atSec: 1.45, durSec: 0.28, note: 83, gain: 0.4 },
    { atSec: 2.03, durSec: 0.57, note: 69, gain: 0.36 },
    { atSec: 2.03, durSec: 0.28, note: 84, gain: 0.4 },
    { atSec: 2.32, durSec: 0.28, note: 81, gain: 0.4 },
    { atSec: 2.9, durSec: 0.57, note: 72, gain: 0.36 },
    { atSec: 2.9, durSec: 0.28, note: 76, gain: 0.4 },
    { atSec: 3.19, durSec: 0.28, note: 84, gain: 0.4 },
    { atSec: 3.77, durSec: 0.57, note: 65, gain: 0.36 },
    { atSec: 3.77, durSec: 0.28, note: 81, gain: 0.4 },
    { atSec: 4.06, durSec: 0.28, note: 77, gain: 0.4 },
    { atSec: 4.64, durSec: 0.57, note: 67, gain: 0.36 },
    { atSec: 4.64, durSec: 0.28, note: 76, gain: 0.4 },
    { atSec: 4.93, durSec: 0.28, note: 79, gain: 0.4 },
    { atSec: 5.51, durSec: 0.57, note: 69, gain: 0.36 },
    { atSec: 5.51, durSec: 0.28, note: 84, gain: 0.4 },
    { atSec: 5.8, durSec: 0.28, note: 77, gain: 0.4 },
    { atSec: 6.38, durSec: 0.57, note: 64, gain: 0.36 },
    { atSec: 6.38, durSec: 0.28, note: 79, gain: 0.4 },
    { atSec: 6.67, durSec: 0.28, note: 76, gain: 0.4 },
  ],
}

// Lines five and six: beats one and three against beat two.
const HOCKET: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.28, note: 72, gain: 0.4 },
    { atSec: 0.29, durSec: 0.28, note: 84, gain: 0.42 },
    { atSec: 0.58, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 0.87, durSec: 0.28, note: 64, gain: 0.4 },
    { atSec: 1.16, durSec: 0.28, note: 83, gain: 0.42 },
    { atSec: 1.45, durSec: 0.28, note: 67, gain: 0.4 },
    { atSec: 1.74, durSec: 0.28, note: 72, gain: 0.4 },
    { atSec: 2.03, durSec: 0.28, note: 81, gain: 0.42 },
    { atSec: 2.32, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 2.61, durSec: 0.28, note: 64, gain: 0.4 },
    { atSec: 2.9, durSec: 0.28, note: 84, gain: 0.42 },
    { atSec: 3.19, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 3.48, durSec: 0.28, note: 65, gain: 0.4 },
    { atSec: 3.77, durSec: 0.28, note: 86, gain: 0.42 },
    { atSec: 4.06, durSec: 0.28, note: 65, gain: 0.4 },
    { atSec: 4.35, durSec: 0.28, note: 64, gain: 0.4 },
    { atSec: 4.64, durSec: 0.28, note: 84, gain: 0.42 },
    { atSec: 4.93, durSec: 0.28, note: 71, gain: 0.4 },
    { atSec: 5.22, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 5.51, durSec: 0.28, note: 81, gain: 0.42 },
    { atSec: 5.8, durSec: 0.28, note: 65, gain: 0.4 },
    { atSec: 6.09, durSec: 0.28, note: 60, gain: 0.4 },
    { atSec: 6.38, durSec: 0.28, note: 76, gain: 0.42 },
    { atSec: 6.67, durSec: 0.28, note: 64, gain: 0.4 },
  ],
}

// Lines seven and eight: one of A, C and E alone, and one note a bar to go with it.
const TINTIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.28, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 0.86, note: 76, gain: 0.45 },
    { atSec: 0.87, durSec: 0.28, note: 64, gain: 0.45 },
    { atSec: 0.87, durSec: 0.28, note: 67, gain: 0.36 },
    { atSec: 1.74, durSec: 0.28, note: 69, gain: 0.45 },
    { atSec: 1.74, durSec: 0.28, note: 72, gain: 0.36 },
    { atSec: 2.61, durSec: 0.28, note: 60, gain: 0.36 },
    { atSec: 2.61, durSec: 0.86, note: 72, gain: 0.45 },
    { atSec: 3.48, durSec: 0.28, note: 65, gain: 0.36 },
    { atSec: 3.48, durSec: 0.86, note: 69, gain: 0.45 },
    { atSec: 4.35, durSec: 0.28, note: 60, gain: 0.36 },
    { atSec: 4.35, durSec: 0.28, note: 76, gain: 0.45 },
    { atSec: 5.22, durSec: 0.28, note: 69, gain: 0.36 },
    { atSec: 5.22, durSec: 0.86, note: 72, gain: 0.45 },
    { atSec: 6.09, durSec: 0.28, note: 64, gain: 0.36 },
    { atSec: 6.09, durSec: 0.28, note: 72, gain: 0.45 },
  ],
}

// Line one above line two, over the ground.
const TWO_WAYS_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 45, gain: 0.36 },
    { atSec: 0, durSec: 0.28, note: 60, gain: 0.3 },
    { atSec: 0, durSec: 1.15, note: 76, gain: 0.36 },
    { atSec: 0.29, durSec: 0.28, note: 57, gain: 0.3 },
    { atSec: 0.58, durSec: 0.28, note: 64, gain: 0.3 },
    { atSec: 0.87, durSec: 0.85, note: 43, gain: 0.36 },
    { atSec: 0.87, durSec: 0.57, note: 67, gain: 0.3 },
    { atSec: 1.16, durSec: 0.86, note: 74, gain: 0.36 },
    { atSec: 1.45, durSec: 0.28, note: 62, gain: 0.3 },
    { atSec: 1.74, durSec: 0.85, note: 41, gain: 0.36 },
    { atSec: 1.74, durSec: 0.28, note: 69, gain: 0.3 },
    { atSec: 2.03, durSec: 0.28, note: 65, gain: 0.3 },
    { atSec: 2.03, durSec: 0.86, note: 72, gain: 0.36 },
    { atSec: 2.32, durSec: 0.28, note: 60, gain: 0.3 },
    { atSec: 2.61, durSec: 0.85, note: 36, gain: 0.36 },
    { atSec: 2.61, durSec: 0.86, note: 64, gain: 0.3 },
    { atSec: 2.9, durSec: 1.73, note: 69, gain: 0.36 },
    { atSec: 3.48, durSec: 0.85, note: 38, gain: 0.36 },
    { atSec: 3.48, durSec: 0.28, note: 65, gain: 0.3 },
    { atSec: 3.77, durSec: 0.28, note: 62, gain: 0.3 },
    { atSec: 4.06, durSec: 0.28, note: 57, gain: 0.3 },
    { atSec: 4.35, durSec: 0.85, note: 40, gain: 0.36 },
    { atSec: 4.35, durSec: 0.57, note: 60, gain: 0.3 },
    { atSec: 4.64, durSec: 0.57, note: 67, gain: 0.36 },
    { atSec: 4.93, durSec: 0.28, note: 62, gain: 0.3 },
    { atSec: 5.22, durSec: 0.85, note: 41, gain: 0.36 },
    { atSec: 5.22, durSec: 0.28, note: 60, gain: 0.3 },
    { atSec: 5.22, durSec: 0.57, note: 69, gain: 0.36 },
    { atSec: 5.51, durSec: 0.28, note: 65, gain: 0.3 },
    { atSec: 5.8, durSec: 0.28, note: 60, gain: 0.3 },
    { atSec: 5.8, durSec: 0.57, note: 72, gain: 0.36 },
    { atSec: 6.09, durSec: 0.85, note: 40, gain: 0.36 },
    { atSec: 6.09, durSec: 0.57, note: 64, gain: 0.3 },
    { atSec: 6.38, durSec: 0.57, note: 71, gain: 0.36 },
    { atSec: 6.67, durSec: 0.28, note: 59, gain: 0.3 },
  ],
}

// The same two turned over: line two above, line one below.
const OTHER_WAY_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 45, gain: 0.36 },
    { atSec: 0, durSec: 1.15, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 0.28, note: 72, gain: 0.32 },
    { atSec: 0.29, durSec: 0.28, note: 69, gain: 0.32 },
    { atSec: 0.58, durSec: 0.28, note: 76, gain: 0.32 },
    { atSec: 0.87, durSec: 0.85, note: 43, gain: 0.36 },
    { atSec: 0.87, durSec: 0.57, note: 79, gain: 0.32 },
    { atSec: 1.16, durSec: 0.86, note: 62, gain: 0.36 },
    { atSec: 1.45, durSec: 0.28, note: 74, gain: 0.32 },
    { atSec: 1.74, durSec: 0.85, note: 41, gain: 0.36 },
    { atSec: 1.74, durSec: 0.28, note: 81, gain: 0.32 },
    { atSec: 2.03, durSec: 0.86, note: 60, gain: 0.36 },
    { atSec: 2.03, durSec: 0.28, note: 77, gain: 0.32 },
    { atSec: 2.32, durSec: 0.28, note: 72, gain: 0.32 },
    { atSec: 2.61, durSec: 0.85, note: 36, gain: 0.36 },
    { atSec: 2.61, durSec: 0.86, note: 76, gain: 0.32 },
    { atSec: 2.9, durSec: 1.73, note: 57, gain: 0.36 },
    { atSec: 3.48, durSec: 0.85, note: 38, gain: 0.36 },
    { atSec: 3.48, durSec: 0.28, note: 77, gain: 0.32 },
    { atSec: 3.77, durSec: 0.28, note: 74, gain: 0.32 },
    { atSec: 4.06, durSec: 0.28, note: 69, gain: 0.32 },
    { atSec: 4.35, durSec: 0.85, note: 40, gain: 0.36 },
    { atSec: 4.35, durSec: 0.57, note: 72, gain: 0.32 },
    { atSec: 4.64, durSec: 0.57, note: 55, gain: 0.36 },
    { atSec: 4.93, durSec: 0.28, note: 74, gain: 0.32 },
    { atSec: 5.22, durSec: 0.85, note: 41, gain: 0.36 },
    { atSec: 5.22, durSec: 0.57, note: 57, gain: 0.36 },
    { atSec: 5.22, durSec: 0.28, note: 72, gain: 0.32 },
    { atSec: 5.51, durSec: 0.28, note: 77, gain: 0.32 },
    { atSec: 5.8, durSec: 0.57, note: 60, gain: 0.36 },
    { atSec: 5.8, durSec: 0.28, note: 72, gain: 0.32 },
    { atSec: 6.09, durSec: 0.85, note: 40, gain: 0.36 },
    { atSec: 6.09, durSec: 0.57, note: 76, gain: 0.32 },
    { atSec: 6.38, durSec: 0.57, note: 59, gain: 0.36 },
    { atSec: 6.67, durSec: 0.28, note: 71, gain: 0.32 },
  ],
}

// Lines two, four and nine together over the ground.
const THREE_DOORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 45, gain: 0.34 },
    { atSec: 0, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 0, durSec: 0.28, note: 72, gain: 0.28 },
    { atSec: 0.29, durSec: 0.57, note: 60, gain: 0.34 },
    { atSec: 0.29, durSec: 0.28, note: 69, gain: 0.28 },
    { atSec: 0.29, durSec: 0.28, note: 81, gain: 0.26 },
    { atSec: 0.58, durSec: 0.28, note: 76, gain: 0.28 },
    { atSec: 0.58, durSec: 0.28, note: 84, gain: 0.26 },
    { atSec: 0.87, durSec: 0.85, note: 43, gain: 0.34 },
    { atSec: 0.87, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 0.87, durSec: 0.57, note: 79, gain: 0.28 },
    { atSec: 1.16, durSec: 0.57, note: 71, gain: 0.34 },
    { atSec: 1.16, durSec: 0.28, note: 86, gain: 0.26 },
    { atSec: 1.45, durSec: 0.28, note: 74, gain: 0.28 },
    { atSec: 1.45, durSec: 0.28, note: 83, gain: 0.26 },
    { atSec: 1.74, durSec: 0.85, note: 41, gain: 0.34 },
    { atSec: 1.74, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 1.74, durSec: 0.28, note: 81, gain: 0.28 },
    { atSec: 2.03, durSec: 0.57, note: 69, gain: 0.34 },
    { atSec: 2.03, durSec: 0.28, note: 77, gain: 0.28 },
    { atSec: 2.03, durSec: 0.28, note: 84, gain: 0.26 },
    { atSec: 2.32, durSec: 0.28, note: 72, gain: 0.28 },
    { atSec: 2.32, durSec: 0.28, note: 81, gain: 0.26 },
    { atSec: 2.61, durSec: 0.85, note: 36, gain: 0.34 },
    { atSec: 2.61, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 2.61, durSec: 0.86, note: 76, gain: 0.28 },
    { atSec: 2.9, durSec: 0.57, note: 64, gain: 0.34 },
    { atSec: 2.9, durSec: 0.28, note: 76, gain: 0.26 },
    { atSec: 3.19, durSec: 0.28, note: 84, gain: 0.26 },
    { atSec: 3.48, durSec: 0.85, note: 38, gain: 0.34 },
    { atSec: 3.48, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 3.48, durSec: 0.28, note: 77, gain: 0.28 },
    { atSec: 3.77, durSec: 0.57, note: 65, gain: 0.34 },
    { atSec: 3.77, durSec: 0.28, note: 74, gain: 0.28 },
    { atSec: 3.77, durSec: 0.28, note: 81, gain: 0.26 },
    { atSec: 4.06, durSec: 0.28, note: 69, gain: 0.28 },
    { atSec: 4.06, durSec: 0.28, note: 77, gain: 0.26 },
    { atSec: 4.35, durSec: 0.85, note: 40, gain: 0.34 },
    { atSec: 4.35, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 4.35, durSec: 0.57, note: 72, gain: 0.28 },
    { atSec: 4.64, durSec: 0.57, note: 67, gain: 0.34 },
    { atSec: 4.64, durSec: 0.28, note: 76, gain: 0.26 },
    { atSec: 4.93, durSec: 0.28, note: 74, gain: 0.28 },
    { atSec: 4.93, durSec: 0.28, note: 79, gain: 0.26 },
    { atSec: 5.22, durSec: 0.85, note: 41, gain: 0.34 },
    { atSec: 5.22, durSec: 0.28, note: 72, gain: 0.28 },
    { atSec: 5.22, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 5.51, durSec: 0.57, note: 69, gain: 0.34 },
    { atSec: 5.51, durSec: 0.28, note: 77, gain: 0.28 },
    { atSec: 5.51, durSec: 0.28, note: 84, gain: 0.26 },
    { atSec: 5.8, durSec: 0.28, note: 72, gain: 0.28 },
    { atSec: 5.8, durSec: 0.28, note: 77, gain: 0.26 },
    { atSec: 6.09, durSec: 0.85, note: 40, gain: 0.34 },
    { atSec: 6.09, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 6.09, durSec: 0.57, note: 76, gain: 0.28 },
    { atSec: 6.38, durSec: 0.57, note: 64, gain: 0.34 },
    { atSec: 6.38, durSec: 0.28, note: 79, gain: 0.26 },
    { atSec: 6.67, durSec: 0.28, note: 71, gain: 0.28 },
    { atSec: 6.67, durSec: 0.28, note: 76, gain: 0.26 },
  ],
}

// Bars one to four at half the pace: line one and line ten over the ground.
const SLOW_HALF: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.72, note: 45, gain: 0.36 },
    { atSec: 0, durSec: 1.15, note: 64, gain: 0.3 },
    { atSec: 0, durSec: 2.31, note: 76, gain: 0.36 },
    { atSec: 1.16, durSec: 0.57, note: 60, gain: 0.3 },
    { atSec: 1.74, durSec: 1.72, note: 43, gain: 0.36 },
    { atSec: 1.74, durSec: 1.15, note: 55, gain: 0.3 },
    { atSec: 2.32, durSec: 1.73, note: 74, gain: 0.36 },
    { atSec: 2.9, durSec: 0.57, note: 59, gain: 0.3 },
    { atSec: 3.48, durSec: 1.72, note: 41, gain: 0.36 },
    { atSec: 3.48, durSec: 1.15, note: 57, gain: 0.3 },
    { atSec: 4.06, durSec: 1.73, note: 72, gain: 0.36 },
    { atSec: 4.64, durSec: 0.57, note: 65, gain: 0.3 },
    { atSec: 5.22, durSec: 1.72, note: 36, gain: 0.36 },
    { atSec: 5.22, durSec: 1.15, note: 64, gain: 0.3 },
    { atSec: 5.8, durSec: 1.15, note: 69, gain: 0.36 },
    { atSec: 6.38, durSec: 0.57, note: 57, gain: 0.3 },
  ],
}

// Bars five to eight at half the pace: lines one, three and nine without the ground.
const SLOW_CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.15, note: 65, gain: 0.34 },
    { atSec: 0, durSec: 2.31, note: 69, gain: 0.32 },
    { atSec: 0, durSec: 0.57, note: 81, gain: 0.28 },
    { atSec: 0.58, durSec: 1.15, note: 77, gain: 0.28 },
    { atSec: 1.16, durSec: 1.15, note: 65, gain: 0.34 },
    { atSec: 1.74, durSec: 0.57, note: 84, gain: 0.28 },
    { atSec: 2.32, durSec: 1.15, note: 64, gain: 0.34 },
    { atSec: 2.32, durSec: 1.15, note: 67, gain: 0.32 },
    { atSec: 2.32, durSec: 1.15, note: 79, gain: 0.28 },
    { atSec: 3.48, durSec: 1.15, note: 60, gain: 0.34 },
    { atSec: 3.48, durSec: 1.15, note: 69, gain: 0.32 },
    { atSec: 3.48, durSec: 0.57, note: 84, gain: 0.28 },
    { atSec: 4.06, durSec: 1.15, note: 81, gain: 0.28 },
    { atSec: 4.64, durSec: 1.15, note: 69, gain: 0.34 },
    { atSec: 4.64, durSec: 1.15, note: 72, gain: 0.32 },
    { atSec: 5.22, durSec: 0.57, note: 72, gain: 0.28 },
    { atSec: 5.8, durSec: 1.15, note: 67, gain: 0.34 },
    { atSec: 5.8, durSec: 1.15, note: 71, gain: 0.32 },
    { atSec: 5.8, durSec: 1.15, note: 76, gain: 0.28 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String machine: the middle of the room, one register or one colour to each of the lines.
  {
    id: 'any-two-fit-tied-across-the-bar',
    name: 'Tied across the bar',
    category: 'pad',
    preview: TWO_WAYS_UP,
    description:
      'Violas at one pitch with no octaves added, slow to let go, their lows cut away, in a room of little over a second.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: {
        volume: -1,
        attack: 0.3,
        release: 1.6,
        tone: 1500,
        ensemble: 0.35,
        drift: 0.15,
        width: 0.35,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 170, presence: -3, highCut: 6000 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'any-two-fit-ground-in-tenths',
    name: 'Ground in tenths',
    category: 'pad',
    preview: TENTHS,
    description:
      'Low strings doubled an octave under the key, dark, with a soft front, sounding through a large wooden soundboard.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { volume: -3, attack: 0.22, release: 1.1, tone: 700, ensemble: 0.3, width: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { body: 5, size: 2, mix: 0.45 } },
    ],
  },
  {
    id: 'any-two-fit-no-chorus-at-all',
    name: 'No chorus at all',
    category: 'organ',
    preview: HOCKET,
    description:
      'The string machine with its ensemble off and an instant attack, played through a small open-backed speaker in a dry room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -2.5, low: 0.3, high: 0.2, tone: 1500, release: 0.14 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.12, room: 0.2, distance: 0.15, noise: 0 },
      },
    ],
  },
  {
    id: 'any-two-fit-row-nearest-the-sky',
    name: 'Row nearest the sky',
    category: 'pad',
    preview: OTHER_WAY_UP,
    description:
      'Strings with the octave above as loud as the key, all under 600 hertz cut, lows and highs trading about once a second.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { volume: 1, attack: 0.35, release: 1.5, tone: 4200, ensemble: 0.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 1, cutoffHz: 600, resonance: 0.7 },
      },
      {
        deviceId: 'tremolo',
        preset: 'Harmonic shimmer',
        params: { rate: 1.1, depth: 0.4, crossover: 1800 },
      },
    ],
  },
  {
    id: 'any-two-fit-oo-in-the-tenor',
    name: 'Oo in the tenor',
    category: 'voice',
    preview: THREE_DOORS,
    description:
      'Muted upper strings pressed into a round vowel, so the middle line hums instead of bowing.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -1.5, attack: 0.4, release: 1.3, low: 0.25, high: 0.6, tone: 1800 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 1.2, replace: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16, decay: 1.4 } },
    ],
  },
  {
    id: 'any-two-fit-sawn-joint',
    name: 'Sawn joint',
    category: 'pad',
    preview: QUARTERS,
    description:
      'Plain sawtooths, quick and unchorused, darkened and given a tight spring tank with hardly any drip.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { volume: -4, attack: 0.03, release: 0.3, low: 0.15, high: 0.1, tone: 1900 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Narrow warm tank',
        params: { mix: 0.26, decay: 1.2, drip: 0.1 },
      },
    ],
  },
  {
    id: 'any-two-fit-eight-slow-bars',
    name: 'Eight slow bars',
    category: 'pad',
    preview: SLOW_HALF,
    description:
      'A very slow wide ensemble with a long attack, each band of it drifting from side to side on its own cycle.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { volume: -4, attack: 0.7, release: 2.2, tone: 1700 },
    },
    effects: [
      {
        deviceId: 'currents',
        preset: 'Gentle drift',
        params: { depth: 0.55, sway: 0.7, rate: 0.16 },
      },
    ],
  },
  {
    id: 'any-two-fit-thin-enough-to-cover',
    name: 'Thin enough to cover',
    category: 'pad',
    preview: SLOW_CLOSE,
    description:
      'Hollow strings moved well back across the room, their top dulled by the air, so a second line can stand in front.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { volume: -4.5, attack: 0.5, release: 1.4, tone: 2600, ensemble: 0.25 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Across the room',
        params: { distance: 0.6, room: 0.4, wander: 0, decay: 0.9, level: 0.9 },
      },
    ],
  },
  {
    id: 'any-two-fit-prepared-seventh',
    name: 'Prepared seventh',
    category: 'pad',
    preview: SLOW_HALF,
    description:
      'Cellos that swell late and leave late, every narrow band of them catching a slow tremolo of its own.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: {
        volume: -2,
        attack: 1,
        release: 2.6,
        low: 0.6,
        high: 0.3,
        tone: 1500,
        ensemble: 0.4,
      },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.8, rate: 2.2 } }],
  },
  {
    id: 'any-two-fit-three-octaves-at-table',
    name: 'Three octaves at table',
    category: 'pad',
    preview: TENTHS,
    description:
      'All three octaves of the strings with the ensemble off, hollowed by a slow comb that opens and closes, on a small plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: {
        volume: -3.5,
        attack: 0.1,
        release: 0.8,
        tone: 2600,
        low: 0.7,
        high: 0.9,
        ensemble: 0,
        drift: 0.1,
        width: 0.2,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2, decay: 0.45 } },
    ],
  },
  {
    id: 'any-two-fit-all-twelve-waver',
    name: 'All twelve waver',
    category: 'pad',
    preview: THREE_DOORS,
    description:
      'Bright detuned strings with the ensemble spinning at its fastest, heard as if inside a shell held to the ear.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: {
        volume: -9,
        attack: 0.25,
        release: 1.2,
        low: 0.1,
        high: 0.9,
        tone: 5000,
        width: 0.8,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.5 } }],
  },
  {
    id: 'any-two-fit-cellar-of-the-ground',
    name: 'Cellar of the ground',
    category: 'bass',
    preview: GROUND,
    description:
      'The bowed bass of the machine in mono, closed down to a hum and thickened by a transformer.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { attack: 0.05, release: 0.35, tone: 420, ensemble: 0 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.35 } }],
  },

  // Clarinet: the tenor and the bass of the band, every line of it single.
  {
    id: 'any-two-fit-bass-reed-one-pass',
    name: 'Bass reed, one pass',
    category: 'wind',
    preview: GROUND,
    description:
      'A bass clarinet that speaks at once and stops at once, through a warm stack of speakers in a dry room.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { volume: -6, attack: 0.07, release: 0.25, blow: 0.5, breath: 0.3 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { noise: 0, drive: 0.3, room: 0.1, output: -1 },
      },
    ],
  },
  {
    id: 'any-two-fit-quarters-inside',
    name: 'Quarters inside',
    category: 'wind',
    preview: QUARTERS,
    description:
      'A reed between clarinet and saxophone, blown softly with a short tongue, sounding inside a stopped pipe.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { volume: 1, bore: 0.35, attack: 0.03, release: 0.12, breath: 0.5, blow: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { body: 2, size: 1.3, mix: 0.6 } },
    ],
  },
  {
    id: 'any-two-fit-rests-upon-one',
    name: 'Rests upon one',
    category: 'wind',
    preview: OFFBEATS,
    description:
      'A breathy subtone reed with a soft front, copied a little sharp and a little flat to either side.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { volume: -0.5, attack: 0.09, release: 0.35, vibrato: 0.1 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        preset: 'Thickener',
        params: { mix: 0.45, width: 1, detune: 12 },
      },
    ],
  },
  {
    id: 'any-two-fit-clarinets-in-a-ring',
    name: 'Clarinets in a ring',
    category: 'wind',
    preview: HEMIOLA,
    description:
      'A hollow clarinet section turned into six players standing a few metres off, nearly still.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { volume: -0.5, attack: 0.12, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        preset: 'Straight ahead',
        params: { birds: 6, range: 5, speed: 0.15, mix: 0.6, spread: 0.9 },
      },
    ],
  },
  {
    id: 'any-two-fit-reed-after-dinner',
    name: 'Reed after dinner',
    category: 'wind',
    preview: HOCKET,
    description:
      'An alto-like reed with a wide vibrato, worn down by a cassette with its hiss turned off.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { volume: 2.5, release: 0.4, vibrato: 0.6 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { noise: 0, wobble: 0.3, drive: 0.4 },
      },
    ],
  },
  {
    id: 'any-two-fit-whole-bars-of-breath',
    name: 'Whole bars of breath',
    category: 'wind',
    preview: SLOW_CLOSE,
    description:
      'A reed at its quietest, more air than note, blurred at the front by a short fog with no tail.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.25, release: 0.9, breath: 0.8, blow: 0.12 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.8 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'any-two-fit-open-reed-answers',
    name: 'Open reed answers',
    category: 'wind',
    preview: HEMIOLA,
    description:
      'A clarinet blown open and bright, with one short dark echo a seventh of a second after it, like a second player.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { volume: 2.5, release: 0.15, vibrato: 0.15, blow: 0.85 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Slapback',
        params: { time: 145, feedback: 0.05, mix: 0.3, tone: 1800 },
      },
    ],
  },
  {
    id: 'any-two-fit-apricot-tenor',
    name: 'Apricot tenor',
    category: 'wind',
    preview: TIED,
    description:
      'A soft double-reed tenor whose vibrato grows only on notes that are held, with sympathetic strings in A minor behind it.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { volume: 0.5, attack: 0.12, release: 0.6, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Late vibrato',
        params: { wait: 250, grow: 500, depth: 18 },
      },
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 9, mode: 1, mix: 0.22, decay: 2 },
      },
    ],
  },
  {
    id: 'any-two-fit-last-to-leave-the-chord',
    name: 'Last to leave the chord',
    category: 'wind',
    preview: TINTIN,
    description:
      'A reed that starts plainly and takes over two seconds to fade, so each note leans on the next, inside a large clay pot.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { volume: -2, release: 2.4, blow: 0.45 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { size: 1.6, mix: 0.4 } }],
  },
  {
    id: 'any-two-fit-reed-from-the-hall-door',
    name: 'Reed from the hall door',
    category: 'wind',
    preview: SLOW_CLOSE,
    description:
      'A bright soprano reed swelled in by a volume pedal and heard from the far end of a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { volume: -1.5, blow: 0.5, release: 0.7, vibrato: 0.1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 260 } },
      {
        deviceId: 're-amp',
        preset: 'Far end of the hall',
        params: { room: 0.7, mix: 0.8, noise: 0 },
      },
    ],
  },

  // Flute: the treble, the lines that were tied and the ones that leave beat one to somebody else.
  {
    id: 'any-two-fit-e-held-over-g',
    name: 'E held over G',
    category: 'wind',
    preview: TIED,
    description:
      'A straight flute with no vibrato, its body made larger than a flute has, in a hall of a second and a half.',
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.12, release: 0.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.55 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { midDecay: 1.5, lowDecay: 1.5, mix: 0.25 },
      },
    ],
  },
  {
    id: 'any-two-fit-recorder-in-the-hedge',
    name: 'Recorder in the hedge',
    category: 'wind',
    preview: OFFBEATS,
    description:
      'A small soft recorder, each note clipped short, thrown off as a few skipping echoes that fade in a second.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.04, release: 0.1, chiff: 0.35, blow: 0.2 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 190, skips: 4, mix: 0.25 },
      },
    ],
  },
  {
    id: 'any-two-fit-one-flute-to-a-bar',
    name: 'One flute to a bar',
    category: 'wind',
    preview: TINTIN,
    description:
      'A low flute that takes a fifth of a second to fill each note, its top shaded off and its room close.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.22, release: 1.2, vibrato: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3500 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'any-two-fit-pipes-trading-beats',
    name: 'Pipes trading beats',
    category: 'wind',
    preview: HOCKET,
    description:
      'Panpipes with a hard puff at the front, swinging from side to side so the notes trade places.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { volume: -4.5, release: 0.2, breath: 0.35 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { mode: 1, rate: 0.6, depth: 0.7 } },
    ],
  },
  {
    id: 'any-two-fit-twos-laid-over-threes',
    name: 'Twos laid over threes',
    category: 'wind',
    preview: HEMIOLA,
    description:
      'A hard blown concert flute with a quick tongue, put on a mastering deck and tilted darker.',
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { blow: 0.8, vibrato: 0.25, release: 0.2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { tone: 0.2, drive: 0.4, hiss: 0 } },
    ],
  },
  {
    id: 'any-two-fit-wooden-upper-line',
    name: 'Wooden upper line',
    category: 'wind',
    preview: TIED,
    description:
      'A wood flute with a small scoop, sounding inside an open pipe that rings along with it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { scoop: 15, vibrato: 0.15, release: 0.4, breath: 0.15 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 0.6, mix: 0.45, air: 0.05 } },
    ],
  },
  {
    id: 'any-two-fit-air-between-voices',
    name: 'Air between voices',
    category: 'wind',
    preview: SLOW_CLOSE,
    description:
      'Nearly all breath: a low flute pad opened and closed by a slow cycle of breathing in and out.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { volume: -9.5, attack: 0.4, release: 1.6, blow: 0.25 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.6, out: 1.8, hold: 0.1, rest: 0.1, depth: 0.45 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'any-two-fit-bamboo-suspension',
    name: 'Bamboo suspension',
    category: 'wind',
    preview: TIED,
    description:
      'A bamboo flute bent up a little from below, its vibrato wide, through a rotary cabinet with the rotors stopped.',
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.08, release: 0.7, scoop: 70, chiff: 0.6, breath: 0.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Stopped horn', params: { drive: 0.1, mix: 0.8 } }],
  },
  {
    id: 'any-two-fit-whistle-on-the-landing',
    name: 'Whistle on the landing',
    category: 'wind',
    preview: OFFBEATS,
    description:
      'A soft wind lead redrawn as pure sines an octave up, the flute itself left quietly underneath.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { attack: 0.06, release: 0.5, scoop: 0, breath: 0.3 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { partials: 4, attack: 80, release: 0.8, mix: 0.6 },
      },
    ],
  },
  {
    id: 'any-two-fit-choir-of-pipes-behind',
    name: 'Choir of pipes behind',
    category: 'wind',
    preview: SLOW_CLOSE,
    description:
      'Hollow pipes used as a pad, a soft section of strings growing in behind them an octave lower.',
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.35, release: 1.2, breath: 0.4 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { rise: 0.4, fall: 1.2, mix: 0.45 },
      },
    ],
  },

  // Bow: the ground and the line above it, plucked, held by the sustainer or bowed.
  {
    id: 'any-two-fit-ground-for-one-cello',
    name: 'Ground for one cello',
    category: 'string',
    preview: GROUND,
    description:
      'One bowed string with a big body, quick on the bow, put through a warm console and no room at all.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { volume: -13, attack: 0.12, release: 0.35, brightness: 0.35, vibrato: 0.1 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 5 } }],
  },
  {
    id: 'any-two-fit-beat-two-left-out',
    name: 'Beat two left out',
    category: 'plucked',
    preview: BEAT_TWO_OUT,
    description:
      'A felted guitar string picked far from the bridge and stopped early, with a short spring behind it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { volume: -3.5, release: 0.3, brightness: 0.45, decay: 2.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } }],
  },
  {
    id: 'any-two-fit-bow-on-the-fingerboard',
    name: 'Bow on the fingerboard',
    category: 'string',
    preview: TIED,
    description:
      'A soft flautando bow with almost no pressure, its air spread wide and its attacks smoothed away.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { volume: -4, attack: 0.3, release: 0.9 },
    },
    effects: [{ deviceId: 'sift', preset: 'Breath and tone', params: { hold: 0.2 } }],
  },
  {
    id: 'any-two-fit-viol-keeps-the-repeat',
    name: 'Viol keeps the repeat',
    category: 'string',
    preview: TWO_WAYS_UP,
    description:
      'A glassy bow near the bridge with a slow edge, its lows cut so that it lies above whatever is under it.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { volume: -4.5, attack: 0.3, release: 1.1, detune: 3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { type: 1, cutoffHz: 320 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22, decay: 0.5 } },
    ],
  },
  {
    id: 'any-two-fit-tenor-without-a-bow',
    name: 'Tenor without a bow',
    category: 'string',
    preview: QUARTERS,
    description:
      'A string held singing by its sustainer, rounded off by a stack speaker turned away in a dry room.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.06, release: 0.25, brightness: 0.4, vibrato: 0.15 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Dark and woolly',
        params: { room: 0.15, noise: 0, output: -2 },
      },
    ],
  },
  {
    id: 'any-two-fit-gut-and-breadcrust',
    name: 'Gut and breadcrust',
    category: 'plucked',
    preview: QUARTERS,
    description:
      'A damped pluck, nearly all body and hardly any ring, squeezed by a fast limiter until the knock comes forward.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.2, decay: 1.6, body: 0.9 },
    },
    effects: [{ deviceId: 'fet-limiter', preset: 'Squash' }],
  },
  {
    id: 'any-two-fit-swell-into-the-sixth',
    name: 'Swell into the sixth',
    category: 'string',
    preview: SLOW_CLOSE,
    description:
      'Plucked strings with the pluck faded out, so every note arrives by swelling, then sways once it is held.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: -1, attack: 0.45, release: 1.4, detune: 4 },
    },
    effects: [{ deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 400, depth: 16 } }],
  },
  {
    id: 'any-two-fit-wire-under-the-window',
    name: 'Wire under the window',
    category: 'plucked',
    preview: BEAT_TWO_OUT,
    description:
      'A wire harp string picked bright and left to ring, worn down to a kitchen radio with the static off.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -1.5, release: 1.6, decay: 7 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0, mix: 0.75 } }],
  },
  {
    id: 'any-two-fit-sections-agree-slowly',
    name: 'Sections agree slowly',
    category: 'string',
    preview: SLOW_HALF,
    description:
      'A detuned bowed section with its slow vibrato eased, made to sing a wordless ah in a small chapel.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.5, release: 1.4, vibrato: 0.3, detune: 14 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { vowel: 0, mix: 0.35 } }],
  },
  {
    id: 'any-two-fit-twelfth-hanging',
    name: 'Twelfth hanging',
    category: 'string',
    preview: SLOW_HALF,
    description:
      'A sustained string that glows on its upper partials, every band of them lapping from side to side.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.35, release: 1.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples', params: { depth: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
    ],
  },

  // Reed organ: the registrations of one small instrument, a stop to each line.
  {
    id: 'any-two-fit-pedal-ground',
    name: 'Pedal ground',
    category: 'organ',
    preview: GROUND,
    description:
      'One flute rank with a little of the sub under it, closed and even, its low octave thickened by a sub voice.',
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        sub: 0.4,
        celeste: 0,
        attack: 0.08,
        release: 0.3,
        bellows: 0.05,
        reed: 0.05,
        tone: 900,
      },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.45, filter: 700 } }],
  },
  {
    id: 'any-two-fit-one-rank-each',
    name: 'One rank each',
    category: 'organ',
    preview: OTHER_WAY_UP,
    description:
      'Plain flutes with a little of the octave above and below, no celeste and no wind, in a room no bigger than a booth.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.15, octave: 0.3, breath: 0, attack: 0.03, release: 0.2 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } }],
  },
  {
    id: 'any-two-fit-kitchen-harmonium',
    name: 'Kitchen harmonium',
    category: 'organ',
    preview: TENTHS,
    description:
      'A pump organ with the bellows working hard and the reeds forward, recorded on a worn thin tape.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { attack: 0.06, release: 0.2, celeste: 0.05 },
    },
    effects: [{ deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0 } }],
  },
  {
    id: 'any-two-fit-beats-on-the-landing',
    name: 'Beats on the landing',
    category: 'organ',
    preview: TWO_WAYS_UP,
    description:
      'The beating celeste alone, two flutes slightly apart, sounded through a glass tube with a thin ring.',
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.18, release: 0.6 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.4 } }],
  },
  {
    id: 'any-two-fit-nasal-alto-trembling',
    name: 'Nasal alto, trembling',
    category: 'organ',
    preview: HOCKET,
    description:
      'A nasal reed rank trembling, pressed into an open vowel and moved a few steps back.',
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { volume: -2, tremulant: 0.5, attack: 0.06, release: 0.3, tone: 2400 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.9 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'any-two-fit-squeezebox-second',
    name: 'Squeezebox second',
    category: 'organ',
    preview: HEMIOLA,
    description:
      'Accordion reeds with a short touch, turning slowly in a mono speaker cabinet with a little drive.',
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { bellows: 0.3, release: 0.1, tone: 4200 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Mono cabinet', params: { drive: 0.3 } }],
  },
  {
    id: 'any-two-fit-organ-behind-plaster',
    name: 'Organ behind plaster',
    category: 'organ',
    preview: THREE_DOORS,
    description:
      'All the ranks heard through a wall, their quiet upper tones drawn forward again by level.',
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { attack: 0.1, release: 0.5, tone: 520 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.6 } }],
  },
  {
    id: 'any-two-fit-windy-upper-part',
    name: 'Windy upper part',
    category: 'organ',
    preview: TIED,
    description:
      'Mostly wind in a flute pipe with a trace of the octave, lifted by a limiter and blurred slightly at the front.',
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { attack: 0.15, release: 0.5, octave: 0.12, bellows: 0.2, tone: 4500 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'any-two-fit-box-under-the-fiddles',
    name: 'Box under the fiddles',
    category: 'organ',
    preview: SLOW_HALF,
    description:
      'A slow reed box breathing on its bellows, with a faint set of pipes sounding along at the key and an octave above.',
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.35, release: 0.9, bellows: 0.8 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry', params: { octave: 0.7, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'any-two-fit-registration-for-last',
    name: 'Registration for last',
    category: 'organ',
    preview: TENTHS,
    description:
      'The full small organ with nearly every rank out, quick to speak, in a hall of two seconds.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { attack: 0.03, release: 0.35, tone: 5000, twelfth: 0.15 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 1.8, midDecay: 2, mix: 0.25 },
      },
    ],
  },

  // Afterglow: struck first and held after, so a line carries its own harmony along.
  {
    id: 'any-two-fit-hammer-then-hum',
    name: 'Hammer then hum',
    category: 'keys',
    preview: QUARTERS,
    description:
      'A dark felt strike with a short hum after it, no halo, its stereo drawn in close to the middle.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { volume: -4, decay: 1.2, bloom: 0.6, fade: 1.2, glow: 0.45, tone: 0.3 },
    },
    effects: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
  },
  {
    id: 'any-two-fit-bell-for-the-tonic',
    name: 'Bell for the tonic',
    category: 'bell',
    preview: TINTIN,
    description:
      'Struck bells with a small halo, each followed by a scatter of faint points across the stereo.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: -3.5, decay: 3, bloom: 1, fade: 2.5, halo: 0.3 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points', params: { span: 1200, mix: 0.22 } },
    ],
  },
  {
    id: 'any-two-fit-only-the-strike-agrees',
    name: 'Only the strike agrees',
    category: 'keys',
    preview: QUARTERS,
    description:
      'The strike of a pluck with no glow behind it, hard and short, on a clean and bright speaker.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the strike',
      params: { volume: -2.5, source: 2, decay: 1.4, tone: 0.7, strike: 1 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Clean and bright',
        params: { treble: 0.5, room: 0.2, noise: 0 },
      },
    ],
  },
  {
    id: 'any-two-fit-glow-that-was-tied',
    name: 'Glow that was tied',
    category: 'pad',
    preview: TWO_WAYS_UP,
    description:
      'No strike at all: the overtones of each key rise and fade, warmed by a tape that barely wanders.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.4, fade: 1.5, evolve: 0.3, tone: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0, wow: 0.15, drive: 0.4 } },
    ],
  },
  {
    id: 'any-two-fit-glass-for-hemiola',
    name: 'Glass for hemiola',
    category: 'bell',
    preview: HEMIOLA,
    description:
      'Tapped glass that stays perfectly still, its partials stiffened and stretched into a soft chime.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { decay: 2, fade: 1.6, bloom: 0.5, strike: 0.8 },
    },
    effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.5, drift: 0 } }],
  },
  {
    id: 'any-two-fit-pluck-second-thought',
    name: 'Pluck, second thought',
    category: 'plucked',
    preview: HOCKET,
    description:
      'A pluck whose haze comes up quickly behind it, with a single slap from a tape head a tenth of a second on.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { decay: 1.5, fade: 1.4, bloom: 0.4, glow: 0.55 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { time: 110, mix: 0.35 } }],
  },
  {
    id: 'any-two-fit-two-doors-left-open',
    name: 'Two doors left open',
    category: 'pad',
    preview: SLOW_HALF,
    description:
      'A light strike and a restless glow, wide and always changing, gently held level by a slow compressor.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Restless light',
      params: { volume: -7, bloom: 0.8, fade: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'phaser', preset: 'Faint shade' },
    ],
  },
  {
    id: 'any-two-fit-harp-turns-to-air',
    name: 'Harp turns to air',
    category: 'plucked',
    preview: THREE_DOORS,
    description:
      'A soft pluck that rises into its own overtones, thinned below 150 hertz and above three and a half thousand.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: { bloom: 1.2, fade: 2.5, halo: 0.5, tone: 0.55 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 150 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2, midDecay: 2 } },
    ],
  },

  // Aurora: the two-channel pad, kept short enough to be one voice among others.
  {
    id: 'any-two-fit-horns-for-the-tenths',
    name: 'Horns for the tenths',
    category: 'wind',
    preview: TENTHS,
    description:
      'Soft synth horns with a quick lip and a short release, rounded off above three kilohertz.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.12, release: 0.6, swell: 0.2 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 3000 } }],
  },
  {
    id: 'any-two-fit-short-brass-ground',
    name: 'Short brass ground',
    category: 'bass',
    preview: GROUND,
    description:
      'Short brass on a hard filter envelope, weighted by a driven transformer, over as soon as the key is up.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { brilliance: 450, release: 0.25, lowCut: 20 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6, lowBump: 0.2 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'any-two-fit-still-pipes-paired',
    name: 'Still pipes, paired',
    category: 'organ',
    preview: OTHER_WAY_UP,
    description:
      'Steady pipes with no detune, no swell and no contour, given a light double a few milliseconds late.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 0.5, brilliance: 1900 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'any-two-fit-muted-for-the-upper-desk',
    name: 'Muted for the upper desk',
    category: 'wind',
    preview: TIED,
    description:
      'A muted trumpet colour, thin and a little resonant, pressed into the tone of a hollow tube.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { volume: 0.5, resonance: 0.55, attack: 0.08, release: 0.6 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'any-two-fit-loose-reeds-in-three',
    name: 'Loose reeds in three',
    category: 'pad',
    preview: HOCKET,
    description:
      'Two layers far out of tune with each other, reedy, pulsing gently three or four times a second.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { volume: 0, attack: 0.05, release: 0.4 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.45, depth: 0.45 } }],
  },
  {
    id: 'any-two-fit-silver-over-everything',
    name: 'Silver over everything',
    category: 'pad',
    preview: SLOW_CLOSE,
    description:
      'Thin silver strings with everything low removed, the top opened wide and the middle left alone.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.5, release: 1.8, swell: 0.3 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'glimmer', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'any-two-fit-bloom-contrary-motion',
    name: 'Bloom, contrary motion',
    category: 'pad',
    preview: SLOW_HALF,
    description:
      'A dark brass that blooms as it is held, a slow ripple rising through its narrow bands.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { volume: -3, attack: 0.6, release: 1.8, brilliance: 1000 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.7 } }],
  },

  // Feedback: a string in the air before its amplifier, for the lines that have to hold on.
  {
    id: 'any-two-fit-string-holds-the-seventh',
    name: 'String holds the seventh',
    category: 'string',
    preview: TIED,
    description:
      'A plucked string caught by its amplifier on its own pitch, dark and steady, with no grit left in it.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { release: 0.5, grit: 0, bloom: 0.2 },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Pluck tamer' }],
  },
  {
    id: 'any-two-fit-plucked-and-let-go',
    name: 'Plucked and let go',
    category: 'plucked',
    preview: BEAT_TWO_OUT,
    description:
      'An amplified string too quiet to feed back, so it is plucked and dies, its attack pushed out in front.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Plucked and gone',
      params: { volume: 2, release: 0.5, damp: 0.35 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strikes forward' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15, decay: 1.2 } },
    ],
  },
  {
    id: 'any-two-fit-reed-made-of-wire',
    name: 'Reed made of wire',
    category: 'wind',
    preview: QUARTERS,
    description:
      'A string that speaks like a reed, gritty and immediate, its top closed by a steep low-pass at 1.6 kilohertz.',
    instrument: { deviceId: 'feedback', preset: 'Reed tone', params: { release: 0.2 } },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 1600, resonance: 0.8 },
      },
    ],
  },
  {
    id: 'any-two-fit-octave-in-the-air',
    name: 'Octave in the air',
    category: 'string',
    preview: TIED,
    description:
      'No pick: each key hums up on the octave, pure and slow to leave, in a room of about a second.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Glass bow',
      params: { distance: 2, bloom: 0.35, release: 1.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'any-two-fit-wide-amp-narrow-line',
    name: 'Wide amp, narrow line',
    category: 'string',
    preview: TWO_WAYS_UP,
    description:
      'A grainy open amplifier with every note free of the others and a light chorused echo a third of a second behind.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Open amp',
      params: { volume: -10, release: 0.7, bloom: 0.25 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 290, feedback: 0.15, mix: 0.22 },
      },
    ],
  },
  {
    id: 'any-two-fit-drifting-cantus',
    name: 'Drifting cantus',
    category: 'string',
    preview: SLOW_CLOSE,
    description:
      'A string that wanders between overtones and lets its notes crowd each other, seen through a little shallow water.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Drifting air',
      params: { volume: -3.5, distance: 2, bloom: 0.6, wander: 0.4, release: 1.8 },
    },
    effects: [{ deviceId: 'underwater', preset: 'A toe in' }],
  },
  {
    id: 'any-two-fit-ground-from-the-hum',
    name: 'Ground from the hum',
    category: 'bass',
    preview: GROUND,
    description:
      'Each note picked faintly and hummed up at its own pitch by the amplifier, through warm tape, with a lot of low end added.',
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: { volume: -19.5, bloom: 0.12, release: 0.3, pick: 0.25, damp: 0.6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },

  // Chamber strings: few players, short bows, the written parts.
  {
    id: 'any-two-fit-desk-of-two',
    name: 'Desk of two',
    category: 'string',
    preview: HEMIOLA,
    description:
      'Two players with light bows and mutes half on, set wide apart, in a faint veil of a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -0.5, attack: 0.12, release: 0.4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.16 } }],
  },
  {
    id: 'any-two-fit-consort-no-vibrato',
    name: 'Consort, no vibrato',
    category: 'string',
    preview: THREE_DOORS,
    description:
      'A viol consort, four muted players perfectly together, sounding through a large wooden soundboard more than from the bow.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { volume: -4, attack: 0.12, release: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.6, mix: 0.9 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'any-two-fit-bows-on-two-and-three',
    name: 'Bows on two and three',
    category: 'string',
    preview: OFFBEATS,
    description:
      'Short bows with the mutes half on, each answered twice from the sides, off the pulse, within half a second.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: 2, release: 0.15, mute: 0.6 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Wide pair',
        params: { span: 435, again: 0.1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'any-two-fit-air-of-six-players',
    name: 'Air of six players',
    category: 'string',
    preview: SLOW_HALF,
    description:
      'Six slow bows, more air than tone, swung gently from near to far as if the desks were leaning.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -3, players: 6, attack: 0.5, release: 1.4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Breathing', params: { distance: 0.25, wander: 0.4 } },
      { deviceId: 'lift', preset: 'Slightly closer' },
    ],
  },
  {
    id: 'any-two-fit-one-viola-reads-ahead',
    name: 'One viola reads ahead',
    category: 'string',
    preview: TIED,
    description:
      'One player close up with a warm vibrato, darkened to the colour of a box, in a tight chamber.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -1, attack: 0.1, release: 0.35 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box', params: { amount: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'any-two-fit-ragged-tutti-softly',
    name: 'Ragged tutti, softly',
    category: 'string',
    preview: TENTHS,
    description:
      'Six fully muted players who never quite agree on the pitch, airy and spread wide, with a fluttering tape copy on top.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { volume: -4.5, attack: 0.25, release: 0.5, mute: 1, bow: 0.05, air: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { hiss: 0 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },

  // Harp: the plucked lines, from the soundboard to the middle of the string.
  {
    id: 'any-two-fit-ground-in-the-left-hand',
    name: 'Ground in the left hand',
    category: 'plucked',
    preview: BEAT_TWO_OUT,
    description:
      'A dark hollow harp played at the middle of the string, its halo small, weighted by a little low warmth.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 0.9, damp: 0.2, halo: 0.15 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.4 } }],
  },
  {
    id: 'any-two-fit-fingers-near-the-wood',
    name: 'Fingers near the wood',
    category: 'plucked',
    preview: HOCKET,
    description:
      'A harp plucked by the soundboard and lightly damped, glazed by an early converter and pushed forward by a limiter.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: -1, decay: 0.8, damp: 0.2, halo: 0.2, touch: 0.5, body: 0.7 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 20, outputGain: -7 } },
    ],
  },
  {
    id: 'any-two-fit-silk-for-the-inner-part',
    name: 'Silk for the inner part',
    category: 'plucked',
    preview: QUARTERS,
    description:
      'Silk koto strings with the press bend taken off, soft, in a brief ring of sympathetic A minor strings.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 3.5, bend: 0, halo: 0.3, damp: 0.3 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { root: 9, mode: 1, mix: 0.3 } },
    ],
  },
  {
    id: 'any-two-fit-koto-lets-one-go-by',
    name: 'Koto lets one go by',
    category: 'plucked',
    preview: OFFBEATS,
    description:
      'A koto touched softly and left nearly undamped, its notes skipping twice across the room, the whole lifted by a limiter.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: -3, touch: 0.35, pluck: 0.16, damp: 0.1, decay: 1.8, halo: 0.6 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Two skips', params: { mix: 0.28 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 26, outputGain: -9 } },
    ],
  },
  {
    id: 'any-two-fit-harp-between-the-desks',
    name: 'Harp between the desks',
    category: 'plucked',
    preview: OTHER_WAY_UP,
    description:
      'A concert harp with its sympathetic ring opened up, its attacks taken off so only the strings sing.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { volume: 0.5, decay: 1.4, halo: 0.7 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 160 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'any-two-fit-steel-for-the-last-line',
    name: 'Steel for the last line',
    category: 'plucked',
    preview: TINTIN,
    description:
      'Guzheng steel rung long and bright, boxed into an old record with the dust cleaned off.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 4.5, decay: 2, touch: 0.5 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Parlour 78',
        params: { crackle: 0, pops: 0, surface: 0.05, warp: 0.15 },
      },
    ],
  },

  // Chord harp: whole bars of the ground at once, the twelve lines heard as their harmony.
  {
    id: 'any-two-fit-eight-chords-once',
    name: 'Eight chords once',
    category: 'plucked',
    preview: TENTHS,
    description:
      'Each chord swept upward over two octaves of soft strings with a thread of pad under it, quickly over.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: -1.5, span: 1, strum: 22, sustain: 1.1, pad: 0.2 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.15 } }],
  },
  {
    id: 'any-two-fit-chords-with-no-strum',
    name: 'Chords with no strum',
    category: 'keys',
    preview: TENTHS,
    description:
      'The strings of each chord struck all at once with no pad, short and chiming, trembling a little in pitch.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: 0, span: 0, sustain: 1.4, tone: 0.75 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Fast flutter', params: { mix: 0.35 } }],
  },
  {
    id: 'any-two-fit-soft-chord-underneath',
    name: 'Soft chord underneath',
    category: 'pad',
    preview: SLOW_HALF,
    description:
      'The pad alone, round and close, its plucks nearly gone, set back on a dark plate.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { volume: -12, span: 0, sustain: 0.3, tone: 0.3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3, decay: 0.5 } },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'any-two-fit-toy-chaconne',
    name: 'Toy chaconne',
    category: 'plucked',
    preview: TENTHS,
    description:
      'A toy harp swept downward in a flash, bright and short, through an early sampler with few bits.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { volume: 5.5, span: 0, sustain: 0.8 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Toy', params: { drive: 0, mix: 0.8 } }],
  },
  {
    id: 'any-two-fit-slow-hand-over-eight',
    name: 'Slow hand over eight',
    category: 'plucked',
    preview: SLOW_CLOSE,
    description:
      'A muffled strum drawn slowly over two octaves, warm and dull, softened again by a wool-thick blur.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { strum: 70, sustain: 2.2, tone: 0.15 },
    },
    effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { size: 120, mix: 0.6 } }],
  },
  {
    id: 'any-two-fit-glints-off-the-tenor',
    name: 'Glints off the tenor',
    category: 'plucked',
    preview: TWO_WAYS_UP,
    description:
      'Scattered bright strings over three octaves in no set order, their colours fanned out low to high.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { volume: -5, pad: 0.2, sustain: 1.2, strum: 45 },
    },
    effects: [{ deviceId: 'prism', preset: 'Short chirp', params: { mix: 0.35 } }],
  },

  // Felt piano: the hand that finds which two lines to play.
  {
    id: 'any-two-fit-two-lines-two-hands',
    name: 'Two lines, two hands',
    category: 'keys',
    preview: TWO_WAYS_UP,
    description:
      'A bare piano with its own small room, levelled for even counterpoint, no pedal and no felt.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -9, hardness: 0.5, resonance: 0.2, reverbMix: 0.1 },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Keys' }],
  },
  {
    id: 'any-two-fit-quarters-under-felt',
    name: 'Quarters under felt',
    category: 'keys',
    preview: QUARTERS,
    description:
      'A thick felt and a soft hammer, all thump and middle, narrowed and shaded for lying under other lines.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.7, hardness: 0.12, reverbMix: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2600 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'any-two-fit-upright-by-the-larder',
    name: 'Upright by the larder',
    category: 'keys',
    preview: HOCKET,
    description:
      'An old upright with hard hammers and its strings apart, played from a speaker in a cupboard, on a warped record.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -9.5, grit: 0.2, hardness: 0.8, reverbMix: 0.05 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0 } },
      { deviceId: 'vinyl', preset: 'Warp chorus' },
    ],
  },
  {
    id: 'any-two-fit-piano-a-c-e',
    name: 'Piano, A C E',
    category: 'bell',
    preview: TINTIN,
    description:
      'A glassy hard-hammered piano, its own room swapped for a small hall, its partials pulled toward those of a stiff bar.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -3.5, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.25, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'any-two-fit-keys-ringing-over-g',
    name: 'Keys ringing over G',
    category: 'keys',
    preview: THREE_DOORS,
    description:
      'Half pedal, so the bars run softly into each other, with the quiet ends of the notes drawn up.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { outputDb: -17, felt: 0.3, reverbMix: 0.05 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Just the ends', params: { limit: 12 } },
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { mix: 0.2 } },
    ],
  },

  // Rewind: the same notes coming to meet their own beat.
  {
    id: 'any-two-fit-next-bar-arrives-first',
    name: 'Next bar arrives first',
    category: 'keys',
    preview: SLOW_HALF,
    description:
      'A piano note turned round, its swell half a second long, so each bar is drawn in before it lands.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Soft return',
      params: { volume: 2, swell: 0.5, tail: 0.5, ghost: 0.1 },
    },
    effects: [{ deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0 } }],
  },
  {
    id: 'any-two-fit-backward-pluck',
    name: 'Backward pluck',
    category: 'plucked',
    preview: HOCKET,
    description:
      'Short reversed plucks that shut dead on the beat, ringing on faintly from a mono slap of room.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: 4.5, swell: 0.2, tail: 0.1 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Mono slap', params: { mix: 0.35 } }],
  },
  {
    id: 'any-two-fit-bell-meets-its-strike',
    name: 'Bell meets its strike',
    category: 'bell',
    preview: SLOW_CLOSE,
    description:
      'A reversed bell that gathers for almost half a second and then rings on forwards, bright, over a short plate.',
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 6, swell: 0.45, tail: 0.8, shimmer: 0.1 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22, decay: 0.45 } },
    ],
  },
]
