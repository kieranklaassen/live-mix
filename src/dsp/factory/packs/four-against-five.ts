import { type FactoryPreset, type Phrase } from '../types'

// Two layers of a loop, one in bars of four pulses and one in bars of five, level again after twenty.
// Laid out on six instruments, each with a layer for the fours (dark, to the left, soon gone) and one
// for the fives (bright, to the right, left ringing), and with gates, rolls, rain and echoes that run
// at four against five themselves. A pulse is three tenths of a second in most of the phrases.

// Twenty pulses: D A F in fours five times, D C A in fives four times (they share one A, on pulse 13 and a half), and both home together on the twentieth.
const TWENTY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 62, gain: 0.62 },
    { atSec: 0, durSec: 0.55, note: 74, gain: 0.6 },
    { atSec: 0.45, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 0.6, durSec: 0.4, note: 72, gain: 0.4 },
    { atSec: 0.9, durSec: 0.27, note: 65, gain: 0.42 },
    { atSec: 1.05, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 1.2, durSec: 0.4, note: 62, gain: 0.62 },
    { atSec: 1.5, durSec: 0.55, note: 74, gain: 0.6 },
    { atSec: 1.65, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 2.1, durSec: 0.27, note: 65, gain: 0.42 },
    { atSec: 2.1, durSec: 0.4, note: 72, gain: 0.4 },
    { atSec: 2.4, durSec: 0.4, note: 62, gain: 0.62 },
    { atSec: 2.55, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 2.85, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 3, durSec: 0.55, note: 74, gain: 0.6 },
    { atSec: 3.3, durSec: 0.27, note: 65, gain: 0.42 },
    { atSec: 3.6, durSec: 0.4, note: 62, gain: 0.62 },
    { atSec: 3.6, durSec: 0.4, note: 72, gain: 0.4 },
    { atSec: 4.05, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 4.5, durSec: 0.27, note: 65, gain: 0.42 },
    { atSec: 4.5, durSec: 0.55, note: 74, gain: 0.6 },
    { atSec: 4.8, durSec: 0.4, note: 62, gain: 0.62 },
    { atSec: 5.1, durSec: 0.4, note: 72, gain: 0.4 },
    { atSec: 5.25, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 5.55, durSec: 0.28, note: 69, gain: 0.4 },
    { atSec: 5.7, durSec: 0.27, note: 65, gain: 0.42 },
    { atSec: 6, durSec: 1.3, note: 62, gain: 0.6 },
    { atSec: 6, durSec: 1.3, note: 74, gain: 0.6 },
  ],
}

// The fours in full, low: D A F. Of the fives only the first pulse of each bar, high and faint.
const FOURS_FORWARD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.42, note: 50, gain: 0.65 },
    { atSec: 0, durSec: 0.8, note: 74, gain: 0.3 },
    { atSec: 0.45, durSec: 0.42, note: 57, gain: 0.5 },
    { atSec: 0.9, durSec: 0.28, note: 53, gain: 0.5 },
    { atSec: 1.2, durSec: 0.42, note: 50, gain: 0.65 },
    { atSec: 1.5, durSec: 0.8, note: 72, gain: 0.3 },
    { atSec: 1.65, durSec: 0.42, note: 57, gain: 0.5 },
    { atSec: 2.1, durSec: 0.28, note: 53, gain: 0.5 },
    { atSec: 2.4, durSec: 0.42, note: 50, gain: 0.65 },
    { atSec: 2.85, durSec: 0.42, note: 57, gain: 0.5 },
    { atSec: 3, durSec: 0.8, note: 74, gain: 0.3 },
    { atSec: 3.3, durSec: 0.28, note: 53, gain: 0.5 },
    { atSec: 3.6, durSec: 0.42, note: 50, gain: 0.65 },
    { atSec: 4.05, durSec: 0.42, note: 57, gain: 0.5 },
    { atSec: 4.5, durSec: 0.28, note: 53, gain: 0.5 },
    { atSec: 4.5, durSec: 0.8, note: 72, gain: 0.3 },
    { atSec: 4.8, durSec: 0.42, note: 50, gain: 0.65 },
    { atSec: 5.25, durSec: 0.42, note: 57, gain: 0.5 },
    { atSec: 5.7, durSec: 0.28, note: 53, gain: 0.5 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.65 },
    { atSec: 6, durSec: 1.3, note: 74, gain: 0.3 },
  ],
}

// The fives in full, above: D C A. Of the fours only each bar line, one low note: D A F G A, and D again where they meet.
const FIVES_FORWARD: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 50, gain: 0.34 },
    { atSec: 0, durSec: 0.42, note: 74, gain: 0.65 },
    { atSec: 0.6, durSec: 0.42, note: 72, gain: 0.48 },
    { atSec: 1.05, durSec: 0.42, note: 69, gain: 0.48 },
    { atSec: 1.2, durSec: 0.9, note: 57, gain: 0.34 },
    { atSec: 1.5, durSec: 0.42, note: 74, gain: 0.65 },
    { atSec: 2.1, durSec: 0.42, note: 72, gain: 0.48 },
    { atSec: 2.4, durSec: 0.9, note: 53, gain: 0.34 },
    { atSec: 2.55, durSec: 0.42, note: 69, gain: 0.48 },
    { atSec: 3, durSec: 0.42, note: 74, gain: 0.65 },
    { atSec: 3.6, durSec: 0.9, note: 55, gain: 0.34 },
    { atSec: 3.6, durSec: 0.42, note: 72, gain: 0.48 },
    { atSec: 4.05, durSec: 0.42, note: 69, gain: 0.48 },
    { atSec: 4.5, durSec: 0.42, note: 74, gain: 0.65 },
    { atSec: 4.8, durSec: 0.9, note: 57, gain: 0.34 },
    { atSec: 5.1, durSec: 0.42, note: 72, gain: 0.48 },
    { atSec: 5.55, durSec: 0.42, note: 69, gain: 0.48 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.34 },
    { atSec: 6, durSec: 1.3, note: 74, gain: 0.62 },
  ],
}

// Four equal notes against five in one bar, meeting on each bar line: D minor seventh over A, then G with its sixth passing, then D minor seventh with no third.
const BAR_OF_BOTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.55, note: 77, gain: 0.6 },
    { atSec: 0, durSec: 0.7, note: 57, gain: 0.58 },
    { atSec: 0.6, durSec: 0.55, note: 76, gain: 0.42 },
    { atSec: 0.75, durSec: 0.7, note: 62, gain: 0.42 },
    { atSec: 1.2, durSec: 0.55, note: 72, gain: 0.42 },
    { atSec: 1.5, durSec: 0.7, note: 65, gain: 0.42 },
    { atSec: 1.8, durSec: 0.55, note: 69, gain: 0.42 },
    { atSec: 2.25, durSec: 0.7, note: 62, gain: 0.42 },
    { atSec: 2.4, durSec: 0.55, note: 72, gain: 0.42 },
    { atSec: 3, durSec: 0.55, note: 71, gain: 0.6 },
    { atSec: 3, durSec: 0.7, note: 55, gain: 0.58 },
    { atSec: 3.6, durSec: 0.55, note: 74, gain: 0.42 },
    { atSec: 3.75, durSec: 0.7, note: 59, gain: 0.42 },
    { atSec: 4.2, durSec: 0.55, note: 76, gain: 0.42 },
    { atSec: 4.5, durSec: 0.7, note: 62, gain: 0.42 },
    { atSec: 4.8, durSec: 0.55, note: 74, gain: 0.42 },
    { atSec: 5.25, durSec: 0.7, note: 59, gain: 0.42 },
    { atSec: 5.4, durSec: 0.55, note: 71, gain: 0.42 },
    { atSec: 6, durSec: 1.35, note: 62, gain: 0.55 },
    { atSec: 6, durSec: 1.35, note: 69, gain: 0.4 },
    { atSec: 6, durSec: 1.35, note: 72, gain: 0.55 },
  ],
}

// A round of four notes under a round of five, one of each a pulse, all from one pentatonic: in twenty pulses every pairing is heard once, and the first comes back.
const EVERY_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.28, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 0.28, note: 67, gain: 0.5 },
    { atSec: 0.32, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 0.32, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 0.64, durSec: 0.28, note: 62, gain: 0.34 },
    { atSec: 0.64, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 0.96, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 0.96, durSec: 0.28, note: 74, gain: 0.34 },
    { atSec: 1.28, durSec: 0.28, note: 57, gain: 0.5 },
    { atSec: 1.28, durSec: 0.28, note: 76, gain: 0.34 },
    { atSec: 1.6, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 1.6, durSec: 0.28, note: 67, gain: 0.5 },
    { atSec: 1.92, durSec: 0.28, note: 62, gain: 0.34 },
    { atSec: 1.92, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 2.24, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 2.24, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 2.56, durSec: 0.28, note: 57, gain: 0.5 },
    { atSec: 2.56, durSec: 0.28, note: 74, gain: 0.34 },
    { atSec: 2.88, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 2.88, durSec: 0.28, note: 76, gain: 0.34 },
    { atSec: 3.2, durSec: 0.28, note: 62, gain: 0.34 },
    { atSec: 3.2, durSec: 0.28, note: 67, gain: 0.5 },
    { atSec: 3.52, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 3.52, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 3.84, durSec: 0.28, note: 57, gain: 0.5 },
    { atSec: 3.84, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 4.16, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 4.16, durSec: 0.28, note: 74, gain: 0.34 },
    { atSec: 4.48, durSec: 0.28, note: 62, gain: 0.34 },
    { atSec: 4.48, durSec: 0.28, note: 76, gain: 0.34 },
    { atSec: 4.8, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 4.8, durSec: 0.28, note: 67, gain: 0.5 },
    { atSec: 5.12, durSec: 0.28, note: 57, gain: 0.5 },
    { atSec: 5.12, durSec: 0.28, note: 69, gain: 0.34 },
    { atSec: 5.44, durSec: 0.28, note: 60, gain: 0.34 },
    { atSec: 5.44, durSec: 0.28, note: 72, gain: 0.34 },
    { atSec: 5.76, durSec: 0.28, note: 62, gain: 0.34 },
    { atSec: 5.76, durSec: 0.28, note: 74, gain: 0.34 },
    { atSec: 6.08, durSec: 0.28, note: 64, gain: 0.34 },
    { atSec: 6.08, durSec: 0.28, note: 76, gain: 0.34 },
    { atSec: 6.4, durSec: 0.9, note: 57, gain: 0.5 },
    { atSec: 6.4, durSec: 0.9, note: 67, gain: 0.5 },
  ],
}

