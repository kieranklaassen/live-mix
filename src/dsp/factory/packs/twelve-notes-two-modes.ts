import { type FactoryPreset, type Phrase } from '../types'

// C Lydian and its exact mirror, C Phrygian: each note n of the upper voice answered by a lower
// one at a fixed sum less n, so the two share only C and G and hold all twelve notes between them.
// Laid out in pairs: one voice of an instrument in a bright light and the same voice in a dark one.

// The bright voice alone: C Lydian, C D F sharp E G, then B A F sharp G E D C.
const BRIGHT_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.68, note: 72, gain: 0.55 },
    { atSec: 0.69, durSec: 0.23, note: 74, gain: 0.55 },
    { atSec: 0.92, durSec: 0.68, note: 78, gain: 0.55 },
    { atSec: 1.61, durSec: 0.23, note: 76, gain: 0.55 },
    { atSec: 1.84, durSec: 0.9, note: 79, gain: 0.55 },
    { atSec: 2.76, durSec: 0.45, note: 83, gain: 0.55 },
    { atSec: 3.22, durSec: 0.45, note: 81, gain: 0.55 },
    { atSec: 3.68, durSec: 0.45, note: 78, gain: 0.55 },
    { atSec: 4.14, durSec: 0.45, note: 79, gain: 0.55 },
    { atSec: 4.6, durSec: 0.45, note: 76, gain: 0.55 },
    { atSec: 5.06, durSec: 0.45, note: 74, gain: 0.55 },
    { atSec: 5.52, durSec: 0.9, note: 72, gain: 0.55 },
  ],
}

// The dark voice alone, slower so that slow breath can speak it: C Phrygian, G F D flat E flat C,
// then A flat B flat C, the mirror of C D F sharp E G, B A G, each note n as 151 less n.
const DARK_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.88, note: 79, gain: 0.55 },
    { atSec: 0.9, durSec: 0.68, note: 77, gain: 0.55 },
    { atSec: 1.6, durSec: 0.88, note: 73, gain: 0.55 },
    { atSec: 2.5, durSec: 0.68, note: 75, gain: 0.55 },
    { atSec: 3.2, durSec: 0.88, note: 72, gain: 0.55 },
    { atSec: 4.1, durSec: 0.68, note: 68, gain: 0.55 },
    { atSec: 4.8, durSec: 0.88, note: 70, gain: 0.55 },
    { atSec: 5.7, durSec: 1.38, note: 72, gain: 0.55 },
  ],
}

// The same dark voice an octave lower, where reeds and low voices have it.
const DARK_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.88, note: 67, gain: 0.55 },
    { atSec: 0.9, durSec: 0.68, note: 65, gain: 0.55 },
    { atSec: 1.6, durSec: 0.88, note: 61, gain: 0.55 },
    { atSec: 2.5, durSec: 0.68, note: 63, gain: 0.55 },
    { atSec: 3.2, durSec: 0.88, note: 60, gain: 0.55 },
    { atSec: 4.1, durSec: 0.68, note: 56, gain: 0.55 },
    { atSec: 4.8, durSec: 0.88, note: 58, gain: 0.55 },
    { atSec: 5.7, durSec: 1.38, note: 60, gain: 0.55 },
  ],
}

// Canon by inversion at four beats: the lower voice is the upper one mirrored, a bar behind. On every
// beat the two make a third, a sixth or a perfect interval, and they close on the fifth C and G.
const CANON_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.59, note: 84, gain: 0.5 },
    { atSec: 0.6, durSec: 0.19, note: 83, gain: 0.5 },
    { atSec: 0.8, durSec: 0.59, note: 86, gain: 0.5 },
    { atSec: 0.8, durSec: 0.59, note: 55, gain: 0.5 },
    { atSec: 1.4, durSec: 0.19, note: 84, gain: 0.5 },
    { atSec: 1.4, durSec: 0.19, note: 56, gain: 0.5 },
    { atSec: 1.6, durSec: 0.59, note: 81, gain: 0.5 },
    { atSec: 1.6, durSec: 0.59, note: 53, gain: 0.5 },
    { atSec: 2.2, durSec: 0.19, note: 79, gain: 0.5 },
    { atSec: 2.2, durSec: 0.19, note: 55, gain: 0.5 },
    { atSec: 2.4, durSec: 0.59, note: 78, gain: 0.5 },
    { atSec: 2.4, durSec: 0.59, note: 58, gain: 0.5 },
    { atSec: 3, durSec: 0.19, note: 60, gain: 0.5 },
    { atSec: 3, durSec: 0.19, note: 81, gain: 0.5 },
    { atSec: 3.2, durSec: 0.59, note: 61, gain: 0.5 },
    { atSec: 3.2, durSec: 0.59, note: 76, gain: 0.5 },
    { atSec: 3.8, durSec: 0.19, note: 79, gain: 0.5 },
    { atSec: 3.8, durSec: 0.19, note: 58, gain: 0.5 },
    { atSec: 4, durSec: 0.59, note: 84, gain: 0.5 },
    { atSec: 4, durSec: 0.59, note: 63, gain: 0.5 },
    { atSec: 4.6, durSec: 0.19, note: 60, gain: 0.5 },
    { atSec: 4.6, durSec: 0.19, note: 81, gain: 0.5 },
    { atSec: 4.8, durSec: 0.59, note: 55, gain: 0.5 },
    { atSec: 4.8, durSec: 2, note: 79, gain: 0.5 },
    { atSec: 5.4, durSec: 0.19, note: 58, gain: 0.5 },
    { atSec: 5.6, durSec: 1.2, note: 60, gain: 0.5 },
  ],
}

// Canon by inversion in 3/2 at six quarter beats, a whole bar: the mirror enters on G under the upper
// voice's B, and the two close on C and G.
const CANON_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.74, note: 84, gain: 0.5 },
    { atSec: 0.76, durSec: 0.36, note: 86, gain: 0.5 },
    { atSec: 1.14, durSec: 0.74, note: 83, gain: 0.5 },
    { atSec: 1.14, durSec: 0.74, note: 67, gain: 0.45 },
    { atSec: 1.9, durSec: 0.36, note: 81, gain: 0.5 },
    { atSec: 1.9, durSec: 0.36, note: 65, gain: 0.45 },
    { atSec: 2.28, durSec: 0.74, note: 76, gain: 0.5 },
    { atSec: 2.28, durSec: 0.74, note: 68, gain: 0.45 },
    { atSec: 3.04, durSec: 0.36, note: 78, gain: 0.5 },
    { atSec: 3.04, durSec: 0.36, note: 70, gain: 0.45 },
    { atSec: 3.42, durSec: 0.74, note: 79, gain: 0.5 },
    { atSec: 3.42, durSec: 0.74, note: 75, gain: 0.45 },
    { atSec: 4.18, durSec: 0.36, note: 76, gain: 0.5 },
    { atSec: 4.18, durSec: 0.36, note: 73, gain: 0.45 },
    { atSec: 4.56, durSec: 2.26, note: 79, gain: 0.5 },
    { atSec: 4.56, durSec: 0.74, note: 72, gain: 0.45 },
    { atSec: 5.32, durSec: 0.36, note: 75, gain: 0.45 },
    { atSec: 5.7, durSec: 1.12, note: 72, gain: 0.45 },
  ],
}

