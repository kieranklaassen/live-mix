// The sounds of the pack "Soft Pedal": its presets played, a hundred sounds to
// paint with. Numbers 2001 to 2100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/soft-pedal'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

/** The sides brought in, for a room or a chorus that comes out wider than the middle. */
const NARROW: PatchDevice = { deviceId: 'stereo-widener', params: { width: 0.35 } }

/** A ceiling under a strike that stands far over the note behind it, so the note is not left quiet. */
const pinned = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

/**
 * A fast hand on the fader after the room: the slow wander of a tape, a
 * tremolo or a pair of detuned ranks is evened out, so a held note that is
 * meant as a drone stays one in every key.
 */
const LEVEL: PatchDevice = {
  deviceId: 'ambient-comp',
  params: { threshold: -55, ratio: 6, attack: 30, release: 0.3, knee: 6, tails: 1, makeup: 18 },
}

export const SOUNDS: readonly FactorySound[] = packSounds('soft-pedal', 2000, PRESETS, [
  // --- Drones: the low dark side of the room, and the few things in it that hold still ---
  {
    n: 1,
    id: 'unlit-cellar-drone-e',
    name: 'Unlit cellar drone {E}',
    kind: 'drone',
    description:
      'An {E} in just minor over a heavy sub, dull on wavering tape, in a room that hardly decays.',
    preset: 'soft-pedal-unlit-cellar',
    then: [LEVEL, NARROW],
    ...looped(8, 8, 3, [52]),
  },
  {
    n: 2,
    id: 'hall-floor-drone-c',
    name: 'Hall floor drone {C}',
    kind: 'drone',
    description:
      'Octaves of a low {C} over their sub, thickened by a tape preamp, at the bottom of a dark well of short echoes.',
    preset: 'soft-pedal-hall-floor-drone',
    // The partials wander less than the preset lets them, or the level moves like a pad's; more of them, or a tone this still comes out loud.
    set: { movement: 0.2, partials: 0.9 },
    then: [quarterTurn(8)],
    ...looped(8, 7, 2, [36]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'closed-door-pipes-d',
    name: 'Closed door pipes {D}',
    kind: 'drone',
    description:
      'Flue pipes on {D} and {A} with all the top removed, doubled wide in a cathedral, as heard through a door.',
    preset: 'soft-pedal-closed-door-pipes',
    // The celeste rank nearly shut and the bellows still: their beating is a pad's movement.
    set: { celeste: 0.1, bellows: 0 },
    then: [LEVEL, quarterTurn(8)],
    ...looped(8, 7, 2, [50, 57]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'far-end-viola-c',
    name: 'Far end viola {C}',
    kind: 'drone',
    description:
      'The two low open strings of a viola, {C} and {G}, bowed lightly with no vibrato at the far end of a cathedral.',
    preset: 'soft-pedal-far-end-viola',
    // Two strings: one alone, held this still, is too loud in a high key.
    set: { vibrato: 0, detune: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [48, 55]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'sub-under-piano-a',
    name: 'Sub under piano {A}',
    kind: 'drone',
    description:
      'A plain soft sub tone on a low {A} with a little tape saturation, to lie an octave under a piano.',
    preset: 'soft-pedal-sub-under-piano',
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'low-horns-drone-f',
    name: 'Low horns drone {F}',
    kind: 'drone',
    description:
      'Two horns blown gently on a low {F} and the {C} over it, one player each, in a fourteen second hall.',
    preset: 'soft-pedal-late-soft-horns',
    // One player a note: a section beats against itself and swells.
    set: { section: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 7, 2, [41, 48]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'one-high-voice-a',
    name: 'One high voice {A}',
    kind: 'drone',
    description:
      'A single high voice holding {A} on an open ah, with no vibrato, from the back of a cathedral.',
    preset: 'soft-pedal-wordless-high-voices',
    // One singer, on the pitch and on one vowel: a section's beating is heard as notes.
    set: { ensemble: 0, vibrato: 0, motion: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 9, 2, [69]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'lamp-turned-low-g',
    name: 'Lamp turned low {G}',
    kind: 'drone',
    description:
      'A low {G} and {D} on the chorus polysynth with its filter nearly shut, in a damped cathedral.',
    preset: 'soft-pedal-lamp-turned-low',
    then: [LEVEL],
    ...looped(8, 7, 3, [43, 50]),
  },
  {
    n: 9,
    id: 'string-ensemble-hush-f',
    name: 'Ensemble hush {F}',
    kind: 'drone',
    description:
      'A string ensemble on {F} and {C} with its tone turned down and its chorus off, still in the largest room.',
    preset: 'soft-pedal-string-ensemble-hush',
    set: { ensemble: 0, drift: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 8, 2, [53, 60]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'amplifier-left-on-g',
    name: 'Amplifier left on {G}',
    kind: 'texture',
    description:
      'Mains hum on a low {G} and its fifth under the rumble of an empty room, like an amplifier left on next door.',
    preset: 'soft-pedal-amplifier-left-on',
    // Evened out, then the room's own noise over it: the hum alone is a steady tone, louder than anything else here.
    set: { movement: 0 },
    then: [LEVEL, { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -30 } }],
    ...looped(8, 6, 3, [43, 50]),
  },
  {
    n: 11,
    id: 'bellows-and-rotor-c',
    name: 'Bellows and rotor {C}',
    kind: 'drone',
    description:
      'Reed pipes on {C} and {G} with the bellows held still, through a slowly rotating speaker in a large hall.',
    preset: 'soft-pedal-bellows-and-rotor',
    // The bellows still and the second rank nearly shut: the rotor is the only thing that moves.
    set: { bellows: 0, celeste: 0.1 },
    then: [LEVEL],
    ...looped(8, 7, 3, [48, 55]),
  },
  {
    n: 12,
    id: 'back-row-subtone-b',
    name: 'Back row subtone {B}',
    kind: 'drone',
    description:
      'A saxophone holding a low {B} at a breathy subtone with a little vibrato, across a cathedral.',
    preset: 'soft-pedal-back-row-subtone',
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [47]),
    tuning: 'whole-cycles',
  },
  {
    n: 13,
    id: 'low-marimba-roll-g',
    name: 'Low marimba roll {G}',
    kind: 'drone',
    description:
      'A low {G}, its fifth and its octave rolled softly on a marimba, printed to tape in a dark six second hall.',
    preset: 'soft-pedal-low-marimba-roll',
    ...looped(8, 6, 3, [43, 50, [55, 0.8]]),
  },
  // --- Pads: chords that swell into the long room and out of it ---------------------------
  {
    n: 14,
    id: 'hammerless-piano-fmaj7',
    name: 'Hammerless piano {F}maj7',
    kind: 'pad',
    description:
      'A piano chord on {F} major seventh with the strike faded out of every note, swelling into the room; it comes round.',
    preset: 'soft-pedal-piano-without-hammers',
    // The doubling is twenty-eight cents from side to side: narrowed, so the chord holds in mono.
    then: [NARROW],
    ...cycled(8, [
      [0, 7, 53, 0.7],
      [0.03, 7, 60, 0.6],
      [0.06, 7, 64, 0.65],
      [0.1, 7, 69, 0.7],
    ]),
  },
  {
    n: 15,
    id: 'strikeless-tines-am9',
    name: 'Strikeless tines {A}m9',
    kind: 'pad',
    description:
      'An electric piano chord on {A} minor ninth with its attack taken off, fading in through an ensemble chorus.',
    preset: 'soft-pedal-tines-without-strike',
    then: [NARROW],
    ...cycled(
      8,
      [
        [0.6, 7, 45, 0.7],
        [0.62, 7, 52, 0.6],
        [0.65, 7, 60, 0.6],
        [0.68, 7, 67, 0.65],
        [0.72, 7, 71, 0.6],
      ],
      { crossfadeSec: 0.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 16,
    id: 'beating-glass-pad-g',
    name: 'Beating glass pad {G}',
    kind: 'pad',
    description:
      'A glass pad on {G} with an added ninth that fades in over three seconds, its operators beating, in a cathedral.',
    preset: 'soft-pedal-beating-glass-pad',
    ...cycled(8, [
      [0, 4.5, 55, 0.8],
      [0, 4.5, 62, 0.7],
      [0, 4.5, 69, 0.65],
      [0, 4.5, 71, 0.6],
    ]),
  },
  {
    n: 17,
    id: 'pale-blooming-pad-dm',
    name: 'Pale blooming pad {D}m',
    kind: 'pad',
    description:
      'A slow glass pad twelve cents wide on {D} minor, rising and sinking in a reverb whose tail leans faintly up.',
    preset: 'soft-pedal-pale-blooming-pad',
    // Less bloom than the preset: at half, the tail climbs through every pitch on its way to the octave.
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Octave halo',
        params: { bloom: 0.2, season: 2, decay: 14, mix: 0.45 },
      },
    ],
    then: [NARROW, breathe(0.125, 0.6)],
    ...looped(8, 8, 3, [50, 57, [62, 0.8], [65, 0.7]]),
  },
  {
    n: 18,
    id: 'dark-brass-half-lost-c',
    name: 'Dark brass half lost {C}',
    kind: 'pad',
    description:
      'A dark brass-like chord on {C} with an added ninth that speaks in two seconds and fades over six, in a cathedral.',
    preset: 'soft-pedal-dark-brass-half-lost',
    ...cycled(
      8,
      [
        [0, 4.5, 48, 0.8],
        [0, 4.5, 55, 0.7],
        [0, 4.5, 62, 0.65],
        [0, 4.5, 64, 0.6],
      ],
      {
        crossfadeSec: 1,
      },
    ),
    loopFold: 'power',
  },
  {
    n: 19,
    id: 'smeared-brass-swell-em7',
    name: 'Smeared brass swell {E}m7',
    kind: 'pad',
    description:
      'A chord of {E} minor seventh that opens over three seconds and keeps swelling, its spectrum smeared.',
    preset: 'soft-pedal-smeared-brass-swell',
    ...cycled(
      8,
      [
        [0, 5, 52, 0.8],
        [0, 5, 59, 0.7],
        [0, 5, 62, 0.65],
        [0, 5, 67, 0.65],
        [0, 5, 71, 0.55],
      ],
      {
        crossfadeSec: 2,
      },
    ),
    loopFold: 'power',
  },
  {
    n: 20,
    id: 'mutes-on-section-am',
    name: 'Mutes on section {A}m',
    kind: 'pad',
    description:
      'Four muted players a part on {A} minor with no vibrato, swelling in over two seconds into a long damped plate.',
    preset: 'soft-pedal-mutes-on-section',
    then: [NARROW],
    ...cycled(8, [
      [0, 5, 57, 0.8],
      [0, 5, 60, 0.7],
      [0, 5, 64, 0.7],
      [0, 5, 69, 0.6],
    ]),
  },
  {
    n: 21,
    id: 'bows-barely-touching-g',
    name: 'Bows barely touching {G}',
    kind: 'pad',
    description:
      'Three players a note high on {G}, {D} and {A} with no bow weight and no vibrato, airy in the largest room.',
    preset: 'soft-pedal-bows-barely-touching',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 8, 3, [67, 74, [79, 0.8], [81, 0.7]]),
  },
  {
    n: 22,
    id: 'slow-vowels-dm',
    name: 'Slow vowels {D}m',
    kind: 'pad',
    description:
      'Voices on {D} minor drifting from vowel to vowel, in a hall whose long tail is itself shaped like a sung ah.',
    preset: 'soft-pedal-slow-vowels-hall',
    set: { ensemble: 0, vibrato: 0 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 8, 3, [50, 62, [65, 0.8], [69, 0.7]]),
  },
  {
    n: 23,
    id: 'dusk-filter-opening-f',
    name: 'Dusk filter opening {F}',
    kind: 'pad',
    description:
      'Fifths on {F} under both choruses, the filter opened from almost shut, rising and sinking in a twenty second space.',
    preset: 'soft-pedal-dusk-filter-opening',
    then: [NARROW, breathe(0.125, 0.45)],
    ...looped(8, 8, 3, [53, 60, [65, 0.8], [72, 0.6]]),
  },
  {
    n: 24,
    id: 'closed-lid-pad-f',
    name: 'Closed lid pad {F}',
    kind: 'pad',
    description:
      'A two-oscillator pad on {F} major with its filter at seven hundred hertz, turned over by a slow phaser in a hall.',
    preset: 'soft-pedal-closed-lid-pad',
    // The preset's phaser turns once in nearly seventeen seconds; here once a loop, so it comes round.
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 16, size: 1.9, mix: 0.45 } },
    ],
    ...looped(8, 9, 3, [41, 53, [57, 0.8], [60, 0.7]]),
  },
  {
    n: 25,
    id: 'hollow-dark-room-am',
    name: 'Hollow dark room {A}m',
    kind: 'pad',
    description:
      'A hollow wavetable chord on {A} minor morphing under a low filter, in a dark room whose tail sinks as it fades.',
    preset: 'soft-pedal-hollow-dark-room',
    ...cycled(
      8,
      [
        [0, 4.5, 45, 0.8],
        [0, 4.5, 57, 0.7],
        [0, 4.5, 60, 0.65],
        [0, 4.5, 64, 0.6],
      ],
      {
        crossfadeSec: 1,
      },
    ),
    loopFold: 'power',
  },
  {
    n: 26,
    id: 'folded-tone-pad-c',
    name: 'Folded tone pad {C}',
    kind: 'pad',
    description:
      'Tones on {C} major that fade in over two seconds and fold into richer ones while held, doubled thick.',
    preset: 'soft-pedal-folded-tone-pad',
    then: [NARROW],
    ...cycled(
      8,
      [
        [0, 5, 48, 0.8],
        [0, 5, 55, 0.7],
        [0, 5, 64, 0.65],
        [0, 5, 67, 0.6],
      ],
      {
        crossfadeSec: 1,
      },
    ),
    loopFold: 'power',
  },
  {
    n: 27,
    id: 'frozen-piano-instant-e',
    name: 'Frozen piano instant {E}',
    kind: 'pad',
    description:
      'One instant of a felt piano note, held still on {E} and {G}, doubled wide in a twenty second room.',
    preset: 'soft-pedal-one-frozen-instant',
    source: 'felt-piano-c',
    ...looped(8, 7, 3, [64, 67]),
  },
  {
    n: 28,
    id: 'two-second-clarinets-em7',
    name: 'Slow clarinets {E}m7',
    kind: 'pad',
    description:
      'Clarinets holding {E} minor seventh, doubled eight cents either side, in a room that swells behind them.',
    preset: 'soft-pedal-two-second-clarinets',
    then: [NARROW],
    ...looped(8, 8, 2, [52, 59, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 29,
    id: 'held-string-halo-g',
    name: 'Held string halo {G}',
    kind: 'pad',
    description:
      'Strings on {G} and {D} kept singing by a sustainer, through an ensemble chorus into a long room.',
    preset: 'soft-pedal-held-string-halo',
    ...looped(8, 7, 3, [43, 50, [55, 0.8], [62, 0.7]]),
  },
  {
    n: 30,
    id: 'dim-tape-choir-am9',
    name: 'Dim tape choir {A}m9',
    kind: 'pad',
    description:
      'A choir on a tape-replay keyboard in close harmony on {A} minor ninth, its tone turned down, in a cathedral.',
    preset: 'soft-pedal-dim-tape-choir',
    // A steadier tape than the preset's: its wow and vibrato carry a close chord onto the keys between.
    set: { age: 0.2, vibrato: 0.1, players: 0.2 },
    ...cycled(8, [
      [0, 5.5, 57, 0.8],
      [0, 5.5, 60, 0.7],
      [0, 5.5, 64, 0.7],
      [0, 5.5, 67, 0.65],
      [0, 5.5, 71, 0.55],
    ]),
  },
  {
    n: 31,
    id: 'half-speed-flutes-f',
    name: 'Half speed flutes {F}',
    kind: 'pad',
    description:
      'Tape flutes on {F}, {A} and {C} at half speed on a worn reel, an octave down and hissing, in a twelve second hall.',
    preset: 'soft-pedal-half-speed-flutes',
    ...cycled(8, [
      [0, 6, 65, 0.8],
      [0, 6, 69, 0.7],
      [0, 6, 72, 0.7],
    ]),
  },
  {
    n: 32,
    id: 'blurred-vibes-roll-g6',
    name: 'Blurred vibes roll {G}6',
    kind: 'pad',
    description:
      'A vibraphone chord on {G} sixth rolled seven times a second with very soft mallets, blurred into a long room.',
    preset: 'soft-pedal-blurred-vibes-roll',
    then: [NARROW],
    ...looped(8, 6, 3, [55, 59, [62, 0.8], [64, 0.7]]),
  },
  {
    n: 33,
    id: 'soft-hammered-roll-d',
    name: 'Soft hammered roll {D}',
    kind: 'pad',
    description:
      'Octave courses on {D} and {A} rolled softly with hammers six times a second, dulled, blurring into a long plate.',
    preset: 'soft-pedal-soft-hammered-roll',
    then: [NARROW],
    ...looped(8, 6, 3, [50, 57, [62, 0.8]]),
  },
  {
    n: 34,
    id: 'rubbed-bowl-haze-a',
    name: 'Rubbed bowl haze {A}',
    kind: 'pad',
    description:
      'Three bowls on {A} and {E} rubbed rather than struck, in a space that takes most of a minute to empty.',
    preset: 'soft-pedal-rubbed-bowl-haze',
    then: [NARROW],
    ...looped(8, 8, 3, [57, 64, [69, 0.8]]),
  },
  {
    n: 35,
    id: 'glass-rims-room-em',
    name: 'Glass rims room {E}m',
    kind: 'pad',
    description:
      'Wet fingers on three glass rims high on {E} minor, each beating against itself in the largest room.',
    preset: 'soft-pedal-glass-rims-room',
    then: [quarterTurn(8)],
    ...looped(8, 8, 3, [76, 79, 83]),
    tuning: 'whole-cycles',
  },
  {
    n: 36,
    id: 'still-sines-phasing-b',
    name: 'Still sines phasing {B}',
    kind: 'pad',
    description:
      'Near sine tones on two {B}s over a sub, shifted a fraction of a hertz so they phase slowly in a very long room.',
    preset: 'soft-pedal-still-sines-phasing',
    // The shift at three turns a loop and its drift at one, where the preset's 0.4 Hz would not come round.
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.375, lfoRate: 0.125, width: 0.3, mix: 0.4 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 22, width: 0.7, mix: 0.45 },
      },
    ],
    ...looped(8, 7, 3, [47, 59]),
  },
  {
    n: 37,
    id: 'dark-fifth-below-d',
    name: 'Dark fifth below {D}',
    kind: 'pad',
    description:
      'A {D} and its fifth in saw and pulse under a filter that barely opens, the tail sinking in a dark room.',
    preset: 'soft-pedal-dark-fifth-below',
    ...looped(8, 8, 3, [50, 57]),
  },
  {
    n: 38,
    id: 'plain-four-strings-c',
    name: 'Plain four strings {C}',
    kind: 'pad',
    description:
      'Four strings on {C} and the {G} under it plucked round once in eight seconds with no buzz, in a long room.',
    preset: 'soft-pedal-plain-four-strings',
    // One round of the four strings to the loop, which starts just after a pluck.
    set: { speed: 8 },
    ...looped(8, 8.1, 0.45, [48]),
  },
  {
    n: 39,
    id: 'bronze-without-strike-d',
    name: 'Bronze without strike {D}',
    kind: 'pad',
    description:
      'A gong on {D} with its strike faded out, so only the slow beating metal swells up; it comes round.',
    preset: 'soft-pedal-bronze-without-strike',
    ...cycled(8, [[0.4, 6, 50, 0.8]]),
  },
  {
    n: 40,
    id: 'low-octave-strings-c',
    name: 'Low octave strings {C}',
    kind: 'pad',
    description:
      'The low octave of a string ensemble on {C} and {G}, dull, worn by reel tape, rising and sinking once in eight seconds.',
    preset: 'soft-pedal-low-octave-strings',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [48, 55]),
  },
  // --- Textures: what the room sounds like when nobody is playing -------------------------
  {
    n: 41,
    id: 'draught-under-the-door',
    name: 'Draught under the door',
    kind: 'texture',
    description:
      'Low wind with a faint whistle on {D}, under a filter that opens and shuts once in sixteen seconds, in a hall.',
    preset: 'soft-pedal-draught-under-door',
    // The preset's filter turns once in fourteen seconds; here once a loop, so it comes round.
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 1200, lfoAmount: 25, lfoRateHz: 0.0625 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 5, midDecay: 4, mix: 0.4 } },
    ],
    ...looped(16, 5, 3, [50]),
  },
  {
    n: 42,
    id: 'open-window-cricket-field',
    name: 'Open window crickets',
    kind: 'texture',
    description:
      'A field of crickets a long way off, the edge taken off, scattered into grains in a wide space behind a window.',
    preset: 'soft-pedal-open-window-crickets',
    // Each chirp is a pitched call: scattered into grains, the field runs together as it does from indoors.
    then: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 120, density: 16, spray: 0.6, scatter: 1, feedback: 0.3, mix: 0.85 },
      },
      NARROW,
    ],
    ...looped(8, 6, 2, [41, 47, 52, 57, 62, 67, 72, 77]),
  },
  {
    n: 43,
    id: 'breath-chord-haze-c',
    name: 'Breath chord haze {C}',
    kind: 'texture',
    description:
      'Low flutes that are nearly all breath on a chord of {C}, drifting in a slow chorus and an eighteen second room.',
    preset: 'soft-pedal-breath-chord-haze',
    then: [NARROW],
    ...looped(8, 7, 3, [48, 55, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 44,
    id: 'low-unsteady-bands-d',
    name: 'Low unsteady bands {D}',
    kind: 'texture',
    description:
      'Wide low bands of filtered noise drifting in pitch around {D} and {A}, evened by a slow compressor, in a cathedral.',
    preset: 'soft-pedal-low-unsteady-bands',
    ...looped(8, 7, 3, [50, 57]),
  },
  {
    n: 45,
    id: 'hung-noise-bands-a',
    name: 'Hung noise bands {A}',
    kind: 'texture',
    description:
      'Bands of noise tuned to {A}, {E} and their reflections in {A} minor, breathing slowly in a twenty second room.',
    preset: 'soft-pedal-hung-noise-bands',
    // The scale on its white degree, and wider bands than the preset's, which half sing.
    set: { root: 9, resonance: 25 },
    ...looped(8, 7, 3, [57, 64, 69]),
  },
  {
    n: 46,
    id: 'practice-room-rain',
    name: 'Practice room rain',
    kind: 'texture',
    description:
      'Rain on the window of the room the piano stands in, its top shaded, in a wide twelve second space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { attack: 0.5, width: 0.6 },
    },
    effects: [
      soften(18),
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 4500, mix: 0.4 },
      },
      // The drops stand far over the rain between them: held under a ceiling, the bed is not left quiet.
      pinned(8),
    ],
    ...looped(8, 5, 2, [55]),
  },
  {
    n: 47,
    id: 'stove-in-the-corner',
    name: 'Stove in the corner',
    kind: 'texture',
    description:
      'A small fire ticking and breathing in the corner of the room, heard through a short dull hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { attack: 0.5, width: 0.6 },
    },
    effects: [
      soften(16),
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 2500, mix: 0.3 } },
    ],
    ...looped(8, 4, 2, [48]),
  },
  {
    n: 48,
    id: 'record-left-turning',
    name: 'Record left turning',
    kind: 'texture',
    description:
      'The crackle of a record left turning, copied to slow hissing tape and set in a long plate.',
    instrument: { deviceId: 'atmosphere', preset: 'Old record', params: { width: 0.6 } },
    effects: [
      soften(22),
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.45, flutter: 0.1, age: 0.3, hiss: 0.5 },
      },
      {
        deviceId: 'plate-reverb',
        preset: 'Long plate',
        params: { decay: 0.93, damping: 0.45, mix: 0.3 },
      },
    ],
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 49,
    id: 'backwards-rain-dissolve',
    name: 'Backwards rain dissolve',
    kind: 'texture',
    description:
      'Rain on a window read backwards in long grains, its spectrum left hanging and dissolving, in a cathedral.',
    preset: 'soft-pedal-backwards-dissolve',
    source: 'rain-on-the-window',
    ...looped(8, 7, 3, [60]),
  },
  {
    n: 50,
    id: 'storm-two-towns-over',
    name: 'Storm two towns over',
    kind: 'texture',
    description:
      'Thunder a long way off, its rolls overlapping, the top shaded and the rest left in a cathedral.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, tone: 0.5, movement: 0.4, width: 0.7 },
    },
    effects: [
      soften(8),
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 51,
    id: 'slow-loop-of-wind',
    name: 'Slow loop of wind',
    kind: 'texture',
    description:
      'Hill wind an octave down on a slow unsteady loop, doubled a few cents wide in a very long room.',
    preset: 'soft-pedal-loaded-sound-treated',
    source: 'hill-wind',
    then: [NARROW],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 52,
    id: 'next-room-rumble',
    name: 'Next room rumble',
    kind: 'texture',
    description:
      'The rumble of the room an upright stands in, heard through the wall with nobody playing, in a short dull hall.',
    preset: 'soft-pedal-thump-and-low-strings',
    // The room's own noise brought up from under the piano; one low key is held down and has died away before the loop starts.
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Just the room',
        params: { distance: 0.9, room: 0.8, treble: -0.6 },
      },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -18 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 2500, mix: 0.3 } },
      NARROW,
    ],
    ...looped(8, 3, 2, [[28, 0.1]]),
  },
  // --- One-shots: one note or one chord, struck softly and left to the room ---------------
  {
    n: 53,
    id: 'lid-nearly-closed-d',
    name: 'Lid nearly closed {D}',
    kind: 'oneshot',
    description:
      'One low {D} on a soft-pedalled piano with a detuned copy either side, left to hang in a very long dark room.',
    preset: 'soft-pedal-lid-nearly-closed',
    ...played(8, [[0, 2.5, 50]], 2),
  },
  {
    n: 54,
    id: 'left-pedal-chord-g',
    name: 'Left pedal chord {G}',
    kind: 'oneshot',
    description:
      'One chord of {G} major on a piano with only the soft pedal down, in a hall of eight seconds tipped out of tune.',
    preset: 'soft-pedal-left-pedal-hall',
    then: [pinned(8)],
    ...played(
      7,
      [
        [0, 3, 43, 0.7],
        [0.02, 3, 55, 0.6],
        [0.04, 3, 59, 0.6],
        [0.06, 3, 62, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 55,
    id: 'both-pedals-down-e',
    name: 'Both pedals down {E}',
    kind: 'oneshot',
    description:
      'One low {E} with both pedals down, muffled and never damped, hanging in a twenty second room.',
    preset: 'soft-pedal-both-pedals-down',
    then: [pinned(8)],
    ...played(10, [[0, 3, 40, 0.9]], 3),
  },
  {
    n: 56,
    id: 'thump-and-low-string-a',
    name: 'Thump and low string {A}',
    kind: 'oneshot',
    description:
      'A low {A} in octaves on a heavily felted upright heard from the next room: thump, low strings and room rumble.',
    preset: 'soft-pedal-thump-and-low-strings',
    then: [NARROW, pinned(6)],
    ...played(
      6,
      [
        [0, 3, 33, 0.9],
        [0.02, 3, 45, 0.6],
      ],
      1.5,
    ),
  },
  {
    n: 57,
    id: 'low-dark-bowl-c',
    name: 'Low dark bowl {C}',
    kind: 'oneshot',
    description:
      'A low {C} and {G} of slow bowl tones with a soft strike, in an eighteen second room that breathes.',
    preset: 'soft-pedal-low-dark-bowl',
    // Struck at once: with the preset's slow strike the bowl is at its loudest late in far keys, and reads as a pad.
    set: { attack: 0.005 },
    ...played(
      12,
      [
        [0, 5, 36, 0.9],
        [0.01, 5, 43, 0.8],
      ],
      3,
    ),
  },
  {
    n: 58,
    id: 'glass-vibes-chorus-a',
    name: 'Glass vibes chorus {A}',
    kind: 'oneshot',
    description:
      'One dull glass vibraphone note on {A} that rings four seconds, in a very slow chorus and a long dull hall.',
    preset: 'soft-pedal-glass-vibes-chorus',
    ...played(7, [[0, 3, 69]], 2),
  },
  {
    n: 59,
    id: 'motor-off-vibraphone-f',
    name: 'Motor off vibraphone {F}',
    kind: 'oneshot',
    description:
      'One low {F} on a vibraphone bar with a soft mallet and no motor, doubled seven cents wide in a long room.',
    preset: 'soft-pedal-motor-off-vibraphone',
    then: [NARROW],
    ...played(10, [[0, 5, 53]], 3),
  },
  {
    n: 60,
    id: 'next-town-bell-d',
    name: 'Next town bell {D}',
    kind: 'oneshot',
    description:
      'A church bell on {D} with its top cut at four and a half kilohertz, struck once and coming back as far echoes.',
    preset: 'soft-pedal-next-town-bell',
    // Struck on the node of its major third: over {D} every other partial of the bell is a white key.
    set: { position: 0.667 },
    ...played(12, [[0, 6, 50]], 3),
  },
  {
    n: 61,
    id: 'slowed-thumb-key-c',
    name: 'Slowed thumb key {C}',
    kind: 'oneshot',
    description:
      'One {C} on a thumb piano, mostly replaced by itself at half speed an octave down, in a cathedral.',
    preset: 'soft-pedal-slowed-thumb-keys',
    ...played(6, [[0, 2, 72]], 1.5),
  },
  {
    n: 62,
    id: 'detuned-room-harp-a',
    name: 'Detuned room harp {A}',
    kind: 'oneshot',
    description:
      'One softly plucked low harp string on {A} in an eighteen second room, the room then spread eight cents wide.',
    preset: 'soft-pedal-detuned-room-harp',
    ...played(8, [[0, 2, 45]], 2),
  },
  {
    n: 63,
    id: 'long-ring-harp-g',
    name: 'Long ring harp {G}',
    kind: 'oneshot',
    description:
      'One harp string on {G} plucked at its middle with almost no finger noise, ringing long in a cathedral.',
    preset: 'soft-pedal-long-ring-harp',
    ...played(6, [[0, 3, 67]], 1.5),
  },
  {
    n: 64,
    id: 'damped-harp-tail-d',
    name: 'Damped harp tail {D}',
    kind: 'oneshot',
    description:
      'One harp string on {D} stopped with the hand, short and dry, against a twenty second room just behind it.',
    preset: 'soft-pedal-damped-harp-tail',
    ...played(8, [[0, 1, 62]], 2),
  },
  {
    n: 65,
    id: 'octave-under-harp-f',
    name: 'Octave under harp {F}',
    kind: 'oneshot',
    description:
      'A low {F} and {C} on long harp strings with the octave below added, in a dark room whose tail sinks a little.',
    preset: 'soft-pedal-octave-under-harp',
    // Far less bloom than the preset: its sinking tail passes through the keys between, most of all in a high key.
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, filter: 800 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { bloom: 0.08, mix: 0.5 } },
    ],
    then: [pinned(6)],
    ...played(
      8,
      [
        [0, 3, 41, 0.8],
        [0.03, 3, 48, 0.7],
      ],
      2,
    ),
  },
  {
    n: 66,
    id: 'brushed-chord-fmaj7',
    name: 'Brushed chord {F}maj7',
    kind: 'oneshot',
    description:
      'The chord of {F} major seventh brushed once across an octave of dull strings over a faint pad, in a cathedral.',
    preset: 'soft-pedal-brushed-chord-room',
    // Less of the pad under the strings: in far keys it was louder than the brush and the sound read as a pad.
    set: { pad: 0.1 },
    ...played(
      7,
      [
        [0, 3, 53],
        [0, 3, 57],
        [0, 3, 60],
        [0, 3, 64],
      ],
      2,
    ),
  },
  {
    n: 67,
    id: 'tongue-drum-hush-g',
    name: 'Tongue drum hush {G}',
    kind: 'oneshot',
    description:
      'One soft tongue drum note on {G} with a copy nine cents either side, ringing into a dark sixteen second room.',
    preset: 'soft-pedal-tongue-drum-hush',
    then: [NARROW],
    ...played(8, [[0, 3, 55]], 2),
  },
  {
    n: 68,
    id: 'low-murky-fifth-d',
    name: 'Low murky fifth {D}',
    kind: 'oneshot',
    description:
      'A low fifth on {D} struck once on round tines with little bell, its slow dull repeats blurring into a dark hall.',
    preset: 'soft-pedal-low-murky-tines',
    ...played(
      8,
      [
        [0, 3, 38, 0.8],
        [0.02, 3, 45, 0.7],
      ],
      2,
    ),
  },
  {
    n: 69,
    id: 'soft-mallet-tone-e',
    name: 'Soft mallet tone {E}',
    kind: 'oneshot',
    description:
      'A nearly pure tone on {E} struck through a gate that darkens as it fades, with slow octave-lower replays.',
    preset: 'soft-pedal-soft-mallet-tone',
    then: [pinned(10)],
    ...played(6, [[0, 2, 64]], 1.5),
  },
  {
    n: 70,
    id: 'small-hammered-piano-c',
    name: 'Small hammered piano {C}',
    kind: 'oneshot',
    description:
      'One string on {C} struck with a felt hammer, a detuned copy either side, like a small piano in a cathedral.',
    preset: 'soft-pedal-small-hammered-piano',
    ...played(7, [[0, 3, 60]], 2),
  },
  {
    n: 71,
    id: 'glockenspiel-echoes-b',
    name: 'Glockenspiel echoes {B}',
    kind: 'oneshot',
    description:
      'One high {B} on a glockenspiel with a softer mallet and its top cut, coming back as sparse echoes from far off.',
    preset: 'soft-pedal-glockenspiel-echoes',
    ...played(8, [[0, 1.5, 83]], 2),
  },
  {
    n: 72,
    id: 'three-head-chime-c',
    name: 'Three head chime {C}',
    kind: 'oneshot',
    description:
      'One chime bar on {C} struck with a softer hammer, repeated by three wavering tape heads into a long plate.',
    preset: 'soft-pedal-three-head-chimes',
    ...played(8, [[0, 1.5, 72]], 2),
  },
  // --- Phrases: a few notes in free time, ringing out or coming round ---------------------
  {
    n: 73,
    id: 'lid-closed-round-d',
    name: 'Lid closed round {D}',
    kind: 'melodic',
    description:
      'Six slow notes over {D} on a soft-pedalled piano with detuned copies, in a very long dark room; it comes round.',
    preset: 'soft-pedal-lid-nearly-closed',
    // Less felt and thump than the preset: in a high key they left more noise than note.
    set: { felt: 0.65, thump: 0.15, pedalNoise: 0, hardness: 0.35 },
    then: [NARROW],
    ...cycled(12, [
      [0, 3, 50, 0.7],
      [2.07, 3, 57, 0.6],
      [3.31, 3, 65, 0.7],
      [5.48, 3, 64, 0.65],
      [7.69, 3, 60, 0.6],
      [9.83, 2, 62, 0.6],
    ]),
  },
  {
    n: 74,
    id: 'left-pedal-phrase-g',
    name: 'Left pedal phrase {G}',
    kind: 'melodic',
    description:
      'A piano with only the soft pedal down climbs a chord of {G} and falls back to {B} in an eight second hall.',
    preset: 'soft-pedal-left-pedal-hall',
    ...played(
      10,
      [
        [0, 3, 55, 0.7],
        [1.3, 3, 62, 0.6],
        [2.1, 3, 67, 0.7],
        [4.2, 3.5, 64, 0.65],
        [5.9, 3, 59, 0.6],
      ],
      2,
    ),
  },
  {
    n: 75,
    id: 'four-slow-notes-a',
    name: 'Four slow notes {A}',
    kind: 'melodic',
    description:
      'Four felted notes high on the keyboard from {A} down to {C}, faintly doubled, with a long dark tail.',
    preset: 'soft-pedal-four-slow-notes',
    // No thump or key noise: this high they stand far over the note, which is left very quiet in a high key.
    set: { thump: 0, action: 0 },
    // Less bloom than the preset: its sinking tail passes through the keys between.
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      {
        deviceId: 'bloom-reverb',
        preset: 'Long dark',
        params: { bloom: 0.15, decay: 28, mix: 0.55 },
      },
    ],
    ...played(
      12,
      [
        [0, 2, 81, 0.7],
        [1.7, 2, 76, 0.65],
        [4.1, 2, 79, 0.7],
        [6.9, 3, 72, 0.6],
      ],
      3,
    ),
  },
  {
    n: 76,
    id: 'slow-shadow-round-c',
    name: 'Slow shadow round {C}',
    kind: 'melodic',
    description:
      'A soft piano climbs from {C} and steps back while its notes return an octave lower at half speed; it comes round.',
    preset: 'soft-pedal-piano-with-slow-shadow',
    ...cycled(12, [
      [0, 2.5, 60, 0.7],
      [1.4, 2.5, 64, 0.65],
      [2.3, 3, 67, 0.7],
      [5.2, 2.5, 65, 0.6],
      [6.9, 3, 62, 0.65],
      [9.6, 2, 55, 0.6],
    ]),
  },
  {
    n: 77,
    id: 'empty-hall-tape-em',
    name: 'Empty hall tape {E}m',
    kind: 'melodic',
    description:
      'A felted piano rises through {E} minor and settles on {D}, recorded with its long plate to slow wavering tape.',
    preset: 'soft-pedal-empty-hall-tape',
    then: [NARROW],
    ...played(
      10,
      [
        [0, 3, 52, 0.7],
        [1.1, 3, 59, 0.6],
        [2.6, 3, 67, 0.7],
        [3.4, 3, 64, 0.65],
        [5.8, 4, 62, 0.6],
      ],
      2,
    ),
  },
  {
    n: 78,
    id: 'slow-pan-tines-c',
    name: 'Slow pan tines {C}',
    kind: 'melodic',
    description:
      'Tines crossing from side to side over {C}, three dull tape heads repeating each note into a long plate; it comes round.',
    preset: 'soft-pedal-slow-pan-tines',
    ...cycled(12, [
      [0, 2.5, 60, 0.7],
      [2.2, 2.5, 67, 0.6],
      [3.4, 2.5, 64, 0.65],
      [6.5, 2.5, 69, 0.7],
      [8.1, 2.5, 67, 0.6],
      [10.3, 2, 62, 0.55],
    ]),
  },
  {
    n: 79,
    id: 'across-the-room-f',
    name: 'Across the room {F}',
    kind: 'melodic',
    description:
      'An electric piano through a slowly turning speaker, a broken {F} major seventh from the far wall; it comes round.',
    preset: 'soft-pedal-across-the-room',
    then: [NARROW],
    ...cycled(12, [
      [0, 2.5, 53, 0.7],
      [1.2, 2.5, 60, 0.6],
      [2.7, 3, 69, 0.7],
      [5.1, 2.5, 67, 0.6],
      [6.4, 2.5, 64, 0.65],
      [9.0, 2.5, 60, 0.6],
    ]),
  },
  {
    n: 80,
    id: 'few-cents-wide-e',
    name: 'Few cents wide {E}',
    kind: 'melodic',
    description:
      'Four soft tines from {E}, doubled eleven cents sharp and flat, each left in a twenty-five second space.',
    preset: 'soft-pedal-few-cents-wide',
    then: [NARROW],
    ...played(
      10,
      [
        [0, 3, 64, 0.7],
        [1.8, 3, 71, 0.6],
        [2.9, 3, 67, 0.65],
        [5.4, 4, 69, 0.6],
      ],
      2,
    ),
  },
  {
    n: 81,
    id: 'treated-glass-keys-am',
    name: 'Treated glass keys {A}m',
    kind: 'melodic',
    description:
      'A soft FM electric piano picks out {A} minor, doubled a few cents either side in a long room; it comes round.',
    preset: 'soft-pedal-treated-glass-keys',
    then: [NARROW],
    ...cycled(12, [
      [0, 3, 57, 0.7],
      [1.4, 3, 64, 0.6],
      [2.2, 3, 72, 0.65],
      [4.9, 3, 71, 0.6],
      [6.1, 3, 67, 0.65],
      [8.8, 3, 64, 0.6],
    ]),
  },
  {
    n: 82,
    id: 'dulled-high-glass-c',
    name: 'Dulled high glass {C}',
    kind: 'melodic',
    description:
      'High glass bells step down from a high {C} with everything above six kilohertz cut, far off in a ten second hall.',
    preset: 'soft-pedal-dulled-high-glass',
    ...played(
      8,
      [
        [0, 2, 84, 0.7],
        [0.8, 2, 79, 0.6],
        [2.1, 2, 83, 0.65],
        [3.0, 2, 76, 0.6],
        [4.9, 3, 72, 0.6],
      ],
      2,
    ),
  },
  {
    n: 83,
    id: 'backwards-chimes-d',
    name: 'Backwards chimes {D}',
    kind: 'melodic',
    description:
      'Four short glass chimes over {D}, each followed two seconds later by itself played backwards; it comes round.',
    preset: 'soft-pedal-backwards-chimes',
    ...cycled(12, [
      [0, 1.5, 74, 0.7],
      [2.6, 1.5, 81, 0.6],
      [5.9, 1.5, 77, 0.65],
      [8.3, 1.5, 76, 0.6],
    ]),
  },
  {
    n: 84,
    id: 'slow-broken-chord-c',
    name: 'Slow broken chord {C}',
    kind: 'melodic',
    description:
      'A slow broken chord of {C} major seventh on vibraphone bars with a soft mallet and no motor, in a very long room.',
    preset: 'soft-pedal-motor-off-vibraphone',
    then: [NARROW],
    ...played(
      12,
      [
        [0, 5, 48, 0.7],
        [0.9, 5, 55, 0.6],
        [2.2, 5, 64, 0.65],
        [3.0, 5, 71, 0.6],
        [5.4, 5, 67, 0.6],
      ],
      3,
    ),
  },
  {
    n: 85,
    id: 'rolled-harp-chord-dm',
    name: 'Rolled harp chord {D}m',
    kind: 'melodic',
    description:
      'A chord of {D} minor rolled by hand, slowing as it climbs to a last high {D}, with dark repeats and a long plate.',
    preset: 'soft-pedal-rolled-harp-chord',
    // Rolled by hand, slowing as it climbs: the instrument's own even roll is a pulse.
    set: { sweep: 0 },
    then: [NARROW],
    ...played(
      8,
      [
        [0, 3, 50, 0.7],
        [0.21, 3, 57, 0.6],
        [0.55, 3, 62, 0.6],
        [0.94, 3, 65, 0.65],
        [1.52, 3, 69, 0.7],
        [3.4, 3, 74, 0.6],
      ],
      2,
    ),
  },
  {
    n: 86,
    id: 'bent-silk-round-e',
    name: 'Bent silk round {E}',
    kind: 'melodic',
    description:
      'Silk strings touched lightly around {E}, each note leaning a little sharp after the pluck; it comes round.',
    preset: 'soft-pedal-bent-silk-strings',
    then: [pinned(8)],
    ...cycled(12, [
      [0, 2, 64, 0.7],
      [1.3, 2, 65, 0.6],
      [2.0, 2, 69, 0.65],
      [4.4, 2, 71, 0.7],
      [5.6, 2, 67, 0.6],
      [7.9, 2, 65, 0.6],
      [9.2, 2.5, 64, 0.65],
    ]),
  },
  {
    n: 87,
    id: 'harp-and-strings-f',
    name: 'Harp and strings {F}',
    kind: 'melodic',
    description:
      'Slow harp notes over {F}, a soft string section growing out of each and staying on in the hall; it comes round.',
    preset: 'soft-pedal-harp-and-strings',
    ...cycled(12, [
      [0.02, 2, 53, 0.7],
      [1.71, 2, 60, 0.6],
      [2.48, 2, 65, 0.65],
      [5.33, 2, 69, 0.7],
      [6.71, 2, 67, 0.6],
      [9.62, 2, 60, 0.6],
    ]),
  },
  {
    n: 88,
    id: 'far-hall-vibes-g',
    name: 'Far hall vibes {G}',
    kind: 'melodic',
    description:
      'A vibraphone with a soft mallet, motor off and pedal down, five notes over {G} in a cathedral.',
    preset: 'soft-pedal-far-hall-vibes',
    set: { mallet: 0.35 },
    ...played(
      10,
      [
        [0, 3, 67, 0.7],
        [1.4, 3, 62, 0.6],
        [3.1, 3, 71, 0.65],
        [3.9, 3, 74, 0.7],
        [6.2, 3, 67, 0.6],
      ],
      2,
    ),
  },
  {
    n: 89,
    id: 'throbbing-bars-am',
    name: 'Throbbing bars {A}m',
    kind: 'melodic',
    description:
      'A vibraphone with its motor turning twice a second, slow notes in {A} minor in a twelve second hall; it comes round.',
    preset: 'soft-pedal-throbbing-long-bars',
    ...cycled(12, [
      [0, 3, 57, 0.7],
      [1.7, 3, 64, 0.6],
      [2.8, 3, 69, 0.65],
      [5.5, 3, 67, 0.6],
      [7.1, 3, 60, 0.65],
      [9.8, 2, 62, 0.6],
    ]),
  },
  {
    n: 90,
    id: 'lid-down-celesta-c',
    name: 'Lid down celesta {C}',
    kind: 'melodic',
    description:
      'A celesta played quietly climbs a chord of {C} to the octave and steps back down, in a long dull plate.',
    preset: 'soft-pedal-lid-down-celesta',
    set: { decay: 2.2 },
    then: [NARROW],
    ...played(
      8,
      [
        [0, 1.5, 72, 0.7],
        [0.7, 1.5, 76, 0.6],
        [1.9, 1.5, 79, 0.65],
        [2.6, 1.5, 84, 0.7],
        [4.3, 1.5, 83, 0.6],
        [5.5, 2, 79, 0.6],
      ],
      1.5,
    ),
  },
  {
    n: 91,
    id: 'long-room-nylon-am',
    name: 'Long room nylon {A}m',
    kind: 'melodic',
    description:
      'A nylon guitar under the thumb steps down from {C} over a low {A} to the open fifth, in a sixteen second room.',
    preset: 'soft-pedal-long-room-nylon',
    then: [NARROW, pinned(4)],
    ...played(
      10,
      [
        [0, 4, 45, 0.6],
        [0.05, 2, 72, 0.7],
        [1.52, 2, 71, 0.6],
        [2.31, 2, 69, 0.65],
        [4.37, 3, 64, 0.7],
        [5.93, 3, 57, 0.6],
      ],
      2,
    ),
  },
  {
    n: 92,
    id: 'steel-held-over-g',
    name: 'Steel held over {G}',
    kind: 'melodic',
    description:
      'Steel strings with the pick softened, a few notes over {G} caught and held as a dark bed; it comes round.',
    preset: 'soft-pedal-steel-held-over',
    ...cycled(12, [
      [0, 3, 43, 0.7],
      [0.06, 3, 55, 0.6],
      [2.4, 3, 62, 0.6],
      [3.7, 3, 59, 0.65],
      [6.6, 3, 64, 0.6],
      [8.9, 3, 62, 0.6],
    ]),
  },
  {
    n: 93,
    id: 'two-slow-strums-em',
    name: 'Two slow strums {E}m',
    kind: 'melodic',
    description:
      'A clean guitar strums {E} minor seventh, then {A} minor seventh, in an ensemble chorus, tape echo and a long plate.',
    preset: 'soft-pedal-chorus-guitar-wash',
    ...played(
      10,
      [
        [0, 3, 52],
        [0, 3, 59],
        [0, 3, 62],
        [0, 3, 67],
        [3.7, 3, 57],
        [3.7, 3, 60],
        [3.7, 3, 64],
        [3.7, 3, 67],
      ],
      2,
    ),
  },
  {
    n: 94,
    id: 'volume-pedal-line-c',
    name: 'Volume pedal line {C}',
    kind: 'melodic',
    description:
      'Four guitar notes over {C} faded in so no pick is heard, thickly doubled in a twenty second room; it comes round.',
    preset: 'soft-pedal-volume-pedal-guitar',
    then: [NARROW],
    ...cycled(
      12,
      [
        [0, 3.5, 48, 0.7],
        [2.9, 3, 55, 0.65],
        [5.3, 3.5, 64, 0.7],
        [8.6, 3, 60, 0.6],
      ],
      { crossfadeSec: 0.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 95,
    id: 'fingertip-pan-round-d',
    name: 'Fingertip pan round {D}',
    kind: 'melodic',
    description:
      'A steel pan touched with the fingertips circles {D} while its last notes loop underneath at half speed; it comes round.',
    preset: 'soft-pedal-fingertip-pan-loop',
    ...cycled(
      12,
      [
        [0, 2, 50, 0.7],
        [1.1, 2, 57, 0.55],
        [1.8, 2, 60, 0.6],
        [3.9, 2, 64, 0.65],
        [4.7, 2, 62, 0.55],
        [6.8, 2, 57, 0.6],
        [8.0, 2, 65, 0.6],
        [10.1, 2, 64, 0.55],
      ],
      { crossfadeSec: 0.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 96,
    id: 'gliding-synth-line-a',
    name: 'Gliding synth line {A}',
    kind: 'melodic',
    description:
      'One synth voice gliding between five slow notes from {A}, its filter opening on each, in a cathedral; it comes round.',
    preset: 'soft-pedal-gliding-synth-line',
    ...cycled(
      12,
      [
        [0, 3, 57, 0.7],
        [3.2, 2, 64, 0.6],
        [5.4, 2.5, 65, 0.65],
        [8.1, 2, 64, 0.6],
        [10.2, 1.6, 60, 0.6],
      ],
      { crossfadeSec: 0.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 97,
    id: 'smeared-wind-chimes-a',
    name: 'Smeared wind chimes {A}',
    kind: 'melodic',
    description:
      'Wind chimes tuned to {A} and {E}, struck now and then at a distance and smeared into a cloud of grains, looping.',
    preset: 'soft-pedal-smeared-wind-chimes',
    then: [NARROW],
    ...looped(8, 6, 3, [69, 76]),
  },
  {
    n: 98,
    id: 'closed-bridge-lute-d',
    name: 'Closed bridge lute {D}',
    kind: 'melodic',
    description:
      'A drone lute on {D} with little buzz at the bridge, its four slow plucks doubled wide in a cathedral, looping.',
    preset: 'soft-pedal-closed-bridge-drone',
    // One round of the four strings to a loop.
    set: { speed: 8 },
    ...looped(8, 8, 0.25, [50]),
  },
  {
    n: 99,
    id: 'hammered-round-c',
    name: 'Hammered round {C}',
    kind: 'melodic',
    description:
      'Single strings struck with a felt hammer wander over {C} major with detuned copies, in a cathedral; it comes round.',
    preset: 'soft-pedal-small-hammered-piano',
    ...cycled(12, [
      [0, 3, 60, 0.7],
      [1.2, 3, 67, 0.6],
      [2.9, 3, 72, 0.65],
      [4.0, 3, 71, 0.6],
      [6.7, 3, 64, 0.65],
      [8.2, 3, 67, 0.6],
      [10.4, 1.5, 62, 0.55],
    ]),
  },
  {
    n: 100,
    id: 'bell-tine-phrase-e',
    name: 'Bell tine phrase {E}',
    kind: 'melodic',
    description:
      'Bell-like tines from a high {E}, four soft notes with a faint octave rising in the long tail behind them.',
    preset: 'soft-pedal-bell-tine-afterglow',
    ...played(
      10,
      [
        [0, 2, 76, 0.7],
        [1.6, 2, 72, 0.6],
        [2.5, 2, 79, 0.65],
        [5.0, 3, 74, 0.6],
      ],
      2,
    ),
  },
])
