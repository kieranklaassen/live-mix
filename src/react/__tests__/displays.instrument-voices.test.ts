// The truth of the voices' displays: the ladder of harmonics stands as the
// device's own figures leave each one, the mouth is lit only where it is
// known to be, and a flock is drawn where its birds certainly are.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  OVERTONE_LADDER,
  VOICE_INSTRUMENT_FACES,
  flockCall,
  flockCallSpeed,
  flockDisplaced,
  flockFlyCents,
  flockHarmonic,
  flockNear,
  flockPlace,
  flockScatterCents,
  flockSeat,
  flockStaying,
  flockStrayCents,
  overtoneAir,
  overtoneBand,
  overtoneDrone,
  overtoneHarmonicFor,
  overtoneHeard,
  overtoneHome,
  overtoneLevel,
  overtoneRattle,
  overtoneReach,
  overtoneStretch,
  overtoneTerms,
  overtoneVibratoCents,
  overtoneWhistle,
  overtoneWhistleShare,
} from '../components/displays/instrument-voices'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

const note = (frequency: number, age: number, released: number | null = null): DisplayNote => ({
  id: Math.round(frequency),
  frequency,
  gain: 1,
  age,
  released,
})
/** The strokes laid in the accent: the light on what sounds. */
const lights = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter((path) => path.kind === 'stroke' && path.colour === accent && path.points.length > 1)

interface Spot {
  x: number
  y: number
  radius: number
  alpha: number
}
/** The round marks filled in one colour: a bird, the mouth's place on its stone. */
function spots(drawn: RecordingContext, colour: string): Spot[] {
  const out: Spot[] = []
  let round: number[] | null = null
  let fill = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') round = null
    else if (call.name === 'arc') round = call.args as number[]
    else if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fill' && round && fill === colour && alpha > 0)
      out.push({ x: round[0], y: round[1], radius: round[2], alpha })
  }
  return out
}

/** A spectrum as the analyser would read the device with the mouth asked for `asked`. */
const heard = (pitches: number[], asked: number, focus: number): Float32Array => {
  const bins = new Float32Array(1024).fill(-120)
  const binHz = 48000 / 2048
  for (const hz of pitches) {
    const k = overtoneHarmonicFor(asked, hz)
    for (let n = 1; n * hz < 12000; n++) {
      const bin = Math.round((n * hz) / binHz)
      const db = 20 * Math.log10(overtoneLevel(0, hz, n, k, focus)) - 30
      bins[bin] = Math.max(bins[bin], db)
      bins[bin - 1] = Math.max(bins[bin - 1], db - 8)
      bins[bin + 1] = Math.max(bins[bin + 1], db - 8)
    }
  }
  return bins
}

describe('the overtone’s figures', () => {
  it('give a note as many harmonics as fit under 16 kHz, as `Overtone::start` counts them', () => {
    // 16000 / (110 × 1.05) is 138.5; at 32 kHz the top is 0.42 of the rate, 13440 Hz.
    expect(overtoneTerms(110, 48000)).toBe(138)
    expect(overtoneTerms(110, 32000)).toBe(116)
    expect(overtoneTerms(8000, 48000)).toBe(1)
    expect(overtoneTerms(16000, 48000)).toBe(1)
  })

  it('stand home on the rung nearest the knob, the lower of two as near', () => {
    expect(OVERTONE_LADDER).toEqual([3, 4, 5, 6, 8, 9, 10, 12, 16])
    expect(overtoneHome(3)).toBe(0)
    expect(overtoneHome(8)).toBe(4)
    // 7 is as far from 6 as from 8, 11 from 10 as from 12, 14 from 12 as from 16.
    expect(OVERTONE_LADDER[overtoneHome(7)]).toBe(6)
    expect(OVERTONE_LADDER[overtoneHome(11)]).toBe(10)
    expect(OVERTONE_LADDER[overtoneHome(14)]).toBe(12)
    expect(OVERTONE_LADDER[overtoneHome(14.5)]).toBe(16)
    expect(overtoneHome(16)).toBe(8)
  })

  it('let the walk go up to three rungs from home, as `Overtone::reach` rounds Wander up', () => {
    expect(overtoneReach(0)).toBe(0)
    expect(overtoneReach(0.01)).toBe(1)
    expect(overtoneReach(0.33)).toBe(1)
    expect(overtoneReach(0.34)).toBe(2)
    expect(overtoneReach(0.5)).toBe(2)
    expect(overtoneReach(0.67)).toBe(3)
    expect(overtoneReach(1)).toBe(3)
  })

  it('bring the harmonic down for a note too high to whistle it, as `Overtone::harmonic_for` does', () => {
    // Nothing whistles over 4 kHz: at 110 Hz the 36th fits, at 440 Hz the 9th.
    expect(overtoneHarmonicFor(16, 110)).toBe(16)
    // By octaves while it is even: 16 to 8, 12 to 6, 10 to 5.
    expect(overtoneHarmonicFor(16, 440)).toBe(8)
    expect(overtoneHarmonicFor(12, 440)).toBe(6)
    expect(overtoneHarmonicFor(10, 440)).toBe(5)
    expect(overtoneHarmonicFor(9, 440)).toBe(9)
    // An odd one comes down to the highest rung that fits: at C5 the 7th is the top, so 9 gives 6.
    expect(overtoneHarmonicFor(9, 523.25)).toBe(6)
    expect(overtoneHarmonicFor(5, 1000)).toBe(4)
    expect(overtoneHarmonicFor(7.5, 880)).toBe(4)
    // Over 1.3 kHz no rung fits: the octave, then the note itself.
    expect(overtoneHarmonicFor(3, 1500)).toBe(2)
    expect(overtoneHarmonicFor(8, 3000)).toBe(1)
  })

  it('give a high note less whistle, as `Overtone::start` sets its reach', () => {
    // (4000 / 8f)², kept between 0.3 and 1.
    expect(overtoneWhistleShare(250)).toBe(1)
    expect(overtoneWhistleShare(500)).toBe(1)
    expect(overtoneWhistleShare(880)).toBeCloseTo(0.32283, 5)
    expect(overtoneWhistleShare(1000)).toBeCloseTo(0.3, 6)
  })

  it('narrow the mouth with Focus from four notes wide to six tenths of one', () => {
    expect(overtoneBand(0)).toBeCloseTo(4, 6)
    expect(overtoneBand(0.5)).toBeCloseTo(1.54919, 5)
    expect(overtoneBand(1)).toBeCloseTo(0.6, 6)
  })
})

