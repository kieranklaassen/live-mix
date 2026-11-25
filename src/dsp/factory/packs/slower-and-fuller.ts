import { type FactoryPreset, type Phrase } from '../types'

// One slow tune and the players who fill it in: at one, two, four, eight and sixteen strokes a
// tone, with a gong cycle under them. From two on the hands keep one speed while the tune is
// stretched. Laid out by instrument, from long sounds for the tune to short ones for the quick
// strokes. The tunings are the five-tone one on C (0 231 474 717 955 cents) and five tones of
// the seven-tone one on A (0 120 258 675 785), written as fractions of a key.

// The skeleton quick, sixteen tones after the gong, an octave above it struck once to each.
const ONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 55.17, gain: 0.78 },
    { atSec: 0, durSec: 1.4, note: 43.17, gain: 0.7 },
    { atSec: 0.4, durSec: 0.36, note: 74.31, gain: 0.42 },
    { atSec: 0.4, durSec: 0.4, note: 62.31, gain: 0.56 },
    { atSec: 0.8, durSec: 0.36, note: 72, gain: 0.5 },
    { atSec: 0.8, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 1.2, durSec: 0.36, note: 74.31, gain: 0.42 },
    { atSec: 1.2, durSec: 0.4, note: 62.31, gain: 0.59 },
    { atSec: 1.6, durSec: 0.36, note: 69.55, gain: 0.5 },
    { atSec: 1.6, durSec: 0.4, note: 57.55, gain: 0.76 },
    { atSec: 2, durSec: 0.36, note: 76.74, gain: 0.42 },
    { atSec: 2, durSec: 0.4, note: 64.74, gain: 0.56 },
    { atSec: 2.4, durSec: 0.36, note: 74.31, gain: 0.5 },
    { atSec: 2.4, durSec: 0.4, note: 62.31, gain: 0.5 },
    { atSec: 2.8, durSec: 0.36, note: 72, gain: 0.42 },
    { atSec: 2.8, durSec: 0.4, note: 60, gain: 0.59 },
    { atSec: 3.2, durSec: 0.36, note: 67.17, gain: 0.5 },
    { atSec: 3.2, durSec: 0.4, note: 55.17, gain: 0.76 },
    { atSec: 3.6, durSec: 0.36, note: 69.55, gain: 0.42 },
    { atSec: 3.6, durSec: 0.4, note: 57.55, gain: 0.56 },
    { atSec: 4, durSec: 0.36, note: 72, gain: 0.5 },
    { atSec: 4, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 4.4, durSec: 0.36, note: 74.31, gain: 0.42 },
    { atSec: 4.4, durSec: 0.4, note: 62.31, gain: 0.59 },
    { atSec: 4.8, durSec: 0.36, note: 76.74, gain: 0.5 },
    { atSec: 4.8, durSec: 0.4, note: 64.74, gain: 0.76 },
    { atSec: 5.2, durSec: 0.36, note: 74.31, gain: 0.42 },
    { atSec: 5.2, durSec: 0.4, note: 62.31, gain: 0.56 },
    { atSec: 5.6, durSec: 0.36, note: 72, gain: 0.5 },
    { atSec: 5.6, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 6, durSec: 0.36, note: 69.55, gain: 0.42 },
    { atSec: 6, durSec: 0.4, note: 57.55, gain: 0.59 },
    { atSec: 6.4, durSec: 0.36, note: 67.17, gain: 0.5 },
    { atSec: 6.4, durSec: 0.4, note: 55.17, gain: 0.76 },
    { atSec: 6.4, durSec: 0.9, note: 43.17, gain: 0.7 },
  ],
}

// The same sixteen tones, each struck twice, ahead of it and with it: every second stroke meets its tone.
const TWOS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 55.17, gain: 0.78 },
    { atSec: 0, durSec: 1.4, note: 43.17, gain: 0.7 },
    { atSec: 0.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 0.4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 0.4, durSec: 0.4, note: 62.31, gain: 0.56 },
    { atSec: 0.6, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 0.8, durSec: 0.18, note: 72, gain: 0.5 },
    { atSec: 0.8, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 1, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 1.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 1.2, durSec: 0.4, note: 62.31, gain: 0.59 },
    { atSec: 1.4, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 1.6, durSec: 0.18, note: 69.55, gain: 0.5 },
    { atSec: 1.6, durSec: 0.4, note: 57.55, gain: 0.76 },
    { atSec: 1.8, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 2, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 2, durSec: 0.4, note: 64.74, gain: 0.56 },
    { atSec: 2.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2.4, durSec: 0.18, note: 74.31, gain: 0.5 },
    { atSec: 2.4, durSec: 0.4, note: 62.31, gain: 0.5 },
    { atSec: 2.6, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 2.8, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 2.8, durSec: 0.4, note: 60, gain: 0.59 },
    { atSec: 3, durSec: 0.18, note: 67.17, gain: 0.42 },
    { atSec: 3.2, durSec: 0.18, note: 67.17, gain: 0.5 },
    { atSec: 3.2, durSec: 0.4, note: 55.17, gain: 0.76 },
    { atSec: 3.4, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 3.6, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 3.6, durSec: 0.4, note: 57.55, gain: 0.56 },
    { atSec: 3.8, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 4, durSec: 0.18, note: 72, gain: 0.5 },
    { atSec: 4, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 4.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4.4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4.4, durSec: 0.4, note: 62.31, gain: 0.59 },
    { atSec: 4.6, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 4.8, durSec: 0.18, note: 76.74, gain: 0.5 },
    { atSec: 4.8, durSec: 0.4, note: 64.74, gain: 0.76 },
    { atSec: 5, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 5.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 5.2, durSec: 0.4, note: 62.31, gain: 0.56 },
    { atSec: 5.4, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 5.6, durSec: 0.18, note: 72, gain: 0.5 },
    { atSec: 5.6, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 5.8, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 6, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 6, durSec: 0.4, note: 57.55, gain: 0.59 },
    { atSec: 6.2, durSec: 0.18, note: 67.17, gain: 0.42 },
    { atSec: 6.4, durSec: 0.18, note: 67.17, gain: 0.5 },
    { atSec: 6.4, durSec: 0.4, note: 55.17, gain: 0.76 },
    { atSec: 6.4, durSec: 0.9, note: 43.17, gain: 0.7 },
  ],
}

// Half the tune in the same time: eight tones, four strokes to each, as fast as before.
const FOURS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 55.17, gain: 0.78 },
    { atSec: 0, durSec: 2.4, note: 43.17, gain: 0.67 },
    { atSec: 0.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 0.4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 0.6, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 0.8, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 62.31, gain: 0.56 },
    { atSec: 1, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 1.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 1.4, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 0.18, note: 72, gain: 0.5 },
    { atSec: 1.6, durSec: 0.8, note: 60, gain: 0.5 },
    { atSec: 1.8, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2.2, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 2.4, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 62.31, gain: 0.59 },
    { atSec: 2.6, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2.8, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 3, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 3.2, durSec: 0.18, note: 69.55, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 57.55, gain: 0.76 },
    { atSec: 3.4, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 3.6, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 3.8, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 64.74, gain: 0.56 },
    { atSec: 4.2, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 4.4, durSec: 0.18, note: 76.74, gain: 0.42 },
    { atSec: 4.6, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4.8, durSec: 0.18, note: 74.31, gain: 0.5 },
    { atSec: 4.8, durSec: 0.8, note: 62.31, gain: 0.5 },
    { atSec: 5, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 5.2, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 5.4, durSec: 0.18, note: 67.17, gain: 0.42 },
    { atSec: 5.6, durSec: 0.18, note: 67.17, gain: 0.42 },
    { atSec: 5.6, durSec: 0.8, note: 60, gain: 0.59 },
    { atSec: 5.8, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 6, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 6.2, durSec: 0.18, note: 67.17, gain: 0.42 },
    { atSec: 6.4, durSec: 0.18, note: 67.17, gain: 0.5 },
    { atSec: 6.4, durSec: 0.8, note: 55.17, gain: 0.76 },
    { atSec: 6.4, durSec: 0.9, note: 43.17, gain: 0.67 },
  ],
}

