import { type FactoryPreset, type Phrase } from '../types'

// Only the beginning of a note: the key, the nail, the tongue, the hair, and nothing that could be called a pitch held.
// A hundred ways to touch fourteen instruments, sixty heard as single strokes in several weights and the rest as loops
// in 5/4, 7/8 and 4/4 that use them as a drum kit. Some are dry; in others a room keeps what the stroke left out.
// A phrase played through common-tones waits 0.3 s: that device needs something to compare the first stroke with.

// 7/8 as 2+2+3: a low thud on 1, a nail on 3 and 5, a fall of the damper on 4, chiffs on 6 and 7.
const SEVEN_KIT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.05, note: 45, gain: 0.8 },
    { atSec: 0.5, durSec: 0.05, note: 62, gain: 0.5 },
    { atSec: 0.75, durSec: 0.05, note: 52, gain: 0.32 },
    { atSec: 1, durSec: 0.05, note: 57, gain: 0.55 },
    { atSec: 1.25, durSec: 0.05, note: 74, gain: 0.4 },
    { atSec: 1.5, durSec: 0.05, note: 79, gain: 0.34 },
    { atSec: 1.75, durSec: 0.05, note: 40, gain: 0.8 },
    { atSec: 2.25, durSec: 0.05, note: 62, gain: 0.5 },
    { atSec: 2.5, durSec: 0.05, note: 52, gain: 0.32 },
    { atSec: 2.75, durSec: 0.05, note: 57, gain: 0.55 },
    { atSec: 3, durSec: 0.05, note: 74, gain: 0.4 },
    { atSec: 3.25, durSec: 0.05, note: 79, gain: 0.34 },
    { atSec: 3.5, durSec: 0.05, note: 45, gain: 0.8 },
    { atSec: 4, durSec: 0.05, note: 60, gain: 0.5 },
    { atSec: 4.25, durSec: 0.05, note: 52, gain: 0.32 },
    { atSec: 4.5, durSec: 0.05, note: 55, gain: 0.55 },
    { atSec: 4.75, durSec: 0.05, note: 74, gain: 0.4 },
    { atSec: 5, durSec: 0.05, note: 79, gain: 0.34 },
    { atSec: 5.25, durSec: 0.05, note: 40, gain: 0.8 },
    { atSec: 5.75, durSec: 0.05, note: 62, gain: 0.5 },
    { atSec: 6, durSec: 0.05, note: 52, gain: 0.32 },
    { atSec: 6.25, durSec: 0.05, note: 57, gain: 0.55 },
    { atSec: 6.5, durSec: 0.05, note: 74, gain: 0.4 },
    { atSec: 6.75, durSec: 0.05, note: 81, gain: 0.34 },
  ],
}

// 5/4 as 3+2: wooden kicks on 1 and 4 (E, then A or D), E an octave up after 2, light knocks between them.
const FIVE_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.05, note: 28, gain: 0.85 },
    { atSec: 0.45, durSec: 0.05, note: 52, gain: 0.35 },
    { atSec: 0.675, durSec: 0.05, note: 40, gain: 0.6 },
    { atSec: 0.9, durSec: 0.05, note: 57, gain: 0.45 },
    { atSec: 1.35, durSec: 0.05, note: 33, gain: 0.75 },
    { atSec: 1.575, durSec: 0.05, note: 57, gain: 0.25 },
    { atSec: 1.8, durSec: 0.05, note: 52, gain: 0.45 },
    { atSec: 2.25, durSec: 0.05, note: 28, gain: 0.85 },
    { atSec: 2.7, durSec: 0.05, note: 52, gain: 0.35 },
    { atSec: 2.925, durSec: 0.05, note: 40, gain: 0.6 },
    { atSec: 3.15, durSec: 0.05, note: 57, gain: 0.45 },
    { atSec: 3.6, durSec: 0.05, note: 33, gain: 0.75 },
    { atSec: 4.05, durSec: 0.05, note: 52, gain: 0.45 },
    { atSec: 4.5, durSec: 0.05, note: 28, gain: 0.85 },
    { atSec: 4.95, durSec: 0.05, note: 52, gain: 0.35 },
    { atSec: 5.175, durSec: 0.05, note: 40, gain: 0.6 },
    { atSec: 5.4, durSec: 0.05, note: 57, gain: 0.45 },
    { atSec: 5.85, durSec: 0.05, note: 38, gain: 0.75 },
    { atSec: 6.075, durSec: 0.05, note: 57, gain: 0.25 },
    { atSec: 6.3, durSec: 0.05, note: 52, gain: 0.45 },
  ],
}

// 4/4: low on 1 and 3, a back beat on 2 and 4, high ticks off the beat.
const FOUR_BOX: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.05, note: 40, gain: 0.8 },
    { atSec: 0.6, durSec: 0.05, note: 60, gain: 0.5 },
    { atSec: 0.9, durSec: 0.05, note: 67, gain: 0.28 },
    { atSec: 1.2, durSec: 0.05, note: 45, gain: 0.65 },
    { atSec: 1.5, durSec: 0.05, note: 72, gain: 0.4 },
    { atSec: 1.8, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 2.1, durSec: 0.05, note: 76, gain: 0.3 },
    { atSec: 2.4, durSec: 0.05, note: 40, gain: 0.8 },
    { atSec: 3, durSec: 0.05, note: 60, gain: 0.5 },
    { atSec: 3.3, durSec: 0.05, note: 67, gain: 0.28 },
    { atSec: 3.6, durSec: 0.05, note: 45, gain: 0.65 },
    { atSec: 3.9, durSec: 0.05, note: 74, gain: 0.4 },
    { atSec: 4.2, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 4.8, durSec: 0.05, note: 40, gain: 0.8 },
    { atSec: 5.4, durSec: 0.05, note: 60, gain: 0.5 },
    { atSec: 5.7, durSec: 0.05, note: 69, gain: 0.28 },
    { atSec: 6, durSec: 0.05, note: 45, gain: 0.65 },
    { atSec: 6.3, durSec: 0.05, note: 72, gain: 0.4 },
    { atSec: 6.6, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 6.9, durSec: 0.05, note: 76, gain: 0.3 },
  ],
}

// 5/4 as 2+3, high: the accents on 1 and 3, ticks on the off-beats, back to 1 at the end.
const FIVE_PLUCK: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.05, note: 62, gain: 0.7 },
    { atSec: 0.7, durSec: 0.05, note: 76, gain: 0.4 },
    { atSec: 1.1, durSec: 0.05, note: 69, gain: 0.6 },
    { atSec: 1.3, durSec: 0.05, note: 81, gain: 0.28 },
    { atSec: 1.5, durSec: 0.05, note: 64, gain: 0.45 },
    { atSec: 1.9, durSec: 0.05, note: 74, gain: 0.5 },
    { atSec: 2.1, durSec: 0.05, note: 86, gain: 0.25 },
    { atSec: 2.3, durSec: 0.05, note: 60, gain: 0.7 },
    { atSec: 2.7, durSec: 0.05, note: 76, gain: 0.4 },
    { atSec: 3.1, durSec: 0.05, note: 69, gain: 0.6 },
    { atSec: 3.3, durSec: 0.05, note: 79, gain: 0.28 },
    { atSec: 3.5, durSec: 0.05, note: 64, gain: 0.45 },
    { atSec: 3.9, durSec: 0.05, note: 74, gain: 0.5 },
    { atSec: 4.1, durSec: 0.05, note: 86, gain: 0.25 },
    { atSec: 4.3, durSec: 0.05, note: 65, gain: 0.7 },
    { atSec: 4.7, durSec: 0.05, note: 76, gain: 0.4 },
    { atSec: 5.1, durSec: 0.05, note: 69, gain: 0.6 },
    { atSec: 5.3, durSec: 0.05, note: 81, gain: 0.28 },
    { atSec: 5.5, durSec: 0.05, note: 64, gain: 0.45 },
    { atSec: 5.9, durSec: 0.05, note: 72, gain: 0.5 },
    { atSec: 6.1, durSec: 0.05, note: 86, gain: 0.25 },
    { atSec: 6.3, durSec: 0.05, note: 62, gain: 0.7 },
    { atSec: 6.7, durSec: 0.05, note: 76, gain: 0.35 },
  ],
}

