import { type FactoryPreset, type Phrase } from '../types'

// How a phrase ends: full, plagal, half, deceptive, Phrygian, with the third raised or borrowed.
// Laid out by how the sound itself stops, from a door that shuts with the key to a nave that will
// not, on strings, organ, voices and pianos. Most cards end on a chord another card begins on.

// A beginning: Am, G/B, C. The bass climbs A B C under a soprano C D E, with the tenor coming down
// to C.
const OPENING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.8, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 69, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 72, gain: 0.46 },
    { atSec: 1.8, durSec: 1.8, note: 47, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 62, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 67, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 74, gain: 0.46 },
    { atSec: 3.6, durSec: 2.4, note: 48, gain: 0.55 },
    { atSec: 3.6, durSec: 2.4, note: 60, gain: 0.4 },
    { atSec: 3.6, durSec: 2.4, note: 67, gain: 0.4 },
    { atSec: 3.6, durSec: 2.4, note: 76, gain: 0.46 },
  ],
}

// C, G/B, Am, Dm7/F, G, C: the soprano by step, C D C, held as the seventh of the D
// chord, B and home to C.
const CHORALE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 48, gain: 0.55 },
    { atSec: 0, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 0.9, durSec: 0.9, note: 47, gain: 0.55 },
    { atSec: 0.9, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 62, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 74, gain: 0.46 },
    { atSec: 1.8, durSec: 0.9, note: 45, gain: 0.55 },
    { atSec: 1.8, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 2.7, durSec: 0.9, note: 41, gain: 0.55 },
    { atSec: 2.7, durSec: 0.9, note: 57, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 62, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 3.6, durSec: 0.9, note: 43, gain: 0.55 },
    { atSec: 3.6, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 62, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 71, gain: 0.46 },
    { atSec: 4.5, durSec: 2, note: 48, gain: 0.55 },
    { atSec: 4.5, durSec: 2, note: 55, gain: 0.4 },
    { atSec: 4.5, durSec: 2, note: 64, gain: 0.4 },
    { atSec: 4.5, durSec: 2, note: 72, gain: 0.46 },
  ],
}

// A half close: C, Dm/F, G, and it stays on the G.
const HALF_CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 48, gain: 0.55 },
    { atSec: 0, durSec: 1.8, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 72, gain: 0.46 },
    { atSec: 1.8, durSec: 1.8, note: 41, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 57, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 62, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 69, gain: 0.46 },
    { atSec: 3.6, durSec: 2.6, note: 43, gain: 0.55 },
    { atSec: 3.6, durSec: 2.6, note: 55, gain: 0.4 },
    { atSec: 3.6, durSec: 2.6, note: 62, gain: 0.4 },
    { atSec: 3.6, durSec: 2.6, note: 71, gain: 0.46 },
  ],
}

// A deceptive close: G, G7, Am. The alto passes G F E, the leading note still goes to C, and the
// bass steps up to A.
const DECEPTIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 43, gain: 0.55 },
    { atSec: 0, durSec: 1.8, note: 62, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 71, gain: 0.46 },
    { atSec: 1.8, durSec: 1.8, note: 43, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 62, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 65, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 71, gain: 0.46 },
    { atSec: 3.6, durSec: 2.6, note: 45, gain: 0.55 },
    { atSec: 3.6, durSec: 2.6, note: 60, gain: 0.4 },
    { atSec: 3.6, durSec: 2.6, note: 64, gain: 0.4 },
    { atSec: 3.6, durSec: 2.6, note: 72, gain: 0.46 },
  ],
}

// A Phrygian half close: Am, Dm/F, E. The bass falls F to E, the soprano A to G sharp, the alto
// rises D to E.
const PHRYGIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 69, gain: 0.46 },
    { atSec: 1.8, durSec: 1.8, note: 41, gain: 0.55 },
    { atSec: 1.8, durSec: 1.8, note: 57, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 62, gain: 0.4 },
    { atSec: 1.8, durSec: 1.8, note: 69, gain: 0.46 },
    { atSec: 3.6, durSec: 2.6, note: 40, gain: 0.55 },
    { atSec: 3.6, durSec: 2.6, note: 59, gain: 0.4 },
    { atSec: 3.6, durSec: 2.6, note: 64, gain: 0.4 },
    { atSec: 3.6, durSec: 2.6, note: 68, gain: 0.46 },
  ],
}

// E, Am, E, A: the first close is minor, the second is major, its C raised to C sharp in the tenor.
const PICARDY: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.45, note: 40, gain: 0.55 },
    { atSec: 0, durSec: 1.45, note: 59, gain: 0.4 },
    { atSec: 0, durSec: 1.45, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.45, note: 68, gain: 0.46 },
    { atSec: 1.45, durSec: 1.45, note: 45, gain: 0.55 },
    { atSec: 1.45, durSec: 1.45, note: 60, gain: 0.4 },
    { atSec: 1.45, durSec: 1.45, note: 64, gain: 0.4 },
    { atSec: 1.45, durSec: 1.45, note: 69, gain: 0.46 },
    { atSec: 2.9, durSec: 1.45, note: 40, gain: 0.55 },
    { atSec: 2.9, durSec: 1.45, note: 59, gain: 0.4 },
    { atSec: 2.9, durSec: 1.45, note: 64, gain: 0.4 },
    { atSec: 2.9, durSec: 1.45, note: 68, gain: 0.46 },
    { atSec: 4.35, durSec: 2.1, note: 45, gain: 0.55 },
    { atSec: 4.35, durSec: 2.1, note: 61, gain: 0.4 },
    { atSec: 4.35, durSec: 2.1, note: 64, gain: 0.4 },
    { atSec: 4.35, durSec: 2.1, note: 69, gain: 0.46 },
  ],
}

// A full close: Am, Dm/F, G, C, with the soprano A A B C.
const FULL_CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.4, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.4, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.4, note: 69, gain: 0.46 },
    { atSec: 1.4, durSec: 1.4, note: 41, gain: 0.55 },
    { atSec: 1.4, durSec: 1.4, note: 57, gain: 0.4 },
    { atSec: 1.4, durSec: 1.4, note: 62, gain: 0.4 },
    { atSec: 1.4, durSec: 1.4, note: 69, gain: 0.46 },
    { atSec: 2.8, durSec: 1.4, note: 43, gain: 0.55 },
    { atSec: 2.8, durSec: 1.4, note: 55, gain: 0.4 },
    { atSec: 2.8, durSec: 1.4, note: 62, gain: 0.4 },
    { atSec: 2.8, durSec: 1.4, note: 71, gain: 0.46 },
    { atSec: 4.2, durSec: 2.2, note: 48, gain: 0.55 },
    { atSec: 4.2, durSec: 2.2, note: 55, gain: 0.4 },
    { atSec: 4.2, durSec: 2.2, note: 64, gain: 0.4 },
    { atSec: 4.2, durSec: 2.2, note: 72, gain: 0.46 },
  ],
}