// Four tones stretched again, eight strokes to each.
const EIGHTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.552, note: 55.17, gain: 0.78 },
    { atSec: 0.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 0.4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 0.6, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 0.8, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 1, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 1.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 1.4, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 1.552, note: 62.31, gain: 0.56 },
    { atSec: 1.8, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2.2, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 2.4, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 2.6, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 2.8, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 3, durSec: 0.18, note: 72, gain: 0.42 },
    { atSec: 3.2, durSec: 0.18, note: 72, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 48, gain: 0.42 },
    { atSec: 3.2, durSec: 1.552, note: 60, gain: 0.5 },
    { atSec: 3.4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 3.6, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 3.8, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 4, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 4.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4.4, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 4.6, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 4.8, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 4.8, durSec: 1.552, note: 62.31, gain: 0.59 },
    { atSec: 5, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 5.2, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 5.4, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 5.6, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 5.8, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 6, durSec: 0.18, note: 74.31, gain: 0.42 },
    { atSec: 6.2, durSec: 0.18, note: 69.55, gain: 0.42 },
    { atSec: 6.4, durSec: 0.18, note: 69.55, gain: 0.5 },
    { atSec: 6.4, durSec: 0.9, note: 57.55, gain: 0.76 },
  ],
}

// The first two tones of the tune, 2 and 1, sixteen strokes to each: a wandering line that arrives on both, its lower
// octave struck with every fourth stroke.
const SIXTEENS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 55.17, gain: 0.7 },
    { atSec: 0.2, durSec: 0.18, note: 81.55, gain: 0.48 },
    { atSec: 0.4, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 0.6, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 0.8, durSec: 0.18, note: 79.17, gain: 0.62 },
    { atSec: 0.8, durSec: 0.36, note: 67.17, gain: 0.42 },
    { atSec: 1, durSec: 0.18, note: 74.31, gain: 0.48 },
    { atSec: 1.2, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 1.4, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 1.6, durSec: 0.18, note: 76.74, gain: 0.62 },
    { atSec: 1.6, durSec: 0.36, note: 64.74, gain: 0.42 },
    { atSec: 1.8, durSec: 0.18, note: 72, gain: 0.48 },
    { atSec: 2, durSec: 0.18, note: 74.31, gain: 0.48 },
    { atSec: 2.2, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 2.4, durSec: 0.18, note: 79.17, gain: 0.62 },
    { atSec: 2.4, durSec: 0.36, note: 67.17, gain: 0.42 },
    { atSec: 2.6, durSec: 0.18, note: 81.55, gain: 0.48 },
    { atSec: 2.8, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 3, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 3.2, durSec: 0.18, note: 74.31, gain: 0.62 },
    { atSec: 3.2, durSec: 3.1, note: 62.31, gain: 0.68 },
    { atSec: 3.4, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 3.6, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 3.8, durSec: 0.18, note: 81.55, gain: 0.48 },
    { atSec: 4, durSec: 0.18, note: 79.17, gain: 0.62 },
    { atSec: 4, durSec: 0.36, note: 67.17, gain: 0.42 },
    { atSec: 4.2, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 4.4, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 4.6, durSec: 0.18, note: 81.55, gain: 0.48 },
    { atSec: 4.8, durSec: 0.18, note: 84, gain: 0.62 },
    { atSec: 4.8, durSec: 0.36, note: 72, gain: 0.42 },
    { atSec: 5, durSec: 0.18, note: 81.55, gain: 0.48 },
    { atSec: 5.2, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 5.4, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 5.6, durSec: 0.18, note: 74.31, gain: 0.62 },
    { atSec: 5.6, durSec: 0.36, note: 62.31, gain: 0.42 },
    { atSec: 5.8, durSec: 0.18, note: 79.17, gain: 0.48 },
    { atSec: 6, durSec: 0.18, note: 76.74, gain: 0.48 },
    { atSec: 6.2, durSec: 0.18, note: 74.31, gain: 0.48 },
    { atSec: 6.4, durSec: 0.18, note: 72, gain: 0.62 },
    { atSec: 6.4, durSec: 0.9, note: 60, gain: 0.7 },
  ],
}

// One four-tone phrase three times, each time at half the pace with twice the strokes: the hands never change speed.
const SLOWING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.22, note: 55.17, gain: 0.78 },
    { atSec: 0.22, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 0.22, durSec: 0.22, note: 62.31, gain: 0.56 },
    { atSec: 0.44, durSec: 0.198, note: 72, gain: 0.5 },
    { atSec: 0.44, durSec: 0.22, note: 60, gain: 0.5 },
    { atSec: 0.66, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 0.66, durSec: 0.22, note: 62.31, gain: 0.59 },
    { atSec: 0.88, durSec: 0.198, note: 69.55, gain: 0.5 },
    { atSec: 0.88, durSec: 0.22, note: 57.55, gain: 0.76 },
    { atSec: 1.1, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 1.32, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 1.32, durSec: 0.44, note: 62.31, gain: 0.56 },
    { atSec: 1.54, durSec: 0.198, note: 72, gain: 0.42 },
    { atSec: 1.76, durSec: 0.198, note: 72, gain: 0.5 },
    { atSec: 1.76, durSec: 0.44, note: 60, gain: 0.5 },
    { atSec: 1.98, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 2.2, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 2.2, durSec: 0.44, note: 62.31, gain: 0.59 },
    { atSec: 2.42, durSec: 0.198, note: 69.55, gain: 0.42 },
    { atSec: 2.64, durSec: 0.198, note: 69.55, gain: 0.5 },
    { atSec: 2.64, durSec: 0.44, note: 57.55, gain: 0.76 },
    { atSec: 2.86, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 3.08, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 3.3, durSec: 0.198, note: 72, gain: 0.42 },
    { atSec: 3.52, durSec: 0.198, note: 72, gain: 0.42 },
    { atSec: 3.52, durSec: 0.88, note: 62.31, gain: 0.56 },
    { atSec: 3.74, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 3.96, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 4.18, durSec: 0.198, note: 72, gain: 0.42 },
    { atSec: 4.4, durSec: 0.198, note: 72, gain: 0.5 },
    { atSec: 4.4, durSec: 0.88, note: 60, gain: 0.5 },
    { atSec: 4.62, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 4.84, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 5.06, durSec: 0.198, note: 69.55, gain: 0.42 },
    { atSec: 5.28, durSec: 0.198, note: 69.55, gain: 0.42 },
    { atSec: 5.28, durSec: 0.88, note: 62.31, gain: 0.59 },
    { atSec: 5.5, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 5.72, durSec: 0.198, note: 74.31, gain: 0.42 },
    { atSec: 5.94, durSec: 0.198, note: 69.55, gain: 0.42 },
    { atSec: 6.16, durSec: 0.198, note: 69.55, gain: 0.5 },
    { atSec: 6.16, durSec: 0.88, note: 57.55, gain: 0.76 },
  ],
}

// The gong cycle of sixteen: gong on sixteen, pot gongs on the fours with the tune's own last tones, 6 5 3 5, hung gongs
// on 6, 10 and 14 that sound the next one in advance, the small one on the odd tones.
const GONGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 36, gain: 0.84 },
    { atSec: 0.4, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 1.2, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 1.6, durSec: 1.5, note: 69.55, gain: 0.59 },
    { atSec: 2, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 2.4, durSec: 1.5, note: 55.17, gain: 0.62 },
    { atSec: 2.8, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 3.2, durSec: 1.5, note: 67.17, gain: 0.59 },
    { atSec: 3.6, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 4, durSec: 1.5, note: 52.74, gain: 0.62 },
    { atSec: 4.4, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 4.8, durSec: 1.5, note: 64.74, gain: 0.59 },
    { atSec: 5.2, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 5.6, durSec: 1.5, note: 55.17, gain: 0.62 },
    { atSec: 6, durSec: 0.3, note: 62.31, gain: 0.31 },
    { atSec: 6.4, durSec: 0.9, note: 67.17, gain: 0.59 },
    { atSec: 6.4, durSec: 0.9, note: 36, gain: 0.84 },
  ],
}

