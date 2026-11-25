import { type FactoryPreset, type Phrase } from '../types'

// A chord that changes one note and keeps two, over and over. The hand plays a plain chord, a
// fifth or a single key and the note maker walks from there; every word it knows is said, in each
// of its five rhythms, mostly at one to two and a half seconds a chord so a preview hears it go.

// C major, held: the plain place to set out from.
const HELD_C: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 60, gain: 0.64 },
    { atSec: 0, durSec: 6.9, note: 64, gain: 0.61 },
    { atSec: 0, durSec: 6.9, note: 67, gain: 0.58 },
  ],
}
// A minor in root position, held.
const HELD_A_MINOR: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 57, gain: 0.62 },
    { atSec: 0, durSec: 6.9, note: 60, gain: 0.59 },
    { atSec: 0, durSec: 6.9, note: 64, gain: 0.56 },
  ],
}
// G major a fifth higher in the hand, held.
const G_ABOVE: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 67, gain: 0.58 },
    { atSec: 0, durSec: 6.8, note: 71, gain: 0.56 },
    { atSec: 0, durSec: 6.8, note: 74, gain: 0.54 },
  ],
}
// One key and nothing else: E, which the white keys make E minor.
const ONE_KEY: Phrase = { notes: [{ atSec: 0, durSec: 6.9, note: 64, gain: 0.62 }] }
// D and A, an open fifth, held: the key fills in D minor.
const OPEN_FIFTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 50, gain: 0.6 },
    { atSec: 0, durSec: 6.9, note: 57, gain: 0.55 },
  ],
}
// D minor, then G major with the D tied over.
const D_THEN_G: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 62, gain: 0.6 },
    { atSec: 0, durSec: 3.45, note: 65, gain: 0.58 },
    { atSec: 0, durSec: 3.45, note: 69, gain: 0.56 },
    { atSec: 3.45, durSec: 3.45, note: 67, gain: 0.6 },
    { atSec: 3.45, durSec: 3.45, note: 71, gain: 0.58 },
  ],
}
// C, A minor, F: the hand itself moves one finger at a time, G to A and then E to F.
const ONE_FINGER: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 60, gain: 0.6 },
    { atSec: 0, durSec: 4.6, note: 64, gain: 0.58 },
    { atSec: 0, durSec: 2.3, note: 67, gain: 0.56 },
    { atSec: 2.3, durSec: 4.6, note: 69, gain: 0.58 },
    { atSec: 4.6, durSec: 2.3, note: 65, gain: 0.6 },
  ],
}
// C major whose third is let down to E flat half way: a change of mode by hand.
const THIRD_LET_DOWN: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 60, gain: 0.6 },
    { atSec: 0, durSec: 6.9, note: 67, gain: 0.56 },
    { atSec: 0, durSec: 3.45, note: 64, gain: 0.58 },
    { atSec: 3.45, durSec: 3.45, note: 63, gain: 0.62 },
  ],
}
// E minor, a rest, F major: two breaths, every voice struck again for the second.
const TWO_BREATHS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 59, gain: 0.58 },
    { atSec: 0, durSec: 3, note: 64, gain: 0.58 },
    { atSec: 0, durSec: 3, note: 67, gain: 0.56 },
    { atSec: 3.9, durSec: 3, note: 60, gain: 0.6 },
    { atSec: 3.9, durSec: 3, note: 65, gain: 0.6 },
    { atSec: 3.9, durSec: 3, note: 69, gain: 0.58 },
  ],
}
// E held, C laid over it, then A: each key added moves one voice of the chord, E minor, C, A minor.
const KEYS_ADDED: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 64, gain: 0.6 },
    { atSec: 2.3, durSec: 4.6, note: 72, gain: 0.58 },
    { atSec: 4.6, durSec: 2.3, note: 69, gain: 0.6 },
  ],
}
// C major spread over a tenth, low in the hand.
const LOW_TENTH: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.9, note: 48, gain: 0.62 },
    { atSec: 0, durSec: 6.9, note: 55, gain: 0.59 },
    { atSec: 0, durSec: 6.9, note: 64, gain: 0.56 },
  ],
}
// F major spread over a tenth.
const WIDE_F: Phrase = {
  notes: [
    { atSec: 0, durSec: 6.8, note: 53, gain: 0.6 },
    { atSec: 0, durSec: 6.8, note: 60, gain: 0.58 },
    { atSec: 0, durSec: 6.8, note: 69, gain: 0.56 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  {
    id: 'one-voice-moves-two-stay-seated',
    name: 'Two stay seated',
    category: 'string',
    description:
      'Violas of a string machine change one note a second and a bit, with a straight flute on the note that has just moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.15, step: 0.1, top: 1 },
      parts: { top: { deviceId: 'flute', preset: 'Straight tone', params: { volume: -17 } } },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.15, release: 0.8, low: 0.2, tone: 2200 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-cellos-lean-across',
    name: 'Cellos lean across',
    category: 'string',
    description:
      'Cellos walk the cycle the other way round, L before P, over a soft plucked upright on the roots, through a dull loudspeaker.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 1.75, step: 0.2, top: 0, bass: 1 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Dark soft upright', params: { volume: -2 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 0.3, release: 1.1, tone: 1700, high: 0.15 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-two-landings-then-back',
    name: 'Two landings, then back',
    category: 'string',
    description:
      'Glassy strings take two steps by thirds, staggered, and the same two home, over a plain low sine on each root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Two out, two home',
      params: { time: 1.2, step: 0.22, octave: 0 },
      parts: {
        bass: { deviceId: 'fm-bass', preset: 'Soft sine', params: { volume: -22, release: 0.5 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.06, release: 1, tone: 5200, volume: -4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-dry-saws-take-turns',
    name: 'Dry saws take turns',
    category: 'string',
    description:
      'Unchorused saws roll upward through a drawn word, mover first, each note clipped short, with one slap behind.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { time: 1.2, step: 0.2, ring: 0.35, seed: 45 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { release: 0.25, tone: 3400, attack: 0.01, volume: -4 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.28 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-opposite-shore-by-fog',
    name: 'Opposite shore, by fog',
    category: 'pad',
    description:
      'Three moves at once carry a dark string pad to the far chord of the cycle and back, the voices one by one, over a sub on the root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Far pole',
      params: { time: 2.3, step: 0.4 },
      parts: {
        bass: {
          deviceId: 'sub-bass',
          preset: 'Pure sine',
          params: { volume: -21, attack: 0.15, release: 0.8 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Low fog',
      params: { attack: 0.35, release: 1.5, tone: 800 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Slow water' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-every-second-chord-sun',
    name: 'Every second chord, sun',
    category: 'pad',
    description:
      'Two moves a change pass over the chord between: bright strings go by major thirds, restruck voice by voice.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Major thirds',
      params: { time: 1.2, step: 0.2, octave: 0, bass: 0 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bright shimmer',
      params: { attack: 0.08, release: 0.6 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { depth: 0.4 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.22 } },
    ],
    preview: TWO_BREATHS,
  },
  {
    id: 'one-voice-moves-console-of-four-chords',
    name: 'Console of four chords',
    category: 'organ',
    description:
      'A plain organ rocks round four chords and home over one low G on a deep pedal stop, in a slowly turning cabinet.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Four chord loop',
      params: { time: 1.75, step: 0.29 },
      parts: { bass: { deviceId: 'organ', preset: 'Deep pedal', params: { volume: -17 } } },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Plain organ',
      params: { release: 0.2, tone: 1900 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-loose-spoke',
    name: 'Loose spoke',
    category: 'string',
    description:
      'A slow ensemble drawn in narrow wanders nearly in the key, a chord each two seconds, rubbed glass on a note that stayed.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Borrowed light',
      params: { time: 2, rhythm: 0, step: 0.25, bass: 0, top: 2, seed: 2 },
      parts: {
        top: { deviceId: 'modal-bells', preset: 'Glass harp', params: { volume: -15, decay: 5 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow wide ensemble',
      params: { attack: 0.5, release: 1.4 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points' },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-whatever-keeps-the-third',
    name: 'Whatever keeps the third',
    category: 'string',
    description:
      'Every chord in turn that holds the same A, broken downward in short hollow strings whose colours arrive apart.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One third, six ways',
      params: { time: 1.75, step: 0.29 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Hollow strings',
      params: { attack: 0.05, release: 0.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Short chirp' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-passed-down-the-desk',
    name: 'Passed down the desk',
    category: 'string',
    description:
      'As the hand moves one finger, thin violas stagger to the other mode of each chord, over an electric bass left to ring.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Minor thirds',
      params: { time: 1.2, rhythm: 1, step: 0.22, top: 0 },
      parts: { bass: { deviceId: 'string-bass', preset: 'Let it ring', params: { volume: -12 } } },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Violas',
      params: { attack: 0.07, release: 0.5, tone: 3000, ensemble: 0.4, high: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { mix: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
    preview: ONE_FINGER,
  },
  {
    id: 'one-voice-moves-thaw-in-three-octaves',
    name: 'Thaw in three octaves',
    category: 'string',
    description:
      'Strings in three octaves walk by thirds and never leave the key, the mover first, as winter turns to an early spring.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds descending',
      params: { time: 1.2, rhythm: 1, step: 0.2, keep: 2, bass: 0 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Three octaves',
      params: { attack: 0.1, release: 0.9, tone: 2800 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Thaw', params: { mix: 0.7 } }],
    preview: D_THEN_G,
  },
  {
    id: 'one-voice-moves-will-not-be-budged',
    name: 'Will not be budged',
    category: 'pad',
    description:
      'A chance walk over one low D, 3.5 seconds a chord, staggered on slow cellos, with a clarinet finding a note that stayed.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Long drift',
      params: { time: 3.5, step: 0.5 },
      parts: {
        top: {
          deviceId: 'clarinet',
          preset: 'Warm clarinet',
          params: { attack: 0.12, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Long cello swell',
      params: { attack: 0.55, release: 1.8, tone: 1100 },
    },
    effects: [{ deviceId: 'distance', preset: 'Across the room' }],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-wavering-neighbours',
    name: 'Wavering neighbours',
    category: 'string',
    description:
      'Detuned strings take four steps of P and R, a minor third with each pair, and the same four home, on a warped record.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'There and back',
      params: { time: 1.2, rhythm: 0, step: 0.15, top: 0 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Detuned strings',
      params: { attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { mix: 0.85 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-muted-sinking-by-l',
    name: 'Muted, sinking by L',
    category: 'string',
    description:
      'Muted violins rock quickly down by thirds, L then R, under two seconds a chord, with short soft repeats between the notes.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds climbing',
      params: { time: 1.75, step: 0.22, ring: 0.8 },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Muted violins',
      params: { attack: 0.12, release: 0.7, volume: -2.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-six-roofs-one-floor',
    name: 'Six roofs, one floor',
    category: 'string',
    description:
      'A narrow bowed tone an octave down: every chord that has G for its root, third or fifth, staggered over a low G.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.75, step: 0.3, octave: -1 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Long wooden ring', params: { volume: -8 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Bowed bass',
      params: { attack: 0.06, release: 0.6, tone: 900, width: 0.2 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } },
      { deviceId: 'reveal', preset: 'Gentle opening' },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-the-fifth-outlasts-them',
    name: 'The fifth outlasts them',
    category: 'string',
    description:
      'High strings over chords that all keep the first fifth, with a lone voice on a note that stays and roots below.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One fifth holding',
      params: { time: 1.8, step: 0.2 },
      parts: {
        top: {
          deviceId: 'choir',
          preset: 'Soloist',
          params: { attack: 0.12, release: 0.8, volume: -13 },
        },
        bass: { deviceId: 'fm-bass', preset: 'Held hum', params: { volume: -27 } },
      },
    },
    instrument: {
      deviceId: 'string-machine',
      preset: 'Ensemble strings',
      params: { attack: 0.2, release: 1, low: 0, high: 0.8, tone: 4600 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
    preview: THIRD_LET_DOWN,
  },
  {
    id: 'one-voice-moves-wax-finds-its-level',
    name: 'Wax finds its level',
    category: 'pad',
    description:
      'A warm pad melts through six chords, 1.4 seconds each, over a slow sub on the root, as if heard just under water.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.4, step: 0.2, bass: 1 },
      parts: {
        bass: { deviceId: 'sub-bass', preset: 'Soft sub', params: { volume: -20, attack: 0.08 } },
      },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: { ampAttack: 0.35, ampRelease: 1.2, filterAttack: 0.6, cutoff: 1000 },
    },
    effects: [{ deviceId: 'underwater', preset: 'Just under' }],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-half-step-at-the-sill',
    name: 'Half step at the sill',
    category: 'pad',
    description:
      'Slow saws go round L before P above one held root on a fretless, a recorder on each note that has just moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 2.3, step: 0.2 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Quiet deep fretless', params: { volume: -11 } },
        top: { deviceId: 'flute', preset: 'Soft recorder', params: { volume: -13 } },
      },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: { ampAttack: 0.4, ampRelease: 1.2, filterAttack: 0.5 },
    },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-a-pane-folded-once',
    name: 'A pane folded once',
    category: 'pad',
    description:
      'A glass pad staggers through chords that keep one fifth, the note that stayed repeated above, partials rippling downward.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One fifth holding',
      params: { time: 1.2, rhythm: 1, step: 0.22, bass: 0 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: { ampAttack: 0.08, ampRelease: 1, cutoff: 4200 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Falling ripple' },
      { deviceId: 'fog', preset: 'Thin veil' },
    ],
    preview: D_THEN_G,
  },
  {
    id: 'one-voice-moves-root-underfoot',
    name: 'Root underfoot',
    category: 'pad',
    description:
      'A dark pulse pad over one held F, whose chords all keep that F, and a soft felted piano string on what has moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.75, rhythm: 0, step: 0.25, top: 1 },
      parts: { top: { deviceId: 'magnet-piano', preset: 'Soft hammer', params: { volume: -5 } } },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { ampAttack: 0.3, ampRelease: 1.3, cutoff: 620, subLevel: 0.15, osc2Coarse: 0 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 2600 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-air-between-members',
    name: 'Air between members',
    category: 'pad',
    description:
      'A chance walk in a thin airy pad, the mover first and the others at 0.4 second steps after, with faint backward copies.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Long drift',
      params: { time: 2.6, step: 0.4, bass: 0, top: 0, seed: 9 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Airy pad',
      params: { ampAttack: 0.2, ampRelease: 0.9 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.22 } },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-saws-hand-it-over',
    name: 'Saws hand it over',
    category: 'pad',
    description:
      'Seven soft saws by major thirds, two moves at a time, only what moves struck again, on a ladder-filtered low root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Major thirds',
      params: { time: 1.8, rhythm: 0, step: 0.3, octave: 0 },
      parts: { bass: { deviceId: 'ladder-bass', preset: 'Soft sub', params: { volume: -20 } } },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Super Saw',
      params: { cutoff: 2200, ampAttack: 0.12, ampRelease: 0.9, unisonDetune: 16, volume: -6.5 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Wide pad' },
      { deviceId: 'tamer', preset: 'Even' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-a-word-in-glass',
    name: 'A word in glass',
    category: 'plucked',
    description:
      'A short glass pluck says one drawn word over and over, upward, six notes a chord, with clean repeats.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { time: 1.2, step: 0.2, ring: 0.5, seed: 4 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: {
        ampDecay: 0.8,
        ampRelease: 0.6,
        cutoff: 700,
        velToFilter: 0.1,
        velToAmp: 0.3,
        filterDecay: 0.25,
        volume: 0,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 285, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-nasal-but-agreed',
    name: 'Nasal, but agreed',
    category: 'keys',
    description:
      'A filtered hard-synced tone rocks down by thirds, staying nearly in the key, played back from a worn cassette.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds climbing',
      params: { time: 1.75, step: 0.29, ring: 0.5, keep: 1 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Sync Lead',
      params: {
        voiceMode: 0,
        cutoff: 1500,
        filterEnvAmount: 0.15,
        ampAttack: 0.02,
        ampRelease: 0.35,
        volume: -1.5,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-out-twice-home-twice',
    name: 'Out twice, home twice',
    category: 'pad',
    description:
      'A hollow pulse pad steps two chords away and two home, staggered, with a tuba on every root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'There and back',
      params: { turn: 5, time: 1.2, rhythm: 1, step: 0.2, top: 0, bass: 1 },
      parts: {
        bass: {
          deviceId: 'horns',
          preset: 'Soft tuba',
          params: { attack: 0.06, release: 0.4, volume: -6 },
        },
      },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: { ampAttack: 0.1, ampRelease: 0.7, filterAttack: 0.4, volume: -5.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Faint air' },
      { deviceId: 'expanse', preset: 'Small box', params: { mix: 0.2 } },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-cousins-of-a-sine',
    name: 'Cousins of a sine',
    category: 'keys',
    description:
      'Round sines an octave up take the chords that share a third, broken downward, each skipping off like a stone.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One third, six ways',
      params: { time: 1.8, step: 0.3, ring: 0.6, octave: 1 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Sub Sine',
      params: { voiceMode: 0, subLevel: 0, ampAttack: 0.01, ampRelease: 0.6, glide: 0 },
    },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble' },
      { deviceId: 'tremolo', preset: 'Slow chorus' },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-held-in-common',
    name: 'Held in common',
    category: 'bell',
    description:
      'Sine bells walk down by thirds inside the key, staggered, and a kept note rings again above them among faint bowls on C.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { time: 1.75, rhythm: 1, step: 0.28 },
      parts: { top: { deviceId: 'twin-bars', preset: 'Slow metal bowl', params: { volume: -8 } } },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Bell',
      params: { ampDecay: 2, ampRelease: 1.4, volume: 1.5 },
    },
    effects: [{ deviceId: 'bowls', preset: 'Faint halo', params: { root: 0 } }],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-brass-takes-the-corner',
    name: 'Brass takes the corner',
    category: 'wind',
    description:
      'A synth brass breaks falling fifths upward, two moves a chord, with a trombone on every root, in a bright hall.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Falling fifths',
      params: { time: 1.75, step: 0.29, ring: 0.6 },
      parts: {
        bass: {
          deviceId: 'horns',
          preset: 'Trombone',
          params: { attack: 0.05, release: 0.5, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: { cutoff: 700, ampRelease: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-wooden-triangle-rocking',
    name: 'Wooden triangle, rocking',
    category: 'keys',
    description:
      'Two triangle waves with a short decay rock C, C minor, E flat, C minor and C again over a low C, on seasick tape.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Four chord loop',
      params: { time: 1.4, step: 0.23 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 2,
        osc2Shape: 2,
        osc2Coarse: 12,
        oscMix: 0.3,
        ampAttack: 0.003,
        ampDecay: 1.1,
        ampSustain: 0.15,
        ampRelease: 0.5,
        cutoff: 3000,
        volume: -2,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Seasick', params: { mix: 0.8 } }],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-one-finger-gliding',
    name: 'One finger, gliding',
    category: 'keys',
    description:
      'A single saw voice slides from note to note up each broken chord of the P L cycle, its sway arriving late, in a hovering echo.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { word: 0, time: 1.75, step: 0.29, ring: 1 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        volume: -2,
        voiceMode: 2,
        glide: 0.09,
        cutoff: 1300,
        resonance: 0.15,
        ampAttack: 0.03,
        ampRelease: 0.4,
        velToFilter: 0.1,
        osc1Shape: 0,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { mix: 0.2, feedback: 0.6 } },
      { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-seen-from-the-last-row',
    name: 'Seen from the last row',
    category: 'pad',
    description:
      'A slowly wobbling low filter on chords three moves apart, every 2.3 seconds, heard from the back of a hall.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Far pole',
      params: { time: 2.3, step: 0.3, bass: 0 },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Wobble',
      params: {
        voiceMode: 0,
        lfo1Rate: 0.9,
        lfo1Amount: 0.25,
        cutoff: 750,
        resonance: 0.25,
        subLevel: 0,
        osc2Coarse: 0,
        ampAttack: 0.12,
        ampRelease: 0.9,
        volume: 0.5,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-keeper-pulsed',
    name: 'Keeper, pulsed',
    category: 'pad',
    description:
      'A narrow pulse through a band filter keeps one fifth as chords turn round it, softly throbbing, a sine chime on the keeper.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One fifth holding',
      params: { time: 2.3, step: 0.3, bass: 0 },
      parts: { top: { deviceId: 'fm-glass', preset: 'Sine chimes', params: { volume: -15 } } },
    },
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 1,
        osc1Pw: 0.18,
        osc2Shape: 1,
        osc2Fine: 7,
        oscMix: 0.5,
        filterType: 2,
        filterSlope: 0,
        cutoff: 1300,
        resonance: 0.15,
        ampAttack: 0.25,
        ampRelease: 1.2,
      },
    },
    effects: [
      { deviceId: 'pulses', preset: 'Soft throb' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-sunset-by-half-steps',
    name: 'Sunset by half steps',
    category: 'pad',
    description:
      'Chorused saw and pulse melt through the cycle at just over two seconds a chord, a held low hum on each root, on warm tape.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 2.3, step: 0.3, bass: 1 },
      parts: {
        bass: { deviceId: 'fm-bass', preset: 'Held hum', params: { volume: -25.5, release: 0.8 } },
      },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: { attack: 0.2, release: 1.1, cutoff: 1900, volume: -8 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-minor-third-wheel',
    name: 'Minor third wheel',
    category: 'pad',
    description:
      'A wide moving pulse turns by minor thirds, P then R, the note that stayed sung above by the same voice, gently flanged.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Minor thirds',
      params: { time: 1.45, step: 0.2, bass: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { attack: 0.15, release: 0.8, cutoff: 2600 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-square-floor-white-keys',
    name: 'Square floor, white keys',
    category: 'pad',
    description:
      'Squares with a sub octave stagger by thirds inside the key under a quick tremble of tone, a chord every two seconds.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds descending',
      params: { time: 2, rhythm: 1, step: 0.36, keep: 2, word: 3, bass: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: { attack: 0.1, release: 0.9, cutoff: 900 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-a-filter-keeps-c',
    name: 'A filter keeps C',
    category: 'keys',
    description:
      'A filter that sings C itself while six chords that hold a C rock beneath it, detuned a little each side.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.75, rhythm: 4, step: 0.29, ring: 0.7, bass: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.02, release: 0.7, resonance: 0.9 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-white-keys-by-chance',
    name: 'White keys, by chance',
    category: 'pad',
    description:
      'A chance walk that never leaves the white keys opens slowly, each chord spread over a second, its short tail sparkling.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Slow white keys',
      params: { time: 2.3, step: 0.45, bass: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { attack: 0.35, release: 1.2, cutoff: 420 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Quick sparkle', params: { mix: 0.25 } }],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-hushed-word-celesta',
    name: 'Hushed word, celesta',
    category: 'organ',
    description:
      'A drawn word melts under a square organ, and a celesta strikes whatever has just moved, in a cabinet hardly turning.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, hushed',
      params: { time: 1.2, octave: 0, step: 0.15 },
      parts: { top: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -11 } } },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: { release: 0.5, cutoff: 1300, volume: -14 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: TWO_BREATHS,
  },
  {
    id: 'one-voice-moves-each-entry-dims',
    name: 'Each entry dims',
    category: 'string',
    description:
      'Strings that start bright and darken as they swell, the moved voice first at every change, over an upright bass on the root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Six chords round',
      params: { time: 1.75, step: 0.35 },
      parts: { bass: { deviceId: 'string-bass', preset: 'Round upright', params: { volume: -2 } } },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Dimming strings',
      params: { attack: 0.4, release: 0.7, cutoff: 4200 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Plain echo', params: { time: 400, mix: 0.2 } }],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-reed-rock-white-keys',
    name: 'Reed rock, white keys',
    category: 'wind',
    description:
      'Soft square clarinets rock through white-key chords by thirds, and a bright soprano reed takes a note that stayed.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { time: 1.75, step: 0.29, octave: -1 },
      parts: { top: { deviceId: 'clarinet', preset: 'Bright soprano', params: { volume: -8 } } },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft clarinets',
      params: { attack: 0.05, release: 0.4, cutoff: 1000 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } }],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-vowels-around-one-c',
    name: 'Vowels around one C',
    category: 'voice',
    description:
      'Thin singing pulses melt through every chord that holds C, with a hall behind that answers in vowels.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One third, six ways',
      params: { time: 2, rhythm: 0, step: 0.3 },
    },
    instrument: { deviceId: 'dusk', preset: 'Thin voices', params: { attack: 0.25, release: 1 } },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
      { deviceId: 'currents', preset: 'Nearly still' },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-climb-to-the-far-chord',
    name: 'Climb to the far chord',
    category: 'pad',
    description:
      'A filter climbs the overtones of each voice as three moves carry the chord across the cycle, phased slowly.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Far pole',
      params: { time: 2.3, step: 0.25, bass: 0 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Overtone climb',
      params: { attack: 0.6, release: 1.2, cutoff: 320, resonance: 0.6, volume: -11 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
    preview: LOW_TENTH,
  },
  {
    id: 'one-voice-moves-down-and-the-way-home',
    name: 'Down, and the way home',
    category: 'keys',
    description:
      'Warm keys break each chord downward, four steps of P and R out and four home, on a new record with a dark echo.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'There and back',
      params: { time: 1.2, step: 0.2, top: 0 },
    },
    instrument: { deviceId: 'dusk', preset: 'Warm keys', params: { release: 0.6, cutoff: 620 } },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.2 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-stopped-pipes-agree',
    name: 'Stopped pipes agree',
    category: 'organ',
    description:
      'Stopped square pipes climb each chord note by note, by thirds and nearly in the key, sounding inside a longer pipe.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds climbing',
      params: { time: 1.2, rhythm: 2, step: 0.2, ring: 0.8, keep: 1 },
    },
    instrument: {
      deviceId: 'dusk',
      preset: 'Stopped pipe',
      params: { attack: 0.02, release: 0.35 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-violins-between-reels',
    name: 'Violins between reels',
    category: 'string',
    description:
      'Three taped violins keep two notes and change one, set out again when the hand turns minor, over a low bowed C.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 1.2, step: 0.12, top: 0 },
      parts: {
        bass: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.3, release: 1, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { attack: 0.03, release: 0.3 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Warm floor' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    preview: THIRD_LET_DOWN,
  },
  {
    id: 'one-voice-moves-strings-in-three-minds',
    name: 'Strings in three minds',
    category: 'string',
    description:
      'Slow taped strings go by chance and nearly in the key, each chord told by one player after another, under an overcast sky.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Borrowed light',
      params: { time: 2.3, rhythm: 1, step: 0.4, bass: 0, seed: 27 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.25, release: 0.9 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Overcast' },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-chorale-with-a-hinge',
    name: 'Chorale with a hinge',
    category: 'wind',
    description:
      'A taped horn chorale turns on the notes it shares, L before P, with a tuba on the root of every chord.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 1.2, step: 0.15, top: 0, bass: 1 },
      parts: {
        bass: {
          deviceId: 'horns',
          preset: 'Soft tuba',
          params: { attack: 0.08, release: 0.5, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Horn chorale',
      params: { attack: 0.08, release: 0.5 },
    },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
    preview: ONE_FINGER,
  },
  {
    id: 'one-voice-moves-half-speed-neighbours',
    name: 'Half-speed neighbours',
    category: 'wind',
    description:
      'Half-speed horns, an octave low, stagger by major thirds every 2.3 seconds, through an amplifier down the hall.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Major thirds',
      params: { time: 2.3, step: 0.5, octave: 0, bass: 0 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.15, release: 0.9, tone: 0.5 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { mix: 0.7 } }],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-flutes-share-a-breath',
    name: 'Flutes share a breath',
    category: 'wind',
    description:
      'Taped flutes an octave up break each chord upward through a drawn word, their notes let go early.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { time: 1.2, step: 0.2, ring: 0.6, octave: 1, seed: 3 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { release: 0.2, attack: 0.01, volume: -4.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.2, time: 300 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
    preview: KEYS_ADDED,
  },
  {
    id: 'one-voice-moves-reeds-that-rock-home',
    name: 'Reeds that rock home',
    category: 'wind',
    description:
      'Taped reeds rock out to C minor and E flat and home to C, over a fingered electric bass that keeps the C.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Four chord loop',
      params: { time: 1.45, step: 0.24, ring: 0.6 },
      parts: { bass: { deviceId: 'string-bass', preset: 'Warm fingers', params: { volume: -13 } } },
    },
    instrument: { deviceId: 'tape-orchestra', preset: 'Orchestra reeds', params: { release: 0.2 } },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25 } },
      { deviceId: 'saturator', preset: 'Warm glue' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-choir-on-two-held-notes',
    name: 'Choir on two held notes',
    category: 'voice',
    description:
      'A taped choir changes one part a chord and keeps two, with a vibraphone on the part that moved and pedal roots.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.2, step: 0.1, top: 1, bass: 1 },
      parts: {
        top: { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -15 } },
        bass: { deviceId: 'organ', preset: 'Deep pedal', params: { volume: -18 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.12, release: 0.7, volume: -12.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.28, decay: 7 } }],
    preview: TWO_BREATHS,
  },
  {
    id: 'one-voice-moves-worn-by-every-pass',
    name: 'Worn by every pass',
    category: 'voice',
    description:
      'A worn taped choir staggers through the six chords round A, the note that moved first, falling a little as it fades.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.75, step: 0.3, bass: 0 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { attack: 0.12, release: 0.7 },
    },
    effects: [
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } },
      { deviceId: 'spread', preset: 'Hazy edges' },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-cellos-under-still-glass',
    name: 'Cellos under still glass',
    category: 'string',
    description:
      'Half-speed cellos an octave low stagger by minor thirds, and slow glass sounds a note that stayed, high above.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Minor thirds',
      params: { time: 2.6, rhythm: 1, step: 0.45, bass: 0 },
      parts: {
        top: {
          deviceId: 'fm-glass',
          preset: 'Slow glass',
          params: { attack: 0.03, release: 1, volume: -15.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { attack: 0.2, release: 1 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Muffled choir', params: { mix: 0.18 } }],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-run-out-if-you-stay',
    name: 'Run out if you stay',
    category: 'string',
    description:
      'Short tape on every key: a note nobody moves runs out after two seconds, and only the voices that step go on sounding.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.45, step: 0.15 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: { length: 2.1, tone: -0.2, attack: 0.02, hiss: 0.35 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-low-reeds-round-one-c',
    name: 'Low reeds round one C',
    category: 'wind',
    description:
      'Half-speed reeds on chords that all keep one C, broken downward and tied, what two chords share left hanging behind.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One third, six ways',
      params: { time: 2.3, step: 0.45, ring: 0.9, octave: 1 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Low reeds',
      params: { attack: 0.06, release: 0.6 },
    },
    effects: [
      { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-flutes-that-keep-still',
    name: 'Flutes that keep still',
    category: 'wind',
    description:
      'Plain taped flutes break white-key chords downward by thirds, an alto flute above on a note that stayed.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { time: 1.75, rhythm: 3, step: 0.29, ring: 0.5 },
      parts: { top: { deviceId: 'flute', preset: 'Alto flute', params: { volume: -15 } } },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { attack: 0.03, release: 0.4, volume: -4.5 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-brass-across-the-circle',
    name: 'Brass across the circle',
    category: 'pad',
    description:
      'Swelling brass crosses the cycle three moves at a time, voices entering a third of a second apart, a low horn on the root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Far pole',
      params: { time: 2.3, step: 0.35 },
      parts: {
        bass: {
          deviceId: 'horns',
          preset: 'Low brass choir',
          params: { attack: 0.2, release: 0.7, volume: -10 },
        },
      },
    },
    instrument: { deviceId: 'aurora', preset: 'Slow brass', params: { attack: 0.18, release: 1 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } }],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-horns-in-their-key',
    name: 'Horns in their key',
    category: 'wind',
    description:
      'Soft synthetic horns melt by thirds and never leave the white keys, a slow tide in the level, roots on a fretless.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { time: 2.6, rhythm: 0, step: 0.25, top: 0, bass: 1 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Singing fretless', params: { volume: -6.5 } },
      },
    },
    instrument: { deviceId: 'aurora', preset: 'Soft horns', params: { attack: 0.25, release: 1 } },
    effects: [
      { deviceId: 'breath', preset: 'Tide', params: { depth: 0.3 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-two-of-three-remain',
    name: 'Two of three remain',
    category: 'string',
    description:
      'Wide synthetic strings melt through the six-chord cycle, a chord each 1.2 seconds, into a long plate that hardly circles.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.2, step: 0.1 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { attack: 0.2, release: 0.9, brilliance: 3600, volume: -4 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
      { deviceId: 'around', preset: 'Barely moving' },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-night-parts-exchanged',
    name: 'Night parts exchanged',
    category: 'voice',
    description:
      'A resonant vowel-like pad staggers the six chords that hold E, over a low organ E, flown about by a flock of four.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.45, step: 0.28 },
      parts: { bass: { deviceId: 'organ', preset: 'Deep pedal', params: { volume: -13 } } },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 0.2, release: 0.9, lowCut: 250 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Slow drift', params: { birds: 4, mix: 0.35 } }],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-rocked-on-struck-metal',
    name: 'Rocked on struck metal',
    category: 'bell',
    description:
      'Ring-modulated brass rocks by thirds, L then R, each note cut to a short chime, a root on a low wooden knock.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds climbing',
      params: { time: 1.75, step: 0.26, ring: 0.45, bass: 1 },
      parts: { bass: { deviceId: 'fm-bass', preset: 'Wooden knock', params: { volume: -15 } } },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.01, swell: 0.1, release: 0.9, ring: 0.4, volume: -3.5 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Faint trail' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-short-brass-falling',
    name: 'Short brass, falling',
    category: 'wind',
    description:
      'Clipped brass breaks eight falling fifths upward and goes the eight back, two moves a chord, a short shaped room after each note.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Falling fifths',
      params: { time: 1.45, step: 0.24, ring: 0.4, turn: 1 },
    },
    instrument: { deviceId: 'aurora', preset: 'Short brass', params: { release: 0.3 } },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.3 } }],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-pipes-pass-one-note',
    name: 'Pipes pass one note',
    category: 'organ',
    description:
      'Still pipes say a drawn word of chords, staggered, and the pipe that moved speaks first, with open-fifth stops added to each.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { time: 1.2, rhythm: 1, step: 0.25, seed: 21 },
    },
    instrument: { deviceId: 'aurora', preset: 'Still pipes', params: { release: 0.5 } },
    effects: [
      { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
    preview: TWO_BREATHS,
  },
  {
    id: 'one-voice-moves-loose-reeds-lean-in',
    name: 'Loose reeds lean in',
    category: 'wind',
    description:
      'Wide-detuned reeds rock C into its minor while the hand later lets the third down itself, through a small bedside speaker.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Four chord loop',
      params: { time: 1.75, step: 0.25, ring: 0.8, bass: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { attack: 0.04, release: 0.4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.75 } },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
    ],
    preview: THIRD_LET_DOWN,
  },
  {
    id: 'one-voice-moves-muted-with-a-witness',
    name: 'Muted, with a witness',
    category: 'wind',
    description:
      'A muted brass tone steps by P and R one voice at a time, and a pedal steel repeats a note that has not moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Minor thirds',
      params: { time: 2, step: 0.3, bass: 0 },
      parts: { top: { deviceId: 'pedal-steel', preset: 'Singing lead', params: { volume: -11 } } },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Muted trumpet',
      params: { attack: 0.06, release: 0.6, lowCut: 700, resonance: 0.6 },
    },
    effects: [{ deviceId: 'distance', preset: 'A few steps back' }],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-silver-six-seconds',
    name: 'Silver, six seconds',
    category: 'string',
    description:
      'Silver strings take six seconds over each chord of the cycle, so a hand has to wait to hear one voice give way.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Six chords round',
      params: { time: 6, step: 1.4, bass: 0 },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.5, release: 1.4, brilliance: 6500, lowCut: 500, volume: -3.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen' },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-chimes-let-one-go',
    name: 'Chimes let one go',
    category: 'bell',
    description:
      'Ringing metal strings break each chord downward by P and R, out three steps and home, the mover tapped above on a kalimba.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'There and back',
      params: { turn: 4, time: 1.45, step: 0.24 },
      parts: { top: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -12 } } },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { release: 1.1, ring: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.15 } },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-vowel-opening-slowly',
    name: 'Vowel opening slowly',
    category: 'voice',
    description:
      'A vowel opens over each chord of five seconds as one voice moves a half step, over a sub that holds the first root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 5, step: 0.8, top: 0 },
      parts: {
        bass: {
          deviceId: 'sub-bass',
          preset: 'Slow swell',
          params: { attack: 0.5, release: 1.2, volume: -20 },
        },
      },
    },
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { attack: 0.8, release: 1.5 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
    preview: LOW_TENTH,
  },
  {
    id: 'one-voice-moves-picked-toward-e-flat',
    name: 'Picked toward E flat',
    category: 'plucked',
    description:
      'A clean guitar picks each chord upward, P then R, a minor third on with every pair, over fingered bass roots.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Minor thirds',
      params: { time: 1.45, rhythm: 2, step: 0.24, top: 0 },
      parts: { bass: { deviceId: 'string-bass', preset: 'Warm fingers', params: { volume: -9 } } },
    },
    instrument: { deviceId: 'guitar', preset: 'Glass neck', params: { sustain: 5, volume: 3 } },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-one-string-swelled',
    name: 'One string swelled',
    category: 'pad',
    description:
      'A guitar on the volume pedal, where only the string that moves is played again, at 2.3 seconds a chord.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 2.3, step: 0.4 },
    },
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { swell: 0.5 } },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.28 } },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-strum-that-leaves-slowly',
    name: 'Strum that leaves slowly',
    category: 'plucked',
    description:
      'Staggered plucks, the moved string first and loudest, by thirds inside the key, with an accordion breath on each root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds descending',
      params: { time: 1.75, rhythm: 1, step: 0.12, keep: 2 },
      parts: {
        bass: { deviceId: 'organ', preset: 'Accordion', params: { volume: -18, release: 0.4 } },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Slow strum', params: { sustain: 6, volume: -1 } },
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus', params: { mix: 0.7 } },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-baritone-in-six-shades',
    name: 'Baritone in six shades',
    category: 'plucked',
    description:
      'A dark baritone guitar an octave down rocks through chords that keep D as root, third or fifth, over the D itself.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One root, six skies',
      params: { time: 1.75, rhythm: 4, step: 0.29, ring: 0.8, octave: -1 },
      parts: { bass: { deviceId: 'fm-bass', preset: 'Deep weight', params: { volume: -26.5 } } },
    },
    instrument: { deviceId: 'guitar', preset: 'Dark baritone', params: { sustain: 6, volume: 3 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.22 } },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-palm-on-the-moving-note',
    name: 'Palm on the moving note',
    category: 'plucked',
    description:
      'Damped strings run quickly up a drawn word, eight a chord, the mover leading, with dotted bounces round them.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { time: 1.2, step: 0.145, ring: 0.8, seed: 33 },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { sustain: 2.5, hardness: 0.2, warmth: 1, pickup: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Squash', params: { inputGain: 31, outputGain: -9.5 } },
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 300, mix: 0.25 } },
    ],
    preview: LOW_TENTH,
  },
  {
    id: 'one-voice-moves-twelve-strings-let-down',
    name: 'Twelve strings let down',
    category: 'plucked',
    description:
      'A twelve string breaks each chord downward: four steps of P and R away, four home, a celesta on every mover.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'There and back',
      params: { time: 1.75, step: 0.25 },
      parts: { top: { deviceId: 'mallets', preset: 'Open celesta', params: { volume: -15.5 } } },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Twelve string',
      params: { sustain: 5, tone: 4000, volume: 4.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
    ],
    preview: LOW_TENTH,
  },
  {
    id: 'one-voice-moves-twang-two-held-over',
    name: 'Twang, two held over',
    category: 'plucked',
    description:
      'A bright bridge guitar strikes only the note that moves, L before P, and a surf tank drips after each.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 1, step: 0.1, top: 0, bass: 0 },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Bridge twang',
      params: { tone: 3800, hardness: 0.65, sustain: 9, volume: -6 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
      { deviceId: 'tamer', preset: 'Harsh sample' },
    ],
    preview: TWO_BREATHS,
  },
  {
    id: 'one-voice-moves-long-swell-to-the-pole',
    name: 'Long swell to the pole',
    category: 'pad',
    description:
      'Slow warm guitar swells, three moves to the far chord of the cycle and back, five seconds each way, over a string held singing.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Far pole',
      params: { time: 5, step: 0.6 },
      parts: {
        bass: {
          deviceId: 'bowed-string',
          preset: 'Quick sustain',
          params: { attack: 0.4, release: 0.9, volume: -12.5 },
        },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Slow warm swell',
      params: { swell: 0.9, sustain: 18 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, breathDepth: 0 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-thumb-on-a-fourth-chord',
    name: 'Thumb on a fourth chord',
    category: 'plucked',
    description:
      'A thumbed neck pickup rocks A minor, A and F sharp minor and back, and an electric bass thumbed at the neck keeps A.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Four chord loop',
      params: { time: 1.8, step: 0.3, ring: 0.9 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Thumb at the neck', params: { volume: -7 } },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Thumb and neck', params: { volume: 3 } },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-rolled-by-fifths',
    name: 'Rolled by fifths',
    category: 'plucked',
    description:
      'A harp-like guitar rolls falling fifths slowly upward over low harp roots, each chord two moves from the last.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Falling fifths',
      params: { time: 2.3, step: 0.38, ring: 0.9 },
      parts: { bass: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -5 } } },
    },
    instrument: { deviceId: 'guitar', preset: 'Harp roll', params: { sustain: 9, volume: 2 } },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'stereo-detune', preset: 'Faint width' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-hidden-pick-plain-reply',
    name: 'Hidden pick, plain reply',
    category: 'plucked',
    description:
      'A guitar with its pick hidden changes one note as the hand adds keys, and a harp plucks the one that moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 1.2, step: 0.15, top: 1 },
      parts: { top: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -2 } } },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Hidden pick',
      params: { sustain: 12, swell: 0.12, volume: 6 },
    },
    effects: [
      { deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.15 } },
      { deviceId: 'phaser', preset: 'Bass safe', params: { mix: 0.3 } },
    ],
    preview: KEYS_ADDED,
  },
  {
    id: 'one-voice-moves-clean-bell-lone-keeper',
    name: 'Clean bell, lone keeper',
    category: 'bell',
    description:
      'A bell-clean guitar breaks chords downward that keep one third, and glass repeats a note that stayed, in wide echoes.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One third, six ways',
      params: { time: 2.3, step: 0.38, ring: 0.8, top: 2 },
      parts: { top: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -14 } } },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Clean bell',
      params: { hardness: 0.5, sustain: 14, volume: 6 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.25 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-felt-and-who-was-moved',
    name: 'Felt, and who was moved',
    category: 'keys',
    description:
      'Felt strikes on one new note a chord, the other two glowing on, while a bowed cello holds the first root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 1.75, step: 0.2, top: 0 },
      parts: {
        bass: {
          deviceId: 'bowed-string',
          preset: 'Soft flautando',
          params: { attack: 0.4, release: 1, volume: -11.5 },
        },
      },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Felt afterglow',
      params: { decay: 2.5, fade: 1.8, bloom: 0.8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Felt and air' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
    preview: HELD_C,
  },
  {
    id: 'one-voice-moves-bells-left-in-common',
    name: 'Bells left in common',
    category: 'bell',
    description:
      'Halo bells walk by thirds in the key, every bell of the chord struck in turn, over low bars on the roots.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds descending',
      params: { time: 1.5, rhythm: 1, step: 0.25, keep: 2 },
      parts: {
        bass: { deviceId: 'twin-bars', preset: 'Dark soft metal', params: { volume: -7.5 } },
      },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bell halo',
      params: { decay: 3, fade: 2, bloom: 0.8, halo: 0.3 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } }],
    preview: TWO_BREATHS,
  },
  {
    id: 'one-voice-moves-breath-on-two-panes',
    name: 'Breath on two panes',
    category: 'pad',
    description:
      'Breathy glass goes by major thirds two octaves up, each chord two moves from the last and three seconds long.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Major thirds',
      params: { time: 3, step: 0.5, bass: 0, octave: 2 },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Glass breath',
      params: { bloom: 0.7, fade: 2, strike: 0.25 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.5 } },
      { deviceId: 'spread', preset: 'Air only' },
    ],
    preview: LOW_TENTH,
  },
  {
    id: 'one-voice-moves-plucked-then-agreed',
    name: 'Plucked, then agreed',
    category: 'plucked',
    description:
      'Low plucks that turn to haze sink by L and R, rocked, staying nearly in key, with a breathy tenor reed on each new note.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds climbing',
      params: { time: 2.3, step: 0.36, ring: 0.6, keep: 1, top: 1, octave: -1 },
      parts: {
        top: {
          deviceId: 'clarinet',
          preset: 'Subtone tenor',
          params: { attack: 0.06, release: 0.4, volume: -11 },
        },
      },
    },
    instrument: { deviceId: 'afterglow', preset: 'Pluck and haze', params: { fade: 1.2 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 540, mix: 0.18 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-only-what-is-left-lit',
    name: 'Only what is left lit',
    category: 'pad',
    description:
      'No strike at all: the glow alone melts round the fifth it keeps, 2.6 seconds a chord, with a viol answering the keeper.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One fifth holding',
      params: { time: 2.6, step: 0.5, bass: 0 },
      parts: {
        top: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.2, release: 0.7, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the glow',
      params: { bloom: 0.5, fade: 1.8 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-strikes-by-lot',
    name: 'Strikes by lot',
    category: 'keys',
    description:
      'Bare felt strikes with no glow take a chance walk on the white keys, broken downward, on a dull-sounding record.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { word: 10, time: 1.75, rhythm: 3, step: 0.26, ring: 0.7, top: 0, seed: 14 },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Only the strike',
      params: { decay: 1.8, tone: 0.4 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-dark-felt-six-hours',
    name: 'Dark felt, six hours',
    category: 'keys',
    description:
      'Dark felt and a sub: the six chords of the cycle staggered at six seconds each, so a whole round takes over half a minute.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Six chords round',
      params: { time: 6, step: 1 },
      parts: {
        bass: { deviceId: 'sub-bass', preset: 'Pedal tone', params: { volume: -19, release: 1 } },
      },
    },
    instrument: { deviceId: 'afterglow', preset: 'Dark felt', params: { fade: 2.5, volume: -6 } },
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker', params: { mix: 0.5 } },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
    preview: LOW_TENTH,
  },
  {
    id: 'one-voice-moves-chimes-trade-a-corner',
    name: 'Chimes trade a corner',
    category: 'bell',
    description:
      'Bright chimes run six chords out by a drawn word, nearly in the key, and six home, the mover first, in little flutters.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, rolling',
      params: { time: 1.2, step: 0.24, ring: 0.6, seed: 41, keep: 1, turn: 2 },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Bright chimes',
      params: { fade: 1, decay: 1.5, tone: 0.65 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Short flutter', params: { mix: 0.2 } },
      { deviceId: 'reveal', preset: 'Half lit' },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-shimmer-told-in-order',
    name: 'Shimmer told in order',
    category: 'keys',
    description:
      'Haloed keys stagger from each chord the hand lays to its other mode and on, the moved note first, a magnet-driven bass on the root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Minor thirds',
      params: { time: 1.2, rhythm: 1, step: 0.22, top: 0 },
      parts: {
        bass: {
          deviceId: 'magnet-piano',
          preset: 'Low magnets',
          params: { volume: -16.5, bloom: 0.15 },
        },
      },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Shimmer keys',
      params: { fade: 1.5, bloom: 0.6, halo: 0.5 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only' },
    ],
    preview: D_THEN_G,
  },
  {
    id: 'one-voice-moves-harp-goes-three-and-home',
    name: 'Harp goes three and home',
    category: 'plucked',
    description:
      'A harp that turns to air steps three chords out by a drawn word and three home, rocked, over a growling fretless on the roots.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Own word, hushed',
      params: { turn: 4, time: 1.2, rhythm: 4, step: 0.2, ring: 0.8, octave: 0, top: 0, bass: 1 },
      parts: {
        bass: { deviceId: 'string-bass', preset: 'Growling fretless', params: { volume: -11 } },
      },
    },
    instrument: {
      deviceId: 'afterglow',
      preset: 'Harp into air',
      params: { bloom: 1.5, fade: 1.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-throats-keep-the-drone',
    name: 'Throats keep the drone',
    category: 'voice',
    description:
      'Three throats hold their chord and one moves at a time, whistled harmonics crossing over a held root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Other way round',
      params: { time: 2.3, step: 0.2, top: 0 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: { volume: -13.5, pace: 0.8 },
    },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
      { deviceId: 'ambient-eq', preset: 'Open' },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-whistle-finds-the-mover',
    name: 'Whistle finds the mover',
    category: 'voice',
    description:
      'A still whistle sits on every note of the cycle, lit in turn as each enters, over slow roots on a reed box.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Six chords round',
      params: { time: 2.3, step: 0.4, octave: -1 },
      parts: {
        bass: {
          deviceId: 'organ',
          preset: 'Shruti box',
          params: { attack: 0.2, release: 0.8, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { attack: 0.2, release: 1.2, overtone: 10 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.22 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
    preview: G_ABOVE,
  },
  {
    id: 'one-voice-moves-growl-of-three-elders',
    name: 'Growl of three elders',
    category: 'voice',
    description:
      'A growled chord crosses to the far chord and back every 2.3 seconds, its voices a half second apart.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Far pole',
      params: { time: 2.3, step: 0.45, bass: 0, octave: -1 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Low growl',
      params: { attack: 0.12, release: 0.9 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.28 } }],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-pipes-over-one-fifth',
    name: 'Pipes over one fifth',
    category: 'organ',
    description:
      'Drone pipes whose chords all keep the first fifth, struck one after another, with a low harp on each root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One fifth holding',
      params: { time: 2, rhythm: 1, step: 0.35, top: 0 },
      parts: { bass: { deviceId: 'harp', preset: 'Dark hollow harp', params: { volume: -4 } } },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { attack: 0.1, release: 0.7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-jaw-harps-in-relay',
    name: 'Jaw harps in relay',
    category: 'plucked',
    description:
      'Jaw harps break each chord upward through R and L, a note each quarter second, staying in the key.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Thirds descending',
      params: { time: 1.75, step: 0.25, ring: 0.5, keep: 2, bass: 0 },
    },
    instrument: { deviceId: 'overtone', preset: 'Jaw harp', params: { pace: 2.5 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.22 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: D_THEN_G,
  },
  {
    id: 'one-voice-moves-chant-with-one-absentee',
    name: 'Chant with one absentee',
    category: 'voice',
    description:
      'A slow chant loses one note and gains its neighbour every five seconds, with a bass voice on the root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Hexatonic melt',
      params: { time: 5, step: 0.8, bass: 1 },
      parts: {
        bass: {
          deviceId: 'choir',
          preset: 'Basses ah',
          params: { attack: 0.5, release: 1.2, volume: -8.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { attack: 0.6, release: 1.8 },
    },
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
      { deviceId: 'breath', preset: 'Barely there' },
    ],
    preview: OPEN_FIFTH,
  },
  {
    id: 'one-voice-moves-breath-passes-sideways',
    name: 'Breath passes sideways',
    category: 'wind',
    description:
      'Breathy pipes rock among white-key chords by chance, and a wood flute sounds a note that did not move.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'White key wander',
      params: { word: 10, time: 1.2, step: 0.2, ring: 0.8, seed: 7 },
      parts: { top: { deviceId: 'flute', preset: 'Soft recorder', params: { volume: -16 } } },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { attack: 0.04, release: 0.4, breath: 0.6 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.6 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: ONE_KEY,
  },
  {
    id: 'one-voice-moves-vowels-on-a-swivel',
    name: 'Vowels on a swivel',
    category: 'voice',
    description:
      'Open vowels melt through a chance walk that leaves the key, a chord each 2.8 seconds over one held root.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Long drift',
      params: { time: 2.8, rhythm: 0, step: 0.4, top: 0, seed: 4 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { attack: 0.2, release: 1 },
    },
    effects: [
      { deviceId: 'around', preset: 'Gentle sway' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.25 } },
    ],
    preview: WIDE_F,
  },
  {
    id: 'one-voice-moves-reeds-out-reeds-home',
    name: 'Reeds out, reeds home',
    category: 'organ',
    description:
      'A reed drone goes two chords out by thirds and two home, staggered, and its low root goes with it.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'Two out, two home',
      params: { time: 1.2, step: 0.22, octave: 0 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { attack: 0.06, release: 0.5, growl: 0.1 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
    ],
    preview: HELD_A_MINOR,
  },
  {
    id: 'one-voice-moves-glass-reed-half-steps',
    name: 'Glass reed, half steps',
    category: 'bell',
    description:
      'A glassy reed harmonic staggers through chords that keep one third, with a thin glass bar sounding each note that moved.',
    maker: {
      makerId: 'hexatonic-walker',
      preset: 'One third, six ways',
      params: { time: 1.8, rhythm: 1, step: 0.35, top: 1 },
      parts: { top: { deviceId: 'twin-bars', preset: 'Bright glass', params: { volume: -6.5 } } },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Glass harmonic',
      params: { attack: 0.15, release: 1.2, overtone: 8 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: THIRD_LET_DOWN,
  },
]
