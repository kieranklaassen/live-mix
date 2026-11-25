import { type FactoryPreset, type Phrase } from '../types'

// Whole groups made of one instrument. Every instrument here plays all the parts of its own band:
// floor, pad, line, pulse, sparkle, bass, breath and ending. The previews are the parts of two
// short pieces on the white keys, three bars of 2.4 seconds each, written to stack from bar one.

// The first piece: G6/9, Em7, Am7. Its floor is the open fifth G and D, held under all three.
const ROWED_FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 55, gain: 0.6 },
    { atSec: 0, durSec: 7, note: 62, gain: 0.5 },
  ],
}

// Four upper voices that move one step or not at all: D E A B, D E G B, C E G A.
const ROWED_PAD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 2.3, note: 69, gain: 0.45 },
    { atSec: 0, durSec: 2.3, note: 71, gain: 0.5 },
    { atSec: 2.4, durSec: 2.3, note: 62, gain: 0.5 },
    { atSec: 2.4, durSec: 2.3, note: 64, gain: 0.45 },
    { atSec: 2.4, durSec: 2.3, note: 67, gain: 0.45 },
    { atSec: 2.4, durSec: 2.3, note: 71, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 60, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.45 },
    { atSec: 4.8, durSec: 2.3, note: 67, gain: 0.45 },
    { atSec: 4.8, durSec: 2.3, note: 69, gain: 0.5 },
  ],
}

// The tune: E D B, G over the Em, A, then C and its fall to B, the ninth of the last chord.
const ROWED_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 76, gain: 0.65 },
    { atSec: 1.2, durSec: 0.6, note: 74, gain: 0.55 },
    { atSec: 1.8, durSec: 0.6, note: 71, gain: 0.55 },
    { atSec: 2.4, durSec: 1.75, note: 67, gain: 0.6 },
    { atSec: 4.2, durSec: 0.6, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 1.2, note: 72, gain: 0.62 },
    { atSec: 6, durSec: 1.2, note: 71, gain: 0.5 },
  ],
}

// Seven strokes spread over sixteen (3 2 2 3 2 2 2) on G and E, which every chord holds.
const ROWED_PULSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.12, note: 55, gain: 0.65 },
    { atSec: 0.45, durSec: 0.12, note: 64, gain: 0.45 },
    { atSec: 0.75, durSec: 0.12, note: 64, gain: 0.4 },
    { atSec: 1.05, durSec: 0.12, note: 55, gain: 0.55 },
    { atSec: 1.5, durSec: 0.12, note: 64, gain: 0.45 },
    { atSec: 1.8, durSec: 0.12, note: 64, gain: 0.4 },
    { atSec: 2.1, durSec: 0.12, note: 55, gain: 0.5 },
    { atSec: 2.4, durSec: 0.12, note: 55, gain: 0.65 },
    { atSec: 2.85, durSec: 0.12, note: 64, gain: 0.45 },
    { atSec: 3.15, durSec: 0.12, note: 64, gain: 0.4 },
    { atSec: 3.45, durSec: 0.12, note: 55, gain: 0.55 },
    { atSec: 3.9, durSec: 0.12, note: 64, gain: 0.45 },
    { atSec: 4.2, durSec: 0.12, note: 64, gain: 0.4 },
    { atSec: 4.5, durSec: 0.12, note: 55, gain: 0.5 },
    { atSec: 4.8, durSec: 0.12, note: 55, gain: 0.65 },
    { atSec: 5.25, durSec: 0.12, note: 64, gain: 0.45 },
    { atSec: 5.55, durSec: 0.12, note: 64, gain: 0.4 },
    { atSec: 5.85, durSec: 0.12, note: 55, gain: 0.55 },
    { atSec: 6.3, durSec: 0.12, note: 64, gain: 0.45 },
    { atSec: 6.6, durSec: 0.12, note: 64, gain: 0.4 },
    { atSec: 6.9, durSec: 0.12, note: 55, gain: 0.5 },
  ],
}

// One high note in each bar, on its second beat of four: E, B and D, the last an eleventh.
const ROWED_SPARKLE: Phrase = {
  notes: [
    { atSec: 0.6, durSec: 1, note: 88, gain: 0.55 },
    { atSec: 3, durSec: 1, note: 83, gain: 0.6 },
    { atSec: 5.4, durSec: 1, note: 86, gain: 0.55 },
  ],
}

// The roots, one note at a time.
const ROWED_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 43, gain: 0.75 },
    { atSec: 2.4, durSec: 2.3, note: 40, gain: 0.75 },
    { atSec: 4.8, durSec: 2.3, note: 45, gain: 0.75 },
  ],
}

// The second piece: Am9, D9 with a fourth for its third, Am7 over C, above a fifth on A that never moves.
const SUNG_FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 45, gain: 0.65 },
    { atSec: 0, durSec: 7, note: 52, gain: 0.5 },
  ],
}

// G C E B, A D G A, G C E A: three voices rise and come back, the top falls from B to A. No F in
// the second chord: it would be a minor ninth over the E of the floor.
const SUNG_PAD: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 2.3, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 2.3, note: 71, gain: 0.5 },
    { atSec: 2.4, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 2.4, durSec: 2.3, note: 62, gain: 0.45 },
    { atSec: 2.4, durSec: 2.3, note: 67, gain: 0.45 },
    { atSec: 2.4, durSec: 2.3, note: 69, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 55, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 60, gain: 0.45 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.45 },
    { atSec: 4.8, durSec: 2.3, note: 69, gain: 0.5 },
  ],
}

// Five notes down by step, E D C B A, two beats and one in a bar of three. Each note overlaps
// the next by a moment, so strings that bend are bent by it.
const SUNG_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 64, gain: 0.65 },
    { atSec: 1.6, durSec: 0.9, note: 62, gain: 0.55 },
    { atSec: 2.4, durSec: 1.7, note: 60, gain: 0.6 },
    { atSec: 4, durSec: 0.9, note: 59, gain: 0.55 },
    { atSec: 4.8, durSec: 2.3, note: 57, gain: 0.62 },
  ],
}

// Threes: A E E in eighths, A D D over the D chord, so two groups cross the three beats of each bar.
const SUNG_PULSE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.15, note: 57, gain: 0.65 },
    { atSec: 0.4, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 0.8, durSec: 0.15, note: 64, gain: 0.45 },
    { atSec: 1.2, durSec: 0.15, note: 57, gain: 0.6 },
    { atSec: 1.6, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 2, durSec: 0.15, note: 64, gain: 0.45 },
    { atSec: 2.4, durSec: 0.15, note: 57, gain: 0.65 },
    { atSec: 2.8, durSec: 0.15, note: 62, gain: 0.4 },
    { atSec: 3.2, durSec: 0.15, note: 62, gain: 0.45 },
    { atSec: 3.6, durSec: 0.15, note: 57, gain: 0.6 },
    { atSec: 4, durSec: 0.15, note: 62, gain: 0.4 },
    { atSec: 4.4, durSec: 0.15, note: 62, gain: 0.45 },
    { atSec: 4.8, durSec: 0.15, note: 57, gain: 0.65 },
    { atSec: 5.2, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 5.6, durSec: 0.15, note: 64, gain: 0.45 },
    { atSec: 6, durSec: 0.15, note: 57, gain: 0.6 },
    { atSec: 6.4, durSec: 0.15, note: 64, gain: 0.4 },
    { atSec: 6.8, durSec: 0.15, note: 64, gain: 0.45 },
  ],
}

