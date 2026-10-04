// The sounds of the pack "Polar Night Signal": its presets played, a hundred sounds to
// paint with. Numbers 13001 to 13100.

import { PRESETS } from '../packs/polar-signal'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('polar-signal', 13000, PRESETS, [
  // Drones: hums, engines, pipes and held strings of a town in the dark.
  {
    n: 1,
    id: 'under-the-harbour-a',
    name: 'Under the harbour {A}',
    kind: 'drone',
    description:
      'Stacked octaves on a low {A} over a heavy sub, the filter almost shut, in a hall.',
    preset: 'polar-signal-under-the-harbour',
    // A little tuned air: a tone this still comes out too loud at the bank's peak.
    set: { air: 0.3 },
    then: [quarterTurn(8)],
    ...looped(8, 7, 3, [45]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'hull-groan-c',
    name: 'Hull groan {C}',
    kind: 'drone',
    description:
      'The lowest {C} of a cello bowed hard with no vibrato, on tape in a small dark room.',
    preset: 'polar-signal-hull-groan',
    ...looped(8, 4, 2, [36]),
  },
  {
    n: 3,
    id: 'pedal-left-on-g',
    name: 'Pedal left on {G}',
    kind: 'drone',
    description:
      'The low ranks of a reed organ on a pedal {G}, bellows under it, in a breathing hall.',
    preset: 'polar-signal-pedal-left-on',
    // Less beating and a shallower breath than the preset: in some keys the two made it a pad.
    set: { celeste: 0.06 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { drive: 0.45 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { mix: 0.3, breathRate: 0.25, breathDepth: 0.2 },
      },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [43]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'unlit-chapel-c',
    name: 'Unlit chapel {C}',
    kind: 'drone',
    description:
      'Soft dull pipes on {C} and {G}, barely beating, on a worn reel deep in a cathedral.',
    preset: 'polar-signal-unlit-chapel',
    // A reel less worn than the preset's: its dropouts were heard as notes.
    set: { celeste: 0.05 },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.2, age: 0.12, hiss: 0.3 } },
      hall('Cathedral', 0.55),
    ],
    // A fast limiter last: the beating ranks rise and fall enough in some keys to make it a pad.
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 24, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 6, 3, [48, [55, 0.7]]),
  },
  {
    n: 5,
    id: 'road-tunnel-c',
    name: 'Road tunnel {C}',
    kind: 'drone',
    description:
      'A square wave on a low {C} and its sub octave behind a filter that moves a little, on a plate.',
    preset: 'polar-signal-road-tunnel',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 1700, resonance: 1.4, lfoAmount: 30, lfoRateHz: 0.125, lfoShape: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2, damping: 0.6 } },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, quarterTurn(8)],
    ...looped(8, 4, 2, [48]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'slowed-hum-c',
    name: 'Slowed hum {C}',
    kind: 'drone',
    description:
      'Two violins on {C} and {G} slowed two octaves down on a sampler, into a dull hall.',
    preset: 'polar-signal-slowed-hum',
    source: 'violin-drone-c',
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 7,
    id: 'warped-record-cellos-d',
    name: 'Warped record cellos {D}',
    kind: 'drone',
    description:
      'A cello tape at half speed on {D} with a soft {A} over it, pressed to a warped record, in a dark hall.',
    preset: 'polar-signal-warped-record-cellos',
    // The fifth kept soft: at full level the two this low are a rumble more than a pitch. A fast
    // limiter last holds the level, which the warp moves enough in some keys to make it a pad.
    then: [
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 24, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 4, 3, [50, [57, 0.4]]),
  },
  {
    n: 8,
    id: 'window-lamp-g',
    name: 'Window lamp {G}',
    kind: 'drone',
    description: 'Plain tones on {G} major, folded a little and wandering, held on tape in a hall.',
    preset: 'polar-signal-window-lamp',
    ...looped(8, 6, 3, [55, [62, 0.8], [67, 0.7], [71, 0.6]]),
  },
  {
    n: 9,
    id: 'thin-ice-bows-a',
    name: 'Thin ice bows {A}',
    kind: 'drone',
    description:
      'Three light bows with no vibrato in fifths, {A}, {E} and {B}, high, thin and still, in a cathedral.',
    preset: 'polar-signal-thin-ice-bow',
    // Held still: no beating between the strings and none of the preset's reversed swells.
    set: { detune: 0 },
    effects: [hall('Cathedral', 0.35)],
    then: [quarterTurn(8)],
    ...looped(8, 6, 3, [69, [76, 0.7], [83, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'street-lamp-hum-e',
    name: 'Street lamp hum {E}',
    kind: 'drone',
    description:
      'Two saws on a low {E}, {B} and the {E} above under a low-pass, held quite still, on tape with a hall behind.',
    preset: 'polar-signal-sodium-lamps',
    // The pad held still: no beating between the saws, no moving filter or pan, a steadier tape.
    set: { lfo1Amount: 0, lfo2Amount: 0, osc2Fine: 0, unisonDetune: 0 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.1, flutter: 0.05, age: 0, hiss: 0.15 },
      },
      hall('Hall', 0.35),
    ],
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [40, [47, 0.6], [52, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 11,
    id: 'low-window-lamp-c',
    name: 'Low window lamp {C}',
    kind: 'drone',
    description:
      'A folded tone on {C}, {G} and the {C} above, steady and warm, on tape with a hall behind.',
    preset: 'polar-signal-window-lamp',
    ...looped(8, 6, 3, [48, [55, 0.8], [60, 0.7]]),
  },
  {
    n: 12,
    id: 'chapel-pedal-f',
    name: 'Chapel pedal {F}',
    kind: 'drone',
    description:
      'Soft dull pipes on a low {F} and its octave, almost still, on a worn reel deep in a cathedral.',
    preset: 'polar-signal-unlit-chapel',
    // A reel less worn than the preset's: its dropouts were heard as notes.
    set: { celeste: 0.05 },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { wow: 0.2, age: 0.12, hiss: 0.3 } },
      hall('Cathedral', 0.55),
    ],
    // Narrowed: in some keys the beating ranks drift apart to the two sides. A fast limiter last
    // holds the level, which the beating moves enough in some keys to make it a pad.
    then: [
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'ambient-limiter', params: { ceiling: -12, gain: 24, release: 0.3, ride: 0 } },
    ],
    ...looped(8, 6, 3, [41, [53, 0.6]]),
  },
  {
    n: 13,
    id: 'far-window-lamp-d',
    name: 'Far window lamp {D}',
    kind: 'drone',
    description: 'A folded tone high on {D} and {A}, steady and thin, on tape with a hall behind.',
    preset: 'polar-signal-window-lamp',
    ...looped(8, 6, 3, [62, [69, 0.7]]),
  },
  // Pads: chords and single tones that swell, breathe or come and go.
  {
    n: 14,
    id: 'sub-under-snow-b',
    name: 'Sub under snow {B}',
    kind: 'pad',
    description:
      'Two slowly beating sines on a low {B} and their sub octave, rising and sinking over the rumble of a room.',
    preset: 'polar-signal-sub-under-snow',
    // It rises and sinks once a loop: the beating alone is slower in some keys than in others.
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [47]),
  },
  {
    n: 15,
    id: 'engine-below-deck-f',
    name: 'Engine below deck {F}',
    kind: 'pad',
    description:
      'A saw and a pulse an octave apart on {F} over a sub, behind a low-pass that opens and closes.',
    preset: 'polar-signal-engine-below-deck',
    // The two filters open and close once a loop.
    set: { lfo1Rate: 0.125, lfo2Rate: 0.125 },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { cutoffHz: 1400, resonance: 2, driveDb: 3, lfoAmount: 30, lfoRateHz: 0.125 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25, damping: 0.6 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 5, 3, [53]),
    tuning: 'whole-cycles',
  },
  {
    n: 16,
    id: 'generator-shed-e',
    name: 'Generator shed {E}',
    kind: 'pad',
    description:
      'A buzzing low {E} with a slow throb, heard through a loudspeaker from down a corridor.',
    preset: 'polar-signal-generator-shed',
    // The throb six times a loop, so it comes round, and the partials wander less.
    set: { movement: 0.15 },
    effects: [
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 0.75, depth: 0.35, shape: 0, phase: 0, drift: 0, smooth: 0.7 },
      },
      { deviceId: 're-amp', preset: 'Down the hall', params: { room: 0.7 } },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, quarterTurn(8)],
    ...looped(8, 7, 2, [40]),
    tuning: 'whole-cycles',
  },
  {
    n: 17,
    id: 'reed-in-fog-d',
    name: 'Reed in fog {D}',
    kind: 'pad',
    description:
      'One {D} held on a bass clarinet, breathy and dark, coming and going with tape echoes on a long plate.',
    preset: 'polar-signal-reed-in-fog',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, breathe(0.125, 0.7), quarterTurn(8)],
    ...looped(8, 4, 2, [50]),
    tuning: 'whole-cycles',
  },
  {
    n: 18,
    id: 'carrier-wave-a',
    name: 'Carrier wave {A}',
    kind: 'pad',
    description:
      'One plain {A} picked up slightly off the station, sinking and returning, with whistles and static.',
    preset: 'polar-signal-carrier-wave',
    // The dial held still and the tone not wandering: the radio's drift made every whistle a note,
    // and its own fading does not come round, so the level sinks once a loop instead.
    set: { movement: 0 },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Off the dial',
        params: { tuning: 0.3, drift: 0, fading: 0, static: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.5 } },
    ],
    then: [breathe(0.125, 0.5), quarterTurn(8)],
    ...looped(8, 4, 2, [69]),
    tuning: 'whole-cycles',
  },
  {
    n: 19,
    id: 'singing-wires-g',
    name: 'Singing wires {G}',
    kind: 'pad',
    description:
      'The harmonic series of a low {G}, every partial restless, swelling and sinking like wires humming in wind.',
    preset: 'polar-signal-singing-wires',
    // The partials wander more slowly than the preset's: at its rate one jumped out as a note.
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.2)],
    ...looped(8, 5, 3, [43]),
  },
  {
    n: 20,
    id: 'ice-bowl-f',
    name: 'Ice bowl {F}',
    kind: 'pad',
    description:
      'Bowls on {F} and {C} rubbed until they sing, soft and slowly beating, left to ring in a cathedral.',
    preset: 'polar-signal-ice-bowl',
    // Without the preset's blur, and beating slowly: both were heard as notes.
    set: { detune: 0.25 },
    effects: [hall('Cathedral', 0.45)],
    ...played(
      12,
      [
        [0, 6, 65, 0.8],
        [0, 6, 72, 0.5],
      ],
      3,
    ),
  },
  {
    n: 21,
    id: 'long-plain-strings-d',
    name: 'Long plain strings {D}',
    kind: 'pad',
    description:
      'Four plain strings on {D} and {A} plucked in a slow round, coming and going deep in a cathedral.',
    preset: 'polar-signal-long-plain-strings',
    // One string every two seconds, so the round of four fits the loop; narrowed for the far keys.
    set: { speed: 8 },
    then: [
      hall('Cathedral', 0.7),
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      breathe(0.125, 0.55),
    ],
    ...looped(8, 9, 2, [50]),
    loopFold: 'linear',
  },
  {
    n: 22,
    id: 'hollow-chord-dm',
    name: 'Hollow chord {D}m',
    kind: 'pad',
    description:
      'A hollow, dark {D} minor chord over its sub octave swells in and dies away, on tape in a very large space.',
    preset: 'polar-signal-hollow-chord-over-sub',
    set: { spread: 0.5, sub: 0.25 },
    ...played(
      16,
      [
        [0, 7, 50, 0.8],
        [0, 7, 57, 0.7],
        [0, 7, 65, 0.6],
      ],
      3,
    ),
  },
  {
    n: 23,
    id: 'frost-forming-cmaj7',
    name: 'Frost forming {C}maj7',
    kind: 'pad',
    description:
      'A thin, high spectrum on {C} major seventh forms slowly with no bass under it and falls away, phasing.',
    preset: 'polar-signal-frost-forming',
    ...played(
      16,
      [
        [0, 6, 72, 0.8],
        [0, 6, 79, 0.7],
        [0, 6, 83, 0.6],
        [0, 6, 88, 0.5],
      ],
      3,
    ),
  },
  {
    n: 24,
    id: 'sodium-lamps-am',
    name: 'Sodium lamps {A}m',
    kind: 'pad',
    description:
      'Two detuned saws on {A} minor under a slow low-pass, warm and plain, on tape with a hall behind.',
    preset: 'polar-signal-sodium-lamps',
    // The low-pass opens and closes once a loop, and further than the preset's; a steadier tape.
    set: { lfo1Rate: 0.125, lfo1Amount: 0.3, unisonDetune: 6, osc2Fine: 4 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.2, flutter: 0.1, age: 0, hiss: 0.15 },
      },
      hall('Hall', 0.45),
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [57, [64, 0.6], [72, 0.5]]),
  },
  {
    n: 25,
    id: 'fjord-horns-dm',
    name: 'Fjord horns {D}m',
    kind: 'pad',
    description:
      'A horn section swells in on {D} minor and dies away, low-passed and half lost in a very large space.',
    preset: 'polar-signal-fjord-horns',
    ...played(
      16,
      [
        [0, 6.5, 50, 0.8],
        [0, 6.5, 57, 0.7],
        [0, 6.5, 62, 0.7],
        [0, 6.5, 65, 0.6],
      ],
      3,
    ),
  },
  {
    n: 26,
    id: 'slowed-string-loop-a',
    name: 'Slowed string loop {A}',
    kind: 'pad',
    description:
      'Strings on worn tape at half speed on {A} and {E}, behind a slowly moving low-pass.',
    preset: 'polar-signal-slowed-string-loop',
    // The low-pass moves once a loop.
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 1400, lfoAmount: 60, lfoRateHz: 0.125 },
      },
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 4, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.8 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [57, [64, 0.7]]),
  },
  {
    n: 27,
    id: 'voices-in-static-g',
    name: 'Voices in static {G}',
    kind: 'pad',
    description:
      'Low wordless voices on {G} and {D} on a far station, sinking under the static and coming back.',
    preset: 'polar-signal-voices-in-static',
    effects: [
      {
        deviceId: 'radio',
        preset: 'Far station',
        params: { drift: 0, fading: 0, static: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, highCut: 5000 } },
    ],
    // The station sinks and comes back once a loop: the radio's own fading does not come round.
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [43, [50, 0.8], [55, 0.7]]),
  },
  {
    n: 28,
    id: 'hymn-through-walls-c',
    name: 'Hymn through walls {C}',
    kind: 'pad',
    description:
      'A small choir swells on a {C} major chord with its octave below and goes, drowned in a cathedral.',
    preset: 'polar-signal-hymn-through-walls',
    // Without the preset's blur, which the analysis hears as notes and which smears onto the black keys.
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.3 } },
      hall('Cathedral', 0.55),
    ],
    ...played(
      12,
      [
        [0, 6.5, 60, 0.8],
        [0, 6.5, 64, 0.7],
        [0, 6.5, 67, 0.7],
        [0, 6.5, 72, 0.6],
      ],
      2,
    ),
  },
  {
    n: 29,
    id: 'sampled-ensemble-em7',
    name: 'Sampled ensemble {E}m7',
    kind: 'pad',
    description:
      'A slow dark string ensemble on {E} minor seventh through twelve-bit converters, a loop of itself wandering.',
    preset: 'polar-signal-sampled-ensemble',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [52, [59, 0.8], [62, 0.7], [67, 0.7]]),
  },
  {
    n: 30,
    id: 'ferry-lounge-strings-c',
    name: 'Ferry lounge strings {C}',
    kind: 'pad',
    description:
      'The low octave of a string ensemble on {C} major under a slow phaser, with dark repeats.',
    preset: 'polar-signal-ferry-lounge-strings',
    // The phaser turns once a loop.
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.25 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [48, [55, 0.8], [60, 0.7], [64, 0.7]]),
  },
  {
    n: 31,
    id: 'ridge-lights-dsus2',
    name: 'Ridge lights {D}sus2',
    kind: 'pad',
    description:
      'A brass pad on {D} with {E} starts dark, keeps opening while held and goes out, phased in a huge space.',
    preset: 'polar-signal-ridge-lights',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(
      14,
      [
        [0, 6, 50, 0.8],
        [0, 6, 57, 0.7],
        [0, 6, 62, 0.7],
        [0, 6, 64, 0.6],
      ],
      3,
    ),
  },
  {
    n: 32,
    id: 'cold-iron-sky-a',
    name: 'Cold iron sky {A}',
    kind: 'pad',
    description:
      'Ring-modulated fifths on {A}, {E} and {B}, clangorous, beating from side to side and swelling, in a damped hall.',
    preset: 'polar-signal-cold-iron-sky',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 3, [45, [52, 0.8], [59, 0.7]]),
  },
  {
    n: 33,
    id: 'quartet-under-snow-d',
    name: 'Quartet under snow {D}',
    kind: 'pad',
    description:
      'Slow dark bows on {D} and {A} with their own octave below at half speed, softly blurred.',
    preset: 'polar-signal-quartet-under-snow',
    then: [breathe(0.25, 0.5)],
    ...looped(8, 6, 3, [50, [57, 0.7]]),
  },
  {
    n: 34,
    id: 'starved-strings-g',
    name: 'Starved strings {G}',
    kind: 'pad',
    description:
      'A muted string section on {G} major, its quiet detail thrown away, layering on slowed tape.',
    preset: 'polar-signal-starved-stream-strings',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 6, 3, [55, [59, 0.8], [62, 0.8], [67, 0.7]]),
  },
  {
    n: 35,
    id: 'fog-clarinets-f',
    name: 'Fog clarinets {F}',
    kind: 'pad',
    description:
      'Soft clarinets on {F} major with a backwards loop of themselves behind them and a falling tail.',
    preset: 'polar-signal-clarinet-out-of-silence',
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 3, [53, [60, 0.8], [65, 0.7], [69, 0.6]]),
  },
  {
    n: 36,
    id: 'late-watch-pad-e',
    name: 'Late watch pad {E}',
    kind: 'pad',
    description:
      'A chorus-synth fifth on {E} whose filter opens from nearly shut, through an early sampler in a hall.',
    preset: 'polar-signal-late-watch-pad',
    ...played(
      14,
      [
        [0, 6.5, 52, 1],
        [0, 6.5, 59, 0.5],
      ],
      3,
    ),
  },
  {
    n: 37,
    id: 'digital-frost-pad-am7',
    name: 'Digital frost pad {A}m7',
    kind: 'pad',
    description:
      'A slow, soft FM pad on {A} minor seventh with a wide beat, glazed by early converters, on a long plate.',
    preset: 'polar-signal-digital-frost-pad',
    ...looped(8, 6, 3, [57, [60, 0.8], [64, 0.8], [67, 0.7]]),
  },
  {
    n: 38,
    id: 'moment-held-still-d',
    name: 'Moment held still {D}',
    kind: 'pad',
    description:
      'One moment of treble voices on {D} held still as long grains and hung in a cathedral.',
    preset: 'polar-signal-moment-held-still',
    source: 'treble-voices-dsus2',
    // Without the preset's blur, which the analysis hears as notes.
    effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.15, decay: 12 } }],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 39,
    id: 'sun-returns-f',
    name: 'Sun returns {F}',
    kind: 'pad',
    description:
      'A just {F} major chord of soft tones and air comes up slowly and goes, smeared by grains into a cathedral.',
    preset: 'polar-signal-sun-returns',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.3 } },
      hall('Cathedral', 0.5),
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(16, [[0, 7, 53]], 3),
  },
  {
    n: 40,
    id: 'orchestra-fragment-g',
    name: 'Orchestra fragment {G}',
    kind: 'pad',
    description:
      'A stretch of high flutes an octave down on a short loop through early converters, looped again.',
    preset: 'polar-signal-orchestra-fragment',
    source: 'high-flutes-gadd9',
    then: [breathe(0.25, 0.35)],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 41,
    id: 'half-speed-reel-c',
    name: 'Half speed reel {C}',
    kind: 'pad',
    description:
      'Glassy tones on {C} and {G} on unsteady tape, their own octave below at half speed, layering on a slow loop.',
    preset: 'polar-signal-half-speed-reel',
    source: 'glass-drone-c',
    set: { wobble: 0.3 },
    then: [hall('Hall', 0.4), breathe(0.125, 0.5)],
    ...looped(8, 6, 3, [60]),
  },
  {
    n: 42,
    id: 'foghorn-f',
    name: 'Foghorn {F}',
    kind: 'pad',
    description:
      'One long blast of low brass on {F} and {C}, dulled, with far echoes that take a long time to go.',
    preset: 'polar-signal-foghorn',
    ...played(
      8,
      [
        [0, 2.6, 41, 0.85],
        [0, 2.6, 48, 0.6],
      ],
      2,
    ),
  },
  {
    n: 43,
    id: 'two-ships-f',
    name: 'Two ships {F}',
    kind: 'pad',
    description:
      'Low brass in fifths calls on {F}, answers on {C} and calls again on {G}, a slow tape loop repeating it.',
    preset: 'polar-signal-two-ships',
    // The start of each blast rounded off: it stood far above the rest of the call.
    then: [soften(6)],
    ...played(
      16,
      [
        [0, 2.4, 41, 0.85],
        [3.4, 2, 48, 0.8],
        [6.9, 2.4, 43, 0.85],
      ],
      4,
    ),
  },
  // Textures: weather, water, fire, static and worn media, with little or no pitch.
  {
    n: 44,
    id: 'far-buzzing-string-c',
    name: 'Far buzzing string {C}',
    kind: 'texture',
    description:
      'A buzzing drone lute on {C} and {G} from a far station, sinking under static, in a hall.',
    preset: 'polar-signal-far-buzzing-string',
    ...looped(8, 6, 2, [48]),
  },
  {
    n: 45,
    id: 'wind-over-the-pass',
    name: 'Wind over the pass',
    kind: 'texture',
    description: 'Wind over a high pass, gusting and dull, with far echoes of itself.',
    preset: 'polar-signal-mountain-pass-wind',
    ...looped(8, 5, 3, [45]),
  },
  {
    n: 46,
    id: 'wind-in-the-rigging',
    name: 'Wind in the rigging',
    kind: 'texture',
    description:
      'Wind whistling through a narrow gap, rising and falling, with worn tape echoes in a dark well.',
    preset: 'polar-signal-rigging-wind',
    // Less of the whistle than the preset, and steadier: at its own setting the wind is a tune.
    set: { resonance: 0.35, movement: 0.5 },
    ...looped(8, 6, 3, [57]),
  },
  {
    n: 47,
    id: 'night-harbour-water',
    name: 'Night harbour water',
    kind: 'texture',
    description: 'Slow low waves on a shore behind a low-pass, dark and close, in a hall.',
    preset: 'polar-signal-black-water',
    // Lower waves than the preset's: tall ones do not meet their own start again.
    set: { movement: 0.35, density: 0.5 },
    then: [{ deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 40 } }],
    ...looped(16, 3, 3, [40]),
  },
  {
    n: 48,
    id: 'sleet-on-the-hut-roof',
    name: 'Sleet on the hut roof',
    kind: 'texture',
    description: 'Sleet on a roof heard from inside a small room and pressed onto tape.',
    preset: 'polar-signal-hut-roof-sleet',
    set: { density: 0.55, tone: 0.5 },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room' },
      {
        deviceId: 'tape',
        preset: 'Mastering deck',
        params: { drive: 0.5, hiss: 0.1, output: 0.2 },
      },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 49,
    id: 'crackle-at-the-run-out',
    name: 'Crackle at the run-out',
    kind: 'texture',
    description:
      'The crackle of an old record squeezed by limiters, a short loop of itself underneath, in a room.',
    preset: 'polar-signal-run-out-groove',
    // The clicks stand far above the rest: a second limiter after the room.
    then: [{ deviceId: 'fet-limiter', params: { inputGain: 32, outputGain: -12 } }],
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 50,
    id: 'hearth-on-cassette',
    name: 'Hearth on cassette',
    kind: 'texture',
    description: 'A hearth fire crackling on a four-track cassette in a small room.',
    preset: 'polar-signal-hut-fire',
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 51,
    id: 'snowplough-goes-by',
    name: 'Snowplough goes by',
    kind: 'texture',
    description:
      'Filtered noise that swells and opens as it comes near and closes again, with far echoes.',
    preset: 'polar-signal-snowplough-passing',
    ...played(12, [[0, 6, 36]], 3),
  },
  {
    n: 52,
    id: 'shortwave-stretched',
    name: 'Shortwave stretched',
    kind: 'texture',
    description:
      'A shortwave radio between stations stretched into slow grains, some backwards, fading in a hall.',
    preset: 'polar-signal-stretched-broadcast',
    source: 'radio-between-stations',
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 53,
    id: 'far-thunder-over-ice',
    name: 'Far thunder over ice',
    kind: 'texture',
    description:
      'A storm far off, its rolls of thunder overlapping, dulled and spread wide in an open space.',
    preset: 'polar-signal-thunder-over-ice',
    set: { density: 1, movement: 0.4 },
    // The loudest claps rounded off: under them the rolls were far quieter than the other weather.
    then: [soften(6)],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 54,
    id: 'stream-under-snow',
    name: 'Stream under snow',
    kind: 'texture',
    description:
      'A small stream heard through snow: muffled bubbling with the highs cut, in a small room.',
    preset: 'polar-signal-brook-under-snow',
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 55,
    id: 'wind-in-the-flue',
    name: 'Wind in the flue',
    kind: 'texture',
    description:
      'Low bands of tuned noise that breathe like wind in a flue, in a reverb shaped like low voices.',
    preset: 'polar-signal-chimney-wind',
    // Wider bands than the preset's: in some keys narrow ones are a held note.
    set: { resonance: 8 },
    then: [{ deviceId: 'stereo-widener', preset: 'Wide' }],
    ...looped(8, 5, 3, [52]),
  },
  {
    n: 56,
    id: 'whistlers-sliding-down',
    name: 'Whistlers sliding down',
    kind: 'texture',
    description:
      'High bands of noise that slide slowly downward, squeezed by a limiter, in a hall.',
    preset: 'polar-signal-falling-whistlers',
    // Wider bands than the preset's: ringing ones are heard as notes off the key. Squeezed less
    // hard and further into the hall: the limiter's pumping was heard as a pulse.
    set: { resonance: 6 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 9, outputGain: -6.5 } },
      { deviceId: 'freq-shifter', preset: 'Falling spiral', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    ...looped(8, 5, 3, [69]),
  },
  {
    n: 57,
    id: 'flute-breath-in-snow',
    name: 'Flute breath in snow',
    kind: 'texture',
    description: 'All breath and almost no tone from two low flutes, through a whispering reverb.',
    preset: 'polar-signal-snow-breath',
    // Low notes and less of the reverb's vowels: higher up the breath finds a pitch.
    set: { blow: 0.06 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { lowCut: 120, highCut: 7000 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 6, mix: 0.25 } },
    ],
    ...looped(8, 5, 3, [48, [55, 0.7]]),
  },
  {
    n: 58,
    id: 'waves-under-the-ice',
    name: 'Waves under the ice',
    kind: 'texture',
    description:
      'Waves on sand heard from under the ice: garbled, blurred and dark in an open space.',
    preset: 'polar-signal-under-the-ice',
    source: 'waves-on-sand',
    // Further into the space than the preset: nearer, each wave was a beat.
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { width: 0.5, mix: 0.5 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.45, lowCut: 60, highCut: 3000, width: 0.7 },
      },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...looped(8, 5, 3, [60]),
  },
  // One-shots: a bell, a chord, a string or a note struck once and left to ring.
  {
    n: 59,
    id: 'buoy-bell-d',
    name: 'Buoy bell {D}',
    kind: 'oneshot',
    description:
      'A church bell on {D} with its own octave below at half speed, dulled, far echoes behind it.',
    preset: 'polar-signal-buoy-bell',
    set: { position: 0.667 },
    then: [soften(12)],
    ...played(12, [[0, 9, 62, 0.8]], 3),
  },
  {
    n: 60,
    id: 'ship-gong-d',
    name: 'Ship gong {D}',
    kind: 'oneshot',
    description: 'A gong struck once on a low {D}, ringing a long time into a long dark reverb.',
    preset: 'polar-signal-ship-gong',
    ...played(12, [[0, 9, 38, 0.9]], 3),
  },
  {
    n: 61,
    id: 'bars-on-vinyl-g',
    name: 'Bars on vinyl {G}',
    kind: 'oneshot',
    description:
      'Three vibraphone bars struck softly at once on {G}, on a crackling record in a small room.',
    preset: 'polar-signal-bars-on-vinyl',
    ...played(
      8,
      [
        [0, 5, 55, 0.8],
        [0, 5, 62, 0.65],
        [0, 5, 71, 0.55],
      ],
      2,
    ),
  },
  {
    n: 62,
    id: 'beacon-a',
    name: 'Beacon {A}',
    kind: 'oneshot',
    description:
      'One sine bell on a high {A} with its twelfth, repeated by three tape heads and scattered.',
    preset: 'polar-signal-beacon',
    ...played(6, [[0, 1.2, 81, 0.8]], 2),
  },
  {
    n: 63,
    id: 'stairwell-strum-am',
    name: 'Stairwell strum {A}m',
    kind: 'oneshot',
    description:
      'An {A} minor chord brushed once across a chord harp, its reverb falling away over tape hiss.',
    preset: 'polar-signal-stairwell-strum',
    set: { strum: 15 },
    ...played(
      8,
      [
        [0, 4, 57, 0.8],
        [0, 4, 60, 0.7],
        [0, 4, 64, 0.7],
      ],
      2,
    ),
  },
  {
    n: 64,
    id: 'cabin-guitar-em',
    name: 'Cabin guitar {E}m',
    kind: 'oneshot',
    description:
      'An {E} minor chord thumbed once on a nylon guitar, on quarter-inch tape in a small room.',
    preset: 'polar-signal-cabin-guitar',
    // Without the preset's room hiss and with less tape noise, which outlast one chord.
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.05 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    then: [soften(12)],
    ...played(
      4,
      [
        [0, 3, 52, 0.8],
        [0, 3, 59, 0.7],
        [0, 3, 64, 0.7],
        [0, 3, 67, 0.65],
        [0, 3, 71, 0.6],
      ],
      1.5,
    ),
  },
  {
    n: 65,
    id: 'baritone-two-notes-f',
    name: 'Baritone two notes {F}',
    kind: 'oneshot',
    description:
      'A low {F} and {C} strummed once on a dark baritone guitar, on wavering tape in an open space.',
    preset: 'polar-signal-baritone-two-notes',
    then: [soften(21)],
    ...played(
      8,
      [
        [0, 6, 41, 0.8],
        [0, 6, 48, 0.7],
      ],
      2,
    ),
  },
  {
    n: 66,
    id: 'oil-drum-slowed-d',
    name: 'Oil drum slowed {D}',
    kind: 'oneshot',
    description:
      'One tap on a tongue drum on {D}, mostly heard an octave down at half speed, in a cavern.',
    preset: 'polar-signal-oil-drum-slowed',
    then: [soften(9)],
    ...played(5, [[0, 4, 50, 0.8]], 1.5),
  },
  {
    n: 67,
    id: 'sub-slowly-closing-e',
    name: 'Sub slowly closing {E}',
    kind: 'oneshot',
    description:
      'A low {E} whose filter opens at the start and closes over seconds, heavy on tape in a dark room.',
    preset: 'polar-signal-sub-slowly-closing',
    then: [soften(18)],
    ...played(6, [[0, 5.5, 40, 0.85]], 1),
  },
  {
    n: 68,
    id: 'steel-over-snow-c',
    name: 'Steel over snow {C}',
    kind: 'oneshot',
    description:
      'A {C} and {G} picked once on a steel guitar and left ringing in a long, wide reverb.',
    preset: 'polar-signal-steel-over-snow',
    // Picked, not swelled, with a string and a space that are over in eight seconds: the preset's
    // half-minute ring was still loud where the sound had to end.
    set: { swell: 0, sustain: 6 },
    effects: [
      { deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.35, decay: 8, width: 0.8 } },
    ],
    ...played(
      8,
      [
        [0, 3, 60, 0.75],
        [0, 3, 67, 0.65],
      ],
      3,
    ),
  },
  {
    n: 69,
    id: 'lounge-keys-dm7',
    name: 'Lounge keys {D}m7',
    kind: 'oneshot',
    description:
      'A {D} minor seventh on a dark electric piano with slow tremolo, on a crackling record with a dark echo.',
    preset: 'polar-signal-vinyl-lounge-keys',
    ...played(
      6,
      [
        [0, 3, 50, 0.75],
        [0, 3, 57, 0.65],
        [0, 3, 60, 0.65],
        [0, 3, 65, 0.6],
      ],
      2,
    ),
  },
  {
    n: 70,
    id: 'tines-thawing-a',
    name: 'Tines thawing {A}',
    kind: 'oneshot',
    description:
      'An electric piano fifth on {A} and {E}, returning backwards as a slow swell in a breathing reverb.',
    preset: 'polar-signal-tines-thawing',
    // No tremolo and the swell kept under the struck notes, so the strike stays the loudest moment.
    // Two notes this high: one lower tine sustains so evenly that in some keys it is far too loud.
    set: { tremolo: 0, decay: 1.6 },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1200, mix: 0.15 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.25 } },
    ],
    ...played(
      8,
      [
        [0, 4, 69, 0.8],
        [0, 4, 76, 0.6],
      ],
      2.5,
    ),
  },
  {
    n: 71,
    id: 'hammer-on-wire-a',
    name: 'Hammer on wire {A}',
    kind: 'oneshot',
    description:
      'One felted string on a low {A} with strings ringing behind it, its grains falling away on a long plate.',
    preset: 'polar-signal-hammer-on-wire',
    ...played(8, [[0, 5, 45, 0.8]], 2),
  },
  {
    n: 72,
    id: 'marimba-next-hall-g',
    name: 'Marimba next hall {G}',
    kind: 'oneshot',
    description:
      'A soft marimba chord on {G} struck once behind a low-pass, in a reverb that blooms after it.',
    preset: 'polar-signal-marimba-next-hall',
    set: { roll: 0 },
    then: [soften(18)],
    ...played(
      5,
      [
        [0, 2, 43, 0.8],
        [0, 2, 55, 0.7],
        [0, 2, 62, 0.6],
      ],
      1.5,
    ),
  },
  {
    n: 73,
    id: 'glass-in-frost-g',
    name: 'Glass in frost {G}',
    kind: 'oneshot',
    description:
      'One struck glass on a high {G}, a backwards loop of it faint behind, on a long plate.',
    preset: 'polar-signal-glass-in-frost',
    // No beating and less of the loop than the preset: both were heard as second notes.
    set: { detune: 0 },
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { mix: 0.12 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3, damping: 0.5 } },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...played(8, [[0, 4, 79, 0.8]], 3),
  },
  {
    n: 74,
    id: 'hull-thud-g',
    name: 'Hull thud {G}',
    kind: 'oneshot',
    description:
      'A sine sub on a low {G} that dies away at once, warmed by a saturator, in a small room.',
    preset: 'polar-signal-sub-bass-note',
    // The note falls away under the key: held at full level it is far louder than the rest.
    set: { ampDecay: 0.9, ampSustain: 0.35 },
    ...played(2, [[0, 1.1, 43, 0.85]], 0.5),
  },
  {
    n: 75,
    id: 'piano-next-door-c',
    name: 'Piano next door {C}',
    kind: 'oneshot',
    description:
      'A {C} chord with no third on a felt piano, heard down the hall with the room hiss of a close mic.',
    preset: 'polar-signal-piano-next-door',
    // Louder against the room hiss than the preset, which is set for a full hand.
    set: { outputDb: -6 },
    ...played(
      6,
      [
        [0, 4, 48, 0.8],
        [0, 4, 55, 0.7],
        [0, 4, 60, 0.7],
      ],
      2,
    ),
  },
  {
    n: 76,
    id: 'harp-string-returning-g',
    name: 'Harp string returning {G}',
    kind: 'oneshot',
    description:
      'One long-ringing harp string on {G} that comes back reversed from a delay, in a cathedral.',
    preset: 'polar-signal-harp-returning-reversed',
    // A shorter mirror than the preset's, one return and less of the cathedral: it is over inside its length.
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Long mirror',
        params: { time: 1500, feedback: 0.1, mix: 0.4 },
      },
      hall('Cathedral', 0.18),
    ],
    ...played(8, [[0, 2, 67, 0.8]], 3),
  },
  {
    n: 77,
    id: 'station-chime-g',
    name: 'Station chime {G}',
    kind: 'oneshot',
    description: 'One chime of a chord harp on a high {G}, on a night shortwave radio in a room.',
    preset: 'polar-signal-station-chimes',
    // Less static than the preset, which hid the pitch of a single chime.
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { drift: 0.1, fading: 0.35, static: 0.12, bandwidth: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...played(6, [[0, 3, 79, 0.8]], 2),
  },
  // Phrases: a few notes in free time, ending inside their length or coming round.
  {
    n: 78,
    id: 'strum-left-hanging-a',
    name: 'Strum left hanging {A}',
    kind: 'melodic',
    description:
      'A strum of doubled strings on {A}, then {G}, then {F}, each caught and held as a dark bed; it comes round.',
    preset: 'polar-signal-strum-left-hanging',
    // A quicker strum than the preset's, unevenly spaced: a slow one is two hits, and four evenly
    // spaced are heard as a beat.
    set: { strum: 40 },
    ...cycled(12, [
      [0, 3.1, 45, 0.8],
      [0, 3.1, 52, 0.7],
      [3.3, 4.9, 43, 0.75],
      [3.3, 4.9, 50, 0.65],
      [8.4, 3.4, 41, 0.75],
      [8.4, 3.4, 48, 0.65],
    ]),
  },
  {
    n: 79,
    id: 'depth-sounder-e',
    name: 'Depth sounder {E}',
    kind: 'melodic',
    description:
      'Soft folded mallet notes on {E} and {B}, repeated by a slow warm tape echo into far echoes; it comes round.',
    preset: 'polar-signal-depth-sounder',
    then: [soften(12)],
    ...cycled(8, [
      [0, 0.8, 76, 0.8],
      [2.7, 0.8, 71, 0.7],
    ]),
  },
  {
    n: 80,
    id: 'icicles-b',
    name: 'Icicles {B}',
    kind: 'melodic',
    description:
      'Glass chimes high over {B}, each flickering back from memory on a plate; it comes round.',
    preset: 'polar-signal-icicles',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0, 1.5, 83, 0.8],
      [1.3, 1.5, 88, 0.65],
      [2.9, 1.5, 86, 0.7],
      [5.2, 1.5, 91, 0.65],
      [6.1, 1.5, 84, 0.7],
    ]),
  },
  {
    n: 81,
    id: 'cold-arpeggio-am',
    name: 'Cold arpeggio {A}m',
    kind: 'melodic',
    description:
      'A reedy synth climbs {A} minor and then {C} major in free time, dark echoes on a small plate; it comes round.',
    preset: 'polar-signal-cold-arpeggio',
    ...cycled(8, [
      [0, 0.5, 57, 0.8],
      [0.62, 0.5, 64, 0.7],
      [1.5, 0.5, 69, 0.75],
      [2.4, 0.6, 72, 0.7],
      [4.1, 0.5, 60, 0.75],
      [4.75, 0.5, 64, 0.7],
      [5.9, 0.8, 67, 0.7],
    ]),
  },
  {
    n: 82,
    id: 'signal-through-snow-e',
    name: 'Signal through snow {E}',
    kind: 'melodic',
    description:
      'A glassy synth line rising from {E} to {C}, thin on a sideband radio with static, into far echoes.',
    preset: 'polar-signal-signal-through-snow',
    // Tuned onto the station: off it the sideband puts every note off the key.
    set: { attack: 0.01, release: 1.2 },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Sideband voices',
        params: { tuning: 0, drift: 0, static: 0.2 },
      },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.25 } },
    ],
    ...played(
      10,
      [
        [0, 0.8, 64, 0.8],
        [0.85, 0.9, 67, 0.7],
        [2.2, 1.3, 72, 0.8],
        [3.9, 0.5, 71, 0.7],
        [4.45, 1.2, 67, 0.75],
      ],
      3,
    ),
  },
  {
    n: 83,
    id: 'frost-glasses-g',
    name: 'Frost glasses {G}',
    kind: 'melodic',
    description:
      'Struck glasses over {G}, slow and far apart, a backwards loop of them behind on a long plate; it comes round.',
    preset: 'polar-signal-glass-in-frost',
    ...cycled(12, [
      [0, 3, 67, 0.8],
      [2.2, 3, 74, 0.7],
      [3.6, 3, 71, 0.7],
      [6.4, 3, 72, 0.8],
      [8.1, 3, 76, 0.65],
      [9.7, 3, 69, 0.7],
    ]),
  },
  {
    n: 84,
    id: 'lost-music-box-c',
    name: 'Lost music box {C}',
    kind: 'melodic',
    description:
      'A music box climbs a {C} major chord and comes down slowing, through dusty converters and a hazy echo.',
    preset: 'polar-signal-lost-music-box',
    ...played(
      8,
      [
        [0, 0.8, 72, 0.8],
        [0.42, 0.8, 76, 0.7],
        [0.95, 0.8, 79, 0.75],
        [1.7, 0.8, 84, 0.8],
        [2.3, 0.8, 83, 0.65],
        [3.05, 0.8, 79, 0.7],
        [3.9, 1, 76, 0.75],
      ],
      3,
    ),
  },
  {
    n: 85,
    id: 'coast-station-pips-e',
    name: 'Coast station pips {E}',
    kind: 'melodic',
    description:
      'Short plucked pips on {E} with a {G} and a {B} among them, on a crowded radio band with a murky echo; it comes round.',
    preset: 'polar-signal-coast-station-pips',
    ...cycled(8, [
      [0, 0.3, 76, 0.8],
      [0.5, 0.3, 76, 0.7],
      [1.3, 0.3, 76, 0.75],
      [3.2, 0.3, 79, 0.8],
      [3.6, 0.3, 76, 0.7],
      [5.4, 0.3, 71, 0.75],
      [6.5, 0.3, 76, 0.7],
    ]),
  },
  {
    n: 86,
    id: 'steps-below-deck-c',
    name: 'Steps below deck {C}',
    kind: 'melodic',
    description:
      'A sine bass stepping from {C} up to {G} and back down by {F} and {D}, warmed by a saturator; it comes round.',
    preset: 'polar-signal-sub-bass-note',
    // Each note falls away under the key, so all four are heard as steps and the line is no
    // louder than the rest of the pack.
    // The first step waits a moment: the sine does not start each pass at the same point of its
    // wave, so no note lies across the seam.
    set: { ampDecay: 0.9, ampSustain: 0.35 },
    ...cycled(8, [
      [0.3, 1.1, 48, 0.9],
      [2.4, 0.7, 55, 0.7],
      [3.7, 1.1, 53, 0.7],
      [5.9, 1.3, 50, 0.75],
    ]),
    loopFold: 'power',
  },
  {
    n: 87,
    id: 'radio-trumpet-dm',
    name: 'Radio trumpet {D}m',
    kind: 'melodic',
    description:
      'A muted trumpet rises from {D} by {F} to a strong {G} and steps back down, on a small kitchen radio in a room.',
    preset: 'polar-signal-radio-trumpet',
    // A blown note holds its level: one strong note among soft ones, or the line is over the pack's
    // loudness. The strong one is the fourth: the small speaker adds its overtones, all white keys.
    set: { attack: 0.03 },
    ...played(
      7,
      [
        [0, 1, 62, 0.3],
        [1.2, 0.5, 65, 0.3],
        [1.9, 0.9, 67, 1],
        [3.2, 0.45, 65, 0.3],
        [4.1, 1.4, 62, 0.3],
      ],
      1.5,
    ),
  },
  {
    n: 88,
    id: 'cold-breath-horn-g',
    name: 'Cold breath horn {G}',
    kind: 'melodic',
    description:
      'A breathy flugelhorn rises from {G} to {D} and settles on {B}, on a worn cassette in a hall.',
    preset: 'polar-signal-cold-breath-horn',
    set: { attack: 0.05 },
    ...played(
      10,
      [
        [0, 1.6, 55, 0.8],
        [1.9, 1.2, 60, 0.75],
        [3.4, 2, 62, 0.85],
        [5.8, 1.6, 59, 0.75],
      ],
      2,
    ),
  },
  {
    n: 89,
    id: 'looped-guitar-em',
    name: 'Looped guitar {E}m',
    kind: 'melodic',
    description:
      'A steel guitar picks slowly through {E} minor while a tape loop between two decks layers it; it comes round.',
    preset: 'polar-signal-looped-guitar',
    then: [soften(12)],
    ...cycled(8, [
      [0, 2, 52, 0.8],
      [0.62, 2, 59, 0.7],
      [1.93, 2, 64, 0.75],
      [2.41, 2, 67, 0.7],
      [4.05, 2, 57, 0.8],
      [5.57, 2, 60, 0.7],
      [6.31, 2, 64, 0.75],
    ]),
  },
  {
    n: 90,
    id: 'station-chimes-c',
    name: 'Station chimes {C}',
    kind: 'melodic',
    description:
      'Four single chimes of a chord harp, {C}, {G}, a high {E} and a low {C}, on a night shortwave radio in a room.',
    preset: 'polar-signal-station-chimes',
    // Less static than the preset, which hid the pitch of single chimes.
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { drift: 0.1, fading: 0.35, static: 0.12, bandwidth: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...played(
      8,
      [
        [0, 2, 72, 0.8],
        [1.1, 2, 67, 0.7],
        [2.5, 2, 76, 0.8],
        [4.4, 3, 60, 0.75],
      ],
      2,
    ),
  },
  {
    n: 91,
    id: 'piano-next-door-am',
    name: 'Piano next door {A}m',
    kind: 'melodic',
    description:
      'A felt piano heard down the hall: slow notes over {A} and then over {F}, with close room hiss; it comes round.',
    preset: 'polar-signal-piano-next-door',
    // Louder against the room hiss than the preset, which is set for a full hand.
    set: { outputDb: -9 },
    ...cycled(12, [
      [0, 5, 45, 0.6],
      [0.08, 5, 52, 0.5],
      [1.3, 3, 64, 0.9],
      [2.5, 3, 60, 0.85],
      [3.4, 2.5, 62, 0.9],
      [6.1, 5, 41, 0.6],
      [6.18, 5, 48, 0.5],
      [7.4, 3, 60, 0.9],
      [8.9, 2.5, 57, 0.85],
      [10.6, 1.2, 59, 0.8],
    ]),
  },
  {
    n: 92,
    id: 'lounge-piano-loop-dm',
    name: 'Lounge piano loop {D}m',
    kind: 'melodic',
    description:
      'A felt piano over {D} and then over {C} on a scratched record, a short loop of it underneath; it comes round.',
    preset: 'polar-signal-lounge-piano-loop',
    ...cycled(8, [
      [0, 2, 50, 0.6],
      [0.06, 2, 57, 0.5],
      [1.2, 1.5, 65, 0.9],
      [2.1, 1.5, 69, 0.85],
      [3.6, 2, 67, 0.9],
      [4.9, 2, 48, 0.6],
      [5, 2, 55, 0.5],
      [6.3, 1.4, 64, 0.9],
      [7.1, 0.8, 62, 0.8],
    ]),
  },
  {
    n: 93,
    id: 'bad-line-flute-am',
    name: 'Bad line flute {A}m',
    kind: 'melodic',
    description:
      'A wooden flute rises from {A} to a long {E} and falls back, dropping out and stuttering on a bad line; it comes round.',
    preset: 'polar-signal-bad-line-flute',
    // The first note waits a moment: the line stutters differently each time round, so only the
    // hall's tail lies across the seam, folded at equal power.
    set: { attack: 0.02 },
    ...cycled(8, [
      [0.35, 1.1, 69, 0.6],
      [1.65, 0.5, 72, 0.5],
      [2.35, 1.4, 76, 1],
      [3.95, 0.4, 74, 0.55],
      [4.55, 1.1, 72, 0.55],
      [5.9, 0.9, 69, 0.55],
    ]),
    loopFold: 'power',
  },
  {
    n: 94,
    id: 'muted-pulse-g',
    name: 'Muted pulse {G}',
    kind: 'melodic',
    description:
      'Muted guitar notes low around {G}, unevenly spaced, driven onto tape with dark echoes; it comes round.',
    preset: 'polar-signal-muted-pulse',
    // Fewer echoes than the preset and off its grid: a train of them is heard as a beat.
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { driveDb: 15, outputDb: -5.5 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 410, feedback: 0.2, spread: 0.7, mix: 0.22 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
    then: [soften(9)],
    ...cycled(8, [
      [0, 0.3, 43, 0.8],
      [0.83, 0.3, 43, 0.7],
      [1.31, 0.3, 48, 0.75],
      [2.9, 0.3, 53, 0.8],
      [3.37, 0.3, 43, 0.7],
      [4.95, 0.3, 48, 0.8],
      [6.02, 0.3, 50, 0.7],
      [6.6, 0.3, 43, 0.75],
    ]),
  },
  {
    n: 95,
    id: 'skipping-hand-drum-d',
    name: 'Skipping hand drum {D}',
    kind: 'melodic',
    description:
      'Damped taps on a steel pan around {D}, on a record that skips now and then, in a room; it comes round.',
    preset: 'polar-signal-skipping-hand-drum',
    // The taps stand far above what rings after them.
    then: [soften(9)],
    ...cycled(8, [
      [0, 1, 62, 0.8],
      [0.8, 1, 69, 0.6],
      [1.5, 1, 65, 0.7],
      [2.9, 1, 62, 0.75],
      [3.3, 1, 67, 0.6],
      [4.6, 1, 69, 0.8],
      [5.9, 1, 60, 0.7],
      [6.4, 1, 65, 0.65],
    ]),
  },
  {
    n: 96,
    id: 'harp-under-dust-dm',
    name: 'Harp under dust {D}m',
    kind: 'melodic',
    description:
      'A harp climbs {D} minor from a low fifth and turns back, on a dusty record with a half-speed loop behind.',
    preset: 'polar-signal-harp-under-dust',
    // Less of the loop than the preset: it goes on after the harp has stopped.
    effects: [
      { deviceId: 'patina', preset: 'Dusty record', params: { tone: 0.3 } },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { mix: 0.15 } },
      hall('Hall', 0.3),
    ],
    ...played(
      8,
      [
        [0, 2, 50, 0.7],
        [0.1, 2, 57, 0.6],
        [0.9, 1.6, 62, 0.7],
        [1.5, 1.6, 65, 0.65],
        [2.4, 1.6, 69, 0.75],
        [3.3, 1.2, 67, 0.6],
        [3.8, 1.2, 64, 0.7],
      ],
      3,
    ),
  },
  {
    n: 97,
    id: 'harp-returning-g',
    name: 'Harp returning {G}',
    kind: 'melodic',
    description:
      'Long-ringing harp notes over {G} and then {A}, each coming back reversed in a cathedral; it comes round.',
    preset: 'polar-signal-harp-returning-reversed',
    ...cycled(12, [
      [0, 3, 55, 0.8],
      [1.7, 3, 62, 0.7],
      [3.1, 3, 71, 0.75],
      [6.3, 3, 57, 0.8],
      [7.6, 3, 64, 0.7],
      [9.4, 3, 72, 0.75],
    ]),
  },
  {
    n: 98,
    id: 'medium-wave-lullaby-c',
    name: 'Medium wave lullaby {C}',
    kind: 'melodic',
    description: 'A celesta tune in {C} major on a medium wave radio with static, in a small room.',
    preset: 'polar-signal-medium-wave-lullaby',
    // Less static than the preset: under all of it the tune had no pitch left.
    effects: [
      { deviceId: 'radio', preset: 'Storm coming', params: { fading: 0.35, static: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...played(
      8,
      [
        [0, 1, 76, 0.9],
        [0.8, 1, 72, 0.7],
        [1.7, 1, 74, 0.7],
        [2.8, 1.3, 67, 0.7],
        [3.9, 1, 72, 0.7],
        [4.6, 1, 69, 0.6],
        [5.3, 1, 72, 0.6],
      ],
      2,
    ),
  },
  {
    n: 99,
    id: 'slow-reel-steel-c',
    name: 'Slow reel steel {C}',
    kind: 'melodic',
    description:
      'A pedal steel picks {C} and then {F}, a high note after each, on seasick tape in a long dark reverb; it comes round.',
    preset: 'polar-signal-slow-reel-steel',
    // No swell, so each pick is heard as a hit; the tape's wow makes no two passes alike.
    set: { swell: 0, pick: 0.6 },
    ...cycled(12, [
      [0, 5, 48, 0.65],
      [0.03, 5, 64, 0.7],
      [2.4, 3, 67, 0.6],
      [6.1, 5.5, 53, 0.65],
      [6.14, 5.5, 69, 0.7],
      [8.6, 3, 72, 0.6],
    ]),
    loopFold: 'power',
  },
  {
    n: 100,
    id: 'night-band-vibes-g',
    name: 'Night band vibes {G}',
    kind: 'melodic',
    description:
      'A sampled vibraphone note played as a slow tune from {G}, on night shortwave with an echo from a minute ago.',
    preset: 'polar-signal-night-band-voice',
    source: 'vibraphone-g',
    // Less static than the preset: in the low keys it covered the pitch.
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.4, static: 0.1, bandwidth: 0.45, mix: 0.85 },
      },
      { deviceId: 'echo-memory', preset: 'Minute ago', params: { mix: 0.35 } },
    ],
    ...played(
      10,
      [
        [0, 1.5, 60, 0.8],
        [1.4, 1.5, 65, 0.7],
        [2.3, 2, 67, 0.8],
        [4.3, 1.3, 62, 0.7],
        [5.2, 1.6, 60, 0.8],
      ],
      3,
    ),
  },
])
