// The sounds of the pack "Far North Bowed Guitar": its presets played, a hundred sounds to
// paint with. Numbers 15001 to 15100.

import { type PatchDevice } from '../../../core/devices/patch'
import { PRESETS } from '../packs/far-north'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn } from './recipe'

// Holds a level that wanders by a dB or two (a reverb that turns, a breath, a slow chorus), so
// what is held is heard as a drone and not as a pad.
const level: PatchDevice = {
  deviceId: 'ambient-comp',
  params: { threshold: -60, ratio: 8, attack: 20, release: 0.15, knee: 6, tails: 1, makeup: 24 },
}

// Takes a strike down towards the ring behind it: a struck note that is one tall peak over a
// quiet body comes out quiet once the sound is brought to the bank's peak.
const lift = (gain: number): PatchDevice => ({
  deviceId: 'ambient-limiter',
  preset: 'Pinned',
  params: { gain, release: 0.3, ride: 0 },
})

// Brings what a wide space puts to the sides back towards the middle, so the sound holds in mono.
const narrow = (width: number): PatchDevice => ({ deviceId: 'stereo-widener', params: { width } })

export const SOUNDS: readonly FactorySound[] = packSounds('far-north', 15000, PRESETS, [
  // Drones: one bowed, blown or pumped note, or a note with its octave or fifth, held level.
  {
    n: 1,
    id: 'lava-field-drone-a',
    name: 'Lava field drone {A}',
    kind: 'drone',
    description:
      'A low {A} and its octave bowed hard into a fuzz with an octave under them, in a cathedral.',
    preset: 'far-north-lava-field-drone',
    // The two strings a few cents apart beat slowly through the fuzz: tuned together they hold still.
    set: { detune: 0 },
    ...looped(8, 7, 3, [45, 57]),
    tuning: 'whole-cycles',
    then: [level, quarterTurn(8)],
  },
  {
    n: 2,
    id: 'mutes-on-drone-e',
    name: 'Mutes on drone {E}',
    kind: 'drone',
    description:
      'Two muted bows an octave apart on {E} with no vibrato, in a hall that sings back.',
    preset: 'far-north-mutes-on',
    // One player a note: four beat against each other and swell.
    set: { players: 1 },
    ...looped(8, 6, 3, [40, 52]),
    tuning: 'whole-cycles',
    then: [level, quarterTurn(8)],
  },
  {
    n: 3,
    id: 'pump-organ-drone-g',
    name: 'Pump organ drone {G}',
    kind: 'drone',
    description: 'A reedy {G} with its fifth and octave on a pump organ, close, in an empty room.',
    preset: 'far-north-pedals-and-bellows',
    // The bellows worked evenly, so the level holds.
    set: { bellows: 0.3 },
    ...looped(8, 4, 3, [43, 50, 55]),
    then: [level],
  },
  {
    n: 4,
    id: 'tubas-in-the-fog-f',
    name: 'Tubas in the fog {F}',
    kind: 'drone',
    description:
      'Tubas holding a low {F} and the {C} over it through a transformer, in a long room.',
    preset: 'far-north-tubas-in-the-fog',
    set: { section: 0 },
    ...looped(8, 7, 3, [41, 48]),
    then: [level],
  },
  {
    n: 5,
    id: 'bass-clarinet-growl-c',
    name: 'Bass clarinet growl {C}',
    kind: 'drone',
    description:
      'One low {C} blown hard on a bass clarinet with a growl in the reed, in a cathedral.',
    preset: 'far-north-bass-clarinet-growl',
    // A little less growl than the preset: five keys down it was more rasp than note.
    set: { growl: 0.28 },
    ...looped(8, 5.5, 2, [48]),
    tuning: 'whole-cycles',
    then: [quarterTurn(8)],
  },
  {
    n: 6,
    id: 'midnight-sun-drone-f',
    name: 'Midnight sun drone {F}',
    kind: 'drone',
    description:
      'A just major chord of partials on {F} with air around it, an octave climbing in its reverb.',
    preset: 'far-north-sun-at-midnight',
    // The partials held where they are: wandering, the chord is a pad.
    set: { movement: 0, air: 0.15, width: 0.3 },
    ...looped(8, 7, 3, [53]),
    tuning: 'whole-cycles',
    then: [level, narrow(0.35), quarterTurn(8)],
  },
  {
    n: 7,
    id: 'ground-under-ice-b',
    name: 'Ground under ice {B}',
    kind: 'drone',
    description:
      'Low octaves of {B} over a heavy sub, growling through a dark fuzz in a small room.',
    preset: 'far-north-ground-under-the-ice',
    // The partials held where they are: wandering, the octaves are a pad in some keys.
    set: { movement: 0 },
    ...looped(8, 7, 3, [47]),
    tuning: 'whole-cycles',
    // The fuzz alone is nearly a square wave, and loud: turned slowly in phase it stands taller and quieter.
    then: [level, quarterTurn(8)],
  },
  {
    n: 8,
    id: 'fuzz-under-the-floor-a',
    name: 'Fuzz under the floor {A}',
    kind: 'drone',
    description: 'A held bass {A} with two oscillators beating, rasping through a fuzz, in a hall.',
    preset: 'far-north-fuzz-under-the-floor',
    // More of the hall than the preset has: the fuzz alone is a square wave, loud and in the middle.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.7, push: 1, lowCut: 40, highCut: 4500, output: -8 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.55 } },
    ],
    ...looped(8, 4, 3, [45]),
    then: [level],
  },
  {
    n: 9,
    id: 'driven-drone-strings-a',
    name: 'Driven drone strings {A}',
    kind: 'drone',
    description:
      'Four rasping drone strings on {A} and {E} plucked in turn and driven until they run together.',
    preset: 'far-north-drone-strings-driven',
    // Twelve plucks to the loop, and each pluck held down to the level of the strings still ringing.
    set: { speed: 2.698 },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } },
      {
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
      },
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.55, output: 1.8 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, mix: 0.4 } },
    ],
    ...looped(8, 10.77, 0.45, [57]),
    then: [level],
  },
  {
    n: 10,
    id: 'plastic-organ-drone-f',
    name: 'Plastic organ drone {F}',
    kind: 'drone',
    description:
      'A square-wave organ on {F} and {C} over its sub octave through a slowly turning speaker.',
    preset: 'far-north-plastic-organ-rotor',
    ...looped(8, 4, 3, [53, 60]),
    tuning: 'whole-cycles',
    then: [level, quarterTurn(8)],
  },
  {
    n: 11,
    id: 'close-bows-drone-c',
    name: 'Close bows drone {C}',
    kind: 'drone',
    description: 'Two close bows holding {C} and {G} with rosin in the sound, on a small plate.',
    preset: 'far-north-four-bows-close',
    ...looped(8, 3, 3, [48, 55]),
    then: [level, { deviceId: 'fet-limiter', params: { inputGain: 30, outputGain: -12 } }],
  },
  {
    n: 12,
    id: 'every-rank-drawn-c',
    name: 'Every rank drawn {C}',
    kind: 'drone',
    description: 'The full organ on {C} and {G} in three octaves, spread wide down a cathedral.',
    preset: 'far-north-every-rank-drawn',
    // Not as wide as the preset: at its width the sound thins out in mono.
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.75 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { lowDecay: 8, mix: 0.5 } },
    ],
    ...looped(8, 6, 3, [36, 48, 55, 60]),
    then: [level],
  },
  {
    n: 13,
    id: 'reeds-through-valves-d',
    name: 'Reeds through valves {D}',
    kind: 'drone',
    description:
      'A harmonium on {D}, {A} and the {D} above pushed into a triode until the reeds growl.',
    preset: 'far-north-reeds-through-valves',
    set: { celeste: 0 },
    ...looped(8, 6, 3, [50, 57, 62]),
    tuning: 'whole-cycles',
    then: [level, quarterTurn(8)],
  },
  {
    n: 14,
    id: 'held-chord-sparkle-d',
    name: 'Held chord sparkle {D}',
    kind: 'drone',
    description:
      'A chord of {D}, {A} and {E} held as a soft organ tone in a slow chorus, in a cathedral.',
    preset: 'far-north-held-chord-sparkle',
    ...looped(8, 5, 3, [50, 57, 64, 69]),
    then: [level],
  },
  {
    n: 15,
    id: 'reeds-no-bellows-a',
    name: 'Reeds, no bellows {A}',
    kind: 'drone',
    description:
      'A reed tone held on {A} in two octaves with no bellows behind it, from a worn cassette.',
    preset: 'far-north-reeds-without-bellows',
    // The table held still, its two oscillators in tune, and a cassette less worn than the preset's:
    // the beating was a pad in some keys and the drop-outs were heard as notes.
    set: { motion: 0, detune: 0 },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Worn cassette',
        params: { wear: 0.15, wobble: 0.3, noise: 0.3, output: -5 },
      },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...looped(8, 3, 3, [45, 57]),
    tuning: 'whole-cycles',
    // Widened last: with the oscillators in tune the reeds sit dead in the middle.
    then: [level, quarterTurn(8), { deviceId: 'stereo-widener', preset: 'Wide' }],
  },

  // Pads: chords that swell, beat or turn slowly.
  {
    n: 16,
    id: 'bow-on-steel-d',
    name: 'Bow on steel {D}',
    kind: 'pad',
    description:
      'A low {D}, its octave and fifth drawn slowly on guitar strings through a hot stack; it comes round.',
    preset: 'far-north-bow-on-steel',
    // Each stroke of the bow starts in the middle of the loop and is still sounding where it comes round.
    ...cycled(
      8,
      [
        [3.4, 5.2, 38, 0.8],
        [3.9, 4.9, 50, 0.75],
        [4.6, 4.4, 57, 0.7],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
    then: [narrow(0.4)],
  },
  {
    n: 17,
    id: 'trebles-in-the-loft-e',
    name: 'Trebles in the loft {E}',
    kind: 'pad',
    description:
      'Two children on an open ah on {E} an octave apart, swelling once each pass, in a cathedral.',
    preset: 'far-north-trebles-in-the-loft',
    // One voice a note: a section beats deeply enough to be heard as notes.
    set: { ensemble: 0 },
    ...looped(8, 6, 3, [64, 76]),
    // Held level, then swelled by hand: the voices' own drift is a drone in one key and a pad in the next.
    then: [level, breathe(0.125, 0.65)],
  },
  {
    n: 18,
    id: 'far-rotor-flutes-c',
    name: 'Far rotor flutes {C}',
    kind: 'pad',
    description:
      'Soft flute pipes on {C} and {G} through a slowly rotating speaker, swelling once a pass.',
    preset: 'far-north-far-rotor-flutes',
    // The speaker alone, without the preset's plate: in the low keys its tail left more at the sides
    // than in the middle. Held level, then swelled by hand: the rotor is a drone in one key and a pad in the next.
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
    ...looped(8, 4, 3, [60, 67]),
    tuning: 'whole-cycles',
    then: [
      level,
      breathe(0.125, 0.6),
      quarterTurn(8),
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
    ],
  },
  {
    n: 19,
    id: 'amp-begins-to-sing-c',
    name: 'Amp begins to sing {C}',
    kind: 'pad',
    description:
      'A {C} and its fifth held on sustained strings as the amplifier feeds back, through a spring.',
    preset: 'far-north-amp-begins-to-sing',
    // Lower than the instrument is usually played: from E up the feedback catches in jumps heard as notes.
    set: { vibrato: 0.05 },
    // The space narrower than the preset has it: at full width the sound thins out in mono.
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -1 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3, width: 0.5 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4, width: 0.5 } },
    ],
    ...looped(8, 7, 3, [48, 55]),
    // A slow swell over it, once a pass: held, the feedback is nearly level, a drone in one key
    // and a pad in the next.
    then: [breathe(0.125, 0.45)],
  },
  {
    n: 20,
    id: 'low-reeds-beating-f',
    name: 'Low reeds beating {F}',
    kind: 'pad',
    description:
      'Two low reed ranks on {F} and {C} tuned apart so they beat, in a room that breathes.',
    preset: 'far-north-low-reeds-beating',
    // The room breathes once a loop and the shifter beats three times in it, so the loop comes round.
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.375, lfoRate: 0.125, mix: 0.35 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 14, breathRate: 0.125, mix: 0.45 },
      },
    ],
    ...looped(8, 6, 3, [41, 48]),
  },
  {
    n: 21,
    id: 'old-men-humming-g',
    name: 'Old men humming {G}',
    kind: 'pad',
    description:
      'Low men humming {G} and {D} out of a kitchen radio, rising and falling once a pass, in a hall.',
    preset: 'far-north-old-men-humming',
    // One singer a note: a section beats deeply enough to be heard as notes. The radio's fading
    // is random and was heard as notes too: it is off, and a slow swell stands in for it.
    set: { ensemble: 0 },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Kitchen radio',
        params: { static: 0.05, bandwidth: 0.5, fading: 0, drift: 0, interference: 0 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.5 } },
    ],
    ...looped(8, 5, 3, [55, 62]),
    then: [level, breathe(0.125, 0.6)],
  },
  {
    n: 22,
    id: 'plain-wire-d',
    name: 'Plain wire {D}',
    kind: 'pad',
    description:
      'Four plain strings on {D} and {A}, each pluck turned down, in a hall humming a low oh.',
    preset: 'far-north-plain-wire',
    // One round of the four strings to the loop; the loop starts just after the seventh pluck.
    set: { speed: 8.094, decay: 12 },
    ...looped(8, 12.07, 0.45, [50]),
  },
  {
    n: 23,
    id: 'magnet-and-string-am',
    name: 'Magnet and string {A}m',
    kind: 'pad',
    description:
      'An {A} minor chord held singing by a sustainer, doubled by backwards swells of itself.',
    preset: 'far-north-magnet-and-string',
    ...looped(8, 7, 3, [45, 52, 60, 64]),
    // Narrowed: the long nave puts as much to the sides as to the middle. A slow swell over it,
    // once a pass: in some keys the swells alone hold nearly level.
    then: [narrow(0.35), breathe(0.125, 0.4)],
  },
  {
    n: 24,
    id: 'whiteout-swell-fmaj7',
    name: 'Whiteout swell {F}maj7',
    kind: 'pad',
    description:
      'An {F} major seventh faded in so no pick is heard, its reverb climbing; it comes round.',
    preset: 'far-north-whiteout-swell',
    ...cycled(8, [
      [0, 7.4, 53, 0.8],
      [0.35, 7, 60, 0.7],
      [0.8, 6.6, 64, 0.7],
      [1.4, 6, 69, 0.65],
    ]),
  },
  {
    n: 25,
    id: 'pipes-in-reverse-g',
    name: 'Pipes in reverse {G}',
    kind: 'pad',
    description:
      'Slow pipes on {G} and {D} turned backwards in overlapping swells, five to the loop.',
    preset: 'far-north-pipes-in-reverse',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.5 } },
    ],
    ...looped(8, 8, 3, [43, 55, 62, 67]),
  },
  {
    n: 26,
    id: 'words-turned-round-a',
    name: 'Words turned round {A}',
    kind: 'pad',
    description:
      'High voices on {A} and {E} whose drifting vowels come back reversed, in a soft hall.',
    preset: 'far-north-words-turned-round',
    // The reversed pieces a second long, eight to the loop, and their edges rounded off.
    set: { ensemble: 0.3 },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 1000, smooth: 1, mix: 0.6 },
      },
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
    ],
    ...looped(8, 5, 3, [57, 64, 69]),
  },
  {
    n: 27,
    id: 'horns-from-nothing-f',
    name: 'Horns from nothing {F}',
    kind: 'pad',
    description:
      'French horns on a chord of {F} arriving over seconds and leaving again; it comes round.',
    preset: 'far-north-horns-from-nothing',
    ...cycled(
      8,
      [
        [0, 4.6, 41, 0.8],
        [0.2, 4.6, 48, 0.75],
        [0.5, 4.4, 57, 0.7],
        [0.9, 4.2, 60, 0.7],
      ],
      { passes: 2, crossfadeSec: 2 },
    ),
    loopFold: 'power',
    then: [narrow(0.3)],
  },
  {
    n: 28,
    id: 'mutes-on-swell-em',
    name: 'Mutes on swell {E}m',
    kind: 'pad',
    description:
      'Muted strings holding {E} minor without vibrato, swelling in and out again once a pass.',
    preset: 'far-north-mutes-on',
    // Held and swelled by hand, two players a note: the preset's own swell, and four players
    // beating, were heard as notes in the high keys.
    set: { players: 2 },
    ...looped(8, 6, 3, [52, 59, 64, 67]),
    then: [breathe(0.125, 0.7)],
  },
  {
    n: 29,
    id: 'quartet-going-flat-d',
    name: 'Quartet going flat {D}',
    kind: 'pad',
    description:
      'Slow bows on {D} and {A}, then {F} and {C}, sagging on a reel that will not hold its speed.',
    preset: 'far-north-quartet-going-flat',
    // Slower bows than the preset's, each pair together: a bow that comes in alone is heard as a note.
    set: { attack: 2.5 },
    // The reel sags as the preset's does but hardly drops out: a drop-out is heard as a note too.
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.8, hiss: 0.1, age: 0.1 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    // The loop starts while the second pair is held, not where it is let go.
    ...cycled(
      8,
      [
        [1.5, 4.6, 50, 0.8],
        [1.5, 4.6, 57, 0.75],
        [4.9, 5, 53, 0.75],
        [4.9, 5, 60, 0.7],
      ],
      { crossfadeSec: 1.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 30,
    id: 'strings-at-the-top-c',
    name: 'Strings at the top {C}',
    kind: 'pad',
    description:
      'Two players a note high on a chord of {C} with a wide vibrato, in a cathedral; it comes round.',
    preset: 'far-north-strings-at-the-top',
    // Two players a note, not the preset's six: so many so high beat into notes in some keys.
    set: { players: 2 },
    ...cycled(
      8,
      [
        [0, 6.4, 72, 0.8],
        [0.3, 6.2, 76, 0.7],
        [0.7, 6, 79, 0.7],
        [1.3, 5.6, 84, 0.65],
      ],
      { crossfadeSec: 1.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 31,
    id: 'sky-curtains-c',
    name: 'Sky curtains {C}',
    kind: 'pad',
    description:
      'A brass and string pad on a chord of {C} that swells while it is held; it comes round.',
    preset: 'far-north-sky-curtains',
    ...cycled(
      8,
      [
        [0, 5.2, 48, 0.8],
        [0.1, 5.2, 55, 0.75],
        [0.6, 4.8, 60, 0.7],
        [1.1, 4.4, 64, 0.65],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 32,
    id: 'green-light-brass-f',
    name: 'Green light brass {F}',
    kind: 'pad',
    description:
      'Synthesiser brass on a chord of {F}, then {C}, the filter opening as each one speaks.',
    preset: 'far-north-brass-in-green-light',
    set: { attack: 1.6 },
    ...cycled(
      8,
      [
        [0, 3.8, 53, 0.8],
        [0, 3.8, 60, 0.75],
        [0, 3.8, 69, 0.7],
        [4.1, 3.5, 48, 0.8],
        [4.1, 3.5, 60, 0.75],
        [4.1, 3.5, 67, 0.7],
      ],
      { crossfadeSec: 1.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 33,
    id: 'village-band-f',
    name: 'Village band {F}',
    kind: 'pad',
    description:
      'A small brass band at full breath on a chord of {F}, then {C}, in a hall; it comes round.',
    preset: 'far-north-village-band',
    // A smaller section than the preset's and no vibrato: the full one beats into notes in the high keys.
    set: { section: 0.4, vibrato: 0 },
    ...cycled(
      8,
      [
        [0, 3.4, 41, 0.8],
        [0, 3.4, 53, 0.8],
        [0, 3.4, 60, 0.75],
        [0, 3.4, 69, 0.75],
        [4.1, 3.2, 48, 0.8],
        [4.1, 3.2, 55, 0.8],
        [4.1, 3.2, 64, 0.75],
        [4.1, 3.2, 67, 0.75],
      ],
      { crossfadeSec: 0.5 },
    ),
    loopFold: 'power',
  },
  {
    n: 34,
    id: 'long-blue-hour-a',
    name: 'Long blue hour {A}',
    kind: 'pad',
    description:
      'The chorus polysynth on {A} and {E} in two octaves, slow to speak and slow to go; it comes round.',
    preset: 'far-north-long-blue-hour',
    ...cycled(
      8,
      [
        [0, 4.5, 45, 0.8],
        [0.2, 4.5, 52, 0.75],
        [0.7, 4.2, 57, 0.7],
        [1.3, 3.8, 64, 0.7],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 35,
    id: 'cloud-coming-in-g',
    name: 'Cloud coming in {G}',
    kind: 'pad',
    description:
      'Two saws an octave apart with air in them on {G} and {D}, slow to arrive; it comes round.',
    preset: 'far-north-cloud-coming-in',
    // Half the bloom of the preset: at full bloom the pieces of the halo were heard as notes in some keys.
    effects: [
      {
        deviceId: 'bloom-reverb',
        preset: 'Octave halo',
        params: { bloom: 0.5, decay: 5, width: 0.4, mix: 0.4 },
      },
    ],
    ...cycled(
      8,
      [
        [0, 6, 43, 0.8],
        [0, 6, 55, 0.75],
        [0, 6, 62, 0.7],
        [0, 6, 67, 0.7],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 36,
    id: 'ice-forming-e',
    name: 'Ice forming {E}',
    kind: 'pad',
    description:
      'A glass tone on {E} and {B} that takes three seconds to form, in a very large space.',
    preset: 'far-north-ice-forming',
    // The operator pairs nearly in tune and the root an octave under the others: at the preset's
    // detune, or with the fifth close over the root, the partials beat into notes in the high keys.
    set: { detune: 3 },
    ...cycled(
      8,
      [
        [3, 6, 52, 0.8],
        [4.3, 5, 71, 0.7],
        [5.9, 4, 76, 0.7],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 37,
    id: 'wet-finger-glasses-g',
    name: 'Wet finger glasses {G}',
    kind: 'pad',
    description: 'Wine glasses rubbed at the rim on a chord of {G}, beating gently, in a hall.',
    preset: 'far-north-wet-finger-glasses',
    ...cycled(8, [
      [0, 6.2, 67, 0.8],
      [0.9, 5.6, 71, 0.7],
      [1.9, 5, 74, 0.7],
      [3.2, 4, 79, 0.65],
    ]),
    then: [narrow(0.3)],
  },
  {
    n: 38,
    id: 'strum-that-stays-c',
    name: 'Strum that stays {C}',
    kind: 'pad',
    description: 'An open chord of {C} strummed slowly and caught as a pad that hangs under it.',
    preset: 'far-north-strum-that-stays',
    ...played(
      12,
      [
        [0, 5, 48, 0.8],
        [0, 5, 55, 0.75],
        [0, 5, 60, 0.75],
        [0, 5, 64, 0.7],
        [0, 5, 67, 0.7],
        [0, 5, 72, 0.7],
      ],
      3,
    ),
    then: [narrow(0.35)],
  },
  {
    n: 39,
    id: 'choir-never-breathing-f',
    name: 'Choir never breathing {F}',
    kind: 'pad',
    description:
      'A wavetable moving through vowel shapes once a loop on a chord of {F}, in a cathedral.',
    preset: 'far-north-choir-never-breathing',
    set: { rate: 0.125 },
    ...cycled(
      8,
      [
        [0, 6.4, 53, 0.8],
        [0.2, 6.4, 60, 0.75],
        [0.6, 6.2, 65, 0.7],
        [1.2, 5.8, 69, 0.7],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 40,
    id: 'folding-as-it-grows-d',
    name: 'Folding as it grows {D}',
    kind: 'pad',
    description:
      'A tone on {D} in two octaves that folds over itself as it swells, through a triode; it comes round.',
    preset: 'far-north-folding-as-it-grows',
    ...cycled(
      8,
      [
        [0, 5.6, 50, 0.8],
        [0.9, 5, 62, 0.7],
      ],
      { crossfadeSec: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 41,
    id: 'bar-and-pedal-c6',
    name: 'Bar and pedal {C}6',
    kind: 'pad',
    description: 'Steel strings under a bar on {C} sixth, swelled in by the pedal; it comes round.',
    preset: 'far-north-bar-and-volume-pedal',
    ...cycled(8, [
      [0, 7.6, 48, 0.8],
      [0.03, 7.6, 55, 0.75],
      [0.06, 7.6, 64, 0.7],
      [3.1, 4.5, 69, 0.7],
    ]),
  },
  {
    n: 42,
    id: 'steel-without-strike-dm',
    name: 'Steel without strike {D}m',
    kind: 'pad',
    description: 'A steel pan on {D} minor with every strike faded out so only the ring swells in.',
    preset: 'far-north-steel-without-strike',
    ...cycled(
      8,
      [
        [0, 2, 50, 0.8],
        [1.7, 2, 57, 0.7],
        [3.9, 2, 65, 0.7],
        [5.2, 2, 62, 0.7],
      ],
      { passes: 2 },
    ),
    loopFold: 'power',
  },
  {
    n: 43,
    id: 'one-string-swelling-g',
    name: 'One string swelling {G}',
    kind: 'pad',
    description:
      'A felted string on {G}, then {D}, the strike faded out so it seems bowed, in a hall.',
    preset: 'far-north-one-string-swelling',
    ...cycled(8, [
      [0, 4, 55, 0.8],
      [3.3, 4, 62, 0.75],
    ]),
  },
  {
    n: 44,
    id: 'grains-thrown-up-a',
    name: 'Grains thrown up {A}',
    kind: 'pad',
    description:
      'A steel guitar held on {A} and {E} as a slow cloud in a hall, some of its grains thrown up an octave.',
    preset: 'far-north-grains-thrown-upward',
    source: 'steel-guitar-drone-a',
    // Longer, darker grains and more of them than the preset, fewer thrown up and more of the
    // hall: a short bright grain alone in the cloud was heard as a note in some keys.
    set: { size: 2000, density: 16, spray: 0.1, octaves: 0.25, tone: 6000 },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 8, mix: 0.7 } }],
    ...cycled(8, [[0, 5.2, 60, 0.8]], { crossfadeSec: 2 }),
    loopFold: 'power',
    then: [narrow(0.4)],
  },
  {
    n: 45,
    id: 'backwards-weather-g',
    name: 'Backwards weather {G}',
    kind: 'pad',
    description:
      'Two horns on {G} and {D} read backwards in long overlapping grains through a console stage.',
    preset: 'far-north-backwards-weather',
    source: 'horn-drone-g',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { output: -7.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, width: 0.5 } },
    ],
    ...cycled(8, [[0, 5.5, 60, 0.8]], { crossfadeSec: 2 }),
    loopFold: 'power',
  },

  // Textures: wind, water, steam and breath, with little or no pitch.
  {
    n: 46,
    id: 'open-ground-wind',
    name: 'Open ground wind',
    kind: 'texture',
    description:
      'Wind across open ground with a faint whistle in it, let into a room in one slow wave a loop.',
    preset: 'far-north-wind-in-slow-waves',
    // Less of the whistle, which is a note, and the waves not let all the way down.
    set: { resonance: 0.2 },
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 8, breathRate: 0.125, breathDepth: 0.6, mix: 0.6 },
      },
    ],
    ...looped(8, 5, 3, [55]),
  },
  {
    n: 47,
    id: 'ground-steam-hiss',
    name: 'Ground steam hiss',
    kind: 'texture',
    description:
      'Filtered noise settled to a hiss like steam out of the ground, a slow comb moving in it.',
    preset: 'far-north-steam-vent',
    set: { filterSustain: 0.45 },
    effects: [
      { deviceId: 'flanger', preset: 'Wide wash', params: { rate: 0.125, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
      {
        deviceId: 'tremolo',
        params: { mode: 0, rate: 0.125, depth: 0.5, shape: 0, phase: 0, drift: 0, smooth: 0.5 },
      },
    ],
    ...looped(8, 9, 3, [60]),
  },
  {
    n: 48,
    id: 'meltwater-over-stones',
    name: 'Meltwater over stones',
    kind: 'texture',
    description:
      'A stream of meltwater running over stones, close, with far echoes of the valley behind it.',
    preset: 'far-north-meltwater',
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 49,
    id: 'surf-run-backwards',
    name: 'Surf run backwards',
    kind: 'texture',
    description:
      'Waves on sand played from their end to their start, overdriven, in a very large space.',
    preset: 'far-north-end-to-start',
    source: 'waves-on-sand',
    set: { loop: 1 },
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.45, output: -6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, width: 0.6 } },
    ],
    ...looped(8, 3, 3, [60]),
  },
  {
    n: 50,
    id: 'breath-through-pipes',
    name: 'Breath through pipes',
    kind: 'texture',
    description:
      'Wide, breathy bands of noise more like wind than notes, drifting through a transformer.',
    preset: 'far-north-wind-in-the-pipes',
    ...looped(8, 5, 3, [52]),
  },
  {
    n: 51,
    id: 'breath-chord-dm',
    name: 'Breath chord {D}m',
    kind: 'texture',
    description:
      'Low flutes blown so softly they are mostly air on {D} minor, the tail in slow vowels.',
    preset: 'far-north-breath-chord',
    ...looped(8, 6, 3, [50, 57, 62, 65]),
  },
  {
    n: 52,
    id: 'fingerboard-air-am7',
    name: 'Fingerboard air {A}m7',
    kind: 'texture',
    description:
      'Airy bows over the fingerboard on {A} minor seventh, more breath than string, in a hall.',
    preset: 'far-north-over-the-fingerboard',
    ...looped(8, 5, 3, [57, 64, 67, 72]),
  },
  {
    n: 53,
    id: 'black-sand-shore',
    name: 'Black sand shore',
    kind: 'texture',
    description:
      'Slow waves breaking on a beach and drawing back, with far echoes of the cliffs behind.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Slow shore',
      params: { density: 0.4, tone: 0.4, attack: 1, width: 0.6 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 8, outputDb: -6, oversample: 1 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.2 } },
    ],
    ...looped(16, 7, 3, [48]),
  },
  {
    n: 54,
    id: 'cooling-lava',
    name: 'Cooling lava',
    kind: 'texture',
    description: 'Ticks and cracks over a low roar, like new rock cooling, in a small dark room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.6, tone: 0.3, attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 14, outputDb: -6, oversample: 1 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
    ...looped(8, 3, 2, [43]),
  },
  {
    n: 55,
    id: 'glacier-river',
    name: 'Glacier river',
    kind: 'texture',
    description: 'Fast grey water heard from the bank above it: an even roar in a hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Fast water',
      params: { distance: 0.6, tone: 0.3, attack: 1, width: 0.7 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } }],
    ...looped(8, 3, 2, [45]),
  },
  {
    n: 56,
    id: 'storm-past-the-ridge',
    name: 'Storm past the ridge',
    kind: 'texture',
    description:
      'Thunder rolling far off beyond a ridge, one roll dying under the next, in a huge space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, tone: 0.6, movement: 0.4, width: 0.8 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 8, outputDb: -6, oversample: 1 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    ...looped(16, 1, 3, [38, 43, 50, 55]),
  },
  {
    n: 57,
    id: 'rain-on-the-turf-roof',
    name: 'Rain on the turf roof',
    kind: 'texture',
    description:
      'Steady rain heard from indoors, close and soft, in the small room under the roof.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.7, tone: 0.35, attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 14, outputDb: -6, oversample: 1 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
    ...looped(8, 4, 2, [57]),
  },

  // One-shots: one struck or plucked note or chord, ringing out.
  {
    n: 58,
    id: 'frosted-glockenspiel-c',
    name: 'Frosted glockenspiel {C}',
    kind: 'oneshot',
    description: 'One high {C} on small steel bars with a hard beater, a thin halo two octaves up.',
    preset: 'far-north-frosted-glockenspiel',
    // Less of the halo than the preset has: at its level the pieces of it were heard as notes.
    effects: [
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.15 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { decay: 0.6, mix: 0.25 } },
    ],
    ...played(4.5, [[0, 1.5, 84]], 1.5),
  },
  {
    n: 59,
    id: 'spring-running-down-e',
    name: 'Spring running down {E}',
    kind: 'oneshot',
    description: 'One {E} on a music box comb, a copy an octave down and twice as slow under it.',
    preset: 'far-north-spring-running-down',
    ...played(4, [[0, 1.2, 76]], 1),
  },
  {
    n: 60,
    id: 'bell-over-the-water-d',
    name: 'Bell over the water {D}',
    kind: 'oneshot',
    description: 'A church bell on {D} heard from across a fjord, its hum hanging over far echoes.',
    preset: 'far-north-bell-over-the-water',
    // Far echoes that die inside the sound: the preset's ring for twenty seconds.
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.85, room: 0.6 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { width: 0.6, mix: 0.4, decay: 6 } },
    ],
    ...played(12, [[0, 5, 50]], 3),
    then: [lift(8)],
  },
  {
    n: 61,
    id: 'slate-bar-g',
    name: 'Slate bar {G}',
    kind: 'oneshot',
    description:
      'One short dull bar on {G} like a flat stone struck with a soft beater, in a bare room.',
    preset: 'far-north-slate-bars',
    then: [narrow(0.3)],
    ...played(2, [[0, 1, 55]], 0.5),
  },
  {
    n: 62,
    id: 'hard-hammer-upright-c',
    name: 'Hard hammer upright {C}',
    kind: 'oneshot',
    description: 'One {C} on an upright with hard hammers, printed to tape and left in a hall.',
    preset: 'far-north-hard-hammer-upright',
    then: [lift(4)],
    ...played(7, [[0, 4, 48]], 2),
  },
  {
    n: 63,
    id: 'piano-reversed-room-am',
    name: 'Piano, reversed room {A}m',
    kind: 'oneshot',
    description:
      'A hard {A} minor chord on an open piano, followed by a swell rising backwards to a cut.',
    preset: 'far-north-piano-reversed-room',
    // The rising room a little lower than the preset has it: at its level the end of the rise was a second note.
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.35 } },
      hall('Hall', 0.3),
    ],
    ...played(
      8.5,
      [
        [0, 2.5, 45, 0.8],
        [0.02, 2.5, 57, 0.7],
        [0.04, 2.5, 64, 0.7],
        [0.06, 2.5, 72, 0.7],
      ],
      1.5,
    ),
    then: [narrow(0.4), lift(3)],
  },
  {
    n: 64,
    id: 'untuned-upright-f',
    name: 'Untuned upright {F}',
    kind: 'oneshot',
    description: 'A chord of {F} on an upright nobody has tuned for years, on a worn cassette.',
    preset: 'far-north-untuned-upright',
    ...played(
      6,
      [
        [0, 3, 53, 0.8],
        [0.01, 3, 60, 0.7],
        [0.02, 3, 65, 0.7],
        [0.03, 3, 69, 0.75],
      ],
      1.5,
    ),
    then: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }, lift(4)],
  },
  {
    n: 65,
    id: 'felt-and-long-memory-c',
    name: 'Felt and long memory {C}',
    kind: 'oneshot',
    description:
      'A soft close {C}, {G} and {C} on a felted piano that drift back dull and slowed in a dark space.',
    preset: 'far-north-felt-and-long-memory',
    // Three notes, not one: this piano's level changes a great deal from one note to the next.
    ...played(
      10,
      [
        [0, 2.5, 48, 0.7],
        [0.01, 2.5, 55, 0.65],
        [0.02, 2.5, 60, 0.7],
      ],
      2.5,
    ),
    then: [narrow(0.3), lift(6)],
  },
  {
    n: 66,
    id: 'piano-strings-rising-g',
    name: 'Piano, strings rising {G}',
    kind: 'oneshot',
    description:
      'A chord of {G} on an upright with a string section swelling up behind it, on a plate.',
    preset: 'far-north-piano-strings-rising',
    // The strings a little lower than the preset has them: in the low keys they rose over the piano.
    effects: [
      {
        deviceId: 'pad-follower',
        preset: 'Slow swell',
        params: { rise: 1.8, sensitivity: 0.65, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...played(
      10,
      [
        [0, 3.5, 55, 1],
        [0.02, 3.5, 62, 0.9],
        [0.04, 3.5, 67, 0.9],
        [0.06, 3.5, 71, 0.9],
      ],
      2.5,
    ),
    then: [narrow(0.3), lift(3)],
  },
  {
    n: 67,
    id: 'black-sand-baritone-e',
    name: 'Black sand baritone {E}',
    kind: 'oneshot',
    description:
      'Low strings on {E} and {B} hit hard at the bridge into a driven valve, in a dark well.',
    preset: 'far-north-black-sand-baritone',
    ...played(
      8,
      [
        [0, 4, 40, 0.8],
        [0, 4, 47, 0.75],
        [0, 4, 52, 0.75],
      ],
      2,
    ),
  },
  {
    n: 68,
    id: 'frost-on-the-wires-dm',
    name: 'Frost on the wires {D}m',
    kind: 'oneshot',
    description:
      'A twelve-string strummed once on {D} minor, its octaves doubled above it in a bright halo.',
    preset: 'far-north-frost-on-the-wires',
    // Less of the halo than the preset has: at its level the pieces of it were heard as notes.
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 9, mix: 0.2 } },
    ],
    then: [lift(5)],
    ...played(
      8.5,
      [
        [0, 5, 50, 0.8],
        [0, 5, 57, 0.75],
        [0, 5, 62, 0.75],
        [0, 5, 65, 0.7],
        [0, 5, 69, 0.7],
        [0, 5, 74, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 69,
    id: 'toy-piano-rod-d',
    name: 'Toy piano rod {D}',
    kind: 'oneshot',
    description: 'One {D} on a toy piano: a short metal rod with a clack, through a small speaker.',
    preset: 'far-north-toy-piano',
    // The operators in tune: detuned, the rod beats once after the clack and is two notes.
    set: { detune: 0 },
    ...played(2.5, [[0, 1, 74]], 0.5),
  },
  {
    n: 70,
    id: 'celesta-after-hours-f',
    name: 'Celesta after hours {F}',
    kind: 'oneshot',
    description: 'One soft {F} on a celesta cut to a record with its crackle, in an empty hall.',
    preset: 'far-north-celesta-after-hours',
    ...played(6, [[0, 2, 77]], 1.5),
    then: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
  },
  {
    n: 71,
    id: 'tongue-drum-shadow-a',
    name: 'Tongue drum shadow {A}',
    kind: 'oneshot',
    description:
      'One {A} on a tongue drum, shadowed by a reversed copy an octave below, in a cathedral.',
    preset: 'far-north-tongue-drum-shadow',
    ...played(10, [[0, 3, 57]], 2.5),
    then: [lift(9)],
  },
  {
    n: 72,
    id: 'harp-in-the-nave-g',
    name: 'Harp in the nave {G}',
    kind: 'oneshot',
    description: 'One low {G} picked on a concert harp, doubled a few cents wide, in a cathedral.',
    preset: 'far-north-harp-in-the-nave',
    ...played(8, [[0, 3, 43]], 2),
  },
  {
    n: 73,
    id: 'drumstick-on-the-bass-e',
    name: 'Drumstick on the bass {E}',
    kind: 'oneshot',
    description:
      'A bass string on {E} hit with a drumstick: a dull thump that opens and falls back.',
    preset: 'far-north-drumstick-on-the-bass',
    // More of the room than the preset has: a bass alone sits dead in the middle.
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.45 } },
    ],
    then: [lift(9)],
    ...played(5, [[0, 3, 40]], 1),
  },
  {
    n: 74,
    id: 'tines-with-an-edge-a',
    name: 'Tines with an edge {A}',
    kind: 'oneshot',
    description:
      'One {A} on an electric piano hit hard so the pickup barks, through a small combo in a room.',
    preset: 'far-north-tines-with-an-edge',
    // Less drive than the preset and a room after the amp: driven hard the note is one flat block,
    // loud and dead in the middle.
    set: { drive: 0.3 },
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.3, output: -3.5 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { width: 1 } },
      hall('Room', 0.3),
    ],
    ...played(5, [[0, 3, 45]], 1.5),
  },
  {
    n: 75,
    id: 'tines-side-to-side-f',
    name: 'Tines side to side {F}',
    kind: 'oneshot',
    description:
      'A soft {F} major seventh on tines, answered by reversed copies an octave up, in a hall.',
    preset: 'far-north-tines-side-to-side',
    // The reversed copies lower than the preset has them: at its level each was heard as a note.
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { feedback: 0.2, smooth: 1, mix: 0.15 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(
      10,
      [
        [0, 4, 53, 0.8],
        [0.02, 4, 60, 0.7],
        [0.04, 4, 64, 0.7],
        [0.06, 4, 69, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 76,
    id: 'boathouse-banjo-d',
    name: 'Boathouse banjo {D}',
    kind: 'oneshot',
    description:
      'One {D} picked hard with the nail at the bridge so it clacks, a short spring behind.',
    preset: 'far-north-boathouse-banjo',
    then: [lift(5)],
    ...played(2.5, [[0, 1.5, 62]], 0.5),
  },
  {
    n: 77,
    id: 'paired-strings-d',
    name: 'Paired strings {D}',
    kind: 'oneshot',
    description:
      'One hammer stroke on {D} and its octave, the open strings ringing on in a cathedral.',
    preset: 'far-north-rolled-paired-strings',
    // Both strings at once: rolled or strummed, the pair is two notes.
    set: { roll: 0, strum: 0 },
    ...played(6.5, [[0, 2.5, 62]], 2),
  },
  {
    n: 78,
    id: 'cold-clear-note-e',
    name: 'Cold clear note {E}',
    kind: 'oneshot',
    description:
      'One clean neck-pickup {E} picked softly through a shimmering tremolo, dark repeats behind.',
    preset: 'far-north-cold-clear-picking',
    // The repeats kept low: at the preset's level the first of them was heard as a second note.
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 3.2, depth: 0.6, phase: 90, drift: 0.2 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 450, mix: 0.12 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [lift(9)],
    ...played(8, [[0, 2.5, 64]], 2),
  },

  // Phrases: a few notes in free time; those that say so come round.
  {
    n: 79,
    id: 'cold-clear-picking-dm',
    name: 'Cold clear picking {D}m',
    kind: 'melodic',
    description:
      'Seven clean picked notes of {D} minor rising and falling through a tremolo; it comes round.',
    preset: 'far-north-cold-clear-picking',
    // The tremolo twenty-six times to the loop.
    effects: [
      { deviceId: 'tremolo', params: { mode: 2, rate: 3.25, depth: 0.6, phase: 90, drift: 0 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 450, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...cycled(8, [
      [0, 2.2, 50, 0.7],
      [0.62, 1.8, 57, 0.6],
      [1.37, 1.8, 65, 0.65],
      [2.41, 2.2, 64, 0.6],
      [3.83, 2, 62, 0.6],
      [5.02, 1.8, 57, 0.55],
      [5.71, 2, 60, 0.6],
    ]),
  },
  {
    n: 80,
    id: 'each-note-backwards-e',
    name: 'Each note backwards {E}',
    kind: 'melodic',
    description:
      'Three hard bridge-pickup notes from {E}, each heard again backwards two seconds on; it comes round.',
    preset: 'far-north-each-note-backwards',
    ...cycled(8, [
      [0, 1.2, 64, 0.8],
      [1.47, 1.2, 71, 0.7],
      [4.31, 1.4, 67, 0.75],
    ]),
    then: [lift(8)],
  },
  {
    n: 81,
    id: 'kitchen-table-tune-c',
    name: 'Kitchen table tune {C}',
    kind: 'melodic',
    description:
      'A fingerpicked figure on {C} and {F} with the thumb on the low strings, on quarter-inch tape.',
    preset: 'far-north-kitchen-table-acoustic',
    // More of the room than the preset has: one close guitar sits narrow.
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.15 } },
      hall('Room', 0.4),
    ],
    ...played(
      8,
      [
        [0, 2.6, 48, 0.7],
        [0.42, 1.2, 64, 0.6],
        [0.97, 1.1, 67, 0.6],
        [1.71, 1.6, 72, 0.65],
        [2.94, 2.4, 53, 0.65],
        [3.33, 1.2, 69, 0.6],
        [3.92, 1.5, 65, 0.55],
        [4.81, 2.6, 48, 0.6],
        [4.86, 2.6, 64, 0.6],
      ],
      1,
    ),
  },
  {
    n: 82,
    id: 'boathouse-banjo-g',
    name: 'Boathouse banjo {G}',
    kind: 'melodic',
    description: 'Thin strings picked hard at the bridge: up a chord of {G} and back down to rest.',
    preset: 'far-north-boathouse-banjo',
    ...played(
      6,
      [
        [0, 0.6, 55, 0.8],
        [0.38, 0.5, 62, 0.7],
        [0.71, 0.5, 67, 0.7],
        [1.27, 0.8, 71, 0.75],
        [1.93, 0.6, 69, 0.65],
        [2.52, 0.5, 67, 0.7],
        [2.87, 1.6, 62, 0.7],
        [3.71, 1.8, 55, 0.8],
      ],
      0.8,
    ),
  },
  {
    n: 83,
    id: 'nave-harp-round-am',
    name: 'Nave harp round {A}m',
    kind: 'melodic',
    description:
      'A harp opens {A} minor from the bass and steps back down, in a cathedral; it comes round.',
    preset: 'far-north-harp-in-the-nave',
    ...cycled(8, [
      [0, 2.4, 45, 0.75],
      [0.07, 2.4, 57, 0.6],
      [1.21, 2, 64, 0.6],
      [2.08, 2, 72, 0.65],
      [3.27, 2.4, 71, 0.6],
      [4.62, 2, 67, 0.55],
      [5.49, 2.2, 64, 0.6],
    ]),
  },
  {
    n: 84,
    id: 'harp-swept-upward-f',
    name: 'Harp swept upward {F}',
    kind: 'melodic',
    description:
      'Two sweeps up the harp, from {F} and then from {C}, grains an octave higher falling back.',
    preset: 'far-north-harp-swept-upward',
    // Each sweep rolled by hand and quickening as it climbs: the harp's own roll is even, and is
    // heard as a pulse.
    set: { sweep: 0 },
    ...played(
      8,
      [
        [0, 1.6, 53, 0.75],
        [0.23, 1.5, 57, 0.6],
        [0.42, 1.4, 60, 0.6],
        [0.58, 1.3, 65, 0.65],
        [0.71, 1.2, 69, 0.65],
        [0.81, 1.6, 72, 0.7],
        [2.73, 1.6, 60, 0.7],
        [2.94, 1.5, 64, 0.6],
        [3.11, 1.4, 67, 0.6],
        [3.25, 1.3, 72, 0.65],
        [3.36, 1.2, 76, 0.65],
        [3.44, 2, 79, 0.7],
      ],
      2,
    ),
  },
  {
    n: 85,
    id: 'glockenspiel-fall-c',
    name: 'Glockenspiel fall {C}',
    kind: 'melodic',
    description:
      'Small steel bars falling from a high {G} to {C}, turning and settling; it comes round.',
    preset: 'far-north-frosted-glockenspiel',
    ...cycled(8, [
      [0, 1, 91, 0.7],
      [0.58, 1, 88, 0.65],
      [1.33, 1.2, 84, 0.7],
      [2.71, 1, 86, 0.6],
      [3.4, 1.4, 79, 0.65],
      [5.07, 1.6, 84, 0.6],
    ]),
  },
  {
    n: 86,
    id: 'steel-bars-answer-g',
    name: 'Steel bars answer {G}',
    kind: 'melodic',
    description:
      'A glockenspiel asks upward from {G} and answers back down, a loop of itself an octave up.',
    preset: 'far-north-small-steel-bars',
    ...played(
      8,
      [
        [0, 1, 79, 0.7],
        [0.47, 1, 83, 0.65],
        [1.12, 1.6, 86, 0.7],
        [2.87, 1, 84, 0.6],
        [3.41, 1, 81, 0.6],
        [4.19, 2, 79, 0.7],
      ],
      2,
    ),
  },
  {
    n: 87,
    id: 'clockwork-tune-em',
    name: 'Clockwork tune {E}m',
    kind: 'melodic',
    description:
      'A music box tune in {E} minor slowing as the spring runs out, itself an octave down under it.',
    preset: 'far-north-spring-running-down',
    ...played(
      8.5,
      [
        [0, 0.8, 76, 0.7],
        [0.52, 0.8, 79, 0.65],
        [1.19, 0.8, 83, 0.7],
        [1.83, 1, 81, 0.6],
        [2.71, 0.8, 79, 0.6],
        [3.62, 1.4, 76, 0.65],
        [5.03, 2, 71, 0.6],
      ],
      2,
    ),
  },
  {
    n: 88,
    id: 'thumb-keys-round-am',
    name: 'Thumb keys round {A}m',
    kind: 'melodic',
    description:
      'Five thumb piano notes of {A} minor, each struck again by fading copies; it comes round.',
    preset: 'far-north-thumb-keys-answering',
    ...cycled(8, [
      [0, 1.2, 57, 0.75],
      [1.43, 1, 64, 0.65],
      [2.31, 1.2, 60, 0.7],
      [4.17, 1, 62, 0.6],
      [5.36, 1.4, 64, 0.65],
    ]),
  },
  {
    n: 89,
    id: 'toy-piano-tune-c',
    name: 'Toy piano tune {C}',
    kind: 'melodic',
    description:
      'A toy piano climbs a chord of {C} and walks back down to an octave, through a small speaker.',
    preset: 'far-north-toy-piano',
    ...played(
      5.5,
      [
        [0, 0.5, 72, 0.7],
        [0.41, 0.5, 76, 0.65],
        [0.78, 0.5, 79, 0.7],
        [1.37, 0.7, 77, 0.6],
        [1.92, 0.5, 76, 0.65],
        [2.36, 0.5, 74, 0.6],
        [3.03, 1.2, 72, 0.7],
        [3.09, 1.2, 60, 0.6],
      ],
      1,
    ),
  },
  {
    n: 90,
    id: 'celesta-figure-f',
    name: 'Celesta figure {F}',
    kind: 'melodic',
    description:
      'A soft celesta opens a chord of {F} and comes back down, on a record with its crackle.',
    preset: 'far-north-celesta-after-hours',
    then: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
    ...played(
      8,
      [
        [0, 2, 65, 0.65],
        [0.52, 1.6, 72, 0.6],
        [1.67, 1.8, 77, 0.65],
        [3.41, 1.6, 76, 0.55],
        [3.83, 2, 72, 0.6],
        [5.36, 2.2, 69, 0.6],
      ],
      2,
    ),
  },
  {
    n: 91,
    id: 'slate-bars-in-a-row-d',
    name: 'Slate bars in a row {D}',
    kind: 'melodic',
    description:
      'Dull bars like flat stones struck along the row from {D} and back, in a bare room; it comes round.',
    preset: 'far-north-slate-bars',
    ...cycled(6, [
      [0, 0.6, 50, 0.75],
      [0.44, 0.6, 57, 0.7],
      [0.93, 0.6, 62, 0.7],
      [1.62, 0.6, 60, 0.65],
      [2.11, 0.6, 57, 0.7],
      [2.87, 1, 53, 0.7],
      [3.74, 1.2, 50, 0.75],
    ]),
  },
  {
    n: 92,
    id: 'hard-hammer-answer-g',
    name: 'Hard hammer answer {G}',
    kind: 'melodic',
    description:
      'An upright with hard hammers: three notes up over a low {G}, two back over {C}, in a hall.',
    preset: 'far-north-hard-hammer-upright',
    ...played(
      10,
      [
        [0, 3, 43, 0.75],
        [0.05, 1.3, 62, 0.7],
        [1.24, 1.1, 67, 0.7],
        [2.17, 2.6, 71, 0.75],
        [4.36, 3, 48, 0.7],
        [4.4, 1.4, 67, 0.65],
        [5.63, 3, 64, 0.7],
      ],
      2.5,
    ),
  },
  {
    n: 93,
    id: 'felt-and-memory-dm',
    name: 'Felt and memory {D}m',
    kind: 'melodic',
    description:
      'A soft close piano in {D} minor whose earlier notes drift back under the new; it comes round.',
    preset: 'far-north-felt-and-long-memory',
    ...cycled(8, [
      [0, 2.2, 50, 0.6],
      [0.04, 1.8, 65, 0.6],
      [1.36, 1.6, 69, 0.55],
      [2.57, 2.4, 64, 0.6],
      [4.42, 2, 62, 0.55],
      [5.61, 2, 57, 0.55],
    ]),
    // Evened out a little before the limiter: this piano's level changes a great deal from one
    // note to the next, and in some keys the phrase came out very quiet under one tall note.
    then: [
      narrow(0.3),
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -45,
          ratio: 2,
          attack: 10,
          release: 0.4,
          knee: 12,
          tails: 1,
          makeup: 12,
        },
      },
      lift(2),
    ],
  },
  {
    n: 94,
    id: 'piano-strings-rise-c',
    name: 'Piano, strings rise {C}',
    kind: 'melodic',
    description:
      'A plain upright figure on {C} and {F} with strings swelling up behind it; it comes round.',
    preset: 'far-north-piano-strings-rising',
    ...cycled(8, [
      [0, 3, 48, 0.7],
      [0.03, 2, 64, 0.65],
      [1.47, 1.6, 67, 0.6],
      [2.63, 2.5, 72, 0.65],
      [4.52, 2.6, 53, 0.65],
      [4.56, 2, 69, 0.6],
      [5.88, 1.8, 67, 0.6],
    ]),
    then: [narrow(0.3)],
  },
  {
    n: 95,
    id: 'tongue-drum-round-dm',
    name: 'Tongue drum round {D}m',
    kind: 'melodic',
    description:
      'Soft fingers circling a tongue drum in {D} minor, reversed copies an octave below; it comes round.',
    preset: 'far-north-tongue-drum-shadow',
    // A note struck again adds to what still rings of it: two rounds are dropped, not one.
    ...cycled(
      8,
      [
        [0, 1.6, 50, 0.75],
        [0.93, 1.2, 57, 0.6],
        [1.71, 1.2, 62, 0.65],
        [3.12, 1.4, 60, 0.6],
        [4.38, 1.6, 53, 0.7],
        [5.47, 1.2, 57, 0.6],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 96,
    id: 'drumstick-bass-walk-a',
    name: 'Drumstick bass walk {A}',
    kind: 'melodic',
    description:
      'A bass hit with a drumstick walks down from {A} to {E} and back, through a warm stack.',
    preset: 'far-north-drumstick-on-the-bass',
    // More of the room than the preset has: a bass alone sits dead in the middle.
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.45 } },
    ],
    then: [lift(4)],
    ...played(
      8,
      [
        [0, 1.5, 45, 0.8],
        [1.37, 1.2, 43, 0.7],
        [2.24, 1.6, 40, 0.75],
        [3.92, 1.2, 43, 0.7],
        [4.71, 2.5, 45, 0.8],
      ],
      1,
    ),
  },
  {
    n: 97,
    id: 'whistle-on-the-hill-d',
    name: 'Whistle on the hill {D}',
    kind: 'melodic',
    description:
      'A low wooden whistle plays a plain tune up from {D} and home again, one quiet echo behind.',
    preset: 'far-north-whistle-on-the-hill',
    // Each note tongued and let go quickly, in less of the hall: run together they are one long note.
    // More breath in it than the preset has and the passing notes played lighter than the long
    // ones: a plain blown tone played evenly comes out loud.
    set: { chiff: 1, attack: 0.01, release: 0.25, breath: 0.65 },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 320, feedback: 0.15, mix: 0.2 },
      },
      hall('Hall', 0.32),
    ],
    ...played(
      8,
      [
        [0, 0.55, 62, 0.75],
        [0.83, 0.3, 65, 0.5],
        [1.31, 0.4, 67, 0.6],
        [1.94, 1.2, 69, 0.95],
        [3.62, 0.3, 72, 0.6],
        [4.09, 0.4, 69, 0.5],
        [4.73, 0.45, 65, 0.55],
        [5.48, 1.4, 62, 0.65],
      ],
      1,
    ),
  },
  {
    n: 98,
    id: 'long-slides-echoing-c',
    name: 'Long slides echoing {C}',
    kind: 'melodic',
    description:
      'Picked steel notes sliding into their neighbours, from {C} up to {G} and back down; it comes round.',
    preset: 'far-north-long-slides-echoing',
    // Four notes picked with nothing held, two of them slid into a neighbour: a note that overlaps
    // the last is a slide and not a pick, and a line of slides alone has one hit in it.
    set: { swell: 0, pick: 0.8 },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.15 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
    ...cycled(12, [
      [0, 2.2, 60, 0.75],
      [1.5, 2, 64, 0.7],
      [4.4, 2.4, 67, 0.8],
      [5.9, 1.9, 65, 0.7],
      [8.6, 1.4, 62, 0.75],
      [10.4, 1.2, 60, 0.75],
    ]),
  },
  {
    n: 99,
    id: 'falsetto-over-snow-e',
    name: 'Falsetto over snow {E}',
    kind: 'melodic',
    description:
      'One high male voice rising from {E} to {B} and settling back, an octave faintly above it.',
    preset: 'far-north-falsetto-over-snow',
    ...played(
      12,
      [
        [0, 1.6, 64, 0.8],
        [1.52, 0.9, 67, 0.75],
        [2.38, 2.4, 71, 0.8],
        [5.11, 1, 69, 0.75],
        [6.03, 2, 64, 0.8],
      ],
      3,
    ),
    then: [narrow(0.3)],
  },
  {
    n: 100,
    id: 'baritone-climb-e',
    name: 'Baritone climb {E}',
    kind: 'melodic',
    description:
      'Low strings hit hard at the bridge climb from {E} through {B} and {D} to the octave, driven.',
    preset: 'far-north-black-sand-baritone',
    ...played(
      8,
      [
        [0, 1.9, 40, 0.8],
        [1.72, 1.3, 47, 0.75],
        [2.83, 1.2, 50, 0.7],
        [4.21, 2.4, 52, 0.8],
      ],
      1.5,
    ),
  },
])
