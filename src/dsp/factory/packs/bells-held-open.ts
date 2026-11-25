import { type FactoryPreset, type Phrase } from '../types'

// A bell is struck, and players step in one at a time on its partials and hold the chord the metal
// began. Laid out by who takes the bell over (bows, flutes, voices, reeds, pipes, worn tape), by
// how fast they speak, and by the body that was struck. Ratios of the bells, in semitones over the
// strike note: church bell -12 0 3.16 7.02 12 15.86 19.02, bowl 17.64 28.44 36.3, glass 14.57
// 25.05, bar 17.56 29.21 37.91, gong 9.49 14.64 23.61, tine 31.76.

// Church bell on C4, struck once and left: the hum, the minor third, the fifth, the octave, the
// major tenth and the twelfth step in under it, so C minor and C major are held as one chord.
const STROKE_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 60, gain: 0.6 },
    { atSec: 0.7, durSec: 6.5, note: 48, gain: 0.5 },
    { atSec: 1.5, durSec: 5.7, note: 63.16, gain: 0.45 },
    { atSec: 2.3, durSec: 4.9, note: 67.02, gain: 0.42 },
    { atSec: 3.1, durSec: 4.1, note: 72, gain: 0.38 },
    { atSec: 3.9, durSec: 3.3, note: 75.86, gain: 0.34 },
    { atSec: 4.7, durSec: 2.5, note: 79.02, gain: 0.3 },
  ],
}

// The same entries made in a second and a half, on the bell of A3 and then on the bell of C4.
const QUICK_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 57, gain: 0.6 },
    { atSec: 0.15, durSec: 3.05, note: 45, gain: 0.5 },
    { atSec: 0.4, durSec: 2.8, note: 60.16, gain: 0.45 },
    { atSec: 0.65, durSec: 2.55, note: 64.02, gain: 0.42 },
    { atSec: 0.9, durSec: 2.3, note: 69, gain: 0.38 },
    { atSec: 1.15, durSec: 2.05, note: 72.86, gain: 0.35 },
    { atSec: 1.4, durSec: 1.8, note: 76.02, gain: 0.32 },
    { atSec: 3.5, durSec: 1.2, note: 60, gain: 0.6 },
    { atSec: 3.65, durSec: 2.95, note: 48, gain: 0.5 },
    { atSec: 3.9, durSec: 2.7, note: 63.16, gain: 0.45 },
    { atSec: 4.15, durSec: 2.45, note: 67.02, gain: 0.42 },
    { atSec: 4.4, durSec: 2.2, note: 72, gain: 0.38 },
    { atSec: 4.65, durSec: 1.95, note: 75.86, gain: 0.35 },
    { atSec: 4.9, durSec: 1.7, note: 79.02, gain: 0.32 },
  ],
}

// Two struck bells, C4 and A3, each followed by smaller bells hung on its own partials. The minor
// third of the A bell lands sixteen cents over the C that is still ringing.
const SMALL_BELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 4, note: 60, gain: 0.7 },
    { atSec: 1, durSec: 3.5, note: 63.16, gain: 0.4 },
    { atSec: 1.5, durSec: 3, note: 67.02, gain: 0.36 },
    { atSec: 2, durSec: 2.5, note: 75.86, gain: 0.3 },
    { atSec: 2.9, durSec: 4.1, note: 57, gain: 0.7 },
    { atSec: 3.9, durSec: 3.1, note: 60.16, gain: 0.4 },
    { atSec: 4.4, durSec: 2.6, note: 64.02, gain: 0.36 },
    { atSec: 4.9, durSec: 2.1, note: 72.86, gain: 0.3 },
  ],
}

// The chord of the C bell held, and the chord of the A bell brought in over it. C stays and C plus
// sixteen cents joins it, so the two chords share one blurred tone.
const BLUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 48, gain: 0.5 },
    { atSec: 0.3, durSec: 5.9, note: 60, gain: 0.45 },
    { atSec: 0.6, durSec: 4, note: 63.16, gain: 0.42 },
    { atSec: 0.9, durSec: 4.1, note: 67.02, gain: 0.4 },
    { atSec: 2.9, durSec: 4.3, note: 45, gain: 0.5 },
    { atSec: 3.4, durSec: 3.8, note: 60.16, gain: 0.42 },
    { atSec: 3.9, durSec: 3.3, note: 64.02, gain: 0.4 },
    { atSec: 4.4, durSec: 2.8, note: 72.86, gain: 0.34 },
  ],
}

// A singing bowl on A3: its first four rim modes, A, a flat E flat, a C sharp near D and an A a
// third of a semitone sharp.
const BOWL_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 57, gain: 0.55 },
    { atSec: 1.4, durSec: 5.6, note: 74.64, gain: 0.45 },
    { atSec: 2.8, durSec: 4.2, note: 85.44, gain: 0.36 },
    { atSec: 4.2, durSec: 2.8, note: 93.3, gain: 0.26 },
  ],
}

// A wineglass on G4, its second mode a quarter tone over A, and its third brought down an
// octave to rub under the second. Three players in from nothing, then out from the top down.
const GLASS_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 4.6, note: 81.57, gain: 0.4 },
    { atSec: 3, durSec: 3.7, note: 80.05, gain: 0.36 },
  ],
}

// A gong on D3, four entries on its first modes, released in the reverse of the order they came.
const GONG_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.55 },
    { atSec: 1, durSec: 5.5, note: 59.49, gain: 0.48 },
    { atSec: 2, durSec: 3.8, note: 64.64, gain: 0.44 },
    { atSec: 3, durSec: 2.1, note: 73.61, gain: 0.4 },
  ],
}

// An uncut bar on E3: modes at 1, 2.757, 5.404 and 8.933, struck low and then climbed.
const BAR_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 52, gain: 0.55 },
    { atSec: 0.9, durSec: 6.1, note: 69.56, gain: 0.45 },
    { atSec: 1.8, durSec: 5.2, note: 81.21, gain: 0.38 },
    { atSec: 2.7, durSec: 4.3, note: 89.91, gain: 0.3 },
  ],
}

// Tines plucked on D, A, C, G and E, each with its second mode, 31.76 semitones up, just after it.
const TINES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 50, gain: 0.6 },
    { atSec: 0.12, durSec: 1.28, note: 81.76, gain: 0.3 },
    { atSec: 0.8, durSec: 1.6, note: 57, gain: 0.55 },
    { atSec: 0.92, durSec: 1.28, note: 88.76, gain: 0.28 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.55 },
    { atSec: 1.72, durSec: 1.28, note: 91.76, gain: 0.25 },
    { atSec: 2.4, durSec: 1.6, note: 55, gain: 0.55 },
    { atSec: 2.52, durSec: 1.28, note: 86.76, gain: 0.27 },
    { atSec: 3.2, durSec: 1.8, note: 52, gain: 0.6 },
    { atSec: 3.32, durSec: 1.28, note: 83.76, gain: 0.3 },
    { atSec: 4.4, durSec: 1.6, note: 57, gain: 0.5 },
    { atSec: 4.52, durSec: 1.28, note: 88.76, gain: 0.25 },
    { atSec: 5.2, durSec: 1.4, note: 50, gain: 0.55 },
    { atSec: 5.32, durSec: 1.08, note: 81.76, gain: 0.28 },
  ],
}

