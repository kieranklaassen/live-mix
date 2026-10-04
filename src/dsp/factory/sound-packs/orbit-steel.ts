// The sounds of the pack "Steel in Slow Orbit": its presets played, a hundred sounds to
// paint with. Numbers 16001 to 16100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/orbit-steel'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

/** Brings a pad whose two sides differ too much for mono back inside the bank's width. */
const NARROW: PatchDevice = { deviceId: 'stereo-widener', preset: 'Narrow' }

/**
 * Takes a pick or a hammer down so the ring behind it stands nearer the bank's peak: a note
 * that is one tall peak over a quiet body comes out quiet.
 */
const lift = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

/**
 * Holds a drone level: a fast compressor well under the sound, so slow beating between two held
 * notes does not move the level the way a pad's does.
 */
const LEVEL: PatchDevice = {
  deviceId: 'ambient-comp',
  params: {
    threshold: -45,
    ratio: 8,
    attack: 10,
    release: 0.15,
    knee: 6,
    tails: 1,
    scLowCut: 40,
    makeup: 18,
  },
}

export const SOUNDS: readonly FactorySound[] = packSounds('orbit-steel', 16000, PRESETS, [
  // Drones: one note or a fifth, held level for as long as the loop lasts. What wanders in a
  // preset (detuned strings, a vibrato, a chorus) is stilled here, or the level moves and the
  // sound is a pad.
  {
    n: 1,
    id: 'steel-held-aloft-a',
    name: 'Steel held aloft {A}',
    kind: 'drone',
    description:
      'A pedal steel on a low {A} and its fifth, caught by a sustainer and held in a very large space.',
    preset: 'orbit-steel-steel-held-aloft',
    // The held sound alone and still: under it the strings darken and die away.
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { motion: 0, ensemble: 0, mix: 1 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.3, width: 0.7, modDepth: 0.15, modRate: 0.375 },
      },
    ],
    // The fifth beats against its root a few times a loop: a compressor holds the level through
    // it, and each note is tuned to whole cycles so the beating comes round with the loop.
    then: [LEVEL, quarterTurn(8)],
    ...looped(8, 6, 2, [45, [52, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'low-orbit-fifths-e',
    name: 'Low orbit fifths {E}',
    kind: 'drone',
    description:
      'A low {E} with its fifth over a sub octave, barely wandering, in a hall whose tail sings.',
    preset: 'orbit-steel-low-orbit-fifths',
    set: { movement: 0.05 },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4, motion: 0 } }],
    // Wandering this little, the two ends of the loop are nearly the same wave and folded into
    // a swell in some keys: tuned to whole cycles and held level, as the steel above.
    then: [LEVEL, quarterTurn(8)],
    ...looped(8, 7, 3, [40]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'major-light-g',
    name: 'Major light {G}',
    kind: 'drone',
    description:
      'A just major chord of near-sine partials on {G} with tuned air, on tape in a cathedral.',
    preset: 'orbit-steel-major-light-below',
    set: { movement: 0.15 },
    ...looped(8, 8, 3, [55]),
  },
  {
    n: 4,
    id: 'chapel-rotary-f',
    name: 'Chapel rotary {F}',
    kind: 'drone',
    description:
      'Flute ranks on {F} and {C} through a rotary speaker brought to rest and a spring, held still.',
    preset: 'orbit-steel-chapel-rotary',
    // A turning speaker and a breathing bellows move the level and never come round with the
    // loop: the speaker is braked and left to stop before the loop starts, the bellows held.
    set: { bellows: 0 },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { speed: 2, acceleration: 4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 12, 2, [53, [60, 0.8], [65, 0.7], [72, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'soft-floor-sub-a',
    name: 'Soft floor sub {A}',
    kind: 'drone',
    description:
      'A sine-like sub on a low {A} and the octave under it, saturated a little, in a small room.',
    preset: 'orbit-steel-soft-floor-sub',
    // The filter a little further open than in the preset: two bare sines have next to no peak
    // over their level and come out louder than a drone should in the higher keys.
    set: { cutoff: 800 },
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'magnet-held-string-d',
    name: 'Magnet-held string {D}',
    kind: 'drone',
    description:
      'Guitar strings on {D} and {A} held singing by a magnetic sustainer, with tape echoes in a hall.',
    preset: 'orbit-steel-magnet-held-string',
    // Each string is two, six cents apart: at one pitch they do not beat.
    set: { detune: 0, vibrato: 0.1 },
    then: [quarterTurn(8)],
    // Five strings: three held this still are too few partials, and the tone comes out louder
    // than a drone should in some keys.
    ...looped(8, 5, 2, [50, [57, 0.9], [62, 0.9], [69, 0.8], [74, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'string-feedback-g',
    name: 'String feedback {G}',
    kind: 'drone',
    description:
      'Strings on {G} and {D} driven until each jumps to its octave, through a warm stack and a spring.',
    preset: 'orbit-steel-string-feedback-chord',
    set: { detune: 0, vibrato: 0 },
    // Four strings held level, as in the steel above: two beat the level into a pad's in some
    // keys and were too loud in another.
    then: [LEVEL, quarterTurn(8)],
    ...looped(8, 6, 2, [43, [50, 0.8], [55, 0.7], [62, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'still-sine-octaves-b',
    name: 'Still sine octaves {B}',
    kind: 'drone',
    description:
      'Near-sines on four octaves of {B} with no movement at all, through a tape preamp in a hall.',
    preset: 'orbit-steel-still-sine-pad',
    set: { detune: 0 },
    then: [quarterTurn(8)],
    // Four octaves: three sines stand so little over their own level that the tone is louder
    // than a drone should be six keys up.
    ...looped(8, 6, 2, [35, 47, 59, 71]),
    tuning: 'whole-cycles',
  },
  {
    n: 9,
    id: 'singing-hall-reed-a',
    name: 'Singing hall reed {A}',
    kind: 'drone',
    description:
      'Clarinets on a low {A}, its fifth and their octaves, breathy and hollow, in a hall whose tail sings a soft oo.',
    preset: 'orbit-steel-reed-singing-hall',
    set: { breath: 0.45 },
    then: [quarterTurn(8)],
    // Four clarinets, for the same reason as the sines above.
    ...looped(8, 6, 2, [45, [52, 0.9], [57, 0.8], [64, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'idle-amp-hum-g',
    name: 'Idle amp hum {G}',
    kind: 'drone',
    description:
      'Mains hum tuned to a low {G}, its octaves and a fifth, pulsing a little in a tremolo and ringing a spring.',
    preset: 'orbit-steel-idle-amp-hum',
    // More of the hum's harmonics and less of its wobble than in the preset, and the fifth an
    // octave up, where it is a harmonic of the low note: a bare fifth this low is too loud in the
    // high keys and, five keys down, has no pitch the bench can find.
    set: { tone: 0.6, movement: 0.2 },
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 3.375, depth: 0.25, drift: 0 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [43, [55, 0.7], [62, 0.6], [67, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 11,
    id: 'major-light-high-c',
    name: 'Major light, high {C}',
    kind: 'drone',
    description:
      'A just major chord of near-sines over a high {C}, with tuned air, on tape in a cathedral.',
    preset: 'orbit-steel-major-light-below',
    // Stiller and narrower than the low one, tuned to whole cycles and held level: this high,
    // its partials beat from side to side and the level heard in mono moved like a pad's in one key.
    set: { movement: 0.05, sub: 0.15, width: 0.4 },
    then: [LEVEL, quarterTurn(8)],
    ...looped(8, 8, 3, [72]),
    tuning: 'whole-cycles',
  },
  {
    n: 12,
    id: 'slow-fold-held-c',
    name: 'Slow fold, held {C}',
    kind: 'drone',
    description:
      'A folded tone on two octaves of {C}, held past its bloom, doubled a little wide in a hall.',
    preset: 'orbit-steel-slow-fold-swell',
    set: { drift: 0 },
    // The double nearer than in the preset, where it beat fast enough to move the level like
    // a pad's in one key; tuned to whole cycles and held level, as the steel above.
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { detune: 5, drift: 0 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    then: [LEVEL, quarterTurn(8)],
    ...looped(8, 7, 2, [48, [60, 0.7]]),
    tuning: 'whole-cycles',
  },

  // Pads: chords that move. Half are raised on a volume pedal once a loop and come round on their
  // own ring; the others are held and breathe once in the loop.
  {
    n: 13,
    id: 'earthrise-steel-fmaj7',
    name: 'Earthrise steel {F}maj7',
    kind: 'pad',
    description:
      'Pedal steel raised on the volume pedal on {F} major seventh, then {A} minor seventh; it comes round.',
    preset: 'orbit-steel-earthrise-steel',
    ...cycled(12, [
      [0, 5, 41],
      [0.03, 5, 48],
      [0.06, 5, 57],
      [0.09, 5, 64],
      [6.1, 5, 45],
      [6.13, 5, 52],
      [6.16, 5, 60],
      [6.19, 5, 67],
    ]),
  },
  {
    n: 14,
    id: 'low-steel-halo-d',
    name: 'Low steel halo {D}',
    kind: 'pad',
    description:
      'A low fifth on {D} faded in over two seconds, under a reverb that climbs an octave on every pass.',
    preset: 'orbit-steel-low-steel-halo',
    ...cycled(8, [
      [0, 7, 38],
      [0.04, 7, 45],
    ]),
  },
  {
    n: 15,
    id: 'no-pick-heard-cmaj7',
    name: 'No pick heard {C}maj7',
    kind: 'pad',
    description:
      'A guitar chord on {C} major seventh with the pick removed by a slow swell, in a cathedral.',
    preset: 'orbit-steel-no-pick-heard',
    ...cycled(8, [
      [0, 7.6, 48],
      [0.02, 7.6, 55],
      [0.04, 7.6, 64],
      [0.06, 7.6, 71],
    ]),
  },
  {
    n: 16,
    id: 'tines-hammers-off-dm7',
    name: 'Tines, hammers off {D}m7',
    kind: 'pad',
    description:
      'Electric piano on {D} minor seventh with the hammers faded out, so the tines seem bowed, in a long plate.',
    preset: 'orbit-steel-tines-hammers-off',
    then: [NARROW],
    ...cycled(8, [
      [0, 6, 50],
      [0.01, 6, 57],
      [0.02, 6, 65],
      [0.03, 6, 72],
    ]),
  },
  {
    n: 17,
    id: 'harp-without-fingers-g',
    name: 'Harp without fingers {G}',
    kind: 'pad',
    description:
      'A harp chord on {G} with the pluck swelled away and the ring doubled a few cents wide, in a long plate.',
    preset: 'orbit-steel-harp-without-fingers',
    then: [NARROW],
    ...cycled(8, [
      [0, 6, 43],
      [0.02, 6, 55],
      [0.04, 6, 62],
      [0.06, 6, 67],
      [0.08, 6, 71],
    ]),
  },
  {
    n: 18,
    id: 'chorus-pad-bed-em7',
    name: 'Chorus pad bed {E}m7',
    kind: 'pad',
    description:
      'A chorus pad on {E} minor seventh with the filter half shut, breathing once a loop in a hall.',
    preset: 'orbit-steel-chorus-pad-bed',
    then: [breathe(0.125, 0.6)],
    ...looped(8, 6, 2, [52, 59, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 19,
    id: 'slow-light-pad-f',
    name: 'Slow light pad {F}',
    kind: 'pad',
    description:
      'Open fifths on {F} whose filter takes four seconds to open from nearly shut, in a long plate.',
    preset: 'orbit-steel-slow-light-pad',
    then: [NARROW],
    ...cycled(
      8,
      [
        [0, 7, 53],
        [0, 7, 60],
        [0, 7, 65],
        [0, 7, 72],
      ],
      { crossfadeSec: 1 },
    ),
  },
  {
    n: 20,
    id: 'thin-pulse-orbit-a',
    name: 'Thin pulse orbit {A}',
    kind: 'pad',
    description:
      'A thin pulse pad on {A} and {E}, panned twice round the loop across a very large space.',
    preset: 'orbit-steel-thin-pulse-orbit',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.25, depth: 0.5, drift: 0 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.45, width: 0.8 } },
    ],
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [57, [64, 0.8]]),
  },
  {
    n: 21,
    id: 'pad-in-tremolo-am',
    name: 'Pad in tremolo {A}m',
    kind: 'pad',
    description:
      'A sawtooth pad on {A} minor in tremolo at three and a half beats a second, then a long spring.',
    preset: 'orbit-steel-pad-in-tremolo',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.5, depth: 0.7, drift: 0 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    ...looped(8, 4, 2, [45, 57, [60, 0.8], [64, 0.8]]),
  },
  {
    n: 22,
    id: 'soft-brass-swell-g',
    name: 'Soft brass swell {G}',
    kind: 'pad',
    description:
      'A soft brass chord on {G} that starts dark and swells while it is held, once a loop, in a long plate.',
    preset: 'orbit-steel-soft-brass-swell',
    then: [NARROW],
    ...cycled(8, [
      [0, 5.5, 43],
      [0, 5.5, 50],
      [0, 5.5, 59],
      [0, 5.5, 62],
    ]),
  },
  {
    n: 23,
    id: 'low-slow-opening-g',
    name: 'Low slow opening {G}',
    kind: 'pad',
    description:
      'A low fifth on {G} that opens from dark over four seconds and goes on swelling, on tape in a hall.',
    preset: 'orbit-steel-low-slow-opening',
    ...cycled(
      8,
      [
        [0, 6.5, 43],
        [0, 6.5, 50],
      ],
      { passes: 2 },
    ),
    tuning: 'whole-cycles',
  },
  {
    n: 24,
    id: 'muted-section-far-d',
    name: 'Muted section, far {D}',
    kind: 'pad',
    description:
      'Five muted players on each of {D}, {A} and {E}, swelling once a loop, on tape, far back in a cathedral.',
    preset: 'orbit-steel-muted-section-far',
    then: [breathe(0.125, 0.6)],
    ...looped(8, 6, 3, [50, 57, [64, 0.8]]),
  },
  {
    n: 25,
    id: 'chapel-choir-far-f',
    name: 'Chapel choir, far {F}',
    kind: 'pad',
    description:
      'A small choir on {F} major heard through a speaker down the hall, its vowels moving slowly.',
    preset: 'orbit-steel-chapel-choir-far',
    // The vowels move less than in the preset: at full motion each change of vowel is heard as a note.
    set: { ensemble: 0, vibrato: 0, motion: 0.4 },
    // A hall in place of the plate: under held voices a plate's drift is heard as notes.
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.6, room: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [breathe(0.0625, 0.55)],
    ...looped(16, 5, 3, [60, 65, [69, 0.8]]),
  },
  {
    n: 26,
    id: 'tape-choir-halo-am',
    name: 'Tape choir halo {A}m',
    kind: 'pad',
    description:
      'A choir from tape on {A} minor with a ninth, breathing once a loop, a reverb an octave up above it.',
    preset: 'orbit-steel-tape-choir-halo',
    set: { vibrato: 0.1, players: 0.2 },
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [57, [60, 0.8], [64, 0.8], [71, 0.6]]),
  },
  {
    n: 27,
    id: 'far-horn-chorale-c',
    name: 'Far horn chorale {C}',
    kind: 'pad',
    description:
      'A section of horns on {C} major with itself at half speed an octave below, far back in a long hall.',
    preset: 'orbit-steel-far-horn-chorale',
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 2, [48, 55, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 28,
    id: 'ensemble-slow-phase-am',
    name: 'Ensemble slow phase {A}m',
    kind: 'pad',
    description:
      'A string ensemble keyboard on {A} minor, dark and wide, through a slow phaser in a hall.',
    preset: 'orbit-steel-ensemble-slow-phase',
    set: { width: 0.6 },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 7, 2, [57, 64, [72, 0.8]]),
  },
  {
    n: 29,
    id: 'hollow-pad-phasing-e',
    name: 'Hollow pad phasing {E}',
    kind: 'pad',
    description:
      'A hollow wavetable pad on {E} and {B} that changes once round the loop, every partial shifted a little, in a hall.',
    preset: 'orbit-steel-hollow-pad-phasing',
    set: { rate: 0.0625 },
    effects: [
      { deviceId: 'freq-shifter', params: { fine: 0.375, mix: 0.4, width: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    then: [breathe(0.0625, 0.55)],
    ...looped(16, 5, 3, [40, 52, [59, 0.8]]),
  },
  {
    n: 30,
    id: 'slow-fold-swell-g',
    name: 'Slow fold swell {G}',
    kind: 'pad',
    description:
      'A tone on {G} that folds brighter over two seconds and darkens as it fades, doubled wide, in a hall.',
    preset: 'orbit-steel-slow-fold-swell',
    set: { drift: 0.2 },
    ...cycled(
      8,
      [
        [0, 7.2, 43],
        [0, 7.2, 55],
        [0, 7.2, 62],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 31,
    id: 'beating-glass-climb-c',
    name: 'Beating glass climb {C}',
    kind: 'pad',
    description:
      'A four-operator pad of beating partials on {C}, in a reverb whose tail climbs an octave as it rings.',
    preset: 'orbit-steel-beating-glass-climb',
    set: { detune: 4 },
    // A shimmer in place of the preset's grain reverb, whose grains land between the keys in
    // some keys.
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.4, width: 0.4 } }],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 2, [60, 67, [72, 0.8], [76, 0.7]]),
  },
  {
    n: 32,
    id: 'strum-read-backwards',
    name: 'Strum read backwards',
    kind: 'pad',
    description:
      'A guitar chord on {E} minor read backwards in long grains, with dark repeats in a plate.',
    preset: 'orbit-steel-loaded-sound-backwards',
    source: 'guitar-chord-em',
    set: { spread: 0.5, density: 14 },
    then: [breathe(0.125, 0.4), NARROW],
    ...looped(8, 6, 2, [60]),
  },
  {
    n: 33,
    id: 'warm-pad-turning-e',
    name: 'Warm pad turning {E}',
    kind: 'pad',
    description:
      'A warm two-oscillator pad on {E} and {B} through a slowly turning speaker and a plate, breathing once a loop.',
    preset: 'orbit-steel-warm-pad-turning',
    set: { unisonDetune: 6, osc2Fine: 4, lfo1Rate: 0.125 },
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [52, 59, [64, 0.7]]),
  },
  {
    n: 34,
    id: 'rubbed-bowl-circling-d',
    name: 'Rubbed bowl circling {D}',
    kind: 'pad',
    description:
      'A singing bowl on {D} rubbed and held, circling once round the loop in a very large space.',
    preset: 'orbit-steel-rubbed-bowl-circling',
    set: { detune: 0 },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.125, depth: 0.25, drift: 0 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.8 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 2, [62]),
  },
  {
    n: 35,
    id: 'pump-organ-bellows-d',
    name: 'Pump organ bellows {D}',
    kind: 'pad',
    description:
      'A wheezing reed organ on {D} and {A} with its bellows heard, on a cassette in a small room.',
    preset: 'orbit-steel-pump-organ-cassette',
    set: { breath: 0.4 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 3, 2, [50, [57, 0.8]]),
  },
  {
    n: 36,
    id: 'low-ensemble-sway-c',
    name: 'Low ensemble sway {C}',
    kind: 'pad',
    description:
      'The low octave of a string ensemble on {C} and {G}, swayed bass against treble, in a long plate.',
    preset: 'orbit-steel-low-ensemble-sway',
    set: { width: 0.4 },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 2, rate: 2.75, depth: 0.7, crossover: 250, drift: 0 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.6), NARROW],
    ...looped(8, 5, 2, [48, [55, 0.8]]),
  },
  {
    n: 37,
    id: 'low-flute-chord-f',
    name: 'Low flute chord {F}',
    kind: 'pad',
    description:
      'Low flutes on {F}, {C} and {A}, doubled a few cents wide, breathing once a loop in a long plate.',
    preset: 'orbit-steel-low-flute-chord',
    set: { breath: 0.35 },
    then: [breathe(0.125, 0.6), NARROW],
    ...looped(8, 5, 2, [
      [53, 0.75],
      [60, 0.75],
      [69, 0.7],
    ]),
  },
  {
    n: 38,
    id: 'endless-guitar-note-e',
    name: 'Endless guitar note {E}',
    kind: 'pad',
    description:
      'A swelled guitar {E} through a valve stage, caught and held, with dark repeats in a long plate.',
    preset: 'orbit-steel-endless-guitar-note',
    then: [NARROW],
    ...cycled(8, [[0, 6.5, 52]], { passes: 2 }),
  },
  {
    n: 39,
    id: 'slow-string-wall-a',
    name: 'Slow string wall {A}',
    kind: 'pad',
    description:
      'Four drone strings on {A} and {E} plucked once round the loop and swelling with it, on tape in a very large space.',
    preset: 'orbit-steel-slow-string-wall',
    set: { speed: 8 },
    // A pluck stands well over the strings still ringing and is heard as a note: the limiter
    // takes it down and the compressor brings the ring up behind it.
    then: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      LEVEL,
      breathe(0.125, 0.6),
    ],
    ...looped(8, 8, 2, [45]),
  },
  {
    n: 40,
    id: 'low-cabin-pad-f',
    name: 'Low cabin pad {F}',
    kind: 'pad',
    description:
      'Square waves on a low {F} and {C} over their sub octaves, the filter half shut, on tape in a hall.',
    preset: 'orbit-steel-low-cabin-pad',
    then: [breathe(0.125, 0.6), quarterTurn(8)],
    ...looped(8, 5, 2, [41, [48, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 41,
    id: 'rolled-bars-rising-f',
    name: 'Rolled bars rising {F}',
    kind: 'pad',
    description:
      'A marimba chord on {F} rolled into a soft shimmer, in a reverb that swells up after it.',
    preset: 'orbit-steel-rolled-bars-rising',
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [53, 60, [65, 0.8], [69, 0.8]]),
  },
  {
    n: 42,
    id: 'handless-steel-pan-d',
    name: 'Handless steel pan {D}',
    kind: 'pad',
    description:
      'Three fifths on a steel pan from {D} up, the hand taken off each by a swell, its octaves ringing on in a rising reverb.',
    preset: 'orbit-steel-handless-steel-pan',
    ...cycled(8, [
      [0, 2.4, 50],
      [0.03, 2.4, 57],
      [2.71, 2.4, 53],
      [2.74, 2.4, 60],
      [5.38, 2.4, 57],
      [5.41, 2.4, 64],
    ]),
  },
  {
    n: 43,
    id: 'octave-down-cellos-g',
    name: 'Octave-down cellos {G}',
    kind: 'pad',
    description:
      'Cellos on tape at half speed on {G} and {D}, an octave under the keys, far back in a cathedral.',
    preset: 'orbit-steel-octave-down-cellos',
    set: { spread: 0.3 },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { width: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 2, [55, [62, 0.8]]),
  },

  {
    n: 44,
    id: 'pedal-bowed-guitar-e',
    name: 'Pedal-bowed guitar {E}',
    kind: 'pad',
    description:
      'Four guitar notes from {E} with the attack taken off by a pedal, each echoed three times into a hall.',
    preset: 'orbit-steel-pedal-bowed-guitar',
    ...cycled(12, [
      [0, 2.8, 52, 0.7],
      [3.17, 2.6, 59, 0.65],
      [6.42, 2.9, 55, 0.7],
      [9.03, 2.2, 57, 0.6],
    ]),
  },

  // Textures: what is outside the room where the tape is running, and the noise of the machines
  // in it. Most are weather written out, through the pack's tape, springs and large spaces.
  {
    n: 45,
    id: 'shore-far-below-loop',
    name: 'Shore far below',
    kind: 'texture',
    description:
      'A slow shore breaking somewhere below, on tape, with a very large space opening behind each wave.',
    preset: 'orbit-steel-shore-far-below',
    ...looped(16, 4, 3, [48]),
  },
  {
    n: 46,
    id: 'night-field-crickets-loop',
    name: 'Night field crickets',
    kind: 'texture',
    description:
      'A field of crickets at a distance on a warm night, its top rolled off, on tape in a hall.',
    preset: 'orbit-steel-night-field-crickets',
    set: { tone: 0.6, movement: 0.4, density: 1 },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 12, scatter: 1, feedback: 0.3, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...looped(8, 6, 2, [41, 47, 52, 57, 62, 67, 72, 77]),
  },
  {
    n: 47,
    id: 'far-ridge-storm-loop',
    name: 'Far ridge storm',
    kind: 'texture',
    description: 'Thunder a long way off, one roll dying under the next, in a very large space.',
    preset: 'orbit-steel-far-ridge-storm',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, lowCut: 30, width: 0.7 } },
    ],
    then: [soften(8)],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 48,
    id: 'breath-over-steel-loop',
    name: 'Breath over steel',
    kind: 'texture',
    description:
      'Singers who are mostly breath on {E} and {B}, with a reverb an octave up above them.',
    preset: 'orbit-steel-breath-over-steel',
    ...looped(8, 6, 2, [52, 59]),
  },
  {
    n: 49,
    id: 'noise-choir-far-loop',
    name: 'Noise choir, far',
    kind: 'texture',
    description:
      'Wide bands of filtered noise around {D} and {A}, breathing once a loop, far back in a cathedral.',
    preset: 'orbit-steel-noise-choir-far',
    set: { resonance: 15, breatheRate: 0.125 },
    ...looped(8, 6, 2, [62, 69]),
  },
  {
    n: 50,
    id: 'rain-smeared-to-grains',
    name: 'Rain smeared to grains',
    kind: 'texture',
    description:
      'A steady downpour smeared into long overlapping grains, half of them backwards, in a plate.',
    preset: 'orbit-steel-loaded-sound-grains',
    source: 'steady-downpour',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 51,
    id: 'wind-off-the-ridge',
    name: 'Wind off the ridge',
    kind: 'texture',
    description:
      'Wind over a hill heard on tape, gusting slowly, with a very large space behind it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3, width: 0.7 } },
    ],
    ...looped(16, 3, 3, [50]),
  },
  {
    n: 52,
    id: 'rain-on-a-tin-roof',
    name: 'Rain on a tin roof',
    kind: 'texture',
    description: 'Rain close overhead, every drop ringing a spring tank a little.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.6, attack: 0.5, width: 0.6 },
    },
    effects: [
      soften(14),
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 53,
    id: 'campfire-on-cassette',
    name: 'Campfire on cassette',
    kind: 'texture',
    description: 'A fire crackling and hissing close by, recorded to a cassette in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { attack: 0.5, width: 0.6 },
    },
    effects: [
      soften(10),
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 54,
    id: 'stock-pond-frogs',
    name: 'Stock pond frogs',
    kind: 'texture',
    description: 'A pond full of frogs after dark, croaks and peeps on every side, in a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Pond at dusk',
      params: { density: 1, distance: 0.6, attack: 1 },
    },
    effects: [soften(12), { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
    ...looped(16, 3, 3, [43, 48, 55, 60, 65]),
  },
  {
    n: 55,
    id: 'creek-below-the-porch',
    name: 'Creek below the porch',
    kind: 'texture',
    description:
      'A small stream a little way off, bubbles over a soft rush of water, on clean tape.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.5, distance: 0.35, attack: 0.5, width: 0.8 },
    },
    effects: [{ deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4 } }],
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 56,
    id: 'record-left-spinning',
    name: 'Record left spinning',
    kind: 'texture',
    description:
      'The crackle of a record in its last groove, through a small amp with its dark spring on.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 1, width: 0.6 },
    },
    effects: [
      soften(30),
      { deviceId: 're-amp', preset: 'Combo in a room' },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { mix: 0.3, width: 1, springs: 1 },
      },
    ],
    ...looped(8, 2, 2, [52]),
  },

  {
    n: 57,
    id: 'air-strummed-dm',
    name: 'Air, strummed {D}m',
    kind: 'texture',
    description:
      'Bands of noise strummed across {D} minor and then {C}, each a soft pitched breath, repeated by tape heads.',
    preset: 'orbit-steel-air-strummed',
    ...cycled(8, [
      [0, 3, 62, 0.8],
      [0, 3, 65, 0.7],
      [0, 3, 69, 0.7],
      [4.13, 3, 60, 0.8],
      [4.13, 3, 64, 0.7],
      [4.13, 3, 67, 0.7],
    ]),
  },

  // One-shots: one note or one chord, picked, struck or strummed, with the slap of echo or the
  // spring behind it, ringing out inside its length.
  {
    n: 58,
    id: 'detuned-double-slap-c',
    name: 'Detuned double slap {C}',
    kind: 'oneshot',
    description:
      'One {C} picked hard by the bridge of a clean guitar, doubled wide, with a tape slap and a plate.',
    preset: 'orbit-steel-detuned-double-slap',
    // The slap nearer and softer than in the preset, the double a little narrower: at 140 ms the
    // slap is a second note in some keys.
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 95,
          feedback: 0.2,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.2,
          highCut: 6000,
          spread: 0.3,
          mix: 0.25,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
    ],
    then: [lift(10)],
    ...played(5, [[0, 3.6, 48]], 0.6),
  },
  {
    n: 59,
    id: 'far-side-baritone-e',
    name: 'Far side baritone {E}',
    kind: 'oneshot',
    description: 'A low {E} picked on a baritone guitar over the hum of its amp, in a dark spring.',
    preset: 'orbit-steel-far-side-baritone',
    // Picked a fifth of the way along the string, where its fifth partial (a major third, off
    // the white keys) is not sounded; the tremolo and the spring a little narrower.
    set: { position: 0.2 },
    effects: [
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -46 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.6, depth: 0.45, phase: 30 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { mix: 0.4, decay: 3, width: 0.7, springs: 1 },
      },
    ],
    then: [lift(10)],
    ...played(6, [[0, 2.5, 40]], 3),
  },
  {
    n: 60,
    id: 'strum-into-octaves-g',
    name: 'Strum into octaves {G}',
    kind: 'oneshot',
    description:
      'An open {G} chord dragged across six strings into a reverb that climbs by octaves after it.',
    preset: 'orbit-steel-strum-into-octaves',
    // The climbing tail a little lower than in the preset: in some keys it rose over the strum
    // and the chord was heard to swell in.
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { mix: 0.45, shimmer: 0.35, decay: 14 },
      },
    ],
    ...played(
      12,
      [
        [0, 5, 43, 0.7],
        [0, 5, 50, 0.65],
        [0, 5, 55, 0.65],
        [0, 5, 59, 0.6],
        [0, 5, 62, 0.6],
        [0, 5, 67, 0.65],
      ],
      3,
    ),
  },
  {
    n: 61,
    id: 'hallway-twelve-string-a',
    name: 'Hallway twelve-string {A}',
    kind: 'oneshot',
    description:
      'A twelve-string strummed once on {A} with a ninth, on tape, through an amp at the far end of a hall.',
    preset: 'orbit-steel-hallway-twelve-string',
    // On {A}, so that five keys down its lowest string is still a guitar's lowest.
    then: [lift(6), NARROW],
    ...played(
      7,
      [
        [0, 5, 45, 0.7],
        [0, 5, 52, 0.65],
        [0, 5, 57, 0.65],
        [0, 5, 59, 0.6],
        [0, 5, 64, 0.65],
      ],
      1.2,
    ),
  },
  {
    n: 62,
    id: 'open-strings-answer-d',
    name: 'Open strings answer {D}',
    kind: 'oneshot',
    description:
      'One {D} on a steel string left to ring, a bank of tuned strings answering it in a hall.',
    preset: 'orbit-steel-open-strings-answer',
    ...played(8, [[0, 5.5, 50]], 1.5),
  },
  {
    n: 63,
    id: 'porch-thumb-chord-c',
    name: 'Porch thumb chord {C}',
    kind: 'oneshot',
    description:
      'A {C} chord brushed slowly with the thumb on a steel-string, close and soft, in a small room.',
    preset: 'orbit-steel-porch-thumb-guitar',
    ...played(
      5,
      [
        [0, 4, 48, 0.7],
        [0, 4, 55, 0.65],
        [0, 4, 60, 0.6],
        [0, 4, 64, 0.6],
        [0, 4, 67, 0.65],
      ],
      0.6,
    ),
  },
  {
    n: 64,
    id: 'slow-sway-tines-dm9',
    name: 'Slow sway tines {D}m9',
    kind: 'oneshot',
    description:
      'A soft electric piano chord on {D} minor ninth, swayed slowly from side to side in a hall.',
    preset: 'orbit-steel-slow-sway-tines',
    ...played(
      7,
      [
        [0, 5, 50, 0.7],
        [0.01, 5, 57, 0.6],
        [0.02, 5, 65, 0.6],
        [0.03, 5, 72, 0.6],
        [0.04, 5, 76, 0.55],
      ],
      1.2,
    ),
  },
  {
    n: 65,
    id: 'low-harp-cassette-f',
    name: 'Low harp, cassette {F}',
    kind: 'oneshot',
    description:
      'A low {F} plucked by the soundboard of a harp, close and woody, on a cassette with a plate.',
    preset: 'orbit-steel-low-harp-cassette',
    ...played(5, [[0, 3.6, 41]], 0.8),
  },
  {
    n: 66,
    id: 'string-pressed-sharp-g',
    name: 'String pressed sharp {G}',
    kind: 'oneshot',
    description:
      'A silk string plucked on {G} and pressed a whole tone sharp, through tremolo in a hall.',
    preset: 'orbit-steel-strings-pressed-sharp',
    // A shallower tremolo than the preset's: at its depth a pulse was a second note in one key.
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.8, depth: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    then: [lift(10)],
    ...played(5, [[0, 3, 67]], 0.8),
  },
  {
    n: 67,
    id: 'felt-chord-widened-am',
    name: 'Felt chord, widened {A}m',
    kind: 'oneshot',
    description:
      'A felt piano chord on {A} minor with a ninth, played soft and doubled wide, far back in a cathedral.',
    preset: 'orbit-steel-felt-piano-widened',
    ...played(
      9,
      [
        [0, 5.5, 45, 0.75],
        [0.01, 5.5, 57, 0.7],
        [0.02, 5.5, 60, 0.7],
        [0.03, 5.5, 64, 0.7],
        [0.04, 5.5, 71, 0.7],
      ],
      2,
    ),
  },
  {
    n: 68,
    id: 'front-room-upright-f',
    name: 'Front room upright {F}',
    kind: 'oneshot',
    description:
      'A low {F} on a bare upright, recorded hot to tape, with one slap behind it and a little spring.',
    preset: 'orbit-steel-front-room-upright',
    // The slap nearer than in the preset (at 120 ms it is the loudest moment in some keys), and
    // the hammer rounded off on tape: one low note is a tall hammer over a quiet string.
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 95,
          feedback: 0.12,
          wow: 0.15,
          flutter: 0.1,
          drive: 0.3,
          highCut: 5000,
          spread: 0,
          mix: 0.25,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
    then: [{ deviceId: 'saturator', preset: 'On tape', params: { driveDb: 16, outputDb: -6 } }],
    ...played(5, [[0, 3.6, 41]], 0.8),
  },
  {
    n: 69,
    id: 'cave-tongue-drum-e',
    name: 'Cave tongue drum {E}',
    kind: 'oneshot',
    description:
      'One soft {E} on a steel tongue drum, low and round, in a dark cavern of short echoes.',
    preset: 'orbit-steel-cave-tongue-drum',
    ...played(7, [[0, 3, 52]], 1.5),
  },
  {
    n: 70,
    id: 'far-field-bell-d',
    name: 'Far field bell {D}',
    kind: 'oneshot',
    description:
      'One stroke of a church bell on {D} heard from across a field, with a cathedral tail.',
    preset: 'orbit-steel-far-field-bell',
    // Struck two thirds of the way up, on the node of the partial that would be a major third.
    set: { position: 0.667, decay: 10 },
    then: [lift(10), NARROW],
    ...played(12, [[0, 6, 50]], 3),
  },
  {
    n: 71,
    id: 'operator-tines-b',
    name: 'Operator tines {B}',
    kind: 'oneshot',
    description:
      'One {B} on a soft four-operator electric piano, grain repeats climbing an octave behind it in a hall.',
    preset: 'orbit-steel-operator-tines',
    // The grains quieter than in the preset: behind one note they were counted as more notes.
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { feedback: 0.3, mix: 0.12 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    ...played(6, [[0, 3, 71]], 1),
  },
  {
    n: 72,
    id: 'wooden-pluck-slapped-g',
    name: 'Wooden pluck, slapped {G}',
    kind: 'oneshot',
    description:
      'One woody folded pluck on {G} through a slap echo and a spring tank, short and near.',
    preset: 'orbit-steel-wooden-pluck-slapped',
    ...played(3, [[0, 2, 55]], 0.4),
  },
  {
    n: 73,
    id: 'paired-strings-far-a',
    name: 'Paired strings, far {A}',
    kind: 'oneshot',
    description:
      'Paired strings an octave apart strummed once on {A} and {E}, with a tape slap in a cathedral.',
    preset: 'orbit-steel-paired-strings-far',
    set: { strum: 25 },
    then: [lift(8)],
    ...played(
      10,
      [
        [0, 6, 45, 0.7],
        [0, 6, 52, 0.65],
        [0, 6, 57, 0.65],
      ],
      2,
    ),
  },
  {
    n: 74,
    id: 'swept-chord-tremolo-c',
    name: 'Swept chord, tremolo {C}',
    kind: 'oneshot',
    description:
      'A {C} chord swept upward on a strum plate over a soft pad of its notes, through tremolo in a hall.',
    preset: 'orbit-steel-swept-chord-tremolo',
    ...played(
      7,
      [
        [0, 4, 60, 0.7],
        [0, 4, 64, 0.7],
        [0, 4, 67, 0.7],
      ],
      1.2,
    ),
  },
  {
    n: 75,
    id: 'twelve-string-sway-c',
    name: 'Twelve-string sway {C}',
    kind: 'oneshot',
    description:
      'Twelve strings strummed once on {C} with a ninth, swayed bass against treble, in a long plate.',
    preset: 'orbit-steel-twelve-string-sway',
    // The two sides sway a third of a turn apart, not half: opposite, the sound is wider than
    // the bank allows in some keys.
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Wide shimmer',
        params: { rate: 3.2, depth: 0.8, shape: 0, crossover: 800, phase: 120 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    then: [lift(8)],
    ...played(
      8,
      [
        [0.004, 6, 48, 0.7],
        [0.004, 6, 55, 0.65],
        [0.004, 6, 60, 0.65],
        [0.004, 6, 62, 0.6],
        [0.004, 6, 67, 0.65],
      ],
      1.5,
    ),
  },

  // Phrases: a few notes in free time. The steel slides to a note that overlaps the one before
  // instead of picking it; where a preset swells every note in, the swell is taken off so the
  // picks are heard. Most come round on their own ring; the rest ring out.
  {
    n: 76,
    id: 'long-bar-slide-g',
    name: 'Long bar slide {G}',
    kind: 'melodic',
    description:
      'A steel string picked on {G} and slid up to {B}, then {D} slid to {E}, and down to {C}; it comes round.',
    preset: 'orbit-steel-long-bar-slide',
    set: { swell: 0 },
    ...cycled(12, [
      [0, 2.9, 55, 0.7],
      [1.83, 2.4, 59, 0.6],
      [4.71, 2.6, 62, 0.7],
      [6.37, 2.5, 64, 0.6],
      [9.2, 2.3, 60, 0.65],
    ]),
  },
  {
    n: 77,
    id: 'half-speed-steel-c',
    name: 'Half-speed steel {C}',
    kind: 'melodic',
    description:
      'Steel climbs {C}, {E}, {G} and settles on {F}, its own playback at half speed an octave under it; it rings out.',
    preset: 'orbit-steel-half-speed-steel',
    set: { swell: 0 },
    ...played(
      10,
      [
        [0, 1.7, 60, 0.7],
        [1.37, 1.5, 64, 0.65],
        [2.61, 2.6, 67, 0.7],
        [5.33, 2.6, 65, 0.6],
      ],
      2,
    ),
  },
  {
    n: 78,
    id: 'tremolo-steel-f',
    name: 'Tremolo steel {F}',
    kind: 'melodic',
    description:
      'A singing steel lead on {F}, {A} and {C} slid up to {D}, through an amp tremolo and a long spring; it comes round.',
    preset: 'orbit-steel-tremolo-steel',
    set: { swell: 0 },
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.625, depth: 0.5, drift: 0 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    ...cycled(8, [
      [0, 1.3, 53, 0.7],
      [1.42, 2, 57, 0.65],
      [3.61, 2.6, 60, 0.7],
      [5.2, 2.1, 62, 0.6],
    ]),
    loopFold: 'power',
  },
  {
    n: 79,
    id: 'two-string-harmony-c',
    name: 'Two-string harmony {C}',
    kind: 'melodic',
    description:
      'A steel line from {E} up to {G} and down to {C} with a third above and a sixth below found from the scale; it rings out.',
    preset: 'orbit-steel-two-string-harmony',
    set: { swell: 0 },
    ...played(
      9,
      [
        [0, 1.5, 64, 0.7],
        [1.52, 1.1, 65, 0.6],
        [2.71, 1.9, 67, 0.7],
        [4.83, 1.3, 64, 0.6],
        [6.21, 2.2, 60, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 80,
    id: 'echo-thrown-steel-g',
    name: 'Echo-thrown steel {G}',
    kind: 'melodic',
    description:
      'Three bright picked steel notes from {G} thrown into a tape echo that feeds itself; it comes round.',
    preset: 'orbit-steel-echo-thrown-steel',
    // The echo a little lower and nearer the middle than in the preset, and the whole brought
    // inside the bank's width: thrown fully to the sides it is too wide for mono in one key.
    effects: [
      {
        deviceId: 'tape-echo',
        params: {
          time: 750,
          feedback: 0.55,
          heads: 3,
          wow: 0.35,
          flutter: 0.2,
          drive: 0.5,
          lowCut: 180,
          highCut: 3000,
          spread: 0.5,
          mix: 0.35,
        },
      },
      {
        deviceId: 'spring-reverb',
        params: {
          mix: 0.25,
          decay: 3,
          tension: 0.35,
          tone: 2400,
          drip: 0.55,
          predelay: 60,
          drive: 0.7,
        },
      },
    ],
    then: [NARROW],
    ...cycled(
      8,
      [
        [0, 0.9, 67, 0.7],
        [2.87, 0.9, 74, 0.6],
        [5.31, 1.1, 72, 0.65],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 81,
    id: 'lap-steel-question-c',
    name: 'Lap steel question {C}',
    kind: 'melodic',
    description:
      'A lap steel picked on {C} and slid to {E}, then {G} slid up to the high {C} and left hanging; it rings out.',
    preset: 'orbit-steel-lap-slapback',
    ...played(
      7,
      [
        [0, 1.2, 60, 0.7],
        [0.84, 1.6, 64, 0.6],
        [2.93, 1.1, 67, 0.7],
        [3.71, 2.6, 72, 0.6],
      ],
      1,
    ),
  },
  {
    n: 82,
    id: 'small-amp-tremolo-am',
    name: 'Small amp tremolo {A}m',
    kind: 'melodic',
    description:
      'A neck pickup climbs {A} minor and steps back down through deep tremolo and a spring; it comes round.',
    preset: 'orbit-steel-small-amp-tremolo',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 4.25, depth: 0.8, drift: 0 } },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } },
    ],
    ...cycled(8, [
      [0, 2.4, 45, 0.7],
      [1.31, 2.1, 52, 0.6],
      [2.57, 2.3, 60, 0.65],
      [4.42, 1.6, 59, 0.6],
      [5.83, 2, 57, 0.65],
    ]),
  },
  {
    n: 83,
    id: 'porch-thumb-picking-g',
    name: 'Porch thumb picking {G}',
    kind: 'melodic',
    description:
      'A thumb picks a bass and the strings over it on {G}, then on {C}, and brushes {G} again; it rings out.',
    preset: 'orbit-steel-porch-thumb-guitar',
    ...played(
      8,
      [
        [0, 1.6, 43, 0.7],
        [0.62, 1.2, 55, 0.55],
        [1.17, 1.3, 59, 0.6],
        [1.93, 1.5, 62, 0.6],
        [3.04, 1.6, 48, 0.7],
        [3.71, 1.2, 55, 0.55],
        [4.22, 1.4, 60, 0.6],
        [5.33, 2.4, 43, 0.7],
        [5.39, 2.4, 59, 0.55],
        [5.45, 2.4, 62, 0.6],
      ],
      0.8,
    ),
  },
  {
    n: 84,
    id: 'flat-top-slapback-f',
    name: 'Flat-top slapback {F}',
    kind: 'melodic',
    description:
      'A steel-string picked near the bridge up from {F} to {D} and back to {A}, a tape slap behind each note; it rings out.',
    preset: 'orbit-steel-flat-top-slapback',
    ...played(
      7,
      [
        [0.004, 1.4, 53, 0.7],
        [0.71, 1.2, 57, 0.6],
        [1.58, 1.3, 60, 0.65],
        [2.83, 1.5, 62, 0.7],
        [3.94, 1.1, 60, 0.6],
        [4.67, 2, 57, 0.65],
      ],
      0.8,
    ),
  },
  {
    n: 85,
    id: 'looped-fingerpicking-am',
    name: 'Looped fingerpicking {A}m',
    kind: 'melodic',
    description:
      'Soft fingerpicking on {A} minor and {F} over a loop of itself at half speed, on worn tape; it comes round.',
    preset: 'orbit-steel-looped-fingerpicking',
    ...cycled(
      8,
      [
        [0, 1.5, 45, 0.7],
        [0.74, 1.3, 57, 0.55],
        [1.33, 1.4, 60, 0.6],
        [2.26, 1.6, 64, 0.6],
        // The bass of the second chord an octave up: five keys down the low one is under a guitar.
        [3.61, 1.5, 53, 0.7],
        [4.29, 1.3, 57, 0.55],
        [4.93, 1.4, 60, 0.6],
        [5.88, 1.7, 65, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 86,
    id: 'strings-rise-behind-em',
    name: 'Strings rise behind {E}m',
    kind: 'melodic',
    description:
      'Five slow nylon notes on {E} minor with a soft section pad swelling in behind them; it comes round.',
    preset: 'orbit-steel-strings-rise-behind',
    ...cycled(12, [
      [0.02, 3.2, 52, 0.7],
      [1.87, 2.6, 59, 0.6],
      [3.93, 3, 67, 0.65],
      [6.48, 2.8, 64, 0.6],
      [8.71, 2.4, 62, 0.6],
    ]),
  },
  {
    n: 87,
    id: 'filter-sings-alone-a',
    name: 'Filter sings alone {A}',
    kind: 'melodic',
    description:
      'A filter sings a near-sine line from {A} up to {E} and back to {D}, two octaves over the keys; it comes round.',
    preset: 'orbit-steel-filter-sings-alone',
    ...cycled(8, [
      [0, 1.9, 57, 0.7],
      [2.07, 1.3, 60, 0.65],
      [3.52, 2.2, 64, 0.7],
      [5.93, 1.3, 62, 0.6],
    ]),
  },
  {
    n: 88,
    id: 'struck-pad-loop-c',
    name: 'Struck pad loop {C}',
    kind: 'melodic',
    description:
      'Three short pad notes on {C} played into a loop of tape, each pass quieter and more worn; it comes round.',
    preset: 'orbit-steel-struck-pad-loop',
    ...cycled(
      8,
      [
        [0, 0.5, 60, 0.7],
        [0.83, 0.5, 67, 0.6],
        [3.47, 0.6, 64, 0.65],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 89,
    id: 'tines-long-memory-dm',
    name: 'Tines, long memory {D}m',
    kind: 'melodic',
    description:
      'A soft electric piano climbs {D} minor and falls to {C}, on a worn cassette with echoes; it comes round.',
    preset: 'orbit-steel-tines-long-memory',
    ...cycled(8, [
      [0, 1.4, 50, 0.7],
      [1.13, 1.2, 57, 0.6],
      [2.46, 1.6, 65, 0.65],
      [4.31, 1.3, 64, 0.6],
      [5.59, 1.8, 60, 0.6],
    ]),
    loopFold: 'power',
  },
  {
    n: 90,
    id: 'octave-harp-round-em',
    name: 'Octave harp round {E}m',
    kind: 'melodic',
    description:
      'Harp strings climb {E} minor and turn back, each with a second string an octave up; it comes round.',
    preset: 'orbit-steel-octave-strung-harp',
    set: { touch: 0.6 },
    then: [NARROW],
    ...cycled(8, [
      [0, 2.2, 52, 0.7],
      [0.83, 2, 59, 0.6],
      [1.74, 2, 64, 0.6],
      [2.91, 2.2, 67, 0.65],
      [4.38, 2, 71, 0.6],
      [5.42, 2.2, 69, 0.6],
      [6.61, 1.2, 64, 0.55],
    ]),
  },
  {
    n: 91,
    id: 'pressed-strings-fall-c',
    name: 'Pressed strings fall {C}',
    kind: 'melodic',
    description:
      'Silk strings step down from a high {C}, each pressed a whole tone sharp after the pluck; it comes round.',
    preset: 'orbit-steel-strings-pressed-sharp',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.75, depth: 0.6, drift: 0 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    then: [lift(10)],
    ...cycled(8, [
      [0, 1.6, 72, 0.7],
      [1.21, 1.4, 69, 0.6],
      [2.67, 1.8, 67, 0.65],
      [4.36, 1.5, 62, 0.6],
      [5.71, 1.9, 60, 0.65],
    ]),
  },
  {
    n: 92,
    id: 'felt-piano-widened-c',
    name: 'Felt piano, widened {C}',
    kind: 'melodic',
    description:
      'A felt piano on {C} and then {F}, a few soft notes over each bass, doubled wide in a cathedral; it comes round.',
    preset: 'orbit-steel-felt-piano-widened',
    ...cycled(8, [
      [0, 2.6, 48, 0.75],
      [0.07, 2.4, 64, 0.7],
      [1.52, 1.8, 67, 0.7],
      [2.71, 2.2, 72, 0.75],
      [4.18, 2.4, 53, 0.7],
      [4.26, 2.2, 69, 0.7],
      [5.83, 1.8, 67, 0.7],
    ]),
  },
  {
    n: 93,
    id: 'upright-comes-home-g',
    name: 'Upright comes home {G}',
    kind: 'melodic',
    description:
      'A bare upright climbs from {G} to {E} and comes home, a tape slap behind each note; it rings out.',
    preset: 'orbit-steel-front-room-upright',
    then: [lift(8)],
    ...played(
      8,
      [
        [0, 1.3, 55, 0.7],
        [0.87, 1.2, 59, 0.65],
        [1.69, 1.4, 62, 0.7],
        [2.93, 1.9, 64, 0.7],
        [4.12, 1.3, 62, 0.65],
        [5.01, 2.4, 55, 0.7],
        [5.06, 2.4, 43, 0.65],
      ],
      1.5,
    ),
  },
  {
    n: 94,
    id: 'subtone-and-slap-g',
    name: 'Subtone and slap {G}',
    kind: 'melodic',
    description:
      'A breathy subtone reed plays {G}, {B}, {A} and falls to a low {D}, one dark slap behind each; it rings out.',
    preset: 'orbit-steel-subtone-and-slap',
    set: { attack: 0.02, blow: 0.35 },
    ...played(
      8,
      [
        [0, 1.2, 55, 0.7],
        [1.63, 0.9, 59, 0.65],
        [2.84, 1.6, 57, 0.7],
        [5.02, 1.8, 50, 0.65],
      ],
      1,
    ),
  },
  {
    n: 95,
    id: 'operator-tines-round-c',
    name: 'Operator tines round {C}',
    kind: 'melodic',
    description:
      'A soft four-operator piano opens {C} major seventh and falls back, grains climbing behind; it comes round.',
    preset: 'orbit-steel-operator-tines',
    ...cycled(8, [
      [0, 1.5, 60, 0.7],
      [0.61, 1.3, 64, 0.6],
      [1.37, 1.4, 67, 0.6],
      [2.52, 1.9, 71, 0.65],
      [4.49, 1.4, 69, 0.6],
      [5.66, 1.8, 64, 0.6],
    ]),
  },
  {
    n: 96,
    id: 'cave-tongue-round-dm',
    name: 'Cave tongue round {D}m',
    kind: 'melodic',
    description:
      'Soft hands circle a steel tongue drum on {D} minor in a dark cavern, never on a pulse; it comes round.',
    preset: 'orbit-steel-cave-tongue-drum',
    ...cycled(
      8,
      [
        [0, 1.5, 50, 0.7],
        [1.07, 1, 57, 0.55],
        [2.21, 1.2, 60, 0.6],
        [3.64, 1.4, 53, 0.6],
        [5.12, 1.1, 57, 0.55],
        [6.03, 1.2, 55, 0.5],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 97,
    id: 'motor-vibes-phrase-f',
    name: 'Motor vibes phrase {F}',
    kind: 'melodic',
    description:
      'Vibraphone bars open {F} major seventh one at a time and settle on the {F} above, the motor throbbing; it rings out.',
    preset: 'orbit-steel-motor-vibes-slow',
    set: { motor: 0.4, mallet: 0.65 },
    then: [NARROW],
    ...played(
      10,
      [
        [0, 2.2, 65, 0.7],
        [0.81, 2, 72, 0.6],
        [1.74, 2.1, 76, 0.6],
        [3.07, 2.8, 81, 0.65],
        [5.02, 2.6, 77, 0.6],
      ],
      3,
    ),
  },
  {
    n: 98,
    id: 'wooden-plucks-round-g',
    name: 'Wooden plucks round {G}',
    kind: 'melodic',
    description:
      'Woody folded plucks wander round {G} major through a slap echo and a spring tank; it comes round.',
    preset: 'orbit-steel-wooden-pluck-slapped',
    ...cycled(8, [
      [0, 0.8, 55, 0.7],
      [0.67, 0.7, 62, 0.6],
      [1.58, 0.9, 59, 0.6],
      [2.31, 1.1, 67, 0.65],
      [4.02, 0.8, 57, 0.6],
      [4.73, 0.8, 62, 0.6],
      [5.89, 1.2, 55, 0.65],
    ]),
  },
  {
    n: 99,
    id: 'paired-strings-round-d',
    name: 'Paired strings round {D}',
    kind: 'melodic',
    description:
      'Paired strings an octave apart strummed slowly on {D}, {A}, {F} and {C} in a cathedral; it comes round.',
    preset: 'orbit-steel-paired-strings-far',
    ...cycled(12, [
      [0, 4.5, 50, 0.7],
      [2.87, 4, 57, 0.65],
      [5.63, 4.5, 53, 0.7],
      [8.71, 3, 60, 0.65],
    ]),
  },
  {
    n: 100,
    id: 'dark-tine-walk-g',
    name: 'Dark tine walk {G}',
    kind: 'melodic',
    description:
      'Dark, round tines walk up from a low {G} to the octave, a soft slap behind each note; it rings out.',
    preset: 'orbit-steel-dark-tine-slap',
    ...played(
      7,
      [
        [0, 1.1, 43, 0.7],
        [0.93, 1, 47, 0.65],
        [1.81, 1.1, 50, 0.65],
        [2.94, 1.4, 52, 0.7],
        [4.03, 2.2, 55, 0.7],
      ],
      0.8,
    ),
  },
])
