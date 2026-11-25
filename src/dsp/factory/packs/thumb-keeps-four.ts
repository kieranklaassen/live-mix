import { type FactoryPreset, type Phrase } from '../types'

// Two hands of one player: a thumb that walks four quarters for ever and fingers that come round
// every three, five, seven or nine eighths above it, so the tune leaves the bar and comes home.
// For each instrument a thumb voice and a finger voice, from a hard string to a soft one.

const at = (sec: number): number => Math.round(sec * 1000) / 1000

/** The thumb: one note of its four on every quarter, let go just before the next unless it is held longer. */
const thumb = (
  eighth: number,
  four: readonly number[],
  quarters: number,
  gain: number,
  held = 1.9,
) =>
  Array.from({ length: quarters }, (_, quarter) => ({
    atSec: at(quarter * 2 * eighth),
    durSec: at(held * eighth),
    note: four[quarter % 4],
    gain,
  }))

/** The fingers: notes on the eighths named, each held for so many eighths and off before the next. */
const fingers = (
  eighth: number,
  line: readonly (readonly [number, number])[],
  held: number,
  gain: number,
) =>
  line.map(([when, note], i) => ({
    atSec: at(when * eighth),
    durSec: at(Math.min(held, (line[i + 1]?.[0] ?? when + 9) - when - 0.05) * eighth),
    note,
    gain,
  }))

/** The same phrase an octave higher, for bars and tongues. */
const up = (phrase: Phrase): Phrase => ({
  notes: phrase.notes.map((n) => ({ ...n, note: n.note + 12 })),
})

