import { type FactoryPreset, type Phrase } from '../types'

// Eight grounds, each four bars of three, and the layers that can be laid on them, from the bare
// bass through held thirds, quarters, eighths and a countermelody to a descant. Each preset is one
// layer: the basses walk from dry to ringing, the bows from a low drone to a high veil, the plucked
// and struck ones from bare strings to a whole chapel.

// The lament ground, A G F E, alone: one note to a bar of three.
const LAMENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 45, gain: 0.65 },
    { atSec: 1.5, durSec: 1.48, note: 43, gain: 0.65 },
    { atSec: 3, durSec: 1.48, note: 41, gain: 0.65 },
    { atSec: 4.5, durSec: 1.48, note: 40, gain: 0.65 },
  ],
}
// The ground that steps down D C B A, alone and low.
const STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 38, gain: 0.65 },
    { atSec: 1.5, durSec: 1.48, note: 36, gain: 0.65 },
    { atSec: 3, durSec: 1.48, note: 35, gain: 0.65 },
    { atSec: 4.5, durSec: 1.48, note: 33, gain: 0.65 },
  ],
}
// The Phrygian descent E D C B, alone.
const PHRYGIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 40, gain: 0.65 },
    { atSec: 1.5, durSec: 1.48, note: 38, gain: 0.65 },
    { atSec: 3, durSec: 1.48, note: 36, gain: 0.65 },
    { atSec: 4.5, durSec: 1.48, note: 35, gain: 0.65 },
  ],
}
// The ground of wide steps, C G A F, alone.
const WIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 36, gain: 0.65 },
    { atSec: 1.5, durSec: 1.48, note: 43, gain: 0.65 },
    { atSec: 3, durSec: 1.48, note: 45, gain: 0.65 },
    { atSec: 4.5, durSec: 1.48, note: 41, gain: 0.65 },
  ],
}
// Divisions on C B A G: each bar a third up and a step back, in quarters, and the last note
// held.
const DIVISIONS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 48, gain: 0.6 },
    { atSec: 0.5, durSec: 0.48, note: 52, gain: 0.45 },
    { atSec: 1, durSec: 0.48, note: 50, gain: 0.45 },
    { atSec: 1.5, durSec: 0.48, note: 47, gain: 0.6 },
    { atSec: 2, durSec: 0.48, note: 50, gain: 0.45 },
    { atSec: 2.5, durSec: 0.48, note: 48, gain: 0.45 },
    { atSec: 3, durSec: 0.48, note: 45, gain: 0.6 },
    { atSec: 3.5, durSec: 0.48, note: 48, gain: 0.45 },
    { atSec: 4, durSec: 0.48, note: 47, gain: 0.45 },
    { atSec: 4.5, durSec: 1.48, note: 43, gain: 0.6 },
  ],
}
// Third and fifth held over A G F E: the fifth comes late, a sixth held over the bar that
// falls to it.
const HELD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 45, gain: 0.45 },
    { atSec: 0, durSec: 1.48, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 2.48, note: 64, gain: 0.4 },
    { atSec: 1.5, durSec: 1.48, note: 43, gain: 0.45 },
    { atSec: 1.5, durSec: 1.48, note: 59, gain: 0.4 },
    { atSec: 2.5, durSec: 1.48, note: 62, gain: 0.4 },
    { atSec: 3, durSec: 1.48, note: 41, gain: 0.45 },
    { atSec: 3, durSec: 1.48, note: 57, gain: 0.4 },
    { atSec: 4, durSec: 1.48, note: 60, gain: 0.4 },
    { atSec: 4.5, durSec: 1.98, note: 40, gain: 0.45 },
    { atSec: 4.5, durSec: 1.98, note: 55, gain: 0.4 },
    { atSec: 5.5, durSec: 0.98, note: 59, gain: 0.4 },
  ],
}
// A ground that climbs, G A B C, with G, Am, G over B and C: the upper voices fall away from it
// in the second bar and the top comes back in the third.
const RISE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.63, note: 43, gain: 0.45 },
    { atSec: 0, durSec: 1.63, note: 59, gain: 0.36 },
    { atSec: 0, durSec: 1.63, note: 62, gain: 0.36 },
    { atSec: 0, durSec: 1.63, note: 67, gain: 0.36 },
    { atSec: 1.65, durSec: 1.63, note: 45, gain: 0.45 },
    { atSec: 1.65, durSec: 1.63, note: 57, gain: 0.36 },
    { atSec: 1.65, durSec: 1.63, note: 60, gain: 0.36 },
    { atSec: 1.65, durSec: 1.63, note: 64, gain: 0.36 },
    { atSec: 3.3, durSec: 1.63, note: 47, gain: 0.45 },
    { atSec: 3.3, durSec: 1.63, note: 55, gain: 0.36 },
    { atSec: 3.3, durSec: 1.63, note: 62, gain: 0.36 },
    { atSec: 3.3, durSec: 1.63, note: 67, gain: 0.36 },
    { atSec: 4.95, durSec: 1.63, note: 48, gain: 0.45 },
    { atSec: 4.95, durSec: 1.63, note: 55, gain: 0.36 },
    { atSec: 4.95, durSec: 1.63, note: 64, gain: 0.36 },
    { atSec: 4.95, durSec: 1.63, note: 67, gain: 0.36 },
  ],
}
// Dm, C, G over B, Am on D C B A, the top rising or holding, F G G A, as the ground falls.
const WEDGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 50, gain: 0.45 },
    { atSec: 0, durSec: 1.48, note: 57, gain: 0.36 },
    { atSec: 0, durSec: 1.48, note: 62, gain: 0.36 },
    { atSec: 0, durSec: 1.48, note: 65, gain: 0.36 },
    { atSec: 1.5, durSec: 1.48, note: 48, gain: 0.45 },
    { atSec: 1.5, durSec: 1.48, note: 60, gain: 0.36 },
    { atSec: 1.5, durSec: 1.48, note: 64, gain: 0.36 },
    { atSec: 1.5, durSec: 1.48, note: 67, gain: 0.36 },
    { atSec: 3, durSec: 1.48, note: 47, gain: 0.45 },
    { atSec: 3, durSec: 1.48, note: 55, gain: 0.36 },
    { atSec: 3, durSec: 1.48, note: 62, gain: 0.36 },
    { atSec: 3, durSec: 1.48, note: 67, gain: 0.36 },
    { atSec: 4.5, durSec: 1.48, note: 45, gain: 0.45 },
    { atSec: 4.5, durSec: 1.48, note: 52, gain: 0.36 },
    { atSec: 4.5, durSec: 1.48, note: 60, gain: 0.36 },
    { atSec: 4.5, durSec: 1.48, note: 69, gain: 0.36 },
  ],
}
// F, C over E, Dm, C on the ground F E D C: the bass on one, the chord on two and held, as a
// sarabande leans.
const SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.48, note: 41, gain: 0.55 },
    { atSec: 0.5, durSec: 0.98, note: 57, gain: 0.4 },
    { atSec: 0.5, durSec: 0.98, note: 60, gain: 0.4 },
    { atSec: 0.5, durSec: 0.98, note: 65, gain: 0.4 },
    { atSec: 1.5, durSec: 1.48, note: 40, gain: 0.55 },
    { atSec: 2, durSec: 0.98, note: 55, gain: 0.4 },
    { atSec: 2, durSec: 0.98, note: 60, gain: 0.4 },
    { atSec: 2, durSec: 0.98, note: 67, gain: 0.4 },
    { atSec: 3, durSec: 1.48, note: 38, gain: 0.55 },
    { atSec: 3.5, durSec: 0.98, note: 57, gain: 0.4 },
    { atSec: 3.5, durSec: 0.98, note: 62, gain: 0.4 },
    { atSec: 3.5, durSec: 0.98, note: 65, gain: 0.4 },
    { atSec: 4.5, durSec: 1.48, note: 36, gain: 0.55 },
    { atSec: 5, durSec: 0.98, note: 60, gain: 0.4 },
    { atSec: 5, durSec: 0.98, note: 64, gain: 0.4 },
    { atSec: 5, durSec: 0.98, note: 67, gain: 0.4 },
  ],
}
// Quarter-note arpeggios, Am Em F G, over A E F G.
const QUARTERS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 1.48, note: 45, gain: 0.5 },
    { atSec: 0.5, durSec: 0.48, note: 69, gain: 0.45 },
    { atSec: 1, durSec: 0.48, note: 72, gain: 0.45 },
    { atSec: 1.5, durSec: 0.48, note: 64, gain: 0.45 },
    { atSec: 1.5, durSec: 1.48, note: 40, gain: 0.5 },
    { atSec: 2, durSec: 0.48, note: 67, gain: 0.45 },
    { atSec: 2.5, durSec: 0.48, note: 71, gain: 0.45 },
    { atSec: 3, durSec: 0.48, note: 60, gain: 0.45 },
    { atSec: 3, durSec: 1.48, note: 41, gain: 0.5 },
    { atSec: 3.5, durSec: 0.48, note: 65, gain: 0.45 },
    { atSec: 4, durSec: 0.48, note: 69, gain: 0.45 },
    { atSec: 4.5, durSec: 0.48, note: 59, gain: 0.45 },
    { atSec: 4.5, durSec: 1.48, note: 43, gain: 0.5 },
    { atSec: 5, durSec: 0.48, note: 62, gain: 0.45 },
    { atSec: 5.5, durSec: 0.48, note: 67, gain: 0.45 },
  ],
}
// Eighth notes, C G Am F, over C G A F.
const EIGHTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.23, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 1.48, note: 48, gain: 0.5 },
    { atSec: 0.25, durSec: 0.23, note: 67, gain: 0.34 },
    { atSec: 0.5, durSec: 0.23, note: 72, gain: 0.42 },
    { atSec: 0.75, durSec: 0.23, note: 67, gain: 0.34 },
    { atSec: 1, durSec: 0.23, note: 72, gain: 0.42 },
    { atSec: 1.25, durSec: 0.23, note: 67, gain: 0.34 },
    { atSec: 1.5, durSec: 0.23, note: 62, gain: 0.42 },
    { atSec: 1.5, durSec: 1.48, note: 43, gain: 0.5 },
    { atSec: 1.75, durSec: 0.23, note: 67, gain: 0.34 },
    { atSec: 2, durSec: 0.23, note: 71, gain: 0.42 },
    { atSec: 2.25, durSec: 0.23, note: 67, gain: 0.34 },
    { atSec: 2.5, durSec: 0.23, note: 71, gain: 0.42 },
    { atSec: 2.75, durSec: 0.23, note: 67, gain: 0.34 },
    { atSec: 3, durSec: 0.23, note: 60, gain: 0.42 },
    { atSec: 3, durSec: 1.48, note: 45, gain: 0.5 },
    { atSec: 3.25, durSec: 0.23, note: 64, gain: 0.34 },
    { atSec: 3.5, durSec: 0.23, note: 69, gain: 0.42 },
    { atSec: 3.75, durSec: 0.23, note: 64, gain: 0.34 },
    { atSec: 4, durSec: 0.23, note: 69, gain: 0.42 },
    { atSec: 4.25, durSec: 0.23, note: 64, gain: 0.34 },
    { atSec: 4.5, durSec: 0.23, note: 60, gain: 0.42 },
    { atSec: 4.5, durSec: 1.48, note: 41, gain: 0.5 },
    { atSec: 4.75, durSec: 0.23, note: 65, gain: 0.34 },
    { atSec: 5, durSec: 0.23, note: 69, gain: 0.42 },
    { atSec: 5.25, durSec: 0.23, note: 65, gain: 0.34 },
    { atSec: 5.5, durSec: 0.23, note: 69, gain: 0.42 },
    { atSec: 5.75, durSec: 0.23, note: 65, gain: 0.34 },
  ],
}
// A countermelody over E D C B (Em, G over D, C, G over B): third, fifth, a step down, and
// home to a third.
const COUNTER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.98, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 1.48, note: 40, gain: 0.45 },
    { atSec: 1, durSec: 0.98, note: 59, gain: 0.5 },
    { atSec: 1.5, durSec: 1.48, note: 38, gain: 0.45 },
    { atSec: 2, durSec: 0.48, note: 57, gain: 0.48 },
    { atSec: 2.5, durSec: 0.48, note: 55, gain: 0.48 },
    { atSec: 3, durSec: 0.98, note: 52, gain: 0.5 },
    { atSec: 3, durSec: 1.48, note: 36, gain: 0.45 },
    { atSec: 4, durSec: 0.48, note: 55, gain: 0.5 },
    { atSec: 4.5, durSec: 1.48, note: 35, gain: 0.45 },
    { atSec: 4.5, durSec: 1.48, note: 50, gain: 0.5 },
  ],
}
// The descant over A G F E: a ninth that falls to the octave in the second bar, a fourth that
// falls to the third in the last.
const DESCANT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 76, gain: 0.45 },
    { atSec: 0, durSec: 1.48, note: 57, gain: 0.3 },
    { atSec: 0.5, durSec: 1.48, note: 81, gain: 0.45 },
    { atSec: 1.5, durSec: 1.48, note: 55, gain: 0.3 },
    { atSec: 2, durSec: 0.48, note: 79, gain: 0.42 },
    { atSec: 2.5, durSec: 0.48, note: 83, gain: 0.45 },
    { atSec: 3, durSec: 0.98, note: 84, gain: 0.48 },
    { atSec: 3, durSec: 1.48, note: 53, gain: 0.3 },
    { atSec: 4, durSec: 0.98, note: 81, gain: 0.42 },
    { atSec: 4.5, durSec: 1.48, note: 52, gain: 0.3 },
    { atSec: 5, durSec: 0.98, note: 79, gain: 0.42 },
  ],
}
// The whole weight on A G F E: ground, countermelody, quarters and descant at once.
const WHOLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.48, note: 60, gain: 0.34 },
    { atSec: 0, durSec: 0.48, note: 69, gain: 0.28 },
    { atSec: 0, durSec: 0.48, note: 76, gain: 0.35 },
    { atSec: 0, durSec: 1.48, note: 45, gain: 0.45 },
    { atSec: 0.5, durSec: 0.48, note: 62, gain: 0.34 },
    { atSec: 0.5, durSec: 0.48, note: 72, gain: 0.28 },
    { atSec: 0.5, durSec: 1.48, note: 81, gain: 0.35 },
    { atSec: 1, durSec: 0.48, note: 76, gain: 0.28 },
    { atSec: 1, durSec: 1.48, note: 64, gain: 0.36 },
    { atSec: 1.5, durSec: 0.48, note: 71, gain: 0.28 },
    { atSec: 1.5, durSec: 1.48, note: 43, gain: 0.45 },
    { atSec: 2, durSec: 0.48, note: 67, gain: 0.28 },
    { atSec: 2, durSec: 0.48, note: 79, gain: 0.32 },
    { atSec: 2.5, durSec: 0.48, note: 74, gain: 0.28 },
    { atSec: 2.5, durSec: 0.48, note: 83, gain: 0.35 },
    { atSec: 2.5, durSec: 1.48, note: 62, gain: 0.36 },
    { atSec: 3, durSec: 0.48, note: 69, gain: 0.28 },
    { atSec: 3, durSec: 0.98, note: 84, gain: 0.38 },
    { atSec: 3, durSec: 1.48, note: 41, gain: 0.45 },
    { atSec: 3.5, durSec: 0.48, note: 77, gain: 0.28 },
    { atSec: 4, durSec: 0.48, note: 72, gain: 0.28 },
    { atSec: 4, durSec: 0.98, note: 60, gain: 0.36 },
    { atSec: 4, durSec: 0.98, note: 81, gain: 0.32 },
    { atSec: 4.5, durSec: 0.48, note: 76, gain: 0.28 },
    { atSec: 4.5, durSec: 1.48, note: 40, gain: 0.45 },
    { atSec: 5, durSec: 0.48, note: 67, gain: 0.28 },
    { atSec: 5, durSec: 0.98, note: 59, gain: 0.34 },
    { atSec: 5, durSec: 0.98, note: 79, gain: 0.32 },
    { atSec: 5.5, durSec: 0.48, note: 71, gain: 0.28 },
  ],
}

