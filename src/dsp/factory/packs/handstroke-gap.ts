import { type FactoryPreset, type Phrase } from '../types'

// Bells in rounds and changes, with the one silent place ringers leave before every handstroke row.
// Laid out by eight rings (glass, hand-played steel, twin bars, tower metal, mallets, gated tones, glow
// and felt) and by where one stands: at the rope, in the chamber, under the louvres, across the fields.

// Rounds on eight, C6 down to C5: a handstroke row, a backstroke row, the silent place, and the next handstroke.
// Seventeen places to a breath.
const ROUNDS_ON_EIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 84, gain: 0.7 },
    { atSec: 0.28, durSec: 0.9, note: 83, gain: 0.62 },
    { atSec: 0.56, durSec: 0.9, note: 81, gain: 0.62 },
    { atSec: 0.84, durSec: 0.9, note: 79, gain: 0.62 },
    { atSec: 1.12, durSec: 0.9, note: 77, gain: 0.62 },
    { atSec: 1.4, durSec: 0.9, note: 76, gain: 0.62 },
    { atSec: 1.68, durSec: 0.9, note: 74, gain: 0.62 },
    { atSec: 1.96, durSec: 0.9, note: 72, gain: 0.62 },
    { atSec: 2.24, durSec: 0.9, note: 84, gain: 0.62 },
    { atSec: 2.52, durSec: 0.9, note: 83, gain: 0.54 },
    { atSec: 2.8, durSec: 0.9, note: 81, gain: 0.54 },
    { atSec: 3.08, durSec: 0.9, note: 79, gain: 0.54 },
    { atSec: 3.36, durSec: 0.9, note: 77, gain: 0.54 },
    { atSec: 3.64, durSec: 0.9, note: 76, gain: 0.54 },
    { atSec: 3.92, durSec: 0.9, note: 74, gain: 0.54 },
    { atSec: 4.2, durSec: 0.9, note: 72, gain: 0.54 },
    { atSec: 4.76, durSec: 0.9, note: 84, gain: 0.7 },
    { atSec: 5.04, durSec: 0.9, note: 83, gain: 0.62 },
    { atSec: 5.32, durSec: 0.9, note: 81, gain: 0.62 },
    { atSec: 5.6, durSec: 0.9, note: 79, gain: 0.62 },
    { atSec: 5.88, durSec: 0.9, note: 77, gain: 0.62 },
    { atSec: 6.16, durSec: 0.9, note: 76, gain: 0.62 },
    { atSec: 6.44, durSec: 0.9, note: 74, gain: 0.62 },
    { atSec: 6.72, durSec: 0.66, note: 72, gain: 0.62 },
  ],
}

// Plain hunt on five (E D C A G) from the first handstroke: 21435 24153, the gap, 42513 45231. Eleven places to a breath.
const HUNT_ON_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 74, gain: 0.7 },
    { atSec: 0.32, durSec: 1.2, note: 76, gain: 0.62 },
    { atSec: 0.64, durSec: 1.2, note: 69, gain: 0.62 },
    { atSec: 0.96, durSec: 1.2, note: 72, gain: 0.62 },
    { atSec: 1.28, durSec: 1.2, note: 67, gain: 0.62 },
    { atSec: 1.6, durSec: 1.2, note: 74, gain: 0.62 },
    { atSec: 1.92, durSec: 1.2, note: 69, gain: 0.54 },
    { atSec: 2.24, durSec: 1.2, note: 76, gain: 0.54 },
    { atSec: 2.56, durSec: 1.2, note: 67, gain: 0.54 },
    { atSec: 2.88, durSec: 1.2, note: 72, gain: 0.54 },
    { atSec: 3.52, durSec: 1.2, note: 69, gain: 0.7 },
    { atSec: 3.84, durSec: 1.2, note: 74, gain: 0.62 },
    { atSec: 4.16, durSec: 1.2, note: 67, gain: 0.62 },
    { atSec: 4.48, durSec: 1.2, note: 76, gain: 0.62 },
    { atSec: 4.8, durSec: 1.2, note: 72, gain: 0.62 },
    { atSec: 5.12, durSec: 1.2, note: 69, gain: 0.62 },
    { atSec: 5.44, durSec: 1.2, note: 67, gain: 0.54 },
    { atSec: 5.76, durSec: 1.2, note: 74, gain: 0.54 },
    { atSec: 6.08, durSec: 1.2, note: 72, gain: 0.54 },
    { atSec: 6.4, durSec: 0.98, note: 76, gain: 0.54 },
  ],
}

// The same five an octave down and slower: the last row of rounds at backstroke, the gap, and the first two changes.
const LAST_OF_ROUNDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.62 },
    { atSec: 0.44, durSec: 1.6, note: 62, gain: 0.54 },
    { atSec: 0.88, durSec: 1.6, note: 60, gain: 0.54 },
    { atSec: 1.32, durSec: 1.6, note: 57, gain: 0.54 },
    { atSec: 1.76, durSec: 1.6, note: 55, gain: 0.54 },
    { atSec: 2.64, durSec: 1.6, note: 62, gain: 0.7 },
    { atSec: 3.08, durSec: 1.6, note: 64, gain: 0.62 },
    { atSec: 3.52, durSec: 1.6, note: 57, gain: 0.62 },
    { atSec: 3.96, durSec: 1.6, note: 60, gain: 0.62 },
    { atSec: 4.4, durSec: 1.6, note: 55, gain: 0.62 },
    { atSec: 4.84, durSec: 1.6, note: 62, gain: 0.62 },
    { atSec: 5.28, durSec: 1.6, note: 57, gain: 0.54 },
    { atSec: 5.72, durSec: 1.6, note: 64, gain: 0.54 },
    { atSec: 6.16, durSec: 1.22, note: 55, gain: 0.54 },
    { atSec: 6.6, durSec: 0.78, note: 60, gain: 0.54 },
  ],
}

// Six bells, A5 down to C5: rounds at backstroke, the gap, 214365 241635, the gap, 426153.
const HUNT_ON_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 81, gain: 0.62 },
    { atSec: 0.27, durSec: 1, note: 79, gain: 0.54 },
    { atSec: 0.54, durSec: 1, note: 77, gain: 0.54 },
    { atSec: 0.81, durSec: 1, note: 76, gain: 0.54 },
    { atSec: 1.08, durSec: 1, note: 74, gain: 0.54 },
    { atSec: 1.35, durSec: 1, note: 72, gain: 0.54 },
    { atSec: 1.89, durSec: 1, note: 79, gain: 0.7 },
    { atSec: 2.16, durSec: 1, note: 81, gain: 0.62 },
    { atSec: 2.43, durSec: 1, note: 76, gain: 0.62 },
    { atSec: 2.7, durSec: 1, note: 77, gain: 0.62 },
    { atSec: 2.97, durSec: 1, note: 72, gain: 0.62 },
    { atSec: 3.24, durSec: 1, note: 74, gain: 0.62 },
    { atSec: 3.51, durSec: 1, note: 79, gain: 0.62 },
    { atSec: 3.78, durSec: 1, note: 76, gain: 0.54 },
    { atSec: 4.05, durSec: 1, note: 81, gain: 0.54 },
    { atSec: 4.32, durSec: 1, note: 72, gain: 0.54 },
    { atSec: 4.59, durSec: 1, note: 77, gain: 0.54 },
    { atSec: 4.86, durSec: 1, note: 74, gain: 0.54 },
    { atSec: 5.4, durSec: 1, note: 76, gain: 0.7 },
    { atSec: 5.67, durSec: 1, note: 79, gain: 0.62 },
    { atSec: 5.94, durSec: 1, note: 72, gain: 0.62 },
    { atSec: 6.21, durSec: 1, note: 81, gain: 0.62 },
    { atSec: 6.48, durSec: 0.9, note: 74, gain: 0.62 },
    { atSec: 6.75, durSec: 0.63, note: 77, gain: 0.62 },
  ],
}

// Tittums on eight, 15263748, from C5: two scales laced together, two rows, the gap and the next.
const TITTUMS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 72, gain: 0.7 },
    { atSec: 0.28, durSec: 1.1, note: 65, gain: 0.62 },
    { atSec: 0.56, durSec: 1.1, note: 71, gain: 0.62 },
    { atSec: 0.84, durSec: 1.1, note: 64, gain: 0.62 },
    { atSec: 1.12, durSec: 1.1, note: 69, gain: 0.62 },
    { atSec: 1.4, durSec: 1.1, note: 62, gain: 0.62 },
    { atSec: 1.68, durSec: 1.1, note: 67, gain: 0.62 },
    { atSec: 1.96, durSec: 1.1, note: 60, gain: 0.62 },
    { atSec: 2.24, durSec: 1.1, note: 72, gain: 0.62 },
    { atSec: 2.52, durSec: 1.1, note: 65, gain: 0.54 },
    { atSec: 2.8, durSec: 1.1, note: 71, gain: 0.54 },
    { atSec: 3.08, durSec: 1.1, note: 64, gain: 0.54 },
    { atSec: 3.36, durSec: 1.1, note: 69, gain: 0.54 },
    { atSec: 3.64, durSec: 1.1, note: 62, gain: 0.54 },
    { atSec: 3.92, durSec: 1.1, note: 67, gain: 0.54 },
    { atSec: 4.2, durSec: 1.1, note: 60, gain: 0.54 },
    { atSec: 4.76, durSec: 1.1, note: 72, gain: 0.7 },
    { atSec: 5.04, durSec: 1.1, note: 65, gain: 0.62 },
    { atSec: 5.32, durSec: 1.1, note: 71, gain: 0.62 },
    { atSec: 5.6, durSec: 1.1, note: 64, gain: 0.62 },
    { atSec: 5.88, durSec: 1.1, note: 69, gain: 0.62 },
    { atSec: 6.16, durSec: 1.1, note: 62, gain: 0.62 },
    { atSec: 6.44, durSec: 0.94, note: 67, gain: 0.62 },
    { atSec: 6.72, durSec: 0.66, note: 60, gain: 0.62 },
  ],
}

