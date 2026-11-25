import { type FactoryPreset, type Phrase } from '../types'

// The white keys read the same up and down from D, so any chord of them can be laid evenly round
// it and opened or closed by equal steps either side. Each instrument was laid out by how it
// speaks, how bright it is and how wide it stands. Every phrase is a mirror about a D (one about the
// D below, one about the D above), but for one that plays the upper half and leaves the lower to the
// instrument.

// A wedge out of D and back: each chord is its own mirror, every pair of notes as far above D as below.
const WEDGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 60, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 64, gain: 0.42 },
    { atSec: 1.6, durSec: 0.8, note: 57, gain: 0.42 },
    { atSec: 1.6, durSec: 0.8, note: 60, gain: 0.42 },
    { atSec: 1.6, durSec: 0.8, note: 64, gain: 0.42 },
    { atSec: 1.6, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 53, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 57, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 71, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 48, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 55, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 69, gain: 0.42 },
    { atSec: 3.2, durSec: 0.8, note: 76, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 50, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 57, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 60, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 64, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 74, gain: 0.42 },
    { atSec: 4.8, durSec: 0.8, note: 59, gain: 0.42 },
    { atSec: 4.8, durSec: 0.8, note: 62, gain: 0.42 },
    { atSec: 4.8, durSec: 0.8, note: 65, gain: 0.42 },
    { atSec: 5.6, durSec: 1.4, note: 62, gain: 0.42 },
  ],
}

// Two lines from the outside in, always in contrary motion, until they meet on D.
const CLOSING: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.75, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.75, note: 79, gain: 0.5 },
    { atSec: 0.75, durSec: 0.75, note: 48, gain: 0.5 },
    { atSec: 0.75, durSec: 0.75, note: 76, gain: 0.5 },
    { atSec: 1.5, durSec: 0.75, note: 50, gain: 0.48 },
    { atSec: 1.5, durSec: 0.75, note: 74, gain: 0.48 },
    { atSec: 2.25, durSec: 0.75, note: 53, gain: 0.5 },
    { atSec: 2.25, durSec: 0.75, note: 71, gain: 0.5 },
    { atSec: 3, durSec: 0.75, note: 55, gain: 0.46 },
    { atSec: 3, durSec: 0.75, note: 69, gain: 0.46 },
    { atSec: 3.75, durSec: 0.75, note: 57, gain: 0.46 },
    { atSec: 3.75, durSec: 0.75, note: 67, gain: 0.46 },
    { atSec: 4.5, durSec: 0.75, note: 60, gain: 0.44 },
    { atSec: 4.5, durSec: 0.75, note: 64, gain: 0.44 },
    { atSec: 5.25, durSec: 1.6, note: 62, gain: 0.55 },
  ],
}

// Fourths either side of D: E A D G C, closing to A D G, then D alone.
const FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 52, gain: 0.45 },
    { atSec: 0, durSec: 2.6, note: 57, gain: 0.45 },
    { atSec: 0, durSec: 2.6, note: 62, gain: 0.45 },
    { atSec: 0, durSec: 2.6, note: 67, gain: 0.45 },
    { atSec: 0, durSec: 2.6, note: 72, gain: 0.45 },
    { atSec: 2.6, durSec: 2, note: 57, gain: 0.47 },
    { atSec: 2.6, durSec: 2, note: 62, gain: 0.47 },
    { atSec: 2.6, durSec: 2, note: 67, gain: 0.47 },
    { atSec: 4.6, durSec: 1.9, note: 62, gain: 0.55 },
  ],
}

// All thirds, F A C below and E G B above, closing to A C E G and to C E: D itself is never struck.
const THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 53, gain: 0.42 },
    { atSec: 0, durSec: 2.8, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 2.8, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 2.8, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 2.8, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 2.8, note: 71, gain: 0.42 },
    { atSec: 2.8, durSec: 1.9, note: 57, gain: 0.45 },
    { atSec: 2.8, durSec: 1.9, note: 60, gain: 0.45 },
    { atSec: 2.8, durSec: 1.9, note: 64, gain: 0.45 },
    { atSec: 2.8, durSec: 1.9, note: 67, gain: 0.45 },
    { atSec: 4.7, durSec: 1.7, note: 60, gain: 0.5 },
    { atSec: 4.7, durSec: 1.7, note: 64, gain: 0.5 },
  ],
}

// A loop and its mirror, C G Am F answered by Am Dm C Em: every note of the answer is reflected about D.
const LOOP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.86, note: 48, gain: 0.4 },
    { atSec: 0, durSec: 0.86, note: 55, gain: 0.4 },
    { atSec: 0, durSec: 0.86, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 0.86, note: 64, gain: 0.4 },
    { atSec: 0.86, durSec: 0.86, note: 43, gain: 0.4 },
    { atSec: 0.86, durSec: 0.86, note: 55, gain: 0.4 },
    { atSec: 0.86, durSec: 0.86, note: 59, gain: 0.4 },
    { atSec: 0.86, durSec: 0.86, note: 62, gain: 0.4 },
    { atSec: 1.72, durSec: 0.86, note: 45, gain: 0.4 },
    { atSec: 1.72, durSec: 0.86, note: 52, gain: 0.4 },
    { atSec: 1.72, durSec: 0.86, note: 57, gain: 0.4 },
    { atSec: 1.72, durSec: 0.86, note: 60, gain: 0.4 },
    { atSec: 2.58, durSec: 0.86, note: 41, gain: 0.4 },
    { atSec: 2.58, durSec: 0.86, note: 53, gain: 0.4 },
    { atSec: 2.58, durSec: 0.86, note: 57, gain: 0.4 },
    { atSec: 2.58, durSec: 0.86, note: 60, gain: 0.4 },
    { atSec: 3.44, durSec: 0.86, note: 60, gain: 0.4 },
    { atSec: 3.44, durSec: 0.86, note: 64, gain: 0.4 },
    { atSec: 3.44, durSec: 0.86, note: 69, gain: 0.4 },
    { atSec: 3.44, durSec: 0.86, note: 76, gain: 0.4 },
    { atSec: 4.3, durSec: 0.86, note: 62, gain: 0.4 },
    { atSec: 4.3, durSec: 0.86, note: 65, gain: 0.4 },
    { atSec: 4.3, durSec: 0.86, note: 69, gain: 0.4 },
    { atSec: 4.3, durSec: 0.86, note: 81, gain: 0.4 },
    { atSec: 5.16, durSec: 0.86, note: 64, gain: 0.4 },
    { atSec: 5.16, durSec: 0.86, note: 67, gain: 0.4 },
    { atSec: 5.16, durSec: 0.86, note: 72, gain: 0.4 },
    { atSec: 5.16, durSec: 0.86, note: 79, gain: 0.4 },
    { atSec: 6.02, durSec: 0.95, note: 64, gain: 0.4 },
    { atSec: 6.02, durSec: 0.95, note: 67, gain: 0.4 },
    { atSec: 6.02, durSec: 0.95, note: 71, gain: 0.4 },
    { atSec: 6.02, durSec: 0.95, note: 83, gain: 0.4 },
  ],
}

