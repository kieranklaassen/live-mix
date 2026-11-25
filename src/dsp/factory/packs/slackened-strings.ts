import { type FactoryPreset, type Phrase } from '../types'

// Five open tunings of the Hawaiian slack-key guitar, each moved until its strings are white keys:
// taro patch (G C G C E G), wahine (G C G B E G), Mauna Loa (C G E G A E), F wahine (F C E G C E)
// and C wahine (C G D G B D). Each of four stringed instruments plays every tuning with five hands:
// a thumb, a nail, a bar, a brush and a fingertip that touches out the chimes.

// Taro patch: thumb below, sixths above (C, G7, C) with the open E hammered on to F, then the turnaround
// D7, G7, C: inside it G falls by F sharp and F to E, above it D, C, B and home to C.
const TARO_SIXTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.64, note: 48, gain: 0.7 },
    { atSec: 0, durSec: 0.92, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 0.96, note: 72, gain: 0.73 },
    { atSec: 0.68, durSec: 0.64, note: 55, gain: 0.5 },
    { atSec: 0.95, durSec: 0.06, note: 64, gain: 0.31 },
    { atSec: 1.02, durSec: 0.98, note: 65, gain: 0.53 },
    { atSec: 1.02, durSec: 0.98, note: 74, gain: 0.73 },
    { atSec: 1.36, durSec: 0.64, note: 43, gain: 0.7 },
    { atSec: 2.04, durSec: 0.64, note: 48, gain: 0.64 },
    { atSec: 2.04, durSec: 0.64, note: 67, gain: 0.53 },
    { atSec: 2.04, durSec: 0.64, note: 76, gain: 0.76 },
    { atSec: 2.72, durSec: 0.64, note: 50, gain: 0.7 },
    { atSec: 2.72, durSec: 1.3, note: 66, gain: 0.53 },
    { atSec: 2.72, durSec: 0.64, note: 74, gain: 0.7 },
    { atSec: 3.4, durSec: 0.64, note: 57, gain: 0.5 },
    { atSec: 3.4, durSec: 0.64, note: 72, gain: 0.64 },
    { atSec: 4.08, durSec: 0.64, note: 43, gain: 0.7 },
    { atSec: 4.08, durSec: 1.3, note: 65, gain: 0.53 },
    { atSec: 4.08, durSec: 0.64, note: 71, gain: 0.7 },
    { atSec: 4.76, durSec: 0.64, note: 50, gain: 0.5 },
    { atSec: 4.76, durSec: 0.64, note: 71, gain: 0.58 },
    { atSec: 5.44, durSec: 1.1, note: 48, gain: 0.7 },
    { atSec: 5.44, durSec: 1.1, note: 64, gain: 0.53 },
    { atSec: 5.44, durSec: 1.1, note: 72, gain: 0.7 },
    { atSec: 6, durSec: 0.54, note: 67, gain: 0.42 },
  ],
}

// Taro patch under a bar: the open strings, the fifth fret, the seventh, open again: C, F, G, C.
const BAR_CHORDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.42, note: 48, gain: 0.64 },
    { atSec: 0, durSec: 1.42, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 1.42, note: 64, gain: 0.53 },
    { atSec: 0, durSec: 1.42, note: 67, gain: 0.64 },
    { atSec: 1.5, durSec: 1.42, note: 53, gain: 0.64 },
    { atSec: 1.5, durSec: 1.42, note: 65, gain: 0.5 },
    { atSec: 1.5, durSec: 1.42, note: 69, gain: 0.53 },
    { atSec: 1.5, durSec: 1.42, note: 72, gain: 0.64 },
    { atSec: 3, durSec: 1.42, note: 55, gain: 0.67 },
    { atSec: 3, durSec: 1.42, note: 67, gain: 0.53 },
    { atSec: 3, durSec: 1.42, note: 71, gain: 0.56 },
    { atSec: 3, durSec: 1.42, note: 74, gain: 0.67 },
    { atSec: 4.5, durSec: 2, note: 48, gain: 0.64 },
    { atSec: 4.5, durSec: 2, note: 60, gain: 0.48 },
    { atSec: 4.5, durSec: 2, note: 64, gain: 0.5 },
    { atSec: 4.5, durSec: 2, note: 67, gain: 0.62 },
  ],
}

// Taro patch touched at its nodes: twelfth-fret chimes over C, seventh-fret ones (G, B, D) over G.
const TARO_CHIMES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 48, gain: 0.59 },
    { atSec: 0.4, durSec: 2.6, note: 67, gain: 0.56 },
    { atSec: 0.8, durSec: 2.4, note: 72, gain: 0.62 },
    { atSec: 1.2, durSec: 2.2, note: 76, gain: 0.64 },
    { atSec: 1.6, durSec: 2, note: 79, gain: 0.7 },
    { atSec: 2.6, durSec: 0.9, note: 76, gain: 0.5 },
    { atSec: 3.5, durSec: 1.2, note: 43, gain: 0.62 },
    { atSec: 3.7, durSec: 1.1, note: 79, gain: 0.56 },
    { atSec: 3.95, durSec: 1, note: 83, gain: 0.59 },
    { atSec: 4.2, durSec: 0.9, note: 86, gain: 0.64 },
    { atSec: 4.9, durSec: 1.8, note: 48, gain: 0.59 },
    { atSec: 5.1, durSec: 1.6, note: 76, gain: 0.5 },
    { atSec: 5.3, durSec: 1.4, note: 84, gain: 0.56 },
  ],
}

// Wahine: the open B hammered on to C, G7 between, and the C let back to B so that Cmaj7 lies open.
const WAHINE_HAMMER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 48, gain: 0.73 },
    { atSec: 0.375, durSec: 1.6, note: 55, gain: 0.5 },
    { atSec: 0.75, durSec: 1.3, note: 64, gain: 0.62 },
    { atSec: 0.75, durSec: 0.15, note: 59, gain: 0.42 },
    { atSec: 0.87, durSec: 1.2, note: 60, gain: 0.59 },
    { atSec: 1.3, durSec: 0.8, note: 67, gain: 0.67 },
    { atSec: 2.25, durSec: 1.5, note: 43, gain: 0.73 },
    { atSec: 2.625, durSec: 1.1, note: 55, gain: 0.48 },
    { atSec: 3, durSec: 1, note: 62, gain: 0.5 },
    { atSec: 3, durSec: 1, note: 65, gain: 0.67 },
    { atSec: 3.45, durSec: 0.6, note: 59, gain: 0.48 },
    { atSec: 4.2, durSec: 2.2, note: 48, gain: 0.7 },
    { atSec: 4.5, durSec: 1.9, note: 55, gain: 0.48 },
    { atSec: 4.8, durSec: 1.6, note: 64, gain: 0.64 },
    { atSec: 4.8, durSec: 0.53, note: 60, gain: 0.53 },
    { atSec: 5.3, durSec: 1.3, note: 59, gain: 0.48 },
    { atSec: 5.7, durSec: 1, note: 67, gain: 0.53 },
  ],
}

// Wahine for a held voice: B leans up to C over C, A to B over G7, and home; each bend overlaps.
const WAHINE_LEAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 48, gain: 0.59 },
    { atSec: 0, durSec: 2.9, note: 55, gain: 0.42 },
    { atSec: 0, durSec: 2.9, note: 64, gain: 0.45 },
    { atSec: 0.4, durSec: 1.05, note: 71, gain: 0.7 },
    { atSec: 1.3, durSec: 1.6, note: 72, gain: 0.7 },
    { atSec: 3, durSec: 1.95, note: 43, gain: 0.59 },
    { atSec: 3, durSec: 1.95, note: 53, gain: 0.39 },
    { atSec: 3, durSec: 1.95, note: 62, gain: 0.45 },
    { atSec: 3, durSec: 0.85, note: 69, gain: 0.67 },
    { atSec: 3.7, durSec: 1.4, note: 71, gain: 0.7 },
    { atSec: 5, durSec: 2, note: 48, gain: 0.59 },
    { atSec: 5, durSec: 2, note: 55, gain: 0.42 },
    { atSec: 5, durSec: 2, note: 64, gain: 0.45 },
    { atSec: 5, durSec: 2, note: 72, gain: 0.67 },
  ],
}

// Wahine touched at its nodes: sixths of the twelfth fret (G E, B G, G E) over C, one of the seventh
// (D B) over G, then B, E and G of the twelfth over C: the open major seventh.
const WAHINE_CHIMES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 48, gain: 0.59 },
    { atSec: 0.6, durSec: 1.6, note: 67, gain: 0.55 },
    { atSec: 0.6, durSec: 1.6, note: 76, gain: 0.62 },
    { atSec: 1.5, durSec: 1.6, note: 71, gain: 0.56 },
    { atSec: 1.5, durSec: 1.6, note: 79, gain: 0.66 },
    { atSec: 2.4, durSec: 0.95, note: 67, gain: 0.5 },
    { atSec: 2.4, durSec: 0.95, note: 76, gain: 0.56 },
    { atSec: 3.4, durSec: 1.4, note: 43, gain: 0.62 },
    { atSec: 3.6, durSec: 1.1, note: 74, gain: 0.56 },
    { atSec: 3.6, durSec: 1.1, note: 83, gain: 0.64 },
    { atSec: 4.2, durSec: 0.6, note: 79, gain: 0.5 },
    { atSec: 4.9, durSec: 1.8, note: 48, gain: 0.59 },
    { atSec: 5.1, durSec: 1.5, note: 71, gain: 0.54 },
    { atSec: 5.3, durSec: 1.3, note: 76, gain: 0.56 },
    { atSec: 5.5, durSec: 1.1, note: 79, gain: 0.6 },
  ],
}

