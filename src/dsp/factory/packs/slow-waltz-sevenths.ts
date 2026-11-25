import { type FactoryPreset, type Phrase } from '../types'

// A low note on one, a soft seventh chord on two and a tune that enters late, three in a bar.
// Laid out by instrument, each walked by touch and length, then register and body, then by what the
// chain is for. Where an echo, a pan or a pulse keeps time, it keeps a beat or a bar at 75 a minute,
// or at 60 where the words say so.

// The sevenths the previews play, all on white keys.

// Fmaj7, Cmaj7, Fmaj7 at 75 a minute: a low note on one, the chord on two held through three.
// The two chords share C and E; E4 is the top of one and the middle of the other.
const ROCK: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.34, note: 41, gain: 0.72 },
    { atSec: 0.8, durSec: 1.54, note: 57, gain: 0.58 },
    { atSec: 0.8, durSec: 1.54, note: 60, gain: 0.58 },
    { atSec: 0.8, durSec: 1.54, note: 64, gain: 0.61 },
    { atSec: 2.4, durSec: 2.34, note: 48, gain: 0.72 },
    { atSec: 3.2, durSec: 1.54, note: 59, gain: 0.58 },
    { atSec: 3.2, durSec: 1.54, note: 64, gain: 0.58 },
    { atSec: 3.2, durSec: 1.54, note: 67, gain: 0.61 },
    { atSec: 4.8, durSec: 1.9, note: 41, gain: 0.72 },
    { atSec: 5.6, durSec: 1.1, note: 57, gain: 0.58 },
    { atSec: 5.6, durSec: 1.1, note: 60, gain: 0.58 },
    { atSec: 5.6, durSec: 1.1, note: 64, gain: 0.61 },
  ],
}

// Cmaj7, Fmaj7, Cmaj7 with the tune entering in bar two, a little after the low note: E, D, B
// (seventh and thirteenth of F, then the seventh of C).
const LATE_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.34, note: 48, gain: 0.72 },
    { atSec: 0.83, durSec: 1.51, note: 59, gain: 0.58 },
    { atSec: 0.83, durSec: 1.51, note: 64, gain: 0.58 },
    { atSec: 0.83, durSec: 1.51, note: 67, gain: 0.61 },
    { atSec: 2.4, durSec: 2.34, note: 41, gain: 0.72 },
    { atSec: 2.5, durSec: 1.45, note: 76, gain: 0.74 },
    { atSec: 3.23, durSec: 1.51, note: 57, gain: 0.58 },
    { atSec: 3.23, durSec: 1.51, note: 60, gain: 0.58 },
    { atSec: 3.23, durSec: 1.51, note: 64, gain: 0.61 },
    { atSec: 4.02, durSec: 0.78, note: 74, gain: 0.64 },
    { atSec: 4.8, durSec: 2.1, note: 48, gain: 0.72 },
    { atSec: 4.85, durSec: 2.1, note: 71, gain: 0.7 },
    { atSec: 5.63, durSec: 1.27, note: 59, gain: 0.58 },
    { atSec: 5.63, durSec: 1.27, note: 64, gain: 0.58 },
    { atSec: 5.63, durSec: 1.27, note: 67, gain: 0.61 },
  ],
}

// The dark half with the same spacing, Am7, Dm7, Am7, the chord on two leaned late and rolled.
// The tune: C, B, G (seventh and thirteenth of D, seventh of A).
const DARK_HALF: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.34, note: 45, gain: 0.72 },
    { atSec: 0.9, durSec: 1.44, note: 55, gain: 0.58 },
    { atSec: 0.935, durSec: 1.405, note: 60, gain: 0.58 },
    { atSec: 0.97, durSec: 1.37, note: 64, gain: 0.61 },
    { atSec: 2.4, durSec: 2.34, note: 38, gain: 0.72 },
    { atSec: 2.52, durSec: 1.45, note: 72, gain: 0.74 },
    { atSec: 3.3, durSec: 1.44, note: 53, gain: 0.58 },
    { atSec: 3.335, durSec: 1.405, note: 57, gain: 0.58 },
    { atSec: 3.37, durSec: 1.37, note: 60, gain: 0.61 },
    { atSec: 4.05, durSec: 0.75, note: 71, gain: 0.64 },
    { atSec: 4.8, durSec: 2.1, note: 45, gain: 0.72 },
    { atSec: 4.86, durSec: 2.1, note: 67, gain: 0.7 },
    { atSec: 5.7, durSec: 1.2, note: 55, gain: 0.58 },
    { atSec: 5.735, durSec: 1.165, note: 60, gain: 0.58 },
    { atSec: 5.77, durSec: 1.13, note: 64, gain: 0.61 },
  ],
}

// Four bars at 97, Fmaj7, Cmaj7, Fmaj7, Cmaj7, the chord on two left out of the fourth:
// only the low C and the seventh above it. The tune is E, D, B.
const NO_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 41, gain: 0.72 },
    { atSec: 0.62, durSec: 1.18, note: 57, gain: 0.58 },
    { atSec: 0.62, durSec: 1.18, note: 60, gain: 0.58 },
    { atSec: 0.62, durSec: 1.18, note: 64, gain: 0.61 },
    { atSec: 1.86, durSec: 1.8, note: 48, gain: 0.72 },
    { atSec: 2.48, durSec: 1.18, note: 59, gain: 0.58 },
    { atSec: 2.48, durSec: 1.18, note: 64, gain: 0.58 },
    { atSec: 2.48, durSec: 1.18, note: 67, gain: 0.61 },
    { atSec: 3.72, durSec: 1.8, note: 41, gain: 0.72 },
    { atSec: 3.75, durSec: 1.18, note: 76, gain: 0.74 },
    { atSec: 4.34, durSec: 1.18, note: 57, gain: 0.58 },
    { atSec: 4.34, durSec: 1.18, note: 60, gain: 0.58 },
    { atSec: 4.34, durSec: 1.18, note: 64, gain: 0.61 },
    { atSec: 4.96, durSec: 0.6, note: 74, gain: 0.64 },
    { atSec: 5.58, durSec: 1.52, note: 48, gain: 0.72 },
    { atSec: 5.63, durSec: 1.5, note: 71, gain: 0.7 },
  ],
}