// 7/8 as 2+2+3 on three keys: D the low one, A a shaker, E a hat on 6 and 7.
const SEVEN_AIR: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.05, note: 62, gain: 0.75 },
    { atSec: 0.55, durSec: 0.05, note: 69, gain: 0.3 },
    { atSec: 0.8, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 1.05, durSec: 0.05, note: 69, gain: 0.3 },
    { atSec: 1.3, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 1.55, durSec: 0.05, note: 76, gain: 0.6 },
    { atSec: 1.8, durSec: 0.05, note: 76, gain: 0.42 },
    { atSec: 2.05, durSec: 0.05, note: 62, gain: 0.75 },
    { atSec: 2.55, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 2.8, durSec: 0.05, note: 69, gain: 0.3 },
    { atSec: 3.05, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 3.3, durSec: 0.05, note: 76, gain: 0.6 },
    { atSec: 3.55, durSec: 0.05, note: 76, gain: 0.42 },
    { atSec: 3.8, durSec: 0.05, note: 62, gain: 0.75 },
    { atSec: 4.05, durSec: 0.05, note: 69, gain: 0.3 },
    { atSec: 4.3, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 4.55, durSec: 0.05, note: 69, gain: 0.3 },
    { atSec: 4.8, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 5.05, durSec: 0.05, note: 76, gain: 0.6 },
    { atSec: 5.3, durSec: 0.05, note: 76, gain: 0.42 },
    { atSec: 5.55, durSec: 0.05, note: 62, gain: 0.75 },
    { atSec: 5.8, durSec: 0.05, note: 69, gain: 0.3 },
    { atSec: 6.05, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 6.55, durSec: 0.05, note: 69, gain: 0.5 },
    { atSec: 6.8, durSec: 0.05, note: 76, gain: 0.6 },
    { atSec: 7.05, durSec: 0.05, note: 76, gain: 0.42 },
  ],
}

// 5/4 as 3+2, one line of slaps from D up to A, accents on 1 and 4.
const FIVE_REED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.05, note: 50, gain: 0.75 },
    { atSec: 0.45, durSec: 0.05, note: 64, gain: 0.4 },
    { atSec: 0.675, durSec: 0.05, note: 57, gain: 0.3 },
    { atSec: 0.9, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 1.35, durSec: 0.05, note: 52, gain: 0.65 },
    { atSec: 1.575, durSec: 0.05, note: 69, gain: 0.35 },
    { atSec: 1.8, durSec: 0.05, note: 64, gain: 0.45 },
    { atSec: 2.025, durSec: 0.05, note: 57, gain: 0.25 },
    { atSec: 2.25, durSec: 0.05, note: 50, gain: 0.75 },
    { atSec: 2.7, durSec: 0.05, note: 64, gain: 0.4 },
    { atSec: 3.15, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 3.6, durSec: 0.05, note: 52, gain: 0.65 },
    { atSec: 3.825, durSec: 0.05, note: 69, gain: 0.35 },
    { atSec: 4.05, durSec: 0.05, note: 64, gain: 0.45 },
    { atSec: 4.275, durSec: 0.05, note: 57, gain: 0.25 },
    { atSec: 4.5, durSec: 0.05, note: 50, gain: 0.75 },
    { atSec: 4.95, durSec: 0.05, note: 64, gain: 0.4 },
    { atSec: 5.175, durSec: 0.05, note: 57, gain: 0.3 },
    { atSec: 5.4, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 5.85, durSec: 0.05, note: 53, gain: 0.65 },
    { atSec: 6.075, durSec: 0.05, note: 69, gain: 0.35 },
    { atSec: 6.3, durSec: 0.05, note: 65, gain: 0.45 },
    { atSec: 6.525, durSec: 0.05, note: 57, gain: 0.25 },
  ],
}

// 4/4 for dead bass strings, one at a time: E and A on 1 and 3, changing places in the second bar, higher taps around them.
const FOUR_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.05, note: 28, gain: 0.85 },
    { atSec: 0.6, durSec: 0.05, note: 38, gain: 0.45 },
    { atSec: 0.9, durSec: 0.05, note: 43, gain: 0.3 },
    { atSec: 1.2, durSec: 0.05, note: 33, gain: 0.7 },
    { atSec: 1.65, durSec: 0.05, note: 28, gain: 0.3 },
    { atSec: 1.8, durSec: 0.05, note: 40, gain: 0.55 },
    { atSec: 2.1, durSec: 0.05, note: 38, gain: 0.35 },
    { atSec: 2.4, durSec: 0.05, note: 33, gain: 0.85 },
    { atSec: 3, durSec: 0.05, note: 38, gain: 0.45 },
    { atSec: 3.3, durSec: 0.05, note: 43, gain: 0.3 },
    { atSec: 3.6, durSec: 0.05, note: 28, gain: 0.7 },
    { atSec: 4.2, durSec: 0.05, note: 40, gain: 0.55 },
    { atSec: 4.5, durSec: 0.05, note: 38, gain: 0.35 },
    { atSec: 4.8, durSec: 0.05, note: 28, gain: 0.85 },
    { atSec: 5.4, durSec: 0.05, note: 38, gain: 0.45 },
    { atSec: 5.7, durSec: 0.05, note: 43, gain: 0.3 },
    { atSec: 6, durSec: 0.05, note: 33, gain: 0.7 },
    { atSec: 6.45, durSec: 0.05, note: 28, gain: 0.3 },
    { atSec: 6.6, durSec: 0.05, note: 45, gain: 0.55 },
    { atSec: 6.9, durSec: 0.05, note: 38, gain: 0.35 },
  ],
}

// 5/4 as 3+2 across four open strings in fifths, C G D A: a tenth of a second on each, for what speaks slowly.
const OPEN_STRINGS: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.12, note: 36, gain: 0.8 },
    { atSec: 0.75, durSec: 0.12, note: 50, gain: 0.4 },
    { atSec: 0.975, durSec: 0.12, note: 57, gain: 0.3 },
    { atSec: 1.2, durSec: 0.12, note: 43, gain: 0.6 },
    { atSec: 1.65, durSec: 0.12, note: 36, gain: 0.7 },
    { atSec: 2.1, durSec: 0.12, note: 57, gain: 0.45 },
    { atSec: 2.325, durSec: 0.12, note: 50, gain: 0.3 },
    { atSec: 2.55, durSec: 0.12, note: 43, gain: 0.8 },
    { atSec: 3, durSec: 0.12, note: 50, gain: 0.4 },
    { atSec: 3.225, durSec: 0.12, note: 57, gain: 0.3 },
    { atSec: 3.45, durSec: 0.12, note: 36, gain: 0.6 },
    { atSec: 3.9, durSec: 0.12, note: 36, gain: 0.7 },
    { atSec: 4.35, durSec: 0.12, note: 57, gain: 0.45 },
    { atSec: 4.575, durSec: 0.12, note: 50, gain: 0.3 },
    { atSec: 4.8, durSec: 0.12, note: 36, gain: 0.8 },
    { atSec: 5.25, durSec: 0.12, note: 50, gain: 0.4 },
    { atSec: 5.7, durSec: 0.12, note: 43, gain: 0.6 },
    { atSec: 6.15, durSec: 0.12, note: 36, gain: 0.7 },
    { atSec: 6.6, durSec: 0.12, note: 57, gain: 0.45 },
    { atSec: 6.825, durSec: 0.12, note: 50, gain: 0.3 },
  ],
}

// 4/4 hocket in D dorian: an upper voice on the beat and a lower one off it, neither ever sounding with the other,
// moving mostly against each other and closing from a sixth out to the octave D.
const HOCKET: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.1, note: 69, gain: 0.7 },
    { atSec: 0.6, durSec: 0.1, note: 62, gain: 0.45 },
    { atSec: 0.9, durSec: 0.1, note: 67, gain: 0.5 },
    { atSec: 1.2, durSec: 0.1, note: 64, gain: 0.45 },
    { atSec: 1.5, durSec: 0.1, note: 69, gain: 0.7 },
    { atSec: 1.8, durSec: 0.1, note: 62, gain: 0.45 },
    { atSec: 2.1, durSec: 0.1, note: 72, gain: 0.5 },
    { atSec: 2.4, durSec: 0.1, note: 60, gain: 0.45 },
    { atSec: 2.7, durSec: 0.1, note: 71, gain: 0.7 },
    { atSec: 3, durSec: 0.1, note: 62, gain: 0.45 },
    { atSec: 3.3, durSec: 0.1, note: 69, gain: 0.5 },
    { atSec: 3.6, durSec: 0.1, note: 65, gain: 0.45 },
    { atSec: 3.9, durSec: 0.1, note: 67, gain: 0.7 },
    { atSec: 4.2, durSec: 0.1, note: 64, gain: 0.45 },
    { atSec: 4.5, durSec: 0.1, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 0.1, note: 62, gain: 0.45 },
    { atSec: 5.1, durSec: 0.1, note: 69, gain: 0.7 },
    { atSec: 5.4, durSec: 0.1, note: 65, gain: 0.45 },
    { atSec: 5.7, durSec: 0.1, note: 71, gain: 0.5 },
    { atSec: 6, durSec: 0.1, note: 62, gain: 0.45 },
    { atSec: 6.3, durSec: 0.1, note: 72, gain: 0.7 },
    { atSec: 6.6, durSec: 0.1, note: 64, gain: 0.45 },
    { atSec: 6.9, durSec: 0.1, note: 74, gain: 0.5 },
    { atSec: 7.2, durSec: 0.1, note: 62, gain: 0.45 },
  ],
}

