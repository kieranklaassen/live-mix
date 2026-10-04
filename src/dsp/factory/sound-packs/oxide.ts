// The sounds of the pack "Shedding Oxide": its presets played, a hundred sounds to
// paint with. Numbers 4001 to 4100.
//
// Nearly every preset here ends in worn tape, a loop that feeds back or a radio link, and
// what those add decides the kind more often than the instrument does: hiss under a dark
// tone leaves the analysis no pitch (a texture), a dropout is heard as a hit, a loop of
// tape repeats a stroke on a pulse. So the drones are the presets whose level holds still
// (most of them behind a fast limiter, which keeps them still in every key), the phrases
// on the loops come round with the loop, and a line that is bowed or blown, which has no
// hits, is a pad that ends.

import { PRESETS } from '../packs/oxide'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

/** A fast limiter with this much gain into it: a quiet tail comes up, a moving level holds still. */
const lift = (gain: number) => ({
  deviceId: 'ambient-limiter',
  params: { ceiling: -12, gain, release: 0.3, ride: 0 },
})
/** The limiter that holds a drone level whatever the tape under it does. */
const level = lift(24)
const narrow = { deviceId: 'stereo-widener', preset: 'Narrow' }
/** After the limiter: its gain brings up whatever the tape or a folded wave leaves off centre. */
const lowCut = { deviceId: 'ambient-eq', params: { lowCut: 30, clear: 0 } }

