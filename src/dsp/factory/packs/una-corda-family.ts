import { type FactoryPreset, type Phrase } from '../types'

// Una Corda Family: the same few keyboards with the foot a little lower each time. Twenty families of
// five pedal states (up, a quarter, half, three quarters, down), some with all the strings of a note and
// some with the hammers shifted to fewer, the lid open or shut, the felt strip in or out.

// A minor rolled up and let go, F major seventh the same, then A, E, A and a ninth on top.
// After each roll the hands are off the keys: what still sounds is the pedal.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 57, gain: 0.55 },
    { atSec: 0.14, durSec: 1.36, note: 60, gain: 0.52 },
    { atSec: 0.28, durSec: 1.22, note: 64, gain: 0.49 },
    { atSec: 0.42, durSec: 1.08, note: 69, gain: 0.46 },
    { atSec: 2.6, durSec: 1.5, note: 53, gain: 0.55 },
    { atSec: 2.74, durSec: 1.36, note: 57, gain: 0.52 },
    { atSec: 2.88, durSec: 1.22, note: 60, gain: 0.49 },
    { atSec: 3.02, durSec: 1.08, note: 64, gain: 0.46 },
    { atSec: 5, durSec: 1, note: 57, gain: 0.5 },
    { atSec: 5.14, durSec: 0.86, note: 64, gain: 0.47 },
    { atSec: 5.28, durSec: 0.72, note: 69, gain: 0.44 },
    { atSec: 5.42, durSec: 0.58, note: 71, gain: 0.41 },
  ],
}

// Dm9, G13, Cmaj9: a bass note to a bar (D, G, C, up by fourths) and three short chords over it. Half pedalling lets the
// chords blur inside the bar; the next bass note is where the foot clears them.
const CLEARED_ONCE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 38, gain: 0.6 },
    { atSec: 0.47, durSec: 0.36, note: 53, gain: 0.42 },
    { atSec: 0.47, durSec: 0.36, note: 57, gain: 0.42 },
    { atSec: 0.47, durSec: 0.36, note: 60, gain: 0.42 },
    { atSec: 0.47, durSec: 0.36, note: 64, gain: 0.42 },
    { atSec: 0.95, durSec: 0.36, note: 53, gain: 0.36 },
    { atSec: 0.95, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 0.95, durSec: 0.36, note: 60, gain: 0.36 },
    { atSec: 0.95, durSec: 0.36, note: 64, gain: 0.36 },
    { atSec: 1.42, durSec: 0.36, note: 53, gain: 0.3 },
    { atSec: 1.42, durSec: 0.36, note: 57, gain: 0.3 },
    { atSec: 1.42, durSec: 0.36, note: 60, gain: 0.3 },
    { atSec: 1.42, durSec: 0.36, note: 64, gain: 0.3 },
    { atSec: 1.9, durSec: 1.8, note: 43, gain: 0.6 },
    { atSec: 2.38, durSec: 0.36, note: 53, gain: 0.42 },
    { atSec: 2.38, durSec: 0.36, note: 57, gain: 0.42 },
    { atSec: 2.38, durSec: 0.36, note: 59, gain: 0.42 },
    { atSec: 2.38, durSec: 0.36, note: 64, gain: 0.42 },
    { atSec: 2.85, durSec: 0.36, note: 53, gain: 0.36 },
    { atSec: 2.85, durSec: 0.36, note: 57, gain: 0.36 },
    { atSec: 2.85, durSec: 0.36, note: 59, gain: 0.36 },
    { atSec: 2.85, durSec: 0.36, note: 64, gain: 0.36 },
    { atSec: 3.32, durSec: 0.36, note: 53, gain: 0.3 },
    { atSec: 3.32, durSec: 0.36, note: 57, gain: 0.3 },
    { atSec: 3.32, durSec: 0.36, note: 59, gain: 0.3 },
    { atSec: 3.32, durSec: 0.36, note: 64, gain: 0.3 },
    { atSec: 3.8, durSec: 1.8, note: 48, gain: 0.55 },
    { atSec: 4.27, durSec: 0.36, note: 52, gain: 0.42 },
    { atSec: 4.27, durSec: 0.36, note: 55, gain: 0.42 },
    { atSec: 4.27, durSec: 0.36, note: 59, gain: 0.42 },
    { atSec: 4.27, durSec: 0.36, note: 62, gain: 0.42 },
    { atSec: 4.75, durSec: 0.36, note: 52, gain: 0.36 },
    { atSec: 4.75, durSec: 0.36, note: 55, gain: 0.36 },
    { atSec: 4.75, durSec: 0.36, note: 59, gain: 0.36 },
    { atSec: 4.75, durSec: 0.36, note: 62, gain: 0.36 },
    { atSec: 5.22, durSec: 0.36, note: 52, gain: 0.3 },
    { atSec: 5.22, durSec: 0.36, note: 55, gain: 0.3 },
    { atSec: 5.22, durSec: 0.36, note: 59, gain: 0.3 },
    { atSec: 5.22, durSec: 0.36, note: 62, gain: 0.3 },
  ],
}

// An open D minor ninth held, its three upper notes leaving one quick step after another,
// as three flicks of the pedal thin a chord, and one high E to find what is left.
const THREE_LIFTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6, note: 38, gain: 0.55 },
    { atSec: 0.07, durSec: 5.9, note: 45, gain: 0.42 },
    { atSec: 0.14, durSec: 5.8, note: 53, gain: 0.42 },
    { atSec: 0.21, durSec: 3.85, note: 60, gain: 0.42 },
    { atSec: 0.28, durSec: 3.43, note: 64, gain: 0.42 },
    { atSec: 0.35, durSec: 3, note: 69, gain: 0.45 },
    { atSec: 4.9, durSec: 0.5, note: 76, gain: 0.32 },
  ],
}

// A line down the scale of A minor in short notes, then a tenth to rest on, F and A with C between:
// seven letters in all. With the dampers down
// it is a line; the further they are off, the more of the scale is left standing.
const ONE_HAND: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 76, gain: 0.6 },
    { atSec: 0.5, durSec: 0.3, note: 74, gain: 0.52 },
    { atSec: 1, durSec: 0.3, note: 72, gain: 0.52 },
    { atSec: 1.5, durSec: 0.3, note: 71, gain: 0.5 },
    { atSec: 2, durSec: 0.6, note: 69, gain: 0.55 },
    { atSec: 3, durSec: 0.3, note: 72, gain: 0.5 },
    { atSec: 3.5, durSec: 0.3, note: 71, gain: 0.48 },
    { atSec: 4, durSec: 0.3, note: 67, gain: 0.48 },
    { atSec: 4.5, durSec: 1.2, note: 53, gain: 0.44 },
    { atSec: 4.5, durSec: 1.2, note: 60, gain: 0.4 },
    { atSec: 4.5, durSec: 1.2, note: 69, gain: 0.5 },
  ],
}

// Fifths tolled low, each starting where the last one stopped (G and D, D and A, A and E), with a small
// chord high above each: G with its ninth, D minor ninth, A minor ninth. Nothing let go is ever closer
// than a fifth down there.
const LOW_TOLL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 31, gain: 0.62 },
    { atSec: 0, durSec: 1.3, note: 38, gain: 0.42 },
    { atSec: 0.7, durSec: 0.8, note: 69, gain: 0.38 },
    { atSec: 0.7, durSec: 0.8, note: 71, gain: 0.38 },
    { atSec: 0.7, durSec: 0.8, note: 74, gain: 0.38 },
    { atSec: 2.1, durSec: 1.3, note: 38, gain: 0.62 },
    { atSec: 2.1, durSec: 1.3, note: 45, gain: 0.42 },
    { atSec: 2.8, durSec: 0.8, note: 65, gain: 0.38 },
    { atSec: 2.8, durSec: 0.8, note: 72, gain: 0.38 },
    { atSec: 2.8, durSec: 0.8, note: 76, gain: 0.38 },
    { atSec: 4.2, durSec: 1.3, note: 45, gain: 0.62 },
    { atSec: 4.2, durSec: 1.3, note: 52, gain: 0.42 },
    { atSec: 4.9, durSec: 0.8, note: 67, gain: 0.38 },
    { atSec: 4.9, durSec: 0.8, note: 71, gain: 0.38 },
    { atSec: 4.9, durSec: 0.8, note: 72, gain: 0.38 },
  ],
}

