import { type FactoryPreset, type Phrase } from '../types'

// A full chord whose notes are let go one at a time until a single voice is left. The sounds run
// from releases that stop with the key to releases of ten seconds and more, and the chains are
// chosen for what happens to the voice that stays: raised, darkened, bent, or left in a room.

// F major ninth: F leaves, then the ninth G, then A, then C. The major seventh E is left to the
// end.
const SEVENTH_STAYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 4.5, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 5.3, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 3, note: 67, gain: 0.5 },
  ],
}

// A minor eleventh on a keyboard: A, G, E, C and D are let go, B (the ninth) rings alone, and the
// chord is struck again and empties in another order.
const NINTH_STAYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 1.4, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 0.75, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 3.3, note: 71, gain: 0.7 },
    { atSec: 3.5, durSec: 0.5, note: 45, gain: 0.45 },
    { atSec: 3.5, durSec: 0.8, note: 52, gain: 0.45 },
    { atSec: 3.5, durSec: 1.7, note: 55, gain: 0.45 },
    { atSec: 3.5, durSec: 1.9, note: 60, gain: 0.45 },
    { atSec: 3.5, durSec: 2.6, note: 62, gain: 0.45 },
    { atSec: 3.5, durSec: 3.7, note: 71, gain: 0.65 },
  ],
}

// D minor ninth shed from the top: F, E and C leave, and D and A are left as an open fifth.
const FIFTH_STAYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.1, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 6.7, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 4.6, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 3.2, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.2, note: 65, gain: 0.5 },
  ],
}

// C major ninth shed from the bottom: C, G, E, B, until the ninth D stands over nothing.
const SINKS_UPWARD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2.8, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 3.5, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 5.3, note: 71, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 74, gain: 0.5 },
  ],
}

// A wide F major ninth that has shed all but the ninth G by 3.5 s and is over by 5.2 s: room for
// a long release.
const EARLY_SHED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 41, gain: 0.5 },
    { atSec: 0, durSec: 1.5, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 3.5, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 2.8, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 5.2, note: 67, gain: 0.5 },
  ],
}

// D minor seventh, G seventh, C major seventh, F major seventh. Each keeps its seventh longest
// (C, F, B, E), and each seventh steps down into the next chord.
const SEVENTHS_STEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 50, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.15, note: 65, gain: 0.5 },
    { atSec: 0, durSec: 1.75, note: 72, gain: 0.5 },
    { atSec: 1.85, durSec: 0.5, note: 43, gain: 0.5 },
    { atSec: 1.85, durSec: 0.9, note: 55, gain: 0.5 },
    { atSec: 1.85, durSec: 1.2, note: 71, gain: 0.5 },
    { atSec: 1.85, durSec: 1.75, note: 65, gain: 0.5 },
    { atSec: 3.7, durSec: 0.5, note: 48, gain: 0.5 },
    { atSec: 3.7, durSec: 0.8, note: 55, gain: 0.5 },
    { atSec: 3.7, durSec: 1.2, note: 64, gain: 0.5 },
    { atSec: 3.7, durSec: 1.75, note: 71, gain: 0.5 },
    { atSec: 5.55, durSec: 0.5, note: 53, gain: 0.5 },
    { atSec: 5.55, durSec: 1.1, note: 57, gain: 0.5 },
    { atSec: 5.55, durSec: 0.8, note: 69, gain: 0.5 },
    { atSec: 5.55, durSec: 1.7, note: 64, gain: 0.5 },
  ],
}

// F major seventh with the raised fourth: A, F, E and C leave, and B is left, a raised fourth
// over a root that has gone.
const RAISED_FOURTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 4.8, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.3, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 6.8, note: 71, gain: 0.5 },
  ],
}

// A minor ninth shed down to its seventh, G: the bare G is still sounding when the full chord
// comes in again.
const SEAM: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 45, gain: 0.48 },
    { atSec: 0, durSec: 3.2, note: 52, gain: 0.48 },
    { atSec: 0, durSec: 2.3, note: 60, gain: 0.48 },
    { atSec: 0, durSec: 5.6, note: 67, gain: 0.48 },
    { atSec: 0, durSec: 3.9, note: 71, gain: 0.48 },
    { atSec: 5, durSec: 1.9, note: 45, gain: 0.42 },
    { atSec: 5, durSec: 2.2, note: 52, gain: 0.42 },
    { atSec: 5, durSec: 2, note: 60, gain: 0.42 },
    { atSec: 5, durSec: 1.6, note: 71, gain: 0.42 },
    { atSec: 5.65, durSec: 1.6, note: 67, gain: 0.42 },
  ],
}

// G ninth with a suspended fourth: F, G, C, then D leave, and the ninth A stays.
const SUSPENDED_NINTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 4.4, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 5, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 1, note: 65, gain: 0.5 },
    { atSec: 0, durSec: 6.9, note: 69, gain: 0.5 },
  ],
}

// A minor ninth shed from the top: G, then C, the ninth B a good while after, then E, and the low
// A last.
const ROOT_STAYS: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 5.4, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 3.8, note: 59, gain: 0.5 },
    { atSec: 0, durSec: 1.9, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 1.1, note: 67, gain: 0.5 },
  ],
}

// Struck twice: A minor ninth to its B, then F major ninth to its E. The keys come up at uneven
// times and one stays down.
const LAST_KEY: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 1.8, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 2.1, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 3.4, note: 71, gain: 0.6 },
    { atSec: 3.5, durSec: 0.4, note: 53, gain: 0.5 },
    { atSec: 3.5, durSec: 1.2, note: 57, gain: 0.5 },
    { atSec: 3.5, durSec: 2.2, note: 60, gain: 0.5 },
    { atSec: 3.5, durSec: 0.9, note: 67, gain: 0.5 },
    { atSec: 3.5, durSec: 3.3, note: 64, gain: 0.6 },
  ],
}

// For strings that die fast: A minor, F major, D minor and C major ninths over one slow inner
// hand, each shed within a second or so to its ninth (B, G, E, D). B steps to A, G to A, E is kept.
const NINTHS_IN_TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 0.8, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 0.5, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 1, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.65, note: 59, gain: 0.75 },
    { atSec: 1.8, durSec: 0.35, note: 41, gain: 0.5 },
    { atSec: 1.8, durSec: 1.1, note: 57, gain: 0.5 },
    { atSec: 1.8, durSec: 0.6, note: 60, gain: 0.5 },
    { atSec: 1.8, durSec: 0.75, note: 64, gain: 0.5 },
    { atSec: 1.8, durSec: 1.65, note: 55, gain: 0.75 },
    { atSec: 3.6, durSec: 0.3, note: 50, gain: 0.5 },
    { atSec: 3.6, durSec: 0.5, note: 57, gain: 0.5 },
    { atSec: 3.6, durSec: 0.9, note: 60, gain: 0.5 },
    { atSec: 3.6, durSec: 0.7, note: 65, gain: 0.5 },
    { atSec: 3.6, durSec: 1.7, note: 64, gain: 0.8 },
    { atSec: 5.4, durSec: 0.35, note: 48, gain: 0.45 },
    { atSec: 5.4, durSec: 0.8, note: 59, gain: 0.45 },
    { atSec: 5.4, durSec: 0.5, note: 64, gain: 0.45 },
    { atSec: 5.4, durSec: 1.1, note: 67, gain: 0.45 },
    { atSec: 5.4, durSec: 1.9, note: 62, gain: 0.8 },
  ],
}