// F, G with the C held over as a fourth, its B, and C. Four voices, one of them late.
const SUSPENDED: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 41, gain: 0.55 },
    { atSec: 0, durSec: 2, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 2, note: 65, gain: 0.4 },
    { atSec: 0, durSec: 3, note: 72, gain: 0.46 },
    { atSec: 2, durSec: 2, note: 43, gain: 0.55 },
    { atSec: 2, durSec: 2, note: 55, gain: 0.4 },
    { atSec: 2, durSec: 2, note: 62, gain: 0.4 },
    { atSec: 3, durSec: 1, note: 71, gain: 0.42 },
    { atSec: 4, durSec: 2.4, note: 48, gain: 0.55 },
    { atSec: 4, durSec: 2.4, note: 55, gain: 0.4 },
    { atSec: 4, durSec: 2.4, note: 64, gain: 0.4 },
    { atSec: 4, durSec: 2.4, note: 72, gain: 0.46 },
  ],
}

// A plagal close in C: F, C. The C is held, A and F each fall a step.
const AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 41, gain: 0.55 },
    { atSec: 0, durSec: 3.1, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 3.1, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 3.1, note: 65, gain: 0.46 },
    { atSec: 3.1, durSec: 3.1, note: 48, gain: 0.55 },
    { atSec: 3.1, durSec: 3.1, note: 55, gain: 0.4 },
    { atSec: 3.1, durSec: 3.1, note: 60, gain: 0.4 },
    { atSec: 3.1, durSec: 3.1, note: 64, gain: 0.46 },
  ],
}

// The minor plagal close: F, Fm, C. The tenor goes A, A flat, G.
const MINOR_AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 41, gain: 0.55 },
    { atSec: 0, durSec: 1.9, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 1.9, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.9, note: 65, gain: 0.46 },
    { atSec: 1.9, durSec: 1.9, note: 41, gain: 0.55 },
    { atSec: 1.9, durSec: 1.9, note: 56, gain: 0.4 },
    { atSec: 1.9, durSec: 1.9, note: 60, gain: 0.4 },
    { atSec: 1.9, durSec: 1.9, note: 65, gain: 0.46 },
    { atSec: 3.8, durSec: 2.5, note: 48, gain: 0.55 },
    { atSec: 3.8, durSec: 2.5, note: 55, gain: 0.4 },
    { atSec: 3.8, durSec: 2.5, note: 60, gain: 0.4 },
    { atSec: 3.8, durSec: 2.5, note: 64, gain: 0.46 },
  ],
}

// C, F/A, Fm/A flat, C/G, G7, C: the bass comes down C, A, A flat, G under held voices, and then
// the full close.
const BORROWED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 48, gain: 0.55 },
    { atSec: 0, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 0.9, durSec: 0.9, note: 45, gain: 0.55 },
    { atSec: 0.9, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 65, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 1.8, durSec: 0.9, note: 44, gain: 0.55 },
    { atSec: 1.8, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 65, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 2.7, durSec: 0.9, note: 43, gain: 0.55 },
    { atSec: 2.7, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 72, gain: 0.46 },
    { atSec: 3.6, durSec: 0.9, note: 43, gain: 0.55 },
    { atSec: 3.6, durSec: 0.9, note: 59, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 65, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 74, gain: 0.46 },
    { atSec: 4.5, durSec: 2, note: 48, gain: 0.55 },
    { atSec: 4.5, durSec: 2, note: 60, gain: 0.4 },
    { atSec: 4.5, durSec: 2, note: 64, gain: 0.4 },
    { atSec: 4.5, durSec: 2, note: 72, gain: 0.46 },
  ],
}

// Two voices close on D: tenths, then a seventh over E resolving to the raised C sharp, then the
// octave.
const CLAUSULA: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 53, gain: 0.55 },
    { atSec: 0, durSec: 1.1, note: 69, gain: 0.5 },
    { atSec: 1.1, durSec: 1.1, note: 55, gain: 0.55 },
    { atSec: 1.1, durSec: 1.1, note: 71, gain: 0.5 },
    { atSec: 2.2, durSec: 1.1, note: 53, gain: 0.55 },
    { atSec: 2.2, durSec: 1.9, note: 74, gain: 0.5 },
    { atSec: 3.3, durSec: 1.5, note: 52, gain: 0.55 },
    { atSec: 4.1, durSec: 0.7, note: 73, gain: 0.45 },
    { atSec: 4.8, durSec: 1.8, note: 50, gain: 0.55 },
    { atSec: 4.8, durSec: 1.8, note: 74, gain: 0.5 },
  ],
}

// Dm/F, G7, Am rolled from the bass up, each held: a deceptive close for hands.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 41, gain: 0.55 },
    { atSec: 0.16, durSec: 1.64, note: 62, gain: 0.4 },
    { atSec: 0.32, durSec: 1.48, note: 65, gain: 0.42 },
    { atSec: 0.48, durSec: 1.32, note: 69, gain: 0.5 },
    { atSec: 1.8, durSec: 1.8, note: 43, gain: 0.55 },
    { atSec: 1.96, durSec: 1.64, note: 62, gain: 0.4 },
    { atSec: 2.12, durSec: 1.48, note: 65, gain: 0.42 },
    { atSec: 2.28, durSec: 1.32, note: 71, gain: 0.5 },
    { atSec: 3.6, durSec: 2.6, note: 45, gain: 0.55 },
    { atSec: 3.76, durSec: 2.44, note: 60, gain: 0.4 },
    { atSec: 3.92, durSec: 2.28, note: 64, gain: 0.42 },
    { atSec: 4.08, durSec: 2.12, note: 72, gain: 0.5 },
  ],
}

// The plagal close high up: F, C, over two long chords.
const HIGH_AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 65, gain: 0.55 },
    { atSec: 0, durSec: 3, note: 69, gain: 0.4 },
    { atSec: 0, durSec: 3, note: 72, gain: 0.4 },
    { atSec: 0, durSec: 3, note: 77, gain: 0.46 },
    { atSec: 3, durSec: 3.1, note: 60, gain: 0.55 },
    { atSec: 3, durSec: 3.1, note: 67, gain: 0.4 },
    { atSec: 3, durSec: 3.1, note: 72, gain: 0.4 },
    { atSec: 3, durSec: 3.1, note: 76, gain: 0.46 },
  ],
}

// A plagal close in D: G, Dm. The D is held, B and G each fall a step, and nothing is a half tone
// from what it leaves, for what rings long.
const DORIAN_AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 43, gain: 0.55 },
    { atSec: 0, durSec: 3.1, note: 59, gain: 0.4 },
    { atSec: 0, durSec: 3.1, note: 62, gain: 0.4 },
    { atSec: 0, durSec: 3.1, note: 67, gain: 0.46 },
    { atSec: 3.1, durSec: 3.1, note: 50, gain: 0.55 },
    { atSec: 3.1, durSec: 3.1, note: 57, gain: 0.4 },
    { atSec: 3.1, durSec: 3.1, note: 62, gain: 0.4 },
    { atSec: 3.1, durSec: 3.1, note: 65, gain: 0.46 },
  ],
}

