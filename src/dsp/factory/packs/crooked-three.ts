import { type FactoryPreset, type Phrase } from '../types'

// A dance in three with no beat even: long, medium, short, at 39, 36 and 25 percent of a bar that
// stays steady. Fiddles, zithers and harps over open strings, what rings under them, and the foot.
// Each instrument walks from near to far and from stopped to open; a dozen or so of the presets play
// the tune short, long, medium, and a dozen play it even.

// The tune in F Lydian over the open strings F and C: A B C, D C B, C A G, A and F. Beats of
// 39, 36 and 25 percent of a steady bar of 1.6 s, so the second beat comes early.
const LONG_MEDIUM_SHORT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.587, note: 53, gain: 0.3 },
    { atSec: 0, durSec: 0.605, note: 69, gain: 0.5 },
    { atSec: 0.624, durSec: 0.541, note: 60, gain: 0.23 },
    { atSec: 0.624, durSec: 0.559, note: 71, gain: 0.42 },
    { atSec: 1.2, durSec: 0.388, note: 60, gain: 0.21 },
    { atSec: 1.2, durSec: 0.388, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 0.587, note: 53, gain: 0.3 },
    { atSec: 1.6, durSec: 0.605, note: 74, gain: 0.5 },
    { atSec: 2.224, durSec: 0.541, note: 60, gain: 0.23 },
    { atSec: 2.224, durSec: 0.559, note: 72, gain: 0.42 },
    { atSec: 2.8, durSec: 0.388, note: 60, gain: 0.21 },
    { atSec: 2.8, durSec: 0.388, note: 71, gain: 0.42 },
    { atSec: 3.2, durSec: 0.587, note: 53, gain: 0.3 },
    { atSec: 3.2, durSec: 0.605, note: 72, gain: 0.5 },
    { atSec: 3.824, durSec: 0.541, note: 60, gain: 0.23 },
    { atSec: 3.824, durSec: 0.559, note: 69, gain: 0.42 },
    { atSec: 4.4, durSec: 0.388, note: 60, gain: 0.21 },
    { atSec: 4.4, durSec: 0.388, note: 67, gain: 0.42 },
    { atSec: 4.8, durSec: 0.587, note: 53, gain: 0.3 },
    { atSec: 4.8, durSec: 1.164, note: 69, gain: 0.48 },
    { atSec: 5.424, durSec: 0.541, note: 60, gain: 0.23 },
    { atSec: 6, durSec: 1.1, note: 53, gain: 0.26 },
    { atSec: 6, durSec: 1.1, note: 60, gain: 0.21 },
    { atSec: 6, durSec: 1.1, note: 65, gain: 0.46 },
  ],
}

// The same tune and the same bar, limping the other way: 25, 40 and 35 percent.
const SHORT_LONG_MEDIUM: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.376, note: 53, gain: 0.3 },
    { atSec: 0, durSec: 0.388, note: 69, gain: 0.5 },
    { atSec: 0.4, durSec: 0.602, note: 60, gain: 0.23 },
    { atSec: 0.4, durSec: 0.621, note: 71, gain: 0.42 },
    { atSec: 1.04, durSec: 0.543, note: 60, gain: 0.21 },
    { atSec: 1.04, durSec: 0.543, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 0.376, note: 53, gain: 0.3 },
    { atSec: 1.6, durSec: 0.388, note: 74, gain: 0.5 },
    { atSec: 2, durSec: 0.602, note: 60, gain: 0.23 },
    { atSec: 2, durSec: 0.621, note: 72, gain: 0.42 },
    { atSec: 2.64, durSec: 0.543, note: 60, gain: 0.21 },
    { atSec: 2.64, durSec: 0.543, note: 71, gain: 0.42 },
    { atSec: 3.2, durSec: 0.376, note: 53, gain: 0.3 },
    { atSec: 3.2, durSec: 0.388, note: 72, gain: 0.5 },
    { atSec: 3.6, durSec: 0.602, note: 60, gain: 0.23 },
    { atSec: 3.6, durSec: 0.621, note: 69, gain: 0.42 },
    { atSec: 4.24, durSec: 0.543, note: 60, gain: 0.21 },
    { atSec: 4.24, durSec: 0.543, note: 67, gain: 0.42 },
    { atSec: 4.8, durSec: 0.376, note: 53, gain: 0.3 },
    { atSec: 4.8, durSec: 1.009, note: 69, gain: 0.48 },
    { atSec: 5.2, durSec: 0.602, note: 60, gain: 0.23 },
    { atSec: 5.84, durSec: 1.26, note: 53, gain: 0.26 },
    { atSec: 5.84, durSec: 1.26, note: 60, gain: 0.21 },
    { atSec: 5.84, durSec: 1.26, note: 65, gain: 0.46 },
  ],
}

// The same tune once more in three even beats.
const EVEN_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.501, note: 53, gain: 0.3 },
    { atSec: 0, durSec: 0.517, note: 69, gain: 0.5 },
    { atSec: 0.533, durSec: 0.501, note: 60, gain: 0.23 },
    { atSec: 0.533, durSec: 0.517, note: 71, gain: 0.42 },
    { atSec: 1.067, durSec: 0.517, note: 60, gain: 0.21 },
    { atSec: 1.067, durSec: 0.517, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 0.501, note: 53, gain: 0.3 },
    { atSec: 1.6, durSec: 0.517, note: 74, gain: 0.5 },
    { atSec: 2.133, durSec: 0.501, note: 60, gain: 0.23 },
    { atSec: 2.133, durSec: 0.517, note: 72, gain: 0.42 },
    { atSec: 2.667, durSec: 0.517, note: 60, gain: 0.21 },
    { atSec: 2.667, durSec: 0.517, note: 71, gain: 0.42 },
    { atSec: 3.2, durSec: 0.501, note: 53, gain: 0.3 },
    { atSec: 3.2, durSec: 0.517, note: 72, gain: 0.5 },
    { atSec: 3.733, durSec: 0.501, note: 60, gain: 0.23 },
    { atSec: 3.733, durSec: 0.517, note: 69, gain: 0.42 },
    { atSec: 4.267, durSec: 0.517, note: 60, gain: 0.21 },
    { atSec: 4.267, durSec: 0.517, note: 67, gain: 0.42 },
    { atSec: 4.8, durSec: 0.501, note: 53, gain: 0.3 },
    { atSec: 4.8, durSec: 1.035, note: 69, gain: 0.48 },
    { atSec: 5.333, durSec: 0.501, note: 60, gain: 0.23 },
    { atSec: 5.867, durSec: 1.233, note: 53, gain: 0.26 },
    { atSec: 5.867, durSec: 1.233, note: 60, gain: 0.21 },
    { atSec: 5.867, durSec: 1.233, note: 65, gain: 0.46 },
  ],
}

