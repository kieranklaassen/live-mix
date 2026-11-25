import { type FactoryPreset, type Phrase } from '../types'

// One chord shape, kept in scale steps, slides along the white keys over a bass that stays put.
// Laid out by instrument: how the attack is taken off, how bright or low the body is, and a colour
// (a vowel, a pipe, a fixed filter) that stays where it is while the chords move through it.

// First-inversion triads, tops C D E, C B G, over D and A: major, minor, minor, major, diminished,
// major, in 6/4 as long, short, longer, twice over.
const SIXTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.66, note: 38, gain: 0.3 },
    { atSec: 0, durSec: 6.66, note: 45, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 64, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 67, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 72, gain: 0.38 },
    { atSec: 1.11, durSec: 0.55, note: 65, gain: 0.3 },
    { atSec: 1.11, durSec: 0.55, note: 69, gain: 0.3 },
    { atSec: 1.11, durSec: 0.55, note: 74, gain: 0.38 },
    { atSec: 1.66, durSec: 1.67, note: 67, gain: 0.3 },
    { atSec: 1.66, durSec: 1.67, note: 71, gain: 0.3 },
    { atSec: 1.66, durSec: 1.67, note: 76, gain: 0.38 },
    { atSec: 3.33, durSec: 1.11, note: 64, gain: 0.3 },
    { atSec: 3.33, durSec: 1.11, note: 67, gain: 0.3 },
    { atSec: 3.33, durSec: 1.11, note: 72, gain: 0.38 },
    { atSec: 4.44, durSec: 0.55, note: 62, gain: 0.3 },
    { atSec: 4.44, durSec: 0.55, note: 65, gain: 0.3 },
    { atSec: 4.44, durSec: 0.55, note: 71, gain: 0.38 },
    { atSec: 4.99, durSec: 1.67, note: 59, gain: 0.3 },
    { atSec: 4.99, durSec: 1.67, note: 62, gain: 0.3 },
    { atSec: 4.99, durSec: 1.67, note: 67, gain: 0.38 },
  ],
}

// The same shape higher, for three flutes over a held D: E minor, F major, A minor, G major, D minor,
// in 3/2, the last for a whole bar.
const FLUTES: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.57, note: 62, gain: 0.24 },
    { atSec: 0, durSec: 1.46, note: 67, gain: 0.32 },
    { atSec: 0, durSec: 1.46, note: 71, gain: 0.32 },
    { atSec: 0, durSec: 1.46, note: 76, gain: 0.4 },
    { atSec: 1.46, durSec: 0.73, note: 69, gain: 0.32 },
    { atSec: 1.46, durSec: 0.73, note: 72, gain: 0.32 },
    { atSec: 1.46, durSec: 0.73, note: 77, gain: 0.4 },
    { atSec: 2.19, durSec: 1.46, note: 72, gain: 0.32 },
    { atSec: 2.19, durSec: 1.46, note: 76, gain: 0.32 },
    { atSec: 2.19, durSec: 1.46, note: 81, gain: 0.4 },
    { atSec: 3.65, durSec: 0.73, note: 71, gain: 0.32 },
    { atSec: 3.65, durSec: 0.73, note: 74, gain: 0.32 },
    { atSec: 3.65, durSec: 0.73, note: 79, gain: 0.4 },
    { atSec: 4.38, durSec: 2.19, note: 65, gain: 0.32 },
    { atSec: 4.38, durSec: 2.19, note: 69, gain: 0.32 },
    { atSec: 4.38, durSec: 2.19, note: 74, gain: 0.4 },
  ],
}

// The same shape in the low reeds and brass over G: C, D minor, E minor, D minor, B diminished, C, each a
// first inversion.
const LOW_SIXTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.57, note: 43, gain: 0.3 },
    { atSec: 0, durSec: 1.46, note: 52, gain: 0.32 },
    { atSec: 0, durSec: 1.46, note: 55, gain: 0.32 },
    { atSec: 0, durSec: 1.46, note: 60, gain: 0.4 },
    { atSec: 1.46, durSec: 0.73, note: 53, gain: 0.32 },
    { atSec: 1.46, durSec: 0.73, note: 57, gain: 0.32 },
    { atSec: 1.46, durSec: 0.73, note: 62, gain: 0.4 },
    { atSec: 2.19, durSec: 1.46, note: 55, gain: 0.32 },
    { atSec: 2.19, durSec: 1.46, note: 59, gain: 0.32 },
    { atSec: 2.19, durSec: 1.46, note: 64, gain: 0.4 },
    { atSec: 3.65, durSec: 0.73, note: 53, gain: 0.32 },
    { atSec: 3.65, durSec: 0.73, note: 57, gain: 0.32 },
    { atSec: 3.65, durSec: 0.73, note: 62, gain: 0.4 },
    { atSec: 4.38, durSec: 0.73, note: 50, gain: 0.32 },
    { atSec: 4.38, durSec: 0.73, note: 53, gain: 0.32 },
    { atSec: 4.38, durSec: 0.73, note: 59, gain: 0.4 },
    { atSec: 5.11, durSec: 1.46, note: 52, gain: 0.32 },
    { atSec: 5.11, durSec: 1.46, note: 55, gain: 0.32 },
    { atSec: 5.11, durSec: 1.46, note: 60, gain: 0.4 },
  ],
}

// Stacked fourths A-D-G, B-E-A, C-F-B, D-G-C and back, over A: the F-B tritone is left in. 6/4.
const FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.66, note: 45, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 57, gain: 0.32 },
    { atSec: 0, durSec: 1.11, note: 62, gain: 0.32 },
    { atSec: 0, durSec: 1.11, note: 67, gain: 0.4 },
    { atSec: 1.11, durSec: 1.11, note: 59, gain: 0.32 },
    { atSec: 1.11, durSec: 1.11, note: 64, gain: 0.32 },
    { atSec: 1.11, durSec: 1.11, note: 69, gain: 0.4 },
    { atSec: 2.22, durSec: 1.48, note: 60, gain: 0.32 },
    { atSec: 2.22, durSec: 1.48, note: 65, gain: 0.32 },
    { atSec: 2.22, durSec: 1.48, note: 71, gain: 0.4 },
    { atSec: 3.7, durSec: 0.74, note: 62, gain: 0.32 },
    { atSec: 3.7, durSec: 0.74, note: 67, gain: 0.32 },
    { atSec: 3.7, durSec: 0.74, note: 72, gain: 0.4 },
    { atSec: 4.44, durSec: 2.22, note: 57, gain: 0.32 },
    { atSec: 4.44, durSec: 2.22, note: 62, gain: 0.32 },
    { atSec: 4.44, durSec: 2.22, note: 67, gain: 0.4 },
  ],
}

