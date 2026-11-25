import { type FactoryPreset, type Phrase } from '../types'

// A pedal that never moves, and chords above it written without their own roots. Half of the pack
// is what holds the pedal (drones and tanpuras, from a hum to a bright wall), half is what floats
// on it (tines, felt, glows and thin tables). White keys throughout: D is the pedal of most phrases.

// Dm9, G13, Cmaj9 and back over D: each chord keeps its third and seventh and leaves its root out.
const TURN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.95, note: 38, gain: 0.55 },
    { atSec: 3, durSec: 3.1, note: 38, gain: 0.45 },
    ...[53, 57, 60, 64].map((note) => ({ atSec: 0, durSec: 1.45, note, gain: 0.42 })),
    ...[53, 57, 59, 64].map((note) => ({ atSec: 1.5, durSec: 1.45, note, gain: 0.4 })),
    ...[52, 55, 59, 62].map((note) => ({ atSec: 3, durSec: 1.45, note, gain: 0.4 })),
    ...[53, 57, 60, 64].map((note) => ({ atSec: 4.5, durSec: 1.6, note, gain: 0.36 })),
  ],
}
// The same three chords opened out, each rolled up from its lowest note, left on Cmaj9 over D.
const WIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.95, note: 38, gain: 0.5 },
    { atSec: 4, durSec: 2.3, note: 38, gain: 0.45 },
    ...[53, 60, 64, 69].map((note, i) => ({
      atSec: i * 0.12,
      durSec: 1.9 - i * 0.12,
      note,
      gain: 0.42,
    })),
    ...[53, 59, 64, 69].map((note, i) => ({
      atSec: 2 + i * 0.12,
      durSec: 1.9 - i * 0.12,
      note,
      gain: 0.4,
    })),
    ...[52, 59, 62, 67].map((note, i) => ({
      atSec: 4 + i * 0.12,
      durSec: 2.2 - i * 0.12,
      note,
      gain: 0.4,
    })),
  ],
}
// G below: Cmaj9, Am9 (one voice moves, D to C), Dm9 and Cmaj9, all without their roots.
const OVER_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.95, note: 43, gain: 0.5 },
    { atSec: 3, durSec: 3.1, note: 43, gain: 0.45 },
    ...[52, 55, 59, 62].map((note) => ({ atSec: 0, durSec: 1.45, note, gain: 0.4 })),
    ...[52, 55, 59, 60].map((note) => ({ atSec: 1.5, durSec: 1.45, note, gain: 0.4 })),
    ...[53, 57, 60, 64].map((note) => ({ atSec: 3, durSec: 1.45, note, gain: 0.42 })),
    ...[52, 55, 59, 62].map((note) => ({ atSec: 4.5, durSec: 1.6, note, gain: 0.36 })),
  ],
}
// Two, five, one in D dorian: Em11, Am9, Dm9, two seconds each, the only root the D below.
const DORIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.95, note: 38, gain: 0.5 },
    { atSec: 4, durSec: 2.3, note: 38, gain: 0.5 },
    ...[57, 59, 62, 67].map((note) => ({ atSec: 0, durSec: 1.95, note, gain: 0.4 })),
    ...[55, 59, 60, 64].map((note) => ({ atSec: 2, durSec: 1.95, note, gain: 0.4 })),
    ...[53, 57, 60, 64].map((note) => ({ atSec: 4, durSec: 2.2, note, gain: 0.4 })),
  ],
}
// A below: Am9, Dm9, the E chord as its flat ninth, third, fifth and seventh, Am9.
const AEOLIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.95, note: 45, gain: 0.5 },
    { atSec: 3, durSec: 3.2, note: 45, gain: 0.45 },
    ...[52, 55, 59, 60].map((note) => ({ atSec: 0, durSec: 1.45, note, gain: 0.4 })),
    ...[53, 57, 60, 64].map((note) => ({ atSec: 1.5, durSec: 1.45, note, gain: 0.4 })),
    ...[53, 55, 59, 62].map((note) => ({ atSec: 3, durSec: 1.45, note, gain: 0.4 })),
    ...[52, 55, 59, 60].map((note) => ({ atSec: 4.5, durSec: 1.7, note, gain: 0.36 })),
  ],
}
// The three chords one note at a time over D, struck again for the last of them.
const BROKEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.8, note: 50, gain: 0.5 },
    { atSec: 3.9, durSec: 2.2, note: 50, gain: 0.45 },
    ...[65, 69, 72, 76].map((note, i) => ({
      atSec: 0.3 + i * 0.35,
      durSec: 1.7 - i * 0.35,
      note,
      gain: 0.45,
    })),
    ...[65, 69, 71, 76].map((note, i) => ({
      atSec: 2.1 + i * 0.35,
      durSec: 1.7 - i * 0.35,
      note,
      gain: 0.45,
    })),
    ...[64, 67, 71, 74].map((note, i) => ({
      atSec: 3.9 + i * 0.35,
      durSec: 2.1 - i * 0.35,
      note,
      gain: 0.45,
    })),
  ],
}
// Short chords on one and after two, a guide tone at the bottom of each: C E F A, B E F A, B D E G.
const COMPING: Phrase = {
  notes: [
    ...[0, 2, 4].map((atSec) => ({ atSec, durSec: 1.8, note: 38, gain: 0.5 })),
    ...[60, 64, 65, 69].flatMap((note) =>
      [0, 0.75].map((atSec) => ({ atSec, durSec: 0.3, note, gain: 0.45 })),
    ),
    ...[59, 64, 65, 69].flatMap((note) =>
      [2, 2.75].map((atSec) => ({ atSec, durSec: 0.3, note, gain: 0.45 })),
    ),
    ...[59, 62, 64, 67].flatMap((note) =>
      [4, 4.75].map((atSec, i) => ({ atSec, durSec: 0.3 + i, note, gain: 0.42 })),
    ),
  ],
}
// G and D below F A C E, then C falls to B and nothing else moves: a suspended G13 let go.
const HANGING: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.1, note: 43, gain: 0.45 },
    { atSec: 0, durSec: 6.1, note: 50, gain: 0.3 },
    ...[53, 57, 64].map((note) => ({ atSec: 0, durSec: 6.1, note, gain: 0.4 })),
    { atSec: 0, durSec: 2.95, note: 60, gain: 0.42 },
    { atSec: 3, durSec: 3.1, note: 59, gain: 0.42 },
  ],
}
// Guide tones alone over D: seventh and third of Dm7, third and seventh of G7, seventh and third of C.
const SHELLS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 38, gain: 0.5 },
    ...[60, 65].map((note) => ({ atSec: 0, durSec: 1.95, note, gain: 0.4 })),
    ...[59, 65].map((note) => ({ atSec: 2, durSec: 1.95, note, gain: 0.4 })),
    ...[59, 64].map((note) => ({ atSec: 4, durSec: 2.2, note, gain: 0.4 })),
  ],
}
// For a sound that brings its own fifth: D, then F (with C: Dm7 without D), then E (with B: C major seventh without C).
const BORROWED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 50, gain: 0.6 },
    { atSec: 0.9, durSec: 2.5, note: 65, gain: 0.4 },
    { atSec: 3.5, durSec: 2.7, note: 64, gain: 0.4 },
  ],
}
// For a sound that brings its own fourth: D, then C (with F: the same Dm7), then B (with E: the same C).
const FOURTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 50, gain: 0.6 },
    { atSec: 0.9, durSec: 2.5, note: 72, gain: 0.4 },
    { atSec: 3.5, durSec: 2.7, note: 71, gain: 0.4 },
  ],
}
// F, then C over it. With a semitone below each: E, C and B over F, the fifth, third and ninth of an A that is not there.
const LOW_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 53, gain: 0.65 },
    { atSec: 1.8, durSec: 4.4, note: 60, gain: 0.4 },
  ],
}
// For a sound that is a minor triad: D, then A (Dm9 in all), then E (with the D: E G B D, C major ninth without C).
const MINORS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 50, gain: 0.5 },
    { atSec: 0.8, durSec: 2.6, note: 57, gain: 0.4 },
    { atSec: 3.5, durSec: 2.8, note: 64, gain: 0.35 },
  ],
}
// For a sound that is a major triad, each the top of a minor seventh without its root: F (of D), C (of A), G (of E).
const TRIADS: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 53, gain: 0.5 },
    { atSec: 0.8, durSec: 2.6, note: 60, gain: 0.4 },
    { atSec: 3.5, durSec: 2.8, note: 67, gain: 0.35 },
  ],
}
// For a sound that brings its own fifth: G (with D) under E (with B), C major ninth without C; then C joins as the third of A, Am11 without A.
const JOINED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 55, gain: 0.6 },
    { atSec: 0.9, durSec: 5.4, note: 64, gain: 0.4 },
    { atSec: 3.5, durSec: 2.8, note: 72, gain: 0.4 },
  ],
}
// For a sound that brings the fifth below: A brings the D below it, C brings F, E brings A. All of Dm9, and no hand on a D.
const LENT_D: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 57, gain: 0.6 },
    { atSec: 0.9, durSec: 5.4, note: 72, gain: 0.4 },
    { atSec: 3.5, durSec: 2.8, note: 76, gain: 0.35 },
  ],
}
// The pedal by itself for what is too low or too thick for chords: D, then the D above it.
const GROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.3, note: 38, gain: 0.55 },
    { atSec: 1.8, durSec: 4.5, note: 50, gain: 0.35 },
  ],
}
// The shells slowed down for what speaks late: C F, the seventh and third of D, then B E, the same of C.
const SLOWLY: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.4, note: 38, gain: 0.5 },
    ...[60, 65].map((note) => ({ atSec: 0.6, durSec: 2.8, note, gain: 0.4 })),
    ...[59, 64].map((note) => ({ atSec: 3.5, durSec: 2.9, note, gain: 0.4 })),
  ],
}
// For a sound that is five notes wide: D E F G A, then A B C D E over it.
const FIVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.2, note: 50, gain: 0.5 },
    { atSec: 2.4, durSec: 3.8, note: 69, gain: 0.35 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tine piano: how thin it can be and still say the chord. Bell against bark, tremolo slow to fast, what holds it.
  {
    id: 'rootless-over-pedal-dorian-at-three-hertz',
    name: 'Dorian at three hertz',
    category: 'keys',
    description:
      'A soft suitcase piano with a tremolo at three cycles a second, its lows cut away, a few steps back in a small room.',
    preview: DORIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        bell: 0.3,
        bark: 0.3,
        tremolo: 0.7,
        tremoloRate: 3,
        pan: 0.2,
        tone: 0.45,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 160, body: -3 } },
      { deviceId: 'distance', params: { distance: 0.3, room: 0.5, wander: 0.1, decay: 1.2 } },
    ],
  },
  {
    id: 'rootless-over-pedal-thin-ice-above-d',
    name: 'Thin ice above D',
    category: 'bell',
    description:
      'Glass-bell tines with everything under 300 hertz removed, hung in a seven-second space with its own lows cut at the same place.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { bell: 0.9, decay: 0.9, release: 1.4, tone: 0.95 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 320, body: -5, air: 3 } },
      {
        deviceId: 'expanse',
        params: { size: 0.6, decay: 7, lowCut: 320, highCut: 10000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-kite-on-the-string',
    name: 'Kite on the string',
    category: 'keys',
    description:
      'A long-sustaining tine piano on slow worn tape, then split into five wandering copies that fly a short way off.',
    preview: WIDE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { volume: -15.5, bell: 0.35, decay: 3.5, tone: 0.4, tremolo: 0 },
    },
    effects: [
      {
        deviceId: 'tape',
        params: { drive: 0.4, wow: 0.6, flutter: 0.3, speed: 2, age: 0.4, hiss: 0.05 },
      },
      { deviceId: 'murmuration', params: { birds: 5, speed: 0.6, range: 8, mix: 0.5 } },
    ],
  },
  {
    id: 'rootless-over-pedal-comping-off-the-floor',
    name: 'Comping off the floor',
    category: 'keys',
    description:
      'Short tines with a hard cut under 200 hertz and a pair of small dark springs behind them, for chords let go at once.',
    preview: COMPING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -10.5, bell: 0.2, bark: 0.5, tone: 0.5, decay: 0.35 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 200, presence: 2 } },
      {
        deviceId: 'spring-reverb',
        params: { mix: 0.2, decay: 1.6, springs: 1, tone: 2200, drip: 0.2, drive: 0.1 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-someone-elses-root',
    name: "Someone else's root",
    category: 'keys',
    description:
      'Dark felted tines through a small loudspeaker with its bass turned down and the microphone pulled back.',
    preview: TURN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { bell: 0.2, bark: 0.25, decay: 1.8, tone: 0.35 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 0,
          drive: 0.15,
          bass: -0.6,
          distance: 0.6,
          room: 0.5,
          angle: 0.4,
          noise: 0,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-balloon-let-up-slowly',
    name: 'Balloon let up slowly',
    category: 'pad',
    description:
      'Tines with the strike removed so each chord fades in, under a tail that climbs by octaves for five seconds.',
    preview: WIDE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { decay: 3, release: 1.2, tremoloRate: 0.3, bell: 0.25 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 380, sensitivity: -50 } },
      {
        deviceId: 'shimmer',
        params: { interval: 0, shimmer: 0.45, decay: 5, lowCut: 250, tone: 5000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-scattered-guide-tones',
    name: 'Scattered guide tones',
    category: 'bell',
    description:
      'Bright short bell tines answered by six echoes scattered over two seconds, left and right, with no regular beat.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.75, decay: 0.5, release: 0.15, tremolo: 0, tone: 0.65 },
    },
    effects: [
      {
        deviceId: 'constellation',
        params: {
          span: 2000,
          stars: 6,
          pattern: 2,
          fade: 0.3,
          again: 0.2,
          tone: 6000,
          width: 1,
          mix: 0.45,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 140 } },
    ],
  },
  {
    id: 'rootless-over-pedal-bark-without-a-bass',
    name: 'Bark without a bass',
    category: 'keys',
    description:
      'Barking tines high-passed at 260 hertz and played into a slow rotary cabinet with a little drive.',
    preview: TURN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bark: 0.75, hardness: 0.85, tone: 0.5, drive: 0.3, volume: -9.5 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, cutoffHz: 260 } },
      {
        deviceId: 'rotary',
        params: {
          speed: 0,
          hornDepth: 0.75,
          drumDepth: 0.3,
          drive: 0.2,
          distance: 0.3,
          spread: 0.9,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-chord-on-stilts',
    name: 'Chord on stilts',
    category: 'keys',
    description:
      'A soft-hammered reedy piano with no bell in it, turned over by an eight-stage phaser once in eight seconds.',
    preview: OVER_G,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { bark: 0.8, hardness: 0.15, tremolo: 0, tone: 0.55, release: 0.3 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 2,
          centerHz: 900,
          feedback: 35,
          rate: 0.12,
          depth: 75,
          stereo: 120,
          mix: 0.5,
        },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 120, low: -3, air: -3 } },
    ],
  },
  {
    id: 'rootless-over-pedal-what-two-chords-share',
    name: 'What two chords share',
    category: 'keys',
    description:
      'Undamped tines through a filter that keeps what two moments have in common, so tones held between chords ring on.',
    preview: TURN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.4, bark: 0.25, tone: 0.5, release: 1.2 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        params: { ago: 600, keep: 0, strict: 0.8, ring: 0.8, memory: 0.5, mix: 0.85 },
      },
      { deviceId: 'spread', params: { low: 0, mid: 1.3, high: 1.8, make: 0.8 } },
    ],
  },
  {
    id: 'rootless-over-pedal-bass-left-at-the-door',
    name: 'Bass left at the door',
    category: 'keys',
    description:
      'Overdriven tines with everything below 400 hertz taken out, then a harmonic tremolo at two cycles a second.',
    preview: OVER_G,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { drive: 0.7, bark: 0.55, tone: 0.55, tremolo: 0, volume: 6 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, slope: 1, cutoffHz: 400 } },
      { deviceId: 'tremolo', params: { mode: 2, rate: 2, depth: 0.8, crossover: 900 } },
      { deviceId: 'plate-reverb', params: { decay: 0.45, damping: 0.5, mix: 0.18 } },
    ],
  },
  {
    id: 'rootless-over-pedal-anchored-elsewhere',
    name: 'Anchored elsewhere',
    category: 'keys',
    description:
      'A deep mono throb of tines sent into a four-second network of delays that breathes in and out every five seconds.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremolo: 0.85, tremoloRate: 1.4, tone: 0.3, bell: 0.1 },
    },
    effects: [
      {
        deviceId: 'fdn-reverb',
        params: { mix: 0.45, decay: 4, damping: 0.5, size: 1.4, breathRate: 0.2, breathDepth: 0.7 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-four-notes-in-the-pool',
    name: 'Four notes in the pool',
    category: 'keys',
    description:
      'Dark undamped tines just under the surface of water, wavering slowly, with a few small bubbles off each chord.',
    preview: HANGING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { volume: -14, tone: 0.3, bell: 0.2, release: 1, tremolo: 0 },
    },
    effects: [
      {
        deviceId: 'underwater',
        params: { depth: 0.4, waver: 0.6, rate: 0.4, bubbles: 0.25, surface: 0.4, width: 0.8 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-ceiling-of-small-bells',
    name: 'Ceiling of small bells',
    category: 'bell',
    description:
      'Fast shimmering bell tines made wide by a detuned pair of copies, in a bright hall with its lows kept short.',
    preview: WIDE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { volume: -11.5, tremolo: 0.7, tremoloRate: 7, bell: 0.8, decay: 1.2, release: 0.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', params: { detune: 12, delay: 22, focus: 300, mix: 0.5 } },
      {
        deviceId: 'hall-reverb',
        params: { lowDecay: 1.2, midDecay: 3.5, crossover: 400, damping: 12000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-loft-over-the-low-d',
    name: 'Loft over the low D',
    category: 'keys',
    description:
      'Tines that cross the whole width once in eight seconds, with dark bucket-brigade repeats half a second apart.',
    preview: DORIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { bark: 0.2, bell: 0.3, tone: 0.4, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        params: {
          time: 500,
          feedback: 0.5,
          tone: 1800,
          modDepth: 0.4,
          age: 0.5,
          spread: 0.8,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-hollow-under-the-hand',
    name: 'Hollow under the hand',
    category: 'keys',
    description:
      'Plain tines with hardly any bell or bark, ringing inside a stopped pipe that answers mostly the odd harmonics.',
    preview: TURN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        volume: -15.5,
        bell: 0.1,
        bark: 0.05,
        tremolo: 0,
        tone: 0.5,
        decay: 1.8,
        release: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: {
          body: 2,
          size: 0.55,
          material: 0.25,
          opening: 0.3,
          air: 0.1,
          width: 0.8,
          mix: 0.95,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-worn-charts',
    name: 'Worn charts',
    category: 'keys',
    description:
      'Amp-tremolo tines on a worn cassette, narrowed and wobbling, with a single slap of tape echo.',
    preview: COMPING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { volume: -13, tremolo: 0.45, tremoloRate: 5, bark: 0.4, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 1, drive: 0.5, wobble: 0.5, wear: 0.6, noise: 0.15, tone: 0.35 },
      },
      { deviceId: 'tape-echo', params: { time: 160, feedback: 0.15, highCut: 3000, mix: 0.3 } },
    ],
  },
  {
    id: 'rootless-over-pedal-stops-for-the-upper-four',
    name: 'Stops for the upper four',
    category: 'organ',
    description:
      'Dark soft tines with voices one and two octaves above that fade in after the strike, all in a slow chorus.',
    preview: DORIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 3, release: 0.8, tone: 0.3, hardness: 0.3, bell: 0 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0, up1: 0.7, up2: 0.45, dry: 0.6, attack: 0.25, detune: 0.2, spread: 0.8 },
      },
      { deviceId: 'chorus', params: { rate: 0.4, depth: 40, mix: 0.4 } },
    ],
  },
  {
    id: 'rootless-over-pedal-ninth-in-the-fog',
    name: 'Ninth in the fog',
    category: 'pad',
    description:
      'Long tines whose attacks are smeared over a third of a second, leaving chords with no edge and no tail added.',
    preview: WIDE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tremolo: 0, bell: 0.5, tone: 0.55, release: 0.9 },
    },
    effects: [
      {
        deviceId: 'fog',
        params: { size: 350, density: 1, layers: 2, soften: 0.7, damp: 0.2, lowCut: 150, mix: 1 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 110, body: -2 } },
    ],
  },
  {
    id: 'rootless-over-pedal-colour-tones-in-rain',
    name: 'Colour tones in rain',
    category: 'keys',
    description:
      'Felt-soft tines left out in light rain that taps on them and dulls them as it passes over.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { tone: 0.4, bell: 0.35, decay: 1, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'weather',
        params: { kind: 2, exposure: 0.5, voice: 0.35, colour: 0.5, sway: 0.5, force: 0.4 },
      },
      { deviceId: 'ambient-eq', params: { lowCut: 100 } },
    ],
  },
  {
    id: 'rootless-over-pedal-bowls-hold-the-root',
    name: 'Bowls hold the root',
    category: 'keys',
    description:
      'Plain tines over a table of low bowls tuned to D and its fifth, which the chords set ringing.',
    preview: DORIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { tremolo: 0, bell: 0.55, bark: 0.1, decay: 0.7, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'bowls',
        params: {
          root: 2,
          scale: 4,
          bowls: 6,
          ring: 14,
          beat: 0.35,
          strike: 0.4,
          register: 0.25,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-strings-fill-it-in',
    name: 'Strings fill it in',
    category: 'plucked',
    description:
      'Clipped short tines that set six strings of a D minor chord ringing in sympathy for five seconds.',
    preview: BROKEN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { bell: 0.6, bark: 0.2, hardness: 0.8, tone: 0.7, decay: 0.3, volume: -13.5 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        params: { root: 2, mode: 1, sympathy: 0.7, strings: 2, decay: 5, mix: 0.6, width: 1 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-second-hand-voicings',
    name: 'Second hand voicings',
    category: 'keys',
    description:
      'A mono tine piano with some bark and drive, on a warped, crackling record whose groove is worn nearly through.',
    preview: TURN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremolo: 0, pan: 0, bark: 0.6, bell: 0.5, tone: 0.45, decay: 0.5, drive: 0.35 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        params: {
          speed: 2,
          warp: 0.4,
          crackle: 0.5,
          pops: 0.15,
          surface: 0.35,
          wear: 0.8,
          tone: 0,
        },
      },
      { deviceId: 'stereo-widener', params: { width: 0 } },
    ],
  },
  {
    id: 'rootless-over-pedal-chords-from-behind',
    name: 'Chords from behind',
    category: 'texture',
    description:
      'Ringing tines answered by nine-tenths of a second of themselves played backwards, crossing from side to side.',
    preview: HANGING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.6, decay: 1.5, release: 0.6, tone: 0.6 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        params: {
          time: 900,
          feedback: 0.4,
          smooth: 0.5,
          tone: 4000,
          spread: 1,
          lowCut: 200,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-pilot-light',
    name: 'Pilot light',
    category: 'keys',
    description:
      'Soft-hammered barking tines in a short blur, a light fuzz and a four-second wall of their own overtones.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: {
        bark: 0.6,
        hardness: 0.1,
        tremolo: 0,
        tone: 0.3,
        drive: 0.1,
        decay: 2,
        release: 0.5,
      },
    },
    effects: [
      {
        deviceId: 'haze',
        params: {
          haze: 0.4,
          blur: 0.6,
          decay: 4,
          size: 0.5,
          tone: 0.45,
          octave: 0,
          feed: 0.1,
          mix: 0.5,
        },
      },
    ],
  },

  // Drone: what the pedal is made of. Shape chooses its chord, then dark to bright, still to moving, hum to air.
  {
    id: 'rootless-over-pedal-one-d-three-jobs',
    name: 'One D, three jobs',
    category: 'drone',
    description:
      'An octave drone that speaks in half a second, split into five bands that each swell and drift on a slow cycle.',
    preview: SHELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: {
        volume: -5,
        attack: 0.5,
        release: 1.6,
        cutoff: 1500,
        movement: 0.3,
        rate: 0.1,
        sub: 0.2,
        air: 0,
        wave: 0.4,
      },
    },
    effects: [{ deviceId: 'currents', params: { depth: 0.8, sway: 0.8, rate: 0.16, bands: 5 } }],
  },
  {
    id: 'rootless-over-pedal-slab-under-the-house',
    name: 'Slab under the house',
    category: 'bass',
    description:
      'A low hum with its sub octave full up, driven through a tube curve until small speakers can hear it, kept in the middle.',
    preview: GROUND,
    instrument: {
      deviceId: 'drone',
      preset: 'Low hum',
      params: { volume: -31.5, cutoff: 150, attack: 1.5, release: 4, width: 0, movement: 0.1 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 2, driveDb: 18, bias: 0.3, toneDb: -3 } },
      { deviceId: 'ambient-eq', params: { lowCut: 30, highCut: 1800 } },
    ],
  },
  {
    id: 'rootless-over-pedal-third-and-seventh-lent',
    name: 'Third and seventh lent',
    category: 'drone',
    description:
      'A drone of open fifths, fairly bright and speaking within a second, in a wide three-voice chorus and a warm hall.',
    preview: BORROWED,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -4,
        attack: 0.7,
        release: 2,
        cutoff: 4200,
        partials: 0.75,
        sub: 0.1,
        wave: 0.35,
      },
    },
    effects: [
      { deviceId: 'chorus', params: { rate: 0.35, depth: 65, spread: 100, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rootless-over-pedal-whistle-on-the-third',
    name: 'Whistle on the third',
    category: 'drone',
    description:
      'Six overtones on every key, kept nearly still, and a narrow resonance that walks through the harmonics of F and whistles them.',
    preview: TRIADS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        volume: -2,
        partials: 0.71,
        attack: 0.6,
        release: 2.5,
        cutoff: 6000,
        movement: 0.3,
        sub: 0,
      },
    },
    effects: [
      {
        deviceId: 'overtone-singer',
        params: { root: 5, pattern: 0, pace: 1.2, glide: 200, octave: 2, focus: 0.7, drone: 0.6 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.6, mix: 0.2 } },
    ],
  },
  {
    id: 'rootless-over-pedal-triads-with-no-bass',
    name: 'Triads with no bass',
    category: 'organ',
    description:
      'A just major triad on every key with no sub below it, spun fast in a rotary cabinet heard from close by.',
    preview: TRIADS,
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: {
        attack: 0.4,
        release: 1.2,
        sub: 0,
        air: 0.05,
        cutoff: 3000,
        partials: 0.6,
        wave: 0.25,
      },
    },
    effects: [
      {
        deviceId: 'rotary',
        params: { speed: 1, hornDepth: 0.8, drumDepth: 0.4, drive: 0.35, distance: 0.1, spread: 1 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-a-minor-over-d-minor',
    name: 'A minor over D minor',
    category: 'pad',
    description:
      'A bright just minor triad whose every band has its own small tremolo, rising in ripples, with a plate behind.',
    preview: MINORS,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor glass',
      params: { attack: 0.5, release: 2.2, cutoff: 7000, sub: 0.1 },
    },
    effects: [
      {
        deviceId: 'glimmer',
        params: { depth: 0.85, rate: 1.6, grain: 0.8, pattern: 1, lean: 0.2 },
      },
      { deviceId: 'plate-reverb', params: { decay: 0.75, damping: 0.2, mix: 0.3 } },
    ],
  },
  {
    id: 'rootless-over-pedal-wind-that-knows-dorian',
    name: 'Wind that knows dorian',
    category: 'texture',
    description:
      'Tuned air round one plain sine a key, passed only through the notes of D dorian, each left ringing for a second.',
    preview: SHELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Tuned wind',
      params: { attack: 0.8, release: 2, cutoff: 12000 },
    },
    effects: [
      {
        deviceId: 'scale-filter',
        params: { root: 2, scale: 3, chord: 0, ring: 1, depth: 40, width: 25 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-swarm-on-two-notes',
    name: 'Swarm on two notes',
    category: 'pad',
    description:
      'A fast-wandering swarm of saws opened and shut by a resonant low-pass on a twelve-second cycle.',
    preview: SHELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Saw swarm',
      params: { attack: 0.4, release: 1.5, cutoff: 6000, movement: 0.8 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 0, slope: 1, cutoffHz: 700, resonance: 3, lfoAmount: 60, lfoRateHz: 0.083 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.7 } },
    ],
  },
  {
    id: 'rootless-over-pedal-ground-that-stands',
    name: 'Ground that stands',
    category: 'drone',
    description:
      'A motionless mono stack of harmonics, pushed through a transformer, its level swelling and sinking once in four seconds.',
    preview: GROUND,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: {
        volume: -15.5,
        attack: 1.5,
        release: 2,
        cutoff: 600,
        wave: 0.8,
        partials: 0.55,
        sub: 0.2,
      },
    },
    effects: [
      { deviceId: 'analog-drive', params: { circuit: 2, drive: 0.45, lowBump: 0.4 } },
      { deviceId: 'tremolo', params: { mode: 0, rate: 0.25, depth: 0.75, drift: 0, smooth: 0.8 } },
    ],
  },
  {
    id: 'rootless-over-pedal-cluster-on-the-step',
    name: 'Cluster on the step',
    category: 'texture',
    description:
      'Five neighbouring notes on every key, dissolved by a spectral blur into a wide, slowly living wash.',
    preview: FIVES,
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: {
        volume: -5,
        partials: 0.57,
        attack: 1,
        release: 4,
        air: 0.15,
        cutoff: 5000,
        movement: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        params: { blur: 0.75, smear: 1, tilt: 1, lowCut: 120, shimmer: 0.3, mix: 0.9 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-pipes-that-stay',
    name: 'Pipes that stay',
    category: 'organ',
    description:
      'A still organ of plain octaves with stops a fifth and two octaves above, speaking a little late with a puff of air.',
    preview: BORROWED,
    instrument: {
      deviceId: 'drone',
      preset: 'Still organ',
      params: { shape: 1, attack: 0.15, release: 0.6, partials: 0.45, sub: 0.2 },
    },
    effects: [
      {
        deviceId: 'stops',
        params: {
          sub: 0.2,
          unison: 0.8,
          fifth: 0.6,
          octave: 0.3,
          twelfth: 0.2,
          fifteenth: 0.5,
          speak: 250,
          chiff: 0.6,
          mix: 0.8,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-pedal-across-the-bay',
    name: 'Pedal across the bay',
    category: 'drone',
    description:
      'Deep slow octaves far off over open water: distant, darkened, narrow, and wandering nearer and farther by themselves.',
    preview: SLOWLY,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { volume: -5, attack: 2, release: 5, cutoff: 1400, sub: 0.4, wave: 0.7 },
    },
    effects: [
      {
        deviceId: 'distance',
        params: {
          distance: 0.85,
          room: 0.7,
          air: 0.8,
          wander: 0.7,
          rate: 0.15,
          decay: 4,
          width: 0.2,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-inhale-on-the-tonic',
    name: 'Inhale on the tonic',
    category: 'drone',
    description:
      'Shimmering octaves opened and closed by a breath of two seconds in and three out, dull and narrow when it is empty.',
    preview: SHELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Octave shimmer',
      params: { attack: 0.3, release: 2, rate: 0.6, air: 0.4, cutoff: 9000 },
    },
    effects: [
      {
        deviceId: 'breath',
        params: {
          in: 2,
          out: 3,
          hold: 0.2,
          rest: 0.3,
          depth: 0.9,
          colour: 0.9,
          width: 0.8,
          air: 0.5,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-cistern-below-stairs',
    name: 'Cistern below stairs',
    category: 'drone',
    description:
      'A low unison of eight wandering voices, sounded inside a large drumhead that gives it a second, hollower note.',
    preview: SLOWLY,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: { hold: 0, wave: 0.6, attack: 0.2, release: 1, sub: 0, cutoff: 3500, movement: 0.4 },
    },
    effects: [
      {
        deviceId: 'vessel',
        params: {
          body: 4,
          size: 2.5,
          material: 0.6,
          opening: 0.5,
          air: 0.1,
          tone: 0.4,
          width: 1,
          mix: 0.9,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-ninths-come-and-go',
    name: 'Ninths come and go',
    category: 'drone',
    description:
      'Open fifths gated by two soft patterns of eight, one a little faster, on opposite sides.',
    preview: JOINED,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -5.5,
        attack: 0.1,
        release: 0.8,
        cutoff: 2000,
        movement: 0.2,
        sub: 0.2,
        wave: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: { rate: 3, steps: 8, fill: 5, drift: 0.6, floor: 0.1, apart: 1, edge: 0.4 },
      },
      { deviceId: 'tape-echo', params: { time: 500, feedback: 0.3, mix: 0.25 } },
    ],
  },
  {
    id: 'rootless-over-pedal-doorway-left-unresolved',
    name: 'Doorway left unresolved',
    category: 'pad',
    description:
      'Root, second and fifth on each key, moved slowly round the head in a figure of eight.',
    preview: LOW_F,
    instrument: {
      deviceId: 'drone',
      preset: 'Suspended second',
      params: { volume: -5, attack: 0.6, release: 2.5, cutoff: 8000, sub: 0, air: 0.1, wave: 0.05 },
    },
    effects: [
      { deviceId: 'around', params: { path: 1, rate: 0.25, radius: 1, head: 1, blur: 0.2 } },
    ],
  },
  {
    id: 'rootless-over-pedal-copper-earth-wire',
    name: 'Copper earth wire',
    category: 'drone',
    description:
      'A unison of saws ring-modulated by a low D and its fifth, which puts a dark bell colour round the pedal.',
    preview: GROUND,
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: { hold: 0, wave: 1, attack: 1.2, release: 3, cutoff: 1500, sub: 0.2 },
    },
    effects: [
      {
        deviceId: 'ring',
        params: {
          root: 2,
          octave: 2,
          wave: 0,
          second: 1,
          drift: 0.1,
          lowCut: 60,
          tone: 4000,
          width: 0.8,
          mix: 0.45,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-latch-the-tonic',
    name: 'Latch the tonic',
    category: 'drone',
    description:
      'A latched drone of pure tones that keeps sounding after the hands leave, in a narrow dark space.',
    preview: GROUND,
    instrument: {
      deviceId: 'drone',
      preset: 'Held major',
      params: {
        shape: 2,
        hold: 1,
        wave: 0,
        attack: 3,
        release: 3,
        partials: 0.3,
        cutoff: 800,
        sub: 0.6,
        air: 0,
      },
    },
    effects: [
      { deviceId: 'ether-reverb', params: { mix: 0.35, decay: 4, damping: 0.8, size: 0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.25 } },
    ],
  },
  {
    id: 'rootless-over-pedal-sines-over-low-f',
    name: 'Sines over low F',
    category: 'drone',
    description:
      'Fifths drawn again as ten pure sines that swell in an octave above and linger for five seconds.',
    preview: LOW_F,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: { attack: 0.3, release: 0.5, cutoff: 5000, wave: 0.5, sub: 0.4, movement: 0.4 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        params: {
          partials: 10,
          transpose: 12,
          attack: 900,
          release: 5,
          spread: 1,
          tone: 0.7,
          mix: 0.75,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-grit-in-the-ground',
    name: 'Grit in the ground',
    category: 'bass',
    description:
      'Low octaves pushed into a dark triode fuzz that stops at two kilohertz, with no reverb at all.',
    preview: GROUND,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: { volume: -27.5, attack: 0.4, release: 1, cutoff: 900, movement: 0.5, rate: 0.2 },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        params: {
          circuit: 3,
          drive: 0.6,
          push: 1,
          lowCut: 40,
          tone: -0.5,
          highCut: 2200,
          output: -6,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-moths-at-the-ceiling',
    name: 'Moths at the ceiling',
    category: 'texture',
    description:
      'A soft minor triad that throws off bright sparks two octaves up, each with a short trail.',
    preview: MINORS,
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { volume: -4.5, attack: 0.4, release: 2, cutoff: 1600, sub: 0.2, wave: 0.5 },
    },
    effects: [
      {
        deviceId: 'glints',
        params: {
          density: 9,
          pitch: 2,
          size: 90,
          scatter: 600,
          sparkle: 0.8,
          spread: 1,
          trail: 0.5,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-station-tuned-to-d',
    name: 'Station tuned to D',
    category: 'texture',
    description:
      'A saw-edged octave drone heard through a small radio, its band narrowed and roughened, with a little noise under it.',
    preview: SHELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Standing wave',
      params: {
        shape: 1,
        attack: 0.2,
        release: 0.6,
        wave: 0.8,
        cutoff: 4000,
        partials: 0.7,
        movement: 0.3,
        sub: 0,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        params: { medium: 3, drive: 0.4, wobble: 0.1, wear: 0.4, noise: 0.25, tone: 0.5 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-peat-and-standing-water',
    name: 'Peat and standing water',
    category: 'drone',
    description:
      'Very dark fifths over a strong sub octave, fed back on themselves so a soft overtone blooms out of the held note.',
    preview: BORROWED,
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        volume: -5.5,
        cutoff: 350,
        wave: 1,
        attack: 1,
        release: 3,
        sub: 0.7,
        air: 0,
        partials: 0.45,
        movement: 0.7,
        rate: 0.3,
      },
    },
    effects: [{ deviceId: 'howl', preset: 'Low drone', params: { mix: 0.5 } }],
  },
  {
    id: 'rootless-over-pedal-grain-of-the-boards',
    name: 'Grain of the boards',
    category: 'texture',
    description:
      'A fifth drone cut into quarter-second grains, half of them reversed and scattered wide, over the dry sound.',
    preview: BORROWED,
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: { volume: -5, shape: 2, attack: 0.15, release: 1, cutoff: 2600, partials: 0.5 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        params: {
          size: 250,
          density: 9,
          spray: 0.7,
          scatter: 0.7,
          reverse: 0.5,
          texture: 0.2,
          spread: 1,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-throb-in-the-joists',
    name: 'Throb in the joists',
    category: 'drone',
    description:
      'A reedy octave drone with only its middle pulsing, four times a second, between 150 and 800 hertz.',
    preview: SHELLS,
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        attack: 0.15,
        release: 0.8,
        cutoff: 2800,
        wave: 0.9,
        sub: 0.5,
        movement: 0.2,
        width: 0.3,
      },
    },
    effects: [
      {
        deviceId: 'band-pulse',
        params: { rate: 4, depth: 0.9, duty: 0.5, edge: 30, offset: 90, low: 150, high: 800 },
      },
      { deviceId: 'spring-reverb', params: { mix: 0.25, decay: 3, springs: 2, tone: 3000 } },
    ],
  },

  // Tanpura: the pedal that plays itself. Fourth, fifth or semitone below; closed bridge to full buzz; quick round to slow.
  {
    id: 'rootless-over-pedal-two-roots-one-gourd',
    name: 'Two roots, one gourd',
    category: 'drone',
    description:
      'A tanpura with the fourth below, plucked round in four seconds, its bridge half open, in a small plate.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { volume: -0.5, speed: 4, jawari: 0.5, body: 0.6 },
    },
    effects: [{ deviceId: 'plate-reverb', params: { decay: 0.4, damping: 0.4, mix: 0.2 } }],
  },
  {
    id: 'rootless-over-pedal-bridge-open-to-noon',
    name: 'Bridge open to noon',
    category: 'drone',
    description:
      'A full-buzz tanpura going round every two and a half seconds, all lows cut, in a bright wide hall.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Fast buzzing round',
      params: { volume: -0.5, speed: 2.4, decay: 9, body: 0 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 260, presence: 2, air: 4 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'rootless-over-pedal-c-falls-to-b',
    name: 'C falls to B',
    category: 'plucked',
    description:
      'A tanpura strung with the fifth below, quick and clear, with three-head tape repeats between its plucks.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { volume: -1, speed: 2.8, jawari: 0.3, decay: 6, spread: 0.8 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 350,
          feedback: 0.4,
          heads: 2,
          wow: 0.3,
          highCut: 3500,
          spread: 0.8,
          mix: 0.4,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-semitone-under-f',
    name: 'Semitone under F',
    category: 'drone',
    description:
      'A tanpura strung with the semitone below, so root and major seventh rub, slowly swept by a twelve-stage phaser.',
    preview: LOW_F,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { volume: -1, speed: 4.5, jawari: 0.8 },
    },
    effects: [
      {
        deviceId: 'phaser',
        params: {
          stages: 4,
          centerHz: 1200,
          spread: 60,
          feedback: 60,
          rate: 0.15,
          depth: 85,
          stereo: 180,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-plain-string-far-wall',
    name: 'Plain string, far wall',
    category: 'drone',
    description:
      'Four strings with no buzz in them, plucked round in three and a half seconds, in a six-second space with the highs taken off.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { volume: -3.5, speed: 3.4, body: 0.3, detune: 2 },
    },
    effects: [
      {
        deviceId: 'expanse',
        params: { size: 0.8, decay: 6, lowCut: 120, highCut: 2400, modDepth: 0.2, mix: 0.6 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-gourd-with-the-lid-on',
    name: 'Gourd with the lid on',
    category: 'bass',
    description:
      'A nearly closed, big-bodied tanpura strung with the fifth below, under a low-pass at 420 hertz that each pluck lifts.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Low Ma gourd',
      params: { speed: 3, jawari: 0.35, spread: 0.1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 420,
          resonance: 1.5,
          envAmount: 35,
          envAttackMs: 30,
          envReleaseMs: 700,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-quick-round-tin-yard',
    name: 'Quick round, tin yard',
    category: 'plucked',
    description:
      'A short dry tanpura played round fast into an overdriven spring tank with a wet drip on each pluck.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Quick dry round',
      params: { volume: 0, speed: 2, decay: 3, jawari: 0.25 },
    },
    effects: [
      {
        deviceId: 'spring-reverb',
        params: {
          mix: 0.5,
          decay: 2.5,
          tension: 0.8,
          springs: 0,
          tone: 4500,
          drip: 0.9,
          drive: 0.6,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-bowed-without-a-bow',
    name: 'Bowed without a bow',
    category: 'string',
    description:
      'A tanpura whose plucks are faded in over nearly half a second, so its buzz arrives first as a swell, then a chorus.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { volume: 3, speed: 4, jawari: 1, body: 0.5, spread: 0.7 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 450, sensitivity: -55, release: 60 } },
      { deviceId: 'chorus', params: { rate: 0.6, depth: 45, mix: 0.5 } },
    ],
  },
  {
    id: 'rootless-over-pedal-round-caught-and-held',
    name: 'Round caught and held',
    category: 'pad',
    description:
      'A soft tanpura caught as it plays and held as an even dark pad that glides from one chord to the next.',
    preview: LENT_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { volume: -2, speed: 3.5, jawari: 0.2, decay: 4, body: 0.5 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        params: {
          mode: 0,
          sensitivity: 0.7,
          attack: 0.5,
          decay: 4,
          glide: 0.8,
          motion: 0.3,
          ensemble: 0.6,
          tone: -0.5,
          mix: 0.85,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-only-the-bloom',
    name: 'Only the bloom',
    category: 'texture',
    description:
      'A buzzing tanpura with its plucks sifted out and its tones held, so the overtones open with nothing struck.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { speed: 3, jawari: 0.95, body: 0.1, decay: 14 },
    },
    effects: [
      {
        deviceId: 'sift',
        params: { tones: 3, attacks: -30, air: -18, hold: 0.7, sharpness: 0.7, soften: 0.6 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-loudspeaker-in-the-tree',
    name: 'Loudspeaker in the tree',
    category: 'drone',
    description:
      'A tanpura through a horn loudspeaker driven hard, heard from across a yard with the room around it.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { volume: 2, speed: 3.2, jawari: 0.6, decay: 8 },
    },
    effects: [
      {
        deviceId: 're-amp',
        params: {
          speaker: 3,
          drive: 0.6,
          treble: 0.2,
          distance: 0.7,
          room: 0.7,
          angle: 0.5,
          noise: 0,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-drone-from-a-chip',
    name: 'Drone from a chip',
    category: 'drone',
    description:
      'A tanpura at a seven-kilohertz sample rate and eight bits, aliasing left in, so each bloom folds back on itself.',
    preview: LOW_F,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bright Ni shimmer',
      params: { volume: -3.5, speed: 2.6, detune: 1, body: 0.3 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        params: { rate: 7000, bits: 8, companding: 1, aliasing: 0.6, filter: 1, jitter: 0.2 },
      },
      { deviceId: 'ambient-eq', params: { highCut: 6000 } },
    ],
  },
  {
    id: 'rootless-over-pedal-cellar-octave-half-pace',
    name: 'Cellar octave, half pace',
    category: 'bass',
    description:
      'A tanpura played back an octave down at half its pace in smooth one-second cycles, with a trace of the buzz left.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { volume: -3, speed: 2.5, jawari: 0.45, body: 0.4 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        params: {
          length: 1000,
          speed: 2,
          smooth: 0.9,
          fade: 0.3,
          jitter: 0,
          highCut: 5000,
          spread: 0.5,
          mix: 0.85,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-gourd-grown-huge',
    name: 'Gourd grown huge',
    category: 'drone',
    description:
      'The same notes in a much larger body that slowly swells and shrinks, from a dry tanpura with no gourd of its own.',
    preview: LENT_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma full bloom',
      params: { volume: -2.5, body: 0, speed: 3.4, decay: 12 },
    },
    effects: [{ deviceId: 'size', params: { size: 0.9, wander: 0.4, rate: 0.2, width: 0.7 } }],
  },
  {
    id: 'rootless-over-pedal-overtones-on-a-ladder',
    name: 'Overtones on a ladder',
    category: 'texture',
    description:
      'A bright tanpura split into sixteen bands that leave one after another from low to high over a second and a half.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Bare string buzz',
      params: { volume: -2.5, speed: 3.6, decay: 10, detune: 1, jawari: 0.8 },
    },
    effects: [
      {
        deviceId: 'prism',
        params: { time: 1500, shape: 0, bands: 16, feedback: 0.3, smear: 0.3, width: 1, mix: 0.7 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-comb-over-the-tonic',
    name: 'Comb over the tonic',
    category: 'drone',
    description:
      'A plain four-string round inside a hollow negative flange that moves once in ten seconds.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { volume: -2.5, speed: 2.4, decay: 8, body: 0.7, jawari: 0.4 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 3.5, rate: 0.1, depth: 60, feedback: -75, stereo: 150, mix: 0.55 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-rounds-of-three-lengths',
    name: 'Rounds of three lengths',
    category: 'texture',
    description:
      'A tanpura recorded into three loops of unequal length that turn against each other while it plays on.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { volume: -0.5, speed: 4.5, decay: 4, jawari: 0.6 },
    },
    effects: [
      {
        deviceId: 'orbits',
        params: {
          loops: 3,
          length: 0.9,
          offset: 8,
          feedback: 0.7,
          wear: 0.4,
          spread: 1,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-the-pedal-says-oh',
    name: 'The pedal says oh',
    category: 'voice',
    description:
      'A tanpura pressed into the colour of a large round vowel until most of its own tone is gone, in a short room.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wide beating',
      params: { speed: 2.8, jawari: 0.9, decay: 14, body: 0.2 },
    },
    effects: [
      {
        deviceId: 'imprint',
        params: { shape: 2, amount: 1.6, shift: -5, replace: 0.8, smooth: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rootless-over-pedal-quiet-partials-forward',
    name: 'Quiet partials forward',
    category: 'drone',
    description:
      'A nearly closed tanpura with whatever is quiet inside it turned up, partial by partial, up to 24 decibels.',
    preview: LOW_F,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Dark slow Ni',
      params: { speed: 3.6, jawari: 0.15, decay: 20 },
    },
    effects: [
      {
        deviceId: 'reveal',
        params: { amount: 1, rise: 120, focus: 0.5, detail: 0.9, range: 24, floor: -66 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-bronze-bent-round',
    name: 'Bronze bent round',
    category: 'bell',
    description:
      'A short tanpura with the spacing of its partials stretched round the note it plays, so the plucks turn to small gongs.',
    preview: LENT_D,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Ma tuning',
      params: { volume: 0.5, jawari: 0.55, speed: 2.2, decay: 4, body: 0.1 },
    },
    effects: [
      { deviceId: 'warp', params: { stretch: 0.4, follow: 1, drift: 0.05, width: 0.6, mix: 0.8 } },
      { deviceId: 'fdn-reverb', params: { mix: 0.3, decay: 3, breathDepth: 0 } },
    ],
  },
  {
    id: 'rootless-over-pedal-room-learns-the-pedal',
    name: 'Room learns the pedal',
    category: 'drone',
    description:
      'A tanpura recorded again through a resonant room every second and a half, until the room hums along on its own.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { volume: -2.5, speed: 5, decay: 5, spread: 0.2 },
    },
    effects: [
      {
        deviceId: 'generations',
        params: {
          length: 1.5,
          room: 0.7,
          resonance: 0.6,
          keep: 0.8,
          damping: 0.4,
          hiss: 0,
          width: 1,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-line-to-a-far-stage',
    name: 'Line to a far stage',
    category: 'drone',
    description:
      'A tanpura down a starved connection: its quiet overtones are thrown away, so the bloom swirls and warbles.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Slow wall',
      params: { volume: -4, speed: 3, jawari: 0.7, decay: 18, spread: 0.3 },
    },
    effects: [
      {
        deviceId: 'low-bitrate',
        params: { loss: 0.75, mode: 0, frame: 2, smear: 0.4, stereo: 1, highCut: 7000 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-octaves-fall-in-behind',
    name: 'Octaves fall in behind',
    category: 'texture',
    description:
      'A tanpura whose plucks come back as little loops an octave up, seven in a row, dimming as they go.',
    preview: JOINED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Plain plucked four',
      params: { volume: 1, speed: 5, jawari: 0.2, decay: 3, body: 0.4 },
    },
    effects: [
      {
        deviceId: 'cascade',
        params: {
          pattern: 1,
          time: 260,
          repeats: 7,
          decay: 0.3,
          high: 0.9,
          low: 0,
          spread: 1,
          tone: 12000,
          mix: 0.65,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-wax-cylinder-tonic',
    name: 'Wax cylinder tonic',
    category: 'drone',
    description:
      'A mono tanpura on an old record at 78, a little warped and tilted bright, with crackle and surface noise over it.',
    preview: BORROWED,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Mono gourd drone',
      params: { volume: -1, speed: 3.8, jawari: 0.6 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Parlour 78' }],
  },
  {
    id: 'rootless-over-pedal-tail-cut-in-a-shape',
    name: 'Tail cut in a shape',
    category: 'plucked',
    description:
      'Dry quick plucks whose reverb rises backwards for most of a second and stops dead, so each string answers itself.',
    preview: FOURTHS,
    instrument: {
      deviceId: 'tanpura',
      preset: 'Low Ma gourd',
      params: { volume: 3, speed: 3.6, jawari: 0.5, decay: 3, body: 0.3, spread: 0.9 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        params: { shape: 1, time: 0.8, density: 0.9, tail: 0, highCut: 7000, width: 1, mix: 0.6 },
      },
    ],
  },

  // Felt piano: the hand above the pedal, from a bare upright to a wash.
  {
    id: 'rootless-over-pedal-hand-on-the-upper-stair',
    name: 'Hand on the upper stair',
    category: 'keys',
    description:
      'A close felted piano with its lows cut at 180 hertz and the quiet end, key noise and all, brought up.',
    preview: TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { reverbMix: 0, felt: 0.8, resonance: 0.2, outputDb: -21.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 180, body: -2 } },
      {
        deviceId: 'lift',
        params: { threshold: -20, amount: 0.9, rise: 0.15, split: 0.6, limit: 20 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-attic-with-no-stairs',
    name: 'Attic with no stairs',
    category: 'keys',
    description:
      'A piano with no detune and no stiffness, thinned under 350 hertz, in a tail of reversed grains that rise by octaves.',
    preview: WIDE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { reverbMix: 0, outputDb: -8 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 350, low: -6 } },
      {
        deviceId: 'bloom-reverb',
        params: {
          bloom: 0.7,
          direction: 0,
          interval: 1,
          decay: 5,
          season: 0,
          width: 0.9,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-lamp-over-the-keys',
    name: 'Lamp over the keys',
    category: 'keys',
    description:
      'A creaking, felted upright a hand away: loud action, no reverb, and the hiss of a microphone that rides with it.',
    preview: COMPING,
    instrument: { deviceId: 'felt-piano', preset: 'Close and creaky', params: { outputDb: -8 } },
    effects: [
      { deviceId: 'noise-floor', params: { type: 6, level: -46, follow: 0.6, movement: 0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.75 } },
    ],
  },
  {
    id: 'rootless-over-pedal-glass-without-a-root',
    name: 'Glass without a root',
    category: 'bell',
    description:
      'A hard bare upright, stiff as glass, whose echoes skip closer and closer together from side to side.',
    preview: BROKEN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { reverbMix: 0.1, thump: 0, outputDb: -2.5 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        params: { first: 420, bounce: 0.82, skips: 9, loss: 1.8, sink: 0.4, throw: 1, mix: 0.55 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-chord-turned-to-choir',
    name: 'Chord turned to choir',
    category: 'voice',
    description:
      'A blurred wash of pedalled strings in a long hall shaped like a sung vowel, with the strike nearly gone.',
    preview: HANGING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0, outputDb: -1 },
    },
    effects: [
      { deviceId: 'swell', params: { attack: 250, sensitivity: -60 } },
      {
        deviceId: 'vowel-reverb',
        params: { vowel: 3, resonance: 0.8, voice: 0.6, decay: 7, mix: 0.8 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-schoolroom-thirteenths',
    name: 'Schoolroom thirteenths',
    category: 'keys',
    description:
      'A clattering old upright through a band-pass at 800 hertz, then pushed into a hard-edged drive.',
    preview: TURN,
    instrument: { deviceId: 'felt-piano', preset: 'Old upright', params: { outputDb: -16 } },
    effects: [
      { deviceId: 'auto-filter', params: { type: 2, cutoffHz: 800, resonance: 1 } },
      { deviceId: 'saturator', params: { curve: 1, driveDb: 10, outputDb: -4 } },
    ],
  },
  {
    id: 'rootless-over-pedal-loop-left-on-the-lid',
    name: 'Loop left on the lid',
    category: 'keys',
    description:
      'A worn mono piano kept on two seconds of tape, whose passes return at half speed an octave down and fade.',
    preview: DORIAN,
    instrument: { deviceId: 'felt-piano', preset: 'Worn mono', params: { outputDb: -15.5 } },
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 2, feedback: 0.6, speed: 0, wear: 0.5, wow: 0.5, spread: 0.8, mix: 0.6 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-strings-know-the-bass',
    name: 'Strings know the bass',
    category: 'pad',
    description:
      'A piano with the pedal down and a dark string section that swells in behind each chord and an octave under it.',
    preview: OVER_G,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: { felt: 0.9, outputDb: -12 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        params: {
          rise: 0.4,
          fall: 2,
          sensitivity: 0.7,
          octaves: -0.6,
          brightness: 1400,
          ensemble: 0.8,
          mix: 0.75,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-chords-from-last-minute',
    name: 'Chords from last minute',
    category: 'keys',
    description:
      'A soft thud of a piano with dark echoes, under which its own earlier chords drift back, some of them backwards.',
    preview: TURN,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { reverbMix: 0.1, thump: 0.5, hardness: 0.15, outputDb: -12 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        params: {
          time: 750,
          feedback: 0.55,
          echo: 0.9,
          memory: 0.9,
          reach: 6,
          size: 1.2,
          tone: 2500,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },

  // Afterglow: the chord struck and then left standing over its pedal.
  {
    id: 'rootless-over-pedal-glow-that-climbs-away',
    name: 'Glow that climbs away',
    category: 'keys',
    description:
      'A felt strike that turns to a bright glow, under a reverb that glides upward for as long as it rings.',
    preview: WIDE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { tone: 0.65, glow: 0.5, bloom: 1, fade: 2.5 },
    },
    effects: [
      {
        deviceId: 'spiral',
        params: { climb: 5, decay: 5, size: 0.6, voices: 4, tone: 8000, mix: 0.55 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-bells-clipped-of-roots',
    name: 'Bells clipped of roots',
    category: 'bell',
    description:
      'Struck bells with a short glow, answered a third of a second later an octave higher, then again at their own pitch.',
    preview: BROKEN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { volume: 1, glow: 0.2, decay: 1.5, fade: 1, halo: 0, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: {
          followers: 2,
          gap: 0.35,
          interval1: 12,
          interval2: 0,
          fade: 0.3,
          spread: 1,
          mix: 0.6,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-no-strike-only-chord',
    name: 'No strike, only chord',
    category: 'pad',
    description:
      'The glow alone with its strike at nothing, in the colours of a dark crumbling autumn that stands still.',
    preview: HANGING,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.8, fade: 3, tone: 0.4, width: 0.9 },
    },
    effects: [
      {
        deviceId: 'seasons',
        params: { year: 0.625, turn: 0, depth: 1, motion: 0.8, grit: 0.7, space: 0.5 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-glass-slid-by-hertz',
    name: 'Glass slid by hertz',
    category: 'bell',
    description:
      'Still glass moved three hertz up on one side and down on the other, so the chord beats gently between the ears.',
    preview: TURN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { volume: -2.5, glow: 0.35, decay: 5, fade: 2, width: 0 },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        params: { shift: 0, fine: 3, mode: 2, feedback: 0, lfoDepth: 0, width: 1, mix: 1 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-plucked-then-kept',
    name: 'Plucked, then kept',
    category: 'plucked',
    description:
      'A plucked chord with a short haze, looped as soon as it is played into a soft bed at half speed.',
    preview: COMPING,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { volume: -2, glow: 0.2, decay: 1.2, fade: 0.8, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        params: {
          state: 2,
          length: 2,
          speed: 3,
          smear: 0.6,
          fade: 0.7,
          tone: 5000,
          spread: 1,
          mix: 0.5,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-shells-in-the-cave-mouth',
    name: 'Shells in the cave mouth',
    category: 'keys',
    description:
      'A dark felt strike with a dull glow, scattered by a swarm of short echoes in a cave that bends as it resizes.',
    preview: SHELLS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { volume: -1.5, decay: 1, fade: 2, glow: 0.4, tone: 0.3 },
    },
    effects: [
      {
        deviceId: 'swarm-reverb',
        params: {
          length: 0.7,
          blur: 0.2,
          feedback: 0.7,
          highCut: 3500,
          wander: 0.3,
          glide: 2,
          mix: 0.55,
        },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-sevenths-float-upward',
    name: 'Sevenths float upward',
    category: 'texture',
    description:
      'Glowing keys with a wide halo, small pieces of which are caught and lifted an octave as they fade.',
    preview: WIDE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Shimmer keys',
      params: { halo: 0.6, tone: 0.4, strike: 0.5, decay: 2, fade: 3 },
    },
    effects: [
      {
        deviceId: 'falling',
        params: { fall: 12, size: 500, density: 8, vary: 0.2, spread: 1, again: 0.3, mix: 0.6 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-chord-that-waits-to-sing',
    name: 'Chord that waits to sing',
    category: 'voice',
    description:
      'A quick swell with little strike, straight at first, then swaying wider the longer the chord is held.',
    preview: DORIAN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Quick swell',
      params: { fade: 0.8, bloom: 0.5, tone: 0.5, evolve: 0.2 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        params: { wait: 500, grow: 900, depth: 45, rate: 4.8, swell: 0.5, width: 0.9 },
      },
      { deviceId: 'ether-reverb', params: { mix: 0.25, decay: 3, size: 0.5 } },
    ],
  },

  // Wavetable: chords thin as reeds, from an organ of two notes to a bright hollow pad.
  {
    id: 'rootless-over-pedal-two-reeds-and-a-floor',
    name: 'Two reeds and a floor',
    category: 'organ',
    description:
      'A reed organ table that speaks at once and stops at once, in a slow hollow flange.',
    preview: SHELLS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.04, release: 0.25, position: 0.35, sub: 0, cutoff: 3600 },
    },
    effects: [
      {
        deviceId: 'flanger',
        params: { delayMs: 5, rate: 0.15, depth: 50, feedback: -55, stereo: 180, mix: 0.5 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-thirteenth-let-go',
    name: 'Thirteenth let go',
    category: 'voice',
    description:
      'A slow choir of vowels without a sub, pressed through a hollow tube and set well back in a room that rings for five seconds.',
    preview: HANGING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.8, release: 2.5, sub: 0, position: 0.35 },
    },
    effects: [
      { deviceId: 'imprint', params: { shape: 4, amount: 1.4, smooth: 0.3, replace: 0.3 } },
      {
        deviceId: 'distance',
        params: { distance: 0.65, room: 0.9, decay: 5, wander: 0.1, width: 0.9 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-pulse-thin-as-a-ninth',
    name: 'Pulse thin as a ninth',
    category: 'keys',
    description:
      'A narrow pulse, short and bright with its lows removed, in dotted tape repeats that cross the width.',
    preview: COMPING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { release: 0.15, cutoff: 3000, resonance: 0.35 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 250 } },
      {
        deviceId: 'tape-echo',
        params: { time: 500, heads: 3, feedback: 0.5, lowCut: 300, spread: 1, mix: 0.45 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-panes-under-the-eaves',
    name: 'Panes under the eaves',
    category: 'bell',
    description:
      'Glassy struck keys with a short ring, their tail read back in scattered grains and thinned like winter.',
    preview: BROKEN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { volume: -16, release: 1.2, position: 0.8 },
    },
    effects: [
      {
        deviceId: 'bloom-reverb',
        params: { bloom: 0.8, direction: 2, season: 3, interval: 1, decay: 4, width: 1, mix: 0.55 },
      },
    ],
  },
  {
    id: 'rootless-over-pedal-hollow-bodied-ninths',
    name: 'Hollow bodied ninths',
    category: 'pad',
    description:
      'A hollow pad with a resonant filter, carved by a quick gate into five soft strokes of every eight, left and right.',
    preview: AEOLIAN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { volume: -4, attack: 0.1, release: 0.8, cutoff: 2600, resonance: 0.5, sub: 0.1 },
    },
    effects: [
      {
        deviceId: 'pulses',
        params: {
          rate: 5,
          steps: 8,
          fill: 5,
          drift: 0.3,
          floor: 0.2,
          shade: 0.8,
          apart: 1,
          edge: 0.3,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rootless-over-pedal-beats-without-a-bass',
    name: 'Beats without a bass',
    category: 'organ',
    description:
      'Two sines a key, far enough apart to beat, high-passed at 220 hertz, doubled by a detuned pair of copies and panned slowly.',
    preview: DORIAN,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { attack: 0.08, release: 0.8, detune: 14 },
    },
    effects: [
      { deviceId: 'auto-filter', params: { type: 1, slope: 1, cutoffHz: 220 } },
      { deviceId: 'stereo-detune', params: { detune: 25, delay: 30, mix: 0.6, focus: 100 } },
      { deviceId: 'tremolo', params: { mode: 1, rate: 0.3, depth: 0.9 } },
    ],
  },
  {
    id: 'rootless-over-pedal-roof-of-saws-no-walls',
    name: 'Roof of saws, no walls',
    category: 'pad',
    description:
      'Wide detuned saws with no sub, their attacks smeared into a spray of grains, then levelled hard by a limiter.',
    preview: HANGING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { attack: 0.5, release: 1.5, sub: 0, cutoff: 3200, position: 0.8 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Grain spray' },
      { deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -8 } },
    ],
  },
  {
    id: 'rootless-over-pedal-partials-for-hire',
    name: 'Partials for hire',
    category: 'texture',
    description:
      'A ringing spectral pad whose repeats are rebuilt from grains an octave up, climbing once more each time.',
    preview: WIDE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Ringing overtones',
      params: { volume: -5, attack: 0.3, release: 1.5, resonance: 0.6, cutoff: 1100, motion: 0.5 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        params: {
          time: 400,
          pitch: 12,
          pitchSpray: 0,
          size: 160,
          feedback: 0.4,
          tone: 5000,
          spread: 1,
          mix: 0.5,
        },
      },
    ],
  },
]
