import { type FactoryPreset, type Phrase } from '../types'

// Notes with no beginning, on sixteen players. On each, the attack is taken away by the means that
// player has: magnets, a bow or a rubbing hand, breath, a volume pedal, a roll that starts at
// nothing, a reversed stroke, feedback, or a room heard without what was played in it. An entry
// takes from half a second to eight or ten, and some never end.

// One chord held for as long as it takes to arrive: A minor with its ninth, A E C E B from the bottom.
const HAIRPIN: Phrase = {
  notes: [
    { atSec: 0, durSec: 5.6, note: 45, gain: 0.5 },
    { atSec: 0, durSec: 5.6, note: 52, gain: 0.5 },
    { atSec: 0, durSec: 5.6, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 5.6, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 5.6, note: 71, gain: 0.5 },
  ],
}

// Three breaths with a silence between them: A minor ninth, D minor ninth, a suspended G with its ninth. The C is held in common and no voice moves more than a third, the bass aside.
const BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 45, gain: 0.55 },
    { atSec: 0, durSec: 1.9, note: 52, gain: 0.55 },
    { atSec: 0, durSec: 1.9, note: 60, gain: 0.55 },
    { atSec: 0, durSec: 1.9, note: 67, gain: 0.55 },
    { atSec: 0, durSec: 1.9, note: 71, gain: 0.55 },
    { atSec: 2.5, durSec: 1.9, note: 50, gain: 0.55 },
    { atSec: 2.5, durSec: 1.9, note: 53, gain: 0.55 },
    { atSec: 2.5, durSec: 1.9, note: 60, gain: 0.55 },
    { atSec: 2.5, durSec: 1.9, note: 64, gain: 0.55 },
    { atSec: 2.5, durSec: 1.9, note: 69, gain: 0.55 },
    { atSec: 5, durSec: 2, note: 43, gain: 0.55 },
    { atSec: 5, durSec: 2, note: 55, gain: 0.55 },
    { atSec: 5, durSec: 2, note: 60, gain: 0.55 },
    { atSec: 5, durSec: 2, note: 62, gain: 0.55 },
    { atSec: 5, durSec: 2, note: 69, gain: 0.55 },
  ],
}

// C E G held above, and the floor put under them a third lower each time: C major, A minor seventh, F major ninth without its third.
const FLOOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 60, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 64, gain: 0.5 },
    { atSec: 0, durSec: 7, note: 67, gain: 0.5 },
    { atSec: 0, durSec: 2.3, note: 48, gain: 0.55 },
    { atSec: 2.2, durSec: 2.4, note: 45, gain: 0.55 },
    { atSec: 4.5, durSec: 2.5, note: 41, gain: 0.55 },
  ],
}

// Two voices in a chain of 7-6 suspensions that closes on the octave: the voice that moves comes up out of nothing under or over the one that stays.
const SUSPENSIONS: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 76, gain: 0.6 },
    { atSec: 0.6, durSec: 1.6, note: 65, gain: 0.5 },
    { atSec: 1.4, durSec: 1.6, note: 74, gain: 0.6 },
    { atSec: 2.2, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 3, durSec: 1.6, note: 72, gain: 0.6 },
    { atSec: 3.8, durSec: 1.6, note: 62, gain: 0.5 },
    { atSec: 4.6, durSec: 0.8, note: 71, gain: 0.6 },
    { atSec: 5.4, durSec: 1.8, note: 60, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 72, gain: 0.6 },
  ],
}

// The same chain an octave down, for reeds and horns.
const SUSPENSIONS_LOW: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.4, note: 64, gain: 0.6 },
    { atSec: 0.6, durSec: 1.6, note: 53, gain: 0.5 },
    { atSec: 1.4, durSec: 1.6, note: 62, gain: 0.6 },
    { atSec: 2.2, durSec: 1.6, note: 52, gain: 0.5 },
    { atSec: 3, durSec: 1.6, note: 60, gain: 0.6 },
    { atSec: 3.8, durSec: 1.6, note: 50, gain: 0.5 },
    { atSec: 4.6, durSec: 0.8, note: 59, gain: 0.6 },
    { atSec: 5.4, durSec: 1.8, note: 48, gain: 0.5 },
    { atSec: 5.4, durSec: 1.8, note: 60, gain: 0.6 },
  ],
}

// A bare fifth on D that stays, the D two octaves up, and an E that arrives a tone above that D.
const SECOND: Phrase = {
  notes: [
    { atSec: 0, durSec: 7, note: 38, gain: 0.55 },
    { atSec: 0.4, durSec: 6.6, note: 45, gain: 0.5 },
    { atSec: 1.8, durSec: 5.2, note: 62, gain: 0.5 },
    { atSec: 3.4, durSec: 3.6, note: 64, gain: 0.5 },
  ],
}

// Four high notes in fourths turned over one another (E B A D), each still there when the next begins.
const QUARTAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.6, note: 76, gain: 0.6 },
    { atSec: 1.5, durSec: 2.6, note: 71, gain: 0.6 },
    { atSec: 3, durSec: 2.6, note: 81, gain: 0.55 },
    { atSec: 4.5, durSec: 2.6, note: 74, gain: 0.6 },
  ],
}

// A line in A minor with a key down every 1.2 s: what swells for that long lands on the next beat.
const ARRIVALS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.4, note: 57, gain: 0.6 },
    { atSec: 1.2, durSec: 2.4, note: 60, gain: 0.6 },
    { atSec: 2.4, durSec: 2.4, note: 64, gain: 0.6 },
    { atSec: 3.6, durSec: 2, note: 62, gain: 0.6 },
    { atSec: 4.8, durSec: 2, note: 59, gain: 0.6 },
  ],
}

// E minor seventh begun together and let go a voice at a time from the top.
const LETTING_GO: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.8, note: 67, gain: 0.6 },
    { atSec: 0, durSec: 3, note: 62, gain: 0.6 },
    { atSec: 0, durSec: 4.2, note: 59, gain: 0.6 },
    { atSec: 0, durSec: 5.4, note: 52, gain: 0.6 },
  ],
}

// A minor with its ninth entered a voice at a time from below.
const GATHER: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 57, gain: 0.55 },
    { atSec: 1.2, durSec: 5.6, note: 60, gain: 0.55 },
    { atSec: 2.4, durSec: 4.4, note: 64, gain: 0.55 },
    { atSec: 3.6, durSec: 3.2, note: 71, gain: 0.55 },
  ],
}

// Outer voices rising in tenths, D minor, C over E, F: what a foot on a volume pedal opens three times.
const TENTHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.1, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 2.1, note: 57, gain: 0.6 },
    { atSec: 0, durSec: 2.1, note: 65, gain: 0.6 },
    { atSec: 2.3, durSec: 2.1, note: 52, gain: 0.6 },
    { atSec: 2.3, durSec: 2.1, note: 60, gain: 0.6 },
    { atSec: 2.3, durSec: 2.1, note: 67, gain: 0.6 },
    { atSec: 4.6, durSec: 2.1, note: 53, gain: 0.6 },
    { atSec: 4.6, durSec: 2.1, note: 60, gain: 0.6 },
    { atSec: 4.6, durSec: 2.1, note: 69, gain: 0.6 },
  ],
}

// One wind, two long notes: A, and the D a fourth above it.
const SLOW_LINE: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 57, gain: 0.6 },
    { atSec: 3.4, durSec: 3.8, note: 62, gain: 0.6 },
  ],
}

// A held, and a D above it bent up a tone to E: an open fourth becomes a fifth, and the C that makes it minor comes last.
const STEEL: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 57, gain: 0.5 },
    { atSec: 0.5, durSec: 2.5, note: 62, gain: 0.55 },
    { atSec: 2.8, durSec: 4, note: 64, gain: 0.55 },
    { atSec: 4, durSec: 2.8, note: 72, gain: 0.5 },
  ],
}

