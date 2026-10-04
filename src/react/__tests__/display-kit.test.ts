// The drawing the plate displays share: the scales turn back on themselves,
// the filters are the ones the devices are built from, a history scrolls by
// the clock, and an LFO carried between two readings stays in step.

import { describe, expect, it } from 'vitest'

import {
  History,
  biquad,
  biquadDb,
  dbOfY,
  dbToGain,
  follow,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  dbText,
  lfo,
  onePoleDb,
  responsePoints,
  spectrum,
  text,
  trackPhase,
  xOfHz,
  yOfDb,
  FLOOR_DB,
  PLAIN_COLOURS,
  type Box,
  type PhaseTrack,
} from '../components/display-kit'
import { recordingContext, testSignal } from './display-harness'

const BOX: Box = { x: 4, y: 4, w: 168, h: 92 }
const RATE = 48000

describe('scales', () => {
  it('place decibels and frequencies on a box and read them back', () => {
    expect(yOfDb(0, BOX, 0, -60)).toBe(4)
    expect(yOfDb(-60, BOX, 0, -60)).toBe(96)
    expect(yOfDb(-30, BOX, 0, -60)).toBe(50)
    for (const db of [-48, -12.5, 0])
      expect(dbOfY(yOfDb(db, BOX, 6, -60), BOX, 6, -60)).toBeCloseTo(db)
    expect(xOfHz(20, BOX)).toBe(4)
    expect(xOfHz(20000, BOX)).toBe(172)
    // A decade is a third of the way across: the scale is in octaves, not hertz.
    expect(xOfHz(200, BOX)).toBeCloseTo(4 + 168 / 3)
    for (const hz of [31, 440, 12000]) expect(hzOfX(xOfHz(hz, BOX), BOX)).toBeCloseTo(hz, 6)
  })

  it('turn a gain into decibels and back, with a floor under silence', () => {
    expect(gainToDb(1)).toBe(0)
    expect(gainToDb(0.5)).toBeCloseTo(-6.02, 2)
    expect(gainToDb(0)).toBe(FLOOR_DB)
    expect(dbToGain(-20)).toBeCloseTo(0.1)
    expect(dbToGain(gainToDb(0.25))).toBeCloseTo(0.25)
  })

  it('say a frequency and a level in few letters', () => {
    expect([hzText(80), hzText(1000), hzText(2500), hzText(12000)]).toEqual([
      '80 Hz',
      '1 kHz',
      '2.5 kHz',
      '12 kHz',
    ])
    expect(dbText(3)).toMatch(/^\+3/)
    expect(dbText(-4.5)).toMatch(/^[−-]4\.5/)
  })
})

describe('filters', () => {
  const at = (
    kind: Parameters<typeof biquad>[0],
    q: number,
    gain: number,
    hz: number,
    dbQ = false,
  ) => biquadDb(biquad(kind, 1000, q, gain, RATE, dbQ), hz, RATE)

  it('cut as the Web Audio filters do: 3 dB down at the corner when Q is 0 dB', () => {
    // Q in dB is the height at the corner over a flat (Butterworth) cut's −3 dB.
    expect(at('lowpass', 0, 0, 1000, true)).toBeCloseTo(0, 1)
    expect(at('lowpass', -3.01, 0, 1000, true)).toBeCloseTo(-3.01, 1)
    expect(at('lowpass', -3.01, 0, 50, true)).toBeCloseTo(0, 1)
    // Two poles: 12 dB an octave well above the corner.
    expect(at('lowpass', -3.01, 0, 8000, true) - at('lowpass', -3.01, 0, 4000, true)).toBeCloseTo(
      -12,
      -0.5,
    )
    expect(at('highpass', -3.01, 0, 1000, true)).toBeCloseTo(-3.01, 1)
    expect(at('highpass', 6, 0, 1000, true)).toBeCloseTo(6, 1)
  })

  it('lift a band by its gain at its centre and leave the far ends alone', () => {
    expect(at('peaking', 1, 9, 1000)).toBeCloseTo(9, 3)
    expect(at('peaking', 1, -9, 1000)).toBeCloseTo(-9, 3)
    expect(at('peaking', 1, 9, 30)).toBeCloseTo(0, 0)
    expect(at('peaking', 1, 9, 18000)).toBeCloseTo(0, 0)
    // A narrower band has fallen further an octave away.
    expect(at('peaking', 4, 9, 2000)).toBeLessThan(at('peaking', 0.5, 9, 2000))
  })

  it('shelves reach their gain on their own side, and half of it at the corner', () => {
    expect(at('lowshelf', 1, 6, 20)).toBeCloseTo(6, 1)
    expect(at('lowshelf', 1, 6, 1000)).toBeCloseTo(3, 1)
    expect(at('lowshelf', 1, 6, 18000)).toBeCloseTo(0, 1)
    expect(at('highshelf', 1, -6, 18000)).toBeCloseTo(-6, 1)
    expect(at('highshelf', 1, -6, 20)).toBeCloseTo(0, 1)
  })

  it('a band pass is whole at its centre, a notch empty, an all pass flat', () => {
    expect(at('bandpass', 2, 0, 1000)).toBeCloseTo(0, 3)
    expect(at('bandpass', 2, 0, 100)).toBeLessThan(-20)
    expect(at('notch', 2, 0, 1000)).toBeLessThan(-60)
    expect(at('notch', 2, 0, 100)).toBeCloseTo(0, 0)
    for (const hz of [50, 1000, 15000]) expect(at('allpass', 1, 0, hz)).toBeCloseTo(0, 6)
  })

  it('one pole falls 3 dB at its corner and 6 dB an octave beyond', () => {
    expect(onePoleDb('lowpass', 1000, 1000)).toBeCloseTo(-3.01, 2)
    expect(onePoleDb('highpass', 1000, 1000)).toBeCloseTo(-3.01, 2)
    expect(onePoleDb('lowpass', 1000, 16000) - onePoleDb('lowpass', 1000, 8000)).toBeCloseTo(-6, 0)
    expect(onePoleDb('highpass', 1000, 20000)).toBeCloseTo(0, 1)
  })

  it('lays a response across a box, a point every second pixel', () => {
    const points = responsePoints(BOX, (hz) => (hz < 1000 ? 6 : -6), 12, -12)
    expect(points).toHaveLength(BOX.w / 2 + 1)
    expect(points[0]).toEqual([4, yOfDb(6, BOX, 12, -12)])
    expect(points.at(-1)).toEqual([172, yOfDb(-6, BOX, 12, -12)])
    // A curve that leaves the scale is held a little way off it, never at infinity.
    const far = responsePoints(BOX, () => -400, 12, -12)
    expect(far.every(([, y]) => Number.isFinite(y))).toBe(true)
  })
})