// Triples: seven bells hunt while the tenor, C4, strikes last in every row. The last row of rounds, the gap, two changes.
const TENOR_BEHIND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 72, gain: 0.56 },
    { atSec: 0.28, durSec: 1.1, note: 71, gain: 0.48 },
    { atSec: 0.56, durSec: 1.1, note: 69, gain: 0.48 },
    { atSec: 0.84, durSec: 1.1, note: 67, gain: 0.48 },
    { atSec: 1.12, durSec: 1.1, note: 65, gain: 0.48 },
    { atSec: 1.4, durSec: 1.1, note: 64, gain: 0.48 },
    { atSec: 1.68, durSec: 1.1, note: 62, gain: 0.48 },
    { atSec: 1.96, durSec: 1.1, note: 60, gain: 0.64 },
    { atSec: 2.52, durSec: 1.1, note: 71, gain: 0.62 },
    { atSec: 2.8, durSec: 1.1, note: 72, gain: 0.54 },
    { atSec: 3.08, durSec: 1.1, note: 67, gain: 0.54 },
    { atSec: 3.36, durSec: 1.1, note: 69, gain: 0.54 },
    { atSec: 3.64, durSec: 1.1, note: 64, gain: 0.54 },
    { atSec: 3.92, durSec: 1.1, note: 65, gain: 0.54 },
    { atSec: 4.2, durSec: 1.1, note: 62, gain: 0.54 },
    { atSec: 4.48, durSec: 1.1, note: 60, gain: 0.7 },
    { atSec: 4.76, durSec: 1.1, note: 71, gain: 0.56 },
    { atSec: 5.04, durSec: 1.1, note: 67, gain: 0.48 },
    { atSec: 5.32, durSec: 1.1, note: 72, gain: 0.48 },
    { atSec: 5.6, durSec: 1.1, note: 64, gain: 0.48 },
    { atSec: 5.88, durSec: 1.1, note: 69, gain: 0.48 },
    { atSec: 6.16, durSec: 1.1, note: 62, gain: 0.48 },
    { atSec: 6.44, durSec: 0.94, note: 65, gain: 0.48 },
    { atSec: 6.72, durSec: 0.66, note: 60, gain: 0.64 },
  ],
}

// Half muffled rounds on six, A4 down to C4: one face of each clapper in leather, so every backstroke row is the echo of the handstroke row.
const HALF_MUFFLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 69, gain: 0.86 },
    { atSec: 0.42, durSec: 1.4, note: 67, gain: 0.78 },
    { atSec: 0.84, durSec: 1.4, note: 65, gain: 0.78 },
    { atSec: 1.26, durSec: 1.4, note: 64, gain: 0.78 },
    { atSec: 1.68, durSec: 1.4, note: 62, gain: 0.78 },
    { atSec: 2.1, durSec: 1.4, note: 60, gain: 0.78 },
    { atSec: 2.52, durSec: 1.4, note: 69, gain: 0.38 },
    { atSec: 2.94, durSec: 1.4, note: 67, gain: 0.29 },
    { atSec: 3.36, durSec: 1.4, note: 65, gain: 0.29 },
    { atSec: 3.78, durSec: 1.4, note: 64, gain: 0.29 },
    { atSec: 4.2, durSec: 1.4, note: 62, gain: 0.29 },
    { atSec: 4.62, durSec: 1.4, note: 60, gain: 0.29 },
    { atSec: 5.46, durSec: 1.4, note: 69, gain: 0.86 },
    { atSec: 5.88, durSec: 1.4, note: 67, gain: 0.78 },
    { atSec: 6.3, durSec: 1.08, note: 65, gain: 0.78 },
    { atSec: 6.72, durSec: 0.66, note: 64, gain: 0.78 },
  ],
}

// Seven bells of a dorian tower, C5 down to D4: rounds hand and back, the gap, then 2143657. Fifteen places to a breath.
const DORIAN_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 72, gain: 0.7 },
    { atSec: 0.3, durSec: 1, note: 71, gain: 0.62 },
    { atSec: 0.6, durSec: 1, note: 69, gain: 0.62 },
    { atSec: 0.9, durSec: 1, note: 67, gain: 0.62 },
    { atSec: 1.2, durSec: 1, note: 65, gain: 0.62 },
    { atSec: 1.5, durSec: 1, note: 64, gain: 0.62 },
    { atSec: 1.8, durSec: 1, note: 62, gain: 0.62 },
    { atSec: 2.1, durSec: 1, note: 72, gain: 0.62 },
    { atSec: 2.4, durSec: 1, note: 71, gain: 0.54 },
    { atSec: 2.7, durSec: 1, note: 69, gain: 0.54 },
    { atSec: 3, durSec: 1, note: 67, gain: 0.54 },
    { atSec: 3.3, durSec: 1, note: 65, gain: 0.54 },
    { atSec: 3.6, durSec: 1, note: 64, gain: 0.54 },
    { atSec: 3.9, durSec: 1, note: 62, gain: 0.54 },
    { atSec: 4.5, durSec: 1, note: 71, gain: 0.7 },
    { atSec: 4.8, durSec: 1, note: 72, gain: 0.62 },
    { atSec: 5.1, durSec: 1, note: 67, gain: 0.62 },
    { atSec: 5.4, durSec: 1, note: 69, gain: 0.62 },
    { atSec: 5.7, durSec: 1, note: 64, gain: 0.62 },
    { atSec: 6, durSec: 1, note: 65, gain: 0.62 },
    { atSec: 6.3, durSec: 1, note: 62, gain: 0.62 },
  ],
}

// The end of a lead on six in G: the treble leads twice while seconds is made over it and the other four dodge.
const LEAD_END: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 72, gain: 0.7 },
    { atSec: 0.27, durSec: 1.1, note: 69, gain: 0.62 },
    { atSec: 0.54, durSec: 1.1, note: 76, gain: 0.62 },
    { atSec: 0.81, durSec: 1.1, note: 67, gain: 0.62 },
    { atSec: 1.08, durSec: 1.1, note: 74, gain: 0.62 },
    { atSec: 1.35, durSec: 1.1, note: 71, gain: 0.62 },
    { atSec: 1.62, durSec: 1.1, note: 72, gain: 0.62 },
    { atSec: 1.89, durSec: 1.1, note: 76, gain: 0.54 },
    { atSec: 2.16, durSec: 1.1, note: 69, gain: 0.54 },
    { atSec: 2.43, durSec: 1.1, note: 74, gain: 0.54 },
    { atSec: 2.7, durSec: 1.1, note: 67, gain: 0.54 },
    { atSec: 2.97, durSec: 1.1, note: 71, gain: 0.54 },
    { atSec: 3.51, durSec: 1.1, note: 76, gain: 0.7 },
    { atSec: 3.78, durSec: 1.1, note: 72, gain: 0.62 },
    { atSec: 4.05, durSec: 1.1, note: 74, gain: 0.62 },
    { atSec: 4.32, durSec: 1.1, note: 69, gain: 0.62 },
    { atSec: 4.59, durSec: 1.1, note: 71, gain: 0.62 },
    { atSec: 4.86, durSec: 1.1, note: 67, gain: 0.62 },
    { atSec: 5.13, durSec: 1.1, note: 76, gain: 0.62 },
    { atSec: 5.4, durSec: 1.1, note: 72, gain: 0.54 },
    { atSec: 5.67, durSec: 1.1, note: 69, gain: 0.54 },
    { atSec: 5.94, durSec: 1.1, note: 74, gain: 0.54 },
    { atSec: 6.21, durSec: 1.1, note: 67, gain: 0.54 },
    { atSec: 6.48, durSec: 0.9, note: 71, gain: 0.54 },
  ],
}

