import { type FactoryPreset, type Phrase } from '../types'

// Seven voices that come round as often as seven planets do, 24:15:9:6:4:3:2, with five smaller systems
// beside them. Laid out by orbit, a kind of sound for each, and then by distance, from close and plain to
// far off. Slow motions run at the rates of a 32 s cycle, echoes and drops at those of a 6 s one.

// The whole chain in 6 s: strokes 2 on C2, 3 on G2, 4 on C3, 6 on G3, 9 on D4, 15 on B4 and 24 on G5.
// The same numbers are the pitches, a spread C major ninth, and C2 begins the next turn.
const WHOLE_CHAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.9, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 1.9, note: 43, gain: 0.4 },
    { atSec: 0, durSec: 1.42, note: 48, gain: 0.36 },
    { atSec: 0, durSec: 0.95, note: 55, gain: 0.38 },
    { atSec: 0, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 0, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 0, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 0.25, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 0.4, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 0.5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 0.667, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 0.75, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 0.8, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 1, durSec: 0.95, note: 55, gain: 0.38 },
    { atSec: 1, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 1.2, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 1.25, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 1.333, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 1.5, durSec: 1.42, note: 48, gain: 0.36 },
    { atSec: 1.5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 1.6, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 1.75, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 2, durSec: 1.9, note: 43, gain: 0.4 },
    { atSec: 2, durSec: 0.95, note: 55, gain: 0.38 },
    { atSec: 2, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 2, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 2, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 2.25, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 2.4, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 2.5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 2.667, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 2.75, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 2.8, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 3, durSec: 2.9, note: 36, gain: 0.5 },
    { atSec: 3, durSec: 1.42, note: 48, gain: 0.36 },
    { atSec: 3, durSec: 0.95, note: 55, gain: 0.38 },
    { atSec: 3, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 3.2, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 3.25, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 3.333, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 3.5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 3.6, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 3.75, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 4, durSec: 1.9, note: 43, gain: 0.4 },
    { atSec: 4, durSec: 0.95, note: 55, gain: 0.38 },
    { atSec: 4, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 4, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 4, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 4.25, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 4.4, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 4.5, durSec: 1.42, note: 48, gain: 0.36 },
    { atSec: 4.5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 4.667, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 4.75, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 4.8, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 5, durSec: 0.95, note: 55, gain: 0.38 },
    { atSec: 5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 5.2, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 5.25, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 5.333, durSec: 0.6, note: 62, gain: 0.34 },
    { atSec: 5.5, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 5.6, durSec: 0.36, note: 71, gain: 0.28 },
    { atSec: 5.75, durSec: 0.23, note: 79, gain: 0.2 },
    { atSec: 6, durSec: 1.4, note: 36, gain: 0.5 },
  ],
}
// Half of the great cycle at half the pace, the five outer voices, each note as long as its orbit.
// At 6 s the even counts meet: C2, C3 and G3.
const OUTER_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.9, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 3.95, note: 43, gain: 0.42 },
    { atSec: 0, durSec: 2.95, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 1.95, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 1.3, note: 62, gain: 0.36 },
    { atSec: 1.333, durSec: 1.3, note: 62, gain: 0.36 },
    { atSec: 2, durSec: 1.95, note: 55, gain: 0.4 },
    { atSec: 2.667, durSec: 1.3, note: 62, gain: 0.36 },
    { atSec: 3, durSec: 2.95, note: 48, gain: 0.4 },
    { atSec: 4, durSec: 3.2, note: 43, gain: 0.42 },
    { atSec: 4, durSec: 1.95, note: 55, gain: 0.4 },
    { atSec: 4, durSec: 1.3, note: 62, gain: 0.36 },
    { atSec: 5.333, durSec: 1.8, note: 62, gain: 0.36 },
    { atSec: 6, durSec: 1.35, note: 36, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 48, gain: 0.4 },
    { atSec: 6, durSec: 1.35, note: 55, gain: 0.4 },
  ],
}
// The seven numbers 2:3:4:6:9:15:24 as one held chord, tuned as they are so nothing in it beats. Each voice
// enters after one turn of its own in a cycle of 6 s: G5 first, then B4 D4 G3 C3 G2, and C2 last, at 3 s.
const RATIO_CHORD: Phrase = {
  notes: [
    { atSec: 0.25, durSec: 6.35, note: 79.02, gain: 0.28 },
    { atSec: 0.4, durSec: 6.2, note: 70.88, gain: 0.34 },
    { atSec: 0.667, durSec: 5.933, note: 62.04, gain: 0.38 },
    { atSec: 1, durSec: 5.6, note: 55.02, gain: 0.42 },
    { atSec: 1.5, durSec: 5.1, note: 48, gain: 0.44 },
    { atSec: 2, durSec: 4.6, note: 43.02, gain: 0.46 },
    { atSec: 3, durSec: 3.6, note: 36, gain: 0.52 },
  ],
}
// The inner three, 24:15:9, which is 8:5:3: G5 eight times, B4 five times, D4 three times; they meet again at 6 s.
const INNER_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 62, gain: 0.44 },
    { atSec: 0, durSec: 1.1, note: 71, gain: 0.38 },
    { atSec: 0, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 0.75, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 1.2, durSec: 1.1, note: 71, gain: 0.38 },
    { atSec: 1.5, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 2, durSec: 1.9, note: 62, gain: 0.44 },
    { atSec: 2.25, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 2.4, durSec: 1.1, note: 71, gain: 0.38 },
    { atSec: 3, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 3.6, durSec: 1.1, note: 71, gain: 0.38 },
    { atSec: 3.75, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 4, durSec: 1.9, note: 62, gain: 0.44 },
    { atSec: 4.5, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 4.8, durSec: 1.1, note: 71, gain: 0.38 },
    { atSec: 5.25, durSec: 0.7, note: 79, gain: 0.3 },
    { atSec: 6, durSec: 1.3, note: 62, gain: 0.44 },
    { atSec: 6, durSec: 1.3, note: 71, gain: 0.36 },
    { atSec: 6, durSec: 1.3, note: 79, gain: 0.28 },
  ],
}
// The middle three, 9:6:4: D4 nine times, G3 six times, C3 four times; they meet again at 6 s.
const MIDDLE_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.42, note: 48, gain: 0.46 },
    { atSec: 0, durSec: 0.95, note: 55, gain: 0.44 },
    { atSec: 0, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 0.667, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 1, durSec: 0.95, note: 55, gain: 0.44 },
    { atSec: 1.333, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 1.5, durSec: 1.42, note: 48, gain: 0.46 },
    { atSec: 2, durSec: 0.95, note: 55, gain: 0.44 },
    { atSec: 2, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 2.667, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 3, durSec: 1.42, note: 48, gain: 0.46 },
    { atSec: 3, durSec: 0.95, note: 55, gain: 0.44 },
    { atSec: 3.333, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 4, durSec: 0.95, note: 55, gain: 0.44 },
    { atSec: 4, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 4.5, durSec: 1.42, note: 48, gain: 0.46 },
    { atSec: 4.667, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 5, durSec: 0.95, note: 55, gain: 0.44 },
    { atSec: 5.333, durSec: 0.64, note: 62, gain: 0.4 },
    { atSec: 6, durSec: 1.3, note: 48, gain: 0.46 },
    { atSec: 6, durSec: 1.3, note: 55, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 62, gain: 0.38 },
  ],
}
// Three moons at 4:2:1, A minor seventh: the quick one on E5 each beat, the second on C4 and G4 on beats
// two and four, the slow one on A2 and E3 on beat one. The quick one
// meets each of the others by turns; those two never meet, so all three never do.
const THREE_MOONS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 3.1, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 0.8, durSec: 1.5, note: 60, gain: 0.42 },
    { atSec: 0.8, durSec: 1.5, note: 67, gain: 0.36 },
    { atSec: 0.8, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 1.6, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 2.4, durSec: 1.5, note: 60, gain: 0.42 },
    { atSec: 2.4, durSec: 1.5, note: 67, gain: 0.36 },
    { atSec: 2.4, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 3.2, durSec: 3.1, note: 45, gain: 0.5 },
    { atSec: 3.2, durSec: 3.1, note: 52, gain: 0.4 },
    { atSec: 3.2, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 4, durSec: 1.5, note: 60, gain: 0.42 },
    { atSec: 4, durSec: 1.5, note: 67, gain: 0.36 },
    { atSec: 4, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 4.8, durSec: 0.74, note: 76, gain: 0.36 },
    { atSec: 5.6, durSec: 1.5, note: 60, gain: 0.42 },
    { atSec: 5.6, durSec: 1.5, note: 67, gain: 0.36 },
    { atSec: 5.6, durSec: 0.74, note: 76, gain: 0.36 },
  ],
}
// Thirteen E5 against eight A4, struck together at the start and at 6 s, there over A3. Thirteen less eight
// is five: at every fifth of the cycle the two planets line up elsewhere, and a soft C5 marks the four between.
const MORNING_STAR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 0, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 0.462, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 0.75, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 0.923, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 1.2, durSec: 1, note: 72, gain: 0.24 },
    { atSec: 1.385, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 1.5, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 1.846, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 2.25, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 2.308, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 2.4, durSec: 1, note: 72, gain: 0.24 },
    { atSec: 2.769, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 3, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 3.231, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 3.6, durSec: 1, note: 72, gain: 0.24 },
    { atSec: 3.692, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 3.75, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 4.154, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 4.5, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 4.615, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 4.8, durSec: 1, note: 72, gain: 0.24 },
    { atSec: 5.077, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 5.25, durSec: 0.7, note: 69, gain: 0.42 },
    { atSec: 5.538, durSec: 0.43, note: 76, gain: 0.34 },
    { atSec: 6, durSec: 1.3, note: 57, gain: 0.4 },
    { atSec: 6, durSec: 1.3, note: 69, gain: 0.4 },
    { atSec: 6, durSec: 1.3, note: 76, gain: 0.32 },
  ],
}
// Two tides on one A3, fourteen strokes against fifteen: together at the start over D3 (the spring),
// exactly between each other at 3 s over E3 (the neap), together again at 6 s.
const TWO_TIDES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 50, gain: 0.36 },
    { atSec: 0, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 0, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 0.4, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 0.429, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 0.8, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 0.857, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 1.2, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 1.286, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 1.6, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 1.714, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 2, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 2.143, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 2.4, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 2.571, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 2.8, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 3, durSec: 2.8, note: 52, gain: 0.36 },
    { atSec: 3, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 3.2, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 3.429, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 3.6, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 3.857, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 4, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 4.286, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 4.4, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 4.714, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 4.8, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 5.143, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 5.2, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 5.571, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 5.6, durSec: 0.34, note: 57, gain: 0.34 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.4 },
    { atSec: 6, durSec: 1.3, note: 57, gain: 0.4 },
  ],
}
// A chain of six worlds, 54:36:24:16:12:9: the outer three in strokes, nine D3, twelve G3, sixteen C4,
// then all six as a chord of fourths and fifths, D3 G3 C4 G4 D5 A5.
const SIX_CHAIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 0, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 0.375, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 0.5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 0.667, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 0.75, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 1, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 1.125, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 1.333, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 1.5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 1.5, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 1.875, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 2, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 2, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 2.25, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 2.5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 2.625, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 2.667, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 3, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 3, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 3.333, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 3.375, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 3.5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 3.75, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 4, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 4, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 4.125, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 4.5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 4.5, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 4.667, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 4.875, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 5.25, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 5.333, durSec: 0.62, note: 50, gain: 0.42 },
    { atSec: 5.5, durSec: 0.46, note: 55, gain: 0.36 },
    { atSec: 5.625, durSec: 0.34, note: 60, gain: 0.32 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 55, gain: 0.38 },
    { atSec: 6, durSec: 1.3, note: 60, gain: 0.36 },
    { atSec: 6, durSec: 1.3, note: 67, gain: 0.32 },
    { atSec: 6, durSec: 1.3, note: 74, gain: 0.3 },
    { atSec: 6, durSec: 1.3, note: 81, gain: 0.26 },
  ],
}
// The outer pair alone as a bed: two long C2 against three G2.
const OUTER_BED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.25, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 2.15, note: 43, gain: 0.44 },
    { atSec: 2.2, durSec: 2.15, note: 43, gain: 0.44 },
    { atSec: 3.3, durSec: 3.4, note: 36, gain: 0.5 },
    { atSec: 4.4, durSec: 2.4, note: 43, gain: 0.44 },
  ],
}
// The farthest orbit alone: C2, twice in the cycle.
const FARTHEST_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 36, gain: 0.6 },
    { atSec: 3.3, durSec: 3.5, note: 36, gain: 0.6 },
  ],
}
// Two against three on one string: C2 at 0 and 3 s, G2 between them at 2 and 4 s, C2 home at 6 s.
const PAIR_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.92, note: 36, gain: 0.62 },
    { atSec: 2, durSec: 0.92, note: 43, gain: 0.5 },
    { atSec: 3, durSec: 0.95, note: 36, gain: 0.58 },
    { atSec: 4, durSec: 1.92, note: 43, gain: 0.5 },
    { atSec: 6, durSec: 1.3, note: 36, gain: 0.6 },
  ],
}
// Two, three and four on one string, C2 G2 C3: where two fall together the farther one is heard.
const THREE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.45, note: 36, gain: 0.62 },
    { atSec: 1.5, durSec: 0.46, note: 48, gain: 0.46 },
    { atSec: 2, durSec: 0.95, note: 43, gain: 0.5 },
    { atSec: 3, durSec: 0.95, note: 36, gain: 0.58 },
    { atSec: 4, durSec: 0.46, note: 43, gain: 0.5 },
    { atSec: 4.5, durSec: 1.42, note: 48, gain: 0.46 },
    { atSec: 6, durSec: 1.3, note: 36, gain: 0.6 },
  ],
}
// The two giants, five against two, as 5:2 in pitch too: C2 twice and a pure E3 five times.
const GIANTS_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.15, note: 36, gain: 0.62 },
    { atSec: 1.2, durSec: 1.15, note: 51.86, gain: 0.44 },
    { atSec: 2.4, durSec: 0.56, note: 51.86, gain: 0.44 },
    { atSec: 3, durSec: 0.56, note: 36, gain: 0.58 },
    { atSec: 3.6, durSec: 1.15, note: 51.86, gain: 0.44 },
    { atSec: 4.8, durSec: 1.15, note: 51.86, gain: 0.44 },
    { atSec: 6, durSec: 1.3, note: 36, gain: 0.6 },
  ],
}