// Root, fifth, ninth, no third: C-G-D, D-A-E, F-C-G, G-D-A, F-C-G in half notes of 3/2 over F.
const NINTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 41, gain: 0.3 },
    { atSec: 0, durSec: 1.1, note: 48, gain: 0.34 },
    { atSec: 0, durSec: 1.1, note: 55, gain: 0.34 },
    { atSec: 0, durSec: 1.1, note: 62, gain: 0.42 },
    { atSec: 1.1, durSec: 1.1, note: 50, gain: 0.34 },
    { atSec: 1.1, durSec: 1.1, note: 57, gain: 0.34 },
    { atSec: 1.1, durSec: 1.1, note: 64, gain: 0.42 },
    { atSec: 2.2, durSec: 1.1, note: 53, gain: 0.34 },
    { atSec: 2.2, durSec: 1.1, note: 60, gain: 0.34 },
    { atSec: 2.2, durSec: 1.1, note: 67, gain: 0.42 },
    { atSec: 3.3, durSec: 1.1, note: 55, gain: 0.34 },
    { atSec: 3.3, durSec: 1.1, note: 62, gain: 0.34 },
    { atSec: 3.3, durSec: 1.1, note: 69, gain: 0.42 },
    { atSec: 4.4, durSec: 2.2, note: 53, gain: 0.34 },
    { atSec: 4.4, durSec: 2.2, note: 60, gain: 0.34 },
    { atSec: 4.4, durSec: 2.2, note: 67, gain: 0.42 },
  ],
}

// Parallel fifths doubled at the octave, D-A, E-B, G-D, F-C, E-B, D-A, free in length, over a low G.
const ORGANUM: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 43, gain: 0.24 },
    { atSec: 0, durSec: 1.5, note: 50, gain: 0.3 },
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.3 },
    { atSec: 0, durSec: 1.5, note: 62, gain: 0.3 },
    { atSec: 0, durSec: 1.5, note: 69, gain: 0.38 },
    { atSec: 1.5, durSec: 0.7, note: 52, gain: 0.3 },
    { atSec: 1.5, durSec: 0.7, note: 59, gain: 0.3 },
    { atSec: 1.5, durSec: 0.7, note: 64, gain: 0.3 },
    { atSec: 1.5, durSec: 0.7, note: 71, gain: 0.38 },
    { atSec: 2.2, durSec: 1.2, note: 55, gain: 0.3 },
    { atSec: 2.2, durSec: 1.2, note: 62, gain: 0.3 },
    { atSec: 2.2, durSec: 1.2, note: 67, gain: 0.3 },
    { atSec: 2.2, durSec: 1.2, note: 74, gain: 0.38 },
    { atSec: 3.4, durSec: 0.8, note: 53, gain: 0.3 },
    { atSec: 3.4, durSec: 0.8, note: 60, gain: 0.3 },
    { atSec: 3.4, durSec: 0.8, note: 65, gain: 0.3 },
    { atSec: 3.4, durSec: 0.8, note: 72, gain: 0.38 },
    { atSec: 4.2, durSec: 0.7, note: 52, gain: 0.3 },
    { atSec: 4.2, durSec: 0.7, note: 59, gain: 0.3 },
    { atSec: 4.2, durSec: 0.7, note: 64, gain: 0.3 },
    { atSec: 4.2, durSec: 0.7, note: 71, gain: 0.38 },
    { atSec: 4.9, durSec: 1.7, note: 50, gain: 0.3 },
    { atSec: 4.9, durSec: 1.7, note: 57, gain: 0.3 },
    { atSec: 4.9, durSec: 1.7, note: 62, gain: 0.3 },
    { atSec: 4.9, durSec: 1.7, note: 69, gain: 0.38 },
  ],
}

// Seconds C-D, E-F, G-A, B-C, G-A and C-D in 3/2 over G: whole tones and semitones trade places.
const SECONDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 67, gain: 0.26 },
    { atSec: 0, durSec: 1.1, note: 72, gain: 0.34 },
    { atSec: 0, durSec: 1.1, note: 74, gain: 0.42 },
    { atSec: 1.1, durSec: 1.1, note: 76, gain: 0.34 },
    { atSec: 1.1, durSec: 1.1, note: 77, gain: 0.42 },
    { atSec: 2.2, durSec: 1.1, note: 79, gain: 0.34 },
    { atSec: 2.2, durSec: 1.1, note: 81, gain: 0.42 },
    { atSec: 3.3, durSec: 0.55, note: 83, gain: 0.34 },
    { atSec: 3.3, durSec: 0.55, note: 84, gain: 0.42 },
    { atSec: 3.85, durSec: 0.55, note: 79, gain: 0.34 },
    { atSec: 3.85, durSec: 0.55, note: 81, gain: 0.42 },
    { atSec: 4.4, durSec: 2.2, note: 72, gain: 0.34 },
    { atSec: 4.4, durSec: 2.2, note: 74, gain: 0.42 },
  ],
}

// Open triads, root, fifth and tenth, over D: A minor, B diminished, C, D minor, C, A minor. 3/2.
const OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.57, note: 50, gain: 0.28 },
    { atSec: 0, durSec: 1.46, note: 57, gain: 0.32 },
    { atSec: 0, durSec: 1.46, note: 64, gain: 0.32 },
    { atSec: 0, durSec: 1.46, note: 72, gain: 0.4 },
    { atSec: 1.46, durSec: 0.73, note: 59, gain: 0.32 },
    { atSec: 1.46, durSec: 0.73, note: 65, gain: 0.32 },
    { atSec: 1.46, durSec: 0.73, note: 74, gain: 0.4 },
    { atSec: 2.19, durSec: 0.73, note: 60, gain: 0.32 },
    { atSec: 2.19, durSec: 0.73, note: 67, gain: 0.32 },
    { atSec: 2.19, durSec: 0.73, note: 76, gain: 0.4 },
    { atSec: 2.92, durSec: 0.73, note: 62, gain: 0.32 },
    { atSec: 2.92, durSec: 0.73, note: 69, gain: 0.32 },
    { atSec: 2.92, durSec: 0.73, note: 77, gain: 0.4 },
    { atSec: 3.65, durSec: 0.73, note: 60, gain: 0.32 },
    { atSec: 3.65, durSec: 0.73, note: 67, gain: 0.32 },
    { atSec: 3.65, durSec: 0.73, note: 76, gain: 0.4 },
    { atSec: 4.38, durSec: 2.19, note: 57, gain: 0.32 },
    { atSec: 4.38, durSec: 2.19, note: 64, gain: 0.32 },
    { atSec: 4.38, durSec: 2.19, note: 72, gain: 0.4 },
  ],
}