// Canon by inversion at eight beats, four half notes: the question alone, then each answer under the
// next question, thirds and sixths and octaves to the closing fifth.
const CANON_EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.39, note: 72, gain: 0.5 },
    { atSec: 0.4, durSec: 0.39, note: 74, gain: 0.5 },
    { atSec: 0.8, durSec: 0.39, note: 76, gain: 0.5 },
    { atSec: 1.2, durSec: 0.39, note: 79, gain: 0.5 },
    { atSec: 1.6, durSec: 0.39, note: 83, gain: 0.5 },
    { atSec: 1.6, durSec: 0.39, note: 55, gain: 0.5 },
    { atSec: 2, durSec: 0.39, note: 81, gain: 0.5 },
    { atSec: 2, durSec: 0.39, note: 53, gain: 0.5 },
    { atSec: 2.4, durSec: 0.39, note: 78, gain: 0.5 },
    { atSec: 2.4, durSec: 0.39, note: 51, gain: 0.5 },
    { atSec: 2.8, durSec: 0.39, note: 76, gain: 0.5 },
    { atSec: 2.8, durSec: 0.39, note: 48, gain: 0.5 },
    { atSec: 3.2, durSec: 0.39, note: 84, gain: 0.5 },
    { atSec: 3.2, durSec: 0.39, note: 44, gain: 0.5 },
    { atSec: 3.6, durSec: 0.39, note: 79, gain: 0.5 },
    { atSec: 3.6, durSec: 0.39, note: 46, gain: 0.5 },
    { atSec: 4, durSec: 0.39, note: 76, gain: 0.5 },
    { atSec: 4, durSec: 0.39, note: 49, gain: 0.5 },
    { atSec: 4.4, durSec: 0.39, note: 72, gain: 0.5 },
    { atSec: 4.4, durSec: 0.39, note: 51, gain: 0.5 },
    { atSec: 4.8, durSec: 2.5, note: 79, gain: 0.5 },
    { atSec: 4.8, durSec: 0.39, note: 43, gain: 0.5 },
    { atSec: 5.2, durSec: 0.39, note: 48, gain: 0.5 },
    { atSec: 5.6, durSec: 0.39, note: 51, gain: 0.5 },
    { atSec: 6, durSec: 0.39, note: 55, gain: 0.5 },
    { atSec: 6.4, durSec: 0.95, note: 48, gain: 0.5 },
  ],
}

// The long canon, C D A F sharp E B C G over G F B flat D flat E flat A flat G C, with a middle
// voice that has only the two notes both modes share, C and G.
const THREE_VOICES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.76, note: 72, gain: 0.42 },
    { atSec: 0, durSec: 1.53, note: 67, gain: 0.35 },
    { atSec: 0.78, durSec: 0.76, note: 74, gain: 0.42 },
    { atSec: 0.78, durSec: 0.76, note: 55, gain: 0.45 },
    { atSec: 1.56, durSec: 0.76, note: 81, gain: 0.42 },
    { atSec: 1.56, durSec: 0.76, note: 53, gain: 0.45 },
    { atSec: 1.56, durSec: 1.53, note: 60, gain: 0.35 },
    { atSec: 2.34, durSec: 0.76, note: 78, gain: 0.42 },
    { atSec: 2.34, durSec: 0.76, note: 46, gain: 0.45 },
    { atSec: 3.12, durSec: 0.76, note: 76, gain: 0.42 },
    { atSec: 3.12, durSec: 0.76, note: 49, gain: 0.45 },
    { atSec: 3.12, durSec: 1.53, note: 67, gain: 0.35 },
    { atSec: 3.9, durSec: 0.76, note: 83, gain: 0.42 },
    { atSec: 3.9, durSec: 0.76, note: 51, gain: 0.45 },
    { atSec: 4.68, durSec: 0.76, note: 84, gain: 0.42 },
    { atSec: 4.68, durSec: 0.76, note: 44, gain: 0.45 },
    { atSec: 4.68, durSec: 0.76, note: 60, gain: 0.35 },
    { atSec: 5.46, durSec: 1.53, note: 79, gain: 0.42 },
    { atSec: 5.46, durSec: 0.76, note: 43, gain: 0.45 },
    { atSec: 5.46, durSec: 1.15, note: 67, gain: 0.35 },
    { atSec: 6.24, durSec: 1.06, note: 48, gain: 0.45 },
  ],
}

// C, D, B minor and C over a held C and G: the triads of the bright mode.
const BRIGHT_CHORDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 48, gain: 0.45 },
    { atSec: 0, durSec: 6.8, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 1.6, note: 72, gain: 0.42 },
    { atSec: 1.65, durSec: 1.6, note: 66, gain: 0.42 },
    { atSec: 1.65, durSec: 1.6, note: 69, gain: 0.42 },
    { atSec: 1.65, durSec: 1.6, note: 74, gain: 0.42 },
    { atSec: 3.3, durSec: 1.6, note: 66, gain: 0.42 },
    { atSec: 3.3, durSec: 1.6, note: 71, gain: 0.42 },
    { atSec: 3.3, durSec: 1.6, note: 74, gain: 0.42 },
    { atSec: 4.95, durSec: 1.9, note: 67, gain: 0.42 },
    { atSec: 4.95, durSec: 1.9, note: 72, gain: 0.42 },
    { atSec: 4.95, durSec: 1.9, note: 76, gain: 0.42 },
  ],
}

// The same four mirrored note for note: C minor, B flat minor, D flat and C minor over C and G.
const DARK_CHORDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 48, gain: 0.45 },
    { atSec: 0, durSec: 6.8, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 1.6, note: 72, gain: 0.42 },
    { atSec: 0, durSec: 1.6, note: 75, gain: 0.42 },
    { atSec: 1.65, durSec: 1.6, note: 65, gain: 0.42 },
    { atSec: 1.65, durSec: 1.6, note: 70, gain: 0.42 },
    { atSec: 1.65, durSec: 1.6, note: 73, gain: 0.42 },
    { atSec: 3.3, durSec: 1.6, note: 65, gain: 0.42 },
    { atSec: 3.3, durSec: 1.6, note: 68, gain: 0.42 },
    { atSec: 3.3, durSec: 1.6, note: 73, gain: 0.42 },
    { atSec: 4.95, durSec: 1.9, note: 63, gain: 0.42 },
    { atSec: 4.95, durSec: 1.9, note: 67, gain: 0.42 },
    { atSec: 4.95, durSec: 1.9, note: 72, gain: 0.42 },
  ],
}