// E left over from F major ninth (its seventh) is held on while D minor ninth comes in round it (its
// ninth) and thins in its turn.
const SAME_E: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.3, note: 53, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 57, gain: 0.5 },
    { atSec: 0, durSec: 2.9, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 1.7, note: 67, gain: 0.5 },
    { atSec: 3.6, durSec: 2.2, note: 50, gain: 0.48 },
    { atSec: 3.6, durSec: 2.9, note: 57, gain: 0.48 },
    { atSec: 3.6, durSec: 1.6, note: 60, gain: 0.48 },
    { atSec: 3.6, durSec: 0.9, note: 77, gain: 0.4 },
  ],
}

// D minor eleventh above middle C, for high voices: D, F, A and C leave, and the eleventh G stays.
const HIGH_ELEVENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 62, gain: 0.5 },
    { atSec: 0, durSec: 4.1, note: 69, gain: 0.5 },
    { atSec: 0, durSec: 4.8, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 77, gain: 0.5 },
    { atSec: 0, durSec: 6.9, note: 79, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'chord-shed-five-chairs-then-one',
    name: 'Five chairs then one',
    category: 'string',
    description:
      'Wide restless violas with the octave below, quick to speak and to stop, their lone seventh left in a small hall before it steps down.',
    preview: SEVENTHS_STEP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: {
        attack: 0.03,
        release: 0.2,
        tone: 2000,
        low: 0.5,
        ensemble: 1,
        speed: 1.8,
        drift: 0.7,
        width: 1,
      },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 25, lowDecay: 1.2, midDecay: 1.4, mix: 0.22 },
      },
    ],
  },
  {
    id: 'chord-shed-doors-shut-in-turn',
    name: 'Doors shut in turn',
    category: 'organ',
    description:
      'Organ-like saws that stop with the key, each stop caught by a short gated room that closes a moment later.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { attack: 0.01, release: 0.06, low: 0.6, high: 0.3, tone: 1500, volume: -12 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 0, time: 0.4, preDelay: 0, mix: 0.45, highCut: 5000 },
      },
    ],
  },
  {
    id: 'chord-shed-coats-off-the-hooks',
    name: 'Coats off the hooks',
    category: 'string',
    description:
      'A quick bright section leaning on a fast compressor, so the voices that stay come up to the level of the full chord, a soft echo after.',
    preview: FIFTH_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.2, release: 0.25, tone: 3000, low: 0.2, high: 0.8 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 16, outputGain: -8 } },
      { deviceId: 'tape-echo', params: { time: 300, feedback: 0.25, highCut: 3000, mix: 0.16 } },
    ],
  },
  {
    id: 'chord-shed-clipped-at-the-wrist',
    name: 'Clipped at the wrist',
    category: 'string',
    description:
      'Nearly dry saws through a filter that darkens when the chord is full and opens as it thins, so the last note is the brightest.',
    preview: RAISED_FOURTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.03, release: 0.12, tone: 5200, ensemble: 0.2, width: 0.5 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 0, outputDb: 14 } },
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 7000,
          resonance: 0.8,
          envAmount: -95,
          envAttackMs: 60,
          envReleaseMs: 700,
        },
      },
      { deviceId: 'saturator', params: { curve: 3, driveDb: 0, outputDb: -9 } },
      { deviceId: 'ether-reverb', params: { size: 0.35, decay: 1.2, mix: 0.14 } },
    ],
  },
  {
    id: 'chord-shed-low-desk-stays-on',
    name: 'Low desk stays on',
    category: 'bass',
    description:
      'A bowed bass with its lower octave full with short stops, set a few steps back in a dry room, the low root the last to leave.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { attack: 0.25, release: 0.3, tone: 700, high: 0.2 },
    },
    effects: [
      { deviceId: 'distance', params: { distance: 0.35, room: 0.35, wander: 0, decay: 0.9 } },
    ],
  },
  {
    id: 'chord-shed-empty-pews-by-ten',
    name: 'Empty pews by ten',
    category: 'string',
    description:
      'Hollow high saws let go in half a second, what they leave behind sung on by a hall shaped as an open vowel.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.6, release: 0.5, tone: 3400 },
    },
    effects: [
      { deviceId: 'vowel-reverb', params: { vowel: 0, resonance: 0.65, decay: 5, mix: 0.42 } },
    ],
  },
  {
    id: 'chord-shed-the-alto-is-kept',
    name: 'The alto is kept',
    category: 'string',
    description:
      'Muted violins over a faint low octave, the tone opened: the note that outlasts the chord is the one that begins to sway.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.4, release: 0.8, tone: 2100, low: 0.25, high: 0.6 },
    },
    effects: [
      { deviceId: 'late-vibrato', params: { wait: 2600, grow: 2000, depth: 38, rate: 4.8 } },
      { deviceId: 'plate-reverb', params: { mix: 0.16, decay: 0.45 } },
    ],
  },
  {
    id: 'chord-shed-quay-lamps-going-out',
    name: 'Quay lamps going out',
    category: 'pad',
    description:
      'Bright upper saws delayed colour by colour from the top down, so each chord also leaves by its frequencies.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -7, attack: 0.5, release: 1, tone: 7500, ensemble: 0.6, speed: 1 },
    },
    effects: [
      { deviceId: 'prism', params: { time: 1500, shape: 1, feedback: 0.35, bands: 10, mix: 0.55 } },
    ],
  },
  {
    id: 'chord-shed-half-the-row-gets-up',
    name: 'Half the row gets up',
    category: 'string',
    description:
      'Cello-octave saws opened to two and a half kilohertz and sent through a slow deep phaser that keeps moving on the single voice.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { volume: -1, attack: 0.4, release: 0.9, tone: 2600, low: 0.8, high: 0.1 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: { stages: 3, rate: 0.12, depth: 85, feedback: 55, centerHz: 600, mix: 0.55 },
      },
    ],
  },
  {
    id: 'chord-shed-quiet-by-subtraction',
    name: 'Quiet by subtraction',
    category: 'pad',
    description:
      'Wavering detuned saws under a low tone, the thin end of the chord raised as it empties so the last note stays present.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.35, release: 1, tone: 1100, drift: 0.6, width: 0.9 },
    },
    effects: [
      { deviceId: 'lift', params: { threshold: -24, amount: 0.8, rise: 1.2 } },
      { deviceId: 'ether-reverb', params: { size: 0.5, decay: 3, damping: 0.7, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-leaves-off-the-lime',
    name: 'Leaves off the lime',
    category: 'pad',
    description:
      'An ensemble with two seconds of release, small pieces of each voice caught as it goes and dropped a fourth.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.8, release: 2, tone: 2400 },
    },
    effects: [
      { deviceId: 'falling', params: { fall: -5, size: 1400, density: 3, mix: 0.5, tone: 4000 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 2, midDecay: 2.4, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-last-one-at-the-table',
    name: 'Last one at the table',
    category: 'pad',
    description:
      'High glassy saws with only three sine partials drawn behind them, so a pure tone lingers where the last voice was.',
    preview: NINTH_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.2, release: 1.8, tone: 3000, high: 0.6, low: 0.1, ensemble: 0.3 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 3, attack: 500, release: 6, tone: 0.4, mix: 0.65 },
      },
    ],
  },
  {
    id: 'chord-shed-slow-bus-home',
    name: 'Slow bus home',
    category: 'pad',
    description:
      'A wide slow ensemble dulled to a kilohertz, worn by a cassette, its short dark tail left to empty in an eight-line room.',
    preview: SAME_E,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 1.1, release: 2.6, tone: 1100 },
    },
    effects: [
      { deviceId: 'patina', params: { medium: 1, wobble: 0.55, wear: 0.5, noise: 0.2, mix: 1 } },
      { deviceId: 'fdn-reverb', params: { decay: 2.5, damping: 0.8, breathDepth: 0, mix: 0.22 } },
    ],
  },
  {
    id: 'chord-shed-rooms-going-dark',
    name: 'Rooms going dark',
    category: 'pad',
    description:
      'Low drifting saws whose filter follows their level: bright while the chord is full, closing as each voice leaves it.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 1.2, release: 2.4, tone: 4500, low: 0.5, high: 0.4, ensemble: 0.5 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 0, outputDb: 16 } },
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 150,
          resonance: 0.9,
          envAmount: 95,
          envAttackMs: 200,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'saturator', params: { curve: 3, driveDb: 0, outputDb: -12 } },
    ],
  },
  {
    id: 'chord-shed-ferry-thins-out',
    name: 'Ferry thins out',
    category: 'string',
    description:
      'A pale high ensemble that drifts band by band from side to side, with a long three-spring tank under it.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: {
        volume: -7.5,
        attack: 0.8,
        release: 2.2,
        tone: 4600,
        low: 0.1,
        high: 0.5,
        ensemble: 0.9,
        speed: 0.5,
      },
    },
    effects: [
      { deviceId: 'currents', params: { depth: 0.85, sway: 0.8, rate: 0.35, bands: 4 } },
      {
        deviceId: 'spring-reverb',
        params: { decay: 3.5, springs: 2, drip: 0.2, tone: 2600, mix: 0.3 },
      },
    ],
  },
  {
    id: 'chord-shed-held-by-one-thread',
    name: 'Held by one thread',
    category: 'pad',
    description:
      'Saws and their octave above, bright and slow, with a fifth climbing out of its tail behind the one voice that stays.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.6, release: 5, tone: 9000, ensemble: 0.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        params: { interval: 1, shimmer: 0.55, decay: 7, tone: 7000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'chord-shed-orchard-in-november',
    name: 'Orchard in November',
    category: 'pad',
    description:
      'Slow dark strings left in an unmoving autumn: crumbled, dulled and wide while the four and a half second release runs.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1.2, release: 4.5, tone: 1500 },
    },
    effects: [
      { deviceId: 'seasons', params: { year: 0.625, turn: 0, depth: 1, grit: 0.8, space: 0.6 } },
    ],
  },
  {
    id: 'chord-shed-guests-on-the-stairs',
    name: 'Guests on the stairs',
    category: 'string',
    description:
      'Quick to speak and slow to leave: five seconds of release answered by echoes that gather closer together.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.04, release: 5, tone: 5600, high: 0.6, low: 0, ensemble: 0.4 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { span: 3600, stars: 8, pattern: 4, fade: 0.3, tone: 5000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-long-word-at-the-gate',
    name: 'Long word at the gate',
    category: 'pad',
    description:
      'Hollow strings with four seconds of release, the tail sagging in pitch and darkening the longer a voice has been gone.',
    preview: SEAM,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.9, release: 4, tone: 1700, ensemble: 0.8, width: 0.9 },
    },
    effects: [{ deviceId: 'melt', params: { sag: -45, hold: 6, dim: 0.6, blur: 0.5, mix: 0.6 } }],
  },
  {
    id: 'chord-shed-mostly-air-by-morning',
    name: 'Mostly air by morning',
    category: 'pad',
    description:
      'Violas opened wide and smeared until every voice that stops has already become part of a diffuse wash.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 1.6, release: 5.5, tone: 5200, high: 0.4, width: 0.8 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        params: { blur: 0.75, smear: 0.9, lowCut: 160, highCut: 9000, mix: 0.8 },
      },
    ],
  },
  {
    id: 'chord-shed-nobody-says-it-is-last',
    name: 'Nobody says it is last',
    category: 'pad',
    description:
      'A ten second release on low and high octaves, the two halves of its spectrum leaning against each other in slow turns.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { volume: -2.5, attack: 1.6, release: 10, tone: 1900, low: 0.7, high: 0.6 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 2, rate: 0.45, depth: 0.95, crossover: 500, phase: 90 },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 3, midDecay: 3, mix: 0.15 } },
    ],
  },
  {
    id: 'chord-shed-smoke-off-a-wick',
    name: 'Smoke off a wick',
    category: 'drone',
    description:
      'Saws under a very low tone with a twelve second release, a thread of microphone air and a wide space above them.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { volume: -3, attack: 1, release: 12, tone: 420, low: 0.4 },
    },
    effects: [
      { deviceId: 'noise-floor', params: { type: 6, level: -46, movement: 0.5 } },
      { deviceId: 'expanse', params: { size: 0.8, decay: 9, highCut: 3000, mix: 0.35 } },
    ],
  },
  {
    id: 'chord-shed-nine-second-leave',
    name: 'Nine second leave',
    category: 'pad',
    description:
      'Upper saws whose releases hang nine seconds, filtered to what the chord still shares with half a second before.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: {
        attack: 0.6,
        release: 9,
        tone: 3600,
        high: 0.5,
        low: 0.2,
        ensemble: 0.4,
        speed: 0.6,
      },
    },
    effects: [
      { deviceId: 'common-tones', params: { ago: 500, strict: 0.8, ring: 0.7, mix: 0.95 } },
    ],
  },
  {
    id: 'chord-shed-field-after-the-fair',
    name: 'Field after the fair',
    category: 'pad',
    description:
      'Strongly detuned saws with an eight second release, carried off to the far shore of a field by gusts of wind.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { volume: -1.5, attack: 0.5, release: 8, tone: 3400 },
    },
    effects: [
      { deviceId: 'distance', params: { distance: 0.6, room: 0.6, wander: 0.5, decay: 3 } },
      { deviceId: 'weather', params: { kind: 0, exposure: 0.7, voice: 0.25, force: 0.5 } },
    ],
  },
  {
    id: 'chord-shed-old-reel-let-go',
    name: 'Old reel let go',
    category: 'string',
    description:
      'A slow wide ensemble on worn tape, moments of the chords already gone drifting back under the one that is thinning.',
    preview: SEVENTHS_STEP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { volume: -5, attack: 0.2, release: 1.6, tone: 2000, high: 0.2 },
    },
    effects: [
      { deviceId: 'tape', params: { speed: 3, wow: 0.6, age: 0.6, hiss: 0.15 } },
      {
        deviceId: 'echo-memory',
        params: { time: 1800, memory: 0.8, feedback: 0.15, echo: 0.4, tone: 2500, mix: 0.35 },
      },
    ],
  },
  {
    id: 'chord-shed-choir-down-to-two',
    name: 'Choir down to two',
    category: 'voice',
    description:
      'A full dark ah with half a second of release in a hall, the voices above the fifth leaving first.',
    preview: FIFTH_STAYS,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { attack: 0.5, release: 0.5, motion: 0.15, breath: 0.08, ensemble: 0.95, tone: 3600 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 40, lowDecay: 3, midDecay: 3.2, damping: 7000, mix: 0.3 },
      },
    ],
  },
  {
    id: 'chord-shed-monks-leave-by-rank',
    name: 'Monks leave by rank',
    category: 'voice',
    description:
      'Low oh voices with a short release in a wide stone space, its tail swelling in after each rank goes.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { attack: 0.6, release: 0.8, tone: 4600 },
    },
    effects: [
      {
        deviceId: 'expanse',
        params: { size: 0.7, decay: 7, gravity: 0.6, highCut: 3500, mix: 0.45 },
      },
    ],
  },
  {
    id: 'chord-shed-boys-go-home-first',
    name: 'Boys go home first',
    category: 'voice',
    description:
      'Small clear oohs with no vibrato and a quick stop, the sides pressed narrow and a bright plate behind.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.2, release: 0.25, vibrato: 0, ensemble: 0.4 },
    },
    effects: [
      { deviceId: 'stereo-widener', params: { width: 0.25 } },
      { deviceId: 'plate-reverb', params: { decay: 0.6, damping: 0.1, mix: 0.25 } },
    ],
  },
  {
    id: 'chord-shed-breath-outlasts-vowel',
    name: 'Breath outlasts vowel',
    category: 'voice',
    description:
      'Nearly unvoiced singing, its air turned up and scattered wide and its tones down, six seconds leaving each note.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 1.2, release: 6, breath: 0.85 },
    },
    effects: [
      { deviceId: 'sift', params: { tones: -9, attacks: -12, air: 6, scatter: 1, hold: 0.5 } },
    ],
  },
  {
    id: 'chord-shed-one-hum-under-the-rest',
    name: 'One hum under the rest',
    category: 'voice',
    description:
      'A closed hum opened to a kilohertz and a half, with an octave below drawn in under whichever voices are left.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'choir',
      preset: 'Humming',
      params: { attack: 0.4, release: 1.4, tone: 1500, voice: 1.1 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.7, up1: 0, dry: 0.8, attack: 0.6 } },
      { deviceId: 'plate-reverb', params: { decay: 0.4, damping: 0.7, mix: 0.12 } },
    ],
  },
  {
    id: 'chord-shed-alto-in-an-empty-nave',
    name: 'Alto in an empty nave',
    category: 'voice',
    description:
      'Singers on eh with two and a half seconds of release, late and dark in a large comb reverb.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { volume: -17.5, attack: 0.9, release: 2.5, vowel: 0.3 },
    },
    effects: [
      {
        deviceId: 'ether-reverb',
        params: { size: 0.95, decay: 9, damping: 0.75, predelayMs: 110, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-rehearsal-lets-out',
    name: 'Rehearsal lets out',
    category: 'voice',
    description:
      'Short sung ehs through a small loudspeaker at the far end of a room, every stop heard in the walls and not in the voice.',
    preview: SEVENTHS_STEP,
    instrument: {
      deviceId: 'choir',
      preset: 'Short ah',
      params: { attack: 0.03, release: 0.2, breath: 0.2, vowel: 0.2 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 0, drive: 0.2, distance: 0.8, room: 0.8, noise: 0 },
      },
    ],
  },
  {
    id: 'chord-shed-soloist-by-default',
    name: 'Soloist by default',
    category: 'voice',
    description:
      'One or two singers to a note, wide in vibrato, driven into a fast limiter, so the one left is as loud as all of them were.',
    preview: SAME_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { attack: 0.35, release: 1.1, vibrato: 24, ensemble: 0.2 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -10 } },
      { deviceId: 'spring-reverb', params: { decay: 2.5, springs: 0, drip: 0.1, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-ee-under-dust',
    name: 'Ee under dust',
    category: 'voice',
    description:
      'A thin ee without vibrato pressed on an old worn record, crackle and all, with four seconds leaving each voice.',
    preview: RAISED_FOURTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.8, release: 4, tone: 6000 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        params: { warp: 0.5, crackle: 0.35, wear: 0.6, surface: 0.3, tone: -0.2 },
      },
    ],
  },
  {
    id: 'chord-shed-vowels-fall-off',
    name: 'Vowels fall off',
    category: 'voice',
    description:
      'A choir moving through every vowel inside a second, round mouth that stays still, five seconds in leaving a hall.',
    preview: SAME_E,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 1, release: 5, vowel: 0.1 },
    },
    effects: [
      {
        deviceId: 'imprint',
        params: { capture: 0, shape: 2, amount: 0.7, replace: 0.2, shift: 5 },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 3, midDecay: 3, mix: 0.25 } },
    ],
  },
  {
    id: 'chord-shed-basses-keep-the-fifth',
    name: 'Basses keep the fifth',
    category: 'voice',
    description:
      'Large-throated ahs with organ pipes an octave below and a fifth above, speaking late under the last two notes.',
    preview: FIFTH_STAYS,
    instrument: {
      deviceId: 'choir',
      preset: 'Basses ah',
      params: { volume: -5, attack: 0.8, release: 2, tone: 3000, ensemble: 0.9 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 700,
          sub: 0.6,
          unison: 0.5,
          fifth: 0.35,
          octave: 0.2,
          twelfth: 0,
          fifteenth: 0,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'chord-shed-tenors-behind-a-door',
    name: 'Tenors behind a door',
    category: 'voice',
    description:
      'Round ohs stopping within a second, dulled and narrowed as if the room had been left and shut.',
    preview: SEAM,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { volume: -4.5, attack: 0.2, release: 0.7, tone: 3800 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: { distance: 0.7, room: 0.4, air: 1, wander: 0.1, decay: 0.8, width: 0.15 },
      },
    ],
  },
  {
    id: 'chord-shed-waver-and-then-nobody',
    name: 'Waver and then nobody',
    category: 'voice',
    description:
      'Few singers with a slow wide vibrato sent through a turning horn and drum, the beating clearer as voices go.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow waver',
      params: { attack: 0.5, release: 2.6, ensemble: 0.2, width: 0.3 },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 0, hornDepth: 0.9, drumDepth: 0.8, distance: 0.5, drive: 0.1 },
      },
    ],
  },
  {
    id: 'chord-shed-far-transept-empties',
    name: 'Far transept empties',
    category: 'voice',
    description:
      'Distant voices with nine seconds of release scattered through a cavern of short echoes.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 1.2, release: 9, tone: 3600, vowel: 0.85 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: { length: 0.9, blur: 0.35, feedback: 0.7, highCut: 4000, wander: 0.4, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-whisper-in-the-stalls',
    name: 'Whisper in the stalls',
    category: 'voice',
    description:
      'Breathy ee voices whose bands flicker upward one after another, three and a half seconds in the leaving.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { attack: 0.5, release: 3.5, vowel: 0.38 },
    },
    effects: [
      {
        deviceId: 'glimmer',
        params: { depth: 0.95, rate: 2.2, grain: 0.8, pattern: 1, vary: 0.2 },
      },
    ],
  },
  {
    id: 'chord-shed-trebles-drift-off',
    name: 'Trebles drift off',
    category: 'voice',
    description:
      'Small high voices changing vowel, with a tail that keeps climbing in fifths after the singers have stopped.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.8, release: 7, tone: 8000 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: { bloom: 0.8, direction: 0, interval: 0, season: 3, decay: 8, mix: 0.45 },
      },
    ],
  },
  {
    id: 'chord-shed-roll-call-at-evening',
    name: 'Roll call at evening',
    category: 'voice',
    description:
      'A round vowel stopping in a second, pulsed softly by two gates that drift apart on the voices that remain.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { vowel: 0.76, voice: 1.02, attack: 0.12, release: 1, tone: 4000 },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: { rate: 3, fill: 4, steps: 7, floor: 0.15, apart: 1, edge: 0.5 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-psalm-with-gaps-in-it',
    name: 'Psalm with gaps in it',
    category: 'voice',
    description:
      'Choir on eh with three seconds of release, played into a worn tape loop that brings the fuller chord back quieter.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: { volume: -5.5, vowel: 0.27, voice: 1.02, attack: 0.5, release: 3, tone: 2400 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2.6, feedback: 0.6, wear: 0.6, wow: 0.5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-ninth-kept-at-the-rail',
    name: 'Ninth kept at the rail',
    category: 'voice',
    description:
      'Soft oohs with every onset blurred away and a detuned copy late on each side, leaving over four and a half seconds.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { volume: -4.5, voice: 1.2, attack: 1.4, release: 4.5, tone: 1300 },
    },
    effects: [
      { deviceId: 'fog', params: { size: 420, layers: 2, damp: 0.5 } },
      { deviceId: 'stereo-detune', params: { detune: 18, delay: 30, mix: 0.6 } },
    ],
  },
  {
    id: 'chord-shed-cellist-packs-up-first',
    name: 'Cellist packs up first',
    category: 'string',
    description:
      'Three half-muted players to a note with half a second of release in a tight hall, the low part gone well before the rest.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { players: 3, attack: 0.3, release: 0.5, bow: 0.7, air: 0.1, mute: 0.45 },
    },
    effects: [
      { deviceId: 'hall-reverb', params: { preDelay: 20, lowDecay: 1.5, midDecay: 1.8, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-muted-desks-go-out',
    name: 'Muted desks go out',
    category: 'string',
    description:
      'Muted strings with a second and a half of release, dark echoes jumping down a fifth behind those still bowing.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { volume: -5, attack: 0.8, release: 1.5, players: 4, mute: 0.85 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 620,
          feedback: 0.5,
          intervalA: 2,
          step: 2,
          tone: 2200,
          glide: 0.4,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'chord-shed-rosin-then-air',
    name: 'Rosin, then air',
    category: 'string',
    description:
      'One lightly muted bow to a note, its quiet overtones and breath turned up frequency by frequency as it lifts off.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 1, attack: 0.5, release: 3.8, air: 0.6, mute: 0.35, width: 0.3 },
    },
    effects: [
      {
        deviceId: 'reveal',
        params: { amount: 0.9, focus: 0.6, range: 24, rise: 700, detail: 0.8 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.6, damping: 0.5, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-warm-desks-thin-out',
    name: 'Warm desks thin out',
    category: 'string',
    description:
      'Six vibrating players a note, a hard compressor bringing them up to one level from the first chord to the last bow.',
    preview: SAME_E,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.5, release: 1.1 },
    },
    effects: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -54, ratio: 8, attack: 60, release: 0.4, tails: 1, makeup: 22 },
      },
      { deviceId: 'ambient-eq', params: { low: 4, presence: -3, highCut: 5000, clear: 0.3 } },
    ],
  },
  {
    id: 'chord-shed-dark-bows-by-lamplight',
    name: 'Dark bows by lamplight',
    category: 'string',
    description:
      'Scattered dark bows, four seconds in the leaving, through a low-pass that shuts as the chord gets quieter.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Slow dark bows',
      params: { attack: 1.4, release: 4 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 0, outputDb: 14 } },
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 0,
          cutoffHz: 200,
          resonance: 1.1,
          envAmount: 95,
          envAttackMs: 200,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'saturator', params: { curve: 3, driveDb: 0, outputDb: -11 } },
    ],
  },
  {
    id: 'chord-shed-halo-around-one-bow',
    name: 'Halo around one bow',
    category: 'string',
    description:
      'Still strings without vibrato and a long release, the tail rising by octaves and fifths over the note that is left.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.8, release: 6.5 },
    },
    effects: [
      {
        deviceId: 'shimmer',
        params: { interval: 2, shimmer: 0.7, decay: 9, tone: 5000, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-viola-left-to-herself',
    name: 'Viola left to herself',
    category: 'string',
    description:
      'One close player per note, no width, with a vibrato that grows only on what is held longest.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.25, release: 0.8, vibrato: 0 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 1500, grow: 1500, depth: 30, rate: 5, swell: 0.5 },
      },
      { deviceId: 'vessel', params: { body: 5, size: 1.4, mix: 0.4, material: 0.4 } },
    ],
  },
  {
    id: 'chord-shed-bridge-and-a-single-bow',
    name: 'Bridge and a single bow',
    category: 'string',
    description:
      'Dulled hard bows shifted a few hertz apart in left and right, so every voice that leaves stills one beat.',
    preview: RAISED_FOURTH,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -5, attack: 0.35, release: 2.8, mute: 0.4 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { mode: 2, shift: 0, fine: 3.5, feedback: 0.2, delay: 20, tone: 2500, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', params: { low: 3, air: -6, highCut: 3600 } },
    ],
  },
  {
    id: 'chord-shed-duet-by-attrition',
    name: 'Duet by attrition',
    category: 'string',
    description:
      'Two soft players to a note on a worn slow tape, each stop quick and a little short of pitch from the wow.',
    preview: NINTH_STAYS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { attack: 0.2, release: 0.35, mute: 0.3 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { speed: 2, wow: 0.8, flutter: 0.4, age: 0.5, hiss: 0.1, drive: 0.5 },
      },
      { deviceId: 'fdn-reverb', params: { decay: 1.6, breathDepth: 0, damping: 0.6, mix: 0.18 } },
    ],
  },
  {
    id: 'chord-shed-ragged-retreat',
    name: 'Ragged retreat',
    category: 'string',
    description:
      'Six players badly in unison, turned into a flock of copies that wheel farther out as the chord loses voices.',
    preview: SEAM,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { attack: 0.5, release: 3 },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: { birds: 12, speed: 0.6, range: 24, air: 0.6, mix: 0.75 },
      },
    ],
  },
  {
    id: 'chord-shed-short-bows-resign',
    name: 'Short bows resign',
    category: 'string',
    description:
      'Quick bows with scarcely any release, skipping away in closer and closer echoes from side to side.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { attack: 0.06, release: 0.3, bow: 0.5 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 520, bounce: 0.78, skips: 9, loss: 2, throw: 1, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-veil-over-a-seventh',
    name: 'Veil over a seventh',
    category: 'string',
    description:
      'A thin muted veil with seven and a half seconds of release over a tail that sinks without arriving.',
    preview: SAME_E,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -4, attack: 1.2, release: 7.5 },
    },
    effects: [{ deviceId: 'spiral', params: { climb: -5, decay: 9, tone: 5000, mix: 0.5 } }],
  },
  {
    id: 'chord-shed-keys-lifted-in-turn',
    name: 'Keys lifted in turn',
    category: 'keys',
    description:
      'A felted piano with quick dampers and no pedal, a dull string section speaking behind the keys that stay down.',
    preview: NINTHS_IN_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { damper: 0.9, resonance: 0.2, reverbMix: 0.05, felt: 0.7, outputDb: -16 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: {
          rise: 0.15,
          fall: 0.6,
          sensitivity: 0.9,
          octaves: 0,
          brightness: 1600,
          ensemble: 0.3,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'chord-shed-half-pedal-half-chord',
    name: 'Half pedal, half chord',
    category: 'keys',
    description:
      'Dampers half down on loose strings, tuned strings in A minor ringing on with what the hands have let go.',
    preview: NINTHS_IN_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { outputDb: -23.5, felt: 0.4 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 9, mode: 1, sympathy: 0.8, strings: 8, decay: 6, mix: 0.55 },
      },
    ],
  },
  {
    id: 'chord-shed-ninth-over-silence',
    name: 'Ninth over silence',
    category: 'keys',
    description:
      'A piano without felt, its softest ends raised so the last string goes on being heard over nothing.',
    preview: NINTH_STAYS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { outputDb: -16, hardness: 0.4, resonance: 0.4 },
    },
    effects: [
      {
        deviceId: 'lift',
        params: { threshold: -27, amount: 1, rise: 0.12, limit: 30, floor: -80 },
      },
      { deviceId: 'ether-reverb', params: { size: 0.4, decay: 2, mix: 0.12 } },
    ],
  },
  {
    id: 'chord-shed-upright-after-closing',
    name: 'Upright after closing',
    category: 'keys',
    description:
      'A creaking detuned upright with slack dampers on a worn dusty record, each seventh blurring into the next chord.',
    preview: SEVENTHS_STEP,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: {
        outputDb: -17.5,
        thump: 0.3,
        damper: 0.1,
        felt: 0.6,
        sustain: 0.3,
        reverbMix: 0.3,
        reverbSize: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 2, drive: 0.4, wobble: 0.5, wear: 0.7, noise: 0.35, tone: 0.35 },
      },
    ],
  },
  {
    id: 'chord-shed-next-room-one-key-down',
    name: 'Next room, one key down',
    category: 'keys',
    description:
      'A piano heard mostly by its room, with three dark tape heads answering each key after it has come up.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { outputDb: -10.5, felt: 0.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 900, heads: 2, feedback: 0.4, highCut: 2200, wow: 0.4, mix: 0.4 },
      },
    ],
  },
  {
    id: 'chord-shed-thud-and-then-a-note',
    name: 'Thud, and then a note',
    category: 'keys',
    description:
      'Hammers of pure felt, only what lasts past a quarter second let through, so the notes follow their own thuds.',
    preview: NINTHS_IN_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -13, resonance: 0.2, damper: 0.8 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 260, strict: 0.6, ring: 0.25, mix: 1, makeup: 1 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -5 } },
    ],
  },
  {
    id: 'chord-shed-glass-key-stays-down',
    name: 'Glass key stays down',
    category: 'keys',
    description:
      'Hard untuned strings in a small room, throwing sparks an octave above, fewer as the chord thins.',
    preview: NINTHS_IN_TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: {
        outputDb: -13.5,
        hardness: 0.85,
        detune: 0.9,
        stiffness: 1,
        width: 1,
        reverbMix: 0.4,
        reverbSize: 0.2,
      },
    },
    effects: [
      {
        deviceId: 'glints',
        params: { density: 9, pitch: 0, size: 110, follow: 1, trail: 0.5, mix: 0.55 },
      },
    ],
  },
  {
    id: 'chord-shed-pedal-lets-one-through',
    name: 'Pedal lets one through',
    category: 'keys',
    description:
      'The pedal barely touched, the chord unfolded from high to low by colour-split echoes as its keys come up.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Hall',
      params: { outputDb: -14, hardness: 0.4, damper: 0.45, sustain: 0.2, reverbMix: 0.2 },
    },
    effects: [
      { deviceId: 'prism', params: { time: 1300, shape: 1, bands: 16, feedback: 0.3, mix: 0.5 } },
    ],
  },
  {
    id: 'chord-shed-bowed-keys-shed',
    name: 'Bowed keys, shed',
    category: 'keys',
    description:
      'Still strings with the hammer faded out, each chord swelling in over a quarter of a second and spread by a loose chorus.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -18, resonance: 0.6, damper: 0.4, sustain: 0.25 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 260, sensitivity: -55, curve: 0.4, release: 1200 } },
      { deviceId: 'chorus', params: { voices: 1, rate: 0.3, depth: 70, mix: 0.5 } },
      { deviceId: 'fet-limiter', params: { inputGain: 6 } },
    ],
  },
  {
    id: 'chord-shed-strike-glow-subtract',
    name: 'Strike, glow, subtract',
    category: 'keys',
    description:
      'Bright felt strikes whose glow rises fast and is gone half a second after the key, laid on a short dull plate.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { tone: 0.8, halo: 0.7, drift: 0.6, bloom: 0.4, fade: 0.4, glow: 0.8, decay: 2 },
    },
    effects: [{ deviceId: 'plate-reverb', params: { decay: 0.5, damping: 0.8, mix: 0.4 } }],
  },
  {
    id: 'chord-shed-bell-left-at-the-gate',
    name: 'Bell left at the gate',
    category: 'bell',
    description:
      'Dark struck bells with a one second fade and a table of bowls tuned to A minor that keeps the touched notes.',
    preview: NINTH_STAYS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: -4, decay: 1.5, fade: 1.2, halo: 0.1, strike: 0.9, tone: 0.3, bloom: 0.8 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: { root: 9, scale: 3, bowls: 12, ring: 14, beat: 0.5, register: 0.8, mix: 0.7 },
      },
    ],
  },
  {
    id: 'chord-shed-glass-cleared-away',
    name: 'Glass cleared away',
    category: 'pad',
    description:
      'Breathy glass that blooms for a second and stops almost with the key, cleared of its low end.',
    preview: RAISED_FOURTH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { bloom: 0.9, fade: 0.3, strike: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 260, low: -6, air: 4, clear: 0.5 } },
      { deviceId: 'chorus', params: { voices: 0, rate: 0.2, depth: 60, mix: 0.45 } },
    ],
  },
  {
    id: 'chord-shed-plucked-then-haze-only',
    name: 'Plucked, then haze only',
    category: 'plucked',
    description:
      'Plucks with a short fade pushed into a fuzzed double reverb, the chord gone before its haze thickens.',
    preview: SEVENTHS_STEP,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { fade: 0.8, decay: 1.2, tone: 0.45 },
    },
    effects: [
      {
        deviceId: 'haze',
        params: { haze: 0.7, blur: 0.8, decay: 3, octave: 0, tone: 0.35, mix: 0.5 },
      },
    ],
  },
  {
    id: 'chord-shed-glow-with-no-hand',
    name: 'Glow with no hand',
    category: 'pad',
    description:
      'Only the raised overtones, six seconds in fading, breathing open and shut on a cycle of their own.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { evolve: 0.9, tone: 0.6, bloom: 1.2 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: { in: 1.4, out: 1.6, rest: 0.2, depth: 0.6, colour: 0.8, width: 0.9 },
      },
    ],
  },
  {
    id: 'chord-shed-dark-felt-at-closing',
    name: 'Dark felt at closing',
    category: 'keys',
    description:
      'Dark felt with a two second fade and an iron transformer pushed under it, weighted to the root that stays.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { volume: -13, fade: 2, bloom: 1.2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { circuit: 2, drive: 0.65, lowBump: 0.7, highCut: 3000, output: -8 },
      },
      { deviceId: 'spring-reverb', params: { decay: 2, springs: 1, drip: 0, mix: 0.15 } },
    ],
  },
  {
    id: 'chord-shed-tide-over-all-but-one',
    name: 'Tide over all but one',
    category: 'pad',
    description:
      'A felt strike with six seconds of fade heard as if under water, the voice still held wavering there by itself.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Long fade',
      params: { tone: 0.65, bloom: 0.8, fade: 6 },
    },
    effects: [
      { deviceId: 'underwater', params: { depth: 0.5, waver: 0.7, rate: 0.5, bubbles: 0.15 } },
    ],
  },
  {
    id: 'chord-shed-harp-goes-air-stays',
    name: 'Harp goes, air stays',
    category: 'plucked',
    description:
      'Plucked strings turning to a pad, each note answered an octave above and then an octave below by its own canon.',
    preview: RAISED_FOURTH,
    instrument: { deviceId: 'afterglow', preset: 'Harp into air', params: { bloom: 1.5, fade: 3 } },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 0.9,
          interval1: 12,
          interval2: -12,
          fade: 0.3,
          tone: 5000,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'chord-shed-still-sine-goes-last',
    name: 'Still sine goes last',
    category: 'pad',
    description:
      'Two close sines and a sub with a short release, wide in the ears by a slow wander round the head.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.4, release: 0.5, sub: 0.3 },
    },
    effects: [{ deviceId: 'around', params: { path: 3, rate: 0.4, radius: 1, head: 1 } }],
  },
  {
    id: 'chord-shed-glass-ladder-pulled-up',
    name: 'Glass ladder pulled up',
    category: 'keys',
    description:
      'Bright glass with no attack and a second of release, its echoes thinning along a bent ladder of delays.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 0.9, position: 0.8 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: { span: 2000, pattern: 3, stars: 6, fade: 0.6, tone: 9000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'chord-shed-beating-slower-by-one',
    name: 'Beating slower by one',
    category: 'pad',
    description:
      'Wide-detuned sines alone, the beating plainer with each voice that goes, warmed by a triode and a soft room.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { detune: 16, release: 1.6, position: 0, cutoff: 5000 },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 3, drive: 0.5 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 2, midDecay: 2, mix: 0.25 } },
    ],
  },
  {
    id: 'chord-shed-vowel-on-the-doorstep',
    name: 'Vowel on the doorstep',
    category: 'voice',
    description:
      'A vowel table sung with a slow flutter and two seconds of release into a starved stream that throws the quiet parts away.',
    preview: SEAM,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Vowel flutter',
      params: { rate: 4.5, release: 2, detune: 14 },
    },
    effects: [
      { deviceId: 'low-bitrate', params: { loss: 0.65, frame: 2, smear: 0.4, highCut: 7000 } },
    ],
  },
  {
    id: 'chord-shed-reeds-close-one-by-one',
    name: 'Reeds close one by one',
    category: 'organ',
    description:
      'A reed table stopping short, its middle chopped eight times a second while its lows stay steady.',
    preview: FIFTH_STAYS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.08, release: 0.25, cutoff: 3200 },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        params: { rate: 8, depth: 0.9, low: 300, high: 3500, edge: 14, offset: 90 },
      },
    ],
  },
  {
    id: 'chord-shed-saws-fold-their-stands',
    name: 'Saws fold their stands',
    category: 'string',
    description:
      'Thick detuned saws with three seconds of release, hollowed by a slow flanger that turns once in eight seconds.',
    preview: SAME_E,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.4, release: 3, cutoff: 3000, detune: 24 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { rate: 0.12, depth: 80, feedback: -60, delayMs: 4, mix: 0.6 },
      },
    ],
  },
  {
    id: 'chord-shed-hollow-after-supper',
    name: 'Hollow after supper',
    category: 'pad',
    description:
      'A hollow table in no hurry, eight seconds leaving, half its breath replayed as a cloud of slow grains.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 1, release: 8, cutoff: 2600 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: { size: 900, density: 8, spray: 0.4, reverse: 0.6, mix: 0.6 },
      },
    ],
  },
  {
    id: 'chord-shed-low-bed-one-lamp-on',
    name: 'Low bed, one lamp on',
    category: 'drone',
    description:
      'A dull reed and its sub over a long release, one harmonic of A (an E) picked out and held as a whistle.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.8, release: 4, cutoff: 1500, sub: 0.5, position: 0.5 },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        params: { root: 9, pattern: 5, low: 6, high: 6, octave: 2, focus: 0.8, drone: 0.7 },
      },
    ],
  },
  {
    id: 'chord-shed-brass-rises-to-leave',
    name: 'Brass rises to leave',
    category: 'pad',
    description:
      'Slow brass that keeps swelling on what is held, so the major seventh is at its brightest when it is alone.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { release: 0.5, swell: 1, attack: 0.3 },
    },
    effects: [{ deviceId: 'hall-reverb', params: { lowDecay: 1.8, midDecay: 2, mix: 0.22 } }],
  },
  {
    id: 'chord-shed-horns-hand-in-mutes',
    name: 'Horns hand in mutes',
    category: 'wind',
    description:
      'Soft horns sounding inside a large shell, two seconds in leaving, with no reverb but the shell itself.',
    preview: SUSPENDED_NINTH,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { attack: 0.6, release: 2, brilliance: 1400 },
    },
    effects: [{ deviceId: 'vessel', params: { body: 3, size: 1.8, material: 0.7, mix: 0.75 } }],
  },
  {
    id: 'chord-shed-strings-above-the-exit',
    name: 'Strings above the exit',
    category: 'string',
    description:
      'Wide bright strings widened again by frequency, quick to stop, with a thin tail that beats in slow pulses.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.5, release: 0.6 },
    },
    effects: [
      { deviceId: 'spread', params: { low: 0.2, mid: 1.6, high: 2, make: 1 } },
      { deviceId: 'shaped-reverb', params: { shape: 4, time: 1.8, mix: 0.35 } },
    ],
  },
  {
    id: 'chord-shed-night-choir-last-verse',
    name: 'Night choir, last verse',
    category: 'voice',
    description:
      'A resonant vowel-like pad with five seconds of release, hollowed by a very slow twelve-stage sweep.',
    preview: SEAM,
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 0.9, resonance: 0.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: { stages: 4, rate: 0.07, depth: 90, feedback: -60, centerHz: 1100, mix: 0.6 },
      },
    ],
  },
  {
    id: 'chord-shed-metal-under-the-leaves',
    name: 'Metal under the leaves',
    category: 'bell',
    description:
      'Ring-modulated metal with a long release, its partials squeezed toward a pivot so each chord beats as it ends.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.02, release: 4, ring: 0.4 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: -0.25, follow: 1, drift: 0.2, mix: 0.7 } },
      { deviceId: 'plate-reverb', params: { decay: 0.6, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-pipes-shut-for-the-year',
    name: 'Pipes shut for the year',
    category: 'organ',
    description:
      'Plain steady pipes without detune that stop in a third of a second, spoken over again in higher ranks.',
    preview: FIFTH_STAYS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { volume: -8.5, release: 0.35 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          speak: 250,
          sub: 0,
          unison: 0.4,
          fifth: 0,
          octave: 0.8,
          twelfth: 0.5,
          fifteenth: 0.4,
          chiff: 0.5,
          mix: 0.6,
        },
      },
      { deviceId: 'ether-reverb', params: { size: 0.8, decay: 3, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-deep-swell-one-aboard',
    name: 'Deep swell, one aboard',
    category: 'drone',
    description:
      'A very dark swell with five seconds of release, its low middle rocking twice a second, plainest on the last voice.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { attack: 1, release: 5, brilliance: 650 },
    },
    effects: [
      { deviceId: 'ear-shift', params: { beat: 2, ears: 0, high: 700 } },
      { deviceId: 'ambient-eq', params: { low: 2, body: 3, highCut: 2400 } },
    ],
  },
  {
    id: 'chord-shed-fiddles-run-out-in-turn',
    name: 'Fiddles run out in turn',
    category: 'string',
    description:
      'Three violins from worn tape, stopping with the key, heard over a medium wave link that fades by itself.',
    preview: SUSPENDED_NINTH,
    instrument: { deviceId: 'tape-orchestra', preset: 'Three violins', params: { age: 0.4 } },
    effects: [
      {
        deviceId: 'radio',
        params: {
          band: 0,
          fading: 0.4,
          static: 0.12,
          interference: 0,
          bandwidth: 0.8,
          speaker: 0.3,
          mix: 0.8,
        },
      },
    ],
  },
  {
    id: 'chord-shed-horns-leave-the-chorale',
    name: 'Horns leave the chorale',
    category: 'wind',
    description:
      'Taped horns let go within a second, the two that stay held in a swelling, blooming room.',
    preview: FIFTH_STAYS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.3, release: 0.9, age: 0.5 },
    },
    effects: [
      { deviceId: 'shaped-reverb', params: { shape: 2, time: 2.8, mix: 0.45, colour: -0.5 } },
    ],
  },
  {
    id: 'chord-shed-flutes-as-light-thins',
    name: 'Flutes as light thins',
    category: 'wind',
    description:
      'Plain flutes on clean tape, no vibrato, with a blurred loop of two seconds going on with what has stopped.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.15, release: 1.6, tone: 0.1 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        params: { state: 2, length: 2.2, speed: 4, smear: 0.7, tone: 5000, mix: 0.45 },
      },
    ],
  },
  {
    id: 'chord-shed-tape-choir-to-one-mouth',
    name: 'Tape choir to one mouth',
    category: 'voice',
    description:
      'A worn tape choir with two seconds of release, sampled coarsely so the last voices roughen as they fade.',
    preview: SAME_E,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.5, release: 2, hiss: 0.1, tone: 0.2 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        params: { rate: 7000, bits: 7, companding: 1, filter: 2, jitter: 0.3 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.55, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-half-speed-low-strings',
    name: 'Half-speed low strings',
    category: 'string',
    description:
      'Sunken strings at half speed with six seconds of release, panned slowly from one side to the other.',
    preview: ROOT_STAYS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: { attack: 0.7, hiss: 0.15, tone: -0.3, age: 0.4 },
    },
    effects: [{ deviceId: 'tremolo', params: { mode: 1, rate: 0.3, depth: 0.9, shape: 0 } }],
  },
  {
    id: 'chord-shed-reeds-put-back-in-cases',
    name: 'Reeds put back in cases',
    category: 'wind',
    description:
      'Orchestra reeds with a brief release through a horn loudspeaker close by, a compressor evening out some of the thinning.',
    preview: HIGH_ELEVENTH,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.1, release: 0.5, players: 0.8 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: { speaker: 3, drive: 0.35, distance: 0.15, room: 0.1, noise: 0, treble: -0.4 },
      },
      {
        deviceId: 'ambient-comp',
        params: { threshold: -38, ratio: 5, attack: 60, release: 0.5, tails: 1, makeup: 6 },
      },
    ],
  },
  {
    id: 'chord-shed-mirrors-taken-down',
    name: 'Mirrors taken down',
    category: 'pad',
    description:
      'Filtered noise singing each note with its mirror around D, short in release, brought up by a limiter into a small hall.',
    preview: SEVENTH_STAYS,
    instrument: {
      deviceId: 'thesis',
      preset: 'Thesis Default',
      params: { attack: 0.4, release: 0.8, resonance: 60, breatheRate: 0.15 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -4 } },
      { deviceId: 'hall-reverb', params: { lowDecay: 1.5, midDecay: 2, mix: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-glass-row-one-left-lit',
    name: 'Glass row, one left lit',
    category: 'voice',
    description:
      'Narrow bands of noise that leave in a second and a half, an ee sung by the room behind.',
    preview: SINKS_UPWARD,
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { attack: 0.7, width: 100, release: 1.5 },
    },
    effects: [
      { deviceId: 'vowel-reverb', params: { vowel: 2, resonance: 0.6, decay: 3, mix: 0.35 } },
      { deviceId: 'fet-limiter', params: { inputGain: 6, outputGain: 0 } },
    ],
  },
  {
    id: 'chord-shed-the-fourth-one-drifts',
    name: 'The fourth one drifts',
    category: 'pad',
    description:
      'Bands that wander from their notes in A minor and leave over three seconds, the air taken off the top.',
    preview: SEAM,
    instrument: { deviceId: 'thesis', preset: 'Drifting Minor', params: { attack: 0.4 } },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 90, body: 5, air: -9, highCut: 2600 } },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -6.5 } },
    ],
  },
  {
    id: 'chord-shed-pulled-to-the-middle',
    name: 'Pulled to the middle',
    category: 'pad',
    description:
      'Broad wide bands, each key bringing its mirror, its octave and its halfway step, all of them lost with the voice.',
    preview: RAISED_FOURTH,
    instrument: {
      deviceId: 'thesis',
      preset: 'Gravity Well',
      params: { center: 62, mode: 1, strum: 0, release: 2.5, resonance: 20 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -10 } },
      { deviceId: 'currents', params: { depth: 0.7, sway: 0.9, rate: 0.2 } },
    ],
  },
  {
    id: 'chord-shed-lydian-rolled-off',
    name: 'Lydian rolled off',
    category: 'plucked',
    description:
      'Each key rolls its mirrored bands like a slow strum and stops soon after, two or three soft tape repeats behind.',
    preview: LAST_KEY,
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { root: 5, release: 0.5, resonance: 80 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { time: 420, feedback: 0.35, mix: 0.25 } },
      { deviceId: 'fet-limiter', params: { inputGain: 10, outputGain: -6.5 } },
    ],
  },
  {
    id: 'chord-shed-whole-stack-to-a-thread',
    name: 'Whole stack to a thread',
    category: 'drone',
    description:
      'Every reflection switched on and rung very narrow, so each key brings a chord of its own and takes it away again.',
    preview: EARLY_SHED,
    instrument: {
      deviceId: 'thesis',
      preset: 'Fixed Full Stack',
      params: { resonance: 100, release: 6, strum: 0 },
    },
    effects: [
      { deviceId: 'distance', params: { distance: 0.4, room: 0.7, wander: 0, decay: 4 } },
      { deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -8 } },
    ],
  },
]
