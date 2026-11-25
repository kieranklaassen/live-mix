import { type FactoryPreset, type Phrase } from '../types'

// Sequences that land a step lower each time: falling fifths with a chain of sevenths, falling
// thirds over a scale, and the two ways back up. Piano, strings, organ, harp and tines, each laid
// out from close and clear to far and held, with a plucked bass under them. All white keys.

// A D G C F B E A, a seventh chord on each, in four parts: the third of each chord is tied over
// and is the seventh of the next.
const CHAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.75, note: 64, gain: 0.38 },
    { atSec: 0, durSec: 0.75, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 72, gain: 0.48 },
    { atSec: 0.75, durSec: 0.75, note: 50, gain: 0.5 },
    { atSec: 0.75, durSec: 1.5, note: 62, gain: 0.38 },
    { atSec: 0.75, durSec: 1.5, note: 65, gain: 0.4 },
    { atSec: 1.5, durSec: 0.75, note: 43, gain: 0.5 },
    { atSec: 1.5, durSec: 1.5, note: 71, gain: 0.48 },
    { atSec: 2.25, durSec: 0.75, note: 48, gain: 0.5 },
    { atSec: 2.25, durSec: 1.5, note: 60, gain: 0.38 },
    { atSec: 2.25, durSec: 1.5, note: 64, gain: 0.4 },
    { atSec: 3, durSec: 0.75, note: 41, gain: 0.5 },
    { atSec: 3, durSec: 1.5, note: 69, gain: 0.48 },
    { atSec: 3.75, durSec: 0.75, note: 47, gain: 0.5 },
    { atSec: 3.75, durSec: 1.5, note: 59, gain: 0.38 },
    { atSec: 3.75, durSec: 1.5, note: 62, gain: 0.4 },
    { atSec: 4.5, durSec: 0.75, note: 40, gain: 0.5 },
    { atSec: 4.5, durSec: 1.85, note: 67, gain: 0.48 },
    { atSec: 5.25, durSec: 1.1, note: 45, gain: 0.5 },
    { atSec: 5.25, durSec: 1.1, note: 57, gain: 0.38 },
    { atSec: 5.25, durSec: 1.1, note: 60, gain: 0.4 },
  ],
}

// The first half, slowly: Am7 Dm7 G7 Cmaj7, with every note two chords share held through.
const WAY_OUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 1.4, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.4, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 2.8, note: 72, gain: 0.46 },
    { atSec: 1.4, durSec: 1.4, note: 50, gain: 0.5 },
    { atSec: 1.4, durSec: 2.8, note: 62, gain: 0.4 },
    { atSec: 1.4, durSec: 2.8, note: 65, gain: 0.4 },
    { atSec: 2.8, durSec: 1.4, note: 43, gain: 0.5 },
    { atSec: 2.8, durSec: 3.4, note: 71, gain: 0.46 },
    { atSec: 4.2, durSec: 2, note: 48, gain: 0.5 },
    { atSec: 4.2, durSec: 2, note: 60, gain: 0.4 },
    { atSec: 4.2, durSec: 2, note: 64, gain: 0.4 },
  ],
}

// The second half, slowly: Fmaj7, B half diminished, Em7, Am7, landing where the chain began.
const WAY_HOME: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 1.4, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.4, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 2.8, note: 69, gain: 0.46 },
    { atSec: 1.4, durSec: 1.4, note: 47, gain: 0.5 },
    { atSec: 1.4, durSec: 2.8, note: 59, gain: 0.4 },
    { atSec: 1.4, durSec: 2.8, note: 62, gain: 0.4 },
    { atSec: 2.8, durSec: 1.4, note: 40, gain: 0.5 },
    { atSec: 2.8, durSec: 3.4, note: 67, gain: 0.46 },
    { atSec: 4.2, durSec: 2, note: 45, gain: 0.5 },
    { atSec: 4.2, durSec: 2, note: 57, gain: 0.4 },
    { atSec: 4.2, durSec: 2, note: 60, gain: 0.4 },
  ],
}

// The same chain, each chord broken upward from its root and every voice struck again.
const BROKEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.72, note: 45, gain: 0.5 },
    { atSec: 0.17, durSec: 0.72, note: 64, gain: 0.36 },
    { atSec: 0.34, durSec: 0.72, note: 67, gain: 0.38 },
    { atSec: 0.51, durSec: 0.72, note: 72, gain: 0.46 },
    { atSec: 0.74, durSec: 0.72, note: 50, gain: 0.5 },
    { atSec: 0.91, durSec: 0.72, note: 62, gain: 0.36 },
    { atSec: 1.08, durSec: 0.72, note: 65, gain: 0.38 },
    { atSec: 1.25, durSec: 0.72, note: 72, gain: 0.46 },
    { atSec: 1.48, durSec: 0.72, note: 43, gain: 0.5 },
    { atSec: 1.65, durSec: 0.72, note: 62, gain: 0.36 },
    { atSec: 1.82, durSec: 0.72, note: 65, gain: 0.38 },
    { atSec: 1.99, durSec: 0.72, note: 71, gain: 0.46 },
    { atSec: 2.22, durSec: 0.72, note: 48, gain: 0.5 },
    { atSec: 2.39, durSec: 0.72, note: 60, gain: 0.36 },
    { atSec: 2.56, durSec: 0.72, note: 64, gain: 0.38 },
    { atSec: 2.73, durSec: 0.72, note: 71, gain: 0.46 },
    { atSec: 2.96, durSec: 0.72, note: 41, gain: 0.5 },
    { atSec: 3.13, durSec: 0.72, note: 60, gain: 0.36 },
    { atSec: 3.3, durSec: 0.72, note: 64, gain: 0.38 },
    { atSec: 3.47, durSec: 0.72, note: 69, gain: 0.46 },
    { atSec: 3.7, durSec: 0.72, note: 47, gain: 0.5 },
    { atSec: 3.87, durSec: 0.72, note: 59, gain: 0.36 },
    { atSec: 4.04, durSec: 0.72, note: 62, gain: 0.38 },
    { atSec: 4.21, durSec: 0.72, note: 69, gain: 0.46 },
    { atSec: 4.44, durSec: 0.72, note: 40, gain: 0.5 },
    { atSec: 4.61, durSec: 0.72, note: 59, gain: 0.36 },
    { atSec: 4.78, durSec: 0.72, note: 62, gain: 0.38 },
    { atSec: 4.95, durSec: 0.72, note: 67, gain: 0.46 },
    { atSec: 5.18, durSec: 1.6, note: 45, gain: 0.5 },
    { atSec: 5.35, durSec: 1.43, note: 57, gain: 0.36 },
    { atSec: 5.52, durSec: 1.26, note: 60, gain: 0.38 },
    { atSec: 5.69, durSec: 1.09, note: 67, gain: 0.46 },
  ],
}

