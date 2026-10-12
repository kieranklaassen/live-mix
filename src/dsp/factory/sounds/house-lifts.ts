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
// A rise is loudest in its last moments, where the fade is. The level of a sound that keeps time
// and ends is set by the largest sample its fades leave (`peakAfterFades`, which
// `renderFactorySound` asks ../../patch-render.ts for), so a rise needs nothing after its
// filter: it is the source, the room where it has one, and the filter.

import { type PatchDevice } from '../../../core/devices/patch'
import { hall } from '../parts'
import { type FactorySound } from '../types'
import { played, sound } from './recipe'
import { BAR_SEC, CLUB, inTimeOnce } from './rhythm'

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
 * oscillator a sine under 10 Hz, and its filter a 24 dB high-pass at `floorHz`. The attack is 5 ms:
 * a rise starts some 40 dB under its end, and with a slower attack its first sample within 40 dB
 * of its peak (what the bench calls its lead) came 63 ms in at two tempos of 22.
 */
const noise = (floorHz: number): PatchDevice => ({
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
    ampAttack: 0.005,
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
    effects: [sweep(1, SAW_UP)],
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
    effects: [room(0.8), sweep(2, SAW_UP, { slope: 0, resonance: 1.2 })],
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
    effects: [room(0.5), sweep(4, SAW_UP, { type: BAND_PASS, cutoffHz: 2000, resonance: 2 })],
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
    effects: [room(0.65), sweep(8, SAW_UP, { resonance: 3 })],
    ...held(8, [[LOW_A, 0.8]]),
  }),
]

// The keys of the chord that rises, low to high: A minor from the A at 55 Hz to the E four and a
// half octaves over it, and its top the loudest. The thirds are three of the eleven and as loud as
// the keys round them. With one sawtooth to a note, each note was stronger at its fifth harmonic
// than at its fundamental (the high-pass below), and the fifth harmonic of an A is a C sharp: with
// five roots and two soft thirds the end of the render held 1.6 to 3.7 dB more C sharp than C in
// every key, which is not a minor chord. These keys held 3.5 to 6.6 dB more C than C sharp, and
// with three sawtooths to a note (below) they hold 11.3 to 13.9 dB more (the last 1.4 s at 120,
// in every key).
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
    // ones, so the level climbs with the filter to the end, which is at 5.4 kHz. The filter is the
    // 12 dB one and the room is low: with the steeper filter or more room the level stood still
    // for a tenth of the sound in two or three of the twelve keys.
    //
    // Each note is three sawtooth waves at one pitch (Unison 3 with no detune and no spread). The
    // synth starts its copies an eighth of a cycle apart and they never drift, so nothing beats
    // (voices that beat are counted as hits by the analysis): a note's one edge becomes three
    // smaller ones, and by the arithmetic of those phases its third and fifth harmonics are its
    // weakest. With one sawtooth to a note the largest sample stood far over the rest, and the
    // chord was -22.8 to -19.1 LUFS over the twelve keys at 96, 120 and 140, under the -22 a pad
    // is held to in two of the 36. With three it is -21.2 to -18.6, and no tenth of it climbs
    // less than 0.7 dB (0.2 dB with one).
    instrument: {
      deviceId: 'ember',
      params: {
        osc1Shape: 0,
        oscMix: 0,
        filterType: 1,
        filterSlope: 0,
        cutoff: 800,
        keyTrack: 1,
        unisonVoices: 3,
        unisonDetune: 0,
        unisonSpread: 0,
        velToAmp: 1,
        ampAttack: 0.03,
        ampRelease: 0.03,
      },
    },
    effects: [room(0.4), sweep(4, SAW_UP, { cutoffHz: 700, slope: 0 })],
    ...held(4, A_MINOR),
  }),
]

// Noise that starts bright on a bar line and falls: the same filter turned round. They start on
// their loudest moment, where there is no fade, and their last half second, some 25 dB down by
// then, fades to nothing on the bar line.
const SWEEPS_DOWN: readonly FactorySound[] = [
  sound({
    id: 'house-sweep-down-two',
    number: 476,
    name: 'Sweep down, two bars',
    kind: 'oneshot',
    description:
      'Noise in a small room that starts bright on the bar line and darkens for two bars under a closing low pass filter, after a house build.',
    instrument: noise(150),
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
    instrument: noise(150),
    effects: [room(0.8), sweep(4, SAW_DOWN, { resonance: 3 })],
    ...inTimeOnce(4 * BAR_SEC, [[0, 4 * BAR_SEC, LOW_A, 0.8]], 0.5),
  }),
]