// Mauna Loa: C and G in the thumb, sixths falling by step to the open fifth A and E, then C6 rolled.
const MAUNA_SIXTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 36, gain: 0.7 },
    { atSec: 0, durSec: 1.05, note: 64, gain: 0.53 },
    { atSec: 0, durSec: 1.05, note: 72, gain: 0.73 },
    { atSec: 0.75, durSec: 0.7, note: 43, gain: 0.5 },
    { atSec: 1.125, durSec: 0.7, note: 62, gain: 0.5 },
    { atSec: 1.125, durSec: 0.7, note: 71, gain: 0.7 },
    { atSec: 1.5, durSec: 1.4, note: 36, gain: 0.64 },
    { atSec: 1.875, durSec: 1.05, note: 60, gain: 0.5 },
    { atSec: 1.875, durSec: 1.05, note: 69, gain: 0.7 },
    { atSec: 2.25, durSec: 0.7, note: 43, gain: 0.5 },
    { atSec: 3, durSec: 1.4, note: 36, gain: 0.67 },
    { atSec: 3, durSec: 0.7, note: 59, gain: 0.5 },
    { atSec: 3, durSec: 0.7, note: 67, gain: 0.67 },
    { atSec: 3.75, durSec: 0.7, note: 43, gain: 0.5 },
    { atSec: 3.75, durSec: 0.7, note: 57, gain: 0.5 },
    { atSec: 3.75, durSec: 0.7, note: 64, gain: 0.64 },
    { atSec: 4.5, durSec: 1.9, note: 36, gain: 0.7 },
    { atSec: 4.62, durSec: 1.8, note: 52, gain: 0.48 },
    { atSec: 4.74, durSec: 1.7, note: 55, gain: 0.48 },
    { atSec: 4.86, durSec: 1.6, note: 57, gain: 0.5 },
    { atSec: 4.98, durSec: 1.5, note: 64, gain: 0.62 },
  ],
}

// Mauna Loa brushed across all six strings: open, fifth fret, seventh fret, open: C6, F6, G6, C6.
const MAUNA_BRUSH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 36, gain: 0.59 },
    { atSec: 0.05, durSec: 1.35, note: 43, gain: 0.45 },
    { atSec: 0.1, durSec: 1.3, note: 52, gain: 0.45 },
    { atSec: 0.15, durSec: 1.25, note: 55, gain: 0.45 },
    { atSec: 0.2, durSec: 1.2, note: 57, gain: 0.48 },
    { atSec: 0.25, durSec: 1.15, note: 64, gain: 0.59 },
    { atSec: 1.5, durSec: 1.4, note: 41, gain: 0.59 },
    { atSec: 1.55, durSec: 1.35, note: 48, gain: 0.45 },
    { atSec: 1.6, durSec: 1.3, note: 57, gain: 0.45 },
    { atSec: 1.65, durSec: 1.25, note: 60, gain: 0.45 },
    { atSec: 1.7, durSec: 1.2, note: 62, gain: 0.48 },
    { atSec: 1.75, durSec: 1.15, note: 69, gain: 0.59 },
    { atSec: 3, durSec: 1.4, note: 43, gain: 0.62 },
    { atSec: 3.05, durSec: 1.35, note: 50, gain: 0.48 },
    { atSec: 3.1, durSec: 1.3, note: 59, gain: 0.48 },
    { atSec: 3.15, durSec: 1.25, note: 62, gain: 0.48 },
    { atSec: 3.2, durSec: 1.2, note: 64, gain: 0.5 },
    { atSec: 3.25, durSec: 1.15, note: 71, gain: 0.62 },
    { atSec: 4.5, durSec: 2, note: 36, gain: 0.59 },
    { atSec: 4.6, durSec: 1.9, note: 43, gain: 0.42 },
    { atSec: 4.7, durSec: 1.8, note: 52, gain: 0.42 },
    { atSec: 4.8, durSec: 1.7, note: 55, gain: 0.42 },
    { atSec: 4.9, durSec: 1.6, note: 57, gain: 0.45 },
    { atSec: 5, durSec: 1.5, note: 64, gain: 0.56 },
  ],
}

// Mauna Loa touched at its nodes: over C and G the twelfth fret of its top three strings (G, A, E), a second
// and an open fifth, then D and G of the third string over G, and A, E, G over C again.
const MAUNA_CHIMES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.3, note: 36, gain: 0.62 },
    { atSec: 0.5, durSec: 2.8, note: 43, gain: 0.46 },
    { atSec: 1, durSec: 2.2, note: 67, gain: 0.58 },
    { atSec: 1.4, durSec: 1.8, note: 69, gain: 0.6 },
    { atSec: 1.8, durSec: 1.6, note: 76, gain: 0.66 },
    { atSec: 2.7, durSec: 0.8, note: 69, gain: 0.48 },
    { atSec: 2.7, durSec: 0.8, note: 76, gain: 0.54 },
    { atSec: 3.6, durSec: 1.2, note: 43, gain: 0.62 },
    { atSec: 3.8, durSec: 1, note: 74, gain: 0.58 },
    { atSec: 4.1, durSec: 0.75, note: 79, gain: 0.6 },
    { atSec: 4.9, durSec: 1.7, note: 36, gain: 0.62 },
    { atSec: 5.1, durSec: 1.5, note: 43, gain: 0.45 },
    { atSec: 5.3, durSec: 1.3, note: 69, gain: 0.56 },
    { atSec: 5.5, durSec: 1.1, note: 76, gain: 0.6 },
    { atSec: 5.9, durSec: 0.75, note: 79, gain: 0.5 },
  ],
}

// F wahine: chimes of the twelfth fret (C, E) and the seventh (G) over a ringing F and C, then the open strings.
const F_CHIMES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 41, gain: 0.7 },
    { atSec: 0.5, durSec: 2.9, note: 48, gain: 0.45 },
    { atSec: 1, durSec: 2.4, note: 72, gain: 0.62 },
    { atSec: 1.5, durSec: 2, note: 76, gain: 0.67 },
    { atSec: 2.3, durSec: 1.6, note: 79, gain: 0.62 },
    { atSec: 3.5, durSec: 3, note: 41, gain: 0.67 },
    { atSec: 3.75, durSec: 2.8, note: 48, gain: 0.42 },
    { atSec: 4, durSec: 2.5, note: 52, gain: 0.45 },
    { atSec: 4.25, durSec: 2.2, note: 55, gain: 0.48 },
    { atSec: 4.5, durSec: 2, note: 60, gain: 0.5 },
    { atSec: 4.75, durSec: 1.8, note: 64, gain: 0.53 },
    { atSec: 5.3, durSec: 1.2, note: 72, gain: 0.48 },
    { atSec: 5.3, durSec: 1.2, note: 76, gain: 0.59 },
  ],
}

// F wahine: thumb on F and C; tenths walk up F A, G B, A C, then down G B over G, F A over D, home to A C over F.
const F_TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 41, gain: 0.7 },
    { atSec: 0.375, durSec: 1.05, note: 53, gain: 0.5 },
    { atSec: 0.375, durSec: 1.05, note: 69, gain: 0.7 },
    { atSec: 0.75, durSec: 0.7, note: 48, gain: 0.48 },
    { atSec: 1.5, durSec: 0.7, note: 41, gain: 0.64 },
    { atSec: 1.5, durSec: 0.7, note: 55, gain: 0.5 },
    { atSec: 1.5, durSec: 0.7, note: 71, gain: 0.67 },
    { atSec: 2.25, durSec: 0.7, note: 48, gain: 0.48 },
    { atSec: 2.25, durSec: 0.7, note: 57, gain: 0.5 },
    { atSec: 2.25, durSec: 0.7, note: 72, gain: 0.7 },
    { atSec: 3, durSec: 0.7, note: 43, gain: 0.7 },
    { atSec: 3, durSec: 0.7, note: 55, gain: 0.48 },
    { atSec: 3, durSec: 0.7, note: 71, gain: 0.67 },
    { atSec: 3.75, durSec: 0.7, note: 50, gain: 0.56 },
    { atSec: 3.75, durSec: 0.7, note: 53, gain: 0.48 },
    { atSec: 3.75, durSec: 0.7, note: 69, gain: 0.64 },
    { atSec: 4.5, durSec: 1.9, note: 41, gain: 0.7 },
    { atSec: 4.5, durSec: 1.9, note: 57, gain: 0.48 },
    { atSec: 4.5, durSec: 1.9, note: 72, gain: 0.64 },
    { atSec: 5.1, durSec: 1.3, note: 64, gain: 0.5 },
    { atSec: 5.4, durSec: 1, note: 67, gain: 0.53 },
  ],
}

