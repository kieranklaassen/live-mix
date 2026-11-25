import { type FactoryPreset, type Phrase } from '../types'

// The held six-note clusters of the court mouth organ, a tone below its pipes so they lie on white
// keys: kotsu G4 D5 G5 A5 D6 E6, bo C5 D5 G5 A5 D6 E6, ichi A4 C5 D5 G5 A5 E6, otsu D5 G5 A5 C6 D6
// E6. D5 G5 A5 and E6 are in all four; one or two fingers move, and the new pipe speaks before the
// old one is let go. Laid out by how the breath swells, how bright the pipe is, and how far one
// pipe leads the rest.

// Kotsu to bo: G4 leads alone, the five shared pipes join it, then the one finger moves to C5.
const KOTSU_TO_BO: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 67, gain: 0.5 },
    { atSec: 0.4, durSec: 6.6, note: 74, gain: 0.4 },
    { atSec: 0.4, durSec: 6.6, note: 79, gain: 0.4 },
    { atSec: 0.4, durSec: 6.6, note: 81, gain: 0.38 },
    { atSec: 0.4, durSec: 6.6, note: 86, gain: 0.35 },
    { atSec: 0.4, durSec: 6.6, note: 88, gain: 0.35 },
    { atSec: 2.9, durSec: 4.1, note: 72, gain: 0.5 },
  ],
}

// Bo to otsu: the finger on C5 goes to C6 and nothing else moves.
const BO_TO_OTSU: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 74, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 79, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 81, gain: 0.38 },
    { atSec: 0, durSec: 7, note: 86, gain: 0.35 },
    { atSec: 0, durSec: 7, note: 88, gain: 0.35 },
    { atSec: 2.9, durSec: 4.1, note: 84, gain: 0.48 },
  ],
}

// Bo to ichi: D6 is let go under a new A4.
const BO_TO_ICHI: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 72, gain: 0.45 },
    { atSec: 0, durSec: 7, note: 74, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 79, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 81, gain: 0.38 },
    { atSec: 0, durSec: 3.2, note: 86, gain: 0.38 },
    { atSec: 0, durSec: 7, note: 88, gain: 0.35 },
    { atSec: 2.9, durSec: 4.1, note: 69, gain: 0.5 },
  ],
}

// Ichi to kotsu, two fingers one after the other: C5 gives way to D6, then A4 to G4.
const ICHI_TO_KOTSU: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.4, note: 69, gain: 0.48 },
    { atSec: 0, durSec: 2.6, note: 72, gain: 0.45 },
    { atSec: 0, durSec: 7, note: 74, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 79, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 81, gain: 0.38 },
    { atSec: 0, durSec: 7, note: 88, gain: 0.35 },
    { atSec: 2.3, durSec: 4.7, note: 86, gain: 0.4 },
    { atSec: 4.1, durSec: 2.9, note: 67, gain: 0.5 },
  ],
}

// Kotsu to otsu: one finger, two holes, from G4 up to C6.
const KOTSU_TO_OTSU: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 74, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 79, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 81, gain: 0.38 },
    { atSec: 0, durSec: 7, note: 86, gain: 0.35 },
    { atSec: 0, durSec: 7, note: 88, gain: 0.35 },
    { atSec: 2.9, durSec: 4.1, note: 84, gain: 0.46 },
  ],
}

// The round kotsu, bo, ichi, kotsu: four pipes held to the end, G4 C5 A4 and D6 coming and going.
const ONE_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 74, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 79, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 81, gain: 0.38 },
    { atSec: 0, durSec: 7.2, note: 88, gain: 0.34 },
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 86, gain: 0.36 },
    { atSec: 1.6, durSec: 3.7, note: 72, gain: 0.48 },
    { atSec: 3.4, durSec: 2.2, note: 69, gain: 0.5 },
    { atSec: 5.1, durSec: 2.1, note: 86, gain: 0.36 },
    { atSec: 5.4, durSec: 1.8, note: 67, gain: 0.5 },
  ],
}

// Bo to ichi over a low bed: C3 and G3, then A2 and E3.
const LOW_BED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.7, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 3.7, note: 55, gain: 0.4 },
    { atSec: 3.6, durSec: 3.6, note: 45, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 52, gain: 0.4 },
    { atSec: 0, durSec: 7.2, note: 72, gain: 0.36 },
    { atSec: 0, durSec: 7.2, note: 74, gain: 0.34 },
    { atSec: 0, durSec: 7.2, note: 79, gain: 0.34 },
    { atSec: 0, durSec: 7.2, note: 81, gain: 0.32 },
    { atSec: 0, durSec: 7.2, note: 88, gain: 0.28 },
    { atSec: 0, durSec: 3.3, note: 86, gain: 0.32 },
    { atSec: 3, durSec: 4.2, note: 69, gain: 0.38 },
  ],
}

// Kotsu to bo an octave down, where voices, cellos and horns have it: G3 goes to C4.
const OCTAVE_BELOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.2, note: 55, gain: 0.5 },
    { atSec: 0.4, durSec: 6.6, note: 62, gain: 0.42 },
    { atSec: 0.4, durSec: 6.6, note: 67, gain: 0.4 },
    { atSec: 0.4, durSec: 6.6, note: 69, gain: 0.4 },
    { atSec: 0.4, durSec: 6.6, note: 74, gain: 0.36 },
    { atSec: 0.4, durSec: 6.6, note: 76, gain: 0.36 },
    { atSec: 2.9, durSec: 4.1, note: 60, gain: 0.5 },
  ],
}

// Otsu built from below, one pipe at a time, each held once it is in.
const PIPES_ENTER: Phrase = {
  notes: [
    { atSec: 0, durSec: 6, note: 74, gain: 0.5 },
    { atSec: 0.7, durSec: 5.3, note: 79, gain: 0.45 },
    { atSec: 1.4, durSec: 4.6, note: 81, gain: 0.42 },
    { atSec: 2.1, durSec: 3.9, note: 84, gain: 0.4 },
    { atSec: 2.8, durSec: 3.2, note: 86, gain: 0.38 },
    { atSec: 3.5, durSec: 2.5, note: 88, gain: 0.36 },
  ],
}