// Each bright triad and then its mirror over the fifth they share: B minor and D flat, D and B flat
// minor, C and C minor, all twelve notes in six chords.
const TWO_LIGHTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.07, note: 74, gain: 0.42 },
    { atSec: 0, durSec: 1.07, note: 71, gain: 0.42 },
    { atSec: 0, durSec: 1.07, note: 66, gain: 0.42 },
    { atSec: 0, durSec: 7, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 7, note: 48, gain: 0.45 },
    { atSec: 1.12, durSec: 1.07, note: 73, gain: 0.42 },
    { atSec: 1.12, durSec: 1.07, note: 68, gain: 0.42 },
    { atSec: 1.12, durSec: 1.07, note: 65, gain: 0.42 },
    { atSec: 2.24, durSec: 1.07, note: 74, gain: 0.42 },
    { atSec: 2.24, durSec: 1.07, note: 69, gain: 0.42 },
    { atSec: 2.24, durSec: 1.07, note: 66, gain: 0.42 },
    { atSec: 3.36, durSec: 1.07, note: 73, gain: 0.42 },
    { atSec: 3.36, durSec: 1.07, note: 70, gain: 0.42 },
    { atSec: 3.36, durSec: 1.07, note: 65, gain: 0.42 },
    { atSec: 4.48, durSec: 1.07, note: 72, gain: 0.42 },
    { atSec: 4.48, durSec: 1.07, note: 67, gain: 0.42 },
    { atSec: 4.48, durSec: 1.07, note: 64, gain: 0.42 },
    { atSec: 5.6, durSec: 1.4, note: 75, gain: 0.42 },
    { atSec: 5.6, durSec: 1.4, note: 72, gain: 0.42 },
    { atSec: 5.6, durSec: 1.4, note: 67, gain: 0.42 },
  ],
}

// C Lydian climbing while its mirror, C Phrygian from G, falls: the two hands in turn, so that no note
// of one is struck against the other, a fan of twelve notes opening to C and G.
const SCALES_OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.34, note: 72, gain: 0.5 },
    { atSec: 0.36, durSec: 0.34, note: 67, gain: 0.45 },
    { atSec: 0.72, durSec: 0.34, note: 74, gain: 0.5 },
    { atSec: 1.08, durSec: 0.34, note: 65, gain: 0.45 },
    { atSec: 1.44, durSec: 0.34, note: 76, gain: 0.5 },
    { atSec: 1.8, durSec: 0.34, note: 63, gain: 0.45 },
    { atSec: 2.16, durSec: 0.34, note: 78, gain: 0.5 },
    { atSec: 2.52, durSec: 0.34, note: 61, gain: 0.45 },
    { atSec: 2.88, durSec: 0.34, note: 79, gain: 0.5 },
    { atSec: 3.24, durSec: 0.34, note: 60, gain: 0.45 },
    { atSec: 3.6, durSec: 0.34, note: 81, gain: 0.5 },
    { atSec: 3.96, durSec: 0.34, note: 58, gain: 0.45 },
    { atSec: 4.32, durSec: 0.34, note: 83, gain: 0.5 },
    { atSec: 4.68, durSec: 0.34, note: 56, gain: 0.45 },
    { atSec: 5.04, durSec: 0.34, note: 84, gain: 0.5 },
    { atSec: 5.4, durSec: 0.34, note: 55, gain: 0.45 },
    { atSec: 5.76, durSec: 1.4, note: 79, gain: 0.5 },
    { atSec: 5.76, durSec: 1.4, note: 60, gain: 0.45 },
  ],
}

// And closing, together: B A F sharp G E D C falls as A flat B flat D flat C E flat F G climbs, wide
// apart at first, until they meet on the fifth C and G.
const SCALES_CLOSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.18, note: 83, gain: 0.5 },
    { atSec: 0, durSec: 1.18, note: 44, gain: 0.45 },
    { atSec: 1.2, durSec: 0.39, note: 81, gain: 0.5 },
    { atSec: 1.2, durSec: 0.39, note: 46, gain: 0.45 },
    { atSec: 1.6, durSec: 0.78, note: 78, gain: 0.5 },
    { atSec: 1.6, durSec: 0.78, note: 49, gain: 0.45 },
    { atSec: 2.4, durSec: 1.18, note: 79, gain: 0.5 },
    { atSec: 2.4, durSec: 1.18, note: 48, gain: 0.45 },
    { atSec: 3.6, durSec: 0.39, note: 76, gain: 0.5 },
    { atSec: 3.6, durSec: 0.39, note: 51, gain: 0.45 },
    { atSec: 4, durSec: 0.78, note: 74, gain: 0.5 },
    { atSec: 4, durSec: 0.78, note: 53, gain: 0.45 },
    { atSec: 4.8, durSec: 0.78, note: 72, gain: 0.5 },
    { atSec: 4.8, durSec: 0.78, note: 55, gain: 0.45 },
    { atSec: 5.6, durSec: 1.5, note: 67, gain: 0.5 },
    { atSec: 5.6, durSec: 1.5, note: 60, gain: 0.45 },
  ],
}

// The bare fifth, and over it F sharp, B and D one by one.
const BRIGHT_DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 6.8, note: 43, gain: 0.4 },
    { atSec: 0.8, durSec: 6, note: 66, gain: 0.4 },
    { atSec: 2, durSec: 4.8, note: 71, gain: 0.4 },
    { atSec: 3.2, durSec: 3.6, note: 74, gain: 0.4 },
  ],
}

// The same fifth, and over it D flat, A flat and F, the mirror of those three.
const DARK_DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 6.8, note: 43, gain: 0.4 },
    { atSec: 0.8, durSec: 6, note: 73, gain: 0.4 },
    { atSec: 2, durSec: 4.8, note: 68, gain: 0.4 },
    { atSec: 3.2, durSec: 3.6, note: 65, gain: 0.4 },
  ],
}

// The bright voice over the fifth both modes share: C D F sharp E G, B A G above a held C and G.
const BRIGHT_OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.88, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 7.1, note: 55, gain: 0.28 },
    { atSec: 0, durSec: 7.1, note: 48, gain: 0.32 },
    { atSec: 0.9, durSec: 0.68, note: 74, gain: 0.5 },
    { atSec: 1.6, durSec: 0.88, note: 78, gain: 0.5 },
    { atSec: 2.5, durSec: 0.68, note: 76, gain: 0.5 },
    { atSec: 3.2, durSec: 0.88, note: 79, gain: 0.5 },
    { atSec: 4.1, durSec: 0.68, note: 83, gain: 0.5 },
    { atSec: 4.8, durSec: 0.88, note: 81, gain: 0.5 },
    { atSec: 5.7, durSec: 1.38, note: 79, gain: 0.5 },
  ],
}