// Falling thirds in three parts: C G/B Am Em/G F C/E Dm G C over a scale, with the top voice in
// thirds with the bass, two octaves over it.
const THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.62, note: 48, gain: 0.48 },
    { atSec: 0, durSec: 0.62, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 1.24, note: 67, gain: 0.38 },
    { atSec: 0.62, durSec: 0.62, note: 47, gain: 0.48 },
    { atSec: 0.62, durSec: 0.62, note: 74, gain: 0.5 },
    { atSec: 1.24, durSec: 0.62, note: 45, gain: 0.48 },
    { atSec: 1.24, durSec: 0.62, note: 72, gain: 0.5 },
    { atSec: 1.24, durSec: 1.24, note: 64, gain: 0.38 },
    { atSec: 1.86, durSec: 0.62, note: 43, gain: 0.48 },
    { atSec: 1.86, durSec: 0.62, note: 71, gain: 0.5 },
    { atSec: 2.48, durSec: 0.62, note: 41, gain: 0.48 },
    { atSec: 2.48, durSec: 0.62, note: 69, gain: 0.5 },
    { atSec: 2.48, durSec: 1.24, note: 60, gain: 0.38 },
    { atSec: 3.1, durSec: 0.62, note: 40, gain: 0.48 },
    { atSec: 3.1, durSec: 0.62, note: 67, gain: 0.5 },
    { atSec: 3.72, durSec: 0.62, note: 38, gain: 0.48 },
    { atSec: 3.72, durSec: 0.62, note: 57, gain: 0.38 },
    { atSec: 3.72, durSec: 0.62, note: 65, gain: 0.5 },
    { atSec: 4.34, durSec: 0.62, note: 43, gain: 0.48 },
    { atSec: 4.34, durSec: 0.62, note: 59, gain: 0.38 },
    { atSec: 4.34, durSec: 0.62, note: 62, gain: 0.5 },
    { atSec: 4.96, durSec: 1.4, note: 48, gain: 0.48 },
    { atSec: 4.96, durSec: 1.4, note: 60, gain: 0.38 },
    { atSec: 4.96, durSec: 1.4, note: 64, gain: 0.5 },
  ],
}

// C Am F Dm, each root a third under the last and most of the chord left where it was, then G and
// the first C again.
const THIRDS_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2.1, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.05, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 3.15, note: 72, gain: 0.46 },
    { atSec: 1.05, durSec: 1.05, note: 45, gain: 0.5 },
    { atSec: 1.05, durSec: 3.15, note: 69, gain: 0.4 },
    { atSec: 2.1, durSec: 1.05, note: 41, gain: 0.5 },
    { atSec: 2.1, durSec: 2.1, note: 65, gain: 0.4 },
    { atSec: 3.15, durSec: 1.05, note: 38, gain: 0.5 },
    { atSec: 3.15, durSec: 1.05, note: 74, gain: 0.46 },
    { atSec: 4.2, durSec: 1.05, note: 43, gain: 0.5 },
    { atSec: 4.2, durSec: 1.05, note: 62, gain: 0.4 },
    { atSec: 4.2, durSec: 2.4, note: 67, gain: 0.4 },
    { atSec: 4.2, durSec: 1.05, note: 71, gain: 0.46 },
    { atSec: 5.25, durSec: 1.35, note: 48, gain: 0.5 },
    { atSec: 5.25, durSec: 1.35, note: 64, gain: 0.4 },
    { atSec: 5.25, durSec: 1.35, note: 72, gain: 0.46 },
  ],
}

// Rising steps, five to six: C Am/C Dm Bdim/D Em C/E F Dm/F, then G and C.
const FIVE_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.54, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 1.08, note: 48, gain: 0.48 },
    { atSec: 0, durSec: 1.08, note: 64, gain: 0.4 },
    { atSec: 0.54, durSec: 1.08, note: 69, gain: 0.5 },
    { atSec: 1.08, durSec: 1.08, note: 50, gain: 0.48 },
    { atSec: 1.08, durSec: 1.08, note: 65, gain: 0.4 },
    { atSec: 1.62, durSec: 1.08, note: 71, gain: 0.5 },
    { atSec: 2.16, durSec: 1.08, note: 52, gain: 0.48 },
    { atSec: 2.16, durSec: 1.08, note: 67, gain: 0.4 },
    { atSec: 2.7, durSec: 1.08, note: 72, gain: 0.5 },
    { atSec: 3.24, durSec: 1.08, note: 53, gain: 0.48 },
    { atSec: 3.24, durSec: 1.08, note: 69, gain: 0.4 },
    { atSec: 3.78, durSec: 1.08, note: 74, gain: 0.5 },
    { atSec: 4.32, durSec: 0.54, note: 55, gain: 0.48 },
    { atSec: 4.32, durSec: 0.54, note: 71, gain: 0.4 },
    { atSec: 4.86, durSec: 1.4, note: 48, gain: 0.48 },
    { atSec: 4.86, durSec: 1.4, note: 72, gain: 0.4 },
    { atSec: 4.86, durSec: 1.4, note: 76, gain: 0.5 },
  ],
}

// The other way: roots a fifth up and a fourth down, F C G Dm Am Em, one upper voice falling as
// the other rises; then a fifth down to Am.
const FIFTHS_UP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.84, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 0.84, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 0.84, note: 69, gain: 0.48 },
    { atSec: 0.84, durSec: 0.84, note: 48, gain: 0.5 },
    { atSec: 0.84, durSec: 0.84, note: 64, gain: 0.42 },
    { atSec: 0.84, durSec: 0.84, note: 67, gain: 0.48 },
    { atSec: 1.68, durSec: 0.84, note: 43, gain: 0.5 },
    { atSec: 1.68, durSec: 0.84, note: 62, gain: 0.42 },
    { atSec: 1.68, durSec: 0.84, note: 71, gain: 0.48 },
    { atSec: 2.52, durSec: 0.84, note: 50, gain: 0.5 },
    { atSec: 2.52, durSec: 0.84, note: 65, gain: 0.42 },
    { atSec: 2.52, durSec: 0.84, note: 69, gain: 0.48 },
    { atSec: 3.36, durSec: 0.84, note: 45, gain: 0.5 },
    { atSec: 3.36, durSec: 0.84, note: 64, gain: 0.42 },
    { atSec: 3.36, durSec: 0.84, note: 72, gain: 0.48 },
    { atSec: 4.2, durSec: 0.84, note: 52, gain: 0.5 },
    { atSec: 4.2, durSec: 0.84, note: 67, gain: 0.42 },
    { atSec: 4.2, durSec: 0.84, note: 71, gain: 0.48 },
    { atSec: 5.04, durSec: 1.4, note: 45, gain: 0.5 },
    { atSec: 5.04, durSec: 1.4, note: 64, gain: 0.42 },
    { atSec: 5.04, durSec: 1.4, note: 72, gain: 0.48 },
  ],
}

// The sevenths as a tune, one note at a time: each third is held, the next chord is broken under it
// up to the same note, now a seventh, and it falls a step. A to A with no bass.
const SIGHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.72, note: 72, gain: 0.52 },
    { atSec: 0.75, durSec: 0.24, note: 65, gain: 0.38 },
    { atSec: 1, durSec: 0.24, note: 69, gain: 0.4 },
    { atSec: 1.25, durSec: 0.24, note: 72, gain: 0.46 },
    { atSec: 1.5, durSec: 0.72, note: 71, gain: 0.52 },
    { atSec: 2.25, durSec: 0.24, note: 64, gain: 0.38 },
    { atSec: 2.5, durSec: 0.24, note: 67, gain: 0.4 },
    { atSec: 2.75, durSec: 0.24, note: 71, gain: 0.46 },
    { atSec: 3, durSec: 0.72, note: 69, gain: 0.52 },
    { atSec: 3.75, durSec: 0.24, note: 62, gain: 0.38 },
    { atSec: 4, durSec: 0.24, note: 65, gain: 0.4 },
    { atSec: 4.25, durSec: 0.24, note: 69, gain: 0.46 },
    { atSec: 4.5, durSec: 0.72, note: 67, gain: 0.5 },
    { atSec: 5.25, durSec: 0.24, note: 64, gain: 0.38 },
    { atSec: 5.5, durSec: 0.24, note: 60, gain: 0.4 },
    { atSec: 5.75, durSec: 0.24, note: 59, gain: 0.42 },
    { atSec: 6, durSec: 0.9, note: 57, gain: 0.48 },
  ],
}