describe('History', () => {
  it('scrolls by the clock: a slot for every step of time, whatever the frame rate', () => {
    const history = new History(1, 10, -1)
    expect(history.at(0)).toBe(-1)
    history.push(5.0, 0.2)
    expect(history.at(0)).toBeCloseTo(0.2)
    // The same slot: the latest reading stands.
    history.push(5.05, 0.3)
    expect(history.at(0)).toBeCloseTo(0.3)
    expect(history.at(1)).toBe(-1)
    // A tenth of a second on: a new slot.
    history.push(5.1, 0.6)
    expect([history.at(0), history.at(1)].map((v) => +v.toFixed(2))).toEqual([0.6, 0.3])
    // A pause of three slots: the ones skipped hold what was there.
    history.push(5.4, 0.9)
    expect([0, 1, 2, 3].map((back) => +history.at(back).toFixed(2))).toEqual([0.9, 0.6, 0.6, 0.6])
    // A long pause fills the whole of it and no more.
    history.push(60, 0.1)
    expect(history.at(0)).toBeCloseTo(0.1)
    expect(history.at(9)).toBeCloseTo(0.9)
    history.clear()
    expect(history.at(0)).toBe(-1)
  })

  it('keeps the highest or the lowest reading of a slot when asked', () => {
    const peaks = new History(1, 10, 0, 'max')
    peaks.push(1.0, 0.2)
    peaks.push(1.01, 0.8)
    peaks.push(1.02, 0.4)
    expect(peaks.at(0)).toBeCloseTo(0.8)
    const dips = new History(1, 10, 0, 'min')
    dips.push(1.0, -2)
    dips.push(1.01, -9)
    dips.push(1.02, -4)
    expect(dips.at(0)).toBeCloseTo(-9)
  })

  it('lays itself across a box with now at the right edge', () => {
    const history = new History(1, 5, 0)
    for (let n = 0; n < 5; n++) history.push(2 + n * 0.2, n)
    const points = history.points(BOX, (value) => value * 10)
    expect(points.map(([x]) => x)).toEqual([4, 46, 88, 130, 172])
    expect(points.map(([, y]) => y)).toEqual([0, 10, 20, 30, 40])
  })
})

