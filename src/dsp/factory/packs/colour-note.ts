import { type FactoryPreset, type Phrase } from '../types'

// A chord that needs one note from outside the key: a minor plagal, a raised seventh, a blue note,
// a bass that falls by semitones. Plucked basses carry the chromatic bass lines; organ, strings,
// piano and slow synthesizers hold the chords in which the one altered note has to be heard.

// C, F, F minor, C: the one colour note is the A flat, which sinks to G under a held C.
const PLAGAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.41, note: 48, gain: 0.45 },
    { atSec: 0.05, durSec: 1.36, note: 60, gain: 0.4 },
    { atSec: 0.1, durSec: 1.31, note: 64, gain: 0.4 },
    { atSec: 0.15, durSec: 1.26, note: 67, gain: 0.4 },
    { atSec: 0.2, durSec: 1.21, note: 72, gain: 0.36 },
    { atSec: 1.45, durSec: 1.41, note: 53, gain: 0.45 },
    { atSec: 1.5, durSec: 1.36, note: 60, gain: 0.4 },
    { atSec: 1.55, durSec: 1.31, note: 65, gain: 0.4 },
    { atSec: 1.6, durSec: 1.26, note: 69, gain: 0.46 },
    { atSec: 1.65, durSec: 1.21, note: 72, gain: 0.36 },
    { atSec: 2.9, durSec: 1.41, note: 53, gain: 0.45 },
    { atSec: 2.95, durSec: 1.36, note: 60, gain: 0.4 },
    { atSec: 3, durSec: 1.31, note: 65, gain: 0.4 },
    { atSec: 3.05, durSec: 1.26, note: 68, gain: 0.5 },
    { atSec: 3.1, durSec: 1.21, note: 72, gain: 0.36 },
    { atSec: 4.35, durSec: 1.66, note: 48, gain: 0.45 },
    { atSec: 4.4, durSec: 1.61, note: 60, gain: 0.4 },
    { atSec: 4.45, durSec: 1.56, note: 64, gain: 0.4 },
    { atSec: 4.5, durSec: 1.51, note: 67, gain: 0.4 },
    { atSec: 4.55, durSec: 1.46, note: 72, gain: 0.36 },
  ],
}
// A minor, D minor, E7, A minor: the G sharp is the colour note and rises to A, over an added fifth.
const RAISED_SEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.41, note: 45, gain: 0.45 },
    { atSec: 0.02, durSec: 1.39, note: 60, gain: 0.36 },
    { atSec: 0.04, durSec: 1.37, note: 64, gain: 0.36 },
    { atSec: 0.06, durSec: 1.35, note: 69, gain: 0.5 },
    { atSec: 1.45, durSec: 1.41, note: 50, gain: 0.45 },
    { atSec: 1.47, durSec: 1.39, note: 62, gain: 0.36 },
    { atSec: 1.49, durSec: 1.37, note: 65, gain: 0.36 },
    { atSec: 1.51, durSec: 1.35, note: 69, gain: 0.5 },
    { atSec: 2.9, durSec: 1.41, note: 52, gain: 0.45 },
    { atSec: 2.92, durSec: 1.39, note: 59, gain: 0.36 },
    { atSec: 2.94, durSec: 1.37, note: 62, gain: 0.36 },
    { atSec: 2.96, durSec: 1.35, note: 68, gain: 0.5 },
    { atSec: 4.35, durSec: 1.76, note: 45, gain: 0.45 },
    { atSec: 4.37, durSec: 1.74, note: 57, gain: 0.36 },
    { atSec: 4.39, durSec: 1.72, note: 60, gain: 0.36 },
    { atSec: 4.4, durSec: 1.71, note: 64, gain: 0.3 },
    { atSec: 4.41, durSec: 1.7, note: 69, gain: 0.5 },
  ],
}
// A, G sharp, G, F sharp, F, E in the bass, under Am, E7, C, D7, D minor, E, while the top voice
// rises A, B, C, C, D, E against it; the G sharp comes back an octave up.
const FALLING_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.99, note: 45, gain: 0.6 },
    { atSec: 0.02, durSec: 0.97, note: 60, gain: 0.36 },
    { atSec: 0.04, durSec: 0.95, note: 64, gain: 0.36 },
    { atSec: 0.06, durSec: 0.93, note: 69, gain: 0.5 },
    { atSec: 1.03, durSec: 0.99, note: 44, gain: 0.6 },
    { atSec: 1.05, durSec: 0.97, note: 62, gain: 0.36 },
    { atSec: 1.07, durSec: 0.95, note: 64, gain: 0.36 },
    { atSec: 1.09, durSec: 0.93, note: 71, gain: 0.5 },
    { atSec: 2.06, durSec: 0.99, note: 43, gain: 0.6 },
    { atSec: 2.08, durSec: 0.97, note: 60, gain: 0.36 },
    { atSec: 2.1, durSec: 0.95, note: 64, gain: 0.36 },
    { atSec: 2.12, durSec: 0.93, note: 72, gain: 0.5 },
    { atSec: 3.09, durSec: 0.99, note: 42, gain: 0.6 },
    { atSec: 3.11, durSec: 0.97, note: 57, gain: 0.36 },
    { atSec: 3.13, durSec: 0.95, note: 62, gain: 0.36 },
    { atSec: 3.15, durSec: 0.93, note: 72, gain: 0.5 },
    { atSec: 4.12, durSec: 0.99, note: 41, gain: 0.6 },
    { atSec: 4.14, durSec: 0.97, note: 57, gain: 0.36 },
    { atSec: 4.16, durSec: 0.95, note: 62, gain: 0.36 },
    { atSec: 4.18, durSec: 0.93, note: 74, gain: 0.5 },
    { atSec: 5.15, durSec: 1.26, note: 40, gain: 0.6 },
    { atSec: 5.17, durSec: 1.24, note: 56, gain: 0.36 },
    { atSec: 5.19, durSec: 1.22, note: 59, gain: 0.36 },
    { atSec: 5.21, durSec: 1.2, note: 76, gain: 0.48 },
  ],
}
// A minor, B flat over D, E7, A minor: the B flat falls to the G sharp and the tonic lies
// between them.
const FLAT_SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.46, note: 45, gain: 0.45 },
    { atSec: 0.03, durSec: 1.43, note: 60, gain: 0.36 },
    { atSec: 0.06, durSec: 1.4, note: 64, gain: 0.36 },
    { atSec: 0.09, durSec: 1.37, note: 69, gain: 0.5 },
    { atSec: 1.5, durSec: 1.46, note: 50, gain: 0.45 },
    { atSec: 1.53, durSec: 1.43, note: 62, gain: 0.36 },
    { atSec: 1.56, durSec: 1.4, note: 65, gain: 0.36 },
    { atSec: 1.59, durSec: 1.37, note: 70, gain: 0.5 },
    { atSec: 3, durSec: 1.46, note: 52, gain: 0.45 },
    { atSec: 3.03, durSec: 1.43, note: 62, gain: 0.36 },
    { atSec: 3.06, durSec: 1.4, note: 64, gain: 0.36 },
    { atSec: 3.09, durSec: 1.37, note: 68, gain: 0.5 },
    { atSec: 4.5, durSec: 1.76, note: 45, gain: 0.45 },
    { atSec: 4.53, durSec: 1.73, note: 60, gain: 0.36 },
    { atSec: 4.56, durSec: 1.7, note: 64, gain: 0.36 },
    { atSec: 4.59, durSec: 1.67, note: 69, gain: 0.5 },
  ],
}
// C, A7 over C sharp, D minor, G7, C: the C sharp in the bass leads up to D.
const BORROWED_DOMINANT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.16, note: 48, gain: 0.45 },
    { atSec: 0.03, durSec: 1.13, note: 60, gain: 0.36 },
    { atSec: 0.06, durSec: 1.1, note: 64, gain: 0.36 },
    { atSec: 0.09, durSec: 1.07, note: 67, gain: 0.5 },
    { atSec: 1.2, durSec: 1.16, note: 49, gain: 0.55 },
    { atSec: 1.23, durSec: 1.13, note: 57, gain: 0.36 },
    { atSec: 1.26, durSec: 1.1, note: 64, gain: 0.36 },
    { atSec: 1.29, durSec: 1.07, note: 67, gain: 0.5 },
    { atSec: 2.4, durSec: 1.16, note: 50, gain: 0.45 },
    { atSec: 2.43, durSec: 1.13, note: 57, gain: 0.36 },
    { atSec: 2.46, durSec: 1.1, note: 62, gain: 0.36 },
    { atSec: 2.49, durSec: 1.07, note: 65, gain: 0.5 },
    { atSec: 3.6, durSec: 1.16, note: 43, gain: 0.45 },
    { atSec: 3.63, durSec: 1.13, note: 55, gain: 0.36 },
    { atSec: 3.66, durSec: 1.1, note: 59, gain: 0.36 },
    { atSec: 3.69, durSec: 1.07, note: 62, gain: 0.36 },
    { atSec: 3.72, durSec: 1.04, note: 65, gain: 0.5 },
    { atSec: 4.8, durSec: 1.46, note: 48, gain: 0.45 },
    { atSec: 4.83, durSec: 1.43, note: 55, gain: 0.36 },
    { atSec: 4.86, durSec: 1.4, note: 60, gain: 0.36 },
    { atSec: 4.89, durSec: 1.37, note: 64, gain: 0.5 },
  ],
}
// Over a held C: C, D, F minor, C, so F sharp falls through F to E and A through A flat to G.
const OVER_A_PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.58, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 1.58, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 1.58, note: 72, gain: 0.44 },
    { atSec: 1.6, durSec: 1.58, note: 66, gain: 0.36 },
    { atSec: 1.6, durSec: 1.58, note: 69, gain: 0.36 },
    { atSec: 1.6, durSec: 1.58, note: 74, gain: 0.44 },
    { atSec: 3.2, durSec: 1.58, note: 65, gain: 0.36 },
    { atSec: 3.2, durSec: 1.58, note: 68, gain: 0.36 },
    { atSec: 3.2, durSec: 1.58, note: 72, gain: 0.44 },
    { atSec: 4.8, durSec: 1.8, note: 64, gain: 0.36 },
    { atSec: 4.8, durSec: 1.8, note: 67, gain: 0.36 },
    { atSec: 4.8, durSec: 1.8, note: 72, gain: 0.44 },
  ],
}
// A minor, F, G, A major: the C sharp of the last chord is the only note outside the key.
const MAJOR_THIRD_LAST: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.41, note: 45, gain: 0.45 },
    { atSec: 0.02, durSec: 1.39, note: 60, gain: 0.36 },
    { atSec: 0.04, durSec: 1.37, note: 64, gain: 0.36 },
    { atSec: 0.06, durSec: 1.35, note: 69, gain: 0.5 },
    { atSec: 1.45, durSec: 1.41, note: 41, gain: 0.45 },
    { atSec: 1.47, durSec: 1.39, note: 60, gain: 0.36 },
    { atSec: 1.49, durSec: 1.37, note: 65, gain: 0.36 },
    { atSec: 1.51, durSec: 1.35, note: 69, gain: 0.5 },
    { atSec: 2.9, durSec: 1.41, note: 43, gain: 0.45 },
    { atSec: 2.92, durSec: 1.39, note: 59, gain: 0.36 },
    { atSec: 2.94, durSec: 1.37, note: 62, gain: 0.36 },
    { atSec: 2.96, durSec: 1.35, note: 67, gain: 0.5 },
    { atSec: 4.35, durSec: 1.96, note: 45, gain: 0.45 },
    { atSec: 4.37, durSec: 1.94, note: 57, gain: 0.36 },
    { atSec: 4.39, durSec: 1.92, note: 61, gain: 0.52 },
    { atSec: 4.41, durSec: 1.9, note: 64, gain: 0.42 },
  ],
}
// Under a repeated C an inner voice falls C, B, B flat, A, A flat, G: C, C major seven, C7, F, F
// minor, C.
const INNER_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.02, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 1.02, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 1.02, note: 64, gain: 0.32 },
    { atSec: 0, durSec: 1.02, note: 67, gain: 0.32 },
    { atSec: 0, durSec: 1.02, note: 72, gain: 0.32 },
    { atSec: 1.05, durSec: 1.02, note: 48, gain: 0.42 },
    { atSec: 1.05, durSec: 1.02, note: 59, gain: 0.55 },
    { atSec: 1.05, durSec: 1.02, note: 64, gain: 0.32 },
    { atSec: 1.05, durSec: 1.02, note: 67, gain: 0.32 },
    { atSec: 1.05, durSec: 1.02, note: 72, gain: 0.32 },
    { atSec: 2.1, durSec: 1.02, note: 48, gain: 0.42 },
    { atSec: 2.1, durSec: 1.02, note: 58, gain: 0.55 },
    { atSec: 2.1, durSec: 1.02, note: 64, gain: 0.32 },
    { atSec: 2.1, durSec: 1.02, note: 67, gain: 0.32 },
    { atSec: 2.1, durSec: 1.02, note: 72, gain: 0.32 },
    { atSec: 3.15, durSec: 1.02, note: 41, gain: 0.42 },
    { atSec: 3.15, durSec: 1.02, note: 57, gain: 0.55 },
    { atSec: 3.15, durSec: 1.02, note: 65, gain: 0.32 },
    { atSec: 3.15, durSec: 1.02, note: 72, gain: 0.32 },
    { atSec: 4.2, durSec: 1.02, note: 41, gain: 0.42 },
    { atSec: 4.2, durSec: 1.02, note: 56, gain: 0.55 },
    { atSec: 4.2, durSec: 1.02, note: 65, gain: 0.32 },
    { atSec: 4.2, durSec: 1.02, note: 72, gain: 0.32 },
    { atSec: 5.25, durSec: 1.35, note: 48, gain: 0.42 },
    { atSec: 5.25, durSec: 1.35, note: 55, gain: 0.55 },
    { atSec: 5.25, durSec: 1.35, note: 64, gain: 0.32 },
    { atSec: 5.25, durSec: 1.35, note: 72, gain: 0.32 },
  ],
}
// Over a fifth on A one line turns round its tonic: A, C, B, A, then the G sharp below, and home.
const NEIGHBOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 45, gain: 0.34 },
    { atSec: 0, durSec: 6.8, note: 52, gain: 0.28 },
    { atSec: 0.1, durSec: 0.95, note: 69, gain: 0.5 },
    { atSec: 1.1, durSec: 0.95, note: 72, gain: 0.55 },
    { atSec: 2.1, durSec: 0.95, note: 71, gain: 0.5 },
    { atSec: 3.1, durSec: 0.95, note: 69, gain: 0.45 },
    { atSec: 4.1, durSec: 1.35, note: 68, gain: 0.58 },
    { atSec: 5.5, durSec: 1.4, note: 69, gain: 0.48 },
  ],
}
// For sounds slow to speak: F major seven, F minor six, C. The A flat sinks to G as the D rises to E.
const SLOW_AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 53, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 60, gain: 0.38 },
    { atSec: 0, durSec: 2.2, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 2.2, note: 69, gain: 0.46 },
    { atSec: 2.25, durSec: 2.2, note: 53, gain: 0.45 },
    { atSec: 2.25, durSec: 2.2, note: 60, gain: 0.38 },
    { atSec: 2.25, durSec: 2.2, note: 62, gain: 0.36 },
    { atSec: 2.25, durSec: 2.2, note: 68, gain: 0.5 },
    { atSec: 4.5, durSec: 2.3, note: 48, gain: 0.48 },
    { atSec: 4.5, durSec: 2.3, note: 60, gain: 0.38 },
    { atSec: 4.5, durSec: 2.3, note: 64, gain: 0.36 },
    { atSec: 4.5, durSec: 2.3, note: 67, gain: 0.46 },
  ],
}
// For sounds slow to speak: A minor over C, E7 over B, A minor. The G sharp turns under A over a held E.
const SLOW_SHARP: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 6.7, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 2.2, note: 69, gain: 0.44 },
    { atSec: 0, durSec: 2.2, note: 72, gain: 0.46 },
    { atSec: 2.25, durSec: 2.2, note: 47, gain: 0.46 },
    { atSec: 2.25, durSec: 2.2, note: 68, gain: 0.5 },
    { atSec: 2.25, durSec: 2.2, note: 74, gain: 0.44 },
    { atSec: 4.5, durSec: 2.2, note: 45, gain: 0.48 },
    { atSec: 4.5, durSec: 2.2, note: 69, gain: 0.44 },
    { atSec: 4.5, durSec: 2.2, note: 72, gain: 0.46 },
  ],
}
// C, F7, C, G7, C: the E flat of the F7 bends the third of C and the E comes back after it.
const BLUE_THIRD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.25, note: 48, gain: 0.46 },
    { atSec: 0.02, durSec: 1.23, note: 64, gain: 0.42 },
    { atSec: 0.04, durSec: 1.21, note: 67, gain: 0.36 },
    { atSec: 0.06, durSec: 1.19, note: 72, gain: 0.4 },
    { atSec: 1.3, durSec: 1.25, note: 53, gain: 0.46 },
    { atSec: 1.32, durSec: 1.23, note: 63, gain: 0.52 },
    { atSec: 1.34, durSec: 1.21, note: 69, gain: 0.36 },
    { atSec: 1.36, durSec: 1.19, note: 72, gain: 0.4 },
    { atSec: 2.6, durSec: 1.25, note: 48, gain: 0.46 },
    { atSec: 2.62, durSec: 1.23, note: 64, gain: 0.42 },
    { atSec: 2.64, durSec: 1.21, note: 67, gain: 0.36 },
    { atSec: 2.66, durSec: 1.19, note: 72, gain: 0.4 },
    { atSec: 3.9, durSec: 1.25, note: 43, gain: 0.46 },
    { atSec: 3.92, durSec: 1.23, note: 62, gain: 0.38 },
    { atSec: 3.94, durSec: 1.21, note: 65, gain: 0.4 },
    { atSec: 3.96, durSec: 1.19, note: 71, gain: 0.4 },
    { atSec: 5.2, durSec: 1.5, note: 48, gain: 0.48 },
    { atSec: 5.22, durSec: 1.48, note: 60, gain: 0.36 },
    { atSec: 5.24, durSec: 1.46, note: 64, gain: 0.42 },
    { atSec: 5.26, durSec: 1.44, note: 72, gain: 0.42 },
  ],
}
// For bells, over C: G, then A and high C on F, A flat and F on F minor, G and E at home.
const BELL_AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 60, gain: 0.42 },
    { atSec: 0.1, durSec: 1.05, note: 79, gain: 0.5 },
    { atSec: 1.2, durSec: 1.15, note: 65, gain: 0.38 },
    { atSec: 1.2, durSec: 0.6, note: 81, gain: 0.5 },
    { atSec: 1.8, durSec: 0.6, note: 84, gain: 0.44 },
    { atSec: 2.4, durSec: 2.3, note: 65, gain: 0.38 },
    { atSec: 2.4, durSec: 2.3, note: 60, gain: 0.36 },
    { atSec: 2.5, durSec: 1.1, note: 80, gain: 0.56 },
    { atSec: 3.6, durSec: 0.6, note: 77, gain: 0.44 },
    { atSec: 4.8, durSec: 2, note: 60, gain: 0.42 },
    { atSec: 4.8, durSec: 0.8, note: 79, gain: 0.48 },
    { atSec: 5.6, durSec: 1.4, note: 76, gain: 0.44 },
  ],
}
// For bells, the same turn an octave up: A minor, E under the G sharp, A minor.
const NEIGHBOUR_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.9, note: 57, gain: 0.36 },
    { atSec: 0, durSec: 3.9, note: 64, gain: 0.32 },
    { atSec: 0.1, durSec: 0.95, note: 81, gain: 0.46 },
    { atSec: 1.1, durSec: 0.95, note: 84, gain: 0.5 },
    { atSec: 2.1, durSec: 0.95, note: 83, gain: 0.46 },
    { atSec: 3.1, durSec: 0.95, note: 81, gain: 0.42 },
    { atSec: 4.1, durSec: 1.35, note: 59, gain: 0.34 },
    { atSec: 4.1, durSec: 1.35, note: 64, gain: 0.32 },
    { atSec: 4.15, durSec: 1.3, note: 80, gain: 0.56 },
    { atSec: 5.5, durSec: 1.4, note: 57, gain: 0.36 },
    { atSec: 5.5, durSec: 1.4, note: 64, gain: 0.32 },
    { atSec: 5.55, durSec: 1.35, note: 81, gain: 0.46 },
  ],
}
// One held A, for an instrument that steps A, G sharp, G, F sharp, F, E by itself, one a second.
const ONE_KEY: Phrase = {
  notes: [{ atSec: 0, durSec: 5.9, note: 57, gain: 0.7 }],
}
// Bass alone: A, G sharp, G, F sharp, F, E, one step a second.
const BASS_FALLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.98, note: 45, gain: 0.7 },
    { atSec: 1, durSec: 0.98, note: 44, gain: 0.7 },
    { atSec: 2, durSec: 0.98, note: 43, gain: 0.66 },
    { atSec: 3, durSec: 0.98, note: 42, gain: 0.7 },
    { atSec: 4, durSec: 0.98, note: 41, gain: 0.66 },
    { atSec: 5, durSec: 1.5, note: 40, gain: 0.7 },
  ],
}
// Bass alone: C up to F, the A flat, G and home, the roots and the sixth of a minor plagal close.
const BASS_AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 36, gain: 0.7 },
    { atSec: 1.4, durSec: 1.3, note: 41, gain: 0.66 },
    { atSec: 2.8, durSec: 1.3, note: 44, gain: 0.75 },
    { atSec: 4.2, durSec: 0.7, note: 43, gain: 0.62 },
    { atSec: 4.95, durSec: 1.8, note: 36, gain: 0.7 },
  ],
}
// Bass alone on A minor: A, C, D, the E flat between D and E, D, C, G, A.
const BASS_BLUE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.85, note: 33, gain: 0.7 },
    { atSec: 0.9, durSec: 0.4, note: 36, gain: 0.62 },
    { atSec: 1.35, durSec: 0.4, note: 38, gain: 0.62 },
    { atSec: 1.8, durSec: 1.1, note: 39, gain: 0.75 },
    { atSec: 2.95, durSec: 0.4, note: 38, gain: 0.6 },
    { atSec: 3.4, durSec: 0.4, note: 36, gain: 0.6 },
    { atSec: 3.85, durSec: 0.6, note: 31, gain: 0.65 },
    { atSec: 4.5, durSec: 1.9, note: 33, gain: 0.72 },
  ],
}
// Bass alone: C, C sharp, D, F sharp, G, C, each sharp leading up a semitone.
const BASS_CLIMBS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 36, gain: 0.7 },
    { atSec: 1.1, durSec: 1.05, note: 37, gain: 0.72 },
    { atSec: 2.2, durSec: 1.05, note: 38, gain: 0.66 },
    { atSec: 3.3, durSec: 1.05, note: 42, gain: 0.74 },
    { atSec: 4.4, durSec: 1.05, note: 43, gain: 0.66 },
    { atSec: 5.5, durSec: 1.4, note: 36, gain: 0.72 },
  ],
}
// Bass alone: A, then high F, D, E, down to the G sharp, and A.
const BASS_LEADS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 45, gain: 0.66 },
    { atSec: 1.15, durSec: 0.8, note: 53, gain: 0.6 },
    { atSec: 2, durSec: 0.8, note: 50, gain: 0.6 },
    { atSec: 2.85, durSec: 1, note: 52, gain: 0.64 },
    { atSec: 3.9, durSec: 1.3, note: 44, gain: 0.74 },
    { atSec: 5.25, durSec: 1.6, note: 45, gain: 0.7 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Plucked basses: the body, where the string is plucked and how long it rings, then the box it is heard through.
  {
    id: 'colour-note-madder-root',
    name: 'Madder root',
    category: 'bass',
    description:
      'An upright bass plucked softly far from the bridge, pressed into a wooden soundboard in a small room.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { touch: 0.15, position: 0.4, tone: 0.3, resonance: 0.7, sustain: 4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4, size: 1.5 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'colour-note-ink-slides-flat',
    name: 'Ink slides flat',
    category: 'bass',
    description:
      'A growling fretless with a long sustain, widened by a slow light chorus and lit by a faint plate.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -1, growl: 0.95, tone: 0.5, sustain: 12, position: 0.3, release: 0.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'colour-note-thumbed-accidental',
    name: 'Thumbed accidental',
    category: 'bass',
    description:
      'The side of the thumb at the neck, half muted and short, pushed into a tape preamp with its lows bumped up.',
    preview: BASS_BLUE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { mute: 0.4, sustain: 2.2, release: 0.1 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.45 } }],
  },
  {
    id: 'colour-note-sharp-under-the-pick',
    name: 'Sharp under the pick',
    category: 'bass',
    description:
      'A picked electric bass through a driven stack of loudspeakers, with one soft tape slap behind each note.',
    preview: BASS_CLIMBS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { position: 0.15, tone: 0.75, touch: 0.75 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'colour-note-flat-six-on-drum-skin',
    name: 'Flat six on drum skin',
    category: 'bass',
    description:
      'A muted electric bass, all thud and little ring, sounded inside a drum with its attacks levelled.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { mute: 0.55, tone: 0.2, sustain: 7, position: 0.42 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'colour-note-between-d-and-e',
    name: 'Between D and E',
    category: 'bass',
    description:
      'A hard-growling fretless whose every attack opens a soft band-pass, so the blue note talks, with its peaks held.',
    preview: BASS_BLUE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { volume: -0.5, sustain: 7, resonance: 0.6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.55, resonance: 3 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'colour-note-semitone-cellar',
    name: 'Semitone cellar',
    category: 'bass',
    description:
      'A dark soft upright with everything but its lowest octave in a low wide space that empties in two seconds.',
    preview: BASS_FALLS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { release: 0.2, mute: 0.1 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Low cathedral',
        params: { mix: 0.34, decay: 2.4, lowCut: 110 },
      },
    ],
  },
  {
    id: 'colour-note-gut-lament',
    name: 'Gut lament',
    category: 'bass',
    description:
      'A long-ringing upright that sways once a note has lasted, over strings in A minor that answer the key and not the semitones.',
    preview: BASS_FALLS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: -2.5, release: 0.4, touch: 0.45, position: 0.18, tone: 0.6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { depth: 22 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'colour-note-slap-to-the-natural',
    name: 'Slap to the natural',
    category: 'bass',
    description:
      'A slapped upright with all its rattle, through a worn cassette and a single dark spring.',
    preview: BASS_CLIMBS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { volume: 3.5, sustain: 3, position: 0.09 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.2, noise: 0.2 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'colour-note-palm-on-the-sharp',
    name: 'Palm on the sharp',
    category: 'bass',
    description:
      'A palm-muted pick with a close dark slap behind each note, the lows of both kept in the middle.',
    preview: BASS_LEADS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { volume: 4, mute: 0.5, touch: 0.8, resonance: 0.7 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.35, time: 140 } },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'colour-note-bridge-of-copper',
    name: 'Bridge of copper',
    category: 'bass',
    description:
      'A nasal bass plucked at the bridge, turned by a slow phaser that leaves the lows alone, its level pressed flat.',
    preview: BASS_CLIMBS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { volume: 2.5, sustain: 6, mute: 0, tone: 0.85 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.15, mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Tucked under' },
    ],
  },
  {
    id: 'colour-note-indigo-vat',
    name: 'Indigo vat',
    category: 'bass',
    description:
      'A quiet deep fretless with no edge at all, muffled and turned by a flanger slower than the line.',
    preview: BASS_FALLS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: 3, release: 0.3 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Glacial drift' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'colour-note-chromatic-stair',
    name: 'Chromatic stair',
    category: 'bass',
    description:
      'Dead flat strings with an octave under each note, so the semitones are walked an octave down as well.',
    preview: BASS_FALLS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { tone: 0.35, sustain: 2.6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Tucked under' },
    ],
  },
  {
    id: 'colour-note-rattle-of-the-flat',
    name: 'Rattle of the flat',
    category: 'bass',
    description:
      'A picked string rattling on its frets, heard through the small loudspeaker of a bedside set.',
    preview: BASS_BLUE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { volume: 0.5, touch: 0.7, sustain: 4 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { bass: 0.5, noise: 0.05 } }],
  },
  {
    id: 'colour-note-slow-dye',
    name: 'Slow dye',
    category: 'bass',
    description:
      'A softly fingered bass of long sustain, doubled a few cents sharp and flat, with a dark cave behind it.',
    preview: BASS_AMEN,
    instrument: { deviceId: 'string-bass', preset: 'Let it ring', params: { release: 0.4 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.26, decay: 3.2 } },
    ],
  },
  {
    id: 'colour-note-pluck-withdrawn',
    name: 'Pluck withdrawn',
    category: 'bass',
    description:
      'A fretless with its pluck taken away: every note fades in over a third of a second, moved by a wide chorus.',
    preview: BASS_FALLS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -2, touch: 0.5, sustain: 18, release: 0.4, growl: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 330 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'colour-note-giant-semitone',
    name: 'Giant semitone',
    category: 'bass',
    description:
      'Warm fingers on an electric bass whose body is made much larger, with the low end warmed by an iron core.',
    preview: BASS_CLIMBS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { tone: 0.7, resonance: 0.8 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'colour-note-pipe-under-the-finger',
    name: 'Pipe under the finger',
    category: 'bass',
    description:
      'A fingered bass with a slow organ pipe speaking an octave under it, a fifth of a second behind each pluck.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { touch: 0.15, position: 0.3, sustain: 10, release: 0.25 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'colour-note-shaking-sixth',
    name: 'Shaking sixth',
    category: 'bass',
    description:
      'An electric bass in an amplifier tremolo, its tail dripping down three long springs.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { position: 0.14, tone: 0.5, mute: 0, sustain: 9, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5, depth: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'colour-note-trail-of-the-sharp',
    name: 'Trail of the sharp',
    category: 'bass',
    description:
      'A bright fretless whose overtones come back on a slow tape trail, the lows cut from it so no semitone muddies.',
    preview: BASS_LEADS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -0.5, tone: 0.85, position: 0.1, growl: 0.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { mix: 0.36, feedback: 0.5, lowCut: 320, highCut: 3000 },
      },
    ],
  },
  {
    id: 'colour-note-walnut-stain',
    name: 'Walnut stain',
    category: 'bass',
    description:
      'An upright with a soft finger and a long ring in a turning speaker cabinet, mostly its dark low drum.',
    preview: BASS_BLUE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { touch: 0.2, position: 0.2, tone: 0.6, sustain: 5, growl: 0.5, resonance: 0.75 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  {
    id: 'colour-note-choked-flat',
    name: 'Choked flat',
    category: 'bass',
    description:
      'A half muted string inside a gated room that opens with each note and shuts again, squeezed hard at the end.',
    preview: BASS_BLUE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { volume: 1, mute: 0.5, touch: 0.3, tone: 0.8, sustain: 6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.5, lowCut: 40 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8.5 } },
    ],
  },
  {
    id: 'colour-note-coarse-pigment',
    name: 'Coarse pigment',
    category: 'bass',
    description:
      'A muted thud read back by an early sampler at a low rate, its grain left on top of the note.',
    preview: BASS_BLUE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { volume: 1, touch: 0.6, tone: 0.75, mute: 0.3, position: 0.2 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { drive: 4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'colour-note-sine-under-wood',
    name: 'Sine under wood',
    category: 'bass',
    description:
      'A short woody upright shadowed by pure sines an octave down that swell in late and outlast the string.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { volume: 2.5, touch: 0.35, growl: 0.2, position: 0.22, sustain: 1.2 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Low shadow',
        params: { mix: 0.5, attack: 220, release: 0.7 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'colour-note-attack-in-mist',
    name: 'Attack in mist',
    category: 'bass',
    description:
      'A ringing bass whose attacks are blurred into a soft cloud with no tail, under a gentle low-pass.',
    preview: BASS_AMEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { touch: 0.4, position: 0.15, tone: 0.6, release: 0.25, sustain: 12 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { width: 0.6 } },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 700 } },
    ],
  },
  // Reed organ: which ranks sound, how fast they speak and how steady the wind is, then the cabinet or the room.
  {
    id: 'colour-note-lamp-in-the-apse',
    name: 'Lamp in the apse',
    category: 'organ',
    description:
      'Soft flute ranks with very little wind in them, in a hall whose lows last longer than its middle.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.15, octave: 0.6, breath: 0.1, attack: 0.15, tone: 2600 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow' }],
  },
  {
    id: 'colour-note-amen-on-bellows',
    name: 'Amen on bellows',
    category: 'organ',
    description:
      'A nasal pump organ leaning hard on its bellows, played through a small combo amplifier in a room.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { reed: 0.9, octave: 0.1, sub: 0 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { mix: 0.8 } }],
  },
  {
    id: 'colour-note-verdigris-quints',
    name: 'Verdigris quints',
    category: 'organ',
    description:
      'The twelfth and the sub rank round the plain unison, so each chord carries its fifths, in a wide slow chorus.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { sub: 0.6, attack: 0.4, release: 1.8 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } }],
  },
  {
    id: 'colour-note-rotor-finds-the-flat',
    name: 'Rotor finds the flat',
    category: 'organ',
    description:
      'Bright stacked flute ranks with a fast key, in a driven rotating cabinet at its fast speed.',
    preview: BLUE_THIRD,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        volume: -14.5,
        reed: 0,
        celeste: 0,
        octave: 0.9,
        twelfth: 0.35,
        fifteenth: 0.2,
        attack: 0.01,
        release: 0.1,
        tone: 5200,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Growl', params: { drive: 0.55 } }],
  },
  {
    id: 'colour-note-trembling-sixth',
    name: 'Trembling sixth',
    category: 'organ',
    description: 'One breathy flute with a deep tremulant, a medium plate behind it.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 0.85, octave: 0.35, release: 0.9 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate' }],
  },
  {
    id: 'colour-note-box-of-blue-reeds',
    name: 'Box of blue reeds',
    category: 'organ',
    description:
      'A bellows box of reeds and a sub rank, its drone thrown into a wobbling double of itself.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.35, release: 1.4, reed: 0.75 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'colour-note-foot-on-low-c',
    name: 'Foot on low C',
    category: 'drone',
    description:
      'A deep pedal stop on dull worn cassette tape, with a long dark cathedral behind it.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.25, release: 2, tone: 1000 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'colour-note-two-flutes-apart',
    name: 'Two flutes apart',
    category: 'organ',
    description:
      'A flute and its mistuned celeste, beating, and the pair panned slowly from side to side.',
    preview: INNER_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.12, release: 0.7, tone: 6500 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.25 } }],
  },
  {
    id: 'colour-note-wind-before-the-note',
    name: 'Wind before the note',
    category: 'organ',
    description: 'More wind than pipe: a flute rank nearly all breath, hung in a long bright tank.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { volume: -15, octave: 0.12, attack: 0.3, tone: 7000 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.35 } }],
  },
  {
    id: 'colour-note-border-dance',
    name: 'Border dance',
    category: 'organ',
    description:
      'A bright accordion with quick reeds and wide beats, played from a nearly new record and narrowed.',
    preview: BORROWED_DOMINANT,
    instrument: { deviceId: 'organ', preset: 'Accordion', params: { octave: 0.1, tone: 8500 } },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'colour-note-voice-of-the-flat',
    name: 'Voice of the flat',
    category: 'organ',
    description: 'A trembling reed stop sent into a small chapel that answers with a sung vowel.',
    preview: FLAT_SECOND,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.6, tone: 2200, attack: 0.08 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.4 } }],
  },
  {
    id: 'colour-note-vestry-wall',
    name: 'Vestry wall',
    category: 'organ',
    description:
      'A small full organ heard from the next room: dark, distant, its highs taken by the air.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { tone: 600, release: 0.8 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
  },
  {
    id: 'colour-note-vermilion-opens',
    name: 'Vermilion opens',
    category: 'pad',
    description:
      'Bright high ranks that bloom for over a second, their tail climbing a fifth at each pass.',
    preview: SLOW_SHARP,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1.1, release: 2, reed: 0.1 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.3, decay: 6 } }],
  },
  {
    id: 'colour-note-far-transept',
    name: 'Far transept',
    category: 'organ',
    description:
      'Distant dark pipes that swell for most of a second, pushed across an open valley of reverb.',
    preview: SLOW_AMEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 0.8, release: 2, celeste: 0.2, tone: 900 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } }],
  },
  {
    id: 'colour-note-celeste-stain',
    name: 'Celeste stain',
    category: 'organ',
    description:
      'A beating celeste on a strong sub rank, hollowed by a flanger with negative feedback.',
    preview: MAJOR_THIRD_LAST,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.45, release: 1.5, tone: 4000 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.15, feedback: -45 } },
    ],
  },
  {
    id: 'colour-note-row-of-bottles',
    name: 'Row of bottles',
    category: 'wind',
    description: 'Soft flutes blown inside a glass bottle, airy and stopped, with no reed in them.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0, octave: 0.15, breath: 0.7, attack: 0.06, release: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'colour-note-cardboard-pipes',
    name: 'Cardboard pipes',
    category: 'organ',
    description:
      'A short-keyed organ resampled at a low rate by an early machine, a toy of eight bits.',
    preview: BLUE_THIRD,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        reed: 0,
        celeste: 0,
        octave: 0.7,
        twelfth: 0.4,
        attack: 0.02,
        release: 0.15,
        breath: 0.05,
      },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Toy', params: { aliasing: 0.4 } }],
  },
  {
    id: 'colour-note-burnt-amen',
    name: 'Burnt amen',
    category: 'organ',
    description:
      'A harmonium driven into a dark fuzz that blends half and half with the clean reeds.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { bellows: 0.6, sub: 0.5, fifteenth: 0, attack: 0.2 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } }],
  },
  {
    id: 'colour-note-sleeper-at-the-keys',
    name: 'Sleeper at the keys',
    category: 'pad',
    description:
      'Warm ranks opened and closed by a short cycle of breathing that moves level, brightness and width.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0.8,
        octave: 0.2,
        twelfth: 0,
        fifteenth: 0.4,
        reed: 0.1,
        attack: 0.5,
        release: 2,
        tone: 2200,
      },
    },
    effects: [{ deviceId: 'breath', preset: 'Short of breath', params: { depth: 0.5 } }],
  },
  {
    id: 'colour-note-ruby-drawbars',
    name: 'Ruby drawbars',
    category: 'organ',
    description:
      'A quick-keyed organ of octave and fifteenth, driven through a narrow telephone band and given dark repeats.',
    preview: BORROWED_DOMINANT,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0,
        octave: 0.3,
        twelfth: 0,
        fifteenth: 0.9,
        reed: 0.2,
        attack: 0.005,
        release: 0.05,
        tone: 9000,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Phone line', params: { driveDb: 8 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'colour-note-glint-of-twelfths',
    name: 'Glint of twelfths',
    category: 'organ',
    description:
      'Octave, twelfth, fifteenth and reed held still while each partial has its own slow tremolo, rising through the spectrum.',
    preview: INNER_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0,
        octave: 0.5,
        twelfth: 0.7,
        fifteenth: 0.6,
        reed: 0.5,
        celeste: 0,
        breath: 0,
        bellows: 0,
        tone: 9000,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  // Chamber strings: how many players, how the bow meets the string, how long it takes to speak.
  {
    id: 'colour-note-amber-mutes',
    name: 'Amber mutes',
    category: 'string',
    description: 'Five muted players with no vibrato, swelling for under a second in a dark hall.',
    preview: FLAT_SECOND,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -5, attack: 0.7, release: 1.8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'colour-note-one-bow-turns-home',
    name: 'One bow turns home',
    category: 'string',
    description:
      'A single close player with a warm vibrato, a pipe an octave up speaking just behind the bow, in a small plate.',
    preview: NEIGHBOUR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -2, attack: 0.2, vibrato: 18, bow: 0.7 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'colour-note-viols-descend',
    name: 'Viols descend',
    category: 'string',
    description:
      'Straight muted viols in exact agreement, pressed into the hollow colour of a tube, with the top spread wide.',
    preview: FALLING_BASS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.15, release: 0.4 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'colour-note-glass-on-flat-two',
    name: 'Glass on flat two',
    category: 'string',
    description:
      'Three bows at the bridge, no vibrato, their overtones smeared into a bright hanging halo.',
    preview: FLAT_SECOND,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.35, release: 1.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo' }],
  },
  {
    id: 'colour-note-torn-paper-strings',
    name: 'Torn paper strings',
    category: 'string',
    description:
      'Six players who do not agree, recorded onto a driven cassette that wobbles under them.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.4, release: 1 },
    },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
  },
  {
    id: 'colour-note-whispered-a-flat',
    name: 'Whispered A flat',
    category: 'string',
    description: 'More hair than string: light airy bows blurred into a warm low fuzz of reverb.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -5, attack: 0.45, air: 1, bow: 0.05 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.3, decay: 3 } }],
  },
  {
    id: 'colour-note-short-bow-sharp',
    name: 'Short bow, sharp',
    category: 'string',
    description:
      'Short firm bows with quick ends, each one skipping away in softer and softer echoes.',
    preview: BORROWED_DOMINANT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.15, bow: 0.9 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.3 } }],
  },
  {
    id: 'colour-note-cochineal-vibrato',
    name: 'Cochineal vibrato',
    category: 'string',
    description:
      'Three players with a very wide vibrato, heard through a full-range speaker across a room and kept on clean tape.',
    preview: MAJOR_THIRD_LAST,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { vibrato: 36, mute: 0, bow: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'colour-note-two-mutes-one-flat',
    name: 'Two mutes, one flat',
    category: 'string',
    description: 'A quiet muted duet set wide apart, sent down slack springs that splash late.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -7.5, mute: 1, air: 0.1 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Late splash' }],
  },
  {
    id: 'colour-note-ochre-veil',
    name: 'Ochre veil',
    category: 'pad',
    description:
      'A thin muted veil of five with its lows filtered off, slowly rotating through a swirling phaser.',
    preview: SLOW_AMEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: 1.5, attack: 0.8, release: 1.8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 300 } },
      { deviceId: 'phaser', preset: 'Slow swirl' },
    ],
  },
  {
    id: 'colour-note-six-in-low-light',
    name: 'Six in low light',
    category: 'pad',
    description:
      'Six slow muted players with an octave added under them, a second in arriving and two in going.',
    preview: SLOW_AMEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 1, release: 2.2, mute: 0.8 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.7 } }],
  },
  {
    id: 'colour-note-semitone-wanderer',
    name: 'Semitone wanderer',
    category: 'string',
    description: 'One player unsure of the pitch, answered by a seasick dark echo.',
    preview: NEIGHBOUR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { volume: -3, attack: 0.35, release: 1, width: 0 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Seasick', params: { mix: 0.35 } }],
  },
  // Felt piano: how much felt, how much pedal, and whether the hammer is left on the note.
  {
    id: 'colour-note-sixth-from-the-top',
    name: 'Sixth from the top',
    category: 'keys',
    description:
      'A felted piano struck softly, almost dry of its own room, with a plain hall laid under it.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { outputDb: -12, felt: 0.85, hardness: 0.25, thump: 0.3, reverbMix: 0.05 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
  },
  {
    id: 'colour-note-plain-amen',
    name: 'Plain amen',
    category: 'keys',
    description:
      'A bare piano with the felt taken out, close and hard, on a driven dictation cassette that flutters.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -12, hardness: 0.75, width: 0.2, reverbMix: 0 },
    },
    effects: [{ deviceId: 'tape', preset: 'Old dictation', params: { hiss: 0.25, flutter: 0.4 } }],
  },
  {
    id: 'colour-note-pedal-through-the-sharp',
    name: 'Pedal through the sharp',
    category: 'keys',
    description:
      'The pedal kept down across the changing chords, each note doubled a few cents either side.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -17.5, hardness: 0.4, felt: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'colour-note-parlour-sharp',
    name: 'Parlour sharp',
    category: 'keys',
    description:
      'An old upright out of tune with itself, its pedal half down, through a loudspeaker shut in a cupboard.',
    preview: BORROWED_DOMINANT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -15.5, hardness: 0.35, sustain: 0.5, grit: 0.1 },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0.04 } }],
  },
  {
    id: 'colour-note-prism-of-the-seventh',
    name: 'Prism of the seventh',
    category: 'keys',
    description:
      'A hard glassy piano whose chords unfold from low to high a moment after they are struck.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -8.5, stiffness: 1.2, reverbMix: 0.2 },
    },
    effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.4 } }],
  },
  {
    id: 'colour-note-hammers-turned-to-bow',
    name: 'Hammers turned to bow',
    category: 'pad',
    description:
      'A piano whose strikes are faded away over half a second, leaving chords that a slow wide chorus moves.',
    preview: SLOW_SHARP,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { sustain: 1, hardness: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 500 } },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'colour-note-felt-with-pipes-below',
    name: 'Felt with pipes below',
    category: 'keys',
    description:
      'Soft thudding hammers with no hardness, and organ octaves from below and above mixed in with them.',
    preview: FALLING_BASS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -20, hardness: 0.1 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Organ', params: { sub2: 0 } }],
  },
  {
    id: 'colour-note-blot-on-the-page',
    name: 'Blot on the page',
    category: 'texture',
    description:
      'A piano under both pedals blurred into its own long room, its spectrum smeared and darkened again.',
    preview: SLOW_SHARP,
    instrument: { deviceId: 'felt-piano', preset: 'Blurred wash', params: { outputDb: -13 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } }],
  },
  {
    id: 'colour-note-creak-before-the-flat',
    name: 'Creak before the flat',
    category: 'keys',
    description:
      'A close creaking action in heavy felt, with scattered echoes like points round each chord.',
    preview: BLUE_THIRD,
    instrument: { deviceId: 'felt-piano', preset: 'Close and creaky', params: { outputDb: -13.5 } },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  // Wavetable: which table, how far along it, and how quickly it opens.
  {
    id: 'colour-note-smalt-glass',
    name: 'Smalt glass',
    category: 'pad',
    description:
      'A glass wavetable two thirds of the way along that opens in half a second, in a bright chamber.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { position: 0.65, attack: 0.5, release: 1.8, cutoff: 7000 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber' }],
  },
  {
    id: 'colour-note-from-ee-to-oh',
    name: 'From ee to oh',
    category: 'voice',
    description:
      'A vowel table sweeping as the chord changes, closed a little and scattered into a far-off cloud of sixteen copies.',
    preview: SLOW_SHARP,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.7, release: 2, rate: 0.35, cutoff: 2400, detune: 5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Cloud far off' }],
  },
  {
    id: 'colour-note-reed-of-weld',
    name: 'Reed of weld',
    category: 'organ',
    description:
      'A reedy table with a quick key, driven by a tube preamp and blended with a slow rotating speaker.',
    preview: BORROWED_DOMINANT,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { volume: -17, position: 0.45, attack: 0.03, release: 0.4 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'rotary', preset: 'Soft blend' },
    ],
  },
  {
    id: 'colour-note-hollow-of-the-flat',
    name: 'Hollow of the flat',
    category: 'pad',
    description:
      'A hollow table, dark and a little resonant, its bands swelling and swaying from side to side.',
    preview: SLOW_AMEN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.8, release: 2.5, rate: 0.2 },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.3 } }],
  },
  {
    id: 'colour-note-saffron-keys',
    name: 'Saffron keys',
    category: 'keys',
    description:
      'Keys on a spectral table with a sub under each, speaking at once, pale sparks of themselves thrown off above.',
    preview: BLUE_THIRD,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { table: 4, release: 1.3, position: 0.55, sub: 0.6, cutoff: 5000 },
    },
    effects: [{ deviceId: 'glints', preset: 'First light' }],
  },
  {
    id: 'colour-note-woad-sines',
    name: 'Woad sines',
    category: 'pad',
    description:
      'Two plain detuned sines beating over a sub, half of their sound swayed in pitch as a slow chorus.',
    preview: INNER_LINE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { attack: 0.08, release: 1, sub: 0.3 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Slow chorus' }],
  },
  {
    id: 'colour-note-thick-with-sharps',
    name: 'Thick with sharps',
    category: 'pad',
    description:
      'Wide detuned saws closed down dark, under a second low-pass that sweeps slowly up and down.',
    preview: MAJOR_THIRD_LAST,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.4, release: 1.8, cutoff: 2200 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { lfoRateHz: 0.15 } }],
  },
  {
    id: 'colour-note-narrow-pulse-of-ink',
    name: 'Narrow pulse of ink',
    category: 'keys',
    description:
      'A thin pulse with a short release, answered three seconds later at the same pitch, on new tape.',
    preview: NEIGHBOUR,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { cutoff: 3500, release: 0.4 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.35, gap: 3 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  // Afterglow: what is struck, and how the glow that follows it is raised.
  {
    id: 'colour-note-felt-then-ochre',
    name: 'Felt, then ochre',
    category: 'keys',
    description:
      'A felt strike whose overtones swell after it in half a second, with a medium plate behind.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 0.5, fade: 1.2, evolve: 0.2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'colour-note-bell-with-a-flat-halo',
    name: 'Bell with a flat halo',
    category: 'bell',
    description:
      'Bells with a strong halo of their own, blended with a copy moved by a fraction of a hertz so that they phase.',
    preview: BELL_AMEN,
    instrument: { deviceId: 'afterglow', preset: 'Bell halo', params: { decay: 2.6, fade: 2.2 } },
    effects: [{ deviceId: 'freq-shifter', preset: 'Slow drift' }],
  },
  {
    id: 'colour-note-glass-sixth-breathed',
    name: 'Glass sixth, breathed',
    category: 'pad',
    description:
      'Faintly struck glass that turns into a breath of a pad, each attack blurred into mist.',
    preview: SLOW_AMEN,
    instrument: { deviceId: 'afterglow', preset: 'Glass breath', params: { bloom: 1, fade: 1.8 } },
    effects: [{ deviceId: 'fog', preset: 'Morning mist' }],
  },
  {
    id: 'colour-note-plucked-carmine',
    name: 'Plucked carmine',
    category: 'plucked',
    description:
      'A hard bright pluck with a small glow and a strong halo, bouncing through the two heads of a tape echo.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { strike: 1, decay: 1.2, glow: 0.2, halo: 0.6, tone: 0.8, fade: 1.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop' }],
  },
  {
    id: 'colour-note-only-what-glows',
    name: 'Only what glows',
    category: 'pad',
    description:
      'No strike at all, only the overtones raised for a second and turned in a deep eight-stage phaser.',
    preview: SLOW_SHARP,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { volume: -10, bloom: 0.9, fade: 1.6, tone: 0.7 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Deep eight-stage', params: { mix: 0.4 } }],
  },
  {
    id: 'colour-note-lampblack',
    name: 'Lampblack',
    category: 'keys',
    description:
      'Dark felt with no halo and a glow that is up at once and soon gone, its body a shade larger, in a booth that hardly rings.',
    preview: FALLING_BASS,
    instrument: { deviceId: 'afterglow', preset: 'Dark felt', params: { bloom: 0.5, fade: 0.8 } },
    effects: [
      { deviceId: 'size', preset: 'A shade larger' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'colour-note-chime-of-the-natural',
    name: 'Chime of the natural',
    category: 'bell',
    description:
      'Bright chimes struck hard, half of their sound with its partials stretched apart, in a tight chamber.',
    preview: NEIGHBOUR_HIGH,
    instrument: { deviceId: 'afterglow', preset: 'Bright chimes', params: { tone: 0.65 } },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'colour-note-still-cobalt',
    name: 'Still cobalt',
    category: 'keys',
    description:
      'Still glass with nothing moving in it, with one and two octaves more laid above each note.',
    preview: INNER_LINE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { volume: -13.5, strike: 0.85, fade: 1.2 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Glass octaves' }],
  },
  // Dusk: the wave, where the filter stands, and which chorus is on.
  {
    id: 'colour-note-evening-plagal',
    name: 'Evening plagal',
    category: 'pad',
    description:
      'Soft chorused strings that open in half a second, set back a few steps in a small space.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { attack: 0.4, release: 1.4, cutoff: 1800 },
    },
    effects: [{ deviceId: 'distance', preset: 'A few steps back', params: { wander: 0 } }],
  },
  {
    id: 'colour-note-pulse-held-over-c',
    name: 'Pulse held over C',
    category: 'pad',
    description:
      'Wide moving pulses under a strong second chorus, in a hall whose tail sings a drifting vowel.',
    preview: OVER_A_PEDAL,
    instrument: { deviceId: 'dusk', preset: 'Wide pulse', params: { attack: 0.45, release: 1.6 } },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.35 } }],
  },
  {
    id: 'colour-note-clarinet-sinks',
    name: 'Clarinet sinks',
    category: 'wind',
    description:
      'Square waves closed to a soft clarinet, a vibrato growing only while a note is held, in a narrow spring tank.',
    preview: NEIGHBOUR,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.15, release: 0.8, chorus: 0 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Late vibrato' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'colour-note-filter-sings-the-sharp',
    name: 'Filter sings the sharp',
    category: 'pad',
    description:
      'Thin voices from a resonant filter and both choruses, left on a distant worn radio station.',
    preview: SLOW_SHARP,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { volume: -11.5, attack: 0.5, release: 2 },
    },
    effects: [{ deviceId: 'patina', preset: 'Distant station', params: { noise: 0.15 } }],
  },
  {
    id: 'colour-note-stopped-amen',
    name: 'Stopped amen',
    category: 'organ',
    description:
      'A stopped pipe with no chorus, quick and plain, with breathy pipes an octave below and above speaking late.',
    preview: SLOW_AMEN,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.03, release: 0.3 },
    },
    effects: [{ deviceId: 'stops', preset: 'Breath first' }],
  },
  {
    id: 'colour-note-warm-sienna-keys',
    name: 'Warm sienna keys',
    category: 'keys',
    description:
      'Warm saw and square keys with a closing filter, their echoes thrown from side to side.',
    preview: BLUE_THIRD,
    instrument: { deviceId: 'dusk', preset: 'Warm keys', params: { envelope: 0.7, release: 0.6 } },
    effects: [{ deviceId: 'echo-memory', preset: 'Side to side', params: { mix: 0.3 } }],
  },
  {
    id: 'colour-note-umber-floor',
    name: 'Umber floor',
    category: 'pad',
    description:
      'A square with its full sub octave, turned down to a floor and pressed by a warm transformer.',
    preview: FALLING_BASS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 600, release: 0.3, attack: 0.12 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron melt', params: { mix: 0.6 } }],
  },
  // Aurora: brass, strings and reeds that keep swelling while held.
  {
    id: 'colour-note-brass-before-home',
    name: 'Brass before home',
    category: 'pad',
    description:
      'Slow brass that keeps opening while held, in a long hall that answers a fifth of a second late.',
    preview: RAISED_SEVENTH,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { attack: 0.2, release: 1.6, brilliance: 1500 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Late hall' }],
  },
  {
    id: 'colour-note-horns-borrow-a-flat',
    name: 'Horns borrow a flat',
    category: 'pad',
    description: 'Soft horns with their lows thinned, through a horn speaker on an empty platform.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.5, release: 1.5, detune: 14 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.2 } }],
  },
  {
    id: 'colour-note-silver-for-ochre',
    name: 'Silver for ochre',
    category: 'pad',
    description:
      'High silver strings with nothing under them, the body put back by a pad that follows an octave down.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.6, release: 2 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Low section' }],
  },
  {
    id: 'colour-note-metal-neighbour',
    name: 'Metal neighbour',
    category: 'bell',
    description:
      'Ringing metal layers struck at once and left to ring, with a faint backwards reflection of the phrase.',
    preview: NEIGHBOUR_HIGH,
    instrument: { deviceId: 'aurora', preset: 'Chime strings', params: { release: 3 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Faint reflection' }],
  },
  {
    id: 'colour-note-muted-brass-sixth',
    name: 'Muted brass sixth',
    category: 'wind',
    description:
      'A nasal muted brass with a resonant edge, doubled by a loose chorus and held by a slow compressor.',
    preview: INNER_LINE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { resonance: 0.6, lowCut: 700, attack: 0.08 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'colour-note-reeds-out-of-mode',
    name: 'Reeds out of mode',
    category: 'organ',
    description:
      'Loose detuned reeds with a quick start, on tape that has worn thin, under a harmonic tremolo.',
    preview: BORROWED_DOMINANT,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { volume: -4, attack: 0.05, release: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.2 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
    ],
  },
  // Staircase: stacked octaves under a still bell, or stepping by the semitone itself.
  {
    id: 'colour-note-octaves-of-a-flat',
    name: 'Octaves of a flat',
    category: 'organ',
    description:
      'Every chord tone in five still octaves, neither rising nor falling, in a faint chorus and a thin veil of reverb.',
    preview: PLAGAL,
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { span: 5, shape: 0.15, release: 0.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'colour-note-endless-semitones',
    name: 'Endless semitones',
    category: 'texture',
    description:
      'Octave stacks that step down a semitone a second without end, through a starved stream of themselves, shaded darker.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'staircase',
      preset: 'Falling steps',
      params: { speed: -0.5, slide: 0.35, centre: 400 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'colour-note-hollow-stair-in-c',
    name: 'Hollow stair in C',
    category: 'pad',
    description:
      'A hollow stack held still, opened in half a second and lifted by a faint octave in the reverb.',
    preview: OVER_A_PEDAL,
    instrument: {
      deviceId: 'staircase',
      preset: 'Hollow pad',
      params: { attack: 0.5, release: 2, centre: 260 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
  },
  {
    id: 'colour-note-reed-steps-of-the-third',
    name: 'Reed steps of the third',
    category: 'texture',
    description:
      'A reedy stack walking up the held chord tone by tone, given a hint of spring and a lowered ceiling.',
    preview: MAJOR_THIRD_LAST,
    instrument: {
      deviceId: 'staircase',
      preset: 'Reed stairs',
      params: { speed: 0.5, shape: 0.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling' },
    ],
  },
]
