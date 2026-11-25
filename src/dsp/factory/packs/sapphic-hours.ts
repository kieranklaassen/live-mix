import { type FactoryPreset, type Phrase } from '../types'

// Verse in longs and shorts of two to one, spoken by plucked and struck strings, bells and reed.
// Each instrument was laid out from its longest syllable to its shortest, then from the softest
// consonant at the start of a note to the hardest, then by how near the speaker stands.

// A long line of eleven and the short line of five that closes the stanza: 18 shorts, then 8,
// over a held fifth D-A; the closing line has its fifth an octave down.
const STANZA_END: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.728, note: 62, gain: 0.5 },
    { atSec: 0.52, durSec: 0.364, note: 65, gain: 0.38 },
    { atSec: 0.78, durSec: 0.728, note: 64, gain: 0.5 },
    { atSec: 1.3, durSec: 0.728, note: 69, gain: 0.5 },
    { atSec: 1.82, durSec: 0.728, note: 67, gain: 0.5 },
    { atSec: 2.34, durSec: 0.364, note: 72, gain: 0.38 },
    { atSec: 2.6, durSec: 0.364, note: 71, gain: 0.38 },
    { atSec: 2.86, durSec: 0.728, note: 69, gain: 0.5 },
    { atSec: 3.38, durSec: 0.364, note: 65, gain: 0.38 },
    { atSec: 3.64, durSec: 0.728, note: 67, gain: 0.5 },
    { atSec: 4.16, durSec: 0.728, note: 64, gain: 0.5 },
    { atSec: 4.68, durSec: 0.728, note: 65, gain: 0.5 },
    { atSec: 5.2, durSec: 0.364, note: 64, gain: 0.38 },
    { atSec: 5.46, durSec: 0.364, note: 60, gain: 0.38 },
    { atSec: 5.72, durSec: 0.728, note: 64, gain: 0.5 },
    { atSec: 6.24, durSec: 0.728, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 4.6, note: 50, gain: 0.3 },
    { atSec: 0, durSec: 4.6, note: 57, gain: 0.26 },
    { atSec: 4.68, durSec: 2.5, note: 38, gain: 0.36 },
    { atSec: 4.68, durSec: 2.5, note: 45, gain: 0.3 },
  ],
}

// One line of eleven taken slowly, for what is blown or sung: L s L L L s s L s L L.
const SLOW_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.776, note: 69, gain: 0.6 },
    { atSec: 0.8, durSec: 0.388, note: 67, gain: 0.48 },
    { atSec: 1.2, durSec: 0.776, note: 65, gain: 0.6 },
    { atSec: 2, durSec: 0.776, note: 64, gain: 0.6 },
    { atSec: 2.8, durSec: 0.776, note: 69, gain: 0.6 },
    { atSec: 3.6, durSec: 0.388, note: 71, gain: 0.48 },
    { atSec: 4, durSec: 0.388, note: 72, gain: 0.48 },
    { atSec: 4.4, durSec: 0.776, note: 74, gain: 0.6 },
    { atSec: 5.2, durSec: 0.388, note: 71, gain: 0.48 },
    { atSec: 5.6, durSec: 0.776, note: 72, gain: 0.6 },
    { atSec: 6.4, durSec: 0.776, note: 69, gain: 0.6 },
  ],
}

// The same eleven low down, one note at a time, closing on A.
const LOW_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.776, note: 50, gain: 0.6 },
    { atSec: 0.8, durSec: 0.388, note: 48, gain: 0.5 },
    { atSec: 1.2, durSec: 0.776, note: 45, gain: 0.6 },
    { atSec: 2, durSec: 0.776, note: 48, gain: 0.6 },
    { atSec: 2.8, durSec: 0.776, note: 52, gain: 0.6 },
    { atSec: 3.6, durSec: 0.388, note: 53, gain: 0.5 },
    { atSec: 4, durSec: 0.388, note: 52, gain: 0.5 },
    { atSec: 4.4, durSec: 0.776, note: 50, gain: 0.6 },
    { atSec: 5.2, durSec: 0.388, note: 47, gain: 0.5 },
    { atSec: 5.6, durSec: 0.776, note: 48, gain: 0.6 },
    { atSec: 6.4, durSec: 0.776, note: 45, gain: 0.6 },
  ],
}

// A line of eight, L L L s s L s L, on three reciting notes, D, E and A: a minor triad, a fourth
// or a fifth laid on any of them keeps to the mode.
const RECITING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.97, note: 62, gain: 0.58 },
    { atSec: 1, durSec: 0.97, note: 64, gain: 0.58 },
    { atSec: 2, durSec: 0.97, note: 57, gain: 0.58 },
    { atSec: 3, durSec: 0.485, note: 62, gain: 0.46 },
    { atSec: 3.5, durSec: 0.485, note: 64, gain: 0.46 },
    { atSec: 4, durSec: 0.97, note: 69, gain: 0.58 },
    { atSec: 5, durSec: 0.485, note: 64, gain: 0.46 },
    { atSec: 5.5, durSec: 1, note: 62, gain: 0.58 },
  ],
}

// Six feet, the fifth of them L s s, with the break after the first long of the third.
const SIX_FEET: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.812, note: 57, gain: 0.5 },
    { atSec: 0.58, durSec: 0.406, note: 60, gain: 0.38 },
    { atSec: 0.87, durSec: 0.406, note: 62, gain: 0.38 },
    { atSec: 1.16, durSec: 0.812, note: 64, gain: 0.5 },
    { atSec: 1.74, durSec: 0.812, note: 67, gain: 0.5 },
    { atSec: 2.32, durSec: 0.34, note: 65, gain: 0.5 },
    { atSec: 2.9, durSec: 0.406, note: 64, gain: 0.38 },
    { atSec: 3.19, durSec: 0.406, note: 62, gain: 0.38 },
    { atSec: 3.48, durSec: 0.812, note: 60, gain: 0.5 },
    { atSec: 4.06, durSec: 0.812, note: 64, gain: 0.5 },
    { atSec: 4.64, durSec: 0.812, note: 69, gain: 0.5 },
    { atSec: 5.22, durSec: 0.406, note: 67, gain: 0.38 },
    { atSec: 5.51, durSec: 0.406, note: 64, gain: 0.38 },
    { atSec: 5.8, durSec: 0.812, note: 62, gain: 0.5 },
    { atSec: 6.38, durSec: 0.812, note: 57, gain: 0.5 },
  ],
}

// L ss L ss L twice with a long of silence written between them, over fifths on A and on C that
// stop for the silence too.
const TWO_HALVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.744, note: 64, gain: 0.5 },
    { atSec: 0.62, durSec: 0.372, note: 65, gain: 0.38 },
    { atSec: 0.93, durSec: 0.372, note: 67, gain: 0.38 },
    { atSec: 1.24, durSec: 0.744, note: 69, gain: 0.5 },
    { atSec: 1.86, durSec: 0.372, note: 67, gain: 0.38 },
    { atSec: 2.17, durSec: 0.372, note: 69, gain: 0.38 },
    { atSec: 2.48, durSec: 0.62, note: 71, gain: 0.5 },
    { atSec: 3.72, durSec: 0.744, note: 72, gain: 0.5 },
    { atSec: 4.34, durSec: 0.372, note: 71, gain: 0.38 },
    { atSec: 4.65, durSec: 0.372, note: 69, gain: 0.38 },
    { atSec: 4.96, durSec: 0.744, note: 67, gain: 0.5 },
    { atSec: 5.58, durSec: 0.372, note: 65, gain: 0.38 },
    { atSec: 5.89, durSec: 0.372, note: 62, gain: 0.38 },
    { atSec: 6.2, durSec: 0.744, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 3.1, note: 45, gain: 0.34 },
    { atSec: 0, durSec: 3.1, note: 52, gain: 0.28 },
    { atSec: 3.72, durSec: 3.4, note: 48, gain: 0.34 },
    { atSec: 3.72, durSec: 3.4, note: 55, gain: 0.28 },
  ],
}