// Four-note stacks of fourths rolled upward, from E, F, G, A and back to E, over D and A.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.5, note: 38, gain: 0.4 },
    { atSec: 0, durSec: 6.5, note: 45, gain: 0.4 },
    { atSec: 0, durSec: 1.3, note: 52, gain: 0.36 },
    { atSec: 0.08, durSec: 1.22, note: 57, gain: 0.36 },
    { atSec: 0.16, durSec: 1.14, note: 62, gain: 0.36 },
    { atSec: 0.24, durSec: 1.06, note: 67, gain: 0.44 },
    { atSec: 1.3, durSec: 1.3, note: 53, gain: 0.36 },
    { atSec: 1.38, durSec: 1.22, note: 59, gain: 0.36 },
    { atSec: 1.46, durSec: 1.14, note: 64, gain: 0.36 },
    { atSec: 1.54, durSec: 1.06, note: 69, gain: 0.44 },
    { atSec: 2.6, durSec: 1.3, note: 55, gain: 0.36 },
    { atSec: 2.68, durSec: 1.22, note: 60, gain: 0.36 },
    { atSec: 2.76, durSec: 1.14, note: 65, gain: 0.36 },
    { atSec: 2.84, durSec: 1.06, note: 71, gain: 0.44 },
    { atSec: 3.9, durSec: 0.98, note: 57, gain: 0.36 },
    { atSec: 3.98, durSec: 0.9, note: 62, gain: 0.36 },
    { atSec: 4.06, durSec: 0.82, note: 67, gain: 0.36 },
    { atSec: 4.14, durSec: 0.74, note: 72, gain: 0.44 },
    { atSec: 4.88, durSec: 1.62, note: 52, gain: 0.36 },
    { atSec: 4.96, durSec: 1.54, note: 57, gain: 0.36 },
    { atSec: 5.04, durSec: 1.46, note: 62, gain: 0.36 },
    { atSec: 5.12, durSec: 1.38, note: 67, gain: 0.44 },
  ],
}

// Bare fourths D-G, E-A, F-B, A-D over a held D, a bar of 3/2 each: the third
// of the four is augmented.
const BARE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 50, gain: 0.32 },
    { atSec: 0, durSec: 1.65, note: 62, gain: 0.4 },
    { atSec: 0, durSec: 1.65, note: 67, gain: 0.48 },
    { atSec: 1.65, durSec: 1.65, note: 64, gain: 0.4 },
    { atSec: 1.65, durSec: 1.65, note: 69, gain: 0.48 },
    { atSec: 3.3, durSec: 1.65, note: 65, gain: 0.4 },
    { atSec: 3.3, durSec: 1.65, note: 71, gain: 0.48 },
    { atSec: 4.95, durSec: 1.65, note: 57, gain: 0.4 },
    { atSec: 4.95, durSec: 1.65, note: 62, gain: 0.48 },
  ],
}

// Three chords without thirds, C-G-D, D-A-E, F-C-G, each held long over G.
const WET_NINTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 55, gain: 0.3 },
    { atSec: 0, durSec: 2.2, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 2.2, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 2.2, note: 74, gain: 0.44 },
    { atSec: 2.2, durSec: 2.2, note: 62, gain: 0.36 },
    { atSec: 2.2, durSec: 2.2, note: 69, gain: 0.36 },
    { atSec: 2.2, durSec: 2.2, note: 76, gain: 0.44 },
    { atSec: 4.4, durSec: 2.2, note: 65, gain: 0.36 },
    { atSec: 4.4, durSec: 2.2, note: 72, gain: 0.36 },
    { atSec: 4.4, durSec: 2.2, note: 79, gain: 0.44 },
  ],
}

// First, second and fifth step, C-D-G, D-E-A, E-F-B, D-E-A, C-D-G, over D and A: the semitone comes
// once. 6/4.
const ONE_TWO_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.66, note: 38, gain: 0.3 },
    { atSec: 0, durSec: 6.66, note: 45, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 60, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 62, gain: 0.3 },
    { atSec: 0, durSec: 1.11, note: 67, gain: 0.38 },
    { atSec: 1.11, durSec: 1.11, note: 62, gain: 0.3 },
    { atSec: 1.11, durSec: 1.11, note: 64, gain: 0.3 },
    { atSec: 1.11, durSec: 1.11, note: 69, gain: 0.38 },
    { atSec: 2.22, durSec: 1.48, note: 64, gain: 0.3 },
    { atSec: 2.22, durSec: 1.48, note: 65, gain: 0.3 },
    { atSec: 2.22, durSec: 1.48, note: 71, gain: 0.38 },
    { atSec: 3.7, durSec: 0.74, note: 62, gain: 0.3 },
    { atSec: 3.7, durSec: 0.74, note: 64, gain: 0.3 },
    { atSec: 3.7, durSec: 0.74, note: 69, gain: 0.38 },
    { atSec: 4.44, durSec: 2.22, note: 60, gain: 0.3 },
    { atSec: 4.44, durSec: 2.22, note: 62, gain: 0.3 },
    { atSec: 4.44, durSec: 2.22, note: 67, gain: 0.38 },
  ],
}

// The pedal itself: D and A held, with the fifths D-A, E-B, D-A passing once above.
const STILL_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 38, gain: 0.45 },
    { atSec: 0, durSec: 6.6, note: 45, gain: 0.45 },
    { atSec: 0, durSec: 2.2, note: 62, gain: 0.2 },
    { atSec: 0, durSec: 2.2, note: 69, gain: 0.28 },
    { atSec: 2.2, durSec: 2.2, note: 64, gain: 0.2 },
    { atSec: 2.2, durSec: 2.2, note: 71, gain: 0.28 },
    { atSec: 4.4, durSec: 2.2, note: 62, gain: 0.2 },
    { atSec: 4.4, durSec: 2.2, note: 69, gain: 0.28 },
  ],
}