// Two hands in mirrored eighths, out from D and in again twice, to one chord spread evenly round it.
const HANDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.36, note: 62, gain: 0.5 },
    { atSec: 0.36, durSec: 0.36, note: 60, gain: 0.5 },
    { atSec: 0.36, durSec: 0.36, note: 64, gain: 0.5 },
    { atSec: 0.72, durSec: 0.36, note: 57, gain: 0.5 },
    { atSec: 0.72, durSec: 0.36, note: 67, gain: 0.5 },
    { atSec: 1.08, durSec: 0.36, note: 53, gain: 0.5 },
    { atSec: 1.08, durSec: 0.36, note: 71, gain: 0.5 },
    { atSec: 1.44, durSec: 0.36, note: 57, gain: 0.5 },
    { atSec: 1.44, durSec: 0.36, note: 67, gain: 0.5 },
    { atSec: 1.8, durSec: 0.36, note: 60, gain: 0.5 },
    { atSec: 1.8, durSec: 0.36, note: 64, gain: 0.5 },
    { atSec: 2.16, durSec: 0.36, note: 55, gain: 0.5 },
    { atSec: 2.16, durSec: 0.36, note: 69, gain: 0.5 },
    { atSec: 2.52, durSec: 0.36, note: 52, gain: 0.5 },
    { atSec: 2.52, durSec: 0.36, note: 72, gain: 0.5 },
    { atSec: 2.88, durSec: 0.36, note: 48, gain: 0.5 },
    { atSec: 2.88, durSec: 0.36, note: 76, gain: 0.5 },
    { atSec: 3.24, durSec: 0.36, note: 52, gain: 0.5 },
    { atSec: 3.24, durSec: 0.36, note: 72, gain: 0.5 },
    { atSec: 3.6, durSec: 0.36, note: 55, gain: 0.5 },
    { atSec: 3.6, durSec: 0.36, note: 69, gain: 0.5 },
    { atSec: 3.96, durSec: 0.36, note: 60, gain: 0.5 },
    { atSec: 3.96, durSec: 0.36, note: 64, gain: 0.5 },
    { atSec: 4.32, durSec: 0.36, note: 62, gain: 0.5 },
    { atSec: 4.68, durSec: 2.4, note: 50, gain: 0.48 },
    { atSec: 4.68, durSec: 2.4, note: 57, gain: 0.48 },
    { atSec: 4.68, durSec: 2.4, note: 60, gain: 0.48 },
    { atSec: 4.68, durSec: 2.4, note: 64, gain: 0.48 },
    { atSec: 4.68, durSec: 2.4, note: 67, gain: 0.48 },
    { atSec: 4.68, durSec: 2.4, note: 74, gain: 0.48 },
  ],
}

// Fifths opening round a D that holds still: G and A join it, then C and E two fifths out.
const FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 62, gain: 0.5 },
    { atSec: 1.6, durSec: 5, note: 55, gain: 0.45 },
    { atSec: 1.6, durSec: 5, note: 69, gain: 0.45 },
    { atSec: 3.4, durSec: 3.2, note: 48, gain: 0.42 },
    { atSec: 3.4, durSec: 3.2, note: 76, gain: 0.42 },
  ],
}

// A D that never moves, and one pair of voices opening and closing round it.
const STILL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 62, gain: 0.5 },
    { atSec: 0.8, durSec: 1, note: 60, gain: 0.45 },
    { atSec: 0.8, durSec: 1, note: 64, gain: 0.45 },
    { atSec: 1.8, durSec: 1, note: 57, gain: 0.45 },
    { atSec: 1.8, durSec: 1, note: 67, gain: 0.45 },
    { atSec: 2.8, durSec: 1.2, note: 53, gain: 0.45 },
    { atSec: 2.8, durSec: 1.2, note: 71, gain: 0.45 },
    { atSec: 4, durSec: 0.9, note: 55, gain: 0.45 },
    { atSec: 4, durSec: 0.9, note: 69, gain: 0.45 },
    { atSec: 4.9, durSec: 0.9, note: 57, gain: 0.45 },
    { atSec: 4.9, durSec: 0.9, note: 67, gain: 0.45 },
    { atSec: 5.8, durSec: 1.2, note: 60, gain: 0.45 },
    { atSec: 5.8, durSec: 1.2, note: 64, gain: 0.45 },
  ],
}

// A short melody up from D, then the same melody turned upside down, home to D.
const LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 62, gain: 0.5 },
    { atSec: 0.6, durSec: 0.4, note: 64, gain: 0.5 },
    { atSec: 1, durSec: 0.5, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 0.8, note: 71, gain: 0.5 },
    { atSec: 2.3, durSec: 0.4, note: 69, gain: 0.5 },
    { atSec: 2.7, durSec: 0.6, note: 67, gain: 0.5 },
    { atSec: 3.4, durSec: 0.6, note: 62, gain: 0.5 },
    { atSec: 4, durSec: 0.4, note: 60, gain: 0.5 },
    { atSec: 4.4, durSec: 0.5, note: 57, gain: 0.5 },
    { atSec: 4.9, durSec: 0.8, note: 53, gain: 0.5 },
    { atSec: 5.7, durSec: 0.4, note: 55, gain: 0.5 },
    { atSec: 6.1, durSec: 0.6, note: 57, gain: 0.5 },
    { atSec: 6.7, durSec: 0.7, note: 62, gain: 0.5 },
  ],
}

// The melody and its inversion sung at once: what one voice climbs the other descends.
const TOGETHER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 62, gain: 0.45 },
    { atSec: 0.8, durSec: 0.6, note: 64, gain: 0.45 },
    { atSec: 1.4, durSec: 0.6, note: 67, gain: 0.45 },
    { atSec: 2, durSec: 1, note: 71, gain: 0.45 },
    { atSec: 3, durSec: 0.5, note: 69, gain: 0.45 },
    { atSec: 3.5, durSec: 0.5, note: 67, gain: 0.45 },
    { atSec: 4, durSec: 1, note: 72, gain: 0.45 },
    { atSec: 5, durSec: 0.6, note: 69, gain: 0.45 },
    { atSec: 5.6, durSec: 0.5, note: 64, gain: 0.45 },
    { atSec: 6.1, durSec: 1.1, note: 62, gain: 0.45 },
    { atSec: 0.8, durSec: 0.6, note: 60, gain: 0.45 },
    { atSec: 1.4, durSec: 0.6, note: 57, gain: 0.45 },
    { atSec: 2, durSec: 1, note: 53, gain: 0.45 },
    { atSec: 3, durSec: 0.5, note: 55, gain: 0.45 },
    { atSec: 3.5, durSec: 0.5, note: 57, gain: 0.45 },
    { atSec: 4, durSec: 1, note: 52, gain: 0.45 },
    { atSec: 5, durSec: 0.6, note: 55, gain: 0.45 },
    { atSec: 5.6, durSec: 0.5, note: 60, gain: 0.45 },
  ],
}

