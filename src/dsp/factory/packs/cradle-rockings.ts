import { type FactoryPreset, type Phrase } from '../types'

// Two chords rocked to and fro in six-eight, the tonic and its dominant seventh, over a bass that
// never leaves the tonic and the fifth: slower and softer until someone sleeps. Laid out by how long
// a sound lasts and how far from the cradle it is heard, from the lap to the dream.

// The rocking itself, three bars of six-eight and a close: C and G below in dotted crotchets, C E G
// above, then G B D F over the same bass, then C E G. Each bar is slower, the third has fewer notes.
const ROCK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.78, note: 36, gain: 0.5 },
    { atSec: 0.27, durSec: 0.26, note: 60, gain: 0.38 },
    { atSec: 0.54, durSec: 0.26, note: 64, gain: 0.38 },
    { atSec: 0.81, durSec: 0.78, note: 43, gain: 0.48 },
    { atSec: 1.08, durSec: 0.26, note: 64, gain: 0.38 },
    { atSec: 1.35, durSec: 0.26, note: 67, gain: 0.38 },
    { atSec: 1.62, durSec: 0.87, note: 36, gain: 0.45 },
    { atSec: 1.92, durSec: 0.28, note: 59, gain: 0.34 },
    { atSec: 2.22, durSec: 0.28, note: 65, gain: 0.34 },
    { atSec: 2.52, durSec: 0.87, note: 43, gain: 0.43 },
    { atSec: 2.82, durSec: 0.28, note: 62, gain: 0.34 },
    { atSec: 3.12, durSec: 0.28, note: 67, gain: 0.34 },
    { atSec: 3.42, durSec: 1.04, note: 36, gain: 0.38 },
    { atSec: 3.78, durSec: 0.34, note: 60, gain: 0.29 },
    { atSec: 4.14, durSec: 0.34, note: 64, gain: 0.29 },
    { atSec: 4.5, durSec: 1.04, note: 43, gain: 0.36 },
    { atSec: 4.86, durSec: 0.34, note: 67, gain: 0.29 },
    { atSec: 5.58, durSec: 1.8, note: 36, gain: 0.3 },
    { atSec: 5.58, durSec: 1.8, note: 43, gain: 0.26 },
    { atSec: 6.03, durSec: 1.3, note: 64, gain: 0.24 },
  ],
}

// A tune of five notes, G A G over the tonic and F D over the dominant seventh on the same C and G.
// The bass and the chord come home without it: the tune is asleep before its C.
const FIVE_NOTES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.87, note: 36, gain: 0.46 },
    { atSec: 0, durSec: 0.58, note: 67, gain: 0.6 },
    { atSec: 0.3, durSec: 0.57, note: 60, gain: 0.28 },
    { atSec: 0.3, durSec: 0.57, note: 64, gain: 0.28 },
    { atSec: 0.6, durSec: 0.29, note: 69, gain: 0.55 },
    { atSec: 0.9, durSec: 0.87, note: 43, gain: 0.46 },
    { atSec: 0.9, durSec: 0.88, note: 67, gain: 0.58 },
    { atSec: 1.2, durSec: 0.57, note: 60, gain: 0.28 },
    { atSec: 1.2, durSec: 0.57, note: 64, gain: 0.28 },
    { atSec: 1.8, durSec: 1.01, note: 36, gain: 0.4 },
    { atSec: 1.8, durSec: 1.02, note: 65, gain: 0.5 },
    { atSec: 2.15, durSec: 0.66, note: 59, gain: 0.24 },
    { atSec: 2.15, durSec: 0.66, note: 62, gain: 0.24 },
    { atSec: 2.85, durSec: 1.01, note: 43, gain: 0.4 },
    { atSec: 2.85, durSec: 1.02, note: 62, gain: 0.42 },
    { atSec: 3.2, durSec: 0.66, note: 59, gain: 0.24 },
    { atSec: 3.2, durSec: 0.66, note: 65, gain: 0.22 },
    { atSec: 3.9, durSec: 1.35, note: 36, gain: 0.34 },
    { atSec: 4.4, durSec: 2.8, note: 60, gain: 0.24 },
    { atSec: 4.4, durSec: 2.8, note: 64, gain: 0.24 },
    { atSec: 5.3, durSec: 1.9, note: 43, gain: 0.28 },
  ],
}

// The tune whole, over a bare fifth that does not move: G A G, E for a bar, G F D, C. Six-eight, and each
// bar slower and softer.
const TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.75, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 3.75, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 0.58, note: 67, gain: 0.6 },
    { atSec: 0.6, durSec: 0.28, note: 69, gain: 0.55 },
    { atSec: 0.9, durSec: 0.86, note: 67, gain: 0.57 },
    { atSec: 1.8, durSec: 1.95, note: 64, gain: 0.5 },
    { atSec: 3.84, durSec: 3.45, note: 48, gain: 0.34 },
    { atSec: 3.84, durSec: 3.45, note: 55, gain: 0.3 },
    { atSec: 3.84, durSec: 0.39, note: 67, gain: 0.48 },
    { atSec: 4.24, durSec: 0.42, note: 65, gain: 0.45 },
    { atSec: 4.68, durSec: 0.46, note: 62, gain: 0.42 },
    { atSec: 5.16, durSec: 2.1, note: 60, gain: 0.38 },
  ],
}

// The tune doubled at the octave eighty milliseconds late, over C and G in slowing dotted crotchets. Its
// C comes over the G, as the rocker stands, and the last C below is its own.
const OCTAVE_LATE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.87, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 0.58, note: 67, gain: 0.55 },
    { atSec: 0.08, durSec: 0.58, note: 79, gain: 0.38 },
    { atSec: 0.6, durSec: 0.28, note: 69, gain: 0.51 },
    { atSec: 0.68, durSec: 0.28, note: 81, gain: 0.35 },
    { atSec: 0.9, durSec: 0.87, note: 55, gain: 0.39 },
    { atSec: 0.9, durSec: 0.86, note: 67, gain: 0.52 },
    { atSec: 0.98, durSec: 0.86, note: 79, gain: 0.36 },
    { atSec: 1.8, durSec: 0.99, note: 48, gain: 0.37 },
    { atSec: 1.8, durSec: 1.95, note: 64, gain: 0.46 },
    { atSec: 1.88, durSec: 1.95, note: 76, gain: 0.32 },
    { atSec: 2.82, durSec: 0.99, note: 55, gain: 0.35 },
    { atSec: 3.84, durSec: 1.28, note: 48, gain: 0.32 },
    { atSec: 3.84, durSec: 0.39, note: 67, gain: 0.44 },
    { atSec: 3.92, durSec: 0.39, note: 79, gain: 0.31 },
    { atSec: 4.24, durSec: 0.42, note: 65, gain: 0.41 },
    { atSec: 4.32, durSec: 0.42, note: 77, gain: 0.29 },
    { atSec: 4.68, durSec: 0.46, note: 62, gain: 0.39 },
    { atSec: 4.76, durSec: 0.46, note: 74, gain: 0.27 },
    { atSec: 5.16, durSec: 1.2, note: 55, gain: 0.28 },
    { atSec: 5.16, durSec: 2.1, note: 60, gain: 0.35 },
    { atSec: 5.24, durSec: 2.06, note: 72, gain: 0.24 },
    { atSec: 6.4, durSec: 0.9, note: 48, gain: 0.22 },
  ],
}

