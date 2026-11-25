import { type FactoryPreset, type Phrase } from '../types'

// Fives, sevens and nines that keep their accent. Every phrase is whole bars on one grid, an
// eighth note of 0.3125 s (96 beats a minute), so any kick lies under any bass and any tune of
// its meter. Each instrument was laid out as a way of making the accent by the room it is made in.

// Kit in seven, 2+2+3, three bars: kick on eighths one and five, rim on three, a brush (a ride on the club kit) laid over each
// long step, the last one filled with toms or congas.
const STEP_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 0, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 0.3125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 0.625, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 0.625, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 0.9375, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 1.25, durSec: 0.125, note: 60, gain: 0.7 },
    { atSec: 1.25, durSec: 0.5, note: 63, gain: 0.3 },
    { atSec: 1.25, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 1.5625, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 1.875, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 2.1875, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 2.1875, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 2.5, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 2.8125, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 2.8125, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 3.125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 3.4375, durSec: 0.125, note: 60, gain: 0.7 },
    { atSec: 3.4375, durSec: 0.5, note: 63, gain: 0.3 },
    { atSec: 3.4375, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 3.75, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 4.0625, durSec: 0.0938, note: 67, gain: 0.25 },
    { atSec: 4.375, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 4.375, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 4.6875, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 5, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 5.3125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5.625, durSec: 0.125, note: 60, gain: 0.7 },
    { atSec: 5.625, durSec: 0.5, note: 63, gain: 0.3 },
    { atSec: 5.625, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 5.9375, durSec: 0.125, note: 71, gain: 0.45 },
    { atSec: 6.25, durSec: 0.125, note: 69, gain: 0.5 },
  ],
}

// Kit in seven turned round, 3+2+2, three bars: kick on one, rim on four, low tom or conga on six.
const STEP_TURNED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 0, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 0.3125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 0.625, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 0.9375, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 0.9375, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 1.25, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 1.5625, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 1.5625, durSec: 0.125, note: 69, gain: 0.5 },
    { atSec: 1.875, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 2.1875, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 2.1875, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 2.5, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 2.8125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 3.125, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 3.125, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 3.4375, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 3.75, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 3.75, durSec: 0.125, note: 69, gain: 0.5 },
    { atSec: 4.0625, durSec: 0.125, note: 60, gain: 0.5 },
    { atSec: 4.0625, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 4.375, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 4.375, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 4.6875, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5.3125, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 5.3125, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 5.625, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5.9375, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 5.9375, durSec: 0.125, note: 69, gain: 0.5 },
    { atSec: 6.25, durSec: 0.125, note: 62, gain: 0.35 },
    { atSec: 6.25, durSec: 0.0938, note: 66, gain: 0.2 },
  ],
}

// Kit in five, 3+2, two bars: kick on one and four, rim on three, snare on five.
const STEP_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 0, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 0.625, durSec: 0.125, note: 63, gain: 0.35 },
    { atSec: 0.625, durSec: 0.0938, note: 65, gain: 0.22 },
    { atSec: 0.9375, durSec: 0.0938, note: 66, gain: 0.15 },
    { atSec: 1.25, durSec: 0.125, note: 64, gain: 0.4 },
    { atSec: 1.25, durSec: 0.0938, note: 65, gain: 0.22 },
    { atSec: 1.5625, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 1.875, durSec: 0.125, note: 60, gain: 0.7 },
    { atSec: 1.875, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 2.5, durSec: 0.125, note: 62, gain: 0.5 },
    { atSec: 2.5, durSec: 0.0938, note: 65, gain: 0.22 },
    { atSec: 2.8125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 3.125, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 3.125, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 3.75, durSec: 0.125, note: 63, gain: 0.35 },
    { atSec: 3.75, durSec: 0.0938, note: 65, gain: 0.22 },
    { atSec: 4.0625, durSec: 0.125, note: 60, gain: 0.5 },
    { atSec: 4.375, durSec: 0.125, note: 64, gain: 0.4 },
    { atSec: 4.375, durSec: 0.0938, note: 65, gain: 0.22 },
    { atSec: 4.6875, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5, durSec: 0.125, note: 60, gain: 0.7 },
    { atSec: 5, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 5.625, durSec: 0.125, note: 62, gain: 0.5 },
    { atSec: 5.625, durSec: 0.0938, note: 65, gain: 0.22 },
    { atSec: 5.9375, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 5.9375, durSec: 0.125, note: 69, gain: 0.4 },
  ],
}

// Kit in nine, 2+2+2+3, two bars and the downbeat: kick, rim, kick, then a low tom or conga on the long fourth group.
const STEP_NINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 0, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 0.3125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 0.625, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 0.625, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 0.9375, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 1.25, durSec: 0.125, note: 60, gain: 0.65 },
    { atSec: 1.25, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 1.5625, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 1.875, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 1.875, durSec: 0.3125, note: 69, gain: 0.6 },
    { atSec: 2.5, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 2.8125, durSec: 0.125, note: 60, gain: 0.8 },
    { atSec: 2.8125, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 3.125, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 3.4375, durSec: 0.125, note: 64, gain: 0.5 },
    { atSec: 3.4375, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 3.75, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 4.0625, durSec: 0.125, note: 60, gain: 0.65 },
    { atSec: 4.0625, durSec: 0.0938, note: 65, gain: 0.25 },
    { atSec: 4.375, durSec: 0.0938, note: 66, gain: 0.2 },
    { atSec: 4.6875, durSec: 0.0938, note: 65, gain: 0.3 },
    { atSec: 4.6875, durSec: 0.3125, note: 69, gain: 0.6 },
    { atSec: 5, durSec: 0.125, note: 71, gain: 0.4 },
    { atSec: 5.3125, durSec: 0.125, note: 69, gain: 0.3 },
    { atSec: 5.625, durSec: 0.125, note: 60, gain: 0.7 },
  ],
}

// Bass in seven, 2+2+3: Am9, Fmaj7 and home, an octave A, the fifth as the pickup.
const WALK_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5625, note: 45, gain: 0.65 },
    { atSec: 0.625, durSec: 0.5625, note: 52, gain: 0.45 },
    { atSec: 1.25, durSec: 0.875, note: 45, gain: 0.55 },
    { atSec: 2.1875, durSec: 0.5625, note: 41, gain: 0.65 },
    { atSec: 2.8125, durSec: 0.5625, note: 48, gain: 0.45 },
    { atSec: 3.4375, durSec: 0.5938, note: 41, gain: 0.55 },
    { atSec: 4.0625, durSec: 0.2812, note: 40, gain: 0.45 },
    { atSec: 4.375, durSec: 1.875, note: 33, gain: 0.65 },
  ],
}

