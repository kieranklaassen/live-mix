import { type FactoryPreset, type Phrase } from '../types'

// A harp's seven pedals have sixteen settings that stay on the white keys (C or C flat, E or E
// sharp, F or F flat, B or B sharp). Laid out as places on the string, from the soundboard to its
// middle, by nail, fingertip, damped and left to ring; the fourteen phrases use all sixteen (thirteen
// are swept, three trilled).

// C D E F flat G A B sharp: five notes in seven strings. Two slow rises, C six-nine over C and
// the same strings as A minor seven over A and E, with E and C plucked twice.
const PENTATONIC_RISE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 48, gain: 0.7 },
    { atSec: 0, durSec: 3.2, note: 55, gain: 0.7 },
    { atSec: 0.5, durSec: 2.4, note: 60, gain: 0.34 },
    { atSec: 0.66, durSec: 2.4, note: 62, gain: 0.37 },
    { atSec: 0.82, durSec: 2.4, note: 64, gain: 0.4 },
    { atSec: 0.98, durSec: 2.4, note: 64, gain: 0.43 },
    { atSec: 1.14, durSec: 2.4, note: 67, gain: 0.46 },
    { atSec: 1.3, durSec: 2.4, note: 69, gain: 0.5 },
    { atSec: 1.46, durSec: 2.4, note: 72, gain: 0.53 },
    { atSec: 1.62, durSec: 2.4, note: 72, gain: 0.56 },
    { atSec: 1.78, durSec: 2.4, note: 74, gain: 0.59 },
    { atSec: 1.94, durSec: 2.4, note: 76, gain: 0.62 },
    { atSec: 2.1, durSec: 2.4, note: 76, gain: 0.65 },
    { atSec: 2.26, durSec: 2.4, note: 79, gain: 0.68 },
    { atSec: 2.42, durSec: 2.4, note: 81, gain: 0.71 },
    { atSec: 2.58, durSec: 2.4, note: 84, gain: 0.74 },
    { atSec: 3.4, durSec: 3.6, note: 57, gain: 0.65 },
    { atSec: 3.4, durSec: 3.6, note: 64, gain: 0.65 },
    { atSec: 4, durSec: 2.4, note: 64, gain: 0.37 },
    { atSec: 4.2, durSec: 2.4, note: 64, gain: 0.42 },
    { atSec: 4.4, durSec: 2.4, note: 67, gain: 0.45 },
    { atSec: 4.6, durSec: 2.4, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 2.4, note: 72, gain: 0.53 },
    { atSec: 5, durSec: 2.4, note: 72, gain: 0.57 },
    { atSec: 5.2, durSec: 2.2, note: 74, gain: 0.6 },
    { atSec: 5.4, durSec: 2, note: 76, gain: 0.65 },
  ],
}

// C flat D E F flat G A B: B D E E G A B, an E minor eleventh that falls twice over E and B, the
// second time lower.
const ELEVENTH_FALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.8, note: 40, gain: 0.78 },
    { atSec: 0, durSec: 3.8, note: 47, gain: 0.78 },
    { atSec: 0.5, durSec: 2.4, note: 83, gain: 0.78 },
    { atSec: 0.67, durSec: 2.4, note: 81, gain: 0.74 },
    { atSec: 0.84, durSec: 2.4, note: 79, gain: 0.71 },
    { atSec: 1.01, durSec: 2.4, note: 76, gain: 0.68 },
    { atSec: 1.18, durSec: 2.4, note: 76, gain: 0.67 },
    { atSec: 1.35, durSec: 2.4, note: 74, gain: 0.64 },
    { atSec: 1.52, durSec: 2.4, note: 71, gain: 0.6 },
    { atSec: 1.69, durSec: 2.4, note: 71, gain: 0.57 },
    { atSec: 1.86, durSec: 2.4, note: 69, gain: 0.54 },
    { atSec: 2.03, durSec: 2.4, note: 67, gain: 0.51 },
    { atSec: 2.2, durSec: 2.4, note: 64, gain: 0.5 },
    { atSec: 2.37, durSec: 2.4, note: 64, gain: 0.46 },
    { atSec: 2.54, durSec: 2.4, note: 62, gain: 0.43 },
    { atSec: 2.71, durSec: 2.4, note: 59, gain: 0.4 },
    { atSec: 4, durSec: 3.2, note: 40, gain: 0.58 },
    { atSec: 4, durSec: 3.2, note: 47, gain: 0.54 },
    { atSec: 4.4, durSec: 2.4, note: 71, gain: 0.62 },
    { atSec: 4.59, durSec: 2.4, note: 71, gain: 0.59 },
    { atSec: 4.78, durSec: 2.4, note: 69, gain: 0.57 },
    { atSec: 4.97, durSec: 2.4, note: 67, gain: 0.54 },
    { atSec: 5.16, durSec: 2.24, note: 64, gain: 0.51 },
    { atSec: 5.35, durSec: 2.05, note: 64, gain: 0.5 },
    { atSec: 5.54, durSec: 1.86, note: 62, gain: 0.46 },
    { atSec: 5.73, durSec: 1.67, note: 59, gain: 0.45 },
    { atSec: 5.92, durSec: 1.48, note: 59, gain: 0.43 },
    { atSec: 6.11, durSec: 1.29, note: 57, gain: 0.41 },
    { atSec: 6.3, durSec: 1.1, note: 55, gain: 0.39 },
    { atSec: 6.49, durSec: 0.91, note: 52, gain: 0.37 },
    { atSec: 6.68, durSec: 0.72, note: 52, gain: 0.34 },
  ],
}

// C D E sharp F G A B sharp: C D F F G A C. Up two octaves of F six-nine over a low fifth F C,
// and back down without stopping to the F.
const THERE_AND_BACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.5, note: 41, gain: 0.78 },
    { atSec: 0, durSec: 4.5, note: 48, gain: 0.78 },
    { atSec: 0.4, durSec: 2.4, note: 60, gain: 0.34 },
    { atSec: 0.57, durSec: 2.4, note: 62, gain: 0.37 },
    { atSec: 0.74, durSec: 2.4, note: 65, gain: 0.4 },
    { atSec: 0.91, durSec: 2.4, note: 65, gain: 0.43 },
    { atSec: 1.08, durSec: 2.4, note: 67, gain: 0.48 },
    { atSec: 1.25, durSec: 2.4, note: 69, gain: 0.51 },
    { atSec: 1.42, durSec: 2.4, note: 72, gain: 0.54 },
    { atSec: 1.59, durSec: 2.4, note: 72, gain: 0.57 },
    { atSec: 1.76, durSec: 2.4, note: 74, gain: 0.6 },
    { atSec: 1.93, durSec: 2.4, note: 77, gain: 0.64 },
    { atSec: 2.1, durSec: 2.4, note: 77, gain: 0.68 },
    { atSec: 2.27, durSec: 2.4, note: 79, gain: 0.71 },
    { atSec: 2.44, durSec: 2.4, note: 81, gain: 0.74 },
    { atSec: 2.61, durSec: 2.4, note: 84, gain: 0.78 },
    { atSec: 2.78, durSec: 2.4, note: 81, gain: 0.76 },
    { atSec: 2.95, durSec: 2.4, note: 79, gain: 0.73 },
    { atSec: 3.12, durSec: 2.4, note: 77, gain: 0.71 },
    { atSec: 3.29, durSec: 2.4, note: 77, gain: 0.7 },
    { atSec: 3.46, durSec: 2.4, note: 74, gain: 0.67 },
    { atSec: 3.63, durSec: 2.4, note: 72, gain: 0.65 },
    { atSec: 3.8, durSec: 2.4, note: 72, gain: 0.64 },
    { atSec: 3.97, durSec: 2.4, note: 69, gain: 0.6 },
    { atSec: 4.14, durSec: 2.4, note: 67, gain: 0.59 },
    { atSec: 4.31, durSec: 2.4, note: 65, gain: 0.57 },
    { atSec: 4.48, durSec: 2.4, note: 65, gain: 0.54 },
    { atSec: 4.65, durSec: 2.4, note: 62, gain: 0.53 },
    { atSec: 4.82, durSec: 2.4, note: 60, gain: 0.51 },
    { atSec: 4.99, durSec: 2.4, note: 60, gain: 0.5 },
    { atSec: 5.16, durSec: 2.24, note: 57, gain: 0.48 },
    { atSec: 5.33, durSec: 2.07, note: 55, gain: 0.47 },
    { atSec: 5.5, durSec: 1.9, note: 53, gain: 0.46 },
    { atSec: 5.67, durSec: 1.73, note: 53, gain: 0.43 },
  ],
}

// Every pedal in its middle notch: the plain scale, risen from D over D and A and slowing as it
// goes, which ends on the open fifth A E above D.
const ALL_NATURAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.5, note: 50, gain: 0.7 },
    { atSec: 0, durSec: 4.5, note: 57, gain: 0.7 },
    { atSec: 0.5, durSec: 2.4, note: 62, gain: 0.4 },
    { atSec: 0.67, durSec: 2.4, note: 64, gain: 0.43 },
    { atSec: 0.86, durSec: 2.4, note: 65, gain: 0.46 },
    { atSec: 1.08, durSec: 2.4, note: 67, gain: 0.48 },
    { atSec: 1.31, durSec: 2.4, note: 69, gain: 0.51 },
    { atSec: 1.57, durSec: 2.4, note: 71, gain: 0.54 },
    { atSec: 1.85, durSec: 2.4, note: 72, gain: 0.57 },
    { atSec: 2.15, durSec: 2.4, note: 74, gain: 0.6 },
    { atSec: 2.48, durSec: 2.4, note: 76, gain: 0.64 },
    { atSec: 2.82, durSec: 2.4, note: 77, gain: 0.65 },
    { atSec: 3.19, durSec: 2.4, note: 79, gain: 0.68 },
    { atSec: 3.58, durSec: 2.4, note: 81, gain: 0.71 },
    { atSec: 5, durSec: 2.4, note: 50, gain: 0.54 },
    { atSec: 5, durSec: 2.4, note: 57, gain: 0.54 },
    { atSec: 5.3, durSec: 2, note: 69, gain: 0.54 },
    { atSec: 5.6, durSec: 1.8, note: 76, gain: 0.62 },
  ],
}