// Two chords to the bar, long and short on each: C E G, then B D F G, both over a held C and G. Three
// bars, each slower, and C E G to close.
const HALVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.65, note: 48, gain: 0.42 },
    { atSec: 0, durSec: 1.65, note: 55, gain: 0.38 },
    { atSec: 0, durSec: 0.53, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 0.53, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 0.53, note: 67, gain: 0.36 },
    { atSec: 0.56, durSec: 0.25, note: 60, gain: 0.25 },
    { atSec: 0.56, durSec: 0.25, note: 64, gain: 0.25 },
    { atSec: 0.56, durSec: 0.25, note: 67, gain: 0.25 },
    { atSec: 0.84, durSec: 0.53, note: 59, gain: 0.32 },
    { atSec: 0.84, durSec: 0.53, note: 62, gain: 0.32 },
    { atSec: 0.84, durSec: 0.53, note: 65, gain: 0.32 },
    { atSec: 0.84, durSec: 0.53, note: 67, gain: 0.32 },
    { atSec: 1.4, durSec: 0.25, note: 59, gain: 0.22 },
    { atSec: 1.4, durSec: 0.25, note: 62, gain: 0.22 },
    { atSec: 1.4, durSec: 0.25, note: 65, gain: 0.22 },
    { atSec: 1.4, durSec: 0.25, note: 67, gain: 0.22 },
    { atSec: 1.68, durSec: 1.89, note: 48, gain: 0.37 },
    { atSec: 1.68, durSec: 1.89, note: 55, gain: 0.33 },
    { atSec: 1.68, durSec: 0.61, note: 60, gain: 0.31 },
    { atSec: 1.68, durSec: 0.61, note: 64, gain: 0.31 },
    { atSec: 1.68, durSec: 0.61, note: 67, gain: 0.31 },
    { atSec: 2.32, durSec: 0.29, note: 60, gain: 0.22 },
    { atSec: 2.32, durSec: 0.29, note: 64, gain: 0.22 },
    { atSec: 2.32, durSec: 0.29, note: 67, gain: 0.22 },
    { atSec: 2.64, durSec: 0.61, note: 59, gain: 0.28 },
    { atSec: 2.64, durSec: 0.61, note: 62, gain: 0.28 },
    { atSec: 2.64, durSec: 0.61, note: 65, gain: 0.28 },
    { atSec: 2.64, durSec: 0.61, note: 67, gain: 0.28 },
    { atSec: 3.28, durSec: 0.29, note: 59, gain: 0.19 },
    { atSec: 3.28, durSec: 0.29, note: 62, gain: 0.19 },
    { atSec: 3.28, durSec: 0.29, note: 65, gain: 0.19 },
    { atSec: 3.28, durSec: 0.29, note: 67, gain: 0.19 },
    { atSec: 3.6, durSec: 2.24, note: 48, gain: 0.32 },
    { atSec: 3.6, durSec: 2.24, note: 55, gain: 0.29 },
    { atSec: 3.6, durSec: 0.72, note: 60, gain: 0.27 },
    { atSec: 3.6, durSec: 0.72, note: 64, gain: 0.27 },
    { atSec: 3.6, durSec: 0.72, note: 67, gain: 0.27 },
    { atSec: 4.36, durSec: 0.34, note: 60, gain: 0.19 },
    { atSec: 4.36, durSec: 0.34, note: 64, gain: 0.19 },
    { atSec: 4.36, durSec: 0.34, note: 67, gain: 0.19 },
    { atSec: 4.74, durSec: 0.72, note: 59, gain: 0.24 },
    { atSec: 4.74, durSec: 0.72, note: 62, gain: 0.24 },
    { atSec: 4.74, durSec: 0.72, note: 65, gain: 0.24 },
    { atSec: 4.74, durSec: 0.72, note: 67, gain: 0.24 },
    { atSec: 5.5, durSec: 0.34, note: 59, gain: 0.17 },
    { atSec: 5.5, durSec: 0.34, note: 62, gain: 0.17 },
    { atSec: 5.5, durSec: 0.34, note: 65, gain: 0.17 },
    { atSec: 5.5, durSec: 0.34, note: 67, gain: 0.17 },
    { atSec: 5.88, durSec: 1.45, note: 48, gain: 0.28 },
    { atSec: 5.88, durSec: 1.45, note: 55, gain: 0.25 },
    { atSec: 5.88, durSec: 1.45, note: 60, gain: 0.24 },
    { atSec: 5.88, durSec: 1.45, note: 64, gain: 0.24 },
  ],
}

// Upper voices over C and G rocked legato below: E G C E, then F G B D, then E G C. The top falls E D C,
// the seventh falls F E and the leading note rises.
const SUNG: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 48, gain: 0.44 },
    { atSec: 0, durSec: 2.1, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 72, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 76, gain: 0.42 },
    { atSec: 1.1, durSec: 2.1, note: 55, gain: 0.4 },
    { atSec: 2.2, durSec: 2.2, note: 48, gain: 0.4 },
    { atSec: 2.2, durSec: 2.2, note: 65, gain: 0.37 },
    { atSec: 2.2, durSec: 2.2, note: 67, gain: 0.37 },
    { atSec: 2.2, durSec: 2.2, note: 71, gain: 0.37 },
    { atSec: 2.2, durSec: 2.2, note: 74, gain: 0.37 },
    { atSec: 3.3, durSec: 2.2, note: 55, gain: 0.36 },
    { atSec: 4.5, durSec: 2.2, note: 48, gain: 0.34 },
    { atSec: 4.5, durSec: 2.8, note: 64, gain: 0.32 },
    { atSec: 4.5, durSec: 2.8, note: 67, gain: 0.32 },
    { atSec: 4.5, durSec: 2.8, note: 72, gain: 0.32 },
    { atSec: 5.65, durSec: 1.7, note: 55, gain: 0.3 },
  ],
}

// The same two chords for low voices: C E, then B F, then C E, rocked twice over C and G in the bass.
const LOW_HALF: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.46 },
    { atSec: 0, durSec: 1.5, note: 64, gain: 0.46 },
    { atSec: 0.78, durSec: 1.5, note: 55, gain: 0.42 },
    { atSec: 1.55, durSec: 1.6, note: 48, gain: 0.44 },
    { atSec: 1.55, durSec: 1.6, note: 59, gain: 0.42 },
    { atSec: 1.55, durSec: 1.6, note: 65, gain: 0.42 },
    { atSec: 2.36, durSec: 1.5, note: 55, gain: 0.38 },
    { atSec: 3.2, durSec: 1.35, note: 48, gain: 0.4 },
    { atSec: 3.2, durSec: 1.35, note: 60, gain: 0.38 },
    { atSec: 3.2, durSec: 1.35, note: 64, gain: 0.38 },
    { atSec: 3.9, durSec: 1.35, note: 55, gain: 0.36 },
    { atSec: 4.6, durSec: 1.3, note: 48, gain: 0.36 },
    { atSec: 4.6, durSec: 1.3, note: 59, gain: 0.34 },
    { atSec: 4.6, durSec: 1.3, note: 65, gain: 0.34 },
    { atSec: 5.27, durSec: 2.05, note: 55, gain: 0.32 },
    { atSec: 5.95, durSec: 1.4, note: 48, gain: 0.32 },
    { atSec: 5.95, durSec: 1.4, note: 60, gain: 0.3 },
    { atSec: 5.95, durSec: 1.4, note: 64, gain: 0.3 },
  ],
}

// The rocking in F: F and C below, F A C above, then E G B flat over the same bass. The B flat falls to
// A, the E goes back to F, and the last bar thins.
const OVER_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.81, note: 41, gain: 0.48 },
    { atSec: 0.28, durSec: 0.26, note: 65, gain: 0.3 },
    { atSec: 0.28, durSec: 0.26, note: 69, gain: 0.3 },
    { atSec: 0.28, durSec: 0.26, note: 72, gain: 0.3 },
    { atSec: 0.56, durSec: 0.26, note: 65, gain: 0.24 },
    { atSec: 0.56, durSec: 0.26, note: 69, gain: 0.24 },
    { atSec: 0.56, durSec: 0.26, note: 72, gain: 0.24 },
    { atSec: 0.84, durSec: 0.81, note: 48, gain: 0.46 },
    { atSec: 1.12, durSec: 0.26, note: 65, gain: 0.3 },
    { atSec: 1.12, durSec: 0.26, note: 69, gain: 0.3 },
    { atSec: 1.12, durSec: 0.26, note: 72, gain: 0.3 },
    { atSec: 1.4, durSec: 0.26, note: 65, gain: 0.24 },
    { atSec: 1.4, durSec: 0.26, note: 69, gain: 0.24 },
    { atSec: 1.4, durSec: 0.26, note: 72, gain: 0.24 },
    { atSec: 1.68, durSec: 0.93, note: 41, gain: 0.43 },
    { atSec: 2, durSec: 0.29, note: 64, gain: 0.27 },
    { atSec: 2, durSec: 0.29, note: 67, gain: 0.27 },
    { atSec: 2, durSec: 0.29, note: 70, gain: 0.27 },
    { atSec: 2.32, durSec: 0.29, note: 64, gain: 0.22 },
    { atSec: 2.32, durSec: 0.29, note: 67, gain: 0.22 },
    { atSec: 2.32, durSec: 0.29, note: 70, gain: 0.22 },
    { atSec: 2.64, durSec: 0.93, note: 48, gain: 0.41 },
    { atSec: 2.96, durSec: 0.29, note: 64, gain: 0.27 },
    { atSec: 2.96, durSec: 0.29, note: 67, gain: 0.27 },
    { atSec: 2.96, durSec: 0.29, note: 70, gain: 0.27 },
    { atSec: 3.28, durSec: 0.29, note: 64, gain: 0.22 },
    { atSec: 3.28, durSec: 0.29, note: 67, gain: 0.22 },
    { atSec: 3.28, durSec: 0.29, note: 70, gain: 0.22 },
    { atSec: 3.6, durSec: 1.07, note: 41, gain: 0.38 },
    { atSec: 3.97, durSec: 0.34, note: 65, gain: 0.24 },
    { atSec: 3.97, durSec: 0.34, note: 69, gain: 0.24 },
    { atSec: 4.71, durSec: 1.07, note: 48, gain: 0.36 },
    { atSec: 5.08, durSec: 0.34, note: 65, gain: 0.24 },
    { atSec: 5.08, durSec: 0.34, note: 69, gain: 0.24 },
    { atSec: 5.82, durSec: 1.5, note: 41, gain: 0.3 },
    { atSec: 5.82, durSec: 1.5, note: 48, gain: 0.26 },
    { atSec: 6.17, durSec: 1.15, note: 65, gain: 0.22 },
    { atSec: 6.17, durSec: 1.15, note: 69, gain: 0.22 },
  ],
}