// A doubles method that makes thirds first, with a sixth bell, C4, covering: 21354 23145, the gap, 32415 34251.
const COVERED_DOUBLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 74, gain: 0.64 },
    { atSec: 0.27, durSec: 1.1, note: 76, gain: 0.56 },
    { atSec: 0.54, durSec: 1.1, note: 72, gain: 0.56 },
    { atSec: 0.81, durSec: 1.1, note: 67, gain: 0.56 },
    { atSec: 1.08, durSec: 1.1, note: 69, gain: 0.56 },
    { atSec: 1.35, durSec: 1.1, note: 60, gain: 0.7 },
    { atSec: 1.62, durSec: 1.1, note: 74, gain: 0.56 },
    { atSec: 1.89, durSec: 1.1, note: 72, gain: 0.48 },
    { atSec: 2.16, durSec: 1.1, note: 76, gain: 0.48 },
    { atSec: 2.43, durSec: 1.1, note: 69, gain: 0.48 },
    { atSec: 2.7, durSec: 1.1, note: 67, gain: 0.48 },
    { atSec: 2.97, durSec: 1.1, note: 60, gain: 0.62 },
    { atSec: 3.51, durSec: 1.1, note: 72, gain: 0.64 },
    { atSec: 3.78, durSec: 1.1, note: 74, gain: 0.56 },
    { atSec: 4.05, durSec: 1.1, note: 69, gain: 0.56 },
    { atSec: 4.32, durSec: 1.1, note: 76, gain: 0.56 },
    { atSec: 4.59, durSec: 1.1, note: 67, gain: 0.56 },
    { atSec: 4.86, durSec: 1.1, note: 60, gain: 0.7 },
    { atSec: 5.13, durSec: 1.1, note: 72, gain: 0.56 },
    { atSec: 5.4, durSec: 1.1, note: 69, gain: 0.48 },
    { atSec: 5.67, durSec: 1.1, note: 74, gain: 0.48 },
    { atSec: 5.94, durSec: 1.1, note: 67, gain: 0.48 },
    { atSec: 6.21, durSec: 1.1, note: 76, gain: 0.48 },
    { atSec: 6.48, durSec: 0.9, note: 60, gain: 0.62 },
  ],
}

// One whole pull on five at a tower pace, 12345 12345, then the gap and the second bell leading the first change.
const SLOW_PULL: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 76, gain: 0.7 },
    { atSec: 0.6, durSec: 2.4, note: 74, gain: 0.62 },
    { atSec: 1.2, durSec: 2.4, note: 72, gain: 0.62 },
    { atSec: 1.8, durSec: 2.4, note: 69, gain: 0.62 },
    { atSec: 2.4, durSec: 2.4, note: 67, gain: 0.62 },
    { atSec: 3, durSec: 2.4, note: 76, gain: 0.62 },
    { atSec: 3.6, durSec: 2.4, note: 74, gain: 0.54 },
    { atSec: 4.2, durSec: 2.4, note: 72, gain: 0.54 },
    { atSec: 4.8, durSec: 2.4, note: 69, gain: 0.54 },
    { atSec: 5.4, durSec: 1.98, note: 67, gain: 0.54 },
    { atSec: 6.6, durSec: 0.78, note: 74, gain: 0.7 },
  ],
}

// The same pull over a held fifth, C3 and G3.
const TOWER_AND_DRONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.36, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 7.36, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 2.4, note: 76, gain: 0.62 },
    { atSec: 0.6, durSec: 2.4, note: 74, gain: 0.54 },
    { atSec: 1.2, durSec: 2.4, note: 72, gain: 0.54 },
    { atSec: 1.8, durSec: 2.4, note: 69, gain: 0.54 },
    { atSec: 2.4, durSec: 2.4, note: 67, gain: 0.54 },
    { atSec: 3, durSec: 2.4, note: 76, gain: 0.54 },
    { atSec: 3.6, durSec: 2.4, note: 74, gain: 0.46 },
    { atSec: 4.2, durSec: 2.4, note: 72, gain: 0.46 },
    { atSec: 4.8, durSec: 2.4, note: 69, gain: 0.46 },
    { atSec: 5.4, durSec: 1.98, note: 67, gain: 0.46 },
    { atSec: 6.6, durSec: 0.78, note: 74, gain: 0.62 },
  ],
}

// Call changes on five heavy bells, A3 down to C3: the last row of rounds, the gap, "two to three" for a whole pull (13245 twice),
// the gap, and "two to four" coming in (134). One bell moves at each call.
const CALL_CHANGES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 57, gain: 0.62 },
    { atSec: 0.36, durSec: 0.6, note: 55, gain: 0.54 },
    { atSec: 0.72, durSec: 0.6, note: 52, gain: 0.54 },
    { atSec: 1.08, durSec: 0.6, note: 50, gain: 0.54 },
    { atSec: 1.44, durSec: 0.6, note: 48, gain: 0.54 },
    { atSec: 2.16, durSec: 0.6, note: 57, gain: 0.7 },
    { atSec: 2.52, durSec: 0.6, note: 52, gain: 0.62 },
    { atSec: 2.88, durSec: 0.6, note: 55, gain: 0.62 },
    { atSec: 3.24, durSec: 0.6, note: 50, gain: 0.62 },
    { atSec: 3.6, durSec: 0.6, note: 48, gain: 0.62 },
    { atSec: 3.96, durSec: 0.6, note: 57, gain: 0.62 },
    { atSec: 4.32, durSec: 0.6, note: 52, gain: 0.54 },
    { atSec: 4.68, durSec: 0.6, note: 55, gain: 0.54 },
    { atSec: 5.04, durSec: 0.6, note: 50, gain: 0.54 },
    { atSec: 5.4, durSec: 0.6, note: 48, gain: 0.54 },
    { atSec: 6.12, durSec: 0.6, note: 57, gain: 0.7 },
    { atSec: 6.48, durSec: 0.6, note: 52, gain: 0.62 },
    { atSec: 6.84, durSec: 0.52, note: 50, gain: 0.62 },
  ],
}

// Firing: all five bells at once (C major with its second and sixth), at hand and at back, with the open lead between the pairs.
const FIRED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.75, note: 67, gain: 0.48 },
    { atSec: 0, durSec: 1.75, note: 69, gain: 0.48 },
    { atSec: 0, durSec: 1.75, note: 72, gain: 0.48 },
    { atSec: 0, durSec: 1.75, note: 74, gain: 0.48 },
    { atSec: 0, durSec: 1.75, note: 76, gain: 0.48 },
    { atSec: 1.8, durSec: 1.75, note: 67, gain: 0.4 },
    { atSec: 1.8, durSec: 1.75, note: 69, gain: 0.4 },
    { atSec: 1.8, durSec: 1.75, note: 72, gain: 0.4 },
    { atSec: 1.8, durSec: 1.75, note: 74, gain: 0.4 },
    { atSec: 1.8, durSec: 1.75, note: 76, gain: 0.4 },
    { atSec: 3.96, durSec: 1.75, note: 67, gain: 0.48 },
    { atSec: 3.96, durSec: 1.75, note: 69, gain: 0.48 },
    { atSec: 3.96, durSec: 1.75, note: 72, gain: 0.48 },
    { atSec: 3.96, durSec: 1.75, note: 74, gain: 0.48 },
    { atSec: 3.96, durSec: 1.75, note: 76, gain: 0.48 },
    { atSec: 5.76, durSec: 1.62, note: 67, gain: 0.4 },
    { atSec: 5.76, durSec: 1.62, note: 69, gain: 0.4 },
    { atSec: 5.76, durSec: 1.62, note: 72, gain: 0.4 },
    { atSec: 5.76, durSec: 1.62, note: 74, gain: 0.4 },
    { atSec: 5.76, durSec: 1.62, note: 76, gain: 0.4 },
  ],
}

