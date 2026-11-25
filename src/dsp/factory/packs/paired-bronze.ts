import { type FactoryPreset, type Phrase } from '../types'

// Bronze cast in pairs, one key low and one high and the gap held in hertz: five rates (0.7, 1.4, 5, 6.5 and 8 a second)
// by five sizes of hall (open yard, room, pavilion, temple hall, valley), on twin bars and on instruments whose pair is made
// by a copy moved a few hertz, by a split in hertz, or by the phrase itself. Steps in the comments are in cents over C.

// Ten keys of slendro over two octaves, rung one after another: 0 231 474 717 955 cents, then the octave above.
const TEN_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 60, gain: 0.72 },
    { atSec: 0.62, durSec: 2.2, note: 62.31, gain: 0.62 },
    { atSec: 1.24, durSec: 2.2, note: 64.74, gain: 0.62 },
    { atSec: 1.86, durSec: 2.2, note: 67.17, gain: 0.62 },
    { atSec: 2.48, durSec: 2.2, note: 69.55, gain: 0.62 },
    { atSec: 3.1, durSec: 2.2, note: 72, gain: 0.72 },
    { atSec: 3.72, durSec: 2.2, note: 74.31, gain: 0.62 },
    { atSec: 4.34, durSec: 2.2, note: 76.74, gain: 0.62 },
    { atSec: 4.96, durSec: 2.2, note: 79.17, gain: 0.62 },
    { atSec: 5.58, durSec: 1.82, note: 81.55, gain: 0.62 },
  ],
}

// One key in four octaves, each cast twice: the low one, then its partner six hertz above. The gap is 78 cents, then 39, 20
// and 10, and the beat of the two is six a second every time.
const CAST_TWICE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 48, gain: 0.62 },
    { atSec: 0.7, durSec: 2, note: 48.78, gain: 0.62 },
    { atSec: 1.7, durSec: 2.4, note: 60, gain: 0.62 },
    { atSec: 2.4, durSec: 2, note: 60.39, gain: 0.62 },
    { atSec: 3.4, durSec: 2.4, note: 72, gain: 0.62 },
    { atSec: 4.1, durSec: 2, note: 72.2, gain: 0.62 },
    { atSec: 5.1, durSec: 2.3, note: 84, gain: 0.62 },
    { atSec: 5.8, durSec: 1.6, note: 84.1, gain: 0.62 },
  ],
}

// Three kempyung of slendro, two keys left out between, each answered half a second later by its partner 1.1 hertz above:
// one tide in both notes.
const TIDE_CAST: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.8, note: 57.55, gain: 0.55 },
    { atSec: 0, durSec: 2.8, note: 64.74, gain: 0.5 },
    { atSec: 0.5, durSec: 2.3, note: 57.63, gain: 0.55 },
    { atSec: 0.5, durSec: 2.3, note: 64.8, gain: 0.5 },
    { atSec: 2.3, durSec: 2.8, note: 60, gain: 0.55 },
    { atSec: 2.3, durSec: 2.8, note: 67.17, gain: 0.5 },
    { atSec: 2.8, durSec: 2.3, note: 60.07, gain: 0.55 },
    { atSec: 2.8, durSec: 2.3, note: 67.22, gain: 0.5 },
    { atSec: 4.6, durSec: 2.8, note: 62.31, gain: 0.55 },
    { atSec: 4.6, durSec: 2.8, note: 69.55, gain: 0.5 },
    { atSec: 5.1, durSec: 2.3, note: 62.37, gain: 0.55 },
    { atSec: 5.1, durSec: 2.3, note: 69.59, gain: 0.5 },
  ],
}

// Pelog on C, three tones for two players: the lower hand has 258 . 120 258 . 120 258 120 and the upper puts 675 in its gaps,
// sixteen steps over a gong on 0 and a low 675 at the half.
const THREE_TONES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 74.58, gain: 0.7 },
    { atSec: 0, durSec: 3.3, note: 48, gain: 0.6 },
    { atSec: 0.4, durSec: 0.95, note: 78.75, gain: 0.6 },
    { atSec: 0.8, durSec: 0.7, note: 73.2, gain: 0.7 },
    { atSec: 1.2, durSec: 0.7, note: 74.58, gain: 0.62 },
    { atSec: 1.6, durSec: 0.95, note: 78.75, gain: 0.6 },
    { atSec: 2, durSec: 0.7, note: 73.2, gain: 0.62 },
    { atSec: 2.4, durSec: 0.7, note: 74.58, gain: 0.7 },
    { atSec: 2.8, durSec: 0.7, note: 73.2, gain: 0.62 },
    { atSec: 3.2, durSec: 0.7, note: 74.58, gain: 0.7 },
    { atSec: 3.2, durSec: 3.6, note: 54.75, gain: 0.5 },
    { atSec: 3.6, durSec: 0.95, note: 78.75, gain: 0.6 },
    { atSec: 4, durSec: 0.7, note: 73.2, gain: 0.7 },
    { atSec: 4.4, durSec: 0.7, note: 74.58, gain: 0.62 },
    { atSec: 4.8, durSec: 0.95, note: 78.75, gain: 0.6 },
    { atSec: 5.2, durSec: 0.7, note: 73.2, gain: 0.62 },
    { atSec: 5.6, durSec: 0.7, note: 74.58, gain: 0.7 },
    { atSec: 6, durSec: 0.7, note: 73.2, gain: 0.62 },
  ],
}

// Pelog, one hand on the tone of the tune and the other on its upper neighbour: 120 and 258 over a low 120, a double step
// that calls the next tone, then 675 and 785 over a low 675.
const NEIGHBOURS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.62, note: 73.2, gain: 0.68 },
    { atSec: 0, durSec: 3.2, note: 49.2, gain: 0.55 },
    { atSec: 0.4, durSec: 0.62, note: 74.58, gain: 0.56 },
    { atSec: 0.8, durSec: 0.62, note: 73.2, gain: 0.68 },
    { atSec: 1.2, durSec: 0.62, note: 74.58, gain: 0.56 },
    { atSec: 1.6, durSec: 0.62, note: 73.2, gain: 0.68 },
    { atSec: 2, durSec: 0.62, note: 74.58, gain: 0.56 },
    { atSec: 2.4, durSec: 0.62, note: 78.75, gain: 0.68 },
    { atSec: 2.8, durSec: 0.62, note: 78.75, gain: 0.56 },
    { atSec: 3.2, durSec: 0.62, note: 78.75, gain: 0.68 },
    { atSec: 3.2, durSec: 3.6, note: 54.75, gain: 0.52 },
    { atSec: 3.6, durSec: 0.62, note: 79.85, gain: 0.56 },
    { atSec: 4, durSec: 0.62, note: 78.75, gain: 0.68 },
    { atSec: 4.4, durSec: 0.62, note: 79.85, gain: 0.56 },
    { atSec: 4.8, durSec: 0.62, note: 78.75, gain: 0.68 },
    { atSec: 5.2, durSec: 0.62, note: 79.85, gain: 0.56 },
    { atSec: 5.6, durSec: 0.62, note: 78.75, gain: 0.68 },
    { atSec: 6, durSec: 0.62, note: 79.85, gain: 0.56 },
  ],
}

// A round of eight counts in slendro: the great gong on one, the kempul over it (717 cents) on three and seven, a key two
// octaves up on five, a small pot on the even counts, and the gong again to close.
const GONG_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 36, gain: 0.75 },
    { atSec: 0.7, durSec: 0.4, note: 69.55, gain: 0.34 },
    { atSec: 1.4, durSec: 1.8, note: 43.17, gain: 0.6 },
    { atSec: 2.1, durSec: 0.4, note: 69.55, gain: 0.34 },
    { atSec: 2.8, durSec: 3.2, note: 60, gain: 0.5 },
    { atSec: 3.5, durSec: 0.4, note: 69.55, gain: 0.34 },
    { atSec: 4.2, durSec: 1.8, note: 43.17, gain: 0.6 },
    { atSec: 4.9, durSec: 0.4, note: 69.55, gain: 0.34 },
    { atSec: 5.6, durSec: 1.8, note: 36, gain: 0.75 },
  ],
}