// The same six notes twice over F and C. First E, F and B sharp, in order; then E sharp under F
// flat, where the two strings cross and only the ripple changes.
const UNCROSSED_CROSSED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 41, gain: 0.7 },
    { atSec: 0, durSec: 3.5, note: 48, gain: 0.7 },
    { atSec: 0.3, durSec: 2.4, note: 60, gain: 0.37 },
    { atSec: 0.44, durSec: 2.4, note: 62, gain: 0.4 },
    { atSec: 0.58, durSec: 2.4, note: 64, gain: 0.42 },
    { atSec: 0.72, durSec: 2.4, note: 65, gain: 0.45 },
    { atSec: 0.86, durSec: 2.4, note: 67, gain: 0.48 },
    { atSec: 1, durSec: 2.4, note: 69, gain: 0.5 },
    { atSec: 1.14, durSec: 2.4, note: 72, gain: 0.53 },
    { atSec: 1.28, durSec: 2.4, note: 72, gain: 0.56 },
    { atSec: 1.42, durSec: 2.4, note: 74, gain: 0.59 },
    { atSec: 1.56, durSec: 2.4, note: 76, gain: 0.6 },
    { atSec: 1.7, durSec: 2.4, note: 77, gain: 0.64 },
    { atSec: 1.84, durSec: 2.4, note: 79, gain: 0.67 },
    { atSec: 1.98, durSec: 2.4, note: 81, gain: 0.68 },
    { atSec: 2.12, durSec: 2.4, note: 84, gain: 0.71 },
    { atSec: 3.6, durSec: 3.5, note: 41, gain: 0.7 },
    { atSec: 3.6, durSec: 3.5, note: 48, gain: 0.7 },
    { atSec: 3.9, durSec: 2.4, note: 60, gain: 0.37 },
    { atSec: 4.04, durSec: 2.4, note: 62, gain: 0.4 },
    { atSec: 4.18, durSec: 2.4, note: 65, gain: 0.42 },
    { atSec: 4.32, durSec: 2.4, note: 64, gain: 0.45 },
    { atSec: 4.46, durSec: 2.4, note: 67, gain: 0.48 },
    { atSec: 4.6, durSec: 2.4, note: 69, gain: 0.5 },
    { atSec: 4.74, durSec: 2.4, note: 72, gain: 0.53 },
    { atSec: 4.88, durSec: 2.4, note: 72, gain: 0.56 },
    { atSec: 5.02, durSec: 2.38, note: 74, gain: 0.59 },
    { atSec: 5.16, durSec: 2.24, note: 77, gain: 0.6 },
    { atSec: 5.3, durSec: 2.1, note: 76, gain: 0.64 },
    { atSec: 5.44, durSec: 1.96, note: 79, gain: 0.67 },
    { atSec: 5.58, durSec: 1.82, note: 81, gain: 0.68 },
    { atSec: 5.72, durSec: 1.68, note: 84, gain: 0.71 },
  ],
}

// B sharp sounds over the C flat of the next octave. Up with F flat, A minor eleventh over A and E;
// then the F string is raised to F and the sweep comes down over D and A, D minor thirteenth.
const CROSSED_AT_THE_OCTAVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 45, gain: 0.7 },
    { atSec: 0, durSec: 3.4, note: 52, gain: 0.7 },
    { atSec: 0.4, durSec: 2.4, note: 59, gain: 0.37 },
    { atSec: 0.56, durSec: 2.4, note: 62, gain: 0.4 },
    { atSec: 0.72, durSec: 2.4, note: 64, gain: 0.42 },
    { atSec: 0.88, durSec: 2.4, note: 64, gain: 0.45 },
    { atSec: 1.04, durSec: 2.4, note: 67, gain: 0.46 },
    { atSec: 1.2, durSec: 2.4, note: 69, gain: 0.5 },
    { atSec: 1.36, durSec: 2.4, note: 72, gain: 0.53 },
    { atSec: 1.52, durSec: 2.4, note: 71, gain: 0.54 },
    { atSec: 1.68, durSec: 2.4, note: 74, gain: 0.57 },
    { atSec: 1.84, durSec: 2.4, note: 76, gain: 0.59 },
    { atSec: 2, durSec: 2.4, note: 76, gain: 0.62 },
    { atSec: 2.16, durSec: 2.4, note: 79, gain: 0.65 },
    { atSec: 2.32, durSec: 2.4, note: 81, gain: 0.67 },
    { atSec: 2.48, durSec: 2.4, note: 84, gain: 0.7 },
    { atSec: 2.64, durSec: 2.4, note: 83, gain: 0.71 },
    { atSec: 2.8, durSec: 2.4, note: 86, gain: 0.74 },
    { atSec: 3.6, durSec: 3.6, note: 38, gain: 0.78 },
    { atSec: 3.6, durSec: 3.6, note: 45, gain: 0.78 },
    { atSec: 3.9, durSec: 2.4, note: 86, gain: 0.71 },
    { atSec: 4.07, durSec: 2.4, note: 83, gain: 0.7 },
    { atSec: 4.24, durSec: 2.4, note: 84, gain: 0.67 },
    { atSec: 4.41, durSec: 2.4, note: 81, gain: 0.65 },
    { atSec: 4.58, durSec: 2.4, note: 79, gain: 0.62 },
    { atSec: 4.75, durSec: 2.4, note: 77, gain: 0.6 },
    { atSec: 4.92, durSec: 2.4, note: 76, gain: 0.57 },
    { atSec: 5.09, durSec: 2.31, note: 74, gain: 0.56 },
    { atSec: 5.26, durSec: 2.14, note: 71, gain: 0.53 },
    { atSec: 5.43, durSec: 1.97, note: 72, gain: 0.51 },
    { atSec: 5.6, durSec: 1.8, note: 69, gain: 0.48 },
    { atSec: 5.77, durSec: 1.63, note: 67, gain: 0.46 },
    { atSec: 5.94, durSec: 1.46, note: 65, gain: 0.43 },
    { atSec: 6.11, durSec: 1.29, note: 64, gain: 0.42 },
    { atSec: 6.28, durSec: 1.12, note: 62, gain: 0.39 },
    { atSec: 6.45, durSec: 0.95, note: 59, gain: 0.37 },
  ],
}

// C flat, E sharp, F flat and B sharp, all four moved: up over D and A with both pairs crossed. Then
// B is put back to natural and it falls over G and D, a G thirteenth with no C in it.
const BOTH_CROSSINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 50, gain: 0.71 },
    { atSec: 0, durSec: 3.2, note: 57, gain: 0.71 },
    { atSec: 0.3, durSec: 2.4, note: 59, gain: 0.37 },
    { atSec: 0.46, durSec: 2.4, note: 62, gain: 0.4 },
    { atSec: 0.62, durSec: 2.4, note: 65, gain: 0.43 },
    { atSec: 0.78, durSec: 2.4, note: 64, gain: 0.46 },
    { atSec: 0.94, durSec: 2.4, note: 67, gain: 0.48 },
    { atSec: 1.1, durSec: 2.4, note: 69, gain: 0.51 },
    { atSec: 1.26, durSec: 2.4, note: 72, gain: 0.54 },
    { atSec: 1.42, durSec: 2.4, note: 71, gain: 0.57 },
    { atSec: 1.58, durSec: 2.4, note: 74, gain: 0.6 },
    { atSec: 1.74, durSec: 2.4, note: 77, gain: 0.64 },
    { atSec: 1.9, durSec: 2.4, note: 76, gain: 0.65 },
    { atSec: 2.06, durSec: 2.4, note: 79, gain: 0.68 },
    { atSec: 2.22, durSec: 2.4, note: 81, gain: 0.71 },
    { atSec: 2.38, durSec: 2.4, note: 84, gain: 0.74 },
    { atSec: 3.4, durSec: 3.6, note: 43, gain: 0.74 },
    { atSec: 3.4, durSec: 3.6, note: 50, gain: 0.74 },
    { atSec: 3.8, durSec: 2.4, note: 83, gain: 0.71 },
    { atSec: 3.97, durSec: 2.4, note: 81, gain: 0.68 },
    { atSec: 4.14, durSec: 2.4, note: 79, gain: 0.67 },
    { atSec: 4.31, durSec: 2.4, note: 76, gain: 0.64 },
    { atSec: 4.48, durSec: 2.4, note: 77, gain: 0.6 },
    { atSec: 4.65, durSec: 2.4, note: 74, gain: 0.59 },
    { atSec: 4.82, durSec: 2.4, note: 71, gain: 0.56 },
    { atSec: 4.99, durSec: 2.4, note: 71, gain: 0.53 },
    { atSec: 5.16, durSec: 2.24, note: 69, gain: 0.5 },
    { atSec: 5.33, durSec: 2.07, note: 67, gain: 0.48 },
    { atSec: 5.5, durSec: 1.9, note: 64, gain: 0.45 },
    { atSec: 5.67, durSec: 1.73, note: 65, gain: 0.42 },
    { atSec: 5.84, durSec: 1.56, note: 62, gain: 0.4 },
    { atSec: 6.01, durSec: 1.39, note: 59, gain: 0.37 },
  ],
}

