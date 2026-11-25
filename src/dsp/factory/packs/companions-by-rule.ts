import { type FactoryPreset, type Phrase } from '../types'

// A line and the voice that keeps it company by a rule: the near, second or third note of one
// triad, a third, a sixth, a bare fifth or fourth, or two voices in old parallel style. Laid out
// instrument by instrument over the eight rules and the four sides, then over the tonic, the wait
// (none to three seconds), how many notes are answered, and what plays the second voice.

/** A line: gain, then each note as start, length and key. */
const line = (gain: number, ...notes: readonly (readonly [number, number, number])[]): Phrase => ({
  notes: notes.map(([atSec, durSec, note]) => ({ atSec, durSec, note, gain })),
})

// Up a fifth from A and back by step: what each note of a triad rule lands on is heard one by one.
const STEPS = line(
  0.65,
  [0, 0.7, 69],
  [0.75, 0.7, 71],
  [1.5, 0.7, 72],
  [2.25, 0.7, 74],
  [3, 0.7, 76],
  [3.75, 0.7, 74],
  [4.5, 0.7, 72],
  [5.25, 0.7, 71],
  [6, 1.2, 69],
)
// The same an octave lower, for horns, guitar and steel.
const LOW_STEPS = line(
  0.65,
  [0, 0.7, 57],
  [0.75, 0.7, 59],
  [1.5, 0.7, 60],
  [2.25, 0.7, 62],
  [3, 0.7, 64],
  [3.75, 0.7, 62],
  [4.5, 0.7, 60],
  [5.25, 0.7, 59],
  [6, 1.2, 57],
)
// The top of inverted triads: C up to E, down to B, home to C, where sixth and third draw out to octave and fifth.
const CHOIRBOOK = line(
  0.6,
  [0, 0.95, 72],
  [1, 0.75, 74],
  [1.8, 0.75, 76],
  [2.6, 0.75, 74],
  [3.4, 0.75, 72],
  [4.2, 0.8, 71],
  [5.1, 2, 72],
)
// The same an octave lower.
const LOW_CHOIRBOOK = line(
  0.6,
  [0, 0.95, 60],
  [1, 0.75, 62],
  [1.8, 0.75, 64],
  [2.6, 0.75, 62],
  [3.4, 0.75, 60],
  [4.2, 0.8, 59],
  [5.1, 2, 60],
)
// A bass from E to A and back: with sixths and thirds over it, F to E at the end is a Phrygian close.
const PHRYGIAN_BASS = line(
  0.65,
  [0, 0.95, 52],
  [1, 0.85, 53],
  [1.9, 0.85, 55],
  [2.8, 0.95, 57],
  [3.8, 0.7, 55],
  [4.6, 0.75, 53],
  [5.4, 1.8, 52],
)
// A bass from D to G and back: E to D at the end, with C to D and G to A over it, is a Dorian close.
const DORIAN_BASS = line(
  0.65,
  [0, 0.95, 50],
  [1, 0.85, 53],
  [1.9, 0.85, 52],
  [2.8, 0.95, 55],
  [3.8, 0.7, 53],
  [4.6, 0.75, 52],
  [5.4, 1.8, 50],
)
// Three held notes, E D C: each is long enough for the second voice to move to its cadence.
const OPENING = line(0.6, [0, 2.2, 76], [2.35, 2.2, 74], [4.7, 2.5, 72])
// Three held sighs, F E D, for cadences on D.
const SIGHS = line(0.6, [0, 2.2, 77], [2.35, 2.2, 76], [4.7, 2.5, 74])
// The same an octave lower.
const LOW_SIGHS = line(0.6, [0, 2.2, 65], [2.35, 2.2, 64], [4.7, 2.5, 62])
// Two short breaths with a rest after each, for a companion that answers in the rest.
const BREATHS = line(
  0.65,
  [0, 0.55, 69],
  [0.6, 0.55, 72],
  [1.2, 1, 76],
  [3.6, 0.55, 74],
  [4.2, 0.55, 71],
  [4.8, 1.1, 69],
)
// Two calls from the lower half, over the notes of C and then of G.
const CALLS = line(
  0.65,
  [0, 0.6, 55],
  [0.65, 0.6, 60],
  [1.3, 1, 64],
  [3.6, 0.6, 62],
  [4.25, 0.6, 59],
  [4.9, 1.1, 60],
)
// A leaping figure, E A C B, and the same a step lower, D G B A: the second voice leaps less than the line.
const LEAPS = line(
  0.62,
  [0, 0.75, 76],
  [0.8, 0.75, 69],
  [1.6, 0.75, 72],
  [2.4, 0.95, 71],
  [3.4, 0.75, 74],
  [4.2, 0.75, 67],
  [5, 0.75, 71],
  [5.8, 1.3, 69],
)
// Down an octave from high A, a step at a time: the voice from behind stays over it all the way.
const FALL = line(
  0.6,
  [0, 0.8, 81],
  [0.85, 0.8, 79],
  [1.7, 0.8, 77],
  [2.55, 0.8, 76],
  [3.4, 0.8, 74],
  [4.25, 0.8, 72],
  [5.1, 0.8, 71],
  [5.95, 1.3, 69],
)
// Groups of three whose first notes spell A C E, E C A: every third note is a strong one.
const THREES = line(
  0.62,
  [0, 0.36, 69],
  [0.4, 0.36, 72],
  [0.8, 0.36, 71],
  [1.2, 0.36, 72],
  [1.6, 0.36, 76],
  [2, 0.36, 74],
  [2.4, 0.36, 76],
  [2.8, 0.36, 79],
  [3.2, 0.36, 77],
  [3.6, 0.36, 76],
  [4, 0.36, 72],
  [4.4, 0.36, 74],
  [4.8, 0.36, 72],
  [5.2, 0.36, 69],
  [5.6, 0.36, 71],
  [6, 1, 69],
)
// The same an octave lower.
const LOW_THREES = line(
  0.62,
  [0, 0.36, 57],
  [0.4, 0.36, 60],
  [0.8, 0.36, 59],
  [1.2, 0.36, 60],
  [1.6, 0.36, 64],
  [2, 0.36, 62],
  [2.4, 0.36, 64],
  [2.8, 0.36, 67],
  [3.2, 0.36, 65],
  [3.6, 0.36, 64],
  [4, 0.36, 60],
  [4.4, 0.36, 62],
  [4.8, 0.36, 60],
  [5.2, 0.36, 57],
  [5.6, 0.36, 59],
  [6, 1, 57],
)
// Four chords, Am, Dm over A, Em over G, Am, whose top goes C D B C: the rule follows the bottom or all.
const CHORDS = line(
  0.5,
  [0, 1.6, 57],
  [0, 1.6, 64],
  [0, 1.6, 72],
  [1.75, 1.6, 57],
  [1.75, 1.6, 65],
  [1.75, 1.6, 74],
  [3.5, 1.6, 55],
  [3.5, 1.6, 64],
  [3.5, 1.6, 71],
  [5.25, 1.9, 57],
  [5.25, 1.9, 64],
  [5.25, 1.9, 72],
)
// Open chords on C, D, F and C, for a voice under the lowest note of each.
const OPEN_CHORDS = line(
  0.5,
  [0, 1.6, 60],
  [0, 1.6, 67],
  [0, 1.6, 72],
  [1.75, 1.6, 62],
  [1.75, 1.6, 69],
  [1.75, 1.6, 74],
  [3.5, 1.6, 65],
  [3.5, 1.6, 72],
  [3.5, 1.6, 76],
  [5.25, 1.9, 60],
  [5.25, 1.9, 67],
  [5.25, 1.9, 72],
)
// A Dorian tune over a held fifth on D: only the tune, on top, has a companion.
const PEDAL: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.2, note: 50, gain: 0.36 },
    { atSec: 0, durSec: 7.2, note: 57, gain: 0.32 },
    { atSec: 0, durSec: 1.1, note: 69, gain: 0.6 },
    { atSec: 1.2, durSec: 0.75, note: 72, gain: 0.6 },
    { atSec: 2, durSec: 0.75, note: 71, gain: 0.6 },
    { atSec: 2.8, durSec: 0.95, note: 69, gain: 0.6 },
    { atSec: 3.8, durSec: 0.75, note: 67, gain: 0.6 },
    { atSec: 4.6, durSec: 0.75, note: 65, gain: 0.6 },
    { atSec: 5.4, durSec: 0.75, note: 64, gain: 0.6 },
    { atSec: 6.2, durSec: 1, note: 62, gain: 0.6 },
  ],
}
// Overlapping neighbours in pairs, D E, G F, E D, which a steel bends from one into the other.
const SLIDES = line(
  0.65,
  [0, 1.3, 62],
  [1.1, 1.1, 64],
  [2.4, 1.2, 67],
  [3.4, 1.1, 65],
  [4.7, 1.1, 64],
  [5.6, 1.6, 62],
)
// Four long notes, D F G E, for a voice that takes its time.
const SLOW = line(0.6, [0, 1.65, 62], [1.75, 1.65, 65], [3.5, 1.65, 67], [5.25, 1.95, 64])
// A low chant round A: one note at a time, a step or a third from home.
const CHANT = line(
  0.65,
  [0, 1.15, 45],
  [1.2, 0.85, 47],
  [2.1, 1.15, 48],
  [3.3, 0.85, 47],
  [4.2, 0.85, 45],
  [5.1, 0.85, 43],
  [6, 1.2, 45],
)

