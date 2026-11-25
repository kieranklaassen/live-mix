import { type FactoryPreset, type Phrase } from '../types'

// Six triads, C, C minor, A flat, A flat minor, E and E minor, in three voices that each have two
// places a half step apart. Neighbours differ in one voice, poles in all three. Laid out as
// changers of five attacks, from struck to bowed in, by how much body or air each one carries.

// The whole cycle, a chord a second and every common note tied: C, C minor, A flat, A flat minor,
// E, E minor, C. The bass goes down by major thirds, C A flat E C.
const CYCLE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 2, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 3, note: 60, gain: 0.42 },
    { atSec: 1, durSec: 3, note: 63, gain: 0.42 },
    { atSec: 2, durSec: 2, note: 44, gain: 0.5 },
    { atSec: 2, durSec: 3, note: 68, gain: 0.42 },
    { atSec: 3, durSec: 3, note: 59, gain: 0.42 },
    { atSec: 4, durSec: 2, note: 40, gain: 0.5 },
    { atSec: 4, durSec: 3.2, note: 64, gain: 0.42 },
    { atSec: 5, durSec: 2.2, note: 67, gain: 0.42 },
    { atSec: 6, durSec: 1.2, note: 36, gain: 0.5 },
    { atSec: 6, durSec: 1.2, note: 60, gain: 0.42 },
  ],
}

// The same cycle, with the one voice that moves struck again an octave higher at each change:
// E flat, A flat, B, E, G, C.
const SHADOWED: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 2, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2, note: 67, gain: 0.42 },
    { atSec: 0, durSec: 3, note: 60, gain: 0.42 },
    { atSec: 1, durSec: 0.9, note: 75, gain: 0.3 },
    { atSec: 1, durSec: 3, note: 63, gain: 0.42 },
    { atSec: 2, durSec: 0.9, note: 80, gain: 0.3 },
    { atSec: 2, durSec: 2, note: 44, gain: 0.5 },
    { atSec: 2, durSec: 3, note: 68, gain: 0.42 },
    { atSec: 3, durSec: 0.9, note: 71, gain: 0.3 },
    { atSec: 3, durSec: 3, note: 59, gain: 0.42 },
    { atSec: 4, durSec: 0.9, note: 76, gain: 0.3 },
    { atSec: 4, durSec: 2, note: 40, gain: 0.5 },
    { atSec: 4, durSec: 3.2, note: 64, gain: 0.42 },
    { atSec: 5, durSec: 0.9, note: 79, gain: 0.3 },
    { atSec: 5, durSec: 2.2, note: 67, gain: 0.42 },
    { atSec: 6, durSec: 1.2, note: 36, gain: 0.5 },
    { atSec: 6, durSec: 1.2, note: 60, gain: 0.42 },
    { atSec: 6, durSec: 1.2, note: 72, gain: 0.3 },
  ],
}

// C major and its pole, A flat minor, and back: C E G becomes C flat, E flat, A flat, the outer
// voices opening a half step and the inner one sinking. Nothing is tied.
const POLE_AND_BACK: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 2.4, note: 60, gain: 0.45 },
    { atSec: 0, durSec: 2.4, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 2.4, note: 67, gain: 0.45 },
    { atSec: 2.4, durSec: 2.4, note: 44, gain: 0.5 },
    { atSec: 2.4, durSec: 2.4, note: 59, gain: 0.45 },
    { atSec: 2.4, durSec: 2.4, note: 63, gain: 0.45 },
    { atSec: 2.4, durSec: 2.4, note: 68, gain: 0.45 },
    { atSec: 4.8, durSec: 2.4, note: 48, gain: 0.5 },
    { atSec: 4.8, durSec: 2.4, note: 60, gain: 0.45 },
    { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.45 },
    { atSec: 4.8, durSec: 2.4, note: 67, gain: 0.45 },
  ],
}

// E major and its pole, C minor over E flat, and back, in open position: B to C, E to E flat and
// G sharp to G.
const E_AND_C_MINOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 2.4, note: 59, gain: 0.42 },
    { atSec: 0, durSec: 2.4, note: 68, gain: 0.45 },
    { atSec: 2.4, durSec: 2.4, note: 51, gain: 0.5 },
    { atSec: 2.4, durSec: 2.4, note: 60, gain: 0.42 },
    { atSec: 2.4, durSec: 2.4, note: 67, gain: 0.45 },
    { atSec: 4.8, durSec: 2.4, note: 52, gain: 0.5 },
    { atSec: 4.8, durSec: 2.4, note: 59, gain: 0.42 },
    { atSec: 4.8, durSec: 2.4, note: 68, gain: 0.45 },
  ],
}

// E minor over G and its pole, A flat, wide and low, half the phrase each: G to A flat, E to E
// flat, B to C.
const LOW_POLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 43, gain: 0.55 },
    { atSec: 0, durSec: 3.6, note: 52, gain: 0.45 },
    { atSec: 0, durSec: 3.6, note: 59, gain: 0.45 },
    { atSec: 3.6, durSec: 3.6, note: 44, gain: 0.55 },
    { atSec: 3.6, durSec: 3.6, note: 51, gain: 0.45 },
    { atSec: 3.6, durSec: 3.6, note: 60, gain: 0.45 },
  ],
}

// The three pole pairs on three voices: C, A flat minor, then E, C minor, then A flat, E minor.
// Bass C or B, middle G or A flat, top E or E flat, and nothing else.
const THREE_PAIRS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 48, gain: 0.48 },
    { atSec: 0, durSec: 1.2, note: 55, gain: 0.42 },
    { atSec: 0, durSec: 1.2, note: 64, gain: 0.45 },
    { atSec: 1.2, durSec: 1.2, note: 47, gain: 0.48 },
    { atSec: 1.2, durSec: 1.2, note: 56, gain: 0.42 },
    { atSec: 1.2, durSec: 1.2, note: 63, gain: 0.45 },
    { atSec: 2.4, durSec: 1.2, note: 47, gain: 0.48 },
    { atSec: 2.4, durSec: 1.2, note: 56, gain: 0.42 },
    { atSec: 2.4, durSec: 1.2, note: 64, gain: 0.45 },
    { atSec: 3.6, durSec: 1.2, note: 48, gain: 0.48 },
    { atSec: 3.6, durSec: 1.2, note: 55, gain: 0.42 },
    { atSec: 3.6, durSec: 1.2, note: 63, gain: 0.45 },
    { atSec: 4.8, durSec: 1.2, note: 48, gain: 0.48 },
    { atSec: 4.8, durSec: 1.2, note: 56, gain: 0.42 },
    { atSec: 4.8, durSec: 1.2, note: 63, gain: 0.45 },
    { atSec: 6, durSec: 1.2, note: 47, gain: 0.48 },
    { atSec: 6, durSec: 1.2, note: 55, gain: 0.42 },
    { atSec: 6, durSec: 1.2, note: 64, gain: 0.45 },
  ],
}