// Only the bar lines: a low note every four pulses, a high one every five, together on the first and on the twentieth (D A C F E under D E C A, and home to D from both sides).
const DOWNBEATS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 62, gain: 0.6 },
    { atSec: 0, durSec: 0.6, note: 74, gain: 0.5 },
    { atSec: 1.2, durSec: 0.6, note: 57, gain: 0.6 },
    { atSec: 1.5, durSec: 0.6, note: 76, gain: 0.5 },
    { atSec: 2.4, durSec: 0.6, note: 60, gain: 0.6 },
    { atSec: 3, durSec: 0.6, note: 72, gain: 0.5 },
    { atSec: 3.6, durSec: 0.6, note: 65, gain: 0.6 },
    { atSec: 4.5, durSec: 0.6, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 0.6, note: 64, gain: 0.6 },
    { atSec: 6, durSec: 1, note: 62, gain: 0.6 },
    { atSec: 6, durSec: 1, note: 74, gain: 0.5 },
  ],
}

// The bar lines again, for low and slow metal: D A F C F in fours under D E C A in fives.
const LOW_DOWNBEATS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 50, gain: 0.55 },
    { atSec: 0, durSec: 1.4, note: 62, gain: 0.45 },
    { atSec: 1.2, durSec: 1.1, note: 57, gain: 0.55 },
    { atSec: 1.5, durSec: 1.4, note: 64, gain: 0.45 },
    { atSec: 2.4, durSec: 1.1, note: 53, gain: 0.55 },
    { atSec: 3, durSec: 1.4, note: 60, gain: 0.45 },
    { atSec: 3.6, durSec: 1.1, note: 48, gain: 0.55 },
    { atSec: 4.5, durSec: 1.4, note: 57, gain: 0.45 },
    { atSec: 4.8, durSec: 1.1, note: 53, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 62, gain: 0.45 },
  ],
}

// Two held pairs, the lower moving every four pulses and the upper every five, home together on the twentieth: D minor, A minor over C, F major seventh, B half diminished over F, C with its seventh and ninth, C, F major seventh, D minor.
const HELD_PAIRS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.17, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 1.17, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.47, note: 65, gain: 0.45 },
    { atSec: 0, durSec: 1.47, note: 74, gain: 0.45 },
    { atSec: 1.2, durSec: 1.17, note: 48, gain: 0.5 },
    { atSec: 1.2, durSec: 1.17, note: 57, gain: 0.5 },
    { atSec: 1.5, durSec: 1.47, note: 64, gain: 0.45 },
    { atSec: 1.5, durSec: 1.47, note: 72, gain: 0.45 },
    { atSec: 2.4, durSec: 1.17, note: 53, gain: 0.5 },
    { atSec: 2.4, durSec: 1.17, note: 57, gain: 0.5 },
    { atSec: 3, durSec: 1.47, note: 62, gain: 0.45 },
    { atSec: 3, durSec: 1.47, note: 71, gain: 0.45 },
    { atSec: 3.6, durSec: 1.17, note: 48, gain: 0.5 },
    { atSec: 3.6, durSec: 1.17, note: 55, gain: 0.5 },
    { atSec: 4.5, durSec: 1.47, note: 64, gain: 0.45 },
    { atSec: 4.5, durSec: 1.47, note: 72, gain: 0.45 },
    { atSec: 4.8, durSec: 1.17, note: 53, gain: 0.5 },
    { atSec: 4.8, durSec: 1.17, note: 57, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 50, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 57, gain: 0.5 },
    { atSec: 6, durSec: 1.35, note: 65, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 74, gain: 0.45 },
  ],
}

// The same two clocks with one voice on each: D C F G C D in fours, F E D E F in fives, with a fourth that falls to the third over C and a seventh that falls to the sixth over F.
const TWO_LINES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.18, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 1.48, note: 65, gain: 0.45 },
    { atSec: 1.2, durSec: 1.18, note: 48, gain: 0.6 },
    { atSec: 1.5, durSec: 1.48, note: 64, gain: 0.45 },
    { atSec: 2.4, durSec: 1.18, note: 53, gain: 0.6 },
    { atSec: 3, durSec: 1.48, note: 62, gain: 0.45 },
    { atSec: 3.6, durSec: 1.18, note: 55, gain: 0.6 },
    { atSec: 4.5, durSec: 1.48, note: 64, gain: 0.45 },
    { atSec: 4.8, durSec: 1.18, note: 48, gain: 0.6 },
    { atSec: 6, durSec: 1.35, note: 50, gain: 0.6 },
    { atSec: 6, durSec: 1.35, note: 65, gain: 0.45 },
  ],
}

// The near relation: bars of three above, bars of four below, meeting every twelve pulses.
const THREE_AGAINST_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 62, gain: 0.55 },
    { atSec: 0, durSec: 0.5, note: 74, gain: 0.5 },
    { atSec: 0.42, durSec: 0.5, note: 57, gain: 0.4 },
    { atSec: 0.56, durSec: 0.25, note: 69, gain: 0.36 },
    { atSec: 0.84, durSec: 0.26, note: 65, gain: 0.38 },
    { atSec: 0.84, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 1.12, durSec: 0.5, note: 60, gain: 0.55 },
    { atSec: 1.4, durSec: 0.25, note: 67, gain: 0.36 },
    { atSec: 1.54, durSec: 0.5, note: 55, gain: 0.4 },
    { atSec: 1.68, durSec: 0.5, note: 71, gain: 0.5 },
    { atSec: 1.96, durSec: 0.26, note: 64, gain: 0.38 },
    { atSec: 2.24, durSec: 0.5, note: 62, gain: 0.55 },
    { atSec: 2.24, durSec: 0.25, note: 67, gain: 0.36 },
    { atSec: 2.52, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 2.66, durSec: 0.5, note: 57, gain: 0.4 },
    { atSec: 3.08, durSec: 0.26, note: 65, gain: 0.38 },
    { atSec: 3.08, durSec: 0.25, note: 69, gain: 0.36 },
    { atSec: 3.36, durSec: 0.5, note: 60, gain: 0.55 },
    { atSec: 3.36, durSec: 0.5, note: 74, gain: 0.5 },
    { atSec: 3.78, durSec: 0.5, note: 55, gain: 0.4 },
    { atSec: 3.92, durSec: 0.25, note: 69, gain: 0.36 },
    { atSec: 4.2, durSec: 0.26, note: 64, gain: 0.38 },
    { atSec: 4.2, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 4.48, durSec: 0.5, note: 62, gain: 0.55 },
    { atSec: 4.76, durSec: 0.25, note: 67, gain: 0.36 },
    { atSec: 4.9, durSec: 0.5, note: 57, gain: 0.4 },
    { atSec: 5.04, durSec: 0.5, note: 71, gain: 0.5 },
    { atSec: 5.32, durSec: 0.26, note: 65, gain: 0.38 },
    { atSec: 5.6, durSec: 0.5, note: 60, gain: 0.55 },
    { atSec: 5.6, durSec: 0.25, note: 67, gain: 0.36 },
    { atSec: 5.88, durSec: 0.5, note: 72, gain: 0.5 },
    { atSec: 6.02, durSec: 0.5, note: 55, gain: 0.4 },
    { atSec: 6.44, durSec: 0.26, note: 64, gain: 0.38 },
    { atSec: 6.44, durSec: 0.25, note: 69, gain: 0.36 },
    { atSec: 6.72, durSec: 0.6, note: 62, gain: 0.5 },
    { atSec: 6.72, durSec: 0.6, note: 74, gain: 0.5 },
  ],
}