// Pedals moved two at a time under ringing strings, each pair through its half notch, where the string
// rattles a quarter tone down: E sharp and F go to E and F flat over C (a 4-3), then B sharp and C to B
// and C flat over G (a 4-3) in two octaves.
const HALF_PEDALS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 36, gain: 0.74 },
    { atSec: 0, durSec: 3.4, note: 43, gain: 0.74 },
    { atSec: 0.3, durSec: 1.3, note: 60, gain: 0.46 },
    { atSec: 0.43, durSec: 1.3, note: 62, gain: 0.5 },
    { atSec: 0.56, durSec: 1.3, note: 65, gain: 0.53 },
    { atSec: 0.69, durSec: 1.3, note: 65, gain: 0.56 },
    { atSec: 0.82, durSec: 1.3, note: 67, gain: 0.59 },
    { atSec: 0.95, durSec: 1.3, note: 69, gain: 0.62 },
    { atSec: 1.08, durSec: 1.3, note: 72, gain: 0.65 },
    { atSec: 1.75, durSec: 0.09, note: 64.5, gain: 0.36 },
    { atSec: 1.84, durSec: 0.09, note: 64.5, gain: 0.3 },
    { atSec: 1.93, durSec: 0.09, note: 64.5, gain: 0.25 },
    { atSec: 2.02, durSec: 1.6, note: 64, gain: 0.62 },
    { atSec: 3.5, durSec: 3.8, note: 43, gain: 0.74 },
    { atSec: 3.5, durSec: 3.8, note: 50, gain: 0.74 },
    { atSec: 3.8, durSec: 1.4, note: 60, gain: 0.46 },
    { atSec: 3.93, durSec: 1.4, note: 60, gain: 0.5 },
    { atSec: 4.06, durSec: 1.4, note: 62, gain: 0.51 },
    { atSec: 4.19, durSec: 1.4, note: 64, gain: 0.53 },
    { atSec: 4.32, durSec: 1.4, note: 64, gain: 0.56 },
    { atSec: 4.45, durSec: 1.4, note: 67, gain: 0.59 },
    { atSec: 4.58, durSec: 1.4, note: 69, gain: 0.6 },
    { atSec: 4.71, durSec: 1.4, note: 72, gain: 0.62 },
    { atSec: 4.84, durSec: 1.4, note: 72, gain: 0.65 },
    { atSec: 5.4, durSec: 0.09, note: 59.5, gain: 0.34 },
    { atSec: 5.4, durSec: 0.09, note: 71.5, gain: 0.34 },
    { atSec: 5.49, durSec: 0.09, note: 59.5, gain: 0.28 },
    { atSec: 5.49, durSec: 0.09, note: 71.5, gain: 0.28 },
    { atSec: 5.58, durSec: 0.09, note: 59.5, gain: 0.23 },
    { atSec: 5.58, durSec: 0.09, note: 71.5, gain: 0.23 },
    { atSec: 5.67, durSec: 1.6, note: 59, gain: 0.59 },
    { atSec: 5.67, durSec: 1.6, note: 71, gain: 0.62 },
  ],
}

// Whispered trills between two strings on one note: E and F flat in C major over C and G, C flat and
// B in G seven over G and D, F and E sharp in D minor seven over D and A.
const UNISON_TRILLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 48, gain: 0.65 },
    { atSec: 0, durSec: 2.4, note: 55, gain: 0.65 },
    { atSec: 0.3, durSec: 2.2, note: 67, gain: 0.53 },
    { atSec: 0.5, durSec: 0.5, note: 76, gain: 0.31 },
    { atSec: 0.61, durSec: 0.5, note: 76, gain: 0.33 },
    { atSec: 0.72, durSec: 0.5, note: 76, gain: 0.33 },
    { atSec: 0.83, durSec: 0.5, note: 76, gain: 0.34 },
    { atSec: 0.94, durSec: 0.5, note: 76, gain: 0.34 },
    { atSec: 1.05, durSec: 0.5, note: 76, gain: 0.36 },
    { atSec: 1.16, durSec: 0.5, note: 76, gain: 0.37 },
    { atSec: 1.27, durSec: 0.5, note: 76, gain: 0.37 },
    { atSec: 1.38, durSec: 0.5, note: 76, gain: 0.39 },
    { atSec: 1.49, durSec: 0.5, note: 76, gain: 0.4 },
    { atSec: 1.6, durSec: 0.5, note: 76, gain: 0.4 },
    { atSec: 1.71, durSec: 0.5, note: 76, gain: 0.42 },
    { atSec: 1.82, durSec: 0.5, note: 76, gain: 0.42 },
    { atSec: 1.93, durSec: 0.5, note: 76, gain: 0.43 },
    { atSec: 2.5, durSec: 2.4, note: 43, gain: 0.65 },
    { atSec: 2.5, durSec: 2.4, note: 50, gain: 0.65 },
    { atSec: 2.8, durSec: 2.2, note: 65, gain: 0.53 },
    { atSec: 3, durSec: 0.5, note: 71, gain: 0.31 },
    { atSec: 3.11, durSec: 0.5, note: 71, gain: 0.33 },
    { atSec: 3.22, durSec: 0.5, note: 71, gain: 0.33 },
    { atSec: 3.33, durSec: 0.5, note: 71, gain: 0.34 },
    { atSec: 3.44, durSec: 0.5, note: 71, gain: 0.34 },
    { atSec: 3.55, durSec: 0.5, note: 71, gain: 0.36 },
    { atSec: 3.66, durSec: 0.5, note: 71, gain: 0.37 },
    { atSec: 3.77, durSec: 0.5, note: 71, gain: 0.37 },
    { atSec: 3.88, durSec: 0.5, note: 71, gain: 0.39 },
    { atSec: 3.99, durSec: 0.5, note: 71, gain: 0.4 },
    { atSec: 4.1, durSec: 0.5, note: 71, gain: 0.4 },
    { atSec: 4.21, durSec: 0.5, note: 71, gain: 0.42 },
    { atSec: 4.32, durSec: 0.5, note: 71, gain: 0.42 },
    { atSec: 4.43, durSec: 0.5, note: 71, gain: 0.43 },
    { atSec: 5, durSec: 2.4, note: 50, gain: 0.65 },
    { atSec: 5, durSec: 2.4, note: 57, gain: 0.65 },
    { atSec: 5.3, durSec: 2, note: 72, gain: 0.53 },
    { atSec: 5.4, durSec: 0.5, note: 77, gain: 0.31 },
    { atSec: 5.51, durSec: 0.5, note: 77, gain: 0.33 },
    { atSec: 5.62, durSec: 0.5, note: 77, gain: 0.33 },
    { atSec: 5.73, durSec: 0.5, note: 77, gain: 0.34 },
    { atSec: 5.84, durSec: 0.5, note: 77, gain: 0.34 },
    { atSec: 5.95, durSec: 0.5, note: 77, gain: 0.36 },
    { atSec: 6.06, durSec: 0.5, note: 77, gain: 0.37 },
    { atSec: 6.17, durSec: 0.5, note: 77, gain: 0.37 },
    { atSec: 6.28, durSec: 0.5, note: 77, gain: 0.39 },
    { atSec: 6.39, durSec: 0.5, note: 77, gain: 0.4 },
    { atSec: 6.5, durSec: 0.5, note: 77, gain: 0.4 },
    { atSec: 6.61, durSec: 0.5, note: 77, gain: 0.42 },
    { atSec: 6.72, durSec: 0.5, note: 77, gain: 0.42 },
    { atSec: 6.83, durSec: 0.5, note: 77, gain: 0.43 },
  ],
}

// A wash low on the strings. C flat, E sharp and B: up from D through G ninth (D F F G A B B) over G and D.
// Then B goes to B sharp and it sinks over D, B sharp and C flat crossed.
const LOW_WASH: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.8, note: 31, gain: 0.78 },
    { atSec: 0, durSec: 3.8, note: 38, gain: 0.78 },
    { atSec: 0.72, durSec: 3, note: 50, gain: 0.42 },
    { atSec: 0.94, durSec: 3, note: 53, gain: 0.45 },
    { atSec: 1.16, durSec: 3, note: 53, gain: 0.46 },
    { atSec: 1.38, durSec: 3, note: 55, gain: 0.5 },
    { atSec: 1.6, durSec: 3, note: 57, gain: 0.51 },
    { atSec: 1.82, durSec: 3, note: 59, gain: 0.54 },
    { atSec: 2.04, durSec: 3, note: 59, gain: 0.56 },
    { atSec: 2.26, durSec: 3, note: 62, gain: 0.59 },
    { atSec: 2.48, durSec: 3, note: 65, gain: 0.6 },
    { atSec: 2.7, durSec: 3, note: 65, gain: 0.64 },
    { atSec: 2.92, durSec: 3, note: 67, gain: 0.65 },
    { atSec: 3.14, durSec: 3, note: 69, gain: 0.66 },
    { atSec: 3.7, durSec: 3.6, note: 38, gain: 0.78 },
    { atSec: 4, durSec: 2.4, note: 72, gain: 0.65 },
    { atSec: 4.21, durSec: 2.4, note: 69, gain: 0.64 },
    { atSec: 4.42, durSec: 2.4, note: 67, gain: 0.6 },
    { atSec: 4.63, durSec: 2.4, note: 65, gain: 0.59 },
    { atSec: 4.84, durSec: 2.4, note: 65, gain: 0.57 },
    { atSec: 5.05, durSec: 2.35, note: 62, gain: 0.54 },
    { atSec: 5.26, durSec: 2.14, note: 59, gain: 0.53 },
    { atSec: 5.47, durSec: 1.93, note: 60, gain: 0.51 },
    { atSec: 5.68, durSec: 1.72, note: 57, gain: 0.48 },
    { atSec: 5.89, durSec: 1.51, note: 55, gain: 0.46 },
    { atSec: 6.1, durSec: 1.3, note: 53, gain: 0.45 },
    { atSec: 6.31, durSec: 1.09, note: 53, gain: 0.42 },
    { atSec: 6.52, durSec: 0.88, note: 50, gain: 0.4 },
  ],
}

