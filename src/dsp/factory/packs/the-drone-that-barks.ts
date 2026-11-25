import { type FactoryPreset, type Phrase } from '../types'

// A wheel bows five strings without end, and a loose bridge barks in time when the hand pushes it.
// Laid out by what is played: drones alone and moving drones, then dances in three, six, two and
// limping, long notes, two voices, wooden keys and a slow phrygian line, with the pushes of the
// wheel set to the beat of each. Last, the drones, strings, pipe and bass that stand with them.

// One key, D2: the drones alone, for six seconds.
const PEDAL_D: Phrase = { notes: [{ atSec: 0, durSec: 6, note: 38, gain: 0.7 }] }

// The same on A2.
const PEDAL_A: Phrase = { notes: [{ atSec: 0, durSec: 6, note: 45, gain: 0.7 }] }

// The low keys move the drones, D C F D, and the tune climbs over them: root and third of D,
// third and fifth of C, third and root of F, then the ninth falling to D. Two to the bar, so a
// wheel with three pushes to the bar goes three against it.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 38, gain: 0.7 },
    { atSec: 1.5, durSec: 1.4, note: 36, gain: 0.7 },
    { atSec: 2.9, durSec: 1.4, note: 41, gain: 0.7 },
    { atSec: 4.3, durSec: 1.8, note: 38, gain: 0.7 },
    { atSec: 0.1, durSec: 0.72, note: 62, gain: 0.65 },
    { atSec: 0.8, durSec: 0.72, note: 65, gain: 0.65 },
    { atSec: 1.5, durSec: 0.72, note: 64, gain: 0.65 },
    { atSec: 2.2, durSec: 0.72, note: 67, gain: 0.65 },
    { atSec: 2.9, durSec: 0.72, note: 69, gain: 0.65 },
    { atSec: 3.6, durSec: 0.72, note: 65, gain: 0.65 },
    { atSec: 4.3, durSec: 0.72, note: 64, gain: 0.65 },
    { atSec: 5, durSec: 1.085, note: 62, gain: 0.65 },
  ],
}

// Five bars of three in D dorian over a held D, the B natural in the third bar and the C under
// the close. It answers itself two bars later, so it is a round as well.
const THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.1, note: 38, gain: 0.6 },
    { atSec: 0.1, durSec: 0.82, note: 62, gain: 0.65 },
    { atSec: 0.9, durSec: 0.42, note: 64, gain: 0.65 },
    { atSec: 1.3, durSec: 0.42, note: 65, gain: 0.65 },
    { atSec: 1.7, durSec: 0.42, note: 67, gain: 0.65 },
    { atSec: 2.1, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 2.5, durSec: 0.42, note: 71, gain: 0.65 },
    { atSec: 2.9, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 3.3, durSec: 0.42, note: 67, gain: 0.65 },
    { atSec: 3.7, durSec: 0.42, note: 65, gain: 0.65 },
    { atSec: 4.1, durSec: 0.42, note: 64, gain: 0.65 },
    { atSec: 4.5, durSec: 0.42, note: 60, gain: 0.65 },
    { atSec: 4.9, durSec: 1.2, note: 62, gain: 0.65 },
  ],
}

// The same tune an octave up over an open D4 bowed again with each bar: a fiddle's two strings.
const FIDDLE: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 1.18, note: 62, gain: 0.5 },
    { atSec: 1.3, durSec: 1.18, note: 62, gain: 0.5 },
    { atSec: 2.5, durSec: 1.18, note: 62, gain: 0.5 },
    { atSec: 3.7, durSec: 1.18, note: 62, gain: 0.5 },
    { atSec: 4.9, durSec: 1.18, note: 62, gain: 0.5 },
    { atSec: 0.1, durSec: 0.82, note: 74, gain: 0.65 },
    { atSec: 0.9, durSec: 0.42, note: 76, gain: 0.65 },
    { atSec: 1.3, durSec: 0.42, note: 77, gain: 0.65 },
    { atSec: 1.7, durSec: 0.42, note: 79, gain: 0.65 },
    { atSec: 2.1, durSec: 0.42, note: 81, gain: 0.65 },
    { atSec: 2.5, durSec: 0.42, note: 83, gain: 0.65 },
    { atSec: 2.9, durSec: 0.42, note: 81, gain: 0.65 },
    { atSec: 3.3, durSec: 0.42, note: 79, gain: 0.65 },
    { atSec: 3.7, durSec: 0.42, note: 77, gain: 0.65 },
    { atSec: 4.1, durSec: 0.42, note: 76, gain: 0.65 },
    { atSec: 4.5, durSec: 0.42, note: 72, gain: 0.65 },
    { atSec: 4.9, durSec: 1.2, note: 74, gain: 0.65 },
  ],
}

// Five bars of six eighths in A minor over a held A, with a turn on the C of the third bar and
// a G natural under the close.
const SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.1, note: 45, gain: 0.6 },
    { atSec: 0.1, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 0.5, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 0.7, durSec: 0.42, note: 72, gain: 0.65 },
    { atSec: 1.1, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 1.3, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 1.7, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 1.9, durSec: 0.42, note: 64, gain: 0.65 },
    { atSec: 2.3, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 2.5, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 2.9, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 3.1, durSec: 0.12, note: 74, gain: 0.65 },
    { atSec: 3.2, durSec: 0.12, note: 72, gain: 0.65 },
    { atSec: 3.3, durSec: 0.12, note: 71, gain: 0.65 },
    { atSec: 3.4, durSec: 0.12, note: 72, gain: 0.65 },
    { atSec: 3.5, durSec: 0.22, note: 74, gain: 0.65 },
    { atSec: 3.7, durSec: 0.22, note: 76, gain: 0.65 },
    { atSec: 3.9, durSec: 0.22, note: 74, gain: 0.65 },
    { atSec: 4.1, durSec: 0.22, note: 72, gain: 0.65 },
    { atSec: 4.3, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 4.5, durSec: 0.22, note: 72, gain: 0.65 },
    { atSec: 4.7, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 4.9, durSec: 1, note: 69, gain: 0.65 },
  ],
}

// The same tune with no drone under it, for a pipe.
const PIPE: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 0.5, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 0.7, durSec: 0.42, note: 72, gain: 0.65 },
    { atSec: 1.1, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 1.3, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 1.7, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 1.9, durSec: 0.42, note: 64, gain: 0.65 },
    { atSec: 2.3, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 2.5, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 2.9, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 3.1, durSec: 0.12, note: 74, gain: 0.65 },
    { atSec: 3.2, durSec: 0.12, note: 72, gain: 0.65 },
    { atSec: 3.3, durSec: 0.12, note: 71, gain: 0.65 },
    { atSec: 3.4, durSec: 0.12, note: 72, gain: 0.65 },
    { atSec: 3.5, durSec: 0.22, note: 74, gain: 0.65 },
    { atSec: 3.7, durSec: 0.22, note: 76, gain: 0.65 },
    { atSec: 3.9, durSec: 0.22, note: 74, gain: 0.65 },
    { atSec: 4.1, durSec: 0.22, note: 72, gain: 0.65 },
    { atSec: 4.3, durSec: 0.22, note: 71, gain: 0.65 },
    { atSec: 4.5, durSec: 0.22, note: 72, gain: 0.65 },
    { atSec: 4.7, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 4.9, durSec: 1, note: 69, gain: 0.65 },
  ],
}

// A dance in two over a held G, mixolydian: the F natural turns it home.
const FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 43, gain: 0.6 },
    { atSec: 0.1, durSec: 0.27, note: 67, gain: 0.65 },
    { atSec: 0.35, durSec: 0.27, note: 69, gain: 0.65 },
    { atSec: 0.6, durSec: 0.27, note: 71, gain: 0.65 },
    { atSec: 0.85, durSec: 0.27, note: 74, gain: 0.65 },
    { atSec: 1.1, durSec: 0.27, note: 72, gain: 0.65 },
    { atSec: 1.35, durSec: 0.27, note: 71, gain: 0.65 },
    { atSec: 1.6, durSec: 0.27, note: 69, gain: 0.65 },
    { atSec: 1.85, durSec: 0.27, note: 65, gain: 0.65 },
    { atSec: 2.1, durSec: 0.27, note: 67, gain: 0.65 },
    { atSec: 2.35, durSec: 0.27, note: 69, gain: 0.65 },
    { atSec: 2.6, durSec: 0.27, note: 71, gain: 0.65 },
    { atSec: 2.85, durSec: 0.27, note: 72, gain: 0.65 },
    { atSec: 3.1, durSec: 0.52, note: 74, gain: 0.65 },
    { atSec: 3.6, durSec: 0.27, note: 72, gain: 0.65 },
    { atSec: 3.85, durSec: 0.27, note: 71, gain: 0.65 },
    { atSec: 4.1, durSec: 0.27, note: 69, gain: 0.65 },
    { atSec: 4.35, durSec: 0.27, note: 65, gain: 0.65 },
    { atSec: 4.6, durSec: 0.27, note: 64, gain: 0.65 },
    { atSec: 4.85, durSec: 0.27, note: 65, gain: 0.65 },
    { atSec: 5.1, durSec: 1, note: 67, gain: 0.65 },
  ],
}