// The chain put together by hand, in turns of 3 s: the outer four once round, 2 3 4 and 6; then 9 on D4 and
// 15 on B4 with them; then all seven meet as the chord, G5 the last to join.
const ASSEMBLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.45, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 0.95, note: 43, gain: 0.4 },
    { atSec: 0, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 0, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 0.5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 0.75, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 1, durSec: 0.95, note: 43, gain: 0.4 },
    { atSec: 1, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 1.5, durSec: 1.45, note: 36, gain: 0.5 },
    { atSec: 1.5, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 1.5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 2, durSec: 0.95, note: 43, gain: 0.4 },
    { atSec: 2, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 2.25, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 2.5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 3, durSec: 1.45, note: 36, gain: 0.5 },
    { atSec: 3, durSec: 0.95, note: 43, gain: 0.4 },
    { atSec: 3, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 3, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 3, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 3, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 3.2, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 3.333, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 3.4, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 3.5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 3.6, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 3.667, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 3.75, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 3.8, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 4, durSec: 0.95, note: 43, gain: 0.4 },
    { atSec: 4, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 4, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 4, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 4.2, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 4.333, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 4.4, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 4.5, durSec: 1.45, note: 36, gain: 0.5 },
    { atSec: 4.5, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 4.5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 4.6, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 4.667, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 4.8, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 5, durSec: 0.95, note: 43, gain: 0.4 },
    { atSec: 5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 5, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 5, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 5.2, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 5.25, durSec: 0.71, note: 48, gain: 0.36 },
    { atSec: 5.333, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 5.4, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 5.5, durSec: 0.46, note: 55, gain: 0.38 },
    { atSec: 5.6, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 5.667, durSec: 0.3, note: 62, gain: 0.34 },
    { atSec: 5.8, durSec: 0.19, note: 71, gain: 0.26 },
    { atSec: 6, durSec: 1.35, note: 36, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 43, gain: 0.4 },
    { atSec: 6, durSec: 1.35, note: 48, gain: 0.36 },
    { atSec: 6, durSec: 1.35, note: 55, gain: 0.38 },
    { atSec: 6, durSec: 1.35, note: 62, gain: 0.34 },
    { atSec: 6, durSec: 1.35, note: 71, gain: 0.28 },
    { atSec: 6, durSec: 1.35, note: 79, gain: 0.24 },
  ],
}