// Pairs told in advance: a b a, a b a b at four to the tone, and an octave up at eight.
const PIPILAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.552, note: 55.17, gain: 0.78 },
    { atSec: 0.2, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 0.4, durSec: 0.18, note: 84, gain: 0.34 },
    { atSec: 0.4, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 0.6, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 0.8, durSec: 0.36, note: 72, gain: 0.48 },
    { atSec: 1, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 1.2, durSec: 0.18, note: 84, gain: 0.34 },
    { atSec: 1.2, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 1.4, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 1.6, durSec: 0.18, note: 84, gain: 0.34 },
    { atSec: 1.6, durSec: 1.552, note: 62.31, gain: 0.56 },
    { atSec: 1.8, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 2, durSec: 0.18, note: 84, gain: 0.34 },
    { atSec: 2, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 2.2, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 2.4, durSec: 0.36, note: 72, gain: 0.48 },
    { atSec: 2.6, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 2.8, durSec: 0.18, note: 84, gain: 0.34 },
    { atSec: 2.8, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 3, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 3.2, durSec: 0.18, note: 84, gain: 0.34 },
    { atSec: 3.2, durSec: 0.36, note: 72, gain: 0.48 },
    { atSec: 3.2, durSec: 1.552, note: 60, gain: 0.5 },
    { atSec: 3.4, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 3.6, durSec: 0.18, note: 81.55, gain: 0.34 },
    { atSec: 3.6, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 3.8, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 4, durSec: 0.36, note: 69.55, gain: 0.48 },
    { atSec: 4.2, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 4.4, durSec: 0.18, note: 81.55, gain: 0.34 },
    { atSec: 4.4, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 4.6, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 4.8, durSec: 0.18, note: 81.55, gain: 0.34 },
    { atSec: 4.8, durSec: 1.552, note: 62.31, gain: 0.59 },
    { atSec: 5, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 5.2, durSec: 0.18, note: 81.55, gain: 0.34 },
    { atSec: 5.2, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 5.4, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 5.6, durSec: 0.36, note: 69.55, gain: 0.48 },
    { atSec: 5.8, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 6, durSec: 0.18, note: 81.55, gain: 0.34 },
    { atSec: 6, durSec: 0.36, note: 74.31, gain: 0.48 },
    { atSec: 6.2, durSec: 0.18, note: 86.31, gain: 0.34 },
    { atSec: 6.4, durSec: 0.18, note: 81.55, gain: 0.34 },
    { atSec: 6.4, durSec: 0.36, note: 69.55, gain: 0.48 },
    { atSec: 6.4, durSec: 0.9, note: 57.55, gain: 0.76 },
  ],
}

// A plucked line of eight strokes to the tone that arrives each time on the tone of the tune, met by its octave below.
const SITER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 55.17, gain: 0.7 },
    { atSec: 0.2, durSec: 0.5, note: 81.55, gain: 0.5 },
    { atSec: 0.4, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 0.6, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 0.8, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 1, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 1.2, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 1.4, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 1.6, durSec: 0.5, note: 74.31, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 62.31, gain: 0.67 },
    { atSec: 1.8, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 2, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 2.2, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 2.4, durSec: 0.5, note: 74.31, gain: 0.5 },
    { atSec: 2.6, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 2.8, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 3, durSec: 0.5, note: 74.31, gain: 0.5 },
    { atSec: 3.2, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 60, gain: 0.67 },
    { atSec: 3.4, durSec: 0.5, note: 74.31, gain: 0.5 },
    { atSec: 3.6, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 3.8, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 4, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 4.2, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 4.4, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 4.6, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 4.8, durSec: 0.5, note: 74.31, gain: 0.5 },
    { atSec: 4.8, durSec: 1.5, note: 62.31, gain: 0.67 },
    { atSec: 5, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 5.2, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 5.4, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 5.6, durSec: 0.5, note: 81.55, gain: 0.5 },
    { atSec: 5.8, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 6, durSec: 0.5, note: 76.74, gain: 0.5 },
    { atSec: 6.2, durSec: 0.5, note: 79.17, gain: 0.5 },
    { atSec: 6.4, durSec: 0.5, note: 81.55, gain: 0.5 },
    { atSec: 6.4, durSec: 0.9, note: 57.55, gain: 0.67 },
  ],
}

// Two players interlock over 3 2 1 5, eight strokes to a tone: 1 and 3 in one pair of hands, 2 and 5 in the other, then a
// flourish that closes on 5.
const IMBAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 55.17, gain: 0.7 },
    { atSec: 0.2, durSec: 0.2, note: 60, gain: 0.53 },
    { atSec: 0.4, durSec: 0.2, note: 62.31, gain: 0.53 },
    { atSec: 0.6, durSec: 0.2, note: 64.74, gain: 0.53 },
    { atSec: 0.8, durSec: 0.2, note: 67.17, gain: 0.53 },
    { atSec: 1, durSec: 0.2, note: 60, gain: 0.53 },
    { atSec: 1.2, durSec: 0.2, note: 62.31, gain: 0.53 },
    { atSec: 1.4, durSec: 0.2, note: 64.74, gain: 0.53 },
    { atSec: 1.6, durSec: 0.2, note: 67.17, gain: 0.53 },
    { atSec: 1.6, durSec: 1.5, note: 52.74, gain: 0.6 },
    { atSec: 1.8, durSec: 0.2, note: 60, gain: 0.53 },
    { atSec: 2, durSec: 0.2, note: 62.31, gain: 0.53 },
    { atSec: 2.2, durSec: 0.2, note: 64.74, gain: 0.53 },
    { atSec: 2.4, durSec: 0.2, note: 67.17, gain: 0.53 },
    { atSec: 2.6, durSec: 0.2, note: 60, gain: 0.53 },
    { atSec: 2.8, durSec: 0.2, note: 62.31, gain: 0.53 },
    { atSec: 3, durSec: 0.2, note: 64.74, gain: 0.53 },
    { atSec: 3.2, durSec: 0.2, note: 67.17, gain: 0.53 },
    { atSec: 3.2, durSec: 1.5, note: 50.31, gain: 0.6 },
    { atSec: 3.4, durSec: 0.2, note: 69.55, gain: 0.56 },
    { atSec: 3.6, durSec: 0.2, note: 72, gain: 0.56 },
    { atSec: 3.8, durSec: 0.2, note: 69.55, gain: 0.56 },
    { atSec: 4, durSec: 0.2, note: 67.17, gain: 0.56 },
    { atSec: 4.2, durSec: 0.2, note: 64.74, gain: 0.56 },
    { atSec: 4.4, durSec: 0.2, note: 67.17, gain: 0.56 },
    { atSec: 4.6, durSec: 0.2, note: 69.55, gain: 0.56 },
    { atSec: 4.8, durSec: 1.5, note: 48, gain: 0.6 },
    { atSec: 4.8, durSec: 0.2, note: 67.17, gain: 0.56 },
    { atSec: 5, durSec: 0.2, note: 64.74, gain: 0.56 },
    { atSec: 5.2, durSec: 0.2, note: 62.31, gain: 0.56 },
    { atSec: 5.4, durSec: 0.2, note: 64.74, gain: 0.56 },
    { atSec: 5.6, durSec: 0.2, note: 67.17, gain: 0.56 },
    { atSec: 5.8, durSec: 0.2, note: 64.74, gain: 0.56 },
    { atSec: 6, durSec: 0.2, note: 62.31, gain: 0.56 },
    { atSec: 6.2, durSec: 0.2, note: 64.74, gain: 0.56 },
    { atSec: 6.4, durSec: 0.2, note: 67.17, gain: 0.56 },
    { atSec: 6.4, durSec: 0.9, note: 55.17, gain: 0.73 },
  ],
}