// Two breaths out of phase: D5 A5 E6 in, C5 G5 D6 over them before they end, and D5 A5 E6 again.
// Together they are bo.
const TWO_BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 74, gain: 0.5 },
    { atSec: 0, durSec: 3, note: 81, gain: 0.45 },
    { atSec: 0, durSec: 3, note: 88, gain: 0.4 },
    { atSec: 2, durSec: 3.2, note: 72, gain: 0.5 },
    { atSec: 2, durSec: 3.2, note: 79, gain: 0.45 },
    { atSec: 2, durSec: 3.2, note: 86, gain: 0.4 },
    { atSec: 4.4, durSec: 2.8, note: 74, gain: 0.5 },
    { atSec: 4.4, durSec: 2.8, note: 81, gain: 0.45 },
    { atSec: 4.4, durSec: 2.8, note: 88, gain: 0.4 },
  ],
}

// The moving pipe of the round brought out, G4 C5 A4 G4, over G3 and D4 with D5 and A5 held.
const LEADING_PIPE: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 55, gain: 0.34 },
    { atSec: 0, durSec: 7.2, note: 62, gain: 0.3 },
    { atSec: 0, durSec: 7.2, note: 74, gain: 0.26 },
    { atSec: 0, durSec: 7.2, note: 81, gain: 0.24 },
    { atSec: 0, durSec: 1.9, note: 67, gain: 0.62 },
    { atSec: 1.7, durSec: 1.9, note: 72, gain: 0.62 },
    { atSec: 3.4, durSec: 1.9, note: 69, gain: 0.62 },
    { atSec: 5.1, durSec: 2.1, note: 67, gain: 0.62 },
  ],
}

// A cluster of the pack's own with a half step at its top, A4 D5 E5 G5 B5 C6; C6 opens to D6.
const HALF_STEP: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 69, gain: 0.45 },
    { atSec: 0, durSec: 7, note: 74, gain: 0.42 },
    { atSec: 0, durSec: 7, note: 76, gain: 0.4 },
    { atSec: 0, durSec: 7, note: 79, gain: 0.4 },
    { atSec: 0.4, durSec: 6.6, note: 83, gain: 0.36 },
    { atSec: 0.4, durSec: 3.2, note: 84, gain: 0.36 },
    { atSec: 3.2, durSec: 3.8, note: 86, gain: 0.38 },
  ],
}

// The bed alone on the same plan: C3 stays, G3 gives way to A3, and two pipes (D4, A4) come in over it.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.55 },
    { atSec: 0, durSec: 3.7, note: 55, gain: 0.48 },
    { atSec: 3.4, durSec: 3.8, note: 57, gain: 0.48 },
    { atSec: 1.2, durSec: 6, note: 62, gain: 0.4 },
    { atSec: 2.4, durSec: 4.8, note: 69, gain: 0.36 },
  ],
}