// The three pole pairs broken over four notes each: bass, middle, top, middle.
const BROKEN_PAIRS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.2, note: 48, gain: 0.55 },
    { atSec: 0.3, durSec: 0.6, note: 55, gain: 0.4 },
    { atSec: 0.6, durSec: 0.6, note: 64, gain: 0.5 },
    { atSec: 0.9, durSec: 0.3, note: 55, gain: 0.35 },
    { atSec: 1.2, durSec: 1.2, note: 47, gain: 0.55 },
    { atSec: 1.5, durSec: 0.6, note: 56, gain: 0.4 },
    { atSec: 1.8, durSec: 0.6, note: 63, gain: 0.5 },
    { atSec: 2.1, durSec: 0.3, note: 56, gain: 0.35 },
    { atSec: 2.4, durSec: 1.2, note: 47, gain: 0.55 },
    { atSec: 2.7, durSec: 0.6, note: 56, gain: 0.4 },
    { atSec: 3, durSec: 0.6, note: 64, gain: 0.5 },
    { atSec: 3.3, durSec: 0.3, note: 56, gain: 0.35 },
    { atSec: 3.6, durSec: 1.2, note: 48, gain: 0.55 },
    { atSec: 3.9, durSec: 0.6, note: 55, gain: 0.4 },
    { atSec: 4.2, durSec: 0.6, note: 63, gain: 0.5 },
    { atSec: 4.5, durSec: 0.3, note: 55, gain: 0.35 },
    { atSec: 4.8, durSec: 1.2, note: 48, gain: 0.55 },
    { atSec: 5.1, durSec: 0.6, note: 56, gain: 0.4 },
    { atSec: 5.4, durSec: 0.6, note: 63, gain: 0.5 },
    { atSec: 5.7, durSec: 0.3, note: 56, gain: 0.35 },
    { atSec: 6, durSec: 1.2, note: 47, gain: 0.55 },
    { atSec: 6.3, durSec: 0.6, note: 55, gain: 0.4 },
    { atSec: 6.6, durSec: 0.6, note: 64, gain: 0.5 },
    { atSec: 6.9, durSec: 0.3, note: 55, gain: 0.35 },
  ],
}

// Half of the cycle, slow: C, C minor, A flat, A flat minor, 1.8 s each. Top E to E flat, then the
// tenor G to A flat, then the alto C to C flat.
const HALF_THE_TIDE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 64, gain: 0.45 },
    { atSec: 0, durSec: 3.6, note: 48, gain: 0.5 },
    { atSec: 0, durSec: 3.6, note: 55, gain: 0.42 },
    { atSec: 0, durSec: 5.4, note: 60, gain: 0.42 },
    { atSec: 1.8, durSec: 5.4, note: 63, gain: 0.45 },
    { atSec: 3.6, durSec: 3.6, note: 44, gain: 0.5 },
    { atSec: 3.6, durSec: 3.6, note: 56, gain: 0.42 },
    { atSec: 5.4, durSec: 1.8, note: 59, gain: 0.42 },
  ],
}

// The other half, high: A flat minor, E, E minor, C over a bass of A flat, E, E, C. E flat to E, then
// G sharp to G, then B to C.
const HIGH_HALF: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 56, gain: 0.45 },
    { atSec: 0, durSec: 1.8, note: 75, gain: 0.38 },
    { atSec: 0, durSec: 3.6, note: 80, gain: 0.38 },
    { atSec: 0, durSec: 5.4, note: 71, gain: 0.38 },
    { atSec: 1.8, durSec: 3.6, note: 52, gain: 0.45 },
    { atSec: 1.8, durSec: 5.4, note: 76, gain: 0.38 },
    { atSec: 3.6, durSec: 3.6, note: 79, gain: 0.38 },
    { atSec: 5.4, durSec: 1.8, note: 48, gain: 0.45 },
    { atSec: 5.4, durSec: 1.8, note: 72, gain: 0.38 },
  ],
}

// The cycle that holds A minor: A minor, F, F minor, D flat, C sharp minor, A, A minor, a voice at a
// time, over A F D flat A in the bass.
const A_MINOR_ROUND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 1, note: 64, gain: 0.42 },
    { atSec: 0, durSec: 2, note: 57, gain: 0.42 },
    { atSec: 0, durSec: 3, note: 60, gain: 0.42 },
    { atSec: 1, durSec: 2, note: 41, gain: 0.5 },
    { atSec: 1, durSec: 3, note: 65, gain: 0.42 },
    { atSec: 2, durSec: 3, note: 56, gain: 0.42 },
    { atSec: 3, durSec: 2, note: 37, gain: 0.5 },
    { atSec: 3, durSec: 3, note: 61, gain: 0.42 },
    { atSec: 4, durSec: 3.2, note: 64, gain: 0.42 },
    { atSec: 5, durSec: 2.2, note: 33, gain: 0.5 },
    { atSec: 5, durSec: 2.2, note: 57, gain: 0.42 },
    { atSec: 6, durSec: 1.2, note: 60, gain: 0.42 },
  ],
}

// The bass alone: C, A flat, E, C, each a major third under the last, so the octave falls in three
// equal parts.
const THIRDS_BELOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 48, gain: 0.65 },
    { atSec: 1.8, durSec: 1.8, note: 44, gain: 0.65 },
    { atSec: 3.6, durSec: 1.8, note: 40, gain: 0.65 },
    { atSec: 5.4, durSec: 1.8, note: 36, gain: 0.65 },
  ],
}

// One line: E, and then only the note that moves at each change of the cycle: E flat, A flat, B, E,
// G, C. Each is let go just after the next is down.
const ONE_THAT_MOVES: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.03, note: 76, gain: 0.55 },
    { atSec: 1, durSec: 1.03, note: 75, gain: 0.55 },
    { atSec: 2, durSec: 1.03, note: 80, gain: 0.55 },
    { atSec: 3, durSec: 1.03, note: 71, gain: 0.55 },
    { atSec: 4, durSec: 1.03, note: 76, gain: 0.55 },
    { atSec: 5, durSec: 1.03, note: 79, gain: 0.55 },
    { atSec: 6, durSec: 1.2, note: 72, gain: 0.55 },
  ],
}

// E major and C minor at the top of the keyboard: E G sharp B, E flat G C, E G sharp B.
const GLASS_POLES: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 76, gain: 0.42 },
    { atSec: 0, durSec: 2.4, note: 80, gain: 0.4 },
    { atSec: 0, durSec: 2.4, note: 83, gain: 0.4 },
    { atSec: 2.4, durSec: 2.4, note: 75, gain: 0.42 },
    { atSec: 2.4, durSec: 2.4, note: 79, gain: 0.4 },
    { atSec: 2.4, durSec: 2.4, note: 84, gain: 0.4 },
    { atSec: 4.8, durSec: 2.4, note: 76, gain: 0.42 },
    { atSec: 4.8, durSec: 2.4, note: 80, gain: 0.4 },
    { atSec: 4.8, durSec: 2.4, note: 83, gain: 0.4 },
  ],
}