// E, D, E in the octave over the line, on the second beat of each bar.
const SUNG_SPARKLE: Phrase = {
  notes: [
    { atSec: 0.8, durSec: 0.8, note: 76, gain: 0.6 },
    { atSec: 3.2, durSec: 0.8, note: 74, gain: 0.6 },
    { atSec: 5.6, durSec: 0.8, note: 76, gain: 0.55 },
  ],
}

// A, D and C, one at a time, under the floor and never nearer to it than a fifth.
const SUNG_BASS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 33, gain: 0.8 },
    { atSec: 2.4, durSec: 2.3, note: 38, gain: 0.75 },
    { atSec: 4.8, durSec: 2.3, note: 36, gain: 0.78 },
  ],
}

// How either piece stops: A and E with a ninth that falls to the octave, Em over G, and Cmaj9
// rolled from C up to the high E.
const ENDING: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.7, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.7, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1, note: 71, gain: 0.6 },
    { atSec: 0.9, durSec: 0.85, note: 69, gain: 0.5 },
    { atSec: 1.8, durSec: 1.7, note: 55, gain: 0.5 },
    { atSec: 1.8, durSec: 1.7, note: 59, gain: 0.4 },
    { atSec: 1.8, durSec: 0.9, note: 67, gain: 0.55 },
    { atSec: 2.7, durSec: 0.85, note: 64, gain: 0.5 },
    { atSec: 3.6, durSec: 2.6, note: 48, gain: 0.6 },
    { atSec: 3.74, durSec: 2.46, note: 55, gain: 0.45 },
    { atSec: 3.88, durSec: 2.32, note: 64, gain: 0.45 },
    { atSec: 4.02, durSec: 2.18, note: 71, gain: 0.45 },
    { atSec: 4.16, durSec: 2.04, note: 74, gain: 0.45 },
    { atSec: 4.6, durSec: 1.6, note: 76, gain: 0.5 },
  ],
}