// Long and short, long and short, in C over a held C: the rhythm a wheel pushed late makes.
const LIMP: Phrase = {
  notes: [
    { atSec: 0, durSec: 6, note: 36, gain: 0.6 },
    { atSec: 0.1, durSec: 0.42, note: 64, gain: 0.65 },
    { atSec: 0.5, durSec: 0.22, note: 65, gain: 0.65 },
    { atSec: 0.7, durSec: 0.42, note: 67, gain: 0.65 },
    { atSec: 1.1, durSec: 0.22, note: 69, gain: 0.65 },
    { atSec: 1.3, durSec: 0.42, note: 67, gain: 0.65 },
    { atSec: 1.7, durSec: 0.22, note: 64, gain: 0.65 },
    { atSec: 1.9, durSec: 0.42, note: 60, gain: 0.65 },
    { atSec: 2.3, durSec: 0.22, note: 62, gain: 0.65 },
    { atSec: 2.5, durSec: 0.42, note: 64, gain: 0.65 },
    { atSec: 2.9, durSec: 0.22, note: 65, gain: 0.65 },
    { atSec: 3.1, durSec: 0.42, note: 67, gain: 0.65 },
    { atSec: 3.5, durSec: 0.22, note: 72, gain: 0.65 },
    { atSec: 3.7, durSec: 0.42, note: 69, gain: 0.65 },
    { atSec: 4.1, durSec: 0.22, note: 67, gain: 0.65 },
    { atSec: 4.3, durSec: 0.42, note: 65, gain: 0.65 },
    { atSec: 4.7, durSec: 0.22, note: 62, gain: 0.65 },
    { atSec: 4.9, durSec: 1.1, note: 60, gain: 0.65 },
  ],
}

// The limping tune alone, for a horn.
const HORN: Phrase = { notes: LIMP.notes.slice(1) }

// Four long notes, D F E A, over a held D whose third drone is the A under the last of them.
const BEAT: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 38, gain: 0.6 },
    { atSec: 0.1, durSec: 1.52, note: 62, gain: 0.6 },
    { atSec: 1.6, durSec: 1.52, note: 65, gain: 0.6 },
    { atSec: 3.1, durSec: 1.52, note: 64, gain: 0.6 },
    { atSec: 4.6, durSec: 2, note: 69, gain: 0.6 },
  ],
}

// Two voices over a held D: a fifth closes to a third, opens through a sixth and a sixth, and
// comes back to the fifth.
const DUO: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 38, gain: 0.6 },
    { atSec: 0.1, durSec: 0.98, note: 62, gain: 0.6 },
    { atSec: 0.1, durSec: 0.98, note: 69, gain: 0.6 },
    { atSec: 1.1, durSec: 0.98, note: 64, gain: 0.6 },
    { atSec: 1.1, durSec: 0.98, note: 67, gain: 0.6 },
    { atSec: 2.1, durSec: 0.98, note: 65, gain: 0.6 },
    { atSec: 2.1, durSec: 0.98, note: 69, gain: 0.6 },
    { atSec: 3.1, durSec: 0.98, note: 64, gain: 0.6 },
    { atSec: 3.1, durSec: 0.98, note: 72, gain: 0.6 },
    { atSec: 4.1, durSec: 0.98, note: 62, gain: 0.6 },
    { atSec: 4.1, durSec: 0.98, note: 71, gain: 0.6 },
    { atSec: 5.1, durSec: 1.18, note: 62, gain: 0.6 },
    { atSec: 5.1, durSec: 1.18, note: 69, gain: 0.6 },
  ],
}

// Drones held four seconds and three notes over them: once let go, what is left is the wheel stopping.
const RUN: Phrase = {
  notes: [
    { atSec: 0, durSec: 4, note: 38, gain: 0.7 },
    { atSec: 1.2, durSec: 0.95, note: 62, gain: 0.6 },
    { atSec: 2.1, durSec: 0.95, note: 65, gain: 0.6 },
    { atSec: 3, durSec: 1, note: 69, gain: 0.6 },
  ],
}

// Detached eighths in six, no drone key held: every key stops the string afresh.
const KNOCK: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 0.2, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 0.4, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 0.6, durSec: 0.13, note: 67, gain: 0.7 },
    { atSec: 0.8, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 1, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 1.2, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 1.4, durSec: 0.13, note: 60, gain: 0.7 },
    { atSec: 1.6, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 1.8, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 2, durSec: 0.13, note: 60, gain: 0.7 },
    { atSec: 2.2, durSec: 0.13, note: 57, gain: 0.7 },
    { atSec: 2.4, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 2.6, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 2.8, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 3, durSec: 0.13, note: 69, gain: 0.7 },
    { atSec: 3.2, durSec: 0.13, note: 67, gain: 0.7 },
    { atSec: 3.4, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 3.6, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 3.8, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 4, durSec: 0.13, note: 60, gain: 0.7 },
    { atSec: 4.2, durSec: 1, note: 62, gain: 0.7 },
  ],
}

// The same over a held D, so the wheel keeps its speed between the keys and its pushes their beat.
const KNOCK_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.6, note: 38, gain: 0.55 },
    { atSec: 0.1, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 0.3, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 0.5, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 0.7, durSec: 0.13, note: 67, gain: 0.7 },
    { atSec: 0.9, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 1.1, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 1.3, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 1.5, durSec: 0.13, note: 60, gain: 0.7 },
    { atSec: 1.7, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 1.9, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 2.1, durSec: 0.13, note: 60, gain: 0.7 },
    { atSec: 2.3, durSec: 0.13, note: 57, gain: 0.7 },
    { atSec: 2.5, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 2.7, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 2.9, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 3.1, durSec: 0.13, note: 69, gain: 0.7 },
    { atSec: 3.3, durSec: 0.13, note: 67, gain: 0.7 },
    { atSec: 3.5, durSec: 0.13, note: 65, gain: 0.7 },
    { atSec: 3.7, durSec: 0.13, note: 64, gain: 0.7 },
    { atSec: 3.9, durSec: 0.13, note: 62, gain: 0.7 },
    { atSec: 4.1, durSec: 0.13, note: 60, gain: 0.7 },
    { atSec: 4.3, durSec: 1.1, note: 62, gain: 0.7 },
  ],
}

// A slow line in E phrygian over a held E: the F leans on the drone both ways.
const CANTUS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 40, gain: 0.6 },
    { atSec: 0.3, durSec: 1.22, note: 64, gain: 0.6 },
    { atSec: 1.5, durSec: 0.62, note: 65, gain: 0.6 },
    { atSec: 2.1, durSec: 0.62, note: 67, gain: 0.6 },
    { atSec: 2.7, durSec: 1.22, note: 69, gain: 0.6 },
    { atSec: 3.9, durSec: 0.62, note: 67, gain: 0.6 },
    { atSec: 4.5, durSec: 0.62, note: 65, gain: 0.6 },
    { atSec: 5.1, durSec: 1.38, note: 64, gain: 0.6 },
  ],
}