// Feet of five and seven, s L L and s L L L, twice, in the mode on E over E-B.
const TENT_POLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.392, note: 64, gain: 0.38 },
    { atSec: 0.28, durSec: 0.784, note: 65, gain: 0.5 },
    { atSec: 0.84, durSec: 0.784, note: 67, gain: 0.5 },
    { atSec: 1.4, durSec: 0.392, note: 65, gain: 0.38 },
    { atSec: 1.68, durSec: 0.784, note: 64, gain: 0.5 },
    { atSec: 2.24, durSec: 0.784, note: 62, gain: 0.5 },
    { atSec: 2.8, durSec: 0.784, note: 64, gain: 0.5 },
    { atSec: 3.36, durSec: 0.392, note: 67, gain: 0.38 },
    { atSec: 3.64, durSec: 0.784, note: 69, gain: 0.5 },
    { atSec: 4.2, durSec: 0.784, note: 67, gain: 0.5 },
    { atSec: 4.76, durSec: 0.392, note: 65, gain: 0.38 },
    { atSec: 5.04, durSec: 0.784, note: 67, gain: 0.5 },
    { atSec: 5.6, durSec: 0.784, note: 65, gain: 0.5 },
    { atSec: 6.16, durSec: 0.784, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 3.3, note: 52, gain: 0.32 },
    { atSec: 0, durSec: 3.3, note: 59, gain: 0.24 },
    { atSec: 3.36, durSec: 3.8, note: 52, gain: 0.32 },
    { atSec: 3.36, durSec: 3.8, note: 59, gain: 0.24 },
  ],
}

// Five notes and a rest of three, seven and a rest of one, five and three, over a held fourth D-G.
const FIVE_SEVEN_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.377, note: 74, gain: 0.5 },
    { atSec: 0.29, durSec: 0.377, note: 72, gain: 0.5 },
    { atSec: 0.58, durSec: 0.377, note: 69, gain: 0.5 },
    { atSec: 0.87, durSec: 0.377, note: 67, gain: 0.5 },
    { atSec: 1.16, durSec: 0.377, note: 69, gain: 0.5 },
    { atSec: 2.32, durSec: 0.377, note: 67, gain: 0.5 },
    { atSec: 2.61, durSec: 0.377, note: 69, gain: 0.5 },
    { atSec: 2.9, durSec: 0.377, note: 72, gain: 0.5 },
    { atSec: 3.19, durSec: 0.377, note: 74, gain: 0.5 },
    { atSec: 3.48, durSec: 0.377, note: 77, gain: 0.5 },
    { atSec: 3.77, durSec: 0.377, note: 74, gain: 0.5 },
    { atSec: 4.06, durSec: 0.377, note: 72, gain: 0.5 },
    { atSec: 4.64, durSec: 0.377, note: 69, gain: 0.5 },
    { atSec: 4.93, durSec: 0.377, note: 67, gain: 0.5 },
    { atSec: 5.22, durSec: 0.377, note: 65, gain: 0.5 },
    { atSec: 5.51, durSec: 0.377, note: 67, gain: 0.5 },
    { atSec: 5.8, durSec: 0.377, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 6.9, note: 50, gain: 0.3 },
    { atSec: 0, durSec: 6.9, note: 55, gain: 0.26 },
  ],
}

// Four rising feet, s s L L, each opening a little higher than the one before.
const FOURFOLD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.281, note: 57, gain: 0.48 },
    { atSec: 0.29, durSec: 0.281, note: 60, gain: 0.48 },
    { atSec: 0.58, durSec: 0.563, note: 64, gain: 0.58 },
    { atSec: 1.16, durSec: 0.563, note: 62, gain: 0.58 },
    { atSec: 1.74, durSec: 0.281, note: 60, gain: 0.48 },
    { atSec: 2.03, durSec: 0.281, note: 62, gain: 0.48 },
    { atSec: 2.32, durSec: 0.563, note: 65, gain: 0.58 },
    { atSec: 2.9, durSec: 0.563, note: 64, gain: 0.58 },
    { atSec: 3.48, durSec: 0.281, note: 62, gain: 0.48 },
    { atSec: 3.77, durSec: 0.281, note: 64, gain: 0.48 },
    { atSec: 4.06, durSec: 0.563, note: 69, gain: 0.58 },
    { atSec: 4.64, durSec: 0.563, note: 67, gain: 0.58 },
    { atSec: 5.22, durSec: 0.281, note: 65, gain: 0.48 },
    { atSec: 5.51, durSec: 0.281, note: 62, gain: 0.48 },
    { atSec: 5.8, durSec: 0.563, note: 64, gain: 0.58 },
    { atSec: 6.38, durSec: 0.563, note: 57, gain: 0.58 },
  ],
}

// Four feet of five, L s L, each a triad broken: D minor, C, F, G.
const FIVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.224, note: 62, gain: 0.5 },
    { atSec: 0.68, durSec: 0.612, note: 65, gain: 0.38 },
    { atSec: 1.02, durSec: 1.224, note: 69, gain: 0.5 },
    { atSec: 1.7, durSec: 1.224, note: 67, gain: 0.5 },
    { atSec: 2.38, durSec: 0.612, note: 64, gain: 0.38 },
    { atSec: 2.72, durSec: 1.224, note: 60, gain: 0.5 },
    { atSec: 3.4, durSec: 1.224, note: 65, gain: 0.5 },
    { atSec: 4.08, durSec: 0.612, note: 69, gain: 0.38 },
    { atSec: 4.42, durSec: 1.224, note: 72, gain: 0.5 },
    { atSec: 5.1, durSec: 1.224, note: 71, gain: 0.5 },
    { atSec: 5.78, durSec: 0.612, note: 67, gain: 0.38 },
    { atSec: 6.12, durSec: 1.224, note: 62, gain: 0.5 },
  ],
}

// Eight feet of s s L, the last of them cut to one long.
const MARCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.299, note: 72, gain: 0.38 },
    { atSec: 0.23, durSec: 0.299, note: 74, gain: 0.38 },
    { atSec: 0.46, durSec: 0.598, note: 76, gain: 0.5 },
    { atSec: 0.92, durSec: 0.299, note: 74, gain: 0.38 },
    { atSec: 1.15, durSec: 0.299, note: 76, gain: 0.38 },
    { atSec: 1.38, durSec: 0.598, note: 79, gain: 0.5 },
    { atSec: 1.84, durSec: 0.299, note: 76, gain: 0.38 },
    { atSec: 2.07, durSec: 0.299, note: 74, gain: 0.38 },
    { atSec: 2.3, durSec: 0.598, note: 72, gain: 0.5 },
    { atSec: 2.76, durSec: 0.299, note: 74, gain: 0.38 },
    { atSec: 2.99, durSec: 0.299, note: 72, gain: 0.38 },
    { atSec: 3.22, durSec: 0.598, note: 69, gain: 0.5 },
    { atSec: 3.68, durSec: 0.299, note: 72, gain: 0.38 },
    { atSec: 3.91, durSec: 0.299, note: 74, gain: 0.38 },
    { atSec: 4.14, durSec: 0.598, note: 76, gain: 0.5 },
    { atSec: 4.6, durSec: 0.299, note: 79, gain: 0.38 },
    { atSec: 4.83, durSec: 0.299, note: 76, gain: 0.38 },
    { atSec: 5.06, durSec: 0.598, note: 81, gain: 0.5 },
    { atSec: 5.52, durSec: 0.299, note: 79, gain: 0.38 },
    { atSec: 5.75, durSec: 0.299, note: 76, gain: 0.38 },
    { atSec: 5.98, durSec: 0.598, note: 74, gain: 0.5 },
    { atSec: 6.44, durSec: 0.598, note: 72, gain: 0.5 },
  ],
}