// A close in G for upper voices: C/E, D with the G held over as a fourth, its F sharp, and G.
const HIGH_SUSPENDED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 72, gain: 0.4 },
    { atSec: 0, durSec: 3.2, note: 79, gain: 0.46 },
    { atSec: 1.8, durSec: 2.4, note: 62, gain: 0.55 },
    { atSec: 1.8, durSec: 2.4, note: 69, gain: 0.4 },
    { atSec: 1.8, durSec: 2.4, note: 74, gain: 0.4 },
    { atSec: 3.2, durSec: 1, note: 78, gain: 0.42 },
    { atSec: 4.2, durSec: 2.2, note: 67, gain: 0.55 },
    { atSec: 4.2, durSec: 2.2, note: 71, gain: 0.4 },
    { atSec: 4.2, durSec: 2.2, note: 74, gain: 0.4 },
    { atSec: 4.2, durSec: 2.2, note: 79, gain: 0.46 },
  ],
}

// A beginning for three upper voices: Dm/F, C/E, Dm, Am/C. The outer two trade F and D, then go down
// together in tenths.
const HIGH_OPENING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 65, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 69, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 74, gain: 0.46 },
    { atSec: 1.5, durSec: 1.5, note: 64, gain: 0.5 },
    { atSec: 1.5, durSec: 1.5, note: 67, gain: 0.4 },
    { atSec: 1.5, durSec: 1.5, note: 76, gain: 0.46 },
    { atSec: 3, durSec: 1.5, note: 62, gain: 0.5 },
    { atSec: 3, durSec: 1.5, note: 69, gain: 0.4 },
    { atSec: 3, durSec: 1.5, note: 77, gain: 0.46 },
    { atSec: 4.5, durSec: 1.8, note: 60, gain: 0.5 },
    { atSec: 4.5, durSec: 1.8, note: 69, gain: 0.4 },
    { atSec: 4.5, durSec: 1.8, note: 76, gain: 0.46 },
  ],
}