describe('the overtone’s sound, harmonic by harmonic', () => {
  it('colours the drone as the body of each Voice does', () => {
    // Throat at 110 Hz, the note itself: the tilt at 1.2 notes leaves 1 / √(1 + (1 / 1.2)²) = 0.76822,
    // the formant at 560 Hz (Q 3.5, 1.6 over the rest) lifts it by 1.00973 and the low-pass at
    // 2800 Hz takes 0.99923.
    expect(overtoneDrone(0, 110, 1, 0)).toBeCloseTo(0.7751, 4)
    // Focus gives the drone way: 1 - 0.3 at the top.
    expect(overtoneDrone(0, 110, 1, 1)).toBeCloseTo(0.7 * 0.7751, 4)
    // Pipe weighs its even harmonics 0.3: the second stands far under the third.
    expect(overtoneDrone(1, 110, 2, 0)).toBeCloseTo(0.17524, 4)
    expect(overtoneDrone(1, 110, 3, 0)).toBeCloseTo(0.60748, 4)
    // Reed takes 0.35 of the bottom away, under 2.5 notes.
    expect(overtoneDrone(2, 110, 1, 0)).toBeCloseTo(0.44849, 4)
    // A high note whistles less and its drone is lifted for it: 1 + 1.3 × (1 - 0.32283) at A5.
    expect(overtoneDrone(0, 880, 1, 0)).toBeCloseTo(1.68317, 4)
  })

  it('gives the harmonic the mouth is on its level back, by Focus', () => {
    // On its own harmonic the two resonators pass all and the gain undoes the tilt: what is left
    // is 0.3 to 1.5 by Focus, times √(8 / k) kept between 0.7 and 1.4.
    expect(overtoneWhistle(110, 8, 8, 1)).toBeCloseTo(1.5, 5)
    expect(overtoneWhistle(110, 8, 8, 0)).toBeCloseTo(0.3, 5)
    expect(overtoneWhistle(110, 3, 3, 1)).toBeCloseTo(2.1, 5)
    expect(overtoneWhistle(110, 16, 16, 1)).toBeCloseTo(1.5 * Math.SQRT1_2, 5)
    // A note at A5 has 0.32283 of it: 1.5 × 1.4 × 0.32283 on its fourth.
    expect(overtoneWhistle(880, 4, 4, 1)).toBeCloseTo(0.67794, 4)
    // One harmonic up, each resonator (Q 8 / 0.6) leaves 0.30274 and the tilt 1 / √82.
    expect(overtoneWhistle(110, 9, 8, 1)).toBeCloseTo(0.1224, 4)
    // The open mouth of Focus 0 lets more of its neighbour through than the whistle of Focus 1.
    expect(overtoneWhistle(110, 9, 8, 0)).toBeCloseTo(0.2184, 4)
  })

  it('adds drone and whistle as the device does, in phase where the mouth is', () => {
    expect(overtoneLevel(0, 110, 8, 8, 0.75)).toBeCloseTo(1.3088, 3)
    expect(overtoneLevel(0, 110, 8, 8, 1)).toBeCloseTo(1.59767, 3)
    // With no mouth it is the drone alone.
    expect(overtoneLevel(0, 110, 8, 0, 1)).toBeCloseTo(overtoneDrone(0, 110, 8, 1), 6)
    // Beside the mouth the two meet out of phase and the harmonic is all but gone.
    expect(overtoneLevel(0, 110, 7, 8, 1)).toBeCloseTo(0.03915, 3)
  })

  it('puts Growl’s rattle half way between the harmonics', () => {
    // Half of each neighbour times 0.8 times the knob, through the body at one and a half notes.
    expect(overtoneRattle(0, 110, 1, 0.5, 0)).toBeCloseTo(0.25543, 4)
    // Under the note there is one neighbour only.
    expect(overtoneRattle(0, 110, 0, 1, 0)).toBeCloseTo(0.37001, 4)
    expect(overtoneRattle(1, 110, 1, 1, 0)).toBeCloseTo(0.35359, 4)
    expect(overtoneRattle(0, 110, 1, 0, 0)).toBe(0)
  })

  it('sends Breath’s air through the body and through the mouth', () => {
    // √(110 / 144000) of a harmonic in a band one note wide, six times through the body.
    expect(overtoneAir(0, 110, 1, 0, 0, 1)).toBeCloseTo(0.16732, 4)
    // The knob is squared, and the mouth whistles the air 24 × √2 times at 110 Hz.
    expect(overtoneAir(0, 110, 8, 0, 1, 0.5)).toBeCloseTo(0.03382, 4)
    expect(overtoneAir(0, 110, 8, 8, 1, 0.5)).toBeCloseTo(0.37686, 3)
    expect(overtoneAir(0, 110, 8, 8, 1, 0)).toBe(0)
  })

  it('brings the vibrato in a fifth of a second after the note, over half a second', () => {
    expect(overtoneVibratoCents(0.1, 1, 0.25)).toBe(0)
    // Half way in, the smooth step is a half: 20 of the 40 cents.
    expect(overtoneVibratoCents(0.45, 1, 0.25)).toBeCloseTo(20, 5)
    expect(overtoneVibratoCents(1, 0.5, 0.25)).toBeCloseTo(20, 5)
    expect(overtoneVibratoCents(1, 1, 0.75)).toBeCloseTo(-40, 5)
  })
})

