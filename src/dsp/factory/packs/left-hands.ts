import { type FactoryPreset, type Phrase } from '../types'

// Only the accompanying hand: broken chords, stride, rolled and walking tenths, a held pedal, a
// waltz bass, a half-pedalled arpeggio. For each instrument the bass goes from soft to firm and
// the chord from clipped to left ringing; the key is C (or its relatives) and the tune is yours.

const at = (sec: number): number => Math.round(sec * 1000) / 1000

/** One thing the hand does: when, for how long, which notes together, how hard. */
type Touch = readonly [number, number, readonly number[], number]

/** How firmly the hand leans: every loudness below is times this. */
const FIRM = 1.35

/** Touches counted in beats, set down at so many seconds a beat. */
const hand = (beat: number, touches: readonly Touch[]): Phrase => ({
  notes: touches.flatMap(([when, held, notes, gain]) =>
    notes.map((note) => ({
      atSec: at(when * beat),
      durSec: at(held * beat),
      note,
      gain: at(gain * FIRM),
    })),
  ),
})

/** A figure of single notes, one a beat: the first of each group leans and is held two, or as long as said. */
const figure = (
  groups: readonly (readonly number[])[],
  bass: number,
  rest: number,
  bassHeld = 1.9,
  held = 0.95,
) =>
  groups.flatMap((group, g) =>
    group.map((note, i): Touch => [
      g * group.length + i,
      i === 0 ? bassHeld : held,
      [note],
      i === 0 ? bass : rest,
    ]),
  )

// I vi IV V as 1-5-3-5 in eighths: close on C, then the third opened to a tenth as the bass goes
// down (C G E G, A E C E, F C A C, G D B D), and home on C, the B to C under the tenth.
const ROCKING: Phrase = hand(0.4, [
  ...figure(
    [
      [48, 55, 52, 55],
      [45, 52, 60, 52],
      [41, 48, 57, 48],
      [43, 50, 59, 50],
    ],
    0.55,
    0.42,
  ),
  [16, 2.3, [48, 60, 64], 0.46],
])
// Slow stride, vi then IV: root, chord, fifth, chord, the inner voices moving by one step.
const STRIDE: Phrase = hand(0.82, [
  [0, 0.95, [45], 0.6],
  [1, 0.5, [52, 57, 60], 0.38],
  [2, 0.95, [40], 0.55],
  [3, 0.5, [52, 57, 60], 0.38],
  [4, 0.95, [41], 0.6],
  [5, 0.5, [53, 57, 60], 0.38],
  [6, 0.95, [48], 0.5],
  [7, 0.5, [53, 57, 60], 0.38],
  [8, 1, [45, 60], 0.5],
])
// The same hand at a trot, all four chords: C, Am, F and G (its seventh at the last), each root,
// chord, fifth, chord, then C.
const TROT: Phrase = hand(0.4, [
  [0, 0.9, [48], 0.6],
  [1, 0.4, [52, 55, 60], 0.4],
  [2, 0.9, [43], 0.52],
  [3, 0.4, [52, 55, 60], 0.4],
  [4, 0.9, [45], 0.6],
  [5, 0.4, [52, 57, 60], 0.4],
  [6, 0.9, [40], 0.52],
  [7, 0.4, [52, 57, 60], 0.4],
  [8, 0.9, [41], 0.6],
  [9, 0.4, [53, 57, 60], 0.4],
  [10, 0.9, [48], 0.52],
  [11, 0.4, [53, 57, 60], 0.4],
  [12, 0.9, [43], 0.6],
  [13, 0.4, [50, 55, 59], 0.4],
  [14, 0.9, [50], 0.52],
  [15, 0.4, [53, 55, 59], 0.4],
  [16, 2.2, [48, 52, 55, 60], 0.45],
])
/** A tenth with its fifth, rolled from the bottom. */
const rolled = (when: number, notes: readonly number[], held: number, gain: number): Touch[] =>
  notes.map((note, i) => [when + i * 0.12, held - i * 0.12, [note], gain - i * 0.03])