// Double stops in thirds over the held open strings F and C, long, medium, short, B natural kept.
const STOPPED_AND_OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.681, note: 69, gain: 0.34 },
    { atSec: 0, durSec: 0.681, note: 72, gain: 0.46 },
    { atSec: 0, durSec: 1.74, note: 53, gain: 0.26 },
    { atSec: 0, durSec: 1.74, note: 60, gain: 0.22 },
    { atSec: 0.702, durSec: 0.629, note: 71, gain: 0.34 },
    { atSec: 0.702, durSec: 0.629, note: 74, gain: 0.46 },
    { atSec: 1.35, durSec: 0.437, note: 72, gain: 0.34 },
    { atSec: 1.35, durSec: 0.437, note: 76, gain: 0.46 },
    { atSec: 1.8, durSec: 0.681, note: 71, gain: 0.34 },
    { atSec: 1.8, durSec: 0.681, note: 74, gain: 0.46 },
    { atSec: 1.8, durSec: 1.74, note: 53, gain: 0.26 },
    { atSec: 1.8, durSec: 1.74, note: 60, gain: 0.22 },
    { atSec: 2.502, durSec: 0.629, note: 69, gain: 0.34 },
    { atSec: 2.502, durSec: 0.629, note: 72, gain: 0.46 },
    { atSec: 3.15, durSec: 0.437, note: 67, gain: 0.34 },
    { atSec: 3.15, durSec: 0.437, note: 71, gain: 0.46 },
    { atSec: 3.6, durSec: 0.681, note: 69, gain: 0.34 },
    { atSec: 3.6, durSec: 0.681, note: 72, gain: 0.46 },
    { atSec: 3.6, durSec: 3.3, note: 53, gain: 0.26 },
    { atSec: 3.6, durSec: 3.3, note: 60, gain: 0.22 },
    { atSec: 4.302, durSec: 0.629, note: 64, gain: 0.34 },
    { atSec: 4.302, durSec: 0.629, note: 67, gain: 0.46 },
    { atSec: 4.95, durSec: 1.95, note: 65, gain: 0.34 },
    { atSec: 4.95, durSec: 1.95, note: 69, gain: 0.46 },
  ],
}

// The under-strings lighting one by one on the three uneven beats: F C G, A B C, then E over a new F.
const UNDERSTRINGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.6, note: 53, gain: 0.42 },
    { atSec: 0.936, durSec: 5.564, note: 60, gain: 0.38 },
    { atSec: 1.8, durSec: 4.7, note: 67, gain: 0.36 },
    { atSec: 2.4, durSec: 4.1, note: 69, gain: 0.38 },
    { atSec: 3.336, durSec: 3.164, note: 71, gain: 0.4 },
    { atSec: 4.2, durSec: 2.3, note: 72, gain: 0.34 },
    { atSec: 4.8, durSec: 1.7, note: 53, gain: 0.34 },
    { atSec: 4.8, durSec: 1.7, note: 76, gain: 0.3 },
  ],
}

// Chords over a held F that change on the uneven beats: F with a ninth, G, F with its major
// seventh, then D minor, G and F.
const OVER_THE_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.13, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 1.13, note: 67, gain: 0.34 },
    { atSec: 0, durSec: 1.13, note: 69, gain: 0.44 },
    { atSec: 0, durSec: 2.96, note: 53, gain: 0.4 },
    { atSec: 1.17, durSec: 1.04, note: 62, gain: 0.34 },
    { atSec: 1.17, durSec: 1.04, note: 67, gain: 0.34 },
    { atSec: 1.17, durSec: 1.04, note: 71, gain: 0.44 },
    { atSec: 2.25, durSec: 0.71, note: 64, gain: 0.34 },
    { atSec: 2.25, durSec: 0.71, note: 69, gain: 0.34 },
    { atSec: 2.25, durSec: 0.71, note: 72, gain: 0.44 },
    { atSec: 3, durSec: 1.13, note: 62, gain: 0.34 },
    { atSec: 3, durSec: 1.13, note: 69, gain: 0.34 },
    { atSec: 3, durSec: 1.13, note: 74, gain: 0.44 },
    { atSec: 3, durSec: 4.2, note: 53, gain: 0.38 },
    { atSec: 4.17, durSec: 1.04, note: 62, gain: 0.34 },
    { atSec: 4.17, durSec: 1.04, note: 67, gain: 0.34 },
    { atSec: 4.17, durSec: 1.04, note: 71, gain: 0.44 },
    { atSec: 5.25, durSec: 1.95, note: 60, gain: 0.34 },
    { atSec: 5.25, durSec: 1.95, note: 65, gain: 0.34 },
    { atSec: 5.25, durSec: 1.95, note: 69, gain: 0.44 },
  ],
}

// Only the keys F, G and C, one to a beat, so a chord zither stays in the mode when each key is a chord.
const THREE_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.681, note: 53, gain: 0.55 },
    { atSec: 0.702, durSec: 0.629, note: 60, gain: 0.42 },
    { atSec: 1.35, durSec: 0.436, note: 53, gain: 0.45 },
    { atSec: 1.8, durSec: 0.681, note: 55, gain: 0.55 },
    { atSec: 2.502, durSec: 0.629, note: 60, gain: 0.42 },
    { atSec: 3.15, durSec: 0.436, note: 55, gain: 0.45 },
    { atSec: 3.6, durSec: 0.681, note: 53, gain: 0.55 },
    { atSec: 4.302, durSec: 0.629, note: 60, gain: 0.42 },
    { atSec: 4.95, durSec: 0.436, note: 55, gain: 0.45 },
    { atSec: 5.4, durSec: 1.5, note: 53, gain: 0.52 },
  ],
}

// A left hand of low open fifths and sixths under a tune, both on the long, the medium and the short beat.
const LEFT_HAND_LIMPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.681, note: 69, gain: 0.55 },
    { atSec: 0, durSec: 1.764, note: 41, gain: 0.42 },
    { atSec: 0.702, durSec: 0.629, note: 72, gain: 0.46 },
    { atSec: 0.702, durSec: 1.076, note: 48, gain: 0.34 },
    { atSec: 1.35, durSec: 0.436, note: 71, gain: 0.46 },
    { atSec: 1.35, durSec: 0.441, note: 57, gain: 0.32 },
    { atSec: 1.8, durSec: 0.681, note: 74, gain: 0.55 },
    { atSec: 1.8, durSec: 1.764, note: 41, gain: 0.42 },
    { atSec: 2.502, durSec: 0.629, note: 71, gain: 0.46 },
    { atSec: 2.502, durSec: 1.076, note: 50, gain: 0.34 },
    { atSec: 3.15, durSec: 0.436, note: 67, gain: 0.46 },
    { atSec: 3.15, durSec: 0.441, note: 55, gain: 0.32 },
    { atSec: 3.6, durSec: 0.681, note: 72, gain: 0.55 },
    { atSec: 3.6, durSec: 1.764, note: 41, gain: 0.42 },
    { atSec: 4.302, durSec: 0.629, note: 69, gain: 0.46 },
    { atSec: 4.302, durSec: 1.076, note: 48, gain: 0.34 },
    { atSec: 4.95, durSec: 0.436, note: 67, gain: 0.46 },
    { atSec: 4.95, durSec: 0.441, note: 57, gain: 0.32 },
    { atSec: 5.4, durSec: 1.5, note: 41, gain: 0.42 },
    { atSec: 5.4, durSec: 1.5, note: 48, gain: 0.34 },
    { atSec: 5.4, durSec: 1.5, note: 57, gain: 0.34 },
    { atSec: 5.4, durSec: 1.5, note: 65, gain: 0.5 },
  ],
}

// A single line: E D B, C A, then the answer an octave up and further off, coming home to F.
const NEAR_THEN_FAR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.567, note: 76, gain: 0.6 },
    { atSec: 0.585, durSec: 0.524, note: 74, gain: 0.5 },
    { atSec: 1.125, durSec: 0.364, note: 71, gain: 0.46 },
    { atSec: 1.5, durSec: 1.11, note: 72, gain: 0.58 },
    { atSec: 2.625, durSec: 0.375, note: 69, gain: 0.46 },
    { atSec: 3, durSec: 0.567, note: 88, gain: 0.34 },
    { atSec: 3.585, durSec: 0.524, note: 86, gain: 0.28 },
    { atSec: 4.125, durSec: 0.364, note: 83, gain: 0.26 },
    { atSec: 4.5, durSec: 1.11, note: 84, gain: 0.33 },
    { atSec: 5.625, durSec: 1.2, note: 77, gain: 0.3 },
  ],
}