// Two strings set to one pitch by the pedals, F with E sharp and then C with B sharp, whispered in turn from as soft as can be and back.
const BISBIGLIANDO: Phrase = {
  notes: [
    { atSec: 0, durSec: 0.3, note: 65, gain: 0.2 },
    { atSec: 0.12, durSec: 0.3, note: 65.05, gain: 0.22 },
    { atSec: 0.24, durSec: 0.3, note: 65, gain: 0.26 },
    { atSec: 0.36, durSec: 0.3, note: 65.05, gain: 0.3 },
    { atSec: 0.48, durSec: 0.3, note: 65, gain: 0.35 },
    { atSec: 0.6, durSec: 0.3, note: 65.05, gain: 0.4 },
    { atSec: 0.72, durSec: 0.3, note: 65, gain: 0.46 },
    { atSec: 0.84, durSec: 0.3, note: 65.05, gain: 0.51 },
    { atSec: 0.96, durSec: 0.3, note: 65, gain: 0.56 },
    { atSec: 1.08, durSec: 0.3, note: 65.05, gain: 0.6 },
    { atSec: 1.2, durSec: 0.3, note: 65, gain: 0.64 },
    { atSec: 1.32, durSec: 0.3, note: 65.05, gain: 0.67 },
    { atSec: 1.44, durSec: 0.3, note: 65, gain: 0.69 },
    { atSec: 1.56, durSec: 0.3, note: 65.05, gain: 0.7 },
    { atSec: 1.68, durSec: 0.3, note: 65, gain: 0.7 },
    { atSec: 1.8, durSec: 0.3, note: 65.05, gain: 0.69 },
    { atSec: 1.92, durSec: 0.3, note: 65, gain: 0.67 },
    { atSec: 2.04, durSec: 0.3, note: 65.05, gain: 0.64 },
    { atSec: 2.16, durSec: 0.3, note: 65, gain: 0.6 },
    { atSec: 2.28, durSec: 0.3, note: 65.05, gain: 0.56 },
    { atSec: 2.4, durSec: 0.3, note: 65, gain: 0.51 },
    { atSec: 2.52, durSec: 0.3, note: 65.05, gain: 0.46 },
    { atSec: 2.64, durSec: 0.3, note: 65, gain: 0.4 },
    { atSec: 2.76, durSec: 0.3, note: 65.05, gain: 0.35 },
    { atSec: 2.88, durSec: 0.3, note: 65, gain: 0.3 },
    { atSec: 3, durSec: 0.3, note: 65.05, gain: 0.26 },
    { atSec: 3.12, durSec: 0.3, note: 65, gain: 0.22 },
    { atSec: 3.24, durSec: 0.3, note: 65.05, gain: 0.2 },
    { atSec: 3.45, durSec: 0.3, note: 72, gain: 0.2 },
    { atSec: 3.57, durSec: 0.3, note: 72.05, gain: 0.22 },
    { atSec: 3.69, durSec: 0.3, note: 72, gain: 0.26 },
    { atSec: 3.81, durSec: 0.3, note: 72.05, gain: 0.3 },
    { atSec: 3.93, durSec: 0.3, note: 72, gain: 0.35 },
    { atSec: 4.05, durSec: 0.3, note: 72.05, gain: 0.4 },
    { atSec: 4.17, durSec: 0.3, note: 72, gain: 0.46 },
    { atSec: 4.29, durSec: 0.3, note: 72.05, gain: 0.51 },
    { atSec: 4.41, durSec: 0.3, note: 72, gain: 0.56 },
    { atSec: 4.53, durSec: 0.3, note: 72.05, gain: 0.6 },
    { atSec: 4.65, durSec: 0.3, note: 72, gain: 0.64 },
    { atSec: 4.77, durSec: 0.3, note: 72.05, gain: 0.67 },
    { atSec: 4.89, durSec: 0.3, note: 72, gain: 0.69 },
    { atSec: 5.01, durSec: 0.3, note: 72.05, gain: 0.7 },
    { atSec: 5.13, durSec: 0.3, note: 72, gain: 0.7 },
    { atSec: 5.25, durSec: 0.3, note: 72.05, gain: 0.69 },
    { atSec: 5.37, durSec: 0.3, note: 72, gain: 0.67 },
    { atSec: 5.49, durSec: 0.3, note: 72.05, gain: 0.64 },
    { atSec: 5.61, durSec: 0.3, note: 72, gain: 0.6 },
    { atSec: 5.73, durSec: 0.3, note: 72.05, gain: 0.56 },
    { atSec: 5.85, durSec: 0.3, note: 72, gain: 0.51 },
    { atSec: 5.97, durSec: 0.3, note: 72.05, gain: 0.46 },
    { atSec: 6.09, durSec: 0.3, note: 72, gain: 0.4 },
    { atSec: 6.21, durSec: 0.3, note: 72.05, gain: 0.35 },
    { atSec: 6.33, durSec: 0.3, note: 72, gain: 0.3 },
    { atSec: 6.45, durSec: 0.3, note: 72.05, gain: 0.26 },
    { atSec: 6.57, durSec: 0.3, note: 72, gain: 0.22 },
    { atSec: 6.69, durSec: 0.3, note: 72.05, gain: 0.2 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Magnet piano: the string fed until it sounds, from half a second to never done.
  {
    id: 'from-nothing-string-asked-to-sing',
    name: 'String asked to sing',
    category: 'keys',
    description:
      'A piano string brought up in one second by magnets on its own pitch, with much of the soundboard, on a medium plate.',
    preview: SUSPENSIONS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Glass swell',
      params: { bloom: 1, bright: 0.12, shimmer: 0.12, body: 0.85, damper: 0.9 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-octave-node-waking',
    name: 'Octave node waking',
    category: 'pad',
    description:
      'Magnets on the second harmonic take two seconds, the other held strings ring along, and a tape that drifts carries them to a hall.',
    preview: FLOOR,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { volume: -12.5, bloom: 2, bright: 0.4, damper: 5, shimmer: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-twelfth-in-four-seconds',
    name: 'Twelfth in four seconds',
    category: 'pad',
    description:
      'The twelfth of each string comes first, over four seconds, while slow tides lift and lower parts of the chord, in a late hall.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { bloom: 4, bright: 0.45, sweep: 0.2, damper: 3, width: 0.9 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'from-nothing-bass-wire-at-eight',
    name: 'Bass wire at eight',
    category: 'drone',
    description:
      'Low strings with all their harmonics fed, up to full in eight seconds, lifted a little where they are quiet and held just under water.',
    preview: SECOND,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Low magnets',
      params: { bloom: 8, bright: 1, body: 1, shimmer: 0.3, volume: -16.5 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Slow tide', params: { amount: 0.4, limit: 8 } },
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0 } },
    ],
  },
  {
    id: 'from-nothing-never-quite-here',
    name: 'Never quite here',
    category: 'drone',
    description:
      'Ten seconds to a full note, the fed harmonic wandering all the way, caught as it rises and kept up by an endless hold.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Overtone choir',
      params: {
        bloom: 10,
        harmonic: 5,
        sweep: 1,
        sweepRate: 0.05,
        bright: 0.5,
        damper: 8,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { mix: 0.6, sensitivity: 0.8 } },
    ],
  },
  {
    id: 'from-nothing-bowed-tumbler-rim',
    name: 'Bowed tumbler rim',
    category: 'keys',
    description:
      'The quickest string here, half a second to glass with no soundboard, turned by a slow horn and drum.',
    preview: SUSPENSIONS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { volume: -12, bloom: 0.5, bright: 0.5, shimmer: 0, damper: 0.35, width: 0.2 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.8 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'from-nothing-whistle-on-a-far-shore',
    name: 'Whistle on a far shore',
    category: 'texture',
    description:
      'Only the eighth harmonic, a whistle that needs a second and a half, with thin repeats and all of it far off.',
    preview: GATHER,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'High whistle',
      params: { volume: -10.5, bloom: 1.6, shimmer: 0.4, damper: 2.5, width: 1 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.35 } },
      { deviceId: 'distance', preset: 'Far shore' },
    ],
  },
  {
    id: 'from-nothing-magnets-under-the-floor',
    name: 'Magnets under the floor',
    category: 'bass',
    description:
      'Low strings fed on their own pitch for a second and a quarter, warmed by a transformer, the octave below joining late.',
    preview: SECOND,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Still sine',
      params: { volume: -19, bloom: 1.3, bright: 0.35, body: 0.6, damper: 0.5 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { attack: 0.8, sub1: 0.5 } },
      { deviceId: 'analog-drive', preset: 'Iron lows' },
    ],
  },
  {
    id: 'from-nothing-sway-comes-after',
    name: 'Sway comes after',
    category: 'keys',
    description:
      'The sixth harmonic with a wide neighbourhood rises in three seconds straight, then a vibrato grows on what has arrived.',
    preview: GATHER,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Wide shimmer',
      params: { bloom: 3, harmonic: 6, bright: 0.75, shimmer: 0.1, body: 0.5, damper: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Long patience', params: { depth: 30 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-reed-with-no-tongue',
    name: 'Reed with no tongue',
    category: 'voice',
    description:
      'A buzzing string that takes almost a second, its top moved by a slow low-pass, its tail sung back as a round oo.',
    preview: BREATHS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { volume: -13, bloom: 0.9, bright: 0.9, body: 0.8, shimmer: 0.35, damper: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 2200, lfoAmount: 10 },
      },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.45 } },
    ],
  },

  // Rewind: the stroke turned round, so that it ends on what it should have begun with.
  {
    id: 'from-nothing-hammer-arrives-last',
    name: 'Hammer arrives last',
    category: 'keys',
    description:
      'A reversed piano note over 1.2 s that lands with no surge and rings on forwards, in a room with a warm low end.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Soft return',
      params: { volume: 2, swell: 1.2, snap: 0, tone: 0.45, tail: 0.75, ghost: 0.1, wobble: 0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'from-nothing-hover-till-let-go',
    name: 'Hover till let go',
    category: 'keys',
    description:
      'A cassette of a piano that hovers for as long as the key is down and is cut off as it lands; a little spring catches the end.',
    preview: LETTING_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Let go',
      params: {
        volume: 0,
        swell: 0.9,
        snap: 0,
        tail: 0,
        tone: 0.6,
        ghost: 0.5,
        rise: 0.6,
        shimmer: 0,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-stroke-owed-to-a-bell',
    name: 'Stroke owed to a bell',
    category: 'bell',
    description:
      'Two beating bells run backwards for two and a half seconds into a smooth arrival, small lights moving among the partials.',
    preview: GATHER,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bell arrival',
      params: { volume: 6, swell: 2.5, snap: 0, shimmer: 0.85, rise: 0.2, tone: 0.7 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'from-nothing-tower-drawn-inward',
    name: 'Tower drawn inward',
    category: 'bell',
    description:
      'A dark bell hovering in its own backwards room while it is held, its echoes going two hertz sharp on one side and flat on the other.',
    preview: LETTING_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Beating bells',
      params: { volume: 1, swell: 4, ghost: 1, tone: 0.2, shimmer: 0.3, snap: 0, tail: 1 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Parting echo', params: { shift: 2, mix: 0.35 } },
    ],
  },
  {
    id: 'from-nothing-pluck-drawn-home',
    name: 'Pluck drawn home',
    category: 'plucked',
    description:
      'Short plucked strings turned round, a second of climb and then nothing, repeated by a dark delay with chorus on its echoes.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'rewind',
      preset: 'Pluck back',
      params: { volume: 3, swell: 1, snap: 0.15, rise: 0.85, tail: 0, tone: 0.85 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 600, mix: 0.4, feedback: 0.35 },
      },
    ],
  },
  {
    id: 'from-nothing-far-hand-unplucking',
    name: 'Far hand unplucking',
    category: 'plucked',
    description:
      'Wide pairs of reversed strings that gather for five seconds under the key, thickened by a slow three-voice ensemble.',
    preview: LETTING_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Wide drift',
      params: {
        volume: 6,
        swell: 5,
        rise: 0.1,
        ghost: 0.2,
        tone: 0.4,
        shimmer: 1,
        tail: 0.6,
        snap: 0,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'from-nothing-bowl-long-in-coming',
    name: 'Bowl long in coming',
    category: 'drone',
    description:
      'A bowl run backwards for eight seconds, its partials early and even, on a worn loop of tape that opens wide at the top.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'rewind',
      preset: 'Bowl gather',
      params: { swell: 8, rise: 0.12, ghost: 0.9, tone: 0.8, wobble: 0.4, volume: 5.5 },
    },
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { mix: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'from-nothing-bowl-inside-a-jar',
    name: 'Bowl inside a jar',
    category: 'bell',
    description:
      'A bowl that climbs for just over a second and hovers until it is let go, heard from inside a clay body, ranks of pipes coming up behind it.',
    preview: LETTING_GO,
    instrument: {
      deviceId: 'rewind',
      preset: 'Held bowl',
      params: {
        volume: 2.5,
        swell: 1.2,
        rise: 0.4,
        ghost: 0.3,
        tone: 0.55,
        shimmer: 0,
        tail: 0.5,
        snap: 0.1,
      },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } },
      { deviceId: 'stops', preset: 'Slow bloom', params: { mix: 0.5 } },
    ],
  },

  // Afterglow: strike at zero, only what the stroke would have left behind.
  {
    id: 'from-nothing-overtones-no-hammer',
    name: 'Overtones, no hammer',
    category: 'pad',
    description:
      'A felt piano without its hammer: the overtones alone come up over six seconds and change slowly, on a worn tape in a dark room.',
    preview: FLOOR,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { source: 0, strike: 0, glow: 1, bloom: 6, tone: 0.4, evolve: 0.5, halo: 0.05 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-carillon-of-haloes',
    name: 'Carillon of haloes',
    category: 'bell',
    description:
      'Bell overtones with the stroke left out, two seconds up with an octave halo over them, in a tail that climbs by fifths and octaves.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: {
        volume: -14.5,
        strike: 0,
        glow: 0.9,
        bloom: 2,
        fade: 3,
        tone: 0.75,
        halo: 0.8,
        drift: 0.1,
      },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.4 } }],
  },
  {
    id: 'from-nothing-string-left-no-finger',
    name: 'String, left no finger',
    category: 'string',
    description:
      'A plucked string minus the finger, up in a second, still, bright and thin, a slow six-stage sweep moving through it.',
    preview: SUSPENSIONS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Pluck and haze',
      params: {
        strike: 0,
        glow: 1,
        bloom: 1,
        fade: 0.8,
        tone: 0.85,
        halo: 0,
        evolve: 0,
        drift: 0,
        width: 0.3,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.45 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },
  {
    id: 'from-nothing-glass-fog-on-a-pane',
    name: 'Glass fog on a pane',
    category: 'texture',
    description:
      'Glass partials that beat deeply against themselves, four seconds to appear, all of it inside a wide and thin space.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: {
        strike: 0,
        glow: 0.9,
        bloom: 4,
        fade: 5,
        tone: 0.6,
        halo: 0,
        evolve: 0.2,
        drift: 1,
        width: 1,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.45, decay: 7 } }],
  },
  {
    id: 'from-nothing-felt-without-a-key',
    name: 'Felt without a key',
    category: 'organ',
    description:
      'A dark felt glow up in under a second, with organ ranks that speak half a second after it.',
    preview: BREATHS,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Dark felt',
      params: {
        volume: -18.5,
        strike: 0,
        glow: 1,
        bloom: 0.8,
        fade: 0.6,
        tone: 0.08,
        evolve: 0.1,
        width: 0.8,
      },
    },
    effects: [
      {
        deviceId: 'stops',
        preset: 'Principal chorus',
        params: { speak: 600, chiff: 0, mix: 0.55 },
      },
    ],
  },
  {
    id: 'from-nothing-bell-metal-at-low-tide',
    name: 'Bell metal at low tide',
    category: 'drone',
    description:
      'Low bell partials with the blow removed take twelve seconds, on a loop that a room colours a little more each pass.',
    preview: SECOND,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Low tide bell',
      params: { strike: 0, glow: 1, bloom: 12, fade: 12, tone: 0.5, evolve: 1, volume: -6.5 },
    },
    effects: [{ deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.45 } }],
  },
  {
    id: 'from-nothing-harp-cloud-in-gates',
    name: 'Harp cloud in gates',
    category: 'plucked',
    description:
      'Plucked overtones with a full octave shimmer rise for three seconds through two soft gates that drift apart.',
    preview: GATHER,
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: {
        volume: -15,
        strike: 0,
        glow: 0.9,
        bloom: 3,
        fade: 4,
        tone: 0.7,
        halo: 1,
        drift: 0.4,
      },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Soft throb', params: { floor: 0.4, drift: 0.5, apart: 1 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // Zither: rolls from nothing, the board turned round, and the open strings heard without the hand.
  {
    id: 'from-nothing-dulcimer-roll-rising',
    name: 'Dulcimer roll rising',
    category: 'string',
    description:
      'Dulcimer hammers rolling fourteen times a second on dull strings, blunted and opened from silence over two and a half seconds.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { chord: 0, roll: 14, brightness: 0.2, release: 8, position: 0.3, strum: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2500 } },
      { deviceId: 'fog', preset: 'Pad softener', params: { size: 50 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-board-read-from-its-end',
    name: 'Board read from its end',
    category: 'plucked',
    description:
      'Short picked strings played back to front in pieces of over a second, with nothing of the forward sound left.',
    preview: TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -3.5, decay: 2.2, sympathy: 0.4, brightness: 0.75 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards only',
        params: { time: 1300, smooth: 0.7, spread: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'from-nothing-harp-box-on-a-bow',
    name: 'Harp box on a bow',
    category: 'string',
    description:
      'Finger-plucked octaves caught and held with the pluck left out, a second to come in, spread by an ensemble and rocked between low and high.',
    preview: TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { volume: -10.5, exciter: 0, brightness: 0.35, sympathy: 0.2, decay: 8 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 1, decay: 4, glide: 0.8, motion: 0.5, ensemble: 0.8 },
      },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.35 } },
    ],
  },
  {
    id: 'from-nothing-open-strings-only',
    name: 'Open strings only',
    category: 'string',
    description:
      'Each pick is faded in over most of a second, and sixteen strings that have learned the tune ring in its place.',
    preview: GATHER,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { volume: 3.5, chord: 0, brightness: 0.8, sympathy: 1, courses: 0.8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 800 } },
      { deviceId: 'sympathetic', preset: 'Learn and hold', params: { mix: 0.75 } },
    ],
  },
  {
    id: 'from-nothing-shadow-of-the-bridge',
    name: 'Shadow of the bridge',
    category: 'texture',
    description:
      'The strings are unheard: the ten strongest partials are redrawn as wide sines that swell in and hang behind.',
    preview: TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: 6, chord: 2, decay: 7, release: 3, sympathy: 0.4, strum: 40 },
    },
    effects: [
      {
        deviceId: 'sine-shadow',
        preset: 'Shadow alone',
        params: { partials: 10, attack: 4000, release: 3, spread: 0.8, tone: 0.65 },
      },
    ],
  },
  {
    id: 'from-nothing-chord-bar-dissolved',
    name: 'Chord bar dissolved',
    category: 'pad',
    description:
      'A suspended second on every key, strummed slowly, faded in over a second and smeared past telling strings apart, a notch moving.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: { volume: -1, chord: 5, strum: 600, brightness: 0.6, sympathy: 0.3, release: 4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1000 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Pad from anything',
        params: { blur: 0.75, shimmer: 0.1 },
      },
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'from-nothing-psaltery-in-a-cloud',
    name: 'Psaltery in a cloud',
    category: 'string',
    description:
      'A bright picked psaltery whose strokes are turned down and blurred into nearly half a second of cloud, then held up by a slow hand.',
    preview: SUSPENSIONS,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: {
        volume: -1.5,
        chord: 0,
        decay: 12,
        release: 1.2,
        sympathy: 0.2,
        brightness: 0.9,
        position: 0.12,
        courses: 0.5,
      },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 400, layers: 2 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 8 } },
    ],
  },

  // Electric guitar: the foot on the pedal, the amplifier, and the tape turned over.
  {
    id: 'from-nothing-heel-to-toe-in-three',
    name: 'Heel to toe in three',
    category: 'string',
    description:
      'A soft finger at the neck end of the string, faded in over three seconds by the pedal, into the dark spring of an amplifier.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: {
        volume: 6,
        hardness: 0.1,
        swell: 3,
        strum: 0,
        position: 0.35,
        pickup: 1,
        tone: 2600,
        shimmer: 0.2,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.3 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 8 } },
    ],
  },
  {
    id: 'from-nothing-twelve-strings-no-pick',
    name: 'Twelve strings, no pick',
    category: 'string',
    description:
      'A fast-beating bright chime whose pick is hidden by one second of pedal, doubled a little late on both sides.',
    preview: TENTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: {
        volume: 3.5,
        swell: 1,
        strum: 0,
        shimmer: 1.5,
        tone: 5500,
        sustain: 14,
        warmth: 0.05,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 14 } },
    ],
  },
  {
    id: 'from-nothing-amplifier-sings-first',
    name: 'Amplifier sings first',
    category: 'texture',
    description:
      'Warm strings let in over half a second, and the amplifier feeding on them until its own overtone is most of what is heard.',
    preview: GATHER,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thick growl',
      params: {
        volume: 6,
        swell: 0.6,
        strum: 0,
        shimmer: 0.2,
        sustain: 30,
        tone: 2800,
        warmth: 0.8,
      },
    },
    effects: [
      { deviceId: 'howl', preset: 'Takes over', params: { edge: 0.15, mix: 0.65, follow: 0.4 } },
      { deviceId: 're-amp', preset: 'Warm stack', params: { room: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-tape-flipped-on-chords',
    name: 'Tape flipped on chords',
    category: 'texture',
    description:
      'Hard bridge picking taken apart into reversed grains a third of a second long and nothing of it left the right way round.',
    preview: TENTHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { volume: 5.5, swell: 0.2, sustain: 5, hardness: 1 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Backwards room',
        params: { mix: 1, size: 340, density: 22, texture: 0, feedback: 0.4 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1, output: 6 } },
    ],
  },
  {
    id: 'from-nothing-neck-pickup-on-a-wheel',
    name: 'Neck pickup on a wheel',
    category: 'organ',
    description:
      'Round neck tone opened over a second and a half, in front of a fast turning speaker that drives a little, close to an organ.',
    preview: BREATHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { volume: 5.5, swell: 1.5, strum: 0, sustain: 25, tone: 1900, shimmer: 0.05 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Guitar swirl', params: { mix: 0.9 } }],
  },
  {
    id: 'from-nothing-wall-with-no-door',
    name: 'Wall with no door',
    category: 'pad',
    description:
      'Chords let in over nearly a second and kept only as a fuzzed and blurred wall, with no string in front of it.',
    preview: BREATHS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Warm breakup',
      params: { volume: 2, swell: 0.8, strum: 0, sustain: 20, tone: 3600 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wall alone', params: { decay: 4, haze: 0.45 } }],
  },
  {
    id: 'from-nothing-thread-of-bridge-wire',
    name: 'Thread of bridge wire',
    category: 'string',
    description:
      'Thin strings read at the bridge, in over more than a second, evened by a slow hand and trailing dub repeats that darken.',
    preview: STEEL,
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: {
        volume: 6,
        pickup: 0,
        position: 0.05,
        swell: 2,
        sustain: 30,
        tone: 5500,
        shimmer: 0.1,
        strum: 0,
        warmth: 0.4,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 19, attack: 20 } },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { mix: 0.35, feedback: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Thin' },
    ],
  },

  // Acoustic guitar: no pedal of its own, so each is taken away by something that comes after it.
  {
    id: 'from-nothing-nylon-under-a-thumb',
    name: 'Nylon under a thumb',
    category: 'plucked',
    description:
      'Nylon strings under a pedal rocked late: every note is closed and opens over seven tenths of a second, its ring held up, in a room.',
    preview: SUSPENSIONS_LOW,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: 0.5, type: 1, sustain: 9, release: 2, tone: 0.6, strum: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 700, sensitivity: -62 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'from-nothing-tremolo-out-of-the-hush',
    name: 'Tremolo out of the hush',
    category: 'plucked',
    description:
      'A nylon string repeated fast, each stroke blunted, opened once from silence over a second and a half, inside a dark plate.',
    preview: BISBIGLIANDO,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { nail: 0.35, position: 0.2, sustain: 12, release: 5, tone: 0.7 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Tide',
        params: { attack: 1600, curve: 0.45, sensitivity: -62, lookahead: 20 },
      },
      { deviceId: 'fog', preset: 'Pad softener' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'from-nothing-steel-after-the-fact',
    name: 'Steel after the fact',
    category: 'string',
    description:
      'Only what has lasted a third of a second is let through, and that is faded in, so a steel string is heard without its stroke.',
    preview: TENTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: 3, sustain: 12, nail: 0.6, tone: 0.8, strum: 0 },
    },
    effects: [
      {
        deviceId: 'common-tones',
        preset: 'Only what stays',
        params: { ago: 330, ring: 0.6, strict: 0.6 },
      },
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 700, sensitivity: -55 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'from-nothing-body-an-octave-slower',
    name: 'Body an octave slower',
    category: 'pad',
    description:
      'A big-bodied guitar at half speed, an octave down, each stroke faded in over six tenths of a second before it is slowed.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: 6, sustain: 10, tone: 0.55, body: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 600, curve: 0.6 } },
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { jitter: 0.3 } },
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 8 } },
    ],
  },
  {
    id: 'from-nothing-twelve-string-vapour',
    name: 'Twelve-string vapour',
    category: 'pad',
    description:
      'Twelve strings with their strokes fogged over, then read five times slower at their own pitch, the bright cloud by itself.',
    preview: BREATHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { volume: 1, tone: 0.75, strum: 40 },
    },
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { size: 500, layers: 3 } },
      { deviceId: 'stretch', preset: 'Cloud alone', params: { stretch: 5, tone: 0.3, memory: 4 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'from-nothing-players-behind-a-door',
    name: 'Players behind a door',
    category: 'string',
    description:
      'A plucked chord that is never heard: a section of strings comes up after it, in a second and a half, and takes its place.',
    preview: BREATHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: 0, strum: 60, sustain: 6, release: 1 },
    },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Pad alone',
        params: {
          rise: 1.5,
          fall: 2,
          brightness: 2200,
          octaves: -0.4,
          ensemble: 0.9,
          sensitivity: 0.9,
        },
      },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 16 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
    ],
  },
  {
    id: 'from-nothing-mirror-on-the-rosette',
    name: 'Mirror on the rosette',
    category: 'plucked',
    description:
      'Bare strings turned round in pieces of nine tenths of a second and heard an octave up, pressed flat, in a room.',
    preview: TENTHS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: {
        volume: -9.5,
        sustain: 9,
        release: 8,
        shimmer: 0.2,
        nail: 0.2,
        tone: 0.6,
        position: 0.25,
      },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { mix: 1, feedback: 0.25, smooth: 1, tone: 7000 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // Mallets: the roll that starts at nothing, the bow on the bar, and the room with no bar in it.
  {
    id: 'from-nothing-wood-hum-appears',
    name: 'Wood hum appears',
    category: 'bell',
    description:
      'Yarn on a marimba, rolling thirteen times a second and opened over two and a half seconds: no stroke, only the tubes.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { mallet: 0.05, roll: 13, resonator: 0.9, decay: 2.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Bowed entries', params: { hold: 0.35 } },
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2500 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-bow-across-the-bar',
    name: 'Bow across the bar',
    category: 'bell',
    description:
      'Long vibraphone bars with every stroke taken off and a bow-like second put in its place, the motor turning slowly.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'mallets',
      preset: 'Slow pulse vibes',
      params: {
        volume: -2,
        mallet: 0.3,
        decay: 4,
        motor: 0.4,
        motorRate: 1.4,
        resonator: 0.4,
        damper: 0.6,
      },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Slow bow',
        params: { attack: 1000, lookahead: 20, sensitivity: -50 },
      },
      { deviceId: 'spread', preset: 'Tight shimmer' },
    ],
  },
  {
    id: 'from-nothing-rosewood-in-bloom',
    name: 'Rosewood in bloom',
    category: 'texture',
    description:
      'A fast xylophone roll heard only as a room that swells and fades and leaves the bars out, panned slowly from side to side.',
    preview: GATHER,
    instrument: {
      deviceId: 'mallets',
      preset: 'Xylophone roll',
      params: { mallet: 0.1, roll: 16, decay: 3 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Bloom',
        params: { mix: 1, time: 1.8, tail: 0.3, colour: 0.2 },
      },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'from-nothing-glockenspiel-unhit',
    name: 'Glockenspiel unhit',
    category: 'bell',
    description:
      'Glockenspiel bars sent whole into a huge room that answers late and swells, with nothing dry in front.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { volume: 4.5, mallet: 0.2, decay: 0.8 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Wash alone',
        params: { gravity: 1, size: 1, decay: 9, modDepth: 0.4, highCut: 12000 },
      },
    ],
  },
  {
    id: 'from-nothing-celesta-seen-in-water',
    name: 'Celesta seen in water',
    category: 'keys',
    description:
      'Celesta plates turned backwards in pieces of seven tenths of a second, then wavering as if just under the surface.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'mallets',
      preset: 'Open celesta',
      params: { volume: -7, decay: 1.2, mallet: 0.35 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { mix: 1, time: 700, feedback: 0.3, smooth: 1 },
      },
      { deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0 } },
    ],
  },
  {
    id: 'from-nothing-tubes-sounding-alone',
    name: 'Tubes sounding alone',
    category: 'bell',
    description:
      'Soft marimba, its strokes sifted out and its tones ringing on, eased in over a second, blurred, with one and two octaves above.',
    preview: SECOND,
    instrument: {
      deviceId: 'mallets',
      preset: 'Humming marimba',
      params: { volume: -4.5, decay: 4, mallet: 0, width: 0.8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Bowed entries', params: { hold: 0.75 } },
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1200, retrigger: 1 } },
      { deviceId: 'fog', preset: 'No attack', params: { size: 350 } },
      { deviceId: 'octaves', preset: 'Slow halo' },
    ],
  },

  // Bells: rubbed, stroked and bowed.
  {
    id: 'from-nothing-thumb-round-the-bowl',
    name: 'Thumb round the bowl',
    category: 'bell',
    description:
      'A bowl rubbed and never struck, its low tone up in its own time, a bank of fifths answering and all of it circling.',
    preview: SECOND,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed bowl',
      params: { hardness: 0, brightness: 0.25, detune: 0.3, release: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 500, depth: 1 } },
      { deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, strike: 0.1, mix: 0.25 } },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'from-nothing-wet-finger-on-a-rim',
    name: 'Wet finger on a rim',
    category: 'bell',
    description:
      'A row of glasses stroked and held, half a second in, the pitch beginning to sway once each note stands.',
    preview: SUSPENSIONS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: { hardness: 0, sustain: 1, detune: 0.5, damping: 0.5, release: 0.6, brightness: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 500 } },
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'from-nothing-horsehair-and-steel',
    name: 'Horsehair and steel',
    category: 'bell',
    description:
      'Chime bars bowed for as long as the key is down, let in over eight tenths of a second, with a hollow standing comb on them.',
    preview: GATHER,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: {
        volume: -9.5,
        sustain: 1,
        hardness: 0.15,
        damping: 0.1,
        brightness: 0.9,
        release: 0.35,
        decay: 10,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 800, curve: 0.8 } },
      { deviceId: 'flanger', preset: 'Standing comb', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-rubber-ball-on-a-gong',
    name: 'Rubber ball on a gong',
    category: 'drone',
    description:
      'A large gong dragged into sound over two seconds, its overtones crowded together, with a slow flock of copies about it.',
    preview: SECOND,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Rubbed gong',
      params: { hardness: 0, stretch: 0.7, brightness: 0.55, decay: 30 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 2000, curve: 0.4 } },
      { deviceId: 'murmuration', preset: 'Slow drift' },
    ],
  },
  {
    id: 'from-nothing-church-with-no-clapper',
    name: 'Church with no clapper',
    category: 'bell',
    description:
      'A church bell opened from nothing over four seconds, its partials stretched a little apart and drifting.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Bowed bell',
      params: { sustain: 1, hardness: 0, decay: 30, brightness: 0.6, release: 0 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { mix: 1, curve: 0.4 } },
      { deviceId: 'warp', preset: 'Slow breath' },
    ],
  },
  {
    id: 'from-nothing-tines-without-thumbs',
    name: 'Tines without thumbs',
    category: 'plucked',
    description:
      'A thumb piano whose plucks are faded in over four tenths of a second and then come back from a murky delay.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -4, decay: 9, damping: 0.5, sustain: 0.5, hardness: 0.35, release: 0.1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 450, curve: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 400, mix: 0.4 } },
    ],
  },

  // Prepared piano: the objects on the strings, sounded by no hammer.
  {
    id: 'from-nothing-bolts-hum-unstruck',
    name: 'Bolts hum, unstruck',
    category: 'bell',
    description:
      'Bolts that would be gongs, faded in over a second and a half, in a slow three-voice drift, and lifted by a limiter that lets go slowly.',
    preview: GATHER,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Temple gongs',
      params: { volume: 3.5, thud: 0, rattle: 0.1, hammer: 0.35, decay: 4 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'First note only',
        params: { attack: 1500, retrigger: 0, curve: 0.5, lookahead: 20 },
      },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { gain: 10 } },
    ],
  },
  {
    id: 'from-nothing-paper-over-a-magnet',
    name: 'Paper over a magnet',
    category: 'string',
    description:
      'Paper buzzing on the strings is caught and held, the strike left out, two seconds to full, with some triode warmth.',
    preview: TENTHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { thud: 0, rattle: 0.8, decay: 3, hammer: 0.4 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 2, decay: 1.5, motion: 0.2, ensemble: 0, tone: 0.3, sensitivity: 0.7 },
      },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { mix: 0.6 } },
    ],
  },
  {
    id: 'from-nothing-rubber-run-backwards',
    name: 'Rubber run backwards',
    category: 'plucked',
    description:
      'Woody thunks that all end where they began: reversed grains of two thirds of a second, in a small wooden body.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Soft rubber',
      params: { thud: 0.1, decay: 2.5, tone: 0.9 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Slow smear',
        params: {
          mix: 1,
          size: 650,
          reverse: 1,
          density: 12,
          scatter: 0.05,
          feedback: 0.2,
          spray: 0.15,
        },
      },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: 7 } },
    ],
  },
  {
    id: 'from-nothing-felt-strips-trembling',
    name: 'Felt strips trembling',
    category: 'keys',
    description:
      'Felt-muted keys repeated as fast as they come back, blurred and opened from nothing over a second and a half into a breathing room.',
    preview: BISBIGLIANDO,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { volume: -1, thud: 0, hammer: 0.2, decay: 4 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Sunrise',
        params: { attack: 1600, curve: 0.45, sensitivity: -62, lookahead: 20 },
      },
      { deviceId: 'fog', preset: 'Pad softener', params: { size: 90 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 4, mix: 0.4 } },
    ],
  },
  {
    id: 'from-nothing-every-object-at-once',
    name: 'Every object at once',
    category: 'texture',
    description:
      'A differently prepared string on every key, faded in and dissolved into a wash in which metal, paper and rubber are one.',
    preview: BREATHS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Small orchestra',
      params: { volume: 1, amount: 0.9, thud: 0, decay: 2.5, rattle: 0.6, tone: 1 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 600 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 1, blur: 0.8 } },
    ],
  },
  {
    id: 'from-nothing-tin-in-a-turned-room',
    name: 'Tin in a turned room',
    category: 'bell',
    description:
      'Tin chimes heard as a room that climbs for a second and a half and cuts, with no chime, through a small radio.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Tin chimes',
      params: { volume: 4, thud: 0, decay: 1, hammer: 0.6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 1, time: 1.5, tail: 0.15 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0 } },
    ],
  },

  // Horns: breath before lips.
  {
    id: 'from-nothing-horn-over-the-ridge',
    name: 'Horn over the ridge',
    category: 'wind',
    description:
      'One quiet horn that takes a second and a half to each note and is heard from the back of a hall.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: 1, blow: 0.3, breath: 0.1, attack: 1.5, release: 2.2, vibrato: 0 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'from-nothing-air-then-a-horn',
    name: 'Air, then a horn',
    category: 'wind',
    description:
      'Breath through the tube with hardly a note in it, two seconds in and fewer out, the room around it whispering back with its top brought up.',
    preview: BREATHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 2, release: 1.5, blow: 0.12, section: 0.7 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.5 } },
      { deviceId: 'lift', preset: 'Air on top' },
    ],
  },
  {
    id: 'from-nothing-low-brass-six-seconds',
    name: 'Low brass, six seconds',
    category: 'wind',
    description:
      'A choir of low brass that takes six seconds over every note, with iron in its lows and the bass held in the middle.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 6, release: 3, blow: 0.75 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      { deviceId: 'spread', preset: 'Firm bass' },
    ],
  },
  {
    id: 'from-nothing-mute-at-the-window',
    name: 'Mute at the window',
    category: 'wind',
    description:
      'A muted trumpet, a second in and a second out, half of it through a distant station, with a wobbling tape double.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: 0.5, attack: 1, release: 1, blow: 0.35, breath: 0.4 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Distant station', params: { noise: 0.1, mix: 0.6 } },
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-flugels-rise-in-fifths',
    name: 'Flugels rise in fifths',
    category: 'wind',
    description:
      'Flugelhorns doubled a fifth above take four seconds to a full chord and as long to leave it, set a few cents apart.',
    preview: FLOOR,
    instrument: {
      deviceId: 'horns',
      preset: 'Open fifths pad',
      params: { attack: 4, release: 4, blow: 0.5, breath: 0.35 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'from-nothing-brass-crosses-a-second',
    name: 'Brass crosses a second',
    category: 'wind',
    description:
      'Muted trumpets in section, nearly a second of crescendo on each entry, a low-pass opening as they swell, tape over the rub.',
    preview: SUSPENSIONS_LOW,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.9, release: 0.6, blow: 0.6, breath: 0.05 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom', params: { cutoffHz: 1100, envAmount: 60 } },
      { deviceId: 'tape', preset: 'Hot glue', params: { hiss: 0.05 } },
    ],
  },

  // Pedal steel: the bar is on the string before the string is heard.
  {
    id: 'from-nothing-bar-already-there',
    name: 'Bar already there',
    category: 'string',
    description:
      'A round steel with a two second pedal on every note, no shake, a bend of up to a third where notes overlap, in an open valley.',
    preview: STEEL,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { volume: -4, swell: 2, range: 3, glide: 450, tone: 1800 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { decay: 6, mix: 0.35 } }],
  },
  {
    id: 'from-nothing-porch-light-comes-on',
    name: 'Porch light comes on',
    category: 'string',
    description:
      'A soft dark steel fading in over a second, with the low and high of an old amplifier trading places and a drip of spring.',
    preview: TENTHS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { swell: 1, range: 0, vibrato: 18, rate: 4.4, tone: 2400 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { rate: 4.2, depth: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Late splash', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-high-frets-take-light',
    name: 'High frets take light',
    category: 'string',
    description:
      'A bright steel high on the neck, in over a second and a half, whose tail goes up a fifth each time it comes round.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { volume: 4, swell: 1.5, sustain: 20, range: 0, vibrato: 6, tone: 5500 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { decay: 6, mix: 0.4 } }],
  },
  {
    id: 'from-nothing-freight-below-horizon',
    name: 'Freight below horizon',
    category: 'drone',
    description:
      'Long low steel under a wide slow shake, up in two seconds over its own octave below, under passing clouds.',
    preview: SECOND,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 2, range: 0, vibrato: 28, rate: 3, tone: 2600, pick: 0.3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { attack: 1, sub2: 0, sub1: 0.6 } },
      { deviceId: 'weather', preset: 'Passing clouds', params: { voice: 0.15 } },
    ],
  },
  {
    id: 'from-nothing-frost-along-the-wire',
    name: 'Frost along the wire',
    category: 'texture',
    description:
      'A hard-picked bell of a steel whose picks are all buried under a second of pedal, then left out in a frozen still winter.',
    preview: GATHER,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { swell: 1.1, sustain: 25, range: 0, vibrato: 0 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { tail: 0.5 } }],
  },
  {
    id: 'from-nothing-slide-heard-returning',
    name: 'Slide heard returning',
    category: 'string',
    description:
      'Overlapped notes slide up to an octave and are followed by the same slides backwards; six tenths of a second on each entry.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { volume: -2, swell: 0.6, glide: 700, vibrato: 10, tone: 3600 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { mix: 0.5, length: 2 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },

  // Tine piano: the hammer's bark is gone and the fork is left.
  {
    id: 'from-nothing-fork-after-the-hammer',
    name: 'Fork after the hammer',
    category: 'keys',
    description:
      'A dark tine faded up over nearly a second, panned slowly from side to side by its amplifier and shaded by a faint phaser.',
    preview: BREATHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { bell: 0.15, decay: 3, release: 1.2, tone: 0.4, tremoloRate: 0.6 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 900 } },
      { deviceId: 'phaser', preset: 'Faint shade', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'from-nothing-bark-held-in-the-mouth',
    name: 'Bark held in the mouth',
    category: 'keys',
    description:
      'Driven tines whose bark is shut off by a pedal that opens late in its second, with a triode and a slack spring behind.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { volume: -14.5, decay: 3, release: 0.4, tone: 0.8, drive: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 900, sensitivity: -55 } },
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'from-nothing-tines-under-deep-snow',
    name: 'Tines under deep snow',
    category: 'keys',
    description:
      'Soft tines with the hit turned down and the rest blurred into a deep fog, three layers of it, with no tail after.',
    preview: BREATHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { volume: -13, bell: 0.6, tremolo: 0, decay: 2.5, release: 0.6, tone: 0.7 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Deep fog', params: { soften: 1 } },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'from-nothing-glass-tine-kept-aloft',
    name: 'Glass tine kept aloft',
    category: 'bell',
    description:
      'A bright glass tine caught after its hit and held even for as long as it is wanted, a second in, with broad lights moving.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { decay: 3, hardness: 0.4 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 1.2, decay: 2.5, tone: 0.5, motion: 0.6, sensitivity: 0.7 },
      },
      { deviceId: 'glimmer', preset: 'Broad swells' },
    ],
  },
  {
    id: 'from-nothing-low-tines-face-about',
    name: 'Low tines face about',
    category: 'keys',
    description:
      'Tines turned round in pieces of over a second, heard an octave down and dark, its level rising and falling slowly.',
    preview: GATHER,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { decay: 1.5, release: 0.8 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Undertow',
        params: { mix: 1, time: 1200, smooth: 1, feedback: 0.35, tone: 3600 },
      },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
  },
  {
    id: 'from-nothing-dampers-up-hands-off',
    name: 'Dampers up, hands off',
    category: 'pad',
    description:
      'Undamped tines opened over nearly two seconds, and grains of them drifting up towards the octave for as long as they ring.',
    preview: FLOOR,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { bell: 0.3, bark: 0.4, tone: 0.5 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'First note only',
        params: { attack: 1800, retrigger: 0, curve: 0.4, lookahead: 20 },
      },
      { deviceId: 'spectral-drifter', preset: 'Shimmer', params: { mix: 0.5 } },
    ],
  },

  // Clarinet: the classic entry, by breath alone.
  {
    id: 'from-nothing-breath-below-hearing',
    name: 'Breath below hearing',
    category: 'wind',
    description:
      'A clarinet blown so softly that it takes four seconds to be one, its pipe a little widened, in a bright hall.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { volume: -1, bore: 0.3, blow: 0.15, attack: 4, breath: 0.2, release: 2.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.4 } }],
  },
  {
    id: 'from-nothing-subtone-from-a-sigh',
    name: 'Subtone from a sigh',
    category: 'wind',
    description:
      'More air than reed: a tenor under its breath, over a second in, the sway coming only once the note is there.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { blow: 0.1, breath: 1, attack: 1.2, release: 0.8, vibrato: 0 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Singer', params: { wait: 1200 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'from-nothing-reed-over-its-strings',
    name: 'Reed over its strings',
    category: 'wind',
    description:
      'A duduk with a wide sway that needs two seconds to speak, four strings tuned in A minor ringing under it as it does.',
    preview: GATHER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Duduk',
      params: { attack: 2, release: 1.6, vibrato: 0.9, blow: 0.55 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone', params: { mix: 0.45 } },
      { deviceId: 'auto-filter', preset: 'Rumble cut' },
    ],
  },
  {
    id: 'from-nothing-chalumeau-procession',
    name: 'Chalumeau procession',
    category: 'wind',
    description:
      'Hollow low reeds, a second and a half into each note, with four more players entering behind at almost two seconds apart.',
    preview: SLOW_LINE,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { volume: 0, attack: 1.5, release: 1, blow: 0.6, breath: 0.15 },
    },
    effects: [{ deviceId: 'canon', preset: 'Slow procession', params: { mix: 0.5 } }],
  },
  {
    id: 'from-nothing-tongue-left-fluttering',
    name: 'Tongue left fluttering',
    category: 'wind',
    description:
      'A flutter that begins as air and is a rasp three seconds later, its bands swelling and fading on their own in gusts.',
    preview: GATHER,
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 3, growl: 0.8, bore: 0.6, breath: 0.8, release: 2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples' },
      { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.3 } },
    ],
  },

  // Droplets: rain so fine that no drop of it is heard.
  {
    id: 'from-nothing-rain-not-yet-on-glass',
    name: 'Rain not yet on glass',
    category: 'texture',
    description:
      'A fine shower on glass with no tick to its drops, let in from silence over three seconds through a soft mist, in a small bright chamber.',
    preview: GATHER,
    instrument: {
      deviceId: 'droplets',
      preset: 'Glass rain',
      params: { volume: -5.5, rain: 24, splash: 0, soft: 1, ring: 4, spread: 1, trail: 1.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 3000 } },
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 1, size: 220, soften: 0.9 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'from-nothing-pool-without-a-splash',
    name: 'Pool without a splash',
    category: 'pad',
    description:
      'Large drops of water, each caught and laid over the last as a held tone that takes two seconds, heard from just under it all.',
    preview: FLOOR,
    instrument: {
      deviceId: 'droplets',
      preset: 'Deep pool',
      params: { rain: 3, splash: 0, soft: 0.5, spread: 0 },
    },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow bloom layers',
        params: { mix: 1, attack: 2, decay: 5, glide: 2, sensitivity: 0.8 },
      },
      { deviceId: 'underwater', preset: 'A toe in', params: { bubbles: 0 } },
    ],
  },
  {
    id: 'from-nothing-felt-drops-become-fog',
    name: 'Felt drops become fog',
    category: 'texture',
    description:
      'Eighteen felt drops a second with their fronts cut, spread over more than half a second of slow cloud until none is single.',
    preview: BREATHS,
    instrument: {
      deviceId: 'droplets',
      preset: 'Felt patter',
      params: { rain: 18, splash: 0, soft: 1, size: 0.6, ring: 2 },
    },
    effects: [
      {
        deviceId: 'fog',
        preset: 'Slow rise',
        params: { size: 600, layers: 3, soften: 1, damp: 0.1 },
      },
      { deviceId: 'reveal', preset: 'Slow bloom' },
    ],
  },
  {
    id: 'from-nothing-chimes-drawn-backward',
    name: 'Chimes drawn backward',
    category: 'bell',
    description:
      'Long metal drops heard only as a room that climbs for three seconds behind each and falls away, opened wide at the top.',
    preview: GATHER,
    instrument: {
      deviceId: 'droplets',
      preset: 'Long chimes',
      params: { volume: -3, rain: 2.5, ring: 2, splash: 0, soft: 0.6 },
    },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 1, time: 3, tail: 0.3 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'from-nothing-wooden-rain-inhaled',
    name: 'Wooden rain, inhaled',
    category: 'texture',
    description:
      'Wood struck twenty-four times a second, let in over three seconds and then breathing darker and brighter, mostly heard from across a room.',
    preview: HAIRPIN,
    instrument: {
      deviceId: 'droplets',
      preset: 'Wood pulse',
      params: { volume: -1, rain: 24, loose: 0.5, soft: 0.8, splash: 0, ring: 3, trail: 2 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 3000, curve: 0.5 } },
      { deviceId: 'breath', preset: 'Dark lungs', params: { air: 0, in: 3, out: 3 } },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.7 } },
    ],
  },

  // Felt piano: the dampers are up and nobody has struck.
  {
    id: 'from-nothing-lid-full-of-overtones',
    name: 'Lid full of overtones',
    category: 'keys',
    description:
      'A pedalled felt piano opened over a second and a quarter after every stroke, with the quiet end of it then brought up.',
    preview: FLOOR,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Pedal down',
      params: {
        outputDb: -17.5,
        thump: 0,
        action: 0,
        pedalNoise: 0,
        felt: 0.4,
        reverbMix: 0,
        resonance: 1,
      },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Piano to pad',
        params: { attack: 1250, lookahead: 20, sensitivity: -55 },
      },
      { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.4, limit: 8 } },
    ],
  },
  {
    id: 'from-nothing-repeated-key-pppp',
    name: 'Repeated key, pppp',
    category: 'keys',
    description:
      'One key repeated under the soft pedal, quieter than can be played: blurred, it opens from nothing over two seconds in a far plate.',
    preview: BISBIGLIANDO,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        outputDb: -15.5,
        soft: 1,
        felt: 0.7,
        hardness: 0.4,
        thump: 0.1,
        action: 0,
        pedalNoise: 0,
        grit: 0,
        reverbMix: 0,
        sustain: 1,
      },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Tide',
        params: { attack: 2000, curve: 0.45, sensitivity: -62, lookahead: 20 },
      },
      { deviceId: 'fog', preset: 'Pad softener', params: { size: 80 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'from-nothing-upright-in-a-mirror',
    name: 'Upright in a mirror',
    category: 'keys',
    description:
      'An old upright heard only backwards, two seconds at a time, through a kitchen radio with its noise turned off.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -12.5, thump: 0.2, action: 0.1, pedalNoise: 0, grit: 0.1 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Phrase and mirror',
        params: { mix: 1, time: 2000, smooth: 0.9 },
      },
      { deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0, mix: 0.6 } },
    ],
  },
  {
    id: 'from-nothing-strings-fan-open-slowly',
    name: 'Strings fan open slowly',
    category: 'texture',
    description:
      'A stiff glassy piano closed for a second and then fanned out in time from its lowest partials to its highest.',
    preview: QUARTAL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { thump: 0, action: 0, pedalNoise: 0, sustain: 1, reverbMix: 0.2 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'First note only',
        params: { attack: 1000, retrigger: 0, curve: 0.5 },
      },
      { deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.65 } },
    ],
  },

  // Harp: two strings at one pitch, and the string with the finger taken away.
  {
    id: 'from-nothing-enharmonic-whisper',
    name: 'Enharmonic whisper',
    category: 'plucked',
    description:
      'Two harp strings at one pitch whispered in turn at mid-string, their fronts blurred, let in over a second and a half, in a soft long plate.',
    preview: BISBIGLIANDO,
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.05, pluck: 0.5, decay: 4, halo: 0.7 },
    },
    effects: [
      {
        deviceId: 'swell',
        preset: 'Tide',
        params: { attack: 1600, curve: 0.45, sensitivity: -62, lookahead: 20 },
      },
      { deviceId: 'fog', preset: 'Pad softener' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5 } },
    ],
  },
  {
    id: 'from-nothing-harp-drawn-with-a-bow',
    name: 'Harp drawn with a bow',
    category: 'string',
    description:
      'Silk strings with the pluck sifted out and the tones left ringing, faded in over a second, a second player set beside them.',
    preview: SUSPENSIONS_LOW,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 6, decay: 4, bend: 0, damp: 0.35, touch: 0.5 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Tones only', params: { hold: 0.4 } },
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 900, sensitivity: -50 } },
      { deviceId: 'size', preset: 'Second player' },
    ],
  },
  {
    id: 'from-nothing-gliss-the-room-recalls',
    name: 'Gliss the room recalls',
    category: 'texture',
    description:
      'A harp swept across two thirds of a second and only a dark room heard of it, which swells and fades, under a wide slow chorus.',
    preview: BREATHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { volume: 1.5, decay: 2, sweep: 0.7 },
    },
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Dark swell',
        params: { mix: 1, time: 2, highCut: 3500, tail: 0.3 },
      },
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'from-nothing-steel-strings-in-grains',
    name: 'Steel strings in grains',
    category: 'texture',
    description:
      'Bright steel strings faded in over half a second and replayed as overlapping reversed grains, with no shift of pitch.',
    preview: ARRIVALS,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: 4, touch: 0.6, pluck: 0.15, body: 0.4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 500 } },
      { deviceId: 'spectral-drifter', preset: 'Reversed smear', params: { mix: 1 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 9 } },
    ],
  },
]
