// Rises, sweeps and impacts. Numbers 471 to 482.
// What every sound here is held to is in docs/factory.md.
//
// A rise is whole bars that keep time and end (`inTimeOnce`, ./rhythm.ts): one key held from the
// bar line it starts on to the bar line it ends on, a steady source under it and a filter that
// moves once in its length. The filter is the auto filter, whose LFO starts at zero when the
// sound does: Saw Up stands at the bottom of its sweep on the first sample and climbs in a
// straight line of pitch, Saw Down starts at the top and falls. At full amount the sweep is three
// octaves either side of Cutoff, so a cutoff of 1600 Hz goes from 200 Hz to 12.8 kHz. The LFO's
// rate follows the tempo (../tempo.ts), so the sweep takes the length of the sound at any tempo.
//
// The rate is a hundredth under once in the length. At exactly once the saw comes round a few
// tens of frames before the end (the filter and the instrument are that much late, which is taken
// out of the start), and a sweep down then opens again for its last millisecond.
//
// The source of the noise is the pad synth's own white noise, which is one level from the first
// second to the last. Its oscillator cannot be switched off: it is a sine two octaves under the
// lowest A, under 10 Hz in every key, and the synth's filter is a high-pass far above it. That
// high-pass is also the floor of the noise. It stands near where the sweep starts, so the start
// of a rise is quieter than white noise under a low-pass would be, and the end of a sweep down.
//
// A rise is loudest in its last moments, where the fade is. The level of a sound is set by its
// largest sample before the fade is applied, so a rise ends in a flat clip that only its few
// largest samples reach, in the last third of it: the largest sample is then one of several,
// most of them before the fade, and the sound comes out at the bank's level (measured at 96, 120
// and 140, and the chord in every key).

import { type PatchDevice } from '../../../core/devices/patch'
import { hall } from '../parts'
import { type FactorySound } from '../types'
import { played, sound } from './recipe'
import { BAR_SEC, inTimeOnce } from './rhythm'

type Params = Readonly<Record<string, number>>

/** The key under the noise: the lowest A. The noise has no pitch; the key moves the sine that is filtered out. */
const LOW_A = 21

/** Shapes of the auto filter's LFO (`lfoShape` in cpp/devices/auto-filter/device.json). */
const SAW_UP = 2
const SAW_DOWN = 3
/** Types of the auto filter. */
const LOW_PASS = 0
const BAND_PASS = 2

/**
 * White noise and nothing else, in the middle: the pad synth with its noise full up, its one
 * oscillator a sine under 10 Hz, and its filter a 24 dB high-pass at `floorHz`.
 */
const noise = (floorHz: number, attack = 0.02): PatchDevice => ({
  deviceId: 'ember',
  params: {
    osc1Shape: 3,
    osc1Coarse: -24,
    oscMix: 0,
    noiseLevel: 1,
    filterType: 1,
    filterSlope: 1,
    cutoff: floorHz,
    velToAmp: 0,
    ampAttack: attack,
    ampRelease: 0.03,
  },
})

/**
 * The filter that moves once in `bars` bars: a 24 dB low-pass from 200 Hz to 12.8 kHz (or back)
 * unless `params` say otherwise.
 */
const sweep = (bars: number, shape: number, params: Params = {}): PatchDevice => ({
  deviceId: 'auto-filter',
  params: {
    type: LOW_PASS,
    slope: 1,
    cutoffHz: 1600,
    resonance: 0.8,
    lfoAmount: 100,
    lfoRateHz: 0.99 / (bars * BAR_SEC),
    lfoShape: shape,
    mix: 1,
    ...params,
  },
})

/** A small room ahead of the filter: steady noise comes out of it as steady noise, different on each side. */
const room = (mix: number): PatchDevice => hall('Room', mix)

/**
 * The flat clip a rise ends in, at the base rate, where it is the curve and nothing else. `driveDb`
 * is set by measuring, a decibel or two past where the largest sample just touches the clip: under
 * one sample in a thousand of the last tenth of the noise reaches it, so the loudness is all but
 * what it was (every decibel of drive past touching is a decibel of loudness). The chord takes
 * more of it: its largest sample is 4 dB apart from key to key, so a drive that is a decibel past
 * touching in its quietest key is 5 dB past in its loudest, where three samples in a thousand of
 * the last tenth are flat and what the clip adds is 26 dB under the chord.
 */
