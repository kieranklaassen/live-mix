import { type FactoryPreset, type Phrase } from '../types'

// One finger plays a bass and the voices over it follow by the old keyboard rule, from one chord to
// the next by the shortest way. The hundred walk its five rules, two to four voices, close to wide,
// low to high, late, rolled and lingering; on the basses the voices are always another instrument.

const A_MINOR = { root: 9, steps: [0, 2, 3, 5, 7, 8, 10] }
const D_DORIAN = { root: 2, steps: [0, 2, 3, 5, 7, 9, 10] }

/** A bass, one note after another: when each begins, how long it is held, its note. */
const bass = (...notes: readonly (readonly [number, number, number])[]): Phrase => ({
  notes: notes.map(([atSec, durSec, note], i) => ({
    atSec,
    durSec,
    note,
    gain: i % 2 === 0 ? 0.66 : 0.58,
  })),
})

// The octave up from the low C, every step of it, and the top C held.
const UP = bass(
  [0, 0.78, 36],
  [0.8, 0.78, 38],
  [1.6, 0.78, 40],
  [2.4, 0.78, 41],
  [3.2, 0.78, 43],
  [4, 0.78, 45],
  [4.8, 0.78, 47],
  [5.6, 1.5, 48],
)
// The octave down to the low C: the same steps with the chords of the other road.
const DOWN = bass(
  [0, 0.78, 48],
  [0.8, 0.78, 47],
  [1.6, 0.78, 45],
  [2.4, 0.78, 43],
  [3.2, 0.78, 41],
  [4, 0.78, 40],
  [4.8, 0.78, 38],
  [5.6, 1.5, 36],
)
// The same descent from middle C, for a tenor bass.
const TENOR_DOWN = bass(
  [0, 0.78, 60],
  [0.8, 0.78, 59],
  [1.6, 0.78, 57],
  [2.4, 0.78, 55],
  [3.2, 0.78, 53],
  [4, 0.78, 52],
  [4.8, 0.78, 50],
  [5.6, 1.5, 48],
)
// Up to the fifth step and back again: the fourth step has one chord going up and another coming home.
const ARCH = bass(
  [0, 0.73, 48],
  [0.75, 0.73, 50],
  [1.5, 0.73, 52],
  [2.25, 0.73, 53],
  [3, 0.98, 55],
  [4, 0.73, 53],
  [4.75, 0.73, 52],
  [5.5, 0.73, 50],
  [6.25, 1.1, 48],
)
// A minor: down the fourth from A to E, then home.
const LAMENT = bass(
  [0, 1.38, 45],
  [1.4, 1.38, 43],
  [2.8, 1.38, 41],
  [4.2, 1.48, 40],
  [5.7, 1.6, 45],
)
// A minor: the same fourth by half steps, A G# G F# F E. The steps outside the key are leading notes.
const HALF_STEPS = bass(
  [0, 1.13, 45],
  [1.15, 1.13, 44],
  [2.3, 1.13, 43],
  [3.45, 1.13, 42],
  [4.6, 1.13, 41],
  [5.75, 1.5, 40],
)
// D dorian: D C B A, the raised sixth falling to the fifth, and back up to D.
const RAISED_SIXTH = bass(
  [0, 1.38, 50],
  [1.4, 1.38, 48],
  [2.8, 1.38, 47],
  [4.2, 1.48, 45],
  [5.7, 1.6, 50],
)
// Roots by fifths, a fourth up and a fifth down by turns: D G C F B E A.
const ROOTS = bass(
  [0, 0.93, 50],
  [0.95, 0.93, 43],
  [1.9, 0.93, 48],
  [2.85, 0.93, 41],
  [3.8, 0.93, 47],
  [4.75, 0.93, 40],
  [5.7, 1.6, 45],
)
// Four long steps down from C to G: room for voices that come late.
const FOUR_DOWN = bass([0, 1.73, 48], [1.75, 1.73, 47], [3.5, 1.73, 45], [5.25, 1.95, 43])
// A minor up from A to A, with the sixth and the seventh raised as they climb.
const MINOR_UP = bass(
  [0, 0.78, 45],
  [0.8, 0.78, 47],
  [1.6, 0.78, 48],
  [2.4, 0.78, 50],
  [3.2, 0.78, 52],
  [4, 0.78, 54],
  [4.8, 0.78, 56],
  [5.6, 1.5, 57],
)
// Short steps with air after each, C, then G A B C: the voices stay while the finger is away.
const SPACED = bass([0, 0.5, 48], [1.4, 0.5, 43], [2.8, 0.5, 45], [4.2, 0.5, 47], [5.6, 1.2, 48])
// Long and short steps in three, up to the fifth step and down to its octave for the close.
const IN_THREE = bass(
  [0, 1.28, 48],
  [1.3, 0.63, 50],
  [1.95, 1.28, 52],
  [3.25, 0.63, 53],
  [3.9, 1.28, 55],
  [5.2, 0.63, 43],
  [5.85, 1.5, 48],
)
// For chords of the sixth, whose bass is their third: the octave from E to E, which ends on C over E.
const SIXTHS_DOWN = bass(
  [0, 0.78, 52],
  [0.8, 0.78, 50],
  [1.6, 0.78, 48],
  [2.4, 0.78, 47],
  [3.2, 0.78, 45],
  [4, 0.78, 43],
  [4.8, 0.78, 41],
  [5.6, 1.5, 40],
)
// For the same chords: from E up to B and home again, held at the top.
const SIXTHS_ARCH = bass(
  [0, 0.78, 52],
  [0.8, 0.78, 53],
  [1.6, 0.78, 55],
  [2.4, 0.78, 57],
  [3.2, 1.58, 59],
  [4.8, 0.78, 57],
  [5.6, 0.38, 53],
  [6, 1.3, 52],
)
// The arch, the four long steps and the spaced steps an octave up, for what has no low notes.
const up = ({ notes }: Phrase): Phrase => ({
  notes: notes.map((note) => ({ ...note, note: note.note + 12 })),
})
const HIGH_ARCH = up(ARCH)
const FOUR_DOWN_HIGH = up(FOUR_DOWN)
const SPACED_HIGH = up(SPACED)
// A bass that climbs C D E F G and falls home, and a tune of its own over it.
const WITH_A_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.18, note: 48, gain: 0.58 },
    { atSec: 1.2, durSec: 1.18, note: 50, gain: 0.55 },
    { atSec: 2.4, durSec: 1.18, note: 52, gain: 0.58 },
    { atSec: 3.6, durSec: 1.18, note: 53, gain: 0.55 },
    { atSec: 4.8, durSec: 1.18, note: 55, gain: 0.58 },
    { atSec: 6, durSec: 1.3, note: 48, gain: 0.58 },
    { atSec: 0, durSec: 1.18, note: 76, gain: 0.6 },
    { atSec: 1.2, durSec: 1.18, note: 77, gain: 0.55 },
    { atSec: 2.4, durSec: 0.58, note: 79, gain: 0.62 },
    { atSec: 3, durSec: 0.58, note: 76, gain: 0.5 },
    { atSec: 3.6, durSec: 1.18, note: 74, gain: 0.58 },
    { atSec: 4.8, durSec: 0.58, note: 71, gain: 0.52 },
    { atSec: 5.4, durSec: 0.58, note: 74, gain: 0.55 },
    { atSec: 6, durSec: 1.3, note: 72, gain: 0.6 },
  ],
}
// A minor: a bass up from A to E and home, and a tune that keeps to tenths over most of it.
const MINOR_TUNE: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.18, note: 45, gain: 0.58 },
    { atSec: 1.2, durSec: 1.18, note: 47, gain: 0.55 },
    { atSec: 2.4, durSec: 1.18, note: 48, gain: 0.58 },
    { atSec: 3.6, durSec: 1.18, note: 50, gain: 0.55 },
    { atSec: 4.8, durSec: 1.18, note: 52, gain: 0.58 },
    { atSec: 6, durSec: 1.3, note: 45, gain: 0.58 },
    { atSec: 0, durSec: 1.18, note: 72, gain: 0.6 },
    { atSec: 1.2, durSec: 1.18, note: 74, gain: 0.55 },
    { atSec: 2.4, durSec: 0.58, note: 76, gain: 0.62 },
    { atSec: 3, durSec: 0.58, note: 72, gain: 0.5 },
    { atSec: 3.6, durSec: 0.78, note: 77, gain: 0.6 },
    { atSec: 4.4, durSec: 0.38, note: 74, gain: 0.5 },
    { atSec: 4.8, durSec: 0.58, note: 71, gain: 0.55 },
    { atSec: 5.4, durSec: 0.58, note: 74, gain: 0.52 },
    { atSec: 6, durSec: 1.3, note: 72, gain: 0.6 },
  ],
}
// A whole hand pressed over C, B, A and G: with the keys above silent only its lowest key speaks.
const WHOLE_HAND: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.6, note: 48, gain: 0.62 },
    { atSec: 0, durSec: 1.6, note: 55, gain: 0.5 },
    { atSec: 0, durSec: 1.6, note: 64, gain: 0.5 },
    { atSec: 1.7, durSec: 1.6, note: 47, gain: 0.58 },
    { atSec: 1.7, durSec: 1.6, note: 55, gain: 0.5 },
    { atSec: 1.7, durSec: 1.6, note: 62, gain: 0.5 },
    { atSec: 3.4, durSec: 1.6, note: 45, gain: 0.62 },
    { atSec: 3.4, durSec: 1.6, note: 52, gain: 0.5 },
    { atSec: 3.4, durSec: 1.6, note: 60, gain: 0.5 },
    { atSec: 5.1, durSec: 2.1, note: 43, gain: 0.6 },
    { atSec: 5.1, durSec: 2.1, note: 50, gain: 0.5 },
    { atSec: 5.1, durSec: 2.1, note: 59, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // String bass: the finger on a real string, the rule on another instrument.
  {
    id: 'over-a-played-bass-first-figures-on-tines',
    name: 'First figures on tines',
    category: 'bass',
    description:
      'A plucked upright bass with three close voices on a soft electric piano over each step, in a faint spring.',
    preview: UP,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'First lesson',
      params: { level: 0.65 },
      parts: {
        upper: {
          deviceId: 'tine-piano',
          preset: 'Soft suitcase',
          params: { tremolo: 0.15, release: 0.3, volume: -12.5 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Round upright', params: { volume: -2 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'over-a-played-bass-reeds-take-the-sharp',
    name: 'Reeds take the sharp',
    category: 'bass',
    description:
      'A singing fretless bass under three half-open hollow reed voices, with the sharp the sixth step asks for on the way down.',
    preview: DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { spacing: 1, height: 3, sustain: 1, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'clarinet',
          preset: 'Hollow section',
          params: { attack: 0.1, release: 0.35, volume: -3.5 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Singing fretless', params: { volume: -4.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-bows-behind-the-step',
    name: 'Bows behind the step',
    category: 'bass',
    description:
      'A dark soft upright and three airy bowed parts that come most of a second late, so each old chord leans on the new bass.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { delay: 0.8, strum: 0.3, sustain: 1.5, level: 0.75 },
      parts: {
        upper: {
          deviceId: 'chamber-strings',
          preset: 'Whisper bows',
          params: { attack: 0.15, release: 0.6, volume: -7.5 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Dark soft upright', params: { volume: -1.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'over-a-played-bass-wood-answers-the-pick',
    name: 'Wood answers the pick',
    category: 'bass',
    description:
      'A picked electric bass on roots a fifth apart and plain triads struck anew each time on a soft marimba, with one tape slap.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Plain triads',
      params: { height: 4, level: 0.75 },
      parts: { upper: { deviceId: 'mallets', preset: 'Soft marimba', params: { volume: -9.5 } } },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Bright pick',
      params: { tone: 0.75, volume: -9 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.18 } }],
  },
  {
    id: 'over-a-played-bass-sevenths-hung-on-sines',
    name: 'Sevenths hung on sines',
    category: 'bass',
    description:
      'A bass left ringing under wide sevenths of four voices on beating sine waves, the pair widened by a slow chorus.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Wide sevenths',
      params: { height: 14, sustain: 1.2, level: 0.5 },
      parts: {
        upper: {
          deviceId: 'wavetable',
          preset: 'Beating sines',
          params: { attack: 0.08, release: 0.8, sub: 0, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Let it ring',
      params: { release: 0.8, volume: -5.5 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
  },
  {
    id: 'over-a-played-bass-figures-rolled-on-gut',
    name: 'Figures rolled on gut',
    category: 'bass',
    description:
      'A muted electric bass in short steps, and four voices rolled upward on a harp that ring on once the finger is off.',
    preview: SPACED,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Rolled chords',
      params: { strum: 0.4, level: 0.7 },
      parts: {
        upper: { deviceId: 'harp', preset: 'Concert harp', params: { halo: 0.3, volume: -1 } },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Muted thud', params: { volume: 6 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.22 } }],
  },
  {
    id: 'over-a-played-bass-lament-through-a-cone',
    name: 'Lament through a cone',
    category: 'bass',
    description:
      'A growling fretless lament in A minor under three bowed strings about a sixth apart, all of it through a small amplifier.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Open strings',
      params: { level: 0.6 },
      parts: {
        upper: {
          deviceId: 'bowed-string',
          preset: 'Soft flautando',
          params: { attack: 0.12, release: 0.5, volume: -11 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Growling fretless',
      params: { growl: 0.7, tone: 0.5, volume: -5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { mix: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'over-a-played-bass-slapped-step-sung-chord',
    name: 'Slapped step, sung chord',
    category: 'bass',
    description:
      'A slapped upright and four sung ah voices that take the rising chord on every step, even as the bass falls.',
    preview: ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Always rising',
      params: { sustain: 0.4, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'choir',
          preset: 'Short ah',
          params: { attack: 0.04, release: 0.4, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Slapped upright',
      params: { growl: 0.5, volume: 0.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-recorders-by-sixths',
    name: 'Recorders by sixths',
    category: 'bass',
    description:
      'A bass plucked near the bridge, and two recorders over it that make a chord of the sixth on every step, in a wooden body.',
    preview: SIXTHS_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'String of sixths',
      params: { height: 14, sustain: 0.25 },
      parts: {
        upper: {
          deviceId: 'flute',
          preset: 'Soft recorder',
          params: { attack: 0.03, release: 0.2, volume: -11.5 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Near the bridge', params: { volume: 3.5 } },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.35 } }],
  },
  {
    id: 'over-a-played-bass-half-steps-melt-upward',
    name: 'Half steps melt upward',
    category: 'bass',
    description:
      'A thumbed bass down the fourth by half steps; the glass voices over it ring a second into each new chord, split a few cents.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Melting choir',
      params: { linger: 1, sustain: 2, level: 0.5 },
      parts: {
        upper: {
          deviceId: 'fm-glass',
          preset: 'Warm glass pad',
          params: { attack: 0.06, release: 0.9, volume: -16.5 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Thumb at the neck', params: { volume: -2.5 } },
    effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
  },
  {
    id: 'over-a-played-bass-brass-after-the-finger',
    name: 'Brass after the finger',
    category: 'bass',
    description:
      'A quiet fretless falling from D to A, and a small flugelhorn choir half a second behind it with both leading notes.',
    preview: RAISED_SIXTH,
    maker: {
      makerId: 'rule-of-the-octave',
      key: D_DORIAN,
      preset: 'Late hand',
      params: { delay: 0.5, sustain: 0.8, level: 0.65 },
      parts: {
        upper: {
          deviceId: 'horns',
          preset: 'Flugel choir',
          params: { attack: 0.12, release: 0.5, volume: -3 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Quiet deep fretless',
      params: { release: 0.5, volume: 0.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Across the room' }],
  },
  {
    id: 'over-a-played-bass-two-glasses-far-above',
    name: 'Two glasses far above',
    category: 'bass',
    description:
      'A long ringing upright with two glass tones one to two octaves over middle C, and tuned bowls that sound with them.',
    preview: UP,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'High and thin',
      params: { sustain: 1.5, level: 0.5 },
      parts: {
        upper: {
          deviceId: 'modal-bells',
          preset: 'Glass harp',
          params: { decay: 4, volume: -8.5 },
        },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Long wooden ring',
      params: { release: 0.5, volume: -4.5 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Faint halo' }],
  },
  {
    id: 'over-a-played-bass-pair-of-clean-strings',
    name: 'Pair of clean strings',
    category: 'bass',
    description:
      'A rattling picked bass down the octave, two clean guitar strings well apart over it, both into a dark short echo.',
    preview: DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Two above',
      params: { hold: 1, level: 0.75 },
      parts: {
        upper: { deviceId: 'guitar', preset: 'Clean bell', params: { strum: 0, volume: -1.5 } },
      },
    },
    instrument: {
      deviceId: 'string-bass',
      preset: 'Pick with a rattle',
      params: { growl: 0.6, tone: 0.65, volume: -5.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.22 } }],
  },
  {
    id: 'over-a-played-bass-sixths-that-outlast-it',
    name: 'Sixths that outlast it',
    category: 'bass',
    description:
      'A muted pick, and open sixth chords on a glow with no strike at all that stays for two seconds, turned by a slow phaser.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Afterglow hand',
      params: { linger: 0.8, sustain: 2, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'afterglow',
          preset: 'Only the glow',
          params: { bloom: 0.4, fade: 1.2, volume: -15 },
        },
      },
    },
    instrument: { deviceId: 'string-bass', preset: 'Muted pick', params: { volume: 1.5 } },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
  },

  // Ladder bass: one filtered voice, and the chords somewhere else.
  {
    id: 'over-a-played-bass-pipes-just-over-it',
    name: 'Pipes just over it',
    category: 'bass',
    description:
      'A soft filtered bass with three stopped-pipe voices set low, half open, round middle C, in a large church.',
    preview: UP,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Low consort',
      params: { height: 2, level: 0.65 },
      parts: {
        upper: { deviceId: 'organ', preset: 'Chapel flutes', params: { sub: 0, volume: -14 } },
      },
    },
    instrument: { deviceId: 'ladder-bass', preset: 'Felt bass', params: { volume: -10.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
  },
  {
    id: 'over-a-played-bass-sevenths-in-a-tremor',
    name: 'Sevenths in a tremor',
    category: 'bass',
    description:
      'A nearly pure sub under seventh chords on muffled tines, the three voices half open, shaken by a harmonic tremolo.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Soft sevenths',
      params: { sustain: 1, level: 0.75 },
      parts: {
        upper: {
          deviceId: 'tine-piano',
          preset: 'Underwater keys',
          params: { tremolo: 0, volume: -9.5 },
        },
      },
    },
    instrument: { deviceId: 'ladder-bass', preset: 'Soft sub', params: { volume: -12 } },
    effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }],
  },
  {
    id: 'over-a-played-bass-only-the-falling-road',
    name: 'Only the falling road',
    category: 'bass',
    description:
      'A slow filter pluck climbs the octave; three string-ensemble voices still take the falling chord of every step.',
    preview: UP,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Always falling',
      params: { level: 0.6 },
      parts: {
        upper: {
          deviceId: 'string-machine',
          preset: 'Violas',
          params: { attack: 0.1, release: 0.6, volume: -3.5 },
        },
      },
    },
    instrument: { deviceId: 'ladder-bass', preset: 'Slow pluck', params: { volume: -8.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } }],
  },
  {
    id: 'over-a-played-bass-figures-up-a-ladder',
    name: 'Figures up a ladder',
    category: 'bass',
    description:
      'A thin low reed of a bass, short, and sevenths of four voices rolled up two octaves of open zither over every step.',
    preview: SPACED,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Long harp roll',
      params: { strum: 0.8, sustain: 1.5, level: 0.8 },
      parts: {
        upper: {
          deviceId: 'zither',
          preset: 'Open zither',
          params: { chord: 0, strum: 0, release: 1.5, volume: -8.5 },
        },
      },
    },
    instrument: { deviceId: 'ladder-bass', preset: 'Low reed', params: { volume: -13.5 } },
    effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
  },
  {
    id: 'over-a-played-bass-rubber-step-steel-hand',
    name: 'Rubber step, steel hand',
    category: 'bass',
    description:
      'A rubbery bass down the minor fourth and plain triads struck with a muted palm on a steel pan, with short tape repeats.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Plain triads',
      params: { spacing: 1, height: 2, level: 0.85 },
      parts: {
        upper: {
          deviceId: 'handpan',
          preset: 'Palm mute',
          params: { sympathy: 0.2, volume: -5.5 },
        },
      },
    },
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { emphasis: 0.35, volume: -2.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.22 } }],
  },
  {
    id: 'over-a-played-bass-hummed-a-step-behind',
    name: 'Hummed a step behind',
    category: 'bass',
    description:
      'A pedal-toned bass with a humming choir that enters one voice after another, late, into a faint warm haze.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { rule: 1, delay: 0.6, strum: 0.6, spacing: 1, sustain: 1.5, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'choir',
          preset: 'Humming',
          params: { attack: 0.12, release: 0.7, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { cutoff: 260, volume: -14 },
    },
    effects: [{ deviceId: 'haze', preset: 'Faint warmth' }],
  },
  {
    id: 'over-a-played-bass-minor-fourth-glided',
    name: 'Minor fourth, glided',
    category: 'bass',
    description:
      'A gliding lead as the lament bass in A minor, with close voices on a straight sustained string, through a slow rotor.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'With its sharps',
      params: { height: 9, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'bowed-string',
          preset: 'Still tone',
          params: { attack: 0.2, release: 0.5, volume: -18 },
        },
      },
    },
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Gliding lead',
      params: { cutoff: 600, glide: 0.3, volume: -14 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'over-a-played-bass-sinking-by-half-steps',
    name: 'Sinking by half steps',
    category: 'bass',
    description:
      'A thick detuned bass down by half steps, four soft hollow synth voices over it, each band drifting on a slow tide.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Four voice choir',
      params: { height: 9, sustain: 1, level: 0.55 },
      parts: {
        upper: {
          deviceId: 'dusk',
          preset: 'Soft clarinets',
          params: { attack: 0.12, release: 0.8, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Thick unison',
      params: { cutoff: 420, volume: -14 },
    },
    effects: [{ deviceId: 'currents', preset: 'Gentle drift' }],
  },

  // String machine: bass and voices from one ensemble, or the ensemble under something struck.
  {
    id: 'over-a-played-bass-violas-read-the-figures',
    name: 'Violas read the figures',
    category: 'string',
    description:
      'Dark ensemble violas with three close voices over a bass in long and short steps, in a small plate.',
    preview: IN_THREE,
    maker: { makerId: 'rule-of-the-octave', preset: 'First lesson', params: { level: 0.7 } },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.12, release: 0.6, volume: -1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'over-a-played-bass-cellos-fall-with-a-sharp',
    name: 'Cellos fall with a sharp',
    category: 'string',
    description:
      'Ensemble cellos with their octave below drawn, taking the falling road with its F sharp in a bright hall.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { height: 3, level: 0.5, spacing: 1 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.2, release: 1, low: 0.7, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } }],
  },
  {
    id: 'over-a-played-bass-pair-over-three-octaves',
    name: 'Pair over three octaves',
    category: 'string',
    description:
      'A full ensemble with only two upper voices, high and open, swept by a very slow phaser.',
    preview: ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Two above',
      params: { height: 14, level: 0.6 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { release: 0.7, volume: -7.5 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Glacial sweep' }],
  },
  {
    id: 'over-a-played-bass-triads-by-the-wall',
    name: 'Triads by the wall',
    category: 'keys',
    description:
      'Dry unchorused saws in three-time, plain triads struck anew on every step, through a small speaker in a room.',
    preview: IN_THREE,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Plain triads',
      params: { spacing: 1, level: 0.42 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { tone: 2600, release: 0.25, volume: -8.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.7 } }],
  },
  {
    id: 'over-a-played-bass-mutes-lean-on-the-bass',
    name: 'Mutes lean on the bass',
    category: 'string',
    description:
      'Muted violins with their octave above, whose three open voices arrive one by one after the bass, in a wide valley.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { delay: 0.5, strum: 0.8, sustain: 1.5, level: 0.8 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.2, release: 1.2, volume: -8 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'over-a-played-bass-sevenths-on-a-cassette',
    name: 'Sevenths on a cassette',
    category: 'string',
    description:
      'A hollow half-chorused ensemble with sevenths over roots by fifths, recorded on a four-track cassette.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Soft sevenths',
      params: { height: 8, sustain: 1.2, level: 0.65 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.06, release: 0.8, volume: -8 },
    },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
  },
  {
    id: 'over-a-played-bass-pipes-mourn-above',
    name: 'Pipes mourn above',
    category: 'string',
    description:
      'A dark low ensemble bass steps down the minor fourth; three hollow blown pipes hold what they share.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Open strings',
      params: { height: 13, sustain: 1, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'flute',
          preset: 'Hollow pipes pad',
          params: { attack: 0.1, release: 0.7, volume: -12 },
        },
      },
    },
    instrument: { deviceId: 'string-machine', preset: 'Bowed bass', params: { volume: -4 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-sixths-on-a-slow-drum',
    name: 'Sixths on a slow drum',
    category: 'organ',
    description:
      'An unchorused ensemble as a plain organ, two voices in sixth chords on every step, in a dark slow speaker drum.',
    preview: SIXTHS_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'String of sixths',
      params: { height: 5, level: 0.8 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { low: 0.4, volume: -12 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  {
    id: 'over-a-played-bass-magnets-over-the-bows',
    name: 'Magnets over the bows',
    category: 'string',
    description:
      'A slow wide ensemble in the bass and wide sevenths of four voices on magnet-sung strings, in a large thin space.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Wide sevenths',
      params: { sustain: 1.5, level: 0.7, delay: 0.25 },
      parts: {
        upper: {
          deviceId: 'magnet-piano',
          preset: 'Quick reed',
          params: { damper: 0.8, volume: -19 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.35, release: 1.2, volume: -9 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-thin-light-on-each-step',
    name: 'Thin light on each step',
    category: 'string',
    description:
      'A bright ensemble with the two voices of a triad far over middle C, its lows trimmed and its top opened wide.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'High and thin',
      params: { sustain: 1, level: 0.5 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { attack: 0.08, release: 0.7, tone: 6000, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 120, highCut: 7000 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'over-a-played-bass-detuned-hands-cling',
    name: 'Detuned hands cling',
    category: 'string',
    description:
      'A fast detuned ensemble whose voices hold on for most of a second into the next half step, on a worn reel.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Melting choir',
      params: { linger: 0.7, sustain: 1.5, level: 0.5 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.15, release: 0.9, volume: -8 },
    },
    effects: [{ deviceId: 'patina', preset: 'Quarter inch reel' }],
  },
  {
    id: 'over-a-played-bass-tines-climb-out-of-fog',
    name: 'Tines climb out of fog',
    category: 'keys',
    description:
      'A muffled low ensemble climbs the minor octave with its raised steps; four glassy tines are rolled over each.',
    preview: MINOR_UP,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Rolled chords',
      params: { strum: 0.25, height: 13, sustain: 1.5, level: 0.8 },
      parts: {
        upper: {
          deviceId: 'tine-piano',
          preset: 'Glass bells',
          params: { tremolo: 0, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 0.12, release: 0.8, volume: -8 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Faint halo' }],
  },
  {
    id: 'over-a-played-bass-glass-bows-harp-between',
    name: 'Glass bows, harp between',
    category: 'string',
    description:
      'A high glassy ensemble in short steps and sixth chords on a dark harp just after each, both limited and lit band by band.',
    preview: SPACED,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Afterglow hand',
      params: { delay: 0.3, linger: 0.5, sustain: 1.4, hold: 1, level: 0.8 },
      parts: { upper: { deviceId: 'harp', preset: 'Dark hollow harp', params: { volume: -13.5 } } },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.15, release: 1.2, high: 0.7, low: 0.1, tone: 5000, volume: -9 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'glimmer', preset: 'Light on water' },
    ],
  },
  {
    id: 'over-a-played-bass-bows-keep-the-tune',
    name: 'Bows keep the tune',
    category: 'string',
    description:
      'A two-handed ensemble: the bass and the tune on strings, and three close solo horns kept between them by the rule.',
    preview: WITH_A_TUNE,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Tune on top',
      params: { level: 0.65 },
      parts: {
        upper: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.08, release: 0.4, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.1, release: 0.7, low: 0.15, volume: -7.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },

  // Horns: the rule blown, by one section or against another colour.
  {
    id: 'over-a-played-bass-fourth-step-two-ways',
    name: 'Fourth step, two ways',
    category: 'wind',
    description:
      'One soft horn and three more over it: the fourth step has one chord going up and another coming back, in a chamber.',
    preview: ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'First lesson',
      params: { height: 5, level: 0.65 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { attack: 0.07, release: 0.4, volume: -5.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-tuba-reads-the-octave',
    name: 'Tuba reads the octave',
    category: 'wind',
    description:
      'A soft tuba climbs from the low C, and four half-open flugelhorn parts take the old chord of each step far back in a hall.',
    preview: UP,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Four voice choir',
      params: { height: 6, sustain: 0.8, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'horns',
          preset: 'Flugel choir',
          params: { attack: 0.1, release: 0.5, volume: -6.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { attack: 0.08, release: 0.4, volume: -2.5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'over-a-played-bass-band-comes-downstairs',
    name: 'Band comes downstairs',
    category: 'wind',
    description:
      'A horn section falls from middle C under three half-open trumpets and the sharp of the full rule, in a narrow spring, limited.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { spacing: 1, height: 3, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'horns',
          preset: 'Brass band',
          params: { blow: 0.4, attack: 0.08, release: 0.4, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { type: 0, blow: 0.45, attack: 0.08, release: 0.4, volume: -8 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.25 } },
      {
        deviceId: 'fet-limiter',
        preset: 'Tucked under',
        params: { inputGain: 12, outputGain: -8 },
      },
    ],
  },
  {
    id: 'over-a-played-bass-mutes-in-the-parlour',
    name: 'Mutes in the parlour',
    category: 'wind',
    description:
      'Muted trumpets that give every step its falling chord, heard from a worn fast record.',
    preview: HIGH_ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Always falling',
      params: { height: 8, level: 0.6, sustain: 0.4 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.05, release: 0.3, volume: -5.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.15, pops: 0, mix: 0.8 } },
    ],
  },
  {
    id: 'over-a-played-bass-breath-after-the-sixth',
    name: 'Breath after the sixth',
    category: 'wind',
    description:
      'Breathy horns in D dorian, the three voices four tenths of a second behind a bass with a raised sixth, and a faint echo.',
    preview: RAISED_SIXTH,
    maker: {
      makerId: 'rule-of-the-octave',
      key: D_DORIAN,
      preset: 'Late hand',
      params: { delay: 0.4, spacing: 1, sustain: 1, level: 0.7 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { type: 0, attack: 0.12, release: 0.6, volume: -5.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Faint trace' }],
  },
  {
    id: 'over-a-played-bass-slides-by-fifths',
    name: 'Slides by fifths',
    category: 'wind',
    description:
      'Trombones in plain triads blown again on every root, darkened and thickened by a little console drive.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Plain triads',
      params: { height: 2, level: 0.55 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Trombone',
      params: { blow: 0.5, vibrato: 0.1, release: 0.3, volume: -8.5 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'over-a-played-bass-gut-over-a-brass-floor',
    name: 'Gut over a brass floor',
    category: 'wind',
    description:
      'Low brass walks the minor lament and three muted bowed parts lie open above it, about a sixth from one to the next.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Open strings',
      params: { level: 0.75 },
      parts: {
        upper: {
          deviceId: 'chamber-strings',
          preset: 'Muted swell',
          params: { attack: 0.12, release: 0.8, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.2, release: 0.8, volume: -3.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-air-and-two-trebles',
    name: 'Air, and two trebles',
    category: 'voice',
    description:
      'A horn of little more than air in the bass, with two breathy voices a third or a sixth apart high over it, both breathing slowly.',
    preview: ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'High and thin',
      params: { height: 17, sustain: 0.8, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'choir',
          preset: 'Breathy ee',
          params: { attack: 0.08, release: 0.6, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.12, release: 0.5, blow: 0.2, volume: -6 },
    },
    effects: [{ deviceId: 'breath', preset: 'Calm breath' }],
  },
  {
    id: 'over-a-played-bass-horn-above-its-hand',
    name: 'Horn above its hand',
    category: 'wind',
    description:
      'A solo horn plays a bass and a tune in A minor; a wheezing reed organ fills the close voices between, under the tune.',
    preview: MINOR_TUNE,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Tune on top',
      params: { level: 0.65 },
      parts: {
        upper: {
          deviceId: 'organ',
          preset: 'Pump organ',
          params: { attack: 0.05, release: 0.3, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { type: 0, vibrato: 0.35, release: 0.4, volume: -8.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-mutes-arrive-in-turn',
    name: 'Mutes arrive in turn',
    category: 'wind',
    description:
      'Muted brass over four long steps, its voices entering from low to high after each, circling slowly round the head.',
    preview: FOUR_DOWN_HIGH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { rule: 1, delay: 0.3, strum: 0.9, spacing: 2, sustain: 1.5, level: 0.75 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { attack: 0.2, release: 0.8, volume: -4.5 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow circle' }],
  },
  {
    id: 'over-a-played-bass-horns-under-slow-keys',
    name: 'Horns under slow keys',
    category: 'wind',
    description:
      'A horn section on roots by fifths, with soft sevenths of three voices on softly struck vibraphone bars.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Soft sevenths',
      params: { height: 6, sustain: 1, level: 0.85 },
      parts: {
        upper: { deviceId: 'mallets', preset: 'Still vibes', params: { mallet: 0.2, volume: -11 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.12, release: 0.5, blow: 0.4, volume: -4.5 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Faint air' }],
  },
  {
    id: 'over-a-played-bass-raised-steps-in-the-snow',
    name: 'Raised steps in the snow',
    category: 'wind',
    description:
      'Bright full horns climb the minor octave with its raised sixth and seventh, each left note ringing on, in a cathedral.',
    preview: MINOR_UP,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Melting choir',
      params: { linger: 0.35, spacing: 1, height: 6, sustain: 1, level: 0.5 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 0.1, release: 0.7, blow: 0.6, volume: -12 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
  },

  // Acoustic guitar: thumb and figures.
  {
    id: 'over-a-played-bass-thumb-there-and-back',
    name: 'Thumb there and back',
    category: 'plucked',
    description:
      'A steel-string thumb in slow three-time, and four rolled voices on the same strings, shared notes struck again.',
    preview: IN_THREE,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Rolled chords',
      params: { strum: 0.18, sustain: 1, level: 0.6 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { strum: 0, volume: -3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'over-a-played-bass-nylon-from-middle-c-down',
    name: 'Nylon from middle C down',
    category: 'plucked',
    description:
      'Warm nylon strings down the octave, three close voices that stay where they can, in a dark spring tank.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'First lesson',
      params: { height: 10, level: 0.7 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { strum: 0, release: 0.8, volume: -2.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-courses-on-every-root',
    name: 'Courses on every root',
    category: 'plucked',
    description:
      'A twelve-string in half-open triads on roots by fifths, every note struck anew, doubled across the sides.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Plain triads',
      params: { spacing: 1, height: 6, sustain: 0.6, level: 0.6 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 12, volume: -2.5 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Doubled' }],
  },
  {
    id: 'over-a-played-bass-finger-off-strings-stay',
    name: 'Finger off, strings stay',
    category: 'plucked',
    description:
      'Short thumbed steps with air after each, and wide ringing sevenths of four voices left sounding through the gaps.',
    preview: SPACED,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Wide sevenths',
      params: { height: 14, sustain: 2, strum: 0.25, hold: 1, level: 0.6 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { strum: 0, release: 2, volume: -6 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Short halo' }],
  },
  {
    id: 'over-a-played-bass-squeezed-above-a-thumb',
    name: 'Squeezed above a thumb',
    category: 'plucked',
    description:
      'A soft thumb climbs the minor octave in the bass, with three close accordion voices that melt from chord to chord.',
    preview: MINOR_UP,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Melting choir',
      params: { linger: 0.25, sustain: 0.8, spacing: 0, height: 10, level: 0.55 },
      parts: {
        upper: { deviceId: 'organ', preset: 'Accordion', params: { release: 0.2, volume: -15.5 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { strum: 0, volume: -1.5 },
    },
    effects: [{ deviceId: 'patina', preset: 'New tape' }],
  },
  {
    id: 'over-a-played-bass-choked-thumb-two-flutes',
    name: 'Choked thumb, two flutes',
    category: 'plucked',
    description:
      'A muted steel string for the bass and two straight flutes in sixth chords on every step, with a soft skipping echo.',
    preview: SIXTHS_ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'String of sixths',
      params: { height: 12, sustain: 0.2, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'flute',
          preset: 'Straight tone',
          params: { attack: 0.05, release: 0.2, volume: -13 },
        },
      },
    },
    instrument: { deviceId: 'acoustic-guitar', preset: 'Muted pattern', params: { volume: 1 } },
    effects: [{ deviceId: 'skipping-stone', preset: 'Soft pebble' }],
  },
  {
    id: 'over-a-played-bass-roll-near-the-bridge',
    name: 'Roll near the bridge',
    category: 'plucked',
    description:
      'Bright strings by the bridge fall by half steps; the chords, the dominants with them, are rolled slowly over two octaves.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Long harp roll',
      params: { rule: 1, strum: 0.75, sustain: 2, level: 0.6 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { strum: 0, nail: 0.6, tone: 0.65, volume: -1.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.22 } }],
  },
  {
    id: 'over-a-played-bass-thumb-first-then-a-bow',
    name: 'Thumb first, then a bow',
    category: 'plucked',
    description:
      'Four long thumbed steps, and after each a half-open chord drawn voice by voice by bowed strings.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { delay: 0.4, strum: 0.8, spacing: 1, height: 2, sustain: 1.2, level: 0.65 },
      parts: {
        upper: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.2, release: 0.7, volume: -14.5 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { strum: 0, volume: -5 },
    },
    effects: [{ deviceId: 'fog', preset: 'Thin veil' }],
  },
  {
    id: 'over-a-played-bass-nail-under-open-reeds',
    name: 'Nail under open reeds',
    category: 'plucked',
    description:
      'A nylon bass plucked near the bridge, its strike limited, under three open clarinets and the sharp of the sixth step.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { spacing: 2, height: 8, sustain: 0.5, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'clarinet',
          preset: 'Open clarinet',
          params: { attack: 0.05, release: 0.25, volume: -4 },
        },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { nail: 0.45, position: 0.12, sustain: 6, volume: -2.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'over-a-played-bass-two-courses-in-dorian',
    name: 'Two courses in dorian',
    category: 'plucked',
    description:
      'A slowly beating twelve-string in D dorian with only two voices over the bass, about a sixth apart, left to ring.',
    preview: RAISED_SIXTH,
    maker: {
      makerId: 'rule-of-the-octave',
      key: D_DORIAN,
      preset: 'Two above',
      params: { rule: 1, hold: 1, sustain: 2, level: 0.75 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { strum: 25, release: 2, volume: -4 },
    },
    effects: [{ deviceId: 'tape', preset: 'Drifting chorus' }],
  },
  {
    id: 'over-a-played-bass-wood-below-bars-above',
    name: 'Wood below, bars above',
    category: 'plucked',
    description:
      'A very dark guitar plays roots by fifths; soft sevenths answer on glass bars that beat slowly between the ears.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Soft sevenths',
      params: { sustain: 1.2, height: 9, hold: 1, level: 0.7 },
      parts: {
        upper: { deviceId: 'twin-bars', preset: 'Slow sway', params: { decay: 3, volume: -7 } },
      },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { strum: 0, release: 1, volume: -6 },
    },
    effects: [{ deviceId: 'lift', preset: 'Warm floor' }],
  },
  {
    id: 'over-a-played-bass-lullaby-with-inner-hand',
    name: 'Lullaby with inner hand',
    category: 'plucked',
    description:
      'A nylon guitar plays a bass and a tune, and the rule lays its three close voices between the two on the same strings.',
    preview: WITH_A_TUNE,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Tune on top',
      params: { rule: 0, strum: 0.12, sustain: 1, level: 0.8 },
    },
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { strum: 0, release: 1, volume: -3 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } }],
  },

  // Dusk: one oscillator, a locked sub and the rule.
  {
    id: 'over-a-played-bass-keys-under-one-finger',
    name: 'Keys under one finger',
    category: 'keys',
    description:
      'Warm filtered keys with an instant attack, one finger up the octave and three close voices of the same synth over it.',
    preview: UP,
    maker: { makerId: 'rule-of-the-octave', preset: 'First lesson', params: { level: 0.52 } },
    instrument: { deviceId: 'dusk', preset: 'Warm keys', params: { release: 0.6, volume: -5.5 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Doubler' }],
  },
  {
    id: 'over-a-played-bass-fourfold-down-the-stair',
    name: 'Fourfold down the stair',
    category: 'pad',
    description:
      'Soft synth strings with four half-open voices down the octave, F sharp and all, spread gently by a long plate.',
    preview: DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Four voice choir',
      params: { height: 5, sustain: 1, level: 0.38 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { attack: 0.1, release: 0.8, sub: 0.15, volume: -6 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-stopped-pair-in-step',
    name: 'Stopped pair in step',
    category: 'organ',
    description:
      'A synth as a stopped pipe: the bass and two voices make a chord of the sixth on every step, each with a late vibrato.',
    preview: SIXTHS_ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'String of sixths',
      params: { spacing: 1, height: 3, level: 0.8 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.05, release: 0.4, volume: -12 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'over-a-played-bass-round-tones-lament',
    name: 'Round tones lament',
    category: 'keys',
    description:
      'A filter ringing like a sine mourns down the minor fourth with a close low chord, into a short blurred cloud.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Low consort',
      params: { spacing: 0, height: 2, level: 0.46 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Round sine',
      params: { resonance: 0.75, release: 0.7, volume: -14 },
    },
    effects: [{ deviceId: 'fog', preset: 'Short blur', params: { mix: 0.6 } }],
  },
  {
    id: 'over-a-played-bass-only-the-rising-road',
    name: 'Only the rising road',
    category: 'organ',
    description:
      'A chorused square organ comes down the octave with the rising chords, four voices over the bass, in an autumn haze.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Always rising',
      params: { height: 4, sustain: 0.5, level: 0.45 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { sub: 0.2, cutoff: 1300, release: 0.5, volume: -14 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Leaf fall' }],
  },
  {
    id: 'over-a-played-bass-boys-come-in-afterwards',
    name: 'Boys come in afterwards',
    category: 'voice',
    description:
      'A dark square-wave bass in D dorian, and a high wordless choir of three parts that follows it half a second later.',
    preview: RAISED_SIXTH,
    maker: {
      makerId: 'rule-of-the-octave',
      key: D_DORIAN,
      preset: 'Late hand',
      params: { delay: 0.55, height: 11, sustain: 1, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'choir',
          preset: 'Boys ooh',
          params: { attack: 0.1, release: 0.8, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.1, release: 0.7, volume: -6 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Faint voices' }],
  },
  {
    id: 'over-a-played-bass-sub-floor-plucked-roof',
    name: 'Sub floor, plucked roof',
    category: 'bass',
    description:
      'A square and its sub in short steps under four-voice sevenths rolled on a steel-string guitar, pushed gently into a limiter.',
    preview: SPACED,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Rolled chords',
      params: { rule: 3, strum: 0.3, sustain: 1.2, level: 0.8 },
      parts: {
        upper: {
          deviceId: 'acoustic-guitar',
          preset: 'Steel fingerstyle',
          params: { strum: 0, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { attack: 0.02, release: 0.8, cutoff: 600, volume: -13 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Light touch' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'over-a-played-bass-pulse-and-pale-metal',
    name: 'Pulse and pale metal',
    category: 'pad',
    description:
      'A moving pulse steps down a minor fourth, and wide sevenths of four voices chime on vibraphone bars with a faint trail.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Wide sevenths',
      params: { height: 11, sustain: 1, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'modal-bells',
          preset: 'Vibraphone',
          params: { decay: 3, volume: -7.5 },
        },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { attack: 0.08, release: 0.6, cutoff: 1500, resonance: 0.35, sub: 0.2, volume: -5.5 },
    },
    effects: [{ deviceId: 'prism', preset: 'Faint trail' }],
  },
  {
    id: 'over-a-played-bass-steel-blooms-afterwards',
    name: 'Steel blooms afterwards',
    category: 'pad',
    description:
      'A thin synth whose filter climbs its overtones, and three open steel-guitar voices that bloom late over each long step.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { delay: 0.35, strum: 0.4, height: 8, sustain: 1.5, level: 0.8 },
      parts: {
        upper: {
          deviceId: 'pedal-steel',
          preset: 'Short bloom',
          params: { range: 0, volume: -3.5 },
        },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Overtone climb',
      params: { lowCut: 1, attack: 0.5, release: 1.2, volume: -6 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-one-key-of-the-fist',
    name: 'One key of the fist',
    category: 'keys',
    description:
      'A whole hand is pressed and only its lowest key sounds: four voices of a blooming synth take the rest from the rule.',
    preview: WHOLE_HAND,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Bass alone speaks',
      params: { spacing: 1, level: 0.28, sustain: 1 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { attack: 0.3, release: 1.2, sub: 0.2, cutoff: 500, volume: -5.5 },
    },
    effects: [{ deviceId: 'stereo-widener', preset: 'Wide' }],
  },

  // Ember: subtractive voices, some with the bass as one mono line under another instrument.
  {
    id: 'over-a-played-bass-one-mono-line-toy-tines',
    name: 'One mono line, toy tines',
    category: 'bass',
    description:
      'A warm one-voice saw bass down the octave with the full rule on short glassy keys, the pair on a hushed old cassette.',
    preview: DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { hold: 1, height: 10, level: 0.75 },
      parts: {
        upper: { deviceId: 'fm-glass', preset: 'Tine keys', params: { release: 0.4, volume: -11 } },
      },
    },
    instrument: { deviceId: 'ember', preset: 'Warm Bass', params: { cutoff: 300, volume: -9 } },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1, mix: 0.7 } }],
  },
  {
    id: 'over-a-played-bass-four-saws-obey',
    name: 'Four saws obey',
    category: 'pad',
    description:
      'Filtered saws with a brass-like bite: four half-open voices over the minor climb, softened by tube drive.',
    preview: MINOR_UP,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Four voice choir',
      params: { height: 10, sustain: 0.5, level: 0.5 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { cutoff: 600, filterEnvAmount: 0.35, ampRelease: 0.5, volume: -4 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 6, outputDb: -4 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'over-a-played-bass-hollow-sixths-in-step',
    name: 'Hollow sixths in step',
    category: 'pad',
    description:
      'A hollow pulse and triangle pad: sixth chords in three open voices over a bass that goes up four steps and back.',
    preview: SIXTHS_ARCH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'String of sixths',
      params: { voices: 3, spacing: 2, height: 5, level: 0.7 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { ampAttack: 0.08, ampRelease: 0.6, filterAttack: 0.2, volume: -4.5 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Hollow swell' }],
  },
  {
    id: 'over-a-played-bass-plucks-along-the-fifths',
    name: 'Plucks along the fifths',
    category: 'plucked',
    description:
      'Short filter plucks on roots by fifths with four-voice sevenths rolled over each, scattered into a few small echoes.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Long harp roll',
      params: { strum: 0.55, height: 13, sustain: 0.8, level: 0.75 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { ampDecay: 0.9, ampRelease: 0.6, filterDecay: 0.4, volume: 2.5 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points' }],
  },
  {
    id: 'over-a-played-bass-pure-sub-duduk-chord',
    name: 'Pure sub, duduk chord',
    category: 'bass',
    description:
      'A sine bass and its octave below on the minor lament, and a close low chord of three double-reed voices in a warm hall.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Low consort',
      params: { height: 3, sustain: 0.8, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'clarinet',
          preset: 'Duduk',
          params: { attack: 0.1, release: 0.5, vibrato: 0.2, volume: -4 },
        },
      },
    },
    instrument: { deviceId: 'ember', preset: 'Sub Sine', params: { ampRelease: 0.3, volume: -12 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
  },
  {
    id: 'over-a-played-bass-airy-hands-overlap',
    name: 'Airy hands overlap',
    category: 'pad',
    description:
      'Airy saws an octave apart on four long steps; each left note rings on for a second, wavering as if just under water.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Melting choir',
      params: { linger: 1, height: 11, sustain: 1.5, level: 0.5 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: { ampAttack: 0.2, ampRelease: 0.9, cutoff: 3200, volume: -5.5 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }],
  },
  {
    id: 'over-a-played-bass-saws-kept-in-the-dark',
    name: 'Saws kept in the dark',
    category: 'pad',
    description:
      'A stack of detuned saws closed down by a low-pass, down by half steps from A to E, narrow in the lows, in an airy hall.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'With its sharps',
      params: { spacing: 1, height: 5, sustain: 0.8, level: 0.36 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { cutoff: 900, ampAttack: 0.05, ampRelease: 0.6, volume: -2.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Firm and airy' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'over-a-played-bass-celesta-on-dark-water',
    name: 'Celesta on dark water',
    category: 'texture',
    description:
      'A dark saw over a pulse an octave down in short steps, with rolled celesta chords above, both under light rain.',
    preview: SPACED,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Rolled chords',
      params: { rule: 0, strum: 0.5, height: 14, sustain: 1.5, level: 0.8 },
      parts: { upper: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -10 } } },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.1, ampRelease: 1.2, cutoff: 400, volume: -10 },
    },
    effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-viols-take-the-sixth',
    name: 'Viols take the sixth',
    category: 'string',
    description:
      'A slow synth string bass in D dorian and a viol consort, half open, a third of a second behind.',
    preview: RAISED_SIXTH,
    maker: {
      makerId: 'rule-of-the-octave',
      key: D_DORIAN,
      preset: 'Late hand',
      params: { delay: 0.35, spacing: 1, height: 3, level: 0.75 },
      parts: {
        upper: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.08, release: 0.5, volume: -5 },
        },
      },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: { ampAttack: 0.15, ampRelease: 0.8, cutoff: 1200, volume: -4 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'over-a-played-bass-bells-read-the-roots',
    name: 'Bells read the roots',
    category: 'bell',
    description:
      'Two-sine bells an octave and a fifth apart: each root struck, its wide seventh struck with it, and a slow pan across.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Wide sevenths',
      params: { voices: 3, hold: 1, height: 9, sustain: 0.8, level: 0.6 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { oscMix: 0.2, ampDecay: 2.2, ampRelease: 1, volume: -3 },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Slow pan' }],
  },

  // Organ: the instrument the rule was learned at.
  {
    id: 'over-a-played-bass-harmonium-lesson',
    name: 'Harmonium lesson',
    category: 'organ',
    description:
      'A harmonium from the low C to the next with three close voices, every shared note held down, on a faint plate.',
    preview: UP,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'First lesson',
      params: { height: 5, sustain: 0.25, level: 0.6 },
    },
    instrument: { deviceId: 'organ', preset: 'Harmonium', params: { sub: 0.15, volume: -13 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.22 } }],
  },
  {
    id: 'over-a-played-bass-ranks-on-the-way-down',
    name: 'Ranks on the way down',
    category: 'organ',
    description:
      'Full organ down the octave with four voices and the sharp of the full rule, its edge shaded, far down a nave.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Four voice choir',
      params: { spacing: 2, sustain: 0.5, level: 0.35 },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Full organ',
      params: { reed: 0.3, tone: 4000, volume: -15 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'over-a-played-bass-triads-pumped-anew',
    name: 'Triads pumped anew',
    category: 'organ',
    description:
      'A pump organ with heavy bellows, plain triads pressed again on every root, heard down a hall.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Plain triads',
      params: { height: 9, spacing: 0, level: 0.45 },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { attack: 0.06, release: 0.25, volume: -13 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
  },
  {
    id: 'over-a-played-bass-trembling-sixths',
    name: 'Trembling sixths',
    category: 'organ',
    description:
      'Tremulant flutes in two-voice sixth chords high over a bass that falls from E to E, and a clear echo behind.',
    preview: SIXTHS_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'String of sixths',
      params: { height: 14, spacing: 1, level: 0.6 },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { tremulant: 0.35, release: 0.3, volume: -10 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.2 } }],
  },
  {
    id: 'over-a-played-bass-reed-sighs-by-halves',
    name: 'Reed sighs by halves',
    category: 'organ',
    description:
      'A trembling reed rank down by half steps, its three voices three tenths of a second late over every leading note.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Late hand',
      params: { delay: 0.3, height: 9, sustain: 0.8, level: 0.52 },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { tremulant: 0.5, attack: 0.08, release: 0.5, volume: -8 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'over-a-played-bass-lesson-past-the-wall',
    name: 'Lesson past the wall',
    category: 'organ',
    description:
      'A muffled organ as if through a wall laments in A minor, wide open; each left note rings on four tenths, in an empty room.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Open strings',
      params: { linger: 0.4, height: 8, level: 0.7 },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Through the wall',
      params: { attack: 0.1, release: 0.6, tone: 600, volume: -12 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room' },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'over-a-played-bass-beats-between-sevenths',
    name: 'Beats between sevenths',
    category: 'organ',
    description:
      'Only the beating rank: wide sevenths of four voices over roots by fifths, each shared note held, and a faint octave stop.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Wide sevenths',
      params: { height: 14, sustain: 0.8, level: 0.4 },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Beating flutes',
      params: { attack: 0.12, release: 0.7, volume: -13 },
    },
    effects: [{ deviceId: 'stops', preset: 'Nearly dry' }],
  },
  {
    id: 'over-a-played-bass-pedal-board-and-silk',
    name: 'Pedal board and silk',
    category: 'organ',
    description:
      'A deep organ pedal in four long steps and soft silk strings plucked in a slow upward roll after each of them.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { rule: 1, delay: 0.25, strum: 1, spacing: 1, height: 9, sustain: 1.5, level: 0.95 },
      parts: { upper: { deviceId: 'harp', preset: 'Soft silk', params: { volume: 2 } } },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Deep pedal',
      params: { attack: 0.1, release: 0.8, octave: 0.15, volume: -10.5 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Gentle opening' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'over-a-played-bass-pressed-and-left-unsaid',
    name: 'Pressed and left unsaid',
    category: 'organ',
    description:
      'Whole chords are pressed on a quint organ and only the lowest key sounds; three open wooden flute voices take the rule.',
    preview: WHOLE_HAND,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Bass alone speaks',
      params: { voices: 3, spacing: 2, height: 10, sustain: 0.8, level: 0.6 },
      parts: {
        upper: {
          deviceId: 'flute',
          preset: 'Slow wood swell',
          params: { attack: 0.12, release: 0.5, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { sub: 0.35, octave: 0.2, twelfth: 0.35, attack: 0.08, release: 0.5, volume: -9.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Thin veil' }],
  },
  {
    id: 'over-a-played-bass-tune-above-the-bellows',
    name: 'Tune above the bellows',
    category: 'organ',
    description:
      'A squeezed reed pair plays tune and bass; sung oh voices keep the close chord beneath the tune, muffled and in a spring tank.',
    preview: MINOR_TUNE,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Tune on top',
      params: { sustain: 0.5, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'choir',
          preset: 'Tenors oh',
          params: { attack: 0.08, release: 0.5, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { bellows: 0.4, tone: 3500, volume: -13 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },

  // Tape orchestra: the rule on worn strips of tape.
  {
    id: 'over-a-played-bass-strips-of-bowed-figures',
    name: 'Strips of bowed figures',
    category: 'string',
    description:
      'Worn taped violins in slow three-time, a bass with three close voices, each note on its own wobbling strip.',
    preview: IN_THREE,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'First lesson',
      params: { height: 9, level: 0.65 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { hiss: 0.15, release: 0.3, volume: -8.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'over-a-played-bass-taped-horns-come-home',
    name: 'Taped horns come home',
    category: 'wind',
    description:
      'A horn chorale on tape falls the octave with the F sharp on the sixth step, its voices half open, in a hall.',
    preview: TENOR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'With its sharps',
      params: { spacing: 1, height: 4, level: 0.55 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.05, release: 0.4, volume: -8.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-half-speed-half-open',
    name: 'Half speed, half open',
    category: 'wind',
    description:
      'Horn tapes at half speed, so an octave down: wavering sevenths of three voices over roots by fifths, the top rolled off.',
    preview: ROOTS,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Soft sevenths',
      params: { height: 14, sustain: 0.8, level: 0.55 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.08, release: 0.8, hiss: 0.1, volume: -10.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 1400, lfoAmount: 25 },
      },
    ],
  },
  {
    id: 'over-a-played-bass-reels-of-thin-flutes',
    name: 'Reels of thin flutes',
    category: 'wind',
    description:
      'Taped flutes with the two voices of each triad far above, in short waits between the steps of the bass.',
    preview: SPACED_HIGH,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'High and thin',
      params: { height: 16, sustain: 1.4, level: 0.5 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { release: 0.6, hiss: 0.1, volume: -11 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Thin and fading' }],
  },
  {
    id: 'over-a-played-bass-reeds-know-one-way',
    name: 'Reeds know one way',
    category: 'wind',
    description:
      'Warm taped reeds give every step of the minor lament its rising chord, in four voices, with a moving comb of phase.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Always rising',
      params: { rule: 1, sustain: 0.4, level: 0.45 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { tone: -0.2, volume: -7.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'over-a-played-bass-choir-reels-overlap',
    name: 'Choir reels overlap',
    category: 'voice',
    description:
      'A taped choir on the dorian fourth whose voices hang on half a second into the next chord, warmed on a wide long plate.',
    preview: RAISED_SIXTH,
    maker: {
      makerId: 'rule-of-the-octave',
      key: D_DORIAN,
      preset: 'Melting choir',
      params: { linger: 0.5, height: 7, sustain: 1, level: 0.55 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.1, release: 0.7, volume: -9 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'over-a-played-bass-cello-strip-felt-hammer',
    name: 'Cello strip, felt hammer',
    category: 'string',
    description:
      'A taped cello section steps down by halves, and felted piano chords of three voices fall with it, every note struck.',
    preview: HALF_STEPS,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'With its sharps',
      params: { hold: 1, strum: 0.12, height: 8, level: 0.8 },
      parts: {
        upper: {
          deviceId: 'felt-piano',
          preset: 'Felt',
          params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -17.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello section',
      params: { release: 0.7, volume: -8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.25 } }],
  },
  {
    id: 'over-a-played-bass-glass-figures-lost-reel',
    name: 'Glass figures, lost reel',
    category: 'texture',
    description:
      'Sunken string tapes at half speed, an octave down, under tapped glass: the minor lament, its voices struck anew and left.',
    preview: LAMENT,
    maker: {
      makerId: 'rule-of-the-octave',
      key: A_MINOR,
      preset: 'Open strings',
      params: { hold: 1, strum: 0.3, height: 14, sustain: 2, level: 0.75 },
      parts: {
        upper: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -10 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Sunken strings',
      params: { attack: 0.3, release: 1.2, hiss: 0.25, tone: -0.6, volume: -9 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag' }],
  },
  {
    id: 'over-a-played-bass-low-reeds-late-guitar',
    name: 'Low reeds, late guitar',
    category: 'wind',
    description:
      'Low reed tapes, an octave down, hold four long steps; a warm electric guitar swells each open chord in after them.',
    preview: FOUR_DOWN,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Slow suspensions',
      params: { delay: 0.4, strum: 0.6, height: 6, sustain: 1.5, level: 0.9 },
      parts: {
        upper: {
          deviceId: 'guitar',
          preset: 'Volume swell',
          params: { swell: 0.25, strum: 0, volume: 1.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { attack: 0.15, release: 1, volume: -10 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.16 } }],
  },
  {
    id: 'over-a-played-bass-reel-keeps-the-tune',
    name: 'Reel keeps the tune',
    category: 'string',
    description:
      'Taped strings play a tune and its bass, with softly struck magnet-sung strings as the three close voices between.',
    preview: WITH_A_TUNE,
    maker: {
      makerId: 'rule-of-the-octave',
      preset: 'Tune on top',
      params: { rule: 0, sustain: 1, level: 0.7 },
      parts: {
        upper: {
          deviceId: 'magnet-piano',
          preset: 'Soft hammer',
          params: { damper: 0.6, volume: -8.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.12, release: 0.8, volume: -10 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'New pressing' }],
  },
]