// The bass alone: F, G, C, a full close, and F, E, A, a Phrygian half close that goes home.
const BASSES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 41, gain: 0.8 },
    { atSec: 0.9, durSec: 0.9, note: 43, gain: 0.8 },
    { atSec: 1.8, durSec: 1.4, note: 48, gain: 0.8 },
    { atSec: 3.2, durSec: 0.9, note: 41, gain: 0.8 },
    { atSec: 4.1, durSec: 0.9, note: 40, gain: 0.8 },
    { atSec: 5, durSec: 1.6, note: 45, gain: 0.85 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String machine: from a key that cuts the chord to a tail that outlasts it.
  {
    id: 'cadence-cards-shut-with-the-key',
    name: 'Shut with the key',
    category: 'string',
    description:
      'Undoubled saws that stop in a tenth of a second, in a gated room that stops a moment after them.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.02, release: 0.1, tone: 2600, low: 0.6, high: 0.1 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.5, mix: 0.45 } }],
  },
  {
    id: 'cadence-cards-porch-amen',
    name: 'Porch amen',
    category: 'string',
    description:
      'One plain octave of strings with a half-second release, its lows raised, in a small short room.',
    preview: MINOR_AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.35, release: 0.5, tone: 1100, ensemble: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cadence-cards-behind-the-curtain',
    name: 'Behind the curtain',
    category: 'string',
    description:
      'Strings with their top octave full and their top end shut, the onsets fogged away, the whole set behind a wall.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -4, attack: 0.8, release: 1.4, tone: 1700, low: 0.3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 260 } },
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.8 } },
    ],
  },
  {
    id: 'cadence-cards-nave-keeps-it',
    name: 'Nave keeps it',
    category: 'pad',
    description:
      'Slow dark strings with a ten-second release of their own, in an eight-second hall mixed just over half.',
    preview: DORIAN_AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1.1, release: 10, tone: 1500, speed: 0.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.55 } }],
  },
  {
    id: 'cadence-cards-sacristy-positive',
    name: 'Sacristy positive',
    category: 'organ',
    description:
      'Saws with no ensemble, keyed on and off like pipes, with an octave and a fifteenth of stops added on top.',
    preview: CHORALE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -7.5, release: 0.12, low: 0.2, high: 0.4, tone: 3400 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { fifteenth: 0.5, mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'cadence-cards-half-close-fog',
    name: 'Half close fog',
    category: 'pad',
    description:
      'Strings with the octave above full, filtered at six hundred hertz, in a huge space that lets little over a thousand out.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: {
        volume: -3.5,
        attack: 0.7,
        release: 2.5,
        tone: 620,
        low: 0,
        high: 1,
        ensemble: 0.4,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.6, decay: 14 } }],
  },
  {
    id: 'cadence-cards-clerestory-close',
    name: 'Clerestory close',
    category: 'pad',
    description:
      'The upper octave over the played one, bright and slow to let go, with a tail that climbs an octave on each pass.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1, release: 4.5, tone: 9500, low: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 300 } },
      { deviceId: 'shimmer', params: { decay: 9, shimmer: 0.45, mix: 0.4, tone: 8000 } },
    ],
  },
  {
    id: 'cadence-cards-cello-finals',
    name: 'Cello finals',
    category: 'string',
    description:
      'Strings with the low octave full, narrow and dark, that start to sway half a second into a held note, on a dark plate.',
    preview: BASSES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { volume: -3, attack: 0.35, release: 1.6, tone: 900, width: 0.15 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 500, depth: 26 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cadence-cards-third-made-sharp',
    name: 'Third made sharp',
    category: 'string',
    description:
      'Bright fast ensemble strings with a copy sharp on the left and flat on the right, in a small bright chamber.',
    preview: PICARDY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -5.5, attack: 0.12, release: 0.8, high: 0.6, tone: 8000 },
    },
    effects: [
      { deviceId: 'stereo-detune', params: { detune: 16, mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'cadence-cards-fall-to-the-sixth',
    name: 'Fall to the sixth',
    category: 'string',
    description:
      'Hollow strings with a short release, answered by a bucket-brigade delay whose dull repeats drift in pitch.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { volume: -4.5, attack: 0.06, release: 0.35, tone: 5200 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      {
        deviceId: 'analog-delay',
        preset: 'Slow drift',
        params: { time: 720, feedback: 0.55, mix: 0.45 },
      },
    ],
  },
  {
    id: 'cadence-cards-what-both-share',
    name: 'What both share',
    category: 'pad',
    description:
      'Wide strings passed through a filter that keeps what two chords have in common, so the held note rings past the change.',
    preview: AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.5, release: 1.8, tone: 3400, drift: 0.3 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Hanging notes',
        params: { ago: 900, strict: 0.7, ring: 0.8, mix: 0.9 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'cadence-cards-evensong-cassette',
    name: 'Evensong cassette',
    category: 'string',
    description:
      'Three octaves of strings copied to a worn cassette, narrow and unsteady, with a spring tank after the tape.',
    preview: BORROWED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.1, release: 0.9, tone: 3000 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.15, tone: 0.35 } },
      { deviceId: 'spring-reverb', params: { mix: 0.22, drip: 0.2 } },
    ],
  },
  {
    id: 'cadence-cards-bellows-run-out',
    name: 'Bellows run out',
    category: 'pad',
    description:
      'Strings that a breath of three and a half seconds swells and dims, losing their top each time it goes out.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { volume: -5, attack: 0.25, release: 1.2, low: 0.7, high: 0.6, tone: 4800 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: { in: 1, hold: 0.3, out: 1.9, rest: 0.3, depth: 0.8, colour: 0.85, air: 0 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cadence-cards-chord-sags-after',
    name: 'Chord sags after',
    category: 'pad',
    description:
      'A low swell of strings with a six-second release and a tail that darkens and sinks in pitch as it ages.',
    preview: DORIAN_AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 0.8, release: 6, high: 0.3, tone: 1300 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { sag: -14, mix: 0.5 } }],
  },
  {
    id: 'cadence-cards-coloured-panes',
    name: 'Coloured panes',
    category: 'string',
    description:
      'Fast detuned ensemble strings through a twelve-stage phaser that takes ten seconds to come round, on a plate.',
    preview: OPENING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { volume: -3, attack: 0.3, release: 2, tone: 4200, low: 0 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: { stages: 4, rate: 0.1, depth: 80, feedback: 55, centerHz: 900, mix: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'cadence-cards-low-desk-ajar',
    name: 'Low desk ajar',
    category: 'string',
    description:
      'Mono bowed strings under a low filter, an octave added above them as dark as they are, and a triode to thicken both.',
    preview: BASSES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { volume: -2.5, attack: 0.2, release: 0.5, tone: 520 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.7, filter: 900 } },
      { deviceId: 'analog-drive', params: { circuit: 3, drive: 0.35, output: -2 } },
    ],
  },
  {
    id: 'cadence-cards-last-chord-kept',
    name: 'Last chord kept',
    category: 'pad',
    description:
      'Short clear strings caught by a sustain that holds each chord as an even bed until the next one takes over.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.08, release: 0.3, high: 0.7, low: 0.1, tone: 5600, ensemble: 0.4 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        params: { decay: 14, attack: 0.5, glide: 0.5, tone: 0.2, lowCut: 120, mix: 0.75 },
      },
    ],
  },
  {
    id: 'cadence-cards-door-swings-back',
    name: 'Door swings back',
    category: 'string',
    description:
      'Viola strings cut short, with a room drawn backwards: it rises for a second and a half and drops away.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.04, release: 0.15, high: 0.5, tone: 3800, width: 0.8 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.5, mix: 0.6 } }],
  },
  {
    id: 'cadence-cards-crypt-listens',
    name: 'Crypt listens',
    category: 'pad',
    description:
      'Cellos in a narrow dark tunnel of reverb, their fading ends brought up to the level of the chord before.',
    preview: DORIAN_AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { volume: -22.5, attack: 1.2, release: 4, tone: 480, width: 0, ensemble: 0.9 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.45, decay: 5 } },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'cadence-cards-stalls-answer',
    name: 'Stalls answer',
    category: 'pad',
    description:
      'Upper strings whose bass and treble pulse in turn, sent to a hall with the formants of an open vowel.',
    preview: AMEN,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.4, release: 1.5, low: 0.4, tone: 2800, ensemble: 1 },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 3.2, depth: 0.6 } },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 5, mix: 0.5 } },
    ],
  },
  // Organ: the wind stops with the key, or it does not.
  {
    id: 'cadence-cards-flue-cut-off',
    name: 'Flue cut off',
    category: 'organ',
    description:
      'Flute ranks with no reed and a twentieth of a second of release, in a small dull room, the middle brought forward.',
    preview: CHORALE,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.02, release: 0.05, octave: 0.1, sub: 0.3, tone: 4200 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'cadence-cards-every-door-open',
    name: 'Every door open',
    category: 'organ',
    description:
      'Every rank of the organ drawn, let go in under a second into a cathedral of seven seconds.',
    preview: FULL_CLOSE,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { volume: -15, attack: 0.06, release: 0.7, tone: 5600 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } }],
  },
  {
    id: 'cadence-cards-parlour-hymn',
    name: 'Parlour hymn',
    category: 'organ',
    description:
      'A harmonium through a small loudspeaker, heard from across the room with a little of its noise.',
    preview: BORROWED,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { attack: 0.08, release: 0.25, reed: 0.5, sub: 0.1 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.2, distance: 0.55, room: 0.6, noise: 0.1 },
      },
    ],
  },
  {
    id: 'cadence-cards-unison-remains',
    name: 'Unison remains',
    category: 'organ',
    description:
      'A beating celeste whose common notes ring on while what changed between two chords is held back, in a late hall.',
    preview: MINOR_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.5, release: 2.5, tone: 2600, sub: 0.4 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what stays',
        params: { ago: 500, strict: 0.8, ring: 0.5, mix: 0.85 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'cadence-cards-chapel-on-a-reel',
    name: 'Chapel on a reel',
    category: 'organ',
    description:
      'A pump organ with its twelfth drawn and three seconds of release, on a reel that has lost patches of its oxide.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { attack: 0.5, release: 3, twelfth: 0.7, reed: 0.4, tone: 5500 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { hiss: 0.1, age: 0.8, output: -1 } },
    ],
  },
  {
    id: 'cadence-cards-flute-for-amen',
    name: 'Flute for amen',
    category: 'organ',
    description:
      'A trembling flute rank without octave or sub, high and breathy, with a long bright reverb low under it.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { volume: -14.5, octave: 0, breath: 0.6, release: 1, tremulant: 0.8, tone: 6500 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.3 } }],
  },
  {
    id: 'cadence-cards-pipes-past-sleep',
    name: 'Pipes past sleep',
    category: 'organ',
    description:
      'Far pipes that speak over a second and fade over seven, in a wide space with its lows cut away.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 1, release: 7, tone: 2200, sub: 0.2 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.5 } }],
  },
  {
    id: 'cadence-cards-open-fifth-close',
    name: 'Open fifth close',
    category: 'organ',
    description:
      'The twelfth rank alone over its fundamental, with one and two octaves added below and a dark plate behind.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { release: 0.6, attack: 0.1, tone: 3200 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.6, filter: 600 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'cadence-cards-candle-ranks',
    name: 'Candle ranks',
    category: 'organ',
    description:
      'Flute ranks beating against each other under a fifteenth, each band of them flickering upward on its own tremolo.',
    preview: HIGH_SUSPENDED,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.3, release: 1.6, fifteenth: 0.4, tone: 5000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.8, rate: 1.4 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cadence-cards-reed-sings-home',
    name: 'Reed sings home',
    category: 'organ',
    description:
      'A trembling reed rank under a low tone, with a hall behind it that gives everything back as a dark wordless vowel.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.6, attack: 0.1, release: 0.5, tone: 1900 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 7, mix: 0.45 } }],
  },
  {
    id: 'cadence-cards-stair-accordion',
    name: 'Stair accordion',
    category: 'organ',
    description: 'Bright reeds and celeste with a quick release, heard across a stone stairwell.',
    preview: PICARDY,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { release: 0.1, bellows: 0.5, octave: 0.5, tone: 5000 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.6 } }],
  },
  {
    id: 'cadence-cards-drone-of-the-final',
    name: 'Drone of the final',
    category: 'drone',
    description:
      'A breathing reed and sub drone with strings tuned to the key of A minor ringing along beside it.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { volume: -16.5, attack: 0.6, release: 1.2, bellows: 0.6, tone: 3600 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 9, mode: 1, sympathy: 0.8, decay: 6, strings: 6, mix: 0.55 },
      },
    ],
  },
  {
    id: 'cadence-cards-pedal-board-dark',
    name: 'Pedal board dark',
    category: 'organ',
    description:
      'The sub rank with a little reed and a silver stop two octaves up, then a trail of murky bucket-brigade repeats.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.2, release: 1.2, tone: 1200, reed: 0.3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Sub and silver', params: { sub: 0, mix: 0.7 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'cadence-cards-west-door-wind',
    name: 'West door wind',
    category: 'wind',
    description:
      'A flute that is mostly wind noise, its onsets veiled, with gusts passing over it and dimming it.',
    preview: OPENING,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { attack: 0.5, release: 1.2, tone: 4200, octave: 0.3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'weather', params: { kind: 0, exposure: 0.55, voice: 0.15 } },
    ],
  },
  {
    id: 'cadence-cards-hymn-next-house',
    name: 'Hymn next house',
    category: 'organ',
    description:
      'A full organ under a tone of eight hundred hertz, with a hollow tube pressed on its colour and a narrow echo of it.',
    preview: CHORALE,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -12.5, attack: 0.1, release: 0.3, tone: 800 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 140, highCut: 2000 } },
    ],
  },
  {
    id: 'cadence-cards-light-comes-late',
    name: 'Light comes late',
    category: 'organ',
    description:
      'Bright ranks that take most of two seconds to speak and ten to leave, with a fifth climbing out of the tail.',
    preview: AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1.7, release: 10, tone: 6500 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { decay: 7, mix: 0.4 } }],
  },
  {
    id: 'cadence-cards-key-up-silence',
    name: 'Key up, silence',
    category: 'organ',
    description:
      'Upper ranks let go in a few hundredths of a second, through a horn on its fast speed, lightly levelled, with no room at all.',
    preview: FULL_CLOSE,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        volume: -15,
        attack: 0.02,
        release: 0.03,
        octave: 0.8,
        fifteenth: 0.5,
        sub: 0,
        tone: 2400,
      },
    },
    effects: [
      { deviceId: 'rotary', params: { speed: 1, drive: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  // Choir: the last syllable, from one that is spoken to one that stays in the stone.
  {
    id: 'cadence-cards-men-said-amen',
    name: 'Men said amen',
    category: 'voice',
    description:
      'A low section on ah, let go in half a second, in a gated room that is cut off soon after it.',
    preview: MINOR_AMEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { attack: 0.2, release: 0.5, width: 0.3, ensemble: 0.8, tone: 3000 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Gated',
        params: { time: 0.7, mix: 0.3, highCut: 5000 },
      },
    ],
  },
  {
    id: 'cadence-cards-trebles-unlatched',
    name: 'Trebles unlatched',
    category: 'voice',
    description:
      'High thin voices on oo with their octaves added above, in a cathedral tail that lasts past the next card.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.4, release: 3.5, tone: 11000, motion: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up2: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 16, mix: 0.4 } },
    ],
  },
  {
    id: 'cadence-cards-monks-go-out',
    name: 'Monks go out',
    category: 'voice',
    description:
      'Deep still voices on oh who walk away as they sing, darker and farther and back again, into a long room.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.6, release: 2, tone: 2400 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Slow tide',
        params: { wander: 0.9, rate: 0.14, distance: 0.6, decay: 4 },
      },
    ],
  },
  {
    id: 'cadence-cards-breath-after-word',
    name: 'Breath after word',
    category: 'voice',
    description:
      'Voices that are mostly breath, their tones turned down and their air thrown wide, held on for a moment.',
    preview: OPENING,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.6, release: 2, vowel: 0.5, tone: 12000 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { tones: -8, hold: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'cadence-cards-vowel-closes',
    name: 'Vowel closes',
    category: 'voice',
    description:
      'A section whose vowel keeps moving, shut down by a low-pass filter each time its level falls.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 0.4, release: 2.2, vowel: 0.15, tone: 9000 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 420,
          resonance: 1.1,
          envAmount: 70,
          envAttackMs: 250,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cadence-cards-glass-over-the-altos',
    name: 'Glass over the altos',
    category: 'voice',
    description:
      'Bright ee voices with no vibrato, sharpened by a bell colour and answered by scattered points of echo.',
    preview: HIGH_SUSPENDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { volume: -5.5, attack: 0.3, release: 1, width: 0.6 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Bright bell', params: { amount: 1, replace: 0.1 } },
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 1800, mix: 0.4 } },
    ],
  },
  {
    id: 'cadence-cards-cantor-ends-alone',
    name: 'Cantor ends alone',
    category: 'voice',
    description:
      'One singer to a note, with a wide vibrato, in the middle of a cavern made of short echoes, wide and slow to empty.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.2, release: 0.7, vibrato: 24, width: 0, tone: 4000, volume: -6 },
    },
    effects: [{ deviceId: 'swarm-reverb', params: { feedback: 0.75, mix: 0.5, highCut: 3500 } }],
  },
  {
    id: 'cadence-cards-hummed-in-vestry',
    name: 'Hummed in vestry',
    category: 'voice',
    description:
      'Closed-mouth humming under nine hundred hertz, through a soundboard that rings a little with every chord.',
    preview: BORROWED,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.25, release: 0.7, tone: 900 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 5, size: 1.4, material: 0.3, mix: 0.75, air: 0.1 } },
    ],
  },
  {
    id: 'cadence-cards-altos-late-home',
    name: 'Altos late home',
    category: 'voice',
    description:
      'Altos on eh played over by reversed pieces of what they just sang, so each chord leans into the next.',
    preview: HIGH_OPENING,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -5.5, attack: 0.3, release: 0.8, tone: 4200 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 900, feedback: 0.3, smooth: 0.6, mix: 0.55, tone: 4500 },
      },
    ],
  },
  {
    id: 'cadence-cards-tenors-to-octave',
    name: 'Tenors to octave',
    category: 'voice',
    description:
      'Tenors on oh with a quick release, driven hard by a valve and left dry but for a small booth.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.12, release: 0.25, width: 0.2 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0, wobble: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'cadence-cards-waver-at-the-rail',
    name: 'Waver at the rail',
    category: 'voice',
    description:
      'A few singers with a slow wide vibrato, carried round the head once in five seconds, with a spring for a room.',
    preview: MINOR_AMEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { attack: 0.5, release: 1.6, vibrato: 30, vowel: 0.2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle' },
      { deviceId: 'spring-reverb', params: { decay: 4, mix: 0.3, drip: 0.1, tone: 2500 } },
    ],
  },
  {
    id: 'cadence-cards-stone-keeps-singing',
    name: 'Stone keeps singing',
    category: 'voice',
    description:
      'A far choir with a fifteen-second release, its pitches smeared together until the next chord has to push through.',
    preview: AMEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 1.4, release: 15, tone: 2600 },
    },
    effects: [
      { deviceId: 'spectral-blur', params: { blur: 0.75, smear: 0.8, mix: 0.6, highCut: 7000 } },
    ],
  },
  {
    id: 'cadence-cards-syllable-clipped',
    name: 'Syllable clipped',
    category: 'voice',
    description:
      'Short ahs with no tail at all, answered by two closer and softer repeats thrown to the sides.',
    preview: CHORALE,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.12, attack: 0.03, tone: 7000 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 420, skips: 2, loss: 5, throw: 0.9, mix: 0.4 },
      },
    ],
  },
  {
    id: 'cadence-cards-whisper-of-the-fourth',
    name: 'Whisper of the fourth',
    category: 'voice',
    description:
      'Breathy narrow voices between ee and oh, spread into a flock of nine that wanders near and far around them.',
    preview: HIGH_SUSPENDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { attack: 0.4, release: 1.4, vowel: 0.6, voice: 1.1 },
    },
    effects: [{ deviceId: 'murmuration', params: { birds: 9, range: 14, mix: 0.65, speed: 0.6 } }],
  },
  {
    id: 'cadence-cards-gallery-drifts-down',
    name: 'Gallery drifts down',
    category: 'voice',
    description:
      'Restless trebles whose reverb sinks by an octave a little more with each pass, long after they stop.',
    preview: HIGH_OPENING,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -5, attack: 0.4, release: 1.4, vowel: 0.2, voice: 1.28 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: { direction: 1, interval: 1, season: 2, bloom: 0.7, decay: 7, mix: 0.5 },
      },
    ],
  },
  // Chamber strings: the bow at the end of the phrase.
  {
    id: 'cadence-cards-bow-stopped-on-e',
    name: 'Bow stopped on E',
    category: 'string',
    description:
      'Short bows stopped almost at once, squashed and brought up front, with a single tape slap after them.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.15, attack: 0.08, bow: 0.6, players: 3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'cadence-cards-consort-in-d',
    name: 'Consort in D',
    category: 'string',
    description:
      'A straight viol consort with no vibrato, its wood made larger, in a small bright chamber.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { volume: -4, release: 0.6, attack: 0.15 },
    },
    effects: [
      { deviceId: 'size', params: { size: 0.55, detail: 0.7 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'cadence-cards-muted-suspension',
    name: 'Muted suspension',
    category: 'string',
    description:
      'Five muted players, quick to let go, where only what changed between two chords rings on, in a dark hall.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -3.5, attack: 0.3, release: 0.5, bow: 0.8 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'New notes ring',
        params: { ring: 0.8, ago: 500, mix: 0.9 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'cadence-cards-airy-final-bar',
    name: 'Airy final bar',
    category: 'string',
    description:
      'Bows that are nearly all air, with the quiet noise and overtones inside them turned up, on a bright plate.',
    preview: FULL_CLOSE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -2, attack: 0.3, release: 1 },
    },
    effects: [
      { deviceId: 'reveal', params: { amount: 0.8, focus: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'cadence-cards-six-players-home',
    name: 'Six players home',
    category: 'string',
    description:
      'A warm unmuted section of six whose vibrato waits for the long chord, with an octave of stops sounding below.',
    preview: FULL_CLOSE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.25, release: 0.9, vibrato: 4, width: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { wait: 600 } },
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'cadence-cards-halo-of-the-third',
    name: 'Halo of the third',
    category: 'string',
    description:
      'Three still players with no bow noise, shadowed by sine tones an octave higher that outlast them by seconds.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.3, release: 1 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 10, transpose: 12, attack: 300, release: 6, mix: 0.65 },
      },
    ],
  },
  {
    id: 'cadence-cards-ragged-recessional',
    name: 'Ragged recessional',
    category: 'string',
    description: 'Six players far out of step, on a warped and worn record, with hardly a tail.',
    preview: CHORALE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.15, release: 0.4 },
    },
    effects: [{ deviceId: 'vinyl', params: { warp: 0.5, crackle: 0.2, wear: 0.7, tone: -0.3 } }],
  },
  {
    id: 'cadence-cards-bows-never-lifted',
    name: 'Bows never lifted',
    category: 'string',
    description:
      'Six slow bows with the longest release they have, under a tail that keeps swelling after each change.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 1.2, release: 8 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.5 } }],
  },
  {
    id: 'cadence-cards-duet-at-the-gate',
    name: 'Duet at the gate',
    category: 'string',
    description:
      'Two half-muted players apart on either side, followed by dark repeats and scraps of what they played before.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -6, release: 0.4 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail', params: { feedback: 0.6, mix: 0.45 } },
    ],
  },
  {
    id: 'cadence-cards-bridge-left-open',
    name: 'Bridge left open',
    category: 'string',
    description:
      'Glassy bowing on the bridge, its bands drifting up and down from side to side, with a ring of tuned strings.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.35, release: 1.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.3 } },
      { deviceId: 'sympathetic', params: { mode: 2, sympathy: 0.6, mix: 0.4 } },
    ],
  },
  // Felt piano: how the pedal comes up.
  {
    id: 'cadence-cards-lid-brought-down',
    name: 'Lid brought down',
    category: 'keys',
    description:
      'A bare dry piano with the dampers down hard and no sympathetic ring, narrow and dull, warmed by a tube.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -16, resonance: 0, damper: 1, reverbMix: 0, thump: 0.7, width: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { low: 2, highCut: 5000 } },
      { deviceId: 'saturator', params: { curve: 2, driveDb: 5, outputDb: -3 } },
    ],
  },
  {
    id: 'cadence-cards-pedal-through-two',
    name: 'Pedal through two',
    category: 'keys',
    description:
      'A felted piano with the pedal down through both chords, its hum brought up between them on a long dim plate.',
    preview: AMEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -17, hardness: 0.2, resonance: 1, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { damping: 0.7, mix: 0.35 } },
    ],
  },
  {
    id: 'cadence-cards-hands-withdrawn',
    name: 'Hands withdrawn',
    category: 'keys',
    description:
      'A piano with its strikes taken away by a slow swell, so each chord comes in as a bow would bring it, a few cents wide.',
    preview: OPENING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { outputDb: -11.5, resonance: 0.9, felt: 0.2, hardness: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'stereo-detune', params: { detune: 12, mix: 0.45 } },
      { deviceId: 'lift', preset: 'Fill every gap' },
    ],
  },
  {
    id: 'cadence-cards-church-hall-upright',
    name: 'Church hall upright',
    category: 'keys',
    description:
      'An old upright with its unisons far out and a loud action, in a small bright tank with the murmur of a room.',
    preview: BORROWED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -13, felt: 0.1, hardness: 0.7, reverbMix: 0 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 1.8, mix: 0.4 } },
      { deviceId: 'noise-floor', params: { type: 2, level: -54 } },
    ],
  },
  {
    id: 'cadence-cards-tail-turns-major',
    name: 'Tail turns major',
    category: 'keys',
    description:
      'A glassy hard piano whose tail is replayed backwards and an octave up in slow reversed grains.',
    preview: PICARDY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -10, reverbMix: 0.1, stiffness: 1.2, hardness: 0.8 },
    },
    effects: [{ deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.6 } }],
  },
  {
    id: 'cadence-cards-soft-knock-then-sixth',
    name: 'Soft knock, then sixth',
    category: 'keys',
    description:
      'A piano that is nearly all soft thud, with each roll spread from low to high by colours of delay.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -14.5, reverbMix: 0, hardness: 0.1, resonance: 0.6 },
    },
    effects: [{ deviceId: 'prism', params: { time: 1400, feedback: 0.5, mix: 0.55 } }],
  },
  {
    id: 'cadence-cards-room-after-the-hymn',
    name: 'Room after the hymn',
    category: 'keys',
    description:
      'A piano blurred by its pedal and heard mostly as the room it stands in, then sunk a little under water.',
    preview: AMEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -5.5, reverbMix: 0.8, width: 1 },
    },
    effects: [{ deviceId: 'underwater', params: { depth: 0.35, bubbles: 0, waver: 0.5 } }],
  },
  // Prepared piano: the last chord with something between its strings.
  {
    id: 'cadence-cards-bolts-shot-home',
    name: 'Bolts shot home',
    category: 'bell',
    description:
      'Bolted strings struck hard with a short decay, like a latch, in a tank with one spring.',
    preview: ROLLED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { volume: 3.5, decay: 0.4, hammer: 0.8, position: 0.3 },
    },
    effects: [
      { deviceId: 'spring-reverb', params: { springs: 0, decay: 1.5, mix: 0.3, drip: 0.6 } },
    ],
  },
  {
    id: 'cadence-cards-gong-for-the-close',
    name: 'Gong for the close',
    category: 'bell',
    description:
      'Bolts deep in the strings, soft hammers and a long decay, bent from true by a warp, in a hall that keeps its lows.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: -0.5, hammer: 0.15, tone: 0.4 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: 0.12, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'cadence-cards-rubber-stopper',
    name: 'Rubber stopper',
    category: 'plucked',
    description:
      'Rubber between the strings, so every chord is a short thunk, then doubled by a wobbling tape.',
    preview: FULL_CLOSE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { volume: 5.5, amount: 0.7, decay: 0.7 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Wobbly double' }],
  },
  {
    id: 'cadence-cards-felt-on-each-string',
    name: 'Felt on each string',
    category: 'keys',
    description:
      'Strings muted with felt and struck softly, the body of each note held on by a sustain while the knock dies.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: 4.5, decay: 1, amount: 0.8 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.6, decay: 6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'cadence-cards-hymnal-page-turn',
    name: 'Hymnal page turn',
    category: 'keys',
    description:
      'Paper on the strings buzzing with each chord, sampled at a low rate, with a short plate round it.',
    preview: CHORALE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: 2, amount: 0.6, decay: 0.6, tone: 1 },
    },
    effects: [
      { deviceId: 'vintage-digital', params: { rate: 11000, bits: 10, mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'cadence-cards-tin-bells-for-the-amen',
    name: 'Tin bells for the amen',
    category: 'bell',
    description:
      'Bolts near the end of the strings, thin and bright, throwing off higher sparks in a dark hall.',
    preview: HIGH_AMEN,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: -1, hammer: 0.5, decay: 1.4 },
    },
    effects: [
      { deviceId: 'glints', params: { density: 7, mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'cadence-cards-mixed-congregation',
    name: 'Mixed congregation',
    category: 'keys',
    description:
      'Every key with its own object, dark and long in decay, in a swarm of close echoes that thickens as it goes.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: { volume: 1.5, decay: 2.6, rattle: 0.2 },
    },
    effects: [{ deviceId: 'swarm-reverb', params: { length: 0.3, feedback: 0.7, mix: 0.5 } }],
  },
  // Magnet piano: a chord with no beginning, so the end is all there is.
  {
    id: 'cadence-cards-glass-turned-off',
    name: 'Glass turned off',
    category: 'keys',
    description:
      'Magnet strings that speak at once and are damped in a tenth of a second, pulsing evenly under a tremolo.',
    preview: CHORALE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { volume: -12.5, bloom: 0.12, damper: 0.1, shimmer: 0.2, body: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', params: { rate: 5.5, depth: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'cadence-cards-hammer-says-amen',
    name: 'Hammer says amen',
    category: 'keys',
    description:
      'A felt hammer at full weight over magnets that take six seconds to rise, its wood pressed into a dark box.',
    preview: AMEN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { volume: -9, damper: 2.5, sympathy: 0.8 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Dark box', params: { replace: 0.3 } }],
  },
  {
    id: 'cadence-cards-twelfth-above-the-close',
    name: 'Twelfth above the close',
    category: 'keys',
    description:
      'Strings sung on their third harmonic and damped slowly, in a modulated space with its lows cut away.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.4, damper: 3, bright: 0.4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { decay: 7, mix: 0.4 } }],
  },
  {
    id: 'cadence-cards-octave-left-standing',
    name: 'Octave left standing',
    category: 'keys',
    description:
      'The second harmonic with every string ringing in sympathy, while three detuned voices sway slowly round it.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { bloom: 0.5, damper: 1.6 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.3 } }],
  },
  {
    id: 'cadence-cards-reed-by-the-font',
    name: 'Reed by the font',
    category: 'keys',
    description:
      'Quick bright magnet tones like a reed, through a stopped pipe, with a short dark room and no more.',
    preview: BORROWED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { volume: -15, damper: 0.3, bright: 0.9 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 2, size: 0.8, mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'cadence-cards-tide-in-the-crypt',
    name: 'Tide in the crypt',
    category: 'pad',
    description:
      'Low bright magnets with eight seconds of damper, recorded over themselves through a room until they are its tones.',
    preview: DORIAN_AMEN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { volume: -13.5, bloom: 0.8, damper: 8 },
    },
    effects: [{ deviceId: 'generations', params: { length: 2, keep: 0.75, hiss: 0, mix: 0.5 } }],
  },
  // Dusk: a filter that closes.
  {
    id: 'cadence-cards-sun-off-the-glass',
    name: 'Sun off the glass',
    category: 'pad',
    description:
      'Saw and pulse that start bright and close as each chord swells in over half a second, with both choruses running.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.5, release: 1.5, chorus: 3, resonance: 0.3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } }],
  },
  {
    id: 'cadence-cards-clarinets-in-the-porch',
    name: 'Clarinets in the porch',
    category: 'wind',
    description:
      'Hollow squares at six hundred and fifty hertz, quick to stop, carried to a combo speaker and a few steps off.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.1, release: 0.15, chorus: 0 },
    },
    effects: [
      { deviceId: 're-amp', params: { speaker: 1, drive: 0.15, distance: 0.5 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'cadence-cards-pulse-for-evening',
    name: 'Pulse for evening',
    category: 'pad',
    description:
      'A moving pulse with a twelve-second release, slowly phased by a shift of less than a hertz, in an airy hall.',
    preview: AMEN,
    instrument: {
      deviceId: 'dusk',
      preset: 'Long pulse swell',
      params: { volume: -14, attack: 0.9, release: 12, sub: 0.2 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'cadence-cards-stopped-diapason-shut',
    name: 'Stopped diapason shut',
    category: 'organ',
    description:
      'A square whistling through its own filter like a stopped pipe, doubled a few cents each way in a tight chamber.',
    preview: PICARDY,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { release: 0.2, cutoff: 1100 },
    },
    effects: [
      { deviceId: 'stereo-detune', params: { detune: 7, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'cadence-cards-keys-under-lamplight',
    name: 'Keys under lamplight',
    category: 'keys',
    description:
      'A plucked filter over saw and square with a chorus on it, repeated dull and unevenly by three tape heads.',
    preview: ROLLED,
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { release: 0.6, cutoff: 700, envelope: 0.4 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.4 } }],
  },
  // Ember: brass, glass and breath for the last bar.
  {
    id: 'cadence-cards-brass-at-the-rail',
    name: 'Brass at the rail',
    category: 'wind',
    description:
      'Detuned saws, four to a note, that open and stop like quiet brass, with a few hard echoes off separate walls.',
    preview: MINOR_AMEN,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        ampAttack: 0.09,
        filterAttack: 0.25,
        cutoff: 380,
        ampRelease: 0.3,
        unisonVoices: 4,
        unisonDetune: 9,
        unisonSpread: 0.8,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Hard echoes', params: { mix: 0.3 } }],
  },
  {
    id: 'cadence-cards-hollow-benediction',
    name: 'Hollow benediction',
    category: 'pad',
    description:
      'A square and a triangle an octave up, let go in six seconds, with a bank of bowls in A minor answering.',
    preview: DORIAN_AMEN,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { volume: -6, ampAttack: 0.4, ampRelease: 6, cutoff: 1200 },
    },
    effects: [{ deviceId: 'bowls', params: { root: 9, scale: 3, ring: 8, mix: 0.45 } }],
  },
  {
    id: 'cadence-cards-airy-dismissal',
    name: 'Airy dismissal',
    category: 'pad',
    description:
      'Detuned saws an octave apart with noise in them, quick to leave, opened by a flanger that stands almost still.',
    preview: OPENING,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: { ampAttack: 0.25, ampRelease: 0.4, noiseLevel: 0.1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 180, highCut: 9000 } },
    ],
  },
  {
    id: 'cadence-cards-bell-pair-closing',
    name: 'Bell pair closing',
    category: 'bell',
    description:
      'Two sines an octave apart struck and dying, thrown from side to side in repeats that slow down.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { volume: 2.5, osc2Coarse: 12, ampDecay: 2.5, ampRelease: 2 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 180, bounce: 1.25, skips: 6, throw: 0.9, mix: 0.45 },
      },
    ],
  },
  {
    id: 'cadence-cards-dark-final-ground',
    name: 'Dark final ground',
    category: 'drone',
    description:
      'A saw and a narrow pulse in unison under a driven filter at a few hundred hertz, blurred into a soft wall of fuzz.',
    preview: BASSES,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        volume: -4,
        ampAttack: 0.5,
        ampRelease: 4,
        subLevel: 0,
        osc2Coarse: 0,
        cutoff: 420,
      },
    },
    effects: [{ deviceId: 'haze', params: { mix: 0.4, decay: 5 } }],
  },
  // Thesis: each note with its reflection in the scale, where the held note is the mirror.
  {
    id: 'cadence-cards-mirror-at-the-close',
    name: 'Mirror at the close',
    category: 'texture',
    description:
      'Bands on each note, its mirror round D and an octave flip, strummed apart and repeated dotted on tape.',
    preview: CLAUSULA,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        attack: 0.02,
        release: 0.9,
        mode: 0,
        resonance: 95,
        octaflipEnabled: 1,
        strum: 90,
        width: 100,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
      { deviceId: 'ambient-limiter', params: { gain: 4, ceiling: -9 } },
    ],
  },
  {
    id: 'cadence-cards-choir-of-reflections',
    name: 'Choir of reflections',
    category: 'voice',
    description:
      'High-resonance bands round E with their octave flips, pressed into an open vowel and let go over four seconds.',
    preview: AMEN,
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { attack: 0.8, resonance: 60 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel' },
      { deviceId: 'ambient-limiter', params: { gain: 3, ceiling: -9 } },
    ],
  },
  {
    id: 'cadence-cards-strummed-out',
    name: 'Strummed out',
    category: 'plucked',
    description:
      'Bands strummed over eighty milliseconds and quick to die, through a horn speaker in a small room.',
    preview: HALF_CLOSE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { scale: 0, release: 0.4, attack: 0.02 },
    },
    effects: [{ deviceId: 're-amp', params: { speaker: 3, drive: 0.1, room: 0.2, output: 3 } }],
  },
  {
    id: 'cadence-cards-dark-e-as-home',
    name: 'Dark E as home',
    category: 'drone',
    description:
      'Wide low bands in E Phrygian with two and a half seconds of release, drifting, at the back of a hall.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 0.5, width: 80, release: 2.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall' },
      { deviceId: 'ambient-limiter', params: { gain: 3, ceiling: -9 } },
    ],
  },
  {
    id: 'cadence-cards-gravity-of-c',
    name: 'Gravity of C',
    category: 'texture',
    description:
      'Strummed bands pulled toward C and let go over five seconds, broken by a pulse that keeps seeming to slow.',
    preview: SUSPENDED,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { center: 60, resonance: 45 },
    },
    effects: [
      { deviceId: 'winding-down', params: { rate: 5, halving: 8, depth: 0.8 } },
      { deviceId: 'ambient-limiter', params: { gain: 3, ceiling: -9 } },
    ],
  },
  // Staircase: the cadence that never lands, held still or walking.
  {
    id: 'cadence-cards-stairs-held-still',
    name: 'Stairs held still',
    category: 'organ',
    description:
      'Six stacked octaves with their motion stopped, keyed like an organ and let go at once, beside a drifting tape copy.',
    preview: DECEPTIVE,
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { release: 0.2, shape: 0.6 },
    },
    effects: [{ deviceId: 'tape', preset: 'Drifting chorus' }],
  },
  {
    id: 'cadence-cards-descent-without-tonic',
    name: 'Descent without tonic',
    category: 'pad',
    description:
      'A dark stack of octaves gliding down for as long as a chord is held, with a tail that carries the fall on.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'staircase',
      preset: 'Slow descent',
      params: { attack: 0.4, release: 2, centre: 260 },
    },
    effects: [{ deviceId: 'spiral', params: { climb: -4, decay: 6, mix: 0.4 } }],
  },
  {
    id: 'cadence-cards-chord-walked-upstairs',
    name: 'Chord walked upstairs',
    category: 'texture',
    description:
      'Each held chord climbed note by note in soft hollow tones, every step trailing dim echoes off to the side.',
    preview: AMEN,
    instrument: {
      deviceId: 'staircase',
      preset: 'Narrow beam',
      params: { speed: 0.35, attack: 0.1, release: 1.2 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { spread: 0.9, mix: 0.35 } },
    ],
  },
]