// Six chords in four parts: C, Am, F, Dm, G, C. The hands lift between them and the pedal, if there
// is any, joins them.
const FOUR_PARTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.86, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 0.86, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 0.86, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 0.86, note: 72, gain: 0.5 },
    { atSec: 1, durSec: 0.86, note: 45, gain: 0.5 },
    { atSec: 1, durSec: 0.86, note: 57, gain: 0.4 },
    { atSec: 1, durSec: 0.86, note: 64, gain: 0.4 },
    { atSec: 1, durSec: 0.86, note: 72, gain: 0.5 },
    { atSec: 2, durSec: 0.86, note: 41, gain: 0.5 },
    { atSec: 2, durSec: 0.86, note: 57, gain: 0.4 },
    { atSec: 2, durSec: 0.86, note: 65, gain: 0.4 },
    { atSec: 2, durSec: 0.86, note: 72, gain: 0.5 },
    { atSec: 3, durSec: 0.86, note: 38, gain: 0.5 },
    { atSec: 3, durSec: 0.86, note: 57, gain: 0.4 },
    { atSec: 3, durSec: 0.86, note: 65, gain: 0.4 },
    { atSec: 3, durSec: 0.86, note: 74, gain: 0.5 },
    { atSec: 4, durSec: 0.86, note: 43, gain: 0.5 },
    { atSec: 4, durSec: 0.86, note: 55, gain: 0.4 },
    { atSec: 4, durSec: 0.86, note: 62, gain: 0.4 },
    { atSec: 4, durSec: 0.86, note: 71, gain: 0.5 },
    { atSec: 5, durSec: 1.3, note: 48, gain: 0.5 },
    { atSec: 5, durSec: 1.3, note: 55, gain: 0.4 },
    { atSec: 5, durSec: 1.3, note: 64, gain: 0.4 },
    { atSec: 5, durSec: 1.3, note: 72, gain: 0.5 },
  ],
}

// A left hand too small for its tenths, so it breaks them: C, Am, F, Dm, down by thirds, with one note of
// melody to a bar (a ninth, a third, a seventh, a fifth).
const TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 48, gain: 0.52 },
    { atSec: 0.25, durSec: 0.5, note: 55, gain: 0.4 },
    { atSec: 0.5, durSec: 0.5, note: 64, gain: 0.42 },
    { atSec: 0.85, durSec: 0.55, note: 74, gain: 0.55 },
    { atSec: 1.5, durSec: 0.6, note: 45, gain: 0.52 },
    { atSec: 1.75, durSec: 0.5, note: 52, gain: 0.4 },
    { atSec: 2, durSec: 0.5, note: 60, gain: 0.42 },
    { atSec: 2.35, durSec: 0.55, note: 72, gain: 0.55 },
    { atSec: 3, durSec: 0.6, note: 41, gain: 0.52 },
    { atSec: 3.25, durSec: 0.5, note: 48, gain: 0.4 },
    { atSec: 3.5, durSec: 0.5, note: 57, gain: 0.42 },
    { atSec: 3.85, durSec: 0.55, note: 76, gain: 0.55 },
    { atSec: 4.5, durSec: 0.6, note: 38, gain: 0.52 },
    { atSec: 4.75, durSec: 0.5, note: 45, gain: 0.4 },
    { atSec: 5, durSec: 0.5, note: 53, gain: 0.42 },
    { atSec: 5.35, durSec: 0.55, note: 69, gain: 0.55 },
  ],
}

// One key, E, struck four times to a bar with middle C under it; only a bass note and one voice
// change: Am, Fmaj7, C over G, Dm9.
const ONE_KEY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.22, note: 64, gain: 0.46 },
    { atSec: 0, durSec: 1.4, note: 45, gain: 0.52 },
    { atSec: 0, durSec: 1.4, note: 52, gain: 0.38 },
    { atSec: 0, durSec: 1.4, note: 60, gain: 0.36 },
    { atSec: 0.4, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 0.8, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 1.2, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 1.6, durSec: 0.22, note: 64, gain: 0.46 },
    { atSec: 1.6, durSec: 1.4, note: 41, gain: 0.52 },
    { atSec: 1.6, durSec: 1.4, note: 57, gain: 0.38 },
    { atSec: 1.6, durSec: 1.4, note: 60, gain: 0.36 },
    { atSec: 2, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 2.4, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 2.8, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 3.2, durSec: 0.22, note: 64, gain: 0.46 },
    { atSec: 3.2, durSec: 1.4, note: 43, gain: 0.52 },
    { atSec: 3.2, durSec: 1.4, note: 55, gain: 0.38 },
    { atSec: 3.2, durSec: 1.4, note: 60, gain: 0.36 },
    { atSec: 3.6, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 4, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 4.4, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 4.8, durSec: 0.22, note: 64, gain: 0.46 },
    { atSec: 4.8, durSec: 1.4, note: 38, gain: 0.52 },
    { atSec: 4.8, durSec: 1.4, note: 53, gain: 0.38 },
    { atSec: 4.8, durSec: 1.4, note: 60, gain: 0.36 },
    { atSec: 5.2, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 5.6, durSec: 0.22, note: 64, gain: 0.34 },
    { atSec: 6, durSec: 0.22, note: 64, gain: 0.34 },
  ],
}

// A low D held from the start, hardly sounding, and short dyads near its overtones above it, the last
// one with a third note. They are too short to be heard for long: what rings after is the answer.
const CAUGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 38, gain: 0.3 },
    { atSec: 0.8, durSec: 0.16, note: 62, gain: 0.6 },
    { atSec: 0.8, durSec: 0.16, note: 69, gain: 0.55 },
    { atSec: 1.7, durSec: 0.16, note: 69, gain: 0.55 },
    { atSec: 1.7, durSec: 0.16, note: 74, gain: 0.55 },
    { atSec: 2.6, durSec: 0.16, note: 72, gain: 0.5 },
    { atSec: 2.6, durSec: 0.16, note: 76, gain: 0.5 },
    { atSec: 3.5, durSec: 0.16, note: 57, gain: 0.55 },
    { atSec: 3.5, durSec: 0.16, note: 62, gain: 0.5 },
    { atSec: 3.5, durSec: 0.16, note: 69, gain: 0.5 },
  ],
}

// Chords of three fourths and a third, in pairs, the short one and the one it falls to: the D dorian
// pair, E to D, then the same shape on A falling home to D.
const FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 52, gain: 0.42 },
    { atSec: 0, durSec: 0.8, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 0, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 0.8, note: 71, gain: 0.42 },
    { atSec: 1.3, durSec: 1.7, note: 50, gain: 0.42 },
    { atSec: 1.3, durSec: 1.7, note: 55, gain: 0.42 },
    { atSec: 1.3, durSec: 1.7, note: 60, gain: 0.42 },
    { atSec: 1.3, durSec: 1.7, note: 65, gain: 0.42 },
    { atSec: 1.3, durSec: 1.7, note: 69, gain: 0.42 },
    { atSec: 3.7, durSec: 0.8, note: 57, gain: 0.42 },
    { atSec: 3.7, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 3.7, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 3.7, durSec: 0.8, note: 72, gain: 0.42 },
    { atSec: 3.7, durSec: 0.8, note: 76, gain: 0.42 },
    { atSec: 5, durSec: 1.3, note: 50, gain: 0.42 },
    { atSec: 5, durSec: 1.3, note: 55, gain: 0.42 },
    { atSec: 5, durSec: 1.3, note: 60, gain: 0.42 },
    { atSec: 5, durSec: 1.3, note: 65, gain: 0.42 },
    { atSec: 5, durSec: 1.3, note: 69, gain: 0.42 },
  ],
}