const ceiling = (driveDb: number): PatchDevice => ({
  deviceId: 'saturator',
  params: {
    curve: 1,
    driveDb,
    bias: 0,
    toneDb: 0,
    outputDb: 0,
    mix: 1,
    dcBlock: 0,
    oversample: 0,
    adaa: 0,
  },
})

/** One key held for `bars` bars and stopped on the bar line, with a fade of 20 ms. */
const held = (bars: number, notes: readonly (readonly [note: number, gain: number])[]) =>
  inTimeOnce(
    bars * BAR_SEC,
    notes.map(([note, gain]) => [0, bars * BAR_SEC, note, gain] as const),
    0.02,
  )

// Noise that rises to a bar line: one, two, four and eight bars, each a little different.
const NOISE_RISERS: readonly FactorySound[] = [
  sound({
    id: 'house-noise-riser-one',
    number: 471,
    name: 'Noise riser, one bar',
    kind: 'texture',
    description:
      'White noise in the middle under a low pass filter that opens for one bar and stops on the bar line, for a house build.',
    instrument: noise(200),
    effects: [sweep(1, SAW_UP), ceiling(18.4)],
    ...held(1, [[LOW_A, 0.8]]),
  }),
  sound({
    id: 'house-noise-riser-two',
    number: 472,
    name: 'Noise riser, two bars',
    kind: 'texture',
    description:
      'Noise spread wide by a small room under a gentle low pass filter that opens over two bars to the bar line, for a house build.',
    // The 12 dB slope lets more of the top through from the start than the others do.
    instrument: noise(180),
    effects: [room(0.8), sweep(2, SAW_UP, { slope: 0, resonance: 1.2 }), ceiling(17.6)],
    ...held(2, [[LOW_A, 0.8]]),
  }),
  sound({
    id: 'house-noise-riser-four',
    number: 473,
    name: 'Noise riser, four bars',
    kind: 'texture',
    description:
      'A band of white noise that climbs from 300 Hz to 14 kHz over four bars and stops on the bar line, for a house build.',
    // A band-pass: nothing is left under the band as it climbs, so the sound thins on its way up.
    // The numbers in the description are where the band is strongest in the render, in its first
    // and its last 200 ms at 96, 120 and 140, not where the filter's formula puts its centre.
    instrument: noise(400),
    effects: [
      room(0.5),
      sweep(4, SAW_UP, { type: BAND_PASS, cutoffHz: 2000, resonance: 2 }),
      ceiling(20.5),
    ],
    ...held(4, [[LOW_A, 0.8]]),
  }),
  sound({
    id: 'house-noise-riser-eight',
    number: 474,
    name: 'Noise riser, eight bars',
    kind: 'texture',
    description:
      'Noise in a room under a low pass filter with a resonant peak at its edge that opens slowly over eight bars, for a long house build.',
    // A resonance of 3 lifts the edge by 9.5 dB. At 6 the analysis hears the edge as a pitch and
    // calls the sound a pad; at 3 it is a texture at 96, 120 and 140.
    instrument: noise(180),
    effects: [room(0.65), sweep(8, SAW_UP, { resonance: 3 }), ceiling(11.9)],
    ...held(8, [[LOW_A, 0.8]]),
  }),
]

// The keys of the chord that rises, low to high: A minor from the A at 55 Hz to the E four and a
// half octaves over it, and its top the loudest. The thirds are three of the eleven and as loud as
// the keys round them. Each note here is stronger at its fifth harmonic than at its fundamental
// (the high-pass below), and the fifth harmonic of an A is a C sharp: with five roots and two soft
// thirds the end of the render held 1.6 to 3.7 dB more C sharp than C in every key, which is not
// a minor chord. As written it holds 3.5 to 6.6 dB more C than C sharp (the last 1.4 s at 120).
const A_MINOR: readonly (readonly [note: number, gain: number])[] = [
  [33, 0.45],
  [45, 0.45],
  [52, 0.45],
  [57, 0.5],
  [60, 0.7],
  [64, 0.65],
  [69, 0.75],
  [72, 0.85],
  [76, 0.85],
  [84, 0.92],
  [88, 1],
]

