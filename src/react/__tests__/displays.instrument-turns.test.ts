// The truth of the two displays that turn a note round: the Staircase's bell,
// climb and walk are the header's, a played key's bars stand where its age
// has brought them, and the Rewind's note swells, lands and stops as the
// device's own figures say.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  TURN_INSTRUMENT_FACES,
  rewindAmp,
  rewindBeat,
  rewindBeatHz,
  rewindBody,
  rewindBuild,
  rewindDeep,
  rewindFallSeconds,
  rewindGate,
  rewindGhost,
  rewindHeld,
  rewindLevel,
  rewindPartials,
  rewindRest,
  rewindRings,
  rewindRun,
  rewindSecond,
  rewindStop,
  rewindSurge,
  rewindWeight,
  rewindWhere,
  rewindWow,
  rewindWowCents,
  stairClimb,
  stairKey,
  staircaseAdvance,
  staircaseAhead,
  staircaseBell,
  staircaseCentre,
  staircaseChordStep,
  staircaseFarAlone,
  staircaseGlide,
  staircaseHeight,
  staircaseLevel,
  staircaseLight,
  staircaseOvertone,
  staircasePace,
  staircaseRun,
  staircaseSecond,
  staircaseSlideSeconds,
  staircaseSpan,
  staircaseSpread,
  staircaseSteps,
  staircaseTouch,
} from '../components/displays/instrument-turns'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent, ink } = PLAIN_COLOURS
const C4 = 261.6255653
const E4 = C4 * Math.pow(2, 4 / 12)
const G4 = C4 * Math.pow(2, 7 / 12)

const note = (frequency: number, age: number, released: number | null = null): DisplayNote => ({
  id: Math.round(frequency),
  frequency,
  gain: 1,
  age,
  released,
})