// Bells, bars, violas and violins are heard on the same orbits higher up, where they are made.
const raised = (phrase: Phrase, semitones: number): Phrase => ({
  notes: phrase.notes.map((note) => ({ ...note, note: note.note + semitones })),
})
// C3 G3 C4 G4 D5 B5 G6: the whole chain an octave up, and its chord.
const WHOLE_CHAIN_HIGH = raised(WHOLE_CHAIN, 12)
const RATIO_CHORD_HIGH = raised(RATIO_CHORD, 12)
const OUTER_FIVE_HIGH = raised(OUTER_FIVE, 12)
const MIDDLE_THREE_HIGH = raised(MIDDLE_THREE, 12)
const THREE_MOONS_HIGH = raised(THREE_MOONS, 12)
const TWO_TIDES_HIGH = raised(TWO_TIDES, 12)
// The six worlds a fifth up: A D G D A E.
const SIX_CHAIN_FIFTH = raised(SIX_CHAIN, 7)
// Two against three, tolled on C4 and G4.
const PAIR_TOLLED = raised(PAIR_BASS, 24)

export const PRESETS: readonly FactoryPreset[] = [
  // Sub bass: the outermost orbit, C2, and what two or three outer voices make on one string.
  {
    id: 'seven-orbits-twice-a-cycle',
    name: 'Twice a cycle',
    category: 'bass',
    description:
      'A sine turned square that fades over a few seconds, warmed by tape saturation and otherwise dry.',
    preview: FARTHEST_ALONE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pure sine',
      params: { volume: -17.5, shape: 1, harmonics: 0.1, attack: 0.04, decay: 4, release: 2.5 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 8 } }],
  },
  {
    id: 'seven-orbits-farthest-one-out',
    name: 'Farthest one out',
    category: 'drone',
    description:
      'A slow, dark sub drone with a deep phaser that turns twice in half a minute, at the back of a dark hall.',
    preview: FARTHEST_ALONE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dark drone',
      params: { volume: -17.5, harmonics: 0.4, attack: 1.3, release: 5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.0625, centerHz: 300 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'seven-orbits-all-meet-below',
    name: 'All meet below',
    category: 'bass',
    description:
      'A boom that falls an octave and a fifth onto its note and fades over seconds, with a dark cave behind it.',
    preview: PAIR_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Long boom',
      params: { volume: -14, drop: 19, fall: 260, decay: 4, harmonics: 0.35 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }],
  },
  {
    id: 'seven-orbits-two-against-three',
    name: 'Two against three',
    category: 'bass',
    description:
      'A soft fading pulse rich in harmonics, with clean even echoes a second apart: the unit two and three share.',
    preview: PAIR_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Soft pulse',
      params: { harmonics: 0.65, attack: 0.02, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 1000, feedback: 0.45, mix: 0.4 },
      },
    ],
  },
  {
    id: 'seven-orbits-low-gear-grit',
    name: 'Low gear grit',
    category: 'bass',
    description:
      'A driven short bass through a low-pass that each note opens and lets fall shut again.',
    preview: THREE_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Driven pulse',
      params: { volume: -13.5, drive: 0.7, decay: 1.1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 180, resonance: 2, envAmount: 60, envAttackMs: 20, envReleaseMs: 500 },
      },
    ],
  },
  {
    id: 'seven-orbits-ice-giant-exhales',
    name: 'Ice giant exhales',
    category: 'bass',
    description:
      'A soft bass that sighs down a fifth onto its note, with a long dark reverb that swells after it and goes.',
    preview: FARTHEST_ALONE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Falling sigh',
      params: { attack: 0.25, drop: 7, fall: 500, harmonics: 0.4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 0.45 } }],
  },
  {
    id: 'seven-orbits-five-turns-to-two',
    name: 'Five turns to two',
    category: 'bass',
    description:
      'A bass that glides between its notes, through a slow rotating cabinet where the drum is most of what is heard.',
    preview: GIANTS_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Gliding sub',
      params: { volume: -23, glide: 0.35, harmonics: 0.7, attack: 0.03 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum', params: { mix: 0.8 } }],
  },
  {
    id: 'seven-orbits-cratered-knock',
    name: 'Cratered knock',
    category: 'bass',
    description:
      'A hard short knock that drops an octave, half driven, with the splash of one narrow dark spring.',
    preview: THREE_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Hard knock',
      params: { volume: -10, drive: 0.5, drop: 12, decay: 0.9, release: 0.4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.45, decay: 3 } },
    ],
  },
  {
    id: 'seven-orbits-carrier-tone-received',
    name: 'Carrier tone received',
    category: 'bass',
    description:
      'A buzzing square bass for small speakers, played through a bedside radio and heard from across the room.',
    preview: GIANTS_BASS,
    instrument: { deviceId: 'sub-bass', preset: 'Small speaker hum', params: { release: 0.8 } },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'seven-orbits-hollow-outer-belt',
    name: 'Hollow outer belt',
    category: 'bass',
    description:
      'A hollow square bass with its top rolled off, its bands above the bass swaying from side to side.',
    preview: PAIR_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Hollow square',
      params: { volume: -20.5, attack: 0.15, release: 1.8, drive: 0.3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500 } },
      { deviceId: 'currents', preset: 'Side to side', params: { rate: 0.125, lowHold: 60 } },
    ],
  },
  {
    id: 'seven-orbits-slow-at-aphelion',
    name: 'Slow at aphelion',
    category: 'drone',
    description:
      'A sub that swells in over a second, with organ stops a fifth above and an octave below that speak most of a second late.',
    preview: FARTHEST_ALONE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Slow swell',
      params: { volume: -17.5, attack: 1, release: 3 },
    },
    effects: [{ deviceId: 'stops', preset: 'Open fifths', params: { speak: 700, mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-dust-lane',
    name: 'Dust lane',
    category: 'bass',
    description:
      'A fading bass thickened by a transformer that lifts its lows, then dulled by an old cassette.',
    preview: THREE_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dub weight',
      params: { volume: -16.5, drop: 0, decay: 1.6, harmonics: 0.4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
    ],
  },
  {
    id: 'seven-orbits-hop-to-the-next-orbit',
    name: 'Hop to the next orbit',
    category: 'bass',
    description:
      'A short thump with echoes half a second apart that jump up by a fifth and down by a fourth.',
    preview: PAIR_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Short thump',
      params: { volume: -9.5, decay: 1.2, harmonics: 0.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 500, mix: 0.4 } }],
  },
  {
    id: 'seven-orbits-dive-inside-the-rings',
    name: 'Dive inside the rings',
    category: 'bass',
    description:
      'A long bass that dives two octaves onto its note, in a cathedral that keeps only the lows.',
    preview: FARTHEST_ALONE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Deep dive',
      params: { volume: -14, drop: 24, fall: 600, decay: 6, harmonics: 0.3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 12, mix: 0.4 } }],
  },
  {
    id: 'seven-orbits-pedal-under-the-count',
    name: 'Pedal under the count',
    category: 'bass',
    description:
      'A bass with all its harmonics up, and low bowls tuned to C and G that its notes set ringing.',
    preview: PAIR_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pedal tone',
      params: { volume: -16.5, release: 0.5 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 0, register: 0.3, mix: 0.5 } },
    ],
  },
  {
    id: 'seven-orbits-locked-to-the-tide',
    name: 'Locked to the tide',
    category: 'bass',
    description:
      'A soft-edged sine with strong harmonics that rises and falls twice a second, chorused above the bass.',
    preview: THREE_BASS,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pure sine',
      params: { harmonics: 0.8, attack: 0.2, release: 2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2, depth: 0.8, phase: 60 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { hpHz: 120 } },
    ],
  },

  // Tine: the orbit of nine, D4, with the voices on either side of it.
  {
    id: 'seven-orbits-nine-to-the-cycle',
    name: 'Nine to the cycle',
    category: 'keys',
    description:
      'A tine piano without its tremolo, more bell than usual, and clean echoes two thirds of a second apart.',
    preview: MIDDLE_THREE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.65, tremolo: 0 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 667, feedback: 0.55, mix: 0.4, spread: 0.6 },
      },
    ],
  },
  {
    id: 'seven-orbits-scorched-side',
    name: 'Scorched side',
    category: 'keys',
    description: 'A hard barking tine piano pushed through a driven combo close to the microphone.',
    preview: THREE_MOONS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -13.5, tone: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { drive: 0.6, noise: 0 } },
    ],
  },
  {
    id: 'seven-orbits-felted-fifth-world',
    name: 'Felted fifth world',
    category: 'keys',
    description:
      'A dark felted tine, its attack blurred, with an organ stop an octave below that speaks just after it.',
    preview: MIDDLE_THREE,
    instrument: { deviceId: 'tine-piano', preset: 'Dark felt', params: { hardness: 0.25 } },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'seven-orbits-panned-by-its-period',
    name: 'Panned by its period',
    category: 'keys',
    description:
      'A long tine piano that pans over and back six times in half a minute, on a medium plate.',
    preview: ASSEMBLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremolo: 1, tremoloRate: 0.1875, tone: 0.65 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate' }],
  },
  {
    id: 'seven-orbits-near-meeting',
    name: 'Near meeting',
    category: 'keys',
    description:
      'A trembling, slightly driven tine piano spread into a three-voice ensemble and cleared of its lows.',
    preview: MORNING_STAR,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremoloRate: 5, bark: 0.7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'seven-orbits-dawn-before-the-sun',
    name: 'Dawn before the sun',
    category: 'keys',
    description:
      'Bell tines without their strike, fading in at each note, under a tail that comes back two octaves higher.',
    preview: MORNING_STAR,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { volume: -13.5, decay: 2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 120, depth: 1 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { shimmer: 0.45, mix: 0.4 } },
    ],
  },
  {
    id: 'seven-orbits-three-second-sky',
    name: 'Three second sky',
    category: 'bell',
    description:
      'Short glassy tines at full brightness, each scattered over three seconds as seven wide echoes.',
    preview: INNER_THREE,
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells' },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Scattered seven',
        params: { span: 3000, again: 0.35, mix: 0.5 },
      },
    ],
  },
  {
    id: 'seven-orbits-gear-teeth',
    name: 'Gear teeth',
    category: 'keys',
    description:
      'Dry stubby tines with eight even echoes, four tenths of a second apart, carried across from one side to the other.',
    preview: MIDDLE_THREE,
    instrument: { deviceId: 'tine-piano', preset: 'Short tines', params: { decay: 0.35 } },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 400, loss: 1.5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'seven-orbits-held-in-resonance',
    name: 'Held in resonance',
    category: 'keys',
    description:
      'Tines with the dampers off and slow octaves rising over them, left in a nave of eight seconds.',
    preview: THREE_MOONS,
    instrument: { deviceId: 'tine-piano', preset: 'Dampers off', params: { volume: -16.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { up2: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'seven-orbits-ocean-under-ice',
    name: 'Ocean under ice',
    category: 'keys',
    description:
      'A dull, endlessly ringing tine sunk well under water, with a few bubbles off the attacks.',
    preview: SIX_CHAIN,
    instrument: { deviceId: 'tine-piano', preset: 'Underwater keys', params: { volume: -17.5 } },
    effects: [{ deviceId: 'underwater', preset: 'Deep water', params: { bubbles: 0.5 } }],
  },
  {
    id: 'seven-orbits-precession',
    name: 'Precession',
    category: 'keys',
    description:
      'A tine that pans over and back in eight seconds, split so that one side drifts up and the other down by a few hertz.',
    preview: MIDDLE_THREE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { tremoloRate: 0.125, volume: -13 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Split sky',
        params: { fine: 2, feedback: 0.7, mix: 0.55 },
      },
    ],
  },
  {
    id: 'seven-orbits-fourteen-on-fifteen',
    name: 'Fourteen on fifteen',
    category: 'keys',
    description:
      'The tine pulses fourteen times in six seconds and a tremolo after it fifteen times, so the two drift apart and meet.',
    preview: OUTER_FIVE,
    instrument: { deviceId: 'tine-piano', preset: 'Deep throb', params: { tremoloRate: 2.333 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.5, depth: 0.9, drift: 0 } },
    ],
  },
  {
    id: 'seven-orbits-zodiacal-light',
    name: 'Zodiacal light',
    category: 'keys',
    description:
      'Fast shivering bell tines in a thin halo of high overtones that hangs on after them.',
    preview: SIX_CHAIN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { volume: -11, tremoloRate: 7.5 },
    },
    effects: [{ deviceId: 'haze', preset: 'Glass halo', params: { mix: 0.4 } }],
  },
  {
    id: 'seven-orbits-reed-from-a-giant',
    name: 'Reed from a giant',
    category: 'keys',
    description: 'A reedy barking tine, its flutter almost off, played inside an open pipe.',
    preview: THREE_MOONS,
    instrument: { deviceId: 'tine-piano', preset: 'Reedy flutter', params: { tremolo: 0.1 } },
    effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { air: 0.05, mix: 0.85 } }],
  },

  // Glass: the innermost orbit, G5, twenty-four to the cycle, and the pads the whole chain makes.
  {
    id: 'seven-orbits-innermost-chime',
    name: 'Innermost chime',
    category: 'bell',
    description:
      'A soft glass bell with clean repeats a quarter of a second apart, the gap of the quickest orbit.',
    preview: INNER_THREE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { brightness: 0.3, decay: 1.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 250, feedback: 0.65, mix: 0.45, spread: 0.8 },
      },
    ],
  },
  {
    id: 'seven-orbits-two-dozen-soft-pings',
    name: 'Two dozen soft pings',
    category: 'bell',
    description: 'Short fine pings of glass with their strike rounded, on a bright plate.',
    preview: WHOLE_CHAIN_HIGH,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { attack: 0.012, decay: 0.5, brightness: 0.4 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-crystal-sphere',
    name: 'Crystal sphere',
    category: 'pad',
    description:
      'A slow crystal pad whose bands of partials swell and fade by turns, nine times in half a minute.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { volume: -18.5, attack: 0.8, brightness: 0.5 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Slow weather', params: { rate: 0.281, depth: 1 } }],
  },
  {
    id: 'seven-orbits-frost-on-the-night-side',
    name: 'Frost on the night side',
    category: 'bell',
    description:
      'Icy chimes with a glass halo: their spectrum smeared, the lows cut from it, and shimmering as it hangs.',
    preview: INNER_THREE,
    instrument: { deviceId: 'fm-glass', preset: 'Ice chimes' },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { blur: 0.75, mix: 0.6 } },
    ],
  },
  {
    id: 'seven-orbits-bowl-at-syzygy',
    name: 'Bowl at syzygy',
    category: 'bell',
    description:
      'A temple bowl of slow decay with its own stretched, darkened double an octave below.',
    preview: MORNING_STAR,
    instrument: { deviceId: 'fm-glass', preset: 'Temple bowl', params: { volume: -13.5 } },
    effects: [{ deviceId: 'warp', preset: 'Bell below', params: { mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-fifteen-tick-keys',
    name: 'Fifteen tick keys',
    category: 'keys',
    description:
      'Dry tine-like keys with grain echoes every four tenths of a second, the gap of fifteen strokes.',
    preview: TWO_TIDES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { volume: -4.5, decay: 0.7, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Pulsing repeat',
        params: { time: 400, feedback: 0.6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'seven-orbits-slow-transit',
    name: 'Slow transit',
    category: 'pad',
    description:
      'A slowly rising glass pad that circles the head four times in half a minute and fades on the far side.',
    preview: RATIO_CHORD,
    instrument: { deviceId: 'fm-glass', preset: 'Slow glass', params: { attack: 1.4 } },
    effects: [{ deviceId: 'around', preset: 'Far side fades', params: { rate: 0.125 } }],
  },
  {
    id: 'seven-orbits-toy-planets-on-wires',
    name: 'Toy planets on wires',
    category: 'keys',
    description:
      'A short toy piano of glass, glazed by an early sampler, with a hint of spring behind it.',
    preview: WHOLE_CHAIN_HIGH,
    instrument: { deviceId: 'fm-glass', preset: 'Toy keys', params: { decay: 0.4 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 11000 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'seven-orbits-organ-of-the-ratios',
    name: 'Organ of the ratios',
    category: 'organ',
    description:
      'A glass organ through a slow rotary cabinet, its horn and its drum turning at their own speeds.',
    preview: MIDDLE_THREE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { volume: -18, brightness: 0.45 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { hornDepth: 0.85 } }],
  },
  {
    id: 'seven-orbits-brown-dwarf',
    name: 'Brown dwarf',
    category: 'bell',
    description: 'A dark, clangorous gong in a long reverb that keeps sinking by octaves.',
    preview: THREE_MOONS,
    instrument: { deviceId: 'fm-glass', preset: 'Dark gong', params: { brightness: 0.45 } },
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'seven-orbits-arc-of-the-ring',
    name: 'Arc of the ring',
    category: 'pad',
    description: 'Bowed metal in FM with a slow flanger that sweeps it twice in half a minute.',
    preview: OUTER_FIVE,
    instrument: { deviceId: 'fm-glass', preset: 'Bowed metal' },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0625, feedback: 60 } },
    ],
  },
  {
    id: 'seven-orbits-middle-world-bars',
    name: 'Middle world bars',
    category: 'bell',
    description:
      'Chime bars answered by two more players, one a second later and an octave up, one two seconds later.',
    preview: MORNING_STAR,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { volume: -8.5, decay: 1.8, release: 2 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Round of three',
        params: { followers: 2, gap: 1, interval1: 12, fade: 0.1, spread: 1 },
      },
    ],
  },
  {
    id: 'seven-orbits-warm-gas',
    name: 'Warm gas',
    category: 'pad',
    description:
      'A wide, thickly detuned glass pad with a six-stage phaser moving through it twice in half a minute.',
    preview: OUTER_FIVE,
    instrument: { deviceId: 'fm-glass', preset: 'Warm glass pad' },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0625, feedback: 65 } }],
  },
  {
    id: 'seven-orbits-rubbed-rim-of-light',
    name: 'Rubbed rim of light',
    category: 'pad',
    description: 'Rubbed glass in a hall whose tail sings a high thin vowel.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { brightness: 0.55, detune: 20, spread: 1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High ee', params: { mix: 0.55 } }],
  },

  // String machine: the orbit of three, G2, long tones that hold the count together.
  {
    id: 'seven-orbits-three-long-bows',
    name: 'Three long bows',
    category: 'string',
    description:
      'Low ensemble strings behind two slow gates, open on two steps of every three, that drift apart.',
    preview: OUTER_BED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { volume: -3.5, attack: 0.4, release: 1.2, tone: 2000 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Long tide',
        params: { rate: 1, steps: 3, fill: 2, drift: 0.5, floor: 0.2 },
      },
    ],
  },
  {
    id: 'seven-orbits-fog-over-two-orbits',
    name: 'Fog over two orbits',
    category: 'drone',
    description:
      'A low dark fog of strings in a hall whose bass rings four times as long as its middle.',
    preview: OUTER_BED,
    instrument: { deviceId: 'string-machine', preset: 'Low fog', params: { attack: 1.2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-lit-from-within',
    name: 'Lit from within',
    category: 'string',
    description: 'High glassy strings that throw off a few long sparks two octaves up.',
    preview: RATIO_CHORD,
    instrument: { deviceId: 'string-machine', preset: 'Glass', params: { attack: 0.7 } },
    effects: [{ deviceId: 'glints', preset: 'Slow stars', params: { density: 2, mix: 0.4 } }],
  },
  {
    id: 'seven-orbits-chart-in-plain-saws',
    name: 'Chart in plain saws',
    category: 'string',
    description: 'Dry mono sawtooth strings with murky bucket-brigade echoes a second apart.',
    preview: SIX_CHAIN,
    instrument: { deviceId: 'string-machine', preset: 'Dry saws', params: { tone: 2600 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { time: 1000 } }],
  },
  {
    id: 'seven-orbits-seven-keys-down',
    name: 'Seven keys down',
    category: 'organ',
    description:
      'An organ-like string tone, three octaves and no ensemble, through a hollow feedback chorus.',
    preview: ASSEMBLED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { volume: -9, release: 0.6, tone: 5000 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.1875 } }],
  },
  {
    id: 'seven-orbits-a-very-long-year',
    name: 'A very long year',
    category: 'pad',
    description:
      'Wide slow ensemble strings that a slow breath opens over three seconds and closes over five.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.8, tone: 1700 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { in: 3, hold: 0.5, out: 5, depth: 0.8 } },
    ],
  },
  {
    id: 'seven-orbits-violas-in-passing',
    name: 'Violas in passing',
    category: 'string',
    description:
      'Plain unison violas that come close and go by in a circle, six times in half a minute.',
    preview: OUTER_FIVE_HIGH,
    instrument: { deviceId: 'string-machine', preset: 'Violas', params: { volume: 2 } },
    effects: [{ deviceId: 'around', preset: 'Passing by', params: { rate: 0.1875 } }],
  },
  {
    id: 'seven-orbits-gap-in-the-belt',
    name: 'Gap in the belt',
    category: 'string',
    description:
      'Hollow strings with a notch that wanders through them four times in half a minute.',
    preview: RATIO_CHORD,
    instrument: { deviceId: 'string-machine', preset: 'Hollow strings' },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.125, resonance: 0.6 },
      },
    ],
  },
  {
    id: 'seven-orbits-triple-conjunction',
    name: 'Triple conjunction',
    category: 'string',
    description:
      'Strings in three octaves at once through the whole of their ensemble, on a long dark plate.',
    preview: SIX_CHAIN,
    instrument: { deviceId: 'string-machine', preset: 'Three octaves', params: { volume: -9 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.5, decay: 0.85 } },
    ],
  },
  {
    id: 'seven-orbits-coasting-outward',
    name: 'Coasting outward',
    category: 'drone',
    description:
      'Long cello swells with pure sines an octave above their strongest partials, following late and lingering.',
    preview: OUTER_BED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 1.5, release: 4 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-off-the-ratio',
    name: 'Off the ratio',
    category: 'string',
    description:
      'Detuned ensemble strings on a slow seasick tape, so the ratios are only nearly whole.',
    preview: THREE_MOONS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.25, release: 1.2 },
    },
    effects: [{ deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.1 } }],
  },
  {
    id: 'seven-orbits-seen-from-far-off',
    name: 'Seen from far off',
    category: 'string',
    description: 'Muted high strings on a far shore, most of them the room they are heard across.',
    preview: RATIO_CHORD_HIGH,
    instrument: { deviceId: 'string-machine', preset: 'Muted violins', params: { attack: 0.5 } },
    effects: [{ deviceId: 'distance', preset: 'Far shore', params: { wander: 0.5, rate: 0.125 } }],
  },
  {
    id: 'seven-orbits-basses-of-the-chain',
    name: 'Basses of the chain',
    category: 'bass',
    description:
      'A dark bowed bass with its octave below, sounding inside a long stopped pipe of metal.',
    preview: OUTER_BED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { volume: -2.5, tone: 700 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { air: 0.1 } }],
  },
  {
    id: 'seven-orbits-the-quick-one-reversed',
    name: 'The quick one, reversed',
    category: 'string',
    description:
      'Bright shimmering high strings with slow reversed swells of what they just played.',
    preview: MIDDLE_THREE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -6, attack: 0.06, release: 0.8 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1500, mix: 0.6 } },
    ],
  },

  // Bells: the orbit of fifteen, B4, and everything struck once and left to come round.
  {
    id: 'seven-orbits-seven-bowls-turning',
    name: 'Seven bowls turning',
    category: 'bell',
    description:
      'Singing bowls struck with a little more edge, on a faint plate that answers late.',
    preview: WHOLE_CHAIN_HIGH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { volume: -4.5, hardness: 0.65, decay: 5, brightness: 0.65 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.25 } }],
  },
  {
    id: 'seven-orbits-one-turn-of-the-rim',
    name: 'One turn of the rim',
    category: 'drone',
    description:
      'A rubbed bowl that sings as long as it is held and goes round the head once in sixteen seconds.',
    preview: RATIO_CHORD_HIGH,
    instrument: { deviceId: 'modal-bells', preset: 'Rubbed bowl', params: { detune: 1.5 } },
    effects: [{ deviceId: 'around', preset: 'Slow circle', params: { rate: 0.0625, radius: 1 } }],
  },
  {
    id: 'seven-orbits-bell-of-the-meeting',
    name: 'Bell of the meeting',
    category: 'bell',
    description: 'A church bell struck and left to ring in a cavern made of short echoes.',
    preview: MORNING_STAR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: 0, decay: 10, hardness: 0.5, brightness: 0.7 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-vibes-in-three-gears',
    name: 'Vibes in three gears',
    category: 'bell',
    description:
      'Soft vibraphone bars with a harmonic tremolo that trades lows for highs three times a second.',
    preview: MIDDLE_THREE_HIGH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -1.5, hardness: 0.45 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3, depth: 1 } }],
  },
  {
    id: 'seven-orbits-clockwork-in-a-cabinet',
    name: 'Clockwork in a cabinet',
    category: 'bell',
    description: 'A music box with a hard strike, worn onto a dusty record.',
    preview: WHOLE_CHAIN_HIGH,
    instrument: { deviceId: 'modal-bells', preset: 'Music box', params: { volume: -1.5 } },
    effects: [{ deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.2 } }],
  },
  {
    id: 'seven-orbits-small-moons-small-loops',
    name: 'Small moons, small loops',
    category: 'plucked',
    description:
      'A kalimba caught by three short loops of unequal length that turn against one another.',
    preview: THREE_MOONS_HIGH,
    instrument: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -3.5 } },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Short canon',
        params: { length: 0.8, feedback: 0.75, mix: 0.5 },
      },
    ],
  },
  {
    id: 'seven-orbits-ratios-on-wet-glass',
    name: 'Ratios on wet glass',
    category: 'pad',
    description:
      'A glass harp that sings while it is held, with a still halo of itself hanging after it.',
    preview: RATIO_CHORD_HIGH,
    instrument: { deviceId: 'modal-bells', preset: 'Glass harp' },
    effects: [{ deviceId: 'melt', preset: 'Still halo', params: { hold: 8, mix: 0.55 } }],
  },
  {
    id: 'seven-orbits-gong-at-mid-cycle',
    name: 'Gong at mid cycle',
    category: 'bell',
    description: 'A softly struck gong in a reverb whose tail sinks for as long as it rings.',
    preview: OUTER_FIVE_HIGH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 3, brightness: 0.35 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-tapped-ring-of-ice',
    name: 'Tapped ring of ice',
    category: 'bell',
    description:
      'Tapped glass split into eight bands that come back scattered over more than a second.',
    preview: INNER_THREE,
    instrument: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -4.5 } },
    effects: [{ deviceId: 'prism', preset: 'Scattered notes', params: { mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-aurora-in-tiles',
    name: 'Aurora in tiles',
    category: 'texture',
    description:
      'Shivering glass whose last second returns in slow overlapping tiles, higher and lower at once.',
    preview: SIX_CHAIN_FIFTH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: 0, decay: 4 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Slow tiles' }],
  },
  {
    id: 'seven-orbits-bell-behind-the-disc',
    name: 'Bell behind the disc',
    category: 'bell',
    description: 'A dark distant bell with its attack gone in a bank of fog.',
    preview: PAIR_TOLLED,
    instrument: { deviceId: 'modal-bells', preset: 'Distant bell', params: { volume: 4 } },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
  },
  {
    id: 'seven-orbits-wood-for-two-tides',
    name: 'Wood for two tides',
    category: 'plucked',
    description: 'Dry wooden bars over a soundboard that rings with them.',
    preview: TWO_TIDES_HIGH,
    instrument: { deviceId: 'modal-bells', preset: 'Wood bars', params: { volume: 6, decay: 0.8 } },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.8 } }],
  },
  {
    id: 'seven-orbits-out-in-the-solar-wind',
    name: 'Out in the solar wind',
    category: 'bell',
    description: 'Bright wind chimes left out in gusts that move their level and their tone.',
    preview: INNER_THREE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -2, decay: 4 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.15, pace: 2 } }],
  },

  // Wavetable: the orbit of four, C3, pads for the middle of the chain.
  {
    id: 'seven-orbits-fourth-orbit-at-dawn',
    name: 'Fourth orbit at dawn',
    category: 'pad',
    description:
      'A glass wavetable pad that moves once through its table in eight seconds, widened by copies tuned a little above and below.',
    preview: OUTER_FIVE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { attack: 0.5, rate: 0.125, motion: 0.9 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Wider' }],
  },
  {
    id: 'seven-orbits-choir-of-periods',
    name: 'Choir of periods',
    category: 'voice',
    description:
      'A vowel pad that moves through its mouth shapes twice in half a minute, in a low chanting hall.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.9, rate: 0.0625 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks' }],
  },
  {
    id: 'seven-orbits-reed-at-resonance',
    name: 'Reed at resonance',
    category: 'organ',
    description: 'A reedy organ tone pushed through a valve preamp that gives it an edge.',
    preview: SIX_CHAIN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { volume: -15, attack: 0.04, release: 0.7 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Tube preamp' }],
  },
  {
    id: 'seven-orbits-hollow-ringlet',
    name: 'Hollow ringlet',
    category: 'drone',
    description: 'A hollow drifting pad whose middle beats three times a second between the ears.',
    preview: OUTER_BED,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { volume: -3, attack: 1, rate: 0.0938 },
    },
    effects: [{ deviceId: 'ear-shift', preset: 'Three, mid band', params: { low: 100 } }],
  },
  {
    id: 'seven-orbits-halo-at-totality',
    name: 'Halo at totality',
    category: 'pad',
    description:
      'A spectral cloud that opens over two seconds into a long, thin space without lows.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 2, release: 4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air' }],
  },
  {
    id: 'seven-orbits-beating-of-the-tides',
    name: 'Beating of the tides',
    category: 'keys',
    description:
      'Two plain sines detuned against each other and gated left, then right, two and a half times a second.',
    preview: TWO_TIDES,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { volume: -6.5, attack: 0.02, release: 0.5 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Left then right', params: { rate: 5 } }],
  },
  {
    id: 'seven-orbits-voices-of-the-belt',
    name: 'Voices of the belt',
    category: 'voice',
    description:
      'Fluttering vowels multiplied into a drifting flock, each copy with its own distance.',
    preview: THREE_MOONS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Vowel flutter',
      params: { rate: 3, attack: 0.15, release: 1.5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'seven-orbits-old-red-sun',
    name: 'Old red sun',
    category: 'pad',
    description: 'Thick detuned saws behind a dark low-pass that moves once in sixteen seconds.',
    preview: OUTER_FIVE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.4, release: 2 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0625, cutoffHz: 450 },
      },
    ],
  },
  {
    id: 'seven-orbits-beacon-inner-system',
    name: 'Beacon, inner system',
    category: 'plucked',
    description: 'A narrow pulse, short and plain, with echoes at two heads of a tape.',
    preview: INNER_THREE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { release: 0.25, cutoff: 3000 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 750, mix: 0.45 } },
    ],
  },

  // Harp: the orbit of six, G3, plucked.
  {
    id: 'seven-orbits-harp-of-seven-strings',
    name: 'Harp of seven strings',
    category: 'plucked',
    description: 'A concert harp with strings tuned to C major ringing for ten seconds behind it.',
    preview: WHOLE_CHAIN,
    instrument: { deviceId: 'harp', preset: 'Concert harp' },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.45 } }],
  },
  {
    id: 'seven-orbits-nail-near-the-star',
    name: 'Nail near the star',
    category: 'plucked',
    description:
      'A harp plucked hard by the soundboard, short and bright, in a quick twanging spring.',
    preview: TWO_TIDES,
    instrument: { deviceId: 'harp', preset: 'Near the soundboard', params: { volume: 3.5 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.4 } }],
  },
  {
    id: 'seven-orbits-evening-apparition',
    name: 'Evening apparition',
    category: 'plucked',
    description:
      'A soft long-ringing harp in a reverb of most of half a minute that darkens and slides down an octave.',
    preview: MORNING_STAR,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { volume: 3 } },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-one-follows-an-octave-on',
    name: 'One follows an octave on',
    category: 'plucked',
    description: 'A damped harp and one follower, a second behind it and an octave below.',
    preview: MIDDLE_THREE,
    instrument: { deviceId: 'harp', preset: 'Muted harp' },
    effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { gap: 1, mix: 0.5 } }],
  },
  {
    id: 'seven-orbits-silk-on-two-clocks',
    name: 'Silk on two clocks',
    category: 'plucked',
    description:
      'Long koto strings levelled by a limiter, whose echoes land closer together each time and cross from one side to the other.',
    preview: MORNING_STAR,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { touch: 0.35, pluck: 0.2, body: 0.9, decay: 2, volume: 4 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 24, outputGain: -10 } },
      { deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'seven-orbits-bent-into-its-place',
    name: 'Bent into its place',
    category: 'plucked',
    description:
      'Soft silk strings pressed a quarter tone sharp after the pluck, each attack faded in as if bowed.',
    preview: THREE_MOONS,
    instrument: { deviceId: 'harp', preset: 'Soft silk', params: { volume: 5 } },
    effects: [{ deviceId: 'swell', preset: 'Slow attack' }],
  },
  {
    id: 'seven-orbits-wire-round-the-sun',
    name: 'Wire round the sun',
    category: 'plucked',
    description:
      'Steel guzheng strings that ring on and on, with a slow hollow flanger in their shimmer.',
    preview: INNER_THREE,
    instrument: { deviceId: 'harp', preset: 'Steel shimmer', params: { volume: 3.5 } },
    effects: [{ deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.0938 } }],
  },

  // Droplets: a drop for every stroke of one orbit, the seven rates of a 6 s cycle.
  {
    id: 'seven-orbits-two-drops-a-cycle',
    name: 'Two drops a cycle',
    category: 'texture',
    description:
      'One deep water drop every three seconds on whatever is held, ringing long over a low splash.',
    preview: OUTER_BED,
    instrument: { deviceId: 'droplets', preset: 'Deep pool', params: { rain: 0.333, loose: 0 } },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.4 } }],
  },
  {
    id: 'seven-orbits-three-drops-on-wood',
    name: 'Three drops on wood',
    category: 'texture',
    description: 'A large wooden drop every two seconds, ringing long inside a clay pot.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { rain: 0.5, size: 0.9, ring: 3 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-four-felted-drops',
    name: 'Four felted drops',
    category: 'texture',
    description:
      'Felt drops, one every second and a half, with dark tape echoes a second apart trailing behind.',
    preview: RATIO_CHORD,
    instrument: { deviceId: 'droplets', preset: 'Felt pulse', params: { rain: 0.667, ring: 3 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1000 } }],
  },
  {
    id: 'seven-orbits-six-drops-of-metal',
    name: 'Six drops of metal',
    category: 'texture',
    description: 'Metal drops, one a second over two octaves, on a plate without any damping.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { volume: -4, rain: 1, loose: 0 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate' }],
  },
  {
    id: 'seven-orbits-nine-drops-on-water',
    name: 'Nine drops on water',
    category: 'texture',
    description:
      'Water drops three every two seconds, copied by a chorus that wobbles like a warped tape.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: { volume: 0, rain: 1.5, loose: 0, splash: 0.2 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Warped tape' }],
  },
  {
    id: 'seven-orbits-fifteen-glass-drops',
    name: 'Fifteen glass drops',
    category: 'texture',
    description:
      'Glass drops two and a half a second over two octaves, each repeated an octave higher in grains.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass pulse',
      params: { rain: 2.5, size: 0.5, ring: 2 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { time: 400, mix: 0.45 } }],
  },
  {
    id: 'seven-orbits-glitter-close-in',
    name: 'Glitter close in',
    category: 'texture',
    description:
      'Tiny glass drops, four a second across three octaves, hanging on as a blur of the upper air.',
    preview: RATIO_CHORD,
    instrument: {
      deviceId: 'droplets',
      preset: 'High glitter',
      params: { volume: -0.5, rain: 4, loose: 0 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'High air', params: { mix: 0.5 } }],
  },

  // Felt piano: the hand that assembles the cycle, a voice at a time.
  {
    id: 'seven-orbits-six-to-the-cycle',
    name: 'Six to the cycle',
    category: 'keys',
    description: 'A close felt piano with one soft slap of tape after each note.',
    preview: MIDDLE_THREE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.75, reverbMix: 0.05, outputDb: -8 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { time: 125, mix: 0.45 } }],
  },
  {
    id: 'seven-orbits-bare-arithmetic',
    name: 'Bare arithmetic',
    category: 'keys',
    description:
      'A piano without felt, each strike set a little after its own tone and scattered to the sides.',
    preview: ASSEMBLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.7, width: 0.8, outputDb: -12 },
    },
    effects: [{ deviceId: 'sift', preset: 'Strike just after', params: { late: 60 } }],
  },
  {
    id: 'seven-orbits-from-spring-to-neap',
    name: 'From spring to neap',
    category: 'keys',
    description:
      'A half-pedalled piano with nine sympathetic strings tuned to A minor that its notes set ringing.',
    preview: TWO_TIDES,
    instrument: { deviceId: 'felt-piano', preset: 'Half pedal', params: { outputDb: -18.5 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Hammered', params: { root: 9, mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-strings-in-true-ratio',
    name: 'Strings in true ratio',
    category: 'keys',
    description:
      'A piano of plain strings, no detuning and no stiffness, with a soft string pad growing behind it.',
    preview: RATIO_CHORD,
    instrument: { deviceId: 'felt-piano', preset: 'Still strings' },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 2, mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-nebula-over-the-keys',
    name: 'Nebula over the keys',
    category: 'keys',
    description:
      'A blurred wash of soft piano over itself at half speed, an octave down, run together into one smooth bed.',
    preview: THREE_MOONS,
    instrument: { deviceId: 'felt-piano', preset: 'Blurred wash', params: { outputDb: -5 } },
    effects: [{ deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.6 } }],
  },
  {
    id: 'seven-orbits-upright-in-hard-light',
    name: 'Upright in hard light',
    category: 'keys',
    description:
      'A glassy stiff upright, followed three quarters of a second apart by copies an octave up and an octave down.',
    preview: MORNING_STAR,
    instrument: { deviceId: 'felt-piano', preset: 'Glass upright', params: { outputDb: -4 } },
    effects: [{ deviceId: 'canon', preset: 'Octaves apart', params: { gap: 0.75, mix: 0.5 } }],
  },
]