// The closing line alone, L s s L L, three times, each a fourth under the last.
const CLOSING_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.84, note: 79, gain: 0.5 },
    { atSec: 0.6, durSec: 0.42, note: 77, gain: 0.38 },
    { atSec: 0.9, durSec: 0.42, note: 76, gain: 0.38 },
    { atSec: 1.2, durSec: 0.84, note: 72, gain: 0.5 },
    { atSec: 1.8, durSec: 0.84, note: 74, gain: 0.5 },
    { atSec: 2.4, durSec: 0.84, note: 74, gain: 0.5 },
    { atSec: 3, durSec: 0.42, note: 72, gain: 0.38 },
    { atSec: 3.3, durSec: 0.42, note: 71, gain: 0.38 },
    { atSec: 3.6, durSec: 0.84, note: 67, gain: 0.5 },
    { atSec: 4.2, durSec: 0.84, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 0.84, note: 69, gain: 0.5 },
    { atSec: 5.4, durSec: 0.42, note: 67, gain: 0.38 },
    { atSec: 5.7, durSec: 0.42, note: 65, gain: 0.38 },
    { atSec: 6, durSec: 0.84, note: 62, gain: 0.5 },
    { atSec: 6.6, durSec: 0.75, note: 64, gain: 0.5 },
  ],
}

// The stanza as four chords, 18, 18, 18 and 8 shorts long: Dm7, G7 over B, Am7 over C, Dm.
const FOUR_CHORDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.038, note: 50, gain: 0.42 },
    { atSec: 0, durSec: 2.038, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 2.038, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 2.038, note: 65, gain: 0.42 },
    { atSec: 2.088, durSec: 2.038, note: 47, gain: 0.42 },
    { atSec: 2.088, durSec: 2.038, note: 55, gain: 0.42 },
    { atSec: 2.088, durSec: 2.038, note: 62, gain: 0.42 },
    { atSec: 2.088, durSec: 2.038, note: 65, gain: 0.42 },
    { atSec: 4.176, durSec: 2.038, note: 48, gain: 0.42 },
    { atSec: 4.176, durSec: 2.038, note: 55, gain: 0.42 },
    { atSec: 4.176, durSec: 2.038, note: 57, gain: 0.42 },
    { atSec: 4.176, durSec: 2.038, note: 64, gain: 0.42 },
    { atSec: 6.264, durSec: 0.928, note: 50, gain: 0.46 },
    { atSec: 6.264, durSec: 0.928, note: 53, gain: 0.46 },
    { atSec: 6.264, durSec: 0.928, note: 57, gain: 0.46 },
    { atSec: 6.264, durSec: 0.928, note: 62, gain: 0.46 },
  ],
}