// Church bell on D4 for reeds and voices: D struck, then D3, F, A, D5, F sharp, A5, the minor and
// the major third both measured and neither chosen.
const REEDS_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 62, gain: 0.55 },
    { atSec: 0.6, durSec: 6.6, note: 50, gain: 0.5 },
    { atSec: 1.4, durSec: 5.8, note: 65.16, gain: 0.45 },
    { atSec: 2.2, durSec: 5, note: 69.02, gain: 0.42 },
    { atSec: 3, durSec: 4.2, note: 74, gain: 0.38 },
    { atSec: 3.8, durSec: 3.4, note: 77.86, gain: 0.34 },
    { atSec: 4.6, durSec: 2.6, note: 81.02, gain: 0.3 },
  ],
}

// The whole bell of F4 sung out at once, then left as metal dies: the highest partial first, the
// hum last.
const LEAVE_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 6.4, note: 65, gain: 0.45 },
    { atSec: 0.05, durSec: 5.45, note: 68.16, gain: 0.42 },
    { atSec: 0.1, durSec: 4.6, note: 72.02, gain: 0.4 },
    { atSec: 0.15, durSec: 3.75, note: 77, gain: 0.36 },
    { atSec: 0.2, durSec: 2.9, note: 80.86, gain: 0.33 },
    { atSec: 0.25, durSec: 2.05, note: 84.02, gain: 0.3 },
  ],
}

// A bell an octave lower, on D3: hum D2, prime, minor third, fifth and octave, the low players alone.
const LOW_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 50, gain: 0.55 },
    { atSec: 0.6, durSec: 6.6, note: 38, gain: 0.55 },
    { atSec: 1.8, durSec: 5.4, note: 53.16, gain: 0.45 },
    { atSec: 3, durSec: 4.2, note: 57.02, gain: 0.42 },
    { atSec: 4.2, durSec: 3, note: 62, gain: 0.38 },
  ],
}

// A small church bell on C5 for flutes: hum C4 below it, then E flat, G, C, E and G.
const HIGH_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 72, gain: 0.55 },
    { atSec: 0.5, durSec: 6.6, note: 60, gain: 0.5 },
    { atSec: 1.2, durSec: 5.9, note: 75.16, gain: 0.45 },
    { atSec: 1.9, durSec: 5.2, note: 79.02, gain: 0.4 },
    { atSec: 2.6, durSec: 4.5, note: 84, gain: 0.36 },
    { atSec: 3.3, durSec: 3.8, note: 87.86, gain: 0.32 },
    { atSec: 4, durSec: 3.1, note: 91.02, gain: 0.28 },
  ],
}

// Church bell on A3, entering as the bell of C does: A2, C, E, A, C sharp and E, for low reeds and
// for full sections.
const STROKE_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 57, gain: 0.6 },
    { atSec: 0.7, durSec: 6.5, note: 45, gain: 0.5 },
    { atSec: 1.5, durSec: 5.7, note: 60.16, gain: 0.45 },
    { atSec: 2.3, durSec: 4.9, note: 64.02, gain: 0.42 },
    { atSec: 3.1, durSec: 4.1, note: 69, gain: 0.38 },
    { atSec: 3.9, durSec: 3.3, note: 72.86, gain: 0.34 },
    { atSec: 4.7, durSec: 2.5, note: 76.02, gain: 0.3 },
  ],
}

// The quick entries on the bells of D4 and E4, whose hums D3 and E3 the single reeds and a viola can
// reach.
const QUICK_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 62, gain: 0.6 },
    { atSec: 0.15, durSec: 3.05, note: 50, gain: 0.5 },
    { atSec: 0.4, durSec: 2.8, note: 65.16, gain: 0.45 },
    { atSec: 0.65, durSec: 2.55, note: 69.02, gain: 0.42 },
    { atSec: 0.9, durSec: 2.3, note: 74, gain: 0.38 },
    { atSec: 1.15, durSec: 2.05, note: 77.86, gain: 0.35 },
    { atSec: 1.4, durSec: 1.8, note: 81.02, gain: 0.32 },
    { atSec: 3.5, durSec: 1.2, note: 64, gain: 0.6 },
    { atSec: 3.65, durSec: 2.95, note: 52, gain: 0.5 },
    { atSec: 3.9, durSec: 2.7, note: 67.16, gain: 0.45 },
    { atSec: 4.15, durSec: 2.45, note: 71.02, gain: 0.42 },
    { atSec: 4.4, durSec: 2.2, note: 76, gain: 0.38 },
    { atSec: 4.65, durSec: 1.95, note: 79.86, gain: 0.35 },
    { atSec: 4.9, durSec: 1.7, note: 83.02, gain: 0.32 },
  ],
}

// The quick entries on the bells of A4 and G4, with nothing under a violin's open string.
const QUICK_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 69, gain: 0.6 },
    { atSec: 0.15, durSec: 3.05, note: 57, gain: 0.5 },
    { atSec: 0.4, durSec: 2.8, note: 72.16, gain: 0.45 },
    { atSec: 0.65, durSec: 2.55, note: 76.02, gain: 0.42 },
    { atSec: 0.9, durSec: 2.3, note: 81, gain: 0.38 },
    { atSec: 1.15, durSec: 2.05, note: 84.86, gain: 0.35 },
    { atSec: 1.4, durSec: 1.8, note: 88.02, gain: 0.32 },
    { atSec: 3.5, durSec: 1.2, note: 67, gain: 0.6 },
    { atSec: 3.65, durSec: 2.95, note: 55, gain: 0.5 },
    { atSec: 3.9, durSec: 2.7, note: 70.16, gain: 0.45 },
    { atSec: 4.15, durSec: 2.45, note: 74.02, gain: 0.42 },
    { atSec: 4.4, durSec: 2.2, note: 79, gain: 0.38 },
    { atSec: 4.65, durSec: 1.95, note: 82.86, gain: 0.35 },
    { atSec: 4.9, durSec: 1.7, note: 86.02, gain: 0.32 },
  ],
}

// The upper half of the bell on D4 for high voices: the hum is left to the men, and D, F, A, D, F
// sharp and A come in without it.
const TREBLE_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.5 },
    { atSec: 0.85, durSec: 6.35, note: 65.16, gain: 0.45 },
    { atSec: 1.7, durSec: 5.5, note: 69.02, gain: 0.42 },
    { atSec: 2.55, durSec: 4.65, note: 74, gain: 0.38 },
    { atSec: 3.4, durSec: 3.8, note: 77.86, gain: 0.34 },
    { atSec: 4.25, durSec: 2.95, note: 81.02, gain: 0.3 },
  ],
}

// Four bells by their hums alone, one low note at a time on C, A, D and C, and over each hum its
// bell's minor third, a tenth up.
const TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 48, gain: 0.55 },
    { atSec: 0.5, durSec: 1.4, note: 63.16, gain: 0.38 },
    { atSec: 1.9, durSec: 1.8, note: 45, gain: 0.55 },
    { atSec: 2.4, durSec: 1.3, note: 60.16, gain: 0.38 },
    { atSec: 3.7, durSec: 1.6, note: 50, gain: 0.55 },
    { atSec: 4.1, durSec: 1.2, note: 65.16, gain: 0.38 },
    { atSec: 5.3, durSec: 2, note: 48, gain: 0.55 },
    { atSec: 5.7, durSec: 1.6, note: 63.16, gain: 0.38 },
  ],
}