// One key, D, in eight weights of touch from the lightest to the heaviest, each stroke given twice.
const EIGHT_WEIGHTS: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.05, note: 62, gain: 0.2 },
    { atSec: 0.52, durSec: 0.05, note: 62, gain: 0.2 },
    { atSec: 1.18, durSec: 0.05, note: 62, gain: 0.3 },
    { atSec: 1.4, durSec: 0.05, note: 62, gain: 0.3 },
    { atSec: 2.06, durSec: 0.05, note: 62, gain: 0.4 },
    { atSec: 2.28, durSec: 0.05, note: 62, gain: 0.4 },
    { atSec: 2.94, durSec: 0.05, note: 62, gain: 0.5 },
    { atSec: 3.16, durSec: 0.05, note: 62, gain: 0.5 },
    { atSec: 3.82, durSec: 0.05, note: 62, gain: 0.6 },
    { atSec: 4.04, durSec: 0.05, note: 62, gain: 0.6 },
    { atSec: 4.7, durSec: 0.05, note: 62, gain: 0.7 },
    { atSec: 4.92, durSec: 0.05, note: 62, gain: 0.7 },
    { atSec: 5.58, durSec: 0.05, note: 62, gain: 0.8 },
    { atSec: 5.8, durSec: 0.05, note: 62, gain: 0.8 },
    { atSec: 6.46, durSec: 0.05, note: 62, gain: 0.9 },
    { atSec: 6.68, durSec: 0.05, note: 62, gain: 0.9 },
  ],
}

// The eight weights of touch on a low A, each stroke given twice.
const EIGHT_LOW: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.06, note: 45, gain: 0.2 },
    { atSec: 0.52, durSec: 0.06, note: 45, gain: 0.2 },
    { atSec: 1.18, durSec: 0.06, note: 45, gain: 0.3 },
    { atSec: 1.4, durSec: 0.06, note: 45, gain: 0.3 },
    { atSec: 2.06, durSec: 0.06, note: 45, gain: 0.4 },
    { atSec: 2.28, durSec: 0.06, note: 45, gain: 0.4 },
    { atSec: 2.94, durSec: 0.06, note: 45, gain: 0.5 },
    { atSec: 3.16, durSec: 0.06, note: 45, gain: 0.5 },
    { atSec: 3.82, durSec: 0.06, note: 45, gain: 0.6 },
    { atSec: 4.04, durSec: 0.06, note: 45, gain: 0.6 },
    { atSec: 4.7, durSec: 0.06, note: 45, gain: 0.7 },
    { atSec: 4.92, durSec: 0.06, note: 45, gain: 0.7 },
    { atSec: 5.58, durSec: 0.06, note: 45, gain: 0.8 },
    { atSec: 5.8, durSec: 0.06, note: 45, gain: 0.8 },
    { atSec: 6.46, durSec: 0.06, note: 45, gain: 0.9 },
    { atSec: 6.68, durSec: 0.06, note: 45, gain: 0.9 },
  ],
}

// Four chords struck and never held: Dm7, G9 without its fifth, Cmaj7, Fmaj7, each with a lighter second stroke after it.
const FOUR_UNSOUNDED: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.1, note: 50, gain: 0.6 },
    { atSec: 0.3, durSec: 0.1, note: 57, gain: 0.6 },
    { atSec: 0.3, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 0.3, durSec: 0.1, note: 65, gain: 0.6 },
    { atSec: 0.6, durSec: 0.1, note: 50, gain: 0.4 },
    { atSec: 0.6, durSec: 0.1, note: 57, gain: 0.4 },
    { atSec: 0.6, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 0.6, durSec: 0.1, note: 65, gain: 0.4 },
    { atSec: 2, durSec: 0.1, note: 43, gain: 0.6 },
    { atSec: 2, durSec: 0.1, note: 57, gain: 0.6 },
    { atSec: 2, durSec: 0.1, note: 59, gain: 0.6 },
    { atSec: 2, durSec: 0.1, note: 65, gain: 0.6 },
    { atSec: 2.3, durSec: 0.1, note: 43, gain: 0.4 },
    { atSec: 2.3, durSec: 0.1, note: 57, gain: 0.4 },
    { atSec: 2.3, durSec: 0.1, note: 59, gain: 0.4 },
    { atSec: 2.3, durSec: 0.1, note: 65, gain: 0.4 },
    { atSec: 3.7, durSec: 0.1, note: 48, gain: 0.6 },
    { atSec: 3.7, durSec: 0.1, note: 55, gain: 0.6 },
    { atSec: 3.7, durSec: 0.1, note: 59, gain: 0.6 },
    { atSec: 3.7, durSec: 0.1, note: 64, gain: 0.6 },
    { atSec: 4, durSec: 0.1, note: 48, gain: 0.4 },
    { atSec: 4, durSec: 0.1, note: 55, gain: 0.4 },
    { atSec: 4, durSec: 0.1, note: 59, gain: 0.4 },
    { atSec: 4, durSec: 0.1, note: 64, gain: 0.4 },
    { atSec: 5.4, durSec: 0.1, note: 41, gain: 0.6 },
    { atSec: 5.4, durSec: 0.1, note: 57, gain: 0.6 },
    { atSec: 5.4, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 5.4, durSec: 0.1, note: 64, gain: 0.6 },
    { atSec: 5.7, durSec: 0.1, note: 41, gain: 0.4 },
    { atSec: 5.7, durSec: 0.1, note: 57, gain: 0.4 },
    { atSec: 5.7, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 5.7, durSec: 0.1, note: 64, gain: 0.4 },
  ],
}

// Single strokes with grace strokes before them: two flams, two drags, a ruff, a flam, a stroke, a ruff.
const RUDIMENTS: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.03, note: 62, gain: 0.28 },
    { atSec: 0.345, durSec: 0.05, note: 64, gain: 0.8 },
    { atSec: 1.3, durSec: 0.03, note: 67, gain: 0.28 },
    { atSec: 1.345, durSec: 0.05, note: 69, gain: 0.7 },
    { atSec: 2.3, durSec: 0.03, note: 62, gain: 0.28 },
    { atSec: 2.345, durSec: 0.03, note: 62, gain: 0.28 },
    { atSec: 2.39, durSec: 0.05, note: 64, gain: 0.8 },
    { atSec: 3.3, durSec: 0.03, note: 67, gain: 0.28 },
    { atSec: 3.345, durSec: 0.03, note: 67, gain: 0.28 },
    { atSec: 3.39, durSec: 0.05, note: 69, gain: 0.7 },
    { atSec: 4.3, durSec: 0.03, note: 64, gain: 0.28 },
    { atSec: 4.345, durSec: 0.03, note: 65, gain: 0.28 },
    { atSec: 4.39, durSec: 0.03, note: 64, gain: 0.28 },
    { atSec: 4.435, durSec: 0.05, note: 62, gain: 0.85 },
    { atSec: 5.5, durSec: 0.03, note: 62, gain: 0.28 },
    { atSec: 5.545, durSec: 0.05, note: 60, gain: 0.8 },
    { atSec: 6.2, durSec: 0.05, note: 62, gain: 0.55 },
    { atSec: 6.8, durSec: 0.03, note: 64, gain: 0.28 },
    { atSec: 6.845, durSec: 0.03, note: 62, gain: 0.28 },
    { atSec: 6.89, durSec: 0.03, note: 60, gain: 0.28 },
    { atSec: 6.935, durSec: 0.05, note: 62, gain: 0.8 },
  ],
}