// The tune at its slowest: the tones that end its first four pairs, 1 6 2 5, each held with the one three keys above it and
// its octave, the gong under the last.
const KEMPYUNG: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.75, note: 60, gain: 0.64 },
    { atSec: 0, durSec: 1.75, note: 67.17, gain: 0.53 },
    { atSec: 0, durSec: 3.4, note: 48, gain: 0.5 },
    { atSec: 0.04, durSec: 1.71, note: 72, gain: 0.42 },
    { atSec: 1.75, durSec: 1.75, note: 57.55, gain: 0.64 },
    { atSec: 1.75, durSec: 1.75, note: 64.74, gain: 0.53 },
    { atSec: 1.79, durSec: 1.71, note: 69.55, gain: 0.42 },
    { atSec: 3.5, durSec: 1.75, note: 62.31, gain: 0.64 },
    { atSec: 3.5, durSec: 1.75, note: 69.55, gain: 0.53 },
    { atSec: 3.54, durSec: 1.71, note: 74.31, gain: 0.42 },
    { atSec: 5.25, durSec: 1.75, note: 55.17, gain: 0.64 },
    { atSec: 5.25, durSec: 1.75, note: 62.31, gain: 0.53 },
    { atSec: 5.25, durSec: 1.75, note: 43.17, gain: 0.56 },
    { atSec: 5.29, durSec: 1.71, note: 67.17, gain: 0.42 },
  ],
}

// The other tuning: 3 2 1 6, 2 1 6 5, falling by its narrow steps, two strokes to a tone.
const PELOG_TWOS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 51.75, gain: 0.78 },
    { atSec: 0, durSec: 2.4, note: 39.75, gain: 0.64 },
    { atSec: 0.4, durSec: 0.36, note: 71.58, gain: 0.42 },
    { atSec: 0.8, durSec: 0.36, note: 71.58, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 59.58, gain: 0.56 },
    { atSec: 1.2, durSec: 0.36, note: 70.2, gain: 0.42 },
    { atSec: 1.6, durSec: 0.36, note: 70.2, gain: 0.5 },
    { atSec: 1.6, durSec: 0.8, note: 58.2, gain: 0.5 },
    { atSec: 2, durSec: 0.36, note: 69, gain: 0.42 },
    { atSec: 2.4, durSec: 0.36, note: 69, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 57, gain: 0.59 },
    { atSec: 2.8, durSec: 0.36, note: 64.85, gain: 0.42 },
    { atSec: 3.2, durSec: 0.36, note: 64.85, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 52.85, gain: 0.76 },
    { atSec: 3.6, durSec: 0.36, note: 70.2, gain: 0.42 },
    { atSec: 4, durSec: 0.36, note: 70.2, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 58.2, gain: 0.56 },
    { atSec: 4.4, durSec: 0.36, note: 69, gain: 0.42 },
    { atSec: 4.8, durSec: 0.36, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 0.8, note: 57, gain: 0.5 },
    { atSec: 5.2, durSec: 0.36, note: 64.85, gain: 0.42 },
    { atSec: 5.6, durSec: 0.36, note: 64.85, gain: 0.42 },
    { atSec: 5.6, durSec: 0.8, note: 52.85, gain: 0.59 },
    { atSec: 6, durSec: 0.36, note: 63.75, gain: 0.42 },
    { atSec: 6.4, durSec: 0.36, note: 63.75, gain: 0.5 },
    { atSec: 6.4, durSec: 0.8, note: 51.75, gain: 0.76 },
    { atSec: 6.4, durSec: 0.9, note: 39.75, gain: 0.64 },
  ],
}

// The second half of that tune at half the pace, 2 1 6 5, eight strokes to a tone.
const PELOG_EIGHTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.552, note: 51.75, gain: 0.78 },
    { atSec: 0, durSec: 3, note: 39.75, gain: 0.62 },
    { atSec: 0.2, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 0.4, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 0.6, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 0.8, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 1, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 1.2, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 1.4, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 1.6, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 1.6, durSec: 1.552, note: 58.2, gain: 0.56 },
    { atSec: 1.8, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 2, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 2.2, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 2.4, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 2.6, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 2.8, durSec: 0.18, note: 70.2, gain: 0.42 },
    { atSec: 3, durSec: 0.18, note: 69, gain: 0.42 },
    { atSec: 3.2, durSec: 0.18, note: 69, gain: 0.5 },
    { atSec: 3.2, durSec: 1.552, note: 57, gain: 0.5 },
    { atSec: 3.4, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 3.6, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 3.8, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 4, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 4.2, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 4.4, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 4.6, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 4.8, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 4.8, durSec: 1.552, note: 52.85, gain: 0.59 },
    { atSec: 5, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 5.2, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 5.4, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 5.6, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 5.8, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 6, durSec: 0.18, note: 64.85, gain: 0.42 },
    { atSec: 6.2, durSec: 0.18, note: 63.75, gain: 0.42 },
    { atSec: 6.4, durSec: 0.18, note: 63.75, gain: 0.5 },
    { atSec: 6.4, durSec: 0.9, note: 39.75, gain: 0.62 },
    { atSec: 6.4, durSec: 0.9, note: 51.75, gain: 0.76 },
  ],
}