// And its mirror over the same held fifth: G F D flat E flat C, A flat B flat C.
const DARK_OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.88, note: 79, gain: 0.5 },
    { atSec: 0, durSec: 7.1, note: 55, gain: 0.28 },
    { atSec: 0, durSec: 7.1, note: 48, gain: 0.32 },
    { atSec: 0.9, durSec: 0.68, note: 77, gain: 0.5 },
    { atSec: 1.6, durSec: 0.88, note: 73, gain: 0.5 },
    { atSec: 2.5, durSec: 0.68, note: 75, gain: 0.5 },
    { atSec: 3.2, durSec: 0.88, note: 72, gain: 0.5 },
    { atSec: 4.1, durSec: 0.68, note: 68, gain: 0.5 },
    { atSec: 4.8, durSec: 0.88, note: 70, gain: 0.5 },
    { atSec: 5.7, durSec: 1.38, note: 72, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Flutes: each kind once open to the light and once shaded.
  {
    id: 'twelve-notes-two-modes-sharp-four-on-the-sill',
    name: 'Sharp four on the sill',
    category: 'wind',
    description:
      'A straight concert flute blown hard with no vibrato, its top lifted, in a hall whose lows die away first.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { blow: 0.8, breath: 0.06, attack: 0.05, release: 0.3, chiff: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { presence: 4, air: 4, clear: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-flat-two-behind-blinds',
    name: 'Flat two behind blinds',
    category: 'wind',
    description:
      'A soft concert flute that is mostly breath, put on dull cassette tape and then heard from far back in fog.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: {
        blow: 0.06,
        breath: 0.8,
        attack: 0.22,
        release: 1.6,
        vibrato: 0.15,
        scoop: 45,
        volume: -10.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05, tone: 0.25 } },
      { deviceId: 'distance', preset: 'Through fog', params: { distance: 0.75 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-hill-with-a-raised-four',
    name: 'Hill with a raised four',
    category: 'wind',
    description:
      'A wooden flute with a full vibrato, its clean echoes evenly spaced and the top of it opened wide.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.2, blow: 0.7, vibrato: 0.7, scoop: 20, release: 1.1, volume: -11 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 460, feedback: 0.35, mix: 0.28 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-valley-of-the-low-second',
    name: 'Valley of the low second',
    category: 'wind',
    description:
      'A dull wooden recorder with a second voice a Phrygian third under it, both in a cave that has no top.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.3, release: 0.8, blow: 0.04, breath: 0.3, volume: -2 },
    },
    effects: [
      {
        deviceId: 'lattice',
        params: {
          scale: 5,
          v1Role: 1,
          v1Degrees: -2,
          v1Level: -4,
          v1Pan: -50,
          v2Role: 0,
          v3Role: 0,
          mix: 50,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-pipes-going-up-a-mode',
    name: 'Pipes going up a mode',
    category: 'wind',
    description:
      'Pan pipes with a hard puff at the front, a Lydian third and fifth stacked above them, on a bright plate.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.35, blow: 0.75, release: 0.9, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'lattice',
        params: {
          scale: 6,
          v1Role: 1,
          v1Degrees: 2,
          v1Level: -6,
          v1Pan: -45,
          v2Role: 1,
          v2Degrees: 4,
          v2Level: -9,
          v2Pan: 45,
          v3Role: 0,
          mix: 45,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-pipes-coming-down-one',
    name: 'Pipes coming down one',
    category: 'wind',
    description:
      'Breathy pan pipes that swell in, sounded inside a large closed cistern, the whole rising and sinking slowly.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.4, breath: 0.85, blow: 0.15, release: 2, volume: -9 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.75 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { depth: 0.45 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-bamboo-before-sunrise',
    name: 'Bamboo before sunrise',
    category: 'wind',
    description:
      'A bamboo flute that bends up into every note, thrown to seven scattered echoes at both sides.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.35, blow: 0.9, scoop: 160, vibrato: 0.3, release: 0.9, volume: -12 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 1300, mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-bamboo-under-the-lake',
    name: 'Bamboo under the lake',
    category: 'wind',
    description:
      'A soft bamboo flute with a wide vibrato, sunk deep under water and left in a dark four second hall.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.35, release: 2.6, blow: 0.2, breath: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Deep water', params: { depth: 0.6, bubbles: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-alto-in-the-east-window',
    name: 'Alto in the east window',
    category: 'wind',
    description:
      'An alto flute with a strong vibrato, three chorus voices round it and a faint octave rising in its tail.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { vibrato: 0.8, breath: 0.22, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-alto-in-the-north-window',
    name: 'Alto in the north window',
    category: 'wind',
    description:
      'A low flute that is slow to speak, with slow backward swells an octave under it and no top.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.4, breath: 0.75, blow: 0.1, release: 4, volume: -7 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 1400, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-follows-six-beats-after',
    name: 'Follows six beats after',
    category: 'wind',
    description:
      'A hard blown flute through the fast bright horn of a turning speaker, its top doubled a few cents apart.',
    preview: CANON_SIX,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { release: 0.6, vibrato: 0.45, volume: -6.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'stereo-detune', preset: 'Top only', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-follows-six-beats-under',
    name: 'Follows six beats under',
    category: 'wind',
    description:
      'A breath of concert flute with its attacks blurred into a dark cloud, turned slowly by a low drum speaker.',
    preview: CANON_SIX,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { type: 0, attack: 0.3, release: 1.4, blow: 0.1, breath: 0.7, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank', params: { size: 220 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },

  // Reeds: clarinet, soprano, double reed, alto, section and tenor, each with its shadow.
  {
    id: 'twelve-notes-two-modes-reed-with-the-sash-up',
    name: 'Reed with the sash up',
    category: 'wind',
    description:
      'A clarinet blown open and bright with a little vibrato, its air spread to the sides, on a short plate.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { vibrato: 0.2, release: 0.5, volume: 4.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Air only' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-reed-with-the-sash-down',
    name: 'Reed with the sash down',
    category: 'wind',
    description:
      'A clarinet at a hum, filtered steeply from 600 Hz up, in a dark hall of three to four seconds.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.25, breath: 0.3, release: 2.2, volume: -6 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 600 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-soprano-half-of-twelve',
    name: 'Soprano half of twelve',
    category: 'wind',
    description:
      'A bright soprano reed with the air round it brought forward, and faint tape echoes behind it.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { release: 0.8, vibrato: 0.35, volume: -0.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air', params: { amount: 0.7, output: -2 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-tenor-half-of-twelve',
    name: 'Tenor half of twelve',
    category: 'wind',
    description:
      'A breathy subtone tenor with a little growl, through a dark woolly stack, on cassette, one dark spring behind it.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.1, breath: 0.8, growl: 0.25, release: 1.5, volume: -6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.12 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-double-reed-lit-wires',
    name: 'Double reed, lit wires',
    category: 'wind',
    description:
      'A double reed blown firmly with a singing vibrato, sixteen strings tuned to C Lydian ringing along with it.',
    preview: BRIGHT_OVER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { blow: 0.75, breath: 0.22, vibrato: 0.7, release: 0.9, volume: -3 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 7, mode: 0, sympathy: 0.8, strings: 12, decay: 5, mix: 0.5, width: 0.9 },
      },
    ],
  },
  {
    id: 'twelve-notes-two-modes-double-reed-dark-wires',
    name: 'Double reed, dark wires',
    category: 'wind',
    description:
      'A faint double reed that swells in and shakes, over strings tuned to C Phrygian, some steps away in a small room.',
    preview: DARK_OVER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { blow: 0.06, attack: 0.6, release: 3, vibrato: 1, breath: 0.75, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 5, mode: 1, sympathy: 0.6, strings: 6, decay: 3, mix: 0.4, width: 0.3 },
      },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-alto-that-lifts-its-f',
    name: 'Alto that lifts its F',
    category: 'wind',
    description:
      'An alto reed with a quick chorus round it, throwing off sparks an octave and more above as it sings.',
    preview: BRIGHT_OVER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { blow: 0.85, breath: 0.35, vibrato: 0.5, volume: 4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.5 } },
      { deviceId: 'glints', preset: 'First light', params: { density: 9, mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-alto-that-sinks-its-d',
    name: 'Alto that sinks its D',
    category: 'wind',
    description:
      'A wavering alto reed, hardly blown, with a slow tail that sags in pitch and dulls behind each note.',
    preview: DARK_OVER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { bore: 0.6, blow: 0.08, attack: 0.5, breath: 0.55, volume: 1 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2600 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-section-turned-upward',
    name: 'Section turned upward',
    category: 'wind',
    description:
      'A hollow reed section with a strong octave stop and a little fifteenth over it, in a small bright chamber.',
    preview: CANON_SIX,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.85, attack: 0.09, release: 0.8, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Octave above',
        params: { fifteenth: 0.3, tone: 0.6, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-section-turned-downward',
    name: 'Section turned downward',
    category: 'wind',
    description:
      'A reed section swelling out of nothing, doubled an octave below, its attacks blurred with no tail.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.15, attack: 0.7, breath: 0.75, blow: 0.25, release: 2, volume: -2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.9, filter: 700 } },
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 260, mix: 0.8 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-flutter-above-the-axis',
    name: 'Flutter above the axis',
    category: 'wind',
    description:
      'A flutter-tongued reed whose echoes land closer and closer together like a ball on glass.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { blow: 0.8, growl: 0.55, breath: 0.25, attack: 0.06, release: 0.5, volume: 3 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.32 } }],
  },
  {
    id: 'twelve-notes-two-modes-growl-below-the-axis',
    name: 'Growl below the axis',
    category: 'wind',
    description:
      'A low growling reed with plenty of breath, swept by a very slow phaser and wrapped in a dark fuzzy blur.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { blow: 0.25, growl: 0.8, breath: 0.75, attack: 0.3, release: 1.4, volume: 1.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.08 } },
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.3, decay: 4 } },
    ],
  },

  // Bars: marimba, vibraphone, xylophone, bells and celesta by day and by night, and one for both hands.
  {
    id: 'twelve-notes-two-modes-bars-climbing-out-of-c',
    name: 'Bars climbing out of C',
    category: 'bell',
    description:
      'A marimba with hard mallets and half its tubes shut, its strokes evened out, each answered once by a faint copy.',
    preview: SCALES_OPEN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.8, decay: 1.2, resonator: 0.35, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 3 } },
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 0.36, mix: 0.28 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-bars-falling-out-of-g',
    name: 'Bars falling out of G',
    category: 'bell',
    description:
      'A marimba with the softest mallets, ringing long, over five singing bowls tuned to C and G.',
    preview: SCALES_CLOSE,
    instrument: { deviceId: 'mallets', preset: 'Humming marimba', params: { volume: -7.5 } },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 0,
          scale: 4,
          bowls: 5,
          register: 0.3,
          ring: 20,
          strike: 0.3,
          metal: 0.25,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'twelve-notes-two-modes-vibes-lamp-switched-on',
    name: 'Vibes, lamp switched on',
    category: 'bell',
    description:
      'A vibraphone with firm mallets and no motor, its partials twinkling, on a long clear plate.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.75, decay: 2.2, damper: 0.2, volume: -12 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-vibes-lamp-switched-off',
    name: 'Vibes, lamp switched off',
    category: 'bell',
    description:
      'A muffled vibraphone under soft mallets, its motor throbbing once a second, at the back of a large hall.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { mallet: 0.05, decay: 1.6, volume: -8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500 } },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-dry-rungs-of-lydian',
    name: 'Dry rungs of Lydian',
    category: 'bell',
    description:
      'A hard dry xylophone with a chirp on every note, its bands let through in turn within a tenth of a second.',
    preview: SCALES_OPEN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 1, resonator: 0.5, volume: 1.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Short chirp', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-soft-rungs-of-phrygian',
    name: 'Soft rungs of Phrygian',
    category: 'bell',
    description:
      'A xylophone rolled with soft mallets inside a wooden soundboard, set well back in a middling room.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { mallet: 0.08, roll: 9, volume: -5.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.75 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-twelve-bells-by-daylight',
    name: 'Twelve bells by daylight',
    category: 'bell',
    description:
      'Bells over full tubes, five faint bright echoes scattered across two and a half seconds behind them.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.6, decay: 1.2, volume: -6 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.3 } }],
  },
  {
    id: 'twelve-notes-two-modes-twelve-bells-by-candle',
    name: 'Twelve bells by candle',
    category: 'bell',
    description:
      'A slow glockenspiel roll dropped an octave, its partials stretched a little, in a huge open valley.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 5, mallet: 0.15, volume: -1 },
    },
    effects: [
      { deviceId: 'size', preset: 'Octave below' },
      { deviceId: 'warp', preset: 'Soft chime', params: { tone: -0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-celesta-near-mirror',
    name: 'Celesta, near mirror',
    category: 'bell',
    description:
      'A celesta with firm hammers and little damping, its tail climbing in fifths and octaves.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.65, damper: 0.25, decay: 1.4, volume: -11 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { interval: 2, mix: 0.35 } },
      { deviceId: 'ambient-eq', params: { lowCut: 180, presence: 2 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-celesta-far-mirror',
    name: 'Celesta, far mirror',
    category: 'bell',
    description:
      'A celesta with a fast shudder, followed by murky echoes nearly a second apart on a dull old record.',
    preview: DARK_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { mallet: 0.2, volume: -4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.42 } },
      {
        deviceId: 'vinyl',
        preset: 'Dull stylus',
        params: { crackle: 0.08, pops: 0, surface: 0.1 },
      },
    ],
  },
  {
    id: 'twelve-notes-two-modes-both-hands-one-hinge',
    name: 'Both hands, one hinge',
    category: 'bell',
    description:
      'A vibraphone with its motor running, faintly doubled, all of it swinging slowly from ear to ear.',
    preview: CANON_FOUR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.35, decay: 0.8, damper: 0.6, volume: -3 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },

  // Voices: open vowels in the bright mode, closed ones in the dark.
  {
    id: 'twelve-notes-two-modes-ah-with-a-lifted-f',
    name: 'Ah with a lifted F',
    category: 'voice',
    description:
      'An open Ah let partly through a filter of the C Lydian scale, in a bright hall that keeps its top.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { tone: 11000, motion: 0.1, attack: 0.4, release: 1.5 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        params: { root: 0, scale: 5, width: 50, depth: 24, ring: 0.4, mix: 0.65 },
      },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-oh-with-a-sunken-d',
    name: 'Oh with a sunken D',
    category: 'voice',
    description:
      'Low Oh voices let through only on the notes of C Phrygian, ringing two seconds, in a deep dark cathedral.',
    preview: DARK_CHORDS,
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { attack: 0.8, release: 3 } },
    effects: [
      {
        deviceId: 'scale-filter',
        params: { root: 0, scale: 4, width: 22, depth: 38, ring: 2, high: 2500 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 9, mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-trebles-leave-by-the-top',
    name: 'Trebles leave by the top',
    category: 'voice',
    description:
      'High drifting voices whose upper bands swell and wander from side to side, on a long plate.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { motion: 0.5, attack: 0.4, release: 2.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Shimmer on top' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-basses-under-the-floor',
    name: 'Basses under the floor',
    category: 'voice',
    description:
      'Dark basses on Ah with slow pedals an octave under them, in a hall that sings back with low vowels.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { attack: 0.6, release: 2.4, tone: 2200 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0, sub1: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 6, mix: 0.35 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-ee-against-the-glass',
    name: 'Ee against the glass',
    category: 'voice',
    description:
      'A thin bright Ee with no vibrato of its own, made to shimmer wide once each chord has settled, in bright air.',
    preview: BRIGHT_CHORDS,
    instrument: { deviceId: 'choir', preset: 'Glass ee', params: { attack: 0.6, release: 2.5 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Wide shimmer', params: { depth: 20, mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-oo-against-the-stone',
    name: 'Oo against the stone',
    category: 'voice',
    description:
      'A closed hum with its top gone, opened and shut by slow breaths, in a stone stairwell.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { tone: 1000, attack: 0.6, vowel: 1 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Dark lungs', params: { depth: 0.35, in: 2.4, out: 3 } },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-one-singer-up-the-stair',
    name: 'One singer up the stair',
    category: 'voice',
    description:
      'A single voice on Ah with the vibrato arriving late, and a short soft tape echo under it.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -5.5, vibrato: 8, voice: 1.28, tone: 9000 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 45 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-one-singer-down-the-well',
    name: 'One singer down the well',
    category: 'voice',
    description:
      'A single dark Oh at the mouth of a well, its sound broken into a swarm of short dull echoes.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        volume: -3,
        vowel: 0.8,
        voice: 0.9,
        tone: 2200,
        vibrato: 6,
        attack: 0.25,
        release: 1.6,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well' }],
  },
  {
    id: 'twelve-notes-two-modes-third-line-two-notes',
    name: 'Third line, two notes',
    category: 'voice',
    description:
      'Altos on Eh with a swaying vibrato, doubled wide a few cents apart, and a short close plate.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -3, attack: 0.12, release: 0.7, vibrato: 20 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-breath-over-a-bare-fifth',
    name: 'Breath over a bare fifth',
    category: 'voice',
    description:
      'Sung breath, dark and slow, let through mostly on the tones each moment shares with the one before.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { vowel: 0.85, tone: 3500, attack: 0.3, release: 2, breath: 0.7 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.75 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },

  // Magnet piano: harmonics of the string in the light, the bare string and the case in the dark.
  {
    id: 'twelve-notes-two-modes-magnets-on-the-octave',
    name: 'Magnets on the octave',
    category: 'keys',
    description:
      'Strings sung by magnets on their second harmonic, blooming in under a second, over a faint plate.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { bloom: 0.7, bright: 0.3, damper: 2 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
      { deviceId: 'glimmer', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-magnets-on-the-case',
    name: 'Magnets on the case',
    category: 'keys',
    description:
      'Low sung strings in a heavy wooden case, pushed into a transformer until they thicken, with a soft top.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { volume: -14, bloom: 0.4, hammer: 0.2, bright: 0.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-third-harmonic-sunward',
    name: 'Third harmonic, sunward',
    category: 'organ',
    description:
      'Strings sung on the twelfth, quick as organ pipes, with another twelfth and a fifteenth of a pipe rank above.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.1, shimmer: 0.4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Glass on top', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-first-harmonic-leeward',
    name: 'First harmonic, leeward',
    category: 'pad',
    description:
      'Pure still sines from sung strings that take time to bloom, wandering slowly nearer and farther.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { volume: -13.5, bloom: 1.1, damper: 3, body: 0.3, width: 0.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Slow tide' },
      { deviceId: 'freq-shifter', preset: 'Still water' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-sweep-across-the-sharps',
    name: 'Sweep across the sharps',
    category: 'keys',
    description:
      'Magnets running up and down the harmonics more than once a second, the ripple echoed in four bands.',
    preview: BRIGHT_LINE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { bloom: 0.12, bright: 0.35 },
    },
    effects: [{ deviceId: 'prism', preset: 'Four colours', params: { time: 520, mix: 0.35 } }],
  },
  {
    id: 'twelve-notes-two-modes-sweep-across-the-flats',
    name: 'Sweep across the flats',
    category: 'texture',
    description:
      'A slow tide of harmonics in the dark mode, stretched into a cloud and shut in by a glacial filter.',
    preview: DARK_DRONE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { volume: -10, bloom: 1.6, bright: 0.6, sweep: 0.8, damper: 4 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Dark drift', params: { mix: 0.5 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-felt-hammer-bright-ring',
    name: 'Felt hammer, bright ring',
    category: 'keys',
    description:
      'A felt hammer before each bloom, all the strings ringing in sympathy, and C Lydian wires behind them.',
    preview: SCALES_OPEN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ringing room',
      params: { volume: -11, bloom: 0.5, hammer: 1, damper: 2.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { root: 7, mode: 0, mix: 0.4 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-felt-hammer-dark-ring',
    name: 'Felt hammer, dark ring',
    category: 'keys',
    description:
      'A felt hammer and a late low bloom, played backwards in slow swells and cut off above by old tape.',
    preview: SCALES_CLOSE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { bloom: 1, bright: 0.3 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1000, mix: 0.45 } },
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-two-magnets-one-fifth',
    name: 'Two magnets, one fifth',
    category: 'keys',
    description:
      'A sung string that speaks and stops fast, so both voices of a canon stay clear, widened a little in a small booth.',
    preview: CANON_FOUR,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { bloom: 0.08, bright: 0.35, damper: 0.35, body: 0.3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },

  // Harp, koto and guzheng: right hand and left hand.
  {
    id: 'twelve-notes-two-modes-right-hand-in-lydian',
    name: 'Right hand in Lydian',
    category: 'plucked',
    description:
      'A concert harp plucked hard near the middle, its low end thinned, with slow bright sparks above it.',
    preview: SCALES_CLOSE,
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { volume: -1, sweep: 0, touch: 0.75, decay: 1.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 140, presence: 3, air: 3 } },
      { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.35, density: 2 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-left-hand-in-phrygian',
    name: 'Left hand in Phrygian',
    category: 'plucked',
    description:
      'A dark hollow harp, damped when the hand leaves it, heard through a wall from the next room.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 0, damp: 0.6, decay: 0.9 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-silver-string-upward',
    name: 'Silver string upward',
    category: 'plucked',
    description:
      'Steel strings plucked at the very end and held on as by a pedal, their attacks turned down, on a bright spring tank.',
    preview: BRIGHT_OVER,
    instrument: { deviceId: 'harp', preset: 'Steel shimmer', params: { volume: 5.5, decay: 1.5 } },
    effects: [
      { deviceId: 'sift', preset: 'Pedal down', params: { attacks: -16, soften: 0.2 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 4 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 2.5, mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-silk-string-downward',
    name: 'Silk string downward',
    category: 'plucked',
    description:
      'Soft silk strings pressed a little sharp after each pluck, pieces of each drooping flat again as they fade.',
    preview: DARK_OVER,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 6, bend: 30, touch: 0.3 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Wilting', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { highCut: 3500 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-cascade-to-the-octave',
    name: 'Cascade to the octave',
    category: 'plucked',
    description:
      'A guzheng rolling its chords in a cascade, each string doubled an octave up, an octave halo rising out of the tail.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { volume: 6, sweep: 0.7, decay: 1.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-cascade-to-the-cellar',
    name: 'Cascade to the cellar',
    category: 'plucked',
    description:
      'Slow rolled harp chords answered an octave down by falling repeats, in a narrow cellar.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -2.5, sweep: 0.9, touch: 0.1 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { feedback: 0.3, mix: 0.4 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-hands-that-meet-on-g',
    name: 'Hands that meet on G',
    category: 'plucked',
    description:
      'A muted harp sounded on a drum head, short and dry, a slow pan carrying the lines past each other.',
    preview: CANON_EIGHT,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: -4.5, damp: 0.6, touch: 0.45 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head' },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },

  // Bows: one player, two, four or six, on the bridge for the bright mode and muted for the dark.
  {
    id: 'twelve-notes-two-modes-violin-leaves-the-fifth',
    name: 'Violin leaves the fifth',
    category: 'string',
    description:
      'A close solo bow whose body has been made smaller, its vibrato arriving late, in a tight bright chamber.',
    preview: BRIGHT_OVER,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -4, bow: 0.65, vibrato: 4, release: 0.8 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.55 } },
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { depth: 28 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-viola-leaves-the-fifth',
    name: 'Viola leaves the fifth',
    category: 'string',
    description:
      'One wandering muted player, an unsteady bow with no vibrato, thickened and narrowed by worn tape.',
    preview: DARK_OVER,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { volume: -5.5, attack: 0.3, mute: 0.8, release: 1.2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1, wow: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-canon-in-slow-three-two',
    name: 'Canon in slow three-two',
    category: 'string',
    description:
      'Viols without vibrato, four to a line, warmed below and dulled above, a little wide in a deep cathedral.',
    preview: CANON_SIX,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { volume: 0, attack: 0.12, release: 0.5, mute: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-bridge-at-noon',
    name: 'Bridge at noon',
    category: 'string',
    description:
      'Three players close to the bridge, glassy and still, the faintest overtones turned up and rippling upward.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -2, attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.85 } },
      { deviceId: 'reveal', preset: 'Overtones', params: { output: -4 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 5, mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-mute-at-midnight',
    name: 'Mute at midnight',
    category: 'string',
    description:
      'Five muted players swelling in slowly, a low string pad growing behind them an octave under.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -3, attack: 0.9, release: 2.2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 2000 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-six-bows-two-lamps',
    name: 'Six bows, two lamps',
    category: 'string',
    description:
      'Six ragged players bowing hard and bright, hollowed by a slow chorus and carried round in a slow figure of eight.',
    preview: TWO_LIGHTS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { volume: -1, attack: 0.3, release: 0.9, mute: 0, bow: 0.85, air: 0.05 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.3 } },
      { deviceId: 'chorus', preset: 'Hollow swell' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-middle-voice-on-gut',
    name: 'Middle voice on gut',
    category: 'string',
    description:
      'A quiet muted duet set wide apart, close and nearly dry, each note eased in by a soft swell.',
    preview: THREE_VOICES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { volume: -5, bow: 0.2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 220 } },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } },
    ],
  },

  // Chord harp: the strum up in the bright mode, down or muffled in the dark.
  {
    id: 'twelve-notes-two-modes-strum-toward-the-sun',
    name: 'Strum toward the sun',
    category: 'plucked',
    description:
      'A quick bright strum upward through three octaves with no pad under it, clean even echoes and a small plate.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: 1, tone: 0.85, pad: 0, sustain: 2.2, strum: 25 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-strum-toward-the-wall',
    name: 'Strum toward the wall',
    category: 'plucked',
    description:
      'A dark strum downward through four octaves, played from a pillow speaker into a hall of long lows.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: -2.5, tone: 0.15, sustain: 5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-seven-panes-of-noon',
    name: 'Seven panes of noon',
    category: 'bell',
    description:
      'Bright chimes struck together with nothing between them, their tail climbing by fifths.',
    preview: BRIGHT_CHORDS,
    instrument: { deviceId: 'chord-harp', preset: 'Long glass chimes', params: { sustain: 3.5 } },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { decay: 5, mix: 0.3 } }],
  },
  {
    id: 'twelve-notes-two-modes-seven-panes-of-dusk',
    name: 'Seven panes of dusk',
    category: 'plucked',
    description:
      'A muffled slow strum on a worn dusty record, sagging a little in pitch as it hangs.',
    preview: DARK_CHORDS,
    instrument: { deviceId: 'chord-harp', preset: 'Muffled slow strum', params: { sustain: 4 } },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.45 } },
      { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.12, wobble: 0.5 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-sparks-off-a-sharp-four',
    name: 'Sparks off a sharp four',
    category: 'plucked',
    description:
      'Strings plucked in random order across four octaves, two wide echoes after each scatter of them.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Scattered glints',
      params: { volume: 3.5, tone: 0.7 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Wide pair' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 4 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-mattress-of-the-flat-two',
    name: 'Mattress of the flat two',
    category: 'pad',
    description:
      'A dark sustained pad with a slow strum sinking into it, a deep chorus, and surf drawing over it from a far shore.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow falling pad',
      params: { pad: 1, tone: 0.05, strum: 120 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Far shore', params: { exposure: 0.5 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-strum-one-then-its-twin',
    name: 'Strum one, then its twin',
    category: 'plucked',
    description:
      'A pad with a random sparkle of strings on top, its lows and highs throbbing in turn.',
    preview: TWO_LIGHTS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { volume: -7.5, pad: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },

  // Wind harp: which harmonics the wind lights.
  {
    id: 'twelve-notes-two-modes-wind-out-of-the-sharps',
    name: 'Wind out of the sharps',
    category: 'texture',
    description:
      'Single strings whistling on high harmonics with no hum beneath, two copies flying close by, in a bright chamber.',
    preview: BRIGHT_DRONE,
    instrument: { deviceId: 'wind-harp', preset: 'Glass whistle', params: { ring: 2.5 } },
    effects: [
      { deviceId: 'expanse', preset: 'Bright chamber' },
      { deviceId: 'murmuration', preset: 'Two close by' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-wind-out-of-the-flats',
    name: 'Wind out of the flats',
    category: 'drone',
    description:
      'Strings that mostly hum, standing in a stopped metal pipe that rings with them, an organ pedal stop following an octave under.',
    preview: DARK_DRONE,
    instrument: { deviceId: 'wind-harp', preset: 'Low hum', params: { release: 3 } },
    effects: [
      { deviceId: 'vessel', preset: 'Metal drone', params: { mix: 0.65 } },
      { deviceId: 'stops', preset: 'Pedal under' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-wires-facing-south',
    name: 'Wires facing south',
    category: 'drone',
    description:
      'Humming fence wires in gusts, their quiet overtones turned up and spread apart by a very slow chorus.',
    preview: BRIGHT_DRONE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { volume: 2.5, hum: 0.4, glint: 1, ring: 3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'reveal', preset: 'Overtones', params: { output: -3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-wires-facing-north',
    name: 'Wires facing north',
    category: 'texture',
    description:
      'Night wind with more air than tone, swelling and sinking in three broad bands, in a dark hall.',
    preview: DARK_DRONE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { volume: -7, air: 0.6, hum: 0.4, wind: 0.4, lull: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-course-lit-from-above',
    name: 'Course lit from above',
    category: 'texture',
    description:
      'Four strings to every note shimmering without a lull, a wide slow phaser turning through them, on a dark plate.',
    preview: BRIGHT_DRONE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { volume: 1.5, glint: 1, air: 0.1 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-course-lit-from-below',
    name: 'Course lit from below',
    category: 'drone',
    description: 'A slow swell of strings with the same strings half as fast an octave under them.',
    preview: DARK_DRONE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { glint: 0.35, ring: 6, gust: 0.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.5 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 900 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-wind-across-one-hinge',
    name: 'Wind across one hinge',
    category: 'plucked',
    description:
      'Strings plucked as each chord is touched and left to ring, over three still bowls tuned to C and G.',
    preview: TWO_LIGHTS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -14.5, ring: 1.6, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Centre three',
        params: { root: 0, ring: 10, beat: 0, mix: 0.4 },
      },
    ],
  },

  // Felt piano: lid open, lid closed.
  {
    id: 'twelve-notes-two-modes-lid-open-on-lydian',
    name: 'Lid open on Lydian',
    category: 'keys',
    description:
      'A piano with the felt lifted and its strings ringing, every note thickened by a close copy on each side.',
    preview: BRIGHT_OVER,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -11.5, felt: 0.05, hardness: 0.65, detune: 0.2 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { air: 3 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-lid-closed-on-phrygian',
    name: 'Lid closed on Phrygian',
    category: 'keys',
    description: 'A soft thud of full felt and no hammer edge, held on by a dim pad of itself.',
    preview: DARK_OVER,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -8, thump: 0.5, resonance: 0.7 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Dark bed',
        params: { attack: 0.4, decay: 4, glide: 0.3, mix: 0.45 },
      },
    ],
  },
  {
    id: 'twelve-notes-two-modes-glass-hammers-going-out',
    name: 'Glass hammers going out',
    category: 'keys',
    description:
      'A stiff glassy upright with hard hammers, its lows and very top trimmed, its notes skipping away over water.',
    preview: SCALES_OPEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -8, reverbMix: 0.15 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 120, highCut: 9000 } },
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-old-hammers-coming-in',
    name: 'Old hammers coming in',
    category: 'keys',
    description:
      'An out of tune upright with a noisy action, played off a fast old record through a small speaker.',
    preview: SCALES_CLOSE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -12, felt: 0.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.08, surface: 0.1 } },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-eight-beats-between-them',
    name: 'Eight beats between them',
    category: 'keys',
    description:
      'A lean piano at half pedal, pressed level by a slow compressor, each hand clear of the other.',
    preview: CANON_EIGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { felt: 0.3, sustain: 0.2, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys', params: { threshold: -30, makeup: 3 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },

  // Thesis: filtered noise reflected inside the scale itself.
  {
    id: 'twelve-notes-two-modes-reflected-in-raised-air',
    name: 'Reflected in raised air',
    category: 'pad',
    description:
      'Strummed bands of noise reflected about a centre inside C Lydian, pushed into a limiter, on a bright plate.',
    preview: BRIGHT_OVER,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { center: 66, release: 0.8, strum: 40 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 12, outputGain: -4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-reflected-in-sunken-air',
    name: 'Reflected in sunken air',
    category: 'pad',
    description:
      'Soft bands of noise reflected inside C Phrygian, drifting, through a warm amplifier stack and slow compression.',
    preview: DARK_OVER,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { root: 0, center: 60, attack: 0.25, release: 2, resonance: 40 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: 0 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 10 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-glass-seven-notes-wide',
    name: 'Glass, seven notes wide',
    category: 'pad',
    description:
      'Narrow glassy bands breathing slowly in C Lydian, each one thrown wide with a hazy edge.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { scale: 6, attack: 0.5, release: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 5.5 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-ash-seven-notes-deep',
    name: 'Ash, seven notes deep',
    category: 'texture',
    description:
      'A full stack of five reflections in C Phrygian pushed down on magnetic tape, dark and slow to go.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { scale: 5, resonance: 22, attack: 0.6, release: 3, center: 55 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { tone: 0.2, output: -8.5 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 2.2, mix: 0.35 } },
    ],
  },

  // Rewind: notes that arrive backwards.
  {
    id: 'twelve-notes-two-modes-arrives-on-the-f-sharp',
    name: 'Arrives on the F sharp',
    category: 'bell',
    description:
      'Bells swelling up from nothing for most of a second to land on their strike, with a trail of overtones.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 3.5, swell: 0.8, tone: 0.8 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-arrives-on-the-d-flat',
    name: 'Arrives on the D flat',
    category: 'bell',
    description:
      'Bowls gathering for more than a second, dull and beating, in a narrow tunnel with no air at the top.',
    preview: DARK_CHORDS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: 4.5, swell: 1.2, tone: 0.25, shimmer: 0.6 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-answer-before-question',
    name: 'Answer before question',
    category: 'plucked',
    description:
      'Short backward plucks that stop as they land, each repeated backwards again from the side.',
    preview: CANON_EIGHT,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: -1, swell: 0.25, tail: 0.25 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Flicker', params: { time: 210, mix: 0.35 } },
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.3 } },
    ],
  },

  // Feedback: a string that sings its own overtone.
  {
    id: 'twelve-notes-two-modes-string-held-to-the-light',
    name: 'String held to the light',
    category: 'string',
    description:
      'Strings caught by feedback and pulled to a pure twelfth above, wide, half a second in blooming, with an airy tail.',
    preview: BRIGHT_DRONE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { volume: -3.5, bloom: 0.6, release: 3, width: 1 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
      { deviceId: 'tamer', preset: 'Ringing tones' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-string-held-to-the-floor',
    name: 'String held to the floor',
    category: 'string',
    description:
      'A dark string sustaining on its own note with a soft pick, with a narrow warm spring and more low end.',
    preview: DARK_LOW,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { volume: -13.5, release: 0.6, pick: 0.4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'twelve-notes-two-modes-both-wires-one-speaker',
    name: 'Both wires, one speaker',
    category: 'string',
    description:
      'A reedy feedback string that lets go at once, both of its lines heard through one combo in a room.',
    preview: SCALES_OPEN,
    instrument: {
      deviceId: 'feedback',
      preset: 'Reed tone',
      params: { crowd: 0, grit: 0.4, release: 0.4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
    ],
  },

  // Droplets: the chord as rain.
  {
    id: 'twelve-notes-two-modes-rain-on-the-lit-side',
    name: 'Rain on the lit side',
    category: 'texture',
    description:
      'Small metal bells raining on the bright chords across two octaves, each drop flickering to a close echo.',
    preview: BRIGHT_CHORDS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { rain: 5, trail: 1, ring: 1.2 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.35 } }],
  },
  {
    id: 'twelve-notes-two-modes-rain-on-the-dark-side',
    name: 'Rain on the dark side',
    category: 'texture',
    description:
      'Big drops into a deep pool on the dark chords, three a second, heard from just under the water in a dark hall.',
    preview: DARK_CHORDS,
    instrument: { deviceId: 'droplets', preset: 'Deep pool', params: { rain: 3, trail: 1 } },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { depth: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'twelve-notes-two-modes-rain-on-both-halves',
    name: 'Rain on both halves',
    category: 'texture',
    description:
      'An even pulse of wooden drops that passes from each chord to its mirror, weaving between two gates.',
    preview: TWO_LIGHTS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: -1.5, rain: 8, trail: 0.1 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift', params: { mix: 0.6 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.3 } },
    ],
  },
]