// The rocking in the minor: A and E below, A C E in quavers above, then G sharp B D over the same two
// notes, the dominant seventh on its tonic, and A C E once more.
const OVER_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.81, note: 45, gain: 0.48 },
    { atSec: 0.28, durSec: 0.5, note: 57, gain: 0.38 },
    { atSec: 0.56, durSec: 0.5, note: 60, gain: 0.38 },
    { atSec: 0.84, durSec: 0.81, note: 52, gain: 0.46 },
    { atSec: 1.12, durSec: 0.5, note: 64, gain: 0.38 },
    { atSec: 1.4, durSec: 0.5, note: 60, gain: 0.38 },
    { atSec: 1.68, durSec: 0.93, note: 45, gain: 0.43 },
    { atSec: 2, durSec: 0.58, note: 56, gain: 0.34 },
    { atSec: 2.32, durSec: 0.58, note: 59, gain: 0.34 },
    { atSec: 2.64, durSec: 0.93, note: 52, gain: 0.41 },
    { atSec: 2.96, durSec: 0.58, note: 62, gain: 0.34 },
    { atSec: 3.28, durSec: 0.58, note: 59, gain: 0.34 },
    { atSec: 3.6, durSec: 1.1, note: 45, gain: 0.38 },
    { atSec: 3.98, durSec: 0.68, note: 57, gain: 0.3 },
    { atSec: 4.36, durSec: 0.68, note: 60, gain: 0.3 },
    { atSec: 4.74, durSec: 1.1, note: 52, gain: 0.36 },
    { atSec: 5.12, durSec: 0.68, note: 64, gain: 0.3 },
    { atSec: 5.88, durSec: 1.45, note: 45, gain: 0.3 },
    { atSec: 5.88, durSec: 1.45, note: 52, gain: 0.26 },
    { atSec: 6.28, durSec: 1, note: 60, gain: 0.24 },
  ],
}

// The rocker alone: C and G, C and G, each a little later and softer than the one before.
const FEET: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.79, note: 36, gain: 0.6 },
    { atSec: 0.82, durSec: 0.83, note: 43, gain: 0.56 },
    { atSec: 1.68, durSec: 0.88, note: 36, gain: 0.52 },
    { atSec: 2.6, durSec: 0.96, note: 43, gain: 0.48 },
    { atSec: 3.6, durSec: 1.06, note: 36, gain: 0.44 },
    { atSec: 4.7, durSec: 1.2, note: 43, gain: 0.4 },
    { atSec: 5.95, durSec: 1.34, note: 36, gain: 0.36 },
  ],
}

// Six quavers to the bar rolled up from the fifth C and G and turned back: C E G, B D F, C E G, and a
// last chord spread.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.56, note: 48, gain: 0.5 },
    { atSec: 0.26, durSec: 1.3, note: 55, gain: 0.43 },
    { atSec: 0.52, durSec: 1.04, note: 60, gain: 0.43 },
    { atSec: 0.78, durSec: 0.78, note: 64, gain: 0.43 },
    { atSec: 1.04, durSec: 0.52, note: 67, gain: 0.43 },
    { atSec: 1.3, durSec: 0.26, note: 64, gain: 0.43 },
    { atSec: 1.56, durSec: 1.8, note: 48, gain: 0.44 },
    { atSec: 1.86, durSec: 1.5, note: 55, gain: 0.37 },
    { atSec: 2.16, durSec: 1.2, note: 59, gain: 0.37 },
    { atSec: 2.46, durSec: 0.9, note: 62, gain: 0.37 },
    { atSec: 2.76, durSec: 0.6, note: 65, gain: 0.37 },
    { atSec: 3.06, durSec: 0.3, note: 62, gain: 0.37 },
    { atSec: 3.36, durSec: 2.22, note: 48, gain: 0.38 },
    { atSec: 3.73, durSec: 1.85, note: 55, gain: 0.32 },
    { atSec: 4.1, durSec: 1.48, note: 60, gain: 0.32 },
    { atSec: 4.47, durSec: 1.11, note: 64, gain: 0.32 },
    { atSec: 4.84, durSec: 0.74, note: 67, gain: 0.32 },
    { atSec: 5.58, durSec: 1.75, note: 48, gain: 0.34 },
    { atSec: 5.74, durSec: 1.59, note: 55, gain: 0.31 },
    { atSec: 5.9, durSec: 1.43, note: 60, gain: 0.28 },
    { atSec: 6.06, durSec: 1.27, note: 64, gain: 0.25 },
  ],
}

// A music box running down: C and G rocked in the middle, G A G, E, G F D above, each bar slower. The
// tune stops on its D and never reaches its C.
const SPRING_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.82, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 0.54, note: 79, gain: 0.56 },
    { atSec: 0.56, durSec: 0.27, note: 81, gain: 0.53 },
    { atSec: 0.84, durSec: 0.8, note: 67, gain: 0.37 },
    { atSec: 0.84, durSec: 0.8, note: 79, gain: 0.49 },
    { atSec: 1.68, durSec: 0.94, note: 60, gain: 0.34 },
    { atSec: 1.68, durSec: 1.8, note: 76, gain: 0.46 },
    { atSec: 2.64, durSec: 0.94, note: 67, gain: 0.31 },
    { atSec: 3.6, durSec: 1.4, note: 60, gain: 0.28 },
    { atSec: 3.6, durSec: 0.42, note: 79, gain: 0.42 },
    { atSec: 4.04, durSec: 0.46, note: 77, gain: 0.39 },
    { atSec: 4.52, durSec: 1.7, note: 74, gain: 0.35 },
    { atSec: 5.04, durSec: 1.2, note: 67, gain: 0.24 },
    { atSec: 6.3, durSec: 1.05, note: 60, gain: 0.2 },
  ],
}

// Five notes, then four, three, two, one: G A G F D over a fifth in the middle, begun again each time slower
// and a note shorter.
const ONE_FEWER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.37, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.37, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 0.24, note: 79, gain: 0.55 },
    { atSec: 0.25, durSec: 0.24, note: 81, gain: 0.55 },
    { atSec: 0.5, durSec: 0.24, note: 79, gain: 0.55 },
    { atSec: 0.75, durSec: 0.24, note: 77, gain: 0.55 },
    { atSec: 1, durSec: 0.34, note: 74, gain: 0.55 },
    { atSec: 1.47, durSec: 1.32, note: 60, gain: 0.36 },
    { atSec: 1.47, durSec: 1.32, note: 67, gain: 0.32 },
    { atSec: 1.47, durSec: 0.28, note: 79, gain: 0.5 },
    { atSec: 1.77, durSec: 0.28, note: 81, gain: 0.5 },
    { atSec: 2.07, durSec: 0.28, note: 79, gain: 0.5 },
    { atSec: 2.37, durSec: 0.41, note: 77, gain: 0.5 },
    { atSec: 2.89, durSec: 1.2, note: 60, gain: 0.32 },
    { atSec: 2.89, durSec: 1.2, note: 67, gain: 0.28 },
    { atSec: 2.89, durSec: 0.34, note: 79, gain: 0.45 },
    { atSec: 3.25, durSec: 0.34, note: 81, gain: 0.45 },
    { atSec: 3.61, durSec: 0.49, note: 79, gain: 0.45 },
    { atSec: 4.19, durSec: 1, note: 60, gain: 0.28 },
    { atSec: 4.19, durSec: 1, note: 67, gain: 0.24 },
    { atSec: 4.19, durSec: 0.42, note: 79, gain: 0.4 },
    { atSec: 4.63, durSec: 0.59, note: 81, gain: 0.4 },
    { atSec: 5.29, durSec: 1.1, note: 60, gain: 0.24 },
    { atSec: 5.29, durSec: 1.1, note: 67, gain: 0.2 },
    { atSec: 5.29, durSec: 1.35, note: 79, gain: 0.35 },
  ],
}

