// The sounds of the pack "Sunburnt Laptop Guitar": its presets played, a hundred sounds to
// paint with. Numbers 18001 to 18100.

import { PRESETS } from '../packs/laptop-guitar'
import { type FactorySound } from '../types'
import { breathe, cycled, hall, looped, packSounds, played, quarterTurn, soften } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('laptop-guitar', 18000, PRESETS, [
  // --- Drones: hum, feedback and held loops, level nearly flat --------------------
  {
    n: 1,
    id: 'ground-loop-g',
    name: 'Ground loop {G}',
    kind: 'drone',
    description:
      'Mains hum tuned to {G} and its harmonics through a pentode and a slow flanger: a rig left on.',
    preset: 'laptop-guitar-ground-loop',
    set: { tone: 1, density: 1 },
    // The preset's chain with less drive and a shallower flanger that turns once a loop.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.3, lowCut: 60, tone: 0.6, highCut: 9000, output: 2 },
      },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.125, depth: 15, mix: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [43, [55, 0.8], [62, 0.4]]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'hollow-hum-d',
    name: 'Hollow hum {D}',
    kind: 'drone',
    description:
      'A hollow {D} over its sub octave, crushed to seven bits and played through a combo amp.',
    preset: 'laptop-guitar-hollow-click-bed',
    set: { detune: 0, motion: 0 },
    then: [quarterTurn(8)],
    ...looped(8, 5, 2, [50]),
    tuning: 'whole-cycles',
  },
  {
    n: 3,
    id: 'fuzz-organ-floor-c',
    name: 'Fuzz organ floor {C}',
    kind: 'drone',
    description:
      'A just major chord of partials on a low {C} through a pentode fuzz, wide and thick.',
    preset: 'laptop-guitar-fuzz-organ-floor',
    set: { rate: 0.125, movement: 0.1 },
    // The preset's chain with a fast compressor after the space: as the partials beat, it is
    // how full the wave is that moves and not its peak, which a limiter would not hold.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.6, lowCut: 50, highCut: 8000, output: -1 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, width: 0.7 } },
      {
        deviceId: 'ambient-comp',
        preset: 'Dense pad',
        params: { threshold: -50, ratio: 10, attack: 10, release: 0.1, knee: 6, makeup: 18 },
      },
    ],
    ...looped(8, 5, 2, [48]),
  },
  {
    n: 4,
    id: 'buzz-through-fuzz-g',
    name: 'Buzz through fuzz {G}',
    kind: 'drone',
    description:
      'Four buzzing strings on {G} and {D} plucked in turn into a pentode fuzz and a spectral blur.',
    preset: 'laptop-guitar-buzz-through-fuzz',
    // Twelve plucks to the loop, which starts just after the fifth; the limiter holds each
    // pluck down to the strings still ringing.
    set: { speed: 2.698, decay: 30 },
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 18, release: 0.3, ride: 0 },
      },
    ],
    ...looped(8, 2.77, 0.45, [55]),
  },
  {
    n: 5,
    id: 'monochord-memory-a',
    name: 'Monochord memory {A}',
    kind: 'pad',
    description:
      'Plain strings on {A} and {E} plucked round under a slow swell, flickers of what was played drifting back.',
    preset: 'laptop-guitar-monochord-memory',
    // Plucked as fast as it goes and ringing as long, sixteen plucks to the loop, so no
    // pluck stands out as a note; the limiter holds each one down to the strings still
    // ringing in the hall, and the swell comes round once with the loop. How level it holds
    // changes with the key (the plucks and the flickers fall by chance), so it is a pad
    // that swells and not a drone.
    set: { speed: 2, decay: 30 },
    effects: [
      { deviceId: 'echo-memory', preset: 'Flickers', params: { memory: 0.9, mix: 0.45 } },
      hall('Hall', 0.45),
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 24, release: 0.3, ride: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      breathe(0.125, 0.6),
    ],
    ...looped(8, 2.77, 0.45, [57]),
  },
  {
    n: 6,
    id: 'folding-fizz-g',
    name: 'Folding fizz {G}',
    kind: 'drone',
    description:
      'A {G} folded twice over until it fizzes, ringing against a copy shifted by two hertz.',
    preset: 'laptop-guitar-folding-drone-fizz',
    set: { drift: 0.2 },
    // The preset's chain with less of the shifted copy, so the beating stays shallow; the
    // limiter holds it level before the space, and the top of the fizz is shaded so that a
    // high key is no louder than a low one.
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Wavefold lead',
        params: { driveDb: 10, toneDb: 2, outputDb: -6.5 },
      },
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 2, width: 0.7, mix: 0.12 },
      },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 24, release: 0.3, ride: 0 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.3, width: 0.7, modDepth: 0.2 },
      },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000, clear: 0 } },
    ],
    ...looped(8, 5, 2, [55]),
  },
  {
    n: 7,
    id: 'sub-under-the-wall-c',
    name: 'Sub under the wall {C}',
    kind: 'drone',
    description: 'A plain sub tone on {C} given a transformer drive so small speakers can hear it.',
    preset: 'laptop-guitar-sub-under-wall',
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [48]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'harmonium-in-the-red-d',
    name: 'Harmonium in the red {D}',
    kind: 'drone',
    description:
      'A harmonium on {D} and {A} pushed into a pentode so the reeds fuse into one buzzing mass.',
    preset: 'laptop-guitar-harmonium-red',
    ...looped(8, 4, 2, [50, [57, 0.7]]),
  },
  {
    n: 9,
    id: 'chapel-stream-a',
    name: 'Chapel stream {A}',
    kind: 'drone',
    description:
      'Chapel flutes on {A} and {E} on a stream that freezes, its frames smeared in a cathedral.',
    preset: 'laptop-guitar-chapel-frozen',
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [57, [64, 0.7]]),
    tuning: 'whole-cycles',
  },
  {
    n: 10,
    id: 'low-loop-through-amp-d',
    name: 'Low loop through amp {D}',
    kind: 'drone',
    description:
      'A held steel guitar looped an octave down on {D}, folded over by a wavefolder into a combo.',
    preset: 'laptop-guitar-folded-loop',
    source: 'steel-guitar-drone-a',
    ...looped(8, 4, 2, [65]),
  },
  {
    n: 11,
    id: 'chapel-stream-low-g',
    name: 'Chapel stream, low {G}',
    kind: 'drone',
    description:
      'Chapel flutes low on {G}, {D} and {B} on a stream that freezes, its frames smeared in a cathedral.',
    preset: 'laptop-guitar-chapel-frozen',
    then: [quarterTurn(8)],
    ...looped(8, 6, 2, [43, [50, 0.8], [59, 0.5]]),
    tuning: 'whole-cycles',
  },
  {
    n: 12,
    id: 'loop-through-the-amp-a',
    name: 'Loop through the amp {A}',
    kind: 'drone',
    description:
      'A held steel guitar on {A} looped at its own pitch and folded over by a wavefolder into a combo.',
    preset: 'laptop-guitar-folded-loop',
    source: 'steel-guitar-drone-a',
    ...looped(8, 4, 2, [72]),
  },
  // --- Pads: chords that move, swell or swirl --------------------------------------
  {
    n: 13,
    id: 'organ-floor-lifted-g',
    name: 'Organ floor, lifted {G}',
    kind: 'pad',
    description:
      'The fuzzed just major chord of partials high on {G} with no sub, its partials wandering widely.',
    preset: 'laptop-guitar-fuzz-organ-floor',
    set: { rate: 0.125, movement: 0.9, sub: 0, cutoff: 6000 },
    then: [breathe(0.125, 0.3)],
    ...looped(8, 5, 2, [67]),
  },
  {
    n: 14,
    id: 'held-feedback-e',
    name: 'Held feedback {E}',
    kind: 'pad',
    description:
      'One string on {E} driven until it jumps the octave, through a triode and a stack: feedback that swells.',
    preset: 'laptop-guitar-held-feedback',
    // The preset's chain with the space turning three times a loop.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Triode glow',
        params: { drive: 0.7, push: 1, highCut: 8000, output: -10 },
      },
      { deviceId: 're-amp', preset: 'Warm stack', params: { room: 0.5, output: 1 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.22, width: 0.7, modRate: 0.375 },
      },
    ],
    then: [breathe(0.125, 0.55), quarterTurn(8)],
    ...looped(8, 6, 2, [52]),
    tuning: 'whole-cycles',
  },
  {
    n: 15,
    id: 'bowed-and-caught-b',
    name: 'Bowed and caught {B}',
    kind: 'pad',
    description:
      'Two bowed octaves of {B} caught and held by a sustain patch, with grains an octave up.',
    preset: 'laptop-guitar-bowed-held',
    set: { vibrato: 0, detune: 2 },
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Slow strings',
        params: { sensitivity: 0.7, decay: 8, motion: 0.2, ensemble: 0.3, mix: 0.6 },
      },
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 500, spray: 0.6, size: 300, mix: 0.2 },
      },
    ],
    then: [breathe(0.125, 0.45), quarterTurn(8)],
    ...looped(8, 8, 2, [59, [71, 0.6]]),
    tuning: 'whole-cycles',
  },
  {
    n: 16,
    id: 'buffer-held-open-e',
    name: 'Buffer held open {E}',
    kind: 'pad',
    description:
      'A guitar on {E} and {B} swelled in with no pick, blurred until it hangs in the air; it comes round.',
    preset: 'laptop-guitar-buffer-freeze',
    // The preset's chain with little smear: with more of it each swell arrives and leaves in steps.
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5, output: -4 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: {
          blur: 0.95,
          smear: 0.1,
          tilt: -1,
          lowCut: 40,
          highCut: 10000,
          shimmer: 0.3,
          width: 0.4,
          mix: 0.8,
        },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 8, width: 0.7 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...cycled(8, [
      [0, 7, 52],
      [0.02, 7, 59, 0.8],
      [0.04, 7, 64, 0.7],
    ]),
  },
  {
    n: 17,
    id: 'slide-into-fuzz-c',
    name: 'Slide into fuzz {C}',
    kind: 'pad',
    description:
      'A steel guitar on {C} and {G} swelled in through a glowing triode and blurred across a wide space.',
    preset: 'laptop-guitar-slide-static',
    ...looped(8, 1.5, 2, [48, 55, [60, 0.8]]),
  },
  {
    n: 18,
    id: 'still-steel-drift-c',
    name: 'Still steel drift {C}',
    kind: 'pad',
    description:
      'Steel strings on {C} and {G} without vibrato on warm tape, drifting by under a hertz.',
    preset: 'laptop-guitar-still-steel',
    // The preset's chain with the shift beating six times a loop.
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { drive: 0.7, hiss: 0.1, output: -6 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.75, lfoDepth: 0, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...looped(8, 3, 2, [48, [55, 0.7]]),
  },
  {
    n: 19,
    id: 'sine-and-hiss-b',
    name: 'Sine and hiss {B}',
    kind: 'pad',
    description:
      'Near-pure sines on two octaves of {B} over a soft sub, with air noise and a slow shift.',
    preset: 'laptop-guitar-sine-and-hiss',
    set: { volume: -6 },
    // The preset's chain with the shift beating ten times a loop.
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { type: 6, level: -36, tone: 0.3 },
      },
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 1.25, lfoDepth: 0, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
    ...looped(8, 4, 2, [59, [71, 0.5]]),
  },
  {
    n: 20,
    id: 'octave-fizz-em',
    name: 'Octave fizz {E}m',
    kind: 'pad',
    description:
      'A strummed {E} minor guitar chord an octave down, most of its grains thrown back up, in a plate.',
    preset: 'laptop-guitar-octave-fizz',
    source: 'guitar-chord-em',
    set: { size: 500, density: 16, spread: 0.7 },
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, breathe(0.25, 0.3)],
    ...looped(8, 4, 2, [48]),
  },
  {
    n: 21,
    id: 'glass-under-gain-f',
    name: 'Glass under gain {F}',
    kind: 'pad',
    description:
      'A glass table on {F} and {C} folded over by a wavefolder until it fizzes, hung in a spectral blur.',
    preset: 'laptop-guitar-glass-gain',
    set: { motion: 0.9, rate: 0.125 },
    // On {F} and {C} the partials the fold brings out are {A} and {E}.
    then: [breathe(0.125, 0.3)],
    ...looped(8, 4, 2, [53, 60, [65, 0.8]]),
  },
  {
    n: 22,
    id: 'vowel-packets-fmaj7',
    name: 'Vowel packets {F}maj7',
    kind: 'pad',
    description:
      'A slow vowel pad on {F} major seventh down a bad line in a hall, swelling twice a loop.',
    preset: 'laptop-guitar-vowel-packets',
    // The preset's chain with the packets sticking less often, so the chord stays a chord.
    effects: [
      {
        deviceId: 'low-bitrate',
        preset: 'Stuck stream',
        params: { loss: 0.55, stutter: 0.15, burst: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
      breathe(0.25, 0.45),
    ],
    ...looped(8, 5, 2, [53, 60, [64, 0.8], [69, 0.7]]),
  },
  {
    n: 23,
    id: 'spectral-sunburn-c',
    name: 'Spectral sunburn {C}',
    kind: 'pad',
    description:
      'A bright shifting table on two octaves of {C} overdriven by a pentode, under a halo an octave up.',
    preset: 'laptop-guitar-spectral-sunburn',
    then: [breathe(0.125, 0.55)],
    ...looped(8, 6, 2, [60, [72, 0.6]]),
  },
  {
    n: 24,
    id: 'saw-wall-a',
    name: 'Saw wall {A}',
    kind: 'pad',
    description:
      'Detuned saws on {A} and {E} through a dark fuzz and a dense grain cloud: a thick warm wall.',
    preset: 'laptop-guitar-saw-wall',
    set: { motion: 0.9, rate: 0.125 },
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...looped(8, 5, 2, [45, 57, [64, 0.8]]),
  },
  {
    n: 25,
    id: 'overexposed-brass-f',
    name: 'Overexposed brass {F}',
    kind: 'pad',
    description:
      'A slow brass pad on {F} and {C} caught by a grain cloud and clipped by a triode into a bright smear.',
    preset: 'laptop-guitar-overexposed-brass',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [65, [72, 0.8]]),
  },
  {
    n: 26,
    id: 'airy-pad-overdriven-g',
    name: 'Airy pad overdriven {G}',
    kind: 'pad',
    description:
      'An airy saw pad on {G} major driven by a transformer and split into a sharp side and a flat side.',
    preset: 'laptop-guitar-airy-overdrive',
    then: [breathe(0.25, 0.35)],
    ...looped(8, 5, 2, [55, 62, [67, 0.8], [71, 0.7]]),
  },
  {
    n: 27,
    id: 'alias-pad-em',
    name: 'Alias pad {E}m',
    kind: 'pad',
    description:
      'A crystalline pad on {E} minor sampled far too slowly, folded images ringing under a rising halo.',
    preset: 'laptop-guitar-alias-pad',
    then: [breathe(0.125, 0.4)],
    ...looped(8, 5, 2, [52, 59, [64, 0.8], [67, 0.7]]),
  },
  {
    n: 28,
    id: 'horn-swell-clipped-d',
    name: 'Horn swell, clipped {D}',
    kind: 'pad',
    description:
      'A horn section on {D} minor swelled into a tube stage, flattening as it gets loud, then blurred.',
    preset: 'laptop-guitar-horn-swell-clipped',
    ...looped(8, 4, 2, [50, 57, [62, 0.8], [65, 0.7]]),
  },
  {
    n: 29,
    id: 'ensemble-haze-a',
    name: 'Ensemble haze {A}',
    kind: 'pad',
    description:
      'The glassy stop of a string ensemble on {A} and {E} ground into a restless cloud of grains.',
    preset: 'laptop-guitar-ensemble-haze',
    // The preset's chain with longer, softer-edged grains and less of them against the
    // strings. A grain that stands out reads as a note: of what was tried this holds in the
    // most keys, and still reads as a phrase 4 semitones down and 2 and 4 up.
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { driveDb: 12, outputDb: -8 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 260, density: 50, spray: 0.6, texture: 0.1, mix: 0.5 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, breathe(0.25, 0.4)],
    ...looped(8, 5, 2, [57, 64, [69, 0.6]]),
  },
  {
    n: 30,
    id: 'symphony-in-patch-g',
    name: 'Symphony in patch {G}',
    kind: 'pad',
    description:
      'Orchestral strings on {G} and {D} off worn tape, smeared by second-long grains into a hall.',
    preset: 'laptop-guitar-symphony-in-patch',
    set: { tone: -0.7 },
    // The preset's chain with the grains denser, so none stands out.
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Slow smear',
        params: { size: 1000, density: 20, feedback: 0.45, mix: 0.55 },
      },
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.5, output: -6.5 } },
    ],
    then: [
      hall('Hall', 0.4),
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      breathe(0.125, 0.5),
    ],
    ...looped(8, 5, 2, [55, [62, 0.8]]),
  },
  {
    n: 31,
    id: 'chorale-in-grains-f',
    name: 'Chorale in grains {F}',
    kind: 'pad',
    description:
      'A horn chorale on {F} major on tape with a grainy copy one and two octaves above it.',
    preset: 'laptop-guitar-horn-chorale-grains',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [53, 57, [60, 0.8], [65, 0.7]]),
  },
  {
    n: 32,
    id: 'reed-from-nothing-d',
    name: 'Reed from nothing {D}',
    kind: 'pad',
    description: 'Clarinets on {D} and {A} left hanging in a blur and shifted so they slowly beat.',
    preset: 'laptop-guitar-reed-in-loop',
    // The preset's chain with the shift beating once a loop and little smear.
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.125, lfoDepth: 0, mix: 0.45 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, smear: 0.2, width: 0.4, mix: 0.55 },
      },
    ],
    ...looped(8, 5, 2, [62, [69, 0.8]]),
  },
  {
    n: 33,
    id: 'rubbed-bowl-fuzz-f',
    name: 'Rubbed bowl fuzz {F}',
    kind: 'pad',
    description:
      'A singing bowl on {F} rubbed until it holds, through a triode and a phaser turning once a loop.',
    preset: 'laptop-guitar-bowl-fuzz',
    set: { detune: 0 },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Triode glow',
        params: { drive: 0.7, push: 1, output: -4 },
      },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      breathe(0.125, 0.6),
      quarterTurn(8),
    ],
    // On {F} the bowl's loud upper partial, a tritone and octaves above, is a {B}.
    ...looped(8, 5, 2, [65]),
    tuning: 'whole-cycles',
  },
  {
    n: 34,
    id: 'tide-going-out-c6',
    name: 'Tide going out {C}6',
    kind: 'pad',
    description:
      'Long reversed grains creeping backwards through a steel guitar chord an octave up, shifted down a falling spiral.',
    preset: 'laptop-guitar-reverse-tide',
    source: 'steel-swell-c6',
    set: { density: 16, spray: 0.6, spread: 0.4 },
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, breathe(0.125, 0.4)],
    ...looped(8, 5, 2, [72]),
  },
  {
    n: 35,
    id: 'slow-scan-c',
    name: 'Slow scan {C}',
    kind: 'pad',
    description:
      'The opening of a steel guitar phrase on {C} an octave down, read at a twentieth of its speed, echoed in reverse.',
    preset: 'laptop-guitar-slow-scan',
    source: 'pedal-steel-sigh-c',
    // The preset's chain with the reversed echoes lower and more hall.
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Backwards shards',
        params: { time: 600, feedback: 0.4, mix: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [48]),
  },
  // --- Textures: noise that lasts, and chords ground down until no pitch is left ---
  {
    n: 36,
    id: 'half-the-song-am9',
    name: 'Half the song {A}m9',
    kind: 'texture',
    description:
      'A tape choir on {A} minor ninth an octave down, only what a thin stream discards left of it.',
    preset: 'laptop-guitar-half-remembered',
    source: 'tape-choir-am9',
    set: { fine: 0 },
    // The preset's chain keeping less, so what is left is the quiet detail and not the notes.
    effects: [
      { deviceId: 'low-bitrate', preset: 'Ghost', params: { loss: 0.45, frame: 2, smear: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    ...looped(8, 5, 2, [60]),
  },
  {
    n: 37,
    id: 'bleached-strings-cmaj7',
    name: 'Bleached strings {C}maj7',
    kind: 'texture',
    description:
      'Wide synthetic strings on {C} major seventh with the low end cut, thinned and set in a long plate.',
    preset: 'laptop-guitar-bleached-strings',
    then: [breathe(0.125, 0.5)],
    ...looped(8, 5, 2, [60, 67, [71, 0.8], [76, 0.7]]),
  },
  {
    n: 38,
    id: 'noise-chord-c',
    name: 'Noise chord {C}',
    kind: 'texture',
    description:
      'Bands of noise around {C} major seventh, levelled and pushed through a triode into a hall.',
    preset: 'laptop-guitar-noise-chord',
    set: { resonance: 25, breatheRate: 0.25 },
    // The preset's chain with the limiter pushed less, so the noise keeps its peaks.
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 3, outputGain: -8 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.5, output: -2 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...looped(8, 5, 2, [60, 64, 67, 71]),
  },
  {
    n: 39,
    id: 'breath-fizz-c',
    name: 'Breath fizz {C}',
    kind: 'texture',
    description:
      'Low flutes on {C} and {G} that are nearly all air, driven by a pentode until the breath fizzes.',
    preset: 'laptop-guitar-breath-fizz',
    // The preset's chain with the top of the fizz cut lower, so it is no louder in a high key.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Bite',
        params: { drive: 0.55, tone: 0.4, highCut: 5500, output: -6 },
      },
      { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    then: [breathe(0.125, 0.7)],
    ...looped(8, 5, 2, [48, 55, [60, 0.8]]),
  },
  {
    n: 40,
    id: 'cluster-in-the-wires-e',
    name: 'Cluster in the wires {E}',
    kind: 'texture',
    description:
      'A dark cluster of close partials around {E} with radio static riding on its level.',
    preset: 'laptop-guitar-cluster-static',
    set: { rate: 0.125 },
    ...looped(8, 8, 2, [52, 57, 62, 65]),
  },
  {
    n: 41,
    id: 'shore-down-the-line',
    name: 'Shore down the line',
    kind: 'texture',
    description:
      'Slow waves reduced to the partials a starving stream keeps: the sea as a low, swirling murmur.',
    preset: 'laptop-guitar-shore-down-line',
    ...looped(16, 6, 3, [55]),
  },
  {
    n: 42,
    id: 'filtered-burst',
    name: 'Filtered burst',
    kind: 'texture',
    description:
      'Noise through a band-pass that sweeps up and falls back, scattered into grains; it ends.',
    preset: 'laptop-guitar-noise-burst',
    ...played(8, [[0, 4.5, 60]], 1),
  },
  {
    n: 43,
    id: 'click-field-of-a-chord',
    name: 'Click field',
    kind: 'texture',
    description:
      'Fifteen-millisecond grains picked from all over a strummed guitar chord: a field of clicks.',
    preset: 'laptop-guitar-click-field',
    source: 'guitar-chord-em',
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 44,
    id: 'bow-hair-and-grit',
    name: 'Bow hair and grit',
    kind: 'texture',
    description:
      'Mostly the air of bows on four strings, through a worn converter and a cloud of short grains.',
    preset: 'laptop-guitar-bow-noise-grit',
    set: { air: 1, bow: 0.05 },
    ...looped(8, 4, 2, [55, 62, 67, 74]),
  },
  {
    n: 45,
    id: 'breath-and-bitrate',
    name: 'Breath and bitrate',
    kind: 'texture',
    description:
      'Voices that are almost all breath, smeared by frozen packets into a hiss shaped like a chord.',
    preset: 'laptop-guitar-breath-bitrate',
    // A slow swell, so that held this level it is not too loud in a high key.
    then: [breathe(0.125, 0.3)],
    ...looped(8, 5, 2, [57, 60, 64, 67, 71]),
  },
  {
    n: 46,
    id: 'laptop-fan-at-noon',
    name: 'Laptop fan at noon',
    kind: 'texture',
    description:
      'A steady wind through a worn nine-bit converter and a small speaker: a fan whirring in the heat.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { density: 0.7, movement: 0.2, tone: 0.35, resonance: 0.1, attack: 0.5, width: 0.6 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn', params: { rate: 8000, jitter: 0.3 } },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { drive: 0.3, room: 0.3 } },
    ],
    ...looped(8, 3, 2, [57]),
  },
  {
    n: 47,
    id: 'rain-down-the-line',
    name: 'Rain down the line',
    kind: 'texture',
    description:
      'Rain on a window heard down a starving stream, the drops swirling as if under water.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.7, attack: 0.5, width: 0.6 },
    },
    effects: [
      soften(14),
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { loss: 0.6, highCut: 6000 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    ...looped(8, 3, 2, [60]),
  },
  {
    n: 48,
    id: 'crackle-in-the-buffer',
    name: 'Crackle in the buffer',
    kind: 'texture',
    description:
      'The crackle of an old record caught by a skipping buffer, with a dark amp spring behind it.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Old record',
      params: { density: 0.7, attack: 0.3, width: 0.6 },
    },
    effects: [
      soften(30),
      {
        deviceId: 'glitch',
        preset: 'Skipping disc',
        params: { time: 140, chance: 0.4, repeat: 0.6, spread: 0.4, mix: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.2, width: 0.6 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
    ],
    ...looped(8, 2, 2, [55]),
  },
  {
    n: 49,
    id: 'beach-fire-low-bitrate',
    name: 'Beach fire, low bitrate',
    kind: 'texture',
    description: 'A fire crackling down a bad connection that drops and sticks, in a small plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hearth',
      params: { density: 0.6, attack: 0.5, width: 0.6 },
    },
    effects: [
      soften(14),
      {
        deviceId: 'low-bitrate',
        preset: 'Bad connection',
        params: { loss: 0.5, dropouts: 0.2, stutter: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
    ...looped(8, 3, 2, [52]),
  },
  {
    n: 50,
    id: 'sunburnt-chords-em',
    name: 'Sunburnt chords {E}m',
    kind: 'texture',
    description:
      'Slow strums of {E} minor seventh and {C} through a pentode fuzz into a grain cloud; it comes round.',
    preset: 'laptop-guitar-sunburnt-chords',
    ...cycled(12, [
      [0, 5, 40],
      [0, 5, 47],
      [0, 5, 52],
      [0, 5, 55],
      [0, 5, 62],
      [0, 5, 64],
      [6.2, 5, 48],
      [6.2, 5, 55],
      [6.2, 5, 60],
      [6.2, 5, 64],
      [6.2, 5, 67],
    ]),
  },
  // --- One-shots: one note or one strum, and what the patch does to it ----------------
  {
    n: 51,
    id: 'salt-in-the-pickups-g',
    name: 'Salt in the pickups {G}',
    kind: 'oneshot',
    description: 'One low {G} picked by the bridge through a worn converter and a small speaker.',
    preset: 'laptop-guitar-salt-pickups',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
    ],
    ...played(5, [[0, 3, 43]], 0.8),
  },
  {
    n: 52,
    id: 'sideband-strum-fmaj7',
    name: 'Sideband strum {F}maj7',
    kind: 'oneshot',
    description:
      'A strummed {F} major seventh with every partial pushed up a few hertz round a feedback loop.',
    preset: 'laptop-guitar-sideband-strum',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 5, release: 0.3, ride: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(
      5.5,
      [
        [0, 3.5, 53],
        [0, 3.5, 60],
        [0, 3.5, 64],
        [0, 3.5, 69],
        [0, 3.5, 72],
      ],
      1.5,
    ),
  },
  {
    n: 53,
    id: 'boardwalk-strum-g',
    name: 'Boardwalk strum {G}',
    kind: 'oneshot',
    description:
      'A steel-string {G} chord dragged slowly, slices of it replayed and reversed as soft stumbles.',
    preset: 'laptop-guitar-boardwalk-strum',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(
      6,
      [
        [0.004, 3.5, 43],
        [0.004, 3.5, 50],
        [0.004, 3.5, 55],
        [0.004, 3.5, 59],
        [0.004, 3.5, 62],
        [0.004, 3.5, 67],
      ],
      1.5,
    ),
  },
  {
    n: 54,
    id: 'nylon-under-noise-d',
    name: 'Nylon under noise {D}',
    kind: 'oneshot',
    description:
      'One round nylon {D} pushed into a tape preamp, radio static rising and falling with the pluck.',
    preset: 'laptop-guitar-nylon-noise',
    ...played(5, [[0, 3, 62]], 0.8),
    skipSec: 0.02,
  },
  {
    n: 55,
    id: 'picked-bell-bits-g',
    name: 'Picked bell bits {G}',
    kind: 'oneshot',
    description:
      'One hard-picked steel {G} through an unfiltered converter, stacked again in octaves.',
    preset: 'laptop-guitar-picked-bits',
    // The preset's chain with the pick held down before the repeats, which are lower and
    // trail the note.
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy', params: { rate: 10000 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
      {
        deviceId: 'cascade',
        preset: 'Glass rain',
        params: { time: 170, repeats: 6, decay: 0.4, mix: 0.22 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    ...played(4, [[0, 2, 67]], 1),
  },
  {
    n: 56,
    id: 'loop-shard-d',
    name: 'Loop shard {D}',
    kind: 'oneshot',
    description:
      'A sliver of a nylon string moved to {D}, run back and forth and shifted so it rings like metal.',
    preset: 'laptop-guitar-loop-shard',
    source: 'nylon-string-a',
    set: { release: 0.9 },
    // The preset's chain with the shift at 196 Hz (over a {D} its first partials land near
    // {B}, {G} and {F}) and less of it: the shift is in hertz and does not follow the key.
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 196, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    // A tap of the key: held, the turns of the sliver come louder than its start in some keys
    // and read as more notes.
    ...played(3, [[0.004, 0.12, 65]], 0.8),
  },
  {
    n: 57,
    id: 'harp-cut-up-f',
    name: 'Harp cut-up {F}',
    kind: 'oneshot',
    description:
      'One harp string on {F} with a hard chop of itself an octave down and a short reversed room.',
    preset: 'laptop-guitar-harp-cut-ups',
    ...played(3.5, [[0, 2, 65]], 1),
  },
  {
    n: 58,
    id: 'bell-tines-blurred-g',
    name: 'Bell tines, blurred {G}',
    kind: 'oneshot',
    description:
      'One bell-like tine on {G} with a halo of its own upper spectrum, blooming an octave up.',
    preset: 'laptop-guitar-bell-tines-blurred',
    ...played(8, [[0, 2.5, 67]], 1.5),
    skipSec: 0.02,
  },
  {
    n: 59,
    id: 'bitten-bass-a',
    name: 'Bitten bass {A}',
    kind: 'oneshot',
    description:
      'One low {A} on a plucked ladder-filter bass sampled at six kilohertz, with a single slapback.',
    preset: 'laptop-guitar-bitten-bass',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(2, [[0, 1.5, 45]], 0.5),
  },
  {
    n: 60,
    id: 'strum-plate-shards-am7',
    name: 'Strum plate shards {A}m7',
    kind: 'oneshot',
    description:
      'A strummed chord harp on {A} minor seventh broken into slices that repeat, skip and jump octaves.',
    preset: 'laptop-guitar-strum-plate-shards',
    set: { strum: 6 },
    ...played(
      5,
      [
        [0, 1.5, 57],
        [0, 1.5, 60],
        [0, 1.5, 64],
        [0, 1.5, 67],
      ],
      1,
    ),
  },
  {
    n: 61,
    id: 'zither-haze-d',
    name: 'Zither haze {D}',
    kind: 'oneshot',
    description:
      'Doubled zither courses strummed in octaves on {D} through a triode, melted to a bright haze.',
    preset: 'laptop-guitar-zither-haze',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
    ],
    ...played(8, [[0, 3, 62]], 1.5),
    skipSec: 0.02,
  },
  {
    n: 62,
    id: 'vibes-looped-back-f',
    name: 'Vibes, looped back {F}',
    kind: 'oneshot',
    description:
      'One vibraphone {F} with its motor on, over a loop of itself played backwards in a long plate.',
    preset: 'laptop-guitar-vibes-loop-back',
    // The preset's chain with the backwards loop lower, so it stays behind the note.
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { fade: 0.5, mix: 0.22 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
    ],
    ...played(10, [[0, 2.5, 65]], 3),
  },
  {
    n: 63,
    id: 'hammered-pixels-a',
    name: 'Hammered pixels {A}',
    kind: 'oneshot',
    description:
      'One hammered dulcimer {A} in octaves through an eight-bit line, pattering round short echoes.',
    preset: 'laptop-guitar-hammered-pixels',
    set: { roll: 0 },
    ...played(6, [[0, 2.5, 69]], 1),
  },
  {
    n: 64,
    id: 'sub-drop-g',
    name: 'Sub drop {G}',
    kind: 'oneshot',
    description:
      'One plain sub tone on {G} given a transformer drive, held two seconds and let go.',
    preset: 'laptop-guitar-sub-under-wall',
    ...played(4, [[0, 2.2, 43]], 0.5),
  },
  // --- Phrases: a few notes in free time, and what the buffer makes of them -----------
  {
    n: 65,
    id: 'twelve-string-glitter-c',
    name: 'Twelve string glitter {C}',
    kind: 'melodic',
    description:
      'A twelve-string picked up through {C} with a ninth, shattered into grains an octave up; it comes round.',
    preset: 'laptop-guitar-twelve-glitter',
    ...cycled(8, [
      [0, 2.5, 48, 0.8],
      [0.62, 2.2, 55, 0.7],
      [1.38, 2, 64, 0.75],
      [2.71, 2.4, 62, 0.7],
      [4.4, 2.6, 67, 0.8],
    ]),
  },
  {
    n: 66,
    id: 'deckchair-notes-c',
    name: 'Deckchair notes {C}',
    kind: 'melodic',
    description:
      'Clean neck-pickup notes rising on {C} and falling back, repeated and dropped by a skipping buffer.',
    preset: 'laptop-guitar-deckchair-strum',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...cycled(8, [
      [0, 1.6, 60, 0.8],
      [0.83, 1.4, 64, 0.7],
      [1.71, 1.9, 67, 0.75],
      [3.02, 2.2, 69, 0.8],
      [4.61, 1.4, 67, 0.65],
      [5.52, 2, 64, 0.7],
    ]),
  },
  {
    n: 67,
    id: 'stuck-on-the-bridge-g',
    name: 'Stuck on the bridge {G}',
    kind: 'melodic',
    description:
      'Short muted notes around a low {G} clipped by a console and repeated on the spot into a dark echo.',
    preset: 'laptop-guitar-stuck-bridge',
    ...cycled(8, [
      [0, 0.3, 43, 0.8],
      [0.41, 0.3, 43, 0.6],
      [1.19, 0.3, 50, 0.7],
      [2.3, 0.3, 47, 0.7],
      [2.74, 0.3, 50, 0.6],
      [3.62, 0.4, 55, 0.8],
      [5.07, 0.3, 52, 0.7],
      [5.9, 0.3, 50, 0.65],
    ]),
  },
  {
    n: 68,
    id: 'chopped-fingerstyle-am',
    name: 'Chopped fingerstyle {A}m',
    kind: 'melodic',
    description:
      'Picked steel strings opening up {A} minor, a hard chop replaying each note an octave down.',
    preset: 'laptop-guitar-chopped-fingers',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(
      8,
      [
        [0, 2, 45, 0.8],
        [0.52, 1.5, 52, 0.65],
        [1.13, 1.5, 57, 0.7],
        [1.86, 1.8, 60, 0.7],
        [3.21, 2, 64, 0.8],
        [4.47, 1.2, 59, 0.65],
        [5.3, 2.2, 57, 0.7],
      ],
      1.5,
    ),
  },
  {
    n: 69,
    id: 'postcard-nylon-dm',
    name: 'Postcard nylon {D}m',
    kind: 'melodic',
    description:
      'A thumbed nylon guitar falling through {D} minor, handed back in reverse a moment later.',
    preset: 'laptop-guitar-postcard-nylon',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...played(
      8,
      [
        [0, 2.5, 50, 0.8],
        [0.06, 2.5, 57, 0.6],
        [1.04, 1, 65, 0.8],
        [1.83, 0.9, 64, 0.7],
        [2.55, 1.6, 62, 0.75],
        [4.02, 1.1, 60, 0.7],
        [4.93, 2, 57, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 70,
    id: 'backwards-slides-e',
    name: 'Backwards slides {E}',
    kind: 'melodic',
    description:
      'One steel string sliding from {E} up to {B}, then {G} up to {E}, answered by reversed grains.',
    preset: 'laptop-guitar-long-slide-smear',
    set: { swell: 0.05, pick: 0.8 },
    ...cycled(12, [
      [0, 2.3, 64, 0.8],
      [1.9, 2.6, 71, 0.75],
      [5.3, 2.4, 67, 0.75],
      [7.2, 2.9, 76, 0.8],
    ]),
  },
  {
    n: 71,
    id: 'singing-steel-fuzz-a',
    name: 'Singing steel fuzz {A}',
    kind: 'melodic',
    description:
      'A slide lead with a deep bar vibrato through a pentode fuzz and tape echo, rising from {A} and falling.',
    preset: 'laptop-guitar-singing-fuzz',
    set: { swell: 0.02 },
    // The preset's chain with the fuzz lower, so the loud note stands above the rest.
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { drive: 0.35, output: -1 } },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 420, mix: 0.28 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
    ...cycled(12, [
      [0, 1.1, 69, 0.5],
      [1.72, 0.8, 72, 0.5],
      [3.3, 1.9, 76, 1],
      [6.1, 0.6, 74, 0.45],
      [7.05, 0.9, 72, 0.45],
      [8.6, 1.6, 69, 0.55],
    ]),
  },
  {
    n: 72,
    id: 'pier-lights-e',
    name: 'Pier lights {E}',
    kind: 'melodic',
    description:
      'Single bright notes high over {E}, their repeats rebuilt an octave up and scattered like glitter.',
    preset: 'laptop-guitar-pier-lights',
    ...cycled(8, [
      [0, 1.2, 76, 0.8],
      [1.31, 1, 83, 0.7],
      [2.07, 1.4, 81, 0.75],
      [3.9, 1.2, 77, 0.7],
      [5.2, 1.6, 72, 0.75],
    ]),
  },
  {
    n: 73,
    id: 'borrowed-bar-dm9',
    name: 'Borrowed bar {D}m9',
    kind: 'melodic',
    description:
      'A bar of an electric piano on {D} minor ninth looped through an early sampler and made to skip.',
    preset: 'laptop-guitar-borrowed-bar',
    source: 'electric-piano-dm9',
    ...cycled(8, [[0, 7.5, 60]]),
  },
  {
    n: 74,
    id: 'stutter-patch-am',
    name: 'Stutter patch {A}m',
    kind: 'melodic',
    description:
      'Hard-edged grains stepping through a kalimba pattern in {A} minor, crushed to a few bits.',
    preset: 'laptop-guitar-stutter-patch',
    source: 'kalimba-pattern-am',
    ...cycled(8, [
      [0, 1.3, 60, 0.8],
      [1.52, 0.8, 72, 0.7],
      [2.71, 1.6, 60, 0.8],
      [4.6, 0.7, 48, 0.75],
      [5.44, 1.9, 60, 0.8],
    ]),
  },
  {
    n: 75,
    id: 'vibes-bad-disc-g',
    name: 'Vibes, bad disc {G}',
    kind: 'melodic',
    description:
      'A soft vibraphone tune climbing from {G} on a disc that skips: notes cut short and repeated.',
    preset: 'laptop-guitar-vibes-bad-disc',
    ...played(
      8,
      [
        [0, 1.5, 67, 0.8],
        [0.71, 1.2, 71, 0.7],
        [1.33, 1.6, 74, 0.75],
        [2.58, 2, 76, 0.85],
        [4.22, 1.3, 74, 0.7],
        [5.09, 2, 71, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 76,
    id: 'vibes-line-looped-am',
    name: 'Vibes line, looped {A}m',
    kind: 'melodic',
    description:
      'A vibraphone with its motor on in {A} minor, over a loop of the last seconds played backwards.',
    preset: 'laptop-guitar-vibes-loop-back',
    ...cycled(12, [
      [0, 2.5, 57, 0.8],
      [1.1, 2.2, 64, 0.7],
      [2.37, 2.6, 72, 0.8],
      [4.6, 2, 71, 0.7],
      [6.9, 2.4, 67, 0.75],
      [8.8, 2.6, 64, 0.8],
    ]),
  },
  {
    n: 77,
    id: 'glockenspiel-rain-g',
    name: 'Glockenspiel rain {G}',
    kind: 'melodic',
    description:
      'Hard glockenspiel notes over {G} that come back as sparse grains an octave up, climbing and thinning.',
    preset: 'laptop-guitar-glockenspiel-rain',
    ...cycled(8, [
      [0, 1, 79, 0.8],
      [0.93, 1, 86, 0.7],
      [2.21, 1.2, 83, 0.75],
      [3.84, 0.9, 88, 0.7],
      [4.57, 1.4, 86, 0.75],
    ]),
  },
  {
    n: 78,
    id: 'music-box-buffering-c',
    name: 'Music box, buffering {C}',
    kind: 'melodic',
    description:
      'A music box tune in {C} down a stuck stream: notes swirl and whole packets repeat in bursts.',
    preset: 'laptop-guitar-music-box-buffering',
    ...played(
      8,
      [
        [0, 0.8, 76, 0.8],
        [0.41, 0.8, 79, 0.7],
        [1.13, 1.2, 84, 0.85],
        [2.52, 0.8, 83, 0.7],
        [3.05, 1.4, 79, 0.75],
        [4.71, 1.5, 76, 0.8],
      ],
      1.5,
    ),
    skipSec: 0.07,
  },
  {
    n: 79,
    id: 'steel-pan-pixels-d',
    name: 'Steel pan pixels {D}',
    kind: 'melodic',
    description:
      'A hand-played steel pan circling {D} minor through an eight-bit converter, grain repeats climbing.',
    preset: 'laptop-guitar-steel-pixels',
    ...cycled(
      8,
      [
        [0, 1.5, 62, 0.8],
        [0.84, 1.2, 69, 0.65],
        [1.6, 1.5, 72, 0.7],
        [3.12, 1.2, 65, 0.7],
        [3.77, 1.4, 69, 0.65],
        [5.4, 1.8, 64, 0.75],
      ],
      { passes: 2 },
    ),
  },
  {
    n: 80,
    id: 'harp-cut-ups-g',
    name: 'Harp cut-ups {G}',
    kind: 'melodic',
    description:
      'A concert harp opening up from a low {G} and stepping down, with hard chops of itself an octave down.',
    preset: 'laptop-guitar-harp-cut-ups',
    ...played(
      8,
      [
        [0, 2, 43, 0.8],
        [0.08, 2, 50, 0.7],
        [1.02, 1.6, 59, 0.75],
        [1.93, 1.5, 62, 0.8],
        [3.1, 1.4, 69, 0.85],
        [4.21, 1.2, 67, 0.7],
        [5.05, 2, 62, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 81,
    id: 'koto-in-the-patch-e',
    name: 'Koto in the patch {E}',
    kind: 'melodic',
    description:
      'Silk strings stepping round {E}, each pluck flattened and scattered at once into short grains.',
    preset: 'laptop-guitar-koto-granulator',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
    ],
    ...cycled(8, [
      [0, 1.4, 64, 0.85],
      [0.77, 1.2, 65, 0.7],
      [1.8, 1.6, 69, 0.8],
      [3.31, 1.2, 71, 0.75],
      [4.12, 1.3, 69, 0.7],
      [5.46, 1.8, 64, 0.8],
    ]),
  },
  {
    n: 82,
    id: 'piano-and-haze-f',
    name: 'Piano and haze {F}',
    kind: 'melodic',
    description:
      'A close felt piano over {F} with a raised fourth, a haze of its own spectrum hanging behind.',
    preset: 'laptop-guitar-piano-and-haze',
    ...cycled(8, [
      [0, 3.4, 53, 0.6],
      [0.07, 3.4, 60, 0.55],
      [1.2, 2, 69, 0.9],
      [2.13, 1.8, 71, 0.9],
      [3.4, 2.2, 67, 0.85],
      [5.1, 2.4, 64, 0.85],
    ]),
  },
  {
    n: 83,
    id: 'piano-starved-am',
    name: 'Piano, starved {A}m',
    kind: 'melodic',
    description:
      'A soft upright falling through {A} minor to a low fifth, as if behind glass, over a backwards loop of itself.',
    preset: 'laptop-guitar-piano-starved',
    ...cycled(
      8,
      [
        [0.02, 1.8, 76, 0.9],
        [0.83, 1.6, 72, 0.85],
        [2.07, 2.4, 69, 0.9],
        [3.52, 3.2, 45, 0.5],
        [3.58, 3.2, 52, 0.45],
        [5.63, 1.9, 71, 0.85],
      ],
      { passes: 2 },
    ),
    // The loop behind it never plays the same twice, so the passes are folded by power.
    loopFold: 'power',
  },
  {
    n: 84,
    id: 'pipes-then-backwards-g',
    name: 'Pipes, then backwards {G}',
    kind: 'melodic',
    description:
      'Chiffy pan pipes climbing from {G} and turning back, each note handed back in reverse.',
    preset: 'laptop-guitar-pipes-backwards',
    set: { breath: 0.35 },
    ...played(
      8,
      [
        [0, 0.9, 67, 0.8],
        [1.08, 0.7, 69, 0.7],
        [1.82, 1.3, 72, 0.8],
        [3.5, 1.5, 74, 0.85],
        [4.8, 0.7, 72, 0.7],
        [5.4, 1, 69, 0.75],
      ],
      1.5,
    ),
  },
  {
    n: 85,
    id: 'trumpet-on-the-beach-d',
    name: 'Trumpet on the beach {D}',
    kind: 'melodic',
    description:
      'A muted trumpet from a small transistor radio with a little static, a slow call on {D} minor.',
    preset: 'laptop-guitar-transistor-trumpet',
    // The preset's chain with no fading: every pass is the same call, so it comes round.
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { static: 0.08, fading: 0, bandwidth: 0.6, speaker: 0.7 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    ...cycled(12, [
      [0.02, 1.6, 62, 0.8],
      [1.85, 1.2, 65, 0.75],
      [3.22, 2.6, 69, 0.9],
      [6.42, 1.3, 67, 0.75],
      [7.92, 0.9, 64, 0.7],
      [8.97, 1.8, 62, 0.8],
    ]),
    loopFold: 'power',
  },
  {
    n: 86,
    id: 'subtone-packets-b',
    name: 'Subtone packets {B}',
    kind: 'melodic',
    description:
      'A breathy subtone reed low on {B} down a bad connection that drops out and sticks on a packet.',
    preset: 'laptop-guitar-subtone-packets',
    ...cycled(8, [
      [0.5, 1.7, 47, 0.8],
      [2.4, 1.1, 50, 0.75],
      [3.65, 1.6, 52, 0.85],
      [5.52, 0.9, 55, 0.75],
      [6.5, 1.1, 52, 0.8],
    ]),
    loopFold: 'power',
  },
  {
    n: 87,
    id: 'bitten-bass-line-e',
    name: 'Bitten bass line {E}',
    kind: 'melodic',
    description:
      'A plucked ladder-filter bass walking up from a low {E}, sampled at six kilohertz, with a slapback.',
    preset: 'laptop-guitar-bitten-bass',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...cycled(8, [
      [0, 0.9, 40, 0.9],
      [1.12, 0.5, 40, 0.7],
      [1.63, 0.9, 43, 0.8],
      [2.91, 1.3, 45, 0.85],
      [4.6, 0.6, 47, 0.75],
      [5.13, 0.6, 45, 0.7],
      [5.77, 1.4, 43, 0.8],
    ]),
  },
  {
    n: 88,
    id: 'pixel-dulcimer-line-c',
    name: 'Pixel dulcimer line {C}',
    kind: 'melodic',
    description:
      'Single hammered dulcimer strokes over {C} through an eight-bit line, pattering round short echoes.',
    preset: 'laptop-guitar-hammered-pixels',
    set: { roll: 0 },
    ...cycled(8, [
      [0, 1.5, 72, 0.8],
      [0.55, 1.3, 67, 0.7],
      [2.2, 1.6, 76, 0.85],
      [2.95, 1.2, 74, 0.7],
      [5.3, 2, 72, 0.8],
    ]),
  },
  {
    n: 89,
    id: 'folded-pluck-restruck-c',
    name: 'Folded pluck restruck {C}',
    kind: 'melodic',
    description:
      'Bright folded plucks on {C}, {G}, {E} and {A}, each restruck by little loops of itself in a plate.',
    preset: 'laptop-guitar-folded-pluck',
    // The preset's chain with each pluck held down before it is restruck.
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { jitter: 0.25, drive: 14 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 360, repeats: 5, mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } },
    ],
    ...cycled(8, [
      [0, 1.5, 60, 0.8],
      [1.37, 1.5, 67, 0.75],
      [3.05, 1.8, 64, 0.8],
      [5.21, 1.6, 69, 0.75],
    ]),
  },
  {
    n: 90,
    id: 'bell-tines-round-am',
    name: 'Bell tines round {A}m',
    kind: 'melodic',
    description:
      'Bell-like tines opening up {A} minor with a halo of their own upper spectrum; it comes round.',
    preset: 'laptop-guitar-bell-tines-blurred',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0, 2, 57, 0.7],
      [0.74, 1.8, 64, 0.7],
      [1.6, 2, 72, 0.85],
      [3.12, 1.6, 76, 0.8],
      [4.5, 1.5, 74, 0.7],
      [5.62, 1.9, 71, 0.75],
    ]),
  },
  {
    n: 91,
    id: 'stuck-harmony-c',
    name: 'Stuck harmony {C}',
    kind: 'melodic',
    description:
      'Oohs on {C} major and then {A} minor caught by a sticking buffer, like a single that will not play.',
    preset: 'laptop-guitar-stuck-harmony',
    ...cycled(12, [
      [0.5, 4.4, 60],
      [0.5, 4.4, 64],
      [0.5, 4.4, 67],
      [6.6, 4.3, 57],
      [6.6, 4.3, 60],
      [6.6, 4.3, 64],
    ]),
    loopFold: 'power',
  },
  {
    n: 92,
    id: 'zither-haze-round-em',
    name: 'Zither haze round {E}m',
    kind: 'melodic',
    description:
      'Doubled zither courses strummed in octaves down through {E} minor, melted to a bright haze.',
    preset: 'laptop-guitar-zither-haze',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0, 2.5, 76, 0.8],
      [1.3, 2.2, 71, 0.7],
      [2.52, 2.4, 67, 0.75],
      [4.4, 2.6, 64, 0.8],
    ]),
  },
  {
    n: 93,
    id: 'sub-with-dropouts-e',
    name: 'Sub with dropouts {E}',
    kind: 'melodic',
    description:
      'A low square wave walking up from {E} over its sub, on a stream that loses packets.',
    preset: 'laptop-guitar-sub-dropouts',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0, 3.3, 40, 0.9],
      [3.52, 1.9, 43, 0.85],
      [5.61, 2, 45, 0.9],
    ]),
  },
  {
    n: 94,
    id: 'nylon-line-in-static-f',
    name: 'Nylon line in static {F}',
    kind: 'melodic',
    description:
      'Round nylon notes falling through {F} major to a close on {F}, static rising with every pluck.',
    preset: 'laptop-guitar-nylon-noise',
    // The preset's chain with the static 8 dB lower: the notes stay the louder part.
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { drive: 0.55, output: -4 } },
      {
        deviceId: 'noise-floor',
        preset: 'Riding hiss',
        params: { type: 5, level: -38, response: 0.3, tone: 0.3 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.35 } },
    ],
    ...cycled(8, [
      [0, 1.5, 72, 0.8],
      [0.62, 1.4, 69, 0.7],
      [1.55, 2, 65, 0.85],
      [3.31, 1.2, 67, 0.7],
      [3.9, 1.3, 60, 0.7],
      [5.2, 2, 65, 0.8],
    ]),
  },
  {
    n: 95,
    id: 'ringing-dissolve-e',
    name: 'Ringing dissolve {E}',
    kind: 'melodic',
    description:
      'Open steel strings picked up through {E} minor and dissolved into a dark wash; it comes round.',
    preset: 'laptop-guitar-ring-dissolve',
    ...cycled(8, [
      [0, 4, 64, 0.8],
      [0.9, 4, 71, 0.7],
      [2.1, 4, 76, 0.8],
      [3.9, 4, 79, 0.75],
    ]),
  },
  {
    n: 96,
    id: 'low-ding-blurred-c',
    name: 'Low ding, blurred {C}',
    kind: 'melodic',
    description:
      'A low tongue drum on {C} and {G} struck softly, its ring left hanging as a dark blur.',
    preset: 'laptop-guitar-low-ding-blur',
    // The preset's chain with the blur keeping its phases: scattered, they smear notes this
    // low over the keys beside them and ripple like more strokes.
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.65, lowBump: 0.3, output: -13 },
      },
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { blur: 0.85, smear: 0.2, tilt: -1.5, lowCut: 80, width: 0.2, mix: 0.55 },
      },
    ],
    ...cycled(8, [
      [0, 3, 48, 0.8],
      [2.3, 2.5, 55, 0.7],
      [4.7, 3, 48, 0.75],
    ]),
  },
  {
    n: 97,
    id: 'pop-chords-clipped-c',
    name: 'Pop chords, clipped {C}',
    kind: 'melodic',
    description:
      'Chorus-polysynth stabs of {C} and {F} in bare fifths, hard-clipped, with slips of the buffer.',
    preset: 'laptop-guitar-pop-chord-clipped',
    ...played(
      8,
      [
        [0.004, 1.6, 60],
        [0.004, 1.6, 67],
        [0.004, 1.6, 72],
        [2.7, 0.8, 60],
        [2.7, 0.8, 67],
        [2.7, 0.8, 72],
        [4.3, 2, 65],
        [4.3, 2, 72],
        [4.3, 2, 77],
      ],
      1.5,
    ),
  },
  {
    n: 98,
    id: 'bridge-clicks-d',
    name: 'Bridge clicks {D}',
    kind: 'melodic',
    description:
      'Muted plucks around {D} folded by a low sample rate into metal ticks and scattered by a grain delay.',
    preset: 'laptop-guitar-muted-clicks',
    ...cycled(8, [
      [0, 0.3, 62, 0.85],
      [0.52, 0.3, 62, 0.6],
      [1.4, 0.3, 65, 0.75],
      [2.6, 0.3, 67, 0.8],
      [3.91, 0.3, 65, 0.7],
      [4.37, 0.3, 62, 0.75],
    ]),
  },
  {
    n: 99,
    id: 'salt-pickup-line-a',
    name: 'Salt pickup line {A}',
    kind: 'melodic',
    description:
      'A dull baritone line up from a low {A} and back, through a worn converter and a small speaker.',
    preset: 'laptop-guitar-salt-pickups',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(
      8,
      [
        [0.004, 1.4, 45, 0.85],
        [0.97, 1.2, 48, 0.7],
        [1.83, 1.6, 52, 0.8],
        [3.31, 1.1, 50, 0.7],
        [4.12, 2.6, 45, 0.8],
      ],
      1.5,
    ),
  },
  {
    n: 100,
    id: 'sideband-notes-e',
    name: 'Sideband notes {E}',
    kind: 'melodic',
    description:
      'Single notes opening up {E} minor, every partial pushed up a few hertz so each phases against itself.',
    preset: 'laptop-guitar-sideband-strum',
    then: [{ deviceId: 'stereo-widener', preset: 'Narrow' }],
    ...cycled(8, [
      [0.02, 2.2, 52, 0.8],
      [1.13, 2, 59, 0.7],
      [2.41, 2.4, 67, 0.8],
      [4.36, 1.6, 64, 0.7],
      [5.48, 2, 62, 0.75],
    ]),
  },
])