// Only the upper half of the mirror, one note at a time: the instrument answers with the lower.
const HALF: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 67, gain: 0.6 },
    { atSec: 2, durSec: 1.6, note: 71, gain: 0.6 },
    { atSec: 3.6, durSec: 1.2, note: 69, gain: 0.55 },
    { atSec: 4.8, durSec: 1, note: 64, gain: 0.55 },
    { atSec: 5.8, durSec: 1.4, note: 62, gain: 0.55 },
  ],
}

// Triads planing apart: C Dm Em F rise in one hand while Am G F Em fall in the other, and back.
const PLANES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 0.9, note: 67, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 59, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 62, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 65, gain: 0.4 },
    { atSec: 0.9, durSec: 0.9, note: 69, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 53, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 57, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 67, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 71, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 52, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 59, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 65, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 69, gain: 0.4 },
    { atSec: 2.7, durSec: 0.9, note: 72, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 53, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 57, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 60, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 64, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 67, gain: 0.4 },
    { atSec: 3.6, durSec: 0.9, note: 71, gain: 0.4 },
    { atSec: 4.5, durSec: 0.9, note: 55, gain: 0.4 },
    { atSec: 4.5, durSec: 0.9, note: 59, gain: 0.4 },
    { atSec: 4.5, durSec: 0.9, note: 62, gain: 0.4 },
    { atSec: 4.5, durSec: 0.9, note: 65, gain: 0.4 },
    { atSec: 4.5, durSec: 0.9, note: 69, gain: 0.4 },
    { atSec: 5.4, durSec: 1.6, note: 57, gain: 0.4 },
    { atSec: 5.4, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 5.4, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 5.4, durSec: 1.6, note: 67, gain: 0.4 },
  ],
}

// The mirror an octave up, chords rolled outwards from its middle: by fourths, by a fifth and a sixth,
// and by thirds with no D.
const RIPPLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 74, gain: 0.48 },
    { atSec: 0.16, durSec: 2.04, note: 69, gain: 0.48 },
    { atSec: 0.16, durSec: 2.04, note: 79, gain: 0.48 },
    { atSec: 0.32, durSec: 1.88, note: 64, gain: 0.48 },
    { atSec: 0.32, durSec: 1.88, note: 84, gain: 0.48 },
    { atSec: 2.3, durSec: 2.2, note: 74, gain: 0.48 },
    { atSec: 2.46, durSec: 2.04, note: 67, gain: 0.48 },
    { atSec: 2.46, durSec: 2.04, note: 81, gain: 0.48 },
    { atSec: 2.62, durSec: 1.88, note: 65, gain: 0.48 },
    { atSec: 2.62, durSec: 1.88, note: 83, gain: 0.48 },
    { atSec: 4.6, durSec: 2.5, note: 72, gain: 0.48 },
    { atSec: 4.6, durSec: 2.5, note: 76, gain: 0.48 },
    { atSec: 4.76, durSec: 2.34, note: 69, gain: 0.48 },
    { atSec: 4.76, durSec: 2.34, note: 79, gain: 0.48 },
    { atSec: 4.92, durSec: 2.18, note: 64, gain: 0.48 },
    { atSec: 4.92, durSec: 2.18, note: 84, gain: 0.48 },
  ],
}