// Chords as long as the feet of TENT_POLE, 5, 7, 5 and 7 shorts: A minor, F, G, E minor.
const TENT_CHORDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.45, note: 45, gain: 0.4 },
    { atSec: 0, durSec: 1.45, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 1.45, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.45, note: 64, gain: 0.4 },
    { atSec: 1.45, durSec: 2.03, note: 41, gain: 0.44 },
    { atSec: 1.45, durSec: 2.03, note: 57, gain: 0.44 },
    { atSec: 1.45, durSec: 2.03, note: 60, gain: 0.44 },
    { atSec: 1.45, durSec: 2.03, note: 65, gain: 0.44 },
    { atSec: 3.48, durSec: 1.45, note: 43, gain: 0.4 },
    { atSec: 3.48, durSec: 1.45, note: 55, gain: 0.4 },
    { atSec: 3.48, durSec: 1.45, note: 59, gain: 0.4 },
    { atSec: 3.48, durSec: 1.45, note: 62, gain: 0.4 },
    { atSec: 4.93, durSec: 2.03, note: 40, gain: 0.44 },
    { atSec: 4.93, durSec: 2.03, note: 55, gain: 0.44 },
    { atSec: 4.93, durSec: 2.03, note: 59, gain: 0.44 },
    { atSec: 4.93, durSec: 2.03, note: 64, gain: 0.44 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Zither: syllables long by nature, long by position, and short ones that stop at once.
  {
    id: 'sapphic-hours-long-by-nature',
    name: 'Long by nature',
    category: 'plucked',
    description:
      'A dark finger-plucked box of strings that rings for sixteen seconds, with strings tuned to D minor sounding behind it.',
    preview: RECITING,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        decay: 16,
        brightness: 0.22,
        position: 0.45,
        sympathy: 0.7,
        courses: 0.1,
        volume: -13,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Sitar drone',
        params: { root: 2, mode: 1, sympathy: 0.7, decay: 8, mix: 0.45, width: 0.8 },
      },
    ],
  },
  {
    id: 'sapphic-hours-long-by-position',
    name: 'Long by position',
    category: 'plucked',
    description:
      'A hard pick close to the bridge of a koto-bodied box, played inside a wooden soundboard and levelled so the short notes hold.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { chord: 0, decay: 3, release: 1.4, brightness: 0.95, position: 0.06, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Wooden body',
        params: { size: 0.5, material: 0.8, tone: 0.35, mix: 0.85 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'sapphic-hours-short-before-a-mute',
    name: 'Short before a mute',
    category: 'plucked',
    description:
      'A hammered dulcimer damped to under a second, with a short dark spring answering each stroke.',
    preview: FIVES,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        roll: 0,
        decay: 0.8,
        release: 0.15,
        brightness: 0.35,
        courses: 0.2,
        sympathy: 0,
        position: 0.2,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.4, decay: 1.2 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sapphic-hours-tent-cord',
    name: 'Tent cord',
    category: 'string',
    description:
      'Each key plucks its fifths and octaves in a quick strum, driven by a triode and held narrow in the middle of a small room.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        chord: 2,
        strum: 30,
        decay: 3.5,
        release: 1.2,
        brightness: 0.3,
        position: 0.35,
        courses: 0,
        sympathy: 0.1,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.65, highCut: 4500 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      { deviceId: 'stereo-widener', preset: 'Mono', params: { width: 0.12 } },
    ],
  },
  {
    id: 'sapphic-hours-tent-peg-in-sand',
    name: 'Tent peg in sand',
    category: 'plucked',
    description:
      'A soft hammer on the middle of the string, stopped soon after the key and heard through a drum head.',
    preview: TENT_POLE,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        decay: 1.6,
        release: 0.4,
        brightness: 0.12,
        position: 0.5,
        sympathy: 0,
        body: 3,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.4, mix: 0.6, air: 0 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'sapphic-hours-both-half-lines',
    name: 'Both half-lines',
    category: 'string',
    description:
      'A doubled, picked string answered once by itself one long later, the answer a fourth lower.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        chord: 0,
        decay: 5,
        release: 3,
        courses: 1,
        sympathy: 0.25,
        brightness: 0.7,
        volume: -0.5,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { gap: 0.58, interval1: -5, tone: 4000, mix: 0.45, spread: 1 },
      },
    ],
  },
  {
    id: 'sapphic-hours-written-silence',
    name: 'Written silence',
    category: 'plucked',
    description:
      'A finger-plucked string in a gated reverb that fills the syllable and stops dead, so the rest after it is empty.',
    preview: TWO_HALVES,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: {
        decay: 2.5,
        release: 0.15,
        brightness: 0.75,
        position: 0.14,
        sympathy: 0,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.7, mix: 0.6, colour: 0.2 } },
    ],
  },
  {
    id: 'sapphic-hours-wax-tablet',
    name: 'Wax tablet',
    category: 'plucked',
    description:
      'A dull picked string put through an early sampler, the top worn off and a little grain left round each note.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        decay: 4,
        release: 2.5,
        brightness: 0.05,
        position: 0.3,
        courses: 0.4,
        body: 1,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Early sampler',
        params: { wear: 0.8, tone: 0.35, noise: 0.1 },
      },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { makeup: 4 } },
    ],
  },
  {
    id: 'sapphic-hours-elided-vowels',
    name: 'Elided vowels',
    category: 'string',
    description:
      'Octaves rolled five times a second behind a fog that takes off every attack, so one syllable runs into the next.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        exciter: 0,
        roll: 5,
        strum: 90,
        decay: 6,
        release: 2,
        brightness: 0.45,
        body: 0,
        sympathy: 0.4,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 320, mix: 1 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'sapphic-hours-dactyl-on-wire',
    name: 'Dactyl on wire',
    category: 'string',
    description:
      'A bright octave pick with three tape heads behind it, a short, a long and the two together, so each note trails feet of its own.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: {
        strum: 12,
        decay: 4,
        release: 2,
        brightness: 0.9,
        position: 0.1,
        courses: 0.5,
        sympathy: 0.1,
        volume: 3,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 870, heads: 2, feedback: 0.35, mix: 0.45, highCut: 6000, spread: 0.9 },
      },
    ],
  },
  {
    id: 'sapphic-hours-five-bronze-wires',
    name: 'Five bronze wires',
    category: 'plucked',
    description:
      'A thin koto-bodied pluck ring-modulated from D, so every string carries a faint metal neighbour.',
    preview: FIVE_SEVEN_FIVE,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        decay: 6,
        release: 5,
        brightness: 0.5,
        position: 0.17,
        sympathy: 0.05,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'ring',
        preset: 'Fifth halo',
        params: { root: 2, octave: 4, mix: 0.4, tone: 5000 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'sapphic-hours-both-feet-heavy',
    name: 'Both feet heavy',
    category: 'string',
    description:
      'Fifths and octaves hammered together on a body made larger than it is, its lows brought forward by iron.',
    preview: RECITING,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: {
        chord: 2,
        strum: 0,
        decay: 9,
        release: 4,
        brightness: 0.3,
        courses: 0.2,
        sympathy: 0.3,
        body: 2,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant' },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'sapphic-hours-reciter-at-dusk',
    name: 'Reciter at dusk',
    category: 'string',
    description:
      'A minor triad strummed downward over a third of a second, turned slowly by a rotary cabinet across the room.',
    preview: RECITING,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor tremolo',
      params: {
        exciter: 1,
        roll: 0,
        strum: 340,
        decay: 7,
        release: 5,
        brightness: 0.6,
        courses: 0.1,
        sympathy: 0.2,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.9 } }],
  },
  {
    id: 'sapphic-hours-breath-mark',
    name: 'Breath mark',
    category: 'string',
    description:
      'Doubled wires with their pluck removed, each note bowed in over a third of a second and drifting from side to side.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { chord: 0, decay: 12, release: 5, brightness: 0.7, sympathy: 0.3, volume: -0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 340 } },
      { deviceId: 'currents', preset: 'Wide tide' },
    ],
  },
  {
    id: 'sapphic-hours-either-length',
    name: 'Either length',
    category: 'plucked',
    description:
      'A hammered string whose partials are stretched toward a bell, half mixed with the string they came from.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        chord: 0,
        roll: 0,
        strum: 0,
        decay: 5,
        release: 3,
        brightness: 0.55,
        courses: 0,
        sympathy: 0.15,
        volume: -4,
      },
    },
    effects: [{ deviceId: 'warp', preset: 'Bell metal', params: { stretch: 0.5, mix: 0.6 } }],
  },
  {
    id: 'sapphic-hours-last-syllable-free',
    name: 'Last syllable free',
    category: 'plucked',
    description:
      'A suspended fourth strummed downward over two fifths of a second, then scattered into seven echoes at uneven moments.',
    preview: RECITING,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: {
        chord: 6,
        direction: 1,
        strum: 400,
        decay: 3,
        release: 2,
        brightness: 0.8,
        position: 0.15,
        sympathy: 0,
        volume: -0.5,
      },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 2300, mix: 0.5 } },
    ],
  },
  {
    id: 'sapphic-hours-cutting-word',
    name: 'Cutting word',
    category: 'plucked',
    description:
      'A dry plectrum on a koto body, gone within a second, then repeated backwards in bright grains.',
    preview: FIVE_SEVEN_FIVE,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 0.9, release: 0.2, brightness: 1, position: 0.07, sympathy: 0, volume: 0 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Backwards shards',
        params: { time: 580, size: 280, mix: 0.45 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },

  // Glass: the same line at the pace of a clock, from a ping shorter than a short to a held vowel.
  {
    id: 'sapphic-hours-small-hour-ping',
    name: 'Small hour ping',
    category: 'bell',
    description: 'A short high glass ping that skips away in echoes closer and closer together.',
    preview: MARCH,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { algorithm: 0, ratio: 9, decay: 0.35, release: 0.4, brightness: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Wide rings', params: { first: 380, mix: 0.45 } },
    ],
  },
  {
    id: 'sapphic-hours-lamp-vowel',
    name: 'Lamp vowel',
    category: 'pad',
    description:
      'A plain glass pad that takes most of a second to open, its hall shaped to a sung ah.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { attack: 0.6, release: 2, detune: 10, feedback: 0.2, brightness: 0.2, volume: -13 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { decay: 4, mix: 0.55, resonance: 0.8 },
      },
    ],
  },
  {
    id: 'sapphic-hours-brief-as-a-mora',
    name: 'Brief as a mora',
    category: 'keys',
    description:
      'A woody mallet with a low octave in its stroke, gone soon after the key, a chirping slack spring behind it.',
    preview: FIVE_SEVEN_FIVE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { ratio: 0, decay: 0.2, release: 0.2, brightness: 0.5, feedback: 0.4, volume: -7 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'sapphic-hours-line-in-one-breath',
    name: 'Line in one breath',
    category: 'pad',
    description:
      'A rubbed glass that opens softly and begins to sway only when a note is held, in a wide dark space.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: {
        ratio: 1,
        attack: 0.18,
        sustain: 0.95,
        release: 2.5,
        brightness: 0.25,
        detune: 3,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Late vibrato',
        params: { wait: 250, grow: 500, depth: 35 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 7, highCut: 3500, mix: 0.35 } },
    ],
  },
  {
    id: 'sapphic-hours-hexameter-bowl',
    name: 'Hexameter bowl',
    category: 'bell',
    description:
      'A slow dark bell at an uneven ratio, ringing twelve seconds over a table of bowls in D minor.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { decay: 12, brightness: 0.55, attack: 0.04, detune: 8, volume: -13 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Minor table',
        params: { root: 2, register: 0.25, ring: 20, mix: 0.5 },
      },
    ],
  },
  {
    id: 'sapphic-hours-choriamb-bells',
    name: 'Choriamb bells',
    category: 'bell',
    description: 'A clear bell doubled one and two octaves up, laid on a bright plate.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 5, decay: 1.8, release: 2, brightness: 0.35, volume: -5.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up2: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'sapphic-hours-tin-refrain',
    name: 'Tin refrain',
    category: 'keys',
    description:
      'A high-ratio mallet pushed through a small loudspeaker at the bedside, all middle and no bass.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { ratio: 11, decay: 1.1, release: 0.8, brightness: 0.45, feedback: 0, volume: -10 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.55, bass: -0.4, output: -3 },
      },
    ],
  },
  {
    id: 'sapphic-hours-lead-seal',
    name: 'Lead seal',
    category: 'bell',
    description:
      'A low gong of a bell with rough feedback, ring-modulated from A, with its long tail lifted.',
    preview: LOW_LINE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Dark gong',
      params: { decay: 4, release: 4, brightness: 0.75, attack: 0.003, volume: -23 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Gong', params: { root: 9, mix: 0.4, tone: 1600 } },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },
  {
    id: 'sapphic-hours-unstressed',
    name: 'Unstressed',
    category: 'keys',
    description:
      'A soft mallet that answers every touch at one level, heard from the back of a hall.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        ratio: 3,
        brightness: 0.08,
        velocity: 0,
        attack: 0.025,
        decay: 3.2,
        release: 2,
        volume: -16,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'sapphic-hours-vesper-strophe',
    name: 'Vesper strophe',
    category: 'pad',
    description:
      'A thin bright pad of seventh harmonics, moved in bands from side to side under a warm low hall.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { ratio: 9, attack: 0.35, release: 1.5, brightness: 0.4, detune: 14, volume: -16 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sapphic-hours-answering-strophe',
    name: 'Answering strophe',
    category: 'bell',
    description:
      'A glass bell followed by two voices that bring each note back reversed, one after the other.',
    preview: TWO_HALVES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { ratio: 6, brightness: 0.35, decay: 1, release: 1.2, volume: -4.5 },
    },
    effects: [{ deviceId: 'canon', preset: 'Crab canon', params: { gap: 1.24, mix: 0.55 } }],
  },
  {
    id: 'sapphic-hours-water-jar-dripping',
    name: 'Water jar dripping',
    category: 'texture',
    description:
      'A glass tick with almost no length, scattered into pattering echoes that never blur.',
    preview: FIVES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { ratio: 4, decay: 0.12, release: 0.15, brightness: 0.35, volume: 0 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Pattering',
        params: { mix: 0.6, feedback: 0.55, length: 0.5 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'sapphic-hours-clock-of-shorts',
    name: 'Clock of shorts',
    category: 'keys',
    description:
      'A tine-like mallet whose lows and highs trade places at the speed of shorts, on a seasick reel of tape.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { decay: 2.6, release: 0.9, brightness: 0.5, detune: 9, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3.45, depth: 0.95 } },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'sapphic-hours-after-moonset',
    name: 'After moonset',
    category: 'bell',
    description:
      'Almost a sine, with one far partial above it and wide detuning, throwing off long sparks two octaves up.',
    preview: MARCH,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: { brightness: 0.04, decay: 2, release: 3, attack: 0.01, detune: 22, volume: -5.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { density: 3, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Open', params: { body: -3, highCut: 6000 } },
    ],
  },
  {
    id: 'sapphic-hours-papyrus-edge',
    name: 'Papyrus edge',
    category: 'bell',
    description:
      'A frayed glass tone, its operator fed back on itself, on a worn record with the crackle left in.',
    preview: TENT_POLE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: {
        algorithm: 1,
        ratio: 2,
        feedback: 0.85,
        brightness: 0.6,
        decay: 0.9,
        release: 0.7,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Charity shop find',
        params: { warp: 0.25, pops: 0.05, crackle: 0.25 },
      },
    ],
  },
  {
    id: 'sapphic-hours-epode-on-pipes',
    name: 'Epode on pipes',
    category: 'organ',
    description:
      'A half-ratio glass tone held even under the keys and drawn out into fifths and octaves by stops.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { ratio: 0, brightness: 0.15, attack: 0.08, release: 0.3, sustain: 1, volume: -19 },
    },
    effects: [{ deviceId: 'stops', preset: 'Open fifths', params: { octave: 0.3 } }],
  },

  // Mallets: wood for the shorts, metal for the longs, rolled where a long is held.
  {
    id: 'sapphic-hours-five-then-a-rest',
    name: 'Five, then a rest',
    category: 'bell',
    description:
      'A hard-malleted marimba damped short, played inside a small stopped pipe of wood.',
    preview: FIVE_SEVEN_FIVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.75, decay: 0.35, damper: 0.6, resonator: 0.3, width: 0.2, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Cistern',
        params: { size: 0.8, material: 0.4, air: 0, mix: 0.6, width: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'sapphic-hours-seven-wooden-steps',
    name: 'Seven wooden steps',
    category: 'bell',
    description:
      'A dry xylophone doubled an octave down, each note followed by a soft pebble of echoes.',
    preview: MARCH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.5, decay: 1, volume: 4 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave down', params: { mix: 0.55 } },
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sapphic-hours-held-by-the-motor',
    name: 'Held by the motor',
    category: 'bell',
    description:
      'Soft vibraphone bars ringing four times as long as usual, throbbing under slow fans, each tone held on by a blur.',
    preview: RECITING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { decay: 4, mallet: 0.05, motorRate: 1.7, volume: -13 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { blur: 0.8, mix: 0.6 } },
    ],
  },
  {
    id: 'sapphic-hours-temple-step-at-noon',
    name: 'Temple step at noon',
    category: 'bell',
    description: 'Open metal bars with the fans still, hit with a harder mallet in a bright hall.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.85, decay: 2.6, damper: 0, resonator: 0.2, width: 1, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.4 } }],
  },
  {
    id: 'sapphic-hours-long-held-by-rolling',
    name: 'Long held by rolling',
    category: 'bell',
    description:
      'A marimba rolled eleven times a second while a key is down, so longs tremble and shorts hardly do, thickened to a flock.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.1, decay: 2, width: 0.9, volume: -8.5 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'sapphic-hours-high-lintel-bells',
    name: 'High lintel bells',
    category: 'bell',
    description:
      'A bare glockenspiel with a hard beater, its echoes a long apart and hopping up by a fifth, then by a fourth.',
    preview: MARCH,
    instrument: { deviceId: 'mallets', preset: 'Glockenspiel', params: { decay: 0.8, volume: -2 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { intervalA: 5, intervalB: 4, time: 460, mix: 0.4 },
      },
    ],
  },
  {
    id: 'sapphic-hours-cradle-foot',
    name: 'Cradle foot',
    category: 'keys',
    description: 'A soft celesta with its body made small as a music box, on a worn cassette.',
    preview: MARCH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.15, decay: 0.7, damper: 0.4, volume: -3.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2 } },
    ],
  },
  {
    id: 'sapphic-hours-doubtful-syllable',
    name: 'Doubtful syllable',
    category: 'bell',
    description: 'A celesta with the dampers up, brought back in reversed chunks an octave above.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { mallet: 0.3, decay: 1.5, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { time: 600, feedback: 0.3, mix: 0.5 },
      },
    ],
  },
  {
    id: 'sapphic-hours-threshing-floor',
    name: 'Threshing floor',
    category: 'bell',
    description:
      'A wooden bar with no resonator under it, driven hard through a tube and put in a dark small room.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.2, decay: 0.4, resonator: 0, damper: 0, width: 0, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Bass grit',
        params: { driveDb: 22, outputDb: -10, mix: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'sapphic-hours-chorus-humming-along',
    name: 'Chorus humming along',
    category: 'pad',
    description:
      'A yarn-soft marimba with a low string section swelling in behind each chord it plays.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { decay: 2.5, volume: -5 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { rise: 0.35, fall: 2.5, mix: 0.6 },
      },
    ],
  },
  {
    id: 'sapphic-hours-frost-on-the-line',
    name: 'Frost on the line',
    category: 'bell',
    description:
      'Glockenspiel bars rolled so fast they shiver, their partials squeezed closer together.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 12, decay: 1.2, damper: 0.2, volume: -5.5 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { stretch: -0.45, mix: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'sapphic-hours-shuttle-and-comb',
    name: 'Shuttle and comb',
    category: 'bell',
    description:
      'A warm long xylophone gated on three steps of five, left against right, through a three-voice chorus.',
    preview: FIVES,
    instrument: { deviceId: 'mallets', preset: 'Warm xylophone', params: { volume: 1.5 } },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Left then right',
        params: { rate: 2.94, steps: 5, fill: 3, shift: 2, floor: 0.2 },
      },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'sapphic-hours-verse-through-a-wall',
    name: 'Verse through a wall',
    category: 'bell',
    description:
      'Motor vibraphone with a slow fan, heard from the next room through a closed door.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 0.9, motorRate: 2.6, decay: 1.5, volume: -12.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { makeup: 5 } },
    ],
  },
  {
    id: 'sapphic-hours-season-word',
    name: 'Season word',
    category: 'bell',
    description:
      'Glockenspiel bars over open resonators, struck hard and cut short, in an autumn that darkens and crumbles them.',
    preview: FIVES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.75, decay: 0.45, width: 0.2, volume: -5 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Leaf fall', params: { grit: 1, depth: 1 } }],
  },

  // Clarinet: the reed speaks the line; the hours run from a whisper before dawn to a shout at noon.
  {
    id: 'sapphic-hours-reciter-before-dawn',
    name: 'Reciter before dawn',
    category: 'wind',
    description:
      'A clarinet that is nearly all breath, its whisper shaped by a hall that sings a vowel back.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.14, release: 0.6, blow: 0, breath: 1, volume: -4 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Vowel drift',
        params: { mix: 0.65, decay: 3.5, vowel: 2.2 },
      },
    ],
  },
  {
    id: 'sapphic-hours-noon-herald',
    name: 'Noon herald',
    category: 'wind',
    description: 'A hard-blown open clarinet, tongued at once, off the stone of a bright chamber.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: { attack: 0.02, release: 0.1, vibrato: 0, blow: 1, volume: 1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.4 } }],
  },
  {
    id: 'sapphic-hours-reed-under-the-line',
    name: 'Reed under the line',
    category: 'bass',
    description:
      'A bass clarinet with a copy one octave down under it, the top closed off at two kilohertz.',
    preview: LOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.06, release: 0.25, breath: 0.25, volume: -2.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 2000, resonance: 0.7, slope: 1 },
      },
    ],
  },
  {
    id: 'sapphic-hours-apricot-wood-pipe',
    name: 'Apricot-wood pipe',
    category: 'wind',
    description:
      'A throaty double-reed colour with slow wide vibrato, over strings that ring in A minor with it.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { vibrato: 0.8, attack: 0.1, release: 0.4, volume: -2.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.6, decay: 6 } }],
  },
  {
    id: 'sapphic-hours-rough-breathing',
    name: 'Rough breathing',
    category: 'wind',
    description:
      'A reed growled hard in the throat and played into a small loudspeaker on the edge of breaking up.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { growl: 1, breath: 0.3, blow: 0.35, bore: 0.5, volume: -5.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { speaker: 0, bass: -0.2 } },
    ],
  },
  {
    id: 'sapphic-hours-smooth-breathing',
    name: 'Smooth breathing',
    category: 'wind',
    description:
      'A reed hum with hardly any blow, redrawn whole as six sines an octave up that ring on after the note.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { attack: 0.12, release: 0.5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { attack: 60, release: 1.6, mix: 1, spread: 1 },
      },
    ],
  },
  {
    id: 'sapphic-hours-two-sides-of-the-dance',
    name: 'Two sides of the dance',
    category: 'wind',
    description:
      'A hollow section of reeds doubled in diatonic thirds above and sixths below on either side.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.08, release: 0.3, volume: 4 },
    },
    effects: [{ deviceId: 'lattice', preset: 'Diatonic thirds' }],
  },
  {
    id: 'sapphic-hours-epitaph-by-the-road',
    name: 'Epitaph by the road',
    category: 'wind',
    description:
      'A subtone reed with the vibrato off, its repeats sinking by octaves, a third of their grains backwards.',
    preview: TWO_HALVES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { vibrato: 0, attack: 0.08, release: 0.5, blow: 0.35, volume: -4 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 620, mix: 0.45 } },
    ],
  },
  {
    id: 'sapphic-hours-shepherd-off-the-metre',
    name: 'Shepherd off the metre',
    category: 'wind',
    description:
      'A ballad-toned reed carried on the wind, fading and brightening as the gusts cross it.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: { attack: 0.07, release: 0.5, vibrato: 0.5, volume: -2 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.2, exposure: 0.8 } }],
  },
  {
    id: 'sapphic-hours-piper-half-asleep',
    name: 'Piper half asleep',
    category: 'wind',
    description:
      'A slow reed with the widest vibrato, sagging in pitch and darkening where it has rung longest.',
    preview: RECITING,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: { attack: 0.25, release: 1.2, volume: -3 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax' },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { highCut: 4000 } },
    ],
  },
  {
    id: 'sapphic-hours-tongued-shorts',
    name: 'Tongued shorts',
    category: 'wind',
    description:
      'A bright soprano reed cut off at the tongue, through a band-pass that opens late, so a short is darker than a long.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.015, release: 0.06, vibrato: 0, bore: 0.8, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: {
          envAmount: 70,
          envAttackMs: 220,
          envReleaseMs: 120,
          resonance: 2,
          cutoffHz: 450,
          mix: 0.8,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'sapphic-hours-trilled-consonant',
    name: 'Trilled consonant',
    category: 'wind',
    description:
      'A flutter-tongued reed swept slowly by a twelve-stage phaser, wide across both sides.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.09, release: 0.5, breath: 0.35, volume: 6 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Twelve stage cloud' }],
  },
  {
    id: 'sapphic-hours-chorus-of-old-men',
    name: 'Chorus of old men',
    category: 'organ',
    description:
      'A slow reed played in chords through drawbar stops with copies an octave below and above, late to speak, in a cathedral.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { attack: 0.2, release: 1, blow: 0.4, volume: -4.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Pedal under', params: { speak: 350, mix: 0.6, octave: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // Harp: the lyre of the pack, from a gut string near the soundboard to silk and steel.
  {
    id: 'sapphic-hours-seven-gut-strings',
    name: 'Seven gut strings',
    category: 'plucked',
    description:
      'A harp plucked low by the soundboard and damped as the key goes, played through a clean combo in a room.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { damp: 0.5, touch: 0.8, decay: 0.4, halo: 0, volume: 4.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.1, room: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sapphic-hours-tortoiseshell-bowl',
    name: 'Tortoiseshell bowl',
    category: 'plucked',
    description: 'A dark harp string sounding in a shell of bone, hollow and a little breathy.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 0.8, halo: 0, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Shell to the ear',
        params: { air: 0.4, size: 0.8, mix: 0.85 },
      },
    ],
  },
  {
    id: 'sapphic-hours-silk-before-rain',
    name: 'Silk before rain',
    category: 'plucked',
    description: 'A silk string pressed a quarter tone as it speaks, with rain at the window.',
    preview: FIVE_SEVEN_FIVE,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { touch: 0.3, decay: 1, halo: 0.3, volume: 4 },
    },
    effects: [
      {
        deviceId: 'weather',
        preset: 'Breezy day',
        params: { kind: 2, voice: 0.25, exposure: 0.5 },
      },
    ],
  },
  {
    id: 'sapphic-hours-strophe-in-steel',
    name: 'Strophe in steel',
    category: 'plucked',
    description: 'Steel guzheng strings at their brightest, flanged slowly through both sides.',
    preview: TENT_POLE,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { decay: 1.6, halo: 0.2, pluck: 0.06, volume: 3.5 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Slow sweep', params: { feedback: 50 } }],
  },
  {
    id: 'sapphic-hours-dancers-turning',
    name: 'Dancers turning',
    category: 'plucked',
    description:
      'A rolled harp chord that takes most of a second to cross, carried round the head in a slow circle.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.7, decay: 0.8, touch: 0.6, volume: 2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.3, radius: 1, head: 1 } },
    ],
  },
  {
    id: 'sapphic-hours-muffled-by-the-palm',
    name: 'Muffled by the palm',
    category: 'plucked',
    description: 'A muted harp string answered by its own lower octave at half speed.',
    preview: FIVES,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 1, decay: 0.5, touch: 0.1, volume: 5 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Fifth down bed',
        params: { speed: 2, length: 1360, mix: 0.55 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sapphic-hours-vowel-that-will-not-end',
    name: 'Vowel that will not end',
    category: 'plucked',
    description:
      'A soft harp caught and held under the keys as an even pad, the pluck left on top.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.05, decay: 2, volume: -4 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Sustain pedal',
        params: { attack: 0.4, decay: 4, mix: 0.65, tone: -0.3 },
      },
    ],
  },
  {
    id: 'sapphic-hours-verse-on-the-dial',
    name: 'Verse on the dial',
    category: 'plucked',
    description: 'A koto string tuned in on shortwave, narrow and fading with a little static.',
    preview: FIVE_SEVEN_FIVE,
    instrument: { deviceId: 'harp', preset: 'Koto', params: { decay: 1.5, volume: 0.5 } },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.35, static: 0.15, interference: 0 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'sapphic-hours-over-the-line-end',
    name: 'Over the line end',
    category: 'plucked',
    description:
      'Harp chords rolled upward over a third of a second, pieces of them falling a fifth as they fade.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { sweep: 0.35, decay: 0.6, halo: 0.3, volume: 1.5 },
    },
    effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.5 } }],
  },

  // Chord harp: one press is a whole foot, swept up, down or all at once.
  {
    id: 'sapphic-hours-foot-in-one-press',
    name: 'Foot in one press',
    category: 'plucked',
    description:
      'A chord swept across two octaves in short bright plucks, each press answered by echoes that bounce closer and closer.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 35, direction: 0, sustain: 0.6, tone: 0.9, volume: 6 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Ball on glass',
        params: { first: 290, throw: 0.4, mix: 0.45 },
      },
    ],
  },
  {
    id: 'sapphic-hours-awning-at-sundown',
    name: 'Awning at sundown',
    category: 'plucked',
    description: 'A slow sweep up and back across four octaves, dark and long, under a warm valve.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 70, tone: 0.1, sustain: 7, volume: -12 },
    },
    effects: [{ deviceId: 'patina', preset: 'Hot valve' }],
  },
  {
    id: 'sapphic-hours-caesura-and-after',
    name: 'Caesura and after',
    category: 'plucked',
    description:
      'A chord falling four octaves, then heard again spread out in time from its lows to its highs.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { strum: 25, sustain: 1.5, pad: 0, tone: 0.6, volume: 2.5 },
    },
    effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1200, mix: 0.6 } }],
  },
  {
    id: 'sapphic-hours-lintel-and-door-flap',
    name: 'Lintel and door flap',
    category: 'pad',
    description:
      'The held pad of the chord with hardly a pluck on it, detuned wide and filtered, opening and closing at the pace of a long.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { tone: 0.45, spread: 0.6, volume: -18 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 1.72, lfoAmount: 45, cutoffHz: 700, resonance: 1.2, driveDb: 0 },
      },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'sapphic-hours-scattered-feet',
    name: 'Scattered feet',
    category: 'plucked',
    description:
      'The notes of the chord in no order, thin and bright, with sparks thrown an octave and a fifth above them.',
    preview: FIVES,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Scattered glints',
      params: { strum: 90, span: 1, sustain: 2, tone: 0.75, volume: 1 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.45, density: 9 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'sapphic-hours-brushed-half-line',
    name: 'Brushed half-line',
    category: 'plucked',
    description:
      'A brushed chord with most of its attack sifted away, the body ringing on and the air scattered wide.',
    preview: TWO_HALVES,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { tone: 0.5, pad: 0.1, sustain: 2.5, span: 0, volume: -1 },
    },
    effects: [
      {
        deviceId: 'sift',
        preset: 'Soft hammers',
        params: { attacks: -26, hold: 0.6, soften: 0.4 },
      },
    ],
  },
  {
    id: 'sapphic-hours-single-quantity',
    name: 'Single quantity',
    category: 'plucked',
    description:
      'One soft chime at each key with no sweep, put through a toy converter at eight bits and a narrow band.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { sustain: 1.4, tone: 0.3, span: 1, volume: -0.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { rate: 9000, aliasing: 0.4 } },
    ],
  },
  {
    id: 'sapphic-hours-veil-over-the-strings',
    name: 'Veil over the strings',
    category: 'pad',
    description:
      'A muffled strum held by its pad and smeared into dark water, the sweep just heard inside.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { strum: 60, pad: 0.8, sustain: 4, volume: -22 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { highCut: 3500, mix: 0.75 } },
    ],
  },

  // Felt piano: the metre read aloud, unaccented, at six distances.
  {
    id: 'sapphic-hours-scansion-by-lamplight',
    name: 'Scansion by lamplight',
    category: 'keys',
    description:
      'A thick-felted piano with the knock and rattle of its action close by, on quarter-inch tape.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { hardness: 0.1, thump: 0.6, action: 0.8, reverbMix: 0, outputDb: -10.5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, hiss: 0.15 } }],
  },
  {
    id: 'sapphic-hours-pencilled-quantities',
    name: 'Pencilled quantities',
    category: 'keys',
    description:
      'A bare hard piano with no room of its own, pinched by a horn loudspeaker and levelled hard.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0, hardness: 0.8, stiffness: 1.4, resonance: 0, outputDb: -4 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { distance: 0.2, room: 0.25, drive: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'sapphic-hours-reading-to-the-far-row',
    name: 'Reading to the far row',
    category: 'keys',
    description:
      'A half-pedalled piano from the far end of a theatre, dark and late, its quiet tail lifted.',
    preview: TWO_HALVES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { hardness: 0.6, resonance: 1, outputDb: -18 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { distance: 0.85, decay: 3 } },
      { deviceId: 'lift', preset: 'Quiet end up' },
    ],
  },
  {
    id: 'sapphic-hours-elegy-with-one-hand',
    name: 'Elegy with one hand',
    category: 'keys',
    description:
      'A piano under the sustain pedal whose hammers are removed, each syllable rising out of the last.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { felt: 0.4, hardness: 0.5, reverbMix: 0.2, outputDb: -11.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 200 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { makeup: 4 } },
    ],
  },
  {
    id: 'sapphic-hours-stanza-out-of-tune',
    name: 'Stanza out of tune',
    category: 'keys',
    description:
      'An old upright at its widest detuning, wobbling through a chorus used as vibrato.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { felt: 0.1, hardness: 0.7, thump: 0.4, reverbMix: 0, outputDb: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vibrato', params: { rate: 3.2, depth: 22 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'sapphic-hours-hour-with-no-accent',
    name: 'Hour with no accent',
    category: 'keys',
    description:
      'A soft thud of a piano, all felt and no edge, with a shadow an octave up following a fifth of a second behind.',
    preview: FOURFOLD,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.4, reverbMix: 0.1, soft: 1, outputDb: -2.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: { gap: 0.2, interval1: 12, mix: 0.45, tone: 6000 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },

  // Wavetable: the vowels of the line, from a hummed long to a pulse cut short.
  {
    id: 'sapphic-hours-open-long-vowel',
    name: 'Open long vowel',
    category: 'voice',
    description:
      'A vowel table standing still near its first vowel, quick to open, with a vibrato that waits for the longs.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { position: 0.15, attack: 0.12, release: 0.8, cutoff: 5500, detune: 16, volume: -9 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 300, depth: 30 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'sapphic-hours-closed-syllable',
    name: 'Closed syllable',
    category: 'keys',
    description:
      'A narrow hollow pulse stopped as soon as the key is, through a mu-law converter with no reverb after it.',
    preview: SIX_FEET,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: {
        attack: 0.006,
        release: 0.08,
        cutoff: 2600,
        resonance: 0.35,
        sub: 0.3,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Glaze',
        params: { companding: 1, bits: 9, rate: 12000 },
      },
    ],
  },
  {
    id: 'sapphic-hours-stage-before-sunrise',
    name: 'Stage before sunrise',
    category: 'drone',
    description:
      'A dark bed of reed tone with a sub octave beneath it, its overtones picked out one by one above D.',
    preview: RECITING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.35, release: 1.5, cutoff: 1400, position: 0.5, sub: 0.6, volume: -10.5 },
    },
    effects: [{ deviceId: 'overtone-singer', preset: 'Thin drone', params: { root: 2, pace: 2 } }],
  },
  {
    id: 'sapphic-hours-beating-at-the-line-end',
    name: 'Beating at the line end',
    category: 'pad',
    description:
      'Two detuned sines a shade apart, beating slowly, with a little octave above and a blurred halo that does not sag.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { detune: 13, attack: 0.3, release: 2.5, sub: 0.3, volume: -16 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Still halo', params: { mix: 0.5 } },
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.35 } },
    ],
  },
  {
    id: 'sapphic-hours-frozen-colon',
    name: 'Frozen colon',
    category: 'pad',
    description:
      'A thin fixed spectrum whose bands swell and fade in turn, a ripple climbing through each chord.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.08, release: 1.8, position: 0.6, cutoff: 7000, volume: -10 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Rising ripple', params: { rate: 1.7, depth: 1 } }],
  },
  {
    id: 'sapphic-hours-reed-chorus-entering',
    name: 'Reed chorus entering',
    category: 'organ',
    description:
      'A reed organ table sawn off at the top, throbbing over three times a second in its middle band.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.6, cutoff: 3600, detune: 14, attack: 0.06, release: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Six a second', params: { rate: 3.45, depth: 0.9 } },
      { deviceId: 'analog-drive', preset: 'Console' },
    ],
  },

  // Afterglow: a short that is struck and a long that grows out of it.
  {
    id: 'sapphic-hours-short-that-grows-long',
    name: 'Short that grows long',
    category: 'keys',
    description: 'A felt strike with a quick glow behind it, breathing at the length of two longs.',
    preview: STANZA_END,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Quick swell',
      params: { strike: 0.6, fade: 2.2, tone: 0.45, volume: -15 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 0.5, hold: 0.02, out: 0.5, rest: 0.02, depth: 0.7, vary: 0 },
      },
    ],
  },
  {
    id: 'sapphic-hours-bell-for-the-fourth-line',
    name: 'Bell for the fourth line',
    category: 'bell',
    description:
      'A bright struck bell cut almost to its strike, with one far echo arriving alone where a line would end.',
    preview: CLOSING_LINE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { glow: 0.15, decay: 0.8, fade: 0.8, halo: 0, volume: 1.5 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'One far star',
        params: { span: 2400, again: 0, mix: 0.45 },
      },
    ],
  },
  {
    id: 'sapphic-hours-plectrum-into-ember',
    name: 'Plectrum into ember',
    category: 'plucked',
    description:
      'A plucked string that turns into a dark fuzzed glow, blurred by a short room before and a long one after.',
    preview: TENT_POLE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: { bloom: 0.8, fade: 2, tone: 0.2, volume: -11 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 3, mix: 0.5 } }],
  },
  {
    id: 'sapphic-hours-standing-glass-hour',
    name: 'Standing glass hour',
    category: 'pad',
    description: 'A glass strike under a still, unmoving glow, slowly phased in four stages.',
    preview: TENT_CHORDS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { strike: 0.3, glow: 0.9, bloom: 0.5, tone: 0.7, fade: 2.5, volume: -10 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { feedback: 65, depth: 90 } },
    ],
  },
  {
    id: 'sapphic-hours-tide-of-the-third-line',
    name: 'Tide of the third line',
    category: 'pad',
    description:
      'Only the glow with no strike, pressed into a round vowel and panned back and forth every four seconds.',
    preview: FOUR_CHORDS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.4, fade: 2, evolve: 1, volume: -15 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.25, depth: 1 } },
    ],
  },

  // Ice: hard consonants across water.
  {
    id: 'sapphic-hours-hard-consonant-on-ice',
    name: 'Hard consonant on ice',
    category: 'bell',
    description:
      'A brittle snap of ice with a short ring, close by, doubled by a bright cloud of detuned copies.',
    preview: MARCH,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { ring: 2.4, bright: 0.5, stretch: 0, volume: 6 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.5 } }],
  },
  {
    id: 'sapphic-hours-seventh-mora-on-the-pond',
    name: 'Seventh mora on the pond',
    category: 'bell',
    description:
      'A clear ping on thick ice with no cracks, under the surface, with a few bubbles rising.',
    preview: FIVE_SEVEN_FIVE,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { thick: 0.9, ring: 2, bright: 0.45, volume: 2.5 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Under', params: { bubbles: 0.2 } }],
  },
  {
    id: 'sapphic-hours-line-carried-over-snow',
    name: 'Line carried over snow',
    category: 'bell',
    description:
      'A falling chirp from across the ice settling into a note that rings, in a smooth dark plate.',
    preview: RECITING,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { distance: 0.7, ring: 5, cracks: 0, stretch: 0.6, volume: -0.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.5 } }],
  },

  // Feedback: a string that keeps speaking after the pluck.
  {
    id: 'sapphic-hours-plucked-and-silent',
    name: 'Plucked and silent',
    category: 'plucked',
    description:
      'A string plucked with the amplifier turned down, damped early, its dry stroke repeated once by a slap of tape.',
    preview: TENT_POLE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Plucked and gone',
      params: { gain: 0.15, damp: 0.5, release: 0.25, grit: 0.1, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 145, mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'sapphic-hours-twelfth-above-the-verse',
    name: 'Twelfth above the verse',
    category: 'string',
    description:
      'A clean string caught on its twelfth as soon as it sounds, turned by fast rotors at a distance.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.12, gain: 0.85, release: 0.6, volume: -5.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Guitar swirl', params: { distance: 0.8 } }],
  },
  {
    id: 'sapphic-hours-hoarse-antiphon',
    name: 'Hoarse antiphon',
    category: 'string',
    description: 'A gritty reed-like string on its own pitch, held in the throat of an open pipe.',
    preview: LOW_LINE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Reed tone',
      params: { grit: 0.9, pick: 0.35, release: 0.2, volume: -8 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 2, mix: 0.6 } }],
  },
]
