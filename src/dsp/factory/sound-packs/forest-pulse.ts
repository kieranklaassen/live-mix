// The sounds of the pack "Pulse under the Forest": its presets played, a hundred sounds to
// paint with. Numbers 14001 to 14100.

import { PRESETS } from '../packs/forest-pulse'
import { type FactorySound } from '../types'
import { breathe, cycled, looped, packSounds, played, quarterTurn } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('forest-pulse', 14000, PRESETS, [
  // Drones: one level held, low to high. The steady ones are tuned to whole cycles and turned a quarter.
  {
    n: 1,
    id: 'root-floor-f',
    name: 'Root floor {F}',
    kind: 'drone',
    description:
      'A soft sub bass holding one low {F}, nearly a pure tone, breathing a little in a hall.',
    // One voice and no beating between its oscillators: a tone this plain sits at the top of the loudness a drone may have.
    preset: 'forest-pulse-root-floor',
    set: { beat: 0 },
    then: [breathe(0.125, 0.2), quarterTurn(8)],
    ...looped(8, 2, 2, [41]),
    tuning: 'whole-cycles',
  },
  {
    n: 2,
    id: 'dark-trunk-strings-e',
    name: 'Dark trunk strings {E}',
    kind: 'drone',
    description:
      'Muted bows on a low {E}, {B} and the {E} above, one to a note, low-passed, held level in a cathedral.',
    // One player a note: six of them beat against each other and the level moved like a pad. The upper {E} is there
    // so the pitch is still heard three keys down, where the low fifth alone was taken for noise. The limiter that
    // holds the level stands before the cathedral, in place of the preset's compressor: last in the chain it left a
    // wave so even that the drone was too loud in one key. It leaves a little DC, which the high-pass at 25 Hz takes out.
    preset: 'forest-pulse-dark-trunk-strings',
    set: { players: 1, scatter: 0, vibrato: 0 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 520, resonance: 0.9 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 24, release: 0.3, ride: 0 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.55, damping: 2500 } },
    ],
    then: [{ deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 25 } }],
    ...looped(8, 6, 3, [40, 47, 52]),
  },
  {
    n: 3,
    id: 'octaves-under-moss-a',
    name: 'Octaves under moss {A}',
    kind: 'drone',
    description: 'Low octaves on {A} and {E} standing still under a low-pass filter, in a hall.',
    // The preset's tremolo is left out and the partials stop wandering: this is the floor, not the throb.
    preset: 'forest-pulse-throbbing-low-octaves',
    set: { movement: 0, attack: 1 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 300 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [45, 52]),
    tuning: 'whole-cycles',
  },
  {
    n: 4,
    id: 'bass-reed-under-b',
    name: 'Bass reed under {B}',
    kind: 'drone',
    description:
      'A bass clarinet on a low {B} with half-speed copies an octave below it, in a cathedral.',
    // One note, tuned to whole cycles: with its octave played too the two beat once a loop in some keys and it was a pad.
    // The half-speed copies are two seconds long, four to the loop, and do not wander.
    preset: 'forest-pulse-bass-reed-under',
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2000, jitter: 0, mix: 0.6 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [quarterTurn(8)],
    ...looped(8, 3, 2, [47]),
    tuning: 'whole-cycles',
  },
  {
    n: 5,
    id: 'night-horn-floor-f',
    name: 'Night horn floor {F}',
    kind: 'drone',
    description:
      'Soft synthetic horns on {F} and {C} standing on their own half-speed octave below, in a cathedral.',
    // An octave above the dark strings before it and a little brighter than the preset, so the horns are heard over their floor.
    // The half-speed layer leaves a little DC that the limiter lifts: a high-pass at 25 Hz takes it out.
    preset: 'forest-pulse-night-horn-floor',
    set: { detune: 0, swell: 0, brilliance: 800 },
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 20, release: 0.3, ride: 0 },
      },
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 25 } },
      quarterTurn(8),
    ],
    ...looped(8, 4, 2, [53, 60]),
    tuning: 'whole-cycles',
  },
  {
    n: 6,
    id: 'cello-loop-slowed-g',
    name: 'Cello loop slowed {G}',
    kind: 'drone',
    description:
      'A bowed cello on {G} and {D} going round a slowed tape loop, held level, in a hall.',
    preset: 'forest-pulse-cello-loop-slowed',
    set: { vibrato: 0 },
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 20, release: 0.3, ride: 0 },
      },
      { deviceId: 'auto-filter', params: { type: 1, slope: 0, cutoffHz: 25 } },
      quarterTurn(8),
    ],
    ...looped(8, 5, 2, [43, 50]),
    tuning: 'whole-cycles',
  },
  {
    n: 7,
    id: 'lidded-fold-drone-d',
    name: 'Lidded fold drone {D}',
    kind: 'drone',
    description:
      'A wavefolded tone on {D} and {A}, a bare fifth under a still low-pass lid, in a cathedral.',
    // The lid does not move here and the frequency shifter is the quarter turn of the loop. A fifth and no octave:
    // {D} with its octave beat once a loop in three keys. The lid stands at 800 Hz, not 500: with only two
    // partials left under it the tone was at the top of the loudness a drone may have.
    preset: 'forest-pulse-lidded-fold-drone',
    set: { drift: 0 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 800 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.2), quarterTurn(8)],
    ...looped(8, 4, 2, [50, 57]),
    tuning: 'whole-cycles',
  },
  {
    n: 8,
    id: 'shellac-reed-organ-d',
    name: 'Shellac reed organ {D}',
    kind: 'drone',
    description:
      'A pump organ on {D} and {A} from a crackling 78, with a half-speed octave below it.',
    // Bellows and celeste off: both rock the level.
    preset: 'forest-pulse-shellac-reed-organ',
    set: { bellows: 0, celeste: 0 },
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 24, release: 0.3, ride: 0 },
      },
    ],
    ...looped(8, 3, 2, [50, 57]),
  },
  {
    n: 9,
    id: 'stacked-loops-c',
    name: 'Stacked loops {C}',
    kind: 'drone',
    description:
      'A string machine on {C} and {G}, doubled an octave and a fourth below into stacked fifths.',
    // Only {C} and {G} are played: the fourth below turns a third into a note outside the key.
    preset: 'forest-pulse-stacked-loops',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 20, release: 0.3, ride: 0 },
      },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
    ],
    ...looped(8, 4, 2, [48, 55, 60]),
  },
  {
    n: 10,
    id: 'three-phase-haze-e',
    name: 'Three phase haze {E}m7',
    kind: 'pad',
    description:
      'A string machine on {E} minor seventh breathing through its three-phase chorus and seasick tape.',
    // A pad among the drones: a seventh chord that the chorus and the tape keep moving. Pinned flat by the limiter
    // alone it was called a drone, and stood on the line between the two in every key.
    preset: 'forest-pulse-three-phase-haze',
    then: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 18, release: 0.3, ride: 0 },
      },
      breathe(0.125, 0.45),
    ],
    ...looped(8, 3, 2, [52, 59, 62, 67]),
  },
  {
    n: 11,
    id: 'bright-clearing-c',
    name: 'Bright clearing {C}sus2',
    kind: 'drone',
    description:
      'Taped flutes high on {C}, {D} and {G} with a reversed echo an octave up and a shimmer.',
    preset: 'forest-pulse-bright-clearing',
    then: [
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 12, release: 0.3, ride: 0 },
      },
    ],
    ...looped(8, 4, 2, [72, 74, 79]),
  },
  // Pads: chords that swell and fall back once or twice a loop, low to high after the monochord.
  {
    n: 12,
    id: 'plain-strings-slowed-a',
    name: 'Plain strings slowed {A}',
    kind: 'pad',
    description:
      'A monochord on {A} plucked round without its buzz, its half-speed octave under it, on wobbling tape.',
    // A pad: pinned flat by the limiter alone it was called a drone, and was a drone in ten keys and a pad in two.
    // The limiter stays, before the hall, so no single pluck of the round stands out as a note, and the breath
    // after it all is the swell. The half-speed layer is cut below 30 Hz: it left a little DC.
    preset: 'forest-pulse-plain-strings-slowed',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { lowCut: 30, mix: 0.6 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 20, release: 0.3, ride: 0 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.6)],
    ...looped(8, 5, 2, [57, 69]),
  },
  {
    n: 13,
    id: 'low-brass-fog-a',
    name: 'Low brass fog {A}',
    kind: 'pad',
    description:
      'A low brass choir on {A} and {E}, a little dissolved in a spectral blur, in a cathedral.',
    // Less smear than the preset's: fully scrambled, the blur flutters and the brass is heard as a row of hits.
    // A smaller section too: at full size its players beat fast a key up, and each beat was a hit.
    preset: 'forest-pulse-low-brass-fog',
    set: { attack: 1, section: 0.6 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.3, mix: 0.4, highCut: 5000, width: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
      { deviceId: 'stereo-widener', params: { width: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [45, 52, 57]),
  },
  {
    n: 14,
    id: 'ensemble-behind-trees-b',
    name: 'Ensemble behind trees {B}',
    kind: 'pad',
    description:
      "A string machine's cellos on {B} and {E}, an open fourth, on a slowly warping record, in a very long space.",
    // No pops, a gentler warp and a deeper breath: two keys down the record's ticks and wobble were heard as notes.
    // An open fourth an octave up, for the low {B}, {G} and {D}: that chord repeats so slowly that in the low keys
    // its pitch was not heard, and the sound was a texture.
    preset: 'forest-pulse-ensemble-behind-trees',
    set: { attack: 1 },
    effects: [
      { deviceId: 'vinyl', preset: 'Slow platter', params: { pops: 0, warp: 0.3 } },
      { deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.6), { deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 4, 2, [59, 64, 71]),
    loopFold: 'linear',
  },
  {
    n: 15,
    id: 'standing-section-d',
    name: 'Standing section {D}',
    kind: 'pad',
    description:
      'Still strings on {D} and {A} caught by a sustainer, a phaser turning once a loop, on a plate.',
    preset: 'forest-pulse-standing-section',
    set: { width: 0 },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { ensemble: 0, mix: 0.6 } },
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 700, rate: 0.125, stereo: 0, mix: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.3 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.3 } }, quarterTurn(8)],
    ...looped(8, 4, 2, [50, 57, 62]),
    tuning: 'whole-cycles',
  },
  {
    n: 16,
    id: 'lidded-horns-d',
    name: 'Lidded horns {D}m',
    kind: 'pad',
    description:
      'A horn section on {D} minor under a low-pass lid that opens and closes once a loop.',
    // The lid turns at 1/8 Hz, once a loop, where the preset turns it at 0.06 Hz.
    preset: 'forest-pulse-lidded-horns',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.4 } },
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 1,
          cutoffHz: 450,
          resonance: 1.1,
          lfoAmount: 45,
          lfoRateHz: 0.125,
          lfoShape: 0,
        },
      },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
    ],
    ...looped(8, 3, 1.5, [50, 57, 62, 65]),
  },
  {
    n: 17,
    id: 'hollow-reed-haze-d',
    name: 'Hollow reed haze {D}m',
    kind: 'pad',
    description:
      'A hollow clarinet section on {D} minor on thin wobbling tape, hung in mist, in a hall.',
    // A younger tape: the dropouts of the worn one were heard as hits.
    preset: 'forest-pulse-hollow-reed-haze',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.25, age: 0.2 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { smear: 0.4, mix: 0.5, width: 0.7 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 1.5, [50, 57, 62, 65]),
  },
  {
    n: 18,
    id: 'low-vowels-fog-e',
    name: 'Low vowels in fog {E}',
    kind: 'pad',
    description:
      'Low monks on {E} and {B}, one voice a note, lightly blurred, breathing in a cathedral.',
    preset: 'forest-pulse-low-vowels-fog',
    set: { ensemble: 0, vibrato: 0, attack: 1 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { smear: 0.2, mix: 0.4, width: 0.45 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [52, 59, 64]),
  },
  {
    n: 19,
    id: 'vowels-doubled-below-e',
    name: 'Vowels doubled below {E}m',
    kind: 'pad',
    description:
      'Slow vowels on {E} minor, one voice a note, doubled an octave below, in a breathing room.',
    preset: 'forest-pulse-vowels-doubled-below',
    set: { ensemble: 0, vibrato: 0, attack: 1 },
    then: [breathe(0.125, 0.6)],
    ...looped(8, 4, 1.5, [52, 59, 64, 67]),
  },
  {
    n: 20,
    id: 'hollow-under-water-e',
    name: 'Hollow under water {E}',
    kind: 'pad',
    description:
      'A hollow wavetable on {E} and {B} through a low-bitrate codec, as if heard under water.',
    // The table moves once a loop (the preset's 0.07 Hz is half a turn in eight seconds).
    preset: 'forest-pulse-hollow-under-water',
    set: { rate: 0.125 },
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [52, 59, 64]),
  },
  {
    n: 21,
    id: 'tremolo-strings-haze-e',
    name: 'Tremolo strings haze {E}m',
    kind: 'pad',
    description:
      "Hammers rolled fast on doubled strings on {E} minor, blurred into an orchestra's tremolo.",
    // A faster roll, nearly all of it blurred and no smear at all: a shimmer, not nine hits a second.
    // Even a little smear flutters, and two keys down the flutter was heard as a row of notes.
    preset: 'forest-pulse-tremolo-strings-haze',
    set: { roll: 14 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 1400 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0, mix: 0.85, width: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.5 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [52, 59, 64, 67]),
  },
  {
    n: 22,
    id: 'flea-market-f',
    name: 'Flea market {F}maj7',
    kind: 'pad',
    description:
      'Taped strings on {F} major seventh off a worn record with its pops, low-passed, in a wide space.',
    preset: 'forest-pulse-flea-market-strings',
    then: [breathe(0.25, 0.45)],
    ...looped(8, 3, 1.5, [53, 60, 64, 69]),
  },
  {
    n: 23,
    id: 'spires-in-fog-f',
    name: 'Spires in fog {F}',
    kind: 'pad',
    description:
      'Distant organ pipes on {F} and {C}, a little dissolved, breathing in a cathedral.',
    preset: 'forest-pulse-spires-in-fog',
    set: { attack: 1 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.2, mix: 0.5, width: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.45 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [53, 60, 65]),
  },
  {
    n: 24,
    id: 'fir-horn-loop-f',
    name: 'Fir horn loop {F}',
    kind: 'pad',
    description:
      'A taped horn chorale on {F} and {C} going round a two-second tape loop, in a breathing room.',
    preset: 'forest-pulse-fir-horn-loop',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 5, 2, [53, 60, 65]),
  },
  {
    n: 25,
    id: 'low-flutes-smeared-f',
    name: 'Low flutes smeared {F}',
    kind: 'pad',
    description: 'Low flutes on {F} and {C} smeared by a slow grain cloud, swelling twice a loop.',
    // Less of the grain cloud than the preset has: four keys up its grains stood out one by one and were heard as notes.
    preset: 'forest-pulse-low-flutes-smeared',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    then: [breathe(0.25, 0.45), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 3, 1.5, [53, 60, 65, 72]),
  },
  {
    n: 26,
    id: 'half-speed-chorale-c',
    name: 'Half speed chorale {C}',
    kind: 'pad',
    description:
      'A horn section on {C} major played at half speed an octave down, shaded, in a cathedral.',
    preset: 'forest-pulse-half-speed-chorale',
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.3 } }],
    ...looped(8, 5, 2, [48, 55, 60, 64]),
  },
  {
    n: 27,
    id: 'steel-without-edges-c',
    name: 'Steel without edges {C}',
    kind: 'pad',
    description:
      'A pedal steel on {C}, {G} and {E} with no pick, half dissolved in a blur, on a long plate.',
    preset: 'forest-pulse-steel-without-edges',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.5, mix: 0.6, width: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.6), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 4, 2, [48, 55, 64]),
    tuning: 'whole-cycles',
  },
  {
    n: 28,
    id: 'rubbed-glass-below-c',
    name: 'Rubbed glass below {C}',
    kind: 'pad',
    description:
      'Rubbed glasses on {C} and {G} with a sub octave under them, hung in a little mist, in a hall.',
    preset: 'forest-pulse-rubbed-glass-below',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { smear: 0.2, mix: 0.4, width: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 3, [60, 67]),
  },
  {
    n: 29,
    id: 'cellos-under-fog-g',
    name: 'Cellos under fog {G}',
    kind: 'pad',
    description:
      'Taped cellos at half speed on {G} and {D}, lightly blurred into dark water, in a cathedral.',
    preset: 'forest-pulse-cellos-under-fog',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { smear: 0.2, mix: 0.4, width: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 1.5, [55, 62, 67]),
  },
  {
    n: 30,
    id: 'slow-phase-reeds-g',
    name: 'Slow phase reeds {G}',
    kind: 'pad',
    description:
      'Taped reeds at half speed on {G} and {D} in a twelve-stage phaser turning once a loop.',
    preset: 'forest-pulse-slow-phase-reeds',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Twelve stage cloud',
        params: { rate: 0.125, stereo: 90, mix: 0.5 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4, highCut: 5000 } },
    ],
    then: [breathe(0.125, 0.3), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 3, 2, [55, 62, 67, 74]),
  },
  {
    n: 31,
    id: 'brass-through-fog-g',
    name: 'Brass through fog {G}',
    kind: 'pad',
    description:
      'Slow synthetic brass on {G} and {D}, blooming and hanging in a mist, on a long plate.',
    // Less than half the preset's smear: at 0.7 the mist flutters, and in three keys the flutter was heard as hits.
    preset: 'forest-pulse-brass-through-fog',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { blur: 0.8, smear: 0.3, width: 0.7, mix: 0.6 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 5, 1.5, [55, 62, 67]),
    loopFold: 'linear',
  },
  {
    n: 32,
    id: 'canopy-fog-a',
    name: 'Canopy fog {A}m',
    kind: 'pad',
    description:
      'Muted strings on {A} minor swelling through a spectral blur into a dark open space.',
    // Three players a note and a fifth of the smear: the full section fully blurred has no pitch left (see the fog texture).
    preset: 'forest-pulse-canopy-fog',
    set: { players: 3, scatter: 0.3, attack: 1 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.2, mix: 0.6, width: 0.5 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.35, highCut: 4000, width: 0.6 },
      },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [57, 64, 69, 72]),
  },
  {
    n: 33,
    id: 'warped-evening-a',
    name: 'Warped evening {A}',
    kind: 'pad',
    description:
      'A chorused synth pad on {A} and {E} blooming and bending on a warped record, in a hall.',
    preset: 'forest-pulse-warped-evening-pad',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [57, 64, 69]),
  },
  {
    n: 34,
    id: 'far-horn-call-a',
    name: 'Far horn call {A}m',
    kind: 'pad',
    description:
      'Horns on {A} minor, each with a fifth above it, swelling once a loop among sparse far echoes.',
    preset: 'forest-pulse-far-horn-call',
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 1.5, [57, 64, 72]),
  },
  {
    n: 35,
    id: 'wrong-speed-strings-d',
    name: 'Wrong speed strings {D}m',
    kind: 'pad',
    description:
      'A warm string section on {D} minor off a warped record at half speed, an octave down, in a cathedral.',
    // No bow noise, no vibrato and the players closer in tune: three keys up their beating was heard as a row of hits. The half-speed copies are two
    // seconds long, four to the loop, and do not wander: at the preset's 2.4 s they did not come round.
    preset: 'forest-pulse-wrong-speed-strings',
    set: { bow: 0, vibrato: 0, scatter: 0.15 },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { surface: 0.2, warp: 0.45, crackle: 0.2, pops: 0, wear: 0.4, tone: -0.3 },
      },
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { length: 2000, jitter: 0, highCut: 6000 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45), { deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...looped(8, 4, 2, [62, 69, 74, 77]),
  },
  {
    n: 36,
    id: 'flugel-going-under-f',
    name: 'Flugel going under {F}',
    kind: 'pad',
    description:
      'Breathy flugelhorns on {F} major through a chorus, a shimmer pulling them an octave down.',
    // The chorus turns once a loop, where the preset's turns at 0.08 Hz.
    preset: 'forest-pulse-flugel-going-under',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.125, mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.4 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 3, 1.5, [65, 69, 72]),
  },
  // Bars lifted from the bank and played back by the grain synth.
  {
    n: 37,
    id: 'one-bar-in-mist-d',
    name: 'One bar in mist {D}sus2',
    kind: 'pad',
    description:
      'A bar of phased strings on {D} suspended second frozen in grains, hung in mist, in a cathedral.',
    preset: 'forest-pulse-one-bar-in-mist',
    source: 'phased-strings-dsus2',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Hanging mist',
        params: { smear: 0.3, mix: 0.5, width: 0.7 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 1.5, [60]),
  },
  {
    n: 38,
    id: 'backwards-bar-e',
    name: 'Backwards bar {E}m7',
    kind: 'pad',
    description:
      'A bar of chamber strings on {E} minor seventh in backwards grains with a slowed bed, on a record.',
    // The bar is as long as the loop, so what is folded over the start is the start again: a linear fold.
    // A cleaner pressing than the preset's: five keys up its crackle and pops were heard as notes.
    preset: 'forest-pulse-backwards-bar',
    source: 'chamber-strings-em7',
    set: { density: 14, size: 1400 },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'New pressing',
        params: { surface: 0.2, crackle: 0.15, pops: 0, wear: 0.4 },
      },
      { deviceId: 'half-speed', preset: 'Fifth down bed' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } },
    ],
    then: [breathe(0.125, 0.45)],
    ...looped(8, 4, 2, [60]),
    loopFold: 'linear',
  },
  // Textures: the wood itself, the record with no music on it, and the one far kick.
  {
    n: 39,
    id: 'heartbeat-under-leaves',
    name: 'Heartbeat under leaves',
    kind: 'texture',
    description:
      'One far kick on {F} each time round, low-passed, under the crackle of an old record.',
    // The 2 Hz saws that make the kick run free, so the key goes down as one of their turns starts (2.5 s, 10.5 s)
    // and the note is over before the next, which would strike it again: one kick, and a pulse every eight seconds is no beat.
    // What is folded over the start is crackle, not the same wave twice: an equal-power fold.
    preset: 'forest-pulse-kick-under-leaves',
    set: { ampRelease: 0.12 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 140 } },
      { deviceId: 'noise-floor', preset: 'Old record', params: { level: -26 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    ...cycled(8, [[2.5, 0.36, 41]]),
    loopFold: 'power',
  },
  {
    n: 40,
    id: 'empty-groove-crackle',
    name: 'Empty groove crackle',
    kind: 'texture',
    description:
      'The crackle of an old record with no music on it, slowed to half speed and saturated, in a room.',
    preset: 'forest-pulse-empty-groove',
    ...looped(8, 2, 1.5, [48]),
  },
  {
    n: 41,
    id: 'wind-in-hollow-trunks',
    name: 'Wind in hollow trunks',
    kind: 'texture',
    description:
      'Noise tuned by drifting bands on {E} phrygian, like wind in hollow trunks, in an open space.',
    preset: 'forest-pulse-hollow-trunk-wind',
    set: { breatheRate: 0.125 },
    ...looped(8, 3, 1.5, [40, 47]),
  },
  {
    n: 42,
    id: 'thunder-past-the-ridge',
    name: 'Thunder past the ridge',
    kind: 'texture',
    description: 'A far storm with its thunder slowed an octave down, in an open space.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 1, movement: 0.4, width: 0.8 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
    ...looped(8, 1, 2, [36, 43, 48]),
  },
  {
    n: 43,
    id: 'fog-between-trunks',
    name: 'Fog between trunks',
    kind: 'texture',
    description:
      'Six muted strings a note on six notes at once, wholly dissolved by a spectral blur: fog with no pitch.',
    preset: 'forest-pulse-canopy-fog',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 5, 2, [45, 52, 59, 62, 64, 67]),
  },
  {
    n: 44,
    id: 'fir-cluster-air',
    name: 'Fir cluster air',
    kind: 'texture',
    description:
      'A wandering cluster of close partials with air in it over record crackle, in an open space.',
    // Five partials a key: the sixth and seventh of the cluster are a major sixth and a minor second, off the key over {A} and {D}.
    preset: 'forest-pulse-cluster-among-firs',
    set: { attack: 2, partials: 0.57 },
    ...looped(8, 5, 2, [50, 57]),
  },
  {
    n: 45,
    id: 'bows-in-grain-mist',
    name: 'Bows in grain mist',
    kind: 'texture',
    description:
      'Whispering bows on {G} and {D} cut into slow grains an octave down, in a dark bloom.',
    preset: 'forest-pulse-grain-mist-bows',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 6, 3, [55, 62, 67]),
  },
  {
    n: 46,
    id: 'wind-over-the-canopy',
    name: 'Wind over the canopy',
    kind: 'texture',
    description:
      'Hill wind blurred into dark water, in an open space: the weather above the trees.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { movement: 0.15, attack: 1, width: 0.6 },
    },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { smear: 0.85, mix: 0.4, width: 0.6 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35, highCut: 4000 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
    ],
    ...looped(8, 3, 2, [50]),
  },
  {
    n: 47,
    id: 'rain-on-the-canopy',
    name: 'Rain on the canopy',
    kind: 'texture',
    description: 'A distant downpour on the canopy, low-passed, in a wide open space.',
    preset: 'forest-pulse-canopy-rain',
    set: { attack: 1 },
    ...looped(8, 2, 1.5, [55]),
  },
  {
    n: 48,
    id: 'dawn-birds-slowed',
    name: 'Dawn birds slowed',
    kind: 'texture',
    description:
      'A dawn chorus slowed to half speed, each call an octave down, in a wide open space.',
    preset: 'forest-pulse-slow-birds',
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...looped(8, 5, 3, [48, 55, 60, 64, 67, 72]),
  },
  {
    n: 49,
    id: 'stream-in-the-clearing',
    name: 'Stream in the clearing',
    kind: 'texture',
    description: 'A small stream through a slow phaser with a glassy shimmer two octaves above it.',
    // The phaser turns once a loop: at the preset's 0.06 Hz the loop ended half a turn from where it began.
    preset: 'forest-pulse-clearing-stream',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.4 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.3 } },
    ],
    ...looped(8, 2, 1.5, [64]),
  },
  {
    n: 50,
    id: 'drips-after-rain',
    name: 'Drips after rain',
    kind: 'texture',
    description: 'Sparse rain drops on a pane among far echoes, held up by a limiter.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 0.25, width: 0.6, attack: 1 },
    },
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 18, release: 0.3, ride: 0 },
      },
    ],
    ...looped(8, 2, 1.5, [60]),
  },
  {
    n: 51,
    id: 'breath-among-trunks',
    name: 'Breath among trunks',
    kind: 'texture',
    description:
      'Sung breath with almost no voice in it, in and out once a loop through a slow phaser, in a dark well.',
    preset: 'forest-pulse-breath-between-trees',
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.125, mix: 0.5 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { width: 0.7, mix: 0.4 } },
    ],
    then: [
      { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -30 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
      breathe(0.125, 0.35),
    ],
    ...looped(8, 4, 1.5, [43, 50]),
  },
  // One-shots. First the far kick, one thump at a time and never a rhythm: the echoes and tremolos that keep
  // the presets going are cut to a single repeat or left out.
  {
    n: 52,
    id: 'floor-thump-c',
    name: 'Floor thump {C}',
    kind: 'oneshot',
    description:
      'A quarter second of soft sub bass on a low {C}, through tape weight, dying in a hall.',
    preset: 'forest-pulse-root-floor',
    set: { beat: 0 },
    ...played(2.5, [[0, 0.25, 36]], 0.4),
  },
  {
    n: 53,
    id: 'thump-through-moss-e',
    name: 'Thump through moss {E}',
    kind: 'oneshot',
    description:
      'One soft sub thump on a low {E} through tape saturation and a low-pass, in a small room.',
    // Without the preset's square tremolo: held, it is four kicks to the bar.
    preset: 'forest-pulse-four-through-moss',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2 } },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 130 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.12 } },
    ],
    ...played(2, [[0, 0.22, 40]], 0.3),
  },
  {
    n: 54,
    id: 'wooden-heartbeat-g',
    name: 'Wooden heartbeat {G}',
    kind: 'oneshot',
    description:
      'One soft marimba bar on a low {G} and its single faint echo, low-passed, in a small room.',
    // The echo at half its level: louder, it was a second hit from two keys up.
    preset: 'forest-pulse-wooden-heartbeat',
    effects: [
      {
        deviceId: 'analog-delay',
        params: { time: 300, feedback: 0, modDepth: 0, tone: 1500, age: 0.3, spread: 0, mix: 0.15 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 400 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...played(3, [[0, 0.5, 43]], 0.3),
  },
  {
    n: 55,
    id: 'knock-on-bark-a',
    name: 'Knock on bark {A}',
    kind: 'oneshot',
    description: 'A short low knock on {A} with a few fading tape echoes, in a spring reverb.',
    preset: 'forest-pulse-knock-on-bark',
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 5, release: 0.3, ride: 0 } },
      {
        deviceId: 'tape-echo',
        params: {
          time: 375,
          feedback: 0.3,
          heads: 3,
          wow: 0.2,
          flutter: 0.1,
          drive: 0.4,
          lowCut: 40,
          highCut: 1800,
          spread: 0.6,
          mix: 0.3,
        },
      },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.4 } },
    ],
    ...played(3.5, [[0, 0.15, 45]], 0.5),
  },
  {
    n: 56,
    id: 'heartbeat-below-c',
    name: 'Heartbeat below {C}',
    kind: 'oneshot',
    description:
      'One low thump on {C} and its single faint echo a third of a second on, low-passed, in a small room.',
    // The limiter is before the echo: after it, the echo came up level with the thump and the sound was two hits.
    preset: 'forest-pulse-heartbeat-below',
    effects: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 10, release: 0.3, ride: 0 },
      },
      {
        deviceId: 'analog-delay',
        params: { time: 320, feedback: 0, modDepth: 0, tone: 1000, age: 0.2, spread: 0, mix: 0.25 },
      },
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 300 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    ...played(2, [[0, 0.3, 48]], 0.3),
  },
  {
    n: 57,
    id: 'next-room-kick-d',
    name: 'Next room kick {D}',
    kind: 'oneshot',
    description:
      'One kick on {D} heard through the wall, limited, then re-amped down a hall through a stack.',
    // Less of the room than the preset's hall: at 0.7 its low echoes came back out of phase and, three and four keys up,
    // the sides were louder than the middle. The filter closes over 0.6 s, not 0.3: the shorter thump was over so
    // soon that its pitch was not a clear {D}.
    preset: 'forest-pulse-next-room-kick',
    set: { decay: 0.6 },
    effects: [
      {
        deviceId: 'ambient-limiter',
        preset: 'Pinned',
        params: { gain: 14, release: 0.3, ride: 0 },
      },
      {
        deviceId: 're-amp',
        preset: 'Down the hall',
        params: { speaker: 2, room: 0.4, bass: 1, treble: -0.6, noise: 0.05, output: 4.5 },
      },
    ],
    ...played(2, [[0, 0.4, 50]], 0.4),
  },
  {
    n: 58,
    id: 'kick-under-leaves-f',
    name: 'Kick under leaves {F}',
    kind: 'oneshot',
    description:
      'One sine kick on {F} falling a little in pitch as it dies, low-passed, in a small room.',
    // A sixth of the pitch fall of the preset, which swept the kick across the black keys. The note is over
    // before the saws that shape it turn again at half a second: held longer, the kick was struck twice.
    preset: 'forest-pulse-kick-under-leaves',
    set: { lfo2Amount: 0.08, ampRelease: 0.12 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 220 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    ...played(2, [[0, 0.36, 53]], 0.3),
  },
  {
    n: 59,
    id: 'pad-turned-kick-g',
    name: 'Pad turned kick {G}',
    kind: 'oneshot',
    description:
      'A third of a second of a square-wave pad and its sub on {G} under a low-pass at 110 Hz: a thump.',
    // The filter stands still: the preset's sawtooth sweep is the kick at two a second, and swept the note off the key.
    preset: 'forest-pulse-pad-turned-kick',
    set: { release: 0.15 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 110, resonance: 0.8 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
    ...played(2, [[0, 0.3, 43]], 0.3),
  },
  // Single notes and chords, low to high.
  {
    n: 60,
    id: 'ground-swell-e',
    name: 'Ground swell {E}',
    kind: 'oneshot',
    description:
      'A bass note on a low {E} whose filter opens and closes slowly, through a deep chorus.',
    preset: 'forest-pulse-ground-swell',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 6, release: 0.3, ride: 0 } },
    ],
    ...played(6, [[0, 4, 40]], 1.5),
  },
  {
    n: 61,
    id: 'slowed-salon-piano-g',
    name: 'Slowed salon piano {G}',
    kind: 'oneshot',
    description:
      "A felted piano's open {G} chord off a worn record with its half-speed octave below, in a hall.",
    preset: 'forest-pulse-slowed-salon-piano',
    ...played(
      6,
      [
        [0, 3.5, 43],
        [0.02, 3.5, 55],
        [0.04, 3.5, 62],
      ],
      2,
    ),
  },
  {
    n: 62,
    id: 'strum-under-water-a',
    name: 'Strum under water {A}m',
    kind: 'oneshot',
    description:
      'A slow strum of {A} minor on a clean guitar, its echo returning reversed an octave down, blurred.',
    // The blur holds everything back by some 40 ms: that much less a breath is skipped, here and wherever a struck sound is blurred.
    preset: 'forest-pulse-strum-under-water',
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { mix: 0.2 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { smear: 0.3, mix: 0.35, width: 0.3 },
      },
    ],
    ...played(
      7,
      [
        [0, 3, 45],
        [0, 3, 52],
        [0, 3, 57],
        [0, 3, 60],
        [0, 3, 64],
      ],
      2.5,
    ),
    skipSec: 0.02,
  },
  {
    n: 63,
    id: 'low-bass-step-b',
    name: 'Low bass step {B}',
    kind: 'oneshot',
    description:
      'One short pedal bass note on {B}, its filter opening with the note, dying in a dark hall.',
    // A hall for the preset's plate, which under one low note came out wider than it was loud in the middle, and a
    // shorter key: held for a second and a half the note was a pad in two keys.
    preset: 'forest-pulse-slow-bass-walk',
    effects: [
      {
        deviceId: 'auto-filter',
        params: {
          type: 0,
          slope: 0,
          cutoffHz: 320,
          resonance: 1.4,
          envAmount: 20,
          envAttackMs: 200,
          envReleaseMs: 900,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
    ...played(4, [[0, 0.7, 47]], 1.2),
  },
  {
    n: 64,
    id: 'harp-sweep-on-wax-c',
    name: 'Harp sweep on wax {C}',
    kind: 'oneshot',
    description:
      'One quick sweep up a harp over {C} major from a low {C}, on a lightly crackling record, in a hall.',
    // Without the tape loop, which never lets a sweep end. The harp sweeps the keys that go down together: six of
    // them in an eighth of a second, since at the preset's 0.8 s the sweep is a row of plucks and no single stroke.
    preset: 'forest-pulse-looped-harp-sweep',
    set: { sweep: 0.12, decay: 1.6 },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { surface: 0.2, crackle: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(
      6,
      [
        [0, 3, 48],
        [0, 3, 55],
        [0, 3, 60],
        [0, 3, 64],
        [0, 3, 67],
        [0, 3, 72],
      ],
      1.5,
    ),
  },
  {
    n: 65,
    id: 'piano-standing-still-c',
    name: 'Piano standing still {C}',
    kind: 'oneshot',
    description:
      'A felted piano chord on {C} with a string pad growing out of it, half held in a blur.',
    // The chord is the hit and the pad comes up slowly and well under it, with no smear in the blur: as it was, the pad
    // arriving was a second hit in four keys. The limiter first brings the quiet piano up to the other one-shots.
    preset: 'forest-pulse-piano-standing-still',
    set: { outputDb: 0 },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 4, release: 0.3, ride: 0 } },
      { deviceId: 'pad-follower', preset: 'Lingering', params: { width: 0.6, mix: 0.25, rise: 3 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Endless',
        params: { smear: 0, mix: 0.5, width: 0.3 },
      },
    ],
    ...played(
      7,
      [
        [0, 4, 48],
        [0, 4, 55],
        [0, 4, 64],
      ],
      2.5,
    ),
    skipSec: 0.03,
  },
  {
    n: 66,
    id: 'low-bell-far-off-d',
    name: 'Low bell far off {D}',
    kind: 'oneshot',
    description:
      'One stroke of a church bell on a low {D}, re-amped at a distance and dulled, among far echoes.',
    // A little less of the re-amp's room than the preset: four keys up it rang on louder than the stroke.
    preset: 'forest-pulse-bells-through-trees',
    set: { position: 0.667 },
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { distance: 0.9, room: 0.3 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4, width: 0.6 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { presence: -4, highCut: 2500 } },
    ],
    ...played(8, [[0, 5.5, 50]], 2),
  },
  {
    n: 67,
    id: 'bar-in-the-fog-e',
    name: 'Bar in the fog {E}',
    kind: 'oneshot',
    description: 'One soft stroke on a marimba bar on {E}, low-passed, on tape, in a cathedral.',
    preset: 'forest-pulse-rolled-bar-fog',
    set: { roll: 0 },
    ...played(5, [[0, 1.5, 52]], 1.5),
  },
  {
    n: 68,
    id: 'slowed-steel-f',
    name: 'Slowed steel {F}',
    kind: 'oneshot',
    description:
      'One low ding of a handpan on {F} with its half-speed octave below, low-passed, in a ghost of a room.',
    preset: 'forest-pulse-slowed-steel',
    ...played(6, [[0, 3, 53]], 1.5),
  },
  {
    n: 69,
    id: 'half-tines-f',
    name: 'Half tines {F}maj7',
    kind: 'oneshot',
    description:
      'A tine piano chord on {F} major seventh with a blurred half-speed copy an octave down, in a hall.',
    preset: 'forest-pulse-blurred-half-tines',
    ...played(
      6,
      [
        [0, 3, 53],
        [0.01, 3, 60],
        [0.02, 3, 64],
        [0.03, 3, 69],
      ],
      1.5,
    ),
  },
  {
    n: 70,
    id: 'sweep-returning-g',
    name: 'Sweep returning {G}sus2',
    kind: 'oneshot',
    description:
      'One quick sweep up a zither on {G} suspended second that comes back reversed, over faint crackle.',
    // A suspended second where the preset adds a ninth to a major chord: over {G} that major third is a {B}, but in other keys it is not always a note of the key.
    preset: 'forest-pulse-sweep-returning-crackle',
    set: { chord: 5, strum: 100, release: 3 },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Long mirror',
        params: { time: 2500, feedback: 0, mix: 0.3 },
      },
      { deviceId: 'noise-floor', preset: 'Old record', params: { level: -44 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(8, [[0, 3, 55]], 3),
  },
  {
    n: 71,
    id: 'quarter-speed-bowl-e',
    name: 'Quarter speed bowl {E}',
    kind: 'oneshot',
    description:
      'A temple bowl struck once on {E} with itself at quarter speed two octaves below, in a dark bloom.',
    // The slowed copy is a low hum well under the bowl, closed to 1 kHz: brighter and louder, each of its
    // second-and-a-half turns was heard as a new hit three keys up. The bowl's halves beat slowly, a cent apart.
    preset: 'forest-pulse-quarter-speed-bowl',
    set: { attack: 0.003, detune: 1 },
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { highCut: 1000, mix: 0.2 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { smear: 0, mix: 0.35, width: 0.6 },
      },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
    then: [{ deviceId: 'stereo-widener', params: { width: 0.35 } }],
    ...played(8, [[0, 4, 64]], 2.5),
    skipSec: 0.03,
  },
  {
    n: 72,
    id: 'spires-stab-a',
    name: 'Spires stab {A}',
    kind: 'oneshot',
    description:
      'Organ pipes on {A} and {E} struck once and let go, a little dissolved, ringing in a cathedral.',
    preset: 'forest-pulse-spires-in-fog',
    set: { attack: 0.005, release: 1.5 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.2, mix: 0.3, width: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
    ...played(
      6,
      [
        [0, 1.6, 57],
        [0, 1.6, 64],
        [0, 1.6, 69],
      ],
      2,
    ),
    skipSec: 0.03,
  },
  {
    n: 73,
    id: 'tongue-drum-bloom-b',
    name: 'Tongue drum bloom {B}',
    kind: 'oneshot',
    description: 'One tap on a steel tongue drum on {B} ringing into a dark blooming reverb.',
    preset: 'forest-pulse-tongue-drum-mist',
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.3 } }],
    ...played(6, [[0, 2, 59]], 2),
  },
  {
    n: 74,
    id: 'mallet-pulled-under-c',
    name: 'Mallet pulled under {C}',
    kind: 'oneshot',
    description:
      'One soft folded-tone mallet on {C} whose echoes run backwards and down the octaves, in a cavern.',
    preset: 'forest-pulse-mallets-pulled-under',
    then: [
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 8, release: 0.3, ride: 0 } },
    ],
    ...played(5, [[0, 1, 60]], 1.5),
  },
  {
    n: 75,
    id: 'bells-through-trees-d',
    name: 'Bells through trees {D}',
    kind: 'oneshot',
    description:
      'One stroke of a church bell on {D} from deep in the wood, re-amped at a distance, among far echoes.',
    // Struck two thirds of the way up, where the major tenth of a church bell does not sound: over {D} every partial left is a white key.
    preset: 'forest-pulse-bells-through-trees',
    set: { position: 0.667 },
    ...played(8, [[0, 5.5, 62]], 2),
  },
  {
    n: 76,
    id: 'hammered-string-e',
    name: 'Hammered string {E}',
    kind: 'oneshot',
    description:
      'One hammer on a doubled string on {E} and its octave, low-passed and blurred, in a cathedral.',
    preset: 'forest-pulse-tremolo-strings-haze',
    set: { roll: 0, strum: 0 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 1400 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0, mix: 0.4, width: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...played(6, [[0, 2, 64]], 2),
    skipSec: 0.02,
  },
  {
    n: 77,
    id: 'harp-glass-ring-g',
    name: 'Harp glass ring {G}',
    kind: 'oneshot',
    description:
      'One harp string on {G} plucked firmly and left to ring long, a third of it held in a blur, in a hall.',
    // A firmer pluck, less blur and a hall for the plate: the soft pluck under the long plate was a pad in two keys,
    // two hits in a third and wider than its middle in a fourth.
    preset: 'forest-pulse-pluckless-harp-blur',
    set: { touch: 0.5 },
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0, mix: 0.3, width: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...played(6, [[0, 3, 67]], 2),
    skipSec: 0.03,
  },
  // Phrases that come round: struck and plucked things, since a bowed or blown line here is heard as a pad.
  {
    n: 78,
    id: 'slow-bass-walk-a',
    name: 'Slow bass walk {A}',
    kind: 'melodic',
    description:
      'A pedal bass walking slowly up from {A} and falling back to {G}, gliding, on a dark plate; it comes round.',
    // A plate that drifts under one voice: the passes are not the same wave, so the fold is equal-power.
    // The filter opens a little more on each struck note and closes slowly: with none of that the steps ran together
    // and in two keys the walk was a pad.
    preset: 'forest-pulse-slow-bass-walk',
    set: { contour: 0.3, decay: 4 },
    ...cycled(8, [
      [0, 1.9, 45],
      [1.87, 1.2, 48],
      [3.21, 1.5, 50],
      [4.63, 1.1, 52],
      [5.92, 1.7, 43],
    ]),
    loopFold: 'power',
  },
  {
    n: 79,
    id: 'wooden-steps-g',
    name: 'Wooden steps {G}',
    kind: 'melodic',
    description:
      'Soft low marimba bars stepping unevenly around {G}, low-passed, in a small room; it comes round.',
    // No echo: at 500 ms and nine tenths fed back it made a pulse of the bars.
    preset: 'forest-pulse-wooden-heartbeat',
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 400 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...cycled(8, [
      [0, 1, 43],
      [0.8, 1, 50],
      [2.1, 1, 55],
      [3.3, 1, 52],
      [4.9, 1, 47],
      [6.2, 1, 50],
    ]),
  },
  {
    n: 80,
    id: 'slowed-salon-round-c',
    name: 'Slowed salon round {C}',
    kind: 'melodic',
    description:
      'A felted piano off a worn record, slow notes over {C} then {F}, half-speed copies below; it comes round.',
    preset: 'forest-pulse-slowed-salon-piano',
    ...cycled(8, [
      [0, 2.5, 48],
      [0.04, 2.5, 64],
      [1.42, 1.5, 67],
      [2.61, 2.2, 72],
      [4.33, 2.4, 53],
      [4.37, 2.4, 69],
      [5.84, 1.8, 64],
    ]),
    loopFold: 'power',
  },
  {
    n: 81,
    id: 'slowed-steel-round-d',
    name: 'Slowed steel round {D}m',
    kind: 'melodic',
    description:
      'A low handpan circling {D} minor with its half-speed octave below, low-passed; it comes round.',
    preset: 'forest-pulse-slowed-steel',
    ...cycled(8, [
      [0, 2, 50],
      [1.21, 1.5, 57],
      [2.03, 1.5, 60],
      [3.48, 2, 65],
      [5.11, 1.5, 64],
      [6.02, 1.5, 57],
    ]),
    loopFold: 'power',
  },
  {
    n: 82,
    id: 'harp-sweeps-on-wax-d',
    name: 'Harp sweeps on wax {D}',
    kind: 'melodic',
    description:
      'Three slowing sweeps up a harp, from {D}, {A} and {F}, on a crackling record, in a hall; it comes round.',
    // Each sweep is rolled by hand and slows as it climbs: the harp's own roll is even, and even plucks are heard as a pulse.
    preset: 'forest-pulse-looped-harp-sweep',
    set: { sweep: 0 },
    effects: [
      { deviceId: 'vinyl', preset: 'New pressing', params: { surface: 0.2, crackle: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    ...cycled(8, [
      [0.02, 2, 50],
      [0.11, 2, 53],
      [0.21, 2, 57],
      [0.33, 2, 62],
      [0.47, 2, 65],
      [0.64, 2, 69],
      [2.9, 2, 57],
      [2.99, 2, 60],
      [3.1, 2, 64],
      [3.22, 2, 69],
      [3.37, 2, 72],
      [3.55, 2, 76],
      [5.3, 2, 53],
      [5.4, 2, 57],
      [5.51, 2, 60],
      [5.64, 2, 65],
      [5.8, 2, 69],
      [5.99, 2, 72],
    ]),
  },
  {
    n: 83,
    id: 'half-tines-round-f',
    name: 'Half tines round {F}',
    kind: 'melodic',
    description:
      'A tine piano over {F} then {G}, harder hammers, a blurred half-speed copy below; it comes round.',
    preset: 'forest-pulse-blurred-half-tines',
    set: { hardness: 0.9 },
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    ...cycled(8, [
      [0, 2.5, 53, 0.9],
      [0.03, 2.5, 60, 0.8],
      [1.3, 1.5, 69, 1],
      [2.4, 2, 72, 1],
      [3.9, 2.5, 55, 0.9],
      [3.93, 2.5, 62, 0.8],
      [5.3, 2, 67, 1],
      [6.4, 1.4, 64, 1],
    ]),
  },
  {
    n: 84,
    id: 'mallets-pulled-under-e',
    name: 'Mallets pulled under {E}m',
    kind: 'melodic',
    description:
      'Soft folded-tone mallets climbing {E} minor, each pulled backwards down the octaves; it comes round.',
    preset: 'forest-pulse-mallets-pulled-under',
    ...cycled(8, [
      [0, 1, 64],
      [0.83, 1, 67],
      [1.51, 1, 71],
      [2.92, 1.2, 74],
      [4.37, 1, 71],
      [5.46, 1.4, 64],
    ]),
  },
  {
    n: 85,
    id: 'looped-singer-a',
    name: 'Looped singer {A}m',
    kind: 'melodic',
    description:
      'One wordless voice, a slow line in {A} minor over a reversed loop of itself, on thin tape; it comes round.',
    preset: 'forest-pulse-looped-singer',
    ...cycled(8, [
      [0, 1.6, 69],
      [1.57, 0.9, 72],
      [2.48, 1.8, 71],
      [4.4, 1.2, 67],
      [5.63, 1.9, 64],
    ]),
    loopFold: 'power',
  },
  {
    n: 86,
    id: 'light-on-leaves-g',
    name: 'Light on leaves {G}',
    kind: 'melodic',
    description:
      'High glass chimes over {G}, each raining up the octaves in fast repeats under a shimmer; it comes round.',
    preset: 'forest-pulse-light-on-leaves',
    ...cycled(8, [
      [0, 0.8, 79],
      [0.63, 0.8, 83],
      [1.48, 0.8, 86],
      [2.71, 1, 91],
      [4.05, 0.8, 88],
      [5.22, 1.2, 84],
    ]),
  },
  // Phrases that ring out.
  {
    n: 87,
    id: 'nylon-in-fog-a',
    name: 'Nylon in fog {A}m',
    kind: 'melodic',
    description:
      'A nylon guitar picking slowly up {A} minor, blurred, with sympathetic strings ringing; it rings out.',
    // No swell, so each pluck is heard as one. The strings that ring along are tuned to {A} minor, not the preset's D minor with its B flat.
    preset: 'forest-pulse-nylon-in-fog',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.3, mix: 0.5, width: 0 },
      },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 9, mix: 0.4 } },
    ],
    ...played(
      8,
      [
        [0, 3, 45],
        [0.97, 2.5, 57],
        [1.71, 2.5, 60],
        [3.2, 3, 64],
        [4.37, 3, 59],
        [5.63, 2.3, 57],
      ],
      2,
    ),
    skipSec: 0.02,
  },
  {
    n: 88,
    id: 'piano-turning-to-pad-c',
    name: 'Piano turning to pad {C}',
    kind: 'melodic',
    description:
      'A felted piano, slow notes over {C}, with a string pad growing out of them, held in a blur; it rings out.',
    preset: 'forest-pulse-piano-standing-still',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { width: 0.6 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Endless',
        params: { smear: 0.4, mix: 0.5, width: 0.3 },
      },
    ],
    ...played(
      9,
      [
        [0, 3, 48],
        [0.04, 3, 55],
        [1.5, 2, 64],
        [2.6, 2.5, 67],
        [4.3, 3, 65],
        [5.6, 2.4, 60],
      ],
      3,
    ),
    skipSec: 0.02,
  },
  {
    n: 89,
    id: 'twelve-bit-bar-a',
    name: 'Twelve bit bar {A}m',
    kind: 'melodic',
    description:
      'A felt piano phrase in {A} minor played back by an early sampler, hung in mist; it rings out.',
    preset: 'forest-pulse-twelve-bit-bar',
    source: 'felt-piano-phrase-am',
    set: { attack: 0.01 },
    ...played(10, [[0, 8, 72]], 2.5),
    skipSec: 0.02,
  },
  {
    n: 90,
    id: 'pendulum-bar-d',
    name: 'Pendulum bar {D}m',
    kind: 'melodic',
    description:
      'A harp phrase in {D} minor an octave down, played there and back off a worn record; it rings out.',
    preset: 'forest-pulse-pendulum-bar',
    source: 'harp-phrase-dm',
    set: { attack: 0.01 },
    then: [{ deviceId: 'stereo-widener', params: { width: 0.4 } }],
    ...played(10, [[0, 7.5, 60]], 3),
  },
  {
    n: 91,
    id: 'pendulum-handpan-a',
    name: 'Pendulum handpan {A}m',
    kind: 'melodic',
    description:
      'A handpan round in {A} minor played there and back off a worn record, low-passed; it rings out.',
    // The key an octave up undoes the octave the preset is tuned down: the round at its own pitch.
    preset: 'forest-pulse-pendulum-bar',
    source: 'handpan-round-am',
    set: { attack: 0.01 },
    ...played(10, [[0, 7.5, 72]], 3),
  },
  {
    n: 92,
    id: 'twelve-bit-zither-f',
    name: 'Twelve bit zither {F}',
    kind: 'melodic',
    description:
      'A zither phrase in {F} lydian played back by an early sampler, hung in mist; it rings out.',
    // The sampler loops the middle of the phrase: the fade starts after its loudest pluck has come round, at 7.7 s.
    preset: 'forest-pulse-twelve-bit-bar',
    source: 'zither-wash-f',
    set: { attack: 0.01 },
    ...played(10, [[0, 7.9, 72]], 2),
    skipSec: 0.02,
  },
  {
    n: 93,
    id: 'wooden-steps-up-e',
    name: 'Wooden steps up {E}m',
    kind: 'melodic',
    description:
      'Five uneven steps on soft marimba bars, up from {E} to {B} and back down, low-passed; it rings out.',
    preset: 'forest-pulse-wooden-heartbeat',
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 1, cutoffHz: 400 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    ...played(
      6,
      [
        [0, 1, 52],
        [0.7, 1, 59],
        [1.83, 1, 55],
        [2.7, 1, 57],
        [4.2, 1.5, 52],
      ],
      1.5,
    ),
  },
  {
    n: 94,
    id: 'plucks-remembered-c',
    name: 'Plucks remembered {C}',
    kind: 'melodic',
    description:
      'Felt-damped plucks rising through {C} and {G} to {F} and {G} that hazy echoes bring back; it rings out.',
    // Only {C}, {G} and {F}: the fifth harmonic of these strings is loud, and over any other note it is off the key.
    preset: 'forest-pulse-plucks-remembered',
    effects: [
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 12, mix: 0.35 } },
      { deviceId: 'stereo-widener', params: { width: 0.3 } },
    ],
    ...played(
      8,
      [
        [0, 2, 48],
        [0.8, 2, 55],
        [1.9, 2, 60],
        [3.4, 2.5, 65],
        [4.6, 3, 67],
      ],
      2.5,
    ),
  },
  {
    n: 95,
    id: 'hammers-in-the-fog-g',
    name: 'Hammers in the fog {G}',
    kind: 'melodic',
    description:
      'Hammers on doubled strings, five slow notes from {G}, each with its octave, blurred; it rings out.',
    preset: 'forest-pulse-tremolo-strings-haze',
    set: { roll: 0, strum: 0 },
    effects: [
      { deviceId: 'auto-filter', params: { type: 0, slope: 0, cutoffHz: 1400 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.3, mix: 0.5, width: 0.2 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...played(
      8,
      [
        [0, 2, 55],
        [1.1, 1.5, 62],
        [2.0, 2, 67],
        [3.6, 2, 65],
        [5.0, 2.5, 60],
      ],
      2.5,
    ),
    skipSec: 0.02,
  },
  {
    n: 96,
    id: 'two-slow-bowls-a',
    name: 'Two slow bowls {A}',
    kind: 'melodic',
    description:
      'Two temple bowls, {A} then {E}, with themselves at quarter speed below, in a dark bloom; it rings out.',
    preset: 'forest-pulse-quarter-speed-bowl',
    set: { attack: 0.003 },
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { mix: 0.5 } },
      {
        deviceId: 'spectral-blur',
        preset: 'Dark water',
        params: { smear: 0.3, mix: 0.35, width: 0.6 },
      },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
    ...played(
      12,
      [
        [0, 5, 57],
        [3.7, 5, 64],
      ],
      3,
    ),
    skipSec: 0.03,
  },
  {
    n: 97,
    id: 'harp-chord-returning-a',
    name: 'Harp chord returning {A}m',
    kind: 'melodic',
    description:
      'Two slowing cascades on a chord harp, {A} minor then {F}, each coming back reversed; it rings out.',
    // Each cascade is played by hand, a key at a time, and slows as it climbs: every key strikes its note in four
    // octaves at once. The harp's own strum is even, and was heard as a pulse six keys up and as no notes at all four keys down.
    preset: 'forest-pulse-harp-chord-returning',
    set: { sustain: 3, strum: 0 },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Long mirror',
        params: { time: 3000, feedback: 0.2, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
    ...played(
      10,
      [
        [0, 0.25, 57],
        [0.39, 0.25, 60],
        [0.93, 0.25, 64],
        [1.6, 0.25, 69],
        [3.84, 0.25, 53],
        [4.19, 0.25, 57],
        [4.7, 0.25, 60],
        [5.41, 0.25, 65],
      ],
      3,
    ),
  },
  {
    n: 98,
    id: 'long-harp-climb-c',
    name: 'Long harp climb {C}',
    kind: 'melodic',
    description:
      'A harp ringing long, climbing from {C} to a high {E} and settling on {D}, held in a blur; it rings out.',
    preset: 'forest-pulse-pluckless-harp-blur',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { smear: 0.3, mix: 0.5, width: 0.2 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
    ...played(
      9,
      [
        [0, 2, 60],
        [0.8, 2, 67],
        [1.9, 2, 72],
        [3.2, 2.5, 76],
        [4.6, 2.5, 74],
      ],
      3,
    ),
    skipSec: 0.02,
  },
  {
    n: 99,
    id: 'tongue-drum-mist-d',
    name: 'Tongue drum mist {D}m',
    kind: 'melodic',
    description:
      'A steel tongue drum, four slow taps in {D} minor through a soft grain cloud into a dark bloom; it rings out.',
    preset: 'forest-pulse-tongue-drum-mist',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.25 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.25 } },
    ],
    ...played(
      10,
      [
        [0, 2, 62],
        [1.1, 1.5, 65],
        [1.9, 2, 69],
        [3.2, 2.5, 67],
      ],
      3,
    ),
  },
  {
    n: 100,
    id: 'three-bells-far-off-d',
    name: 'Three bells far off {D}',
    kind: 'melodic',
    description:
      'Three strokes of church bells on {D}, the second an octave lower, re-amped far off; it rings out.',
    preset: 'forest-pulse-bells-through-trees',
    set: { position: 0.667 },
    ...played(
      12,
      [
        [0, 5, 62, 0.8],
        [2.9, 6, 50, 1],
        [6.1, 4, 62, 0.9],
      ],
      2.5,
    ),
  },
])
