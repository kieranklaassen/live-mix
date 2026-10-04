// The sounds of the pack "Six Squared": its presets played, a hundred sounds to
// paint with. Numbers 23001 to 23100.

import { PRESETS } from '../packs/six-squared'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('six-squared', 23000, PRESETS, [
  // Drones: what hums under the town at night. One note each, or a note and its fifth where one
  // static note is too loud at the bank's peak, with whatever stirs in the preset (a second
  // oscillator, a chorus, a reverb that breathes) held still, so the level stays put.
  {
    n: 1,
    id: 'substation-hum-g',
    name: 'Substation hum {G}',
    kind: 'drone',
    description:
      'A still low {G} given harmonics by a valve, over fifty-hertz mains hum in a hall.',
    preset: 'six-squared-substation',
    // More of the sub octave than the preset has: it keeps the level down in the higher keys.
    set: { detune: 0, sub: 0.45 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [43]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'cooling-towers-e',
    name: 'Cooling towers {E}',
    kind: 'drone',
    description:
      'A saw on {E} and the {B} above with a slowly turning pulse an octave under, half shut, lightly fuzzed in a dark hall.',
    preset: 'six-squared-cooling-towers',
    // One voice, no sweep of the filter, the pulse turning once a loop, and a hall in place of
    // the reverb that breathes: nothing moves the level. A fifth, a filter further open, less of
    // the pulse and of the fuzz and no sub: as the preset has it one note is two or three partials
    // squared off, far too loud for a drone at the bank's peak in the higher keys.
    set: {
      lfo1Amount: 0,
      lfo2Rate: 0.125,
      unisonVoices: 1,
      subLevel: 0,
      oscMix: 0.25,
      cutoff: 900,
      keyTrack: 0.5,
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.15 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.5 } },
      quarterTurn(8),
    ],
    ...looped(8, 6, 3, [52, [59, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'motorway-far-off-dm',
    name: 'Motorway far off {D}m',
    kind: 'drone',
    description:
      'A just {D} minor chord of still partials over its sub octave, driven into saturation in a damped hall.',
    preset: 'six-squared-motorway-at-a-distance',
    // The partials held where they are: left to wander they swell in some keys.
    set: { movement: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 8, 3, [50]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'glow-over-the-town-c',
    name: 'Glow over the town {C}',
    kind: 'drone',
    description:
      'One {C} held as a just major chord with a little tuned air, compressed over steady hiss in a huge room.',
    preset: 'six-squared-glow-over-the-town',
    set: { movement: 0, air: 0.15, width: 0.5 },
    // The room as the preset has it, but not stirring, and narrower.
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { threshold: -28, makeup: 1.5 } },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -42, tone: -0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 16, highCut: 3800, width: 0.6, mix: 0.4, modDepth: 0 },
      },
      quarterTurn(8),
    ],
    ...looped(8, 7, 3, [60]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'under-the-flyover-a',
    name: 'Under the flyover {A}',
    kind: 'drone',
    description:
      'A square wave on a low {A} and the {E} above, each over its sub octave, chorus off, through a transformer in a hall.',
    preset: 'six-squared-under-the-flyover',
    set: { chorus: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [45, [52, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'bow-in-the-underpass-d',
    name: 'Bow in the underpass {D}',
    kind: 'drone',
    description:
      'One low {D} bowed with heavy pressure and no vibrato, on tape in a damped cathedral.',
    preset: 'six-squared-bow-in-the-underpass',
    // Pressed harder and brighter than the preset so the tone is full of partials, on a tape that
    // does not waver or drop out, in a hall that does not breathe, narrowed, with one slight swell.
    set: { vibrato: 0, pressure: 0.9, brightness: 0.7 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.5, bump: 0.7, hiss: 0.4, wow: 0, flutter: 0, age: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2600, mix: 0.5 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
      breathe(0.125, 0.3),
      quarterTurn(8),
    ],
    ...looped(8, 5, 3, [38]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'shut-filter-horns-f',
    name: 'Shut filter horns {F}',
    kind: 'drone',
    description:
      'One soft low synth horn on {F} with the filter nearly shut, warmed by a valve stage in a dark hall.',
    preset: 'six-squared-shut-filter-horns',
    // The two layers in tune with each other and a hall in place of the reverb that breathes.
    set: { detune: 0 },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Tube preamp',
        params: { driveDb: 9, toneDb: -2, outputDb: -9.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.4 } },
      quarterTurn(8),
    ],
    ...looped(8, 8, 3, [41]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'car-park-cellos-g',
    name: 'Car park cellos {G}',
    kind: 'drone',
    description:
      'The low octave of the string machine on one {G} with no ensemble, driven in a small dark room.',
    preset: 'six-squared-car-park-cellos',
    set: { ensemble: 0, drift: 0 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.5 } },
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { decay: 3, size: 0.25, mix: 0.5, modDepth: 0 },
      },
      quarterTurn(8),
    ],
    ...looped(8, 5, 3, [43]),
    tuning: 'whole-cycles',
  },
  {
    n: 9,
    id: 'sub-under-everything-c',
    name: 'Sub under everything {C}',
    kind: 'drone',
    description:
      'A soft square sub on a low {C} with the filter kept low, given harmonics by a valve in a short room.',
    preset: 'six-squared-sub-under-everything',
    set: { beat: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 4, 3, [36]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'reed-an-octave-under-a',
    name: 'Reed an octave under {A}',
    kind: 'drone',
    description:
      'A breathy bass clarinet on {A} heard mostly as its half-speed copy an octave below, on a slow reel in a hall.',
    preset: 'six-squared-reed-an-octave-under',
    // The half-speed loop is a second long, eight to the loop, and the reel does not waver. More of
    // the copy, of the head bump and of the hall, and one slight swell: a single reed is too loud.
    set: { breath: 0.5 },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Under the mix',
        params: { length: 1000, jitter: 0, highCut: 2000, mix: 0.85 },
      },
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { speed: 2, drive: 0.4, bump: 1, wow: 0, flutter: 0, age: 0 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { lowDecay: 4, damping: 2600, mix: 0.5 },
      },
      breathe(0.125, 0.2),
      quarterTurn(8),
    ],
    ...looped(8, 5, 3, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 11,
    id: 'low-brass-at-closing-e',
    name: 'Low brass at closing {E}',
    kind: 'drone',
    description: 'One low brass player holding {E}, warmed by saturation in a damped cathedral.',
    preset: 'six-squared-low-brass-at-closing',
    // One player, not the section, and a hall in place of the reverb that breathes.
    set: { section: 0 },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 8, outputDb: -5 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2400, mix: 0.4 } },
      quarterTurn(8),
    ],
    ...looped(8, 8, 3, [40]),
    tuning: 'whole-cycles',
  },
  {
    n: 12,
    id: 'sodium-glow-held-g',
    name: 'Sodium glow held {G}',
    kind: 'drone',
    description:
      'Dark synth brass on {G} and the {D} above, pushed hard into saturation over steady hiss in a damped cathedral.',
    preset: 'six-squared-sodium-glow',
    set: { detune: 0 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }, quarterTurn(8)],
    ...looped(8, 7, 3, [55, [62, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 13,
    id: 'wet-tarmac-held-f',
    name: 'Wet tarmac held {F}',
    kind: 'drone',
    description:
      'A saw on {F} over its sub octave with the chorus off, saturated and compressed over hiss in a dark hall.',
    preset: 'six-squared-wet-tarmac',
    set: { wave: 0, chorus: 0, volume: -10 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [53]),
    tuning: 'whole-cycles',
  },
  {
    n: 14,
    id: 'lone-muted-bow-a',
    name: 'Lone muted bow {A}',
    kind: 'drone',
    description:
      'A muted bow holding a low {A} with a faint {E} above it and no vibrato, recorded to tape in a damped cathedral.',
    preset: 'six-squared-muted-quartet-on-tape',
    // One player a note whose bow is not heard to turn, on a tape that does not waver or drop out,
    // with all of its head bump, narrowed. The faint fifth keeps one static note from being too loud.
    set: { players: 1, scatter: 0, bow: 0 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.5, hiss: 0.35, bump: 1, wow: 0, flutter: 0, age: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2500, mix: 0.45 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
      quarterTurn(8),
    ],
    ...looped(8, 6, 3, [45, [52, 0.25]]),
    tuning: 'whole-cycles',
  },

  // Pads: the chords the pack is made of, each moving the way its preset moves (a filter that
  // opens and shuts, a table that turns, a reverb let in in waves), at a rate the loop comes
  // round on. A few are played once and left to go.
  {
    n: 15,
    id: 'harmonium-in-the-hall-f',
    name: 'Harmonium in the hall {F}',
    kind: 'pad',
    description:
      'A low reed fifth on {F} and {C} with a beating second rank, swelling in a huge dark space.',
    preset: 'six-squared-harmonium-in-the-hall',
    // The second rank less far off: at the preset's amount its beats are heard as notes.
    set: { celeste: 0.35 },
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 6, 3, [41, [48, 0.8]]),
  },
  {
    n: 16,
    id: 'steamed-up-window-em',
    name: 'Steamed-up window {E}m',
    kind: 'pad',
    description:
      'A wavetable chord of {E} minor turning once a loop under a low filter, saturated in a dark cathedral.',
    preset: 'six-squared-night-bus-window',
    set: { rate: 0.125, spread: 0.25 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 3, [52, 59, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 17,
    id: 'last-bus-strings-am7',
    name: 'Last bus strings {A}m7',
    kind: 'pad',
    description:
      'Two beating string layers on {A} minor seventh under a low-pass that opens and shuts once a loop, on tape.',
    preset: 'six-squared-last-bus-strings',
    // The sweep at one turn in sixteen seconds, and a tape that does not drop out.
    effects: [
      {
        deviceId: 'auto-filter',
        params: { slope: 1, cutoffHz: 1400, resonance: 1.1, lfoAmount: 45, lfoRateHz: 0.0625 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.35, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, damping: 3000, mix: 0.4 } },
      breathe(0.0625, 0.5),
    ],
    ...looped(16, 6, 3, [45, 52, [60, 0.8], [64, 0.8], [67, 0.7]]),
  },
  {
    n: 18,
    id: 'estate-at-night-d',
    name: 'Estate at night {D}',
    kind: 'pad',
    description:
      'A narrow resonant band on {D} and {A} that sounds half sung, on cassette, swelling in a low vowel hall.',
    preset: 'six-squared-estate-at-night',
    // A cassette that does not drop out: a dropout under a held chord is heard as a note.
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wobble: 0.3, noise: 0.35, wear: 0.05 },
      },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 14, mix: 0.4 } },
      breathe(0.125, 0.45),
    ],
    ...looped(8, 7, 3, [50, 57, [62, 0.8]]),
  },
  {
    n: 19,
    id: 'thin-hours-gsus2',
    name: 'Thin hours {G}sus2',
    kind: 'pad',
    description:
      'A thin moving pulse on {G}, {D} and {A} with no sub, rising twice a loop in a cave of dull echoes over hiss.',
    preset: 'six-squared-thin-hours',
    then: [breathe(0.25, 0.4)],
    ...looped(8, 6, 3, [55, 62, [69, 0.8], [74, 0.6]]),
  },
  {
    n: 20,
    id: 'glowing-saws-em',
    name: 'Glowing saws {E}m',
    kind: 'pad',
    description:
      'Four detuned saw voices on {E} minor under a filter that breathes once a loop, driven hard in a dark hall.',
    preset: 'six-squared-glowing-saws',
    // The voices half as far apart as the preset has them, whose beats are heard as notes.
    set: { lfo1Rate: 0.0625, lfo2Rate: 0.25, unisonDetune: 10 },
    ...looped(16, 6, 3, [52, 59, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 21,
    id: 'frost-on-glass-c',
    name: 'Frost on glass {C}',
    kind: 'pad',
    description:
      'A triangle and a thin pulse on open fifths of {C} and {G}, widened, swelling under a faint octave halo.',
    preset: 'six-squared-frost-on-glass',
    // One voice a note and the pulse in tune with the triangle: the beating is heard as notes.
    set: { lfo1Rate: 0.125, lfo2Rate: 0.25, unisonVoices: 1, osc2Fine: 0 },
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 6, 3, [60, 67, [72, 0.8], [79, 0.6]]),
  },
  {
    n: 22,
    id: 'streetlamp-strings-g',
    name: 'Streetlamp strings {G}',
    kind: 'pad',
    description:
      'The string ensemble on {G} major with its tone rolled down, saturated and swelling in a damped cathedral.',
    preset: 'six-squared-streetlamp-strings',
    // Less of the top octave and of the ensemble: at the preset's amounts they beat into notes.
    set: { high: 0.15, ensemble: 0.6 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [43, 55, [59, 0.8], [62, 0.8], [67, 0.7]]),
  },
  {
    n: 23,
    id: 'top-deck-phaser-d',
    name: 'Top deck phaser {D}',
    kind: 'pad',
    description:
      'The top octave of the ensemble on {D} and {A} through a phaser that turns once a loop, in a dark cathedral.',
    preset: 'six-squared-top-deck-phaser',
    // A hall in place of the plate, whose drift under a held chord is heard as notes, and a
    // phaser with less feedback and less between the sides.
    set: { ensemble: 0.4, speed: 0.7 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { rate: 0.0625, feedback: 30, depth: 60, stereo: 20, mix: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 3000, mix: 0.4 } },
      breathe(0.0625, 0.45),
    ],
    ...looped(16, 6, 3, [50, 57, [62, 0.8]]),
  },
  {
    n: 24,
    id: 'rooftops-at-five-c',
    name: 'Rooftops at five {C}',
    kind: 'pad',
    description:
      'A reed tone on {C} major that sharpens to a saw and back once a loop, through a triode into a huge space.',
    preset: 'six-squared-rooftops-at-five',
    set: { rate: 0.0625 },
    then: [breathe(0.0625, 0.4)],
    ...looped(16, 5, 3, [48, 55, [60, 0.8], [64, 0.8]]),
  },
  {
    n: 25,
    id: 'empty-platform-g',
    name: 'Empty platform {G}',
    kind: 'pad',
    description:
      'A woody odd-harmonic tone on {G} and {D} with a strong sub, swelling and sinking twice a loop in a dark hall.',
    preset: 'six-squared-empty-platform',
    // The swell at two turns a loop in place of the preset's random one, which never comes round.
    set: { rate: 0.125 },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 0.25, depth: 0.6, shape: 0, phase: 0, drift: 0, smooth: 0.7 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 7, damping: 0.65, breathDepth: 0, mix: 0.4 },
      },
    ],
    ...looped(8, 6, 3, [43, 50, [55, 0.8]]),
  },
  {
    n: 26,
    id: 'mist-on-the-canal-e',
    name: 'Mist on the canal {E}',
    kind: 'pad',
    description:
      'A spectral table on fifths from {E}, broken into slow grains, swelling once a loop in a long dark reverb.',
    preset: 'six-squared-mist-on-the-canal',
    set: { rate: 0.0625 },
    // The reverb without its falling grains, which sound a semitone under the notes.
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { spread: 0.5, mix: 0.5 } },
      {
        deviceId: 'bloom-reverb',
        preset: 'Long dark',
        params: { bloom: 0, width: 0.4, mix: 0.45 },
      },
      breathe(0.0625, 0.45),
    ],
    ...looped(16, 7, 3, [52, 59, [64, 0.8], [71, 0.6]]),
  },
  {
    n: 27,
    id: 'late-service-f',
    name: 'Late service {F}',
    kind: 'pad',
    description:
      'Low men singing Oh on {F} and {C} with no vibrato, softly saturated, swelling in a damped cathedral.',
    preset: 'six-squared-late-service',
    set: { ensemble: 0.2 },
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [41, 48, [53, 0.8]]),
  },
  {
    n: 28,
    id: 'vowels-turning-c',
    name: 'Vowels turning {C}',
    kind: 'pad',
    description:
      'A choir on {C} major moving through its vowels on a slow seasick reel, let into a reverb in waves.',
    preset: 'six-squared-vowels-turning',
    set: { ensemble: 0.2, vibrato: 3 },
    // A reel that does not drop out, and the waves of the reverb at two to the loop.
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, drive: 0.45, age: 0 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 9, damping: 0.55, mix: 0.4, breathRate: 0.25 },
      },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 7, 3, [48, 55, [60, 0.8], [64, 0.7]]),
  },
  {
    n: 29,
    id: 'strings-off-the-reel-dm',
    name: 'Strings off the reel {D}m',
    kind: 'pad',
    description:
      'A violin section on {D} minor from tape, saturated and compressed, swelling in a dark cathedral.',
    preset: 'six-squared-strings-off-the-reel',
    // Newer, quieter tape than the preset's: its dropouts under a held chord are heard as
    // notes, and its hiss and wide vibrato as noise.
    set: { age: 0.1, hiss: 0.1, vibrato: 0.2 },
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 5, 3, [50, 57, [62, 0.8], [65, 0.8]]),
  },
  {
    n: 30,
    id: 'half-speed-horns-g',
    name: 'Half-speed horns {G}',
    kind: 'pad',
    description:
      'French horns on tape at half speed on {G} and {D}, an octave down and dull, swelling over room rumble.',
    preset: 'six-squared-half-speed-horn-rumble',
    set: { age: 0.1 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [55, 62, [67, 0.8]]),
  },
  {
    n: 31,
    id: 'reeds-across-a-field-f',
    name: 'Reeds across a field {F}',
    kind: 'pad',
    description:
      'A tape reed section on {F} major under a low-pass that moves once a loop, in a reverb that swells up.',
    preset: 'six-squared-reeds-across-a-field',
    set: { age: 0.1 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1300, resonance: 1, lfoAmount: 40, lfoRateHz: 0.125, lfoShape: 1 },
      },
      {
        deviceId: 'shaped-reverb',
        preset: 'Bloom',
        params: { time: 3.5, highCut: 4500, mix: 0.45 },
      },
      breathe(0.125, 0.45),
    ],
    ...looped(8, 5, 3, [53, 60, [65, 0.8], [69, 0.7]]),
  },
  {
    n: 32,
    id: 'slow-beating-pad-a',
    name: 'Slow beating pad {A}',
    kind: 'pad',
    description:
      'An FM pad on {A} and {E} with slowly beating operator pairs, saturated over steady hiss in a huge dark space.',
    preset: 'six-squared-slow-beating-pad',
    // The preset's chain with the space half as wide: it thins out in mono in some keys.
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 10, outputDb: -6 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { threshold: -28, ratio: 3, makeup: -3 },
      },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -44 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 4000, width: 0.5, mix: 0.4 },
      },
      breathe(0.125, 0.4),
    ],
    ...looped(8, 6, 3, [45, 57, [64, 0.8], [69, 0.7]]),
  },
  {
    n: 33,
    id: 'chapel-on-the-corner-c',
    name: 'Chapel on the corner {C}',
    kind: 'pad',
    description:
      'Soft flute ranks on {C} major through a slowly turning speaker across the room, on tape in a cathedral.',
    preset: 'six-squared-chapel-on-the-corner',
    // A tape that does not drop out, and a swell the loop comes round on over the speaker's own.
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.7, spread: 0.7 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.4, hiss: 0.3, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2600, mix: 0.4 } },
      breathe(0.125, 0.45),
    ],
    ...looped(8, 4, 3, [48, 60, [64, 0.8], [67, 0.8]]),
    loopFold: 'linear',
  },
  {
    n: 34,
    id: 'slow-fold-at-dusk-dsus4',
    name: 'Slow fold at dusk {D}sus4',
    kind: 'pad',
    description:
      'A folded tone on {D}, {A} and {G} that drifts in pitch, doubled, rising once a loop in a huge dark space.',
    preset: 'six-squared-slow-fold-at-dusk',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [50, 57, [62, 0.8], [67, 0.7]]),
  },
  {
    n: 35,
    id: 'string-never-stops-d',
    name: 'String never stops {D}',
    kind: 'pad',
    description:
      'Four strings on {D} and {A} held singing by a magnetic sustainer, saturated, swelling in a damped cathedral.',
    preset: 'six-squared-string-that-never-stops',
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 6, 3, [50, 57, [62, 0.8], [69, 0.6]]),
  },
  {
    n: 36,
    id: 'frozen-strings-am7',
    name: 'Frozen strings {A}m7',
    kind: 'pad',
    description:
      'One instant of a string ensemble on {A} minor seventh held as a dense dull cloud, swelling in a damped cathedral.',
    preset: 'six-squared-any-sound-frozen',
    source: 'strings-am7',
    set: { detune: 3, spread: 0.25 },
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 37,
    id: 'slowed-violins-c',
    name: 'Slowed violins {C}',
    kind: 'pad',
    description:
      'Two violins on {C} and {G} an octave down on an unsteady loop, saturated over hiss in a damped cathedral.',
    preset: 'six-squared-borrowed-sound-slowed',
    source: 'violin-drone-c',
    // In tune with the bank (the preset plays six cents sharp) and well over the hiss.
    set: { fine: 0, volume: -10 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 38,
    id: 'clarinet-from-nothing-a',
    name: 'Clarinet from nothing {A}',
    kind: 'pad',
    description:
      'Four clarinets on {A} and {E} over a low {A}, swelling in from silence and slow to leave, in a damped cathedral.',
    preset: 'six-squared-clarinet-from-nothing',
    ...played(
      12,
      [
        [0, 4.8, 45, 0.7],
        [0.3, 4.5, 57, 0.8],
        [0.6, 4.2, 64, 0.7],
        [0.9, 3.9, 69, 0.5],
      ],
      2.5,
    ),
  },
  {
    n: 39,
    id: 'comedown-strings-dsus2',
    name: 'Comedown strings {D}sus2',
    kind: 'pad',
    description:
      'Dark fifths on {D}, {A} and {E} whose filter opens slowly while they are held, drifting on cassette into a plain hall.',
    preset: 'six-squared-comedown-strings',
    // A shorter release so it ends, and a quieter cassette that does not drop out, narrowed.
    set: { release: 4, sub: 0.2 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.5, hiss: 0.15, age: 0.05 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 7, tone: 3500, mix: 0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
    ],
    ...played(
      13,
      [
        [0, 6.5, 50, 0.8],
        [0, 6.5, 57, 0.7],
        [0, 6.5, 64, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 40,
    id: 'guitar-with-no-attack-em',
    name: 'Guitar, no attack {E}m',
    kind: 'pad',
    description:
      'An open {E} minor chord on six strings swelling in like bows, saturated, with a low octave under the reverb.',
    preset: 'six-squared-guitar-with-no-attack',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...played(
      12,
      [
        [0, 5.5, 40, 0.8],
        [0, 5.5, 47, 0.7],
        [0, 5.5, 52, 0.7],
        [0, 5.5, 55, 0.7],
        [0, 5.5, 59, 0.7],
        [0, 5.5, 64, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 41,
    id: 'distant-band-practice-c',
    name: 'Distant band practice {C}',
    kind: 'pad',
    description:
      'A trumpet section blowing {C} major softly from the far end of a room, left in a damped cathedral.',
    preset: 'six-squared-distant-band-practice',
    // A smaller section: at the preset's size the players' entries are heard as notes in some keys.
    set: { section: 0.4 },
    ...played(
      10,
      [
        [0, 4.5, 60, 0.8],
        [0, 4.5, 64, 0.7],
        [0, 4.5, 67, 0.7],
        [0, 4.5, 72, 0.6],
      ],
      2.5,
    ),
  },

  // Textures: the weather outside the room the music is made in, and the hiss the music is
  // pressed into. No pitch to speak of.
  {
    n: 42,
    id: 'rain-on-the-shelter',
    name: 'Rain on the bus shelter',
    kind: 'texture',
    description:
      'Steady rain close overhead with single drops in it, recorded hot to cassette in a small close room.',
    preset: 'six-squared-bus-shelter-rain',
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 43,
    id: 'tower-block-wind',
    name: 'Wind round the tower',
    kind: 'texture',
    description:
      'Wind with a faint whistle in it under a low-pass that moves once a loop, far off in a huge space.',
    preset: 'six-squared-wind-round-the-tower',
    // Steadier than the preset: its gusts can fall evenly and be heard as a pulse.
    set: { movement: 0.2, resonance: 0.2 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1500, resonance: 0.5, lfoAmount: 40, lfoRateHz: 0.125 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, highCut: 4000, width: 0.8, mix: 0.35 },
      },
    ],
    ...looped(8, 4, 3, [57]),
  },
  {
    n: 44,
    id: 'thunder-on-the-moor',
    name: 'Thunder over the moor',
    kind: 'texture',
    description:
      'Far thunder rolling now and then over room rumble in a huge dark space, held back by a slow compressor.',
    preset: 'six-squared-thunder-over-the-moor',
    // The rolls come when they like: a compressor holds them near the level of the rumble.
    then: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -50, ratio: 8, attack: 200, release: 2, makeup: 12 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.7 } },
    ],
    ...looped(16, 6, 4, [36, 43]),
  },
  {
    n: 45,
    id: 'birds-before-the-buses',
    name: 'Birds before the buses',
    kind: 'texture',
    description:
      'Birds all over the estate at daybreak, too far off to tell apart, on quiet tape with open air round them.',
    preset: 'six-squared-blackbird-before-buses',
    // A crowd a long way off in place of the one bird close by, whose song is a phrase.
    set: { density: 1, distance: 1, movement: 1, tone: 0.3 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.15, hiss: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 5, highCut: 4000, width: 0.75, mix: 0.65 },
      },
    ],
    ...looped(16, 4, 3, [48, 53, 57, 60, 64, 67, 72, 77]),
  },
  {
    n: 46,
    id: 'letterbox-draught',
    name: 'Letterbox draught',
    kind: 'texture',
    description:
      'Broad low bands of noise whose pitch wanders, like air moving in a pipe, saturated in a reverb let in in waves.',
    preset: 'six-squared-draught-under-the-door',
    set: { breatheRate: 0.125 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 2 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 4, outputDb: -8 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 10, damping: 0.6, mix: 0.4, breathRate: 0.25 },
      },
    ],
    ...looped(8, 6, 3, [40, 47]),
  },
  {
    n: 47,
    id: 'breath-on-the-mic-am',
    name: 'Breath on the mic',
    kind: 'texture',
    description:
      'Almost all breath and very little voice on a low minor chord, in microphone air, under a slow band-pass.',
    preset: 'six-squared-breath-on-the-mic',
    // More of the breath let through, a broader band and less of the halo: air, not a chord.
    set: { tone: 8000, width: 0.6 },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, cutoffHz: 1000, resonance: 0.5, lfoAmount: 40, lfoRateHz: 0.125 },
      },
      { deviceId: 'shimmer', preset: 'Undertow', params: { shimmer: 0.35, mix: 0.25 } },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -29, follow: 0 } },
    ],
    ...looped(8, 7, 3, [45, 48, 52]),
  },
  {
    n: 48,
    id: 'crackle-run-backwards',
    name: 'Crackle run backwards',
    kind: 'texture',
    description:
      'Record crackle in long reversed grains, piled up on a slowed tape loop four seconds round, in a hall.',
    preset: 'six-squared-any-sound-reversed',
    source: 'record-crackle',
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 49,
    id: 'rain-slowed-down',
    name: 'Rain slowed down',
    kind: 'texture',
    description:
      'Rain on a window an octave down on an unsteady loop, saturated over steady hiss in a damped cathedral.',
    preset: 'six-squared-borrowed-sound-slowed',
    source: 'rain-on-the-window',
    set: { fine: 0, volume: -10 },
    ...looped(8, 4, 3, [60]),
  },
  {
    n: 50,
    id: 'mostly-tape-hiss',
    name: 'Mostly tape hiss',
    kind: 'texture',
    description:
      'Shaded tape hiss and reel noise rising and falling once a loop over a thin string chord barely there.',
    preset: 'six-squared-hiss-between-songs',
    // The strings turned right down: the hiss, which rises as they fall, is what is heard.
    set: { volume: -36 },
    then: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { low: 6, highCut: 2500 } },
      breathe(0.125, 0.85),
    ],
    ...looped(8, 4, 3, [57, 64]),
  },
  {
    n: 51,
    id: 'far-motorway-wash',
    name: 'Far motorway wash',
    kind: 'texture',
    description:
      'A low even roar like traffic a mile off: dark wind under a shut low-pass, on tape in a huge space.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 0.8,
        movement: 0.15,
        tone: 0.2,
        resonance: 0,
        size: 0.8,
        width: 0.6,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'auto-filter', params: { slope: 1, cutoffHz: 500, resonance: 0.7 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.3 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 10, highCut: 3000, width: 0.7, mix: 0.35 },
      },
    ],
    ...looped(8, 4, 3, [48]),
  },
  {
    n: 52,
    id: 'shortwave-left-on',
    name: 'Shortwave left on',
    kind: 'texture',
    description:
      'Bands of tuned noise on a shortwave radio left between stations, fading in and out of its static in a hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { center: 62, resonance: 20, attack: 0.5, release: 4, breatheRate: 0.25 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Night shortwave', params: { drift: 0 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
    ...looped(8, 6, 2, [50, 57]),
  },
  {
    n: 53,
    id: 'breath-in-the-vents-dm',
    name: 'Breath in the vents',
    kind: 'texture',
    description:
      'Low flutes blown so softly they are mostly air, on a low minor chord under a slow low-pass in a huge room.',
    preset: 'six-squared-breath-in-the-vents',
    effects: [
      {
        deviceId: 'auto-filter',
        params: { cutoffHz: 1600, resonance: 0.9, lfoAmount: 45, lfoRateHz: 0.125 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, highCut: 4000, mix: 0.4 } },
    ],
    ...looped(8, 6, 3, [38, 41, 45]),
  },

  // One-shots: one bell, one key, one stab. Where a preset has an echo that never lets a note
  // end, the echo is turned down to a repeat or two, so the note rings out in its reverb.
  {
    n: 54,
    id: 'far-church-bell-d',
    name: 'Far church bell {D}',
    kind: 'oneshot',
    description:
      'One stroke of a church bell on {D} with its top rolled off, heard far away through sparse dark echoes.',
    preset: 'six-squared-far-church-bell',
    // Struck where its major third does not sound, which leaves every partial on a white key,
    // and ringing eight seconds, not eighteen.
    set: { position: 0.667, decay: 8 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4500, lowCut: 80 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 6, mix: 0.3 } },
    ],
    ...played(10, [[0, 2, 62]], 3),
  },
  {
    n: 55,
    id: 'loft-music-box-c',
    name: 'Loft music box {C}',
    kind: 'oneshot',
    description: 'One small hard metal bar on a high {C}, on a worn cassette in a dark hall.',
    preset: 'six-squared-loft-music-box',
    // No looper: it would keep the note going round for ever.
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wobble: 0.3, noise: 0.35, wear: 0.1 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 3000, mix: 0.35 },
      },
    ],
    ...played(5, [[0, 0.6, 84]], 1.5),
  },
  {
    n: 56,
    id: 'vibes-motor-running-e',
    name: 'Vibes, motor running {E}',
    kind: 'oneshot',
    description:
      'One soft vibraphone bar on {E} with a slow motor throb, on tape in a damped cathedral.',
    preset: 'six-squared-vibes-motor-running',
    set: { motor: 0.3 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, wow: 0.35, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2800, mix: 0.3 } },
    ],
    ...played(8, [[0, 2, 64]], 2.5),
  },
  {
    n: 57,
    id: 'slowed-steel-pan-a',
    name: 'Slowed steel pan {A}',
    kind: 'oneshot',
    description:
      'One low handpan note on {A} struck softly and mostly heard at half speed, an octave down, in a dark hall.',
    preset: 'six-squared-slowed-steel-pan',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { highCut: 3500, mix: 0.65 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.3, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, damping: 2600, mix: 0.4 } },
    ],
    ...played(8, [[0, 2, 57]], 2.5),
  },
  {
    n: 58,
    id: 'piano-down-the-landing-f',
    name: 'Landing piano {F}',
    kind: 'oneshot',
    description:
      'A soft felted piano chord of low {F} and {C} with its own room off, on cassette in a damped cathedral.',
    preset: 'six-squared-piano-down-the-landing',
    // Low on the keyboard and louder into a quieter cassette than the preset's: its level holds from
    // key to key and the chord, not the hiss, is what is heard.
    set: { outputDb: -6 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.3, hiss: 0.15, age: 0.05 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2400, mix: 0.5 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
    ],
    ...played(
      6,
      [
        [0, 2.5, 41, 0.6],
        [0.01, 2.5, 48, 0.5],
        [0.02, 2.5, 53, 0.55],
      ],
      2,
    ),
  },
  {
    n: 59,
    id: 'sampler-piano-stab-am',
    name: 'Sampler piano stab {A}m',
    kind: 'oneshot',
    description:
      'A hard bare piano chord of {A} minor through the grain of an early sampler, in a long plate.',
    preset: 'six-squared-piano-from-a-sampler',
    // No tape loop: it would bring the chord round for half a minute.
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 13000, jitter: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.45 } },
      { deviceId: 'stereo-widener', params: { width: 0.4 } },
    ],
    ...played(
      5,
      [
        [0, 1.2, 57, 0.8],
        [0, 1.2, 60, 0.7],
        [0, 1.2, 64, 0.7],
        [0, 1.2, 69, 0.75],
      ],
      2,
    ),
  },
  {
    n: 60,
    id: 'midnight-tines-dm7',
    name: 'Midnight tines {D}m7',
    kind: 'oneshot',
    description:
      'A dull electric piano chord of {D} minor seventh under a deep slow chorus, saturated in a damped hall.',
    preset: 'six-squared-tines-after-midnight',
    ...played(
      7,
      [
        [0, 2, 50, 0.7],
        [0.012, 2, 57, 0.6],
        [0.024, 2, 60, 0.6],
        [0.036, 2, 65, 0.65],
      ],
      2,
    ),
  },
  {
    n: 61,
    id: 'keys-from-next-door-e',
    name: 'Keys from next door {E}',
    kind: 'oneshot',
    description:
      'One bell tine on a high {E} heard thin through a small speaker across a room, with a faint tape repeat.',
    preset: 'six-squared-keys-from-next-door',
    // A tine that dies sooner, less of the speaker's room and one faint repeat: the room's first
    // echo and the tape's were heard as second notes in some keys. Narrowed.
    set: { decay: 0.4 },
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { drive: 0.1, distance: 0.5, room: 0.2, noise: 0.25 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 420, feedback: 0.1, mix: 0.08 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { damping: 0.6, mix: 0.3, breathDepth: 0 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.2 } },
    ],
    ...played(4, [[0, 0.5, 76]], 1.5),
  },
  {
    n: 62,
    id: 'wet-road-strum-am',
    name: 'Wet road strum {A}m',
    kind: 'oneshot',
    description:
      'A strum of {A} minor on the neck pickup, rounded by tape saturation, with a faint dark chorus echo in a damped hall.',
    preset: 'six-squared-wet-road-guitar',
    set: { strum: 25 },
    // Saturated before the echo: the pick is otherwise all peak and the chord behind it faint.
    effects: [
      soften(9),
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 440, tone: 2600, feedback: 0.2, mix: 0.15 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 3000, mix: 0.45 },
      },
    ],
    ...played(
      6,
      [
        [0, 3.5, 45, 0.7],
        [0, 3.5, 52, 0.65],
        [0, 3.5, 57, 0.65],
        [0, 3.5, 60, 0.7],
        [0, 3.5, 64, 0.7],
      ],
      2,
    ),
  },
  {
    n: 63,
    id: 'slow-reel-harp-note-g',
    name: 'Slow reel harp note {G}',
    kind: 'oneshot',
    description:
      'One silk string on {G} plucked lightly with a long ring, dulled by a slow reel in a small dark room.',
    preset: 'six-squared-harp-on-a-slow-reel',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { speed: 2, drive: 0.8, hiss: 0.3, age: 0 },
      },
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { decay: 4, size: 0.3, width: 0.75, mix: 0.35 },
      },
    ],
    ...played(5, [[0, 2, 55]], 1.5),
  },
  {
    n: 64,
    id: 'one-string-slowed-c',
    name: 'One string slowed {C}',
    kind: 'oneshot',
    description:
      'One felt-hammered string on {C} with a half-speed copy an octave under it and a faint worn tape repeat.',
    preset: 'six-squared-one-string-slowed',
    set: { decay: 4, release: 2 },
    // Saturated first: the hammer is otherwise all peak in the low keys.
    effects: [
      soften(10),
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { highCut: 4000, mix: 0.45 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 560, feedback: 0.2, mix: 0.12 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { damping: 0.6, mix: 0.3, breathDepth: 0 },
      },
    ],
    ...played(8, [[0, 2, 48]], 2.5),
  },
  {
    n: 65,
    id: 'sampler-choir-stab-am',
    name: 'Sampler choir stab {A}m',
    kind: 'oneshot',
    description:
      'A slice of a choir on {A} minor played once as a short stab at twelve bits, with a faint dub repeat in a huge room.',
    preset: 'six-squared-old-sampler-stab',
    source: 'choir-chord-am',
    // Cut from the held middle of the chord and let in at once, short and dull, so it lands as a stab.
    set: { attack: 0.002, start: 0.3, end: 0.6, tone: 900, release: 0.9 },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 11000 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dub wash',
        params: { time: 400, feedback: 0.25, mix: 0.1 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, highCut: 4000, mix: 0.25 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(6, [[0, 0.25, 60]], 2),
  },
  {
    n: 66,
    id: 'fruit-machine-pluck-a',
    name: 'Fruit machine pluck {A}',
    kind: 'oneshot',
    description:
      'One plucked triangle and pulse note on {A} with a fast filter snap, saturated, with no echo, in a huge space.',
    preset: 'six-squared-fruit-machine-fifths',
    // No delay: its repeat a fifth up would be a second note. A space that does not stir, whose
    // ripples were heard as notes in some keys.
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 16, outputDb: -6 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 6, highCut: 4500, width: 0.6, mix: 0.45, modDepth: 0, density: 1 },
      },
    ],
    ...played(4, [[0, 0.6, 57]], 2),
  },
  {
    n: 67,
    id: 'lone-fanfare-stab-g',
    name: 'Lone fanfare stab {G}',
    kind: 'oneshot',
    description:
      'One short polysynth brass chord of {G} major with a faint tape repeat, in a long plate.',
    preset: 'six-squared-looped-fanfare',
    // No looper: it would hold the chord as a bed for as long as the sound lasts.
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 500, feedback: 0.2, mix: 0.12 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.65, mix: 0.3 } },
    ],
    ...played(
      6,
      [
        [0, 0.5, 55, 0.8],
        [0, 0.5, 59, 0.7],
        [0, 0.5, 62, 0.7],
        [0, 0.5, 67, 0.75],
      ],
      2,
    ),
  },
  {
    n: 68,
    id: 'rain-arpeggio-note-e',
    name: 'Rain arpeggio note {E}',
    kind: 'oneshot',
    description:
      'One short filtered saw note on {E} with a dark delay repeat or two and a hall behind it.',
    preset: 'six-squared-arpeggio-in-rain',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3500, mix: 0.3 } },
      { deviceId: 'stereo-widener', params: { width: 0.4 } },
    ],
    ...played(3, [[0, 0.3, 64]], 1.5),
  },
  {
    n: 69,
    id: 'wooden-sequence-note-g',
    name: 'Wooden sequence note {G}',
    kind: 'oneshot',
    description:
      'One soft dull mallet pluck on {G} through a low-pass gate, pressed into saturation in a damped hall.',
    preset: 'six-squared-wooden-sequence',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 20, outputDb: -6 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.5 } },
    ],
    ...played(3, [[0, 0.5, 67]], 1.5),
  },
  {
    n: 70,
    id: 'cellar-bass-pluck-d',
    name: 'Cellar bass pluck {D}',
    kind: 'oneshot',
    description:
      'One plucked bass note on a low {D} with a quick filter snap, in a small dark room.',
    preset: 'six-squared-sequence-in-the-cellar',
    // Ringing a second, so the note has a pitch, and no echo.
    set: { decay: 1.2 },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { decay: 2.5, mix: 0.3 } }],
    ...played(2.5, [[0, 1, 38]], 1),
  },
  {
    n: 71,
    id: 'stairwell-nylon-note-e',
    name: 'Stairwell nylon note {E}',
    kind: 'oneshot',
    description:
      'One nylon string on {E} played with the flesh of the thumb, pressed into saturation in a damped cathedral.',
    preset: 'six-squared-nylon-in-the-stairwell',
    // Saturated after the tape: a single soft pluck is otherwise all peak and no body.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.6, hiss: 0.3, age: 0 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 18, outputDb: -6 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2800, mix: 0.5 } },
    ],
    ...played(5, [[0, 2.5, 52]], 2),
  },
  {
    n: 72,
    id: 'warm-tongue-drum-d',
    name: 'Warm tongue drum {D}',
    kind: 'oneshot',
    description:
      'One soft stroke on a tongue drum tuned to {D}, driven warm and left to ring in a huge dark room.',
    preset: 'six-squared-wearing-drum-loop',
    // No tape loop: it would bring the stroke round again for half a minute.
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, highCut: 3500, mix: 0.3 } },
    ],
    ...played(7, [[0, 2, 62]], 2.5),
  },
  {
    n: 73,
    id: 'twelve-bit-saw-stab-em',
    name: 'Twelve-bit saw stab {E}m',
    kind: 'oneshot',
    description:
      'A bare saw chord of {E} minor with no ensemble, sampled at twelve bits and stabbed once in a hall.',
    preset: 'six-squared-flyer-in-a-drawer',
    // No tape loop: it would bring the stab round for half a minute.
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 12000 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.35 } },
    ],
    ...played(
      3.5,
      [
        [0, 0.4, 52, 0.8],
        [0, 0.4, 59, 0.7],
        [0, 0.4, 64, 0.7],
        [0, 0.4, 67, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 74,
    id: 'ring-road-brass-f',
    name: 'Ring road brass {F}',
    kind: 'oneshot',
    description:
      'A polysynth brass chord of {F} major that speaks quickly with a filter overshoot, driven in a huge space.',
    preset: 'six-squared-ring-road-brass',
    ...played(
      8,
      [
        [0, 0.6, 53, 0.8],
        [0, 0.6, 57, 0.7],
        [0, 0.6, 60, 0.7],
        [0, 0.6, 65, 0.75],
      ],
      2.5,
    ),
  },
  {
    n: 75,
    id: 'brass-over-hiss-c',
    name: 'Brass over hiss {C}',
    kind: 'oneshot',
    description:
      'Two-saw synth brass on {C} and {G} that speaks at once and then mellows, with hiss that rises as it plays, in a plate.',
    preset: 'six-squared-brass-over-hiss',
    // Loudest and brightest at the very start, falling by a quarter, and narrower than the preset.
    set: {
      ampAttack: 0.01,
      filterAttack: 0.02,
      ampDecay: 1.2,
      ampSustain: 0.75,
      unisonSpread: 0.35,
    },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(
      6,
      [
        [0, 0.8, 48, 0.8],
        [0, 0.8, 55, 0.7],
        [0, 0.8, 60, 0.7],
      ],
      2.5,
    ),
  },

  // Phrases: the short sad loops the pack is built from. A few notes in free time, most of them
  // coming round on themselves so they can be laid end to end; the echoes are eased so the
  // repeats do not become a pulse.
  {
    n: 76,
    id: 'arpeggio-in-rain-am',
    name: 'Arpeggio in rain {A}m',
    kind: 'melodic',
    description:
      'Short filtered saw notes climbing {A} minor and stepping back down, with dark repeats; it comes round.',
    preset: 'six-squared-arpeggio-in-rain',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.3, mix: 0.25 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3500, mix: 0.3 } },
    ],
    ...cycled(8, [
      [0.02, 0.35, 57, 0.8],
      [0.83, 0.35, 64, 0.6],
      [1.71, 0.35, 69, 0.65],
      [2.49, 0.35, 72, 0.75],
      [3.62, 0.35, 71, 0.6],
      [4.58, 0.35, 67, 0.55],
      [5.71, 0.35, 64, 0.6],
    ]),
  },
  {
    n: 77,
    id: 'fruit-machine-fifths-c',
    name: 'Fruit machine fifths {C}',
    kind: 'melodic',
    description:
      'Plucked notes falling from a high {C} and turning back up, repeated a fifth away by the delay; it comes round.',
    preset: 'six-squared-fruit-machine-fifths',
    // The delay's clock steps play a note back a fifth up or a fourth up: no B and no F among the
    // notes, whose repeats would be black keys.
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 9, outputDb: -6 } },
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { time: 300, feedback: 0.3, mix: 0.25 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, highCut: 4500, mix: 0.3 } },
    ],
    ...cycled(
      8,
      [
        [0.32, 0.5, 72, 0.8],
        [1.01, 0.5, 67, 0.6],
        [1.88, 0.5, 69, 0.65],
        [3.13, 0.5, 64, 0.7],
        [4.42, 0.5, 62, 0.65],
        [5.09, 0.5, 64, 0.6],
        [6.23, 0.5, 67, 0.7],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 78,
    id: 'one-line-repeating-dm',
    name: 'One line repeating {D}m',
    kind: 'melodic',
    description:
      'A soft triangle lead rising through {D} minor and falling back, worn down by a tape loop; it comes round.',
    preset: 'six-squared-one-line-repeating',
    // Each note speaks sooner and lets go sooner than the preset's, so the line is heard as notes.
    set: { ampAttack: 0.01, ampDecay: 0.5, ampSustain: 0.5, ampRelease: 0.3, glide: 0.03 },
    // The loop two seconds round, four to the phrase, with less fed back so it settles in two passes.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.5, wear: 0.5, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, damping: 3200, mix: 0.4 } },
    ],
    ...cycled(
      8,
      [
        [0.4, 0.5, 62, 0.75],
        [1.52, 0.5, 65, 0.65],
        [2.61, 0.8, 69, 0.8],
        [4.37, 0.5, 67, 0.65],
        [5.46, 0.9, 64, 0.7],
      ],
      { passes: 2 },
    ),
    // Only the worn repeats lie across the seam, and no two passes of them are alike.
    loopFold: 'power',
  },
  {
    n: 79,
    id: 'small-hours-melody-g',
    name: 'Small hours melody {G}',
    kind: 'melodic',
    description:
      'A soft rounded key steps down to {G}, leaps up a fifth and settles, with faint tape repeats; it comes round.',
    preset: 'six-squared-small-hours-melody',
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 450, heads: 3, feedback: 0.25, highCut: 3800, mix: 0.2 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { midDecay: 4, damping: 3200, mix: 0.35 },
      },
    ],
    ...cycled(8, [
      [0.02, 0.7, 71, 0.75],
      [0.94, 0.7, 69, 0.6],
      [1.77, 1, 67, 0.7],
      [3.21, 0.9, 74, 0.8],
      [4.63, 0.7, 71, 0.6],
      [5.88, 1.2, 67, 0.65],
    ]),
  },
  {
    n: 80,
    id: 'wooden-sequence-em',
    name: 'Wooden sequence {E}m',
    kind: 'melodic',
    description:
      'Soft dull mallet plucks opening an {E} minor seventh and closing it again, never on a pulse; it comes round.',
    preset: 'six-squared-wooden-sequence',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 450, feedback: 0.1, spread: 0.6, mix: 0.1 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { damping: 3000, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.02, 0.5, 52, 0.8],
      [0.67, 0.5, 59, 0.65],
      [2.19, 0.5, 64, 0.7],
      [2.71, 0.5, 67, 0.75],
      [4.58, 0.5, 62, 0.6],
      [6.03, 0.5, 59, 0.65],
    ]),
  },
  {
    n: 81,
    id: 'cellar-sequence-am',
    name: 'Cellar sequence {A}m',
    kind: 'melodic',
    description:
      'A plucked bass circling a low {A} with a quick filter snap and dark repeats, left to ring out in a small dark room.',
    preset: 'six-squared-sequence-in-the-cellar',
    set: { decay: 0.9 },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 2.5, mix: 0.3 } },
    ],
    ...played(
      9,
      [
        [0, 0.45, 45, 0.8],
        [0.85, 0.4, 45, 0.6],
        [1.61, 0.6, 52, 0.7],
        [3, 0.5, 43, 0.7],
        [4.19, 0.45, 45, 0.75],
        [5.42, 0.7, 48, 0.7],
      ],
      2,
    ),
  },
  {
    n: 82,
    id: 'landing-piano-phrase-dm',
    name: 'Landing piano phrase {D}m',
    kind: 'melodic',
    description:
      'A felted piano over a low {D}: three notes stepping down, answered from below; it rings out in a cathedral.',
    preset: 'six-squared-piano-down-the-landing',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.3, hiss: 0.12, age: 0.05 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2400, mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 3.5, 50, 0.55],
        [1.21, 1, 65, 0.6],
        [2.38, 1, 64, 0.55],
        [3.74, 1.5, 62, 0.6],
        [5.63, 1, 57, 0.5],
        [6.72, 1, 60, 0.55],
        [7.91, 2, 62, 0.5],
      ],
      2.5,
    ),
  },
  {
    n: 83,
    id: 'midnight-tines-phrase-f',
    name: 'Midnight tines phrase {F}',
    kind: 'melodic',
    description:
      'A dull electric piano over {F} and {C}: three notes falling, then a low {D} and two more above it; it comes round.',
    preset: 'six-squared-tines-after-midnight',
    // The preset's chain with the chorus turning once a loop, so every pass is the same.
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.125, depth: 60, mix: 0.4 } },
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 8, outputDb: -10.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, damping: 2800, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.02, 2.2, 53, 0.7],
      [0.05, 2.2, 60, 0.6],
      [1.21, 1.4, 69, 0.65],
      [2.22, 1.2, 67, 0.55],
      [3.4, 2, 64, 0.6],
      [4.79, 2, 50, 0.6],
      [5.67, 1.5, 65, 0.6],
      [6.45, 1.3, 60, 0.5],
    ]),
  },
  {
    n: 84,
    id: 'next-door-keys-c',
    name: 'Next door keys {C}',
    kind: 'melodic',
    description:
      'Bell tines heard thin through a small speaker: a fall of four notes to {G} and a two-note answer up to {C}.',
    preset: 'six-squared-keys-from-next-door',
    effects: [
      {
        deviceId: 're-amp',
        preset: 'Bedside radio',
        params: { distance: 0.5, room: 0.5, noise: 0.25 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 420, feedback: 0.25, mix: 0.2 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { damping: 0.6, mix: 0.3, breathDepth: 0 },
      },
    ],
    ...played(
      8,
      [
        [0, 0.4, 76, 0.8],
        [0.61, 0.4, 74, 0.6],
        [1.37, 0.4, 72, 0.65],
        [2.49, 0.6, 67, 0.7],
        [3.92, 0.4, 69, 0.6],
        [4.71, 0.8, 72, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 85,
    id: 'stairwell-nylon-rise-am',
    name: 'Stairwell nylon rise {A}m',
    kind: 'melodic',
    description:
      'A nylon guitar opens {A} minor from the bottom up and hangs on the ninth; it rings out in a cathedral.',
    preset: 'six-squared-nylon-in-the-stairwell',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, hiss: 0.3, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2800, mix: 0.4 } },
    ],
    ...played(
      12,
      [
        [0, 4, 45, 0.6],
        [0.74, 3.5, 52, 0.5],
        [1.39, 3, 57, 0.55],
        [2.21, 2.6, 60, 0.6],
        [3.42, 2.5, 64, 0.7],
        [5.63, 3, 59, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 86,
    id: 'wet-road-guitar-em',
    name: 'Wet road guitar {E}m',
    kind: 'melodic',
    description:
      'Three slow clean strums, {E} minor, {G} and {A} minor, with a dark chorus echo in a damped hall; it comes round.',
    preset: 'six-squared-wet-road-guitar',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 440, tone: 2600, feedback: 0.25, mix: 0.2 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 3000, mix: 0.35 },
      },
    ],
    ...cycled(12, [
      [0.02, 3.4, 40, 0.75],
      [0.02, 3.4, 47, 0.65],
      [0.02, 3.4, 52, 0.65],
      [0.02, 3.4, 55, 0.7],
      [0.02, 3.4, 59, 0.7],
      [4.13, 3, 43, 0.7],
      [4.13, 3, 50, 0.6],
      [4.13, 3, 55, 0.6],
      [4.13, 3, 59, 0.65],
      [4.13, 3, 62, 0.65],
      [7.71, 3.4, 45, 0.7],
      [7.71, 3.4, 52, 0.6],
      [7.71, 3.4, 57, 0.6],
      [7.71, 3.4, 60, 0.65],
      [7.71, 3.4, 64, 0.65],
    ]),
  },
  {
    n: 87,
    id: 'slow-reel-harp-c',
    name: 'Slow reel harp {C}',
    kind: 'melodic',
    description:
      'Silk strings open a ninth chord on {C} from the bottom and fall back a third, on a slow reel; it comes round.',
    preset: 'six-squared-harp-on-a-slow-reel',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { speed: 2, drive: 0.4, hiss: 0.3, age: 0 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 4, size: 0.3, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.02, 2, 48, 0.75],
      [0.82, 2, 55, 0.6],
      [1.38, 2, 62, 0.65],
      [2.12, 2, 64, 0.7],
      [3.49, 2, 67, 0.75],
      [5.29, 2, 64, 0.6],
    ]),
  },
  {
    n: 88,
    id: 'harp-run-backwards-dm',
    name: 'Harp run backwards {D}m',
    kind: 'melodic',
    description:
      'Three long harp notes of {D} minor, each coming back reversed a second later, in a long plate; it rings out.',
    preset: 'six-squared-harp-run-backwards',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(
      12,
      [
        [0, 1.5, 62, 0.8],
        [2.31, 1.5, 69, 0.7],
        [4.87, 1.5, 65, 0.75],
      ],
      3,
    ),
  },
  {
    n: 89,
    id: 'hammered-wires-g',
    name: 'Hammered wires {G}',
    kind: 'melodic',
    description:
      'Single dulcimer hammers on doubled strings climb from {G} past the octave to the third and drop back; it comes round.',
    preset: 'six-squared-hammered-wires-at-night',
    set: { roll: 0 },
    ...cycled(8, [
      [0.02, 1.5, 55, 0.8],
      [0.93, 1.5, 62, 0.65],
      [1.61, 1.5, 67, 0.7],
      [2.74, 1.5, 69, 0.65],
      [4.29, 1.8, 71, 0.75],
      [5.47, 1.8, 67, 0.6],
    ]),
  },
  {
    n: 90,
    id: 'slowed-string-line-em',
    name: 'Slowed string line {E}m',
    kind: 'melodic',
    description:
      'One felt-hammered string leaps a fifth from {E} and walks back down, its half-speed copy under it; it rings out.',
    preset: 'six-squared-one-string-slowed',
    set: { decay: 4, release: 2 },
    // Saturated first, as the single note is: the hammer is otherwise all peak.
    effects: [
      soften(10),
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { highCut: 4000, mix: 0.45 } },
      {
        deviceId: 'tape-echo',
        preset: 'Worn tape',
        params: { time: 560, feedback: 0.25, mix: 0.15 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { damping: 0.6, mix: 0.3, breathDepth: 0 },
      },
    ],
    ...played(
      13,
      [
        [0, 1.5, 52, 0.8],
        [1.63, 1.3, 59, 0.7],
        [3.02, 1.5, 57, 0.6],
        [4.71, 1.5, 55, 0.65],
        [6.38, 2.5, 52, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 91,
    id: 'slowed-pan-round-dm',
    name: 'Slowed pan round {D}m',
    kind: 'melodic',
    description:
      'Soft handpan strokes circling {D} minor, half of it heard at half speed an octave down; it comes round.',
    preset: 'six-squared-slowed-steel-pan',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { highCut: 3500, mix: 0.5 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.5, hiss: 0.3, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, damping: 2600, mix: 0.4 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 1.2, 62, 0.8],
        [0.77, 1.2, 69, 0.6],
        [1.69, 1.2, 72, 0.65],
        [2.38, 1.2, 65, 0.7],
        [3.57, 1.5, 69, 0.75],
        [5.33, 1.5, 57, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 92,
    id: 'wearing-drum-loop-am',
    name: 'Wearing drum loop {A}m',
    kind: 'melodic',
    description:
      'A soft tongue drum phrase in {A} minor caught on a two-second tape loop that wears it down; it comes round.',
    preset: 'six-squared-wearing-drum-loop',
    // Less fed back than the preset, so the loop settles in two passes; the room does not stir, so
    // one pass meets the next alike in every key.
    effects: [
      {
        deviceId: 'tape-loop',
        preset: 'Slow fade',
        params: { length: 2, feedback: 0.5, wear: 0.6, mix: 0.45 },
      },
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 9, modDepth: 0, highCut: 3500, mix: 0.3 },
      },
    ],
    ...cycled(
      8,
      [
        [0.4, 1, 57, 0.8],
        [1.27, 1, 64, 0.65],
        [2.61, 1, 62, 0.7],
        [4.44, 1, 60, 0.65],
        [5.39, 1.2, 57, 0.7],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 93,
    id: 'motor-vibes-falling-f',
    name: 'Motor vibes, falling {F}',
    kind: 'melodic',
    description:
      'Soft vibraphone bars fall through {F} major and answer a step higher, the motor throbbing slowly; it rings out.',
    preset: 'six-squared-vibes-motor-running',
    set: { motor: 0.3 },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, wow: 0.35, age: 0 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2800, mix: 0.3 } },
    ],
    ...played(
      12,
      [
        [0, 1.5, 72, 0.8],
        [0.83, 1.5, 69, 0.65],
        [1.97, 1.8, 65, 0.7],
        [3.87, 1.5, 67, 0.65],
        [4.74, 1.5, 71, 0.7],
        [5.93, 2.5, 69, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 94,
    id: 'music-box-round-c',
    name: 'Music box round {C}',
    kind: 'melodic',
    description:
      'Small hard metal bars fall from {E} through {C} to {G} and climb back to {D}, on a worn cassette; it comes round.',
    preset: 'six-squared-loft-music-box',
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wobble: 0.3, noise: 0.35, wear: 0.1 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { midDecay: 3.5, damping: 3000, mix: 0.35 },
      },
    ],
    ...cycled(8, [
      [0.4, 0.6, 88, 0.8],
      [1.09, 0.6, 84, 0.65],
      [1.62, 0.6, 79, 0.7],
      [3.31, 0.6, 84, 0.65],
      [4.75, 0.8, 86, 0.75],
    ]),
    // The cassette wobbles differently every pass: only the hall's tail lies across the seam.
    loopFold: 'power',
  },
  {
    n: 95,
    id: 'long-hall-bells-g',
    name: 'Long hall bells {G}',
    kind: 'melodic',
    description:
      'Soft FM bells rise in fourths and fifths from {G} and settle on {C}, with dark repeats in a cathedral; it comes round.',
    preset: 'six-squared-long-hall-bells',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 500, feedback: 0.3, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 3000, mix: 0.45 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...cycled(8, [
      [0.02, 1, 67, 0.8],
      [1.03, 1, 72, 0.65],
      [1.94, 1, 79, 0.7],
      [3.41, 1, 77, 0.65],
      [5.26, 1.4, 72, 0.7],
    ]),
  },
  {
    n: 96,
    id: 'looped-fanfare-c',
    name: 'Looped fanfare {C}',
    kind: 'melodic',
    description:
      'Short synth brass notes climb from {G} to the {G} above and fall back to {C}, caught as a soft bed by a looper.',
    preset: 'six-squared-looped-fanfare',
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 2, fade: 0.7, tone: 5000, drift: 0, mix: 0.3 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 500, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.65, mix: 0.3 } },
    ],
    ...cycled(8, [
      [0.02, 0.35, 55, 0.8],
      [0.59, 0.35, 60, 0.65],
      [1.21, 0.35, 62, 0.7],
      [1.98, 0.6, 67, 0.8],
      [3.87, 0.35, 64, 0.65],
      [5.02, 0.7, 60, 0.7],
    ]),
    // The plate and the tape echo stir, so no two passes are alike.
    loopFold: 'power',
  },
  {
    n: 97,
    id: 'flyer-in-a-drawer-am',
    name: 'Flyer in a drawer {A}m',
    kind: 'melodic',
    description:
      'Three bare saw stabs, {A} minor, {F} and {G}, at twelve bits with a long damped hall behind them; it comes round.',
    preset: 'six-squared-flyer-in-a-drawer',
    // No tape loop: its repeats, two seconds apart, are heard as a pulse.
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 12000 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 4, damping: 3000, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.4, 0.45, 57, 0.8],
      [0.4, 0.45, 60, 0.7],
      [0.4, 0.45, 64, 0.7],
      [2.87, 0.45, 53, 0.75],
      [2.87, 0.45, 57, 0.65],
      [2.87, 0.45, 60, 0.65],
      [5.11, 0.6, 55, 0.75],
      [5.11, 0.6, 59, 0.65],
      [5.11, 0.6, 62, 0.65],
    ]),
    // Only the hall's tail lies across the seam, and no two passes of it are alike.
    loopFold: 'power',
  },
  {
    n: 98,
    id: 'sampler-choir-stabs-am',
    name: 'Sampler choir stabs {A}m',
    kind: 'melodic',
    description:
      'A sampled choir chord stabbed on {A} minor, {D} minor and {E} minor at twelve bits with dub repeats; it comes round.',
    preset: 'six-squared-old-sampler-stab',
    source: 'choir-chord-am',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 11000 } },
      {
        deviceId: 'tape-echo',
        preset: 'Dub wash',
        params: { time: 400, feedback: 0.3, mix: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 6, highCut: 4000, mix: 0.3 } },
    ],
    ...cycled(8, [
      [0.02, 0.6, 60, 0.8],
      [2.13, 0.6, 53, 0.7],
      [3.71, 0.6, 67, 0.7],
      [5.46, 0.9, 60, 0.75],
    ]),
  },
  {
    n: 99,
    id: 'estuary-steel-g',
    name: 'Estuary steel {G}',
    kind: 'melodic',
    description:
      'Picked steel guitar notes with no vibrato rise from {G} to its octave and fall back to {C}, warmed in a huge space.',
    preset: 'six-squared-steel-over-the-estuary',
    // Picked, not swelled, and no note held into the next, so each is a pick and not a bend.
    set: { swell: 0, pick: 1 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.45 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 6, highCut: 3800, width: 0.8, mix: 0.35 },
      },
    ],
    ...played(
      13,
      [
        [0, 1.2, 55, 0.8],
        [1.42, 1, 60, 0.65],
        [2.63, 1.6, 67, 0.7],
        [4.48, 1.3, 65, 0.75],
        [6.07, 2.4, 60, 0.65],
      ],
      2.5,
    ),
  },
  {
    n: 100,
    id: 'far-bells-tolling-d',
    name: 'Far bells tolling {D}',
    kind: 'melodic',
    description:
      'Two far church bells a fourth apart tolling {D}, {A}, {D} at uneven intervals through sparse dark echoes.',
    preset: 'six-squared-far-church-bell',
    set: { position: 0.667, decay: 6 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 4500, lowCut: 80 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 6, mix: 0.3 } },
    ],
    ...played(
      14,
      [
        [0, 2, 62, 0.8],
        [2.83, 2, 57, 0.7],
        [6.21, 2, 62, 0.75],
      ],
      3,
    ),
  },
])