// C G E G, and a finger every three eighths: three whole bars, then both hands back on the one.
const THREES: Phrase = {
  notes: [
    ...thumb(0.25, [48, 43, 52, 43], 12, 0.7),
    ...fingers(
      0.25,
      [
        [0, 67],
        [3, 72],
        [6, 74],
        [9, 71],
        [12, 67],
        [15, 64],
        [18, 69],
        [21, 72],
      ],
      2.8,
      0.77,
    ),
    { atSec: 6, durSec: 1.2, note: 48, gain: 0.7 },
    { atSec: 6, durSec: 1.2, note: 67, gain: 0.77 },
  ],
}
// Threes for a round: each note agrees with the one two after it, so a copy six eighths behind is in tune.
const ROUND: Phrase = {
  notes: [
    ...thumb(0.25, [48, 43, 52, 43], 12, 0.7),
    ...fingers(
      0.25,
      [
        [0, 67],
        [3, 72],
        [6, 74],
        [9, 76],
        [12, 67],
        [15, 64],
        [18, 71],
        [21, 69],
      ],
      2.8,
      0.77,
    ),
    { atSec: 6, durSec: 1, note: 48, gain: 0.7 },
    { atSec: 6, durSec: 1, note: 67, gain: 0.77 },
  ],
}
// The same thumb under fives (a pluck on the first eighth and the fourth): all five bars, quick, and home.
const FIVES: Phrase = {
  notes: [
    ...thumb(0.16, [48, 43, 52, 43], 20, 0.6),
    ...fingers(
      0.16,
      [
        [0, 67],
        [3, 74],
        [5, 67],
        [8, 72],
        [10, 69],
        [13, 76],
        [15, 67],
        [18, 74],
        [20, 64],
        [23, 71],
        [25, 67],
        [28, 72],
        [30, 69],
        [33, 74],
        [35, 67],
        [38, 71],
      ],
      2,
      0.73,
    ),
    { atSec: 6.4, durSec: 0.9, note: 48, gain: 0.7 },
    { atSec: 6.4, durSec: 0.9, note: 67, gain: 0.77 },
  ],
}
// A E C E in A minor under sevens (three, two and two eighths): four of the seven bars, the thumb home on the fifth and the finger an eighth behind it.
const SEVENS: Phrase = {
  notes: [
    ...thumb(0.2, [45, 52, 48, 52], 17, 0.63),
    ...fingers(
      0.2,
      [
        [0, 69],
        [3, 76],
        [5, 72],
        [7, 67],
        [10, 74],
        [12, 72],
        [14, 69],
        [17, 72],
        [19, 76],
        [21, 64],
        [24, 71],
        [26, 69],
        [28, 67],
        [31, 72],
        [33, 69],
      ],
      2,
      0.73,
    ),
  ],
}
// D A F A in D dorian under nines (three, two, three and one): four nines of the nine bars, and the fifth pinched on the third beat.
const NINES: Phrase = {
  notes: [
    ...thumb(0.18, [50, 45, 53, 45], 19, 0.63),
    ...fingers(
      0.18,
      [
        [0, 69],
        [3, 74],
        [5, 77],
        [8, 76],
        [9, 72],
        [12, 74],
        [14, 71],
        [17, 69],
        [18, 67],
        [21, 72],
        [23, 76],
        [26, 74],
        [27, 71],
        [30, 72],
        [32, 69],
        [35, 65],
        [36, 69],
      ],
      1.8,
      0.73,
    ),
  ],
}
// For tongues and bars: the left thumb on C G E G round middle C, the right in fives over it, home an eighth late.
const TONGUES: Phrase = {
  notes: [
    ...thumb(0.25, [60, 55, 64, 55], 12, 0.63),
    ...fingers(
      0.25,
      [
        [0, 79],
        [3, 74],
        [5, 76],
        [8, 72],
        [10, 79],
        [13, 74],
        [15, 81],
        [18, 76],
        [20, 74],
        [23, 81],
        [25, 79],
      ],
      1.9,
      0.7,
    ),
    { atSec: 6, durSec: 1, note: 60, gain: 0.63 },
  ],
}
// Threes again, far slower and for what speaks slowly: the G is the upper one and the thumb lets its strings ring.
const SLOW_THREES: Phrase = {
  notes: [
    ...thumb(0.4, [48, 55, 52, 55], 8, 0.6, 3.5),
    ...fingers(
      0.4,
      [
        [0, 67],
        [3, 72],
        [6, 74],
        [9, 71],
        [12, 67],
      ],
      2.9,
      0.77,
    ),
  ],
}
// Sevens over A E C E, slow and left to ring: two sevens and most of a third, home on the A.
const SLOW_SEVENS: Phrase = {
  notes: [
    ...thumb(0.35, [45, 52, 48, 52], 9, 0.6, 3.5),
    ...fingers(
      0.35,
      [
        [0, 69],
        [3, 76],
        [5, 72],
        [7, 67],
        [10, 74],
        [12, 72],
        [14, 64],
        [17, 69],
      ],
      1.95,
      0.77,
    ),
  ],
}
// A slide in threes: each finger note is held into the next by a step, which bends it; the thumb stays put.
const BENDS: Phrase = {
  notes: [
    ...thumb(0.4, [48, 43, 52, 43], 8, 0.6),
    ...fingers(
      0.4,
      [
        [0, 67],
        [3, 69],
        [6, 71],
        [9, 72],
        [12, 71],
        [15, 69],
      ],
      2.4,
      0.7,
    ),
    ...fingers(
      0.4,
      [
        [2, 69],
        [5, 71],
        [8, 72],
        [11, 74],
        [14, 72],
      ],
      0.95,
      0.56,
    ),
  ],
}
// Fives over C G E G, broad, one finger note let go before the next.
const BROAD_FIVES: Phrase = {
  notes: [
    ...thumb(0.34, [48, 43, 52, 43], 10, 0.64),
    ...fingers(
      0.34,
      [
        [0, 67],
        [3, 74],
        [5, 69],
        [8, 76],
        [10, 67],
        [13, 72],
        [15, 71],
        [18, 74],
      ],
      1.9,
      0.73,
    ),
  ],
}
// A low thumb on E B G B and fives close above it, in E phrygian.
const LOW: Phrase = {
  notes: [
    ...thumb(0.21, [40, 47, 55, 47], 16, 0.7),
    ...fingers(
      0.21,
      [
        [0, 64],
        [3, 59],
        [5, 67],
        [8, 62],
        [10, 65],
        [13, 62],
        [15, 64],
        [18, 59],
        [20, 62],
        [23, 67],
        [25, 64],
        [28, 59],
        [30, 64],
      ],
      2,
      0.7,
    ),
  ],
}
// F C A C in F lydian, the fingers in sevens with the raised fourth among them.
const LYDIAN: Phrase = {
  notes: [
    ...thumb(0.22, [41, 48, 57, 48], 15, 0.63),
    ...fingers(
      0.22,
      [
        [0, 72],
        [3, 76],
        [5, 71],
        [7, 69],
        [10, 77],
        [12, 76],
        [14, 71],
        [17, 72],
        [19, 67],
        [21, 69],
        [24, 76],
        [26, 71],
        [28, 72],
      ],
      2,
      0.7,
    ),
  ],
}
// For strings set in chords, threes over C G G G: only C, F and G (the F over the C alone), so each major, suspended-second or added-ninth chord is on white keys.
const OPEN: Phrase = {
  notes: [
    ...thumb(0.3, [60, 55, 67, 55], 11, 0.6),
    ...fingers(
      0.3,
      [
        [0, 72],
        [3, 79],
        [6, 72],
        [9, 77],
        [12, 79],
        [15, 72],
        [18, 79],
        [21, 72],
      ],
      2.8,
      0.63,
    ),
  ],
}
// For strings set in minor or suspended-fourth chords: only A, D and E, the fingers in sevens over A E A E.
const OPEN_MINOR: Phrase = {
  notes: [
    ...thumb(0.3, [57, 52, 69, 52], 11, 0.6),
    ...fingers(
      0.3,
      [
        [0, 76],
        [3, 81],
        [5, 74],
        [7, 76],
        [10, 69],
        [12, 74],
        [14, 81],
        [17, 76],
        [19, 81],
        [21, 74],
      ],
      1.9,
      0.63,
    ),
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Guitar: an electric thumb and electric fingers, the string hardest first.
  {
    id: 'thumb-keeps-four-wire-at-the-bridge',
    name: 'Wire at the bridge',
    category: 'plucked',
    description:
      'A firm pick close to the bridge, thinned and pushed forward, with a quick wet spring behind each note.',
    preview: FIVES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { volume: -6, hardness: 0.6, sustain: 5, warmth: 0.05, tone: 5200 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.28, decay: 1.4 } },
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 180, highCut: 7000 } },
    ],
  },
  {
    id: 'thumb-keeps-four-boots-on-the-boards',
    name: 'Boots on the boards',
    category: 'plucked',
    description:
      'A damped thumb at the neck, gone in a second and a half, through a woolly stack with the bass turned up.',
    preview: LOW,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark stops',
      params: { sustain: 1.5, hardness: 0.3, tone: 1800, warmth: 0.7 },
    },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Dark and woolly',
        params: { drive: 0.5, treble: -0.6, room: 0.5 },
      },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'thumb-keeps-four-five-past-midnight-gait',
    name: 'Five past midnight gait',
    category: 'plucked',
    description:
      'A soft fingertip on the neck pickup with a murky echo after it and a small dark room round both.',
    preview: SEVENS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { sustain: 4, hardness: 0.15, tone: 2100, pickup: 0.9 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 400, feedback: 0.45, mix: 0.32 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thumb-keeps-four-nail-on-glass-wire',
    name: 'Nail on glass wire',
    category: 'plucked',
    description:
      'Hard bell-like picking with a long ring, its top opened wide and a faint airy tail over it.',
    preview: THREES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { hardness: 0.95, sustain: 18, tone: 5400, shimmer: 0.2 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25, midDecay: 3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-slow-hands-no-pick',
    name: 'Slow hands, no pick',
    category: 'pad',
    description:
      'Each string fades in over half a second and rings long, through a slow rotating cabinet far across a room.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.5, sustain: 14, tone: 2600, warmth: 0.4 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'thumb-keeps-four-the-tune-walks-off',
    name: 'The tune walks off',
    category: 'plucked',
    description:
      'A clean mid-pickup guitar over two loops of slightly unequal length, so its own figure drifts out of step.',
    preview: FIVES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dry rolled chord',
      params: { volume: 1.5, strum: 0, sustain: 2, hardness: 0.6, tone: 3600, pickup: 0.5 },
    },
    effects: [
      {
        deviceId: 'orbits',
        preset: 'Two voices',
        params: { length: 1.6, feedback: 0.7, mix: 0.38 },
      },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'thumb-keeps-four-diner-after-closing',
    name: 'Diner after closing',
    category: 'plucked',
    description:
      'A round clean guitar with a quick, deep harmonic tremolo, heard from a small bedside speaker.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { volume: -0.5, hardness: 0.35, sustain: 6, warmth: 0.5, tone: 2800 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 4.6, depth: 0.95 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.05 } },
    ],
  },
  {
    id: 'thumb-keeps-four-baritone-mile',
    name: 'Baritone mile',
    category: 'plucked',
    description:
      'A dark low-strung guitar with an octave under it and the lows swelling on past the rest in a hall.',
    preview: LOW,
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: { volume: -7.5, strum: 0, sustain: 8, hardness: 0.7, tone: 1900 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-beating-wires-in-sevens',
    name: 'Beating wires in sevens',
    category: 'plucked',
    description:
      'A bright electric whose strings beat fast against themselves, chorused wide and lifted above the pick.',
    preview: SEVENS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { volume: 1, strum: 0, sustain: 7, hardness: 0.75, shimmer: 1.5, tone: 5500 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.55, depth: 55 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 5 } },
    ],
  },
  {
    id: 'thumb-keeps-four-palm-laid-on-the-saddle',
    name: 'Palm laid on the saddle',
    category: 'plucked',
    description:
      'Palm-muted strings, dry and short, pressed onto a hot cassette with its low thump.',
    preview: NINES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { volume: 5.5, sustain: 1, hardness: 0.4, warmth: 0.9, tone: 2600, pickup: 0.3 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fet-limiter', params: { inputGain: 24, outputGain: -8.5 } },
    ],
  },
  {
    id: 'thumb-keeps-four-no-nail-at-all',
    name: 'No nail at all',
    category: 'plucked',
    description:
      'The softest flesh on the neck pickup, dark, each note fogged at its start so no pluck is left, on a dark plate.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thumb and neck',
      params: { volume: 0.5, hardness: 0, sustain: 10, tone: 1500, position: 0.35, warmth: 0.6 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Pad softener' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thumb-keeps-four-overdriven-verandah',
    name: 'Overdriven verandah',
    category: 'plucked',
    description:
      'A warm amplifier pushed until the thumb growls, with a faint edge of feedback and a dark spring.',
    preview: LOW,
    instrument: {
      deviceId: 'guitar',
      preset: 'Warm breakup',
      params: { sustain: 9, hardness: 0.5, tone: 2400 },
    },
    effects: [
      { deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.3, gain: 0.7 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'thumb-keeps-four-hidden-hand-in-nines',
    name: 'Hidden hand in nines',
    category: 'plucked',
    description:
      'The pick shaved off by a short swell, with two copies of the guitar flying close by.',
    preview: NINES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { swell: 0.1, strum: 0, sustain: 12, tone: 3400, shimmer: 0.6 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'thumb-keeps-four-crossroad-swirl',
    name: 'Crossroad swirl',
    category: 'plucked',
    description:
      'A bright picked guitar through a deep eight-stage phaser and one plain slap of tape.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { volume: 1, pickup: 0.4, position: 0.12, hardness: 0.5, sustain: 8, warmth: 0.35 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { feedback: 45 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'thumb-keeps-four-last-bar-home',
    name: 'Last bar home',
    category: 'plucked',
    description:
      'A rolled open guitar answered by a dark round of two, the second voice an octave under.',
    preview: ROUND,
    instrument: {
      deviceId: 'guitar',
      preset: 'Harp roll',
      params: { volume: -0.5, strum: 20, sustain: 5, hardness: 0.45, tone: 3000, shimmer: 0.4 },
    },
    effects: [
      {
        deviceId: 'canon',
        params: { followers: 2, gap: 1.5, interval2: -12, fade: 0.3, tone: 3000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-rust-on-the-third',
    name: 'Rust on the third',
    category: 'plucked',
    description:
      'A thick growl of strings on a worn cassette, its top rubbed away and its pitch unsteady.',
    preview: LOW,
    instrument: {
      deviceId: 'guitar',
      preset: 'Thick growl',
      params: { volume: -4, strum: 0, sustain: 4, hardness: 0.65, tone: 2000, warmth: 0.85 },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.15, wear: 0.7 } }],
  },
  {
    id: 'thumb-keeps-four-strings-with-a-lid',
    name: 'Strings with a lid',
    category: 'plucked',
    description:
      'A clean guitar held inside a small wooden soundboard, behind a low pass that each pluck opens.',
    preview: SEVENS,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow strum',
      params: { strum: 0, sustain: 3, hardness: 0.5, tone: 4200, pickup: 0.7 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.75, size: 0.6 } },
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { envAttackMs: 15, envReleaseMs: 350, cutoffHz: 400 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-dusk-in-long-sleeves',
    name: 'Dusk in long sleeves',
    category: 'pad',
    description:
      'A slow warm swell of strings under the thumb, with the octave-climbing halo of a bloom reverb.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { swell: 0.8, sustain: 20, tone: 2000, shimmer: 0.9 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.35, decay: 5 } }],
  },

  // Acoustic guitar: steel, nylon and twelve strings, the nail first and the flesh last.
  {
    id: 'thumb-keeps-four-steel-in-threes',
    name: 'Steel in threes',
    category: 'plucked',
    description:
      'Steel strings near the bridge with a full nail, pressed even by a fast limiter, in a small bright chamber.',
    preview: THREES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: 4.5, sustain: 4, release: 0.8, strum: 0, body: 0.6, shimmer: 0.2 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 22, outputGain: -7.5 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'thumb-keeps-four-nylon-bench-in-shade',
    name: 'Nylon, bench in shade',
    category: 'plucked',
    description:
      'Nylon strings with a soft fingertip over a big body, a short wooden ambience and little above six kilohertz.',
    preview: SEVENS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: -0.5, nail: 0.1, sustain: 4, release: 1, strum: 0, tone: 0.35 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { lowCut: 60, presence: -3, air: -6 } },
    ],
  },
  {
    id: 'thumb-keeps-four-pizzicato-treads',
    name: 'Pizzicato treads',
    category: 'plucked',
    description:
      'Nylon stopped almost at once, each tread answered by skips that come closer together across the sides.',
    preview: NINES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: 6, sustain: 0.8, nail: 0.3, tone: 0.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.38, first: 240 } },
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -10 } },
    ],
  },
  {
    id: 'thumb-keeps-four-twelve-for-five-bars',
    name: 'Twelve for five bars',
    category: 'plucked',
    description:
      'A twelve-string with a hard nail near the bridge, spread wide with its bass held in the middle.',
    preview: FIVES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { volume: -2.5, sustain: 4, body: 0.35, tone: 1 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy', params: { mid: 1.6, high: 2 } },
      { deviceId: 'fet-limiter', params: { inputGain: 20, outputGain: -9 } },
    ],
  },
  {
    id: 'thumb-keeps-four-bare-wire-bare-table',
    name: 'Bare wire, bare table',
    category: 'plucked',
    description: 'Steel with almost no body under it, thin and near, roughened by a pentode.',
    preview: FIVES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -4.5, body: 0, sustain: 2.5, release: 0.4, nail: 0.8, position: 0.08 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.4, mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'thumb-keeps-four-oak-under-the-palm',
    name: 'Oak under the palm',
    category: 'plucked',
    description:
      'Muted steel over a heavy body, darkened and fattened by an iron transformer, with no room at all.',
    preview: LOW,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { body: 1, sustain: 1.2, release: 0.15, nail: 0.2, position: 0.3, tone: 0.25 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { drive: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'thumb-keeps-four-lullaby-counted-in-seven',
    name: 'Lullaby counted in seven',
    category: 'plucked',
    description:
      'Long nylon strings that ring over each other in the tuned strings of an A minor drone.',
    preview: SLOW_SEVENS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { strum: 0, sustain: 10, release: 8, nail: 0.25, body: 0.5 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.4, decay: 6 } }],
  },
  {
    id: 'thumb-keeps-four-glass-nail-sharp-fourth',
    name: 'Glass nail, sharp fourth',
    category: 'plucked',
    description:
      'A glassy pick on steel with every partial given its own tremolo, ringing on when the hand has left.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -14, strum: 0, shimmer: 0.4, release: 5, body: 0.15 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.75 } },
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -8 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'thumb-keeps-four-twelve-slack-and-wide',
    name: 'Twelve, slack and wide',
    category: 'plucked',
    description:
      'A slow-beating twelve-string with a soft touch, copied twenty cents sharp and flat in a dark hall.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { volume: -2.5, strum: 0, nail: 0.1, tone: 0.3, sustain: 8 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-flesh-on-dark-wood',
    name: 'Flesh on dark wood',
    category: 'plucked',
    description:
      'Steel plucked with bare flesh over the hole, muffled to a hum and warmed on cassette.',
    preview: LOW,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { strum: 0, nail: 0, sustain: 6, release: 1.5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } }],
  },
  {
    id: 'thumb-keeps-four-echo-off-by-one',
    name: 'Echo off by one',
    category: 'plucked',
    description:
      'Short nylon by the bridge into three tape heads, its repeats squeezed up level with the plucks.',
    preview: FIVES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: 3, sustain: 2.2, release: 0.3, nail: 0.45 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 480, mix: 0.4, feedback: 0.4 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -10 } },
    ],
  },
  {
    id: 'thumb-keeps-four-kitchen-side-door',
    name: 'Kitchen side door',
    category: 'plucked',
    description:
      'A steel fingerstyle guitar heard from a kitchen set with a worn speaker and a little wobble.',
    preview: THREES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { volume: -4, strum: 0, sustain: 3, nail: 0.35, release: 0.6 },
    },
    effects: [{ deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0.06 } }],
  },
  {
    id: 'thumb-keeps-four-lark-over-furrows',
    name: 'Lark over furrows',
    category: 'plucked',
    description:
      'Open steel strings that throw sparks an octave and a fifth above the fingers, each a little late.',
    preview: NINES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: -4, strum: 0, nail: 0.45, sustain: 7, release: 3 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Fifths above', params: { mix: 0.35, density: 7 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 120 } },
    ],
  },
  {
    id: 'thumb-keeps-four-nobody-bows-this-nylon',
    name: 'Nobody bows this nylon',
    category: 'pad',
    description:
      'Nylon with the pluck taken away, each note faded in over a third of a second in a dim plate.',
    preview: SLOW_SEVENS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { strum: 0, sustain: 12, release: 2, body: 1, tone: 0.4 },
    },
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 18 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-backwards-to-the-one',
    name: 'Backwards to the one',
    category: 'plucked',
    description:
      'A soft steel thumb with what it played turned round and swelling up into the next pluck.',
    preview: THREES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { volume: -4, strum: 0, sustain: 3, body: 0.7 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 750, feedback: 0.2, mix: 0.42 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-half-remembered-gait',
    name: 'Half remembered gait',
    category: 'plucked',
    description:
      'Steel strings with a half-speed bed an octave under them, rolled off so only its low end stays.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { strum: 0, nail: 0.45, sustain: 5, release: 2 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.45, length: 1600 } },
    ],
  },
  {
    id: 'thumb-keeps-four-tin-roof-fingers',
    name: 'Tin roof fingers',
    category: 'plucked',
    description:
      'A twelve-string cut short, its body shrunk to a small tin drum that rings round every pluck.',
    preview: FIVES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 0, sustain: 1.2, release: 0.2, body: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },

  // Zither: open strings under a pick, a finger and a hammer, from the driest box to the longest harp.
  {
    id: 'thumb-keeps-four-ring-pick-dry-box',
    name: 'Ring pick, dry box',
    category: 'plucked',
    description:
      'A picked zither near the bridge, its strings short and unpaired, squeezed even and kept without a room.',
    preview: FIVES,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: 0.5, body: 1, decay: 1.4, release: 0.4, brightness: 0.75, sympathy: 0 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 28, outputGain: -11.5 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 110 } },
    ],
  },
  {
    id: 'thumb-keeps-four-silk-over-movable-feet',
    name: 'Silk over movable feet',
    category: 'plucked',
    description:
      'A koto body plucked mid-string with a soft pick, a vibrato growing on every note that is left to ring.',
    preview: SLOW_SEVENS,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { decay: 6, release: 3, brightness: 0.35, position: 0.35, sympathy: 0.3 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { depth: 30 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'thumb-keeps-four-kettle-board-hammers',
    name: 'Kettle board hammers',
    category: 'plucked',
    description:
      'Dulcimer hammers on paired courses, short and bright, in a box the size of a kettle.',
    preview: NINES,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { volume: -12, roll: 0, decay: 1.6, courses: 0.8, sympathy: 0.2, position: 0.08 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.4 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'thumb-keeps-four-hammers-that-never-rest',
    name: 'Hammers that never rest',
    category: 'plucked',
    description:
      'Hammered zither strings, bright and short, rolled six times a second in octaves, pattering out into a swarm of echoes.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: {
        volume: -6.5,
        body: 1,
        roll: 6,
        brightness: 0.8,
        strum: 20,
        decay: 2,
        sympathy: 0.25,
        position: 0.1,
      },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3, length: 0.5 } }],
  },
  {
    id: 'thumb-keeps-four-parlour-in-open-majors',
    name: 'Parlour in open majors',
    category: 'plucked',
    description:
      'A chord zither that turns each note into a quickly strummed major chord, on an old single with a little crackle.',
    preview: OPEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: { volume: -4.5, strum: 50, decay: 3, release: 1 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Jukebox single',
        params: { crackle: 0.12, pops: 0.03, surface: 0.15 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-minor-bars-in-sevens',
    name: 'Minor bars in sevens',
    category: 'plucked',
    description:
      'Every key a minor chord, strummed downward with bare fingers on harp strings, dark and left to a cave.',
    preview: OPEN_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor tremolo',
      params: { volume: -4.5, exciter: 0, roll: 0, strum: 80, body: 0, decay: 5, brightness: 0.25 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3, decay: 4 } }],
  },
  {
    id: 'thumb-keeps-four-fourths-held-open',
    name: 'Fourths held open',
    category: 'plucked',
    description:
      'A nasal suspended-fourth strum on a koto box, low-passed in a slow sweep and dry.',
    preview: OPEN_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { strum: 30, direction: 0, decay: 2.5, release: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoAmount: 50, lfoRateHz: 0.4, resonance: 1.5, cutoffHz: 1500 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'thumb-keeps-four-ninths-left-swinging',
    name: 'Ninths left swinging',
    category: 'plucked',
    description:
      'Harp strings rolled slowly up an added-ninth chord, circling the head on a slow figure of eight.',
    preview: OPEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { volume: -2.5, strum: 240, direction: 0, decay: 5, release: 6, brightness: 0.45 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight' },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'thumb-keeps-four-rung-in-fifths-at-noon',
    name: 'Rung in fifths at noon',
    category: 'plucked',
    description:
      'A picked zither that sounds the fifth and octave of each note in one quick strum, the bowls of C major ringing round it.',
    preview: OPEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { volume: -2.5, strum: 25, decay: 4, release: 2, brightness: 0.7 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Bowl table', params: { mix: 0.4, ring: 6, scale: 2 } }],
  },
  {
    id: 'thumb-keeps-four-haze-of-thirty-strings',
    name: 'Haze of thirty strings',
    category: 'plucked',
    description:
      'Octave-strung courses pulled well apart and ringing on, with a warm fuzz blurred behind them.',
    preview: THREES,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { strum: 10, courses: 1, decay: 8, brightness: 0.45 },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3, decay: 4 } }],
  },
  {
    id: 'thumb-keeps-four-felt-tip-walk',
    name: 'Felt tip walk',
    category: 'plucked',
    description:
      'A single string struck by a soft hammer at its middle, round and hollow, on a small plate that pans slowly from side to side.',
    preview: SEVENS,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { volume: -5, position: 0.5, brightness: 0.2, decay: 3, sympathy: 0.1 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate' },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.3, depth: 0.9 } },
    ],
  },
  {
    id: 'thumb-keeps-four-harp-with-two-thumbs',
    name: 'Harp with two thumbs',
    category: 'plucked',
    description:
      'Concert harp strings that die two seconds after the hand, sent through a prism whose colours arrive from low to high.',
    preview: THREES,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { release: 2, decay: 5, brightness: 0.75 },
    },
    effects: [
      {
        deviceId: 'prism',
        preset: 'Low to high',
        params: { time: 500, mix: 0.35, feedback: 0.25 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-bass-course-alone',
    name: 'Bass course, alone',
    category: 'plucked',
    description:
      'A finger on the low strings of the harp body, dark, then muffled just under the water with no bubbles.',
    preview: LOW,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { brightness: 0.15, position: 0.45, decay: 4, release: 1 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under', params: { depth: 0.4, bubbles: 0 } }],
  },
  {
    id: 'thumb-keeps-four-drizzle-on-the-courses',
    name: 'Drizzle on the courses',
    category: 'plucked',
    description:
      'A bright, short picked zither whose plucks scatter into five unequal echoes on both sides.',
    preview: SEVENS,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: {
        chord: 0,
        decay: 2.5,
        release: 0.8,
        brightness: 0.95,
        courses: 0.1,
        sympathy: 0.15,
      },
    },
    effects: [
      {
        deviceId: 'constellation',
        preset: 'Scattered seven',
        params: { stars: 5, span: 900, mix: 0.4 },
      },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'thumb-keeps-four-glass-wheel-of-threes',
    name: 'Glass wheel of threes',
    category: 'plucked',
    description:
      'Very bright, very long picked strings restacked in little loops an octave up that patter on behind.',
    preview: THREES,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { chord: 0, strum: 0, decay: 10, release: 6, courses: 0.6 },
    },
    effects: [{ deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.4, time: 250 } }],
  },
  {
    id: 'thumb-keeps-four-halo-from-a-mallet',
    name: 'Halo from a mallet',
    category: 'pad',
    description:
      'Soft hammers in octaves with every sympathetic string awake, the strikes sifted out so the tones hang.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { decay: 10, release: 6, brightness: 0.2 },
    },
    effects: [{ deviceId: 'sift', preset: 'Bowed entries' }],
  },
  {
    id: 'thumb-keeps-four-falling-from-the-second',
    name: 'Falling from the second',
    category: 'plucked',
    description:
      'A long downward spread of root, second and fifth from each note, sagging a little in pitch as it dies.',
    preview: OPEN,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: { volume: -10, strum: 300, decay: 7, sympathy: 0.4, brightness: 0.5 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4, sag: -14 } }],
  },

  // Pedal steel: a bar on the strings, the fingers sliding or bending over a thumb that stays.
  {
    id: 'thumb-keeps-four-picked-clear-of-the-bar',
    name: 'Picked clear of the bar',
    category: 'plucked',
    description:
      'A steel picked hard with no swell and no vibrato, short and clear, with one quick slap behind.',
    preview: FIVES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { volume: -12.5, vibrato: 0, range: 0, sustain: 4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.3 } },
      { deviceId: 'fet-limiter', params: { inputGain: 16, outputGain: -8.4 } },
    ],
  },
  {
    id: 'thumb-keeps-four-bar-creeps-up-by-steps',
    name: 'Bar creeps up by steps',
    category: 'string',
    description:
      'A soft-picked steel where a held note bends up or down by a step into the one that overlaps it, in a spring.',
    preview: BENDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.1, glide: 240, range: 2, sustain: 10, pick: 0.35 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } }],
  },
  {
    id: 'thumb-keeps-four-lap-board-and-knife',
    name: 'Lap board and knife',
    category: 'string',
    description:
      'A bright lap slide with a sharp pick and a quick vibrato, driven hard into a close combo speaker.',
    preview: BENDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { range: 3, vibrato: 14, sustain: 6 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { drive: 0.65, output: -3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-brass-tube-low-road',
    name: 'Brass tube, low road',
    category: 'string',
    description:
      'A round thumbed steel with all its top rolled off, an octave of weight added and no room.',
    preview: LOW,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { range: 0, sustain: 6, vibrato: 0 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0, sub1: 0.7 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'thumb-keeps-four-still-bar-long-field',
    name: 'Still bar, long field',
    category: 'pad',
    description:
      'A steel with the bar held still, each note swelling in over half a second or so, into an open valley of reverb.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 0.6, range: 0, sustain: 20 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35, decay: 7 } }],
  },
  {
    id: 'thumb-keeps-four-singing-over-the-walk',
    name: 'Singing over the walk',
    category: 'string',
    description:
      'A singing steel with a wide slow vibrato and a quick swell, its echo two bright taps on the sides.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.2, range: 2, vibrato: 30 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.35 } }],
  },
  {
    id: 'thumb-keeps-four-twang-on-a-short-lead',
    name: 'Twang on a short lead',
    category: 'plucked',
    description:
      'A short clear twang, spun fast through a horn speaker with the cabinet mixed half in.',
    preview: NINES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short twang',
      params: { volume: -11, sustain: 3.5, tone: 4500 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', params: { inputGain: 14, outputGain: -9 } },
    ],
  },
  {
    id: 'thumb-keeps-four-slides-that-die-young',
    name: 'Slides that die young',
    category: 'string',
    description:
      'A steel that dies in four seconds while its slow glides are still moving, on a seasick reel of tape.',
    preview: BENDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dying slide',
      params: { volume: -11.5, range: 2, glide: 600 },
    },
    effects: [{ deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.08, output: 2 } }],
  },
  {
    id: 'thumb-keeps-four-fifth-wheel-open-sky',
    name: 'Fifth wheel, open sky',
    category: 'pad',
    description:
      'A long swelling steel with a fifth laid softly above each note, wide and slow in a hall.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 0.5, range: 0, sustain: 25, vibrato: 6 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-mile-markers-in-fives',
    name: 'Mile markers in fives',
    category: 'string',
    description:
      'A picked steel going past on the far side of a road, nearer and farther, its pitch leaning with it.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { volume: -11.5, sustain: 9, vibrato: 6, range: 2, tone: 4200, pick: 0.8 },
    },
    effects: [{ deviceId: 'distance', preset: 'Passing by', params: { level: 0.95 } }],
  },
  {
    id: 'thumb-keeps-four-amber-in-the-volume-foot',
    name: 'Amber in the volume foot',
    category: 'pad',
    description:
      'A dark swell from the pedal, muffled at the top, with a slow low pass opening and closing on it and its swells held level.',
    preview: SLOW_SEVENS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Dark swell',
      params: { swell: 0.35, range: 2, tone: 1800 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.15, cutoffHz: 900 },
      },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
  },
  {
    id: 'thumb-keeps-four-frayed-cable-no-waltz',
    name: 'Frayed cable, no waltz',
    category: 'string',
    description: 'A short bloom of steel folded into dark fuzz, the thumb steady underneath it.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Short bloom',
      params: { volume: -10.5, sustain: 6, swell: 0.1, tone: 2600 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -8, drive: 0.4 } },
    ],
  },
  {
    id: 'thumb-keeps-four-bar-that-will-not-stay',
    name: 'Bar that will not stay',
    category: 'string',
    description: 'A steel shaken wide and fast by the bar, bright, through a four-stage throb.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { volume: -4.5, swell: 0.05, vibrato: 28, sustain: 8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Fast throb' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'thumb-keeps-four-sevens-by-headlight',
    name: 'Sevens by headlight',
    category: 'string',
    description:
      'A soft-bending steel over the minor thumb, with sines an octave up that swell in behind each note.',
    preview: SLOW_SEVENS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { range: 2, sustain: 9, tone: 2000 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Octave halo', params: { release: 2.5, mix: 0.45 } },
    ],
  },
  {
    id: 'thumb-keeps-four-ghost-of-the-left-hand',
    name: 'Ghost of the left hand',
    category: 'pad',
    description:
      'A fading swell with a bright pick, spread wide, with the air at the quiet end of every note brought forward.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.4, range: 0, sustain: 4 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Air on top' },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'thumb-keeps-four-round-robin-steel',
    name: 'Round robin steel',
    category: 'string',
    description:
      'A plain picked steel followed by three voices in turn: in unison, an octave up and an octave down.',
    preview: ROUND,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Lap slide',
      params: { volume: -10.5, range: 0, vibrato: 0, sustain: 4, tone: 2600, pick: 0.55 },
    },
    effects: [
      {
        deviceId: 'canon',
        preset: 'Canon at the fifth',
        params: { gap: 1.5, mix: 0.4, interval2: 12 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-sundown-on-one-slide',
    name: 'Sundown on one slide',
    category: 'pad',
    description: 'Long slides blurred into a low vowel hall that hums under the thumb.',
    preview: BENDS,
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { swell: 0.3, range: 3, tone: 2200 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.45, decay: 6 } }],
  },

  // Thumb pianos and other struck tongues: the left thumb's bars and the right thumb's fives.
  {
    id: 'thumb-keeps-four-tongues-on-a-plank',
    name: 'Tongues on a plank',
    category: 'bell',
    description:
      'Soft kalimba tongues with a three second ring and nothing added but the plank they are nailed to.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 3, hardness: 0.2, damping: 0.6 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.7, size: 0.7 } }],
  },
  {
    id: 'thumb-keeps-four-bottle-caps-and-tin',
    name: 'Bottle caps and tin',
    category: 'bell',
    description:
      'Hard, short, bright kalimba tongues, shrunk to a small body and put on a wobbling cassette.',
    preview: up(NINES),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1, hardness: 0.95, brightness: 0.9, damping: 0.4, position: 0.02 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { size: -0.7 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } },
    ],
  },
  {
    id: 'thumb-keeps-four-left-hand-gourd',
    name: 'Left hand gourd',
    category: 'bell',
    description: 'Dark tongues struck at their middle, with the octave below added under each.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 4, hardness: 0.1, brightness: 0.15, position: 0.7, detune: 0.2 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'thumb-keeps-four-five-bars-of-rain',
    name: 'Five bars of rain',
    category: 'bell',
    description:
      'Bright kalimba tongues that throw sparks two octaves up, scattered late and wide.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 1.8, hardness: 0.75, brightness: 0.7, spread: 0.9 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Late answers', params: { pitch: 2, density: 9, mix: 0.4 } },
    ],
  },
  {
    id: 'thumb-keeps-four-spruce-bars-very-dry',
    name: 'Spruce bars, very dry',
    category: 'bell',
    description:
      'Wooden bars with the soft end of the beater, dead within half a second, squeezed up to full body.',
    preview: up(FIVES),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wood bars',
      params: { volume: 6, decay: 0.6, hardness: 0.25, position: 0.3 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 24, outputGain: -7 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'thumb-keeps-four-box-that-counts-seven',
    name: 'Box that counts seven',
    category: 'bell',
    description:
      'Music box bars over a minor walk, with an echo that plays them backwards in chunks that swell.',
    preview: up(SEVENS),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { volume: -2, decay: 1.5, hardness: 0.6 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Flicker', params: { time: 400, mix: 0.4 } }],
  },
  {
    id: 'thumb-keeps-four-motor-off-mallets-low',
    name: 'Motor off, mallets low',
    category: 'bell',
    description:
      'Soft vibraphone bars, damped when let go, through a harmonic tremolo that tilts low against high, in a faint hall.',
    preview: up(BROAD_FIVES),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Vibraphone',
      params: { volume: -3, hardness: 0.15, decay: 4, release: 0.9, brightness: 0.35 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 1.2 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'thumb-keeps-four-tumblers-on-a-shelf',
    name: 'Tumblers on a shelf',
    category: 'bell',
    description:
      'Tapped glass, short and hard, whose echoes skip away faster and faster across the sides.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Tapped glass',
      params: { volume: -7, decay: 1.2, damping: 0.6, brightness: 0.5 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.35, skips: 9 } },
    ],
  },
  {
    id: 'thumb-keeps-four-bowls-under-a-slow-hand',
    name: 'Bowls under a slow hand',
    category: 'bell',
    description:
      'Dark singing bowls struck by a soft beater, each band of their ring fading on its own tide.',
    preview: up(SLOW_THREES),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Dark bowl',
      params: { volume: -6, decay: 6, hardness: 0.15, release: 0.5, brightness: 0.35 },
    },
    effects: [{ deviceId: 'currents', preset: 'Breaking waves', params: { rate: 0.5 } }],
  },
  {
    id: 'thumb-keeps-four-brass-tongues-bent',
    name: 'Brass tongues, bent',
    category: 'bell',
    description:
      'Kalimba tongues stretched out of tune with themselves and pulled further into bell metal, on a small plate.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -4.5, decay: 3, stretch: 1.2, hardness: 0.4, detune: 2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.7, stretch: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'thumb-keeps-four-chimes-round-the-door',
    name: 'Chimes round the door',
    category: 'bell',
    description:
      'Bright wind chimes with a light strike, moved away into open air and swaying nearer and farther.',
    preview: up(NINES),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Wind chimes',
      params: { volume: -6, decay: 2.5, hardness: 0.6, damping: 0.3 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Open air', params: { wander: 0.6, rate: 0.2, level: 1 } },
    ],
  },
  {
    id: 'thumb-keeps-four-plank-under-the-stairs',
    name: 'Plank under the stairs',
    category: 'bell',
    description:
      'Round kalimba tongues in a small set of unequal echoes that bend the tune slightly as they go round.',
    preview: up(SEVENS),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 2, hardness: 0.35, position: 0.4, brightness: 0.4, spread: 0 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Bending', params: { mix: 0.35, length: 0.2 } }],
  },
  {
    id: 'thumb-keeps-four-small-gong-even-gait',
    name: 'Small gong, even gait',
    category: 'bell',
    description:
      'A gong damped to a short clang under the walk, with a warped shadow of it an octave below.',
    preview: up(BROAD_FIVES),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: { decay: 3, damping: 0.8, hardness: 0.5, release: 0.6, spread: 0.3 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Bell below', params: { mix: 0.5 } },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'thumb-keeps-four-thumbs-under-a-pond',
    name: 'Thumbs under a pond',
    category: 'bell',
    description:
      'A kalimba sunk to the middle of a pond, soft and wavering, with big bubbles rising off the thumbs.',
    preview: TONGUES,
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 5, hardness: 0.3, damping: 0.4 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Big slow bubbles', params: { depth: 0.5 } }],
  },
  {
    id: 'thumb-keeps-four-tongues-left-ringing-on',
    name: 'Tongues left ringing on',
    category: 'pad',
    description:
      'Long soft tongues swelled in from nothing, left over each other in a wide summer bloom.',
    preview: up(SLOW_SEVENS),
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { volume: -15, decay: 14, hardness: 0.1, damping: 0.2, release: 0, spread: 0.8 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.4 } },
    ],
  },

  // Pianos: the left hand keeps the four and the right hand keeps its own count.
  {
    id: 'thumb-keeps-four-left-hand-in-felt',
    name: 'Left hand in felt',
    category: 'keys',
    description:
      'A thickly felted close piano with its hammers and keys left in, rolled off and dry.',
    preview: THREES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { outputDb: -16, action: 0.6, pedalNoise: 0, resonance: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'thumb-keeps-four-upright-keeps-walking',
    name: 'Upright keeps walking',
    category: 'keys',
    description:
      'An old upright, its unisons sour and its action loud, on a ballroom record turning at seventy-eight.',
    preview: NINES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { outputDb: -16, felt: 0.1, hardness: 0.7, reverbMix: 0 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Ballroom 78',
        params: { crackle: 0.15, pops: 0.05, surface: 0.2 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-glass-right-hand',
    name: 'Glass right hand',
    category: 'keys',
    description:
      'A hard bare stiff-strung piano with its room out, split by a falling prism that delays the lows behind the highs.',
    preview: FIVES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { outputDb: -13, reverbMix: 0, detune: 0, thump: 0 },
    },
    effects: [{ deviceId: 'prism', preset: 'High to low', params: { time: 320, mix: 0.4 } }],
  },
  {
    id: 'thumb-keeps-four-count-through-the-wall',
    name: 'Count through the wall',
    category: 'keys',
    description:
      'A soft thudding piano heard next door, its highs gone and hardly any room left round it.',
    preview: SEVENS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Soft thud',
      params: { outputDb: -14.5, reverbMix: 0.1, thump: 0.7, hardness: 0.1 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door', params: { level: 1 } }],
  },
  {
    id: 'thumb-keeps-four-two-hands-on-a-loop',
    name: 'Two hands on a loop',
    category: 'keys',
    description:
      'A half-pedalled piano recorded onto a worn loop of under two seconds, so old thumbs sound under the new.',
    preview: ROUND,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { outputDb: -20, felt: 0.3, reverbMix: 0 },
    },
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Crossing sides',
        params: { length: 1.5, feedback: 0.6, wear: 0.6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'thumb-keeps-four-left-foot-down-too',
    name: 'Left foot down too',
    category: 'pad',
    description:
      'Every note under the pedal with no hammer to speak of, its slow tail swelling late in an expanse.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Blurred wash',
      params: { outputDb: -11, reverbMix: 0, hardness: 0.1, felt: 0.8 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Quick swell', params: { mix: 0.5, decay: 4, size: 0.6 } },
    ],
  },
  {
    id: 'thumb-keeps-four-rubber-under-one-thumb',
    name: 'Rubber under one thumb',
    category: 'keys',
    description:
      'Rubber between the strings, so thumb and fingers both knock like wood, in a small wet spring.',
    preview: FIVES,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Rubber thunks',
      params: { volume: 4, decay: 0.7, hammer: 0.6 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Quick twang', params: { mix: 0.25 } }],
  },
  {
    id: 'thumb-keeps-four-bolts-for-the-fingers',
    name: 'Bolts for the fingers',
    category: 'keys',
    description:
      'Light bolts that make small gongs of the strings, pulsed left and right in fives by two drifting gates.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Light bolts',
      params: { volume: -2, decay: 1.6, amount: 0.7 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Dark glints', params: { rate: 5.9, floor: 0.6 } }],
  },
  {
    id: 'thumb-keeps-four-paper-in-the-left-hand',
    name: 'Paper in the left hand',
    category: 'keys',
    description:
      'Paper buzzing on the strings, with a thin tape echo that loses its lows and fades.',
    preview: SEVENS,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Paper buzz',
      params: { hammer: 0.35, tone: 0.6 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 300, feedback: 0.5 } },
    ],
  },
  {
    id: 'thumb-keeps-four-mute-cloth-treads',
    name: 'Mute cloth treads',
    category: 'keys',
    description:
      'A felt strip on the strings and a quiet hammer, darkened, with a warm thickening a few cents off.',
    preview: LOW,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Felt whisper',
      params: { amount: 0.85, hammer: 0.3, decay: 1.2, tone: 0.4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
  {
    id: 'thumb-keeps-four-kit-inside-the-lid',
    name: 'Kit inside the lid',
    category: 'keys',
    description:
      'A different object on every key, struck hard and rattling, its loose unisons held and cut off by a gated reverb.',
    preview: NINES,
    instrument: {
      deviceId: 'prepared-piano',
      preset: 'Loose unisons',
      params: { volume: -1, amount: 0.75, rattle: 0.6, decay: 0.8 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.3 } }],
  },
  {
    id: 'thumb-keeps-four-magnets-hold-the-walk',
    name: 'Magnets hold the walk',
    category: 'keys',
    description:
      'Each walking note struck by a felt hammer, then sung two octaves up by the magnets, in a wide harmonic tremolo and a small chamber.',
    preview: BROAD_FIVES,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Soft hammer',
      params: { volume: -3.5, bloom: 0.4, harmonic: 4, bright: 0.4, damper: 0.9 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'thumb-keeps-four-reeds-in-the-thumb',
    name: 'Reeds in the thumb',
    category: 'organ',
    description:
      'Strings sung at once by the magnets, reedy and quickly damped, through a slow spinning cabinet.',
    preview: THREES,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Quick reed',
      params: { volume: -15, bright: 0.55, damper: 0.4 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'thumb-keeps-four-twelfths-over-the-walk',
    name: 'Twelfths over the walk',
    category: 'organ',
    description:
      'Each string fed on its third harmonic, so the walk is heard a twelfth up, with a copy two hertz sharp beating against it.',
    preview: LOW,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Twelfth organ',
      params: { volume: -11.5, bloom: 0.1, hammer: 0.4 },
    },
    effects: [{ deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.35 } }],
  },
  {
    id: 'thumb-keeps-four-glass-bow-for-fingers',
    name: 'Glass bow for fingers',
    category: 'pad',
    description:
      'Magnets bowing the strings in a third of a second, shimmering, through a slow flange and a plate.',
    preview: SLOW_SEVENS,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Bowed glass',
      params: { damper: 1.2, bright: 0.6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'thumb-keeps-four-octave-lamp-low-flame',
    name: 'Octave lamp, low flame',
    category: 'pad',
    description:
      'A slow octave halo grown by magnets over a soft hammer, with every sympathetic string and a fog round the attack.',
    preview: SLOW_THREES,
    instrument: {
      deviceId: 'magnet-piano',
      preset: 'Octave halo',
      params: { volume: -11, bloom: 0.7, hammer: 0.5, damper: 2.5 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
  },
]