describe('the overtone’s walk', () => {
  it('starts with the first note after a silence, as `Overtone::restart` does', () => {
    expect(overtoneStretch([], 0.12, 1.2)).toBe(-1)
    expect(overtoneStretch([note(110, 3)], 0.12, 1.2)).toBe(3)
    // A release of 1.2 s is 100 dB down, and its voice idle, after 2 s.
    expect(overtoneStretch([note(110, 5, 1.9)], 0.12, 1.2)).toBe(5)
    expect(overtoneStretch([note(110, 5, 2.1)], 0.12, 1.2)).toBe(-1)
    // A note in another's tail is one stretch with it; one after the tail is a new one.
    expect(overtoneStretch([note(110, 5, 1.5), note(165, 1)], 0.12, 1.2)).toBe(5)
    expect(overtoneStretch([note(110, 5, 1.5), note(165, 1)], 0.12, 0.2)).toBe(1)
  })

  it('is read from the sound where the sound says which rung the mouth is on', () => {
    const binHz = 48000 / 2048
    const read = (pitches: number[], asked: number, bins = heard(pitches, asked, 0.75)) =>
      overtoneHeard(
        bins,
        binHz,
        pitches,
        pitches.map(() => 1),
        pitches.length,
        0,
        0.75,
        0,
        4,
        2,
        48000,
      )
    // Home on 8 with two rungs either way: 5, 6, 8, 9 and 10.
    for (const asked of [5, 6, 8, 9, 10]) {
      expect(OVERTONE_LADDER[read([110], asked)]).toBe(asked)
      expect(OVERTONE_LADDER[read([110, 165], asked)]).toBe(asked)
    }
    // A spectrum that says nothing is not read, nor is silence, nor no note at all.
    expect(read([110], 8, new Float32Array(1024).fill(-40))).toBe(-1)
    expect(read([110], 8, new Float32Array(1024).fill(-Infinity))).toBe(-1)
    expect(read([], 8, heard([110], 8, 0.75))).toBe(-1)
  })
})