// Chords of two in slendro, always two keys left out between (714 to 719 cents), a step up, a step up and back.
const KEMPYUNG: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 55.17, gain: 0.68 },
    { atSec: 0, durSec: 2, note: 62.31, gain: 0.6 },
    { atSec: 1.75, durSec: 2, note: 57.55, gain: 0.68 },
    { atSec: 1.75, durSec: 2, note: 64.74, gain: 0.6 },
    { atSec: 3.5, durSec: 2, note: 60, gain: 0.68 },
    { atSec: 3.5, durSec: 2, note: 67.17, gain: 0.6 },
    { atSec: 5.25, durSec: 2, note: 57.55, gain: 0.68 },
    { atSec: 5.25, durSec: 2, note: 64.74, gain: 0.6 },
  ],
}

// One pelog melody at three speeds: the top moves on every count, the middle on every second, the low keys on every fourth,
// and the two upper meet on 258, 675, 785, 675 and 258, the low keys with them on the first, third and last.
const THREE_SPEEDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 74.58, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 62.58, gain: 0.56 },
    { atSec: 0, durSec: 3.3, note: 50.58, gain: 0.6 },
    { atSec: 0.78, durSec: 0.8, note: 73.2, gain: 0.5 },
    { atSec: 1.56, durSec: 0.8, note: 78.75, gain: 0.5 },
    { atSec: 1.56, durSec: 1.6, note: 66.75, gain: 0.56 },
    { atSec: 2.34, durSec: 0.8, note: 79.85, gain: 0.5 },
    { atSec: 3.12, durSec: 0.8, note: 79.85, gain: 0.5 },
    { atSec: 3.12, durSec: 1.6, note: 67.85, gain: 0.56 },
    { atSec: 3.12, durSec: 3, note: 55.85, gain: 0.55 },
    { atSec: 3.9, durSec: 0.8, note: 84, gain: 0.5 },
    { atSec: 4.68, durSec: 0.8, note: 78.75, gain: 0.5 },
    { atSec: 4.68, durSec: 1.6, note: 66.75, gain: 0.56 },
    { atSec: 5.46, durSec: 0.8, note: 73.2, gain: 0.5 },
    { atSec: 6.24, durSec: 0.8, note: 74.58, gain: 0.5 },
    { atSec: 6.24, durSec: 1.16, note: 50.58, gain: 0.6 },
    { atSec: 6.24, durSec: 1.16, note: 62.58, gain: 0.56 },
  ],
}

// Four keys of slendro handed between two players, sixteen steps that close on the lowest key.
const FOUR_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 67.17, gain: 0.74 },
    { atSec: 0.4, durSec: 0.7, note: 72, gain: 0.58 },
    { atSec: 0.8, durSec: 0.7, note: 69.55, gain: 0.58 },
    { atSec: 1.2, durSec: 0.7, note: 74.31, gain: 0.58 },
    { atSec: 1.6, durSec: 0.7, note: 72, gain: 0.74 },
    { atSec: 2, durSec: 0.7, note: 67.17, gain: 0.58 },
    { atSec: 2.4, durSec: 0.7, note: 74.31, gain: 0.58 },
    { atSec: 2.8, durSec: 0.7, note: 69.55, gain: 0.58 },
    { atSec: 3.2, durSec: 0.7, note: 67.17, gain: 0.74 },
    { atSec: 3.6, durSec: 0.7, note: 72, gain: 0.58 },
    { atSec: 4, durSec: 0.7, note: 69.55, gain: 0.58 },
    { atSec: 4.4, durSec: 0.7, note: 74.31, gain: 0.58 },
    { atSec: 4.8, durSec: 0.7, note: 72, gain: 0.74 },
    { atSec: 5.2, durSec: 0.7, note: 74.31, gain: 0.58 },
    { atSec: 5.6, durSec: 0.7, note: 69.55, gain: 0.58 },
    { atSec: 6, durSec: 1.3, note: 67.17, gain: 0.58 },
  ],
}

// Two hands in contrary motion over slendro: they close from an octave and 955 cents to a kempyung of 714 and open again.
const TWO_HANDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 60, gain: 0.64 },
    { atSec: 0, durSec: 1.2, note: 81.55, gain: 0.58 },
    { atSec: 0.9, durSec: 1.2, note: 62.31, gain: 0.64 },
    { atSec: 0.9, durSec: 1.2, note: 79.17, gain: 0.58 },
    { atSec: 1.8, durSec: 1.2, note: 64.74, gain: 0.64 },
    { atSec: 1.8, durSec: 1.2, note: 76.74, gain: 0.58 },
    { atSec: 2.7, durSec: 1.2, note: 67.17, gain: 0.64 },
    { atSec: 2.7, durSec: 1.2, note: 74.31, gain: 0.58 },
    { atSec: 3.6, durSec: 1.2, note: 64.74, gain: 0.64 },
    { atSec: 3.6, durSec: 1.2, note: 76.74, gain: 0.58 },
    { atSec: 4.5, durSec: 1.2, note: 62.31, gain: 0.64 },
    { atSec: 4.5, durSec: 1.2, note: 79.17, gain: 0.58 },
    { atSec: 5.4, durSec: 1.9, note: 60, gain: 0.64 },
    { atSec: 5.4, durSec: 1.9, note: 81.55, gain: 0.58 },
  ],
}

// Long keys of pelog, two and three at a time: 0 with 675, 258 with 785, 0 with 675 and the octave of 258.
const LONG_PELOG: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.7, note: 60, gain: 0.6 },
    { atSec: 0.3, durSec: 2.4, note: 66.75, gain: 0.52 },
    { atSec: 2.4, durSec: 2.7, note: 62.58, gain: 0.6 },
    { atSec: 2.7, durSec: 2.4, note: 67.85, gain: 0.52 },
    { atSec: 4.8, durSec: 2.6, note: 60, gain: 0.6 },
    { atSec: 5, durSec: 2.4, note: 66.75, gain: 0.5 },
    { atSec: 5.3, durSec: 2.1, note: 74.58, gain: 0.42 },
  ],
}

// The low keys alone, one at a time in pelog: 258, 120, 675, 785 and home.
const LOW_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.35, note: 50.58, gain: 0.66 },
    { atSec: 1.4, durSec: 1.35, note: 49.2, gain: 0.66 },
    { atSec: 2.8, durSec: 1.35, note: 54.75, gain: 0.66 },
    { atSec: 4.2, durSec: 1.35, note: 55.85, gain: 0.66 },
    { atSec: 5.6, durSec: 1.8, note: 48, gain: 0.66 },
  ],
}

