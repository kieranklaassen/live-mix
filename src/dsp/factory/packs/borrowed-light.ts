import { type FactoryPreset, type Phrase } from '../types'

// Chords borrowed from the parallel minor, and the plain ones round them, in C. Laid out in pairs:
// each voice comes once lit (open, struck, bright) and once in shade (covered, slow, low), so the
// chord that is borrowed and the chords round it can be played in two lights.

// C F Fm C: one note changes the mode. A falls to A flat and goes on to G; the C in the tenor is
// tied through all four chords.
const CLOUD: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 7.1, note: 60, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.4 },
    { atSec: 1.6, durSec: 3.2, note: 41, gain: 0.5 },
    { atSec: 1.6, durSec: 3.2, note: 65, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 68, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 67, gain: 0.4 },
  ],
}

// C A flat B flat C: the flat six and the flat seven. The upper parts sink while the bass climbs.
const TWO_STEPS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 3.2, note: 60, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 44, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 63, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 68, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 46, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 58, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 62, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 55, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 60, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.4 },
  ],
}

// C E flat F C: the flat three. E slips to E flat over a tied G, and the last C is tied from the F.
const SKYLIGHT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 72, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 76, gain: 0.4 },
    { atSec: 0, durSec: 3.2, note: 67, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 51, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 70, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 75, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 69, gain: 0.4 },
    { atSec: 3.2, durSec: 3.9, note: 72, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 67, gain: 0.4 },
  ],
}

// C B flat F with a 9th C: the flat seven, with no E flat anywhere. B flat sinks to A.
const CASEMENT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 46, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 62, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 70, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 41, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 69, gain: 0.4 },
    { atSec: 3.2, durSec: 3.9, note: 60, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 67, gain: 0.4 },
  ],
}

// C F, D flat over F, C: the flat two. C rises to D flat as A falls to A flat, and both fall back home.
const AJAR: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 3.2, note: 72, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.4 },
    { atSec: 1.6, durSec: 3.2, note: 41, gain: 0.5 },
    { atSec: 1.6, durSec: 3.2, note: 65, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 68, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 73, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 67, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 72, gain: 0.4 },
  ],
}

// Cmaj7 Fmaj9, Fm6 with a 9th, C: the minor plagal in close parts under a G that never moves.
const NINTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 55, gain: 0.36 },
    { atSec: 0, durSec: 1.6, note: 59, gain: 0.36 },
    { atSec: 0, durSec: 3.2, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 7.1, note: 67, gain: 0.36 },
    { atSec: 1.6, durSec: 1.6, note: 57, gain: 0.36 },
    { atSec: 1.6, durSec: 3.2, note: 41, gain: 0.5 },
    { atSec: 1.6, durSec: 5.5, note: 60, gain: 0.36 },
    { atSec: 3.2, durSec: 1.6, note: 56, gain: 0.36 },
    { atSec: 3.2, durSec: 1.6, note: 62, gain: 0.36 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 55, gain: 0.36 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.36 },
  ],
}

// C, Em over G, E flat over G, F: E and B each sink a semitone under a tied G, then every upper part
// rises as the bass steps down, and it ends open.
const HALF_SHUT: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 0, durSec: 3.2, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 4.8, note: 67, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 59, gain: 0.4 },
    { atSec: 1.6, durSec: 3.2, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 58, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 63, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 41, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 60, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 65, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 69, gain: 0.4 },
  ],
}

// C, Fm over A flat, G, C: the minor plagal turned towards the dominant. A flat falls to G in the
// bass as the C on top falls to B, and both go home.
const HINGE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.4 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.4 },
    { atSec: 0, durSec: 3.2, note: 72, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 44, gain: 0.5 },
    { atSec: 1.6, durSec: 1.6, note: 60, gain: 0.4 },
    { atSec: 1.6, durSec: 1.6, note: 65, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.5 },
    { atSec: 3.2, durSec: 1.6, note: 62, gain: 0.4 },
    { atSec: 3.2, durSec: 1.6, note: 71, gain: 0.4 },
    { atSec: 3.2, durSec: 3.9, note: 67, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.4 },
    { atSec: 4.8, durSec: 2.3, note: 72, gain: 0.4 },
  ],
}

// C F Fm C over a C that is held from first to last, a C tied on top as well.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.38 },
    { atSec: 0, durSec: 1.6, note: 67, gain: 0.38 },
    { atSec: 0, durSec: 7.2, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 7.2, note: 72, gain: 0.38 },
    { atSec: 1.6, durSec: 1.6, note: 69, gain: 0.38 },
    { atSec: 1.6, durSec: 3.2, note: 65, gain: 0.38 },
    { atSec: 3.2, durSec: 1.6, note: 68, gain: 0.38 },
    { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.38 },
    { atSec: 4.8, durSec: 2.4, note: 67, gain: 0.38 },
  ],
}

// F Fm C, slowly, over a low C and its octave: A, A flat, G.
const DIMMER: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 69, gain: 0.36 },
    { atSec: 0, durSec: 4.8, note: 65, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 36, gain: 0.45 },
    { atSec: 0, durSec: 7.3, note: 48, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 60, gain: 0.36 },
    { atSec: 2.4, durSec: 2.4, note: 68, gain: 0.36 },
    { atSec: 4.8, durSec: 2.5, note: 64, gain: 0.36 },
    { atSec: 4.8, durSec: 2.5, note: 67, gain: 0.36 },
  ],
}

// C A flat C, slowly: the flat six and back. E and G part by a semitone each, and close again
// under a tied C.
const SILL: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2.4, note: 64, gain: 0.36 },
    { atSec: 0, durSec: 2.4, note: 67, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 60, gain: 0.36 },
    { atSec: 0, durSec: 7.3, note: 72, gain: 0.36 },
    { atSec: 2.4, durSec: 2.4, note: 44, gain: 0.5 },
    { atSec: 2.4, durSec: 2.4, note: 63, gain: 0.36 },
    { atSec: 2.4, durSec: 2.4, note: 68, gain: 0.36 },
    { atSec: 4.8, durSec: 2.5, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.5, note: 64, gain: 0.36 },
    { atSec: 4.8, durSec: 2.5, note: 67, gain: 0.36 },
  ],
}

