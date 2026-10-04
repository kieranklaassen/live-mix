// The sounds of the pack "Neon Rain, 2019": its presets played, a hundred sounds to
// paint with. Numbers 22001 to 22100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/neon-rain'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

/** The pack's hall: the cathedral its presets stand in. It does not stir, so a held tone stays level in it. */
const cathedral = (params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'hall-reverb',
  preset: 'Cathedral',
  params,
})

const darkHall = (mix: number): PatchDevice => ({
  deviceId: 'hall-reverb',
  preset: 'Dark hall',
  params: { mix },
})

/** The pack's huge space with its modulation stopped, for a tone that has to hold still. */
const stillSpace = (params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'expanse',
  preset: 'Open space',
  params: { modDepth: 0, ...params },
})

/** The early converters most of the pack is heard through. */
const glaze: PatchDevice = { deviceId: 'vintage-digital', preset: 'Glaze' }

/** Weather and room tone, narrowed: at its own width the instrument has as much side as mid. */
const weather = (preset: string, params: Readonly<Record<string, number>> = {}): PatchDevice => ({
  deviceId: 'atmosphere',
  preset,
  params: { attack: 0.5, width: 0.6, ...params },
})

/** Holds a pluck or a strike down so what rings after it is not left far below the bank's peak. */
const lift = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

const narrow: PatchDevice = { deviceId: 'stereo-widener', preset: 'Narrow' }

/** Evens out the slow beating of held fifths, which is deeper in some keys than in others. */
const level: PatchDevice = {
  deviceId: 'ambient-comp',
  params: { threshold: -45, ratio: 8, attack: 10, release: 0.15, makeup: 18 },
}