// A smaller bowl on D4 for players who cannot go under middle C: D, G sharp less a third of a
// semitone, a sharp F sharp, and the fourth mode brought down an octave.
const BOWL_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.52 },
    { atSec: 1.3, durSec: 5.9, note: 79.64, gain: 0.42 },
    { atSec: 2.6, durSec: 4.6, note: 90.44, gain: 0.32 },
    { atSec: 3.9, durSec: 3.3, note: 86.3, gain: 0.34 },
  ],
}

// The same wineglass with its third mode where it is measured, an octave and more over the second.
const GLASS_OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 67, gain: 0.5 },
    { atSec: 1.5, durSec: 4.6, note: 81.57, gain: 0.4 },
    { atSec: 3, durSec: 3.4, note: 92.05, gain: 0.3 },
  ],
}

// Glasses tapped on G, E, D and G, each answered by its own second mode, the last by its third too.
const GLASSES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 67, gain: 0.6 },
    { atSec: 0.5, durSec: 1.2, note: 81.57, gain: 0.36 },
    { atSec: 1.6, durSec: 1.5, note: 64, gain: 0.55 },
    { atSec: 2.1, durSec: 1.2, note: 78.57, gain: 0.34 },
    { atSec: 3.2, durSec: 1.5, note: 62, gain: 0.55 },
    { atSec: 3.7, durSec: 1.2, note: 76.57, gain: 0.34 },
    { atSec: 4.8, durSec: 2, note: 67, gain: 0.6 },
    { atSec: 5.15, durSec: 1.6, note: 81.57, gain: 0.36 },
    { atSec: 5.5, durSec: 1.4, note: 92.05, gain: 0.28 },
  ],
}

// Bars struck on A, C, D, G and A, each with its second and third modes, 17.56 and 29.21 up, just
// after it.
const BARS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 57, gain: 0.6 },
    { atSec: 0.15, durSec: 1, note: 74.56, gain: 0.36 },
    { atSec: 0.3, durSec: 0.9, note: 86.21, gain: 0.26 },
    { atSec: 1.3, durSec: 1.2, note: 60, gain: 0.6 },
    { atSec: 1.45, durSec: 1, note: 77.56, gain: 0.36 },
    { atSec: 1.6, durSec: 0.9, note: 89.21, gain: 0.26 },
    { atSec: 2.6, durSec: 1.2, note: 62, gain: 0.6 },
    { atSec: 2.75, durSec: 1, note: 79.56, gain: 0.36 },
    { atSec: 2.9, durSec: 0.9, note: 91.21, gain: 0.26 },
    { atSec: 3.9, durSec: 1.2, note: 55, gain: 0.6 },
    { atSec: 4.05, durSec: 1, note: 72.56, gain: 0.36 },
    { atSec: 4.2, durSec: 0.9, note: 84.21, gain: 0.26 },
    { atSec: 5.2, durSec: 1.2, note: 57, gain: 0.6 },
    { atSec: 5.35, durSec: 1, note: 74.56, gain: 0.36 },
    { atSec: 5.5, durSec: 0.9, note: 86.21, gain: 0.26 },
  ],
}

// A bigger gong on A2: the same four entries a fourth lower, and the last in is again the first out.
const GONG_A: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 45, gain: 0.55 },
    { atSec: 1, durSec: 5.5, note: 54.49, gain: 0.48 },
    { atSec: 2, durSec: 3.8, note: 59.64, gain: 0.44 },
    { atSec: 3, durSec: 2.1, note: 68.61, gain: 0.4 },
  ],
}

// One player climbing the partials of the D bell, from its hum, and coming home by the fifth and the
// minor third.
const CLIMB_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 50, gain: 0.6 },
    { atSec: 0.9, durSec: 0.9, note: 62, gain: 0.5 },
    { atSec: 1.7, durSec: 0.9, note: 65.16, gain: 0.5 },
    { atSec: 2.5, durSec: 0.8, note: 69.02, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 74, gain: 0.5 },
    { atSec: 3.9, durSec: 0.9, note: 77.86, gain: 0.5 },
    { atSec: 4.7, durSec: 0.6, note: 69.02, gain: 0.42 },
    { atSec: 5.2, durSec: 0.7, note: 65.16, gain: 0.42 },
    { atSec: 5.8, durSec: 1.4, note: 50, gain: 0.5 },
  ],
}