// Queens with each bell held: the end of a backstroke row, 2468, piles up C major seventh from the top; the silent place;
// then the handstroke row begins, and 1357 piles up D minor seventh.
const QUEENS_HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 71, gain: 0.56 },
    { atSec: 0.76, durSec: 2.24, note: 67, gain: 0.56 },
    { atSec: 1.52, durSec: 1.48, note: 64, gain: 0.56 },
    { atSec: 2.28, durSec: 0.72, note: 60, gain: 0.56 },
    { atSec: 3.8, durSec: 3.56, note: 72, gain: 0.56 },
    { atSec: 4.56, durSec: 2.8, note: 69, gain: 0.56 },
    { atSec: 5.32, durSec: 2.04, note: 65, gain: 0.56 },
    { atSec: 6.08, durSec: 1.28, note: 62, gain: 0.56 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Glass ring: four-operator bells.
  {
    id: 'handstroke-gap-look-to',
    name: 'Look to',
    category: 'bell',
    description:
      'An inharmonic glass bell of five seconds, hard and bright at the strike, opened wide at the top and set in a short plate.',
    preview: ROUNDS_ON_EIGHT,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 4, brightness: 0.62, decay: 5, release: 4, spread: 0.3, detune: 2 },
    },
    effects: [
      { deviceId: 'spread', params: { high: 1.9, make: 0.9 } },
      { deviceId: 'plate-reverb', params: { mix: 0.22, decay: 0.45, damping: 0.5 } },
    ],
  },
  {
    id: 'handstroke-gap-pocket-ring',
    name: 'Pocket ring',
    category: 'bell',
    description:
      'Toy glass keys cut to a third of a second, played back off a fluttering cassette and through one dripping spring.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { volume: -6, decay: 0.35, brightness: 0.48, release: 0.3 },
    },
    effects: [
      { deviceId: 'tape', params: { speed: 3, wow: 0.45, flutter: 0.5, age: 0.4, hiss: 0.1 } },
      { deviceId: 'spring-reverb', params: { springs: 0, mix: 0.28, decay: 1.4, drip: 0.7 } },
    ],
  },
  {
    id: 'handstroke-gap-tenor-in-frost',
    name: 'Tenor in frost',
    category: 'bell',
    description:
      'A dark temple bowl that rings fourteen seconds with a soft strike, and eight strings in C major answering under it.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { volume: -15.5, decay: 14, release: 10, brightness: 0.2, attack: 0.04, detune: 2 },
    },
    effects: [
      { deviceId: 'sympathetic', params: { root: 0, mode: 0, sympathy: 0.6, decay: 5, mix: 0.35 } },
    ],
  },
  {
    id: 'handstroke-gap-two-fields-off',
    name: 'Two fields off',
    category: 'bell',
    description:
      'Ice chimes moved far across open country: late, dull and narrow, wandering as the wind does, with little room round them.',
    preview: HUNT_ON_SIX,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { decay: 3, brightness: 0.4, attack: 0.01 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.88, room: 0.35, air: 0.9, wander: 0.5, rate: 0.12, decay: 2.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-clapper-in-wool',
    name: 'Clapper in wool',
    category: 'keys',
    description:
      'A glass mallet with almost no overtones and a rounded strike, its attacks blurred into a short dark fog with no tail.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        volume: -15,
        ratio: 1,
        brightness: 0.06,
        attack: 0.02,
        decay: 1.4,
        release: 0.6,
        spread: 0.1,
      },
    },
    effects: [
      { deviceId: 'fog', params: { size: 90, soften: 0.5, damp: 0.7, width: 0.4, mix: 0.8 } },
      { deviceId: 'ambient-eq', params: { body: 3, highCut: 2500 } },
    ],
  },
  {
    id: 'handstroke-gap-queens-by-candle',
    name: 'Queens by candle',
    category: 'pad',
    description:
      'A slow crystal pad whose thirds hang and gather, answered by a wordless choir on a round vowel.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { volume: -16.5, attack: 0.7, brightness: 0.22, release: 2.5 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: { vowel: 3, resonance: 0.8, voice: 0.6, decay: 5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-seven-round-a-rim',
    name: 'Seven round a rim',
    category: 'pad',
    description:
      'Rubbed glass that swells in a quarter second and lets go quickly, turned by a slow cabinet heard from close by.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { attack: 0.22, release: 0.9, ratio: 1, brightness: 0.5 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 0, hornDepth: 0.8, distance: 0.1, spread: 1, drive: 0.1 },
      },
    ],
  },
  {
    id: 'handstroke-gap-broken-lead-light',
    name: 'Broken lead light',
    category: 'bell',
    description:
      'A glass ping of a third of a second that skips away in ever closer echoes, each one duller and on the other side.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { volume: -1.5, decay: 0.35, brightness: 0.4, ratio: 5 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 420, bounce: 0.78, skips: 9, loss: 2, sink: 0.5, throw: 0.9, mix: 0.45 },
      },
    ],
  },
  {
    id: 'handstroke-gap-under-the-lantern',
    name: 'Under the lantern',
    category: 'bell',
    description:
      'Near-sine chimes very wide in tuning, with a long tail that climbs in fifths over them.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: { decay: 2.5, release: 5, detune: 18 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        params: { interval: 1, decay: 9, shimmer: 0.55, mix: 0.45, tone: 4000 },
      },
    ],
  },
  {
    id: 'handstroke-gap-bell-and-counterbell',
    name: 'Bell and counterbell',
    category: 'bass',
    description:
      'A dark gong from the sub-octave pair, rough with feedback, sent through a big speaker stack and a room behind it.',
    preview: CALL_CHANGES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Dark gong',
      params: { volume: -16.5, decay: 3, release: 2, brightness: 0.45, detune: 6, spread: 0.4 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 2, drive: 0.3, distance: 0.6, room: 0.6, noise: 0, treble: -0.4 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -2 } },
    ],
  },
  {
    id: 'handstroke-gap-icicle-dodge',
    name: 'Icicle dodge',
    category: 'bell',
    description:
      'The shortest glass tick scattered into nine echoes that gather at the end of two seconds, then held by a limiter.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { decay: 0.13, release: 0.15, ratio: 9, brightness: 0.5, volume: 0 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { pattern: 4, stars: 9, span: 2000, fade: 0.25, again: 0.1, tone: 9000, mix: 0.5 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -3 } },
    ],
  },
  {
    id: 'handstroke-gap-backstroke-mirror',
    name: 'Backstroke mirror',
    category: 'texture',
    description:
      'Vibe-like glass against itself backwards, in chunks of one and a third seconds that swell in and change sides.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { brightness: 0.42, decay: 1.2, release: 0.8, ratio: 3 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 1330, feedback: 0.2, smooth: 0.7, spread: 1, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 180, presence: 2 } },
    ],
  },
  {
    id: 'handstroke-gap-rain-on-the-louvres',
    name: 'Rain on the louvres',
    category: 'pad',
    description:
      'A warm glass pad with a slow front, its pairs far out of tune, standing in light rain that taps on every note.',
    preview: FIRED,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { attack: 0.5, release: 1.2, feedback: 0.3 },
    },
    effects: [
      { deviceId: 'weather', params: { kind: 2, exposure: 0.6, voice: 0.35, force: 0.4 } },
      { deviceId: 'ambient-eq', params: { highCut: 5000, low: -2 } },
    ],
  },
  {
    id: 'handstroke-gap-blown-treble',
    name: 'Blown treble',
    category: 'organ',
    description:
      'A glass organ with a fast front and a short release, given an octave pedal and a twelfth that speak a little late.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { ratio: 3, brightness: 0.2, release: 0.25, detune: 2 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          sub: 0.6,
          unison: 0.5,
          octave: 0.3,
          twelfth: 0.5,
          speak: 200,
          mix: 0.7,
          chiff: 0.5,
        },
      },
      { deviceId: 'hall-reverb', params: { mix: 0.2, midDecay: 1.4, damping: 4000 } },
    ],
  },
  {
    id: 'handstroke-gap-bowed-headstock',
    name: 'Bowed headstock',
    category: 'drone',
    description:
      'Bowed metal a second in coming, split into bands that swell and cross from side to side each on its own slow clock.',
    preview: TOWER_AND_DRONE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { volume: -15, attack: 1, release: 2.5, ratio: 0, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'currents', params: { depth: 0.85, sway: 0.9, rate: 0.35, chance: 0.5 } },
    ],
  },
  {
    id: 'handstroke-gap-parish-record',
    name: 'Parish record',
    category: 'bell',
    description:
      'Chime bars on a warped, crackling disc, its top worn away, with the pitch leaning as the record turns.',
    preview: HUNT_ON_SIX,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { volume: -8.5, decay: 1.1, release: 1, brightness: 0.55, ratio: 6 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        params: { warp: 0.6, crackle: 0.35, wear: 0.7, surface: 0.15, tone: -0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-lead-and-lie',
    name: 'Lead and lie',
    category: 'texture',
    description:
      'Slow glass swelling under a cloud of itself stretched twelve times, dark and wide, that trails behind the changes.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { attack: 0.8, ratio: 3, brightness: 0.15, release: 3 },
    },
    effects: [
      {
        deviceId: 'stretch',
        params: { stretch: 12, window: 2, mix: 0.55, tone: -0.5, catchUp: 0.8 },
      },
    ],
  },

  // Bar ring: two bars to a note.
  {
    id: 'handstroke-gap-stand-of-steel',
    name: 'Stand of steel',
    category: 'bell',
    description:
      'Metal bars struck hard and beating three times a second, kept short, in a tight bright chamber.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Three, short',
      params: { volume: -2, decay: 1.2, tone: 0.9, damp: 0.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } }],
  },
  {
    id: 'handstroke-gap-sway-of-the-tower',
    name: 'Sway of the tower',
    category: 'bell',
    description:
      'Glass bars one to an ear that beat every two seconds, with a soft mallet, while the sound swings like a pendulum.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow sway',
      params: { volume: -3.5, decay: 7, mallet: 0.2 },
    },
    effects: [{ deviceId: 'around', params: { path: 2, rate: 0.25, radius: 1, head: 0.8 } }],
  },
  {
    id: 'handstroke-gap-ladder-rungs',
    name: 'Ladder rungs',
    category: 'plucked',
    description:
      'Wooden bars knocked flat and dry inside a small wooden body, with no beat to speak of and no tail.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood knock',
      params: { volume: 2.5, beat: 0.8, decay: 0.45, mallet: 0.7, damp: 0.9, tone: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 5, size: 0.6, material: 0.1, air: 0, mix: 0.6 } },
    ],
  },
  {
    id: 'handstroke-gap-flam-at-backstroke',
    name: 'Flam at backstroke',
    category: 'plucked',
    description:
      'Two wooden bars struck thirty-five milliseconds apart, one in each ear, with short dotted tape echoes and a limiter behind.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { volume: -5.5, scatter: 35, ears: 1, decay: 0.9, tone: 0.6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { heads: 3, time: 420, feedback: 0.35, mix: 0.35, highCut: 2500 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -8.5 } },
    ],
  },
  {
    id: 'handstroke-gap-chamber-floor',
    name: 'Chamber floor',
    category: 'bell',
    description:
      'Dark metal bars with the softest mallet heard from the floor below: muffled, thick in the body and nearly mono.',
    preview: TENOR_BEHIND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { decay: 5, beat: 1.2, damp: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { low: 5, body: 3, presence: -8, highCut: 1200 } },
      { deviceId: 'stereo-widener', params: { width: 0.12 } },
    ],
  },
  {
    id: 'handstroke-gap-hare-in-the-belfry',
    name: 'Hare in the belfry',
    category: 'bell',
    description:
      'Glass bars beating ten times a second in the air, with sparks of two octaves up thrown off to either side.',
    preview: ROUNDS_ON_EIGHT,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten in the air',
      params: { volume: -1, decay: 1.6, tone: 0.8 },
    },
    effects: [
      { deviceId: 'glints', params: { pitch: 2, density: 9, size: 50, trail: 0.4, mix: 0.3 } },
    ],
  },
  {
    id: 'handstroke-gap-dead-ropes',
    name: 'Dead ropes',
    category: 'plucked',
    description:
      'Fully damped glass bars, a click and half a tone, coarsened to nine bits at a low rate.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Damped glass',
      params: { volume: -6.5, decay: 0.6, mallet: 0.6, tone: 0.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', params: { rate: 7000, bits: 9, aliasing: 0.5, filter: 1 } },
      { deviceId: 'fet-limiter', params: { inputGain: 6, outputGain: 0 } },
    ],
  },
  {
    id: 'handstroke-gap-rung-down-in-peal',
    name: 'Rung down in peal',
    category: 'pad',
    description:
      'Long metal bars with every attack removed, each note fading in over half a second and beating once a second, in a six-second tail.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { volume: -2.5, mallet: 0.1 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 500, release: 120, sensitivity: -50 } },
      { deviceId: 'fdn-reverb', params: { decay: 6, breathDepth: 0, damping: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'handstroke-gap-odd-struck',
    name: 'Odd struck',
    category: 'bell',
    description:
      'Scattered metal bars, each pair forty milliseconds out, sagging in pitch and dimming as they ring on.',
    preview: HUNT_ON_SIX,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: { volume: -2.5, decay: 4, beat: 3, mallet: 0.6 },
    },
    effects: [
      { deviceId: 'melt', params: { sag: -45, hold: 3, solid: 60, dim: 0.6, drip: 0.5, mix: 0.6 } },
    ],
  },
  {
    id: 'handstroke-gap-iron-frame',
    name: 'Iron frame',
    category: 'bell',
    description:
      'Hard metal bars beating twenty times a second, driven through a transformer until they growl, in a short plate.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twenty, rough',
      params: { decay: 1.8, ears: 0.1, mallet: 0.8 },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 2, drive: 0.6, tone: -0.3, lowBump: 0.4 } },
      { deviceId: 'plate-reverb', params: { mix: 0.15, decay: 0.3, damping: 0.6 } },
    ],
  },
  {
    id: 'handstroke-gap-bowl-on-the-sill',
    name: 'Bowl on the sill',
    category: 'bell',
    description:
      'A glass bowl of twenty seconds that wakes a table of nine metal bowls in C major pentatonic, spread across the room.',
    preview: LAST_OF_ROUNDS,
    instrument: { deviceId: 'twin-bars', preset: 'Glass bowl', params: { decay: 20, tone: 0.2 } },
    effects: [
      {
        deviceId: 'bowls',
        params: { root: 0, scale: 0, bowls: 9, ring: 12, metal: 0.8, mix: 0.5, spread: 1 },
      },
    ],
  },
  {
    id: 'handstroke-gap-ash-and-elm',
    name: 'Ash and elm',
    category: 'keys',
    description:
      'A low wooden hum under the softest mallet, doubled an octave down and held level by a compressor.',
    preview: CALL_CHANGES,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { volume: -4, decay: 3.5, beat: 1.5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.6, up1: 0, dry: 0.8 } },
      {
        deviceId: 'ambient-comp',
        params: { threshold: -34, ratio: 4, attack: 60, release: 1, makeup: 3 },
      },
    ],
  },
  {
    id: 'handstroke-gap-course-bell',
    name: 'Course bell',
    category: 'bell',
    description:
      'Bright glass bars at five beats a second, followed by a second and a third ringer a place apart, the third an octave up.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { volume: -2.5, decay: 3, mallet: 0.7 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 0.32,
          interval2: 12,
          fade: 0.4,
          spread: 1,
          tone: 5000,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'handstroke-gap-long-metal-at-dusk',
    name: 'Long metal at dusk',
    category: 'pad',
    description:
      'Half-hertz metal bars under a pad that grows in behind the chord and lingers after it.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Half a hertz',
      params: { volume: 2, mallet: 0.2, tone: 0.2, decay: 6 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos' }],
  },
  {
    id: 'handstroke-gap-tied-clappers',
    name: 'Tied clappers',
    category: 'plucked',
    description:
      'Wood bars at nine beats a second, gated into a half-second room that stops dead after every blow.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood flutter',
      params: { volume: 2.5, decay: 0.7, mallet: 0.85, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 0, time: 0.5, density: 0.9, colour: -0.4, tail: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'handstroke-gap-set-at-hand',
    name: 'Set at hand',
    category: 'bell',
    description:
      'Glass bars in the middle of the head, held even by a hard limiter, their highs and lows rocking against each other.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass, middle',
      params: { decay: 2.5, mallet: 0.9, tone: 0.9, volume: -6 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -4 } },
      { deviceId: 'tremolo', params: { mode: 2, rate: 1.4, depth: 0.9, crossover: 900 } },
    ],
  },

  // Tower ring: bell metal, bowls and bars.
  {
    id: 'handstroke-gap-under-the-tenor',
    name: 'Under the tenor',
    category: 'bell',
    description:
      'A church bell of six seconds struck with leather, its minor third left in, heard from below through a stone room.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -4, decay: 6, hardness: 0.35, brightness: 0.3, release: 0.1 },
    },
    effects: [
      {
        deviceId: 'ether-reverb',
        params: { mix: 0.3, decay: 3, damping: 0.8, size: 0.75, predelayMs: 40 },
      },
    ],
  },
  {
    id: 'handstroke-gap-six-seconds-away',
    name: 'Six seconds away',
    category: 'bell',
    description:
      'A soft distant bell with its treble gone, narrowed and blown about by passing gusts of wind.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { volume: -1, decay: 6, damping: 0.9, spread: 0.1 },
    },
    effects: [
      {
        deviceId: 'weather',
        params: { kind: 0, exposure: 0.8, voice: 0.25, sway: 0.7, force: 0.6, calm: 0.1 },
      },
    ],
  },
  {
    id: 'handstroke-gap-handbells-in-pairs',
    name: 'Handbells in pairs',
    category: 'bell',
    description:
      'Short bars for two bells in hand, bare of any room, doubled fourteen cents sharp on the left and flat on the right.',
    preview: HUNT_ON_SIX,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: {
        volume: 2.5,
        decay: 1.4,
        hardness: 0.6,
        brightness: 0.4,
        damping: 0.5,
        release: 0.6,
      },
    },
    effects: [{ deviceId: 'stereo-detune', params: { detune: 14, delay: 26, mix: 0.5 } }],
  },
  {
    id: 'handstroke-gap-leather-on-one-side',
    name: 'Leather on one side',
    category: 'bell',
    description:
      'A singing bowl under a soft clapper, its strikes turned down and softened while the ring goes on.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { decay: 6, hardness: 0.25, detune: 2.5, release: 0.3 },
    },
    effects: [
      { deviceId: 'sift', params: { attacks: -24, air: -6, tones: 2, hold: 0.6, soften: 0.6 } },
    ],
  },
  {
    id: 'handstroke-gap-founders-yard',
    name: 'Founders yard',
    category: 'bell',
    description:
      'A gong damped to three seconds whose partials are stretched wider apart and slowly drift, narrow and a little dark.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 2, decay: 3, damping: 0.7, hardness: 0.5, release: 0.3, spread: 0.4 },
    },
    effects: [{ deviceId: 'warp', params: { stretch: 0.25, drift: 0.3, tone: -0.4, mix: 0.8 } }],
  },
  {
    id: 'handstroke-gap-thumb-and-treble',
    name: 'Thumb and treble',
    category: 'plucked',
    description:
      'Kalimba tines stopped at release, through a small radio that fades and lets in a little static.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -3.5, decay: 1.6, hardness: 0.4, release: 0.7 },
    },
    effects: [
      {
        deviceId: 'radio',
        params: {
          band: 0,
          fading: 0.35,
          static: 0.12,
          interference: 0,
          bandwidth: 0.6,
          speaker: 0.7,
        },
      },
    ],
  },
  {
    id: 'handstroke-gap-glass-belfry',
    name: 'Glass belfry',
    category: 'bell',
    description:
      'Tapped glass, small and clean, answered by a cave of short echoes instead of a smooth hall.',
    preview: ROUNDS_ON_EIGHT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -5.5, decay: 2.5, brightness: 0.5, spread: 0.9 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: { length: 0.35, blur: 0.15, feedback: 0.6, highCut: 8000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'handstroke-gap-wheel-turning',
    name: 'Wheel turning',
    category: 'bell',
    description:
      'Vibraphone bars with a motor-like stutter: a soft gate on five pulses of eight that shades the tone as it closes.',
    preview: TITTUMS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -7, decay: 5, hardness: 0.5, release: 0.1, spread: 0.5 },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: { rate: 7.14, steps: 8, fill: 5, shade: 0.8, floor: 0.2, drift: 0.2, apart: 1 },
      },
    ],
  },
  {
    id: 'handstroke-gap-gap-of-one-bell',
    name: 'Gap of one bell',
    category: 'drone',
    description:
      'A rubbed bowl that never quite stops, breathing in, holding and breathing out in a hall, and at rest for the last place of every eleven.',
    preview: TOWER_AND_DRONE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { hardness: 0.35, brightness: 0.35, release: 0.2, detune: 1.6 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: { in: 1.6, hold: 1.8, out: 2.6, rest: 0.6, depth: 0.85, colour: 0.7, vary: 0 },
      },
      { deviceId: 'hall-reverb', params: { mix: 0.3, lowDecay: 4, midDecay: 3, damping: 3000 } },
    ],
  },
  {
    id: 'handstroke-gap-wooden-practice',
    name: 'Wooden practice',
    category: 'plucked',
    description:
      'Wood bars, the dumb-bell of a practice night: dead, round, doubled an octave below and pushed into an old valve.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { hardness: 0.3, decay: 0.8, brightness: 0.25 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.7, up1: 0, dry: 0.9 } },
      { deviceId: 'patina', params: { medium: 5, drive: 0.6, noise: 0, wobble: 0.1, tone: 0.35 } },
    ],
  },
  {
    id: 'handstroke-gap-ice-on-the-rope',
    name: 'Ice on the rope',
    category: 'bell',
    description:
      'Shivering glass with a seven-hertz beat and little body, its bands glinting upward one after another.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -4, decay: 4, hardness: 0.7, position: 0.02 },
    },
    effects: [
      { deviceId: 'glimmer', params: { depth: 1, rate: 3, pattern: 1, soft: 0.4, lean: 0.8 } },
      { deviceId: 'ambient-eq', params: { lowCut: 300, air: 3 } },
    ],
  },
  {
    id: 'handstroke-gap-bowed-tenor',
    name: 'Bowed tenor',
    category: 'bass',
    description:
      'A bell bowed until it hums, filtered down to its lowest partials and opening a little on each stroke.',
    preview: CALL_CHANGES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { decay: 10, brightness: 0.2, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 260,
          resonance: 0.9,
          envAmount: 35,
          envAttackMs: 200,
          envReleaseMs: 600,
        },
      },
    ],
  },
  {
    id: 'handstroke-gap-vestry-chimes',
    name: 'Vestry chimes',
    category: 'bell',
    description:
      'Wind-chime bars cut short and shifted a few hertz apart on the two sides, with a quick feedback that rolls on.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -3, decay: 2, brightness: 0.5, damping: 0.35, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { mode: 2, shift: 0, fine: 3, feedback: 0.6, delay: 120, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-harp-of-rims',
    name: 'Harp of rims',
    category: 'pad',
    description:
      'Sung glass rims that hold their thirds, with the octave above drawn as pure tones that linger.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { hardness: 0.05, detune: 3, release: 0.5, brightness: 0.25 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 6, transpose: 12, attack: 500, release: 4, spread: 0.9, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-fired-from-below',
    name: 'Fired from below',
    category: 'texture',
    description:
      'All the bells at once as a rubbed gong, sunk in deep water until only a wavering low glow is left.',
    preview: FIRED,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { volume: -13.5, hardness: 0.6, stretch: 1, release: 0.2 },
    },
    effects: [
      {
        deviceId: 'underwater',
        params: { depth: 0.6, waver: 0.6, rate: 0.5, bubbles: 0.15, resonance: 0.3 },
      },
    ],
  },

  // Hand ring: steel and tongue under the hands.
  {
    id: 'handstroke-gap-palms-in-rounds',
    name: 'Palms in rounds',
    category: 'plucked',
    description:
      'A handpan under soft palms, damped short and full of air, sounding through a large wooden soundboard.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Palm mute',
      params: { damp: 0.6, decay: 1.5, cavity: 1 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 5, size: 1.6, material: 0.2, air: 0, mix: 0.45 } },
    ],
  },
  {
    id: 'handstroke-gap-low-ding-at-lead',
    name: 'Low ding at lead',
    category: 'bass',
    description:
      'A deep handpan note with a big thump of air, its fundamental doubled an octave down and the rest rolled off.',
    preview: CALL_CHANGES,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { touch: 0.15, cavity: 1, decay: 4 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.5, up1: 0, filter: 900 } },
      { deviceId: 'ambient-eq', params: { highCut: 2000, low: 2 } },
    ],
  },
  {
    id: 'handstroke-gap-sympathy-of-eight',
    name: 'Sympathy of eight',
    category: 'bell',
    description:
      'A shimmering handpan whose notes all answer each other, smeared into a glassy halo that hangs after the row.',
    preview: TITTUMS,
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 5, touch: 0.35 } },
    effects: [
      { deviceId: 'spectral-blur', params: { blur: 0.7, smear: 0.5, shimmer: 0.4, mix: 0.45 } },
    ],
  },
  {
    id: 'handstroke-gap-tongue-and-groove',
    name: 'Tongue and groove',
    category: 'plucked',
    description:
      'A round tongue drum, four seconds long, echoed by a dark analog delay that steps up a fifth and back.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { volume: -1, decay: 4, touch: 0.1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: { time: 660, feedback: 0.4, intervalB: 5, step: 0, tone: 2400, mix: 0.4 },
      },
    ],
  },
  {
    id: 'handstroke-gap-wet-louvre-taps',
    name: 'Wet louvre taps',
    category: 'plucked',
    description:
      'Fingertip taps at the rim, gone in a second, each one dropping away in pitch as small falling pieces.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { volume: 1, touch: 0.8, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'falling',
        params: { fall: -5, size: 400, density: 7, vary: 0.5, again: 0, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-knuckle-and-rope',
    name: 'Knuckle and rope',
    category: 'plucked',
    description:
      'Knuckles on steel, hard and woody, recorded hot to a reel until the taps flatten into the note.',
    preview: DORIAN_SEVEN,
    instrument: { deviceId: 'handpan', preset: 'Knuckles', params: { decay: 1.8, shimmer: 0.2 } },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 0.9,
          speed: 1,
          wow: 0.1,
          flutter: 0.1,
          age: 0.2,
          hiss: 0,
          bump: 0.8,
          tone: 0.3,
        },
      },
    ],
  },
  {
    id: 'handstroke-gap-over-the-hedge',
    name: 'Over the hedge',
    category: 'bell',
    description:
      'A bright tongue drum a field away, thin and dry in open air, passing nearer and farther.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { volume: 0.5, decay: 3, touch: 0.5 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.65,
          room: 0.1,
          air: 0.7,
          wander: 0.7,
          rate: 0.25,
          decay: 0.6,
          width: 0.9,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 250 } },
    ],
  },
  {
    id: 'handstroke-gap-slit-drum-tenor',
    name: 'Slit-drum tenor',
    category: 'bass',
    description:
      'A hollow slit drum, under a second long, all cavity and knock, through a small close speaker and a hard limiter.',
    preview: CALL_CHANGES,
    instrument: { deviceId: 'handpan', preset: 'Slit drum', params: { touch: 0.25, decay: 0.6 } },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.35, bass: 0.6, distance: 0, room: 0.1, noise: 0 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -4 } },
    ],
  },
  {
    id: 'handstroke-gap-plain-as-hunting',
    name: 'Plain as hunting',
    category: 'keys',
    description:
      'The purest tongue, no tap and no shimmer, and a vibrato that comes only where no new bell strikes: in the gap.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { volume: -4.5, decay: 6, sympathy: 0.2 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 430, grow: 300, depth: 45, rate: 4, width: 1, swell: 0.6 },
      },
    ],
  },
  {
    id: 'handstroke-gap-cistern-under-the-tower',
    name: 'Cistern under the tower',
    category: 'bell',
    description:
      'A tank drum in a flooded cistern: a hollow body rings behind it and the long dark tail keeps its lows.',
    preview: TENOR_BEHIND,
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { volume: -3.5, decay: 4 } },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.4 } },
      { deviceId: 'expanse', params: { size: 0.8, decay: 9, highCut: 1800, mix: 0.35 } },
    ],
  },
  {
    id: 'handstroke-gap-edge-of-the-sound-bow',
    name: 'Edge of the sound bow',
    category: 'bell',
    description:
      'A handpan struck at its very rim, all overtones, with the quiet partials pushed forward and the lows cut.',
    preview: HUNT_ON_FIVE,
    instrument: { deviceId: 'handpan', preset: 'Edge overtones', params: { decay: 3, touch: 0.7 } },
    effects: [
      { deviceId: 'reveal', params: { amount: 0.9, rise: 120, focus: 0.6, range: 18 } },
      { deviceId: 'ambient-eq', params: { lowCut: 400 } },
    ],
  },
  {
    id: 'handstroke-gap-centre-of-the-ring',
    name: 'Centre of the ring',
    category: 'pad',
    description:
      'The centre tone of a handpan with its attacks faded in, warm and slow, under a wide three-voice chorus.',
    preview: QUEENS_HELD,
    instrument: { deviceId: 'handpan', preset: 'Centre tone', params: { volume: 3, decay: 8 } },
    effects: [
      { deviceId: 'swell', params: { attack: 280, release: 80, sensitivity: -55 } },
      {
        deviceId: 'chorus',
        params: { voices: 1, rate: 0.35, depth: 60, delayMs: 20, spread: 100, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-steel-through-smoke',
    name: 'Steel through smoke',
    category: 'texture',
    description:
      'A long shimmering pan turned into grains an octave down that trail through the silent places.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'handpan',
      preset: 'Slow shimmer',
      params: { volume: 0, decay: 5, touch: 0.1 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          pitch: -12,
          size: 350,
          density: 14,
          spray: 0.5,
          mix: 0.6,
          reverse: 0.5,
          feedback: 0.4,
        },
      },
    ],
  },
  {
    id: 'handstroke-gap-bloom-at-backstroke',
    name: 'Bloom at backstroke',
    category: 'bell',
    description:
      'A hard bright pan whose reverb swells up after the blow and is gone before the next row.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright bloom',
      params: { volume: -2.5, decay: 2, touch: 0.8 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 1, time: 1.2, density: 1, colour: 0.1, tail: 0.1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'handstroke-gap-bob-at-a-steel-lead',
    name: 'Bob at a steel lead',
    category: 'plucked',
    description:
      'Clean short steel with nothing added by the body, swept by a two-tone phaser that flips as it goes.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'handpan',
      preset: 'Clean steel',
      params: { volume: 3.5, decay: 1.3, touch: 0.3 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Two-tone flip', params: { mix: 0.5, feedback: 60 } }],
  },
  {
    id: 'handstroke-gap-hung-in-the-dark',
    name: 'Hung in the dark',
    category: 'drone',
    description:
      'A soft tongue caught and held as an endless dark bed while the pull goes on above it.',
    preview: TOWER_AND_DRONE,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { volume: -2.5, decay: 5, cavity: 0.5, touch: 0.3 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.5, mix: 0.6 } }],
  },
  {
    id: 'handstroke-gap-two-hands-two-ropes',
    name: 'Two hands, two ropes',
    category: 'plucked',
    description:
      'A soft-handed pan thrown from ear to ear two and a half times a second and held even by a limiter.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 2.4, cavity: 0.2, position: 0.7 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -2 } },
      {
        deviceId: 'tremolo',
        params: { mode: 1, rate: 2.5, depth: 1, shape: 2, smooth: 0.4, drift: 0 },
      },
    ],
  },

  // Wooden and tubed ring: mallets.
  {
    id: 'handstroke-gap-ropewalk',
    name: 'Ropewalk',
    category: 'keys',
    description:
      'A soft short marimba in a dark three-spring tank, both walking a slow figure of eight round the head.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -2, decay: 0.8, mallet: 0.05, resonator: 1, width: 0 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: { springs: 2, decay: 3, tone: 1800, drip: 0.2, mix: 0.3 },
      },
      { deviceId: 'around', params: { path: 1, rate: 0.45, radius: 1, head: 1, near: 0.4 } },
    ],
  },
  {
    id: 'handstroke-gap-raised-in-peal',
    name: 'Raised in peal',
    category: 'pad',
    description:
      'Rolled marimba at twelve strokes a second, swelling and sinking on a two-second tide of level and brightness.',
    preview: FIRED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 12, mallet: 0.3, decay: 1.5 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: { in: 1.2, hold: 0.1, out: 0.6, rest: 0.05, depth: 0.6, colour: 0.8, vary: 0 },
      },
    ],
  },
  {
    id: 'handstroke-gap-motor-and-wheel',
    name: 'Motor and wheel',
    category: 'keys',
    description:
      'Vibraphone bars with the motor slow and deep, in a long dark reverb that lets them in by waves.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1.6, decay: 4, mallet: 0.1 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { decay: 9, damping: 0.8, breathDepth: 0.8, breathRate: 0.4, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-stopped-at-backstroke',
    name: 'Stopped at backstroke',
    category: 'keys',
    description:
      'Still vibes damped at every release, short and firm, spun by the fast horn of a speaker cabinet close by.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -2.5, decay: 0.6, damper: 1, mallet: 0.6 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 1, hornDepth: 0.9, drumDepth: 0.2, balance: 0.8, distance: 0.1, drive: 0 },
      },
    ],
  },
  {
    id: 'handstroke-gap-steeplejack',
    name: 'Steeplejack',
    category: 'bell',
    description:
      'A hard glockenspiel heard up the steeple: bright repeats fall an octave a time and fade within four.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: -4.5, mallet: 0.7, decay: 0.6 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: { pitchA: -12, delay: 270, feedback: 0.45, mode: 0, tone: 5000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'handstroke-gap-changes-by-lamplight',
    name: 'Changes by lamplight',
    category: 'keys',
    description:
      'A soft celesta with its damper on, through a worn small-hours radio speaker with no hiss and a little wobble.',
    preview: HUNT_ON_SIX,
    instrument: { deviceId: 'mallets', preset: 'Celesta', params: { mallet: 0.15, decay: 1.4 } },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 3, drive: 0.4, wobble: 0.4, wear: 0.5, noise: 0, tone: 0.4 },
      },
    ],
  },
  {
    id: 'handstroke-gap-dumb-bell',
    name: 'Dumb-bell',
    category: 'plucked',
    description:
      'A dry xylophone under a medium mallet, its body made smaller and brighter, the knock held down by a limiter.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: -10, mallet: 0.45, decay: 0.7, resonator: 0.3 },
    },
    effects: [
      { deviceId: 'size', params: { size: -0.6, detail: 0.6, width: 0.6 } },
      { deviceId: 'fet-limiter', params: { inputGain: 22, outputGain: -7 } },
    ],
  },
  {
    id: 'handstroke-gap-oak-frame',
    name: 'Oak frame',
    category: 'keys',
    description:
      'A warm xylophone with full tubes under it, its ring let hang by whatever two blows have in common.',
    preview: TENOR_BEHIND,
    instrument: { deviceId: 'mallets', preset: 'Warm xylophone', params: { decay: 3 } },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 900, keep: 0, strict: 0.5, ring: 0.8, mix: 0.75 },
      },
    ],
  },
  {
    id: 'handstroke-gap-swifts-in-the-tubes',
    name: 'Swifts in the tubes',
    category: 'texture',
    description:
      'A fast xylophone roll that throws little loops of itself an octave up, scattered wide and fading.',
    preview: FIRED,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { volume: -4.5, roll: 16, decay: 1, mallet: 0.15 },
    },
    effects: [
      {
        deviceId: 'cascade',
        params: { pattern: 0, time: 300, repeats: 6, high: 0.9, low: 0, spread: 1, mix: 0.5 },
      },
    ],
  },
  {
    id: 'handstroke-gap-lychgate',
    name: 'Lychgate',
    category: 'bell',
    description:
      'Resonator bells stopped early, with a dark copy six places later, a third away, and older moments drifting back under it.',
    preview: ROUNDS_ON_EIGHT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -7, decay: 0.8, damper: 0.8, mallet: 0.3 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        params: { time: 1680, feedback: 0.3, echo: 0.9, memory: 0.4, tone: 2500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'handstroke-gap-mist-on-the-ring',
    name: 'Mist on the ring',
    category: 'pad',
    description:
      'A glockenspiel roll with all its strokes blurred away into a wide bright cloud with no attack.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 9, decay: 1.5, mallet: 0.1 },
    },
    effects: [
      { deviceId: 'fog', params: { size: 380, layers: 3, soften: 0.8, drift: 0.6, damp: 0.3 } },
    ],
  },
  {
    id: 'handstroke-gap-hum-notes',
    name: 'Hum notes',
    category: 'keys',
    description:
      'An open celesta over the octave below it as a soft shadow, long in the decay and dull on top.',
    preview: TITTUMS,
    instrument: { deviceId: 'mallets', preset: 'Open celesta', params: { decay: 2.2, width: 0.2 } },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 3, transpose: -12, attack: 60, release: 2.5, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', params: { highCut: 4500 } },
    ],
  },
  {
    id: 'handstroke-gap-clock-hammer',
    name: 'Clock hammer',
    category: 'bell',
    description:
      'A celesta shaken ten times a second, rung against a low C until every note turns to clock metal.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { volume: -8.5, mallet: 0.8, decay: 0.8, damper: 0.2 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: { root: 0, octave: 3, wave: 1, drift: 0.1, mix: 0.45, tone: 5000 },
      },
    ],
  },
  {
    id: 'handstroke-gap-back-five',
    name: 'Back five',
    category: 'bass',
    description:
      'A marimba that hums more than it strikes, down in the tenor register, thickened by a tube preamp and cut above.',
    preview: CALL_CHANGES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { volume: -22, decay: 2.2, mallet: 0.05 },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 14, bias: 0.2, toneDb: -4, outputDb: -6 },
      },
      { deviceId: 'ambient-eq', params: { highCut: 1800 } },
    ],
  },

  // Gated ring: tones struck through a gate.
  {
    id: 'handstroke-gap-wood-at-lead',
    name: 'Wood at lead',
    category: 'plucked',
    description:
      'A wooden folded pluck with the fold opened further by each strike, flammed by three late doubles flying across the room.',
    preview: HUNT_ON_FIVE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: 1.5, fold: 0.5, decay: 0.8, chance: 0 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: { birds: 3, range: 25, speed: 0.4, mix: 0.6, spread: 1, ground: 100 },
      },
    ],
  },
  {
    id: 'handstroke-gap-soft-call',
    name: 'Soft call',
    category: 'keys',
    description:
      'A nearly pure gated tone under a felt-soft strike, returning at two-thirds of its pitch beneath itself.',
    preview: LAST_OF_ROUNDS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: -3, fold: 0.08, decay: 2.4, attack: 0.02, chance: 0 },
    },
    effects: [{ deviceId: 'half-speed', params: { speed: 1, length: 880, smooth: 0.8, mix: 0.4 } }],
  },
  {
    id: 'handstroke-gap-tin-cup-hunt',
    name: 'Tin cup hunt',
    category: 'bell',
    description:
      'Short metallic chimes from a five-to-one modulator, boxed in a small tin with a slack single spring behind.',
    preview: LEAD_END,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: -4, decay: 0.9, fm: 0.35, chance: 0 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', params: { springs: 0, tension: 0.2, decay: 2, mix: 0.25 } },
    ],
  },
  {
    id: 'handstroke-gap-gate-and-glass',
    name: 'Gate and glass',
    category: 'bell',
    description:
      'A modulated glass bell, five seconds open, each colour of it delayed by a different time so a strike fans out.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { volume: -4.5, decay: 5, fm: 0.45, chance: 0 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: { time: 900, shape: 1, bands: 24, feedback: 0.3, mix: 0.55, width: 1 },
      },
    ],
  },
  {
    id: 'handstroke-gap-drummed-touch',
    name: 'Drummed touch',
    category: 'plucked',
    description:
      'Hollow knocks of a third of a second that now and then stumble, a slice repeated or turned round, pressed level after.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { volume: 0.5, decay: 0.3, fm: 0.2, chance: 0 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Gentle stumble' },
      {
        deviceId: 'ambient-comp',
        params: { threshold: -36, ratio: 4, attack: 10, release: 0.4, makeup: 4 },
      },
    ],
  },
  {
    id: 'handstroke-gap-rolling-tenor',
    name: 'Rolling tenor',
    category: 'bass',
    description:
      'A round folded bass that opens and closes with each blow, over a worn tape loop as long as a whole pull and its gap.',
    preview: CALL_CHANGES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { volume: -0.5, decay: 1.6, colour: 0.15 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 3.96, feedback: 0.5, wear: 0.7, wow: 0.3, mix: 0.35 },
      },
    ],
  },
  {
    id: 'handstroke-gap-hum-under-the-sally',
    name: 'Hum under the sally',
    category: 'drone',
    description:
      'A folding drone over a second in the rising, with one overtone fed back until it rings through, dark above.',
    preview: TOWER_AND_DRONE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { attack: 1.2, fold: 0.4, colour: 0.35 },
    },
    effects: [
      { deviceId: 'howl', params: { gain: 0.7, distance: 6, hold: 2, mix: 0.35 } },
      { deviceId: 'ambient-eq', params: { highCut: 3000 } },
    ],
  },
  {
    id: 'handstroke-gap-thumbed-treble',
    name: 'Thumbed treble',
    category: 'plucked',
    description:
      'A thumb-piano tone with three-to-one metal in the strike, put through twelve swept stages until it swims.',
    preview: HUNT_ON_SIX,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { volume: 1.5, decay: 1, fm: 0.5, chance: 0 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 4,
          spread: 100,
          rate: 0.4,
          depth: 90,
          stereo: 180,
          feedback: 55,
          mix: 0.5,
        },
      },
    ],
  },

  // Ring that glows: struck notes that turn to pads.
  {
    id: 'handstroke-gap-light-left-over',
    name: 'Light left over',
    category: 'pad',
    description:
      'A bell strike whose overtones are held as a halo a second later, in a wide tail that rises by octaves.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: -7, bloom: 1.2, fade: 4, tone: 0.4 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: { bloom: 0.6, direction: 0, interval: 1, decay: 5, mix: 0.4, width: 0.9 },
      },
    ],
  },
  {
    id: 'handstroke-gap-breath-in-the-pane',
    name: 'Breath in the pane',
    category: 'pad',
    description:
      'Glass touched lightly and left to its glow, its attacks gone, its air spread out to the sides.',
    preview: QUEENS_HELD,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { strike: 0.1, bloom: 1.2, fade: 3 },
    },
    effects: [
      { deviceId: 'sift', params: { attacks: -30, air: 6, tones: -2, scatter: 1, hold: 0.5 } },
    ],
  },
  {
    id: 'handstroke-gap-plucked-and-hazed',
    name: 'Plucked and hazed',
    category: 'plucked',
    description:
      'A pluck with a short glow behind it, run into a soft fuzz between two reverbs that thickens as rows pile up.',
    preview: HUNT_ON_SIX,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: -1.5, decay: 1.2, glow: 0.35, fade: 1.5 },
    },
    effects: [
      {
        deviceId: 'haze',
        params: { haze: 0.7, blur: 0.4, decay: 3, octave: 0, mix: 0.4, tone: 0.35 },
      },
    ],
  },
  {
    id: 'handstroke-gap-only-the-blow',
    name: 'Only the blow',
    category: 'keys',
    description:
      'Felt strikes with no glow at all, close and plain, recorded on a slow worn reel that dulls and wavers.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the strike',
      params: { decay: 2, tone: 0.35, strike: 1 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { speed: 2, drive: 0.5, wow: 0.35, flutter: 0.15, age: 0.5, hiss: 0.05 },
      },
    ],
  },
  {
    id: 'handstroke-gap-no-clapper',
    name: 'No clapper',
    category: 'pad',
    description:
      'The glow alone, no strike, all five bells at once, set in a thin still winter with a frozen tail.',
    preview: FIRED,
    instrument: { deviceId: 'afterglow', preset: 'Only the glow', params: { bloom: 0.5, fade: 2 } },
    effects: [
      {
        deviceId: 'seasons',
        params: { year: 0.875, turn: 0, depth: 0.9, space: 0.5, grit: 0.2, motion: 0.4 },
      },
    ],
  },
  {
    id: 'handstroke-gap-tenor-at-low-tide',
    name: 'Tenor at low tide',
    category: 'pad',
    description:
      'A dim bell of twelve seconds that turns slowly into its own pad, its tail gliding down all the while.',
    preview: TOWER_AND_DRONE,
    instrument: { deviceId: 'afterglow', preset: 'Low tide bell', params: { bloom: 2.5, fade: 5 } },
    effects: [{ deviceId: 'spiral', params: { climb: -4, decay: 6, tone: 3000, mix: 0.35 } }],
  },
  {
    id: 'handstroke-gap-quick-light',
    name: 'Quick light',
    category: 'keys',
    description:
      'A light glass strike and a glow that is up in half a second and gone in one, shared round a ring of unequal loops.',
    preview: TITTUMS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Quick swell',
      params: { source: 3, strike: 0.5, fade: 0.8 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: { loops: 3, length: 1.2, feedback: 0.6, wear: 0.4, spread: 1, mix: 0.4 },
      },
    ],
  },

  // Felt ring: changes on muffled hammers.
  {
    id: 'handstroke-gap-fully-muffled',
    name: 'Fully muffled',
    category: 'keys',
    description:
      'Felted hammers at their softest, the action silent, in a narrow dark room a wall away.',
    preview: HALF_MUFFLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.6, reverbMix: 0, resonance: 0, soft: 1 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.5, room: 0.6, air: 0.8, wander: 0, decay: 0.7, width: 0.1 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 6, ceiling: -4 } },
    ],
  },
  {
    id: 'handstroke-gap-chime-barrel-hammers',
    name: 'Chime-barrel hammers',
    category: 'keys',
    description:
      'Bare hard hammers with the pedal down, the upper partials stretched sharp until the strings ring like chimes.',
    preview: ROUNDS_ON_EIGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -8, sustain: 1, polyphony: 16, reverbMix: 0.1, thump: 0 },
    },
    effects: [{ deviceId: 'warp', params: { stretch: 0.4, lean: 0.2, drift: 0, mix: 0.7 } }],
  },
  {
    id: 'handstroke-gap-vestry-upright',
    name: 'Vestry upright',
    category: 'keys',
    description:
      'An out-of-tune upright with its action creaking, through a small speaker left on in the next room.',
    preview: COVERED_DOUBLES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -14.5, reverbMix: 0, action: 1 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.15, distance: 0.7, room: 0.5, noise: 0, treble: -0.2 },
      },
    ],
  },
  {
    id: 'handstroke-gap-still-course',
    name: 'Still course',
    category: 'keys',
    description:
      'Strings in perfect unison, felted halfway, with the octave above sounding late like a second ringer.',
    preview: TENOR_BEHIND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { felt: 0.5, reverbMix: 0, resonance: 0.2 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 1, gap: 0.14, interval1: 12, fade: 0.5, tone: 4000, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.2, decay: 0.55 } },
    ],
  },
  {
    id: 'handstroke-gap-pedal-through-the-row',
    name: 'Pedal through the row',
    category: 'pad',
    description:
      'A blurred wash of felt with the pedal held, every note faded in and a dull octave laid under it.',
    preview: SLOW_PULL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: 1, reverbMix: 0.3 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 350, sensitivity: -55 } },
      { deviceId: 'octaves', params: { sub1: 0.5, up1: 0, filter: 1500 } },
    ],
  },
  {
    id: 'handstroke-gap-grit-in-the-bearings',
    name: 'Grit in the bearings',
    category: 'keys',
    description:
      'Worn mono felt with the grit up, played by a machine that has begun to skip and drop part of every row.',
    preview: DORIAN_SEVEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { outputDb: -16, felt: 0.5, hardness: 0.6 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        params: { loss: 0.45, dropouts: 0.15, stutter: 0.1, highCut: 7000 },
      },
    ],
  },
]