export const SOUNDS: readonly FactorySound[] = packSounds('neon-rain', 22000, PRESETS, [
  // Drones: what the city holds under everything else.
  {
    n: 1,
    id: 'plain-beyond-towers-e',
    name: 'Industrial plain {E}m',
    kind: 'drone',
    description:
      'The dark just-minor drone on {E}, held still, turned once a loop by a phaser in a huge space.',
    preset: 'neon-rain-industrial-plain',
    set: { movement: 0 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { rate: 0.125, feedback: 40, depth: 40, mix: 0.15 },
      },
      stillSpace({ size: 0.85, decay: 30, highCut: 4500, mix: 0.4, width: 0.7 }),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [52]),
  },
  {
    n: 2,
    id: 'reactor-floor-octaves-d',
    name: 'Reactor floor {D}',
    kind: 'drone',
    description:
      'Stacked octaves on a low {D} over a heavy sub, held still and pushed through a transformer in a dark hall.',
    preset: 'neon-rain-reactor-floor',
    set: { movement: 0 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.6, lowBump: 0.3 } },
      darkHall(0.25),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [38]),
  },
  {
    n: 3,
    id: 'generator-hum-a',
    name: 'Basement generator {A}',
    kind: 'drone',
    description:
      'Square waves on a low {A} and the {E} above over their sub octaves, the filter low, on clean tape in a dark hall.',
    preset: 'neon-rain-basement-generator',
    effects: [
      {
        deviceId: 'tape',
        preset: 'Mastering deck',
        params: { drive: 0.2, hiss: 0.05, wow: 0, flutter: 0 },
      },
      darkHall(0.4),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [45, 52]),
  },
  {
    n: 4,
    id: 'brass-pedal-held-f',
    name: 'Low brass pedal {F}',
    kind: 'drone',
    description:
      'Polysynth brass on a low {F} with its octave below and the filter held low, a pedal note in a cathedral.',
    preset: 'neon-rain-low-brass-pedal',
    set: { detune: 0 },
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5, filter: 600 } },
      cathedral({ mix: 0.3 }),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 2, [41]),
  },
  {
    n: 5,
    id: 'pedal-bass-phased-a',
    name: 'Phased pedal bass {A}',
    kind: 'drone',
    description:
      'A low {A} on the ladder-filter bass with its sub, the top turned once a loop by a phaser, in a dark hall.',
    preset: 'neon-rain-phased-pedal-bass',
    set: { beat: 0 },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.125, mix: 0.35 } },
      darkHall(0.22),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 4, 2, [33]),
  },
  {
    n: 6,
    id: 'underpass-cello-rank-c',
    name: 'Underpass cellos {C}',
    kind: 'drone',
    description:
      'The low octave of the string ensemble alone on {C}, its chorus stilled, warmed by saturation in a dark hall.',
    preset: 'neon-rain-underpass-cellos',
    set: { ensemble: 0.1, drift: 0 },
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 6, outputDb: -3 } },
      darkHall(0.25),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [48]),
  },
  {
    n: 7,
    id: 'parking-cello-bowed-g',
    name: 'Parking level cello {G}',
    kind: 'drone',
    description:
      'A cello bowed heavily on a low {G} and the {D} above with no vibrato, on tape, dark in a very large space.',
    preset: 'neon-rain-parking-level-cello',
    set: { vibrato: 0 },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { drive: 0.1, hiss: 0.12, wow: 0, flutter: 0 },
      },
      stillSpace({ size: 0.8, decay: 14, highCut: 4000, mix: 0.3, width: 0.5 }),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [43, 50]),
  },
  {
    n: 8,
    id: 'rooftop-pipes-held-d',
    name: 'Pipes over rooftops {D}',
    kind: 'drone',
    description:
      'Dark organ pipes on {D} with a steady wind, glazed by early converters, in a slow chorus in a cathedral.',
    preset: 'neon-rain-pipes-over-rooftops',
    set: { celeste: 0, bellows: 0 },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 13000 } },
      {
        deviceId: 'chorus',
        preset: 'Classic chorus',
        params: { rate: 0.125, depth: 30, mix: 0.3 },
      },
      cathedral({ mix: 0.3 }),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [50]),
  },
  {
    n: 9,
    id: 'foundry-tuba-held-c',
    name: 'Foundry low brass {C}',
    kind: 'drone',
    description:
      'One player of the low brass holding a low {C} with some breath in the tone, dark and heavy in a cathedral.',
    preset: 'neon-rain-foundry-low-brass',
    set: { section: 0, blow: 0.85, breath: 0.2 },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000, lowCut: 30 } },
      cathedral({ mix: 0.35 }),
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [36]),
  },
  {
    n: 10,
    id: 'held-wire-still-a',
    name: 'Held wire {A}',
    kind: 'drone',
    description:
      'Three strings in fifths from {A} held singing with no bow or vibrato, in a slow chorus with dark repeats in a cathedral.',
    preset: 'neon-rain-held-wire-lead',
    set: { vibrato: 0, detune: 0, brightness: 0.8 },
    effects: [
      {
        deviceId: 'chorus',
        preset: 'Classic chorus',
        params: { rate: 0.375, depth: 20, spread: 30, mix: 0.3 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 480, mix: 0.25, modDepth: 0 },
      },
      cathedral({ mix: 0.4 }),
    ],
    then: [level, quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [45, 52, 59]),
  },
  {
    n: 11,
    id: 'glass-rims-held-c',
    name: 'Rubbed glass halo {C}',
    kind: 'drone',
    description:
      'Three glass rims rubbed until they sing on {C}, {G} and {D}, with a faint halo an octave over them in a long tail.',
    preset: 'neon-rain-rubbed-glass-halo',
    set: { detune: 0 },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Rising choir',
        params: { decay: 10, shimmer: 0.25, size: 0.8, tone: 5000, mix: 0.4, modulation: 0 },
      },
    ],
    then: [narrow, quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [60, 67, 74]),
  },
  {
    n: 12,
    id: 'folded-tone-held-f',
    name: 'Folded tone {F}',
    kind: 'drone',
    description:
      'Pure tones on a low {F} and {C} folded over into brightness and held with no drift, in a huge still space.',
    preset: 'neon-rain-slow-folding-pad',
    set: { drift: 0, chance: 0 },
    effects: [stillSpace({ size: 0.75, decay: 12, mix: 0.4 })],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [41, 48]),
  },
  {
    n: 13,
    id: 'hollow-tower-still-b',
    name: 'Hollow tower {B}',
    kind: 'drone',
    description:
      'A hollow wavetable on a low {B} over a strong sub, the filter low, its wave turning once a loop in a dark hall.',
    preset: 'neon-rain-hollow-tower-pad',
    set: { motion: 0.2, rate: 0.125, detune: 0, sub: 0.6 },
    effects: [darkHall(0.45)],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 2, [47]),
  },
  {
    n: 14,
    id: 'skyline-crystal-held-g',
    name: 'Skyline crystal {G}',
    kind: 'drone',
    description:
      'The FM pad on {G} and {D} with its operators in tune and an octave under them, level in a very long hall.',
    preset: 'neon-rain-skyline-crystal-pad',
    set: { detune: 0 },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub2: 0, sub1: 0.5, dry: 1, up1: 0, up2: 0, filter: 16000 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
    ],
    then: [narrow, quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 6, 3, [55, 62]),
  },
  {
    n: 15,
    id: 'ribbon-voices-held-d',
    name: 'Ribbon brass held {D}',
    kind: 'drone',
    description:
      'Two brass voices of the polysynth held on {D} and {A} with no waver, their dark repeats still in a long hall.',
    preset: 'neon-rain-lone-ribbon-lead',
    set: { detune: 0 },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 440, mix: 0.28, modDepth: 0 },
      },
      cathedral({ midDecay: 5, mix: 0.4 }),
    ],
    then: [level, quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 5, 2, [62, 69]),
  },
  // Pads: the brass that swells, strings, voices and horns a long way off.
  {
    n: 16,
    id: 'flare-brass-swell-fmaj7',
    name: 'Flare stack brass {F}maj7',
    kind: 'pad',
    description:
      'Polysynth brass on {F} major seventh that starts dark and keeps swelling, then dies in a cathedral-sized hall.',
    preset: 'neon-rain-flare-stack-brass',
    ...played(
      11,
      [
        [0, 4.5, 41, 0.9],
        [0.03, 4.5, 48, 0.8],
        [0.05, 4.5, 57, 0.85],
        [0.08, 4.5, 64, 0.8],
      ],
      3,
    ),
  },
  {
    n: 17,
    id: 'rooftop-brass-gsus2',
    name: 'Rooftop swell {G}sus2',
    kind: 'pad',
    description:
      'A brass chord on {G} with its filter open, ridden by a slow compressor, swelling once a loop into a huge space.',
    preset: 'neon-rain-rooftop-swell',
    then: [breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [43, 50, 57, 62]),
  },
  {
    n: 18,
    id: 'searchlight-chord-a',
    name: 'Searchlight sweep {A}',
    kind: 'pad',
    description:
      'An open chord on {A} that begins with a falling ring-modulator sweep and melts into brass, in a nine-second hall.',
    preset: 'neon-rain-searchlight-sweep',
    set: { release: 3 },
    ...played(
      10,
      [
        [0, 3.5, 45],
        [0, 3.5, 52],
        [0, 3.5, 57],
        [0, 3.5, 64],
      ],
      3,
    ),
  },
  {
    n: 19,
    id: 'filter-tower-opens-d',
    name: 'Slow filter tower {D}',
    kind: 'pad',
    description:
      'Open fifths on {D} that begin almost shut and open as they are held, kept level into a ten-second hall.',
    preset: 'neon-rain-slow-filter-tower',
    set: { release: 3 },
    ...played(
      13,
      [
        [0, 6.5, 50],
        [0, 6.5, 57],
        [0, 6.5, 62],
        [0, 6.5, 69],
      ],
      3,
    ),
  },
  {
    n: 20,
    id: 'basin-horn-swell-c',
    name: 'Horns over basin {C}',
    kind: 'pad',
    description:
      'A horn section on {C} major that swells in and brightens as it grows, then dies away in a glazed cathedral.',
    preset: 'neon-rain-horns-over-the-basin',
    set: { release: 3 },
    ...played(
      11,
      [
        [0, 5.5, 48],
        [0, 5.5, 55],
        [0, 5.5, 60],
        [0, 5.5, 64],
      ],
      3,
    ),
  },
  {
    n: 21,
    id: 'far-fanfare-chord-g',
    name: 'Distant fanfare {G}',
    kind: 'pad',
    description:
      'A trumpet section on a {G} major chord, speaking in a third of a second, set far back in a nine-second hall.',
    preset: 'neon-rain-distant-fanfare',
    ...played(
      10,
      [
        [0, 3.5, 62],
        [0, 3.5, 67],
        [0, 3.5, 71],
        [0, 3.5, 74],
      ],
      3,
    ),
  },
  {
    n: 22,
    id: 'singing-strings-em',
    name: 'Singing hall strings {E}m',
    kind: 'pad',
    description:
      'Plain sawtooth strings on {E} minor swelling once a loop into a hall whose tail sings a wordless ah.',
    preset: 'neon-rain-singing-hall-strings',
    then: [breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [52, 59, 64, 67]),
  },
  {
    n: 23,
    id: 'sampled-section-am',
    name: 'Twelve-bit section {A}m',
    kind: 'pad',
    description:
      'A muted string section on {A} minor swelling in slowly as an early sampler holds it, grainy in a cathedral.',
    preset: 'neon-rain-twelve-bit-section',
    set: { bow: 0, release: 2.5 },
    ...played(
      11,
      [
        [0, 5.5, 45],
        [0, 5.5, 52],
        [0, 5.5, 60],
      ],
      3,
    ),
  },
  {
    n: 24,
    id: 'half-speed-horns-d',
    name: 'Hissing slow horns {D}',
    kind: 'pad',
    description:
      'Horns from tape at half speed on {D}, {A} and {E}, an octave down and hissing, swelling once a loop in a huge space.',
    preset: 'neon-rain-hissing-slow-horns',
    set: { age: 0.15, length: 9 },
    then: [breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [50, 57, 64]),
  },
  {
    n: 25,
    id: 'guitar-swell-round-g',
    name: 'Swelled guitar chord {G}',
    kind: 'pad',
    description:
      'A {G} major guitar chord with every pick taken off by the volume pedal, doubled wide, rising once a loop.',
    preset: 'neon-rain-swelled-guitar-chord',
    ...cycled(12, [
      [0.4, 9, 43],
      [0.4, 9, 50],
      [0.4, 9, 55],
      [0.4, 9, 59],
      [0.4, 9, 62],
    ]),
  },
  {
    n: 26,
    id: 'still-steel-round-c6',
    name: 'Still steel {C}6',
    kind: 'pad',
    description:
      'Steel strings on {C} sixth swelled in with no vibrato and left to ring, glazed, in a huge space; it comes round.',
    preset: 'neon-rain-still-steel-far-tower',
    ...cycled(12, [
      [0.4, 10, 48],
      [0.4, 10, 55],
      [0.4, 10, 64],
      [0.4, 10, 69],
    ]),
  },
  {
    n: 27,
    id: 'flugelhorn-line-d',
    name: 'Lonely flugelhorn {D}',
    kind: 'pad',
    description:
      'One flugelhorn with breath and a slow vibrato on a three-note line from {D}, its repeats falling into a cathedral.',
    preset: 'neon-rain-lonely-flugelhorn',
    ...played(
      10,
      [
        [0, 2.4, 62],
        [2.5, 1.6, 65],
        [4.2, 3.6, 64],
      ],
      3,
    ),
  },
  {
    n: 28,
    id: 'high-rise-csus2',
    name: 'High rise strings {C}',
    kind: 'pad',
    description:
      'The string side of the polysynth on {C}, {G}, {C} and {D}, in an ensemble chorus, swelling once a loop.',
    preset: 'neon-rain-high-rise-strings',
    set: { detune: 8 },
    then: [narrow, breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [60, 67, 72, 74]),
  },
  {
    n: 29,
    id: 'wet-pavement-fifths-a',
    name: 'Wet pavement pad {A}',
    kind: 'pad',
    description:
      'Saw and moving pulse on open fifths over {A} under both choruses, swelling once a loop in a glazed cathedral.',
    preset: 'neon-rain-wet-pavement-pad',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [45, 52, 57, 64]),
  },
  {
    n: 30,
    id: 'glass-pulse-fifths-e',
    name: 'Pulse under glass {E}',
    kind: 'pad',
    description:
      'A thin pulse on open fifths over {E} whose width keeps moving, turned once a loop by a phaser in a very large space.',
    preset: 'neon-rain-pulse-under-glass',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { rate: 0.0625, feedback: 20, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.7, decay: 14, mix: 0.4 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }, breathe(0.0625, 0.4)],
    ...looped(16, 6, 3, [52, 59, 64, 71]),
  },
  {
    n: 31,
    id: 'ensemble-strings-dm',
    name: 'Soft ensemble strings {D}',
    kind: 'pad',
    description:
      'The string ensemble keyboard on {D} minor with a soft bow, swelling once a loop in a cathedral through old converters.',
    preset: 'neon-rain-soft-ensemble-strings',
    set: { high: 0.15, ensemble: 0.5 },
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [50, 57, 62, [65, 0.5]]),
  },
  {
    n: 32,
    id: 'low-cloud-gsus2',
    name: 'Low cloud strings {G}',
    kind: 'pad',
    description:
      'Strings on a low {G}, {D} and {A} with the top rolled off, dark and wide, swelling once a loop in a very large space.',
    preset: 'neon-rain-low-cloud-strings',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }, breathe(0.0625, 0.5)],
    ...looped(16, 6, 3, [43, 50, 57]),
  },
  {
    n: 33,
    id: 'high-wire-dsus2',
    name: 'High wire strings {D}',
    kind: 'pad',
    description:
      'The ensemble with no low octave on {D}, {A} and {E}, thin and high, turned once a loop by a six-stage phaser in a hall.',
    preset: 'neon-rain-high-wire-strings',
    set: { ensemble: 0.4, speed: 0.5 },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 1800, mix: 0.4, rate: 0.125 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 8, damping: 0.25, size: 1.5, mix: 0.4, breathRate: 0.25 },
      },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [62, 69, 76]),
  },
  {
    n: 34,
    id: 'chip-choir-open-a',
    name: 'Choir from a chip {A}',
    kind: 'pad',
    description:
      'A straight-toned choir on ah holding {A}, {E} and {A}, read back through worn nine-bit converters in a huge space.',
    preset: 'neon-rain-choir-from-a-chip',
    set: { ensemble: 0.2 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [57, 64, 69]),
  },
  {
    n: 35,
    id: 'tape-choir-triad-c',
    name: 'Tape strip choir {C}',
    kind: 'pad',
    description:
      'A choir from a strip of tape under each key on {C} major, drifting in chorus, swelling once a loop in a cathedral.',
    preset: 'neon-rain-tape-strip-choir',
    set: { age: 0.1, vibrato: 0, length: 9 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 6, 3, [60, 64, 67]),
  },
  {
    n: 36,
    id: 'rotor-flutes-g',
    name: 'Slow rotor flutes {G}',
    kind: 'pad',
    description:
      'Flute ranks with no reed on {G} major through a rotating speaker on its slow speed, across the room in a hall.',
    preset: 'neon-rain-slow-rotor-flutes',
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [55, 62, 67, 71]),
  },
  {
    n: 37,
    id: 'vowel-table-fifths-f',
    name: 'Vowel table choir {F}',
    kind: 'pad',
    description:
      'A wavetable of vowels on {F}, {C} and {G} moving once round each loop, through twelve-bit converters in a cathedral.',
    preset: 'neon-rain-vowel-table-choir',
    set: { rate: 0.0625, detune: 4 },
    then: [breathe(0.0625, 0.4)],
    ...looped(16, 6, 3, [53, 60, 67, 72]),
  },
  {
    n: 38,
    id: 'plain-wires-round-c',
    name: 'Four plain wires {C}',
    kind: 'pad',
    description:
      'Four strings tuned to {C} and the {G} below, plucked round once a loop with no buzz, in a deep chorus and a large space.',
    preset: 'neon-rain-four-plain-wires',
    set: { speed: 8.094 },
    effects: [
      lift(10),
      { deviceId: 'chorus', preset: 'Deep sea', params: { depth: 60, feedback: 10, mix: 0.5 } },
      stillSpace({ size: 0.8, decay: 16, mix: 0.4, width: 0.6 }),
    ],
    then: [breathe(0.125, 0.6)],
    ...looped(8, 8, 3, [48]),
  },
  {
    n: 39,
    id: 'failing-sign-tube-b',
    name: 'Neon tube hum {B}',
    kind: 'pad',
    description:
      'Mains hum tuned to {B} in three octaves, flickering at random like a failing sign tube, in a small dark room.',
    preset: 'neon-rain-neon-tube-hum',
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 9, depth: 0.6, shape: 3, smooth: 0.1 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 5000, mix: 0.3 } },
    ],
    then: [quarterTurn(8)],
    tuning: 'whole-cycles',
    ...looped(8, 3, 2, [35, 47, 59]),
  },
  {
    n: 40,
    id: 'horn-and-fifth-f',
    name: 'Horn in fifths {F}',
    kind: 'pad',
    description:
      'A soft french horn on {F} shadowed a fifth above, washed by a wide flanger on a long plate, swelling once a loop.',
    preset: 'neon-rain-horn-in-fifths',
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.125, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }, breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [53]),
  },
  {
    n: 41,
    id: 'saxophone-line-g',
    name: 'Saxophone after hours {G}',
    kind: 'pad',
    description:
      'A subtone tenor that is mostly breath, rising slowly from {G} to {C}, with dark repeats in a cathedral-sized hall.',
    preset: 'neon-rain-saxophone-after-hours',
    ...played(
      10,
      [
        [0, 2.2, 55],
        [2.3, 1.4, 57],
        [3.9, 3.2, 60],
      ],
      3,
    ),
  },
  // Textures: the rain, the weather over the towers and the air in the buildings.
  {
    n: 42,
    id: 'heavy-rain-on-roof-glass',
    name: 'Roof glass rain',
    kind: 'texture',
    description:
      'Heavy rain coming down steadily on a glass roof overhead, levelled by a limiter and set in a hall.',
    preset: 'neon-rain-roof-glass-rain',
    ...looped(8, 4, 2, [55]),
  },
  {
    n: 43,
    id: 'tenth-floor-window-rain',
    name: 'Tenth floor window rain',
    kind: 'texture',
    description:
      'Rain against a window many floors up, single drops over a hiss, glazed by early converters in a hall.',
    instrument: weather('Rain on the window', { density: 0.6 }),
    effects: [
      soften(14),
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 38, outputGain: -8 } },
      glaze,
      hall('Hall', 0.25),
    ],
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 44,
    id: 'thunder-behind-towers',
    name: 'Thunder past the towers',
    kind: 'texture',
    description:
      'Far thunder rolling behind the towers, one roll under the next, the top rolled off, in a ten-second space.',
    preset: 'neon-rain-thunder-past-the-towers',
    set: { width: 0.6 },
    then: [
      {
        deviceId: 'ambient-comp',
        params: { threshold: -50, ratio: 8, attack: 200, release: 2, makeup: 12 },
      },
    ],
    ...looped(16, 4, 3, [36, 43, 48, 53]),
  },
  {
    n: 45,
    id: 'cruiser-passes-over',
    name: 'Cruiser overhead',
    kind: 'texture',
    description:
      'Filtered noise sweeping up and back through a jet flanger, passing once across a huge space; it comes round.',
    preset: 'neon-rain-cruiser-overhead',
    ...cycled(12, [[0.4, 7, 31]]),
  },
  {
    n: 46,
    id: 'vent-shaft-air',
    name: 'Vent shaft air',
    kind: 'texture',
    description:
      'Wide bands of noise low down that drift in pitch, a rush of air up a shaft in a very large space.',
    preset: 'neon-rain-vent-shaft-drone',
    ...looped(8, 5, 3, [40, 47]),
  },
  {
    n: 47,
    id: 'steam-vent-low-breath',
    name: 'Steam vent breath',
    kind: 'texture',
    description:
      'Low flutes that are nearly all air, held close together and drifting in chorus in a very large space.',
    preset: 'neon-rain-steam-vent-breath',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 5, 3, [50, 53, 57]),
  },
  {
    n: 48,
    id: 'girder-wind-whistle',
    name: 'Wind through girders',
    kind: 'texture',
    description:
      'Noise through tuned bands that breathe slowly, air whistling through steel, lifted and left in a cathedral.',
    preset: 'neon-rain-wind-through-girders',
    set: { resonance: 20 },
    ...looped(8, 5, 3, [60, 67, 76]),
  },
  {
    n: 49,
    id: 'gutter-water-alley',
    name: 'Gutter water, alley',
    kind: 'texture',
    description:
      'Water running fast along a gutter, heard close by, glazed by early converters in a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Small stream',
      params: { density: 0.9, distance: 0.25, attack: 0.5, width: 0.7 },
    },
    effects: [glaze, hall('Hall', 0.3)],
    ...looped(8, 3, 2, [62]),
  },
  {
    n: 50,
    id: 'rain-as-grain-cloud',
    name: 'Rain as a grain cloud',
    kind: 'texture',
    description:
      'Heavy rain broken into a soft cloud of grains that fades in, in an ensemble chorus and a cathedral.',
    preset: 'neon-rain-grain-cloud-in-chorus',
    source: 'steady-downpour',
    then: [{ deviceId: 'ambient-eq', params: { lowCut: 60 } }],
    ...looped(8, 4, 2, [60]),
  },
  {
    n: 51,
    id: 'storm-drain-roar',
    name: 'Storm drain roar',
    kind: 'texture',
    description:
      'Fast water looped an octave down under a low-pass filter that opens and closes once a loop, in a huge space.',
    preset: 'neon-rain-octave-down-loop-pad',
    source: 'falls-in-a-gorge',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { cutoffHz: 900, resonance: 1.5, lfoAmount: 45, lfoRateHz: 0.125 },
      },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.75, decay: 14, mix: 0.4 } },
    ],
    ...looped(8, 5, 3, [60]),
  },
  {
    n: 52,
    id: 'oil-drum-fire',
    name: 'Oil drum fire',
    kind: 'texture',
    description:
      'A fire crackling over its own low roar, as if in an oil drum, softened in a small dark room.',
    instrument: weather('Hearth'),
    effects: [
      soften(12),
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 5000, mix: 0.3 } },
    ],
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 53,
    id: 'empty-channel-static',
    name: 'Empty channel static',
    kind: 'texture',
    description:
      'Radio static played back as the first samplers did, eight bits companded at a low rate, in a hall.',
    preset: 'neon-rain-first-sampler-keys',
    source: 'radio-between-stations',
    ...looped(8, 3, 2, [60]),
  },
  // One-shots: one bell, one chord, one string, struck once and left to the hall.
  {
    n: 54,
    id: 'tower-bell-struck-d',
    name: 'Tower bell, wet air {D}',
    kind: 'oneshot',
    description:
      'A heavy cast bell struck hard on {D} and left to ring, glazed, across a large modulated space.',
    preset: 'neon-rain-tower-bell-wet-air',
    // The strike on the node of the major third, the partials unstretched: every one a white key over D.
    set: { decay: 9, position: 0.667, stretch: 1, detune: 0 },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { jitter: 0.2 } },
      { deviceId: 'expanse', preset: 'Open space', params: { size: 0.8, decay: 6, mix: 0.3 } },
    ],
    ...played(9, [[0, 3, 50]], 2),
  },
  {
    n: 55,
    id: 'smog-gong-struck-f',
    name: 'Smog gong {F}',
    kind: 'oneshot',
    description:
      'A large gong struck on {F} with a slowed copy an octave under it, long and heavy in a hall.',
    preset: 'neon-rain-smog-gong',
    set: { decay: 8 },
    effects: [
      lift(9),
      { deviceId: 'half-speed', preset: 'Under the mix', params: { highCut: 1800, mix: 0.35 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 6, damping: 0.6, size: 1.8, mix: 0.35 },
      },
    ],
    ...played(9, [[0, 3, 53]], 2),
  },
  {
    n: 56,
    id: 'deep-bowl-struck-b',
    name: 'Deep bowl, long dark {B}',
    kind: 'oneshot',
    description:
      'A large FM bowl struck softly on a low {B} with the octave under it, long and dark in a cathedral.',
    preset: 'neon-rain-deep-bowl-long-dark',
    set: { decay: 8, release: 6 },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub2: 0, sub1: 0.5, dry: 1, up1: 0, up2: 0, filter: 16000 },
      },
      cathedral({ damping: 2000, mix: 0.4 }),
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(10, [[0, 3, 47]], 3),
  },
  {
    n: 57,
    id: 'steel-boom-struck-d',
    name: 'Slow steel boom {D}',
    kind: 'oneshot',
    description:
      'A steel pan struck firmly on {D} with a copy at half speed an octave down, a dark boom in a hall.',
    preset: 'neon-rain-slow-steel-boom',
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { highCut: 2500, spread: 0.4, mix: 0.55 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 5, damping: 0.55, size: 1.7, mix: 0.35 },
      },
    ],
    ...played(8, [[0, 3, 50]], 2),
  },
  {
    n: 58,
    id: 'tongue-drum-touched-a',
    name: 'Glazed tongue drum {A}',
    kind: 'oneshot',
    description:
      'A steel tongue drum touched softly on {A}, read through twelve-bit converters, in a hall.',
    preset: 'neon-rain-glazed-tongue-drum',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 10000, jitter: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
    ...played(6, [[0, 2, 57]], 1.5),
  },
  {
    n: 59,
    id: 'piano-toll-low-c',
    name: 'Low piano toll {C}',
    kind: 'oneshot',
    description:
      'One hard low {C} on the piano with a slowed copy an octave below it, tolling in a cathedral.',
    preset: 'neon-rain-low-piano-toll',
    effects: [
      lift(9),
      { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.15 } },
      cathedral({ mix: 0.3 }),
    ],
    ...played(8, [[0, 4, 36]], 2),
  },
  {
    n: 60,
    id: 'bare-piano-open-g',
    name: 'Bare piano, glazed {G}',
    kind: 'oneshot',
    description:
      'A bare {G}, its fifth and octave struck with a hard hammer, through twelve-bit converters into a hall.',
    preset: 'neon-rain-bare-piano-glazed',
    effects: [
      soften(9),
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 13000 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4, size: 1.5, mix: 0.35 } },
    ],
    ...played(
      6,
      [
        [0, 3, 43, 0.8],
        [0.01, 3, 50, 0.7],
        [0.02, 3, 55, 0.75],
      ],
      2,
    ),
  },
  {
    n: 61,
    id: 'old-upright-chord-am',
    name: 'Old upright {A}m',
    kind: 'oneshot',
    description:
      'An {A} minor chord on a piano with its unisons well out of tune, lightly flanged, alone in a cathedral.',
    preset: 'neon-rain-old-upright-new-city',
    effects: [
      soften(9),
      {
        deviceId: 'flanger',
        preset: 'Gentle sweep',
        params: { rate: 0.15, feedback: 15, mix: 0.22 },
      },
      cathedral({ mix: 0.4 }),
    ],
    ...played(
      7,
      [
        [0, 2.5, 45, 0.8],
        [0.01, 2.5, 52, 0.7],
        [0.02, 2.5, 57, 0.7],
        [0.03, 2.5, 60, 0.75],
        [0.04, 2.5, 64, 0.8],
      ],
      2,
    ),
  },
  {
    n: 62,
    id: 'window-keys-chord-dm9',
    name: 'Rainy window keys {D}m9',
    kind: 'oneshot',
    description:
      'A soft {D} minor ninth on the tine electric piano, through a two-voice chorus into a cathedral.',
    preset: 'neon-rain-rainy-window-keys',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.6, mix: 0.45 } },
      cathedral({ lowDecay: 6, midDecay: 7, damping: 4500, mix: 0.22 }),
    ],
    ...played(
      7,
      [
        [0, 1.5, 50],
        [0, 1.5, 65],
        [0, 1.5, 72],
        [0, 1.5, 76],
      ],
      2.5,
    ),
  },
  {
    n: 63,
    id: 'late-tines-chord-em7',
    name: 'Late shift tines {E}m7',
    kind: 'oneshot',
    description:
      'A low {E} minor seventh on dark, round tines in a deep slow chorus, levelled and left in a cathedral.',
    preset: 'neon-rain-late-shift-tines',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { depth: 60, feedback: 10, mix: 0.4 } },
      { deviceId: 'ambient-comp', preset: 'Keys' },
      cathedral({ mix: 0.28 }),
    ],
    ...played(
      7,
      [
        [0, 3, 40],
        [0, 3, 47],
        [0, 3, 55],
        [0, 3, 62],
      ],
      2.5,
    ),
  },
  {
    n: 64,
    id: 'lounge-tines-stab-g7',
    name: 'Lounge phaser tines {G}',
    kind: 'oneshot',
    description:
      'A barking {G} seventh stab on the tine electric piano, through a slow four-stage phaser in a hall.',
    preset: 'neon-rain-lounge-phaser-tines',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.18, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
    ...played(
      4,
      [
        [0, 1.2, 55, 0.9],
        [0.005, 1.2, 59, 0.85],
        [0.01, 1.2, 62, 0.85],
        [0.015, 1.2, 65, 0.9],
      ],
      1.5,
    ),
  },
  {
    n: 65,
    id: 'bell-tine-high-b',
    name: 'Bell tine, high {B}',
    kind: 'oneshot',
    description:
      'One high {B} that is all bell and little bark, doubled a few cents wide, ringing into a cathedral.',
    preset: 'neon-rain-bell-tine-echoes',
    effects: [{ deviceId: 'stereo-detune', preset: 'Classic' }, cathedral({ mix: 0.3 })],
    ...played(6, [[0, 1.5, 83]], 2),
  },
  {
    n: 66,
    id: 'operator-keys-chord-fmaj7',
    name: 'Clean operator keys {F}',
    kind: 'oneshot',
    description:
      'An {F} major seventh on the FM electric piano, clean and thin, in a two-voice chorus and a four-second hall.',
    preset: 'neon-rain-clean-operator-keys',
    effects: [
      soften(9),
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, depth: 50, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 4, midDecay: 4, mix: 0.4 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(
      5,
      [
        [0, 2, 53, 0.8],
        [0.005, 2, 57, 0.7],
        [0.01, 2, 60, 0.7],
        [0.015, 2, 64, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 67,
    id: 'advert-chime-passing-g',
    name: 'Advert chime {G}',
    kind: 'oneshot',
    description:
      'A clear FM bell on {G} whose repeats hop up an octave, heard over a small loudspeaker in a cathedral.',
    preset: 'neon-rain-advert-chime',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { feedback: 0.35, mix: 0.14 } },
      { deviceId: 'radio', preset: 'Clean transistor', params: { bandwidth: 0.8, mix: 0.7 } },
      cathedral({ mix: 0.4 }),
    ],
    ...played(7, [[0, 1, 79]], 2),
  },
  {
    n: 68,
    id: 'sign-sparkle-chord-am7',
    name: 'Shop sign sparkle {A}m7',
    kind: 'oneshot',
    description:
      'One quick strum of {A} minor seventh in random order over a soft pad of the same chord, glazed, in a plain hall.',
    preset: 'neon-rain-shop-sign-sparkle',
    ...played(
      8,
      [
        [0, 3, 57],
        [0, 3, 60],
        [0, 3, 64],
        [0, 3, 67],
      ],
      2.5,
    ),
  },
  {
    n: 69,
    id: 'sampled-bell-toy-a',
    name: 'First sampler bell {A}',
    kind: 'oneshot',
    description:
      'A glass bell on {A} played back as the first samplers did, eight bits companded at a low rate, in a hall.',
    preset: 'neon-rain-first-sampler-keys',
    source: 'glass-bell-a',
    set: { loop: 0, start: 0, end: 1 },
    ...played(6, [[0, 4, 60]], 2),
  },
  {
    n: 70,
    id: 'lobby-vibraphone-bar-g',
    name: 'Lobby vibraphone {G}',
    kind: 'oneshot',
    description:
      'One soft vibraphone bar on {G} with the pedal down, in a wide chorus on a long plate.',
    preset: 'neon-rain-lobby-vibraphone',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.5, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    ...played(7, [[0, 3, 67]], 2),
  },
  {
    n: 71,
    id: 'market-kalimba-tine-d',
    name: 'Night market kalimba {D}',
    kind: 'oneshot',
    description:
      'One thumb piano tine on {D} as an early sampler plays it back, grainy and narrow, in a hall.',
    preset: 'neon-rain-night-market-kalimba',
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.1, noise: 0.1 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
    ...played(4, [[0, 1.5, 74]], 1),
  },
  {
    n: 72,
    id: 'koto-pressed-up-e',
    name: 'Rising koto {E}',
    kind: 'oneshot',
    description:
      'A koto {E} pressed up a semitone to {F} after the pluck, grainy off an early sampler, in a hall.',
    preset: 'neon-rain-rising-koto-sampled',
    effects: [
      soften(12),
      {
        deviceId: 'patina',
        preset: 'Early sampler',
        params: { drive: 0.7, wobble: 0.05, wear: 0.1, noise: 0.08 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4, size: 1.4, mix: 0.35 } },
    ],
    ...played(6, [[0, 2.5, 64]], 2),
  },
  {
    n: 73,
    id: 'nylon-string-stairwell-g',
    name: 'Stairwell nylon {G}',
    kind: 'oneshot',
    description:
      'One {G} on a nylon-string guitar under the fingertip, in a two-voice chorus, small in a cathedral.',
    preset: 'neon-rain-stairwell-nylon',
    effects: [
      lift(5),
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, mix: 0.35 } },
      cathedral({ mix: 0.4 }),
    ],
    ...played(6, [[0, 3, 55]], 2),
  },
  {
    n: 74,
    id: 'twelve-string-open-c',
    name: 'Twelve string drizzle {C}',
    kind: 'oneshot',
    description:
      'A picked twelve-string on {C} and {G} in two octaves, doubled a few cents wide, with a faint echo in a hall.',
    preset: 'neon-rain-twelve-string-drizzle',
    set: { strum: 10 },
    effects: [
      soften(8),
      { deviceId: 'stereo-detune', preset: 'Classic', params: { mix: 0.3 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 340, feedback: 0.25, mix: 0.12 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4, size: 1.4, mix: 0.35 } },
    ],
    ...played(
      5,
      [
        [0, 4, 48],
        [0, 4, 55],
        [0, 4, 60],
        [0, 4, 67],
      ],
      1.5,
    ),
  },
  {
    n: 75,
    id: 'string-stab-am',
    name: 'Short string stab {A}m',
    kind: 'oneshot',
    description:
      'An {A} minor chord struck short on the string ensemble with a fast bow, ringing in a big hall.',
    preset: 'neon-rain-short-string-stabs',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { lowDecay: 4, midDecay: 4, mix: 0.4 } },
    ],
    ...played(
      4,
      [
        [0, 0.35, 57],
        [0, 0.35, 60],
        [0, 0.35, 64],
        [0, 0.35, 69],
      ],
      1.5,
    ),
  },
  // Phrases: a few notes in free time on the keys, the bars and the strings.
  {
    n: 76,
    id: 'mono-lead-climbs-am',
    name: 'Gliding mono lead {A}m',
    kind: 'melodic',
    description:
      'A one-voice lead sliding up through {A} minor and falling back to {A}, with chorused echoes in a cathedral.',
    preset: 'neon-rain-gliding-mono-lead',
    ...played(
      10,
      [
        [0, 0.8, 57],
        [1.07, 0.6, 60],
        [1.93, 1.5, 64],
        [4.11, 0.7, 62],
        [5.02, 2.2, 57],
      ],
      2.5,
    ),
  },
  {
    n: 77,
    id: 'night-lead-steps-e',
    name: 'Night brass lead {E}',
    kind: 'melodic',
    description:
      'A one-voice brass lead with a quick attack, from {E} up to {B}, down to {A} and home, with tape repeats in a cathedral.',
    preset: 'neon-rain-bending-night-lead',
    set: { ampAttack: 0.01, filterAttack: 0.05 },
    ...played(
      10,
      [
        [0, 1, 64],
        [1.31, 0.9, 71],
        [2.57, 0.6, 69],
        [3.52, 2.6, 64],
      ],
      3,
    ),
  },
  {
    n: 78,
    id: 'far-voice-line-am',
    name: 'Wordless voice, far {A}m',
    kind: 'melodic',
    description:
      'One high voice with no words on five notes of {A} minor, each sung plainly, with dark repeats in a cathedral.',
    preset: 'neon-rain-wordless-voice-far',
    set: { vibrato: 12, attack: 0.04 },
    ...played(
      10,
      [
        [0, 1, 69],
        [1.33, 0.7, 72],
        [2.21, 1.4, 71],
        [4.07, 0.8, 67],
        [5.04, 2.2, 69],
      ],
      2.5,
    ),
  },
  {
    n: 79,
    id: 'glitter-run-rises-c',
    name: 'Neon glitter run {C}',
    kind: 'melodic',
    description:
      'Three hard bright chime bars rising through {C} major, each coming back as quick rising octaves, into a cathedral.',
    preset: 'neon-rain-neon-glitter-bars',
    ...played(
      8,
      [
        [0, 0.6, 76],
        [1.37, 0.6, 79],
        [2.95, 0.8, 84],
      ],
      2.5,
    ),
  },
  {
    n: 80,
    id: 'piano-shadow-round-c',
    name: 'Piano, string shadow {C}',
    kind: 'melodic',
    description:
      'A felted piano moving from {C} to {F} and back, a quiet string section rising behind each chord; it comes round.',
    preset: 'neon-rain-piano-string-shadow',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...cycled(12, [
      [0.02, 2, 48, 0.7],
      [0.06, 2, 55, 0.6],
      [1.93, 1.5, 64, 0.7],
      [3.31, 2, 67, 0.6],
      [6.12, 2, 53, 0.7],
      [6.17, 2, 60, 0.6],
      [7.88, 1.5, 69, 0.7],
      [9.43, 2, 64, 0.6],
    ]),
  },
  {
    n: 81,
    id: 'hammered-wire-phrase-d',
    name: 'Hammered wire {D}',
    kind: 'melodic',
    description:
      'A hammered dulcimer rolled in octaves on {D}, {A}, {G} and {D} so each held note shimmers, in a cathedral.',
    preset: 'neon-rain-hammered-wire-shimmer',
    ...played(
      9,
      [
        [0, 1.6, 62],
        [1.71, 1.2, 69],
        [2.93, 2.2, 67],
        [5.21, 1.6, 62],
      ],
      2,
    ),
  },
  {
    n: 82,
    id: 'window-keys-round-dm',
    name: 'Rainy window round {D}m',
    kind: 'melodic',
    description:
      'Seven notes of {D} minor on the tine electric piano, opening upward and falling back; it comes round.',
    preset: 'neon-rain-rainy-window-keys',
    ...cycled(8, [
      [0.02, 1.4, 50],
      [0.71, 1.2, 57],
      [1.33, 1.4, 65],
      [2.47, 1.8, 64],
      [4.12, 1.2, 60],
      [5.03, 1.6, 57],
      [6.31, 1.2, 52],
    ]),
  },
  {
    n: 83,
    id: 'headlights-round-g',
    name: 'Passing headlights {G}',
    kind: 'melodic',
    description:
      'Five notes of {G} sixth on tines that cross from side to side three times a loop, glazed, in a hall.',
    preset: 'neon-rain-passing-headlights',
    set: { tremoloRate: 0.375 },
    ...cycled(8, [
      [0.02, 2, 67],
      [1.21, 1.6, 71],
      [2.59, 2.2, 76],
      [4.83, 2, 74],
      [6.07, 1.4, 71],
    ]),
  },
  {
    n: 84,
    id: 'lounge-lick-g',
    name: 'Lounge phaser lick {G}',
    kind: 'melodic',
    description:
      'A short lick in {G} with the flat seventh on barking tines, through a slow phaser, a short tape echo and a hall.',
    preset: 'neon-rain-lounge-phaser-tines',
    ...played(
      8,
      [
        [0, 0.5, 62],
        [0.52, 0.4, 65],
        [0.93, 1.1, 67],
        [2.41, 0.5, 65],
        [3.07, 0.3, 62],
        [3.38, 2, 55],
      ],
      2.5,
    ),
  },
  {
    n: 85,
    id: 'operator-keys-round-fmaj7',
    name: 'Operator keys round {F}',
    kind: 'melodic',
    description:
      'An arpeggio of {F} major seventh on the FM electric piano that opens upward and steps back; it comes round.',
    preset: 'neon-rain-clean-operator-keys',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...cycled(8, [
      [0.02, 1.2, 53],
      [0.47, 1.2, 60],
      [1.03, 1.4, 64],
      [1.71, 2, 69],
      [3.56, 1.2, 67],
      [4.38, 1.4, 64],
      [5.81, 1.6, 60],
    ]),
  },
  {
    n: 86,
    id: 'apartment-piano-fall-em',
    name: 'Apartment piano {E}m',
    kind: 'melodic',
    description:
      'A close felted piano falling through {E} minor to a low {E}, on quarter-inch tape with a faint echo and a hall.',
    preset: 'neon-rain-apartment-piano',
    ...played(
      10,
      [
        [0, 1.6, 76],
        [1.18, 1.3, 71],
        [2.09, 1.7, 67],
        [3.62, 2.6, 64, 0.5],
        [3.66, 2.6, 52, 0.5],
      ],
      2.5,
    ),
  },
  {
    n: 87,
    id: 'soft-pedal-round-am',
    name: 'Soft pedal, far hall {A}',
    kind: 'melodic',
    description:
      'Two soft fifths, on {A} then on {F}, each answered higher up, under the soft pedal in a huge space; it comes round.',
    preset: 'neon-rain-soft-pedal-far-hall',
    ...cycled(12, [
      [0.02, 2.5, 57, 0.8],
      [0.07, 2.5, 64, 0.7],
      [2.61, 2, 72],
      [4.33, 2.4, 71],
      [6.94, 2.5, 53, 0.8],
      [6.99, 2.5, 60, 0.7],
      [9.37, 2.2, 69],
    ]),
  },
  {
    n: 88,
    id: 'nylon-fall-over-c',
    name: 'Stairwell nylon fall {C}',
    kind: 'melodic',
    description:
      'A nylon-string guitar over a low {C}, stepping down from {G} to {C} in a two-voice chorus in a cathedral.',
    preset: 'neon-rain-stairwell-nylon',
    effects: [
      soften(9),
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, mix: 0.35 } },
      cathedral({ mix: 0.4 }),
    ],
    ...played(
      9,
      [
        [0, 2.2, 48],
        [0.41, 1.4, 67],
        [1.27, 1.2, 64],
        [2.03, 1.6, 62],
        [3.44, 2.6, 60],
        [3.49, 2.6, 52],
      ],
      2.5,
    ),
  },
  {
    n: 89,
    id: 'chorus-guitar-round-am',
    name: 'Chorus guitar round {A}m',
    kind: 'melodic',
    description:
      'A slow arpeggio of {A} minor with its ninth on a clean guitar in chorus, with dark repeats; it comes round.',
    preset: 'neon-rain-clean-chorus-guitar',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 0.7, mix: 0.45 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 390, feedback: 0.25, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
    ...cycled(8, [
      [0.02, 3, 45],
      [0.59, 2, 52],
      [1.23, 2, 59],
      [1.97, 2.4, 60],
      [3.71, 2, 64],
      [4.63, 2, 59],
      [5.57, 2, 57],
    ]),
  },
  {
    n: 90,
    id: 'harp-rolled-up-c',
    name: 'Atrium harp sweep {C}',
    kind: 'melodic',
    description:
      'A concert harp rolled up through {C} major by hand, slowing as it climbs, then one high {C}, in a cathedral.',
    preset: 'neon-rain-atrium-harp-sweep',
    set: { sweep: 0 },
    ...played(
      9,
      [
        [0, 3, 48],
        [0.13, 3, 55],
        [0.28, 3, 60],
        [0.45, 3, 64],
        [0.65, 3, 67],
        [0.89, 3, 72],
        [1.18, 3, 76],
        [1.53, 3, 79],
        [3.87, 3, 84],
      ],
      2.5,
    ),
  },
  {
    n: 91,
    id: 'market-kalimba-round-dm',
    name: 'Night market round {D}m',
    kind: 'melodic',
    description:
      'A thumb piano pattern in {D} minor off an early sampler, its repeats jumping a fifth, in a hall; it comes round.',
    preset: 'neon-rain-night-market-kalimba',
    effects: [
      {
        deviceId: 'patina',
        preset: 'Early sampler',
        params: { wear: 0.1, wobble: 0.1, noise: 0.1 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Fifth hop',
        params: { time: 360, feedback: 0.3, intervalB: 0, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.4 } },
    ],
    ...cycled(8, [
      [0.02, 1, 62],
      [0.61, 0.8, 69],
      [1.13, 0.8, 65],
      [2.04, 1, 67],
      [3.27, 0.8, 62],
      [3.86, 0.8, 72],
      [4.49, 1, 69],
      [5.93, 1, 64],
    ]),
  },
  {
    n: 92,
    id: 'elevator-round-am9',
    name: 'Elevator round {A}m9',
    kind: 'melodic',
    description:
      'Six soft FM mallet notes of {A} minor ninth under a tremolo that leans side to side, on a plate; it comes round.',
    preset: 'neon-rain-elevator-vibes',
    effects: [
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 2.625, depth: 0.4, phase: 120 },
      },
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 12000, jitter: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
    ...cycled(8, [
      [0.02, 2, 57],
      [0.83, 1.6, 64],
      [1.52, 2, 67],
      [2.91, 2.4, 72],
      [4.67, 1.8, 71],
      [5.74, 1.6, 67],
    ]),
  },
  {
    n: 93,
    id: 'celesta-winds-down-c',
    name: 'Clockwork celesta {C}',
    kind: 'melodic',
    description:
      'A celesta winding down through {C} major and up again, with chorused echoes in a cathedral; it comes round.',
    preset: 'neon-rain-clockwork-celesta',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 360, feedback: 0.25, mix: 0.2 },
      },
      cathedral({ mix: 0.4 }),
    ],
    ...cycled(8, [
      [0.02, 1, 84],
      [0.37, 1, 79],
      [0.81, 1, 76],
      [1.49, 1.4, 72],
      [3.12, 1, 77],
      [3.53, 1, 81],
      [4.21, 1.6, 79],
      [5.87, 1.2, 74],
    ]),
  },
  {
    n: 94,
    id: 'glockenspiel-run-up-g',
    name: 'Glockenspiel run {G}',
    kind: 'melodic',
    description:
      'Four hard glockenspiel notes running up from {G}, coming back climbing by octaves and fifths, in a huge space.',
    preset: 'neon-rain-glockenspiel-run',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 180, repeats: 6, mix: 0.25 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.7, decay: 5, highCut: 9000, mix: 0.3 },
      },
    ],
    ...played(
      8,
      [
        [0, 0.5, 67],
        [0.31, 0.5, 72],
        [0.74, 0.5, 74],
        [1.33, 1, 79],
      ],
      2.5,
    ),
  },
  {
    n: 95,
    id: 'zither-haze-round-g',
    name: 'Zither in the haze {G}',
    kind: 'melodic',
    description:
      'Doubled courses picked in octaves up through {G} with the flat seventh, turned by a slow phaser; it comes round.',
    preset: 'neon-rain-zither-in-the-haze',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Hall',
        params: { decay: 8, size: 1.5, mix: 0.4, breathRate: 0.25 },
      },
    ],
    ...cycled(8, [
      [0.02, 3, 43],
      [0.87, 3, 50],
      [1.69, 3, 59],
      [2.83, 3, 62],
      [4.21, 3, 65],
      [5.47, 3, 60],
    ]),
  },
  {
    n: 96,
    id: 'pursuit-bass-round-dm',
    name: 'Night pursuit bass {D}',
    kind: 'melodic',
    description:
      'A snapping sawtooth bass line falling through {D} minor in free time, with bucket-brigade repeats; it comes round.',
    preset: 'neon-rain-night-pursuit-bass',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 370, feedback: 0.15, modRate: 0.625, mix: 0.15 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    set: { release: 0.6 },
    ...cycled(8, [
      [0.37, 1.3, 50],
      [1.93, 0.6, 57],
      [2.58, 0.9, 55],
      [3.62, 1.7, 53],
      [5.71, 0.4, 48],
      [6.2, 1.4, 45],
    ]),
    loopFold: 'power',
  },
  {
    n: 97,
    id: 'neon-drops-scatter-e',
    name: 'Rain on neon {E}',
    kind: 'melodic',
    description:
      'Short bright FM chimes falling from a high {E} like drops, scattered into grains an octave up, in a bright space.',
    preset: 'neon-rain-rain-on-neon',
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 260, spray: 0.3, feedback: 0.4, mix: 0.25 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { size: 0.7, decay: 5, highCut: 9000, mix: 0.3 },
      },
    ],
    ...played(
      8,
      [
        [0, 0.5, 88],
        [0.67, 0.4, 84],
        [1.09, 0.5, 81],
        [2.36, 0.4, 86],
        [2.71, 0.6, 79],
        [4.18, 0.8, 76],
      ],
      2.5,
    ),
  },
  {
    n: 98,
    id: 'console-thinks-c',
    name: 'Console beeps {C}',
    kind: 'melodic',
    description:
      'Six bright beeps on {C}, {G} and {F} that strike and hold, the tone changing by chance, echoing quickly in a hall.',
    preset: 'neon-rain-console-beeps',
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 12, outputGain: -2 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 180, feedback: 0.3, tone: 5000, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.45 } },
    ],
    ...played(
      8,
      [
        [0, 0.3, 84],
        [0.47, 0.2, 79],
        [1.31, 0.5, 89],
        [2.72, 0.2, 84],
        [3.09, 0.3, 91],
        [4.63, 0.6, 77],
      ],
      2.5,
    ),
  },
  {
    n: 99,
    id: 'tongue-drum-round-am',
    name: 'Tongue drum round {A}m',
    kind: 'melodic',
    description:
      'Soft hands circling a steel tongue drum in {A} minor, through twelve-bit converters, in a hall; it comes round.',
    preset: 'neon-rain-glazed-tongue-drum',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 10000, jitter: 0.2 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 400, feedback: 0.25, mix: 0.15 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.5, mix: 0.35 } },
    ],
    ...cycled(
      8,
      [
        [0.02, 1.5, 57],
        [0.73, 1, 64],
        [1.61, 1.2, 60],
        [2.94, 1.5, 62],
        [4.07, 1, 67],
        [4.88, 1.4, 64],
        [6.23, 1.2, 55],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 100,
    id: 'balcony-chimes-stirred-am',
    name: 'Balcony wind chimes {A}m',
    kind: 'melodic',
    description:
      'Wind chimes tuned to {A} minor stirred by a gusting breeze, with dark repeats in a plain hall, dying away.',
    preset: 'neon-rain-balcony-wind-chimes',
    then: [narrow],
    ...played(
      12,
      [
        [0, 8, 69],
        [0, 8, 72],
        [0, 8, 76],
      ],
      3,
    ),
  },
])