// Bass in seven, 3+2+2: the first pulse and the last, Dm9 to G13 and back to D.
const WALK_TURNED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4688, note: 38, gain: 0.65 },
    { atSec: 1.5625, durSec: 0.5625, note: 45, gain: 0.5 },
    { atSec: 2.1875, durSec: 1.4688, note: 43, gain: 0.65 },
    { atSec: 3.75, durSec: 0.5625, note: 38, gain: 0.5 },
    { atSec: 4.375, durSec: 1.875, note: 38, gain: 0.65 },
  ],
}

// Bass in five, 3+2, A dorian: Am over the three, D with its F sharp over the two.
const WALK_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8438, note: 45, gain: 0.65 },
    { atSec: 0.9375, durSec: 0.2812, note: 40, gain: 0.45 },
    { atSec: 1.25, durSec: 0.5625, note: 43, gain: 0.5 },
    { atSec: 1.875, durSec: 0.5625, note: 42, gain: 0.6 },
    { atSec: 2.5, durSec: 0.5625, note: 40, gain: 0.45 },
    { atSec: 3.125, durSec: 0.8438, note: 45, gain: 0.65 },
    { atSec: 4.0625, durSec: 0.2812, note: 40, gain: 0.45 },
    { atSec: 4.375, durSec: 0.5625, note: 45, gain: 0.5 },
    { atSec: 5, durSec: 0.5625, note: 38, gain: 0.6 },
    { atSec: 5.625, durSec: 0.5625, note: 40, gain: 0.5 },
    { atSec: 6.25, durSec: 0.9375, note: 33, gain: 0.6 },
  ],
}

// Bass in nine, 2+2+2+3: Dm, then G; Dm, G and C the next time round.
const WALK_NINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5625, note: 38, gain: 0.65 },
    { atSec: 0.625, durSec: 0.5625, note: 45, gain: 0.45 },
    { atSec: 1.25, durSec: 0.5625, note: 48, gain: 0.45 },
    { atSec: 1.875, durSec: 0.875, note: 43, gain: 0.6 },
    { atSec: 2.8125, durSec: 0.5625, note: 38, gain: 0.65 },
    { atSec: 3.4375, durSec: 0.5625, note: 45, gain: 0.45 },
    { atSec: 4.0625, durSec: 0.5625, note: 43, gain: 0.5 },
    { atSec: 4.6875, durSec: 0.875, note: 36, gain: 0.6 },
    { atSec: 5.625, durSec: 1.25, note: 38, gain: 0.6 },
  ],
}

// Keys in seven, 2+2+3: Am9 to Fmaj7 with a raised fourth that falls, and round to A.
const TILES_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.125, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 2.125, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 2.125, note: 55, gain: 0.35 },
    { atSec: 0, durSec: 2.125, note: 60, gain: 0.35 },
    { atSec: 0, durSec: 0.5938, note: 64, gain: 0.5 },
    { atSec: 0.625, durSec: 0.5938, note: 67, gain: 0.45 },
    { atSec: 1.25, durSec: 0.9062, note: 71, gain: 0.5 },
    { atSec: 2.1875, durSec: 2.125, note: 41, gain: 0.5 },
    { atSec: 2.1875, durSec: 2.125, note: 52, gain: 0.35 },
    { atSec: 2.1875, durSec: 2.125, note: 57, gain: 0.35 },
    { atSec: 2.1875, durSec: 2.125, note: 60, gain: 0.35 },
    { atSec: 2.1875, durSec: 0.5938, note: 64, gain: 0.45 },
    { atSec: 2.8125, durSec: 0.5938, note: 71, gain: 0.5 },
    { atSec: 3.4375, durSec: 0.9062, note: 69, gain: 0.5 },
    { atSec: 4.375, durSec: 1.875, note: 45, gain: 0.5 },
    { atSec: 4.375, durSec: 1.875, note: 52, gain: 0.4 },
    { atSec: 4.375, durSec: 1.875, note: 60, gain: 0.35 },
    { atSec: 4.375, durSec: 1.875, note: 71, gain: 0.4 },
  ],
}

// Keys in seven, 3+2+2: Dm9, G13 and back, the seventh falling to the third of the next chord.
const TILES_TURNED: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.125, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 2.125, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 2.125, note: 65, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 72, gain: 0.35 },
    { atSec: 0, durSec: 0.9062, note: 76, gain: 0.5 },
    { atSec: 0.9375, durSec: 0.5938, note: 74, gain: 0.4 },
    { atSec: 1.5625, durSec: 0.5938, note: 72, gain: 0.4 },
    { atSec: 2.1875, durSec: 2.125, note: 43, gain: 0.5 },
    { atSec: 2.1875, durSec: 2.125, note: 53, gain: 0.35 },
    { atSec: 2.1875, durSec: 2.125, note: 57, gain: 0.3 },
    { atSec: 2.1875, durSec: 1.5, note: 71, gain: 0.35 },
    { atSec: 2.1875, durSec: 0.9062, note: 76, gain: 0.5 },
    { atSec: 3.125, durSec: 0.5938, note: 74, gain: 0.4 },
    { atSec: 3.75, durSec: 0.5938, note: 71, gain: 0.4 },
    { atSec: 4.375, durSec: 1.875, note: 50, gain: 0.5 },
    { atSec: 4.375, durSec: 1.875, note: 57, gain: 0.4 },
    { atSec: 4.375, durSec: 1.875, note: 60, gain: 0.4 },
    { atSec: 4.375, durSec: 1.875, note: 65, gain: 0.35 },
    { atSec: 4.375, durSec: 1.875, note: 76, gain: 0.4 },
  ],
}

// Keys in five, 3+2, A dorian: A and E on the three, C, E and G on the two; then A and E again, and D7 on the two, its F sharp the dorian sixth.
const TILES_FIVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8125, note: 45, gain: 0.55 },
    { atSec: 0.9375, durSec: 0.875, note: 52, gain: 0.45 },
    { atSec: 1.875, durSec: 1.1875, note: 60, gain: 0.5 },
    { atSec: 2.1875, durSec: 0.875, note: 64, gain: 0.45 },
    { atSec: 2.5, durSec: 0.5938, note: 67, gain: 0.5 },
    { atSec: 3.125, durSec: 1.8125, note: 45, gain: 0.55 },
    { atSec: 4.0625, durSec: 0.875, note: 52, gain: 0.45 },
    { atSec: 5, durSec: 1.8125, note: 50, gain: 0.4 },
    { atSec: 5, durSec: 1.8125, note: 60, gain: 0.45 },
    { atSec: 5.3125, durSec: 1.5, note: 66, gain: 0.45 },
    { atSec: 5.625, durSec: 1.1875, note: 69, gain: 0.5 },
  ],
}