describe('the staircase’s figures', () => {
  it('climb at the pace `Staircase::pace` makes of Speed', () => {
    expect(staircasePace(0.45)).toBeCloseTo(0.2025, 9)
    expect(staircasePace(-0.5)).toBeCloseTo(-0.25, 9)
    // `kGlideOctavesPerSecond` and `kStepsPerSecond`: an octave in ten seconds, four steps a second.
    expect(staircaseGlide(1)).toBeCloseTo(0.1, 9)
    expect(staircaseGlide(-1)).toBeCloseTo(-0.1, 9)
    expect(staircaseSteps(1)).toBe(4)
    expect(staircaseSteps(-0.5)).toBe(1)
    expect(staircaseSteps(0)).toBe(0)
  })

  it('slide for Slide’s share of a step, a tick of the control clock at least', () => {
    expect(staircaseSlideSeconds(0.3, 0.5)).toBeCloseTo(0.3, 9)
    expect(staircaseSlideSeconds(1, 1)).toBeCloseTo(0.25, 9)
    expect(staircaseSlideSeconds(0, 0.5)).toBeCloseTo(1 / 750, 9)
  })

  it('centre a key’s bell half way after the key, as `note_on` leans it', () => {
    expect(staircaseCentre(440, C4)).toBeCloseTo(440, 6)
    expect(staircaseCentre(440, C4 * 2)).toBeCloseTo(440 * Math.SQRT2, 4)
    expect(staircaseCentre(440, C4 / 4)).toBeCloseTo(220, 4)
    // `kBellLowHz` and `kBellHighHz`: no further than 40 Hz and 6.4 kHz.
    expect(staircaseCentre(80, 20)).toBeCloseTo(40, 6)
    expect(staircaseCentre(3200, 8000)).toBeCloseTo(6400, 4)
  })

  it('weigh a partial under a raised cosine over the octaves, cut off low and high', () => {
    expect(staircaseBell(440, 440, 7)).toBeCloseTo(1, 9)
    // A quarter of the span from the middle is half; the edge is nothing.
    expect(staircaseBell(440 * Math.pow(2, 7 / 4), 440, 7)).toBeCloseTo(0.5, 6)
    expect(staircaseBell(440 * Math.pow(2, 3.5), 440, 7)).toBe(0)
    expect(staircaseBell(440 * Math.pow(2, -2.01), 440, 4)).toBe(0)
    // 30 Hz is half way through the fade from 20 to 40 Hz: half of the bell's 0.7218 there.
    expect(staircaseBell(30, 80, 8)).toBeCloseTo(0.5 * (0.5 + 0.5 * Math.cos(1.1114)), 3)
    // The third harmonic of 4 kHz is 12 kHz, two thirds of the way down from 18 kHz: 0.7407 is left.
    expect(staircaseBell(4000, 4000, 4, 3)).toBeCloseTo(0.7407, 3)
    expect(staircaseBell(4000, 4000, 4, 5)).toBe(0)
  })

  it('keep the bell four octaves wide in Chord, where a key sounds every third octave', () => {
    expect(staircaseSpan(2, 2)).toBe(4)
    expect(staircaseSpan(2, 7)).toBe(7)
    expect(staircaseSpan(1, 2)).toBe(2)
  })

  it('add the odd overtones, the second set and the sides as the header does', () => {
    expect(staircaseOvertone(1, 3)).toBeCloseTo(0.55, 9)
    expect(staircaseOvertone(0.5, 3)).toBeCloseTo(0.275, 9)
    expect(staircaseOvertone(0.5, 5)).toBeCloseTo(0.0875, 9)
    expect(staircaseOvertone(0.5, 7)).toBeCloseTo(0.0275, 9)
    expect(staircaseSecond(1)).toBeCloseTo(0.5, 9)
    expect(staircaseSecond(0.3)).toBeCloseTo(0.3 / 1.3, 9)
    expect(staircaseSpread(0, 0.7)).toBeCloseTo(0.35, 9)
    expect(staircaseSpread(2, 1)).toBeCloseTo(0.3, 9)
    expect(staircaseTouch(0)).toBeCloseTo(0.35, 9)
    expect(staircaseTouch(0.25)).toBeCloseTo(0.675, 9)
    // Middle C is 56.5 semitones above 10 Hz: an even one, the near side. C sharp is odd.
    expect(staircaseFarAlone(C4)).toBe(false)
    expect(staircaseFarAlone(C4 * Math.pow(2, 1 / 12))).toBe(true)
  })

  it('fade a note in and out as `kit::Adsr` does', () => {
    expect(staircaseLevel(0.25, null, 0.25, 1.8)).toBe(1)
    // Half way through the attack: 1.3 (1 - (0.3 / 1.3)^0.5).
    expect(staircaseLevel(0.125, null, 0.25, 1.8)).toBeCloseTo(0.6755, 3)
    // 60 dB down a Release after the key, and over at 100 dB, 5/3 of it.
    expect(staircaseLevel(2, 1, 0.25, 1)).toBeCloseTo(0.001, 9)
    expect(staircaseLevel(3, 1.6, 0.25, 1)).toBeGreaterThan(0)
    expect(staircaseLevel(3, 1.7, 0.25, 1)).toBe(0)
    // The light falls straight over the Release.
    expect(staircaseLight(2, 0.5, 0.25, 1)).toBeCloseTo(0.5, 9)
    expect(staircaseLight(2, 1, 0.25, 1)).toBe(0)
  })

  it('walk a key to the next held note, and a key alone an octave', () => {
    const rungs = [C4, E4, G4].map((hz) => Math.log2(hz / 10) % 1)
    const at = (hz: number) => Math.log2(hz / 10)
    expect(staircaseChordStep(at(C4), rungs, 3, 1)).toBeCloseTo(4 / 12, 6)
    expect(staircaseChordStep(at(E4), rungs, 3, 1)).toBeCloseTo(3 / 12, 6)
    expect(staircaseChordStep(at(G4), rungs, 3, 1)).toBeCloseTo(5 / 12, 6)
    expect(staircaseChordStep(at(C4), rungs, 3, -1)).toBeCloseTo(5 / 12, 6)
    expect(staircaseChordStep(at(C4), rungs, 1, 1)).toBe(1)
    // `kSameNote`: a key five cents off a rung is on it.
    expect(staircaseChordStep(at(C4) + 0.003, rungs, 1, 1)).toBe(1)
  })

  it('begin the climb at the first key after a silence', () => {
    // The first key's release (1.8 s) was 100 dB down 3 s after it went up: 22 s ago.
    expect(staircaseRun([note(C4, 30, 25), note(E4, 2)], 0.25, 1.8)).toBe(1)
    // Here it still fades when the second key comes: one run.
    expect(staircaseRun([note(C4, 6, 4), note(E4, 2)], 0.25, 1.8)).toBe(0)
    expect(staircaseRun([note(C4, 30, 25)], 0.25, 1.8)).toBe(-1)
    expect(staircaseRun([], 0.25, 1.8)).toBe(-1)
  })

  it('glide, step by semitones and walk the chord as `climb` and `walk` do', () => {
    const rungs = new Float64Array(16)
    const glide = stairClimb(0)
    staircaseAdvance(glide, [], 0, 10, 0, 1, 0.35, rungs)
    expect(glide.global).toBeCloseTo(1, 9)

    // Speed 0.5 is a step a second; Slide 0.3 moves for 0.3 s of it.
    const steps = stairClimb(1)
    staircaseAdvance(steps, [], 0, 1.15, 1, 0.5, 0.3, rungs)
    expect(steps.global).toBeCloseTo(0.5 / 12, 6)
    staircaseAdvance(steps, [], 1.15, 1.35, 1, 0.5, 0.3, rungs)
    expect(steps.global).toBeCloseTo(2 / 12, 6)
    const down = stairClimb(1)
    staircaseAdvance(down, [], 0, 3.5, 1, -0.5, 0, rungs)
    expect(down.global).toBeCloseTo(-3 / 12, 6)

    // Three held keys each go to the next of them, and are an octave up after three steps.
    const keys = [stairKey(C4), stairKey(E4), stairKey(G4)]
    const walk = stairClimb(2)
    staircaseAdvance(walk, keys, 0, 1.5, 2, 0.5, 0, rungs)
    expect(keys.map((key) => key.walk * 12)).toEqual([
      expect.closeTo(4, 5),
      expect.closeTo(3, 5),
      expect.closeTo(5, 5),
    ])
    staircaseAdvance(walk, keys, 1.5, 2, 2, 0.5, 0, rungs)
    for (const key of keys) expect(key.walk).toBeCloseTo(1, 6)
    expect(walk.global).toBe(0)

    // One key alone walks by octaves; with no key down the fading ones stay.
    const alone = [stairKey(C4)]
    staircaseAdvance(stairClimb(2), alone, 0, 2.5, 2, 0.5, 0, rungs)
    expect(alone[0].walk).toBeCloseTo(2, 6)
    const let_go = [{ ...stairKey(C4), up: 0.5, end: 20 }]
    staircaseAdvance(stairClimb(2), let_go, 0, 2.5, 2, 0.5, 0, rungs)
    expect(let_go[0].walk).toBe(0)
  })

  it('settle onto the grid when Motion is switched under held keys', () => {
    const rungs = new Float64Array(16)
    const climb = stairClimb(0)
    staircaseAdvance(climb, [], 0, 3, 0, 1, 0, rungs)
    expect(climb.global).toBeCloseTo(0.3, 9)
    // To Semitones at Speed 0: the nearest twelfth, at four octaves a second.
    staircaseAdvance(climb, [], 3, 0.1, 1, 0, 0, rungs)
    expect(climb.global).toBeCloseTo(4 / 12, 9)
  })

  it('lay the stairs ahead corner by corner', () => {
    const corners = new Float32Array(64)
    const key = stairKey(C4)
    const pairs = staircaseAhead(corners, stairClimb(1), key, 3, 0.5, 0.5, [], 0)
    const got = Array.from(corners.subarray(0, pairs * 2), (value, i) =>
      i % 2 === 0 ? value : (value - key.key) * 12,
    )
    // A tread of a second, then half a second of riser up a semitone, twice.
    const want = [0, 0, 1, 0, 1.5, 1, 2, 1, 2.5, 2, 3, 2]
    expect(got).toHaveLength(want.length)
    got.forEach((value, i) => expect(value).toBeCloseTo(want[i], 4))
    // In Glide, one straight line: 0.3 of an octave in three seconds at Speed 1.
    const line = staircaseAhead(corners, stairClimb(0), key, 3, 1, 0.5, [], 0)
    expect(line).toBe(2)
    expect(corners[3] - key.key).toBeCloseTo(0.3, 5)
  })

  it('go round an octave, and three in Chord, from half a semitone under a C', () => {
    const c4 = Math.log2(C4 / 10)
    expect(staircaseHeight(c4, 1)).toBeCloseTo(1 / 24, 5)
    expect(staircaseHeight(c4 + 11 / 12, 1)).toBeCloseTo(23 / 24, 5)
    expect(staircaseHeight(c4, 2)).toBeCloseTo((1 + 1 / 24) / 3, 5)
    expect(staircaseHeight(c4 + 2, 2)).toBeCloseTo(1 / 72, 5)
  })
})