describe('the overtone’s display', () => {
  const { display } = VOICE_INSTRUMENT_FACES.overtone
  const params = paramsOf('overtone')
  const still = { wander: 0, vibrato: 0, breath: 0, growl: 0 }
  const draw = (values: Record<string, number>, notes: DisplayNote[] = []) =>
    drawDisplay(display, params, { values, notes })
  /** Where a harmonic stands across the ladder: the handle stands on the knob's. */
  const xOf = (harmonic: number): number =>
    display.handles?.(viewOf(display, params, { values: { overtone: harmonic } }))[0].x ?? NaN
  /** The feet of the rungs and their height at the size the tests draw: 128 by 100. */
  const feet = 73
  const tall = 58
  const topOf = (path: DrawnPath): number => Math.min(...path.points.map(([, y]) => y))

  it('stands each rung as high as the voice leaves its harmonic, 48 dB from foot to top', () => {
    const rungsOf = (values: Record<string, number>) =>
      drawnPaths(draw(values)).find(
        (path) => path.kind === 'stroke' && path.colour !== accent && path.points.length === 32,
      )?.points ?? []
    // Throat with an open mouth far up the ladder: the note itself is 0.7751, 2.2 dB under a bare harmonic.
    const throat = rungsOf({ ...still, voice: 0, focus: 0, overtone: 16 })
    expect(throat[0]).toEqual([xOf(1), feet])
    expect(feet - throat[1][1]).toBeCloseTo(((20 * Math.log10(0.7751) + 40) / 48) * tall, 0)
    // Pipe: the even harmonics stand under the odd ones either side.
    const pipe = rungsOf({ ...still, voice: 1, focus: 0, overtone: 16 })
    expect(pipe[3][1]).toBeGreaterThan(pipe[1][1] + 8)
    expect(pipe[3][1]).toBeGreaterThan(pipe[5][1] + 8)
  })

  it('lifts the harmonic the mouth is on over the drone, by Focus', () => {
    // At Focus 1 the eighth comes out 1.59767 strong, 4.07 dB over a bare harmonic.
    const lifted = drawnPaths(draw({ ...still, focus: 1, overtone: 8 })).filter(
      (path) => path.kind === 'stroke' && path.colour !== accent && path.alpha === 1,
    )
    const highest = Math.min(...lifted.map(topOf))
    expect(feet - highest).toBeCloseTo(((20 * Math.log10(1.59767) + 40) / 48) * tall, 0)
  })

  it('lights nothing at rest, and a held note’s harmonics with the one its mouth is on', () => {
    expect(lights(drawnPaths(draw({})))).toHaveLength(0)
    expect(spots(draw({}), accent)).toHaveLength(0)
    const idle = runDisplay(display, params, 0.1, { signal: testSignal() })
    expect(lights(drawnPaths(idle))).toHaveLength(0)

    const drawn = draw({ ...still, focus: 1, overtone: 12 }, [note(110, 1)])
    const [rungs, mouth] = lights(drawnPaths(drawn))
    // Sixteen rungs, the twelfth the highest, and the mouth's curve over it.
    expect(rungs.points).toHaveLength(32)
    const top = rungs.points.reduce((best, point) => (point[1] < best[1] ? point : best))
    expect(top[0]).toBeCloseTo(xOf(12), 5)
    expect(Math.abs(topOf(mouth) - top[1])).toBeLessThan(6)
    const [stone] = spots(drawn, accent)
    expect(stone.x).toBeCloseTo(xOf(12), 5)
  })

  it('lets the light fall with the release and puts it out 60 dB down', () => {
    const held = lights(drawnPaths(draw(still, [note(110, 3)])))[0]
    // Half way through a release of 1.2 s the note is 30 dB down: 30 of the 48 dB the rungs span.
    const falling = lights(drawnPaths(draw(still, [note(110, 3, 0.6)])))[0]
    expect(topOf(falling) - topOf(held)).toBeCloseTo((30 / 48) * tall, 0)
    expect(lights(drawnPaths(draw(still, [note(110, 3, 1.25)])))).toHaveLength(0)
    expect(lights(drawnPaths(draw({ ...still, release: 4 }, [note(110, 3, 1.25)])))).toHaveLength(2)
  })

  it('lights the harmonic a high note comes down to', () => {
    // A4 cannot whistle its sixteenth: it whistles the eighth, and A5 the fourth.
    const high = spots(draw({ ...still, overtone: 16 }, [note(440, 1)]), accent)
    expect(high[0].x).toBeCloseTo(xOf(8), 5)
    const higher = spots(draw({ ...still, overtone: 16 }, [note(880, 1)]), accent)
    expect(higher[0].x).toBeCloseTo(xOf(4), 5)
  })

  it('lights no more notes than the device has voices, the newest six', () => {
    const chord = Array.from({ length: 8 }, (_, i) => note(55 * Math.pow(2, i / 12), 2 - i * 0.1))
    const all = lights(drawnPaths(draw(still, chord)))[0]
    const six = lights(drawnPaths(draw(still, chord.slice(2))))[0]
    expect(all.points).toHaveLength(6 * 32)
    expect(all.points).toEqual(six.points)
  })
})