// Keys in nine, 2+2+2+3: Dm9 and G with the tune falling, Dm7, G7 and Cmaj7 with it rising back.
const TILES_NINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8125, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 1.8125, note: 57, gain: 0.35 },
    { atSec: 0, durSec: 1.8125, note: 65, gain: 0.35 },
    { atSec: 0, durSec: 0.5938, note: 76, gain: 0.5 },
    { atSec: 0.625, durSec: 0.5938, note: 74, gain: 0.4 },
    { atSec: 1.25, durSec: 0.5938, note: 72, gain: 0.4 },
    { atSec: 1.875, durSec: 0.875, note: 43, gain: 0.5 },
    { atSec: 1.875, durSec: 0.875, note: 55, gain: 0.35 },
    { atSec: 1.875, durSec: 0.875, note: 62, gain: 0.35 },
    { atSec: 1.875, durSec: 0.875, note: 71, gain: 0.5 },
    { atSec: 2.8125, durSec: 1.1875, note: 50, gain: 0.5 },
    { atSec: 2.8125, durSec: 1.1875, note: 57, gain: 0.35 },
    { atSec: 2.8125, durSec: 1.1875, note: 65, gain: 0.35 },
    { atSec: 2.8125, durSec: 0.5938, note: 69, gain: 0.45 },
    { atSec: 3.4375, durSec: 0.5938, note: 72, gain: 0.4 },
    { atSec: 4.0625, durSec: 0.5938, note: 43, gain: 0.5 },
    { atSec: 4.0625, durSec: 0.5938, note: 59, gain: 0.35 },
    { atSec: 4.0625, durSec: 0.5938, note: 65, gain: 0.35 },
    { atSec: 4.0625, durSec: 0.5938, note: 74, gain: 0.45 },
    { atSec: 4.6875, durSec: 1.4062, note: 48, gain: 0.5 },
    { atSec: 4.6875, durSec: 1.4062, note: 59, gain: 0.35 },
    { atSec: 4.6875, durSec: 1.4062, note: 64, gain: 0.35 },
    { atSec: 4.6875, durSec: 1.4062, note: 76, gain: 0.5 },
  ],
}

// Chords in seven, changing hands on the first and fifth eighths: Am7 and Fmaj9 under a line that falls from E to A.
const SLAB_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1562, note: 45, gain: 0.45 },
    { atSec: 0, durSec: 2.1562, note: 55, gain: 0.3 },
    { atSec: 0, durSec: 2.1562, note: 60, gain: 0.3 },
    { atSec: 0, durSec: 2.1562, note: 64, gain: 0.3 },
    { atSec: 0, durSec: 1.2344, note: 76, gain: 0.4 },
    { atSec: 1.25, durSec: 0.9062, note: 74, gain: 0.4 },
    { atSec: 2.1875, durSec: 2.1562, note: 41, gain: 0.45 },
    { atSec: 2.1875, durSec: 2.1562, note: 55, gain: 0.3 },
    { atSec: 2.1875, durSec: 2.1562, note: 57, gain: 0.3 },
    { atSec: 2.1875, durSec: 2.1562, note: 64, gain: 0.3 },
    { atSec: 2.1875, durSec: 1.2344, note: 72, gain: 0.4 },
    { atSec: 3.4375, durSec: 0.9062, note: 71, gain: 0.4 },
    { atSec: 4.375, durSec: 1.5625, note: 45, gain: 0.45 },
    { atSec: 4.375, durSec: 1.5625, note: 55, gain: 0.3 },
    { atSec: 4.375, durSec: 1.5625, note: 60, gain: 0.3 },
    { atSec: 4.375, durSec: 1.5625, note: 64, gain: 0.3 },
    { atSec: 4.375, durSec: 1.5625, note: 69, gain: 0.4 },
  ],
}