/** The strokes and fills laid in the accent that have a shape. */
const lights = (paths: DrawnPath[], kind: 'stroke' | 'fill'): DrawnPath[] =>
  paths.filter((path) => path.kind === kind && path.colour === accent && path.points.length > 1)

describe('the staircase’s display', () => {
  const { display } = TURN_INSTRUMENT_FACES.staircase
  const params = paramsOf('staircase')
  const draw = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(drawDisplay(display, params, { values, notes, signal: testSignal() }))
  /** The bars of the keys that sound: the accent's thick strokes, one for each key. */
  const bars = (paths: DrawnPath[]): DrawnPath[] =>
    lights(paths, 'stroke').filter((path) => path.width === 1.75)
  /** A bar's place in its octave on the bell, 0..1: the bell is 72 px high over ten octaves, from y 15. */
  const inOctave = (path: DrawnPath): number => (((87 - path.points[0][1]) / 7.2) % 1) + 0
  /** The stairs: the ink's strokes a pixel and a half wide. */
  const stairs = (paths: DrawnPath[]): DrawnPath[] =>
    paths.filter((path) => path.kind === 'stroke' && path.colour === ink && path.width === 1.5)

  it('lights nothing at rest, and the bars of each key that sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)), 'stroke')).toHaveLength(0)
    expect(lights(draw({}, []), 'stroke')).toHaveLength(0)
    expect(bars(draw({}, [note(C4, 0.5)]))).toHaveLength(1)
    expect(bars(draw({}, [note(C4, 0.5), note(E4, 0.5), note(G4, 0.5)]))).toHaveLength(3)
  })

  it('puts a key out when its release has run, and keeps it lit until then', () => {
    expect(bars(draw({ release: 2 }, [note(C4, 3, 1)]))).toHaveLength(1)
    expect(bars(draw({ release: 2 }, [note(C4, 3, 1.97)]))).toHaveLength(0)
    expect(bars(draw({ release: 12 }, [note(C4, 3, 1.97)]))).toHaveLength(1)
  })

  it('moves a key’s bars by its age: half an octave in five seconds of a glide at full speed', () => {
    const at = (age: number, speed: number) =>
      inOctave(bars(draw({ motion: 0, speed }, [note(C4, age)]))[0])
    const from = at(0.4, 0)
    expect(at(5, 0)).toBeCloseTo(from, 4)
    expect((at(5, 1) - from + 1) % 1).toBeCloseTo(0.5, 3)
    expect((at(5, -1) - from + 1) % 1).toBeCloseTo(0.5, 3)
    expect((at(2, 1) - from + 1) % 1).toBeCloseTo(0.2, 3)
  })

  it('sounds every octave of a key, and every third in Chord', () => {
    const apart = (motion: number): number => {
      const [key] = bars(draw({ motion, speed: 0, span: 8 }, [note(C4, 1)]))
      const ys = key.points.filter((_, i) => i % 2 === 0).map(([, y]) => y)
      return ys[0] - ys[1]
    }
    expect(apart(0)).toBeCloseTo(7.2, 4)
    expect(apart(1)).toBeCloseTo(7.2, 4)
    expect(apart(2)).toBeCloseTo(21.6, 4)
  })

  /** Where a key stands in the three octaves a Chord key goes round, from the first of its bars. */
  const rung = (path: DrawnPath): number => ((87 - path.points[0][1]) / 7.2 + 1) % 3
  const rungOf = (hz: number): number => Math.log2(hz / 10) % 3

  it('starts the walk at the first key into a silence and takes a held chord up note by note', () => {
    // `climb`: a step every 1 / (4 × 0.45²) = 1.235 s, counted from `restart`, the first key.
    const chord = (age: number): number[] =>
      bars(draw({ slide: 0 }, [note(C4, age), note(E4, age), note(G4, age)])).map(rung)
    const want = (at: number[], keys: number[]) =>
      keys.forEach((hz, i) => expect(at[i]).toBeCloseTo(rungOf(hz), 3))
    want(chord(1.2), [C4, E4, G4])
    // `walk`: each key goes to the next pitch class above it that a held key is on.
    want(chord(1.3), [E4, G4, C4 * 2])
    want(chord(2.5), [G4, C4 * 2, E4 * 2])
  })

  it('counts a later key into the run it joins, and from itself after a silence', () => {
    const late = (first: DisplayNote): number => {
      const lit = bars(draw({ slide: 0 }, [first, note(E4, 1.2)]))
      return rung(lit[lit.length - 1])
    }
    // The run is 31 s old: its 25th step fell 0.14 s ago and took the E to the next held note, a C.
    expect(late(note(C4, 31))).toBeCloseTo(rungOf(C4 * 2), 3)
    // The first key had died away: the E began a run of its own 1.2 s ago, and has not stepped.
    expect(late(note(C4, 31, 25))).toBeCloseTo(rungOf(E4), 3)
  })

  it('draws the second set of Chorus on both sides of each bar, to neither side of its pitch', () => {
    const still = { motion: 0, speed: 0, shape: 0 }
    const thin = (chorus: number): DrawnPath[] =>
      lights(draw({ ...still, chorus }, [note(C4, 1)]), 'stroke').filter(
        (path) => path.width === 0.75,
      )
    const ys = (path: DrawnPath): number[] =>
      path.points.filter((_, i) => i % 2 === 0).map(([, y]) => y)
    const [key] = bars(draw({ ...still, chorus: 1 }, [note(C4, 1)]))
    const [second] = thin(1)
    const twins = ys(second)
    const beside = (off: number): number =>
      twins.filter((y) => ys(key).some((bar) => Math.abs(y - bar - off) < 1e-6)).length
    expect(twins.length).toBeGreaterThan(0)
    expect(beside(-1.5)).toBe(twins.length / 2)
    expect(beside(1.5)).toBe(twins.length / 2)
    expect(thin(0)).toHaveLength(0)
  })

  it('draws the stairs rising when Speed is over zero, falling under it, and level at zero', () => {
    const run = (speed: number): number => {
      const [flight] = stairs(
        drawnPaths(drawDisplay(display, params, { values: { motion: 0, speed } })),
      )
      const [first, second] = flight.points
      return first[1] - second[1]
    }
    expect(run(0.5)).toBeGreaterThan(1)
    expect(run(-0.5)).toBeLessThan(-1)
    expect(run(0)).toBe(0)
  })

  it('bends the climb when a knob is turned under a held key, as the device does', () => {
    // A key a second old glides at full speed for one second more, then Speed goes to zero.
    const last = runDisplay(display, params, 2.5, { signal: testSignal() }, (time) => ({
      values: { motion: 0, speed: time < 1 ? 1 : 0 },
      notes: [note(C4, 1 + time)],
    }))
    const still = inOctave(bars(draw({ motion: 0, speed: 0 }, [note(C4, 3.5)]))[0])
    // Two seconds at a tenth of an octave a second, give or take a frame.
    expect((inOctave(bars(drawnPaths(last))[0]) - still + 1) % 1).toBeCloseTo(0.2, 1)
  })
})