// The crash played backwards into a bar line: the single crash (number 460, ./club-hits.ts) loaded
// into the sampler with Reverse on, where a key starts at End and plays the crash's own samples
// in reverse order down to Start, which is the first sample of the crash. End is the length of
// the sound, so the key reaches the crash's first sample on the last frame before the bar line,
// and End follows the tempo as a length (`timedParams`: in these two sounds, not in every patch
// of a sampler): at a faster tempo a shorter stretch of the crash is read, at the same speed. A
// variant leaves the key on its pitch, which here is a speed (../vary.ts). That holds from 60 beats a minute up, where a bar is no
// longer than the four seconds of the crash. Slower than that End is past the top of its range
// and is halved, and the reverse is played twice, its stick on the middle of the sound and on
// its end (four times under 30).
//
// What comes out is the crash sample for sample but for the sampler's Tone, a 12 dB low-pass that
// goes no higher than 18 kHz. Beside the crash turned round and put through that filter, the one
// bar is 109 dB or more under the crash's largest sample at every frame of its last half second,
// and the two bars, which are read between the samples, 68 dB or more (all twelve keys at 96, 120
// and 140). Beside the crash turned round and nothing else the one bar is 29 to 35 dB under and
// the two 36 to 41, since the filter moves the top by a part of a sample, and by thirds of an
// octave the one bar is the crash up to 10 kHz, 0.2 dB under at 12.7 kHz, 0.9 at 16 and 4.7 at
// 20.
//
// Loop is Forward with no Crossfade because with Loop Off the sampler fades the last 2 ms before
// an edge, which is where the stick is (the largest sample of the crash is 1.4 to 2.4 ms in, in
// ten keys of twelve); the jump back to End comes on the frame after the sound is over. Nothing
// fades the end: the last sample of the sound is the first of the crash, which is at rest.
//
// A crash dies away fast, so its reverse is quiet for long: in the home key the crash is 40 dB
// under its largest sample 1.3 s in and 60 dB under 2 s in, and one bar backwards at 120 comes
// within 40 dB of its peak 0.73 s in (1.23 s at 96, 0.45 s at 140: the last 1.3 s are the same at
// any tempo). Two bars backwards at the crash's own speed would be that with a bar of next to
// nothing before it, so the two bars are the crash at half speed, an octave down: the same
// stretch of it, every sample twice as long, within 40 dB of the peak for its last 2.5 s. Neither
// changes colour on the way: the crash is one colour as it dies, in the home key 6.2 to 6.6 kHz
// at the centre in every tenth of the one bar and 3.1 to 3.4 kHz in the two.
//
// Each is brought to the peak of the crash it is made from (`kitLevel`), so the crash laid on the
// bar line carries on from it: the last 50 ms of the reverse are within 1.5 dB of the first 50 ms
// of the crash in all twelve keys at those tempos.

/** The crash struck once is this long, and this key plays it as it is. */
const CRASH_SEC = 4
const AS_IT_IS = 60
/** An octave under it: half the speed, so twice as long. */
const HALF_SPEED = 48

/**
 * The sampler playing the crash backwards so that it reaches the crash's first sample at the end
 * of `bars` bars, at `speed` times the crash's own speed (the key played has to be that speed).
 */
const backwards = (bars: number, speed: number): PatchDevice => ({
  deviceId: 'sampler',
  params: {
    start: 0,
    end: (bars * BAR_SEC * speed) / CRASH_SEC,
    // Forward, and no crossfade: see above.
    loop: 1,
    crossfade: 0,
    reverse: 1,
    tune: 0,
    fine: 0,
    attack: 0.001,
    release: 0.05,
    // The crash as it is: no wobble, every key as loud, and as little of the low-pass as there is.
    tone: 18000,
    wobble: 0,
    velocity: 0,
  },
})

