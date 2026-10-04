// The sounds of the pack "Austin Slow Brass": its presets played, a hundred sounds to
// paint with. Numbers 3001 to 3100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/slow-brass'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

// A fast hand on the fader after the hall: it holds a held note level.
const HOLD: PatchDevice = {
  deviceId: 'ambient-comp',
  params: { threshold: -60, ratio: 8, attack: 20, release: 0.15, knee: 6, tails: 1, makeup: 24 },
}

// A wall after it for the drones: what the fader leaves, a beat between two notes in one key
// and not the next, is held to one level.
const LEVEL: PatchDevice = {
  deviceId: 'ambient-limiter',
  params: { ceiling: -12, gain: 24, release: 0.3, ride: 0 },
}

// Brings a wide hall in: a sound with as much side as middle thins out in mono.
const NARROW: PatchDevice = { deviceId: 'stereo-widener', preset: 'Narrow' }

// Narrower still, for a plate or a half-speed copy that comes out of phase on a low note.
const TIGHT: PatchDevice = { deviceId: 'stereo-widener', params: { width: 0.2 } }

// One slow rise and fall to an eight-second loop: it comes round with the loop.
const SWAY = breathe(1 / 8, 0.45)

export const SOUNDS: readonly FactorySound[] = packSounds('slow-brass', 3000, PRESETS, [
  // Drones: one note, or a note and its fifth, held with the entry long over. One player to
  // a note and nothing beating: a section, a detuned copy or a hall that moves reads as a pad.
  {
    n: 1,
    id: 'hall-door-horns-c',
    name: 'Hall door horns {C}',
    kind: 'drone',
    description:
      'Two horns on {C} and {G}, one player each, the top rolled off, held in a cathedral.',
    preset: 'slow-brass-hall-door-horns',
    set: { section: 0 },
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 7, 3, [48, 55]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'low-fifth-brass-a',
    name: 'Low fifth brass {A}',
    kind: 'drone',
    description:
      'Low brass on {A} and {E}, one player each, its half-speed shadow an octave under.',
    preset: 'slow-brass-low-fifth-brass',
    set: { section: 0 },
    // The preset's chain made still and brought in: the shadow cut in two-second lengths, the
    // space hardly moving and less wide, since it comes out of phase on a low note in some keys.
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Under the mix',
        params: { length: 2000, jitter: 0, mix: 0.3 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, modDepth: 0.1, width: 0.4, mix: 0.4 },
      },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [45, 52]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'two-cellos-a',
    name: 'Two cellos {A}',
    kind: 'drone',
    description:
      'Two cellos on a low {A} and {E}, a player each, nearly still in a long stone room.',
    preset: 'slow-brass-two-cellos',
    set: { players: 1, vibrato: 0 },
    then: [NARROW, HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [45, 52]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'bass-clarinet-fifth-d',
    name: 'Bass clarinet fifth {D}',
    kind: 'drone',
    description:
      'A bass clarinet on {D} and {A}, woody and held level, on tape in a very large space.',
    preset: 'slow-brass-bass-clarinet-fifth',
    // The space as the preset has it but nearly still and less wide: at its own depth the level
    // moves by 3 dB, and at its own width the low notes come out of phase in one key.
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, bump: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, lowCut: 40, modDepth: 0.1, width: 0.3, mix: 0.4 },
      },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [50, 57, [62, 0.4]]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'string-and-magnet-e',
    name: 'String and magnet {E}',
    kind: 'drone',
    description:
      'Guitar strings on {E} and {B} held singing by a magnet, no pick, in a very long hall.',
    preset: 'slow-brass-string-and-magnet',
    // Without the doubling a few cents apart, which beats twice a second.
    set: { detune: 0 },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 16, damping: 0.5, size: 1.6, breathDepth: 0, mix: 0.5 },
      },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [40, 52, 59]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'sine-and-octave-b',
    name: 'Sine and octave {B}',
    kind: 'drone',
    description: 'Near sines on {B} in three octaves over a sub, nothing moving, on noisy tape.',
    preset: 'slow-brass-sine-and-octave',
    set: { detune: 0 },
    // The preset's tape without its wow and flutter, which move the level in two keys.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35, wow: 0, flutter: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [47, [59, 0.6], [71, 0.4]]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'one-major-chord-f',
    name: 'One major chord {F}',
    kind: 'drone',
    description: 'A just major chord of partials over {F} and its sub octave, held in a cathedral.',
    preset: 'slow-brass-one-major-chord',
    set: { movement: 0.15 },
    then: [HOLD],
    ...looped(8, 7, 3, [53]),
  },
  {
    n: 8,
    id: 'glass-fifth-still-d',
    name: 'Glass fifth, still {D}',
    kind: 'drone',
    description:
      'A dim glass tone of four operators on {D} in three octaves and {A}, nothing beating, on tape in a cathedral.',
    preset: 'slow-brass-glass-pad-slow',
    // The pairs tuned together: apart, the two sides beat against each other.
    set: { detune: 0 },
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [38, 50, 57, 62]),
    tuning: 'whole-cycles',
  },
  {
    n: 9,
    id: 'worn-open-fifths-c',
    name: 'Worn open fifths {C}',
    kind: 'drone',
    description:
      'Open fifths over a low {C} behind a filter at 800 Hz, on worn tape in a large space.',
    preset: 'slow-brass-open-fifths-worn',
    // Nearly still, the tape's wow and the space's drift turned down: at the preset's own
    // the level wanders more than a drone's may in half the keys.
    set: { movement: 0.05 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.1, age: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { modDepth: 0.1, mix: 0.4 } },
    ],
    then: [NARROW, HOLD, quarterTurn(8)],
    ...looped(8, 7, 3, [48]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'harmonium-dark-well-f',
    name: 'Harmonium, dark well {F}',
    kind: 'drone',
    description:
      'A harmonium on {F} and {C}, its bellows held steady, in a dark well of short echoes.',
    preset: 'slow-brass-harmonium-dark-well',
    // One reed to a note and a well that does not move: the second reed and the well's own
    // drift both beat.
    set: { bellows: 0, celeste: 0 },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { modulation: 0, mix: 0.4 } },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 3, [53, 60]),
    tuning: 'whole-cycles',
  },
  {
    n: 11,
    id: 'muted-strings-still-g',
    name: 'Muted strings, still {G}',
    kind: 'drone',
    description:
      'Three muted strings on {G}, {D} and a soft {G} above, no vibrato, printed to tape, left in a cathedral.',
    preset: 'slow-brass-muted-section-slow',
    // Each player on the pitch and a short fold: these strings do not come round to the
    // cycle in every key. The third string keeps two steady notes from being too loud.
    set: { players: 1, scatter: 0 },
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 6, 1.5, [55, 62, [67, 0.4]]),
    tuning: 'whole-cycles',
  },
  {
    n: 12,
    id: 'far-end-pipes-a',
    name: 'Far end pipes {A}',
    kind: 'drone',
    description: 'Dulled organ pipes on {A} and {E} with the wind held steady, in a huge space.',
    preset: 'slow-brass-far-end-pipes',
    // One rank to a note and a still space: the second rank and the doubling both beat.
    set: { celeste: 0, bellows: 0 },
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 18, modDepth: 0.1, width: 0.5, mix: 0.5 },
      },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 7, 3, [57, 64]),
    tuning: 'whole-cycles',
  },
  {
    n: 13,
    id: 'low-cello-reel-e',
    name: 'Low cello reel {E}',
    kind: 'drone',
    description: 'A cello to a note on half-speed tape, a low {E} and {B} with the top taken off.',
    preset: 'slow-brass-low-cello-reel',
    set: { players: 0, vibrato: 0, age: 0.1 },
    // The last filter only takes out what lies under 25 Hz: the reel leaves an offset in one key.
    then: [HOLD, LEVEL, { deviceId: 'ambient-eq', params: { lowCut: 25, clear: 0 } }],
    ...looped(8, 6, 3, [52, 59]),
  },
  {
    n: 14,
    id: 'organ-standing-still-g',
    name: 'Organ standing still {G}',
    kind: 'drone',
    description:
      'Sub and unison organ ranks on {G} and {D} with a trace of octave, one unmoving tone in a hall.',
    preset: 'slow-brass-organ-standing-still',
    // One rank to a note and no blur: the blur is heard, and measured, as notes struck.
    set: { celeste: 0 },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 6, midDecay: 5, mix: 0.4 } },
    ],
    then: [HOLD, quarterTurn(8)],
    ...looped(8, 7, 3, [43, 50]),
    tuning: 'whole-cycles',
  },
  // Pads that go round: a chord held with the entry long over, most of them rising and
  // falling once a loop so the level is never still.
  {
    n: 15,
    id: 'halo-held-open-e',
    name: 'Halo held open {E}',
    kind: 'pad',
    description:
      'Still strings on {E}, {B}, {D} and {G} that a sustainer holds on, rising and falling slowly.',
    preset: 'slow-brass-halo-held-open',
    then: [SWAY],
    ...looped(8, 6, 3, [64, 71, 74, 79]),
  },
  {
    n: 16,
    id: 'hollow-reeds-held-a',
    name: 'Hollow reeds held {A}',
    kind: 'pad',
    description:
      'A hollow clarinet chord on {A}, {C} and {E} with a dark sustained copy beneath it.',
    preset: 'slow-brass-hollow-reeds-held',
    then: [TIGHT],
    ...looped(8, 6, 3, [57, 60, 64]),
  },
  {
    n: 17,
    id: 'flutes-far-strings-f',
    name: 'Flutes, far strings {F}',
    kind: 'pad',
    description:
      'Stopped organ flutes on {F}, {C} and {A} with a string pad swelling in behind them.',
    preset: 'slow-brass-flutes-far-strings',
    then: [TIGHT, SWAY],
    ...looped(8, 6, 3, [53, 60, 65, 69]),
  },
  {
    n: 18,
    id: 'synth-horns-asleep-e',
    name: 'Synth horns asleep {E}',
    kind: 'pad',
    description:
      'Soft synthesiser horns on {E}, {B}, {D} and {G}, drifting on a slow chorus in a wide space.',
    preset: 'slow-brass-synth-horns-asleep',
    // The preset's chain with the chorus once round in a loop, so its drift comes round.
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } },
    ],
    then: [SWAY],
    ...looped(8, 6, 3, [52, 59, 62, 67]),
  },
  {
    n: 19,
    id: 'pad-octave-under-d',
    name: 'Pad, octave under {D}',
    kind: 'pad',
    description:
      'A soft chorus pad on {D} and {A} in two octaves with its half-speed copy an octave beneath.',
    preset: 'slow-brass-pad-octave-under',
    // The preset's chain with the copy cut in two-second lengths and a hall that does not
    // breathe, so both come round with the loop.
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Under the mix',
        params: { length: 2000, jitter: 0, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 14, breathDepth: 0, mix: 0.45 } },
    ],
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [50, 57, 62, 69]),
  },
  {
    n: 20,
    id: 'lights-off-pad-g',
    name: 'Lights off pad {G}',
    kind: 'pad',
    description:
      'Detuned saws on {G}, {D} and {B} behind a filter at 800 Hz, on tape in a cathedral.',
    preset: 'slow-brass-lights-off-pad',
    then: [SWAY],
    ...looped(8, 7, 3, [43, 50, 59, 62]),
  },
  {
    n: 21,
    id: 'tines-breathing-f',
    name: 'Tines, breathing {F}',
    kind: 'pad',
    description:
      'A soft tine chord on {F}, {A}, {C} and {E} held by a sustainer, rising and falling like breath.',
    preset: 'slow-brass-tines-breathing',
    // The preset's chain with the breath twice a loop, in step on both sides, so it comes round.
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 2.5, mix: 1 } },
      {
        deviceId: 'tremolo',
        preset: 'Sea swell',
        params: { rate: 0.25, depth: 0.5, shape: 0, phase: 0, drift: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    then: [NARROW],
    ...looped(8, 6, 3, [53, 57, 60, 64]),
  },
  {
    n: 22,
    id: 'strum-plate-pad-d',
    name: 'Strum plate pad {D}',
    kind: 'pad',
    description:
      'The pad layer of a chord harp on {D}, {F}, {A} and {C}, its plucks faded out, in a plain hall.',
    preset: 'slow-brass-strum-plate-pad',
    then: [SWAY],
    ...looped(8, 6, 3, [62, 65, 69, 72]),
  },
  {
    n: 23,
    id: 'low-flutes-held-b',
    name: 'Low flutes, held {B}',
    kind: 'pad',
    description:
      'Low flutes on {B} in two octaves, no chiff, doubled a few cents apart, in a cathedral.',
    preset: 'slow-brass-low-flutes-held',
    then: [NARROW, SWAY, quarterTurn(8)],
    ...looped(8, 6, 3, [
      [59, 0.75],
      [71, 0.75],
    ]),
    tuning: 'whole-cycles',
  },
  {
    n: 24,
    id: 'two-strings-drifting-g',
    name: 'Two strings drifting {G}',
    kind: 'pad',
    description:
      'One bowed {G} as two strings tuned a little apart so they beat, phasing slowly, in a plain hall.',
    preset: 'slow-brass-two-strings-drifting',
    // Tuned closer than the preset has them, so the beat is a slow swell and not a pulse; the
    // phasing twice a loop so it comes round, and it and the hall less wide.
    set: { detune: 5 },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.25, lfoDepth: 0, width: 0.2, mix: 0.4 },
      },
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 12, tone: 4000, width: 0.6, mix: 0.45 },
      },
    ],
    then: [NARROW],
    ...looped(8, 6, 3, [55]),
  },
  {
    n: 25,
    id: 'ensemble-cellos-low-f',
    name: 'Ensemble cellos, low {F}',
    kind: 'pad',
    description:
      'The low octave of a string ensemble on {F} in two octaves, dull and thick, on worn tape.',
    preset: 'slow-brass-ensemble-cellos-low',
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [41, 53]),
  },
  {
    n: 26,
    id: 'warm-tape-sub-d',
    name: 'Warm tape sub {D}',
    kind: 'pad',
    description:
      'A saw and a pulse an octave apart on a low {D}, the filter nearly shut, into a tape preamp.',
    preset: 'slow-brass-warm-tape-sub',
    then: [breathe(1 / 8, 0.6)],
    ...looped(8, 6, 3, [50]),
  },
  {
    n: 27,
    id: 'slowed-horn-reel-g',
    name: 'Slowed horn reel {G}',
    kind: 'pad',
    description:
      'Horns on half-speed tape on {G}, {D} and {B}, an octave down, rising and falling in a cathedral.',
    preset: 'slow-brass-slowed-horn-reel',
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [55, 62, 71]),
  },
  {
    n: 28,
    id: 'clarinets-no-entry-g',
    name: 'Clarinets, no entry {G}',
    kind: 'pad',
    description:
      'Clarinets on {G}, {D}, {E} and {A} with no entry to hear, rising and falling in a very large space.',
    preset: 'slow-brass-clarinets-no-entry',
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [55, 62, 64, 69]),
  },
  {
    n: 29,
    id: 'reeds-octave-under-c',
    name: 'Reeds, octave under {C}',
    kind: 'pad',
    description:
      'Clarinets on {C}, {G} and {E} on tape, a half-speed copy an octave beneath, in a breathing hall.',
    // The hall as the preset has it, breathing twice a loop so it comes round.
    preset: 'slow-brass-reeds-octave-under',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.45 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 14, breathRate: 0.25, mix: 0.5 },
      },
    ],
    then: [SWAY],
    ...looped(8, 6, 3, [48, 55, 64]),
  },
  {
    n: 30,
    id: 'two-ranks-beating-d',
    name: 'Two ranks beating {D}',
    kind: 'pad',
    description:
      'Two organ ranks on {D} and {A} tuned apart so they beat, through a rotating speaker.',
    preset: 'slow-brass-two-ranks-beating',
    set: { celeste: 0.4 },
    then: [SWAY],
    ...looped(8, 6, 3, [50, 57]),
  },
  {
    n: 31,
    id: 'pump-organ-reel-c',
    name: 'Pump organ reel {C}',
    kind: 'pad',
    description:
      'A reedy pump organ on {C}, {E} and {G}, breathing on its bellows, on a worn reel of tape.',
    preset: 'slow-brass-pump-organ-reel',
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [48, 60, 64, 67]),
  },
  {
    n: 32,
    id: 'amp-hum-guitar-a',
    name: 'Amp hum guitar {A}',
    kind: 'pad',
    description:
      'A swelled guitar fifth on {A} and {E} held by a sustainer over the hum of an amplifier.',
    preset: 'slow-brass-amp-hum-guitar',
    then: [NARROW],
    ...looped(8, 7, 3, [45, 52]),
  },
  {
    n: 33,
    id: 'far-small-voices-c',
    name: 'Far small voices {C}',
    kind: 'pad',
    description:
      "A children's choir on ooh, {C}, {E} and {G}, no vibrato, the top rolled off, in a cathedral.",
    // Without the blur, which the ear and the measure both hear as notes struck.
    preset: 'slow-brass-far-small-voices',
    set: { ensemble: 0 },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.55 },
      },
    ],
    then: [breathe(1 / 8, 0.6)],
    ...looped(8, 6, 3, [60, 64, 67, 72]),
  },
  {
    n: 34,
    id: 'low-wordless-voices-f',
    name: 'Low wordless voices {F}',
    kind: 'pad',
    description:
      'Low men on a closed vowel on {F} and {C}, no vibrato, rising and falling in a stone room.',
    preset: 'slow-brass-low-wordless-voices',
    set: { ensemble: 0 },
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [53, 60]),
  },
  {
    n: 35,
    id: 'hollow-wave-drifting-e',
    name: 'Hollow wave, drifting {E}',
    kind: 'pad',
    description:
      'A hollow wavetable chord on {E}, {B} and {G} moving slowly through its table, filter at 1 kHz.',
    preset: 'slow-brass-hollow-wave-drifting',
    // Once through its table and back in a loop, so it comes round.
    set: { spread: 0.5, rate: 0.125 },
    then: [SWAY],
    ...looped(8, 7, 3, [52, 59, 64, 67]),
  },
  {
    n: 36,
    id: 'no-bow-changes-f',
    name: 'No bow changes {F}',
    kind: 'pad',
    description:
      'A muted section on {F}, {C} and {A}, no vibrato, in a hall whose tail sings like a far choir.',
    preset: 'slow-brass-no-bow-changes',
    then: [SWAY],
    ...looped(8, 6, 3, [53, 60, 69]),
  },
  {
    n: 37,
    id: 'rubbed-bowl-rising-a',
    name: 'Rubbed bowl, rising {A}',
    kind: 'pad',
    description:
      'A singing bowl rubbed, not struck, on {A} and {E}, ringing on in a space twenty seconds long.',
    preset: 'slow-brass-rubbed-bowl-rising',
    then: [NARROW],
    ...looped(8, 8, 3, [57, 64]),
  },
  // Pads that arrive and leave: a chord swelled in, held and let go; those that are played
  // round again come back as their own tail is still going.
  {
    n: 38,
    id: 'horn-section-arriving-f',
    name: 'Horn section arriving {F}',
    kind: 'pad',
    description:
      'A horn section on {F}, {C}, {A} and {E} that takes four seconds to arrive, leaving by a cathedral.',
    preset: 'slow-brass-hall-door-horns',
    set: { release: 3 },
    ...played(
      14,
      [
        [0, 6, 41],
        [0, 6, 48],
        [0, 6, 57],
        [0, 6, 64],
      ],
      3,
    ),
  },
  {
    n: 39,
    id: 'section-octave-under-g',
    name: 'Section, octave under {G}',
    kind: 'pad',
    description:
      'Six players a note on {G}, {D} and {B}, their half-speed copy an octave below, in a cathedral.',
    preset: 'slow-brass-section-octave-under',
    set: { release: 2.5 },
    then: [NARROW],
    ...played(
      14,
      [
        [0, 6, 55],
        [0, 6, 62],
        [0, 6, 71],
      ],
      3,
    ),
  },
  {
    n: 40,
    id: 'string-reel-rising-e',
    name: 'String reel rising {E}',
    kind: 'pad',
    description:
      'A small violin section on tape, {E}, {G} and {B}, slow to arrive, in a reverb that swells late.',
    preset: 'slow-brass-string-reel-rising',
    set: { release: 3, age: 0.3 },
    then: [NARROW],
    ...played(
      14,
      [
        [0, 6, 64],
        [0, 6, 67],
        [0, 6, 71],
      ],
      3,
    ),
  },
  {
    n: 41,
    id: 'four-second-brass-d',
    name: 'Four-second brass {D}',
    kind: 'pad',
    description:
      'A dark synthesiser brass chord on {D}, {A} and {E} that takes four seconds to open, in a cathedral.',
    preset: 'slow-brass-four-second-brass',
    set: { release: 4 },
    then: [soften(4)],
    ...played(
      14,
      [
        [0, 6.5, 38],
        [0, 6.5, 50],
        [0, 6.5, 57],
        [0, 6.5, 64],
      ],
      3,
    ),
  },
  {
    n: 42,
    id: 'sweep-heard-backwards-a',
    name: 'Sweep heard backwards {A}',
    kind: 'pad',
    description:
      'A sweep of plucked strings on {A}, {C}, {E} and {G} heard only backwards, in a long plate.',
    preset: 'slow-brass-sweep-heard-backwards',
    // A little less of the plate, and narrowed: it comes out of phase in some keys.
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1100, feedback: 0.2, mix: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    then: [NARROW],
    ...played(
      12,
      [
        [0, 3, 57],
        [0, 3, 60],
        [0, 3, 64],
        [0, 3, 67],
      ],
      3,
    ),
    // Without the second of nothing before the first string is given back.
    skipSec: 1,
  },
  {
    n: 43,
    id: 'strum-dissolved-e',
    name: 'Strum dissolved {E}',
    kind: 'pad',
    description:
      'A slow strum of {E} minor with its attack removed, replayed as a cloud of long grains.',
    preset: 'slow-brass-strum-dissolved',
    // A little less of the plate, and narrowed: it comes out of phase in one key.
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { ratio: 1, makeup: 15 } },
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { scatter: 0, mix: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [NARROW],
    ...played(
      14,
      [
        [0, 6, 52],
        [0, 6, 59],
        [0, 6, 64],
        [0, 6, 67],
        [0, 6, 71],
      ],
      3,
    ),
  },
  {
    n: 44,
    id: 'baritone-no-pick-d',
    name: 'Baritone, no pick {D}',
    kind: 'pad',
    description:
      'Low guitar strings on {D} and {A} swelled in with no pick heard, thickened by a tape preamp.',
    preset: 'slow-brass-baritone-no-pick',
    then: [NARROW],
    ...played(
      12,
      [
        [0, 6, 38],
        [0, 6, 45],
        [0, 6, 50],
      ],
      3,
    ),
  },
  {
    n: 45,
    id: 'late-filter-a',
    name: 'Late filter {A}',
    kind: 'pad',
    description:
      'A chorus polysynth chord of fifths on {A}, {E} and {B} that starts shut and takes four seconds to open.',
    preset: 'slow-brass-late-filter',
    set: { release: 4 },
    then: [NARROW],
    ...played(
      14,
      [
        [0, 6, 57],
        [0, 6, 64],
        [0, 6, 71],
        [0, 6, 76],
      ],
      3,
    ),
  },
  {
    n: 46,
    id: 'fold-opening-slowly-g',
    name: 'Fold opening slowly {G}',
    kind: 'pad',
    description:
      'A wavefolded chord on {G}, {D} and {B} whose timbre opens over four seconds, on tape.',
    preset: 'slow-brass-fold-opening-slowly',
    then: [NARROW],
    ...played(
      14,
      [
        [0, 6, 43],
        [0, 6, 55],
        [0, 6, 62],
        [0, 6, 71],
      ],
      3,
    ),
  },
  {
    n: 47,
    id: 'horn-fifth-above-f',
    name: 'Horn, fifth above {F}',
    kind: 'pad',
    description:
      'One horn {F} shadowed a fifth above, both held on by a sustainer into a long plate.',
    preset: 'slow-brass-horn-fifth-above',
    // Less of the plate, and narrowed: on a low note it comes out of phase in three keys.
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [TIGHT],
    ...cycled(12, [[0, 5, 53]]),
    loopFold: 'power',
  },
  {
    n: 48,
    id: 'harp-under-a-pad-d',
    name: 'Harp under a pad {D}',
    kind: 'pad',
    description:
      'A harp chord of {D} minor heard only as the string pad that follows it, with no pluck left.',
    preset: 'slow-brass-harp-under-a-pad',
    then: [NARROW],
    ...cycled(
      8,
      [
        [0, 3, 50],
        [0, 3, 57],
        [0, 3, 62],
        [0, 3, 65],
        [0, 3, 69],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 49,
    id: 'trumpets-past-a-wall-c',
    name: 'Trumpets past a wall {C}',
    kind: 'pad',
    description:
      'Soft trumpets on {C}, {G} and {D} behind a low-pass wall, a string pad rising in their shadow.',
    preset: 'slow-brass-trumpets-through-a-wall',
    ...cycled(
      8,
      [
        [0, 4, 60],
        [0, 4, 67],
        [0, 4, 74],
      ],
      { passes: 2, crossfadeSec: 1.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 50,
    id: 'slow-loop-horn-g',
    name: 'Slow loop horn {G}',
    kind: 'pad',
    description:
      'One horn {G} fading in, caught on a three-second tape loop that wears as it comes round.',
    preset: 'slow-brass-slow-loop-horn',
    then: [breathe(1 / 6, 0.6)],
    ...cycled(6, [[0, 2.5, 55]], { passes: 3 }),
  },
  {
    n: 51,
    id: 'piano-into-string-pad-a',
    name: 'Piano into string pad {A}',
    kind: 'pad',
    description:
      'Felted piano on {A} minor with the hammers faded out and a string pad growing where they were.',
    preset: 'slow-brass-piano-into-string-pad',
    then: [NARROW],
    ...played(
      12,
      [
        [0, 5, 45],
        [0, 5, 52],
        [0, 5, 57],
        [0, 5, 60],
        [0, 5, 64],
      ],
      3,
    ),
  },
  {
    n: 52,
    id: 'short-flute-reel-c',
    name: 'Short flute reel {C}',
    kind: 'pad',
    description:
      'A ruined flute tape at half speed on {C} and {G} that runs out, a sustainer keeping a quiet copy.',
    preset: 'slow-brass-short-flute-reel',
    then: [NARROW],
    ...played(
      10,
      [
        [0, 4, 60],
        [0, 4, 67],
      ],
      3,
    ),
  },
  {
    n: 53,
    id: 'faded-pedal-tone-c',
    name: 'Faded pedal tone {C}',
    kind: 'pad',
    description:
      'Two beating oscillators and a sub on a low {C} behind a filter at 260 Hz, in a cathedral.',
    preset: 'slow-brass-faded-pedal-tone',
    then: [breathe(1 / 8, 0.6)],
    ...looped(8, 6, 3, [48]),
  },
  {
    n: 54,
    id: 'folded-tone-held-g',
    name: 'Folded tone, held {G}',
    kind: 'pad',
    description:
      'A sine folded gently over on itself on {G} and {D}, doubled a few cents apart, in a cathedral.',
    preset: 'slow-brass-folded-tone-held',
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [43, 50]),
  },
  {
    n: 55,
    id: 'flugelhorn-next-room-c',
    name: 'Flugelhorn, next room {C}',
    kind: 'pad',
    description:
      'One flugelhorn on {C}, half breath, two seconds in coming, heard through its own room and a hall.',
    preset: 'slow-brass-flugelhorn-next-room',
    then: [NARROW],
    ...played(10, [[0, 4, 60]], 3),
  },
  {
    n: 56,
    id: 'half-speed-bow-a',
    name: 'Half speed bow {A}',
    kind: 'pad',
    description:
      'A bowed fifth on {A} and {E} replayed at half speed, an octave down, into a cathedral.',
    preset: 'slow-brass-half-speed-bow',
    // A hall where the preset has a plate: under these low notes the plate comes out of
    // phase in one key, and nothing after it narrows that.
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { highCut: 4000, spread: 0.15, mix: 0.85 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [NARROW, SWAY],
    ...looped(8, 6, 3, [57, 64]),
  },
  // Textures: weather, air and room tone, nothing with a note to follow.
  {
    n: 57,
    id: 'hall-roof-rain-heavy',
    name: 'Hall roof rain',
    kind: 'texture',
    description:
      'Heavy rain heard from inside, the top taken off, with a six-second hall around it.',
    preset: 'slow-brass-hall-roof-rain',

    ...looped(8, 5, 3, [55]),
  },
  {
    n: 58,
    id: 'crickets-both-ways',
    name: 'Crickets, both ways',
    kind: 'texture',
    description:
      'A field of crickets an octave down, looped forwards then backwards and blurred until the turns are gone.',
    preset: 'slow-brass-any-sample-both-ways',
    source: 'field-of-crickets',
    then: [NARROW],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 59,
    id: 'thunder-far-hills-rolling',
    name: 'Thunder, far hills',
    kind: 'texture',
    description: 'Thunder a long way off with its top taken away, one long roll dying into a hall.',
    preset: 'slow-brass-thunder-far-hills',

    ...looped(12, 0, 1.5, [38, 45]),
  },
  {
    n: 60,
    id: 'low-noise-bands-drifting',
    name: 'Low noise bands',
    kind: 'texture',
    description: 'Wide bands of noise around a low fifth, drifting, more wind than pitch, on tape.',
    preset: 'slow-brass-low-noise-bands',

    ...looped(8, 6, 3, [41, 48]),
  },
  {
    n: 61,
    id: 'bows-all-air',
    name: 'Bows, all air',
    kind: 'texture',
    description:
      'Bows drawn so lightly that only their air is heard, smeared by a spectral blur in a long plate.',
    preset: 'slow-brass-airy-bows-blurred',
    set: { air: 1, bow: 0 },
    then: [NARROW],
    ...looped(8, 6, 3, [57, 64]),
  },
  {
    n: 62,
    id: 'wind-in-the-cathedral',
    name: 'Wind in the cathedral',
    kind: 'texture',
    description:
      'Wind over a hill, gusting slowly and narrowed a little, heard inside a cathedral.',
    instrument: { deviceId: 'atmosphere', preset: 'Hill wind', params: { attack: 3, width: 0.6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
    ...looped(8, 5, 3, [50]),
  },
  {
    n: 63,
    id: 'far-water',
    name: 'Far water',
    kind: 'texture',
    description: 'Fast water a long way off with the top taken away, in a cathedral.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { distance: 0.8, tone: 0.3, attack: 3, width: 0.7 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    ...looped(8, 5, 3, [45]),
  },
  {
    n: 64,
    id: 'empty-hall-hum-and-room',
    name: 'Empty hall hum',
    kind: 'texture',
    description:
      'Mains hum tuned to the key, low under the rumble of an empty room, in a cathedral.',
    preset: 'slow-brass-empty-hall-hum',
    set: { volume: -20 },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -30, width: 0.7 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    ...looped(8, 6, 3, [43]),
  },
  {
    n: 65,
    id: 'held-wind',
    name: 'Held wind',
    kind: 'texture',
    description:
      'A hill wind frozen at one moment and replayed as a dark cloud of long grains, in a cathedral.',
    preset: 'slow-brass-any-sound-held',
    source: 'hill-wind',
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 66,
    id: 'rain-heard-backwards',
    name: 'Rain heard backwards',
    kind: 'texture',
    description:
      'Rain on a window replayed as long backward grains with the top taken off, on tape.',
    preset: 'slow-brass-any-sound-reversed',
    source: 'rain-on-the-window',
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 67,
    id: 'fireside-on-worn-tape',
    name: 'Fireside on worn tape',
    kind: 'texture',
    description: 'A fire close by, crackling on worn cassette with its hiss and wobble left in.',
    instrument: { deviceId: 'atmosphere', preset: 'Hearth', params: { attack: 2, width: 0.6 } },
    effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
    ...looped(8, 5, 3, [48]),
  },
  {
    n: 68,
    id: 'window-rain-long-plate',
    name: 'Window rain, long plate',
    kind: 'texture',
    description:
      'Rain against a window with the top taken off, each drop rounded, in a long plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { attack: 3, width: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      soften(18),
    ],
    ...looped(8, 5, 3, [60]),
  },
  // One-shots: the same instruments with the entry left in, one note or chord and its hall.
  {
    n: 69,
    id: 'four-track-guitar-e',
    name: 'Four-track guitar {E}',
    kind: 'oneshot',
    description:
      'One guitar note on {E} through a dark amp spring onto worn cassette, in a long room.',
    preset: 'slow-brass-four-track-guitar',
    set: { swell: 0, hardness: 0.8, sustain: 6 },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.15 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: 3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.2 } },
    ],
    then: [NARROW, soften(4)],
    ...played(8, [[0, 4, 52]], 2),
  },
  {
    n: 70,
    id: 'nylon-string-plucked-a',
    name: 'Nylon string, plucked {A}',
    kind: 'oneshot',
    description: 'One plucked nylon string on {A}, warmed, ringing into a five-second hall.',
    preset: 'slow-brass-nylon-no-fingers',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 5, size: 1.5, breathDepth: 0, mix: 0.5 },
      },
    ],
    ...played(6, [[0, 3, 57]], 2),
  },
  {
    n: 71,
    id: 'twelve-strings-once-g',
    name: 'Twelve strings, once {G}',
    kind: 'oneshot',
    description: 'A twelve-string chord of {G} major sounded once, on tape, in a short open space.',
    preset: 'slow-brass-twelve-strings-late',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 5, mix: 0.4 } },
    ],
    ...played(
      8,
      [
        [0, 5, 43],
        [0, 5, 50],
        [0, 5, 55],
        [0, 5, 59],
        [0, 5, 62],
        [0, 5, 67],
      ],
      2,
    ),
  },
  {
    n: 72,
    id: 'marimba-bar-struck-c',
    name: 'Marimba bar, struck {C}',
    kind: 'oneshot',
    description:
      'One soft marimba stroke on {C} with its half-speed shadow an octave under, in a hall.',
    preset: 'slow-brass-marimba-bar-rolled',
    set: { roll: 0 },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { spread: 0, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    ...played(5, [[0, 2.5, 48]], 2),
  },
  {
    n: 73,
    id: 'vibraphone-bar-b',
    name: 'Vibraphone bar {B}',
    kind: 'oneshot',
    description:
      'One soft vibraphone stroke on {B} in two octaves, the motor barely turning, in a cathedral.',
    preset: 'slow-brass-rolled-vibes-blurred',
    set: { roll: 0 },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.4 },
      },
    ],
    ...played(
      8,
      [
        [0, 4, 71],
        [0, 4, 59, 0.5],
      ],
      2,
    ),
  },
  {
    n: 74,
    id: 'bowl-struck-d',
    name: 'Bowl, struck {D}',
    kind: 'oneshot',
    description:
      'A low metal bowl on {D} with its strike left in, beating slowly as it rings out in a hall.',
    preset: 'slow-brass-bowl-no-strike',
    // A shorter ring, its pairs tuned closer, and a plain hall: the strike stays the loudest
    // moment in every key.
    set: { attack: 0.005, decay: 7, detune: 2 },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 6, midDecay: 6, mix: 0.35 } },
    ],
    ...played(10, [[0, 5, 50]], 3),
  },
  {
    n: 75,
    id: 'steel-pan-one-note-f',
    name: 'Steel pan, one note {F}',
    kind: 'oneshot',
    description: 'One note of a hand-played steel pan on {F}, touched lightly, in a cathedral.',
    preset: 'slow-brass-steel-without-hands',
    set: { touch: 0.3 },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
    ...played(8, [[0, 4, 53]], 2),
  },
  {
    n: 76,
    id: 'plucked-string-hall-d',
    name: 'Plucked string, hall {D}',
    kind: 'oneshot',
    description: 'One plucked string on {D} with its pick left in, ringing on into a long hall.',
    preset: 'slow-brass-pedal-up-chord-in',
    // Plucked a fifth of the way along, where the string has no major third to sound, and
    // into a hall: under one long note the preset's plate drifts and reads as notes struck.
    set: { attack: 0.005, position: 0.2 },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
    then: [NARROW, soften(10)],
    ...played(8, [[0, 4, 50]], 2),
  },
  {
    n: 77,
    id: 'guitar-strings-after-c',
    name: 'Guitar, strings after {C}',
    kind: 'oneshot',
    description:
      'A picked guitar chord of {C} major that a string pad grows out of and outlasts, in a cathedral.',
    preset: 'slow-brass-guitar-into-strings',
    set: { swell: 0 },
    then: [NARROW],
    ...played(
      10,
      [
        [0, 5, 48],
        [0, 5, 55],
        [0, 5, 60],
        [0, 5, 64],
      ],
      3,
    ),
  },
  {
    n: 78,
    id: 'clean-guitar-chord-a',
    name: 'Clean guitar chord {A}',
    kind: 'oneshot',
    description:
      'A clean guitar chord of {A} minor with its pick left in, on tape, in a six-second hall.',
    preset: 'slow-brass-pickless-guitar-chord',
    set: { swell: 0 },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.4, output: 2.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 6, damping: 0.45, size: 1.5, breathDepth: 0, mix: 0.5 },
      },
    ],
    ...played(
      10,
      [
        [0, 6, 45],
        [0, 6, 52],
        [0, 6, 57],
        [0, 6, 60],
        [0, 6, 64],
      ],
      3,
    ),
  },
  {
    n: 79,
    id: 'night-ward-horn-g',
    name: 'Night ward horn {G}',
    kind: 'oneshot',
    description:
      'One short note on a muted trumpet, {G}, thin and nasal with its top taken off, into a cathedral.',
    preset: 'slow-brass-night-ward-horn',
    set: { attack: 0.03, release: 2.5 },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Warm glue',
        params: { drive: 0.15, tone: -0.6, highCut: 1200, output: 3 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.4 },
      },
    ],
    ...played(8, [[0, 0.7, 67]], 2),
  },
  {
    n: 80,
    id: 'far-side-reed-d',
    name: 'Far side reed {D}',
    kind: 'oneshot',
    description:
      'One short clarinet note, {D} in two octaves, breathy and warm, let go into a six-second hall.',
    preset: 'slow-brass-far-side-reed',
    // Tongued, and a plain hall: in the preset's own the note swells after its front in one key.
    set: { attack: 0.02, release: 1.2 },
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 6, midDecay: 6, mix: 0.3 } },
    ],
    ...played(
      8,
      [
        [0, 0.5, 62],
        [0, 0.5, 50, 0.5],
      ],
      2,
    ),
  },
  {
    n: 81,
    id: 'doubled-course-once-f',
    name: 'Doubled course, once {F}',
    kind: 'oneshot',
    description:
      'One doubled course of open strings on {F}, picked once and left to ring in a hall.',
    preset: 'slow-brass-open-strings-smeared',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, breathDepth: 0, mix: 0.4 } },
    ],
    then: [soften(10)],
    ...played(8, [[0, 4, 53]], 2),
  },
  // Phrases: a few notes in free time, far apart, most of them played round again over
  // their own tails.
  {
    n: 82,
    id: 'cassette-guitar-line-e',
    name: 'Cassette guitar line {E}',
    kind: 'melodic',
    description:
      'Six picked guitar notes climbing from a low {E} to {A} and stepping back, through an amp spring onto worn cassette.',
    preset: 'slow-brass-four-track-guitar',
    set: { swell: 0, hardness: 0.8, sustain: 6 },
    then: [NARROW],
    ...cycled(
      8,
      [
        [0, 2.6, 52, 0.7],
        [0.83, 2.2, 59, 0.6],
        [1.52, 2.4, 64, 0.65],
        [2.74, 1.8, 67, 0.7],
        [4.11, 1.4, 69, 0.6],
        [5.02, 2.2, 67, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 83,
    id: 'nylon-round-c',
    name: 'Nylon round {C}',
    kind: 'melodic',
    description:
      'Nylon strings picked slowly round {C}, {G}, {E}, {D} and {B} with the fingers left in, in a long hall.',
    preset: 'slow-brass-nylon-no-fingers',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: 6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 20, size: 1.5, breathDepth: 0, mix: 0.6 },
      },
    ],
    ...cycled(
      8,
      [
        [0, 3, 48, 0.7],
        [0.62, 2.5, 55, 0.55],
        [1.41, 2.2, 64, 0.7],
        [2.96, 1.8, 62, 0.6],
        [4.37, 2.6, 55, 0.55],
        [5.21, 2.4, 59, 0.65],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 84,
    id: 'piano-down-the-hall-a',
    name: 'Piano down the hall {A}',
    kind: 'melodic',
    description:
      'A felted piano at the far end of a hall: {C}, {B}, {A} over a low {A}, then {E} and {C} over {F}.',
    preset: 'slow-brass-piano-down-the-hall',
    effects: [
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 14, highCut: 3500, mix: 0.5 } },
    ],
    then: [NARROW],
    ...cycled(12, [
      [0, 5, 45, 0.6],
      [1.52, 3, 60, 0.85],
      [2.61, 2.6, 59, 0.8],
      [3.43, 3.4, 57, 0.85],
      [6.2, 5, 41, 0.6],
      [7.74, 3, 64, 0.9],
      [9.03, 2.4, 60, 0.8],
    ]),
  },
  {
    n: 85,
    id: 'steel-pan-round-d',
    name: 'Steel pan round {D}',
    kind: 'melodic',
    description:
      'A hand-played steel pan touched lightly round {D}, {A}, {C} and {F}, in a cathedral.',
    preset: 'slow-brass-steel-without-hands',
    set: { touch: 0.3 },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } }],
    ...cycled(
      8,
      [
        [0, 1.5, 50, 0.75],
        [0.71, 1, 57, 0.5],
        [1.43, 1, 60, 0.6],
        [2.62, 1.2, 62, 0.55],
        [3.39, 1, 65, 0.6],
        [4.81, 1.5, 57, 0.5],
        [5.94, 1, 60, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 86,
    id: 'vibraphone-six-bars-c',
    name: 'Vibraphone, six bars {C}',
    kind: 'melodic',
    description:
      'Six soft vibraphone strokes rising from {C} through {E} and {G} to {B}, then back, in a cathedral.',
    preset: 'slow-brass-rolled-vibes-blurred',
    set: { roll: 0 },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
    ...cycled(
      8,
      [
        [0, 2.5, 60, 0.7],
        [0.94, 2.2, 64, 0.6],
        [1.63, 2.4, 67, 0.65],
        [3.12, 2.6, 71, 0.7],
        [4.87, 2, 69, 0.6],
        [5.92, 2, 64, 0.55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 87,
    id: 'dulcimer-falling-e',
    name: 'Dulcimer falling {E}',
    kind: 'melodic',
    description:
      'Five soft hammer strokes on a dulcimer falling from a high {E} to the {E} below, in a cathedral.',
    preset: 'slow-brass-dulcimer-roll-far',
    set: { roll: 0 },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
    ...played(
      8,
      [
        [0, 1.5, 76, 0.7],
        [0.87, 1.5, 74, 0.6],
        [1.59, 1.5, 71, 0.65],
        [2.83, 1.5, 69, 0.6],
        [4.21, 2.5, 64, 0.7],
      ],
      2,
    ),
  },
  {
    n: 88,
    id: 'open-strings-picked-g',
    name: 'Open strings picked {G}',
    kind: 'melodic',
    description:
      'Doubled courses of open strings picked one at a time from {G} up to {B}, ringing in a hall.',
    preset: 'slow-brass-open-strings-smeared',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, mix: 0.4 } }],
    ...cycled(
      8,
      [
        [0, 2, 55, 0.7],
        [1.18, 2, 62, 0.55],
        [1.86, 2, 67, 0.6],
        [3.34, 2, 69, 0.6],
        [4.59, 2, 71, 0.65],
        [5.47, 2, 62, 0.5],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 89,
    id: 'three-bowls-d',
    name: 'Three bowls {D}',
    kind: 'melodic',
    description:
      'Three low metal bowls struck far apart, {D}, {A} and {E}, each left to ring in a long hall.',
    preset: 'slow-brass-bowl-no-strike',
    // A shorter ring and closer pairs than the preset's, so each strike stands clear of the
    // bowl before it.
    set: { attack: 0.005, decay: 6, detune: 2 },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, breathDepth: 0, mix: 0.4 } },
    ],
    ...cycled(12, [
      [0.4, 3, 50, 0.9],
      [4.02, 3, 57, 0.8],
      [7.81, 3, 52, 0.85],
    ]),
  },
  {
    n: 90,
    id: 'glass-rims-tapped-b',
    name: 'Glass rims tapped {B}',
    kind: 'melodic',
    description:
      'Four wine glasses tapped high up, {B}, {E}, {D} and {A}, in a hall whose tail sings a vowel.',
    preset: 'slow-brass-far-glass-rims',
    set: { sustain: 0, hardness: 0.5 },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 6, mix: 0.5 } }],
    ...played(
      8,
      [
        [0, 2, 83, 0.7],
        [0.93, 2, 88, 0.6],
        [2.14, 2, 86, 0.65],
        [3.87, 3, 81, 0.7],
      ],
      2,
    ),
  },
  {
    n: 91,
    id: 'slow-slide-looped-e',
    name: 'Slow slide, looped {E}',
    kind: 'melodic',
    description:
      'A steel guitar picked from {E} up to {A}, sliding on to {C} and back to {G}, over a half-speed loop of itself.',
    preset: 'slow-brass-slow-slide-looped',
    // Picked harder, and each note let go before the next but the one that slides.
    set: { swell: 0, pick: 0.85 },
    then: [NARROW],
    ...cycled(12, [
      [0.4, 1.2, 64, 0.8],
      [2.11, 1.9, 67, 0.75],
      [4.76, 2.0, 69, 0.8],
      [6.42, 2.6, 72, 0.75],
      [9.57, 2.0, 67, 0.7],
    ]),
    loopFold: 'power',
  },
  {
    n: 92,
    id: 'three-notes-on-a-loop-a',
    name: 'Three notes on a loop {A}',
    kind: 'melodic',
    description:
      'Three picked guitar notes, {A}, {E} and {C}, each doubled and layered on a wearing tape loop.',
    preset: 'slow-brass-two-guitars-one-chord',
    set: { swell: 0 },
    then: [soften(6)],
    ...cycled(
      8,
      [
        [0, 2.5, 45, 0.7],
        [2.94, 2.5, 52, 0.65],
        [5.11, 2.5, 60, 0.7],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 93,
    id: 'muted-trumpet-far-g',
    name: 'Muted trumpet, far {G}',
    kind: 'melodic',
    description:
      'A muted trumpet with its top taken off, five slow notes around {G} ending softly on a high {C}.',
    preset: 'slow-brass-night-ward-horn',
    // Each note tongued and let go, with air between them: the cathedral holds the line.
    set: { attack: 0.03, release: 0.5 },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Warm glue',
        params: { drive: 0.05, tone: -0.6, highCut: 1200, output: 0 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { lowDecay: 8, midDecay: 8, mix: 0.5 },
      },
    ],
    ...cycled(
      12,
      [
        [0.35, 1.2, 67, 1],
        [2.52, 0.7, 65, 0.8],
        [3.56, 1.6, 64, 0.9],
        [6.79, 0.9, 67, 0.8],
        [8.18, 1.8, 72, 0.75],
      ],
      { crossfadeSec: 1.5 },
    ),
  },
  {
    n: 94,
    id: 'hall-floor-steps-a',
    name: 'Hall floor steps {A}',
    kind: 'melodic',
    description:
      'Three soft sub notes, {A}, {D} and {C}, rounded by tape, moving slowly under a cathedral.',
    preset: 'slow-brass-hall-floor-sub',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { drive: 0.2, bump: 0.7, output: -5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { lowDecay: 8, mix: 0.45 } },
    ],
    ...cycled(
      8,
      [
        [0.3, 1.2, 45],
        [3.17, 1.0, 50],
        [5.42, 1.4, 48],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 95,
    id: 'clean-guitar-picked-c',
    name: 'Clean guitar, picked {C}',
    kind: 'melodic',
    description:
      'A clean guitar picked through {C} and then {F}, seven notes with the pick left in, in a long hall.',
    preset: 'slow-brass-pickless-guitar-chord',
    set: { swell: 0 },
    ...cycled(12, [
      [0, 6, 48, 0.7],
      [1.13, 5, 55, 0.6],
      [2.02, 5, 64, 0.65],
      [3.57, 4, 67, 0.6],
      [6.21, 5, 53, 0.7],
      [7.38, 4, 60, 0.6],
      [8.19, 4, 69, 0.65],
    ]),
  },
  {
    n: 96,
    id: 'guitar-strings-rise-a',
    name: 'Guitar, strings rise {A}',
    kind: 'melodic',
    description:
      'Guitar notes picked on {A} minor and then {F}, a string pad growing out of each, in a cathedral.',
    preset: 'slow-brass-guitar-into-strings',
    set: { swell: 0 },
    ...cycled(12, [
      [0, 5, 45, 0.7],
      [1.47, 4, 52, 0.6],
      [2.36, 4, 60, 0.65],
      [5.84, 5, 53, 0.7],
      [7.12, 4, 60, 0.6],
      [8.03, 4, 69, 0.65],
    ]),
  },
  {
    n: 97,
    id: 'pedal-up-three-notes-d',
    name: 'Pedal up, three notes {D}',
    kind: 'melodic',
    description:
      'Three plucked notes, {D}, {A} and {F}, far apart, each trailing murky repeats into a long plate.',
    preset: 'slow-brass-pedal-up-chord-in',
    // Plucked a fifth of the way along, where the string has no major third to sound.
    set: { attack: 0.005, position: 0.2 },
    then: [NARROW],
    ...cycled(12, [
      [0, 3, 50, 0.8],
      [2.6, 3, 57, 0.7],
      [7.1, 3, 53, 0.7],
    ]),
  },
  {
    n: 98,
    id: 'harp-strings-rising-f',
    name: 'Harp strings rising {F}',
    kind: 'melodic',
    description:
      'A harp picked slowly upward from {F} through {C}, {A} and {B} to a high {E}, in a plain hall.',
    preset: 'slow-brass-harp-strings-only',
    effects: [{ deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 14, mix: 0.4 } }],
    ...cycled(
      8,
      [
        [0, 2, 53, 0.8],
        [0.71, 2, 60, 0.7],
        [1.34, 2, 69, 0.75],
        [2.58, 2, 71, 0.8],
        [3.47, 2.5, 76, 0.7],
        [5.43, 2, 72, 0.7],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 99,
    id: 'far-side-reed-line-d',
    name: 'Far side reed line {D}',
    kind: 'melodic',
    description:
      'A single clarinet line in free time around {D}, {F} and {E}, falling to {A}, in a hall.',
    preset: 'slow-brass-far-side-reed',
    // Each note tongued and let go, with air between them.
    set: { attack: 0.02, release: 0.4 },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, breathDepth: 0, mix: 0.36 } },
    ],
    ...cycled(12, [
      [0.35, 1.1, 62, 0.85],
      [2.06, 0.8, 65, 0.8],
      [3.28, 1.7, 64, 1],
      [6.42, 1.0, 60, 0.8],
      [7.87, 2.2, 57, 0.85],
    ]),
    loopFold: 'power',
  },
  {
    n: 100,
    id: 'marimba-five-bars-g',
    name: 'Marimba, five bars {G}',
    kind: 'melodic',
    description:
      'Five single marimba strokes from {G} up to {D} and back down, an octave shadow under each.',
    preset: 'slow-brass-marimba-bar-rolled',
    set: { roll: 0, mallet: 0.5 },
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
    then: [NARROW],
    ...played(
      10,
      [
        [0, 2, 55, 0.7],
        [1.12, 2, 62, 0.6],
        [2.03, 2, 59, 0.65],
        [3.71, 2, 57, 0.6],
        [4.89, 1.5, 55, 0.7],
      ],
      3,
    ),
  },
])
