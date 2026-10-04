// The sounds of the pack "Museum Window Garden": its presets played, a hundred sounds to
// paint with. Numbers 9001 to 9100.

import { PRESETS } from '../packs/window-garden'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('window-garden', 9000, PRESETS, [
  // Drones: one note or two, held still under the bright notes.
  {
    n: 1,
    id: 'steady-fifth-c',
    name: 'Steady fifth {C}',
    kind: 'drone',
    description:
      'A low {C}, its octave and the fifths over them in near-sine partials, hardly moving.',
    preset: 'window-garden-steady-fifth',
    // Half the preset's movement, one wander of the partials to the loop, and a plain room: the
    // preset's reverb rang on some keys and not on others, and the fifth sank and rose with it.
    set: { movement: 0.1, rate: 0.125, air: 0.08 },
    effects: [hall('Room', 0.2)],
    ...looped(8, 5, 3, [36, [48, 0.6]]),
  },
  {
    n: 2,
    id: 'skylight-chord-g',
    name: 'Skylight chord {G}',
    kind: 'drone',
    description:
      'One {G} opened into a just major chord of soft partials with a little air over it.',
    preset: 'window-garden-skylight-chord',
    // Half the preset's air: on a low key the chord was heard as noise.
    set: { air: 0.1 },
    ...looped(8, 6, 3, [55]),
  },
  {
    n: 3,
    id: 'flute-stops-a',
    name: 'Flute stops {A}',
    kind: 'drone',
    description:
      'The flute ranks of a small pipe organ holding {A} in octaves and {E}, plain and steady.',
    preset: 'window-garden-flute-stops',
    // The bellows off and the chorus shallow, two turns to the loop: the organ's breathing read as a pad.
    set: { bellows: 0 },
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.25, depth: 10, mix: 0.3 } },
      hall('Room', 0.2),
    ],
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [45, 57, [64, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'plain-tones-d',
    name: 'Plain tones {D}',
    kind: 'drone',
    description: 'Near sines on {D}, {A} and {D} with a sub beneath, held in a light chorus.',
    preset: 'window-garden-plain-tones',
    // The two oscillators in tune: five cents apart they beat every two seconds.
    set: { detune: 0 },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.25, depth: 20, mix: 0.3 } },
      hall('Room', 0.2),
    ],
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [50, [57, 0.7], [62, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'singing-bowl-rim-f',
    name: 'Singing bowl rim {F}',
    kind: 'drone',
    description:
      'Two glasses rubbed round their rims on {F} and {C}, held and pure, in a small room.',
    preset: 'window-garden-singing-bowl-rim',
    set: { detune: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [65, [72, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'low-flutes-together-g',
    name: 'Low flutes together {G}',
    kind: 'drone',
    description:
      'Two low flutes holding {G} and {D} with no vibrato, soft-edged, in a medium room.',
    preset: 'window-garden-low-flutes-together',
    // Less air and no vibrato: the breath wandered enough in the low keys to read as a pad.
    set: { breath: 0.25, vibrato: 0 },
    then: [
      // A flute's breath wanders by a couple of decibels, more in some keys than others: this holds it level.
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -60,
          ratio: 8,
          attack: 20,
          release: 0.15,
          knee: 6,
          tails: 1,
          makeup: 24,
        },
      },
      quarterTurn(8),
    ],
    ...looped(8, 5, 2, [
      [55, 0.75],
      [62, 0.75],
    ]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'flugelhorns-indoors-e',
    name: 'Flugelhorns indoors {E}',
    kind: 'drone',
    description:
      'Two flugelhorns holding {E} and {B}, breathy and without vibrato, in a short hall.',
    preset: 'window-garden-flugelhorns-indoors',
    // One player a note: a section beats against itself and swells.
    set: { section: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [52, [59, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'four-plain-strings-c',
    name: 'Four plain strings {C}',
    kind: 'drone',
    description:
      'Four strings on {C} and {G} plucked in slow turn with no buzz, others ringing along.',
    preset: 'window-garden-four-plain-strings',
    // One round of the four strings to the loop, left to ring; the limiter takes each pluck down
    // and the compressor brings the ringing back up behind it, or the plucks are read as notes.
    set: { speed: 8.094, decay: 30 },
    then: [
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
      hall('Room', 0.3),
    ],
    ...looped(8, 8.2, 0.45, [48]),
  },
  {
    n: 9,
    id: 'soft-bridge-drone-d',
    name: 'Soft bridge drone {D}',
    kind: 'drone',
    description:
      'A drone lute on {D} and {A} with a little buzz at its bridge, plucked round twice a loop.',
    preset: 'window-garden-soft-bridge-drone',
    set: { speed: 4.047, decay: 30 },
    then: [
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
      hall('Room', 0.3),
    ],
    ...looped(8, 4.1, 0.45, [50]),
  },
  {
    n: 10,
    id: 'taped-flutes-b',
    name: 'Taped flutes {B}',
    kind: 'drone',
    description: 'Flutes from a tape-replay keyboard holding {B} in octaves, with a little hiss.',
    preset: 'window-garden-taped-flutes',
    // Length fully up: the tape under each key never runs out.
    set: { length: 9 },
    ...looped(8, 4, 2, [59, [71, 0.7]]),
  },
  {
    n: 11,
    id: 'reed-line-f',
    name: 'Reed line {F}',
    kind: 'drone',
    description: 'A plain reed tone holding {F}, the {C} over it and the octave, in a small room.',
    preset: 'window-garden-reed-line',
    // The two oscillators in tune and one drift of the reed to the loop: six cents apart they beat.
    set: { detune: 0, motion: 0.3, rate: 0.125 },
    then: [quarterTurn(8)],
    ...looped(8, 4, 2, [53, [60, 0.7], [65, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 12,
    id: 'whistle-tone-a',
    name: 'Whistle tone {A}',
    kind: 'drone',
    description:
      'Flutes blown so softly on {A} that they are nearly pure tones, their octaves above.',
    preset: 'window-garden-whistle-tone',
    set: { vibrato: 0, breath: 0.35 },
    then: [
      {
        deviceId: 'ambient-comp',
        params: {
          threshold: -60,
          ratio: 8,
          attack: 20,
          release: 0.15,
          knee: 6,
          tails: 1,
          makeup: 24,
        },
      },
      quarterTurn(8),
    ],
    ...looped(8, 4, 2, [
      [57, 0.75],
      [69, 0.75],
    ]),
    tuning: 'whole-cycles',
  },
  {
    n: 13,
    id: 'tape-loop-tone-d',
    name: 'Tape loop tone {D}',
    kind: 'drone',
    description: 'A soft tone held on a steady crossfaded loop on {D} and {A}, on clean tape.',
    preset: 'window-garden-loaded-sound-looped',
    ...looped(8, 4, 2, [50, [57, 0.7]]),
  },
  {
    n: 14,
    id: 'rolled-wood-bed-g',
    name: 'Rolled wood bed {G}',
    kind: 'drone',
    description:
      '{G} and {D} in two octaves rolled on a marimba with soft mallets into an even shimmer, nearly dry.',
    preset: 'window-garden-rolled-wood-bed',
    ...looped(8, 3, 2, [43, 50, [55, 0.8], [62, 0.5]]),
  },

  // Pads: chords that move slowly, most of them a swell to the loop.
  {
    n: 15,
    id: 'held-glass-am7',
    name: 'Held glass {A}m7',
    kind: 'pad',
    description: '{A} minor seventh on a glassy tone close to a sine, its notes beating gently.',
    preset: 'window-garden-held-glass',
    ...looped(8, 4, 3, [57, [64, 0.8], [67, 0.8], [72, 0.7]]),
  },
  {
    n: 16,
    id: 'light-bows-dm',
    name: 'Light bows {D}m',
    kind: 'pad',
    description: 'Three strings on {D} minor bowed with almost no pressure, soft-edged, in a room.',
    preset: 'window-garden-light-bows',
    ...looped(8, 5, 3, [50, 57, [65, 0.8]]),
  },
  {
    n: 17,
    id: 'rounded-low-strings-a',
    name: 'Rounded low strings {A}',
    kind: 'pad',
    description: 'The low octave of a string ensemble on {A}, {E} and {A}, swelling on fresh tape.',
    preset: 'window-garden-rounded-low-strings',
    then: [breathe(0.125, 0.7)],
    ...looped(8, 5, 3, [45, 52, [57, 0.7]]),
  },
  {
    n: 18,
    id: 'three-clarinets-em7',
    name: 'Three clarinets {E}m7',
    kind: 'pad',
    description:
      'Clarinets holding {E} minor seventh, hollow and woody, swelling in a small plate.',
    preset: 'window-garden-three-clarinets',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
    then: [breathe(0.125, 0.5), quarterTurn(8)],
    ...looped(8, 5, 2, [52, 59, [62, 0.8], [67, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 19,
    id: 'still-trio-f',
    name: 'Still trio {F}',
    kind: 'pad',
    description:
      'Three players a note on {F}, {C} and a high {A}, without vibrato, rising and sinking a little.',
    preset: 'window-garden-still-trio',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [53, 60, [69, 0.8]]),
  },
  {
    n: 20,
    id: 'hollow-afternoon-dm7',
    name: 'Hollow afternoon {D}m7',
    kind: 'pad',
    description:
      '{D} minor seventh on a hollow, clarinet-like pad that drifts in tone, in a shallow phaser.',
    preset: 'window-garden-hollow-afternoon',
    // One drift of the tone and three turns of the phaser to the loop.
    set: { rate: 0.125, motion: 0.6 },
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.375, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.2 } },
    ],
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 3, [50, 57, [65, 0.8], [72, 0.6]]),
  },
  {
    n: 21,
    id: 'humming-next-door-c',
    name: 'Humming next door {C}',
    kind: 'pad',
    description:
      'A soft vowel pad on {C} major, closer to humming than singing, in a room that hums along.',
    preset: 'window-garden-humming-next-door',
    set: { rate: 0.125, motion: 0.9 },
    then: [breathe(0.125, 0.3)],
    ...looped(8, 5, 3, [48, 55, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 22,
    id: 'light-on-water-c',
    name: 'Light on water {C}',
    kind: 'pad',
    description:
      'A thin, bright {C} and {G} whose upper partials glint and change, with no bass under them.',
    preset: 'window-garden-light-on-water',
    set: { rate: 0.25 },
    then: [breathe(0.25, 0.35)],
    ...looped(8, 5, 3, [72, 79, [84, 0.7]]),
  },
  {
    n: 23,
    id: 'round-brass-pad-f',
    name: 'Round brass pad {F}',
    kind: 'pad',
    description: 'A round, soft brass pad on {F} major warmed by a preamp, swelling once a loop.',
    preset: 'window-garden-round-brass-pad',
    then: [breathe(0.125, 0.3)],
    ...looped(8, 5, 3, [41, 48, [57, 0.8], [60, 0.7]]),
  },
  {
    n: 24,
    id: 'thin-strings-by-day-e',
    name: 'Thin strings by day {E}',
    kind: 'pad',
    description:
      'Thin, bright synthesizer strings on {E}, {B} and {D}, swelling under a slow flanger.',
    preset: 'window-garden-thin-strings-by-day',
    set: { detune: 5 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [64, 71, [74, 0.8]]),
  },
  {
    n: 25,
    id: 'daylight-pad-g',
    name: 'Daylight pad {G}',
    kind: 'pad',
    description:
      'The string pad of a chorus polysynth on {G} major, the bass thinned out, swelling once a loop.',
    preset: 'window-garden-daylight-pad',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 3, [55, 62, [67, 0.8], [71, 0.7]]),
  },
  {
    n: 26,
    id: 'high-string-line-b',
    name: 'High string line {B}',
    kind: 'pad',
    description:
      'The top octave of a string ensemble on a high {B}, thin and bright, phasing as it drifts.',
    preset: 'window-garden-high-string-line',
    // Less of the ensemble, whose wobble on two high notes was read as hits; one turn of the shifter to the loop.
    set: { ensemble: 0.3 },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.125, feedback: 0.3, mix: 0.3 },
      },
      hall('Room', 0.2),
    ],
    ...looped(8, 5, 3, [71, [83, 0.6]]),
  },
  {
    n: 27,
    id: 'parlour-organ-c6',
    name: 'Parlour organ {C}6',
    kind: 'pad',
    description:
      'A flute stop and its octave on {C} sixth under a tremulant, through a slowly turning speaker.',
    preset: 'window-garden-parlour-organ',
    set: { tremulant: 0.6 },
    then: [quarterTurn(8)],
    ...looped(8, 4, 3, [60, 64, [67, 0.8], [69, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 28,
    id: 'held-moment-am',
    name: 'Held moment {A}m',
    kind: 'pad',
    description:
      'One instant of a soft tone held in grains and played as {A} minor, swelling in a small room.',
    preset: 'window-garden-held-moment',
    // The preset's effects, the chorus at two turns to the loop.
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.25, mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 8000, mix: 0.2 } },
    ],
    then: [breathe(0.125, 0.35)],
    ...looped(8, 4, 3, [45, 57, [60, 0.8], [64, 0.8]]),
  },
  {
    n: 29,
    id: 'taped-reeds-fmaj7',
    name: 'Taped reeds {F}maj7',
    kind: 'pad',
    description:
      'A reed section from tape strips on {F} major seventh, swelling once a loop in a small plate.',
    preset: 'window-garden-taped-reeds',
    set: { length: 9 },
    then: [breathe(0.125, 0.4)],
    ...looped(8, 4, 3, [53, 60, [64, 0.8], [69, 0.8]]),
  },
  {
    n: 30,
    id: 'flute-stops-dm7',
    name: 'Flute stops {D}m7',
    kind: 'pad',
    description:
      'The flute ranks of a small pipe organ on {D} minor seventh, swelling once a loop.',
    preset: 'window-garden-flute-stops',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.25, mix: 0.3 } },
      hall('Room', 0.2),
    ],
    then: [breathe(0.125, 0.5), quarterTurn(8)],
    ...looped(8, 4, 2, [50, 57, [60, 0.8], [65, 0.8]]),
    tuning: 'whole-cycles',
  },
  {
    n: 31,
    id: 'low-flute-chord-cadd9',
    name: 'Low flute chord {C}add9',
    kind: 'pad',
    description:
      'Low flutes on {C} with an added ninth and almost no vibrato, swelling in a medium room.',
    preset: 'window-garden-low-flutes-together',
    // Less air than the preset's: on four notes it was close to being heard as noise.
    set: { breath: 0.25 },
    then: [breathe(0.125, 0.5), quarterTurn(8)],
    ...looped(8, 5, 2, [
      [48, 0.75],
      [55, 0.75],
      [62, 0.7],
      [64, 0.7],
    ]),
    tuning: 'whole-cycles',
  },
  {
    n: 32,
    id: 'flugelhorn-chord-am7',
    name: 'Flugelhorn chord {A}m7',
    kind: 'pad',
    description:
      'A few flugelhorns on each note of {A} minor seventh, swelling softly in a short hall.',
    preset: 'window-garden-flugelhorns-indoors',
    set: { breath: 0.2 },
    then: [breathe(0.125, 0.55)],
    ...looped(8, 5, 3, [57, 60, [64, 0.8], [67, 0.8]]),
  },
  {
    n: 33,
    id: 'voices-upstairs-c',
    name: 'Voices upstairs {C}',
    kind: 'pad',
    description:
      'High voices on a closed oo on {C} major with no vibrato, swelling once a loop in a room.',
    preset: 'window-garden-humming-upstairs',
    set: { ensemble: 0 },
    then: [breathe(0.125, 0.55), quarterTurn(8)],
    ...looped(8, 5, 2, [60, 67, [72, 0.8], [76, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 34,
    id: 'plain-tones-gsus2',
    name: 'Plain tones {G}sus2',
    kind: 'pad',
    description:
      'Near sines on {G}, {D} and {A} with an octave beneath, beating slowly in a light chorus.',
    preset: 'window-garden-plain-tones',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.75, mix: 0.3 } },
      hall('Room', 0.2),
    ],
    ...looped(8, 3, 3, [43, 55, [62, 0.8], [69, 0.7]]),
  },
  {
    n: 35,
    id: 'skylight-chord-c',
    name: 'Skylight chord {C}',
    kind: 'pad',
    description:
      'One low {C} opened into a just major chord whose soft partials come and go under air.',
    preset: 'window-garden-skylight-chord',
    set: { movement: 1, rate: 0.25 },
    then: [breathe(0.125, 0.3)],
    ...looped(8, 6, 3, [48]),
  },

  // Textures: what is on the other side of the glass, and the air of the room.
  {
    n: 36,
    id: 'breath-on-glass-d',
    name: 'Breath on glass {D}',
    kind: 'texture',
    description: 'Low flutes blown very gently into {D}, {A} and {E}: more breath than note.',
    preset: 'window-garden-breath-on-glass',
    ...looped(8, 5, 3, [50, 57, [64, 0.8]]),
  },
  {
    n: 37,
    id: 'water-under-the-bridge-loop',
    name: 'Water under the bridge',
    kind: 'texture',
    description:
      'A small stream close by with the rumble taken out, its splashes thrown back by a swarm of echoes.',
    preset: 'window-garden-water-under-the-bridge',
    ...looped(8, 3, 2, [64]),
  },
  {
    n: 38,
    id: 'rain-chain-trickle',
    name: 'Rain chain trickle',
    kind: 'texture',
    description: 'A thin, bright trickle running down a chain from the gutter, bubble by bubble.',
    preset: 'window-garden-rain-chain',
    ...looped(8, 3, 2, [67]),
  },
  {
    n: 39,
    id: 'frogs-across-the-pond-loop',
    name: 'Frogs across the pond',
    kind: 'texture',
    description:
      'Frogs calling from the far side of a pond, soft and set back in a small dark room.',
    preset: 'window-garden-frogs-across-the-pond',
    set: { density: 1 },
    then: [soften(4)],
    ...looped(16, 3, 3, [43, 48, 55, 60, 65]),
  },
  {
    n: 40,
    id: 'rain-on-the-eaves-loop',
    name: 'Rain on the eaves',
    kind: 'texture',
    description:
      'Steady rain on the roof just overhead, single drops over a patter, on clean tape.',
    preset: 'window-garden-rain-on-the-eaves',
    ...looped(8, 3, 2, [55]),
  },
  {
    n: 41,
    id: 'leaves-moving-outside',
    name: 'Leaves moving outside',
    kind: 'texture',
    description: 'Light wind in the leaves outside, rising and falling, with nothing low in it.',
    preset: 'window-garden-leaves-moving',
    ...looped(8, 4, 3, [62]),
  },
  {
    n: 42,
    id: 'five-note-breathing',
    name: 'Five-note breathing',
    kind: 'texture',
    description:
      'Two keys become soft bands of tuned noise from a five-note scale, breathing twice a loop.',
    preset: 'window-garden-five-whistling-notes',
    set: { breatheRate: 0.25, resonance: 12 },
    ...looped(8, 4, 3, [55, 62]),
  },
  {
    n: 43,
    id: 'slow-reading-of-a-brook',
    name: 'Slow reading of a brook',
    kind: 'texture',
    description:
      'A brook over stones read through slowly at its own pitch, grain by grain, nearly dry.',
    preset: 'window-garden-slow-reading',
    source: 'brook-over-stones',
    ...looped(8, 3, 3, [60]),
  },
  {
    n: 44,
    id: 'crickets-at-the-screen',
    name: 'Crickets at the screen',
    kind: 'texture',
    description:
      'Crickets in the garden after dark, heard through the screen with the top and bottom taken off.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Evening field',
      params: { distance: 0.9, movement: 0.4, attack: 1 },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 160, density: 12, scatter: 1, feedback: 0.3, mix: 0.7 },
      },
      { deviceId: 'ambient-eq', preset: 'Open', params: { lowCut: 200, highCut: 5000 } },
      hall('Room', 0.15),
    ],
    ...looped(8, 6, 2, [41, 47, 52, 57, 62, 67, 72, 77]),
  },
  {
    n: 45,
    id: 'gallery-air-vents',
    name: 'Gallery air vents',
    kind: 'texture',
    description:
      'The steady low rush of air from the vents of an empty gallery, hardly moving, in a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: {
        density: 1,
        movement: 0.1,
        tone: 0.25,
        resonance: 0,
        size: 0.6,
        attack: 1,
        width: 0.6,
      },
    },
    effects: [hall('Room', 0.15)],
    ...looped(8, 3, 2, [48]),
  },
  {
    n: 46,
    id: 'thunder-past-the-wall',
    name: 'Thunder past the wall',
    kind: 'texture',
    description: 'A storm far beyond the garden wall, its rolls of thunder overlapping, in a room.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, tone: 0.65, movement: 0.4, width: 0.8 },
    },
    effects: [soften(8), hall('Room', 0.15)],
    ...looped(16, 1, 3, [36, 43, 48, 53]),
  },
  {
    n: 47,
    id: 'wind-at-the-sliding-door',
    name: 'Wind at the sliding door',
    kind: 'texture',
    description:
      'Wind finding the gap of a sliding door: a hollow moan that rises and falls, in a room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: {
        density: 0.5,
        movement: 0.6,
        tone: 0.7,
        resonance: 0.2,
        size: 0.4,
        attack: 1,
        width: 0.7,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } }],
    ...looped(16, 6, 3, [57]),
  },

  // One-shots: one note or one chord, struck and left to ring out.
  {
    n: 48,
    id: 'porcelain-bowl-c',
    name: 'Porcelain bowl {C}',
    kind: 'oneshot',
    description: 'One soft stroke on a round bowl tone on {C}, left to ring in a small plate.',
    preset: 'window-garden-porcelain-bowl',
    ...played(8, [[0, 3, 60, 0.8]], 1.5),
  },
  {
    n: 49,
    id: 'tea-bowl-d',
    name: 'Tea bowl {D}',
    kind: 'oneshot',
    description: 'A small singing bowl struck softly on {D}, its close tones beating slowly.',
    preset: 'window-garden-tea-bowl',
    ...played(8, [[0, 5, 62, 0.8]], 1.5),
  },
  {
    n: 50,
    id: 'struck-tumbler-a',
    name: 'Struck tumbler {A}',
    kind: 'oneshot',
    description:
      'A drinking glass tapped with a fingernail on a high {A}, a glint on top, in a small plate.',
    preset: 'window-garden-struck-tumbler',
    ...played(4.5, [[0, 3, 81]], 1),
  },
  {
    n: 51,
    id: 'chime-bars-e',
    name: 'Chime bars {E}',
    kind: 'oneshot',
    description: 'One small metal bar struck on {E} and left to ring, with a gentle tape echo.',
    preset: 'window-garden-chime-bars',
    ...played(5, [[0, 2.5, 76]], 1),
  },
  {
    n: 52,
    id: 'cool-bars-g',
    name: 'Cool bars {G}',
    kind: 'oneshot',
    description:
      'One vibraphone bar on a low {G}, struck softly and left undamped in a small room.',
    preset: 'window-garden-cool-bars',
    ...played(7, [[0, 5.5, 55]], 1.5),
  },
  {
    n: 53,
    id: 'buried-jar-f',
    name: 'Buried jar {F}',
    kind: 'oneshot',
    description:
      'One small bell on {F} dripping into a patter of short echoes, like water in a jar.',
    preset: 'window-garden-buried-jar',
    ...played(3.5, [[0, 1, 77]], 1),
  },
  {
    n: 54,
    id: 'small-glockenspiel-c',
    name: 'Small glockenspiel {C}',
    kind: 'oneshot',
    description:
      'One light stroke on a high {C} of a glockenspiel, with one quiet tape repeat and a plate.',
    preset: 'window-garden-small-glockenspiel',
    ...played(5, [[0, 2, 84]], 1),
  },
  {
    n: 55,
    id: 'celesta-lesson-fmaj7',
    name: 'Celesta lesson {F}maj7',
    kind: 'oneshot',
    description:
      'An {F} major seventh rolled quietly on a celesta with soft hammers, in a small room.',
    preset: 'window-garden-celesta-lesson',
    ...played(
      4,
      [
        [0, 3, 65, 0.7],
        [0.03, 3, 69, 0.6],
        [0.06, 3, 72, 0.6],
        [0.09, 3, 76, 0.65],
      ],
      1,
    ),
  },
  {
    n: 56,
    id: 'cedar-bars-c',
    name: 'Cedar bars {C}',
    kind: 'oneshot',
    description:
      'One low marimba bar on {C} under a soft yarn mallet, round and woody, nearly dry.',
    preset: 'window-garden-cedar-bars',
    ...played(3.5, [[0, 3, 48]], 0.5),
  },
  {
    n: 57,
    id: 'steel-tongue-drum-a',
    name: 'Steel tongue drum {A}',
    kind: 'oneshot',
    description: 'A steel tongue drum touched lightly on {A}, round in tone, in a small room.',
    preset: 'window-garden-steel-tongue-drum',
    ...played(5.5, [[0, 5, 57]], 1),
  },
  {
    n: 58,
    id: 'small-strum-am',
    name: 'Small strum {A}m',
    kind: 'oneshot',
    description:
      'A quick bright strum of {A} minor down two octaves of short strings, like a toy harp.',
    preset: 'window-garden-small-strum',
    ...played(
      2.5,
      [
        [0, 2, 57],
        [0, 2, 60],
        [0, 2, 64],
      ],
      0.5,
    ),
  },
  {
    n: 59,
    id: 'plate-chimes-g',
    name: 'Plate chimes {G}',
    kind: 'oneshot',
    description:
      'One clean electronic string on {G}, bright and bell-like, with a dark echo behind it.',
    preset: 'window-garden-plate-chimes',
    ...played(4.5, [[0, 2, 67]], 1),
  },
  {
    n: 60,
    id: 'steel-left-ringing-g',
    name: 'Steel left ringing {G}',
    kind: 'oneshot',
    description:
      'Six bright steel strings strummed once on {G} major near the bridge and left to ring.',
    preset: 'window-garden-steel-left-ringing',
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
        [0.004, 6, 43, 0.7],
        [0.024, 6, 50, 0.65],
        [0.044, 6, 55, 0.65],
        [0.064, 6, 59, 0.6],
        [0.084, 6, 62, 0.6],
        [0.104, 6, 67, 0.65],
      ],
      1.5,
    ),
  },
  {
    n: 61,
    id: 'clean-electric-cmaj7',
    name: 'Clean electric {C}maj7',
    kind: 'oneshot',
    description:
      'A clean electric guitar on {C} major seventh, in a light chorus with a short spring.',
    preset: 'window-garden-clean-electric',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(
      6.5,
      [
        [0, 5.5, 48, 0.7],
        [0, 5.5, 55, 0.65],
        [0, 5.5, 59, 0.6],
        [0, 5.5, 64, 0.65],
      ],
      1,
    ),
  },
  {
    n: 62,
    id: 'gallery-upright-dm9',
    name: 'Gallery upright {D}m9',
    kind: 'oneshot',
    description:
      'A {D} minor ninth on a piano with a thin felt, its strings answering briefly in sympathy.',
    preset: 'window-garden-upright-in-the-gallery',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      6.5,
      [
        [0, 5.5, 50, 0.6],
        [0.02, 5.5, 57, 0.6],
        [0.04, 5.5, 65, 0.7],
        [0.06, 5.5, 72, 0.7],
        [0.08, 5.5, 76, 0.75],
      ],
      1,
    ),
  },
  {
    n: 63,
    id: 'soft-bass-pluck-f',
    name: 'Soft bass pluck {F}',
    kind: 'oneshot',
    description:
      'One soft plucked synthesizer bass note on a low {F}, closing over a second or so.',
    preset: 'window-garden-soft-bass-pluck',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(2.5, [[0, 2, 41]], 0.5),
  },
  {
    n: 64,
    id: 'steel-bar-bells-e',
    name: 'Steel bar bells {E}',
    kind: 'oneshot',
    description:
      'One steel guitar note picked on {E} with no swell, bright as a bell, with a chorused echo.',
    preset: 'window-garden-steel-bar-bells',
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 440, feedback: 0.35, mix: 0.12 },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Two spring tank',
        params: { decay: 2, drip: 0.25, mix: 0.18 },
      },
    ],
    ...played(6.5, [[0, 4, 64]], 1.5),
  },
  {
    n: 65,
    id: 'bamboo-knock-d',
    name: 'Bamboo knock {D}',
    kind: 'oneshot',
    description: 'One woody folded pluck on a low {D} that closes in a second, in a small room.',
    preset: 'window-garden-bamboo-knock',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(2, [[0, 1.5, 50]], 0.5),
  },
  {
    n: 66,
    id: 'hammered-string-a',
    name: 'Hammered string {A}',
    kind: 'oneshot',
    description: 'A single string on {A} struck with a felt hammer, answered by itself backwards.',
    preset: 'window-garden-hammered-string',
    ...played(8, [[0, 4, 57]], 1.5),
  },
  {
    n: 67,
    id: 'silk-strings-b',
    name: 'Silk strings {B}',
    kind: 'oneshot',
    description:
      'One silk string on {B} touched with the fingertip, bending slightly as it settles.',
    preset: 'window-garden-silk-strings',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(6, [[0, 3, 59]], 1.5),
  },
  {
    n: 68,
    id: 'museum-morning-cmaj9',
    name: 'Museum morning {C}maj9',
    kind: 'oneshot',
    description:
      'A {C} major ninth rolled on a clean electric piano, more bell than bark, in a small room.',
    preset: 'window-garden-museum-morning',
    ...played(
      5.5,
      [
        [0, 4.5, 48, 0.65],
        [0.02, 4.5, 55, 0.6],
        [0.04, 4.5, 62, 0.6],
        [0.06, 4.5, 64, 0.65],
        [0.08, 4.5, 71, 0.7],
      ],
      1,
    ),
  },
  {
    n: 69,
    id: 'sine-mallet-g',
    name: 'Sine mallet {G}',
    kind: 'oneshot',
    description:
      'A near-sine on {G} struck through a gate that darkens as it fades, with a dark echo.',
    preset: 'window-garden-sine-mallet',
    // The limiter is ahead of the echo, so the stroke comes up and its repeats stay behind it.
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 300, mix: 0.12 } },
      hall('Room', 0.2),
    ],
    ...played(3.5, [[0, 1.5, 67]], 1),
  },

  // Phrases: a few notes in free time, most of them coming round.
  {
    n: 70,
    id: 'museum-morning-am',
    name: 'Museum morning {A}m',
    kind: 'melodic',
    description:
      'Six notes of {A} minor on a clean electric piano, rising to a question and stepping back; it comes round.',
    preset: 'window-garden-museum-morning',
    ...cycled(8, [
      [0, 2.2, 69, 0.8],
      [0.92, 2, 72, 0.7],
      [1.71, 2.6, 76, 0.85],
      [3.38, 1.8, 74, 0.7],
      [4.62, 2.2, 71, 0.75],
      [5.55, 2.2, 67, 0.7],
    ]),
  },
  {
    n: 71,
    id: 'sill-in-the-sun-fmaj7',
    name: 'Sill in the sun {F}maj7',
    kind: 'melodic',
    description:
      'Two rolled tine chords, {F} major seventh then {E} minor seventh, crossing from side to side, and one high note.',
    preset: 'window-garden-sill-in-the-sun',
    ...played(
      10,
      [
        [0, 3.2, 53, 0.75],
        [0.04, 3.2, 60, 0.65],
        [0.08, 3.2, 64, 0.65],
        [0.12, 3.2, 69, 0.7],
        [3.61, 3, 52, 0.75],
        [3.65, 3, 59, 0.65],
        [3.69, 3, 62, 0.65],
        [3.73, 3, 67, 0.7],
        [6.42, 2, 76, 0.6],
      ],
      1.5,
    ),
  },
  {
    n: 72,
    id: 'stepping-stones-dm',
    name: 'Stepping stones {D}m',
    kind: 'melodic',
    description:
      'Short clipped tines stepping up {D} minor and back, each answered by a dark echo; it comes round.',
    preset: 'window-garden-stepping-stones',
    ...cycled(8, [
      [0, 0.3, 62, 0.8],
      [0.83, 0.3, 65, 0.7],
      [1.52, 0.3, 69, 0.75],
      [2.74, 0.3, 67, 0.7],
      [3.91, 0.3, 72, 0.8],
      [4.59, 0.3, 69, 0.7],
      [5.93, 0.3, 65, 0.7],
    ]),
  },
  {
    n: 73,
    id: 'pond-glass-fall-e',
    name: 'Pond glass fall {E}',
    kind: 'melodic',
    description:
      'Clear bell tines falling from a very high {E} and turning up at the end, in a slow phaser.',
    preset: 'window-garden-pond-glass',
    ...played(
      8,
      [
        [0, 1.5, 88, 0.7],
        [0.71, 1.5, 84, 0.65],
        [1.63, 1.5, 81, 0.7],
        [2.31, 2, 76, 0.7],
        [3.84, 3, 79, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 74,
    id: 'paper-screen-round-f',
    name: 'Paper screen round {F}',
    kind: 'melodic',
    description:
      'Soft, round tines low on {F}: up to {C}, back through {A} and {G} to the {C} below, one quiet tape repeat; it comes round.',
    preset: 'window-garden-paper-screen',
    ...cycled(8, [
      [0, 2, 53, 0.95],
      [1.24, 1.8, 60, 0.5],
      [2.11, 2.4, 57, 0.55],
      [4.07, 1.6, 55, 0.5],
      [5.21, 2.2, 48, 0.6],
    ]),
  },
  {
    n: 75,
    id: 'afternoon-loop-g',
    name: 'Afternoon loop {G}',
    kind: 'melodic',
    description:
      'Long-ringing tines on {G}, the last notes turning quietly underneath as a two-second loop; it comes round.',
    preset: 'window-garden-afternoon-loop',
    effects: [
      { deviceId: 'micro-looper', preset: 'Soft bed', params: { length: 2, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.6, mix: 0.2 } },
    ],
    ...cycled(8, [
      [0, 2.5, 67, 0.8],
      [1.13, 2, 71, 0.7],
      [2.42, 3, 74, 0.8],
      [4.36, 2.5, 72, 0.7],
      [5.48, 2, 69, 0.75],
    ]),
  },
  {
    n: 76,
    id: 'strings-behind-glass-c',
    name: 'Strings behind glass {C}',
    kind: 'melodic',
    description:
      'Soft tine chords on {C} and then {F}, a faint string pad growing behind each while it is held; it comes round.',
    preset: 'window-garden-strings-behind-glass',
    ...cycled(12, [
      [0, 5, 48, 0.75],
      [0.05, 5, 55, 0.65],
      [0.1, 5, 64, 0.7],
      [2.87, 2.4, 67, 0.6],
      [6.13, 5, 53, 0.75],
      [6.18, 5, 60, 0.65],
      [6.23, 5, 64, 0.7],
      [8.71, 2.6, 69, 0.6],
    ]),
  },
  {
    n: 77,
    id: 'vitrine-keys-em',
    name: 'Vitrine keys {E}m',
    kind: 'melodic',
    description:
      'An early digital electric piano turning six notes of {E} minor through a chorus; it comes round.',
    preset: 'window-garden-vitrine-keys',
    ...cycled(8, [
      [0, 1.8, 64, 0.8],
      [0.52, 1.6, 71, 0.7],
      [1.49, 2, 67, 0.75],
      [3.13, 1.5, 69, 0.7],
      [3.61, 2.2, 74, 0.8],
      [5.44, 2.4, 71, 0.7],
    ]),
  },
  {
    n: 78,
    id: 'sine-cell-c',
    name: 'Sine cell {C}',
    kind: 'melodic',
    description:
      'Three near-sine notes on {C}, each coming back quieter on a four-second tape loop; it comes round.',
    preset: 'window-garden-sine-cell',
    ...cycled(
      8,
      [
        [0, 1.5, 72, 0.8],
        [1.37, 1.5, 79, 0.7],
        [2.9, 1.5, 76, 0.75],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 79,
    id: 'vibes-at-noon-fmaj9',
    name: 'Vibes at noon {F}maj9',
    kind: 'melodic',
    description:
      'Vibraphone bars opening {F} major ninth from the bottom under a slow shallow tremolo; it comes round.',
    preset: 'window-garden-vibes-at-noon',
    ...cycled(8, [
      [0, 3, 53, 0.8],
      [0.46, 3, 60, 0.7],
      [1.03, 3, 69, 0.7],
      [1.87, 3.5, 76, 0.8],
      [3.92, 2.5, 79, 0.75],
      [5.19, 2.5, 72, 0.7],
    ]),
  },
  {
    n: 80,
    id: 'platform-chime-c',
    name: 'Platform chime {C}',
    kind: 'melodic',
    description:
      'Four bright chimes, {E}, {C}, {G} and back up to {C}, with a short tape echo, like a door signal.',
    preset: 'window-garden-platform-chime',
    // The preset's echo in twice its room: with less of the room the four notes are too loud for a phrase.
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 300, heads: 1, feedback: 0.35, mix: 0.25 },
      },
      hall('Room', 0.4),
    ],
    ...played(
      5.5,
      [
        [0, 1, 76, 0.9],
        [0.62, 1, 72, 0.5],
        [1.31, 1, 67, 0.5],
        [2.15, 2, 72, 0.6],
      ],
      1,
    ),
  },
  {
    n: 81,
    id: 'frost-on-the-basin-g',
    name: 'Frost on the basin {G}',
    kind: 'melodic',
    description:
      'Three short bright chimes, a high {G}, {D} and {E}, each scattering quick copies an octave up, in a small plate.',
    preset: 'window-garden-frost-on-the-basin',
    ...played(
      5,
      [
        [0, 0.8, 91, 0.8],
        [0.93, 0.8, 86, 0.7],
        [2.21, 1, 88, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 82,
    id: 'still-vibraphone-echo-c',
    name: 'Still vibraphone echo {C}',
    kind: 'melodic',
    description:
      'A vibraphone with its motor off on {C}, five soft notes each repeated by a chorused delay; it comes round.',
    preset: 'window-garden-still-vibraphone-echo',
    ...cycled(8, [
      [0, 2, 60, 0.8],
      [1.43, 2, 67, 0.7],
      [2.2, 2, 64, 0.75],
      [4.17, 2.5, 69, 0.8],
      [5.61, 2, 65, 0.7],
    ]),
  },
  {
    n: 83,
    id: 'dry-wood-taps-c',
    name: 'Dry wood taps {C}',
    kind: 'melodic',
    description:
      'A dry xylophone tapping up a {C} major chord and over the top, a plain echo counting after each note.',
    preset: 'window-garden-dry-wood-taps',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      5,
      [
        [0, 0.3, 72, 0.8],
        [0.41, 0.3, 76, 0.7],
        [1.12, 0.3, 79, 0.75],
        [1.93, 0.3, 76, 0.7],
        [2.52, 0.5, 84, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 84,
    id: 'kalimba-on-a-bench-a',
    name: 'Kalimba on a bench {A}',
    kind: 'melodic',
    description:
      'A kalimba rocking down in leaps from a high {E} to {A}, a short slap behind each tine; it comes round.',
    preset: 'window-garden-kalimba-on-a-bench',
    ...cycled(8, [
      [0, 1, 76, 0.8],
      [0.63, 1, 69, 0.7],
      [1.52, 1, 74, 0.75],
      [2.11, 1, 67, 0.7],
      [3.34, 1, 72, 0.75],
      [4.02, 1, 64, 0.7],
      [5.87, 1.2, 69, 0.8],
    ]),
  },
  {
    n: 85,
    id: 'bamboo-flute-alone-d',
    name: 'Bamboo flute alone {D}',
    kind: 'melodic',
    description:
      'An end-blown bamboo flute scooping into {D}, rising to a long {A} and falling back, alone in a room.',
    preset: 'window-garden-bamboo-flute-alone',
    set: { breath: 0.35 },
    ...played(
      8,
      [
        [0, 1.6, 62, 0.5],
        [1.92, 0.5, 65, 0.4],
        [2.61, 1.9, 69, 1],
        [4.83, 0.4, 67, 0.45],
        [5.35, 1.3, 62, 0.5],
      ],
      1,
    ),
  },
  {
    n: 86,
    id: 'pipes-in-the-yard-g',
    name: 'Pipes in the yard {G}',
    kind: 'melodic',
    description:
      'Pan pipes with a puff at the front of each note, five notes down from {G}, a dark echo half a second behind.',
    preset: 'window-garden-pipes-in-the-yard',
    ...played(
      8,
      [
        [0, 0.5, 79, 0.9],
        [0.62, 0.5, 74, 0.45],
        [1.47, 0.9, 76, 0.5],
        [2.93, 0.5, 71, 0.45],
        [3.56, 1.2, 74, 0.5],
      ],
      1.5,
    ),
  },
  {
    n: 87,
    id: 'cedar-bars-walk-g',
    name: 'Cedar bars walk {G}',
    kind: 'melodic',
    description:
      'A marimba walking round {G} on its middle bars, seven soft strokes at an uneven pace; it comes round.',
    preset: 'window-garden-cedar-bars',
    ...cycled(8, [
      [0, 1, 55, 0.8],
      [0.62, 1, 62, 0.7],
      [1.71, 1, 59, 0.7],
      [2.58, 1.2, 64, 0.8],
      [4.07, 1, 62, 0.7],
      [4.93, 1, 57, 0.7],
      [6.41, 1.5, 60, 0.75],
    ]),
  },
  {
    n: 88,
    id: 'glass-keys-f',
    name: 'Glass keys {F}',
    kind: 'melodic',
    description:
      'A glassy digital tone played as keys through {F} lydian, leaving a chorused echo; it comes round.',
    preset: 'window-garden-glass-keys',
    ...cycled(8, [
      [0, 1.2, 65, 0.8],
      [1.1, 1.2, 72, 0.7],
      [1.58, 1.4, 71, 0.75],
      [3.3, 1.2, 69, 0.7],
      [3.87, 1.6, 76, 0.8],
      [5.9, 1.5, 72, 0.7],
    ]),
  },
  {
    n: 89,
    id: 'chorus-pulse-keys-g',
    name: 'Chorus pulse keys {G}',
    kind: 'melodic',
    description:
      'A chorus polysynth played as keys: fifths on {G} and {E} with single notes between; it comes round.',
    preset: 'window-garden-chorus-pulse-keys',
    ...cycled(8, [
      [0, 1.5, 55, 0.8],
      [0, 1.5, 62, 0.7],
      [1.38, 1.2, 64, 0.7],
      [2.21, 1.6, 52, 0.8],
      [2.21, 1.6, 59, 0.7],
      [4.02, 1.2, 62, 0.7],
      [4.94, 2, 60, 0.75],
    ]),
  },
  {
    n: 90,
    id: 'sine-keys-e',
    name: 'Sine keys {E}',
    kind: 'melodic',
    description:
      'A sine with a quiet octave below it, four slow notes low on {E} that fade while held, with a chorused echo.',
    preset: 'window-garden-sine-keys',
    ...played(
      8,
      [
        [0, 1.6, 52, 0.8],
        [1.42, 1.2, 59, 0.7],
        [2.58, 2, 57, 0.75],
        [4.31, 2.2, 55, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 91,
    id: 'lobby-record-f',
    name: 'Lobby record {F}',
    kind: 'melodic',
    description:
      'A felted piano pressed to a clean record: a fifth on {F} with two notes over it, one on {E} with one; it comes round.',
    preset: 'window-garden-lobby-record',
    ...cycled(8, [
      [0, 3, 53, 0.7],
      [0.06, 3, 60, 0.6],
      [1.52, 2.5, 69, 0.9],
      [2.71, 2, 67, 0.85],
      [4.2, 3, 52, 0.7],
      [4.27, 3, 59, 0.6],
      [5.63, 2.2, 67, 0.9],
    ]),
  },
  {
    n: 92,
    id: 'nylon-by-the-door-c',
    name: 'Nylon by the door {C}',
    kind: 'melodic',
    description:
      'A nylon-string guitar opening a {C} major chord with the fingertips and answering from above it.',
    preset: 'window-garden-nylon-by-the-door',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0, 3, 48, 0.6],
        [0.41, 2.6, 55, 0.55],
        [0.87, 2.2, 64, 0.65],
        [1.93, 2, 67, 0.6],
        [3.12, 1.4, 65, 0.55],
        [3.86, 3.5, 64, 0.65],
        [3.9, 3.5, 48, 0.5],
      ],
      1,
    ),
  },
  {
    n: 93,
    id: 'damped-pan-taps-d',
    name: 'Damped pan taps {D}',
    kind: 'melodic',
    description:
      'Short damped taps near the edge of a hand pan round {D} minor, with a quick tape echo; it comes round.',
    preset: 'window-garden-damped-pan-taps',
    ...cycled(
      8,
      [
        [0, 0.5, 62, 0.8],
        [0.91, 0.5, 69, 0.7],
        [1.48, 0.5, 65, 0.7],
        [3.07, 0.5, 67, 0.75],
        [3.89, 0.5, 62, 0.7],
        [5.52, 0.5, 72, 0.8],
        [6.63, 0.5, 69, 0.7],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 94,
    id: 'koto-by-the-pond-e',
    name: 'Koto by the pond {E}',
    kind: 'melodic',
    description:
      'A koto leaning from {E} up to {F} and back, then stepping down to the {E} below, clear and dry in a small room.',
    preset: 'window-garden-koto-by-the-pond',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0, 1.5, 76, 0.7],
        [0.93, 0.5, 77, 0.6],
        [1.37, 2, 76, 0.7],
        [2.84, 1.2, 71, 0.65],
        [3.71, 1, 69, 0.6],
        [4.39, 0.8, 65, 0.55],
        [5.02, 2.5, 64, 0.75],
      ],
      1,
    ),
  },
  {
    n: 95,
    id: 'plucked-by-the-bridge-a',
    name: 'Plucked by the bridge {A}',
    kind: 'melodic',
    description:
      'A zither string plucked near the bridge four times, opening {A} minor upwards, dry and bright.',
    preset: 'window-garden-plucked-by-the-bridge',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
    ],
    ...played(
      7.5,
      [
        [0, 2, 57, 0.75],
        [0.84, 2, 60, 0.65],
        [1.47, 2, 64, 0.7],
        [2.96, 3, 69, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 96,
    id: 'whistled-line-g',
    name: 'Whistled line {G}',
    kind: 'melodic',
    description:
      'Four notes from {G} as narrow bands of noise with their mirrors, like whistling, with a soft dark echo.',
    preset: 'window-garden-whistled-line',
    ...played(
      8,
      [
        [0, 1.2, 67],
        [1.41, 0.8, 69],
        [2.33, 1.8, 72],
        [4.42, 2, 69],
      ],
      1.5,
    ),
  },
  {
    n: 97,
    id: 'one-plucked-string-g',
    name: 'One plucked string {G}',
    kind: 'melodic',
    description:
      'A single soft-plucked string with a wooden body on {G}, {D}, {B} and {A}, one tape repeat after each.',
    preset: 'window-garden-one-plucked-string',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0, 2, 55, 0.8],
        [1.21, 2, 62, 0.7],
        [2.37, 2.6, 59, 0.75],
        [4.3, 3, 57, 0.8],
      ],
      1,
    ),
  },
  {
    n: 98,
    id: 'glass-wind-bell-g',
    name: 'Glass wind bell {G}',
    kind: 'melodic',
    description:
      'Glass wind chimes tuned from {G}, {C} and {F}, struck five times at uneven moments; it comes round.',
    preset: 'window-garden-glass-wind-bell',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...cycled(8, [
      [0, 0.4, 79],
      [1.63, 0.4, 72],
      [2.41, 0.4, 77],
      [4.52, 0.4, 72],
      [5.37, 0.4, 79],
    ]),
    loopFold: 'power',
  },
  {
    n: 99,
    id: 'birds-past-the-pane-loop',
    name: 'Birds past the pane',
    kind: 'melodic',
    description:
      'Garden birds in several trees heard from indoors, set back on the far side of the glass.',
    preset: 'window-garden-birds-past-the-pane',
    ...looped(8, 4, 3, [48, 53, 57, 60, 64, 67, 72, 77]),
  },
  {
    n: 100,
    id: 'bird-on-the-lantern-loop',
    name: 'Bird on the lantern',
    kind: 'melodic',
    description: 'A single songbird a few steps away, phrase by phrase, almost dry.',
    preset: 'window-garden-bird-on-the-lantern',
    // It sings when it likes, the same in every key: the loop starts just before one phrase, holds two,
    // and what is folded over its start is the silence after the second.
    ...looped(10, 5.8, 0.4, [72]),
  },
])