// The left hand breaks a chord over every four pulses (D minor, A minor over C, F major seventh, G, D minor), the right hand sings in fives.
const TWO_HANDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 0.55, note: 81, gain: 0.55 },
    { atSec: 0.3, durSec: 0.3, note: 57, gain: 0.36 },
    { atSec: 0.6, durSec: 0.3, note: 62, gain: 0.36 },
    { atSec: 0.6, durSec: 0.55, note: 79, gain: 0.42 },
    { atSec: 0.9, durSec: 0.3, note: 65, gain: 0.36 },
    { atSec: 0.9, durSec: 0.55, note: 76, gain: 0.42 },
    { atSec: 1.2, durSec: 0.3, note: 48, gain: 0.5 },
    { atSec: 1.5, durSec: 0.3, note: 57, gain: 0.36 },
    { atSec: 1.5, durSec: 0.55, note: 84, gain: 0.55 },
    { atSec: 1.8, durSec: 0.3, note: 60, gain: 0.36 },
    { atSec: 2.1, durSec: 0.3, note: 64, gain: 0.36 },
    { atSec: 2.1, durSec: 0.55, note: 81, gain: 0.42 },
    { atSec: 2.4, durSec: 0.3, note: 53, gain: 0.5 },
    { atSec: 2.4, durSec: 0.55, note: 79, gain: 0.42 },
    { atSec: 2.7, durSec: 0.3, note: 60, gain: 0.36 },
    { atSec: 3, durSec: 0.3, note: 64, gain: 0.36 },
    { atSec: 3, durSec: 0.55, note: 79, gain: 0.55 },
    { atSec: 3.3, durSec: 0.3, note: 69, gain: 0.36 },
    { atSec: 3.6, durSec: 0.3, note: 55, gain: 0.5 },
    { atSec: 3.6, durSec: 0.55, note: 76, gain: 0.42 },
    { atSec: 3.9, durSec: 0.3, note: 62, gain: 0.36 },
    { atSec: 3.9, durSec: 0.55, note: 74, gain: 0.42 },
    { atSec: 4.2, durSec: 0.3, note: 67, gain: 0.36 },
    { atSec: 4.5, durSec: 0.3, note: 71, gain: 0.36 },
    { atSec: 4.5, durSec: 0.55, note: 81, gain: 0.55 },
    { atSec: 4.8, durSec: 0.3, note: 50, gain: 0.5 },
    { atSec: 5.1, durSec: 0.3, note: 57, gain: 0.36 },
    { atSec: 5.1, durSec: 0.55, note: 79, gain: 0.42 },
    { atSec: 5.4, durSec: 0.3, note: 62, gain: 0.36 },
    { atSec: 5.4, durSec: 0.55, note: 76, gain: 0.42 },
    { atSec: 5.7, durSec: 0.3, note: 65, gain: 0.36 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.5 },
    { atSec: 6, durSec: 1.3, note: 57, gain: 0.35 },
    { atSec: 6, durSec: 1.3, note: 81, gain: 0.5 },
  ],
}

// A low string on every fourth pulse, D D G E D, and a pentatonic turn above it that takes five.
const SILK: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 0.28, note: 69, gain: 0.6 },
    { atSec: 0.3, durSec: 0.28, note: 67, gain: 0.42 },
    { atSec: 0.9, durSec: 0.28, note: 64, gain: 0.42 },
    { atSec: 1.2, durSec: 1, note: 50, gain: 0.5 },
    { atSec: 1.2, durSec: 0.28, note: 62, gain: 0.42 },
    { atSec: 1.5, durSec: 0.28, note: 72, gain: 0.6 },
    { atSec: 1.8, durSec: 0.28, note: 69, gain: 0.42 },
    { atSec: 2.4, durSec: 1, note: 55, gain: 0.5 },
    { atSec: 2.4, durSec: 0.28, note: 67, gain: 0.42 },
    { atSec: 2.7, durSec: 0.28, note: 64, gain: 0.42 },
    { atSec: 3, durSec: 0.28, note: 69, gain: 0.6 },
    { atSec: 3.3, durSec: 0.28, note: 67, gain: 0.42 },
    { atSec: 3.6, durSec: 1, note: 52, gain: 0.5 },
    { atSec: 3.9, durSec: 0.28, note: 64, gain: 0.42 },
    { atSec: 4.2, durSec: 0.28, note: 62, gain: 0.42 },
    { atSec: 4.5, durSec: 0.28, note: 67, gain: 0.6 },
    { atSec: 4.8, durSec: 1, note: 50, gain: 0.5 },
    { atSec: 4.8, durSec: 0.28, note: 64, gain: 0.42 },
    { atSec: 5.4, durSec: 0.28, note: 62, gain: 0.42 },
    { atSec: 5.7, durSec: 0.28, note: 64, gain: 0.42 },
    { atSec: 6, durSec: 1.2, note: 50, gain: 0.5 },
    { atSec: 6, durSec: 1.2, note: 62, gain: 0.5 },
  ],
}

// One low D held through the twenty. Over it A G A, a move every two bars of four, and D C D, a move every two bars of five.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.35, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 2.95, note: 62, gain: 0.4 },
    { atSec: 0, durSec: 7.3, note: 38, gain: 0.6 },
    { atSec: 2.4, durSec: 2.35, note: 55, gain: 0.45 },
    { atSec: 3, durSec: 2.95, note: 60, gain: 0.4 },
    { atSec: 4.8, durSec: 2.5, note: 57, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 62, gain: 0.4 },
  ],
}

// The same two slow clocks over a low C, for shapes that bring their own major third: C G C in fours below, C G C in fives above.
const PEDAL_ON_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.35, note: 48, gain: 0.45 },
    { atSec: 0, durSec: 2.95, note: 60, gain: 0.38 },
    { atSec: 0, durSec: 7.3, note: 36, gain: 0.6 },
    { atSec: 2.4, durSec: 2.35, note: 55, gain: 0.45 },
    { atSec: 3, durSec: 2.95, note: 67, gain: 0.34 },
    { atSec: 4.8, durSec: 2.5, note: 48, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 60, gain: 0.38 },
  ],
}

// Two breaths that differ by a pulse: D and A in fours below, A C A E in fives above, level again at the end.
const BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 50, gain: 0.55 },
    { atSec: 0, durSec: 1.1, note: 57, gain: 0.45 },
    { atSec: 1.2, durSec: 0.9, note: 45, gain: 0.55 },
    { atSec: 1.5, durSec: 1.1, note: 60, gain: 0.45 },
    { atSec: 2.4, durSec: 0.9, note: 50, gain: 0.55 },
    { atSec: 3, durSec: 1.1, note: 57, gain: 0.45 },
    { atSec: 3.6, durSec: 0.9, note: 45, gain: 0.55 },
    { atSec: 4.5, durSec: 1.1, note: 64, gain: 0.45 },
    { atSec: 4.8, durSec: 0.9, note: 50, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 50, gain: 0.5 },
    { atSec: 6, durSec: 1.3, note: 57, gain: 0.4 },
  ],
}

// The same two slow clocks over a low A, for shapes that bring their own minor third: A D A in fours below, A D A in fives above.
const MINOR_BED: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.35, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 2.95, note: 69, gain: 0.35 },
    { atSec: 0, durSec: 7.3, note: 45, gain: 0.6 },
    { atSec: 2.4, durSec: 2.35, note: 62, gain: 0.42 },
    { atSec: 3, durSec: 2.95, note: 74, gain: 0.3 },
    { atSec: 4.8, durSec: 2.5, note: 57, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 69, gain: 0.35 },
  ],
}

// Two thin voices high up: A C A G A in fours, D E G E in fives.
const HIGH_BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 69, gain: 0.45 },
    { atSec: 0, durSec: 1.3, note: 74, gain: 0.42 },
    { atSec: 1.2, durSec: 1, note: 72, gain: 0.45 },
    { atSec: 1.5, durSec: 1.3, note: 76, gain: 0.42 },
    { atSec: 2.4, durSec: 1, note: 69, gain: 0.45 },
    { atSec: 3, durSec: 1.3, note: 79, gain: 0.42 },
    { atSec: 3.6, durSec: 1, note: 67, gain: 0.45 },
    { atSec: 4.5, durSec: 1.3, note: 76, gain: 0.42 },
    { atSec: 4.8, durSec: 1, note: 69, gain: 0.45 },
    { atSec: 6, durSec: 1.3, note: 69, gain: 0.45 },
    { atSec: 6, durSec: 1.3, note: 74, gain: 0.42 },
  ],
}

// Held notes higher up: thirds that step every four pulses under one voice that steps every five: A minor, E minor, A minor, F, F major seventh, E minor, A minor.
const HELD_ABOVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.17, note: 69, gain: 0.45 },
    { atSec: 0, durSec: 1.17, note: 72, gain: 0.45 },
    { atSec: 0, durSec: 1.47, note: 76, gain: 0.45 },
    { atSec: 1.2, durSec: 1.17, note: 67, gain: 0.45 },
    { atSec: 1.2, durSec: 1.17, note: 71, gain: 0.45 },
    { atSec: 1.5, durSec: 1.47, note: 74, gain: 0.45 },
    { atSec: 2.4, durSec: 1.17, note: 69, gain: 0.45 },
    { atSec: 2.4, durSec: 1.17, note: 72, gain: 0.45 },
    { atSec: 3, durSec: 1.47, note: 77, gain: 0.45 },
    { atSec: 3.6, durSec: 1.17, note: 65, gain: 0.45 },
    { atSec: 3.6, durSec: 1.17, note: 69, gain: 0.45 },
    { atSec: 4.5, durSec: 1.47, note: 76, gain: 0.45 },
    { atSec: 4.8, durSec: 1.17, note: 67, gain: 0.45 },
    { atSec: 4.8, durSec: 1.17, note: 71, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 69, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 72, gain: 0.45 },
    { atSec: 6, durSec: 1.35, note: 76, gain: 0.45 },
  ],
}

