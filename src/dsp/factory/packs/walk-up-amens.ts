import { type FactoryPreset, type Phrase } from '../types'

// Cadences of the slow church walk: the bass climbs from one through three to four, a diminished
// chord passes on the raised fourth, and the amen settles. Laid out by how quickly each sound lets a
// step of the walk go and by what holds the last chord: hammer, reed, voice, string or room.

// The whole walk in C: C, C/E, F, F sharp diminished seventh, C/G, A7, D7, G7, C. The top climbs C, C sharp, D and settles.
const WALK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.66, note: 36, gain: 0.48 },
    { atSec: 0, durSec: 0.66, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 0.66, note: 64, gain: 0.34 },
    { atSec: 0, durSec: 0.66, note: 67, gain: 0.34 },
    { atSec: 0, durSec: 0.66, note: 72, gain: 0.34 },
    { atSec: 0.7, durSec: 0.66, note: 40, gain: 0.48 },
    { atSec: 0.7, durSec: 0.66, note: 60, gain: 0.34 },
    { atSec: 0.7, durSec: 0.66, note: 67, gain: 0.34 },
    { atSec: 0.7, durSec: 0.66, note: 72, gain: 0.34 },
    { atSec: 1.4, durSec: 0.66, note: 41, gain: 0.48 },
    { atSec: 1.4, durSec: 0.66, note: 60, gain: 0.34 },
    { atSec: 1.4, durSec: 0.66, note: 65, gain: 0.34 },
    { atSec: 1.4, durSec: 0.66, note: 69, gain: 0.34 },
    { atSec: 1.4, durSec: 0.66, note: 72, gain: 0.34 },
    { atSec: 2.1, durSec: 0.66, note: 42, gain: 0.48 },
    { atSec: 2.1, durSec: 0.66, note: 60, gain: 0.34 },
    { atSec: 2.1, durSec: 0.66, note: 63, gain: 0.34 },
    { atSec: 2.1, durSec: 0.66, note: 69, gain: 0.34 },
    { atSec: 2.1, durSec: 0.66, note: 72, gain: 0.34 },
    { atSec: 2.8, durSec: 0.66, note: 43, gain: 0.48 },
    { atSec: 2.8, durSec: 0.66, note: 60, gain: 0.34 },
    { atSec: 2.8, durSec: 0.66, note: 64, gain: 0.34 },
    { atSec: 2.8, durSec: 0.66, note: 67, gain: 0.34 },
    { atSec: 2.8, durSec: 0.66, note: 72, gain: 0.34 },
    { atSec: 3.5, durSec: 0.66, note: 45, gain: 0.48 },
    { atSec: 3.5, durSec: 0.66, note: 57, gain: 0.34 },
    { atSec: 3.5, durSec: 0.66, note: 64, gain: 0.34 },
    { atSec: 3.5, durSec: 0.66, note: 67, gain: 0.34 },
    { atSec: 3.5, durSec: 0.66, note: 73, gain: 0.34 },
    { atSec: 4.2, durSec: 0.66, note: 38, gain: 0.48 },
    { atSec: 4.2, durSec: 0.66, note: 57, gain: 0.34 },
    { atSec: 4.2, durSec: 0.66, note: 60, gain: 0.34 },
    { atSec: 4.2, durSec: 0.66, note: 66, gain: 0.34 },
    { atSec: 4.2, durSec: 0.66, note: 74, gain: 0.34 },
    { atSec: 4.9, durSec: 0.66, note: 43, gain: 0.48 },
    { atSec: 4.9, durSec: 0.66, note: 55, gain: 0.34 },
    { atSec: 4.9, durSec: 0.66, note: 59, gain: 0.34 },
    { atSec: 4.9, durSec: 0.66, note: 65, gain: 0.34 },
    { atSec: 4.9, durSec: 0.66, note: 74, gain: 0.34 },
    { atSec: 5.6, durSec: 1.66, note: 36, gain: 0.48 },
    { atSec: 5.6, durSec: 1.66, note: 55, gain: 0.34 },
    { atSec: 5.6, durSec: 1.66, note: 60, gain: 0.34 },
    { atSec: 5.6, durSec: 1.66, note: 64, gain: 0.34 },
    { atSec: 5.6, durSec: 1.66, note: 72, gain: 0.34 },
  ],
}

// From the fourth, slowly: F, F sharp diminished seventh, C/G, G7 with its fourth held over, G7, C.
const SLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.36, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 1.36, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 1.36, note: 65, gain: 0.36 },
    { atSec: 0, durSec: 1.36, note: 69, gain: 0.36 },
    { atSec: 0, durSec: 1.36, note: 72, gain: 0.36 },
    { atSec: 1.4, durSec: 1.36, note: 42, gain: 0.5 },
    { atSec: 1.4, durSec: 1.36, note: 60, gain: 0.36 },
    { atSec: 1.4, durSec: 1.36, note: 63, gain: 0.36 },
    { atSec: 1.4, durSec: 1.36, note: 69, gain: 0.36 },
    { atSec: 1.4, durSec: 1.36, note: 72, gain: 0.36 },
    { atSec: 2.8, durSec: 1.36, note: 43, gain: 0.5 },
    { atSec: 2.8, durSec: 1.36, note: 60, gain: 0.36 },
    { atSec: 2.8, durSec: 1.36, note: 64, gain: 0.36 },
    { atSec: 2.8, durSec: 1.36, note: 67, gain: 0.36 },
    { atSec: 2.8, durSec: 1.36, note: 72, gain: 0.36 },
    { atSec: 4.2, durSec: 0.71, note: 43, gain: 0.5 },
    { atSec: 4.2, durSec: 0.71, note: 60, gain: 0.36 },
    { atSec: 4.2, durSec: 0.71, note: 65, gain: 0.36 },
    { atSec: 4.2, durSec: 0.71, note: 67, gain: 0.36 },
    { atSec: 4.2, durSec: 0.71, note: 74, gain: 0.36 },
    { atSec: 4.95, durSec: 0.71, note: 43, gain: 0.5 },
    { atSec: 4.95, durSec: 0.71, note: 59, gain: 0.36 },
    { atSec: 4.95, durSec: 0.71, note: 65, gain: 0.36 },
    { atSec: 4.95, durSec: 0.71, note: 67, gain: 0.36 },
    { atSec: 4.95, durSec: 0.71, note: 74, gain: 0.36 },
    { atSec: 5.7, durSec: 1.66, note: 36, gain: 0.5 },
    { atSec: 5.7, durSec: 1.66, note: 60, gain: 0.36 },
    { atSec: 5.7, durSec: 1.66, note: 64, gain: 0.36 },
    { atSec: 5.7, durSec: 1.66, note: 67, gain: 0.36 },
    { atSec: 5.7, durSec: 1.66, note: 72, gain: 0.36 },
  ],
}