// Rolled tenths, one a bar: C (E on top), A minor (C), F (A), G (B), and C an octave lower.
const TENTHS: Phrase = hand(1, [
  ...rolled(0, [48, 55, 64], 1.3, 0.55),
  ...rolled(1.35, [45, 52, 60], 1.3, 0.52),
  ...rolled(2.7, [41, 48, 57], 1.3, 0.55),
  ...rolled(4.05, [43, 50, 59], 1.3, 0.55),
  ...rolled(5.4, [36, 43, 52], 1.9, 0.5),
])
// G held and struck again half way; over it a pair in thirds rises to the seventh, falls below
// and comes back: B D, C E, D F, C E, B D, A C, B D.
const PEDAL: Phrase = hand(0.84, [
  [0, 3.9, [43], 0.6],
  [4, 4.6, [43], 0.6],
  [0, 0.9, [59, 62], 0.36],
  [1, 0.9, [60, 64], 0.36],
  [2, 0.9, [62, 65], 0.4],
  [3, 0.9, [60, 64], 0.36],
  [4, 0.9, [59, 62], 0.36],
  [5, 0.9, [57, 60], 0.34],
  [6, 2.4, [59, 62], 0.36],
])
// A waltz bass: C, Am, F, G seventh, one in the bass and two above, the F and the B resolving home.
const WALTZ: Phrase = hand(0.5, [
  [0, 1.1, [48], 0.6],
  [1, 0.6, [52, 55, 60], 0.38],
  [2, 0.6, [52, 55, 60], 0.34],
  [3, 1.1, [45], 0.6],
  [4, 0.6, [52, 57, 60], 0.38],
  [5, 0.6, [52, 57, 60], 0.34],
  [6, 1.1, [41], 0.6],
  [7, 0.6, [53, 57, 60], 0.38],
  [8, 0.6, [53, 57, 60], 0.34],
  [9, 1.1, [43], 0.6],
  [10, 0.6, [53, 55, 59], 0.38],
  [11, 0.6, [53, 55, 59], 0.34],
  [12, 2.6, [48, 52, 55, 60], 0.42],
])
// A half-pedalled arpeggio, C up and down, then F with a D falling home to C: each bass
// still rings into the next chord.
const HALF_PEDAL: Phrase = hand(
  0.36,
  [
    ...figure(
      [
        [48, 55, 60, 64, 67, 64, 60, 55],
        [41, 48, 53, 57, 60, 57, 53, 50],
      ],
      0.55,
      0.42,
      9,
      1.95,
    ),
    [16, 4, [48, 60, 64], 0.45] as Touch,
  ].map(([when, held, notes, gain]): Touch => [when, when === 15 ? 0.95 : held, notes, gain]),
)
// A boat in six: A minor, F, C, G, each up to its tenth and back down, then A minor again.
const SIX: Phrase = hand(0.27, [
  ...figure(
    [
      [45, 52, 57, 60, 57, 52],
      [41, 48, 53, 57, 53, 48],
      [48, 55, 60, 64, 60, 55],
      [43, 50, 55, 59, 55, 50],
    ],
    0.58,
    0.42,
    4,
  ),
  [24, 3, [45, 60], 0.5],
])
// Rocking fifths on the steps of D: D A, G D, A E and D A, each rocked twice, then D A together.
const CRADLE: Phrase = hand(0.4, [
  ...figure(
    [
      [50, 57, 50, 57],
      [43, 50, 43, 50],
      [45, 52, 45, 52],
      [50, 57, 50, 57],
    ],
    0.55,
    0.44,
    0.95,
  ),
  [16, 2.2, [50, 57], 0.46],
])
// Walking tenths in A minor: both outer fingers by step, A C up to D F and back, under by G B, home.
const WALKING: Phrase = hand(0.68, [
  [0, 0.95, [45, 60], 0.5],
  [1, 0.95, [47, 62], 0.46],
  [2, 0.95, [48, 64], 0.48],
  [3, 0.95, [50, 65], 0.52],
  [4, 0.95, [48, 64], 0.48],
  [5, 0.95, [47, 62], 0.46],
  [6, 0.95, [45, 60], 0.46],
  [7, 0.95, [43, 59], 0.48],
  [8, 2.6, [45, 60], 0.5],
])
// Soft bass on the beat, the chord clipped after it: C, Am, F, G seventh, home.
const AFTERBEAT: Phrase = hand(0.4, [
  [0, 0.9, [48], 0.4],
  [1, 0.3, [52, 55, 60], 0.5],
  [2, 0.9, [43], 0.4],
  [3, 0.3, [52, 55, 60], 0.45],
  [4, 0.9, [45], 0.4],
  [5, 0.3, [52, 57, 60], 0.5],
  [6, 0.9, [40], 0.4],
  [7, 0.3, [52, 57, 60], 0.45],
  [8, 0.9, [41], 0.4],
  [9, 0.3, [53, 57, 60], 0.5],
  [10, 0.9, [48], 0.4],
  [11, 0.3, [53, 57, 60], 0.45],
  [12, 0.9, [43], 0.4],
  [13, 0.3, [53, 55, 59], 0.5],
  [14, 0.9, [50], 0.4],
  [15, 0.3, [53, 55, 59], 0.45],
  [16, 0.9, [48], 0.4],
  [17, 0.6, [52, 55, 60], 0.5],
])
// Two notes a chord, held: D with its seventh, G with its third, C with its seventh, A with its
// third; the top goes C, B, B, C.
const SHELLS: Phrase = hand(1.7, [
  [0, 0.97, [50, 60], 0.5],
  [1, 0.97, [43, 59], 0.5],
  [2, 0.97, [48, 59], 0.48],
  [3, 1.2, [45, 60], 0.5],
])
// For strings that make the chord by themselves: C, F, G, C, each a low root and the same an
// octave up, lighter and shorter.
const ROOTS: Phrase = hand(0.8, [
  [0, 1, [48], 0.55],
  [1, 0.7, [60], 0.38],
  [2, 1, [53], 0.55],
  [3, 0.7, [65], 0.38],
  [4, 1, [55], 0.55],
  [5, 0.7, [67], 0.38],
  [6, 1.2, [48], 0.55],
  [7.2, 1.6, [60], 0.38],
])
// The same hand on A, D, E and A, for minor and suspended strings.
const ROOTS_MINOR: Phrase = hand(0.8, [
  [0, 1, [57], 0.55],
  [1, 0.7, [69], 0.38],
  [2, 1, [50], 0.55],
  [3, 0.7, [62], 0.38],
  [4, 1, [52], 0.55],
  [5, 0.7, [64], 0.38],
  [6, 1.2, [57], 0.55],
  [7.2, 1.6, [69], 0.38],
])
// Whole chords, one a bar, the thumb staying on C but for one B: C, Am, F, G seventh, C.
const PLATES: Phrase = hand(1.4, [
  [0, 0.95, [48, 52, 55, 60], 0.45],
  [1, 0.95, [45, 52, 57, 60], 0.45],
  [2, 0.95, [41, 53, 57, 60], 0.45],
  [3, 0.95, [43, 53, 55, 59], 0.45],
  [4, 1.2, [48, 52, 55, 60], 0.45],
])