describe('the rewind’s figures', () => {
  it('build a source’s partials as `Rewind::build` does', () => {
    const bell = rewindBuild(1, 220, rewindPartials())
    expect(bell.count).toBe(12)
    expect(bell.ring).toBeCloseTo(16, 5)
    // The hum an octave down, and the prime decaying 2^0.7 times as fast.
    expect(bell.hz[0]).toBeCloseTo(110, 3)
    expect(bell.rate[1]).toBeCloseTo(Math.pow(2, 0.7), 5)
    // On a key at 4 kHz the partials over 18 kHz are left out: 0.5 to 4 times the key are eight.
    expect(rewindBuild(1, 4000, rewindPartials()).count).toBe(8)

    // The bowl's modes are pairs, 0.6 Hz apart on the lowest at 220 Hz, the upper half the mate.
    const bowl = rewindBuild(3, 220, rewindPartials())
    expect(bowl.ring).toBeCloseTo(20, 5)
    expect(bowl.hz[0]).toBeCloseTo(220 - 0.24, 3)
    expect(bowl.hz[1]).toBeCloseTo(220 + 0.36, 3)
    expect(Array.from(bowl.mate.subarray(0, 4))).toEqual([0, 1, 0, 1])

    // A piano string at 110 Hz: harmonics 1 to 6, then 8, 12, 17, 24, 34 and 48, the eighth 0.7 % sharp.
    const piano = rewindBuild(0, 110, rewindPartials())
    expect(piano.count).toBe(12)
    expect(piano.ring).toBeCloseTo(11, 5)
    expect(piano.hz[6]).toBeCloseTo(886.07, 1)
    expect(
      Array.from(piano.rate.subarray(6), (rate) => Math.round(Math.pow(rate, 1 / 0.65))),
    ).toEqual([8, 12, 17, 24, 34, 48])
    // A plucked one reaches 6 kHz: 8, 11, 15, 21, 29 and 40, each decaying as fast as its number.
    const pluck = rewindBuild(2, 110, rewindPartials())
    expect(pluck.ring).toBeCloseTo(4.5, 5)
    expect(Array.from(pluck.rate.subarray(6))).toEqual([8, 11, 15, 21, 29, 40])
  })

  it('level each set of weights half by its sum and half by its power', () => {
    const bell = rewindBuild(1, 220, rewindPartials())
    for (const tone of [0, 0.5, 1]) {
      let sum = 0
      let power = 0
      for (let k = 0; k < bell.count; k++) {
        sum += rewindWeight(bell, k, tone)
        power += rewindWeight(bell, k, tone) ** 2
      }
      expect(sum * Math.sqrt(power)).toBeCloseTo(1, 5)
    }
    // Between two sets Tone reads between them.
    expect(rewindWeight(bell, 3, 0.25)).toBeCloseTo(
      (rewindWeight(bell, 3, 0) + rewindWeight(bell, 3, 0.5)) / 2,
      6,
    )
    // Darker is more of the hum, brighter more of the top.
    expect(rewindWeight(bell, 0, 0)).toBeGreaterThan(rewindWeight(bell, 0, 1))
    expect(rewindWeight(bell, 11, 1)).toBeGreaterThan(rewindWeight(bell, 11, 0))
  })

  it('start the slowest partial 1.8 to 12 nepers down, by Rise', () => {
    expect(rewindDeep(0)).toBeCloseTo(1.8, 6)
    expect(rewindDeep(1)).toBeCloseTo(12, 6)
    expect(rewindDeep(0.5)).toBeCloseTo(Math.sqrt(21.6), 6)
  })

  it('grow each partial towards the strike, the fast ones later', () => {
    expect(rewindBody(4, 1, 1)).toBe(1)
    expect(rewindBody(4, 1, 0.5)).toBeCloseTo(Math.exp(-2), 9)
    // Eight times as fast is 32 nepers deep: dormant until 16 are left, half way.
    expect(rewindBody(4, 8, 0.4)).toBe(0)
    expect(rewindBody(4, 8, 0.75)).toBeCloseTo(Math.exp(-8), 12)
    // `kDeepest`: never more than 120 nepers.
    expect(rewindBody(12, 27, 0.9)).toBeCloseTo(Math.exp(-12), 12)
    expect(rewindGate(0)).toBe(0)
    expect(rewindGate(0.06)).toBeCloseTo(0.5, 9)
    expect(rewindGate(0.12)).toBe(1)
  })

  it('bring a held key’s note to rest short of its strike, and land it 60 ms after the key goes up', () => {
    expect(rewindRest(12)).toBeCloseTo(0.85, 9)
    expect(rewindRest(Math.sqrt(21.6))).toBeCloseTo(1 - 0.7 / Math.sqrt(21.6), 9)
    expect(rewindRest(1.8)).toBeCloseTo(1 - 0.7 / 1.8, 9)
    expect(rewindRest(1)).toBe(0.5)
    // Swell 2 s, resting at 0.85: straight to 0.7, then slowing with a time constant of 0.15 of the swell.
    expect(rewindHeld(1, 2, 12)).toBeCloseTo(0.5, 9)
    expect(rewindHeld(1.4, 2, 12)).toBeCloseTo(0.7, 9)
    expect(rewindHeld(1.7, 2, 12)).toBeCloseTo(0.7 + 0.15 * (1 - Math.exp(-1)), 9)
    expect(rewindHeld(60, 2, 12)).toBeCloseTo(0.85, 6)

    const where = { place: 0, after: 0 }
    expect(rewindWhere(false, 2, 12, 1, null, where)).toEqual({ place: 0.5, after: -1 })
    // After swell lands whatever the key does.
    expect(rewindWhere(false, 2, 12, 3, 2.9, where)).toEqual({ place: 1, after: 1 })
    expect(rewindWhere(true, 2, 12, 60, null, where).after).toBe(-Infinity)
    expect(where.place).toBeCloseTo(0.85, 6)
    rewindWhere(true, 2, 12, 60, 0.03, where)
    expect(where.place).toBeCloseTo(0.925, 6)
    expect(where.after).toBeCloseTo(-0.03, 9)
    expect(rewindWhere(true, 2, 12, 60, 1, where).after).toBeCloseTo(0.94, 9)
    // Let go early, it runs in from where it was.
    expect(rewindWhere(true, 2, 12, 0.43, 0.03, where).place).toBeCloseTo(0.6, 6)
  })

  it('stop dead at Tail 0 and ring for the source’s own time at Tail 1', () => {
    expect(rewindStop(C4)).toBe(0.002)
    expect(rewindStop(100)).toBeCloseTo(0.005, 9)
    expect(rewindStop(50)).toBe(0.006)
    expect(rewindFallSeconds(0, 11, 1, 1000)).toBe(0.002)
    // A ring of 6.9078 s is a time constant of a second; Tail scales it by its square.
    expect(rewindFallSeconds(1, 6.907755279, 1, 1000)).toBeCloseTo(1.002, 6)
    expect(rewindFallSeconds(0.5, 6.907755279, 2, 1000)).toBeCloseTo(0.127, 6)
  })

  it('surge at the strike, gather the ghost ahead of it, and wobble as the header does', () => {
    expect(rewindSurge(1, 0)).toBeCloseTo(2.5, 9)
    expect(rewindSurge(0.4, 0.012)).toBeCloseTo(1 + 0.6 / Math.E, 9)
    expect(rewindSurge(0, 0)).toBe(1)
    expect(rewindGhost(1, 4, 1)).toBe(0)
    expect(rewindGhost(0, 4, 0.5)).toBe(0)
    expect(rewindGhost(1, 4, 0.5)).toBeCloseTo(Math.exp(-1.3) * 0.9375, 6)
    expect(rewindWow(1, 0)).toBe(0)
    expect(rewindWow(0, 0.4)).toBe(0)
    // A quarter turn of the slow sine: 0.0104 (0.75 + 0.25 sin(2π 2.3 / 2.2)).
    expect(rewindWow(1, 1 / 2.2)).toBeCloseTo(0.0104 * (0.75 + 0.25 * 0.2817), 5)
    expect(rewindWow(0.25, 1 / 2.2)).toBeCloseTo(rewindWow(1, 1 / 2.2) / 8, 9)
    expect(rewindSecond(1)).toBe(0.5)
    expect(rewindSecond(0.25)).toBe(0.25)
    expect(rewindBeatHz(1000, 1)).toBeCloseTo(8, 6)
    expect(rewindBeat(0.6, 0.4, 0)).toBeCloseTo(1, 9)
    expect(rewindBeat(0.6, 0.4, 0.5)).toBeCloseTo(0.2, 9)
  })

  it('are loudest on the strike', () => {
    const piano = rewindBuild(0, C4, rewindPartials())
    const level = (place: number, after: number, tail = 0.45) =>
      rewindLevel(piano, C4, rewindDeep(0.5), 0.5, tail, place, after)
    expect(level(1, 0)).toBeCloseTo(1, 9)
    expect(level(0.5, -1)).toBeLessThan(level(0.8, -1))
    expect(level(0.8, -1)).toBeLessThan(1)
    expect(level(0, -1)).toBe(0)
    // Tail 0: 25 time constants of 2 ms after the strike nothing is left.
    expect(level(1, 0.05, 0)).toBeLessThan(1e-9)
    expect(level(1, 0.05, 1)).toBeGreaterThan(0.5)
  })

  it('give a note the gain `note_gain` levels it to, and end its tail at the device’s floor', () => {
    // The device itself, run at 48 kHz with Swell 0.5 s and Rise 0.5, gives these gains (`amp`) and
    // these times from the strike to the tick a voice is retired on.
    const deep = rewindDeep(0.5)
    const cases = [
      { source: 0, tail: 0.6, gain: 0.8, hz: C4, snap: 0.4, amp: 0.3203, rings: 4.282 },
      { source: 1, tail: 1, gain: 1, hz: C4 / 4, snap: 0, amp: 0.4279, rings: 41.384 },
      { source: 2, tail: 0.6, gain: 0.5, hz: C4, snap: 0.4, amp: 0.1627, rings: 1.858 },
      { source: 3, tail: 0.3, gain: 0.2, hz: C4 * 4, snap: 1, amp: 0.0365, rings: 1.647 },
    ]
    for (const each of cases) {
      const partials = rewindBuild(each.source, each.hz, rewindPartials())
      const amp = rewindAmp(partials, each.hz, each.gain, false, 0.5, deep, each.tail, each.snap)
      expect(amp / each.amp).toBeCloseTo(1, 2)
      expect(rewindRings(partials, each.hz, amp, 0.5, each.tail) / each.rings).toBeCloseTo(1, 1)
    }
    // A soft key's tail is under the floor sooner than a hard one's, and Tail 0 leaves next to none.
    const piano = rewindBuild(0, C4, rewindPartials())
    const soft = rewindAmp(piano, C4, 0.2, false, 0.5, deep, 0.6, 0.4)
    const hard = rewindAmp(piano, C4, 1, false, 0.5, deep, 0.6, 0.4)
    expect(rewindRings(piano, C4, soft, 0.5, 0.6)).toBeLessThan(
      rewindRings(piano, C4, hard, 0.5, 0.6) - 0.5,
    )
    expect(rewindRings(piano, C4, hard, 0.5, 0)).toBeLessThan(0.03)
    expect(rewindRings(piano, C4, 0, 0.5, 1)).toBe(0)
  })

  it('begin the tape’s wow at the first note after a silence', () => {
    // The first note went quiet four seconds ago and the second began one second ago: a new run.
    expect(rewindRun([note(C4, 10), note(E4, 1)], [4, -3])).toBe(1)
    // Here the first still sounded when the second came, though it is quiet by now: one run.
    expect(rewindRun([note(C4, 5), note(E4, 1)], [0.5, -3])).toBe(0)
    expect(rewindRun([note(C4, 5), note(E4, 1)], [-0.5, -3])).toBe(0)
    expect(rewindRun([note(C4, 10)], [4])).toBe(-1)
    // A key held under On release has no strike yet and sounds for ever.
    expect(rewindRun([note(C4, 100)], [-Infinity])).toBe(0)
    expect(rewindRun([], [])).toBe(-1)
  })

  it('say the wow in cents: 18 either way at Wobble 1', () => {
    expect(rewindWowCents(1)).toBeCloseTo(17.91, 2)
    expect(rewindWowCents(0.25)).toBeCloseTo(17.91 / 8, 1)
    expect(rewindWowCents(0)).toBe(0)
  })
})

