import { type FactoryPreset, type Phrase } from '../types'

// Chains of suspensions on the white keys: a note is tied over a change of bass, becomes a 7th,
// a 4th or a 9th, and sinks a step. Laid out as five ways of swelling into that clash and out of
// it (struck, leaned, bowed in, breathed, held behind) by the weight of each instrument.

// 7-6 chain: the bass steps D C B A with tenths over it, and the top voice, tied across each
// step, is a 7th that sinks to a 6th.
const SEVENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 1.5, note: 65, gain: 0.35 },
    { atSec: 0, durSec: 2.25, note: 71, gain: 0.55 },
    { atSec: 1.5, durSec: 1.5, note: 48, gain: 0.6 },
    { atSec: 1.5, durSec: 1.5, note: 64, gain: 0.35 },
    { atSec: 2.25, durSec: 1.5, note: 69, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 47, gain: 0.6 },
    { atSec: 3, durSec: 1.5, note: 62, gain: 0.35 },
    { atSec: 3.75, durSec: 1.5, note: 67, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 45, gain: 0.6 },
    { atSec: 4.5, durSec: 2.1, note: 60, gain: 0.35 },
    { atSec: 5.25, durSec: 1.35, note: 65, gain: 0.55 },
  ],
}

// The same chain begun on A: bass A G F E, top voice F E D C, low and in the minor with no
// accidental.
const A_MINOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 45, gain: 0.6 },
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.35 },
    { atSec: 0, durSec: 2.25, note: 65, gain: 0.55 },
    { atSec: 1.5, durSec: 1.5, note: 43, gain: 0.6 },
    { atSec: 1.5, durSec: 1.5, note: 59, gain: 0.35 },
    { atSec: 2.25, durSec: 1.5, note: 64, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 41, gain: 0.6 },
    { atSec: 3, durSec: 1.5, note: 57, gain: 0.35 },
    { atSec: 3.75, durSec: 1.5, note: 62, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 40, gain: 0.6 },
    { atSec: 4.5, durSec: 2.1, note: 55, gain: 0.35 },
    { atSec: 5.25, durSec: 1.35, note: 60, gain: 0.55 },
  ],
}

// 4-3 chain: bass C B A G, top voice E D C B a tenth over it, each tied over as a 4th and let down
// to a 3rd, with a middle voice to fill the chord.
const TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 48, gain: 0.6 },
    { atSec: 0, durSec: 2.25, note: 64, gain: 0.55 },
    { atSec: 0, durSec: 3, note: 55, gain: 0.35 },
    { atSec: 1.5, durSec: 1.5, note: 47, gain: 0.6 },
    { atSec: 2.25, durSec: 1.5, note: 62, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 45, gain: 0.6 },
    { atSec: 3, durSec: 1.5, note: 52, gain: 0.35 },
    { atSec: 3.75, durSec: 1.5, note: 60, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 43, gain: 0.6 },
    { atSec: 4.5, durSec: 2.1, note: 55, gain: 0.35 },
    { atSec: 5.25, durSec: 1.35, note: 59, gain: 0.55 },
  ],
}

// The same 4-3 chain an octave up, for high voices and thin ranks.
const HIGH_TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 60, gain: 0.6 },
    { atSec: 0, durSec: 2.25, note: 76, gain: 0.55 },
    { atSec: 0, durSec: 3, note: 67, gain: 0.35 },
    { atSec: 1.5, durSec: 1.5, note: 59, gain: 0.6 },
    { atSec: 2.25, durSec: 1.5, note: 74, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 57, gain: 0.6 },
    { atSec: 3, durSec: 1.5, note: 64, gain: 0.35 },
    { atSec: 3.75, durSec: 1.5, note: 72, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 55, gain: 0.6 },
    { atSec: 4.5, durSec: 2.1, note: 67, gain: 0.35 },
    { atSec: 5.25, durSec: 1.35, note: 71, gain: 0.55 },
  ],
}

// The 4-3 chain on two strings of a bass: C B A G below, E D C B two beats behind, tenth, 11th,
// tenth.
const DOUBLE_STOPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 36, gain: 0.7 },
    { atSec: 0, durSec: 2.25, note: 52, gain: 0.55 },
    { atSec: 1.5, durSec: 1.5, note: 35, gain: 0.7 },
    { atSec: 2.25, durSec: 1.5, note: 50, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 33, gain: 0.7 },
    { atSec: 3.75, durSec: 1.5, note: 48, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 31, gain: 0.7 },
    { atSec: 5.25, durSec: 1.35, note: 47, gain: 0.55 },
  ],
}

// 2-3 chain, where the lower voice is the one that is tied: the top moves on the beat to a 9th
// and the bass sinks after it to a tenth.
const LATE_FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 2.25, note: 38, gain: 0.65 },
    { atSec: 1.5, durSec: 1.5, note: 52, gain: 0.5 },
    { atSec: 2.25, durSec: 1.5, note: 36, gain: 0.65 },
    { atSec: 3, durSec: 1.5, note: 50, gain: 0.5 },
    { atSec: 3.75, durSec: 1.5, note: 35, gain: 0.65 },
    { atSec: 4.5, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 5.25, durSec: 1.55, note: 33, gain: 0.65 },
  ],
}

// The 7-6 chain in two voices on a bass, begun on A: F E D C over A G F E, sixth, seventh, sixth.
const NECK_SEVENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 45, gain: 0.65 },
    { atSec: 0, durSec: 2.25, note: 53, gain: 0.55 },
    { atSec: 1.5, durSec: 1.5, note: 43, gain: 0.65 },
    { atSec: 2.25, durSec: 1.5, note: 52, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 41, gain: 0.65 },
    { atSec: 3.75, durSec: 1.5, note: 50, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 40, gain: 0.65 },
    { atSec: 5.25, durSec: 1.35, note: 48, gain: 0.55 },
  ],
}