const REVERSE_CRASHES: readonly FactorySound[] = [
  sound({
    id: 'house-reverse-crash-one',
    number: 478,
    name: 'Reverse crash, one bar',
    kind: 'texture',
    description:
      'The club crash played backwards on a sampler, quiet at first, swelling in its last second to the stick on the bar line, for a house build.',
    source: 'club-crash-hit',
    // As loud as the crash it is made from, so the crash laid where it ends carries on from it.
    kitLevel: true,
    timedParams: { end: 'time' },
    instrument: backwards(1, 1),
    effects: [],
    ...inTimeOnce(BAR_SEC, [[0, BAR_SEC, AS_IT_IS, 0.8]], 0),
  }),
  sound({
    id: 'house-reverse-crash-two',
    number: 479,
    name: 'Reverse crash, two bars',
    kind: 'texture',
    description:
      'The club crash played backwards at half speed on a sampler, an octave lower, a dark swell through the second bar, for a house build.',
    source: 'club-crash-hit',
    // As loud as the crash it is made from, so the crash laid where it ends carries on from it.
    kitLevel: true,
    timedParams: { end: 'time' },
    instrument: backwards(2, 0.5),
    effects: [],
    ...inTimeOnce(2 * BAR_SEC, [[0, 2 * BAR_SEC, HALF_SPEED, 0.8]], 0),
  }),
]

// Impacts: not timed, they end when they have rung out.
//
// The two on the Club Kit are its deep kick with Length at three and four, so that the boom is the
// kick's own ring, on the kick's note in every key. A hall cannot hold that note: its low
// resonances stand where its size puts them (36.4, 40.2 and 44.2 Hz were the strongest found), and
// a kick left to ring in one rings on at the nearest of them. With the hall's lows four seconds
// long, 6 to 34 % of the low end of the tail was on the note and its strongest line was up to 190
// cents off. So the hall here is a second long under its Crossover and is there for the width: it
// makes neither sound longer (in the home key, the lowest and the highest each is 60 dB down a
// little sooner with it than without), and from half a second in it puts the sides 7 to 19 dB
// under the middle of what is otherwise nearly all in the middle. From half a second to two
// seconds in, 78 to 98 % of what each has between 20 and 300 Hz is on the note, its octave and
// its twelfth in all twelve keys, and the strongest line there is within a cent of the note.
const DEEP = 1
const HARD = 1

const BOOMS: readonly FactorySound[] = [
  sound({
    id: 'house-crash-boom',
    number: 480,
    name: 'Crash and boom',
    kind: 'oneshot',
    description:
      'The deep club kick and the crash struck together and driven hard in a hall, a low boom under a long wash of cymbal, after a house build.',
    // Drive at the top holds the kick where it is and brings what is quieter up under it: in the
    // home key the wash from one second to two is 8 dB nearer the peak than with Drive at nothing.
    // The first half second is the kick's (what is under 200 Hz is 12 to 23 dB over what is above
    // 2 kHz), from there to a second in the two are within 6 dB, and what follows is the crash's
    // own ring at this Length, 60 dB down after 3.75 s in the highest key and after 5.35 s in
    // the lowest. The hall is a second long under 600 Hz, well over the kick.
    instrument: {
      deviceId: 'club-kit',
      params: { kit: DEEP, length: 3, drive: 1, variation: 0 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 20, crossover: 600, lowDecay: 1, midDecay: 4, mix: 0.25 },
      },
    ],
    ...played(7, [
      [0, 0.1, CLUB.kick, HARD],
      [0, 0.1, CLUB.crash, HARD],
    ]),
  }),
  sound({
    id: 'house-low-boom',
    number: 481,
    name: 'Low boom',
    kind: 'oneshot',
    description:
      'The deep club kick at its longest, driven hard, with no click and little fall in pitch, a low note that booms for a second or two in a hall.',
    // Punch and Snap at nothing take the click and most of the fall in pitch off the kick, and
    // what is left is the note, driven. That is what sets it apart from the kit's own long kick
    // (number 465, the same drum at this Length in a hall of lows three seconds long), over the
    // twelve keys: of the first 20 ms the largest sample over 1 kHz is 30 to 35 dB under the peak
    // here and 15 to 18 there; 20 ms in the pitch is under three semitones over the note here and
    // nine to twelve there; and the largest sample is the note itself, 44 to 115 ms in, where
    // that one's is its click. With Punch at the top, as this was first made, the click was 4 to
    // 7 dB harder than that one's. This one is also 3 to 5.5 LU louder as the bank renders the
    // two, on its note to the cent where that one's strongest line is up to 19 cents off, and
    // 60 dB down after 1.45 s in the highest key and after 2.15 s in the lowest.
    instrument: {
      deviceId: 'club-kit',
      params: { kit: DEEP, length: 4, punch: 0, snap: 0, drive: 1, variation: 0 },
    },
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 20, crossover: 300, lowDecay: 1, mix: 0.4 },
      },
    ],
    ...played(3, [[0, 0.1, CLUB.kick, HARD]]),
  }),
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
  ...REVERSE_CRASHES,
  ...BOOMS,
]