// C wahine: the open strings have no third until D is hammered on to E; sixths B G, A F, G E between.
const C_WAHINE_LANDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 36, gain: 0.7 },
    { atSec: 0.22, durSec: 2.4, note: 43, gain: 0.48 },
    { atSec: 0.44, durSec: 2.2, note: 50, gain: 0.48 },
    { atSec: 0.66, durSec: 2, note: 55, gain: 0.5 },
    { atSec: 0.88, durSec: 1.8, note: 59, gain: 0.53 },
    { atSec: 1.1, durSec: 0.7, note: 62, gain: 0.62 },
    { atSec: 1.8, durSec: 0.15, note: 62, gain: 0.36 },
    { atSec: 1.92, durSec: 0.9, note: 64, gain: 0.64 },
    { atSec: 2.8, durSec: 0.9, note: 36, gain: 0.67 },
    { atSec: 3, durSec: 0.5, note: 59, gain: 0.5 },
    { atSec: 3, durSec: 0.5, note: 67, gain: 0.7 },
    { atSec: 3.5, durSec: 0.6, note: 43, gain: 0.48 },
    { atSec: 3.6, durSec: 0.55, note: 57, gain: 0.48 },
    { atSec: 3.6, durSec: 0.55, note: 65, gain: 0.67 },
    { atSec: 4.2, durSec: 0.6, note: 55, gain: 0.48 },
    { atSec: 4.2, durSec: 0.6, note: 64, gain: 0.64 },
    { atSec: 4.8, durSec: 1.9, note: 36, gain: 0.7 },
    { atSec: 4.95, durSec: 1.75, note: 43, gain: 0.48 },
    { atSec: 5.1, durSec: 1.6, note: 55, gain: 0.48 },
    { atSec: 5.25, durSec: 1.45, note: 59, gain: 0.5 },
    { atSec: 5.4, durSec: 0.15, note: 62, gain: 0.39 },
    { atSec: 5.52, durSec: 1.2, note: 64, gain: 0.62 },
  ],
}

// C wahine held: C and G below, twelfth-fret chimes of the three strings above them (G, B, D), and the
// two open Ds moving up to E one after the other, so the third lands late and twice.
const C_WAHINE_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 36, gain: 0.64 },
    { atSec: 0.3, durSec: 6.3, note: 43, gain: 0.5 },
    { atSec: 0.6, durSec: 2.2, note: 67, gain: 0.5 },
    { atSec: 1, durSec: 2.2, note: 71, gain: 0.52 },
    { atSec: 1.4, durSec: 2.2, note: 74, gain: 0.56 },
    { atSec: 1.6, durSec: 1.7, note: 50, gain: 0.5 },
    { atSec: 2.4, durSec: 2, note: 62, gain: 0.54 },
    { atSec: 3.2, durSec: 3.3, note: 52, gain: 0.5 },
    { atSec: 4.3, durSec: 2.2, note: 64, gain: 0.59 },
    { atSec: 4.9, durSec: 1.7, note: 71, gain: 0.48 },
    { atSec: 5.3, durSec: 1.3, note: 67, gain: 0.45 },
  ],
}