// One note at a time: low F on the first three long beats, the raised fourth B on the last short one,
// which rises to C on the long beat of the fourth bar, and home on its early second.
const OPEN_STRING_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.674, note: 41, gain: 0.6 },
    { atSec: 0.702, durSec: 0.622, note: 48, gain: 0.48 },
    { atSec: 1.35, durSec: 0.432, note: 53, gain: 0.5 },
    { atSec: 1.8, durSec: 0.674, note: 41, gain: 0.6 },
    { atSec: 2.502, durSec: 0.622, note: 50, gain: 0.48 },
    { atSec: 3.15, durSec: 0.432, note: 55, gain: 0.5 },
    { atSec: 3.6, durSec: 0.674, note: 41, gain: 0.6 },
    { atSec: 4.302, durSec: 0.622, note: 48, gain: 0.48 },
    { atSec: 4.95, durSec: 0.432, note: 59, gain: 0.5 },
    { atSec: 5.4, durSec: 0.68, note: 60, gain: 0.5 },
    { atSec: 6.102, durSec: 1.1, note: 41, gain: 0.55 },
  ],
}

// The foot of the fiddler: kick, softer kick, low tom at 39, 36 and 25 percent of a bar of 1.5 s, with a
// brush or a rim a little past the middle of each beat, so the inside of the beat limps too.
const FOOT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 0.351, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 0.585, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 0.585, durSec: 0.1, note: 66, gain: 0.3 },
    { atSec: 0.909, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 1.125, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 1.5, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 1.851, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 2.085, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 2.409, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 2.625, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 2.831, durSec: 0.1, note: 64, gain: 0.34 },
    { atSec: 3, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 3.351, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 3.585, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 3.585, durSec: 0.1, note: 66, gain: 0.3 },
    { atSec: 3.909, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 4.125, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 4.5, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 4.851, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 5.085, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 5.409, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 5.625, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 5.831, durSec: 0.1, note: 64, gain: 0.34 },
    { atSec: 6, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 6, durSec: 0.1, note: 61, gain: 0.4 },
  ],
}

// The same steps at 25, 40 and 35 percent.
const FOOT_SHORT_FIRST: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 0.225, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 0.375, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 0.375, durSec: 0.1, note: 66, gain: 0.3 },
    { atSec: 0.735, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 0.975, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 1.5, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 1.725, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 1.875, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 2.235, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 2.475, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 2.764, durSec: 0.1, note: 64, gain: 0.34 },
    { atSec: 3, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 3.225, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 3.375, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 3.375, durSec: 0.1, note: 66, gain: 0.3 },
    { atSec: 3.735, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 3.975, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 4.5, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 4.725, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 4.875, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 5.235, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 5.475, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 5.764, durSec: 0.1, note: 64, gain: 0.34 },
    { atSec: 6, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 6, durSec: 0.1, note: 61, gain: 0.4 },
  ],
}

// The same steps on three even beats.
const FOOT_EVEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 0.3, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 0.5, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 0.5, durSec: 0.1, note: 66, gain: 0.3 },
    { atSec: 0.8, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 1, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 1.5, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 1.8, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 2, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 2.3, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 2.5, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 2.775, durSec: 0.1, note: 64, gain: 0.34 },
    { atSec: 3, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 3.3, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 3.5, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 3.5, durSec: 0.1, note: 66, gain: 0.3 },
    { atSec: 3.8, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 4, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 4.5, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 4.8, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 5, durSec: 0.1, note: 60, gain: 0.4 },
    { atSec: 5.3, durSec: 0.1, note: 63, gain: 0.3 },
    { atSec: 5.5, durSec: 0.1, note: 69, gain: 0.46 },
    { atSec: 5.775, durSec: 0.1, note: 64, gain: 0.34 },
    { atSec: 6, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 6, durSec: 0.1, note: 61, gain: 0.4 },
  ],
}

