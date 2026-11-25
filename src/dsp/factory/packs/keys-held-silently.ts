import { type FactoryPreset, type Phrase } from '../types'

// A chord is held down without a sound, and whatever is played into it comes back as that chord:
// short strokes, knocks, weather and tunes. Laid out by what excites the strings, then by the keys
// that are held (triads to elevenths, fifths, fourths, six keys chosen singly, chords that walk),
// then by how long and how brightly they ring. Every held key is a white one.

// Dry strokes under C3 E3 G3: C2 shares a great deal with them, D2 almost nothing, G2 and A2 a part.
const STRIKE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.2, note: 36, gain: 0.85 },
    { atSec: 1.5, durSec: 0.2, note: 38, gain: 0.85 },
    { atSec: 3, durSec: 0.2, note: 43, gain: 0.8 },
    { atSec: 4.3, durSec: 0.2, note: 45, gain: 0.75 },
    { atSec: 5.6, durSec: 0.2, note: 36, gain: 0.85 },
    { atSec: 5.6, durSec: 0.2, note: 48, gain: 0.6 },
  ],
}
// Single drops at uneven times, some of them keys of D F A C E and some (B, G) not.
const DROPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.12, note: 74, gain: 0.6 },
    { atSec: 0.35, durSec: 0.1, note: 69, gain: 0.45 },
    { atSec: 0.9, durSec: 0.1, note: 76, gain: 0.5 },
    { atSec: 1.3, durSec: 0.1, note: 71, gain: 0.4 },
    { atSec: 1.9, durSec: 0.12, note: 65, gain: 0.6 },
    { atSec: 2.2, durSec: 0.1, note: 72, gain: 0.45 },
    { atSec: 2.9, durSec: 0.1, note: 79, gain: 0.4 },
    { atSec: 3.2, durSec: 0.12, note: 81, gain: 0.55 },
    { atSec: 3.8, durSec: 0.12, note: 62, gain: 0.6 },
    { atSec: 4.5, durSec: 0.1, note: 64, gain: 0.5 },
    { atSec: 4.75, durSec: 0.1, note: 72, gain: 0.45 },
    { atSec: 5.2, durSec: 0.1, note: 71, gain: 0.4 },
    { atSec: 5.6, durSec: 0.12, note: 77, gain: 0.5 },
    { atSec: 6.1, durSec: 0.15, note: 74, gain: 0.6 },
  ],
}
// One dry stroke of all seven white keys, F C E G B D A from F3 up, every seven quarters of a
// second: what changes is the chord that keeps its own out of it.
const SAME: Phrase = {
  notes: [
    { atSec: 0.1, durSec: 0.18, note: 53, gain: 0.5 },
    { atSec: 0.1, durSec: 0.18, note: 60, gain: 0.4 },
    { atSec: 0.1, durSec: 0.18, note: 64, gain: 0.4 },
    { atSec: 0.1, durSec: 0.18, note: 67, gain: 0.4 },
    { atSec: 0.1, durSec: 0.18, note: 71, gain: 0.35 },
    { atSec: 0.1, durSec: 0.18, note: 74, gain: 0.4 },
    { atSec: 0.1, durSec: 0.18, note: 81, gain: 0.45 },
    { atSec: 0.6, durSec: 0.1, note: 64, gain: 0.35 },
    { atSec: 0.6, durSec: 0.1, note: 71, gain: 0.3 },
    { atSec: 1.85, durSec: 0.18, note: 53, gain: 0.5 },
    { atSec: 1.85, durSec: 0.18, note: 60, gain: 0.4 },
    { atSec: 1.85, durSec: 0.18, note: 64, gain: 0.4 },
    { atSec: 1.85, durSec: 0.18, note: 67, gain: 0.4 },
    { atSec: 1.85, durSec: 0.18, note: 71, gain: 0.35 },
    { atSec: 1.85, durSec: 0.18, note: 74, gain: 0.4 },
    { atSec: 1.85, durSec: 0.18, note: 81, gain: 0.45 },
    { atSec: 2.35, durSec: 0.1, note: 64, gain: 0.35 },
    { atSec: 2.35, durSec: 0.1, note: 71, gain: 0.3 },
    { atSec: 3.6, durSec: 0.18, note: 53, gain: 0.5 },
    { atSec: 3.6, durSec: 0.18, note: 60, gain: 0.4 },
    { atSec: 3.6, durSec: 0.18, note: 64, gain: 0.4 },
    { atSec: 3.6, durSec: 0.18, note: 67, gain: 0.4 },
    { atSec: 3.6, durSec: 0.18, note: 71, gain: 0.35 },
    { atSec: 3.6, durSec: 0.18, note: 74, gain: 0.4 },
    { atSec: 3.6, durSec: 0.18, note: 81, gain: 0.45 },
    { atSec: 4.1, durSec: 0.1, note: 64, gain: 0.35 },
    { atSec: 4.1, durSec: 0.1, note: 71, gain: 0.3 },
    { atSec: 5.35, durSec: 0.18, note: 53, gain: 0.5 },
    { atSec: 5.35, durSec: 0.18, note: 60, gain: 0.4 },
    { atSec: 5.35, durSec: 0.18, note: 64, gain: 0.4 },
    { atSec: 5.35, durSec: 0.18, note: 67, gain: 0.4 },
    { atSec: 5.35, durSec: 0.18, note: 71, gain: 0.35 },
    { atSec: 5.35, durSec: 0.18, note: 74, gain: 0.4 },
    { atSec: 5.35, durSec: 0.18, note: 81, gain: 0.45 },
  ],
}
// Four chords cut short: D minor seven, G seven, C major seven, A minor seven.
const CUT_CHORDS: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 0.16, note: 50, gain: 0.7 },
    { atSec: 0.05, durSec: 0.16, note: 57, gain: 0.55 },
    { atSec: 0.05, durSec: 0.16, note: 60, gain: 0.55 },
    { atSec: 0.05, durSec: 0.16, note: 65, gain: 0.65 },
    { atSec: 1.8, durSec: 0.16, note: 43, gain: 0.7 },
    { atSec: 1.8, durSec: 0.16, note: 55, gain: 0.5 },
    { atSec: 1.8, durSec: 0.16, note: 59, gain: 0.55 },
    { atSec: 1.8, durSec: 0.16, note: 65, gain: 0.65 },
    { atSec: 3.55, durSec: 0.16, note: 48, gain: 0.7 },
    { atSec: 3.55, durSec: 0.16, note: 55, gain: 0.5 },
    { atSec: 3.55, durSec: 0.16, note: 59, gain: 0.55 },
    { atSec: 3.55, durSec: 0.16, note: 64, gain: 0.65 },
    { atSec: 5.3, durSec: 0.16, note: 45, gain: 0.7 },
    { atSec: 5.3, durSec: 0.16, note: 55, gain: 0.5 },
    { atSec: 5.3, durSec: 0.16, note: 60, gain: 0.55 },
    { atSec: 5.3, durSec: 0.16, note: 64, gain: 0.65 },
  ],
}
// A bass one or more octaves, or a fifth besides, under one of the keys A C E G.
const BASS_BELOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.6, note: 33, gain: 0.8 },
    { atSec: 1, durSec: 0.4, note: 40, gain: 0.65 },
    { atSec: 1.9, durSec: 0.6, note: 38, gain: 0.75 },
    { atSec: 2.9, durSec: 0.6, note: 31, gain: 0.75 },
    { atSec: 3.8, durSec: 0.6, note: 36, gain: 0.75 },
    { atSec: 4.8, durSec: 0.6, note: 29, gain: 0.75 },
    { atSec: 5.7, durSec: 0.8, note: 28, gain: 0.8 },
  ],
}
// The roots of A minor, F, C and G, one to a chord that walks with them.
const BASS_ROOTS: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 0.7, note: 33, gain: 0.8 },
    { atSec: 1, durSec: 0.2, note: 33, gain: 0.5 },
    { atSec: 1.85, durSec: 0.7, note: 29, gain: 0.8 },
    { atSec: 2.8, durSec: 0.2, note: 29, gain: 0.5 },
    { atSec: 3.65, durSec: 0.7, note: 36, gain: 0.8 },
    { atSec: 4.6, durSec: 0.2, note: 36, gain: 0.5 },
    { atSec: 5.45, durSec: 0.8, note: 31, gain: 0.8 },
  ],
}
// Kick, rim, clap, toms, a snare and an open hat with the chord left alone between them.
const KNOCKS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.2, note: 60, gain: 0.85 },
    { atSec: 0.75, durSec: 0.2, note: 64, gain: 0.6 },
    { atSec: 1.25, durSec: 0.2, note: 68, gain: 0.75 },
    { atSec: 2.25, durSec: 0.2, note: 60, gain: 0.7 },
    { atSec: 2.5, durSec: 0.2, note: 69, gain: 0.6 },
    { atSec: 3.25, durSec: 0.2, note: 68, gain: 0.8 },
    { atSec: 4, durSec: 0.2, note: 60, gain: 0.85 },
    { atSec: 4.5, durSec: 0.2, note: 64, gain: 0.5 },
    { atSec: 4.75, durSec: 0.2, note: 71, gain: 0.6 },
    { atSec: 5.25, durSec: 0.2, note: 62, gain: 0.75 },
    { atSec: 5.75, durSec: 0.2, note: 67, gain: 0.45 },
  ],
}
// Noise: clap, brush (on the club kit a ride), shaker and snare, far apart.
const BRUSHES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 68, gain: 0.8 },
    { atSec: 1.2, durSec: 0.3, note: 63, gain: 0.7 },
    { atSec: 1.5, durSec: 0.2, note: 66, gain: 0.5 },
    { atSec: 2.4, durSec: 0.3, note: 62, gain: 0.8 },
    { atSec: 3.6, durSec: 0.3, note: 63, gain: 0.75 },
    { atSec: 4.2, durSec: 0.2, note: 66, gain: 0.5 },
    { atSec: 4.8, durSec: 0.3, note: 68, gain: 0.85 },
    { atSec: 6, durSec: 0.3, note: 66, gain: 0.6 },
  ],
}
// Weather let in and left in, then weather in three gusts on G, C and F, whose pentatonics are white.
const LET_IN: Phrase = { notes: [{ atSec: 0, durSec: 5.8, note: 57, gain: 0.75 }] }
const GUSTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 55, gain: 0.8 },
    { atSec: 2.4, durSec: 1.2, note: 60, gain: 0.7 },
    { atSec: 4.6, durSec: 1.4, note: 53, gain: 0.8 },
  ],
}
// Partials of a low C string, with F4 and A4 among them, which the string does not have.
const PARTIALS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.14, note: 60, gain: 0.7 },
    { atSec: 0.6, durSec: 0.14, note: 64, gain: 0.6 },
    { atSec: 1.2, durSec: 0.14, note: 67, gain: 0.65 },
    { atSec: 1.8, durSec: 0.14, note: 65, gain: 0.6 },
    { atSec: 2.4, durSec: 0.14, note: 67, gain: 0.6 },
    { atSec: 3, durSec: 0.14, note: 72, gain: 0.7 },
    { atSec: 3.6, durSec: 0.14, note: 69, gain: 0.6 },
    { atSec: 4.2, durSec: 0.14, note: 74, gain: 0.65 },
    { atSec: 4.8, durSec: 0.14, note: 72, gain: 0.6 },
    { atSec: 5.4, durSec: 0.14, note: 67, gain: 0.6 },
    { atSec: 6.2, durSec: 0.16, note: 60, gain: 0.7 },
  ],
}
// A sentence in the rhythm of speech on five neighbouring keys.
const SENTENCE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.1, note: 57, gain: 0.7 },
    { atSec: 0.18, durSec: 0.08, note: 57, gain: 0.5 },
    { atSec: 0.5, durSec: 0.16, note: 60, gain: 0.75 },
    { atSec: 0.72, durSec: 0.08, note: 59, gain: 0.5 },
    { atSec: 0.95, durSec: 0.2, note: 57, gain: 0.65 },
    { atSec: 2, durSec: 0.08, note: 55, gain: 0.5 },
    { atSec: 2.16, durSec: 0.08, note: 57, gain: 0.55 },
    { atSec: 2.45, durSec: 0.14, note: 62, gain: 0.75 },
    { atSec: 2.65, durSec: 0.08, note: 60, gain: 0.5 },
    { atSec: 2.8, durSec: 0.22, note: 57, gain: 0.65 },
    { atSec: 4, durSec: 0.1, note: 60, gain: 0.6 },
    { atSec: 4.15, durSec: 0.08, note: 59, gain: 0.5 },
    { atSec: 4.35, durSec: 0.08, note: 57, gain: 0.5 },
    { atSec: 4.8, durSec: 0.2, note: 55, gain: 0.7 },
    { atSec: 5.4, durSec: 0.3, note: 57, gain: 0.7 },
  ],
}
// Broken chords with the fingers taken off at once: A minor, F, C, G, six notes each.
const BROKEN: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 0.16, note: 45, gain: 0.7 },
    { atSec: 0.33, durSec: 0.14, note: 52, gain: 0.5 },
    { atSec: 0.61, durSec: 0.14, note: 57, gain: 0.5 },
    { atSec: 0.89, durSec: 0.14, note: 60, gain: 0.55 },
    { atSec: 1.17, durSec: 0.14, note: 64, gain: 0.6 },
    { atSec: 1.45, durSec: 0.14, note: 60, gain: 0.45 },
    { atSec: 1.73, durSec: 0.16, note: 41, gain: 0.7 },
    { atSec: 2.01, durSec: 0.14, note: 53, gain: 0.5 },
    { atSec: 2.29, durSec: 0.14, note: 57, gain: 0.5 },
    { atSec: 2.57, durSec: 0.14, note: 60, gain: 0.55 },
    { atSec: 2.85, durSec: 0.14, note: 65, gain: 0.6 },
    { atSec: 3.13, durSec: 0.14, note: 60, gain: 0.45 },
    { atSec: 3.41, durSec: 0.16, note: 48, gain: 0.7 },
    { atSec: 3.69, durSec: 0.14, note: 55, gain: 0.5 },
    { atSec: 3.97, durSec: 0.14, note: 60, gain: 0.5 },
    { atSec: 4.25, durSec: 0.14, note: 64, gain: 0.55 },
    { atSec: 4.53, durSec: 0.14, note: 67, gain: 0.6 },
    { atSec: 4.81, durSec: 0.14, note: 64, gain: 0.45 },
    { atSec: 5.09, durSec: 0.16, note: 43, gain: 0.7 },
    { atSec: 5.37, durSec: 0.14, note: 50, gain: 0.5 },
    { atSec: 5.65, durSec: 0.14, note: 55, gain: 0.5 },
    { atSec: 5.93, durSec: 0.14, note: 59, gain: 0.55 },
    { atSec: 6.21, durSec: 0.14, note: 62, gain: 0.6 },
  ],
}
// Two hands in turn, four dry notes and a rest: F, D minor, C and A minor with their sevenths.
const HOCKET: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.12, note: 53, gain: 0.7 },
    { atSec: 0.2, durSec: 0.1, note: 72, gain: 0.5 },
    { atSec: 0.4, durSec: 0.1, note: 60, gain: 0.55 },
    { atSec: 0.6, durSec: 0.1, note: 76, gain: 0.6 },
    { atSec: 1.5, durSec: 0.12, note: 50, gain: 0.7 },
    { atSec: 1.7, durSec: 0.1, note: 69, gain: 0.5 },
    { atSec: 1.9, durSec: 0.1, note: 60, gain: 0.55 },
    { atSec: 2.1, durSec: 0.1, note: 77, gain: 0.6 },
    { atSec: 3, durSec: 0.12, note: 48, gain: 0.7 },
    { atSec: 3.2, durSec: 0.1, note: 67, gain: 0.5 },
    { atSec: 3.4, durSec: 0.1, note: 59, gain: 0.55 },
    { atSec: 3.6, durSec: 0.1, note: 76, gain: 0.6 },
    { atSec: 4.5, durSec: 0.12, note: 57, gain: 0.7 },
    { atSec: 4.7, durSec: 0.1, note: 67, gain: 0.5 },
    { atSec: 4.9, durSec: 0.1, note: 60, gain: 0.55 },
    { atSec: 5.1, durSec: 0.1, note: 76, gain: 0.6 },
    { atSec: 6, durSec: 0.15, note: 57, gain: 0.65 },
  ],
}
// Single tones let go at once: A, E and C are keys of A C E G; B and F are strangers.
const TOUCH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.8, note: 57, gain: 0.7 },
    { atSec: 1.3, durSec: 0.8, note: 59, gain: 0.65 },
    { atSec: 2.6, durSec: 0.8, note: 64, gain: 0.7 },
    { atSec: 3.9, durSec: 0.8, note: 65, gain: 0.65 },
    { atSec: 5.2, durSec: 1, note: 60, gain: 0.7 },
  ],
}
// The same four chords without their roots, voice by voice a step or a common tone: D minor nine,
// G thirteen, C major nine, A minor nine. The roots are left to the strings.
const CUT_ABOVE: Phrase = {
  notes: [
    { atSec: 0.05, durSec: 0.16, note: 53, gain: 0.6 },
    { atSec: 0.05, durSec: 0.16, note: 57, gain: 0.5 },
    { atSec: 0.05, durSec: 0.16, note: 60, gain: 0.5 },
    { atSec: 0.05, durSec: 0.16, note: 64, gain: 0.65 },
    { atSec: 1.8, durSec: 0.16, note: 53, gain: 0.6 },
    { atSec: 1.8, durSec: 0.16, note: 57, gain: 0.5 },
    { atSec: 1.8, durSec: 0.16, note: 59, gain: 0.5 },
    { atSec: 1.8, durSec: 0.16, note: 64, gain: 0.65 },
    { atSec: 3.55, durSec: 0.16, note: 55, gain: 0.6 },
    { atSec: 3.55, durSec: 0.16, note: 59, gain: 0.5 },
    { atSec: 3.55, durSec: 0.16, note: 62, gain: 0.5 },
    { atSec: 3.55, durSec: 0.16, note: 64, gain: 0.65 },
    { atSec: 5.3, durSec: 0.16, note: 55, gain: 0.6 },
    { atSec: 5.3, durSec: 0.16, note: 59, gain: 0.5 },
    { atSec: 5.3, durSec: 0.16, note: 60, gain: 0.5 },
    { atSec: 5.3, durSec: 0.16, note: 64, gain: 0.65 },
  ],
}
// For the kit of faults: cut noise, crackle, static, a click and a double click, far apart.
const GRAINS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 65, gain: 0.8 },
    { atSec: 0.9, durSec: 0.2, note: 60, gain: 0.7 },
    { atSec: 1.4, durSec: 0.3, note: 63, gain: 0.75 },
    { atSec: 2.5, durSec: 0.3, note: 66, gain: 0.75 },
    { atSec: 3.2, durSec: 0.2, note: 61, gain: 0.65 },
    { atSec: 3.9, durSec: 0.3, note: 65, gain: 0.8 },
    { atSec: 5, durSec: 0.3, note: 63, gain: 0.75 },
    { atSec: 5.6, durSec: 0.2, note: 60, gain: 0.65 },
    { atSec: 6.2, durSec: 0.3, note: 66, gain: 0.75 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'keys-held-silently-woodblock-on-a-triad',
    name: 'Woodblock on a triad',
    category: 'keys',
    description:
      'Rubber between the strings knocks like wood, and a C major triad held without a sound rings four seconds after each knock.',
    preview: STRIKE,
    instrument: { deviceId: 'prepared-piano', preset: 'Wood blocks', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Triad under staccato',
        params: { root1: 24, shape1: 2, ring: 4, mix: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'keys-held-silently-eraser-and-wide-ninth',
    name: 'Eraser and wide ninth',
    category: 'keys',
    description:
      'Rubber thunks under a D minor ninth spread over almost three octaves, rung dark for twelve seconds; a tape slap repeats both once.',
    preview: DROPS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { tone: 0.4, decay: 0.5, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Dark strings',
        params: {
          root1: 26,
          shape1: 8,
          spacing: 2,
          ring: 12,
          tilt: -8,
          partials: 5,
          lift: 28,
          mix: 0.75,
        },
      },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'keys-held-silently-bolt-over-long-fifths',
    name: 'Bolt over long fifths',
    category: 'keys',
    description:
      'Light bolts cut short over A1, E2 and A2 with a bass string below, all held silently and left to ring fourteen seconds.',
    preview: STRIKE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { decay: 0.3, position: 0.33, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Open fifth and bass',
        params: { root1: 9, shape1: 15, bass: 0.6, ring: 14, partials: 8, tilt: -1, mix: 0.65 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'keys-held-silently-paper-wakes-fourths',
    name: 'Paper wakes fourths',
    category: 'keys',
    description:
      'Paper buzzes on the strings and A, D, G and C held in open spacing answer it brightly, under a very slow low-pass sweep.',
    preview: SAME,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { decay: 0.35, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fourths in the air',
        params: { root1: 21, shape1: 17, spacing: 1, tilt: 2, ring: 5, mix: 0.7 },
      },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 3800 } },
    ],
  },
  {
    id: 'keys-held-silently-felt-taps-a-low-string',
    name: 'Felt taps a low string',
    category: 'keys',
    description:
      'Muted strikes pick single partials out of one free C string, which rings on for more than twenty seconds, thickened by a detuned copy.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { decay: 0.4, volume: 3.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'One long string',
        params: { root1: 12, shape1: 1, ring: 22, sharpness: 0.8, tilt: 2, mix: 0.75 },
      },
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
    ],
  },
  {
    id: 'keys-held-silently-tin-asks-half-a-question',
    name: 'Tin asks half a question',
    category: 'bell',
    description:
      'Tin chimes struck short over B, D, F and A held silently: a half-diminished chord answers and is turned slowly by a phaser.',
    preview: DROPS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { decay: 0.3, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Sharp ears',
        params: {
          root1: 35,
          shape1: 20,
          sharpness: 0.7,
          ring: 7,
          lift: 26,
          mix: 0.72,
          output: 2.5,
        },
      },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'keys-held-silently-rubber-eight-pedals',
    name: 'Rubber, eight pedals',
    category: 'keys',
    description:
      'Soft rubber notes fall into eight chords, changed every three quarters of a second with quick dampers; a clean echo follows.',
    preview: HOCKET,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { decay: 0.4, hammer: 0.5, volume: 5.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Quick walk of eight',
        params: {
          root1: 17,
          shape1: 4,
          root2: 21,
          shape2: 6,
          root3: 26,
          shape3: 6,
          root4: 19,
          shape4: 11,
          root5: 24,
          shape5: 7,
          root6: 21,
          shape6: 10,
          root7: 17,
          shape7: 22,
          root8: 28,
          shape8: 11,
          count: 8,
          spacing: 1,
          every: 0.75,
          damper: 180,
          mix: 0.7,
        },
      },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 750, mix: 0.22 } },
    ],
  },
  {
    id: 'keys-held-silently-rattle-into-a-lydian',
    name: 'Rattle into a lydian',
    category: 'keys',
    description:
      'Loose bolts rattle over F1 and a lydian eleventh spread wide above it, driven hard, rung nine seconds and lightly limited.',
    preview: STRIKE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { decay: 0.35, detune: 0.6, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Deep lydian',
        params: {
          root1: 5,
          shape1: 22,
          spacing: 2,
          bass: 0,
          ring: 9,
          lift: 30,
          lowCut: 120,
          tilt: 0,
          mix: 0.6,
        },
      },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'keys-held-silently-short-answer-from-sus',
    name: 'Short answer from sus',
    category: 'keys',
    description:
      'Loose, hard-struck unisons answered for a second only by G, C and D, then by two springs.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Loose unisons',
      params: { decay: 0.25, hammer: 0.85, volume: -1.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Short answer',
        params: { root1: 19, shape1: 11, ring: 1.2, lift: 30, spacing: 2, mix: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'keys-held-silently-gong-held-to-a-point',
    name: 'Gong held to a point',
    category: 'bell',
    description:
      'Gongs cut to a stroke over C, E, G and A, heard so sharply that only true matches ring; small lights move on them.',
    preview: HOCKET,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { decay: 0.3, hammer: 0.5, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Sharp ears',
        params: { root1: 24, shape1: 12, sharpness: 1, ring: 11, lift: 32, spacing: 1, mix: 0.75 },
      },
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.5 } },
    ],
  },
  {
    id: 'keys-held-silently-white-hand-on-the-lid',
    name: 'White hand on the lid',
    category: 'keys',
    description:
      'A felt whisper over six white keys held as a flat hand from F3 to D4, every attack blurred into a short cloud.',
    preview: DROPS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { decay: 0.4, tone: 0.4, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Cluster haze',
        params: {
          shape1: 0,
          key1: 42,
          key2: 44,
          key3: 46,
          key4: 48,
          key5: 49,
          key6: 51,
          ring: 6,
          mix: 0.8,
        },
      },
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'keys-held-silently-one-stroke-four-rooms',
    name: 'One stroke, four rooms',
    category: 'keys',
    description:
      'A plain piano strikes the same seven white keys into A minor seven, F major seven, C major nine and G six, changed as a pedal would.',
    preview: SAME,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Plain piano',
      params: { decay: 0.25, thud: 0.1, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 21,
          shape1: 6,
          root2: 17,
          shape2: 4,
          root3: 24,
          shape3: 7,
          root4: 19,
          shape4: 12,
          count: 4,
          spacing: 1,
          every: 1.75,
          damper: 400,
          ring: 6,
          lift: 26,
          mix: 0.75,
        },
      },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'keys-held-silently-reed-into-minor-seven',
    name: 'Reed into minor seven',
    category: 'keys',
    description:
      'Quick magnet notes, let go at once, leave what A, C, E and G share with them; B and F leave little.',
    preview: TOUCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { bloom: 0.05, damper: 0.08, bright: 0.4, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor seven held',
        params: { root1: 21, shape1: 6, spacing: 1, ring: 6, lift: 24, mix: 0.75 },
      },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'keys-held-silently-whistle-on-a-ninth',
    name: 'Whistle on a ninth',
    category: 'bell',
    description:
      'Magnets on the eighth harmonic whistle over D minor nine, and the strings answer high and glassy in front of a thin wash.',
    preview: HOCKET,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { bloom: 0.08, damper: 0.1, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Glass strings',
        params: { root1: 26, shape1: 8, tilt: 4, ring: 8, lowCut: 250, mix: 0.7 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'keys-held-silently-twelfth-off-fifths-stay',
    name: 'Twelfth off, fifths stay',
    category: 'organ',
    description:
      'A twelfth-organ stop cut off short, with C, G and D left ringing in fifths behind it, and a slow vibrato that comes late.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 0.06, damper: 0.06, volume: -1 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fifths out of clicks',
        params: {
          root1: 24,
          shape1: 14,
          lowCut: 60,
          tilt: -3,
          ring: 9,
          lift: 26,
          sharpness: 0.4,
          mix: 0.7,
        },
      },
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
    ],
  },
  {
    id: 'keys-held-silently-soft-hammer-dark-floor',
    name: 'Soft hammer, dark floor',
    category: 'keys',
    description:
      'A hammer with hardly any magnet after it, over D2, A2 and D3 held silently with bass strings and only their lowest partials.',
    preview: STRIKE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { damper: 0.06, bloom: 8, sympathy: 0, volume: -11.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Dark strings',
        params: { root1: 14, shape1: 15, bass: 0.7, partials: 3, ring: 10, mix: 0.7 },
      },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'keys-held-silently-ripple-over-four-walks',
    name: 'Ripple over four walks',
    category: 'keys',
    description:
      'A fast rippling harmonic falls into four chords, changed every second and three quarters, that overlap through a slow damper.',
    preview: CUT_ABOVE,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Ripple',
      params: { bloom: 0.08, damper: 0.1, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 26,
          shape1: 8,
          root2: 31,
          shape2: 5,
          root3: 24,
          shape3: 7,
          root4: 33,
          shape4: 6,
          count: 4,
          every: 1.75,
          damper: 2000,
          ring: 5,
          mix: 0.65,
        },
      },
      { deviceId: 'around', preset: 'Gentle sway' },
    ],
  },
  {
    id: 'keys-held-silently-glass-seven-over-a-vowel',
    name: 'Glass seven over a vowel',
    category: 'voice',
    description:
      'Bowed glass cut short over an F major seven in open spacing, its ring sung back by a faint choir.',
    preview: SAME,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { bloom: 0.12, damper: 0.1, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor seven held',
        params: { root1: 17, shape1: 4, spacing: 1, ring: 4, mix: 0.7 },
      },
      { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { decay: 2.5, mix: 0.3 } },
    ],
  },
  {
    id: 'keys-held-silently-overtones-keep-a-string',
    name: 'Overtones keep a string',
    category: 'drone',
    description:
      'A choir of overtones, short, over one free A string with twelve partials that sings on for a quarter of a minute in slow bands.',
    preview: TOUCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: { bloom: 0.2, damper: 0.15, sweep: 0.2, volume: -5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'One long string',
        params: { root1: 9, shape1: 1, ring: 15, tilt: 0, lift: 24, mix: 0.8 },
      },
      { deviceId: 'currents', preset: 'Gentle drift' },
    ],
  },
  {
    id: 'keys-held-silently-sine-meets-three-keys',
    name: 'Sine meets three keys',
    category: 'keys',
    description:
      'Bare sines ring on only where they meet A3, C4 or E4, held with their lowest partial and no other; B and F leave silence.',
    preview: TOUCH,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { bloom: 0.06, damper: 0.06, volume: -8.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Keys alone',
        params: { root1: 33, shape1: 3, partials: 1, ring: 8, sharpness: 0.85, lift: 30, mix: 0.8 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'keys-held-silently-two-sways-and-a-hammer',
    name: 'Two sways and a hammer',
    category: 'keys',
    description:
      'Felt and magnets, short, under two ninths that swap every second and a half and bleed into each other.',
    preview: HOCKET,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Felt and magnets',
      params: { bloom: 0.3, damper: 0.1, hammer: 1, volume: -6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Two chords swaying',
        params: {
          root1: 26,
          shape1: 8,
          root2: 21,
          shape2: 8,
          count: 2,
          every: 1.5,
          ring: 5,
          mix: 0.7,
        },
      },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'keys-held-silently-wood-bars-the-door',
    name: 'Wood bars the door',
    category: 'keys',
    description:
      'A dark wooden body, stopped short, with six white keys from E2 to C4 held open below and close above, rung for two seconds.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Dark wood',
      params: { bloom: 0.1, damper: 0.06, volume: -8 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Six keys of my own',
        params: {
          shape1: 0,
          key1: 29,
          key2: 36,
          key3: 42,
          key4: 44,
          key5: 46,
          key6: 49,
          ring: 2,
          tilt: -4,
          mix: 0.7,
        },
      },
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'keys-held-silently-palm-mute-keys-kept',
    name: 'Palm mute, keys kept',
    category: 'plucked',
    description:
      'Muted steel strings broken across four chords, while A, C, E and G stay held and keep only what is theirs.',
    preview: BROKEN,
    instrument: { deviceId: 'acoustic-guitar', preset: 'Muted pattern', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor seven held',
        params: { root1: 21, shape1: 6, spacing: 1, ring: 5, mix: 0.65 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'keys-held-silently-pizzicato-on-an-eleventh',
    name: 'Pizzicato on an eleventh',
    category: 'plucked',
    description:
      'Nylon pizzicato under the six keys of D minor eleven, spread to the edges and rung eight seconds.',
    preview: DROPS,
    instrument: { deviceId: 'acoustic-guitar', preset: 'Nylon pizzicato', params: { volume: 6.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Wide major nine',
        params: { root1: 26, shape1: 23, spacing: 1, ring: 8, lift: 26, mix: 0.7, output: 3.0 },
      },
      { deviceId: 'reveal', preset: 'Gentle opening' },
    ],
  },
  {
    id: 'keys-held-silently-twelve-strings-a-pedal',
    name: 'Twelve strings, a pedal',
    category: 'plucked',
    description:
      'A twelve-string cut off early, pressed flat, and the pedal that catches it is G, A and D, bright and six seconds long.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { sustain: 1.5, release: 0.2, nail: 0.5, position: 0.2, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Glass strings',
        params: { root1: 31, shape1: 10, tilt: 3, lowCut: 90, ring: 6, mix: 0.65, output: 4.0 },
      },
      { deviceId: 'fet-limiter', preset: 'Squash' },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
  },
  {
    id: 'keys-held-silently-nail-and-a-dry-sixth',
    name: 'Nail and a dry sixth',
    category: 'plucked',
    description:
      'A nylon string plucked at the bridge with the nail, stopped, and F, A, C and D answer for a second and a half.',
    preview: BROKEN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { sustain: 0.6, release: 0.05, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Short answer',
        params: { root1: 17, shape1: 12, ring: 1.5, mix: 0.75, lift: 28, output: 0.5 },
      },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 420, mix: 0.2 } },
    ],
  },
  {
    id: 'keys-held-silently-broken-over-a-walk',
    name: 'Broken over a walk',
    category: 'plucked',
    description:
      'Steel strings broken over A minor, F, C and G, with four held chords that walk in step and are damped as they change.',
    preview: BROKEN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { sustain: 0.7, release: 0.06, volume: 0.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 21,
          shape1: 6,
          root2: 17,
          shape2: 4,
          root3: 24,
          shape3: 4,
          root4: 19,
          shape4: 12,
          count: 4,
          spacing: 1,
          every: 1.68,
          damper: 300,
          ring: 4,
          lift: 26,
          mix: 0.7,
        },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'keys-held-silently-thumb-on-the-floorboards',
    name: 'Thumb on the floorboards',
    category: 'plucked',
    description:
      'A soft thumb, short, over C1, G1 and C2 and their high partials, all in the middle, with a room round them.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { sustain: 0.7, release: 0.06, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Stacked octaves',
        params: { root1: 0, shape1: 15, tilt: -1, ring: 12, width: 0.1, mix: 0.65 },
      },
      { deviceId: 're-amp', preset: 'Just the room', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'keys-held-silently-glass-pick-finds-c',
    name: 'Glass pick finds C',
    category: 'bell',
    description:
      'A glass pick over C in four octaves: partials of C ring for eighteen seconds, F and A find little to hold.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { sustain: 0.6, release: 0.05, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Stacked octaves',
        params: { root1: 12, shape1: 16, sharpness: 0.8, ring: 18, tilt: 1, mix: 0.75 },
      },
      { deviceId: 'prism', preset: 'Short chirp' },
    ],
  },
  {
    id: 'keys-held-silently-lazy-hand-blurred-walk',
    name: 'Lazy hand, blurred walk',
    category: 'plucked',
    description:
      'A slow strum, cut short, over five chords that are let go so slowly that each one still rings under the next.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { sustain: 0.8, release: 0.08, strum: 60, volume: 1.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Slow blurred walk',
        params: {
          root1: 26,
          shape1: 6,
          root2: 19,
          shape2: 12,
          root3: 24,
          shape3: 7,
          root4: 21,
          shape4: 8,
          root5: 17,
          shape5: 22,
          count: 5,
          every: 1.75,
          ring: 10,
          mix: 0.65,
        },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'keys-held-silently-dark-wood-no-thirds',
    name: 'Dark wood, no thirds',
    category: 'plucked',
    description:
      'A dark, dull string, stopped, over D, A and E: no third anywhere, and the answer sinks a little in pitch as it fades.',
    preview: SAME,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { sustain: 0.9, release: 0.08, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fifths out of clicks',
        params: { root1: 14, shape1: 14, ring: 8, tilt: -5, lowCut: 40, lift: 30, mix: 0.75 },
      },
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'keys-held-silently-nylon-speaks-in-g',
    name: 'Nylon speaks in G',
    category: 'plucked',
    description:
      'Nylon strings in the rhythm of speech, and each word wakes G, B, D and F for three seconds under a wandering pan.',
    preview: SENTENCE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { sustain: 0.5, release: 0.05, strum: 0, nail: 0.6, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Speech into a chord',
        params: { root1: 19, shape1: 5, ring: 3, sharpness: 0.4, mix: 0.7 },
      },
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'keys-held-silently-dry-bars-sixth-kept',
    name: 'Dry bars, sixth kept',
    category: 'bell',
    description:
      'A dry xylophone, struck a drop at a time, over F, A, C and D held silently; the sixth rings four seconds behind the bars.',
    preview: DROPS,
    instrument: { deviceId: 'mallets', preset: 'Dry xylophone', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor seven held',
        params: { root1: 17, shape1: 12, spacing: 1, ring: 4, lift: 26, mix: 0.7 },
      },
      { deviceId: 'size', preset: 'A shade larger' },
    ],
  },
  {
    id: 'keys-held-silently-marimba-under-a-lid',
    name: 'Marimba under a lid',
    category: 'bell',
    description:
      'A marimba damped short, its low strokes waking C2, G2 and D3 with bass strings; everything above is dulled.',
    preview: STRIKE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { decay: 0.35, damper: 1, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Open fifth and bass',
        params: { root1: 12, shape1: 14, bass: 0.4, ring: 10, partials: 5, mix: 0.65 },
      },
      { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 1400 } },
    ],
  },
  {
    id: 'keys-held-silently-celesta-leaves-fourths',
    name: 'Celesta leaves fourths',
    category: 'bell',
    description:
      'A celesta stopped at once and D, G, C and F kept apart in open spacing behind it, with a scatter of late echoes.',
    preview: DROPS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { damper: 1, decay: 0.3, volume: -3.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fourths in the air',
        params: { root1: 26, shape1: 17, spacing: 1, ring: 6, tilt: 1, mix: 0.7 },
      },
      { deviceId: 'constellation', preset: 'Faint points' },
    ],
  },
  {
    id: 'keys-held-silently-glock-chips-on-a-ninth',
    name: 'Glock chips on a ninth',
    category: 'bell',
    description:
      'Glockenspiel chips with nothing under them; a C major nine from C4 up takes them in and rings on in the middle of the field.',
    preview: DROPS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { damper: 1, decay: 0.25, mallet: 0.6, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Glass strings',
        params: {
          root1: 36,
          shape1: 7,
          ring: 3,
          tilt: -3,
          width: 0,
          lowCut: 200,
          lift: 28,
          mix: 0.8,
        },
      },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'keys-held-silently-vibes-stopped-by-hand',
    name: 'Vibes stopped by hand',
    category: 'bell',
    description:
      'Vibraphone chords stopped by hand, their roots left to four held chords that change with them; a slow rotor sways it all.',
    preview: CUT_ABOVE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { damper: 1, decay: 0.3, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 26,
          shape1: 6,
          root2: 31,
          shape2: 12,
          root3: 24,
          shape3: 7,
          root4: 33,
          shape4: 6,
          count: 4,
          every: 1.75,
          damper: 900,
          ring: 7,
          mix: 0.7,
        },
      },
      { deviceId: 'rotary', preset: 'Soft blend' },
    ],
  },
  {
    id: 'keys-held-silently-rolled-then-the-pedal',
    name: 'Rolled, then the pedal',
    category: 'bell',
    description:
      'A quick hard roll cut off at the key and D minor eleven left hanging, with its low end and its air taken away.',
    preview: TOUCH,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { damper: 1, decay: 0.5, roll: 16, volume: 2.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Blunt ears',
        params: { root1: 26, shape1: 23, ring: 8, tilt: 1, lowCut: 300, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'keys-held-silently-humming-bars-one-f',
    name: 'Humming bars, one F',
    category: 'drone',
    description:
      'Soft bars without an edge play over one string on F1, whose twelve partials ring most of half a minute and leave D and E out.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { damper: 0.9, decay: 0.5, volume: -12.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'One long string',
        params: { root1: 5, shape1: 1, ring: 26, tilt: 3, lift: 28, sharpness: 0.6, mix: 0.75 },
      },
      { deviceId: 'analog-drive', preset: 'Low warmth' },
    ],
  },
  {
    id: 'keys-held-silently-motor-off-dust-on',
    name: 'Motor off, dust on',
    category: 'texture',
    description:
      'A vibraphone with its motor off, stopped short in the rhythm of speech; record dust and its notes alike wake A, B and E.',
    preview: SENTENCE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { damper: 1, decay: 0.3, motor: 0, volume: -9.0 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dust and scratches' },
      {
        deviceId: 'silent-keys',
        preset: 'Triad under staccato',
        params: { root1: 33, shape1: 10, ring: 2.5, sharpness: 0.2, lift: 30, mix: 0.7 },
      },
    ],
  },
  {
    id: 'keys-held-silently-kick-and-clap-in-fifths',
    name: 'Kick and clap in fifths',
    category: 'drum',
    description:
      'Small tight drums into A2, E3 and B3: every knock and clap leaves fifths behind, held down by a firm limiter.',
    preview: KNOCKS,
    instrument: { deviceId: 'drum-kit', preset: 'Small and tight', params: { volume: -0.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fifths out of clicks',
        params: { root1: 21, shape1: 14, ring: 4, mix: 0.6 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 6, outputGain: -4 } },
    ],
  },
  {
    id: 'keys-held-silently-brush-on-a-minor-ninth',
    name: 'Brush on a minor ninth',
    category: 'texture',
    description:
      'Brushed noise from a soft kit over D minor nine, driven hard and rung seven seconds, the strings far in front.',
    preview: BRUSHES,
    instrument: { deviceId: 'drum-kit', preset: 'Brushed', params: { volume: 6.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor nine in noise',
        params: { root1: 26, shape1: 8, ring: 7, mix: 0.85, output: -2.5 },
      },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'keys-held-silently-paper-drum-two-sways',
    name: 'Paper drum, two sways',
    category: 'drum',
    description:
      'A paper kit under two open chords that swap every bar of two seconds, the kick kept off the strings.',
    preview: KNOCKS,
    instrument: { deviceId: 'drum-kit', preset: 'Paper kit', params: { length: 0.6, volume: 6.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Two chords swaying',
        params: {
          root1: 24,
          shape1: 9,
          root2: 21,
          shape2: 6,
          count: 2,
          every: 2,
          lowCut: 150,
          sharpness: 0.1,
          lift: 34,
          ring: 2.5,
          mix: 0.65,
        },
      },
      { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.1 } },
    ],
  },
  {
    id: 'keys-held-silently-toms-tune-themselves',
    name: 'Toms tune themselves',
    category: 'drum',
    description:
      'Toms glide past F1, C2 and F2 and leave those keys ringing low and dark for eight seconds, with a hint of a wooden body.',
    preview: KNOCKS,
    instrument: { deviceId: 'drum-kit', preset: 'Long toms', params: { length: 1, volume: -5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Dark strings',
        params: {
          root1: 5,
          shape1: 15,
          ring: 8,
          partials: 6,
          tilt: -6,
          lift: 26,
          sharpness: 0.2,
          mix: 0.65,
        },
      },
      { deviceId: 'vessel', preset: 'Hint of wood' },
    ],
  },
  {
    id: 'keys-held-silently-ticks-in-a-high-lydian',
    name: 'Ticks in a high lydian',
    category: 'drum',
    description:
      'Bright ticks over F, A, C, E, G and B held from F3 up, rung three seconds, with a faint dust of sparks thrown off.',
    preview: KNOCKS,
    instrument: { deviceId: 'drum-kit', preset: 'Bright ticks', params: { volume: -2.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Glass strings',
        params: {
          root1: 29,
          shape1: 22,
          ring: 3,
          tilt: 3,
          lift: 34,
          sharpness: 0.05,
          lowCut: 500,
          mix: 0.7,
        },
      },
      { deviceId: 'glints', preset: 'Faint dust' },
    ],
  },
  {
    id: 'keys-held-silently-dust-box-half-pedal',
    name: 'Dust box, half pedal',
    category: 'drum',
    description:
      'A dusty kit answered for under a second by G, B, D and F in open spacing, like a pedal that is hardly down.',
    preview: BRUSHES,
    instrument: { deviceId: 'drum-kit', preset: 'Dusty', params: { length: 0.8, volume: 6.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Short answer',
        params: { root1: 19, shape1: 5, ring: 0.8, sharpness: 0, lift: 34, mix: 0.75 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'keys-held-silently-heavy-steps-on-d',
    name: 'Heavy steps on D',
    category: 'drum',
    description:
      'Slow heavy steps over D1, A1 and D2 and a bass string under them, all of it swung slowly from ear to ear.',
    preview: KNOCKS,
    instrument: {
      deviceId: 'drum-kit',
      preset: 'Heavy steps',
      params: { length: 0.8, drive: 0.1, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Open fifth and bass',
        params: {
          root1: 2,
          shape1: 15,
          bass: 1,
          ring: 6,
          sharpness: 0.2,
          tilt: 0,
          lift: 26,
          mix: 0.6,
        },
      },
      { deviceId: 'around', preset: 'Ear to ear', params: { rate: 0.15 } },
    ],
  },
  {
    id: 'keys-held-silently-muffled-loop-eight-keys',
    name: 'Muffled loop, eight keys',
    category: 'drum',
    description:
      'A muffled kit over eight chords of seven eighths of a second each, the old strings damped at once, pushed through a console.',
    preview: KNOCKS,
    instrument: { deviceId: 'drum-kit', preset: 'Muffled', params: { length: 0.6, volume: 1.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Quick walk of eight',
        params: {
          root1: 24,
          shape1: 7,
          root2: 21,
          shape2: 6,
          root3: 17,
          shape3: 4,
          root4: 26,
          shape4: 8,
          root5: 19,
          shape5: 11,
          root6: 28,
          shape6: 11,
          root7: 21,
          shape7: 10,
          root8: 19,
          shape8: 5,
          count: 8,
          spacing: 1,
          every: 0.875,
          damper: 100,
          sharpness: 0.1,
          lift: 34,
          lowCut: 90,
          mix: 0.7,
        },
      },
      { deviceId: 'analog-drive', preset: 'Console' },
    ],
  },
  {
    id: 'keys-held-silently-rain-picks-a-ninth',
    name: 'Rain picks a ninth',
    category: 'texture',
    description:
      'Rain on a window over D, F, A, C and E: the drops lift whatever partial they touch, four seconds at a time.',
    preview: LET_IN,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { attack: 0.4, release: 1.5, density: 0.3, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor nine in noise',
        params: { root1: 26, shape1: 8, ring: 4, mix: 0.85, output: 2.0 },
      },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'keys-held-silently-tin-roof-open-fourths',
    name: 'Tin roof, open fourths',
    category: 'texture',
    description:
      'Rain on tin over A, D, G and C held wide; the roof has its own note and the strings take only what fits.',
    preview: GUSTS,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on tin',
      params: { attack: 0.1, release: 0.4, density: 0.35, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fourths in the air',
        params: { root1: 21, shape1: 17, sharpness: 0.1, lift: 36, ring: 5, mix: 0.8, output: 4.5 },
      },
      { deviceId: 'spread', preset: 'Wide ends' },
    ],
  },
  {
    id: 'keys-held-silently-gusts-through-six-keys',
    name: 'Gusts through six keys',
    category: 'texture',
    description:
      'Short gusts of hill wind wake C, G, D, A, E and B, six keys stacked in fifths, each gust for ten seconds.',
    preview: GUSTS,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { attack: 0.15, release: 0.5, density: 0.6, volume: 0.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Six keys of my own',
        params: {
          shape1: 0,
          key1: 25,
          key2: 32,
          key3: 39,
          key4: 46,
          key5: 53,
          key6: 60,
          sharpness: 0.1,
          ring: 10,
          lift: 34,
          mix: 0.85,
        },
      },
      { deviceId: 'phaser', preset: 'Faint shade' },
    ],
  },
  {
    id: 'keys-held-silently-embers-in-a-major-six',
    name: 'Embers in a major six',
    category: 'texture',
    description:
      'A bonfire snaps into G, B, D and E in open spacing; each snap is a small plucked chord, and fine echoes skip after it.',
    preview: LET_IN,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Bonfire',
      params: { attack: 0.1, release: 0.5, density: 0.6, volume: 4.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Speech into a chord',
        params: { root1: 19, shape1: 12, ring: 2.5, lift: 34, sharpness: 0, mix: 0.85 },
      },
      { deviceId: 'skipping-stone', preset: 'Soft pebble' },
    ],
  },
  {
    id: 'keys-held-silently-shore-under-four-hands',
    name: 'Shore under four hands',
    category: 'texture',
    description:
      'Breakers over four chords of a second and three quarters, blurred into each other by a slow damper.',
    preview: LET_IN,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Breakers',
      params: { attack: 0.3, release: 1, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 21,
          shape1: 8,
          root2: 17,
          shape2: 7,
          root3: 24,
          shape3: 9,
          root4: 19,
          shape4: 11,
          count: 4,
          spacing: 1,
          every: 1.75,
          damper: 2500,
          sharpness: 0.1,
          lift: 34,
          ring: 3,
          mix: 0.85,
        },
      },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'keys-held-silently-crackle-finds-octaves',
    name: 'Crackle finds octaves',
    category: 'drone',
    description:
      'Dusty crackle over C1, C2, C3 and C4 and their twelve partials: a bare C built from clicks.',
    preview: LET_IN,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Dusty crackle',
      params: { attack: 0.1, release: 0.4, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Stacked octaves',
        params: { root1: 0, shape1: 16, sharpness: 0, lift: 36, ring: 7, mix: 0.85, output: -0.5 },
      },
      { deviceId: 'currents', preset: 'Glass notes' },
    ],
  },
  {
    id: 'keys-held-silently-hum-meets-an-open-fifth',
    name: 'Hum meets an open fifth',
    category: 'drone',
    description:
      'A mains hum let in and shut off in gusts; F1, C2 and F2 catch it and go on alone for twelve seconds, slowly breathing.',
    preview: GUSTS,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { attack: 0.05, release: 0.1, tone: 0.6, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Sharp ears',
        params: { root1: 5, shape1: 15, ring: 12, tilt: 1, lift: 30, mix: 0.85 },
      },
      { deviceId: 'breath', preset: 'Barely there' },
    ],
  },
  {
    id: 'keys-held-silently-shell-with-a-minor-seven',
    name: 'Shell with a minor seven',
    category: 'texture',
    description:
      'The sea in a shell over A, C, E and G from A3 up: the strings alone with no dry sound at all, in slow uneven swells.',
    preview: LET_IN,
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Sea in a shell',
      params: { attack: 0.3, release: 1, volume: -2.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Strings without the dry',
        params: {
          root1: 33,
          shape1: 6,
          spacing: 0,
          sharpness: 0.1,
          lift: 36,
          ring: 8,
          tilt: -6,
          mix: 1,
        },
      },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'keys-held-silently-thud-under-four-keys',
    name: 'Thud under four keys',
    category: 'bass',
    description:
      'A muted thud octaves or a fifth under A, C, E and G, which are held in open spacing and speak above it for six seconds.',
    preview: BASS_BELOW,
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { volume: 2.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor seven held',
        params: { root1: 21, shape1: 6, spacing: 1, ring: 6, lift: 26, mix: 0.65 },
      },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'keys-held-silently-pick-four-chords-up',
    name: 'Pick, four chords up',
    category: 'bass',
    description:
      'A bright pick stopped short, with a chord over each root that changes as the roots do, damped in a quarter of a second.',
    preview: BASS_ROOTS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { mute: 0.4, release: 0.05, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 21,
          shape1: 6,
          root2: 17,
          shape2: 4,
          root3: 24,
          shape3: 7,
          root4: 19,
          shape4: 12,
          count: 4,
          spacing: 1,
          every: 1.8,
          damper: 250,
          ring: 5,
          lift: 26,
          mix: 0.65,
        },
      },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'keys-held-silently-upright-ninth-far-back',
    name: 'Upright, ninth far back',
    category: 'bass',
    description:
      'A plucked upright under a wide D minor nine held silently, dark and twelve seconds long, all of it set a little way back.',
    preview: BASS_BELOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 1.2, release: 0.06, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Wide major nine',
        params: {
          root1: 14,
          shape1: 8,
          ring: 12,
          tilt: -3,
          sharpness: 0.35,
          lift: 28,
          mix: 0.7,
          output: 2.0,
        },
      },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.3 } },
    ],
  },
  {
    id: 'keys-held-silently-flat-strings-sus-above',
    name: 'Flat strings, sus above',
    category: 'bass',
    description:
      'Dark flat-wound notes cut off and E, A and B left for a second and a half, like a hand lifted slowly.',
    preview: BASS_BELOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { release: 0.05, sustain: 0.8, volume: 5.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Short answer',
        params: { root1: 28, shape1: 11, ring: 1.5, spacing: 0, lift: 32, mix: 0.75 },
      },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'keys-held-silently-near-the-bridge-fifths',
    name: 'Near the bridge, fifths',
    category: 'bass',
    description:
      'A bass plucked by the bridge, its high partials caught by D4, A4 and E5 with the lows kept off the strings, all of it thrown wide.',
    preview: BASS_BELOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { release: 0.06, mute: 0.2, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fifths out of clicks',
        params: {
          root1: 38,
          shape1: 14,
          sharpness: 0.4,
          tilt: 0,
          lowCut: 180,
          ring: 7,
          lift: 32,
          mix: 0.7,
        },
      },
      { deviceId: 'stereo-widener', preset: 'Ultra wide' },
    ],
  },
  {
    id: 'keys-held-silently-fretless-over-lydian',
    name: 'Fretless over lydian',
    category: 'bass',
    description:
      'A growling fretless, let go early, into F, A, C, E, G and B; the middle is pulsed softly six times a second.',
    preview: BASS_ROOTS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { release: 0.05, mute: 0.15, sustain: 2, volume: 0.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Deep lydian',
        params: { root1: 17, shape1: 22, bass: 0.3, ring: 5, mix: 0.6 },
      },
      { deviceId: 'band-pulse', preset: 'Six a second', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'keys-held-silently-slap-wakes-a-sixth',
    name: 'Slap wakes a sixth',
    category: 'bass',
    description:
      'A slapped upright into D, F, A and B, which ring nine seconds, more than half of it through a small loudspeaker.',
    preview: BASS_BELOW,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { sustain: 1, release: 0.05, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Blunt ears',
        params: { root1: 26, shape1: 13, ring: 9, lift: 30, tilt: 1, mix: 0.65, output: 2.5 },
      },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'keys-held-silently-thumb-white-half-moon',
    name: 'Thumb, white half moon',
    category: 'bass',
    description:
      'A thumb at the neck under six keys from A2 to G4, ten seconds long, the bass and the strings drifting on a tape.',
    preview: BASS_ROOTS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { release: 0.06, mute: 0.35, volume: 1.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Six keys of my own',
        params: {
          shape1: 0,
          key1: 34,
          key2: 41,
          key3: 48,
          key4: 49,
          key5: 51,
          key6: 56,
          ring: 10,
          tilt: -2,
          lift: 28,
          mix: 0.75,
        },
      },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'keys-held-silently-pedal-nobody-pressed',
    name: 'Pedal nobody pressed',
    category: 'keys',
    description:
      'A bare piano without pedal, cut short over C, E and G, which were held before it played; a little room after.',
    preview: STRIKE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { damper: 1, resonance: 0, reverbMix: 0, outputDb: -18.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Triad under staccato',
        params: { root1: 24, shape1: 2, spacing: 1, ring: 6, lift: 26, mix: 0.65 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'keys-held-silently-four-chords-no-pedal',
    name: 'Four chords, no pedal',
    category: 'keys',
    description:
      'Felted chords cut off, each into its own held ninth, that changes with it and is damped as slowly as half a pedal.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.8, resonance: 0, reverbMix: 0, outputDb: -16.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 26,
          shape1: 8,
          root2: 31,
          shape2: 9,
          root3: 24,
          shape3: 7,
          root4: 33,
          shape4: 8,
          count: 4,
          every: 1.75,
          damper: 1200,
          ring: 8,
          lift: 28,
          mix: 0.75,
        },
      },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'keys-held-silently-glass-upright-b-and-f',
    name: 'Glass upright, B and F',
    category: 'keys',
    description:
      'A hard glassy upright over B, D, F and A held in open spacing for twelve seconds, every strike pushed back behind its ring.',
    preview: SAME,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { width: 0.2, resonance: 0, reverbMix: 0, outputDb: -8.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Sharp ears',
        params: { root1: 23, shape1: 20, spacing: 1, ring: 12, sharpness: 0.5, mix: 0.75 },
      },
      { deviceId: 'sift', preset: 'Soft hammers' },
    ],
  },
  {
    id: 'keys-held-silently-creak-then-eleventh',
    name: 'Creak, then eleventh',
    category: 'keys',
    description:
      'A close and creaky piano whose action noise, like its notes, falls into A minor eleven, with the quiet tails brought up.',
    preview: DROPS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { felt: 0.7, resonance: 0, reverbMix: 0, outputDb: -2 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Cluster haze',
        params: { root1: 21, shape1: 23, spacing: 1, ring: 7, lift: 32, mix: 0.75 },
      },
      { deviceId: 'lift', preset: 'Just the ends' },
    ],
  },
  {
    id: 'keys-held-silently-worn-keys-in-a-row',
    name: 'Worn keys in a row',
    category: 'keys',
    description:
      'A worn mono piano speaks on five keys and is answered for two seconds by G, C, D, with a dark slow echo behind.',
    preview: SENTENCE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { resonance: 0, reverbMix: 0, outputDb: -11.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Speech into a chord',
        params: { root1: 31, shape1: 11, ring: 2, mix: 0.75 },
      },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'keys-held-silently-old-upright-on-a-c',
    name: 'Old upright on a C',
    category: 'drone',
    description:
      'An old upright plays partials of C1, C2, C3 and C4; what fits hangs for twelve seconds and turns on a wheel.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { damper: 1, resonance: 0, reverbMix: 0, outputDb: -10.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Stacked octaves',
        params: { root1: 0, shape1: 16, ring: 12, tilt: 1, lift: 28, mix: 0.75 },
      },
      { deviceId: 'currents', preset: 'One slow wheel' },
    ],
  },
  {
    id: 'keys-held-silently-thud-that-has-a-fifth',
    name: 'Thud that has a fifth',
    category: 'keys',
    description:
      'Nothing but felt and thud, two hands in turn, into A2, E3 and B3 with their low partials only and a faint octave added.',
    preview: HOCKET,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { resonance: 0, reverbMix: 0, outputDb: -10.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Dark strings',
        params: {
          root1: 21,
          shape1: 14,
          ring: 5,
          partials: 3,
          sharpness: 0.2,
          lift: 30,
          mix: 0.75,
        },
      },
      { deviceId: 'octaves', preset: 'Faint octave' },
    ],
  },
  {
    id: 'keys-held-silently-word-without-a-throat',
    name: 'Word without a throat',
    category: 'voice',
    description:
      'A short vowel in the rhythm of speech, and each word wakes D, F, A and C in open spacing for three seconds.',
    preview: SENTENCE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Vowel flutter',
      params: { attack: 0.005, release: 0.04, sub: 0, volume: -3.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Speech into a chord',
        params: { root1: 26, shape1: 6, ring: 3, mix: 0.75 },
      },
      { deviceId: 'vowel-reverb', preset: 'Lone voice', params: { decay: 1.5, mix: 0.2 } },
    ],
  },
  {
    id: 'keys-held-silently-pulse-cut-into-a-nine',
    name: 'Pulse cut into a nine',
    category: 'keys',
    description:
      'A narrow pulse cut to a stroke, A, C, E, G and B held wide above it and rung nine seconds; all through a rotor cabinet that stands still.',
    preview: CUT_CHORDS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.005, release: 0.03, volume: -9.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Wide major nine',
        params: { root1: 21, shape1: 8, ring: 9, lift: 26, mix: 0.7 },
      },
      { deviceId: 'rotary', preset: 'Stopped horn' },
    ],
  },
  {
    id: 'keys-held-silently-glass-keys-shut-lid',
    name: 'Glass keys, shut lid',
    category: 'bell',
    description:
      'A glass bell table shut off at the key and F, A, C, E and G from F3 up carry on alone for three seconds, echoed by two heads.',
    preview: HOCKET,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 0.04, volume: -5.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Glass strings',
        params: { root1: 29, shape1: 7, ring: 3, tilt: 0, width: 1, mix: 0.75 },
      },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'keys-held-silently-saws-through-a-keyhole',
    name: 'Saws through a keyhole',
    category: 'keys',
    description:
      'Thick saws shut off at once, whose many partials ring C1, G1 and C2 from bottom to top, half of it through a swept filter.',
    preview: STRIKE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.005, release: 0.03, cutoff: 3000, volume: -8 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Stacked octaves',
        params: { root1: 0, shape1: 15, ring: 8, tilt: 0, partials: 12, lift: 24, mix: 0.7 },
      },
      { deviceId: 'auto-filter', preset: 'Dub sweep', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'keys-held-silently-hollow-walking-by',
    name: 'Hollow, walking by',
    category: 'keys',
    description:
      'A hollow table, quick and dry, broken through four triads; each is held as itself, then as the top of a seventh a third below.',
    preview: BROKEN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.005, release: 0.05, motion: 0.2, cutoff: 2600, volume: -3 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 21,
          shape1: 8,
          root2: 17,
          shape2: 4,
          root3: 17,
          shape3: 9,
          root4: 26,
          shape4: 6,
          root5: 24,
          shape5: 4,
          root6: 21,
          shape6: 6,
          root7: 19,
          shape7: 9,
          root8: 16,
          shape8: 6,
          count: 8,
          spacing: 1,
          every: 0.84,
          damper: 500,
          ring: 5,
          mix: 0.75,
        },
      },
      { deviceId: 'phaser', preset: 'Glacial sweep' },
    ],
  },
  {
    id: 'keys-held-silently-still-sine-sleeping-c',
    name: 'Still sine, sleeping C',
    category: 'drone',
    description:
      'A still sine plays partials of C2 under a very sharp ear: a partial rings half a minute, a stranger barely at all.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.005, release: 0.05, sub: 0, cutoff: 3000, volume: -1.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Sharp ears',
        params: { root1: 12, shape1: 1, ring: 30, partials: 12, tilt: 2, lift: 28, mix: 0.8 },
      },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'keys-held-silently-frozen-top-fourths-lit',
    name: 'Frozen top, fourths lit',
    category: 'texture',
    description:
      'Splinters of a frozen spectrum into E, A, D and G from E4, rung short and bright, with a ladder of fading echoes.',
    preview: DROPS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { attack: 0.005, release: 0.03, cutoff: 9000, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fourths in the air',
        params: { root1: 40, shape1: 17, spacing: 0, tilt: 3, ring: 2.5, mix: 0.75 },
      },
      { deviceId: 'constellation', preset: 'Bent ladder', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'keys-held-silently-dawn-finds-the-pedal',
    name: 'Dawn finds the pedal',
    category: 'texture',
    description:
      'Birds at dawn over six keys from D4 to C6 held with their first eight partials: a call that crosses one lights it.',
    preview: LET_IN,
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { attack: 0.2, release: 1.5, volume: -5.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Keys alone',
        params: {
          shape1: 0,
          key1: 51,
          key2: 56,
          key3: 61,
          key4: 63,
          key5: 68,
          key6: 73,
          partials: 8,
          tilt: -1,
          sharpness: 0.1,
          lift: 34,
          ring: 6,
          mix: 0.8,
        },
      },
      { deviceId: 'murmuration', preset: 'Two close by' },
    ],
  },
  {
    id: 'keys-held-silently-frogs-on-open-strings',
    name: 'Frogs on open strings',
    category: 'texture',
    description:
      'A pond of frogs over D2, A2 and D3 with bass strings under them, each croak a low short chord.',
    preview: LET_IN,
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { attack: 0.1, release: 0.6, volume: 3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Open fifth and bass',
        params: { root1: 14, shape1: 15, bass: 0.5, ring: 2, lift: 30, sharpness: 0.2, mix: 0.75 },
      },
      { deviceId: 'underwater', preset: 'A toe in' },
    ],
  },
  {
    id: 'keys-held-silently-trickle-into-a-ninth',
    name: 'Trickle into a ninth',
    category: 'texture',
    description:
      'A trickle of water, drop by drop, into C, E, G, B and D; the strings hold the drops four seconds and a few of them sink.',
    preview: LET_IN,
    instrument: {
      deviceId: 'outdoors',
      preset: 'Trickle',
      params: { attack: 0.2, release: 0.8, volume: 4.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor nine in noise',
        params: { root1: 24, shape1: 7, ring: 4, tilt: -1, mix: 0.85 },
      },
      { deviceId: 'falling', preset: 'Nearly dry' },
    ],
  },
  {
    id: 'keys-held-silently-thunder-keeps-the-fifth',
    name: 'Thunder keeps the fifth',
    category: 'drone',
    description:
      'Thunder overhead rolls into A1, E2 and A2, whose low partials stay for fifteen seconds after it.',
    preview: GUSTS,
    instrument: {
      deviceId: 'outdoors',
      preset: 'Storm overhead',
      params: { release: 0.5, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Open fifth and bass',
        params: { root1: 9, shape1: 15, bass: 0.3, ring: 15, sharpness: 0.1, lift: 28, mix: 0.75 },
      },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'keys-held-silently-chimes-agree-on-white',
    name: 'Chimes agree on white',
    category: 'bell',
    description:
      'Porch chimes over a hand of six white keys, G3 to E5; what the wind strikes is sorted into them, with a faint echo backwards.',
    preview: GUSTS,
    instrument: {
      deviceId: 'outdoors',
      preset: 'Porch chimes',
      params: { release: 1, volume: -5.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Six keys of my own',
        params: {
          shape1: 0,
          key1: 44,
          key2: 46,
          key3: 49,
          key4: 51,
          key5: 56,
          key6: 65,
          ring: 5,
          tilt: 1,
          lift: 26,
          mix: 0.75,
        },
      },
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
    ],
  },
  {
    id: 'keys-held-silently-water-past-four-doors',
    name: 'Water past four doors',
    category: 'texture',
    description:
      'Fast water over four high chords of a second and three quarters, A minor, F, C and G, bright and thinly veiled.',
    preview: LET_IN,
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { attack: 0.3, release: 1, volume: -1.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 33,
          shape1: 6,
          root2: 29,
          shape2: 4,
          root3: 36,
          shape3: 4,
          root4: 31,
          shape4: 12,
          count: 4,
          every: 1.75,
          damper: 800,
          sharpness: 0,
          lift: 36,
          ring: 3,
          tilt: 2,
          lowCut: 300,
          mix: 0.85,
        },
      },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
  },
  {
    id: 'keys-held-silently-clicks-with-a-key-held',
    name: 'Clicks with a key held',
    category: 'drum',
    description:
      'Clean clicks, each a chord: A2, E3 and B3 ring from them in fifths, with what lies under 150 hertz kept off the strings.',
    preview: GRAINS,
    instrument: { deviceId: 'glitch-kit', preset: 'Clean clicks', params: { volume: 6.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fifths out of clicks',
        params: { root1: 21, shape1: 14, ring: 8, mix: 0.8 },
      },
      { deviceId: 'pulses', preset: 'Faint ripple' },
    ],
  },
  {
    id: 'keys-held-silently-faults-in-d-minor',
    name: 'Faults in D minor',
    category: 'texture',
    description:
      'Soft faults over D, F, A, C and E driven as hard as the strings allow, on a worn thin tape.',
    preview: GRAINS,
    instrument: { deviceId: 'glitch-kit', preset: 'Soft faults', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor nine in noise',
        params: { root1: 26, shape1: 8, ring: 3, tilt: -5, mix: 0.8, output: 2 },
      },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'keys-held-silently-static-learns-to-walk',
    name: 'Static learns to walk',
    category: 'drum',
    description:
      'Broken static under two chords a second, from G to C by way of D and A; the strings hang on for hardly a second.',
    preview: KNOCKS,
    instrument: { deviceId: 'glitch-kit', preset: 'Broken stream', params: { volume: 4.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Quick walk of eight',
        params: {
          root1: 19,
          shape1: 9,
          root2: 26,
          shape2: 6,
          root3: 21,
          shape3: 6,
          root4: 24,
          shape4: 4,
          count: 4,
          spacing: 1,
          every: 0.5,
          damper: 60,
          ring: 1,
          sharpness: 0.1,
          lift: 34,
          mix: 0.8,
        },
      },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
    ],
  },
  {
    id: 'keys-held-silently-long-burst-low-octaves',
    name: 'Long burst, low octaves',
    category: 'drone',
    description:
      'Long bursts an octave down over F1, F2, F3 and F4: noise goes in and one note in four octaves comes out.',
    preview: GRAINS,
    instrument: { deviceId: 'glitch-kit', preset: 'Octave down', params: { volume: 2.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Stacked octaves',
        params: { root1: 5, shape1: 16, ring: 9, sharpness: 0, lift: 34, tilt: -2, mix: 0.8 },
      },
      { deviceId: 'radio', preset: 'Hint of static' },
    ],
  },
  {
    id: 'keys-held-silently-high-pips-high-seventh',
    name: 'High pips, high seventh',
    category: 'drum',
    description:
      'High pips over C5, E5, G5 and B5, rung two seconds high above any melody; a few are caught and bounced.',
    preview: KNOCKS,
    instrument: { deviceId: 'glitch-kit', preset: 'High pips', params: { tune: 7, volume: 1 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Glass strings',
        params: { root1: 48, shape1: 4, ring: 2, tilt: 4, lift: 32, sharpness: 0, mix: 0.75 },
      },
      { deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'keys-held-silently-house-with-a-pedal-down',
    name: 'House with a pedal down',
    category: 'drum',
    description:
      'A tight club kit into C, E, G and D; the kick is kept from the strings and the claps fill them.',
    preview: KNOCKS,
    instrument: { deviceId: 'club-kit', preset: 'Tight and dry', params: { volume: 2 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor nine in noise',
        params: { root1: 24, shape1: 9, ring: 5, lowCut: 200, mix: 0.7 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'keys-held-silently-deep-floor-a-below',
    name: 'Deep floor, A below',
    category: 'drum',
    description:
      'Deep round drums over A1, E2 and B2 with the low cut left down, so the kick itself plucks the string.',
    preview: KNOCKS,
    instrument: {
      deviceId: 'club-kit',
      preset: 'Deep and round',
      params: { length: 0.7, volume: -3 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Dark strings',
        params: {
          root1: 9,
          shape1: 14,
          ring: 6,
          partials: 8,
          tilt: -4,
          sharpness: 0.2,
          lift: 28,
          mix: 0.65,
        },
      },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'keys-held-silently-shoebox-walking-chord',
    name: 'Shoebox, walking chord',
    category: 'drum',
    description:
      'A dusty drum box over three chords of a second and a half, quickly damped, most of it through a bright loudspeaker.',
    preview: KNOCKS,
    instrument: { deviceId: 'club-kit', preset: 'Dusty box', params: { volume: 5.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 17,
          shape1: 7,
          root2: 26,
          shape2: 6,
          root3: 21,
          shape3: 6,
          count: 3,
          spacing: 1,
          every: 1.5,
          damper: 200,
          sharpness: 0.1,
          lift: 34,
          ring: 3,
          lowCut: 100,
          mix: 0.7,
        },
      },
      { deviceId: 're-amp', preset: 'Clean and bright', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'keys-held-silently-glass-tops-held-sky',
    name: 'Glass tops, held sky',
    category: 'drum',
    description:
      'Glass-bright tops over a lydian from F4 rung six seconds, the lows kept off the strings and the top thrown wide.',
    preview: BRUSHES,
    instrument: { deviceId: 'club-kit', preset: 'Glass tops', params: { volume: 2.5 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Blunt ears',
        params: { root1: 41, shape1: 22, ring: 6, tilt: 4, lift: 36, lowCut: 600, mix: 0.8 },
      },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'keys-held-silently-late-warm-bar-in-g',
    name: 'Late warm bar in G',
    category: 'drum',
    description:
      'A warm soft kit answered for half a second by G, C and D, in and out with each hit like a half-shut door.',
    preview: BRUSHES,
    instrument: { deviceId: 'club-kit', preset: 'Warm and soft', params: { volume: 6.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Short answer',
        params: {
          root1: 19,
          shape1: 11,
          ring: 0.5,
          sharpness: 0,
          lift: 36,
          mix: 0.75,
          output: 1.5,
        },
      },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'keys-held-silently-dry-harp-held-dorian',
    name: 'Dry harp, held dorian',
    category: 'plucked',
    description:
      'A harp damped at each string, D, F, A and B held under it for eight seconds: the pedal is in other hands.',
    preview: BROKEN,
    instrument: { deviceId: 'harp', preset: 'Short dry pluck', params: { volume: 1.0 } },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Minor seven held',
        params: { root1: 26, shape1: 13, ring: 8, lift: 26, mix: 0.65 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.1 } },
    ],
  },
  {
    id: 'keys-held-silently-koto-knocks-at-a-fourth',
    name: 'Koto knocks at a fourth',
    category: 'plucked',
    description:
      'Koto strings stopped short over E, A, D and G in the middle octave, rung bright and two seconds long.',
    preview: SAME,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { damp: 1, decay: 0.25, halo: 0, volume: 1.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Fourths in the air',
        params: { root1: 28, shape1: 17, spacing: 0, ring: 2, tilt: 4, mix: 0.75 },
      },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'keys-held-silently-muted-harp-four-gates',
    name: 'Muted harp, four gates',
    category: 'plucked',
    description:
      'A muted harp broken through A minor, F, C and G while the held chords change under it and blur by a second.',
    preview: BROKEN,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 1, decay: 0.4, halo: 0, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Walk of four',
        params: {
          root1: 21,
          shape1: 6,
          root2: 17,
          shape2: 7,
          root3: 24,
          shape3: 4,
          root4: 19,
          shape4: 9,
          count: 4,
          spacing: 1,
          every: 1.68,
          damper: 1000,
          ring: 6,
          mix: 0.7,
        },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'keys-held-silently-guzheng-left-on-c',
    name: 'Guzheng left on C',
    category: 'plucked',
    description:
      'A guzheng, every string stopped, plays partials of C2; the string keeps them and a round repeats the line four notes behind.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { damp: 1, decay: 0.3, halo: 0, volume: 5.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'One long string',
        params: { root1: 12, shape1: 1, ring: 16, tilt: 1, lift: 26, mix: 0.7 },
      },
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 2.4 } },
    ],
  },
  {
    id: 'keys-held-silently-soundboard-says-eleven',
    name: 'Soundboard says eleven',
    category: 'plucked',
    description:
      'Plucks near the soundboard, dry, wake A, C, E, G, B and D from A2 up, dark and wide, with a slight sway.',
    preview: DROPS,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { damp: 1, decay: 0.3, halo: 0, volume: 6.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Dark strings',
        params: {
          root1: 21,
          shape1: 23,
          spacing: 2,
          ring: 9,
          width: 1,
          lift: 28,
          mix: 0.8,
          output: 3.5,
        },
      },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.35 } },
    ],
  },
  {
    id: 'keys-held-silently-hollow-harp-low-lamp',
    name: 'Hollow harp, low lamp',
    category: 'plucked',
    description:
      'A dark hollow harp cut short over G1, D2 and G2, which ring eleven seconds over a bass string, warmed by tape.',
    preview: STRIKE,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { damp: 1, decay: 0.3, halo: 0, volume: -3.0 },
    },
    effects: [
      {
        deviceId: 'silent-keys',
        preset: 'Open fifth and bass',
        params: { root1: 7, shape1: 15, bass: 0.4, ring: 11, partials: 6, mix: 0.7 },
      },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
]