export const PRESETS: readonly FactoryPreset[] = [
  // Horns
  {
    id: 'companions-by-rule-tower-under-the-horn',
    name: 'Tower under the horn',
    category: 'wind',
    description:
      'A solo horn, and with each note the nearest A minor note below it on a dull church bell that rings on.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell under',
      params: { ring: 1.2, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'modal-bells',
          preset: 'Distant bell',
          params: { decay: 6, volume: -1.5 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Solo horn',
      params: { volume: -1, attack: 0.12, release: 0.8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
  },
  {
    id: 'companions-by-rule-called-and-tined',
    name: 'Called and tined',
    category: 'wind',
    description:
      'A breathy flugelhorn whose notes are each answered half a second on, over it in C major, by a soft tine piano.',
    preview: CALLS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { tonic: 1, delay: 0.5, ring: 0.6, level: 0.7 },
      parts: {
        companion: { deviceId: 'tine-piano', preset: 'Bell tines', params: { volume: -12 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { volume: -1.5, attack: 0.1, release: 0.6 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 500 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-brass-from-the-choirbook',
    name: 'Brass from the choirbook',
    category: 'wind',
    description:
      'Low brass in inverted triads under its own tune; a note held a second sinks to an open octave and fifth.',
    preview: LOW_CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sung in three',
      params: { opens: 1, ring: 0.1, level: 0.75 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { attack: 0.25, release: 0.7, blow: 0.45 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25, decay: 0.6 } },
    ],
  },
  {
    id: 'companions-by-rule-mute-on-either-side',
    name: 'Mute on either side',
    category: 'wind',
    description:
      'A muted trumpet with a second one beside it, under one note and over the next, always on A, C or E.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { delay: 0.12, ring: 0.1, level: 0.65 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { volume: -0.5, attack: 0.06, release: 0.5 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.2 } },
      { deviceId: 'distance', preset: 'A few steps back' },
    ],
  },
  {
    id: 'companions-by-rule-band-in-bare-fifths',
    name: 'Band in bare fifths',
    category: 'wind',
    description:
      'A full band of trumpets in chords, a bare fifth under each note wherever that key is free, glued by slow compression.',
    preview: OPEN_CHORDS,
    maker: { makerId: 'companion-voice', preset: 'Bare fifths', params: { level: 0.45 } },
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { attack: 0.2, release: 0.7, blow: 0.5, volume: -6 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-reed-below-the-ballad',
    name: 'Reed below the ballad',
    category: 'wind',
    description:
      'A ballad trumpet with a clarinet a sixth under it, which falls on to the octave under any note held a second.',
    preview: OPENING,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { opens: 1, ring: 0.1, level: 0.8 },
      parts: {
        companion: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -9 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Ballad trumpet',
      params: { volume: -0.5, vibrato: 0.5, blow: 0.35 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'companions-by-rule-frost-over-the-ridge',
    name: 'Frost over the ridge',
    category: 'wind',
    description:
      'A horn section that swells in half a second; every other note throws a glass bell nearly two octaves over it.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { ring: 2, level: 0.5 },
      parts: {
        companion: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -10 } },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 0.5, release: 1.2, blow: 0.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 5, mix: 0.3 } },
    ],
  },
  {
    id: 'companions-by-rule-bows-over-a-tuba',
    name: 'Bows over a tuba',
    category: 'bass',
    description:
      'A soft tuba as the bass, short bows a third and a sixth over it, opening to octave and fifth on every E.',
    preview: PHRYGIAN_BASS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Over the bass',
      params: { tonic: 3, cadence: 2, delay: 0.05, ring: 0.1, level: 0.7 },
      parts: {
        companion: { deviceId: 'chamber-strings', preset: 'Quiet duet', params: { volume: -10 } },
        third: { deviceId: 'chamber-strings', preset: 'Close solo', params: { volume: -12 } },
      },
    },
    instrument: { deviceId: 'horns', preset: 'Soft tuba', params: { attack: 0.15, release: 0.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } }],
  },
  {
    id: 'companions-by-rule-cut-from-one-stone',
    name: 'Cut from one stone',
    category: 'wind',
    description:
      'Muted brass with perfect fourths under it, two fifths of a second late, closing to the octave on every D.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { ring: 0.3, level: 0.75 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Muted brass swell',
      params: { volume: -1.5, attack: 0.3, release: 0.8, blow: 0.4 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.22, decay: 2.5 } },
    ],
  },
  {
    id: 'companions-by-rule-tenths-with-a-cello',
    name: 'Tenths with a cello',
    category: 'wind',
    description:
      'A flugelhorn section over one bowed low string that keeps a tenth below and drops to the C two octaves under a held C.',
    preview: CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Slow tenths',
      params: { opens: 1, ring: 0.1, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.15, release: 0.5, volume: -9 },
        },
      },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel choir',
      params: { attack: 0.3, release: 0.9 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-answer-from-the-far-bank',
    name: 'Answer from the far bank',
    category: 'wind',
    description:
      'A trombone calls; a second and a half later a muted trumpet gives back the second C major note over each tone.',
    preview: CALLS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { side: 1, delay: 1.5, ring: 0.2, level: 0.6 },
      parts: {
        companion: { deviceId: 'horns', preset: 'Muted distance', params: { volume: -5.5 } },
      },
    },
    instrument: { deviceId: 'horns', preset: 'Trombone', params: { volume: 1, blow: 0.65 } },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { distance: 0.5 } }],
  },
  {
    id: 'companions-by-rule-what-the-air-kept',
    name: 'What the air kept',
    category: 'wind',
    description:
      'A horn that is nearly all breath and plays the A minor note over each key in place of the key itself.',
    preview: LOW_STEPS,
    maker: { makerId: 'companion-voice', preset: 'Only the bell', params: { ring: 0.6 } },
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.2, release: 1, volume: -7.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry', params: { mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { decay: 3 } },
    ],
  },
  {
    id: 'companions-by-rule-three-seconds-off',
    name: 'Three seconds off',
    category: 'wind',
    description:
      'Wide horns that fade in slowly, and three seconds behind them two voices making inverted triads, by turns under and over.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Distant choirbook',
      params: { melody: 0.85, ring: 0.8 },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Glacial horns',
      params: { attack: 0.8, release: 1.6, blow: 0.6 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'companions-by-rule-pan-below-the-chorale',
    name: 'Pan below the chorale',
    category: 'wind',
    description:
      'Horns doubled a fourth below in open chords, and a low handpan on the second A minor note under the lowest of each.',
    preview: OPEN_CHORDS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Deep bell',
      params: { ring: 1.2, level: 0.9 },
      parts: { companion: { deviceId: 'handpan', preset: 'Low ding', params: { volume: -6 } } },
    },
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { attack: 0.25, release: 0.8, blow: 0.35, volume: -9.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Faint motion' },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },

  // Pedal steel
  {
    id: 'companions-by-rule-thirds-on-the-porch',
    name: 'Thirds on the porch',
    category: 'plucked',
    description:
      'A steel swelling into each note with itself a third of the key below, in a small dark spring.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Close thirds',
      params: { ring: 0.3, level: 0.7 },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Slow steel',
      params: { swell: 0.2, range: 0, sustain: 8 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Dark amp spring' }],
  },
  {
    id: 'companions-by-rule-wet-rim-and-steel',
    name: 'Wet rim and steel',
    category: 'plucked',
    description:
      'A dark steel that fades in, and over each note the nearest A minor note on a rubbed glass.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { ring: 0.8, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'modal-bells',
          preset: 'Glass harp',
          params: { decay: 4, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { volume: -4, swell: 0.5, sustain: 12 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Faint sheen' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'companions-by-rule-bent-over-an-upright',
    name: 'Bent over an upright',
    category: 'plucked',
    description:
      'A lap steel sliding from note to neighbour, with an upright bass on the D minor note under each, an octave down.',
    preview: SLIDES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell under',
      params: { tonic: 2, octave: -1, follow: 0, ring: 0.2, level: 0.8 },
      parts: {
        companion: { deviceId: 'string-bass', preset: 'Round upright', params: { volume: -4.5 } },
      },
    },
    instrument: { deviceId: 'pedal-steel', preset: 'Lap slide', params: { range: 3, pick: 0.6 } },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.1 } }],
  },
  {
    id: 'companions-by-rule-sixth-behind-the-slide',
    name: 'Sixth behind the slide',
    category: 'plucked',
    description:
      'A singing steel with a second a quarter second late, a sixth under while it rises and a sixth over while it falls.',
    preview: LEAPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sixths from behind',
      params: { ring: 0.4, level: 0.55 },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.3, range: 0, vibrato: 14, sustain: 10 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'companions-by-rule-picked-by-turns-in-f',
    name: 'Picked by turns in F',
    category: 'plucked',
    description:
      'A bright picked steel in threes; a celesta takes the second F major note over or under by turns, an octave up.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { tonic: 4, side: 2, octave: 1, ring: 0.5, level: 0.6 },
      parts: { companion: { deviceId: 'mallets', preset: 'Celesta', params: { volume: -9 } } },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { volume: -3.5, range: 0, sustain: 4 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-fourths-on-the-offbeat',
    name: 'Fourths on the offbeat',
    category: 'plucked',
    description:
      'A short twanging steel where every second note has a perfect fourth over it, a fifth of a second late.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { side: 1, every: 2, delay: 0.2, ring: 0.3, cadence: 0, level: 0.8 },
    },
    instrument: { deviceId: 'pedal-steel', preset: 'Short twang' },
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback' },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-round-thumb-low-fifth',
    name: 'Round thumb, low fifth',
    category: 'plucked',
    description:
      'A dark thumbed steel and a soft fretless bass a fifth and an octave under it, one bass note to every second note.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bare fifths',
      params: { octave: -1, follow: 1, every: 2, ring: 0.6, level: 0.85 },
      parts: {
        companion: {
          deviceId: 'string-bass',
          preset: 'Quiet deep fretless',
          params: { release: 0.4, volume: -8 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Round thumb',
      params: { range: 0, sustain: 7 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'patina', preset: 'New tape' },
    ],
  },
  {
    id: 'companions-by-rule-steel-with-two-singers',
    name: 'Steel with two singers',
    category: 'plucked',
    description:
      'A swelling steel as the lowest of three, an alto a third over it and a treble a sixth over, opened out on every C.',
    preview: LOW_CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Three rising',
      params: { ring: 0.1, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'choir',
          preset: 'Boys ooh',
          params: { attack: 0.15, release: 0.8, volume: -11 },
        },
        third: {
          deviceId: 'choir',
          preset: 'Altos eh',
          params: { attack: 0.15, release: 0.7, volume: -13 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long swell',
      params: { swell: 0.25, range: 0, sustain: 12, vibrato: 8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } }],
  },
  {
    id: 'companions-by-rule-string-in-no-hurry',
    name: 'String in no hurry',
    category: 'plucked',
    description:
      'A short blooming steel in two breaths, and a second and a half after each note a felted string on the D minor note below.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Late bell',
      params: { delay: 1.5, ring: 0.8, level: 0.75 },
      parts: {
        companion: { deviceId: 'zither', preset: 'Single felt string', params: { volume: -8 } },
      },
    },
    instrument: { deviceId: 'pedal-steel', preset: 'Short bloom', params: { volume: 5 } },
    effects: [
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'around', preset: 'Gentle sway' },
    ],
  },
  {
    id: 'companions-by-rule-downbeats-on-cold-bars',
    name: 'Downbeats on cold bars',
    category: 'plucked',
    description:
      'A bright fading steel in threes; the first of each three sets a vibraphone ringing on the third E minor note over it.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { tonic: 3, octave: 0, every: 3, ring: 3, level: 0.75 },
      parts: { companion: { deviceId: 'mallets', preset: 'Motor vibes', params: { volume: -8 } } },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Fading swell',
      params: { swell: 0.08, range: 0 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-bends-come-home-to-d',
    name: 'Bends come home to D',
    category: 'plucked',
    description:
      'A soft steel with its second D minor note over it on a reed; held for a second, each finds the D above.',
    preview: LOW_SIGHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Homecoming',
      params: { opens: 1, ring: 0.2, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'clarinet',
          preset: 'Reed hum',
          params: { attack: 0.2, release: 0.6, volume: -6 },
        },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Soft bends',
      params: { volume: -3.5, range: 2, sustain: 8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil' },
    ],
  },
  {
    id: 'companions-by-rule-wide-sixth-shaken',
    name: 'Wide sixth, shaken',
    category: 'plucked',
    description:
      'A wide-shaking steel with a sixth over each note on a nylon string, an octave where the line touches G.',
    preview: SLIDES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { side: 1, tonic: 5, follow: 0, cadence: 2, ring: 0.6, level: 0.7 },
      parts: {
        companion: { deviceId: 'acoustic-guitar', preset: 'Nylon dusk', params: { volume: -8 } },
      },
    },
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Wide shake',
      params: { vibrato: 22, sustain: 10, range: 0, swell: 0.1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },

  // Tape orchestra
  {
    id: 'companions-by-rule-three-reels-one-book',
    name: 'Three reels, one book',
    category: 'string',
    description:
      'Tape violins with tape cellos a sixth under and tape reeds a fourth under, all three at the open octave on C.',
    preview: CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sung in three',
      params: { cadence: 2, ring: 0.05, level: 0.75 },
      parts: {
        companion: {
          deviceId: 'tape-orchestra',
          preset: 'Cello section',
          params: { attack: 0.05, release: 0.4, volume: -10 },
        },
        third: { deviceId: 'tape-orchestra', preset: 'Orchestra reeds', params: { volume: -14 } },
      },
    },
    instrument: { deviceId: 'tape-orchestra', preset: 'Three violins' },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'tape', preset: 'Clean transfer' },
    ],
  },
  {
    id: 'companions-by-rule-bell-inside-the-strings',
    name: 'Bell inside the strings',
    category: 'string',
    description:
      'Slow tape strings over a held fifth; the tune on top strikes a church bell on the D minor note under it.',
    preview: PEDAL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell under',
      params: { tonic: 2, ring: 1.5, level: 0.55 },
      parts: {
        companion: {
          deviceId: 'modal-bells',
          preset: 'Church bell',
          params: { decay: 5, hardness: 0.5, volume: -6 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Slow strings',
      params: { attack: 0.35, release: 0.9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } }],
  },
  {
    id: 'companions-by-rule-organum-on-horn-tape',
    name: 'Organum on horn tape',
    category: 'wind',
    description:
      'Taped horns in plain chords where the lowest note alone has a fifth under it, and every second one only.',
    preview: CHORDS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bare fifths',
      params: { follow: 2, every: 2, ring: 0.8, level: 0.9 },
    },
    instrument: { deviceId: 'tape-orchestra', preset: 'Horn chorale', params: { release: 0.5 } },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'companions-by-rule-sixths-at-half-speed',
    name: 'Sixths at half speed',
    category: 'wind',
    description:
      'Horn tape run slow, an octave down, with a low flute a sixth over the written note, stepping to the octave when it is held.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { side: 1, opens: 0.9, ring: 0.1, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'flute',
          preset: 'Alto flute',
          params: { attack: 0.05, release: 0.5, volume: -12 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { attack: 0.15, release: 0.9 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.12 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-thirds-in-the-gaps',
    name: 'Thirds in the gaps',
    category: 'wind',
    description:
      'Taped flutes breathe twice; a second and three quarters on, thirds come back, one under and the next one over.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Thirds in answer',
      params: { delay: 1.75, ring: 0.1, level: 0.7 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { volume: -4.5, age: 0.25 },
    },
    effects: [
      { deviceId: 'around', preset: 'Slow eight', params: { radius: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-reed-rows-in-g',
    name: 'Reed rows in G',
    category: 'wind',
    description:
      'Taped reeds with their own second G major note on the side the line has come from, a sixth of a second late.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { tonic: 5, side: 3, delay: 0.16, ring: 0.05, level: 0.7 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { players: 0.2, tone: 0.4 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled' },
      { deviceId: 're-amp', preset: 'Just the room', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'companions-by-rule-pipes-above-the-tape',
    name: 'Pipes above the tape',
    category: 'voice',
    description:
      'A taped choir in the middle and, with each note, flute pipes on the third A minor note over it.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { octave: 0, every: 1, ring: 0.2, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'organ',
          preset: 'Tremulant flute',
          params: { attack: 0.06, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { volume: -4.5, attack: 0.1, release: 0.6 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.25 } }],
  },
  {
    id: 'companions-by-rule-fourths-from-a-worn-reel',
    name: 'Fourths from a worn reel',
    category: 'voice',
    description:
      'A worn choir tape with fourths of its own under it, most of a second late and held on a little, an octave under any A.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { tonic: 6, delay: 0.85, ring: 0.4, level: 0.7 },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { volume: -5, attack: 0.2, release: 0.9 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-flute-a-tenth-above',
    name: 'Flute a tenth above',
    category: 'string',
    description:
      'A bed of slowed cellos under a wooden flute that moves with it a tenth above and leaps on to A when A is held.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Slow tenths',
      params: { side: 1, octave: 0, tonic: 6, opens: 0.75, ring: 0.1, level: 0.65 },
      parts: {
        companion: {
          deviceId: 'flute',
          preset: 'Canyon flute',
          params: { scoop: 10, volume: -14 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { volume: -4, attack: 0.2, release: 0.8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-found-two-seconds-later',
    name: 'Found two seconds later',
    category: 'texture',
    description:
      'Slowed, worn flute tape; two seconds after each note a magnet-driven piano string swells on the F major note above.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Late bell',
      params: { tonic: 4, side: 1, delay: 2, ring: 0.8, level: 0.75 },
      parts: {
        companion: { deviceId: 'magnet-piano', preset: 'Bowed glass', params: { volume: -11 } },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { volume: -4.5, hiss: 0.35, age: 0.8 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { mix: 0.6 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-one-fifth-in-three',
    name: 'One fifth in three',
    category: 'wind',
    description:
      'One clean taped flute in threes, the first of each three touched a fifth and an octave over by a glockenspiel.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Fifths overhead',
      params: { ring: 1.5, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'mallets',
          preset: 'Glockenspiel',
          params: { mallet: 0.5, volume: -1.5 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Still flutes',
      params: { volume: -3, attack: 0.04, release: 0.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-short-tape-long-key',
    name: 'Short tape, long key',
    category: 'string',
    description:
      'Quick narrow tape strings with a felt piano by turns under and over each note, only on C, E and G.',
    preview: FALL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { tonic: 1, ring: 0.9, level: 0.75 },
      parts: {
        companion: {
          deviceId: 'felt-piano',
          preset: 'Felt',
          params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -6 },
        },
      },
    },
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Strings run out',
      params: { volume: -2, hiss: 0.25, age: 0.5, tone: -0.2 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },

  // Guitar
  {
    id: 'companions-by-rule-ring-over-the-neck',
    name: 'Ring over the neck',
    category: 'plucked',
    description:
      'A clean guitar whose every string sets off another, the A minor note over it, a third of a second on.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { delay: 0.37, ring: 1.2, level: 0.55 },
    },
    instrument: { deviceId: 'guitar', preset: 'Glass neck', params: { volume: 6 } },
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'companions-by-rule-swelling-to-the-octave',
    name: 'Swelling to the octave',
    category: 'plucked',
    description:
      'A guitar faded in on each note with itself a sixth under that moves to the octave on long ones.',
    preview: OPENING,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { opens: 1.1, ring: 0.2, level: 0.8 },
    },
    instrument: { deviceId: 'guitar', preset: 'Volume swell', params: { swell: 0.4 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { mix: 0.22 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-strum-and-low-shadow',
    name: 'Strum and low shadow',
    category: 'plucked',
    description:
      'A slow strummed guitar; most of a second later a softer chord of A minor notes, one under each note of the strum.',
    preview: CHORDS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Chord and shadow',
      params: { tonic: 6, delay: 0.9, ring: 0.1, level: 0.5 },
    },
    instrument: { deviceId: 'guitar', preset: 'Slow strum' },
    effects: [
      { deviceId: 'murmuration', preset: 'Two close by' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-baritone-over-a-fifth',
    name: 'Baritone over a fifth',
    category: 'plucked',
    description:
      'A dark baritone guitar with a low sine a fifth and an octave under each note, two octaves under C.',
    preview: LOW_CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bare fifths',
      params: { follow: 1, cadence: 2, octave: -1, ring: 0.1, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'sub-bass',
          preset: 'Pure sine',
          params: { harmonics: 0.4, release: 0.15, glide: 0, volume: -28.5 },
        },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Dark baritone', params: { volume: -1 } },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.35 } },
      { deviceId: 're-amp', preset: 'Dark and woolly' },
    ],
  },
  {
    id: 'companions-by-rule-muted-threes-open-bar',
    name: 'Muted threes, open bar',
    category: 'plucked',
    description:
      'A palm-muted guitar in threes, the first note of each set ringing the third C major note above on a vibraphone.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { tonic: 1, octave: 0, every: 3, ring: 2, level: 0.7 },
      parts: {
        companion: { deviceId: 'mallets', preset: 'Still vibes', params: { volume: -8.5 } },
      },
    },
    instrument: {
      deviceId: 'guitar',
      preset: 'Muted pattern',
      params: { hardness: 0.2, warmth: 0.5, sustain: 2.6, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 400, mix: 0.2 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 14, outputGain: -8 } },
    ],
  },
  {
    id: 'companions-by-rule-two-necks-in-thirds',
    name: 'Two necks in thirds',
    category: 'plucked',
    description:
      'A twelve-string guitar with itself a third over each note, sixty thousandths of a second behind.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Close thirds',
      params: { side: 1, delay: 0.06, ring: 0.12, level: 0.75 },
    },
    instrument: { deviceId: 'guitar', preset: 'Twelve string', params: { volume: 2 } },
    effects: [
      { deviceId: 'spread', preset: 'Wide top' },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-twang-and-the-far-second',
    name: 'Twang and the far second',
    category: 'plucked',
    description:
      'A bridge guitar that is followed, three quarters of a second on, by a dark low guitar string on the second F major note below.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { tonic: 4, delay: 0.75, ring: 0.6, level: 0.8 },
      parts: {
        companion: { deviceId: 'acoustic-guitar', preset: 'Soft thumb', params: { volume: -8 } },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Bridge twang', params: { tone: 4200 } },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } }],
  },
  {
    id: 'companions-by-rule-thumb-and-bass-at-home',
    name: 'Thumb, and bass at home',
    category: 'plucked',
    description:
      'A thumbed neck pickup; every other note has the A minor note below, an octave down, on an upright bass, A under A.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell under',
      params: { octave: -1, every: 2, cadence: 2, ring: 0.5, level: 0.85 },
      parts: {
        companion: { deviceId: 'string-bass', preset: 'Long wooden ring', params: { volume: -9 } },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Thumb and neck' },
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'companions-by-rule-fourths-near-breaking',
    name: 'Fourths near breaking',
    category: 'plucked',
    description:
      'A guitar amplifier at the edge, fourths under the line as it rises and over it as it falls, in half-second echoes.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { side: 3, cadence: 0, delay: 0, ring: 0, level: 0.75 },
    },
    instrument: { deviceId: 'guitar', preset: 'Warm breakup' },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4 } },
      {
        deviceId: 'skipping-stone',
        preset: 'Even steps',
        params: { first: 500, skips: 3, mix: 0.25 },
      },
    ],
  },
  {
    id: 'companions-by-rule-harp-and-koto-overhead',
    name: 'Harp and koto overhead',
    category: 'plucked',
    description:
      'A bright open guitar below, a harp a third over it and a koto a sixth over it, drawn out to fifth and octave on C.',
    preview: LOW_CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Three rising',
      params: { delay: 0.1, ring: 0.3, level: 0.6 },
      parts: {
        companion: { deviceId: 'harp', preset: 'Koto', params: { volume: -5 } },
        third: { deviceId: 'harp', preset: 'Concert harp', params: { volume: -5 } },
      },
    },
    instrument: { deviceId: 'guitar', preset: 'Harp roll', params: { volume: 2.5 } },
    effects: [
      { deviceId: 'glints', preset: 'Faint dust' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-dark-stop-glass-turn',
    name: 'Dark stop, glass turn',
    category: 'plucked',
    description:
      'A stopped dark guitar and a glass mallet on D, F or A, the one under and the one over by turns, an octave up.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { tonic: 2, octave: 1, every: 2, delay: 0.2, ring: 0.8, level: 0.6 },
      parts: { companion: { deviceId: 'fm-glass', preset: 'Vibes', params: { volume: -14 } } },
    },
    instrument: { deviceId: 'guitar', preset: 'Dark stops' },
    effects: [
      { deviceId: 'constellation', preset: 'Wide pair', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'companions-by-rule-line-behind-its-bell',
    name: 'Line behind its bell',
    category: 'plucked',
    description:
      'A hard clear guitar heard mostly as its companion: the line at a quarter, the E minor note over it in full.',
    preview: LEAPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Only the bell',
      params: { tonic: 3, melody: 0.25, ring: 1 },
    },
    instrument: { deviceId: 'guitar', preset: 'Clean bell', params: { volume: 4 } },
    effects: [
      { deviceId: 'phaser', preset: 'Faint shade' },
      { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
    ],
  },

  // Wavetable
  {
    id: 'companions-by-rule-glass-panes-in-pairs',
    name: 'Glass panes in pairs',
    category: 'pad',
    description:
      'A glassy pad that speaks at once, and with each note a toy music box on the C major note over it.',
    preview: LEAPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { tonic: 1, ring: 1, level: 0.6 },
      parts: {
        companion: { deviceId: 'modal-bells', preset: 'Music box', params: { volume: -1 } },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: { volume: -3.5, attack: 0.08, release: 1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'companions-by-rule-vowels-in-two-galleries',
    name: 'Vowels in two galleries',
    category: 'voice',
    description:
      'A vowel pad, and a second and a half behind it two voices of a triad, under one note and over the next.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Distant choirbook',
      params: { melody: 0.8, delay: 1.5, ring: 0.3, level: 0.5 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: { attack: 0.12, release: 1 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'companions-by-rule-diaphony-on-free-reeds',
    name: 'Diaphony on free reeds',
    category: 'organ',
    description:
      'A reedy wavetable organ holding a fifth while the tune over it walks with a bare fifth beneath, and ends on D alone.',
    preview: PEDAL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bare fifths',
      params: { follow: 1, tonic: 2, cadence: 2, level: 0.5 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { volume: -15, attack: 0.08, release: 0.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.6 } },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'companions-by-rule-hollow-reed-thumb-keys',
    name: 'Hollow reed, thumb keys',
    category: 'pad',
    description:
      'A hollow drifting pad and a kalimba on the second C major note under it, an octave raised, a third of a second late.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { octave: 1, delay: 0.35, level: 0.8 },
      parts: { companion: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -8 } } },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { volume: -4, attack: 0.3, release: 1.4 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Ripples', params: { depth: 0.4 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'companions-by-rule-third-star-up',
    name: 'Third star up',
    category: 'pad',
    description:
      'A bright spectral pad in slow fades; on each note it adds the third F major note over it, quietly.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { tonic: 4, octave: 0, every: 1, ring: 1, level: 0.5 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { attack: 0.5, release: 1.6, cutoff: 6000 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'companions-by-rule-plain-tones-a-sixth-off',
    name: 'Plain tones a sixth off',
    category: 'pad',
    description:
      'Two plain tones a sixth apart, the upper going on up to the octave when a note has been held a little over a second.',
    preview: LOW_SIGHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { side: 1, opens: 1.15, ring: 0.2, level: 0.8 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { depth: 0.3 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
    ],
  },
  {
    id: 'companions-by-rule-glass-keys-by-fourths',
    name: 'Glass keys by fourths',
    category: 'bell',
    description:
      'Wavetable bells with a fourth to each note half a second after it, below the first and above the next.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { side: 2, cadence: 0, delay: 0.5, ring: 0.8, level: 0.6 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 2, cutoff: 7000 },
    },
    effects: [
      { deviceId: 'prism', preset: 'Faint trail' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2, decay: 2.5 } },
    ],
  },
  {
    id: 'companions-by-rule-hummed-over-the-bow',
    name: 'Hummed over the bow',
    category: 'voice',
    description:
      'A hummed pad with bowed strings a tenth under it, letting go to the A two octaves down when the line holds an A.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Slow tenths',
      params: { tonic: 6, opens: 0.75, ring: 0.15, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.12, release: 0.5, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.15, release: 0.9 },
    },
    effects: [
      { deviceId: 'size', preset: 'Smaller', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-saws-keeping-behind',
    name: 'Saws keeping behind',
    category: 'pad',
    description:
      'Thick wide saws, and a quick reed organ on the F major note under while the line rises and over while it falls.',
    preview: FALL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell of the fourth',
      params: { ring: 0.2, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'organ',
          preset: 'Pump organ',
          params: { attack: 0.05, volume: -0.5 },
        },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Thick saws',
      params: { volume: 3, attack: 0.15, release: 0.9, cutoff: 2600 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Soft bloom' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'companions-by-rule-every-other-pulse',
    name: 'Every other pulse',
    category: 'keys',
    description:
      'A thin pulse in quick threes with A minor notes over every second note, a tenth of a second behind it.',
    preview: THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { every: 2, delay: 0.1, ring: 0.3, level: 0.7 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { volume: -5, cutoff: 4000, release: 0.4 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'companions-by-rule-beats-against-a-fifth',
    name: 'Beats against a fifth',
    category: 'pad',
    description:
      'Slow-beating plain tones, each with a fifth over it and the octave for a fifth wherever the line is on G.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Fifths overhead',
      params: { octave: 0, every: 1, tonic: 5, cadence: 2, ring: 0.5, level: 0.55 },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Beating sines',
      params: { volume: -6.5, attack: 0.2, release: 1.5, cutoff: 8000 },
    },
    effects: [
      { deviceId: 'around', preset: 'Barely moving' },
      { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.12 } },
    ],
  },
  {
    id: 'companions-by-rule-sixths-over-a-low-bed',
    name: 'Sixths over a low bed',
    category: 'pad',
    description:
      'A low dull pad as the bass, its thirds and sixths above it as clear tines a fifth of a second behind.',
    preview: PHRYGIAN_BASS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Over the bass',
      params: { delay: 0.2, ring: 0.05, level: 0.75 },
      parts: {
        companion: {
          deviceId: 'tine-piano',
          preset: 'Long sustain',
          params: { release: 0.6, volume: -11 },
        },
        third: { deviceId: 'tine-piano', preset: 'Dark felt', params: { volume: -11 } },
      },
    },
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.15, release: 0.8, cutoff: 900 },
    },
    effects: [
      { deviceId: 'spread', preset: 'Open middle' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },

  // Overtone
  {
    id: 'companions-by-rule-throat-and-high-bars',
    name: 'Throat and high bars',
    category: 'voice',
    description:
      'A rough throat voice wandering over its harmonics, each note with a bar of A minor an octave and more over it.',
    preview: CHANT,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { octave: 1, ring: 1, level: 0.7 },
      parts: {
        companion: { deviceId: 'mallets', preset: 'Resonator bells', params: { volume: -13 } },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Throat song',
      params: { overtone: 11, focus: 0.5, wander: 0.7, pace: 1.5, growl: 0.35, width: 0.9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } }],
  },
  {
    id: 'companions-by-rule-whistle-over-open-glass',
    name: 'Whistle over open glass',
    category: 'voice',
    description:
      'A still whistling voice with a glass organ two octaves and a fifth over every second note it takes.',
    preview: CHANT,
    maker: {
      makerId: 'companion-voice',
      preset: 'Fifths overhead',
      params: { octave: 2, every: 2, ring: 1.2, level: 0.5 },
      parts: {
        companion: { deviceId: 'fm-glass', preset: 'Glass organ', params: { volume: -19 } },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { attack: 0.2, release: 1.2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2, decay: 3 } },
    ],
  },
  {
    id: 'companions-by-rule-growl-and-two-horns',
    name: 'Growl and two horns',
    category: 'voice',
    description:
      'A growling voice as the bass, a horn a sixth and a flugelhorn a third over it, opened to fifth and octave on D.',
    preview: DORIAN_BASS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Three rising',
      params: { tonic: 2, octave: 0, ring: 0.1, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.08, release: 0.5, volume: -6 },
        },
        third: {
          deviceId: 'horns',
          preset: 'Flugel breath',
          params: { attack: 0.1, release: 0.5, volume: -8 },
        },
      },
    },
    instrument: { deviceId: 'overtone', preset: 'Low growl', params: { growl: 0.6 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-fourth-off-a-drone-pipe',
    name: 'Fourth off a drone pipe',
    category: 'drone',
    description:
      'A buzzing pipe holds a fifth; its tune has a second pipe a fourth above, a sixth of a second on, an octave above D.',
    preview: PEDAL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { side: 1, follow: 1, delay: 0.16, cadence: 2, ring: 0.1, level: 0.6 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Drone pipe',
      params: { attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-jaw-harp-and-thumb-keys',
    name: 'Jaw harp and thumb keys',
    category: 'plucked',
    description:
      'A twanging reed that speaks at once, and on every second note a kalimba takes the second G major note over it.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { tonic: 5, side: 1, every: 2, ring: 0.6, level: 0.9 },
      parts: { companion: { deviceId: 'modal-bells', preset: 'Kalimba', params: { volume: -8 } } },
    },
    instrument: { deviceId: 'overtone', preset: 'Jaw harp' },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring' },
    ],
  },
  {
    id: 'companions-by-rule-trebles-over-the-chant',
    name: 'Trebles over the chant',
    category: 'voice',
    description:
      'A slow chanting voice with trebles two octaves and a third above, who settle on the A over a held A.',
    preview: CHANT,
    maker: {
      makerId: 'companion-voice',
      preset: 'Slow tenths',
      params: { side: 1, octave: 2, tonic: 6, opens: 0.8, ring: 0.2, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'choir',
          preset: 'Boys ooh',
          params: { attack: 0.12, release: 0.7, volume: -10.5 },
        },
      },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { attack: 0.2, release: 1.2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.4 } }],
  },
  {
    id: 'companions-by-rule-breath-on-the-sixth-step',
    name: 'Breath on the sixth step',
    category: 'wind',
    description:
      'A breathy pipe with another a sixth away, on the side it has come from and a quarter second behind.',
    preview: LOW_CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sixths from behind',
      params: { ring: 0.1, level: 0.7 },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { attack: 0.15, release: 0.8 },
    },
    effects: [
      { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-whistle-and-deep-wood',
    name: 'Whistle and deep wood',
    category: 'voice',
    description:
      'A thin high-whistling pipe, and under every other note a hummed marimba bar on the third D minor note below.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { tonic: 2, side: 0, octave: 0, ring: 0.8, level: 0.9 },
      parts: {
        companion: { deviceId: 'mallets', preset: 'Humming marimba', params: { volume: -8 } },
      },
    },
    instrument: { deviceId: 'overtone', preset: 'High whistle', params: { release: 1 } },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Barely there' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-vowel-then-a-low-one',
    name: 'Vowel, then a low one',
    category: 'voice',
    description:
      'An open vowel that wanders, its own voice coming back two seconds later on the D minor note under each call.',
    preview: CALLS,
    maker: { makerId: 'companion-voice', preset: 'Late bell', params: { ring: 0.5, level: 0.6 } },
    instrument: {
      deviceId: 'overtone',
      preset: 'Open vowels',
      params: { attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'around', preset: 'Wide pendulum', params: { radius: 0.6 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'companions-by-rule-reed-with-two-neighbours',
    name: 'Reed with two neighbours',
    category: 'wind',
    description:
      'A nasal reed, a zither on the F major note under it and then the one over it by turns, both an octave up.',
    preview: LOW_CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { tonic: 4, octave: 1, ring: 1.2, level: 0.75 },
      parts: { companion: { deviceId: 'zither', preset: 'Koto pluck', params: { volume: -2.5 } } },
    },
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { volume: -2, attack: 0.12, release: 0.9 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.25 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.18 } },
    ],
  },

  // Twin bars
  {
    id: 'companions-by-rule-metal-calls-glass-comes',
    name: 'Metal calls, glass comes',
    category: 'bell',
    description:
      'Metal bars that beat four a second and, a third of a second on, glass ones on the A minor note over them.',
    preview: LEAPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell over',
      params: { delay: 0.37, ring: 1.5, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'twin-bars',
          preset: 'Glass, middle',
          params: { decay: 4, volume: -7 },
        },
      },
    },
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: { volume: 0.5, decay: 4 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },
  {
    id: 'companions-by-rule-bowl-rim-low-bow',
    name: 'Bowl rim, low bow',
    category: 'bell',
    description:
      'Slow metal bars with a bowed string on the second C major note below, which moves to a C when the note is held.',
    preview: OPENING,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { cadence: 1, opens: 1.1, ring: 0.3, level: 0.75 },
      parts: {
        companion: {
          deviceId: 'bowed-string',
          preset: 'Soft flautando',
          params: { attack: 0.2, release: 0.6, volume: -11 },
        },
      },
    },
    instrument: { deviceId: 'twin-bars', preset: 'Slow metal bowl', params: { decay: 9 } },
    effects: [
      { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'companions-by-rule-two-bowls-a-sixth-apart',
    name: 'Two bowls a sixth apart',
    category: 'bell',
    description:
      'Long glass bars in two breaths, each note with another bar a sixth over it a third of a second later.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { side: 1, cadence: 0, delay: 0.33, ring: 0.6, level: 0.7 },
    },
    instrument: { deviceId: 'twin-bars', preset: 'Glass bowl', params: { volume: -4, decay: 7 } },
    effects: [
      { deviceId: 'ear-shift', preset: 'Slow turn' },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'companions-by-rule-wood-fluttered-by-threes',
    name: 'Wood fluttered by threes',
    category: 'bell',
    description:
      'Fluttering wood in threes, and on each third stroke a soft low pulse on the C major note under it, two octaves down.',
    preview: THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell under',
      params: { tonic: 1, octave: -2, every: 3, ring: 0.6, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'sub-bass',
          preset: 'Soft pulse',
          params: { harmonics: 0.5, volume: -19 },
        },
      },
    },
    instrument: { deviceId: 'twin-bars', preset: 'Wood flutter' },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-turns-in-trembling-glass',
    name: 'Turns in trembling glass',
    category: 'bell',
    description:
      'Trembling glass and a soft koto by turns, the koto under one stroke and over the next, only on E, G and B.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { tonic: 3, delay: 0.18, ring: 0.8, level: 0.8 },
      parts: {
        companion: { deviceId: 'harp', preset: 'Soft silk', params: { bend: 0, volume: -4 } },
      },
    },
    instrument: { deviceId: 'twin-bars', preset: 'Ten in the air', params: { volume: -2 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-soft-wood-linked-thirds',
    name: 'Soft wood, linked thirds',
    category: 'bell',
    description:
      'Soft wooden bars with a felt piano a third under each stroke, both in a short gated room.',
    preview: LEAPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Close thirds',
      params: { ring: 0.15, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'felt-piano',
          preset: 'Intimate',
          params: { resonance: 0, reverbMix: 0, polyphony: 16, outputDb: -9 },
        },
      },
    },
    instrument: { deviceId: 'twin-bars', preset: 'Two, soft wood', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.25 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'companions-by-rule-flam-and-a-late-fourth',
    name: 'Flam and a late fourth',
    category: 'bell',
    description:
      'Wooden bars struck as a flam, with fourths under them half a second on; on D the fourth is an octave.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { delay: 0.5, ring: 0.2, level: 0.75 },
    },
    instrument: { deviceId: 'twin-bars', preset: 'Flam of wood', params: { volume: 2 } },
    effects: [
      { deviceId: 'skipping-stone', preset: 'Soft pebble' },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'companions-by-rule-bars-without-their-tune',
    name: 'Bars without their tune',
    category: 'bell',
    description:
      'Dark soft metal that plays only the F major note over each key, the key itself left silent.',
    preview: LEAPS,
    maker: { makerId: 'companion-voice', preset: 'Only the bell', params: { tonic: 4, ring: 1 } },
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { volume: 0, decay: 5, tone: 0.2 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Gentle drift' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-bright-glass-two-pipes',
    name: 'Bright glass, two pipes',
    category: 'bell',
    description:
      'Bright glass bars on top of inverted triads, recorder in the middle, low flute at the bottom, an octave on a long note.',
    preview: CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sung in three',
      params: { opens: 0.9, ring: 0.1, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'flute',
          preset: 'Alto flute',
          params: { attack: 0.04, release: 0.5, volume: -19.5 },
        },
        third: {
          deviceId: 'flute',
          preset: 'Soft recorder',
          params: { attack: 0.05, volume: -17.5 },
        },
      },
    },
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Bright glass',
      params: { volume: -2, mallet: 0.7, decay: 3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'companions-by-rule-wood-hum-far-reed',
    name: 'Wood hum, far reed',
    category: 'bell',
    description:
      'A soft wooden hum with a low reed on the third A minor note under every second stroke, hung in a fog.',
    preview: FALL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { side: 0, octave: 0, ring: 0.4, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.1, release: 0.5, volume: -10 },
        },
      },
    },
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Soft wood hum',
      params: { volume: -2.5, decay: 3 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
    ],
  },

  // Flute
  {
    id: 'companions-by-rule-falling-below-its-bell',
    name: 'Falling below its bell',
    category: 'wind',
    description:
      'A concert flute down a whole octave, from its second note on with a celesta on the nearest C major note over it.',
    preview: FALL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell of the fourth',
      params: { tonic: 1, ring: 1, level: 0.6 },
      parts: {
        companion: { deviceId: 'mallets', preset: 'Open celesta', params: { volume: -10 } },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Concert flute' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.22 } }],
  },
  {
    id: 'companions-by-rule-bamboo-then-string',
    name: 'Bamboo, then string',
    category: 'wind',
    description:
      'A bamboo flute in two breaths; in each rest a koto brings the second E minor note under every tone.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Second bell',
      params: { tonic: 3, delay: 1.75, ring: 0.8, level: 0.8 },
      parts: { companion: { deviceId: 'harp', preset: 'Koto', params: { volume: 0.5 } } },
    },
    instrument: { deviceId: 'flute', preset: 'Shakuhachi', params: { scoop: 60, chiff: 0.6 } },
    effects: [
      { deviceId: 'distance', preset: 'Open air' },
      { deviceId: 'reverse-delay', preset: 'Faint reflection' },
    ],
  },
  {
    id: 'companions-by-rule-reed-rafts-in-thirds',
    name: 'Reed rafts in thirds',
    category: 'wind',
    description:
      'Pan pipes in quick threes with other pipes a third over every note, each blown a twelfth of a second late.',
    preview: THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Close thirds',
      params: { side: 1, delay: 0.083, level: 0.75 },
    },
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { chiff: 0.6 } },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider' },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-consort-at-low-tide',
    name: 'Consort at low tide',
    category: 'wind',
    description:
      'A low flute as the top of three with bass clarinet at the bottom and horn between, at the open octave on every C.',
    preview: CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sung in three',
      params: { cadence: 2, ring: 0.1, level: 0.8 },
      parts: {
        companion: {
          deviceId: 'clarinet',
          preset: 'Bass clarinet',
          params: { attack: 0.08, release: 0.4, volume: -10 },
        },
        third: {
          deviceId: 'horns',
          preset: 'Solo horn',
          params: { attack: 0.1, release: 0.5, volume: -10 },
        },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Alto flute', params: { blow: 0.6 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.22, decay: 2.2 } },
    ],
  },
  {
    id: 'companions-by-rule-wood-flute-floor-fifth',
    name: 'Wood flute, floor fifth',
    category: 'wind',
    description:
      'A wooden flute with a cello string a fifth (a fourth from F) and an octave under each note, two octaves under D.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bare fifths',
      params: { follow: 1, octave: -1, tonic: 2, cadence: 2, ring: 0.2, level: 0.75 },
      parts: {
        companion: {
          deviceId: 'bowed-string',
          preset: 'Cello drone',
          params: { attack: 0.2, release: 0.6, volume: -16 },
        },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Canyon flute', params: { volume: -14, scoop: 20 } },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor wash', params: { mix: 0.2, decay: 3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'companions-by-rule-both-sides-of-a-recorder',
    name: 'Both sides of a recorder',
    category: 'wind',
    description:
      'A straight soft recorder with chapel pipes under and over it by turns, only on the notes of D minor.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Either hand',
      params: { tonic: 2, ring: 0.2, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'organ',
          preset: 'Chapel flutes',
          params: { attack: 0.04, volume: -15 },
        },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Soft recorder', params: { attack: 0.06 } },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'companions-by-rule-sixth-let-down-slowly',
    name: 'Sixth let down slowly',
    category: 'wind',
    description:
      'Breathy low flutes in held notes with themselves a sixth below, let down to the octave after a second and a third.',
    preview: SIGHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Warm sixths',
      params: { opens: 1.3, ring: 0.3, level: 0.75 },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { attack: 0.25, release: 1, breath: 0.8, blow: 0.3 },
    },
    effects: [
      { deviceId: 'reveal', preset: 'Gentle opening' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-star-over-a-hard-breath',
    name: 'Star over a hard breath',
    category: 'wind',
    description:
      'A hard-blown flute, and with the first note of each three a glass ping on the third E minor note above.',
    preview: THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Far bells',
      params: { tonic: 3, octave: 0, every: 3, ring: 2, level: 0.6 },
      parts: {
        companion: { deviceId: 'fm-glass', preset: 'Glass ping', params: { volume: -8.5 } },
      },
    },
    instrument: { deviceId: 'flute', preset: 'Hard blown flute', params: { blow: 0.75 } },
    effects: [
      { deviceId: 'constellation', preset: 'Faint points' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'companions-by-rule-bowl-in-d-very-late',
    name: 'Bowl in D, very late',
    category: 'wind',
    description:
      'A straight toned flute; two and a half seconds after each note a dark bowl is struck on the D minor note below.',
    preview: SLOW,
    maker: {
      makerId: 'companion-voice',
      preset: 'Late bell',
      params: { delay: 2.5, ring: 1, level: 0.7 },
      parts: {
        companion: {
          deviceId: 'modal-bells',
          preset: 'Dark bowl',
          params: { decay: 6, volume: -4.5 },
        },
      },
    },
    instrument: {
      deviceId: 'flute',
      preset: 'Straight tone',
      params: { attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Long patience', params: { wait: 600, grow: 1200 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 4, mix: 0.22 } },
    ],
  },

  // Clarinet
  {
    id: 'companions-by-rule-reed-with-a-struck-bowl',
    name: 'Reed with a struck bowl',
    category: 'wind',
    description:
      'A warm clarinet, each note touching a singing bowl on the G major note beneath it, left ringing two seconds.',
    preview: LEAPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Bell under',
      params: { tonic: 5, ring: 2, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'modal-bells',
          preset: 'Singing bowl',
          params: { decay: 5, volume: -6 },
        },
      },
    },
    instrument: { deviceId: 'clarinet', preset: 'Warm clarinet', params: { volume: -1.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } }],
  },
  {
    id: 'companions-by-rule-bass-reed-carries-two',
    name: 'Bass reed carries two',
    category: 'bass',
    description:
      'A bass clarinet below, flute pipes a third and a harmonium a sixth over it a third of a second late, opened out on E.',
    preview: PHRYGIAN_BASS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Over the bass',
      params: { tonic: 3, cadence: 2, delay: 0.35, ring: 0.1, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'organ',
          preset: 'Harmonium',
          params: { attack: 0.06, volume: -16 },
        },
        third: {
          deviceId: 'organ',
          preset: 'Tremulant flute',
          params: { attack: 0.06, volume: -17 },
        },
      },
    },
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { attack: 0.1, release: 0.4 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { mix: 0.5 } },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'companions-by-rule-subtone-and-its-double',
    name: 'Subtone and its double',
    category: 'wind',
    description:
      'A subtone tenor with a second one a quarter second late, a sixth under rising notes and a sixth over falling ones.',
    preview: LOW_STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Sixths from behind',
      params: { ring: 0.05, level: 0.6 },
    },
    instrument: { deviceId: 'clarinet', preset: 'Subtone tenor', params: { attack: 0.08 } },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Charity shop find',
        params: { crackle: 0.15, pops: 0, wear: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-hollow-reeds-find-a-d',
    name: 'Hollow reeds find a D',
    category: 'wind',
    description:
      'A hollow reed and a second one on the second D minor note over it, rising to D on any note held a second.',
    preview: SIGHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Homecoming',
      params: { opens: 1, ring: 0.1, level: 0.6 },
    },
    instrument: { deviceId: 'clarinet', preset: 'Hollow section', params: { volume: -0.5 } },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-duduk-with-a-low-fourth',
    name: 'Duduk with a low fourth',
    category: 'wind',
    description:
      'A double reed over a held fifth, its tune shadowed two fifths of a second late by bows a fourth under, an octave at D.',
    preview: PEDAL,
    maker: {
      makerId: 'companion-voice',
      preset: 'Stone fourths',
      params: { ring: 0.3, level: 0.75 },
      parts: {
        companion: {
          deviceId: 'chamber-strings',
          preset: 'Viol consort',
          params: { attack: 0.1, release: 0.5, volume: -11 },
        },
      },
    },
    instrument: { deviceId: 'clarinet', preset: 'Duduk', params: { attack: 0.1 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 3, mix: 0.2, width: 0.6 } },
    ],
  },
  {
    id: 'companions-by-rule-soprano-with-nylon-tenth',
    name: 'Soprano with nylon tenth',
    category: 'wind',
    description:
      'A bright soprano reed with a nylon guitar a tenth under it, plucked again with every note of the line.',
    preview: CHOIRBOOK,
    maker: {
      makerId: 'companion-voice',
      preset: 'Slow tenths',
      params: { cadence: 0, ring: 0.25, level: 0.9 },
      parts: {
        companion: { deviceId: 'acoustic-guitar', preset: 'Nylon lullaby', params: { volume: -7 } },
      },
    },
    instrument: { deviceId: 'clarinet', preset: 'Bright soprano', params: { blow: 0.55 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'companions-by-rule-flutter-cold-fifths-up',
    name: 'Flutter, cold fifths up',
    category: 'wind',
    description:
      'A fluttered clarinet, and every third note sets a ringing vibraphone bar a fifth and an octave above it.',
    preview: LOW_THREES,
    maker: {
      makerId: 'companion-voice',
      preset: 'Fifths overhead',
      params: { ring: 1.5, level: 0.7 },
      parts: {
        companion: { deviceId: 'modal-bells', preset: 'Vibraphone', params: { volume: -8 } },
      },
    },
    instrument: {
      deviceId: 'clarinet',
      preset: 'Flutter tongue',
      params: { attack: 0.05, release: 0.4, growl: 0.8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'companions-by-rule-whisper-and-late-triads',
    name: 'Whisper and late triads',
    category: 'wind',
    description:
      'A whispering reed in two breaths; nearly two and a half seconds on, two soft voices make inverted triads with each.',
    preview: BREATHS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Distant choirbook',
      params: { side: 0, melody: 1, delay: 2.4, ring: 0.3, level: 0.6 },
      parts: {
        companion: {
          deviceId: 'choir',
          preset: 'Altos eh',
          params: { attack: 0.1, release: 0.7, volume: -14 },
        },
        third: {
          deviceId: 'choir',
          preset: 'Boys ooh',
          params: { attack: 0.1, release: 0.7, volume: -15 },
        },
      },
    },
    instrument: {
      deviceId: 'clarinet',
      preset: 'Reed whisper',
      params: { attack: 0.12, release: 0.8 },
    },
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
      { deviceId: 'lift', preset: 'Slightly closer' },
    ],
  },
  {
    id: 'companions-by-rule-bell-spoken-by-the-reed',
    name: 'Bell spoken by the reed',
    category: 'wind',
    description:
      'A slow-fading reed heard at a third of its level, the A minor note over each key full on tapped glass.',
    preview: STEPS,
    maker: {
      makerId: 'companion-voice',
      preset: 'Only the bell',
      params: { melody: 0.35, ring: 1.2, level: 0.9 },
      parts: {
        companion: { deviceId: 'modal-bells', preset: 'Tapped glass', params: { volume: -15 } },
      },
    },
    instrument: {
      deviceId: 'clarinet',
      preset: 'Slow fade reed',
      params: { release: 1.5, volume: 4.5 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
    ],
  },
]