// The bass of C A flat B flat C alone, one note at a time, down to the low C.
const FLOORBOARDS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.55, note: 48, gain: 0.6 },
    { atSec: 1.6, durSec: 1.55, note: 44, gain: 0.6 },
    { atSec: 3.2, durSec: 1.55, note: 46, gain: 0.6 },
    { atSec: 4.8, durSec: 2.4, note: 36, gain: 0.6 },
  ],
}

// One line over C F Fm C unheard: E G A, then A flat, and home by G to E.
const SLIP: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.1, note: 64, gain: 0.5 },
    { atSec: 1.1, durSec: 0.6, note: 67, gain: 0.46 },
    { atSec: 1.7, durSec: 1.5, note: 69, gain: 0.54 },
    { atSec: 3.2, durSec: 1.6, note: 68, gain: 0.5 },
    { atSec: 4.8, durSec: 0.8, note: 67, gain: 0.46 },
    { atSec: 5.6, durSec: 1.6, note: 64, gain: 0.46 },
  ],
}

// C A flat B flat C broken upward, a note every four tenths of a second.
const DAPPLED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.5 },
    { atSec: 0.4, durSec: 1.2, note: 64, gain: 0.42 },
    { atSec: 0.8, durSec: 0.8, note: 67, gain: 0.42 },
    { atSec: 1.2, durSec: 0.4, note: 72, gain: 0.42 },
    { atSec: 1.6, durSec: 1.6, note: 44, gain: 0.5 },
    { atSec: 2, durSec: 1.2, note: 63, gain: 0.42 },
    { atSec: 2.4, durSec: 0.8, note: 68, gain: 0.42 },
    { atSec: 2.8, durSec: 0.4, note: 72, gain: 0.42 },
    { atSec: 3.2, durSec: 1.6, note: 46, gain: 0.5 },
    { atSec: 3.6, durSec: 1.2, note: 62, gain: 0.42 },
    { atSec: 4, durSec: 0.8, note: 65, gain: 0.42 },
    { atSec: 4.4, durSec: 0.4, note: 70, gain: 0.42 },
    { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.5 },
    { atSec: 5.2, durSec: 1.9, note: 60, gain: 0.42 },
    { atSec: 5.6, durSec: 1.5, note: 64, gain: 0.42 },
    { atSec: 6, durSec: 1.1, note: 67, gain: 0.42 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tine: ten pairs. Lit, the tines are struck and open; in shade they are covered, slow or far off.
  {
    id: 'borrowed-light-kitchen-facing-south',
    name: 'Kitchen facing south',
    category: 'keys',
    preview: NINTHS,
    description:
      'Bell-bright tines with glassy pipes a twelfth and two octaves up swelling in behind, in a slow light chorus.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.7, tremolo: 0, tone: 0.85, decay: 1.4, release: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Glass on top' },
      { deviceId: 'chorus', preset: 'Subtle widener', params: { hpHz: 400, mix: 0.4 } },
    ],
  },
  {
    id: 'borrowed-light-kitchen-facing-north',
    name: 'Kitchen facing north',
    category: 'keys',
    preview: CLOUD,
    description:
      'Dark tines struck softly, their top rolled off, with sines an octave under them swelling in late and lingering.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { hardness: 0.25, tone: 0.2, release: 0.9, volume: -16 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { low: 0, highCut: 1800 } },
    ],
  },
  {
    id: 'borrowed-light-blind-pulled-up',
    name: 'Blind pulled up',
    category: 'bell',
    preview: DAPPLED,
    description:
      'Glass-hard tines whose partials twinkle one by one like light on water, with a wide bright tail.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 1, release: 1.8, volume: -9 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.8, lean: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-blind-let-down',
    name: 'Blind let down',
    category: 'keys',
    preview: HINGE,
    description:
      'Short damped tines through a small speaker turned to the wall, its treble pulled down, with a hint of spring.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { decay: 0.5, release: 0.12, tone: 0.3, hardness: 0.4, volume: -10.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-sun-along-the-sill',
    name: 'Sun along the sill',
    category: 'keys',
    preview: CLOUD,
    description:
      'Long ringing tines split into colours that arrive from low to high, so each chord opens like a fan.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { tone: 0.75, bell: 0.75, tremolo: 0, volume: -11 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Low to high', params: { time: 900, mix: 0.5 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'borrowed-light-dust-along-the-sill',
    name: 'Dust along the sill',
    category: 'keys',
    preview: HALF_SHUT,
    description:
      'A dark tine with a deep slow throb, dulled and swayed by a cassette kept under a blanket.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { tremoloRate: 2.2, tremolo: 0.7, tone: 0.25, bell: 0.05, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { wow: 0.5, hiss: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'borrowed-light-one-cloud-crossing',
    name: 'One cloud crossing',
    category: 'keys',
    preview: PEDAL,
    description:
      'Tines in a slow pan while quick clouds pass over them, darkening and lifting as they swing from side to side.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tone: 0.75, bark: 0.5, decay: 3, release: 2, tremolo: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Dappled shade', params: { force: 1 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'borrowed-light-gap-between-clouds',
    name: 'Gap between clouds',
    category: 'keys',
    preview: CASEMENT,
    description:
      'Short hard barking tines, loud in the bell and clean of drive, opened wide in the middle, in a bright chamber.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bell: 0.8, bark: 0.65, drive: 0.1, decay: 0.4, tone: 1, release: 0.9, volume: -11 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Open middle' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 2.4, mix: 0.4 } },
    ],
  },
  {
    id: 'borrowed-light-chord-comes-up-slowly',
    name: 'Chord comes up slowly',
    category: 'pad',
    preview: SILL,
    description:
      'Undamped tines with every strike faded in over most of a second, a clear bowed pad with a faint octave in its tail.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.4, tone: 0.8, volume: -10 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 700 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 4 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-chord-goes-down-slowly',
    name: 'Chord goes down slowly',
    category: 'pad',
    preview: SILL,
    description:
      'A sunken soft tine answered by a dark swell that rises behind it and is slow to leave.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { tremolo: 0, release: 2, drive: 0.1, volume: -10 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Dark swell',
        params: { time: 1.4, tail: 0.5, mix: 0.6 },
      },
    ],
  },
  {
    id: 'borrowed-light-leaf-light',
    name: 'Leaf light',
    category: 'keys',
    preview: DAPPLED,
    description:
      'Bright tines in a nine-a-second flutter that crosses from ear to ear, with a slow four-stage phaser over it.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { decay: 1.1, release: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'borrowed-light-leaf-shadow',
    name: 'Leaf shadow',
    category: 'keys',
    preview: TWO_STEPS,
    description:
      'A reedy soft-struck tine with no bell in it, its lows and highs rocking against each other, two to a second.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { tremolo: 0, tone: 0.4, bark: 0.8, release: 0.4, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Wide shimmer',
        params: { rate: 2, crossover: 500, depth: 0.85 },
      },
      { deviceId: 'fog', preset: 'Pad softener' },
    ],
  },
  {
    id: 'borrowed-light-radiator-ticking',
    name: 'Radiator ticking',
    category: 'keys',
    preview: CASEMENT,
    description:
      'Overdriven tines, warm and thick, pushed once more by an iron circuit and answered by one tape slap.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { drive: 0.6, tone: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.35 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 130, mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-radiator-gone-cold',
    name: 'Radiator gone cold',
    category: 'keys',
    preview: AJAR,
    description:
      'Thin hard tines with no bark and no drive, their lows cut away, heard from across an empty room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        bell: 0.55,
        bark: 0,
        hardness: 1,
        drive: 0,
        tremolo: 0,
        tone: 0.5,
        decay: 0.7,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'distance', preset: 'Across the room', params: { decay: 1.4 } },
    ],
  },
  {
    id: 'borrowed-light-answered-in-major',
    name: 'Answered in major',
    category: 'keys',
    preview: SLIP,
    description:
      'Clear tines with a clean steady echo, each repeat as bright as the note, spread from side to side.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bell: 0.6, bark: 0.2, tremolo: 0, tone: 0.9, decay: 1.8, release: 0.8, volume: -9 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Clean and steady',
        params: { time: 400, spread: 1, mix: 0.4 },
      },
    ],
  },
  {
    id: 'borrowed-light-answered-in-minor',
    name: 'Answered in minor',
    category: 'keys',
    preview: SLIP,
    description:
      'Tines with the tone well down and slow murky repeats that waver in pitch, all of it in a larger body.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { tremolo: 0, bark: 0.3, drive: 0.35, tone: 0.3, decay: 0.8, volume: -5.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 620, mix: 0.5 } },
      { deviceId: 'size', preset: 'Larger', params: { size: 0.5 } },
    ],
  },
  {
    id: 'borrowed-light-lamp-high-on-the-wall',
    name: 'Lamp high on the wall',
    category: 'bell',
    preview: DAPPLED,
    description:
      'Tines in a body as small as a music box, doubled by a detuned octave above, in a bright chamber.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { bell: 0.5, decay: 0.9, release: 0.9, tone: 0.7, tremolo: 0, volume: -9 },
    },
    effects: [
      { deviceId: 'size', preset: 'Music box' },
      { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'borrowed-light-lamp-under-the-table',
    name: 'Lamp under the table',
    category: 'keys',
    preview: CLOUD,
    description:
      'Dark tines with a rounded octave under every note, turning slowly inside a dark rotor drum.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { hardness: 0.55, tone: 0.38, bark: 0.4, decay: 2.2, volume: -17 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'rotary', preset: 'Dark drum' },
    ],
  },
  {
    id: 'borrowed-light-jar-on-the-windowsill',
    name: 'Jar on the windowsill',
    category: 'keys',
    preview: SKYLIGHT,
    description:
      'Tines played inside a short glass tube that rings with them, panned very slowly between the sides.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { tone: 0.8, bark: 0.25, decay: 1.4, tremolo: 0.6, volume: -10 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2, mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-jar-in-the-cellar',
    name: 'Jar in the cellar',
    category: 'keys',
    preview: AJAR,
    description:
      'Blunt tines that barely let go, played wholly inside a wide clay pot, with a small dark room round them.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: {
        hardness: 0.15,
        bell: 0.1,
        bark: 0.8,
        tremolo: 0,
        tone: 0.6,
        decay: 3,
        release: 1.6,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { size: 2.4, mix: 1 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },

  // Felt piano: three and a half pairs, from bare strings in full light to a wash with no hammer.
  {
    id: 'borrowed-light-lid-propped-at-noon',
    name: 'Lid propped at noon',
    category: 'keys',
    preview: CASEMENT,
    description:
      'A piano with the felt lifted and hard hammers, a detuned octave added above and a console pushed on top.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { stiffness: 1.3, hardness: 0.85, reverbMix: 0.05, outputDb: -8 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-lid-down-by-four',
    name: 'Lid down by four',
    category: 'keys',
    preview: HINGE,
    description:
      'A fully felted piano with a soft thump, its attacks softened to puffs and its air spread round them.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { thump: 0.6, resonance: 0.6, reverbMix: 0, outputDb: -16 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Felt and air' },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { highCut: 5000 } },
    ],
  },
  {
    id: 'borrowed-light-keys-in-a-sunbeam',
    name: 'Keys in a sunbeam',
    category: 'keys',
    preview: DAPPLED,
    description:
      'A lightly felted piano that throws off small sparks an octave and more above, some held in a short trail.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { felt: 0.25, reverbMix: 0.1, damper: 0.5, outputDb: -7 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Long trails', params: { density: 4, size: 110, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { decay: 0.6, mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-keys-in-the-dark',
    name: 'Keys in the dark',
    category: 'keys',
    preview: AJAR,
    description: 'A worn gritty piano from one point, sunk just under water and swaying a little.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { grit: 0.6, reverbMix: 0, outputDb: -16 },
    },
    effects: [
      {
        deviceId: 'underwater',
        preset: 'Slow swell',
        params: { depth: 0.4, waver: 0.5, width: 0.5 },
      },
    ],
  },
  {
    id: 'borrowed-light-hymn-by-the-window',
    name: 'Hymn by the window',
    category: 'keys',
    preview: TWO_STEPS,
    description:
      'A half-pedalled piano with quiet flute pipes speaking a little behind it, an octave up and an octave down.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { felt: 0.4, reverbMix: 0.05, outputDb: -19.5 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-hymn-behind-a-door',
    name: 'Hymn behind a door',
    category: 'keys',
    preview: HALF_SHUT,
    description:
      'An old upright, out of tune and creaking, heard through a shut door with its top gone and played from a dusty record.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { felt: 0.45, reverbMix: 0, action: 0.5, outputDb: -13 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Next door' },
      { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.2, wobble: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-two-thirds-left-ringing',
    name: 'Two thirds left ringing',
    category: 'texture',
    preview: SILL,
    description:
      'A pedalled piano with its strikes taken out: only the ringing of the chord, held long and put in a wide wash.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { reverbMix: 0.15, soft: 0, felt: 0.6, hardness: 0.3, outputDb: -9 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Long wash' },
      { deviceId: 'common-tones', preset: 'Long hold' },
      { deviceId: 'fdn-reverb', preset: 'Hall' },
    ],
  },

  // String machine: ten pairs. Lit is open saws with the upper octave; shade is the low octave,
  // the tone closed and something hung between it and the ear.
  {
    id: 'borrowed-light-wall-opposite-the-glass',
    name: 'Wall opposite the glass',
    category: 'string',
    preview: CLOUD,
    description:
      'Open ensemble strings with the upper octave up, widened at the top and laid on a clear plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { tone: 7500, high: 0.6, low: 0.15, attack: 0.3, volume: -3 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Hazy edges' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.75 } },
    ],
  },
  {
    id: 'borrowed-light-wall-beside-the-glass',
    name: 'Wall beside the glass',
    category: 'string',
    preview: CLOUD,
    description:
      'A low cello register with the tone closed, drawn back behind a wooden body that takes the edge off.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { tone: 800, ensemble: 0.3, attack: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'borrowed-light-shutters-folded-back',
    name: 'Shutters folded back',
    category: 'string',
    preview: SKYLIGHT,
    description:
      'High fast-swirling strings with nothing below the written octave and a long thin airy tail.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { speed: 1.4, attack: 0.15, release: 2.2, volume: -13 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.5 } }],
  },
  {
    id: 'borrowed-light-shutters-drawn-to',
    name: 'Shutters drawn to',
    category: 'pad',
    preview: SILL,
    description:
      'Strings closed down to a low fog, slow to come and slow to go, heard from far back through heavy air.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { tone: 700, attack: 1.2, release: 3, volume: -6 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog', params: { distance: 0.65 } }],
  },
  {
    id: 'borrowed-light-long-bright-evening',
    name: 'Long bright evening',
    category: 'pad',
    preview: PEDAL,
    description:
      'Slow wide strings left standing in high summer: warm, broad and moving a little, with its own air round them.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1.1, release: 3.5, tone: 4200, high: 0.5, volume: -3.5 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Wide midsummer' }],
  },
  {
    id: 'borrowed-light-first-dark-evening',
    name: 'First dark evening',
    category: 'pad',
    preview: HALF_SHUT,
    description:
      'Muted high strings caught by the first frost, thinned and roughened, their ensemble turned half down.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.5, tone: 1700, ensemble: 0.4, drift: 0.2, volume: -8 },
    },
    effects: [{ deviceId: 'seasons', preset: 'First frost', params: { depth: 1 } }],
  },
  {
    id: 'borrowed-light-linen-across-the-pane',
    name: 'Linen across the pane',
    category: 'string',
    preview: CASEMENT,
    description:
      'Plain violas in one octave, every change of chord blurred to a soft edge and their overtones brought forward.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { tone: 3400, width: 0.8, release: 1.4, volume: -2.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Short blur', params: { size: 60 } },
      { deviceId: 'reveal', preset: 'Overtones' },
    ],
  },
  {
    id: 'borrowed-light-velvet-across-the-pane',
    name: 'Velvet across the pane',
    category: 'string',
    preview: TWO_STEPS,
    description:
      'A narrow bowed bass tone on cassette tape with its low bump full up, thick at the bottom and dim above.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { tone: 600, attack: 0.5, release: 1.6, ensemble: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { tone: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-mirror-turned-to-the-sun',
    name: 'Mirror turned to the sun',
    category: 'pad',
    preview: SILL,
    description:
      'High glassy strings cut into bands that swell and lean from side to side, each on a slow cycle of its own.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.8, tone: 9000, volume: -9 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.85, rate: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-mirror-turned-away',
    name: 'Mirror turned away',
    category: 'pad',
    preview: NINTHS,
    description:
      'Hollow strings let through only where they agree with a moment ago: shared notes hang on, the new ones come late.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { tone: 1500, low: 0, high: 0.35, volume: -3.5 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Only what stays', params: { mix: 0.85 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'borrowed-light-coloured-glass-hour',
    name: 'Coloured glass hour',
    category: 'string',
    preview: CASEMENT,
    description:
      'Three octaves of strings split into four colours, each colour repeated later and further out than the last.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.06, release: 0.8, volume: -10.5 },
    },
    effects: [{ deviceId: 'prism', preset: 'Four colours', params: { time: 620, mix: 0.45 } }],
  },
  {
    id: 'borrowed-light-leaded-glass-hour',
    name: 'Leaded glass hour',
    category: 'organ',
    preview: HALF_SHUT,
    description:
      'Unswept saws, flat and quick as a small organ, ringing inside a stopped metal pipe.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { high: 0.1, tone: 1500, release: 0.25, volume: -14 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Metal drone', params: { size: 1.2, mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-bright-swept-floor',
    name: 'Bright swept floor',
    category: 'keys',
    preview: DAPPLED,
    description:
      'Dry saws that start at once and stop at once, turned over by a slow negative phaser in stereo.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { high: 0.5, release: 0.12, width: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.12, stereo: 160 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'borrowed-light-rug-over-the-floor',
    name: 'Rug over the floor',
    category: 'string',
    preview: AJAR,
    description:
      'Dry saws under a deep low-pass, rubbed by a pulse in the middle of the sound, four to a second.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { low: 0.7, high: 0, tone: 1100, attack: 0.3, release: 1.2, volume: -9 },
    },
    effects: [
      { deviceId: 'band-pulse', preset: 'Four a second', params: { depth: 0.6 } },
      { deviceId: 'chorus', preset: 'Loose double' },
    ],
  },
  {
    id: 'borrowed-light-light-climbs-the-stairs',
    name: 'Light climbs the stairs',
    category: 'pad',
    preview: SILL,
    description:
      'A deep slow string swell whose filter opens as it gathers, with a soft octave glimmer in the tail.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 1.6, release: 2.6, high: 0.6, tone: 6000, volume: -8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 0, cutoffHz: 300 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 4, mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-light-leaves-the-stairs',
    name: 'Light leaves the stairs',
    category: 'string',
    preview: HINGE,
    description:
      'Strings that darken as they grow louder, with a tail that falls away in a straight line.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: {
        tone: 4500,
        attack: 0.1,
        release: 0.5,
        low: 0.6,
        high: 0,
        ensemble: 0.4,
        volume: -4.5,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Loud goes dark',
        params: { cutoffHz: 2500, envAmount: -90 },
      },
      { deviceId: 'shaped-reverb', preset: 'Falling' },
    ],
  },
  {
    id: 'borrowed-light-bulb-that-wavers',
    name: 'Bulb that wavers',
    category: 'pad',
    preview: TWO_STEPS,
    description:
      'Detuned fast-turning strings on a seasick tape, every chord bending a little as it is held.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.2, tone: 5000, release: 1.4, volume: -10 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.1 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'borrowed-light-bulb-gone-brown',
    name: 'Bulb gone brown',
    category: 'string',
    preview: NINTHS,
    description:
      "Close mono strings through a small radio speaker, boxed in, faintly dirty and with a little of the set's own noise.",
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: {
        low: 0.05,
        tone: 2400,
        ensemble: 0.2,
        width: 0,
        attack: 0.15,
        release: 0.5,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
    ],
  },
  {
    id: 'borrowed-light-porch-in-the-sun',
    name: 'Porch in the sun',
    category: 'pad',
    preview: CASEMENT,
    description:
      'A wide slow ensemble that circles the head, bright when it is near and dimmer on the far side.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.6, release: 2, tone: 5500, volume: -4.5 },
    },
    effects: [{ deviceId: 'around', preset: 'Far side fades', params: { rate: 0.2 } }],
  },
  {
    id: 'borrowed-light-porch-after-rain',
    name: 'Porch after rain',
    category: 'texture',
    preview: SILL,
    description:
      'Soft low strings in slow dripping rain, each drop tapping a piece of the chord out of the dark.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 1, release: 4, tone: 1200, high: 0, volume: -9 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Slow drips', params: { pace: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.4 } },
    ],
  },

  // Organ: eight pairs and one more, from flutes in daylight to reeds behind a wall.
  {
    id: 'borrowed-light-chancel-in-the-morning',
    name: 'Chancel in the morning',
    category: 'organ',
    preview: CASEMENT,
    description:
      'Plain flutes with a fifteenth drawn over them, speaking quickly into a bright hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { fifteenth: 0.35, sub: 0.2, tone: 8000, volume: -12 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.45 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
  },
  {
    id: 'borrowed-light-chancel-in-the-dark',
    name: 'Chancel in the dark',
    category: 'organ',
    preview: CLOUD,
    description:
      'A heard-through-the-wall organ, its swell shutters closed on pipes added below and above it.',
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { sub: 0.3, tone: 600, reed: 0.2, volume: -12 },
    },
    effects: [
      { deviceId: 'stops', preset: 'Shutters closed', params: { sub: 0.5, fifth: 0 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-sacristy-door-open',
    name: 'Sacristy door open',
    category: 'organ',
    preview: TWO_STEPS,
    description:
      'A full organ with the tone held down a little, turned fast by a deep horn heard from far off.',
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { reed: 0.4, attack: 0.03, tone: 4000, volume: -10.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Far shimmer' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'borrowed-light-sacristy-door-shut',
    name: 'Sacristy door shut',
    category: 'organ',
    preview: HALF_SHUT,
    description:
      'A pump organ with strong bellows and wheezing breath, boxed into a small tin body and kept dry.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { bellows: 1, tone: 1600, attack: 0.1, volume: -14.5 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { size: 0.6, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'borrowed-light-candle-in-daylight',
    name: 'Candle in daylight',
    category: 'organ',
    preview: SLIP,
    description:
      'A windy flute stop, its partials shimmering fast and fine, with a quiet glow two octaves up in the tail.',
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { breath: 0.6, octave: 0.3, attack: 0.15, release: 0.8, tone: 6000, volume: -8 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Fast shimmer', params: { depth: 0.75 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-candle-at-midnight',
    name: 'Candle at midnight',
    category: 'organ',
    preview: AJAR,
    description:
      'Two beating flute ranks over a soft sub, under a slow dark chorus that bends them.',
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { celeste: 0.7, sub: 0.3, tone: 1300, attack: 0.3, volume: -10 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { feedback: 10, mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2500 } },
    ],
  },
  {
    id: 'borrowed-light-hands-on-the-great',
    name: 'Hands on the great',
    category: 'organ',
    preview: SKYLIGHT,
    description:
      'Octave, twelfth and fifteenth with no reed and no sub, pushed by a console until the top gleams.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0,
        reed: 0,
        octave: 0.8,
        twelfth: 0.5,
        fifteenth: 0.5,
        celeste: 0,
        bellows: 0,
        breath: 0.05,
        tone: 9000,
        attack: 0.02,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-hands-on-the-swell',
    name: 'Hands on the swell',
    category: 'organ',
    preview: NINTHS,
    description:
      'A quiet harmonium behind the box: it breathes open and shut every second and a half, darker as it closes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Harmonium',
      params: {
        sub: 0.05,
        octave: 0.2,
        fifteenth: 0,
        reed: 0.2,
        tone: 1800,
        attack: 0.25,
        volume: -9,
      },
    },
    effects: [
      {
        deviceId: 'breath',
        preset: 'Dark lungs',
        params: { in: 0.8, hold: 0.1, out: 0.7, rest: 0.02, vary: 0, depth: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 3, mix: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-feet-on-the-sunny-side',
    name: 'Feet on the sunny side',
    category: 'bass',
    preview: FLOORBOARDS,
    description:
      'A deep pedal pipe with a reed and a twelfth for edge, through a warm loudspeaker stack.',
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: {
        octave: 0.3,
        reed: 0.7,
        twelfth: 0.5,
        celeste: 0.6,
        attack: 0.02,
        release: 0.3,
        tone: 5000,
        volume: -12,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'borrowed-light-feet-on-the-dark-side',
    name: 'Feet on the dark side',
    category: 'bass',
    preview: FLOORBOARDS,
    description:
      'A deep pedal pipe alone, slow to speak, with the octave above it opening dimly after the note and the hall round both.',
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.35, release: 1.2, tone: 500, volume: -10 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Slow pedals',
        params: { sub2: 0, sub1: 0, up1: 0.6, filter: 700, attack: 0.5 },
      },
      { deviceId: 'distance', preset: 'Back of the hall' },
    ],
  },
  {
    id: 'borrowed-light-chapel-speaker-sunday',
    name: 'Chapel speaker, Sunday',
    category: 'organ',
    preview: CASEMENT,
    description:
      'A beating accordion with the bellows at rest, called out of a horn loudspeaker far down a room, with a short slap.',
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { bellows: 0, celeste: 0.8, reed: 0.6, volume: -14 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Station platform' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 140, mix: 0.4 } },
    ],
  },
  {
    id: 'borrowed-light-vestry-record-monday',
    name: 'Vestry record, Monday',
    category: 'organ',
    preview: HINGE,
    description:
      'A reed stop with a wide tremulant on a worn record, its top gone and its turning heard.',
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.7, tone: 1100, octave: 0.2, volume: -10 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Dusty record',
        params: { wobble: 0.6, noise: 0.35, tone: 0.3 },
      },
    ],
  },
  {
    id: 'borrowed-light-clerestory-bloom',
    name: 'Clerestory bloom',
    category: 'pad',
    preview: DIMMER,
    description:
      'All the upper ranks opening over a second and a half, doubled by a high bright flock of moving copies.',
    instrument: {
      deviceId: 'organ',
      preset: 'Slow bright bloom',
      params: { attack: 1.4, release: 4, volume: -13 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'High and bright' }],
  },
  {
    id: 'borrowed-light-crypt-bloom',
    name: 'Crypt bloom',
    category: 'pad',
    preview: DIMMER,
    description:
      'Distant pipes with the low ranks drawn, hummed back by a closed vowel deep in the stone.',
    instrument: {
      deviceId: 'organ',
      preset: 'Distant pipes',
      params: { attack: 1.1, release: 3, tone: 800, volume: -9 },
    },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Humming',
        params: { decay: 4, resonance: 0.8, mix: 0.45 },
      },
    ],
  },
  {
    id: 'borrowed-light-quint-in-the-clear',
    name: 'Quint in the clear',
    category: 'organ',
    preview: PEDAL,
    description:
      'A flute with a strong twelfth and a little fifteenth, blurred by a copy whose vibrato waits on each held chord.',
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { twelfth: 0.6, fifteenth: 0.25, attack: 0.08, tone: 6000, volume: -10 },
    },
    effects: [
      {
        deviceId: 'late-vibrato',
        preset: 'Wide shimmer',
        params: { wait: 450, grow: 600, mix: 0.6, depth: 16 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.8, mix: 0.35 } },
    ],
  },
  {
    id: 'borrowed-light-quint-under-the-cloth',
    name: 'Quint under the cloth',
    category: 'drone',
    preview: DIMMER,
    description:
      'A shruti-like reed and sub with the tone closed, held by sines of its own strongest partials.',
    instrument: {
      deviceId: 'organ',
      preset: 'Shruti box',
      params: { twelfth: 0.4, attack: 0.6, release: 2, tone: 900, volume: -11 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Long linger',
        params: { attack: 500, release: 3, mix: 0.6 },
      },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'borrowed-light-what-both-modes-keep',
    name: 'What both modes keep',
    category: 'organ',
    preview: NINTHS,
    description:
      'A celeste organ in which the notes two chords share ring on and on, so a moved note is heard to move.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: {
        sub: 0.15,
        attack: 0.3,
        release: 0.6,
        octave: 0.5,
        tone: 3600,
        celeste: 0.5,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { ring: 0.55, mix: 0.9 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { lowDecay: 2.5, mix: 0.3 } },
    ],
  },

  // Chamber strings: five pairs, the bow out in the open and the bow under a mute.
  {
    id: 'borrowed-light-bows-in-the-bay-window',
    name: 'Bows in the bay window',
    category: 'string',
    preview: CLOUD,
    description:
      'A warm unmuted section with a full vibrato, its air and overtones turned up, in a bright chamber.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { bow: 0.65, vibrato: 18, attack: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Air' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 3, mix: 0.35 } },
    ],
  },
  {
    id: 'borrowed-light-bows-in-the-alcove',
    name: 'Bows in the alcove',
    category: 'string',
    preview: CLOUD,
    description:
      'Five muted players with no vibrato, swollen in slowly and put in a body larger and darker than their own.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 0.8, release: 1.8, volume: -8 },
    },
    effects: [
      { deviceId: 'size', preset: 'Giant', params: { tone: -0.2 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'borrowed-light-reading-by-the-glass',
    name: 'Reading by the glass',
    category: 'string',
    preview: SLIP,
    description:
      'One player close to the bridge, joined by a quiet pipe an octave up, with short bright tape slaps behind.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { bow: 0.9, vibrato: 10, release: 0.8, volume: 2 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 210, spread: 0.8, highCut: 12000, mix: 0.4 },
      },
      { deviceId: 'stops', preset: 'Octave above', params: { mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'borrowed-light-reading-by-the-ember',
    name: 'Reading by the ember',
    category: 'string',
    preview: SLIP,
    description:
      'One straying muted player with a light bow, whose held notes sag and darken as they age.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Wandering solo',
      params: { attack: 0.4, release: 1.4, mute: 0.6, volume: 0 },
    },
    effects: [{ deviceId: 'melt', preset: 'Dark puddle', params: { sag: -12, mix: 0.55 } }],
  },
  {
    id: 'borrowed-light-frost-flowers',
    name: 'Frost flowers',
    category: 'string',
    preview: SILL,
    description:
      'Three bows on the bridge, glassy and still, redrawn in wide fine sines that stay a moment after them.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { attack: 0.5, release: 2.4, volume: -10 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Wide glass', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-soot-flowers',
    name: 'Soot flowers',
    category: 'string',
    preview: HALF_SHUT,
    description:
      'Six muted players, ragged and wide, rubbed dark by a fuzzy blur of themselves that dies in a few seconds.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { mute: 1, attack: 0.5, release: 1.4, volume: -9 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Wool blanket', params: { haze: 0.6, decay: 2.5, mix: 0.5 } },
    ],
  },
  {
    id: 'borrowed-light-sparks-off-the-strings',
    name: 'Sparks off the strings',
    category: 'string',
    preview: DAPPLED,
    description:
      'Short hard bows, each stroke answered by sparse bright echoes that swell backwards and repeat.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Short bows',
      params: { release: 0.35, volume: -4 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Sparkles', params: { mix: 0.45 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'borrowed-light-strings-in-the-hearth',
    name: 'Strings in the hearth',
    category: 'string',
    preview: NINTHS,
    description:
      'A straight-toned viol consort, narrow and close, warmed by a glowing valve and a wooden soundboard.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { mute: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.6 } },
      { deviceId: 'vessel', preset: 'Wooden body' },
    ],
  },
  {
    id: 'borrowed-light-halo-round-the-tonic',
    name: 'Halo round the tonic',
    category: 'string',
    preview: PEDAL,
    description:
      'Three still players with no bow noise, an octave and two octaves swelling in over them after each change.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.9, release: 2.5, width: 1, volume: -9 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { up1: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-whispers-on-the-minor',
    name: 'Whispers on the minor',
    category: 'texture',
    preview: DIMMER,
    description:
      'Six players breathing more than bowing, their tops rolled off, with passing gusts that thin and cover them.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 6, mute: 0.7, attack: 0.9, volume: -2 },
    },
    effects: [
      {
        deviceId: 'weather',
        preset: 'Breezy day',
        params: { pace: 2.5, exposure: 0.8, voice: 0.3 },
      },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },

  // Afterglow: the strike is the chord, and the glow after it is the light it leaves.
  {
    id: 'borrowed-light-after-the-borrowed-chord',
    name: 'After the borrowed chord',
    category: 'keys',
    preview: AJAR,
    description:
      'A felt strike that turns quickly into a warm glow, carried round by a gentle chorus in a hall.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 0.5, fade: 3, tone: 0.65, strike: 0.9, volume: -10 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-brass-door-handle',
    name: 'Brass door handle',
    category: 'bell',
    preview: SKYLIGHT,
    description:
      'Bright bell strikes with a strong halo over a short glow, repeated by clear echoes spread wide.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { halo: 0.6, fade: 2, volume: -9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 400, spread: 0.9, mix: 0.4 },
      },
    ],
  },
  {
    id: 'borrowed-light-light-under-the-door',
    name: 'Light under the door',
    category: 'pad',
    preview: DIMMER,
    description:
      'No strike at all: a dim glow that rises over a second, low-passed and swept once in half a minute.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { tone: 0.2, bloom: 0.9, fade: 4, halo: 0, volume: -18 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'borrowed-light-water-glass-at-ten',
    name: 'Water glass at ten',
    category: 'bell',
    preview: DAPPLED,
    description:
      'Still glass strikes ringing on evenly, their image swung slowly to one side and back.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Still glass',
      params: { tone: 0.8, bloom: 0.7, fade: 3, volume: -2 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'borrowed-light-water-glass-lights-out',
    name: 'Water glass, lights out',
    category: 'bell',
    preview: AJAR,
    description:
      'Glass with a halo over a glow, muffled under water that wavers, with a bubble here and there.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { tone: 0.35, strike: 0.8, halo: 0.7, bloom: 1, fade: 2, volume: -15 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Under', params: { waver: 0.6, rate: 0.6, bubbles: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-plucked-at-the-sash',
    name: 'Plucked at the sash',
    category: 'plucked',
    preview: DAPPLED,
    description:
      'Plucked strings whose glow is kept small, through a clean combo with its treble up and a faint tape echo.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { glow: 0.3, tone: 0.8, decay: 2, volume: -0.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-bell-at-low-sun',
    name: 'Bell at low sun',
    category: 'bell',
    preview: CLOUD,
    description:
      'A dark bell that keeps changing as it glows, thickened by a copy a few cents apart and later on each side.',
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { bloom: 1.2, fade: 4, tone: 0.35, strike: 0.75, volume: -10 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { tone: 3000 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 4, mix: 0.35 } },
    ],
  },

  // Wavetable: three tables in two lights each.
  {
    id: 'borrowed-light-pane-of-old-glass',
    name: 'Pane of old glass',
    category: 'pad',
    preview: SKYLIGHT,
    description:
      'A slow-moving glass table, bright and wide, its image rippling across fine bands of light.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { position: 0.7, cutoff: 9000, attack: 0.3, release: 2, volume: -10 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { rate: 1.2 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-pane-of-smoked-glass',
    name: 'Pane of smoked glass',
    category: 'pad',
    preview: DIMMER,
    description: 'A dark sine-like pad with a strong sub, let swell and sink in three wide bands.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { position: 0.15, cutoff: 700, attack: 0.7, release: 2.5, volume: -15.5 },
    },
    effects: [
      {
        deviceId: 'currents',
        preset: 'Deep swell',
        params: { rate: 0.4, depth: 0.85, lowHold: 60 },
      },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'borrowed-light-choir-in-a-pale-room',
    name: 'Choir in a pale room',
    category: 'voice',
    preview: CASEMENT,
    description:
      'Vowel voices with their filter open, answered by a soft ah that hangs in a short hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.4, release: 1.6, cutoff: 10000, volume: -10 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 3, mix: 0.4 } }],
  },
  {
    id: 'borrowed-light-choir-in-a-blue-room',
    name: 'Choir in a blue room',
    category: 'voice',
    preview: TWO_STEPS,
    description:
      'Humming voices with the filter low, blurred at the edges and drawn well back in a hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.5, release: 0.7, cutoff: 1500, volume: -9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Wide drone', params: { size: 120 } },
      { deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.6 } },
    ],
  },
  {
    id: 'borrowed-light-reed-in-the-open',
    name: 'Reed in the open',
    category: 'keys',
    preview: HINGE,
    description:
      'A thick reed table turned nearly to saws, quick to speak, in a slow six-stage swirl.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { position: 0.7, detune: 20, attack: 0.03, release: 0.8, sub: 0, volume: -3 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-reed-in-the-shed',
    name: 'Reed in the shed',
    category: 'organ',
    preview: HALF_SHUT,
    description:
      'A soft reed organ table through a dull cassette that sways, with a small box of a room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { cutoff: 1300, position: 0.35, volume: -11 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2, tone: 0.3 } },
      { deviceId: 'expanse', preset: 'Small box' },
    ],
  },

  // Dusk: the hour itself, from the last sun to the first lamp.
  {
    id: 'borrowed-light-last-of-the-sun',
    name: 'Last of the sun',
    category: 'pad',
    preview: PEDAL,
    description:
      'Wide thin pulses with a light low cut, sparkling faintly an octave up as the chord is held.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { attack: 0.3, release: 2, cutoff: 6500, volume: -8 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Soft blips', params: { mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-sun-off-the-roofs',
    name: 'Sun off the roofs',
    category: 'pad',
    preview: HINGE,
    description:
      'Strings whose filter closes as each chord swells in, so it begins in light and ends in shade.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.6, release: 1.5, cutoff: 4500, envelope: -0.9, volume: 1 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Open middle' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-first-lamp-of-evening',
    name: 'First lamp of evening',
    category: 'keys',
    preview: DAPPLED,
    description:
      'Warm plucked keys through one slow rotor and a short spring, each opened bright by the key.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { cutoff: 600, envelope: 0.7, release: 1, volume: -7 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 1.6, mix: 0.25 } },
    ],
  },
  {
    id: 'borrowed-light-blue-after-the-lamp',
    name: 'Blue after the lamp',
    category: 'pad',
    preview: TWO_STEPS,
    description:
      'Square waves low-passed to the sound of clarinets, pulsing softly from side to side.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.35, release: 1.5, volume: -14 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'borrowed-light-floor-of-the-dusk',
    name: 'Floor of the dusk',
    category: 'bass',
    preview: FLOORBOARDS,
    description:
      'A square bass with its full sub, its filter drawn down and thickened by tape until the edge is gone.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { attack: 0.02, release: 0.5, cutoff: 700, volume: -17 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },

  // Ember: two pairs and a bass.
  {
    id: 'borrowed-light-coal-in-sunlight',
    name: 'Coal in sunlight',
    category: 'pad',
    preview: CASEMENT,
    description:
      'Detuned saws in sevens, opened softly and spread wide, evened by a compressor and laid on a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { cutoff: 5000, ampAttack: 0.25, ampRelease: 1.6, volume: -3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.75 } },
    ],
  },
  {
    id: 'borrowed-light-coal-under-ash',
    name: 'Coal under ash',
    category: 'pad',
    preview: AJAR,
    description:
      'A hollow pulse and triangle with the filter low, smeared by a soft fuzz that never quite catches.',
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { cutoff: 600, filterEnvAmount: 0.1, ampAttack: 0.35, volume: -9 },
    },
    effects: [
      { deviceId: 'haze', preset: 'Faint warmth', params: { haze: 0.5, mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'borrowed-light-cut-glass-doorknob',
    name: 'Cut glass doorknob',
    category: 'plucked',
    preview: DAPPLED,
    description:
      'A glassy filtered pluck with an octave over it, fanned into echoes whose middle comes before their ends.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: {
        cutoff: 800,
        velToFilter: 0.2,
        ampDecay: 0.9,
        ampRelease: 0.9,
        filterDecay: 0.3,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'prism', preset: 'Middle first', params: { time: 500, mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'borrowed-light-horn-call-to-the-west',
    name: 'Horn call to the west',
    category: 'wind',
    preview: SLIP,
    description:
      'A soft filtered brass that opens late and wavers only when held, sent down a stone stair.',
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { filterAttack: 0.25, ampAttack: 0.08, ampRelease: 0.6, cutoff: 700, volume: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'distance', preset: 'Stone stairwell' },
    ],
  },
  {
    id: 'borrowed-light-flat-six-in-the-bass',
    name: 'Flat six in the bass',
    category: 'bass',
    preview: FLOORBOARDS,
    description:
      'A mono saw bass with a short filter bite and a sub under it, gliding a little between the roots.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm Bass',
      params: {
        glide: 0.08,
        cutoff: 500,
        filterDecay: 0.6,
        filterSustain: 0.3,
        ampRelease: 0.3,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { hpHz: 300, mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },

  // Staircase: light that goes up or down the wall and never reaches the end of it.
  {
    id: 'borrowed-light-sun-up-the-stairwell',
    name: 'Sun up the stairwell',
    category: 'pad',
    preview: PEDAL,
    description:
      'The chord walking up its own notes without end, bright and stepped, on a long light plate.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord stairs',
      params: { centre: 900, shape: 0.4, speed: 0.55, slide: 0.15, release: 0.8, volume: -11 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.8, mix: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'borrowed-light-sun-down-the-stairwell',
    name: 'Sun down the stairwell',
    category: 'pad',
    preview: SILL,
    description:
      'The chord sinking through its own notes without end, low and half slid, under a worn slow tape.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Chord descent',
      params: {
        centre: 200,
        shape: 0.15,
        speed: -0.3,
        attack: 0.4,
        slide: 0.35,
        release: 1,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1, drive: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'borrowed-light-landing-at-noon',
    name: 'Landing at noon',
    category: 'organ',
    preview: HINGE,
    description:
      'Stacked octaves standing still like an organ with no climb at all, breathing open and wide.',
    instrument: {
      deviceId: 'staircase',
      preset: 'Still organ',
      params: { shape: 0.6, attack: 0.1, release: 1, volume: -11 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Opening wide', params: { in: 1.2, hold: 0.2, out: 1.6 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
]