// Bo to otsu let go early, for what rings on.
const LET_RING: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 72, gain: 0.5 },
    { atSec: 0, durSec: 4.6, note: 74, gain: 0.42 },
    { atSec: 0, durSec: 4.6, note: 79, gain: 0.4 },
    { atSec: 0, durSec: 4.6, note: 81, gain: 0.38 },
    { atSec: 0, durSec: 4.6, note: 86, gain: 0.35 },
    { atSec: 0, durSec: 4.6, note: 88, gain: 0.35 },
    { atSec: 1.7, durSec: 2.9, note: 84, gain: 0.48 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String machine: the cluster as a section of saw reeds, from dry and close to a slow far bed.
  {
    id: 'reeds-never-stop-thumb-stays-down',
    name: 'Thumb stays down',
    category: 'string',
    description:
      'Plain violas with no octaves, opened and closed by a slow breath of level and brightness, in a dark hall.',
    preview: KOTSU_TO_BO,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.7, release: 2, tone: 2600, ensemble: 0.5 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 2, hold: 0.2, out: 2.4, rest: 0.1, depth: 0.65, colour: 0.7, vary: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reeds-never-stop-frost-on-lacquer',
    name: 'Frost on lacquer',
    category: 'string',
    description:
      'Glassy strings with the octave above and none below, sounded inside a small glass tube and left on a faint plate.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.4, release: 1.6, tone: 10000, ensemble: 0.35 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.55 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-four-fingers-shared',
    name: 'Four fingers shared',
    category: 'pad',
    description:
      'Hollow strings through a filter that keeps the notes two chords share and lets them ring, cut thin at both ends.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.2, release: 1.4, tone: 3600 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Long hold', params: { ring: 0.8, mix: 0.85 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 240 } },
    ],
  },
  {
    id: 'reeds-never-stop-saw-bamboo',
    name: 'Saw bamboo',
    category: 'organ',
    description: 'Dry saws with a soft edge from a small loudspeaker, set back in a spring tank.',
    preview: KOTSU_TO_OTSU,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        volume: -13.5,
        attack: 0.12,
        release: 0.8,
        high: 0.6,
        low: 0,
        tone: 4600,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0.35, room: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-low-pipe-first',
    name: 'Low pipe first',
    category: 'pad',
    description:
      'Slow strings without their low octave, split in bands so each chord unfolds from its lowest pipe up, then a chamber.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1, release: 3, low: 0, high: 0.55, tone: 3400 },
    },
    effects: [
      {
        deviceId: 'prism',
        preset: 'Low to high',
        params: { time: 1100, feedback: 0.3, mix: 0.55 },
      },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'reeds-never-stop-drone-under-the-hand',
    name: 'Drone under the hand',
    category: 'organ',
    description: 'Muted violins given an octave pipe below that speaks a moment after each note.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.5, high: 0.5, tone: 1700, ensemble: 0.4 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Pedal under',
        params: { speak: 420, sub: 0.95, unison: 0.7, mix: 0.85 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-swept-gravel',
    name: 'Swept gravel',
    category: 'string',
    description:
      'Bright shimmering strings with their onsets misted over, rising and sinking on a slow swell of level.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { volume: -5, attack: 0.5, release: 1.8, high: 0.6, tone: 8000 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.8 } },
      {
        deviceId: 'tremolo',
        preset: 'Sea swell',
        params: { rate: 0.3, depth: 0.6, shape: 0, phase: 0 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-cluster-in-a-quilt',
    name: 'Cluster in a quilt',
    category: 'string',
    description:
      'Strings that take two seconds to speak, on tape recorded under a blanket, passing in and out behind clouds.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 2, release: 3, low: 0.3, high: 0.5, tone: 3600, speed: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.1 } },
      { deviceId: 'weather', preset: 'Passing clouds', params: { voice: 0 } },
    ],
  },
  {
    id: 'reeds-never-stop-seventeen-pipes',
    name: 'Seventeen pipes',
    category: 'organ',
    description:
      'Strings in three octaves that fade in over a second and a half from silence, turned by a glacial phaser.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { volume: -7.5, attack: 0.3, low: 0.5, tone: 4800 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 1500 } },
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'reeds-never-stop-wax-gone-soft',
    name: 'Wax gone soft',
    category: 'pad',
    description: 'Detuned strings made hollow by a negative flanger, heard from across a room.',
    preview: HALF_STEP,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { volume: -2.5, attack: 0.8, speed: 1.5, tone: 2600 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.45 } },
      { deviceId: 'distance', preset: 'Across the room' },
    ],
  },
  {
    id: 'reeds-never-stop-cabinet-of-reeds',
    name: 'Cabinet of reeds',
    category: 'organ',
    description:
      'Plain saws with the octave above, through a slow rotary cabinet heard across the room and a hot valve.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { attack: 0.25, release: 1.2, low: 0.1, high: 0.9, tone: 6500 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { speed: 0 } },
      { deviceId: 'patina', preset: 'Hot valve', params: { wobble: 0 } },
    ],
  },
  {
    id: 'reeds-never-stop-bed-for-a-high-page',
    name: 'Bed for a high page',
    category: 'drone',
    description:
      'A low fog of strings whose bands swell on slow cycles of their own, under a low cathedral.',
    preview: PEDAL,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 1.5, low: 0.7, tone: 700 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Deep swell' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'reeds-never-stop-long-intake',
    name: 'Long intake',
    category: 'pad',
    description:
      'Cellos that take three seconds to swell, their strongest partials redrawn as sines an octave up.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 3, release: 5, low: 0.5, tone: 1100 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-nasal-pane',
    name: 'Nasal pane',
    category: 'voice',
    description:
      'A wide slow ensemble pressed into a thin vowel, with a faint blooming reverb behind it.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.9, low: 0, tone: 5200 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Thin vowel' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow' },
    ],
  },
  {
    id: 'reeds-never-stop-floor-of-the-court',
    name: 'Floor of the court',
    category: 'drone',
    description:
      'A bowed bass with organ octaves added above and below it, then warmed by a triode.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { attack: 0.6, release: 1.8, low: 0.5, tone: 800 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
    ],
  },
  {
    id: 'reeds-never-stop-second-page-turning',
    name: 'Second page turning',
    category: 'texture',
    description:
      'Ensemble strings under a slowly moving low-pass filter, kept on a two second tape loop that fades pass by pass.',
    preview: LET_RING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { low: 0.1, release: 1 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 2000 } },
      { deviceId: 'tape-loop', preset: 'Two decks', params: { length: 2.2, mix: 0.5 } },
    ],
  },
  {
    id: 'reeds-never-stop-pane-climbing',
    name: 'Pane climbing',
    category: 'pad',
    description: 'Slow glass strings that feed a reverb whose tail climbs by fifths.',
    preview: LET_RING,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 2, release: 3, high: 0.4, tone: 2800, speed: 0.6, width: 1 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.5, shimmer: 0.45 } }],
  },
  // Organ: bellows and reed ranks, the pack's centre.
  {
    id: 'reeds-never-stop-kotsu-on-the-bellows',
    name: 'Kotsu on the bellows',
    category: 'organ',
    description:
      'A reed rank with a little octave and a shallow bellows, no tremulant, in a hall with an airy tail.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'organ',
      params: {
        sub: 0,
        octave: 0.2,
        twelfth: 0,
        fifteenth: 0.1,
        reed: 0.8,
        celeste: 0,
        breath: 0.3,
        bellows: 0.15,
        tremulant: 0,
        attack: 0.35,
        release: 1,
        tone: 5200,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.35 } }],
  },
  {
    id: 'reeds-never-stop-pump-in-the-gatehouse',
    name: 'Pump in the gatehouse',
    category: 'organ',
    description:
      'A pump organ with deep bellows through a combo loudspeaker, the murmur of an empty room under it.',
    preview: KOTSU_TO_BO,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { volume: -16, attack: 0.3, release: 0.8, bellows: 1, reed: 0.6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.4, distance: 0.2 } },
      { deviceId: 'noise-floor', preset: 'Empty room' },
    ],
  },
  {
    id: 'reeds-never-stop-strings-in-the-chest',
    name: 'Strings in the chest',
    category: 'drone',
    description:
      'A shruti box with full bellows and a bank of strings that learn its notes and ring with them.',
    preview: PEDAL,
    instrument: { deviceId: 'organ', preset: 'Shruti box', params: { attack: 0.8, tone: 2800 } },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { mode: 2, strings: 8, decay: 5, mix: 0.5 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-hand-drawn-breath',
    name: 'Hand-drawn breath',
    category: 'organ',
    description:
      'Beating free reeds with deep bellows, a second breath of level over them, their top rolled off.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { attack: 0.5, release: 0.8, octave: 0.1 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Tide',
        params: { in: 2.2, hold: 0.1, out: 2.4, rest: 0.1, depth: 0.7, vary: 0 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 2600 } },
    ],
  },
  {
    id: 'reeds-never-stop-stopped-with-a-thumb',
    name: 'Stopped with a thumb',
    category: 'organ',
    description:
      'Flute pipes sounded again inside a large stopped pipe, beside a short slap of plate.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.25, sub: 0.2, breath: 0.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Cistern', params: { size: 1.5, mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-sun-through-the-comb',
    name: 'Sun through the comb',
    category: 'organ',
    description:
      'Beating flutes with a fifteenth over them, each band glinting on its own small tremolo, in a bright reverb.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { volume: -14, fifteenth: 0.5, reed: 0.2, tone: 7000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reeds-never-stop-reed-with-a-round-mouth',
    name: 'Reed with a round mouth',
    category: 'voice',
    description:
      'A reed stop with no tremulant, shaped by a round vowel and followed by a vibrato that waits.',
    preview: LEADING_PIPE,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0, attack: 0.3, tone: 3200 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Round vowel' },
      { deviceId: 'late-vibrato', preset: 'Long patience', params: { wait: 600, grow: 900 } },
    ],
  },
  {
    id: 'reeds-never-stop-pane-that-turns',
    name: 'Pane that turns',
    category: 'organ',
    description:
      'A bright organ that takes two seconds to open, sieved so that only what stays between chords is loud.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { volume: -14.5, attack: 2, release: 3, sub: 0 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Only what stays' }],
  },
  {
    id: 'reeds-never-stop-behind-paper-doors',
    name: 'Behind paper doors',
    category: 'organ',
    description:
      'Reed and flute ranks with a strong celeste and no sub, muffled, just under water, where they waver.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { volume: -13.5, tone: 1000, sub: 0, celeste: 0.9, breath: 0.7, attack: 0.5 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Just under',
        params: { surface: 0.6, bubbles: 0, waver: 0.5 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-air-before-the-reed',
    name: 'Air before the reed',
    category: 'wind',
    description:
      'A flute stop that is mostly wind, its breath turned up from inside, in a very long reverb.',
    preview: KOTSU_TO_OTSU,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { volume: -18, attack: 0.5, reed: 0.15, bellows: 0.9 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Breath' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'reeds-never-stop-two-pipes-disagreeing',
    name: 'Two pipes disagreeing',
    category: 'organ',
    description:
      'A hollow twelfth stop and some reed, shifted by less than a hertz against itself, so the cluster turns over slowly.',
    preview: HALF_STEP,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { twelfth: 0.5, reed: 0.35, attack: 0.4 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Detuned',
        params: { fine: 0.7, feedback: 0.2, mix: 0.5 },
      },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'reeds-never-stop-pedal-for-the-hands',
    name: 'Pedal for the hands',
    category: 'drone',
    description:
      'A deep pedal stop with a glassy string pad an octave up growing out of it half a second later.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { sub: 0.6, octave: 0.2, tone: 1400 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { rise: 0.5, fall: 2.5, mix: 0.6 } },
    ],
  },
  {
    id: 'reeds-never-stop-charcoal-brazier',
    name: 'Charcoal brazier',
    category: 'organ',
    description:
      'A beating celeste with some reed over a soft sub, blurred, gently fuzzed and left glowing.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { attack: 0.9, release: 2, sub: 0.35, reed: 0.4, tone: 2600 },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-next-breath-already',
    name: 'Next breath already',
    category: 'organ',
    description:
      'Reed pipes slow to speak, answered faintly by themselves, in a reverb that lets them in by slow waves.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 1.2, release: 2, sub: 0, twelfth: 0, reed: 0.7, celeste: 0, tone: 3800 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Faint answer',
        params: { interval1: 0, interval2: 0, interval3: 0, interval4: 0, gap: 1.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.45 } },
    ],
  },
  // Choir: the same hands as throats, from an even hum to breath alone.
  {
    id: 'reeds-never-stop-court-at-prayer',
    name: 'Court at prayer',
    category: 'voice',
    description:
      'A section on ah with no vibrato, its notes joined to a hall that sings the same vowel.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Airport ah',
      params: { vibrato: 0, motion: 0.1, attack: 0.7, ensemble: 0.9 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 5, mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-throats-for-bamboo',
    name: 'Throats for bamboo',
    category: 'voice',
    description:
      'High voices on a thin ee sounded inside an open pipe, with a short bright chamber after them.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.5, release: 1.4, breath: 0.3 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { size: 0.6, mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'reeds-never-stop-only-the-inhale',
    name: 'Only the inhale',
    category: 'voice',
    description:
      'Voices that are almost all breath, opened and closed by a deep slow cycle of in and out.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 1, release: 2.2, tone: 6000 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Held then let go',
        params: { in: 2, hold: 0.6, out: 1.8, rest: 0.2, depth: 0.7, vary: 0 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-monks-under-the-pipes',
    name: 'Monks under the pipes',
    category: 'drone',
    description:
      'Dark low voices with no vibrato, a clean octave doubled below, carried by slow swells in three bands.',
    preview: PEDAL,
    instrument: { deviceId: 'choir', preset: 'Low monks', params: { attack: 0.9, release: 2.5 } },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'currents', preset: 'Undertow', params: { bands: 3 } },
    ],
  },
  {
    id: 'reeds-never-stop-hum-beneath-the-eaves',
    name: 'Hum beneath the eaves',
    category: 'voice',
    description: 'A closed hum on a little valve drive, set back and darkened as if through fog.',
    preview: OCTAVE_BELOW,
    instrument: { deviceId: 'choir', preset: 'Humming', params: { attack: 0.8, tone: 1300 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.5 } },
      { deviceId: 'distance', preset: 'Through fog', params: { distance: 0.6 } },
    ],
  },
  {
    id: 'reeds-never-stop-vowel-by-vowel',
    name: 'Vowel by vowel',
    category: 'voice',
    description:
      'Voices drifting through every vowel, their bands delayed so each chord opens from the outside in.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { attack: 1, release: 3, motion: 1 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Edges first', params: { time: 1200, mix: 0.6 } },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'reeds-never-stop-leader-of-the-six',
    name: 'Leader of the six',
    category: 'voice',
    description: 'One singer to a note on eh, straight at first, then swaying, on a plate.',
    preview: LEADING_PIPE,
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 0, attack: 0.25, release: 1.2, vowel: 0.3 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 600 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'reeds-never-stop-six-mouths-as-one',
    name: 'Six mouths as one',
    category: 'voice',
    description:
      'Breathy straight altos made into a flock of sixteen that turns slowly round the listener.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Altos eh',
      params: { vibrato: 0, motion: 0, ensemble: 0.2, breath: 0.5, tone: 12000, attack: 0.3 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble', params: { speed: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-what-both-chords-know',
    name: 'What both chords know',
    category: 'texture',
    description:
      'Soft voices through a filter that favours what was sounding two seconds before and lets it ring on.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'choir',
      preset: 'Distant choir',
      params: { attack: 0.8, release: 2, tone: 4200, breath: 0.2 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Two seconds ago', params: { ring: 0.75, mix: 0.85 } },
    ],
  },
  {
    id: 'reeds-never-stop-trebles-on-a-dark-tray',
    name: 'Trebles on a dark tray',
    category: 'voice',
    description:
      'Treble voices near oo, with small singing bowls tuned to C pentatonic ringing along.',
    preview: KOTSU_TO_OTSU,
    instrument: {
      deviceId: 'choir',
      preset: 'Drifting trebles',
      params: { attack: 0.4, motion: 0.3, vowel: 0.9 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Ten bright bowls', params: { root: 0, scale: 0, mix: 0.55 } },
    ],
  },
  {
    id: 'reeds-never-stop-chant-on-a-worn-strip',
    name: 'Chant on a worn strip',
    category: 'voice',
    description: 'Tenors on oh through a worn cassette, heard again backwards under themselves.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'choir',
      preset: 'Tenors oh',
      params: { attack: 0.5, release: 1.6, vibrato: 4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.25 } },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 1400, mix: 0.4 } },
    ],
  },
  {
    id: 'reeds-never-stop-cloud-of-small-mouths',
    name: 'Cloud of small mouths',
    category: 'voice',
    description:
      'Boys on oo blurred into a hanging mist that keeps each cluster going after it changes.',
    preview: LET_RING,
    instrument: { deviceId: 'choir', preset: 'Boys ooh', params: { attack: 0.3, release: 1 } },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.75, mix: 0.65 } },
    ],
  },
  {
    id: 'reeds-never-stop-breath-of-ichi',
    name: 'Breath of ichi',
    category: 'voice',
    description:
      'Breathy voices on ee, a reed buzz fed back softly behind them, with the air on top brought up.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'choir',
      preset: 'Breathy ee',
      params: { volume: -16, attack: 0.6, breath: 0.5, width: 0.6, tone: 5000 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Reed buzz', params: { mix: 0.3 } },
      { deviceId: 'lift', preset: 'Air on top' },
    ],
  },
  // Wavetable: pipes drawn as waves, reed to saw and hollow tables first.
  {
    id: 'reeds-never-stop-bo-on-a-thin-reed',
    name: 'Bo on a thin reed',
    category: 'organ',
    description:
      'A plain reed wave from the start of its table, its level and width opened and closed by a slow breath.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { sub: 0, position: 0.1, cutoff: 5200, attack: 0.3, release: 1 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Opening wide',
        params: { in: 2.2, hold: 0.1, out: 2.2, depth: 0.55, colour: 0.4, width: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'reeds-never-stop-reed-grows-teeth',
    name: 'Reed grows teeth',
    category: 'pad',
    description:
      'A reed wave that travels toward saw and back every few seconds, through an open low-pass, wide.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: {
        position: 0.55,
        motion: 0.9,
        rate: 0.25,
        detune: 12,
        sub: 0,
        cutoff: 8000,
        attack: 0.5,
        release: 1.5,
      },
    },
    effects: [{ deviceId: 'spread', preset: 'Wide top' }],
  },
  {
    id: 'reeds-never-stop-hollow-of-the-hand',
    name: 'Hollow of the hand',
    category: 'pad',
    description:
      'A hollow wave drifting along its table, with organ flute stops speaking half a second late behind it.',
    preview: KOTSU_TO_BO,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.8, release: 2, sub: 0, cutoff: 2600, rate: 0.12 },
    },
    effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { speak: 500, chiff: 0.6 } }],
  },
  {
    id: 'reeds-never-stop-ice-in-the-gutter',
    name: 'Ice in the gutter',
    category: 'pad',
    description:
      'A glass wave with no sub, every attack fogged, its tail thrown two octaves up in a bright halo.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { sub: 0, position: 0.7, cutoff: 12000, attack: 0.4, release: 2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack' },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reeds-never-stop-beat-between-pipes',
    name: 'Beat between pipes',
    category: 'organ',
    description:
      'Two sines a key, tuned well apart so they beat, swelling and sinking as if on slow bellows.',
    preview: HALF_STEP,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { detune: 34, attack: 0.4, release: 1.6, spread: 0.8 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.4, depth: 0.65 } }],
  },
  {
    id: 'reeds-never-stop-pane-lit-from-below',
    name: 'Pane lit from below',
    category: 'pad',
    description:
      'A frozen spectral wave whose bands brighten one after another from the bottom, in ripples.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Frozen spectrum',
      params: { position: 0.6, attack: 0.5, release: 2, cutoff: 6000 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.9 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reeds-never-stop-wind-chest',
    name: 'Wind chest',
    category: 'drone',
    description:
      'A dark reed wave with a strong sub an octave down, pushed through a warm stack loudspeaker.',
    preview: PEDAL,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.8, release: 2, sub: 0.7, cutoff: 700, position: 0.3 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'reeds-never-stop-hum-of-the-wax',
    name: 'Hum of the wax',
    category: 'voice',
    description:
      'A vowel wave held at its closed end, its partials redrawn by lingering sines, softly wavering on tape.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.9, release: 2, cutoff: 1800 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'reeds-never-stop-nose-of-the-court-oboe',
    name: 'Nose of the court oboe',
    category: 'wind',
    description:
      'A narrow pulse with a nasal resonance added in octaves, standing in a stone stairwell.',
    preview: LEADING_PIPE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.15, release: 0.9, cutoff: 4500 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Nasal reed' },
      { deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.35 } },
    ],
  },
  {
    id: 'reeds-never-stop-cluster-seen-in-mist',
    name: 'Cluster seen in mist',
    category: 'texture',
    description:
      'A spectral cloud turned to breath and whisper by smearing its phases, then washed in surf.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 0.9, release: 2.5, rate: 0.1 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Whisper', params: { mix: 0.7 } },
      { deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.2 } },
    ],
  },
  {
    id: 'reeds-never-stop-long-wing-folded',
    name: 'Long wing folded',
    category: 'pad',
    description:
      'A hollow wave that swells over three seconds and swings slowly through a twelve-stage phaser.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Long hollow wash',
      params: { attack: 3, release: 5, sub: 0.1, cutoff: 5000 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-overtones-on-the-sill',
    name: 'Overtones on the sill',
    category: 'texture',
    description:
      'A resonant, moving spectral wave, its overtones tamed where they stick out, in a breathing pulse of reverb.',
    preview: KOTSU_TO_OTSU,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { attack: 0.6, release: 2, resonance: 0.7, cutoff: 2400 },
    },
    effects: [
      { deviceId: 'tamer', preset: 'Ringing tones' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'reeds-never-stop-fluttering-tongue',
    name: 'Fluttering tongue',
    category: 'wind',
    description:
      'A vowel wave fluttering fast between mouths, followed by a soft pad that swells in behind it.',
    preview: LET_RING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Vowel flutter',
      params: { volume: -5, attack: 0.2, release: 0.8, motion: 0.4, rate: 5.5 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 1.2, mix: 0.6 } }],
  },
  {
    id: 'reeds-never-stop-morning-tuning-of-six',
    name: 'Morning tuning of six',
    category: 'bell',
    description:
      'Glass keys with a clear start and a six second release, held on as an even pad by a sustainer.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { attack: 0.02, position: 0.8, cutoff: 9000 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Glass organ', params: { mix: 0.6 } }],
  },
  {
    id: 'reeds-never-stop-cloth-over-the-windway',
    name: 'Cloth over the windway',
    category: 'pad',
    description:
      'A nearly pure wave with a strong sub, weighted by a tape preamp and played off a record with a dull stylus.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { volume: -20, sub: 0.6, attack: 0.6, release: 2, position: 0.15 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.4 } },
      { deviceId: 'vinyl', preset: 'Dull stylus' },
    ],
  },
  {
    id: 'reeds-never-stop-choir-of-waves-at-dusk',
    name: 'Choir of waves at dusk',
    category: 'voice',
    description:
      'A slow vowel wave wandering between mouths, in a long reverb that takes it in by slow waves.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { volume: -3, attack: 1, release: 2, rate: 0.15, cutoff: 3200 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Slow swell',
        params: { breathRate: 0.25, decay: 8, mix: 0.6 },
      },
    ],
  },
  // Graft: modelled breath and bow on pipes, strings, bars and bowls.
  {
    id: 'reeds-never-stop-reed-in-its-socket',
    name: 'Reed in its socket',
    category: 'wind',
    description:
      'Breath on a stopped pipe with a bright edge and almost no air, dry but for a tight chamber.',
    preview: KOTSU_TO_BO,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: { pressure: 0.6, bright: 0.85, air: 0.08, swell: 0.25, release: 0.5, wander: 0.1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } }],
  },
  {
    id: 'reeds-never-stop-rain-in-the-pipe',
    name: 'Rain in the pipe',
    category: 'wind',
    description:
      'A pipe blown with far more air than tone, rained on lightly, its quiet breath turned up.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: { pressure: 0.25, bright: 0.35, air: 0.95, swell: 0.5, release: 0.9 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Touch' },
      { deviceId: 'weather', preset: 'Light rain' },
    ],
  },
  {
    id: 'reeds-never-stop-blow-in-draw-out',
    name: 'Blow in, draw out',
    category: 'wind',
    description:
      'Breath set on a string, slow to speak, swelling and sinking in a long breath that also closes its tone.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { swell: 0.7, release: 1.8, bright: 0.65, pressure: 0.6 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Dark lungs',
        params: { in: 2, hold: 0.1, out: 2.2, rest: 0.1, depth: 0.6, vary: 0 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-pane-of-drawn-wire',
    name: 'Pane of drawn wire',
    category: 'string',
    description:
      'A bright string bowed near its end, in a bright hall, with only its air spread wide.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: { position: 0.08, bright: 0.85, swell: 0.4, release: 1.4, width: 1 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.35 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'reeds-never-stop-bow-across-the-mouth',
    name: 'Bow across the mouth',
    category: 'wind',
    description:
      'A bow on a stopped pipe, dark and slow, with an octave pipe above that speaks after it.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: { bright: 0.2, swell: 0.8, release: 1.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Octave above', params: { speak: 600, octave: 0.7, mix: 0.6 } },
    ],
  },
  {
    id: 'reeds-never-stop-bars-kept-breathing',
    name: 'Bars kept breathing',
    category: 'bell',
    description:
      'Breath on metal bars, the attack gone, each chord held on in a still halo after the keys.',
    preview: LET_RING,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: { swell: 0.5, release: 1.5, bright: 0.7, decay: 6 },
    },
    effects: [{ deviceId: 'melt', preset: 'Still halo', params: { mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-gold-leaf-bars',
    name: 'Gold leaf bars',
    category: 'bell',
    description:
      'Bowed bars circling slowly round the listener, with a faint halo of bowls tuned to C pentatonic.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { swell: 0.35, release: 2.5, pressure: 0.6 },
    },
    effects: [
      { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.3 } },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'reeds-never-stop-bowl-of-still-air',
    name: 'Bowl of still air',
    category: 'drone',
    description:
      'A bowl blown softly with much air, its partials stretched a little apart by a slow warp.',
    preview: HALF_STEP,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: { swell: 0.6, release: 2.2, bright: 0.45, decay: 6 },
    },
    effects: [{ deviceId: 'warp', preset: 'Thin glow', params: { mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-bronze-rim-one-breath',
    name: 'Bronze rim, one breath',
    category: 'bell',
    description:
      'A bowed bowl that takes a second to sing, let through only where chords share a note, on a dark plate.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: { swell: 1, release: 3, bright: 0.6, position: 0.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Common tones', params: { mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reeds-never-stop-lead-tuning-weights',
    name: 'Lead tuning weights',
    category: 'plucked',
    description:
      'A plucked pipe caught by a sustainer, so the puff of the pluck starts a tone that then holds even.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: { volume: -3.5, decay: 5, bright: 0.45, air: 0.15, release: 2 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { attack: 0.1, mix: 0.7 } },
    ],
  },
  {
    id: 'reeds-never-stop-fingertip-on-the-hole',
    name: 'Fingertip on the hole',
    category: 'keys',
    description:
      'Struck pipes turned to swells: the knock is faded in over half a second and an ether room holds the rest.',
    preview: LET_RING,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck pipe',
      params: { decay: 6, release: 1.5, bright: 0.65 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 500, depth: 0.95 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'reeds-never-stop-zither-answering-reeds',
    name: 'Zither answering reeds',
    category: 'plucked',
    description:
      'A plucked string sounding once, its echoes fanned out from high to low so it goes on like held pipes.',
    preview: LET_RING,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked string',
      params: { volume: -1, decay: 8, bright: 0.4, release: 2 },
    },
    effects: [
      { deviceId: 'prism', preset: 'High to low', params: { feedback: 0.6, mix: 0.5 } },
      { deviceId: 'fog', preset: 'Slow rise', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'reeds-never-stop-pedal-drawn-on-gut',
    name: 'Pedal drawn on gut',
    category: 'drone',
    description:
      'A dark bowed string pressed hard, warmed by a triode, each of its bands swelling by itself.',
    preview: PEDAL,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: { position: 0.45, bright: 0.15, swell: 0.9, release: 2, pressure: 0.8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'currents', preset: 'Breathing', params: { rate: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-lone-breath-north-wall',
    name: 'Lone breath, north wall',
    category: 'wind',
    description:
      'Breath on a string, straight at first and swaying late, heard from well back in a hall.',
    preview: LEADING_PIPE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: { swell: 0.2, bright: 0.4, air: 0.5, pressure: 0.4, wander: 0.1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.5 } },
    ],
  },
  {
    id: 'reeds-never-stop-snow-on-the-pipe-ends',
    name: 'Snow on the pipe ends',
    category: 'wind',
    description:
      'A bright bowed pipe thinned and frozen at the winter end of a dial of seasons, with its wide tail.',
    preview: KOTSU_TO_OTSU,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: { bright: 0.75, swell: 0.4, position: 0.2, air: 0.4, release: 1.4 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
  },
  {
    id: 'reeds-never-stop-smaller-mouth-organ',
    name: 'Smaller mouth organ',
    category: 'wind',
    description:
      'A soft airy blown bar made small in the body and doubled fourteen cents out on each side.',
    preview: KOTSU_TO_BO,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: { pressure: 0.35, bright: 0.2, air: 0.6, swell: 0.3, release: 0.8 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller' },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'reeds-never-stop-bed-of-bowed-metal',
    name: 'Bed of bowed metal',
    category: 'drone',
    description:
      'Bowed bars kept dark and slow, a copy an octave lower following less than half a second behind.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: { bright: 0.25, swell: 1.2, release: 3, position: 0.6 },
    },
    effects: [{ deviceId: 'canon', preset: 'Octave shadow' }],
  },
  // Tape orchestra: the cluster played off strips of tape, reeds first.
  {
    id: 'reeds-never-stop-strip-of-court-reeds',
    name: 'Strip of court reeds',
    category: 'wind',
    description:
      'Taped reeds with few players and hardly any vibrato, breathing in level and width, with no room.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.25, release: 0.8, players: 0.2, vibrato: 0.05, age: 0.1, hiss: 0.05 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide', params: { in: 2, out: 2, depth: 0.5 } },
    ],
  },
  {
    id: 'reeds-never-stop-reeds-at-half-pace',
    name: 'Reeds at half pace',
    category: 'drone',
    description:
      'Many reeds on tape at half speed, an octave down, bright in tone and slow to start, in a dark hall.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { attack: 0.7, release: 2 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
  },
  {
    id: 'reeds-never-stop-six-flutes-no-tongue',
    name: 'Six flutes, no tongue',
    category: 'wind',
    description:
      'Still flutes, one player each, faded in and blurred so no onset is left, wide apart.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.5, release: 1.4, spread: 1 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Pad softener' },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },
  {
    id: 'reeds-never-stop-paper-lantern-flutes',
    name: 'Paper lantern flutes',
    category: 'wind',
    description:
      'Wavering taped flutes sounded inside a blown bottle, their echoes scattered like points.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.5 } },
      { deviceId: 'constellation', preset: 'Faint points' },
    ],
  },
  {
    id: 'reeds-never-stop-brass-behind-a-screen',
    name: 'Brass behind a screen',
    category: 'wind',
    description:
      'A horn chorale with almost no vibrato and a slow start, made dark and narrow by distance.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.5, release: 1.4, vibrato: 0.05, tone: -0.2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Dark and narrow' }],
  },
  {
    id: 'reeds-never-stop-horns-for-a-low-bed',
    name: 'Horns for a low bed',
    category: 'drone',
    description:
      'Horns slowed to half speed, an octave down, with their written octave added above, in a low cathedral.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.6, hiss: 0.1 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Organ', params: { sub2: 0, sub1: 0, up1: 0.55, up2: 0.15 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'reeds-never-stop-choir-on-one-strip',
    name: 'Choir on one strip',
    category: 'voice',
    description:
      'A taped choir whose shared tones hang over each change, let out band by band from the bottom.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.4, vibrato: 0.15 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes' },
      { deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1400, mix: 0.4 } },
    ],
  },
  {
    id: 'reeds-never-stop-moth-eaten-robes',
    name: 'Moth-eaten robes',
    category: 'voice',
    description:
      'A worn choir that wobbles, through a starved audio stream that swirls as if behind glass.',
    preview: HALF_STEP,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { attack: 0.5, hiss: 0.2 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-violins-for-pipes',
    name: 'Violins for pipes',
    category: 'string',
    description:
      'A few violins with no vibrato, pressed into the colour of a hollow tube, in a bright plate.',
    preview: KOTSU_TO_OTSU,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.3, release: 0.9, vibrato: 0, hiss: 0.1, age: 0.2 },
    },
    effects: [
      { deviceId: 'imprint', preset: 'Hollow tube' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-sleeves-of-the-players',
    name: 'Sleeves of the players',
    category: 'string',
    description:
      'Slow full strings with their own sines an octave down, the whole rising and sinking on a slow swell.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.7, vibrato: 0.15, age: 0.15 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.3, depth: 0.55 } },
    ],
  },
  {
    id: 'reeds-never-stop-cello-under-the-mat',
    name: 'Cello under the mat',
    category: 'string',
    description:
      'A cello bed at half speed, an octave down, taken under water where it wavers slowly.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 0.6, tone: 0.3 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Slow swell', params: { bubbles: 0 } }],
  },
  {
    id: 'reeds-never-stop-last-reel-of-the-reeds',
    name: 'Last reel of the reeds',
    category: 'texture',
    description:
      'Old fluttering reeds going over a shortwave link, with their own tape hiss and the station whistling.',
    preview: TWO_BREATHS,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { attack: 0.3, release: 1.2, age: 0.9, hiss: 0.5, players: 0.9 },
    },
    effects: [{ deviceId: 'radio', preset: 'Night shortwave', params: { mix: 0.8 } }],
  },
  {
    id: 'reeds-never-stop-ox-cart-reeds',
    name: 'Ox-cart reeds',
    category: 'wind',
    description:
      'Plain reeds, driven through a horn loudspeaker some way off and swirled by a slow rotor.',
    preview: KOTSU_TO_BO,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: {
        volume: -16,
        attack: 0.1,
        release: 0.5,
        tone: 0.8,
        age: 0.3,
        players: 0,
        spread: 0.2,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.45, mix: 0.8 } },
      { deviceId: 'rotary', preset: 'Chorale' },
    ],
  },
  {
    id: 'reeds-never-stop-veil-over-the-cellos',
    name: 'Veil over the cellos',
    category: 'string',
    description:
      'A cello section with a higher string pad that grows in behind each finger change, shaded at the top.',
    preview: OCTAVE_BELOW,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { attack: 0.4, vibrato: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.9, mix: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'reeds-never-stop-choir-running-to-breath',
    name: 'Choir running to breath',
    category: 'voice',
    description:
      'A full choir slowed an octave down, over a copy of itself that sags a little in pitch the longer it rings.',
    preview: LET_RING,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slowed choir',
      params: { attack: 0.8, release: 2, hiss: 0.2 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } }],
  },
  {
    id: 'reeds-never-stop-sunk-below-the-pipes',
    name: 'Sunk below the pipes',
    category: 'drone',
    description:
      'Dull strings slowed an octave down, over a second in rising, with a long dark tape echo trailing them.',
    preview: LOW_BED,
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: { attack: 1.2, release: 3, hiss: 0.2, tone: -0.6, vibrato: 0.4 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.4 } }],
  },
  // Flock and staircase: pipes that glide to their holes, and a pane that climbs and never arrives.
  {
    id: 'reeds-never-stop-cranes-over-the-court',
    name: 'Cranes over the court',
    category: 'pad',
    description:
      'A reedy flock that gathers round each note from both sides, in a reverb that rises and falls in waves.',
    preview: ICHI_TO_KOTSU,
    instrument: {
      deviceId: 'flock',
      preset: 'Reed choir',
      params: { gather: 0.6, stray: 0.1, flutter: 0.2, octaves: 0 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.4 } }],
  },
  {
    id: 'reeds-never-stop-two-hollow-pipes-gliding',
    name: 'Two hollow pipes gliding',
    category: 'wind',
    description:
      'Pairs of hollow voices sliding up to pitch, opened and closed by a slow breath, on a hint of plate.',
    preview: ONE_ROUND,
    instrument: {
      deviceId: 'flock',
      preset: 'Hollow pair',
      params: { gather: 0.35, stray: 0.05, leave: 1 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Calm breath',
        params: { in: 1.8, out: 2.2, depth: 0.5, vary: 0 },
      },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'reeds-never-stop-murmur-under-the-gate',
    name: 'Murmur under the gate',
    category: 'drone',
    description:
      'A slow low murmur of seven gliding voices with a bank of strings ringing along in C.',
    preview: PEDAL,
    instrument: {
      deviceId: 'flock',
      preset: 'Low murmur',
      params: { volume: -14.5, gather: 1.5, stray: 0.15, leave: 2 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { root: 0, mix: 0.4 } }],
  },
  {
    id: 'reeds-never-stop-glass-cranes-settle',
    name: 'Glass cranes settle',
    category: 'texture',
    description:
      'Glassy voices falling in from above and settling, in a bright swarm of short echoes.',
    preview: PIPES_ENTER,
    instrument: {
      deviceId: 'flock',
      preset: 'Glass swarm',
      params: { gather: 1, from: 1, flutter: 0.6, octaves: 0.3, stray: 0.1 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Glinting', params: { mix: 0.3 } }],
  },
  {
    id: 'reeds-never-stop-cluster-walks-upstairs',
    name: 'Cluster walks upstairs',
    category: 'organ',
    description:
      'Reedy octaves that walk up the held cluster forever, one pipe at a time, through a slow breath.',
    preview: BO_TO_OTSU,
    instrument: {
      deviceId: 'staircase',
      preset: 'Reed stairs',
      params: { speed: 0.3, slide: 0.3, centre: 900, attack: 0.3 },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Box breathing',
        params: { in: 1.5, hold: 0.5, out: 1.5, rest: 0.2 },
      },
    ],
  },
  {
    id: 'reeds-never-stop-pane-without-a-top',
    name: 'Pane without a top',
    category: 'organ',
    description:
      'Still stacked octaves that neither rise nor fall, shaded by a hollow chorus and a spring.',
    preview: BO_TO_ICHI,
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { centre: 1200, shape: 0.6, attack: 0.4, release: 1 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'reeds-never-stop-bed-that-sinks-forever',
    name: 'Bed that sinks forever',
    category: 'drone',
    description:
      'A low wide tone gliding down without end, evened by a slow compressor with its low end lifted.',
    preview: PEDAL,
    instrument: {
      deviceId: 'staircase',
      preset: 'Low tide',
      params: { volume: -13.5, speed: -0.1, centre: 200, attack: 1.2, release: 2.5 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
      { deviceId: 'lift', preset: 'Warm floor' },
    ],
  },
]