// Four small keys high up for two players: the lower has a b . a . b a . and the upper d . c d c . d c, so the line is
// counted three, three and two, and the two outer keys (a kempyung of 714) fall together on one, four and seven and at the end.
const SMALL_KEYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 79.17, gain: 0.56 },
    { atSec: 0, durSec: 0.6, note: 86.31, gain: 0.56 },
    { atSec: 0.34, durSec: 0.6, note: 81.55, gain: 0.54 },
    { atSec: 0.68, durSec: 0.6, note: 84, gain: 0.54 },
    { atSec: 1.02, durSec: 0.6, note: 79.17, gain: 0.5 },
    { atSec: 1.02, durSec: 0.6, note: 86.31, gain: 0.5 },
    { atSec: 1.36, durSec: 0.6, note: 84, gain: 0.54 },
    { atSec: 1.7, durSec: 0.6, note: 81.55, gain: 0.54 },
    { atSec: 2.04, durSec: 0.6, note: 79.17, gain: 0.5 },
    { atSec: 2.04, durSec: 0.6, note: 86.31, gain: 0.5 },
    { atSec: 2.38, durSec: 0.6, note: 84, gain: 0.54 },
    { atSec: 2.72, durSec: 0.6, note: 79.17, gain: 0.56 },
    { atSec: 2.72, durSec: 0.6, note: 86.31, gain: 0.56 },
    { atSec: 3.06, durSec: 0.6, note: 81.55, gain: 0.54 },
    { atSec: 3.4, durSec: 0.6, note: 84, gain: 0.54 },
    { atSec: 3.74, durSec: 0.6, note: 79.17, gain: 0.5 },
    { atSec: 3.74, durSec: 0.6, note: 86.31, gain: 0.5 },
    { atSec: 4.08, durSec: 0.6, note: 84, gain: 0.54 },
    { atSec: 4.42, durSec: 0.6, note: 81.55, gain: 0.54 },
    { atSec: 4.76, durSec: 0.6, note: 79.17, gain: 0.5 },
    { atSec: 4.76, durSec: 0.6, note: 86.31, gain: 0.5 },
    { atSec: 5.1, durSec: 0.6, note: 84, gain: 0.54 },
    { atSec: 5.44, durSec: 1.7, note: 79.17, gain: 0.56 },
    { atSec: 5.44, durSec: 1.7, note: 86.31, gain: 0.56 },
  ],
}