// One stroke to a bar and the room after it: D and A, E and B, A and E, then D and A again: open fifths, two of them spread wider.
const ONE_A_BAR: Phrase = {
  notes: [
    { atSec: 0.3, durSec: 0.12, note: 50, gain: 0.7 },
    { atSec: 0.3, durSec: 0.12, note: 57, gain: 0.5 },
    { atSec: 2, durSec: 0.12, note: 52, gain: 0.6 },
    { atSec: 2, durSec: 0.12, note: 71, gain: 0.4 },
    { atSec: 3.7, durSec: 0.12, note: 57, gain: 0.7 },
    { atSec: 3.7, durSec: 0.12, note: 76, gain: 0.35 },
    { atSec: 5.4, durSec: 0.12, note: 50, gain: 0.6 },
    { atSec: 5.4, durSec: 0.12, note: 57, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'only-the-attack-case-kicks',
    name: 'Case kicks',
    category: 'drum',
    description:
      'Rubber under every string, the thud of the key full up and the ring cut short, through the low end of a warm stack of speakers.',
    preview: FIVE_LOW,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: {
        amount: 1,
        thud: 1,
        decay: 0.25,
        hammer: 0.4,
        tone: 0.35,
        rattle: 0,
        width: 0.2,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Warm stack',
        params: { noise: 0, distance: 0.1, room: 0.2, bass: 0.6 },
      },
    ],
  },
  {
    id: 'only-the-attack-keybed-knuckle',
    name: 'Keybed knuckle',
    category: 'drum',
    description:
      'Felted strings with the softest hammer and all of the key thud, heard through a large wooden soundboard with the top filtered away.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { amount: 1, hammer: 0.05, thud: 1, tone: 0.1, decay: 0.25, rattle: 0, volume: 2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.75, size: 1.3 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 700, resonance: 0.8 },
      },
    ],
  },
  {
    id: 'only-the-attack-bolt-head-tap',
    name: 'Bolt head tap',
    category: 'bell',
    description:
      'Bolts at the very end of the string struck hard and cut off, the lows filtered out, the tap limited and laid on a short bright plate.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: {
        amount: 1,
        position: 0.05,
        hammer: 1,
        decay: 0.25,
        tone: 1,
        thud: 0,
        width: 0.9,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 700 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 30, outputGain: -6 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.35, mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-attack-paper-edge-snap',
    name: 'Paper edge snap',
    category: 'keys',
    description:
      'Paper on the strings, buzzing at once and gone: its strikes brought forward, limited and made a little wider.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { decay: 0.7, rattle: 1, hammer: 0.9, thud: 0, volume: -19.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6, air: -2, tones: -4 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 40, outputGain: -7 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide', params: { width: 0.7 } },
    ],
  },
  {
    id: 'only-the-attack-fallboard-closing',
    name: 'Fallboard closing',
    category: 'keys',
    description:
      'A muffled rubber thud from the softest hammer there is, and a vast dark hall that holds on to the low knock of it.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { amount: 0.9, hammer: 0, thud: 1, tone: 0, decay: 0.4, rattle: 0, volume: 4.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { damping: 1800, mix: 0.42 } },
    ],
  },
  {
    id: 'only-the-attack-rim-of-the-soundboard',
    name: 'Rim of the soundboard',
    category: 'drum',
    description:
      'Rubber wood blocks played hard and dry, each followed by one slap of tape echo a sixteenth later.',
    preview: SEVEN_KIT,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { decay: 0.25, thud: 0.2, amount: 0.9, width: 0.8, volume: 6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 125, feedback: 0, mix: 0.35, highCut: 3000 },
      },
    ],
  },
  {
    id: 'only-the-attack-felt-over-the-dampers',
    name: 'Felt over the dampers',
    category: 'keys',
    description:
      'Felt-muted strings with some of the key thud, held by a gated room for a fifth of a second and then shut off.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { hammer: 0.45, thud: 0.4, tone: 0.6, decay: 0.3, amount: 1, volume: 1.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.2, mix: 0.45, colour: 0.2 } },
    ],
  },
  {
    id: 'only-the-attack-hammer-shank',
    name: 'Hammer shank',
    category: 'drum',
    description:
      'Bolted strings, all hammer, whose partials are stretched apart into stiff wood and rounded over by a tube.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { decay: 0.25, hammer: 1, thud: 0.6, rattle: 0, amount: 0.8, volume: -3 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.6, mix: 0.85 } },
      { deviceId: 'saturator', preset: 'Tube preamp' },
    ],
  },
  {
    id: 'only-the-attack-nut-and-washer',
    name: 'Nut and washer',
    category: 'bell',
    description:
      'Loose rattling bolts reduced to what changes at the start, driven until it bites, then scattered as close echoes.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { decay: 0.25, rattle: 1, hammer: 0.7, thud: 0, tone: 0.9, volume: 5.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 70 } },
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.45 } },
      { deviceId: 'constellation', preset: 'Close flicker', params: { span: 500, mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-drawer-of-small-things',
    name: 'Drawer of small things',
    category: 'drum',
    description:
      'Every key its own object, rattling, cut short and passed through an early sampler with its converters left rough.',
    preview: FOUR_BOX,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: {
        amount: 1,
        rattle: 0.9,
        decay: 0.25,
        hammer: 0.7,
        thud: 0.5,
        tone: 0.8,
        volume: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Dusty',
        params: { rate: 14000, mix: 0.9, drive: 18 },
      },
    ],
  },
  {
    id: 'only-the-attack-unstrung-down-the-hall',
    name: 'Unstrung, down the hall',
    category: 'keys',
    description:
      'Felt over the strings and a soft hammer, played through a small amplifier far down a hall, so that mostly the room answers.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { amount: 1, decay: 0.25, thud: 0.9, hammer: 0.2, tone: 0.4, volume: 6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { drive: 0.15, noise: 0, room: 0.7 } },
    ],
  },
  {
    id: 'only-the-attack-eraser-by-the-bridge',
    name: 'Eraser by the bridge',
    category: 'plucked',
    description:
      'Soft rubber near the end of the string hit with a hard hammer, shifted off its pitch by some eighty hertz and limited hard.',
    preview: SEVEN_KIT,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: {
        position: 0.06,
        hammer: 1,
        decay: 0.25,
        tone: 1,
        thud: 0,
        amount: 0.75,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Bell metal',
        params: { shift: 83, feedback: 0.1, mix: 0.7 },
      },
      {
        deviceId: 'fet-limiter',
        preset: 'Light touch',
        params: { inputGain: 32, outputGain: -8.5 },
      },
    ],
  },
  {
    id: 'only-the-attack-knock-through-the-case',
    name: 'Knock through the case',
    category: 'drum',
    description:
      'Rubber thuds heard from inside a deep hard bottle, dark, the hammers hardly there, the peaks limited.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: {
        preparation: 2,
        amount: 1,
        hammer: 0.2,
        decay: 0.25,
        thud: 1,
        rattle: 0.2,
        volume: 3.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Deep well', params: { mix: 0.8, size: 2.2 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 24, outputGain: -8.5 } },
    ],
  },
  {
    id: 'only-the-attack-rehearsal-on-the-lid',
    name: 'Rehearsal on the lid',
    category: 'keys',
    description:
      'Lightly prepared strings with all the thud and almost no decay, broken up by a tight swarm of short echoes.',
    preview: FOUR_BOX,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { thud: 1, decay: 0.25, hammer: 0.6, tone: 0.5, amount: 0.3, volume: 5.5 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { length: 0.16, mix: 0.4 } },
    ],
  },
  {
    id: 'only-the-attack-pick-before-the-note',
    name: 'Pick before the note',
    category: 'plucked',
    description:
      'Steel strings picked hard by the bridge, choked, the click sifted forward and limited, then most of it blurred for a twentieth of a second.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: {
        sustain: 0.5,
        release: 0.05,
        position: 0.06,
        nail: 1,
        tone: 1,
        shimmer: 0,
        volume: -14.5,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6, tones: -3, air: -4 } },
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -4 } },
      { deviceId: 'fog', preset: 'Short blur', params: { size: 60, mix: 0.75 } },
    ],
  },
  {
    id: 'only-the-attack-nail-along-the-wound-e',
    name: 'Nail along the wound E',
    category: 'plucked',
    description:
      'A long nail on a bare low string, driven by a triode and left as a narrow band of scrape.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -4.5, sustain: 0.5, release: 0.05, nail: 1, position: 0.06, body: 0 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Phone line',
        params: { cutoffHz: 1500, driveDb: 7, resonance: 0.7 },
      },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.55, output: 6.5 } },
    ],
  },
  {
    id: 'only-the-attack-palm-on-the-top',
    name: 'Palm on the top',
    category: 'drum',
    description:
      'The thumb at the neck with no nail and the strings dead, all body, inside a drum twice its size.',
    preview: FOUR_BOX,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { sustain: 0.5, release: 0.05, position: 0.4, tone: 0, strum: 0, volume: 3.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Kettle', params: { material: 0.25, size: 2, mix: 0.75 } },
    ],
  },
  {
    id: 'only-the-attack-side-of-the-hand',
    name: 'Side of the hand',
    category: 'plucked',
    description:
      'A palm-muted steel string let go in eight hundredths of a second, saturated, in a small plate that is over almost as soon.',
    preview: SEVEN_KIT,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { sustain: 0.5, nail: 0.8, position: 0.12, volume: -5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 12 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.25, mix: 0.4 } },
    ],
  },
  {
    id: 'only-the-attack-flesh-no-nail',
    name: 'Flesh, no nail',
    category: 'plucked',
    description:
      'Nylon touched by the fingertip alone and damped at once, each attack spread into a tenth of a second of warm fog.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { nail: 0, sustain: 0.5, release: 0.05, position: 0.3, tone: 0.4, volume: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { size: 110, mix: 0.7 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: 5 } },
    ],
  },
  {
    id: 'only-the-attack-golpe',
    name: 'Golpe',
    category: 'drum',
    description:
      'Nylon strings plucked hard at the bridge and choked, heard as a small tin drum and pressed flat by a limiter.',
    preview: FOUR_BOX,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { sustain: 0.5, release: 0.05, body: 1, nail: 1, volume: -6 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { size: 0.5, mix: 0.95 } },
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'only-the-attack-twelve-choked-courses',
    name: 'Twelve choked courses',
    category: 'plucked',
    description:
      'Twelve strings picked together; what the first quarter of a second changes comes through, pressed flat and doubled to the sides.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { sustain: 1, release: 0.05, nail: 1, volume: -4 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what moves',
        params: { ago: 250, broad: 0.6, strict: 0.4 },
      },
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -9.2 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'only-the-attack-dead-strum',
    name: 'Dead strum',
    category: 'plucked',
    description:
      'Every chord rolled over a tenth of a second on choked strings, a quick twang of spring behind it.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { sustain: 0.5, release: 0.05, body: 0.5, nail: 0.7, strum: 110, volume: 0.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.3 } }],
  },
  {
    id: 'only-the-attack-rosin-bite',
    name: 'Rosin bite',
    category: 'string',
    description:
      'A bow full of air pressed hard on a string that cannot ring: the grip of the hair, its tone sifted away and the rest driven.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        air: 1,
        pressure: 1,
        swell: 0.005,
        release: 0.03,
        decay: 0.1,
        bright: 0.8,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6, output: 6 } },
    ],
  },
  {
    id: 'only-the-attack-spit-valve',
    name: 'Spit valve',
    category: 'wind',
    description:
      'Air blown into a stopped pipe, its first change kept and nothing held, with a short tube of glass round the puff and the level raised.',
    preview: SEVEN_AIR,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        air: 1,
        pressure: 0.2,
        swell: 0.005,
        release: 0.03,
        decay: 0.1,
        bright: 0.7,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60 } },
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.55 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 10 } },
    ],
  },
  {
    id: 'only-the-attack-yarn-on-a-damped-bar',
    name: 'Yarn on a damped bar',
    category: 'bell',
    description:
      'A soft mallet on a wooden bar whose ring is cut to a tenth of a second, in a chamber of one second.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck wood bar',
      params: { decay: 0.1, release: 0.03, bright: 0.05, position: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { threshold: -40, makeup: 14 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-stick-on-the-cup',
    name: 'Stick on the cup',
    category: 'bell',
    description:
      'A mallet on the rim of a bowl held still by the hand: the click, its partials pulled wider apart, limited, in a tight room.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: { decay: 0.3, release: 0.03, bright: 1, position: 0.02, width: 1, volume: 4 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { mix: 0.8 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 22, outputGain: -3.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.5, decay: 0.4 } },
    ],
  },
  {
    id: 'only-the-attack-cork-out-of-the-pipe',
    name: 'Cork out of the pipe',
    category: 'plucked',
    description:
      'A plucked stopped pipe with no ring, a soft pop with a little air, sent once round a dark bucket-brigade slap.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: { decay: 0.1, release: 0.03, air: 0.5, bright: 0.35, volume: -5.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 6 } },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { feedback: 0.15, mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-ruler-over-the-desk',
    name: 'Ruler over the desk',
    category: 'plucked',
    description:
      'A plucked bar stopped dead, pushed through a small loudspeaker set close to the microphone.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked bar',
      params: { decay: 0.1, release: 0.03, bright: 0.7, position: 0.4, volume: 1.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0, distance: 0.1 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'only-the-attack-stopped-string-stick',
    name: 'Stopped string, stick',
    category: 'drum',
    description:
      'A hard mallet on a stopped string, a third of the way along, all knock, with the lows of a transformer behind it.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        decay: 0.13,
        release: 0.03,
        position: 0.33,
        pressure: 0.9,
        bright: 0.3,
        volume: -12.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Iron lows',
        params: { drive: 1, output: 4, tone: -0.3 },
      },
    ],
  },
  {
    id: 'only-the-attack-bow-across-the-rail',
    name: 'Bow across the rail',
    category: 'texture',
    description:
      'A bow pressed on a metal bar for an instant; only its change is kept, and a far room takes it in.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { swell: 0.005, release: 0.03, decay: 0.1, air: 0.8, pressure: 0.9, volume: 1.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 80 } },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.5 } },
    ],
  },
  {
    id: 'only-the-attack-foam-under-the-low-e',
    name: 'Foam under the low E',
    category: 'bass',
    description:
      'A fully muted electric string touched by the thumb, all thud, with its low end turned up and its top closed.',
    preview: FOUR_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { mute: 1, sustain: 0.5, release: 0.03, touch: 0.05, volume: 5.5 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4, highCut: 1400 } }],
  },
  {
    id: 'only-the-attack-slap-and-no-string',
    name: 'Slap and no string',
    category: 'drum',
    description:
      'An upright slapped with the strings held dead: the rattle on the fingerboard, sifted forward, limited, in a short ambience.',
    preview: FOUR_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { mute: 0.8, sustain: 0.5, release: 0.03, touch: 1, tone: 1, volume: -5.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6, tones: -2, air: 0 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 32, outputGain: -3.8 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.6, decay: 0.8 } },
    ],
  },
  {
    id: 'only-the-attack-pick-guard-tick',
    name: 'Pick guard tick',
    category: 'drum',
    description:
      'A hard pick on a muted string by the bridge, the lows cut away to leave the tick, with a tight room around it.',
    preview: FOUR_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: {
        mute: 0.9,
        sustain: 0.5,
        release: 0.03,
        touch: 1,
        position: 0.05,
        tone: 1,
        volume: 1.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 300 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 38, outputGain: -2.2 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.58, decay: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-heel-of-the-palm',
    name: 'Heel of the palm',
    category: 'bass',
    description:
      'A soft dark upright damped by the hand, heard through the skin of a drum, each stroke left to fall inside it.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { mute: 0.8, sustain: 0.5, release: 0.03, position: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.6, material: 0.3, mix: 0.65 } },
    ],
  },
  {
    id: 'only-the-attack-rubbed-fretless',
    name: 'Rubbed fretless',
    category: 'bass',
    description:
      'A growling fretless choked to its first buzz, a band-pass filter opening and closing with the touch, then driven hard.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { mute: 0.5, sustain: 0.5, release: 0.03, volume: -22 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { envAmount: 40, resonance: 1.5, cutoffHz: 260, mix: 0.75 },
      },
      { deviceId: 'saturator', preset: 'Bass grit', params: { driveDb: 22, outputDb: 2 } },
    ],
  },
  {
    id: 'only-the-attack-thumb-in-the-empty-hall',
    name: 'Thumb in the empty hall',
    category: 'bass',
    description:
      'The thumb at the neck, cut short, in a long dark hall that has more of the note than the string did.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { mute: 0.7, sustain: 0.5, release: 0.03, volume: 6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.5, midDecay: 2.5 } },
    ],
  },
  {
    id: 'only-the-attack-bridge-cover',
    name: 'Bridge cover',
    category: 'bass',
    description:
      'Dead strings plucked at the bridge onto a worn cassette, its hiss low, its top worn away.',
    preview: FOUR_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { mute: 0.7, sustain: 0.5, release: 0.03, touch: 0.6, volume: 6 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { noise: 0.05, wobble: 0.2, drive: 0.85 },
      },
    ],
  },
  {
    id: 'only-the-attack-ebony-knock',
    name: 'Ebony knock',
    category: 'drum',
    description:
      'An upright string pulled near the bridge and stopped, its partials pushed apart and up a fourth until it is wood, once echoed.',
    preview: FOUR_BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: {
        mute: 0.65,
        sustain: 0.5,
        release: 0.03,
        touch: 0.8,
        position: 0.1,
        growl: 1,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.8, shift: 5 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 150, feedback: 0.1, mix: 0.3 },
      },
    ],
  },
  {
    id: 'only-the-attack-ta-into-the-bell',
    name: 'Ta into the bell',
    category: 'wind',
    description:
      'A section of horns tongued and stopped at once, the notes sifted away so that their fronts are what is left, warmed.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.02, release: 0.05, section: 1, breath: 0.3, volume: -8.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 4 } },
    ],
  },
  {
    id: 'only-the-attack-mute-pulled-out',
    name: 'Mute pulled out',
    category: 'wind',
    description:
      'One muted trumpet, only its strike left, the lows gone, a slap from a narrow room after each spit.',
    preview: SEVEN_AIR,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.02, release: 0.05, breath: 0.5, blow: 0.8, volume: 3 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 600 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { time: 0.12, mix: 0.4 } },
    ],
  },
  {
    id: 'only-the-attack-air-without-valves',
    name: 'Air without valves',
    category: 'wind',
    description:
      'Only the breath of a horn, and of that only its arrival, through a short length of open pipe and lifted by a limiter.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.02, release: 0.05, blow: 0, volume: -2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 70, broad: 0.6 } },
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 0.6, material: 0.8, mix: 0.7 },
      },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 6 } },
    ],
  },
  {
    id: 'only-the-attack-low-brass-puff',
    name: 'Low brass puff',
    category: 'bass',
    description:
      'Low brass with more breath than tone, only its strike kept and all over a few hundred hertz closed off, warmed by a tube.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.02, release: 0.05, breath: 0.8, blow: 0.3, volume: -4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 300 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 6, outputDb: 8 } },
    ],
  },
  {
    id: 'only-the-attack-slap-into-the-mouthpiece',
    name: 'Slap into the mouthpiece',
    category: 'drum',
    description:
      'A trumpet blown hard and cut, only its change at the front let through, in a gated room of a third of a second.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.02, release: 0.05, blow: 1, section: 0, volume: -1.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60 } },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.3, mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 8 } },
    ],
  },
  {
    id: 'only-the-attack-pat-on-the-flugel-bell',
    name: 'Pat on the flugel bell',
    category: 'wind',
    description:
      'A flugelhorn tongued softly with much breath, only its onset let by and then fogged over a tenth of a second and darkened.',
    preview: HOCKET,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.03, release: 0.05, blow: 0.2, breath: 0.8, vibrato: 0, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 90, strict: 0.4 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { size: 100, mix: 0.8, damp: 0.5 } },
    ],
  },
  {
    id: 'only-the-attack-forty-tongues-in-a-nave',
    name: 'Forty tongues in a nave',
    category: 'wind',
    description:
      'A section of trumpets cut down to its onset and left to a vast nave: the stroke is over before the room has begun.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.02, release: 0.05, blow: 0.5, section: 1, breath: 0.4, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 80 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'only-the-attack-slide-stopped-short',
    name: 'Slide stopped short',
    category: 'bass',
    description:
      'A trombone blown hard, only its strike kept, half ring-modulated into a tin knock, warmed and put in a dark spring.',
    preview: FIVE_REED,
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { attack: 0.02, release: 0.05, vibrato: 0, volume: -0.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'ring', preset: 'Tin box', params: { mix: 0.5 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-key-down-on-the-strings',
    name: 'Key down on the strings',
    category: 'string',
    description:
      'The tape of strings pulled into motion and let go: the lurch of the start kept, the tone sifted away, the tape driven.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: { release: 0.02, length: 2, age: 0.6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.5, output: 5 } },
    ],
  },
  {
    id: 'only-the-attack-capstan-catches',
    name: 'Capstan catches',
    category: 'string',
    description:
      'Cellos at half speed, kept only in the tenth of a second when the capstan catches, the low bump of the reel up and the top gone.',
    preview: OPEN_STRINGS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 0.005, release: 0.02, age: 0.8, vibrato: 0, volume: 1 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 100, broad: 0.1 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0, bump: 1, output: 8 } },
    ],
  },
  {
    id: 'only-the-attack-breath-under-the-head',
    name: 'Breath under the head',
    category: 'wind',
    description:
      'Flutes on a worn strip, struck and dropped, with only their first change of colour let by and an echo after.',
    preview: HOCKET,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { attack: 0.005, release: 0.02, age: 0.9, speed: 0, hiss: 0.3, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 80 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 250, feedback: 0.25, mix: 0.4 },
      },
    ],
  },
  {
    id: 'only-the-attack-pinch-roller-horns',
    name: 'Pinch roller horns',
    category: 'wind',
    description:
      'Horns from a strip with only their first bite kept, each a short bark of drive with its lows lifted.',
    preview: FIVE_REED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.005, release: 0.02, volume: 6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'saturator', preset: 'Drum bus crunch', params: { driveDb: 14, outputDb: 8 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 3 } },
    ],
  },
  {
    id: 'only-the-attack-reeds-at-the-splice',
    name: 'Reeds at the splice',
    category: 'wind',
    description:
      'Taped reeds let through only as they come in, like the click of a splice, then sampled at a low rate and spread wide.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.005, release: 0.02, age: 0.2, tone: 0.6, volume: -1 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60, strict: 0.8 } },
      { deviceId: 'vintage-digital', preset: 'Toy', params: { mix: 0.8 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'only-the-attack-consonant-on-tape',
    name: 'Consonant on tape',
    category: 'voice',
    description:
      'A taped choir with its vowel sifted away and its strike left, limited, in a small bright tank that rings for a second.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.005, release: 0.02, age: 0.5, vibrato: 0, volume: -1 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 14 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 1, mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-levers-without-strips',
    name: 'Levers without strips',
    category: 'texture',
    description:
      'The strings of a tape strip with their hiss up, kept only where something moves, on a record full of wear.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.005, release: 0.02, hiss: 1, age: 1, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 55, strict: 0.8 } },
      {
        deviceId: 'vinyl',
        preset: 'Charity shop find',
        params: { crackle: 0.05, pops: 0, surface: 0.05, mix: 0.8 },
      },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 8 } },
    ],
  },
  {
    id: 'only-the-attack-motor-room',
    name: 'Motor room',
    category: 'texture',
    description:
      'Slowed low reeds kept for the instant they start, and a deep cistern, opened wide, that keeps the push of air that came with them.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { attack: 0.005, release: 0.02, volume: 2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 120, strict: 0.5 } },
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.8 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'only-the-attack-shaker-tick-and-hat',
    name: 'Shaker, tick and hat',
    category: 'drum',
    description:
      'A concert flute with all its chiff and breath and no note to follow: three keys make a shaker, a tick and a hat.',
    preview: SEVEN_AIR,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: {
        chiff: 1,
        breath: 1,
        attack: 0.005,
        release: 0.03,
        vibrato: 0,
        scoop: 0,
        blow: 0.2,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 8 } },
    ],
  },
  {
    id: 'only-the-attack-muraiki-cut-off',
    name: 'Muraiki cut off',
    category: 'wind',
    description:
      'A bamboo flute overblown into noise, only its first rush let through, high-passed, saturated and left in a short hall.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { attack: 0.005, release: 0.03, breath: 1, scoop: 0, volume: -19.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 90, broad: 0.8 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1200 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 22, outputDb: -4.2 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.75 } },
    ],
  },
  {
    id: 'only-the-attack-pan-pipe-spit',
    name: 'Pan pipe spit',
    category: 'wind',
    description:
      'Pan pipes struck with the tongue and shut, only the first change kept, then answered by two echoes of it.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { attack: 0.005, release: 0.03, chiff: 1, volume: 3.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60 } },
      { deviceId: 'skipping-stone', preset: 'Two skips', params: { first: 120, mix: 0.4 } },
    ],
  },
  {
    id: 'only-the-attack-key-pads-of-the-alto',
    name: 'Key pads of the alto',
    category: 'wind',
    description:
      'A low flute with almost no breath, the thump at its front kept without the tone and closed in by a low-pass filter.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: {
        attack: 0.005,
        release: 0.03,
        breath: 0.1,
        blow: 0.1,
        vibrato: 0,
        chiff: 0.6,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 450, resonance: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-the-attack-wood-flute-in-the-palm',
    name: 'Wood flute in the palm',
    category: 'wind',
    description:
      'A wooden flute tongued hard, the tongue kept and the note sifted away, squeezed to a smaller body and rounded by a valve.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { attack: 0.005, release: 0.03, chiff: 1, blow: 0.7, scoop: 0, vibrato: 0 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.7 } },
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0 } },
    ],
  },
  {
    id: 'only-the-attack-whisper-at-the-labium',
    name: 'Whisper at the labium',
    category: 'texture',
    description:
      'Whispered pipes, all air, let through as they begin and through a small clean transistor set that pumps a little.',
    preview: SEVEN_AIR,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.005, release: 0.03, chiff: 1, volume: -12 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what moves',
        params: { ago: 60, broad: 0.4, strict: 0.8 },
      },
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { static: 0, interference: 0, fading: 0, mix: 0.9 },
      },
      { deviceId: 'ambient-comp', preset: 'Pump', params: { release: 0.2, makeup: 9 } },
    ],
  },
  {
    id: 'only-the-attack-six-flutes-one-t',
    name: 'Six flutes, one T',
    category: 'wind',
    description:
      'Straight flutes attacked together and cut, the consonant spread to a small flock that arrives unevenly.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.005, release: 0.03, chiff: 1, breath: 0.6, volume: -3.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { birds: 6, mix: 0.6, range: 5 } },
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
    ],
  },
  {
    id: 'only-the-attack-slap-with-no-note',
    name: 'Slap with no note',
    category: 'drum',
    description:
      'A clarinet reed slapped and stopped within a thirtieth of a second, only the strike of it kept and pushed through a tube.',
    preview: FIVE_REED,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { attack: 0.015, release: 0.03, blow: 1, vibrato: 0, breath: 0.6, volume: -4.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 14, outputDb: 5 } },
    ],
  },
  {
    id: 'only-the-attack-reed-against-the-tip',
    name: 'Reed against the tip',
    category: 'wind',
    description:
      'A bright reed let by only as it opens, its partials split by a ring modulator two octaves over middle C, hard into a tube.',
    preview: HOCKET,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.015, release: 0.03, vibrato: 0, volume: -11.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60 } },
      { deviceId: 'ring', preset: 'Glass bells', params: { mix: 0.55 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 24 } },
    ],
  },
  {
    id: 'only-the-attack-finger-on-the-ring-key',
    name: 'Finger on the ring key',
    category: 'wind',
    description:
      'A reed that hums more than it sounds, only the pop at its front kept, in the hollow of a pipe and then a clay pot.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.015, release: 0.03, volume: 0.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'imprint', preset: 'Hollow tube', params: { replace: 0.5, amount: 1.6 } },
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'only-the-attack-breath-then-nothing',
    name: 'Breath, then nothing',
    category: 'wind',
    description:
      'Nothing but breath through the reed, cut at once, its first change held up by a bright tail of five seconds.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.015, release: 0.03, volume: 4 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 90 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'only-the-attack-flutter-cut-to-one',
    name: 'Flutter cut to one',
    category: 'wind',
    description:
      'A flutter tongue cut off after its first tenth of a second, crushed a little and its top opened wide.',
    preview: HOCKET,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.015, release: 0.03, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 100, strict: 0.4 } },
      { deviceId: 'vintage-digital', preset: 'Crushed', params: { mix: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'only-the-attack-subtone-on-the-stairs',
    name: 'Subtone on the stairs',
    category: 'wind',
    description:
      'A tenor with more air than reed, only its attack kept, at the back of a hall with a few dying echoes of it.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.015, release: 0.03, vibrato: 0, volume: 6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'distance', preset: 'Back of the hall', params: { decay: 1.4 } },
      { deviceId: 'skipping-stone', preset: 'Nearly dry', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-attack-thumb-rest-tap',
    name: 'Thumb rest tap',
    category: 'drum',
    description:
      'A hollow reed struck so briefly that the bore hardly answers, its onset alone passed through a wooden body.',
    preview: SEVEN_AIR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.015, release: 0.03, breath: 0.9, blow: 0.3, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 50, strict: 0.8 } },
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.6, material: 0.2 } },
    ],
  },
  {
    id: 'only-the-attack-tip-of-the-bow',
    name: 'Tip of the bow',
    category: 'string',
    description:
      'A bow laid on and lifted before the string has caught, little let through but the strike of the hair, warmed.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { attack: 0.005, release: 0.05, vibrato: 0, volume: -8.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 8 } },
    ],
  },
  {
    id: 'only-the-attack-stick-side-of-the-bow',
    name: 'Stick side of the bow',
    category: 'drum',
    description:
      'Plucked strings with a ring of half a second in a full wooden body, bent stiff and driven hard into tape, as if by the stick.',
    preview: OPEN_STRINGS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { decay: 0.5, release: 0.05, brightness: 0.6, volume: -23 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.35, mix: 0.7 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 30 } },
    ],
  },
  {
    id: 'only-the-attack-nail-under-the-string',
    name: 'Nail under the string',
    category: 'plucked',
    description:
      'A bright wire plucked close to its end and stifled, in the body of a small instrument, flattened and blurred.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { decay: 0.6, release: 0.05, position: 0.08, brightness: 0.75, volume: -5.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.9 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -5 } },
      { deviceId: 'fog', preset: 'Short blur', params: { size: 60, mix: 0.7 } },
    ],
  },
  {
    id: 'only-the-attack-frog-full-weight',
    name: 'Frog, full weight',
    category: 'string',
    description:
      'A bow at full pressure, kept only while it grips, pushed into a dark fuzz and shut in a gated room.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.005, release: 0.05, pressure: 1, vibrato: 0 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 110, strict: 0.5 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { drive: 0.35 } },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.25, mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-flautando-gone',
    name: 'Flautando gone',
    category: 'string',
    description:
      'A bow with no weight that touches and leaves, the light it made held a while by a plate of some length.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.005, release: 0.05, vibrato: 0, volume: -1 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 100 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'only-the-attack-left-hand-drops',
    name: 'Left hand drops',
    category: 'string',
    description:
      'Fingers falling on a string with no bow on it: a muffled pluck near its middle, the top gone, close to the ear.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { decay: 0.3, release: 0.05, brightness: 0.3, position: 0.42, volume: -2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 900 } },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  {
    id: 'only-the-attack-sul-tasto-tap',
    name: 'Sul tasto tap',
    category: 'string',
    description:
      'Section strings plucked over the fingerboard and damped, each chord a soft pat that a loose double widens and tape warms.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { decay: 0.3, release: 0.05, position: 0.45, body: 0.9, volume: -2.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: 2 } },
    ],
  },
  {
    id: 'only-the-attack-handle-of-the-mallet',
    name: 'Handle of the mallet',
    category: 'bell',
    description:
      'A glockenspiel struck with the hardest mallet and damped, the ring sifted down under its strike and the strike limited hard.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 1, decay: 0.25, damper: 1, volume: -7.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6, tones: -6 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 34, outputGain: -9 } },
    ],
  },
  {
    id: 'only-the-attack-rosewood-no-resonator',
    name: 'Rosewood, no resonator',
    category: 'drum',
    description:
      'Marimba bars off their tubes, the decay at its shortest and a hard mallet, dry but for a slap off the wall.',
    preview: SEVEN_KIT,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.9, decay: 0.25, damper: 1, resonator: 0, volume: 2.5 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Mono slap', params: { mix: 0.35 } }],
  },
  {
    id: 'only-the-attack-damper-bar-up',
    name: 'Damper bar up',
    category: 'bell',
    description:
      'Vibraphone bars with the damper full on and the decay at its shortest, blurred for a tenth of a second and warmed on tape.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { damper: 1, decay: 0.25, mallet: 0.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { size: 100, mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0, output: 3 } },
    ],
  },
  {
    id: 'only-the-attack-wrong-end-of-a-stick',
    name: 'Wrong end of a stick',
    category: 'drum',
    description:
      'Dry xylophone bars clicked with a stick and sampled coarsely, the lows taken off below the click, limited hard.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 1, decay: 0.25, damper: 1, resonator: 0.4, volume: 6 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Phone', params: { mix: 0.5 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 450 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 32, outputGain: -9 } },
    ],
  },
  {
    id: 'only-the-attack-celesta-action',
    name: 'Celesta action',
    category: 'keys',
    description:
      'A celesta with its damper full on, its hammers more than its plates, in a small booth of a room, warmed a little.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { decay: 0.25, damper: 1, mallet: 0.8, resonator: 0.2 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.35 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 8 } },
    ],
  },
  {
    id: 'only-the-attack-palm-on-the-bars',
    name: 'Palm on the bars',
    category: 'drum',
    description:
      'A marimba struck by the palm, all resonator and no ring, under a kettle of skin with its low end raised.',
    preview: OPEN_STRINGS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { decay: 0.25, damper: 1, mallet: 0.05, volume: -5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.5, material: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 3, presence: -6 } },
    ],
  },
  {
    id: 'only-the-attack-shelf-of-cold-bars',
    name: 'Shelf of cold bars',
    category: 'bell',
    description:
      'Glockenspiel bars with the damper on them, each stopped click carried off by a wide hall with no dark in it.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { decay: 0.25, damper: 1, mallet: 0.9, volume: -3.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.45 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'only-the-attack-k-before-the-vowel',
    name: 'K before the vowel',
    category: 'voice',
    description:
      'Many voices closing on a consonant: the change at the front of the syllable and then only a small plate.',
    preview: HOCKET,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.05, breath: 0.8, vowel: 0.45, volume: 6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-sixty-lips-part',
    name: 'Sixty lips part',
    category: 'voice',
    description:
      'A choir with nothing but breath, only its opening let through, with a hot valve after it.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.01, release: 0.05, motion: 0, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what moves',
        params: { ago: 90, broad: 0.7, strict: 0.4 },
      },
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0, drive: 0.35 } },
    ],
  },
  {
    id: 'only-the-attack-basses-on-a-p',
    name: 'Basses on a P',
    category: 'voice',
    description:
      'Low voices struck like a skin, the plosive kept and the vowel sifted away and heard inside a drum, with a little tape warmth.',
    preview: EIGHT_LOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { attack: 0.01, release: 0.05, vibrato: 0, breath: 0.5, volume: 3 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.6, size: 1.4 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'only-the-attack-t-in-the-gallery',
    name: 'T in the gallery',
    category: 'voice',
    description:
      'One bright breath of trebles, kept as it opens, its lows cut, and a hall that whispers giving the consonant its ending.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { attack: 0.01, release: 0.05, breath: 1, motion: 0, volume: 6 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what moves',
        params: { ago: 120, broad: 0.9, strict: 0.4 },
      },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1000 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.62 } },
    ],
  },
  {
    id: 'only-the-attack-hum-struck-shut',
    name: 'Hum struck shut',
    category: 'voice',
    description:
      'Closed mouths, only their start kept, dark and low, with a gated room that shuts behind each of them.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.01, release: 0.05, vibrato: 0, motion: 0, volume: -2 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6 } },
      {
        deviceId: 'shaped-reverb',
        preset: 'Gated',
        params: { time: 0.3, mix: 0.45, colour: -0.6 },
      },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 4 } },
    ],
  },
  {
    id: 'only-the-attack-page-turned-by-many',
    name: 'Page turned by many',
    category: 'voice',
    description:
      'Whispered voices kept only where they begin, rubbed down by a starved stream and scattered to a flock far off.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: {
        attack: 0.01,
        release: 0.05,
        vowel: 0.5,
        ensemble: 0.3,
        tone: 12000,
        motion: 0,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 80, strict: 0.3 } },
      { deviceId: 'low-bitrate', preset: 'Gritty attacks' },
      { deviceId: 'murmuration', preset: 'Cloud far off', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'only-the-attack-key-bed-and-nothing',
    name: 'Key bed and nothing',
    category: 'keys',
    description:
      'A felt piano with the softest hammer, its action and thump full up and the strings sifted down under them, levelled.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { hardness: 0, resonance: 0, damper: 1, reverbMix: 0, outputDb: -16.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6, tones: -12, air: 0 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 8 } },
    ],
  },
  {
    id: 'only-the-attack-escapement',
    name: 'Escapement',
    category: 'keys',
    description:
      'A bare hard hammer with the dampers quick, its lows removed, so the tick of the action is most of it, limited hard.',
    preview: SEVEN_KIT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { action: 1, thump: 0, damper: 1, resonance: 0, reverbMix: 0, outputDb: 1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 1400 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 34, outputGain: -8.5 } },
    ],
  },
  {
    id: 'only-the-attack-thump-in-the-next-room',
    name: 'Thump in the next room',
    category: 'keys',
    description:
      'The soft thud of a key heard through a wall, its pitch dulled, in an old stone room of three seconds.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { damper: 1, resonance: 0, reverbMix: 0, soft: 1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 3, mix: 0.45 } },
    ],
  },
  {
    id: 'only-the-attack-old-action-in-five',
    name: 'Old action in five',
    category: 'keys',
    description:
      'A worn upright with its creaks up, every note stopped, through a small amplifier pushed until it shakes.',
    preview: FIVE_LOW,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        action: 1,
        thump: 1,
        damper: 1,
        resonance: 0,
        reverbMix: 0,
        width: 0.6,
        outputDb: -11,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Speaker on the edge', params: { noise: 0 } }],
  },
  {
    id: 'only-the-attack-koto-nail',
    name: 'Koto nail',
    category: 'plucked',
    description:
      'A koto string plucked close to its end and damped as it goes, the scrape of the nail limited, in a short ambience.',
    preview: FIVE_PLUCK,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { touch: 1, pluck: 0.1, damp: 1, decay: 0.8, halo: 0, volume: 1.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Only the strikes', params: { attacks: 6, tones: 2, air: 2 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 28, outputGain: -0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.75, decay: 0.6 } },
    ],
  },
  {
    id: 'only-the-attack-fingertip-lifts',
    name: 'Fingertip lifts',
    category: 'plucked',
    description:
      'A dark harp stopped by the fingers that plucked it, warmed a little, its stroke answered by one tape slap.',
    preview: RUDIMENTS,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { damp: 1, decay: 0.25, halo: 0, volume: -2.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 110, feedback: 0, mix: 0.4 },
      },
    ],
  },
  {
    id: 'only-the-attack-pegs-and-a-bridge',
    name: 'Pegs and a bridge',
    category: 'drum',
    description:
      'Steel strings plucked short and pulled out of tune with themselves by a shifter, until they are small metal parts.',
    preview: SEVEN_KIT,
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { strings: 2, touch: 1, pluck: 0.1, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Bell metal',
        params: { shift: -140, feedback: 0, mix: 0.8 },
      },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 12 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.4, decay: 0.25 } },
    ],
  },
  {
    id: 'only-the-attack-pedals-change',
    name: 'Pedals change',
    category: 'plucked',
    description:
      'Muted harp strings let off at once, and a short halo of other strings tuned to D minor that has heard the knock.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 1, decay: 0.25, halo: 0, touch: 0.5, volume: 1.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { root: 2, mode: 1, mix: 0.45 } },
    ],
  },
  {
    id: 'only-the-attack-fence-wire-flicked',
    name: 'Fence wire flicked',
    category: 'plucked',
    description:
      'No wind at all: one string flicked, only the flick let through, with a hint of spring behind the click.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { wind: 0, hum: 0, gust: 0, touch: 1, ring: 0.3, release: 0.05, volume: -7.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 60 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'only-the-attack-gust-against-the-post',
    name: 'Gust against the post',
    category: 'texture',
    description:
      'A moment of hard wind on three strings, its air full up, held to a low thud by the wood it hits.',
    preview: ONE_A_BAR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { release: 0.05, air: 1, ring: 0.3, touch: 0.8, wind: 1, volume: -9.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 120 } },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.7, size: 1.6 } },
    ],
  },
  {
    id: 'only-the-attack-four-wires-one-thumb',
    name: 'Four wires, one thumb',
    category: 'plucked',
    description:
      'Four strings to a key plucked together, only their first change kept, hollowed by a flanger standing still and warmed on tape.',
    preview: FOUR_UNSOUNDED,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -15, ring: 0.3, release: 0.05, wind: 0, hum: 0 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 90 } },
      { deviceId: 'flanger', preset: 'Standing comb' },
      { deviceId: 'analog-drive', preset: 'Warm glue' },
    ],
  },
  {
    id: 'only-the-attack-wire-tick-in-fog',
    name: 'Wire tick in fog',
    category: 'plucked',
    description:
      'A soft pluck on one string with its first change kept and nothing more, a far dark bank of air round each tick.',
    preview: EIGHT_WEIGHTS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { ring: 0.3, release: 0.05, wind: 0, hum: 0, touch: 1, volume: -2.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what moves', params: { ago: 80 } },
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.6 } },
    ],
  },
]