export const SOUNDS: readonly FactorySound[] = packSounds('oxide', 4000, PRESETS, [
  // Drones: tones the tape leaves level, or a limiter holds level.
  {
    n: 1,
    id: 'pedal-tone-old-reel-c',
    name: 'Pedal tone, old reel {C}',
    kind: 'drone',
    description: 'One bass {C} with a sub under it, held on old tape that sags and saturates.',
    preset: 'oxide-pedal-tone-old-reel',
    // The two oscillators in unison: nine cents apart they beat, and the level with them.
    set: { beat: 0 },
    ...looped(8, 5, 2, [36]),
  },
  {
    n: 2,
    id: 'folding-tone-c',
    name: 'Folding tone {C}',
    kind: 'drone',
    description:
      'A low {C} that folds over itself slowly, dulled by old slow tape, in a dark room.',
    preset: 'oxide-folding-tone-old-reel',
    // Narrowed before the limiter: two semitones down the fold put more at the sides than in the middle.
    then: [narrow, level, lowCut],
    ...looped(8, 5, 2, [48]),
  },
  {
    n: 3,
    id: 'lounge-organ-low-g',
    name: 'Lounge organ, low {G}',
    kind: 'drone',
    description:
      'A flute-stop organ on a low {G}, {D} and {B} through a slowly turning speaker, on a reel that sags.',
    preset: 'oxide-lounge-organ-old-reel',
    then: [level, quarterTurn(8)],
    ...looped(8, 4, 2, [43, [50, 0.8], [59, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'pipes-under-hiss-a',
    name: 'Pipes under hiss {A}',
    kind: 'drone',
    description:
      'Distant pipes on a low {A}, its fifth and its octave, with reel hiss low behind them in a hall.',
    preset: 'oxide-pipes-under-hiss',
    // No celeste rank, which beats, and the pipes further above the hiss: under it they have no pitch.
    set: { celeste: 0, volume: -6 },
    ...looped(8, 8, 2, [45, [52, 0.7], [57, 0.6]]),
  },
  {
    n: 5,
    id: 'high-pipes-under-hiss-d',
    name: 'High pipes under hiss {D}',
    kind: 'drone',
    description: 'Distant pipes on a high {D} and {A}, thin over their own sub rank, in a hall.',
    preset: 'oxide-pipes-under-hiss',
    set: { celeste: 0, volume: -6 },
    // Less into the limiter than the others: held as hard, three high pipes are at the top of the band.
    then: [lift(12)],
    ...looped(8, 8, 2, [62, [69, 0.7], [74, 0.6]]),
  },
  {
    n: 6,
    id: 'first-pass-strings-d',
    name: 'First pass strings {D}',
    kind: 'drone',
    description:
      'A string section from tape on {D} and {A}, on a three-second loop still nearly whole, in a hall.',
    preset: 'oxide-first-pass',
    then: [level],
    ...looped(8, 7, 2, [50, 57, 62]),
  },
  {
    n: 7,
    id: 'last-light-brass-fmaj7',
    name: 'Last light brass {F}maj7',
    kind: 'drone',
    description:
      'A dark synthetic brass chord on {F} with its seventh, swaying in pitch on tape in a very long hall.',
    preset: 'oxide-last-light-pad',
    then: [level, lowCut],
    ...looped(8, 8, 2, [41, 48, 57, 64]),
  },
  {
    n: 8,
    id: 'held-at-the-head-em7',
    name: 'Held at the head {E}m7',
    kind: 'drone',
    description:
      'One instant of a string chord on {E} minor seventh held as if the reel had stopped at the head, wobbling.',
    preset: 'oxide-held-against-the-head',
    source: 'chamber-strings-em7',
    then: [narrow, level],
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 9,
    id: 'lobby-reeds-g',
    name: 'Lobby reeds {G}',
    kind: 'drone',
    description:
      'A reed section from tape on {G} and {D}, through a small ceiling speaker, heard from across the room.',
    preset: 'oxide-lobby-reeds',
    // Narrowed before the limiter, which then holds what is heard in the middle; the top note
    // softer, since six semitones up the chord was at the very top of the band.
    then: [narrow, lift(12)],
    ...looped(8, 3, 2, [55, 62, [67, 0.4]]),
  },
  {
    n: 10,
    id: 'warm-pad-thin-tape-dm',
    name: 'Warm pad, thin tape {D}m',
    kind: 'drone',
    description:
      'A warm two-oscillator pad on {D} minor on a reel worn thin: no bass, no top and a slow wobble.',
    preset: 'oxide-warm-pad-thin-tape',
    then: [level],
    ...looped(8, 6, 2, [50, 57, 65]),
  },
  {
    n: 11,
    id: 'two-decks-one-tune-g',
    name: 'Two decks, one tune {G}',
    kind: 'drone',
    description:
      'A hollow pad on {G} with a ninth, doubled a fraction of a hertz apart like two decks at different speeds.',
    preset: 'oxide-two-decks-one-tune',
    then: [level],
    ...looped(8, 6, 2, [55, 62, 69, 71]),
  },
  {
    n: 12,
    id: 'chord-held-over-f',
    name: 'Chord held over {F}',
    kind: 'drone',
    description:
      'String-machine fifths on {F} with their last seconds looping underneath, duller, smeared and drifting.',
    preset: 'oxide-chord-held-over',
    // Narrowed before the limiter: four to six semitones up it was nearly as much side as middle.
    then: [narrow, level],
    ...looped(8, 6, 2, [53, 60, 65]),
  },

  // Pads: chords and lines the tape moves, a loop wears or a station fades.
  {
    n: 13,
    id: 'low-reel-chord-am',
    name: 'Low reel chord {A}m',
    kind: 'pad',
    description:
      'A just {A} minor chord over a deep sub on slow tape with a heavy low end, swelling once a loop.',
    preset: 'oxide-minor-chord-low-reel',
    // Narrowed: six semitones up the long room left nearly as much at the sides as in the middle.
    then: [narrow, breathe(0.125, 0.5)],
    ...looped(8, 9, 2, [45, [57, 0.7]]),
  },
  {
    n: 14,
    id: 'line-up-tone-b',
    name: 'Line-up tone {B}',
    kind: 'pad',
    description:
      'A plain {B} in octaves like the tone at the head of a reel, sagging as the tape drags, swelling once a loop.',
    preset: 'oxide-line-up-tone',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 3, 1, [59, [71, 0.6]]),
  },
  {
    n: 15,
    id: 'slow-spool-cellos-a',
    name: 'Slow spool cellos {A}',
    kind: 'pad',
    description:
      'Cellos on {A} and {E} from tape at half speed, an octave down, with hiss, swelling in a long plate.',
    preset: 'oxide-slow-spool-cellos',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [57, [64, 0.7]]),
  },
  {
    n: 16,
    id: 'monochord-at-two-thirds',
    name: 'Monochord at two-thirds',
    kind: 'pad',
    description:
      'Plain drone strings plucked in turn and replayed at two-thirds speed: a low {G} with {D} over it, on hissing tape.',
    preset: 'oxide-monochord-slowed',
    // Two-thirds speed is a fifth down. The key is D, its strings D and A, and what is heard is
    // G with D over it: the name gives no note, since the one played is not the one that sounds.
    then: [narrow],
    ...looped(8, 8, 2, [62]),
  },
  {
    n: 17,
    id: 'cellos-printed-hot-d',
    name: 'Cellos printed hot {D}',
    kind: 'pad',
    description:
      'The low octave of a string ensemble on {D} and {A}, pushed hard onto tape, swelling in a long plate.',
    preset: 'oxide-cellos-printed-hot',
    // Above the hiss that rides it: under the hiss the low octave has no pitch.
    set: { volume: 0 },
    then: [narrow, breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [50, [57, 0.7]]),
  },
  {
    n: 18,
    id: 'low-hold-tone-e',
    name: 'Low hold tone {E}',
    kind: 'pad',
    description:
      'Square waves on {E} and {B} with their subs, filtered dark, swelling over amplifier hum on tape.',
    preset: 'oxide-low-hold-tone',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [52, [59, 0.6]]),
  },
  {
    n: 19,
    id: 'low-bows-on-tape-a',
    name: 'Low bows on tape {A}',
    kind: 'pad',
    description:
      'Dark bows on a low {A} and {E} pushed into the tape until they thicken, swelling in a very long hall.',
    preset: 'oxide-low-bows-heavy-tape',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 2, [45, [52, 0.7]]),
  },
  {
    n: 20,
    id: 'carrier-tone-g',
    name: 'Carrier tone {G}',
    kind: 'pad',
    description:
      'A plain low {G} held like a station carrier, fading under whistles and static from the dial edge.',
    preset: 'oxide-carrier-tone',
    ...looped(8, 5, 2, [43]),
  },
  {
    n: 21,
    id: 'synth-horn-refrain-a',
    name: 'Synth horn refrain {A}',
    kind: 'pad',
    description:
      'Soft synthetic horns swelling on {A} then {G}, with long dull repeats behind them; it comes round.',
    preset: 'oxide-synth-horn-refrain',
    ...cycled(8, [
      [0, 3.4, 57],
      [0, 3.4, 64, 0.8],
      [3.9, 3.5, 55],
      [3.9, 3.5, 62, 0.8],
    ]),
  },
  {
    n: 22,
    id: 'reed-loop-slow-fade-d',
    name: 'Reed loop, slow fade {D}',
    kind: 'pad',
    description:
      'A clarinet fading in from nothing on {D}, {F} and {C} over its own four-second loop; it comes round.',
    preset: 'oxide-reed-loop-slow-fade',
    // The preset's own effects with less fed back, and a pass more before the one kept: at its
    // own feedback the loop is still building when the sound is taken, and does not come round.
    effects: [
      {
        deviceId: 'tape-loop',
        params: { length: 4, feedback: 0.5, wear: 0.35, wow: 0.25, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    ...cycled(
      8,
      [
        [0, 2.5, 62],
        [2.6, 2.4, 65],
        [5.2, 2.4, 60],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 23,
    id: 'reel-run-backwards-g',
    name: 'Reel run backwards {G}',
    kind: 'pad',
    description:
      'A still string section on {G} with a ninth, its last seconds coming back reversed off the loop.',
    preset: 'oxide-reel-run-backwards',
    ...looped(8, 7, 2, [55, 62, 67, 69]),
  },
  {
    n: 24,
    id: 'late-summer-horns-f',
    name: 'Late summer horns {F}',
    kind: 'pad',
    description:
      'A horn chord on {F} going round a worn tape loop, each pass a little duller, in a hall.',
    preset: 'oxide-late-summer-horns',
    ...looped(8, 8, 2, [53, 60, 65, 69]),
  },
  {
    n: 25,
    id: 'distant-chorale-c',
    name: 'Distant chorale {C}',
    kind: 'pad',
    description:
      'Horns on a {C} major chord with the top and bottom taken off, on a quarter-inch reel in a hall.',
    preset: 'oxide-distant-chorale',
    ...looped(8, 6, 2, [48, 55, 60, 64]),
  },
  {
    n: 26,
    id: 'mostly-the-gaps-e',
    name: 'Mostly the gaps {E}',
    kind: 'pad',
    description:
      'One string {E} on tape so worn that it comes and goes, with hiss rising to fill each gap.',
    preset: 'oxide-mostly-the-gaps',
    ...looped(8, 4, 2, [64]),
  },
  {
    n: 27,
    id: 'slow-ripple-strings-d',
    name: 'Slow ripple strings {D}',
    kind: 'pad',
    description:
      'Synthetic strings on {D} with a ninth through a slow phaser and an uneven swell, on tape in a long plate.',
    preset: 'oxide-slow-ripple-strings',
    // The preset's own effects, with the phaser turning once and the swell three times a loop.
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.375, depth: 0.45, drift: 0 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...looped(8, 8, 2, [50, 57, 62, 64, 69]),
  },
  {
    n: 28,
    id: 'low-brass-slowed-e',
    name: 'Low brass, slowed {E}',
    kind: 'pad',
    description:
      'Trombones and tuba on {E} rising slowly over themselves an octave down, in a very long hall; it comes round.',
    preset: 'oxide-low-brass-slowed',
    ...cycled(8, [
      [0, 4.5, 52],
      [0, 4.5, 59, 0.8],
      [0, 4.5, 64, 0.7],
    ]),
  },
  {
    n: 29,
    id: 'swells-on-the-splice-am',
    name: 'Swells on the splice {A}m',
    kind: 'pad',
    description:
      'Guitar chords with no pick, {A} minor then {G}, faded in by hand onto a tape loop; it comes round.',
    preset: 'oxide-swells-on-the-splice',
    ...cycled(8, [
      [0, 3.5, 45],
      [0.02, 3.5, 52],
      [0.04, 3.5, 60],
      [0.06, 3.5, 64],
      [4.1, 3.4, 43],
      [4.12, 3.4, 50],
      [4.14, 3.4, 59],
      [4.16, 3.4, 62],
    ]),
  },
  {
    n: 30,
    id: 'hammers-worn-away-am7',
    name: 'Hammers worn away {A}m7',
    kind: 'pad',
    description:
      'A pedalled piano with its attacks faded out: {A} minor seventh, then {F}, on wavering tape; it comes round.',
    preset: 'oxide-hammers-worn-away',
    ...cycled(8, [
      [0, 3.5, 45],
      [0.02, 3.5, 55],
      [0.04, 3.5, 60],
      [0.06, 3.5, 64],
      [4.1, 3.4, 41],
      [4.12, 3.4, 53],
      [4.14, 3.4, 57],
      [4.16, 3.4, 64],
    ]),
  },
  {
    n: 31,
    id: 'still-steel-swells-c',
    name: 'Still steel swells {C}',
    kind: 'pad',
    description:
      'Steel chords on {C} then {F} swelled in without vibrato over their own octave below; it comes round.',
    preset: 'oxide-still-steel-half-speed',
    ...cycled(8, [
      [0, 3.5, 48],
      [0.02, 3.5, 55],
      [0.04, 3.5, 64],
      [4.1, 3.4, 53],
      [4.12, 3.4, 60],
      [4.14, 3.4, 69],
    ]),
    // The half-speed copy never meets itself in step: the two passes are folded as strangers.
    loopFold: 'power',
  },
  {
    n: 32,
    id: 'pulse-across-a-room-e',
    name: 'Pulse across a room {E}',
    kind: 'pad',
    description:
      'A moving-pulse pad on {E} and {B} drifting from side to side once a loop, on tape in a plate.',
    preset: 'oxide-pulse-across-the-room',
    // The preset's own effects, with the pan turning once a loop and a little less far: five
    // semitones down, the full swing left almost as much at the sides as in the middle.
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.125, depth: 0.4, drift: 0 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    ...looped(8, 8, 2, [52, 59, 64]),
  },
  {
    n: 33,
    id: 'thrift-shop-strings-a',
    name: 'Thrift shop strings {A}',
    kind: 'pad',
    description:
      'Six players with a wide vibrato on {A} minor from a second-hand record: crackle, a warp, a worn groove.',
    preset: 'oxide-thrift-shop-strings',
    set: { volume: -5 },
    ...looped(8, 4, 2, [57, 64, 72]),
  },
  {
    n: 34,
    id: 'low-flute-half-reel-g',
    name: 'Low flute, half reel {G}',
    kind: 'pad',
    description:
      'A low flute on {G} and {D} with itself an octave down at half speed underneath, swelling in a long plate.',
    preset: 'oxide-low-flute-half-reel',
    set: { volume: 0 },
    then: [narrow, breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [55, [62, 0.7]]),
  },
  {
    n: 35,
    id: 'splice-in-backwards-c',
    name: 'Splice in backwards {C}',
    kind: 'pad',
    description:
      'One low piano {C} played backwards, swelling to its strike, with a worn tape echo trailing it.',
    preset: 'oxide-splice-in-backwards',
    source: 'felt-piano-c',
    then: [narrow],
    ...played(8, [[0, 6, 60]], 1.5),
  },
  {
    n: 36,
    id: 'lounge-harp-sweep-c',
    name: 'Lounge harp sweep {C}',
    kind: 'pad',
    description:
      'One slow harp sweep up and back over four octaves of {C} with a sixth and ninth, answered backwards.',
    preset: 'oxide-lounge-harp-sweep',
    ...played(
      10,
      [
        [0, 4, 48],
        [0, 4, 52],
        [0, 4, 55],
        [0, 4, 57],
        [0, 4, 62],
      ],
      3,
    ),
  },
  {
    n: 37,
    id: 'half-remembered-horn-g',
    name: 'Half-remembered horn {G}',
    kind: 'pad',
    description:
      'One soft horn up a fifth from {G} to {D}, settling on {A}, its phrase drifting back dull and slowed, on a worn reel.',
    preset: 'oxide-half-remembered-horn',
    ...played(
      12,
      [
        [0, 1.6, 55],
        [1.7, 0.9, 62],
        [2.5, 2.2, 59],
        [4.6, 1.4, 57],
      ],
      3.5,
    ),
  },
  {
    n: 38,
    id: 'kitchen-radio-violin-c',
    name: 'Kitchen radio violin {C}',
    kind: 'pad',
    description:
      'One violin with a wide vibrato from a small medium-wave set, stepping up from {E} to {G} and falling to {C}.',
    preset: 'oxide-violin-from-the-kitchen',
    // Lower than it was and bowed softer at each end than at the top: climbing from A to a long
    // E it was too loud for a pad six semitones up. The long note is G, whose third and fifth
    // partials, which the set brings out, are white keys.
    ...played(
      10,
      [
        [0, 1.3, 64, 0.55],
        [1.25, 0.8, 65, 0.7],
        [2, 2, 67, 1],
        [4.2, 1, 65, 0.7],
        [5.1, 2.6, 60, 0.5],
      ],
      2.5,
    ),
  },
  {
    n: 39,
    id: 'one-phrase-flugelhorn-d',
    name: 'One-phrase flugelhorn {D}',
    kind: 'pad',
    description:
      'A breathy flugelhorn line falling from {A} to {D}, its last seconds looping behind it at half speed, on tape.',
    preset: 'oxide-one-phrase-flugelhorn',
    ...played(
      12,
      [
        [0, 1.4, 69],
        [1.3, 0.9, 67],
        [2.1, 2.2, 64],
        [4.5, 1.2, 65],
        [5.6, 2.6, 62],
      ],
      3,
    ),
  },

  // Textures: what the machines, the window and the dial add on their own.
  {
    n: 40,
    id: 'through-the-floor-d',
    name: 'Through the floor {D}',
    kind: 'texture',
    description:
      'A dark filtered drone on a low {D} sunk in room rumble, like a building heard at night through the floor.',
    preset: 'oxide-through-the-floor',
    set: { volume: -16 },
    ...looped(8, 5, 2, [38, [45, 0.6]]),
  },
  {
    n: 41,
    id: 'steady-rain-on-the-reel',
    name: 'Steady rain on the reel',
    kind: 'texture',
    description:
      'Steady rain beyond an open window as a small recorder took it down: narrowed, soft at the top, hissing.',
    preset: 'oxide-rain-past-the-window',
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 42,
    id: 'rosin-and-hiss-g',
    name: 'Rosin and hiss {G}',
    kind: 'texture',
    description:
      'Bows that are mostly air on {G} and {D}, going round a loop, their breath hard to tell from the reel hiss.',
    preset: 'oxide-rosin-and-hiss',
    ...looped(8, 7, 2, [55, 62]),
  },
  {
    n: 43,
    id: 'chord-made-of-hiss-f',
    name: 'Chord made of hiss {F}',
    kind: 'texture',
    description:
      'Broad bands of noise on {F} and {C}: a breathy chord that sounds like tape hiss in tune, in a long plate.',
    preset: 'oxide-chord-made-of-hiss',
    ...looped(8, 6, 2, [53, 60]),
  },
  {
    n: 44,
    id: 'thunder-rolls-far-off',
    name: 'Thunder rolls, far off',
    kind: 'texture',
    description:
      'Thunder a long way off through an open window, its rolls overlapping, with the tape hissing in the room.',
    preset: 'oxide-far-storm-tape-running',
    set: { density: 1, movement: 0.4 },
    then: [soften(8)],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 45,
    id: 'scattered-crickets',
    name: 'Scattered crickets',
    kind: 'texture',
    description:
      'Crickets on a summer night from a portable recorder, each chirp scattered by a grain cloud.',
    preset: 'oxide-crickets-on-the-reel',
    set: { distance: 0.85, density: 1 },
    then: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 12, scatter: 1, feedback: 0.3, mix: 0.7 },
      },
    ],
    ...looped(8, 6, 2, [41, 47, 52, 57, 62, 67, 72, 77]),
  },
  {
    n: 46,
    id: 'wind-on-a-worn-reel',
    name: 'Wind on a worn reel',
    kind: 'texture',
    description:
      'Wind over a hill taken down on a reel worn thin, the gusts wavering with the tape, in a room.',
    instrument: { deviceId: 'atmosphere', preset: 'Hill wind', params: { width: 0.6 } },
    effects: [{ deviceId: 'tape', preset: 'Worn thin' }, hall('Room', 0.25)],
    ...looped(8, 4, 2, [62]),
  },
  {
    n: 47,
    id: 'stream-on-quarter-inch',
    name: 'Stream on quarter-inch',
    kind: 'texture',
    description:
      'A small stream on quarter-inch tape: narrowed, hissing and wavering a little with the reel.',
    instrument: { deviceId: 'outdoors', preset: 'Small stream', params: { width: 0.7 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35, hiss: 0.4 } },
      { deviceId: 'ambient-eq', params: { lowCut: 200, highCut: 5000, clear: 0.2 } },
    ],
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 48,
    id: 'crackle-in-flakes',
    name: 'Crackle in flakes',
    kind: 'texture',
    description:
      'Short grains of record crackle falling one at a time, like flakes off a reel, into a hall.',
    preset: 'oxide-flakes-off-the-reel',
    source: 'record-crackle',
    // Without the rumble under the grains, which was most of the sound and hid the flakes.
    then: [{ deviceId: 'ambient-eq', params: { lowCut: 150, clear: 0 } }, lift(10)],
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 49,
    id: 'fire-barely-moving',
    name: 'Fire, barely moving',
    kind: 'texture',
    description:
      'A wood fire pulled past the head at a thirtieth of its speed, with recorder hiss breathing in the gaps.',
    preset: 'oxide-barely-moving-reel',
    source: 'hearth',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 50,
    id: 'rain-back-and-forth',
    name: 'Rain back and forth',
    kind: 'texture',
    description:
      'A short stretch of rain on glass run back and forth, heard half through a fading radio link.',
    preset: 'oxide-back-and-forth-splice',
    source: 'rain-on-the-window',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 51,
    id: 'piano-left-on-the-reel',
    name: 'Piano left on the reel',
    kind: 'texture',
    description:
      'A piano fragment, {E} against {F}, from tired tape on a two-second loop that dulls it each pass, in faint static.',
    preset: 'oxide-whatever-was-on-it',
    source: 'felt-piano-phrase-am',
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 52,
    id: 'single-track-playback-g',
    name: 'Single track playback {G}',
    kind: 'texture',
    description:
      'A cello drone on {G} and {D} from a one-track machine: mono, band-limited and under its own hiss, in a small room.',
    preset: 'oxide-single-track-playback',
    source: 'cello-drone-d',
    set: { volume: -6 },
    ...looped(8, 4, 2, [72]),
  },
  {
    n: 53,
    id: 'fire-on-a-stalled-motor',
    name: 'Fire on a stalled motor',
    kind: 'texture',
    description:
      'A wood fire two octaves down, as from a deck with its motor nearly stopped: slow, dark and wavering.',
    preset: 'oxide-motor-almost-stopped',
    source: 'hearth',
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 54,
    id: 'crackle-through-dust',
    name: 'Crackle through dust',
    kind: 'texture',
    description:
      'Record crackle as a dense, dull cloud with every grain a little off, as heard through clogged heads.',
    preset: 'oxide-dust-in-the-heads',
    source: 'record-crackle',
    // A little more top and no rumble: as the preset has it, four fifths of the sound is below
    // 60 Hz and no crackle is left to hear.
    set: { tone: 3200 },
    then: [{ deviceId: 'ambient-eq', params: { lowCut: 150, clear: 0 } }],
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 55,
    id: 'chimney-wind-rewound',
    name: 'Chimney wind, rewound',
    kind: 'texture',
    description:
      'Long reversed grains of wind in a chimney swelling backwards onto a four-second loop, dulled, in a long hall.',
    preset: 'oxide-rewind-wash',
    source: 'wind-in-the-chimney',
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 56,
    id: 'shortwave-on-two-spools',
    name: 'Shortwave on two spools',
    kind: 'texture',
    description:
      'A cloud of shortwave noise with its own last seconds looping underneath at half speed, on a worn reel.',
    preset: 'oxide-spool-inside-a-spool',
    source: 'radio-between-stations',
    ...looped(8, 6, 2, [60]),
  },

  // One-shots: one note or one chord that the reel lets ring out.
  {
    n: 57,
    id: 'upright-next-door-c',
    name: 'Upright next door {C}',
    kind: 'oneshot',
    description:
      'One {C} on an out-of-tune upright heard through the wall from the next room, on quarter-inch tape.',
    preset: 'oxide-upright-next-door',
    then: [narrow],
    ...played(5, [[0, 2, 60]], 2),
  },
  {
    n: 58,
    id: 'upright-low-fifth-a',
    name: 'Upright low fifth {A}',
    kind: 'oneshot',
    description:
      'A low {A} in octaves with its fifth on an out-of-tune upright, heard through a wall, on tape.',
    preset: 'oxide-upright-next-door',
    then: [narrow],
    ...played(
      5,
      [
        [0, 3, 33],
        [0, 3, 45],
        [0, 3, 52],
      ],
      1.5,
    ),
  },
  {
    n: 59,
    id: 'piano-under-hiss-d',
    name: 'Piano under hiss {D}',
    kind: 'oneshot',
    description:
      'One close, dulled felt-piano {D} pushed onto a recorder whose hiss comes up as the note dies, in a small room.',
    preset: 'oxide-piano-under-hiss',
    // Louder into a tape stage that rounds the strike off: without it the note sat so far under
    // its own strike that five semitones down the sound was too quiet for a one-shot. A limiter
    // does not do here: it holds the level flat after the strike, which is no longer a one-shot.
    set: { outputDb: -1.5 },
    then: [{ deviceId: 'tape', preset: 'Hot glue' }, narrow],
    ...played(8, [[0, 3, 50]], 3),
  },
  {
    n: 60,
    id: 'piano-at-half-speed-g',
    name: 'Piano at half speed {G}',
    kind: 'oneshot',
    description:
      'One piano {G} played back at half speed: an octave down, twice as long and wavering, in a long plate.',
    preset: 'oxide-piano-at-half-speed',
    ...played(8, [[0, 2, 67]], 1.5),
  },
  {
    n: 61,
    id: 'one-bolted-string-e',
    name: 'One bolted string {E}',
    kind: 'oneshot',
    description:
      'One low {E} on a piano with stiff, gritty strings and hard hammers, clanking, on slow dark tape.',
    preset: 'oxide-bolts-in-the-strings',
    ...played(5, [[0, 3, 40]], 1.5),
  },
  {
    n: 62,
    id: 'worn-brushed-chord-dm7',
    name: 'Worn brushed chord {D}m7',
    kind: 'oneshot',
    description:
      'One dull brushed chord on {D} minor seventh with a soft pad under it, on a worn cassette with a long spring.',
    preset: 'oxide-brushed-chord-worn',
    ...played(
      8,
      [
        [0, 4, 50],
        [0, 4, 57],
        [0, 4, 60],
        [0, 4, 65],
      ],
      2,
    ),
  },
  {
    n: 63,
    id: 'bowl-at-half-speed-d',
    name: 'Bowl at half speed {D}',
    kind: 'oneshot',
    description:
      'A struck glass bowl on {D} replayed at half speed: an octave down, the beating between its partials slowed.',
    preset: 'oxide-bowl-at-half-speed',
    ...played(12, [[0, 6, 62]], 3),
  },
  {
    n: 64,
    id: 'two-bowls-half-speed-a',
    name: 'Two bowls, half speed {A}',
    kind: 'oneshot',
    description:
      'Two struck glass bowls on {A} and {E} replayed at half speed: an octave down, their beating slowed too.',
    preset: 'oxide-bowl-at-half-speed',
    ...played(
      12,
      [
        [0, 6, 57],
        [0, 6, 64],
      ],
      3,
    ),
  },
  {
    n: 65,
    id: 'tongue-drum-dusty-f',
    name: 'Tongue drum, dusty {F}',
    kind: 'oneshot',
    description:
      'One soft strike on a steel tongue drum on {F}, narrowed and hissing on a dusty reel, in a small room.',
    preset: 'oxide-tongue-drum-dusty-reel',
    // Six semitones up the strike alone left it at the bottom of the band.
    then: [lift(6)],
    ...played(6, [[0, 2, 53]], 1.5),
  },
  {
    n: 66,
    id: 'tongue-drum-fifth-c',
    name: 'Tongue drum fifth {C}',
    kind: 'oneshot',
    description:
      'Two steel tongues struck together on {C} and {G}, soft and narrowed, on a dusty reel in a small room.',
    preset: 'oxide-tongue-drum-dusty-reel',
    ...played(
      6,
      [
        [0, 2, 60],
        [0, 2, 67],
      ],
      1.5,
    ),
  },
  {
    n: 67,
    id: 'dull-muted-harp-g',
    name: 'Dull muted harp {G}',
    kind: 'oneshot',
    description:
      'One damped harp string on {G}, short and dull, with soft dark repeats, on slow tape in a small room.',
    preset: 'oxide-dull-muted-harp',
    ...played(3.5, [[0, 1.5, 55]], 1),
  },
  {
    n: 68,
    id: 'lounge-vibes-e',
    name: 'Lounge vibes {E}',
    kind: 'oneshot',
    description:
      'One vibraphone bar on {E} with the motor turning slowly, mid-band only, a little unsteady on tape.',
    preset: 'oxide-lounge-vibes-motor-on',
    // A harder mallet than the preset's: five semitones down the soft one left the bar ringing
    // so evenly after the strike that the sound was at the top of the band.
    set: { motor: 0.3, mallet: 0.5 },
    ...played(6, [[0, 4, 64]], 1.5),
  },
  {
    n: 69,
    id: 'bell-across-town-a',
    name: 'Bell across town {A}',
    kind: 'oneshot',
    description:
      'One stroke of a church bell on {A} from across town, its top and bottom lost on the way, on tape.',
    preset: 'oxide-bell-across-town',
    set: { decay: 8 },
    then: [lift(14)],
    ...played(8, [[0, 6, 57]], 2.5),
  },
  {
    n: 70,
    id: 'small-bell-far-off-d',
    name: 'Small bell, far off {D}',
    kind: 'oneshot',
    description:
      'One stroke of a smaller bell on a high {D} from across town, its top and bottom lost on the way.',
    preset: 'oxide-bell-across-town',
    set: { decay: 5 },
    then: [lift(14)],
    ...played(6, [[0, 4, 74]], 2),
  },
  {
    n: 71,
    id: 'wind-up-box-one-tooth',
    name: 'Wind-up box, one tooth',
    kind: 'oneshot',
    description:
      'One tooth of a music box replayed at three-quarter speed, a fourth lower on {G} and unsteady, in a small room.',
    preset: 'oxide-wind-up-box-slowed',
    // The key is C: the name gives no note, since the one played is not the one that sounds.
    ...played(4, [[0, 2, 84]], 1.5),
  },
  {
    n: 72,
    id: 'supper-club-chord-g',
    name: 'Supper club chord {G}',
    kind: 'oneshot',
    description:
      'A slow strum on {G} with a sixth on a mellow neck pickup, amp tremolo and a dark spring, in mono on tape.',
    preset: 'oxide-supper-club-guitar',
    then: [lift(8)],
    ...played(
      5,
      [
        [0, 3.5, 43],
        [0.03, 3.5, 50],
        [0.06, 3.5, 55],
        [0.09, 3.5, 59],
        [0.12, 3.5, 64],
      ],
      1.5,
    ),
  },
  {
    n: 73,
    id: 'supper-club-low-a',
    name: 'Supper club low {A}',
    kind: 'oneshot',
    description:
      'One low {A} on a mellow neck pickup with amp tremolo and a dark spring, in mono on quarter-inch tape.',
    preset: 'oxide-supper-club-guitar',
    then: [lift(8)],
    ...played(6, [[0, 4.5, 45]], 1.5),
  },
  {
    n: 74,
    id: 'thumbed-and-slowed-am',
    name: 'Thumbed and slowed {A}m',
    kind: 'oneshot',
    description:
      'A guitar chord brushed with the thumb and replayed at three-quarter speed as {A} minor, over reel hiss.',
    preset: 'oxide-thumbed-and-slowed',
    // Three-quarter speed is a fourth down: the keys are D minor, and no B is among them.
    set: { volume: 0 },
    then: [lift(4)],
    ...played(
      6,
      [
        [0, 4, 50],
        [0.02, 4, 57],
        [0.04, 4, 62],
        [0.06, 4, 65],
      ],
      2,
    ),
  },
  {
    n: 75,
    id: 'warm-reel-tines-cadd9',
    name: 'Warm reel tines {C}add9',
    kind: 'oneshot',
    description:
      'A soft electric piano chord on {C} with a ninth and a slow tremolo, taped slow and a little warm.',
    preset: 'oxide-warm-reel-tines',
    ...played(
      5,
      [
        [0, 3, 48],
        [0.01, 3, 55],
        [0.02, 3, 62],
        [0.03, 3, 64],
      ],
      1.5,
    ),
  },
  {
    n: 76,
    id: 'high-warm-tine-e',
    name: 'High warm tine {E}',
    kind: 'oneshot',
    description:
      'One high {E} on a soft electric piano with a slow tremolo, taped slow and a little warm, in a small plate.',
    preset: 'oxide-warm-reel-tines',
    ...played(5, [[0, 3, 76]], 1.5),
  },
  {
    n: 77,
    id: 'parlour-zither-em',
    name: 'Parlour zither {E}m',
    kind: 'oneshot',
    description:
      'An {E} minor chord strummed once on a chord zither, from a dusty record with a slow warp, in a small room.',
    preset: 'oxide-parlour-zither',
    then: [lift(14)],
    ...played(8, [[0, 4, 52]], 2),
  },
  {
    n: 78,
    id: 'mallet-tape-reversed-a',
    name: 'Mallet, tape reversed {A}',
    kind: 'oneshot',
    description:
      'A soft wooden pluck on {A}, then its last second and a half running backwards up to the strike, on tape.',
    preset: 'oxide-mallet-tape-reversed',
    // The preset's own effects with the loop half as long and gone after two passes: at three
    // seconds the pluck was over, four seconds of hiss went by, and the backwards copy came in
    // under the fade.
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Reverse bed',
        params: { length: 1.5, fade: 0.2, tone: 4000, mix: 0.35 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.3, wow: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
      lift(8),
    ],
    ...played(6, [[0, 1.6, 57]], 2.5),
  },

  // Phrases: a few notes with a shape, most of them on a loop of tape that brings them round.
  {
    n: 79,
    id: 'four-bars-again-am',
    name: 'Four bars again {A}m',
    kind: 'melodic',
    description:
      'A soft felted piano figure in {A} minor going round a two-second loop, each pass duller; it comes round.',
    preset: 'oxide-four-bars-again',
    ...cycled(8, [
      [0, 1.2, 57],
      [0.62, 1.2, 64],
      [1.31, 1.5, 72],
      [2.9, 1.2, 71],
      [3.6, 1.6, 69],
      [5.2, 2, 64],
    ]),
  },
  {
    n: 80,
    id: 'harp-one-bar-c',
    name: 'Harp, one bar {C}',
    kind: 'melodic',
    description:
      'A softly plucked harp arpeggio opening upward from {C} on a two-second loop that dulls it; it comes round.',
    preset: 'oxide-harp-one-bar',
    ...cycled(
      8,
      [
        [0, 1.5, 48],
        [0.41, 1.5, 55],
        [0.93, 1.5, 64],
        [1.72, 1.5, 67],
        [3.1, 1.5, 74],
        [4.37, 2, 72],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 81,
    id: 'harp-falling-bar-dm',
    name: 'Harp, falling bar {D}m',
    kind: 'melodic',
    description:
      'A softly plucked harp figure falling through {D} minor on a two-second loop that dulls it; it comes round.',
    preset: 'oxide-harp-one-bar',
    ...cycled(
      8,
      [
        [0, 1.5, 74],
        [0.5, 1.5, 69],
        [1.1, 1.5, 65],
        [2, 1.5, 62],
        [3.4, 1.5, 64],
        [4.6, 2, 57],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 82,
    id: 'nylon-short-loop-em',
    name: 'Nylon, short loop {E}m',
    kind: 'melodic',
    description:
      'A nylon-string guitar figure in {E} minor on a two-second loop, softer each time round; it comes round.',
    preset: 'oxide-nylon-on-a-short-loop',
    ...cycled(8, [
      [0, 1.5, 52],
      [0.55, 1.2, 59],
      [1.27, 1.4, 64],
      [2.6, 1.2, 67],
      [3.44, 1.6, 69],
      [4.9, 2, 64],
    ]),
  },
  {
    n: 83,
    id: 'plucked-bass-loop-d',
    name: 'Plucked bass loop {D}',
    kind: 'melodic',
    description:
      'A soft plucked bass walking from {D} on a short loop that dulls each repeat, in a room; it comes round.',
    preset: 'oxide-plucked-bass-worn-loop',
    ...cycled(8, [
      [0, 1.2, 38],
      [0.93, 1, 45],
      [2.27, 1.2, 50],
      [3.05, 1, 45],
      [4.71, 1.4, 41],
      [5.89, 1.2, 43],
    ]),
  },
  {
    n: 84,
    id: 'ripple-on-the-reel-c',
    name: 'Ripple on the reel {C}',
    kind: 'melodic',
    description:
      'High piano notes around {C} on a short loop that barely fades, rippling into a long hall; it comes round.',
    preset: 'oxide-ripple-on-the-reel',
    ...cycled(
      8,
      [
        [0, 1, 84],
        [0.7, 1, 79],
        [2.3, 1, 88],
        [3.9, 1, 81],
        [5.2, 1, 86],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 85,
    id: 'lounge-vibes-phrase-em',
    name: 'Lounge vibes phrase {E}m',
    kind: 'melodic',
    description:
      'A vibraphone phrase in {E} minor with its motor on, mid-band only and unsteady on tape; it comes round.',
    preset: 'oxide-lounge-vibes-motor-on',
    ...cycled(8, [
      [0, 2, 64],
      [1.2, 2, 67],
      [1.9, 2, 71],
      [3.6, 2, 69],
      [5.3, 2.4, 62],
    ]),
    loopFold: 'power',
  },
  {
    n: 86,
    id: 'reel-tines-phrase-f',
    name: 'Reel tines phrase {F}',
    kind: 'melodic',
    description:
      'A soft electric piano opening upward from {F} with a slow tremolo, taped slow and warm; it comes round.',
    preset: 'oxide-warm-reel-tines',
    ...cycled(8, [
      [0, 2, 53],
      [0.9, 2, 60],
      [1.7, 2, 65],
      [3.6, 2, 69],
      [5.1, 2.4, 64],
    ]),
  },
  {
    n: 87,
    id: 'muted-harp-figure-g',
    name: 'Muted harp figure {G}',
    kind: 'melodic',
    description:
      'A damped harp rising from {G} and falling back to a low {D}, short and dull, with soft dark repeats; it comes round.',
    preset: 'oxide-dull-muted-harp',
    ...cycled(8, [
      [0, 1, 55],
      [0.47, 1, 59],
      [1.02, 1, 62],
      [2.31, 1, 64],
      [3.06, 1, 62],
      [4.44, 1, 59],
      [5.61, 1.2, 57],
      [6.72, 1.2, 50],
    ]),
  },
  {
    n: 88,
    id: 'wind-up-box-tune-g',
    name: 'Wind-up box tune {G}',
    kind: 'melodic',
    description:
      'A music-box tune replayed at three-quarter speed, a fourth lower in {G} major and unsteady, in a small room.',
    preset: 'oxide-wind-up-box-slowed',
    // The keys are C major and are heard a fourth down: no B among them, which would be an F sharp.
    ...played(
      6,
      [
        [0, 0.5, 84],
        [0.45, 0.5, 88],
        [0.92, 0.5, 91],
        [1.6, 0.5, 89],
        [2.05, 0.5, 88],
        [2.7, 0.5, 84],
        [3.5, 1, 86],
      ],
      1.5,
    ),
  },
  {
    n: 89,
    id: 'piano-flakes-am',
    name: 'Piano flakes {A}m',
    kind: 'melodic',
    description:
      'Short grains of a felt piano phrase in {A} minor falling one at a time, like flakes off a reel, into a hall.',
    preset: 'oxide-flakes-off-the-reel',
    source: 'felt-piano-phrase-am',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 90,
    id: 'tongue-drum-round-f',
    name: 'Tongue drum round {F}',
    kind: 'melodic',
    description:
      'A steel tongue drum phrase rocking between {A} and {E} over a low {F}, soft and narrowed on a dusty reel; it comes round.',
    preset: 'oxide-tongue-drum-dusty-reel',
    // The loop is cut a breath before its first strike. Cut at the strike, the folded start came
    // out up to 5 dB under the same stretch played straight: the reel's wobble, it seems, leaves
    // each pass out of step with the last, and the two strikes cancel where they are folded.
    // What lies at the cut now is the ring of the pass before, folded as strangers.
    ...cycled(8, [
      [0.3, 1.5, 53],
      [1.1, 1.5, 57],
      [2, 1.5, 64],
      [3.3, 1.5, 60],
      [4.4, 1.5, 57],
      [5.5, 2, 64],
    ]),
    loopFold: 'power',
  },
  {
    n: 91,
    id: 'supper-club-line-am',
    name: 'Supper club line {A}m',
    kind: 'melodic',
    description:
      'A mellow neck-pickup line climbing {A} minor with amp tremolo and a dark spring, in mono; it comes round.',
    preset: 'oxide-supper-club-guitar',
    then: [lift(8)],
    ...cycled(8, [
      [0, 1.5, 45],
      [0.7, 1.5, 52],
      [1.5, 1.5, 57],
      [2.9, 1.5, 60],
      [3.8, 1.5, 64],
      [5.2, 2, 59],
    ]),
    loopFold: 'power',
  },
  {
    n: 92,
    id: 'tired-reel-steel-c',
    name: 'Tired reel steel {C}',
    kind: 'melodic',
    description:
      'Picked steel guitar notes falling in fourths from a high {C}, on a tired reel whose pitch sways; it comes round.',
    preset: 'oxide-steel-on-a-tired-reel',
    set: { swell: 0 },
    ...cycled(8, [
      [0, 1.5, 72],
      [0.8, 1.5, 67],
      [1.7, 1.5, 69],
      [3, 1.5, 64],
      [4.2, 1.5, 65],
      [5.3, 2, 62],
    ]),
    loopFold: 'power',
  },
  {
    n: 93,
    id: 'synth-line-worn-f',
    name: 'Synth line, worn {F}',
    kind: 'melodic',
    description:
      'A singing one-voice synthesizer up a fifth from {F} and back down, dulled by a worn reel, with one soft echo.',
    preset: 'oxide-synth-line-worn',
    ...played(
      10,
      [
        [0, 1.2, 53],
        [1.5, 0.6, 60],
        [2.3, 1.6, 57],
        [4.3, 0.7, 55],
        [5.2, 2.2, 53],
      ],
      2,
    ),
  },
  {
    n: 94,
    id: 'interval-signal-g',
    name: 'Interval signal {G}',
    kind: 'melodic',
    description:
      'Four glass chimes falling from {G} like a station call between programmes, over a fading radio link.',
    preset: 'oxide-interval-signal',
    // The preset's own effects with the static low: at its own level the chimes have no pitch left.
    effects: [
      { deviceId: 'radio', params: { fading: 0.5, static: 0.1, bandwidth: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 4, mix: 0.3 } },
    ],
    ...played(
      10,
      [
        [0, 1.4, 79],
        [0.7, 1.4, 76],
        [1.9, 1.4, 72],
        [3.4, 3, 67],
      ],
      2.5,
    ),
  },
  {
    n: 95,
    id: 'bolts-in-the-strings-e',
    name: 'Bolts in the strings {E}',
    kind: 'melodic',
    description:
      'Four low notes from {E} on a piano with stiff, gritty strings and hard hammers, clanking, on slow dark tape.',
    preset: 'oxide-bolts-in-the-strings',
    ...played(
      8,
      [
        [0, 2, 40],
        [0.9, 2, 47],
        [1.63, 2, 52],
        [3.1, 3, 45],
      ],
      1.5,
    ),
  },
  {
    n: 96,
    id: 'half-speed-piano-c',
    name: 'Half-speed piano {C}',
    kind: 'melodic',
    description:
      'A piano phrase up a {C} major chord and back, replayed at half speed: an octave down and wavering.',
    preset: 'oxide-piano-at-half-speed',
    ...played(
      10,
      [
        [0, 1, 72],
        [0.45, 1, 76],
        [1.3, 1, 79],
        [2.75, 1.5, 77],
        [3.5, 2, 72],
      ],
      2,
    ),
  },
  {
    n: 97,
    id: 'next-door-a-tune-c',
    name: 'Next door, a tune {C}',
    kind: 'melodic',
    description:
      'A few notes rocking between {E}, {F} and {C} on an out-of-tune upright heard through the wall, on quarter-inch tape.',
    preset: 'oxide-upright-next-door',
    then: [narrow],
    ...played(
      8,
      [
        [0, 1.5, 64],
        [0.7, 1.5, 60],
        [1.6, 1.5, 65],
        [2.9, 1.2, 64],
        [3.7, 2.5, 60],
      ],
      1.5,
    ),
  },
  {
    n: 98,
    id: 'parlour-zither-round-dm',
    name: 'Parlour zither round {D}m',
    kind: 'melodic',
    description:
      'A chord zither strummed on {D} minor, {A} minor and {E} minor, from a dusty record; it comes round.',
    preset: 'oxide-parlour-zither',
    then: [lift(10)],
    ...cycled(8, [
      [0, 2.3, 50],
      [2.4, 2.8, 57],
      [5.4, 2.4, 52],
    ]),
  },
  {
    n: 99,
    id: 'mallet-phrase-e',
    name: 'Mallet phrase {E}',
    kind: 'melodic',
    description:
      'Soft wooden plucks around {E}, dropping to {B}, their last seconds running backwards underneath; it comes round.',
    preset: 'oxide-mallet-tape-reversed',
    then: [lift(6)],
    ...cycled(8, [
      [0, 1.5, 64],
      [0.9, 1.5, 62],
      [1.7, 1.5, 64],
      [3.3, 1.5, 59],
      [4.8, 2, 62],
    ]),
    loopFold: 'power',
  },
  {
    n: 100,
    id: 'soprano-under-static-e',
    name: 'Soprano under static {E}',
    kind: 'melodic',
    description:
      'One operatic voice in a small chapel, falling an octave through {E} minor, over a radio link with static behind it.',
    preset: 'oxide-soprano-under-static',
    set: { attack: 0.04 },
    ...played(
      10,
      [
        [0, 1.05, 76],
        [1.37, 0.7, 74],
        [2.3, 1.9, 71],
        [4.51, 0.9, 67],
        [5.7, 2.4, 64],
      ],
      2.5,
    ),
  },
])