// The same mirror an octave down: voices open round the D below and rest on three D's.
const LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 50, gain: 0.55 },
    { atSec: 1.5, durSec: 1.4, note: 45, gain: 0.5 },
    { atSec: 1.5, durSec: 1.4, note: 55, gain: 0.5 },
    { atSec: 2.9, durSec: 1.4, note: 41, gain: 0.46 },
    { atSec: 2.9, durSec: 1.4, note: 50, gain: 0.46 },
    { atSec: 2.9, durSec: 1.4, note: 59, gain: 0.46 },
    { atSec: 4.3, durSec: 1.2, note: 43, gain: 0.48 },
    { atSec: 4.3, durSec: 1.2, note: 50, gain: 0.48 },
    { atSec: 4.3, durSec: 1.2, note: 57, gain: 0.48 },
    { atSec: 5.5, durSec: 1.6, note: 38, gain: 0.5 },
    { atSec: 5.5, durSec: 1.6, note: 50, gain: 0.5 },
    { atSec: 5.5, durSec: 1.6, note: 62, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'mirror-of-d-one-note-both-ways',
    name: 'One note, both ways',
    category: 'wind',
    description:
      'Two still, narrow bands per key, the note and its image about D, quick to speak, leveled and set on a small plate.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        attack: 0.09,
        release: 0.5,
        mode: 0,
        resonance: 55,
        width: 70,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -2 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'mirror-of-d-five-fold-air',
    name: 'Five-fold air',
    category: 'pad',
    description:
      'All five mirrored bands round D at a low resonance, breathing slowly, doubled by a slow chorus and opened at the top.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        resonance: 16,
        attack: 1.2,
        release: 4,
        mode: 1,
        breatheRate: 0.15,
        strum: 0,
        width: 100,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 7 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'mirror-of-d-paper-fan',
    name: 'Paper fan',
    category: 'plucked',
    description:
      'The five bands struck one after another with a short release, like a paper fan flicked open, on two springs.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        strum: 100,
        attack: 0.01,
        release: 0.35,
        resonance: 60,
        centerEnabled: 1,
        mirrorMiddleEnabled: 1,
      },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 1.5 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'mirror-of-d-ice-either-side',
    name: 'Ice either side',
    category: 'pad',
    description:
      'Note and image as the thinnest whistling bands, wide apart, with a faint two octave shimmer climbing behind.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        resonance: 100,
        width: 100,
        attack: 0.8,
        release: 3,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 12, outputGain: -3 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 9000 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'mirror-of-d-hinge-below-ground',
    name: 'Hinge below ground',
    category: 'drone',
    description:
      'Broad drifting bands mirrored about the D an octave down, muffled by a blanket of tape.',
    preview: LOW,
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: {
        center: 50,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        resonance: 22,
        attack: 1,
        release: 5,
        middleEnabled: 1,
        width: 20,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -9 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'mirror-of-d-ink-blot-hush',
    name: 'Ink blot hush',
    category: 'texture',
    description:
      'The note, the point half way to D and its mirror as bands so broad they are nearly hiss, sunk in slow, swelling water.',
    preview: THIRDS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        mirrorEnabled: 0,
        centerEnabled: 0,
        resonance: 7,
        attack: 0.9,
        release: 7,
        width: 90,
        strum: 0,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 5, outputGain: -9 } },
      { deviceId: 'underwater', preset: 'Slow swell' },
    ],
  },
  {
    id: 'mirror-of-d-sway-about-the-centre',
    name: 'Sway about the centre',
    category: 'texture',
    description:
      'Note, image and the D between them, their pitches wandering as they sound, on the three heads of a tape echo.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        mode: 2,
        centerEnabled: 1,
        middleEnabled: 0,
        strum: 30,
        attack: 0.15,
        release: 1.2,
        resonance: 45,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -1 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'mirror-of-d-five-tone-hourglass',
    name: 'Five-tone hourglass',
    category: 'pad',
    description:
      'Mirror and centre in the five-tone scale, itself even about D, its level dipping and filling every two seconds.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: {
        center: 62,
        scale: 9,
        root: 0,
        octaflipEnabled: 0,
        centerEnabled: 1,
        resonance: 38,
        attack: 0.3,
        release: 1.4,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { depth: 0.85, rate: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'mirror-of-d-half-way-voices',
    name: 'Half-way voices',
    category: 'wind',
    description:
      'The note is joined by the point half way to D and its image, hollowed by a phaser standing still and a chorused echo.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        mirrorEnabled: 0,
        middleEnabled: 1,
        mirrorMiddleEnabled: 1,
        resonance: 85,
        attack: 0.2,
        release: 0.9,
        mode: 2,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 11, outputGain: -3 } },
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'analog-delay', preset: 'Chorused' },
    ],
  },
  {
    id: 'mirror-of-d-thin-snow-mirrored',
    name: 'Thin snow, mirrored',
    category: 'texture',
    description:
      'A quick brush of five broad bands with everything under nine hundred hertz cut away, each answered by overtone sparks.',
    preview: HANDS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        attack: 0.02,
        release: 0.25,
        resonance: 12,
        strum: 60,
        width: 100,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 16, outputGain: -5.5 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 900 } },
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'mirror-of-d-two-valleys',
    name: 'Two valleys',
    category: 'voice',
    description:
      'Dark mirrored bands through a low-pass at five hundred hertz, their tail sung low by a hall of monks.',
    preview: THIRDS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        resonance: 30,
        attack: 0.7,
        release: 2.5,
        centerEnabled: 1,
        width: 40,
        breatheRate: 0.2,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 9, outputGain: -8 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 500 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'mirror-of-d-panting-equator',
    name: 'Panting equator',
    category: 'organ',
    description:
      'Note, image and centre breathing twice a second, turned by a slow rotary speaker and kept in the middle.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        breatheRate: 2,
        resonance: 48,
        attack: 0.04,
        release: 0.3,
        centerEnabled: 1,
        width: 0,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 9, outputGain: -6 } },
      { deviceId: 'rotary', preset: 'Mono cabinet' },
    ],
  },
  {
    id: 'mirror-of-d-lit-wire-pair',
    name: 'Lit wire pair',
    category: 'string',
    description:
      'The narrowest bands driven by a pentode until they grow overtones, note and image like two lit wires.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        resonance: 100,
        attack: 0.3,
        release: 1.8,
        mode: 2,
        breatheRate: 0.4,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 16, outputGain: -2 } },
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.8, output: -6 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'mirror-of-d-octave-turned-over',
    name: 'Octave turned over',
    category: 'organ',
    description:
      'Each key sounds itself, its image and its own octave on the other side, stiff and still, with stops above and below.',
    preview: PLANES,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 1,
        resonance: 50,
        attack: 0.03,
        release: 0.2,
        mode: 0,
        width: 30,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -5 } },
      { deviceId: 'stops', preset: 'Principal chorus' },
    ],
  },
  {
    id: 'mirror-of-d-moth-on-both-panes',
    name: 'Moth on both panes',
    category: 'texture',
    description:
      'Drifting bands struck fast and broken into an octave rain of grains, flanged a little from side to side.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        attack: 0.02,
        release: 0.6,
        resonance: 30,
        centerEnabled: 1,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -5 } },
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.7 } },
      { deviceId: 'flanger', preset: 'Wide wash' },
    ],
  },
  {
    id: 'mirror-of-d-long-noon-line',
    name: 'Long noon line',
    category: 'drone',
    description:
      'All five bands taking three seconds to gather and ten to leave, held in a reverb of octave voices that stays where it is.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        attack: 3,
        release: 10,
        resonance: 65,
        strum: 0,
        width: 60,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 9, outputGain: -8 } },
      { deviceId: 'spiral', preset: 'Held still', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'mirror-of-d-crease-played-back',
    name: 'Crease, played back',
    category: 'texture',
    description:
      'Only the backwards half is heard: mirrored bands caught a second long and returned with the swell first.',
    preview: HALF,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: {
        center: 62,
        scale: 0,
        root: 0,
        octaflipEnabled: 0,
        attack: 0.03,
        release: 0.9,
        resonance: 40,
        middleEnabled: 1,
        mirrorMiddleEnabled: 1,
        mode: 0,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -7 } },
      { deviceId: 'reverse-delay', preset: 'Backwards only' },
    ],
  },
  {
    id: 'mirror-of-d-mutes-close-inward',
    name: 'Mutes close inward',
    category: 'wind',
    description: 'A muted section swelling softly on every chord, dark and a hall away.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.7, release: 2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'mirror-of-d-horns-part-the-curtains',
    name: 'Horns part the curtains',
    category: 'wind',
    description:
      'French horns with a full section on each key, brightening as they open, over a long plate.',
    preview: WEDGE,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.35, release: 0.6, blow: 0.95, section: 1, breath: 0.03 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Open middle' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'mirror-of-d-flugel-and-reflection',
    name: 'Flugel and reflection',
    category: 'wind',
    description:
      'One breathy flugelhorn, its line answered a little later by itself played backwards.',
    preview: LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.1, release: 0.5, breath: 0.8, volume: -0.5 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Mirror answer', params: { gap: 0.9, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'mirror-of-d-low-brass-keystone',
    name: 'Low brass keystone',
    category: 'drone',
    description:
      'Low brass with a full section, slow to gather, weighted by added octaves below and darkened.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 1.2, release: 4, blow: 0.25, volume: -11.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { dry: 1 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3000 } },
    ],
  },
  {
    id: 'mirror-of-d-trumpets-face-to-face',
    name: 'Trumpets face to face',
    category: 'wind',
    description:
      'Two lone trumpets with a wide vibrato, short and bright, swinging slowly from one side to the other.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { attack: 0.05, release: 0.35, blow: 0.6, vibrato: 0.5, volume: 3.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'mirror-of-d-gate-of-breath',
    name: 'Gate of breath',
    category: 'wind',
    description:
      'Almost only the air of a horn, its attacks blurred to soft clouds with the low end cut away.',
    preview: THIRDS,
    instrument: { deviceId: 'horns', preset: 'Horn of air', params: { attack: 0.6, release: 2 } },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 300 } },
    ],
  },
  {
    id: 'mirror-of-d-tin-hinge',
    name: 'Tin hinge',
    category: 'wind',
    description:
      'A muted trumpet stopped short, through one slack coil that drips after it, small and near the middle.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.02, release: 0.15, blow: 0.8, breath: 0.05, volume: -16 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Single slack coil' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'mirror-of-d-tuba-under-the-fold',
    name: 'Tuba under the fold',
    category: 'bass',
    description:
      'Soft tubas, one to a key, with plenty of breath, muffled and bumped by a slow tape.',
    preview: LOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.15, release: 0.6, breath: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { tone: 0.15 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'mirror-of-d-shutters-of-brass',
    name: 'Shutters of brass',
    category: 'wind',
    description:
      'A bright open trumpet section, quick off the note, with a short gated room behind it.',
    preview: PLANES,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.05, release: 0.2, blow: 0.95, section: 1 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'mirror-of-d-even-scales',
    name: 'Even scales',
    category: 'pad',
    description:
      'Horns blown faintly, slow to rise and eight seconds in falling, hanging in a space whose tail swells.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 1.8, release: 8, blow: 0.12, vibrato: 0 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'mirror-of-d-seesaw-trombones',
    name: 'Seesaw trombones',
    category: 'wind',
    description: 'Trombones that bark and stop, thrown by a fast speaker with heavy rotors.',
    preview: TOGETHER,
    instrument: { deviceId: 'horns', preset: 'Trombone', params: { attack: 0.03, release: 0.25 } },
    effects: [
      { deviceId: 'rotary', preset: 'Heavy rotors' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'mirror-of-d-parade-from-two-ends',
    name: 'Parade from two ends',
    category: 'wind',
    description: 'A trumpet section heard off a far, fading short-wave station.',
    preview: LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.12, release: 0.6, blow: 0.5, vibrato: 0.25, volume: 3 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Far station', params: { static: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'mirror-of-d-tide-of-white-keys',
    name: 'Tide of white keys',
    category: 'string',
    description:
      'Ensemble strings in three octaves with a slow triangular phaser swirling through them.',
    preview: LOOP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.2, release: 1, low: 0.75, high: 0.2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'mirror-of-d-valley-of-cellos',
    name: 'Valley of cellos',
    category: 'bass',
    description:
      'The octave below as strong as the note, dark as cellos, its low mids warmed by iron and held near the middle.',
    preview: LOW,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.25, release: 1, width: 0.1, tone: 700 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'mirror-of-d-answer-in-glass',
    name: 'Answer in glass',
    category: 'pad',
    description:
      'The octave above as strong as the note, thin and bright, with a faint octave climbing out of its tail.',
    preview: LOOP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.25, release: 2, tone: 9500 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 12000 } },
    ],
  },
  {
    id: 'mirror-of-d-dry-hands-opening',
    name: 'Dry hands opening',
    category: 'keys',
    description:
      'Plain saws at pitch and an octave up, no ensemble, through a band-pass that opens with each chord, on a worn cassette.',
    preview: PLANES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.005, release: 0.12, low: 0, high: 0.8, tone: 9000 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 2,
          cutoffHz: 750,
          resonance: 1.6,
          envAmount: 45,
          envAttackMs: 4,
          envReleaseMs: 300,
        },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'mirror-of-d-fog-on-both-banks',
    name: 'Fog on both banks',
    category: 'drone',
    description:
      'The lowest, darkest strings under a slow ensemble, blurred into a deep bank with no edges.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 1, release: 4, volume: -3.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Dark bank' },
      { deviceId: 'spread', preset: 'Wide bass' },
    ],
  },
  {
    id: 'mirror-of-d-flutter-of-shutters',
    name: 'Flutter of shutters',
    category: 'texture',
    description:
      'Bright high strings opening and closing left and right two and a half times a second.',
    preview: WEDGE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { attack: 0.1, release: 0.6, volume: -9 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Left then right' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'mirror-of-d-pipes-without-a-loft',
    name: 'Pipes without a loft',
    category: 'organ',
    description:
      'Three still octaves of saw with the ensemble off, stiff as an organ, sounding inside an open pipe and warmed by a tube.',
    preview: LOOP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { attack: 0.02, release: 0.3, low: 0.5, high: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.7 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -9 } },
    ],
  },
  {
    id: 'mirror-of-d-hourglass-of-strings',
    name: 'Hourglass of strings',
    category: 'pad',
    description:
      'A slow, wide ensemble whose bands swell, fade and cross from side to side like water.',
    preview: STILL,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.8, release: 2.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.9 } },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'mirror-of-d-folded-muted-violins',
    name: 'Folded muted violins',
    category: 'string',
    description:
      'Muted strings with the octave above, thickened to sixteen players in motion, a faint tape echo behind them.',
    preview: THIRDS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.5, release: 1.4 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.8 } },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'mirror-of-d-detuned-reflection',
    name: 'Detuned reflection',
    category: 'string',
    description:
      'Strings drifting apart through a fast ensemble, then doubled wide and late on either side.',
    preview: WEDGE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.2, release: 0.8, tone: 3000 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick' },
      { deviceId: 'auto-filter', preset: 'Slow notch' },
    ],
  },
  {
    id: 'mirror-of-d-three-floors-of-mirror',
    name: 'Three floors of mirror',
    category: 'pad',
    description: 'All three octaves at once, every chord made to fade in as if by a volume pedal.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.02, release: 2.5, tone: 2600 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'mirror-of-d-seam-of-violas',
    name: 'Seam of violas',
    category: 'string',
    description:
      'Plain violas at pitch, close and narrow, with a three spring tank and the top rolled off.',
    preview: CLOSING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.08, release: 0.5, tone: 1100, volume: -1 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2500 } },
    ],
  },
  {
    id: 'mirror-of-d-bellows-open-and-close',
    name: 'Bellows open and close',
    category: 'organ',
    description:
      'Pump organ with the bellows deep, every chord breathing in and out, held inside a shell that roars softly.',
    preview: WEDGE,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { attack: 0.12, release: 0.25 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'mirror-of-d-chapel-door-hinge',
    name: 'Chapel door hinge',
    category: 'organ',
    description:
      'Plain chapel flutes with a little chiff of wind, set down a dark well of close echoes.',
    preview: LOOP,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.04, release: 0.4, octave: 0.15 },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'mirror-of-d-window-of-quints',
    name: 'Window of quints',
    category: 'organ',
    description:
      'The twelfth drawn nearly as loud as the note and nothing else, shaped like a hollow tube and shimmering.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { attack: 0.15, release: 0.8 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'tremolo', preset: 'Wide shimmer' },
    ],
  },
  {
    id: 'mirror-of-d-celeste-on-the-axis',
    name: 'Celeste on the axis',
    category: 'drone',
    description:
      'Beating celeste ranks over a low flute, taking a second to open and kept sounding by a long, dark sustain.',
    preview: FIFTHS,
    instrument: { deviceId: 'organ', preset: 'Celeste drone', params: { attack: 0.9, release: 3 } },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    id: 'mirror-of-d-full-organ-at-noon',
    name: 'Full organ at noon',
    category: 'organ',
    description:
      'Every rank drawn and bright, leveled hard so loop and answer stand equally tall, at the front of a long nave.',
    preview: LOOP,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { attack: 0.03, release: 0.4, tone: 10000 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 6 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'mirror-of-d-two-trembling-wings',
    name: 'Two trembling wings',
    category: 'organ',
    description:
      'A trembling flute rank with a trace of its octave, its echoes closing up like a skipping stone.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { attack: 0.06, release: 0.3, tremulant: 0.9 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'mirror-of-d-reed-throat-balance',
    name: 'Reed throat balance',
    category: 'organ',
    description:
      'The nasal reed rank with a full tremulant, narrowed to a small horn loudspeaker across a platform.',
    preview: STILL,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { attack: 0.1, release: 0.5, tone: 2600 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform' }],
  },
  {
    id: 'mirror-of-d-accordion-folds',
    name: 'Accordion folds',
    category: 'organ',
    description:
      'Reeds and a beating celeste squeezed hard, short and wheezing, with one taped slap behind.',
    preview: WEDGE,
    instrument: { deviceId: 'organ', preset: 'Accordion', params: { attack: 0.02, release: 0.08 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'mirror-of-d-box-drone-at-the-fold',
    name: 'Box drone at the fold',
    category: 'drone',
    description:
      'A wheezing reed box over strings tuned to the white keys, which ring whenever its notes touch them.',
    preview: STILL,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.4, release: 1.5, tone: 1400, volume: -18.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { root: 0, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'mirror-of-d-keel-pedal-stop',
    name: 'Keel pedal stop',
    category: 'bass',
    description:
      'The deep pedal rank under the plain pipe, its lows thickened by an old transformer and everything high taken off.',
    preview: LOW,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.25, release: 1.2, volume: -15.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.5 } },
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 320 } },
    ],
  },
  {
    id: 'mirror-of-d-draughty-halves',
    name: 'Draughty halves',
    category: 'wind',
    description:
      'Pipes that are mostly wind, two lines blown toward each other, gusts moving over both.',
    preview: CLOSING,
    instrument: { deviceId: 'organ', preset: 'Windy flute', params: { attack: 0.2, release: 0.8 } },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'mirror-of-d-ooh-out-of-unison',
    name: 'Ooh out of unison',
    category: 'voice',
    description:
      'Small voices on a closed ooh that start on one note and open to six, in a hall whose tail sings oo after them.',
    preview: WEDGE,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.3, release: 1, volume: -6 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'mirror-of-d-lips-closed-no-centre',
    name: 'Lips closed, no centre',
    category: 'voice',
    description:
      'Humming voices with the top shut off, run into a dark, fuzzed reverb and narrowed.',
    preview: THIRDS,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.6, release: 2, tone: 550 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.5 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'mirror-of-d-verse-and-inverse',
    name: 'Verse and inverse',
    category: 'voice',
    description:
      'A whole choir on ah, the low verse answered high, in a bright hall with the singers spread wide.',
    preview: LOOP,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.25, release: 1, tone: 9000, breath: 0.15, width: 1, volume: -3 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
      { deviceId: 'spread', preset: 'Everything wide' },
    ],
  },
  {
    id: 'mirror-of-d-cantors-left-and-right',
    name: 'Cantors left and right',
    category: 'voice',
    description:
      'Two lone singers with a full vibrato, one line climbing as the other falls, close and nearly dry.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.06, release: 0.3, vibrato: 45, volume: -2.5 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth' },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'mirror-of-d-basses-hold-the-keel',
    name: 'Basses hold the keel',
    category: 'voice',
    description:
      'Large bass voices on ah with their top turned down, played through a dark, woolly stack of loudspeakers.',
    preview: LOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { attack: 0.2, release: 0.7, tone: 1800 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
    ],
  },
  {
    id: 'mirror-of-d-breath-before-balance',
    name: 'Breath before balance',
    category: 'texture',
    description:
      'Voices that are nearly all air, filtered so that only notes of C major pass and ring.',
    preview: FIFTHS,
    instrument: { deviceId: 'choir', preset: 'Breath', params: { attack: 0.9, release: 3 } },
    effects: [
      { deviceId: 'scale-filter', preset: 'In a major key', params: { depth: 24 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'mirror-of-d-ee-through-frost',
    name: 'Ee through frost',
    category: 'voice',
    description:
      'A thin ee from small voices, glassy and wide, every frequency left hanging in a halo above the singers.',
    preview: FOURTHS,
    instrument: { deviceId: 'choir', preset: 'Glass ee', params: { attack: 0.8, release: 3 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.65 } },
      { deviceId: 'auto-filter', preset: 'Falling high-pass' },
    ],
  },
  {
    id: 'mirror-of-d-short-hands-clasped',
    name: 'Short hands, clasped',
    category: 'voice',
    description:
      'Very short sung notes in mirrored pairs, each caught by a quick room that blooms and stops.',
    preview: HANDS,
    instrument: { deviceId: 'choir', preset: 'Short ah', params: { release: 0.12, breath: 0.3 } },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'mirror-of-d-oh-on-a-seesaw',
    name: 'Oh on a seesaw',
    category: 'voice',
    description:
      'Tenors on oh, two lines rocking against each other, with an octave below them at half speed and a nearly still phaser.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { volume: -4, attack: 0.15, release: 0.7 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.45, lowCut: 110 } },
      { deviceId: 'phaser', preset: 'Glacial sweep' },
    ],
  },
  {
    id: 'mirror-of-d-trebles-on-either-shore',
    name: 'Trebles on either shore',
    category: 'voice',
    description:
      'Small treble voices wandering through all the vowels, through choppy water in a thin, airy space.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.4, release: 2, volume: -4.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Choppy water' },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'mirror-of-d-line-and-its-image',
    name: 'Line and its image',
    category: 'wind',
    description:
      'A plain warm clarinet, its attack quick and its breath low, in a small dark room.',
    preview: LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { attack: 0.05, release: 0.2, breath: 0.15, volume: -2 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'mirror-of-d-low-reed-hinge',
    name: 'Low reed hinge',
    category: 'bass',
    description: 'A breathy low reed with an octave added below, rounded and kept in the middle.',
    preview: LOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.12, release: 0.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'mirror-of-d-subtones-facing',
    name: 'Subtones, facing',
    category: 'wind',
    description:
      'Two subtone reeds, more breath than tone, wavering against each other with a late vibrato.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { attack: 0.1, release: 0.4, breath: 1, vibrato: 0 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'mirror-of-d-reeds-open-from-d',
    name: 'Reeds open from D',
    category: 'wind',
    description:
      'Clarinets swelling from nothing on each chord, the quiet end lifted and spread outward.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.1, release: 2 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Opens outward' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'mirror-of-d-hollow-pair-of-wings',
    name: 'Hollow pair of wings',
    category: 'wind',
    description:
      'A hollow reed section thickened by a close double, set in the thin, frozen colour of midwinter.',
    preview: PLANES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.12, release: 0.4 },
    },
    effects: [
      { deviceId: 'seasons', preset: 'Deep winter' },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'mirror-of-d-apricot-wood-answer',
    name: 'Apricot wood answer',
    category: 'wind',
    description:
      'A wide wavering double reed, its melody and the inverted answer laid over a soft pad that follows them.',
    preview: LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 0.1, release: 0.5, vibrato: 0.8, volume: 1 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { mix: 0.55 } },
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.5, hiss: 0.05 } },
    ],
  },
  {
    id: 'mirror-of-d-sopranos-from-outside',
    name: 'Sopranos from outside',
    category: 'wind',
    description:
      'Hard blown bright reeds rolled outward from the middle, with clean echoes crossing behind.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.03, release: 0.25, blow: 0.9 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { spread: 1 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'mirror-of-d-growl-about-the-axis',
    name: 'Growl about the axis',
    category: 'wind',
    description:
      'Growling tenor reeds under a still D, flattened hard and sunk in the dust of a worn record.',
    preview: STILL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: { attack: 0.05, release: 0.2, growl: 0.8, volume: -2 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -18 } },
      { deviceId: 'vinyl', preset: 'Charity shop find' },
    ],
  },
  {
    id: 'mirror-of-d-humming-reed-centre',
    name: 'Humming reed centre',
    category: 'drone',
    description:
      'A reed barely blown, only its hum left, each partial shadowed by a lingering sine an octave up.',
    preview: THIRDS,
    instrument: { deviceId: 'clarinet', preset: 'Reed hum', params: { attack: 0.4, release: 1.5 } },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.7 } },
      { deviceId: 'reveal', preset: 'Warm body' },
    ],
  },
  {
    id: 'mirror-of-d-pane-between-two-rooms',
    name: 'Pane between two rooms',
    category: 'pad',
    description:
      'Glass tones turning slowly through their table, the partials stretched until they chime, the top spread wide.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { attack: 0.5, release: 2.5, motion: 0.8 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.8 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'mirror-of-d-vowels-facing-vowels',
    name: 'Vowels facing vowels',
    category: 'voice',
    description:
      'A synthetic choir between two vowels, each chord trailed by slow sighs that slide down a little.',
    preview: THIRDS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.7, release: 2 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'mirror-of-d-reed-loop-inverted',
    name: 'Reed loop, inverted',
    category: 'organ',
    description:
      'A reedy organ of two waves and a sub, kept short and played from a kitchen radio with a warm spring.',
    preview: LOOP,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.03, release: 0.25, cutoff: 1600 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Kitchen radio' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'mirror-of-d-hollow-hour-turning',
    name: 'Hollow hour turning',
    category: 'pad',
    description:
      'Hollow waves opening over a resonant filter, played again five times slower as a far trail.',
    preview: STILL,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.4, release: 2, resonance: 0.45, volume: -3 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Grainy trail', params: { mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'mirror-of-d-spectral-tide-line',
    name: 'Spectral tide line',
    category: 'texture',
    description:
      'A bright cloud of shifting partials left out in slow surf, whose waves wash across it from side to side.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 0.8, release: 3, volume: -20 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.9 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  {
    id: 'mirror-of-d-bell-keys-from-inside',
    name: 'Bell keys from inside',
    category: 'bell',
    description:
      'Glass bell keys rolled from the centre outward, their partials split and delayed from low to high.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 2.5, cutoff: 7000 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'mirror-of-d-sines-beating-evenly',
    name: 'Sines beating evenly',
    category: 'drone',
    description: 'Plain sines in detuned pairs, beating slowly among metal bowls tuned to C major.',
    preview: CLOSING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { attack: 0.15, release: 1.5, detune: 14 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.35, scale: 2 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'mirror-of-d-thick-saws-unfolding',
    name: 'Thick saws unfolding',
    category: 'pad',
    description:
      'Thick detuned saws planing apart under a low-pass that sweeps open and shut, pressed by a pumping hand.',
    preview: PLANES,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.05, release: 0.8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Dub sweep', params: { resonance: 1.5 } },
      { deviceId: 'ambient-comp', preset: 'Pump', params: { makeup: 6 } },
    ],
  },
  {
    id: 'mirror-of-d-slow-doors-at-dusk',
    name: 'Slow doors at dusk',
    category: 'pad',
    description:
      'Saw and moving pulse opening under a soft filter through the second chorus, every attack blurred to a slow rise.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { attack: 0.9, release: 4, chorus: 2, cutoff: 1300 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'mirror-of-d-pulse-width-symmetry',
    name: 'Pulse width symmetry',
    category: 'pad',
    description:
      'Moving pulses with the lows cut, turned mono and then sent round the head on a figure of eight.',
    preview: LOOP,
    instrument: { deviceId: 'dusk', preset: 'Wide pulse', params: { attack: 0.2, release: 1.2 } },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Mono' },
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.35 } },
    ],
  },
  {
    id: 'mirror-of-d-floor-of-the-mirror',
    name: 'Floor of the mirror',
    category: 'bass',
    description:
      'A square and its full sub octave under a low filter, glowing with a triode and nothing around it.',
    preview: LOW,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { attack: 0.05, release: 0.6, cutoff: 700 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { low: -2 } },
    ],
  },
  {
    id: 'mirror-of-d-filter-sings-in-pairs',
    name: 'Filter sings in pairs',
    category: 'wind',
    description:
      'A filter singing an octave over each key, the saw under it thinned away, through a worn tape echo.',
    preview: THIRDS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.4, release: 2, cutoff: 523.25, lowCut: 3 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 200 } },
    ],
  },
  {
    id: 'mirror-of-d-shimmer-loft-loop',
    name: 'Shimmer loft loop',
    category: 'organ',
    description:
      'A square organ with a deep sub under both choruses, pipes speaking late a twelfth and two octaves above.',
    preview: LOOP,
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { attack: 0.01, release: 0.4 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Glass on top' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'mirror-of-d-two-hands-at-nightfall',
    name: 'Two hands at nightfall',
    category: 'keys',
    description:
      'Short warm keys with a quick filter closing on each note, three short loops turning behind, all run onto tape.',
    preview: HANDS,
    instrument: { deviceId: 'dusk', preset: 'Warm keys', params: { release: 0.5, volume: -9.5 } },
    effects: [
      { deviceId: 'orbits', preset: 'Short canon' },
      { deviceId: 'saturator', preset: 'On tape' },
    ],
  },
  {
    id: 'mirror-of-d-evening-square-folded',
    name: 'Evening square, folded',
    category: 'wind',
    description:
      'Soft dim squares like a row of reeds, with no chorus, a tremor added only as a chord is held, muffled and close.',
    preview: TOGETHER,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.08, release: 0.4, cutoff: 900, chorus: 0 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Wide shimmer' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { low: 0 } },
    ],
  },
  {
    id: 'mirror-of-d-thirds-over-the-board',
    name: 'Thirds over the board',
    category: 'string',
    description:
      'Six players bowing lightly over the fingerboard, more air than string, blurred together with no low end.',
    preview: THIRDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 6, attack: 0.7, release: 2, air: 1, volume: -4.5 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Diffuse room', params: { mix: 0.5 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 250 } },
    ],
  },
  {
    id: 'mirror-of-d-desks-facing-desks',
    name: 'Desks facing desks',
    category: 'string',
    description: 'Three players with a wide vibrato, warm and dark, set close inside a soundboard.',
    preview: WEDGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
  },
  {
    id: 'mirror-of-d-bowed-hinge-at-bridge',
    name: 'Bowed hinge at bridge',
    category: 'string',
    description:
      'Bows hard at the bridge, glassy and still, beating slowly against a copy moved by less than a hertz, in a wide valley.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.5, release: 2.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { fine: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'mirror-of-d-consort-closing-in',
    name: 'Consort closing in',
    category: 'string',
    description:
      'A muted viol consort with no vibrato and no air, thinned below and above, in a close plain chamber.',
    preview: CLOSING,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.1, release: 0.3, volume: -2 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 180 } },
    ],
  },
  {
    id: 'mirror-of-d-short-bows-mirrored',
    name: 'Short bows, mirrored',
    category: 'string',
    description:
      'Short bows in mirrored eighths, their strokes softened and scattered to the sides just after each note.',
    preview: HANDS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.12, bow: 0.6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strike just after' },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'mirror-of-d-six-bows-hold-the-d',
    name: 'Six bows hold the D',
    category: 'pad',
    description:
      'Six slow bows, muted, around one held D; what stays from chord to chord hangs on and what changes fades.',
    preview: STILL,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 0.8, release: 3, mute: 0.9, volume: 1 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.9 } },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
    ],
  },
  {
    id: 'mirror-of-d-two-felt-hands',
    name: 'Two felt hands',
    category: 'keys',
    description:
      'A soft felted piano for two hands moving alike, close, with a small reel turning unsteadily under it.',
    preview: HANDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, soft: 1, resonance: 0.3, outputDb: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.6, hiss: 0.08 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'mirror-of-d-bare-hands-in-a-nave',
    name: 'Bare hands in a nave',
    category: 'keys',
    description:
      'A bare hard piano rolled from the middle outward, its long tail climbing by octaves and fifths.',
    preview: RIPPLE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.75, reverbMix: 0, width: 1, outputDb: -14 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Still pipes', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { air: 4 } },
    ],
  },
  {
    id: 'mirror-of-d-old-upright-ink-fold',
    name: 'Old upright, ink fold',
    category: 'keys',
    description:
      'An old upright out of tune with its action loud, folded in on itself by a wobbling double and a dusty record.',
    preview: LOOP,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { reverbMix: 0, outputDb: -15.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
      { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.2 } },
    ],
  },
  {
    id: 'mirror-of-d-thuds-on-both-sides',
    name: 'Thuds on both sides',
    category: 'keys',
    description:
      'Felt so thick that the notes are mostly thud, each played again and again into a room until only tones are left.',
    preview: CLOSING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0, outputDb: -5.5 },
    },
    effects: [
      { deviceId: 'generations', preset: 'Quick to tones', params: { mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 6 } },
    ],
  },
  {
    id: 'mirror-of-d-blurred-hands-joined',
    name: 'Blurred hands joined',
    category: 'pad',
    description:
      'A pedalled felt wash with each strike removed, so rolled chords swell in, with octave loops stacked behind.',
    preview: RIPPLE,
    instrument: { deviceId: 'felt-piano', preset: 'Blurred wash', params: { reverbMix: 0.3 } },
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'mirror-of-d-wire-held-at-both-ends',
    name: 'Wire held at both ends',
    category: 'string',
    description:
      'Amplified strings plucked softly and caught half a second later, singing a twelfth up over a dark plate.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.5, release: 2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { gain: 0 } },
    ],
  },
  {
    id: 'mirror-of-d-even-fight-over-d',
    name: 'Even fight over D',
    category: 'drone',
    description:
      'Held strings fighting for the amplifier with a dirty edge, doubled by two close copies and dulled by a low-pass.',
    preview: STILL,
    instrument: {
      deviceId: 'feedback',
      preset: 'Fighting chord',
      params: { grit: 0.4, release: 1.2 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Harsh sample' },
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 1800 } },
    ],
  },
  {
    id: 'mirror-of-d-dark-strings-meet',
    name: 'Dark strings meet',
    category: 'plucked',
    description:
      'Two plucked, damped lines walking in until they meet, held dark and even with spring behind.',
    preview: CLOSING,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { bloom: 0.15, release: 0.8, volume: -3 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
]