// Fmaj7, Cmaj7, Dm7, Am7 in four bars at 97, the chord on two a shade early. The upper notes
// are A C E, B E G, A C F, G C E: nothing moves further than a third.
const FOUR_SEVENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 41, gain: 0.72 },
    { atSec: 0.58, durSec: 1.22, note: 57, gain: 0.58 },
    { atSec: 0.58, durSec: 1.22, note: 60, gain: 0.58 },
    { atSec: 0.58, durSec: 1.22, note: 64, gain: 0.61 },
    { atSec: 1.86, durSec: 1.8, note: 48, gain: 0.72 },
    { atSec: 2.44, durSec: 1.22, note: 59, gain: 0.58 },
    { atSec: 2.44, durSec: 1.22, note: 64, gain: 0.58 },
    { atSec: 2.44, durSec: 1.22, note: 67, gain: 0.61 },
    { atSec: 3.72, durSec: 1.8, note: 50, gain: 0.72 },
    { atSec: 4.3, durSec: 1.22, note: 57, gain: 0.58 },
    { atSec: 4.3, durSec: 1.22, note: 60, gain: 0.58 },
    { atSec: 4.3, durSec: 1.22, note: 65, gain: 0.61 },
    { atSec: 5.58, durSec: 1.42, note: 45, gain: 0.72 },
    { atSec: 6.16, durSec: 0.84, note: 55, gain: 0.58 },
    { atSec: 6.16, durSec: 0.84, note: 60, gain: 0.58 },
    { atSec: 6.16, durSec: 0.84, note: 64, gain: 0.61 },
  ],
}

// Rolled chords of four, Fmaj7, Cmaj7, Fmaj7, and a pick-up at the end of bar two: D to E, the ninth
// of C to the seventh of F.
const HARP_PICKUP: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.34, note: 41, gain: 0.7 },
    { atSec: 0.82, durSec: 1.52, note: 57, gain: 0.55 },
    { atSec: 0.895, durSec: 1.445, note: 60, gain: 0.55 },
    { atSec: 0.97, durSec: 1.37, note: 64, gain: 0.55 },
    { atSec: 1.045, durSec: 1.295, note: 69, gain: 0.58 },
    { atSec: 2.4, durSec: 2.34, note: 48, gain: 0.7 },
    { atSec: 3.22, durSec: 1.52, note: 59, gain: 0.55 },
    { atSec: 3.295, durSec: 1.445, note: 64, gain: 0.55 },
    { atSec: 3.37, durSec: 1.37, note: 67, gain: 0.55 },
    { atSec: 3.445, durSec: 1.295, note: 71, gain: 0.58 },
    { atSec: 4.05, durSec: 0.75, note: 74, gain: 0.64 },
    { atSec: 4.8, durSec: 1.7, note: 41, gain: 0.7 },
    { atSec: 4.84, durSec: 1.7, note: 76, gain: 0.72 },
    { atSec: 5.62, durSec: 0.88, note: 57, gain: 0.55 },
    { atSec: 5.695, durSec: 0.805, note: 60, gain: 0.55 },
    { atSec: 5.77, durSec: 0.73, note: 64, gain: 0.55 },
    { atSec: 5.845, durSec: 0.655, note: 69, gain: 0.58 },
  ],
}

// Am7, Dm7, Am7 for thumb and three fingers, spread; the tune stays by one note and enters in bar two:
// A, B, then C.
const THUMB_AND_THREE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.34, note: 45, gain: 0.72 },
    { atSec: 0.85, durSec: 1.49, note: 55, gain: 0.58 },
    { atSec: 0.875, durSec: 1.465, note: 60, gain: 0.58 },
    { atSec: 0.9, durSec: 1.44, note: 64, gain: 0.61 },
    { atSec: 2.4, durSec: 2.34, note: 50, gain: 0.72 },
    { atSec: 2.45, durSec: 1.5, note: 69, gain: 0.74 },
    { atSec: 3.25, durSec: 1.49, note: 57, gain: 0.58 },
    { atSec: 3.275, durSec: 1.465, note: 60, gain: 0.58 },
    { atSec: 3.3, durSec: 1.44, note: 65, gain: 0.61 },
    { atSec: 4, durSec: 0.8, note: 71, gain: 0.64 },
    { atSec: 4.8, durSec: 1.9, note: 45, gain: 0.72 },
    { atSec: 4.83, durSec: 1.9, note: 72, gain: 0.7 },
    { atSec: 5.65, durSec: 1.05, note: 55, gain: 0.58 },
    { atSec: 5.675, durSec: 1.025, note: 60, gain: 0.58 },
    { atSec: 5.7, durSec: 1, note: 64, gain: 0.61 },
  ],
}

// The tune alone, three bars at 75: E, D, then B held a whole bar, then G A B climbing back.
const TUNE_ENTERS: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 1.55, note: 76, gain: 0.65 },
    { atSec: 1.65, durSec: 0.75, note: 74, gain: 0.65 },
    { atSec: 2.45, durSec: 2.35, note: 71, gain: 0.65 },
    { atSec: 4.85, durSec: 0.75, note: 67, gain: 0.65 },
    { atSec: 5.65, durSec: 0.75, note: 69, gain: 0.65 },
    { atSec: 6.45, durSec: 0.71, note: 71, gain: 0.65 },
  ],
}

// The second half of the tune: E held a bar, then C and B, and G to close.
const TUNE_GOES_DOWN: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 2.35, note: 76, gain: 0.65 },
    { atSec: 2.45, durSec: 1.55, note: 72, gain: 0.65 },
    { atSec: 4.05, durSec: 0.75, note: 71, gain: 0.65 },
    { atSec: 4.85, durSec: 1.87, note: 67, gain: 0.65 },
  ],
}

// A tune for Am7, Dm7, Am7: E with F beside it, D and C, down to A.
const TUNE_IN_THE_DARK: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 1.55, note: 76, gain: 0.65 },
    { atSec: 1.65, durSec: 0.75, note: 77, gain: 0.65 },
    { atSec: 2.45, durSec: 1.55, note: 74, gain: 0.65 },
    { atSec: 4.05, durSec: 0.75, note: 72, gain: 0.65 },
    { atSec: 4.85, durSec: 1.87, note: 69, gain: 0.65 },
  ],
}

// A low tune over Fmaj7, Cmaj7, Am7: A G, E held, C D E.
const LOW_TUNE: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 1.55, note: 69, gain: 0.65 },
    { atSec: 1.65, durSec: 0.75, note: 67, gain: 0.65 },
    { atSec: 2.45, durSec: 2.35, note: 64, gain: 0.65 },
    { atSec: 4.85, durSec: 0.75, note: 60, gain: 0.65 },
    { atSec: 5.65, durSec: 0.75, note: 62, gain: 0.65 },
    { atSec: 6.45, durSec: 0.71, note: 64, gain: 0.65 },
  ],
}

