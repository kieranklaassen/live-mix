import { type FactoryPreset, type Phrase } from '../types'

// Every sound here touches something as it rings. Five families of about twenty, by what is touched:
// a curved bridge whose buzz climbs as a note dies, a skin that only loud notes wake, shells that an
// attack knocks, a leather strip, a sheet of paper. Inside a family the steps are where the thing
// rings, how long it goes on, how near it lies and which string, bar, voice or pipe it lies against.

// Drone strokes: the fifth, the octave twice, and the low tonic left to ring (A2, D3, D3, D2).
const STROKES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 45, gain: 0.6 },
    { atSec: 0.85, durSec: 2, note: 50, gain: 0.6 },
    { atSec: 1.6, durSec: 2, note: 50, gain: 0.5 },
    { atSec: 2.35, durSec: 1.35, note: 38, gain: 0.8 },
    { atSec: 3.7, durSec: 2, note: 45, gain: 0.6 },
    { atSec: 4.55, durSec: 2, note: 50, gain: 0.6 },
    { atSec: 5.3, durSec: 2, note: 50, gain: 0.5 },
    { atSec: 6.05, durSec: 1.35, note: 38, gain: 0.8 },
  ],
}
// The same strokes for a bass, one string at a time: E2, A2, A2, A1.
const LOW_STROKES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 40, gain: 0.6 },
    { atSec: 0.85, durSec: 0.7, note: 45, gain: 0.6 },
    { atSec: 1.6, durSec: 0.7, note: 45, gain: 0.5 },
    { atSec: 2.35, durSec: 1.3, note: 33, gain: 0.8 },
    { atSec: 3.7, durSec: 0.8, note: 40, gain: 0.6 },
    { atSec: 4.55, durSec: 0.7, note: 45, gain: 0.6 },
    { atSec: 5.3, durSec: 0.7, note: 45, gain: 0.5 },
    { atSec: 6.05, durSec: 1.3, note: 33, gain: 0.8 },
  ],
}
// Four single plucks, D4, C4, A3 and D3, each left alone long enough to open.
const OPENING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 62, gain: 0.75 },
    { atSec: 1.8, durSec: 1.8, note: 60, gain: 0.7 },
    { atSec: 3.6, durSec: 1.8, note: 57, gain: 0.7 },
    { atSec: 5.4, durSec: 1.9, note: 50, gain: 0.8 },
  ],
}
// A line that tries D, E and F, then C and D again, over D3 and A3 struck twice.
const UNFOLDING: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 50, gain: 0.55 },
    { atSec: 0, durSec: 3.5, note: 57, gain: 0.45 },
    { atSec: 0.4, durSec: 1.3, note: 62, gain: 0.6 },
    { atSec: 1.7, durSec: 0.5, note: 64, gain: 0.55 },
    { atSec: 2.2, durSec: 1.35, note: 65, gain: 0.65 },
    { atSec: 3.6, durSec: 3.7, note: 50, gain: 0.55 },
    { atSec: 3.6, durSec: 3.7, note: 57, gain: 0.45 },
    { atSec: 3.6, durSec: 0.5, note: 64, gain: 0.6 },
    { atSec: 4.1, durSec: 0.5, note: 62, gain: 0.5 },
    { atSec: 4.6, durSec: 0.5, note: 60, gain: 0.5 },
    { atSec: 5.1, durSec: 2.2, note: 62, gain: 0.65 },
  ],
}
// The same mode of D, unaccompanied, an octave higher and with turns.
const HIGH_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.35, note: 74, gain: 0.65 },
    { atSec: 1.4, durSec: 0.33, note: 72, gain: 0.5 },
    { atSec: 1.75, durSec: 0.33, note: 74, gain: 0.5 },
    { atSec: 2.1, durSec: 1.25, note: 76, gain: 0.65 },
    { atSec: 3.4, durSec: 0.38, note: 77, gain: 0.65 },
    { atSec: 3.8, durSec: 0.38, note: 76, gain: 0.55 },
    { atSec: 4.2, durSec: 0.78, note: 72, gain: 0.55 },
    { atSec: 5, durSec: 0.48, note: 69, gain: 0.5 },
    { atSec: 5.5, durSec: 1.8, note: 74, gain: 0.65 },
  ],
}
// Two hands on tongues in twelve: the left every three pulses, the right every two, through the open fifths of D, F, C and G.
const TONGUES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 74, gain: 0.7 },
    { atSec: 0, durSec: 0.7, note: 50, gain: 0.75 },
    { atSec: 0.54, durSec: 0.5, note: 69, gain: 0.6 },
    { atSec: 0.81, durSec: 0.7, note: 57, gain: 0.72 },
    { atSec: 1.08, durSec: 0.5, note: 74, gain: 0.6 },
    { atSec: 1.62, durSec: 0.5, note: 72, gain: 0.7 },
    { atSec: 1.62, durSec: 0.7, note: 53, gain: 0.75 },
    { atSec: 2.16, durSec: 0.5, note: 77, gain: 0.6 },
    { atSec: 2.43, durSec: 0.7, note: 60, gain: 0.72 },
    { atSec: 2.7, durSec: 0.5, note: 72, gain: 0.6 },
    { atSec: 3.24, durSec: 0.5, note: 72, gain: 0.7 },
    { atSec: 3.24, durSec: 0.7, note: 48, gain: 0.75 },
    { atSec: 3.78, durSec: 0.5, note: 67, gain: 0.6 },
    { atSec: 4.05, durSec: 0.7, note: 55, gain: 0.72 },
    { atSec: 4.32, durSec: 0.5, note: 72, gain: 0.6 },
    { atSec: 4.86, durSec: 0.5, note: 74, gain: 0.7 },
    { atSec: 4.86, durSec: 0.7, note: 55, gain: 0.75 },
    { atSec: 5.4, durSec: 0.5, note: 67, gain: 0.6 },
    { atSec: 5.67, durSec: 0.7, note: 62, gain: 0.72 },
    { atSec: 5.94, durSec: 0.5, note: 74, gain: 0.6 },
  ],
}
// Two players on bars in sixteen, one on the even strokes and one on the odd, with five strokes of C, A, E, E and G loud and the rest soft.
const BARS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.18, note: 60, gain: 0.85 },
    { atSec: 0.2, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 0.4, durSec: 0.18, note: 64, gain: 0.35 },
    { atSec: 0.6, durSec: 0.18, note: 57, gain: 0.85 },
    { atSec: 0.8, durSec: 0.18, note: 67, gain: 0.35 },
    { atSec: 1, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 1.2, durSec: 0.18, note: 64, gain: 0.85 },
    { atSec: 1.4, durSec: 0.18, note: 60, gain: 0.35 },
    { atSec: 1.6, durSec: 0.18, note: 62, gain: 0.35 },
    { atSec: 1.8, durSec: 0.18, note: 57, gain: 0.35 },
    { atSec: 2, durSec: 0.18, note: 64, gain: 0.85 },
    { atSec: 2.2, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 2.4, durSec: 0.18, note: 67, gain: 0.85 },
    { atSec: 2.6, durSec: 0.18, note: 57, gain: 0.35 },
    { atSec: 2.8, durSec: 0.18, note: 69, gain: 0.35 },
    { atSec: 3, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 3.2, durSec: 0.18, note: 60, gain: 0.85 },
    { atSec: 3.4, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 3.6, durSec: 0.18, note: 64, gain: 0.35 },
    { atSec: 3.8, durSec: 0.18, note: 57, gain: 0.85 },
    { atSec: 4, durSec: 0.18, note: 67, gain: 0.35 },
    { atSec: 4.2, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 4.4, durSec: 0.18, note: 64, gain: 0.85 },
    { atSec: 4.6, durSec: 0.18, note: 60, gain: 0.35 },
    { atSec: 4.8, durSec: 0.18, note: 62, gain: 0.35 },
    { atSec: 5, durSec: 0.18, note: 57, gain: 0.35 },
    { atSec: 5.2, durSec: 0.18, note: 64, gain: 0.85 },
    { atSec: 5.4, durSec: 0.18, note: 55, gain: 0.35 },
    { atSec: 5.6, durSec: 0.18, note: 67, gain: 0.85 },
    { atSec: 5.8, durSec: 0.18, note: 57, gain: 0.35 },
    { atSec: 6, durSec: 0.18, note: 69, gain: 0.35 },
    { atSec: 6.2, durSec: 0.18, note: 55, gain: 0.35 },
  ],
}
// Three, three and two: every bar of eight has three loud strokes, and only those are meant to wake a skin.
const CALL: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.38, note: 50, gain: 0.85 },
    { atSec: 0.4, durSec: 0.38, note: 57, gain: 0.32 },
    { atSec: 0.8, durSec: 0.38, note: 62, gain: 0.32 },
    { atSec: 1.2, durSec: 0.38, note: 60, gain: 0.85 },
    { atSec: 1.6, durSec: 0.38, note: 57, gain: 0.32 },
    { atSec: 2, durSec: 0.38, note: 62, gain: 0.32 },
    { atSec: 2.4, durSec: 0.38, note: 53, gain: 0.85 },
    { atSec: 2.8, durSec: 0.38, note: 57, gain: 0.32 },
    { atSec: 3.2, durSec: 0.38, note: 48, gain: 0.85 },
    { atSec: 3.6, durSec: 0.38, note: 55, gain: 0.32 },
    { atSec: 4, durSec: 0.38, note: 60, gain: 0.32 },
    { atSec: 4.4, durSec: 0.38, note: 62, gain: 0.85 },
    { atSec: 4.8, durSec: 0.38, note: 55, gain: 0.32 },
    { atSec: 5.2, durSec: 0.38, note: 57, gain: 0.32 },
    { atSec: 5.6, durSec: 0.38, note: 50, gain: 0.85 },
    { atSec: 6, durSec: 0.38, note: 57, gain: 0.32 },
  ],
}
// A ground on the five strings of a lyre, G2, A2, C3, D3 and E3, two bars of eight.
const LYRE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 43, gain: 0.8 },
    { atSec: 0.42, durSec: 0.4, note: 50, gain: 0.55 },
    { atSec: 0.84, durSec: 0.4, note: 48, gain: 0.55 },
    { atSec: 1.26, durSec: 0.4, note: 52, gain: 0.55 },
    { atSec: 1.68, durSec: 0.4, note: 45, gain: 0.8 },
    { atSec: 2.1, durSec: 0.4, note: 50, gain: 0.55 },
    { atSec: 2.52, durSec: 0.4, note: 48, gain: 0.55 },
    { atSec: 2.94, durSec: 0.4, note: 43, gain: 0.55 },
    { atSec: 3.36, durSec: 0.4, note: 43, gain: 0.8 },
    { atSec: 3.78, durSec: 0.4, note: 50, gain: 0.55 },
    { atSec: 4.2, durSec: 0.4, note: 52, gain: 0.55 },
    { atSec: 4.62, durSec: 0.4, note: 48, gain: 0.55 },
    { atSec: 5.04, durSec: 0.4, note: 45, gain: 0.8 },
    { atSec: 5.46, durSec: 0.4, note: 48, gain: 0.55 },
    { atSec: 5.88, durSec: 0.4, note: 50, gain: 0.55 },
    { atSec: 6.3, durSec: 0.4, note: 43, gain: 0.55 },
  ],
}
// The same five tones an octave down, the first of every four pulses loud and the second a rest.
const LOW_LYRE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.46, note: 31, gain: 0.82 },
    { atSec: 1, durSec: 0.46, note: 38, gain: 0.42 },
    { atSec: 1.5, durSec: 0.46, note: 36, gain: 0.42 },
    { atSec: 2, durSec: 0.46, note: 40, gain: 0.82 },
    { atSec: 3, durSec: 0.46, note: 33, gain: 0.42 },
    { atSec: 3.5, durSec: 0.46, note: 38, gain: 0.42 },
    { atSec: 4, durSec: 0.46, note: 36, gain: 0.82 },
    { atSec: 5, durSec: 0.46, note: 33, gain: 0.42 },
    { atSec: 5.5, durSec: 0.46, note: 31, gain: 0.42 },
    { atSec: 6, durSec: 0.46, note: 31, gain: 0.82 },
  ],
}
// A hunter's harp: D2, A2, D3 and A2 round and round, and two runs on five tones, three to a bass stroke, that fall into it.
const HUNTER: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 38, gain: 0.7 },
    { atSec: 0.66, durSec: 0.6, note: 45, gain: 0.7 },
    { atSec: 1.32, durSec: 0.6, note: 50, gain: 0.7 },
    { atSec: 1.54, durSec: 0.4, note: 76, gain: 0.65 },
    { atSec: 1.76, durSec: 0.4, note: 74, gain: 0.61 },
    { atSec: 1.98, durSec: 0.4, note: 72, gain: 0.57 },
    { atSec: 1.98, durSec: 0.6, note: 45, gain: 0.7 },
    { atSec: 2.2, durSec: 0.4, note: 69, gain: 0.53 },
    { atSec: 2.42, durSec: 0.4, note: 67, gain: 0.49 },
    { atSec: 2.64, durSec: 0.6, note: 38, gain: 0.7 },
    { atSec: 3.3, durSec: 0.6, note: 45, gain: 0.7 },
    { atSec: 3.96, durSec: 0.6, note: 50, gain: 0.7 },
    { atSec: 4.4, durSec: 0.4, note: 79, gain: 0.66 },
    { atSec: 4.62, durSec: 0.4, note: 76, gain: 0.63 },
    { atSec: 4.62, durSec: 0.6, note: 45, gain: 0.7 },
    { atSec: 4.84, durSec: 0.4, note: 74, gain: 0.6 },
    { atSec: 5.06, durSec: 0.4, note: 72, gain: 0.57 },
    { atSec: 5.28, durSec: 0.4, note: 69, gain: 0.54 },
    { atSec: 5.28, durSec: 0.6, note: 38, gain: 0.7 },
    { atSec: 5.5, durSec: 0.4, note: 67, gain: 0.51 },
    { atSec: 5.72, durSec: 0.4, note: 64, gain: 0.48 },
    { atSec: 5.94, durSec: 1.4, note: 62, gain: 0.55 },
    { atSec: 5.94, durSec: 1.4, note: 45, gain: 0.6 },
  ],
}
// Root, fifth and octave held together, on D, on C and on D again.
const FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 62, gain: 0.5 },
    { atSec: 2.4, durSec: 2.1, note: 48, gain: 0.6 },
    { atSec: 2.4, durSec: 2.1, note: 55, gain: 0.5 },
    { atSec: 2.4, durSec: 2.1, note: 60, gain: 0.5 },
    { atSec: 4.6, durSec: 2.7, note: 50, gain: 0.6 },
    { atSec: 4.6, durSec: 2.7, note: 57, gain: 0.5 },
    { atSec: 4.6, durSec: 2.7, note: 62, gain: 0.5 },
  ],
}
// The same three chords an octave up, for high voices and pipes.
const HIGH_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 62, gain: 0.55 },
    { atSec: 0, durSec: 2.3, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 74, gain: 0.5 },
    { atSec: 2.4, durSec: 2.1, note: 60, gain: 0.55 },
    { atSec: 2.4, durSec: 2.1, note: 67, gain: 0.5 },
    { atSec: 2.4, durSec: 2.1, note: 72, gain: 0.5 },
    { atSec: 4.6, durSec: 2.7, note: 62, gain: 0.55 },
    { atSec: 4.6, durSec: 2.7, note: 69, gain: 0.5 },
    { atSec: 4.6, durSec: 2.7, note: 74, gain: 0.5 },
  ],
}
// One low tone at a time, held: D2, C2 and D2 again.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 38, gain: 0.65 },
    { atSec: 3.15, durSec: 1.35, note: 36, gain: 0.6 },
    { atSec: 4.55, durSec: 2.8, note: 38, gain: 0.65 },
  ],
}
// One chanting voice on A, C, D, E and F that comes to rest on D.
const CHANT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 57, gain: 0.55 },
    { atSec: 0.9, durSec: 0.5, note: 60, gain: 0.55 },
    { atSec: 1.4, durSec: 1.55, note: 62, gain: 0.65 },
    { atSec: 3, durSec: 0.5, note: 60, gain: 0.55 },
    { atSec: 3.5, durSec: 0.5, note: 62, gain: 0.55 },
    { atSec: 4, durSec: 1.1, note: 65, gain: 0.7 },
    { atSec: 5.1, durSec: 0.5, note: 64, gain: 0.6 },
    { atSec: 5.6, durSec: 1.75, note: 62, gain: 0.65 },
  ],
}
// The same chant an octave down, for low voices and a low bow.
const LOW_CHANT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.9, note: 45, gain: 0.55 },
    { atSec: 0.9, durSec: 0.5, note: 48, gain: 0.55 },
    { atSec: 1.4, durSec: 1.55, note: 50, gain: 0.65 },
    { atSec: 3, durSec: 0.5, note: 48, gain: 0.55 },
    { atSec: 3.5, durSec: 0.5, note: 50, gain: 0.55 },
    { atSec: 4, durSec: 1.1, note: 53, gain: 0.7 },
    { atSec: 5.1, durSec: 0.5, note: 52, gain: 0.6 },
    { atSec: 5.6, durSec: 1.75, note: 50, gain: 0.65 },
  ],
}
// Kick, rims, toms and a shaker in eights, loud on three, three and two, with a clap to end.
const SKINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.15, note: 60, gain: 0.85 },
    { atSec: 0.38, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 0.76, durSec: 0.15, note: 66, gain: 0.4 },
    { atSec: 1.14, durSec: 0.15, note: 69, gain: 0.85 },
    { atSec: 1.52, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 1.9, durSec: 0.15, note: 66, gain: 0.4 },
    { atSec: 2.28, durSec: 0.15, note: 71, gain: 0.85 },
    { atSec: 2.66, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 3.04, durSec: 0.15, note: 60, gain: 0.85 },
    { atSec: 3.42, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 3.8, durSec: 0.15, note: 66, gain: 0.4 },
    { atSec: 4.18, durSec: 0.15, note: 69, gain: 0.85 },
    { atSec: 4.56, durSec: 0.15, note: 66, gain: 0.4 },
    { atSec: 4.94, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 5.32, durSec: 0.15, note: 60, gain: 0.85 },
    { atSec: 5.7, durSec: 0.15, note: 68, gain: 0.4 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'buzz-left-in-one-string-whole-climb',
    name: 'One string, whole climb',
    category: 'plucked',
    description:
      'A long concert harp string whose buzz climbs from its third partial towards its twelfth as it dies, in a small room.',
    preview: OPENING,
    instrument: {
      deviceId: 'harp',
      preset: 'Concert harp',
      params: { decay: 2.4, halo: 0.15, pluck: 0.3, volume: -8 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Harp on a bridge',
        params: { amount: 0.75, fall: 3000, threshold: -54 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'buzz-left-in-silk-over-a-flat-board',
    name: 'Silk over a flat board',
    category: 'plucked',
    description:
      'Soft silk strings on a flat bridge: the buzz stays on the third partial, under five kilohertz, through a slack spring.',
    preview: STROKES,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { bend: 0, halo: 0.3, body: 1, volume: 1.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Flat bridge',
        params: { amount: 1, tone: 5000, fall: 2000, threshold: -54, mix: 0.75 },
      },
      { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-falls-from-the-left-hand',
    name: 'Falls from the left hand',
    category: 'plucked',
    description:
      'A short guzheng over a bridge whose buzz keeps to its own place and spreads wide, with two heads of tape echo.',
    preview: HUNTER,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng cascade',
      params: { sweep: 0, halo: 0.3, decay: 0.7, body: 0.2, volume: -1 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Bridge in one place',
        params: { amount: 0.8, resonance: 5400, width: 0.9, threshold: -54 },
      },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.2, time: 440 } },
    ],
  },
  {
    id: 'buzz-left-in-only-hard-plucks-tell',
    name: 'Only hard plucks tell',
    category: 'plucked',
    description:
      'A dark hollow harp: hard plucks wake a slack skin and soft ones stay plain, with a drum body round both.',
    preview: CALL,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { decay: 0.4, halo: 0.1, body: 0.6, pluck: 0.28, volume: -3.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Great gourd',
        params: { threshold: -24, resonance: 1300, tone: 6000, curve: 0, amount: 0.9, fall: 250 },
      },
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.3, size: 1.6 } },
    ],
  },
  {
    id: 'buzz-left-in-husk-on-a-dry-harp',
    name: 'Husk on a dry harp',
    category: 'plucked',
    description:
      'A harp damped short: each pluck knocks six loose caps, high and wide, across a pair of crossing taps.',
    preview: TONGUES,
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { damp: 0.7, decay: 0.45, volume: -3 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Loose caps',
        params: {
          resonance: 5200,
          tone: 14000,
          width: 0.8,
          rattle: 180,
          threshold: -54,
          mix: 0.85,
        },
      },
      { deviceId: 'skipping-stone', preset: 'Two skips', params: { mix: 0.16 } },
    ],
  },
  {
    id: 'buzz-left-in-seeds-settle-last',
    name: 'Seeds settle last',
    category: 'plucked',
    description:
      'Long glassy harp notes; eight seeds shake almost evenly after each for four tenths of a second, a little way off.',
    preview: OPENING,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { halo: 0.2, body: 0.1, decay: 2, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Seeds in the next room',
        params: {
          distance: 0.2,
          width: 1,
          rattle: 390,
          curve: 0,
          threshold: -54,
          tone: 12000,
          resonance: 2400,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-strap-on-the-fifth-tone',
    name: 'Strap on the fifth tone',
    category: 'plucked',
    description:
      'Plucks near the soundboard against a hard leather strap, dry and close, five low tones going round.',
    preview: LYRE,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { decay: 1.4, halo: 0, body: 0.75, touch: 0.25, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Hard strap',
        params: { amount: 0.95, resonance: 5600, fall: 500, threshold: -54 },
      },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'buzz-left-in-goatskin-thong-evening',
    name: 'Goatskin thong, evening',
    category: 'plucked',
    description:
      'A muted harp under a soft strap that flaps on well after each low note, through a stack of woolly speakers.',
    preview: LYRE,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.4, decay: 0.8, halo: 0, pluck: 0.45, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: { amount: 1, resonance: 1800, tone: 5000, fall: 2500, threshold: -54, mix: 0.85 },
      },
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'buzz-left-in-leaf-between-two-silks',
    name: 'Leaf between two silks',
    category: 'plucked',
    description:
      'Plucked koto silk pressed a shade sharp after the pluck, a sheet of paper lying on it, with a dark plate.',
    preview: OPENING,
    instrument: {
      deviceId: 'harp',
      preset: 'Rising koto',
      params: { bend: 30, halo: 0.2, body: 0.5, decay: 2, volume: 1.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.75, resonance: 2000, fall: 1800, threshold: -54, mix: 0.8 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'buzz-left-in-curve-of-a-wide-bridge',
    name: 'Curve of a wide bridge',
    category: 'plucked',
    description:
      'A bare steel string with the whole climb: the buzz ends far above the note and takes five seconds to fall.',
    preview: STROKES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { body: 0.2, sustain: 12, release: 9, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Long climb',
        params: { amount: 0.9, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'buzz-left-in-nylon-with-the-sweep-low',
    name: 'Nylon with the sweep low',
    category: 'plucked',
    description:
      'Round nylon strings with the buzz kept under two kilohertz and sinking before the note, in a slow dark echo.',
    preview: OPENING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { position: 0.36, nail: 0.1, volume: 2.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Open bridge',
        params: { amount: 1, curve: 0.7, resonance: 900, fall: 250, tone: 3000, threshold: -54 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { mix: 0.2, time: 620, feedback: 0.3 },
      },
    ],
  },
  {
    id: 'buzz-left-in-twelve-wires-lean-in',
    name: 'Twelve wires lean in',
    category: 'plucked',
    description:
      'Twelve strings that all graze, the buzz spread wide, swaying slowly from side to side with strings of D minor in sympathy.',
    preview: HUNTER,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { sustain: 6, release: 3, strum: 0, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Drone strings',
        params: { amount: 0.85, width: 1, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'sympathetic', preset: 'Faint ring', params: { root: 2, mode: 1, mix: 0.2 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'buzz-left-in-three-loud-in-eight',
    name: 'Three loud in eight',
    category: 'plucked',
    description:
      'A soft thumb on steel: the three loud strokes of each eight wake a skin and the five soft ones do not, on warm tape.',
    preview: CALL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { strum: 0, sustain: 1, release: 0.3, volume: 1.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -21, resonance: 2600, curve: 0, amount: 1, fall: 250 },
      },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'buzz-left-in-tight-skin-glass-nail',
    name: 'Tight skin, glass nail',
    category: 'plucked',
    description:
      'Nailed steel near the bridge; every note of a low ground wakes a tight, quick skin, with a bright chamber.',
    preview: LYRE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: {
        sustain: 6,
        release: 3,
        strum: 0,
        shimmer: 0.2,
        nail: 0.75,
        position: 0.14,
        body: 0.5,
        volume: -5.0,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Tight skin',
        params: { threshold: -44, resonance: 4600, amount: 0.95, fall: 450, width: 0.6, mix: 0.75 },
      },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-anklet-on-the-thumb',
    name: 'Anklet on the thumb',
    category: 'plucked',
    description:
      'Short muted steel: every stroke shakes eight small beads for a fifth of a second, wide and high, in a tight chamber.',
    preview: LYRE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { sustain: 1.6, release: 0.3, body: 0.3, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Shaken beads',
        params: { amount: 1, resonance: 5800, threshold: -54, mix: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'buzz-left-in-dry-strap-under-nylon',
    name: 'Dry strap under nylon',
    category: 'plucked',
    description:
      'Plucked nylon stopped short on leather, every other swing caught less, with a wooden body close behind.',
    preview: LYRE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { sustain: 1.1, release: 0.2, body: 0.4, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Lyre leather',
        params: { amount: 1, resonance: 3400, fall: 400, threshold: -54 },
      },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'buzz-left-in-old-hide-long-wire',
    name: 'Old hide, long wire',
    category: 'plucked',
    description:
      'A dark wooden guitar on soft low leather; the flap holds on longer than each string does, on an uneven reel.',
    preview: HUNTER,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { strum: 0, tone: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: {
          amount: 1,
          resonance: 1200,
          tone: 4000,
          fall: 3500,
          curve: 0,
          threshold: -54,
          mix: 0.6,
        },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4 } },
    ],
  },
  {
    id: 'buzz-left-in-reed-pen-on-paper',
    name: 'Reed pen on paper',
    category: 'plucked',
    description:
      'Nylon played at the bridge against high paper that does not follow the pitch, side to side in a faint echo.',
    preview: HUNTER,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { sustain: 6, release: 2, nail: 0.55, position: 0.12, tone: 0.6, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { tracking: 0, resonance: 3400, amount: 0.85, width: 0.8, threshold: -54, mix: 1 },
      },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.18, spread: 1 } },
    ],
  },
  {
    id: 'buzz-left-in-thread-laid-at-the-edge',
    name: 'Thread laid at the edge',
    category: 'plucked',
    description:
      'A koto-bodied zither with the buzz tuned to each note and opening upward as it dies, quiet dark air round it.',
    preview: OPENING,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 9, release: 5, sympathy: 0, brightness: 0.35, volume: -7 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Harp on a bridge',
        params: {
          amount: 0.85,
          curve: 0.75,
          fall: 4000,
          resonance: 3400,
          threshold: -54,
          mix: 0.85,
        },
      },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'buzz-left-in-bridge-through-a-doorway',
    name: 'Bridge through a doorway',
    category: 'plucked',
    description:
      'An open zither struck as a drone: the strings are here and their climbing buzz is a room away, broad and late.',
    preview: STROKES,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { chord: 0, sympathy: 0.2, courses: 0, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Bridge next door',
        params: { amount: 1, distance: 0.7, width: 1, curve: 0.9, fall: 3000, threshold: -54 },
      },
      { deviceId: 'tape', preset: 'Drifting chorus', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'buzz-left-in-hammers-find-the-climb',
    name: 'Hammers find the climb',
    category: 'plucked',
    description:
      'Hammered dulcimer courses, struck once each, whose buzz starts at the third partial and goes up as they fade, under a slow phaser.',
    preview: UNFOLDING,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 0, chord: 0, sympathy: 0.2, brightness: 0.8, courses: 0.7, volume: -4.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Long climb',
        params: { amount: 0.8, resonance: 2800, threshold: -54 },
      },
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-loud-courses-taut-skin',
    name: 'Loud courses, taut skin',
    category: 'plucked',
    description:
      'Felt on a single string: only the accents reach a taut skin, which shuts again at once, in a short dry room.',
    preview: CALL,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 1.1, release: 0.5, sympathy: 0, body: 2, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -24, resonance: 2400, curve: 0, fall: 200, amount: 1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-cockle-on-a-loop',
    name: 'Cockle on a loop',
    category: 'plucked',
    description:
      'Fingers on a small nasal box; each stroke is three knocks of a shell, far apart and on alternating sides.',
    preview: LYRE,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: {
        chord: 0,
        strum: 0,
        brightness: 0.3,
        decay: 4,
        release: 2,
        exciter: 0,
        volume: -13.5,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Three shells',
        params: { rattle: 160, width: 1, curve: 0, threshold: -54, mix: 0.42 },
      },
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 12, outputGain: -5 } },
    ],
  },
  {
    id: 'buzz-left-in-ring-pull-two-strings',
    name: 'Ring pull, two strings',
    category: 'plucked',
    description:
      'Doubled strings an octave apart, each attack a single knock of wood, then a round that answers faintly.',
    preview: OPENING,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { decay: 5, release: 2, sympathy: 0.1, strum: 0, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Knock on wood',
        params: { resonance: 1400, tone: 7000, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 0.9, mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-sinew-over-a-warm-box',
    name: 'Sinew over a warm box',
    category: 'plucked',
    description:
      'Fingers on a dark zither box whose low strings flap against leather, chattering at the start, on an old record.',
    preview: LYRE,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 2, release: 0.6, body: 1, brightness: 0.3, position: 0.45, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Lyre leather',
        params: { amount: 1, resonance: 1800, rattle: 120, bounces: 6, fall: 800, threshold: -54 },
      },
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'buzz-left-in-tissue-across-the-treble',
    name: 'Tissue across the treble',
    category: 'plucked',
    description:
      'A long glassy zither with a very high, very wide edge of moving paper, and a faint backwards trace.',
    preview: UNFOLDING,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        chord: 0,
        strum: 0,
        courses: 0.2,
        sympathy: 0.4,
        decay: 12,
        brightness: 0.8,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'buzzing-bridge', preset: 'Moth wings', params: { amount: 0.9, threshold: -54 } },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-five-strokes-wake-it',
    name: 'Five strokes wake it',
    category: 'bell',
    description:
      'Two interlocking marimba parts: only the five loud strokes of each sixteen wake the skin, in a tight chamber.',
    preview: BARS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.5, damper: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -25, curve: 0, amount: 1 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'buzz-left-in-low-bars-wide-membrane',
    name: 'Low bars, wide membrane',
    category: 'bell',
    description:
      'Humming wooden bars with a big slack membrane under them, woken by the loud strokes alone and tuned to them.',
    preview: CALL,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { mallet: 0.25, decay: 1.2, volume: -12.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Great gourd',
        params: { threshold: -26, resonance: 420, curve: 0.15, fall: 2500, amount: 0.9, mix: 0.85 },
      },
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-hard-bars-small-gourds',
    name: 'Hard bars, small gourds',
    category: 'bell',
    description:
      'Hard xylophone bars: the accents set off a small tight skin on a partial of the bar, quick to fall, in a bright tank.',
    preview: CALL,
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { mallet: 0.7, decay: 0.5, volume: -3.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Tight skin',
        params: { threshold: -25.5, curve: 0, resonance: 3600, amount: 1, fall: 150 },
      },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.1, decay: 2 } },
    ],
  },
  {
    id: 'buzz-left-in-every-bar-a-skin',
    name: 'Every bar a skin',
    category: 'bell',
    description:
      'Warm xylophone bars, all of them touching a skin whatever their strength, swept slowly by a filter.',
    preview: TONGUES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Warm xylophone',
      params: { decay: 2, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Every note a skin',
        params: { amount: 0.8, width: 0.9, mix: 0.8 },
      },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'buzz-left-in-metal-bars-through-a-web',
    name: 'Metal bars through a web',
    category: 'bell',
    description:
      'Still vibraphone bars over a thin high skin that opens the further the louder the stroke, with a slow chorus.',
    preview: CALL,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0.4, damper: 0.8, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -27, curve: 0.25, resonance: 4000, amount: 1, tone: 14000, fall: 500 },
      },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-beads-in-the-tubes',
    name: 'Beads in the tubes',
    category: 'bell',
    description:
      'Marimba bars that shake eight beads each, a fifth of a second high and wide, over long dark repeats.',
    preview: TONGUES,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.75, decay: 0.5, resonator: 0.5, volume: -4.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Shaken beads',
        params: { amount: 1, resonance: 4600, width: 1, threshold: -54 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { mix: 0.14, time: 820, feedback: 0.45 },
      },
    ],
  },
  {
    id: 'buzz-left-in-celesta-with-a-loose-lid',
    name: 'Celesta with a loose lid',
    category: 'keys',
    description:
      'Celesta plates whose attack is three dull knocks of a lid, close together, with a narrow spring behind.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { mallet: 0.6, damper: 0.4, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Three shells',
        params: {
          resonance: 1200,
          tone: 3500,
          rattle: 110,
          curve: 0.2,
          width: 0.2,
          threshold: -54,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'buzz-left-in-cap-under-the-bell-bar',
    name: 'Cap under the bell bar',
    category: 'bell',
    description:
      'Short glockenspiel bars with two knocks of metal on each and then the bar alone, scattered left and right in echo.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.85, resonator: 0.4, decay: 0.5, volume: -3.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Loose caps',
        params: {
          bounces: 2,
          rattle: 90,
          resonance: 3000,
          tone: 16000,
          fall: 3000,
          threshold: -54,
        },
      },
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-seed-pod-vibes-bar',
    name: 'Seed pod, vibes bar',
    category: 'bell',
    description:
      'Hard vibraphone bars under a slow motor; seeds fall for a third of a second after each, every one softer.',
    preview: OPENING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { motor: 0.4, mallet: 0.95, damper: 0.2, resonator: 0.3, decay: 1, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Seeds in the next room',
        params: {
          distance: 0.1,
          resonance: 3600,
          width: 1,
          threshold: -54,
          tone: 12000,
          rattle: 300,
          curve: 0.1,
        },
      },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-bright-plates-graze',
    name: 'Bright plates graze',
    category: 'bell',
    description:
      'Bell plates over tubes, under a buzz that climbs as they die and keeps to its own place whatever the tune does.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Resonator bells',
      params: { mallet: 0.3, decay: 1.2, volume: -7.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Bridge in one place',
        params: { resonance: 3000, curve: 0.9, amount: 0.9, fall: 3000, threshold: -54 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'buzz-left-in-two-thumbs-loose-rings',
    name: 'Two thumbs, loose rings',
    category: 'bell',
    description:
      'Plucked metal tongues, six rings shaken by every stroke, two hands two against three, a wooden box close round them.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 2, hardness: 0.75, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Loose caps',
        params: { rattle: 150, amount: 1, threshold: -54 },
      },
      { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'buzz-left-in-tongues-in-a-half-shell',
    name: 'Tongues in a half shell',
    category: 'bell',
    description:
      'Dulled metal tongues: three lower shell knocks to a stroke, all of it inside a hollow shell that breathes.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 2.5, hardness: 0.7, damping: 0.4, brightness: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Three shells',
        params: { resonance: 2000, rattle: 110, tone: 6000, threshold: -54 },
      },
      { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.35, air: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-wooden-bars-dried-pods',
    name: 'Wooden bars, dried pods',
    category: 'bell',
    description:
      'Short wood bars: eight seeds follow each one and crowd together at the end, with hard clean repeats.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { decay: 0.8, volume: -2 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Shaken beads',
        params: {
          resonance: 3000,
          rattle: 140,
          curve: 0.9,
          tone: 9000,
          amount: 1,
          width: 0.5,
          threshold: -54,
        },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { mix: 0.16, time: 400, feedback: 0.3 },
      },
    ],
  },
  {
    id: 'buzz-left-in-glass-on-a-chipped-foot',
    name: 'Glass on a chipped foot',
    category: 'bell',
    description:
      'Tapped glass that rattles once, low down, where it stands; the knock is wood and the glass rings on above it.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { decay: 3.5, volume: -7.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Knock on wood',
        params: { resonance: 340, amount: 1, tone: 2200, threshold: -54 },
      },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-bowl-rail-next-door',
    name: 'Bowl, rail next door',
    category: 'drone',
    description:
      'A singing bowl struck four times here; the buzz that climbs over its slow beats is dull and wide, a room away.',
    preview: OPENING,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: { hardness: 0.3, damping: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Drone strings',
        params: { amount: 1, curve: 0.7, threshold: -54, distance: 0.85, tone: 14000 },
      },
      { deviceId: 'currents', preset: 'Gentle drift', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'buzz-left-in-gong-against-a-taut-hide',
    name: 'Gong against a taut hide',
    category: 'bell',
    description:
      'A small choked gong whose loud strokes wake a wide hide and whose soft ones hang plain, in a cistern.',
    preview: CALL,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 1.6, release: 0.9, hardness: 0.55, volume: -2.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Great gourd',
        params: {
          threshold: -22,
          resonance: 1700,
          curve: 0,
          tone: 9000,
          amount: 0.95,
          width: 0.7,
          fall: 250,
          mix: 0.9,
        },
      },
      { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-vellum-under-tubes',
    name: 'Vellum under tubes',
    category: 'bell',
    description:
      'Vibraphone-ratio tubes with a page of vellum on every note, tuned to it, like a tune behind a comb, turning slowly.',
    preview: CHANT,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { decay: 7, hardness: 0.6, position: 0.1, brightness: 0.8, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Comb and paper',
        params: { amount: 0.75, threshold: -54 },
      },
      { deviceId: 'rotary', preset: 'Faint motion', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'buzz-left-in-low-strings-brass-lip',
    name: 'Low strings, brass lip',
    category: 'keys',
    description:
      'Bare piano strings struck as a drone, pedal down: a buzz climbs towards the twelfth partial of each, spread a little.',
    preview: STROKES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: {
        reverbMix: 0,
        resonance: 0.2,
        pedalNoise: 0,
        sustain: 1,
        polyphony: 12,
        outputDb: -16.5,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Open bridge',
        params: { curve: 0.6, amount: 0.9, fall: 3500, width: 0.4, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'buzz-left-in-page-laid-in-the-dampers',
    name: 'Page laid in the dampers',
    category: 'keys',
    description:
      'A close felted piano with stiff paper across the strings, plainly heard on each key, from a worn cassette.',
    preview: UNFOLDING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        reverbMix: 0,
        resonance: 0.2,
        pedalNoise: 0,
        hardness: 0.5,
        action: 0.1,
        outputDb: -14.5,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.8, resonance: 2600, rattle: 20, threshold: -54 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'buzz-left-in-accent-in-the-soundboard',
    name: 'Accent in the soundboard',
    category: 'keys',
    description:
      'An old upright: what is hit hard wakes a membrane under the strings, and a quiet touch leaves it asleep.',
    preview: CALL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        reverbMix: 0,
        resonance: 0.2,
        pedalNoise: 0,
        thump: 0.4,
        action: 0.3,
        grit: 0.1,
        outputDb: -15.0,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -24, resonance: 1400, curve: 0, fall: 220, amount: 0.95, mix: 0.85 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'buzz-left-in-skin-under-the-felt',
    name: 'Skin under the felt',
    category: 'keys',
    description:
      'Soft thudding piano over a huge slack membrane, woken by anything and slower to stop than the string.',
    preview: LYRE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: {
        reverbMix: 0,
        resonance: 0.2,
        pedalNoise: 0,
        hardness: 0.3,
        thump: 0.4,
        outputDb: -18.0,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Great gourd',
        params: { threshold: -46, resonance: 300, tone: 2400, fall: 4000, amount: 0.85, mix: 0.7 },
      },
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-screw-loose-in-the-case',
    name: 'Screw loose in the case',
    category: 'keys',
    description:
      'A glassy upright: every key shakes a screw six times, quickening a little, then a plain note, with one slap behind it.',
    preview: OPENING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: {
        reverbMix: 0,
        resonance: 0.2,
        pedalNoise: 0,
        hardness: 0.7,
        stiffness: 1,
        outputDb: -12.5,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Loose caps',
        params: { resonance: 4600, tone: 14000, rattle: 220, curve: 0.1, threshold: -54 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'buzz-left-in-strop-under-the-hammers',
    name: 'Strop under the hammers',
    category: 'keys',
    description:
      'A worn one-channel piano on a low ground, its strings flapping on hard bright leather and stopping dry.',
    preview: LYRE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: {
        reverbMix: 0,
        resonance: 0.2,
        pedalNoise: 0,
        grit: 0.3,
        felt: 0.4,
        outputDb: -17.0,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Hard strap',
        params: { amount: 0.9, resonance: 5000, fall: 300, curve: 0.8, threshold: -54 },
      },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'buzz-left-in-fretless-on-the-climb',
    name: 'Fretless on the climb',
    category: 'bass',
    description:
      'A long dark fretless string: the buzz starts on its third partial and climbs as each note dies, peaks held in.',
    preview: LOW_STROKES,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { tone: 0.45, touch: 0.25, growl: 0.1, volume: -6.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Open bridge',
        params: { amount: 0.9, curve: 0.6, fall: 3000, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'buzz-left-in-upright-on-a-bone-saddle',
    name: 'Upright on a bone saddle',
    category: 'bass',
    description:
      'A wooden bass ringing long, its buzz climbing well past the twelfth partial as it dies, in a low warm hall.',
    preview: LOW_STROKES,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { growl: 0, sustain: 10, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Long climb',
        params: {
          amount: 0.85,
          curve: 0.8,
          fall: 3000,
          resonance: 5200,
          tone: 16000,
          threshold: -54,
          mix: 0.85,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'buzz-left-in-lyre-ground-in-leather',
    name: 'Lyre ground in leather',
    category: 'bass',
    description:
      'Plucked upright with a leather strip under every string: every other swing is caught less, in a small wooden body.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 3, tone: 0.35, touch: 0.5, volume: -2 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Lyre leather',
        params: { amount: 1, resonance: 4200, fall: 1200, threshold: -54 },
      },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.35, size: 0.7 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'buzz-left-in-belt-on-the-low-strings',
    name: 'Belt on the low strings',
    category: 'bass',
    description:
      'A picked, lightly muted bass slapping a hard belt, the buzz gone long before the note, through a warm stack.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { mute: 0.2, growl: 0.1, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Hard strap',
        params: { amount: 1, curve: 1, resonance: 5400, tone: 14000, fall: 40, threshold: -54 },
      },
      { deviceId: 're-amp', preset: 'Warm stack', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'buzz-left-in-ox-hide-flat-strings',
    name: 'Ox hide, flat strings',
    category: 'bass',
    description:
      'Dark flat strings on slack hide: the flap is low and goes on past the note, with a loose double.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { sustain: 4, touch: 0.35, volume: -3 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: {
          amount: 1,
          resonance: 900,
          tone: 2000,
          fall: 5000,
          curve: 0.2,
          threshold: -54,
          mix: 0.75,
        },
      },
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-deep-skin-on-the-one',
    name: 'Deep skin on the one',
    category: 'bass',
    description:
      'A thumbed electric bass: the first of every four pulses is loud enough for a deep membrane and the rest pass over it.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { sustain: 1, touch: 0.2, release: 0.1, volume: 0.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Great gourd',
        params: { threshold: -22.5, resonance: 1000, curve: 0, tone: 5000, amount: 1, fall: 900 },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'buzz-left-in-washer-behind-the-bridge',
    name: 'Washer behind the bridge',
    category: 'bass',
    description:
      'Plucks near the bridge that throw a washer against metal, four times and quickly, with a hint of spring.',
    preview: LOW_STROKES,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { touch: 0.6, sustain: 4, volume: -4.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Loose caps',
        params: {
          bounces: 4,
          rattle: 70,
          resonance: 2000,
          curve: 0.8,
          tone: 8000,
          threshold: -54,
          mix: 0.8,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'buzz-left-in-partials-out-of-nothing',
    name: 'Partials out of nothing',
    category: 'bass',
    description:
      'A pure sine that gets partials of its own from a curved bridge, strongest low in the series, with nothing driven.',
    preview: LOW_STROKES,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pure sine',
      params: { release: 0.8, volume: -28.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Sine into strings',
        params: { amount: 0.95, threshold: -54 },
      },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'buzz-left-in-sine-struck-and-opening',
    name: 'Sine, struck and opening',
    category: 'bass',
    description:
      'A dying sine whose added buzz goes up from the third partial towards the thirtieth, its top spread over a central low.',
    preview: LOW_STROKES,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Soft pulse',
      params: { decay: 2.2, attack: 0.004, release: 1.5, volume: -14.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Long climb',
        params: { amount: 1, fall: 4000, resonance: 4800, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'buzz-left-in-low-drone-slow-rail',
    name: 'Low drone, slow rail',
    category: 'drone',
    description:
      'A dark swelling sine held on a bridge that climbs half way over seconds and stays wide, in a hall that breathes.',
    preview: PEDAL,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Dark drone',
      params: { attack: 0.4, release: 3, glide: 0.4, volume: -19.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Drone strings',
        params: { amount: 1, curve: 0.6, width: 1, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-heartskin',
    name: 'Heartskin',
    category: 'bass',
    description:
      'A soft sine pulse: only the first of four pulses is loud enough to wake a drum skin, which shuts before the next.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Soft pulse',
      params: { attack: 0.006, decay: 0.7, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Great gourd',
        params: { threshold: -17, resonance: 500, curve: 0, fall: 250, tone: 3000, amount: 1 },
      },
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.2, size: 2 } },
    ],
  },
  {
    id: 'buzz-left-in-thong-under-a-low-tone',
    name: 'Thong under a low tone',
    category: 'bass',
    description:
      'A low tone with a few harmonics on leather that chatters five times before it settles, under a slow phaser.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Pedal tone',
      params: { decay: 1.2, harmonics: 0.35, shape: 0.2, release: 0.1, volume: -11 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Lyre leather',
        params: { amount: 1, resonance: 4200, fall: 1500, rattle: 150, bounces: 5, threshold: -54 },
      },
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-bellows-strap',
    name: 'Bellows strap',
    category: 'bass',
    description:
      'Short sine thumps that fall an octave onto their note, slapping soft hide which flaps on after each, in a dark spring.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Short thump',
      params: { drop: 12, decay: 1.4, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: { amount: 1, resonance: 2400, tone: 5000, fall: 3000, threshold: -54 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'buzz-left-in-paper-cone-torn',
    name: 'Paper cone torn',
    category: 'bass',
    description:
      'A gliding sub through torn paper, a little breath in it, as from one small muffled loudspeaker.',
    preview: LOW_STROKES,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Gliding sub',
      params: { harmonics: 0.2, glide: 0.15, attack: 0.02, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Comb and paper',
        params: { amount: 1, resonance: 900, tone: 3500, threshold: -54 },
      },
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'buzz-left-in-bolt-that-jumps-once',
    name: 'Bolt that jumps once',
    category: 'bass',
    description:
      'A knocking sub with a quick fall: each note throws one loose bolt against wood, heard twice in a tape slap.',
    preview: LOW_LYRE,
    instrument: {
      deviceId: 'sub-bass',
      preset: 'Hard knock',
      params: { drive: 0.3, drop: 14, decay: 1.6, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Knock on wood',
        params: { resonance: 1400, tone: 9000, amount: 1, threshold: -54 },
      },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-tine-that-opens-late',
    name: 'Tine that opens late',
    category: 'keys',
    description:
      'Long dark tines; a buzz begins at the third partial of each and climbs as it fades, in a slow rotary.',
    preview: OPENING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 3, hardness: 0.6, release: 1.2, volume: -16.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Harp on a bridge',
        params: { amount: 0.9, curve: 0.9, fall: 4000, threshold: -54 },
      },
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'buzz-left-in-bark-behind-a-membrane',
    name: 'Bark behind a membrane',
    category: 'keys',
    description:
      'A short barking stage piano; a skin joins only the hard strokes and leaves the light ones as bare tines.',
    preview: CALL,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { drive: 0.15, bark: 0.5, decay: 0.6, volume: -14.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Every note a skin',
        params: { threshold: -26, resonance: 2000, fall: 300, amount: 0.95 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'buzz-left-in-short-tines-brass-beads',
    name: 'Short tines, brass beads',
    category: 'keys',
    description:
      'Short dark tines and eight high beads to each stroke, tines and beads together wandering across the room.',
    preview: TONGUES,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.35, release: 0.1, bell: 0.2, hardness: 1, tone: 0.3, volume: -14.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Shaken beads',
        params: {
          resonance: 4200,
          tone: 16000,
          rattle: 150,
          amount: 1,
          width: 0.4,
          threshold: -54,
        },
      },
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { depth: 0.5 } },
    ],
  },
  {
    id: 'buzz-left-in-bass-tines-in-a-sling',
    name: 'Bass tines in a sling',
    category: 'keys',
    description:
      'Warm driven low tines swinging against a soft strap, with the top taken off and one murky repeat.',
    preview: LYRE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { drive: 0.5, decay: 1, release: 0.2, volume: -12.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: { amount: 1, resonance: 2200, tone: 3600, fall: 700, threshold: -54 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.16, feedback: 0 } },
    ],
  },
  {
    id: 'buzz-left-in-glass-tines-in-wax-paper',
    name: 'Glass tines in wax paper',
    category: 'keys',
    description:
      'Bell tines turned to glass, a fine high paper tremble riding each, and a tail that thins as it lifts.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 1.2, tone: 0.8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Moth wings',
        params: { amount: 0.9, resonance: 6000, distance: 0, fall: 4000, threshold: -54 },
      },
      { deviceId: 'melt', preset: 'Into thin air', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'buzz-left-in-paper-edge-on-an-ah',
    name: 'Paper edge on an ah',
    category: 'voice',
    description:
      'A small section on ah in open fifths with a thin edge of paper along the top, in a hall.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: {
        ensemble: 0.2,
        motion: 0.1,
        breath: 0.1,
        attack: 0.25,
        release: 0.9,
        volume: -10.0,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper edge',
        params: { amount: 0.6, resonance: 2400, threshold: -54 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-soloist-behind-a-comb',
    name: 'Soloist behind a comb',
    category: 'voice',
    description:
      'One voice chanting against comb and paper tuned to each of its notes, plain and near.',
    preview: CHANT,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 8, release: 0.25, attack: 0.05, volume: -4.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Comb and paper',
        params: { amount: 0.9, resonance: 1100, tracking: 1, threshold: -54 },
      },
      { deviceId: 'ambient-eq', preset: 'Voice' },
    ],
  },
  {
    id: 'buzz-left-in-trebles-in-rice-paper',
    name: 'Trebles in rice paper',
    category: 'voice',
    description:
      'High voices with a fine wide high tremble of paper over them, slow to fall, and a shining tail.',
    preview: HIGH_FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { motion: 0.4, attack: 0.4, release: 1.5, tone: 5000, volume: -10.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Moth wings',
        params: { amount: 0.9, fall: 4000, distance: 0.1, threshold: -54 },
      },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.2, decay: 6 } },
    ],
  },
  {
    id: 'buzz-left-in-humming-through-a-fold',
    name: 'Humming through a fold',
    category: 'voice',
    description:
      'A hummed chant with nothing of its own over 700 hertz; the fold of paper above it is all the top there is.',
    preview: CHANT,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { ensemble: 0.3, attack: 0.2, release: 0.6, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.8, resonance: 1500, tone: 5000, threshold: -54 },
      },
      { deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-low-voices-on-a-bridge',
    name: 'Low voices on a bridge',
    category: 'voice',
    description:
      'Low voices in fifths on a curved bridge whose buzz climbs slowly under each chord, spread wide, in a still room.',
    preview: FIFTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { ensemble: 0.3, attack: 0.3, release: 1.6, volume: -10.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Drone strings',
        params: { amount: 1, curve: 0.7, width: 0.9, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-chest-strap-basses',
    name: 'Chest strap, basses',
    category: 'voice',
    description:
      'A few basses on ah, one line at a time, with leather flapping low in the chest of it, in a tight room.',
    preview: LOW_CHANT,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { ensemble: 0.1, attack: 0.06, release: 0.3, motion: 0, volume: -5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Lyre leather',
        params: { amount: 0.9, resonance: 1300, fall: 500, rattle: 10, bounces: 1, threshold: -54 },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'buzz-left-in-wire-drone-long-sweep',
    name: 'Wire drone, long sweep',
    category: 'string',
    description:
      'A wire string plucked and left; its buzz climbs past the twelfth partial and takes five seconds to fall, widened.',
    preview: STROKES,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { release: 5, detune: 0, brightness: 0.55, volume: -8 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Long climb',
        params: { amount: 0.95, curve: 0.85, fall: 5000, tone: 10000, threshold: -54, mix: 0.7 },
      },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
  },
  {
    id: 'buzz-left-in-bow-with-a-paper-mute',
    name: 'Bow with a paper mute',
    category: 'string',
    description:
      'A bowed low string with paper folded over the bridge, sounding as long as the bow does, in a dark hall.',
    preview: LOW_CHANT,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.12, release: 0.4, vibrato: 0.1, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.9, fall: 300, threshold: -54 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'buzz-left-in-flautando-on-onionskin',
    name: 'Flautando on onionskin',
    category: 'string',
    description:
      'A flautando bow with almost no edge of its own, and a high wide paper tremble for one, drifting a little.',
    preview: UNFOLDING,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.35, release: 1.2, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Moth wings',
        params: { amount: 0.8, resonance: 4500, curve: 0.5, threshold: -54 },
      },
      { deviceId: 'currents', preset: 'Nearly still' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-dark-pluck-saddle-hide',
    name: 'Dark pluck, saddle hide',
    category: 'string',
    description:
      'A dark damped pluck on low strings, flapping on soft leather, with a large wooden soundboard behind.',
    preview: LYRE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { decay: 2.5, brightness: 0.25, volume: -7.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: {
          amount: 1,
          resonance: 1600,
          tone: 3000,
          fall: 900,
          curve: 0.5,
          threshold: -54,
          mix: 0.75,
        },
      },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.3, size: 1.6 } },
    ],
  },
  {
    id: 'buzz-left-in-felt-thumb-asleep-skin',
    name: 'Felt thumb, asleep skin',
    category: 'string',
    description:
      'A short felt-picked string: the light strokes pass over a skin, the strongest sink in and it speaks, then shuts.',
    preview: CALL,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: {
        position: 0.5,
        detune: 0,
        body: 0.2,
        decay: 1.2,
        release: 0.06,
        brightness: 0.25,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -18.5, resonance: 1800, curve: 0, fall: 200, amount: 1, tone: 8000 },
      },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'buzz-left-in-flute-with-a-thin-hole',
    name: 'Flute with a thin hole',
    category: 'wind',
    description:
      'A concert flute with a film of paper over one hole: a thin high edge on every note, in an airy hall.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { vibrato: 0.2, breath: 0.15, chiff: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.9, resonance: 3000, tone: 12000, threshold: -54 },
      },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'buzz-left-in-reed-membrane-wood-bore',
    name: 'Reed membrane, wood bore',
    category: 'wind',
    description:
      'A soft wooden pipe and a low tuned film of paper, close and nasal, inside a short bore.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: { attack: 0.06, blow: 0.2, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Comb and paper',
        params: { amount: 0.9, resonance: 1500, tone: 8000, threshold: -54 },
      },
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.3, size: 0.7 } },
    ],
  },
  {
    id: 'buzz-left-in-breath-across-a-leaf',
    name: 'Breath across a leaf',
    category: 'wind',
    description:
      'A breathy bamboo flute with a wide high leaf trembling on every note, and seven scattered echoes of both.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: { attack: 0.2, release: 0.9, vibrato: 0.4, breath: 0.6, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Moth wings',
        params: { amount: 0.9, width: 1, curve: 0.3, threshold: -54 },
      },
      { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-pipe-and-a-far-web',
    name: 'Pipe and a far web',
    category: 'wind',
    description:
      'Pan pipes here and a paper web in the next room, duller and later, with the whole moved a few steps back.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { release: 0.3, breath: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 1, resonance: 2400, distance: 0.45, width: 1, threshold: -54 },
      },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'buzz-left-in-low-flute-over-a-rail',
    name: 'Low flute over a rail',
    category: 'wind',
    description:
      'An alto flute on a curved bridge: the buzz goes from third partial to sixth only while a note is held.',
    preview: CHANT,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: { vibrato: 0.2, attack: 0.12, breath: 0.2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Open bridge',
        params: { amount: 1, curve: 0.6, tone: 6000, fall: 400, threshold: -54 },
      },
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
    ],
  },
  {
    id: 'buzz-left-in-reed-tongue-paper-lip',
    name: 'Reed tongue, paper lip',
    category: 'organ',
    description:
      'One reed rank chanting with a paper lip tuned to its notes, on uneven bellows, through a hot valve.',
    preview: CHANT,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0, bellows: 0.6, attack: 0.06, release: 0.2, tone: 2200, volume: -9 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Comb and paper',
        params: { amount: 0.75, resonance: 1400, threshold: -54 },
      },
      { deviceId: 'patina', preset: 'Hot valve', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'buzz-left-in-chapel-flutes-dry-leaf',
    name: 'Chapel flutes, dry leaf',
    category: 'organ',
    description:
      'Flute ranks in fifths and octaves with a high dry leaf of paper over the top, in a small chapel that sings back.',
    preview: HIGH_FIFTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { sub: 0.2, release: 0.4, volume: -10.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Moth wings',
        params: { amount: 0.9, resonance: 4000, width: 0.5, threshold: -54 },
      },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-shruti-on-a-warped-lid',
    name: 'Shruti on a warped lid',
    category: 'drone',
    description:
      'A drone box on slow bellows; a sheet of paper that hardly follows pitch buzzes on drone and line, faintly phased.',
    preview: UNFOLDING,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.25, release: 0.8, bellows: 0.5, volume: -10.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.6, tracking: 0.2, width: 0.6, threshold: -54 },
      },
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'buzz-left-in-pedal-pipe-finds-a-wire',
    name: 'Pedal pipe finds a wire',
    category: 'drone',
    description:
      'A deep pedal pipe with next to no overtones, and a wire laid on it that gives it some, half way up and held.',
    preview: PEDAL,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.15, celeste: 0, release: 1, volume: -6 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Sine into strings',
        params: { amount: 1, fall: 6000, resonance: 3600, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'breath', preset: 'Barely there' },
    ],
  },
  {
    id: 'buzz-left-in-low-bowl-thread-lain',
    name: 'Low bowl, thread lain',
    category: 'bell',
    description:
      'A low struck bowl of few partials under a climbing buzz that takes six seconds to fall, out to each side.',
    preview: OPENING,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: { brightness: 0.2, decay: 6, volume: -14.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Harp on a bridge',
        params: { amount: 1, curve: 0.8, fall: 6000, width: 0.8, threshold: -54, mix: 0.85 },
      },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { root: 2, mode: 1, mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-mallet-glass-waked-skin',
    name: 'Mallet glass, waked skin',
    category: 'bell',
    description:
      'Struck glass bars where only the loud strokes, five in sixteen, are strong enough to wake a tight quick skin.',
    preview: BARS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { decay: 0.4, velocity: 1, release: 0.25, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Tight skin',
        params: { threshold: -25, resonance: 3000, curve: 0, fall: 120, amount: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'buzz-left-in-toy-keys-rice-in-a-tin',
    name: 'Toy keys, rice in a tin',
    category: 'keys',
    description:
      'Toy keys of few partials in a small tin, eight grains of rice shaken after each and crowding together.',
    preview: TONGUES,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: { decay: 0.8, brightness: 0.2, volume: -11 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Shaken beads',
        params: { rattle: 240, curve: 1, resonance: 5000, amount: 1, threshold: -54 },
      },
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'buzz-left-in-chimes-in-cellophane',
    name: 'Chimes in cellophane',
    category: 'bell',
    description:
      'Nearly pure chimes with thin crackling paper for partials on every note, and a hazy wandering trail.',
    preview: HIGH_LINE,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: { decay: 2.5, release: 3, spread: 0.5, volume: -11 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.9, resonance: 2200, tone: 14000, curve: 0.9, threshold: -54 },
      },
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-snare-web-on-the-toms',
    name: 'Snare web on the toms',
    category: 'drum',
    description:
      'Long toms: each loud hit wakes a web under the skin, and quiet rims and shakers pass untouched, in a room.',
    preview: SKINS,
    instrument: { deviceId: 'drum-kit', preset: 'Long toms', params: { length: 1.4, volume: -5 } },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Balafon skin',
        params: { threshold: -24, resonance: 1300, curve: 0, fall: 500, amount: 1, tracking: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
    ],
  },
  {
    id: 'buzz-left-in-bells-tied-to-the-wrist',
    name: 'Bells tied to the wrist',
    category: 'drum',
    description:
      'A small dry kit and eight high wrist bells after every hit, for a quarter of a second, on quarter-inch tape.',
    preview: SKINS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Small and tight',
      params: { snap: 0.2, tone: 0.4, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Shaken beads',
        params: { resonance: 6000, rattle: 250, amount: 1, width: 0.8, threshold: -54, mix: 0.27 },
      },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'buzz-left-in-slack-hide-deep-room',
    name: 'Slack hide, deep room',
    category: 'drum',
    description:
      'A deep slow kit with a soft leather lacing that flaps after every stroke, in a short gated room.',
    preview: SKINS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Deep and slow',
      params: { length: 1, tune: 2, volume: -4 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Soft strap',
        params: {
          amount: 1,
          resonance: 1800,
          fall: 2500,
          tone: 3500,
          tracking: 0,
          threshold: -54,
          mix: 0.6,
        },
      },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'buzz-left-in-cardboard-and-wasp',
    name: 'Cardboard and wasp',
    category: 'drum',
    description:
      'A dusty paper kit with one dry sheet catching on it, in the same place for every drum, through a kitchen radio.',
    preview: SKINS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Dusty',
      params: { drive: 0.2, length: 1.2, volume: 5.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Paper on strings',
        params: { amount: 0.9, tracking: 0, resonance: 2400, fall: 1800, threshold: -54, mix: 0.8 },
      },
      { deviceId: 'patina', preset: 'Kitchen radio', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'buzz-left-in-pebble-under-the-rim',
    name: 'Pebble under the rim',
    category: 'bell',
    description:
      'A slit tongue drum: a pebble knocks three times for each stroke, spaced and dry, then the tongue alone.',
    preview: TONGUES,
    instrument: {
      deviceId: 'handpan',
      preset: 'Slit drum',
      params: { decay: 1.6, cavity: 0.6, volume: -4.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Three shells',
        params: {
          resonance: 1800,
          tone: 6000,
          rattle: 130,
          curve: 0.1,
          width: 0.3,
          threshold: -54,
        },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'buzz-left-in-steel-that-asks-for-it',
    name: 'Steel that asks for it',
    category: 'bell',
    description:
      'A bright tongue pan: hit hard it wakes a tight membrane tuned to a partial of the note; stroked, it does not.',
    preview: CALL,
    instrument: {
      deviceId: 'handpan',
      preset: 'Bright tongue',
      params: { decay: 2.2, sympathy: 0.1, volume: -4 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Tight skin',
        params: { threshold: -27, resonance: 3200, curve: 0, fall: 400, amount: 1 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'buzz-left-in-low-ding-on-a-thong',
    name: 'Low ding on a thong',
    category: 'bell',
    description:
      'A low steel pan laid on a leather thong: a soft flap under each ring, and bowls in fifths answering it faintly.',
    preview: UNFOLDING,
    instrument: {
      deviceId: 'handpan',
      preset: 'Low ding',
      params: { decay: 3, sympathy: 0.1, cavity: 0.5, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'buzzing-bridge',
        preset: 'Lyre leather',
        params: { amount: 1, resonance: 1200, fall: 1500, threshold: -54 },
      },
      { deviceId: 'bowls', preset: 'Faint halo', params: { root: 2, scale: 4, mix: 0.2 } },
    ],
  },
]