// Only root, third and seventh, high: the two upper notes take turns to fall a step.
const SHELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.72, note: 57, gain: 0.42 },
    { atSec: 0.12, durSec: 0.6, note: 79, gain: 0.4 },
    { atSec: 0.36, durSec: 0.5, note: 84, gain: 0.5 },
    { atSec: 0.72, durSec: 0.72, note: 62, gain: 0.42 },
    { atSec: 0.84, durSec: 0.6, note: 77, gain: 0.4 },
    { atSec: 1.08, durSec: 0.5, note: 84, gain: 0.5 },
    { atSec: 1.44, durSec: 0.72, note: 55, gain: 0.42 },
    { atSec: 1.56, durSec: 0.6, note: 77, gain: 0.4 },
    { atSec: 1.8, durSec: 0.5, note: 83, gain: 0.5 },
    { atSec: 2.16, durSec: 0.72, note: 60, gain: 0.42 },
    { atSec: 2.28, durSec: 0.6, note: 76, gain: 0.4 },
    { atSec: 2.52, durSec: 0.5, note: 83, gain: 0.5 },
    { atSec: 2.88, durSec: 0.72, note: 53, gain: 0.42 },
    { atSec: 3, durSec: 0.6, note: 76, gain: 0.4 },
    { atSec: 3.24, durSec: 0.5, note: 81, gain: 0.5 },
    { atSec: 3.6, durSec: 0.72, note: 59, gain: 0.42 },
    { atSec: 3.72, durSec: 0.6, note: 74, gain: 0.4 },
    { atSec: 3.96, durSec: 0.5, note: 81, gain: 0.5 },
    { atSec: 4.32, durSec: 0.72, note: 52, gain: 0.42 },
    { atSec: 4.44, durSec: 0.6, note: 74, gain: 0.4 },
    { atSec: 4.68, durSec: 0.5, note: 79, gain: 0.5 },
    { atSec: 5.04, durSec: 1.5, note: 57, gain: 0.42 },
    { atSec: 5.16, durSec: 1.38, note: 72, gain: 0.4 },
    { atSec: 5.4, durSec: 1.14, note: 79, gain: 0.5 },
  ],
}

// A scale down in broken thirds, E C, D B, C A and so on to C, over roots that fall a fourth and
// step up: C G Am Em F C G7 C.
const PAIRS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 76, gain: 0.5 },
    { atSec: 0, durSec: 0.62, note: 48, gain: 0.44 },
    { atSec: 0.33, durSec: 0.4, note: 72, gain: 0.38 },
    { atSec: 0.66, durSec: 0.4, note: 74, gain: 0.5 },
    { atSec: 0.66, durSec: 0.62, note: 43, gain: 0.44 },
    { atSec: 0.99, durSec: 0.4, note: 71, gain: 0.38 },
    { atSec: 1.32, durSec: 0.4, note: 72, gain: 0.5 },
    { atSec: 1.32, durSec: 0.62, note: 45, gain: 0.44 },
    { atSec: 1.65, durSec: 0.4, note: 69, gain: 0.38 },
    { atSec: 1.98, durSec: 0.4, note: 71, gain: 0.5 },
    { atSec: 1.98, durSec: 0.62, note: 40, gain: 0.44 },
    { atSec: 2.31, durSec: 0.4, note: 67, gain: 0.38 },
    { atSec: 2.64, durSec: 0.4, note: 69, gain: 0.5 },
    { atSec: 2.64, durSec: 0.62, note: 41, gain: 0.44 },
    { atSec: 2.97, durSec: 0.4, note: 65, gain: 0.38 },
    { atSec: 3.3, durSec: 0.4, note: 67, gain: 0.5 },
    { atSec: 3.3, durSec: 0.62, note: 36, gain: 0.44 },
    { atSec: 3.63, durSec: 0.4, note: 64, gain: 0.38 },
    { atSec: 3.96, durSec: 0.4, note: 65, gain: 0.5 },
    { atSec: 3.96, durSec: 0.62, note: 43, gain: 0.44 },
    { atSec: 4.29, durSec: 0.4, note: 62, gain: 0.38 },
    { atSec: 4.62, durSec: 0.4, note: 64, gain: 0.5 },
    { atSec: 4.62, durSec: 1.7, note: 48, gain: 0.44 },
    { atSec: 4.95, durSec: 1.3, note: 60, gain: 0.38 },
  ],
}

// The bass of the chain: A D G C F B E A, down a fifth and up a fourth.
const ROOTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.68, note: 33, gain: 0.62 },
    { atSec: 0.75, durSec: 0.68, note: 38, gain: 0.55 },
    { atSec: 1.5, durSec: 0.68, note: 31, gain: 0.62 },
    { atSec: 2.25, durSec: 0.68, note: 36, gain: 0.55 },
    { atSec: 3, durSec: 0.68, note: 29, gain: 0.62 },
    { atSec: 3.75, durSec: 0.68, note: 35, gain: 0.55 },
    { atSec: 4.5, durSec: 0.68, note: 28, gain: 0.62 },
    { atSec: 5.25, durSec: 1.2, note: 33, gain: 0.55 },
  ],
}

// The bass of the falling thirds: C B A G F E D, then G and C.
const SCALE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 48, gain: 0.58 },
    { atSec: 0.66, durSec: 0.6, note: 47, gain: 0.5 },
    { atSec: 1.32, durSec: 0.6, note: 45, gain: 0.58 },
    { atSec: 1.98, durSec: 0.6, note: 43, gain: 0.5 },
    { atSec: 2.64, durSec: 0.6, note: 41, gain: 0.58 },
    { atSec: 3.3, durSec: 0.6, note: 40, gain: 0.5 },
    { atSec: 3.96, durSec: 0.6, note: 38, gain: 0.58 },
    { atSec: 4.62, durSec: 0.6, note: 43, gain: 0.5 },
    { atSec: 5.28, durSec: 1.4, note: 36, gain: 0.58 },
  ],
}