const CHORD_RISERS: readonly FactorySound[] = [
  sound({
    id: 'house-chord-riser',
    number: 475,
    name: 'Chord riser, four bars',
    kind: 'pad',
    description:
      'An {A} minor chord of eleven thin sawtooth notes, low to high, under a low pass filter that opens over four bars, for a house build.',
    // A sawtooth has nearly all of its level in its fundamental, so a chord of them is as loud as
    // it gets once the filter has passed its lowest notes. Here each note is thinned by a 12 dB
    // high-pass that follows its key (three times its fundamental) and the high keys are the loud
    // ones, so the level climbs with the filter to the end, which is at 5.4 kHz. One sawtooth to
    // a note and no unison: voices that beat are counted as hits by the analysis. The filter is the
    // 12 dB one and the room is low: with the steeper filter or more room the level stood still
    // for a tenth of the sound in two or three of the twelve keys.
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 0,
        oscMix: 0,
        filterType: 1,
        filterSlope: 0,
        cutoff: 800,
        keyTrack: 1,
        velToAmp: 1,
        ampAttack: 0.03,
        ampRelease: 0.03,
      },
    },
    effects: [room(0.4), sweep(4, SAW_UP, { cutoffHz: 700, slope: 0 }), ceiling(15.8)],
    ...held(4, A_MINOR),
  }),
]

// Noise that starts bright on a bar line and falls: the same filter turned round. They start on
// their loudest moment, where there is no fade, so they need no clip, and their last half second,
// some 25 dB down by then, fades to nothing on the bar line.
const SWEEPS_DOWN: readonly FactorySound[] = [
  sound({
    id: 'house-sweep-down-two',
    number: 476,
    name: 'Sweep down, two bars',
    kind: 'oneshot',
    description:
      'Noise in a small room that starts bright on the bar line and darkens for two bars under a closing low pass filter, after a house build.',
    instrument: noise(150, 0.005),
    effects: [room(0.8), sweep(2, SAW_DOWN)],
    ...inTimeOnce(2 * BAR_SEC, [[0, 2 * BAR_SEC, LOW_A, 0.8]], 0.5),
  }),
  sound({
    id: 'house-sweep-down-four',
    number: 477,
    name: 'Sweep down, four bars',
    kind: 'oneshot',
    description:
      'Noise that starts bright on the bar line and falls for four bars under a closing low pass filter with a resonant peak, after a house build.',
    instrument: noise(150, 0.005),
    effects: [room(0.8), sweep(4, SAW_DOWN, { resonance: 3 })],
    ...inTimeOnce(4 * BAR_SEC, [[0, 4 * BAR_SEC, LOW_A, 0.8]], 0.5),
  }),
]

// Impacts: not timed, they end when they have rung out.
const BOOMS: readonly FactorySound[] = [
  sound({
    id: 'house-falling-sub',
    number: 482,
    name: 'Falling sub boom',
    kind: 'oneshot',
    description:
      'A sine sub that starts on a low {A} and slides two octaves down in two seconds as it fades, for the first beat after a house build.',
    // The sub bass slides only between keys that overlap: the A it starts on, and 20 ms later the A
    // two octaves under it, which it reaches along a straight line of pitch in the Glide time.
    instrument: {
      deviceId: 'sub-bass',
      params: {
        shape: 0.1,
        harmonics: 0.3,
        drop: 0,
        attack: 0.004,
        decay: 6,
        release: 0.5,
        drive: 0.2,
        glide: 2,
      },
    },
    effects: [],
    ...played(
      4,
      [
        [0, 3.8, 45],
        [0.02, 3.78, 21],
      ],
      0.3,
    ),
  }),
]

export const HOUSE_LIFTS: readonly FactorySound[] = [
  ...NOISE_RISERS,
  ...CHORD_RISERS,
  ...SWEEPS_DOWN,
  ...BOOMS,
]