// One line, D E G F E D, over a held D, for a sound that adds the parallel voice by itself.
const ONE_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.57, note: 50, gain: 0.34 },
    { atSec: 0, durSec: 1.46, note: 62, gain: 0.45 },
    { atSec: 1.46, durSec: 0.73, note: 64, gain: 0.45 },
    { atSec: 2.19, durSec: 1.46, note: 67, gain: 0.45 },
    { atSec: 3.65, durSec: 0.73, note: 65, gain: 0.45 },
    { atSec: 4.38, durSec: 0.73, note: 64, gain: 0.45 },
    { atSec: 5.11, durSec: 1.46, note: 62, gain: 0.45 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String machine: the tone filter and the ranks stand still while the hands move.
  {
    id: 'white-key-planing-sixths-on-one-exhale',
    name: 'Sixths on one exhale',
    category: 'pad',
    description:
      'Low strings eased in, set through a fixed hollow tube so every chord has one body, with a dark hall behind.',
    preview: SIXTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { volume: -4, attack: 0.4, release: 2.6, tone: 1500, low: 0.5, high: 0, width: 0.6 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.2 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-fourths-from-the-quay',
    name: 'Fourths from the quay',
    category: 'pad',
    description:
      'Muted high strings whose edges are dissolved in a wide mist, then thinned and dulled with distance.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -2, attack: 0.35, release: 1.4, high: 0.6, tone: 2200 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { size: 320 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'white-key-planing-sill-in-full-sun',
    name: 'Sill in full sun',
    category: 'pad',
    description:
      'Bright string machine with its upper octave full, under a phaser that never sweeps and stays as one fixed comb.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.5, release: 2.2, tone: 8500, ensemble: 0.45 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'white-key-planing-candle-end-steps',
    name: 'Candle end steps',
    category: 'pad',
    description:
      'Sawtooth strings closed down to a low murmur, an organ pedal grown beneath and the back wall of a hall.',
    preview: NINTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { volume: -2.5, attack: 0.7, release: 2, tone: 320, low: 0.4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.5 } },
    ],
  },
  {
    id: 'white-key-planing-ferry-at-slack-water',
    name: 'Ferry at slack water',
    category: 'pad',
    description:
      'A very wide slow ensemble, its bands swelling and fading on slow cycles of their own while the chords move.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.5, release: 3, tone: 3800 },
    },
    effects: [{ deviceId: 'currents', preset: 'Slow water', params: { depth: 0.85 } }],
  },
  {
    id: 'white-key-planing-milk-glass-strings',
    name: 'Milk glass strings',
    category: 'pad',
    description:
      'Bright strings with the lows and the top both taken off by a band filter that does not move, on one faint spring.',
    preview: SIXTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -1, attack: 0.3, speed: 0.6, high: 0.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 2, slope: 0, cutoffHz: 1250, resonance: 1.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'white-key-planing-bare-fifths-at-lauds',
    name: 'Bare fifths at lauds',
    category: 'organ',
    description:
      'A plain chorusless string organ with a soft onset, its hall shaped into a round oo that holds its vowel.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -8, attack: 0.22, release: 0.8, tone: 1700, high: 0.3 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { motion: 0, mix: 0.55 } }],
  },
  {
    id: 'white-key-planing-the-tritone-left-in',
    name: 'The tritone left in',
    category: 'string',
    description:
      'One octave of plain violas on worn tape, narrow and a little seasick, with three close tape heads after.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.4, release: 0.6, tone: 2600 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-sandbar-cellos',
    name: 'Sandbar cellos',
    category: 'string',
    description:
      'Low string machine pushed on to tape, each chord answered by a dark swell that rises behind it.',
    preview: NINTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.5, release: 1.2, tone: 900, width: 0.3 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -6 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'white-key-planing-three-octaves-abreast',
    name: 'Three octaves abreast',
    category: 'pad',
    description:
      'All three octaves of saws at once, turned into a flock round the listener and set in a vast nave.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.9, release: 3.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'white-key-planing-bare-saws-in-step',
    name: 'Bare saws in step',
    category: 'keys',
    description:
      'Saws without ensemble, narrow, through a combo amplifier in a room, swaying only once they are held.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.12, release: 0.3, tone: 3000, low: 0.1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.15 } },
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
    ],
  },

  // Horns: kind of brass, number of players, mute, air.
  {
    id: 'white-key-planing-half-notes-in-lead',
    name: 'Half notes in lead',
    category: 'wind',
    description:
      'Low brass in a full section, rounded by a slow onset, walking its empty ninths through a dark four-second hall.',
    preview: NINTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.5, release: 1.6, blow: 0.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.4 } }],
  },
  {
    id: 'white-key-planing-flugels-over-f',
    name: 'Flugels over F',
    category: 'wind',
    description:
      'A flugelhorn choir, breathy and slow, with a soft string pad that swells in behind the chords.',
    preview: NINTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.4, release: 1.2, breath: 0.4 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'white-key-planing-mutes-on-the-far-pier',
    name: 'Mutes on the far pier',
    category: 'wind',
    description:
      'Muted trumpets in section, every entry blurred away in a fog, then set well back in the open air.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: 0, attack: 0.35, release: 1.4, blow: 0.45 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.75 } },
    ],
  },
  {
    id: 'white-key-planing-air-through-brass',
    name: 'Air through brass',
    category: 'texture',
    description:
      'Horns that are almost all breath, their hidden overtones drawn up and left to smear for seconds.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.4, release: 1.6, blow: 0.12, breath: 0.85 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.7 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'white-key-planing-tubas-under-snow',
    name: 'Tubas under snow',
    category: 'wind',
    description:
      'Single soft tubas, one to a note, in ninths without thirds, muffled above and doubled an octave below by a shifted copy.',
    preview: NINTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.3, release: 1, blow: 0.3 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'white-key-planing-a-fifth-added-by-hand',
    name: 'A fifth added by hand',
    category: 'wind',
    description:
      'Flugelhorns that sound a parallel fifth over every key, so one line planes by itself, through a wide chorus and a dark plate.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { volume: 1, attack: 0.35, release: 1.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-fourth-below-the-line',
    name: 'Fourth below the line',
    category: 'wind',
    description:
      'Horns with a parallel fourth under every key, nearly one player a part, warmed by a triode and a small bright tank.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { attack: 0.2, release: 0.8, section: 0.1, harmony: -1 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'white-key-planing-glacier-tongue-brass',
    name: 'Glacier tongue brass',
    category: 'wind',
    description:
      'Hard-blown horns that swell for over a second, in a huge space whose tail gathers and swells in after them.',
    preview: BARE,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 1.3, release: 3, blow: 0.9 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.35, decay: 5 } }],
  },
  {
    id: 'white-key-planing-brass-in-a-drained-lock',
    name: 'Brass in a drained lock',
    category: 'wind',
    description:
      'Open trumpets in section, heard almost wholly from inside a large stopped pipe whose ring stays put.',
    preview: OPEN,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.5, release: 0.7, blow: 0.3, section: 0.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Cistern',
        params: { mix: 0.95, opening: 0.2, size: 2.2, tone: 0.8, material: 1 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'white-key-planing-after-hours-in-step',
    name: 'After hours, in step',
    category: 'wind',
    description:
      'One muted trumpet to a note with a broad vibrato, on a clean transistor set in the next room.',
    preview: OPEN,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.12, release: 0.5, blow: 0.35, vibrato: 0.6 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { static: 0.1 } },
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-trombones-unhurried',
    name: 'Trombones unhurried',
    category: 'wind',
    description:
      'Straight trombones with the bite blown off by a soft entry, then repeated by a dark drifting bucket echo.',
    preview: LOW_SIXTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { attack: 0.14, release: 0.6, blow: 0.6, vibrato: 0 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.35 } }],
  },

  // Glass: struck tones with the strike taken away, or left soft.
  {
    id: 'white-key-planing-motor-on-wet-bars',
    name: 'Motor on, wet bars',
    category: 'bell',
    description:
      'Mallet glass with a softened strike and the motor on: a tremolo that swings from side to side, a small plate.',
    preview: SECONDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { attack: 0.02, decay: 4, release: 3, brightness: 0.22 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 4.2, shape: 0, depth: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-seconds-in-a-basin',
    name: 'Seconds in a basin',
    category: 'bell',
    description:
      'Metal bowl tones a step apart, softly started and beating, just under the surface of sunlit water.',
    preview: SECONDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { attack: 0.08, decay: 6, detune: 9, release: 4 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }],
  },
  {
    id: 'white-key-planing-frosted-ninths',
    name: 'Frosted ninths',
    category: 'pad',
    description:
      'A slow FM glass pad, all spread, sitting in the resonance of one fixed thin vowel and a short still room.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { attack: 0.8, release: 3, sustain: 0.9 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin vowel', params: { amount: 1.4 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-fourths-through-quartz',
    name: 'Fourths through quartz',
    category: 'pad',
    description:
      'A crystal pad opened over half a second, every partial flickering on a slow tremolo of its own.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { volume: -14.5, attack: 0.5, release: 1.8, brightness: 0.42, ratio: 5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-rims-rubbed-together',
    name: 'Rims rubbed together',
    category: 'pad',
    description:
      'Rubbed glass with its onset slurred into a soft cloud, then moved round the head in a slow eight.',
    preview: BARE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { attack: 0.2, release: 1.2, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud' },
      { deviceId: 'around', preset: 'Slow eight' },
    ],
  },
  {
    id: 'white-key-planing-gong-tide',
    name: 'Gong tide',
    category: 'bell',
    description:
      'Dark detuned gong tones under the moving ninths, darkening and sagging a little the longer they ring.',
    preview: NINTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Dark gong',
      params: { attack: 0.15, brightness: 0.35, release: 5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.45 } }],
  },
  {
    id: 'white-key-planing-bowed-tin-level-water',
    name: 'Bowed tin, level water',
    category: 'pad',
    description:
      'Metal FM tones bowed in slowly, combed by a frequency shift so small it hardly moves, through a stone stair.',
    preview: BARE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { attack: 0.5, release: 2, feedback: 0.1, ratio: 4 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-organ-of-thimbles',
    name: 'Organ of thimbles',
    category: 'organ',
    description:
      'A clear glass organ with a short soft onset, each chord returning backwards and an octave up.',
    preview: SECONDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { attack: 0.06, brightness: 0.2, ratio: 11, release: 0.9 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.3 } }],
  },
  {
    id: 'white-key-planing-breath-on-a-warm-pane',
    name: 'Breath on a warm pane',
    category: 'pad',
    description:
      'Warm wide-tuned FM pad closed by a very slow low-pass, with no high glass left in it, in a plain hall.',
    preview: OPEN,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { attack: 0.35, release: 1.6, detune: 18 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 900 } },
      { deviceId: 'shimmer', preset: 'Plain hall' },
    ],
  },
  {
    id: 'white-key-planing-rungs-of-thin-ice',
    name: 'Rungs of thin ice',
    category: 'bell',
    description:
      'Ice chimes with the strike sifted away, only the tones left, thrown as a few faint points across the width.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { attack: 0.01, decay: 3.5, release: 4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Bowed entries' },
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-tines-in-a-tide-pool',
    name: 'Tines in a tide pool',
    category: 'keys',
    description:
      'Soft tine keys turned into a pad by a slow swell on every note, on a slow rotating speaker at a distance.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { decay: 5, release: 1.5, brightness: 0.28 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 260 } },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },

  // Flute: three players to a chord; breath, pipe and touch.
  {
    id: 'white-key-planing-three-flutes-over-held-d',
    name: 'Three flutes over held D',
    category: 'wind',
    description:
      'Concert flutes with almost no tongue and no vibrato, their pipes made larger than life, in a small chamber.',
    preview: FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.18, release: 0.7, breath: 0.2 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-the-breath-slides-first',
    name: 'The breath slides first',
    category: 'wind',
    description:
      'Low flutes that are mostly air, heard almost wholly through a hall that sings one fixed oo as the chords pass.',
    preview: FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.4, release: 1.4, breath: 0.85, blow: 0.3 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Oo behind',
        params: { motion: 0, mix: 0.85, decay: 2.5, preDelay: 10 },
      },
    ],
  },
  {
    id: 'white-key-planing-hollow-canes-on-sand',
    name: 'Hollow canes on sand',
    category: 'wind',
    description:
      'Pan pipes blown with hardly any chiff, in the fixed resonance of a glass tube and a standing comb.',
    preview: FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.35, release: 1, breath: 0.4, blow: 0.6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube' },
      { deviceId: 'flanger', preset: 'Standing comb', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-recorders-at-a-window',
    name: 'Recorders at a window',
    category: 'wind',
    description:
      'Plain soft recorders, quick and near, with glassy octaves over them and a late copy a few cents away.',
    preview: FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.09, release: 0.3, blow: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up2: 0.2 } },
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'white-key-planing-alto-flutes-low-water',
    name: 'Alto flutes, low water',
    category: 'wind',
    description:
      'Low flutes with a full vibrato and little chiff, a copy an octave under them, far out on open flats.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { attack: 0.2, release: 1, chiff: 0.1, blow: 0.55 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0, sub1: 0.45 } },
      { deviceId: 'distance', preset: 'Far shore', params: { distance: 0.6 } },
    ],
  },
  {
    id: 'white-key-planing-bamboo-a-step-apart',
    name: 'Bamboo a step apart',
    category: 'wind',
    description:
      'Bamboo flutes leaning up into each pair from a half step below, seconds beating, with slow tape repeats.',
    preview: SECONDS,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.25, release: 1.2, scoop: 100, vibrato: 0.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.35 } }],
  },
  {
    id: 'white-key-planing-wood-with-no-beginning',
    name: 'Wood with no beginning',
    category: 'wind',
    description:
      'Wooden flutes whose every start is drawn out of silence by a swell, then held on in a veil of warm haze.',
    preview: FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { attack: 0.1, release: 1.4, scoop: 0, chiff: 0, vibrato: 0.15 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 260 } },
      { deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'white-key-planing-pipes-breathing-as-one',
    name: 'Pipes breathing as one',
    category: 'texture',
    description:
      'Pan pipes blown so softly that only air sounds, rung through a narrow C major filter so the breath comes out as white keys.',
    preview: SECONDS,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { volume: -13, attack: 0.35, release: 1.4, chiff: 0, blow: 0.2 },
    },
    effects: [
      { deviceId: 'scale-filter', preset: 'In a major key', params: { ring: 2.5, width: 10 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'white-key-planing-flutes-brick-arch',
    name: 'Flutes, brick arch',
    category: 'wind',
    description:
      'Flutes blown hard but started late, over a saturated console and a short gated arch.',
    preview: FLUTES,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -15, attack: 0.16, release: 0.4, chiff: 0.1, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } },
    ],
  },

  // Clarinet: hollow pipe to conical bore, whisper to open tone.
  {
    id: 'white-key-planing-reeds-in-open-tenths',
    name: 'Reeds in open tenths',
    category: 'wind',
    description:
      'Warm clarinets with a slow tongue, triads spread to a tenth, in a small room of one second.',
    preview: OPEN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.22, release: 0.5, breath: 0.15 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } }],
  },
  {
    id: 'white-key-planing-low-reeds-lamp-turned',
    name: 'Low reeds, lamp turned',
    category: 'wind',
    description:
      'Bass clarinets in close first inversions, lows raised by a transformer, hardly lit above.',
    preview: LOW_SIXTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.2, release: 0.6, blow: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { highCut: 2600 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'white-key-planing-a-hum-through-cane',
    name: 'A hum through cane',
    category: 'wind',
    description:
      'Reeds barely set going, close to a sine, more than half replaced by a halo of sines two octaves up.',
    preview: OPEN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.3, release: 1, blow: 0.12 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Two octaves up', params: { mix: 0.6 } }],
  },
  {
    id: 'white-key-planing-subtone-in-a-row',
    name: 'Subtone in a row',
    category: 'wind',
    description:
      'Breathy tenor subtones side by side, through a small paper speaker turned away from the microphone.',
    preview: OPEN,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { volume: -5.5, attack: 0.14, release: 0.5, breath: 0.6, vibrato: 0 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'white-key-planing-wind-in-the-reed-bed',
    name: 'Wind in the reed bed',
    category: 'texture',
    description:
      'Whispered reeds in bare fourths, crossed by gusts of wind, with the breath between them brought up.',
    preview: BARE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.35, release: 1.1, blow: 0.2 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Low breath' },
      { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.45 } },
    ],
  },
  {
    id: 'white-key-planing-cane-at-matins',
    name: 'Cane at matins',
    category: 'wind',
    description:
      'A half-conical reed with one steady tone, its resonance fixed on an open vowel, in a cathedral tail.',
    preview: BARE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.18, release: 0.6, vibrato: 0.1, bore: 0.45 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 1.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-tenors-on-the-flood',
    name: 'Tenors on the flood',
    category: 'wind',
    description:
      'Firmly blown tenor reeds that swell for over a second and lap back as a slow wandering echo of themselves.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Tenor swell',
      params: { attack: 1.2, release: 2, vibrato: 0.1, blow: 0.65 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.3 } }],
  },
  {
    id: 'white-key-planing-sopranos-on-a-ledge',
    name: 'Sopranos on a ledge',
    category: 'wind',
    description:
      'Bright conical sopranos, softened at the start, whose width opens and closes in slow breaths of five seconds.',
    preview: FLUTES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.2, release: 0.6, vibrato: 0, blow: 0.5 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'white-key-planing-flutter-under-a-bell-jar',
    name: 'Flutter under a bell jar',
    category: 'texture',
    description:
      'Flutter-tongued reeds, the growl half hidden in a long smear that keeps only the middle of the spectrum.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.4, release: 1.5, growl: 0.7, blow: 0.3 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Band of fog' }],
  },

  // Reed organ: stops drawn once, then left.
  {
    id: 'white-key-planing-stops-drawn-once',
    name: 'Stops drawn once',
    category: 'organ',
    description:
      'Flute stops only, soft and level, the fourths gliding past each other in a bright three-second room.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.25, release: 1, sub: 0.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air' }],
  },
  {
    id: 'white-key-planing-slow-feet-on-the-pump',
    name: 'Slow feet on the pump',
    category: 'organ',
    description:
      'A wheezing reed stop whose bellows breathe with every step, narrow, on a worn quarter-inch reel.',
    preview: SIXTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { volume: -14.5, attack: 0.18, release: 0.4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'white-key-planing-the-pedal-never-moves',
    name: 'The pedal never moves',
    category: 'drone',
    description:
      'A deep sub rank held throughout with a fifth crossing above it once, and slow weight beneath from a low shadow.',
    preview: STILL_BASS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.5, release: 1.5, octave: 0.25, tone: 1100 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'white-key-planing-quint-and-nothing-else',
    name: 'Quint and nothing else',
    category: 'organ',
    description:
      'A twelfth rank over every key, so ninths without thirds grow one fifth taller, with one tape head and a hollow chorus after.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { attack: 0.3, release: 0.9 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-celeste-on-a-lagoon',
    name: 'Celeste on a lagoon',
    category: 'organ',
    description:
      'Two flute ranks beating slowly against each other and nothing else, rippled by many small soft swells.',
    preview: OPEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { volume: -14.5, attack: 0.35, release: 1.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples' },
      { deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.3, interval: 1 } },
    ],
  },
  {
    id: 'white-key-planing-through-the-vestry-wall',
    name: 'Through the vestry wall',
    category: 'organ',
    description:
      'Every rank drawn but the shutter closed, heard low and woolly from next door, with the tone of an empty room around it.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -12, attack: 0.2, release: 0.8, tone: 500 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'white-key-planing-voice-stop-in-lockstep',
    name: 'Voice stop in lockstep',
    category: 'organ',
    description:
      'A nasal reed rank with the tremulant off, its tone replaced by one thin vowel that the chord slides through.',
    preview: OPEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { attack: 0.2, release: 0.7, tremulant: 0, tone: 4200 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'All vowel', params: { replace: 0.8, amount: 1.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-noon-through-the-swell',
    name: 'Noon through the swell',
    category: 'organ',
    description:
      'A bright chorus of ranks brought in over a second, turned slowly on a rotating horn and drum.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1.1, release: 1.8 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-loft-with-the-door-open',
    name: 'Loft with the door open',
    category: 'texture',
    description:
      'A flute rank that is mostly wind noise, its air brought up and spread wide, under one resonant peak that is held still.',
    preview: SIXTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { attack: 0.3, release: 1.2, breath: 0.8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Breath and tone' },
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoAmount: 0, envAmount: 0, resonance: 2, cutoffHz: 1600 },
      },
    ],
  },
  // Choir: the vowel is chosen and never moves; age, number and air change instead.
  {
    id: 'white-key-planing-oh-without-turning',
    name: 'Oh, without turning',
    category: 'voice',
    description:
      'Tenors on a single oh, no vowel motion and little vibrato, in parallel fifths on a worn reel of tape.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { motion: 0, vibrato: 4, attack: 0.3, release: 0.8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-trebles-on-one-ee',
    name: 'Trebles on one ee',
    category: 'voice',
    description:
      'A small, bright set of trebles fixed on ee, a bell colour pressed on them, a faint octave climbing in the tail.',
    preview: FLUTES,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { volume: -4, motion: 0, attack: 0.4, release: 1.4, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin glass' },
      { deviceId: 'shimmer', preset: 'Faint glimmer' },
    ],
  },
  {
    id: 'white-key-planing-mouths-closed-over-g',
    name: 'Mouths closed over G',
    category: 'voice',
    description:
      'Humming voices with no top at all, close together, their chords melting over one another on a long glide.',
    preview: LOW_SIXTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { volume: -5, motion: 0, attack: 0.35, release: 1, width: 0.3 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Long glide',
        params: { attack: 0.4, glide: 1.2, mix: 0.45 },
      },
    ],
  },
  {
    id: 'white-key-planing-the-nave-exhales-fifths',
    name: 'The nave exhales fifths',
    category: 'voice',
    description:
      'Voices that are nothing but breath, pitched only by the fifths they whisper, rising and falling on calm slow breaths.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { motion: 0, attack: 0.5, release: 1.4, tone: 6000 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Slow bloom' },
      { deviceId: 'breath', preset: 'Calm breath' },
    ],
  },
  {
    id: 'white-key-planing-altos-ranked-in-fourths',
    name: 'Altos, ranked in fourths',
    category: 'voice',
    description:
      'Altos on an open eh, forward and without vibrato, with a faint plate and a hard levelling so no chord steps out.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -1.5, motion: 0, attack: 0.22, release: 0.6, vibrato: 0, ensemble: 1 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 9 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'white-key-planing-basses-cross-the-crypt',
    name: 'Basses cross the crypt',
    category: 'voice',
    description:
      'Low voices on one dark vowel, formants dropped, ninths without thirds in the stone of a long stairwell.',
    preview: NINTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -4, motion: 0, attack: 0.5, release: 1.4, voice: 0.8, tone: 1800 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'white-key-planing-voices-past-the-headland',
    name: 'Voices past the headland',
    category: 'voice',
    description:
      'A far choir with its vowel held, in wide open triads, the tail shaped as a round oo and sunk in spray.',
    preview: OPEN,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { motion: 0, attack: 0.45, release: 2.5, tone: 3400, vowel: 0.95 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Far shore' },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-one-singer-to-each-key',
    name: 'One singer to each key',
    category: 'voice',
    description:
      'A soloist on each note with the vibrato taken out, every syllable half swelled in, on a record a little warped.',
    preview: BARE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { motion: 0, vibrato: 0, attack: 0.2, release: 0.7, vowel: 0.35 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'vinyl', preset: 'Warped', params: { warp: 0.5, crackle: 0.1, pops: 0 } },
    ],
  },

  // Thesis: noise tuned to the chord; reflections switched off plane in parallel, switched on they mirror.
  {
    id: 'white-key-planing-noise-in-parallel',
    name: 'Noise in parallel',
    category: 'texture',
    description:
      'Bands of tuned noise with every reflection off, so the fourths slide as one, under a fixed low filter.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        mirrorEnabled: 0,
        octaflipEnabled: 0,
        mode: 0,
        resonance: 48,
        attack: 0.3,
        release: 1,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 1400, slope: 1 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'white-key-planing-line-against-its-mirror',
    name: 'Line against its mirror',
    category: 'texture',
    description:
      'One line of tuned noise and its reflection about D in dorian, moving apart as the line climbs, in a plain hall.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { scale: 4, root: 2, center: 62, attack: 0.2, release: 1.2, width: 90 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Full level', params: { autoGain: 8 } },
    ],
  },
  {
    id: 'white-key-planing-six-bands-to-a-step',
    name: 'Six bands to a step',
    category: 'pad',
    description:
      'All six bands of each note switched on in C major, wide, driven through a warm valve until they fuse.',
    preview: BARE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { strum: 0, width: 100, attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -5 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'white-key-planing-bands-that-inhale',
    name: 'Bands that inhale',
    category: 'texture',
    description:
      'Loosely tuned noise, reflections off, each band swelling about every seven seconds and drifting across the stereo field.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        mirrorEnabled: 0,
        octaflipEnabled: 0,
        middleEnabled: 0,
        mode: 1,
        breatheRate: 0.15,
        resonance: 12,
        attack: 0.8,
        release: 3,
        width: 95,
      },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'white-key-planing-white-keys-in-a-puddle',
    name: 'White keys in a puddle',
    category: 'pad',
    description:
      'Tuned noise mirrored and flipped by octaves in A minor, soft and slow, heard from just under moving water.',
    preview: OPEN,
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: { strum: 0, attack: 0.5, release: 2, width: 80 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: 0 } },
    ],
  },
  {
    id: 'white-key-planing-ladder-leaned-on-f',
    name: 'Ladder leaned on F',
    category: 'texture',
    description:
      'Short bands of noise strummed upward over each key on the F lydian scale, caught again in a dark slow smear of grains.',
    preview: ONE_LINE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { root: 5, strum: 100, attack: 0.02, release: 0.8 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'white-key-planing-dark-bands-under-e',
    name: 'Dark bands under E',
    category: 'drone',
    description:
      'Low noise bands reflected around a low centre in E phrygian, their pitch wavering slowly, in a dark plate.',
    preview: STILL_BASS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { attack: 0.8, release: 2.5, resonance: 45 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },

  // Harp: rolled stacks; the pluck softened, reversed, muffled or held.
  {
    id: 'white-key-planing-rolled-then-hung',
    name: 'Rolled, then hung',
    category: 'plucked',
    description:
      'A soft harp whose stacks of fourths are plucked near the middle and hung in a smear that outlasts them.',
    preview: ROLLED,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { touch: 0.05, halo: 0.7 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.5 } }],
  },
  {
    id: 'white-key-planing-stacks-come-up-dripping',
    name: 'Stacks come up dripping',
    category: 'plucked',
    description:
      'Harp strings with every pluck removed by a slow swell, so the rolled stacks come up out of nothing, in a hall.',
    preview: ROLLED,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { volume: -2, decay: 3, touch: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 500 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-palm-on-the-fourths',
    name: 'Palm on the fourths',
    category: 'plucked',
    description:
      'A muted harp, dark and short, each stack answered twice in quick succession from alternate sides, the top shaded.',
    preview: ROLLED,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { touch: 0.2, body: 1, pluck: 0.4 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Two skips' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'white-key-planing-silk-over-the-semitone',
    name: 'Silk over the semitone',
    category: 'plucked',
    description:
      'Koto silk with a very slight press on each string, close seconds and fifths, a soft detuned halo, A minor strings ringing along.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 4, decay: 2.5, bend: 25 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { mix: 0.45 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 9, mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-steel-in-a-slow-fan',
    name: 'Steel in a slow fan',
    category: 'plucked',
    description:
      'Bright guzheng steel unfolded from low to high through a long prism, each chord fanning out again behind itself.',
    preview: BARE,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 5.5, touch: 0.45, decay: 2 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 900, mix: 0.45 } }],
  },
  {
    id: 'white-key-planing-hollow-harp-one-sweep',
    name: 'Hollow harp, one sweep',
    category: 'plucked',
    description:
      'A dark hollow harp that sweeps every chord for over a second, its attacks turned to fog and its body enlarged.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 1.5, sweep: 1.1, decay: 2.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'size', preset: 'Larger', params: { size: 0.3 } },
    ],
  },
  // Dusk: one filter that follows the keys, so its ringing planes with the chord.
  {
    id: 'white-key-planing-filter-left-singing',
    name: 'Filter left singing',
    category: 'pad',
    description:
      'A thin saw pad whose filter rings two octaves above every key, so a second chord slides along over the first.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { cutoff: 1046.5, resonance: 0.82, lowCut: 2, attack: 0.5, release: 1.6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
      { deviceId: 'spread', preset: 'Soft tilt' },
    ],
  },
  {
    id: 'white-key-planing-square-reeds-one-file',
    name: 'Square reeds, one file',
    category: 'pad',
    description:
      'Hollow square waves filtered down to woodwind, no chorus at all, the onset blurred by a mono smear, on thick cassette.',
    preview: LOW_SIXTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.25, release: 0.9, chorus: 0, cutoff: 900 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Mono smear' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'white-key-planing-thin-pulse-before-dawn',
    name: 'Thin pulse before dawn',
    category: 'pad',
    description:
      'Thin moving pulses with most of the low end cut, both choruses on, scattered by a swept twelve-stage cloud.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { attack: 0.6, release: 2, resonance: 0.35 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'white-key-planing-lights-dim-by-steps',
    name: 'Lights dim by steps',
    category: 'pad',
    description:
      'Strings that start bright and close as each chord is held, falling by a third in slow sighs behind.',
    preview: SIXTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.4, release: 1.6, envelope: -0.8 },
    },
    effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.35 } }],
  },
  {
    id: 'white-key-planing-octave-under-the-slab',
    name: 'Octave under the slab',
    category: 'bass',
    description:
      'A nearly closed saw and square with a full sub octave, kept for the still bass, thickened by iron and kept mono.',
    preview: STILL_BASS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Octave below',
      params: { volume: -13, attack: 0.4, release: 1.5, cutoff: 260, chorus: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'white-key-planing-one-tube-five-chords',
    name: 'One tube, five chords',
    category: 'keys',
    description:
      'A square voice whose filter rings at the third harmonic of every key, in a shell of one size, shared tones hung on a little.',
    preview: ONE_TWO_FIVE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.18, release: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Shell to the ear', params: { air: 0.4 } },
      { deviceId: 'common-tones', preset: 'Light touch' },
    ],
  },

  // Chamber strings: mutes, players, pressure.
  {
    id: 'white-key-planing-mutes-on-tritone-too',
    name: 'Mutes on, tritone too',
    category: 'string',
    description:
      'Five muted players bowing with no vibrato, in stacked fourths, through still pipes that ring an octave above.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.5, release: 1.4 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Still pipes', params: { mix: 0.25, decay: 5, interval: 0 } },
    ],
  },
  {
    id: 'white-key-planing-bow-hair-hardly-pitch',
    name: 'Bow hair, hardly pitch',
    category: 'string',
    description:
      'Whispered bows, nearly all hair, their quiet air brought forward at the top and a long cold tail after.',
    preview: OPEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.4, release: 1.2, air: 1 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Air on top' },
      { deviceId: 'seasons', preset: 'First frost' },
    ],
  },
  {
    id: 'white-key-planing-viols-in-strict-organum',
    name: 'Viols in strict organum',
    category: 'string',
    description:
      'A viol consort with no vibrato and no scatter, fifths doubled at the octave, in the body of a wooden soundboard.',
    preview: ORGANUM,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.25, release: 0.7, bow: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'white-key-planing-light-along-the-bridge',
    name: 'Light along the bridge',
    category: 'string',
    description:
      'Two players pressed near the bridge, glassy and airy, each band moved by a small shimmer that spreads outward, under one fixed round vowel.',
    preview: BARE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -9, attack: 0.45, release: 1.6, players: 2, air: 0.4 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rings outward' },
      { deviceId: 'imprint', preset: 'Open vowel', params: { shape: 2, amount: 1.2 } },
    ],
  },
  {
    id: 'white-key-planing-six-bows-share-a-slide',
    name: 'Six bows share a slide',
    category: 'string',
    description:
      'Six players a note, ragged and wide, bowed slowly with the mutes half on, played into a tape loop and pressed to one steady level.',
    preview: NINTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 0.7, release: 2, scatter: 0.8, air: 0.2 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { mix: 0.3 } },
      { deviceId: 'saturator', preset: 'Sustain bed' },
    ],
  },

  // Droplets: the chord is held and the rain finds it.
  {
    id: 'white-key-planing-drizzle-finds-the-ninths',
    name: 'Drizzle finds the ninths',
    category: 'bell',
    description:
      'Metal drops falling thinly on each held chord, veiled a little, the strikes soft and small, in an airy hall.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { volume: -4, rain: 4, soft: 0.7, spread: 1, trail: 3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'white-key-planing-felt-pulse-under-seconds',
    name: 'Felt pulse under seconds',
    category: 'bell',
    description:
      'An even pulse of felt drops on the pairs of neighbours, dry and close, sunk by an old sampler running so slow it has no top.',
    preview: SECONDS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: { volume: -1.5, rain: 6, size: 0.5, trail: 1 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Sunken' }],
  },
  {
    id: 'white-key-planing-rain-with-no-drops-in-it',
    name: 'Rain with no drops in it',
    category: 'texture',
    description:
      'A dense glass shower run together by a full attack-free cloud into a moving pad on three still chords.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: { volume: -2.5, rain: 22, bursts: 0, ring: 2.5, spread: 0.5, soft: 0.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 500, layers: 3 } },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'white-key-planing-cistern-of-low-sixths',
    name: 'Cistern of low sixths',
    category: 'bell',
    description:
      'Deep water drops on close low triads, ringing long, in a cave of short echoes whose walls drift and bend the pitch.',
    preview: LOW_SIXTHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { volume: -5.5, rain: 5, ring: 3, trail: 2 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3, wander: 0.25 } }],
  },
  {
    id: 'white-key-planing-rain-on-a-wooden-plane',
    name: 'Rain on a wooden plane',
    category: 'bell',
    description:
      'Loose wooden drops over stacked fourths, spread wide, with slow tiles of what was played climbing by octaves after it.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: 0, rain: 7, loose: 0.6, ring: 2, trail: 1.5, width: 1 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.3, low: 0 } }],
  },

  // Rewind: the chord arrives at its end.
  {
    id: 'white-key-planing-chords-begin-at-the-end',
    name: 'Chords begin at the end',
    category: 'keys',
    description:
      'Backwards piano swelling for over a second and stopping almost dead just before the next chord, on a plate.',
    preview: BARE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { volume: 6, swell: 1.3, snap: 0.2, tail: 0.1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.4 } }],
  },
  {
    id: 'white-key-planing-bowls-turned-to-the-wall',
    name: 'Bowls turned to the wall',
    category: 'bell',
    description:
      'Bowls swelling in reverse and ringing on forwards, with a low table of tuned fifths answering in sympathy.',
    preview: WET_NINTHS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 6, swell: 1.8, tail: 0.8 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 7, mix: 0.3, ring: 6 } }],
  },
  {
    id: 'white-key-planing-plucks-from-the-far-side',
    name: 'Plucks from the far side',
    category: 'plucked',
    description:
      'Wide reversed plucks surging late into each chord, thickened by a detuned pair and an eddy of slow grains.',
    preview: BARE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: 4, swell: 1.1, rise: 0.7, width: 1, tail: 0.4, snap: 0.3 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } },
    ],
  },
]