export const PRESETS: readonly FactoryPreset[] = [
  // Tine piano: from clipped and dry to let ring.
  {
    id: 'left-hands-wrist-barely-moving',
    name: 'Wrist barely moving',
    category: 'keys',
    description:
      'Dark felted tines, short and soft, the lows thinned and the top shut, partly heard through a small speaker.',
    preview: ROCKING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { volume: -5, decay: 0.6, release: 0.1, hardness: 0.3, tone: 0.18 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 80, low: -3, highCut: 2600, clear: 0.2 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { mix: 0.55 } },
    ],
  },
  {
    id: 'left-hands-thumb-finds-the-tenth',
    name: 'Thumb finds the tenth',
    category: 'keys',
    description:
      'Bell-toned tines held long, a copy a few cents off at each side, in a hall with the lows ringing longest.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { volume: -16, bell: 0.75, decay: 2, release: 0.9, tone: 0.62, tremolo: 0 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.34 } },
    ],
  },
  {
    id: 'left-hands-pah-without-the-oom',
    name: 'Pah without the oom',
    category: 'keys',
    description:
      'Very short tines with the lows cut away from under the clipped chord, on a short tight spring.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -0.5, bell: 0.15, decay: 0.25, tone: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 320, low: -9, presence: 3, clear: 0.1 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 0.9, mix: 0.25 } },
    ],
  },
  {
    id: 'left-hands-last-couple-dancing',
    name: 'Last couple dancing',
    category: 'keys',
    description: 'Tines in a deep mono tremolo, worn on cassette and sent to a dark plate.',
    preview: WALTZ,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Tremolo',
      params: { volume: -14, tremolo: 0.85, tremoloRate: 4.6, bark: 0.3, tone: 0.42, release: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'left-hands-sleeve-over-the-tines',
    name: 'Sleeve over the tines',
    category: 'keys',
    description:
      'Muffled tines with no bell and a slow filter that opens a little on each touch, every attack blurred.',
    preview: CRADLE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Underwater keys',
      params: { volume: -15.5, decay: 1.6, release: 0.5, tremolo: 0, tone: 0.35, drive: 0.1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 260,
          resonance: 1.1,
          envAmount: 45,
          envAttackMs: 60,
          envReleaseMs: 500,
        },
      },
      { deviceId: 'fog', preset: 'Short blur', params: { mix: 0.7 } },
    ],
  },
  {
    id: 'left-hands-low-g-by-lamplight',
    name: 'Low G by lamplight',
    category: 'keys',
    description:
      'Long soft tines over which each band swells and drifts from side to side, with a faint big room behind.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Long sustain',
      params: { volume: -15.5, release: 2.2, tremolo: 0, bell: 0.35, hardness: 0.45 },
    },
    effects: [
      { deviceId: 'currents', preset: 'Wide tide', params: { depth: 0.75, rate: 0.35 } },
      { deviceId: 'expanse', preset: 'Faint air', params: { mix: 0.22, decay: 4 } },
    ],
  },
  {
    id: 'left-hands-back-bar-at-closing',
    name: 'Back bar at closing',
    category: 'keys',
    description:
      'Overdriven tines pushed again through a triode with a bump in the lows, and a dark spring at the end.',
    preview: TROT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Warm overdrive',
      params: { volume: -11.5, drive: 0.6, decay: 0.8, release: 0.12 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.45, lowBump: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'left-hands-shell-in-the-palm',
    name: 'Shell in the palm',
    category: 'bell',
    description:
      'Glassy tines held two at a time, their partials twinkling one by one in a short pale room.',
    preview: SHELLS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glass bells',
      params: { volume: -12.5, decay: 1.5, bell: 0.85, tone: 0.8, hardness: 0.7 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle', params: { depth: 0.8 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'left-hands-damper-half-raised',
    name: 'Damper half raised',
    category: 'keys',
    description:
      'Tines that ring on past the key, the strikes turned down under their tones and traced by a faint tape echo.',
    preview: HALF_PEDAL,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dampers off',
      params: { release: 1.3, decay: 1.8, tone: 0.4, bell: 0.4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft hammers', params: { attacks: -20 } },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 540 } },
    ],
  },
  {
    id: 'left-hands-under-the-dance-hall',
    name: 'Under the dance hall',
    category: 'keys',
    description:
      'Barking tines heard from far down a hall through one loudspeaker, then held level by a slow compressor.',
    preview: STRIDE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bark: 0.75, hardness: 0.8, drive: 0.3 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'ambient-comp', preset: 'Keys' },
    ],
  },
  {
    id: 'left-hands-oars-in-six',
    name: 'Oars in six',
    category: 'keys',
    description:
      'Tines panned by a slow tremolo, each touch skipping away in softening echoes from side to side.',
    preview: SIX,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremoloRate: 0.28, decay: 0.7, release: 0.2, bell: 0.3 },
    },
    effects: [
      {
        deviceId: 'skipping-stone',
        preset: 'Wide rings',
        params: { first: 180, loss: 2.5, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'left-hands-outer-fingers-walk',
    name: 'Outer fingers walk',
    category: 'keys',
    description:
      'Suitcase tines with more bark, thickened by a three-voice chorus and a small bright plate.',
    preview: WALKING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { bark: 0.65, tremolo: 0, hardness: 0.85, tone: 0.7, release: 0.18 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { depth: 65, mix: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { decay: 0.35, mix: 0.2 } },
    ],
  },
  {
    id: 'left-hands-hired-keys-next-door',
    name: 'Hired keys next door',
    category: 'keys',
    description:
      'Quick-shaking short tines on a worn record, moved a few rooms away so the top is gone.',
    preview: ROCKING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Fast shimmer',
      params: { volume: -11.5, tremolo: 0.6, tremoloRate: 7, bell: 0.4, tone: 0.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { warp: 0.5 } },
      { deviceId: 'distance', preset: 'Next door' },
    ],
  },
  {
    id: 'left-hands-reed-in-the-seventh',
    name: 'Reed in the seventh',
    category: 'keys',
    description:
      'A reedy barking tine held in two notes while a twelve-stage phaser turns slowly through it, in a faint hall.',
    preview: SHELLS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Reedy flutter',
      params: { tremolo: 0, tone: 0.5, release: 0.4, bark: 0.8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.6 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'left-hands-cushion-under-the-elbow',
    name: 'Cushion under the elbow',
    category: 'keys',
    description:
      'Dark tines that throb slowly in the middle, just under water, their low end kept narrow and their top wide.',
    preview: PEDAL,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Deep throb',
      params: { volume: -16.5, tremoloRate: 0.95, tremolo: 0.8, decay: 2, tone: 0.3 },
    },
    effects: [
      { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.1, width: 0.8 } },
      { deviceId: 'spread', preset: 'Firm and airy' },
    ],
  },
  {
    id: 'left-hands-chord-let-go-early',
    name: 'Chord let go early',
    category: 'keys',
    description:
      'Hard bright tines cut the moment the key is up, a cluster of echoes answering each clipped chord.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Short tines',
      params: { volume: -12.5, decay: 0.45, bark: 0.2, bell: 0.5, hardness: 0.95, tone: 0.85 },
    },
    effects: [
      { deviceId: 'constellation', preset: 'Tight clusters', params: { span: 900, mix: 0.4 } },
    ],
  },
  {
    id: 'left-hands-cellar-under-the-tenth',
    name: 'Cellar under the tenth',
    category: 'keys',
    description:
      'Short felted tines with the top let back in, an octave added below, warmed by a tube and set in a tight room.',
    preview: WALKING,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { volume: -16.5, hardness: 0.6, bell: 0.4, decay: 0.6, release: 0.08, tone: 0.6 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.7, up1: 0 } },
      { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 7, outputDb: -4 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'left-hands-skylight-in-three',
    name: 'Skylight in three',
    category: 'bell',
    description:
      'A short tine all bell and no bark, with grains of it thrown an octave up in a delay, in a tight swarm of echoes.',
    preview: WALTZ,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { volume: -13.5, bell: 1, bark: 0, decay: 0.5, hardness: 0.9, tone: 0.9, tremolo: 0 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.3, pitch: 12 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'left-hands-far-end-of-the-party',
    name: 'Far end of the party',
    category: 'keys',
    description:
      'Slow-panned long tines far off in a room, their tails sagging in pitch as they age.',
    preview: TENTHS,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Glacial pan',
      params: { tone: 0.5, decay: 1.4, release: 1.1 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Back of the hall' },
      { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'left-hands-metronome-switched-off',
    name: 'Metronome switched off',
    category: 'keys',
    description:
      'Plain soft tines with no tremolo and no pan, on a hissing worn cassette, the peaks leaned on by a fast limiter.',
    preview: STRIDE,
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { volume: -17, tremolo: 0, pan: 0, hardness: 0.5, bell: 0.2, decay: 0.9 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.5, noise: 0.35 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },

  // Felt piano: felt, a half pedal and the room.
  {
    id: 'left-hands-felt-over-one-three-five',
    name: 'Felt over one three five',
    category: 'keys',
    description:
      'A close thick-felted piano, nearly dry, its bass eased down and its top shut, swinging from ear to ear.',
    preview: ROCKING,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { felt: 1, hardness: 0.15, thump: 0.3, reverbMix: 0.05, grit: 0, outputDb: -13.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 60, low: -4, highCut: 1800 } },
      { deviceId: 'around', preset: 'Wide pendulum', params: { rate: 0.5 } },
    ],
  },
  {
    id: 'left-hands-stride-in-stockings',
    name: 'Stride in stockings',
    category: 'keys',
    description:
      'An old upright with the soft pedal down, all knock and loose unisons, heard through a horn loudspeaker in a room.',
    preview: TROT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Old upright',
      params: { soft: 1, detune: 1, thump: 1, felt: 0.5, outputDb: -8 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { mix: 0.75 } }],
  },
  {
    id: 'left-hands-rolled-and-left-there',
    name: 'Rolled and left there',
    category: 'keys',
    description:
      'A half-pedalled piano whose rolled chords set a bank of strings in C ringing behind them.',
    preview: TENTHS,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: { felt: 0.3, sustain: 0.3, outputDb: -18 },
    },
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Open triad',
        params: { root: 0, sympathy: 0.7, decay: 5, mix: 0.6 },
      },
      { deviceId: 'stereo-widener', preset: 'Wide' },
    ],
  },
  {
    id: 'left-hands-half-a-foot-of-pedal',
    name: 'Half a foot of pedal',
    category: 'keys',
    description:
      'A piano under a deep half pedal, its softest hammers drawn back to a swell, in a reverb whose tail slowly blooms.',
    preview: HALF_PEDAL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Half pedal',
      params: {
        felt: 0.8,
        hardness: 0,
        sustain: 0.6,
        damper: 0.05,
        pedalNoise: 0.2,
        outputDb: -18.5,
      },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 160, depth: 0.85 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'left-hands-one-key-never-lifted',
    name: 'One key never lifted',
    category: 'keys',
    description:
      'A clean piano with still unisons, and behind it a soft string pad that takes seconds to swell in.',
    preview: PEDAL,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Still strings',
      params: { felt: 0.6, hardness: 0.3, outputDb: -15 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.5, brightness: 1600 } },
    ],
  },
  {
    id: 'left-hands-parlour-counts-three',
    name: 'Parlour counts three',
    category: 'keys',
    description:
      'A hard bright upright on an old fast record, thin and crackling, with a short plate behind it.',
    preview: WALTZ,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Glass upright',
      params: { hardness: 0.8, stiffness: 1.2, reverbMix: 0.1, outputDb: -10 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'left-hands-knuckles-before-chord',
    name: 'Knuckles before chord',
    category: 'keys',
    description:
      'A creaking felted piano with the strikes pushed forward and the tones held short, in a small wooden body.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Close and creaky',
      params: { felt: 0.8, hardness: 0.35, damper: 1, resonance: 0, outputDb: -8 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Strikes forward', params: { tones: -8 } },
      { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
    ],
  },

  // Acoustic guitar: the thumb for the bass, three fingers for the chord.
  {
    id: 'left-hands-palm-on-the-low-strings',
    name: 'Palm on the low strings',
    category: 'plucked',
    description:
      'A palm-muted steel guitar held level by a limiter, each clipped chord answered by a short soft tape echo.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Muted pattern',
      params: { volume: -5.5, sustain: 0.9, release: 0.16, tone: 0.35, body: 0.85, position: 0.14 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -8.5 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.28 } },
      { deviceId: 'ambient-eq', params: { low: 3, highCut: 4200 } },
    ],
  },
  {
    id: 'left-hands-nylon-rowing-home',
    name: 'Nylon rowing home',
    category: 'plucked',
    description:
      'A soft nylon guitar with little body, moving slowly from side to side under a dark veil of hall.',
    preview: SIX,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { volume: -4.5, release: 0.5, sustain: 3.5, body: 0.3, position: 0.34, tone: 0.45 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 0.6, depth: 0.8, shape: 0 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'left-hands-barre-lifted-at-once',
    name: 'Barre lifted at once',
    category: 'plucked',
    description:
      'Nylon strings stopped almost as they sound, a wet splash of spring after each chord and a limiter over both.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon pizzicato',
      params: { volume: -4, sustain: 0.8, release: 0.16, nail: 0.4 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.35 } },
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -8.5 } },
    ],
  },
  {
    id: 'left-hands-twelve-oars',
    name: 'Twelve oars',
    category: 'plucked',
    description:
      'A twelve-string guitar in broken chords through a bucket-brigade echo with chorus on the repeats.',
    preview: SIX,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { volume: 0, sustain: 3, release: 0.8, nail: 0.5, tone: 0.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Chorused', params: { time: 540, mix: 0.4 } }],
  },
  {
    id: 'left-hands-fifths-by-the-cot',
    name: 'Fifths by the cot',
    category: 'plucked',
    description:
      'Dark steel strings plucked over the hole, five dark bowls tuned on D singing with the fifths they touch.',
    preview: CRADLE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: -3, tone: 0.2, sustain: 6, release: 3 },
    },
    effects: [
      {
        deviceId: 'bowls',
        preset: 'Five dark bowls',
        params: { root: 2, scale: 1, ring: 6, mix: 0.45 },
      },
    ],
  },
  {
    id: 'left-hands-thumb-under-the-swell',
    name: 'Thumb under the swell',
    category: 'plucked',
    description:
      'A bright nylon guitar under the bare thumb, stopped soon after each key, rising and falling in uneven waves in a small room.',
    preview: ROCKING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: {
        volume: 4.5,
        type: 1,
        sustain: 2,
        release: 0.25,
        tone: 0.85,
        position: 0.2,
        body: 0.8,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.6, depth: 0.75 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'left-hands-two-and-three-brushed',
    name: 'Two and three brushed',
    category: 'plucked',
    description:
      'A loose full strum on steel strings, smoothed by a medium plate, the top opened wide.',
    preview: WALTZ,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Lazy strum',
      params: { volume: -1, strum: 120, sustain: 2.5, release: 0.4, body: 0.6 },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.35 } },
      { deviceId: 'spread', preset: 'Wide top' },
    ],
  },
  {
    id: 'left-hands-bass-string-by-a-stove',
    name: 'Bass string by a stove',
    category: 'plucked',
    description:
      'A dark guitar under which a soft organ stop an octave below speaks just after each pluck.',
    preview: STRIDE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Dark wood',
      params: { volume: 1, sustain: 2.2, release: 0.3, tone: 0.4, nail: 0.35 },
    },
    effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { speak: 90, mix: 0.6 } }],
  },
  {
    id: 'left-hands-nail-without-the-bass',
    name: 'Nail without the bass',
    category: 'plucked',
    description:
      'A picked guitar with its bass and its air both rolled away, the middle left faintly glimmering an octave up.',
    preview: WALTZ,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Glass pick',
      params: { volume: -5, sustain: 3, release: 0.6, tone: 0.8, shimmer: 0.3 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 260 } },
      { deviceId: 'shimmer', preset: 'Faint glimmer', params: { decay: 4, mix: 0.25 } },
    ],
  },
  {
    id: 'left-hands-stride-on-bare-wire',
    name: 'Stride on bare wire',
    category: 'plucked',
    description:
      'Steel strings with almost no wood, played through a small driven amplifier standing in a room.',
    preview: TROT,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bare string',
      params: { volume: -5.5, sustain: 2, release: 0.15, nail: 0.4 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.5 } }],
  },
  {
    id: 'left-hands-cradle-by-wet-glass',
    name: 'Cradle by wet glass',
    category: 'plucked',
    description:
      'A guitar whose strings all ring on, with light rain tapping on it and moving its level.',
    preview: CRADLE,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Let ring',
      params: { volume: -3, nail: 0.15, sustain: 7, release: 4 },
    },
    effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } }],
  },
  {
    id: 'left-hands-unfolding-from-the-bass',
    name: 'Unfolding from the bass',
    category: 'plucked',
    description:
      'Bright strings plucked by the bridge, each note fanned out by a delay that lets the low part through first.',
    preview: HALF_PEDAL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Bridge harp',
      params: { volume: -3, sustain: 5, release: 2, nail: 0.4, tone: 0.7 },
    },
    effects: [{ deviceId: 'prism', preset: 'Low to high', params: { time: 420, mix: 0.4 } }],
  },
  {
    id: 'left-hands-g-string-kept-going',
    name: 'G string kept going',
    category: 'plucked',
    description:
      'Steel strings held long, swaying only when they have rung a while, in front of a thin fuzzy reverb.',
    preview: PEDAL,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { sustain: 9, release: 1, position: 0.24 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'haze', preset: 'Thin veil' },
    ],
  },
  {
    id: 'left-hands-tenth-on-two-strings',
    name: 'Tenth on two strings',
    category: 'plucked',
    description: 'A long ringing nylon guitar with two doubles flying slowly close beside it.',
    preview: WALKING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon lullaby',
      params: { volume: -3.5, release: 1.5, sustain: 8 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.55 } }],
  },
  {
    id: 'left-hands-waltz-on-the-sill',
    name: 'Waltz on the sill',
    category: 'plucked',
    description:
      'A firm steel guitar from a small kitchen radio, narrow, with a little static round it.',
    preview: WALTZ,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { volume: -3, body: 0.9, sustain: 2, release: 0.3, nail: 0.7 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.08, interference: 0.04 } },
    ],
  },
  {
    id: 'left-hands-chimes-behind-the-bass',
    name: 'Chimes behind the bass',
    category: 'plucked',
    description:
      'A picked twelve-string close to the bridge, limited, swept by a gentle flanger and set wider at the top.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve chime',
      params: { volume: -7, sustain: 3.2, release: 0.7 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -7 } },
      { deviceId: 'flanger', preset: 'Gentle sweep', params: { depth: 70, mix: 0.6 } },
      { deviceId: 'spread', preset: 'Tight shimmer' },
    ],
  },
  {
    id: 'left-hands-chords-turned-over',
    name: 'Chords turned over',
    category: 'plucked',
    description: 'A drifting twelve-string left to ring, each chord played backwards after itself.',
    preview: PLATES,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve drift',
      params: { release: 2, strum: 100, shimmer: 0.8 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { time: 700, mix: 0.4 } },
    ],
  },
  {
    id: 'left-hands-trot-near-the-bridge',
    name: 'Trot near the bridge',
    category: 'plucked',
    description:
      'Dry nylon plucked hard by the bridge, limited, coarsened to ten dusty bits, then set in a small booth.',
    preview: TROT,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon bridge',
      params: { volume: -0.5, sustain: 2.4, release: 0.6 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -8.5 } },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'left-hands-second-hand-softer',
    name: 'Second hand, softer',
    category: 'plucked',
    description:
      'A guitar walking in tenths and, one faint follower two steps behind it, so the two lie in thirds.',
    preview: WALKING,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { nail: 0.1, position: 0.38, body: 0.5, sustain: 3 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.36, mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'left-hands-quiet-under-a-singer',
    name: 'Quiet under a singer',
    category: 'plucked',
    description:
      'A nylon guitar played with the flesh of the thumb, its swells held level by a slow hand, its quiet ends brought up.',
    preview: SHELLS,
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Soft thumb',
      params: { type: 1, sustain: 8, release: 3, strum: 20, tone: 0.3 },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'lift', preset: 'Long tails' },
    ],
  },

  // Harp: damped in the lap, swept from the elbow, or left to ring.
  {
    id: 'left-hands-flat-of-the-palm',
    name: 'Flat of the palm',
    category: 'plucked',
    description:
      'A damped harp, every note choked soon after it sounds, with a small room close behind.',
    preview: TROT,
    instrument: {
      deviceId: 'harp',
      preset: 'Muted harp',
      params: { damp: 0.95, decay: 0.4, touch: 0.5 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25, size: 0.3 } }],
  },
  {
    id: 'left-hands-swept-from-the-elbow',
    name: 'Swept from the elbow',
    category: 'plucked',
    description:
      'Soft harp chords that roll themselves slowly from the bass up, in a wide open valley of reverb.',
    preview: PLATES,
    instrument: {
      deviceId: 'harp',
      preset: 'Slow rolled chord',
      params: { volume: -3.5, sweep: 0.9, decay: 1.2, halo: 0.6 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
  },
  {
    id: 'left-hands-nearest-the-board',
    name: 'Nearest the board',
    category: 'plucked',
    description:
      'A harp plucked by the board, dry and short, thickened by a loose chorus double and soft saturation.',
    preview: WALTZ,
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { volume: -3, decay: 0.35, damp: 0.4, body: 0.7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
    ],
  },
  {
    id: 'left-hands-thirteen-strings-rock',
    name: 'Thirteen strings rock',
    category: 'plucked',
    description:
      'Koto strings rocked in fifths while moments of them drift back, dark, from a long echo.',
    preview: CRADLE,
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { volume: -1.5, touch: 0.3, decay: 1.3, pluck: 0.2 },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.35 } }],
  },
  {
    id: 'left-hands-silk-with-no-edge',
    name: 'Silk with no edge',
    category: 'plucked',
    description:
      'Koto silk plucked toward the middle, its attacks drawn back so each note fades in, a quick compressor holding the row level.',
    preview: SIX,
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { volume: 1, bend: 0, pluck: 0.4, decay: 1.2, halo: 0.3 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 130 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
    ],
  },
  {
    id: 'left-hands-low-strings-of-steel',
    name: 'Low strings of steel',
    category: 'plucked',
    description:
      'Guzheng strings in rolled tenths through one slack spring, the tail of the coil left long.',
    preview: TENTHS,
    instrument: {
      deviceId: 'harp',
      preset: 'Guzheng',
      params: { touch: 0.3, decay: 1.6, halo: 0.2 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.3 } }],
  },
  {
    id: 'left-hands-hollow-one-five-three',
    name: 'Hollow one five three',
    category: 'plucked',
    description:
      'A dark hollow harp plucked at mid string, the lows and the highs pulsing by turns in a harmonic tremolo.',
    preview: ROCKING,
    instrument: {
      deviceId: 'harp',
      preset: 'Dark hollow harp',
      params: { volume: -2.5, decay: 0.9, damp: 0.5, touch: 0.15 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.5, depth: 0.8 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'left-hands-dry-after-the-beat',
    name: 'Dry after the beat',
    category: 'plucked',
    description:
      'A fully damped harp, almost a knock, skipping twice from side to side after each chord.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'harp',
      preset: 'Short dry pluck',
      params: { decay: 0.4, body: 0.6, touch: 0.5 },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Two skips' }],
  },
  {
    id: 'left-hands-wire-halo-over-g',
    name: 'Wire halo over G',
    category: 'plucked',
    description:
      'Bright guzheng wire with a long halo, smeared into a haze over a bass that stays clear.',
    preview: PEDAL,
    instrument: {
      deviceId: 'harp',
      preset: 'Steel shimmer',
      params: { volume: -6, touch: 0.35, decay: 2, pluck: 0.16, body: 0.4 },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { lowCut: 300, mix: 0.45 } },
    ],
  },
  {
    id: 'left-hands-tenths-through-glass',
    name: 'Tenths through glass',
    category: 'plucked',
    description:
      'Long soft harp tenths over a reverb that slips an octave down each time it comes round.',
    preview: TENTHS,
    instrument: { deviceId: 'harp', preset: 'Long glass ring', params: { decay: 2, halo: 0.7 } },
    effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { decay: 6, mix: 0.35 } }],
  },
  {
    id: 'left-hands-while-the-hand-stays',
    name: 'While the hand stays',
    category: 'plucked',
    description:
      'Harp strings that ring only while they are held, with a four-stage phaser moving slowly across them.',
    preview: HALF_PEDAL,
    instrument: {
      deviceId: 'harp',
      preset: 'Rings while held',
      params: { volume: -3, damp: 0.8, decay: 2, pluck: 0.2 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { stages: 0, mix: 0.55 } }],
  },

  // Chord harp: the keys held are the chord, and each touch sweeps the plate.
  {
    id: 'left-hands-plate-under-the-palm',
    name: 'Plate under the palm',
    category: 'plucked',
    description:
      'Each chord swept upward over three octaves of soft strings, on warm quarter-inch tape with a little drift.',
    preview: PLATES,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { pad: 0.1, tone: 0.4 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
  },
  {
    id: 'left-hands-hand-drawn-back-down',
    name: 'Hand drawn back down',
    category: 'plucked',
    description:
      'Four octaves of soft strings swept slowly downward into a space with a ten second tail.',
    preview: PLATES,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { direction: 1, strum: 110, tone: 0.25 },
    },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, mix: 0.35, highCut: 3500 },
      },
    ],
  },
  {
    id: 'left-hands-toy-hand-counts-three',
    name: 'Toy hand counts three',
    category: 'plucked',
    description:
      'Short strings flicked upward over two octaves, coarse and jittery, a dark tape echo answering each flick.',
    preview: WALTZ,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { volume: 2.5, direction: 0, sustain: 0.5, tone: 0.4, strum: 35 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Jittery', params: { mix: 0.8 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dotted bounce',
        params: { time: 500, highCut: 2000, mix: 0.4 },
      },
    ],
  },
  {
    id: 'left-hands-shell-on-a-heavy-rotor',
    name: 'Shell on a heavy rotor',
    category: 'organ',
    description:
      'A held pad over a dark unswept chord, turned fast by heavy rotors across the room, the bass thinned first.',
    preview: SHELLS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Soft organ chord',
      params: { tone: 0.05, sustain: 2, pad: 0.8, spread: 0.8 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Rumble cut', params: { cutoffHz: 180 } },
      { deviceId: 'rotary', preset: 'Heavy rotors', params: { distance: 0.7, drumDepth: 0.8 } },
    ],
  },
  {
    id: 'left-hands-muffled-over-a-low-g',
    name: 'Muffled over a low G',
    category: 'plucked',
    description: 'A muffled slow strum with a bed of pad under it, heard far off through fog.',
    preview: PEDAL,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Muffled slow strum',
      params: { sustain: 3, strum: 60, pad: 0.5, tone: 0.2 },
    },
    effects: [{ deviceId: 'distance', preset: 'Through fog' }],
  },
  {
    id: 'left-hands-drops-on-every-chord',
    name: 'Drops on every chord',
    category: 'texture',
    description:
      'Four octaves of very short strings scattered at random, sparks of them thrown later and higher.',
    preview: PLATES,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'String rain',
      params: { volume: 6, strum: 70, tone: 0.8, sustain: 0.5 },
    },
    effects: [
      { deviceId: 'glints', preset: 'Late answers', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'left-hands-music-box-waits-for-two',
    name: 'Music box waits for two',
    category: 'bell',
    description:
      'A small music box played as chords, unswept, with a ring modulator tuned to C glinting round each one and a fast limiter on the strikes.',
    preview: WALTZ,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Small music box',
      params: { volume: 1.5, sustain: 1.4, spread: 0.5 },
    },
    effects: [
      { deviceId: 'ring', preset: 'Faint halo', params: { mix: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Tucked under' },
    ],
  },
  {
    id: 'left-hands-brushed-once-a-bar',
    name: 'Brushed once a bar',
    category: 'plucked',
    description:
      'A soft brushed chord held long, its quiet tail brought up slowly until the next one is struck.',
    preview: PLATES,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Brushed chord',
      params: { volume: -16, tone: 0.35, pad: 0 },
    },
    effects: [
      { deviceId: 'lift', preset: 'Slow tide', params: { amount: 1 } },
      { deviceId: 'stereo-detune', preset: 'Wider' },
    ],
  },
  {
    id: 'left-hands-ripple-of-two-fingers',
    name: 'Ripple of two fingers',
    category: 'plucked',
    description:
      'One octave swept up and back for every pair of notes, its partials rising in small ripples of level.',
    preview: SHELLS,
    instrument: {
      deviceId: 'chord-harp',
      preset: 'One octave ripple',
      params: { sustain: 2.5, tone: 0.5 },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Rising ripple' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },

  // Wavetable: the same hand held instead of struck.
  {
    id: 'left-hands-harmonium-left-side',
    name: 'Harmonium, left side',
    category: 'organ',
    description:
      'A quick reed table walking in tenths, breathing open and shut in a slow cycle, close and dry.',
    preview: WALKING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: { attack: 0.05, release: 0.3, motion: 0.1, cutoff: 1700 },
    },
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.5, out: 2, depth: 0.5 } },
    ],
  },
  {
    id: 'left-hands-two-notes-no-hammer',
    name: 'Two notes, no hammer',
    category: 'pad',
    description:
      'A low dark bed with a strong sub, two notes at a time, with octaves above and a slow chorus.',
    preview: SHELLS,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Low bed',
      params: { attack: 0.25, release: 1.2, cutoff: 620, sub: 0.7 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave', params: { sub1: 0, up1: 0.35 } },
      { deviceId: 'chorus', preset: 'Slow drift' },
    ],
  },
  {
    id: 'left-hands-thin-chord-off-the-beat',
    name: 'Thin chord off the beat',
    category: 'keys',
    description:
      'A narrow pulse as short as the key is down, plucked by a filter and answered by a doubling echo.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Narrow pulse',
      params: { attack: 0.005, release: 0.12, cutoff: 3000, motion: 0 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 350, envAmount: 60, envAttackMs: 3, envReleaseMs: 140 },
      },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'left-hands-glass-one-five-three',
    name: 'Glass one five three',
    category: 'bell',
    description:
      'Bright ringing glass keys in broken chords, each note with a few pure sines swelling in behind it.',
    preview: ROCKING,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass bell keys',
      params: { release: 0.9, position: 0.8, cutoff: 5000 },
    },
    effects: [
      { deviceId: 'sine-shadow', preset: 'Nearly dry', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'left-hands-hollow-pedal-tone',
    name: 'Hollow pedal tone',
    category: 'pad',
    description:
      'A hollow table that speaks fairly soon, the bass steady while its upper bands drift from side to side.',
    preview: PEDAL,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: { attack: 0.2, release: 1.4, cutoff: 1200, motion: 0.4 },
    },
    effects: [{ deviceId: 'currents', preset: 'Side to side', params: { lowHold: 200 } }],
  },
  {
    id: 'left-hands-hum-of-four-fingers',
    name: 'Hum of four fingers',
    category: 'voice',
    description: 'A humming vowel table in whole chords, led into a hall whose tail sings oo.',
    preview: PLATES,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Humming choir',
      params: { attack: 0.3, release: 1 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.4, decay: 4 } }],
  },
  {
    id: 'left-hands-sine-rocks-a-fifth',
    name: 'Sine rocks a fifth',
    category: 'bass',
    description:
      'A near-sine with a half sub, rocking in fifths with no click at either end, pushed into a warm reel.',
    preview: CRADLE,
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: { volume: -14, attack: 0.03, release: 0.25, cutoff: 900, position: 0.1 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { drive: 0.6, noise: 0.15 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },

  // West Coast: a low-pass gate for the damper.
  {
    id: 'left-hands-round-bass-dry-chord',
    name: 'Round bass, dry chord',
    category: 'bass',
    description:
      'A dark folded pluck that closes before the next beat, on a pushed and thumping cassette.',
    preview: STRIDE,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Round bass',
      params: { volume: -2, decay: 0.7, colour: 0.15, fold: 0.3 },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump', params: { drive: 0.5 } }],
  },
  {
    id: 'left-hands-mallet-in-the-left',
    name: 'Mallet in the left',
    category: 'keys',
    description:
      'A soft wooden mallet in broken chords, its body made larger and copied a few cents off at the sides.',
    preview: ROCKING,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { volume: -2, decay: 1, colour: 0.5, chance: 0 },
    },
    effects: [
      { deviceId: 'size', preset: 'Larger', params: { size: 0.5 } },
      { deviceId: 'stereo-detune', preset: 'Classic' },
    ],
  },
  {
    id: 'left-hands-small-keys-at-a-trot',
    name: 'Small keys at a trot',
    category: 'plucked',
    description: 'A buzzing thumbed key with a short decay, ringing inside a clay pot.',
    preview: TROT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Thumb piano',
      params: { volume: -5.5, decay: 0.6, fm: 0.2, chance: 0.1 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
  },
  {
    id: 'left-hands-gate-shuts-on-the-chord',
    name: 'Gate shuts on the chord',
    category: 'plucked',
    description:
      'Woody plucks a third of a second long, leaned on by a limiter, each with a little reversed swell of reverb after it.',
    preview: AFTERBEAT,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { volume: -3, decay: 0.3, fold: 0.25, colour: 0.5 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 34, outputGain: -8.5 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 0.4, mix: 0.35 } },
    ],
  },
  {
    id: 'left-hands-folded-under-a-pair',
    name: 'Folded under a pair',
    category: 'keys',
    description:
      'A deep folded tone that holds at about half its level, warmed, with a phaser that moves only what is above the bass.',
    preview: PEDAL,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: { colour: 0.4, fold: 0.5, sustain: 0.5, decay: 1.5, symmetry: 0.2 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'phaser', preset: 'Bass safe' },
    ],
  },
  {
    id: 'left-hands-breath-of-two-sines',
    name: 'Breath of two sines',
    category: 'pad',
    description:
      'Plain sines that fade in, with no folding at all, and grains of them climbing by octaves behind.',
    preview: SHELLS,
    instrument: {
      deviceId: 'west-coast',
      preset: 'Sine swell',
      params: { volume: -9, attack: 0.35, decay: 2, sustain: 0.8, colour: 0.6 },
    },
    effects: [{ deviceId: 'grain-delay', preset: 'Shimmer wash', params: { mix: 0.3 } }],
  },

  // Zither: one string, an open fifth, or the whole chord under one finger.
  {
    id: 'left-hands-one-finger-broken-chord',
    name: 'One finger, broken chord',
    category: 'plucked',
    description:
      'A single felted string a note, nearly dry, with a little doubled width and no strings ringing beside it.',
    preview: ROCKING,
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { volume: -5, sympathy: 0, decay: 2, release: 0.5, brightness: 0.25 },
    },
    effects: [{ deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.5 } }],
  },
  {
    id: 'left-hands-chord-bar-pressed',
    name: 'Chord bar pressed',
    category: 'plucked',
    description:
      'A picked chord zither that strums a major chord on every key, short, from a loudspeaker at the far end of a hall.',
    preview: ROOTS,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: { volume: -3, decay: 2.5, release: 0.6, strum: 60 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Far end of the hall' }],
  },
  {
    id: 'left-hands-minor-bar-half-pressed',
    name: 'Minor bar, half pressed',
    category: 'plucked',
    description:
      'Each key strums a minor chord with a finger, soft and dark, in a wandering flock of doubles.',
    preview: ROOTS_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither minor',
      params: { exciter: 0, brightness: 0.3, strum: 150, position: 0.4 },
    },
    effects: [{ deviceId: 'murmuration', preset: 'Wide and dull' }],
  },
  {
    id: 'left-hands-open-fifth-cradled',
    name: 'Open fifth, cradled',
    category: 'plucked',
    description:
      'Every key plays its fifth and octave on open strings that ring into one another, on a warped record.',
    preview: CRADLE,
    instrument: {
      deviceId: 'zither',
      preset: 'Open zither',
      params: { decay: 4, release: 2, strum: 80 },
    },
    effects: [{ deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.1 } }],
  },
  {
    id: 'left-hands-plectrum-in-six',
    name: 'Plectrum in six',
    category: 'plucked',
    description:
      'A picked string over a long narrow body, short, its repeats going round three tape heads.',
    preview: SIX,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { volume: -4.5, decay: 1.6, release: 0.4, brightness: 0.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { time: 270, mix: 0.3 } }],
  },
  {
    id: 'left-hands-arpeggio-not-damped',
    name: 'Arpeggio, not damped',
    category: 'plucked',
    description:
      'A harp-bodied string for each finger with nothing to stop it, in the wide warm air of a late summer that never turns.',
    preview: HALF_PEDAL,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { decay: 5, release: 8, brightness: 0.4 },
    },
    effects: [{ deviceId: 'seasons', preset: 'Long evening' }],
  },
  {
    id: 'left-hands-hand-dragged-across',
    name: 'Hand dragged across',
    category: 'plucked',
    description:
      'One finger dragged over a major chord with its ninth, up for one touch and down for the next, dissolving into a cloud behind.',
    preview: ROOTS,
    instrument: {
      deviceId: 'zither',
      preset: 'Harp glissando',
      params: { volume: -6.5, strum: 400, decay: 4, release: 3, sympathy: 0.1 },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } }],
  },
  {
    id: 'left-hands-hammers-hold-the-g',
    name: 'Hammers hold the G',
    category: 'string',
    description:
      'Hammered octaves rolling for as long as the key is down, the tones turned under the strikes and those softened to puffs.',
    preview: PEDAL,
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { volume: -2, roll: 6, brightness: 0.4, release: 1.5, sympathy: 0.4 },
    },
    effects: [
      { deviceId: 'sift', preset: 'Soft puffs', params: { tones: -10, hold: 0.4 } },
      { deviceId: 'spread', preset: 'Wide pad' },
    ],
  },
  {
    id: 'left-hands-octaves-count-in-three',
    name: 'Octaves count in three',
    category: 'plucked',
    description:
      'Picked octave strings pulled well out with each other, thinned of bass, with a two-spring tank.',
    preview: WALTZ,
    instrument: {
      deviceId: 'zither',
      preset: 'Twelve-string haze',
      params: { volume: -3.5, decay: 3, release: 0.8, courses: 1, sympathy: 0.1 },
    },
    effects: [
      { deviceId: 'ambient-eq', params: { lowCut: 240, low: -6, air: 3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'left-hands-second-leans-on-the-root',
    name: 'Second leans on the root',
    category: 'plucked',
    description:
      'A slow repeated strum of root, second and fifth up and down, hung in a long dark fuzzed reverb.',
    preview: ROOTS,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: { volume: -7.5, strum: 260, release: 4, decay: 6 },
    },
    effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { decay: 5, mix: 0.35 } }],
  },
  {
    id: 'left-hands-minor-under-the-roll',
    name: 'Minor under the roll',
    category: 'string',
    description:
      'Hammered minor chords falling and trembling together, moving round the listener in a slow figure of eight.',
    preview: ROOTS_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor tremolo',
      params: { volume: -4.5, roll: 9, strum: 80, release: 2, sympathy: 0.3 },
    },
    effects: [{ deviceId: 'around', preset: 'Slow eight', params: { rate: 0.25 } }],
  },
  {
    id: 'left-hands-fingers-fall-in-turn',
    name: 'Fingers fall in turn',
    category: 'plucked',
    description:
      'A suspended second let fall string by string from the top, kept behind glass by a soft attackless blur.',
    preview: ROOTS,
    instrument: {
      deviceId: 'zither',
      preset: 'Slow falling sus',
      params: { volume: -5.5, strum: 420, decay: 6, release: 6, sympathy: 0.4 },
    },
    effects: [{ deviceId: 'fog', preset: 'Behind glass' }],
  },
  {
    id: 'left-hands-fourth-cut-off-short',
    name: 'Fourth cut off short',
    category: 'plucked',
    description:
      'A nasal picked strum with a suspended fourth, stopped with the key and followed by a short gated burst of reverb.',
    preview: ROOTS_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Nasal sus strum',
      params: { volume: -1.5, strum: 45, decay: 1.5, release: 0.15, brightness: 0.6 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.35, mix: 0.35 } }],
  },
  {
    id: 'left-hands-tenth-with-all-strings',
    name: 'Tenth with all strings',
    category: 'plucked',
    description:
      'Soft felt hammers in octaves, every sympathetic string answering, in a vast nave of a hall.',
    preview: TENTHS,
    instrument: {
      deviceId: 'zither',
      preset: 'Felt and halo',
      params: { decay: 8, release: 4, brightness: 0.15 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
  },
  {
    id: 'left-hands-shell-kept-trembling',
    name: 'Shell kept trembling',
    category: 'string',
    description:
      'A fast hammered roll on two notes at a time, dulled to a murmur in a deep slow chorus.',
    preview: SHELLS,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: { volume: -8, roll: 13, brightness: 0.35, decay: 3, position: 0.3 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Deep sea' }],
  },
  {
    id: 'left-hands-stride-on-two-hammers',
    name: 'Stride on two hammers',
    category: 'plucked',
    description:
      'Dry single dulcimer strokes, short and woody, gritted by a transformer and nothing else.',
    preview: TROT,
    instrument: {
      deviceId: 'zither',
      preset: 'Quick dulcimer roll',
      params: {
        volume: -9,
        roll: 0,
        decay: 0.8,
        release: 0.12,
        sympathy: 0,
        courses: 0.3,
        brightness: 0.55,
      },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
  },
  {
    id: 'left-hands-walk-in-bare-octaves',
    name: 'Walk in bare octaves',
    category: 'plucked',
    description:
      'Picked octaves over a koto body with their partials faintly spread toward a bell, on a thin plate.',
    preview: WALKING,
    instrument: {
      deviceId: 'zither',
      preset: 'Koto pluck',
      params: { chord: 1, strum: 30, decay: 4, release: 1.5, position: 0.3, courses: 0.2 },
    },
    effects: [
      { deviceId: 'warp', preset: 'Thin glow' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'left-hands-dark-fifths-in-the-palm',
    name: 'Dark fifths in the palm',
    category: 'plucked',
    description:
      'Fingered fifths and octaves on a dark harp body, pressed into the shape of a round vowel.',
    preview: ROOTS_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Concert harp',
      params: { chord: 2, strum: 200, brightness: 0.2, position: 0.45, release: 3 },
    },
    effects: [{ deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.8 } }],
  },
  {
    id: 'left-hands-chord-no-longer-held',
    name: 'Chord no longer held',
    category: 'plucked',
    description:
      'A finger strum of a whole major chord that stops dead when the key is let up, with faint quick points after.',
    preview: ROOTS,
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither major',
      params: {
        volume: -3,
        exciter: 0,
        strum: 20,
        decay: 1,
        release: 0.06,
        sympathy: 0,
        body: 3,
        brightness: 0.45,
      },
    },
    effects: [{ deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.25 } }],
  },
  {
    id: 'left-hands-minor-on-loose-courses',
    name: 'Minor on loose courses',
    category: 'plucked',
    description:
      'Picked minor chords on doubled courses far out of tune with each other, dulled to the stylus of an old disc.',
    preview: ROOTS_MINOR,
    instrument: {
      deviceId: 'zither',
      preset: 'Minor glass haze',
      params: { volume: -5.5, decay: 5, release: 2, brightness: 0.6, sympathy: 0.4, strum: 100 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