// One string for two voices: each root, then above it the third or the seventh that the next root
// holds over.
const TWO_IN_ONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.34, note: 33, gain: 0.6 },
    { atSec: 0.36, durSec: 0.36, note: 48, gain: 0.46 },
    { atSec: 0.76, durSec: 0.34, note: 38, gain: 0.6 },
    { atSec: 1.12, durSec: 0.36, note: 48, gain: 0.46 },
    { atSec: 1.52, durSec: 0.34, note: 31, gain: 0.6 },
    { atSec: 1.88, durSec: 0.36, note: 47, gain: 0.46 },
    { atSec: 2.28, durSec: 0.34, note: 36, gain: 0.6 },
    { atSec: 2.64, durSec: 0.36, note: 47, gain: 0.46 },
    { atSec: 3.04, durSec: 0.34, note: 29, gain: 0.6 },
    { atSec: 3.4, durSec: 0.36, note: 45, gain: 0.46 },
    { atSec: 3.8, durSec: 0.34, note: 35, gain: 0.6 },
    { atSec: 4.16, durSec: 0.36, note: 45, gain: 0.46 },
    { atSec: 4.56, durSec: 0.34, note: 28, gain: 0.6 },
    { atSec: 4.92, durSec: 0.36, note: 43, gain: 0.46 },
    { atSec: 5.32, durSec: 1.3, note: 33, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Felt piano: from no felt and a small room to notes with no hammer left in them.
  {
    id: 'falling-fifths-by-fives',
    name: 'By fives',
    category: 'keys',
    description:
      'A bare piano with no detune and no stiffness, a ripple of shade falling through its partials and every gap filled up.',
    preview: BROKEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { felt: 0, hardness: 0.75, resonance: 0.2, reverbMix: 0, width: 0.6, outputDb: -10 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Falling ripple', params: { depth: 0.9, rate: 0.7 } },
      { deviceId: 'lift', preset: 'Fill every gap' },
    ],
  },
  {
    id: 'falling-fifths-the-third-stays-put',
    name: 'The third stays put',
    category: 'keys',
    description:
      'A felted piano through a detector that lets only held tones ring on, so the note two chords share hangs over the change.',
    preview: BROKEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.5, reverbMix: 0, outputDb: -14.5 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Hanging notes',
        params: { ago: 300, ring: 0.85, mix: 0.8 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'falling-fifths-sevenths-in-glass',
    name: 'Sevenths in glass',
    category: 'bell',
    description:
      'A stiff hard-hammered piano redrawn almost whole by sixteen pure sines, with a faint rising halo.',
    preview: SHELLS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0, outputDb: -4 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Glass redraw', params: { mix: 0.9, release: 2.5 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'falling-fifths-lock-house-upright',
    name: 'Lock house upright',
    category: 'keys',
    description:
      'An old detuned upright with a loud action, played through a small speaker and heard across the room in mono.',
    preview: THIRDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { reverbMix: 0, outputDb: -16.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'falling-fifths-cellar-landing',
    name: 'Cellar landing',
    category: 'keys',
    description:
      'A felted piano moved an octave down with its body kept, its top cut, in a dark cave of a reverb.',
    preview: THIRDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { felt: 0.6, thump: 0.3, reverbMix: 0, outputDb: -12 },
    },
    effects: [
      { deviceId: 'size', preset: 'Octave below' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3000 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-fifths-stones-down-a-slope',
    name: 'Stones down a slope',
    category: 'keys',
    description:
      'A bright piano whose every chord bounces away in echoes that come closer together, duller and slightly flat.',
    preview: THIRDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.8, reverbMix: 0, outputDb: -10 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Sinking away', params: { mix: 0.45 } }],
  },
  {
    id: 'falling-fifths-no-hammer-till-home',
    name: 'No hammer till home',
    category: 'pad',
    description:
      'A piano with the pedal down whose attacks are faded in over most of a second, in a wide space that swells after it.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { hardness: 0.5, reverbMix: 0, outputDb: -4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'falling-fifths-gated-sluice',
    name: 'Gated sluice',
    category: 'keys',
    description:
      'A hard dry piano under a wall of reverb that holds level and stops dead, so each chord ends where the next begins.',
    preview: THIRDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Lean',
      params: { felt: 0.15, hardness: 0.65, reverbMix: 0, outputDb: -8 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.6, mix: 0.6, colour: 0.1 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'falling-fifths-every-voice-hangs',
    name: 'Every voice hangs',
    category: 'pad',
    description:
      'A blurred piano caught by a sustainer that swells in slowly and glides from one chord to the next.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.2, outputDb: -4 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.75, tone: 0.2 } }],
  },
  {
    id: 'falling-fifths-parlour-sequence',
    name: 'Parlour sequence',
    category: 'keys',
    description:
      'A worn mono piano on an old fast record: crackle, a worn groove, a narrow top and the lows cut away.',
    preview: BROKEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { reverbMix: 0.05, outputDb: -7 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78' },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'falling-fifths-one-chord-behind',
    name: 'One chord behind',
    category: 'keys',
    description:
      'A half-pedalled piano followed by two copies, one chord and two chords later, so each chord meets those before it.',
    preview: BROKEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { reverbMix: 0, outputDb: -18 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 0.74, fade: 0.3, spread: 1, tone: 5000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'falling-fifths-cart-on-the-hill',
    name: 'Cart on the hill',
    category: 'keys',
    description: 'A gritty grand pushed through a hot triode and dripping into a two spring tank.',
    preview: FIFTHS_UP,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { reverbMix: 0, outputDb: -19.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'falling-fifths-three-at-the-table',
    name: 'Three at the table',
    category: 'keys',
    description:
      'A plain piano beside a thick flock of delayed copies that drift round it, wide and slightly out of tune.',
    preview: FIVE_SIX,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Lean',
      params: { hardness: 0.5, detune: 0.9, outputDb: -8 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.75 } }],
  },
  {
    id: 'falling-fifths-below-the-waterline',
    name: 'Below the waterline',
    category: 'keys',
    description:
      'A soft piano in the next room, then sunk: muffled, close to mono and slowly wavering, its tails brought up.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { reverbMix: 0.5, outputDb: -19 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Slow swell' },
      { deviceId: 'lift', preset: 'Long tails', params: { limit: 8 } },
    ],
  },
  {
    id: 'falling-fifths-top-voice-last',
    name: 'Top voice last',
    category: 'keys',
    description:
      'A clear piano split into bands and delayed so that each chord unfolds upward, with the repeats fanning wider.',
    preview: FIVE_SIX,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { felt: 0.2, detune: 0.2, reverbMix: 0.1, outputDb: -12 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Four colours', params: { time: 500, mix: 0.55 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'falling-fifths-roots-underfoot',
    name: 'Roots underfoot',
    category: 'keys',
    description:
      'A close felted piano with the octave below added to every note, dark and nearly dry.',
    preview: CHAIN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { felt: 0.75, reverbMix: 0, outputDb: -20 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1800 } },
    ],
  },
  {
    id: 'falling-fifths-wound-up-stairs',
    name: 'Wound-up stairs',
    category: 'bell',
    description: 'A hard piano shrunk to the body of a music box, with a short spring after it.',
    preview: PAIRS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { stiffness: 1.2, hardness: 0.8, reverbMix: 0, outputDb: -10 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'falling-fifths-breath-before-chords',
    name: 'Breath before chords',
    category: 'texture',
    description:
      'A close creaky piano half hidden behind its own backwards swells, each piece crossing into the next, in an airy hall.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { felt: 0.7, thump: 0.5, outputDb: -8.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1400, smooth: 0.5, mix: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },

  // Chamber strings: from one close bow to six slow ones, and from gut to air.
  {
    id: 'falling-fifths-four-stands-clear',
    name: 'Four stands, clear',
    category: 'string',
    description:
      'A small straight-toned section with a quick start and a bright bow, opened in the middle, in a plain chamber.',
    preview: CHAIN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: {
        players: 4,
        attack: 0.12,
        release: 0.3,
        vibrato: 0,
        mute: 0,
        bow: 0.95,
        air: 0,
        scatter: 0.1,
        width: 0.2,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'spread', preset: 'Open middle' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'falling-fifths-gut-steps',
    name: 'Gut steps',
    category: 'string',
    description:
      'Muted bows without vibrato set inside a wooden body, so every step of the scale has the same box around it.',
    preview: THIRDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.12, release: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'falling-fifths-slow-links',
    name: 'Slow links',
    category: 'pad',
    description:
      'Muted players heard only as the octaves below and above what they play, loosely detuned, in a space that swells up behind them.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.9, scatter: 0.8, volume: -2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Hollow pair' },
      { deviceId: 'expanse', preset: 'Bloom', params: { highCut: 2500 } },
    ],
  },
  {
    id: 'falling-fifths-sigh-and-settle',
    name: 'Sigh and settle',
    category: 'string',
    description:
      'One close bow coloured like a hollow tube, that starts straight and sways more the longer a note is held, on a small plate.',
    preview: SIGHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { vibrato: 0, volume: -4 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'falling-fifths-ragged-descent',
    name: 'Ragged descent',
    category: 'string',
    description:
      'Six players who never quite agree, on a wavering tape, thinned out and pushed apart to both edges.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.35, release: 0.8, volume: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  {
    id: 'falling-fifths-thin-ice-sevenths',
    name: 'Thin ice sevenths',
    category: 'string',
    description:
      'Bows at the bridge with the two octaves above added, over a bright plate and with the lows taken away.',
    preview: SHELLS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.25, release: 1.2, volume: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { attack: 0 } },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 240, air: 4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'falling-fifths-short-bows-ringing',
    name: 'Short bows, ringing',
    category: 'string',
    description:
      'Very short bows thrown into three tape heads, with a slow hollow notch swept through all of it.',
    preview: PAIRS,
    instrument: { deviceId: 'chamber-strings', preset: 'Short bows', params: { volume: -2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads' },
      { deviceId: 'phaser', preset: 'Negative notch', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'falling-fifths-nearly-all-bow-air',
    name: 'Nearly all bow air',
    category: 'texture',
    description:
      'Airy bows smeared into a whisper: the chords are there only as the pitch of the noise.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.8, volume: -4 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Whisper' }],
  },
  {
    id: 'falling-fifths-under-the-cellos',
    name: 'Under the cellos',
    category: 'string',
    description:
      'A warm section with the same chords an octave below it, the top rolled away, in a small dark room.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.4, vibrato: 8, width: 0.4, volume: -5.5 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.65 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2500 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'falling-fifths-six-bows-one-tide',
    name: 'Six bows, one tide',
    category: 'pad',
    description:
      'Six players with a slow attack whose bands swell and cross from side to side on their own slow cycles.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 0.8, release: 4, volume: -6 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Breaking waves' },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'falling-fifths-veil-on-the-turn',
    name: 'Veil on the turn',
    category: 'pad',
    description: 'Thin muted bows under twelve stages of slow phasing, left in a dark hall.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { attack: 0.8, release: 2.5, volume: 1 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { depth: 85, mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'falling-fifths-climb-with-a-wide-sway',
    name: 'Climb with a wide sway',
    category: 'string',
    description:
      'Three players with a broad vibrato in front of a fast bright horn that throws them from side to side, in a short spring.',
    preview: FIVE_SIX,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { attack: 0.12, release: 0.4, volume: -6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Bright horn' },
      { deviceId: 'spring-reverb', preset: 'Quick twang' },
    ],
  },
  {
    id: 'falling-fifths-lone-bow-circling',
    name: 'Lone bow circling',
    category: 'string',
    description:
      'A single uncertain bow recorded by two loops of unequal length that turn against each other at the sides.',
    preview: SIGHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.16, release: 1, volume: -2.5 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.55 } }],
  },
  {
    id: 'falling-fifths-two-at-arms-length',
    name: "Two at arm's length",
    category: 'string',
    description:
      'A hushed pair of bows moved several paces off: darker, narrower and with more of the room than of them.',
    preview: FIFTHS_UP,
    instrument: { deviceId: 'chamber-strings', preset: 'Quiet duet', params: { volume: -8 } },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'falling-fifths-choir-in-the-tail',
    name: 'Choir in the tail',
    category: 'voice',
    description: 'Still bows with a hall after them whose tail is shaped by a sung open vowel.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.7, release: 1.5, volume: -2.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.75 } }],
  },
  {
    id: 'falling-fifths-measured-trembling',
    name: 'Measured trembling',
    category: 'string',
    description:
      'A section pulsed eight times a second, six to a chord, left against right, under a stretched drum head.',
    preview: CHAIN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { attack: 0.1, release: 0.3, bow: 0.7, vibrato: 0, volume: -1 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 8, depth: 1, phase: 180 } },
      { deviceId: 'vessel', preset: 'Drum head' },
    ],
  },
  {
    id: 'falling-fifths-scale-from-the-kitchen',
    name: 'Scale from the kitchen',
    category: 'string',
    description:
      'A warm section out of a kitchen radio: a narrow band close to mono, some static, the bottom gone.',
    preview: THIRDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.15, release: 0.3, volume: -7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'falling-fifths-swell-at-each-link',
    name: 'Swell at each link',
    category: 'string',
    description:
      'A warm section that breathes: its level, brightness and width open and close about once for every two chords.',
    preview: CHAIN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.3, release: 0.8, vibrato: 4, volume: -5 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Panting',
        params: { in: 0.52, out: 0.94, depth: 0.75, air: 0.15, width: 0.9, vary: 0.1 },
      },
    ],
  },

  // Organ: one rank at a time, from a wheeze behind a wall to the whole chest, held or struck short.
  {
    id: 'falling-fifths-flutes-top-first',
    name: 'Flutes, top first',
    category: 'organ',
    description:
      'Chapel flutes split into bands so that the top of each chord speaks before its bass, with a short room after.',
    preview: CHAIN,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.02, release: 0.15, volume: -14 },
    },
    effects: [
      { deviceId: 'prism', preset: 'High to low', params: { mix: 0.65 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'falling-fifths-harmonium-downstairs',
    name: 'Harmonium downstairs',
    category: 'organ',
    description:
      'A harmonium heard from the far end of a hall, through one combo speaker and all of its room.',
    preview: THIRDS,
    instrument: { deviceId: 'organ', preset: 'Harmonium', params: { bellows: 0.6, volume: -12 } },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
  },
  {
    id: 'falling-fifths-crypt-of-sevenths',
    name: 'Crypt of sevenths',
    category: 'drone',
    description:
      'Beating sub flutes with a slow start in an enormous hall that keeps only the lows.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.6, release: 2.5, volume: -14 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.6 } }],
  },
  {
    id: 'falling-fifths-full-chest-cut-short',
    name: 'Full chest, cut short',
    category: 'organ',
    description:
      'Every rank at once, let go at a touch, with a reverb that falls to nothing in a straight line.',
    preview: THIRDS,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { attack: 0.01, release: 0.05, volume: -10 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1, mix: 0.45 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'falling-fifths-leaky-bellows',
    name: 'Leaky bellows',
    category: 'organ',
    description:
      'A wheezing reed organ through the converters of a small sampler, grainy at the top and folded to mono.',
    preview: THIRDS,
    instrument: { deviceId: 'organ', preset: 'Pump organ', params: { breath: 0.6, volume: -14 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { jitter: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'falling-fifths-trembling-shells',
    name: 'Trembling shells',
    category: 'organ',
    description: 'A trembling flute with a hollow negative flange moving through it, lows removed.',
    preview: SHELLS,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.5, reed: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow' },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'falling-fifths-never-reaching-home',
    name: 'Never reaching home',
    category: 'pad',
    description:
      'Distant pipes whose tail sinks in gliding voices for as long as it rings and never arrives.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 0.8, release: 2, volume: -14 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Sinking fast', params: { mix: 0.55 } }],
  },
  {
    id: 'falling-fifths-quint-on-quint',
    name: 'Quint on quint',
    category: 'organ',
    description:
      'A plain flute with its twelfth drawn nearly full and a little of its octave, on a bright plate: each root carries its fifth.',
    preview: FIFTHS_UP,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { octave: 0.15, attack: 0.04, release: 0.4, tone: 6000, volume: -12 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.45 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'falling-fifths-ripple-through-flutes',
    name: 'Ripple through flutes',
    category: 'organ',
    description:
      'Two flutes that beat, a little of their octaves below and above, with a tremolo that travels outward from the middle of their spectrum.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { sub: 0.3, octave: 0.2, attack: 0.15, release: 0.8, volume: -12 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rings outward', params: { depth: 1, soft: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'falling-fifths-one-voice-in-the-pipe',
    name: 'One voice in the pipe',
    category: 'voice',
    description:
      'A reed with a full tremulant in a small mono hall that sings one steady vowel after it.',
    preview: SIGHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { attack: 0.06, release: 0.3, volume: -12 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Lone voice', params: { mix: 0.55 } }],
  },
  {
    id: 'falling-fifths-squeezebox-scale',
    name: 'Squeezebox scale',
    category: 'organ',
    description:
      'Bright wet reeds with a quick release, driven down a narrow band and splashed into a late spring.',
    preview: PAIRS,
    instrument: { deviceId: 'organ', preset: 'Accordion', params: { volume: -9.5 } },
    effects: [
      { deviceId: 'auto-filter', preset: 'Phone line', params: { driveDb: 6, resonance: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'falling-fifths-strings-in-the-box',
    name: 'Strings in the box',
    category: 'drone',
    description:
      'A bellows drone whose notes set a bank of strings tuned to A minor ringing, wide and long.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.4, release: 1, volume: -14 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 9, mix: 0.75 } }],
  },
  {
    id: 'falling-fifths-pedalboard-walks',
    name: 'Pedalboard walks',
    category: 'bass',
    description:
      'The deepest rank under a plain flute, with a quicker start, warmed by a transformer with its low end bumped.',
    preview: SCALE_BASS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { octave: 0.15, attack: 0.06, release: 0.25, volume: -12 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.5 } }],
  },
  {
    id: 'falling-fifths-wind-turning-over',
    name: 'Wind turning over',
    category: 'wind',
    description:
      'A flute that is mostly wind, carried round the listener in a slow figure of eight.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { octave: 0.3, attack: 0.4, release: 1, volume: -8 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.3, head: 1 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'falling-fifths-hymn-past-the-wall',
    name: 'Hymn past the wall',
    category: 'organ',
    description:
      'An organ with everything above the middle taken off, moved next door: dull, narrow and steady.',
    preview: CHAIN,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { attack: 0.1, release: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'falling-fifths-stops-come-on-late',
    name: 'Stops come on late',
    category: 'organ',
    description:
      'A thin flute joined nearly two seconds later by copies of it, from an octave below to two octaves above.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.2, octave: 0.3, fifteenth: 0, attack: 0.3, release: 1.2, volume: -13 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Slow bloom' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'falling-fifths-portative-answers',
    name: 'Portative answers',
    category: 'organ',
    description:
      'A tiny high organ with no bass rank and almost no release, repeated by two tape heads at a gallop.',
    preview: PAIRS,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: {
        sub: 0,
        octave: 0.4,
        twelfth: 0.2,
        fifteenth: 0.6,
        breath: 0.5,
        attack: 0.005,
        release: 0.03,
        tone: 8000,
        volume: -8,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.45 } }],
  },
  {
    id: 'falling-fifths-left-box-right-box',
    name: 'Left box, right box',
    category: 'organ',
    description:
      'A harmonium gated to one side and then the other in turn, twice a chord, over a dark plate.',
    preview: CHAIN,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { reed: 0.5, celeste: 0, attack: 0.03, release: 0.2, volume: -8.5 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Left then right', params: { floor: 0, rate: 2.667 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },

  // Harp: where the string is plucked and how soon it is stopped, from dry pegs to one long blur.
  {
    id: 'falling-fifths-harp-holds-the-chain',
    name: 'Harp holds the chain',
    category: 'plucked',
    description:
      'A concert harp with each new pluck caught and kept for a moment as an even tone beside it.',
    preview: BROKEN,
    instrument: { deviceId: 'harp', preset: 'Concert harp', params: { halo: 0.1, volume: -4 } },
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch', params: { mix: 0.65 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'falling-fifths-palm-after-pluck',
    name: 'Palm after pluck',
    category: 'plucked',
    description:
      'A muted harp driven hard into a fast limiter so that its plucks come down to their ring, dry and close to mono.',
    preview: PAIRS,
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { body: 0.4, volume: -2 } },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'falling-fifths-clay-jar-of-thirds',
    name: 'Clay jar of thirds',
    category: 'plucked',
    description:
      'Strings plucked down by the soundboard inside a round clay pot that keeps their low middle, levelled by a limiter.',
    preview: THIRDS,
    instrument: { deviceId: 'harp', preset: 'Near the soundboard', params: { volume: -4 } },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot' },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'falling-fifths-tail-drops-a-fifth',
    name: 'Tail drops a fifth',
    category: 'pad',
    description:
      'A long-ringing soft harp in a reverb whose tail is read back a fifth lower each time it comes round.',
    preview: SHELLS,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { halo: 0.4, volume: -4 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.6 } }],
  },
  {
    id: 'falling-fifths-pegs-in-a-row',
    name: 'Pegs in a row',
    category: 'plucked',
    description:
      'Hard silk strings near the bridge with a ladder of uneven echoes after each one, all of it pressed flat by a limiter.',
    preview: PAIRS,
    instrument: { deviceId: 'harp', preset: 'Koto', params: { decay: 0.8, volume: 0 } },
    effects: [
      { deviceId: 'constellation', preset: 'Bent ladder' },
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -11 } },
    ],
  },
  {
    id: 'falling-fifths-silk-in-low-cloud',
    name: 'Silk in low cloud',
    category: 'pad',
    description:
      'Soft silk strings with their plucks blurred into a dark bank that has no tail of its own.',
    preview: BROKEN,
    instrument: { deviceId: 'harp', preset: 'Soft silk', params: { bend: 0, volume: 4 } },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
  },
  {
    id: 'falling-fifths-steel-strings-trade',
    name: 'Steel strings trade',
    category: 'plucked',
    description:
      'Steel strings doubled by a deep slow chorus with feedback, so the two moving voices never quite line up.',
    preview: SHELLS,
    instrument: { deviceId: 'harp', preset: 'Guzheng', params: { volume: 6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea' },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'falling-fifths-hollow-stair',
    name: 'Hollow stair',
    category: 'plucked',
    description:
      'Strings plucked at their middle with a big body, and the octaves underneath added as low tones with no edge.',
    preview: THIRDS,
    instrument: { deviceId: 'harp', preset: 'Dark hollow harp', params: { damp: 0.3, volume: -8 } },
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'ambient-limiter', preset: 'Breathing' },
    ],
  },
  {
    id: 'falling-fifths-pebbles-counted-out',
    name: 'Pebbles counted out',
    category: 'plucked',
    description:
      'Short dry plucks, each repeated in even steps that cross to the other side and fade.',
    preview: PAIRS,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 165, throw: 1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'falling-fifths-wire-through-water',
    name: 'Wire through water',
    category: 'plucked',
    description:
      'Long steel strings behind a low-pass that opens with each pluck, levelled, under a wide slow flange.',
    preview: SHELLS,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { touch: 0.6, body: 0.3, volume: 0 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { cutoffHz: 800 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 16, outputGain: -4 } },
      { deviceId: 'flanger', preset: 'Wide wash' },
    ],
  },
  {
    id: 'falling-fifths-held-while-it-shakes',
    name: 'Held while it shakes',
    category: 'plucked',
    description:
      'A harp that rings only while held, its lows and highs trading places in a harmonic tremolo, the sides opposed.',
    preview: THIRDS_HELD,
    instrument: { deviceId: 'harp', preset: 'Rings while held', params: { volume: 2 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { depth: 1, rate: 4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'falling-fifths-rolled-left-ringing',
    name: 'Rolled, left ringing',
    category: 'plucked',
    description:
      'Slowly rolled soft harp chords with a string pad growing in behind them and hanging on for seconds.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.6, volume: 1 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Lingering', params: { mix: 0.65 } }],
  },
  {
    id: 'falling-fifths-harp-runs-backwards',
    name: 'Harp runs backwards',
    category: 'texture',
    description:
      'A harp that rolls each chord over most of a second, then plays back reversed an octave down in falling steps.',
    preview: WAY_OUT,
    instrument: { deviceId: 'harp', preset: 'Glissando', params: { volume: 0.5 } },
    effects: [{ deviceId: 'reverse-delay', preset: 'Descending steps', params: { mix: 0.65 } }],
  },
  {
    id: 'falling-fifths-no-fingers',
    name: 'No fingers',
    category: 'pad',
    description:
      'A long-ringing harp with every pluck faded in as if bowed, in a ten second valley that arrives late.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.5, body: 0.7, volume: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'falling-fifths-attic-cassette-harp',
    name: 'Attic cassette harp',
    category: 'plucked',
    description:
      'A short bright harp on a chewed cassette: saturated, fluttering and dropping out.',
    preview: BROKEN,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.12, decay: 0.6, halo: 0.2, volume: -4 },
    },
    effects: [{ deviceId: 'tape', preset: 'Chewed cassette' }],
  },
  {
    id: 'falling-fifths-leaves-from-the-third',
    name: 'Leaves from the third',
    category: 'plucked',
    description:
      'A soft harp shedding small pieces of itself that drop an octave while they fade, spread across the sides.',
    preview: THIRDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { touch: 0.15, pluck: 0.45, decay: 0.7, damp: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Octave below', params: { curve: 0.2, spread: 1, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 70 } },
    ],
  },
  {
    id: 'falling-fifths-cellos-beneath',
    name: 'Cellos beneath',
    category: 'plucked',
    description:
      'A crisp harp with a dark pad, mostly an octave below, that swells in a second and a half behind its chords.',
    preview: FIVE_SIX,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { pluck: 0.2, touch: 0.8, decay: 0.8, volume: 4.5 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.6 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'falling-fifths-fourths-let-fall',
    name: 'Fourths let fall',
    category: 'plucked',
    description:
      'A damped harp whose echoes are rebuilt from grains, each repeat a fourth under the one before.',
    preview: SIGHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.5, touch: 0.6, volume: -2 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Falling fourths', params: { mix: 0.5 } }],
  },

  // Tines: bell or bark, damped or never damped, still or turning.
  {
    id: 'falling-fifths-sevenths-turn-over',
    name: 'Sevenths turn over',
    category: 'keys',
    description:
      'A soft tine piano, its tremolo off, under eight stages of deep slow phasing on a medium plate.',
    preview: CHAIN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0, volume: -5.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'falling-fifths-strike-after-the-note',
    name: 'Strike after the note',
    category: 'keys',
    description:
      'Bright bell tines whose hammer is heard just after the tone it made, scattered to the sides.',
    preview: SHELLS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strike just after', params: { late: 120, attacks: 3 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'falling-fifths-bark-down-the-line',
    name: 'Bark down the line',
    category: 'keys',
    description:
      'A barking stage piano through a filter that opens with the touch, with thin fading tape repeats, all of it in mono.',
    preview: FIFTHS_UP,
    instrument: { deviceId: 'tine-piano', preset: 'Barking stage', params: { volume: -4.5 } },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { envAmount: 100, mix: 0.9 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 280 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'falling-fifths-wool-over-tines',
    name: 'Wool over tines',
    category: 'pad',
    description:
      'Dark soft tines blurred into a warm fuzzy wall that hangs for eight seconds with no top.',
    preview: WAY_OUT,
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -14 } },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.7 } }],
  },
  {
    id: 'falling-fifths-sagging-home',
    name: 'Sagging home',
    category: 'keys',
    description:
      'Slowly panned tines with a tail that begins clean, then sags in pitch and darkens as it rings.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremolo: 0.4, volume: -12 },
    },
    effects: [{ deviceId: 'melt', preset: 'Clean start', params: { sag: -25, mix: 0.6 } }],
  },
  {
    id: 'falling-fifths-stack-in-the-yard',
    name: 'Stack in the yard',
    category: 'keys',
    description:
      'Trembling tines through a warm valve stack of speakers, close, with the treble turned down.',
    preview: FIVE_SIX,
    instrument: { deviceId: 'tine-piano', preset: 'Tremolo', params: { volume: -14 } },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'falling-fifths-tines-learn-the-chord',
    name: 'Tines learn the chord',
    category: 'keys',
    description:
      'Long tines over a bank of strings that retunes itself to what is played and holds it for nine seconds.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0, volume: -24 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.75 } }],
  },
  {
    id: 'falling-fifths-glass-on-the-sill',
    name: 'Glass on the sill',
    category: 'bell',
    description:
      'Short glassy tines with two octaves of sparkle in a very small room and nothing low.',
    preview: SHELLS,
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells', params: { volume: -8 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 350 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'falling-fifths-steps-on-tin',
    name: 'Steps on tin',
    category: 'keys',
    description: 'Tines stopped at once, with clean quick repeats set inside a small metal drum.',
    preview: PAIRS,
    instrument: { deviceId: 'tine-piano', preset: 'Short tines', params: { volume: -6 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 165 } },
      { deviceId: 'vessel', preset: 'Small tin' },
    ],
  },
  {
    id: 'falling-fifths-tines-take-the-loft',
    name: 'Tines take the loft',
    category: 'organ',
    description:
      'Long tines heard only as organ pipes: a sub octave, an octave, a twelfth and a fifteenth, no unison.',
    preview: CHAIN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { release: 0.4, decay: 3, volume: -12 },
    },
    effects: [{ deviceId: 'stops', preset: 'Only the pipes' }],
  },
  {
    id: 'falling-fifths-keys-in-the-canal',
    name: 'Keys in the canal',
    category: 'pad',
    description:
      'Tines with no bell in them and no damper, sunk and wavering, then scattered far off by a wide dull flock of copies.',
    preview: WAY_HOME,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tone: 0.5, volume: -14.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Slow swell' },
      { deviceId: 'murmuration', preset: 'Wide and dull', params: { mix: 0.8 } },
    ],
  },
  {
    id: 'falling-fifths-each-link-slower',
    name: 'Each link slower',
    category: 'keys',
    description:
      'Sustained tines under layered pulses that glide into each other, so the chords seem to slow without end.',
    preview: THIRDS_HELD,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { tremolo: 0, volume: -12 },
    },
    effects: [
      { deviceId: 'winding-down', preset: 'Ever slower', params: { offset: 90 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'falling-fifths-throb-from-below',
    name: 'Throb from below',
    category: 'keys',
    description:
      'Dark tines pumping together in mono, low sines sounding an octave under the strongest of their partials.',
    preview: CHAIN,
    instrument: { deviceId: 'tine-piano', preset: 'Deep throb', params: { volume: -14 } },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Low shadow',
        params: { mix: 0.5, attack: 150, release: 1 },
      },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'falling-fifths-leaf-light-tines',
    name: 'Leaf-light tines',
    category: 'keys',
    description:
      'Thin fast-trembling tines with every one of their partials lit by its own quick shimmer, wide apart.',
    preview: PAIRS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremolo: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 1, lean: 0.2 } },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'falling-fifths-reed-in-the-tines',
    name: 'Reed in the tines',
    category: 'keys',
    description:
      'Tines struck as softly as they can be, pressed into a round vowel until they speak like a reed, in a tight room.',
    preview: SIGHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { tremolo: 0.2, volume: -12 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'falling-fifths-hot-tines-slack-coil',
    name: 'Hot tines, slack coil',
    category: 'keys',
    description: 'Overdriven tines with a single slack spring behind them, chirping into the gaps.',
    preview: FIFTHS_UP,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { tremolo: 0, volume: -10 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.4 } }],
  },
  {
    id: 'falling-fifths-old-chip-descends',
    name: 'Old chip descends',
    category: 'keys',
    description:
      'Quickly damped tines taken down to a low sample rate with nothing above the middle, at the end of a mine shaft of short echoes.',
    preview: THIRDS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.8, tremolo: 0, pan: 0, release: 0.1, volume: -11 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken', params: { rate: 3200, drive: 6 } },
      { deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'falling-fifths-tines-under-a-bow',
    name: 'Tines under a bow',
    category: 'string',
    description:
      'Long tines whose strikes fade in like a section of strings, a detuned copy spread to the sides.',
    preview: WAY_OUT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bark: 0.8, tremolo: 0, tone: 0.7, volume: -8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },

  // String bass: the roots themselves, one at a time, and the one line that is two.
  {
    id: 'falling-fifths-the-first-root',
    name: 'The first root',
    category: 'bass',
    description:
      'A round upright in a close small room, its body held a little by a slow compressor.',
    preview: ROOTS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 4, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 8 } },
      { deviceId: 'distance', preset: 'Close mic', params: { room: 0.7 } },
    ],
  },
  {
    id: 'falling-fifths-scale-in-wood',
    name: 'Scale in wood',
    category: 'bass',
    description:
      'A long-ringing upright set inside a wooden body, its quiet lows brought up until the notes join.',
    preview: SCALE_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { release: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.6 } },
      { deviceId: 'lift', preset: 'Warm floor', params: { limit: 8 } },
    ],
  },
  {
    id: 'falling-fifths-thumb-and-finger',
    name: 'Thumb and finger',
    category: 'bass',
    description:
      'A finger-played electric bass driven into a fast limiter, so the held upper notes sit level with the roots.',
    preview: TWO_IN_ONE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { tone: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'falling-fifths-fretless-sighs-down',
    name: 'Fretless sighs down',
    category: 'bass',
    description:
      'A singing fretless heard only through three wide slow chorus voices, with a dark plate behind.',
    preview: TWO_IN_ONE,
    instrument: { deviceId: 'string-bass', preset: 'Singing fretless', params: { volume: 0 } },
    effects: [
      { deviceId: 'chorus', preset: 'Voices only' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'falling-fifths-mill-wheel-thud',
    name: 'Mill wheel thud',
    category: 'bass',
    description:
      'A muted thud of a bass roughened by a biased tube, then shut in a cupboard with its amplifier.',
    preview: ROOTS,
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { tone: 0.6, volume: 6 } },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Bass grit',
        params: { driveDb: 24, toneDb: 3, outputDb: -7, mix: 1 },
      },
      { deviceId: 're-amp', preset: 'In the cupboard' },
    ],
  },
  {
    id: 'falling-fifths-pick-and-its-echo',
    name: 'Pick and its echo',
    category: 'bass',
    description:
      'A bright picked bass with steady clean repeats that fill the gap before the next root.',
    preview: SCALE_BASS,
    instrument: { deviceId: 'string-bass', preset: 'Bright pick', params: { volume: 1 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 330, spread: 1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'falling-fifths-all-roots-ring',
    name: 'All roots ring',
    category: 'bass',
    description:
      'An electric bass damped so slowly that each root rings into the next, the octaves above it swelling in slowly, in a wide dark cave.',
    preview: ROOTS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { release: 1.4, volume: -4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { up1: 0.5, filter: 3000 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'falling-fifths-dusk-in-the-bass',
    name: 'Dusk in the bass',
    category: 'bass',
    description: 'A dark soft upright with the octave below growing in under every note, in mono.',
    preview: SCALE_BASS,
    instrument: { deviceId: 'string-bass', preset: 'Dark soft upright', params: { volume: -1.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 0.2, sub2: 0, sub1: 0.7 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'falling-fifths-slapped-landing',
    name: 'Slapped landing',
    category: 'bass',
    description:
      'A slapped upright on an old record in a short twanging spring, rattle and crackle together.',
    preview: ROOTS,
    instrument: { deviceId: 'string-bass', preset: 'Slapped upright', params: { volume: -1.5 } },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.2 } },
      { deviceId: 'vinyl', preset: 'Dull stylus' },
    ],
  },
  {
    id: 'falling-fifths-bass-with-no-pluck',
    name: 'Bass with no pluck',
    category: 'bass',
    description:
      'A deep fretless whose plucks are faded in over a fifth of a second, in a warm dark hall.',
    preview: SCALE_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { tone: 0.6, growl: 0.8, volume: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { mix: 1, attack: 220 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25, lowDecay: 2.5 } },
    ],
  },
]