// The climb of a soprano, who leaves the hum out and goes on to the twelfth.
const CLIMB_HIGH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 62, gain: 0.5 },
    { atSec: 0.9, durSec: 0.9, note: 65.16, gain: 0.5 },
    { atSec: 1.7, durSec: 0.9, note: 69.02, gain: 0.5 },
    { atSec: 2.5, durSec: 0.8, note: 74, gain: 0.5 },
    { atSec: 3.2, durSec: 0.8, note: 77.86, gain: 0.5 },
    { atSec: 3.9, durSec: 0.9, note: 81.02, gain: 0.48 },
    { atSec: 4.7, durSec: 0.6, note: 77.86, gain: 0.42 },
    { atSec: 5.2, durSec: 0.7, note: 69.02, gain: 0.42 },
    { atSec: 5.8, durSec: 1.4, note: 62, gain: 0.45 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Worn tape: an orchestra on strips of tape takes the bell over, section by section.
  {
    id: 'bells-held-open-strings-take-the-tierce',
    name: 'Strings take the tierce',
    category: 'string',
    description:
      'Taped strings with little wear, faded in over more than a second and let go slowly, on a dark plate.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 1.4, release: 3, age: 0.1, hiss: 0.04, tone: 0.1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
  },
  {
    id: 'bells-held-open-violins-fill-the-clang',
    name: 'Violins fill the clang',
    category: 'string',
    description:
      'Bright taped violins close to unison that speak at once, doubled an octave up like a second desk, with a short hint of spring.',
    preview: QUICK_HIGH,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.03, release: 0.5, tone: 0.45, length: 9, players: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'bells-held-open-cellos-below-the-mouth',
    name: 'Cellos below the mouth',
    category: 'string',
    description:
      'Cellos on half-speed tape, so an octave down, under a slow attack, warmed in the lows with the top shaded.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 1.1, tone: -0.2, players: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'bells-held-open-one-cello-unhurried',
    name: 'One cello unhurried',
    category: 'string',
    description:
      'Taped cellos so close in tune they are one player, fading in over nearly two seconds, with a vibrato that grows late on each held note.',
    preview: GONG_A,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: {
        age: 0,
        hiss: 0,
        attack: 1.8,
        release: 4,
        players: 0,
        vibrato: 0,
        tone: 0.3,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'bells-held-open-flutes-over-the-bowl',
    name: 'Flutes over the bowl',
    category: 'wind',
    description:
      'Straight taped flutes with no wobble or hiss, and sines an octave above them that swell in late and stay.',
    preview: BOWL_D,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.5, release: 2.5, tone: 0.2 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { attack: 1200 } }],
  },
  {
    id: 'bells-held-open-flutes-lose-the-reel',
    name: 'Flutes lose the reel',
    category: 'wind',
    description:
      'Badly worn flutes an octave down at half speed, with hiss, laid over and over onto a tape loop of three seconds that slowly fades.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { attack: 0.25, release: 1.6, age: 0.8, hiss: 0.35, length: 9, tone: 0.3 },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 3, mix: 0.45 } }],
  },
  {
    id: 'bells-held-open-gong-handed-to-horns',
    name: 'Gong handed to horns',
    category: 'wind',
    description:
      'Taped horns that swell in over half a second and leave over two, in a hall with a slow breath in it.',
    preview: GONG_D,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.55, release: 2.2, age: 0.15, tone: 0.25 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
  },
  {
    id: 'bells-held-open-horns-leave-in-order',
    name: 'Horns leave in order',
    category: 'wind',
    description:
      'Half-speed horns an octave down, darkened by a transformer with its lows up, and a reverb that swells after each entry.',
    preview: LEAVE_F,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { volume: -15, tone: -0.1, attack: 0.15, release: 0.9, hiss: 0.1 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: 0 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'bells-held-open-reeds-find-the-quint',
    name: 'Reeds find the quint',
    category: 'wind',
    description:
      'Taped orchestra reeds, plain and close, with a six-stage phaser moving so slowly that one chord hears a single shade.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.3, release: 1.1, vibrato: 0.1, tone: 0.5 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
  },
  {
    id: 'bells-held-open-bassoons-after-bronze',
    name: 'Bassoons after bronze',
    category: 'wind',
    description:
      'Reeds an octave down on half-speed tape, dark and loosely tuned, played out of a loudspeaker at the far end of a hall.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { attack: 0.9, tone: 0, players: 1, volume: -8 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { noise: 0 } }],
  },
  {
    id: 'bells-held-open-taped-singers-hold-it',
    name: 'Taped singers hold it',
    category: 'voice',
    description:
      'A wide choir an octave down on half-speed tape, its top lifted, and a long high hall behind it that answers on an open vowel.',
    preview: HIGH_C,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slowed choir',
      params: { attack: 0.7, release: 2, tone: 0.8, age: 0.1, hiss: 0.1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High choir', params: { mix: 0.35, decay: 12 } }],
  },
  {
    id: 'bells-held-open-choir-worn-by-ringing',
    name: 'Choir worn by ringing',
    category: 'voice',
    description:
      'A worn, dark tape choir run through a slow flanger, its two chords left to overlap in a wash of five seconds.',
    preview: BLUR,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { volume: -4, attack: 0.5, release: 2.6, hiss: 0.15, length: 9 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep' },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },

  // The bells themselves, each left open by another means.
  {
    id: 'bells-held-open-tower-bell-kept-open',
    name: 'Tower bell kept open',
    category: 'bell',
    description:
      'A church bell struck fairly hard with a long ring, and a held string-like pad that catches its chord two seconds late.',
    preview: SMALL_BELLS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { volume: -4, decay: 14, hardness: 0.6, position: 0.2 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-held-open-bell-without-clapper',
    name: 'Bell without clapper',
    category: 'bell',
    description:
      'A church bell rubbed and never struck, its spectrum blurred and hung so that the partials dissolve into each other.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { volume: -13.5, brightness: 0.5, detune: 1.4 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.55 } }],
  },
  {
    id: 'bells-held-open-bowl-passed-hand-to-hand',
    name: 'Bowl passed hand to hand',
    category: 'bell',
    description:
      'A rubbed singing bowl whose lasting tones are kept and rung on while new ones are held back, circling the head slowly.',
    preview: BOWL_D,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { detune: 0.4, brightness: 0.4 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold' },
      { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.12 } },
    ],
  },
  {
    id: 'bells-held-open-late-players-for-a-bowl',
    name: 'Late players for a bowl',
    category: 'bell',
    description:
      'A dark bowl struck with a soft mallet, and a string pad that grows out of it over two seconds and stays.',
    preview: BOWL_A,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: 3, hardness: 0.25, decay: 18, brightness: 0.35 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.55, rise: 2.4 } }],
  },
  {
    id: 'bells-held-open-bar-answered-in-sines',
    name: 'Bar answered in sines',
    category: 'bell',
    description:
      'A struck metal bar whose sixteen strongest partials are drawn again as sines that arrive later and stay longer.',
    preview: BAR_E,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: 1, decay: 5, hardness: 0.6, brightness: 0.4, damping: 0.25 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { partials: 16, mix: 0.6 } },
    ],
  },
  {
    id: 'bells-held-open-wood-stretched-to-tone',
    name: 'Wood stretched to tone',
    category: 'bell',
    description:
      'Short wooden bars, fully damped, each knock drawn out sixteen times longer and that quiet trail raised.',
    preview: BARS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { decay: 1.8, damping: 0.7 },
    },
    effects: [
      { deviceId: 'stretch', preset: 'Pure and slow', params: { mix: 0.55 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'bells-held-open-wet-finger-on-crystal',
    name: 'Wet finger on crystal',
    category: 'bell',
    description:
      'A glass harp rubbed into a held tone with a quick beat in it, widened by two slow chorus voices before a long plate.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { volume: -3.5, sustain: 1, detune: 2.8, brightness: 0.6 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bells-held-open-tumbler-left-ringing',
    name: 'Tumbler left ringing',
    category: 'bell',
    description:
      'Tapped glass with the tap taken off so each rim fades in, and an echo of three tape heads behind.',
    preview: GLASSES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -5, decay: 9, brightness: 0.45, hardness: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bells-held-open-gong-shut-from-the-top',
    name: 'Gong shut from the top',
    category: 'bell',
    description:
      'A gong of long decay behind a low-pass that opens with each stroke and closes after it, its ringing tones held down.',
    preview: GONG_D,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { volume: 3.5, decay: 18, hardness: 0.45 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 2 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'bells-held-open-gong-rubbed-by-many',
    name: 'Gong rubbed by many',
    category: 'bell',
    description:
      'A rubbed gong with its modes where a flat plate has them, turned into a flock of copies that drift round it at a distance.',
    preview: GONG_D,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { stretch: 1, brightness: 0.55, detune: 2 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Slow drift', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-held-open-tines-that-stay',
    name: 'Tines that stay',
    category: 'plucked',
    description:
      'A kalimba with a long ring, each plucked tine caught and stacked as an even layer under the ones that follow.',
    preview: TINES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -4, decay: 5, damping: 0.5, hardness: 0.4 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.3, decay: 12 } },
    ],
  },

  // Flutes on the upper partials.
  {
    id: 'bells-held-open-nominal-on-one-flute',
    name: 'Nominal on one flute',
    category: 'wind',
    description:
      'A concert flute blown straight and clear with no vibrato, with a thin bright plate that begins late.',
    preview: HIGH_C,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { breath: 0.08, blow: 0.55, attack: 0.2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.22 } }],
  },
  {
    id: 'bells-held-open-wood-flutes-arrive',
    name: 'Wood flutes arrive',
    category: 'wind',
    description:
      'Wood flutes that take a second and a half to speak and eight to leave, in a loose ensemble of three chorus voices and an airy hall.',
    preview: HIGH_C,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { attack: 1.6, breath: 0.35, blow: 0.45 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bells-held-open-pipes-knock-on-the-rim',
    name: 'Pipes knock on the rim',
    category: 'wind',
    description:
      'Pan pipes with a hard chiff at the front of each note, skipped away in echoes that fall closer and closer together.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, blow: 0.35, breath: 0.3, release: 0.9 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.35 } }],
  },
  {
    id: 'bells-held-open-breath-before-the-bowl',
    name: 'Breath before the bowl',
    category: 'wind',
    description:
      'A low flute that is nearly all breath, setting off a table of dark bowls tuned in fifths on A.',
    preview: BOWL_A,
    instrument: { deviceId: 'flute', preset: 'Breath pad', params: { volume: -10, attack: 0.9 } },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.5, ring: 16 } }],
  },
  {
    id: 'bells-held-open-low-flute-keeps-watch',
    name: 'Low flute keeps watch',
    category: 'wind',
    description:
      'A low flute drone with a soft start, its breath and quiet ends brought up, in a narrow dark room.',
    preview: BOWL_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { volume: -15.5, attack: 0.35, breath: 0.3, vibrato: 0.1 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Air on top' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bells-held-open-bent-up-to-the-partial',
    name: 'Bent up to the partial',
    category: 'wind',
    description:
      'A shakuhachi that starts two semitones flat and slides up to each note, with slow swells of it played backwards.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { attack: 0.3, breath: 0.5, blow: 0.5, release: 2 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.45 } }],
  },
  {
    id: 'bells-held-open-whispered-in-the-bronze',
    name: 'Whispered in the bronze',
    category: 'wind',
    description:
      'Whispering pan pipes blurred by a cloud with no tail, so each entry comes in without an edge, its top thrown wide.',
    preview: HIGH_C,
    instrument: { deviceId: 'flute', preset: 'Whisper pipes', params: { breath: 0.8, blow: 0.2 } },
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
  },
  {
    id: 'bells-held-open-hard-third-on-the-flute',
    name: 'Hard third on the flute',
    category: 'wind',
    description:
      'A concert flute blown hard with a firm chiff and a wide vibrato, repeated on worn, wavering tape.',
    preview: HIGH_C,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { volume: -14, blow: 0.85, release: 0.6 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.35 } }],
  },
  {
    id: 'bells-held-open-alto-in-a-copper-pipe',
    name: 'Alto in a copper pipe',
    category: 'wind',
    description:
      'A full alto flute sounding inside a stopped metal pipe of twice the length, its resonance added to the tone.',
    preview: BOWL_A,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { chiff: 0.3, attack: 0.15, vibrato: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Metal drone', params: { mix: 0.5, air: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'bells-held-open-bamboo-beats-slowly',
    name: 'Bamboo beats slowly',
    category: 'wind',
    description:
      'A bamboo flute of deep vibrato, a slow harmonic tremolo tilting it from dark to bright and back, with ten seconds of valley after it.',
    preview: BOWL_D,
    instrument: { deviceId: 'flute', preset: 'Bamboo vibrato', params: { attack: 0.6, scoop: 20 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 0.9 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },

  // Voices, which can sing both thirds at once.
  {
    id: 'bells-held-open-both-thirds-sung',
    name: 'Both thirds sung',
    category: 'voice',
    description:
      'A few bright voices on eh, with an octave added above them, in a hall that keeps its top.',
    preview: TREBLE_D,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { voice: 1.34, ensemble: 0.3, vibrato: 2, tone: 11000, breath: 0.1, release: 2.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bells-held-open-monks-keep-the-hum',
    name: 'Monks keep the hum',
    category: 'voice',
    description:
      'Low voices on a closed oh inside a big stopped cistern, a narrow resonance stepping through the harmonics of D above them.',
    preview: LOW_D,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.9, voice: 0.82, tone: 2200 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } },
      { deviceId: 'overtone-singer', preset: 'Low chant', params: { root: 2, mix: 0.6 } },
    ],
  },
  {
    id: 'bells-held-open-trebles-hold-the-twelfth',
    name: 'Trebles hold the twelfth',
    category: 'voice',
    description:
      'High voices on oo with hardly any vibrato, and a reverb that climbs by fifths as it fades.',
    preview: TREBLE_D,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.8, vibrato: 2, voice: 1.4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.3, decay: 6 } }],
  },
  {
    id: 'bells-held-open-breath-off-the-bronze',
    name: 'Breath off the bronze',
    category: 'voice',
    description:
      'A choir of breath, every band of it given a small slow flicker of its own that ripples downward.',
    preview: BLUR,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 1, motion: 0.3, breath: 0.85 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Falling ripple' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'bells-held-open-vowel-turns-with-metal',
    name: 'Vowel turns with metal',
    category: 'voice',
    description:
      'Slow voices that drift through every vowel, in six bands that rise, fall and cross the stereo field by themselves.',
    preview: STROKE_A,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 1.2, release: 3.5, vibrato: 2 },
    },
    effects: [{ deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.2 } }],
  },
  {
    id: 'bells-held-open-ee-at-the-sound-bow',
    name: 'Ee at the sound bow',
    category: 'voice',
    description:
      'A thin ee with a copy of itself moved up four hertz on one side and down on the other, so every note beats.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { volume: -4.5, attack: 0.7, release: 2.5, ensemble: 0.5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'bells-held-open-soloist-follows-herself',
    name: 'Soloist follows herself',
    category: 'voice',
    description:
      'One warm voice climbing with a plain vibrato, followed by two copies of her own line, each half a second later.',
    preview: CLIMB_HIGH,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -4, attack: 0.2, vibrato: 18, release: 1.2, tone: 4500 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Round of three', params: { followers: 2, gap: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'bells-held-open-hummed-until-it-closes',
    name: 'Hummed until it closes',
    category: 'voice',
    description:
      'A dark hum with the mouth shut, swelling faintly, in a deep cave of a reverb with its top taken away.',
    preview: GONG_D,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { volume: -3.5, attack: 0.7, release: 2 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.5 } },
    ],
  },
  {
    id: 'bells-held-open-ah-struck-like-metal',
    name: 'Ah struck like metal',
    category: 'voice',
    description:
      'A short ah with an attack like a stroke, caught at once and held as an even layer after the voice has stopped.',
    preview: QUICK_A,
    instrument: { deviceId: 'choir', preset: 'Short ah', params: { release: 0.5, breath: 0.25 } },
    effects: [{ deviceId: 'sustainer', preset: 'Quick catch', params: { decay: 5, mix: 0.5 } }],
  },
  {
    id: 'bells-held-open-voices-from-next-yard',
    name: 'Voices from next yard',
    category: 'voice',
    description:
      'A distant choir over a wall: narrow, dark, with the near sound dropped away and very little of the room left.',
    preview: BLUR,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 0.8, release: 4, tone: 4000, vowel: 0.35 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },

  // Single bowed strings, held by a bow, by a sustainer or by nothing.
  {
    id: 'bells-held-open-cello-takes-the-hum',
    name: 'Cello takes the hum',
    category: 'string',
    description:
      'A bowed cello-like string with a heavy body and no detune, on a dark plate with the bass kept in the middle.',
    preview: LOW_D,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.9, vibrato: 0.1, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'bells-held-open-bow-drawn-from-the-clang',
    name: 'Bow drawn from the clang',
    category: 'string',
    description:
      'A glassy bow close to the bridge, setting off sixteen strings that learn the notes and ring on with them.',
    preview: STROKE_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { volume: -13, attack: 1, release: 3, brightness: 0.6 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-held-open-string-howls-for-a-gong',
    name: 'String howls for a gong',
    category: 'string',
    description:
      'A sustained string pushed hard enough to sing its octave, thickened by a transformer, in a dark hall.',
    preview: GONG_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { volume: -16, attack: 1, vibrato: 0.1, brightness: 0.5, release: 3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'bells-held-open-viola-barely-touching',
    name: 'Viola barely touching',
    category: 'string',
    description:
      'A bow with almost no pressure over the fingerboard, its air and overtones turned up until the flute in it shows.',
    preview: QUICK_D,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.35, release: 1.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'bells-held-open-plucked-where-it-struck',
    name: 'Plucked where it struck',
    category: 'plucked',
    description:
      'A wiry plucked string with a long ring, faded in so half of each pick is gone, and repeated backwards an octave up.',
    preview: QUICK_A,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -2.5, brightness: 0.6, decay: 10 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick' },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { feedback: 0.3 } },
    ],
  },
  {
    id: 'bells-held-open-two-wires-in-the-tower',
    name: 'Two wires in the tower',
    category: 'plucked',
    description:
      'Plucked pairs of strings tuned far enough apart to beat, through a slow rotating speaker heard across the room.',
    preview: CLIMB_D,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { volume: -1, brightness: 0.7, release: 4 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'bells-held-open-still-string-for-a-rim',
    name: 'Still string for a rim',
    category: 'string',
    description:
      'A string sustained as a plain soft tone with no bow in it, ring-modulated faintly on G so glass gathers round it, edges misted.',
    preview: GLASS_G,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 1.2, release: 2.5, detune: 5 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Glass bells', params: { root: 7, mix: 0.25 } },
      { deviceId: 'fog', preset: 'Morning mist' },
    ],
  },
  {
    id: 'bells-held-open-overtone-on-a-bar',
    name: 'Overtone on a bar',
    category: 'string',
    description:
      'A bright detuned string sustained near its middle so the twelfth speaks first, mixed with a tape copy that drifts.',
    preview: BAR_E,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { attack: 0.8, vibrato: 0, brightness: 0.8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bells-held-open-rough-bow-cracked-bell',
    name: 'Rough bow cracked bell',
    category: 'string',
    description:
      'A rasping bow at full pressure, recorded off a small combo speaker in a room with its bass turned up.',
    preview: LOW_D,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { volume: -14, attack: 0.5, vibrato: 0.1, brightness: 0.6 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { bass: 0.4, treble: -0.2, noise: 0 },
      },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'bells-held-open-section-tuned-by-ear',
    name: 'Section tuned by ear',
    category: 'string',
    description:
      'Wide bowed strings twenty-five cents apart with a slow vibrato, in a modulated space that swells in after each chord.',
    preview: BLUR,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { volume: -13, attack: 0.8, release: 2.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Quick swell', params: { decay: 5 } }],
  },

  // Reed organ: pipes and reeds that hold for as long as there is wind.
  {
    id: 'bells-held-open-harmonium-at-the-stroke',
    name: 'Harmonium at the stroke',
    category: 'organ',
    description:
      'A plain harmonium with little celeste that speaks at once, doubled loosely and pushed lightly into a triode.',
    preview: QUICK_D,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: { attack: 0.05, celeste: 0.05, reed: 0.5, release: 0.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.3 } },
    ],
  },
  {
    id: 'bells-held-open-flue-pipes-for-the-hum',
    name: 'Flue pipes for the hum',
    category: 'organ',
    description:
      'Soft dark flutes over a nearly full sub rank, in a nave that takes eight seconds to empty.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.9, attack: 0.4, tone: 1600, release: 1.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } }],
  },
  {
    id: 'bells-held-open-celeste-for-the-doublet',
    name: 'Celeste for the doublet',
    category: 'organ',
    description:
      'A celeste rank nearly alone, beating against itself the way a bell does, with slow stereo drift and a low-pass that barely moves.',
    preview: BLUR,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        volume: -15,
        octave: 0,
        sub: 0,
        reed: 0.1,
        celeste: 1,
        attack: 0.9,
        release: 2,
        tone: 3200,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 1100 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'bells-held-open-mixture-swells-in',
    name: 'Mixture swells in',
    category: 'organ',
    description:
      'Every rank of the organ brought in over two seconds, its ringing upper tones turned down as they pile up.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1.8, release: 3, twelfth: 0.8, celeste: 0.1 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Flatten', params: { depth: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'bells-held-open-bellows-under-a-gong',
    name: 'Bellows under a gong',
    category: 'organ',
    description:
      'A pump organ with heavy bellows and a nasal reed, played out of a horn loudspeaker across a wide platform.',
    preview: GONG_A,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { volume: -15, attack: 0.35, release: 1.2 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { noise: 0 } }],
  },
  {
    id: 'bells-held-open-quint-with-no-bell-left',
    name: 'Quint with no bell left',
    category: 'organ',
    description:
      'A twelfth rank with a trace of octave, hollow and windy, left to dissolve pass by pass in a small room recorded again and again.',
    preview: QUICK_A,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { volume: -15.5, attack: 0.12, breath: 0.35, octave: 0.15, release: 0.6 },
    },
    effects: [{ deviceId: 'generations', preset: 'Into the room', params: { length: 1.2 } }],
  },
  {
    id: 'bells-held-open-throat-rank-after-metal',
    name: 'Throat rank after metal',
    category: 'organ',
    description:
      'A reed stop with a steady tremulant, pressed into a round vowel so it answers the bell as a throat would, in a long spring.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.6, attack: 0.3, tone: 2600 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bells-held-open-shutters-close-in-turn',
    name: 'Shutters close in turn',
    category: 'organ',
    description:
      'Pipes with most of their top shut away, under a slow breath that darkens them and lets them open again.',
    preview: LEAVE_F,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 0.4, release: 1.2, tone: 2400, celeste: 0.1 },
    },
    effects: [{ deviceId: 'breath', preset: 'Dark lungs', params: { in: 1.6, out: 2.6 } }],
  },
  {
    id: 'bells-held-open-wind-in-the-louvres',
    name: 'Wind in the louvres',
    category: 'organ',
    description:
      'An organ that is all wind and one soft flute, with the notes themselves found and drawn over it as sines.',
    preview: BOWL_A,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { octave: 0.12, attack: 0.5, breath: 0.8 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Wide glass' },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'bells-held-open-organ-across-the-green',
    name: 'Organ across the green',
    category: 'organ',
    description:
      'A whole organ behind a wall, only its lower ranks left, and a dark echo or two of it, each nearly a second later.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { attack: 0.6, release: 2, celeste: 0.6, tone: 700 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { feedback: 0.25, mix: 0.35 } }],
  },

  // Single reeds from nothing.
  {
    id: 'bells-held-open-niente-on-the-rim',
    name: 'Niente on the rim',
    category: 'wind',
    description:
      'A clarinet that takes over a second to come out of nothing and three to go back, in a bare bright chamber.',
    preview: GLASS_G,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { attack: 1.2, breath: 0.25, blow: 0.4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber' }],
  },
  {
    id: 'bells-held-open-bass-reed-finds-the-hum',
    name: 'Bass reed finds the hum',
    category: 'wind',
    description:
      'A bass clarinet close by, deepened by a large resonant pot and evened out by a slow compressor.',
    preview: LOW_D,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.4, breath: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'bells-held-open-subtone-beside-the-bell',
    name: 'Subtone beside the bell',
    category: 'wind',
    description:
      'A breathy subtone saxophone with a light vibrato, on narrow cassette tape with its hiss kept low, and a hall that comes late.',
    preview: STROKE_A,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { volume: -7, attack: 0.4, release: 1.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.03 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'bells-held-open-hollow-reeds-at-once',
    name: 'Hollow reeds at once',
    category: 'wind',
    description:
      'A hollow clarinet section with clear edges, its bands lifted and dropped by slow currents, plainly dry.',
    preview: QUICK_D,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.08, blow: 0.75, breath: 0.1 },
    },
    effects: [{ deviceId: 'currents', preset: 'One slow wheel', params: { rate: 0.4 } }],
  },
  {
    id: 'bells-held-open-apricot-reed-on-tierce',
    name: 'Apricot reed on tierce',
    category: 'wind',
    description: 'A duduk with a broad vibrato, its line ringing in a long tank of three springs.',
    preview: CLIMB_D,
    instrument: { deviceId: 'clarinet', preset: 'Duduk', params: { attack: 0.12, release: 0.8 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } }],
  },
  {
    id: 'bells-held-open-soprano-on-the-last-ring',
    name: 'Soprano on the last ring',
    category: 'wind',
    description:
      'A bright soprano saxophone with a soft start, smeared into a hanging, shimmering halo of its own spectrum.',
    preview: CLIMB_HIGH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.35, release: 1, blow: 0.5 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-held-open-gong-on-the-tongue',
    name: 'Gong on the tongue',
    category: 'wind',
    description:
      'A flutter-tongued reed that growls like a struck gong, followed by slow wide echoes that drift, with the top shaded.',
    preview: GONG_D,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { growl: 0.7, attack: 0.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { feedback: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'bells-held-open-reed-beats-with-itself',
    name: 'Reed beats with itself',
    category: 'wind',
    description:
      'A reed with a wide vibrato, multiplied into sixteen players who wheel about and sway apart.',
    preview: GLASS_G,
    instrument: { deviceId: 'clarinet', preset: 'Wide vibrato reed', params: { vibrato: 0.7 } },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble' }],
  },
  {
    id: 'bells-held-open-reed-under-crystal',
    name: 'Reed under crystal',
    category: 'wind',
    description:
      'A whispered reed, mostly air, whose hidden tones are turned up until they stand level with the breath.',
    preview: GLASS_G,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.8, breath: 0.8, blow: 0.12 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Everything level', params: { amount: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },

  // Flocks of small voices that gather on a partial and scatter when it is let go.
  {
    id: 'bells-held-open-flock-settles-on-a-bell',
    name: 'Flock settles on a bell',
    category: 'voice',
    description:
      'Five gliding voices that rise to each note over a second and a half, levelled by a slow compressor, in a mid-sized hall.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'flock',
      preset: 'Evening flock',
      params: { gather: 1.5, stray: 0.15, octaves: 0.1, tone: 0.45 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'bells-held-open-voices-drop-to-the-third',
    name: 'Voices drop to the third',
    category: 'voice',
    description:
      'Six voices that fall onto each note from above, doubled in a loose chorus, with sighs of them falling further.',
    preview: BLUR,
    instrument: {
      deviceId: 'flock',
      preset: 'Falling in',
      params: { gather: 0.9, tone: 0.35, leave: 1.6 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs' },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
  {
    id: 'bells-held-open-one-whistler-on-the-rim',
    name: 'One whistler on the rim',
    category: 'wind',
    description:
      'A single pure whistle that slides up into each note, strings that learn its notes and ring, and the fading ends lifted.',
    preview: BOWL_D,
    instrument: {
      deviceId: 'flock',
      preset: 'One whistle',
      params: { gather: 0.3, leave: 1.5, tone: 0.1, width: 0.2 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune' },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
  },
  {
    id: 'bells-held-open-slow-roost-in-the-tower',
    name: 'Slow roost in the tower',
    category: 'pad',
    description:
      'Eight birds that need nearly three seconds to arrive and as long to leave, melting downward as they age.',
    preview: BLUR,
    instrument: {
      deviceId: 'flock',
      preset: 'Slow arrival',
      params: { gather: 2.6, leave: 3, tone: 0.5, stray: 0.2 },
    },
    effects: [{ deviceId: 'melt', preset: 'Candle wax' }],
  },
  {
    id: 'bells-held-open-reed-birds-on-the-quint',
    name: 'Reed birds on the quint',
    category: 'wind',
    description:
      'A reedy flock that closes in from both sides of the note, pulsing gently, inside a wooden soundboard.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { stray: 0.12, octaves: 0, gather: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body' },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.2, depth: 0.5 } },
    ],
  },
  {
    id: 'bells-held-open-startled-by-the-clapper',
    name: 'Startled by the clapper',
    category: 'texture',
    description:
      'Voices that jump to each note and take four seconds to scatter from it, in clusters of echo that never keep time.',
    preview: QUICK_HIGH,
    instrument: {
      deviceId: 'flock',
      preset: 'Scattering',
      params: { gather: 0.08, stray: 0.3, leave: 4, tone: 0.5, octaves: 0.6 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.4 } }],
  },
  {
    id: 'bells-held-open-swarm-in-the-wineglass',
    name: 'Swarm in the wineglass',
    category: 'texture',
    description:
      'Eight pure voices, some an octave away, fluttering fast, a ring modulator at a few hertz shaking the rim, on a long plate.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { volume: -4, stray: 0.1, octaves: 0.35, flutter: 3.5 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Slow pulse', params: { frequency: 3.4, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bells-held-open-murmur-in-the-bell-pit',
    name: 'Murmur in the bell pit',
    category: 'drone',
    description:
      'Seven low voices with a reedy edge that arrive slowly, muffled, with an octave below them and no top at all.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { volume: -14.5, gather: 1.6, leave: 2.5, stray: 0.25, octaves: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'bells-held-open-pair-astride-the-bell',
    name: 'Pair astride the bell',
    category: 'wind',
    description:
      'Two hollow voices at the far left and right, swept by a slow phaser and answered by a faint echo.',
    preview: CLIMB_D,
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { volume: -3, gather: 0.25, leave: 1.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.12 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.2 } },
    ],
  },

  // A chorus synthesizer in the part of the section.
  {
    id: 'bells-held-open-dusk-bows-on-the-tower',
    name: 'Dusk bows on the tower',
    category: 'pad',
    description:
      'Synthetic strings of saw and moving pulse with no sub, opened up bright and given a wide top, with no reverb at all.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { sub: 0, cutoff: 5200, attack: 1.1, chorus: 2, lowCut: 1, resonance: 0.05 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'bells-held-open-square-under-the-hum',
    name: 'Square under the hum',
    category: 'drone',
    description:
      'A square wave with its sub octave nearly full up, barely open, driven into a tape preamp with the low end raised.',
    preview: TENTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { volume: -22.5, cutoff: 520, attack: 0.7, sub: 0.8, chorus: 0 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Tape weight' }],
  },
  {
    id: 'bells-held-open-filter-sings-the-nominal',
    name: 'Filter sings the nominal',
    category: 'pad',
    description:
      'A saw behind a filter that whistles on high C, its low end cut away, in a vast modulated space of thin air.',
    preview: STROKE_C,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.9, resonance: 0.9, release: 3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air' }],
  },
  {
    id: 'bells-held-open-filter-swung-like-bronze',
    name: 'Filter swung like bronze',
    category: 'pad',
    description:
      'A saw and square whose filter opens over two seconds of each note, set swinging from side to side like a hung bell.',
    preview: BLUR,
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { volume: -1, attack: 1.8, release: 3.5, sub: 0.2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'bells-held-open-soft-reeds-of-a-gong',
    name: 'Soft reeds of a gong',
    category: 'pad',
    description:
      'A hollow square filtered down to a clarinet, worn onto an old reel that wavers, with a hall behind it that sings oo.',
    preview: GONG_D,
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.8, release: 2, cutoff: 900, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.08, wobble: 0.45 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind' },
    ],
  },
  {
    id: 'bells-held-open-thin-metal-afterwards',
    name: 'Thin metal afterwards',
    category: 'pad',
    description:
      'A thin bright saw with both choruses on, its partials spaced a little wider than a string has them, like a bar.',
    preview: BAR_E,
    instrument: { deviceId: 'dusk', preset: 'Thin shimmer', params: { attack: 0.5, release: 2.5 } },
    effects: [{ deviceId: 'warp', preset: 'Bell metal', params: { stretch: 0.15, mix: 0.6 } }],
  },
  {
    id: 'bells-held-open-keys-beneath-the-belfry',
    name: 'Keys beneath the belfry',
    category: 'keys',
    description:
      'A saw and square with a plucked filter for a clapper, and a string pad that grows behind the stroke, mostly an octave higher.',
    preview: QUICK_A,
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { envelope: 0.4, release: 2.2, chorus: 1 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Octave halo', params: { mix: 0.5 } }],
  },

  // A small section of bows.
  {
    id: 'bells-held-open-six-players-six-tones',
    name: 'Six players six tones',
    category: 'string',
    description:
      'Six players to a note with slow bows and some air, their quiet ends raised so the last to leave is still heard.',
    preview: STROKE_A,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Six slow bows',
      params: { volume: -12, attack: 1.6, release: 4, mute: 0.2, air: 0.3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.6, limit: 8, threshold: -24 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'bells-held-open-muted-from-the-top-down',
    name: 'Muted from the top down',
    category: 'string',
    description:
      'Five muted players with no vibrato, doubled below by dark low strings that follow them and are slow to go.',
    preview: LEAVE_F,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -4.5, attack: 0.35, release: 1.2, mute: 0.8 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos' }],
  },
  {
    id: 'bells-held-open-bows-on-a-steel-edge',
    name: 'Bows on a steel edge',
    category: 'string',
    description:
      'Three bows hard at the bridge, with the ringing tones among their harmonics turned down and a faint wide flange on the rest.',
    preview: BAR_E,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -2, attack: 0.6, release: 2, bow: 0.9, scatter: 0.4 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Ringing tones', params: { depth: 0.6 } },
      { deviceId: 'flanger', preset: 'Faint air', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bells-held-open-viola-alone-with-minor',
    name: 'Viola alone with minor',
    category: 'string',
    description:
      'One player close up with a narrow vibrato, heard through half a minute of hall with its highs damped away.',
    preview: CLIMB_D,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -3.5, vibrato: 5, attack: 0.25, release: 1, mute: 0.4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.4 } }],
  },
  {
    id: 'bells-held-open-ragged-tower-strings',
    name: 'Ragged tower strings',
    category: 'string',
    description:
      'Six ragged players in no agreement about pitch, played from a worn record that warps slowly with a little crackle.',
    preview: BLUR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.7, mute: 0.1 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Slow platter', params: { crackle: 0.1 } }],
  },
  {
    id: 'bells-held-open-whispered-bows-on-a-rim',
    name: 'Whispered bows on a rim',
    category: 'string',
    description:
      'Four airy bows with hardly any weight, sifted so the tones ring on a little and the air is thrown wide.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -2, attack: 0.8, air: 0.7 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Wide air' },
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
    ],
  },

  // Folded and fed-back tones that are half bell themselves.
  {
    id: 'bells-held-open-bronze-drawn-by-hand',
    name: 'Bronze drawn by hand',
    category: 'bell',
    description:
      'A pure tone struck and modulated at five times its pitch into a small chime, with a table of bowls in D minor ringing after it.',
    preview: TINES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: -3.5, fm: 0.35, decay: 4, attack: 0.004 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Minor table', params: { root: 2, mix: 0.45 } }],
  },
  {
    id: 'bells-held-open-gong-built-from-one-sine',
    name: 'Gong built from one sine',
    category: 'bell',
    description:
      'A long gong made by heavy modulation of one tone, darkened as it dies, with the same gong stretched out behind it.',
    preview: GONG_D,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Long gong',
      params: { volume: -2, attack: 0.01, colour: 0.45, fm: 0.6 },
    },
    effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.45 } }],
  },
  {
    id: 'bells-held-open-sines-from-nowhere',
    name: 'Sines from nowhere',
    category: 'pad',
    description:
      'A nearly plain sine that swells in over a second and drifts, in a small reverb whose tail climbs by two octaves.',
    preview: GLASS_OPEN,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { fold: 0.12, attack: 0.9, sustain: 1 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.4 } }],
  },
  {
    id: 'bells-held-open-amplifier-finds-a-mode',
    name: 'Amplifier finds a mode',
    category: 'string',
    description:
      'A string picked softly and caught by its amplifier on an octave, hardly any grit, through a slow pan and a plate.',
    preview: REEDS_D,
    instrument: {
      deviceId: 'feedback',
      preset: 'Singing string',
      params: { grit: 0.1, bloom: 0.9, crowd: 0.1, pick: 0.25 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'bells-held-open-feedback-for-a-bowl',
    name: 'Feedback for a bowl',
    category: 'drone',
    description:
      'A string never picked, raised by feedback onto its twelfth, with a swell over the first note after a silence and a breathing reverb.',
    preview: BOWL_A,
    instrument: { deviceId: 'feedback', preset: 'Glass bow', params: { bloom: 1.2, distance: 3 } },
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 800 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bells-held-open-dark-string-long-gong',
    name: 'Dark string long gong',
    category: 'drone',
    description:
      'A dark damped string sustained on its own note, played off a woolly loudspeaker stack and swelling slowly in broad bands.',
    preview: GONG_A,
    instrument: {
      deviceId: 'feedback',
      preset: 'Dark sustain',
      params: { volume: -15, pick: 0.3, crowd: 0.1, release: 3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { distance: 0.4, noise: 0 } },
      { deviceId: 'glimmer', preset: 'Broad swells' },
    ],
  },
]