// That tune by itself, no strokes between, the gong under its first tone and its last.
const PELOG_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 51.75, gain: 0.86 },
    { atSec: 0, durSec: 3, note: 39.75, gain: 0.7 },
    { atSec: 0.8, durSec: 0.8, note: 59.58, gain: 0.62 },
    { atSec: 1.6, durSec: 0.8, note: 58.2, gain: 0.55 },
    { atSec: 2.4, durSec: 0.8, note: 57, gain: 0.65 },
    { atSec: 3.2, durSec: 0.8, note: 52.85, gain: 0.83 },
    { atSec: 4, durSec: 0.8, note: 58.2, gain: 0.62 },
    { atSec: 4.8, durSec: 0.8, note: 57, gain: 0.55 },
    { atSec: 5.6, durSec: 0.8, note: 52.85, gain: 0.65 },
    { atSec: 6.4, durSec: 0.8, note: 51.75, gain: 0.83 },
    { atSec: 6.4, durSec: 0.9, note: 39.75, gain: 0.7 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Twin bars: the tune and its doubling in paired bars, each tone with its own slow wave.
  {
    id: 'slower-and-fuller-slab-under-the-tune',
    name: 'Slab under the tune',
    category: 'bell',
    description:
      'Long metal bars that beat just over once a second, struck softly, stopped on release and warmed, in a dark six-second hall.',
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { beat: 1.2, damp: 0.5, mallet: 0.15, tone: 0.2, decay: 16 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { lowDecay: 6, midDecay: 4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slower-and-fuller-twice-before-it-lands',
    name: 'Twice before it lands',
    category: 'keys',
    description:
      'Damped metal bars with a beat of seven, and one tape echo a tenth of a second behind that answers between the strokes.',
    preview: TWOS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: { decay: 1.2, damp: 0.8, mallet: 0.7, volume: -3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 100, feedback: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'slower-and-fuller-fours-in-teak',
    name: 'Fours in teak',
    category: 'keys',
    description:
      "Short wooden bars with a beat of four through an amplifier's speaker in a room, then levelled by a limiter.",
    preview: FOURS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood flutter',
      params: { beat: 4, decay: 1.2, mallet: 0.5, damp: 0.3 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.1, noise: 0, room: 0.5 },
      },
      {
        deviceId: 'fet-limiter',
        preset: 'Gentle lift',
        params: { inputGain: 20, outputGain: -7 },
      },
    ],
  },
  {
    id: 'slower-and-fuller-eighth-of-a-slow-tone',
    name: 'Eighth of a slow tone',
    category: 'bell',
    description:
      'Damped glass bars whose lows and highs are echoed apart, low first, under a faint late sheen of plate.',
    preview: EIGHTS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Damped glass',
      params: { decay: 0.9, tone: 0.5, beat: 3, volume: -1 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 400, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'slower-and-fuller-sixteen-quick-tongues',
    name: 'Sixteen quick tongues',
    category: 'keys',
    description:
      'Hard wooden knocks with a fast beat, one bar an ear, heard from across a room with the top drawn wide.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood knock',
      params: { decay: 0.4, beat: 12, tone: 0.9, mallet: 0.9, ears: 1, volume: 2.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room' },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'slower-and-fuller-gong-in-two-halves',
    name: 'Gong in two halves',
    category: 'bell',
    description:
      'Dark metal rung twenty seconds, one bar an ear, with an octave added below it and a long dark plate.',
    preview: GONGS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { beat: 0.6, decay: 20, damp: 0, tone: 0.1, ears: 1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { decay: 0.85, mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-wave-between-two-bars',
    name: 'Wave between two bars',
    category: 'bell',
    description:
      'Metal bars a little over two hertz apart, each band of their sound swelling on its own slow tremolo in a faint hall.',
    preview: PELOG_TWOS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Three, short',
      params: { beat: 2.2, decay: 5, damp: 0.15, mallet: 0.45, tone: 0.6 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slower-and-fuller-tune-at-half-pace',
    name: 'Tune at half pace',
    category: 'pad',
    description:
      'Glass bars beating once in two seconds, their strike taken off by a half-second swell before a cathedral.',
    preview: KEMPYUNG,
    instrument: { deviceId: 'twin-bars', preset: 'Slow sway', params: { decay: 18, mallet: 0.2 } },
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 500 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slower-and-fuller-lamp-oil-bronze',
    name: 'Lamp oil bronze',
    category: 'bell',
    description:
      'Metal bars struck in pairs fifteen milliseconds apart, drifted by a chorus and blurred at the attack.',
    preview: EIGHTS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: { scatter: 15, decay: 5, damp: 0.2, tone: 0.35, volume: -0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fog', preset: 'Short blur' },
    ],
  },
  {
    id: 'slower-and-fuller-carved-frame-knocks',
    name: 'Carved frame knocks',
    category: 'keys',
    description:
      'Two wooden bars that land thirty milliseconds apart, sounded inside a large wooden body.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { scatter: 30, decay: 1, tone: 0.3, volume: 1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.5, mix: 0.7 } }],
  },
  {
    id: 'slower-and-fuller-a-steady-hand-above',
    name: 'A steady hand above',
    category: 'keys',
    description:
      'Bright glass bars cut short on release, with a soft slapback, then thinned from below and above.',
    preview: FOURS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { decay: 1.5, damp: 0.7, tone: 0.8, beat: 8, volume: 0.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'slower-and-fuller-rattan-grip',
    name: 'Rattan grip',
    category: 'keys',
    description:
      'Soft wooden bars with a beat of two on saturated cassette tape, and a hint of spring after it.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Two, soft wood',
      params: { decay: 1.4, mallet: 0.35, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'slower-and-fuller-tone-outlasts-its-row',
    name: 'Tone outlasts its row',
    category: 'bell',
    description:
      'Undamped metal bars with a beat of six, backwards swells of what was played rising behind, the ringing top held down.',
    preview: SLOWING,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Six, one an ear',
      params: { decay: 12, damp: 0 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } },
      { deviceId: 'tamer', preset: 'Bright tail' },
    ],
  },
  {
    id: 'slower-and-fuller-glass-over-the-gong',
    name: 'Glass over the gong',
    category: 'bell',
    description:
      'Glass bars with a beat of two, stopped on release, over a table of bowls tuned from A that ring when their tone is played.',
    preview: PELOG_EIGHTS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: { damp: 0.5, beat: 2, decay: 8, mallet: 0.5, tone: 0.7, volume: -6.5 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Pelog gongs', params: { root: 9, mix: 0.45 } }],
  },
  {
    id: 'slower-and-fuller-half-tempo-hum',
    name: 'Half tempo hum',
    category: 'drone',
    description:
      'Softly hummed wooden bars caught and held as a dark pad that glides from chord to chord.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { decay: 5, tone: 0.1, volume: -3.5 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.8, mix: 0.7 } }],
  },
  {
    id: 'slower-and-fuller-grain-of-the-sixteenth',
    name: 'Grain of the sixteenth',
    category: 'keys',
    description:
      'Metal bars beating twenty times a second, opened by a low-pass that follows each stroke, then lightly driven.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twenty, rough',
      params: { volume: -4.5, decay: 0.9, damp: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 900, resonance: 1.5, envAmount: 45, envReleaseMs: 160 },
      },
      { deviceId: 'saturator', preset: 'Warm glue' },
    ],
  },
  {
    id: 'slower-and-fuller-first-gong-of-the-day',
    name: 'First gong of the day',
    category: 'drone',
    description:
      'Metal bars that beat once in two seconds, half their sound replayed an octave down at half speed in a large space.',
    preview: GONGS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Half a hertz',
      params: { mallet: 0.3, tone: 0.2, decay: 20 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, mix: 0.35 } },
    ],
  },
  // Handpan: the tune in the hands, the pairs and the interlocking parts in palms and knuckles.
  {
    id: 'slower-and-fuller-pan-takes-the-tune',
    name: 'Pan takes the tune',
    category: 'keys',
    description:
      'A soft-handed pan with a longer ring, warmed below and set in a hall of three seconds.',
    preview: PELOG_ALONE,
    instrument: { deviceId: 'handpan', preset: 'Soft hands', params: { decay: 5, sympathy: 0.7 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-palm-on-second-strokes',
    name: 'Palm on second strokes',
    category: 'keys',
    description:
      'A pan struck with the palm left on it, short and dull, with a dark spring behind.',
    preview: PELOG_TWOS,
    instrument: { deviceId: 'handpan', preset: 'Palm mute', params: { decay: 1.2, touch: 0.35 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25 } }],
  },
  {
    id: 'slower-and-fuller-fours-on-the-rim',
    name: 'Fours on the rim',
    category: 'keys',
    description:
      'A pan struck at the edge and damped, mostly overtone, doubled twenty cents to each side with the lows and the top cut.',
    preview: FOURS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { decay: 1.4, damp: 0.7, volume: -4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 180 } },
    ],
  },
  {
    id: 'slower-and-fuller-tongues-answer-in-fours',
    name: 'Tongues answer in fours',
    category: 'keys',
    description: 'A bright tongue drum with a quieter octave above it, on a small plate.',
    preview: FOURS,
    instrument: { deviceId: 'handpan', preset: 'Bright tongue', params: { decay: 2, damp: 0.4 } },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'slower-and-fuller-eight-to-the-thumb',
    name: 'Eight to the thumb',
    category: 'keys',
    description: "Short taps near the pan's edge, each scattering close echoes from side to side.",
    preview: PELOG_EIGHTS,
    instrument: { deviceId: 'handpan', preset: 'Rain taps', params: { decay: 0.8, damp: 0.5 } },
    effects: [{ deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.4 } }],
  },
  {
    id: 'slower-and-fuller-sixteen-on-the-slit',
    name: 'Sixteen on the slit',
    category: 'drum',
    description:
      'A short slit drum with less of its hollow, a few steps back in a room and lifted by a limiter.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Slit drum',
      params: { volume: 2, decay: 0.6, cavity: 0.35 },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'slower-and-fuller-ding-stands-for-the-gong',
    name: 'Ding stands for the gong',
    category: 'bass',
    description: "The pan's low note rung long, an octave below added in the lows, in a dark cave.",
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 9, touch: 0.15, cavity: 0.7 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-hands-that-interlock',
    name: 'Hands that interlock',
    category: 'keys',
    description:
      'A plain steel pan with no hollow and no shimmer, and steady tape echoes two strokes late.',
    preview: IMBAL,
    instrument: { deviceId: 'handpan', preset: 'Clean steel', params: { decay: 1.4 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 400, feedback: 0.35, mix: 0.3 },
      },
    ],
  },
  {
    id: 'slower-and-fuller-knuckle-and-palm-in-turn',
    name: 'Knuckle and palm in turn',
    category: 'keys',
    description: 'Knuckles on a damped pan, taken by a microphone out in the room.',
    preview: IMBAL,
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { decay: 1, damp: 0.8, volume: 0 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.5 } }],
  },
  {
    id: 'slower-and-fuller-halo-at-the-half-tempo',
    name: 'Halo at the half tempo',
    category: 'pad',
    description:
      'A pan rung ten seconds with all its sympathy, its strikes faded in over a third of a second into a plain hall.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'handpan',
      preset: 'Halo',
      params: { volume: -2, decay: 10, sympathy: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-slack-water-steel',
    name: 'Slack water steel',
    category: 'texture',
    description:
      'A shimmering pan whose bands swell and drift to the sides on slow cycles, on a long plate.',
    preview: SLOWING,
    instrument: { deviceId: 'handpan', preset: 'Slow shimmer', params: { decay: 8 } },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-tank-behind-the-kitchen',
    name: 'Tank behind the kitchen',
    category: 'keys',
    description: 'A tank drum cut to a few seconds, half of it sounded inside a big metal kettle.',
    preview: IMBAL,
    instrument: { deviceId: 'handpan', preset: 'Tank drum', params: { decay: 2.5 } },
    effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.5 } }],
  },
  {
    id: 'slower-and-fuller-pure-tone-full-breath',
    name: 'Pure tone, full breath',
    category: 'pad',
    description:
      'A tongue drum with nothing but its tone, breathing in level through a three-voice ensemble.',
    preview: KEMPYUNG,
    instrument: { deviceId: 'handpan', preset: 'Pure tongue', params: { decay: 10, volume: -1 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'slower-and-fuller-told-before-it-comes',
    name: 'Told before it comes',
    category: 'keys',
    description:
      'A pan struck at the centre of its note, on reel tape with its wear, in a tight chamber.',
    preview: TWOS,
    instrument: { deviceId: 'handpan', preset: 'Centre tone', params: { decay: 2.5, damp: 0.3 } },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'slower-and-fuller-rain-on-the-pavilion',
    name: 'Rain on the pavilion',
    category: 'texture',
    description: 'Hard-struck bright steel left out under light rain, with the rain tapping on it.',
    preview: EIGHTS,
    instrument: { deviceId: 'handpan', preset: 'Bright bloom', params: { decay: 2, touch: 0.8 } },
    effects: [{ deviceId: 'weather', preset: 'Light rain', params: { mix: 0.8 } }],
  },
  {
    id: 'slower-and-fuller-two-rows-of-pots',
    name: 'Two rows of pots',
    category: 'keys',
    description:
      'A tongue drum with a short ring and its overtones pulled off pitch, turned slowly by a phaser in a tight room.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 1.4, shimmer: 0.7, volume: 2 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'slower-and-fuller-gong-nobody-damps',
    name: 'Gong nobody damps',
    category: 'drone',
    description:
      "A tongue drum's pure tone caught and held without end underneath itself, with the lows raised.",
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { touch: 0.2, cavity: 0.6, volume: -11.5 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 1, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
    ],
  },
  // Glass: the held tones of the slowest tune, and its clear small strokes.
  {
    id: 'slower-and-fuller-glass-slab-tune-hand',
    name: 'Glass slab, tune hand',
    category: 'bell',
    description:
      'Glass chime bars with their top turned down, in a hall whose tail is all air and little low.',
    preview: ONE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { decay: 2.5, release: 2, brightness: 0.25 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } }],
  },
  {
    id: 'slower-and-fuller-clear-twos',
    name: 'Clear twos',
    category: 'keys',
    description: 'Short toy keys on a plainer ratio, doubled by a short delay on a small plate.',
    preview: TWOS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { decay: 0.5, release: 0.4, ratio: 7 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'slower-and-fuller-four-cold-taps',
    name: 'Four cold taps',
    category: 'keys',
    description: 'Dry glass pings into a dripping spring, with the lows and the air turned down.',
    preview: FOURS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { decay: 0.45, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'slower-and-fuller-eight-beads-to-the-tone',
    name: 'Eight beads to the tone',
    category: 'bell',
    description: 'Short ice chimes that throw a fine dust of higher sparks to both sides.',
    preview: EIGHTS,
    instrument: { deviceId: 'fm-glass', preset: 'Ice chimes', params: { decay: 0.5, release: 1 } },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'slower-and-fuller-sixteen-glass-pins',
    name: 'Sixteen glass pins',
    category: 'keys',
    description: 'Nearly pure sines cut to pin-pricks, each skipping on in a few soft bounces.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: { volume: -5, decay: 0.35, release: 0.5, brightness: 0.2 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { first: 150, mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-dark-disc-at-sixteen',
    name: 'Dark disc at sixteen',
    category: 'drone',
    description:
      'A dark glass gong rung fourteen seconds, its partials drifting by a fraction of a hertz in a vast nave.',
    preview: GONGS,
    instrument: { deviceId: 'fm-glass', preset: 'Dark gong', params: { decay: 14 } },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-held-tone-with-its-pair',
    name: 'Held tone with its pair',
    category: 'pad',
    description:
      'A crystal pad with a quicker start, loosely doubled, in a reverb whose input opens and closes in slow waves.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { attack: 0.4, brightness: 0.25, decay: 6, volume: -16 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-the-slowest-hour',
    name: 'The slowest hour',
    category: 'pad',
    description:
      'Slow glass that takes most of a second to speak, smeared by a dark spectral blur.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { attack: 0.9, release: 4, brightness: 0.2, volume: -20.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.6 } }],
  },
  {
    id: 'slower-and-fuller-wet-finger-on-the-rim',
    name: 'Wet finger on the rim',
    category: 'pad',
    description:
      'Rubbed glass that starts straight and then sways, with a faint oo in the hall behind it.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { volume: -16, attack: 0.25 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 30, wait: 300 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-bow-across-the-key',
    name: 'Bow across the key',
    category: 'pad',
    description:
      'Bowed metal with more feedback in it, glowing through a triode and swaying a little round the head.',
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { attack: 0.2, feedback: 0.4 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
    ],
  },
  {
    id: 'slower-and-fuller-reed-at-the-irama-change',
    name: 'Reed at the irama change',
    category: 'organ',
    description:
      'A glass organ with a slower start and wide detune, pipes with a breath in front following it, in a very slow flanger.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: {
        ratio: 5,
        brightness: 0.45,
        detune: 18,
        attack: 0.25,
        feedback: 0.35,
        spread: 1,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'stops', preset: 'Breath first', params: { mix: 0.5 } },
      { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-tines-told-in-fours',
    name: 'Tines told in fours',
    category: 'keys',
    description: 'Short tine keys that pan from side to side on worn cassette.',
    preview: FOURS,
    instrument: { deviceId: 'fm-glass', preset: 'Tine keys', params: { decay: 0.9 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side' },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'slower-and-fuller-warm-at-a-quarter-pace',
    name: 'Warm at a quarter pace',
    category: 'pad',
    description:
      'A warm wide glass pad, darker than its preset, swept very slowly and warmed by a faint fuzz in its reverb.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { brightness: 0.18, attack: 0.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep' },
      { deviceId: 'haze', preset: 'Faint warmth' },
    ],
  },
  {
    id: 'slower-and-fuller-bowl-before-the-gong',
    name: 'Bowl before the gong',
    category: 'bell',
    description:
      'A glass temple bowl whose tail sags a little in pitch as it ages, with the top shaded off.',
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { decay: 8, brightness: 0.5, volume: -14 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'slower-and-fuller-lights-at-the-change',
    name: 'Lights at the change',
    category: 'bell',
    description:
      'Glass bells on a whole ratio, with a small loop of what was just played an octave up beneath them.',
    preview: SLOWING,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { decay: 1.5, release: 2, ratio: 5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.76, mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-coarse-beads-of-pelog',
    name: 'Coarse beads of pelog',
    category: 'keys',
    description:
      "Chime bars cut short and brightened, through an early sampler's converters, close by.",
    preview: PELOG_EIGHTS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { decay: 0.7, release: 0.6, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'distance', preset: 'Close mic' },
    ],
  },
  // Zither: the plucked path to each tone, and the strings left open behind it.
  {
    id: 'slower-and-fuller-plucked-path-to-the-tone',
    name: 'Plucked path to the tone',
    category: 'plucked',
    description:
      'Single strings picked near the bridge on a koto body, with more of the open strings answering, on a bright plate.',
    preview: SITER,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 2, sympathy: 0.4, volume: -2.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } }],
  },
  {
    id: 'slower-and-fuller-thumb-damps-each-string',
    name: 'Thumb damps each string',
    category: 'plucked',
    description:
      'Finger-plucked strings stopped as they are let go, most of them through a small bedside speaker.',
    preview: SITER,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { exciter: 0, decay: 1.4, release: 0.08, brightness: 0.4, body: 1, volume: -3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0, mix: 0.6 } }],
  },
  {
    id: 'slower-and-fuller-two-strings-to-a-stroke',
    name: 'Two strings to a stroke',
    category: 'plucked',
    description:
      'Single tones on far-apart double courses, shortened, with a faint flanger in a room.',
    preview: FOURS,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 2.5, release: 0.6, chord: 0, courses: 0.9 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Faint air' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'slower-and-fuller-octave-thumb-and-nail',
    name: 'Octave thumb and nail',
    category: 'plucked',
    description:
      'Each stroke a picked octave opened by twenty-five milliseconds, with a plain echo behind and the top raised.',
    preview: TWOS,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { chord: 1, strum: 25, decay: 3, release: 0.5, position: 0.2 },
    },
    effects: [
      { deviceId: 'prism', preset: 'One plain echo', params: { time: 200, mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 4 } },
    ],
  },
  {
    id: 'slower-and-fuller-padded-stick-on-wire',
    name: 'Padded stick on wire',
    category: 'keys',
    description:
      'Felt-hammered single strings, short, with softened attacks, under the blanket of a dull cassette.',
    preview: EIGHTS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 1.5, release: 0.3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { size: 80, mix: 0.6 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'slower-and-fuller-sixteen-picked-dry',
    name: 'Sixteen picked dry',
    category: 'plucked',
    description:
      'Dry nasal single picks at the very bridge, held even by a limiter, near and wide.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { chord: 0, strum: 0, decay: 1.3, release: 0.15, position: 0.06, volume: -3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch', params: { inputGain: 18, outputGain: -6 } },
      { deviceId: 'distance', preset: 'Wide and near', params: { room: 0.1, decay: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-low-string-for-the-gong',
    name: 'Low string for the gong',
    category: 'plucked',
    description:
      'A finger-plucked octave with a lower one added under it, over strings that learn what is played and ring on.',
    preview: GONGS,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 1, strum: 60, decay: 14, brightness: 0.3, exciter: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone', params: { dry: 1, sub1: 0.5 } },
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-slow-fall-on-each-tone',
    name: 'Slow fall on each tone',
    category: 'plucked',
    description: 'Octaves falling slowly under the finger, deep in a chorus and a still room.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: { chord: 1, strum: 350, volume: -7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.3 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-felt-on-the-open-box',
    name: 'Felt on the open box',
    category: 'pad',
    description:
      'Felt hammers on octaves with every string open, most of the strike faded in, in a thin wide space.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { brightness: 0.12, decay: 10, volume: -9.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 300, depth: 0.8 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-trembled-into-the-gong',
    name: 'Trembled into the gong',
    category: 'plucked',
    description:
      'A hammered dulcimer rolled sixteen times a second under a harmonic tremolo, in a hall.',
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { decay: 4, release: 2, brightness: 0.45, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-nail-on-soft-wire',
    name: 'Nail on soft wire',
    category: 'plucked',
    description:
      'Harp strings picked near their middle, with dotted tape echoes that fill the gaps between the strokes.',
    preview: SITER,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { exciter: 1, decay: 5, release: 1.5, position: 0.45, brightness: 0.45, volume: -9 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 400, mix: 0.35 } }],
  },
  {
    id: 'slower-and-fuller-path-heard-backwards',
    name: 'Path heard backwards',
    category: 'texture',
    description:
      'Picked strings with the last second and a half of their line mirrored backwards behind them in a faint haze.',
    preview: SITER,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 0, decay: 3, release: 1, volume: -4.5 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Phrase and mirror', params: { time: 1600, mix: 0.5 } },
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
    ],
  },
  {
    id: 'slower-and-fuller-strings-hear-strings',
    name: 'Strings hear strings',
    category: 'plucked',
    description:
      'Bright picked courses at the middle of the string, all the open strings answering, far back on a plate with faint pipes.',
    preview: IMBAL,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { chord: 0, decay: 6, release: 3, sympathy: 1, volume: -5.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Nearly dry' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-pairs-on-a-hammered-box',
    name: 'Pairs on a hammered box',
    category: 'plucked',
    description:
      'Hammered dulcimer strings without the roll, drifting in bands in front of two springs.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 0, chord: 0, decay: 1.8, release: 0.6, volume: -3.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slower-and-fuller-wire-drone-for-the-tune',
    name: 'Wire drone for the tune',
    category: 'drone',
    description:
      'Single strings rolled six times a second, shadowed by sines that linger, with the quiet ends of the tails raised.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { chord: 0, roll: 6, decay: 14, brightness: 0.35 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.6 } },
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -28, amount: 0.8 } },
    ],
  },
  {
    id: 'slower-and-fuller-wire-in-a-clay-room',
    name: 'Wire in a clay room',
    category: 'plucked',
    description: 'Soft hammers on koto strings, heard from inside a clay pot.',
    preview: SLOWING,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 2, exciter: 2, brightness: 0.3, body: 3, volume: -0.5 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.8 } }],
  },
  // Bells: the bronze itself, gong and bowl and bar, one layer of the cycle to each.
  {
    id: 'slower-and-fuller-gong-on-the-sixteenth',
    name: 'Gong on the sixteenth',
    category: 'bell',
    description:
      'A softly struck dark gong of twenty-six seconds with its lows raised, in a hall whose bottom rings eight seconds.',
    preview: GONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 26, hardness: 0.15, position: 0.1, damping: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-pot-gongs-on-the-fours',
    name: 'Pot gongs on the fours',
    category: 'bell',
    description:
      'Bowls shortened and steadied to pot gongs, with a stopped metal pipe ringing round them on a dark plate.',
    preview: GONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { decay: 5, hardness: 0.4, damping: 0.6, position: 0.3, detune: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Metal drone', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-hung-gong-at-six-and-ten',
    name: 'Hung gong at six and ten',
    category: 'bell',
    description:
      'A muffled hung gong with a long dark trail of tape echoes, eight tenths of a second apart.',
    preview: GONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { decay: 10, brightness: 0.3, hardness: 0.35, material: 6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 800, mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-small-pot-on-odd-tones',
    name: 'Small pot on odd tones',
    category: 'bell',
    description: 'A bowl damped to a dry tock, set at the back of the hall.',
    preview: TWOS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { material: 1, decay: 0.6, damping: 0.9, hardness: 0.4, volume: -1.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { room: 0.6 } }],
  },
  {
    id: 'slower-and-fuller-slab-bronze-one-a-tone',
    name: 'Slab bronze, one a tone',
    category: 'bell',
    description: 'Metal bars struck off centre and damped on release, slightly widened in a hall.',
    preview: ONE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: {
        material: 3,
        decay: 4,
        damping: 0.45,
        hardness: 0.45,
        position: 0.4,
        release: 0.5,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slower-and-fuller-bar-leads-by-two',
    name: 'Bar leads by two',
    category: 'keys',
    description:
      'Damped wooden bars struck harder, with a tight long spring and a detuned copy in the middle.',
    preview: TWOS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { decay: 2, hardness: 0.75, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.25 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'slower-and-fuller-small-bars-run-ahead',
    name: 'Small bars run ahead',
    category: 'keys',
    description: 'Music-box bars cut under a second, fluttering on tape below a low-pass.',
    preview: FOURS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 0.9, damping: 0.55, hardness: 0.6, release: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'auto-filter', params: { cutoffHz: 3500 } },
    ],
  },
  {
    id: 'slower-and-fuller-glass-early-to-the-tone',
    name: 'Glass early to the tone',
    category: 'bell',
    description: 'Tapped glass stopped short, each note coming back in a soft cascade of octaves.',
    preview: EIGHTS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { decay: 0.7, damping: 0.5, release: 0.6, volume: -2.5 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Faint halo', params: { mix: 0.45 } }],
  },
  {
    id: 'slower-and-fuller-thumb-keys-at-sixteen',
    name: 'Thumb keys at sixteen',
    category: 'keys',
    description:
      'Short hard thumb tines, pushed forward in the middle, with the faint motion of slow rotors.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 0.8, hardness: 0.8, brightness: 0.7 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'slower-and-fuller-rubbed-bronze-unstruck',
    name: 'Rubbed bronze, unstruck',
    category: 'pad',
    description: 'Bowls rubbed on and on, with two copies that fly close by, in a dark hall.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { sustain: 1, brightness: 0.35, hardness: 0.1, volume: -14 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-keys-bowed-at-the-gong',
    name: 'Keys bowed at the gong',
    category: 'pad',
    description:
      'A rubbed gong with its modes drawn closer, drifting against a copy shifted by less than a hertz, on a long plate.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { stretch: 0.9, brightness: 0.25, volume: -14 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-stretched-gong-at-noon',
    name: 'Stretched gong at noon',
    category: 'bell',
    description:
      'A gong with its modes spread wide, its overtones brought slowly forward and its ringing held down.',
    preview: GONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { material: 6, decay: 18, stretch: 1.2, hardness: 0.4, damping: 0.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Slow bloom' },
      { deviceId: 'tamer', preset: 'Ringing tones' },
    ],
  },
  {
    id: 'slower-and-fuller-wave-of-the-metal-pair',
    name: 'Wave of the metal pair',
    category: 'bell',
    description:
      'Bowls whose modes beat six times a second, shimmering from the middle outward in a short ambience.',
    preview: PELOG_TWOS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { detune: 6, decay: 6, hardness: 0.5, brightness: 0.65 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rings outward', params: { mix: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'slower-and-fuller-hard-mallet-pairs-told',
    name: 'Hard mallet, pairs told',
    category: 'bell',
    description:
      'Vibraphone bars hit hard and damped, gated in a faint ripple, with faint scattered echoes.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 1.5, hardness: 0.7, position: 0.2, release: 0.8, damping: 0.35, volume: 5 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Faint ripple' },
      { deviceId: 'constellation', preset: 'Faint points' },
    ],
  },
  {
    id: 'slower-and-fuller-change-of-pace-in-bronze',
    name: 'Change of pace in bronze',
    category: 'bell',
    description:
      'A dark bowl struck a little harder and cut to four seconds, a third of it an octave down with its partials stretched, in a cathedral.',
    preview: SLOWING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -6, release: 0.4, decay: 4, hardness: 0.35, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Sunken gong', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
  },
  // Mallets: wooden and metal bars for the elaborating hands.
  {
    id: 'slower-and-fuller-wandering-wood',
    name: 'Wandering wood',
    category: 'keys',
    description: 'A marimba with firmer mallets and a short bar, in a tight room.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.5, decay: 0.6, damper: 0.3, volume: -4.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } }],
  },
  {
    id: 'slower-and-fuller-wood-in-the-half-tempo',
    name: 'Wood in the half tempo',
    category: 'keys',
    description:
      'A humming marimba with a shorter ring, its attacks blurred into mist and tipped a few cents to each side.',
    preview: EIGHTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { decay: 1.5, mallet: 0.1, volume: -7.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.6 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'slower-and-fuller-dry-run-to-the-seleh',
    name: 'Dry run to the seleh',
    category: 'keys',
    description: 'A dry damped xylophone through a pushed console, heard down a stone stairwell.',
    preview: SIXTEENS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.65, damper: 0.4, volume: -3.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'slower-and-fuller-rolled-while-it-waits',
    name: 'Rolled while it waits',
    category: 'keys',
    description:
      'A marimba rolled ten times a second, opening and closing like a slow breath in a dark hall.',
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 10, mallet: 0.3 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Long slow sigh', params: { depth: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-bars-for-the-bronze-hand',
    name: 'Bars for the bronze hand',
    category: 'bell',
    description:
      'Still vibraphone bars with more mallet, high pipes faintly following them, on a plate.',
    preview: ONE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.5, decay: 2.2, damper: 0.2 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Glass on top', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slower-and-fuller-motor-at-the-gongs-pace',
    name: "Motor at the gong's pace",
    category: 'bell',
    description:
      'Vibraphone bars pulsed by a slow motor, their attack eased in, with a faint glimmer rising in the tail.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1.5, decay: 3.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 120, depth: 0.9 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-celesta-fills-the-fours',
    name: 'Celesta fills the fours',
    category: 'keys',
    description: 'A damped celesta with short soft tape echoes, one stroke behind.',
    preview: FOURS,
    instrument: { deviceId: 'mallets', preset: 'Celesta', params: { damper: 0.9, mallet: 0.45 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 200, mix: 0.3 } }],
  },
  {
    id: 'slower-and-fuller-trembling-celesta-pair',
    name: 'Trembling celesta pair',
    category: 'keys',
    description:
      'A soft celesta throbbing three times a second under a very slow low-pass, then drawn fourteen cents to each side.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { motorRate: 3, motor: 1, damper: 0.1, decay: 2, mallet: 0.2 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { mix: 0.7 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'slower-and-fuller-little-bars-above-all',
    name: 'Little bars above all',
    category: 'bell',
    description: 'A glockenspiel with a softer mallet, damped short, on worn cassette.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.45, decay: 0.5, damper: 0.5 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1, drive: 0.5 } }],
  },
  {
    id: 'slower-and-fuller-bars-with-tubes-beneath',
    name: 'Bars with tubes beneath',
    category: 'bell',
    description:
      'Small bars over full resonators, with a half-speed octave below them, dulled as if far off.',
    preview: SITER,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { decay: 1.2, mallet: 0.3 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'slower-and-fuller-night-watch-xylophone',
    name: 'Night watch xylophone',
    category: 'keys',
    description: 'A warm xylophone shortened, just under water, with a late sheen of plate.',
    preview: IMBAL,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { decay: 1.5, mallet: 0.25 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'slower-and-fuller-roll-that-thickens',
    name: 'Roll that thickens',
    category: 'texture',
    description: 'A soft xylophone roll smeared into a slow cloud of grains and spread wide.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { roll: 12, mallet: 0.15, damper: 0.2 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'slower-and-fuller-two-octaves-two-hands',
    name: 'Two octaves, two hands',
    category: 'keys',
    description: 'Firm marimba bars with an octave added above and below, over one slack spring.',
    preview: PIPILAN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { resonator: 0.5, decay: 0.8, mallet: 0.6 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octaves both', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slower-and-fuller-damped-vibes-quick-hand',
    name: 'Damped vibes, quick hand',
    category: 'bell',
    description:
      'Damped vibraphone bars with their hammers softened, leaving a faint trace in loops of unequal length.',
    preview: PELOG_EIGHTS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { damper: 0.8, decay: 0.7, motor: 0.3, mallet: 0.6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers' },
      { deviceId: 'orbits', preset: 'Faint trace', params: { length: 1.6 } },
    ],
  },
  // Ice: the gongs and the glassy strokes heard across a frozen lake.
  {
    id: 'slower-and-fuller-gong-across-the-ice',
    name: 'Gong across the ice',
    category: 'bell',
    description:
      'A deep floe rung eighteen seconds with no cracking, an octave added below, far down a hall.',
    preview: GONGS,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { ring: 18, crack: 0.1, cracks: 0, bright: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'slower-and-fuller-frozen-row-in-fours',
    name: 'Frozen row in fours',
    category: 'bell',
    description: 'Near, short pings of ice with little crack, shaded by a phaser on a small plate.',
    preview: FOURS,
    instrument: {
      deviceId: 'ice',
      preset: 'Near ping',
      params: { ring: 1.2, crack: 0.25, stretch: 0.1, volume: 5.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'slower-and-fuller-tune-on-thick-ice',
    name: 'Tune on thick ice',
    category: 'bell',
    description:
      'Thick dark ice rung seven seconds, half of each strike faded in, with a slowly drifting chorus.',
    preview: PELOG_ALONE,
    instrument: {
      deviceId: 'ice',
      preset: 'Thick ice',
      params: { ring: 7, cracks: 0, shore: 0.1, volume: -1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 200 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slower-and-fuller-thin-ice-at-eight',
    name: 'Thin ice at eight',
    category: 'keys',
    description:
      'Thin ice cut short with no cracking of its own, and thin tape echoes that fade off the beat.',
    preview: EIGHTS,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { ring: 0.7, cracks: 0, crack: 0.3, volume: 0 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 300, mix: 0.3 } },
    ],
  },
  {
    id: 'slower-and-fuller-slow-thaw-slow-tune',
    name: 'Slow thaw, slow tune',
    category: 'texture',
    description:
      'Slowly thawing ice brought nearer, its tail clouded by detuned grains and warmed.',
    preview: KEMPYUNG,
    instrument: { deviceId: 'ice', preset: 'Slow thaw', params: { ring: 12, distance: 0.3 } },
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Detune cloud', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
]