// The bass under the dance in three: D A, F, G E, D C A, D, in tenths and fifths with it.
const BASS: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.78, note: 38, gain: 0.7 },
    { atSec: 0.9, durSec: 0.38, note: 33, gain: 0.7 },
    { atSec: 1.3, durSec: 0.78, note: 41, gain: 0.7 },
    { atSec: 2.1, durSec: 0.38, note: 41, gain: 0.7 },
    { atSec: 2.5, durSec: 0.78, note: 43, gain: 0.7 },
    { atSec: 3.3, durSec: 0.38, note: 40, gain: 0.7 },
    { atSec: 3.7, durSec: 0.38, note: 38, gain: 0.7 },
    { atSec: 4.1, durSec: 0.38, note: 36, gain: 0.7 },
    { atSec: 4.5, durSec: 0.38, note: 33, gain: 0.7 },
    { atSec: 4.9, durSec: 1.2, note: 38, gain: 0.7 },
  ],
}
export const PRESETS: readonly FactoryPreset[] = [
  // The drones alone, and drones that move.
  {
    id: 'the-drone-that-barks-no-seam-in-the-turn',
    name: 'No seam in the turn',
    category: 'drone',
    description:
      'Three drones, root, octave and fifth, under a wheel with no pushes: bare firm strings, in a hall that keeps the bass eight seconds.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Still wheel',
      params: {
        rosin: 0.45,
        noise: 0.18,
        brightness: 0.6,
        spin: 0.3,
        trompette: 0.5,
        body: 0.2,
        spread: 0.4,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'the-drone-that-barks-quarrel-of-twelve-cents',
    name: 'Quarrel of twelve cents',
    category: 'drone',
    description:
      'Drones in three octaves, the top one twelve cents sharp: they beat twice a second with no push of the hand, on cassette.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Beating fifth',
      params: {
        tuning: 2,
        detune: 12,
        trompette: 0.8,
        drones: 0.6,
        spread: 0.6,
        rosin: 0.55,
        brightness: 0.4,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'the-drone-that-barks-wakes-at-the-first-push',
    name: 'Wakes at the first push',
    category: 'drone',
    description:
      'Three pushes a turn, the first twice the others and the only one to wake the dog: one bark every two seconds, in a room.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        volume: -7.5,
        pattern: 2,
        depth: 0.5,
        dog: 0.35,
        brightness: 0.4,
        spin: 0.1,
        body: 0.7,
        trompette: 0.35,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room' }],
  },
  {
    id: 'the-drone-that-barks-barn-door-heart',
    name: 'Barn door heart',
    category: 'drone',
    description:
      'Covered drones with a fifth at the bottom and no dog, pushed long then short in a turn of a little over a second, as a heart goes.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Slow heartbeat',
      params: { depth: 1, dog: 0, speed: 0.9, tuning: 3, brightness: 0.15, body: 0.2, spin: 0.3 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall' }],
  },
  {
    id: 'the-drone-that-barks-a-push-then-quiet',
    name: 'A push, then quiet',
    category: 'drone',
    description:
      'Ten seconds to a turn and six pushes in it, each with a short bark, over drones with a fourth on top, thrown into far echoes.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Ten seconds a turn',
      params: {
        accents: 4,
        depth: 0.5,
        dog: 0.45,
        spin: 0.4,
        tuning: 1,
        noise: 0.3,
        brightness: 0.5,
        trompette: 0.35,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Far echoes' }],
  },
  {
    id: 'the-drone-that-barks-wound-up-slowly',
    name: 'Wound up slowly',
    category: 'drone',
    description:
      'A wheel that takes five seconds to come up to speed: its pushes quicken and grow until the dog wakes, circling the listener.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Long run down',
      params: {
        volume: -6.5,
        spin: 5,
        speed: 1.5,
        accents: 2,
        depth: 0.5,
        dog: 0.5,
        rosin: 0.3,
        trompette: 0.22,
        spread: 0.2,
        brightness: 0.6,
        drones: 0.8,
      },
    },
    effects: [{ deviceId: 'around', preset: 'Slow circle' }],
  },
  {
    id: 'the-drone-that-barks-nervous-hands-on-the-rim',
    name: 'Nervous hands on the rim',
    category: 'drone',
    description:
      'Nearly ten even pushes a second and no bark, on firm dark strings in their box: the low bands stir by themselves under the tremble.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Even trembling',
      params: {
        speed: 1.6,
        depth: 0.35,
        dog: 0,
        rosin: 0.65,
        melody: 0,
        trompette: 0.3,
        brightness: 0.3,
        body: 0.9,
        spread: 0.3,
      },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Stirring lows' }],
  },
  {
    id: 'the-drone-that-barks-growl-at-the-hub',
    name: 'Growl at the hub',
    category: 'drone',
    description:
      'Three turns a second and six hard pushes in each: the drones, a fourth on top, become a growl, swept slowly by a phaser.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Fast flutter',
      params: {
        depth: 0.8,
        dog: 0.25,
        tuning: 1,
        brightness: 0.5,
        drones: 0.8,
        rosin: 0.55,
        body: 0.4,
        spread: 0.3,
        trompette: 0.26,
      },
    },
    effects: [{ deviceId: 'phaser', preset: 'Glacial sweep' }],
  },
  {
    id: 'the-drone-that-barks-cotton-asleep',
    name: 'Cotton, asleep',
    category: 'drone',
    description:
      'Cotton on drones in three octaves, hollow and full of hiss, opened and closed by a slow cycle of breath.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        noise: 0.65,
        tuning: 2,
        drones: 0.9,
        trompette: 0.7,
        brightness: 0.5,
        body: 0.1,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'breath', preset: 'Asleep' }],
  },
  {
    id: 'the-drone-that-barks-cotton-in-gusts',
    name: 'Cotton in gusts',
    category: 'texture',
    description:
      'Hardly any grip and all the hiss there is: one deep push a second blows through the drones, blurred in a dark bank of fog.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        rosin: 0.04,
        noise: 1,
        accents: 2,
        speed: 0.3333,
        depth: 1,
        brightness: 0.2,
        drones: 0.7,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
  },
  {
    id: 'the-drone-that-barks-tar-and-rosin',
    name: 'Tar and rosin',
    category: 'drone',
    description:
      'All the rosin and no pushes: raw drones with the fifth at the bottom, through a dark woolly speaker stack.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Raw wheel',
      params: {
        accents: 0,
        dog: 0,
        depth: 0,
        tuning: 3,
        brightness: 0.35,
        body: 0.9,
        noise: 0.2,
        spin: 0.5,
        drones: 0.9,
        trompette: 0.3,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly' }],
  },
  {
    id: 'the-drone-that-barks-ground-that-turns',
    name: 'Ground that turns',
    category: 'string',
    description:
      'Each low key moves the three drones and a tune climbs over them, three barks to the bar and a knock at every key, on a small plate.',
    preview: GROUND,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        speed: 0.7143,
        depth: 0.4,
        dog: 0.6,
        spin: 0.2,
        tangents: 0.6,
        drones: 0.5,
        trompette: 0.35,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'the-drone-that-barks-ground-of-pipes',
    name: 'Ground of pipes',
    category: 'organ',
    description:
      'Drones in three octaves that follow the low keys, no pushes, with organ stops an octave under and over the whole of it.',
    preview: GROUND,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Chapel octaves',
      params: { spin: 0.6, rosin: 0.35, drones: 0.5, trompette: 0.2, body: 0.4 },
    },
    effects: [{ deviceId: 'stops', preset: 'Principal chorus' }],
  },
  {
    id: 'the-drone-that-barks-the-dog-has-its-string',
    name: 'The dog has its string',
    category: 'drone',
    description:
      'The third drone by itself, a fifth over the octave: four pushes a turn and the first strongest, its ring held down and its top cut.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Four to the turn',
      params: { drones: 0, trompette: 1, dog: 0.6, depth: 0.42, speed: 0.6, brightness: 0.75 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Harsh sample' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { presence: -4 } },
    ],
  },
  {
    id: 'the-drone-that-barks-ash-and-axle',
    name: 'Ash and axle',
    category: 'texture',
    description:
      'Six pushes a turn in long and short until the key is let go: the wheel takes three seconds to stop and the dog gives out before it.',
    preview: RUN,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Long run down',
      params: {
        volume: -16,
        spin: 3,
        speed: 1.2,
        accents: 4,
        pattern: 1,
        depth: 0.6,
        dog: 0.7,
        rosin: 0.6,
        body: 0.2,
        drones: 0.8,
        trompette: 0.32,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'the-drone-that-barks-last-turns-of-the-day',
    name: 'Last turns of the day',
    category: 'texture',
    description:
      'A covered wheel with two pushes a turn that runs three and a half seconds after the last key, and comes back faintly off a loop of tape.',
    preview: RUN,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Behind the wall',
      params: {
        spin: 3.5,
        accents: 1,
        pattern: 1,
        depth: 0.9,
        dog: 0,
        speed: 1.1,
        brightness: 0.25,
        tuning: 2,
      },
    },
    effects: [{ deviceId: 'tape-loop', preset: 'Faint afterimage' }],
  },

  // A dance in three in D dorian: where the pushes fall is the drum.
  {
    id: 'the-drone-that-barks-bark-on-every-beat',
    name: 'Bark on every beat',
    category: 'string',
    description:
      'A turn is a bar of 1.2 seconds and each of its three beats is a bark, with the drones held under the tune, in a tight room.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Three barks a turn',
      params: {
        speed: 0.8333,
        spin: 0.2,
        depth: 0.4,
        dog: 0.65,
        trompette: 0.38,
        drones: 0.4,
        brightness: 0.45,
        body: 0.7,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
  },
  {
    id: 'the-drone-that-barks-boot-on-the-first-beat',
    name: 'Boot on the first beat',
    category: 'string',
    description:
      'Three pushes to the bar and only the first wakes the dog, with the tune doubled an octave down, on soft tape in a small booth.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Octave below',
      params: {
        speed: 0.8333,
        spin: 0.2,
        pattern: 2,
        depth: 0.55,
        dog: 0.3,
        trompette: 0.45,
        brightness: 0.45,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'the-drone-that-barks-aspen-leaves-in-three',
    name: 'Aspen leaves in three',
    category: 'string',
    description:
      'Six small pushes a bar that never wake the dog: the tune and its drones tremble in eighths, doubled loosely to the sides.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Even trembling',
      params: {
        volume: -8.5,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.25,
        melody: 0,
        rosin: 0.3,
        brightness: 0.6,
        body: 0.1,
        drones: 0.5,
      },
    },
    effects: [{ deviceId: 'chorus', preset: 'Loose double' }],
  },
  {
    id: 'the-drone-that-barks-gatepost-once-a-bar',
    name: 'Gatepost, once a bar',
    category: 'string',
    description:
      'Two pushes to a slow turn, one bark to each bar of the tune, over drones with the fifth at the bottom, with a short slap behind.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Low fifths',
      params: {
        volume: -16.5,
        drone: 0,
        melody: 0,
        speed: 0.4167,
        spin: 0.2,
        depth: 0.7,
        dog: 0.65,
        brightness: 0.5,
        body: 0.5,
        spread: 0.9,
        trompette: 0.38,
      },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback' }],
  },
  {
    id: 'the-drone-that-barks-swung-by-the-crank',
    name: 'Swung by the crank',
    category: 'organ',
    description:
      'No dog, three swells to the bar, and the whole instrument turned again by a slow rotary speaker.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        volume: -16.5,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.7,
        dog: 0,
        rosin: 0.25,
        brightness: 0.35,
        body: 1,
        drones: 0.8,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'the-drone-that-barks-four-two-and-three',
    name: 'Four, two and three',
    category: 'string',
    description:
      'Three barks in a turn cut four, two and three ninths long, so the drum limps across the bars of the tune. A trace of spring.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        pattern: 1,
        speed: 0.5556,
        spin: 0.2,
        depth: 0.55,
        dog: 0.8,
        trompette: 0.3,
        rosin: 0.55,
        drones: 0.35,
        tuning: 2,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'the-drone-that-barks-cotton-and-clogs',
    name: 'Cotton and clogs',
    category: 'keys',
    description:
      'Cotton on the strings and loud wooden keys: the tune is whispered and knocked at once, driven into a limiter, in a tight chamber.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        volume: -13.5,
        tangents: 1,
        rosin: 0.16,
        noise: 0.4,
        spin: 0.1,
        drones: 0.5,
        body: 0.9,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'the-drone-that-barks-village-hall-by-wireless',
    name: 'Village hall by wireless',
    category: 'string',
    description:
      'A raw wheel and three barks to the bar, heard over a clean transistor set that takes off the bass and the top of the bark.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Raw wheel',
      params: {
        speed: 0.8333,
        spin: 0.2,
        accents: 2,
        depth: 0.5,
        dog: 0.6,
        rosin: 0.75,
        trompette: 0.4,
        drones: 0.5,
      },
    },
    effects: [{ deviceId: 'radio', preset: 'Clean transistor' }],
  },
  {
    id: 'the-drone-that-barks-round-over-two-bars',
    name: 'Round over two bars',
    category: 'string',
    description:
      'An even wheel and octave drones: whatever is played comes back 2.4 seconds later as a second player, two bars behind.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Chapel octaves',
      params: {
        drones: 0.25,
        trompette: 0.12,
        rosin: 0.4,
        brightness: 0.55,
        body: 0.3,
        spin: 0.2,
        spread: 0.6,
      },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 2.4, tone: 9000, mix: 0.42 } },
    ],
  },
  {
    id: 'the-drone-that-barks-home-becomes-the-fifth',
    name: 'Home becomes the fifth',
    category: 'string',
    description:
      'Drones on D with a G at the top, so a tune in D leans on its fourth: two soft pushes a bar, at the back of a hall.',
    preview: THREE,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Open fourth',
      params: {
        accents: 1,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.5,
        dog: 0,
        melody: 1,
        drones: 0.6,
        trompette: 0.9,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },

  // A tune in six, A minor over A.
  {
    id: 'the-drone-that-barks-six-under-the-turn',
    name: 'Six under the turn',
    category: 'string',
    description:
      'Every eighth of the bar is a small bark, six to a turn of 1.2 seconds, narrow and bright, with one slap of tape behind.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        accents: 4,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.35,
        dog: 0.75,
        trompette: 0.3,
        drones: 0.45,
        brightness: 0.65,
        spread: 0,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
  },
  {
    id: 'the-drone-that-barks-lilt-of-the-late-push',
    name: 'Lilt of the late push',
    category: 'string',
    description:
      'Four pushes a bar, every second one late, so the bark goes quarter and eighth with the tune. In a small dark room.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Limping dance',
      params: {
        accents: 3,
        speed: 0.8333,
        depth: 0.45,
        dog: 0.6,
        trompette: 0.4,
        drones: 0.6,
        rosin: 0.3,
        body: 0.6,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room' }],
  },
  {
    id: 'the-drone-that-barks-harvest-boots',
    name: 'Harvest boots',
    category: 'string',
    description:
      'Two heavy barks to the bar of six, the tune doubled an octave down, warmed by a hot valve.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Octave below',
      params: {
        volume: -19,
        accents: 1,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.8,
        dog: 0.55,
        trompette: 0.28,
        brightness: 0.4,
        spread: 0.9,
        body: 0.3,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Hot valve' }],
  },
  {
    id: 'the-drone-that-barks-dance-heard-in-a-chapel',
    name: 'Dance heard in a chapel',
    category: 'organ',
    description:
      'No pushes and no bark: drones in octaves and the tune with its octave, long to stop, in a chapel that sings a vowel back.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Chapel octaves',
      params: { melody: 1, spin: 1.2, brightness: 0.3, drones: 0.5, trompette: 0.6, body: 1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
  },
  {
    id: 'the-drone-that-barks-e-under-the-a-minor',
    name: 'E under the A minor',
    category: 'string',
    description:
      'Drones fixed on E with an A at the top, so the tune stands on its fifth: six pushes a bar, a bark on the first alone, in a dark plate.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Open fourth',
      params: {
        drone: 5,
        accents: 4,
        pattern: 2,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.6,
        dog: 0.35,
        drones: 0.5,
        trompette: 0.35,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'the-drone-that-barks-not-to-wake-the-house',
    name: 'Not to wake the house',
    category: 'wind',
    description:
      'A tune in six whispered by cotton, its wheel swelling twice a bar with no bark, each swell answered by a short halo.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        accents: 1,
        depth: 0.7,
        speed: 0.8333,
        spin: 0.2,
        noise: 0.35,
        brightness: 0.62,
        drones: 0.3,
        trompette: 0.2,
        spread: 0.2,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo' }],
  },
  {
    id: 'the-drone-that-barks-axle-running-hot',
    name: 'Axle running hot',
    category: 'string',
    description:
      'A fast bright wheel with a bark on every eighth of the six, its top rounded off by a pushed console in mono.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Bright reel',
      params: {
        volume: -20,
        speed: 1.6667,
        accents: 2,
        pattern: 2,
        depth: 0.5,
        dog: 0.7,
        rosin: 0.8,
        trompette: 0.35,
        brightness: 0.7,
        drones: 0.6,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'the-drone-that-barks-fair-across-the-water',
    name: 'Fair across the water',
    category: 'texture',
    description:
      'A fluttering wheel, fifteen weak pushes a second, heard from a far shore with most of it room and little of its top.',
    preview: SIX,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Fast flutter',
      params: { speed: 2.5, depth: 0.3, dog: 0.2, tuning: 2, drones: 0.6 },
    },
    effects: [{ deviceId: 'distance', preset: 'Far shore' }],
  },

  // A dance in two, mixolydian on G.
  {
    id: 'the-drone-that-barks-four-corners-of-a-yard',
    name: 'Four corners of a yard',
    category: 'string',
    description:
      'Four even barks in a turn of two seconds under a tune in two, out of a horn loudspeaker across a station platform.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Four to the turn',
      params: {
        speed: 0.5,
        pattern: 0,
        spin: 0.2,
        depth: 0.45,
        dog: 0.75,
        trompette: 0.5,
        drones: 0.6,
        brightness: 0.5,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform' }],
  },
  {
    id: 'the-drone-that-barks-hen-coop-at-noon',
    name: 'Hen coop at noon',
    category: 'string',
    description:
      'A push on every eighth, the first of four the loudest bark, dry strings without their box, with a dark narrow spring.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Four to the turn',
      params: {
        speed: 1,
        spin: 0.2,
        depth: 0.7,
        dog: 0.45,
        trompette: 0.28,
        drones: 0.2,
        brightness: 0.6,
        body: 0,
        tangents: 0.5,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring' }],
  },
  {
    id: 'the-drone-that-barks-two-who-share-a-bench',
    name: 'Two who share a bench',
    category: 'string',
    description:
      'A soft swell on each beat and no bark, doubled by two wandering copies of the player close by.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        accents: 1,
        speed: 1,
        spin: 0.2,
        depth: 0.45,
        dog: 0,
        rosin: 0.6,
        brightness: 0.35,
        drones: 0.2,
        trompette: 0.1,
        body: 0.8,
      },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
  },
  {
    id: 'the-drone-that-barks-fifth-underneath',
    name: 'Fifth underneath',
    category: 'keys',
    description:
      'Drones fixed on D with a G on top, so a tune in G stands over its fifth; loud wooden keys and no pushes, in a short ambience.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Open fourth',
      params: {
        accents: 0,
        dog: 0,
        tangents: 1,
        rosin: 0.2,
        drones: 0.5,
        spin: 0.15,
        brightness: 0.55,
        body: 0.35,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience' }],
  },
  {
    id: 'the-drone-that-barks-rafters-sing-along',
    name: 'Rafters sing along',
    category: 'drone',
    description:
      'Raw rosin and an even wheel: the drones feed back softly into one of their own overtones under a tune on G.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Raw wheel',
      params: {
        accents: 0,
        depth: 0,
        dog: 0,
        brightness: 0.45,
        noise: 0.1,
        body: 1,
        trompette: 0.6,
        spin: 0.6,
        tuning: 2,
      },
    },
    effects: [{ deviceId: 'howl', preset: 'Faint sustain' }],
  },
  {
    id: 'the-drone-that-barks-rubbed-by-a-thumb',
    name: 'Rubbed by a thumb',
    category: 'string',
    description:
      'The tune well in front of two faint drones, its long notes given a finger vibrato, with a slight swell every second.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Octave below',
      params: {
        melody: 0,
        drones: 0.15,
        trompette: 0,
        accents: 1,
        speed: 0.5,
        depth: 0.3,
        dog: 0,
        rosin: 0.4,
        brightness: 0.6,
        body: 0.6,
        spin: 0.2,
      },
    },
    effects: [{ deviceId: 'late-vibrato', preset: 'Finger vibrato' }],
  },
  {
    id: 'the-drone-that-barks-wheel-on-a-parlour-disc',
    name: 'Wheel on a parlour disc',
    category: 'string',
    description:
      'Three pushes in one and a half seconds and a light bark on the first, against a tune in two, off a fast old disc with its crackle.',
    preview: FOUR,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Three barks a turn',
      params: {
        volume: -13.5,
        speed: 0.6667,
        depth: 0.5,
        dog: 0.42,
        melody: 1,
        trompette: 0.5,
        tuning: 3,
        drones: 0.4,
        spin: 0.2,
        pattern: 2,
      },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Parlour 78' }],
  },

  // A limping tune over C.
  {
    id: 'the-drone-that-barks-lame-foot-sound-foot',
    name: 'Lame foot, sound foot',
    category: 'string',
    description:
      'Four barks a turn in long and short, as the tune goes, with three faint loops of the last second and a half turning under it.',
    preview: LIMP,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Limping dance',
      params: {
        accents: 3,
        speed: 0.8333,
        depth: 0.6,
        dog: 0.8,
        trompette: 0.25,
        drones: 0.5,
        spread: 0.2,
        rosin: 0.5,
        brightness: 0.35,
        body: 0.4,
      },
    },
    effects: [{ deviceId: 'orbits', preset: 'Faint trace' }],
  },
  {
    id: 'the-drone-that-barks-nine-eighths-wide-open',
    name: 'Nine eighths, wide open',
    category: 'string',
    description:
      'A turn of nine eighths in three long and short pairs, the dog barely stirring, its top opened out to the sides.',
    preview: LIMP,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Limping dance',
      params: {
        speed: 0.5556,
        depth: 0.3,
        dog: 0.45,
        trompette: 0.6,
        tuning: 3,
        drones: 0.8,
        rosin: 0.6,
        brightness: 0.6,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'spread', preset: 'Wide top' }],
  },
  {
    id: 'the-drone-that-barks-dance-at-the-mill-pond',
    name: 'Dance at the mill pond',
    category: 'string',
    description:
      'Deep swells in long and short and no bark at all, heard from just under the surface of the water.',
    preview: LIMP,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Slow heartbeat',
      params: {
        accents: 3,
        speed: 0.8333,
        depth: 0.9,
        dog: 0,
        spin: 0.2,
        brightness: 0.55,
        body: 0.3,
        drones: 0.5,
      },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under' }],
  },
  {
    id: 'the-drone-that-barks-frost-on-the-spokes',
    name: 'Frost on the spokes',
    category: 'texture',
    description:
      'Cotton pushed in long and short, thin and hissing over octave drones, with five faint echoes scattered behind it.',
    preview: LIMP,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        accents: 3,
        pattern: 1,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.6,
        noise: 0.55,
        brightness: 0.55,
        tuning: 2,
        drones: 0.2,
        body: 0.8,
      },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points' }],
  },
  {
    id: 'the-drone-that-barks-hoof-and-half-hoof',
    name: 'Hoof and half hoof',
    category: 'string',
    description:
      'One long push and one short in a quick turn, a bark on each, over a low fifth, with a detuned copy of everything an octave up.',
    preview: LIMP,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Bright reel',
      params: {
        volume: -19,
        speed: 1.6667,
        pattern: 1,
        depth: 0.5,
        dog: 0.65,
        tuning: 3,
        brightness: 0.6,
        body: 0.9,
        rosin: 0.75,
        trompette: 0.25,
        drones: 0.8,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'octaves', preset: 'Twelve string' }],
  },
  {
    id: 'the-drone-that-barks-even-hands-uneven-feet',
    name: 'Even hands, uneven feet',
    category: 'string',
    description:
      'Six even barks to each bar of a limping tune, on bare strings in mono with a faint flanger at the sides.',
    preview: LIMP,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Mad dog',
      params: {
        volume: -10,
        accents: 4,
        speed: 0.8333,
        depth: 0.3,
        dog: 0.55,
        spread: 0,
        drones: 0.2,
        trompette: 0.4,
        rosin: 0.5,
        body: 0,
        spin: 0.2,
      },
    },
    effects: [{ deviceId: 'flanger', preset: 'Faint air' }],
  },

  // Long notes over a held D: the beating, the slow pushes.
  {
    id: 'the-drone-that-barks-a-against-its-neighbour',
    name: 'A against its neighbour',
    category: 'string',
    description:
      'No pushes: under an A the string an octave down beats with a drone five cents sharp, six times in ten seconds, on a faint plate.',
    preview: BEAT,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Beating fifth',
      params: {
        melody: 1,
        trompette: 0.9,
        drones: 0.2,
        spread: 0,
        rosin: 0.3,
        brightness: 0.35,
        body: 0.6,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },
  {
    id: 'the-drone-that-barks-bowls-along-the-beam',
    name: 'Bowls along the beam',
    category: 'drone',
    description:
      'An even wheel with its third drone nine cents sharp, and dark bowls tuned in fifths on D that ring with every note.',
    preview: BEAT,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Still wheel',
      params: {
        volume: -8,
        detune: 9,
        drones: 0.5,
        trompette: 0.6,
        rosin: 0.25,
        body: 0.4,
        brightness: 0.3,
        tangents: 0.2,
      },
    },
    effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 2 } }],
  },
  {
    id: 'the-drone-that-barks-while-the-key-is-held',
    name: 'While the key is held',
    category: 'string',
    description:
      'Four light pushes to each long note, under what a dog would need, over strings tuned to D minor that ring on for ten seconds.',
    preview: BEAT,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Even trembling',
      params: {
        volume: -18,
        speed: 0.6667,
        depth: 0.25,
        dog: 0,
        melody: 0,
        drones: 0.4,
        trompette: 0.3,
        rosin: 0.4,
        spread: 0.6,
        spin: 0.2,
        accents: 3,
      },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor wash', params: { mix: 0.45 } }],
  },
  {
    id: 'the-drone-that-barks-well-house',
    name: 'Well house',
    category: 'drone',
    description:
      'One push every second and a half, the drones rising in it and the dog giving one bark as each note changes, down in a dark well of echoes.',
    preview: BEAT,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Ten seconds a turn',
      params: {
        speed: 0.3333,
        depth: 0.7,
        dog: 0.7,
        spin: 0.2,
        brightness: 0.45,
        trompette: 0.3,
        tuning: 2,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.35 } }],
  },
  {
    id: 'the-drone-that-barks-glass-behind-the-wheel',
    name: 'Glass behind the wheel',
    category: 'pad',
    description:
      'A covered wheel with no pushes, its strongest partials redrawn as pure sines an octave up that come late and stay five seconds.',
    preview: BEAT,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Behind the wall',
      params: {
        accents: 0,
        depth: 0,
        dog: 0,
        drones: 0.5,
        brightness: 0.2,
        body: 0.5,
        spread: 0.6,
      },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.5 } }],
  },

  // Two voices on two strings.
  {
    id: 'the-drone-that-barks-pair-of-clear-voices',
    name: 'Pair of clear voices',
    category: 'string',
    description:
      'Two keys on two strings wide apart over faint octave drones, an even wheel with light rosin, in a bright chamber.',
    preview: DUO,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Two voices',
      params: {
        accents: 0,
        depth: 0,
        dog: 0,
        rosin: 0.3,
        brightness: 0.65,
        body: 0.2,
        drones: 0.25,
        trompette: 0.15,
        split: 3,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber' }],
  },
  {
    id: 'the-drone-that-barks-pair-who-stamp-in-three',
    name: 'Pair who stamp in three',
    category: 'string',
    description:
      'Two voices and three barks to each chord, once a second round, on a quarter-inch reel.',
    preview: DUO,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Two voices',
      params: {
        speed: 1,
        spin: 0.2,
        depth: 0.4,
        dog: 0.65,
        tuning: 0,
        trompette: 0.28,
        rosin: 0.5,
        split: 3,
        spread: 0.5,
        brightness: 0.45,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } }],
  },
  {
    id: 'the-drone-that-barks-pair-behind-a-curtain',
    name: 'Pair behind a curtain',
    category: 'pad',
    description:
      'Two voices with cotton on their strings over drones that hiss more than they hum, warmed by a faint fuzzed haze.',
    preview: DUO,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        melody: 2,
        noise: 0.55,
        brightness: 0.3,
        drones: 0.7,
        tuning: 3,
        spread: 0.8,
        spin: 0.4,
      },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3 } }],
  },
  {
    id: 'the-drone-that-barks-two-throats-of-wood',
    name: 'Two throats of wood',
    category: 'string',
    description:
      'Two raw voices over raw drones, a swell a second, with the colour of a hollow tube pressed on them.',
    preview: DUO,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Raw wheel',
      params: {
        melody: 2,
        accents: 1,
        speed: 0.5,
        depth: 0.5,
        dog: 0,
        rosin: 0.85,
        brightness: 0.45,
        drones: 0.4,
        trompette: 0.2,
        spin: 0.2,
      },
    },
    effects: [{ deviceId: 'imprint', preset: 'Hollow tube' }],
  },
  {
    id: 'the-drone-that-barks-bridge-lifted-away',
    name: 'Bridge lifted away',
    category: 'string',
    description:
      'The drones lifted off and the two melody strings alone, one to a key, in a body a size larger and an airy hall.',
    preview: DUO,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Only the melody',
      params: {
        melody: 2,
        split: 3,
        accents: 0,
        depth: 0,
        tangents: 0.3,
        rosin: 0.45,
        brightness: 0.5,
        spread: 1,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },

  // Wooden keys: what knocks.
  {
    id: 'the-drone-that-barks-knuckles-on-the-keybox',
    name: 'Knuckles on the keybox',
    category: 'plucked',
    description:
      'No drones and little rosin: the knock of each wooden key is as loud as its string, held by a limiter, in a room.',
    preview: KNOCK,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Wooden keys',
      params: { drones: 0, trompette: 0, rosin: 0.12, spin: 0.2, brightness: 0.4, body: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'the-drone-that-barks-knock-bark-knock',
    name: 'Knock, bark, knock',
    category: 'plucked',
    description:
      'Drones on D with a small bark on every eighth and a knock at every key: two drums and a tune, skipping away like a stone.',
    preview: KNOCK_D,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Wooden keys',
      params: {
        tangents: 0.8,
        accents: 4,
        speed: 0.8333,
        spin: 0.2,
        depth: 0.35,
        dog: 0.6,
        drones: 0.6,
        trompette: 0.4,
        brightness: 0.55,
        split: 3,
      },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Soft pebble' }],
  },
  {
    id: 'the-drone-that-barks-wheel-started-each-time',
    name: 'Wheel started each time',
    category: 'plucked',
    description:
      'A wheel that starts with each key and stops dead with it, the dog catching every start: detached notes from all five strings.',
    preview: KNOCK,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Raw wheel',
      params: {
        split: 0,
        spin: 0.05,
        accents: 0,
        depth: 0,
        dog: 0.85,
        rosin: 0.6,
        drone: 3,
        drones: 0.5,
        trompette: 0.6,
        brightness: 0.45,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body' }],
  },
  {
    id: 'the-drone-that-barks-wheel-goes-on-alone',
    name: 'Wheel goes on alone',
    category: 'keys',
    description:
      'The tune and its octave hang in the air between the keys while the wheel runs on over a second, drones off, in a two-headed tape echo.',
    preview: KNOCK,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Only the melody',
      params: {
        spin: 1.4,
        accents: 0,
        depth: 0,
        tangents: 0.4,
        rosin: 0.3,
        brightness: 0.35,
        body: 0.9,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 600 } }],
  },

  // A slow line in E phrygian.
  {
    id: 'the-drone-that-barks-second-step-leans-in',
    name: 'Second step leans in',
    category: 'string',
    description:
      'An even wheel with bright bare strings over drones on E, and what the sound has in common with a second ago kept ringing.',
    preview: CANTUS,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Still wheel',
      params: {
        drones: 0.4,
        trompette: 0.3,
        rosin: 0.6,
        brightness: 0.66,
        body: 0,
        spin: 0.4,
        spread: 0.3,
      },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Long hold' }],
  },
  {
    id: 'the-drone-that-barks-cotton-by-the-sea',
    name: 'Cotton by the sea',
    category: 'texture',
    description:
      'A whispered line with its octave down over hollow drones on E, a slow swell on its top note and on its last, and a far surf in it.',
    preview: CANTUS,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Cotton whisper',
      params: {
        melody: 1,
        accents: 1,
        speed: 0.2083,
        depth: 0.8,
        noise: 0.5,
        brightness: 0.5,
        drones: 0.8,
        trompette: 0.1,
        spin: 0.6,
      },
    },
    effects: [{ deviceId: 'weather', preset: 'Far shore' }],
  },
  {
    id: 'the-drone-that-barks-barks-under-dark-water',
    name: 'Barks under dark water',
    category: 'drone',
    description:
      'A bark on every step of a slow line from a wheel on E, smeared into a dark spectral wash that hangs behind it.',
    preview: CANTUS,
    instrument: {
      deviceId: 'wheel-and-dog',
      preset: 'Turning wheel',
      params: {
        volume: -19,
        speed: 0.8333,
        accents: 1,
        spin: 0.6,
        depth: 0.6,
        dog: 0.8,
        drones: 0.7,
        trompette: 0.4,
        body: 0.7,
        brightness: 0.4,
      },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water' }],
  },

  // Drones that stand in for the wheel's own.
  {
    id: 'the-drone-that-barks-bag-with-a-hiccup',
    name: 'Bag with a hiccup',
    category: 'drone',
    description:
      'A reedy drone of open fifths that speaks at once, gated two and a half times a second with every third gate stressed.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -4.5,
        attack: 0.05,
        release: 0.5,
        wave: 0.8,
        partials: 0.9,
        sub: 0,
        air: 0,
        movement: 0.15,
        cutoff: 1500,
        width: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Marked fours',
        params: { rate: 2.5, steps: 3, fill: 3, drift: 0, floor: 0.4, apart: 0 },
      },
    ],
  },
  {
    id: 'the-drone-that-barks-ploughed-in-fifths',
    name: 'Ploughed in fifths',
    category: 'drone',
    description:
      'Every key a fifth in saw waves with a quick attack, so a moving ground and its tune both go in fifths, opened by touch.',
    preview: GROUND,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -4,
        attack: 0.08,
        release: 0.4,
        wave: 1,
        partials: 0.35,
        sub: 0.5,
        air: 0,
        movement: 0.1,
        cutoff: 2800,
        width: 0.5,
      },
    },
    effects: [{ deviceId: 'auto-filter', preset: 'Touch wah' }],
  },
  {
    id: 'the-drone-that-barks-chanter-left-on-the-peg',
    name: 'Chanter left on the peg',
    category: 'drone',
    description:
      'A still organ of the harmonic series, only its middle band pulsed three times a second while bass and air stand.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: {
        volume: -3,
        attack: 0.3,
        release: 0.8,
        wave: 0.45,
        cutoff: 3200,
        sub: 0.2,
        width: 0.1,
        air: 0.2,
      },
    },
    effects: [{ deviceId: 'band-pulse', preset: 'Three a second' }],
  },
  {
    id: 'the-drone-that-barks-cellar-under-the-dance',
    name: 'Cellar under the dance',
    category: 'drone',
    description:
      'Deep octaves with a strong sub under A, barely moving, pressed together by a hot transformer.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { attack: 0.8, release: 1.5, movement: 0.1, wave: 0.9, cutoff: 420, width: 0.1 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'the-drone-that-barks-wind-through-the-spokes',
    name: 'Wind through the spokes',
    category: 'texture',
    description:
      'No partials, only air tuned to the key, swaying once in two seconds, with the gusts of a whistling gap laid over it.',
    preview: CANTUS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { attack: 0.15, release: 1.5, rate: 0.5, movement: 1, cutoff: 5000, width: 0.6 },
    },
    effects: [{ deviceId: 'weather', preset: 'Whistling gap' }],
  },
  {
    id: 'the-drone-that-barks-second-hung-on-a-nail',
    name: 'Second hung on a nail',
    category: 'drone',
    description:
      'A suspended second in a few soft partials, each band breaking over it like a wave on its own slow cycle.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: {
        volume: -5,
        attack: 0.6,
        release: 2,
        sub: 0,
        partials: 0.6,
        wave: 0.5,
        air: 0.05,
        cutoff: 5000,
        movement: 0.2,
      },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves' }],
  },
  {
    id: 'the-drone-that-barks-one-post-no-shadow',
    name: 'One post, no shadow',
    category: 'drone',
    description:
      'A standing harmonic series dead in the centre with nothing moving in it, through a warm speaker stack.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: { attack: 0.4, release: 0.6, wave: 0.9, cutoff: 2200, sub: 0, partials: 1 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'the-drone-that-barks-swallows-over-the-barn',
    name: 'Swallows over the barn',
    category: 'pad',
    description:
      'Bright octaves that flutter fast, under a slow tune, turned round the listener on a figure of eight.',
    preview: BEAT,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: {
        volume: -6,
        attack: 0.2,
        release: 1.2,
        rate: 2,
        movement: 1,
        sub: 0.3,
        air: 0,
        cutoff: 7000,
      },
    },
    effects: [{ deviceId: 'around', preset: 'Slow eight' }],
  },

  // One held note that picks a tune out of itself.
  {
    id: 'the-drone-that-barks-iron-held-in-the-teeth',
    name: 'Iron held in the teeth',
    category: 'plucked',
    description:
      'A reed held in the mouth, stepping through its overtones five times a second with no vibrato, with a little dripping spring.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: { pace: 5, overtone: 7, focus: 0.8, wander: 1, growl: 0.3, width: 0.2 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.2 } }],
  },
  {
    id: 'the-drone-that-barks-bourdon-in-the-pasture',
    name: 'Bourdon in the pasture',
    category: 'wind',
    description:
      'A rough drone pipe on its third overtone that hardly wanders, in the open air some way off.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        overtone: 3,
        growl: 0.7,
        wander: 0.1,
        focus: 0.3,
        breath: 0.35,
        attack: 0.1,
        release: 0.6,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air' }],
  },
  {
    id: 'the-drone-that-barks-reed-knee-and-elbow',
    name: 'Reed, knee and elbow',
    category: 'drone',
    description:
      'A growling reed drone whose overtones move twice in five seconds, with organ octaves added under and over it.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: {
        overtone: 5,
        pace: 0.4,
        wander: 0.8,
        growl: 0.5,
        focus: 0.85,
        attack: 0.15,
        release: 0.8,
        breath: 0,
      },
    },
    effects: [{ deviceId: 'octaves', preset: 'Organ' }],
  },
  {
    id: 'the-drone-that-barks-hound-under-the-table',
    name: 'Hound under the table',
    category: 'voice',
    description:
      'A low throat that growls as hard as it can on its fourth harmonic, chopped by a tremolo at four and a half a second.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: {
        volume: -5.5,
        overtone: 4,
        growl: 1,
        wander: 0.6,
        pace: 0.8,
        focus: 0.35,
        vibrato: 0,
        attack: 0.08,
        width: 0.1,
      },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.75 } }],
  },
  {
    id: 'the-drone-that-barks-whistled-from-the-wheel',
    name: 'Whistled from the wheel',
    category: 'voice',
    description:
      'A breathy pipe whose fifth overtone floats over each note of a slow line, its attacks in a mist and its overtones raised a little.',
    preview: CANTUS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: {
        volume: -10,
        overtone: 5,
        focus: 0.75,
        breath: 0.45,
        wander: 0.15,
        attack: 0.08,
        release: 0.5,
        width: 1,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.4 } },
    ],
  },
  {
    id: 'the-drone-that-barks-lips-on-a-cow-horn',
    name: 'Lips on a cow horn',
    category: 'wind',
    description:
      'Buzzing lips with a quick attack and no vibrato: the limping tune alone, on a horn in a clay pot.',
    preview: HORN,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: { overtone: 5, focus: 0.15, growl: 0.8, breath: 0.1, release: 0.15, width: 0 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot' }],
  },

  // Bowed and plucked strings at the same dances.
  {
    id: 'the-drone-that-barks-fiddle-by-the-door',
    name: 'Fiddle by the door',
    category: 'string',
    description:
      'A hard bow near the bridge with a quick attack, raspy and nearly straight, over its own open D, in a wooden soundboard.',
    preview: FIDDLE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.06,
        release: 0.25,
        vibrato: 0.05,
        brightness: 0.6,
        position: 0.07,
        pressure: 0.8,
        body: 0.7,
      },
    },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4 } }],
  },
  {
    id: 'the-drone-that-barks-knee-fiddles-two-by-two',
    name: 'Knee fiddles, two by two',
    category: 'string',
    description:
      'Dark bowed strings in two voices over a held D, the bow slow to bite, under a tape echo of three heads.',
    preview: DUO,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.25,
        release: 0.5,
        brightness: 0.2,
        body: 1,
        vibrato: 0.1,
        position: 0.2,
        pressure: 0.35,
        detune: 8,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { time: 500, mix: 0.25 } }],
  },
  {
    id: 'the-drone-that-barks-gut-plucked-with-a-limp',
    name: 'Gut plucked with a limp',
    category: 'plucked',
    description:
      'A damped gut string plucked near its middle, its body turned up full, skipping twice like a stone, its peaks held.',
    preview: LIMP,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -5.5, decay: 2.2, brightness: 0.25, position: 0.35, release: 0.5, body: 1 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Two skips' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'the-drone-that-barks-bow-that-barely-lands',
    name: 'Bow that barely lands',
    category: 'string',
    description:
      'A bow with no pressure far from the bridge, slow in and slow out, on a phrygian line lit by glints an octave and more above.',
    preview: CANTUS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: {
        attack: 0.35,
        release: 1.2,
        brightness: 0.35,
        vibrato: 0,
        position: 0.5,
        detune: 14,
        body: 0,
      },
    },
    effects: [{ deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.3 } }],
  },
  {
    id: 'the-drone-that-barks-village-band-in-a-row',
    name: 'Village band in a row',
    category: 'string',
    description:
      'A detuned row of bowed strings on a moving ground, quick to speak and bright, crushed by an early sampler.',
    preview: GROUND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: {
        attack: 0.2,
        release: 0.4,
        vibrato: 0.2,
        brightness: 0.8,
        position: 0.1,
        pressure: 0.6,
        body: 0.5,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Early sampler' }],
  },
  {
    id: 'the-drone-that-barks-string-that-feeds-itself',
    name: 'String that feeds itself',
    category: 'string',
    description:
      'A string held singing by a hard sustainer, wide and mellow, four slow notes whose levels a slow hand evens out.',
    preview: BEAT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: {
        attack: 0.3,
        release: 1,
        brightness: 0.45,
        position: 0.2,
        pressure: 1,
        vibrato: 0,
        detune: 20,
        body: 0.9,
        decay: 20,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },

  // Plucked drones that go round.
  {
    id: 'the-drone-that-barks-four-wires-quick-round',
    name: 'Four wires, quick round',
    category: 'drone',
    description:
      'Four plucked drone strings gone round in two seconds and quickly damped, buzzing hard, driven flat by a limiter.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Fast buzzing round',
      params: { decay: 3.5, body: 0.5, spread: 0.2, detune: 5 },
    },
    effects: [{ deviceId: 'fet-limiter', preset: 'Squash' }],
  },
  {
    id: 'the-drone-that-barks-fourth-hung-in-the-loft',
    name: 'Fourth hung in the loft',
    category: 'drone',
    description:
      'Plucked drones with a fourth in them, a half-open buzz and a boxy body, copied a little sharp and flat to the sides.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { volume: 2, jawari: 0.6, speed: 3, decay: 6, body: 0.9, spread: 0.1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'the-drone-that-barks-gourd-with-a-wasp-in-it',
    name: 'Gourd with a wasp in it',
    category: 'drone',
    description:
      'A narrow gourd drone with its bridge wide open, its buzz thickened by a parallel grit of valves.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { jawari: 1, speed: 3.5, decay: 30, body: 0.2 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Parallel grit' }],
  },
  {
    id: 'the-drone-that-barks-thread-off-the-bridge',
    name: 'Thread off the bridge',
    category: 'plucked',
    description:
      'No buzz at all: four plain strings plucked every three quarters of a second, dark, in a reverse swell of their own echo.',
    preview: PEDAL_A,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { volume: -2, decay: 10, body: 0.6, detune: 7, spread: 0.4 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'the-drone-that-barks-seventh-on-the-wire',
    name: 'Seventh on the wire',
    category: 'drone',
    description:
      'Drone strings with a seventh among them, wide and with little body, their gleam caught in small fast tremolos on top.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bright Ni shimmer',
      params: { volume: -1, speed: 2.2, decay: 14, jawari: 0.8 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'the-drone-that-barks-cart-on-a-long-road',
    name: 'Cart on a long road',
    category: 'drone',
    description:
      'A dark round of four strings that beat by eight cents, heard through slow deep swaying water.',
    preview: PEDAL_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Dark slow Ni',
      params: {
        volume: -0.5,
        tuning: 0,
        speed: 5,
        detune: 8,
        decay: 20,
        body: 1,
        jawari: 0.35,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'underwater', preset: 'Slow swell' }],
  },

  // The pipe's tune.
  {
    id: 'the-drone-that-barks-goatherd-on-the-wall',
    name: 'Goatherd on the wall',
    category: 'wind',
    description:
      'A wooden flute with a hard chiff and a slide into each note, no vibrato, answered by one slap off stone.',
    preview: PIPE,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        chiff: 1,
        scoop: 70,
        vibrato: 0,
        breath: 0.15,
        release: 0.12,
        attack: 0.01,
        blow: 0.7,
      },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { preDelay: 120, mix: 0.3 } },
    ],
  },
  {
    id: 'the-drone-that-barks-six-holes-and-a-thumb',
    name: 'Six holes and a thumb',
    category: 'wind',
    description:
      'A soft plain recorder with no vibrato with a pipe a fifth above and another an octave below on every note.',
    preview: PIPE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.03, chiff: 0.6, blow: 0.2, release: 0.1 },
    },
    effects: [{ deviceId: 'stops', preset: 'Open fifths' }],
  },
  {
    id: 'the-drone-that-barks-reeds-cut-by-the-pond',
    name: 'Reeds cut by the pond',
    category: 'wind',
    description:
      'Pan pipes blown hard with a lot of breath, on a fluttering tape with the top left bright.',
    preview: PIPE,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { blow: 0.85, breath: 0.8, chiff: 0.4, release: 0.2, scoop: 0 },
    },
    effects: [{ deviceId: 'tape', preset: 'Flutter shimmer' }],
  },
  {
    id: 'the-drone-that-barks-low-bore-at-evening',
    name: 'Low bore at evening',
    category: 'wind',
    description:
      'A low flute overblown to its edge with a broad vibrato, on slow notes, with dark moments of its playing drifting back.',
    preview: 'line',
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: {
        breath: 0.2,
        blow: 1,
        chiff: 0.2,
        attack: 0.2,
        vibrato: 1,
        scoop: 50,
        release: 0.6,
      },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.3 } }],
  },
  {
    id: 'the-drone-that-barks-bent-reed-round-of-two',
    name: 'Bent reed, round of two',
    category: 'wind',
    description:
      'A blown bamboo flute that bends up into every note, followed two bars later and then again by a copy of itself.',
    preview: PIPE,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { breath: 0.5, blow: 0.5, scoop: 110, release: 0.3, chiff: 0.3, vibrato: 0.3 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Endless round',
        params: { followers: 1, gap: 2.4, round: 0.5, mix: 0.35 },
      },
    ],
  },

  // The bass under the dance in three.
  {
    id: 'the-drone-that-barks-bass-in-a-barrel',
    name: 'Bass in a barrel',
    category: 'bass',
    description:
      'An upright bass plucked softly near its middle, left to ring, inside a large drum skin.',
    preview: BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { tone: 0.3, resonance: 0.6, sustain: 4, release: 0.25, mute: 0, growl: 0.1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.4 } }],
  },
  {
    id: 'the-drone-that-barks-slap-on-the-loose-board',
    name: 'Slap on the loose board',
    category: 'bass',
    description:
      'An upright pulled off the board near the bridge so it slaps and rattles, through a saturated tube and flattened by a limiter.',
    preview: BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: {
        volume: 4,
        touch: 0.9,
        tone: 0.8,
        position: 0.07,
        sustain: 5,
        release: 0.1,
        resonance: 0.6,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },
  {
    id: 'the-drone-that-barks-buzz-without-a-fret',
    name: 'Buzz without a fret',
    category: 'bass',
    description:
      'A fretless bass growling all it can, its string long, with a copy an octave up laid softly on it and slow chorus.',
    preview: BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { volume: -2.5, touch: 0.3, position: 0.3, tone: 0.5, sustain: 14, release: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.4 } },
      { deviceId: 'chorus', preset: 'Vocal thickener' },
    ],
  },
  {
    id: 'the-drone-that-barks-trot-on-muted-strings',
    name: 'Trot on muted strings',
    category: 'bass',
    description:
      'A muted pick close to the bridge, short, opened by a wah on each touch and limited, with dark echoes a beat apart.',
    preview: BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: {
        volume: 2.5,
        mute: 0.3,
        position: 0.1,
        tone: 0.7,
        touch: 0.75,
        growl: 0,
        release: 0.12,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 400, mix: 0.2 } },
    ],
  },
  {
    id: 'the-drone-that-barks-bass-with-a-drone-inside',
    name: 'Bass with a drone inside',
    category: 'bass',
    description:
      'A thumbed electric bass left to ring, with four strings tuned to D minor that answer each note from the centre.',
    preview: BASS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { sustain: 20, release: 1.5, tone: 0.2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Centre drone',
        params: { root: 2, mix: 0.45, sympathy: 0.6 },
      },
    ],
  },
]