// The 7-6 chain broken into one line for what cannot hold a tie: each bass note from D down to F,
// then the note before struck again as a 7th, then its fall to the 6th.
const STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.7, note: 38, gain: 0.75 },
    { atSec: 0.7, durSec: 0.34, note: 47, gain: 0.48 },
    { atSec: 1.05, durSec: 0.34, note: 36, gain: 0.73 },
    { atSec: 1.4, durSec: 0.34, note: 47, gain: 0.62 },
    { atSec: 1.75, durSec: 0.34, note: 45, gain: 0.48 },
    { atSec: 2.1, durSec: 0.34, note: 35, gain: 0.71 },
    { atSec: 2.45, durSec: 0.34, note: 45, gain: 0.62 },
    { atSec: 2.8, durSec: 0.34, note: 43, gain: 0.48 },
    { atSec: 3.15, durSec: 0.34, note: 33, gain: 0.69 },
    { atSec: 3.5, durSec: 0.34, note: 43, gain: 0.62 },
    { atSec: 3.85, durSec: 0.34, note: 41, gain: 0.48 },
    { atSec: 4.2, durSec: 0.34, note: 31, gain: 0.67 },
    { atSec: 4.55, durSec: 0.34, note: 41, gain: 0.62 },
    { atSec: 4.9, durSec: 0.34, note: 40, gain: 0.48 },
    { atSec: 5.25, durSec: 0.34, note: 29, gain: 0.66 },
    { atSec: 5.6, durSec: 0.34, note: 40, gain: 0.6 },
    { atSec: 5.95, durSec: 0.9, note: 38, gain: 0.5 },
  ],
}

// D minor seventh, G seventh, C: over G the 9th and 4th are tied and fall to 8 and 3, over C the
// 4th and 7th to 3 and 6, so it ends on an added 6th.
const DOWN_A_FIFTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 3.1, note: 57, gain: 0.4 },
    { atSec: 0, durSec: 3.1, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 5.2, note: 65, gain: 0.45 },
    { atSec: 2, durSec: 2.1, note: 43, gain: 0.6 },
    { atSec: 3.1, durSec: 2.1, note: 71, gain: 0.5 },
    { atSec: 3.1, durSec: 3.8, note: 55, gain: 0.4 },
    { atSec: 4.1, durSec: 2.8, note: 48, gain: 0.6 },
    { atSec: 5.2, durSec: 1.7, note: 64, gain: 0.45 },
    { atSec: 5.2, durSec: 1.7, note: 69, gain: 0.5 },
  ],
}

// Two equal voices that climb by clashing: one leaps a step over the other, the lower one gives
// way; bass B A D C a tenth or so under them.
const LEAPFROG: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 59, gain: 0.5 },
    { atSec: 0, durSec: 2.2, note: 74, gain: 0.5 },
    { atSec: 1.4, durSec: 1.4, note: 57, gain: 0.5 },
    { atSec: 1.4, durSec: 2.2, note: 76, gain: 0.5 },
    { atSec: 2.2, durSec: 0.6, note: 72, gain: 0.5 },
    { atSec: 2.8, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 2.8, durSec: 2.2, note: 77, gain: 0.5 },
    { atSec: 3.6, durSec: 0.6, note: 74, gain: 0.5 },
    { atSec: 4.2, durSec: 2.4, note: 60, gain: 0.5 },
    { atSec: 4.2, durSec: 2.4, note: 79, gain: 0.5 },
    { atSec: 5, durSec: 1.6, note: 76, gain: 0.5 },
  ],
}

// Sixth chords stepping down from C with the bass tied behind them: a 9th under each new chord
// until it sinks.
const LATE_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.5, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 2.25, note: 48, gain: 0.6 },
    { atSec: 1.5, durSec: 1.5, note: 62, gain: 0.4 },
    { atSec: 1.5, durSec: 1.5, note: 67, gain: 0.5 },
    { atSec: 2.25, durSec: 1.5, note: 47, gain: 0.6 },
    { atSec: 3, durSec: 1.5, note: 60, gain: 0.4 },
    { atSec: 3, durSec: 1.5, note: 65, gain: 0.5 },
    { atSec: 3.75, durSec: 1.5, note: 45, gain: 0.6 },
    { atSec: 4.5, durSec: 2.3, note: 59, gain: 0.4 },
    { atSec: 4.5, durSec: 2.3, note: 64, gain: 0.5 },
    { atSec: 5.25, durSec: 1.55, note: 43, gain: 0.6 },
  ],
}

// 7-6 from A with each fall ornamented: the tied note dips to the fifth of the chord before it
// lands on the 6th.
const ORNAMENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 45, gain: 0.6 },
    { atSec: 0, durSec: 2.25, note: 77, gain: 0.55 },
    { atSec: 0.3, durSec: 1.3, note: 60, gain: 0.35 },
    { atSec: 1.6, durSec: 1.6, note: 43, gain: 0.6 },
    { atSec: 1.9, durSec: 1.3, note: 59, gain: 0.35 },
    { atSec: 2.25, durSec: 0.25, note: 74, gain: 0.3 },
    { atSec: 2.5, durSec: 1.35, note: 76, gain: 0.45 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.6 },
    { atSec: 3.5, durSec: 1.3, note: 57, gain: 0.35 },
    { atSec: 3.85, durSec: 0.25, note: 72, gain: 0.3 },
    { atSec: 4.1, durSec: 1.35, note: 74, gain: 0.45 },
    { atSec: 4.8, durSec: 2, note: 40, gain: 0.6 },
    { atSec: 5.1, durSec: 1.7, note: 55, gain: 0.35 },
    { atSec: 5.45, durSec: 0.25, note: 71, gain: 0.3 },
    { atSec: 5.7, durSec: 1.1, note: 72, gain: 0.42 },
  ],
}

// The chain in two voices and nothing else: D C B A under B A G F, sixth, seventh, sixth.
const BARE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 62, gain: 0.55 },
    { atSec: 0, durSec: 2.25, note: 71, gain: 0.55 },
    { atSec: 1.5, durSec: 1.5, note: 60, gain: 0.55 },
    { atSec: 2.25, durSec: 1.5, note: 69, gain: 0.55 },
    { atSec: 3, durSec: 1.5, note: 59, gain: 0.55 },
    { atSec: 3.75, durSec: 1.5, note: 67, gain: 0.55 },
    { atSec: 4.5, durSec: 2.1, note: 57, gain: 0.55 },
    { atSec: 5.25, durSec: 1.35, note: 65, gain: 0.55 },
  ],
}