// Two bars at 60 for what speaks slowly: F then A C E, C then G B E. E stays on top, A goes to G and
// C to B.
const HELD_PAIR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.95, note: 65, gain: 0.58 },
    { atSec: 1.03, durSec: 1.92, note: 69, gain: 0.58 },
    { atSec: 1.03, durSec: 1.92, note: 72, gain: 0.58 },
    { atSec: 1.03, durSec: 1.92, note: 76, gain: 0.58 },
    { atSec: 3, durSec: 3.9, note: 60, gain: 0.58 },
    { atSec: 4.03, durSec: 2.87, note: 67, gain: 0.58 },
    { atSec: 4.03, durSec: 2.87, note: 71, gain: 0.58 },
    { atSec: 4.03, durSec: 2.87, note: 76, gain: 0.58 },
  ],
}

// Two bars at 60 a minute, Fmaj7 and Cmaj7, with the E they share ringing across the bar line.
const E_IN_BOTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.95, note: 41, gain: 0.72 },
    { atSec: 1.03, durSec: 1.92, note: 57, gain: 0.6 },
    { atSec: 1.03, durSec: 1.92, note: 60, gain: 0.6 },
    { atSec: 1.03, durSec: 1.92, note: 64, gain: 0.58 },
    { atSec: 2, durSec: 4.2, note: 76, gain: 0.66 },
    { atSec: 3, durSec: 3.3, note: 48, gain: 0.72 },
    { atSec: 4.05, durSec: 2.25, note: 59, gain: 0.6 },
    { atSec: 4.05, durSec: 2.25, note: 67, gain: 0.6 },
  ],
}

// Only the low notes, one to a bar: F, C, D, A.
const FOUR_ONES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.78, note: 41, gain: 0.6 },
    { atSec: 1.86, durSec: 1.78, note: 48, gain: 0.6 },
    { atSec: 3.72, durSec: 1.78, note: 38, gain: 0.6 },
    { atSec: 5.58, durSec: 1.5, note: 45, gain: 0.6 },
  ],
}

// Fmaj7, Cmaj7, Fmaj7 at 75. The tune enters on two of the second bar and keeps by one note: B, C, then
// A (seventh and root of C, third of F).
const LEANS_ON_B: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.34, note: 41, gain: 0.72 },
    { atSec: 0.83, durSec: 1.51, note: 57, gain: 0.58 },
    { atSec: 0.83, durSec: 1.51, note: 60, gain: 0.58 },
    { atSec: 0.83, durSec: 1.51, note: 64, gain: 0.61 },
    { atSec: 2.4, durSec: 2.34, note: 48, gain: 0.72 },
    { atSec: 3.2, durSec: 0.8, note: 71, gain: 0.7 },
    { atSec: 3.23, durSec: 1.51, note: 59, gain: 0.58 },
    { atSec: 3.23, durSec: 1.51, note: 64, gain: 0.58 },
    { atSec: 3.23, durSec: 1.51, note: 67, gain: 0.61 },
    { atSec: 4.02, durSec: 0.75, note: 72, gain: 0.64 },
    { atSec: 4.8, durSec: 2.1, note: 41, gain: 0.72 },
    { atSec: 4.86, durSec: 1.9, note: 69, gain: 0.72 },
    { atSec: 5.63, durSec: 1.27, note: 57, gain: 0.58 },
    { atSec: 5.63, durSec: 1.27, note: 60, gain: 0.58 },
    { atSec: 5.63, durSec: 1.27, note: 64, gain: 0.61 },
  ],
}