describe('the overtone’s walk on its display', () => {
  const { display } = VOICE_INSTRUMENT_FACES.overtone
  const params = paramsOf('overtone')
  const walking = { wander: 0.5, pace: 0.5, overtone: 8, vibrato: 0, focus: 0.75, breath: 0 }
  const xOf = (harmonic: number): number =>
    display.handles?.(viewOf(display, params, { values: { overtone: harmonic } }))[0].x ?? NaN
  /** The line under the stones that fills until the next step: how long it is, 0 when it is not drawn. */
  const clock = (drawn: RecordingContext): number => {
    const line = lights(drawnPaths(drawn)).find(
      (path) => path.points.length === 2 && path.points[0][1] === path.points[1][1],
    )
    return line ? line.points[1][0] - line.points[0][0] : 0
  }

  it('keeps the mouth on home until the first step, a turn of Pace after the first note', () => {
    // At 0.5 Hz the first step is two seconds in.
    const drawn = drawDisplay(display, params, { values: walking, notes: [note(110, 1)] })
    const marks = spots(drawn, accent)
    expect(marks).toHaveLength(1)
    expect(marks[0].x).toBeCloseTo(xOf(8), 5)
    expect(drawn.words().join(' ')).toContain('0.5 Hz  ×8 A5')
  })

  it('does not say where the walk is once it has stepped and the sound does not tell', () => {
    const drawn = drawDisplay(display, params, { values: walking, notes: [note(110, 3)] })
    // One of the rungs within two of home: a small mark on each, and no mouth.
    const marks = spots(drawn, accent)
    expect(marks.map((mark) => mark.x)).toEqual([5, 6, 8, 9, 10].map(xOf))
    expect(marks.every((mark) => mark.radius < 2)).toBe(true)
    expect(lights(drawnPaths(drawn)).filter((path) => path.points.length > 2)).toHaveLength(1)
    expect(drawn.words().join(' ')).toContain('×5…10')
  })

  it('lights the rung the sound says the mouth is on', () => {
    for (const asked of [5, 10]) {
      const signal = { ...testSignal(), spectrum: heard([110], asked, 0.75) }
      const drawn = drawDisplay(display, params, { values: walking, notes: [note(110, 3)], signal })
      const marks = spots(drawn, accent)
      expect(marks).toHaveLength(1)
      expect(marks[0].x).toBeCloseTo(xOf(asked), 5)
      expect(drawn.words().join(' ')).toContain(`×${asked} `)
    }
  })

  it('fills the line under the stones until the next step, all held notes stepping together', () => {
    const at = (age: number, values: Record<string, number> = walking) =>
      clock(drawDisplay(display, params, { values, notes: [note(110, age), note(165, 0.2)] }))
    // 3 s at 0.5 Hz is half way to the second step, 3.8 s nine tenths of the way.
    expect(at(3.8) / at(3)).toBeCloseTo(0.9 / 0.5, 5)
    expect(at(4.4)).toBeCloseTo(at(2.4), 5)
    // With Wander at 0 nothing steps.
    expect(at(3, { ...walking, wander: 0 })).toBe(0)
    // Of a stretch that began before the display could know, the step is not drawn.
    expect(at(50)).toBe(0)
  })

  it('does not trust the beginning of a stretch once the list of notes is full', () => {
    // The device keeps 128 notes and drops the oldest for a new one, held or not.
    const many = (count: number, age: number): DisplayNote[] =>
      Array.from({ length: count }, (_, i) => ({ ...note(110, age), id: i }))
    const short = drawDisplay(display, params, { values: walking, notes: many(127, 3) })
    expect(clock(short)).toBeGreaterThan(0)
    const full = drawDisplay(display, params, { values: walking, notes: many(128, 3) })
    expect(clock(full)).toBe(0)
    // Nor is the mouth home for certain before what looks like the first step.
    const young = drawDisplay(display, params, { values: walking, notes: many(128, 1) })
    expect(spots(young, accent).map((mark) => mark.x)).toEqual([5, 6, 8, 9, 10].map(xOf))
    expect(young.words().join(' ')).toContain('×5…10')
  })

  it('keeps its clock when the first note of a stretch it follows is forgotten', () => {
    // Followed for two seconds from a note 1 s old; half way the list loses that note.
    const last = 59 / 30
    const followed = runDisplay(display, params, 2, { values: walking }, (time) => ({
      notes: [...(time < 1 ? [note(110, 1 + time)] : []), note(165, 0.4 + time)],
    }))
    const whole = drawDisplay(display, params, {
      values: walking,
      notes: [note(110, 1 + last), note(165, 0.4 + last)],
    })
    expect(clock(followed)).toBeGreaterThan(0)
    expect(clock(followed)).toBeCloseTo(clock(whole), 3)
  })

  it('starts its clock again with a stretch that begins while it watches', () => {
    // A full list of notes long gone, then a key: seen from its first frame, its beginning is certain.
    const gone = (time: number): DisplayNote[] =>
      Array.from({ length: 127 }, (_, i) => ({ ...note(110, 60 + time, 55 + time), id: i }))
    const followed = runDisplay(display, params, 4, { values: walking }, (time) => ({
      notes: [...gone(time), ...(time >= 2 ? [note(165, time - 2)] : [])],
    }))
    const alone = drawDisplay(display, params, {
      values: walking,
      notes: [note(165, 119 / 30 - 2)],
    })
    expect(clock(followed)).toBeGreaterThan(0)
    expect(clock(followed)).toBeCloseTo(clock(alone), 3)
  })

  it('loses its clock when frames were missed after Pace moved under the stretch', () => {
    // Three frames on one state: the stretch found, Pace turned, then more than a second not watched.
    const after = (turned: number): number => {
      const state = display.init?.()
      const frames = [
        { now: 10, dt: 0, pace: 0.5 },
        { now: 10.03, dt: 0.03, pace: turned },
        { now: 11.4, dt: 1.37, pace: turned },
      ]
      let line = 0
      for (const { now, dt, pace } of frames)
        line = clock(
          drawDisplay(display, params, {
            values: { ...walking, pace },
            notes: [note(110, now - 9)],
            state,
            now,
            dt,
          }),
        )
      return line
    }
    // The count from the note's age holds only at the pace it was counted at.
    expect(after(0.5)).toBeGreaterThan(0)
    expect(after(0.7)).toBe(0)
  })

  it('stands its handle on the knob’s harmonic, and a drag sets it', () => {
    const settings: Record<string, number>[] = [
      {},
      { overtone: 3 },
      { overtone: 11.5, wander: 0 },
      { overtone: 16 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [overtone] = display.handles?.(view) ?? []
      expect(overtone.drag(overtone.x, overtone.y).overtone).toBeCloseTo(view.value('overtone'), 3)
      expect(overtone.drag(0, overtone.y).overtone).toBe(3)
      expect(overtone.drag(view.width, overtone.y).overtone).toBe(16)
    }
    const view = viewOf(display, params)
    const [overtone] = display.handles?.(view) ?? []
    expect(overtone.drag(overtone.x + 12, overtone.y).overtone).toBeGreaterThan(8.5)
  })
})

describe('the flock’s figures', () => {
  it('seat the last birds an octave off, up, down, down, up, as `Flock::start` does', () => {
    // Three quarters of the birds but the first, by Octaves, rounded.
    expect(flockDisplaced(5, 0.3)).toBe(1)
    expect(flockDisplaced(8, 1)).toBe(5)
    expect(flockDisplaced(8, 0.6)).toBe(3)
    expect(flockDisplaced(2, 1)).toBe(1)
    expect(flockDisplaced(1, 1)).toBe(0)
    expect(flockDisplaced(5, 0)).toBe(0)
    const seats = (hz: number) =>
      Array.from({ length: 8 }, (_, k) => flockSeat(k, 8, flockDisplaced(8, 1), hz, 48000))
    expect(seats(261.63)).toEqual([0, 0, 0, 1, 1, -1, -1, 1])
    // Under 60 Hz there is no octave below (30 Hz), over 4800 Hz none above (a fifth of the rate).
    expect(seats(50)).toEqual([0, 0, 0, 1, 1, 1, 1, 1])
    expect(seats(5000)).toEqual([0, 0, 0, -1, -1, -1, -1, -1])
  })

  it('fly a bird in on a cubic in frequency from where it set out', () => {
    expect(flockFlyCents(1, 1, 0)).toBeCloseTo(1200, 6)
    expect(flockFlyCents(1, -1, 0)).toBeCloseTo(-1200, 6)
    expect(flockFlyCents(1 / 3, -1, 0)).toBeCloseTo(-400, 6)
    // Half way an eighth of the distance in frequency is left: 1200 log2(1.125) above, 1200 log2(0.9375) below.
    expect(flockFlyCents(1, 1, 0.5)).toBeCloseTo(203.91, 2)
    expect(flockFlyCents(1, -1, 0.5)).toBeCloseTo(-111.73, 2)
    expect(flockFlyCents(1, 1, 1)).toBe(0)
  })

  it('make a bird louder as it arrives, from 0.3', () => {
    expect(flockNear(0)).toBeCloseTo(0.3, 6)
    expect(flockNear(0.5)).toBeCloseTo(0.825, 6)
    expect(flockNear(1)).toBe(1)
  })

  it('spread the birds 120 cents either side at the whole of Stray, by the square of the knob', () => {
    expect(flockStrayCents(0)).toBe(0)
    expect(flockStrayCents(0.3)).toBeCloseTo(10.8, 6)
    expect(flockStrayCents(0.5)).toBeCloseTo(30, 6)
    expect(flockStrayCents(1)).toBe(120)
  })

  it('scatter a leaving bird slowly at first, and fade it as the square of what is left', () => {
    // gone^1.5 of its way: an eighth at a quarter.
    expect(flockScatterCents(700, 0.25)).toBeCloseTo(87.5, 6)
    expect(flockScatterCents(-400, 0.64)).toBeCloseTo(-204.8, 6)
    expect(flockScatterCents(150, 1)).toBe(150)
    expect(flockStaying(0)).toBe(1)
    expect(flockStaying(0.5)).toBe(0.25)
    expect(flockStaying(1)).toBe(0)
  })

  it('place the birds from the middle outwards, left and right in turn, as `Flock::place_of` does', () => {
    expect(flockPlace(0, 1)).toBe(0)
    expect(flockPlace(0, 2)).toBeCloseTo(-Math.SQRT1_2, 6)
    expect(flockPlace(1, 2)).toBeCloseTo(Math.SQRT1_2, 6)
    // Five: the middle, then two fifths and four fifths of a quarter turn either side.
    const five = [0, 1, 2, 3, 4].map((k) => flockPlace(k, 5))
    expect(five[0]).toBe(0)
    expect(five[1]).toBeCloseTo(-0.58779, 5)
    expect(five[2]).toBeCloseTo(0.58779, 5)
    expect(five[3]).toBeCloseTo(-0.95106, 5)
    expect(five[4]).toBeCloseTo(0.95106, 5)
    // Four: a quarter and three quarters either side, none in the middle.
    expect(flockPlace(0, 4)).toBeCloseTo(-0.38268, 5)
    expect(flockPlace(3, 4)).toBeCloseTo(0.92388, 5)
  })

  it('bring Tone’s harmonics in one after another: the third, then the fifth, then the seventh', () => {
    expect(flockHarmonic(1, 3)).toBeCloseTo(0.55, 6)
    expect(flockHarmonic(1, 5)).toBeCloseTo(0.33, 6)
    expect(flockHarmonic(1, 7)).toBeCloseTo(0.2, 6)
    expect(flockHarmonic(0.2, 3)).toBeCloseTo(0.11, 6)
    expect(flockHarmonic(0.2, 5)).toBe(0)
    expect(flockHarmonic(0.45, 7)).toBe(0)
    // At a half the fifth is 0.375 of the way in, squared: 0.33 × 0.140625.
    expect(flockHarmonic(0.5, 5)).toBeCloseTo(0.046406, 6)
  })

  it('shape a call as Chirp does: silent between calls at the top of the knob', () => {
    // A call is the first six tenths of its turn, a raised cosine 1.6 strong.
    expect(flockCall(0, 0.3)).toBe(1)
    expect(flockCall(1, 0.3)).toBeCloseTo(1.6, 6)
    expect(flockCall(1, 0)).toBeCloseTo(0, 6)
    expect(flockCall(1, 0.8)).toBe(0)
    expect(flockCall(0.5, 0.15)).toBeCloseTo(0.9, 6)
    // Flutter paces the calls by the root of twice the knob, between a half and two and a half.
    expect(flockCallSpeed(0.5)).toBe(1)
    expect(flockCallSpeed(2)).toBe(2)
    expect(flockCallSpeed(0.05)).toBe(0.5)
    expect(flockCallSpeed(6)).toBe(2.5)
  })
})

describe('the flock’s display', () => {
  const { display } = VOICE_INSTRUMENT_FACES.flock
  const params = paramsOf('flock')
  const key = 261.63
  const draw = (values: Record<string, number>, notes: DisplayNote[] = []) =>
    drawDisplay(display, params, { values, notes })
  /** The sky at the size the tests draw, 128 by 100: its sides, and the note along its middle. */
  const left = 5
  const right = 123
  const middle = 50.5
  /** Where a pitch so many cents off the note stands: three octaves either way, the cents near the note drawn large. */
  const yOf = (cents: number): number =>
    middle - Math.sign(cents) * Math.pow(Math.abs(cents) / 3600, 0.45) * 34.5
  /** Where the gathering ends and where the leaving begins: the two handles stand there. */
  const zones = (values: Record<string, number>) => {
    const [gather, leave] = display.handles?.(viewOf(display, params, { values })) ?? []
    return { gathered: gather.x, gate: leave.x }
  }
  /** The moments of the keys that sound: an upright line in the accent each. */
  const moments = (drawn: RecordingContext): number[] =>
    lights(drawnPaths(drawn))
      .filter((path) => path.points.length === 2 && path.points[0][0] === path.points[1][0])
      .map((path) => path.points[0][0])
  const birds = (drawn: RecordingContext) => spots(drawn, accent)
  const plain = { octaves: 0, stray: 0, from: 0 }

  it('lights nothing at rest, and a line with a mark for each bird when a key sounds', () => {
    expect(lights(drawnPaths(draw({})))).toHaveLength(0)
    expect(birds(draw({}))).toHaveLength(0)
    const idle = runDisplay(display, params, 0.1, { signal: testSignal() })
    expect(lights(drawnPaths(idle))).toHaveLength(0)
    for (const count of [1, 5, 8]) {
      const drawn = draw({ ...plain, birds: count }, [note(key, 0.4)])
      expect(moments(drawn)).toHaveLength(1)
      expect(birds(drawn)).toHaveLength(count)
      // Every mark stands at the key's moment.
      for (const bird of birds(drawn)) expect(bird.x).toBeCloseTo(moments(drawn)[0], 0)
    }
  })

  it('moves a key across the gathering in the Gather time, then across four seconds of hovering', () => {
    const values = { ...plain, gather: 2 }
    const { gathered, gate } = zones(values)
    const at = (age: number, released: number | null = null) =>
      moments(draw(values, [note(key, age, released)]))[0]
    expect(at(1)).toBeCloseTo((left + gathered) / 2, 0)
    expect(at(2)).toBeCloseTo(gathered, 0)
    expect(at(4)).toBeCloseTo((gathered + gate) / 2, 0)
    // A key held longer waits just before the leaving.
    expect(at(60)).toBeCloseTo(gate - 6, 0)
    // Let go, it crosses the leaving in the Leave time (2.5 s) and is gone at its end.
    expect(at(60, 1.25)).toBeCloseTo((gate + right) / 2, 0)
    expect(lights(drawnPaths(draw(values, [note(key, 60, 2.4)])))).toHaveLength(1)
    expect(lights(drawnPaths(draw(values, [note(key, 60, 2.5)])))).toHaveLength(0)
    expect(birds(draw(values, [note(key, 60, 2.5)]))).toHaveLength(0)
  })

  it('sets the birds out between a third of an octave and an octave away, on the side From says', () => {
    const ys = (values: Record<string, number>, age: number) =>
      birds(draw({ ...plain, birds: 4, gather: 2, ...values }, [note(key, age)])).map(
        (bird) => bird.y,
      )
    // Below: at the start between 400 and 1200 cents under the note.
    for (const y of ys({}, 0.001)) {
      expect(y).toBeGreaterThan(yOf(-400) - 0.01)
      expect(y).toBeLessThan(yOf(-1200) + 0.01)
    }
    // Above the same, the other way up.
    for (const y of ys({ from: 1 }, 0.001)) {
      expect(y).toBeLessThan(yOf(400) + 0.01)
      expect(y).toBeGreaterThan(yOf(1200) - 0.01)
    }
    // Around: some from each side.
    const around = ys({ from: 2 }, 0.001)
    expect(Math.min(...around)).toBeLessThan(middle)
    expect(Math.max(...around)).toBeGreaterThan(middle)
    // They close on the note: half way the slowest, furthest bird is 111.73 cents under it, and at the end all are on it.
    const half = ys({}, 1)
    expect(Math.max(...half)).toBeLessThan(yOf(-111.73) + 0.01)
    expect(Math.max(...half) - Math.min(...half)).toBeLessThan(Math.max(...ys({}, 0.001)) - middle)
    for (const y of ys({}, 2)) expect(y).toBeCloseTo(middle, 5)
  })

  it('hovers the birds as far apart as Stray lets them, the octave birds on their seats', () => {
    const ys = (values: Record<string, number>) =>
      birds(draw({ ...plain, birds: 8, ...values }, [note(key, 3)])).map((bird) => bird.y)
    const span = (values: Record<string, number>) =>
      Math.max(...ys(values)) - Math.min(...ys(values))
    expect(span({ stray: 0 })).toBeCloseTo(0, 5)
    // The whole of Stray is 120 cents either side of the note.
    expect(Math.min(...ys({ stray: 1 }))).toBeGreaterThan(yOf(120) - 0.01)
    expect(Math.max(...ys({ stray: 1 }))).toBeLessThan(yOf(-120) + 0.01)
    expect(span({ stray: 1 })).toBeGreaterThan(span({ stray: 0.3 }) + 4)
    // The marks are the span the birds roam in, not the birds: they stand still as time goes by.
    const later = birds(draw({ ...plain, birds: 8, stray: 1 }, [note(key, 3.7)])).map(
      (bird) => bird.y,
    )
    expect(later).toEqual(ys({ stray: 1 }))
    // Octaves at its top seats five of eight an octave off: three above, two below.
    const seated = ys({ octaves: 1 }).map((y) => Math.round(y * 100) / 100)
    const count = (y: number) => seated.filter((at) => Math.abs(at - y) < 0.01).length
    expect([count(yOf(1200)), count(middle), count(yOf(-1200))]).toEqual([3, 3, 2])
  })
})

describe('the flock’s keys', () => {
  const { display } = VOICE_INSTRUMENT_FACES.flock
  const params = paramsOf('flock')
  const key = 261.63
  const plain = { octaves: 0, stray: 0, from: 0 }
  const draw = (values: Record<string, number>, notes: DisplayNote[] = []) =>
    drawDisplay(display, params, { values, notes })
  const uprights = (drawn: RecordingContext): DrawnPath[] =>
    lights(drawnPaths(drawn)).filter(
      (path) => path.points.length === 2 && path.points[0][0] === path.points[1][0],
    )

  it('keeps the flock a key called when Birds moves after it, as `Flock::start` reads it once', () => {
    const drawn = runDisplay(display, params, 0.3, {}, (time) => ({
      values: { ...plain, birds: time < 0.1 ? 3 : 8 },
      notes: [note(key, 0.2 + time)],
    }))
    expect(spots(drawn, accent)).toHaveLength(3)
  })

  it('takes Leave as it stood when the key went up, as `Flock::release` reads it once', () => {
    const drawn = runDisplay(display, params, 0.3, {}, (time) => ({
      // Let go a tenth of a second in with Leave at 2 s; the knob then drops under the time since.
      values: { ...plain, leave: time < 0.2 ? 2 : 0.1 },
      notes: [note(key, 5 + time, time < 0.1 ? null : time - 0.1)],
    }))
    expect(uprights(drawn)).toHaveLength(1)
    // A key let go with Leave that short is gone by then.
    const short = runDisplay(display, params, 0.3, {}, (time) => ({
      values: { ...plain, leave: 0.1 },
      notes: [note(key, 5 + time, time < 0.1 ? null : time - 0.1)],
    }))
    expect(uprights(short)).toHaveLength(0)
  })

  it('draws no more keys than the device sounds, twelve', () => {
    const many = Array.from({ length: 14 }, (_, i) => ({
      ...note(110 * Math.pow(2, i / 12), 3 - i * 0.1),
      id: 40 + i,
    }))
    expect(uprights(draw(plain, many))).toHaveLength(12)
  })

  it('lights the softest key, and a louder one more', () => {
    const soft = uprights(draw(plain, [{ ...note(key, 3), gain: 0 }]))
    const loud = uprights(draw(plain, [note(key, 3)]))
    expect(soft).toHaveLength(1)
    expect(soft[0].alpha).toBeGreaterThan(0.2)
    expect(loud[0].alpha).toBeGreaterThan(soft[0].alpha)
  })

  it('draws the birds whose side only the device knows fainter, on both sides', () => {
    // Five from Around: three even and two odd, one half from below and the other from above.
    const sure = spots(draw({ ...plain, birds: 5, gather: 2 }, [note(key, 0.5)]), accent)
    const either = spots(draw({ ...plain, birds: 5, gather: 2, from: 2 }, [note(key, 0.5)]), accent)
    expect(sure).toHaveLength(5)
    expect(either).toHaveLength(6)
    expect(either[0].alpha).toBeCloseTo((sure[0].alpha * 2.5) / 3, 5)
    // Once they have landed there is nothing left to doubt.
    const landed = spots(draw({ ...plain, birds: 5, gather: 2, from: 2 }, [note(key, 3)]), accent)
    expect(landed).toHaveLength(5)
    expect(landed[0].alpha).toBeCloseTo(1, 5)
  })

  it('says how long the gathering and the leaving take and how far the birds roam', () => {
    expect(draw({}).words()).toEqual(['1.2 s', '±11 ct', '2.5 s'])
    expect(draw({ stray: 0, gather: 0.4, leave: 8 }).words()).toEqual(['400 ms', 'unison', '8.0 s'])
    // A swoop of 35 ms is said as it is, not rounded to 40.
    expect(draw({ gather: 0.035, leave: 0.12 }).words()).toEqual(['35 ms', '±11 ct', '120 ms'])
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { gather: 0.05, leave: 9 },
      { gather: 6, leave: 0.2 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [gather, leave] = display.handles?.(view) ?? []
      const set = (name: string, value: number) => value / view.value(name)
      expect(set('gather', gather.drag(gather.x, gather.y).gather)).toBeCloseTo(1, 3)
      expect(set('leave', leave.drag(leave.x, leave.y).leave)).toBeCloseTo(1, 3)
      // The gathering grows to the right, the leaving to the left.
      expect(gather.drag(gather.x + 5, gather.y).gather).toBeGreaterThan(view.value('gather'))
      expect(leave.drag(leave.x - 5, leave.y).leave).toBeGreaterThan(view.value('leave'))
      expect(gather.x).toBeLessThan(leave.x)
    }
  })
})