// A chain of suspensions in three voices: every top note is held over until it is a seventh, then
// steps down to the sixth, and the last sixth opens to the octave on C, with a fourth voice to fill it.
const SEVEN_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 55, gain: 0.45 },
    { atSec: 0, durSec: 1.2, note: 59, gain: 0.4 },
    { atSec: 0, durSec: 1.8, note: 76, gain: 0.5 },
    { atSec: 1.2, durSec: 1.2, note: 53, gain: 0.45 },
    { atSec: 1.2, durSec: 1.2, note: 57, gain: 0.4 },
    { atSec: 1.8, durSec: 1.2, note: 74, gain: 0.5 },
    { atSec: 2.4, durSec: 1.2, note: 52, gain: 0.45 },
    { atSec: 2.4, durSec: 1.2, note: 55, gain: 0.4 },
    { atSec: 3, durSec: 1.2, note: 72, gain: 0.5 },
    { atSec: 3.6, durSec: 1.2, note: 50, gain: 0.45 },
    { atSec: 3.6, durSec: 1.2, note: 53, gain: 0.4 },
    { atSec: 4.2, durSec: 0.6, note: 71, gain: 0.5 },
    { atSec: 4.8, durSec: 1.6, note: 48, gain: 0.45 },
    { atSec: 4.8, durSec: 1.6, note: 55, gain: 0.4 },
    { atSec: 4.8, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 1.6, note: 72, gain: 0.5 },
  ],
}

// Two wide chords with time to speak: A minor ninth, then F with its ninth, G and C held in common.
const TWO_SLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 45, gain: 0.6 },
    { atSec: 0, durSec: 3.1, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 3.1, note: 59, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 72, gain: 0.5 },
    { atSec: 3.2, durSec: 3.2, note: 41, gain: 0.6 },
    { atSec: 3.2, durSec: 3.2, note: 48, gain: 0.5 },
    { atSec: 3.2, durSec: 3.2, note: 57, gain: 0.5 },
  ],
}