// E minor, its pole A flat, E minor, each with as long a rest after it, so that what answers a chord
// is over before its pole is struck.
const POLES_WITH_RESTS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 1, note: 59, gain: 0.45 },
    { atSec: 0, durSec: 1, note: 67, gain: 0.5 },
    { atSec: 2.4, durSec: 1, note: 51, gain: 0.5 },
    { atSec: 2.4, durSec: 1, note: 60, gain: 0.45 },
    { atSec: 2.4, durSec: 1, note: 68, gain: 0.5 },
    { atSec: 4.8, durSec: 1, note: 52, gain: 0.5 },
    { atSec: 4.8, durSec: 1, note: 59, gain: 0.45 },
    { atSec: 4.8, durSec: 1, note: 67, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Aurora: brass and reeds, from a struck half step to one that takes three seconds to open.
  {
    id: 'hexatonic-poles-brass-in-six-turns',
    name: 'Brass in six turns',
    category: 'pad',
    description:
      'A brass pad that speaks in a fifth of a second, warmed by a console and turned slowly by a rotary cabinet.',
    preview: CYCLE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 1500, contour: 0.85, attack: 0.2, swell: 0.3, release: 1.4 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.3 } },
      { deviceId: 'rotary', preset: 'Chorale' },
    ],
  },
  {
    id: 'hexatonic-poles-horns-with-no-root',
    name: 'Horns with no root',
    category: 'wind',
    description: 'Soft dark horns, slow to open, heard from the back of a hall.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 560, lowCut: 110, attack: 0.9, release: 2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'hexatonic-poles-strings-between-thirds',
    name: 'Strings between thirds',
    category: 'pad',
    description:
      'Wide detuned strings with the lows cut away, the top opened out between the speakers.',
    preview: CYCLE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { volume: -2.5, brilliance: 6500, lowCut: 480, detune: 24, attack: 0.5, release: 2 },
    },
    effects: [{ deviceId: 'spread', preset: 'Wide top' }],
  },
  {
    id: 'hexatonic-poles-choir-without-a-seam',
    name: 'Choir without a seam',
    category: 'voice',
    description:
      'A resonant synthetic choir with no bass that answers in a hall shaped to a sung oo.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { brilliance: 1250, lowCut: 520, resonance: 0.75, attack: 0.8, release: 1.8 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind' }],
  },
  {
    id: 'hexatonic-poles-metal-at-the-change',
    name: 'Metal at the change',
    category: 'pad',
    description:
      'A fast metallic pad with the ring of its two layers turned well up, under a faint slow phaser.',
    preview: SHADOWED,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { ring: 0.8, attack: 0.02, swell: 0.1, brilliance: 2600, release: 1.4 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Faint shade' }],
  },
  {
    id: 'hexatonic-poles-three-seconds-to-turn',
    name: 'Three seconds to turn',
    category: 'pad',
    description:
      'A dark pad whose filter climbs for nearly three seconds after the key, in a deep valley of reverb.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { volume: -3.5, brilliance: 420, contour: 1, attack: 2.6, release: 3.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 7 } }],
  },
  {
    id: 'hexatonic-poles-clipped-thirds',
    name: 'Clipped thirds',
    category: 'keys',
    description:
      'A short brassy key that opens at once and stops dead, with a soft tape slap behind it.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { attack: 0.008, release: 0.12, brilliance: 1100, contour: 1 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.22 } }],
  },
  {
    id: 'hexatonic-poles-pipes-two-places-each',
    name: 'Pipes, two places each',
    category: 'organ',
    description:
      'A still, undetuned pipe tone with flute stops added an octave below and above it.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { brilliance: 850, lowCut: 60 },
    },
    effects: [{ deviceId: 'stops', preset: 'Flute stops' }],
  },
  {
    id: 'hexatonic-poles-reeds-off-the-key',
    name: 'Reeds off the key',
    category: 'organ',
    description: 'Loose reeds detuned by thirty cents on a worn four-track cassette.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { detune: 30, brilliance: 2600, attack: 0.12, release: 0.7 },
    },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
  },
  {
    id: 'hexatonic-poles-muted-line-that-moves',
    name: 'Muted line that moves',
    category: 'wind',
    description: 'A thin muted brass line through a small bedside speaker.',
    preview: ONE_THAT_MOVES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { attack: 0.09, release: 0.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }],
  },
  {
    id: 'hexatonic-poles-silver-half-of-it',
    name: 'Silver half of it',
    category: 'string',
    description:
      'Bright strings with everything under 900 Hz cut, their partials catching the light band by band.',
    preview: HIGH_HALF,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.8, release: 3 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.75 } }],
  },
  {
    id: 'hexatonic-poles-ice-at-both-poles',
    name: 'Ice at both poles',
    category: 'pad',
    description: 'Two layers hardly a cent apart beating slowly, swept by a glacial phaser.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow phasing',
      params: { volume: -2.5, detune: 1, attack: 0.9, release: 3, lowCut: 150 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Glacial sweep' }],
  },
  {
    id: 'hexatonic-poles-what-the-chords-share',
    name: 'What the chords share',
    category: 'string',
    description:
      'Ringing metal strings that speak at once, with a filter that keeps the notes two chords have in common hanging on.',
    preview: SHADOWED,
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { release: 1.5, brilliance: 3600 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Hanging notes' }],
  },
  {
    id: 'hexatonic-poles-slow-metal-opposite',
    name: 'Slow metal, opposite',
    category: 'texture',
    description:
      'Heavy ring between two swelling layers, left as a blurred halo that holds its pitch.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Melting metal',
      params: { attack: 1.8, release: 3 },
    },
    effects: [{ deviceId: 'melt', preset: 'Still halo', params: { mix: 0.5 } }],
  },
  {
    id: 'hexatonic-poles-vowel-turned-minor',
    name: 'Vowel turned minor',
    category: 'voice',
    description:
      'A resonant filter that opens like a mouth over a second, pressed into a round vowel.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 1.1, release: 2.5, resonance: 0.65 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Round vowel' }],
  },
  {
    id: 'hexatonic-poles-floor-of-the-tide',
    name: 'Floor of the tide',
    category: 'drone',
    description:
      'A dark slow swell, its filter closed to 240 Hz, with one more octave laid below it.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { attack: 2.2, release: 2.5, brilliance: 240 },
    },
    effects: [{ deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.6 } }],
  },
  {
    id: 'hexatonic-poles-bass-by-major-thirds',
    name: 'Bass by major thirds',
    category: 'bass',
    description:
      'A round brass bass that speaks quickly and stays dark, thickened by soft tape saturation.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 300,
        lowCut: 20,
        attack: 0.04,
        swell: 0,
        contour: 0.5,
        release: 0.6,
        detune: 3,
      },
    },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth' }],
  },
  {
    id: 'hexatonic-poles-breathed-semitone',
    name: 'Breathed semitone',
    category: 'wind',
    description:
      'A narrow nasal band of brass opened and closed by a slow breath with some air in it.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 2400, lowCut: 1100, resonance: 0.6, attack: 0.5, release: 2 },
    },
    effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { air: 0.6, depth: 0.5 } }],
  },
  {
    id: 'hexatonic-poles-noon-in-three-keys',
    name: 'Noon in three keys',
    category: 'keys',
    description:
      'Saws open to 13 kHz and quick both ways, with no movement in the filter, on a bright plate.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: {
        brilliance: 13000,
        lowCut: 60,
        attack: 0.02,
        swell: 0,
        release: 0.5,
        detune: 5,
        contour: 0,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } }],
  },
  {
    id: 'hexatonic-poles-whistle-over-no-key',
    name: 'Whistle over no key',
    category: 'wind',
    description:
      'A resonant peak with most of the tone filtered off, its low and high halves swaying by turns.',
    preview: ONE_THAT_MOVES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: {
        brilliance: 700,
        resonance: 0.95,
        lowCut: 300,
        attack: 0.15,
        release: 1.2,
        detune: 2,
      },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.6 } }],
  },
  {
    id: 'hexatonic-poles-thin-ice-above',
    name: 'Thin ice above',
    category: 'texture',
    description:
      'Thin strings with everything under 2 kHz cut, and pure sines that swell in an octave higher.',
    preview: GLASS_POLES,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { volume: 4, lowCut: 2000, brilliance: 15000, attack: 0.4, release: 2, detune: 6 },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo' }],
  },
  {
    id: 'hexatonic-poles-change-before-the-sound',
    name: 'Change before the sound',
    category: 'texture',
    description:
      'A clipped brass chord followed by itself backwards, swelling back up to where it was struck.',
    preview: POLES_WITH_RESTS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { brilliance: 1800, contour: 0.6, release: 0.4 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1200, mix: 0.65, feedback: 0.1 },
      },
    ],
  },
  {
    id: 'hexatonic-poles-crowd-of-neighbours',
    name: 'Crowd of neighbours',
    category: 'pad',
    description:
      'Dull detuned brass flown apart into a thick flock of sixteen, each at its own distance.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: {
        volume: -4.5,
        brilliance: 1000,
        lowCut: 250,
        resonance: 0.05,
        detune: 28,
        attack: 0.35,
        release: 1.2,
      },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Thick ensemble', params: { mix: 0.75 } }],
  },
  {
    id: 'hexatonic-poles-under-the-waterline',
    name: 'Under the waterline',
    category: 'pad',
    description:
      'A ringing brass pad taken deep under water, wavering slowly, with a few large bubbles.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 5000, ring: 0.3, attack: 0.7, release: 2.5 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Deep water' }],
  },
  {
    id: 'hexatonic-poles-left-major-right-minor',
    name: 'Left major, right minor',
    category: 'pad',
    description:
      'Wide full strings gated softly to the left and then the right, two and a half times a second.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: {
        volume: -7,
        brilliance: 3200,
        lowCut: 40,
        resonance: 0.4,
        attack: 0.25,
        detune: 12,
        release: 1.6,
      },
    },
    effects: [{ deviceId: 'pulses', preset: 'Left then right' }],
  },
  // String machine: three octaves of ensemble, weighed low, level or high.
  {
    id: 'hexatonic-poles-ensemble-with-no-key',
    name: 'Ensemble with no key',
    category: 'string',
    description:
      'A full string ensemble that speaks in a third of a second, in a warm hall whose lows last twice as long as its mids.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { volume: -4, attack: 0.3, release: 1.2, tone: 2000 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { lowDecay: 4, crossover: 350, mix: 0.35 },
      },
    ],
  },
  {
    id: 'hexatonic-poles-rows-of-slow-bows',
    name: 'Rows of slow bows',
    category: 'string',
    description:
      'Slow dark ensemble strings drifting a little, far back in the stone of a stairwell.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { volume: -2.5, attack: 1.1, release: 2.2, tone: 1500 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'hexatonic-poles-glass-six-facets',
    name: 'Glass, six facets',
    category: 'string',
    description:
      'An ensemble with no lower octave and its upper one at full, bright, in a shining room.',
    preview: HIGH_HALF,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.5, release: 2, tone: 9000 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber' }],
  },
  {
    id: 'hexatonic-poles-cellos-cross-over',
    name: 'Cellos cross over',
    category: 'string',
    description:
      'The lower octave at full under an open tone and a deep quick ensemble, on a tape pushed to a warm thump.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.2, release: 0.8, tone: 3400, ensemble: 1, speed: 1.8 },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'hexatonic-poles-dry-edge-of-a-chord',
    name: 'Dry edge of a chord',
    category: 'string',
    description:
      'Bare saws with the octave below and no ensemble, doubled by a late copy and scattered wide by a phaser.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { low: 0.9, high: 0, tone: 1500, release: 0.45 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.45 } },
      { deviceId: 'phaser', preset: 'Stereo scatter' },
    ],
  },
  {
    id: 'hexatonic-poles-fog-over-e-flat',
    name: 'Fog over E flat',
    category: 'pad',
    description:
      'A low muffled ensemble blurred until its attacks are gone, its tone closed to 450 Hz.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 1.4, release: 3 },
    },
    effects: [{ deviceId: 'fog', preset: 'Deep fog' }],
  },
  {
    id: 'hexatonic-poles-quicksilver-voices',
    name: 'Quicksilver voices',
    category: 'string',
    description:
      'A bright fast shimmer of strings whose bands swell and drift across on cycles of their own.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { attack: 0.2, release: 1 },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves' }],
  },
  {
    id: 'hexatonic-poles-turning-organ',
    name: 'Turning organ',
    category: 'organ',
    description:
      'An organ tone weighed to its upper octave, on a fast rotor driven into a growl and a narrow warm spring.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { low: 0.1, high: 1, tone: 5200, attack: 0.04, release: 0.6 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Growl', params: { drive: 0.6 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'hexatonic-poles-wheel-of-six',
    name: 'Wheel of six',
    category: 'string',
    description:
      'A slow wide ensemble swept end to end by a flanger that takes twelve seconds to turn.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { volume: -4, attack: 0.8, release: 2, tone: 4000 },
    },
    effects: [{ deviceId: 'flanger', preset: 'Slow sweep', params: { feedback: 55 } }],
  },
  {
    id: 'hexatonic-poles-hollow-of-the-third',
    name: 'Hollow of the third',
    category: 'string',
    description:
      'Hollow upper strings with a slow notch moving through them, kept narrow by a soft tape drive.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.3, release: 1.6, tone: 3000, width: 0.15 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'saturator', preset: 'On tape' },
    ],
  },
  {
    id: 'hexatonic-poles-violas-exchange',
    name: 'Violas exchange',
    category: 'string',
    description: 'One octave only, like violas close together, through a dark woolly speaker.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.15, release: 0.6 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Dark and woolly' }],
  },
  {
    id: 'hexatonic-poles-three-floors-of-c',
    name: 'Three floors of C',
    category: 'string',
    description:
      'All three octaves at full, wide and bright, ringing off a long tank of three springs.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.08, release: 0.8 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } }],
  },
  {
    id: 'hexatonic-poles-long-lean-of-cellos',
    name: 'Long lean of cellos',
    category: 'string',
    description:
      'A low swell of two seconds that dissolves into dark water, every partial hanging on after it.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { volume: -15, attack: 2, release: 4 },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Dark water' }],
  },
  {
    id: 'hexatonic-poles-cassette-in-a-flat',
    name: 'Cassette in A flat',
    category: 'string',
    description:
      'A seasick fast ensemble recorded on a worn cassette, with its wobble and its noise.',
    preview: CYCLE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.3, release: 1.2 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
  },
  {
    id: 'hexatonic-poles-muted-upper-voice',
    name: 'Muted upper voice',
    category: 'string',
    description: 'Muted violins that begin each note straight and sway more the longer it is held.',
    preview: ONE_THAT_MOVES,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { volume: -3, attack: 0.25, release: 0.9, ensemble: 0.2 },
    },
    effects: [{ deviceId: 'late-vibrato', preset: 'Singer' }],
  },
  {
    id: 'hexatonic-poles-bowed-ground-in-thirds',
    name: 'Bowed ground in thirds',
    category: 'bass',
    description:
      'A bowed bass opened to 900 Hz and set turning by a deep slow ensemble, given weight by an iron transformer.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { tone: 900, attack: 0.2, low: 0.6, ensemble: 0.9, width: 0.5 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'hexatonic-poles-sampled-at-the-seam',
    name: 'Sampled at the seam',
    category: 'string',
    description: 'One open octave of saw, plain and quick, resampled to a dusty ten bits.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { low: 0, high: 0, tone: 2200, attack: 0.01, release: 0.5, width: 0.3 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Dusty', params: { mix: 0.7 } }],
  },
  {
    id: 'hexatonic-poles-tide-between-tables',
    name: 'Tide between tables',
    category: 'pad',
    description:
      'Strings weighed to the upper octave, coming and going in two slow gates that drift apart.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { low: 0.1, high: 0.8, tone: 5500, attack: 0.4, release: 2, speed: 0.4, width: 1 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Long tide', params: { rate: 0.6 } }],
  },
  {
    id: 'hexatonic-poles-strings-on-a-switch',
    name: 'Strings on a switch',
    category: 'keys',
    description:
      'Ensemble strings that start and stop at once, closed to 400 Hz and repeated by a tape echo with three heads.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { volume: -6.5, attack: 0.005, release: 0.18, low: 0.2, high: 0.6, tone: 3200 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Low-pass gate' },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 300, mix: 0.35, feedback: 0.3 },
      },
    ],
  },
  {
    id: 'hexatonic-poles-drowned-octaves',
    name: 'Drowned octaves',
    category: 'pad',
    description: 'All three octaves with the tone nearly shut, under water and swelling slowly.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { tone: 650, attack: 0.6, release: 2.5, speed: 0.3 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Slow swell' }],
  },
  // Ember: synth pads, from two sines to seven saws, with a glide of a half step in the lines.
  {
    id: 'hexatonic-poles-warm-side-of-e',
    name: 'Warm side of E',
    category: 'pad',
    description:
      'A warm two-oscillator pad opened by a slow filter, tied together by a slow compressor and a tape.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { ampAttack: 0.5, filterAttack: 1.2, ampRelease: 1.8, cutoff: 900, subLevel: 0.35 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.05 } },
    ],
  },
  {
    id: 'hexatonic-poles-saws-in-slow-exchange',
    name: 'Saws in slow exchange',
    category: 'string',
    description:
      'Detuned saw strings through a high-pass that leaves the air of them, with a wide short hall after.',
    preview: CYCLE,
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        volume: 2.5,
        filterType: 1,
        cutoff: 1400,
        filterEnvAmount: 0,
        ampAttack: 0.35,
        ampRelease: 1.2,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber' }],
  },
  {
    id: 'hexatonic-poles-glass-changes-hands',
    name: 'Glass changes hands',
    category: 'pad',
    description:
      'A glassy triangle and pulse pad with the upper pulse forward, rippling upward band by band.',
    preview: HIGH_HALF,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { oscMix: 0.65, cutoff: 4500, ampAttack: 0.3, ampRelease: 2.5 },
    },
    effects: [{ deviceId: 'glimmer', preset: 'Rising ripple' }],
  },
  {
    id: 'hexatonic-poles-drone-without-a-home',
    name: 'Drone without a home',
    category: 'drone',
    description: 'A dark driven drone with a strong sub, moved slowly round the head.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 1.4, ampRelease: 3, cutoff: 340 },
    },
    effects: [{ deviceId: 'around', preset: 'Drone drift' }],
  },
  {
    id: 'hexatonic-poles-air-at-the-half-step',
    name: 'Air at the half step',
    category: 'pad',
    description:
      'A breathy pad with the octave and the noise turned up, with a warm wide summer of chorus and space.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: { noiseLevel: 0.2, oscMix: 0.5, ampAttack: 0.7, ampRelease: 2 },
    },
    effects: [{ deviceId: 'seasons', preset: 'High summer' }],
  },
  {
    id: 'hexatonic-poles-sliding-ground',
    name: 'Sliding ground',
    category: 'bass',
    description:
      'One warm bass voice that slides a quarter of a second from third to third, through a warm stack.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'ember',
      preset: 'Warm Bass',
      params: { voiceMode: 2, glide: 0.25, cutoff: 520, ampAttack: 0.03, ampRelease: 0.35 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'hexatonic-poles-seven-saws-asleep',
    name: 'Seven saws asleep',
    category: 'pad',
    description:
      'Seven saws a note with the filter nearly closed, pressed together by a driven limiter and widened.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { cutoff: 700, resonance: 0.3, ampAttack: 0.25, ampRelease: 1.2, unisonDetune: 34 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'hexatonic-poles-pluck-of-a-pole',
    name: 'Pluck of a pole',
    category: 'plucked',
    description:
      'A glass pluck that rings for a second and is answered by seven echoes scattered across the sides.',
    preview: POLES_WITH_RESTS,
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: {
        volume: 3,
        cutoff: 500,
        filterDecay: 0.35,
        ampDecay: 1.1,
        ampRelease: 0.9,
        resonance: 0.2,
      },
    },
    effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } }],
  },
  {
    id: 'hexatonic-poles-voice-that-slides-over',
    name: 'Voice that slides over',
    category: 'wind',
    description:
      'A single synced voice, softened, that glides into each note and leaves dark echoes, its rumble cut.',
    preview: ONE_THAT_MOVES,
    instrument: {
      deviceId: 'ember',
      preset: 'Sync Lead',
      params: {
        volume: -2,
        glide: 0.18,
        cutoff: 2200,
        filterDrive: 0.1,
        ampAttack: 0.12,
        ampRelease: 0.6,
        lfo1Amount: 0.008,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'hexatonic-poles-hollow-between-six',
    name: 'Hollow between six',
    category: 'pad',
    description:
      'A hollow pulse pad an octave up, smeared by a fog that has no tail, then opened in the middle.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: {
        volume: -6,
        osc1Coarse: 12,
        cutoff: 2600,
        ampAttack: 0.2,
        ampRelease: 0.9,
        lfo2Amount: 0.2,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'spread', preset: 'Open middle' },
    ],
  },
  {
    id: 'hexatonic-poles-sine-for-a-root',
    name: 'Sine for a root',
    category: 'bass',
    description:
      'A sine and another an octave below it, eased in, given overtones by an octave saturator so it speaks on small speakers.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: { volume: -9.5, ampAttack: 0.06, ampRelease: 0.5, glide: 0.12 },
    },
    effects: [{ deviceId: 'saturator', preset: 'Octave glow' }],
  },
  {
    id: 'hexatonic-poles-bell-at-each-step',
    name: 'Bell at each step',
    category: 'bell',
    description:
      'A two-sine bell with its upper partial an octave and a fifth above, its echo unfolded from low to high over half a second.',
    preview: SHADOWED,
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { volume: 0, ampDecay: 2.6, ampRelease: 0.9, oscMix: 0.25 },
    },
    effects: [
      {
        deviceId: 'prism',
        preset: 'Slow unfolding',
        params: { time: 550, feedback: 0.25, mix: 0.35 },
      },
    ],
  },
  {
    id: 'hexatonic-poles-brass-in-a-cold-hall',
    name: 'Brass in a cold hall',
    category: 'wind',
    description:
      'Synth brass that blooms into its filter over a third of a second, in the first frost of the year.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { filterAttack: 0.3, ampAttack: 0.12, ampRelease: 0.8, cutoff: 600 },
    },
    effects: [{ deviceId: 'seasons', preset: 'First frost' }],
  },
  {
    id: 'hexatonic-poles-two-sines-agree',
    name: 'Two sines agree',
    category: 'organ',
    description:
      'Two sines an octave apart with a sub, nothing more, on a slow chorale rotor across the room.',
    preview: CYCLE,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        volume: -11.5,
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Coarse: 12,
        oscMix: 0.35,
        subLevel: 0.3,
        ampAttack: 0.04,
        ampRelease: 0.4,
        velToAmp: 0.4,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'hexatonic-poles-pulse-narrowing',
    name: 'Pulse narrowing',
    category: 'pad',
    description:
      'Two pulses whose widths open and narrow once every five seconds, notched by an inverted flanger.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 1,
        osc1Pw: 0.3,
        osc2Shape: 1,
        osc2Pw: 0.7,
        osc2Fine: 6,
        oscMix: 0.5,
        cutoff: 3800,
        filterSlope: 0,
        lfo1Dest: 4,
        lfo1Rate: 0.2,
        lfo1Amount: 0.45,
        ampAttack: 0.4,
        ampRelease: 1.4,
        unisonVoices: 2,
        unisonSpread: 0.9,
      },
    },
    effects: [{ deviceId: 'flanger', preset: 'Negative hollow', params: { rate: 0.12 } }],
  },
  {
    id: 'hexatonic-poles-breath-drawn-on-a-flat',
    name: 'Breath drawn on A flat',
    category: 'texture',
    description:
      'Half noise and half saw through a resonant band that follows the keys, kept wide and near.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        volume: 4,
        noiseLevel: 0.45,
        filterType: 2,
        filterSlope: 1,
        cutoff: 900,
        resonance: 0.55,
        keyTrack: 1,
        ampAttack: 0.5,
        ampRelease: 1.6,
        unisonVoices: 3,
        unisonSpread: 1,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Wide and near' }],
  },
  {
    id: 'hexatonic-poles-flute-on-the-moving-note',
    name: 'Flute on the moving note',
    category: 'wind',
    description:
      'A triangle flute with a little noise, legato with a short glide, its vibrato coming late, in a faint hall.',
    preview: ONE_THAT_MOVES,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 2,
        noiseLevel: 0.07,
        cutoff: 2800,
        filterSlope: 0,
        voiceMode: 2,
        glide: 0.07,
        ampAttack: 0.09,
        ampRelease: 0.3,
      },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow', params: { wait: 250, grow: 600 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'hexatonic-poles-throb-between-poles',
    name: 'Throb between poles',
    category: 'pad',
    description:
      'Saw and a square an octave below, throbbing three times a second in level, coloured by a triode.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc2Shape: 1,
        osc2Coarse: -12,
        oscMix: 0.5,
        cutoff: 1800,
        resonance: 0.2,
        filterSlope: 0,
        lfo1Dest: 2,
        lfo1Rate: 3,
        lfo1Amount: 0.6,
        ampAttack: 0.05,
        ampRelease: 0.7,
      },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
  },
  {
    id: 'hexatonic-poles-noise-finds-the-note',
    name: 'Noise finds the note',
    category: 'texture',
    description:
      'A noise sweep with its sine left in, sifted until mostly tone and air are left of it.',
    preview: GLASS_POLES,
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        noiseLevel: 0.5,
        oscMix: 0,
        filterType: 0,
        cutoff: 600,
        keyTrack: 0.5,
        filterEnvAmount: 0.5,
        resonance: 0.3,
        ampAttack: 0.3,
        ampRelease: 1.5,
      },
    },
    effects: [{ deviceId: 'sift', preset: 'Breath and tone' }],
  },
  {
    id: 'hexatonic-poles-small-hours-of-g-sharp',
    name: 'Small hours of G sharp',
    category: 'keys',
    description:
      'A soft key of triangle and sine that dies in two seconds, on a muffled early sampler.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        volume: 2.5,
        osc1Shape: 2,
        osc2Shape: 3,
        osc2Coarse: -12,
        oscMix: 0.3,
        cutoff: 900,
        filterEnvAmount: 0.3,
        filterDecay: 0.6,
        filterSustain: 0,
        ampAttack: 0.01,
        ampDecay: 2,
        ampSustain: 0,
        ampRelease: 0.8,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Muffled sampler' }],
  },
  // Chamber strings: the voices as players, one who moves and two who wait.
  {
    id: 'hexatonic-poles-three-players-one-moves',
    name: 'Three players, one moves',
    category: 'string',
    description:
      'A still section of three with no vibrato and little bow, in a hall where the mids outlast the lows.',
    preview: CYCLE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Still halo',
      params: { attack: 0.5, release: 1.4, mute: 0.6 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { midDecay: 2.5, mix: 0.25 } },
    ],
  },
  {
    id: 'hexatonic-poles-muted-desks-at-dusk',
    name: 'Muted desks at dusk',
    category: 'string',
    description:
      'Five muted players swelling in over a second, followed by a low section that grows behind them.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { attack: 1, release: 2 },
    },
    effects: [{ deviceId: 'pad-follower', preset: 'Low section' }],
  },
  {
    id: 'hexatonic-poles-whisper-on-the-string',
    name: 'Whisper on the string',
    category: 'string',
    description:
      'Almost no bow and almost all air, with whatever is quiet in it turned up from the top.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { attack: 0.6, release: 1.4, air: 1 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Air' }],
  },
  {
    id: 'hexatonic-poles-the-viola-that-leaves',
    name: 'The viola that leaves',
    category: 'string',
    description: 'One close, half muted player with a wide vibrato, heard out of a wooden body.',
    preview: ONE_THAT_MOVES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { volume: -2, vibrato: 22, mute: 0.5, bow: 0.2 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
  },
  {
    id: 'hexatonic-poles-bridge-in-e-major',
    name: 'Bridge in E major',
    category: 'string',
    description:
      'Three players hard at the bridge, glassy and still, only what is new in each chord let through in full.',
    preview: GLASS_POLES,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Glass bridge',
      params: { volume: -3.5, attack: 0.3, release: 1.5 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'New notes up' }],
  },
  {
    id: 'hexatonic-poles-bows-off-the-string',
    name: 'Bows off the string',
    category: 'string',
    description: 'Short bows with a hard start, thrown back by a spring with a late splash.',
    preview: BROKEN_PAIRS,
    instrument: { deviceId: 'chamber-strings', preset: 'Short bows', params: { release: 0.3 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Late splash' }],
  },
  {
    id: 'hexatonic-poles-ragged-edge-of-d-flat',
    name: 'Ragged edge of D flat',
    category: 'string',
    description:
      'Six scattered players hard on the bow and unmuted, who never quite meet, put on a dusty record.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Ragged unison',
      params: { bow: 0.9, mute: 0, air: 0.1, attack: 0.25, release: 0.8 },
    },
    effects: [{ deviceId: 'patina', preset: 'Dusty record' }],
  },
  {
    id: 'hexatonic-poles-viols-in-two-places',
    name: 'Viols in two places',
    category: 'string',
    description:
      'A straight dark consort of viols with pipes at their pitch and an octave below, speaking a little behind.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Viol consort',
      params: { volume: -4, mute: 0.9, release: 0.7 },
    },
    effects: [{ deviceId: 'stops', preset: 'Pedal under' }],
  },
  {
    id: 'hexatonic-poles-veil-taken-off',
    name: 'Veil taken off',
    category: 'string',
    description:
      'A muted veil of five close to the bridge that hangs where it is caught and glides to the next chord.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Thin veil',
      params: { volume: -2.5, attack: 0.7, release: 2 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Slow strings' }],
  },
  {
    id: 'hexatonic-poles-low-bows-in-thirds',
    name: 'Low bows in thirds',
    category: 'bass',
    description:
      'Two low players with a firm bow and the mute half on, a tape preamp leaning on the bottom of them.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Quiet duet',
      params: { bow: 0.6, mute: 0.5, attack: 0.12, release: 0.6, width: 0.2 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Tape weight' }],
  },
  // Felt piano: the changes struck, from bare to nearly bowed.
  {
    id: 'hexatonic-poles-hammer-on-the-third',
    name: 'Hammer on the third',
    category: 'keys',
    description:
      'A bare bright piano with strings that stay in tune, every quiet overtone in it turned up.',
    preview: SHADOWED,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -10.5, reverbMix: 0.1, detune: 0, hardness: 0.85 },
    },
    effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
  },
  {
    id: 'hexatonic-poles-keys-without-an-edge',
    name: 'Keys without an edge',
    category: 'pad',
    description:
      'A felted piano whose every stroke fades in over half a second, with strings that swell up behind it.',
    preview: CYCLE,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -6.5, sustain: 0, reverbMix: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 500 } },
      { deviceId: 'pad-follower', preset: 'String pad' },
    ],
  },
  {
    id: 'hexatonic-poles-broken-and-turned',
    name: 'Broken and turned',
    category: 'keys',
    description: 'A worn mono upright under a swirl of phaser, recorded on a hot glued tape.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Worn mono',
      params: { outputDb: -11.5, hardness: 0.35, grit: 0.4 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.3 } },
      { deviceId: 'tape', preset: 'Hot glue' },
    ],
  },
  {
    id: 'hexatonic-poles-pedal-through-the-pair',
    name: 'Pedal through the pair',
    category: 'keys',
    description:
      'A soft piano whose strings ring in sympathy with the notes it has just learned from the keys.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { outputDb: -15, sustain: 0.2, reverbMix: 0.05, felt: 0.7 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.6, decay: 4 } },
    ],
  },
  {
    id: 'hexatonic-poles-next-door-in-a-minor',
    name: 'Next door in A minor',
    category: 'keys',
    description:
      'A dull piano from the next room, thudding softly, its repeats seen as through murky water.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Next room',
      params: { outputDb: -9.5, thump: 1, felt: 1, hardness: 0.1 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { time: 420, feedback: 0.35 } }],
  },
  {
    id: 'hexatonic-poles-upright-in-two-tempers',
    name: 'Upright in two tempers',
    category: 'keys',
    description:
      'An old clattering upright, out of tune with itself, thinned and doubled wide and late on the sides.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -12.5, grit: 0.2 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'hexatonic-poles-piano-held-in-glass',
    name: 'Piano held in glass',
    category: 'keys',
    description: 'Still strings struck clean and caught at once into a long glassy organ.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { outputDb: -10, sustain: 0 },
    },
    effects: [{ deviceId: 'sustainer', preset: 'Glass organ', params: { mix: 0.6, decay: 12 } }],
  },
  // Wavetable: five tables, each at a place of its own.
  {
    id: 'hexatonic-poles-glass-hour-on-c',
    name: 'Glass hour on C',
    category: 'pad',
    description: 'A plain sine table over half a sub, wavered like the light on a shallow sea.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { volume: -14, attack: 0.6, release: 1.6 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }],
  },
  {
    id: 'hexatonic-poles-choir-leaning-minor',
    name: 'Choir leaning minor',
    category: 'voice',
    description:
      'A vowel table held nearly still over a full sub, its filter low and ringing, in a small chapel that sings along.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        attack: 0.5,
        release: 1.2,
        motion: 0.15,
        position: 0.8,
        sub: 0.9,
        detune: 4,
        resonance: 0.5,
        cutoff: 1500,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
  },
  {
    id: 'hexatonic-poles-reed-between-chords',
    name: 'Reed between chords',
    category: 'organ',
    description:
      'A reed table past its middle, wide and unsteady, pushed until a valve begins to bloom.',
    preview: A_MINOR_ROUND,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { position: 0.6, cutoff: 3800, sub: 0, detune: 20, spread: 0.9, release: 0.6 },
    },
    effects: [{ deviceId: 'patina', preset: 'Valve bloom' }],
  },
  {
    id: 'hexatonic-poles-hollow-hexagon',
    name: 'Hollow hexagon',
    category: 'pad',
    description:
      'A hollow table with a resonant low-pass, sinking and swelling in three broad bands.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 1.3, release: 2.5, resonance: 0.5, cutoff: 1100 },
    },
    effects: [{ deviceId: 'currents', preset: 'Deep swell' }],
  },
  {
    id: 'hexatonic-poles-spectrum-unkeyed',
    name: 'Spectrum unkeyed',
    category: 'texture',
    description: 'A spectral table opened wide and scattered into a thick fog of grains.',
    preview: HIGH_HALF,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 0.8, release: 2, rate: 0.15 },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { position: 0.04, feedback: 0.4 } },
    ],
  },
  {
    id: 'hexatonic-poles-bass-in-equal-parts',
    name: 'Bass in equal parts',
    category: 'bass',
    description:
      'A thick saw table with a full sub under it, closed to 600 Hz and levelled by a fast limiter.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: {
        sub: 1,
        cutoff: 600,
        attack: 0.03,
        release: 0.5,
        detune: 14,
        spread: 0.3,
        resonance: 0.3,
      },
    },
    effects: [{ deviceId: 'fet-limiter', preset: 'Squash' }],
  },
  {
    id: 'hexatonic-poles-pulse-keys-by-turns',
    name: 'Pulse keys by turns',
    category: 'keys',
    description: 'A narrow pulse key, quick and thin, with a chorus on it and a plain echo.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { volume: -3, attack: 0.006, release: 0.35, cutoff: 3200 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'echo-memory', preset: 'Plain echo', params: { mix: 0.25 } },
    ],
  },
  // Afterglow: struck, then held by its own overtones while the next chord arrives.
  {
    id: 'hexatonic-poles-felt-that-stays-lit',
    name: 'Felt that stays lit',
    category: 'keys',
    description:
      'A felt strike with a quick glow, the tones two chords share held longer than the rest.',
    preview: CYCLE,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { bloom: 0.8, fade: 1.5, glow: 0.5 },
    },
    effects: [{ deviceId: 'common-tones', preset: 'Long hold' }],
  },
  {
    id: 'hexatonic-poles-bell-the-moved-note',
    name: 'Bell, the moved note',
    category: 'bell',
    description:
      'A bell that rings on into a wide halo, throwing off sparks in fifths and octaves above.',
    preview: SHADOWED,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { volume: -5, decay: 2.2, fade: 1.4 },
    },
    effects: [{ deviceId: 'glints', preset: 'Glitter' }],
  },
  {
    id: 'hexatonic-poles-glass-hardly-touched',
    name: 'Glass hardly touched',
    category: 'bell',
    description:
      'Glass struck so lightly that its glow is most of it, doubled by a cloud of detuned grains.',
    preview: HIGH_HALF,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { strike: 0.25, bloom: 1, fade: 2, tone: 0.75 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Detuned double' }],
  },
  {
    id: 'hexatonic-poles-plucked-off-centre',
    name: 'Plucked off centre',
    category: 'plucked',
    description:
      'A pluck with a short haze after it, in a small tank of spring with a quick twang.',
    preview: BROKEN_PAIRS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: { glow: 0.25, decay: 1.4, fade: 1.5, tone: 0.8 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Quick twang' }],
  },
  {
    id: 'hexatonic-poles-glow-from-the-far-pole',
    name: 'Glow from the far pole',
    category: 'pad',
    description: 'No strike at all, only the glow rising in under a second, blown into a bottle.',
    preview: POLE_AND_BACK,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.8, fade: 2, tone: 0.35 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { air: 0.25 } }],
  },
  {
    id: 'hexatonic-poles-dark-strike-low-light',
    name: 'Dark strike, low light',
    category: 'keys',
    description:
      'A dark felt strike that glows on low, an octave added below it and the top muffled away.',
    preview: LOW_POLES,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: { strike: 1, bloom: 1.5, fade: 4 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  // Dusk: one oscillator a key and a wide chorus, five ways into the change.
  {
    id: 'hexatonic-poles-last-chorus-of-day',
    name: 'Last chorus of day',
    category: 'pad',
    description:
      'Both choruses on a moving pulse with the lows thinned, set in a formant that stands still.',
    preview: CYCLE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { attack: 0.3, release: 1.4, chorus: 3, lowCut: 2 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Still formant' }],
  },
  {
    id: 'hexatonic-poles-sub-floor-by-thirds',
    name: 'Sub floor by thirds',
    category: 'bass',
    description:
      'A square with its sub octave at full and no chorus, closed low, in an iron transformer that melts a little.',
    preview: THIRDS_BELOW,
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { cutoff: 380, attack: 0.03, release: 0.5, chorus: 0 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron melt', params: { drive: 0.5 } }],
  },
  {
    id: 'hexatonic-poles-filter-sings-the-turn',
    name: 'Filter sings the turn',
    category: 'wind',
    description:
      'A filter near whistling, singing a twelfth above every key, over a thin saw in a veil of soft fuzz.',
    preview: HALF_THE_TIDE,
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { volume: -4.5, cutoff: 785, resonance: 0.75, attack: 0.5, release: 1.5, lowCut: 2 },
    },
    effects: [{ deviceId: 'haze', preset: 'Thin veil' }],
  },
  {
    id: 'hexatonic-poles-dimming-as-it-turns',
    name: 'Dimming as it turns',
    category: 'pad',
    description:
      'Strings that start bright and close while they are held, in slow waves of a reverb that breathes.',
    preview: E_AND_C_MINOR,
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.5, release: 2, envelope: -0.85 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Breathing' }],
  },
  {
    id: 'hexatonic-poles-warm-keys-at-dark',
    name: 'Warm keys at dark',
    category: 'keys',
    description:
      'Short warm keys that close quickly, gone through a reel of tape that drifts like a chorus.',
    preview: THREE_PAIRS,
    instrument: {
      deviceId: 'dusk',
      preset: 'Warm keys',
      params: { release: 0.5, envelope: 0.7, cutoff: 320 },
    },
    effects: [{ deviceId: 'tape', preset: 'Drifting chorus' }],
  },
]