// A plagal ending with a step before it, all over a C pedal: B flat, F, F minor, C. The top falls B flat, A, A flat, G.
const PLAGAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.26, note: 36, gain: 0.46 },
    { atSec: 0, durSec: 7.26, note: 48, gain: 0.36 },
    { atSec: 0, durSec: 1.46, note: 62, gain: 0.38 },
    { atSec: 0, durSec: 1.46, note: 65, gain: 0.38 },
    { atSec: 0, durSec: 1.46, note: 70, gain: 0.38 },
    { atSec: 1.5, durSec: 1.46, note: 60, gain: 0.38 },
    { atSec: 1.5, durSec: 1.46, note: 65, gain: 0.38 },
    { atSec: 1.5, durSec: 1.46, note: 69, gain: 0.38 },
    { atSec: 3, durSec: 1.46, note: 60, gain: 0.38 },
    { atSec: 3, durSec: 1.46, note: 65, gain: 0.38 },
    { atSec: 3, durSec: 1.46, note: 68, gain: 0.38 },
    { atSec: 4.5, durSec: 2.76, note: 60, gain: 0.38 },
    { atSec: 4.5, durSec: 2.76, note: 64, gain: 0.38 },
    { atSec: 4.5, durSec: 2.76, note: 67, gain: 0.38 },
  ],
}

// The long plagal alone and high: F, F minor, C over a held C, the A falling to A flat and to G.
const SINK: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 81, gain: 0.42 },
    { atSec: 2.3, durSec: 2.3, note: 80, gain: 0.42 },
    { atSec: 4.6, durSec: 2.6, note: 79, gain: 0.42 },
    { atSec: 0, durSec: 4.6, note: 77, gain: 0.36 },
    { atSec: 4.6, durSec: 2.6, note: 76, gain: 0.36 },
  ],
}

// The walk on the white keys: C, Em, F, F again higher, C/G, Am, Dm7, G, C.
const WHITE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.66, note: 36, gain: 0.48 },
    { atSec: 0, durSec: 0.66, note: 60, gain: 0.38 },
    { atSec: 0, durSec: 0.66, note: 64, gain: 0.38 },
    { atSec: 0, durSec: 0.66, note: 67, gain: 0.38 },
    { atSec: 0.7, durSec: 0.66, note: 40, gain: 0.48 },
    { atSec: 0.7, durSec: 0.66, note: 59, gain: 0.38 },
    { atSec: 0.7, durSec: 0.66, note: 64, gain: 0.38 },
    { atSec: 0.7, durSec: 0.66, note: 67, gain: 0.38 },
    { atSec: 1.4, durSec: 0.66, note: 41, gain: 0.48 },
    { atSec: 1.4, durSec: 0.66, note: 57, gain: 0.38 },
    { atSec: 1.4, durSec: 0.66, note: 60, gain: 0.38 },
    { atSec: 1.4, durSec: 0.66, note: 65, gain: 0.38 },
    { atSec: 2.1, durSec: 0.66, note: 41, gain: 0.48 },
    { atSec: 2.1, durSec: 0.66, note: 60, gain: 0.38 },
    { atSec: 2.1, durSec: 0.66, note: 65, gain: 0.38 },
    { atSec: 2.1, durSec: 0.66, note: 69, gain: 0.38 },
    { atSec: 2.8, durSec: 0.66, note: 43, gain: 0.48 },
    { atSec: 2.8, durSec: 0.66, note: 60, gain: 0.38 },
    { atSec: 2.8, durSec: 0.66, note: 64, gain: 0.38 },
    { atSec: 2.8, durSec: 0.66, note: 67, gain: 0.38 },
    { atSec: 3.5, durSec: 0.66, note: 45, gain: 0.48 },
    { atSec: 3.5, durSec: 0.66, note: 57, gain: 0.38 },
    { atSec: 3.5, durSec: 0.66, note: 60, gain: 0.38 },
    { atSec: 3.5, durSec: 0.66, note: 64, gain: 0.38 },
    { atSec: 4.2, durSec: 0.66, note: 38, gain: 0.48 },
    { atSec: 4.2, durSec: 0.66, note: 57, gain: 0.38 },
    { atSec: 4.2, durSec: 0.66, note: 60, gain: 0.38 },
    { atSec: 4.2, durSec: 0.66, note: 65, gain: 0.38 },
    { atSec: 4.9, durSec: 0.66, note: 43, gain: 0.48 },
    { atSec: 4.9, durSec: 0.66, note: 55, gain: 0.38 },
    { atSec: 4.9, durSec: 0.66, note: 59, gain: 0.38 },
    { atSec: 4.9, durSec: 0.66, note: 62, gain: 0.38 },
    { atSec: 5.6, durSec: 1.66, note: 36, gain: 0.48 },
    { atSec: 5.6, durSec: 1.66, note: 55, gain: 0.38 },
    { atSec: 5.6, durSec: 1.66, note: 60, gain: 0.38 },
    { atSec: 5.6, durSec: 1.66, note: 64, gain: 0.38 },
  ],
}

// White keys, very slow: F, C/G, Am, then the plagal F/C and C.
const WHITE_SLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.36, note: 41, gain: 0.48 },
    { atSec: 0, durSec: 1.36, note: 60, gain: 0.38 },
    { atSec: 0, durSec: 1.36, note: 65, gain: 0.38 },
    { atSec: 0, durSec: 1.36, note: 69, gain: 0.38 },
    { atSec: 1.4, durSec: 1.36, note: 43, gain: 0.48 },
    { atSec: 1.4, durSec: 1.36, note: 60, gain: 0.38 },
    { atSec: 1.4, durSec: 1.36, note: 64, gain: 0.38 },
    { atSec: 1.4, durSec: 1.36, note: 67, gain: 0.38 },
    { atSec: 2.8, durSec: 1.36, note: 45, gain: 0.48 },
    { atSec: 2.8, durSec: 1.36, note: 57, gain: 0.38 },
    { atSec: 2.8, durSec: 1.36, note: 60, gain: 0.38 },
    { atSec: 2.8, durSec: 1.36, note: 64, gain: 0.38 },
    { atSec: 4.2, durSec: 1.36, note: 36, gain: 0.48 },
    { atSec: 4.2, durSec: 1.36, note: 57, gain: 0.38 },
    { atSec: 4.2, durSec: 1.36, note: 60, gain: 0.38 },
    { atSec: 4.2, durSec: 1.36, note: 65, gain: 0.38 },
    { atSec: 5.6, durSec: 1.71, note: 36, gain: 0.48 },
    { atSec: 5.6, durSec: 1.71, note: 55, gain: 0.38 },
    { atSec: 5.6, durSec: 1.71, note: 60, gain: 0.38 },
    { atSec: 5.6, durSec: 1.71, note: 64, gain: 0.38 },
  ],
}

// The walk backwards: C, C/B flat, F/A, F minor/A flat, C/G. The bass falls C, B flat, A, A flat, G.
const BACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.31, note: 48, gain: 0.48 },
    { atSec: 0, durSec: 1.31, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 1.31, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 1.31, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 1.31, note: 72, gain: 0.36 },
    { atSec: 1.35, durSec: 1.31, note: 46, gain: 0.48 },
    { atSec: 1.35, durSec: 1.31, note: 60, gain: 0.36 },
    { atSec: 1.35, durSec: 1.31, note: 64, gain: 0.36 },
    { atSec: 1.35, durSec: 1.31, note: 67, gain: 0.36 },
    { atSec: 1.35, durSec: 1.31, note: 72, gain: 0.36 },
    { atSec: 2.7, durSec: 1.31, note: 45, gain: 0.48 },
    { atSec: 2.7, durSec: 1.31, note: 60, gain: 0.36 },
    { atSec: 2.7, durSec: 1.31, note: 65, gain: 0.36 },
    { atSec: 2.7, durSec: 1.31, note: 72, gain: 0.36 },
    { atSec: 4.05, durSec: 1.31, note: 44, gain: 0.48 },
    { atSec: 4.05, durSec: 1.31, note: 60, gain: 0.36 },
    { atSec: 4.05, durSec: 1.31, note: 65, gain: 0.36 },
    { atSec: 4.05, durSec: 1.31, note: 72, gain: 0.36 },
    { atSec: 5.4, durSec: 1.91, note: 43, gain: 0.48 },
    { atSec: 5.4, durSec: 1.91, note: 60, gain: 0.36 },
    { atSec: 5.4, durSec: 1.91, note: 64, gain: 0.36 },
    { atSec: 5.4, durSec: 1.91, note: 67, gain: 0.36 },
    { atSec: 5.4, durSec: 1.91, note: 72, gain: 0.36 },
  ],
}