// Held gongs: one kempyung laid on another from the great gong up (717, 714, 724 and 719 cents), each key held to the end.
const HELD_GONGS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 36, gain: 0.62 },
    { atSec: 1.2, durSec: 6, note: 43.17, gain: 0.54 },
    { atSec: 2.4, durSec: 4.8, note: 50.31, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 57.55, gain: 0.48 },
    { atSec: 4.8, durSec: 2.4, note: 64.74, gain: 0.44 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Twin bars, 0.7 a second.
  {
    id: 'paired-bronze-tide-between-two-keys',
    name: 'Tide between two keys',
    category: 'bell',
    description:
      'Softly struck metal pairs 0.7 hertz apart and twenty seconds long, warmed and left in the open, wandering a little.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'twin-bars',
      params: { beat: 0.7, ears: 0.35, mallet: 0.15, decay: 20, tone: 0.2, damp: 0.1, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'around', preset: 'Barely moving' },
    ],
  },
  {
    id: 'paired-bronze-breath-on-the-keys',
    name: 'Breath on the keys',
    category: 'pad',
    description:
      'Glass pairs 0.7 hertz apart with the stroke faded out over half a second, a few steps back in a small room.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow sway',
      params: { beat: 0.7, ears: 0.9, mallet: 0.4, tone: 0.7, damp: 0.1, volume: -2 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 500, sensitivity: -55 } },
      { deviceId: 'distance', preset: 'A few steps back', params: { decay: 1.1, wander: 0 } },
    ],
  },
  {
    id: 'paired-bronze-raft-of-bamboo',
    name: 'Raft of bamboo',
    category: 'keys',
    description:
      'Soft wood pairs, 0.7 a second, panned slowly side to side in a hall of about three seconds.',
    preview: THREE_SPEEDS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { beat: 0.7, mallet: 0.35, tone: 0.45, decay: 3.5, ears: 0.1, volume: -3 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.35, depth: 0.9 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paired-bronze-ageng-behind-the-gate',
    name: 'Ageng behind the gate',
    category: 'bell',
    description:
      'A hard bright metal pair beating once in a second and a half, an octave added below, in a long cathedral.',
    preview: GONG_ROUND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Half a hertz',
      params: { beat: 0.7, mallet: 0.7, tone: 0.8, ears: 0.6, volume: -8 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.6, up1: 0, dry: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 12, mix: 0.35 } },
    ],
  },
  {
    id: 'paired-bronze-moon-over-the-crater',
    name: 'Moon over the crater',
    category: 'pad',
    description:
      'Glass pairs 0.7 hertz apart, one an ear, answered backwards at the octave above in a valley of eighteen seconds.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass bowl',
      params: { beat: 0.7, ears: 1, mallet: 0.1, tone: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 1200, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 18, size: 0.8, mix: 0.4 } },
    ],
  },
  // Twin bars, 1.4 a second.
  {
    id: 'paired-bronze-pebbles-for-the-ditch',
    name: 'Pebbles for the ditch',
    category: 'plucked',
    description:
      'Wood pairs 1.4 hertz apart under a medium mallet, thinned and skipping away from side to side with no room at all.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Two, soft wood',
      params: { beat: 1.4, mallet: 0.6, decay: 1.2, tone: 0.55, damp: 0.5, volume: 1.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { first: 300, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'paired-bronze-jegogan-by-lamplight',
    name: 'Jegogan by lamplight',
    category: 'bass',
    description:
      'Dark low metal pairs, 1.4 a second, pushed warm into tape saturation with a short narrow spring behind.',
    preview: LOW_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { beat: 1.4, decay: 6, mallet: 0.1, tone: 0.1, damp: 0.35, ears: 0.2, volume: -6 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12, outputDb: -6 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'paired-bronze-damped-with-the-left',
    name: 'Damped with the left',
    category: 'bell',
    description:
      'Hard glass pairs 1.4 hertz apart, stopped as each key is let go, through a low-pass that opens with the touch, on a medium plate.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Damped glass',
      params: { beat: 1.4, mallet: 1, tone: 0.9, decay: 2.5, damp: 0.95, volume: 1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { cutoffHz: 420, driveDb: 4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'paired-bronze-women-at-the-spring',
    name: 'Women at the spring',
    category: 'pad',
    description:
      'Long metal pairs, 1.4 a second, bowed in by a slow swell in a hall whose tail sings a closed vowel.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { beat: 1.4, mallet: 0.45, tone: 0.6, damp: 0.2, volume: -2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 900, sensitivity: -55 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 7, size: 0.8, mix: 0.45 } },
    ],
  },
  {
    id: 'paired-bronze-both-gongs-down-valley',
    name: 'Both gongs down valley',
    category: 'bell',
    description:
      'Soft metal pairs 1.4 hertz apart with the octave added above, heard from the far end of a ten second valley.',
    preview: GONG_ROUND,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow metal bowl',
      params: { beat: 1.4, mallet: 0.3, tone: 0.6, decay: 18, volume: -0.5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0, up1: 0.5, dry: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.6, damping: 0.6 } },
    ],
  },
  // Twin bars, 5 a second.
  {
    id: 'paired-bronze-ten-keys-under-thatch',
    name: 'Ten keys under thatch',
    category: 'bell',
    description:
      'Metal pairs five hertz apart under a plain mallet, nine seconds long, dry but for a compressor holding up the ring.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      params: {
        beat: 5,
        mallet: 0.55,
        decay: 9,
        ears: 0.35,
        tone: 0.45,
        damp: 0.15,
        volume: -12.5,
      },
    },
    effects: [{ deviceId: 'ambient-comp', preset: 'Long sustain' }],
  },
  {
    id: 'paired-bronze-knock-in-the-tube',
    name: 'Knock in the tube',
    category: 'plucked',
    description:
      'Hard wood pairs five hertz apart played inside an open pipe, with a very small dark room around it.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood knock',
      params: { beat: 5, decay: 0.8, tone: 0.5, ears: 0.5, volume: 0 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { size: 1.5, material: 0.4, mix: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paired-bronze-marigold-sparks',
    name: 'Marigold sparks',
    category: 'bell',
    description:
      'Glass pairs under a medium mallet, five a second, throwing bright pieces up a twelfth, on a bright plate.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Glass, middle',
      params: { beat: 5, decay: 4, mallet: 0.6, tone: 0.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Fifths above', params: { density: 9, mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'paired-bronze-stopped-in-the-nave',
    name: 'Stopped in the nave',
    category: 'bell',
    description:
      'Short hard metal pairs, five a second, almost lost in a far hall of five seconds.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Three, short',
      params: { beat: 5, decay: 1.2, damp: 0.9, tone: 0.75, volume: -2 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.75, damping: 5000 } },
    ],
  },
  {
    id: 'paired-bronze-procession-far-below',
    name: 'Procession far below',
    category: 'texture',
    description:
      'Metal pairs five hertz apart laid into four loops of unequal length that keep turning, heard from a far shore.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Six, one an ear',
      params: { beat: 5, decay: 5, mallet: 0.5, tone: 0.15, volume: -5 },
    },
    effects: [
      { deviceId: 'orbits', preset: 'Wide weave', params: { feedback: 0.85, mix: 0.55 } },
      { deviceId: 'distance', preset: 'Far shore', params: { wander: 0 } },
    ],
  },
  // Twin bars, 6.5 a second.
  {
    id: 'paired-bronze-kantil-on-the-mat',
    name: 'Kantil on the mat',
    category: 'bell',
    description:
      'The smallest bars: bright hard metal pairs at 6.5 hertz, choked short and played through a bright combo up close.',
    preview: SMALL_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: {
        beat: 6.5,
        mallet: 0.95,
        tone: 0.95,
        decay: 1.4,
        damp: 0.8,
        ears: 0.15,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { room: 0.1, distance: 0.1 } },
    ],
  },
  {
    id: 'paired-bronze-two-smiths-not-together',
    name: 'Two smiths not together',
    category: 'bell',
    description:
      'The second bar of each 6.5 hertz pair lands forty milliseconds late in the other ear, in a bright chamber pulled wide.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: { beat: 6.5, decay: 4, mallet: 0.65, tone: 0.4, volume: -0.5 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.35 } },
      { deviceId: 'spread', preset: 'Everything wide' },
    ],
  },
  {
    id: 'paired-bronze-grantang-by-torchlight',
    name: 'Grantang by torchlight',
    category: 'plucked',
    description:
      'Wood pairs flammed and beating at 6.5 hertz, with worn tape repeats behind them and a three second hall.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { beat: 6.5, decay: 2.4, tone: 0.3, mallet: 0.5, volume: 1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 600, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'paired-bronze-underfloor-of-the-temple',
    name: 'Underfloor of the temple',
    category: 'bass',
    description:
      'The low bars with no overtones at all, 6.5 a second, their tails lifted into a huge nave.',
    preview: LOW_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { beat: 6.5, tone: 0, mallet: 0, decay: 14, ears: 1, damp: 0.5, volume: -7 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -27, amount: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'paired-bronze-mist-takes-the-keys',
    name: 'Mist takes the keys',
    category: 'pad',
    description:
      'Bright glass pairs 6.5 hertz apart smeared until little but a hanging mist of them is left.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { beat: 6.5, damp: 0.1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.85, tilt: 1, mix: 0.85 },
      },
    ],
  },
  // Twin bars, 8 a second.
  {
    id: 'paired-bronze-tin-bars-for-children',
    name: 'Tin bars for children',
    category: 'bell',
    description:
      'Hard metal pairs, eight a second, through a rough eight-bit toy of a converter and nothing after.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Eight, hard',
      params: { ears: 0, decay: 2, tone: 0.65, volume: -1.5 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Toy', params: { aliasing: 0.4 } }],
  },
  {
    id: 'paired-bronze-cup-of-rice-wine',
    name: 'Cup of rice wine',
    category: 'bell',
    description:
      'Glass pairs at eight hertz, both in the middle, with a short wide halo opening behind every stroke.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Ten in the air',
      params: { beat: 8, decay: 1.6, mallet: 0.25, tone: 0.6, volume: 3.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.55 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'paired-bronze-wood-wakes-the-bowls',
    name: 'Wood wakes the bowls',
    category: 'bell',
    description:
      'Wood pairs eight hertz apart over a table of seven bowls in pelog on C that ring on after them.',
    preview: THREE_SPEEDS,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Wood flutter',
      params: { beat: 8, decay: 1, tone: 0.7, volume: 6 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Pelog gongs', params: { root: 0, mix: 0.55 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paired-bronze-fifths-off-the-ceiling',
    name: 'Fifths off the ceiling',
    category: 'bell',
    description:
      'Round metal pairs, eight a second, whose ten second tail climbs a fifth on every pass.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: { beat: 8, mallet: 0.2, tone: 0.35, decay: 7, ears: 0.8, volume: -8 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { decay: 10, mix: 0.5 } }],
  },
  {
    id: 'paired-bronze-sinking-with-the-sun',
    name: 'Sinking with the sun',
    category: 'texture',
    description:
      'Metal pairs at eight hertz whose ring sags slowly flat while a half-minute tail glides down under it.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'twin-bars',
      params: { beat: 8, mallet: 0.4, tone: 0.6, decay: 12, damp: 0.05, ears: 0.5, volume: -3 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.6 } },
      { deviceId: 'spiral', preset: 'Slow descent', params: { decay: 30, size: 0.9, mix: 0.45 } },
    ],
  },
  // Glass: each note made one half of a pair, the other half a copy moved up by so many hertz. 0.7 a second.
  {
    id: 'paired-bronze-ombak-in-no-hurry',
    name: 'Ombak in no hurry',
    category: 'pad',
    description:
      'A pad of near sines fading in over a second and a copy 0.7 hertz above: one slow wave on every note, no room.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: {
        attack: 1,
        ratio: 1,
        brightness: 0.1,
        detune: 0,
        feedback: 0,
        spread: 0,
        volume: -18,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.7, mode: 0, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'paired-bronze-bronze-behind-the-loom',
    name: 'Bronze behind the loom',
    category: 'bell',
    description:
      'A dark bell struck once, its middle turned between the ears 0.7 times a second, in a small dark room.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { ratio: 4, brightness: 0.22, decay: 5, detune: 0, volume: -9 },
    },
    effects: [
      { deviceId: 'ear-shift', preset: 'Slow turn', params: { beat: 0.7, high: 1600 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { damping: 0.9, mix: 0.3 } },
    ],
  },
  {
    id: 'paired-bronze-lotus-pool-mallets',
    name: 'Lotus pool mallets',
    category: 'keys',
    description:
      'A clear glass mallet split by 0.7 hertz, half between the ears and half in the air, on a medium plate.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { ratio: 7, brightness: 0.35, decay: 2.2, detune: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 0.7, ears: 0.5, high: 2000 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'paired-bronze-the-big-one-in-shadow',
    name: 'The big one in shadow',
    category: 'bell',
    description:
      'A dark buzzing gong paired with itself 0.7 hertz up, its blow slightly blurred, in a cathedral.',
    preview: GONG_ROUND,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Dark gong',
      params: { detune: 0, brightness: 0.75, feedback: 0.6, decay: 5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.7, mode: 0, feedback: 0, lfoDepth: 0, width: 0.3, mix: 0.5 },
      },
      { deviceId: 'fog', preset: 'Short blur' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'paired-bronze-offering-let-go-at-sea',
    name: 'Offering let go at sea',
    category: 'drone',
    description:
      'Glass held for as long as the key and beating 0.7 times a second, shut out to sea in half a minute of dark space.',
    preview: HELD_GONGS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: { attack: 1.2, detune: 0, sustain: 1, brightness: 0.2, ratio: 3, volume: -15.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.7, mode: 1, feedback: 0, lfoDepth: 0, width: 0.8, mix: 0.5 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.55 } },
    ],
  },
  // 1.4 a second.
  {
    id: 'paired-bronze-tines-on-the-veranda',
    name: 'Tines on the veranda',
    category: 'keys',
    description:
      'Buzzing tine keys beating 1.4 times a second in the air, with short soft tape repeats.',
    preview: THREE_SPEEDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { decay: 1.1, brightness: 0.45, detune: 0, volume: -9 },
    },
    effects: [
      { deviceId: 'ear-shift', preset: 'Slow wave', params: { beat: 1.4 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'paired-bronze-coin-on-the-drum-lid',
    name: 'Coin on the drum lid',
    category: 'plucked',
    description:
      'A short hard bright ping with a partner 1.4 hertz up, in a drum skin and a close room.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: { brightness: 0.7, detune: 0, volume: -6 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.4, mode: 0, feedback: 0, lfoDepth: 0, width: 0.2, mix: 0.5 },
      },
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'paired-bronze-bowed-by-the-drizzle',
    name: 'Bowed by the drizzle',
    category: 'pad',
    description:
      'Rubbed glass a little buzzed, 1.4 hertz from its copy, with light rain tapping on it in a four second hall.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: { detune: 0, feedback: 0.5, ratio: 1, brightness: 0.45, volume: -12 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.4, mode: 0, feedback: 0, lfoDepth: 0, width: 0.6, mix: 0.5 },
      },
      { deviceId: 'weather', preset: 'Light rain' },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'paired-bronze-priests-answer-the-bowl',
    name: 'Priests answer the bowl',
    category: 'bell',
    description:
      'A clanging bowl beating 1.4 times a second in the air, under a low hall that hums like monks.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { brightness: 0.6, decay: 6, detune: 0, volume: -9 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 1.4, ears: 0, high: 2000 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'paired-bronze-swifts-over-the-cliff',
    name: 'Swifts over the cliff',
    category: 'bell',
    description:
      'Sine chimes barely coloured, 1.4 hertz between the ears, their tail scattering up and down as it rings.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: { detune: 0, decay: 3, brightness: 0.2, volume: -7 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.7, mode: 2, feedback: 0, lfoDepth: 0, width: 0, mix: 1 },
      },
      { deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 14, mix: 0.6 } },
    ],
  },
  // 5 a second.
  {
    id: 'paired-bronze-pengumbang-pengisep',
    name: 'Pengumbang, pengisep',
    category: 'bell',
    description:
      'A bar and its partner five hertz above, as loud as each other and both in the middle, with nothing but a tone control.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Chime bars',
      params: { ratio: 4, brightness: 0.3, decay: 5, detune: 0, spread: 0, volume: -17 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'paired-bronze-thimble-orchestra',
    name: 'Thimble orchestra',
    category: 'plucked',
    description:
      'Short toy keys, five hertz from their copies, ringing inside a thimble in a tight plate.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { detune: 0, brightness: 0.5, volume: -8 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.9, mix: 0.5 },
      },
      { deviceId: 'vessel', preset: 'Thimble', params: { mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'paired-bronze-pots-on-a-rope-rack',
    name: 'Pots on a rope rack',
    category: 'bell',
    description:
      'A round pot tone, five a second, setting off ten pelog bowls on C, the top spread wide.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { ratio: 2, brightness: 0.28, decay: 0.7, detune: 0, volume: -9 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.4, mix: 0.5 },
      },
      {
        deviceId: 'bowls',
        preset: 'Every attack',
        params: { scale: 7, bowls: 10, ring: 5, mix: 0.4 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'paired-bronze-strike-seen-in-a-mirror',
    name: 'Strike seen in a mirror',
    category: 'bell',
    description:
      'A glass bell five hertz from its partner whose every stroke draws a hall that rises backwards for four seconds.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { detune: 0, brightness: 0.35, volume: -9 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.5, mix: 0.5 },
      },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'paired-bronze-cloud-in-five-waves',
    name: 'Cloud in five waves',
    category: 'pad',
    description:
      'A bright organ-like glass whose middle band pulses five times a second over a breathing ten second valley.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { attack: 0.3, release: 2, brightness: 0.45, ratio: 5, volume: -13 },
    },
    effects: [
      { deviceId: 'band-pulse', params: { rate: 5, depth: 0.9, edge: 40, low: 200, high: 3000 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { breathDepth: 0.4 } },
    ],
  },
  // 6.5 a second.
  {
    id: 'paired-bronze-calung-through-valves',
    name: 'Calung through valves',
    category: 'bass',
    description:
      'A low mallet tone with an octave below inside it, 6.5 hertz apart from its copy, pushed through a hot tube stage.',
    preview: LOW_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { ratio: 0, brightness: 0.35, decay: 2.5, release: 1, detune: 0, volume: -9 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 0, mix: 0.4 },
      },
      { deviceId: 'saturator', preset: 'Tube preamp' },
    ],
  },
  {
    id: 'paired-bronze-wires-in-the-fence',
    name: 'Wires in the fence',
    category: 'keys',
    description:
      'A short pipe of glass, 6.5 a second between the ears, splashing about in a slack spring.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: {
        attack: 0.004,
        decay: 0.8,
        sustain: 0.2,
        release: 0.15,
        detune: 0,
        ratio: 5,
        brightness: 0.35,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 6.5, ears: 1, high: 2000 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { decay: 1.4 } },
    ],
  },
  {
    id: 'paired-bronze-sparks-off-the-anvil',
    name: 'Sparks off the anvil',
    category: 'bell',
    description:
      'Short bright bells 6.5 hertz from their doubles, flung about as a scatter of echoes with no pulse.',
    preview: SMALL_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { ratio: 8, brightness: 0.8, decay: 0.4, release: 0.8, detune: 0, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.3, mix: 0.5 },
      },
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'paired-bronze-rim-drawn-underground',
    name: 'Rim drawn underground',
    category: 'drone',
    description:
      'Bowed metal beating 6.5 times a second in a dark well built from a swarm of echoes.',
    preview: HELD_GONGS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: { detune: 0, brightness: 0.25, attack: 0.6, volume: -16 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 1, mix: 0.5 },
      },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'paired-bronze-kites-high-over-fields',
    name: 'Kites high over fields',
    category: 'bell',
    description:
      'A thin clang and its 6.5 hertz double with the octave and double octave above, hazed into a long glow.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 2, brightness: 0.3, decay: 1.2, detune: 0, volume: -13 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.5, mix: 0.5 },
      },
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'haze', preset: 'Octave glow', params: { decay: 16, mix: 0.5 } },
    ],
  },
  // 8 a second.
  {
    id: 'paired-bronze-sleet-of-small-keys',
    name: 'Sleet of small keys',
    category: 'bell',
    description:
      'Bright chimes eight hertz from their partners, dark repeats a third of a second apart drifting behind them.',
    preview: SMALL_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { detune: 0, brightness: 0.65, decay: 0.8, volume: -9 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 8, mode: 0, feedback: 0, lfoDepth: 0, width: 0.7, mix: 0.5 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 340, feedback: 0.55, mix: 0.4 },
      },
    ],
  },
  {
    id: 'paired-bronze-cracked-ketuk',
    name: 'Cracked ketuk',
    category: 'plucked',
    description:
      'A short buzzing pot with the octave below in it, eight hertz from its twin, opened by a touch filter and put in a stone room.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: {
        algorithm: 0,
        ratio: 0,
        brightness: 0.8,
        feedback: 0.7,
        decay: 0.25,
        detune: 0,
        volume: 4,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 8, mode: 0, feedback: 0, lfoDepth: 0, width: 0.1, mix: 0.5 },
      },
      { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.8 } },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { decay: 1.2 } },
    ],
  },
  {
    id: 'paired-bronze-bells-under-gauze',
    name: 'Bells under gauze',
    category: 'pad',
    description:
      'Bells with no attack left, only a deep fog of them, eight hertz from their copies on a dark plate.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: { ratio: 4, brightness: 0.6, decay: 4, detune: 0, volume: -7 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 8, mode: 0, feedback: 0, lfoDepth: 0, width: 0.6, mix: 0.5 },
      },
      { deviceId: 'fog', preset: 'Deep fog' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'paired-bronze-embers-in-the-shrine',
    name: 'Embers in the shrine',
    category: 'pad',
    description:
      'A warm pad whose bands flicker about eight times a second, each by itself, in a dark temple hall.',
    preview: HELD_GONGS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: { attack: 0.6, brightness: 0.6, ratio: 3, detune: 6, volume: -12 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer', params: { rate: 8, depth: 0.85 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { decay: 9, mix: 0.4 } },
    ],
  },
  {
    id: 'paired-bronze-highest-keys-of-all',
    name: 'Highest keys of all',
    category: 'bell',
    description:
      'Needle-thin bells eight hertz from their doubles, carried up and up by a tail that never arrives.',
    preview: SMALL_KEYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: {
        algorithm: 1,
        ratio: 9,
        brightness: 0.35,
        decay: 1,
        release: 2,
        attack: 0.002,
        detune: 0,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 8, mode: 0, feedback: 0, lfoDepth: 0, width: 0.4, mix: 0.5 },
      },
      { deviceId: 'spiral', preset: 'Rising hall', params: { mix: 0.5 } },
    ],
  },
  // Bells: every partial that rings in two is split by so many hertz, the lowest by the rate named. 0.7 a second.
  {
    id: 'paired-bronze-father-gong-uncovered',
    name: 'Father gong uncovered',
    category: 'bell',
    description:
      'A great gong struck soft a third of the way in, its lowest pair turning 0.7 times a second, with nothing but bass brought up.',
    preview: GONG_ROUND,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { detune: 0.7, hardness: 0.2, position: 0.3, brightness: 0.3, volume: -9 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Deep' }],
  },
  {
    id: 'paired-bronze-incense-bowl-indoors',
    name: 'Incense bowl indoors',
    category: 'drone',
    description:
      'A rubbed bowl whose halves part by 0.7 hertz, swung slowly on a wide arc in a small dark room.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { detune: 0.7, brightness: 0.65, hardness: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'paired-bronze-bars-for-the-slow-dance',
    name: 'Bars for the slow dance',
    category: 'keys',
    description:
      'Bars tuned in double octaves, 0.7 hertz apart, the attack softened, in a hall that rings two seconds and eight in the bass.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { detune: 0.7, hardness: 0.1, decay: 12, brightness: 0.35, release: 0.4, volume: -9 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },
  {
    id: 'paired-bronze-shadow-play-in-glass',
    name: 'Shadow play in glass',
    category: 'pad',
    description:
      'Rubbed glasses 0.7 hertz from themselves with eight sine shadows swelling behind them in a late hall.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { detune: 0.7, brightness: 0.3, volume: -13 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'paired-bronze-bell-tower-in-the-ash',
    name: 'Bell tower in the ash',
    category: 'bell',
    description:
      'A dull church bell, its hum split by 0.7 hertz, melting slowly flat in half a minute of huge space.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Distant bell',
      params: { detune: 0.7, hardness: 0.3, volume: -7 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 30, mix: 0.45 } },
    ],
  },
  // 1.4 a second.
  {
    id: 'paired-bronze-teak-gambang',
    name: 'Teak gambang',
    category: 'plucked',
    description:
      'Dry wood bars 1.4 hertz apart struck fairly hard, with a dotted bounce of tape behind them and no room.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { detune: 1.4, hardness: 0.65, decay: 0.9, volume: 3.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } }],
  },
  {
    id: 'paired-bronze-pot-gong-with-a-cloth',
    name: 'Pot gong with a cloth',
    category: 'bell',
    description:
      'A bowl struck well in from the rim and choked as the hand lifts, 1.4 a second, in a short stone stairwell.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        detune: 1.4,
        decay: 3,
        damping: 0.7,
        hardness: 0.6,
        position: 0.4,
        release: 0.9,
        stretch: 0.85,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.35, decay: 1.4 } },
    ],
  },
  {
    id: 'paired-bronze-eight-strings-hear-it',
    name: 'Eight strings hear it',
    category: 'bell',
    description:
      'A struck glass, its pair 1.4 hertz apart, waking strings that learn the notes it plays and hold them.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { detune: 1.4, hardness: 0.5, brightness: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { strings: 4, mix: 0.6 } },
    ],
  },
  {
    id: 'paired-bronze-gong-drawn-like-a-tide',
    name: 'Gong drawn like a tide',
    category: 'drone',
    description:
      'A rubbed gong with crowded overtones, 1.4 hertz in its lowest pair, rising and falling with a long breath in a nave.',
    preview: HELD_GONGS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { detune: 1.4, stretch: 0.7, volume: -9 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { depth: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
  // 5 a second.
  {
    id: 'paired-bronze-rindik-in-the-doorway',
    name: 'Rindik in the doorway',
    category: 'plucked',
    description:
      'Plucked tines five hertz apart, hard and short, through a wooden soundboard standing in the open.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { detune: 5, hardness: 0.75, decay: 1.6, volume: -5 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.7 } }],
  },
  {
    id: 'paired-bronze-cymbals-on-a-turtle',
    name: 'Cymbals on a turtle',
    category: 'texture',
    description:
      'Small gong plates struck hard and dry at the edge, five a second, tightened by a gated burst of room.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        detune: 5,
        decay: 1.5,
        damping: 0.6,
        hardness: 0.85,
        position: 0.05,
        brightness: 0.75,
        release: 0.5,
        stretch: 1.2,
        volume: -6.5,
      },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.5 } }],
  },
  {
    id: 'paired-bronze-gangsa-on-five',
    name: 'Gangsa on five',
    category: 'bell',
    description:
      'Uncut bars struck near the end, five hertz between the halves of each, seven seconds long on a thin late plate.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { detune: 5, decay: 7, hardness: 0.6, brightness: 0.5, volume: 1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.3 } }],
  },
  {
    id: 'paired-bronze-wedding-of-two-bowls',
    name: 'Wedding of two bowls',
    category: 'bell',
    description:
      'A bowl beating five times a second, with organ pipes at the fifth and the octave below speaking after it in a dark hall.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { detune: 5, decay: 8, hardness: 0.35, brightness: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { lowDecay: 6, midDecay: 5 } },
    ],
  },
  // 6.5 a second.
  {
    id: 'paired-bronze-reyong-for-four-men',
    name: 'Reyong for four men',
    category: 'bell',
    description:
      'A row of bright pot gongs at 6.5 hertz, their quiet ends pulled up level with the strokes, in a very short room.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        detune: 6.5,
        decay: 2.2,
        damping: 0.5,
        hardness: 0.7,
        position: 0.1,
        brightness: 0.7,
        stretch: 1.1,
        release: 0.6,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'lift', preset: 'Fill every gap' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'paired-bronze-cowbells-home-at-six',
    name: 'Cowbells home at six',
    category: 'bell',
    description:
      'Chimes split by 6.5 hertz and left to ring, skipping ten times from side to side as they fade, in a bright hall.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { detune: 6.5, decay: 4, hardness: 0.6, brightness: 0.6, volume: -2.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'paired-bronze-lamp-behind-the-screen',
    name: 'Lamp behind the screen',
    category: 'pad',
    description:
      'Bowed bells trembling 6.5 times a second in the hum, dimmed and narrowed as if heard from the next room.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { detune: 6.5, brightness: 0.5, volume: -8 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Through fog', params: { decay: 3 } },
      { deviceId: 'lift', preset: 'Warm floor' },
    ],
  },
  {
    id: 'paired-bronze-caldera-answers-late',
    name: 'Caldera answers late',
    category: 'bell',
    description:
      'Church bells with 6.5 hertz in the hum, a shadow an octave below, and a hall that comes a quarter second late.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { detune: 6.5, hardness: 0.45, decay: 12, brightness: 0.35, volume: -3 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Sub shadow', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },
  // 8 a second.
  {
    id: 'paired-bronze-kemong-marks-the-half',
    name: 'Kemong marks the half',
    category: 'bell',
    description:
      'A small choked gong, eight hertz in its lowest pair, coming round and round in a loop played again through a small bright room.',
    preview: THREE_SPEEDS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        detune: 8,
        decay: 4,
        damping: 0.8,
        hardness: 0.4,
        position: 0.45,
        brightness: 0.45,
        release: 0.4,
        spread: 0.3,
        volume: 2.5,
      },
    },
    effects: [
      { deviceId: 'generations', preset: 'Small bright room', params: { length: 1.56, mix: 0.45 } },
    ],
  },
  {
    id: 'paired-bronze-glass-shiver-after-rain',
    name: 'Glass shiver after rain',
    category: 'bell',
    description:
      'Glasses shivering at eight hertz with every quiet overtone turned up, on a small plate.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Shivering glass',
      params: { detune: 8, decay: 5, hardness: 0.65, volume: -3.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'paired-bronze-bars-rung-under-water',
    name: 'Bars rung under water',
    category: 'bell',
    description:
      'Long bars split by eight hertz, sunk just under the surface with a few bubbles, pushed up by a limiter in a tunnel.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { detune: 8, decay: 9, hardness: 0.4, brightness: 0.45, position: 0.3, volume: 1 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { mix: 0.8 } },
      { deviceId: 'fet-limiter', params: { inputGain: 9, outputGain: 3 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { width: 0.8 } },
    ],
  },
  {
    id: 'paired-bronze-tines-in-the-rice-sea',
    name: 'Tines in the rice sea',
    category: 'texture',
    description:
      'Short tines eight hertz apart raining back as grains an octave above in a valley without an end.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { detune: 8, hardness: 0.35, decay: 3, volume: -1 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { mix: 0.35 } },
    ],
  },
  // Mallets: the pair made by a shifted copy, by the motor in the tubes, or by the phrase. 0.7 a second.
  {
    id: 'paired-bronze-lower-brother-alone',
    name: 'Lower brother alone',
    category: 'keys',
    description:
      'One undoubled set of long soft resonated metal keys with no beat of its own: play each key and then its partner.',
    preview: TIDE_CAST,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.2, decay: 4, damper: 0.3, width: 0, volume: -12 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'paired-bronze-marimba-on-the-ebb',
    name: 'Marimba on the ebb',
    category: 'keys',
    description: 'A rolled marimba beating 0.7 times a second in the air in a close wooden room.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 6, mallet: 0.4, damper: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 0.7, ears: 0, high: 2000 } },
      { deviceId: 'vessel', preset: 'Hint of wood' },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'paired-bronze-celesta-in-long-water',
    name: 'Celesta in long water',
    category: 'keys',
    description:
      'An open celesta moved 0.7 hertz apart between the ears, drifting in bands like water in a four second hall.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { decay: 2, mallet: 0.35, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.35, mode: 2, feedback: 0, lfoDepth: 0, width: 0, mix: 1 },
      },
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, lowDecay: 4 } },
    ],
  },
  {
    id: 'paired-bronze-keys-left-in-the-forest',
    name: 'Keys left in the forest',
    category: 'bell',
    description:
      'Dark vibes on a 0.7 hertz pair, caught and held long past their end in a distant, smeared valley.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.1, decay: 2.5, damper: 0.1, volume: -10 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 0.7, ears: 0.5, high: 2000 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } },
      { deviceId: 'distance', preset: 'Lost in the hall', params: { distance: 0.6 } },
    ],
  },
  // 1.4 a second.
  {
    id: 'paired-bronze-grain-in-the-mortar',
    name: 'Grain in the mortar',
    category: 'plucked',
    description:
      'A hard xylophone left to ring, 1.4 hertz mostly between the ears, pressed by a limiter in the open yard.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 1.8, mallet: 0.75, volume: -7 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 1.4, ears: 0.7, low: 60, high: 2000 } },
      {
        deviceId: 'fet-limiter',
        preset: 'Gentle lift',
        params: { inputGain: 14, outputGain: -5.5 },
      },
    ],
  },
  {
    id: 'paired-bronze-tube-motors-at-noon',
    name: 'Tube motors at noon',
    category: 'keys',
    description:
      'Vibes with the motor turning 1.4 times a second and full tubes, through a wavering reel and a warm little spring.',
    preview: THREE_SPEEDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motorRate: 1.4, decay: 1.2, mallet: 0.4, width: 0.3, volume: -11 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, drive: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'paired-bronze-gender-under-the-puppets',
    name: 'Gender under the puppets',
    category: 'bell',
    description:
      'Soft celesta bars with full tubes and a partner 1.4 hertz up, each stroke followed by itself an octave lower.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.15, decay: 1.8, resonator: 1, damper: 0.4, volume: -10 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.4, mode: 0, feedback: 0, lfoDepth: 0, width: 0.5, mix: 0.5 },
      },
      { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.9, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'paired-bronze-stones-under-the-flood',
    name: 'Stones under the flood',
    category: 'bass',
    description:
      'A low marimba hum on a 1.4 hertz wave of its own, an octave of sub under it, in a black hall.',
    preview: LOW_KEYS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { decay: 3, mallet: 0.15, volume: -12 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      {
        deviceId: 'freq-shifter',
        params: { fine: 1.4, mode: 1, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } },
    ],
  },
  // 5 a second.
  {
    id: 'paired-bronze-higher-sister-alone',
    name: 'Higher sister alone',
    category: 'bell',
    description:
      'A bare hard glockenspiel, a single dry set with no pair made: strike each key and then its partner a few hertz up.',
    preview: CAST_TWICE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, decay: 2, width: 0, volume: -10 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'paired-bronze-hens-under-the-barn',
    name: 'Hens under the barn',
    category: 'plucked',
    description:
      'A warm xylophone beating at five hertz, mostly in the air, pecked into a patter of short echoes.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { mallet: 0.3, decay: 1.5, damper: 0.4, volume: -1 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 5, ears: 0.2, high: 2000 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering' },
    ],
  },
  {
    id: 'paired-bronze-vibes-on-five-waves',
    name: 'Vibes on five waves',
    category: 'keys',
    description:
      'Plain vibes with both motor and ear turning five times a second in a hall of two and a half seconds.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 0.9, motorRate: 5, mallet: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'ear-shift', preset: 'Five, a little air', params: { high: 1500 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'paired-bronze-torches-on-the-road',
    name: 'Torches on the road',
    category: 'texture',
    description:
      'A rolled glockenspiel with a partner five hertz away, pieces of it falling a fifth like ash in a cathedral.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel roll',
      params: { roll: 10, mallet: 0.15, damper: 0.3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.8, mix: 0.5 },
      },
      { deviceId: 'falling', preset: 'Falling leaves' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  // 6.5 a second.
  {
    id: 'paired-bronze-tingklik-at-the-inn',
    name: 'Tingklik at the inn',
    category: 'plucked',
    description: 'Marimba keys damped at once and paired at 6.5 hertz, out of a bedside speaker.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.7, decay: 0.7, damper: 0.8, resonator: 0.4, volume: -6 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 0, mix: 0.5 },
      },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  {
    id: 'paired-bronze-pemade-hammer-and-hand',
    name: 'Pemade, hammer and hand',
    category: 'bell',
    description:
      'Hard resonated glockenspiel keys stopped by the damper, 6.5 hertz in the ears, in a bright chamber.',
    preview: NEIGHBOURS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.9, decay: 0.6, damper: 0.8, resonator: 0.5, volume: -1.5 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 6.5, ears: 1, low: 60, high: 2000 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'paired-bronze-trompong-solo-at-dusk',
    name: 'Trompong solo at dusk',
    category: 'bell',
    description:
      'A celesta with its tubes trembling 6.5 times a second, with echoes that fall an octave, in a six second hall.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { motorRate: 6.5, motor: 1, mallet: 0.3, decay: 1.4, damper: 0.2, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 6, mix: 0.25 } },
    ],
  },
  {
    id: 'paired-bronze-sky-opens-over-paddies',
    name: 'Sky opens over paddies',
    category: 'pad',
    description:
      'Rolled vibes 6.5 hertz from their copies with each stroke softened, rising into a soft fifteen second shimmer.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { roll: 7, mallet: 0.4, motor: 0, volume: -10 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.6, mix: 0.5 },
      },
      { deviceId: 'swell', preset: 'Slow attack', params: { sensitivity: -55 } },
      { deviceId: 'shimmer', preset: 'Muffled choir' },
    ],
  },
  // 8 a second.
  {
    id: 'paired-bronze-tin-roof-xylophone',
    name: 'Tin roof xylophone',
    category: 'plucked',
    description:
      'A hard xylophone eight hertz from its double, rasped by a ring tuned to C, with no space behind it.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 1, mallet: 0.6, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 8, mode: 0, feedback: 0, lfoDepth: 0, width: 0.3, mix: 0.5 },
      },
      { deviceId: 'ring', preset: 'Tin box', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'paired-bronze-ankle-bells-of-a-dancer',
    name: 'Ankle bells of a dancer',
    category: 'bell',
    description:
      'Short glockenspiel keys split eight hertz between the ears, in a tight swarm of tiny echoes.',
    preview: SMALL_KEYS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 1, decay: 0.35, damper: 0.5, width: 0.7, volume: -0.5 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 8, ears: 1, low: 150, high: 2000 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
    ],
  },
  {
    id: 'paired-bronze-marimba-in-a-clay-jar',
    name: 'Marimba in a clay jar',
    category: 'keys',
    description:
      'A soft marimba beating eight times a second, spoken through a clay pot into a reverb that blooms open.',
    preview: THREE_SPEEDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.2, decay: 1.8, volume: -2 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 8, ears: 0, high: 2000 } },
      { deviceId: 'vessel', preset: 'Clay pot' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'paired-bronze-last-night-of-the-feast',
    name: 'Last night of the feast',
    category: 'bell',
    description:
      'Motor celesta at eight a second winding round itself in stacked octaves, then given to an endless plate.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Tremolo celesta',
      params: { motorRate: 8, mallet: 0.8, decay: 0.8, damper: 0, volume: -6.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  // Ice: cold plates for the same pairs.
  {
    id: 'paired-bronze-frozen-bar-cold-partner',
    name: 'Frozen bar, cold partner',
    category: 'bell',
    description:
      'A near ping of thick ice split by 0.7 hertz, its overtones in tune and hardly a shore to answer.',
    preview: KEMPYUNG,
    instrument: {
      deviceId: 'ice',
      preset: 'Ice bells',
      params: { thick: 0.8, bright: 0.3, ring: 12, volume: -3 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 0.7, ears: 0, high: 2000 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'paired-bronze-gong-beneath-the-floe',
    name: 'Gong beneath the floe',
    category: 'bell',
    description:
      'A deep dark floe with an octave under it and a copy 0.7 hertz up, breathing in a vast low nave.',
    preview: GONG_ROUND,
    instrument: {
      deviceId: 'ice',
      preset: 'Deep floe',
      params: { cracks: 0, ring: 18, volume: 1.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 0.7, mode: 0, feedback: 0, lfoDepth: 0, width: 0.4, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'paired-bronze-one-plate-unpaired',
    name: 'One plate, unpaired',
    category: 'bell',
    description:
      'A clean single ice ping with nothing beside it, so two keys a hertz or two apart can make the wave, in a small room.',
    preview: TIDE_CAST,
    instrument: {
      deviceId: 'ice',
      preset: 'Clear ping',
      params: { ring: 7, distance: 0.1, width: 0, bright: 0.4, volume: 3.5 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Room' },
      { deviceId: 'spread', preset: 'To the middle' },
    ],
  },
  {
    id: 'paired-bronze-thaw-on-the-high-lake',
    name: 'Thaw on the high lake',
    category: 'pad',
    description:
      'Slow thawing ice, its stroke swelled away, split by 1.4 hertz half between the ears and half in the air, in a cathedral.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'ice',
      preset: 'Slow thaw',
      params: { cracks: 0, bright: 0.5, thick: 0.5, volume: -0.5 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 1.4, ears: 0.5, high: 2000 } },
      {
        deviceId: 'swell',
        preset: 'Tide',
        params: { attack: 900, retrigger: 0, sensitivity: -55 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paired-bronze-ten-plates-of-slate-ice',
    name: 'Ten plates of slate ice',
    category: 'bell',
    description:
      'Stiff stretched plates, five hertz from their doubles, close by on a bright plate.',
    preview: TEN_KEYS,
    instrument: {
      deviceId: 'ice',
      preset: 'Plate tones',
      params: { ring: 4, thick: 0.6, shore: 0, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.3, mix: 0.5 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'paired-bronze-snow-on-the-kettles',
    name: 'Snow on the kettles',
    category: 'plucked',
    description: 'Brittle snaps of thin ice, five a second, galloping across two tape heads.',
    preview: THREE_TONES,
    instrument: {
      deviceId: 'ice',
      preset: 'Brittle snap',
      params: { ring: 0.8, crack: 0.6, volume: 6 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 5, mode: 0, feedback: 0, lfoDepth: 0, width: 0.5, mix: 0.5 },
      },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 600 } },
    ],
  },
  {
    id: 'paired-bronze-far-team-across-ice',
    name: 'Far team across ice',
    category: 'bell',
    description:
      'Distant chirps settling on a 6.5 hertz pair, with their own far shores and a thin veil of hall.',
    preview: FOUR_KEYS,
    instrument: {
      deviceId: 'ice',
      preset: 'Far shores',
      params: { distance: 0.7, ring: 3, volume: -5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 6.5, mode: 0, feedback: 0, lfoDepth: 0, width: 1, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'paired-bronze-frost-hammers-in-turn',
    name: 'Frost hammers in turn',
    category: 'bell',
    description:
      'Thin ice eight hertz from itself between the ears, zing and shimmer over the tone, opened by a short bloom.',
    preview: TWO_HANDS,
    instrument: {
      deviceId: 'ice',
      preset: 'Thin ice',
      params: { ring: 2, crack: 0.2, stretch: 0.2, cracks: 0, shore: 0.1, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { fine: 4, mode: 2, feedback: 0, lfoDepth: 0, width: 0, mix: 1 },
      },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 1.2 } },
    ],
  },
  {
    id: 'paired-bronze-pass-closed-by-winter',
    name: 'Pass closed by winter',
    category: 'texture',
    description:
      'Restless ice cracking on the held keys, eight a second, caught in a deep winter and a long valley.',
    preview: LONG_PELOG,
    instrument: {
      deviceId: 'ice',
      preset: 'Restless ice',
      params: { ring: 4, bright: 0.4, volume: 3 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 8, ears: 0.3, high: 2000 } },
      { deviceId: 'seasons', preset: 'Deep winter' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } },
    ],
  },
]