// One slow rock for what blows and hums: C and G rocked legato below, E and C above, then F and B, then E
// and C again.
const LONG_ROCK: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 2.4, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 2.4, note: 72, gain: 0.4 },
    { atSec: 1.22, durSec: 2.4, note: 55, gain: 0.42 },
    { atSec: 2.45, durSec: 2.4, note: 48, gain: 0.42 },
    { atSec: 2.45, durSec: 2.4, note: 65, gain: 0.36 },
    { atSec: 2.45, durSec: 2.4, note: 71, gain: 0.36 },
    { atSec: 3.67, durSec: 2.4, note: 55, gain: 0.38 },
    { atSec: 4.9, durSec: 2.4, note: 48, gain: 0.38 },
    { atSec: 4.9, durSec: 2.4, note: 64, gain: 0.33 },
    { atSec: 4.9, durSec: 2.4, note: 72, gain: 0.33 },
    { atSec: 6.12, durSec: 1.2, note: 55, gain: 0.32 },
  ],
}

// The tune in G for bells, over G and D: D E D, B, D C A, G.
const TUNE_IN_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.75, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 3.75, note: 62, gain: 0.36 },
    { atSec: 0, durSec: 0.58, note: 74, gain: 0.6 },
    { atSec: 0.6, durSec: 0.28, note: 76, gain: 0.55 },
    { atSec: 0.9, durSec: 0.86, note: 74, gain: 0.57 },
    { atSec: 1.8, durSec: 1.95, note: 71, gain: 0.5 },
    { atSec: 3.84, durSec: 3.45, note: 55, gain: 0.34 },
    { atSec: 3.84, durSec: 3.45, note: 62, gain: 0.3 },
    { atSec: 3.84, durSec: 0.39, note: 74, gain: 0.48 },
    { atSec: 4.24, durSec: 0.42, note: 72, gain: 0.45 },
    { atSec: 4.68, durSec: 0.46, note: 69, gain: 0.42 },
    { atSec: 5.16, durSec: 2.1, note: 67, gain: 0.38 },
  ],
}

// The tune alone and slower, for one voice.
const HUMMED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.78, note: 67, gain: 0.6 },
    { atSec: 0.8, durSec: 0.38, note: 69, gain: 0.55 },
    { atSec: 1.2, durSec: 1.1, note: 67, gain: 0.57 },
    { atSec: 2.4, durSec: 1.95, note: 64, gain: 0.52 },
    { atSec: 4.5, durSec: 0.4, note: 67, gain: 0.48 },
    { atSec: 4.92, durSec: 0.42, note: 65, gain: 0.45 },
    { atSec: 5.36, durSec: 0.5, note: 62, gain: 0.42 },
    { atSec: 5.9, durSec: 1.45, note: 60, gain: 0.38 },
  ],
}

// The sung chords in G for glass and bells: B D G B, then C D F sharp A, then B D G, over G and D.
const SUNG_IN_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 55, gain: 0.44 },
    { atSec: 0, durSec: 2.1, note: 71, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 74, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 79, gain: 0.42 },
    { atSec: 0, durSec: 2.1, note: 83, gain: 0.42 },
    { atSec: 1.1, durSec: 2.1, note: 62, gain: 0.4 },
    { atSec: 2.2, durSec: 2.2, note: 55, gain: 0.4 },
    { atSec: 2.2, durSec: 2.2, note: 72, gain: 0.37 },
    { atSec: 2.2, durSec: 2.2, note: 74, gain: 0.37 },
    { atSec: 2.2, durSec: 2.2, note: 78, gain: 0.37 },
    { atSec: 2.2, durSec: 2.2, note: 81, gain: 0.37 },
    { atSec: 3.3, durSec: 2.2, note: 62, gain: 0.36 },
    { atSec: 4.5, durSec: 2.2, note: 55, gain: 0.34 },
    { atSec: 4.5, durSec: 2.8, note: 71, gain: 0.32 },
    { atSec: 4.5, durSec: 2.8, note: 74, gain: 0.32 },
    { atSec: 4.5, durSec: 2.8, note: 79, gain: 0.32 },
    { atSec: 5.65, durSec: 1.7, note: 62, gain: 0.3 },
  ],
}

// The two chords for small bars: C and G rocked in the middle, C E above, then F over B and F over D, then
// C E, each bar slower.
const SMALL_BARS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.81, note: 60, gain: 0.44 },
    { atSec: 0.28, durSec: 0.53, note: 72, gain: 0.34 },
    { atSec: 0.28, durSec: 0.53, note: 76, gain: 0.34 },
    { atSec: 0.84, durSec: 0.81, note: 67, gain: 0.42 },
    { atSec: 1.12, durSec: 0.53, note: 72, gain: 0.34 },
    { atSec: 1.12, durSec: 0.53, note: 76, gain: 0.34 },
    { atSec: 1.68, durSec: 0.93, note: 60, gain: 0.4 },
    { atSec: 2, durSec: 0.61, note: 71, gain: 0.3 },
    { atSec: 2, durSec: 0.61, note: 77, gain: 0.3 },
    { atSec: 2.64, durSec: 0.93, note: 67, gain: 0.38 },
    { atSec: 2.96, durSec: 0.61, note: 74, gain: 0.3 },
    { atSec: 2.96, durSec: 0.61, note: 77, gain: 0.3 },
    { atSec: 3.6, durSec: 1.11, note: 60, gain: 0.35 },
    { atSec: 3.98, durSec: 0.72, note: 72, gain: 0.25 },
    { atSec: 3.98, durSec: 0.72, note: 76, gain: 0.25 },
    { atSec: 4.74, durSec: 1.11, note: 67, gain: 0.33 },
    { atSec: 5.12, durSec: 0.72, note: 72, gain: 0.25 },
    { atSec: 5.12, durSec: 0.72, note: 76, gain: 0.25 },
    { atSec: 5.88, durSec: 1.4, note: 60, gain: 0.26 },
    { atSec: 5.88, durSec: 1.4, note: 67, gain: 0.22 },
    { atSec: 6.35, durSec: 0.95, note: 72, gain: 0.2 },
    { atSec: 6.35, durSec: 0.95, note: 76, gain: 0.2 },
  ],
}