// The walk in two bare parts: the bass up to G, round by A and D, and a note half a beat late over each, D sharp leading to E.
// One note more than two parts: the C sharp struck with the A, which makes it a dominant. Then the top falls G, F sharp, F, E.
const BARE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.66, note: 48, gain: 0.5 },
    { atSec: 0.35, durSec: 0.66, note: 76, gain: 0.46 },
    { atSec: 0.7, durSec: 0.66, note: 52, gain: 0.5 },
    { atSec: 1.05, durSec: 0.66, note: 79, gain: 0.46 },
    { atSec: 1.4, durSec: 0.66, note: 53, gain: 0.5 },
    { atSec: 1.75, durSec: 0.66, note: 81, gain: 0.46 },
    { atSec: 2.1, durSec: 0.66, note: 54, gain: 0.5 },
    { atSec: 2.45, durSec: 0.66, note: 75, gain: 0.46 },
    { atSec: 2.8, durSec: 0.66, note: 55, gain: 0.5 },
    { atSec: 3.15, durSec: 0.66, note: 76, gain: 0.46 },
    { atSec: 3.5, durSec: 0.66, note: 57, gain: 0.5 },
    { atSec: 3.85, durSec: 0.66, note: 79, gain: 0.46 },
    { atSec: 4.2, durSec: 0.66, note: 50, gain: 0.5 },
    { atSec: 4.55, durSec: 0.66, note: 78, gain: 0.46 },
    { atSec: 4.9, durSec: 0.66, note: 55, gain: 0.5 },
    { atSec: 5.25, durSec: 0.66, note: 77, gain: 0.46 },
    { atSec: 5.6, durSec: 1.7, note: 48, gain: 0.5 },
    { atSec: 5.95, durSec: 1.35, note: 76, gain: 0.46 },
    { atSec: 3.5, durSec: 0.7, note: 73, gain: 0.36 },
  ],
}

// The walk rolled upward, one hand after the other: C, C/E, F, F sharp diminished seventh, C/G, G7, C.
const ROLLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.87, note: 36, gain: 0.52 },
    { atSec: 0.14, durSec: 0.73, note: 60, gain: 0.42 },
    { atSec: 0.28, durSec: 0.59, note: 64, gain: 0.42 },
    { atSec: 0.42, durSec: 0.45, note: 67, gain: 0.42 },
    { atSec: 0.9, durSec: 0.87, note: 40, gain: 0.52 },
    { atSec: 1.04, durSec: 0.73, note: 60, gain: 0.42 },
    { atSec: 1.18, durSec: 0.59, note: 67, gain: 0.42 },
    { atSec: 1.32, durSec: 0.45, note: 72, gain: 0.42 },
    { atSec: 1.8, durSec: 0.87, note: 41, gain: 0.52 },
    { atSec: 1.94, durSec: 0.73, note: 60, gain: 0.42 },
    { atSec: 2.08, durSec: 0.59, note: 65, gain: 0.42 },
    { atSec: 2.22, durSec: 0.45, note: 69, gain: 0.42 },
    { atSec: 2.7, durSec: 0.87, note: 42, gain: 0.52 },
    { atSec: 2.84, durSec: 0.73, note: 60, gain: 0.42 },
    { atSec: 2.98, durSec: 0.59, note: 63, gain: 0.42 },
    { atSec: 3.12, durSec: 0.45, note: 69, gain: 0.42 },
    { atSec: 3.6, durSec: 0.87, note: 43, gain: 0.52 },
    { atSec: 3.74, durSec: 0.73, note: 60, gain: 0.42 },
    { atSec: 3.88, durSec: 0.59, note: 64, gain: 0.42 },
    { atSec: 4.02, durSec: 0.45, note: 67, gain: 0.42 },
    { atSec: 4.5, durSec: 0.87, note: 43, gain: 0.52 },
    { atSec: 4.64, durSec: 0.73, note: 59, gain: 0.42 },
    { atSec: 4.78, durSec: 0.59, note: 65, gain: 0.42 },
    { atSec: 4.92, durSec: 0.45, note: 67, gain: 0.42 },
    { atSec: 5.4, durSec: 1.87, note: 36, gain: 0.52 },
    { atSec: 5.54, durSec: 1.73, note: 60, gain: 0.42 },
    { atSec: 5.68, durSec: 1.59, note: 64, gain: 0.42 },
    { atSec: 5.82, durSec: 1.45, note: 67, gain: 0.42 },
    { atSec: 5.96, durSec: 1.3, note: 76, gain: 0.4 },
  ],
}

// Four voices: C/E, F, F sharp diminished seventh, C/G, C. E flat rises to E, A falls to G, and the bass drops home.
const AMEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.37, note: 52, gain: 0.42 },
    { atSec: 0, durSec: 1.37, note: 60, gain: 0.42 },
    { atSec: 0, durSec: 1.37, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 1.37, note: 72, gain: 0.42 },
    { atSec: 1.4, durSec: 1.37, note: 53, gain: 0.42 },
    { atSec: 1.4, durSec: 1.37, note: 60, gain: 0.42 },
    { atSec: 1.4, durSec: 1.37, note: 69, gain: 0.42 },
    { atSec: 1.4, durSec: 1.37, note: 72, gain: 0.42 },
    { atSec: 2.8, durSec: 1.37, note: 54, gain: 0.42 },
    { atSec: 2.8, durSec: 1.37, note: 60, gain: 0.42 },
    { atSec: 2.8, durSec: 1.37, note: 69, gain: 0.42 },
    { atSec: 2.8, durSec: 1.37, note: 75, gain: 0.42 },
    { atSec: 4.2, durSec: 1.37, note: 55, gain: 0.42 },
    { atSec: 4.2, durSec: 1.37, note: 60, gain: 0.42 },
    { atSec: 4.2, durSec: 1.37, note: 67, gain: 0.42 },
    { atSec: 4.2, durSec: 1.37, note: 76, gain: 0.42 },
    { atSec: 5.6, durSec: 1.67, note: 48, gain: 0.42 },
    { atSec: 5.6, durSec: 1.67, note: 60, gain: 0.42 },
    { atSec: 5.6, durSec: 1.67, note: 67, gain: 0.42 },
    { atSec: 5.6, durSec: 1.67, note: 76, gain: 0.42 },
  ],
}

