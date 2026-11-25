import { type FactoryPreset, type Phrase } from '../types'

// Two high, pure tones, and a drive that turns the distance between them in hertz into a low note that no
// key plays. Laid out by how the second tone is had (two keys, two oscillators, a beat, a shift), by what
// drives the pair, and by how far the two whistles are put behind the note they make.

// C6 held while a second tone moves under it: the gaps are C3, G2, A2, F2, a bass line no key plays.
const ONE_STAYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 84, gain: 0.6 },
    { atSec: 0, durSec: 1.5, note: 81.688, gain: 0.6 },
    { atSec: 1.55, durSec: 1.5, note: 82.298, gain: 0.6 },
    { atSec: 3.1, durSec: 1.5, note: 82.077, gain: 0.6 },
    { atSec: 4.65, durSec: 1.5, note: 82.492, gain: 0.6 },
  ],
}

// A5 held and the gap closing step by step: D3, C3, B2, A2, the falling fourth of D dorian.
const FALLING_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 81, gain: 0.6 },
    { atSec: 0, durSec: 1.55, note: 77.84, gain: 0.6 },
    { atSec: 1.6, durSec: 1.55, note: 78.214, gain: 0.6 },
    { atSec: 3.2, durSec: 1.55, note: 78.383, gain: 0.6 },
    { atSec: 4.8, durSec: 1.55, note: 78.688, gain: 0.6 },
  ],
}

// E5 alone, its neighbour 110 Hz under it alone, then both: A2 is there only in the overlap.
const APART_THEN_BOTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 76, gain: 0.6 },
    { atSec: 1.8, durSec: 1.5, note: 72.84, gain: 0.6 },
    { atSec: 3.6, durSec: 3, note: 76, gain: 0.6 },
    { atSec: 3.6, durSec: 3, note: 72.84, gain: 0.6 },
  ],
}

// Pure fifths in parallel on A, G, E and D: three over two, so each gap is the octave under the lower note.
const PURE_FIFTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 69, gain: 0.6 },
    { atSec: 0, durSec: 1.5, note: 76.02, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 67, gain: 0.6 },
    { atSec: 1.6, durSec: 1.5, note: 74.02, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 64, gain: 0.6 },
    { atSec: 3.2, durSec: 1.5, note: 71.02, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 62, gain: 0.6 },
    { atSec: 4.8, durSec: 1.9, note: 69.02, gain: 0.5 },
  ],
}

// Pure major thirds on C, F, G and C: five over four, so the gaps are C3, F3, G3, C3.
const PURE_THIRDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 72, gain: 0.6 },
    { atSec: 0, durSec: 1.5, note: 75.863, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 77, gain: 0.6 },
    { atSec: 1.6, durSec: 1.5, note: 80.863, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 79, gain: 0.6 },
    { atSec: 3.2, durSec: 1.5, note: 82.863, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 72, gain: 0.6 },
    { atSec: 4.8, durSec: 1.9, note: 75.863, gain: 0.5 },
  ],
}

// Pure fourths with A, D, G and C on top: four over three, so the gaps fall in fifths, two octaves under.
const PURE_FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 81, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 76.02, gain: 0.6 },
    { atSec: 1.6, durSec: 1.5, note: 74, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 69.02, gain: 0.6 },
    { atSec: 3.2, durSec: 1.5, note: 79, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 74.02, gain: 0.6 },
    { atSec: 4.8, durSec: 1.9, note: 72, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 67.02, gain: 0.6 },
  ],
}

// A, G, F, E, D, each with a tone 146.8 Hz under it: the tune walks down and the gap stays on D3.
const SAME_GAP: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 81, gain: 0.6 },
    { atSec: 0, durSec: 1.2, note: 77.84, gain: 0.55 },
    { atSec: 1.25, durSec: 1.2, note: 79, gain: 0.6 },
    { atSec: 1.25, durSec: 1.2, note: 75.41, gain: 0.55 },
    { atSec: 2.5, durSec: 1.2, note: 77, gain: 0.6 },
    { atSec: 2.5, durSec: 1.2, note: 72.914, gain: 0.55 },
    { atSec: 3.75, durSec: 1.2, note: 76, gain: 0.6 },
    { atSec: 3.75, durSec: 1.2, note: 71.638, gain: 0.55 },
    { atSec: 5, durSec: 1.9, note: 74, gain: 0.6 },
    { atSec: 5, durSec: 1.9, note: 69.02, gain: 0.55 },
  ],
}

// A5 held and a tone above it drawing away: the gap climbs D2, E2, F2, G2, A2.
const GAP_OPENS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.6, note: 81, gain: 0.6 },
    { atSec: 0, durSec: 1.2, note: 82.387, gain: 0.6 },
    { atSec: 1.25, durSec: 1.2, note: 82.55, gain: 0.6 },
    { atSec: 2.5, durSec: 1.2, note: 82.638, gain: 0.6 },
    { atSec: 3.75, durSec: 1.2, note: 82.828, gain: 0.6 },
    { atSec: 5, durSec: 1.6, note: 83.039, gain: 0.6 },
  ],
}

// Partials eight, nine and ten of C, A, F and G (A's tenth is a pure C sharp): both gaps agree on the low root.
const EIGHT_NINE_TEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 84, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 86.039, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 87.863, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 81, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 83.039, gain: 0.5 },
    { atSec: 1.6, durSec: 1.5, note: 84.863, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 77, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 79.039, gain: 0.5 },
    { atSec: 3.2, durSec: 1.5, note: 80.863, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 79, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 81.039, gain: 0.5 },
    { atSec: 4.8, durSec: 1.9, note: 82.863, gain: 0.5 },
  ],
}

// A5, F sharp a pure minor third below it and D5 entering in turn: six, five and four over D3.
const D_FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 81.02, gain: 0.55 },
    { atSec: 1.4, durSec: 5.4, note: 77.863, gain: 0.55 },
    { atSec: 2.8, durSec: 4, note: 74, gain: 0.55 },
  ],
}

// One key at a time, D, F, E, C, D, tuned pure on C: for patches that carry the second tone themselves,
// and so that two keys which meet in an echo leave a C, an F or an A under them.
const ONE_KEY_EACH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 74.039, gain: 0.65 },
    { atSec: 1.7, durSec: 0.8, note: 76.98, gain: 0.6 },
    { atSec: 2.6, durSec: 0.8, note: 75.863, gain: 0.6 },
    { atSec: 3.5, durSec: 1.2, note: 72, gain: 0.6 },
    { atSec: 4.8, durSec: 2, note: 74.039, gain: 0.65 },
  ],
}

// A, C, E, D, A: the keys move slowly over a gap that is the same for all of them.
const KEYS_OVER: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 69, gain: 0.6 },
    { atSec: 1.5, durSec: 1.3, note: 72, gain: 0.6 },
    { atSec: 2.8, durSec: 1.3, note: 76, gain: 0.6 },
    { atSec: 4.1, durSec: 1.3, note: 74, gain: 0.6 },
    { atSec: 5.4, durSec: 1.6, note: 69, gain: 0.6 },
  ],
}

// D3, F3, C3, D3: low keys whose own fundamental is cut away and grown again.
const OWN_FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 50, gain: 0.6 },
    { atSec: 1.9, durSec: 1.4, note: 53, gain: 0.6 },
    { atSec: 3.3, durSec: 1.4, note: 48, gain: 0.6 },
    { atSec: 4.7, durSec: 2, note: 50, gain: 0.6 },
  ],
}

