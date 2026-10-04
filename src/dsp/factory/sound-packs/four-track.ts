// The sounds of the pack "Coast Fog Four-Track": its presets played, a hundred sounds to
// paint with. Numbers 8001 to 8100.

import { PRESETS } from '../packs/four-track'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('four-track', 8000, PRESETS, [
  // Drones: what holds still under the song. Most of this pack wavers (a plate, a cassette),
  // so these are the presets that keep their level: one note, one player on it, in a hall that
  // stands still, turned over the loop so that it meets itself: by three quarters of a cycle,
  // not one, where a quarter leaves the wave too loud for its peak in some keys.
  {
    n: 1,
    id: 'drone-under-the-song-e',
    name: 'Drone under the song {E}',
    kind: 'drone',
    description: 'Low organ ranks on one {E}, weighted by a tape preamp, in a dark hall.',
    preset: 'four-track-drone-under-the-song',
    // No second rank beating against the first, an even bellows, and a hall that does not stir in
    // place of the reverb that breathes: with any of the three it is a pad in some key.
    set: { celeste: 0, bellows: 0 },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.45, lowBump: 0.1, tone: 0, output: -4.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
      quarterTurn(8 / 3),
    ],
    // One note: two notes each tuned to whole cycles are a cycle or two apart in some keys, and
    // an octave then beats once a loop.
    ...looped(8, 6, 3, [40]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'one-low-string-d',
    name: 'One low string {D}',
    kind: 'drone',
    description: 'One low {D} bowed lightly with no vibrato on cassette, in a stone hall.',
    preset: 'four-track-one-low-string',
    set: { vibrato: 0 },
    // A cassette that hardly wavers and does not drop out: the level under one bow holds still.
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.1, wear: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
      quarterTurn(8),
    ],
    ...looped(8, 5, 3, [38]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'minor-under-hiss-am',
    name: 'Minor under hiss {A}m',
    kind: 'drone',
    description:
      'A dark just {A} minor chord over its sub octave with tape hiss on top, in a reverb that breathes.',
    preset: 'four-track-minor-under-hiss',
    // Louder against the hiss and with no air of its own, or the hiss is all the analysis hears.
    set: { movement: 0.2, air: 0, volume: -3 },
    effects: [
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -44 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } },
    ],
    ...looped(8, 7, 3, [45]),
  },
  {
    n: 4,
    id: 'sub-under-the-tape-c',
    name: 'Sub under the tape {C}',
    kind: 'drone',
    description:
      'A soft sub tone on a low {C} with the filter barely open, fattened by the head bump of a cassette.',
    preset: 'four-track-sub-under-the-tape',
    set: { beat: 0, cutoff: 420, wave: 0 },
    // Pushed less hard onto the tape than the preset: flattened tops make a still tone too loud.
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { bump: 0.8, hiss: 0.3, drive: 0.2, wow: 0.1, flutter: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      quarterTurn(8 / 3),
    ],
    ...looped(8, 4, 3, [36]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'bellows-close-up-c',
    name: 'Bellows close up {C}',
    kind: 'drone',
    description:
      'A harmonium on one {C} with the microphone almost inside it: reeds, wind and air.',
    preset: 'four-track-bellows-close-up',
    // Less wind than the preset's (an octave lower the wind is all the analysis hears), an even
    // bellows and no second rank beating.
    set: { bellows: 0, breath: 0.4, celeste: 0 },
    effects: [
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -46 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
      quarterTurn(8 / 3),
    ],
    ...looped(8, 4, 2, [48]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'sub-and-tape-weight-g',
    name: 'Sub and tape weight {G}',
    kind: 'drone',
    description:
      'A square wave and its sub octave on {G}, {D} and {A}, thickened by a tape preamp, in a hall.',
    preset: 'four-track-sub-and-tape-weight',
    // No chorus: nothing moves, so the tones meet themselves at the fold in every key.
    set: { chorus: 0 },
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, quarterTurn(8 / 3)],
    ...looped(8, 5, 3, [43, [50, 0.8], [57, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'one-finger-held-g',
    name: 'One finger held {G}',
    kind: 'drone',
    description: 'A single thin reed held on {G} with no sub, on cassette, in a hall.',
    preset: 'four-track-one-finger-organ',
    // One rank and an even bellows, a cassette that hardly wavers and a hall in place of the
    // chorus and the chapel that sings: nothing moves, so the reed meets itself at the fold.
    set: { celeste: 0, bellows: 0 },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { noise: 0.3, wobble: 0.1, wear: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
      quarterTurn(8 / 3),
    ],
    ...looped(8, 4, 3, [55]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'low-pipes-held-f',
    name: 'Low pipes held {F}',
    kind: 'drone',
    description: 'Slow dull pipes on one low {F}, on cassette, in a small dark room.',
    preset: 'four-track-pipes-on-worn-tape',
    // One rank and an even bellows, and a cassette in place of the loop of worn-out tape, which
    // wavers as it likes: nothing moves, so the pipes meet themselves at the fold.
    set: { celeste: 0, bellows: 0 },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { noise: 0.3, wobble: 0.1, wear: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { damping: 2500, mix: 0.3 } },
      quarterTurn(8 / 3),
    ],
    ...looped(8, 6, 3, [41]),
    tuning: 'whole-cycles',
  },
  {
    n: 9,
    id: 'still-fold-g',
    name: 'Still fold {G}',
    kind: 'drone',
    description:
      'One {G} folded over on itself and held nearly still, on a hissing cassette in a small dark room.',
    preset: 'four-track-folding-drone-dark-well',
    // The fold kept where it is, a cassette that hardly wavers and a small room that does not
    // stir in place of the cave of echoes: nothing moves, so the tone meets itself at the fold.
    // Folded further and modulated more than the preset, with the cassette's hiss up and a slight
    // breath: a plainer wave is too loud for its peak.
    set: { drift: 0, chance: 0, fold: 0.7, fm: 0.3 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.05, flutter: 0.05, age: 0, hiss: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { damping: 2500, mix: 0.3 } },
      breathe(0.125, 0.2),
      quarterTurn(8 / 3),
    ],
    ...looped(8, 6, 3, [55]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'harbour-horn-c',
    name: 'Far harbour horn {C}',
    kind: 'drone',
    description: 'One low brass player on {C}, with far scattered echoes as if over water.',
    preset: 'four-track-harbour-horn',
    set: { section: 0, breath: 0.08 },
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3, modDepth: 0, width: 0.5 } },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -42 } },
      quarterTurn(8 / 3),
    ],
    ...looped(8, 7, 3, [48]),
    tuning: 'whole-cycles',
  },

  // Pads: chords and slow lines that waver the way the pack does, in a plate, on a cassette,
  // under a voice. The last few are played, not held: a line with no hard edge to its notes.
  {
    n: 11,
    id: 'guitar-haze-held-a',
    name: 'Guitar haze held {A}',
    kind: 'pad',
    description:
      'Two guitar strings on {A} and {E} held singing with a dull tone, rising and sinking in a long plate on cassette.',
    preset: 'four-track-sustained-guitar-haze',
    set: { detune: 0 },
    // A new cassette (a dropout under a held string is heard as a note), no preamp flattening
    // the tops, and narrowed: the plate alone is wider than the strings in it.
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.2, age: 0 } },
      { deviceId: 'stereo-widener', params: { width: 0.25 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 6, 3, [45, [52, 0.7]]),
  },
  {
    n: 12,
    id: 'dark-well-fold-d',
    name: 'Dark well fold {D}',
    kind: 'pad',
    description:
      'A {D} that folds over on itself in a dark cave of short echoes, rising and sinking on cassette.',
    preset: 'four-track-folding-drone-dark-well',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.15 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 6, 3, [50]),
  },
  {
    n: 13,
    id: 'cellos-down-the-hall-e',
    name: 'Cellos down the hall {E}',
    kind: 'pad',
    description:
      'String machine cellos on {E} and {B} from a speaker down a corridor, swelling, with tape hiss in front.',
    preset: 'four-track-cellos-down-the-hall',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }, breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [52, [59, 0.8]]),
  },
  {
    n: 14,
    id: 'pump-organ-murk-f',
    name: 'Pump organ murk {F}',
    kind: 'pad',
    description:
      'A fifth on {F} on the pump organ with its tone shut, the bellows uneven, on cassette in a long plate.',
    preset: 'four-track-pump-organ-murk',
    // Narrowed: lower down the plate's tail is wider than the organ in it.
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }, breathe(0.125, 0.3)],
    ...looped(8, 5, 3, [53, [60, 0.7]]),
  },
  {
    n: 15,
    id: 'fog-voice-am',
    name: 'Fog voice {A}m',
    kind: 'pad',
    description:
      'A soft section on a closed vowel holding {A} minor, breathy, on cassette, far back in a long plate.',
    preset: 'four-track-fog-voice',
    set: { ensemble: 0, vibrato: 0 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }, breathe(0.125, 0.3)],
    ...looped(8, 6, 3, [57, [60, 0.8], [64, 0.8]]),
  },
  {
    n: 16,
    id: 'low-hymn-d',
    name: 'Low hymn {D}',
    kind: 'pad',
    description:
      'Low voices on a closed oh holding {D} and {A}, through a worn cassette into a long dark hall.',
    preset: 'four-track-low-hymn',
    set: { ensemble: 0 },
    // The cassette less worn (its dropouts under held voices are heard as notes) and a hall that
    // lets the voices in evenly.
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35, wear: 0.15 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 7, damping: 0.65, mix: 0.45, breathDepth: 0 },
      },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 7, 3, [50, 57, [62, 0.7]]),
  },
  {
    n: 17,
    id: 'keys-caught-in-fog-em7',
    name: 'Keys caught in fog {E}m7',
    kind: 'pad',
    description:
      'A soft {E} minor seventh on the electric piano that a sustainer keeps under itself; it comes round.',
    preset: 'four-track-keys-caught-in-fog',
    // The sustainer lets go sooner than the preset's: what it holds is the same from round to round.
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 0.8, decay: 14, mix: 0.65 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 6, mix: 0.35 } },
    ],
    // The chord is struck a third of the way round: a loop that opens on the strike and has
    // faded by its end is a one-shot to the analysis.
    ...cycled(
      8,
      [
        [2.6, 5, 52, 0.7],
        [2.63, 5, 59, 0.6],
        [2.66, 5, 62, 0.6],
        [2.7, 5, 67, 0.65],
      ],
      // Two rounds before the one that is kept: the sustainer holds the third as it will the fourth.
      { passes: 2 },
    ),
  },
  {
    n: 18,
    id: 'monochord-and-hiss-g',
    name: 'Monochord and hiss {G}',
    kind: 'pad',
    description:
      'Plain strings on {G} and {D} plucked slowly and detuned so they beat, deep in a very large dark room, on cassette.',
    preset: 'four-track-monochord-and-hiss',
    // One round of the four strings to the loop, and louder against a fainter hiss: a fourth
    // lower the hiss is all the analysis hears.
    set: { speed: 8.09, volume: -3 },
    // A very large dark room, nearly all of it and kept narrow, in place of the preset's reverb,
    // whose tail slides down through the black keys: the plucks are heard only through the room,
    // with no edge to them. The cassette after it wavers, so one round does not meet the next in step.
    effects: [
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, density: 1, modDepth: 0.2, highCut: 2500, width: 0.3, mix: 0.9 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3, age: 0 } },
      breathe(0.125, 0.3),
    ],
    // The room takes two rounds of the strings to fill: the loop starts when it has.
    ...looped(8, 14, 2, [55]),
  },
  {
    n: 19,
    id: 'overcast-pad-dm7',
    name: 'Overcast pad {D}m7',
    kind: 'pad',
    description:
      'A dark {D} minor seventh that never opens far, in a long damped room recorded to cassette.',
    preset: 'four-track-overcast-pad',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }, breathe(0.125, 0.45)],
    ...looped(8, 7, 3, [50, 57, [60, 0.8], [65, 0.7]]),
  },
  {
    n: 20,
    id: 'hummed-chord-fmaj7',
    name: 'Hummed chord {F}maj7',
    kind: 'pad',
    description:
      'A resonant pad on {F} major seventh voiced like closed-mouth humming, a hall singing oo behind it.',
    preset: 'four-track-hummed-chord',
    // The cassette less worn: its dropouts under a held chord are heard as notes.
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 7, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35, wear: 0.1 } },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 5, 3, [53, 60, [64, 0.8], [69, 0.7]]),
  },
  {
    n: 21,
    id: 'borrowed-strings-am7',
    name: 'Borrowed strings {A}m7',
    kind: 'pad',
    description:
      'A plain sawtooth pad on {A} minor seventh under both choruses, through a worn cassette into a long plate.',
    preset: 'four-track-borrowed-string-pad',
    set: { sub: 0 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }, breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [45, 52, [55, 0.8], [60, 0.8], [64, 0.7]]),
  },
  {
    n: 22,
    id: 'sagging-tape-pad-csus2',
    name: 'Sagging tape pad {C}sus2',
    kind: 'pad',
    description:
      'Two detuned saws on {C}, {G} and {D} behind a low filter, rising and sinking on a cassette that sags.',
    preset: 'four-track-warm-pad-sagging-tape',
    // The filter comes round once a loop and the pan twice; louder against the hiss.
    set: { lfo1Rate: 0.125, lfo2Rate: 0.25, volume: -4, osc2Fine: 4 },
    // A tape that sags as far but does not drop out.
    effects: [
      {
        deviceId: 'tape',
        preset: 'Seasick',
        params: { wow: 0.5, speed: 3, hiss: 0.15, age: 0.05 },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 9, mix: 0.4 } },
      breathe(0.125, 0.5),
    ],
    // Fifths only: the thirds and sevenths of a fuller chord beat fast in their upper partials,
    // and higher up each beat is heard as a note.
    ...looped(8, 6, 3, [48, 55, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 23,
    id: 'slow-glass-chord-gadd9',
    name: 'Slow glass chord {G}add9',
    kind: 'pad',
    description:
      'Detuned glass tones on {G} with an added ninth, beating slowly through a cassette into a damped hall.',
    preset: 'four-track-slow-glass-chord',
    // The cassette less worn: its dropouts under a held chord are heard as notes.
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.55, wear: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 6, 3, [55, 62, [69, 0.8], [71, 0.7]]),
  },
  {
    n: 24,
    id: 'lid-shut-vowels-csus4',
    name: 'Lid-shut vowels {C}sus4',
    kind: 'pad',
    description:
      'A wavetable on {C}, {F} and {G} moving between vowels behind a low filter, on cassette in a damped hall.',
    preset: 'four-track-vowel-pad-lid-shut',
    // One slow turn of the vowels in sixteen seconds, from a darker vowel and with less of it: at the
    // preset's settings the two oscillators beat in the upper formants and each beat is heard as a note.
    // The vowels bring out the fifth harmonic, a white key over these three.
    set: { rate: 0.0625, motion: 0.15, position: 0.5, detune: 4 },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3, age: 0.05 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 6, damping: 0.6, mix: 0.4, breathDepth: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      breathe(0.0625, 0.5),
    ],
    ...looped(16, 5, 3, [48, 55, [60, 0.8], [65, 0.7]]),
  },
  {
    n: 25,
    id: 'hollow-fog-dsus2',
    name: 'Hollow fog {D}sus2',
    kind: 'pad',
    description:
      'Hollow tones on {D}, {A} and {E} under a low filter, doubled a few cents apart, in a very large room.',
    preset: 'four-track-hollow-fog',
    // The table moves less and the two oscillators sit closer than the preset's: higher up their
    // beats are heard as notes.
    set: { rate: 0.125, motion: 0.3, detune: 6 },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 3000, width: 0.6, mix: 0.4 },
      },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3, wear: 0.1 } },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 6, 3, [50, 57, [64, 0.8], [69, 0.6]]),
  },
  {
    n: 26,
    id: 'string-machine-murk-am',
    name: 'String machine murk {A}m',
    kind: 'pad',
    description:
      'A string machine on {A} minor with the tone shut, on cassette, in a reverb whose tail sinks an octave.',
    preset: 'four-track-string-machine-murk',
    // Less of the ensemble than the preset's: lower down it blurs the chord until the analysis
    // hears no pitch in it.
    set: { ensemble: 0.6 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [45, 52, [57, 0.8], [60, 0.8]]),
  },
  {
    n: 27,
    id: 'muted-five-cadd9',
    name: 'Muted five {C}add9',
    kind: 'pad',
    description:
      'Five muted players on each note of {C} with an added ninth, swelling slowly on cassette in a hall.',
    preset: 'four-track-muted-five-on-cassette',
    set: { volume: -5, air: 0.1, scatter: 0.3 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [48, 55, [62, 0.8], [64, 0.8]]),
  },
  {
    n: 28,
    id: 'vowels-in-the-hall-fadd9',
    name: 'Vowels in hall {F}add9',
    kind: 'pad',
    description:
      'A section on {F} with an added ninth drifting from vowel to vowel, in a hall that sings them back.',
    preset: 'four-track-vowels-in-the-hall',
    set: { ensemble: 0, vibrato: 0 },
    then: [breathe(0.0625, 0.4)],
    ...looped(16, 6, 3, [53, 60, [67, 0.8], [69, 0.7]]),
  },
  {
    n: 29,
    id: 'slowed-chorus-c',
    name: 'Slowed chorus {C}',
    kind: 'pad',
    description:
      'High voices on {C} major heard again from cassette at half speed, an octave down, in a long plate.',
    preset: 'four-track-slowed-chorus',
    set: { ensemble: 0, vibrato: 0 },
    // The slowed voices kept near the middle and less of the plate than the preset's: a fourth
    // lower the two sides were out of step in the bass.
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.25 } },
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { highCut: 4500, spread: 0.2, mix: 0.85 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'stereo-widener', params: { width: 0.15 } },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 7, 3, [60, 67, [72, 0.8], [76, 0.7]]),
  },
  {
    n: 30,
    id: 'tape-choir-far-back-dm7',
    name: 'Far tape choir {D}m7',
    kind: 'pad',
    description:
      'A small choir from tape holding {D} minor seventh, far back in a long plate with the top taken off.',
    preset: 'four-track-tape-choir-far-back',
    // The tape under each key never runs out, and is not so old that it drops out; few singers, close together.
    set: { length: 9, age: 0, vibrato: 0.1, players: 0.2, spread: 0.3 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [62, 65, [69, 0.8], [72, 0.7]]),
  },
  {
    n: 31,
    id: 'volume-knob-swell-em',
    name: 'Volume knob swell {E}m',
    kind: 'pad',
    description:
      'A guitar chord of {E} minor faded in by hand, a hall humming oo behind it; it comes round.',
    preset: 'four-track-volume-knob-swell',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 9, mix: 0.45 } },
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wobble: 0.35, wear: 0.2, output: 5 },
      },
    ],
    ...cycled(8, [
      [0, 6.5, 40, 0.7],
      [0, 6.5, 47, 0.7],
      [0, 6.5, 52, 0.65],
      [0, 6.5, 55, 0.65],
      [0, 6.5, 59, 0.6],
      [0, 6.5, 64, 0.6],
    ]),
  },
  {
    n: 32,
    id: 'steel-in-a-plate-gsus2',
    name: 'Steel in a plate {G}sus2',
    kind: 'pad',
    description:
      'A steel guitar on {G}, {D} and {A} faded in with no vibrato, ringing in a long plate on cassette; it comes round.',
    preset: 'four-track-steel-in-the-plate',
    set: { swell: 1.5 },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.5 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3, age: 0.05 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    // Picked again every round and faded in each time: a ring held over the fold started loud
    // and ended soft, and higher up the step between the two was heard as a note.
    ...cycled(8, [
      [0, 7.2, 43],
      [0, 7.2, 50],
      [0, 7.2, 57, 0.8],
      [0, 7.2, 62, 0.7],
    ]),
  },
  {
    n: 33,
    id: 'fuzzed-combo-organ-f',
    name: 'Fuzzed combo organ {F}',
    kind: 'pad',
    description:
      'A reedy organ chord of {F} major with a dark fuzz laid over it, swelling in a long spring on cassette.',
    preset: 'four-track-fuzzed-combo-organ',
    // A newer cassette than the preset's: its dropouts under a held chord are heard as notes.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Dark fuzz',
        params: { drive: 0.3, output: -13, mix: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3, age: 0.05 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 5, 3, [53, 60, [65, 0.8], [69, 0.7]]),
  },
  {
    n: 34,
    id: 'pipes-on-worn-tape-gsus4',
    name: 'Pipes, worn tape {G}sus4',
    kind: 'pad',
    description:
      'Slow dull pipes on {G} with a fourth, caught on worn-out tape that wavers under them, in a small dark room.',
    preset: 'four-track-pipes-on-worn-tape',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 8, 3, [43, 50, [55, 0.8], [60, 0.7]]),
  },
  {
    n: 35,
    id: 'tremulant-far-end-am',
    name: 'Tremulant, far end {A}m',
    kind: 'pad',
    description:
      'A flute rank on a high {A} minor shaking under its tremulant, at the far end of a cathedral.',
    preset: 'four-track-tremulant-far-end',
    then: [breathe(0.125, 0.5), quarterTurn(8)],
    ...looped(8, 5, 3, [[57, 0.6], 69, [72, 0.8], [76, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 36,
    id: 'dubbed-voices-a',
    name: 'Dubbed voices {A}',
    kind: 'pad',
    description:
      'The choir drone on {A} on a wavering loop, dubbed to cassette, summed to mono and put in a long plate.',
    preset: 'four-track-dubbed-to-one-track',
    source: 'choir-drone-a',
    // A long splice and less wobble than the preset's, which is heard as notes; louder against the hiss.
    set: { volume: -15, crossfade: 500, wobble: 0.3 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 3, 3, [60]),
  },
  {
    n: 37,
    id: 'slowed-voices-dsus2',
    name: 'Slowed voices {D}sus2',
    kind: 'pad',
    description:
      'The treble voices on {D}, {A} and {E} an octave down, smeared into long overlapping grains, in a damped hall.',
    preset: 'four-track-slowed-sample-smear',
    source: 'treble-voices-dsus2',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 38,
    id: 'stilled-strum-em',
    name: 'Stilled strum {E}m',
    kind: 'pad',
    description:
      'One moment of the guitar chord on {E} minor kept still, with no top, on cassette in a very large dark room.',
    preset: 'four-track-loaded-sound-stilled',
    source: 'guitar-chord-em',
    // A moment soon after the strum, while the strings are loud, and louder against the hiss.
    set: { position: 0.2, volume: -10 },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3, age: 0.05 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 3200, width: 0.5, mix: 0.4 },
      },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 39,
    id: 'backwards-keys-dm9',
    name: 'Backwards keys {D}m9',
    kind: 'pad',
    description:
      'The electric piano on {D} minor ninth played backwards in long grains, through a worn cassette into a hall that hums.',
    preset: 'four-track-backwards-on-cassette',
    source: 'electric-piano-dm9',
    // The grains stay near one place in the chord and overlap deeply: travelling through it the two
    // ends of the loop differ, and few grains at a time are heard one by one.
    set: { position: 0.25, scan: 0, size: 1600, density: 14, spray: 0.5 },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.35, wear: 0.15 } },
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { decay: 8, highCut: 5000, mix: 0.4 },
      },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 40,
    id: 'heard-through-plaster-c',
    name: 'Through plaster {C}',
    kind: 'pad',
    description:
      'Voices holding {C} and {G} in the next room: down a corridor, nothing above two kilohertz, tape hiss in front.',
    preset: 'four-track-heard-through-plaster',
    set: { ensemble: 0, vibrato: 0 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [48, 55, [60, 0.8], [67, 0.7]]),
  },
  {
    n: 41,
    id: 'sung-in-rounds-am',
    name: 'Sung in rounds {A}m',
    kind: 'pad',
    description:
      'A sung line in {A} minor caught on a three-second tape loop, each note laid over the last; it comes round.',
    preset: 'four-track-sung-in-rounds',
    // Each note comes in slowly, with no edge to it.
    set: { attack: 0.9 },
    // The loop fades faster than the preset's, so one round is like the next.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 3, feedback: 0.55, wear: 0.55, spread: 0.5, mix: 0.5 },
      },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { highCut: 5000, mix: 0.35 } },
    ],
    ...cycled(12, [
      [0, 1.6, 69, 0.8],
      [2.1, 1.3, 72, 0.75],
      [3.9, 2.2, 71, 0.8],
      [6.8, 1.5, 67, 0.7],
      [8.6, 2.4, 64, 0.75],
    ]),
  },
  {
    n: 42,
    id: 'backwards-strum-f',
    name: 'Backwards strum {F}',
    kind: 'pad',
    description:
      'A strum of {F} major seventh and one of {C}, each coming back reversed and swelling to where it began; it comes round.',
    preset: 'four-track-backwards-strum',
    // Eight turns of the reversing to the loop.
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Slow swells',
        params: { time: 1500, spread: 0, mix: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.85, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      { deviceId: 'stereo-widener', params: { width: 0.2 } },
    ],
    ...cycled(12, [
      [0, 5, 41, 0.75],
      [0, 5, 48, 0.7],
      [0, 5, 53, 0.65],
      [0, 5, 57, 0.65],
      [0, 5, 60, 0.6],
      [0, 5, 64, 0.6],
      [6.1, 5, 48, 0.75],
      [6.1, 5, 55, 0.7],
      [6.1, 5, 60, 0.65],
      [6.1, 5, 64, 0.65],
      [6.1, 5, 67, 0.6],
      [6.1, 5, 72, 0.6],
    ]),
  },
  {
    n: 43,
    id: 'strum-plate-at-night-c',
    name: 'Strum plate at night {C}',
    kind: 'pad',
    description:
      'A slow sweep up and down soft strings on {C} and {G} and then on {A} and {E}, through a worn cassette; it comes round.',
    preset: 'four-track-strum-plate-at-night',
    // The pad under the strings all the way up, the strings duller and more of the hall than the
    // preset has: the plucks of the sweep are not heard one by one. Open fifths: a seventh chord
    // spread over four octaves is too many notes for the analysis to hear a pitch in.
    set: { pad: 1, tone: 0.1 },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3, wear: 0.15 } },
      {
        deviceId: 'shimmer',
        preset: 'Plain hall',
        params: { decay: 6, tone: 3500, width: 0.6, mix: 0.55 },
      },
    ],
    ...cycled(12, [
      [0, 4.5, 48],
      [0, 4.5, 55],
      [0, 4.5, 60],
      [6.2, 4.5, 45],
      [6.2, 4.5, 52],
      [6.2, 4.5, 57],
    ]),
  },
  {
    n: 44,
    id: 'low-reed-looped-f',
    name: 'Low reed, looped {F}',
    kind: 'pad',
    description:
      'A bass clarinet line from {F} on a tape loop four seconds long, so each note stays under the next; it comes round.',
    preset: 'four-track-low-reed-looped',
    set: { breath: 0.4 },
    // Three turns of the tape to the loop, fading faster than the preset's, so one round is like the next.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.5, wear: 0.5, spread: 0.15, mix: 0.45 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { damping: 0.6, mix: 0.3 } },
    ],
    ...cycled(12, [
      [0, 2.2, 53, 0.7],
      [2.7, 1.5, 60, 0.6],
      [4.5, 2.4, 57, 0.65],
      [7.6, 3, 62, 0.6],
    ]),
    // The tape wavers, so a round does not meet the next one in step: folded as two unlike stretches are.
    loopFold: 'power',
  },
  {
    n: 45,
    id: 'flugel-behind-a-door-a',
    name: 'Flugel behind a door {A}',
    kind: 'pad',
    description:
      'A breathy flugelhorn with the top shut out: up a fifth from {A} and held, then an answer falling back, in a long plate.',
    preset: 'four-track-flugel-behind-a-door',
    ...played(
      10,
      [
        [0, 1.2, 57, 0.6],
        [1.3, 2.4, 64, 0.9],
        [4.2, 0.9, 62, 0.6],
        [5.2, 2.8, 57, 0.7],
      ],
      3,
    ),
  },
  {
    n: 46,
    id: 'brushed-chord-wet-tape-f',
    name: 'Brushed chords {F}maj7',
    kind: 'pad',
    description:
      'Dull strings brushed on {F} major seventh then {E} minor seventh with the pluck faded out, a thin tape echo trailing.',
    preset: 'four-track-brushed-chord-wet-tape',
    ...played(
      12,
      [
        [0, 3, 53],
        [0, 3, 57],
        [0, 3, 60],
        [0, 3, 64],
        [4.6, 3, 52],
        [4.6, 3, 55],
        [4.6, 3, 59],
        [4.6, 3, 62],
      ],
      2.5,
    ),
  },

  // Textures: what the microphone heard between takes, and sounds washed out until no pitch is left.
  {
    n: 47,
    id: 'bow-hair-mist-g6',
    name: 'Bow hair mist {G}6',
    kind: 'texture',
    description:
      'Bows with almost no weight on {G} sixth: air and rosin smeared until the notes hang, in a damped hall.',
    preset: 'four-track-bow-hair-mist',
    ...looped(8, 6, 3, [55, 62, [67, 0.8], [71, 0.7], [76, 0.6]]),
  },
  {
    n: 48,
    id: 'roof-rain-to-cassette',
    name: 'Roof rain to cassette',
    kind: 'texture',
    description:
      'Steady rain on a roof through a cheap microphone, pushed hard onto cassette, with the small room it fell on.',
    preset: 'four-track-rain-on-the-recorder',
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 49,
    id: 'shore-heard-indoors',
    name: 'Shore heard indoors',
    kind: 'texture',
    description:
      'Slow waves heard from indoors with nothing above two kilohertz, a hall around them and tape hiss.',
    preset: 'four-track-shore-from-indoors',
    then: [soften(9)],
    ...looped(16, 4, 3, [48]),
  },
  {
    n: 50,
    id: 'porch-frogs-on-tape',
    name: 'Porch frogs on tape',
    kind: 'texture',
    description:
      'A pond full of frogs some way off, taped through an open door on cassette with a little of the room.',
    preset: 'four-track-frogs-past-the-porch',
    // A pond full: a few frogs close by are a phrase, not a texture.
    set: { density: 1 },
    ...looped(16, 3, 3, [43, 48, 55, 60, 65]),
  },
  {
    n: 51,
    id: 'thunder-out-at-sea',
    name: 'Thunder out at sea',
    kind: 'texture',
    description:
      'Thunder a long way off with the top taken away, rolling round a hall, tape hiss between the rolls.',
    preset: 'four-track-storm-out-at-sea',
    then: [soften(10)],
    ...looped(16, 2, 3, [36, 43, 48]),
  },
  {
    n: 52,
    id: 'wind-in-the-gutter-d',
    name: 'Wind in the gutter {D}',
    kind: 'texture',
    description:
      'Broad dark bands of noise on {D} and {A}, their pitch wandering like wind across a pipe, in a reverb that breathes.',
    preset: 'four-track-wind-in-the-gutter',
    ...looped(8, 5, 3, [38, 45]),
  },
  {
    n: 53,
    id: 'breath-and-hiss-am',
    name: 'Breath and hiss {A}m',
    kind: 'texture',
    description:
      'A whispered {A} minor, more air than note, with tape hiss that rises and falls with it, in a very large dark room.',
    preset: 'four-track-breath-and-hiss',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...looped(8, 6, 3, [57, 60, 64]),
  },
  {
    n: 54,
    id: 'whispered-chord-c',
    name: 'Whispered chord {C}',
    kind: 'texture',
    description:
      'Wide bands of noise around {C} and {G}, nearer to whispering than to pitch, on cassette in a long plate.',
    preset: 'four-track-whispered-chord',
    ...looped(8, 5, 3, [60, 67]),
  },
  {
    n: 55,
    id: 'breath-of-low-flutes-c',
    name: 'Breath of low flutes {C}',
    kind: 'texture',
    description:
      'Low flutes blown almost without tone on {C}, {G} and {D}, a chord of breath on cassette in a cathedral.',
    preset: 'four-track-breath-pad-on-tape',
    // Low in the flutes: higher up the tone comes through the breath.
    ...looped(8, 6, 3, [48, 55, 62]),
  },
  {
    n: 56,
    id: 'noise-and-one-note-d',
    name: 'Noise and one note {D}',
    kind: 'texture',
    description:
      'A low filtered {D} with noise mixed into it, smeared until it hardly moves, over a bed of dull tape hiss.',
    preset: 'four-track-noise-and-one-note',
    ...looped(8, 5, 3, [50]),
  },
  {
    n: 57,
    id: 'blank-cassette-hiss',
    name: 'Blank cassette hiss',
    kind: 'texture',
    description:
      'A blank cassette running: dull tape hiss that drifts in level, the faint hum of the machine under it, in a small room.',
    instrument: { deviceId: 'atmosphere', preset: 'Mains hum', params: { volume: -30 } },
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Wall of hiss',
        params: { level: -18, movement: 1, width: 0.4 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.8 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4000 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 3, 2, [43]),
  },
  {
    n: 58,
    id: 'stove-through-the-wall',
    name: 'Stove through the wall',
    kind: 'texture',
    description:
      'A wood stove ticking and crackling, taped from the next room on cassette with the top rolled off.',
    instrument: { deviceId: 'atmosphere', preset: 'Hearth', params: { width: 0.6 } },
    effects: [
      soften(10),
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3500 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 59,
    id: 'wind-at-the-sash',
    name: 'Wind at the sash',
    kind: 'texture',
    description:
      'Wind off the water leaning on a loose window: a moan that comes and goes, in a hall, with tape hiss.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { resonance: 0.4, tone: 0.35, size: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -8, highCut: 2500 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
    ],
    ...looped(16, 6, 3, [50]),
  },

  // One-shots: one note or one chord of the guitars, the pianos and the bells, left to ring out.
  {
    n: 60,
    id: 'spring-tank-strum-em',
    name: 'Spring tank strum {E}m',
    kind: 'oneshot',
    description:
      'Six strings on {E} minor drawn across once on the neck pickup, a long dark spring behind, on cassette.',
    preset: 'four-track-spring-tank-strum',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
    ],
    ...played(
      8,
      [
        [0, 5.5, 40, 0.8],
        [0, 5.5, 47, 0.75],
        [0, 5.5, 52, 0.7],
        [0, 5.5, 55, 0.7],
        [0, 5.5, 59, 0.65],
        [0, 5.5, 64, 0.65],
      ],
      2,
    ),
  },
  {
    n: 61,
    id: 'fuzz-under-fog-d',
    name: 'Fuzz under fog {D}',
    kind: 'oneshot',
    description:
      'A low {D} and its fifth strummed once into a dark fuzz and a long plate with the top taken off.',
    preset: 'four-track-fuzz-under-fog',
    set: { strum: 15 },
    // Less fuzz and less of the plate: at the preset's settings the chord holds its level and then
    // swells, and is no longer struck.
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { drive: 0.3, output: -7 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 3000 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(
      8,
      [
        [0, 1.5, 38, 0.8],
        [0, 1.5, 45, 0.75],
        [0, 1.5, 50, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 62,
    id: 'picked-far-plate-g',
    name: 'Picked, far plate {G}',
    kind: 'oneshot',
    description:
      'One soft {G} on the neck pickup with a short tape repeat and a late long plate, tape hiss under it.',
    preset: 'four-track-picked-far-plate',
    // Narrowed: higher up the plate alone is wider than the note in it.
    then: [{ deviceId: 'stereo-widener', params: { width: 0.25 } }],
    ...played(7, [[0, 3.5, 67]], 3),
  },
  {
    n: 63,
    id: 'porch-strum-g',
    name: 'Porch strum {G}',
    kind: 'oneshot',
    description:
      'A steel-string chord of {G} major strummed once with the fingers, on cassette, with a plate behind it.',
    preset: 'four-track-porch-strum',
    // Less of the plate than the preset's, a shorter one, and narrowed: the two sides of a long
    // plate's tail are out of step under the low string.
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.75, mix: 0.3 } },
      { deviceId: 'stereo-widener', params: { width: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 5, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0, 4, 43, 0.8],
        [0, 4, 50, 0.75],
        [0, 4, 55, 0.7],
        [0, 4, 59, 0.7],
        [0, 4, 62, 0.65],
        [0, 4, 67, 0.65],
      ],
      1.5,
    ),
  },
  {
    n: 64,
    id: 'low-tide-strum-dsus2',
    name: 'Low tide strum {D}sus2',
    kind: 'oneshot',
    description:
      'Twelve strings strummed once on {D}, {A} and {E} with the top rolled off, into a very large dark room.',
    preset: 'four-track-twelve-strings-low-tide',
    // The room denser and further back than the preset's: its first echoes came back as a second strum.
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 12, highCut: 3500, mix: 0.4, density: 1 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(
      10,
      [
        [0, 4, 50, 0.8],
        [0, 4, 57, 0.75],
        [0, 4, 62, 0.7],
        [0, 4, 64, 0.7],
        [0, 4, 69, 0.65],
      ],
      3,
    ),
  },
  {
    n: 65,
    id: 'nylon-under-vowels-e',
    name: 'Nylon under vowels {E}',
    kind: 'oneshot',
    description:
      'One round nylon {E} with only the body left, and a low hall that hums an oh after it.',
    preset: 'four-track-nylon-under-vowels',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 14, release: 0.3, ride: 0 },
      },
    ],
    ...played(7, [[0, 3, 52]], 2.5),
  },
  {
    n: 66,
    id: 'small-hours-keys-fmaj7',
    name: 'Small hours keys {F}maj7',
    kind: 'oneshot',
    description:
      'One dark chord of {F} major seventh struck firmly on the electric piano, on cassette in a long plate.',
    preset: 'four-track-small-hours-keys',
    // Struck harder and all at once, with hardly any tremolo and less of the plate than the
    // preset's: the chord is at its loudest at once, not when the plate has filled.
    set: { hardness: 0.85, tremolo: 0.1 },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(
      7,
      [
        [0, 4, 53, 0.75],
        [0, 4, 60, 0.65],
        [0, 4, 64, 0.65],
        [0, 4, 69, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 67,
    id: 'barked-chord-am7',
    name: 'Barked chord {A}m7',
    kind: 'oneshot',
    description:
      'An {A} minor seventh struck hard so the pickup barks, through a small speaker into a cathedral.',
    preset: 'four-track-barked-chords-far-off',
    // Spread wide at the bottom: with a third low down, a fourth lower the speaker turns the
    // chord to noise.
    ...played(
      7,
      [
        [0, 3, 45, 1],
        [0.01, 3, 52, 0.9],
        [0.02, 3, 60, 0.9],
        [0.03, 3, 64, 0.9],
        [0.04, 3, 67, 0.95],
      ],
      2.5,
    ),
  },
  {
    n: 68,
    id: 'half-speed-keys-g',
    name: 'Half-speed keys {G}',
    kind: 'oneshot',
    description:
      'One bell-like {G} on a seasick cassette, heard again at half speed an octave below, in a small dark plate.',
    preset: 'four-track-half-speed-keys',
    ...played(5, [[0, 2, 79]], 1.2),
  },
  {
    n: 69,
    id: 'upright-no-top-end-c',
    name: 'Upright, no top end {C}',
    kind: 'oneshot',
    description:
      'A low {C} in octaves on a felted upright heard from another room, the rumble of an empty room underneath.',
    preset: 'four-track-upright-no-top-end',
    // A firmer hammer and a thinner felt than the preset's: higher up the note was slow to
    // reach its loudest.
    set: { hardness: 0.45, felt: 0.6, outputDb: -5 },
    ...played(
      8,
      [
        [0, 4.5, 36, 0.8],
        [0, 4.5, 48, 0.7],
      ],
      3,
    ),
  },
  {
    n: 70,
    id: 'pedal-left-down-a',
    name: 'Pedal left down {A}',
    kind: 'oneshot',
    description:
      'One low {A} on an upright with the pedal down so every string answers, close on cassette in a small room.',
    preset: 'four-track-pedal-left-down',
    // A firmer hammer than the preset's, so the note is at its loudest at once in every key, and
    // played an octave lower than at first: there its level holds from key to key.
    set: { hardness: 0.65 },
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(10, [[0, 5, 33]], 3),
  },
  {
    n: 71,
    id: 'soft-pedal-note-e',
    name: 'Soft pedal note {E}',
    kind: 'oneshot',
    description:
      'One {E} with the soft pedal and thick felt, thump and key noise up close, printed hot to cassette.',
    preset: 'four-track-soft-pedal-sketch',
    // Played below the middle of the keyboard: higher up the note is lost under its own thump.
    ...played(4, [[0, 2.6, 52]], 0.8),
  },
  {
    n: 72,
    id: 'piano-under-plate-c',
    name: 'Piano under plate {C}',
    kind: 'oneshot',
    description: 'A plain upright chord of {C} major in a long plate, then worn by a cassette.',
    preset: 'four-track-piano-under-plate',
    // Less of the plate than the preset's, which arrives after the hammers and louder than they
    // are, and a cassette that does not drop out: the chord coming back was heard as a second one.
    // A shorter plate, and narrowed: the two sides of a long one's tail are out of step in the bass.
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { decay: 0.8, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3, wear: 0.1 } },
      { deviceId: 'stereo-widener', params: { width: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(
      10,
      [
        [0, 3, 48, 0.8],
        [0, 3, 55, 0.7],
        [0, 3, 64, 0.75],
        [0, 3, 72, 0.7],
      ],
      3,
    ),
  },
  {
    n: 73,
    id: 'piano-and-humming-f',
    name: 'Piano and humming {F}',
    kind: 'oneshot',
    description:
      'One felted {F} in octaves whose hall sings back on an open vowel, under steady tape hiss.',
    preset: 'four-track-piano-and-humming',
    // A thinner felt and a hall that rings less and sings back more quietly than the preset's,
    // and not played low: there the hall swelled past the hammers and the note had no start.
    set: { felt: 0.6 },
    effects: [
      {
        deviceId: 'vowel-reverb',
        preset: 'Choir of ah',
        params: { resonance: 0.3, decay: 9, highCut: 5000, mix: 0.3 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -46 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(
      10,
      [
        [0, 3.5, 65, 0.8],
        [0, 3.5, 77, 0.7],
      ],
      3,
    ),
  },
  {
    n: 74,
    id: 'blanketed-glass-a',
    name: 'Blanketed glass {A}',
    kind: 'oneshot',
    description:
      'One dull FM bell on {A} with a soft strike and no top, in a long plate on cassette.',
    preset: 'four-track-glass-under-a-blanket',
    // The two sides of the bell nearly in tune: at the preset's detune they cancel each other in mono.
    set: { detune: 1.5 },
    // Less of the plate than the preset's: in some keys it swelled past the strike.
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2500 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(8, [[0, 4, 69]], 2),
  },
  {
    n: 75,
    id: 'steel-pan-slowed-d',
    name: 'Steel pan, slowed {D}',
    kind: 'oneshot',
    description:
      'One tap on a handpan on {D}, taped and heard again at half speed an octave down, in a hall.',
    preset: 'four-track-steel-pan-slowed',
    ...played(8, [[0, 3, 62]], 2),
  },
  {
    n: 76,
    id: 'vibes-motor-off-b',
    name: 'Vibes, motor off {B}',
    kind: 'oneshot',
    description:
      'One soft mallet on a vibraphone bar on {B} with no motor, on cassette in a very long hall.',
    preset: 'four-track-vibes-motor-off',
    ...played(10, [[0, 5, 59]], 2.5),
  },
  {
    n: 77,
    id: 'attic-celesta-c',
    name: 'Attic celesta {C}',
    kind: 'oneshot',
    description:
      'One high {C} on a small celesta with tuned strings ringing after it, on a cassette that wobbles.',
    preset: 'four-track-celesta-in-the-attic',
    ...played(7, [[0, 2, 84]], 2),
  },
  {
    n: 78,
    id: 'bell-buoy-d',
    name: 'Bell buoy {D}',
    kind: 'oneshot',
    description:
      'A dull bell on {D} struck softly a long way out, with a far scattered echo and a little microphone air.',
    preset: 'four-track-bell-buoy',
    // Struck two thirds of the way up, where the partial a major tenth over the note is silent:
    // over D every other partial of this bell is a white key.
    set: { position: 0.667 },
    ...played(12, [[0, 8, 62]], 3),
  },
  {
    n: 79,
    id: 'silk-string-on-tape-c',
    name: 'Silk string on tape {C}',
    kind: 'oneshot',
    description:
      'One silk string on {C} that bends up a little after the pluck, on cassette, in a long plate.',
    preset: 'four-track-silk-strings-on-tape',
    set: { touch: 0.4, halo: 0.3 },
    ...played(7, [[0, 3, 60]], 2),
  },
  {
    n: 80,
    id: 'zither-on-the-stairs-f',
    name: 'Zither on the stairs {F}',
    kind: 'oneshot',
    description:
      'One strum of {F}, its fifth and its octave with a dull pick, on cassette, in a hall that rings for seven seconds.',
    preset: 'four-track-zither-on-the-stairs',
    set: { strum: 60 },
    ...played(9, [[0, 4, 53]], 2.5),
  },
  {
    n: 81,
    id: 'thumb-and-hiss-g',
    name: 'Thumb and hiss {G}',
    kind: 'oneshot',
    description:
      'A thumb on a low {G} steel string, close and almost dry, with tape hiss that swells as it dies.',
    preset: 'four-track-thumb-and-hiss',
    set: { volume: 6 },
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
    ],
    ...played(6, [[0, 3, 43]], 3),
  },

  // Phrases: a few notes in free time on the guitars, the pianos and what was overdubbed. Those
  // played with `cycled` come round; the rest ring out.
  {
    n: 82,
    id: 'picked-round-em',
    name: 'Picked round {E}m',
    kind: 'melodic',
    description:
      'Soft single notes on the neck pickup up through {E} minor and home, a short tape repeat and a late plate; it comes round.',
    preset: 'four-track-picked-far-plate',
    // Picked harder than the preset and with less of the plate, narrowed: each note is heard to
    // start, and the plate alone is wider than the guitar in it.
    set: { hardness: 0.6 },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 210, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 70, mix: 0.35 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
      { deviceId: 'stereo-widener', params: { width: 0.25 } },
    ],
    ...cycled(8, [
      [0.03, 2, 64, 0.7],
      [0.71, 1.5, 67, 0.6],
      [1.52, 2, 71, 0.7],
      [3.2, 1.6, 69, 0.6],
      [4.45, 1.4, 62, 0.6],
      [5.5, 2, 64, 0.7],
    ]),
  },
  {
    n: 83,
    id: 'delay-pedal-murk-dm',
    name: 'Delay pedal murk {D}m',
    kind: 'melodic',
    description:
      'Paired strings picked up through {D} minor and back into a long dull echo that blurs them; it comes round.',
    preset: 'four-track-delay-pedal-murk',
    // The echo a little further back than the preset's, and no two notes a repeat apart: as loud as
    // the strings and in step with them, its repeats are a pulse.
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { time: 780, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...cycled(8, [
      [0, 2.4, 50, 0.7],
      [0.41, 2, 57, 0.6],
      [1.33, 1.8, 65, 0.65],
      [3.02, 1.4, 64, 0.6],
      [3.61, 1.6, 60, 0.55],
      [5.47, 2.2, 62, 0.6],
    ]),
  },
  {
    n: 84,
    id: 'arpeggio-on-a-loop-em',
    name: 'Arpeggio on a loop {E}m',
    kind: 'melodic',
    description:
      'Short muted notes of {E} minor that a looper keeps under the hands at half speed; it comes round.',
    preset: 'four-track-arpeggio-on-a-loop',
    // Picked harder and louder against a fainter hiss, with the looper and the hall further back:
    // each note is heard to start and to have a pitch.
    set: { volume: 6, hardness: 0.7 },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 3, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.55, mix: 0.3 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -50, tone: -0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
    ],
    ...cycled(8, [
      [0, 0.5, 52, 0.7],
      [0.48, 0.5, 59, 0.6],
      [0.87, 0.5, 64, 0.65],
      [1.52, 0.6, 67, 0.6],
      [2.75, 0.5, 62, 0.55],
      [3.31, 0.5, 59, 0.6],
      [4.6, 0.5, 57, 0.6],
      [5.04, 0.6, 64, 0.65],
      [6.2, 0.8, 59, 0.55],
    ]),
  },
  {
    n: 85,
    id: 'picking-and-worn-echo-c',
    name: 'Picking, worn echo {C}',
    kind: 'melodic',
    description:
      'A steel-string figure opening upward over {C} and then over {F}, a thin wavering tape echo trailing it; it comes round.',
    preset: 'four-track-picking-and-worn-echo',
    // The echo further back than the preset's and at a time the figure does not share: as loud
    // as the strings, or in step with them, its repeats are a pulse.
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 470, feedback: 0.35, mix: 0.18 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.35 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    // The first note a moment after the loop starts: the nail on the string is a step, and would sit on the seam.
    ...cycled(8, [
      [0.04, 2, 48, 0.7],
      [0.67, 1.5, 55, 0.6],
      [1.21, 1.5, 64, 0.65],
      [2.3, 1.6, 62, 0.6],
      [4.05, 2, 53, 0.7],
      [4.83, 1.5, 60, 0.6],
      [5.31, 1.8, 69, 0.65],
      [6.52, 1.3, 67, 0.6],
    ]),
  },
  {
    n: 86,
    id: 'tremolo-and-spring-g',
    name: 'Tremolo and spring {G}',
    kind: 'melodic',
    description:
      'The electric piano under a deep tremolo: a fifth on {G}, three notes falling to it and one answer; it comes round.',
    preset: 'four-track-tremolo-and-spring',
    // Thirty-seven turns of the tremolo to the loop.
    set: { tremoloRate: 4.625 },
    ...cycled(8, [
      [0, 3, 55, 0.7],
      [0.04, 3, 62, 0.6],
      [1.48, 1.5, 71, 0.7],
      [2.61, 1.2, 69, 0.6],
      [3.4, 2.4, 67, 0.65],
      [5.33, 2.2, 64, 0.6],
    ]),
  },
  {
    n: 87,
    id: 'fifths-on-a-loop-d',
    name: 'Fifths on a loop {D}',
    kind: 'melodic',
    description:
      '{D} and {A} in fifths and octaves struck five times through the small speaker of the piano, on a tape loop; it comes round.',
    preset: 'four-track-electric-piano-drone',
    // Played into the speaker more quietly than the preset is, so that the speaker does not
    // flatten the strikes; and the loop fades faster, so one round is like the next.
    set: { volume: -13, decay: 1.6, release: 0.6 },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: {
          drive: 0.4,
          bass: 0.4,
          treble: -0.2,
          distance: 0.1,
          room: 0.2,
          noise: 0.1,
          output: 12,
        },
      },
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2.6, feedback: 0.4, wear: 0.45, mix: 0.18 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.3 } },
    ],
    // Five strikes, none where the tape brings an earlier one back: with three, and more of the
    // loop, only two were heard to start in some keys.
    ...cycled(8, [
      [0.5, 1.3, 50, 0.9],
      [0.53, 1.3, 57, 0.85],
      [2.02, 1.2, 57, 0.85],
      [2.05, 1.2, 62, 0.8],
      [3.41, 1.2, 62, 0.85],
      [3.44, 1.2, 69, 0.8],
      [5.13, 1.1, 57, 0.85],
      [5.16, 1.1, 62, 0.8],
      [6.38, 1.3, 50, 0.9],
      [6.41, 1.3, 62, 0.85],
    ]),
  },
  {
    n: 88,
    id: 'piano-loop-octave-down-em',
    name: 'Piano loop, low {E}m',
    kind: 'melodic',
    description:
      'An upright climbs over {E} and falls over {C}, each phrase returning from a tape loop an octave lower; it comes round.',
    preset: 'four-track-piano-loop-octave-down',
    // The loop fades faster than the preset's, so one round is like the next.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4, feedback: 0.5, wear: 0.6, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { damping: 0.5, mix: 0.3 } },
    ],
    ...cycled(12, [
      [0, 2.5, 52, 0.6],
      [0.06, 2.5, 59, 0.5],
      [1.19, 1.6, 67, 0.9],
      [2.52, 1.2, 69, 0.85],
      [3.23, 2.4, 71, 0.9],
      [6.2, 2.5, 48, 0.6],
      [6.27, 2.5, 55, 0.5],
      [7.91, 1.2, 71, 0.9],
      [8.62, 1.7, 69, 0.85],
      [10.45, 1.3, 64, 0.85],
    ]),
  },
  {
    n: 89,
    id: 'muted-harp-murk-am',
    name: 'Muted harp murk {A}m',
    kind: 'melodic',
    description:
      'Damped harp strings opening up through {A} minor into a murky echo that dulls with every repeat; it comes round.',
    preset: 'four-track-muted-harp-murk',
    ...cycled(8, [
      [0, 1, 45, 0.7],
      [0.71, 1, 52, 0.6],
      [1.33, 1, 57, 0.65],
      [2.18, 1, 60, 0.6],
      [3.42, 1.2, 64, 0.7],
      [5.1, 1, 59, 0.55],
      [5.87, 1.3, 57, 0.6],
    ]),
  },
  {
    n: 90,
    id: 'tongue-drum-on-tape-g',
    name: 'Tongue drum on tape {G}',
    kind: 'melodic',
    description:
      'A tongue drum touched lightly around {G}, going round on worn-out tape until it blurs, in a long plate; it comes round.',
    preset: 'four-track-tongue-drum-loop',
    // Two turns of the tape to the loop, fading faster than the preset's, so one round is like the
    // next; and no touch half a second or a second after where the tape brings another back, or
    // touches and returns fall into step and are a beat.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 4, feedback: 0.45, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    ...cycled(
      8,
      [
        [0, 1.5, 55, 0.7],
        [0.94, 1.2, 62, 0.55],
        [2.07, 1.5, 60, 0.6],
        [3.3, 1.5, 64, 0.65],
        [4.61, 1.2, 57, 0.6],
        [5.6, 1.6, 62, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 91,
    id: 'slide-and-tremolo-c',
    name: 'Slide and tremolo {C}',
    kind: 'melodic',
    description:
      'A steel guitar over {C} then {F}, a neighbour note bending the held one, in a slow tremolo and a spring; it comes round.',
    preset: 'four-track-slide-and-tremolo',
    // Picked harder than the preset and with no volume pedal: faded in, no note is heard to start.
    set: { pick: 0.85, swell: 0, sustain: 10 },
    // Thirty-three turns of the tremolo to the loop, with no drift, and shallower than the
    // preset's: its turns were heard as notes.
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 2.75, depth: 0.2, drift: 0 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { tone: 2600, mix: 0.4 } },
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { noise: 0.3, wobble: 0, wear: 0.15 },
      },
    ],
    // A note that starts while its neighbour is held bends it; one that starts after the key is
    // up is picked.
    ...cycled(12, [
      [0.03, 5, 48, 0.7],
      [0.08, 2, 64, 0.7],
      [1.42, 1.2, 65, 0.6],
      [2.2, 1.1, 57, 0.6],
      [3.67, 2, 72, 0.65],
      [6.3, 5, 53, 0.65],
      [6.36, 1.6, 69, 0.65],
      [7.41, 1.1, 67, 0.6],
      [8.9, 0.9, 60, 0.6],
      [9.83, 1.7, 72, 0.6],
    ]),
  },
  {
    n: 92,
    id: 'two-takes-line-d',
    name: 'Two takes {D}',
    kind: 'melodic',
    description:
      'One close voice sung twice a few cents apart: up from {D} to a held {A} and back down, in a dark hall on cassette.',
    preset: 'four-track-two-takes',
    ...played(
      11,
      [
        [0, 1.4, 62, 0.7],
        [1.6, 0.9, 65, 0.65],
        [2.7, 2.2, 69, 0.8],
        [5.3, 1.1, 67, 0.6],
        [6.6, 2.2, 62, 0.7],
      ],
      2,
    ),
  },
  {
    n: 93,
    id: 'slack-low-strings-e',
    name: 'Slack low strings {E}',
    kind: 'melodic',
    description:
      'Low strings thumbed on {E}: a fifth, two notes above it and the fifth again, in a slow amp tremolo and a dark spring.',
    preset: 'four-track-slack-low-strings',
    ...played(
      11,
      [
        [0, 3, 40, 0.8],
        [0.06, 3, 47, 0.7],
        [1.9, 1.5, 55, 0.65],
        [3.1, 2.4, 52, 0.7],
        [5.4, 3.5, 40, 0.75],
        [5.46, 3.5, 47, 0.65],
        [6.7, 2.4, 52, 0.6],
      ],
      2,
    ),
  },
  {
    n: 94,
    id: 'small-amp-far-mic-am',
    name: 'Small amp, far mic {A}m',
    kind: 'melodic',
    description:
      'A thin bridge-pickup line in {A} minor, up to {E} and back, through a small combo at the far end of a stone room.',
    preset: 'four-track-small-amp-far-mic',
    ...played(
      10,
      [
        [0, 1.2, 69, 0.7],
        [0.74, 1.3, 72, 0.65],
        [1.93, 1.6, 76, 0.75],
        [3.31, 1.3, 74, 0.6],
        [4.52, 0.8, 72, 0.6],
        [5.07, 2.6, 69, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 95,
    id: 'doubled-acoustic-g',
    name: 'Doubled acoustic {G}',
    kind: 'melodic',
    description:
      'Two takes of the same picking a little apart, falling over {G} and then over {C}, in a hall on a worn cassette.',
    preset: 'four-track-doubled-acoustic',
    // A little narrower than the preset: the two takes are nearly as loud at the sides as in the middle.
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(
      10,
      [
        [0, 2.5, 62, 0.65],
        [0.61, 2.5, 59, 0.55],
        [1.15, 2.5, 55, 0.6],
        [1.98, 2, 50, 0.6],
        [2.74, 3, 43, 0.7],
        [3.9, 2.5, 64, 0.65],
        [4.47, 2.5, 60, 0.55],
        [5.2, 3, 55, 0.6],
        [6.3, 3, 48, 0.7],
      ],
      2,
    ),
  },
  {
    n: 96,
    id: 'three-heads-one-hall-f',
    name: 'Three heads, one hall {F}',
    kind: 'melodic',
    description:
      'A soft electric piano climbing {C}, {F}, {A} and answered by a low fifth on {F}, repeated by three tape heads in a damped hall.',
    preset: 'four-track-three-heads-one-hall',
    ...played(
      11,
      [
        [0, 2, 60, 0.7],
        [1.7, 1.5, 65, 0.65],
        [3.1, 2, 69, 0.7],
        [5.6, 2.5, 53, 0.7],
        [5.63, 2.5, 60, 0.6],
      ],
      3,
    ),
  },
  {
    n: 97,
    id: 'wavering-upright-c',
    name: 'Wavering upright {C}',
    kind: 'melodic',
    description:
      'An upright a little out of tune coming back to one {E} as the bass steps down {C}, {A}, {F}, on a cassette whose speed sags.',
    preset: 'four-track-wavering-upright',
    ...played(
      12,
      [
        [0, 3.2, 48, 0.6],
        [0.62, 1.2, 64, 0.9],
        [1.93, 1.2, 64, 0.8],
        [3.3, 3.4, 45, 0.6],
        [3.87, 1.2, 64, 0.9],
        [5.31, 1.4, 67, 0.8],
        [6.9, 4, 41, 0.6],
        [7.48, 1.4, 64, 0.9],
        [9.02, 2.4, 60, 0.85],
      ],
      2,
    ),
  },
  {
    n: 98,
    id: 'sliding-bass-line-g',
    name: 'Sliding bass line {G}',
    kind: 'melodic',
    description:
      'A dull bass sliding from {G} up to {C}, down to {F} and home, with one dark tape repeat, in a hall.',
    preset: 'four-track-sliding-bass-line',
    // Shorter slides than the preset's, and notes whose loud fifth harmonic is a white key.
    set: { glide: 0.12 },
    // The repeat at a time the line does not share: in step with the notes it is a pulse.
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 430, feedback: 0.3, highCut: 2000, mix: 0.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(
      9,
      [
        [0, 1.5, 43, 0.8],
        [1.37, 1.3, 48, 0.7],
        [2.6, 1.7, 41, 0.7],
        [4.21, 3.2, 43, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 99,
    id: 'wooden-plucks-wet-road-f',
    name: 'Wooden plucks {F}',
    kind: 'melodic',
    description:
      'Soft dull plucks falling from {C} through {F} major and settling on {F}, a thin wavering tape echo behind them, in a long plate.',
    preset: 'four-track-wooden-plucks-wet-road',
    // The echo further back than the preset's: as loud as the plucks, its repeats are a pulse.
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 400, feedback: 0.4, mix: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(
      9,
      [
        [0, 1, 72, 0.7],
        [0.61, 1, 69, 0.55],
        [1.47, 1, 65, 0.65],
        [2.2, 1, 67, 0.55],
        [3.37, 1, 64, 0.6],
        [4.3, 1.5, 65, 0.7],
      ],
      2,
    ),
  },
  {
    n: 100,
    id: 'hammered-string-pad-g',
    name: 'Hammered strings {G}',
    kind: 'melodic',
    description:
      'Single strings struck with felt up from {G} and back, a dark pad growing out of them and staying after.',
    preset: 'four-track-hammered-string-pad',
    // The pad further back than the preset's and the cassette less worn: lower down the pad
    // covered the hammers and no note was heard to start.
    effects: [
      {
        deviceId: 'pad-follower',
        params: {
          rise: 1.2,
          fall: 18,
          sensitivity: 0.45,
          octaves: 0,
          brightness: 1600,
          ensemble: 0.5,
          movement: 0.35,
          lowCut: 150,
          mix: 0.2,
        },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3, wear: 0.15 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(
      13,
      [
        [0, 2, 67, 0.75],
        [1.1, 2, 74, 0.65],
        [2.3, 2, 79, 0.7],
        [3.8, 2.5, 76, 0.65],
        [5.6, 3, 71, 0.65],
        [6.9, 3, 67, 0.75],
      ],
      3,
    ),
  },
])
