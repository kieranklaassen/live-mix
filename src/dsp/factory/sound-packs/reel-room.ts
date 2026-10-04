// The sounds of the pack "Indiana Reel Room": its presets played, a hundred sounds to
// paint with. Numbers 24001 to 24100.

import { PRESETS } from '../packs/reel-room'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

/** A fast limiter with this much gain into it: a level that wanders holds still, a quiet body comes up. */
const lift = (gain: number) => ({
  deviceId: 'ambient-limiter',
  params: { ceiling: -12, gain, release: 0.3, ride: 0 },
})
const level = lift(24)
/** A fast compressor far down: it takes out the stray hits of worn tape and the swings of a wide room. */
const even = {
  deviceId: 'ambient-comp',
  params: { threshold: -60, ratio: 8, attack: 20, release: 0.15, makeup: 24 },
}
/** One slow swell in level for every eight seconds, so it comes round with the loop. */
const tide = breathe(0.125, 0.5)
const narrow = { deviceId: 'stereo-widener', preset: 'Narrow' }
/** A short fade on every attack: where a preset fades the strike away, this only softens it. */
const softPick = { deviceId: 'swell', preset: 'Soft pick' }

/** The slow reel with its transport steady: no wow, flutter or dropouts, so a held tone stays level. */
const steadyReel = (params: Readonly<Record<string, number>> = {}) => ({
  deviceId: 'tape',
  preset: 'Quarter inch',
  params: { speed: 2, wow: 0, flutter: 0, age: 0, ...params },
})