// Two hands that take turns: the left has a figure of four notes, the right one of five, in D minor
// without its sixth or second, so they come round together only after twenty.
const FIVE_ON_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.22, note: 50, gain: 0.55 },
    { atSec: 0.3, durSec: 0.2, note: 72, gain: 0.45 },
    { atSec: 0.6, durSec: 0.22, note: 57, gain: 0.55 },
    { atSec: 0.9, durSec: 0.2, note: 69, gain: 0.45 },
    { atSec: 1.2, durSec: 0.22, note: 55, gain: 0.55 },
    { atSec: 1.5, durSec: 0.2, note: 67, gain: 0.45 },
    { atSec: 1.8, durSec: 0.22, note: 57, gain: 0.55 },
    { atSec: 2.1, durSec: 0.2, note: 65, gain: 0.45 },
    { atSec: 2.4, durSec: 0.22, note: 50, gain: 0.55 },
    { atSec: 2.7, durSec: 0.2, note: 62, gain: 0.45 },
    { atSec: 3, durSec: 0.22, note: 57, gain: 0.55 },
    { atSec: 3.3, durSec: 0.2, note: 72, gain: 0.45 },
    { atSec: 3.6, durSec: 0.22, note: 55, gain: 0.55 },
    { atSec: 3.9, durSec: 0.2, note: 69, gain: 0.45 },
    { atSec: 4.2, durSec: 0.22, note: 57, gain: 0.55 },
    { atSec: 4.5, durSec: 0.2, note: 67, gain: 0.45 },
    { atSec: 4.8, durSec: 0.22, note: 50, gain: 0.55 },
    { atSec: 5.1, durSec: 0.2, note: 65, gain: 0.45 },
    { atSec: 5.4, durSec: 0.22, note: 57, gain: 0.55 },
    { atSec: 5.7, durSec: 0.2, note: 62, gain: 0.45 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Felt piano, the rolled chords: lid open, no felt strip, every string struck.
  {
    id: 'una-corda-family-foot-on-the-floor',
    name: 'Foot on the floor',
    category: 'keys',
    description:
      'A bare piano with no pedal at all: the dampers fall hard, nothing rings in sympathy, and only a tight plate answers.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0,
        hardness: 0.55,
        damper: 1,
        resonance: 0,
        reverbMix: 0,
        width: 0.9,
        sustain: 0,
        outputDb: -8,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } },
      { deviceId: 'ambient-eq', params: { lowCut: 60, presence: 3, air: 2 } },
    ],
  },
  {
    id: 'una-corda-family-a-quarter-of-the-way',
    name: 'A quarter of the way',
    category: 'keys',
    description:
      'A bare piano with the pedal a quarter down, so releases take a moment, in a bright little chamber spread wide at the top.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.08,
        hardness: 0.42,
        detune: 0.3,
        damper: 0.5,
        resonance: 0.3,
        sustain: 0.22,
        reverbMix: 0,
        width: 0.6,
        outputDb: -8,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.24 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'una-corda-family-halfway-off-the-wire',
    name: 'Halfway off the wire',
    category: 'keys',
    description:
      'A half-pedalled piano with all but pure unisons and little stiffness, levelled by a compressor and set in a dark hall.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.25,
        hardness: 0.5,
        detune: 0.05,
        stiffness: 0.3,
        sustain: 0.38,
        resonance: 0.7,
        reverbMix: 0,
        width: 0.35,
        outputDb: -15.5,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys', params: { threshold: -30, makeup: 3 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'una-corda-family-dampers-grazing',
    name: 'Dampers grazing',
    category: 'keys',
    description:
      'A hard-hammered, stiff-stringed piano whose dampers only just touch, with tuned minor strings ringing beside it.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: {
        hardness: 0.8,
        stiffness: 1.7,
        detune: 0.4,
        damper: 0.05,
        sustain: 0.45,
        resonance: 0.8,
        reverbMix: 0.05,
        outputDb: -17.5,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.34, decay: 5 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 8000 } },
    ],
  },
  {
    id: 'una-corda-family-lid-and-dampers-up',
    name: 'Lid and dampers up',
    category: 'keys',
    description:
      'A grand with everything open: dampers off for good, the other strings blooming, its tail lifted and the sides pulled out.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        felt: 0.1,
        hardness: 0.55,
        detune: 0.7,
        resonance: 1,
        reverbMix: 0,
        width: 1,
        sustain: 1,
        polyphony: 18,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  // The same rolled chords with the hammers shifted: fewer strings, quieter, a little out with themselves.
  {
    id: 'una-corda-family-two-strings-of-three',
    name: 'Two strings of three',
    category: 'keys',
    description:
      'The soft pedal alone: felted, dark and damped at once, with a copy a few cents off in the middle so the strings beat.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.5,
        hardness: 0.3,
        soft: 1,
        detune: 0.8,
        damper: 0.95,
        resonance: 0.05,
        reverbMix: 0,
        width: 0.15,
        outputDb: -14.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thickener', params: { detune: 4, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2600, low: 2 } },
    ],
  },
  {
    id: 'una-corda-family-shifted-action',
    name: 'Shifted action',
    category: 'keys',
    description:
      'Soft pedal and a quarter of the sustain pedal on a clattering upright, blurred by a mist and put to tape.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        soft: 1,
        felt: 0.15,
        hardness: 0.35,
        grit: 0.15,
        detune: 0.9,
        damper: 0.6,
        sustain: 0.2,
        resonance: 0.2,
        reverbMix: 0,
        width: 0.5,
        outputDb: -13.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.55 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'una-corda-family-soft-foot-half-foot',
    name: 'Soft foot, half foot',
    category: 'keys',
    description:
      'Soft pedal down, sustain half down: round hammers on loose unisons, doubled by a short drifting echo on both sides.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        soft: 1,
        felt: 0.7,
        hardness: 0.15,
        detune: 1,
        grit: 0,
        sustain: 0.4,
        damper: 0.3,
        resonance: 0.6,
        reverbMix: 0.05,
        thump: 0.2,
        outputDb: -10.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Doubler',
        params: { modDepth: 0.4, modRate: 0.7, mix: 0.45 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2, breathDepth: 0 } },
    ],
  },
  {
    id: 'una-corda-family-almost-no-dampers',
    name: 'Almost no dampers',
    category: 'keys',
    description:
      'Shifted hammers with three quarters of the pedal, the strikes made soft, the tones held and a slow drift between bands.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: {
        soft: 1,
        felt: 0.4,
        hardness: 0.3,
        detune: 0.6,
        sustain: 0.45,
        damper: 0,
        resonance: 0.9,
        reverbMix: 0,
        outputDb: -17.5,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers', params: { hold: 0.45 } },
      { deviceId: 'currents', preset: 'Gentle drift', params: { depth: 0.5 } },
    ],
  },
  {
    id: 'una-corda-family-both-feet-busy',
    name: 'Both feet busy',
    category: 'pad',
    description:
      'Both pedals down on round hammers, the strings left to sound into a long dark hall until chords lie over one another.',
    preview: ROLLED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: {
        felt: 0.8,
        hardness: 0.1,
        detune: 0.5,
        thump: 0,
        reverbMix: 0,
        resonance: 1,
        width: 0.6,
        outputDb: -9.5,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 8, mix: 0.45 } },
      { deviceId: 'late-vibrato', preset: 'Barely there' },
    ],
  },
  // The half-pedal pattern: an upright, lid shut, cleared once a bar.
  {
    id: 'una-corda-family-lid-shut-heel-down',
    name: 'Lid shut, heel down',
    category: 'keys',
    description:
      'An old upright boxed in by its own soundboard, no pedal, dampers thudding, close and narrow.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        felt: 0.35,
        hardness: 0.5,
        damper: 0.9,
        action: 0.7,
        grit: 0.1,
        resonance: 0,
        reverbMix: 0,
        width: 0.1,
        outputDb: -18.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'una-corda-family-cleared-at-the-bar',
    name: 'Cleared at the bar',
    category: 'keys',
    description:
      'An upright with a quarter of the pedal, its low end warmed by a transformer and a small dark room around it.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: {
        felt: 0.55,
        grit: 0.3,
        hardness: 0.5,
        sustain: 0.24,
        damper: 0.45,
        resonance: 0.35,
        width: 0.4,
        reverbMix: 0,
        outputDb: -16,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-blur-inside-the-bar',
    name: 'Blur inside the bar',
    category: 'keys',
    description:
      'A half-pedalled upright run through a small combo speaker with a room, so the chords smear and the bass stays plain.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.3,
        hardness: 0.6,
        detune: 0.75,
        stiffness: 1.4,
        sustain: 0.38,
        damper: 0.2,
        reverbMix: 0,
        thump: 0.4,
        outputDb: -15,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.15, noise: 0.03, room: 0.55 },
      },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
  {
    id: 'una-corda-family-late-to-lift',
    name: 'Late to lift',
    category: 'keys',
    description:
      'Three quarters of the pedal on a lid-down piano: a compressor set very low turns up what each chord leaves.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.6,
        hardness: 0.4,
        sustain: 0.455,
        damper: 0.02,
        resonance: 0.8,
        reverbMix: 0.1,
        reverbSize: 0.2,
        width: 0.3,
        thump: 0.2,
        outputDb: -22.5,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { presence: -5, air: -4 } },
    ],
  },
  {
    id: 'una-corda-family-nobody-lifts',
    name: 'Nobody lifts',
    category: 'keys',
    description:
      'A pedal forgotten through the whole progression, dark under a closed lid, with a worn tape loop of two seconds behind.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        felt: 0.85,
        hardness: 0.3,
        resonance: 0.9,
        reverbMix: 0,
        width: 0.2,
        polyphony: 20,
        outputDb: -19,
      },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 1.9, feedback: 0.45, wear: 0.6, mix: 0.35 },
      },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
    ],
  },
  // One hand down the scale: felt strip in, the five depths of one pedal.
  {
    id: 'una-corda-family-strip-in-pedal-out',
    name: 'Strip in, pedal out',
    category: 'plucked',
    description:
      'The thickest felt and the fastest dampers: short dull plucks with all the clicks of the action, a slap echo after each.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: {
        damper: 1,
        hardness: 0.3,
        resonance: 0,
        thump: 0.7,
        width: 0.4,
        grit: 0.2,
        outputDb: -3.5,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 140, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'una-corda-family-scale-with-a-shadow',
    name: 'Scale with a shadow',
    category: 'keys',
    description:
      'A felted line with a quarter of the pedal, and sines that find its strongest partials and follow a little late.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.75,
        hardness: 0.35,
        detune: 0.2,
        sustain: 0.25,
        damper: 0.4,
        resonance: 0.3,
        reverbMix: 0.05,
        thump: 0.3,
        outputDb: -11.5,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Sine shadow',
        params: { partials: 5, attack: 250, release: 1.6, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'una-corda-family-leave-the-scale-hanging',
    name: 'Leave the scale hanging',
    category: 'keys',
    description:
      'A half-pedalled, felted line whose common tones are kept and rung on, so the scale piles up and stays in place.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.6,
        hardness: 0.3,
        detune: 0.1,
        sustain: 0.39,
        resonance: 0.8,
        width: 0.6,
        reverbMix: 0,
        outputDb: -10.5,
      },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes' },
      { deviceId: 'spread', preset: 'Soft tilt' },
    ],
  },
  {
    id: 'una-corda-family-cloud-of-seven-notes',
    name: 'Cloud of seven notes',
    category: 'pad',
    description:
      'Dampers barely touching under felt, the line thrown into granular haze until seven notes are one soft cluster.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        felt: 0.8,
        hardness: 0.3,
        grit: 0.05,
        sustain: 0.455,
        damper: 0,
        resonance: 0.9,
        reverbMix: 0.1,
        outputDb: -4,
      },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 380, spray: 0.45, scatter: 0.05, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'una-corda-family-whole-scale-ringing',
    name: 'Whole scale ringing',
    category: 'keys',
    description:
      'Felt strip in and the pedal down for good, every note of the line still ringing while a dark spring tank drips behind it.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        felt: 0.95,
        hardness: 0.55,
        detune: 0.9,
        resonance: 1,
        pedalNoise: 0.2,
        reverbMix: 0,
        width: 0.7,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { tone: 2400, mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  // Low fifths tolled: the same five depths under the longest strings.
  {
    id: 'una-corda-family-toll-and-stop',
    name: 'Toll and stop',
    category: 'keys',
    description:
      'A driven grand with no pedal, its low fifths cut off by quick dampers, in a gated room that holds and then stops dead too.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: {
        grit: 0.35,
        felt: 0.1,
        hardness: 0.6,
        damper: 1,
        resonance: 0.1,
        reverbMix: 0,
        width: 0.6,
        outputDb: -13.5,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.6, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'una-corda-family-bass-a-little-loose',
    name: 'Bass a little loose',
    category: 'keys',
    description:
      'Soft pedal and a quarter of the sustain: rounded low strings with a little wooden body under them, heard from back in a hall.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: {
        soft: 1,
        felt: 0.5,
        hardness: 0.25,
        thump: 0.5,
        sustain: 0.26,
        damper: 0.4,
        resonance: 0.4,
        reverbMix: 0,
        outputDb: -10.5,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { size: 1.6, mix: 0.35 } },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.55 } },
    ],
  },
  {
    id: 'una-corda-family-half-a-bell',
    name: 'Half a bell',
    category: 'bell',
    description:
      'A half-pedalled piano with stretched overtones, so the low fifths toll like bronze, in a plate with a long dark tail.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.2,
        hardness: 0.7,
        stiffness: 2,
        sustain: 0.37,
        damper: 0.15,
        resonance: 0.6,
        width: 0.7,
        reverbMix: 0,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 'warp', preset: 'Stiff string', params: { stretch: 0.25, mix: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'una-corda-family-the-floor-joins-in',
    name: 'The floor joins in',
    category: 'keys',
    description:
      'Three quarters of the pedal and a soft strike, with quiet octaves added below and a large dark room recording itself behind.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: {
        soft: 1,
        felt: 0.4,
        reverbMix: 0.3,
        sustain: 0.45,
        damper: 0.05,
        resonance: 0.8,
        width: 0.4,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35 } },
      { deviceId: 'generations', preset: 'Large dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'una-corda-family-bell-tower-foot',
    name: 'Bell tower foot',
    category: 'drone',
    description:
      'Pedal down under low fifths, all the strings open, smeared into dark water, with a hall that answers a quarter second late.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        felt: 0.3,
        hardness: 0.4,
        stiffness: 1.8,
        detune: 0.2,
        resonance: 1,
        reverbMix: 0,
        width: 0.8,
        outputDb: -22,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.3, breathDepth: 0 } },
    ],
  },
  // Four parts with the soft pedal down throughout, and the foot that joins them.
  {
    id: 'una-corda-family-chorale-unpedalled',
    name: 'Chorale unpedalled',
    category: 'keys',
    description:
      'Soft pedal only: the four parts stop between chords, close and dark through a fat reel of tape with a warm thump.',
    preview: FOUR_PARTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: {
        soft: 1,
        felt: 0.85,
        hardness: 0.15,
        damper: 0.9,
        resonance: 0,
        thump: 0.35,
        reverbMix: 0,
        width: 0.45,
        outputDb: -16,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { tone: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'una-corda-family-vestry-foot',
    name: 'Vestry foot',
    category: 'keys',
    description:
      'Soft pedal and a quarter of the sustain on a piano with pure unisons, and a short chapel that sings a vowel behind it.',
    preview: FOUR_PARTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: {
        soft: 1,
        felt: 0.3,
        hardness: 0.4,
        sustain: 0.24,
        damper: 0.5,
        resonance: 0.3,
        reverbMix: 0,
        width: 0.6,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Voice' },
    ],
  },
  {
    id: 'una-corda-family-joined-by-the-heel',
    name: 'Joined by the heel',
    category: 'keys',
    description:
      'Soft pedal and half the sustain, so chords lap over, with soft pipes at its pitch and an octave each way, late.',
    preview: FOUR_PARTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        soft: 1,
        felt: 0.45,
        hardness: 0.3,
        detune: 0.3,
        sustain: 0.38,
        resonance: 0.6,
        reverbMix: 0,
        outputDb: -15.5,
      },
    },
    effects: [
      { deviceId: 'stops', preset: 'Breath first', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-strings-behind-strings',
    name: 'Strings behind strings',
    category: 'pad',
    description:
      'Three quarters of the pedal on shifted hammers, the chords followed by a low bowed section that swells in after them.',
    preview: FOUR_PARTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        soft: 1,
        felt: 0.6,
        hardness: 0.25,
        grit: 0.1,
        sustain: 0.45,
        damper: 0.05,
        resonance: 0.8,
        reverbMix: 0,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'una-corda-family-six-chords-one-breath',
    name: 'Six chords, one breath',
    category: 'pad',
    description:
      'Both pedals down, the strikes swelled away, all six chords gathered into one slowly breathing hall.',
    preview: FOUR_PARTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { felt: 0.6, hardness: 0.3, resonance: 1, reverbMix: 0, outputDb: -8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 260 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 6, mix: 0.35 } },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  // Broken tenths in a parlour: an upright, worn machines, the foot going down.
  {
    id: 'una-corda-family-parlour-no-pedal',
    name: 'Parlour, no pedal',
    category: 'keys',
    description:
      'A bright, stiff upright with quick dampers and loose unisons, heard off a record with a little dust.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        felt: 0,
        hardness: 0.75,
        stiffness: 1.2,
        detune: 0.85,
        damper: 1,
        grit: 0.2,
        thump: 0.4,
        resonance: 0.1,
        reverbMix: 0.06,
        outputDb: -12,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.12 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 150, highCut: 6000 } },
    ],
  },
  {
    id: 'una-corda-family-reaching-for-the-tenth',
    name: 'Reaching for the tenth',
    category: 'keys',
    description:
      'A quarter of the pedal under a moderate strip of felt, just enough to bridge the reach, doubled by a light chorus.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.4,
        hardness: 0.55,
        sustain: 0.27,
        damper: 0.35,
        detune: 0.35,
        resonance: 0.3,
        reverbMix: 0.1,
        thump: 0.2,
        width: 0.8,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.35, depth: 25 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'una-corda-family-the-tenth-in-the-foot',
    name: 'The tenth in the foot',
    category: 'keys',
    description:
      'A half pedal holds what the hand cannot: a gritty mono upright through a slow rotor, far from the microphones.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: {
        grit: 0.5,
        felt: 0.45,
        sustain: 0.37,
        damper: 0.2,
        resonance: 0.5,
        reverbMix: 0,
        outputDb: -22.5,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'una-corda-family-bass-left-standing',
    name: 'Bass left standing',
    category: 'keys',
    description:
      'Three quarters of the pedal on a soft-hammered piano heard through a wall, the bass of each bar still there in the next.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: {
        felt: 0.7,
        hardness: 0.2,
        thump: 0.3,
        sustain: 0.455,
        damper: 0.03,
        resonance: 0.7,
        reverbMix: 0,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { level: 0.95 } },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'una-corda-family-parlour-with-no-floor',
    name: 'Parlour with no floor',
    category: 'keys',
    description:
      'Pedal down on a loose, rattling upright, its tail ageing as it rings: sagging in pitch and going dark like wax.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        felt: 0.4,
        hardness: 0.45,
        grit: 0.25,
        action: 0.5,
        sustain: 1,
        resonance: 0.9,
        reverbMix: 0,
        width: 0.5,
        polyphony: 18,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag' },
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { mix: 0.25 } },
    ],
  },
  // One key struck again and again: what the foot does to an ostinato.
  {
    id: 'una-corda-family-the-key-alone',
    name: 'The key alone',
    category: 'keys',
    description:
      'No pedal, glassy hammers and hard dampers, each stroke answered once by a quieter copy a fifth of a second behind.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: {
        hardness: 0.9,
        stiffness: 0.8,
        damper: 1,
        resonance: 0,
        reverbMix: 0,
        width: 0.4,
        outputDb: -16,
      },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 0.2, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'una-corda-family-a-key-and-its-shade',
    name: 'A key and its shade',
    category: 'keys',
    description:
      'A quarter of the pedal on a felted key, with dark repeats on three tape heads, a fifth of a second from one to the next.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.7,
        hardness: 0.2,
        sustain: 0.2,
        damper: 0.6,
        resonance: 0.2,
        reverbMix: 0,
        width: 0.3,
        thump: 0.6,
        outputDb: -18.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 600, feedback: 0.3, highCut: 2400, mix: 0.3 },
      },
      { deviceId: 'ambient-comp', preset: 'Peak stop' },
    ],
  },
  {
    id: 'una-corda-family-stroke-over-stroke',
    name: 'Stroke over stroke',
    category: 'keys',
    description:
      'A half-pedalled ostinato, each stroke landing on the last, phased slowly so the repeated note changes colour.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Lean',
      params: {
        felt: 0.35,
        hardness: 0.6,
        detune: 0.6,
        sustain: 0.37,
        damper: 0.2,
        resonance: 0.4,
        reverbMix: 0,
        outputDb: -15,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-a-standing-e',
    name: 'A standing E',
    category: 'keys',
    description:
      'Three quarters of the pedal with the soft pedal on: the repeated key fuses to one tone that a swarm of short echoes keeps.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: {
        soft: 1,
        felt: 0.6,
        hardness: 0.5,
        sustain: 0.45,
        damper: 0.05,
        resonance: 0.8,
        reverbMix: 0,
        width: 0.5,
        outputDb: -14.5,
      },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { feedback: 0.7, mix: 0.4 } },
      { deviceId: 'glimmer', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'una-corda-family-ostinato-in-water',
    name: 'Ostinato in water',
    category: 'keys',
    description:
      'Pedal down and felt in, the repeated key running together a little way under a wavering surface, a late thin plate above.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        felt: 0.9,
        hardness: 0.2,
        detune: 0.3,
        resonance: 0.9,
        reverbMix: 0.1,
        reverbSize: 0.6,
        width: 0.4,
        outputDb: -17,
      },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  // Flutter and the held chord: the overtones a low string lends.
  {
    id: 'una-corda-family-flick-of-the-heel',
    name: 'Flick of the heel',
    category: 'keys',
    description:
      'Stiff strings, soft pedal, fastest dampers: a harmonic tremolo of six a second over them and an echo that flutters too.',
    preview: THREE_LIFTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        soft: 1,
        felt: 0,
        hardness: 0.75,
        stiffness: 1.6,
        damper: 1,
        resonance: 0,
        reverbMix: 0.04,
        width: 0.75,
        outputDb: -8,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 6, depth: 0.7 } },
      { deviceId: 'analog-delay', preset: 'Fluttering', params: { tone: 2400, mix: 0.4 } },
    ],
  },
  {
    id: 'una-corda-family-the-silent-low-d',
    name: 'The silent low D',
    category: 'keys',
    description:
      'A quarter of the pedal and tuned strings on D in the minor, which ring in answer to every short dyad.',
    preview: CAUGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        felt: 0.15,
        hardness: 0.6,
        sustain: 0.2,
        damper: 0.6,
        resonance: 0.6,
        reverbMix: 0,
        width: 0.5,
        outputDb: -16,
      },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor wash', params: { decay: 6, mix: 0.5 } }],
  },
  {
    id: 'una-corda-family-caught-by-the-dampers',
    name: 'Caught by the dampers',
    category: 'keys',
    description:
      'A half pedal that catches half of each dyad, its quiet overtones turned up band by band until they stand in front.',
    preview: CAUGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.1,
        hardness: 0.35,
        stiffness: 0.5,
        sustain: 0.4,
        damper: 0.2,
        resonance: 1,
        reverbMix: 0.05,
        outputDb: -17.5,
      },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.7 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'una-corda-family-overtone-foot',
    name: 'Overtone foot',
    category: 'texture',
    description:
      'Dampers all but off and the strikes sifted out, so the piano is mostly what its other strings sing back, spread wide.',
    preview: CAUGHT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: {
        felt: 0.1,
        hardness: 0.7,
        detune: 0.4,
        sustain: 0.455,
        damper: 0,
        resonance: 1,
        reverbMix: 0,
        outputDb: -20,
      },
    },
    effects: [
      { deviceId: 'sift', preset: 'Bowed entries', params: { hold: 0.65 } },
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'una-corda-family-nothing-let-go',
    name: 'Nothing let go',
    category: 'drone',
    description:
      'Pedal down under a held chord, caught by a sustainer that will not let it end, with a faint ripple of soft pulses across it.',
    preview: THREE_LIFTS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        felt: 0.5,
        hardness: 0.35,
        detune: 1,
        resonance: 0.9,
        reverbMix: 0,
        width: 0.6,
        outputDb: -10,
      },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.5 } },
      { deviceId: 'pulses', preset: 'Faint ripple' },
    ],
  },
  // Tines on the pair of fourth chords: a stage piano, hammers as they come.
  {
    id: 'una-corda-family-tip-of-the-shoe',
    name: 'Tip of the shoe',
    category: 'keys',
    description:
      'Short tines with no pedal at all, barking a little, squeezed hard and left in a small box of a room.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: {
        decay: 0.6,
        release: 0.03,
        bell: 0.35,
        hardness: 0.65,
        bark: 0.5,
        tone: 0.6,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'expanse', preset: 'Small box', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-fourths-just-touching',
    name: 'Fourths just touching',
    category: 'keys',
    description:
      'A quarter of the pedal on ringing bell tines, moving round the head in a slow figure of eight.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { release: 0.14, decay: 0.9, tremolo: 0, bell: 0.75, volume: -14 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 3, air: 3 } },
    ],
  },
  {
    id: 'una-corda-family-half-lift-on-tines',
    name: 'Half lift on tines',
    category: 'keys',
    description:
      'A half-second release under a driven console channel, so each pair of chords shares an edge, flanged very slowly.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        release: 0.5,
        decay: 1.3,
        tremolo: 0,
        bark: 0.55,
        tone: 0.5,
        drive: 0.3,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'una-corda-family-dorian-left-open',
    name: 'Dorian left open',
    category: 'keys',
    description:
      'A release of a second and a half on dark felted tines, one chord sinking into the next through a wide fuzzed haze.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { release: 1.5, decay: 2, bell: 0.2, tone: 0.4, volume: -14 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 5, mix: 0.3 } }],
  },
  {
    id: 'una-corda-family-all-the-tines-at-once',
    name: 'All the tines at once',
    category: 'pad',
    description:
      'Dampers off the tines, three seconds of every chord over the last, swayed by a wide slow tide in separate bands.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.4, tone: 0.5, hardness: 0.35, volume: -16 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.3 } },
    ],
  },
  // Tines with soft hammers, the broken tenths: the electric answer to the soft pedal.
  {
    id: 'una-corda-family-rubber-tips',
    name: 'Rubber tips',
    category: 'keys',
    description:
      'The softest hammers and no pedal: dull round tines with the bell gone, cut off at the key and played off a worn cassette.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: {
        bell: 0,
        bark: 0.35,
        hardness: 0.05,
        release: 0.04,
        decay: 0.8,
        tone: 0.45,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2 } }],
  },
  {
    id: 'una-corda-family-tips-on-the-edge',
    name: 'Tips on the edge',
    category: 'keys',
    description:
      'Soft tips and a short release, the echo of each note fanned out by a prism, its lows first and its highs last.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        hardness: 0.25,
        release: 0.2,
        bell: 0.6,
        bark: 0.15,
        tremolo: 0.1,
        tone: 0.65,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 500, feedback: 0.25, mix: 0.3 } },
    ],
  },
  {
    id: 'una-corda-family-half-hand-half-foot',
    name: 'Half hand, half foot',
    category: 'keys',
    description:
      'Reedy tines with the softest hammers, half pedalled, a small flock of copies bending and drifting close by.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: {
        bark: 0.6,
        tremolo: 0.1,
        tremoloRate: 2,
        release: 0.6,
        decay: 2,
        tone: 0.45,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'una-corda-family-tenths-in-the-carpet',
    name: 'Tenths in the carpet',
    category: 'keys',
    description:
      'Deep soft tines with most of the pedal, muffled to a murmur, their quiet ends turned up until the carpet hums.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tremolo: 0, release: 1.4, decay: 2.5, drive: 0.15, tone: 0.2, pan: 0, volume: -12 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Warm floor' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'una-corda-family-soft-tips-no-dampers',
    name: 'Soft tips, no dampers',
    category: 'pad',
    description:
      'Soft hammers with every damper off, the attacks rounded and bowls on A and E ringing on behind the broken tenths.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: {
        hardness: 0.1,
        release: 3,
        decay: 4,
        bell: 0.3,
        tremolo: 0,
        tone: 0.55,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 120 } },
      { deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.35 } },
    ],
  },
  // Tines cleared once a bar: bark, amplifier, tremolo.
  {
    id: 'una-corda-family-bark-and-lift',
    name: 'Bark and lift',
    category: 'keys',
    description:
      'Full hammers, a heavy bark and no pedal, out of a small bright combo: every chord stops where the hand does.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { release: 0.05, decay: 0.7, volume: -10.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { treble: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'una-corda-family-bar-line-in-the-foot',
    name: 'Bar line in the foot',
    category: 'keys',
    description:
      'A quarter of the pedal on a warm overdriven suitcase with an even tremolo, muffled by an old sampler and slowly chorused.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: {
        release: 0.22,
        drive: 0.5,
        bark: 0.4,
        tremolo: 0.5,
        tremoloRate: 4.2,
        tone: 0.4,
        volume: -9.5,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Muffled sampler', params: { tone: 0.35, noise: 0.05 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'una-corda-family-two-five-smudge',
    name: 'Two, five, smudge',
    category: 'keys',
    description:
      'Half pedal on glassy tines, a murky bucket-brigade echo filling the bar until the next bass note comes.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: {
        release: 0.7,
        decay: 1,
        bell: 0.7,
        hardness: 0.7,
        tone: 0.6,
        bark: 0.2,
        volume: -14,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 475, feedback: 0.4, mix: 0.35 },
      },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'una-corda-family-changes-underfoot',
    name: 'Changes underfoot',
    category: 'keys',
    description:
      'Three quarters of the pedal while the pan swings very slowly, the three chords melting in a long dark tape trail.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { release: 1.6, decay: 1.5, tremoloRate: 0.25, tone: 0.4, bark: 0.3, volume: -14 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 950, feedback: 0.5, mix: 0.35 },
      },
    ],
  },
  {
    id: 'una-corda-family-three-chords-deep',
    name: 'Three chords deep',
    category: 'pad',
    description:
      'Dampers off and the throb of a slow mono tremolo, three harmonies stacked in a narrow dark tunnel.',
    preview: CLEARED_ONCE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { release: 3, decay: 4, tremolo: 0.7, tremoloRate: 0.8, volume: -18 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.35 } }],
  },
  // Tines rolled: bells, the lid off, the foot coming up.
  {
    id: 'una-corda-family-bells-with-no-ring',
    name: 'Bells with no ring',
    category: 'bell',
    description:
      'Nothing but bell in the tines and nothing in the pedal, a quick chime pulled to the middle before a very short halo.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { release: 0.04, decay: 0.4, tone: 0.9, volume: -8 },
    },
    effects: [
      { deviceId: 'spread', preset: 'To the middle' },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-roll-hold-a-little',
    name: 'Roll, hold a little',
    category: 'bell',
    description:
      'Bell tines with a quarter of the pedal and a fast shimmer on them, doubled by a copy whose overtones are stretched a little.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { release: 0.25, decay: 1, tremolo: 0.35, tremoloRate: 7, tone: 0.7, volume: -10 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'una-corda-family-answer-from-the-bench',
    name: 'Answer from the bench',
    category: 'keys',
    description:
      'Half pedal, slow pan, and every roll comes back reversed before the next one starts.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { release: 0.6, tremolo: 0.4, bell: 0.35, tone: 0.45, volume: -12 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 1200, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'una-corda-family-octaves-in-the-foot',
    name: 'Octaves in the foot',
    category: 'bell',
    description:
      'Long tines, most of the pedal, with loops of each roll stacked at the octave above until they chime like frost.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { release: 1.5, decay: 2, bell: 0.5, tremolo: 0, hardness: 0.5, volume: -14 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 500, mix: 0.4 } },
      { deviceId: 'seasons', preset: 'First frost', params: { depth: 0.5 } },
    ],
  },
  {
    id: 'una-corda-family-lidless',
    name: 'Lidless',
    category: 'pad',
    description:
      'Dampers off bright tines, each roll smeared into a glassy halo, with the low end thinned out.',
    preview: ROLLED,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.9, tone: 0.85, hardness: 0.75, decay: 3, volume: -16 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', params: { lowCut: 220, clear: 0.5 } },
    ],
  },
  // Magnets on the chain of suspensions: quick to speak, so the damper is all that differs.
  {
    id: 'una-corda-family-suspension-cut-clean',
    name: 'Suspension cut clean',
    category: 'organ',
    description:
      'Magnet-driven strings that speak at once and stop at once, reedy and dry, put through a wooden soundboard.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { bloom: 0.08, damper: 0.06, bright: 0.5, sympathy: 0, body: 0.3, volume: -12 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45, material: 0.25 } }],
  },
  {
    id: 'una-corda-family-a-seventh-let-down',
    name: 'A seventh let down',
    category: 'keys',
    description:
      'Bowed-glass magnets with a third of a second in the dampers, so a seventh overlaps its sixth; a spring tank, a faint late vibrato.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: {
        bloom: 0.15,
        damper: 0.35,
        bright: 0.25,
        shimmer: 0.3,
        sympathy: 0.15,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { depth: 8 } },
    ],
  },
  {
    id: 'una-corda-family-step-down-slowly',
    name: 'Step down slowly',
    category: 'pad',
    description:
      'A second of damper on dark magnet tones with a full body, swayed by a three-voice chorus and set in a hall.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: {
        bloom: 0.35,
        damper: 1.1,
        bright: 0.1,
        shimmer: 0.1,
        sympathy: 0.3,
        body: 0.8,
        width: 0.4,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-sevenths-overhanging',
    name: 'Sevenths overhanging',
    category: 'pad',
    description:
      'Four seconds of damper, so every suspension still hangs over its own resolution, shaded by a slow twelve-stage phaser.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { bloom: 0.5, damper: 4, shimmer: 0.6, bright: 0.45, sympathy: 0.6, volume: -5.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'una-corda-family-octave-at-the-end',
    name: 'Octave at the end',
    category: 'drone',
    description:
      'Dampers of twelve seconds and all the sympathy there is: the whole chain still sounds at its octave, a few steps back.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: {
        harmonic: 1,
        bloom: 0.6,
        damper: 12,
        sympathy: 1,
        bright: 0.2,
        width: 0.9,
        volume: -6.5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'A few steps back', params: { room: 0.8, decay: 4 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  // Magnets that take their time: two slow chords, the bloom longer as the foot goes down.
  {
    id: 'una-corda-family-swell-then-silence',
    name: 'Swell, then silence',
    category: 'pad',
    description:
      'A second and a half of swell and no pedal: the chord grows, then is gone, with only a gated room to say it was there.',
    preview: TWO_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: {
        bloom: 1.5,
        hammer: 0,
        damper: 0.08,
        sympathy: 0.05,
        body: 0.9,
        bright: 0.45,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Late wall',
        params: { time: 0.8, preDelay: 60, mix: 0.35 },
      },
    ],
  },
  {
    id: 'una-corda-family-magnets-quarter-down',
    name: 'Magnets, quarter down',
    category: 'pad',
    description:
      'A slow swell sweeping faintly up its harmonics, half a second in the dampers, rotors turning at their slow speed.',
    preview: TWO_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: {
        bloom: 1.2,
        harmonic: 2,
        sweep: 0.3,
        sweepRate: 0.2,
        damper: 0.5,
        sympathy: 0.2,
        bright: 0.3,
        volume: -10,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } }],
  },
  {
    id: 'una-corda-family-g-and-c-stay',
    name: 'G and C stay',
    category: 'pad',
    description:
      'A bright full-bodied swell half pedalled, through a filter of sound that keeps what two chords share and lets the rest go.',
    preview: TWO_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { bloom: 1.8, damper: 1.2, bright: 0.8, sympathy: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'una-corda-family-three-quarter-tide',
    name: 'Three-quarter tide',
    category: 'pad',
    description:
      'A swell of two and a half seconds, five of damper, and a hall whose tail sinks: the second chord rises through the first.',
    preview: TWO_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Slow tide',
      params: { bloom: 2.6, damper: 5, sweep: 0.2, sympathy: 0.6, volume: -10 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.4 } }],
  },
  {
    id: 'una-corda-family-foot-never-moves',
    name: 'Foot never moves',
    category: 'drone',
    description:
      'A plain sine on every string with the dampers away for twelve seconds, barely opened and closed by a slow breath.',
    preview: TWO_SLOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { bloom: 2, damper: 12, sympathy: 0.8, width: 0.5, body: 0.2, volume: -12 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Barely there' },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.35 } },
    ],
  },
  // Hammer and magnet together: a strike that the magnets take over.
  {
    id: 'una-corda-family-hammer-first',
    name: 'Hammer first',
    category: 'keys',
    description:
      'A felt hammer with barely any magnet after it and dampers that close fast, doubled a little late on both sides.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { bloom: 8, hammer: 1, damper: 0.1, sympathy: 0, body: 0.6, volume: -2.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'una-corda-family-struck-then-sung',
    name: 'Struck, then sung',
    category: 'keys',
    description:
      'A hammer, then the magnets a second behind it, a quarter of the pedal as each note is let go, and a soft tape double.',
    preview: THREE_LIFTS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { bloom: 1.1, hammer: 0.7, damper: 0.45, bright: 0.6, sympathy: 0.2, volume: -10 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'una-corda-family-wire-after-felt',
    name: 'Wire after felt',
    category: 'keys',
    description:
      'Hammer and bright magnets at half pedal in a body of wood, pushed into a triode so the swell grows a grain.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: {
        bloom: 0.7,
        hammer: 0.8,
        damper: 1.3,
        bright: 0.75,
        sympathy: 0.4,
        body: 0.7,
        width: 0.7,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'una-corda-family-ring-under-the-roll',
    name: 'Ring under the roll',
    category: 'keys',
    description:
      'A hammered roll with six seconds of damper and all the other strings singing, its strike moved back, a faint octave above.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ringing room',
      params: { bloom: 1.8, hammer: 0.9, damper: 6, sympathy: 1, width: 0.9, volume: -10 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 90, depth: 0.9 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-no-foot-no-hands',
    name: 'No foot, no hands',
    category: 'pad',
    description:
      'Hammers into open strings with no dampers, then stretched to eight times as long, so the roll goes on after the hands.',
    preview: ROLLED,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: {
        bloom: 3,
        hammer: 0.6,
        damper: 12,
        bright: 0.2,
        sympathy: 0.8,
        shimmer: 0.5,
        volume: -4.5,
      },
    },
    effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.45 } }],
  },
  // Magnets on the overtones: the caught notes, one partial at a time.
  {
    id: 'una-corda-family-partial-and-off',
    name: 'Partial and off',
    category: 'plucked',
    description:
      'The third harmonic alone, quick to speak and quick to stop, like small pipes, with a dotted echo in the gaps.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.1, damper: 0.08, bright: 0.1, sympathy: 0, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 500, feedback: 0.3, mix: 0.28 },
      },
    ],
  },
  {
    id: 'una-corda-family-whistle-in-the-case',
    name: 'Whistle in the case',
    category: 'wind',
    description:
      'The fifth harmonic whistling over a line, dampers a quarter up, inside a short glass tube and then a plate.',
    preview: ONE_HAND,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { bloom: 0.15, harmonic: 5, damper: 0.4, sympathy: 0.1, volume: -5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-octave-answering',
    name: 'Octave answering',
    category: 'keys',
    description:
      'Second harmonics at half pedal, each dyad answered a third of a second later from side to side.',
    preview: CAUGHT,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { bloom: 0.2, damper: 1.4, sympathy: 0.5, bright: 0.3, hammer: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Side to side', params: { feedback: 0.4, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'una-corda-family-harmonics-climbing',
    name: 'Harmonics climbing',
    category: 'texture',
    description:
      'Magnets walking up and down the overtones while four seconds of damper keep them, with a slow ripple rising through the bands.',
    preview: THREE_LIFTS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { bloom: 0.5, sweep: 0.8, sweepRate: 0.5, damper: 4, sympathy: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 5 } },
    ],
  },
  {
    id: 'una-corda-family-harp-with-no-hands',
    name: 'Harp with no hands',
    category: 'texture',
    description:
      'Rippling harmonics over nine seconds of damper, fed to a set of strings tuned in A minor that ring in answer.',
    preview: CAUGHT,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: {
        bloom: 0.12,
        harmonic: 2.5,
        sweep: 0.6,
        sweepRate: 0.9,
        damper: 9,
        sympathy: 1,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 7, mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  // Prepared strings, two hands in turn: rubber and felt between the wires, decay for a foot.
  {
    id: 'una-corda-family-erasers-between',
    name: 'Erasers between',
    category: 'plucked',
    description:
      'Rubber between the strings and a very short decay: two hands of wooden thunks in a small bright room.',
    preview: FIVE_ON_FOUR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { amount: 0.7, decay: 0.3, thud: 0.35, position: 0.3, volume: 4 },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Pluck tamer',
        params: { threshold: -32, release: 0.1, makeup: 8 },
      },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'una-corda-family-cloth-across-the-wires',
    name: 'Cloth across the wires',
    category: 'plucked',
    description:
      'A felt mute on every string and the decay cut to half, the hard front of each note softened, with one faint slap after it.',
    preview: FIVE_ON_FOUR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { amount: 0.7, decay: 0.55, hammer: 0.35, tone: 0.5, width: 0.9, volume: 4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 150 } },
      { deviceId: 'sift', preset: 'A touch' },
    ],
  },
  {
    id: 'una-corda-family-rubber-under-half-a-foot',
    name: 'Rubber under half a foot',
    category: 'keys',
    description:
      'Soft rubber and the decay as it comes, the two hands laid over each other by two short loops out of step.',
    preview: FIVE_ON_FOUR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { amount: 0.35, decay: 1, tone: 0.8, detune: 0.5, volume: 4 },
    },
    effects: [{ deviceId: 'orbits', preset: 'Pulse pair', params: { mix: 0.35 } }],
  },
  {
    id: 'una-corda-family-whisper-on-felt',
    name: 'Whisper on felt',
    category: 'keys',
    description:
      'Felt in the strings, a light hammer and a double decay, its air spread wide and its attacks nearly gone.',
    preview: FIVE_ON_FOUR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { hammer: 0.1, decay: 2, tone: 0.7, detune: 0.7, volume: 3.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Felt and air' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'una-corda-family-twenty-strokes-later',
    name: 'Twenty strokes later',
    category: 'texture',
    description:
      'Every key with its own object and a fourfold decay, the two hands blurring together under tight clusters of echoes.',
    preview: FIVE_ON_FOUR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { amount: 0.4, decay: 4, rattle: 0.2, hammer: 0.35, tone: 0.6, volume: -3.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  // Bolts under the low fifths: bronze, from a short stroke to an open one.
  {
    id: 'una-corda-family-bolt-and-hand',
    name: 'Bolt and hand',
    category: 'bell',
    description:
      'Bolts in the strings, hit hard and stopped short as if by a hand, with one short gated slap in the middle.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { position: 0.15, amount: 0.8, decay: 0.3, tone: 0.8, volume: 6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Mono slap' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'una-corda-family-washers-on-the-wire',
    name: 'Washers on the wire',
    category: 'bell',
    description:
      'Rattling bolts, a short decay and a body like a small drum, tolled from a few steps back.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { decay: 0.6, hammer: 0.4, tone: 0.6, amount: 0.55, volume: 5.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.4 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'una-corda-family-a-gong-at-half',
    name: 'A gong at half',
    category: 'bell',
    description:
      'Bolts set at the middle of the string, a soft hammer and a natural decay, drifting through a slow frequency shift into a dark plate.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { position: 0.5, amount: 0.9, hammer: 0.2, decay: 1.2, rattle: 0, volume: 0.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'una-corda-family-bronze-carried-over',
    name: 'Bronze carried over',
    category: 'bell',
    description:
      'Bolt gongs at double decay whose rings are tamed, dulled under a blanket of tape, and left to cross the next toll.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { decay: 2.4, tone: 0.6, detune: 0.7, volume: 0 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Ringing tones' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { tone: 0.3, hiss: 0.05 } },
    ],
  },
  {
    id: 'una-corda-family-ring-of-the-iron-frame',
    name: 'Ring of the iron frame',
    category: 'drone',
    description:
      'Bolts on every string, the longest decay, the softest hammer: low gongs whose reverb blooms down in falling fifths.',
    preview: LOW_TOLL,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { decay: 4, hammer: 0.15, amount: 0.8, tone: 0.55, thud: 0.1, volume: 1 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { bloom: 0.4, mix: 0.35 } },
    ],
  },
  // Paper, loose unisons and next to nothing: the prepared piano on its way back to a plain one.
  {
    id: 'una-corda-family-paper-and-stop',
    name: 'Paper and stop',
    category: 'plucked',
    description:
      'Paper on the strings and a short decay, a dry buzz on every note, heard from a small bedside speaker.',
    preview: ONE_KEY,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { decay: 0.4, rattle: 0.6, hammer: 0.4, volume: 4.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.15, noise: 0.03 } },
    ],
  },
  {
    id: 'una-corda-family-sheet-music-slipped',
    name: 'Sheet music slipped',
    category: 'keys',
    description:
      'A sizzle of paper with the top shaded off and a shortish decay, swaying on a record that is not quite flat.',
    preview: ROLLED,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { decay: 0.9, amount: 0.6, rattle: 0.5, hammer: 0.35, tone: 0.5, volume: 2.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warp chorus', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
    ],
  },
  {
    id: 'una-corda-family-unisons-let-slip',
    name: 'Unisons let slip',
    category: 'keys',
    description:
      'Nothing between the strings but their tuning let go to the full, a soft hammer, and a hall at some distance.',
    preview: FOUR_PARTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { detune: 1, hammer: 0.3, decay: 1.4, tone: 0.6, width: 0.9, volume: 1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.35 } }],
  },
  {
    id: 'una-corda-family-dark-band-of-wires',
    name: 'Dark band of wires',
    category: 'keys',
    description:
      'A dark mixture of objects at double decay, its overlaps held in place by a loop that plays backwards beneath it.',
    preview: TENTHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: { amount: 0.6, rattle: 0.2, decay: 2.5, tone: 0.4, volume: 1.5 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 1.5, mix: 0.35 } },
    ],
  },
  {
    id: 'una-corda-family-plain-at-last',
    name: 'Plain at last',
    category: 'keys',
    description:
      'An all but plain piano with a fourfold decay and a soft hammer, tinted with a round vowel, its tail raised slowly.',
    preview: THREE_LIFTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: {
        amount: 0.1,
        decay: 4,
        hammer: 0.15,
        detune: 0.2,
        tone: 0.9,
        width: 1,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.9 } },
      { deviceId: 'lift', preset: 'Slow tide' },
    ],
  },
]