// A lead made for a follower a bar behind at 75 and a fifth below: E, then C B over the follower's A,
// then A over F and G over E. Thirds, with B the one passing note.
const ROUND_AT_THE_FIFTH: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 2.35, note: 76, gain: 0.65 },
    { atSec: 2.45, durSec: 1.55, note: 72, gain: 0.65 },
    { atSec: 4.05, durSec: 0.75, note: 71, gain: 0.65 },
    { atSec: 4.85, durSec: 1.55, note: 69, gain: 0.65 },
    { atSec: 6.45, durSec: 0.71, note: 67, gain: 0.65 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // tine-piano
  {
    id: 'slow-waltz-sevenths-lamp-on-the-piano-lid',
    name: 'Lamp on the piano lid',
    category: 'keys',
    description:
      'Dark tines touched softly with the top rolled off, played through a combo shut in a cupboard, its lows warmed.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { volume: -16.5, bell: 0.03, hardness: 0.25, tone: 0.14, release: 0.4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard', params: { distance: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-one-pulse-to-the-beat',
    name: 'One pulse to the beat',
    category: 'keys',
    description:
      'Mono tines whose tremolo swells once a beat at 75 a minute, then a short tape slap and a spring.',
    preview: ROCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: {
        volume: -14,
        tremolo: 0.85,
        tremoloRate: 1.25,
        pan: 0,
        bark: 0.25,
        tone: 0.5,
        drive: 0.15,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-crossing-once-a-bar',
    name: 'Crossing once a bar',
    category: 'keys',
    description:
      'Tines that cross from ear to ear and back once in a bar at 75 a minute, bells up, with an airy hall behind.',
    preview: ROCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: {
        volume: -14,
        bell: 0.8,
        tremolo: 1,
        tremoloRate: 0.417,
        pan: 1,
        tone: 0.62,
        decay: 1.2,
        release: 0.5,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } }],
  },
  {
    id: 'slow-waltz-sevenths-glass-heel',
    name: 'Glass heel',
    category: 'bell',
    description:
      'Glassy tines, all bell and very bright, short, the lows cut away and a thin two-octave shimmer over them.',
    preview: NO_TWO,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 0.4, release: 0.7, tone: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 16000 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25, decay: 4 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-chairs-pushed-back',
    name: 'Chairs pushed back',
    category: 'keys',
    description:
      'Tines stopped almost at once, skipping away across a small dry room in closing steps.',
    preview: NO_TWO,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -10.5, decay: 0.3, release: 0.05, bark: 0.4, tone: 0.6 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { first: 400, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-held-right-through-three',
    name: 'Held right through three',
    category: 'pad',
    description:
      'Tines with their attack taken off, held four times as long, thickened by a slow ensemble in a warm hall.',
    preview: ROCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { bell: 0.15, decay: 4, release: 2, tone: 0.4, tremolo: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 260 } },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-firm-on-one',
    name: 'Firm on one',
    category: 'keys',
    description:
      'Barking tines pushed through a triode and a guitar combo close by, with no tremolo at all.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -14, bark: 0.7, hardness: 0.9, release: 0.2, drive: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.45 } },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { room: 0.25 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-dance-hall-under-water',
    name: 'Dance hall under water',
    category: 'texture',
    description:
      'Bell-less tines sunk a little under water, bubbles off the attacks, a slow ripple and a hazy plate far behind.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { volume: -14.5, tone: 0.3, tremolo: 0.2, release: 1.5, decay: 2 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Under', params: { depth: 0.4, bubbles: 0.6, rate: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-clockwork-on-the-tray',
    name: 'Clockwork on the tray',
    category: 'bell',
    description:
      'Bell tines squeezed into a toy body and stopped short, with a faint bright plate over them.',
    preview: NO_TWO,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 1, decay: 0.5, tremolo: 0, tone: 0.8, release: 0.15 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box', params: { size: -0.8 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-wax-side-of-the-waltz',
    name: 'Wax side of the waltz',
    category: 'keys',
    description:
      'Soft tines on an old disc at 78 turns: crackle, a pitch that rises and falls, a little dark spring under it.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { volume: -13.5, bell: 0.2, tremolo: 0, tone: 0.4, bark: 0.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { warp: 0.45 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-partner-a-bar-behind',
    name: 'Partner a bar behind',
    category: 'keys',
    description:
      'Plain tines and one follower that repeats them a bar later at 75 a minute, an octave up and fainter.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        volume: -14,
        bell: 0.6,
        bark: 0.15,
        tremolo: 0,
        tone: 0.7,
        drive: 0.02,
        decay: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { gap: 2.4, interval1: 12, mix: 0.4, tone: 9000 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-strings-at-table-nine',
    name: 'Strings at table nine',
    category: 'keys',
    description:
      'Dry tines with a slow string pad that grows behind each seventh and hangs on after it.',
    preview: ROCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tone: 0.5, bell: 0.3, release: 0.2, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 1.2, fall: 6, brightness: 4500, mix: 0.6 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-moth-wing-tremolo',
    name: 'Moth wing tremolo',
    category: 'keys',
    description: 'Thin bright tines fluttering eight times a second through a hollow slow flange.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { volume: -10, decay: 0.35, release: 0.3, tremolo: 1, tremoloRate: 8, tone: 1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.08, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-reed-band-in-the-corner',
    name: 'Reed band in the corner',
    category: 'keys',
    description:
      'Soft hammers on a fully barking pickup, so the tines drone like reeds, through a slow rotating horn.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { tremolo: 0, bark: 0.9, tone: 0.35, release: 0.25, volume: -19 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-steam-on-the-ballroom',
    name: 'Steam on the ballroom',
    category: 'pad',
    description:
      'Long tines with the bell up, diffused into a bright cloud with no tail and spread wide at the top.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { decay: 2, release: 1, tone: 0.95, bell: 0.9 },
    },
    effects: [
      {
        deviceId: 'fog',
        preset: 'Bright haze',
        params: { size: 350, soften: 0.6, lowCut: 60, mix: 0.9 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-brass-horn-of-the-player',
    name: 'Brass horn of the player',
    category: 'keys',
    description:
      'Overdriven tines through an old horn speaker close by, the lows gone, then a hot valve that wavers.',
    preview: ROCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: -6.5, drive: 0.6, tone: 0.6, bark: 0.5 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Station platform',
        params: { distance: 0.25, room: 0.2, noise: 0.2 },
      },
      { deviceId: 'patina', preset: 'Valve bloom', params: { drive: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-loft-above-the-floor',
    name: 'Loft above the floor',
    category: 'organ',
    description:
      'Bell tines doubled by flute pipes that speak late, the octave and the twelfth drawn, in a nave.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { volume: -14, bell: 0.4, tremolo: 0, decay: 0.7 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { speak: 400, sub: 0, octave: 0.8, twelfth: 0.45, mix: 0.8 },
      },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-turning-the-other-way',
    name: 'Turning the other way',
    category: 'keys',
    description:
      'Each seventh comes back reversed a beat later, an octave higher, under plain warm tines.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { volume: -13.5, tremolo: 0.1, tone: 0.45, bell: 0.2, bark: 0.15 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 800, pitch: 1, feedback: 0.25, mix: 0.45, tone: 4500 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-two-bars-on-the-loop',
    name: 'Two bars on the loop',
    category: 'keys',
    description:
      'A glacial pan of tines laid on a two-bar tape loop that plays them back an octave lower, the lows held down.',
    preview: ROCK,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { volume: -12, bark: 0.2, tone: 0.35, release: 1, tremolo: 0.6 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4.8, feedback: 0.6, mix: 0.55 },
      },
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 110, low: -3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-frost-on-the-window-seat',
    name: 'Frost on the window seat',
    category: 'bell',
    description:
      'Glass tines bent toward bell metal, each partial stretched a little, in a cold bright plate.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { volume: -15.5, decay: 2, release: 2, tone: 0.6, hardness: 0.6, bell: 0.8 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Glass bar', params: { stretch: 0.35, mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
  },
  // acoustic-guitar
  {
    id: 'slow-waltz-sevenths-nylon-by-the-cloakroom',
    name: 'Nylon by the cloakroom',
    category: 'plucked',
    description:
      'Nylon strings under a fingertip near the neck, close and nearly dry, with one tight room.',
    preview: THUMB_AND_THREE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: 1.5, position: 0.36, nail: 0.1, release: 0.8, sustain: 3, tone: 0.4 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } }],
  },
  {
    id: 'slow-waltz-sevenths-thumb-then-three-fingers',
    name: 'Thumb then three fingers',
    category: 'plucked',
    description:
      'A steel string played by the thumb, attacks sifted down and air brought up, in a small bright tank that rings on.',
    preview: THUMB_AND_THREE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: -3.5, tone: 0.95, strum: 60, body: 0.6, position: 0.3, sustain: 6 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers', params: { attacks: -24 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-twelve-strings-in-three',
    name: 'Twelve strings in three',
    category: 'plucked',
    description:
      'A twelve-string near the bridge, thinned below and swept by a slow hollow flange, on a long plate.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { volume: 2.5, nail: 0.45, position: 0.1, sustain: 8, release: 3, shimmer: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 14000 } },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { feedback: -45, mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-palm-for-two-and-three',
    name: 'Palm for two and three',
    category: 'plucked',
    description:
      'Muted steel strings, levelled flat, with a tape echo a beat behind at 75 a minute, dark and slowly fading.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { release: 0.3, volume: 3, sustain: 1.4, tone: 0.35, position: 0.14, nail: 0.15 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -11 } },
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 800, feedback: 0.5, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-strummed-past-the-beat',
    name: 'Strummed past the beat',
    category: 'plucked',
    description:
      'Steel chords spread from low to high as slowly as the hand goes, on tape that wavers and thickens the lows.',
    preview: ROCK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { strum: 120, release: 5, tone: 0.6, nail: 0.45 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus', params: { wow: 0.5, bump: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-box-with-no-strings',
    name: 'Box with no strings',
    category: 'plucked',
    description:
      'A thumbed guitar with its tone shut, played inside a large drum, so the hollow body answers most.',
    preview: THUMB_AND_THREE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: -0.5, tone: 0.05, sustain: 2, release: 0.5, strum: 30 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { size: 1.8, mix: 0.9 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-hem-along-the-floor',
    name: 'Hem along the floor',
    category: 'plucked',
    description:
      'Nylon pizzicato let out a little and levelled flat, each note scattered into the pattering of a small cave.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { release: 0.5, volume: 6, sustain: 1.8, body: 0.7, tone: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -9 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.35, lowCut: 250 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-stars-through-the-awning',
    name: 'Stars through the awning',
    category: 'plucked',
    description:
      'A firm pick on ringing steel, thinned, with sparks from its overtones drifting off either side, levelled.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -9.5, body: 0.15, nail: 0.6, sustain: 9, release: 6, shimmer: 0.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 11000 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -8 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-walnut-and-low-c',
    name: 'Walnut and low C',
    category: 'plucked',
    description:
      'A dark wooden guitar over strings tuned to C major that ring on in sympathy for many seconds.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: -2.5, tone: 0.25, release: 2, sustain: 5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { root: 0, mix: 0.55, width: 0.9 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bowed-with-the-thumb',
    name: 'Bowed with the thumb',
    category: 'string',
    description:
      'Steel strings left to ring with every pluck faded in, so chords rise as if bowed in a warm hall.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: 4, sustain: 12, release: 6, tone: 0.5, nail: 0.2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 500 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-kitchen-set-left-on',
    name: 'Kitchen set left on',
    category: 'plucked',
    description:
      'A steel guitar heard over a small medium-wave set: narrow, boxy, a little static between notes.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { volume: -4, sustain: 3, release: 0.5, tone: 0.8 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-one-star-over-the-bridge',
    name: 'One star over the bridge',
    category: 'plucked',
    description:
      'Strings plucked by the bridge with a single far echo, a bar behind at 75 a minute, then squeezed flat.',
    preview: THUMB_AND_THREE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: {
        position: 0.1,
        nail: 0.5,
        volume: -3,
        sustain: 6,
        release: 2.5,
        tone: 0.65,
        strum: 10,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { lowCut: 120 } },
      {
        deviceId: 'constellation',
        preset: 'One far star',
        params: { span: 2400, again: 0.2, mix: 0.4 },
      },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-twelve-in-a-lit-haze',
    name: 'Twelve in a lit haze',
    category: 'pad',
    description:
      'A drifting twelve-string run into a soft fuzz and a long room until its chords hang as one glow.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { volume: -3, nail: 0.1, strum: 100, tone: 0.35 },
    },
    effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.55, decay: 5 } }],
  },
  {
    id: 'slow-waltz-sevenths-walked-round-the-room',
    name: 'Walked round the room',
    category: 'plucked',
    description:
      'A nylon lullaby that swings wide to and fro once a bar at 75 a minute, coming near as it passes.',
    preview: ROCK,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: 0, tone: 0.6, strum: 40, release: 4 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.417, near: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-nylon-in-the-rotor',
    name: 'Nylon in the rotor',
    category: 'plucked',
    description:
      'Nylon near the bridge evened by a limiter, through a slow rotating cabinet set well back.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { sustain: 5, release: 2, tone: 0.6, body: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'rotary', preset: 'Across the room' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-last-couple-leaving',
    name: 'Last couple leaving',
    category: 'plucked',
    description:
      'A bare steel string with hardly a body, moved to the back of the hall until the top is lost.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -2, sustain: 5, release: 2 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall', params: { air: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-low-guest-at-the-wall',
    name: 'Low guest at the wall',
    category: 'plucked',
    description:
      'Steel fingerstyle with the octave below added under every note and the warmth of a transformer.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { sustain: 4, release: 0.8, nail: 0.2, position: 0.25, tone: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.9, filter: 700 } },
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-lilt-on-the-blue-hour',
    name: 'Lilt on the blue hour',
    category: 'plucked',
    description:
      'A nylon guitar swept by a slow triangle phaser that takes many bars to come round.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: 3, tone: 0.75, nail: 0.5, position: 0.15, sustain: 6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { feedback: 55, mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-mist-at-the-bandstand',
    name: 'Mist at the bandstand',
    category: 'pad',
    description:
      'A chiming twelve-string smeared so every partial hangs, the plucks softened and the top rolled away.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { volume: -2, sustain: 4, nail: 0.5, tone: 0.6 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.75 } }],
  },
  {
    id: 'slow-waltz-sevenths-cassette-in-the-parlour',
    name: 'Cassette in the parlour',
    category: 'plucked',
    description:
      'Thin steel strings plucked hard at the bridge on a chewed cassette, then muffled by an early sampler.',
    preview: THUMB_AND_THREE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -1.5, position: 0.07, nail: 0.8, sustain: 2, release: 0.3, tone: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Chewed cassette', params: { hiss: 0.2 } },
      { deviceId: 'patina', preset: 'Muffled sampler', params: { noise: 0.1 } },
    ],
  },
  // flute
  {
    id: 'slow-waltz-sevenths-flute-after-eight-bars',
    name: 'Flute after eight bars',
    category: 'wind',
    description:
      'A concert flute with little vibrato, its body made smaller, in a short room that swells and fades after each note.',
    preview: TUNE_ENTERS,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { vibrato: 0.15, chiff: 0.25, attack: 0.07, breath: 0.3 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.5 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { time: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-alto-by-the-long-window',
    name: 'Alto by the long window',
    category: 'wind',
    description:
      'A low flute with a warm wide vibrato, thickened by a tape preamp and laid in a dark plate.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { breath: 0.3, blow: 0.6, chiff: 0.3, release: 0.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-pipes-across-the-pond',
    name: 'Pipes across the pond',
    category: 'wind',
    description:
      'Panpipes with a hard puff at the start, each note skipping off over still water in many small steps.',
    preview: TUNE_GOES_DOWN,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, release: 0.25, blow: 0.4 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Rain on the lake', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 180 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-recorder-on-the-stair',
    name: 'Recorder on the stair',
    category: 'wind',
    description: 'A straight soft recorder with hardly a breath in it, far up a stone stairwell.',
    preview: TUNE_IN_THE_DARK,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.08, release: 0.3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'slow-waltz-sevenths-breath-before-the-bar',
    name: 'Breath before the bar',
    category: 'pad',
    description:
      'A low flute made mostly of breath, its bands drifting past each other like water, with a hazy plate behind.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.9, release: 1.6, breath: 0.85 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.3, depth: 0.7 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bamboo-leaning-on-e',
    name: 'Bamboo leaning on E',
    category: 'wind',
    description:
      'Bamboo with a very deep vibrato and a wobbling tape echo one beat behind at 75 a minute.',
    preview: TUNE_IN_THE_DARK,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.15, release: 0.8, breath: 0.2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Wobbly double',
        params: { time: 800, feedback: 0.35, mix: 0.35 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-thirds-under-the-tune',
    name: 'Thirds under the tune',
    category: 'wind',
    description:
      'A straight flute tone that carries a third above and a sixth below in C, one to each side, nearly dry.',
    preview: TUNE_GOES_DOWN,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { volume: -1.5, attack: 0.1, release: 0.5, blow: 0.4 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { mix: 55 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-whisper-on-two',
    name: 'Whisper on two',
    category: 'wind',
    description:
      'Panpipes that are nearly all air, gusts of wind moving their level and tone, the quiet end raised.',
    preview: TUNE_ENTERS,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { volume: -13.5, attack: 0.12, release: 1 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.2 } },
      { deviceId: 'ambient-comp', preset: 'Raise the quiet' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bent-up-into-the-seventh',
    name: 'Bent up into the seventh',
    category: 'wind',
    description:
      'A breathy bamboo flute scooped two hundred cents up into each note, left in a huge slow space.',
    preview: TUNE_IN_THE_DARK,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: { breath: 0.5, blow: 0.6, chiff: 0.6 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.7, decay: 8, mix: 0.4 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-hollow-pipes-hold-hands',
    name: 'Hollow pipes hold hands',
    category: 'pad',
    description:
      'Hollow pipes fading in, with an octave below, a light fifth and a twelfth drawn over them as organ stops.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.6, release: 1.5, breath: 0.4 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Hollow fifths',
        params: { sub: 0.6, fifth: 0.4, twelfth: 0.5, mix: 0.7 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-sixteen-late-flutes',
    name: 'Sixteen late flutes',
    category: 'pad',
    description:
      'A wood flute that rises slowly, turned into a flock of sixteen flying round you some way off.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { volume: -13.5, attack: 1, release: 2, breath: 0.3 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { range: 16, mix: 0.65 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-gallery-over-the-floor',
    name: 'Gallery over the floor',
    category: 'wind',
    description:
      'A hard blown flute, close and forward, with short moments of the tune drifting back under it.',
    preview: TUNE_ENTERS,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0.4, blow: 0.85, release: 0.3 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Glimpses', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-second-flute-a-bar-late',
    name: 'Second flute a bar late',
    category: 'wind',
    description:
      'A wood flute whose follower plays the tune a bar behind at 75 a minute, a fifth below.',
    preview: ROUND_AT_THE_FIFTH,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { scoop: 10, chiff: 0.3, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { followers: 1, gap: 2.4, interval1: -7, fade: 0.1, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-low-c-in-the-cloister',
    name: 'Low C in the cloister',
    category: 'wind',
    description:
      'A soft low flute answered by a hall shaped to a closed vowel, so the tail hums under the tune.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { volume: -13, attack: 0.2, release: 1.5, breath: 0.25, vibrato: 0.15 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 4, mix: 0.45 } }],
  },
  {
    id: 'slow-waltz-sevenths-trembles-once-it-is-held',
    name: 'Trembles once it is held',
    category: 'wind',
    description:
      'A soft flute with no vibrato of its own that begins to sway only when a note has been held a while.',
    preview: TUNE_ENTERS,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { vibrato: 0, breath: 0.65, scoop: 0, blow: 0.15 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 600, depth: 45 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-flute-from-the-archive',
    name: 'Flute from the archive',
    category: 'wind',
    description:
      'A concert flute on a thin worn reel, the pitch wandering, heard from a small speaker by a bed.',
    preview: LOW_TUNE,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { type: 0, breath: 0.15, vibrato: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.3 } },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  // harp
  {
    id: 'slow-waltz-sevenths-pedal-harp-in-the-alcove',
    name: 'Pedal harp in the alcove',
    category: 'plucked',
    description:
      'A harp plucked near the middle with its sympathetic strings quiet, warmed, in a tight chamber.',
    preview: HARP_PICKUP,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { halo: 0.1, touch: 0.25, decay: 0.7, body: 0.9 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-hand-laid-on-the-strings',
    name: 'Hand laid on the strings',
    category: 'plucked',
    description:
      'A muted harp whose damped notes tap away on a dark bucket-brigade echo, two thirds of a beat at 75 a minute.',
    preview: LEANS_ON_B,
    instrument: { deviceId: 'harp', preset: 'Muted harp', params: { damp: 0.95, touch: 0.5 } },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 533, feedback: 0.5, mix: 0.45 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-silk-turns-on-the-spot',
    name: 'Silk turns on the spot',
    category: 'plucked',
    description:
      'Koto strings near the bridge, hard and bright, through a slow twelve-stage phaser, levelled at the end.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: 6, touch: 0.7, decay: 1.4, halo: 0.2 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -8 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bowls-beneath-the-roll',
    name: 'Bowls beneath the roll',
    category: 'plucked',
    description:
      'Harp chords rolled slowly by the instrument, with bowls tuned to C that ring where a note meets them.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -1, sweep: 0.8, halo: 0.4, decay: 1 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Bowl table', params: { root: 0, scale: 2, ring: 6, mix: 0.5 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-crystal-on-the-sideboard',
    name: 'Crystal on the sideboard',
    category: 'plucked',
    description:
      'A glassy long-ringing harp thrown upward in grains that climb an octave with each repeat.',
    preview: HARP_PICKUP,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { decay: 1.5, body: 0.1, touch: 0.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 800, mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 12000 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-half-the-pace-below',
    name: 'Half the pace below',
    category: 'plucked',
    description:
      'A dark hollow harp with the same chords running beneath it at half speed, an octave down.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -3, decay: 0.9, halo: 0.2 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.5, highCut: 2500 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-guzheng-at-the-matinee',
    name: 'Guzheng at the matinee',
    category: 'plucked',
    description:
      'Steel guzheng strings, long and bright, with a wide slow flange turning inside each chord.',
    preview: THUMB_AND_THREE,
    instrument: { deviceId: 'harp', preset: 'Guzheng', params: { volume: 3, halo: 0.2, decay: 2 } },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { mix: 0.5 } },
      { deviceId: 'spread', preset: 'Tight shimmer' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-close-to-the-soundboard',
    name: 'Close to the soundboard',
    category: 'plucked',
    description:
      'A harp plucked low by its board and pressed into the colour of a dark box, short and woody.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: -0.5, decay: 0.4, body: 1, halo: 0 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Dark box' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-dry-pluck-in-three-parts',
    name: 'Dry pluck in three parts',
    category: 'plucked',
    description:
      'Short damped plucks split into three colours, each echoed at its own time from low to high.',
    preview: HARP_PICKUP,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { decay: 0.35, body: 0.5 } },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      {
        deviceId: 'prism',
        preset: 'Low to high',
        params: { time: 1600, bands: 3, feedback: 0.35, mix: 0.5 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-only-as-long-as-held',
    name: 'Only as long as held',
    category: 'pad',
    description:
      'A harp that rings while held, half of it faded in behind the beat, in a deep slow chorus.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { volume: 0, halo: 0.9, decay: 4, touch: 0.05 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 600 } },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-silk-tired-by-midnight',
    name: 'Silk tired by midnight',
    category: 'plucked',
    description:
      'Soft silk strings on a tail that sags and darkens the longer it rings, like wax running.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 1, bend: 0, halo: 0.5, body: 1, decay: 0.8 },
    },
    effects: [{ deviceId: 'melt', preset: 'Wobbly wax', params: { mix: 0.55 } }],
  },
  // chord-harp
  {
    id: 'slow-waltz-sevenths-plate-in-the-evening',
    name: 'Plate in the evening',
    category: 'plucked',
    description:
      'The held chord swept up two octaves of soft plucked strings, no pad, with a cluster of short tape echoes.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { volume: -2.5, strum: 25, span: 1, pad: 0, sustain: 1.6, tone: 0.35 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { mix: 0.25 } }],
  },
  {
    id: 'slow-waltz-sevenths-ballroom-stair-downward',
    name: 'Ballroom stair downward',
    category: 'plucked',
    description:
      'Slow sweeps that go up and come down again, with the tail of each reversed and rising after it.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { strum: 75, tone: 0.55, sustain: 4 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.4, mix: 0.45 } }],
  },
  {
    id: 'slow-waltz-sevenths-one-chime-to-each-key',
    name: 'One chime to each key',
    category: 'bell',
    description:
      'No sweep, one chime to each key, half of the sound rung against a high C into smaller bells.',
    preview: NO_TWO,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Single chimes',
      params: { volume: -6.5, sustain: 2, tone: 0.75, spread: 0.9 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-reed-organ-with-no-hands',
    name: 'Reed organ with no hands',
    category: 'organ',
    description:
      'The pad of the instrument full up with a soft pluck at each key, through a slow rotating cabinet in mono.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { tone: 0.4, sustain: 1 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Mono cabinet' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-penny-harp-at-the-fair',
    name: 'Penny harp at the fair',
    category: 'plucked',
    description:
      'A toy sweep of two octaves, downward and bright, reduced to a coarse early sampler.',
    preview: NO_TWO,
    instrument: { deviceId: 'chord-harp', preset: 'Toy harp', params: { sustain: 0.8, tone: 1 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy', params: { mix: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-ribbons-let-down',
    name: 'Ribbons let down',
    category: 'plucked',
    description:
      'Four octaves falling with every chord, ringing on through an octave shift that sinks in the tail.',
    preview: ROCK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Falling harp',
      params: { strum: 90, sustain: 2.5, tone: 0.7, span: 3 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 6, bloom: 0.7, mix: 0.5 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-coats-over-the-strings',
    name: 'Coats over the strings',
    category: 'pad',
    description:
      'A muffled slow sweep with its pad up, on an old cassette that has lost everything above the voice.',
    preview: ROCK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { strum: 60, sustain: 3, pad: 0.6 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2, tone: 0.3 } }],
  },
  {
    id: 'slow-waltz-sevenths-box-that-plays-in-three',
    name: 'Box that plays in three',
    category: 'bell',
    description:
      'A small music box skipping away in six even half-beat steps, at 75 a minute, that cross the speakers.',
    preview: ROCK,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Small music box',
      params: { sustain: 0.5, span: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 400, skips: 6, mix: 0.4 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-dark-wash-on-two',
    name: 'Dark wash on two',
    category: 'pad',
    description:
      'A quick up and down sweep with a very long ring, every partial smeared into a dull wide wash.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Dark long wash',
      params: { volume: -19.5, sustain: 6, tone: 0.1, pad: 0.3 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.7 } },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  // felt-piano
  {
    id: 'slow-waltz-sevenths-upright-against-the-wall',
    name: 'Upright against the wall',
    category: 'keys',
    description:
      'A worn upright, mono and creaking, with its room shut off and one slack dripping spring instead.',
    preview: ROCK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -18.5, reverbMix: 0, width: 0, detune: 0.6 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.22 } },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-felt-with-a-held-shadow',
    name: 'Felt with a held shadow',
    category: 'keys',
    description:
      'A close felt piano with pure sines swelling in an octave below its strongest partials.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { outputDb: -18.5, reverbMix: 0, grit: 0 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5, release: 4 } }],
  },
  {
    id: 'slow-waltz-sevenths-thuds-under-the-carpet',
    name: 'Thuds under the carpet',
    category: 'keys',
    description:
      'A piano of soft thuds through a pillow speaker, its level pulsing once a beat at 75 a minute.',
    preview: DARK_HALF,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0.1, thump: 0.7 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 1.25, depth: 0.45 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-noon-on-the-upright',
    name: 'Noon on the upright',
    category: 'keys',
    description:
      'A bare hard-hammered piano, stiff and stretched, with slow glints two octaves over it.',
    preview: NO_TWO,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -8.5, reverbMix: 0.1, stiffness: 1.6 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-waltz-from-the-next-room',
    name: 'Waltz from the next room',
    category: 'keys',
    description:
      'A felt piano heard through a wall, far off and dull, with the warmth of soft tape on it.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { thump: 0.3, hardness: 0.6, felt: 0.45, outputDb: -16, reverbMix: 0.3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-sevenths-in-slow-water',
    name: 'Sevenths in slow water',
    category: 'pad',
    description:
      'A pedalled felt wash with its attacks removed and a deep slow chorus moving under it.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.2, resonance: 0.6, hardness: 0.15 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad' },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-candle-for-each-bar',
    name: 'Candle for each bar',
    category: 'keys',
    description:
      'Still strings with no beating, each chord answered by slow sighs that drop in pitch as they fade.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -17.5, reverbMix: 0, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  // afterglow
  {
    id: 'slow-waltz-sevenths-felt-that-stays-for-tea',
    name: 'Felt that stays for tea',
    category: 'keys',
    description:
      'Felt strikes whose overtones rise in half a second to a low plain glow and go soon after, in a dark hall.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { volume: -13.5, bloom: 0.5, fade: 1, halo: 0, tone: 0.3, evolve: 0.1, width: 0.2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } }],
  },
  {
    id: 'slow-waltz-sevenths-chandelier-lit-slowly',
    name: 'Chandelier lit slowly',
    category: 'bell',
    description:
      'Bell strikes with a bright halo, the light in each band flickering by itself at a quick rate.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { strike: 0.9, decay: 3, fade: 3, halo: 0.8, tone: 0.7 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen', params: { depth: 0.8, rate: 4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-window-breathed-on',
    name: 'Window breathed on',
    category: 'pad',
    description:
      'Glass that is mostly glow, opening and closing on a breath as long as a bar at 60 a minute.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { bloom: 0.8, fade: 3, strike: 0.1 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.2, hold: 0.1, out: 1.6, rest: 0.1, depth: 0.6 },
      },
    ],
  },
  {
    id: 'slow-waltz-sevenths-plucked-and-kept-warm',
    name: 'Plucked and kept warm',
    category: 'plucked',
    description:
      'Plucks under a compressor that lifts what lingers until it is nearly as strong as what was struck, doubled wide.',
    preview: THUMB_AND_THREE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: -10, decay: 1, glow: 0.8, fade: 2.5, tone: 0.45 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
      { deviceId: 'stereo-detune', preset: 'Doubled' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-ghosts-of-the-last-set',
    name: 'Ghosts of the last set',
    category: 'pad',
    description:
      'Only the glow of the chords, with any tone two chords have in common held and changes let go.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.6, fade: 2, tone: 0.7 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-strike-and-no-more',
    name: 'Strike and no more',
    category: 'keys',
    description:
      'Only the strike, with no glow, its octaves repeated above and below in slow tiles.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the strike',
      params: { volume: -1, decay: 1.2, tone: 0.65 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bell-on-the-low-step',
    name: 'Bell on the low step',
    category: 'bell',
    description:
      'Low tide bells whose glow takes its time, beating a little off true, sunk in a deep pool of tail.',
    preview: LATE_TUNE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { decay: 5, bloom: 2, fade: 5 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.35 } },
      { deviceId: 'melt', preset: 'Deep pool', params: { mix: 0.35 } },
    ],
  },
  // west-coast
  {
    id: 'slow-waltz-sevenths-low-gate-on-the-one',
    name: 'Low gate on the one',
    category: 'bass',
    description:
      'A round folded bass that darkens as it fades, one note to the bar, warmed by a transformer.',
    preview: FOUR_ONES,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { volume: -2.5, decay: 1.4, fold: 0.3, fm: 0.1 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'slow-waltz-sevenths-mallet-with-a-paper-head',
    name: 'Mallet with a paper head',
    category: 'keys',
    description:
      'A soft sine mallet through the gate, with a fast flutter of tape on every note and a small hall.',
    preview: LEANS_ON_B,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: -4.5, decay: 1.1, colour: 0.25, fold: 0.1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-reeds-folded-in-three',
    name: 'Reeds folded in three',
    category: 'pad',
    description:
      'Folded reed tones held through the bar, a low filter opening and closing once a bar at 60 a minute.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folded reeds',
      params: { volume: -9, fold: 0.35, symmetry: 0.6, attack: 0.3, drift: 0.15 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 900, lfoAmount: 45, lfoRateHz: 0.333 },
      },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-thumbs-over-the-sevenths',
    name: 'Thumbs over the sevenths',
    category: 'plucked',
    description:
      'A folded thumb piano answered by scattered echoes that never fall on the beat, all levelled after.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { volume: -3, decay: 1, fold: 0.3 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Scattered seven', params: { span: 1600, mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -10 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-sines-at-the-cloakroom',
    name: 'Sines at the cloakroom',
    category: 'pad',
    description:
      'Pure sines swelling in half a second, hazed by copies sharp and flat, with a faint shimmer an octave over.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { attack: 0.5, decay: 3, drift: 0.1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud' },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { decay: 4 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-chimes-turn-at-the-waist',
    name: 'Chimes turn at the waist',
    category: 'bell',
    description:
      'Small frequency-modulated chimes swinging in a figure of eight, with a short bright chamber.',
    preview: NO_TWO,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Small chimes',
      params: { volume: 0.5, decay: 1.4, fm: 0.35, colour: 0.8 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { rate: 0.417 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  // rewind
  {
    id: 'slow-waltz-sevenths-chord-drawn-back-to-two',
    name: 'Chord drawn back to two',
    category: 'keys',
    description:
      'A piano played backwards that gathers for a beat at 60 a minute, then lands and rings on.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'rewind',
      preset: 'Turned piano',
      params: { volume: -2, swell: 1, tail: 0.8, ghost: 0.1, tone: 0.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'slow-waltz-sevenths-steps-taken-back',
    name: 'Steps taken back',
    category: 'plucked',
    description:
      'Plucks that swell briefly and stop dead, worn by a hot valve, with a quick twang of spring.',
    preview: FOUR_SEVENTHS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { swell: 0.4, tail: 0, snap: 0.5, tone: 0.6 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bowls-gather-for-e',
    name: 'Bowls gather for E',
    category: 'drone',
    description:
      'Bowls that rise out of nothing for two seconds and ring on, one and two octaves doubled above them.',
    preview: HELD_PAIR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { volume: -2, swell: 2, tail: 1, shimmer: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.9, up2: 0.8 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'slow-waltz-sevenths-bell-let-go-on-three',
    name: 'Bell let go on three',
    category: 'bell',
    description:
      'Bells that strike only when the key is let go, after a swell of over a second, echoed a beat late at 60 a minute.',
    preview: E_IN_BOTH,
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { volume: 0, swell: 1.3, tail: 0.7, shimmer: 0.3, tone: 0.5 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Plain echo', params: { time: 1000, mix: 0.3 } }],
  },
]