// The fives in full, for small bars and glass: A G E up high. Of the fours only each bar line: D C A B C, and D again where they meet.
const FIVES_ABOVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.42, note: 81, gain: 0.62 },
    { atSec: 0, durSec: 0.9, note: 74, gain: 0.36 },
    { atSec: 0.6, durSec: 0.42, note: 79, gain: 0.48 },
    { atSec: 1.05, durSec: 0.42, note: 76, gain: 0.48 },
    { atSec: 1.2, durSec: 0.9, note: 72, gain: 0.36 },
    { atSec: 1.5, durSec: 0.42, note: 81, gain: 0.62 },
    { atSec: 2.1, durSec: 0.42, note: 79, gain: 0.48 },
    { atSec: 2.4, durSec: 0.9, note: 69, gain: 0.36 },
    { atSec: 2.55, durSec: 0.42, note: 76, gain: 0.48 },
    { atSec: 3, durSec: 0.42, note: 81, gain: 0.62 },
    { atSec: 3.6, durSec: 0.42, note: 79, gain: 0.48 },
    { atSec: 3.6, durSec: 0.9, note: 71, gain: 0.36 },
    { atSec: 4.05, durSec: 0.42, note: 76, gain: 0.48 },
    { atSec: 4.5, durSec: 0.42, note: 81, gain: 0.62 },
    { atSec: 4.8, durSec: 0.9, note: 72, gain: 0.36 },
    { atSec: 5.1, durSec: 0.42, note: 79, gain: 0.48 },
    { atSec: 5.55, durSec: 0.42, note: 76, gain: 0.48 },
    { atSec: 6, durSec: 1.3, note: 74, gain: 0.36 },
    { atSec: 6, durSec: 1.3, note: 81, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Drone: the ground both layers stand on, opened, shaded or turned at one count or the other.
  {
    id: 'four-against-five-gate-on-the-fourth',
    name: 'Gate on the fourth',
    category: 'drone',
    description:
      'Dark open fifths let through once every four pulses by a soft gate, the whole of it leaning left.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -6,
        cutoff: 700,
        sub: 0.6,
        air: 0,
        movement: 0.2,
        attack: 0.5,
        release: 1.5,
        width: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Soft throb',
        params: { rate: 3.33, steps: 4, fill: 1, shade: 0.6, floor: 0.4 },
      },
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.01, turn: -90, head: 0.8 } },
    ],
  },
  {
    id: 'four-against-five-five-lit-landings',
    name: 'Five lit landings',
    category: 'pad',
    description:
      'Bright wide octaves that swell three times in every five pulses, the gaps darkened, with a long plate after them.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { cutoff: 9000, sub: 0, air: 0.4, rate: 0.3, attack: 1, release: 5, width: 1 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Dark glints',
        params: { rate: 3.33, steps: 5, fill: 3, drift: 0, floor: 0.5, shade: 1, length: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'four-against-five-cog-and-lantern',
    name: 'Cog and lantern',
    category: 'drone',
    description:
      'A motionless harmonic stack whose lows and highs trade places in fours, under a low pass that opens in fives.',
    preview: PEDAL_ON_C,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { cutoff: 3000, partials: 0.7, sub: 0.3, attack: 0.8, release: 2 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Harmonic shimmer',
        params: { rate: 0.833, depth: 0.9, crossover: 300, drift: 0 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: {
          cutoffHz: 900,
          resonance: 1.2,
          driveDb: 2,
          lfoAmount: 60,
          lfoRateHz: 0.667,
          lfoShape: 0,
        },
      },
    ],
  },
  {
    id: 'four-against-five-cellar-under-both',
    name: 'Cellar under both',
    category: 'drone',
    description:
      'Deep octaves with a strong sub and no air, all but the bottom filtered away, levelled by a slow compressor.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        volume: -19,
        cutoff: 260,
        sub: 1,
        movement: 0.3,
        attack: 1.2,
        release: 6,
        width: 0.1,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4, highCut: 1400 } },
    ],
  },
  {
    id: 'four-against-five-mill-with-two-stones',
    name: 'Mill with two stones',
    category: 'organ',
    description:
      'A quick steady harmonic organ, its notes caught by two loops, one four pulses long and the other five.',
    preview: BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { cutoff: 2200, partials: 0.5, sub: 0.3, attack: 0.08, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: {
          loops: 2,
          length: 1.2,
          offset: 25,
          feedback: 0.8,
          wear: 0.2,
          spread: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'four-against-five-quintet-of-pipes',
    name: 'Quintet of pipes',
    category: 'organ',
    description:
      'Plain octaves with quick speech, blown through a small open pipe that adds its own breath, in a small room.',
    preview: HIGH_BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        shape: 1,
        partials: 0.8,
        cutoff: 5000,
        sub: 0,
        air: 0.3,
        attack: 0.15,
        release: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 0.5, air: 0.5, opening: 0.7, material: 0.4, mix: 0.75 },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'four-against-five-quartet-in-coats',
    name: 'Quartet in coats',
    category: 'pad',
    description:
      'Round unison tones with no edge, every attack blurred into a deep fog and nothing left above the middle.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        hold: 0,
        wave: 0,
        partials: 0.5,
        cutoff: 600,
        sub: 0.5,
        air: 0,
        attack: 0.3,
        release: 1.2,
        width: 0.6,
        movement: 0.4,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog', params: { damp: 0.6 } }],
  },
  {
    id: 'four-against-five-starfish-on-slate',
    name: 'Starfish on slate',
    category: 'pad',
    description:
      'A glassy minor shape trembling from side to side at five a second, and at four a second in its middle band alone.',
    preview: MINOR_BED,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { volume: -5.5, cutoff: 6000, attack: 0.7, release: 4 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 5, depth: 0.5, phase: 180, drift: 0 },
      },
      {
        deviceId: 'band-pulse',
        preset: 'Eight a second',
        params: { rate: 4, depth: 0.9, low: 250, high: 1500 },
      },
    ],
  },
  {
    id: 'four-against-five-hornet-and-clock',
    name: 'Hornet and clock',
    category: 'drone',
    description:
      'A saw swarm behind a low pass that opens at once and falls shut again every four pulses, lightly driven.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: { cutoff: 2500, rate: 0.3, attack: 0.5, release: 1.5, width: 0.8 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: {
          cutoffHz: 420,
          resonance: 2,
          driveDb: 4,
          lfoAmount: 80,
          lfoRateHz: 0.833,
          lfoShape: 3,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'four-against-five-draught-in-fives',
    name: 'Draught in fives',
    category: 'wind',
    description:
      'Tuned air with hardly any tone in it, its band sliding up and down once every five pulses, leaning far to the right.',
    preview: BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { volume: 0, attack: 0.35, release: 1, cutoff: 12000, rate: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: {
          cutoffHz: 1300,
          resonance: 2,
          driveDb: 0,
          envAmount: 0,
          lfoAmount: 60,
          lfoRateHz: 0.667,
          mix: 0.7,
        },
      },
      {
        deviceId: 'around',
        preset: 'Wide pendulum',
        params: { rate: 0.01, turn: 90, radius: 1, head: 0.9 },
      },
    ],
  },
  {
    id: 'four-against-five-neither-bar-nor-beat',
    name: 'Neither bar nor beat',
    category: 'pad',
    description:
      'Roots with a second beside them, fading band by band on slow cycles of their own inside a dark hall.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: { attack: 1.5, release: 6, cutoff: 2600, sub: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.4, depth: 0.85, bands: 5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'four-against-five-fog-over-twenty-fields',
    name: 'Fog over twenty fields',
    category: 'texture',
    description:
      'A breathy root, second and fifth set at the far end of a wide room, wandering nearer and farther, dulled by the air.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { partials: 0.3, attack: 0.5, release: 2.5, cutoff: 3200, air: 0.7 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Lost in the hall',
        params: { decay: 4, wander: 0.5, rate: 0.1, level: 1 },
      },
    ],
  },
  {
    id: 'four-against-five-four-strings-left-open',
    name: 'Four strings left open',
    category: 'drone',
    description:
      'A buzzing harmonic series on C that wakes four strings tuned to C major, left ringing for six seconds.',
    preview: PEDAL_ON_C,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { attack: 0.4, release: 1.5, cutoff: 4500, wave: 0.9, width: 0.4 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 0, sympathy: 0.8, strings: 0, decay: 6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'four-against-five-window-of-five-panes',
    name: 'Window of five panes',
    category: 'pad',
    description:
      'A slow just major shape with air on top, each band of it twinkling at its own small rate, the lows cut away.',
    preview: PEDAL_ON_C,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { attack: 1, release: 6, sub: 0, air: 0.5, cutoff: 9000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.9, rate: 3.33 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 220, highCut: 9000 } },
    ],
  },
  {
    id: 'four-against-five-loaves-set-out-in-fours',
    name: 'Loaves set out in fours',
    category: 'pad',
    description:
      'A warm major shape with a full sub, swelling once every four pulses, on slow worn tape that dips its pitch.',
    preview: PEDAL_ON_C,
    instrument: {
      deviceId: 'drone',
      preset: 'Held major',
      params: { hold: 0, attack: 0.9, release: 3, cutoff: 1500, sub: 0.7, width: 0.3 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 0.833, depth: 0.45, phase: 0, drift: 0 },
      },
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { speed: 2, wow: 0.7, flutter: 0.4, drive: 0.5, hiss: 0.1, tone: 0.3 },
      },
    ],
  },
  {
    id: 'four-against-five-fifth-hour-lamp-low',
    name: 'Fifth hour, lamp low',
    category: 'pad',
    description:
      'A dim minor shape through a hall whose tail sings a round closed vowel, the voice itself kept low.',
    preview: MINOR_BED,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { volume: -5.5, attack: 1.4, release: 5, cutoff: 1100, sub: 0.3 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Endless oo',
        params: { decay: 12, mix: 0.65, highCut: 4000 },
      },
    ],
  },
  {
    id: 'four-against-five-flock-wheels-twice',
    name: 'Flock wheels twice',
    category: 'pad',
    description:
      'Wide unison tones sent through a fast turning horn and drum, close to the microphones, with a little drive.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: { hold: 0, attack: 0.25, release: 0.9, cutoff: 3000, sub: 0.2, movement: 0.5 },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Tremolo',
        params: { speed: 1, hornDepth: 0.9, drumDepth: 0.8, distance: 0.1, drive: 0.4 },
      },
    ],
  },
  {
    id: 'four-against-five-whistler-counts-along',
    name: 'Whistler counts along',
    category: 'wind',
    description:
      'One thin pure tone a key, straight at first and then swaying, with a short spring behind it.',
    preview: HIGH_BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        shape: 0,
        partials: 0.1,
        wave: 0,
        movement: 0.1,
        sub: 0,
        air: 0.2,
        cutoff: 8000,
        attack: 0.12,
        release: 0.5,
        width: 0,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 350, depth: 45 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'four-against-five-ebb-in-fives',
    name: 'Ebb in fives',
    category: 'texture',
    description:
      'Soft fifths hidden behind a reverb that rises backwards for a bar of five and is cut off.',
    preview: BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -3.5,
        attack: 0.2,
        release: 0.4,
        cutoff: 3500,
        sub: 0,
        air: 0.1,
        wave: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Reverse',
        params: { time: 1.5, mix: 0.85, highCut: 7000, tail: 0.1 },
      },
    ],
  },
  {
    id: 'four-against-five-stair-of-loose-treads',
    name: 'Stair of loose treads',
    category: 'drone',
    description:
      'Sawtooth octaves in a dark hall, whose narrow band steps to a new place on every pulse, at random.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        volume: -3.5,
        wave: 1,
        partials: 0.8,
        sub: 0.2,
        cutoff: 8000,
        movement: 0.3,
        attack: 0.5,
        release: 2,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 700, resonance: 3, lfoAmount: 70, lfoRateHz: 3.33, mix: 0.85 },
      },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'four-against-five-count-read-backwards',
    name: 'Count read backwards',
    category: 'texture',
    description:
      'Short glassy fifths played back in reverse a bar of five later, an octave higher, from side to side.',
    preview: BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { shape: 2, attack: 0.1, release: 0.3, cutoff: 3500, partials: 0.5, width: 0.3 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1500, pitch: 1, feedback: 0.3, spread: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'four-against-five-echoes-out-by-one',
    name: 'Echoes out by one',
    category: 'organ',
    description:
      'Clipped low octaves into a dark echo of four pulses and then a tape echo of five, so the repeats interleave.',
    preview: BREATHS,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 0.02, release: 0.15, cutoff: 1400, sub: 0.5, movement: 0.1, wave: 0.3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 1200, feedback: 0.4, mix: 0.4 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 1500, heads: 0, feedback: 0.35, mix: 0.4 },
      },
    ],
  },
  {
    id: 'four-against-five-five-doors-of-a-chapel',
    name: 'Five doors of a chapel',
    category: 'organ',
    description:
      'Octaves given organ stops, a twelfth and a fifteenth among them, in a tall bright hall that keeps the top.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        shape: 1,
        partials: 0.3,
        wave: 0,
        attack: 0.1,
        release: 0.6,
        sub: 0,
        air: 0.05,
        movement: 0.1,
        cutoff: 6000,
      },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Principal chorus',
        params: { twelfth: 0.6, fifteenth: 0.6, sub: 0.1, unison: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'four-against-five-two-clocks-on-short-wave',
    name: 'Two clocks on short wave',
    category: 'texture',
    description:
      'A bare humming unison received over a narrow fading radio link, with static rising as it sinks.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        volume: -1,
        hold: 0,
        wave: 0.8,
        attack: 0.6,
        release: 2,
        cutoff: 5000,
        sub: 0,
        width: 0,
      },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.7, static: 0.25, interference: 0, mix: 0.9 },
      },
    ],
  },
  {
    id: 'four-against-five-spiral-over-the-loop',
    name: 'Spiral over the loop',
    category: 'pad',
    description:
      'Soft octaves without a sub, their long tail climbing without end above them, thin in the bass.',
    preview: PEDAL,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: {
        volume: -4.5,
        partials: 0.3,
        air: 0,
        rate: 0.1,
        attack: 0.5,
        release: 1,
        cutoff: 1500,
        width: 0.5,
      },
    },
    effects: [
      { deviceId: 'spiral', preset: 'Slow ascent', params: { climb: 6, decay: 14, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 180, air: 4 } },
    ],
  },
  // Bells: short wood and bars for the fours, glass and bowls left ringing for the fives.
  {
    id: 'four-against-five-knots-in-the-rope',
    name: 'Knots in the rope',
    category: 'plucked',
    description:
      'Wooden bars damped at once and struck in the middle, boxed in by a large wooden body, narrow and dry.',
    preview: FOURS_FORWARD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 5.5, decay: 0.9, hardness: 0.3, spread: 0 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.85, size: 1.6 } }],
  },
  {
    id: 'four-against-five-glass-on-the-right-sill',
    name: 'Glass on the right sill',
    category: 'bell',
    description:
      'Hard tapped glass with a long shiver left in it, with a bright plate behind it, all of it leaning right.',
    preview: FIVES_ABOVE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -3.5, decay: 11, detune: 2.5, brightness: 0.85, release: 0 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
      {
        deviceId: 'around',
        preset: 'Wide pendulum',
        params: { rate: 0.01, turn: 90, radius: 1, head: 0.9, blur: 0.1 },
      },
    ],
  },
  {
    id: 'four-against-five-tongues-in-a-box',
    name: 'Tongues in a box',
    category: 'plucked',
    description:
      'Thumbed tongues played back through a small boxy speaker with the lows raised and the highs turned away.',
    preview: TWENTY,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -4.5, decay: 1.8, hardness: 0.4, brightness: 0.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard', params: { bass: 0.5, treble: -0.6 } },
    ],
  },
  {
    id: 'four-against-five-bowl-once-a-bar',
    name: 'Bowl once a bar',
    category: 'bell',
    description:
      'A dark bowl struck with a soft beater and left to ring for forty seconds, wandering slowly about the head.',
    preview: LOW_DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -0.5, hardness: 0.12, position: 0.4 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow wander', params: { rate: 0.2, radius: 1 } }],
  },
  {
    id: 'four-against-five-five-rims-rubbed',
    name: 'Five rims rubbed',
    category: 'pad',
    description:
      'Glass rims rubbed while the key is down and stopped as it lifts, their lows cut and a shimmer an octave up behind.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { sustain: 1, release: 0.8, hardness: 0.05, detune: 0.6, brightness: 0.6 },
    },
    effects: [
      {
        deviceId: 'ambient-eq',
        preset: 'Thin',
        params: { lowCut: 250, highCut: 12000, presence: 0 },
      },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'four-against-five-vibes-in-two-wards',
    name: 'Vibes in two wards',
    category: 'bell',
    description:
      'Damped vibraphone bars panned hard from side to side, once across in a bar of four.',
    preview: BAR_OF_BOTH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -4.5, decay: 3, release: 0.9, hardness: 0.55 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 0.833, smooth: 0.5 } },
    ],
  },
  {
    id: 'four-against-five-bells-a-fifth-of-a-mile',
    name: 'Bells a fifth of a mile',
    category: 'bell',
    description:
      'A church bell struck softly, so far off that only its dull lower partials arrive, with a little of the valley.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { volume: -0.5, hardness: 0.25, decay: 14, position: 0.3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog', params: { wander: 0.4, rate: 0.08 } }],
  },
  {
    id: 'four-against-five-musical-box-in-fives',
    name: 'Musical box in fives',
    category: 'bell',
    description:
      'Pinned steel teeth, small and quick, through an early sampler that folds their top back down as grit.',
    preview: EVERY_PAIR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 1.5, decay: 1.4, brightness: 0.8 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Sampler',
        params: { rate: 11000, bits: 9, aliasing: 0.6, filter: 0 },
      },
    ],
  },
  {
    id: 'four-against-five-gong-for-the-twentieth',
    name: 'Gong for the twentieth',
    category: 'bell',
    description:
      'A wide slow gong whose strike is swelled in over most of a second, so only the hum is heard arriving.',
    preview: LOW_DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 3.5, hardness: 0.35, decay: 20 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 900 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'four-against-five-chimes-at-the-corner',
    name: 'Chimes at the corner',
    category: 'bell',
    description:
      'Thin hard chimes thrown across the room by echoes that bounce closer and closer together.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -2, decay: 2.5, damping: 0.3 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Skipping stone',
        params: { first: 400, skips: 10, mix: 0.5, throw: 1 },
      },
    ],
  },
  {
    id: 'four-against-five-bowl-and-its-fifth',
    name: 'Bowl and its fifth',
    category: 'bell',
    description:
      'A short bowl answered a bar of four later at the octave below and two bars later at the fifth above it.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { volume: -2.5, decay: 2.5, hardness: 0.6, damping: 0.7 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: {
          followers: 2,
          gap: 1.2,
          interval1: -12,
          interval2: -5,
          fade: 0.1,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'four-against-five-wood-knocks-through-fog',
    name: 'Wood knocks through fog',
    category: 'texture',
    description:
      'Wooden bars with every knock dissolved into a third of a second of cloud, leaving pitch and no beat.',
    preview: TWENTY,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { decay: 2.5, damping: 0.6, brightness: 0.7 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise', params: { size: 350, soften: 0.6, damp: 0.1 } },
    ],
  },
  {
    id: 'four-against-five-ring-of-five-splinters',
    name: 'Ring of five splinters',
    category: 'bell',
    description:
      'Shivering glass ring modulated on D with its octave below, so each tone splits into a small dark gong.',
    preview: FIVES_FORWARD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { volume: -4.5, decay: 4, detune: 3, damping: 0.4 },
    },
    effects: [
      {
        deviceId: 'ring',
        preset: 'Bell on the root',
        params: { root: 2, octave: 3, second: 3, mix: 0.5, tone: 4000 },
      },
    ],
  },
  {
    id: 'four-against-five-bowed-in-long-fives',
    name: 'Bowed in long fives',
    category: 'pad',
    description:
      'Church bells bowed instead of struck, breathing open and shut once every five pulses, with a wide chorus.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { volume: -3.5, hardness: 0.3, release: 0.5, brightness: 0.5, decay: 8 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 0.6, hold: 0.2, out: 0.5, rest: 0.2, vary: 0, depth: 0.7 },
      },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'four-against-five-counting-frame',
    name: 'Counting frame',
    category: 'plucked',
    description:
      'Dull vibraphone bars with a hard stick and no ring, driven through a warm valve and cut above the middle.',
    preview: TWENTY,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -13.5, decay: 0.4, hardness: 0.8, damping: 0.8, spread: 0.1, release: 1 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Warm glue',
        params: { curve: 2, driveDb: 16, toneDb: -6, outputDb: -6 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 2000 } },
    ],
  },
  {
    id: 'four-against-five-squeezed-bronze',
    name: 'Squeezed bronze',
    category: 'bell',
    description:
      'Gong metal squeezed to closer partials and struck hard near its edge, cut short, with its ringing tones held back.',
    preview: FOURS_FORWARD,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        volume: -4.5,
        stretch: 0.6,
        decay: 2,
        hardness: 0.75,
        position: 0.1,
        release: 0.4,
        spread: 0.3,
      },
    },
    effects: [{ deviceId: 'tamer', preset: 'Even', params: { depth: 0.8 } }],
  },
  {
    id: 'four-against-five-kalimba-on-the-ferry',
    name: 'Kalimba on the ferry',
    category: 'plucked',
    description:
      'Kalimba tongues under water, wavering and muffled, with bubbles rising off each pluck.',
    preview: THREE_AGAINST_FOUR,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 4, damping: 0.4, hardness: 0.8 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Sunlit shallows',
        params: { depth: 0.65, waver: 0.6, bubbles: 0.6 },
      },
    ],
  },
  {
    id: 'four-against-five-pentagon-of-wire',
    name: 'Pentagon of wire',
    category: 'bell',
    description:
      'Bright bars with their partials pulled wider apart, each lit again by sparks one and two octaves up.',
    preview: FIVES_ABOVE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: 2, stretch: 1.3, decay: 6, hardness: 0.6, spread: 1 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Glitter', params: { density: 9, pitch: 3, mix: 0.35 } },
    ],
  },
  {
    id: 'four-against-five-square-of-lamplight',
    name: 'Square of lamplight',
    category: 'bell',
    description:
      'Softly struck vibraphone bars behind a slow rotary horn, a worn tape wobble over both.',
    preview: BAR_OF_BOTH,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { hardness: 0.08, decay: 9, release: 0.3, brightness: 0.25 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { hornDepth: 0.9, drive: 0.1 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.6, noise: 0.05 } },
    ],
  },
  {
    id: 'four-against-five-bells-walled-in-haze',
    name: 'Bells walled in haze',
    category: 'texture',
    description:
      'Church bells blurred, fuzzed and blurred again until they hang as one glowing wall, a little octave in it.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -1, decay: 3, hardness: 0.4, release: 0.6 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Slow bloom', params: { mix: 0.85, octave: 0.3, decay: 5 } },
    ],
  },
  {
    id: 'four-against-five-the-wheels-agree',
    name: 'The wheels agree',
    category: 'bell',
    description:
      'A clear bowl copied into two loops of four and five pulses that wear away as they turn, one on each side.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        volume: -6,
        decay: 1.2,
        hardness: 0.9,
        damping: 0.15,
        brightness: 0.8,
        position: 0.02,
      },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { loops: 2, length: 1.2, offset: 25, feedback: 0.7, wear: 0.5, mix: 0.55 },
      },
    ],
  },
  // Mallets: rosewood for the fours, metal for the fives, and rolls and motors that count.
  {
    id: 'four-against-five-rosewood-in-bars-of-four',
    name: 'Rosewood in bars of four',
    category: 'plucked',
    description:
      'Dark marimba with the softest mallet and short bars over open tubes, close, narrow and leaning left.',
    preview: FOURS_FORWARD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -1, mallet: 0.05, decay: 0.5, resonator: 1, width: 0.1 },
    },
    effects: [
      {
        deviceId: 'around',
        preset: 'Wide pendulum',
        params: { rate: 0.01, turn: -90, radius: 0.9, head: 0.8, blur: 0.15 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { low: 3, highCut: 2500 } },
    ],
  },
  {
    id: 'four-against-five-tin-stars-in-fives',
    name: 'Tin stars in fives',
    category: 'bell',
    description:
      'Hard long glockenspiel bars, doubled wide, each sending up glassy octave sparks in a tiny bright room.',
    preview: FIVES_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 1, decay: 3, width: 1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.5 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'four-against-five-motor-at-five',
    name: 'Motor at five',
    category: 'bell',
    description:
      'Hard damped vibraphone, fans at five turns a second against a middle band pulsed at four, a high pass falling in every bar.',
    preview: BAR_OF_BOTH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: {
        volume: -5,
        motor: 1,
        motorRate: 5,
        mallet: 0.85,
        decay: 0.6,
        damper: 0.6,
        width: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { cutoffHz: 500, lfoRateHz: 0.833, lfoAmount: 60 },
      },
      {
        deviceId: 'band-pulse',
        preset: 'Eight a second',
        params: { rate: 4, depth: 0.8, low: 300, high: 2500 },
      },
    ],
  },
  {
    id: 'four-against-five-rolled-at-four',
    name: 'Rolled at four',
    category: 'plucked',
    description:
      'Marimba rolled at four strokes a second while a key is held, its knocks softened and its tones held on.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 4, mallet: 0.4, decay: 0.7, damper: 0.3 },
    },
    effects: [{ deviceId: 'sift', preset: 'Soft hammers', params: { hold: 0.6, attacks: -18 } }],
  },
  {
    id: 'four-against-five-dry-sticks-on-the-stair',
    name: 'Dry sticks on the stair',
    category: 'plucked',
    description:
      'Xylophone struck hard and stopped, in a small boxy room that is over in less than a second.',
    preview: TWENTY,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { volume: 4.5, decay: 0.35, mallet: 0.95, resonator: 0.1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.45, decay: 0.8 } }],
  },
  {
    id: 'four-against-five-celesta-above-the-mill',
    name: 'Celesta above the mill',
    category: 'bell',
    description:
      'Celesta plates through two plain loops of four and five pulses, then a low pass that keeps it behind a door.',
    preview: FIVES_ABOVE,
    instrument: { deviceId: 'mallets', preset: 'Celesta', params: { mallet: 0.5, damper: 0.2 } },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.2, offset: 25, feedback: 0.85, wear: 0, mix: 0.5 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 1300, resonance: 0.9 },
      },
    ],
  },
  {
    id: 'four-against-five-humming-planks',
    name: 'Humming planks',
    category: 'bell',
    description:
      'Long soft marimba bars whose attacks are faded in, so the tubes hum and no stick is heard.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { volume: -1, decay: 3, width: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'four-against-five-slow-fans-by-the-bar',
    name: 'Slow fans by the bar',
    category: 'bell',
    description:
      'Soft vibes whose fans turn once in a bar of three pulses, dragged by a deep slow phaser.',
    preview: THREE_AGAINST_FOUR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1.19, mallet: 0.35, decay: 1.2 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Deep eight-stage', params: { mix: 0.6, rate: 0.2 } }],
  },
  {
    id: 'four-against-five-knuckles-on-five-panes',
    name: 'Knuckles on five panes',
    category: 'bell',
    description:
      'Resonated glockenspiel bars bent toward glass by stretching their overtones, with a mono echo of five pulses.',
    preview: FIVES_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.25, decay: 1, width: 0 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar' },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 1500, feedback: 0.3, spread: 0, mix: 0.3 },
      },
    ],
  },
  {
    id: 'four-against-five-mallets-in-the-attic',
    name: 'Mallets in the attic',
    category: 'plucked',
    description:
      'A warm long xylophone as it would come off a slow worn record, dust and a warped groove with it.',
    preview: BAR_OF_BOTH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { volume: -5, mallet: 0.2, decay: 2 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Charity shop find',
        params: { warp: 0.6, crackle: 0.25, wear: 0.7, tone: -0.5 },
      },
    ],
  },
  {
    id: 'four-against-five-tremble-of-fives',
    name: 'Tremble of fives',
    category: 'bell',
    description:
      'Celesta plates shaken by their fans at ten a second, with a dark octave an echo hops down to.',
    preview: FIVES_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { volume: -5.5, mallet: 0.4, damper: 0.1, width: 0.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hop',
        params: { time: 600, intervalA: 1, intervalB: 1, feedback: 0.4, mix: 0.45, tone: 1800 },
      },
    ],
  },
  {
    id: 'four-against-five-four-planks-under-water',
    name: 'Four planks under water',
    category: 'texture',
    description:
      'Marimba sunk far down, wavering and closed in from the sides, a fast limiter holding it up.',
    preview: FOURS_FORWARD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -14, mallet: 0.8, decay: 2.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Deep water', params: { bubbles: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'four-against-five-roll-of-tin-in-fives',
    name: 'Roll of tin in fives',
    category: 'texture',
    description:
      'Glockenspiel rolled five strokes a second as long as a key is down, thinned and set at the back of a hall.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { volume: -4, roll: 5, decay: 0.5, damper: 0.3, mallet: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { decay: 3 } }],
  },
  {
    id: 'four-against-five-vibes-at-half-pace',
    name: 'Vibes at half pace',
    category: 'bell',
    description:
      'Still vibes and, under them, the same bars replayed at half the speed and an octave down in slow cycles.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { damper: 0.2, mallet: 0.4 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Half speed', params: { length: 1200, mix: 0.6 } }],
  },
  {
    id: 'four-against-five-driven-keyboard-of-wood',
    name: 'Driven keyboard of wood',
    category: 'plucked',
    description:
      'Xylophone over full tubes, pushed through a pentode until they bark, the top taken off after it.',
    preview: TWENTY,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.4, decay: 1.2, resonator: 1 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { circuit: 4, drive: 0.75, highCut: 3500 },
      },
    ],
  },
  {
    id: 'four-against-five-carillon-of-shadows',
    name: 'Carillon of shadows',
    category: 'pad',
    description:
      'Only the shadows of soft glockenspiel bars: their strongest partials redrawn as slow sines that linger.',
    preview: FIVES_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { volume: -5, mallet: 0.1, decay: 0.6 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Shadow alone', params: { attack: 200, release: 2 } },
    ],
  },
  {
    id: 'four-against-five-weaver-at-four-treadles',
    name: 'Weaver at four treadles',
    category: 'plucked',
    description:
      'A medium marimba whose every note comes back in restruck octaves, quick small loops above the stick.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { volume: -3.5, mallet: 0.35, decay: 0.8, resonator: 0.9, width: 0.4 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 300, repeats: 5, mix: 0.6 } },
    ],
  },
  {
    id: 'four-against-five-vibes-rolled-into-air',
    name: 'Vibes rolled into air',
    category: 'pad',
    description:
      'Rolled vibraphone that grows a string pad behind each chord, the bars themselves kept faint.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { roll: 10, mallet: 0.05, motor: 0 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 0.4, mix: 0.8 } }],
  },
  {
    id: 'four-against-five-open-plates-at-dusk',
    name: 'Open plates at dusk',
    category: 'bell',
    description:
      'Open celesta plates with the first blow of each shaved off and the hum brought up by a slow compressor.',
    preview: BAR_OF_BOTH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -20.5, mallet: 0, width: 0.2 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },
  {
    id: 'four-against-five-wooden-roll-in-a-shaft',
    name: 'Wooden roll in a shaft',
    category: 'texture',
    description:
      'A fast roll on wooden bars down a narrow shaft of short dark echoes, all of it in the middle.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { volume: -3.5, roll: 16, width: 0, mallet: 0.6 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.5 } }],
  },
  // Droplets: rain that falls at four or at five a second, or once a bar, on whatever is held.
  {
    id: 'four-against-five-four-drips-a-second',
    name: 'Four drips a second',
    category: 'plucked',
    description:
      'Wooden drops falling evenly, four a second, climbing the held keys where they lie, leaning left and dry.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: -0.5, rain: 4, spread: 0, size: 0.8, ring: 1, trail: 0, width: 0.1 },
    },
    effects: [
      {
        deviceId: 'around',
        preset: 'Wide pendulum',
        params: { rate: 0.01, turn: -90, radius: 0.9 },
      },
    ],
  },
  {
    id: 'four-against-five-glass-by-the-five',
    name: 'Glass by the five',
    category: 'bell',
    description:
      'Glass drops, five a second and even, spread over three octaves, with small sparks over a bright plate.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass pulse',
      params: { volume: -3, rain: 5, spread: 3, size: 0.1, ring: 1.6 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'four-against-five-gutter-in-two-counts',
    name: 'Gutter in two counts',
    category: 'texture',
    description:
      'Water drops at five a second, gated on two of every four quick steps, first on one side and then the other.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Water drops',
      params: {
        volume: -3.5,
        rain: 5,
        loose: 0,
        size: 0.3,
        ring: 4,
        splash: 0.1,
        soft: 0.2,
        spread: 0,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Left then right',
        params: { rate: 6.67, steps: 4, fill: 2, floor: 0.4, edge: 0.2 },
      },
    ],
  },
  {
    id: 'four-against-five-felt-at-every-bar-line',
    name: 'Felt at every bar line',
    category: 'keys',
    description:
      'Round felt drops, one in each bar of four pulses, with the octave below added under them.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt pulse',
      params: { rain: 0.833, size: 0.9, ring: 4, soft: 0.2 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, up1: 0 } }],
  },
  {
    id: 'four-against-five-bells-drip-from-eaves',
    name: 'Bells drip from eaves',
    category: 'bell',
    description:
      'Slow loose metal drops whose echoes scatter like dust across four seconds and never on the pulse.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bell drizzle',
      params: { volume: -5.5, rain: 0.8, spread: 1, trail: 3 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Full sky', params: { span: 4000, mix: 0.5 } }],
  },
  {
    id: 'four-against-five-shower-on-five-roofs',
    name: 'Shower on five roofs',
    category: 'texture',
    description:
      'A thick shower of tiny metal drops, its cloud hung in the spectrum until it is a bright even mist.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Metal shower',
      params: { volume: -6, rain: 20, size: 0.05, ring: 0.8 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.8, blur: 0.7 } },
    ],
  },
  {
    id: 'four-against-five-pool-under-the-bridge',
    name: 'Pool under the bridge',
    category: 'texture',
    description:
      'Big slow water drops with much splash, below ground, in a long dark well of blurred echoes.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 0.667, loose: 0, splash: 0.9 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.55 } }],
  },
  {
    id: 'four-against-five-ticks-of-twenty-clocks',
    name: 'Ticks of twenty clocks',
    category: 'texture',
    description:
      'Fast loose wooden ticks, up to an octave above the keys, through a small horn speaker in an echoing room, peaks held.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood ticks',
      params: { volume: -3, rain: 10, ring: 0.4, spread: 1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { distance: 0.5, noise: 0 } },
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { attack: 10 } },
    ],
  },
  {
    id: 'four-against-five-flurry-and-rest',
    name: 'Flurry and rest',
    category: 'texture',
    description:
      'Glass in flurries and lulls, frozen over: thinned, cold and still, the dial of the year on winter.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'droplets',
      preset: 'Flurries',
      params: { rain: 5, bursts: 1, ring: 1.5, spread: 1 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Frozen lake', params: { mix: 0.8 } }],
  },
  {
    id: 'four-against-five-chime-for-each-fifth',
    name: 'Chime for each fifth',
    category: 'bell',
    description:
      'Long metal chimes, one every five pulses, doubled by glassy octaves, with a thin shining tail.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { rain: 0.667, loose: 0, size: 0.6, ring: 2, spread: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'four-against-five-tin-roof-in-fours',
    name: 'Tin roof in fours',
    category: 'texture',
    description:
      'Short tin drops at sixteen a second, loosely, with a hollow comb that sweeps once in two bars of four.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Tin roof',
      params: { volume: -3, rain: 16, spread: 1, ring: 0.5, splash: 0.4, bursts: 0 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.417, mix: 0.6 } },
    ],
  },
  {
    id: 'four-against-five-felt-rain-held-back',
    name: 'Felt rain, held back',
    category: 'pad',
    description:
      'A patter of felt drops with every attack taken off, left as a soft breathing bed of the held notes.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 8, ring: 2.5, splash: 0, size: 0.6, spread: 0 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 400 } },
      { deviceId: 'currents', preset: 'Breathing', params: { rate: 0.667 } },
    ],
  },
  {
    id: 'four-against-five-glitter-counts-to-five',
    name: 'Glitter counts to five',
    category: 'bell',
    description:
      'The smallest high glass drops at ten a second in strict time, each group of five darkened but the first.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'droplets',
      preset: 'High glitter',
      params: { volume: -1.5, rain: 10, loose: 0, spread: 2, trail: 0.5 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Dark glints',
        params: { rate: 10, steps: 5, fill: 1, drift: 0, floor: 0.3, length: 1 },
      },
    ],
  },
  {
    id: 'four-against-five-bubbles-on-both-sides',
    name: 'Bubbles on both sides',
    category: 'texture',
    description:
      'A stream of rising bubbles caught by two worn loops of four and five pulses, one to each side.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'droplets',
      preset: 'Bubble stream',
      params: { volume: -3.5, rain: 7, size: 0.35, ring: 1.2, spread: 1, splash: 0.1 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Worn layers',
        params: { loops: 2, length: 1.2, offset: 25, feedback: 0.8, spread: 1 },
      },
    ],
  },
  {
    id: 'four-against-five-slow-drip-slow-drop',
    name: 'Slow drip, slow drop',
    category: 'bell',
    description:
      'Single heavy glass drops whose tails sag in pitch as they age, dripping and darkening like wax.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Slow drip',
      params: { volume: -4.5, rain: 0.3, size: 0.5, ring: 2.5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Drip by drip', params: { mix: 0.7 } }],
  },
  // Harp: gut for the hand in fours, wire and silk for the hand in fives.
  {
    id: 'four-against-five-left-hand-in-fours',
    name: 'Left hand in fours',
    category: 'plucked',
    description:
      'Hollow harp plucked mid string with the flesh of the finger, damped a little and leaning left.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 2.5, damp: 0.4, decay: 0.7, halo: 0.1 },
    },
    effects: [
      {
        deviceId: 'around',
        preset: 'Wide pendulum',
        params: { rate: 0.01, turn: -90, radius: 1, head: 0.7 },
      },
    ],
  },
  {
    id: 'four-against-five-right-hand-in-fives',
    name: 'Right hand in fives',
    category: 'plucked',
    description:
      'Steel guzheng strings plucked at the bridge and left open, leaning right, in a bright chamber, driven hard into a limiter.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: -4.5, touch: 0.6, decay: 4, halo: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 130, highCut: 14000, air: 4 } },
      {
        deviceId: 'around',
        preset: 'Wide pendulum',
        params: { rate: 0.01, turn: 90, radius: 1, head: 0.9 },
      },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 22, outputGain: -8.5 } },
    ],
  },
  {
    id: 'four-against-five-silk-turn',
    name: 'Silk turn',
    category: 'plucked',
    description:
      'Soft silk koto, each note pressed a third of a semitone sharp as it rings, a delayed vibrato on the longer ones.',
    preview: SILK,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 0, bend: 33, pluck: 0.14, touch: 0.3 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Late vibrato', params: { wait: 250, depth: 40 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'four-against-five-stopped-strings-in-brick',
    name: 'Stopped strings in brick',
    category: 'plucked',
    description:
      'Dry harp stopped as each key lifts, through a small drum shell that gives every pluck a knock.',
    preview: TWENTY,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { body: 0.6, decay: 0.5 } },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { size: 0.6, mix: 0.6, material: 0.4 } },
    ],
  },
  {
    id: 'four-against-five-harp-between-the-bars',
    name: 'Harp between the bars',
    category: 'string',
    description:
      'A concert harp caught and held as an endless pad that glides from chord to chord, its plucks behind it.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { volume: 4, touch: 0.2, decay: 0.6, halo: 0.2 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.85 } }],
  },
  {
    id: 'four-against-five-three-legged-jig',
    name: 'Three-legged jig',
    category: 'plucked',
    description:
      'Bright guzheng with a wow of slack tape in it and repeats from three heads crowding the gaps.',
    preview: THREE_AGAINST_FOUR,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { volume: 3, touch: 0.65, decay: 1.2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 560, wow: 0.7, feedback: 0.4, mix: 0.55 },
      },
    ],
  },
  {
    id: 'four-against-five-koto-at-the-fourth-gate',
    name: 'Koto at the fourth gate',
    category: 'plucked',
    description:
      'Short koto near the bridge, the strings of an unseen minor chord on A ringing long after each stroke.',
    preview: SILK,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: -1.5, decay: 0.5, halo: 0, damp: 0.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor wash', params: { root: 9, mix: 0.75 } }],
  },
  {
    id: 'four-against-five-glass-strings-apart',
    name: 'Glass strings apart',
    category: 'plucked',
    description:
      'A long clear harp split into colours that arrive one after another, low to high, over a bar of five.',
    preview: DOWNBEATS,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: -0.5, touch: 0.4, decay: 1.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 1500, mix: 0.7, feedback: 0.2 } },
    ],
  },
  {
    id: 'four-against-five-harp-through-a-keyhole',
    name: 'Harp through a keyhole',
    category: 'plucked',
    description:
      'Muted harp in a narrow resonant band that leaps at each pluck and shuts behind it.',
    preview: BAR_OF_BOTH,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: 5.5, touch: 0.7, body: 0.3 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { cutoffHz: 500, resonance: 3, envAmount: 70, mix: 0.95 },
      },
    ],
  },
  {
    id: 'four-against-five-pressed-tones-in-five',
    name: 'Pressed tones in five',
    category: 'plucked',
    description:
      'Koto strings pressed a whole tone, halved in speed beneath themselves and darkened.',
    preview: FIVES_FORWARD,
    instrument: {
      deviceId: 'harp',
      preset: 'Whole tone press',
      params: { volume: 1.5, touch: 0.6, decay: 1 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 1500, mix: 0.75, highCut: 2500 },
      },
    ],
  },
  {
    id: 'four-against-five-rolled-by-the-minute',
    name: 'Rolled by the minute',
    category: 'string',
    description:
      'Slowly rolled harp chords whose plucks fade in like a bow, with two detuned copies far apart.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -3.5, sweep: 0.6, touch: 0.5, halo: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 250 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'four-against-five-loom-of-gut',
    name: 'Loom of gut',
    category: 'plucked',
    description:
      'Harp near the soundboard, overdriven through a transformer and squeezed so plucks and rests are one level.',
    preview: EVERY_PAIR,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { decay: 1.2, body: 1 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { release: 0.5, makeup: 8 } },
    ],
  },
  {
    id: 'four-against-five-cascade-home-on-twenty',
    name: 'Cascade home on twenty',
    category: 'texture',
    description:
      'Guzheng sweeps dissolved into long pale smears of their own pitches, with a little of the octave above.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { volume: 1, sweep: 0.3, touch: 1, halo: 1 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.85, blur: 0.75 } },
    ],
  },
  // Wind harp: the air takes no count, so the count is laid on it.
  {
    id: 'four-against-five-wind-gated-in-fours',
    name: 'Wind gated in fours',
    category: 'string',
    description:
      'A steady low wind harp, humming, let through by a soft gate in three of every four pulses.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { volume: -11, touch: 0.4, release: 1, wind: 0.3, hum: 0.7 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Soft throb',
        params: { rate: 3.33, steps: 4, fill: 3, floor: 0.25, edge: 0.4 },
      },
    ],
  },
  {
    id: 'four-against-five-gale-through-five-reeds',
    name: 'Gale through five reeds',
    category: 'wind',
    description:
      'A high gale on three strings a key, its lows and its glinting highs trading places once every five pulses.',
    preview: HELD_ABOVE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'High gale',
      params: { volume: 1, gust: 0.4, lull: 0, air: 0.15, release: 1.2 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Tilting tone',
        params: { rate: 0.667, depth: 1, crossover: 1200 },
      },
    ],
  },
  {
    id: 'four-against-five-plucked-by-a-fourth-wind',
    name: 'Plucked by a fourth wind',
    category: 'plucked',
    description:
      'Wind harp strings plucked at each key and caught by loops of four and five pulses, hardly any wind after.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -12, wind: 0.05, strings: 2, ring: 1.2, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.2, offset: 25, feedback: 0.75, mix: 0.5 },
      },
    ],
  },
  {
    id: 'four-against-five-whistle-in-a-fifth-wire',
    name: 'Whistle in a fifth wire',
    category: 'wind',
    description:
      'One string a key stepping up its harmonics in the wind, far off, in the open air.',
    preview: TWO_LINES,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { volume: -1.5, gust: 0.6, hum: 0, release: 0.8, touch: 0.3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air' }],
  },
  {
    id: 'four-against-five-breeze-takes-no-count',
    name: 'Breeze takes no count',
    category: 'texture',
    description:
      'A breeze with more air than string, widened at the top and rolled over by a slow surf.',
    preview: HELD_PAIRS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { lull: 0, gust: 0.5, air: 0.8, strings: 1, glint: 1 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.9 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'four-against-five-bare-wire-on-the-ground',
    name: 'Bare wire on the ground',
    category: 'drone',
    description:
      'A single bare string a key, dry and in the middle, sung on by a narrow resonance that climbs its harmonics.',
    preview: PEDAL,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { wind: 0.5, touch: 0.2, hum: 0.4, ring: 6 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Overtone melody',
        params: { root: 2, pace: 3.33, pattern: 1 },
      },
    ],
  },
]