// Two stamps to a bar, on the first beat and the short third, and nothing on the second.
const STAMPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 60, gain: 0.62 },
    { atSec: 1.125, durSec: 0.1, note: 60, gain: 0.44 },
    { atSec: 1.5, durSec: 0.1, note: 60, gain: 0.62 },
    { atSec: 2.625, durSec: 0.1, note: 69, gain: 0.44 },
    { atSec: 3, durSec: 0.1, note: 60, gain: 0.62 },
    { atSec: 4.125, durSec: 0.1, note: 60, gain: 0.44 },
    { atSec: 4.5, durSec: 0.1, note: 60, gain: 0.62 },
    { atSec: 5.625, durSec: 0.1, note: 69, gain: 0.44 },
    { atSec: 6, durSec: 0.1, note: 60, gain: 0.6 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Bow: one fiddle, from under the chin to across the valley.
  {
    id: 'crooked-three-under-the-chin',
    name: 'Under the chin',
    category: 'string',
    description:
      'A close raspy bow that speaks at once, with sixteen white-key strings ringing six seconds under it.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.03,
        release: 0.4,
        pressure: 0.7,
        position: 0.06,
        vibrato: 0.05,
        detune: 0,
        body: 0.7,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 0, strings: 12, sympathy: 0.6, decay: 6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'crooked-three-fiddle-over-the-scree',
    name: 'Fiddle over the scree',
    category: 'string',
    description:
      'A light bow far from the bridge, heard from the far side of a slope through a great deal of air and a wandering echo.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.1, release: 0.8, brightness: 0.35, vibrato: 0.15, volume: -4 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore', params: { decay: 2.5, distance: 0.85 } },
      {
        deviceId: 'analog-delay',
        preset: 'Slow drift',
        params: { time: 900, feedback: 0.2, mix: 0.25 },
      },
    ],
  },
  {
    id: 'crooked-three-only-what-rings-beneath',
    name: 'Only what rings beneath',
    category: 'string',
    description:
      'A wire-strung pluck turned down to its strings alone: the white keys answer for nine seconds and the tune is nearly gone.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { release: 1, decay: 3, position: 0.05, volume: -11.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Strings alone',
        params: { root: 0, mode: 0, decay: 9, mix: 0.9, sympathy: 0.6 },
      },
    ],
  },
  {
    id: 'crooked-three-low-bow-keeps-the-long',
    name: 'Low bow keeps the long',
    category: 'bass',
    description:
      'A dark heavy bow with an octave added below, through a large wooden box, for the open-string steps.',
    preview: OPEN_STRING_STEPS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.12,
        release: 0.5,
        brightness: 0.3,
        pressure: 0.65,
        vibrato: 0,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, up1: 0 } },
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 2, mix: 0.4 } },
    ],
  },
  {
    id: 'crooked-three-thumbed-on-the-lap',
    name: 'Thumbed on the lap',
    category: 'plucked',
    description:
      'A short dull pluck well away from the bridge, mostly body, with a brief spring behind each stroke.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.25, decay: 0.9, position: 0.3, body: 0.8, volume: -2.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 4 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Quick twang',
        params: { mix: 0.3, drip: 0.4, tone: 3500 },
      },
    ],
  },
  {
    id: 'crooked-three-what-two-beats-share',
    name: 'What two beats share',
    category: 'pad',
    description:
      'A glassy bow from which only the tones common to one beat and the next are kept and left hanging.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.3, release: 1.5, detune: 14, volume: -6 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Hanging notes',
        params: { ago: 700, ring: 0.8, mix: 0.85 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'crooked-three-dance-kept-on-shellac',
    name: 'Dance kept on shellac',
    category: 'string',
    description:
      'A quick held string and the ten under-strings answering it, all on a fast, worn, narrow and crackling disc.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.02, brightness: 0.7, vibrato: 0.1, detune: 2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { root: 0, strings: 6, sympathy: 0.6, decay: 4, mix: 0.35 },
      },
      {
        deviceId: 'vinyl',
        preset: 'Parlour 78',
        params: { crackle: 0.35, pops: 0.08, warp: 0.3, wear: 0.45 },
      },
    ],
  },
  {
    id: 'crooked-three-eight-at-the-wedding',
    name: 'Eight at the wedding',
    category: 'string',
    description:
      'A widely detuned bowed section made thicker by a flock of eight copies, over ten under-strings ringing in C.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: {
        attack: 0.15,
        release: 0.6,
        vibrato: 0.2,
        vibratoRate: 5,
        brightness: 0.7,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { birds: 8, mix: 0.6 } },
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { root: 0, strings: 6, sympathy: 0.6, decay: 5, mix: 0.3 },
      },
    ],
  },
  {
    id: 'crooked-three-strings-that-disagree',
    name: 'Strings that disagree',
    category: 'plucked',
    description:
      'A pluck on two strings a quarter of a semitone apart, thinned below, dulled above and turned by a slow chorale rotor as it rings.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { brightness: 0.75, position: 0.12, release: 4, decay: 8, body: 0.15, volume: -6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.05, hornDepth: 0.9 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 180 } },
    ],
  },
  {
    id: 'crooked-three-string-takes-its-octave',
    name: 'String takes its octave',
    category: 'drone',
    description:
      'A sustained string pressed up towards its octave while a fed-back overtone blooms above what is held.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.6, release: 2, pressure: 1, vibrato: 0.1, volume: -14 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.3, edge: 0.05 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'crooked-three-up-bow-before-the-beat',
    name: 'Up-bow before the beat',
    category: 'pad',
    description:
      'A plucked swell whose notes return backwards one short beat later, so each stroke is heard coming.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { attack: 0.16, release: 1.5, decay: 6, brightness: 0.5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 400, feedback: 0.15, mix: 0.55, tone: 5000 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'crooked-three-copper-under-the-neck',
    name: 'Copper under the neck',
    category: 'drone',
    description:
      'A hollow bright sustain over metal bowls tuned to F and C, which ring for twelve seconds after the strings stop.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.4, release: 1, volume: -15 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Low fifths',
        params: { root: 5, ring: 12, strike: 0.6, mix: 0.55, metal: 0.4 },
      },
    ],
  },
  {
    id: 'crooked-three-round-tone-three-even',
    name: 'Round tone, three even',
    category: 'wind',
    description:
      'A string held with no edge and no body until it is nearly a pipe, shimmering in two bands over eight under-strings.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.06, release: 0.35, brightness: 0.12, volume: -7 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 5, depth: 0.5 } },
      {
        deviceId: 'sympathetic',
        preset: 'Short halo',
        params: { root: 0, strings: 4, sympathy: 0.6, decay: 2.5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'crooked-three-hum-in-the-boathouse',
    name: 'Hum in the boathouse',
    category: 'pad',
    description:
      'Two strings beating as they swell, coming back from a dark hall as a low hummed choir.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { attack: 0.4, release: 2, detune: 10, body: 0.9, volume: -8 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Humming', params: { decay: 5, mix: 0.5 } }],
  },

  // Chamber strings: players together, stopped and open.
  {
    id: 'crooked-three-alone-at-the-hall-door',
    name: 'Alone at the hall door',
    category: 'string',
    description: 'One player, close and dry in the middle, short bows on a thin wooden soundboard.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.05, release: 0.25, bow: 0.65, vibrato: 4, air: 0.1, volume: -3.5 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4, size: 0.6 } }],
  },
  {
    id: 'crooked-three-five-on-open-strings',
    name: 'Five on open strings',
    category: 'string',
    description:
      'Five tight players near the bridge with no vibrato; fourteen under-strings in C pick up every open note.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { players: 5, attack: 0.1, release: 0.6, bow: 0.8, volume: -5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Glass harp',
        params: { root: 0, strings: 10, sympathy: 0.6, decay: 6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'crooked-three-mutes-in-the-hayloft',
    name: 'Mutes in the hayloft',
    category: 'string',
    description:
      'A muted section through a boarded floor: dull and far off, six-second under-strings and all, the short beat first.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.12, release: 0.5, players: 4, volume: -5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { root: 0, sympathy: 0.6, decay: 6, mix: 0.4 },
      },
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.75 } },
    ],
  },
  {
    id: 'crooked-three-horsehair-and-breath',
    name: 'Horsehair and breath',
    category: 'texture',
    description:
      'Bows almost without tone, their hiss spread wide and their attacks turned down, in a short bright chamber.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.4, release: 1, air: 1, bow: 0.25, volume: 0 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air', params: { tones: -3, air: 5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'crooked-three-village-out-of-step',
    name: 'Village out of step',
    category: 'string',
    description:
      'Six ragged players who hardly agree, under-strings ringing in C, through an amplifier at the far end of a hall.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.1, release: 0.4, bow: 0.55, mute: 0, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 0, sympathy: 0.6, decay: 5, mix: 0.4 },
      },
      { deviceId: 're-amp', preset: 'Down the hall', params: { drive: 0.2, noise: 0 } },
    ],
  },
  {
    id: 'crooked-three-viols-that-count-even',
    name: 'Viols that count even',
    category: 'string',
    description:
      'Four muted players in perfect agreement, three even beats, their boxes made larger and a warm spring set behind.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.07, release: 0.3, volume: -3.5 },
    },
    effects: [
      { deviceId: 'size', preset: 'A shade larger', params: { size: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'crooked-three-chords-lean-on-the-third',
    name: 'Chords lean on the third',
    category: 'pad',
    description:
      'Six slow bows with a long release, each chord growing a soft rising octave in its tail.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { attack: 0.5, release: 2.5, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Faint glimmer',
        params: { mix: 0.35, decay: 6, shimmer: 0.45, interval: 0 },
      },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'crooked-three-left-hand-shaking',
    name: 'Left hand shaking',
    category: 'string',
    description:
      'Three players in wide vibrato, each stroke followed by a warm room that stops dead before the next beat.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { attack: 0.15, release: 0.35, vibrato: 34, bow: 0.4, volume: -4 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.4, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },

  // Drum kit: the foot, the floor and the ones who answer it.
  {
    id: 'crooked-three-heel-on-the-plank',
    name: 'Heel on the plank',
    category: 'drum',
    description:
      'A felted kit at low punch, the foot on all three beats, with a plank of soundboard under it and nothing else.',
    preview: FOOT,
    instrument: { deviceId: 'drum-kit', preset: 'Felt kit', params: { length: 0.8, volume: -2 } },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5, size: 1.4 } }],
  },
  {
    id: 'crooked-three-one-and-three-only',
    name: 'One and three only',
    category: 'drum',
    description:
      'Deep slow stamps with no snap, the second beat left empty for a dark hall to lean into.',
    preview: STAMPS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Deep and slow',
      params: { snap: 0, tone: 0.35, length: 1.6, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'crooked-three-snow-off-the-boots',
    name: 'Snow off the boots',
    category: 'drum',
    description:
      'A long dull brushed kit with no punch at all, its tones taken out until only air and softened strikes are left.',
    preview: FOOT_SHORT_FIRST,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Brushed',
      params: { length: 2, width: 0.9, volume: -6 },
    },
    effects: [{ deviceId: 'sift', preset: 'Soft puffs', params: { air: 4 } }],
  },
  {
    id: 'crooked-three-dance-on-the-floor-below',
    name: 'Dance on the floor below',
    category: 'drum',
    description:
      'The steps of a dance heard through the boards: low drums drawn to the middle, with everything bright cut off.',
    preview: FOOT,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Low and far',
      params: { tune: -3, length: 1.5, punch: 0.35, volume: -7 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Through fog', params: { distance: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1200 } },
    ],
  },
  {
    id: 'crooked-three-knuckles-on-the-belly',
    name: 'Knuckles on the belly',
    category: 'drum',
    description:
      'A small tight kit cut short and tuned up, knocking on a soundboard no bigger than a fiddle.',
    preview: FOOT,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Small and tight',
      params: { tune: 3, length: 0.6, width: 0.15, volume: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Hint of wood',
        params: { size: 0.45, material: 0.5, mix: 0.7 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'crooked-three-paper-soles',
    name: 'Paper soles',
    category: 'drum',
    description:
      'The paper kit driven soft and dusty, on a cassette that has been left in the sun.',
    preview: FOOT_EVEN,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Dusty',
      params: { tune: 0, length: 0.9, drive: 0.5, snap: 0.35, volume: -3 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } }],
  },
  {
    id: 'crooked-three-stamp-then-the-hill',
    name: 'Stamp, then the hill',
    category: 'drum',
    description: 'Two heavy stamps a bar, an octave down, sent into an open valley after a gap.',
    preview: STAMPS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Heavy steps',
      params: { length: 1.4, drive: 0.1, volume: -3 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 5, mix: 0.4 } }],
  },
  {
    id: 'crooked-three-ticks-of-the-loom',
    name: 'Ticks of the loom',
    category: 'drum',
    description: 'Bright tight ticks, wide apart, each thrown on like a pebble in closing skips.',
    preview: FOOT_SHORT_FIRST,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Bright ticks',
      params: { tune: 2, length: 0.6, volume: 1 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { first: 225, mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'crooked-three-barrel-of-three-lengths',
    name: 'Barrel of three lengths',
    category: 'drum',
    description: 'Long toms with a soft fall, ringing in a drum head three times its usual size.',
    preview: FOOT,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Long toms',
      params: { tune: -4, length: 1.8, punch: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Kettle', params: { size: 3, mix: 0.5 } },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'crooked-three-child-with-a-tin',
    name: 'Child with a tin',
    category: 'drum',
    description: 'A high papery toy kit ringing in a small tin, counting three even.',
    preview: FOOT_EVEN,
    instrument: { deviceId: 'drum-kit', preset: 'Toy box', params: { length: 1.2, volume: 1 } },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.65 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 120 } },
    ],
  },
  {
    id: 'crooked-three-skirts-going-round',
    name: 'Skirts going round',
    category: 'drum',
    description: 'A long airy kit carried slowly round the head, one turn to about four bars.',
    preview: FOOT,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Airy and long',
      params: { length: 2.2, snap: 0.7, volume: -4 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow circle', params: { rate: 0.17, mix: 0.8 } }],
  },
  {
    id: 'crooked-three-straw-over-the-boards',
    name: 'Straw over the boards',
    category: 'drum',
    description:
      'A muffled mono kit with a little drive, pressed by a fast limiter until every step is level.',
    preview: FOOT_SHORT_FIRST,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Muffled',
      params: { tune: -1, length: 0.7, width: 0, volume: -4 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0 } },
    ],
  },
  {
    id: 'crooked-three-second-foot-answers',
    name: 'Second foot answers',
    category: 'drum',
    description:
      'A deep dark kit whose stamps are copied one long beat later by a softer, duller foot, filling the empty second beat.',
    preview: STAMPS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Dark room',
      params: { tune: -1, length: 1.3, tone: 0.3, volume: -5 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 1, gap: 0.585, fade: 0.35, spread: 1, tone: 2500, mix: 0.5 },
      },
    ],
  },
  {
    id: 'crooked-three-sack-of-grain-let-fall',
    name: 'Sack of grain let fall',
    category: 'drum',
    description: 'Low papery thuds with a hard punch, followed by falling scraps of themselves.',
    preview: STAMPS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Paper thuds',
      params: { length: 1.4, volume: 1.5 },
    },
    effects: [{ deviceId: 'falling', preset: 'Quick drops', params: { mix: 0.35, tone: 3000 } }],
  },
  {
    id: 'crooked-three-even-feet-warm-stove',
    name: 'Even feet, warm stove',
    category: 'drum',
    description:
      'The soft kit plain and warm, three even beats in a small dark room with a slow compressor holding it close.',
    preview: FOOT_EVEN,
    instrument: {
      deviceId: 'drum-kit',
      params: { kit: 0, tune: 1, length: 1.4, punch: 0.45, snap: 0.45, tone: 0.45, volume: -3 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'crooked-three-floor-wakes-the-fiddle',
    name: 'Floor wakes the fiddle',
    category: 'drum',
    description:
      'A hard-pushed tight kit whose every knock sets sixteen idle strings humming in C for three seconds.',
    preview: FOOT,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Pushed hard',
      params: { tone: 0.5, drive: 0.5, snap: 0.4, volume: 2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { root: 0, strings: 12, sympathy: 0.9, decay: 3, mix: 0.6, width: 1 },
      },
    ],
  },

  // Zither: the drone box on the table, from single string to all of them.
  {
    id: 'crooked-three-drone-box-on-the-table',
    name: 'Drone box on the table',
    category: 'plucked',
    description:
      "One picked string and its fifth and octave on each key, long decay, all the zither's own strings ringing.",
    preview: THREE_KEYS,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { strum: 60, sympathy: 0.8, decay: 10, position: 0.16, volume: -2.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'crooked-three-goose-quill-near-the-nut',
    name: 'Goose quill near the nut',
    category: 'plucked',
    description:
      'A hard nasal pick close to the bridge, damped quickly and levelled, one tape slap a short beat later over brief under-strings.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { position: 0.06, brightness: 0.75, decay: 2, release: 0.4, body: 1, volume: -7 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { threshold: -34, makeup: 6 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 400, mix: 0.3 } },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { root: 0, decay: 1.5, mix: 0.3 } },
    ],
  },
  {
    id: 'crooked-three-hammers-of-soft-ash',
    name: 'Hammers of soft ash',
    category: 'plucked',
    description:
      'Single felt-hammered strings over a harp board, hollow and short, their blows blurred a little, in three even beats.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 2.5, release: 0.8, position: 0.45, brightness: 0.25, volume: -3.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'crooked-three-hammers-never-at-rest',
    name: 'Hammers never at rest',
    category: 'plucked',
    description:
      'Each held key is hammered nine times a second on a dulcimer box in octaves, its partials twinkling ear to ear.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { release: 1.2, sympathy: 0.85, courses: 0.2, volume: -8.5 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.7, rate: 2 } }],
  },
  {
    id: 'crooked-three-three-chords-uneven',
    name: 'Three chords, uneven',
    category: 'plucked',
    description:
      'A major chord strummed on every key, quick and bright, the beats of the bar never the same length.',
    preview: THREE_KEYS,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: { strum: 45, decay: 3.5, brightness: 0.75, volume: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'crooked-three-twelve-wires-in-frost',
    name: 'Twelve wires in frost',
    category: 'plucked',
    description:
      'Octave pairs picked bright on wide courses, then left two thirds gone into a thin frozen winter.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { brightness: 0.85, release: 3, courses: 1, volume: -3 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Frozen lake', params: { mix: 0.65, turn: 0 } }],
  },
  {
    id: 'crooked-three-silk-across-the-knee',
    name: 'Silk across the knee',
    category: 'plucked',
    description:
      'Fingertip strings far from the bridge on a hollow koto box, a copy detuned to each side and eight strings in C beneath.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 0,
        chord: 0,
        body: 3,
        decay: 5,
        release: 1.5,
        position: 0.4,
        brightness: 0.35,
        courses: 0,
        sympathy: 0.4,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 12, mix: 0.45 } },
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { sympathy: 0.5, decay: 4, mix: 0.35 },
      },
    ],
  },
  {
    id: 'crooked-three-last-string-still-warm',
    name: 'Last string, still warm',
    category: 'pad',
    description:
      'Very dull hammered octaves with full sympathy, their attacks removed, and a wide octave rising in the tail.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { decay: 10, release: 3, volume: -11 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 350 } },
      {
        deviceId: 'bloom-reverb',
        preset: 'Wide summer',
        params: { interval: 1, decay: 4, mix: 0.35 },
      },
    ],
  },
  {
    id: 'crooked-three-nines-rolled-downhill',
    name: 'Nines rolled downhill',
    category: 'plucked',
    description:
      'Each key rolls an added-ninth chord downward over nearly half a second, finger on harp board, never damped.',
    preview: THREE_KEYS,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { strum: 420, direction: 1, decay: 5, release: 20, volume: -4.5 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.35 } }],
  },
  {
    id: 'crooked-three-dulcimer-in-a-crock',
    name: 'Dulcimer in a crock',
    category: 'plucked',
    description:
      'A hammered roll at sixteen a second, boxed and dry inside a clay pot, then pulled wide.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { decay: 1.4, release: 0.35, volume: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.75, size: 1.2 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'crooked-three-second-zither-upstairs',
    name: 'Second zither upstairs',
    category: 'plucked',
    description:
      'A picked zither followed a bar later by itself an octave higher, dim and off to one side.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 1,
        chord: 0,
        body: 1,
        decay: 4,
        release: 2,
        brightness: 0.45,
        position: 0.3,
        courses: 0.55,
        sympathy: 0.25,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 1.5,
          interval1: 12,
          fade: 0.5,
          spread: 1,
          tone: 3500,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'crooked-three-sus-chords-at-milking',
    name: 'Sus chords at milking',
    category: 'plucked',
    description:
      'Suspended seconds arpeggiated slowly up and down by turns, on a loop of tape one bar long.',
    preview: THREE_KEYS,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { roll: 0, strum: 240, decay: 6, release: 5, volume: -11 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.8, mix: 0.4 } }],
  },
  {
    id: 'crooked-three-glass-under-strings',
    name: 'Glass under-strings',
    category: 'bell',
    description:
      'Undamped wire plucked in its middle at full brightness, chiming with short metal bowls in C.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { chord: 0, strum: 0, decay: 8, courses: 0.3, volume: -5 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Short chime',
        params: { root: 0, scale: 2, mix: 0.45, register: 0.7 },
      },
    ],
  },
  {
    id: 'crooked-three-parlour-wheel-even',
    name: 'Parlour wheel, even',
    category: 'plucked',
    description:
      'Picked octaves on a bright box, three even beats, warped slowly on an old jukebox single.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        chord: 1,
        strum: 0,
        direction: 0,
        body: 1,
        decay: 3,
        position: 0.12,
        courses: 0.5,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Jukebox single', params: { warp: 0.6, crackle: 0.15 } },
    ],
  },
  {
    id: 'crooked-three-hail-on-the-strings',
    name: 'Hail on the strings',
    category: 'texture',
    description: 'Hammered strings scattered into a rain of grains an octave above them.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'zither',
      params: {
        exciter: 2,
        chord: 0,
        body: 2,
        decay: 4,
        release: 2,
        brightness: 0.8,
        position: 0.08,
        courses: 0.1,
        sympathy: 0.2,
        volume: 0.5,
      },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.5 } }],
  },
  {
    id: 'crooked-three-short-first-barn-side',
    name: 'Short first, barn side',
    category: 'plucked',
    description: 'Bright picked strings cut off at once, from an open barn across the yard.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: {
        decay: 1.2,
        release: 0.15,
        brightness: 0.9,
        body: 2,
        position: 0.2,
        sympathy: 0.6,
        volume: 5.5,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'crooked-three-by-touch-lamp-out',
    name: 'By touch, lamp out',
    category: 'plucked',
    description:
      'A soft dark fingertip with short strings, followed by pure tones that swell in behind each partial.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: {
        chord: 0,
        strum: 0,
        decay: 3,
        release: 1,
        brightness: 0.15,
        sympathy: 0.1,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Slow bloom',
        params: { mix: 0.6, attack: 250, release: 2 },
      },
    ],
  },

  // Harp: both hands limping together.
  {
    id: 'crooked-three-harp-on-the-window-bench',
    name: 'Harp on the window bench',
    category: 'plucked',
    description:
      'A plain gut harp let ring, with fourteen white-key strings answering it and no room at all.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { pluck: 0.28, touch: 0.5, halo: 0.8, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { root: 0, strings: 10, decay: 5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'crooked-three-nails-by-the-soundboard',
    name: 'Nails by the soundboard',
    category: 'plucked',
    description:
      'Hard thin plucks at the very end of the string, stopped on release, brought level by a pluck compressor.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { touch: 0.8, decay: 0.4, damp: 0.7, halo: 0, body: 0.15, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 5 } },
      { deviceId: 'phaser', preset: 'Faint shade' },
    ],
  },
  {
    id: 'crooked-three-palm-flat-on-the-gut',
    name: 'Palm flat on the gut',
    category: 'plucked',
    description:
      'A muted harp, woody and dull, its short notes doubled an octave down for the weight of the first beat.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { touch: 0.15, damp: 1, body: 1, decay: 0.6, volume: -0.5 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35, up1: 0 } }],
  },
  {
    id: 'crooked-three-call-over-the-tarn',
    name: 'Call over the tarn',
    category: 'plucked',
    description:
      'Long glassy strings plucked near their middle, each call scattered along a ladder of late faint points.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.3, decay: 2, volume: 1.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Bent ladder', params: { span: 1500, mix: 0.4 } },
    ],
  },
  {
    id: 'crooked-three-dry-silk-in-even-three',
    name: 'Dry silk in even three',
    category: 'plucked',
    description:
      'A dry silk string under a soft pick, pressed level, three even beats with a tight swarm of echoes round each.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { decay: 0.9, damp: 0.35, pluck: 0.14, touch: 0.2, volume: -2 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { threshold: -30, makeup: 0 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 30, outputGain: -7.5 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'crooked-three-leaned-until-it-is-sharp',
    name: 'Leaned until it is sharp',
    category: 'plucked',
    description:
      'Soft silk strings each pressed a quarter tone up after the pluck, on an unsteady reel in a dark hall.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 50, touch: 0.3, decay: 1, volume: 6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0, wow: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'crooked-three-steel-limps-after',
    name: 'Steel limps after',
    category: 'plucked',
    description:
      'Bright steel strings under a hard pick, short, long, medium, in front of two clattering springs.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { touch: 0.9, decay: 0.8, damp: 0.5, volume: 3 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.35, drive: 0.1 } },
      { deviceId: 'tamer', preset: 'Bright tail' },
    ],
  },
  {
    id: 'crooked-three-arm-across-every-string',
    name: 'Arm across every string',
    category: 'plucked',
    description:
      'Chords rolled from the bottom over more than half a second, their tones blurred into one hanging mist.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { sweep: 0.6, decay: 1.2, volume: 0 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.5, highCut: 7000 } },
    ],
  },
  {
    id: 'crooked-three-low-hand-alone',
    name: 'Low hand alone',
    category: 'bass',
    description:
      'The roundest, dullest pluck, driven through an iron transformer, with four centred strings in C droning after it.',
    preview: OPEN_STRING_STEPS,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 0.8, damp: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.55 } },
      {
        deviceId: 'sympathetic',
        preset: 'Centre drone',
        params: { root: 0, mode: 0, sympathy: 0.7, decay: 6, mix: 0.45 },
      },
    ],
  },

  // Aurora: the hall organ's work, done by slow brass and strings.
  {
    id: 'crooked-three-horns-lean-on-one',
    name: 'Horns lean on one',
    category: 'pad',
    description:
      'Dark brass that overshoots and keeps swelling, so each long beat grows into the next, in a medium plate.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { attack: 0.2, release: 1, contour: 0.8, volume: -5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'crooked-three-raised-fourth-left-bare',
    name: 'Raised fourth, left bare',
    category: 'pad',
    description:
      'Wide bright strings through a filter that leans on the notes of F Lydian, so the B stays open.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.3, release: 2, volume: -8 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        preset: 'Lean to the key',
        params: { root: 5, scale: 5, mix: 0.8, ring: 0.6 },
      },
    ],
  },
  {
    id: 'crooked-three-reed-box-even-feet',
    name: 'Reed box, even feet',
    category: 'organ',
    description:
      'Loose reeds far apart in tune, quick to speak and to stop, three even beats, from a combo speaker in a room.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.03, release: 0.25, detune: 18, volume: -5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.2, noise: 0 } }],
  },
  {
    id: 'crooked-three-pipes-hold-the-fifth',
    name: 'Pipes hold the fifth',
    category: 'organ',
    description:
      'A still pipe tone with stops an octave below and above it that speak late, over sixteen wide strings in C.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 0.5, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Octave above',
        params: { fifth: 0, twelfth: 0, sub: 0.5, octave: 0.8, speak: 350, mix: 0.75 },
      },
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { root: 0, decay: 5, mix: 0.5 } },
    ],
  },
  {
    id: 'crooked-three-horn-from-the-pasture',
    name: 'Horn from the pasture',
    category: 'wind',
    description:
      'A thin muted trumpet tone that calls near and then an octave higher, swayed late in each note, from across a field.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { resonance: 0.6, release: 0.5, attack: 0.06, volume: 1.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 250 } },
      { deviceId: 'distance', preset: 'Open air', params: { distance: 0.7 } },
    ],
  },
  {
    id: 'crooked-three-chime-turns-into-strings',
    name: 'Chime turns into strings',
    category: 'bell',
    description:
      'A full metallic ring at the start of each note melting into still strings, the tune following itself two bars behind.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { release: 2, resonance: 0.2, volume: -2.5 },
    },
    effects: [{ deviceId: 'canon', preset: 'Faint answer', params: { gap: 3.2, mix: 0.35 } }],
  },
  {
    id: 'crooked-three-vowel-after-the-bow',
    name: 'Vowel after the bow',
    category: 'voice',
    description:
      'A very dark resonant pad that opens like a sung vowel over half a second, moved by slow bands of water.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.5, release: 2, resonance: 0.6, volume: -14 },
    },
    effects: [{ deviceId: 'currents', preset: 'Slow water', params: { rate: 0.3 } }],
  },
  {
    id: 'crooked-three-ground-swell-in-f',
    name: 'Ground swell in F',
    category: 'drone',
    description:
      'A dark slow swell with nothing bright left in it, driven by tape to a warm growl and left to breathe.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { attack: 1.2, release: 3, brilliance: 450, detune: 18, volume: -10 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -6 } },
      { deviceId: 'breath', preset: 'Calm breath', params: { air: 0 } },
    ],
  },
  {
    id: 'crooked-three-silver-along-the-bow',
    name: 'Silver along the bow',
    category: 'pad',
    description:
      'Only the top of a string pad, thin and wide, swirled by a slow phaser in a thin long space.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.5, release: 2, detune: 25, volume: 5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 5, mix: 0.3 } },
    ],
  },

  // Wind harp: the under-strings with nobody playing.
  {
    id: 'crooked-three-draught-through-the-rib',
    name: 'Draught through the rib',
    category: 'drone',
    description:
      'A light wind across three strings to a key, long ringing, on a soundboard with eight white-key under-strings.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Still air',
      params: { strings: 3, ring: 8, glint: 0.6, volume: -17 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5, size: 0.7 } },
      {
        deviceId: 'sympathetic',
        preset: 'Open triad',
        params: { root: 0, strings: 4, decay: 6, mix: 0.35 },
      },
    ],
  },
  {
    id: 'crooked-three-ridge-where-the-bow-flew',
    name: 'Ridge where the bow flew',
    category: 'texture',
    description:
      'A strong gust lighting the highest harmonics of four wide strings, with its brightest edges tamed.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'High gale',
      params: { strings: 4, touch: 0, ring: 1.5, volume: 3 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Ringing tones' },
      { deviceId: 'weather', preset: 'Dry gusts', params: { voice: 0.2, mix: 0.6 } },
    ],
  },
  {
    id: 'crooked-three-wind-learns-the-steps',
    name: 'Wind learns the steps',
    category: 'plucked',
    description:
      'Four plucked strings to a key and hardly any wind, short enough to dance to, doubled wide.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { ring: 1.5, release: 0.5, hum: 0.05, volume: -11.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'crooked-three-wires-over-the-pass',
    name: 'Wires over the pass',
    category: 'drone',
    description: 'Humming wires with a short nervous ring, sent down the line through a hot valve.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { gust: 0.4, glint: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { drive: 0.5, noise: 0 } },
      { deviceId: 'tremolo', preset: 'Wandering pan' },
    ],
  },
  {
    id: 'crooked-three-eleventh-over-the-f',
    name: 'Eleventh over the F',
    category: 'drone',
    description:
      'Low humming strings, a narrow whistle above them stepping from the eighth to the twelfth harmonic of F.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { release: 2, touch: 0.3, volume: -13 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Overtone melody',
        params: { root: 5, low: 8, high: 12, pace: 0.8, mix: 0.8 },
      },
    ],
  },
  {
    id: 'crooked-three-night-between-two-dances',
    name: 'Night between two dances',
    category: 'texture',
    description:
      'Mostly the rush of night air, strings glimpsed behind it, the whole scene wandering slowly round the head.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { wind: 0.35, gust: 0.6, lull: 0.2, volume: -4.5 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow wander' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'crooked-three-one-string-climbs',
    name: 'One string climbs',
    category: 'string',
    description:
      'A single string per key, gusted up its ladder of harmonics, each rung answered backwards.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { gust: 0.7, ring: 1.2, hum: 0.4, volume: -4 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1200, mix: 0.45 } },
    ],
  },
  {
    id: 'crooked-three-seven-farms-hum-along',
    name: 'Seven farms hum along',
    category: 'pad',
    description:
      'A slow swell on three strings, singing long after the wind moves on, smeared by a slower copy of itself.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { release: 3, hum: 0.6, air: 0, touch: 0.15, volume: -6 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.5 } }],
  },

  // Felt piano: the teacher's piano in the parish hall.
  {
    id: 'crooked-three-parish-piano-lid-up',
    name: 'Parish piano, lid up',
    category: 'keys',
    description:
      'A creaking upright well out of tune, its own room off, its hammers waking ten strings in C that a reel of tape then wavers.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { reverbMix: 0, thump: 0.5, outputDb: -15 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Hammered',
        params: { root: 0, mode: 0, strings: 6, decay: 3, mix: 0.55 },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0, wobble: 0.35 } },
    ],
  },
  {
    id: 'crooked-three-fiddle-under-a-piano',
    name: 'Fiddle under a piano',
    category: 'keys',
    description:
      'A felted piano over thirteen strings that learn the tune as it goes and hold it for nine seconds.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.8, resonance: 0, reverbMix: 0, soft: 1, outputDb: -1.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Learn and hold',
        params: { strings: 9, decay: 9, mix: 0.6 },
      },
    ],
  },
  {
    id: 'crooked-three-glass-keys-short-first',
    name: 'Glass keys, short first',
    category: 'keys',
    description:
      'A hard thin upright with no felt, stiff strings, short, long, medium, at the edge of a bright plate.',
    preview: SHORT_LONG_MEDIUM,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0.05, outputDb: 0.5 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
      { deviceId: 'flanger', preset: 'Faint air' },
    ],
  },
  {
    id: 'crooked-three-thud-counts-three',
    name: 'Thud counts three',
    category: 'keys',
    description:
      'The softest hammers and the loudest thump: three even beats felt through the floor, warmed below.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0.05, resonance: 0.1, outputDb: -8.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 3000 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'crooked-three-practised-behind-a-door',
    name: 'Practised behind a door',
    category: 'keys',
    description:
      'A piano in the next room, nearly mono and nearly all room, with a trail of dark echoes when it stops.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { reverbSize: 0.4, outputDb: -7 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 700, feedback: 0.3, mix: 0.3 } },
    ],
  },
  {
    id: 'crooked-three-pedal-kept-down-all-bar',
    name: 'Pedal kept down all bar',
    category: 'pad',
    description:
      'Every damper lifted on a soft washed piano, its hammers sifted away and the tones left to ring together.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.3, reverbSize: 0.7, outputDb: 9.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },

  // Afterglow: what is struck, then what stays.
  {
    id: 'crooked-three-bellwether-at-dusk',
    name: 'Bellwether at dusk',
    category: 'bell',
    description:
      'A dull bell that rings on while its glow takes three seconds to rise, sounded inside a small kettle.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { bloom: 3, fade: 4, volume: -6.5 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { size: 0.8, mix: 0.4 } }],
  },
  {
    id: 'crooked-three-plucked-then-it-hovers',
    name: 'Plucked, then it hovers',
    category: 'plucked',
    description:
      'A bright pluck with a short haze, every band of it trembling fast and apart in the two ears.',
    preview: LEFT_HAND_LIMPS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { glow: 0.35, bloom: 0.5, fade: 1.5, tone: 0.75, volume: -8 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Fast shimmer', params: { apart: 1 } }],
  },
  {
    id: 'crooked-three-no-stroke-only-after',
    name: 'No stroke, only after',
    category: 'pad',
    description:
      'The glow alone with the strike gone: double stops as soft arrivals, their quiet ends lifted into strings that learn their notes.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.5, fade: 2, halo: 0, volume: -25 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Just the ends', params: { amount: 0.35, threshold: -30 } },
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 5, mix: 0.4 } },
    ],
  },
  {
    id: 'crooked-three-glass-answers-the-glass',
    name: 'Glass answers the glass',
    category: 'bell',
    description:
      'A still struck glass whose sparks come back an octave up, scattered over the next two seconds.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { strike: 0.9, decay: 2, glow: 0.3, fade: 2, volume: -2 },
    },
    effects: [{ deviceId: 'glints', preset: 'Late answers', params: { pitch: 0, mix: 0.4 } }],
  },
  {
    id: 'crooked-three-coals-after-the-dance',
    name: 'Coals after the dance',
    category: 'keys',
    description:
      'A dark felt strike with a low glow and no halo, with a half-speed copy of it dragging an octave below.',
    preview: LONG_MEDIUM_SHORT,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { glow: 0.5, bloom: 1, fade: 3, volume: -11 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.4 } }],
  },

  // West coast: wood, gates and one round bass.
  {
    id: 'crooked-three-bass-with-a-short-leg',
    name: 'Bass with a short leg',
    category: 'bass',
    description:
      'A round folded bass with an octave below inside it, starting full and closing in about a second, slightly driven.',
    preview: OPEN_STRING_STEPS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { decay: 1.2, timbreEnv: 0.7, volume: -2.5 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.35 } }],
  },
  {
    id: 'crooked-three-iron-tongue-at-the-teeth',
    name: 'Iron tongue at the teeth',
    category: 'plucked',
    description:
      'A reedy folded tone that twangs and half shuts, a resonant peak swept up and down through its harmonics once a bar.',
    preview: OPEN_STRING_STEPS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { attack: 0.004, decay: 0.9, sustain: 0.6, fold: 0.5, timbreEnv: 0.5, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 4,
          cutoffHz: 900,
          resonance: 5,
          lfoAmount: 35,
          lfoRateHz: 0.556,
          lfoShape: 0,
          mix: 0.8,
        },
      },
    ],
  },
  {
    id: 'crooked-three-spoons-with-a-pitch',
    name: 'Spoons with a pitch',
    category: 'plucked',
    description:
      'Short woody plucks, no two quite the same, squashed level, three even beats under a cluster of tight echoes.',
    preview: EVEN_THREE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { decay: 0.9, chance: 0.5, colour: 0.7, volume: -4.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 28, outputGain: -9.5 } },
      { deviceId: 'constellation', preset: 'Tight clusters', params: { span: 800, mix: 0.3 } },
    ],
  },
  {
    id: 'crooked-three-thumbs-find-the-third',
    name: 'Thumbs find the third',
    category: 'plucked',
    description:
      'A thumb-plucked tine whose line is given a third above and a sixth below, on the steps of F Lydian.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { decay: 1.1, fm: 0.2, chance: 0.05, volume: 6 },
    },
    effects: [{ deviceId: 'lattice', preset: 'Diatonic thirds', params: { root: 5, scale: 6 } }],
  },
  {
    id: 'crooked-three-pedal-folds-under-feet',
    name: 'Pedal folds under feet',
    category: 'drone',
    description:
      'A slow folding drone on the notes of the under-strings, with a hollow tail that neither climbs nor falls.',
    preview: UNDERSTRINGS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { attack: 0.8, decay: 2, fold: 0.5, volume: -10.5 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Held still', params: { decay: 5, mix: 0.35 } }],
  },

  // Flock: the dancers themselves.
  {
    id: 'crooked-three-couples-fly-in-low',
    name: 'Couples fly in low',
    category: 'pad',
    description:
      'Seven reedy voices swooping up to each note before its beat is out, then scattered across a wide hall.',
    preview: STOPPED_AND_OPEN,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { birds: 7, gather: 0.15, from: 0, leave: 0.5, octaves: 0, volume: -11 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
  },
  {
    id: 'crooked-three-geese-over-the-hall',
    name: 'Geese over the hall',
    category: 'voice',
    description:
      'Eight wandering voices over three octaves, slow to arrive and slow to go, blurred by a rolling fog in a light breeze.',
    preview: OVER_THE_F,
    instrument: {
      deviceId: 'flock',
      preset: 'Octave cloud',
      params: { gather: 0.6, leave: 2, stray: 0.5, tone: 0.5, volume: -11 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Rolling in', params: { mix: 0.8 } },
      { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.15 } },
    ],
  },
  {
    id: 'crooked-three-whistling-home-uphill',
    name: 'Whistling home uphill',
    category: 'wind',
    description:
      'One whistle edged towards a hollow pipe, calling near and then far, echoed by the opposite hill.',
    preview: NEAR_THEN_FAR,
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.04, leave: 0.3, tone: 0.35, volume: -4 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Thin and fading',
        params: { time: 1125, feedback: 0.3, mix: 0.35 },
      },
    ],
  },
]