describe('motion', () => {
  it('follows a target with one time going up and another coming down', () => {
    expect(follow(0, 1, 0.1, 0.1, 1)).toBeCloseTo(1 - Math.exp(-1))
    expect(follow(1, 0, 0.1, 0.1, 1)).toBeCloseTo(Math.exp(-0.1))
    // No time at all is a jump; no frame time is no move; a bad target is ignored.
    expect(follow(0, 1, 0.1, 0, 1)).toBe(1)
    expect(follow(0.3, 1, 0, 0.1, 1)).toBe(0.3)
    expect(follow(0.3, Number.NaN, 0.1, 0.1, 1)).toBe(0.3)
    // Two frames of half the time land where one frame of the whole does.
    expect(follow(follow(0, 1, 0.05, 0.2, 1), 1, 0.05, 0.2, 1)).toBeCloseTo(
      follow(0, 1, 0.1, 0.2, 1),
    )
  })

  it('draws the plain LFO shapes between −1 and 1, starting as a sine does', () => {
    expect(lfo('sine', 0.25)).toBeCloseTo(1)
    expect(lfo('triangle', 0.25)).toBeCloseTo(1)
    expect(lfo('triangle', 0.5)).toBeCloseTo(0)
    expect(lfo('triangle', 0.75)).toBeCloseTo(-1)
    expect([lfo('square', 0.1), lfo('square', 0.6)]).toEqual([1, -1])
    expect([lfo('saw', 0), lfo('ramp', 0)]).toEqual([1, -1])
    // A phase past one cycle is the same place in the next.
    expect(lfo('sine', 1.25)).toBeCloseTo(lfo('sine', 0.25))
    expect(lfo('triangle', -0.75)).toBeCloseTo(lfo('triangle', 0.25))
  })

  it('carries an LFO between two readings at its rate, and takes a reading that disagrees', () => {
    // A 2 Hz LFO read 30 times a second, drawn 60 times a second.
    let track: PhaseTrack | null = null
    let device = 0.1
    const seen: number[] = []
    for (let frame = 0; frame < 60; frame++) {
      if (frame % 2 === 0) device = (0.1 + (frame / 60) * 2) % 1
      track = trackPhase(track, device, 2, 1 / 60)
      seen.push(track.phase)
    }
    // It never stands still and never jumps: each frame is one sixtieth of two cycles on.
    for (let n = 1; n < seen.length; n++) {
      const step = (seen[n] - seen[n - 1] + 1) % 1
      expect(step).toBeGreaterThan(0.01)
      expect(step).toBeLessThan(0.06)
    }
    // It ends where the device is, within a frame's travel.
    const truth = (0.1 + (59 / 60) * 2) % 1
    const off = Math.abs(((seen[59] - truth + 1.5) % 1) - 0.5)
    expect(off).toBeLessThan(0.05)
    // A reading far from where it was carried to (the device was retriggered) is taken at once.
    expect(trackPhase({ phase: 0.9, reading: 0.9 }, 0.3, 2, 1 / 60).phase).toBe(0.3)
  })
})

describe('drawing', () => {
  const paint = () => {
    const drawn = recordingContext()
    return { drawn, frame: { ctx: drawn.ctx, colours: PLAIN_COLOURS, fontFamily: 'sans-serif' } }
  }

  it('lays a ground the size of the display and hands back the box inside it', () => {
    const { drawn, frame } = paint()
    expect(ground({ ...frame, width: 184, height: 48 })).toEqual({ x: 4, y: 4, w: 176, h: 40 })
    expect(drawn.calls.find((call) => call.name === 'fillRect')?.args).toEqual([0, 0, 184, 48])
    expect(ground({ ...frame, width: 100, height: 100 }, 0)).toEqual({ x: 1, y: 1, w: 98, h: 98 })
  })

  it('writes in the font of the plate at the size of a knob label unless told', () => {
    const { drawn, frame } = paint()
    text(frame, '−3.0', 10, 12)
    text(frame, 'now', 10, 30, { size: 9, align: 'right' })
    const fonts = drawn.calls.filter((call) => call.name === 'set font').map((call) => call.args[0])
    expect(fonts).toEqual(['8px sans-serif', '9px sans-serif'])
    expect(drawn.words()).toEqual(['−3.0', 'now'])
  })

  it('fills a handle with the plate until it is under the pointer, then with the accent', () => {
    const { drawn, frame } = paint()
    handle(frame, 20, 20)
    handle(frame, 40, 20, { hot: true })
    const fills = drawn.calls
      .filter((call) => call.name === 'set fillStyle')
      .map((call) => call.args[0])
    expect(fills).toEqual([PLAIN_COLOURS.plate, PLAIN_COLOURS.accent])
    const radii = drawn.calls.filter((call) => call.name === 'arc').map((call) => call.args[2])
    expect(radii[1]).toBeGreaterThan(radii[0] as number)
  })

  it('draws the spectrum as a slope where a bin is wider than a pixel, and nothing in silence', () => {
    const { drawn, frame } = paint()
    spectrum({ ...frame, signal: testSignal() }, BOX, { topDb: 0, bottomDb: -90 })
    expect(drawn.marks()).toBe(1)
    const ys = drawn.calls.filter((call) => call.name === 'lineTo').map((call) => call.args[1])
    // The lowest columns each read between two bins: no two the same height in a row.
    const low = ys.slice(1, 12) as number[]
    expect(new Set(low.map((y) => y.toFixed(3))).size).toBeGreaterThan(6)
    for (const { value } of drawn.numbers()) expect(Number.isFinite(value)).toBe(true)

    const silent = paint()
    const quiet = testSignal()
    quiet.spectrum?.fill(-Infinity)
    spectrum({ ...silent.frame, signal: quiet }, BOX)
    expect(silent.drawn.marks()).toBe(0)
    spectrum({ ...silent.frame, signal: null }, BOX)
    expect(silent.drawn.marks()).toBe(0)
  })
})