// The layers laid on one by one: the ground alone, then a third and fifth, then quarters, then
// eighths under a descant, a layer to the bar over A G F E, and home to A.
const GROWS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 45, gain: 0.55 },
    { atSec: 1.32, durSec: 1.3, note: 43, gain: 0.55 },
    { atSec: 1.32, durSec: 1.3, note: 59, gain: 0.36 },
    { atSec: 1.32, durSec: 1.74, note: 62, gain: 0.36 },
    { atSec: 2.64, durSec: 0.42, note: 69, gain: 0.32 },
    { atSec: 2.64, durSec: 1.3, note: 41, gain: 0.55 },
    { atSec: 2.64, durSec: 1.3, note: 57, gain: 0.36 },
    { atSec: 3.08, durSec: 0.42, note: 72, gain: 0.32 },
    { atSec: 3.08, durSec: 1.3, note: 60, gain: 0.36 },
    { atSec: 3.52, durSec: 0.42, note: 77, gain: 0.32 },
    { atSec: 3.52, durSec: 0.86, note: 81, gain: 0.4 },
    { atSec: 3.96, durSec: 0.2, note: 76, gain: 0.28 },
    { atSec: 3.96, durSec: 1.3, note: 40, gain: 0.55 },
    { atSec: 3.96, durSec: 1.3, note: 52, gain: 0.36 },
    { atSec: 4.18, durSec: 0.2, note: 67, gain: 0.28 },
    { atSec: 4.4, durSec: 0.2, note: 76, gain: 0.28 },
    { atSec: 4.4, durSec: 0.86, note: 59, gain: 0.36 },
    { atSec: 4.4, durSec: 0.86, note: 79, gain: 0.4 },
    { atSec: 4.62, durSec: 0.2, note: 71, gain: 0.28 },
    { atSec: 4.84, durSec: 0.2, note: 67, gain: 0.28 },
    { atSec: 5.06, durSec: 0.2, note: 71, gain: 0.28 },
    { atSec: 5.28, durSec: 1.3, note: 45, gain: 0.5 },
    { atSec: 5.28, durSec: 1.3, note: 52, gain: 0.34 },
    { atSec: 5.28, durSec: 1.3, note: 60, gain: 0.34 },
    { atSec: 5.28, durSec: 1.3, note: 76, gain: 0.4 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // The ground alone: plucked basses, from a dry thud to a bass that hangs over the next bar.
  {
    id: 'passacaglia-layers-ground-laid-bare',
    name: 'Ground laid bare',
    category: 'bass',
    description:
      'An upright bass plucked softly with little ring, its lows and its top trimmed and a tight room put behind it.',
    preview: LAMENT,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 6, sustain: 2, resonance: 0.3, tone: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 55, clear: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'passacaglia-layers-first-of-eight-turns',
    name: 'First of eight turns',
    category: 'bass',
    description:
      'A dark soft upright on warm tape, the lowest strings swelling the tape head and everything above them rolled off.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { sustain: 7, release: 0.6, mute: 0 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0.05, tone: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'passacaglia-layers-two-bars-behind',
    name: 'Two bars behind',
    category: 'bass',
    description:
      'A bass near the bridge answered two bars later an octave up, so a falling ground meets itself in tenths at two beats a second.',
    preview: LAMENT,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { volume: 2, tone: 0.55, sustain: 4 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Octave shadow',
        params: {
          followers: 1,
          gap: 3,
          interval1: 12,
          crab: 0,
          fade: 0.1,
          round: 0,
          tone: 5000,
          mix: 0.45,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'passacaglia-layers-cellars-under-it',
    name: 'Cellars under it',
    category: 'bass',
    description:
      'A thumbed electric bass with a copy an octave down, both closed behind a low-pass so only the floor of the note is left.',
    preview: WIDE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { sustain: 12, release: 0.8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.9 } },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { type: 0, slope: 1, cutoffHz: 260, resonance: 0.7 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-bass-at-the-nave-end',
    name: 'Bass at the nave end',
    category: 'bass',
    description:
      'An upright heard from the far end of a long stone room: late, dark, narrow, and more room than string.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: 4, sustain: 9, touch: 0.45 },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Stone stairwell',
        params: { distance: 0.75, room: 0.85, decay: 4, wander: 0 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-ground-swelled-in',
    name: 'Ground swelled in',
    category: 'bass',
    description:
      'A fretless with its pluck taken off, each note faded in over a third of a second and left in a dark hall.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -2, sustain: 14, growl: 0.5, release: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 330 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'passacaglia-layers-divisions-on-gut',
    name: 'Divisions on gut',
    category: 'bass',
    description:
      'A damped pick for running quarters, warmed by a tape preamp and answered once at half a second.',
    preview: DIVISIONS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { volume: 1.5, mute: 0.55, tone: 0.4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      {
        deviceId: 'tape-echo',
        preset: 'Single slap',
        params: { time: 500, feedback: 0, mix: 0.25 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-strings-grown-from-it',
    name: 'Strings grown from it',
    category: 'bass',
    description:
      'A thumbed bass that calls up a dull string section behind each note, swelling over a second and lingering into the next bar.',
    preview: LAMENT,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { volume: 6, tone: 0.25, sustain: 5 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { octaves: 0.4, rise: 0.9, brightness: 1600, mix: 0.7, lowCut: 90 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-weight-on-the-second',
    name: 'Weight on the second',
    category: 'bass',
    description:
      'A slapped upright with all its rattle, held under a ceiling, with a bucket-brigade repeat half a second on, where the second beat falls.',
    preview: WIDE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { touch: 0.8, sustain: 3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.15, mix: 0.45 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 15 } },
    ],
  },
  {
    id: 'passacaglia-layers-wire-ground-turning',
    name: 'Wire ground turning',
    category: 'bass',
    description:
      'A picked bass with its lows cut to bare wire, through a fast horn and drum heard from across the room.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { volume: 0.5, sustain: 8, touch: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 150, low: -5, highCut: 14000 } },
      { deviceId: 'rotary', preset: 'Across the room', params: { speed: 1, hornDepth: 0.8 } },
    ],
  },
  {
    id: 'passacaglia-layers-ground-worn-on-shellac',
    name: 'Ground worn on shellac',
    category: 'bass',
    description:
      'A dark flat-wound bass cut to a fast old record: a narrowed band, a light crackle and a soft hiss that swishes as it turns.',
    preview: LAMENT,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { tone: 0.5, sustain: 4 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Parlour 78',
        params: { pops: 0.05, crackle: 0.15, surface: 0.15 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'passacaglia-layers-open-strings-answering',
    name: 'Open strings answering',
    category: 'bass',
    description:
      'An upright over twelve tuned strings in A minor that ring on with each note of the ground and blur its bars together.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { volume: 2, tone: 0.7, sustain: 5, touch: 0.4 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { root: 9, mode: 1, decay: 8, mix: 0.6, strings: 8, sympathy: 0.7 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-ground-without-a-pluck',
    name: 'Ground without a pluck',
    category: 'bass',
    description:
      'A fretless whose attacks are dissolved in a cloud of no tail and whose tone is then thickened by a slow chorus.',
    preview: WIDE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: 3.5, tone: 0.6, position: 0.2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { mix: 1 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'passacaglia-layers-bass-with-a-fifteenth',
    name: 'Bass with a fifteenth',
    category: 'bass',
    description:
      'A ringing bass with octaves above it, one and two up, as if two harps played the ground along, under a spring.',
    preview: LAMENT,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { touch: 0.4, tone: 0.6, sustain: 8, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Glass octaves',
        params: { dry: 1, up1: 0.4, up2: 0.35, attack: 0 },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'passacaglia-layers-growl-of-the-fourth-bar',
    name: 'Growl of the fourth bar',
    category: 'bass',
    description:
      'A fretless growling near the bridge, pushed through a horn loudspeaker at the far side of a hard room and warmed again.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { volume: 0, sustain: 9, touch: 0.45 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.6, noise: 0.05 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'passacaglia-layers-tenor-shadow',
    name: 'Tenor shadow',
    category: 'bass',
    description:
      'A muted bass whose strongest partials are sung again by slow sine tones an octave up, which outlast the thud.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { mute: 0.5, tone: 0.45 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { transpose: 12, partials: 5, attack: 250, release: 2, mix: 0.65 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-tide-mark-of-the-bass',
    name: 'Tide mark of the bass',
    category: 'bass',
    description:
      'A long ringing bass divided into bands that swell and sink by turns, so the low end comes and goes like water.',
    preview: WIDE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { volume: -2, tone: 0.75, touch: 0.6, position: 0.15 },
    },
    effects: [
      {
        deviceId: 'currents',
        preset: 'Wide tide',
        params: { rate: 0.35, depth: 0.85, lowHold: 60 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-pizzicato-in-stone',
    name: 'Pizzicato in stone',
    category: 'bass',
    description:
      'A short plucked upright in a six-second hall with a long low decay, so each dry bar stands in the last one.',
    preview: DIVISIONS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { touch: 0.35, growl: 0, sustain: 1.2, release: 0.06, resonance: 0.4 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 6, midDecay: 5, damping: 4500, mix: 0.45 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 13 } },
    ],
  },
  {
    id: 'passacaglia-layers-wooden-box-of-a-bass',
    name: 'Wooden box of a bass',
    category: 'bass',
    description:
      'A hard pick with a rattle played inside a large wooden soundboard, which keeps its own ring under the ground.',
    preview: LAMENT,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { volume: -2, growl: 0.5, touch: 0.85 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.8, mix: 0.75 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'passacaglia-layers-kept-from-the-last-pass',
    name: 'Kept from the last pass',
    category: 'bass',
    description:
      'A soft fretless on a six-second tape loop, so the ground just played comes round worn under the next, in a booth.',
    preview: DIVISIONS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: 5.5, touch: 0.15, tone: 0.35, growl: 0.2, sustain: 4 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 6, feedback: 0.7, wear: 0.4, mix: 0.45 },
      },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.3 } },
    ],
  },

  // Bows: the ground held, then the third and fifth, the countermelody and the descant.
  {
    id: 'passacaglia-layers-bow-under-four-bars',
    name: 'Bow under four bars',
    category: 'string',
    description:
      'A close bowed string with a heavy wooden body, steady pressure and little vibrato, in a small dry chamber.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.25,
        release: 0.5,
        vibrato: 0.05,
        pressure: 0.7,
        body: 1,
        brightness: 0.25,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'passacaglia-layers-fourth-layer-sung',
    name: 'Fourth layer, sung',
    category: 'string',
    description:
      'A bow for the countermelody, its vibrato arriving late in each held note, in a warm hall.',
    preview: COUNTER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 0.18,
        release: 0.9,
        vibrato: 0,
        brightness: 0.55,
        position: 0.16,
        body: 0.6,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 300 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'passacaglia-layers-descant-on-an-edge',
    name: 'Descant on an edge',
    category: 'string',
    description:
      'A light bow close to the bridge, thin and high in overtones, its lows cut and its tail lifted up an octave.',
    preview: DESCANT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.35, release: 2, body: 0.1, brightness: 0.9 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 260, highCut: 16000 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { decay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-sixth-held-over',
    name: 'Sixth held over',
    category: 'string',
    description:
      'A sustained string with slow beats, whose tones common to two bars hang on while whatever moves is turned down.',
    preview: HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: { attack: 0.5, release: 1.2, detune: 12, brightness: 0.45 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.75 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'passacaglia-layers-plucked-second-layer',
    name: 'Plucked second layer',
    category: 'plucked',
    description:
      'A felt-soft plucked string with a hollow body, its strokes smoothed and each repeated across the sides.',
    preview: SECOND,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.2, decay: 3, body: 0.9, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Soft pebble',
        params: { first: 500, skips: 4, mix: 0.3 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-quarters-on-wire',
    name: 'Quarters on wire',
    category: 'plucked',
    description:
      'A wire harp ringing from bar to bar with a second set of strings an octave above, a little out of tune.',
    preview: QUARTERS,
    instrument: { deviceId: 'bowed-string', preset: 'Wire harp', params: { decay: 9, release: 3 } },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 4 } },
    ],
  },
  {
    id: 'passacaglia-layers-rasp-for-the-lament',
    name: 'Rasp for the lament',
    category: 'string',
    description:
      'A hard bow with rosin in it, weighted by a transformer and left in a narrow spring tank.',
    preview: LAMENT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: { volume: -17, attack: 0.2, release: 1, brightness: 0.6, body: 0.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.4, decay: 4 } },
    ],
  },
  {
    id: 'passacaglia-layers-descant-under-the-breath',
    name: 'Descant under the breath',
    category: 'string',
    description:
      'A flautando bow with almost no weight, opening and closing in level and brightness on a slow breath.',
    preview: DESCANT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.4, release: 1.5, vibrato: 0.2 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Tide',
        params: { in: 1.5, hold: 0.2, out: 1.5, rest: 0.1, depth: 0.6, vary: 0 },
      },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'passacaglia-layers-section-of-beating-bows',
    name: 'Section of beating bows',
    category: 'string',
    description:
      'A widely detuned bow with slow vibrato, thickened again by a tight flock of sixteen copies that now and then wheels.',
    preview: WEDGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { attack: 0.5, release: 1.4, brightness: 0.4 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.6 } }],
  },
  {
    id: 'passacaglia-layers-bowls-under-a-pluck',
    name: 'Bowls under a pluck',
    category: 'plucked',
    description:
      'A short damped pluck over five dark bowls tuned to the minor pentatonic on A, which sing on after the string has stopped.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.3, decay: 2 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Five dark bowls',
        params: { root: 9, scale: 1, ring: 5, mix: 0.6 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-still-third-and-fifth',
    name: 'Still third and fifth',
    category: 'drone',
    description:
      'A sustained string with no body, beat or vibrato, close to a sine, given organ ranks a fifth over it and an octave under.',
    preview: HELD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Still tone',
      params: { attack: 0.4, release: 1.2, brightness: 0.15 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { speak: 200, mix: 0.7 } },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'passacaglia-layers-top-line-fed-back',
    name: 'Top line fed back',
    category: 'string',
    description:
      'A sustained string driven into its octave and pushed into an amplifier that takes up a held note and will not let go.',
    preview: DESCANT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { volume: -1.5, attack: 0.4, release: 1.5, vibrato: 0.15 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { mix: 0.4 } },
      { deviceId: 're-amp', preset: 'Dark and woolly' },
    ],
  },
  {
    id: 'passacaglia-layers-swell-on-each-downbeat',
    name: 'Swell on each downbeat',
    category: 'string',
    description:
      'A plucked string faded in by a volume pedal and followed two bars later by itself, so a rising ground meets its thirds.',
    preview: RISE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Volume swell',
      params: { volume: -2, attack: 0.35, release: 1.5, decay: 8, brightness: 0.45 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Slow procession',
        params: { followers: 1, gap: 3.3, fade: 0.2, tone: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-twelfth-above-the-pass',
    name: 'Twelfth above the pass',
    category: 'string',
    description:
      'A sustained string on its twelfth, its attacks blurred by fog and the whole sound swung slowly from ear to ear.',
    preview: COUNTER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Twelfth glow',
      params: { volume: -5.5, attack: 0.3, release: 1.5, body: 0.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.7 } },
      { deviceId: 'around', preset: 'Gentle sway' },
    ],
  },
  {
    id: 'passacaglia-layers-bow-through-a-wall',
    name: 'Bow through a wall',
    category: 'string',
    description:
      'A quick sustained string heard from the next room through a cupboard-sized loudspeaker, the top gone.',
    preview: COUNTER,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: { attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'distance', preset: 'Next door' },
    ],
  },
  {
    id: 'passacaglia-layers-ground-under-ice',
    name: 'Ground under ice',
    category: 'string',
    description: 'A slow beating string under water, muffled and wavering, in a small dark room.',
    preview: WEDGE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Slow beating swell',
      params: { volume: -11.5, attack: 0.6, release: 3, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { depth: 0.6 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'passacaglia-layers-eighths-left-beating',
    name: 'Eighths left beating',
    category: 'plucked',
    description:
      'A plucked string and a twin tuned away from it, running eighths through a phaser of twelve slow stages.',
    preview: EIGHTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Beating strings',
      params: { decay: 6, release: 1.5, brightness: 0.75, position: 0.12 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 6 } },
    ],
  },

  // Harp: the quarters and the eighths.
  {
    id: 'passacaglia-layers-third-layer-on-harp',
    name: 'Third layer, on harp',
    category: 'plucked',
    description:
      'A concert harp plucked over the middle, with a long sympathetic halo and a small bright tank of echoes.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { touch: 0.3, halo: 0.8, decay: 1.4 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.3, breathDepth: 0 } },
    ],
  },
  {
    id: 'passacaglia-layers-eighths-near-the-wood',
    name: 'Eighths near the wood',
    category: 'plucked',
    description:
      'A harp plucked at the soundboard and damped short, its top taken off by dull tape with a little wow.',
    preview: EIGHTHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { damp: 0.9, decay: 0.3, halo: 0.05, body: 0.9 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { wow: 0.4, bump: 0.8, hiss: 0.05 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'passacaglia-layers-harp-two-octaves-deep',
    name: 'Harp two octaves deep',
    category: 'plucked',
    description:
      'A hollow harp joined by its own octaves below, filtered soft, so a descant also sings as a tenor under itself.',
    preview: DESCANT,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 0.5, decay: 1, halo: 0.2 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Slow pedals',
        params: { sub2: 0.6, sub1: 0.7, dry: 0.4, attack: 0.1, filter: 500 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-silk-on-the-ground',
    name: 'Silk on the ground',
    category: 'plucked',
    description:
      'Soft silk strings that bend up a quarter-tone as they speak, with a dotted tape echo behind every beat.',
    preview: QUARTERS,
    instrument: { deviceId: 'harp', preset: 'Soft silk', params: { body: 0.6 } },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 750, feedback: 0.35, mix: 0.4, highCut: 2500 },
      },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 11 } },
    ],
  },
  {
    id: 'passacaglia-layers-steel-descant',
    name: 'Steel descant',
    category: 'plucked',
    description:
      'Steel zither strings plucked hard by the bridge, their lows cut, with sparks thrown off an octave and more above.',
    preview: DESCANT,
    instrument: { deviceId: 'harp', preset: 'Steel shimmer', params: { decay: 1.5, body: 0.2 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 350, highCut: 14000 } },
      { deviceId: 'glints', preset: 'First light', params: { mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 15 } },
    ],
  },
  {
    id: 'passacaglia-layers-quarters-nobody-struck',
    name: 'Quarters nobody struck',
    category: 'pad',
    description:
      'A harp whose attacks are swelled away and whose strings then fill a hall, so quarter notes blur into chords.',
    preview: QUARTERS,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { decay: 2 } },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 220 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'passacaglia-layers-dry-seeds-in-threes',
    name: 'Dry seeds in threes',
    category: 'plucked',
    description:
      'Harp strings stopped as soon as they are plucked, rung inside a clay pot and flattened hard.',
    preview: EIGHTHS,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { body: 0.6, pluck: 0.3 } },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 4 } },
    ],
  },
  {
    id: 'passacaglia-layers-cascade-over-the-ground',
    name: 'Cascade over the ground',
    category: 'plucked',
    description:
      'Guzheng strings whose every chord is swept, replayed as small loops at the octave and stacked above themselves.',
    preview: WHOLE,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { sweep: 0.3, halo: 0.3, decay: 0.8 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 250, mix: 0.45 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 14 } },
    ],
  },
  {
    id: 'passacaglia-layers-koto-in-the-cloister',
    name: 'Koto in the cloister',
    category: 'plucked',
    description:
      'A koto with hard picks over sixteen strings tuned in C major that ring along, slowly panned from side to side.',
    preview: GROWS,
    instrument: { deviceId: 'harp', preset: 'Koto', params: { decay: 0.7, body: 0.4 } },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Glass harp',
        params: { root: 0, mode: 0, mix: 0.6, decay: 5 },
      },
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 11 } },
    ],
  },
  {
    id: 'passacaglia-layers-harp-remembered',
    name: 'Harp remembered',
    category: 'plucked',
    description:
      'A muted harp with fragments of the last pass drifting back under it, some of them backwards.',
    preview: GROWS,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { volume: 0.5, damp: 0.6, touch: 0.5, body: 0.5 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Hazy past',
        params: { reach: 6, memory: 0.9, mix: 0.55 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-rolled-chord-each-bar',
    name: 'Rolled chord each bar',
    category: 'plucked',
    description:
      'A harp that takes nearly a second to roll each chord, its tail sagging and dulling like wax, spread wide.',
    preview: WEDGE,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: 1.5, sweep: 0.9, decay: 1.2 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },

  // Chamber strings: thirds and fifths held, wedges opening, and the descant.
  {
    id: 'passacaglia-layers-second-layer-in-mutes',
    name: 'Second layer in mutes',
    category: 'string',
    description:
      'Five muted players holding tenths over the ground without vibrato, heard through a small wooden body in a bright hall.',
    preview: HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -4.5, attack: 0.5, release: 0.9 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.5, mix: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-viols-for-the-wedge',
    name: 'Viols for the wedge',
    category: 'string',
    description:
      'A dry consort of four with no vibrato and no air between them, with a nasal filtered copy an octave below.',
    preview: WEDGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.2, bow: 0.8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Nasal reed', params: { up1: 0, sub1: 0.5, dry: 0.8 } },
    ],
  },
  {
    id: 'passacaglia-layers-first-desk-descant',
    name: 'First desk, descant',
    category: 'string',
    description:
      'One close violin with a ripe vibrato, its echo a beat behind it on a worn reel, narrow and near.',
    preview: DESCANT,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -3, vibrato: 18, attack: 0.12 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 500, feedback: 0.3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-bows-turn-to-voices',
    name: 'Bows turn to voices',
    category: 'voice',
    description:
      'Three still players in a long hall whose tail sings on oo, opened very wide, so each chord is left as a choir.',
    preview: RISE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.5, release: 1.2 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.7, decay: 9 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  {
    id: 'passacaglia-layers-frost-at-the-bridge',
    name: 'Frost at the bridge',
    category: 'string',
    description:
      'Three bows hard on the bridge, all edge, with each band of their overtones flickering on its own.',
    preview: HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -4.5, attack: 0.4, release: 1.2 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Glitter on top' },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 200, highCut: 14000 } },
    ],
  },
  {
    id: 'passacaglia-layers-short-bows-in-three',
    name: 'Short bows in three',
    category: 'string',
    description:
      'A section of clipped bows with bite, throbbing softly four times a second through a gate, on a bright plate.',
    preview: EIGHTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { volume: -1, release: 0.35 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Soft throb', params: { rate: 4, floor: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'passacaglia-layers-whole-weight-of-strings',
    name: 'Whole weight of strings',
    category: 'string',
    description:
      'Six warm players with a dark octave below everything they play, glued by a slow compressor.',
    preview: GROWS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.18, release: 0.6, air: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.8 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'passacaglia-layers-veil-over-the-repeat',
    name: 'Veil over the repeat',
    category: 'string',
    description:
      'Muted bows at the bridge, a thin hiss of string, hung in frozen spectral mist that changes with the harmony.',
    preview: WEDGE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { attack: 0.6, release: 2 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.75, blur: 0.55 } },
    ],
  },
  {
    id: 'passacaglia-layers-bows-that-disagree',
    name: 'Bows that disagree',
    category: 'string',
    description:
      'A ragged unison of six, each with its own pitch and bow, dulled by a worn cassette, with an octave above and below.',
    preview: RISE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.35, release: 1 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { noise: 0.05, tone: 0.25, wear: 0.6 },
      },
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.8, sub1: 0.4 } },
    ],
  },
  {
    id: 'passacaglia-layers-whispered-tenths',
    name: 'Whispered tenths',
    category: 'string',
    description:
      'Bows with more air than tone, their quiet rosin turned up, with a room that swells backwards after each change.',
    preview: HELD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -1.5, attack: 0.4, release: 1.4, air: 1 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.5 } },
    ],
  },

  // Chord harp: the held chord of each bar, swept.
  {
    id: 'passacaglia-layers-strum-on-every-one',
    name: 'Strum on every one',
    category: 'plucked',
    description:
      'A soft strum over three octaves at each change, its pad turned down, in a warm wide wash of motion and tail.',
    preview: RISE,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: -2, pad: 0.1, sustain: 2 },
    },
    effects: [{ deviceId: 'seasons', preset: 'High summer', params: { mix: 0.8 } }],
  },
  {
    id: 'passacaglia-layers-long-fall-to-e',
    name: 'Long fall to E',
    category: 'plucked',
    description:
      'A harp that sweeps its chord downward over four octaves, the sweep fanned out in time from its top to its bottom.',
    preview: HELD,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { volume: -2.5, strum: 90, tone: 0.6 },
    },
    effects: [{ deviceId: 'prism', preset: 'High to low', params: { time: 700, mix: 0.45 } }],
  },
  {
    id: 'passacaglia-layers-organ-under-the-bars',
    name: 'Organ under the bars',
    category: 'organ',
    description:
      'A chord harp with its held pad full up and one soft pluck to a key, octaves swelling in above and below it, in a heavy slow cabinet.',
    preview: WEDGE,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { sustain: 0.6, tone: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Swell pad', params: { attack: 0.3, dry: 0.3 } },
      { deviceId: 'rotary', preset: 'Heavy rotors' },
    ],
  },
  {
    id: 'passacaglia-layers-toy-quarter-notes',
    name: 'Toy quarter notes',
    category: 'plucked',
    description:
      'A small bright harp swept from the top down, through a worn early sampler and a touch of spring.',
    preview: QUARTERS,
    instrument: { deviceId: 'chord-harp', preset: 'Toy harp', params: { strum: 25, sustain: 1.8 } },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { noise: 0 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-muffled-sarabande',
    name: 'Muffled sarabande',
    category: 'plucked',
    description:
      'A dull slow strum over two octaves, ringing four seconds, and the head of each bar at half speed an octave below.',
    preview: SECOND,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { volume: -3, strum: 60, pad: 0.1, sustain: 4 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 1500, smooth: 0.1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-glints-on-the-descent',
    name: 'Glints on the descent',
    category: 'bell',
    description:
      'Bright chimes with no strum and no pad, four seconds long, under a thin veil of grains, their ringing tones tamed.',
    preview: QUARTERS,
    instrument: { deviceId: 'chord-harp', preset: 'Long glass chimes', params: { sustain: 4 } },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thin veil' },
      { deviceId: 'tamer', preset: 'Bright tail' },
    ],
  },
  {
    id: 'passacaglia-layers-rain-across-four-bars',
    name: 'Rain across four bars',
    category: 'texture',
    description:
      'Four octaves of short strings in no order, scattered again by echoes that land like stars over two seconds.',
    preview: WEDGE,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'String rain',
      params: { volume: 5, tone: 0.75, sustain: 0.6 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 2000, mix: 0.45 } },
    ],
  },
  {
    id: 'passacaglia-layers-dark-wash-of-a-pass',
    name: 'Dark wash of a pass',
    category: 'pad',
    description:
      'A fast up-and-down sweep, dark and four seconds long, caught by a pad that holds each chord and glides to the next.',
    preview: RISE,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Dark long wash',
      params: { volume: 0.5, sustain: 4 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.5, glide: 0.6, mix: 0.75 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-music-box-in-the-loft',
    name: 'Music box in the loft',
    category: 'bell',
    description:
      'A tiny close chime given a smaller body and set far off in fog at the end of a wide hall.',
    preview: DESCANT,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Small music box',
      params: { volume: 2, sustain: 1.2, spread: 0.6 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'distance', preset: 'Through fog' },
    ],
  },

  // Felt piano: the sarabande, the eighths and the whole weight.
  {
    id: 'passacaglia-layers-sarabande-in-felt',
    name: 'Sarabande in felt',
    category: 'keys',
    description:
      'A thick felted piano with much thump and a close creaking action, its peaks held by a limiter.',
    preview: SECOND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { felt: 0.8, pedalNoise: 0.5, action: 0.7 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Tucked under' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'passacaglia-layers-piano-for-two-passes',
    name: 'Piano for two passes',
    category: 'keys',
    description:
      'A bare piano answered two bars on by itself an octave lower and darker, so each bar meets a sixth in the one after next.',
    preview: LAMENT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -13, hardness: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { followers: 1, gap: 3, interval1: -12, tone: 2500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-eighths-under-a-lamp',
    name: 'Eighths under a lamp',
    category: 'keys',
    description:
      'A lean piano with no resonance, wide and bright, its quiet tails brought up and a slow chorus under them.',
    preview: EIGHTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -13, resonance: 0, hardness: 0.6 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails' },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'passacaglia-layers-whole-piano-at-the-end',
    name: 'Whole piano at the end',
    category: 'keys',
    description:
      'A driven grand with loose unisons for all the layers at once, cut to a worn and crackling record that wavers.',
    preview: WHOLE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Driven grand',
      params: { outputDb: -12.5, grit: 0.7 },
    },
    effects: [{ deviceId: 'patina', preset: 'Scratched record', params: { wobble: 0.35 } }],
  },
  {
    id: 'passacaglia-layers-quarters-in-a-blur',
    name: 'Quarters in a blur',
    category: 'pad',
    description:
      'A piano with both pedals down and all felt, its strikes softened and the tones left to stand as an even wash.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -13.5, reverbMix: 0.3 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Long wash' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'passacaglia-layers-upright-in-the-porch',
    name: 'Upright in the porch',
    category: 'keys',
    description:
      'An old upright with all its noise, warbling, sent to a bedside loudspeaker and a spring behind it.',
    preview: GROWS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -12.5, felt: 0.1 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.05 } },
      { deviceId: 'tremolo', preset: 'Pitch wobble' },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'passacaglia-layers-glass-keys-for-a-descant',
    name: 'Glass keys for a descant',
    category: 'keys',
    description:
      'A hard stiff piano with no felt, its lows cut away, in a large room of its own, with grains an octave up for echoes.',
    preview: DESCANT,
    instrument: { deviceId: 'felt-piano', preset: 'Glass upright', params: { reverbMix: 0.55 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 300, highCut: 16000 } },
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 500, mix: 0.35, feedback: 0.3 },
      },
    ],
  },

  // Magnet piano: thirds and fifths that swell out of nothing over the ground.
  {
    id: 'passacaglia-layers-tenths-out-of-nothing',
    name: 'Tenths out of nothing',
    category: 'pad',
    description:
      'Strings sung by magnets with no hammer, half a second to bloom, under a slow deep phaser.',
    preview: HELD,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { bloom: 0.5, damper: 1 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
  },
  {
    id: 'passacaglia-layers-magnets-on-low-strings',
    name: 'Magnets on low strings',
    category: 'drone',
    description:
      'Bright low magnets on a wooden body, pushed into a transformer until the ground hums and growls.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { volume: -11, bloom: 0.5, damper: 1.5, bright: 0.7 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt', params: { output: -11 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'passacaglia-layers-reed-for-a-countersong',
    name: 'Reed for a countersong',
    category: 'organ',
    description:
      'A quick reedy string organ with a wooden body, its single line given a third above and a sixth below in A minor.',
    preview: DIVISIONS,
    instrument: { deviceId: 'magnet-piano', preset: 'Quick reed', params: { damper: 0.4 } },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { root: 9, scale: 1, mix: 40 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-whistle-over-the-mass',
    name: 'Whistle over the mass',
    category: 'wind',
    description:
      'The eighth harmonic of each string alone, a whistle three octaves up, its tail climbing by fifths.',
    preview: LAMENT,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { volume: -9, bloom: 0.4, shimmer: 0.4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { decay: 6, mix: 0.45 } }],
  },
  {
    id: 'passacaglia-layers-overtones-walk-the-bars',
    name: 'Overtones walk the bars',
    category: 'texture',
    description:
      'Magnets that slide over the harmonics of each string, the top spread wide, with the bar before heard backwards.',
    preview: RISE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { bloom: 0.3, sweepRate: 0.6 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 1650, mix: 0.35 } },
    ],
  },
  {
    id: 'passacaglia-layers-hammer-then-glow',
    name: 'Hammer, then glow',
    category: 'keys',
    description:
      'A soft felt hammer with the magnets rising behind it, the strike leading and the pitch sagging as each note ages.',
    preview: SECOND,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { volume: -8.5, bloom: 0.6 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'passacaglia-layers-one-sine-to-a-bar',
    name: 'One sine to a bar',
    category: 'drone',
    description:
      'A string sung to one still sine, its echoes parted a few hertz sharp and flat so they beat against it, on soft tape.',
    preview: STEPS,
    instrument: { deviceId: 'magnet-piano', preset: 'Still sine', params: { bloom: 0.3 } },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Parting echo',
        params: { shift: 2, feedback: 0.5, mix: 0.5 },
      },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },

  // Prepared piano: quarters and divisions on altered strings.
  {
    id: 'passacaglia-layers-bolts-on-the-ground',
    name: 'Bolts on the ground',
    category: 'bell',
    description:
      'A piano with bolts in its bass strings, each note a small gong, dulled by distance across a room.',
    preview: STEPS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Bolt gongs',
      params: { volume: 6, tone: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Across the room', params: { wander: 0 } }],
  },
  {
    id: 'passacaglia-layers-rubber-divisions',
    name: 'Rubber divisions',
    category: 'plucked',
    description:
      'Woody thunks from rubber between the strings, with tape slap behind them, for running quarters.',
    preview: DIVISIONS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { volume: 2.5, decay: 1.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 7 } },
    ],
  },
  {
    id: 'passacaglia-layers-paper-under-eighths',
    name: 'Paper under eighths',
    category: 'keys',
    description:
      'Paper buzzing on the strings, filtered by a slow low-pass that opens and shuts across the four bars.',
    preview: EIGHTHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: 1.5, hammer: 0.4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { lfoRateHz: 0.17 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-gongs-of-the-last-pass',
    name: 'Gongs of the last pass',
    category: 'bell',
    description:
      'Temple gongs from long bolts, detuned and slow to fade, opened into a vast cavern of short echoes.',
    preview: WIDE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: 2, decay: 2.5 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { mix: 0.4 } }],
  },
  {
    id: 'passacaglia-layers-felt-strip-on-strings',
    name: 'Felt strip on strings',
    category: 'keys',
    description:
      'A piano muted by felt, its attack blurred and its lows cut as if behind glass, with tape hiss breathing in the gaps.',
    preview: SECOND,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: 6, decay: 1.2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Behind glass' },
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -58 } },
    ],
  },
  {
    id: 'passacaglia-layers-every-key-an-object',
    name: 'Every key an object',
    category: 'keys',
    description:
      'A piano where each key has its own bolt, rubber or paper, in two loops of unequal length that drift apart.',
    preview: GROWS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { rattle: 0.6, decay: 0.8 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Two voices', params: { feedback: 0.6, mix: 0.45 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 8.5 } },
    ],
  },

  // Synthesizers: the weight of the sixth and seventh passes.
  {
    id: 'passacaglia-layers-pass-of-soft-pipes',
    name: 'Pass of soft pipes',
    category: 'organ',
    description:
      'A stopped pipe from a resonant square, plain and quick to speak, in a stone hall with a long low end.',
    preview: GROWS,
    instrument: { deviceId: 'dusk', preset: 'Stopped pipe', params: { resonance: 0.6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { lowDecay: 7, mix: 0.4 } }],
  },
  {
    id: 'passacaglia-layers-floor-of-square-waves',
    name: 'Floor of square waves',
    category: 'bass',
    description:
      'A square and its sub octave with the filter nearly shut, overdriven, for the ground doubled below.',
    preview: LAMENT,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { volume: -13.5, cutoff: 380, attack: 0.05, release: 0.6, chorus: 0 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'passacaglia-layers-filter-sings-the-top',
    name: 'Filter sings the top',
    category: 'voice',
    description:
      'A filter ringing two octaves over each key of a thin saw, its tone turned to a round vowel and carried in a circle round the head.',
    preview: RISE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.4, release: 1.5, resonance: 0.9 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'passacaglia-layers-dimming-with-the-ground',
    name: 'Dimming with the ground',
    category: 'pad',
    description:
      'Strings that open bright and close down as they are held, doubled at both sides, on a worn reel.',
    preview: WEDGE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.5, release: 2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.05 } },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
    ],
  },
  {
    id: 'passacaglia-layers-keys-for-the-eighths',
    name: 'Keys for the eighths',
    category: 'keys',
    description:
      'Warm struck keys from a saw and a square, their filter easing shut while they are held, with chorused echoes a quarter of a second apart.',
    preview: EIGHTHS,
    instrument: { deviceId: 'dusk', preset: 'Warm keys', params: { release: 0.6, envelope: 0.7 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 250, feedback: 0.35, mix: 0.35 },
      },
    ],
  },
  {
    id: 'passacaglia-layers-saws-for-a-seventh-pass',
    name: 'Saws for a seventh pass',
    category: 'pad',
    description:
      'Two saws to a key, each in seven detuned copies, bright, their lows cut so the ground keeps its place, on a long plate.',
    preview: WHOLE,
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { volume: 0.5, ampAttack: 0.2, ampRelease: 0.8, cutoff: 3500 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 180 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'passacaglia-layers-drone-at-the-root',
    name: 'Drone at the root',
    category: 'drone',
    description:
      'A dark drone of saw, pulse and sub with its filter barely moving, breathing in and out through a dark hall.',
    preview: STEPS,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.3, ampRelease: 1.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4, damping: 0.7 } }],
  },
  {
    id: 'passacaglia-layers-glass-on-each-quarter',
    name: 'Glass on each quarter',
    category: 'plucked',
    description:
      'A plucked triangle with a pulse an octave up, short and clear, its start struck again and again behind it, some of it an octave up.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { ampDecay: 0.6, filterDecay: 0.25 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 500, mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 12.5 } },
    ],
  },
  {
    id: 'passacaglia-layers-horns-from-a-filter',
    name: 'Horns from a filter',
    category: 'wind',
    description:
      'A soft brass of two saws whose filter opens as they speak, muted further by a loudspeaker down the hall.',
    preview: RISE,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { ampAttack: 0.1, ampRelease: 0.5, filterEnvAmount: 0.4 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { noise: 0 } }],
  },
  {
    id: 'passacaglia-layers-hollow-thirds-turning',
    name: 'Hollow thirds turning',
    category: 'pad',
    description:
      'A hollow pulse pad with a triangle a twelfth up, its two sides swept by a slow negative flange.',
    preview: HELD,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { volume: -4.5, ampAttack: 0.4, ampRelease: 1, osc2Coarse: 19, cutoff: 3000 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow' },
      { deviceId: 'late-vibrato', preset: 'Barely there' },
    ],
  },

  // Flock: the thin top and the crowded last pass.
  {
    id: 'passacaglia-layers-descant-in-flight',
    name: 'Descant in flight',
    category: 'voice',
    description:
      'Two reedy voices that fly in from above each note of the descant and thin out into echoes at a beat and a half.',
    preview: DESCANT,
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { from: 1, gather: 0.2, stray: 0.1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 750, mix: 0.35 } },
    ],
  },
  {
    id: 'passacaglia-layers-flock-finds-the-chord',
    name: 'Flock finds the chord',
    category: 'pad',
    description:
      'Eight pure voices with octaves over them, gliding in from below and above and gathered into a slow rising tail.',
    preview: RISE,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { gather: 0.5, leave: 1.5, stray: 0.1, flutter: 1 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.35 } }],
  },
  {
    id: 'passacaglia-layers-reeds-under-everything',
    name: 'Reeds under everything',
    category: 'organ',
    description:
      'A choir of buzzing reeds close in pitch, with an octave below, in a small dark box that takes the edge off.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { octaves: 0, stray: 0.12, gather: 0.15, leave: 0.8 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box' },
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
    ],
  },
]