// The bass by itself: C E F F sharp G A D G C.
const BASS_WALK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.65, note: 36, gain: 0.6 },
    { atSec: 0.7, durSec: 0.65, note: 40, gain: 0.6 },
    { atSec: 1.4, durSec: 0.65, note: 41, gain: 0.6 },
    { atSec: 2.1, durSec: 0.65, note: 42, gain: 0.6 },
    { atSec: 2.8, durSec: 0.65, note: 43, gain: 0.6 },
    { atSec: 3.5, durSec: 0.65, note: 45, gain: 0.6 },
    { atSec: 4.2, durSec: 0.65, note: 38, gain: 0.6 },
    { atSec: 4.9, durSec: 0.65, note: 43, gain: 0.6 },
    { atSec: 5.6, durSec: 1.7, note: 36, gain: 0.6 },
  ],
}

// Only the end of the walk: F, F sharp, G, the G below, and C.
const BASS_SLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.35, note: 41, gain: 0.6 },
    { atSec: 1.4, durSec: 1.35, note: 42, gain: 0.6 },
    { atSec: 2.8, durSec: 1.25, note: 43, gain: 0.6 },
    { atSec: 4.1, durSec: 1.25, note: 31, gain: 0.6 },
    { atSec: 5.4, durSec: 1.9, note: 36, gain: 0.6 },
  ],
}

// The backward bass: C, B flat, A, A flat, G, then down to the low C.
const BASS_FALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.05, note: 48, gain: 0.6 },
    { atSec: 1.1, durSec: 1.05, note: 46, gain: 0.6 },
    { atSec: 2.2, durSec: 1.05, note: 45, gain: 0.6 },
    { atSec: 3.3, durSec: 1.05, note: 44, gain: 0.6 },
    { atSec: 4.4, durSec: 1.15, note: 43, gain: 0.6 },
    { atSec: 5.6, durSec: 1.7, note: 36, gain: 0.6 },
  ],
}