// One string under a bar, the E that taro patch and Mauna Loa share: open, fifth fret, third (E, A, G)
// over C, seventh and tenth (B, D) over G, home to the eighth (C). It slides where its notes overlap.
const BAR_SLIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 48, gain: 0.56 },
    { atSec: 0, durSec: 1.15, note: 64, gain: 0.7 },
    { atSec: 1, durSec: 1.2, note: 69, gain: 0.72 },
    { atSec: 2.1, durSec: 1, note: 67, gain: 0.68 },
    { atSec: 3, durSec: 1.5, note: 43, gain: 0.56 },
    { atSec: 3, durSec: 0.9, note: 71, gain: 0.7 },
    { atSec: 3.8, durSec: 0.9, note: 74, gain: 0.72 },
    { atSec: 4.6, durSec: 2.2, note: 48, gain: 0.56 },
    { atSec: 4.6, durSec: 2.2, note: 72, gain: 0.7 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Acoustic guitar. Taro patch: thumb, nail, bar, brush, chimes; then the same five in each tuning.
  {
    id: 'slackened-strings-taro-row-thumb',
    name: 'Taro row thumb',
    category: 'plucked',
    description:
      'A steel string under bare skin near the twelfth fret, short of release, its top taken down and its wood doubled by a soundboard.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { position: 0.39, tone: 0.2, sustain: 3, release: 0.5, strum: 0, volume: -4 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 5, size: 1.3, material: 0.3, air: 0, tone: 0.35, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-nail-on-open-c',
    name: 'Nail on open C',
    category: 'plucked',
    description:
      'A bright nail by the bridge, its edge held by a limiter, and eight strings tuned to C answering softly.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: {
        body: 0.45,
        nail: 0.75,
        sustain: 9,
        release: 2,
        strum: 0,
        shimmer: 0.15,
        volume: 0,
        position: 0.08,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 22, outputGain: -12 } },
      {
        deviceId: 'sympathetic',
        params: { root: 0, mode: 0, strings: 4, sympathy: 0.6, decay: 4, mix: 0.4, width: 0.9 },
      },
    ],
  },
  {
    id: 'slackened-strings-bottle-on-the-patch',
    name: 'Bottle on the patch',
    category: 'plucked',
    description:
      'Ringing steel strings that begin straight and sway wider the longer they are held, with one warm tape repeat.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: {
        position: 0.22,
        nail: 0.2,
        tone: 0.45,
        sustain: 11,
        release: 0.8,
        strum: 0,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 180, grow: 600, depth: 38, rate: 4.6, width: 0.5 },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 560, feedback: 0.15, wow: 0.4, highCut: 2600, mix: 0.3 },
      },
    ],
  },
  {
    id: 'slackened-strings-front-porch-brush',
    name: 'Front porch brush',
    category: 'plucked',
    description:
      'Steel strings brushed slowly with the flat of the fingers, levelled by a compressor, a dark plate behind them.',
    preview: BAR_CHORDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: {
        body: 1,
        position: 0.34,
        nail: 0.15,
        tone: 0.5,
        strum: 110,
        shimmer: 0.2,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -34, ratio: 4, attack: 30, release: 0.8, tails: 1, makeup: 6 },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.4, decay: 0.72, damping: 0.8, predelayMs: 12 } },
    ],
  },
  {
    id: 'slackened-strings-twelfth-fret-dew',
    name: 'Twelfth fret dew',
    category: 'bell',
    description:
      'A twelve-string guitar with the octave above turned up louder than the string itself, in a bright chamber.',
    preview: TARO_CHIMES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { body: 0.2, tone: 0.8, nail: 0.5, sustain: 8, release: 4, volume: 5.5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0, dry: 0.3, up1: 0.8, up2: 0.15, spread: 0.6 } },
      { deviceId: 'ether-reverb', params: { mix: 0.35, decay: 3.5, damping: 0.15, size: 0.5 } },
    ],
  },

  {
    id: 'slackened-strings-hammer-to-c',
    name: 'Hammer to C',
    category: 'plucked',
    description:
      'A nylon string under the thumb well up the neck, with a copy fourteen cents sharp on one side and flat on the other.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: {
        body: 0.6,
        nail: 0,
        position: 0.38,
        sustain: 4.5,
        release: 1,
        tone: 0.35,
        volume: 3.5,
      },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        params: { detune: 14, delay: 26, drift: 0.35, tone: 5000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slackened-strings-major-seventh-nail',
    name: 'Major seventh nail',
    category: 'plucked',
    description:
      'A nylon string nailed at the bridge, pressed flat by a limiter, then spread by a chorus and a short spring.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: 6, body: 0.6, nail: 0.8, sustain: 3, release: 0.5, tone: 0.8, strum: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 26, outputGain: -5 } },
      {
        deviceId: 'chorus',
        params: { voices: 1, rate: 0.5, depth: 60, delayMs: 14, spread: 100, hpHz: 300, mix: 0.45 },
      },
      {
        deviceId: 'spring-reverb',
        params: { mix: 0.2, decay: 1.4, springs: 2, tone: 4200, drip: 0.2, drive: 0 },
      },
    ],
  },
  {
    id: 'slackened-strings-wahine-sagging',
    name: 'Wahine sagging',
    category: 'plucked',
    description:
      'Long steel strings whose tail sags in pitch and darkens as it rings, slowly let down after the pluck.',
    preview: WAHINE_LEAN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: {
        volume: -2,
        body: 0.6,
        position: 0.24,
        nail: 0.5,
        tone: 0.5,
        sustain: 10,
        release: 1.5,
      },
    },
    effects: [
      {
        deviceId: 'melt',
        params: {
          sag: -22,
          hold: 4,
          solid: 260,
          size: 0.45,
          blur: 0.5,
          dim: 0.5,
          drip: 0,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-brushed-open-seventh',
    name: 'Brushed open seventh',
    category: 'plucked',
    description:
      'A soft twelve-string brushed across and multiplied into six moving players a few metres off.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: {
        volume: -0.5,
        nail: 0.05,
        sustain: 7,
        release: 3,
        strum: 100,
        tone: 0.4,
        shimmer: 1,
      },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: { birds: 6, speed: 0.3, turns: 0.15, mix: 0.6, range: 6, air: 0.3, lift: 0.4 },
      },
    ],
  },
  {
    id: 'slackened-strings-b-string-bells',
    name: 'B string bells',
    category: 'bell',
    description:
      'A hard pick on thin steel with almost no box, limited, sounding a table of small bright bowls tuned to C major.',
    preview: WAHINE_CHIMES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -9.5, body: 0.1, sustain: 5, release: 2.5, shimmer: 0.2, strum: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -6.5 } },
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 2,
          bowls: 12,
          register: 0.75,
          ring: 6,
          beat: 0.3,
          strike: 0.55,
          metal: 0.55,
          mix: 0.45,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-long-mountain-thumb',
    name: 'Long mountain thumb',
    category: 'plucked',
    description:
      'A dark steel guitar under the thumb, heard from across a room that keeps its lows and loses its edge.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { nail: 0, tone: 0.3, sustain: 7, release: 1.8, strum: 0, volume: 6 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.62,
          room: 0.7,
          air: 0.6,
          wander: 0,
          decay: 1.8,
          level: 0.4,
          width: 0.7,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-lava-rock-nail',
    name: 'Lava rock nail',
    category: 'plucked',
    description:
      'A bare nailed string, limited, each note scattered afterwards as seven quiet points from side to side.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: {
        volume: -5,
        position: 0.08,
        nail: 0.7,
        sustain: 2.2,
        release: 0.4,
        tone: 0.6,
        strum: 0,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 15, outputGain: -6 } },
      {
        deviceId: 'constellation',
        params: {
          span: 1900,
          stars: 7,
          pattern: 2,
          fade: 0.5,
          again: 0.14,
          tone: 4500,
          width: 1,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-bar-over-a-and-e',
    name: 'Bar over A and E',
    category: 'plucked',
    description:
      'A bright steel guitar shaken by a shallow pitch vibrato, its dark echoes hopping up an octave and back.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: {
        volume: -2.5,
        body: 0.5,
        position: 0.12,
        nail: 0.65,
        tone: 0.75,
        sustain: 8,
        release: 1,
      },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 3, rate: 4.2, depth: 0.22, drift: 0.3, phase: 60 } },
      {
        deviceId: 'analog-delay',
        params: {
          time: 750,
          feedback: 0.3,
          tone: 2200,
          intervalA: 6,
          step: 0,
          spread: 0.8,
          mix: 0.25,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-cinder-cone-brush',
    name: 'Cinder cone brush',
    category: 'plucked',
    description:
      'A nylon guitar brushed low to high, then unfolded by a prism that lets the low strings out before the high ones.',
    preview: MAUNA_BRUSH,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: -0.5, strum: 60, sustain: 7, release: 3, nail: 0.15, tone: 0.5, body: 0.9 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: {
          time: 900,
          shape: 0,
          feedback: 0.25,
          bands: 16,
          smear: 0.3,
          tilt: -0.3,
          width: 0.9,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-summit-sparks',
    name: 'Summit sparks',
    category: 'bell',
    description:
      'Strings picked hard at the bridge, throwing off sparks an octave and more above themselves into a medium plate.',
    preview: MAUNA_CHIMES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: 2.5, body: 0.6, sustain: 9, release: 4, tone: 0.65, strum: 0 },
    },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 14,
          pitch: 3,
          size: 120,
          scatter: 600,
          sparkle: 0.4,
          trail: 0.5,
          mix: 0.4,
        },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.3, decay: 0.6, damping: 0.2 } },
    ],
  },

  {
    id: 'slackened-strings-low-f-let-down',
    name: 'Low F let down',
    category: 'plucked',
    description:
      'A thumbed guitar with a dulled octave below added under every note, a little out of tune with it.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: {
        volume: -0.5,
        body: 0.7,
        position: 0.3,
        nail: 0.1,
        tone: 0.55,
        sustain: 5,
        release: 1,
        strum: 0,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.55, dry: 0.8, up1: 0, filter: 2200, detune: 0.15, spread: 0.2 },
      },
    ],
  },
  {
    id: 'slackened-strings-tenths-in-the-yard',
    name: 'Tenths in the yard',
    category: 'plucked',
    description:
      'A twelve-string nailed and limited, blown about by a wind that moves its level and tone.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: {
        volume: 0,
        body: 0.85,
        nail: 0.75,
        sustain: 3.5,
        release: 0.8,
        tone: 0.75,
        strum: 0,
        shimmer: 0.3,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -10 } },
      {
        deviceId: 'weather',
        params: {
          kind: 0,
          exposure: 0.7,
          voice: 0.12,
          calm: 0.2,
          colour: 0.4,
          sway: 0.7,
          pace: 1.6,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-tide-without-a-pluck',
    name: 'Tide without a pluck',
    category: 'string',
    description:
      'A nylon guitar with its pluck taken away by a half-second swell, so each note arrives out of a long hall.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { tone: 0.8, strum: 20, body: 0.8, position: 0.14, volume: 6 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 520, sensitivity: -55, curve: 0.4 } },
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 30, lowDecay: 5, midDecay: 5.5, damping: 5000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-palm-edge-brush',
    name: 'Palm edge brush',
    category: 'plucked',
    description:
      'A short brushed strum with the palm on the strings, put through a worn cassette with its hiss left in.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: {
        volume: -0.5,
        strum: 45,
        sustain: 1.3,
        release: 0.2,
        body: 0.85,
        position: 0.2,
        nail: 0.35,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 1, drive: 0.45, wobble: 0.35, wear: 0.45, noise: 0.2, tone: 0.4 },
      },
    ],
  },
  {
    id: 'slackened-strings-sine-from-the-node',
    name: 'Sine from the node',
    category: 'bell',
    description:
      'A soft steel string whose strongest partials are drawn again an octave up as pure tones that outlast it.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: {
        volume: 0,
        nail: 0.2,
        body: 0.4,
        position: 0.25,
        sustain: 3,
        release: 1.5,
        strum: 0,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: {
          partials: 6,
          transpose: 12,
          attack: 120,
          release: 2.5,
          glide: 10,
          spread: 0.7,
          tone: 0.45,
          mix: 0.6,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-reef-under-the-thumb',
    name: 'Reef under the thumb',
    category: 'plucked',
    description:
      'A nylon guitar thumbed under shallow water, muffled and slowly wavering, with a few bubbles off the attacks.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: {
        volume: -0.5,
        nail: 0.1,
        position: 0.2,
        sustain: 8,
        release: 3,
        tone: 0.7,
        strum: 0,
      },
    },
    effects: [
      {
        deviceId: 'underwater',
        params: {
          depth: 0.4,
          waver: 0.5,
          rate: 0.5,
          bubbles: 0.25,
          resonance: 0.2,
          surface: 0.4,
          width: 0.8,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-tight-nylon-landing',
    name: 'Tight nylon landing',
    category: 'plucked',
    description:
      'A pinched, limited nylon note with almost no tail, echoed while short pieces from seconds ago drift back.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: 6, sustain: 1.6, release: 0.3, nail: 0.3, tone: 0.5, position: 0.1 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 26, outputGain: -9 } },
      {
        deviceId: 'echo-memory',
        params: {
          time: 375,
          feedback: 0.45,
          echo: 0.6,
          memory: 0.5,
          reach: 6,
          size: 0.8,
          tone: 3500,
          spread: 0.9,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-drone-under-c-and-d',
    name: 'Drone under C and D',
    category: 'drone',
    description:
      'A steel guitar caught by a sustainer, so the open strings hang as an even bed after the pluck has gone.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: {
        volume: -2,
        body: 0.9,
        position: 0.32,
        nail: 0.1,
        tone: 0.3,
        strum: 40,
        release: 10,
      },
    },
    effects: [
      {
        deviceId: 'sustainer',
        params: {
          mode: 1,
          attack: 0.3,
          decay: 9,
          motion: 0.3,
          ensemble: 0.4,
          tone: -0.3,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-low-cloud-brush',
    name: 'Low cloud brush',
    category: 'texture',
    description:
      'A wide slow strum on steel whose every attack is blurred into a soft cloud, with no reverb after it.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: {
        volume: 0.5,
        nail: 0.6,
        position: 0.16,
        body: 0.7,
        tone: 0.6,
        release: 1.2,
        sustain: 5,
      },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 320, density: 1, layers: 2, drift: 0.5, soften: 0.7, damp: 0.4, mix: 0.9 },
      },
    ],
  },
  {
    id: 'slackened-strings-cold-node-cascade',
    name: 'Cold node cascade',
    category: 'bell',
    description:
      'A glassy steel note caught in small loops at its own pitch and octaves above, repeated until they thin away.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -3.5, position: 0.3, nail: 1, tone: 1, sustain: 3, release: 1, strum: 0 },
    },
    effects: [
      {
        deviceId: 'cascade',
        params: {
          pattern: 0,
          time: 300,
          repeats: 8,
          decay: 0.45,
          high: 0.8,
          low: 0,
          shape: 0.4,
          spread: 0.9,
          tone: 7000,
          mix: 0.45,
        },
      },
    ],
  },

  // Pedal steel: the same five tunings and five hands, with a bar that is really there.
  {
    id: 'slackened-strings-round-thumb-on-c',
    name: 'Round thumb on C',
    category: 'plucked',
    description:
      'A steel thumbed with no pick and almost no shake, its top rolled off, put through a small speaker in a close room.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 7, range: 0, vibrato: 1, tone: 1600, volume: -13 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.15, distance: 0.15, room: 0.25, angle: 0.4, noise: 0 },
      },
    ],
  },
  {
    id: 'slackened-strings-steel-nail-in-sixths',
    name: 'Steel nail in sixths',
    category: 'plucked',
    description:
      'Short bright picked steel with no bend and no vibrato, splashing in a loose two-spring tank.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { sustain: 4, tone: 5200, pick: 0.8, volume: -12 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: {
          mix: 0.4,
          decay: 3,
          tension: 0.35,
          springs: 1,
          tone: 3800,
          drip: 0.6,
          drive: 0.15,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-bar-from-the-nut',
    name: 'Bar from the nut',
    category: 'string',
    description:
      'A bar that slides as far as an octave, with a slow shake, and two tape heads repeating it to either side.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.3, glide: 350, vibrato: 12, rate: 4.2, tone: 3000, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 480,
          feedback: 0.35,
          heads: 1,
          wow: 0.35,
          highCut: 3000,
          spread: 0.9,
          mix: 0.3,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-seven-frets-brushed',
    name: 'Seven frets brushed',
    category: 'plucked',
    description:
      'Bar chords that bloom and are gone in two seconds, with a copy eighteen cents sharp on one side and flat on the other.',
    preview: BAR_CHORDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { swell: 0.08, sustain: 2.6, pick: 0.4, tone: 3000, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'stereo-detune',
        params: { detune: 18, delay: 30, drift: 0.1, tone: 8000, mix: 0.55 },
      },
    ],
  },
  {
    id: 'slackened-strings-chimes-under-the-palm',
    name: 'Chimes under the palm',
    category: 'bell',
    description:
      'Hard-picked steel moved up into its octave chimes, its body made small, in a short bright room.',
    preview: TARO_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { range: 0, vibrato: 0, sustain: 5, volume: -5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0, dry: 0.35, up1: 0.8, up2: 0, spread: 0.4 } },
      { deviceId: 'size', params: { size: -0.5, mix: 0.6 } },
      { deviceId: 'ether-reverb', params: { mix: 0.22, decay: 1.6, damping: 0.15, size: 0.35 } },
    ],
  },

  {
    id: 'slackened-strings-b-leans-into-c',
    name: 'B leans into C',
    category: 'string',
    description:
      'A thumbed steel that bends whole steps slowly from the held note, through the slow horn of a turning speaker.',
    preview: WAHINE_LEAN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { range: 2, glide: 420, sustain: 12, swell: 0.1, pick: 0.15, tone: 2600, volume: -9 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: {
          speed: 0,
          hornDepth: 0.8,
          drumDepth: 0.5,
          drive: 0.1,
          distance: 0.5,
          spread: 0.9,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-wahine-fingerpick',
    name: 'Wahine fingerpick',
    category: 'plucked',
    description:
      'A picked lap steel with a quick short slide, its notes skipping away like a stone, each skip duller.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 1, glide: 60, vibrato: 3, sustain: 5, tone: 3800, volume: -11 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 420, bounce: 0.78, skips: 7, loss: 3, sink: 0.5, throw: 0.8, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slackened-strings-two-bars-at-dusk',
    name: 'Two bars at dusk',
    category: 'string',
    description:
      'A swelled singing steel with a slow shake, followed half a second later by its own octave below.',
    preview: WAHINE_LEAN,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { range: 2, swell: 0.6, vibrato: 18, rate: 3.8, tone: 2400, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 0.55,
          interval1: -12,
          fade: 0.2,
          tone: 3500,
          spread: 0.8,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-steel-fan',
    name: 'Steel fan',
    category: 'plucked',
    description:
      'Dark picked chords on a steel, fanned by a prism from the top band down to the bottom one.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { swell: 0, pick: 0.7, sustain: 10, range: 0, vibrato: 0, tone: 2400, volume: -14 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: {
          time: 700,
          shape: 1,
          feedback: 0.3,
          bands: 12,
          smear: 0.2,
          tilt: 0.1,
          width: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-open-seventh-bowls',
    name: 'Open seventh bowls',
    category: 'bell',
    description:
      'Bell-like steel notes that set low dark bowls on C and its fifths singing for twenty seconds.',
    preview: WAHINE_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 3, range: 0, vibrato: 0, pick: 0.75, tone: 4000, volume: -7 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 4,
          bowls: 6,
          register: 0.35,
          ring: 20,
          beat: 0.5,
          strike: 0.5,
          metal: 0.25,
          mix: 0.55,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-thumb-on-the-saddle',
    name: 'Thumb on the saddle',
    category: 'plucked',
    description:
      'A thumbed steel with an octave below it, weighted by a transformer and cut above two kilohertz and a half.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { range: 0, vibrato: 0, sustain: 5, pick: 0.3, tone: 2600, volume: -14.5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.45, dry: 0.8, up1: 0, filter: 1800 } },
      {
        deviceId: 'analog-drive',
        params: { circuit: 2, drive: 0.45, lowBump: 0.4, highCut: 2500 },
      },
    ],
  },
  {
    id: 'slackened-strings-crater-rim-pick',
    name: 'Crater rim pick',
    category: 'plucked',
    description:
      'A long bright steel picked hard, its echoes standing scattered over four seconds between the speakers.',
    preview: MAUNA_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 14, range: 0, vibrato: 7, rate: 5.5, pick: 0.9, tone: 6000, volume: -12 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: {
          span: 4000,
          stars: 10,
          pattern: 0,
          fade: 0.35,
          again: 0.2,
          tone: 5000,
          width: 1,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-slope-of-c-and-g',
    name: 'Slope of C and G',
    category: 'string',
    description:
      'Slow slides of up to an octave that swell in some way off, in a hall that rings for six seconds.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Swelling slide',
      params: { swell: 0.7, glide: 500, sustain: 18, vibrato: 4, tone: 3800, volume: 4 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.45, room: 0.5, air: 0.3, wander: 0.2, decay: 2.5, level: 0.3 },
      },
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 90, lowDecay: 5, midDecay: 6, damping: 4500, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slackened-strings-six-strings-flat-out',
    name: 'Six strings flat out',
    category: 'plucked',
    description:
      'Brushed steel chords pushed into a warm valve and shaken by an amplifier tremolo at four a second.',
    preview: MAUNA_BRUSH,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0, range: 0, vibrato: 0, sustain: 8, pick: 0.6, tone: 3600, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.6, wobble: 0.2, wear: 0.1, noise: 0, tone: 0.5 },
      },
      { deviceId: 'tremolo', params: { mode: 0, rate: 4, depth: 0.6, drift: 0.1, smooth: 0.4 } },
    ],
  },
  {
    id: 'slackened-strings-thin-air-touched',
    name: 'Thin air, touched',
    category: 'pad',
    description:
      'A steel note touched and swelled, mostly replaced by pure tones an octave above it that glide from note to note.',
    preview: MAUNA_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.5, range: 0, sustain: 20, tone: 2600, pick: 0.2, volume: -11.5 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: {
          partials: 10,
          transpose: 12,
          attack: 500,
          release: 4,
          glide: 300,
          spread: 0.9,
          tone: 0.35,
          mix: 0.75,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-f-over-the-fence',
    name: 'F over the fence',
    category: 'plucked',
    description:
      'A soft thumbed steel with a light shake, heard through a kitchen radio that keeps only its middle.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { range: 0, vibrato: 12, rate: 6, pick: 0.5, sustain: 6, tone: 3000, volume: -11.5 },
    },
    effects: [{ deviceId: 'radio', preset: 'Kitchen radio', params: { mix: 0.85 } }],
  },
  {
    id: 'slackened-strings-tenths-with-a-click',
    name: 'Tenths with a click',
    category: 'plucked',
    description:
      'Very short steel picks with a wah that opens on each attack and closes before the next.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { sustain: 2.5, tone: 4500, pick: 0.6, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 350,
          resonance: 1.6,
          envAmount: 60,
          envAttackMs: 8,
          envReleaseMs: 260,
          mix: 0.9,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-slack-key-last-light',
    name: 'Slack key, last light',
    category: 'string',
    description:
      'A steel with a deep quick shake and a short swell, and a soft string section that grows in behind its chords.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: {
        swell: 0.3,
        range: 2,
        vibrato: 26,
        rate: 6,
        sustain: 9,
        tone: 2300,
        pick: 0.3,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: { rise: 0.5, fall: 3, octaves: 0, brightness: 2600, ensemble: 0.7, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slackened-strings-sweep-across-f',
    name: 'Sweep across F',
    category: 'texture',
    description:
      'Brushed steel with a soft attack, swept by a ten-stage phaser that takes about ten seconds each way.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.15, range: 0, vibrato: 4, sustain: 12, pick: 0.2, tone: 5000, volume: -8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 3,
          centerHz: 900,
          spread: 50,
          feedback: 55,
          rate: 0.05,
          depth: 80,
          stereo: 120,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-chimes-of-c-and-e',
    name: 'Chimes of C and E',
    category: 'bell',
    description:
      'Picked steel chimes, each one caught a moment later and replayed an octave up in short grains with a trail.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.02, sustain: 7, range: 0, vibrato: 0, pick: 0.85, tone: 4800, volume: -9 },
    },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 9,
          pitch: 0,
          size: 220,
          scatter: 900,
          sparkle: 0.2,
          trail: 0.6,
          trailTime: 400,
          mix: 0.5,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-deep-c-unhurried',
    name: 'Deep C, unhurried',
    category: 'bass',
    description:
      'A dark steel with no pick at all, levelled flat and warmed by tape, low strings first.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { swell: 0.03, pick: 0, range: 2, glide: 120, sustain: 16, vibrato: 2, volume: -5 },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -36, ratio: 5, attack: 20, release: 1.2, makeup: 6 },
      },
      {
        deviceId: 'tape',
        params: {
          drive: 0.5,
          wow: 0.35,
          flutter: 0.15,
          speed: 2,
          bump: 0.8,
          hiss: 0.05,
          tone: 0.3,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-the-third-lands-late',
    name: 'The third lands late',
    category: 'plucked',
    description:
      'A plucked steel that quickly bends up to a tone, answered by dark bucket echoes that drop an octave.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 2, glide: 90, sustain: 4, vibrato: 0, pick: 0.6, tone: 2800, volume: -9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 600,
          feedback: 0.4,
          tone: 1800,
          age: 0.5,
          intervalA: 1,
          step: 1,
          spread: 0.9,
          mix: 0.35,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-c-wahine-tide',
    name: 'C wahine tide',
    category: 'drone',
    description:
      'Swells of a second and a half on strings that ring for half a minute, split in bands that drift from side to side.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 1.6, sustain: 32, range: 2, glide: 600, vibrato: 5, tone: 3200 },
    },
    effects: [
      {
        deviceId: 'currents',
        params: { depth: 0.8, sway: 0.8, rate: 0.16, tide: 0.5, bands: 5, focus: 0.4 },
      },
    ],
  },
  {
    id: 'slackened-strings-brush-into-dust',
    name: 'Brush into dust',
    category: 'texture',
    description:
      'Brushed steel chords smeared by the spectrum until little but a hanging mist of their notes is left.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.05, range: 0, vibrato: 0, sustain: 6, pick: 0.3, tone: 2600, volume: -12 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.8 } }],
  },
  {
    id: 'slackened-strings-stars-on-slack-wire',
    name: 'Stars on slack wire',
    category: 'bell',
    description:
      'Dying picks with long slides where notes overlap, rising out of a shimmering hall an octave at a time.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { glide: 450, sustain: 5, pick: 0.35, tone: 4200, vibrato: 6, volume: -8.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.4 } }],
  },

  // Electric guitar: the five rooms again, through a pickup and a small clean amplifier.
  {
    id: 'slackened-strings-flat-of-the-thumb',
    name: 'Flat of the thumb',
    category: 'plucked',
    description:
      'A neck pickup under a soft thumb with a short sustain, warmed, inside a wooden soundboard that keeps it round.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { hardness: 0, tone: 1900, sustain: 4, strum: 0, warmth: 0.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 5, size: 0.8, material: 0.6, air: 0, tone: 0.5, width: 0.3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slackened-strings-nail-near-the-bridge',
    name: 'Nail near the bridge',
    category: 'plucked',
    description:
      'A bright bridge pickup picked hard and levelled fast, its one dotted tape echo crossing the beat.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { tone: 4800, sustain: 6, hardness: 0.6, strum: 0, pickup: 0.12, volume: -2 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 26, outputGain: -9 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 560,
          feedback: 0.2,
          heads: 3,
          wow: 0.15,
          highCut: 4000,
          spread: 0.6,
          mix: 0.3,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-knife-on-the-strings',
    name: 'Knife on the strings',
    category: 'string',
    description:
      'A swelled clean guitar shaken late by a wide vibrato that quickens, through two dark springs.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { volume: -1, swell: 0.35, sustain: 14, tone: 2600, shimmer: 0 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 250, grow: 500, depth: 45, rate: 4.8, quicken: 0.6, width: 0.3 },
      },
      {
        deviceId: 'spring-reverb',
        params: { mix: 0.28, decay: 2, springs: 1, tone: 1800, drip: 0.3 },
      },
    ],
  },
  {
    id: 'slackened-strings-garden-gate-brush',
    name: 'Garden gate brush',
    category: 'plucked',
    description:
      'A warm strummed neck pickup with a harmonic tremolo that trades its lows and highs two times a second.',
    preview: BAR_CHORDS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { volume: 0.5, strum: 45, tone: 3200, warmth: 0.4, sustain: 10 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 2, rate: 2, depth: 0.85, crossover: 600, drift: 0.2 },
      },
    ],
  },
  {
    id: 'slackened-strings-harmonics-at-seven',
    name: 'Harmonics at seven',
    category: 'bell',
    description:
      'A hard pick close to the bridge, ring modulated faintly by a high C, in a small bright plate.',
    preview: TARO_CHIMES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { sustain: 8, position: 0.05, tone: 5200, strum: 0, shimmer: 0.2 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: {
          root: 0,
          octave: 6,
          wave: 0,
          drift: 0.3,
          lowCut: 500,
          tone: 6000,
          width: 1,
          mix: 0.2,
        },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.3, decay: 0.45, damping: 0.05, predelayMs: 8 } },
    ],
  },

  {
    id: 'slackened-strings-thumb-and-a-seventh',
    name: 'Thumb and a seventh',
    category: 'plucked',
    description:
      'A dark thumbed guitar doubled by a light chorus, what it just played looped softly underneath at half its speed.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { volume: 3.5, position: 0.2, hardness: 0.2, sustain: 8, tone: 2400, warmth: 0.15 },
    },
    effects: [
      { deviceId: 'chorus', params: { voices: 0, rate: 0.6, depth: 30, spread: 80, mix: 0.3 } },
      {
        deviceId: 'micro-looper',
        params: {
          state: 2,
          length: 1.5,
          speed: 3,
          smear: 0.4,
          fade: 0.6,
          tone: 4000,
          spread: 0.8,
          mix: 0.3,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-open-b-under-a-nail',
    name: 'Open B under a nail',
    category: 'plucked',
    description:
      'A nailed string between two pickups, limited and then sampled at twelve bits so that its edge turns to glaze.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: {
        volume: -2.5,
        pickup: 0.3,
        position: 0.12,
        hardness: 0.5,
        sustain: 4.5,
        warmth: 0.5,
        tone: 4400,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -11 } },
      {
        deviceId: 'vintage-digital',
        params: { rate: 13000, bits: 12, aliasing: 0.3, filter: 1, jitter: 0.1 },
      },
    ],
  },
  {
    id: 'slackened-strings-bar-down-a-stopped-pipe',
    name: 'Bar down a stopped pipe',
    category: 'string',
    description:
      'A long warm swell of guitar through a stopped pipe, its lean from B to C circling slowly round the head.',
    preview: WAHINE_LEAN,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { swell: 0.6, sustain: 18, tone: 3000, shimmer: 0.2 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 2, size: 1.6, material: 0.4, opening: 0.4, air: 0.1, tone: 0.5, mix: 0.55 },
      },
      { deviceId: 'around', params: { path: 0, rate: 0.15, radius: 0.9, head: 0.7 } },
    ],
  },
  {
    id: 'slackened-strings-evening-seventh-brush',
    name: 'Evening seventh brush',
    category: 'plucked',
    description:
      'A rolled bright chord that dies quickly, held up afterwards by a short room which rises backwards and stops.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dry rolled chord',
      params: { volume: 5, strum: 40, sustain: 3, hardness: 0.5, tone: 3600 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 1,
          time: 0.9,
          density: 0.9,
          colour: -0.2,
          highCut: 6000,
          tail: 0.1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-e-and-g-in-glass',
    name: 'E and G in glass',
    category: 'bell',
    description:
      'A hidden pick with a deep shimmer, replayed an octave up in scattered showers of small grains.',
    preview: WAHINE_CHIMES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { swell: 0.05, sustain: 12, shimmer: 0.8, strum: 10 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 420,
          spray: 0.3,
          pitch: 12,
          pitchSpray: 0,
          size: 140,
          density: 5,
          feedback: 0.4,
          tone: 5500,
          spread: 1,
          mix: 0.45,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-basalt-baritone',
    name: 'Basalt baritone',
    category: 'plucked',
    description:
      'A dark low guitar plucked by the bridge and leaned on a transformer, its peaks held by a fast limiter.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { volume: -8, strum: 0, sustain: 7, tone: 1700, hardness: 0.6 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 2, drive: 0.55, lowBump: 0.3, highCut: 4000 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -5 } },
    ],
  },
  {
    id: 'slackened-strings-red-bud-hard-nail',
    name: 'Red bud, hard nail',
    category: 'plucked',
    description:
      'A hard pick on the neck pickup, its tail lifted until the quiet end of every string stays near, then limited.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: {
        position: 0.1,
        hardness: 0.8,
        sustain: 5,
        tone: 3000,
        strum: 0,
        shimmer: 0.05,
        warmth: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'lift',
        params: { threshold: -20, amount: 1, rise: 0.4, hold: 0.2, split: 0.3, limit: 20 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -5 } },
    ],
  },
  {
    id: 'slackened-strings-two-pegs-turned-back',
    name: 'Two pegs turned back',
    category: 'string',
    description:
      'A guitar with its attack swelled away over half a second and a deep slow flange turning through what rings.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'guitar',
      preset: 'Harp roll',
      params: {
        volume: 6,
        strum: 0,
        sustain: 16,
        shimmer: 0.2,
        hardness: 0.4,
        swell: 0.5,
        tone: 4000,
        warmth: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: {
          delayMs: 4,
          rate: 0.12,
          depth: 70,
          feedback: 45,
          shape: 1,
          stereo: 150,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-cooled-flow-brush',
    name: 'Cooled flow brush',
    category: 'texture',
    description:
      'A thick slow strum swept into a fuzz between two reverbs, so the open chord stands as one wall.',
    preview: MAUNA_BRUSH,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thick growl',
      params: { volume: -5.5, strum: 60, sustain: 12, warmth: 0.5, shimmer: 0.4, pickup: 0.5 },
    },
    effects: [
      {
        deviceId: 'haze',
        params: {
          haze: 0.5,
          blur: 0.65,
          decay: 6,
          mix: 0.55,
          size: 0.6,
          tone: 0.3,
          octave: 0.1,
          feed: 0.2,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-snow-on-the-summit',
    name: 'Snow on the summit',
    category: 'pad',
    description:
      'Swelled chimes frozen by a year stopped in deep winter, thin and cold round the edges.',
    preview: MAUNA_CHIMES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.2, sustain: 10, tone: 5000, hardness: 0.8, warmth: 0.2 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
  },

  {
    id: 'slackened-strings-fifth-above-the-low-f',
    name: 'Fifth above the low F',
    category: 'plucked',
    description:
      'A thumbed guitar over eight sympathetic strings tuned to C, the fifth above its low F.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.15, position: 0.24, sustain: 6, tone: 2400, strum: 0 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 0, mode: 0, strings: 4, sympathy: 0.7, decay: 7, mix: 0.5, width: 1 },
      },
    ],
  },
  {
    id: 'slackened-strings-tenths-stopped-short',
    name: 'Tenths stopped short',
    category: 'plucked',
    description:
      'Dark stopped notes followed by echoes that bounce closer and closer together, softer each time.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark stops',
      params: { tone: 2200, sustain: 1.8, hardness: 0.35 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 560, bounce: 0.65, skips: 8, loss: 1.8, sink: 0.2, throw: 0.4, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-glass-tube-at-noon',
    name: 'Glass tube at noon',
    category: 'string',
    description:
      'A sustained warm guitar that feeds back on itself in a small room until held notes bloom to an overtone.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Warm breakup',
      params: { volume: -4, sustain: 14, hardness: 0.35, strum: 0, tone: 2800, swell: 0.1 },
    },
    effects: [
      {
        deviceId: 'howl',
        params: { gain: 0.8, hold: 5, move: 0.15, edge: 0.05, follow: 0.6, mix: 0.4, width: 0.5 },
      },
    ],
  },
  {
    id: 'slackened-strings-open-ninth-brush',
    name: 'Open ninth brush',
    category: 'plucked',
    description:
      'A twelve-string strum with its attacks taken down and its air thrown wide, the tones left to hold on.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { strum: 50, shimmer: 0.9, tone: 4000, sustain: 8 },
    },
    effects: [
      {
        deviceId: 'sift',
        params: { tones: 2, attacks: -20, air: 6, hold: 0.7, soften: 0.4, scatter: 1 },
      },
    ],
  },
  {
    id: 'slackened-strings-chime-turned-round',
    name: 'Chime turned round',
    category: 'bell',
    description:
      'Clean neck-pickup chimes answered backwards an octave higher, in pieces of nine tenths of a second.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: {
        volume: 5.5,
        position: 0.06,
        hardness: 0.7,
        sustain: 5,
        tone: 4200,
        strum: 0,
        warmth: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: {
          time: 900,
          feedback: 0.4,
          pitch: 1,
          smooth: 0.8,
          tone: 5500,
          spread: 0.9,
          mix: 0.45,
          lowCut: 200,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-loose-sixth-string',
    name: 'Loose sixth string',
    category: 'bass',
    description:
      'A thumbed guitar with the octave below as loud as itself, on a cassette that wavers slowly in pitch.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { sustain: 6, hardness: 0.25, pickup: 0.5, strum: 0, tone: 2000 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.75, dry: 0.75, up1: 0, filter: 1200, detune: 0.1, spread: 0 },
      },
      {
        deviceId: 'tape',
        params: { drive: 0.35, wow: 0.6, flutter: 0.1, speed: 3, hiss: 0, bump: 0.7 },
      },
    ],
  },
  {
    id: 'slackened-strings-the-ninth-gives-way',
    name: 'The ninth gives way',
    category: 'plucked',
    description:
      'A picked guitar with a triode edge, a short prism letting its outer tones out before the middle ones.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Warm breakup',
      params: {
        pickup: 0.4,
        hardness: 0.75,
        position: 0.1,
        tone: 3400,
        warmth: 0.7,
        sustain: 4,
        strum: 0,
      },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 3, drive: 0.5, tone: 0.1 } },
      {
        deviceId: 'prism',
        params: { time: 350, shape: 2, feedback: 0.35, bands: 24, smear: 0.3, width: 1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-valley-of-open-fifths',
    name: 'Valley of open fifths',
    category: 'drone',
    description:
      'A thick slow swell that never quite fades, given the octave and twelfth pipes of an organ that speak late behind it.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { volume: 2, swell: 1.2, tone: 1900, shimmer: 1, pickup: 0.6 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 900,
          tone: 0.3,
          chiff: 0,
          detune: 0.5,
          sub: 0.2,
          unison: 0.5,
          fifth: 0,
          octave: 0.6,
          twelfth: 0.35,
          fifteenth: 0,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-dusk-on-the-jetty',
    name: 'Dusk on the jetty',
    category: 'texture',
    description:
      'A low strum looped on worn tape at half speed beneath itself, each turn darker than the last.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: {
        volume: -1,
        pickup: 0.4,
        hardness: 0.35,
        strum: 70,
        sustain: 9,
        tone: 2600,
        warmth: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: {
          length: 1.5,
          feedback: 0.6,
          speed: 0,
          wear: 0.6,
          wow: 0.35,
          spread: 0.7,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-bird-above-the-lane',
    name: 'Bird above the lane',
    category: 'bell',
    description:
      'A short pick on the bridge pickup, limited, its tail climbing two octaves at a time in a thin bright shimmer.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { volume: 0.5, pickup: 0.2, sustain: 3, tone: 3600, hardness: 0.6, strum: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -7 } },
      {
        deviceId: 'shimmer',
        params: {
          mix: 0.5,
          decay: 5,
          shimmer: 0.45,
          interval: 4,
          size: 0.4,
          tone: 6000,
          lowCut: 250,
        },
      },
    ],
  },

  // Zither: a lap of open strings let down to each tuning, with its own sympathetic strings behind.
  {
    id: 'slackened-strings-lap-of-open-c',
    name: 'Lap of open C',
    category: 'plucked',
    description:
      'A single string plucked by a finger at its middle, levelled by a compressor that brings up its wood.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: -14,
        exciter: 0,
        position: 0.45,
        decay: 3.5,
        release: 0.8,
        brightness: 0.35,
        sympathy: 0.1,
        body: 1,
      },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -36, ratio: 4, attack: 15, release: 0.6, tails: 1, makeup: 8 },
      },
    ],
  },
  {
    id: 'slackened-strings-ring-pick-at-dawn',
    name: 'Ring pick at dawn',
    category: 'plucked',
    description:
      'A hard nasal pick close to the bridge of a long hollow body, a little way off in a room that rings for over two seconds.',
    preview: TARO_SIXTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -3,
        position: 0.07,
        brightness: 0.8,
        decay: 2,
        release: 0.6,
        sympathy: 0.05,
      },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.3,
          room: 0.8,
          air: 0.2,
          wander: 0,
          decay: 2.6,
          level: 0.9,
          width: 0.8,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-bar-across-the-box',
    name: 'Bar across the box',
    category: 'string',
    description:
      'A box of lightly doubled strings whose pluck is swelled away and whose held notes sway late and wide.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        chord: 0,
        strum: 0,
        courses: 0.2,
        decay: 14,
        release: 2,
        sympathy: 0.2,
        brightness: 0.6,
      },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 180, sensitivity: -50, curve: 0.3 } },
      {
        deviceId: 'late-vibrato',
        params: { wait: 120, grow: 400, depth: 42, rate: 5, swell: 0.4 },
      },
    ],
  },
  {
    id: 'slackened-strings-hand-over-the-patch',
    name: 'Hand over the patch',
    category: 'plucked',
    description:
      'Each key strums its octave on many-stringed courses, upward and slow, in the shade of a dark plate.',
    preview: BAR_CHORDS,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { strum: 70, exciter: 0, brightness: 0.4, decay: 7, release: 3, sympathy: 0.3 },
    },
    effects: [
      {
        deviceId: 'plate-reverb',
        params: { mix: 0.45, decay: 0.8, damping: 0.75, predelayMs: 30 },
      },
    ],
  },
  {
    id: 'slackened-strings-dew-on-g-and-c',
    name: 'Dew on G and C',
    category: 'bell',
    description:
      'A felt hammer touching one string at its middle, the octave above sounding more than the note, its touch blurred.',
    preview: TARO_CHIMES,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { volume: -5.5, position: 0.5, decay: 7, release: 4, brightness: 0.6, sympathy: 0.4 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0, dry: 0.3, up1: 0.75, up2: 0.25, attack: 0.05, spread: 0.8 },
      },
      { deviceId: 'fog', params: { size: 60, density: 0.6, layers: 1, soften: 0.2, mix: 0.5 } },
    ],
  },

  {
    id: 'slackened-strings-seventh-lying-open',
    name: 'Seventh lying open',
    category: 'plucked',
    description:
      'Soft thumbed harp strings with no doubling, through a full range speaker recorded from the far end of a hall.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { brightness: 0.35, position: 0.4, decay: 5, release: 2 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Far end of the hall', params: { output: 0 } }],
  },
  {
    id: 'slackened-strings-plectrum-on-b',
    name: 'Plectrum on B',
    category: 'plucked',
    description:
      'A bright pick on close double courses, flanged hollow by a comb that hardly moves.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -0.5,
        body: 1,
        courses: 0.6,
        brightness: 0.75,
        decay: 3,
        release: 0.7,
        position: 0.14,
      },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 1.8, rate: 0.05, depth: 25, feedback: -65, stereo: 60, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-seventh-let-slide',
    name: 'Seventh let slide',
    category: 'string',
    description:
      'A rolled soft hammer on long strings, its fading notes split and drifted apart by half a hertz on each side.',
    preview: WAHINE_LEAN,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: {
        volume: -10.5,
        chord: 0,
        roll: 5,
        brightness: 0.3,
        decay: 10,
        release: 3,
        sympathy: 0.3,
        courses: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          shift: 0,
          fine: 0.5,
          mode: 2,
          feedback: 0.35,
          delay: 90,
          tone: 5000,
          width: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-fan-of-the-wahine',
    name: 'Fan of the wahine',
    category: 'plucked',
    description:
      'Octaves brushed downward on a harp body and breathed open and shut in level, brightness and width.',
    preview: WAHINE_HAMMER,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: {
        chord: 1,
        strum: 150,
        direction: 1,
        decay: 8,
        release: 4,
        brightness: 0.55,
        sympathy: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        params: {
          in: 1.2,
          hold: 0.3,
          out: 1.8,
          rest: 0.2,
          depth: 0.55,
          colour: 0.6,
          width: 0.6,
          air: 0.1,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-two-gs-a-hand-apart',
    name: 'Two Gs, a hand apart',
    category: 'bell',
    description:
      'A hammered dulcimer string, half of it stretched in its partials into a soft chime with its top turned down.',
    preview: WAHINE_CHIMES,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        volume: -7,
        roll: 0,
        decay: 4,
        release: 2,
        courses: 0.1,
        brightness: 0.5,
        sympathy: 0.2,
      },
    },
    effects: [{ deviceId: 'warp', preset: 'Soft chime' }],
  },

  {
    id: 'slackened-strings-boards-of-mauna-loa',
    name: 'Boards of Mauna Loa',
    category: 'plucked',
    description:
      'A thumb on plain strings inside a heavy dulcimer box, pressed through a transformer, its pluck softened.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        volume: -17,
        exciter: 0,
        body: 2,
        decay: 6,
        release: 1.5,
        brightness: 0.25,
        position: 0.3,
        sympathy: 0.2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 2, drive: 0.5, lowBump: 0.5, tone: -0.2 } },
      {
        deviceId: 'fog',
        params: { size: 25, density: 0.5, layers: 1, soften: 0.5, width: 0.4, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slackened-strings-black-sand-pick',
    name: 'Black sand pick',
    category: 'plucked',
    description:
      'A short hard pick that is gone in under two seconds, its dark echoes worn and slightly noisy.',
    preview: MAUNA_SIXTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: -2.5, chord: 0, strum: 0, decay: 1.8, release: 0.5, brightness: 0.6 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 375,
          feedback: 0.5,
          modDepth: 0.4,
          tone: 1600,
          age: 0.6,
          spread: 0.7,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-rim-of-the-caldera',
    name: 'Rim of the caldera',
    category: 'string',
    description:
      'A finger tremolo on long-ringing strings, in a cavern of echoes that slowly changes size.',
    preview: BAR_SLIDE,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { roll: 8, brightness: 0.5, decay: 10, release: 6, position: 0.2, body: 3 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: {
          length: 0.4,
          blur: 0.7,
          feedback: 0.65,
          highCut: 4000,
          stretch: 0.5,
          wander: 0.2,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-long-slope-brush',
    name: 'Long slope brush',
    category: 'plucked',
    description:
      'Doubled strings under a finger on a resonant box, replayed eight times slower as a wide dim cloud behind it.',
    preview: MAUNA_BRUSH,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        chord: 0,
        exciter: 0,
        decay: 5,
        release: 2,
        brightness: 0.55,
        courses: 0.7,
        sympathy: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'stretch',
        params: { stretch: 8, window: 2, diffuse: 1, tone: -0.4, memory: 4, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-above-the-trade-wind',
    name: 'Above the trade wind',
    category: 'bell',
    description:
      'Picked strings with their fifth and octave, long and glassy, pulled along by a gusting wind.',
    preview: MAUNA_CHIMES,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        volume: -5.5,
        chord: 2,
        strum: 90,
        decay: 10,
        release: 8,
        brightness: 0.8,
        courses: 0.3,
        sympathy: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'weather',
        params: {
          kind: 0,
          exposure: 0.8,
          voice: 0.15,
          calm: 0.1,
          colour: 0.3,
          sway: 0.8,
          force: 0.7,
        },
      },
    ],
  },

  {
    id: 'slackened-strings-empty-canoe',
    name: 'Empty canoe',
    category: 'plucked',
    description:
      'A thumbed string with its octave below, ringing in the body of a large drum, half open.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -9,
        body: 1,
        brightness: 0.45,
        position: 0.35,
        decay: 4,
        release: 1,
        sympathy: 0,
      },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.5, dry: 0.8, up1: 0, filter: 1500 } },
      {
        deviceId: 'vessel',
        params: { body: 4, size: 2.2, material: 0.3, opening: 0.5, air: 0, tone: 0.45, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slackened-strings-tenths-on-tin',
    name: 'Tenths on tin',
    category: 'plucked',
    description:
      'Single picked strings, dry and lean, played from a worn 78 with its crackle and wobble.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: {
        volume: -5,
        chord: 0,
        strum: 0,
        decay: 2.5,
        release: 0.8,
        brightness: 0.5,
        courses: 0.15,
        sympathy: 0.15,
      },
    },
    effects: [
      {
        deviceId: 'vinyl',
        params: {
          speed: 2,
          warp: 0.35,
          crackle: 0.3,
          pops: 0.1,
          surface: 0.25,
          wear: 0.6,
          tone: -0.1,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-low-f-left-ringing',
    name: 'Low F left ringing',
    category: 'pad',
    description:
      'A fingered harp and its sympathetic strings, mostly replaced by an even pad that holds each chord until the next.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: {
        chord: 0,
        exciter: 0,
        brightness: 0.4,
        decay: 12,
        release: 10,
        sympathy: 0.9,
        position: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'sustainer',
        params: {
          mode: 0,
          attack: 0.4,
          decay: 10,
          glide: 0.8,
          motion: 0.5,
          ensemble: 0.5,
          tone: 0.1,
          mix: 0.8,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-mat-and-knuckles',
    name: 'Mat and knuckles',
    category: 'plucked',
    description:
      'Stopped strings brushed in octaves, damped at once, limited, and put through a small early sampler.',
    preview: F_TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        volume: -7,
        roll: 0,
        exciter: 0,
        chord: 1,
        strum: 25,
        decay: 1.8,
        release: 0.3,
        brightness: 0.45,
        courses: 0.3,
        sympathy: 0,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 22, outputGain: -10 } },
      {
        deviceId: 'vintage-digital',
        params: { rate: 11000, bits: 10, aliasing: 0.25, filter: 2, jitter: 0.3 },
      },
    ],
  },
  {
    id: 'slackened-strings-after-the-chime',
    name: 'After the chime',
    category: 'bell',
    description:
      'Fingered harp chimes with the fifth and octave, feeding a tail that climbs slowly and never arrives.',
    preview: F_CHIMES,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -9,
        chord: 2,
        strum: 200,
        brightness: 0.7,
        decay: 6,
        release: 5,
        sympathy: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'spiral',
        params: { climb: 1.5, decay: 7, size: 0.6, voices: 4, tone: 6500, blur: 0.6, mix: 0.4 },
      },
    ],
  },

  {
    id: 'slackened-strings-bottom-string-slack',
    name: 'Bottom string slack',
    category: 'bass',
    description:
      'A felt hammer on long dark strings, pitch drawn down slowly by a tail that sags as it rings.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: {
        chord: 0,
        decay: 9,
        release: 4,
        brightness: 0.2,
        sympathy: 0.1,
        courses: 0,
        body: 2,
      },
    },
    effects: [
      {
        deviceId: 'melt',
        params: {
          sag: -35,
          hold: 5,
          solid: 180,
          size: 0.5,
          blur: 0.4,
          dim: 0.5,
          drip: 0,
          mix: 0.55,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-e-found-again',
    name: 'E found again',
    category: 'plucked',
    description:
      'A picked zither sent round three loops of unequal length that turn against each other as they fade.',
    preview: C_WAHINE_LANDS,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { body: 1, decay: 5, release: 1.5, brightness: 0.45, position: 0.25, sympathy: 0.3 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: {
          loops: 3,
          length: 1.2,
          offset: 2,
          feedback: 0.6,
          wear: 0.35,
          spread: 1,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-house-with-no-third',
    name: 'House with no third',
    category: 'drone',
    description:
      'A very slow finger roll in octaves over full sympathetic strings, sung back by a low vowel hall.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { chord: 1, roll: 2, strum: 200, sympathy: 1, brightness: 0.4, decay: 14 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: {
          vowel: 3.4,
          resonance: 0.7,
          voice: 0.1,
          motion: 0.3,
          decay: 9,
          size: 0.8,
          highCut: 5000,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'slackened-strings-rain-on-the-lanai',
    name: 'Rain on the lanai',
    category: 'texture',
    description:
      'A tremolo of hammers on many-stringed courses in octaves, scattered into a cloud of grains with rain behind.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { volume: -8.5, roll: 12, brightness: 0.4, courses: 0.7, sympathy: 0.4, decay: 5 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          position: 0.1,
          size: 160,
          density: 14,
          spray: 0.4,
          scatter: 0,
          reverse: 0.3,
          feedback: 0.2,
          spread: 1,
          mix: 0.6,
        },
      },
      { deviceId: 'weather', params: { kind: 2, exposure: 0.4, voice: 0.2, calm: 0.4 } },
    ],
  },
  {
    id: 'slackened-strings-night-fishing-lights',
    name: 'Night fishing lights',
    category: 'bell',
    description:
      'Short hammered dulcimer points, limited, each answered by eight small bowls tuned to C pentatonic.',
    preview: C_WAHINE_HELD,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        volume: -0.5,
        roll: 0,
        decay: 3,
        release: 0.6,
        courses: 0.4,
        brightness: 0.65,
        sympathy: 0.1,
        position: 0.12,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 24, outputGain: -8 } },
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 0,
          bowls: 8,
          register: 0.5,
          ring: 4,
          beat: 0.2,
          strike: 0.4,
          metal: 0.4,
          mix: 0.4,
          spread: 0.2,
        },
      },
    ],
  },
]