// C D E sharp F flat G A B at the top of the frame, E and F crossed in each octave, over F and C: every
// note of a lydian thirteenth, up two octaves and a little way down.
const HIGH_CROSSING: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.5, note: 41, gain: 0.65 },
    { atSec: 0, durSec: 4.5, note: 48, gain: 0.65 },
    { atSec: 0.4, durSec: 2.4, note: 72, gain: 0.37 },
    { atSec: 0.56, durSec: 2.4, note: 74, gain: 0.39 },
    { atSec: 0.72, durSec: 2.4, note: 77, gain: 0.42 },
    { atSec: 0.88, durSec: 2.4, note: 76, gain: 0.43 },
    { atSec: 1.04, durSec: 2.4, note: 79, gain: 0.46 },
    { atSec: 1.2, durSec: 2.4, note: 81, gain: 0.48 },
    { atSec: 1.36, durSec: 2.4, note: 83, gain: 0.5 },
    { atSec: 1.52, durSec: 2.4, note: 84, gain: 0.53 },
    { atSec: 1.68, durSec: 2.4, note: 86, gain: 0.54 },
    { atSec: 1.84, durSec: 2.4, note: 89, gain: 0.56 },
    { atSec: 2, durSec: 2.4, note: 88, gain: 0.59 },
    { atSec: 2.16, durSec: 2.4, note: 91, gain: 0.6 },
    { atSec: 2.32, durSec: 2.4, note: 93, gain: 0.64 },
    { atSec: 2.48, durSec: 2.4, note: 95, gain: 0.65 },
    { atSec: 3.1, durSec: 2.3, note: 93, gain: 0.6 },
    { atSec: 3.38, durSec: 2.3, note: 91, gain: 0.575 },
    { atSec: 3.66, durSec: 2.3, note: 88, gain: 0.55 },
    { atSec: 3.94, durSec: 2.3, note: 89, gain: 0.525 },
    { atSec: 4.22, durSec: 2.3, note: 86, gain: 0.5 },
    { atSec: 4.5, durSec: 2.3, note: 84, gain: 0.475 },
    { atSec: 4.78, durSec: 2.3, note: 83, gain: 0.45 },
    { atSec: 5.06, durSec: 2.3, note: 81, gain: 0.425 },
    { atSec: 5.6, durSec: 1.8, note: 53, gain: 0.53 },
    { atSec: 5.6, durSec: 1.8, note: 60, gain: 0.53 },
  ],
}

// Five chords, a pedal or two apart: F six (E sharp, B sharp), E lowered for D minor seven, F
// lowered for A minor seven, C and B lowered for E minor seven, C raised for C major seven.
const PEDAL_BY_PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 53, gain: 0.78 },
    { atSec: 0, durSec: 1.4, note: 60, gain: 0.78 },
    { atSec: 0, durSec: 1.4, note: 62, gain: 0.78 },
    { atSec: 0, durSec: 1.4, note: 69, gain: 0.78 },
    { atSec: 1.45, durSec: 1.4, note: 50, gain: 0.78 },
    { atSec: 1.45, durSec: 1.4, note: 60, gain: 0.78 },
    { atSec: 1.45, durSec: 1.4, note: 65, gain: 0.78 },
    { atSec: 1.45, durSec: 1.4, note: 69, gain: 0.78 },
    { atSec: 2.9, durSec: 1.4, note: 57, gain: 0.78 },
    { atSec: 2.9, durSec: 1.4, note: 60, gain: 0.78 },
    { atSec: 2.9, durSec: 1.4, note: 64, gain: 0.78 },
    { atSec: 2.9, durSec: 1.4, note: 67, gain: 0.78 },
    { atSec: 4.35, durSec: 1.4, note: 52, gain: 0.78 },
    { atSec: 4.35, durSec: 1.4, note: 59, gain: 0.78 },
    { atSec: 4.35, durSec: 1.4, note: 62, gain: 0.78 },
    { atSec: 4.35, durSec: 1.4, note: 67, gain: 0.78 },
    { atSec: 5.8, durSec: 1.6, note: 48, gain: 0.78 },
    { atSec: 5.8, durSec: 1.6, note: 59, gain: 0.78 },
    { atSec: 5.8, durSec: 1.6, note: 64, gain: 0.78 },
    { atSec: 5.8, durSec: 1.6, note: 67, gain: 0.78 },
  ],
}

// Four held chords in which a pedal is the resolution: C over G goes to C flat, a 4-3; then E sharp
// over C goes to E, a 4-3.
const SUSPENDED_STRUMS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 55, gain: 0.78 },
    { atSec: 0, durSec: 1.7, note: 60, gain: 0.78 },
    { atSec: 0, durSec: 1.7, note: 62, gain: 0.78 },
    { atSec: 0, durSec: 1.7, note: 67, gain: 0.78 },
    { atSec: 1.8, durSec: 1.7, note: 55, gain: 0.71 },
    { atSec: 1.8, durSec: 1.7, note: 59, gain: 0.71 },
    { atSec: 1.8, durSec: 1.7, note: 62, gain: 0.71 },
    { atSec: 1.8, durSec: 1.7, note: 67, gain: 0.71 },
    { atSec: 3.6, durSec: 1.7, note: 48, gain: 0.78 },
    { atSec: 3.6, durSec: 1.7, note: 55, gain: 0.78 },
    { atSec: 3.6, durSec: 1.7, note: 60, gain: 0.78 },
    { atSec: 3.6, durSec: 1.7, note: 65, gain: 0.78 },
    { atSec: 5.4, durSec: 2, note: 48, gain: 0.71 },
    { atSec: 5.4, durSec: 2, note: 55, gain: 0.71 },
    { atSec: 5.4, durSec: 2, note: 60, gain: 0.71 },
    { atSec: 5.4, durSec: 2, note: 64, gain: 0.71 },
  ],
}