// Every part of the second piece at once: bass, floor, pad, line, sparkle, and the pulse thinned
// to offbeats between the pad's notes.
const ALL_PARTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 33, gain: 0.5 },
    { atSec: 2.4, durSec: 2.3, note: 38, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 36, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 45, gain: 0.35 },
    { atSec: 0, durSec: 7, note: 52, gain: 0.3 },
    { atSec: 0, durSec: 2.3, note: 55, gain: 0.25 },
    { atSec: 0, durSec: 2.3, note: 60, gain: 0.25 },
    { atSec: 0, durSec: 2.3, note: 71, gain: 0.25 },
    { atSec: 2.4, durSec: 2.3, note: 57, gain: 0.25 },
    { atSec: 2.4, durSec: 2.3, note: 67, gain: 0.25 },
    { atSec: 2.4, durSec: 2.3, note: 69, gain: 0.25 },
    { atSec: 4.8, durSec: 2.3, note: 55, gain: 0.25 },
    { atSec: 4.8, durSec: 2.3, note: 60, gain: 0.25 },
    { atSec: 4.8, durSec: 2.3, note: 69, gain: 0.25 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.6 },
    { atSec: 1.6, durSec: 0.8, note: 62, gain: 0.55 },
    { atSec: 2.4, durSec: 1.6, note: 60, gain: 0.6 },
    { atSec: 4, durSec: 0.8, note: 59, gain: 0.55 },
    { atSec: 4.85, durSec: 2.2, note: 57, gain: 0.6 },
    { atSec: 0.8, durSec: 0.8, note: 76, gain: 0.45 },
    { atSec: 3.2, durSec: 0.8, note: 74, gain: 0.45 },
    { atSec: 5.6, durSec: 0.8, note: 76, gain: 0.45 },
    { atSec: 0.4, durSec: 0.15, note: 69, gain: 0.3 },
    { atSec: 1.2, durSec: 0.15, note: 69, gain: 0.3 },
    { atSec: 2, durSec: 0.15, note: 67, gain: 0.3 },
    { atSec: 2.8, durSec: 0.15, note: 62, gain: 0.3 },
    { atSec: 3.6, durSec: 0.15, note: 62, gain: 0.3 },
    { atSec: 4.4, durSec: 0.15, note: 62, gain: 0.3 },
    { atSec: 5.2, durSec: 0.15, note: 67, gain: 0.3 },
    { atSec: 6, durSec: 0.15, note: 67, gain: 0.3 },
    { atSec: 6.8, durSec: 0.15, note: 67, gain: 0.3 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Vibraphone.
  {
    id: 'bands-of-one-bowed-bars-lay-ground',
    name: 'Bowed bars lay ground',
    category: 'drone',
    description:
      'Vibraphone floor: soft strokes rolled fast, their attacks turned into slow fades as if bowed, in a short dark plate.',
    preview: ROWED_FLOOR,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { mallet: 0, decay: 4, motor: 0, roll: 16, damper: 0, width: 0.15 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 900, retrigger: 1, release: 600 } },
      { deviceId: 'plate-reverb', params: { mix: 0.3, decay: 0.55, damping: 0.8 } },
    ],
  },
  {
    id: 'bands-of-one-eleven-strokes-a-second',
    name: 'Eleven strokes a second',
    category: 'pad',
    description:
      'Vibraphone pad: held chords rolled eleven times a second with soft mallets, motor off, phased slowly by six stages.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled vibes',
      params: { volume: -4, mallet: 0.3, motor: 0, roll: 11, damper: 0.6, width: 1 },
    },
    effects: [
      { deviceId: 'phaser', params: { rate: 0.12, depth: 70, feedback: 30, mix: 0.5 } },
      { deviceId: 'ambient-eq', params: { lowCut: 180, body: -4, air: 4 } },
    ],
  },
  {
    id: 'bands-of-one-disc-turns-for-the-tune',
    name: 'Disc turns for the tune',
    category: 'bell',
    description:
      'Vibraphone line: medium mallets, the motor turning a beat and a half a second, through two springs.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.4, motor: 0.9, motorRate: 1.5, decay: 1.4, width: 0.25 },
    },
    effects: [
      { deviceId: 'spring-reverb', params: { mix: 0.3, decay: 2.2, drip: 0.6, tone: 2600 } },
    ],
  },
  {
    id: 'bands-of-one-seven-dead-strokes',
    name: 'Seven dead strokes',
    category: 'bell',
    description:
      'Vibraphone pulse: every stroke pressed dead by the damper, the bars knocking inside a small drum shell.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: -4.5, mallet: 0.55, decay: 0.25, resonator: 0.2, damper: 1, width: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 4, size: 0.7, material: 0.3, air: 0, mix: 0.6 } },
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -5 } },
    ],
  },
  {
    id: 'bands-of-one-struck-at-the-node',
    name: 'Struck at the node',
    category: 'bell',
    description:
      'Vibraphone sparkle: a hard mallet and no tubes, so the overtones lead, with bright sparks thrown off two octaves up.',
    preview: ROWED_SPARKLE,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { volume: 3.5, mallet: 1, decay: 0.8, resonator: 0, damper: 0, width: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 400, presence: 4, air: 5, body: -5 } },
      { deviceId: 'glints', params: { pitch: 2, density: 9, mix: 0.35, trail: 0.5 } },
    ],
  },
  {
    id: 'bands-of-one-longest-tube-in-the-row',
    name: 'Longest tube in the row',
    category: 'bass',
    description:
      'Vibraphone bass: the softest mallet on full tubes, with an octave added below and the top closed at a low frequency.',
    preview: ROWED_BASS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Still vibes',
      params: { mallet: 0, decay: 1.2, resonator: 1, damper: 0.3, width: 0 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.8, dry: 0.7, up1: 0, filter: 2000 } },
      { deviceId: 'auto-filter', params: { cutoffHz: 420, resonance: 0.8 } },
    ],
  },
  {
    id: 'bands-of-one-pedal-down-last-chord',
    name: 'Pedal down, last chord',
    category: 'bell',
    description:
      'Vibraphone ending: four times the usual ring with the dampers off, and a blurred tail that sags in pitch as it ages.',
    preview: ENDING,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: { mallet: 0.3, decay: 4, motor: 0, resonator: 0.8, width: 0.5 },
    },
    effects: [
      { deviceId: 'melt', params: { sag: -45, hold: 4, mix: 0.6, dim: 0.5 } },
      { deviceId: 'tremolo', params: { mode: 1, rate: 0.3, depth: 0.4 } },
    ],
  },

  // Upright piano under felt.
  {
    id: 'bands-of-one-held-from-bar-one',
    name: 'Held from bar one',
    category: 'drone',
    description:
      'Felt piano floor: soft hammers with the pedal down all through, the hammer stroke faded in and the strings blurred.',
    preview: ROWED_FLOOR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.1, reverbSize: 0.3, sustain: 1, outputDb: -3 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 500, retrigger: 1 } },
      { deviceId: 'spectral-blur', params: { blur: 0.5, mix: 0.6, highCut: 1800 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'bands-of-one-right-hand-alone',
    name: 'Right hand alone',
    category: 'keys',
    description:
      'Felt piano line: thin felt, unisons dead in tune, narrow and dry, recorded to a slow reel with a little wow.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        outputDb: -14.5,
        felt: 0.3,
        hardness: 0.6,
        detune: 0,
        reverbMix: 0.05,
        width: 0.1,
        action: 0.2,
      },
    },
    effects: [
      { deviceId: 'tape', params: { speed: 2, wow: 0.45, drive: 0.5, tone: 0.35, hiss: 0.1 } },
    ],
  },
  {
    id: 'bands-of-one-bench-and-felt-noise',
    name: 'Bench and felt noise',
    category: 'texture',
    description:
      'Felt piano breath: key noise and pedal noise at full, lows cut away, flattened and its quiet end lifted up.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { outputDb: 2.5, hardness: 0, resonance: 0, grit: 0.2, width: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 450, body: -6, presence: 5, air: 4 } },
      { deviceId: 'fet-limiter', preset: 'Flattened', params: { outputGain: -9 } },
      { deviceId: 'lift', params: { threshold: -24, amount: 1, rise: 0.1, limit: 24 } },
    ],
  },
  {
    id: 'bands-of-one-lid-left-open',
    name: 'Lid left open',
    category: 'keys',
    description:
      'Felt piano ending: nearly bare hammers with the pedal half down, and twelve more strings in A minor that ring on in sympathy.',
    preview: ENDING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -24, felt: 0.1, hardness: 0.55, stiffness: 1.2, sustain: 0.6 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 9, mode: 1, strings: 8, sympathy: 0.8, decay: 8, mix: 0.45, width: 1 },
      },
    ],
  },

  // Harp.
  {
    id: 'bands-of-one-hands-rise-as-one',
    name: 'Hands rise as one',
    category: 'pad',
    description:
      'Harp pad: each chord swept upward in half a second, the plucks softened to fades, its bands drifting on slow cycles.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -0.5, touch: 0.1, decay: 3.5, sweep: 0.5, halo: 1 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 320, retrigger: 0 } },
      { deviceId: 'currents', params: { depth: 0.8, sway: 0.8, rate: 0.3 } },
    ],
  },
  {
    id: 'bands-of-one-one-finger-near-middle',
    name: 'One finger near middle',
    category: 'plucked',
    description:
      'Harp line: plucked soft at the middle of the string on a full body, held notes swaying after a moment, some way off in a room.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: 1, decay: 3, halo: 0.1, damp: 0.2 },
    },
    effects: [
      { deviceId: 'late-vibrato', params: { wait: 250, grow: 700, depth: 45, rate: 4.2 } },
      { deviceId: 'distance', params: { distance: 0.35, room: 0.7, decay: 1.8 } },
    ],
  },
  {
    id: 'bands-of-one-palm-flat-on-strings',
    name: 'Palm flat on strings',
    category: 'plucked',
    description:
      'Harp pulse: hard plucks stopped at once, each answered by a dull repeat three sixteenths on, all pressed flat.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { volume: 6, pluck: 0.1, touch: 1 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: { time: 450, feedback: 0.15, tone: 1600, spread: 1, mix: 0.4 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -8 } },
    ],
  },
  {
    id: 'bands-of-one-harp-with-a-sparkle-hand',
    name: 'Harp with a sparkle hand',
    category: 'bell',
    description:
      'Harp sparkle: long thin strings in a small body, with a second copy an octave above and the lows cut away.',
    preview: ROWED_SPARKLE,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { volume: 3.5, pluck: 0.5, touch: 0.5, body: 0 },
    },
    effects: [
      { deviceId: 'size', params: { size: -0.7, width: 0.6 } },
      { deviceId: 'pitch-shifter', params: { pitchA: 12, mix: 0.6, size: 40 } },
      { deviceId: 'ambient-eq', params: { lowCut: 350, low: -8 } },
    ],
  },
  {
    id: 'bands-of-one-low-strings-close-hand',
    name: 'Low strings, close hand',
    category: 'bass',
    description:
      'Harp bass: plucked near the soundboard and half damped, through a warm amplifier stack at close range.',
    preview: ROWED_BASS,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { touch: 0.35, decay: 0.8, damp: 0.5, body: 1, halo: 0 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 2, drive: 0.5, bass: 0.7, treble: -0.6, distance: 0.1, room: 0.1 },
      },
    ],
  },

  // Piano with things between its strings: every part another preparation.
  {
    id: 'bands-of-one-long-bolts-under-it-all',
    name: 'Long bolts under it all',
    category: 'drone',
    description:
      'Prepared floor: heavy bolts a third along the string, rung long as dark gongs, their partials squeezed closer together.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: -11, decay: 4, hammer: 0.1, tone: 0.35 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: -0.3, drift: 0.3, mix: 0.6, tone: -0.4 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
    ],
  },
  {
    id: 'bands-of-one-cloth-laid-over-chords',
    name: 'Cloth laid over chords',
    category: 'pad',
    description:
      'Prepared pad: felt-muted strings with a soft hammer, the attack blurred into a cloud with a slow chorus and no tail added.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: 6, decay: 4, amount: 0.5, detune: 0.8, width: 1 },
    },
    effects: [
      { deviceId: 'fog', params: { size: 420, layers: 3, soften: 0.8, damp: 0.4 } },
      { deviceId: 'chorus', params: { rate: 0.2, depth: 40, mix: 0.4 } },
    ],
  },
  {
    id: 'bands-of-one-felt-carries-the-tune',
    name: 'Felt carries the tune',
    category: 'keys',
    description:
      'Prepared line: full felt between the strings, close and narrow, with single slow echoes from a worn tape.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt mute',
      params: { volume: 4.5, hammer: 0.5, decay: 1.8, width: 0.1, tone: 0.9 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 800, feedback: 0.15, wow: 0.5, highCut: 2400, mix: 0.3 },
      },
    ],
  },
  {
    id: 'bands-of-one-rubber-counts-threes',
    name: 'Rubber counts threes',
    category: 'plucked',
    description:
      'Prepared pulse: rubber wedges that thud at once, sounding in a clay pot and pressed hard by a fast limiter.',
    preview: SUNG_PULSE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { volume: 5, decay: 1.2, thud: 0.6, tone: 0.4, width: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.75, air: 0 } },
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-bolts-near-the-bridge',
    name: 'Bolts near the bridge',
    category: 'bell',
    description:
      'Prepared sparkle: light bolts close to the string end, hit hard, thrown into twelve scattered echoes across two seconds.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: 4.5, decay: 1.2, thud: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 300, air: 4 } },
      {
        deviceId: 'constellation',
        params: { span: 2000, stars: 12, pattern: 2, again: 0.2, mix: 0.4 },
      },
    ],
  },
  {
    id: 'bands-of-one-stove-bolt-bass',
    name: 'Stove bolt bass',
    category: 'bass',
    description:
      'Prepared bass: rattling bolts on the lowest strings, pushed through a valve stage with the top rolled away.',
    preview: SUNG_BASS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rattling bolts',
      params: { decay: 1.4, amount: 0.6, thud: 0.7, width: 0 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.55, lowBump: 0.6, highCut: 1600 },
      },
    ],
  },
  {
    id: 'bands-of-one-paper-breathes',
    name: 'Paper breathes',
    category: 'texture',
    description:
      'Prepared breath: paper on the strings with the tones turned far down, the fizz opening and closing like regular breathing.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper sizzle',
      params: { volume: -1.5, decay: 4, hammer: 0.5, thud: 0 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: -18, attacks: -18, air: 6, scatter: 1, hold: 0.8 } },
      { deviceId: 'breath', params: { in: 1, out: 1.4, hold: 0.1, rest: 0.1, depth: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'bands-of-one-objects-taken-out-last',
    name: 'Objects taken out last',
    category: 'keys',
    description:
      'Prepared ending: a light mixed preparation rung long, and a reverb that rises for a while and then sinks away.',
    preview: ENDING,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Dark orchestra',
      params: { volume: 0.5, amount: 0.35, rattle: 0.1, tone: 0.7, decay: 2.5 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 2, time: 2.4, colour: -0.3, mix: 0.55, tail: 0.5 },
      },
    ],
  },
  {
    id: 'bands-of-one-wooden-wedge-offbeats',
    name: 'Wooden wedge offbeats',
    category: 'plucked',
    description:
      'Prepared second pulse: hard rubber at mid-string like blocks, swung side to side with springs behind, pressed flat.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Wood blocks',
      params: { volume: 6, decay: 0.3, rattle: 0, width: 0 },
    },
    effects: [
      { deviceId: 'around', params: { path: 2, rate: 0.42, radius: 1 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 34, outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-soft-rubber-tenor',
    name: 'Soft rubber tenor',
    category: 'keys',
    description:
      'Prepared second line: soft rubber part way in, ringing long, coloured like a hollow tube and left in a small room.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { volume: 4, amount: 0.35, hammer: 0.55, decay: 3, detune: 0 },
    },
    effects: [
      { deviceId: 'imprint', params: { shape: 4, amount: 1.2, replace: 0.4 } },
      { deviceId: 'fdn-reverb', params: { mix: 0.2, decay: 1.4, size: 0.6, breathDepth: 0 } },
    ],
  },
  {
    id: 'bands-of-one-screws-turned-by-hand',
    name: 'Screws turned by hand',
    category: 'drone',
    description:
      'Prepared second floor: mid-string bolts through a ring modulator on A, drifting slowly, with the strokes faded in.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { volume: -0.5, decay: 3.5, hammer: 0.3, rattle: 0 },
    },
    effects: [
      { deviceId: 'ring', params: { root: 9, octave: 3, drift: 0.2, mix: 0.45, tone: 2500 } },
      { deviceId: 'swell', params: { attack: 250 } },
    ],
  },
  {
    id: 'bands-of-one-paper-under-the-treble',
    name: 'Paper under the treble',
    category: 'bell',
    description:
      'Prepared second sparkle: buzzing paper on high notes, held to a coarse sampler rate and hopped along in bounces.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { volume: 6, decay: 0.6, thud: 0, tone: 1 },
    },
    effects: [
      { deviceId: 'vintage-digital', params: { rate: 14000, bits: 8, mix: 0.7 } },
      { deviceId: 'skipping-stone', params: { first: 400, bounce: 0.75, skips: 7, mix: 0.45 } },
    ],
  },
  {
    id: 'bands-of-one-one-player-all-objects',
    name: 'One player, all objects',
    category: 'keys',
    description:
      'Prepared full mix: every key its own object, unisons loose, held together by a slow compressor and a small bright room.',
    preview: ALL_PARTS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: -0.5, amount: 0.7, detune: 0.6, width: 1, decay: 1.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },

  // Pedal steel.
  {
    id: 'bands-of-one-bar-rests-on-the-low-a',
    name: 'Bar rests on the low A',
    category: 'drone',
    description:
      'Steel floor: slow swells that ring for forty seconds, a dark tone and no vibrato, feeding back into a held overtone.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 40, tone: 1500, pick: 0 },
    },
    effects: [
      { deviceId: 'howl', params: { gain: 0.7, distance: 9.1, hold: 12, move: 0.2, mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'bands-of-one-chords-through-volume',
    name: 'Chords through volume',
    category: 'pad',
    description:
      'Steel pad: long volume-pedal swells with a light shake of the bar, thinned below and scattered into a flock of voices.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 0.9, range: 0, vibrato: 10, tone: 5500 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 220, body: -5, presence: 4, air: 3 } },
      { deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'bands-of-one-pedals-move-the-tune',
    name: 'Pedals move the tune',
    category: 'string',
    description:
      'Steel line: overlapped notes bend by up to a whole tone under the bar, with one tape slap and an amplifier in a room.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.15, range: 2, glide: 240, vibrato: 14 },
    },
    effects: [
      { deviceId: 're-amp', params: { speaker: 1, drive: 0.35, room: 0.6, distance: 0.45 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'bands-of-one-blocked-with-the-palm',
    name: 'Blocked with the palm',
    category: 'plucked',
    description:
      'Steel pulse: bare picks on strings that die in two seconds, a low-pass that shuts after each stroke, and all of it pressed flat.',
    preview: SUNG_PULSE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { sustain: 2, pick: 1, tone: 2600 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 260,
          envAmount: 70,
          envAttackMs: 1,
          envReleaseMs: 70,
          resonance: 1,
        },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -7.5 } },
    ],
  },
  {
    id: 'bands-of-one-chime-at-the-octave',
    name: 'Chime at the octave',
    category: 'bell',
    description:
      'Steel sparkle: a bare pick on ringing strings, heard mostly an octave up with a thread of two, and three springs that splash late.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { sustain: 5, vibrato: 0, tone: 6000 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0, dry: 0.35, up1: 1, up2: 0.3, spread: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'bands-of-one-thumb-on-the-tenth',
    name: 'Thumb on the tenth',
    category: 'bass',
    description:
      'Steel bass: a thumb with no pick and a rounded tone, its low end thickened by a transformer.',
    preview: SUNG_BASS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { sustain: 4, vibrato: 0, tone: 1500 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'bands-of-one-bar-drawn-along-wire',
    name: 'Bar drawn along wire',
    category: 'texture',
    description:
      'Steel breath: tones and picks pulled far down, so the scrape in the air of the swells is what is left, spread wide.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { volume: -7, swell: 0.6, pick: 1, tone: 6000, vibrato: 30 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: -24, attacks: -20, air: 6, scatter: 1, soften: 0.6 } },
      { deviceId: 'fog', params: { size: 200, mix: 0.6 } },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },
  {
    id: 'bands-of-one-slide-off-the-end',
    name: 'Slide off the end',
    category: 'string',
    description:
      'Steel ending: slow bends of up to a tone on fading strings, caught in pieces that each drop a fifth as they die.',
    preview: ENDING,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { volume: -10.5, sustain: 6, range: 2, tone: 2400 },
    },
    effects: [
      { deviceId: 'falling', params: { fall: -7, size: 1200, density: 4, mix: 0.45, tone: 4000 } },
    ],
  },

  // Zither.
  {
    id: 'bands-of-one-all-strings-left-open',
    name: 'All strings left open',
    category: 'drone',
    description:
      'Zither floor: hammered tremolo on dark strings with the loose ones nearly at full, its strokes melted by a spectral blur.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { chord: 0, roll: 12, decay: 14, sympathy: 0.9, brightness: 0.2 },
    },
    effects: [
      { deviceId: 'spectral-blur', params: { blur: 0.7, smear: 0.9, mix: 0.7, highCut: 2400 } },
    ],
  },
  {
    id: 'bands-of-one-brushed-up-in-octaves',
    name: 'Brushed up in octaves',
    category: 'pad',
    description:
      'Zither pad: every key strummed upward with its octave, courses well detuned, turned in a slow rotary cabinet.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { exciter: 0, chord: 1, strum: 320, courses: 0.8, brightness: 0.35 },
    },
    effects: [
      { deviceId: 'rotary', params: { speed: 0, drive: 0.1, hornDepth: 0.8 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
    ],
  },
  {
    id: 'bands-of-one-fretted-course-sings',
    name: 'Fretted course sings',
    category: 'plucked',
    description:
      'Zither line: one picked string on a koto body, its held notes pulled into a wide late shake and driven through a tube.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -14, decay: 7, brightness: 0.45, position: 0.2, sympathy: 0.05 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 120, grow: 500, depth: 60, rate: 6, swell: 0.5 },
      },
      { deviceId: 'saturator', params: { curve: 2, driveDb: 9, toneDb: -2 } },
    ],
  },
  {
    id: 'bands-of-one-hammers-damped-by-cloth',
    name: 'Hammers damped by cloth',
    category: 'plucked',
    description:
      'Zither pulse: dulcimer hammers cut off almost at once, boxed inside a soundboard and repeated and pressed flat.',
    preview: SUNG_PULSE,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { volume: 1, roll: 0, decay: 0.9, release: 0.05, brightness: 0.5, sympathy: 0 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 5, size: 0.6, mix: 0.6, air: 0 } },
      { deviceId: 'analog-delay', params: { time: 600, feedback: 0.3, tone: 2200, mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 34, outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-pick-behind-the-bridge',
    name: 'Pick behind the bridge',
    category: 'bell',
    description:
      'Zither sparkle: octave pairs plucked beside the bridge, fed to a short flanged comb and an upward prism of echoes.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { volume: 6, strum: 0, decay: 6, brightness: 1, position: 0.05 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 1.2, rate: 0.1, depth: 40, feedback: 50, mix: 0.4 },
      },
      { deviceId: 'prism', params: { time: 800, shape: 0, feedback: 0.3, mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-contrabass-course',
    name: 'Contrabass course',
    category: 'bass',
    description:
      'Zither bass: a finger at mid-string on the harp body, through a low-pass that closes as each note dies.',
    preview: SUNG_BASS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { volume: -16, exciter: 0, position: 0.5, decay: 4, brightness: 0.5, sympathy: 0 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 220, envAmount: 55, envReleaseMs: 400 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'bands-of-one-nails-swept-along-wire',
    name: 'Nails swept along wire',
    category: 'texture',
    description:
      'Zither breath: suspended chords scraped slowly down and bright, then scattered into short backward grains.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: 1.5, direction: 1, strum: 400, decay: 3, release: 2.5, brightness: 1 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          size: 60,
          density: 40,
          spray: 0.6,
          scatter: 0.8,
          reverse: 1,
          mix: 0.8,
          feedback: 0.1,
        },
      },
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-counted-down-to-none',
    name: 'Counted down to none',
    category: 'plucked',
    description:
      'Zither ending: long single notes on a harp body, with echoes that skip farther and farther apart on a dull tape.',
    preview: ENDING,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 16, sympathy: 0.6, brightness: 0.3, position: 0.4 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },

  // Horns, high to low.
  {
    id: 'bands-of-one-four-horns-one-breath',
    name: 'Four horns, one breath',
    category: 'drone',
    description:
      'Brass floor: a full section of low brass blown softly, entering over a second, pushed back into a stone stairwell.',
    preview: ROWED_FLOOR,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { volume: -1, attack: 1, blow: 0.2, release: 2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'bands-of-one-bells-up-for-the-chords',
    name: 'Bells up for the chords',
    category: 'pad',
    description:
      'Brass pad: flugelhorns in section with a quick entry, each band of the chord swaying by itself, in a hall.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.35, release: 0.8, blow: 0.35 },
    },
    effects: [
      { deviceId: 'glimmer', params: { depth: 0.8, rate: 1.7, grain: 0.5, apart: 0.9 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bands-of-one-first-chair-stands-up',
    name: 'First chair stands up',
    category: 'wind',
    description:
      'Brass line: one open trumpet with a full vibrato, recorded through a hot valve and followed by a slap.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { blow: 0.55, breath: 0.1 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Hot valve' },
      { deviceId: 'analog-delay', preset: 'Slapback' },
    ],
  },
  {
    id: 'bands-of-one-tongues-on-the-cup',
    name: 'Tongues on the cup',
    category: 'wind',
    description:
      'Brass pulse: muted trumpets with a very short attack and release, pinched into a narrow band of the middle, in a small room.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: 6, attack: 0.02, release: 0.08, blow: 0.6, section: 0.5 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 2, cutoffHz: 1100, resonance: 1.6, mix: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'bands-of-one-mute-catches-the-sun',
    name: 'Mute catches the sun',
    category: 'wind',
    description:
      'Brass sparkle: a muted trumpet with its upper octaves added like glass, and slow bright sparks after it.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: 0.5, attack: 0.04, release: 1.4, blow: 0.3, breath: 0.4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', params: { lowCut: 350 } },
    ],
  },
  {
    id: 'bands-of-one-tuba-walks-the-roots',
    name: 'Tuba walks the roots',
    category: 'bass',
    description: 'Brass bass: a lone breathy tuba with a pipe stop speaking an octave under it.',
    preview: ROWED_BASS,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.06, release: 0.4, blow: 0.35 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          sub: 0.8,
          unison: 0.8,
          octave: 0,
          twelfth: 0,
          fifteenth: 0,
          speak: 60,
          tone: 0.2,
        },
      },
    ],
  },
  {
    id: 'bands-of-one-air-through-long-tubing',
    name: 'Air through long tubing',
    category: 'texture',
    description:
      'Brass breath: almost no tone, all air, drawn through a long open pipe with the lows cut away.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { blow: 0, attack: 0.5, release: 1.2 },
    },
    effects: [
      { deviceId: 'vessel', params: { body: 1, size: 2.4, air: 0.7, mix: 0.7 } },
      { deviceId: 'auto-filter', params: { type: 1, cutoffHz: 250 } },
    ],
  },
  {
    id: 'bands-of-one-section-lowers-its-horns',
    name: 'Section lowers its horns',
    category: 'wind',
    description:
      'Brass ending: a section of French horns in plain unison, quick to enter, in a long low cathedral of a reverb.',
    preview: ENDING,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { attack: 0.25, release: 2, blow: 0.4, section: 0.8, vibrato: 0.15, harmony: 0 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.45 } }],
  },

  // Choir.
  {
    id: 'bands-of-one-basses-hold-the-ground',
    name: 'Basses hold the ground',
    category: 'voice',
    description:
      'Choir floor: basses on oo with a slow entry and no vibrato, detuned to either side and driven softly into tape.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -14, vowel: 1, voice: 0.8, attack: 0.8, tone: 1800 },
    },
    effects: [
      { deviceId: 'stereo-detune', params: { detune: 12, mix: 0.45 } },
      { deviceId: 'saturator', params: { curve: 3, driveDb: 8 } },
    ],
  },
  {
    id: 'bands-of-one-altos-on-eh-hall-on-ah',
    name: 'Altos on eh, hall on ah',
    category: 'voice',
    description:
      'Choir pad: a full section on eh whose vowels keep moving, answered from a hall that sings ah.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { motion: 0.8, attack: 0.5, ensemble: 1, vibrato: 4 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.5 } }],
  },
  {
    id: 'bands-of-one-one-tenor-steps-down',
    name: 'One tenor steps down',
    category: 'voice',
    description:
      'Choir line: a single tenor on oh with a slow wide vibrato, heard across a room on a small loudspeaker.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vowel: 0.7, voice: 1, vibrato: 26, vibratoRate: 4.6, release: 0.4, attack: 0.15 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.2, distance: 0.6, room: 0.7, noise: 0 },
      },
    ],
  },
  {
    id: 'bands-of-one-consonants-in-threes',
    name: 'Consonants in threes',
    category: 'voice',
    description:
      'Choir pulse: breath with hardly any pitch in quick syllables, pressed flat with dotted tape repeats across the sides.',
    preview: SUNG_PULSE,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: {
        volume: -4.5,
        vowel: 0.5,
        breath: 1,
        attack: 0.01,
        release: 0.08,
        ensemble: 0.2,
        tone: 12000,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 400, presence: 5, air: 3 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 400, spread: 1, mix: 0.3 },
      },
      { deviceId: 'fet-limiter', preset: 'Squash', params: { outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-descant-from-the-gallery',
    name: 'Descant from the gallery',
    category: 'voice',
    description:
      'Choir sparkle: small high voices on ee with no vibrato, climbing two octaves in the tail of a short bright reverb.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { volume: -1.5, attack: 0.06, release: 0.8, voice: 1.4, ensemble: 0.4 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Sparkle room', params: { mix: 0.45 } }],
  },
  {
    id: 'bands-of-one-everyone-breathes-in',
    name: 'Everyone breathes in',
    category: 'texture',
    description:
      'Choir breath: breath at full through backward swells of a second and more, so each chord is drawn in and cut.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.5, release: 1, vowel: 0.6 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Backwards only', params: { time: 1200 } }],
  },
  {
    id: 'bands-of-one-lips-close-to-a-hum',
    name: 'Lips close to a hum',
    category: 'voice',
    description:
      'Choir ending: a closed hum sunk just under water with no bubbles, and a late hall behind it.',
    preview: ENDING,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.3, release: 4, tone: 1500, ensemble: 0.5 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },

  // Reed organ.
  {
    id: 'bands-of-one-two-keys-wedged-down',
    name: 'Two keys wedged down',
    category: 'drone',
    description:
      'Organ floor: the deep rank and its beating celeste, the bellows restless, one overtone of G held out of it like a whistle.',
    preview: ROWED_FLOOR,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.6, release: 1.5, bellows: 0.8, octave: 0, tone: 1200 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        params: { root: 7, pattern: 5, octave: 2, focus: 0.5, mix: 0.6 },
      },
    ],
  },
  {
    id: 'bands-of-one-four-stops-drawn',
    name: 'Four stops drawn',
    category: 'organ',
    description:
      'Organ pad: principals and high ranks without reed, quickly spoken, widened at the top and sent to a bright plate.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: {
        reed: 0,
        sub: 0.2,
        fifteenth: 0.9,
        twelfth: 0.7,
        celeste: 0.4,
        attack: 0.15,
        release: 0.6,
        tone: 5000,
      },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bands-of-one-left-hand-pumps-the-air',
    name: 'Left hand pumps the air',
    category: 'organ',
    description:
      'Organ line: a reed with tremulant and moving bellows, its body made smaller, over a narrow medium-wave radio.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        volume: -5,
        tremulant: 0.5,
        twelfth: 0.3,
        octave: 0,
        sub: 0,
        reed: 0.9,
        bellows: 0.6,
        attack: 0.06,
        release: 0.2,
      },
    },
    effects: [
      { deviceId: 'size', params: { size: -0.6, detail: 0.6 } },
      {
        deviceId: 'radio',
        params: {
          band: 0,
          fading: 0.15,
          static: 0.05,
          interference: 0,
          drift: 0.1,
          bandwidth: 0.6,
          speaker: 0.5,
        },
      },
    ],
  },
  {
    id: 'bands-of-one-keys-tapped-not-held',
    name: 'Keys tapped, not held',
    category: 'organ',
    description:
      'Organ pulse: short flute taps, their middle beaten thirteen times a second, with tape echoes two sixteenths behind.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { volume: 1, attack: 0.005, release: 0.06, breath: 0.6, sub: 0, fifteenth: 0.4 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        params: { rate: 13.33, depth: 0.9, duty: 0.4, edge: 6, low: 100, high: 2500 },
      },
      {
        deviceId: 'tape-echo',
        params: { time: 300, feedback: 0.4, mix: 0.35, highCut: 2000, lowCut: 300 },
      },
    ],
  },
  {
    id: 'bands-of-one-fifteenth-left-ringing',
    name: 'Fifteenth left ringing',
    category: 'organ',
    description:
      'Organ sparkle: the highest rank over a thread of twelfth, throwing off quick small sparks, its detune spiralling as it repeats.',
    preview: ROWED_SPARKLE,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: {
        volume: -5,
        twelfth: 0.25,
        fifteenth: 1,
        breath: 0.05,
        attack: 0.02,
        release: 1.5,
        tone: 9000,
      },
    },
    effects: [
      { deviceId: 'glints', preset: 'Glitter', params: { mix: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Spiral' },
    ],
  },
  {
    id: 'bands-of-one-feet-on-the-pedalboard',
    name: 'Feet on the pedalboard',
    category: 'bass',
    description:
      'Organ bass: the sub rank speaking quickly with a little reed, warmed by a console stage and kept in the centre.',
    preview: ROWED_BASS,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.06, release: 0.3, reed: 0.3, tone: 1000, bellows: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 1, drive: 0.6, tone: -0.2 } },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'bands-of-one-whole-service-one-seat',
    name: 'Whole service, one seat',
    category: 'organ',
    description:
      'Organ full mix: harmonium ranks from sub to fifteenth, a little tremulant, a fast rotor heard from across the room.',
    preview: ALL_PARTS,
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        volume: -14.5,
        sub: 0.5,
        fifteenth: 0.4,
        tremulant: 0.3,
        attack: 0.03,
        release: 0.25,
        tone: 4200,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 1, hornDepth: 0.4, drumDepth: 0.2, distance: 0.7, mix: 0.7 },
      },
      { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 3 } },
    ],
  },

  // One bowed string.
  {
    id: 'bands-of-one-open-string-without-end',
    name: 'Open string without end',
    category: 'drone',
    description:
      'Bow floor: a heavy bow on a big body with hardly any vibrato, and a dark pad of low strings that follows behind it.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { pressure: 0.8, brightness: 0.25, vibrato: 0.03, body: 1 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.5 } }],
  },
  {
    id: 'bands-of-one-four-bows-one-player',
    name: 'Four bows, one player',
    category: 'string',
    description:
      'Bow pad: light bows near mid-string, each chord tone doubled out of tune and left wandering around the head.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Soft flautando',
      params: { attack: 0.4, release: 0.9, detune: 20, brightness: 0.45 },
    },
    effects: [
      { deviceId: 'around', params: { path: 3, rate: 0.3, radius: 0.7 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow' },
    ],
  },
  {
    id: 'bands-of-one-thumb-position-tune',
    name: 'Thumb position tune',
    category: 'string',
    description:
      'Bow line: a firm bow with a clear vibrato, quick to speak, the wood made larger and a small room around it.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Raspy bow',
      params: {
        attack: 0.1,
        release: 0.4,
        brightness: 0.6,
        pressure: 0.6,
        position: 0.12,
        vibrato: 0.5,
        vibratoRate: 5,
      },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bands-of-one-plucks-as-the-bow-rests',
    name: 'Plucks as the bow rests',
    category: 'plucked',
    description:
      'Bow pulse: damped plucks given the weight of a small drum skin, each one thrown back by a spring.',
    preview: SUNG_PULSE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { brightness: 0.3, decay: 0.6, position: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'bands-of-one-barely-on-the-string',
    name: 'Barely on the string',
    category: 'string',
    description:
      'Bow sparkle: glassy bowing beside the bridge, each tone redrawn as pure sines an octave up that linger.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.15, release: 1.5, brightness: 1 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 400, air: 4 } },
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'bands-of-one-long-string-let-slack',
    name: 'Long string let slack',
    category: 'bass',
    description:
      'Bow bass: a string held by its own sustainer with the top kept dark, pushed gently into a wave folder and narrowed.',
    preview: SUNG_BASS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Quick sustain',
      params: {
        volume: -17.5,
        attack: 0.03,
        release: 0.4,
        brightness: 0.2,
        vibrato: 0,
        detune: 0,
        pressure: 0.3,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 4, driveDb: 5, toneDb: -5 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'bands-of-one-one-string-does-it-all',
    name: 'One string does it all',
    category: 'string',
    description:
      'Bow full mix: sustained strings quick enough for pulse and line, evened by a slow compressor, on a slightly warped record.',
    preview: ALL_PARTS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: {
        volume: -14,
        attack: 0.08,
        release: 0.8,
        brightness: 0.6,
        pressure: 0.3,
        detune: 9,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'vinyl', preset: 'New pressing', params: { warp: 0.4 } },
    ],
  },

  // Clarinets.
  {
    id: 'bands-of-one-bass-reed-never-rests',
    name: 'Bass reed never rests',
    category: 'drone',
    description:
      'Clarinet floor: a narrow reed blown very softly, its tones caught and kept alive as a dark and endless bed.',
    preview: ROWED_FLOOR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { bore: 0.1, blow: 0.15, attack: 0.5, release: 1 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.6 } }],
  },
  {
    id: 'bands-of-one-quartet-on-one-tongue',
    name: 'Quartet on one tongue',
    category: 'wind',
    description:
      'Clarinet pad: hollow chords entered together, through a twelve-stage phaser with negative feedback and a breathing reverb.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.5, release: 0.7, blow: 0.35, breath: 0.15 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: { stages: 4, feedback: -60, rate: 0.09, depth: 80, mix: 0.55 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bands-of-one-chalumeau-left-behind',
    name: 'Chalumeau left behind',
    category: 'wind',
    description:
      'Clarinet line: a reed halfway to a saxophone with some vibrato, followed a bar later by itself an octave lower.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { volume: -1.5, bore: 0.5, blow: 0.55, release: 0.5, vibrato: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 1, gap: 2.4, interval1: -12, fade: 0.3, tone: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'bands-of-one-slap-tongue-sevens',
    name: 'Slap tongue sevens',
    category: 'wind',
    description:
      'Clarinet pulse: growled stabs blown at full with the fastest attack, through a horn speaker, then pressed flat.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: {
        volume: 6,
        attack: 0.015,
        release: 0.15,
        growl: 0.3,
        blow: 1,
        bore: 1,
        breath: 0.2,
      },
    },
    effects: [
      { deviceId: 're-amp', params: { speaker: 3, drive: 0.4, room: 0.3, distance: 0.2 } },
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -9 } },
    ],
  },
  {
    id: 'bands-of-one-contra-in-long-boots',
    name: 'Contra in long boots',
    category: 'bass',
    description:
      'Clarinet bass: a low reed blown hard with little breath in it, shadowed an octave below and sent through a dark rotor drum.',
    preview: ROWED_BASS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.06, release: 0.3, breath: 0.05, blow: 1, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, dry: 0.7 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'bands-of-one-breath-before-the-reed',
    name: 'Breath before the reed',
    category: 'texture',
    description:
      'Clarinet breath: almost no tone and all air, thinned at both ends, coming and going in gusts and pressed flat.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { blow: 0, attack: 0.3, release: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'weather', preset: 'Dry gusts' },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },

  // Flutes.
  {
    id: 'bands-of-one-alto-flutes-in-a-ring',
    name: 'Alto flutes in a ring',
    category: 'drone',
    description:
      'Flute floor: low flutes with hardly any vibrato, recorded into four short loops of unequal length that go on turning.',
    preview: ROWED_FLOOR,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { attack: 0.4, release: 1.5, breath: 0.25, vibrato: 0.05 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: { loops: 4, length: 0.8, offset: 3.1, feedback: 0.6, wear: 0.6, mix: 0.5 },
      },
    ],
  },
  {
    id: 'bands-of-one-pipes-cut-to-length',
    name: 'Pipes cut to length',
    category: 'wind',
    description:
      'Flute pad: hollow pan pipes with no vibrato, given organ stops at the octave, twelfth and two octaves that speak a moment late.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: { attack: 0.25, release: 0.9, vibrato: 0, breath: 0.2, blow: 0.45 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 400,
          fifth: 0,
          octave: 0.6,
          sub: 0,
          twelfth: 0.4,
          fifteenth: 0.6,
          tone: 0.75,
          mix: 0.75,
        },
      },
    ],
  },
  {
    id: 'bands-of-one-wood-tells-the-story',
    name: 'Wood tells the story',
    category: 'wind',
    description:
      'Flute line: a wooden flute scooping up to each note on a worn cassette, with a faint echo running backwards.',
    preview: ROWED_LINE,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { scoop: 90, vibrato: 0.6, breath: 0.15 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bands-of-one-key-slaps-and-air',
    name: 'Key slaps and air',
    category: 'wind',
    description:
      'Flute pulse: hard chiffs on low pan pipes with the tone let go immediately, pressed to the front and panned by a fast ripple.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 1, breath: 1, blow: 0.2, attack: 0.005, release: 0.03 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'tremolo', params: { mode: 1, rate: 3.33, depth: 0.9 } },
    ],
  },
  {
    id: 'bands-of-one-overblown-to-the-top',
    name: 'Overblown to the top',
    category: 'wind',
    description:
      'Flute sparkle: a hard-blown concert flute cut thin, climbing in fourths through grains that repeat and rise.',
    preview: ROWED_SPARKLE,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { attack: 0.02, release: 0.6, vibrato: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 500, presence: 3 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { pitch: 5, mix: 0.4 } },
    ],
  },
  {
    id: 'bands-of-one-lungs-of-the-group',
    name: 'Lungs of the group',
    category: 'texture',
    description:
      'Flute breath: low flutes blown to a whisper, opened and closed by slow breaths, with a little room behind.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { attack: 0.8, release: 1, type: 1 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: { in: 1.4, out: 1.6, hold: 0.2, rest: 0.4, depth: 0.8, air: 0.8 },
      },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },

  // Wind harp.
  {
    id: 'bands-of-one-hum-from-the-frame',
    name: 'Hum from the frame',
    category: 'drone',
    description:
      'Wind harp floor: hum at full with no lull and little glint, its quiet low partials brought up, swelling every four seconds.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Low hum',
      params: { touch: 0, air: 0, width: 0.2 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Warm body' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'bands-of-one-hill-strings-all-lit',
    name: 'Hill strings all lit',
    category: 'pad',
    description:
      'Wind harp pad: four strings to a key in a steady strong wind, wide and bright, tempered by a taming filter.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Shimmer course',
      params: { wind: 0.8, gust: 0.1, release: 1, ring: 2 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Gentle' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'bands-of-one-single-wire-sings',
    name: 'Single wire sings',
    category: 'string',
    description:
      'Wind harp line: one string a key, plucked as it starts and blown after, kept in the centre and recorded to cassette.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Bare string',
      params: { wind: 0.55, touch: 0.8, hum: 0.4, release: 0.6 },
    },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
  },
  {
    id: 'bands-of-one-fingers-join-the-wind',
    name: 'Fingers join the wind',
    category: 'plucked',
    description:
      'Wind harp pulse: every key plucked in a near calm on short strings, crisp repeats chasing it a third of a bar on.',
    preview: SUNG_PULSE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Plucked course',
      params: { volume: -14.5, wind: 0.05, strings: 2, ring: 0.5, release: 0.15, hum: 0 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 800, mix: 0.3 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'bands-of-one-lit-rung-by-rung',
    name: 'Lit rung by rung',
    category: 'bell',
    description:
      'Wind harp sparkle: plucked, then the upper harmonics in full gusts with lows removed, answered by a cascade at octave and fifth speeds.',
    preview: SUNG_SPARKLE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Overtone ladder',
      params: { volume: 0, touch: 0.5, hum: 0, release: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 450, air: 4 } },
      { deviceId: 'cascade', preset: 'Sparkle bed' },
    ],
  },
  {
    id: 'bands-of-one-fence-post-fundamental',
    name: 'Fence post fundamental',
    category: 'bass',
    description:
      'Wind harp bass: humming wires spoken by a pluck with the top shut, saturated and held at the centre.',
    preview: SUNG_BASS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: {
        volume: -20,
        hum: 1,
        glint: 0.2,
        touch: 0.7,
        wind: 0.3,
        air: 0,
        release: 0.5,
        width: 0,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -12 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 380 } },
    ],
  },
  {
    id: 'bands-of-one-night-between-wires',
    name: 'Night between wires',
    category: 'texture',
    description:
      'Wind harp breath: air at full in strong gusts with short lulls, mostly the notes of A minor let through.',
    preview: SUNG_PAD,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Night wind',
      params: { release: 1.5, lull: 0.2, gust: 1 },
    },
    effects: [{ deviceId: 'scale-filter', params: { root: 9, scale: 1, depth: 24, ring: 0.8 } }],
  },
  {
    id: 'bands-of-one-wind-drops-at-cadence',
    name: 'Wind drops at cadence',
    category: 'string',
    description:
      'Wind harp ending: plucked strings that ring many seconds in a light wind, under a tail that glides slowly down.',
    preview: ENDING,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Slow swell',
      params: { volume: -13, touch: 0.6, wind: 0.2, gust: 0.1, lull: 0, release: 5 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.35 } }],
  },
  {
    id: 'bands-of-one-second-harp-downwind',
    name: 'Second harp downwind',
    category: 'pad',
    description:
      'Wind harp second pad: three strings a key under deep lulls, every attack blurred, then moved far off in dull air.',
    preview: ROWED_PAD,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Long lulls',
      params: { volume: -2.5, lull: 0.6, gust: 0.9, release: 2, strings: 3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Rolling in' },
      { deviceId: 'distance', preset: 'Through fog' },
    ],
  },
  {
    id: 'bands-of-one-whistle-over-the-ridge',
    name: 'Whistle over the ridge',
    category: 'wind',
    description:
      'Wind harp second line: a glassy whistle of one string in high wind, shifted by a hertz or two so its sides beat.',
    preview: SUNG_LINE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Glass whistle',
      params: { volume: 0, release: 0.5, glint: 0.8, wind: 0.65 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { shift: 0, fine: 1.6, mode: 2, feedback: 0.3, mix: 0.5 },
      },
      { deviceId: 'spread', preset: 'Wide but safe' },
    ],
  },
  {
    id: 'bands-of-one-sleet-across-two-strings',
    name: 'Sleet across two strings',
    category: 'plucked',
    description:
      'Wind harp second pulse: soft plucks with two strings to a key, gated left and right by turns, the top raised.',
    preview: ROWED_PULSE,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Soft pluck',
      params: { volume: -3.5, ring: 2, release: 1, strings: 2 },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Left then right' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'bands-of-one-gate-creaks-in-fifths',
    name: 'Gate creaks in fifths',
    category: 'drone',
    description:
      'Wind harp second floor: humming wires in a stiff wind, dropped an octave and spread until they clang like low metal.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Fence wires',
      params: { lull: 0, wind: 0.6, glint: 0.9, strings: 2, ring: 3 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Sunken gong', params: { mix: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'bands-of-one-sea-air-on-the-strings',
    name: 'Sea air on the strings',
    category: 'texture',
    description:
      'Wind harp second breath: a gusting breeze that is mostly air, very wide, with slow surf drawn through it.',
    preview: SUNG_FLOOR,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Sea breeze',
      params: { air: 0.9, hum: 0, touch: 0, width: 1 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow surf' },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'bands-of-one-wind-conducts-everyone',
    name: 'Wind conducts everyone',
    category: 'string',
    description:
      'Wind harp full mix: two strings to a key, plucked and blown at once, braced by a quick compressor in an open valley.',
    preview: ALL_PARTS,
    instrument: {
      deviceId: 'wind-harp',
      preset: 'Wind harp',
      params: { touch: 0.75, lull: 0, gust: 0.35, release: 0.8, ring: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
  },
]