// A plucked line in seven, 2+2+3, three bars: A minor rising, F with its raised fourth falling, A minor up to
// the ninth. Each bar rests on its long step.
const PICK_SEVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5938, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 0.5938, note: 64, gain: 0.55 },
    { atSec: 0.625, durSec: 0.5938, note: 67, gain: 0.45 },
    { atSec: 1.25, durSec: 0.9062, note: 69, gain: 0.5 },
    { atSec: 2.1875, durSec: 0.5938, note: 65, gain: 0.4 },
    { atSec: 2.1875, durSec: 0.5938, note: 72, gain: 0.55 },
    { atSec: 2.8125, durSec: 0.5938, note: 71, gain: 0.45 },
    { atSec: 3.4375, durSec: 0.9062, note: 69, gain: 0.5 },
    { atSec: 4.375, durSec: 0.5938, note: 57, gain: 0.4 },
    { atSec: 4.375, durSec: 0.5938, note: 64, gain: 0.55 },
    { atSec: 5, durSec: 0.5938, note: 67, gain: 0.45 },
    { atSec: 5.625, durSec: 0.9062, note: 71, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'every-meter-limp-with-a-long-step',
    name: 'Limp with a long step',
    category: 'drum',
    description:
      'The soft kit with felted strokes, lengthened a little, with a small plate close behind it.',
    preview: STEP_SEVEN,
    instrument: { deviceId: 'drum-kit', preset: 'Felt kit', params: { length: 1.4, tone: 0.4 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.24 } }],
  },
  {
    id: 'every-meter-short-short-long',
    name: 'Short short long',
    category: 'drum',
    description:
      'The paper kit tuned up and cut a little short, a hint of spring behind it and its width drawn in.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Paper kit',
      params: { tune: 4, length: 0.75, snap: 0.35 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.22 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'every-meter-seven-on-the-cellar-door',
    name: 'Seven on the cellar door',
    category: 'drum',
    description:
      'The deep kit darkened and weighted by a thumping cassette, in a small dark booth.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Deep and slow',
      params: { length: 1.1, tone: 0.35 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { wow: 0.05 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { damping: 0.7, mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-brush-on-the-last-three',
    name: 'Brush on the last three',
    category: 'drum',
    description:
      'The soft kit with no click at all, tuned up a fourth and levelled hard, so the long brush strokes stand out, under a faint plate.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Brushed',
      params: { tune: 5, variation: 0.6, volume: -6.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: 0 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3, decay: 0.55 } },
    ],
  },
  {
    id: 'every-meter-tom-on-the-fourth-group',
    name: 'Tom on the fourth group',
    category: 'drum',
    description: 'Long soft toms and kicks rolling down a dark hall.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Long toms',
      params: { tune: -4, length: 3, snap: 0.15 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } }],
  },
  {
    id: 'every-meter-counting-on-a-tin-radio',
    name: 'Counting on a tin radio',
    category: 'drum',
    description:
      'The tight kit played through a bedside loudspeaker, saturated on tape on the way in.',
    preview: STEP_FIVE,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Small and tight',
      params: { length: 2, drive: 0.6, punch: 0, snap: 0.2, tone: 0.5, volume: -12.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 20, outputDb: -12 } },
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { noise: 0.02, bass: 0.6, room: 0.5, output: 9 },
      },
    ],
  },
  {
    id: 'every-meter-wool-over-the-bar-line',
    name: 'Wool over the bar line',
    category: 'drum',
    description:
      'The deep kit dulled and nine semitones down, rounded by tape saturation into a short ambience.',
    preview: STEP_FIVE,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Dark room',
      params: { drive: 0.1, length: 1.6, tone: 0.2, tune: -9, volume: -11.5 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { toneDb: -4 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-every-stroke-told-twice',
    name: 'Every stroke told twice',
    category: 'drum',
    description: 'Bright ticks with one dark echo an eighth note later.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Bright ticks',
      params: { length: 0.6, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 312, feedback: 0, modDepth: 0.05, mix: 0.35 },
      },
    ],
  },
  {
    id: 'every-meter-nine-drips-in-a-cistern',
    name: 'Nine drips in a cistern',
    category: 'drum',
    description: 'The deep kit with no snap at all, pattering in a dark swarm of close echoes.',
    preview: STEP_NINE,
    instrument: { deviceId: 'drum-kit', preset: 'Low and far', params: { tune: -4, width: 0.7 } },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Dark well',
        params: { length: 0.35, feedback: 0.4, mix: 0.32 },
      },
    ],
  },
  {
    id: 'every-meter-toy-cart-odd-wheel',
    name: 'Toy cart, odd wheel',
    category: 'drum',
    description:
      'Paper drums tuned up ten semitones and resampled like a toy, their top shaded, no room.',
    preview: STEP_TURNED,
    instrument: { deviceId: 'drum-kit', preset: 'Toy box', params: { length: 1.3 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'every-meter-folded-card-in-five',
    name: 'Folded card in five',
    category: 'drum',
    description: 'Low paper thuds with a worn record turning under them.',
    preview: STEP_FIVE,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Paper thuds',
      params: { length: 1.8, punch: 0.6 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { crackle: 0.35, pops: 0.15 } },
    ],
  },
  {
    id: 'every-meter-heavy-foot-on-the-stairs',
    name: 'Heavy foot on the stairs',
    category: 'drum',
    description:
      'The deep kit an octave down, its kicks long and lightly driven, heard from up a stone stairwell.',
    preview: STEP_TURNED,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Heavy steps',
      params: { length: 2.2, drive: 0.2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.4, decay: 2 } },
    ],
  },
  {
    id: 'every-meter-seven-knocks-in-a-barrel',
    name: 'Seven knocks in a barrel',
    category: 'drum',
    description: 'Muffled drums ringing inside a drum shell of twice the usual size.',
    preview: STEP_SEVEN,
    instrument: { deviceId: 'drum-kit', preset: 'Muffled', params: { punch: 0.4, width: 0.4 } },
    effects: [{ deviceId: 'vessel', preset: 'Drum head', params: { size: 2, mix: 0.45 } }],
  },
  {
    id: 'every-meter-dust-on-the-odd-beat',
    name: 'Dust on the odd beat',
    category: 'drum',
    description: 'Dusty paper drums with some drive, each ended by a gated burst of room.',
    preview: STEP_FIVE,
    instrument: { deviceId: 'drum-kit', preset: 'Dusty', params: { drive: 0.5, length: 1.1 } },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.28, mix: 0.3 } }],
  },
  {
    id: 'every-meter-nine-in-the-open-field',
    name: 'Nine in the open field',
    category: 'drum',
    description:
      'The airy kit with its tone wide open, outdoors, where only a short reflection comes back.',
    preview: STEP_NINE,
    instrument: { deviceId: 'drum-kit', preset: 'Airy and long', params: { length: 2.2 } },
    effects: [{ deviceId: 'distance', preset: 'Open air', params: { distance: 0.5 } }],
  },
  {
    id: 'every-meter-missing-sleeper',
    name: 'Missing sleeper',
    category: 'drum',
    description:
      'The tight kit driven hard and held under a low-pass, like wheels on a gap heard through a floor, on a dark spring.',
    preview: STEP_TURNED,
    instrument: { deviceId: 'drum-kit', preset: 'Pushed hard', params: { drive: 0.8 } },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 750, resonance: 0.9 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'every-meter-kit-that-hums-in-a',
    name: 'Kit that hums in A',
    category: 'drum',
    description: 'Soft felt strokes with a filter ringing only the notes of A minor out of them.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Felt kit',
      params: { tune: 2, length: 0.8, snap: 0.3, volume: 4.5 },
    },
    effects: [{ deviceId: 'scale-filter', preset: 'Minor triad', params: { ring: 2.2, mix: 0.6 } }],
  },
  {
    id: 'every-meter-canal-boat-engine',
    name: 'Canal boat engine',
    category: 'drum',
    description:
      'The soft kit with no click, tuned down, lengthened and sunk just under water, wavering slowly.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Brushed',
      params: { tune: -5, length: 2.4, punch: 0.35 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.15 } }],
  },
  {
    id: 'every-meter-two-feet-and-a-long-one',
    name: 'Two feet and a long one',
    category: 'drum',
    description:
      'The deep kit with its top opened, a slow phaser turning its hats and noise over, in a tight room.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Deep and slow',
      params: { tune: 3, length: 0.75, snap: 0.5, tone: 0.75, volume: 1 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.2, mix: 0.55 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-ticks-two-and-three-late',
    name: 'Ticks two and three late',
    category: 'drum',
    description: 'High paper ticks repeated by two tape heads, two eighths later and then three.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Paper kit',
      params: { tune: 10, length: 0.7, tone: 0.7, width: 0.9, punch: 0.6, volume: 2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { heads: 3, time: 937, feedback: 0.1, highCut: 3800, mix: 0.35 },
      },
    ],
  },
  {
    id: 'every-meter-step-over-the-gap',
    name: 'Step over the gap',
    category: 'drum',
    description:
      'The firm kit shortened and softened, its strokes squeezed by a quick compressor, nearly dry.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Tight and dry',
      params: { volume: 1, snap: 0.3, punch: 0.4 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 2 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'every-meter-floor-missing-a-beat',
    name: 'Floor missing a beat',
    category: 'drum',
    description:
      'The deep kit shortened, played through a dark woolly speaker turned away from the microphone.',
    preview: STEP_FIVE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Deep and round',
      params: { length: 0.8, tone: 0.35 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly', params: { drive: 0.2, mix: 0.8 } }],
  },
  {
    id: 'every-meter-nine-dancers-one-slow',
    name: 'Nine dancers, one slow',
    category: 'drum',
    description: 'Long open drums doubled by a loose slow chorus and set in a small room.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Long and open',
      params: { snap: 0.25, tone: 0.45, volume: 3 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'every-meter-turn-on-the-third-group',
    name: 'Turn on the third group',
    category: 'drum',
    description:
      'The late kit low and long with an echo of two eighths running into the long step.',
    preview: STEP_SEVEN,
    instrument: { deviceId: 'club-kit', preset: 'Late night', params: { tune: -3, tone: 0.4 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 625, feedback: 0.35, mix: 0.3 },
      },
    ],
  },
  {
    id: 'every-meter-sevens-on-warm-wood',
    name: 'Sevens on warm wood',
    category: 'drum',
    description: 'Warm soft drums heard inside a small wooden soundboard.',
    preview: STEP_SEVEN,
    instrument: { deviceId: 'club-kit', preset: 'Warm and soft', params: { tune: 2, punch: 0.3 } },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.7, mix: 0.55 } }],
  },
  {
    id: 'every-meter-attic-dust-in-five',
    name: 'Attic dust in five',
    category: 'drum',
    description: 'Dusty drums through an early sampler, its top worn off.',
    preview: STEP_FIVE,
    instrument: { deviceId: 'club-kit', preset: 'Dusty box', params: { length: 0.9, tone: 0.4 } },
    effects: [{ deviceId: 'patina', preset: 'Muffled sampler', params: { tone: 0.35 } }],
  },
  {
    id: 'every-meter-worn-step-worn-tape',
    name: 'Worn step, worn tape',
    category: 'drum',
    description:
      'The dusty kit on a thin slow tape that wows and drops out, with a narrow warm spring.',
    preview: STEP_TURNED,
    instrument: { deviceId: 'club-kit', preset: 'Worn tape', params: { length: 0.9 } },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.35, hiss: 0.25, age: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-small-box-odd-number',
    name: 'Small box, odd number',
    category: 'drum',
    description:
      'A small dusty kit a fourth up, a little ring modulation buzzing on its hats and rims, a small plate behind.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Small dusty kit',
      params: { length: 0.8, volume: 1.5 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Tin box', params: { mix: 0.18 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'every-meter-crisp-corners',
    name: 'Crisp corners',
    category: 'drum',
    description:
      'The bright kit with its punch let down, hollowed by a slow flanger, levelled hard in a short bright chamber.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Bright and crisp',
      params: { length: 1.1, snap: 0.4, punch: 0.2, tone: 0.45, volume: -2 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.15, mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -3 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'every-meter-glass-on-the-pulse',
    name: 'Glass on the pulse',
    category: 'drum',
    description:
      'Glassy bright tops with sparse pieces of them thrown up an octave or two, on a short bright plate.',
    preview: STEP_NINE,
    instrument: { deviceId: 'club-kit', preset: 'Glass tops', params: { length: 0.8, tone: 0.8 } },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.18, decay: 0.5 } },
    ],
  },
  {
    id: 'every-meter-congas-on-the-long-step',
    name: 'Congas on the long step',
    category: 'drum',
    description:
      'The firm kit tuned down a fourth and lengthened, so its drums ring on in a small room.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Four on the floor',
      params: { tune: -5, length: 1.9, punch: 0.3, snap: 0.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22, breathDepth: 0 } }],
  },
  {
    id: 'every-meter-heavy-three-light-two',
    name: 'Heavy three, light two',
    category: 'drum',
    description:
      'Low heavy drums with some drive, the bass gathered to the middle and the top opened.',
    preview: STEP_FIVE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Low and heavy',
      params: { length: 0.8, drive: 0.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'every-meter-far-side-of-the-bar-line',
    name: 'Far side of the bar line',
    category: 'drum',
    description: 'High snappy drums heard at the back of a hall.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'High and snappy',
      params: { snap: 0.45, punch: 0.5, volume: 6 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.6, decay: 1.8 } },
    ],
  },
  {
    id: 'every-meter-grit-under-beat-five',
    name: 'Grit under beat five',
    category: 'drum',
    description:
      'The gritty kit with a valve pushed into dark fuzz mixed half and half, under a low-pass.',
    preview: STEP_FIVE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Gritty and driven',
      params: { tone: 0.45, drive: 0.6 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 2600, resonance: 0.7 },
      },
    ],
  },
  {
    id: 'every-meter-driven-round-the-corner',
    name: 'Driven round the corner',
    category: 'drum',
    description:
      'The firm driven kit swept by a filter that opens on each stroke and closes again, into a spring tank.',
    preview: STEP_TURNED,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Driven floor',
      params: { drive: 0.4, length: 0.9 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { cutoffHz: 420, envAttackMs: 5, envReleaseMs: 220, driveDb: 2 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-low-lantern-in-seven',
    name: 'Low lantern in seven',
    category: 'drum',
    description:
      'The deep late kit shortened and darkened, followed by five soft echoes scattered over four eighths.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Late night',
      params: { length: 0.7, snap: 0.4, tone: 0.2, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Dark field',
        params: { span: 1250, stars: 5, again: 0.1, mix: 0.35 },
      },
    ],
  },
  {
    id: 'every-meter-deep-kit-strings-under',
    name: 'Deep kit, strings under',
    category: 'drum',
    description: 'The deep kit setting twelve strings tuned to A minor ringing behind it.',
    preview: STEP_TURNED,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Deep and round',
      params: { tune: 2, snap: 0.45, tone: 0.6 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 3, mix: 0.4 } }],
  },
  {
    id: 'every-meter-strikes-sent-after',
    name: 'Strikes sent after',
    category: 'drum',
    description:
      'Bright drums pulled apart: the tones come first and the strikes arrive a moment after them.',
    preview: STEP_FIVE,
    instrument: { deviceId: 'club-kit', preset: 'Peak time', params: { drive: 0.1, punch: 0.4 } },
    effects: [
      { deviceId: 'sift', preset: 'Strike just after' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'every-meter-grains-between-steps',
    name: 'Grains between steps',
    category: 'drum',
    description: 'Warm soft drums with grains of them repeated an octave up, an eighth late.',
    preview: STEP_SEVEN,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Warm and soft',
      params: { length: 1.5, tone: 0.5, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Plain repeat',
        params: { time: 312, pitch: 12, feedback: 0.25, mix: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'every-meter-brick-floor-nine-bricks',
    name: 'Brick floor, nine bricks',
    category: 'drum',
    description: 'Bright crisp drums tuned down a fifth into a short metal-sided swarm of echoes.',
    preview: STEP_NINE,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Bright and crisp',
      params: { tune: -7, length: 1.2, snap: 0.5, tone: 0.4 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Metal pipe',
        params: { length: 0.2, feedback: 0.35, mix: 0.25 },
      },
    ],
  },
  {
    id: 'every-meter-home-on-the-long-step',
    name: 'Home on the long step',
    category: 'bass',
    description:
      'A fingered electric bass near the neck, its sustain drawn out by a compressor, heard inside a small wooden body.',
    preview: WALK_SEVEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { position: 0.36, tone: 0.4, sustain: 8 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 8 } },
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.8, mix: 0.55 } },
    ],
  },
  {
    id: 'every-meter-first-pulse-and-last',
    name: 'First pulse and last',
    category: 'bass',
    description:
      'A quiet deep fretless played long, with a dark section of strings swelling in behind each note.',
    preview: WALK_TURNED,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { growl: 0.6, release: 0.5, volume: -2 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { octaves: 0.4, mix: 0.4 } },
    ],
  },
  {
    id: 'every-meter-sharp-sixth-on-the-two',
    name: 'Sharp sixth on the two',
    category: 'bass',
    description: 'An upright plucked firmly near the bridge, through a combo in a room.',
    preview: WALK_FIVE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { touch: 0.5, position: 0.13, tone: 0.65, sustain: 5, volume: 6 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.15 } }],
  },
  {
    id: 'every-meter-pedestal-of-nine',
    name: 'Pedestal of nine',
    category: 'bass',
    description:
      'A dark soft upright with a long wooden ring and the octave below drawn under it, a dark plate behind.',
    preview: WALK_NINE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { mute: 0, sustain: 12, release: 0.3, tone: 0.25 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.6, dry: 1, filter: 900 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'every-meter-pickup-on-the-seventh',
    name: 'Pickup on the seventh',
    category: 'bass',
    description: 'A pick on muted strings with one dark echo an eighth note behind.',
    preview: WALK_SEVEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.5, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 312, feedback: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'every-meter-uneven-tide-low-side',
    name: 'Uneven tide, low side',
    category: 'bass',
    description:
      'A singing fretless whose bands drift slowly from side to side above a bass that stays put.',
    preview: WALK_NINE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { release: 0.35, growl: 0.5 },
    },
    effects: [{ deviceId: 'currents', preset: 'Side to side', params: { lowHold: 90 } }],
  },
  {
    id: 'every-meter-thumb-on-the-threes',
    name: 'Thumb on the threes',
    category: 'bass',
    description:
      'A thumb at the neck, each attack faded in by a volume pedal, trembling once an eighth note.',
    preview: WALK_TURNED,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { sustain: 6, volume: 5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.2, depth: 0.6, drift: 0 } },
    ],
  },
  {
    id: 'every-meter-rubber-bridge-in-five',
    name: 'Rubber bridge in five',
    category: 'bass',
    description:
      'A muted thud with almost no ring, resampled by an early sampler that leaves a little grain on it.',
    preview: WALK_FIVE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { mute: 0.8, tone: 0.6, volume: 6 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { drive: 0.7, tone: 0.7, output: 5 } },
    ],
  },
  {
    id: 'every-meter-six-and-a-lean',
    name: 'Six and a lean',
    category: 'bass',
    description: 'A growling fretless through a slow phaser that leaves the bottom alone.',
    preview: WALK_SEVEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { tone: 0.55, touch: 0.4, volume: -2.5 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.6 } }],
  },
  {
    id: 'every-meter-rattle-on-the-group',
    name: 'Rattle on the group',
    category: 'bass',
    description:
      'A picked bass rattling on its frets, the rattle darkened by a valve at the edge of fuzz.',
    preview: WALK_FIVE,
    instrument: { deviceId: 'string-bass', preset: 'Pick with a rattle', params: { sustain: 5 } },
    effects: [{ deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.7 } }],
  },
  {
    id: 'every-meter-barn-floor-in-nine',
    name: 'Barn floor in nine',
    category: 'bass',
    description: 'A slapped upright left ringing, heard down a hall through an amplifier.',
    preview: WALK_NINE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { touch: 0.5, sustain: 9, volume: 3.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.6 } }],
  },
  {
    id: 'every-meter-seven-rungs-one-ring',
    name: 'Seven rungs, one ring',
    category: 'bass',
    description: 'A long wooden upright with strings tuned to A minor ringing after it.',
    preview: WALK_SEVEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { resonance: 0.6, sustain: 8, release: 0.5, touch: 0.15, volume: 1 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 6, mix: 0.5 } }],
  },
  {
    id: 'every-meter-wire-near-the-saddle',
    name: 'Wire near the saddle',
    category: 'bass',
    description:
      'A bass plucked close by the bridge, thin and nasal, doubled by a chorus and caught by a spring.',
    preview: WALK_TURNED,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { position: 0.05, tone: 0.85, mute: 0, volume: 5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'every-meter-flat-strings-odd-stairs',
    name: 'Flat strings, odd stairs',
    category: 'bass',
    description:
      'Dark flat strings with one tape repeat: what is played on the downbeat comes back on the long step.',
    preview: WALK_SEVEN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { tone: 0.35, sustain: 3.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Faint trace',
        params: { time: 1250, feedback: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'every-meter-opens-on-one-and-four',
    name: 'Opens on one and four',
    category: 'bass',
    description:
      'A long ringing bass behind a gate that opens for one beat on the first and on the fourth of five.',
    preview: WALK_FIVE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { tone: 0.65, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Dark glints',
        params: {
          rate: 1.6,
          steps: 5,
          fill: 2,
          drift: 0,
          apart: 0,
          edge: 0.1,
          length: 0.9,
          floor: 0.5,
        },
      },
    ],
  },
  {
    id: 'every-meter-stone-under-the-fourth',
    name: 'Stone under the fourth',
    category: 'bass',
    description:
      'A bright picked bass whose attack is smeared a little, hung in a dark well of echoes.',
    preview: WALK_NINE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { tone: 0.7, touch: 0.6, release: 0.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur' },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-voice-on-the-low-string',
    name: 'Voice on the low string',
    category: 'bass',
    description: 'A fretless pressed into the shape of a round vowel, with a wordless hall behind.',
    preview: WALK_TURNED,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { position: 0.35, tone: 0.8, sustain: 12 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 3, mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-wheel-with-nine-spokes',
    name: 'Wheel with nine spokes',
    category: 'bass',
    description:
      'An electric bass through a slow rotor, balanced toward its bass drum and away from the horn.',
    preview: WALK_NINE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { touch: 0.6, tone: 0.8, growl: 0.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  {
    id: 'every-meter-odd-hour-on-the-dock',
    name: 'Odd hour on the dock',
    category: 'bass',
    description:
      'A round upright far off and dulled, from behind a door, its top lost on cassette.',
    preview: WALK_TURNED,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 7, resonance: 0.8 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.5 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
    ],
  },
  {
    id: 'every-meter-bass-in-two-halves',
    name: 'Bass in two halves',
    category: 'bass',
    description:
      'A fingered bass split: its tone held and blurred, its attacks dropped back behind it.',
    preview: WALK_FIVE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { touch: 0.15, tone: 0.7, release: 0.4, resonance: 0.7, volume: -0.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers', params: { attacks: -20, hold: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-soft-tines-leaning-late',
    name: 'Soft tines leaning late',
    category: 'keys',
    description:
      'A soft suitcase of tines with no bell and no tremolo, each held chord starting straight and swaying later, in a small dark booth.',
    preview: TILES_SEVEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0, tremolo: 0, hardness: 0.35, tone: 0.3, decay: 2.2 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3, damping: 0.6 } },
    ],
  },
  {
    id: 'every-meter-bells-that-count-nine',
    name: 'Bells that count nine',
    category: 'keys',
    description:
      'Hard bell tines with the bark out, each note throwing a spray of its overtones above itself, on a bright plate.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, bark: 0.05, tone: 1, decay: 0.5, release: 1.2 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.42 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'every-meter-short-hands-in-seven',
    name: 'Short hands in seven',
    category: 'keys',
    description:
      'Damped short tines, barking, snapped off before the next step, through a small loudspeaker.',
    preview: TILES_SEVEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { bark: 0.8, hardness: 0.8, volume: -11.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.02, output: 4 } }],
  },
  {
    id: 'every-meter-throb-on-three-and-two',
    name: 'Throb on three and two',
    category: 'keys',
    description:
      'Long dark tines opened and closed by a gate that counts three quavers, then two and two.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tone: 0.4, decay: 2.5, release: 1 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Canon of three',
        params: { rate: 3.2, steps: 7, fill: 3, shift: 0, apart: 0, edge: 0.35, floor: 0.4 },
      },
    ],
  },
  {
    id: 'every-meter-warm-valve-odd-bar',
    name: 'Warm valve, odd bar',
    category: 'keys',
    description:
      'Tines driven hard through the amplifier and darkened again by a second dark triode, on an amp spring.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { tone: 0.3, bark: 0.9, volume: -7.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'every-meter-glass-tiles-one-loose',
    name: 'Glass tiles, one loose',
    category: 'keys',
    description:
      'Glassy tines with no bark, warped so that their overtones spread as in a small bell, in a bright chamber.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 1, release: 0.6, volume: -12.5 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Toy bells', params: { shift: 0, mix: 0.55 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'every-meter-reed-that-will-not-march',
    name: 'Reed that will not march',
    category: 'keys',
    description:
      'Tines played as a reed, all bark and a soft strike, fluttering, with a slow flanger and a small plate.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { bark: 0.8, release: 0.5, tremolo: 0.25 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-left-foot-in-the-door',
    name: 'Left foot in the door',
    category: 'keys',
    description:
      'Dark tines made longer, the edge of each strike swelled away, held in a warm hall.',
    preview: TILES_SEVEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 3, release: 1.5, volume: -14 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'every-meter-five-lamps-two-out',
    name: 'Five lamps, two out',
    category: 'keys',
    description:
      'Hard bright tines whose partials flash at random moments, with a dark plate behind.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0, bell: 1, tone: 0.9, hardness: 1, decay: 1.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Sudden glints', params: { depth: 1, rate: 3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-loom-and-shuttle',
    name: 'Loom and shuttle',
    category: 'keys',
    description:
      'Short hard tines bounced back at even eighth notes from side to side, each bounce duller.',
    preview: TILES_SEVEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.5, bell: 0.6, hardness: 0.9, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 312, bounce: 1, skips: 6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'every-meter-ferry-rocking-unevenly',
    name: 'Ferry rocking unevenly',
    category: 'keys',
    description: 'Tines panned slowly and sunk under water, where the pitch wavers.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremolo: 0.5, bell: 0.3, volume: -13 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Half in', params: { bubbles: 0.1 } }],
  },
  {
    id: 'every-meter-bark-on-one-of-five',
    name: 'Bark on one of five',
    category: 'keys',
    description: 'Barking tines played hard, squeezed flat by a fast limiter in a tight room.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { decay: 2, tone: 0.75 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'every-meter-late-tram-wheel-flat',
    name: 'Late tram, wheel flat',
    category: 'keys',
    description:
      'Barking tines with the bell turned up, on a cassette that wavers and has lost its top.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { hardness: 0.8, bell: 0.95, release: 0.9, decay: 2.2, tone: 0.8, volume: -15 },
    },
    effects: [{ deviceId: 'patina', preset: 'Falling apart', params: { noise: 0.2, wobble: 0.5 } }],
  },
  {
    id: 'every-meter-organ-with-a-limp',
    name: 'Organ with a limp',
    category: 'keys',
    description:
      'Tines with no bell left to ring very long, soft flute pipes speaking at pitch and an octave below and above.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tone: 0.5, drive: 0.1, tremolo: 0, release: 0.3 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-chords-left-in-the-rain',
    name: 'Chords left in the rain',
    category: 'keys',
    description:
      'Bell tines in light rain that taps on the sound and dulls it, with a long haze of plate.',
    preview: TILES_SEVEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.6, tone: 0.55, decay: 2 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'every-meter-tines-on-a-small-drum',
    name: 'Tines on a small drum',
    category: 'keys',
    description: 'Bell-like tines ringing the skin of a small drum, with the bark turned up.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { hardness: 0.9, bell: 0.9, bark: 0.7, tone: 0.8, tremolo: 0.1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 0.6, mix: 0.75, material: 0.3 } },
    ],
  },
  {
    id: 'every-meter-shadow-of-each-group',
    name: 'Shadow of each group',
    category: 'keys',
    description:
      'Dark tines whose strongest partials linger as sines, an octave up, after each chord.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { hardness: 0.25, bell: 0.35, decay: 2, volume: -15 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.6 } }],
  },
  {
    id: 'every-meter-nine-with-fast-wings',
    name: 'Nine with fast wings',
    category: 'keys',
    description:
      'Bright tines in fast tremolo, fluttered again from side to side in the middle band, under a thin reverb.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { tremolo: 0.7, decay: 2.5, bark: 0.4, volume: -11.5 },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Side flutter' },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 5, mix: 0.45 } },
    ],
  },
  {
    id: 'every-meter-counted-on-an-old-chip',
    name: 'Counted on an old chip',
    category: 'keys',
    description:
      'Long barking tines resampled low enough to ring metallic, in a short bright chamber.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { hardness: 1, bark: 0.9, tremolo: 0, decay: 1.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Metallic', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-dampers-up-till-the-turn',
    name: 'Dampers up till the turn',
    category: 'keys',
    description:
      'Tines with the dampers off, their attacks softened by a spectral blur, on a reel that sways.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.4, tone: 0.5, volume: -20.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.5, hiss: 0.05, mix: 0.6 } },
    ],
  },
  {
    id: 'every-meter-felt-in-seven-half-lit',
    name: 'Felt in seven, half lit',
    category: 'keys',
    description:
      'A felted piano with the room off, its overtones and key noise brought far forward.',
    preview: TILES_SEVEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, grit: 0, outputDb: -17.5 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Broad lift' }],
  },
  {
    id: 'every-meter-upright-one-leg-short',
    name: 'Upright, one leg short',
    category: 'keys',
    description:
      'An old upright, out of tune and creaking, on a worn and warped fast record, with a narrow spring.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { thump: 0.3, hardness: 0.75, outputDb: -14.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.12, warp: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-glass-hammers-in-nine',
    name: 'Glass hammers in nine',
    category: 'keys',
    description:
      'A bare hard piano with stiff loose-tuned strings, each note rung on by bright bowls tuned to C.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { hardness: 0.8, reverbMix: 0.1, detune: 0.8, outputDb: -10 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Ten bright bowls', params: { mix: 0.6, ring: 8 } }],
  },
  {
    id: 'every-meter-soft-thud-five-doors',
    name: 'Soft thud, five doors',
    category: 'keys',
    description:
      'A felt thud with no hammer tone, each note ended by a gated room, all of it dulled on cassette.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0, outputDb: -10.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.5, mix: 0.45 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
    ],
  },
  {
    id: 'every-meter-three-heads-seven-steps',
    name: 'Three heads, seven steps',
    category: 'keys',
    description:
      'A worn mono piano repeated one, two and three eighths later on tape, with a driven phone line mixed in.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { grit: 0.4, outputDb: -12 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 937, feedback: 0.25, mix: 0.35 },
      },
      { deviceId: 'auto-filter', preset: 'Phone line', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'every-meter-half-pedal-over-the-gap',
    name: 'Half pedal over the gap',
    category: 'keys',
    description: 'A half-pedalled piano whose tail sags in pitch and darkens as it ages.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { felt: 0.8, outputDb: -14 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.5 } }],
  },
  {
    id: 'every-meter-nine-keys-under-snow',
    name: 'Nine keys under snow',
    category: 'keys',
    description: 'A felted piano whose attacks are blurred into breath, with a slow wind over it.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { sustain: 0, reverbMix: 0.1, soft: 1, outputDb: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.15 } },
    ],
  },
  {
    id: 'every-meter-slabs-laid-unevenly',
    name: 'Slabs laid unevenly',
    category: 'organ',
    description:
      'A reed table as a held organ, its low-pass a step darker, through a soft slow rotor.',
    preview: SLAB_SEVEN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.06, cutoff: 1600, motion: 0.1, volume: -13.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Soft blend' }],
  },
  {
    id: 'every-meter-pad-that-keeps-its-count',
    name: 'Pad that keeps its count',
    category: 'pad',
    description:
      'Hollow chords cut by a gate that counts three quavers, two and two, over a soft dark plate.',
    preview: TILES_TURNED,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.2, release: 1.5, cutoff: 3200, resonance: 0.1, volume: -5 },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Dark glints',
        params: {
          rate: 3.2,
          steps: 7,
          fill: 3,
          drift: 0,
          apart: 0,
          edge: 0.1,
          floor: 0.35,
          length: 0.8,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-nine-panes-turning',
    name: 'Nine panes turning',
    category: 'keys',
    description:
      'Glassy table keys struck at once, with prism echoes that unfold from low to high.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 1.5, position: 0.8, detune: 8 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 625, feedback: 0.2, mix: 0.35 } },
    ],
  },
  {
    id: 'every-meter-choir-with-a-bar-missing',
    name: 'Choir with a bar missing',
    category: 'voice',
    description:
      'A humming vowel with a quick attack and a little motion, in a hall that sings ah after it.',
    preview: SLAB_SEVEN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.25, position: 0.7, motion: 0.3, release: 1.5, cutoff: 4200 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 3, mix: 0.3 } }],
  },
  {
    id: 'every-meter-narrow-pulse-wide-step',
    name: 'Narrow pulse, wide step',
    category: 'keys',
    description:
      'A narrow pulse plucked short under a filter that opens with each note, then thrown round a wide chorus.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.005, release: 0.4, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { cutoffHz: 350, envAttackMs: 4, envReleaseMs: 260, driveDb: 0 },
      },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'every-meter-saws-behind-the-curtain',
    name: 'Saws behind the curtain',
    category: 'pad',
    description:
      'Thick detuned saws under a low cutoff, a slow harmonic tremolo trading their lows for their highs, in a hall.',
    preview: SLAB_SEVEN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.15, release: 1.2, cutoff: 900, detune: 26 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.6, depth: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'every-meter-frozen-grid',
    name: 'Frozen grid',
    category: 'pad',
    description:
      'A still spectrum with no motion, its partials catching light one after another, in a bright chamber.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.08, release: 1.5, cutoff: 6000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { rate: 3.2 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'every-meter-wooden-teeth-of-a-wheel',
    name: 'Wooden teeth of a wheel',
    category: 'plucked',
    description:
      'A woody pluck with a little fold, echoed once by a dark bucket delay, a long step of three eighths later.',
    preview: PICK_SEVEN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.2, decay: 0.9, colour: 0.5, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 937, feedback: 0, mix: 0.35 },
      },
    ],
  },
  {
    id: 'every-meter-thumb-piano-seven-tines',
    name: 'Thumb piano, seven tines',
    category: 'plucked',
    description: 'A buzzing thumb piano heard through a wooden soundboard, with no room.',
    preview: PICK_SEVEN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 1.1, symmetry: 0.8, volume: 0 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.55 } }],
  },
  {
    id: 'every-meter-chimes-on-the-long-three',
    name: 'Chimes on the long three',
    category: 'bell',
    description: 'Small chimes shortened and softened, left to ring on in a long plate.',
    preview: PICK_SEVEN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { fm: 0.35, colour: 0.7, decay: 1.6, volume: -2.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } }],
  },
  {
    id: 'every-meter-nine-folds-of-paper',
    name: 'Nine folds of paper',
    category: 'plucked',
    description:
      'A bright folding pluck, sent back in small scattered grains an octave up, in a room.',
    preview: TILES_NINE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 1.6, fold: 0.75, volume: -3.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { pitch: 12, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'every-meter-low-plank-lifted-end',
    name: 'Low plank, lifted end',
    category: 'bass',
    description:
      'A round low pluck that folds as it is struck, driven through a transformer and laid on tape.',
    preview: WALK_SEVEN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { volume: -4, decay: 1.4, colour: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.1, hiss: 0.05 } },
    ],
  },
  {
    id: 'every-meter-hollow-knock-in-five',
    name: 'Hollow knock in five',
    category: 'plucked',
    description: 'Short hollow knocks of a pluck, pattering away between close springs.',
    preview: TILES_FIVE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { decay: 0.45, fm: 0.3, volume: 4 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Tight long tank', params: { mix: 0.3 } }],
  },
]
