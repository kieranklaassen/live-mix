import { type FactoryPreset, type Phrase } from '../types'

// One breath is one phrase: it begins as almost nothing, opens, most often leans by a half step onto
// a covered note as the air runs out, and is followed by silence. The mode is E F A B D on white keys, with C
// only where it leans down onto B. Laid out as five openings (air, swell, finger, scoop, rough) by
// five endings (cut, thin out, sink, shake, stay in a room) and how far each hole is covered.

// One breath and the silence after it: E as a grace, F held, sinking to a soft E.
const ONE_BREATH: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 64, gain: 0.29 },
    { atSec: 0.5, durSec: 3.5, note: 65, gain: 0.65 },
    { atSec: 4, durSec: 1.3, note: 64, gain: 0.33 },
  ],
}

// A whole breath downhill, B A F E: up to B by a grace of A, then each note softer than the last.
const DOWNHILL: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.35, note: 69, gain: 0.39 },
    { atSec: 0.35, durSec: 2.75, note: 71, gain: 0.68 },
    { atSec: 3.1, durSec: 0.5, note: 69, gain: 0.52 },
    { atSec: 3.6, durSec: 1.5, note: 65, gain: 0.47 },
    { atSec: 5.1, durSec: 1, note: 64, gain: 0.31 },
  ],
}

// The hard limit, first half: two breaths of two seconds and silences as long. A B A; C leaning down to B.
const TWO_OF_FOUR: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.95, note: 69, gain: 0.48 },
    { atSec: 0.95, durSec: 0.25, note: 71, gain: 0.65 },
    { atSec: 1.2, durSec: 0.8, note: 69, gain: 0.39 },
    { atSec: 4, durSec: 0.7, note: 72, gain: 0.68 },
    { atSec: 4.7, durSec: 1.3, note: 71, gain: 0.39 },
  ],
}

// The other half: A F E; E F E. Eleven notes in the four breaths, one under the twelve allowed.
const OTHER_TWO: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 69, gain: 0.5 },
    { atSec: 0.5, durSec: 0.9, note: 65, gain: 0.55 },
    { atSec: 1.4, durSec: 0.6, note: 64, gain: 0.34 },
    { atSec: 4, durSec: 0.4, note: 64, gain: 0.39 },
    { atSec: 4.4, durSec: 0.9, note: 65, gain: 0.65 },
    { atSec: 5.3, durSec: 0.7, note: 64, gain: 0.33 },
  ],
}

// One B restruck by a finger: a 60 ms grace of D before each, faster and then slower again.
const FINGER_HITS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.24, note: 71, gain: 0.52 },
    { atSec: 1.24, durSec: 0.06, note: 74, gain: 0.52 },
    { atSec: 1.3, durSec: 0.84, note: 71, gain: 0.59 },
    { atSec: 2.14, durSec: 0.06, note: 74, gain: 0.55 },
    { atSec: 2.2, durSec: 0.54, note: 71, gain: 0.62 },
    { atSec: 2.74, durSec: 0.06, note: 74, gain: 0.57 },
    { atSec: 2.8, durSec: 0.34, note: 71, gain: 0.65 },
    { atSec: 3.14, durSec: 0.06, note: 74, gain: 0.57 },
    { atSec: 3.2, durSec: 0.24, note: 71, gain: 0.65 },
    { atSec: 3.44, durSec: 0.06, note: 74, gain: 0.57 },
    { atSec: 3.5, durSec: 0.36, note: 71, gain: 0.6 },
    { atSec: 3.86, durSec: 0.06, note: 74, gain: 0.52 },
    { atSec: 3.92, durSec: 0.62, note: 71, gain: 0.52 },
    { atSec: 4.54, durSec: 0.06, note: 74, gain: 0.44 },
    { atSec: 4.6, durSec: 1.3, note: 71, gain: 0.39 },
  ],
}

// The rough breath: a soft E leaps its octave, then silence, then F above it falls to E with no air left.
const ROUGH_BLOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.25, note: 64, gain: 0.3 },
    { atSec: 0.25, durSec: 2.15, note: 76, gain: 0.82 },
    { atSec: 4, durSec: 1.6, note: 77, gain: 0.7 },
    { atSec: 5.6, durSec: 0.8, note: 76, gain: 0.25 },
  ],
}

// One A for the head to shake, four seconds and a half; then its last air, a covered F into E.
const HEAD_SHAKE: Phrase = {
  notes: [
    { atSec: 0, durSec: 4.4, note: 69, gain: 0.65 },
    { atSec: 4.4, durSec: 0.5, note: 65, gain: 0.44 },
    { atSec: 4.9, durSec: 1.1, note: 64, gain: 0.31 },
  ],
}

// The lowest hole: E F E an octave down, silence, and E restruck by its own ghost.
const LOW_ROOT: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.4, note: 52, gain: 0.33 },
    { atSec: 0.4, durSec: 2.4, note: 53, gain: 0.68 },
    { atSec: 2.8, durSec: 0.9, note: 52, gain: 0.39 },
    { atSec: 5, durSec: 0.2, note: 52, gain: 0.29 },
    { atSec: 5.2, durSec: 1.3, note: 52, gain: 0.59 },
  ],
}

// Near the top: a grace of E, F held over it, back to E, and out on D.
const TOP_HOLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 76, gain: 0.36 },
    { atSec: 0.3, durSec: 2.7, note: 77, gain: 0.6 },
    { atSec: 3, durSec: 0.8, note: 76, gain: 0.47 },
    { atSec: 3.8, durSec: 1.8, note: 74, gain: 0.36 },
  ],
}

// Two players who share no breath: B and A above, and only when that air is gone F and E below.
const ANSWERED_BELOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.2, note: 71, gain: 0.62 },
    { atSec: 2.2, durSec: 0.9, note: 69, gain: 0.39 },
    { atSec: 3.9, durSec: 1.8, note: 53, gain: 0.65 },
    { atSec: 5.7, durSec: 0.9, note: 52, gain: 0.39 },
  ],
}

// For breath drawn backwards: F and, long before it lands, the E it leans on.
const DRAWN_IN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.4, note: 65, gain: 0.65 },
    { atSec: 2.2, durSec: 4, note: 64, gain: 0.49 },
  ],
}

// For breath drawn in so slowly that two at once would rub: A, and only when it has landed, the F below.
const NEXT_INHALE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 69, gain: 0.65 },
    { atSec: 3.1, durSec: 2.9, note: 65, gain: 0.55 },
  ],
}

// The low root alone, for what rings or opens slowly: E after its own ghost, silence, and E again, shorter.
const LOW_ALONE: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.25, note: 52, gain: 0.29 },
    { atSec: 0.25, durSec: 2.6, note: 52, gain: 0.66 },
    { atSec: 4.4, durSec: 0.2, note: 52, gain: 0.26 },
    { atSec: 4.6, durSec: 1.6, note: 52, gain: 0.48 },
  ],
}