export const SOUNDS: readonly FactorySound[] = packSounds('reel-room', 24000, PRESETS, [
  // Drones: the floor under everything else, a note or a fifth each, on chains that do not stir.
  {
    n: 1,
    id: 'floor-joists-d',
    name: 'Floor joists {D}',
    kind: 'drone',
    description:
      'A low {D} in octaves over a full sub, shut to 180 Hz and pushed through a transformer in a hall.',
    preset: 'reel-room-floor-joists',
    // Its partials held where they are: wandering, the octaves swell against the fold.
    set: { movement: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 7, 2, [38]),
    tuning: 'whole-cycles',
  },

  {
    n: 2,
    id: 'sub-under-the-floor-g',
    name: 'Sub under the floor {G}',
    kind: 'drone',
    description:
      'A sub tone under a low {G} with its filter at 120 Hz, saturated as if on tape so small speakers find it.',
    preset: 'reel-room-subsoil',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 800 } },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 18, outputDb: -21.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { damping: 0.6, mix: 0.3, breathDepth: 0 },
      },
    ],
    then: [breathe(0.125, 0.2), quarterTurn(8)],
    ...looped(8, 4, 2, [43]),
    tuning: 'whole-cycles',
  },

  {
    n: 3,
    id: 'tuba-under-the-risers-f',
    name: 'Tuba under risers {F}',
    kind: 'drone',
    description:
      'One soft tuba on a low {F} with the octave below added, printed hot to tape in a small room.',
    preset: 'reel-room-under-the-risers',
    // Quieter into the tape: pressed as hard as the preset presses it, the tuba sat at the top of what a drone
    // may be in the upper keys.
    set: { section: 0, volume: -19 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [41]),
    tuning: 'whole-cycles',
  },

  {
    n: 4,
    id: 'basement-saw-and-pulse-a',
    name: 'Basement oscillators {A}',
    kind: 'drone',
    description:
      'A saw and a pulse an octave apart on a low {A} under a 400 Hz filter, an amplifier humming beside them.',
    preset: 'reel-room-basement-oscillators',
    set: { lfo1Amount: 0, lfo2Amount: 0, unisonVoices: 1 },
    effects: [
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { level: -44 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 2500, mix: 0.35, modDepth: 0 },
      },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 7, 2, [45]),
    tuning: 'whole-cycles',
  },

  {
    n: 5,
    id: 'low-bloom-held-open-e',
    name: 'Low bloom, opened {E}',
    kind: 'drone',
    description:
      'A low {E} of synthetic brass held until its filter has opened, pushed into a tape preamp in a cathedral.',
    preset: 'reel-room-low-bloom',
    set: { detune: 0 },
    // A small sway in level: held dead still, it was louder than a drone should be a semitone down.
    then: [breathe(0.125, 0.2), quarterTurn(8)],
    ...looped(8, 9, 2, [40]),
    tuning: 'whole-cycles',
  },

  {
    n: 6,
    id: 'half-speed-series-g',
    name: 'Half-speed series {G}',
    kind: 'drone',
    description:
      'A harmonic series on {G} with its own half-speed copy an octave beneath, on a reel in a cathedral.',
    preset: 'reel-room-half-speed-reel',
    set: { movement: 0 },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2000, jitter: 0, highCut: 2000, mix: 0.7 },
      },
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { tone: 0.35, wobble: 0, wear: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [quarterTurn(8)],
    // Not the lowest {G}: five keys down, the copy under that one is too low to be heard as a note.
    ...looped(8, 8, 2, [55]),
    tuning: 'whole-cycles',
  },

  {
    n: 7,
    id: 'bass-clarinet-long-room-a',
    name: 'Long room reed {A}',
    kind: 'drone',
    description:
      'A soft bass clarinet on a low {A} with {E} over it and an octave added beneath, swaying, on a slow reel in a vast room.',
    preset: 'reel-room-long-room-reeds',
    // An octave under the reed, ahead of the preset's reel and room: two still tones alone are louder than a
    // drone should be, and the low octave takes the level without being heard as louder.
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6, filter: 400 } },
      steadyReel(),
      {
        deviceId: 'expanse',
        preset: 'Open space',
        // A narrower room: a still tone in a still room can land out of phase between the sides in some keys.
        params: { decay: 16, highCut: 3000, mix: 0.4, modDepth: 0, width: 0.4 },
      },
    ],
    // A small sway in level: held dead still, these two tones are louder than a drone should be.
    then: [breathe(0.125, 0.2), quarterTurn(8)],
    ...looped(8, 6, 2, [45, [52, 0.7]]),
    tuning: 'whole-cycles',
  },

  {
    n: 8,
    id: 'contrabass-and-quarter-speed-c',
    name: 'Contrabass, slack {C}',
    kind: 'drone',
    description:
      'A heavily bowed {C} with a quarter-speed copy two octaves down, driven into a tape preamp in a hall.',
    preset: 'reel-room-contrabass-slack-tape',
    set: { vibrato: 0 },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Two octaves',
        params: { length: 2000, jitter: 0, mix: 0.45 },
      },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -10.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.3 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [48]),
    tuning: 'whole-cycles',
  },

  {
    n: 9,
    id: 'flue-pipes-under-boards-g',
    name: 'Pipes under boards {G}',
    kind: 'drone',
    description:
      'Flue pipes on a low {G} with a heavy sub rank and the tone at 600 Hz, on a slow reel in a small dark room.',
    preset: 'reel-room-pipes-under-floorboards',
    set: { celeste: 0, bellows: 0, sub: 1, octave: 0.35 },
    effects: [
      steadyReel(),
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35, modDepth: 0 } },
    ],
    then: [breathe(0.125, 0.25), quarterTurn(8)],
    ...looped(8, 8, 2, [43]),
    tuning: 'whole-cycles',
  },

  {
    n: 10,
    id: 'square-over-its-sub-c',
    name: 'Square and sub {C}',
    kind: 'drone',
    description:
      'A square wave on a low {C} and its sub octave under a 300 Hz filter, through a transformer in a hall.',
    preset: 'reel-room-square-and-sub',
    // Without its chorus, which turns at a rate no loop comes round on.
    set: { chorus: 0 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { damping: 0.6, mix: 0.3, breathDepth: 0 },
      },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [48]),
    tuning: 'whole-cycles',
  },

  {
    n: 11,
    id: 'folded-sine-low-c',
    name: 'Folded tone, low {C}',
    kind: 'drone',
    description:
      'A lightly folded sine on a low {C}, on a hissing reel, with grains of it falling an octave in a hall.',
    preset: 'reel-room-folded-tone-low',
    set: { drift: 0.2 },
    then: [level],
    ...looped(8, 7, 2, [48]),
  },

  {
    n: 12,
    id: 'pump-organ-back-room-a',
    name: 'Back room harmonium {A}',
    kind: 'drone',
    description:
      'A pump organ on a low {A} and {E} with its bellows held steady, on cassette over the rumble of an empty room.',
    preset: 'reel-room-back-room-harmonium',
    set: { bellows: 0, celeste: 0 },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0, flutter: 0, age: 0 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.3 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [45, [52, 0.7]]),
    tuning: 'whole-cycles',
  },

  {
    n: 13,
    id: 'pedal-tone-in-unison-e',
    name: 'Pedal tone on tape {E}',
    kind: 'drone',
    description:
      'Two low oscillators in unison on {E} over a sub behind a filter at 150 Hz, held level on tape in a big room.',
    preset: 'reel-room-pedal-tone-beating',
    // In unison: twelve cents apart they beat, and a drone that beats is a pad.
    set: { beat: 0 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { bump: 0.7, wow: 0, flutter: 0 } },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 2000, mix: 0.25, modDepth: 0 },
      },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [40]),
    tuning: 'whole-cycles',
  },

  {
    n: 14,
    id: 'hollow-wavetable-held-d',
    name: 'Hollow tone, held {D}',
    kind: 'drone',
    description:
      'A hollow wavetable on {D}, {A} and {E} closed to 500 Hz and held where it is, on reel tape in a dark hall.',
    preset: 'reel-room-hollow-tone-drifting',
    // Held still and in a hall that keeps its pitch: the preset drifts, and its reverb drifts off the key.
    set: { motion: 0, detune: 0 },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { tone: 0.35, wobble: 0, wear: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.6 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 7, 2, [50, [57, 0.8], [64, 0.6]]),
    tuning: 'whole-cycles',
  },

  {
    n: 15,
    id: 'baritone-chord-held-over-g',
    name: 'Baritone held over {G}',
    kind: 'drone',
    description:
      'A dark baritone guitar strummed once on {G}, {D} and {A} through a warm preamp, caught and held in a hall.',
    preset: 'reel-room-baritone-held-over',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { highCut: 3000, output: 0.5 } },
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { attack: 1.5, mix: 1, motion: 0, ensemble: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.5 } },
    ],
    then: [lift(12)],
    ...looped(8, 9, 2, [43, 50, 57]),
  },

  // Pads: sections on tape that swell, once a loop or once and away.
  {
    n: 16,
    id: 'basses-on-the-far-reel-c',
    name: 'Far reel basses {C}',
    kind: 'pad',
    description:
      'Low voices on a closed vowel on {C} and {G}, on a slow mono reel, swelling in a cathedral.',
    preset: 'reel-room-far-reel-basses',
    // Fewer singers to a note: the whole section beats deeply enough to be heard as notes.
    set: { ensemble: 0.2 },
    then: [even, tide],
    ...looped(8, 7, 2, [48, 55, 60]),
  },

  {
    n: 17,
    id: 'drone-lute-and-octaves-f',
    name: 'Drone lute octaves {F}',
    kind: 'pad',
    description:
      'A drone lute on {F} and {C} plucked round every eight seconds, each pluck faded in, with octaves beneath it, swelling.',
    preset: 'reel-room-drone-lute-octaves',
    set: { speed: 8, spread: 0.3 },
    // Each pluck faded in: six keys up, the plucks as they were stood out as notes.
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 600 } },
      { deviceId: 'octaves', preset: 'Deep', params: { sub2: 0.6, attack: 0.8, filter: 300 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 2500, mix: 0.45 } },
    ],
    then: [even, tide],
    ...looped(8, 8, 2, [53]),
  },

  {
    n: 18,
    id: 'magnet-held-octaves-g',
    name: 'Magnet-held strings {G}',
    kind: 'pad',
    description:
      'Guitar strings held singing on a low {G} in octaves with no pick, swelling on a tape loop in a huge room.',
    preset: 'reel-room-magnet-held-strings',
    // The two strings of each note in tune: apart, as the preset has them, their beating was heard as notes
    // in one key or another.
    set: { detune: 0 },
    // The preset's effects with the chorus narrower and less of a loop that does not wear: its dropouts were
    // heard as notes.
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3, spread: 40 } },
      { deviceId: 'tape-loop', preset: 'Two decks', params: { wear: 0, wow: 0.1, mix: 0.15 } },
      // A narrower room: in two keys the huge room put more at the sides than between them.
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { highCut: 3000, mix: 0.4, width: 0.6 },
      },
    ],
    then: [even, tide],
    // The low octaves: an octave up the strings wavered, and in one key or another that was heard as notes.
    ...looped(8, 8, 2, [43, 55]),
    loopFold: 'linear',
  },

  {
    n: 19,
    id: 'violins-first-copy-e',
    name: 'First copy strings {E}',
    kind: 'pad',
    description:
      'Strings from tape on {E} in octaves, copied to a slow reel and low-passed, swelling in a stone nave.',
    preset: 'reel-room-first-copy-strings',
    // A fresh strip, nearer the middle and played low: the lurches of the old one were heard as notes.
    set: { age: 0, spread: 0.5, players: 0.3, vibrato: 0.1 },
    then: [even, tide],
    ...looped(8, 7, 2, [52, 64]),
  },

  {
    n: 20,
    id: 'muted-players-slow-reel-dm',
    name: 'Muted, slow reel {D}m',
    kind: 'pad',
    description:
      'Six muted players to a note on {D} minor, on a tired reel far down a stone nave, swelling once a loop.',
    preset: 'reel-room-muted-slow-reel',
    // The preset's tired reel with fewer dropouts: each one was heard as a note.
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.4, age: 0.1, hiss: 0.35 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2000 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    then: [even, tide],
    ...looped(8, 9, 2, [50, 57, 62, 65]),
  },

  {
    n: 21,
    id: 'cellos-on-a-slack-reel-g',
    name: 'Slack reel cellos {G}',
    kind: 'pad',
    description:
      'Cellos at half speed on {G} and {D}, an octave under the keys, swelling on a long tape loop in a huge room.',
    preset: 'reel-room-slack-reel-cellos',
    then: [even, tide],
    ...looped(8, 8, 2, [55, 62, 67]),
  },

  {
    n: 22,
    id: 'horns-third-copy-am',
    name: 'Third copy horns {A}m',
    kind: 'pad',
    description:
      'Half-speed horns on {A} minor bounced from cassette to reel, behind a steep filter at 900 Hz, swelling.',
    preset: 'reel-room-third-copy-horns',
    // Both tapes with their dropouts taken out: on a held chord each was heard as a note.
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.35, wear: 0.1 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, age: 0 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 900, resonance: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 9, damping: 0.6, mix: 0.4 } },
    ],
    then: [tide],
    ...looped(8, 7, 2, [57, 64, 69, 72]),
  },

  {
    n: 23,
    id: 'reed-section-under-hiss-f',
    name: 'Reeds under hiss {F}',
    kind: 'pad',
    description:
      'A reed section at half speed on {F} major, swelling once a loop under tape hiss in a long damped plate.',
    preset: 'reel-room-reeds-under-hiss',
    // Less hiss than the preset's and a narrower plate: five keys down the hiss was all that was heard.
    effects: [
      { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -44 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
      narrow,
    ],
    then: [even, tide],
    // Not the lowest octave, and the chord leans on its {F}: five keys down, low and with every note
    // as loud, the slowed reeds gave no one pitch to hear.
    ...looped(8, 7, 2, [[60, 0.6], 65, [69, 0.5], [72, 0.6]]),
  },

  {
    n: 24,
    id: 'choir-on-a-worn-spool-c',
    name: 'Worn spool choir {C}',
    kind: 'pad',
    description:
      'A worn choir tape at half speed on {C} and {G}, its vowels smeared into one sheet, swelling in a humming hall.',
    preset: 'reel-room-worn-spool-choir',
    // The whole length of its tape: at eight seconds the strip runs out under a held chord.
    set: { length: 9, age: 0.15, vibrato: 0.2 },
    // The blur with no smear: smeared, it spread the chord over its neighbouring notes.
    effects: [
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { smear: 0, mix: 0.5 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.4 } },
    ],
    then: [even, tide],
    // Begun at the bottom of the swell: begun at its top, the loop was heard six keys up as one struck note.
    ...looped(8, 12, 2, [60, 67, 72]),
  },

  {
    n: 25,
    id: 'cellos-tails-out-em',
    name: 'Tails out {E}m',
    kind: 'pad',
    description:
      'Cellos from tape on {E} minor fed to a loop that plays backwards, each chord back as a swell; it comes round.',
    preset: 'reel-room-tails-out',
    // The preset's effects with a loop of four seconds, which the round holds twice, and less
    // fed back: at its own feedback the loop is still filling when the sound is taken.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Backwards layers',
        params: { length: 4, feedback: 0.5, wear: 0.5, spread: 0.3, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.6, mix: 0.25 } },
      // Nearer the middle: in five of the twelve keys there was more at the sides than between them.
      narrow,
    ],
    ...cycled(
      8,
      [
        [0.3, 3.4, 52],
        [0.3, 3.4, 59, 0.8],
        [0.3, 3.4, 64, 0.8],
        [0.3, 3.4, 67, 0.7],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 26,
    id: 'low-brass-ballast-f',
    name: 'Low brass ballast {F}',
    kind: 'pad',
    description:
      'Trombones and tuba blown softly on a low {F} and {C}, on a slow reel in a cathedral, rising and sinking once.',
    preset: 'reel-room-low-brass-ballast',
    // A little nearer the middle first: five keys down the cathedral put as much at the sides as between them.
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }, even, breathe(0.0625, 0.5)],
    ...looped(16, 7, 3, [41, 48, 53]),
  },

  {
    n: 27,
    id: 'chorale-on-four-tracks-c',
    name: 'Four-track chorale {C}',
    kind: 'pad',
    description:
      'A soft horn section on cassette rising on {C}, sinking to {A} minor and dying away in a very large room.',
    preset: 'reel-room-four-track-chorale',
    set: { attack: 2.5, release: 4 },
    ...played(
      16,
      [
        [0, 5.6, 48, 0.8],
        [0, 5.6, 55, 0.8],
        [0, 5.6, 64, 0.7],
        [6.1, 4.6, 45, 0.8],
        [6.1, 4.6, 52, 0.8],
        [6.1, 4.6, 60, 0.7],
      ],
      3,
    ),
  },

  {
    n: 28,
    id: 'flugelhorn-over-itself-d',
    name: 'Flugelhorn, two decks {D}',
    kind: 'pad',
    description:
      'A flugelhorn with no vibrato on {D}, {F} and {C} into tape between two decks, each note over the last; it comes round.',
    preset: 'reel-room-flugelhorn-two-decks',
    // Four seconds of tape, twice round in a pass, and less fed back so the loop has filled.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Two decks',
        params: { length: 4, feedback: 0.5, wear: 0.5, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0.3, 2.3, 62, 0.8],
        [3.1, 1.9, 65, 0.7],
        [5.4, 2, 60, 0.75],
      ],
      { passes: 2 },
    ),
    loopFold: 'power',
  },

  {
    n: 29,
    id: 'brass-through-the-wall-g',
    name: 'Brass next door {G}',
    kind: 'pad',
    description:
      'A flugelhorn section on {G} and {D} heard through a wall, nothing above 700 Hz, swelling over the room rumble.',
    preset: 'reel-room-brass-next-door',
    then: [even, tide],
    ...looped(8, 7, 2, [43, 50, 55, 62]),
  },

  {
    n: 30,
    id: 'steel-bar-held-still-g',
    name: 'Bar held still {G}',
    kind: 'oneshot',
    description:
      'One low {G} picked on a steel guitar with the bar held still, dulled to 1 kHz and left to ring in a cathedral.',
    preset: 'reel-room-bar-held-still',
    // Picked, where the preset fades every note in with the pedal, and a string that dies in seconds.
    set: { swell: 0, pick: 0.75, sustain: 6 },
    // The preset's effects without its nine-second loop, which would bring the pick back in the fade.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { presence: -6, highCut: 1000 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    ...played(8, [[0, 3, 43]], 2.5),
  },

  {
    n: 31,
    id: 'horn-fifths-in-fog-g',
    name: 'Fifths in fog {G}',
    kind: 'pad',
    description:
      'Horns on {G} and {D}, each shadowed a fifth above, held until the lines smear into one, swelling.',
    preset: 'reel-room-fifths-in-fog',
    // The blur with no smear: fully smeared it put two fifths of the sound on the black keys.
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0, highCut: 2500, width: 0.25, mix: 0.6 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.6, mix: 0.2 } },
    ],
    then: [even, tide],
    ...looped(8, 8, 2, [55, 62]),
  },

  {
    n: 32,
    id: 'violas-at-the-back-desk-a',
    name: 'Back desk violas {A}',
    kind: 'pad',
    description:
      'Slow dark bows on {A}, {E} and {B} with a louder copy an octave below, swelling on tape in a very large space.',
    preset: 'reel-room-back-desk-violas',
    then: [even, tide],
    ...looped(8, 7, 2, [57, 64, 71]),
  },

  {
    n: 33,
    id: 'section-over-undertow-f',
    name: 'Strings and undertow {F}',
    kind: 'pad',
    description:
      'A warm section on {F} major over a half-speed bed of itself, swelling into a reverb that sinks an octave.',
    preset: 'reel-room-strings-and-undertow',
    then: [even, tide],
    ...looped(8, 7, 2, [53, 60, 65, 69]),
  },

  {
    n: 34,
    id: 'dusk-at-the-county-line-am',
    name: 'County line dusk {A}m',
    kind: 'pad',
    description:
      'A just {A} minor chord of wandering partials closed to 500 Hz, on a hissing reel, swelling in a vast space.',
    preset: 'reel-room-county-line-dusk',
    then: [even, tide],
    ...looped(8, 9, 2, [45]),
  },

  {
    n: 35,
    id: 'unison-under-hiss-d',
    name: 'Tone under hiss {D}',
    kind: 'pad',
    description:
      'A plain {D} and its sub with steady tape hiss laid over it, swelling in a hall that breathes.',
    preset: 'reel-room-tone-under-hiss',
    // Well above its hiss: level with it, the analysis hears no pitch.
    set: { volume: -1 },
    // The hall let in at a quarter of a hertz: two breaths to a loop.
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -38 } },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { highCut: 5000 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { damping: 0.6, mix: 0.4, breathRate: 0.25 },
      },
    ],
    then: [even, tide],
    ...looped(8, 8, 2, [50]),
  },

  {
    n: 36,
    id: 'clarinet-chorale-dm7',
    name: 'Reed chorale {D}m7',
    kind: 'pad',
    description:
      'Clarinets on {D} minor seventh that came in from nothing, on a six-second tape loop in a cathedral, swelling.',
    preset: 'reel-room-reed-chorale',
    then: [even, tide],
    ...looped(8, 8, 2, [50, 57, 65, 72]),
  },

  {
    n: 37,
    id: 'cello-fifth-plucked-g',
    name: 'Plucked cello fifth {G}',
    kind: 'oneshot',
    description:
      'A cello fifth on {G} and {D} plucked once with the finger, not bowed, and left to ring on a slow reel in a cathedral.',
    preset: 'reel-room-open-cello-fifth',
    // Plucked, where the preset bows: the same two strings, reel and room, without the hand riding the level.
    set: { mode: 0, attack: 0.005, decay: 12, release: 3, brightness: 0.15, position: 0.3 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, hiss: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    // The snap of the finger held down a little: left as it was, the string behind it was too quiet.
    then: [lift(9)],
    ...played(
      8,
      [
        [0, 2.5, 43],
        [0, 2.5, 50, 0.8],
      ],
      2.5,
    ),
  },

  {
    n: 38,
    id: 'low-flutes-resting-fmaj7',
    name: 'Resting flutes {F}maj7',
    kind: 'pad',
    description:
      'Low flutes on {F} major seventh with no tonguing, doubled by a slow chorus on a slow reel, swelling in a hall.',
    preset: 'reel-room-alto-flutes-resting',
    then: [even, tide],
    // The chord leans on its {F}: with every note as loud, five keys down no one pitch was heard.
    ...looped(8, 7, 2, [53, [60, 0.6], [64, 0.5], [69, 0.6]]),
  },

  {
    n: 39,
    id: 'head-of-reel-beep-e',
    name: 'Head of reel beep {E}',
    kind: 'oneshot',
    description:
      'One short plain sine on a high {E}, like the beep that marks the head of a reel, under hiss, dying away in a hall.',
    preset: 'reel-room-calibration-tones',
    // Keyed on and off like a tone generator, with no sub octave and no shifted copy to phase against.
    set: { attack: 0.01, release: 0.15, sub: 0, detune: 0, cutoff: 4000 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 5, midDecay: 5, damping: 3000, mix: 0.3 },
      },
    ],
    ...played(5, [[0, 0.25, 76]], 2),
  },

  {
    n: 40,
    id: 'buried-brass-swell-c',
    name: 'Buried brass swell {C}',
    kind: 'pad',
    description:
      'A soft synthetic horn chord on {C} with a ninth, its filter at 350 Hz, swelling while held and dying away on cassette.',
    preset: 'reel-room-buried-brass-pad',
    set: { release: 4 },
    ...played(
      12,
      [
        [0, 6.5, 48, 0.8],
        [0, 6.5, 55, 0.8],
        [0, 6.5, 62, 0.7],
        [0, 6.5, 64, 0.7],
      ],
      2.5,
    ),
  },

  {
    n: 41,
    id: 'blanketed-polysynth-am',
    name: 'Blanketed polysynth {A}m',
    kind: 'pad',
    description:
      'A chorus polysynth on {A} minor whose filter barely opens, over a heavy sub on cassette, swelling in a long plate.',
    preset: 'reel-room-polysynth-under-blankets',
    then: [narrow, even, tide],
    ...looped(8, 8, 2, [57, 64, 72]),
  },

  {
    n: 42,
    id: 'baritone-one-strum-c',
    name: 'Baritone, one strum {C}',
    kind: 'oneshot',
    description:
      'A dark baritone guitar strummed once on {C}, {G} and {C} through a warm preamp, not held, ringing out in a hall.',
    preset: 'reel-room-baritone-held-over',
    // Picked with no fade in, and without the sustainer that holds the preset's chords.
    set: { swell: 0, strum: 30 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { highCut: 3000, output: 0.5 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 6, damping: 0.6, mix: 0.35, breathDepth: 0 },
      },
    ],
    ...played(
      7,
      [
        [0, 3, 48],
        [0, 3, 55, 0.8],
        [0, 3, 60, 0.8],
      ],
      2.5,
    ),
  },

  {
    n: 43,
    id: 'string-synth-on-cassette-g',
    name: 'Cassette strings {G}',
    kind: 'pad',
    description:
      'A string machine on {G} major with its chorus slowed and drifting, swelling on a worn cassette in a long plate.',
    preset: 'reel-room-cassette-string-synth',
    then: [narrow, even, tide],
    ...looped(8, 7, 2, [55, 62, 67, 71]),
  },

  {
    n: 44,
    id: 'head-of-reel-tones-a',
    name: 'Calibration tones {A}',
    kind: 'pad',
    description:
      'Plain sines on {A} and {E} over a sub octave, like the tones at the head of a reel, phasing against a shifted copy.',
    preset: 'reel-room-calibration-tones',
    // The copy three eighths of a hertz off and its own wander stopped: three turns to a loop.
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.375, lfoDepth: 0, tone: 2500, mix: 0.4 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
    ...looped(8, 7, 2, [57, 64]),
    loopFold: 'linear',
  },

  {
    n: 45,
    id: 'humming-group-g',
    name: 'Hummed, not sung {G}',
    kind: 'pad',
    description:
      'A small group humming {G} and {D} with mouths nearly shut, on reel tape, swelling in a hall on the same vowel.',
    preset: 'reel-room-hummed-not-sung',
    // Fewer singers to a note: at the preset's eight tenths their beating is heard as notes.
    set: { ensemble: 0.2 },
    then: [even, tide],
    ...looped(8, 7, 2, [55, 62, 67]),
  },

  {
    n: 46,
    id: 'rubbed-bowls-over-strings-d',
    name: 'Rubbed bowls {D}',
    kind: 'pad',
    description:
      'Bowls rubbed on {D} and {A}, dull and slowly beating, a dark string pad grown behind them on a reel, swelling.',
    preset: 'reel-room-rubbed-bowls-and-pad',
    // The bowls and the pad behind them nearer the middle.
    set: { spread: 0.3 },
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Lingering',
        params: { brightness: 900, mix: 0.35, width: 0.4 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [even, tide],
    ...looped(8, 8, 2, [62, 69]),
  },

  // Among the pads from here on, a few one-shots and phrases on the plucked and struck presets:
  // the pack had more swells than anything else and too few single notes.
  {
    n: 47,
    id: 'drone-lute-one-string',
    name: 'Drone lute, one string',
    kind: 'oneshot',
    description:
      'One string of a drone lute tuned to {D}: its low {A}, plucked without buzz and left to ring, on a slow reel in a cathedral.',
    preset: 'reel-room-four-slow-strings',
    // One pluck, of the string the lute begins its round on, and a string that dies in seconds:
    // held, the lute is plucked round and rings for half a minute.
    set: { decay: 5 },
    // The pluck left on, only softened: the preset fades every pluck in.
    effects: [
      softPick,
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    ...played(8, [[0, 1.5, 50]], 2.5),
    skipSec: 0.02,
  },

  {
    n: 48,
    id: 'viola-behind-plaster-b',
    name: 'Viola through plaster {B}',
    kind: 'pad',
    description:
      'One muted viola on {B} replayed through a muffled speaker, a worn tape echo trailing it into a hall.',
    preset: 'reel-room-viola-through-plaster',
    ...played(10, [[0, 4.5, 59]], 2),
  },

  {
    n: 49,
    id: 'bow-hair-on-the-string',
    name: 'Bow hair {G}',
    kind: 'pad',
    description:
      'Bows barely touching the strings on {G} and {D}, more air than note, under 1.2 kHz, swelling in a long plate.',
    preset: 'reel-room-bow-hair',
    // No added hiss, and kept nearer the middle: with it the sides were louder than the middle in far keys.
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 1200, resonance: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
      narrow,
    ],
    then: [even, tide],
    ...looped(8, 5, 2, [55, 62]),
  },

  {
    n: 50,
    id: 'zither-slow-strum-loop-c',
    name: 'Slow loop zither {C}',
    kind: 'melodic',
    description:
      'Open strings {C}, {D} and {G} over two octaves in one slowing strum, with a loop of it at half speed; it comes round.',
    preset: 'reel-room-slow-loop-zither',
    // The strum rolled by hand, string by string and slowing: the preset's own is even, and an even roll is a beat.
    set: { chord: 0, exciter: 1 },
    // The preset's effects with four seconds of tape, which the round holds twice, and less fed back.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4, feedback: 0.5, wear: 0.5, mix: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2200 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
      narrow,
    ],
    ...cycled(
      8,
      [
        [0.02, 3, 48, 0.8],
        [0.41, 3, 50, 0.65],
        [0.93, 3, 55, 0.7],
        [1.62, 3, 60, 0.7],
        [2.49, 3, 62, 0.65],
        [3.58, 3.5, 67, 0.75],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 51,
    id: 'three-bows-caught-em',
    name: 'Bows caught, held {E}m',
    kind: 'pad',
    description:
      'Three muted players with no vibrato on {E} minor, caught by a sustainer and held as a dark bed, swelling in a hall.',
    preset: 'reel-room-strings-held-still',
    then: [even, tide],
    ...looped(8, 12, 2, [52, [59, 0.7], [64, 0.8], [67, 0.5]]),
  },

  {
    n: 52,
    id: 'pan-pipes-dissolved-a',
    name: 'Pipes, dissolved {A}',
    kind: 'pad',
    description:
      'Pan pipes with no chiff on {A} and {E}, dissolved until they hang like an organ, swelling in a humming hall.',
    preset: 'reel-room-hollow-pipes-blurred',
    // The blur with no smear: smeared, a held chord spreads over its neighbouring notes.
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { highCut: 3000, smear: 0, mix: 0.6 },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } },
    ],
    then: [even, tide],
    ...looped(8, 12, 2, [57, [64, 0.7], [69, 0.8]]),
  },

  {
    n: 53,
    id: 'baritone-figure-held-f',
    name: 'Baritone figure {F}',
    kind: 'melodic',
    description:
      'A dark baritone guitar picks {F}, {C}, {F}, {G} and back to {C} through a warm preamp, each note caught and held a while.',
    preset: 'reel-room-baritone-held-over',
    // Picked with no fade in, and the sustainer letting go in seconds so each note is heard begin.
    set: { swell: 0, strum: 0 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { highCut: 3000, output: 0.5 } },
      {
        deviceId: 'sustainer',
        preset: 'Endless drone',
        params: { attack: 1.5, decay: 4, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.35 } },
    ],
    ...played(
      12,
      [
        [0, 1.2, 41, 0.85],
        [0.94, 1.1, 48, 0.7],
        [1.71, 1.6, 53, 0.75],
        [3.12, 1.7, 55, 0.7],
        [4.56, 3, 48, 0.8],
      ],
      3,
    ),
  },

  // Textures: what the room and the tape sound like with nobody playing.
  {
    n: 54,
    id: 'recorder-left-running',
    name: 'Machine left on',
    kind: 'texture',
    description:
      'Mains hum on a low {C} from a recorder left running overnight, tape hiss over it and the room rumbling under.',
    preset: 'reel-room-machine-left-on',
    // With the rumble of the room under it: the hum alone is one steady tone, far louder than a texture is.
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -42 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -30 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    ...looped(8, 4, 2, [36]),
  },

  {
    n: 55,
    id: 'rain-on-the-flat-roof',
    name: 'Flat roof rain',
    kind: 'texture',
    description:
      'Steady rain heard from inside: a low rush with the drops filtered off at 1 kHz, on a slow reel.',
    preset: 'reel-room-flat-roof-rain',
    ...looped(8, 7, 2, [55]),
  },

  {
    n: 56,
    id: 'thunder-two-counties-off',
    name: 'Far county thunder',
    kind: 'texture',
    description:
      'Far thunder with the crack worn off, roll after roll heard through a window, on a slow reel in a very large space.',
    preset: 'reel-room-far-county-thunder',
    // Roll over roll and nearer the middle: far apart, the rolls leave the loop mostly silence.
    set: { density: 1, width: 0.6 },
    // The rolls come when they like: held nearer one level, the end of the loop meets its start.
    then: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -50, ratio: 8, attack: 200, release: 2, makeup: 12 },
      },
    ],
    ...looped(16, 4, 3, [36, 43, 48]),
  },

  {
    n: 57,
    id: 'breath-across-headjoints',
    name: 'Headjoint breath',
    kind: 'texture',
    description:
      'Flutes that are nearly all breath, filtered at 900 Hz so the air turns to a low rush, with tape hiss over it.',
    preset: 'reel-room-headjoint-breath',
    ...looped(8, 6, 2, [45, 48, 52]),
  },

  {
    n: 58,
    id: 'hiss-tuned-low',
    name: 'Tuned hiss, low bands',
    kind: 'texture',
    description:
      'Noise through wide low bands in {D} dorian, more hiss than pitch, its last moments returning an octave down.',
    preset: 'reel-room-tuned-hiss',
    // D dorian, the white keys: the preset's D minor has a B flat in it.
    set: { scale: 4, root: 2 },
    ...looped(8, 7, 2, [50, 57]),
  },

  {
    n: 59,
    id: 'hiss-on-blank-leader',
    name: 'Blank leader hiss',
    kind: 'texture',
    description:
      'The hiss of a ruined reel, its flute turned down to a trace, rising and sinking on a slowed loop in a long dark tail.',
    preset: 'reel-room-leader-tape',
    // The strip's own hiss full up and the note on it far down.
    set: { length: 9, hiss: 1, tone: -0.8, volume: -30 },
    // Tape hiss of its own ahead of the loop: the strip's hiss falls with its note, and what was left was a low murmur.
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Tape floor',
        params: { level: -40, tone: -0.7, width: 0.5 },
      },
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 5, mix: 0.45 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.5 } },
    ],
    // Steady hiss at the bank's peak is louder than a texture should be: it rises and sinks once a loop.
    then: [breathe(0.125, 0.6)],
    ...looped(8, 6, 2, [62]),
  },

  {
    n: 60,
    id: 'rain-reel-frozen',
    name: 'Rain reel, frozen',
    kind: 'texture',
    description:
      'Rain on a window loaded as the reel and held at one moment in long grains, dulled to 1 kHz, in a hall that sings back.',
    preset: 'reel-room-any-reel-frozen',
    source: 'rain-on-the-window',
    ...looped(8, 6, 2, [60]),
  },

  {
    n: 61,
    id: 'hearth-reel-backwards',
    name: 'Hearth reel, backwards',
    kind: 'texture',
    description:
      'A fire loaded as the reel and read backwards in grains over a second long, dulled to 800 Hz, under steady tape hiss.',
    preset: 'reel-room-any-reel-backwards',
    source: 'hearth',
    ...looped(8, 7, 2, [60]),
  },

  {
    n: 62,
    id: 'wind-reel-lowered',
    name: 'Wind reel, lowered',
    kind: 'texture',
    description:
      'Hill wind loaded as the reel, looped an octave down with heavy wobble and the top taken off, in a hall that breathes.',
    preset: 'reel-room-loaded-reel-lowered',
    source: 'hill-wind',
    ...looped(8, 6, 2, [60]),
  },

  {
    n: 63,
    id: 'shore-reel-mirrored',
    name: 'Shore reel, mirrored',
    kind: 'texture',
    description:
      'Waves on sand loaded as the reel, the middle looped forwards then backwards, smeared, in a reverb that swells in.',
    preset: 'reel-room-loaded-reel-mirrored',
    source: 'waves-on-sand',
    // A quarter of the recording there and back, which is eight seconds, the loop's own length,
    // and no wobble, so that every pass is the same.
    set: { start: 0.25, end: 0.5, wobble: 0 },
    // Nearer the middle, and what the loop leaves off centre taken out below 25 Hz.
    then: [
      { deviceId: 'stereo-widener', params: { width: 0.4 } },
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 25 } },
    ],
    ...looped(8, 7, 2, [60]),
    loopFold: 'linear',
  },

  {
    n: 64,
    id: 'wind-under-the-door',
    name: 'Wind under the door',
    kind: 'texture',
    description:
      'A steady low wind shut under 500 Hz, on a slow hissing reel in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { movement: 0.15, tone: 0.3, resonance: 0, attack: 1, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 500, resonance: 0.5 },
      },
      steadyReel({ hiss: 0.3 }),
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.35 } },
    ],
    ...looped(8, 4, 2, [50]),
  },

  {
    n: 65,
    id: 'stove-in-the-corner',
    name: 'Stove in the reel room',
    kind: 'texture',
    description:
      'A wood stove in the corner: a low flickering roar and soft crackles, on a slow hissing reel in a small room.',
    instrument: { deviceId: 'atmosphere', preset: 'Hearth', params: { attack: 0.5, width: 0.6 } },
    effects: [
      soften(20),
      steadyReel({ hiss: 0.25 }),
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    ...looped(8, 3, 2, [57]),
  },

  // One-shots: the room's guests struck or plucked once. Where a preset fades the attack
  // away altogether, the fade here is a short one or none: the strike is softened, not removed.
  {
    n: 66,
    id: 'felted-piano-in-the-nave-c',
    name: 'Lid down piano {C}',
    kind: 'oneshot',
    description:
      'A felted piano {C} in fifth and octave, its hammers softened, on a tired reel in a stone nave.',
    preset: 'reel-room-lid-down-piano',
    effects: [
      softPick,
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.45, age: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    ...played(
      8,
      [
        [0, 3, 48, 0.7],
        [0, 3, 55, 0.6],
        [0, 3, 60, 0.6],
      ],
      2.5,
    ),
    skipSec: 0.02,
  },

  {
    n: 67,
    id: 'nylon-thumb-low-am',
    name: 'Nylon, thumb only {A}m',
    kind: 'oneshot',
    description:
      'A low {A} minor chord from the thumb on a nylon guitar, plucks softened, on a slow reel in a reverb that blooms late.',
    preset: 'reel-room-nylon-thumb-only',
    // All but together: rolled, the strings were heard five keys down as a phrase.
    set: { strum: 4 },
    effects: [
      softPick,
      // Pushed hard onto the tape, which rounds the pluck off: clean, the note under it is very quiet.
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, drive: 0.9, output: 2 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 4, highCut: 2500, mix: 0.3 } },
    ],
    ...played(
      7,
      [
        [0, 2.5, 45],
        [0, 2.5, 52, 0.8],
        [0, 2.5, 60, 0.7],
      ],
      2,
    ),
    skipSec: 0.02,
  },

  {
    n: 68,
    id: 'steel-string-on-cassette-g',
    name: 'Dashboard cassette {G}',
    kind: 'oneshot',
    description:
      'A steel-string {G} in fifths and octaves left to ring on a warped, hissing cassette, in a hall.',
    preset: 'reel-room-dashboard-cassette',
    // Strummed fast: at the preset's forty milliseconds a string the chord is loudest too late.
    set: { strum: 8 },
    // A cassette less far gone: every dropout in the ring was heard as another note.
    effects: [
      {
        deviceId: 'patina',
        preset: 'Falling apart',
        params: { wobble: 0.6, wear: 0.3, noise: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 1600 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
    ],
    ...played(
      7,
      [
        [0, 3, 43, 0.8],
        [0, 3, 50, 0.7],
        [0, 3, 55, 0.7],
        [0, 3, 62, 0.6],
      ],
      2,
    ),
  },

  {
    n: 69,
    id: 'damped-harp-sunk-d',
    name: 'Damped harp, sunk {D}',
    kind: 'oneshot',
    description:
      'One damped harp {D} with a thin cloud of its own grains an octave below, half of them reversed, in a long plate.',
    preset: 'reel-room-damped-harp-sunk',
    // Fewer of the grains than the preset has: at its mix they were heard six keys up as more notes.
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.25 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 2000 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
      narrow,
    ],
    ...played(8, [[0, 1.2, 62]], 2),
  },

  {
    n: 70,
    id: 'harp-string-slow-reel-e',
    name: 'Harp on a slow reel {E}',
    kind: 'oneshot',
    description:
      'One harp {E} plucked softly at mid-string and left to ring, on a slow reel in a very large space.',
    preset: 'reel-room-harp-pluck-removed',
    // The pluck left on: faded in, the one note was heard six keys up as two.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.4 } },
      narrow,
    ],
    ...played(8, [[0, 2, 64]], 2.5),
  },

  {
    n: 71,
    id: 'handpan-at-half-speed-d',
    name: 'Handpan at half speed {D}',
    kind: 'oneshot',
    description:
      'One soft handpan {D}, its strike softened, replayed an octave down and twice as slow on a reel in a hall.',
    preset: 'reel-room-handpan-twice-as-slow',
    // The preset's effects with less of the slowed copy: at the preset's level the one note sat at the top of
    // what a single note may be.
    effects: [
      softPick,
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 1500, smooth: 0.8, spread: 0.4, mix: 0.7 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
    ...played(8, [[0, 2, 62]], 2.5),
    // The softened strike arrives a thirtieth of a second late.
    skipSec: 0.03,
  },

  {
    n: 72,
    id: 'tongue-drum-thump-g',
    name: 'Tongue drum, worn {G}',
    kind: 'oneshot',
    description:
      'One thump of a tongue drum on {G} off worn tape, filtered at 600 Hz, with a dull ring in a long plate.',
    preset: 'reel-room-tongue-drum-worn',
    // Worn tape in place of the worn loop, which would bring the thump round for a minute.
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { age: 0.2 } },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 600, resonance: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.7, mix: 0.3 } },
      narrow,
    ],
    ...played(8, [[0, 1.5, 55]], 2),
  },

  {
    n: 73,
    id: 'marimba-bar-slack-tape-c',
    name: 'Marimba, slack tape {C}',
    kind: 'oneshot',
    description:
      'One marimba {C} from a soft mallet replayed at half speed, an octave down, on a reel in a hall.',
    preset: 'reel-room-slack-tape-roll',
    // One stroke, not a roll, and a bar that rings as long as the hall behind it.
    set: { roll: 0, decay: 2.2 },
    ...played(6, [[0, 1.5, 60]], 1.5),
  },

  {
    n: 74,
    id: 'church-bell-octave-down-d',
    name: 'Bell, octave down {D}',
    kind: 'oneshot',
    description:
      'A church bell on {D} struck softly and replayed at half speed in three-second passes, on tape in a long plate.',
    preset: 'reel-room-bell-octave-down',
    // Struck at two thirds, where the bell's major third is silent, and with no beating between its halves.
    set: { position: 0.667, detune: 0, decay: 6 },
    then: [narrow],
    ...played(12, [[0, 4, 62]], 3),
  },

  {
    n: 75,
    id: 'tines-down-the-hallway-am',
    name: 'Hallway tines {A}m',
    kind: 'oneshot',
    description:
      'An {A} minor chord on an electric piano with soft hammers, through a tape preamp and a dark spring, in a hall.',
    preset: 'reel-room-hallway-tines',
    // Quieter into the preamp, which then leaves the strike above the tone: pressed flat, the chord is too loud.
    set: { volume: -30, hardness: 0.5, decay: 1.2 },
    ...played(
      5,
      [
        [0, 2.2, 57, 0.8],
        [0, 2.2, 60, 0.7],
        [0, 2.2, 64, 0.7],
      ],
      1.5,
    ),
  },

  {
    n: 76,
    id: 'tine-as-the-reel-winds-down-e',
    name: 'Reel winding down {E}',
    kind: 'oneshot',
    description:
      'One electric piano {E} on a recorder whose motor slows towards a stop and catches up, in a long plate.',
    preset: 'reel-room-reel-winding-down',
    // A tine that dies sooner: at its own length one note on tape is louder than a single note should be.
    set: { decay: 1.4 },
    // The motor stumbles once, two seconds in, where the preset's stumbles every so often: a stumble while
    // the note is loud is heard as a second note.
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { time: 2000, chance: 1, mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.2 } },
    ],
    ...played(7, [[0, 3, 64]], 2.5),
  },

  {
    n: 77,
    id: 'felt-hammer-one-string-a',
    name: 'Felt hammer string {A}',
    kind: 'oneshot',
    description:
      'One dull string on {A} struck with felt, a bank of strings tuned to {A} minor ringing after it in a nave.',
    preset: 'reel-room-felt-hammer-sympathy',
    // The ringing strings in A minor, the white keys: the preset's D minor has a B flat among them.
    effects: [
      softPick,
      { deviceId: 'sympathetic', preset: 'Long ring', params: { root: 9, mode: 1, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    ...played(10, [[0, 3, 57]], 3),
  },

  {
    n: 78,
    id: 'struck-bowl-pad-behind-e',
    name: 'Bowl, pad behind {E}',
    kind: 'oneshot',
    description:
      'A dull bowl on {E} struck once and left, a dark string pad rising behind its ring, on a reel in a cathedral.',
    preset: 'reel-room-rubbed-bowls-and-pad',
    // Struck: the preset rubs its bowls, which never lets one end.
    set: { sustain: 0, hardness: 0.3 },
    ...played(12, [[0, 2, 64]], 3),
  },

  {
    n: 79,
    id: 'chord-harp-one-strum-fmaj7',
    name: 'Strummed harp {F}maj7',
    kind: 'oneshot',
    description:
      'One quick strum of {F} major seventh on a dull chord harp with a little of its pad, on tape in a long damped plate.',
    preset: 'reel-room-strummed-harp-pad',
    // Plucked, with little of the pad that rises after the strings.
    set: { strum: 8, pad: 0.2 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.7, mix: 0.3 } },
    ],
    ...played(
      8,
      [
        [0, 2.5, 53],
        [0, 2.5, 57],
        [0, 2.5, 60],
        [0, 2.5, 64],
      ],
      2.5,
    ),
  },

  {
    n: 80,
    id: 'vibraphone-chord-at-night-c',
    name: 'Night vibraphone {C}',
    kind: 'oneshot',
    description:
      'A wide {C} major chord on a vibraphone from the softest mallets, on cassette, its tail sinking an octave.',
    preset: 'reel-room-vibraphone-at-night',
    // The mallets as they land and less of the sinking reverb: six keys up, the reverb rose over the strike.
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { tone: 0.35 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { tone: 2000, mix: 0.2 } },
    ],
    ...played(
      10,
      [
        [0, 2.5, 60, 0.8],
        [0, 2.5, 67, 0.7],
        [0, 2.5, 76, 0.6],
      ],
      3,
    ),
  },

  // Phrases: a few notes in free time on the struck and plucked presets; half come round.
  {
    n: 81,
    id: 'four-felt-notes-slowed-am',
    name: 'Four notes, slowed {A}m',
    kind: 'melodic',
    description:
      'Four felt piano notes falling from {A}, caught on a loop at half speed and back an octave down; it comes round.',
    preset: 'reel-room-four-notes-slowed',
    // Four seconds of tape, which the round holds whole, and less fed back so the loop has filled.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4, feedback: 0.5, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 1800 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 1.4, 69, 0.8],
        [1.37, 1.3, 64, 0.7],
        [2.61, 1.5, 67, 0.7],
        [4.23, 2, 60, 0.75],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 82,
    id: 'felted-piano-fall-c',
    name: 'Lid down piano fall {C}',
    kind: 'melodic',
    description:
      'A felted piano steps down from {E} to {C} over a low {C} and answers a sixth lower, on a tired reel in a nave.',
    preset: 'reel-room-lid-down-piano',
    // Louder into the reel, and the reel less hissy: at the preset's level the phrase was heard as hiss.
    set: { outputDb: -6 },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.3, age: 0.15, hiss: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 4, 48, 0.55],
        [0.03, 1.6, 76, 0.7],
        [1, 1.5, 74, 0.7],
        [1.84, 2.4, 72, 0.8],
        [3.82, 1.5, 67, 0.75],
        [4.53, 3, 64, 0.8],
      ],
      3,
    ),
  },

  {
    n: 83,
    id: 'nylon-thumb-round-am',
    name: 'Nylon thumb round {A}m',
    kind: 'melodic',
    description:
      'A nylon guitar opens {A} minor upwards with the thumb and steps back from {E}, each pluck softened; it comes round.',
    preset: 'reel-room-nylon-thumb-only',
    effects: [
      softPick,
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, output: 2 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 4, highCut: 2500, mix: 0.3 } },
    ],
    ...cycled(8, [
      [0.02, 2.4, 45, 0.8],
      [0.71, 1.8, 52, 0.65],
      [1.36, 1.8, 57, 0.7],
      [2.12, 2.2, 60, 0.7],
      [3.58, 1.6, 64, 0.75],
      [4.49, 1.6, 62, 0.6],
      [5.33, 2.2, 60, 0.65],
    ]),
  },

  {
    n: 84,
    id: 'steel-string-cassette-tune-g',
    name: 'Cassette guitar tune {G}',
    kind: 'melodic',
    description:
      'A steel-string falls from {D} through {B} to {G}, turns and lands on a low {D}, on a warped, hissing cassette.',
    preset: 'reel-room-dashboard-cassette',
    ...played(
      10,
      [
        [0, 1.5, 62, 0.8],
        [0.83, 1.4, 59, 0.7],
        [1.52, 1.9, 55, 0.75],
        [3.07, 1.4, 57, 0.7],
        [3.86, 1.5, 59, 0.7],
        [4.94, 3.5, 50, 0.8],
      ],
      2,
    ),
  },

  {
    n: 85,
    id: 'damped-harp-figure-dm',
    name: 'Damped harp figure {D}m',
    kind: 'melodic',
    description:
      'A damped harp climbs {D} minor, steps down to {E} and drops to a low {A}, grains of it an octave below; it comes round.',
    preset: 'reel-room-damped-harp-sunk',
    ...cycled(8, [
      [0.02, 1, 62, 0.8],
      [0.58, 1, 65, 0.7],
      [1.21, 1, 69, 0.75],
      [2.34, 1.2, 67, 0.7],
      [3.42, 1, 65, 0.65],
      [4.07, 1.4, 64, 0.7],
      [5.48, 1.6, 57, 0.7],
    ]),
    loopFold: 'power',
  },

  {
    n: 86,
    id: 'harp-arc-slow-reel-f',
    name: 'Slow reel harp arc {F}',
    kind: 'melodic',
    description:
      'A harp opens {F} major up to a high {C} and comes back by {G} and {E}, attacks rounded off, on a slow reel; it comes round.',
    preset: 'reel-room-harp-pluck-removed',
    effects: [
      softPick,
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.02, 2.5, 53, 0.8],
      [0.47, 2.3, 60, 0.65],
      [1.03, 2.2, 65, 0.7],
      [1.76, 2.4, 69, 0.7],
      [3.18, 2, 72, 0.75],
      [4.61, 2.2, 67, 0.65],
      [5.52, 2.2, 64, 0.6],
    ]),
  },

  {
    n: 87,
    id: 'handpan-round-half-speed-dm',
    name: 'Slow handpan round {D}m',
    kind: 'melodic',
    description:
      'Soft hands circling {D} minor on a handpan over its own copy an octave down and twice as slow; it comes round.',
    preset: 'reel-room-handpan-twice-as-slow',
    // The preset's effects with passes of two seconds, four to a round, so the slowed copy comes round too,
    // and the hands left in over it: slowed alone, the round has no strikes left.
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 2000, smooth: 0.8, spread: 0.4, jitter: 0, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 1.5, 62, 0.8],
        [0.93, 1.2, 69, 0.6],
        [1.71, 1.2, 72, 0.65],
        [3.04, 1.5, 74, 0.7],
        [4.18, 1.2, 69, 0.6],
        [5.27, 1.5, 65, 0.7],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 88,
    id: 'tongue-drum-on-a-worn-loop-g',
    name: 'Tongue drum loop {G}',
    kind: 'melodic',
    description:
      'Four thumps of a tongue drum from {G} going round four seconds of tape worn through, filtered at 600 Hz; it comes round.',
    preset: 'reel-room-tongue-drum-worn',
    // The preset's loop with less fed back, so that it has filled when the sound is taken.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Worn out',
        params: { length: 4, feedback: 0.5, lowCut: 60, mix: 0.5 },
      },
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 600, resonance: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.7, mix: 0.35 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 1.2, 55, 0.8],
        [0.86, 1, 62, 0.6],
        [1.97, 1.2, 60, 0.7],
        [2.74, 1.2, 57, 0.65],
      ],
      { passes: 2 },
    ),
  },

  {
    n: 89,
    id: 'marimba-phrase-slack-tape-c',
    name: 'Slack marimba phrase {C}',
    kind: 'melodic',
    description:
      'A marimba falls from {C} by {G} and {A} to {E}, turns and lands on {C}, replayed at half speed on a reel in a hall.',
    preset: 'reel-room-slack-tape-roll',
    // Single strokes, louder into a reel that hisses less: at the preset's level the phrase was heard as hiss.
    set: { roll: 0, decay: 2.2, volume: -8 },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { highCut: 3000 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.05 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.3 } },
    ],
    ...played(
      10,
      [
        [0, 1, 72, 0.8],
        [0.52, 1, 67, 0.65],
        [1.16, 1, 69, 0.7],
        [1.93, 1.4, 64, 0.7],
        [3.21, 1, 62, 0.65],
        [3.94, 1, 64, 0.65],
        [4.83, 2, 60, 0.75],
      ],
      2,
    ),
  },

  {
    n: 90,
    id: 'vibraphone-phrase-at-night-em',
    name: 'Night vibes phrase {E}m',
    kind: 'melodic',
    description:
      'A vibraphone climbs {E} minor to {B}, steps back and settles on {E} in octaves, on cassette, the tail sinking.',
    preset: 'reel-room-vibraphone-at-night',
    ...played(
      12,
      [
        [0, 2, 64, 0.75],
        [0.87, 2, 67, 0.65],
        [1.93, 2.4, 71, 0.7],
        [3.62, 2, 69, 0.65],
        [4.71, 2.2, 67, 0.65],
        [6.04, 3, 64, 0.7],
        [6.08, 3, 52, 0.5],
      ],
      3,
    ),
    skipSec: 0.02,
  },

  {
    n: 91,
    id: 'three-bells-octave-down-d',
    name: 'Bells, octave down {D}',
    kind: 'melodic',
    description:
      'Church bells on {D}, {A} and {E} struck softly and far apart over their own copy at half speed, on tape in a long plate.',
    preset: 'reel-room-bell-octave-down',
    set: { position: 0.667, detune: 0, decay: 8 },
    // The bells left in over the slowed copy: slowed alone, no strike is left to hear.
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 3000, smooth: 0.9, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
    ...played(
      14,
      [
        [0, 3, 62, 0.8],
        [2.31, 3, 57, 0.8],
        [4.87, 3, 64, 0.8],
        [7.42, 3.5, 62, 0.8],
      ],
      3,
    ),
  },

  {
    n: 92,
    id: 'tines-round-the-hallway-dm',
    name: 'Hallway tines round {D}m',
    kind: 'melodic',
    description:
      'An electric piano circles {D} minor in short notes with no bell, through a dark spring in a hall; it comes round.',
    preset: 'reel-room-hallway-tines',
    // Short notes and a harder hammer, the first one leaned on, and quieter into the preamp so that
    // it does not level them: long even notes run together and are too loud.
    set: { hardness: 0.5, volume: -27 },
    ...cycled(8, [
      [0.02, 0.7, 62, 1],
      [1, 0.7, 65, 0.55],
      [1.67, 0.7, 64, 0.55],
      [2.88, 0.9, 60, 0.6],
      [4.36, 0.7, 57, 0.55],
      [5.1, 0.7, 60, 0.55],
      [5.98, 0.9, 62, 0.6],
    ]),
  },

  {
    n: 93,
    id: 'tine-phrase-winding-down-c',
    name: 'Winding down phrase {C}',
    kind: 'melodic',
    description:
      'An electric piano rises through {C} major and settles on {E} over a low {C}, the recorder slowing and catching up.',
    preset: 'reel-room-reel-winding-down',
    // Harder hammers, more of the piano itself and less plate than the preset has: without them the notes
    // ran into one swell.
    set: { hardness: 0.9, decay: 1.5, release: 0.6 },
    effects: [
      { deviceId: 'glitch', preset: 'Winding down', params: { spread: 0.1, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.25 } },
    ],
    ...played(
      12,
      [
        [0, 1.8, 60, 0.8],
        [1.03, 1.6, 64, 0.8],
        [1.8, 2.2, 67, 0.8],
        [3.45, 1.8, 65, 0.8],
        [4.42, 3, 64, 0.8],
        [6.21, 3, 48, 0.8],
      ],
      2.5,
    ),
  },

  {
    n: 94,
    id: 'felt-hammers-and-sympathy-am',
    name: 'Felt hammers {A}m',
    kind: 'melodic',
    description:
      'Felt hammers on dull strings: {A}, {E} and {C}, then up by {D} to {E} and home, strings in {A} minor ringing on in a nave.',
    preset: 'reel-room-felt-hammer-sympathy',
    // A little brighter and shorter than the preset's string, so each hammer is heard over the last note.
    set: { brightness: 0.35, decay: 5, release: 2.5 },
    effects: [
      { deviceId: 'sympathetic', preset: 'Long ring', params: { root: 9, mode: 1, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 0.8, 57, 0.8],
        [0.71, 0.8, 64, 0.8],
        [1.72, 1.2, 60, 0.8],
        [3.38, 0.8, 62, 0.8],
        [4.01, 1.2, 64, 0.8],
        [5.82, 3, 57, 0.8],
      ],
      3,
    ),
  },

  {
    n: 95,
    id: 'steel-bar-wavering-phrase-e',
    name: 'Slow bar, wavering {E}',
    kind: 'melodic',
    description:
      'A steel guitar picks {E}, {G} and {A} and falls back to {E}, on tape whose speed wavers, dark repeats in a huge room.',
    preset: 'reel-room-slow-bar-wavering',
    // Picked and let go before the next: a note begun over a held one is a bend, with no pick.
    set: { swell: 0, pick: 0.75 },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7, hiss: 0.2 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { presence: -6, highCut: 1000 } },
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { tone: 1500, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.35 } },
    ],
    ...played(
      12,
      [
        [0, 1.9, 64, 0.8],
        [2.07, 1.6, 67, 0.7],
        [3.86, 2.2, 69, 0.7],
        [6.31, 3.2, 64, 0.75],
      ],
      3,
    ),
  },

  {
    n: 96,
    id: 'plucks-into-murk-am',
    name: 'Plucks into murk {A}m',
    kind: 'melodic',
    description:
      'Plucked strings on {A}, {E}, {C}, {B} and {G}, each pick softened, dark repeats piling up in a long plate; it comes round.',
    preset: 'reel-room-swells-into-murk',
    // Plucked at once and softened only a little: with the preset's long fades there is no note to hear begin.
    set: { attack: 0.01 },
    effects: [
      softPick,
      {
        deviceId: 'analog-delay',
        preset: 'Murky',
        params: { tone: 1600, feedback: 0.3, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
      // Nearer the middle: four keys up there was more at the sides than between them.
      narrow,
    ],
    ...cycled(8, [
      [0.02, 2, 57, 0.8],
      [1.11, 1.8, 64, 0.7],
      [2.39, 2, 60, 0.7],
      [3.8, 2.5, 59, 0.65],
      [5.59, 2, 55, 0.7],
    ]),
    loopFold: 'power',
  },

  {
    n: 97,
    id: 'nylon-thumb-fall-c',
    name: 'Nylon thumb fall {C}',
    kind: 'melodic',
    description:
      'A nylon guitar steps down from {G} to {C} with the thumb and drops to a low {C}, plucks softened, on a slow reel.',
    preset: 'reel-room-nylon-thumb-only',
    effects: [
      softPick,
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, output: 2 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 4, highCut: 2500, mix: 0.3 } },
    ],
    ...played(
      10,
      [
        [0, 1.8, 67, 0.8],
        [0.81, 1.6, 64, 0.75],
        [1.54, 1.8, 62, 0.75],
        [2.73, 2, 60, 0.8],
        [4.26, 1.6, 55, 0.75],
        [5.18, 3, 48, 0.8],
      ],
      2.5,
    ),
    skipSec: 0.015,
  },

  {
    n: 98,
    id: 'steel-string-cassette-round-em',
    name: 'Cassette round {E}m',
    kind: 'melodic',
    description:
      'A steel-string climbs {E} minor from a low {E} and steps back by {D} and {B} to {G}, on a warped cassette; it comes round.',
    preset: 'reel-room-dashboard-cassette',
    // A cassette less far gone, as the single chord has it: its dropouts were heard as notes.
    effects: [
      {
        deviceId: 'patina',
        preset: 'Falling apart',
        params: { wobble: 0.6, wear: 0.3, noise: 0.4 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 1600 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 6, damping: 0.6, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.02, 1.6, 52, 0.8],
      [0.86, 1.4, 59, 0.7],
      [1.61, 1.6, 64, 0.75],
      [2.94, 1.4, 62, 0.7],
      [3.71, 1.6, 59, 0.7],
      [5.12, 2.2, 55, 0.75],
    ]),
    loopFold: 'power',
  },

  {
    n: 99,
    id: 'harp-descent-slow-reel-am',
    name: 'Slow reel harp fall {A}m',
    kind: 'melodic',
    description:
      'A harp falls through {A} minor from a high {E} to a low {A}, attacks rounded off, on a slow reel in a very large space.',
    preset: 'reel-room-harp-pluck-removed',
    effects: [
      softPick,
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.4 } },
    ],
    ...played(
      11,
      [
        [0, 2, 76, 0.8],
        [0.92, 2, 72, 0.75],
        [1.81, 2, 69, 0.75],
        [2.97, 2, 67, 0.7],
        [3.88, 2, 64, 0.75],
        [5.21, 3, 57, 0.8],
      ],
      3,
    ),
    skipSec: 0.02,
  },

  {
    n: 100,
    id: 'felt-piano-rise-slowed-c',
    name: 'Felt piano rise {C}',
    kind: 'melodic',
    description:
      'A felt piano climbs from {C} by {E} and {G} to a high {D} and rests on {C}, a loop at half speed answering an octave down.',
    preset: 'reel-room-four-notes-slowed',
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slowed down',
        params: { length: 4, feedback: 0.5, mix: 0.6 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 1800 } },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 3000, mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 1.4, 60, 0.8],
        [1.12, 1.3, 64, 0.75],
        [2.31, 1.4, 67, 0.75],
        [3.74, 1.8, 74, 0.8],
        [5.63, 2.5, 72, 0.8],
      ],
      3,
    ),
  },
])