// The slow rock in the minor: A and E rocked below, C and A above, then D and G sharp, then C and A again.
const LONG_MINOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 45, gain: 0.46 },
    { atSec: 0, durSec: 2.4, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 2.4, note: 69, gain: 0.4 },
    { atSec: 1.22, durSec: 2.4, note: 52, gain: 0.42 },
    { atSec: 2.45, durSec: 2.4, note: 45, gain: 0.42 },
    { atSec: 2.45, durSec: 2.4, note: 62, gain: 0.36 },
    { atSec: 2.45, durSec: 2.4, note: 68, gain: 0.36 },
    { atSec: 3.67, durSec: 2.4, note: 52, gain: 0.38 },
    { atSec: 4.9, durSec: 2.4, note: 45, gain: 0.38 },
    { atSec: 4.9, durSec: 2.4, note: 60, gain: 0.33 },
    { atSec: 4.9, durSec: 2.4, note: 69, gain: 0.33 },
    { atSec: 6.12, durSec: 1.2, note: 52, gain: 0.32 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Modal bells.
  {
    id: 'cradle-rockings-comb-and-cylinder',
    name: 'Comb and cylinder',
    category: 'bell',
    description: 'A music box with hard pins and a short ring, played inside a small wooden body.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 2, hardness: 1, brightness: 0.75, spread: 0.15, volume: 0 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.4, mix: 0.55 } }],
  },
  {
    id: 'cradle-rockings-box-under-the-quilt',
    name: 'Box under the quilt',
    category: 'bell',
    description:
      'A soft-pinned music box, its attacks smoothed and everything over nine hundred hertz filtered off.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 5, hardness: 0.4, brightness: 0.3, volume: 5.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Init', params: { slope: 1, cutoffHz: 900 } },
      { deviceId: 'fog', preset: 'Pad softener' },
    ],
  },
  {
    id: 'cradle-rockings-mainspring-giving-out',
    name: 'Mainspring giving out',
    category: 'bell',
    description:
      'A music box with a quick beat in each tooth, unsteady on slow tape, its tail sagging in pitch as it rings.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 4.5, detune: 2.5, spread: 0.8, volume: 5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.05 } },
      { deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'cradle-rockings-box-left-on-the-landing',
    name: 'Box left on the landing',
    category: 'bell',
    description:
      'A music box moved back into a hard-walled stairwell, its quiet end brought up by a slow compressor.',
    preview: OCTAVE_LATE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 3, brightness: 0.45, volume: -1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.7 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'cradle-rockings-hoop-of-chimes-turning',
    name: 'Hoop of chimes turning',
    category: 'bell',
    description:
      'Small chimes with their partials squeezed together, swung from side to side every two seconds in a light wind.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { decay: 6, stretch: 0.75, damping: 0.3, volume: -1.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway', params: { rate: 0.5 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.6, voice: 0.2 } },
    ],
  },
  {
    id: 'cradle-rockings-bowl-at-the-crib-rail',
    name: 'Bowl at the crib rail',
    category: 'bell',
    description:
      'A bowl struck with a soft beater, rocked in level at the speed of a cradle and laid on a dark plate.',
    preview: TUNE_IN_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { hardness: 0.1, decay: 22, detune: 0.4, spread: 0.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.55, depth: 0.65 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'cradle-rockings-vesper-past-the-curtains',
    name: 'Vesper past the curtains',
    category: 'bell',
    description:
      'A far bell almost without strike or brightness, narrowed, in a huge room that keeps only its lows.',
    preview: TUNE_IN_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { brightness: 0.05, decay: 22, volume: 1 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'cradle-rockings-tower-behind-a-wall',
    name: 'Tower behind a wall',
    category: 'bell',
    description:
      'A short-ringing church bell heard dull and half erased, as if through a wall, in a dark six second cave.',
    preview: ONE_FEWER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { hardness: 0.3, decay: 9, release: 0.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'cradle-rockings-tines-in-the-pillow',
    name: 'Tines in the pillow',
    category: 'plucked',
    description:
      'A damped kalimba with a soft thumb, through a tiny loudspeaker pressed close and turned away.',
    preview: ONE_FEWER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { damping: 0.9, hardness: 0.2, brightness: 0.3, decay: 1.5, volume: -3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
  },
  {
    id: 'cradle-rockings-tines-at-half-pace',
    name: 'Tines at half pace',
    category: 'plucked',
    description:
      'A long kalimba blended with itself at half speed an octave down, in a faint room.',
    preview: OCTAVE_LATE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 7, damping: 0.3, spread: 0.9, volume: -3 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'cradle-rockings-wet-rim-hum',
    name: 'Wet rim hum',
    category: 'bell',
    description:
      'Rubbed glass that begins straight and starts to sway, with an oo-shaped hall behind it.',
    preview: SUNG_IN_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { detune: 0.3, brightness: 0.25, hardness: 0.05 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 30 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'cradle-rockings-teaspoon-and-tumbler',
    name: 'Teaspoon and tumbler',
    category: 'bell',
    description:
      'A short tap on glass whose echoes skip closer and duller from one side to the other.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { decay: 2.5, damping: 0.6, volume: -2 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Sinking away', params: { mix: 0.45 } }],
  },
  {
    id: 'cradle-rockings-bars-with-the-lid-down',
    name: 'Bars with the lid down',
    category: 'bell',
    description:
      'A dulled vibraphone in a slowly turning cabinet, each chord swelling up a second time in a dark bloom of reverb.',
    preview: SUNG_IN_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { brightness: 0.2, decay: 10, release: 0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.65 } },
    ],
  },
  {
    id: 'cradle-rockings-rubbed-until-quiet',
    name: 'Rubbed until quiet',
    category: 'drone',
    description:
      'A bright rubbed bowl that swells and rests like someone asleep, with a faint octave climbing out of its tail.',
    preview: SUNG_IN_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { brightness: 0.75, damping: 0.2, decay: 12 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Asleep', params: { depth: 0.75 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'cradle-rockings-small-hours-gong',
    name: 'Small hours gong',
    category: 'bell',
    description:
      'A gong tapped softly, its partials pulled close, in a reverb that slides downward without arriving.',
    preview: FEET,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { hardness: 0.08, brightness: 0.2, decay: 18, stretch: 0.7, volume: 5 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Deep below', params: { mix: 0.5 } }],
  },
  {
    id: 'cradle-rockings-painted-toy-bars',
    name: 'Painted toy bars',
    category: 'bell',
    description:
      'Wooden bars struck hard and short, reduced to the crunch of a toy and sent lightly to a spring.',
    preview: ONE_FEWER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { decay: 0.8, hardness: 0.85, brightness: 0.6, volume: 2.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'cradle-rockings-bells-under-first-snow',
    name: 'Bells under first snow',
    category: 'pad',
    description:
      'Bowed bells with the brightness taken down, turned thin and icy by a fixed winter.',
    preview: SUNG_IN_G,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { brightness: 0.2, decay: 8, volume: -16 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
  },
  // Mallets.
  {
    id: 'cradle-rockings-wood-at-the-knee',
    name: 'Wood at the knee',
    category: 'keys',
    description:
      'A close marimba whose notes are caught as they sound and held under it as a dark, even bed.',
    preview: ROCK,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.2, decay: 1.2, resonator: 0.9, width: 0.2, volume: -8 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.4, mix: 0.55 } }],
  },
  {
    id: 'cradle-rockings-rocker-and-runner',
    name: 'Rocker and runner',
    category: 'keys',
    description:
      'A slow marimba roll that crosses from side to side at the speed of a rocking chair, in a small room.',
    preview: HALVES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 5.5, mallet: 0.15, volume: -5.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.55, depth: 1 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'cradle-rockings-marimba-in-the-valley',
    name: 'Marimba in the valley',
    category: 'keys',
    description:
      'A harder marimba with a long ring, answered after a moment by a ten second space.',
    preview: FIVE_NOTES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.6, decay: 2.5, resonator: 0.4, volume: -3 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley' }],
  },
  {
    id: 'cradle-rockings-humming-to-the-floor',
    name: 'Humming to the floor',
    category: 'bass',
    description:
      'A marimba that mostly hums, with its octave below added and the top lost just under water.',
    preview: FEET,
    instrument: { deviceId: 'mallets', preset: 'Humming marimba', params: { width: 0.1 } },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0 } },
    ],
  },
  {
    id: 'cradle-rockings-motor-running-slower',
    name: 'Motor running slower',
    category: 'keys',
    description:
      'A vibraphone with its fans wide open, its pulse forever slowing, in a dark four second hall.',
    preview: HALVES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 1, motorRate: 2, volume: -2.5 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Ever slower', params: { depth: 0.75 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'cradle-rockings-vibes-across-the-hall',
    name: 'Vibes across the hall',
    category: 'keys',
    description:
      'A damped vibraphone without its motor, heard from the far side of a room and slowly detuned.',
    preview: ROLLED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { damper: 0.85, mallet: 0.4, volume: -2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'cradle-rockings-rolled-into-sleep',
    name: 'Rolled into sleep',
    category: 'pad',
    description:
      'A fast soft roll on vibraphone bars whose spectrum hangs and blurs into a dark wash.',
    preview: SUNG,
    instrument: { deviceId: 'mallets', preset: 'Rolled vibes', params: { roll: 13, motor: 0 } },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.75 } }],
  },
  {
    id: 'cradle-rockings-slow-fan-on-the-ceiling',
    name: 'Slow fan on the ceiling',
    category: 'keys',
    description:
      'Vibraphone bars pulsed about once a second, swept very slowly and given half to a plate.',
    preview: LONG_ROCK,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { decay: 4, volume: -2.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'cradle-rockings-octave-a-breath-behind',
    name: 'Octave a breath behind',
    category: 'keys',
    description:
      'A celesta followed a tenth of a second later by its own octave, with a faint sheen of plate.',
    preview: TUNE,
    instrument: { deviceId: 'mallets', preset: 'Celesta', params: { decay: 1.5, mallet: 0.2 } },
    effects: [
      { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.1, interval1: 12, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'cradle-rockings-celesta-in-a-drawer',
    name: 'Celesta in a drawer',
    category: 'keys',
    description:
      'A short fully damped celesta rattled through a small tin body, its top rolled off.',
    preview: ONE_FEWER,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { damper: 1, resonator: 0.3, decay: 0.5, width: 0, volume: -3.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.7 } },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 2200 } },
    ],
  },
  {
    id: 'cradle-rockings-celesta-lid-propped',
    name: 'Celesta, lid propped',
    category: 'keys',
    description: 'A long open celesta with pure tones an octave up swelling in after each note.',
    preview: OCTAVE_LATE,
    instrument: { deviceId: 'mallets', preset: 'Open celesta', params: { decay: 4 } },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.55 } }],
  },
  {
    id: 'cradle-rockings-nightlight-flicker',
    name: 'Nightlight flicker',
    category: 'keys',
    description:
      'A trembling celesta whose partials come and go in sudden glints, a shimmer two octaves up in its tail.',
    preview: SMALL_BARS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { volume: -2.5, motorRate: 4, mallet: 0.3 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints' },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'cradle-rockings-glass-over-the-cot',
    name: 'Glass over the cot',
    category: 'bell',
    description: 'A glockenspiel with soft mallets, narrowed and thinned by a small radio speaker.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: -4, mallet: 0.3, decay: 2, width: 0.1 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.05, interference: 0 } },
    ],
  },
  {
    id: 'cradle-rockings-glass-dust-settling',
    name: 'Glass dust settling',
    category: 'bell',
    description:
      'Rolled glockenspiel blurred to a cloud over its own notes, its tail falling by fifths.',
    preview: SMALL_BARS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { volume: 2, roll: 9, decay: 1.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog', params: { lowCut: 300 } },
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'cradle-rockings-clogs-by-the-stove',
    name: 'Clogs by the stove',
    category: 'keys',
    description:
      'A warm xylophone with a plain ring, its low end lifted and thickened by cassette tape.',
    preview: SMALL_BARS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { mallet: 0.35, decay: 1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'cradle-rockings-knuckles-on-the-door',
    name: 'Knuckles on the door',
    category: 'texture',
    description:
      'A slow roll on wooden bars behind a dark reverb that swells in after each pair of notes and fades.',
    preview: SMALL_BARS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { roll: 6, volume: -2.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 0.65 } }],
  },
  // Choir.
  {
    id: 'cradle-rockings-at-arm-and-shoulder',
    name: 'At arm and shoulder',
    category: 'voice',
    description:
      'One voice closed to a rounded oh with a small vibrato, warmed and set in a tight room.',
    preview: HUMMED,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -3.5, vowel: 0.8, voice: 1.1, tone: 2600, vibrato: 12, width: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'cradle-rockings-hum-against-the-ear',
    name: 'Hum against the ear',
    category: 'voice',
    description:
      'Two voices humming with a quick start and end, held level and folded almost to the middle.',
    preview: LOW_HALF,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { ensemble: 0.15, attack: 0.3, release: 0.7, tone: 520, volume: -14.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'cradle-rockings-aunts-in-the-doorway',
    name: 'Aunts in the doorway',
    category: 'voice',
    description:
      'A pair of altos closed almost to oo, doubled by copies twenty cents either side and a little late.',
    preview: TUNE,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -6, vowel: 0.92, ensemble: 0.25, tone: 2400, vibrato: 6 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.5 } }],
  },
  {
    id: 'cradle-rockings-choir-through-plaster',
    name: 'Choir through plaster',
    category: 'voice',
    description:
      'An open ah of many singers with the air taken out of it, as it sounds from the next room.',
    preview: SUNG,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { tone: 4000, breath: 0.1, volume: -6 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
  },
  {
    id: 'cradle-rockings-basses-rock-the-floor',
    name: 'Basses rock the floor',
    category: 'voice',
    description:
      'Low men on oh with a pipe an octave under them and a hall that keeps only its lows for long.',
    preview: LOW_HALF,
    instrument: { deviceId: 'choir', preset: 'Basses ah', params: { vowel: 0.75, attack: 0.25 } },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'cradle-rockings-monks-and-rain',
    name: 'Monks and rain',
    category: 'voice',
    description:
      'A large low choir that comes in slowly, left out in light rain that dulls and taps on it.',
    preview: LOW_HALF,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.9, release: 2, tone: 1800 },
    },
    effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } }],
  },
  {
    id: 'cradle-rockings-trebles-up-the-stair',
    name: 'Trebles up the stair',
    category: 'voice',
    description:
      'High oo voices that fade in and linger, in a long bright space with nothing under seven hundred hertz.',
    preview: SUNG,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { volume: -6, attack: 1.2, release: 6 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.5 } }],
  },
  {
    id: 'cradle-rockings-breath-before-sleep',
    name: 'Breath before sleep',
    category: 'texture',
    description:
      'Nearly all breath and little tone, opening and closing in slow breaths, its air spread wide.',
    preview: LONG_ROCK,
    instrument: { deviceId: 'choir', preset: 'Breath', params: { attack: 0.8, release: 2 } },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.75 } },
    ],
  },
  {
    id: 'cradle-rockings-vowels-growing-heavy',
    name: 'Vowels growing heavy',
    category: 'voice',
    description:
      'A choir that keeps changing vowel, its tail aging like wax: sagging, dimming and blurring.',
    preview: SUNG,
    instrument: { deviceId: 'choir', preset: 'Slow vowels', params: { voice: 0.9, attack: 1 } },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.6 } }],
  },
  {
    id: 'cradle-rockings-glassy-ee-nodding',
    name: 'Glassy ee, nodding',
    category: 'voice',
    description: 'A steady bright ee with its attacks smeared, trailing long dark repeats of tape.',
    preview: LONG_ROCK,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.6, tone: 5000, release: 1.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
    ],
  },
  {
    id: 'cradle-rockings-one-voice-stone-floor',
    name: 'One voice, stone floor',
    category: 'voice',
    description:
      'A single vibrato voice stepped back with its top lost, in a seven second cathedral.',
    preview: HUMMED,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.3, release: 1.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'cradle-rockings-cradle-song-by-wireless',
    name: 'Cradle song by wireless',
    category: 'voice',
    description:
      'Tenors on oh arriving by a night-time radio link that narrows them and lets them fade.',
    preview: LOW_HALF,
    instrument: { deviceId: 'choir', preset: 'Tenors oh', params: { vibrato: 10 } },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.35, static: 0.12, interference: 0 },
      },
    ],
  },
  {
    id: 'cradle-rockings-back-pew-dozing',
    name: 'Back pew dozing',
    category: 'voice',
    description:
      'A far, breathy choir that wakes sixteen strings tuned to C and rings on through them.',
    preview: SUNG,
    instrument: { deviceId: 'choir', preset: 'Distant choir', params: { attack: 1.6, release: 5 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring' }],
  },
  {
    id: 'cradle-rockings-short-sigh-long-dark',
    name: 'Short sigh, long dark',
    category: 'voice',
    description:
      'Short closed syllables that come back reversed, slow and under seven hundred hertz.',
    preview: HALVES,
    instrument: { deviceId: 'choir', preset: 'Short ah', params: { vowel: 0.9, release: 0.5 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Dark fog' }],
  },
  {
    id: 'cradle-rockings-trebles-slowing-down',
    name: 'Trebles slowing down',
    category: 'voice',
    description:
      'Wandering high voices with a copy at quarter speed, two octaves down, moving under them.',
    preview: LONG_ROCK,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { motion: 0.4, vibrato: 3 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Quarter speed', params: { mix: 0.55 } }],
  },
  // Harp.
  {
    id: 'cradle-rockings-plucked-in-the-lap',
    name: 'Plucked in the lap',
    category: 'plucked',
    description:
      'A muted harp plucked mid-string, its body large and its strikes held down, in a wooden box.',
    preview: ROLLED,
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { body: 1, pluck: 0.42 } },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45, size: 1.4 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'cradle-rockings-harp-by-one-lamp',
    name: 'Harp by one lamp',
    category: 'plucked',
    description:
      'A soft-touched concert harp with no halo, recorded on clean tape in a very small room.',
    preview: FIVE_NOTES,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { touch: 0.12, body: 0.9, halo: 0, volume: -1 },
    },
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'cradle-rockings-glissando-to-the-pillow',
    name: 'Glissando to the pillow',
    category: 'plucked',
    description:
      'Chords swept over more than a second, followed by slow backward swells of themselves.',
    preview: SUNG,
    instrument: { deviceId: 'harp', preset: 'Glissando', params: { sweep: 1.2, volume: 2 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.45 } }],
  },
  {
    id: 'cradle-rockings-table-harp-plain-wood',
    name: 'Table harp, plain wood',
    category: 'plucked',
    description: 'A harp played at its soundboard with one quick slap and a narrow warm spring.',
    preview: OVER_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { decay: 1.2, touch: 0.4, volume: 4.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'cradle-rockings-long-string-long-night',
    name: 'Long string, long night',
    category: 'plucked',
    description:
      'Strings that ring three times as long as usual, their ends lifted, in a slow breathing hall.',
    preview: ROLLED,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.25, volume: -5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -32, amount: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'cradle-rockings-silk-rocked-twice',
    name: 'Silk rocked twice',
    category: 'plucked',
    description:
      'Soft silk strings that bend a fifth of a tone, carried from ear to ear once in two seconds.',
    preview: OVER_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 40, decay: 0.8, volume: 5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.5, depth: 1, drift: 0 } },
    ],
  },
  {
    id: 'cradle-rockings-eaves-dripping',
    name: 'Eaves dripping',
    category: 'plucked',
    description: 'Koto strings touched lightly and left out under slow heavy drips.',
    preview: OVER_A,
    instrument: { deviceId: 'harp', preset: 'Koto', params: { touch: 0.3, halo: 0.2, volume: 6 } },
    effects: [{ deviceId: 'weather', preset: 'Slow drips' }],
  },
  {
    id: 'cradle-rockings-zither-eyes-closing',
    name: 'Zither, eyes closing',
    category: 'plucked',
    description: 'Metal strings kept short, most of the sound sunk under water and wavering.',
    preview: OVER_A,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { decay: 0.5, touch: 0.4, volume: 6 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Half in', params: { mix: 0.7, bubbles: 0.1 } }],
  },
  {
    id: 'cradle-rockings-left-hand-of-the-harp',
    name: 'Left hand of the harp',
    category: 'bass',
    description:
      'A dark hollow harp with a short ring and its octave below added, through a warm stack of speakers.',
    preview: FEET,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.9, filter: 700 } },
      { deviceId: 're-amp', preset: 'Warm stack' },
    ],
  },
  {
    id: 'cradle-rockings-roll-that-takes-all-bar',
    name: 'Roll that takes all bar',
    category: 'plucked',
    description:
      'Chords rolled over a second and a half, then unfolded again from low to high by slow echoes.',
    preview: SUNG,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { halo: 0.5, body: 0.5, volume: -1 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.45 } }],
  },
  {
    id: 'cradle-rockings-dry-pluck-long-dream',
    name: 'Dry pluck, long dream',
    category: 'texture',
    description: 'A short dry pluck remembered as long overlapping grains, half of them backwards.',
    preview: OVER_F,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { volume: 6 } },
    effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear' }],
  },
  // Wind harp.
  {
    id: 'cradle-rockings-window-left-ajar',
    name: 'Window left ajar',
    category: 'string',
    description: 'A wind harp blowing evenly with the top taken down, on a medium plate.',
    preview: LONG_ROCK,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { volume: -4.5, lull: 0, gust: 0.2, hum: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'cradle-rockings-still-air-over-the-cot',
    name: 'Still air over the cot',
    category: 'pad',
    description:
      'Barely any wind on the strings, trembling between lows and highs at the pace of a cradle.',
    preview: LONG_ROCK,
    instrument: { deviceId: 'wind-harp', preset: 'Still air', params: { volume: -5.5 } },
    effects: [{ deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 0.6, depth: 1 } }],
  },
  {
    id: 'cradle-rockings-draught-in-the-passage',
    name: 'Draught in the passage',
    category: 'string',
    description: 'Gusts with long lulls between them, blown through an open pipe.',
    preview: LONG_MINOR,
    instrument: { deviceId: 'wind-harp', preset: 'Long lulls', params: { lull: 0.6, air: 0.3 } },
    effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.8 } }],
  },
  {
    id: 'cradle-rockings-plucked-by-the-draught',
    name: 'Plucked by the draught',
    category: 'plucked',
    description:
      'Four strings to a key, plucked rather than blown, galloping off two heads of tape.',
    preview: ROLLED,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { ring: 1.5, volume: -12 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop' }],
  },
  {
    id: 'cradle-rockings-whistle-made-large',
    name: 'Whistle made large',
    category: 'wind',
    description: 'One whistling harmonic given a giant body, in a dark hall of three seconds.',
    preview: HUMMED,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { volume: 0, air: 0.2, wind: 0.6 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'cradle-rockings-hum-of-the-boards',
    name: 'Hum of the boards',
    category: 'drone',
    description:
      "The strings' own low hum with hardly any wind, through a dark stack turned from the microphone.",
    preview: LOW_HALF,
    instrument: { deviceId: 'wind-harp', preset: 'Low hum', params: { release: 2 } },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly' }],
  },
  {
    id: 'cradle-rockings-curtain-breathing',
    name: 'Curtain breathing',
    category: 'texture',
    description:
      'A breathy, gusting harp that fills quickly and takes twelve seconds to let its breath go.',
    preview: LONG_ROCK,
    instrument: { deviceId: 'wind-harp', preset: 'Sea breeze', params: { lull: 0 } },
    effects: [{ deviceId: 'breath', preset: 'Long slow sigh', params: { depth: 0.75 } }],
  },
  {
    id: 'cradle-rockings-swell-of-the-quilt',
    name: 'Swell of the quilt',
    category: 'pad',
    description:
      'Slowly swelling strings with a twelve second ring, deep under a wide, slow chorus.',
    preview: SUNG,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { volume: -4, lull: 0, hum: 0 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Deep sea' }],
  },
  {
    id: 'cradle-rockings-wires-past-the-yard',
    name: 'Wires past the yard',
    category: 'string',
    description: 'Humming wires in a strong wind, dark and narrow, far off in fog.',
    preview: LONG_MINOR,
    instrument: { deviceId: 'wind-harp', preset: 'Fence wires', params: { hum: 0.4, volume: -4 } },
    effects: [{ deviceId: 'distance', preset: 'Through fog' }],
  },
  // Felt piano.
  {
    id: 'cradle-rockings-to-and-fro-left-hand',
    name: 'To and fro, left hand',
    category: 'keys',
    description: 'A thick-felted piano with no room of its own, on reel tape, its top shaded off.',
    preview: ROCK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.9, hardness: 0.15, reverbMix: 0, thump: 0.3, action: 0.1, outputDb: -14 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 1800 } },
    ],
  },
  {
    id: 'cradle-rockings-half-pedal-cradle',
    name: 'Half pedal cradle',
    category: 'keys',
    description:
      'A half-pedalled piano that keeps eight strings of C major sounding under whatever it plays.',
    preview: FIVE_NOTES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { reverbMix: 0, outputDb: -13.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.65, decay: 6 } }],
  },
  {
    id: 'cradle-rockings-upright-under-a-shawl',
    name: 'Upright under a shawl',
    category: 'keys',
    description:
      'A creaking upright a little out of tune, filtered dark and played inside a wooden body.',
    preview: OVER_F,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { grit: 0.1, outputDb: -15 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.6, size: 2 } },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 650 } },
    ],
  },
  {
    id: 'cradle-rockings-thud-of-the-bassinet',
    name: 'Thud of the bassinet',
    category: 'keys',
    description:
      'Soft thudding hammers whose attacks are fogged away, with an octave above added lightly.',
    preview: ROCK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0, outputDb: -9.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { mix: 0.8 } },
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.4 } },
    ],
  },
  {
    id: 'cradle-rockings-piano-past-the-pantry',
    name: 'Piano past the pantry',
    category: 'keys',
    description:
      'A felted piano already in another room, moved to the far end of a much larger one.',
    preview: FIVE_NOTES,
    instrument: { deviceId: 'felt-piano', preset: 'Next room' },
    effects: [{ deviceId: 'distance', preset: 'Far shore', params: { distance: 0.85 } }],
  },
  {
    id: 'cradle-rockings-parlour-disc-worn',
    name: 'Parlour disc, worn',
    category: 'keys',
    description: 'A gritty mono piano on an old fast record, with the crackle kept low.',
    preview: OVER_F,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { grit: 0.3, outputDb: -8.5 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Parlour 78',
        params: { crackle: 0.12, surface: 0.15, pops: 0 },
      },
    ],
  },
  {
    id: 'cradle-rockings-keys-dissolving',
    name: 'Keys dissolving',
    category: 'pad',
    description:
      'A soft-pedalled wash of piano recorded over itself until the ringing of a room is left.',
    preview: OVER_A,
    instrument: { deviceId: 'felt-piano', preset: 'Blurred wash', params: { reverbMix: 0.2 } },
    effects: [{ deviceId: 'generations', preset: 'Quick to tones', params: { mix: 0.55 } }],
  },
  // Magnet piano.
  {
    id: 'cradle-rockings-strings-that-hum-home',
    name: 'Strings that hum home',
    category: 'keys',
    description:
      'Pure swelling strings with no brightness, gently pulsed and widened by a faint chorus.',
    preview: SUNG,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { bright: 0, bloom: 0.3 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.6, depth: 0.6 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
  {
    id: 'cradle-rockings-hammer-then-a-long-sigh',
    name: 'Hammer, then a long sigh',
    category: 'keys',
    description: 'A soft hammer ahead of a six second swell, its murky repeats falling behind.',
    preview: LONG_ROCK,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { bright: 0.3, damper: 2, volume: -7.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.5 } }],
  },
  {
    id: 'cradle-rockings-twelfth-over-the-pillow',
    name: 'Twelfth over the pillow',
    category: 'organ',
    description:
      'Strings sung on their third harmonic, turning slowly in a cabinet across the room.',
    preview: LOW_HALF,
    instrument: { deviceId: 'magnet-piano', preset: 'Twelfth organ', params: { bloom: 0.3 } },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'cradle-rockings-tide-under-the-crib',
    name: 'Tide under the crib',
    category: 'pad',
    description:
      'A two second swell and an overtone sweep, its bands rising and drifting on cycles of their own.',
    preview: LONG_ROCK,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { bloom: 2, volume: -11.5 },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves' }],
  },
  {
    id: 'cradle-rockings-dark-wood-rocker',
    name: 'Dark wood rocker',
    category: 'bass',
    description:
      'Low magnets under a full hammer in a big wooden body, opened by each note and left in a dark spring.',
    preview: FEET,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { hammer: 0.9, bloom: 0.4, damper: 0.5, body: 1, width: 0.2, volume: -14.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 3 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'cradle-rockings-mobile-turning',
    name: 'Mobile turning',
    category: 'keys',
    description:
      'A string rippling over its upper harmonics, circling the head once in five seconds.',
    preview: OCTAVE_LATE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { sweepRate: 0.5, hammer: 0.3 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow circle' }],
  },
  {
    id: 'cradle-rockings-door-pulled-to',
    name: 'Door pulled to',
    category: 'keys',
    description:
      'A ringing, half-hammered piano lost behind a dark woollen wall of fuzz and reverb.',
    preview: OVER_A,
    instrument: { deviceId: 'magnet-piano', preset: 'Ringing room' },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.5 } }],
  },
  // Ice.
  {
    id: 'cradle-rockings-frost-on-the-pane',
    name: 'Frost on the pane',
    category: 'bell',
    description:
      'Thick ice with a short ring and no cracks, with long glints an octave up thrown wide around it.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: { ring: 2.5, cracks: 0, volume: 2.5 },
    },
    effects: [{ deviceId: 'glints', preset: 'Wide halo' }],
  },
  {
    id: 'cradle-rockings-near-ping-small-hand',
    name: 'Near ping, small hand',
    category: 'bell',
    description:
      'A close ping without chirp or shore, dried and tamed and placed in a thimble of a bottle.',
    preview: ONE_FEWER,
    instrument: {
      deviceId: 'ice',
      preset: 'Near ping',
      params: { crack: 0.1, ring: 1.2, shore: 0, volume: 5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Thimble' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'cradle-rockings-lake-across-the-fields',
    name: 'Lake across the fields',
    category: 'texture',
    description: 'A night lake heard from far off, its cracks few, inside a wide summer reverb.',
    preview: LONG_ROCK,
    instrument: { deviceId: 'ice', preset: 'Lake at night', params: { cracks: 0.2, volume: -1.5 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.6 } }],
  },
  {
    id: 'cradle-rockings-ice-bells-half-asleep',
    name: 'Ice bells, half asleep',
    category: 'bell',
    description: 'Even ice bells over a blurred copy of themselves at half speed an octave below.',
    preview: TUNE_IN_G,
    instrument: { deviceId: 'ice', preset: 'Ice bells', params: { bright: 0.35, volume: -0.5 } },
    effects: [{ deviceId: 'half-speed', preset: 'Blurred half', params: { mix: 0.5 } }],
  },
  {
    id: 'cradle-rockings-deep-floe-rocker',
    name: 'Deep floe rocker',
    category: 'bass',
    description: 'A dull, long, low floe with its own octave below, moving in a slow stereo sway.',
    preview: FEET,
    instrument: { deviceId: 'ice', preset: 'Deep floe', params: { cracks: 0, volume: 1 } },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'around', preset: 'Gentle sway', params: { rate: 0.4 } },
    ],
  },
  {
    id: 'cradle-rockings-clear-ping-at-two',
    name: 'Clear ping at two',
    category: 'bell',
    description:
      'One clear strike without crack or shore, answered by twelve echoes that fade into the dark.',
    preview: TUNE_IN_G,
    instrument: { deviceId: 'ice', preset: 'Clear ping', params: { volume: 4 } },
    effects: [{ deviceId: 'constellation', preset: 'Dark field', params: { span: 3000 } }],
  },
  {
    id: 'cradle-rockings-thaw-on-the-gutter',
    name: 'Thaw on the gutter',
    category: 'texture',
    description:
      'A far slow thaw with no crack in it, stretched ten times longer and darker behind each note.',
    preview: SUNG,
    instrument: { deviceId: 'ice', preset: 'Slow thaw', params: { cracks: 0, volume: -1.5 } },
    effects: [{ deviceId: 'stretch', preset: 'Dark drift' }],
  },
  // West coast.
  {
    id: 'cradle-rockings-wooden-bird-winding',
    name: 'Wooden bird, winding',
    category: 'plucked',
    description:
      'A woody pluck with little chance in it, its echoes sagging a little lower at each step.',
    preview: OVER_A,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { chance: 0.02, fold: 0.2, volume: 0 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Falling steps',
        params: { drop: 25, loss: 3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'cradle-rockings-round-rocker',
    name: 'Round rocker',
    category: 'bass',
    description:
      'A deep folded tone that leans in and stays while held, warmed by a triode and swept lightly above its bass.',
    preview: FEET,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { attack: 0.12, decay: 2, fold: 0.5, colour: 0.35, volume: -0.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'phaser', preset: 'Bass safe' },
    ],
  },
  {
    id: 'cradle-rockings-soft-mallet-shut-door',
    name: 'Soft mallet, shut door',
    category: 'keys',
    description: 'A soft folded mallet through a loudspeaker put away in a cupboard.',
    preview: OVER_F,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { fold: 0.3, decay: 2.5, volume: -3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard' }],
  },
  {
    id: 'cradle-rockings-glass-bell-afloat',
    name: 'Glass bell afloat',
    category: 'bell',
    description:
      'A long frequency-modulated bell that wavers just below the surface of shallow water, then goes to a long plate.',
    preview: SPRING_DOWN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { fm: 0.35, decay: 4, volume: -3 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'cradle-rockings-pipes-behind-the-stove',
    name: 'Pipes behind the stove',
    category: 'wind',
    description:
      'Hollow swelling pipes with an octave and a twelfth drawn, shimmering between lows and highs.',
    preview: LOW_HALF,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow pipes',
      params: { attack: 0.25, volume: -4.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Hollow fifths', params: { fifth: 0, octave: 0.6, mix: 0.5 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.5 } },
    ],
  },
  {
    id: 'cradle-rockings-thumb-on-the-tin-lid',
    name: 'Thumb on the tin lid',
    category: 'plucked',
    description: 'A short thumbed tone, worn by an early sampler and slapped once on tape.',
    preview: ONE_FEWER,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { fold: 0.1, volume: -2.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Muffled sampler', params: { noise: 0 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  // Flock.
  {
    id: 'cradle-rockings-moths-at-the-nightlight',
    name: 'Moths at the nightlight',
    category: 'texture',
    description:
      'A small fluttering flock that gathers around each note, its bands twinkling apart.',
    preview: TUNE,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { birds: 4, gather: 0.2, octaves: 0.2 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Wide twinkle' }],
  },
  {
    id: 'cradle-rockings-two-wings-folded',
    name: 'Two wings folded',
    category: 'pad',
    description: 'A hollow pair of voices, dulled and slow to gather, in a clay pot.',
    preview: LOW_HALF,
    instrument: { deviceId: 'flock', preset: 'Hollow pair', params: { tone: 0.15, gather: 0.4 } },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot' }],
  },
  {
    id: 'cradle-rockings-birds-gone-to-roost',
    name: 'Birds gone to roost',
    category: 'pad',
    description:
      'Voices that fall in from above within a second, under a long dark reverb that sinks by octaves.',
    preview: SUNG,
    instrument: { deviceId: 'flock', preset: 'Falling in', params: { gather: 1 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.6 } }],
  },
  {
    id: 'cradle-rockings-murmur-behind-the-door',
    name: 'Murmur behind the door',
    category: 'drone',
    description: 'A low, straying murmur kept under twelve hundred hertz and slowly notched.',
    preview: LONG_MINOR,
    instrument: { deviceId: 'flock', preset: 'Low murmur', params: { gather: 1.2 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'auto-filter', preset: 'Slow notch' },
    ],
  },
  {
    id: 'cradle-rockings-one-whistle-home',
    name: 'One whistle home',
    category: 'wind',
    description:
      'A single pure whistle that waits before it wavers, followed by itself a bar late and by its octave below a bar after that.',
    preview: HUMMED,
    instrument: { deviceId: 'flock', preset: 'One whistle', params: { leave: 1.6, tone: 0.1 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 450, depth: 30, width: 0.6 } },
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 2.4, interval2: -12, fade: 0.1, mix: 0.5 },
      },
    ],
  },
]
