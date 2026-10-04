// The reverbs' displays against numbers worked out from each device's DSP by
// hand (and, where it says so, measured on the device itself, a noise burst
// through its .wasm and the fall of what is left in a band): how long each
// tail takes to fall 60 dB, when the first sounds arrive, the shapes a shaped
// reverb draws, that what is drawn lands where those numbers say, and that
// the second colour shows only what happens now.

import { describe, expect, it } from 'vitest'
import { REVERB_DECAY_SECONDS } from '../../core/devices/native/ConvolverReverb'
import { type ParamSpec } from '../../core/params'
import { etherReverbLaw } from '../../dsp/devices/ether-reverb'
import { fdnReverbBreathLaw } from '../../dsp/devices/fdn-reverb'
import {
  BODY_HZ,
  ETHER_TOGETHER,
  HALL_LONGER,
  PLATE_SPREAD,
  REVERB_FACES,
  TOP_HZ,
  convolverDb,
  convolverSeconds,
  etherLaw,
  etherRt60,
  fallPoint,
  fallThrough,
  fallTogether,
  fdnBreath,
  fdnRt60,
  hallRt60,
  hallTripDb,
  loopRt60,
  onePoleLossDb,
  plateRt60,
  secondsText,
  shapedGain,
  shapedSmear,
  shapedTailLevel,
  shapedTailRt60,
  shapedTapSeconds,
  shapedTaps,
  shapedWetDb,
  springCascade,
  springDripDb,
  springRate,
  springRt60,
} from '../components/displays/reverb'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  type DisplayHandle,
  type DisplaySignal,
  type PlateDisplay,
} from '../components/plate-display'
import {
  drawDisplay,
  frameOf,
  runDisplay,
  stockDescriptors,
  testLevel,
  viewOf,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const descriptors = stockDescriptors()

function plate(id: string): { display: PlateDisplay; params: Record<string, ParamSpec> } {
  const face = REVERB_FACES[id]
  const descriptor = descriptors.get(id)
  if (!face || !descriptor) throw new Error(`no display or no device for ${id}`)
  return { display: face.display, params: descriptor.params }
}

function handlesOf(id: string, values: Record<string, number> = {}): Map<string, DisplayHandle> {
  const { display, params } = plate(id)
  const handles = display.handles?.(viewOf(display, params, { values })) ?? []
  return new Map(handles.map((handle) => [handle.key, handle]))
}

function take(handles: Map<string, DisplayHandle>, key: string): DisplayHandle {
  const handle = handles.get(key)
  if (!handle) throw new Error(`no handle "${key}"`)
  return handle
}

// The five rooms are windows of 128 by 100 in two parts. Above, the first
// moments: 115 across from x 9 (left of it stands the level that comes out),
// levels from y 5 (the sound going in) to y 32 (60 dB under it). Below, the
// tail: 120 across from x 4, from y 49 down to its foot at y 86.
const FIRST = { x: 9, y: 5, w: 115, h: 27 }
const TAIL = { x: 4, y: 49, w: 120, h: 37 }
// The two strips are 184 by 48 with one box: 171 across from x 9, y 5 to y 36.
const STRIP = { x: 9, y: 5, w: 171, h: 31 }
const TOP_Y = STRIP.y
const FOOT_Y = STRIP.y + STRIP.h
const yIn = (box: { y: number; h: number }, db: number): number => box.y + (-db / 60) * box.h
const yOfDb = (db: number): number => yIn(STRIP, db)
const dbOfY = (y: number): number => (-(y - TOP_Y) / (FOOT_Y - TOP_Y)) * 60
const ROOMS = ['plate-reverb', 'fdn-reverb', 'hall-reverb', 'spring-reverb', 'ether-reverb']
const STRIPS = ['convolver-reverb', 'shaped-reverb']
/** The seconds each room's tail part spans, and its first moments. */
const SPAN: Record<string, number> = {
  'plate-reverb': 8,
  'fdn-reverb': 10,
  'hall-reverb': 6,
  'spring-reverb': 6,
  'ether-reverb': 6,
}

/** Every point a drawing's lines go through. */
function pointsOf(drawn: RecordingContext): [number, number][] {
  return drawn.calls
    .filter((call) => call.name === 'lineTo' || call.name === 'moveTo')
    .map((call) => [call.args[0] as number, call.args[1] as number])
}

const near = (points: [number, number][], x: number, y: number, by = 0.01): boolean =>
  points.some(([px, py]) => Math.abs(px - x) < by && Math.abs(py - y) < by)

describe('what the reverbs share', () => {
  it('works out a 60 dB time from a loop and what a trip round it loses', () => {
    // A second round, 6 dB each time: ten trips.
    expect(loopRt60(1, -6)).toBeCloseTo(10, 9)
    expect(loopRt60(0.5, -60)).toBeCloseTo(0.5, 9)
    // A loop that loses nothing never falls.
    expect(loopRt60(1, 0)).toBe(Infinity)
  })

  it('knows what a one-pole low-pass does to a frequency', () => {
    // y = (1 − a)·x + a·y1 at half the sample rate: (1 − a) / (1 + a) = 1/3, so 1/9 of the power.
    expect(onePoleLossDb(0.5, RATE / 2, RATE)).toBeCloseTo(10 * Math.log10(1 / 9), 6)
    // It passes DC whole, and with a = 0 it passes everything.
    expect(onePoleLossDb(0.9, 0, RATE)).toBeCloseTo(0, 9)
    expect(onePoleLossDb(0, 9000, RATE)).toBeCloseTo(0, 9)
  })

  it('knows how long parts that fall at their own rates take together', () => {
    // Parts that fall alike fall together as each does.
    expect(fallTogether([2, 2, 2])).toBeCloseTo(1, 6)
    // One part of 1 s and one of 2 s, as loud: at the end only the slow one is left, half
    // of the whole, so 10^(−3t) = 2·10^−6 at t = (6 − log10 2) / 3 = 1.8997 s, against a mean of 1.5.
    expect(fallTogether([1, 2])).toBeCloseTo(1.8997 / 1.5, 3)
    // With the slow part a hundred times the louder it is all but alone: 2 s, less
    // log10(100/101) / 3 = 0.0014.
    expect(fallTogether([1, 2], [1, 100])).toBeCloseTo((2 - 0.0014) / 1.5, 3)
  })

  it('says seconds as a scale says them, and no more of them than are true', () => {
    expect(secondsText(0.25)).toBe('0.25s')
    expect(secondsText(0.2)).toBe('0.2s')
    expect(secondsText(1)).toBe('1s')
    expect(secondsText(3.46)).toBe('3.5s')
    expect(secondsText(24.4)).toBe('24s')
    expect(secondsText(Infinity)).toBe('∞')
    // A figure is rounded before it is worded: no "1.0s", no "10.0s", no "0.0s".
    expect(secondsText(0.998)).toBe('1s')
    expect(secondsText(9.97)).toBe('10s')
    expect(secondsText(0)).toBe('0s')
    // Past 99 s a loop falls as slowly as the least thing left out of the sum lets it.
    expect(secondsText(1608)).toBe('>99s')
  })

  it('reads the tail in the body of a sound and at the top of its spectrum', () => {
    expect(BODY_HZ).toBe(500)
    expect(TOP_HZ).toBe(8000)
  })

  it('finds the point of a fall and the fall through a point', () => {
    // 2 s to fall 60 dB from the top, begun 0.5 s in, on a box that spans 8 s: 30 dB down
    // after 1 s, at 1.5 s; at the foot at 2.5 s.
    expect(fallPoint(TAIL, 8, 0.5, 2, -30)).toEqual([TAIL.x + (1.5 / 8) * TAIL.w, yIn(TAIL, -30)])
    expect(fallPoint(TAIL, 8, 0.5, 2, -60)).toEqual([TAIL.x + (2.5 / 8) * TAIL.w, yIn(TAIL, -60)])
    // A fall of 16 s leaves the box at its right edge: 7.5 s of it, 28.1 dB down.
    const [x, y] = fallPoint(TAIL, 8, 0.5, 16, -60)
    expect(x).toBe(TAIL.x + TAIL.w)
    expect(y).toBeCloseTo(yIn(TAIL, -28.125), 6)
    // And back: the fall through each of those points is the fall it was.
    expect(fallThrough(TAIL, 8, 0.5, TAIL.x + (1.5 / 8) * TAIL.w, yIn(TAIL, -30))).toBeCloseTo(2, 9)
    expect(fallThrough(TAIL, 8, 0.5, x, y)).toBeCloseTo(16, 9)
    // A room that is held has no end: its handle waits in the corner.
    expect(fallPoint(TAIL, 8, 0.5, Infinity, -60)).toEqual([TAIL.x + TAIL.w, TAIL.y])
  })

  it('gives the rooms a window and the two others a strip, the level of the sound and no meter', () => {
    expect(Object.keys(REVERB_FACES).sort()).toEqual([...ROOMS, ...STRIPS].sort())
    for (const id of ROOMS) {
      const { display } = plate(id)
      expect(display.place, id).toBe('window')
      expect(display.columns, id).toBe(2)
      // Two rows of two knobs beside it.
      expect(REVERB_FACES[id]?.face?.length, id).toBe(4)
    }
    for (const id of STRIPS) expect(plate(id).display.place, id).toBe('strip')
    for (const id of [...ROOMS, ...STRIPS]) {
      const { display } = plate(id)
      expect(display.live?.signal, id).toBe(true)
      expect(display.live?.meters ?? [], id).toEqual([])
    }
  })

  it('draws every tail on a scale that does not move with its settings', () => {
    for (const id of ROOMS) {
      const { display, params } = plate(id)
      const decay = id === 'hall-reverb' ? 'midDecay' : 'decay'
      // Every word but the last, which is the figure: the two scales' own.
      const words = (value: number): string[] =>
        drawDisplay(display, params, { values: { [decay]: value } })
          .words()
          .slice(0, -1)
      const short = words(params[decay].min)
      expect(short.length, id).toBeGreaterThanOrEqual(2)
      // The scale's own words are the same at the shortest decay and the longest...
      expect(words(params[decay].max), id).toEqual(short)
      expect(words(params[decay].default), id).toEqual(short)
      // ...and the tail's end is further right the longer it is, until it leaves the box.
      const end = (value: number): DisplayHandle => take(handlesOf(id, { [decay]: value }), 'decay')
      const low = end(params[decay].min)
      const middle = end(params[decay].default)
      expect(low.y, id).toBeCloseTo(TAIL.y + TAIL.h, 6)
      expect(middle.x, id).toBeGreaterThan(low.x + 3)
      expect(end(params[decay].max).x, id).toBeGreaterThan(middle.x + 10)
    }
  })
})

/** Every setting of the allpasses' phases: `count` steps round each of four. */
function plateTrips(count: number): number[] {
  // The tank of the plate: four plain delays and four allpasses, [samples, gain].
  const plain = 4453 + 3720 + 4217 + 3163
  const allpasses = [
    [672, 0.7],
    [908, 0.7],
    [1800, 0.5],
    [2656, 0.5],
  ]
  // What an allpass of M samples and gain g holds a frequency back: M·(1 − g²) / (1 + g² − 2g·cos θ).
  const held = (samples: number, gain: number, phase: number): number =>
    (samples * (1 - gain * gain)) / (1 + gain * gain - 2 * gain * Math.cos(phase))
  const trips: number[] = []
  const at = (k: number): number => (2 * Math.PI * (k + 0.5)) / count
  for (let a = 0; a < count; a++)
    for (let b = 0; b < count; b++)
      for (let c = 0; c < count; c++)
        for (let d = 0; d < count; d++) {
          const phases = [a, b, c, d].map(at)
          trips.push(plain + allpasses.reduce((sum, [m, g], i) => sum + held(m, g, phases[i]), 0))
        }
  return trips
}

describe('plate reverb', () => {
  it('rings longer than its length says, by what its allpasses spread', () => {
    // Each frequency goes round in its own time, and one that takes longer lasts longer
    // and has as much more to give. Heard together they take 1.147 times the mean trip
    // (1.143 with the phases in sixteen steps, as here).
    const trips = plateTrips(16)
    const mean = trips.reduce((sum, trip) => sum + trip, 0) / trips.length
    // An allpass holds the frequencies back by its own length on the whole.
    expect(mean / 21589).toBeCloseTo(1, 2)
    // The quickest trip has every allpass at M·(1 − g)/(1 + g): 118.6 + 160.2 + 600 + 885.3
    // and the 15553 of plain delay, 0.80 of the loop; the slowest at M·(1 + g)/(1 − g), 1.75 of it.
    expect(Math.min(...trips) / 21589).toBeGreaterThan(0.8)
    expect(Math.min(...trips) / 21589).toBeLessThan(0.83)
    expect(Math.max(...trips) / 21589).toBeLessThan(1.76)
    expect(Math.max(...trips) / 21589).toBeGreaterThan(1.5)
    expect(fallTogether(trips, trips) - 1).toBeCloseTo(PLATE_SPREAD, 2)
  })

  it('falls 60 dB in the time its tank gives', () => {
    // Once round both halves: 672 + 4453 + 1800 + 3720 + 908 + 4217 + 2656 + 3163
    // = 21589 samples at 29761 Hz = 0.72541 s, through Decay four times.
    // Decay 0.5, no damping: 80·log10(0.5) = −24.082 dB a trip, so 60 · 0.72541 / 24.082 = 1.8073 s
    // by the length alone. At 500 Hz all but a seventh of the spread is there:
    // 1 + 0.147 / (1 + (500 / 1240)²) = 1.1264, so 2.036 s. Measured on the device: 2.03 to 2.07 s.
    expect(plateRt60(0.5, 0, BODY_HZ, RATE)).toBeCloseTo(2.036, 2)
    // Decay 0.7 is −12.392 dB; damping 0.3 takes 0.0114 dB at 500 Hz, twice a trip:
    // 60 · 0.72541 / 12.415 = 3.506 s, times 1.1264 = 3.95 s. Measured: 3.87 to 3.92 s.
    expect(plateRt60(0.7, 0.3, BODY_HZ, RATE)).toBeCloseTo(3.95, 2)
    // Decay 0.9 is −3.661 dB a trip and 0.023 of damping: 11.82 s, times 1.1264 = 13.3 s. Measured: 12.6 to 12.7 s.
    expect(plateRt60(0.9, 0.3, BODY_HZ, RATE)).toBeCloseTo(13.3, 0)
  })

  it('loses its highs faster the more it is damped, and the spread with them', () => {
    // Far above the sway of the diffusers (1240 Hz) the spread evens out: at 8 kHz 1.003.
    // Undamped, Decay 0.7 alone: 60 · 0.72541 / 12.392 = 3.512 s, times 1.0034 = 3.524 s.
    expect(plateRt60(0.7, 0, TOP_HZ, RATE)).toBeCloseTo(3.524, 2)
    // Damping 0.3 at 8 kHz: 0.49 / (1.09 − 0.6·cos(π/3)) = 0.6203 of the power, −2.074 dB,
    // twice a trip on top of −12.392: 60 · 0.72541 / 16.540 = 2.632 s, times 1.0034 = 2.64 s.
    // Measured on the device: 2.5 to 2.6 s.
    expect(plateRt60(0.7, 0.3, TOP_HZ, RATE)).toBeCloseTo(2.64, 2)
    expect(plateRt60(0.7, 0.8, TOP_HZ, RATE)).toBeLessThan(plateRt60(0.7, 0.3, TOP_HZ, RATE))
  })

  it('writes that time and draws a tail that long', () => {
    const { display, params } = plate('plate-reverb')
    const drawn = drawDisplay(display, params, { values: { decay: 0.7, damping: 0.3 } })
    expect(drawn.words()).toContain('3.9s')
    // The tail starts at the top when the plate first sounds (the pre-delay, and its first
    // tap 266 samples along a first delay at the tank's 29761 Hz) and is at the foot
    // 3.949 s later, on a box that spans 8 s.
    const onset = params.predelayMs.default / 1000 + 266 / 29761
    const body = plateRt60(0.7, 0.3, BODY_HZ, RATE)
    const end = take(handlesOf('plate-reverb'), 'decay')
    expect(end.y).toBeCloseTo(TAIL.y + TAIL.h, 6)
    expect(end.x).toBeCloseTo(TAIL.x + ((onset + body) / 8) * TAIL.w, 6)
    expect(end.x).toBeCloseTo(TAIL.x + ((0.0289 + 3.949) / 8) * TAIL.w, 1)
    const points = pointsOf(drawn)
    expect(near(points, TAIL.x + (onset / 8) * TAIL.w, TAIL.y)).toBe(true)
    expect(near(points, end.x, end.y)).toBe(true)
    // The highs' line is at the foot 2.64 s after the same start.
    const top = plateRt60(0.7, 0.3, TOP_HZ, RATE)
    expect(near(points, TAIL.x + ((onset + top) / 8) * TAIL.w, TAIL.y + TAIL.h)).toBe(true)
  })

  it('runs a tail that outlasts the scale out at the right edge, and says no figure past 99 s', () => {
    const { display, params } = plate('plate-reverb')
    // Decay 0.95: 80·log10(0.95) = −1.782 dB and 0.023 of damping, 24.1 s by the length, 27 s with the spread.
    const end = take(handlesOf('plate-reverb', { decay: 0.95 }), 'decay')
    expect(end.x).toBeCloseTo(TAIL.x + TAIL.w, 6)
    expect(end.y).toBeGreaterThan(TAIL.y + 5)
    expect(end.y).toBeLessThan(TAIL.y + TAIL.h / 2)
    expect(drawDisplay(display, params, { values: { decay: 0.95 } }).words()).toContain('27s')
    // The device holds Decay under 0.9999, where what is left to lose it is the damping alone.
    expect(drawDisplay(display, params, { values: { decay: 1 } }).words()).toContain('>99s')
    expect(drawDisplay(display, params, { values: { decay: 0 } }).words()).toContain('0s')
  })

  it('starts the reverb after the pre-delay at the level of the mix', () => {
    const start = take(handlesOf('plate-reverb', { predelayMs: 100, mix: 0.5 }), 'start')
    // 100 ms and the first tap (8.9 ms), on the 0.4 s the first moments span; mix 0.5 is −6.02 dB.
    expect(start.x).toBeCloseTo(FIRST.x + ((0.1 + 266 / 29761) / 0.4) * FIRST.w, 3)
    expect(start.y).toBeCloseTo(yIn(FIRST, -6.0206), 3)
    // Dragged to 200 ms and −12 dB.
    const set = start.drag(FIRST.x + ((0.2 + 266 / 29761) / 0.4) * FIRST.w, yIn(FIRST, -12))
    expect(set.predelayMs).toBeCloseTo(200, 3)
    expect(set.mix).toBeCloseTo(Math.pow(10, -12 / 20), 3)
    // Mixed out altogether the reverb stands on the foot, and from there it is set to nothing.
    const out = take(handlesOf('plate-reverb', { mix: 0 }), 'start')
    expect(out.y).toBeCloseTo(FIRST.y + FIRST.h, 6)
    expect(out.drag(out.x, out.y).mix).toBe(0)
    expect(start.drag(start.x, FIRST.y + FIRST.h).mix).toBe(0)
  })

  it('moves the end of its tail with Decay alone, and the highs with Damping alone', () => {
    const handles = handlesOf('plate-reverb')
    const end = take(handles, 'decay')
    expect(Object.keys(end.drag(end.x - 20, end.y))).toEqual(['decay'])
    expect(end.drag(end.x, end.y).decay).toBeCloseTo(0.7, 4)
    expect(end.drag(end.x - 20, end.y).decay).toBeLessThan(0.7)
    expect(end.drag(end.x + 10, end.y).decay).toBeGreaterThan(0.7)
    // The end put where a tail of 2.036 s ends is Decay 0.5 (with no damping, exactly).
    const plain = take(handlesOf('plate-reverb', { damping: 0 }), 'decay')
    const onset = 0.02 + 266 / 29761
    expect(plain.drag(TAIL.x + ((onset + 2.0358) / 8) * TAIL.w, TAIL.y + TAIL.h).decay).toBeCloseTo(
      0.5,
      3,
    )
    // Past the right edge the handle rides up it: higher is a longer tail.
    expect(end.drag(TAIL.x + TAIL.w, TAIL.y + 10).decay).toBeGreaterThan(0.9)
    // The highs' handle stands half way down their line.
    const highs = take(handles, 'damping')
    const top = plateRt60(0.7, 0.3, TOP_HZ, RATE)
    expect(highs.x).toBeCloseTo(TAIL.x + ((0.02 + 266 / 29761 + top / 2) / 8) * TAIL.w, 6)
    expect(highs.y).toBeCloseTo(yIn(TAIL, -30), 6)
    expect(Object.keys(highs.drag(highs.x - 5, highs.y))).toEqual(['damping'])
    // Further left the highs are gone sooner: more damping.
    expect(highs.drag(highs.x - 5, highs.y).damping).toBeGreaterThan(0.3)
    expect(highs.drag(highs.x + 3, highs.y).damping).toBeLessThan(0.3)
  })

  it('draws the plate dense from its first tap on', () => {
    const { display, params } = plate('plate-reverb')
    const drawn = drawDisplay(display, params)
    // Marks stand two pixels apart at the nearest: from the first tap (28.9 ms in, x 17.3)
    // to the end of the box nearly every column is taken.
    const feet = pointsOf(drawn).filter(
      ([x, y]) =>
        y === FIRST.y + FIRST.h && x > FIRST.x + 8 && x < FIRST.x + FIRST.w && x % 1 === 0.5,
    )
    expect(new Set(feet.map(([x]) => x)).size).toBeGreaterThan(45)
    // Nothing before the pre-delay is over.
    const early = pointsOf(drawn).filter(
      ([x, y]) => y === FIRST.y + FIRST.h && x % 1 === 0.5 && x > FIRST.x + 2 && x < FIRST.x + 5,
    )
    expect(early).toEqual([])
  })
})

describe('fdn reverb', () => {
  it('falls 60 dB in the Decay it is set to', () => {
    // The feedback gain is the one that makes Decay the RT60; at 500 Hz the damping at
    // its brightest and the DC blocker take 0.004 dB a trip of 4.33 dB between them.
    expect(fdnRt60(2, 0, 1, BODY_HZ, RATE)).toBeCloseTo(2, 1)
    expect(fdnRt60(2, 0, 1, BODY_HZ, RATE)).toBeGreaterThan(1.99)
    expect(fdnRt60(10, 0, 2, BODY_HZ, RATE)).toBeCloseTo(10, 0)
    // At its defaults (Decay 5, Damping 0.4) the damping takes a little more: 4.9 s.
    // Measured on the device: 4.8 to 4.9 s.
    expect(fdnRt60(5, 0.4, 1, BODY_HZ, RATE)).toBeCloseTo(4.9, 1)
  })

  it('loses its highs to Damping: a cutoff swept from 20 kHz to 1 kHz', () => {
    // Damping 1 is a one-pole at 1 kHz, a = exp(−2π/48) = 0.87733. At 8 kHz it passes
    // 0.12267² / (1 + 0.7697 − 1.75466·0.5) = 0.01686 of the power, −17.73 dB a trip. The
    // mean line is 6372 samples at 44.1 kHz (6935 whole ones at 48 kHz), 0.14448 s, and
    // Decay 5 takes 1.734 dB there: 60 · 0.14448 / 19.47 = 0.445 s.
    expect(fdnRt60(5, 1, 1, TOP_HZ, RATE)).toBeCloseTo(0.445, 2)
    expect(fdnRt60(5, 0.4, 1, TOP_HZ, RATE)).toBeLessThan(fdnRt60(5, 0.4, 1, BODY_HZ, RATE))
  })

  it('breathes by the device’s own law', () => {
    for (const phase of [0, 0.1, 0.25, 0.5, 0.75, 0.9]) {
      for (const depth of [0, 0.3, 1]) {
        expect(fdnBreath(phase, depth)).toBeCloseTo(fdnReverbBreathLaw(phase, depth), 12)
      }
    }
  })

  it('answers after its shortest line, further off as Size grows', () => {
    // 4799 samples at 44.1 kHz are 5223 whole ones at 48 kHz: 108.8 ms at Size 1.
    const line = 5223 / RATE
    const small = take(handlesOf('fdn-reverb', { predelayMs: 0, size: 1 }), 'start')
    expect(small.x).toBeCloseTo(FIRST.x + (line / 0.6) * FIRST.w, 3)
    const big = take(handlesOf('fdn-reverb', { predelayMs: 0, size: 2 }), 'start')
    expect(big.x).toBeCloseTo(FIRST.x + ((2 * line) / 0.6) * FIRST.w, 3)
  })

  it('shows how far the breath lets the start sink, and claims no place in its cycle', () => {
    const { display, params } = plate('fdn-reverb')
    const dashed = (drawn: RecordingContext): number =>
      drawn.calls.filter(
        (call) => call.name === 'setLineDash' && (call.args[0] as number[]).join() === '2,2',
      ).length
    // No breath: no dashed line.
    expect(dashed(drawDisplay(display, params, { values: { breathDepth: 0 } }))).toBe(0)
    // Depth 0.5 lets in half at the bottom of a cycle: a dashed line 6.02 dB under the start.
    const half = drawDisplay(display, params, { values: { breathDepth: 0.5, mix: 1 } })
    expect(dashed(half)).toBe(1)
    const onset = FIRST.x + (5223 / RATE / 0.6) * FIRST.w
    expect(near(pointsOf(half), onset, yIn(FIRST, -6.0206), 0.01)).toBe(true)
    // The device does not say where in its cycle the breath is, and the rate is not
    // drawn: the picture is the same at any rate and at any moment.
    const at = (breathRate: number, now: number): string =>
      drawDisplay(display, params, { values: { breathDepth: 0.5, breathRate }, now }).print()
    expect(at(2, 11.3)).toBe(at(0.05, 10))
    expect(display.params).not.toContain('breathRate')
  })
})

describe('hall reverb', () => {
  it('falls 60 dB in Mid decay and the 6 % its allpasses add, and in half of that at the Damping frequency', () => {
    expect(HALL_LONGER).toBe(1.06)
    // With Low decay the same the shelf is flat. At the Damping frequency the low-pass has
    // the loop's own gain once more, so a trip loses twice as much.
    expect(hallRt60(6000, 200, 2, 2, 6000, RATE)).toBeCloseTo(1.06, 3)
    // Far under the Damping frequency the low-pass passes nearly everything.
    expect(hallRt60(100, 200, 2, 2, 6000, RATE)).toBeCloseTo(2.12, 2)
  })

  it('falls in Low decay well under Crossover', () => {
    expect(hallRt60(10, 400, 6, 2, 6000, RATE)).toBeCloseTo(6.36, 1)
    // At Crossover itself the shelf is half way (in power) between the two.
    const mid = hallTripDb(0.2, 400, 400, 2, 2, 23000, RATE)
    const both = hallTripDb(0.2, 400, 400, 6, 2, 23000, RATE)
    // Mid gain 10^(−0.3) and low gain 10^(−0.1): the shelf is (10^0.4 + 1) / 2 = 1.756 of the power.
    expect(both - mid).toBeCloseTo(10 * Math.log10((Math.pow(10, 0.4) + 1) / 2), 2)
  })

  it('writes what the device was measured at', () => {
    const { display, params } = plate('hall-reverb')
    // Its three lines are read at Crossover / 4, between Crossover and Damping
    // (sqrt(200 · 6000) = 1095 Hz) and at 8 kHz. Mid decay 2, Low decay 3, measured on the
    // device: 2.07 s at 1100 Hz (drawn: 2.0), 2.79 s at 125 Hz, and at Mid decay 4 and 8,
    // 4.15 and 8.24 s.
    expect(hallRt60(1095, 200, 3, 2, 6000, RATE)).toBeCloseTo(2.01, 2)
    expect(hallRt60(1095, 200, 4, 4, 6000, RATE)).toBeCloseTo(4.04, 1)
    expect(hallRt60(1095, 200, 8, 8, 6000, RATE)).toBeCloseTo(8.14, 1)
    expect(hallRt60(50, 200, 3, 2, 6000, RATE)).toBeCloseTo(3.1, 1)
    expect(drawDisplay(display, params).words()).toContain('2s')
    expect(drawDisplay(display, params, { values: { midDecay: 4 } }).words()).toContain('4s')
  })

  it('starts its reverb after the pre-delay and its shortest allpass, 7 dB under the mix', () => {
    // Mix 0.5 levelled: 0.5 / sqrt(0.25 + 0.2·0.25) = 0.9129, −0.79 dB, and the reverb's own −6.99.
    const start = take(handlesOf('hall-reverb', { preDelay: 60, mix: 0.5 }), 'start')
    expect(start.x).toBeCloseTo(FIRST.x + ((0.06 + 0.013458) / 0.4) * FIRST.w, 3)
    expect(start.y).toBeCloseTo(yIn(FIRST, -0.792 - 6.99), 2)
  })

  it('draws a line for the lows, and it is the longer one when Low decay is', () => {
    const { display, params } = plate('hall-reverb')
    const same = drawDisplay(display, params, { values: { lowDecay: 2, midDecay: 2 } })
    const longer = drawDisplay(display, params, { values: { lowDecay: 8, midDecay: 2 } })
    expect(longer.print()).not.toBe(same.print())
    // The lows hold the mids up a little too: at 1095 Hz the shelf at 200 Hz is not all gone.
    expect(same.words().at(-1)).toBe('2s')
    expect(longer.words().at(-1)).toBe('2.1s')
    // Low decay 8 at 50 Hz, a quarter of Crossover: 1.06 · 7.4 s, out at the right edge of 6 s.
    const lows = hallRt60(50, 200, 8, 2, 6000, RATE)
    expect(lows).toBeGreaterThan(7)
    const onset = 0.06 + 0.013458
    expect(
      near(pointsOf(longer), TAIL.x + TAIL.w, yIn(TAIL, (-60 * (6 - onset)) / lows), 0.01),
    ).toBe(true)
  })
})

describe('ether reverb', () => {
  it('keeps the device’s own law of decay, size and damping', () => {
    for (const [decay, size, damping] of [
      [0.5, 0, 0],
      [5, 0.6, 0.5],
      [30, 1, 1],
      [12, 0.3, 0.1],
    ]) {
      const law = etherReverbLaw(decay, size, damping, false)
      const ours = etherLaw(decay, size, damping, false)
      expect(ours.feedback).toBeCloseTo(law.feedback, 12)
      // The comb's own coefficient is 0.4 of the damping the law hands it.
      expect(ours.damp).toBeCloseTo(law.damping * 0.4, 12)
    }
    expect(etherLaw(5, 0.6, 0.5, true)).toEqual({ feedback: 1, damp: 0 })
  })

  it('falls 60 dB in the time its combs give, heard together', () => {
    // The eight combs feed back alike, so each falls in a time that goes with its length:
    // 1116 to 1617 samples. Together, as loud as each other, they take 1.067 of the mean's.
    expect(ETHER_TOGETHER).toBeCloseTo(1.067, 3)
    // Decay 5, size 0.6: room 0.6 + 0.3·4.5/29.5 = 0.64576, feedback 0.88081, −1.1023 dB
    // a trip of the mean comb, 1378 samples at 44.1 kHz = 31.247 ms: 60 · 0.031247 / 1.1023
    // = 1.701 s, times 1.067 = 1.815 s. Measured on the device: 1.75 to 1.86 s.
    expect(etherRt60(5, 0.6, 0, false, BODY_HZ, RATE)).toBeCloseTo(1.815, 2)
    expect(etherRt60(5, 0.6, 0.5, false, TOP_HZ, RATE)).toBeLessThan(
      etherRt60(5, 0.6, 0.5, false, BODY_HZ, RATE),
    )
    const { display, params } = plate('ether-reverb')
    expect(drawDisplay(display, params).words()).toContain('1.8s')
  })

  it('answers with every comb through every way of its allpasses', () => {
    const { display, params } = plate('ether-reverb')
    const drawn = drawDisplay(display, params, { values: { predelayMs: 0 } })
    // The first comb (1116 samples at 44.1 kHz, 25.3 ms) is the first sound.
    const start = take(handlesOf('ether-reverb', { predelayMs: 0 }), 'start')
    expect(start.x).toBeCloseTo(FIRST.x + (1116 / 44100 / 0.3) * FIRST.w, 6)
    // Eight combs, sixteen ways each, on every trip: from there on every column is taken.
    const feet = pointsOf(drawn).filter(
      ([x, y]) => y === FIRST.y + FIRST.h && x > start.x && x < FIRST.x + FIRST.w && x % 1 === 0.5,
    )
    expect(new Set(feet.map(([x]) => x)).size).toBeGreaterThan(45)
  })

  it('never falls while it is held, and says so', () => {
    expect(etherRt60(5, 0.6, 0.5, true, BODY_HZ, RATE)).toBe(Infinity)
    const { display, params } = plate('ether-reverb')
    const held = drawDisplay(display, params, { values: { freeze: 1 } })
    expect(held.words()).toContain('∞')
    expect(held.words()).not.toContain('1.8s')
    // The tail runs level at the top, right across its box.
    const level = pointsOf(held).filter(([, y]) => Math.abs(y - TAIL.y) < 0.01)
    expect(Math.max(...level.map(([x]) => x))).toBeCloseTo(TAIL.x + TAIL.w, 3)
    // The end of the tail stays where letting go would put it, with a dashed line to it.
    const free = take(handlesOf('ether-reverb', { freeze: 0 }), 'decay')
    const frozen = take(handlesOf('ether-reverb', { freeze: 1 }), 'decay')
    expect(frozen.x).toBeCloseTo(free.x, 6)
    expect(frozen.y).toBeCloseTo(free.y, 6)
    expect(near(pointsOf(held), frozen.x, frozen.y)).toBe(true)
    // A held room lets nothing new in: no dry sound and no first echoes.
    const open = drawDisplay(display, params, { values: { freeze: 0 } })
    expect(held.calls.filter((call) => call.name === 'moveTo').length).toBeLessThan(
      open.calls.filter((call) => call.name === 'moveTo').length - 40,
    )
  })
})

describe('spring reverb', () => {
  it('runs its tank near twice the transition frequency', () => {
    expect(springRate(48000)).toBe(9600)
    expect(springRate(44100)).toBe(8820)
    expect(springRate(96000)).toBe(9600)
  })

  it('holds the highs of a bounce back: the chirp', () => {
    // A hundred allpasses (a + z⁻¹) / (1 + a·z⁻¹): 100·(1 − a)/(1 + a) samples at DC,
    // 100·(1 + a)/(1 − a) at half the rate. Tension 0.5 is a = 0.625.
    expect(springCascade(0.625, 0)).toBeCloseTo(23.077, 3)
    expect(springCascade(0.625, Math.PI)).toBeCloseTo(433.333, 3)
    // A taut spring (a = 0.8) spreads less far at 3.5 kHz than a slack one (a = 0.45).
    const w = (2 * Math.PI * 3500) / 9600
    expect(springCascade(0.8, w) - springCascade(0.8, 0)).toBeLessThan(
      springCascade(0.45, w) - springCascade(0.45, 0),
    )
  })

  it('falls 60 dB in its Decay at the low end, sooner higher up', () => {
    // The line makes up the round trip with what the cascade holds DC back, and the
    // loop's gain is the one that makes Decay the RT60 over that trip.
    expect(springRt60(2.5, 0.5, 20, RATE)).toBeCloseTo(2.5, 2)
    expect(springRt60(0.5, 0.5, 20, RATE)).toBeCloseTo(0.5, 2)
    expect(springRt60(2.5, 0.5, 3500, RATE)).toBeLessThan(springRt60(2.5, 0.5, 500, RATE))
    // At 500 Hz, where the figure is read: 2.42 s. Measured on the device: 2.42 to 2.45 s.
    expect(springRt60(2.5, 0.5, BODY_HZ, RATE)).toBeCloseTo(2.42, 2)
    const { display, params } = plate('spring-reverb')
    expect(drawDisplay(display, params).words()).toContain('2.4s')
  })

  it('lifts the trailing highs with Drip', () => {
    expect(springDripDb(0, 4000, RATE)).toBeCloseTo(0, 9)
    expect(Math.abs(springDripDb(1, 20, RATE))).toBeLessThan(0.1)
    // x + 4·highpass(x): at most five times, 13.98 dB.
    expect(springDripDb(1, 8000, RATE)).toBeGreaterThan(10)
    expect(springDripDb(1, 8000, RATE)).toBeLessThan(13.98)
  })

  it('lands its first bounce half a trip in', () => {
    // The pickup is half way round: 23.08 samples of cascade and 198 of line at 9.6 kHz, 23.0 ms.
    const first = (springCascade(0.625, 0) + 198) / 9600
    expect(first).toBeCloseTo(0.02303, 4)
    const start = take(
      handlesOf('spring-reverb', { predelay: 0, tension: 0.5, springs: 0 }),
      'start',
    )
    expect(start.x).toBeCloseTo(FIRST.x + (first / 0.4) * FIRST.w, 3)
    // With all three the shortest spring (35.6 ms round) is first: a = 0.645, 21.58 + 171 samples.
    const three = take(
      handlesOf('spring-reverb', { predelay: 0, tension: 0.5, springs: 2 }),
      'start',
    )
    expect(three.x).toBeCloseTo(
      FIRST.x + ((springCascade(0.645, 0) + 171) / 9600 / 0.4) * FIRST.w,
      3,
    )
  })

  it('draws more bounces for more springs, and other sweeps for another tension', () => {
    const { display, params } = plate('spring-reverb')
    const count = (springs: number): number =>
      drawDisplay(display, params, { values: { springs } }).calls.filter(
        (call) => call.name === 'lineTo',
      ).length
    expect(count(2)).toBeGreaterThan(count(1))
    expect(count(1)).toBeGreaterThan(count(0))
    const slack = drawDisplay(display, params, { values: { tension: 0 } })
    const taut = drawDisplay(display, params, { values: { tension: 1 } })
    expect(slack.print()).not.toBe(taut.print())
  })

  it('has no handle for the highs: Tone and the springs themselves set them', () => {
    expect([...handlesOf('spring-reverb').keys()]).toEqual(['start', 'decay'])
  })
})

describe('convolver reverb', () => {
  it('follows the envelope of its generated impulse', () => {
    // Noise under (1 − t / 2.6)^2.5: half way through it is 0.5^2.5, −15.05 dB.
    expect(REVERB_DECAY_SECONDS).toBe(2.6)
    expect(convolverDb(0)).toBeCloseTo(0, 9)
    expect(convolverDb(1.3)).toBeCloseTo(-15.051, 2)
    // 60 dB down where 1 − t / 2.6 = 10^(−60/50) = 0.0631: at 0.9369 of its length.
    expect(convolverSeconds(60)).toBeCloseTo(2.436, 3)
    expect(convolverDb(convolverSeconds(60))).toBeCloseTo(-60, 6)
    expect(convolverDb(2.7)).toBeLessThan(-100)
  })

  it('writes the time it takes to fall 60 dB and draws that curve', () => {
    const { display, params } = plate('convolver-reverb')
    const drawn = drawDisplay(display, params)
    expect(drawn.words()).toContain('2.4s')
    // Every point of the curve is the envelope under the wet level, on a box that spans 3 s.
    const wet = 20 * Math.log10(params.wet.default)
    const curve = pointsOf(drawn).filter(([x, y]) => {
      const seconds = ((x - STRIP.x) / STRIP.w) * 3
      return y < FOOT_Y - 0.5 && Math.abs(y - yOfDb(wet + convolverDb(seconds))) < 0.01
    })
    expect(curve.length).toBeGreaterThan(60)
    // It meets the foot where the envelope has fallen the rest of the way to −60.
    const reach = convolverSeconds(60 + wet)
    expect(near(pointsOf(drawn), STRIP.x + (reach / 3) * STRIP.w, FOOT_Y)).toBe(true)
  })

  it('sets Wet with the start of the curve', () => {
    const start = take(handlesOf('convolver-reverb'), 'wet')
    expect(start.x).toBe(STRIP.x)
    expect(start.y).toBeCloseTo(yOfDb(20 * Math.log10(0.26)), 3)
    expect(start.drag(start.x, yOfDb(-6)).wet).toBeCloseTo(0.5012, 3)
    expect(start.drag(start.x + 30, start.y).wet).toBeCloseTo(0.26, 6)
    // With no Wet there is no curve: the handle is on the foot and nothing rises from it.
    const { display, params } = plate('convolver-reverb')
    const none = take(handlesOf('convolver-reverb', { wet: 0 }), 'wet')
    expect(none.y).toBeCloseTo(FOOT_Y, 6)
    expect(none.drag(none.x, none.y).wet).toBe(0)
    const drawn = drawDisplay(display, params, { values: { wet: 0 } })
    const risen = pointsOf(drawn).filter(
      ([x, y]) => x > STRIP.x && x < STRIP.x + STRIP.w && x % 1 !== 0.5 && y < FOOT_Y - 4,
    )
    expect(risen).toEqual([])
  })
})

describe('shaped reverb', () => {
  const GATE = 0
  const REVERSE = 1
  const BLOOM = 2
  const FALL = 3
  const PULSE = 4

  it('draws the five shapes the device draws', () => {
    expect(shapedGain(GATE, 0)).toBe(1)
    expect(shapedGain(GATE, 1)).toBe(1)
    // Reverse: exp(−3.22·(1 − u)), 27.97 dB from end to end, faded in over the first twelfth.
    expect(shapedGain(REVERSE, 1)).toBeCloseTo(1, 9)
    expect(20 * Math.log10(shapedGain(REVERSE, 0.5))).toBeCloseTo(-13.98, 2)
    expect(shapedGain(REVERSE, 1 / 24)).toBeCloseTo(0.5 * Math.exp(-3.22 * (23 / 24)), 9)
    expect(shapedGain(REVERSE, 0)).toBe(0)
    // Bloom: sin(π·u^0.8)^1.2, at its top where u^0.8 = 0.5, u = 0.4204.
    expect(shapedGain(BLOOM, Math.pow(0.5, 1.25))).toBeCloseTo(1, 9)
    expect(shapedGain(BLOOM, 0)).toBe(0)
    expect(shapedGain(BLOOM, 1)).toBeLessThan(1e-12)
    expect(shapedGain(FALL, 0.25)).toBeCloseTo(0.75, 9)
    // Pulse: three humps of |sin(3π·u)|^1.5 under 1 − 0.3·u.
    expect(shapedGain(PULSE, 1 / 6)).toBeCloseTo(0.95, 9)
    expect(shapedGain(PULSE, 1 / 3)).toBeLessThan(1e-12)
    expect(shapedGain(PULSE, 5 / 6)).toBeCloseTo(0.75, 9)
    // Outside the span there is no shape.
    expect(shapedGain(GATE, -0.01)).toBe(0)
    expect(shapedGain(GATE, 1.01)).toBe(0)
  })

  it('counts its echoes and their smear as the device does', () => {
    // 8 a second at Density 0, 260 at 1, never fewer than 4 + 44·density, never more than 256.
    expect(shapedTaps(0, 0.9)).toBe(7)
    expect(shapedTaps(0.8, 0.9)).toBe(117)
    expect(shapedTaps(1, 0.9)).toBe(234)
    expect(shapedTaps(1, 4)).toBe(256)
    expect(shapedTaps(0.5, 0.1)).toBe(26)
    expect(shapedTaps(0, 0.1)).toBe(4)
    // 1.8 spacings, within 8 and 45 ms and a quarter of Time.
    expect(shapedSmear(0.9, 7)).toBeCloseTo(0.045, 9)
    expect(shapedSmear(0.9, 234)).toBeCloseTo(0.008, 9)
    expect(shapedSmear(0.9, 60)).toBeCloseTo(0.027, 9)
    expect(shapedSmear(0.1, 4)).toBeCloseTo(0.025, 9)
  })

  it('puts its echoes where the device’s are', () => {
    // Read off the device's impulse response (left side, Gate, Density 0, no pre-delay):
    // the seven echoes of Time 0.9 and the four of Time 0.5, in ms.
    const long = [123.34, 256.61, 335.78, 463.84, 578.01, 658.16, 813.76]
    long.forEach((ms, k) => expect(shapedTapSeconds(k, 7, 0.9, 0) * 1000).toBeCloseTo(ms, 0))
    const short = [118.03, 242.14, 315.87, 435.14]
    short.forEach((ms, k) => expect(shapedTapSeconds(k, 4, 0.5, 0) * 1000).toBeCloseTo(ms, 0))
    // Pre-delay moves them all.
    expect(shapedTapSeconds(0, 7, 0.9, 0.1)).toBeCloseTo(shapedTapSeconds(0, 7, 0.9, 0) + 0.1, 9)
  })

  it('knows the tail’s decay, its level and the level of the mix', () => {
    expect(shapedTailRt60(0)).toBeCloseTo(0.6, 9)
    expect(shapedTailRt60(0.5)).toBeCloseTo(1.897, 3)
    expect(shapedTailRt60(1)).toBeCloseTo(6, 9)
    expect(shapedTailLevel(0)).toBe(0)
    expect(shapedTailLevel(0.3)).toBeCloseTo(0.3782, 3)
    expect(shapedTailLevel(1)).toBeCloseTo(0.95, 9)
    // Equal power: all wet is 0 dB, half way −3.01; Repeat 0.6 takes back (1 − 0.36)^¼, 0.97 dB.
    expect(shapedWetDb(1, 0)).toBeCloseTo(0, 6)
    expect(shapedWetDb(0.5, 0)).toBeCloseTo(-3.0103, 3)
    expect(shapedWetDb(1, 0.6)).toBeCloseTo(-0.969, 2)
  })

  // A plain setting: no pre-delay, no colour, the cut filters out of the way, nothing after the shape.
  const plain = {
    preDelay: 0,
    colour: 0,
    highCut: 18000,
    lowCut: 20,
    repeat: 0,
    tail: 0,
    density: 0.8,
    mix: 0.4,
    time: 0.9,
  }
  // Time 0.9 on its log scale from 0.1 to 4 is 0.5956 of the way; the shape ends 0.28 + 0.32 of that across.
  const across = (0.28 + 0.32 * (Math.log(9) / Math.log(40))) * STRIP.w
  const seconds = (0.901 * STRIP.w) / across
  const xOf = (t: number): number => STRIP.x + (t / seconds) * STRIP.w
  // Mix 0.4 is sin(0.2π) = 0.5878, −4.616 dB.
  const wet = 20 * Math.log10(Math.sin(0.2 * Math.PI))
  // Density 0.8 is 8·32.5^0.8 = 129.6 echoes a second, 117 in 0.9 s, each drawn out by
  // 1.8·0.9/117 = 13.8 ms: the shape starts 1 ms and that after the sound and ends at 0.901 s.
  const from = 0.001 + (1.8 * 0.9) / 117
  const shapeSpan = 0.901 - from

  /** The points of the lines drawn a pixel apart: the level in the body and at the top. */
  function levelPoints(drawn: RecordingContext, after: number, before: number): [number, number][] {
    return pointsOf(drawn).filter(
      ([x, y]) =>
        Number.isInteger(x) && x > xOf(after) + 1 && x < xOf(before) - 1 && y < FOOT_Y - 0.01,
    )
  }

  /** The level in the body of the sound a pixel at a time, against `top`: the highest line at each, as [seconds, dB]. */
  function bodyLevels(drawn: RecordingContext, span: number, top: number): [number, number][] {
    const highest = new Map<number, number>()
    for (const [x, y] of pointsOf(drawn)) {
      // The grid's lines end on the box's sides; everything between them is the level.
      if (!Number.isInteger(x) || x <= STRIP.x || x >= STRIP.x + STRIP.w) continue
      if (y >= FOOT_Y - 0.01) continue
      highest.set(x, Math.min(y, highest.get(x) ?? Infinity))
    }
    return [...highest]
      .sort(([a], [b]) => a - b)
      .map(([x, y]): [number, number] => [((x - STRIP.x) / STRIP.w) * span, dbOfY(y) - top])
  }

  it('ends the shape where Time says, on a scale that says how long it is', () => {
    const handles = handlesOf('shaped-reverb', plain)
    const end = take(handles, 'end')
    expect(end.x).toBeCloseTo(STRIP.x + across, 6)
    expect(end.y).toBeCloseTo(yOfDb(wet), 3)
    // The start is the top of the shape's other side.
    const start = take(handles, 'start')
    expect(start.x).toBeCloseTo(xOf(from), 3)
    expect(start.y).toBeCloseTo(yOfDb(wet), 3)
    const { display, params } = plate('shaped-reverb')
    expect(drawDisplay(display, params, { values: plain }).words()).toContain('0.9s')
  })

  it('draws a gate as a level that stops dead', () => {
    const { display, params } = plate('shaped-reverb')
    const drawn = drawDisplay(display, params, { values: { ...plain, shape: GATE } })
    const inside = levelPoints(drawn, from, 0.901)
    expect(inside.length).toBeGreaterThan(100)
    for (const [, y] of inside) expect(Math.abs(dbOfY(y) - wet)).toBeLessThan(0.05)
    // After it, with no tail and no repeat, nothing.
    expect(levelPoints(drawn, 0.93, seconds)).toEqual([])
  })

  it('draws a reverse as a rise of 28 dB and a fall as the line 1 − u', () => {
    const { display, params } = plate('shaped-reverb')
    const along = (drawn: RecordingContext): [number, number][] =>
      bodyLevels(drawn, seconds, wet)
        .map(([t, db]): [number, number] => [(t - from) / shapeSpan, db])
        .filter(([u]) => u > 0.1 && u < 0.97)
    const reverse = along(drawDisplay(display, params, { values: { ...plain, shape: REVERSE } }))
    expect(reverse.length).toBeGreaterThan(60)
    // exp(−3.22·(1 − u)) is a straight line in dB: 27.97 under its end at its start.
    for (const [u, db] of reverse) expect(db).toBeCloseTo(-27.97 * (1 - u), 1)
    const fall = along(drawDisplay(display, params, { values: { ...plain, shape: FALL } }))
    expect(fall.length).toBeGreaterThan(60)
    for (const [u, db] of fall) expect(db).toBeCloseTo(20 * Math.log10(1 - u), 1)
  })

  it('brings the shape round again a Repeat lower', () => {
    const { display, params } = plate('shaped-reverb')
    const values = { ...plain, shape: GATE, repeat: 0.5, time: 0.3 }
    const drawn = drawDisplay(display, params, { values })
    // Time 0.3 is 0.2978 of the way: the box spans 0.301 / 0.3753 = 0.802 s, the gate and
    // most of two repeats. The loop's gain is the Repeat setting, 6.02 dB a trip (its
    // filters take 0.01 more at 500 Hz), and the wet level gives back (1 − 0.25)^¼, 0.62 dB.
    const span = 0.301 / (0.28 + 0.32 * (Math.log(3) / Math.log(40)))
    const levels = bodyLevels(drawn, span, wet + 5 * Math.log10(0.75))
    const during = (after: number, before: number): number[] =>
      levels.filter(([t]) => t > after && t < before).map(([, db]) => db)
    expect(during(0.03, 0.29).length).toBeGreaterThan(40)
    for (const db of during(0.03, 0.29)) expect(Math.abs(db)).toBeLessThan(0.05)
    expect(during(0.33, 0.59).length).toBeGreaterThan(40)
    for (const db of during(0.33, 0.59)) expect(db).toBeCloseTo(-6.03, 1)
    expect(during(0.63, 0.8).length).toBeGreaterThan(20)
    for (const db of during(0.63, 0.8)) expect(db).toBeCloseTo(-12.06, 1)
  })

  it('lets the tail ring on after a gate and fall at its own rate', () => {
    const { display, params } = plate('shaped-reverb')
    const values = { ...plain, shape: GATE, time: 0.3, tail: 0.3 }
    const drawn = drawDisplay(display, params, { values })
    const span = 0.301 / (0.28 + 0.32 * (Math.log(3) / Math.log(40)))
    const levels = bodyLevels(drawn, span, wet)
    // While the gate is open the tail fills up under it and adds to it: never as much
    // as the 0.58 dB it would add at the level it settles at, −8.45 dB.
    const settles = 20 * Math.log10(shapedTailLevel(0.3))
    for (const [, db] of levels.filter(([t]) => t > 0.03 && t < 0.29)) {
      expect(db).toBeGreaterThanOrEqual(-0.05)
      expect(db).toBeLessThan(10 * Math.log10(1 + Math.pow(10, settles / 10)))
    }
    // Once the gate has stopped and the longest line (317 ms) has let go of it, the
    // tail alone is left, under the level it settles at...
    const after = levels.filter(([t]) => t > 0.301 + 0.33)
    expect(after.length).toBeGreaterThan(20)
    for (const [, db] of after) expect(db).toBeLessThan(settles)
    // ...and falling 60 dB in 0.6·10^0.3 = 1.197 s: 50.1 dB a second, and a little more
    // for what the damping takes on every pass.
    const [t0, db0] = after[0]
    const [t1, db1] = after[after.length - 1]
    expect((db0 - db1) / (t1 - t0)).toBeGreaterThan(50)
    expect((db0 - db1) / (t1 - t0)).toBeLessThan(51.5)
  })

  it('sets Tail with a handle that stands on the tail', () => {
    const none = take(handlesOf('shaped-reverb', { ...plain, shape: GATE, tail: 0 }), 'tail')
    expect(none.y).toBeCloseTo(FOOT_Y, 6)
    expect(none.drag(none.x, FOOT_Y).tail).toBe(0)
    expect(none.drag(none.x, yOfDb(wet - 12)).tail).toBeGreaterThan(0)
    const some = take(handlesOf('shaped-reverb', { ...plain, shape: GATE, tail: 0.5 }), 'tail')
    expect(some.y).toBeLessThan(FOOT_Y)
    // Under the level the tail settles at, and not far under it.
    const settles = wet + 20 * Math.log10(shapedTailLevel(0.5))
    expect(dbOfY(some.y)).toBeLessThan(settles)
    expect(dbOfY(some.y)).toBeGreaterThan(settles - 10)
    expect(some.drag(some.x, some.y).tail).toBeCloseTo(0.5, 6)
    expect(some.drag(some.x, some.y - 3).tail).toBeGreaterThan(0.5)
    expect(some.drag(some.x, some.y + 3).tail).toBeLessThan(0.5)
  })

  it('drags the gap with the start and the length with the end', () => {
    const handles = handlesOf('shaped-reverb', plain)
    const start = take(handles, 'start')
    // The end stays put, so a start further right is a longer gap and no other Time.
    const later = start.drag(start.x + 10, start.y)
    expect(later.preDelay).toBeGreaterThan(50)
    expect(later.mix).toBeCloseTo(0.4, 3)
    expect(Object.keys(later).sort()).toEqual(['mix', 'preDelay'])
    const end = take(handles, 'end')
    expect(end.drag(end.x, end.y).time).toBeCloseTo(0.9, 6)
    expect(end.drag(end.x + 20, end.y).time).toBeGreaterThan(0.9)
    expect(Object.keys(end.drag(end.x + 20, end.y))).toEqual(['time'])
  })

  it('draws as many echoes as Density asks for', () => {
    const { display, params } = plate('shaped-reverb')
    const moves = (density: number): number =>
      drawDisplay(display, params, { values: { ...plain, shape: GATE, density } }).calls.filter(
        (call) => call.name === 'moveTo',
      ).length
    // Seven echoes at Density 0; at 1 they stand two pixels apart and read as a hatch.
    expect(moves(0.5) - moves(0)).toBeGreaterThan(20)
    expect(moves(1)).toBeGreaterThan(moves(0.5))
  })

  it('takes the highs from the late echoes or the early ones with Colour', () => {
    const { display, params } = plate('shaped-reverb')
    const top = (colour: number): number[] => {
      const drawn = drawDisplay(display, params, { values: { ...plain, shape: GATE, colour } })
      // The lowest line at each moment is the top of the spectrum.
      return [0.1, 0.8].map((t) =>
        Math.max(
          ...levelPoints(drawn, from, 0.901)
            .filter(([x]) => Math.abs(x - xOf(t)) <= 0.5)
            .map(([, y]) => y),
        ),
      )
    }
    const [earlyFlat, lateFlat] = top(0)
    expect(earlyFlat).toBeCloseTo(lateFlat, 1)
    const [earlyDark, lateDark] = top(-1)
    expect(lateDark).toBeGreaterThan(earlyDark + 5)
    const [earlyBright, lateBright] = top(1)
    expect(earlyBright).toBeGreaterThan(lateBright + 5)
  })
})

/** A sound at the device for a frame: so loud going in (null when the plate was not told) and coming out. */
function sound(input: number | null, output: number): DisplaySignal {
  return {
    input: input === null ? null : testLevel(input),
    output: testLevel(output),
    spectrum: null,
    binHz: 0,
    left: null,
    right: null,
  }
}
const SILENT = 0.000001

describe('what happens now', () => {
  /** The accent's fills, its strokes, and the dots drawn in it: [x, y] of each. */
  function accentOf(drawn: RecordingContext): {
    fills: number
    strokes: number
    bars: number[][]
    dots: [number, number][]
  } {
    let fill = ''
    let fills = 0
    let strokes = 0
    const bars: number[][] = []
    const dots: [number, number][] = []
    let arc: [number, number] | null = null
    for (const call of drawn.calls) {
      if (call.name === 'set fillStyle') {
        fill = String(call.args[0])
        if (fill === PLAIN_COLOURS.accent) fills += 1
      } else if (call.name === 'set strokeStyle') {
        if (call.args[0] === PLAIN_COLOURS.accent) strokes += 1
      } else if (call.name === 'fillRect' && fill === PLAIN_COLOURS.accent) {
        bars.push(call.args as number[])
      } else if (call.name === 'arc') {
        arc = [call.args[0] as number, call.args[1] as number]
      } else if (call.name === 'fill' && arc) {
        if (fill === PLAIN_COLOURS.accent) dots.push(arc)
        arc = null
      }
    }
    return { fills, strokes, bars, dots }
  }

  it('stands a steady sound as a level at the left edge, and draws no tail for it', () => {
    for (const id of [...ROOMS, ...STRIPS]) {
      const { display, params } = plate(id)
      // A drone for four seconds: as loud coming out as going in.
      const drawn = runDisplay(display, params, 4, { signal: sound(0.5, 0.5) })
      const accent = accentOf(drawn)
      const box = ROOMS.includes(id) ? FIRST : STRIP
      // One bar, 3 wide at x 4, from the top of the box to its foot: 0 dB against what went in.
      expect(accent.bars.length, id).toBe(1)
      const [x, y, w, h] = accent.bars[0]
      expect([x, w], id).toEqual([4, 3])
      expect(y, id).toBeCloseTo(box.y, 6)
      expect(y + h, id).toBeCloseTo(box.y + box.h, 6)
      // The shaped reverb's picture is what a short sound does: the level since the
      // drone began is a level line there. The others draw no line and no dot.
      if (id !== 'shaped-reverb') {
        expect(accent.strokes, id).toBe(0)
        expect(accent.dots, id).toEqual([])
      }
    }
  })

  it('shows the reverb alone standing lower against the sound that goes in', () => {
    const { display, params } = plate('hall-reverb')
    // What comes out is 12 dB under what goes in: the bar is 12 dB short of the top.
    const drawn = runDisplay(display, params, 2, {
      signal: sound(0.5, 0.5 * Math.pow(10, -12 / 20)),
    })
    const [, y, , h] = accentOf(drawn).bars[0]
    expect(y).toBeCloseTo(yIn(FIRST, -12), 3)
    expect(y + h).toBeCloseTo(FIRST.y + FIRST.h, 6)
  })

  it('follows the sound down the tail from the moment it stops', () => {
    for (const id of ROOMS) {
      const { display, params } = plate(id)
      const span = SPAN[id]
      // A drone for two seconds; then nothing goes in and what comes out falls 20 dB a second.
      const stopped = 2
      const run = (seconds: number): RecordingContext =>
        runDisplay(display, params, seconds, {}, (time) => ({
          signal:
            time < stopped - 0.001
              ? sound(0.5, 0.5)
              : sound(SILENT, 0.25 * Math.pow(10, -(time - stopped))),
        }))
      const drawn = run(3.5)
      const accent = accentOf(drawn)
      // A line and the dot at its end. The last frame is at 3.4667 s and the last with sound
      // going in at 1.9667 s: 1.5 s since. The fall is measured from the first frame the
      // reverb is alone, 0.07 s on (at 2.0667 s): 1.4 s of 20 dB a second, 28 dB.
      expect(accent.strokes, id).toBe(1)
      expect(accent.dots.length, id).toBe(1)
      const [x, y] = accent.dots[0]
      expect(x, id).toBeCloseTo(TAIL.x + (1.5 / span) * TAIL.w, 3)
      expect(y, id).toBeCloseTo(yIn(TAIL, -28), 1)
      // The level at the edge has dropped with it: 6 dB for the dry sound gone, and the fall.
      const [, top] = accent.bars[0]
      expect(top, id).toBeCloseTo(yIn(FIRST, -6.02 - 20 * 1.4667), 1)
      // Once it has fallen 60 dB and stayed there a second, the picture is at rest again.
      const after = accentOf(run(6.5))
      expect(after.fills + after.strokes, id).toBe(0)
    }
  })

  it('keeps a tail that outlasts the scale as a dot at its right edge', () => {
    const { display, params } = plate('hall-reverb')
    // What comes out falls 5 dB a second: 6 s on (the scale's whole span) it is 30 dB down.
    const drawn = runDisplay(display, params, 9, {}, (time) => ({
      signal: time < 1.999 ? sound(0.5, 0.5) : sound(SILENT, 0.25 * Math.pow(10, -(time - 2) / 4)),
    }))
    const accent = accentOf(drawn)
    expect(accent.strokes).toBe(0)
    expect(accent.dots.length).toBe(1)
    expect(accent.dots[0][0]).toBeCloseTo(TAIL.x + TAIL.w, 6)
    expect(accent.dots[0][1]).toBeCloseTo(yIn(TAIL, -5 * (8.9667 - 2.0667)), 0)
  })

  it('lets the convolver ring down its own curve from the level it is set to', () => {
    const { display, params } = plate('convolver-reverb')
    const drawn = runDisplay(display, params, 3, {}, (time) => ({
      signal: time < 1.999 ? sound(0.5, 0.5) : sound(SILENT, 0.25 * Math.pow(10, -(time - 2))),
    }))
    const accent = accentOf(drawn)
    expect(accent.dots.length).toBe(1)
    // 1 s since the last frame with sound (1.9667 to 2.9667): a third of the 3 s across, and
    // 18 dB (0.9 s of the fall, from 2.0667 s) under the level the curve starts at, Wet 0.26.
    const wet = 20 * Math.log10(0.26)
    expect(accent.dots[0][0]).toBeCloseTo(STRIP.x + STRIP.w / 3, 3)
    expect(accent.dots[0][1]).toBeCloseTo(yOfDb(wet - 18), 1)
  })

  it('follows a held Ether from the frame it is first heard, with no sound going in', () => {
    const { display, params } = plate('ether-reverb')
    // Held, the room lets nothing in: loud input is not what rings.
    const drawn = runDisplay(display, params, 2, { values: { freeze: 1 }, signal: sound(0.5, 0.2) })
    const accent = accentOf(drawn)
    expect(accent.dots.length).toBe(1)
    // What rings holds its level: the dot runs along the top.
    expect(accent.dots[0][1]).toBeCloseTo(TAIL.y, 6)
    expect(accent.dots[0][0]).toBeGreaterThan(TAIL.x + 30)
  })

  it('draws the shaped reverb’s answer from the moment the sound was loudest', () => {
    const { display, params } = plate('shaped-reverb')
    // A clap, then what comes out: 20 dB under it and steady.
    const drawn = runDisplay(display, params, 1, {}, (time) => ({
      signal: time < 0.05 ? sound(0.5, 0.5) : sound(SILENT, 0.05),
    }))
    const accent = accentOf(drawn)
    expect(accent.strokes).toBe(1)
    expect(accent.dots.length).toBe(1)
    // The last frame with the clap is at 0.0333 s, the last frame at 0.9667 s; Time 0.9
    // puts its end (0.901 s) at 0.28 + 0.32·0.5956 of the box, so the box spans 1.914 s.
    const seconds = 0.901 / (0.28 + 0.32 * (Math.log(9) / Math.log(40)))
    expect(accent.dots[0][0]).toBeCloseTo(STRIP.x + ((0.9667 - 0.0333) / seconds) * STRIP.w, 1)
    expect(accent.dots[0][1]).toBeCloseTo(yOfDb(-20), 1)
  })

  it('takes the level coming out for the sound where the plate was not told what goes in', () => {
    const { display, params } = plate('plate-reverb')
    const drawn = runDisplay(display, params, 3, {}, (time) => ({
      signal: sound(null, time < 1.999 ? 0.5 : 0.25 * Math.pow(10, -(time - 2))),
    }))
    const accent = accentOf(drawn)
    expect(accent.dots.length).toBe(1)
    expect(accent.dots[0][1]).toBeGreaterThan(TAIL.y + 5)
  })

  it('shows nothing in the second colour in silence, at rest or switched off', () => {
    for (const id of [...ROOMS, ...STRIPS]) {
      const { display, params } = plate(id)
      const none = (drawn: RecordingContext): number =>
        accentOf(drawn).fills + accentOf(drawn).strokes
      // In silence nothing has gone in, so there is nothing to ring.
      expect(none(runDisplay(display, params, 0.5, { signal: sound(SILENT, SILENT) })), id).toBe(0)
      expect(none(drawDisplay(display, params, { signal: null })), id).toBe(0)
      // Sound still passes a device that is off; it is not the device's tail.
      const off = runDisplay(display, params, 3, { powered: false }, (time) => ({
        signal: time < 1.999 ? sound(0.5, 0.5) : sound(SILENT, 0.25),
      }))
      expect(none(off), id).toBe(0)
      // And the picture at rest is the whole of what the device does: as much ink as when it runs.
      const still = drawDisplay(display, params, { signal: null })
      expect(still.marks(), id).toBeGreaterThan(20)
      expect(
        still.words().some((word) => word.endsWith('s')),
        id,
      ).toBe(true)
    }
  })
})

describe('at another sample rate', () => {
  /** Draw a frame at a rate other than the harness's 48 kHz. */
  function drawAt(id: string, rate: number, values: Record<string, number> = {}): RecordingContext {
    const { display, params } = plate(id)
    const { frame, drawn } = frameOf(display, params, { values })
    display.draw({ ...frame, sampleRate: rate })
    return drawn
  }

  it('stands every handle where the picture was last drawn', () => {
    // The plate's damping is one coefficient at any rate, so at 96 kHz it takes less of
    // 8 kHz: cos(2π·8000/96000) = 0.866, 0.49 / (1.09 − 0.5196) = 0.859 of the power, −0.66 dB
    // twice a trip on −12.392, so 3.17 s · 1.0034 where 48 kHz gives 2.64 s.
    expect(plateRt60(0.7, 0.3, TOP_HZ, 96000)).toBeCloseTo(3.19, 1)
    for (const rate of [44100, 96000, 48000]) {
      const drawn = drawAt('plate-reverb', rate)
      const highs = take(handlesOf('plate-reverb'), 'damping')
      const onset = 0.02 + 266 / 29761
      const top = plateRt60(0.7, 0.3, TOP_HZ, rate)
      expect(highs.x, String(rate)).toBeCloseTo(TAIL.x + ((onset + top / 2) / 8) * TAIL.w, 6)
      // The handle's place is on the line that was drawn: the line ends at the foot twice as far along.
      expect(
        near(pointsOf(drawn), TAIL.x + ((onset + top) / 8) * TAIL.w, TAIL.y + TAIL.h),
        String(rate),
      ).toBe(true)
      // Taken where it stands and not moved, it sets what is set.
      expect(highs.drag(highs.x, highs.y).damping, String(rate)).toBeCloseTo(0.3, 3)
    }
  })

  it('writes the figures a session at 44.1 kHz would measure', () => {
    // The spring's tank runs at 8820 Hz there (9600 at 48 kHz): its Decay is still the
    // 60 dB time at the low end. The FDN's lines are 4799 samples exactly. The plate's
    // damping takes a little more of the highs: 2.55 s at 8 kHz where 48 kHz gives 2.64.
    expect(springRt60(2.5, 0.5, 20, 44100)).toBeCloseTo(2.5, 2)
    expect(fdnRt60(5, 0.4, 1, BODY_HZ, 44100)).toBeCloseTo(fdnRt60(5, 0.4, 1, BODY_HZ, RATE), 1)
    expect(plateRt60(0.7, 0.3, TOP_HZ, 44100)).toBeCloseTo(2.55, 1)
    for (const [id, words] of [
      ['plate-reverb', '3.9s'],
      ['fdn-reverb', '4.9s'],
      ['hall-reverb', '2s'],
      ['ether-reverb', '1.8s'],
      ['spring-reverb', '2.4s'],
    ]) {
      expect(drawAt(id, 44100).words(), id).toContain(words)
    }
    // Leave the family at the harness's rate for the tests that follow.
    drawAt('plate-reverb', RATE)
  })
})

describe('a drag', () => {
  it('sets the same parameters wherever it goes, so it is one gesture from press to release', () => {
    for (const id of [...ROOMS, ...STRIPS]) {
      const { display, params } = plate(id)
      const size = viewOf(display, params)
      const out: Record<string, number> = id === 'convolver-reverb' ? { wet: 0 } : { mix: 0 }
      for (const values of [{}, out]) {
        for (const handle of handlesOf(id, values).values()) {
          const names = Object.keys(handle.drag(handle.x, handle.y)).sort()
          expect(names.length, `${id} ${handle.key}`).toBeGreaterThan(0)
          for (const x of [-300, 0, size.width / 2, size.width, size.width + 300]) {
            for (const y of [-300, 0, size.height / 2, size.height, size.height + 300]) {
              const set = handle.drag(x, y)
              expect(Object.keys(set).sort(), `${id} ${handle.key}`).toEqual(names)
              // And every value it sets is one the parameter can take.
              for (const [name, value] of Object.entries(set)) {
                expect(value, `${id} ${handle.key} ${name}`).toBeGreaterThanOrEqual(
                  params[name].min,
                )
                expect(value, `${id} ${handle.key} ${name}`).toBeLessThanOrEqual(params[name].max)
              }
              // Its reset names the same parameters, at their defaults.
              const reset = handle.reset?.() ?? {}
              expect(Object.keys(reset).sort(), `${id} ${handle.key}`).toEqual(names)
              for (const name of names) expect(reset[name]).toBe(params[name].default)
            }
          }
        }
      }
    }
  })

  it('reaches the very ends of a parameter and not a hair inside them', () => {
    const highs = take(handlesOf('plate-reverb'), 'damping')
    expect(highs.drag(TAIL.x + TAIL.w, highs.y).damping).toBe(0)
    expect(highs.drag(TAIL.x, highs.y).damping).toBe(1)
    const end = take(handlesOf('fdn-reverb'), 'decay')
    expect(end.drag(TAIL.x, TAIL.y + TAIL.h).decay).toBe(0.1)
    expect(end.drag(TAIL.x + TAIL.w, TAIL.y).decay).toBe(20)
  })
})

describe('laying a picture out', () => {
  it('works a picture out again only when a setting moves', () => {
    // A frame at the same settings asks for each of them once, to see whether it moved,
    // and a few more for its words; one at another setting asks many times over, laying
    // the picture out again. (The convolver's picture is one curve it keeps.)
    for (const id of [...ROOMS, 'shaped-reverb']) {
      const { display, params } = plate(id)
      const state: unknown = display.init?.()
      const asked = (values: Record<string, number>): number => {
        const { frame } = frameOf(display, params, { values, state, signal: sound(0.5, 0.5) })
        let count = 0
        display.draw({
          ...frame,
          value: (name) => {
            count += 1
            return frame.value(name)
          },
        })
        return count
      }
      const first = asked({})
      const again = asked({})
      const movedTo = asked({ mix: 0.9 })
      expect(again, id).toBeLessThanOrEqual((display.params?.length ?? 0) + 2)
      expect(first, id).toBeGreaterThan(2 * again)
      expect(movedTo, id).toBeGreaterThan(2 * again)
    }
  })
})