// E minor eleventh held, then F six-nine: the doubled E and the doubled B each go up a half step,
// and D, G and A are the strings that stay.
const TWO_PENTATONICS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 52, gain: 0.74 },
    { atSec: 0, durSec: 3.4, note: 59, gain: 0.74 },
    { atSec: 0, durSec: 3.4, note: 62, gain: 0.74 },
    { atSec: 0, durSec: 3.4, note: 67, gain: 0.74 },
    { atSec: 0, durSec: 3.4, note: 69, gain: 0.74 },
    { atSec: 3.6, durSec: 3.8, note: 53, gain: 0.74 },
    { atSec: 3.6, durSec: 3.8, note: 60, gain: 0.74 },
    { atSec: 3.6, durSec: 3.8, note: 62, gain: 0.74 },
    { atSec: 3.6, durSec: 3.8, note: 67, gain: 0.74 },
    { atSec: 3.6, durSec: 3.8, note: 69, gain: 0.74 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Harp, by the soundboard: thumbnail and fingertip close to the end of the string.
  {
    id: 'sixteen-harp-pedals-nail-at-the-wood',
    name: 'Nail at the wood',
    category: 'plucked',
    preview: ELEVENTH_FALL,
    description:
      'Harp strings picked hard close to the soundboard, short and thin, heard through a small bright speaker across a room.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { pluck: 0.04, touch: 0.9, decay: 0.5, halo: 0.1, body: 0.2, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Clean and bright',
        params: { speaker: 0, distance: 0.6, room: 0.6 },
      },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { autoGain: 6 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-on-the-table-side',
    name: 'On the table side',
    category: 'plucked',
    preview: UNCROSSED_CROSSED,
    description:
      'A fingertip near the soundboard with the top of its ring brought up, and a copy sixty milliseconds late on each side.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.1, touch: 0.2, decay: 2.2, halo: 0.9, body: 0.15 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Glass top', params: { amount: 0.8 } },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-wire-in-the-treble',
    name: 'Wire in the treble',
    category: 'plucked',
    preview: HIGH_CROSSING,
    description:
      'Wound steel strings picked at the end with all the body taken off, the bass cut, each note answered by octave sparks.',
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 0.5, touch: 0.85, decay: 2, halo: 0.6, body: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 260, air: 3, highCut: 14000 } },
      { deviceId: 'glints', preset: 'Steady rain', params: { pitch: 0, mix: 0.3 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-disc-against-string',
    name: 'Disc against string',
    category: 'plucked',
    preview: HALF_PEDALS,
    description:
      'A nail-picked harp with a soft wavefold on each attack, the buzz of a disc half turned, then a dark short hall.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: -7.5, pluck: 0.07, touch: 0.75, decay: 1.4, halo: 0.2, body: 0.7 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Folded glass',
        params: { driveDb: 13, outputDb: -6, mix: 0.6 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { lowDecay: 1.6, midDecay: 1.4, mix: 0.25 },
      },
    ],
  },
  {
    id: 'sixteen-harp-pedals-seven-discs-turning',
    name: 'Seven discs turning',
    category: 'plucked',
    preview: CROSSED_AT_THE_OCTAVE,
    description:
      'Guzheng strings taken near the bridge and left to ring, turned by a slow twelve-stage phaser, its sides opposed.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 2, pluck: 0.06, touch: 0.5, decay: 1.8, halo: 0.7, body: 0.3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { rate: 0.08, depth: 80, mix: 0.6 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-dry-as-the-column',
    name: 'Dry as the column',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'Damped nail plucks played inside a wooden body half the size, with no room and hardly a tail.',
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { volume: -8.5, pluck: 0.12, touch: 0.6, decay: 0.5, damp: 0.9, body: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.5, mix: 0.75 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { autoGain: 8 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-silk-sweep-turned-back',
    name: 'Silk sweep turned back',
    category: 'plucked',
    preview: THERE_AND_BACK,
    description:
      'Koto strings near the bridge, and the same plucks again backwards an octave down, seven tenths of a second at a time.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: 2.5, pluck: 0.07, touch: 0.45, decay: 1.5, halo: 0.6 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Undertow',
        params: { time: 700, pitch: 2, feedback: 0.3, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-buzz-in-the-notch',
    name: 'Buzz in the notch',
    category: 'plucked',
    preview: HALF_PEDALS,
    description:
      'Koto strings with a triode warming the pluck and a narrow metal comb from a flanger held still.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: 1.5, pluck: 0.04, touch: 0.9, decay: 0.8, halo: 0.1, body: 0.9 },
    },
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Standing comb',
        params: { delayMs: 1.6, feedback: 65, mix: 0.5 },
      },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4 } },
    ],
  },

  // Harp, the hand's usual place, a third of the way up the string.
  {
    id: 'sixteen-harp-pedals-pads-of-the-fingers',
    name: 'Pads of the fingers',
    category: 'plucked',
    preview: ALL_NATURAL,
    description:
      'Soft fingertips a third of the way along, each note shadowed by a few pure sines that swell in and stay for six seconds.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.34, touch: 0.15, decay: 1.2, halo: 0.6, body: 0.7 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { partials: 7, attack: 900, release: 6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'sixteen-harp-pedals-e-sharp-is-f',
    name: 'E sharp is F',
    category: 'plucked',
    preview: THERE_AND_BACK,
    description:
      'A bright harp doubled by flock voices that fly round it, so two strings on one note never quite agree.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { pluck: 0.26, touch: 0.7, decay: 1.6, halo: 0.8, body: 0.4, sweep: 0 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { birds: 10, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { air: 4 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-f-flat-and-e-together',
    name: 'F flat and E together',
    category: 'plucked',
    preview: UNISON_TRILLS,
    description:
      'Whispered fingertips with the attack rounded off and an even pad of the same notes held under them by a sustainer.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.4, touch: 0, decay: 1.5, halo: 1, body: 0.5 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.45 } },
      { deviceId: 'sift', preset: 'Soft hammers', params: { attacks: -16 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-knees-either-side',
    name: 'Knees either side',
    category: 'plucked',
    preview: LOW_WASH,
    description:
      'A full-bodied harp with a round octave added below and the whole narrowed towards the middle.',
    instrument: {
      deviceId: 'harp',
      params: { volume: -10.5, pluck: 0.36, touch: 0.35, decay: 2, halo: 0.4, body: 1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, up1: 0 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-swept-into-a-chapel',
    name: 'Swept into a chapel',
    category: 'plucked',
    preview: TWO_PENTATONICS,
    description:
      'Chords pressed together roll upward for a second, and a small chapel sings a vowel back after them.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { pluck: 0.3, touch: 0.5, sweep: 1, decay: 2.4, body: 0.5 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { vowel: 1.5, decay: 3, mix: 0.5 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-ripple-by-ripple',
    name: 'Ripple by ripple',
    category: 'plucked',
    preview: UNCROSSED_CROSSED,
    description:
      'A half-damped harp sends echoes that land further and further apart, crossing sides, each softer and duller.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -11.5, pluck: 0.3, touch: 0.45, damp: 0.6, decay: 0.8, body: 0.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Long way out', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-sweep-in-a-cistern',
    name: 'Sweep in a cistern',
    category: 'texture',
    preview: LOW_WASH,
    description:
      'Harp strings played into a stopped pipe four times its size, so the low notes ring the metal as it wanders.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.32, touch: 0.6, decay: 1.2, halo: 0.3, body: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { air: 0.1, mix: 0.7 } },
      { deviceId: 'around', preset: 'Slow wander' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-one-breath-of-strings',
    name: 'One breath of strings',
    category: 'pad',
    preview: TWO_PENTATONICS,
    description:
      'The pluck taken off by a swell of nine tenths of a second, so a chord comes in as one breath, then a chorus spreads it.',
    instrument: {
      deviceId: 'harp',
      params: { volume: 0, pluck: 0.3, touch: 0.8, decay: 3, halo: 1, body: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 900, mix: 1, depth: 1 } },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-pedal-diagram',
    name: 'Pedal diagram',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'Harp chords rolled over a third of a second, sampled at eight bits and a low rate, a little of it aliased, and a hint of spring.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.28, touch: 0.5, sweep: 0.35, decay: 0.7, damp: 0.5, halo: 0.2, body: 0.6 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 7000, bits: 8, mix: 1 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-second-harpist-late',
    name: 'Second harpist, late',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'A plain harp answered by a round: the same sweep nine tenths of a second later, then once more an octave down, the top shaded.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { volume: -1.5, pluck: 0.35, touch: 0.45, decay: 0.8, halo: 0.2, body: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 0.9, interval1: 0, interval2: -12, fade: 0.2, mix: 0.55 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-forty-seven-strings-open',
    name: 'Forty-seven strings open',
    category: 'plucked',
    preview: CROSSED_AT_THE_OCTAVE,
    description:
      'Every string left to ring at full halo, with sixteen more tuned to what is played ringing behind for ten seconds.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: -14, pluck: 0.33, touch: 0.55, decay: 4, halo: 1, body: 0.1 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { mode: 2, strings: 12, decay: 10, sympathy: 0.5, width: 1, mix: 0.35 },
      },
    ],
  },
  {
    id: 'sixteen-harp-pedals-pipes-after-the-sweep',
    name: 'Pipes after the sweep',
    category: 'organ',
    preview: ELEVENTH_FALL,
    description:
      'Fingertip harp with soft pipes copied from it at the unison, octave, twelfth and two octaves, nearly two seconds in speaking.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.38, touch: 0.25, decay: 2.5, halo: 0.5, body: 0.6 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Slow bloom', params: { speak: 1700, sub: 0.2, mix: 0.8 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-gut-on-thin-tape',
    name: 'Gut on thin tape',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'Mid-string harp on a cassette that drops out and wobbles, its treble gone and a hiss left beside it.',
    instrument: {
      deviceId: 'harp',
      params: { volume: -10, pluck: 0.36, touch: 0.5, decay: 1, halo: 0.5, body: 0.8 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Worn thin',
        params: { speed: 3, wow: 0.5, age: 0.7, hiss: 0.15 },
      },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.15 } },
    ],
  },

  // Harp, the middle of the string: the octave harmonic's place, hollow and round.
  {
    id: 'sixteen-harp-pedals-palm-on-the-octave',
    name: 'Palm on the octave',
    category: 'bell',
    preview: HIGH_CROSSING,
    description:
      'Mid-string plucks turned down under their octave above, close to a harmonic under the palm, in a bright chamber.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -2, pluck: 0.5, touch: 0.1, decay: 1.5, body: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone', params: { sub1: 0, dry: 0.15, up1: 1 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-half-the-string',
    name: 'Half the string',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'A hollow harp plucked exactly halfway, dark and slow to die, darkened again and moved away down a stone stairwell.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -3, decay: 2.5, halo: 0.2, body: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.65, wander: 0.1 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-whispered-unison',
    name: 'Whispered unison',
    category: 'pad',
    preview: UNISON_TRILLS,
    description:
      'The softest mid-string touch dissolved to breath: its attacks smeared away into a short airy rustle of the same notes.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -3.5, pluck: 0.46, decay: 2, halo: 0.8, body: 0.6 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Whisper', params: { mix: 0.9 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-feet-off-the-pedals',
    name: 'Feet off the pedals',
    category: 'plucked',
    preview: LOW_WASH,
    description:
      'Round mid-string plucks under water, muffled and wavering, with a few bubbles off the attacks.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.48, touch: 0.3, decay: 1.6, halo: 0.6, body: 0.9 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Under', params: { bubbles: 0.25 } }],
  },
  {
    id: 'sixteen-harp-pedals-glass-in-the-frame',
    name: 'Glass in the frame',
    category: 'bell',
    preview: HIGH_CROSSING,
    description:
      'Halfway plucks with their partials stretched apart to glass, quick to die, in front of a faint bright tank that rings on.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.5, touch: 0.5, decay: 0.8, halo: 0.3, body: 0.2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { stretch: 0.4, mix: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-drawn-from-the-neck',
    name: 'Drawn from the neck',
    category: 'string',
    preview: ELEVENTH_FALL,
    description:
      'A hollow harp brings a soft string section after it, an octave low, which swells for a second and a half and fades over eight.',
    instrument: {
      deviceId: 'harp',
      params: { volume: -0.5, pluck: 0.5, touch: 0.2, decay: 1, halo: 0.2, body: 0.4 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { rise: 1.5, fall: 8, mix: 0.65 },
      },
    ],
  },
  {
    id: 'sixteen-harp-pedals-light-through-the-frame',
    name: 'Light through the frame',
    category: 'pad',
    preview: ALL_NATURAL,
    description:
      'Mid-string harp rung for four times its time, every narrow band shaken nine times a second, in thin high air.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.42, touch: 0.35, decay: 4, halo: 0.8, body: 0.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer', params: { depth: 0.9 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.3 } },
    ],
  },

  // Harp, damped: the strings stopped as soon as the hand leaves.
  {
    id: 'sixteen-harp-pedals-muffled-at-once',
    name: 'Muffled at once',
    category: 'plucked',
    preview: BOTH_CROSSINGS,
    description:
      'Damped strings with the attack sent on alone and late: tone first, then its own tick a quarter of a second behind.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -11, pluck: 0.2, touch: 0.6, damp: 1, decay: 0.6, halo: 0 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Late echoes', params: { late: 240, scatter: 1 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { autoGain: 8 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-both-palms-flat',
    name: 'Both palms flat',
    category: 'plucked',
    preview: ELEVENTH_FALL,
    description:
      'Muted low-pass plucks that open with each attack and shut again, followed by dark bucket-brigade repeats.',
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { pluck: 0.4, touch: 0.6, damp: 1, decay: 0.4, body: 1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 400, envAmount: 40 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 430, mix: 0.4 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-thrown-off-the-strings',
    name: 'Thrown off the strings',
    category: 'texture',
    preview: THERE_AND_BACK,
    description:
      'Short damped plucks thrown out as seven echoes at uneven moments, side to side, over nearly two seconds, the quiet raised.',
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { volume: -10, pluck: 0.25, touch: 0.5, decay: 0.6, body: 0.6 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Scattered seven',
        params: { mix: 0.65, width: 1, tone: 5000 },
      },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-held-then-stopped',
    name: 'Held, then stopped',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'Rings only while the key is down, into a reverb that holds at one level and is cut off rather than dying.',
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { pluck: 0.22, touch: 0.5, damp: 1, body: 0.3 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 1.1, mix: 0.55 } }],
  },
  {
    id: 'sixteen-harp-pedals-felt-strip-woven-in',
    name: 'Felt strip woven in',
    category: 'pad',
    preview: UNISON_TRILLS,
    description:
      'A muted koto blurred to a fog of a quarter second with no attack, close and narrow.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { pluck: 0.3, touch: 0, damp: 0.9, decay: 0.6, bend: 0, halo: 0.1, body: 1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { width: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { autoGain: 10 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-ticking-of-the-discs',
    name: 'Ticking of the discs',
    category: 'plucked',
    preview: UNCROSSED_CROSSED,
    description:
      'Hard damped koto plucks on three tape heads, gated left then right, six steps a second, and squashed.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: -2, pluck: 0.16, touch: 0.7, damp: 0.6, decay: 0.9, halo: 0.1, body: 0.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 240, feedback: 0.55, mix: 0.5 },
      },
      { deviceId: 'pulses', preset: 'Left then right', params: { rate: 6 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9.5 } },
    ],
  },

  // Harp, left to ring: washes the sweeps are lost in.
  {
    id: 'sixteen-harp-pedals-sweep-with-no-top',
    name: 'Sweep with no top',
    category: 'pad',
    preview: THERE_AND_BACK,
    description:
      'A ringing harp whose tail is carried upward by gliding voices an octave apart, and never arrives.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { pluck: 0.3, touch: 0.4, sweep: 0.5, decay: 2, body: 0.2 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { decay: 12, mix: 0.6 } }],
  },
  {
    id: 'sixteen-harp-pedals-strings-going-slack',
    name: 'Strings going slack',
    category: 'texture',
    preview: ELEVENTH_FALL,
    description:
      'A soft harp whose tail sags in pitch and darkens the longer it rings, as if every string were let down.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.34, touch: 0.3, decay: 1, halo: 0.6, body: 0.6 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.65 } }],
  },
  {
    id: 'sixteen-harp-pedals-b-sharp-in-the-loft',
    name: 'B sharp in the loft',
    category: 'pad',
    preview: PENTATONIC_RISE,
    description:
      'A bright harp under a tail that climbs by octaves and is kept high and thin, the dry pluck in front.',
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.22, touch: 0.8, decay: 1.5, halo: 0.4, body: 0.2 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Fifths',
        params: { interval: 0, shimmer: 0.6, lowCut: 400, tone: 9000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'sixteen-harp-pedals-glissando-at-a-crawl',
    name: 'Glissando at a crawl',
    category: 'pad',
    preview: CROSSED_AT_THE_OCTAVE,
    description:
      'A sweep played eight times slower as a cloud behind, darkened, with the harp itself kept low beside it.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { pluck: 0.36, touch: 0.5, sweep: 0.3, decay: 1.5, body: 0.6 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { tone: -0.4, mix: 0.8 } }],
  },
  {
    id: 'sixteen-harp-pedals-what-the-halo-leaves',
    name: 'What the halo leaves',
    category: 'drone',
    preview: LOW_WASH,
    description:
      'Open strings at full halo in which the tones that stay are kept ringing and all that changes is pushed down twelve decibels.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { pluck: 0.38, touch: 0.4, decay: 4, halo: 1, body: 0.7 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 1 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-sweeps-laid-over-sweeps',
    name: 'Sweeps laid over sweeps',
    category: 'texture',
    preview: UNCROSSED_CROSSED,
    description:
      'A loop of three seconds between two tape decks lays each sweep over the last, duller on each pass, panned slowly.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.3, touch: 0.5, decay: 0.6, damp: 0.4, halo: 0.3, body: 0.5 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Two decks', params: { length: 3, mix: 0.6 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-bowls-at-the-pedalboard',
    name: 'Bowls at the pedalboard',
    category: 'bell',
    preview: PENTATONIC_RISE,
    description:
      'A short harp over ten metal bowls on the C pentatonic, which ring on for ten seconds where the notes touch them.',
    instrument: {
      deviceId: 'harp',
      params: { volume: -0.5, pluck: 0.28, touch: 0.6, decay: 0.5, damp: 0.3, halo: 0, body: 0.4 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Ten bright bowls',
        params: { root: 0, scale: 0, ring: 10, mix: 0.6 },
      },
    ],
  },
  {
    id: 'sixteen-harp-pedals-leaves-off-the-g-string',
    name: 'Leaves off the G string',
    category: 'texture',
    preview: BOTH_CROSSINGS,
    description:
      'Small pieces of a ringing harp each fall an octave as they fade, over the plain strings.',
    instrument: {
      deviceId: 'harp',
      params: { pluck: 0.34, touch: 0.6, decay: 2, halo: 0.5, body: 0.4 },
    },
    effects: [{ deviceId: 'falling', preset: 'Octave below', params: { density: 8, mix: 0.6 } }],
  },
  {
    id: 'sixteen-harp-pedals-wall-of-gut',
    name: 'Wall of gut',
    category: 'pad',
    preview: LOW_WASH,
    description:
      'Dark strings driven through a short reverb, a soft fuzz and a long one until a wash is all that is left of the sweep.',
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -5.5, pluck: 0.3, touch: 0.3, decay: 2, halo: 0.8 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 8, mix: 0.75 } }],
  },
  {
    id: 'sixteen-harp-pedals-hands-at-half-speed',
    name: 'Hands at half speed',
    category: 'pad',
    preview: PEDAL_BY_PEDAL,
    description:
      'Guzheng strings played back an octave down at half speed, run together into one slow bed with a little of the pluck left.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { pluck: 0.2, touch: 0.6, sweep: 0.2, decay: 1.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.75 } },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-cloud-of-doublings',
    name: 'Cloud of doublings',
    category: 'texture',
    preview: THERE_AND_BACK,
    description:
      'A guzheng sweep broken to long grains, every one of them backwards and fed round again.',
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { volume: -0.5, pluck: 0.12, touch: 0.4, sweep: 0, decay: 1, body: 0.8 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { pitch: 0, mix: 0.8 } },
    ],
  },

  // Chord harp: the keys held are the setting, and the plate sweeps it. By gesture first: rises.
  {
    id: 'sixteen-harp-pedals-slow-rise-four-octaves',
    name: 'Slow rise, four octaves',
    category: 'plucked',
    preview: TWO_PENTATONICS,
    description:
      'A chord swept up four octaves at 120 ms a string, dull and long, with a detuned copy either side that repeats and fades.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 120, direction: 0, sustain: 7, tone: 0.2, pad: 0, spread: 0.9 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Cloud' }],
  },
  {
    id: 'sixteen-harp-pedals-raked-up-in-a-blink',
    name: 'Raked up in a blink',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'A bright rake over three octaves in a tenth of a second, short, run through two springs that chirp and drip.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 8, direction: 0, span: 2, sustain: 0.7, tone: 0.9, pad: 0 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.45 } }],
  },
  {
    id: 'sixteen-harp-pedals-rise-over-held-keys',
    name: 'Rise over held keys',
    category: 'pad',
    preview: SUSPENDED_STRUMS,
    description:
      'An upward strum over a loud square pad of the same chord, both turned slowly by a rotating speaker.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { volume: -16.5, strum: 60, direction: 0, span: 2, sustain: 2, tone: 0.4, pad: 0.8 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'sixteen-harp-pedals-rise-inside-a-bottle',
    name: 'Rise inside a bottle',
    category: 'plucked',
    preview: SUSPENDED_STRUMS,
    description:
      'Short plain plucks swept upward and played in a tiny bottle, which leaves them a hollow pop.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: -4.5, strum: 70, span: 1, sustain: 0.8, tone: 0.5, pad: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble', params: { mix: 0.8 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { autoGain: 6 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-a-setting-in-colours',
    name: 'A setting in colours',
    category: 'plucked',
    preview: TWO_PENTATONICS,
    description:
      'A strum split into twelve bands that arrive one after another, low first, and fan out further on each repeat.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { volume: 0.5, strum: 20, span: 2, sustain: 2.5, tone: 0.7, pad: 0 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { bands: 12, mix: 0.6 } }],
  },
  {
    id: 'sixteen-harp-pedals-octaves-after-the-rise',
    name: 'Octaves after the rise',
    category: 'bell',
    preview: PEDAL_BY_PEDAL,
    description:
      'A thin upward sweep whose repeats are rebuilt from grains an octave higher each time.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: 3, strum: 90, span: 1, sustain: 1.5, tone: 0.3, pad: 0 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.5, feedback: 0.5 } }],
  },

  // Falls.
  {
    id: 'sixteen-harp-pedals-down-to-c-flat',
    name: 'Down to C flat',
    category: 'plucked',
    preview: SUSPENDED_STRUMS,
    description:
      'A slow downward sweep of dark strings over a little pad, moved to the back of a hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { strum: 110, sustain: 5, tone: 0.1, pad: 0.2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'sixteen-harp-pedals-falls-and-keeps-falling',
    name: 'Falls and keeps falling',
    category: 'texture',
    preview: TWO_PENTATONICS,
    description:
      'A downward strum whose tail goes on sinking in gliding voices after the strings have stopped.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: 1.5, strum: 50, sustain: 1.5, tone: 0.5, pad: 0 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Sinking fast', params: { decay: 12, mix: 0.75 } }],
  },
  {
    id: 'sixteen-harp-pedals-falling-past-one-ear',
    name: 'Falling past one ear',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'A bright fall over two octaves, narrow, carried round the head on a figure of eight.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: -0.5, strum: 35, span: 1, sustain: 4, tone: 0.8, pad: 0, spread: 0 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 12000 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-fall-on-a-soft-cassette',
    name: 'Fall on a soft cassette',
    category: 'plucked',
    preview: SUSPENDED_STRUMS,
    description:
      'A one-octave fall over the held chord, saturated and wobbling on a worn cassette.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow falling pad',
      params: { strum: 80, sustain: 3, tone: 0.5, pad: 0.4, spread: 0.4 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.5 } }],
  },
  {
    id: 'sixteen-harp-pedals-fall-heard-from-behind',
    name: 'Fall heard from behind',
    category: 'texture',
    preview: PEDAL_BY_PEDAL,
    description:
      'A falling sweep and its reverse: a reverb that rises backwards for over a second and is cut.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: 5, strum: 20, span: 2, sustain: 0.6, tone: 0.7, pad: 0 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 1.3, tail: 0, mix: 0.7 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-hollow-fifths-over-f',
    name: 'Hollow fifths over F',
    category: 'organ',
    preview: THERE_AND_BACK,
    description:
      'Dull long strings, one to a key, with pipes on the fifth and twelfth above them and none on the octave.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { sustain: 5, tone: 0.15, pad: 0.1 },
    },
    effects: [{ deviceId: 'stops', preset: 'Hollow fifths' }],
  },

  // There and back.
  {
    id: 'sixteen-harp-pedals-ripple-and-return',
    name: 'Ripple and return',
    category: 'pad',
    preview: TWO_PENTATONICS,
    description:
      'Up and down two octaves with a medium tone, faded in over nearly half a second and slowly chorused.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Dark long wash',
      params: { volume: 4.5, strum: 70, span: 1, sustain: 3, tone: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { retrigger: 1 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-return-through-fog',
    name: 'Return through fog',
    category: 'pad',
    preview: TWO_PENTATONICS,
    description:
      'A wide there-and-back sweep blurred to a fog of six tenths of a second, with no plucks left in it.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 40, sustain: 4, tone: 0.5, pad: 0.1 },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog' }],
  },
  {
    id: 'sixteen-harp-pedals-one-octave-quiver',
    name: 'One-octave quiver',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'A bright one-octave ripple there and back, short, with galloping repeats and its lows and highs trading places seven times a second.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'One octave ripple',
      params: { volume: 6, strum: 55, sustain: 0.8, tone: 1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.45 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 7 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-wash-on-e-and-f-flat',
    name: 'Wash on E and F flat',
    category: 'drone',
    preview: TWO_PENTATONICS,
    description:
      'A dark long wash caught by a sustainer that hardly lets go, so each chord glides into the next, its bands drifting.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Dark long wash',
      params: { volume: 1.5, strum: 30, span: 1, tone: 0.05 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { mix: 0.7 } },
      { deviceId: 'currents', preset: 'Slow water' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-wheeling-there-and-back',
    name: 'Wheeling there and back',
    category: 'texture',
    preview: SUSPENDED_STRUMS,
    description:
      'A four-octave sweep up and down that three uneven loops pick up and turn against each other.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 25, sustain: 1, tone: 0.6, pad: 0 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { length: 1.6, mix: 0.6 } }],
  },

  // Single strings, strum at zero: these play the sweeps note by note.
  {
    id: 'sixteen-harp-pedals-chimes-on-twin-strings',
    name: 'Chimes on twin strings',
    category: 'bell',
    preview: UNISON_TRILLS,
    description:
      'One soft chime to a key, its attack turned down and its air spread wide, and a copy fifteen cents off each side.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: -3.5, sustain: 2, tone: 0.3, spread: 0.2 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { detune: 15 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-glass-for-the-crossing',
    name: 'Glass for the crossing',
    category: 'bell',
    preview: HIGH_CROSSING,
    description:
      'Long bright single strings with a ring modulator on C laid over them quietly, drifting.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Long glass chimes',
      params: { sustain: 6, tone: 0.9, spread: 0.6 },
    },
    effects: [{ deviceId: 'ring', preset: 'Glass bells', params: { root: 0, mix: 0.25 } }],
  },
  {
    id: 'sixteen-harp-pedals-pedals-in-a-tin',
    name: 'Pedals in a tin',
    category: 'bell',
    preview: UNCROSSED_CROSSED,
    description:
      'Short hard chimes, one to a key, played inside a small tin and put through eight-bit converters.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Small music box',
      params: { volume: -4, sustain: 0.5, tone: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin' },
      { deviceId: 'vintage-digital', preset: 'Toy', params: { bits: 8 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-trail-up-the-wire',
    name: 'Trail up the wire',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'Dull single plucks whose partials are each followed by a pure sine an octave up that lingers five seconds.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: -1.5, sustain: 0.7, tone: 0.1, spread: 0.8 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.65 } }],
  },
  {
    id: 'sixteen-harp-pedals-settings-held-as-pipes',
    name: 'Settings held as pipes',
    category: 'organ',
    preview: PEDAL_BY_PEDAL,
    description:
      'No strings to speak of: the soft square pad of the held chord, with a vibrato that comes in late and an airy hall.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { sustain: 0.2, tone: 0, pad: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-swarm-down-the-strings',
    name: 'Swarm down the strings',
    category: 'texture',
    preview: ELEVENTH_FALL,
    description: 'Single chimes thrown into a cavern of short echoes that patter after each note.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: -0.5, sustain: 0.4, tone: 0.8, spread: 1 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.6 } }],
  },

  // Scattered, brushed and blurred.
  {
    id: 'sixteen-harp-pedals-strings-taken-at-random',
    name: 'Strings taken at random',
    category: 'texture',
    preview: TWO_PENTATONICS,
    description:
      'The chord plucked in no order over four octaves, short and bright, with a few sparks two octaves up drifting off it.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Scattered glints',
      params: { strum: 100, sustain: 0.5, tone: 0.7 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { density: 2.5, mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-rain-off-the-discs',
    name: 'Rain off the discs',
    category: 'texture',
    preview: SUSPENDED_STRUMS,
    description:
      'Tiny random plucks over four octaves, left out in a light rain that rises and falls.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'String rain',
      params: { strum: 45, sustain: 0.6, tone: 0.6, span: 3 },
    },
    effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } }],
  },
  {
    id: 'sixteen-harp-pedals-brushed-with-a-sleeve',
    name: 'Brushed with a sleeve',
    category: 'pad',
    preview: SUSPENDED_STRUMS,
    description:
      'A soft brushed chord hung as a still mist that outlives it, its bass and top taken off.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { volume: 0.5, strum: 6, sustain: 3, tone: 0.1, pad: 0.1 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Band of fog', params: { mix: 0.75 } }],
  },
  {
    id: 'sixteen-harp-pedals-under-the-shawl',
    name: 'Under the shawl',
    category: 'plucked',
    preview: PEDAL_BY_PEDAL,
    description:
      'A muffled strum driven through a triode, all over two kilohertz shut off and the bass raised.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { volume: -5.5, strum: 60, span: 1, sustain: 2, tone: 0.2, pad: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6, highCut: 2000 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-sung-behind-the-frame',
    name: 'Sung behind the frame',
    category: 'voice',
    preview: TWO_PENTATONICS,
    description:
      'A medium strum with the hall behind it singing low, dark and long, and the strings kept well under.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: 0.5, strum: 40, span: 2, sustain: 1.2, tone: 0.8, pad: 0.1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.75 } }],
  },
  {
    id: 'sixteen-harp-pedals-plate-in-slow-pulses',
    name: 'Plate in slow pulses',
    category: 'pad',
    preview: PEDAL_BY_PEDAL,
    description:
      'A quick sweep there and back over its long ring and pad, pulsed deep three times a second, in a small tight room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 15, direction: 2, sustain: 6, tone: 0.5, pad: 0.5 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Soft throb', params: { floor: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-strum-gone-to-embers',
    name: 'Strum gone to embers',
    category: 'texture',
    preview: SUSPENDED_STRUMS,
    description:
      'A short strum looped through a small room again and again until only the ringing of the room is left.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: -2, strum: 30, span: 1, direction: 2, sustain: 1.2, tone: 0.5, pad: 0 },
    },
    effects: [{ deviceId: 'generations', preset: 'Quick to tones', params: { mix: 0.7, hiss: 0 } }],
  },

  // Zither: bare fingers, the harp body.
  {
    id: 'sixteen-harp-pedals-open-to-the-fifth',
    name: 'Open to the fifth',
    category: 'plucked',
    preview: THERE_AND_BACK,
    description:
      'Each key plucks its string with a fifth and an octave by finger, quick and damped, in a dry wooden body.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        exciter: 0,
        chord: 2,
        strum: 45,
        decay: 3,
        release: 0.5,
        brightness: 0.35,
        position: 0.4,
        courses: 0,
        sympathy: 0.1,
        body: 0,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-finger-on-a-long-string',
    name: 'Finger on a long string',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'Single finger plucks at mid string that ring twelve seconds, through a fast rotor heard from far off.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 12, brightness: 0.25, position: 0.5, sympathy: 0.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Far shimmer' }],
  },
  {
    id: 'sixteen-harp-pedals-octave-from-the-thumb',
    name: 'Octave from the thumb',
    category: 'plucked',
    preview: ALL_NATURAL,
    description:
      'Thumb and fourth finger an octave apart, a quarter second between them, with a drifting looped bed behind.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -3.5,
        chord: 1,
        strum: 250,
        decay: 5,
        release: 2,
        brightness: 0.75,
        position: 0.12,
        sympathy: 0.2,
      },
    },
    effects: [{ deviceId: 'micro-looper', preset: 'Drifting', params: { mix: 0.4 } }],
  },
  {
    id: 'sixteen-harp-pedals-twelve-strings-answer',
    name: 'Twelve strings answer',
    category: 'plucked',
    preview: BOTH_CROSSINGS,
    description:
      'Short soft finger plucks under full sympathetic ringing, with what is quiet in it brought up to the front.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { volume: -6, exciter: 0, decay: 1.5, release: 0.6, brightness: 0.3, sympathy: 1 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Even glow' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-falling-from-the-b',
    name: 'Falling from the B',
    category: 'plucked',
    preview: ELEVENTH_FALL,
    description:
      'Dark fingertip strings with a tail that falls in fifths under them and darkens as it goes.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        volume: -8.5,
        decay: 4,
        release: 3,
        brightness: 0.15,
        position: 0.35,
        sympathy: 0.1,
      },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.55 } }],
  },
  {
    id: 'sixteen-harp-pedals-nothing-but-the-ring',
    name: 'Nothing but the ring',
    category: 'pad',
    preview: CROSSED_AT_THE_OCTAVE,
    description:
      'The plucks removed and only the tones kept, hung as a long wash with air spread round it.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 16, release: 12, brightness: 0.5, sympathy: 0.8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Long wash' },
      { deviceId: 'phaser', preset: 'Faint shade' },
    ],
  },

  // Zither: the pick, for the nail.
  {
    id: 'sixteen-harp-pedals-nail-glides-over',
    name: 'Nail glides over',
    category: 'plucked',
    preview: UNCROSSED_CROSSED,
    description:
      'A pick near the bridge on single courses, two-second ring, a comb from a short flanger moving slowly through it.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: 0.5, decay: 2, release: 1, brightness: 0.9, position: 0.06 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.5 } }],
  },
  {
    id: 'sixteen-harp-pedals-beating-unison',
    name: 'Beating unison',
    category: 'plucked',
    preview: UNISON_TRILLS,
    description:
      'Paired courses tuned far apart so every string beats with its twin, picked softly, with a low shadow of sines.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        chord: 0,
        strum: 0,
        decay: 5,
        release: 2,
        brightness: 0.4,
        courses: 1,
        sympathy: 0.2,
      },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5 } }],
  },
  {
    id: 'sixteen-harp-pedals-two-on-one-note',
    name: 'Two on one note',
    category: 'plucked',
    preview: UNISON_TRILLS,
    description:
      'Picked octaves through a slow frequency shift of half a hertz, so pairs turn over one another.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 8, release: 4, brightness: 0.8, courses: 0.5, position: 0.3 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { fine: 0.5, mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-close-to-the-pegs',
    name: 'Close to the pegs',
    category: 'plucked',
    preview: HALF_PEDALS,
    description:
      'Nasal picked strings on a koto body, pushed to a bedside speaker, with hardly any ring.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        volume: -10.5,
        decay: 1.2,
        release: 0.3,
        brightness: 0.7,
        position: 0.09,
        sympathy: 0,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { autoGain: 6 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-parlour-strings-worn',
    name: 'Parlour strings worn',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'Picked octaves off an old disc: narrow, warped, with crackle and a little surface noise.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 1, strum: 30, decay: 4, release: 2, brightness: 0.6, sympathy: 0.3 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.2 } }],
  },
  {
    id: 'sixteen-harp-pedals-cascade-up-the-gamut',
    name: 'Cascade up the gamut',
    category: 'texture',
    preview: HIGH_CROSSING,
    description:
      'Softly picked notes replayed as stacked loops one and two octaves up, over and over, high above the strings.',
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -4.5, decay: 4, release: 2, brightness: 0.35, position: 0.3, body: 1 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.6 } }],
  },
  {
    id: 'sixteen-harp-pedals-sweep-remembered-later',
    name: 'Sweep remembered later',
    category: 'texture',
    preview: THERE_AND_BACK,
    description:
      'Fifths and octaves picked in short strokes; under the echoes, earlier moments drift back, some of them reversed.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 90, decay: 2.5, release: 1, brightness: 0.45, courses: 0.1, sympathy: 0.2 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Backwards', params: { mix: 0.6 } }],
  },

  // Zither: the hammer, for the fingertip that only touches.
  {
    id: 'sixteen-harp-pedals-felt-under-each-disc',
    name: 'Felt under each disc',
    category: 'keys',
    preview: ALL_NATURAL,
    description:
      'Felt hammers halfway along the string, dark as they go, raised so the ring stands level with the stroke, on dull tape.',
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { chord: 0, decay: 6, release: 3, sympathy: 0.3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-rolled-on-the-bass-wires',
    name: 'Rolled on the bass wires',
    category: 'drone',
    preview: LOW_WASH,
    description:
      'Hammers rolling twelve to the second on dulcimer strings, so low notes hold as a tremble, shut in by a dark filter and a cave.',
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { roll: 12, decay: 4, release: 2, brightness: 0.2, position: 0.3 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-trill-of-small-hammers',
    name: 'Trill of small hammers',
    category: 'plucked',
    preview: UNISON_TRILLS,
    description: 'Bright hammers with octave and roll, very short, with a wide dotted echo.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { volume: -7, roll: 7, decay: 1, release: 0.3, brightness: 0.8, sympathy: 0.1 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { spread: 1, mix: 0.4 } }],
  },
  {
    id: 'sixteen-harp-pedals-hammered-into-water',
    name: 'Hammered into water',
    category: 'texture',
    preview: LOW_WASH,
    description:
      'Single hammered strings at the sea floor: heavy, close and rolling, bubbles off each stroke.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { brightness: 0.7, decay: 8, release: 5, sympathy: 0.6 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sea floor', params: { bubbles: 0.5 } }],
  },
  {
    id: 'sixteen-harp-pedals-hammer-turned-to-bell',
    name: 'Hammer turned to bell',
    category: 'bell',
    preview: PENTATONIC_RISE,
    description:
      'Hard hammers with the partials leaned apart into a struck metal bar, bright, with a little plate behind.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        chord: 0,
        roll: 0,
        decay: 5,
        release: 2,
        brightness: 0.9,
        position: 0.2,
        courses: 0,
        sympathy: 0.2,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { mix: 0.9 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-hammer-without-a-stroke',
    name: 'Hammer without a stroke',
    category: 'pad',
    preview: BOTH_CROSSINGS,
    description:
      'Felt hammers in octaves with twelve strings ringing behind, every stroke faded in over a second and a half.',
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { brightness: 0.4, decay: 14, release: 8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 1400 } },
      { deviceId: 'late-vibrato', preset: 'Wide drone' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-pedals-into-the-haze',
    name: 'Pedals into the haze',
    category: 'pad',
    preview: CROSSED_AT_THE_OCTAVE,
    description:
      'Rolled dulcimer strings run through fuzz between two reverbs, with an octave glowing above.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { chord: 0, roll: 5, decay: 4, release: 2, brightness: 0.4 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.6 } }],
  },

  // Zither: strums of a whole setting from one key.
  {
    id: 'sixteen-harp-pedals-fourths-on-five-notes',
    name: 'Fourths on five notes',
    category: 'plucked',
    preview: PENTATONIC_RISE,
    description:
      'One key strums a fourth, a fifth and the root, which stays on the white keys from C, D, E, G or A, by soft pick.',
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        strum: 120,
        direction: 0,
        decay: 5,
        release: 3,
        brightness: 0.3,
        position: 0.4,
        body: 1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-long-arm-across',
    name: 'Long arm across',
    category: 'plucked',
    preview: THERE_AND_BACK,
    description:
      'A slow roll of fifths and octaves, half a second wide, in a vast nave behind a quiet pluck.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { volume: -6, chord: 2, strum: 500, decay: 7, brightness: 0.4, position: 0.22 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.6 } },
      { deviceId: 'spread', preset: 'Everything wide' },
    ],
  },
  {
    id: 'sixteen-harp-pedals-down-by-octaves',
    name: 'Down by octaves',
    category: 'plucked',
    preview: ELEVENTH_FALL,
    description:
      'Downward octaves picked on dulcimer courses, their repeats dropping an octave each time.',
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        direction: 1,
        strum: 180,
        decay: 2.5,
        release: 1,
        brightness: 0.5,
        courses: 0.3,
        body: 2,
      },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Falling steps', params: { pitchA: -12, mix: 0.4 } },
    ],
  },
  {
    id: 'sixteen-harp-pedals-fifths-in-midwinter',
    name: 'Fifths in midwinter',
    category: 'texture',
    preview: PENTATONIC_RISE,
    description:
      'Picked fifths and octaves that thin out and freeze in a deep winter, the strings gone to ice and air.',
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 60, decay: 10, release: 8, brightness: 0.85, sympathy: 0.7 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { turn: 0 } }],
  },
  {
    id: 'sixteen-harp-pedals-sleeve-across-octaves',
    name: 'Sleeve across octaves',
    category: 'pad',
    preview: LOW_WASH,
    description:
      'Soft octaves blurred to a dark bank, the pulse of a slow breath opening and closing over them.',
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { chord: 1, strum: 80, decay: 14, brightness: 0.2, sympathy: 0.6 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank' },
      { deviceId: 'breath', preset: 'Calm breath' },
    ],
  },
]