// Three keys whose endings are the event: B let go into silence, then F let go into E.
const LET_GO: Phrase = {
  notes: [
    { atSec: 0, durSec: 2, note: 71, gain: 0.65 },
    { atSec: 3.4, durSec: 1.8, note: 65, gain: 0.65 },
    { atSec: 5.2, durSec: 1.4, note: 64, gain: 0.42 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'one-breath-each-lip-finds-the-edge',
    name: 'Lip finds the edge',
    category: 'wind',
    description:
      'A bamboo flute that is nearly all air for its first second, the air lifted above the tone and spread, then a short dark plate.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.95,
        blow: 0.1,
        chiff: 0,
        attack: 1.2,
        release: 0.45,
        vibrato: 0,
        scoop: 40,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'sift',
        params: { tones: -5, attacks: -20, air: 6, hold: 0.1, scatter: 0.5, sharpness: 0.3 },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.18, decay: 0.45, damping: 0.7 } },
    ],
  },
  {
    id: 'one-breath-each-burst-at-the-mouth-hole',
    name: 'Burst at the mouth hole',
    category: 'wind',
    description:
      'A bamboo flute blown as hard as it goes, bent up into each note and closed short, its breath thickened by a tube curve.',
    preview: ROUGH_BLOW,
    instrument: {
      deviceId: 'flute',
      preset: 'Bent from below',
      params: {
        breath: 0.85,
        blow: 1,
        chiff: 1,
        attack: 0.012,
        release: 0.2,
        vibrato: 0.1,
        scoop: 180,
        volume: -21,
      },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 14, bias: 0.2, toneDb: -3, outputDb: -4 },
      },
      { deviceId: 'spring-reverb', params: { mix: 0.12, decay: 1.2, tone: 2200, drive: 0.1 } },
    ],
  },
  {
    id: 'one-breath-each-three-holes-shaded',
    name: 'Three holes shaded',
    category: 'wind',
    description:
      'A wood flute blown gently and heard inside a soft stopped pipe, then filtered dull, so every note is half covered.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Soft recorder',
      params: {
        breath: 0.25,
        blow: 0.15,
        chiff: 0.1,
        attack: 0.3,
        release: 0.3,
        vibrato: 0,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: {
          body: 2,
          size: 1.6,
          material: 0.15,
          opening: 0.1,
          air: 0.1,
          tone: 0.2,
          width: 0.2,
          mix: 0.8,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 850 } },
    ],
  },
  {
    id: 'one-breath-each-chin-sinks-air-thins',
    name: 'Chin sinks, air thins',
    category: 'wind',
    description:
      'A bamboo flute with three seconds of release, each tail sagging by fifty cents a second and darkening as it goes.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.5,
        blow: 0.4,
        chiff: 0.3,
        attack: 0.25,
        release: 2.8,
        vibrato: 0.15,
        scoop: 20,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'melt',
        params: { sag: -50, hold: 3.5, solid: 60, blur: 0.5, dim: 0.6, drip: 0.1, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', params: { low: 2, presence: -3, highCut: 6000 } },
    ],
  },
  {
    id: 'one-breath-each-neck-still-then-not',
    name: 'Neck still, then not',
    category: 'wind',
    description:
      'A bamboo flute held straight for a second, then swayed wider and faster the longer it lasts, in a warm hall.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.35,
        blow: 0.35,
        chiff: 0.2,
        attack: 0.15,
        release: 1.6,
        vibrato: 0,
        scoop: 10,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 900, grow: 3200, depth: 90, rate: 3, swell: 0.6, quicken: 0.6, human: 0.4 },
      },
      {
        deviceId: 'hall-reverb',
        params: { preDelay: 40, lowDecay: 4, midDecay: 3, damping: 3500, mix: 0.3 },
      },
    ],
  },
  {
    id: 'one-breath-each-seven-taps-fourth-hole',
    name: 'Seven taps, fourth hole',
    category: 'wind',
    description:
      'A quick wood flute with no tongue and almost no breath, heard from a small speaker across the room.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        breath: 0.06,
        blow: 0.65,
        chiff: 0.02,
        attack: 0.006,
        release: 0.06,
        vibrato: 0,
        scoop: 0,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 0,
          drive: 0.15,
          bass: -0.4,
          treble: 0.2,
          distance: 0.65,
          room: 0.55,
          noise: 0,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-alms-road-no-one-out',
    name: 'Alms road, no one out',
    category: 'wind',
    description:
      'A low flute set far off in a bare, damped space, its highs gone and its position wandering slowly nearer and farther.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'flute',
      preset: 'Alto flute',
      params: {
        breath: 0.6,
        blow: 0.5,
        chiff: 0.5,
        attack: 0.1,
        release: 0.6,
        vibrato: 0.3,
        scoop: 30,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.9,
          room: 0.9,
          air: 0.9,
          wander: 0.6,
          rate: 0.08,
          decay: 0.6,
          level: 1,
          width: 0.4,
        },
      },
      { deviceId: 'ambient-eq', params: { low: 3, body: 2 } },
    ],
  },
  {
    id: 'one-breath-each-moss-between-the-pipes',
    name: 'Moss between the pipes',
    category: 'pad',
    description:
      'Pan pipes faded in and blurred into a cloud with no tail, then left out in a light rain that taps on them.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'flute',
      preset: 'Hollow pipes pad',
      params: {
        breath: 0.5,
        blow: 0.4,
        chiff: 0,
        attack: 0.35,
        release: 1.2,
        vibrato: 0.1,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 420, density: 0.9, layers: 3, drift: 0.5, soften: 0.6, damp: 0.5, mix: 1 },
      },
      { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.35, exposure: 0.4 } },
    ],
  },
  {
    id: 'one-breath-each-snow-on-the-last-hole',
    name: 'Snow on the last hole',
    category: 'wind',
    description:
      'A straight concert flute turned to deep winter: thinned, left with a small frozen tail and opened wide.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { breath: 0.4, blow: 0.5, attack: 0.2, release: 0.9, volume: -12 },
    },
    effects: [
      {
        deviceId: 'seasons',
        params: { year: 0.88, depth: 1, space: 0.7, motion: 0.5, grit: 0.35, tail: 0.7, turn: 0 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.72 } },
    ],
  },
  {
    id: 'one-breath-each-thumb-hole-ajar',
    name: 'Thumb hole ajar',
    category: 'wind',
    description:
      'Only the breath of a concert flute, squeezed to one resonant band with a faint dull tape echo of it.',
    preview: TOP_HOLES,
    instrument: {
      deviceId: 'flute',
      params: {
        type: 0,
        breath: 1,
        blow: 0.02,
        chiff: 0.3,
        attack: 0.4,
        release: 0.5,
        vibrato: 0.2,
        scoop: 60,
        volume: 5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 2,
          slope: 0,
          cutoffHz: 1500,
          resonance: 3.5,
          envAmount: 30,
          envAttackMs: 200,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'tape-echo', params: { time: 620, feedback: 0.2, highCut: 2500, mix: 0.18 } },
    ],
  },
  {
    id: 'one-breath-each-fundamental-let-in',
    name: 'Fundamental let in',
    category: 'wind',
    description:
      'A hard blown concert flute with the octave below it added louder than itself, so overblown notes gain their root.',
    preview: TOP_HOLES,
    instrument: {
      deviceId: 'flute',
      preset: 'Hard blown flute',
      params: {
        breath: 0.25,
        blow: 0.75,
        chiff: 0.4,
        attack: 0.06,
        release: 0.5,
        vibrato: 0.25,
        scoop: 0,
        volume: -7.5,
      },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.9, sub2: 0.25, dry: 0.7, up1: 0, attack: 0.12, filter: 3500 },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.25, decay: 0.6, damping: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-rest-inside-the-cliff',
    name: 'Rest inside the cliff',
    category: 'wind',
    description:
      'A bamboo flute that bends up into each note and speaks short, into a low stone space of fourteen seconds that fills the rests.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'flute',
      preset: 'Shakuhachi',
      params: {
        breath: 0.45,
        blow: 0.6,
        chiff: 0.7,
        attack: 0.03,
        release: 0.3,
        vibrato: 0.3,
        scoop: 90,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'expanse',
        params: {
          size: 0.9,
          decay: 14,
          density: 0.9,
          modDepth: 0.3,
          modRate: 0.2,
          lowCut: 60,
          highCut: 3200,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-gust-across-the-bore',
    name: 'Gust across the bore',
    category: 'texture',
    description:
      'A low flute that is mostly breath, left out in gusts of wind that rise and fall across it, its highs spread wide.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.85, blow: 0.3, attack: 0.6, release: 1.2, vibrato: 0.1, volume: -6.5 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Gale', params: { exposure: 0.7, voice: 0.4, sway: 0.7 } },
      { deviceId: 'spread', params: { low: 0, mid: 1.4, high: 1.9, make: 0.8 } },
    ],
  },
  {
    id: 'one-breath-each-note-that-bites-back',
    name: 'Note that bites back',
    category: 'wind',
    description:
      'A bamboo flute feeding back on itself: a held note slowly grows an overtone that hangs on past the end of the breath.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: {
        type: 2,
        breath: 0.3,
        blow: 0.5,
        attack: 0.3,
        release: 1,
        vibrato: 0.1,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'howl',
        params: {
          gain: 0.95,
          distance: 4.2,
          hold: 4,
          move: 0.4,
          pace: 0.1,
          edge: 0.15,
          follow: 0.6,
          mix: 0.65,
          body: 900,
        },
      },
      { deviceId: 'tamer', params: { depth: 0.5, sharpness: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-breathed-in-not-out',
    name: 'Breathed in, not out',
    category: 'wind',
    description:
      'A wood flute heard almost only backwards, in pieces of just over a second that swell up and stop, dulled a little.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        breath: 0.4,
        blow: 0.5,
        chiff: 0.8,
        attack: 0.02,
        release: 0.5,
        vibrato: 0.2,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 1150, feedback: 0.1, smooth: 0.5, tone: 4200, spread: 0.7, mix: 0.9 },
      },
      { deviceId: 'ambient-comp', params: { threshold: -30, ratio: 2.5, makeup: 3 } },
    ],
  },
  {
    id: 'one-breath-each-counting-to-four-twice',
    name: 'Counting to four twice',
    category: 'pad',
    description:
      'Pan pipes that open and close on a slow square breath of one and a half seconds a side, level, colour and width together.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        breath: 0.7,
        blow: 0.35,
        chiff: 0.1,
        attack: 0.2,
        release: 1.8,
        vibrato: 0,
        volume: -2.5,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        params: {
          in: 1.5,
          hold: 1.5,
          out: 1.5,
          rest: 1.5,
          depth: 0.9,
          colour: 0.8,
          width: 0.8,
          air: 0.5,
          ease: 0.5,
          vary: 0,
        },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.25, decay: 4, damping: 0.6, size: 0.7 } },
    ],
  },
  {
    id: 'one-breath-each-sleeve-over-the-lips',
    name: 'Sleeve over the lips',
    category: 'wind',
    description:
      'A wood flute with a wide steady vibrato, muffled as if just under water and wavering, with no bubbles in it.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: {
        breath: 0.5,
        blow: 0.7,
        chiff: 0.2,
        attack: 0.1,
        release: 0.7,
        vibrato: 1,
        scoop: 25,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'underwater',
        params: {
          depth: 0.4,
          waver: 0.6,
          rate: 0.5,
          bubbles: 0,
          resonance: 0.25,
          surface: 0.1,
          mix: 1,
        },
      },
      { deviceId: 'stereo-detune', params: { detune: 6, mix: 0.3 } },
    ],
  },
  {
    id: 'one-breath-each-held-until-no-player',
    name: 'Held until no player',
    category: 'drone',
    description:
      'A slow bamboo flute smeared in its spectrum until breath and tone are one mist that hangs across the silence.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'flute',
      preset: 'Bamboo vibrato',
      params: {
        breath: 0.45,
        blow: 0.2,
        attack: 0.9,
        release: 3.5,
        vibrato: 0.3,
        scoop: 0,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        params: { blur: 0.85, smear: 0.9, tilt: -1.5, highCut: 5000, shimmer: 0.2, mix: 0.85 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 2, ceiling: -6 } },
    ],
  },
  {
    id: 'one-breath-each-overtone-stays-seated',
    name: 'Overtone stays seated',
    category: 'bell',
    description:
      'A pan pipe struck by its own chiff, with its strongest partials redrawn an octave up as sines that outlast it by seconds.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: {
        breath: 0.3,
        blow: 0.6,
        chiff: 1,
        attack: 0.005,
        release: 0.15,
        vibrato: 0,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: {
          partials: 5,
          transpose: 12,
          attack: 60,
          release: 4,
          spread: 0.8,
          tone: 0.4,
          mix: 0.75,
        },
      },
      {
        deviceId: 'phaser',
        params: { stages: 1, centerHz: 1200, rate: 0.08, depth: 40, feedback: 10, mix: 0.3 },
      },
    ],
  },
  {
    id: 'one-breath-each-three-on-one-hillside',
    name: 'Three on one hillside',
    category: 'wind',
    description:
      'A low flute turned into three that stand at different distances and drift apart in time and pitch.',
    preview: ANSWERED_BELOW,
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: {
        breath: 0.4,
        blow: 0.6,
        chiff: 0.4,
        attack: 0.25,
        release: 1.4,
        vibrato: 0.5,
        scoop: 20,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: {
          birds: 3,
          speed: 0.3,
          turns: 0.4,
          range: 30,
          air: 0.6,
          lift: 0.4,
          together: 0.2,
          spread: 1,
          mix: 0.75,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 60, body: -2, air: 3 } },
    ],
  },
  {
    id: 'one-breath-each-dusk-enters-the-cane',
    name: 'Dusk enters the cane',
    category: 'wind',
    description:
      'An airy clarinet that takes over a second and a half to open and four to close, in a cavern of short, slowly bending echoes.',
    preview: LOW_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { bore: 0.35, blow: 0.25, breath: 0.85, attack: 1.7, release: 4, volume: -1 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: {
          length: 0.7,
          blur: 0.6,
          feedback: 0.7,
          highCut: 2600,
          stretch: 0.6,
          glide: 3,
          wander: 0.6,
          mix: 0.55,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-teeth-in-the-breath',
    name: 'Teeth in the breath',
    category: 'wind',
    description:
      'A tenor-bored reed with the growl nearly full, blown loud from the first instant through a stack in a live room.',
    preview: ROUGH_BLOW,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Growling tenor',
      params: {
        bore: 0.8,
        blow: 0.9,
        breath: 0.7,
        attack: 0.02,
        release: 0.15,
        vibrato: 0,
        growl: 0.85,
        volume: 1.5,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 2,
          drive: 0.45,
          bass: 0.2,
          treble: -0.4,
          distance: 0.4,
          room: 0.6,
          noise: 0,
          output: -3,
        },
      },
      { deviceId: 'tamer', params: { depth: 0.4 } },
    ],
  },
  {
    id: 'one-breath-each-half-a-hole-of-cedar',
    name: 'Half a hole of cedar',
    category: 'wind',
    description:
      'A quiet clarinet pressed with the colour of a hollow tube, well past its natural weight, so its notes are boxed and covered.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: { bore: 0.1, blow: 0.2, breath: 0.15, attack: 0.35, release: 0.35, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'imprint',
        params: { capture: 0, shape: 4, amount: 1.6, shift: -3, replace: 0.6, smooth: 0.3 },
      },
      { deviceId: 'ambient-eq', params: { highCut: 3500, low: 3 } },
    ],
  },
  {
    id: 'one-breath-each-ring-finger-falls',
    name: 'Ring finger falls',
    category: 'wind',
    description:
      'A reed with no breath noise and no tail at all, opened almost at once, its taps clacking in a tight bright room.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: {
        bore: 0.2,
        blow: 0.75,
        breath: 0,
        attack: 0.015,
        release: 0.03,
        vibrato: 0,
        volume: 1.5,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 0,
          time: 0.22,
          density: 0.6,
          colour: 0.3,
          highCut: 9000,
          tail: 0,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-lantern-swung-by-hand',
    name: 'Lantern swung by hand',
    category: 'wind',
    description:
      'A wide-bored reed that begins straight and then sways by a whole semitone, slow, the sway splitting left from right.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Wide vibrato reed',
      params: {
        bore: 0.6,
        blow: 0.35,
        breath: 0.35,
        attack: 0.25,
        release: 1.4,
        vibrato: 0,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: {
          wait: 500,
          grow: 2500,
          depth: 100,
          rate: 1.7,
          swell: 0.5,
          quicken: 0.2,
          width: 1,
          human: 0.5,
        },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.2, decay: 0.7, damping: 0.4, predelayMs: 60 } },
    ],
  },
  {
    id: 'one-breath-each-knees-forehead-floor',
    name: 'Knees, forehead, floor',
    category: 'wind',
    description:
      'A dark reed whose every release slumps in pitch, a hundred cents a second, dripping in pieces as it melts.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { bore: 0, blow: 0.3, breath: 0.3, attack: 0.12, release: 3.2, volume: -0.5 },
    },
    effects: [
      {
        deviceId: 'melt',
        params: {
          sag: -100,
          hold: 3,
          solid: 30,
          size: 0.6,
          blur: 0.25,
          dim: 0.5,
          drip: 0.7,
          mix: 0.75,
        },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 1800 } },
    ],
  },
  {
    id: 'one-breath-each-oo-behind-the-screen',
    name: 'Oo behind the screen',
    category: 'voice',
    description: 'A reed that is all whisper, sung back by a hall shaped to a long round vowel.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { blow: 0.12, breath: 0.9, attack: 0.3, release: 0.8, volume: -5 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: {
          vowel: 3.6,
          resonance: 0.85,
          voice: 0.7,
          motion: 0.15,
          decay: 5,
          size: 0.5,
          mix: 0.7,
        },
      },
      { deviceId: 'ambient-comp', params: { threshold: -34, ratio: 2, makeup: 4 } },
    ],
  },
  {
    id: 'one-breath-each-moth-at-the-paper',
    name: 'Moth at the paper',
    category: 'wind',
    description:
      'A bright soprano-like reed split into bands that arrive one after another, the whole fluttering seven times a second.',
    preview: TOP_HOLES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: {
        bore: 0.9,
        blow: 0.6,
        breath: 0.35,
        attack: 0.1,
        release: 0.6,
        vibrato: 0.1,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'tremolo', params: { mode: 0, rate: 7, depth: 0.6, shape: 0, phase: 120 } },
      {
        deviceId: 'prism',
        params: { time: 900, shape: 1, feedback: 0.3, bands: 24, fan: 1, width: 1, mix: 0.6 },
      },
    ],
  },
  {
    id: 'one-breath-each-reed-under-the-floor',
    name: 'Reed under the floor',
    category: 'bass',
    description:
      'A bass clarinet with one octave and some of a second added below it, the lows a little late under the reed, close and dry.',
    preview: LOW_ROOT,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.55, breath: 0.3, attack: 0.2, release: 0.5, vibrato: 0.1, volume: -3 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.8, sub2: 0.35, dry: 0.6, up1: 0, attack: 0.3, filter: 1400 },
      },
      { deviceId: 'spread', params: { low: 0, mid: 0.8, high: 1.6, make: 0.4 } },
    ],
  },
  {
    id: 'one-breath-each-cassette-of-one-breath',
    name: 'Cassette of one breath',
    category: 'wind',
    description:
      'A wide-bored, shaken reed on a worn cassette: hiss, a band cut short at both ends, and a wobble that bends the long notes.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Ballad alto',
      params: {
        bore: 0.9,
        blow: 0.25,
        breath: 0.9,
        attack: 0.12,
        release: 1.1,
        vibrato: 0.6,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 1, drive: 0.5, wobble: 0.75, wear: 0.7, noise: 0.35, tone: 0.35 },
      },
      { deviceId: 'spring-reverb', params: { mix: 0.1, decay: 1.5 } },
    ],
  },
  {
    id: 'one-breath-each-neighbour-takes-the-rest',
    name: 'Neighbour takes the rest',
    category: 'wind',
    description:
      'A warm reed answered two seconds later, once and an octave lower, in the silence it leaves.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.5, breath: 0.35, attack: 0.07, release: 0.3, vibrato: 0.1, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 1,
          gap: 2,
          interval1: -12,
          fade: 0.1,
          spread: 0.9,
          tone: 3500,
          round: 0,
          mix: 0.5,
        },
      },
      { deviceId: 'stereo-detune', params: { detune: 5, mix: 0.25 } },
    ],
  },
  {
    id: 'one-breath-each-shutter-drops-on-air',
    name: 'Shutter drops on air',
    category: 'wind',
    description:
      'A breathy tenor reed whose tail in a dense room is cut off all at once, as if a shutter had come down.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: {
        bore: 1,
        blow: 0.4,
        breath: 0.7,
        attack: 0.05,
        release: 0.1,
        vibrato: 0,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: {
          shape: 0,
          time: 1.1,
          density: 1,
          preDelay: 20,
          colour: -0.4,
          highCut: 5000,
          tail: 0,
          mix: 0.6,
        },
      },
      { deviceId: 'stereo-widener', params: { width: 0.68 } },
    ],
  },
  {
    id: 'one-breath-each-fogged-lacquer',
    name: 'Fogged lacquer',
    category: 'pad',
    description:
      'A soft reed with all its starts rubbed out by three layers of blur, wide, with nothing ringing behind it.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed hum',
      params: {
        bore: 0.4,
        blow: 0.35,
        breath: 0.5,
        attack: 0.5,
        release: 1.2,
        vibrato: 0.3,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 600, density: 1, layers: 3, drift: 0.7, soften: 0.9, damp: 0.4, mix: 1 },
      },
      { deviceId: 'currents', params: { depth: 0.6, sway: 0.8, rate: 0.25, bands: 4 } },
    ],
  },
  {
    id: 'one-breath-each-squeak-above-the-roof',
    name: 'Squeak above the roof',
    category: 'wind',
    description:
      'A hard clarinet with everything below nine hundred hertz taken off and the thin rest doubled and hurried by a chorus.',
    preview: TOP_HOLES,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Open clarinet',
      params: {
        bore: 0.5,
        blow: 1,
        breath: 0.5,
        attack: 0.06,
        release: 0.5,
        vibrato: 0.15,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, slope: 1, cutoffHz: 900, resonance: 1 } },
      { deviceId: 'chorus', params: { voices: 0, rate: 2.6, depth: 35, delayMs: 9, mix: 0.45 } },
      { deviceId: 'ambient-limiter', params: { gain: 5, ceiling: -6 } },
      { deviceId: 'plate-reverb', params: { mix: 0.25, decay: 0.55, damping: 0.25 } },
    ],
  },
  {
    id: 'one-breath-each-chest-of-the-paulownia',
    name: 'Chest of the paulownia',
    category: 'wind',
    description:
      'A reed played inside a wooden soundboard with nearly none of itself left dry: short, woody and dull at the edges.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0.05, blow: 0.6, breath: 0.1, attack: 0.02, release: 0.12, volume: -4 },
    },
    effects: [
      {
        deviceId: 'vessel',
        preset: 'Wooden body',
        params: { size: 0.6, material: 0.2, opening: 0.9, tone: 0.35, position: 0.5, mix: 0.95 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 3, ceiling: -4 } },
    ],
  },
  {
    id: 'one-breath-each-far-corner-of-the-mat',
    name: 'Far corner of the mat',
    category: 'wind',
    description:
      'A slightly wide-bored reed with strong vibrato heard from the dark back of a bare room, narrow and damped.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: {
        bore: 0.3,
        blow: 0.45,
        breath: 0.5,
        attack: 0.2,
        release: 0.6,
        vibrato: 0.7,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'distance',
        preset: 'Dark and narrow',
        params: { distance: 0.85, room: 0.25, decay: 0.7, level: 1 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 140, body: -3, presence: 2 } },
    ],
  },
  {
    id: 'one-breath-each-pipes-wake-afterward',
    name: 'Pipes wake afterward',
    category: 'organ',
    description:
      'A reed whose organ copies, an octave below and above, speak a second late with a puff of air each.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { bore: 0.2, blow: 0.3, breath: 0.3, attack: 0.15, release: 1.4, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Breath first',
        params: { speak: 1000, sub: 0.7, octave: 0.8, fifteenth: 0.2, detune: 0.3, mix: 0.85 },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 3, midDecay: 2.5, damping: 5000, mix: 0.25 } },
    ],
  },
  {
    id: 'one-breath-each-drips-count-the-rests',
    name: 'Drips count the rests',
    category: 'texture',
    description: 'A subtone reed played dry in slow drips of rain that go on through its silences.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: {
        bore: 0.8,
        blow: 0.15,
        breath: 1,
        attack: 0.15,
        release: 0.4,
        vibrato: 0.2,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow drips', params: { voice: 0.55, exposure: 0.6 } },
      { deviceId: 'stereo-widener', params: { width: 0.6 } },
    ],
  },
  {
    id: 'one-breath-each-ash-after-the-tone',
    name: 'Ash after the tone',
    category: 'wind',
    description:
      'A clarinet with a long fall, its quiet end lifted by up to 24 decibels so the last air stays as near as the note.',
    preview: LOW_ALONE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: {
        bore: 0.3,
        blow: 0.6,
        breath: 0.8,
        attack: 0.2,
        release: 4.5,
        vibrato: 0.1,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'lift',
        params: {
          threshold: -20,
          amount: 1,
          rise: 0.3,
          split: 0.8,
          focus: 0.6,
          limit: 24,
          floor: -72,
          sides: 0.4,
        },
      },
      { deviceId: 'ambient-limiter', params: { gain: 0, ceiling: -6 } },
    ],
  },
  {
    id: 'one-breath-each-split-bamboo-taped',
    name: 'Split bamboo, taped',
    category: 'wind',
    description:
      'A lightly shaken, half-wide reed on old slow tape, with deep wow, dropouts and a rubbed-off top.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: {
        bore: 0.45,
        blow: 0.55,
        breath: 0.25,
        attack: 0.1,
        release: 0.9,
        vibrato: 0.2,
        volume: -4,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: {
          drive: 0.6,
          wow: 0.9,
          flutter: 0.5,
          speed: 2,
          age: 0.95,
          hiss: 0.2,
          bump: 0.8,
          tone: 0.25,
        },
      },
      {
        deviceId: 'analog-delay',
        params: { time: 480, feedback: 0.25, tone: 1800, age: 0.6, mix: 0.18 },
      },
    ],
  },
  {
    id: 'one-breath-each-air-that-missed-the-pipe',
    name: 'Air that missed the pipe',
    category: 'wind',
    description:
      'A stopped pipe barely blown: almost all air, a second and a half to open, closing as soon as the key is up.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        pressure: 0.1,
        air: 1,
        bright: 0.35,
        swell: 1.4,
        release: 0.25,
        wander: 0.5,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', params: { mix: 0.15, decay: 0.4, damping: 0.8 } },
      { deviceId: 'ambient-eq', params: { lowCut: 120, air: 4 } },
    ],
  },
  {
    id: 'one-breath-each-blown-until-it-cracks',
    name: 'Blown until it cracks',
    category: 'wind',
    description:
      'A stopped pipe at full pressure with no swell, its edge torn by a pentode fuzz held under a dull ceiling.',
    preview: ROUGH_BLOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        pressure: 1,
        position: 0.15,
        bright: 1,
        air: 0.8,
        swell: 0.006,
        release: 0.1,
        wander: 0.1,
        volume: -16.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: { drive: 0.75, circuit: 4, push: 1, tone: -0.3, highCut: 5500, output: -7 },
      },
      { deviceId: 'ambient-limiter', params: { ceiling: -8 } },
    ],
  },
  {
    id: 'one-breath-each-palm-over-the-far-end',
    name: 'Palm over the far end',
    category: 'wind',
    description:
      'A dark stopped pipe with no brightness left in it, muffled further by a low filter that opens a little as it is blown.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        pressure: 0.35,
        position: 0.6,
        bright: 0.02,
        air: 0.15,
        swell: 0.3,
        release: 1.6,
        wander: 0.2,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 420,
          resonance: 1.1,
          envAmount: 35,
          envAttackMs: 300,
          envReleaseMs: 800,
        },
      },
      { deviceId: 'ambient-comp', params: { threshold: -34, ratio: 2, makeup: 5 } },
    ],
  },
  {
    id: 'one-breath-each-string-with-lungs',
    name: 'String with lungs',
    category: 'string',
    description:
      'A blown string that wanders in pitch and then shakes by over half a semitone, the shake swelling as the note gets old.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: {
        pressure: 0.6,
        position: 0.2,
        bright: 0.45,
        air: 0.4,
        swell: 0.4,
        release: 2.4,
        decay: 6,
        wander: 1,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 700, grow: 2600, depth: 60, rate: 4.2, swell: 0.9, width: 0.9 },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.25, decay: 5, damping: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-gut-blown-to-splinters',
    name: 'Gut blown to splinters',
    category: 'bass',
    description:
      'A low string blown at full pressure, nearly all air, rasping through a driven combo with no room round it.',
    preview: LOW_ROOT,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: {
        pressure: 1,
        position: 0.5,
        bright: 0.8,
        air: 0.95,
        swell: 0.02,
        release: 0.3,
        decay: 1,
        wander: 0.15,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 1,
          drive: 0.6,
          bass: 0.3,
          treble: -0.5,
          distance: 0.1,
          room: 0,
          noise: 0,
          output: -3,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-slat-under-a-fingertip',
    name: 'Slat under a fingertip',
    category: 'plucked',
    description:
      'A bar blown in short puffs that close at once, dry and reedy, with a fifth of the sound thrown to skipping echoes.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: {
        pressure: 0.8,
        bright: 0.55,
        air: 0.3,
        swell: 0.005,
        release: 0.06,
        decay: 0.4,
        wander: 0,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 210, bounce: 0.75, skips: 6, loss: 4, sink: 0.5, mix: 0.2 },
      },
    ],
  },
  {
    id: 'one-breath-each-metal-wind-slow-doors',
    name: 'Metal wind, slow doors',
    category: 'pad',
    description:
      'A bar blown open over a second, with a halo that climbs in octaves above it and a long closing.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bar',
      params: {
        pressure: 0.35,
        position: 0.5,
        bright: 0.2,
        air: 0.6,
        swell: 1.1,
        release: 3,
        decay: 8,
        wander: 0.4,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        params: {
          mix: 0.45,
          decay: 6,
          shimmer: 0.55,
          interval: 0,
          size: 0.6,
          tone: 3500,
          modulation: 0.4,
        },
      },
      { deviceId: 'stereo-detune', params: { detune: 7, mix: 0.35 } },
    ],
  },
  {
    id: 'one-breath-each-bowls-lean-on-the-same-f',
    name: 'Bowls lean on the same F',
    category: 'bell',
    description:
      'A blown bowl that wakes a table of small bowls tuned to a five-note scale with both half steps in it, ringing on after.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: {
        pressure: 0.45,
        position: 0.3,
        bright: 0.5,
        air: 0.6,
        swell: 0.3,
        release: 1.2,
        decay: 4,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 9,
          scale: 6,
          bowls: 9,
          ring: 7,
          beat: 0.5,
          strike: 0.3,
          metal: 0.4,
          register: 0.4,
          mix: 0.5,
          spread: 0.9,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-what-two-breaths-share',
    name: 'What two breaths share',
    category: 'drone',
    description:
      'A blown bowl through an ear that keeps only what was sounding two seconds before, so the silences fill with old tone.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown bowl',
      params: {
        pressure: 0.6,
        position: 0.45,
        bright: 0.8,
        air: 0.3,
        swell: 0.2,
        release: 4,
        decay: 12,
        wander: 0.1,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: {
          ago: 2000,
          keep: 0,
          strict: 0.7,
          ring: 0.9,
          broad: 0.3,
          memory: 0.6,
          makeup: 0.6,
          mix: 0.8,
        },
      },
      { deviceId: 'spread', params: { low: 0.2, mid: 1.5, high: 1.8 } },
    ],
  },
  {
    id: 'one-breath-each-bow-drawn-over-bamboo',
    name: 'Bow drawn over bamboo',
    category: 'wind',
    description:
      'A bowed pipe that needs a second to speak, its bands swelling and crossing from side to side like slow water.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        pressure: 0.45,
        position: 0.35,
        bright: 0.6,
        air: 0.5,
        swell: 1,
        release: 1.8,
        wander: 0.6,
        volume: -0.5,
      },
    },
    effects: [
      {
        deviceId: 'currents',
        params: { depth: 0.9, sway: 0.9, rate: 0.2, tide: 0.7, bands: 5, chance: 0.4 },
      },
      { deviceId: 'ambient-eq', params: { body: -3, presence: 3 } },
    ],
  },
  {
    id: 'one-breath-each-hair-barely-on-the-gut',
    name: 'Hair barely on the gut',
    category: 'string',
    description:
      'A bowed string at the lightest pressure, mostly the scrape of air, pressed into a thin vowel and left quite dry.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed string',
      params: {
        pressure: 0.12,
        position: 0.6,
        bright: 0.25,
        air: 0.95,
        swell: 0.35,
        release: 0.5,
        wander: 0.4,
        volume: 2,
      },
    },
    effects: [
      {
        deviceId: 'imprint',
        params: { capture: 0, shape: 3, amount: 1.3, shift: 2, replace: 0.5, smooth: 0.4 },
      },
      {
        deviceId: 'tape',
        params: { drive: 0.3, wow: 0.3, age: 0.4, hiss: 0, speed: 2, bump: 0.5 },
      },
    ],
  },
  {
    id: 'one-breath-each-frost-sung-by-one-slat',
    name: 'Frost sung by one slat',
    category: 'bell',
    description:
      'A bar bowed high on its edge with a long ring, more than half of it scattered in a cloud of small grains.',
    preview: TOP_HOLES,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bar',
      params: {
        pressure: 0.6,
        position: 0.1,
        bright: 0.95,
        air: 0.1,
        swell: 0.5,
        release: 5,
        decay: 12,
        wander: 0.2,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          size: 180,
          density: 30,
          spray: 0.5,
          scatter: 0.5,
          texture: 0.3,
          reverse: 0.4,
          feedback: 0.1,
          mix: 0.6,
        },
      },
      { deviceId: 'tamer', params: { depth: 0.5, from: 1500 } },
    ],
  },
  {
    id: 'one-breath-each-rubbed-till-the-air-ends',
    name: 'Rubbed till the air ends',
    category: 'drone',
    description:
      'A bowed bowl that gathers for almost a second and a half, each swell repeated by a few scattered, darkening echoes.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: {
        pressure: 0.55,
        position: 0.2,
        bright: 0.4,
        air: 0.05,
        swell: 1.4,
        release: 5,
        decay: 18,
        wander: 0.3,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: {
          span: 3200,
          stars: 5,
          pattern: 2,
          shuffle: 7,
          fade: 0.5,
          again: 0.2,
          tone: 2500,
          drift: 0.5,
          width: 1,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-knock-on-the-empty-node',
    name: 'Knock on the empty node',
    category: 'plucked',
    description:
      'A pipe struck by a soft mallet and gone in under a second, its hollow knocks evened out in a small room.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck pipe',
      params: {
        pressure: 0.5,
        position: 0.5,
        bright: 0.2,
        air: 0.2,
        decay: 0.5,
        release: 0.2,
        wander: 0,
        width: 0.3,
        volume: 2.5,
      },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.22, decay: 0.7, size: 0.6, damping: 0.5, breathDepth: 0 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 6, outputGain: -4 } },
    ],
  },
  {
    id: 'one-breath-each-gut-tapped-in-the-dark',
    name: 'Gut tapped in the dark',
    category: 'plucked',
    description:
      'A string struck near its middle with its brightness all but off, under the hiss and wobble of a worn reel.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck string',
      params: {
        pressure: 0.3,
        position: 0.5,
        bright: 0.08,
        decay: 2,
        air: 0.3,
        release: 0.8,
        wander: 0.2,
        volume: 2.5,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 0, drive: 0.5, wobble: 0.5, wear: 0.6, noise: 0.25, tone: 0.3 },
      },
      { deviceId: 'ambient-comp', params: { threshold: -32, ratio: 3, makeup: 4 } },
    ],
  },
  {
    id: 'one-breath-each-clapper-for-the-monks',
    name: 'Clapper for the monks',
    category: 'bell',
    description:
      'A wooden bar struck hard and short, with three heads of tape repeating it at walking pace into the rests.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck wood bar',
      params: {
        pressure: 0.7,
        position: 0.3,
        bright: 0.25,
        decay: 0.9,
        air: 0.05,
        release: 0.6,
        width: 0.5,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 540,
          feedback: 0.4,
          heads: 2,
          wow: 0.35,
          drive: 0.4,
          highCut: 2600,
          spread: 0.8,
          mix: 0.4,
        },
      },
      { deviceId: 'ambient-eq', params: { low: 4 } },
    ],
  },
  {
    id: 'one-breath-each-kneeling-one-low-bowl',
    name: 'Kneeling, one low bowl',
    category: 'bell',
    description:
      'A struck bowl with a ring of sixteen seconds, each partial flickering at its own slow rate until it dies.',
    preview: LOW_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        pressure: 0.6,
        position: 0.4,
        bright: 0.55,
        decay: 16,
        release: 9,
        air: 0.05,
        width: 1,
        volume: -12,
      },
    },
    effects: [
      {
        deviceId: 'glimmer',
        params: {
          depth: 0.9,
          rate: 1.4,
          grain: 1,
          pattern: 3,
          lean: 0,
          soft: 0.9,
          vary: 0.3,
          apart: 0.8,
        },
      },
      { deviceId: 'ambient-limiter', params: { gain: 3, ceiling: -7 } },
    ],
  },
  {
    id: 'one-breath-each-cork-pulled-from-bamboo',
    name: 'Cork pulled from bamboo',
    category: 'plucked',
    description:
      'A pipe plucked rather than blown, popping and hollow, in a spring tank that drips after each tap.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked pipe',
      params: {
        pressure: 0.8,
        position: 0.3,
        bright: 0.7,
        decay: 1.4,
        air: 0.15,
        release: 0.3,
        wander: 0.05,
        volume: -6.5,
      },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: { mix: 0.4, decay: 2.8, springs: 0, tension: 0.2, tone: 2800, drip: 0.9 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.65 } },
    ],
  },
  {
    id: 'one-breath-each-pluck-with-no-finger',
    name: 'Pluck with no finger',
    category: 'string',
    description:
      'A plucked string whose attack is taken away: each note fades in over six tenths of a second and is gone soon after.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked string',
      params: {
        pressure: 0.4,
        position: 0.45,
        bright: 0.4,
        decay: 5,
        air: 0.2,
        release: 1.2,
        wander: 0.3,
        volume: 5.5,
      },
    },
    effects: [
      {
        deviceId: 'swell',
        params: { attack: 600, curve: 0.8, lookahead: 15, sensitivity: -52, release: 150 },
      },
      {
        deviceId: 'hall-reverb',
        params: { lowDecay: 2.5, midDecay: 3.5, damping: 7000, mix: 0.3 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 6, ceiling: -6 } },
    ],
  },
  {
    id: 'one-breath-each-lamella-lifted-early',
    name: 'Lamella, lifted early',
    category: 'plucked',
    description:
      'A plucked bar answered by grains of itself an octave up, scattered late and backwards, thin as breath.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'graft',
      preset: 'Plucked bar',
      params: {
        pressure: 0.45,
        position: 0.1,
        bright: 0.8,
        decay: 1.8,
        air: 0.1,
        release: 0.5,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 480,
          spray: 0.5,
          pitch: 12,
          pitchSpray: 0.1,
          size: 260,
          reverse: 0.8,
          feedback: 0.3,
          tone: 5000,
          spread: 1,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-rim-flicked-strings-hum',
    name: 'Rim flicked, strings hum',
    category: 'bell',
    description:
      'A plucked bowl over a bank of strings that learn the notes it plays and hum them back after.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'graft',
      preset: 'Struck bowl',
      params: {
        exciter: 3,
        pressure: 0.7,
        position: 0.15,
        bright: 0.7,
        decay: 5,
        air: 0.1,
        release: 2,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { mode: 2, sympathy: 0.8, strings: 10, decay: 7, mix: 0.6, width: 0.9 },
      },
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 350 } },
    ],
  },
  {
    id: 'one-breath-each-second-pipe-downhill',
    name: 'Second pipe, downhill',
    category: 'wind',
    description:
      'A soft pipe followed by two copies of itself, one as it was and one backwards an octave below, two seconds apart, in its rests.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown pipe',
      params: {
        pressure: 0.45,
        position: 0.4,
        bright: 0.5,
        air: 0.35,
        swell: 0.15,
        release: 0.35,
        wander: 0.2,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 2,
          interval1: 0,
          interval2: -12,
          crab: 1,
          fade: 0.25,
          spread: 1,
          tone: 3000,
          mix: 0.6,
        },
      },
      { deviceId: 'distance', params: { distance: 0.45, room: 0.6, wander: 0.2, level: 0.9 } },
    ],
  },
  {
    id: 'one-breath-each-reeds-lit-from-inside',
    name: 'Reeds lit from inside',
    category: 'pad',
    description:
      'A bowed pipe smeared into a soft fuzz and a six-second wall that keeps glowing where the breath stopped.',
    preview: ANSWERED_BELOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed pipe',
      params: {
        pressure: 0.75,
        position: 0.5,
        bright: 0.3,
        air: 0.1,
        swell: 0.5,
        release: 1.2,
        wander: 0.3,
        width: 1,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'haze',
        params: {
          haze: 0.7,
          blur: 0.8,
          decay: 6,
          mix: 0.65,
          size: 0.8,
          tone: 0.35,
          octave: 0.5,
          feed: 0.3,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-two-ends-of-one-string',
    name: 'Two ends of one string',
    category: 'pad',
    description:
      'A blown string swelled gently and swept by twelve slow phaser stages, so its hollow moves while it holds.',
    preview: ANSWERED_BELOW,
    instrument: {
      deviceId: 'graft',
      preset: 'Blown string',
      params: {
        pressure: 0.4,
        position: 0.1,
        bright: 0.7,
        air: 0.2,
        swell: 0.7,
        release: 1.5,
        decay: 8,
        wander: 0.1,
        volume: 2.5,
      },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 4,
          centerHz: 650,
          spread: 60,
          feedback: 55,
          rate: 0.12,
          depth: 90,
          stereo: 180,
          mix: 0.6,
        },
      },
      { deviceId: 'stereo-widener', params: { width: 0.7 } },
    ],
  },
  {
    id: 'one-breath-each-room-learns-the-low-e',
    name: 'Room learns the low E',
    category: 'drone',
    description:
      'A low bowed bowl caught by a loop that records itself through a small room until only the room still rings.',
    preview: LOW_ALONE,
    instrument: {
      deviceId: 'graft',
      preset: 'Bowed bowl',
      params: {
        pressure: 0.3,
        position: 0.5,
        bright: 0.65,
        air: 0.2,
        swell: 0.6,
        release: 2,
        decay: 6,
        wander: 0.2,
        volume: -5.5,
      },
    },
    effects: [
      {
        deviceId: 'generations',
        params: {
          length: 1.3,
          room: 0.7,
          resonance: 0.55,
          keep: 0.85,
          damping: 0.5,
          hiss: 0,
          width: 0.8,
          mix: 0.65,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 70, body: 2 } },
    ],
  },
  {
    id: 'one-breath-each-inhale-then-one-hammer',
    name: 'Inhale, then one hammer',
    category: 'keys',
    description:
      'A backward piano that climbs for two seconds onto its strike and stops there dead.',
    preview: DRAWN_IN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { swell: 2, rise: 0.5, snap: 0.6, tone: 0.45, tail: 0, volume: 1 },
    },
    effects: [{ deviceId: 'plate-reverb', params: { mix: 0.12, decay: 0.4, damping: 0.6 } }],
  },
  {
    id: 'one-breath-each-drawn-past-the-semitone',
    name: 'Drawn past the semitone',
    category: 'keys',
    description:
      'A backward piano with no hammer, mostly ghost as it gathers, melting a semitone flat in each second of its tail.',
    preview: DRAWN_IN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Soft return',
      params: {
        swell: 1.8,
        rise: 0.2,
        ghost: 0.9,
        tail: 0.7,
        tone: 0.3,
        wobble: 0.1,
        volume: -1.5,
      },
    },
    effects: [
      {
        deviceId: 'melt',
        params: { sag: -100, hold: 4, solid: 100, blur: 0.6, dim: 0.5, drip: 0.2, mix: 0.65 },
      },
      { deviceId: 'ambient-comp', params: { threshold: -34, ratio: 2, makeup: 3 } },
    ],
  },
  {
    id: 'one-breath-each-held-breath-key-up',
    name: 'Held breath, key up',
    category: 'keys',
    description:
      'A piano that hovers short of its strike for as long as the key is down and lands in the silence when it is let go.',
    preview: LET_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Let go',
      params: { swell: 1.6, rise: 0.8, tail: 0.4, snap: 0.5, ghost: 0.1, tone: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'hall-reverb', params: { lowDecay: 2.5, midDecay: 2, damping: 4500, mix: 0.3 } },
    ],
  },
  {
    id: 'one-breath-each-nothing-nothing-a',
    name: 'Nothing, nothing, A',
    category: 'keys',
    description:
      'A late, steep backward piano: two and a half seconds of almost no sound and then all of it, caught by a tight gated room.',
    preview: NEXT_INHALE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Late surge',
      params: { swell: 2.5, rise: 1, snap: 0.9, tail: 0.15, tone: 0.7, ghost: 0, volume: 2 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 0, time: 0.6, density: 0.9, colour: 0.1, tail: 0, mix: 0.4 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.62 } },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -5 } },
    ],
  },
  {
    id: 'one-breath-each-finger-before-its-tap',
    name: 'Finger before its tap',
    category: 'keys',
    description:
      'A piano swell of a fifth of a second before each tap, snapped shut in a wooden body, so the line clicks backwards.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Snap shut',
      params: { swell: 0.2, rise: 0.7, tail: 0, snap: 1, tone: 0.35, volume: -1 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: { body: 5, size: 0.8, material: 0.2, opening: 0.8, air: 0, tone: 0.4, mix: 0.7 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 4, ceiling: -9, ride: 0.3 } },
    ],
  },
  {
    id: 'one-breath-each-lacquer-reel-unrolled',
    name: 'Lacquer reel, unrolled',
    category: 'keys',
    description:
      'A dark wobbling backward piano on worn tape, its landings smudged by flutter and lost top.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'rewind',
      preset: 'Worn reel',
      params: {
        swell: 1.1,
        tone: 0.15,
        wobble: 1,
        shimmer: 0.3,
        tail: 0.3,
        snap: 0.2,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.6, wow: 0.7, flutter: 0.6, speed: 3, age: 0.8, hiss: 0.15, tone: 0.3 },
      },
      { deviceId: 'ambient-eq', params: { low: 3, highCut: 4000 } },
    ],
  },
  {
    id: 'one-breath-each-ghost-sits-down-first',
    name: 'Ghost sits down first',
    category: 'pad',
    description:
      'All ghost: the room of a piano heard for a second and a half before the piano, spread by blur until neither has an edge.',
    preview: ANSWERED_BELOW,
    instrument: {
      deviceId: 'rewind',
      preset: 'Ghost room',
      params: { swell: 1.5, rise: 0.4, ghost: 1, tail: 0.5, snap: 0, width: 1, volume: 1.5 },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 500, density: 1, layers: 2, drift: 0.4, soften: 0.7, damp: 0.3, mix: 1 },
      },
      { deviceId: 'ambient-eq', params: { presence: -2 } },
    ],
  },
  {
    id: 'one-breath-each-iron-lid-over-the-keys',
    name: 'Iron lid over the keys',
    category: 'keys',
    description:
      'A backward piano pressed into the colour of a dark box, dull and close, answered by a long dark echo.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Turned piano',
      params: {
        swell: 0.5,
        rise: 0.6,
        tone: 0.1,
        tail: 0.2,
        snap: 0.4,
        ghost: 0,
        width: 0.2,
        volume: -1,
      },
    },
    effects: [
      {
        deviceId: 'imprint',
        params: { capture: 0, shape: 6, amount: 1.5, shift: -4, replace: 0.5 },
      },
      { deviceId: 'analog-delay', params: { time: 1000, feedback: 0.3, tone: 1500, mix: 0.35 } },
    ],
  },
  {
    id: 'one-breath-each-bell-meets-the-outbreath',
    name: 'Bell meets the outbreath',
    category: 'bell',
    description:
      'A backward bell that brightens for two seconds, lands and then rings on in full, in a chapel-dark tail.',
    preview: NEXT_INHALE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { swell: 2, tail: 0.9, snap: 0.2, tone: 0.5, rise: 0.6, shimmer: 0.1, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'ether-reverb',
        params: { mix: 0.35, decay: 7, damping: 0.75, size: 0.8, predelayMs: 40 },
      },
    ],
  },
  {
    id: 'one-breath-each-bell-that-keeps-its-air',
    name: 'Bell that keeps its air',
    category: 'bell',
    description:
      'A bell held at the edge of its stroke, beating in pairs, and struck only as the key comes up; a wide top, no reverb.',
    preview: LET_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { swell: 1.8, tone: 0.85, shimmer: 1, ghost: 0.2, tail: 0.55, rise: 0.3, volume: -1 },
    },
    effects: [
      { deviceId: 'spread', params: { low: 0, mid: 1.5, high: 2, make: 1, smear: 0.6 } },
      { deviceId: 'tamer', params: { depth: 0.4, from: 1800 } },
      { deviceId: 'ambient-limiter', params: { gain: 7, ceiling: -9.5, ride: 0.4 } },
    ],
  },
  {
    id: 'one-breath-each-small-bell-sucked-shut',
    name: 'Small bell, sucked shut',
    category: 'bell',
    description:
      'A short backward bell with no tail, all snap, thinned below eleven hundred hertz and echoed backwards.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Stops dead',
      params: { source: 1, swell: 0.35, rise: 0.8, snap: 0.9, tone: 0.7, shimmer: 0, volume: 3.5 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 1100 } },
      {
        deviceId: 'reverse-delay',
        params: { time: 420, feedback: 0.2, smooth: 0.6, tone: 7000, spread: 1, mix: 0.4 },
      },
      { deviceId: 'ambient-limiter', params: { gain: 12, ceiling: -9, ride: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-temple-bell-at-low-tide',
    name: 'Temple bell at low tide',
    category: 'bell',
    description:
      'A dark bell drawn in over a second and a half, its strike softened, with the octave below it coming in after.',
    preview: LOW_ALONE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: {
        swell: 1.6,
        tone: 0.15,
        rise: 0.2,
        snap: 0,
        tail: 1,
        ghost: 0.6,
        shimmer: 0.4,
        volume: -2.5,
      },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.7, dry: 0.8, up1: 0, attack: 0.5, filter: 1200 } },
      { deviceId: 'currents', params: { depth: 0.5, rate: 0.12, sway: 0.6 } },
    ],
  },
  {
    id: 'one-breath-each-icicle-under-the-eaves',
    name: 'Icicle under the eaves',
    category: 'bell',
    description:
      'A bright backward bell in a winter air, whose sparks fly off late, two octaves above, when it lands.',
    preview: TOP_HOLES,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: {
        swell: 0.9,
        tone: 0.9,
        rise: 0.5,
        tail: 0.5,
        snap: 0.5,
        shimmer: 0.3,
        width: 0.9,
        volume: -2,
      },
    },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 9,
          pitch: 2,
          size: 90,
          scatter: 700,
          sparkle: 0.7,
          trail: 0.6,
          mix: 0.4,
        },
      },
      { deviceId: 'seasons', params: { year: 0.9, depth: 0.7, space: 0.5, grit: 0.2, turn: 0 } },
      { deviceId: 'ambient-limiter', params: { gain: 6, ceiling: -9, ride: 0.4 } },
    ],
  },
  {
    id: 'one-breath-each-rust-on-the-bell-crown',
    name: 'Rust on the bell crown',
    category: 'bell',
    description:
      'A backward bell slightly ring modulated on E, drawn in to the middle and left dry, so its rests are nearly silent.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { swell: 0.6, tone: 0.4, rise: 0.9, tail: 0.4, snap: 0.5, ghost: 0.3, volume: -7 },
    },
    effects: [
      { deviceId: 'ring', params: { root: 4, octave: 4, mix: 0.35 } },
      { deviceId: 'stereo-widener', params: { width: 0.12 } },
      { deviceId: 'ambient-limiter', params: { gain: 7, ceiling: -9, ride: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-pluck-drawn-to-the-lip',
    name: 'Pluck drawn to the lip',
    category: 'plucked',
    description:
      'A backward pluck of a third of a second with no tail, in front of a short spring tank that answers it.',
    preview: FINGER_HITS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { swell: 0.3, tail: 0.05, snap: 0.5, tone: 0.55, rise: 0.4, volume: -4 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: { mix: 0.3, decay: 1.6, springs: 2, tension: 0.8, drip: 0.3 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 5, outputGain: -3 } },
    ],
  },
  {
    id: 'one-breath-each-thread-pulled-from-water',
    name: 'Thread pulled from water',
    category: 'plucked',
    description:
      'A slow backward pluck, wide and beating, landing as the key comes up and swayed by a vibrato that grows while it is held.',
    preview: LET_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Wide drift',
      params: { swell: 1.4, shimmer: 0.9, ghost: 0.5, tail: 0.6, tone: 0.4, volume: 5.5 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 400, grow: 1600, depth: 45, rate: 5.5, swell: 0.5, width: 1 },
      },
      { deviceId: 'plate-reverb', params: { mix: 0.3, decay: 0.75, damping: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-string-back-to-its-peg',
    name: 'String back to its peg',
    category: 'string',
    description:
      'A dull backward pluck that rings forward as long as it can, its quiet end lifted level with its landing.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: {
        swell: 0.8,
        rise: 0.3,
        tail: 1,
        snap: 0.1,
        tone: 0.2,
        ghost: 0.3,
        wobble: 0.3,
        volume: -21.5,
      },
    },
    effects: [
      {
        deviceId: 'lift',
        params: { threshold: -24, amount: 0.9, rise: 0.4, split: 0.6, limit: 20, floor: -70 },
      },
      { deviceId: 'analog-drive', params: { drive: 0.5, circuit: 2, tone: -0.2 } },
    ],
  },
  {
    id: 'one-breath-each-nail-then-the-note',
    name: 'Nail, then the note',
    category: 'plucked',
    description:
      'A bright hard backward pluck for rough breaths: a steep rise and a full snap, driven by a hot valve stage.',
    preview: ROUGH_BLOW,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { swell: 0.45, rise: 1, tail: 0.15, snap: 1, tone: 1, width: 0.3, volume: -9 },
    },
    effects: [
      {
        deviceId: 'saturator',
        params: { curve: 2, driveDb: 12, bias: 0.3, toneDb: -2, outputDb: -4 },
      },
      { deviceId: 'ambient-eq', params: { highCut: 7000, body: 2 } },
      { deviceId: 'ambient-limiter', params: { gain: 5, ceiling: -9, ride: 0.2 } },
    ],
  },
  {
    id: 'one-breath-each-zither-through-a-wall',
    name: 'Zither through a wall',
    category: 'plucked',
    description:
      'A backward pluck on medium tone heard from next door: no top, hardly any width, a little late.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Mirror note',
      params: { source: 2, swell: 0.7, tone: 0.5, tail: 0.5, rise: 0.4, ghost: 0.1, volume: -7 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door', params: { distance: 0.8, level: 1 } },
      { deviceId: 'ambient-comp', params: { threshold: -38, ratio: 3, makeup: 6 } },
    ],
  },
  {
    id: 'one-breath-each-six-strings-one-exhale',
    name: 'Six strings, one exhale',
    category: 'pad',
    description:
      'A ghostly backward pluck turned into a close flock of six that crowd each landing.',
    preview: ANSWERED_BELOW,
    instrument: {
      deviceId: 'rewind',
      preset: 'Wide drift',
      params: {
        strike: 0,
        swell: 1.2,
        ghost: 0.8,
        rise: 0.3,
        tail: 0.8,
        tone: 0.6,
        snap: 0,
        volume: 5.5,
      },
    },
    effects: [
      {
        deviceId: 'murmuration',
        params: {
          birds: 6,
          speed: 0.5,
          turns: 0.5,
          range: 15,
          together: 0.8,
          air: 0.3,
          spread: 1,
          mix: 0.7,
        },
      },
      { deviceId: 'hall-reverb', params: { lowDecay: 3, midDecay: 4, damping: 6000, mix: 0.25 } },
    ],
  },
  {
    id: 'one-breath-each-bowl-fills-never-struck',
    name: 'Bowl fills, never struck',
    category: 'drone',
    description:
      'A bowl that swells for three seconds under a held key and lands with no snap, ringing at its longest.',
    preview: NEXT_INHALE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { swell: 3, rise: 0.2, ghost: 0.9, tail: 1, snap: 0, shimmer: 0.5, volume: -2.5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { gain: 4, ceiling: -6, release: 3 } },
      { deviceId: 'stereo-detune', params: { detune: 4, drift: 0.5, mix: 0.3 } },
    ],
  },
  {
    id: 'one-breath-each-rim-kept-turning',
    name: 'Rim kept turning',
    category: 'drone',
    description:
      'A bowl held just short of its stroke, beating slowly, its hum split into bands that drift left and right.',
    preview: LET_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Held bowl',
      params: { swell: 2, ghost: 0.4, rise: 0.5, tail: 0.7, tone: 0.7, shimmer: 0.8, volume: 4 },
    },
    effects: [
      { deviceId: 'currents', params: { depth: 0.8, sway: 1, rate: 0.3, bands: 6, tide: 0.3 } },
      { deviceId: 'ambient-eq', params: { lowCut: 150, air: 3 } },
    ],
  },
  {
    id: 'one-breath-each-bronze-half-a-breath',
    name: 'Bronze, half a breath',
    category: 'bell',
    description:
      'A bright bowl arriving in half a second and cut dead on its stroke, with a cloud of reversed grains after it.',
    preview: OTHER_TWO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: {
        swell: 0.5,
        rise: 0.8,
        ghost: 0,
        tail: 0,
        snap: 0.9,
        tone: 0.85,
        shimmer: 0.1,
        volume: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          size: 350,
          density: 14,
          spray: 0.6,
          reverse: 1,
          feedback: 0.3,
          spread: 1,
          mix: 0.55,
        },
      },
      { deviceId: 'ambient-limiter', params: { gain: 9, ceiling: -9, ride: 0.6 } },
    ],
  },
  {
    id: 'one-breath-each-bowl-behind-rice-paper',
    name: 'Bowl behind rice paper',
    category: 'bell',
    description:
      'A soft backward bowl filtered until only its lowest modes pass, opening a little at each landing and panned slowly.',
    preview: DOWNHILL,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: {
        swell: 1,
        rise: 0.5,
        ghost: 0.3,
        tail: 0.6,
        snap: 0.2,
        tone: 0.2,
        shimmer: 0,
        width: 0.3,
        volume: 1,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 380,
          resonance: 1.4,
          envAmount: 45,
          envAttackMs: 120,
          envReleaseMs: 700,
        },
      },
      { deviceId: 'tremolo', params: { mode: 1, rate: 0.18, depth: 0.7 } },
    ],
  },
  {
    id: 'one-breath-each-kettle-comes-to-one-note',
    name: 'Kettle comes to one note',
    category: 'texture',
    description:
      'A backward bowl mostly turned to hiss and swirl by a starved stream, then cut off where it lands.',
    preview: NEXT_INHALE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: {
        swell: 2.6,
        rise: 0.9,
        ghost: 1,
        tail: 0.1,
        snap: 0.7,
        tone: 1,
        wobble: 0.5,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'low-bitrate', params: { loss: 0.7, mode: 0, frame: 2, smear: 0.5, mix: 0.8 } },
      { deviceId: 'plate-reverb', params: { mix: 0.2, decay: 0.5 } },
    ],
  },
  {
    id: 'one-breath-each-gathered-low-set-down',
    name: 'Gathered low, set down',
    category: 'bass',
    description:
      'A low bowl drawn in over a second, kept dark and near the middle, with a shell-like body round it.',
    preview: LOW_ROOT,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: {
        swell: 1,
        rise: 0.4,
        ghost: 0.1,
        tail: 0.3,
        snap: 0.1,
        tone: 0.05,
        shimmer: 0,
        width: 0.1,
        volume: -1.5,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: {
          body: 3,
          size: 2.2,
          material: 0.4,
          opening: 0.3,
          air: 0.2,
          tone: 0.3,
          width: 0.4,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-door-slid-piano-leaves',
    name: 'Door slid, piano leaves',
    category: 'keys',
    description:
      'A backward piano that lands and rings forward as far as it came, the whole of it opened and shut by a slow breath.',
    preview: TWO_OF_FOUR,
    instrument: {
      deviceId: 'rewind',
      preset: 'Mirror note',
      params: { swell: 1, rise: 0.4, tail: 0.9, tone: 0.75, snap: 0.3, width: 0.9, volume: 5.5 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: {
          in: 0.8,
          hold: 0.4,
          out: 2.2,
          rest: 0.6,
          depth: 0.8,
          colour: 0.9,
          width: 0.6,
          air: 0.2,
          ease: 0.8,
          vary: 0,
        },
      },
      { deviceId: 'expanse', params: { size: 0.5, decay: 5, highCut: 5000, mix: 0.3 } },
    ],
  },
  {
    id: 'one-breath-each-last-key-sings-alone',
    name: 'Last key sings alone',
    category: 'voice',
    description:
      'A soft backward piano whose arrivals are sung on by a hall shaped to an open vowel that drifts.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'rewind',
      preset: 'Soft return',
      params: { swell: 1.3, rise: 0.5, tail: 0.4, tone: 0.55, ghost: 0.3, snap: 0.1, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        params: {
          vowel: 0.4,
          resonance: 0.9,
          voice: 0.8,
          motion: 0.6,
          decay: 6,
          size: 0.7,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'one-breath-each-torn-edge-of-the-swell',
    name: 'Torn edge of the swell',
    category: 'keys',
    description:
      'A hard backward piano that feeds back on its way in, so an overtone is already there when the hammer lands.',
    preview: ROUGH_BLOW,
    instrument: {
      deviceId: 'rewind',
      preset: 'Late surge',
      params: { swell: 0.8, rise: 0.7, snap: 0.8, tail: 0.5, tone: 0.9, ghost: 0.2, volume: 1 },
    },
    effects: [
      {
        deviceId: 'howl',
        params: { gain: 0.9, distance: 6, hold: 3, move: 0.3, edge: 0.4, follow: 0.8, mix: 0.6 },
      },
      { deviceId: 'ambient-limiter', params: { ceiling: -8 } },
    ],
  },
  {
    id: 'one-breath-each-slow-bloom-shut-hole',
    name: 'Slow bloom, shut hole',
    category: 'pad',
    description:
      'A piano that takes nearly three seconds to arrive, redrawn as a handful of pure sines a little behind it.',
    preview: NEXT_INHALE,
    instrument: {
      deviceId: 'rewind',
      preset: 'Slow bloom',
      params: { swell: 2.8, rise: 0.5, ghost: 0.3, tail: 0.6, tone: 0.6, volume: 6 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: { partials: 6, attack: 500, release: 5, spread: 0.7, tone: 0.2, mix: 0.9 },
      },
      { deviceId: 'chorus', params: { voices: 1, rate: 0.2, depth: 40, mix: 0.35 } },
    ],
  },
  {
    id: 'one-breath-each-wire-that-takes-a-breath',
    name: 'Wire that takes a breath',
    category: 'string',
    description:
      'A string with no pick that rises out of the amplifier hum over a second and a half and falls away when let go.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'feedback',
      preset: 'Out of the hum',
      params: {
        bloom: 1.4,
        gain: 0.8,
        grit: 0.1,
        wander: 0.1,
        release: 0.8,
        damp: 0.5,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { highCut: 4500, low: 2 } },
      { deviceId: 'plate-reverb', params: { mix: 0.2, decay: 0.5, damping: 0.6 } },
    ],
  },
  {
    id: 'one-breath-each-amplifier-blows-first',
    name: 'Amplifier blows first',
    category: 'string',
    description:
      'A torn, picked string caught at once by the amplifier, through a gentle low filter and a combo in a room.',
    preview: ROUGH_BLOW,
    instrument: {
      deviceId: 'feedback',
      preset: 'Torn edge',
      params: { bloom: 0.06, grit: 0.9, pick: 0.5, release: 0.15, damp: 0.3, volume: -12 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 2600 } },
      {
        deviceId: 're-amp',
        params: { speaker: 1, drive: 0.3, distance: 0.5, room: 0.5, noise: 0, treble: -0.3 },
      },
    ],
  },
  {
    id: 'one-breath-each-twelfth-under-the-wind',
    name: 'Twelfth under the wind',
    category: 'drone',
    description:
      'A clean string singing on its twelfth with a long release, sagging slowly and darkening after each breath.',
    preview: ONE_BREATH,
    instrument: {
      deviceId: 'feedback',
      preset: 'Pure twelfth',
      params: { bloom: 0.6, pick: 0.1, release: 4, damp: 0.2, width: 1, volume: -3.5 },
    },
    effects: [
      { deviceId: 'melt', params: { sag: -35, hold: 4, solid: 80, dim: 0.6, blur: 0.4, mix: 0.6 } },
      { deviceId: 'stereo-widener', params: { width: 0.7 } },
    ],
  },
  {
    id: 'one-breath-each-whistle-of-a-dry-reed',
    name: 'Whistle of a dry reed',
    category: 'wind',
    description:
      'A high feedback whistle on the sixth partial, thin and pure, shaken late by a fast narrow vibrato.',
    preview: HEAD_SHAKE,
    instrument: {
      deviceId: 'feedback',
      preset: 'High whistle',
      params: { distance: 6, bloom: 0.5, damp: 0.15, release: 0.9, pick: 0.05, volume: -7 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 600, grow: 1800, depth: 30, rate: 6.5, swell: 0.6 },
      },
      { deviceId: 'fdn-reverb', params: { mix: 0.3, decay: 3.5, damping: 0.6, breathDepth: 0 } },
    ],
  },
  {
    id: 'one-breath-each-string-that-lets-go-late',
    name: 'String that lets go late',
    category: 'string',
    description:
      'A dark damped string that hums through the rest in a long sink, its tail turned backwards in slow pieces.',
    preview: LOW_ALONE,
    instrument: {
      deviceId: 'feedback',
      preset: 'Long sink',
      params: { distance: 1, gain: 0.7, grit: 0.05, bloom: 0.5, damp: 0.8, release: 6, volume: -8 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: { time: 1400, feedback: 0.3, smooth: 0.8, tone: 2500, mix: 0.5 },
      },
      { deviceId: 'ambient-comp', params: { threshold: -32, ratio: 2, makeup: 2 } },
    ],
  },
]