describe('the rewind’s display', () => {
  const { display } = TURN_INSTRUMENT_FACES.rewind
  const params = paramsOf('rewind')
  const frame = (values: Record<string, number>, notes: DisplayNote[]): RecordingContext =>
    drawDisplay(display, params, { values, notes, signal: testSignal(), width: 204 })
  /** Where each lit note stands: the right edge of the brightest stretch of the tape cut out for it. */
  const cursors = (drawn: RecordingContext): number[] =>
    drawn.calls
      .filter((call) => call.name === 'rect' && call.args[2] === 5)
      .map((call) => (call.args[0] as number) + 5)
  /** The strike on the upright plate, 204 px wide: 62 % along a tape 192 px wide that starts at 6. */
  const strike = 6 + 119

  it('lights nothing at rest, and a note from its key on', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)), 'fill')).toHaveLength(0)
    expect(cursors(frame({}, []))).toHaveLength(0)
    expect(cursors(frame({}, [note(C4, 0.01)]))).toHaveLength(1)
    expect(lights(drawnPaths(frame({}, [note(C4, 0.5)])), 'fill').length).toBeGreaterThan(0)
    expect(cursors(frame({}, [note(C4, 0.5), note(E4, 0.3), note(G4, 0.1)]))).toHaveLength(3)
  })

  it('runs a note along the swell by its age and lands it on the strike', () => {
    expect(cursors(frame({ swell: 2 }, [note(C4, 1)]))[0]).toBeCloseTo(6 + 119 / 2, 4)
    expect(cursors(frame({ swell: 2 }, [note(C4, 2)]))[0]).toBeCloseTo(strike, 4)
    expect(cursors(frame({ swell: 4 }, [note(C4, 2)]))[0]).toBeCloseTo(6 + 119 / 2, 4)
    // The key going up changes nothing: the note lands Swell after it went down.
    expect(cursors(frame({ swell: 2 }, [note(C4, 1, 0.9)]))[0]).toBeCloseTo(6 + 119 / 2, 4)
    // Past the strike it runs on at the swell's own pace: 119 px in 2 s.
    expect(cursors(frame({ swell: 2, tail: 1 }, [note(C4, 2.5)]))[0]).toBeCloseTo(strike + 29.75, 3)
  })

  it('puts a note out at once when it stops dead, and keeps a ringing one lit', () => {
    const landed = [note(C4, 1.6)]
    expect(cursors(frame({ swell: 1.5, tail: 0 }, landed))).toHaveLength(0)
    expect(cursors(frame({ swell: 1.5, tail: 0.45 }, landed))).toHaveLength(1)
    // At Tail 0.45 a piano's middle C is 60 dB down some 1.4 s after its strike.
    expect(cursors(frame({ swell: 0.2, tail: 0.45 }, [note(C4, 0.2 + 2.5)]))).toHaveLength(0)
    // A ringing one that has run off the tape is a dot at its right edge, 198.
    const off = frame({ swell: 0.2, tail: 1 }, [note(C4, 0.2 + 2.5)])
    expect(cursors(off)).toHaveLength(0)
    expect(off.calls.filter((call) => call.name === 'arc' && call.args[0] === 198)).toHaveLength(1)
  })

  it('flashes the strike as a note lands', () => {
    const flash = (age: number) =>
      lights(drawnPaths(frame({ swell: 1 }, [note(C4, age)])), 'stroke').filter(
        (path) => path.points[0][0] === path.points[1][0] && path.width === 2,
      )
    expect(flash(0.9)).toHaveLength(0)
    expect(flash(1.05)).toHaveLength(1)
    expect(flash(1.05)[0].points[0][0]).toBeCloseTo(strike, 4)
    expect(flash(1.3)).toHaveLength(0)
  })

  it('holds a note at its rest under a held key, and lands it when the key goes up', () => {
    // On release the wait is drawn 17 px wide before the strike, so the swell has 102 px.
    const rest = 6 + rewindRest(rewindDeep(0.5)) * 102
    const on = { strike: 1, swell: 1 }
    expect(cursors(frame(on, [note(C4, 0.4)]))[0]).toBeCloseTo(6 + 0.4 * 102, 4)
    expect(cursors(frame(on, [note(C4, 30)]))[0]).toBeCloseTo(rest, 3)
    expect(cursors(frame(on, [note(C4, 300)]))[0]).toBeCloseTo(rest, 3)
    // Let go 30 ms ago it is half way through its run in; a second ago it has landed and, at Tail 0, gone.
    const half = cursors(frame(on, [note(C4, 30, 0.03)]))[0]
    expect(half).toBeGreaterThan(rest + 17)
    expect(half).toBeLessThan(strike)
    expect(cursors(frame({ ...on, tail: 0 }, [note(C4, 30, 1)]))).toHaveLength(0)
    expect(cursors(frame({ ...on, tail: 1 }, [note(C4, 30, 0.5)]))[0]).toBeCloseTo(
      strike + 0.44 * 119,
      3,
    )
  })

  it('keeps the swell a note was started with when the knob is turned under it', () => {
    // Started under a swell of 2 s; half a second on the knob goes to 0.5 s. The last of 30 frames
    // finds the note 0.2 + 29/30 s old: still on its way, where a swell of 0.5 s would have landed it.
    const last = runDisplay(display, params, 1, { signal: testSignal(), width: 204 }, (time) => ({
      values: { swell: time < 0.5 ? 2 : 0.5 },
      notes: [note(C4, 0.2 + time)],
    }))
    expect(cursors(last)[0]).toBeCloseTo(6 + ((0.2 + 29 / 30) / 2) * 119, 3)
  })

  it('knows two notes on one key apart, each with what it was started with', () => {
    // The same, with an earlier note of the same key, long landed and gone, still among the notes.
    const last = runDisplay(display, params, 1, { signal: testSignal(), width: 204 }, (time) => ({
      values: { swell: time < 0.5 ? 2 : 0.5 },
      notes: [note(C4, 6 + time, 5 + time), note(C4, 0.2 + time)],
    }))
    expect(cursors(last)).toHaveLength(1)
    expect(cursors(last)[0]).toBeCloseTo(6 + ((0.2 + 29 / 30) / 2) * 119, 3)
  })

  /** The ticks of the tape's scale left of the strike: where each stands. */
  const ticksBefore = (drawn: RecordingContext): number[] =>
    drawnPaths(drawn)
      .filter((path) => path.kind === 'stroke' && path.colour === ink && path.points.length > 1)
      .filter((path) => path.points.every(([, y]) => y === 87 || y === 84))
      .flatMap((path) => path.points.filter(([x], i) => i % 2 === 0 && x < strike))
      .map(([x]) => x)
      .sort((a, b) => a - b)

  it('counts the seconds back from the strike, and on from the key when the strike waits for it', () => {
    // After swell 1 s: a tick every 0.1 s, 11.9 px, back from the strike at 125.
    const back = ticksBefore(frame({ swell: 1 }, []))
    expect(back).toHaveLength(9)
    expect(back[8]).toBe(113.5)
    // On release the swell has 102 px and the note runs straight to 0.699 of it (`hover_at`):
    // 0.1 to 0.6 s after the key, and none where the note slows, waits and runs in.
    expect(ticksBefore(frame({ strike: 1, swell: 1 }, []))).toEqual([
      16.5, 26.5, 36.5, 46.5, 57.5, 67.5,
    ])
  })

  it('says how far the wow goes in cents where the tape can be seen to weave', () => {
    const words = (wobble: number, width: number): string =>
      drawDisplay(display, params, { values: { wobble }, width }).words().join(' ')
    expect(words(0.8, 204)).toContain('wow ±13 ct')
    expect(words(0.15, 204)).not.toContain('wow')
    expect(words(0.8, 128)).not.toContain('wow')
  })

  it('begins the wow again after a silence, and not while an earlier tail still rings', () => {
    /** The upper edge of the tape: it weaves with the wow. */
    const edge = (notes: DisplayNote[]): string =>
      JSON.stringify(
        drawnPaths(frame({ wobble: 1, tail: 1 }, notes)).find(
          (path) => path.kind === 'stroke' && path.colour === ink && path.width === 1.25,
        )?.points,
      )
    const high = note(C4 * 4, 0.5)
    // A low piano key at Tail 1 rings some 25 s after its strike, whatever key comes after it.
    expect(edge([note(C4 / 4, 11.5), high])).not.toBe(edge([high]))
    expect(edge([note(C4 / 4, 41.5), high])).toBe(edge([high]))
  })
})