// A5 held alone, long enough for a tone that moves by itself to pass through it.
const ONE_LONG_KEY: Phrase = {
  notes: [{ atSec: 0, durSec: 6.8, note: 81, gain: 0.65 }],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'bass-nobody-plays-low-c-in-the-gap',
    name: 'Low C in the gap',
    category: 'bass',
    description:
      'Near-sine glass keys into a hot tube curve, then a steep low-pass at 300 Hz that leaves the gap between them, and a dark plate.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'fm-glass',
      params: {
        algorithm: 3,
        ratio: 1,
        brightness: 0.1,
        sustain: 1,
        decay: 10,
        attack: 0.06,
        release: 0.8,
        detune: 0.5,
        feedback: 0,
        spread: 0,
        velocity: 0.4,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 14, bias: 0.8, outputDb: -13, toneDb: -6 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 300 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'bass-nobody-plays-struck-glass-cellar',
    name: 'Struck glass cellar',
    category: 'bass',
    description:
      'Glass mallets into a triode, where their low note fades faster than they do, with the low end raised and the sound set in a room.',
    preview: PURE_FOURTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        ratio: 1,
        brightness: 0.18,
        decay: 3.2,
        release: 1.2,
        detune: 1,
        spread: 0.05,
        velocity: 0.4,
        attack: 0.012,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.45, push: 0, output: -14.5, highCut: 5000, tone: -0.5 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 10, body: 3, presence: -5, air: -6 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'bass-nobody-plays-three-bowls-one-root',
    name: 'Three bowls, one root',
    category: 'drone',
    description:
      'Glass bowls with long decays through a hot valve, the beating of their own pairs kept, in a wide open hall.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: {
        algorithm: 0,
        ratio: 3,
        brightness: 0.16,
        decay: 14,
        attack: 0.25,
        detune: 3,
        spread: 0.1,
        velocity: 0.3,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.85, wobble: 0, wear: 0, noise: 0, output: -12, tone: 0.2 },
      },
      {
        deviceId: 'ambient-eq',
        params: { clear: 0, low: 12, presence: -12, air: -8, highCut: 1500 },
      },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'bass-nobody-plays-whistles-over-the-hill',
    name: 'Whistles over the hill',
    category: 'pad',
    description:
      'Slow glass tones driven on a biased tape curve, then moved far off through air and room, where their low gap carries further than they do.',
    preview: APART_THEN_BOTH,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: {
        ratio: 1,
        brightness: 0.12,
        attack: 0.5,
        detune: 1,
        spread: 0.1,
        volume: 2.5,
        release: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 3, driveDb: 12, bias: 1, outputDb: -24, toneDb: -9 },
      },
      {
        deviceId: 'distance',
        preset: 'Far shore',
        params: { distance: 0.6, wander: 0.1, doppler: 0 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-toy-keys-at-a-well',
    name: 'Toy keys at a well',
    category: 'keys',
    description:
      'Short toy keys on a curve folded not quite at its top and low-passed at 420 Hz: a blunt low note under faint keys, in a tight swarm.',
    preview: PURE_FIFTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Toy keys',
      params: {
        ratio: 3,
        brightness: 0.22,
        decay: 1.1,
        sustain: 0.25,
        release: 0.5,
        attack: 0.008,
        spread: 0,
        velocity: 0.3,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 4, driveDb: 10, bias: 0.97, outputDb: -18 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 420 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-organ-loft-remainder',
    name: 'Organ loft remainder',
    category: 'organ',
    description:
      'A glass organ through a slow rotating cabinet driven hard and leaning on its drum, then a triode that finds the root under each third.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass organ',
      params: { ratio: 3, brightness: 0.2, detune: 1, spread: 0, attack: 0.08, volume: -2 },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { drive: 0.9, balance: 0.1, hornDepth: 0.3, mix: 1 },
      },
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.4,
          push: 0,
          output: -13,
          tone: -1,
          lowBump: 0.9,
          highCut: 1500,
        },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-floor-that-wavers',
    name: 'Floor that wavers',
    category: 'drone',
    description:
      'Glass tones whose pairs are detuned seven cents, so the low note made in the triode wavers, low-passed, with strings on a D triad ringing.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: {
        ratio: 1,
        brightness: 0.14,
        attack: 0.4,
        detune: 7,
        spread: 0,
        feedback: 0.1,
        volume: 3,
        release: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.5,
          push: 0,
          output: -10,
          lowBump: 0.6,
          tone: -0.9,
          highCut: 1800,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 320 } },
      { deviceId: 'sympathetic', preset: 'Open triad', params: { root: 2, mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-copy-lifted-by-a-low-d',
    name: 'Copy lifted by a low D',
    category: 'bass',
    description:
      'One glass key and a copy of it shifted up 73.4 Hz, driven together on a tube curve, so any key carries a low D, filtered dark.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'fm-glass',
      params: {
        algorithm: 3,
        ratio: 1,
        brightness: 0.06,
        sustain: 1,
        decay: 10,
        attack: 0.02,
        release: 0.4,
        detune: 0.5,
        feedback: 0,
        spread: 0,
        velocity: 0.4,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          shift: 73.4,
          fine: 0,
          mode: 0,
          feedback: 0,
          lfoDepth: 0,
          width: 0,
          mix: 0.5,
          tone: 16000,
        },
      },
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 12, bias: 0.9, outputDb: -15.5, toneDb: -6 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 380, resonance: 1.1 } },
    ],
  },
  {
    id: 'bass-nobody-plays-split-by-a-hidden-ring',
    name: 'Split by a hidden ring',
    category: 'texture',
    description:
      'A ring at 49 Hz splits each glass key into two, 98 Hz apart; an off-centre curve joins them into a low G, under a soft fog.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'fm-glass',
      params: {
        algorithm: 1,
        ratio: 3,
        brightness: 0.18,
        sustain: 1,
        decay: 10,
        attack: 0.15,
        release: 1.5,
        detune: 2,
        feedback: 0,
        spread: 0,
        velocity: 0.4,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'ring',
        params: {
          tune: 1,
          frequency: 49,
          wave: 0,
          second: 0,
          drift: 0,
          width: 0,
          lowCut: 20,
          mix: 1,
        },
      },
      {
        deviceId: 'saturator',
        params: { curve: 0, driveDb: 12, bias: 1, outputDb: -21.5, toneDb: -12 },
      },
      { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.8 } },
    ],
  },
  {
    id: 'bass-nobody-plays-trembling-remainder',
    name: 'Trembling remainder',
    category: 'pad',
    description:
      'A slow tremolo ahead of a triode: the glass sways and the low note made of it sways deeper still, raised and set on a bright plate.',
    preview: EIGHT_NINE_TEN,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: {
        brightness: 0.12,
        feedback: 0,
        detune: 1,
        spread: 0,
        attack: 0.2,
        release: 0.7,
        volume: 1,
      },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 0, rate: 2.2, depth: 0.6, drift: 0 } },
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.6, push: 0, output: -8, tone: -1, highCut: 1500 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 8, presence: -4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-echo-against-the-tone',
    name: 'Echo against the tone',
    category: 'bass',
    description:
      'Tape echoes ahead of the drive, so each glass key meets the one before it as well and makes a second, fainter bass with it.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: {
        ratio: 1,
        brightness: 0.1,
        decay: 3,
        sustain: 0.4,
        attack: 0.02,
        release: 0.8,
        detune: 0,
        feedback: 0,
        spread: 0,
        velocity: 0.3,
        volume: 3,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 520, feedback: 0.45, wow: 0, flutter: 0, mix: 0.45 },
      },
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.6, push: 0, output: -9.5, tone: -0.8, highCut: 2000 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 9, presence: -6, highCut: 1800 } },
    ],
  },
  {
    id: 'bass-nobody-plays-redrawn-in-sines',
    name: 'Redrawn in sines',
    category: 'bass',
    description:
      'Sine chimes in a hot dull valve; the strongest partials, the low gap among them, are drawn again as held sines.',
    preview: GAP_OPENS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Sine chimes',
      params: {
        brightness: 0.05,
        decay: 8,
        sustain: 0.5,
        attack: 0.03,
        release: 1.5,
        detune: 1,
        spread: 0,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.95, wobble: 0, wear: 0, noise: 0, output: -10, tone: 0 },
      },
      {
        deviceId: 'sine-shadow',
        params: { partials: 3, attack: 90, release: 1.2, mix: 0.7, tone: 0.2, steady: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-pings-into-thuds',
    name: 'Pings into thuds',
    category: 'plucked',
    description:
      'Short glass pings on a folded curve, then off the side of a dull stack: low thuds with a tick on top, in a few dark echoes.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass ping',
      params: {
        ratio: 1,
        brightness: 0.2,
        decay: 0.7,
        sustain: 0.12,
        release: 0.4,
        attack: 0.006,
        detune: 0,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 4, driveDb: 10, bias: 1, outputDb: -15.5 } },
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0,
          bass: 1,
          treble: -1,
          distance: 0,
          room: 0.1,
          angle: 1,
          noise: 0,
          output: -9.5,
        },
      },
      { deviceId: 'constellation', preset: 'Dark field', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-rubbed-until-it-hums',
    name: 'Rubbed until it hums',
    category: 'drone',
    description:
      'Rubbed glass onto hot tape; what is quiet in it, the hum between the tones, is then turned up from below and the rest filtered dark.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Rubbed glass',
      params: {
        ratio: 1,
        brightness: 0.16,
        feedback: 0.05,
        attack: 0.6,
        detune: 2,
        spread: 0.1,
        volume: 3,
        release: 3,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 0.9,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0,
          speed: 0,
          age: 0,
          output: -11,
        },
      },
      { deviceId: 'reveal', params: { amount: 1, rise: 400, focus: -1, range: 24 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 600 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-hung-low-mist',
    name: 'Hung low mist',
    category: 'drone',
    description:
      'Crystal tones through a hot valve, and only what lies under 500 Hz smeared into a hanging mist behind them.',
    preview: EIGHT_NINE_TEN,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: {
        ratio: 3,
        brightness: 0.1,
        attack: 0.4,
        release: 0.7,
        detune: 1,
        spread: 0,
        feedback: 0,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.85, wobble: 0, wear: 0, noise: 0, output: -8, tone: 0.1 },
      },
      {
        deviceId: 'spectral-blur',
        params: { blur: 0.75, smear: 0.6, highCut: 500, tilt: -1, mix: 0.65, width: 1 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 4, air: -6 } },
    ],
  },
  {
    id: 'bass-nobody-plays-glass-under-the-jetty',
    name: 'Glass under the jetty',
    category: 'texture',
    description:
      'A warm glass pad on a hot tube curve tilted dark, heard through wavering water with few bubbles; the gap falls in fifths below it.',
    preview: PURE_FOURTHS,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Warm glass pad',
      params: {
        brightness: 0.12,
        feedback: 0.08,
        detune: 3,
        spread: 0.1,
        attack: 0.5,
        release: 1,
        volume: 0,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 14, bias: 0.8, outputDb: -24, toneDb: -10 },
      },
      {
        deviceId: 'underwater',
        preset: 'Sunlit shallows',
        params: { depth: 0.35, bubbles: 0.1, mix: 0.85 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-bowed-plate-no-root',
    name: 'Bowed plate, no root',
    category: 'pad',
    description:
      'Bowed metal with a trace of its tritone partials, on a triode cut at 1.5 kHz, gently filtered to its low end, rolled soft by a dark fog.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Bowed metal',
      params: {
        brightness: 0.03,
        detune: 2,
        spread: 0.1,
        feedback: 0,
        attack: 0.35,
        release: 0.5,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.35,
          push: 0,
          output: -4,
          highCut: 1500,
          lowBump: 0.8,
          tone: -1,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 330 } },
      { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'bass-nobody-plays-third-player-missing',
    name: 'Third player missing',
    category: 'wind',
    description:
      'Straight concert flutes into a triode, both whistles kept in front and the bass between them just behind, lifted a little, in a chamber.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { breath: 0.06, attack: 0.12, release: 0.6, volume: -2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.4, push: 0, output: -8.5, tone: -0.5, highCut: 6000 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 6 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'bass-nobody-plays-recorders-in-the-crypt',
    name: 'Recorders in the crypt',
    category: 'wind',
    description:
      'Soft recorders, no vibrato, a warm tube curve and a gentle cut at 330 Hz, so the stone carries their difference more than their tune.',
    preview: SAME_GAP,
    instrument: { deviceId: 'flute', preset: 'Soft recorder', params: { volume: 3 } },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 12, bias: 0.8, outputDb: -15.5, toneDb: -4 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 330 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bass-nobody-plays-pipes-below-ground',
    name: 'Pipes below ground',
    category: 'bass',
    description:
      'Pan pipes with their chiff left on, into a hard off-centre clip and a 24 dB filter at 260 Hz: puffs of a bass that skip away.',
    preview: PURE_FOURTHS,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.25, vibrato: 0, scoop: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 10, bias: 0.9, outputDb: -12, toneDb: -4 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 260, resonance: 1.3 } },
      { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-breath-around-a-floor',
    name: 'Breath around a floor',
    category: 'wind',
    description:
      'Low flutes, half of them breath, with slow edges, in a hot valve, the low gap lifted: a soft hum in the air of a thin winter room.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.5, blow: 0.3, attack: 0.6, release: 1.6, vibrato: 0, volume: -4 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0, wear: 0, noise: 0, output: -12, tone: 0.25 },
      },
      {
        deviceId: 'ambient-eq',
        params: { clear: 0, low: 12, body: 2, presence: -9, air: -10, highCut: 2200 },
      },
      { deviceId: 'seasons', preset: 'Deep winter', params: { year: 0.8, turn: 0, mix: 0.5 } },
    ],
  },
  {
    id: 'bass-nobody-plays-bent-in-then-level',
    name: 'Bent in, then level',
    category: 'wind',
    description:
      'Bamboo flutes that bend up into each note: the bass made in the triode moves before it settles, with the low end raised and murky echoes.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: { breath: 0.2, scoop: 90, vibrato: 0.05, chiff: 0.4, attack: 0.06, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.5,
          push: 0,
          output: -9.5,
          lowBump: 0.8,
          tone: -0.9,
          highCut: 2200,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 6, presence: -3 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'bass-nobody-plays-one-cellar-two-flutes',
    name: 'One cellar, two flutes',
    category: 'bass',
    description:
      'Wood flutes blown level into a pushed stack heard from the side, then a low shelf lifts what they make between them.',
    preview: GAP_OPENS,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { breath: 0.08, vibrato: 0, scoop: 0, chiff: 0.3, attack: 0.1, volume: 4 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0.9,
          bass: 1,
          treble: -1,
          distance: 0.15,
          room: 0.3,
          angle: 0.9,
          noise: 0,
          output: -5,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 8, presence: -6, highCut: 2000 } },
    ],
  },
  {
    id: 'bass-nobody-plays-sway-laid-over-after',
    name: 'Sway laid over after',
    category: 'wind',
    description:
      'Straight low flutes meet in a dark triode first; the vibrato comes late and after it, so whistles and floor bend together.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { type: 1, breath: 0.1, attack: 0.2, release: 0.9, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.5,
          push: 0,
          output: -9.5,
          tone: -0.9,
          lowBump: 0.6,
          highCut: 2500,
        },
      },
      { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 22, wait: 300 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-hard-blown-pair',
    name: 'Hard blown pair',
    category: 'wind',
    description:
      'Overblown flutes, partly through the narrow band of a radio, then an off-centre soft curve that gives them back a floor, and a spring.',
    preview: APART_THEN_BOTH,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: { vibrato: 0.1, scoop: 0, attack: 0.03, volume: 0 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { fading: 0.15, static: 0, interference: 0, mix: 0.6 },
      },
      {
        deviceId: 'saturator',
        params: { curve: 0, driveDb: 10, bias: 1, outputDb: -14.5, toneDb: -8 },
      },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-half-of-a-whisper',
    name: 'Half of a whisper',
    category: 'texture',
    description:
      'Whispering pipes, mostly air, on a triode with the lows cut before it; a grain cloud an octave up hangs over the faint floor.',
    preview: EIGHT_NINE_TEN,
    instrument: {
      deviceId: 'flute',
      preset: 'Whisper pipes',
      params: { breath: 0.6, blow: 0.2, attack: 0.25, release: 1, volume: 4 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.6,
          push: 0,
          output: -8.5,
          lowCut: 200,
          tone: -0.8,
          highCut: 2500,
        },
      },
      { deviceId: 'grain-cloud', preset: 'Thin veil', params: { pitch: 12, mix: 0.3 } },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 11, presence: -6 } },
    ],
  },
  {
    id: 'bass-nobody-plays-swell-with-no-bottom',
    name: 'Swell with no bottom',
    category: 'pad',
    description:
      'Wood flutes that take a second to open into a hot dull valve: the floor, lifted, comes after the whistles, in a reverb shaped to bloom.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'flute',
      preset: 'Slow wood swell',
      params: { breath: 0.15, vibrato: 0, attack: 1.1, release: 2.5, volume: -1 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.85, wobble: 0, wear: 0, noise: 0, output: -8, tone: 0 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 12, presence: -9, highCut: 1800 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'bass-nobody-plays-flute-with-its-own-fifth',
    name: 'Flute with its own fifth',
    category: 'wind',
    description:
      'One flute line and a smooth copy a fifth up, joined on a biased tape curve into a third line an octave under the flute.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { breath: 0.08, vibrato: 0.06, chiff: 0.2, scoop: 0, volume: 3 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: {
          pitchA: 7,
          levelB: 0,
          mode: 0,
          size: 80,
          mix: 0.5,
          detune: 2,
          spread: 0,
          feedback: 0,
        },
      },
      {
        deviceId: 'saturator',
        params: { curve: 3, driveDb: 12, bias: 1, outputDb: -20.5, toneDb: -10 },
      },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-round-makes-its-bass',
    name: 'Round makes its bass',
    category: 'wind',
    description:
      'A flute line with two followers at the unison, 0.85 s apart, into a dark triode: wherever entries overlap there is a bass.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { breath: 0.12, vibrato: 0.05, scoop: 0, attack: 0.08, release: 0.7, volume: 3 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 0.85,
          interval1: 0,
          interval2: 0,
          fade: 0.1,
          spread: 0,
          mix: 0.5,
          round: 0,
        },
      },
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.6,
          push: 0,
          output: -10,
          tone: -1,
          lowBump: 0.8,
          highCut: 2000,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-alto-pair-both-holding',
    name: 'Alto pair, both holding',
    category: 'drone',
    description:
      'Alto flutes on worn hot tape, what two moments share left hanging, and a gentle low-pass that lets the floor come out from under them.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: {
        breath: 0.12,
        blow: 0.5,
        vibrato: 0.05,
        scoop: 0,
        chiff: 0.2,
        attack: 0.2,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0.15,
          flutter: 0.05,
          hiss: 0.1,
          bump: 1,
          tone: 0,
          speed: 1,
          age: 0.2,
          output: -4,
        },
      },
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.6 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 350 } },
    ],
  },
  {
    id: 'bass-nobody-plays-octave-under-both',
    name: 'Octave under both',
    category: 'bass',
    description:
      'One key sounds two sines a pure fifth apart; a biased tube curve makes the octave under the key and a low-pass keeps mostly that.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 7,
        osc2Fine: 2,
        oscMix: 0.5,
        ampAttack: 0.03,
        ampRelease: 0.4,
        velToAmp: 0.4,
        volume: 5,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 18, bias: 0.8, outputDb: -15, toneDb: -6 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 420 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-twelfth-below-the-hand',
    name: 'Twelfth below the hand',
    category: 'bass',
    description:
      'Two triangles a pure fourth apart under one key, into a dark triode that makes a third tone a twelfth below it, lifted in the low end.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Coarse: 5,
        osc2Fine: -2,
        oscMix: 0.5,
        ampAttack: 0.06,
        ampRelease: 0.8,
        velToAmp: 0.4,
        volume: 5,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.55,
          push: 0,
          output: -9.5,
          tone: -0.8,
          lowBump: 0.5,
          highCut: 2500,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 8, presence: -4 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'bass-nobody-plays-two-octaves-of-nothing',
    name: 'Two octaves of nothing',
    category: 'plucked',
    description:
      'A plucked pair of sines a just third apart, folded and heard off the side of a dull stack: mostly the note two octaves under the key.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 4,
        osc2Fine: -14,
        oscMix: 0.5,
        ampAttack: 0.004,
        ampRelease: 0.9,
        velToAmp: 0.5,
        volume: 5,
        ampDecay: 1.4,
        ampSustain: 0.15,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 4, driveDb: 16, bias: 1, outputDb: -20, toneDb: -12 },
      },
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0,
          bass: 1,
          treble: -1,
          distance: 0,
          room: 0.1,
          angle: 1,
          noise: 0,
          output: -12,
        },
      },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-one-fifth-of-the-key',
    name: 'One fifth of the key',
    category: 'pad',
    description:
      'A slow pad of two sines a just minor third apart, a biased tape curve adding their difference, a fifth of the key, with deep chorus after.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 3,
        osc2Fine: 16,
        oscMix: 0.5,
        ampAttack: 0.5,
        ampRelease: 2.5,
        velToAmp: 0.4,
        volume: 6,
        lfo2Dest: 3,
        lfo2Amount: 0,
        unisonVoices: 1,
        resonance: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 3, driveDb: 18, bias: 0.9, outputDb: -23.5, toneDb: -10 },
      },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 3, air: -8, highCut: 2500 } },
    ],
  },
  {
    id: 'bass-nobody-plays-three-octaves-down-bent',
    name: 'Three octaves down, bent',
    category: 'bass',
    description:
      'A gliding lead of two sines a pure whole tone apart: the triode makes their eighth, three octaves down, and it slides as they slide.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'ember',
      preset: 'Sync Lead',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 2,
        osc2Fine: 4,
        oscMix: 0.5,
        ampAttack: 0.05,
        ampRelease: 0.5,
        velToAmp: 0.4,
        volume: 6,
        voiceMode: 2,
        glide: 0.14,
        osc2Sync: 0,
        filterDrive: 0,
        resonance: 0,
        lfo1Amount: 0.01,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.7,
          push: 0,
          output: -11,
          tone: -1,
          lowBump: 1,
          highCut: 1500,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 10, presence: -8, highCut: 1500 } },
    ],
  },
  {
    id: 'bass-nobody-plays-sixth-through-a-drum',
    name: 'Sixth through a drum',
    category: 'organ',
    description:
      'Triangles a just sixth apart through a hard driven rotating cabinet, almost all drum, and a dark triode: the fifth below each key rolls.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Coarse: 9,
        osc2Fine: -16,
        oscMix: 0.5,
        ampAttack: 0.02,
        ampRelease: 0.3,
        velToAmp: 0.4,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Dark drum',
        params: { drive: 1, balance: 0, hornDepth: 0.2, speed: 0, mix: 1 },
      },
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.45,
          push: 0,
          output: -9,
          tone: -1,
          lowBump: 0.5,
          highCut: 1200,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'bass-nobody-plays-four-octaves-of-dark',
    name: 'Four octaves of dark',
    category: 'drone',
    description:
      'Two sines a just semitone apart, held: an off-centre curve makes a floor four octaves below the key, the rub itself moving like slow water.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: -1,
        osc2Fine: -12,
        oscMix: 0.5,
        ampAttack: 1.2,
        ampRelease: 2,
        velToAmp: 0.4,
        volume: 6,
        noiseLevel: 0,
        unisonVoices: 1,
        lfo2Amount: 0,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 0, driveDb: 16, bias: 1, outputDb: -22, toneDb: -12 },
      },
      { deviceId: 'currents', preset: 'Slow water', params: { depth: 0.5, mix: 0.8 } },
    ],
  },
  {
    id: 'bass-nobody-plays-third-off-the-keyboard',
    name: 'Third off the keyboard',
    category: 'pad',
    description:
      'Sines a seven-to-six third apart, narrower than a minor one: a tube curve adds the tone two octaves and a fifth below, slowly phased.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 3,
        osc2Fine: -33,
        oscMix: 0.5,
        ampAttack: 0.3,
        ampRelease: 1.6,
        velToAmp: 0.4,
        volume: 6,
        lfo1Dest: 2,
        lfo1Rate: 0.2,
        lfo1Amount: 0.2,
        unisonVoices: 1,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 20, bias: 0.7, outputDb: -22.5, toneDb: -8 },
      },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-filter-that-adds',
    name: 'Filter that adds',
    category: 'bass',
    description:
      'Plain sines, two keys, driven inside their own lowered filter and again in a warm valve, the gap lifted and the whistles shelved down.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.02,
        ampRelease: 0.4,
        velToAmp: 0.4,
        volume: 6,
        filterSlope: 0,
        cutoff: 1600,
        filterDrive: 0.9,
        filterEnvAmount: -0.35,
        filterAttack: 0.01,
        filterDecay: 0.8,
        filterSustain: 0.9,
        keyTrack: 0,
        subLevel: 0,
        unisonVoices: 1,
        lfo1Amount: 0,
        lfo2Amount: 0,
        resonance: 0,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 1, wobble: 0, wear: 0, noise: 0, output: 0, tone: 0.15 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 10, presence: -8, highCut: 1800 } },
    ],
  },
  {
    id: 'bass-nobody-plays-triangles-in-the-stack',
    name: 'Triangles in the stack',
    category: 'bass',
    description:
      'Two triangle keys that swell into a flat-out speaker stack: the opening gap climbs as a bass, thick and close, with little room.',
    preview: GAP_OPENS,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.18,
        ampRelease: 0.5,
        velToAmp: 0.4,
        volume: 6,
        cutoff: 1400,
        filterDrive: 0,
        resonance: 0,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 1,
          bass: 0.9,
          treble: -0.8,
          distance: 0.1,
          room: 0.2,
          angle: 0.5,
          noise: 0,
          output: 5,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 380, resonance: 1 } },
    ],
  },
  {
    id: 'bass-nobody-plays-saw-with-its-ground-cut',
    name: 'Saw with its ground cut',
    category: 'bass',
    description:
      'A low saw with everything under 900 Hz cut away; a hard off-centre curve grows its own fundamental back and a steep filter keeps it.',
    preview: OWN_FLOOR,
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 0,
        osc2Shape: 0,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.02,
        ampRelease: 0.3,
        velToAmp: 0.4,
        volume: 4,
        filterType: 1,
        filterSlope: 1,
        cutoff: 900,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 20, bias: 0.9, outputDb: 0.5, toneDb: -6 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 210 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'bass-nobody-plays-heard-from-upstairs',
    name: 'Heard from upstairs',
    category: 'drone',
    description:
      'Pulses of drifting width, high-passed and swept slowly, whose missing low notes a triode puts back, as through a floor, with spring.',
    preview: OWN_FLOOR,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: {
        osc1Shape: 1,
        osc2Shape: 1,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.4,
        ampRelease: 1.5,
        velToAmp: 0.4,
        volume: 0,
        osc1Pw: 0.3,
        filterType: 1,
        filterSlope: 1,
        cutoff: 650,
        lfo1Dest: 1,
        lfo1Rate: 0.2,
        lfo1Amount: 0.12,
        lfo2Dest: 4,
        lfo2Rate: 0.3,
        lfo2Amount: 0.3,
        unisonVoices: 1,
        unisonDetune: 3,
        filterEnvAmount: 0,
        resonance: 0,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.6, push: 0, output: 2, tone: -1, lowBump: 1, highCut: 1200 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 8, presence: -10, highCut: 1000 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-draught-with-a-pitch',
    name: 'Draught with a pitch',
    category: 'texture',
    description:
      'Sine keys in a band of noise into a biased tape curve; the roots of their thirds come up through a large stopped pipe.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.3,
        ampRelease: 1.2,
        velToAmp: 0.4,
        volume: 4.5,
        noiseLevel: 0.2,
        filterSlope: 0,
        cutoff: 700,
        filterType: 2,
        resonance: 0,
        filterEnvAmount: 0.1,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 3, driveDb: 16, bias: 0.9, outputDb: -24, toneDb: -8 },
      },
      {
        deviceId: 'vessel',
        params: { body: 2, size: 2.2, material: 0.2, air: 0.4, tone: 0.2, mix: 0.4 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-gates-before-the-drive',
    name: 'Gates before the drive',
    category: 'texture',
    description:
      'Three keys of sine chopped by two drifting soft gates ahead of a dark triode, so the low root comes in throbs between the whistles.',
    preview: EIGHT_NINE_TEN,
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.1,
        ampRelease: 0.8,
        velToAmp: 0.4,
        volume: 6,
        subLevel: 0,
        voiceMode: 0,
        glide: 0,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        preset: 'Soft throb',
        params: { rate: 3, drift: 0.3, apart: 0, shade: 0, floor: 0.3 },
      },
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.65,
          push: 0,
          output: -9,
          tone: -0.9,
          lowBump: 0.6,
          highCut: 2000,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 7, presence: -4 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-swaying-pair-long-hall',
    name: 'Swaying pair, long hall',
    category: 'pad',
    description:
      'Triangles a fourth apart that sway together slowly; the note two octaves under their top bends with them in a low cathedral.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Coarse: 5,
        osc2Fine: -2,
        oscMix: 0.5,
        ampAttack: 0.6,
        ampRelease: 2.2,
        velToAmp: 0.4,
        volume: 6,
        lfo1Dest: 0,
        lfo1Rate: 0.6,
        lfo1Amount: 0.006,
        unisonVoices: 2,
        unisonDetune: 3,
        unisonSpread: 0.2,
        lfo2Amount: 0,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 0, driveDb: 14, bias: 1, outputDb: -20, toneDb: -12 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.45 } },
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-overlap-that-breathes',
    name: 'Overlap that breathes',
    category: 'drone',
    description:
      'Pure sines in a little air, opened and closed by a slow breath ahead of the drive: the low note swells later and leaves sooner than they do.',
    preview: APART_THEN_BOTH,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 0,
        osc2Fine: 0,
        oscMix: 0,
        ampAttack: 0.15,
        ampRelease: 1.4,
        velToAmp: 0.4,
        volume: 4.5,
        noiseLevel: 0.03,
        unisonVoices: 1,
        lfo2Amount: 0,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: {
          in: 1.2,
          out: 1.6,
          hold: 0.2,
          rest: 0.2,
          air: 0,
          depth: 0.6,
          colour: 0,
          width: 0,
        },
      },
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 20, bias: 0.8, outputDb: -24, toneDb: -11 },
      },
      { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-lands-with-company-below',
    name: 'Lands with company below',
    category: 'keys',
    description:
      'Reversed piano keys that swell for a second and land; as they meet, a tube curve tilted dark has their gap land with them, close.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: {
        swell: 0.9,
        tail: 0.35,
        snap: 0.3,
        ghost: 0,
        wobble: 0,
        shimmer: 0,
        width: 0,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 10, outputGain: 0 } },
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 14, bias: 0.8, outputDb: -19.5, toneDb: -12 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-bowls-gather-a-root',
    name: 'Bowls gather a root',
    category: 'drone',
    description:
      'Reversed bowls gathering for two seconds, ring left on, into an off-centre soft curve and a dim slow cathedral: D is under all three.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: {
        swell: 1.8,
        tail: 1,
        rise: 0.4,
        ghost: 0.2,
        shimmer: 0,
        wobble: 0,
        width: 0.1,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 12, outputGain: 0 } },
      {
        deviceId: 'saturator',
        params: { curve: 0, driveDb: 12, bias: 1, outputDb: -23.5, toneDb: -12 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.4, damping: 0.8 } },
    ],
  },
  {
    id: 'bass-nobody-plays-plucked-from-underneath',
    name: 'Plucked from underneath',
    category: 'plucked',
    description:
      'Plucked fifths turned round, half a second each, on a folded curve: the octave under them jumps up and stops, with bouncing echoes.',
    preview: PURE_FIFTHS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: {
        swell: 0.5,
        tail: 0.5,
        snap: 0.5,
        rise: 0.3,
        ghost: 0,
        wobble: 0,
        shimmer: 0,
        width: 0,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 12, outputGain: 0 } },
      { deviceId: 'saturator', params: { curve: 4, driveDb: 12, bias: 0.85, outputDb: -12 } },
      { deviceId: 'skipping-stone', preset: 'Nearly dry', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-thirds-from-their-end',
    name: 'Thirds from their end',
    category: 'bell',
    description:
      'Reversed bells in pure thirds into a biased tube curve tilted dark, the roots blooming just before each strike, faintly reflected.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: {
        swell: 1,
        tail: 0.4,
        rise: 0.5,
        tone: 0.1,
        ghost: 0.1,
        wobble: 0,
        shimmer: 0,
        width: 0,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 14, outputGain: -1 } },
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 16, bias: 0.9, outputDb: -24, toneDb: -12 },
      },
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'bass-nobody-plays-throat-with-no-chest',
    name: 'Throat with no chest',
    category: 'voice',
    description:
      'A throat drone with all below 600 Hz cut before a triode, which grows the chest back from the gaps between its whistled partials.',
    preview: OWN_FLOOR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: {
        voice: 0,
        overtone: 8,
        breath: 0.06,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 3,
        focus: 0.6,
        wander: 0.4,
        attack: 0.12,
        release: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.6,
          push: 0,
          output: -8.5,
          lowCut: 600,
          tone: -1,
          lowBump: 0.6,
          highCut: 2500,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 9, presence: -3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-whistles-walk-it-down',
    name: 'Whistles walk it down',
    category: 'wind',
    description:
      'Two still whistles in a hot valve, one held and one climbing toward it: the bass between them walks down, dimmed, on a long plate.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: {
        voice: 0,
        overtone: 3,
        breath: 0.06,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 0,
        focus: 0.5,
        wander: 0,
        attack: 0.12,
        release: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0, wear: 0, noise: 0, output: -4, tone: 0.2 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 480 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-growl-out-growl-back',
    name: 'Growl out, growl back',
    category: 'bass',
    description:
      'A growling throat with its bottom filtered off and a warm valve at full heat after, so the rattle returns rounder than it left.',
    preview: OWN_FLOOR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: {
        voice: 0,
        overtone: 6,
        breath: 0.06,
        growl: 0.6,
        vibrato: 0,
        width: 0,
        volume: 2,
        focus: 0.5,
        wander: 0.3,
        attack: 0.08,
        release: 0.7,
      },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, slope: 1, cutoffHz: 500 } },
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 1, wobble: 0, wear: 0, noise: 0, output: -12, tone: 0.1 },
      },
      {
        deviceId: 'ambient-eq',
        params: { clear: 0, low: 10, body: 3, presence: -8, highCut: 1500 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-drone-pipe-regrown',
    name: 'Drone pipe, regrown',
    category: 'drone',
    description:
      'A drone pipe whose low end is cut at 450 Hz, a triode and a wide slow chorus on what grows back, kept below 1.4 kHz.',
    preview: OWN_FLOOR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: {
        voice: 1,
        overtone: 5,
        breath: 0.06,
        growl: 0.2,
        vibrato: 0,
        width: 0,
        volume: 3,
        focus: 0.45,
        wander: 0.2,
        attack: 0.5,
        release: 2,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.5,
          push: 0,
          output: -9,
          lowCut: 450,
          tone: -0.8,
          highCut: 1400,
        },
      },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.45 } },
      { deviceId: 'lift', preset: 'Warm floor', params: { focus: -1, amount: 0.6 } },
    ],
  },
  {
    id: 'bass-nobody-plays-jaw-harps-in-fifths',
    name: 'Jaw harps in fifths',
    category: 'plucked',
    description:
      'Quick jaw harps in pure fifths in a warm valve, then through a dull stack heard from its side: the octave under each pair jumps with it.',
    preview: PURE_FIFTHS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Jaw harp',
      params: {
        voice: 2,
        overtone: 3,
        breath: 0,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 2,
        focus: 0.3,
        wander: 0.5,
        pace: 4,
        attack: 0.012,
        release: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.7, wobble: 0, wear: 0, noise: 0, output: -6, tone: 0.1 },
      },
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0.2,
          bass: 1,
          treble: -1,
          distance: 0.1,
          room: 0.3,
          angle: 1,
          noise: 0,
          output: -4,
        },
      },
      { deviceId: 'lift', preset: 'Just the ends', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'bass-nobody-plays-low-seat-left-empty',
    name: 'Low seat left empty',
    category: 'voice',
    description:
      'A slow chant on saturated tape with its lows filtered off first; the empty seat fills by itself, with low vowels answering behind.',
    preview: OWN_FLOOR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: {
        voice: 0,
        overtone: 8,
        breath: 0.06,
        growl: 0,
        vibrato: 0.1,
        width: 0,
        volume: 5,
        focus: 0.5,
        wander: 0.5,
        pace: 0.2,
        attack: 0.7,
        release: 2.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 500 } },
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0.1,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0,
          speed: 2,
          age: 0.1,
          output: -9.5,
        },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bass-nobody-plays-two-breaths-make-a-third',
    name: 'Two breaths make a third',
    category: 'wind',
    description:
      'Breathy pipes 110 Hz apart into a hot valve: air alone until they overlap, then a low hum, all of it set back across a room.',
    preview: APART_THEN_BOTH,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: {
        voice: 1,
        overtone: 3,
        breath: 0.5,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 3,
        focus: 0.2,
        wander: 0.2,
        attack: 0.3,
        release: 1,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.95, wobble: 0, wear: 0, noise: 0, output: -11.5, tone: 0 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 10, presence: -6 } },
      { deviceId: 'distance', preset: 'Across the room', params: { distance: 0.35, wander: 0 } },
    ],
  },
  {
    id: 'bass-nobody-plays-bird-and-bedrock',
    name: 'Bird and bedrock',
    category: 'texture',
    description:
      'High pipes in pure thirds whose whistles hop about, in a hot triode: the root two octaves down keeps its place, behind a small spring.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'overtone',
      preset: 'High whistle',
      params: {
        voice: 1,
        overtone: 6,
        breath: 0.06,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 0,
        focus: 0.6,
        wander: 0.7,
        pace: 2,
        attack: 0.1,
        release: 1,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.65,
          push: 0,
          output: -9,
          tone: -0.6,
          lowBump: 0.4,
          highCut: 5000,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 9, presence: -4 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-vowels-on-a-ghost-step',
    name: 'Vowels on a ghost step',
    category: 'voice',
    description:
      'Open vowels in pure thirds through a hot valve; the roots under them surface two octaves down and the vowels roll past in a chapel.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: {
        voice: 0,
        overtone: 4,
        breath: 0.15,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 2,
        focus: 0.1,
        wander: 0.8,
        attack: 0.3,
        release: 1.2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.8, wobble: 0, wear: 0, noise: 0, output: -12, tone: 0 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 12, presence: -12, highCut: 1300 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-reeds-over-one-hole',
    name: 'Reeds over one hole',
    category: 'drone',
    description:
      'Reeds that walk down above a gap that does not move, joined in a pushed combo speaker off its axis, low-passed, under a dark echo.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: {
        voice: 2,
        overtone: 3,
        breath: 0.06,
        growl: 0.1,
        vibrato: 0,
        width: 0,
        volume: 0,
        focus: 0.2,
        wander: 0.2,
        attack: 0.2,
        release: 1.2,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 1,
          drive: 0.8,
          bass: 1,
          treble: -1,
          distance: 0.2,
          room: 0.3,
          angle: 1,
          noise: 0,
          output: 7,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 420 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-quick-steps-fixed-d',
    name: 'Quick steps, fixed D',
    category: 'bass',
    description:
      'Quick whistled steps and a copy lifted by 73.4 Hz into a dark triode: whatever the steps do, a low D keeps under them.',
    preview: ONE_KEY_EACH,
    instrument: {
      deviceId: 'overtone',
      preset: 'Quick steps',
      params: {
        voice: 0,
        overtone: 3,
        breath: 0.06,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 3,
        focus: 0.4,
        wander: 0.6,
        pace: 3,
        attack: 0.05,
        release: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: {
          shift: 73.4,
          fine: 0,
          mode: 0,
          feedback: 0,
          lfoDepth: 0,
          width: 0,
          mix: 0.5,
          tone: 16000,
        },
      },
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.55,
          push: 0,
          output: 0,
          tone: -1,
          lowBump: 1,
          highCut: 1500,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 240, resonance: 1 } },
    ],
  },
  {
    id: 'bass-nobody-plays-three-throats-one-floor',
    name: 'Three throats, one floor',
    category: 'drone',
    description:
      'Deep voices on four, five and six of one low D, driven together, then smeared below 700 Hz while they hold.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Deep chant',
      params: {
        voice: 0,
        overtone: 4,
        breath: 0.06,
        growl: 0.1,
        vibrato: 0,
        width: 0,
        volume: 1,
        focus: 0.2,
        wander: 0.2,
        attack: 0.6,
        release: 2,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.45,
          push: 0,
          output: -11,
          tone: -0.9,
          lowBump: 0.4,
          highCut: 2000,
        },
      },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { highCut: 700, mix: 0.7 } },
    ],
  },
  {
    id: 'bass-nobody-plays-air-between-whistles',
    name: 'Air between whistles',
    category: 'texture',
    description:
      'Windy whistles on close partials into a tape curve off centre; the root of each trio comes up through the wind, gusts moving over it.',
    preview: EIGHT_NINE_TEN,
    instrument: {
      deviceId: 'overtone',
      preset: 'Air whistle',
      params: {
        voice: 1,
        overtone: 3,
        breath: 0.7,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 4,
        focus: 0.3,
        wander: 0.2,
        attack: 0.25,
        release: 1,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 3, driveDb: 14, bias: 1, outputDb: -21, toneDb: -10 },
      },
      { deviceId: 'weather', preset: 'Dry gusts', params: { exposure: 0.4, mix: 0.8 } },
    ],
  },
  {
    id: 'bass-nobody-plays-absent-octaves',
    name: 'Absent octaves',
    category: 'organ',
    description:
      'Reedy pipes in pure fifths through a slow cabinet with a hot drum, filtered to 220 Hz: the octave below each lower note fills it.',
    preview: PURE_FIFTHS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Wide chord',
      params: {
        voice: 1,
        overtone: 4,
        breath: 0.06,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 6,
        focus: 0.3,
        wander: 0.1,
        attack: 0.1,
        release: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Heavy rotors',
        params: { speed: 0, drive: 1, balance: 0.1, hornDepth: 0.2, mix: 1 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 220 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-lips-around-a-low-gap',
    name: 'Lips around a low gap',
    category: 'bass',
    description:
      'Buzzed lips on two keys drawing apart, folded over and low-passed, so the climbing gap speaks like a tuba nobody is holding.',
    preview: GAP_OPENS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Lip buzz',
      params: {
        voice: 1,
        overtone: 3,
        breath: 0.1,
        growl: 0.15,
        vibrato: 0,
        width: 0,
        volume: 3,
        focus: 0.3,
        wander: 0,
        attack: 0.06,
        release: 0.4,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 4, driveDb: 12, bias: 0.9, outputDb: -24, toneDb: -12 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-glass-partial-hidden-c',
    name: 'Glass partial, hidden C',
    category: 'bell',
    description:
      'Glassy reed partials that take a while to open, on a softly driven triode with the top rolled off, then let ring in tuned strings on C.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: {
        voice: 2,
        overtone: 3,
        breath: 0.06,
        growl: 0,
        vibrato: 0.05,
        width: 0,
        volume: 0,
        focus: 0.4,
        wander: 0,
        attack: 0.4,
        release: 2,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.4, push: 0, output: 4.5, tone: -0.7, highCut: 3000 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 400 } },
      { deviceId: 'sympathetic', preset: 'Glass harp', params: { root: 0, mix: 0.35 } },
    ],
  },
  {
    id: 'bass-nobody-plays-pipes-on-falling-stairs',
    name: 'Pipes on falling stairs',
    category: 'bass',
    description:
      'Level pipes whose gap falls step by step, joined in a hot valve and closed down to 360 Hz, left going round on a clean tape loop.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: {
        voice: 1,
        overtone: 3,
        breath: 0.15,
        growl: 0,
        vibrato: 0,
        width: 0,
        volume: 2,
        focus: 0,
        wander: 0,
        attack: 0.12,
        release: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.95, wobble: 0, wear: 0, noise: 0, output: 0, tone: 0.1 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 360 } },
      { deviceId: 'tape-loop', preset: 'Clean layers', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-low-d-under-any-key',
    name: 'Low D under any key',
    category: 'bass',
    description:
      'Each key is two bare tones 36.7 Hz apart; a hard off-centre curve makes that a low D, the same under every key; hot tape gives it an octave.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'binaural',
      params: { beat: 36.71, ears: 0, warmth: 0, attack: 0.05, release: 0.6, bed: 0, volume: 0 },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 12, bias: 0.9, outputDb: 3, toneDb: -8 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 240 } },
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0.6,
          speed: 0,
          age: 0,
          output: -12,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-cellar-c-upstairs-keys',
    name: 'Cellar C, upstairs keys',
    category: 'drone',
    description:
      'Pairs 32.7 Hz apart, warm at the top, in a triode and then hot tape: a C two floors under whatever is held, in a narrow dark cellar.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'binaural',
      params: { beat: 32.7, ears: 0, warmth: 0.35, attack: 0.8, release: 2.5, bed: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.6, push: 0, output: 0, tone: -1, lowBump: 1, highCut: 1500 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 12, presence: -8, highCut: 1500 } },
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0.3,
          speed: 1,
          age: 0,
          output: -10.5,
        },
      },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-lowest-a-hardly-heard',
    name: 'Lowest A, hardly heard',
    category: 'drone',
    description:
      'Pairs 27.5 Hz apart with much warmth in a triode, then cassette run hot: more a shudder than a note, its octave heard as an A.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'binaural',
      params: { beat: 27.5, ears: 0, warmth: 0.8, attack: 0.4, release: 1.6, bed: 0, volume: 0 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.7, push: 0, output: 0, tone: -1, lowBump: 1, highCut: 2500 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 9, body: 3, presence: -6 } },
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0.5,
          speed: 3,
          age: 0,
          output: -9,
        },
      },
      { deviceId: 'around', preset: 'Barely moving' },
    ],
  },
  {
    id: 'bass-nobody-plays-rungs-that-whirr',
    name: 'Rungs that whirr',
    category: 'organ',
    description:
      'Crossing pairs eight hertz wide in pure fifths, through a warm valve and fast rotors: the octave below whirrs with them.',
    preview: PURE_FIFTHS,
    instrument: {
      deviceId: 'binaural',
      preset: 'Eight a second',
      params: {
        beat: 8,
        ears: 0,
        warmth: 0.25,
        attack: 0.1,
        release: 0.8,
        bed: 0,
        volume: 2,
        layout: 1,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.95, wobble: 0, wear: 0, noise: 0, output: -11, tone: 0.2 },
      },
      { deviceId: 'rotary', preset: 'Growl', params: { drive: 0.5, balance: 0.3, mix: 1 } },
    ],
  },
  {
    id: 'bass-nobody-plays-turns-every-two-seconds',
    name: 'Turns every two seconds',
    category: 'bass',
    description:
      'Two keys, each a pair half a hertz wide, in a triode: the bass they make leans in and out once in two seconds and is rolled off low.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'binaural',
      preset: 'Near unison',
      params: { beat: 0.5, ears: 0, warmth: 0, attack: 0.15, release: 0.8, bed: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.5,
          push: 0,
          output: 6,
          tone: -1,
          lowBump: 0.8,
          highCut: 1500,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 260 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-once-a-second-on-d',
    name: 'Once a second on D',
    category: 'drone',
    description:
      'Softly warm pairs one hertz wide walking down over a steady gap, in a valve and on slow tape; the floor turns once a second and stays.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'binaural',
      preset: 'Slow turn',
      params: { beat: 1, ears: 0, warmth: 0.2, attack: 0.3, release: 1.2, bed: 0, volume: 6 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.95, wobble: 0, wear: 0, noise: 0, output: -6, tone: 0.1 },
      },
      {
        deviceId: 'tape',
        params: {
          drive: 0.4,
          wow: 0.2,
          flutter: 0,
          hiss: 0.05,
          bump: 1,
          tone: 0,
          speed: 2,
          age: 0.2,
          output: -11.5,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 12, presence: -12, highCut: 1200 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-six-a-second-descent',
    name: 'Six-a-second descent',
    category: 'bass',
    description:
      'Pairs six hertz wide, partly split between the ears, make a falling bass that trembles at their rate, in a dark echo off a triode.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'binaural',
      params: { beat: 6, ears: 0.3, warmth: 0.1, attack: 0.06, release: 0.5, bed: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.6,
          push: 0,
          output: -5,
          tone: -0.9,
          lowBump: 0.6,
          highCut: 1800,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 8, presence: -6 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 520, mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-crossing-pairs-on-one-d',
    name: 'Crossing pairs on one D',
    category: 'drone',
    description:
      'Slowly crossing pairs on four, five and six of a low D, folded so that the root comes out over them, in a vast hollow of slow echoes.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'binaural',
      preset: 'Slow cross',
      params: {
        beat: 2,
        ears: 0,
        warmth: 0.3,
        attack: 0.8,
        release: 2.5,
        bed: 0,
        volume: 6,
        layout: 1,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 4, driveDb: 14, bias: 0.85, outputDb: -20.5, toneDb: -12 },
      },
      { deviceId: 'swarm-reverb', preset: 'Vast hollow', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bass-nobody-plays-gap-through-a-brown-bed',
    name: 'Gap through a brown bed',
    category: 'texture',
    description:
      'Fifths of pairs over a bed of brown noise in a warm valve; the octave below pushes up through it and the quiet there is slowly turned up.',
    preview: PURE_FIFTHS,
    instrument: {
      deviceId: 'binaural',
      preset: 'Brown bed, slow',
      params: {
        beat: 3,
        ears: 0,
        warmth: 0.1,
        attack: 0.3,
        release: 1.2,
        bed: 0.35,
        volume: 0,
        colour: 0.9,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.8, wobble: 0, wear: 0.1, noise: 0, output: -5.5, tone: 0.2 },
      },
      { deviceId: 'reveal', preset: 'Slow bloom', params: { amount: 0.7, focus: -0.8 } },
    ],
  },
  {
    id: 'bass-nobody-plays-d-sinking-to-a',
    name: 'D sinking to A',
    category: 'drone',
    description:
      'Pairs that draw together while held, from 36.7 Hz apart to 27.5: the made bass sinks a fourth in eight seconds under a still key.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'binaural',
      params: {
        beat: 36.71,
        ears: 0,
        warmth: 0,
        attack: 0.2,
        release: 1,
        bed: 0,
        volume: 4,
        target: 27.5,
        glide: 0.13,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 14, bias: 1, outputDb: 3, toneDb: -10 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 320 } },
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0.5,
          speed: 1,
          age: 0,
          output: -12,
        },
      },
      { deviceId: 'fog', preset: 'Wide drone', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'bass-nobody-plays-fifth-from-under-the-g',
    name: 'Fifth from under the G',
    category: 'drone',
    description:
      'A pair opening from 24.5 to 36.7 Hz apart while a key is held, so a lowest G climbs to D out of a triode, into a slow tape loop.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'binaural',
      params: {
        beat: 24.5,
        ears: 0,
        warmth: 0.15,
        attack: 0.5,
        release: 1.5,
        bed: 0,
        volume: 6,
        target: 36.71,
        glide: 0.12,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.8,
          push: 0,
          output: -7.5,
          tone: -1,
          lowBump: 1,
          highCut: 1400,
        },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 10, presence: -10, highCut: 1200 } },
      { deviceId: 'tape-loop', preset: 'Two decks', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-one-tone-to-an-ear',
    name: 'One tone to an ear',
    category: 'bass',
    description:
      'One tone in each ear, 32.7 Hz apart, folded to mono before a triode: the low C that was only in the head is put in the air, on tape.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'binaural',
      params: { beat: 32.7, ears: 1, warmth: 0, attack: 0.06, release: 0.5, bed: 0, volume: 3 },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Mono' },
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.55,
          push: 0,
          output: 0,
          tone: -1,
          lowBump: 1,
          highCut: 1000,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 210 } },
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 0.5,
          tone: 0.5,
          speed: 0,
          age: 0,
          output: -5,
        },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-ranks-over-a-pit',
    name: 'Ranks over a pit',
    category: 'organ',
    description:
      'Warm ranks slightly detuned, in pure fourths, through a close dull speaker stack, then half under water; the bass falls in fifths.',
    preview: PURE_FOURTHS,
    instrument: {
      deviceId: 'binaural',
      preset: 'Detuned rank',
      params: { beat: 1.5, ears: 0, warmth: 0.5, attack: 0.1, release: 0.4, bed: 0, volume: -2 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 1,
          bass: 1,
          treble: -1,
          distance: 0,
          room: 0.2,
          angle: 1,
          noise: 0,
          output: 0,
        },
      },
      {
        deviceId: 'underwater',
        preset: 'Just under',
        params: { bubbles: 0, depth: 0.4, mix: 0.85 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-roots-with-a-blur',
    name: 'Roots with a blur',
    category: 'bell',
    description:
      'Struck pairs seven hertz wide in pure thirds with long releases, in a warm valve; the roots ring under them with a seven-a-second blur.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'binaural',
      preset: 'Bars seven apart',
      params: { beat: 7, ears: 0, warmth: 0.4, attack: 0.02, release: 2.2, bed: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0, wear: 0, noise: 0, output: -8, tone: 0.3 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 9, presence: -3 } },
      { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-mostly-in-the-head',
    name: 'Mostly in the head',
    category: 'pad',
    description:
      'Wide pairs two hertz apart, part of each tone kept to its own ear, so the gap in the triode is thin and the rest circles in the head.',
    preview: APART_THEN_BOTH,
    instrument: {
      deviceId: 'binaural',
      preset: 'Two a second',
      params: { beat: 2, ears: 0.5, warmth: 0.3, attack: 0.3, release: 1.4, bed: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 3, drive: 0.5, push: 0, output: -4, tone: -0.6, highCut: 3000 },
      },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 9 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bass-nobody-plays-almost-a-single-note',
    name: 'Almost a single note',
    category: 'bass',
    description:
      'Nearly beatless pairs, one held and one drawing away from it, leaning on a valve, the opening gap let through a fat low filter.',
    preview: GAP_OPENS,
    instrument: {
      deviceId: 'binaural',
      preset: 'Near unison',
      params: { beat: 0.5, ears: 0, warmth: 0.15, attack: 0.12, release: 0.6, bed: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.85, wobble: 0, wear: 0, noise: 0, output: 0, tone: 0.2 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 230, resonance: 1.6 } },
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-bass-that-visits-zero',
    name: 'Bass that visits zero',
    category: 'bass',
    description:
      'A slow sine sweeps two semitones each side of a held key; folded, their distance is a bass that slides to nothing and climbs out again.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'still-point',
      params: {
        time: 7,
        reach: 2,
        level: 0.8,
        ears: 0,
        warmth: 0,
        attack: 0.1,
        release: 0.8,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 4, driveDb: 10, bias: 0.85, outputDb: -12 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-thirds-swallowed-whole',
    name: 'Thirds swallowed whole',
    category: 'drone',
    description:
      'A sine reaching a major third each way through warm keys, in a valve at full heat and low-passed: a low glide under them, in first frost.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'still-point',
      preset: 'Third each side',
      params: {
        time: 9,
        reach: 4,
        level: 0.7,
        ears: 0,
        warmth: 0.25,
        attack: 0.4,
        release: 1.6,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 1, wobble: 0, wear: 0, noise: 0, output: -4, tone: 0.1 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 520 } },
      { deviceId: 'seasons', preset: 'First frost', params: { turn: 0, mix: 0.4 } },
    ],
  },
  {
    id: 'bass-nobody-plays-still-keys-stiff-floor',
    name: 'Still keys, stiff floor',
    category: 'bass',
    description:
      'Two plain still keys with the sweep turned off, leaning on a hot valve, and only what falls under 330 Hz let out, into a chamber.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Near unison',
      params: {
        time: 120,
        reach: 0.1,
        level: 0,
        ears: 0,
        warmth: 0,
        attack: 0.06,
        release: 0.5,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.85, wobble: 0, wear: 0, noise: 0, output: 0, tone: 0 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 330, resonance: 0.9 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-stack-in-the-stairwell',
    name: 'Stack in the stairwell',
    category: 'bass',
    description:
      'Warm keys through a flat-out stack turned aside and gently low-passed, then heard from some way down a stone stairwell.',
    preview: FALLING_FOUR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Full short tones',
      params: {
        time: 8,
        reach: 0.2,
        level: 0.15,
        ears: 0,
        warmth: 0.8,
        attack: 0.04,
        release: 0.5,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Stack flat out',
        params: { bass: 1, treble: -1, angle: 0.7, noise: 0, output: 7 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 420 } },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.45, wander: 0 } },
    ],
  },
  {
    id: 'bass-nobody-plays-d-through-a-sieve',
    name: 'D through a sieve',
    category: 'drone',
    description:
      'Four, five and six of a low D on hot tape, then a filter that passes only the D of every octave below 330 Hz and rings on it.',
    preview: D_FLOOR,
    instrument: {
      deviceId: 'still-point',
      preset: 'Slow swell',
      params: {
        time: 30,
        reach: 0.1,
        level: 0,
        ears: 0,
        warmth: 0.1,
        attack: 0.8,
        release: 3,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 1,
          wow: 0,
          flutter: 0,
          hiss: 0,
          bump: 1,
          tone: 0.1,
          speed: 0,
          age: 0,
          output: -2,
        },
      },
      {
        deviceId: 'scale-filter',
        params: { root: 2, scale: 0, chord: 3, ring: 1.2, depth: 30, low: 40, high: 330, mix: 1 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-warm-fourths-on-a-wheel',
    name: 'Warm fourths on a wheel',
    category: 'organ',
    description:
      'Even warm tones in pure fourths through a valve and a slow cabinet heard at its drum; the bass falls by fifths in it, dull and round.',
    preview: PURE_FOURTHS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Even match',
      params: {
        time: 12,
        reach: 0.1,
        level: 0,
        ears: 0,
        warmth: 0.5,
        attack: 0.08,
        release: 0.5,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.95, wobble: 0, wear: 0, noise: 0, output: -6, tone: 0 },
      },
      {
        deviceId: 'rotary',
        preset: 'Heavy rotors',
        params: { speed: 0, drive: 0.5, balance: 0, mix: 1, hornDepth: 0.1 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 290 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'bass-nobody-plays-wavering-under-fourths',
    name: 'Wavering under fourths',
    category: 'pad',
    description:
      'Pure fourths with a faint slow beat in each key, in a valve, low-passed, in fog; the bass that falls under them leans in and out of tune.',
    preview: PURE_FOURTHS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Faint slow beat',
      params: {
        time: 20,
        reach: 0.15,
        level: 0.15,
        ears: 0,
        warmth: 0.3,
        attack: 0.4,
        release: 1.6,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0, wear: 0, noise: 0, output: 0, tone: 0.1 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 180 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'bass-nobody-plays-split-then-brought-home',
    name: 'Split, then brought home',
    category: 'bass',
    description:
      'Keys in one ear and their sweeping sine in the other, folded to mono and biased hard, so the glide that was apart is one bass.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'still-point',
      preset: 'Split and pure',
      params: {
        time: 6,
        reach: 3,
        level: 1,
        ears: 1,
        warmth: 0,
        attack: 0.05,
        release: 0.4,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'stereo-widener', preset: 'Mono' },
      {
        deviceId: 'saturator',
        params: { curve: 1, driveDb: 12, bias: 0.9, outputDb: -23.5, toneDb: -12 },
      },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bass-nobody-plays-third-tone-on-the-quay',
    name: 'Third tone on the quay',
    category: 'texture',
    description:
      'Pure thirds of softly swelling keys in a wobbling valve, open water moving over them, with their roots come up two octaves under.',
    preview: PURE_THIRDS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Soft bloom',
      params: {
        time: 40,
        reach: 0.15,
        level: 0.1,
        ears: 0,
        warmth: 0.2,
        attack: 0.35,
        release: 1.6,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0.35, wear: 0, noise: 0, output: -10, tone: 0 },
      },
      { deviceId: 'weather', preset: 'Far shore', params: { exposure: 0.3, mix: 0.8 } },
      { deviceId: 'ambient-eq', params: { clear: 0, low: 12, presence: -12, highCut: 1200 } },
    ],
  },
  {
    id: 'bass-nobody-plays-root-of-three-redrawn',
    name: 'Root of three, redrawn',
    category: 'drone',
    description:
      'Partials eight, nine and ten on pure keys in a triode, the two strongest lines of it redrawn as sines that fade in behind and linger.',
    preview: EIGHT_NINE_TEN,
    instrument: {
      deviceId: 'still-point',
      preset: 'Pure crossing',
      params: {
        time: 60,
        reach: 0.1,
        level: 0.05,
        ears: 0,
        warmth: 0,
        attack: 0.12,
        release: 0.8,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.6,
          push: 0,
          output: -7,
          tone: -1,
          lowBump: 1,
          highCut: 1000,
        },
      },
      {
        deviceId: 'sine-shadow',
        preset: 'One sine',
        params: { partials: 2, attack: 200, release: 2.5, mix: 0.6, tone: 0 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bass-nobody-plays-pedal-without-a-foot',
    name: 'Pedal without a foot',
    category: 'organ',
    description:
      'Tones stepping down in pairs through a dull stack, what they share held on, in a larger body: the pedal is only in the overlap.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'still-point',
      preset: 'Half minute pass',
      params: {
        time: 30,
        reach: 0.1,
        level: 0.1,
        ears: 0,
        warmth: 0.15,
        attack: 0.12,
        release: 0.7,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0.9,
          bass: 1,
          treble: -1,
          distance: 0,
          room: 0.1,
          angle: 1,
          noise: 0,
          output: -5.5,
        },
      },
      { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.6 } },
      { deviceId: 'size', preset: 'A shade larger', params: { mix: 1, tone: -0.6 } },
    ],
  },
  {
    id: 'bass-nobody-plays-quick-sweeps-low-swoops',
    name: 'Quick sweeps, low swoops',
    category: 'texture',
    description:
      'Fast sweeps a whole tone each way through the keys; a dull valve throws a swooping low note out of each, slapped back and lightly phased.',
    preview: KEYS_OVER,
    instrument: {
      deviceId: 'still-point',
      preset: 'Quick sweep',
      params: {
        time: 4,
        reach: 2,
        level: 0.8,
        ears: 0,
        warmth: 0,
        attack: 0.04,
        release: 0.6,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.85, wobble: 0, wear: 0, noise: 0, output: -10, tone: 0 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.25 } },
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-widening-in-the-wax',
    name: 'Widening in the wax',
    category: 'bass',
    description:
      'Two warm keys parting slowly on a worn record groove after a hot valve: the climb is in the groove, under soft crackle.',
    preview: GAP_OPENS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Warm crossing',
      params: {
        time: 40,
        reach: 0.1,
        level: 0.1,
        ears: 0,
        warmth: 0.3,
        attack: 0.12,
        release: 0.6,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 1, wobble: 0, wear: 0.1, noise: 0, output: -11.5, tone: 0.1 },
      },
      {
        deviceId: 'vinyl',
        preset: 'Dull stylus',
        params: { crackle: 0.12, pops: 0, warp: 0.1, tone: -1, mix: 1 },
      },
    ],
  },
  {
    id: 'bass-nobody-plays-long-sweep-in-stone',
    name: 'Long sweep in stone',
    category: 'drone',
    description:
      'A sine that travels nine semitones each way through the keys into a stack, low-passed: a long low glide that comes and goes, in a mine.',
    preview: ONE_LONG_KEY,
    instrument: {
      deviceId: 'still-point',
      preset: 'Octave reach',
      params: {
        time: 14,
        reach: 9,
        level: 0.8,
        ears: 0,
        warmth: 0.1,
        attack: 0.5,
        release: 2,
        volume: 5,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0.9,
          bass: 1,
          treble: -1,
          distance: 0.1,
          room: 0.1,
          angle: 1,
          noise: 0,
          output: 8,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 230 } },
      { deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bass-nobody-plays-alone-alone-together',
    name: 'Alone, alone, together',
    category: 'bass',
    description:
      'A key, its neighbour, then both at once in a hot dull valve; the low A comes only with both, caught and kept as a bed after they stop.',
    preview: APART_THEN_BOTH,
    instrument: {
      deviceId: 'still-point',
      preset: 'Short tones',
      params: {
        time: 60,
        reach: 0.1,
        level: 0.05,
        ears: 0,
        warmth: 0.1,
        attack: 0.05,
        release: 0.4,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0, wear: 0, noise: 0, output: -12, tone: 0 },
      },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bass-nobody-plays-grown-from-a-crossing',
    name: 'Grown from a crossing',
    category: 'pad',
    description:
      'Slow warm keys crossed by a near sine, in a hot stopped cabinet; their low seam is then brought up from inside, frequency by frequency.',
    preview: SAME_GAP,
    instrument: {
      deviceId: 'still-point',
      preset: 'Deep slow beat',
      params: {
        time: 25,
        reach: 0.3,
        level: 0.5,
        ears: 0,
        warmth: 0.15,
        attack: 0.5,
        release: 2,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn', params: { drive: 1, balance: 0, mix: 1 } },
      { deviceId: 'reveal', params: { amount: 1, rise: 300, focus: -1, range: 24, output: -2 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'bass-nobody-plays-low-seam-carried-off',
    name: 'Low seam carried off',
    category: 'bass',
    description:
      'Plain keys through a hot valve, the made bass coloured by a hollow tube set an octave low, while five dark bowls on C and G ring at it.',
    preview: ONE_STAYS,
    instrument: {
      deviceId: 'still-point',
      preset: 'Long tail',
      params: {
        time: 90,
        reach: 0.1,
        level: 0.05,
        ears: 0,
        warmth: 0.1,
        attack: 0.05,
        release: 1.2,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 5, drive: 0.9, wobble: 0, wear: 0, noise: 0, output: -11, tone: 0 },
      },
      {
        deviceId: 'imprint',
        preset: 'Hollow tube',
        params: { amount: 1, shift: -12, replace: 0.1 },
      },
      { deviceId: 'bowls', preset: 'Five dark bowls', params: { root: 0, scale: 4, mix: 0.35 } },
    ],
  },
]