// One long lean for what speaks slowly: C major, then B in the bass, the E and C above it a 4th
// and a 9th that sink together to D and B.
const LONG_LEAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.1, note: 48, gain: 0.6 },
    { atSec: 0, durSec: 4.8, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 4.8, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 55, gain: 0.4 },
    { atSec: 3.1, durSec: 3.9, note: 47, gain: 0.6 },
    { atSec: 4.8, durSec: 2.2, note: 62, gain: 0.5 },
    { atSec: 4.8, durSec: 2.2, note: 71, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String bass: from a thud that stops to a note that is bowed in and held.
  {
    id: 'suspension-chains-tied-over-the-bar-line',
    name: 'Tied over the bar line',
    category: 'bass',
    description:
      'A growling fretless left ringing, straight at each move of the bass and swaying while it leans, on a dark plate.',
    preview: NECK_SEVENTHS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Singing fretless',
      params: { volume: -3.5, growl: 0.9, sustain: 9, release: 0.5 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 180, grow: 350, depth: 28 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'suspension-chains-heel-of-the-hand',
    name: 'Heel of the hand',
    category: 'bass',
    description:
      'A dark muted electric bass with transformer drive on its lows, each stroke a thud that stops short.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted thud',
      params: { mute: 0.55, tone: 0.35, release: 0.12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      { deviceId: 're-amp', preset: 'Warm stack', params: { distance: 0.1, room: 0.1 } },
    ],
  },
  {
    id: 'suspension-chains-two-strings-agree-late',
    name: 'Two strings agree late',
    category: 'bass',
    description:
      'An upright plucked on two strings inside a second wooden body that adds its own knock and hum.',
    preview: DOUBLE_STOPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: { sustain: 5, release: 0.4, touch: 0.35 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { size: 1.6, mix: 0.55 } }],
  },
  {
    id: 'suspension-chains-floor-gives-last',
    name: 'Floor gives last',
    category: 'bass',
    description:
      'A long wooden upright under a hall whose lows ring far longer than its mids, so the old bass hangs on.',
    preview: LATE_FLOOR,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: -3.5, sustain: 10, tone: 0.6, release: 0.8 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 6, mix: 0.35 } },
    ],
  },
  {
    id: 'suspension-chains-hair-on-the-low-string',
    name: 'Hair on the low string',
    category: 'bass',
    description:
      'An upright with its plucks faded in over half a second, as if bowed, and levelled by a slow compressor.',
    preview: DOUBLE_STOPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { volume: -4.5, tone: 0.75, growl: 0.6, sustain: 18, release: 1.5, resonance: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 520 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 8 } },
    ],
  },
  {
    id: 'suspension-chains-pick-against-the-beat',
    name: 'Pick against the beat',
    category: 'plucked',
    description:
      'A bright picked electric through a two-voice chorus and one faint trail of tape echo.',
    preview: LATE_FLOOR,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { volume: -0.5, sustain: 8, release: 0.4, tone: 0.8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, mix: 0.4 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 560 } },
    ],
  },
  {
    id: 'suspension-chains-flatwound-tread',
    name: 'Flatwound tread',
    category: 'bass',
    description:
      'A short dark electric with no growl, pushed onto tape and into a narrow warm spring tank.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark flat strings',
      params: { sustain: 1.2, touch: 0.4 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 12 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-minor-strings-underneath',
    name: 'Minor strings underneath',
    category: 'bass',
    description:
      'A quiet fretless with two and a half seconds of release, answered by strings tuned to A minor.',
    preview: LATE_FLOOR,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: -3, tone: 0.5, touch: 0.2 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 0.55, decay: 6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'suspension-chains-rattle-put-to-rest',
    name: 'Rattle put to rest',
    category: 'bass',
    description:
      'A rattling picked bass with a low-pass that closes again after each stroke, in a small room.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { sustain: 2, touch: 0.8 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 260, envAmount: 45, envReleaseMs: 380, resonance: 1.6 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'suspension-chains-close-to-the-saddle',
    name: 'Close to the saddle',
    category: 'plucked',
    description:
      'An electric plucked by the bridge, thin and nasal, through a phaser that leaves the bass alone.',
    preview: NECK_SEVENTHS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Near the bridge',
      params: { volume: 2, sustain: 7, mute: 0, release: 0.5, position: 0.06 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.12, mix: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'suspension-chains-thumb-lets-go',
    name: 'Thumb lets go',
    category: 'bass',
    description:
      'Neck-thumbed bass, nearly all fundamental, in a huge low space filtered under nine hundred hertz.',
    preview: DOUBLE_STOPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Thumb at the neck',
      params: { volume: -2.5, sustain: 12, release: 1 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 6, mix: 0.4 } }],
  },
  {
    id: 'suspension-chains-muted-stroke-repeated',
    name: 'Muted stroke repeated',
    category: 'plucked',
    description:
      'A palm-muted pick and a dark bucket-brigade echo that repeats it between the steps.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Muted pick',
      params: { volume: 0, mute: 0.3, tone: 0.7, release: 0.15 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 525, feedback: 0.5, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'suspension-chains-seventh-that-sings',
    name: 'Seventh that sings',
    category: 'bass',
    description:
      'A hard growling fretless fed back on itself so a held note blooms into an overtone before it falls.',
    preview: NECK_SEVENTHS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { volume: -4, sustain: 12, release: 0.6, touch: 0.4 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Slow bloom', params: { gain: 0.62, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { lowCut: 30, presence: -4, air: -6 } },
    ],
  },
  {
    id: 'suspension-chains-slap-at-the-hall-door',
    name: 'Slap at the hall door',
    category: 'plucked',
    description:
      'A slapped, rattling upright stood at the back of a hall, duller and later than its attack.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { volume: 6, sustain: 4, growl: 0.8 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.6 } }],
  },
  {
    id: 'suspension-chains-pressed-under-glass-wool',
    name: 'Pressed under glass wool',
    category: 'drone',
    description:
      'A dark soft upright caught and held as an even bed that glides from chord to chord.',
    preview: DOUBLE_STOPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { sustain: 14, release: 1.5, mute: 0 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Dark bed',
        params: { decay: 10, glide: 1.2, tone: -0.3, mix: 0.65 },
      },
    ],
  },
  {
    id: 'suspension-chains-harmonic-stays-up',
    name: 'Harmonic stays up',
    category: 'bass',
    description:
      'A plain fingered bass with pure sines an octave over its strongest partials, slow to leave.',
    preview: LATE_FLOOR,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Warm fingers',
      params: { sustain: 8, release: 0.6, tone: 0.4 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Octave halo',
        params: { partials: 4, attack: 700, mix: 0.4 },
      },
    ],
  },
  {
    id: 'suspension-chains-two-rooms-behind',
    name: 'Two rooms behind',
    category: 'bass',
    description: 'A hollow upright, lightly muted, heard from a loudspeaker two rooms down a hall.',
    preview: DOUBLE_STOPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Round upright',
      params: {
        volume: 3,
        position: 0.12,
        tone: 0.7,
        sustain: 8,
        mute: 0.1,
        resonance: 0.9,
        release: 0.6,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { treble: -0.3 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'suspension-chains-drum-turns-slowest',
    name: 'Drum turns slowest',
    category: 'bass',
    description:
      'A let-ring electric through a slow rotary cabinet with the deepest movement in its bass drum.',
    preview: NECK_SEVENTHS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { tone: 0.6, touch: 0.35, position: 0.16 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drumDepth: 0.8, drive: 0.35 } },
      { deviceId: 'tamer', preset: 'Even' },
    ],
  },
  {
    id: 'suspension-chains-section-joins-the-floor',
    name: 'Section joins the floor',
    category: 'bass',
    description:
      'A soft upright that a low string section follows, swelling in under each tied note.',
    preview: LATE_FLOOR,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Dark soft upright',
      params: { volume: 3.5, tone: 0.35, sustain: 6, resonance: 0.6, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Low section',
        params: { octaves: 0, rise: 0.9, fall: 3, mix: 0.55 },
      },
    ],
  },
  {
    id: 'suspension-chains-bass-walked-backwards',
    name: 'Bass walked backwards',
    category: 'texture',
    description:
      'A ringing fretless with its last second and a half played back in reverse behind it, dark and slow.',
    preview: STEPS,
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { volume: -2, growl: 0.7, tone: 0.55, release: 0.8, touch: 0.25 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1500, tone: 2600, mix: 0.5 },
      },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  // Reed organ: the ranks from flute to reed, each with another way of letting the 7th in.
  {
    id: 'suspension-chains-harmonium-held-its-tie',
    name: 'Harmonium held its tie',
    category: 'organ',
    description:
      'A bare harmonium reed, no upper ranks and no celeste, its bellows uneven, carried from side to side in a small room.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        octave: 0,
        twelfth: 0,
        sub: 0,
        reed: 1,
        celeste: 0,
        bellows: 0.9,
        breath: 0.1,
        attack: 0.18,
        release: 0.35,
        tone: 1300,
      },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'suspension-chains-flue-pipes-leaning',
    name: 'Flue pipes leaning',
    category: 'organ',
    description:
      'Quick-speaking chapel flutes with a breathy chiff added by stops one and two octaves up, flickering in near echoes.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { breath: 0.5, sub: 0.3, attack: 0.05, release: 0.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Flute stops',
        params: { sub: 0, fifteenth: 0.35, speak: 60, chiff: 0.9, mix: 0.6 },
      },
      { deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'suspension-chains-quint-before-the-sixth',
    name: 'Quint before the sixth',
    category: 'organ',
    description:
      'A hollow twelfth over a plain flute, driven by a triode until it buzzes, in a room that pulses slowly.',
    preview: BARE,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { octave: 0.15, attack: 0.12, release: 0.6, tone: 3800 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 3, mix: 0.35 } },
    ],
  },
  {
    id: 'suspension-chains-two-ranks-disagree',
    name: 'Two ranks disagree',
    category: 'organ',
    description:
      'A plain flute and its beating celeste, nothing else, spun by a fast rotary horn far from the microphones.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.15, release: 0.8, tone: 6000, breath: 0 },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Tremolo',
        params: { distance: 0.9, drumDepth: 0.2, hornDepth: 0.7 },
      },
    ],
  },
  {
    id: 'suspension-chains-pedal-moves-last',
    name: 'Pedal moves last',
    category: 'organ',
    description:
      'Full ranks with the sub wide open, and a limiter that lets the late bass push the chord down.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 1,
        octave: 0.5,
        twelfth: 0.2,
        fifteenth: 0.3,
        reed: 0.7,
        attack: 0.09,
        tone: 2600,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 14, outputGain: -8 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'suspension-chains-voix-lamenting',
    name: 'Voix lamenting',
    category: 'organ',
    description:
      'A human-voice reed with its tremulant shaking all the way, shaped again by a round vowel.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { volume: -13, tone: 2400, attack: 0.25, breath: 0.1 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 1.4 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'suspension-chains-squeezed-through-a-tie',
    name: 'Squeezed through a tie',
    category: 'organ',
    description:
      'A bright double-reed accordion with short releases, heard near and boxy from a small loudspeaker.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { volume: -15.5, bellows: 0.6, attack: 0.03, release: 0.15 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0, distance: 0.15 } },
    ],
  },
  {
    id: 'suspension-chains-drone-box-leans',
    name: 'Drone box leans',
    category: 'drone',
    description:
      'A breathy shruti box swelling in over a second while an overtone wanders slowly over C.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { attack: 0.9, release: 2, octave: 0.2 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        preset: 'Slow wander',
        params: { root: 0, low: 8, high: 10, pace: 0.3, glide: 1500, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'suspension-chains-pedal-pipe-in-the-crypt',
    name: 'Pedal pipe in the crypt',
    category: 'organ',
    description:
      'A dull flute and its sub rank, little else, under a low-pass at seven hundred, in a dark cave of six seconds.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { octave: 0.15, attack: 0.3, release: 1.5, celeste: 0, bellows: 0.1 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } }],
  },
  {
    id: 'suspension-chains-wind-with-a-seventh-in',
    name: 'Wind with a seventh in',
    category: 'wind',
    description:
      'One flute rank with all its wind on, uneven, played inside a stopped tube of its own pitch.',
    preview: BARE,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { octave: 0.25, bellows: 0.8, attack: 0.3, release: 1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Inside a pipe',
        params: { body: 2, size: 0.7, air: 0.5, material: 0.7, mix: 0.8 },
      },
    ],
  },
  {
    id: 'suspension-chains-service-through-a-wall',
    name: 'Service through a wall',
    category: 'organ',
    description:
      'An organ from the far side of a wall, all ranks under four hundred hertz, on worn tape.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { release: 1, attack: 0.15 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.5, noise: 0.2 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 6, threshold: -32 } },
    ],
  },
  {
    id: 'suspension-chains-blooms-as-it-clashes',
    name: 'Blooms as it clashes',
    category: 'pad',
    description:
      'Bright ranks that take two seconds to open, with an octave rising slowly out of the tail.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 2.2, release: 4, twelfth: 0.3, tone: 4000 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Organ loft', params: { interval: 0, decay: 6, mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-distance-between-choirs',
    name: 'Distance between choirs',
    category: 'pad',
    description:
      'Distant pipes flown round the listener by sixteen copies far off, each bending a little.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 0.5, release: 3, tone: 2600, celeste: 0.1 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Cloud far off', params: { range: 30, mix: 0.75 } },
    ],
  },
  {
    id: 'suspension-chains-celeste-sags-to-rest',
    name: 'Celeste sags to rest',
    category: 'organ',
    description:
      'Flutes with a wide celeste, and a tail that goes on sinking in pitch after each chord is let go.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { volume: -13, attack: 0.3, release: 1, tone: 3200, sub: 0.3, octave: 0.4 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Slow melt', params: { sag: -40, solid: 60, mix: 0.5 } },
      { deviceId: 'tamer', preset: 'Broad and slow' },
    ],
  },
  {
    id: 'suspension-chains-tremulant-on-the-tie',
    name: 'Tremulant on the tie',
    category: 'organ',
    description:
      'Tremulant flutes with a sub and an octave added, trembling twice: in pipe and in harmonic bands.',
    preview: TENTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 0.8, breath: 0.1, octave: 0.5, sub: 0.4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 1.7, depth: 0.7 } },
      { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.35 } },
    ],
  },
  {
    id: 'suspension-chains-bellows-let-go',
    name: 'Bellows let go',
    category: 'organ',
    description:
      'A pumping reed whose swell of breath opens level, tone and width about every second and a half.',
    preview: TENTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        reed: 0.8,
        octave: 0.2,
        bellows: 1,
        breath: 0.5,
        attack: 0.3,
        tone: 5500,
        celeste: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 0.74, hold: 0.02, out: 0.74, rest: 0.02, depth: 0.6, colour: 0.8, vary: 0 },
      },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'suspension-chains-mixture-let-down',
    name: 'Mixture let down',
    category: 'organ',
    description:
      'Upper ranks forward, twelfth and fifteenth, bright and glassy, with bands of partials twinkling apart.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        sub: 0,
        octave: 0.15,
        twelfth: 0.7,
        fifteenth: 1,
        reed: 0,
        celeste: 0.4,
        attack: 0.1,
        tone: 11000,
        release: 1.2,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.9, rate: 0.8 } },
      { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.35 } },
    ],
  },
  // Choir: five vowels by how slowly the singers lean in.
  {
    id: 'suspension-chains-altos-hold-the-fourth',
    name: 'Altos hold the fourth',
    category: 'voice',
    description:
      'Alto voices on eh with clear starts, narrow, their bodies made smaller, in a short bright chamber.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -6.5, attack: 0.2, release: 0.6, width: 0.2, vibrato: 6, breath: 0.1 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 1.6, mix: 0.25 } },
    ],
  },
  {
    id: 'suspension-chains-monks-over-a-late-bass',
    name: 'Monks over a late bass',
    category: 'voice',
    description:
      'Low oh from a straight-toned section, the chest lifted by a drive that fattens its lows.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.3, release: 1, voice: 0.82, tone: 2200 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-trebles-overlap',
    name: 'Trebles overlap',
    category: 'voice',
    description:
      'Boyish oo with a quick attack, doubled by two close copies that wander a few metres off.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { volume: -6.5, attack: 0.12, release: 0.9, breath: 0.05 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'suspension-chains-breath-drawn-on-a-tie',
    name: 'Breath drawn on a tie',
    category: 'texture',
    description:
      'All breath and wide, with only what was already sounding let through, so tied notes stay and moves vanish.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.8, release: 2, tone: 12000 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what stays', params: { mix: 0.75 } },
      { deviceId: 'ambient-comp', preset: 'Lift' },
    ],
  },
  {
    id: 'suspension-chains-soloist-gives-way',
    name: 'Soloist gives way',
    category: 'voice',
    description:
      'One singer to a note on ah, straight at every change and then in a wide vibrato, on a medium plate.',
    preview: BARE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { volume: -6, vibrato: 0, attack: 0.08, release: 0.4 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 200, grow: 350, depth: 45 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'suspension-chains-lips-closed-leaning',
    name: 'Lips closed, leaning',
    category: 'voice',
    description:
      'A hummed section, dark as a hand over a mouth, held behind by a slow even bed of itself.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.35, release: 0.8, ensemble: 0.4 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { attack: 0.6, decay: 3, mix: 0.45 },
      },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
    ],
  },
  {
    id: 'suspension-chains-basses-tied-to-the-floor',
    name: 'Basses tied to the floor',
    category: 'voice',
    description:
      'Bass voices on ah in their chests, the body made much larger, turned slowly in a dark rotary drum.',
    preview: A_MINOR,
    instrument: { deviceId: 'choir', preset: 'Basses ah', params: { attack: 0.15, release: 0.6 } },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { size: 0.9 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'suspension-chains-tenors-through-a-pipe',
    name: 'Tenors through a pipe',
    category: 'voice',
    description:
      'Tenors on oh sung into a hollow tube, vibrato and all, with a short tail of springs after.',
    preview: A_MINOR,
    instrument: { deviceId: 'choir', preset: 'Tenors oh', params: { attack: 0.2, vibrato: 24 } },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25, decay: 1.5 } },
    ],
  },
  {
    id: 'suspension-chains-vowel-turns-at-the-fall',
    name: 'Vowel turns at the fall',
    category: 'voice',
    description:
      'Singers whose vowels drift slowly and far, heard through a notch that swings every three seconds.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { volume: -3, attack: 0.4, release: 1.2, vowel: 0.45, voice: 1.2 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Slow notch',
        params: { lfoRateHz: 0.33, resonance: 1.2 },
      },
      { deviceId: 'chorus', preset: 'Vocal thickener' },
    ],
  },
  {
    id: 'suspension-chains-glass-voices-give',
    name: 'Glass voices give',
    category: 'voice',
    description:
      'A thin ee with little breath, pure sine partials drawn over it and a slow release.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.5, release: 2.5, ensemble: 0.2 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Glass redraw', params: { partials: 10, mix: 0.7 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'suspension-chains-wavering-sixth',
    name: 'Wavering sixth',
    category: 'voice',
    description:
      'A few singers with a wide three-a-second waver, shaken again by slow unsteady tape.',
    preview: BARE,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { attack: 0.25, release: 1, ensemble: 0.2, vowel: 0.2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.1 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'suspension-chains-nave-answers-in-oo',
    name: 'Nave answers in oo',
    category: 'voice',
    description:
      'Short ahs dropped into a long hall that sings them back as oo, so the tail keeps the tie.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { volume: -6, attack: 0.06, release: 0.5, breath: 0.2 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Oo behind',
        params: { decay: 7, preDelay: 20, mix: 0.6 },
      },
    ],
  },
  {
    id: 'suspension-chains-far-choir-turned-low',
    name: 'Far choir turned low',
    category: 'voice',
    description:
      'A distant section with an octave below and no octave above, its own edge long gone.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 1, release: 3, tone: 3500, voice: 0.95 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, attack: 0.4 } },
      { deviceId: 'fog', preset: 'Dark bank', params: { size: 180, mix: 0.8 } },
    ],
  },
  {
    id: 'suspension-chains-whispered-resolution',
    name: 'Whispered resolution',
    category: 'voice',
    description:
      'A breathy narrow ee with its quiet air brought up until it is mostly whisper, in a still room.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { volume: -8.5, attack: 0.3, release: 1, voice: 1.1 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-trebles-on-slow-water',
    name: 'Trebles on slow water',
    category: 'voice',
    description:
      'High drifting voices split into bands that swell and sway apart on their own slow cycles.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { volume: -6.5, attack: 0.3, release: 1.5, vowel: 0.8, motion: 0.4, tone: 9000 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell', params: { rate: 0.3, depth: 0.9, sway: 0.8 } },
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { mix: 0.25 } },
    ],
  },
  // Chamber strings: what the chain was written for, from one bow to six.
  {
    id: 'suspension-chains-four-bows-lean-together',
    name: 'Four bows lean together',
    category: 'string',
    description:
      'Four players with clear starts and a little vibrato, their quiet overtones turned up, in a plain room.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { volume: -8, attack: 0.22, release: 0.5, bow: 0.6, air: 0.1, mute: 0, vibrato: 9 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Overtones', params: { output: 3 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'suspension-chains-muted-swell-into-nine',
    name: 'Muted swell into nine',
    category: 'pad',
    description:
      'Muted bows that take two seconds to swell, dark, with the room rising behind them.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -3.5, attack: 2, release: 2.2, players: 6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1800 } },
    ],
  },
  {
    id: 'suspension-chains-lone-bow-gives-way',
    name: 'Lone bow gives way',
    category: 'string',
    description:
      'One player to a note, close and driven by a tube, with a wavering double a twentieth of a second late.',
    preview: BARE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { bow: 0.35, vibrato: 18, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Doubler',
        params: { time: 55, modDepth: 0.4, mix: 0.45 },
      },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8, outputDb: -4 } },
    ],
  },
  {
    id: 'suspension-chains-bridge-bows-at-the-clash',
    name: 'Bridge bows at the clash',
    category: 'texture',
    description:
      'Hard bows near the bridge, glassy and still, with a comb that rises slowly through the overtones.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -2.5, attack: 0.25, release: 1, air: 0.05 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Rising comb', params: { rate: 0.15, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'suspension-chains-consort-keeps-its-ties',
    name: 'Consort keeps its ties',
    category: 'string',
    description: 'Muted viols with no vibrato and no scatter, played inside a small soundboard.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { attack: 0.12, release: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { size: 0.6, mix: 0.75, opening: 0.4 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'suspension-chains-ragged-and-reconciled',
    name: 'Ragged and reconciled',
    category: 'string',
    description:
      'Six loose players out of step and out of tune, held together by a hard pumping compressor and cassette tape.',
    preview: TENTHS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.35, release: 0.9, air: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pump', params: { makeup: 8 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1, wow: 0.2 } },
    ],
  },
  {
    id: 'suspension-chains-whisper-lets-the-note-in',
    name: 'Whisper lets the note in',
    category: 'texture',
    description:
      'Bows that hardly touch, mostly air, the tops brought up as they fade and a slowed shadow behind.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { volume: -6, attack: 0.5, release: 1.5, air: 1 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Air on top', params: { threshold: -28 } },
      { deviceId: 'stretch', preset: 'Near shadow' },
    ],
  },
  {
    id: 'suspension-chains-halo-that-will-not-move',
    name: 'Halo that will not move',
    category: 'pad',
    description:
      'Two still players to a note whose last chord hangs in the next one, smeared across the change of bass.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.4, release: 1, players: 2 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { blur: 0.8, mix: 0.6 } },
    ],
  },
  {
    id: 'suspension-chains-second-fiddle-goes-first',
    name: 'Second fiddle goes first',
    category: 'string',
    description: 'Wide-vibrato bows with an octave below in a triode, thick and a little rough.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wide vibrato',
      params: { volume: -6, attack: 0.2, release: 0.6, vibrato: 34, air: 0.1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, filter: 900 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.35, mix: 0.6 } },
    ],
  },
  {
    id: 'suspension-chains-cellos-sag-after-the-bow',
    name: 'Cellos sag after the bow',
    category: 'string',
    description:
      'A dark section that goes on after the bow has left, drooping in pitch as it dims.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { volume: -4.5, attack: 0.3, release: 0.6, mute: 0.7, bow: 0.15 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Dark puddle', params: { mix: 0.6, sag: -35 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  // Felt piano: the tied note is struck once, so the lean is in what is left of it.
  {
    id: 'suspension-chains-struck-once-tied-twice',
    name: 'Struck once, tied twice',
    category: 'keys',
    description:
      'A plain felted piano with its dampers slow and its tails lifted, so the tied note outlives the bass change.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { outputDb: -14, damper: 0.1, resonance: 0.2, reverbMix: 0.1 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Long tails', params: { threshold: -24 } },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { presence: 3 } },
    ],
  },
  {
    id: 'suspension-chains-grace-before-the-sixth',
    name: 'Grace before the sixth',
    category: 'keys',
    description:
      'A bare hard hammer, close, with strings tuned to A minor ringing after each ornament.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -10.5, hardness: 0.8, width: 0.2, reverbMix: 0.05 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Minor strings',
        params: { sympathy: 0.8, decay: 5, mix: 0.55 },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'suspension-chains-hammers-taken-off',
    name: 'Hammers taken off',
    category: 'pad',
    description:
      'Felt with the pedal half down and every strike faded in, so only the held strings lean.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { outputDb: -11, resonance: 1, pedalNoise: 0, sustain: 0.4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 450 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'suspension-chains-parlour-with-a-loose-key',
    name: 'Parlour with a loose key',
    category: 'keys',
    description:
      'A worn upright, out of tune with itself, its thump and action loud on a warped old record.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -16.5, detune: 1, thump: 1, reverbMix: 0 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Charity shop find',
        params: { warp: 0.4, crackle: 0.2, pops: 0.05, surface: 0.15 },
      },
    ],
  },
  {
    id: 'suspension-chains-glass-hammers-lean',
    name: 'Glass hammers lean',
    category: 'keys',
    description:
      'A stiff glassy upright, all hammer and overtone, with a faint tail an octave up and a two-headed echo.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -6, reverbMix: 0.15, stiffness: 2 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 375, mix: 0.25 } },
    ],
  },
  {
    id: 'suspension-chains-next-room-plays-late',
    name: 'Next room plays late',
    category: 'keys',
    description:
      'A piano almost entirely heard through its own room, mono and dull, then through a wall besides.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { outputDb: -17.5, reverbSize: 0.8, width: 0, damper: 0.3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 10, outputGain: -3 } },
    ],
  },
  {
    id: 'suspension-chains-grain-of-the-tied-note',
    name: 'Grain of the tied note',
    category: 'keys',
    description:
      'A felted piano pushed until it grits, worn and mono, with a soft fuzz that blurs into a wall.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { outputDb: -14.5, grit: 1, felt: 0.5, reverbMix: 0 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 2.5, mix: 0.4 } }],
  },
  // Wavetable: five tables, each opening into the clash at its own speed.
  {
    id: 'suspension-chains-vowel-meets-the-bass',
    name: 'Vowel meets the bass',
    category: 'pad',
    description:
      'A vowel table that moves once in two seconds, warm and centred, with a quick start, in a singing chapel.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { rate: 0.5, attack: 0.25, release: 0.8, position: 0.4, spread: 0.3, detune: 6 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.35 } }],
  },
  {
    id: 'suspension-chains-reed-over-a-still-floor',
    name: 'Reed over a still floor',
    category: 'organ',
    description:
      'A thin reed table with a strong sub, quick to speak, its motion left to a slow phaser.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.35, motion: 0, attack: 0.08, release: 0.5, sub: 0.7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'suspension-chains-hollow-in-the-seventh',
    name: 'Hollow in the seventh',
    category: 'pad',
    description: 'A hollow table under a resonant filter with each band trembling down in turn.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { volume: -5.5, attack: 0.3, release: 1, cutoff: 1200, resonance: 0.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Falling ripple', params: { rate: 0.65, depth: 0.9 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'suspension-chains-sines-lean-and-beat',
    name: 'Sines lean and beat',
    category: 'drone',
    description:
      'Two plain sines a key, set to beat over a sub, with each clash made rougher by a soft wave fold.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { detune: 12, attack: 0.8, release: 3, sub: 0.3 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { driveDb: 8, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'suspension-chains-narrow-pulse-wide-fall',
    name: 'Narrow pulse, wide fall',
    category: 'plucked',
    description:
      'A narrow pulse with a short release, its echoes jumping up an octave and back as they fade.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { release: 0.4, cutoff: 2600, resonance: 0.1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { time: 375, intervalA: 6, intervalB: 1, feedback: 0.4, mix: 0.35 },
      },
      { deviceId: 'tamer', preset: 'Gentle' },
    ],
  },
  {
    id: 'suspension-chains-spectrum-over-a-tie',
    name: 'Spectrum over a tie',
    category: 'texture',
    description:
      'A spectral table with its motion at full, broken into bands that flow from side to side.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 0.6, release: 2.5, rate: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.2, depth: 0.8 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'suspension-chains-thick-saws-let-down',
    name: 'Thick saws let down',
    category: 'pad',
    description:
      'Wide detuned saws, filtered down and pushed through a warm amplifier that rounds each resolution.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { volume: -13.5, attack: 0.3, release: 1.2, cutoff: 1400, detune: 28 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.6 } },
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.4 } },
    ],
  },
  // Afterglow: struck on the preparation, glowing by the time it is a dissonance.
  {
    id: 'suspension-chains-glow-reaches-the-clash',
    name: 'Glow reaches the clash',
    category: 'keys',
    description:
      'Felt strikes whose overtones rise into a pad a second and a half later, just as the bass moves under them.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 1.5, fade: 2, decay: 2, glow: 0.85 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Opens to chorus' },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'suspension-chains-bell-that-resolves',
    name: 'Bell that resolves',
    category: 'bell',
    description:
      'Struck bells with a wide halo round them, crossing from side to side in a slow pendulum.',
    preview: BARE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: 1.5, decay: 4, fade: 3, tone: 0.7 },
    },
    effects: [{ deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.16 } }],
  },
  {
    id: 'suspension-chains-pluck-with-no-pluck-left',
    name: 'Pluck with no pluck left',
    category: 'pad',
    description:
      'Plucks under their own haze, with only what stays from a moment ago let through and left ringing.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: -10.5, glow: 0.8, fade: 2.5, decay: 1.2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.8 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 140 } },
    ],
  },
  {
    id: 'suspension-chains-glass-warmed-by-leaning',
    name: 'Glass warmed by leaning',
    category: 'bell',
    description:
      'Still glass with no drift, rounded by tape at low speed, with a faint reversed reflection behind it.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { volume: -12, strike: 0.9, decay: 5, tone: 0.35, fade: 3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0, wow: 0.3, age: 0.6 } },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-dark-felt-goes-under',
    name: 'Dark felt goes under',
    category: 'keys',
    description:
      'Dark felt strikes sunk just below the surface, dulled and wavering, with a few bubbles off the attacks.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { tone: 0.3, bloom: 1, fade: 3 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.2 } }],
  },
  {
    id: 'suspension-chains-quick-swell-to-the-tie',
    name: 'Quick swell to the tie',
    category: 'pad',
    description:
      'A swell in under half a second and gone soon after, its strongest partials drawn on as sines.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Quick swell',
      params: { volume: -12.5, strike: 0.1, bloom: 0.35, fade: 0.8, tone: 0.75 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { partials: 6, attack: 600, release: 4, mix: 0.45 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  // Dusk: one oscillator a key, so the clash is clean and the chorus does the leaning.
  {
    id: 'suspension-chains-pulse-with-a-late-floor',
    name: 'Pulse with a late floor',
    category: 'pad',
    description:
      'A moving pulse with its sub and no chorus, the filter dipping as each note opens, in a dark spring.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Long pulse swell',
      params: { volume: -12.5, attack: 0.25, release: 1, envelope: -0.4, cutoff: 1600, chorus: 0 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'suspension-chains-lead-pipe-gives-a-step',
    name: 'Lead pipe gives a step',
    category: 'organ',
    description: 'A square through a resonant filter near G, stopped like a pipe, with no chorus.',
    preview: BARE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.06, release: 0.5, resonance: 0.6 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-filter-hums-the-seventh',
    name: 'Filter hums the seventh',
    category: 'pad',
    description:
      'Saws under a filter that rings at its own pitch, climbing through the overtones after each change.',
    preview: A_MINOR,
    instrument: {
      deviceId: 'dusk',
      preset: 'Overtone climb',
      params: { attack: 0.5, release: 1.5, resonance: 0.55, sub: 0.3, lowCut: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
      { deviceId: 'tamer', preset: 'Ringing tones' },
    ],
  },
  {
    id: 'suspension-chains-warm-keys-give-ground',
    name: 'Warm keys give ground',
    category: 'keys',
    description:
      'Plucked saw and square that close at once, in a slow phaser, each note skipping off in dulling echoes.',
    preview: ORNAMENT,
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { volume: -1, release: 0.5, envelope: 0.7, cutoff: 350 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.4 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'suspension-chains-thin-voices-lean-out',
    name: 'Thin voices lean out',
    category: 'string',
    description:
      'Thin pulse voices with their lows cut away and both choruses on, high over a short plate.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Thin voices',
      params: { volume: -10.5, attack: 0.2, release: 0.8, cutoff: 2400, resonance: 0.3 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.35 } },
      { deviceId: 'lift', preset: 'Slightly closer' },
    ],
  },
  // Aurora: notes that start dark and open into the dissonance.
  {
    id: 'suspension-chains-brass-opens-on-the-ninth',
    name: 'Brass opens on the ninth',
    category: 'wind',
    description:
      'Slow brass whose filter overshoots: each new note flares under tied ones that have already settled.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { attack: 0.7, contour: 0.9, release: 1, brilliance: 700 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 2.5, mix: 0.28 } },
    ],
  },
  {
    id: 'suspension-chains-reeds-out-of-true',
    name: 'Reeds out of true',
    category: 'organ',
    description:
      'Loose reeds twenty-six cents apart, narrow and nasal, sent through a transistor radio.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.1, release: 0.4 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0.1, wobble: 0.2 } }],
  },
  {
    id: 'suspension-chains-muted-brass-at-the-tie',
    name: 'Muted brass at the tie',
    category: 'wind',
    description: 'A thin muted trumpet, no lows, its bell moved nearer and farther as it holds.',
    preview: LEAPFROG,
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { volume: -2.5, attack: 0.1, release: 0.5, resonance: 0.6 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Breathing', params: { wander: 0.9, rate: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'suspension-chains-metal-tied-to-metal',
    name: 'Metal tied to metal',
    category: 'texture',
    description:
      'Two layers ring modulated against each other, dark, with a ring tuned to D and to its fifth.',
    preview: LATE_BASS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { volume: -6, attack: 0.3, release: 1.5, ring: 0.8, brilliance: 1000 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Fifth halo', params: { root: 2, mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'suspension-chains-deep-swell-under-six',
    name: 'Deep swell under six',
    category: 'pad',
    description:
      'A very dark pad that keeps rising while it is held, its long tail shaped into slow waves.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { volume: -5.5, attack: 1.6, release: 3, swell: 1 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.5 } },
      { deviceId: 'reveal', preset: 'Gentle opening', params: { output: 2 } },
    ],
  },
  // Flock: voices that glide from one note of the chain to the next.
  {
    id: 'suspension-chains-voices-slide-to-a-sixth',
    name: 'Voices slide to a sixth',
    category: 'voice',
    description:
      'Four voices arriving from above in a quarter second, so every resolution is a small slide down.',
    preview: BARE,
    instrument: {
      deviceId: 'flock',
      preset: 'Clean unison',
      params: { volume: -5.5, gather: 0.25, from: 1, leave: 0.5, tone: 0.15 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.25 } }],
  },
  {
    id: 'suspension-chains-reeds-fall-to-the-tie',
    name: 'Reeds fall to the tie',
    category: 'wind',
    description: 'Buzzing reeds that close in from both sides of each note, in a hollow tube.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { gather: 0.3, leave: 0.8, octaves: 0 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1.3 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-whistle-and-its-shadow',
    name: 'Whistle and its shadow',
    category: 'wind',
    description:
      'A single plain whistle a key, and the same line an octave lower a moment behind it.',
    preview: LEAPFROG,
    instrument: { deviceId: 'flock', preset: 'One whistle', params: { gather: 0.1, leave: 0.3 } },
    effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.3, mix: 0.45 } }],
  },
  {
    id: 'suspension-chains-murmur-that-gives-way',
    name: 'Murmur that gives way',
    category: 'pad',
    description:
      'A low murmur of seven voices straying far, gathered quicker than it leaves and blurred again by fog.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { gather: 0.7, leave: 2.5, tone: 0.4 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Wide drone', params: { size: 300, mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'suspension-chains-restless-above-the-tie',
    name: 'Restless above the tie',
    category: 'texture',
    description: 'Seven nervous voices fluttering six times a second, calmed by a dark tape trail.',
    preview: HIGH_TENTHS,
    instrument: {
      deviceId: 'flock',
      preset: 'Nervous swarm',
      params: { gather: 0.15, stray: 0.35, tone: 0.2, leave: 0.6 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Long dark trail',
        params: { time: 750, feedback: 0.4, mix: 0.4 },
      },
      { deviceId: 'auto-filter', preset: 'Init', params: { cutoffHz: 1500 } },
    ],
  },
  // Staircase: stacked octaves, held still or sinking with the chain.
  {
    id: 'suspension-chains-sinks-as-the-voices-do',
    name: 'Sinks as the voices do',
    category: 'drone',
    description:
      'Stacked octaves sliding down without end, very slowly, while the two leaning notes resolve.',
    preview: LONG_LEAN,
    instrument: {
      deviceId: 'staircase',
      preset: 'Slow descent',
      params: { speed: -0.12, attack: 0.8, release: 2.5, centre: 280, span: 4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Long wash' },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'suspension-chains-landing-between-steps',
    name: 'Landing between steps',
    category: 'organ',
    description:
      'A still stack of three octaves with a fast start and a reedy edge, through a stopped rotary horn.',
    preview: BARE,
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { shape: 0.7, span: 3, centre: 700, release: 0.4 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn', params: { drive: 0.5 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'suspension-chains-chord-walks-down-to-meet',
    name: 'Chord walks down to meet',
    category: 'texture',
    description:
      'Octaves that step down the held chord note by note, sliding between, under a falling veil.',
    preview: DOWN_A_FIFTH,
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord descent',
      params: { speed: -0.5, slide: 0.4, attack: 0.3, release: 1.2, shape: 0.1 },
    },
    effects: [
      { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
]