// The walk in six: C, then D and E into F, F sharp into G, and up by A and B to C.
const BASS_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.31, note: 36, gain: 0.6 },
    { atSec: 1.36, durSec: 0.29, note: 38, gain: 0.6 },
    { atSec: 1.7, durSec: 0.29, note: 40, gain: 0.6 },
    { atSec: 2.04, durSec: 1.31, note: 41, gain: 0.6 },
    { atSec: 3.4, durSec: 0.63, note: 42, gain: 0.6 },
    { atSec: 4.08, durSec: 0.63, note: 43, gain: 0.6 },
    { atSec: 4.76, durSec: 0.63, note: 45, gain: 0.6 },
    { atSec: 5.44, durSec: 0.63, note: 47, gain: 0.6 },
    { atSec: 6.12, durSec: 1.2, note: 48, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'walk-up-amens-hymnal-on-the-rack',
    name: 'Hymnal on the rack',
    category: 'keys',
    description:
      'A soft tine piano with its tremolo off and its tone turned down, run through quarter inch tape and a medium plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0, bark: 0.15, tone: 0.35, decay: 1.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-ushers-in-white-gloves',
    name: 'Ushers in white gloves',
    category: 'keys',
    description:
      'Bell tines at full bell with a slow release, gently flanged, in a reverb that rises into the step after each strike.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, hardness: 0.55, release: 1.2, tone: 0.95 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep' },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.5, time: 1.4 } },
    ],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-shout-at-the-offering',
    name: 'Shout at the offering',
    category: 'keys',
    description:
      'Hard-struck barking tines, driven, through a combo loudspeaker in a room and a tank of two springs.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { drive: 0.6, tone: 0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-supper-under-the-nave',
    name: 'Supper under the nave',
    category: 'keys',
    description: 'A dark tine piano with a short decay, heard from across a room and muffled.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 0.5, release: 0.1, hardness: 0.5 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-last-amen-still-turning',
    name: 'Last amen still turning',
    category: 'keys',
    description: 'Tines that pan slowly, each chord caught and held behind them by a sustainer.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { release: 2, decay: 3, tone: 0.4, volume: -14.5 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.55, decay: 12 } }],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-paper-fan-in-every-pew',
    name: 'Paper fan in every pew',
    category: 'keys',
    description:
      'Tines under a deep, quick mono tremolo of seven beats a second, with a fast phaser across it.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremoloRate: 7, tremolo: 0.95, tone: 0.45 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Fast throb', params: { mix: 0.5 } }],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-amber-glass-at-nine',
    name: 'Amber glass at nine',
    category: 'pad',
    description:
      'Long tines whose partials flicker band by band, with a faint octave rising in the reverb behind.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.8, tone: 0.6, volume: -14 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.85 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.4 } },
    ],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-counted-in-glass-beads',
    name: 'Counted in glass beads',
    category: 'bell',
    description:
      'Short glassy tines with each strike unfolded from low to high by delays across its colours.',
    instrument: { deviceId: 'tine-piano', preset: 'Glass bells', params: { release: 0.4 } },
    effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.5, time: 900 } }],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-halted-on-the-fourth',
    name: 'Halted on the fourth',
    category: 'plucked',
    description: 'Very short tines with extra bark, answered by the dotted repeats of a tape echo.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { hardness: 0.9, bark: 0.8 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.42, feedback: 0.5 } },
    ],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-nobody-damps-the-c',
    name: 'Nobody damps the C',
    category: 'pad',
    description:
      'Tines with no dampers, let through where two chords share a tone, so the C hangs on in a dark hall.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.3, tone: 0.4, release: 1.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.85 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-baptism-in-brown-water',
    name: 'Baptism in brown water',
    category: 'keys',
    description:
      'Dark long tines with a faint drift across the speakers, taken half under wavering water.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tone: 0.3, drive: 0.1 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows', params: { depth: 0.6 } }],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-turning-up-the-aisle',
    name: 'Turning up the aisle',
    category: 'keys',
    description:
      'Driven tines that cross the speakers very slowly and circle the head, in a small room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { bark: 0.8, drive: 0.35 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-throb-under-the-altar',
    name: 'Throb under the altar',
    category: 'keys',
    description:
      'Dark tines with a slow mono throb, an octave added below and one band pulsing once a second.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremolo: 0.5, tone: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.9 } },
      { deviceId: 'band-pulse', preset: 'One a second' },
    ],
    preview: SINK,
  },
  {
    id: 'walk-up-amens-tambourine-of-tines',
    name: 'Tambourine of tines',
    category: 'bell',
    description:
      'Bright short tines with a quick stereo flutter, scattered into high grains after each strike.',
    instrument: { deviceId: 'tine-piano', preset: 'Fast shimmer', params: { decay: 0.35 } },
    effects: [{ deviceId: 'grain-delay', preset: 'High glitter', params: { mix: 0.45 } }],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-tine-with-a-reed-throat',
    name: 'Tine with a reed throat',
    category: 'keys',
    description:
      'Tines at full bark, reedy and softly struck, their tail shaped into a single sung vowel.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { tremolo: 0.2, tone: 0.6, release: 0.5, volume: -18.5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Lone voice', params: { mix: 0.5 } }],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-deacon-with-the-amp-up',
    name: 'Deacon with the amp up',
    category: 'keys',
    description:
      'Tines driven hard into their own amplifier and again into a triode, then a dark plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { drive: 1, bark: 0.9, volume: -6.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-testimony-on-cassette',
    name: 'Testimony on cassette',
    category: 'keys',
    description:
      'A soft tine piano on a worn, wobbling cassette, with echoes that bounce closer together.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bark: 0.5, tone: 0.4, decay: 0.7 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.5 } },
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.4 } },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-tines-sagging-home',
    name: 'Tines sagging home',
    category: 'pad',
    description: 'Long tines with almost no bell, their tail sinking in pitch as it blurs.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.05, bark: 0.1, tone: 0.3 },
    },
    effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.65, sag: -45 } }],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-collection-bowl-rings',
    name: 'Collection bowl rings',
    category: 'bell',
    description: 'Short bell tines over a table of metal bowls in C that ring on after the touch.',
    instrument: { deviceId: 'tine-piano', preset: 'Bell tines', params: { decay: 0.4, tone: 0.5 } },
    effects: [{ deviceId: 'bowls', preset: 'Long ring', params: { root: 0, scale: 0, mix: 0.55 } }],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-no-hammer-in-the-amen',
    name: 'No hammer in the amen',
    category: 'pad',
    description:
      'Long tines with next to no bell, every attack faded in over half a second, blurred into a fuzzy wall of reverb.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tone: 0.5, decay: 4, release: 2, volume: -14 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 500 } },
      { deviceId: 'haze', preset: 'Glowing wall', params: { mix: 0.5 } },
    ],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-left-shoe-on-the-pedals',
    name: 'Left shoe on the pedals',
    category: 'bass',
    description:
      'Dark fingered electric bass with no growl, a pedal stop added an octave under each step.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { tone: 0.3, sustain: 12, growl: 0 },
    },
    effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.5 } }],
    preview: BASS_WALK,
  },
  {
    id: 'walk-up-amens-picked-up-to-the-fourth',
    name: 'Picked up to the fourth',
    category: 'bass',
    description:
      'Bright picked bass flattened by a fast limiter, then hollowed by a slow negative flanger.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { tone: 0.8, resonance: 0.4 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Flattened' },
      { deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.55 } },
    ],
    preview: BASS_WALK,
  },
  {
    id: 'walk-up-amens-thumb-on-the-carpet',
    name: 'Thumb on the carpet',
    category: 'bass',
    description: 'Heavily muted bass through a dark loudspeaker and a tight room.',
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { mute: 0.8 } },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
    preview: BASS_WALK,
  },
  {
    id: 'walk-up-amens-sways-late-on-f-sharp',
    name: 'Sways late on F sharp',
    category: 'bass',
    description:
      'Singing fretless with strong growl, a wide vibrato that waits for the held note, and a tape loop that returns each step.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { growl: 0.9, sustain: 12, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Wide drone',
        params: { wait: 350, grow: 600, depth: 34, rate: 4 },
      },
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.5 } },
    ],
    preview: BASS_SLOW,
  },
  {
    id: 'walk-up-amens-doghouse-by-the-pulpit',
    name: 'Doghouse by the pulpit',
    category: 'bass',
    description: 'Round plucked upright bass sounding inside a large hollow cistern.',
    instrument: { deviceId: 'string-bass', preset: 'Round upright', params: { sustain: 4 } },
    effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.75 } }],
    preview: BASS_WALK,
  },
  {
    id: 'walk-up-amens-upright-strings-awake',
    name: 'Upright, strings awake',
    category: 'bass',
    description:
      'Upright bass with a long ring under a bank of C major strings, heard louder than the bass itself.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { release: 0.8, tone: 0.8 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 0, mode: 0, sympathy: 0.9, mix: 0.75 },
      },
    ],
    preview: BASS_SLOW,
  },
  {
    id: 'walk-up-amens-flat-strings-flat-feet',
    name: 'Flat strings, flat feet',
    category: 'bass',
    description:
      'Dark flat strings with a short sustain, driven through a tube curve, a backwards undertow an octave below.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { tone: 0.2, sustain: 1.2 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 18 } },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { mix: 0.4 } },
    ],
    preview: BASS_SIX,
  },
  {
    id: 'walk-up-amens-bow-with-no-bowman',
    name: 'Bow with no bowman',
    category: 'bass',
    description:
      'Quiet fretless with each attack faded in over a third of a second, in a dark hall.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { growl: 0.2, tone: 0.2, release: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
    preview: BASS_SLOW,
  },
  {
    id: 'walk-up-amens-rattle-in-the-front-pew',
    name: 'Rattle in the front pew',
    category: 'bass',
    description: 'Rattling picked bass under a slow harmonic tremolo.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { tone: 0.7, sustain: 6, volume: -0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.6, depth: 0.7 } },
    ],
    preview: BASS_FALL,
  },
  {
    id: 'walk-up-amens-near-the-bridge-to-home',
    name: 'Near the bridge to home',
    category: 'bass',
    description:
      'Bass plucked close to the bridge, its lowest weight trimmed and its middle pushed, with one slap of tape echo.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { mute: 0, tone: 0.85, volume: 3.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 90 } },
    ],
    preview: BASS_WALK,
  },
  {
    id: 'walk-up-amens-elder-walks-from-below',
    name: 'Elder walks from below',
    category: 'bass',
    description:
      'Soft thumbed bass with an octave added under it and a little one over it, its low end held in the middle.',
    instrument: { deviceId: 'string-bass', preset: 'Thumb at the neck', params: { tone: 0.2 } },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { dry: 0.7, sub2: 0, sub1: 0.8, up1: 0.35 } },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
    preview: BASS_FALL,
  },
  {
    id: 'walk-up-amens-quick-walk-in-six',
    name: 'Quick walk in six',
    category: 'bass',
    description:
      'Picked bass with a little mute, half of it through a filter that opens with each touch.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.15, touch: 0.8, volume: 3 },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.5 } }],
    preview: BASS_SIX,
  },
  {
    id: 'walk-up-amens-five-steps-in-one-ring',
    name: 'Five steps in one ring',
    category: 'bass',
    description:
      'Open bass with a long ring, each step blurred into a clean sustain that reaches into the next.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { sustain: 20, release: 0.6, tone: 0.6 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.5, blur: 0.5 } },
    ],
    preview: BASS_SLOW,
  },
  {
    id: 'walk-up-amens-growl-at-the-sharp-four',
    name: 'Growl at the sharp four',
    category: 'bass',
    description:
      'Growling fretless plucked hard, through heavy spinning rotors and slow compression.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { touch: 0.85, growl: 1, tone: 0.95 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Heavy rotors' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
    preview: BASS_WALK,
  },
  {
    id: 'walk-up-amens-tent-revival-doghouse',
    name: 'Tent revival doghouse',
    category: 'bass',
    description: 'Slapped upright bass recorded hot on a cassette four-track.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { sustain: 3, resonance: 0.6, volume: 3.5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { drive: 0.6 } }],
    preview: BASS_SIX,
  },
  {
    id: 'walk-up-amens-bass-from-the-last-pew',
    name: 'Bass from the last pew',
    category: 'bass',
    description:
      'Dark soft upright heard from the back of a hall over the faint noise of an empty room.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { tone: 0.3, mute: 0, volume: 0 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.6 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -50 } },
    ],
    preview: BASS_FALL,
  },
  {
    id: 'walk-up-amens-sampled-deacon',
    name: 'Sampled deacon',
    category: 'bass',
    description:
      'Open fingered bass with growl, through the worn converters of an early sampler and a phaser that jumps at random.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { tone: 0.8, resonance: 0.8, growl: 0.6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'phaser', preset: 'Random steps', params: { mix: 0.5 } },
    ],
    preview: BASS_SIX,
  },
  {
    id: 'walk-up-amens-cellos-follow-the-feet',
    name: 'Cellos follow the feet',
    category: 'bass',
    description: 'Soft fretless with a dark string pad that swells in behind each note it holds.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { touch: 0.1, tone: 0.35, release: 1.5, volume: 2.5 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.5 } }],
    preview: BASS_SLOW,
  },
  {
    id: 'walk-up-amens-iron-below-the-loft',
    name: 'Iron below the loft',
    category: 'bass',
    description:
      'Upright bass with a bright short pluck, through a dark spring and a transformer that thickens the lows.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { tone: 0.7, touch: 0.5, sustain: 1, volume: 3.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.4 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
    preview: BASS_FALL,
  },
  {
    id: 'walk-up-amens-goliath-goes-to-the-pew',
    name: 'Goliath goes to the pew',
    category: 'bass',
    description: 'A ringing bass given a giant body while its notes stay put, in a long plate.',
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { touch: 0.5, tone: 0.8, release: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { mix: 0.9 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: BASS_FALL,
  },
  {
    id: 'walk-up-amens-parlor-reed-two-stops',
    name: 'Parlor reed, two stops',
    category: 'organ',
    description:
      'A harmonium down to two stops, the main rank and its octave, half flute and half reed, warmed, in a dark plate.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { sub: 0, octave: 0.4, twelfth: 0, fifteenth: 0, celeste: 0, reed: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-quick-flutes-short-walk',
    name: 'Quick flutes, short walk',
    category: 'organ',
    description:
      'Flute pipes that speak and stop at once, wobbling a little in pitch, in a short spring.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.2, attack: 0.02, release: 0.12 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.4 } },
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { depth: 0.3 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-celeste-over-a-low-c',
    name: 'Celeste over a low C',
    category: 'pad',
    description:
      'Slow beating celeste pipes whose bands swell and drift from side to side, opened very wide.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.8, release: 2.5, volume: -19 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-sunday-night-drawn-out',
    name: 'Sunday night, drawn out',
    category: 'organ',
    description:
      'All ranks drawn, the lowest by half, spun and overdriven by a rotary cabinet in a reverb that stops dead.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { reed: 0.7, fifteenth: 0.8, sub: 0.4, volume: -15.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.5 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-pumped-in-the-next-house',
    name: 'Pumped in the next house',
    category: 'organ',
    description: 'A pump organ with deep bellows and much wind, heard from next door.',
    instrument: { deviceId: 'organ', preset: 'Pump organ', params: { bellows: 1, breath: 0.7 } },
    effects: [{ deviceId: 'distance', preset: 'Next door', params: { distance: 0.55 } }],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-tremulant-at-the-rail',
    name: 'Tremulant at the rail',
    category: 'organ',
    description:
      'A flute rank and its octave with the tremulant all the way up, their reverb rising by fifths.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 1, octave: 0.6 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Narrow fifth', params: { mix: 0.4 } }],
    preview: SINK,
  },
  {
    id: 'walk-up-amens-pipes-behind-the-robes',
    name: 'Pipes behind the robes',
    category: 'pad',
    description: 'Distant pipes that speak slowly in a plain hall, levelled by a dense compressor.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { tone: 2600, attack: 0.7, release: 2 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Plain hall', params: { mix: 0.55 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-twelfth-beside-the-root',
    name: 'Twelfth beside the root',
    category: 'organ',
    description:
      'A flute with its twelfth nearly as loud beside it, followed by canonic copies an octave up and an octave down.',
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { octave: 0.3, release: 1.2 },
    },
    effects: [{ deviceId: 'canon', preset: 'Octaves apart', params: { mix: 0.4 } }],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-two-flutes-one-sharp',
    name: 'Two flutes, one sharp',
    category: 'organ',
    description:
      'A flute and a celeste rank as loud as it, beating, slowly phased and put on cassette.',
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { celeste: 1, attack: 0.15, release: 0.6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.6 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-old-voice-stop-in-a-nave',
    name: 'Old voice stop in a nave',
    category: 'organ',
    description:
      'A reed stop with full tremulant, its held chords opening into a chorus in a cathedral.',
    instrument: { deviceId: 'organ', preset: 'Vox humana', params: { tone: 3200, volume: -14.5 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Opens to chorus' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.35, decay: 6 } },
    ],
    preview: AMEN,
  },
  {
    id: 'walk-up-amens-amen-over-the-wireless',
    name: 'Amen over the wireless',
    category: 'organ',
    description:
      'Bright beating reeds through a small bedside loudspeaker with radio static beneath.',
    instrument: { deviceId: 'organ', preset: 'Accordion', params: { release: 0.05, bellows: 0.4 } },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio' },
      { deviceId: 'noise-floor', preset: 'Radio static', params: { level: -46 } },
    ],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-box-of-reeds-on-the-knee',
    name: 'Box of reeds on the knee',
    category: 'drone',
    description: 'Breathing reeds whose tails are lifted and whose edges are smeared wide.',
    instrument: { deviceId: 'organ', preset: 'Shruti box', params: { attack: 0.5, volume: -17.5 } },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.35 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-sixteen-feet-below-four',
    name: 'Sixteen feet below four',
    category: 'organ',
    description:
      'A deep sub-octave pedal with a detuned octave added above it, sounding inside an open pipe.',
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { octave: 0.3, tone: 1400, attack: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.5 } },
    ],
    preview: BASS_FALL,
  },
  {
    id: 'walk-up-amens-more-wind-than-pipe',
    name: 'More wind than pipe',
    category: 'wind',
    description:
      'A flute rank that is mostly wind, opening and closing like breath, its tail bending up by fifths.',
    instrument: { deviceId: 'organ', preset: 'Windy flute', params: { attack: 0.3, octave: 0.25 } },
    effects: [
      { deviceId: 'breath', preset: 'Long slow sigh' },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.45 } },
    ],
    preview: AMEN,
  },
  {
    id: 'walk-up-amens-wax-record-of-the-close',
    name: 'Wax record of the close',
    category: 'organ',
    description: 'A muffled organ on a worn fast-turning record.',
    instrument: { deviceId: 'organ', preset: 'Through the wall', params: { tone: 900 } },
    effects: [{ deviceId: 'vinyl', preset: 'Ballroom 78', params: { mix: 0.8 } }],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-all-windows-at-the-close',
    name: 'All windows at the close',
    category: 'pad',
    description:
      'Bright upper pipes that bloom over a second, only their tones kept, in a vast nave.',
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 0.9, release: 2, tone: 8000, volume: -14 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.5 } },
    ],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-skating-organ-amen',
    name: 'Skating organ amen',
    category: 'organ',
    description: 'Deep and bright flute pipes together, with a galloping tape echo and more top.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.8, fifteenth: 0.4, attack: 0.04, release: 0.3, tone: 9000 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-four-to-a-hymnal',
    name: 'Four to a hymnal',
    category: 'voice',
    description: 'Open ah voices that speak quickly, in a small plate with a voice equaliser.',
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.25, release: 1, volume: -4.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Voice' },
    ],
    preview: AMEN,
  },
  {
    id: 'walk-up-amens-men-hold-the-low-c',
    name: 'Men hold the low C',
    category: 'voice',
    description: 'Low voices on a narrow ee with no vibrato, in a cavern of swarming echoes.',
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { vowel: 0.5, release: 3 } },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.5 } }],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-trebles-by-the-window',
    name: 'Trebles by the window',
    category: 'voice',
    description: 'High darkened oo voices, their bands dimming one by one, in a thin reverb.',
    instrument: { deviceId: 'choir', preset: 'Boys ooh', params: { tone: 3000 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Slow weather' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.4 } },
    ],
    preview: SINK,
  },
  {
    id: 'walk-up-amens-amen-on-an-open-porch',
    name: 'Amen on an open porch',
    category: 'voice',
    description: 'Mostly breath, left out in a light breeze that moves its level and tone.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.8, release: 2, breath: 0.8 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.5 } }],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-vowel-bends-at-f-sharp',
    name: 'Vowel bends at F sharp',
    category: 'voice',
    description:
      'A few voices drifting through every vowel, their partials bent toward bells, in a dark hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 0.9, release: 1.6, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
    preview: AMEN,
  },
  {
    id: 'walk-up-amens-ee-worn-into-the-tape',
    name: 'Ee worn into the tape',
    category: 'voice',
    description: 'Thin ee voices laid on a tape loop that wears as it returns.',
    instrument: { deviceId: 'choir', preset: 'Glass ee', params: { attack: 0.6, release: 1.6 } },
    effects: [{ deviceId: 'tape-loop', preset: 'Worn out', params: { mix: 0.5 } }],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-one-singer-to-a-part',
    name: 'One singer to a part',
    category: 'voice',
    description:
      'One singer with vibrato on each note, scattered into seven uneven echoes over a long plate.',
    instrument: { deviceId: 'choir', preset: 'Soloist', params: { vibrato: 22 } },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    preview: SINK,
  },
  {
    id: 'walk-up-amens-humming-past-the-sermon',
    name: 'Humming past the sermon',
    category: 'voice',
    description:
      'Closed humming voices with stops drawn an octave below and far above, half muffled by an old sampler.',
    instrument: { deviceId: 'choir', preset: 'Humming', params: { tone: 1400, attack: 0.4 } },
    effects: [
      { deviceId: 'stops', preset: 'Sub and silver', params: { mix: 0.65 } },
      { deviceId: 'patina', preset: 'Muffled sampler', params: { mix: 0.5 } },
    ],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-altos-in-the-cabinet',
    name: 'Altos in the cabinet',
    category: 'voice',
    description: 'Alto eh voices with wide vibrato, turned by slow rotors and warmed.',
    instrument: { deviceId: 'choir', preset: 'Altos eh', params: { attack: 0.3, vibrato: 28 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
    preview: AMEN,
  },
  {
    id: 'walk-up-amens-basses-walk-underneath',
    name: 'Basses walk underneath',
    category: 'voice',
    description: 'Dark bass voices that speak promptly, with a copy an octave below them.',
    instrument: { deviceId: 'choir', preset: 'Basses ah', params: { attack: 0.2 } },
    effects: [{ deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.5 } }],
    preview: AMEN,
  },
  {
    id: 'walk-up-amens-tenors-in-the-doorway',
    name: 'Tenors in the doorway',
    category: 'voice',
    description: 'Prompt tenor oh voices through glassy converters, loosely doubled.',
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.12, release: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy', params: { mix: 0.6 } },
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.5 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-amen-that-will-not-stand',
    name: 'Amen that will not stand',
    category: 'voice',
    description: 'Voices with a very wide slow vibrato, blurred into a diffuse room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { vibrato: 55, attack: 0.5, release: 1.6 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Diffuse room', params: { mix: 0.6 } }],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-choir-across-the-river',
    name: 'Choir across the river',
    category: 'voice',
    description:
      'A breathy far choir, half under water, folded back on itself by backwards echoes.',
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 0.9, release: 3, tone: 4000 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Half in' },
      { deviceId: 'reverse-delay', preset: 'Folding over', params: { mix: 0.4 } },
    ],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-clipped-ohs-on-the-walk',
    name: 'Clipped ohs on the walk',
    category: 'voice',
    description: 'Short round voices with no attack, chorused echoes and an amp tremolo.',
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { release: 0.6, vowel: 0.7, volume: -5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { mix: 0.45 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo' },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-trebles-thin-to-nothing',
    name: 'Trebles thin to nothing',
    category: 'voice',
    description:
      'High voices drifting through vowels, a faint ring modulation on C, their tail rising and thinning out.',
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -4.5, attack: 0.4, release: 2, breath: 0.1 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { root: 0 } },
      { deviceId: 'melt', preset: 'Into thin air', params: { mix: 0.5 } },
    ],
    preview: SINK,
  },
  {
    id: 'walk-up-amens-practice-before-church',
    name: 'Practice before church',
    category: 'keys',
    description:
      'A felt piano with its own room shut off, dulled by tape, with C major strings ringing softly along.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.75, reverbMix: 0, resonance: 0.2, polyphony: 20, outputDb: -16 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { root: 0, mode: 0, mix: 0.35 } },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-sunday-school-upright',
    name: 'Sunday school upright',
    category: 'keys',
    description:
      'An old upright with a noisy action and loose unisons, through a loudspeaker down the hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { reverbMix: 0, detune: 0.8, outputDb: -15.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { mix: 0.7 } }],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-hard-keys-cold-morning',
    name: 'Hard keys, cold morning',
    category: 'keys',
    description: 'A stiff, hard-hammered upright whose echoes cross from side to side.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0.1, hardness: 0.8, outputDb: -9.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.45 } }],
    preview: ROLLED,
  },
  {
    id: 'walk-up-amens-pedal-through-the-amen',
    name: 'Pedal through the amen',
    category: 'keys',
    description:
      'A felted piano with the pedal held and its spectrum smeared into a mist, levelled.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { reverbMix: 0, felt: 0.5, outputDb: -16 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.6 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
    preview: WHITE_SLOW,
  },
  {
    id: 'walk-up-amens-only-the-soft-knock',
    name: 'Only the soft knock',
    category: 'keys',
    description:
      'The softest hammers and a full thump, their quiet overtones turned up, in a bright plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0, outputDb: -9 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-piano-by-a-turning-horn',
    name: 'Piano by a turning horn',
    category: 'keys',
    description:
      'A bare piano at half pedal, heard from a rotary cabinet across the room and a low cathedral.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { sustain: 0.4, polyphony: 20, outputDb: -12 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35, decay: 8 } },
    ],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-grand-under-the-dust',
    name: 'Grand under the dust',
    category: 'keys',
    description: 'A gritty grand under a low-pass that moves very slowly, with worn tape repeats.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { grit: 0.8, reverbMix: 0.05, outputDb: -11.5 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.35 } },
    ],
    preview: ROLLED,
  },
  {
    id: 'walk-up-amens-things-in-the-hymn-piano',
    name: 'Things in the hymn piano',
    category: 'keys',
    description:
      'A piano with a different object on every key, its colours delayed in scattered order, in a tight chamber.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { decay: 1.6, volume: 1.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Scattered notes', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.35 } },
    ],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-record-of-an-old-amen',
    name: 'Record of an old amen',
    category: 'keys',
    description:
      'A piano with nothing between its strings, struck firmly, on a worn and crackling record, slightly widened.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { hammer: 0.7, volume: 3 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find' },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
    preview: WALK,
  },
  {
    id: 'walk-up-amens-bolts-in-the-bell-tower',
    name: 'Bolts in the bell tower',
    category: 'bell',
    description: 'Bolted strings left to ring, octaves fading in around them in a hall.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { decay: 2.5, volume: 3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { dry: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-rubber-soles-on-oak',
    name: 'Rubber soles on oak',
    category: 'plucked',
    description:
      'Rubber-stopped strings that thunk, returning once a second on a loop of tape, the soft ones lifted by a limiter.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { tone: 0.5, volume: 6 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -2 } },
    ],
    preview: ROLLED,
  },
  {
    id: 'walk-up-amens-whispered-through-felt',
    name: 'Whispered through felt',
    category: 'pad',
    description: 'Felt-muted strings whose attacks are blurred to a soft wide cloud.',
    instrument: { deviceId: 'prepared-piano', preset: 'Felt whisper', params: { volume: 4.5 } },
    effects: [
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.8 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-bulletin-in-the-strings',
    name: 'Bulletin in the strings',
    category: 'keys',
    description:
      'Strings buzzing against paper, in a small wooden body, swelling and dimming once in four seconds.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { decay: 1.8, volume: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.5 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { depth: 0.7 } },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-iron-amen-very-slow',
    name: 'Iron amen, very slow',
    category: 'bell',
    description:
      'Fully bolted strings at a third of their length, dark and long, their tail drifting downward in the reverb.',
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { tone: 0.4, volume: 4 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.5, decay: 10 } }],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-glow-on-the-last-c',
    name: 'Glow on the last C',
    category: 'keys',
    description:
      'Felted keys whose overtones glow quickly and let go, with a faint dark tape echo and fuller lows.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 0.6, fade: 2, volume: -14.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
    ],
    preview: SLOW,
  },
  {
    id: 'walk-up-amens-bells-that-stay-for-amen',
    name: 'Bells that stay for amen',
    category: 'bell',
    description:
      'Bells whose own overtones rise after them, in a comb that stands still, their ends lifted.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { decay: 3, bloom: 1.2, volume: -3.5 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Standing comb', params: { mix: 0.4 } },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
    preview: BARE,
  },
  {
    id: 'walk-up-amens-plucked-up-the-aisle',
    name: 'Plucked up the aisle',
    category: 'plucked',
    description: 'Plucked notes with soft attacks that turn into a haze, stirred by slow rotors.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { glow: 0.7, volume: -12 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'sift', preset: 'Soft hammers' },
    ],
    preview: ROLLED,
  },
  {
    id: 'walk-up-amens-felt-that-draws-a-stop',
    name: 'Felt that draws a stop',
    category: 'organ',
    description: 'Dark felt strikes that swell into a glow, with organ stops speaking around them.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { bloom: 1, glow: 0.9, volume: -16.5 },
    },
    effects: [{ deviceId: 'stops', preset: 'Principal chorus', params: { mix: 0.7 } }],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-glass-over-a-low-pedal',
    name: 'Glass over a low pedal',
    category: 'pad',
    description: 'Still glass tones that never waver by themselves, drifting in a small flock.',
    instrument: { deviceId: 'afterglow', preset: 'Still glass', params: { strike: 0.3, decay: 1 } },
    effects: [{ deviceId: 'murmuration', preset: 'Slow drift', params: { mix: 0.55 } }],
    preview: PLAGAL,
  },
  {
    id: 'walk-up-amens-swell-into-the-fourth',
    name: 'Swell into the fourth',
    category: 'pad',
    description:
      'Overtones that swell quickly with hardly a strike and a soft halo, doubled by a glassy string pad on new tape.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Quick swell',
      params: { bloom: 0.6, fade: 2.5, halo: 0.5, tone: 0.45 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { mix: 0.5 } },
      { deviceId: 'patina', preset: 'New tape' },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-mirror-on-the-white-keys',
    name: 'Mirror on the white keys',
    category: 'pad',
    description:
      'Filtered noise on each key and its mirror within C major, quick to speak, warmed by tape.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { attack: 0.1, release: 0.8, scale: 0, root: 0, center: 60 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth', params: { outputDb: -4 } }],
    preview: WHITE,
  },
  {
    id: 'walk-up-amens-reflections-in-the-font',
    name: 'Reflections in the font',
    category: 'pad',
    description: 'Narrow bands of noise and their reflections, limited, with an airy hall behind.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { attack: 0.4, release: 2, center: 64, width: 40 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.4 } },
    ],
    preview: WHITE_SLOW,
  },
  {
    id: 'walk-up-amens-walk-made-of-breath',
    name: 'Walk made of breath',
    category: 'wind',
    description:
      'One resonant band of noise for each key, with no reflections, glued and sent through long springs.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Chromatic whistle',
      params: { attack: 0.05, release: 1.5, resonance: 70 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } },
    ],
    preview: BACK,
  },
  {
    id: 'walk-up-amens-everything-falls-to-c',
    name: 'Everything falls to C',
    category: 'pad',
    description:
      'Strummed noise chords that lean toward their centre, with echoes that gather closer.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { attack: 0.3, center: 60, strum: 60, release: 2.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -7 } },
      { deviceId: 'constellation', preset: 'Gathering in', params: { mix: 0.4 } },
    ],
    preview: WHITE_SLOW,
  },
  {
    id: 'walk-up-amens-low-mirror-in-the-nave',
    name: 'Low mirror in the nave',
    category: 'drone',
    description:
      'A low mirror of broad bands in C major, weighted by tape and swelling in three slow bands.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { scale: 0, root: 0, attack: 0.5, center: 53, release: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -12 } },
      { deviceId: 'currents', preset: 'Deep swell' },
    ],
    preview: WHITE_SLOW,
  },
  {
    id: 'walk-up-amens-a-sinks-to-a-flat',
    name: 'A sinks to A flat',
    category: 'pad',
    description:
      'Warm tones with a slow chorus, crossed by one sine that sweeps every eight seconds, in a hazy plate.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Warm crossing',
      params: { attack: 0.3, release: 2, time: 8, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
    preview: SINK,
  },
  {
    id: 'walk-up-amens-pure-tones-two-steps',
    name: 'Pure tones, two steps',
    category: 'organ',
    description:
      'Pure tones that start and stop promptly, a sine beating quickly through them, with a faint canon.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Pure crossing',
      params: { attack: 0.08, release: 0.6, time: 5, reach: 2 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
    preview: WHITE_SLOW,
  },
  {
    id: 'walk-up-amens-sines-behind-the-altar',
    name: 'Sines behind the altar',
    category: 'drone',
    description:
      'Fully warmed tones that take a second to arrive, brightened by a drive, in a vast hollow.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Soft bloom',
      params: { attack: 1, release: 2, level: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { mix: 0.5 } },
    ],
    preview: PLAGAL,
  },
]
