// The truth of the modulation displays: what each draws against the device it
// stands for. The formulas the displays are drawn from are checked against
// numbers worked out by hand and against the compiled devices themselves
// (their sound through an impulse or a tone, and the readings they report),
// and the drawings against the formulas.

import { describe, expect, it } from 'vitest'

import { CHORUS_PARAMS } from '../../dsp/devices/chorus.gen'
import { FLANGER_PARAMS } from '../../dsp/devices/flanger.gen'
import { PHASER_PARAMS } from '../../dsp/devices/phaser.gen'
import { ROTARY_PARAMS } from '../../dsp/devices/rotary.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { type ParamSpec } from '../../core/params'
import { xOfHz, type Box } from '../components/display-kit'
import {
  MODULATION_FACES,
  chorusSwingMs,
  chorusVoiceMs,
  flangerDb,
  flangerDelayMs,
  mixedDb,
  phaserCoefficient,
  phaserDb,
  rotaryGain,
  rotarySwing,
  sweepWave,
} from '../components/displays/modulation'
import { drawDisplay, runDisplay, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const wrap = (cycles: number): number => cycles - Math.floor(cycles)

type Specs = Readonly<Record<string, ParamSpec>>

function set(device: WasmDeviceHarness, specs: Specs, values: Readonly<Record<string, number>>) {
  for (const [name, value] of Object.entries(values)) device.set(specs[name], value)
}

function meter(device: WasmDeviceHarness, index: number): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(index)
}

/** What a device answers to one click, on its left side. */
async function impulseResponse(
  id: string,
  specs: Specs,
  values: Readonly<Record<string, number>>,
  length = 16384,
): Promise<Float32Array> {
  const device = await loadWasmDevice(id, RATE)
  set(device, specs, values)
  const out = new Float32Array(length)
  const block = new Float32Array(128)
  for (let done = 0; done < length; done += 128) {
    block[0] = done === 0 ? 0.5 : 0
    device.processBlock(block)
    out.set(device.view(device.device.device_out_left(), 128), done)
  }
  return out.map((sample) => sample * 2)
}

/** What a response does to one frequency, in dB. */
function responseDb(response: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  const w = (hz * TWO_PI) / RATE
  for (let n = 0; n < response.length; n++) {
    re += response[n] * Math.cos(w * n)
    im -= response[n] * Math.sin(w * n)
  }
  return 10 * Math.log10(Math.max(1e-12, re * re + im * im))
}

/** A model agrees with the device: to half a dB where there is sound, and both far down in a notch. */
function expectSameDb(model: number, device: number, what: string): void {
  if (model < -30) expect(device, what).toBeLessThan(-26)
  else expect(Math.abs(model - device), `${what}: ${model} against ${device}`).toBeLessThan(0.5)
}

/** A hiss that keeps a device awake, the same every time. */
function hiss(block: Float32Array, seed: number): void {
  let s = seed >>> 0
  for (let i = 0; i < block.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    block[i] = (s / 4294967296 - 0.5) * 0.2
  }
}

/** The dots a drawing has: every whole circle, with its radius. */
function dots(drawn: RecordingContext): { x: number; y: number; r: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'arc' && call.args[3] === 0 && call.args[4] === TWO_PI)
    .map((call) => ({
      x: call.args[0] as number,
      y: call.args[1] as number,
      r: call.args[2] as number,
    }))
}

/** Every point a drawing's lines pass through. */
function points(drawn: RecordingContext): { x: number; y: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'lineTo' || call.name === 'moveTo')
    .map((call) => ({ x: call.args[0] as number, y: call.args[1] as number }))
}

const chorus = MODULATION_FACES.chorus.display
const flanger = MODULATION_FACES.flanger.display
const phaser = MODULATION_FACES.phaser.display
const rotary = MODULATION_FACES.rotary.display

/** Where a swept display draws its response on a plate at rest: 128 by 100, the bar under it at 92.5. */
const PLOT: Box = { x: 4, y: 4, w: 120, h: 83 }
const RAIL = 92.5

describe('the Chorus display', () => {
  it('swings each voice as far as the device does', () => {
    expect(chorusSwingMs(50, 12)).toBeCloseTo(2.5, 9)
    // Under 6 ms of Delay the swing stops a millisecond short of nothing.
    expect(chorusSwingMs(100, 5)).toBeCloseTo(4, 9)
    expect(chorusSwingMs(100, 30)).toBeCloseTo(5, 9)
    // Two voices are opposite; three stand a third of a cycle apart and sum to nothing.
    for (const phase of [0, 0.13, 0.5, 0.77]) {
      expect(chorusVoiceMs(phase, 0, 2, 3) + chorusVoiceMs(phase, 1, 2, 3)).toBeCloseTo(0, 9)
      const three = [0, 1, 2].map((voice) => chorusVoiceMs(phase, voice, 3, 3))
      expect(three[0] + three[1] + three[2]).toBeCloseTo(0, 9)
    }
    // Full Spread puts the right side a quarter of a cycle on.
    expect(chorusVoiceMs(0, 0, 2, 3, 0.25)).toBeCloseTo(3, 9)
  })

  it.each([
    ['two voices', 0, 2],
    ['three voices', 1, 3],
  ])(
    'reads where the device reads, from the phase it reports: %s',
    async (_name, choice, voices) => {
      const device = await loadWasmDevice('chorus', RATE)
      set(device, CHORUS_PARAMS, {
        voices: choice,
        rate: 10,
        depth: 50,
        delayMs: 12,
        spread: 0,
        feedback: 0,
        mix: 1,
      })
      // The LFO runs while the device sleeps: a hundredth of a second at 10 Hz is a tenth of a cycle.
      const silence = new Float32Array(120)
      for (let i = 0; i < 4; i++) device.processBlock(silence)
      set(device, CHORUS_PARAMS, { rate: 0.01 })
      const phase = meter(device, 0)
      expect(phase).toBeCloseTo(0.1, 3)
      // One click: each voice answers it once, as late as its read point.
      const out = new Float32Array(1024)
      const block = new Float32Array(128)
      for (let done = 0; done < out.length; done += 128) {
        block[0] = done === 0 ? 0.5 : 0
        device.processBlock(block)
        out.set(device.view(device.device.device_out_left(), 128), done)
      }
      const expected = Array.from({ length: voices }, (_, voice) =>
        Math.round(
          ((12 + chorusVoiceMs(phase, voice, voices, chorusSwingMs(50, 12))) * RATE) / 1000,
        ),
      )
      for (const at of expected) {
        let loudest = 0
        for (let n = 1; n < out.length; n++) {
          if (Math.abs(n - at) > 8) continue
          if (Math.abs(out[n]) > Math.abs(out[loudest]) || loudest === 0) loudest = n
        }
        expect(Math.abs(loudest - at), `a voice answers at sample ${at}`).toBeLessThanOrEqual(1)
        expect(Math.abs(out[loudest])).toBeGreaterThan(0.1)
      }
    },
  )

  it('draws every voice at now where the formula has it, at the phase the device reports', () => {
    const middle = 24
    const perMs = 19 / 5
    const nowX = 4 + (176 - 30) * 0.7
    // At rest the LFO stands at the start of its cycle.
    const atRest = dots(drawDisplay(chorus, CHORUS_PARAMS, { meters: { phase: 0 } }))
    const left = atRest.filter((dot) => dot.r === 2.5)
    expect(left.length).toBe(3)
    for (const dot of left) expect(dot.x).toBeCloseTo(nowX, 6)
    left.forEach((dot, voice) =>
      expect(dot.y).toBeCloseTo(middle - chorusVoiceMs(0, voice, 3, 2.5) * perMs, 6),
    )
    // The right side, Spread 70 %: 0.175 of a cycle on.
    const right = atRest.filter((dot) => dot.r === 1.5)
    expect(right.length).toBe(3)
    right.forEach((dot, voice) =>
      expect(dot.y).toBeCloseTo(middle - chorusVoiceMs(0, voice, 3, 2.5, 0.175) * perMs, 6),
    )
    // Running, the device says a quarter of a cycle: the first voice is at the top of its swing.
    const running = dots(
      runDisplay(chorus, CHORUS_PARAMS, 2 / 60, {
        values: { voices: 0, spread: 0 },
        meters: { phase: 0.25 },
      }),
    ).filter((dot) => dot.r === 2.5)
    expect(running.map((dot) => dot.y)).toEqual([
      expect.closeTo(middle - 2.5 * perMs, 6),
      expect.closeTo(middle + 2.5 * perMs, 6),
    ])
  })

  it('carries the phase forward between two readings at the Rate', () => {
    // The same reading for three frames at 60 a second, Rate 3 Hz: a tenth of a cycle has passed.
    const drawn = runDisplay(chorus, CHORUS_PARAMS, 4 / 60, {
      values: { voices: 0, spread: 0, rate: 3 },
      meters: { phase: 0.25 },
    })
    const [first] = dots(drawn).filter((dot) => dot.r === 2.5)
    expect(first.y).toBeCloseTo(24 - chorusVoiceMs(0.25 + 2 * (3 / 60), 0, 2, 2.5) * (19 / 5), 4)
  })
})

describe('the sweep shapes of the Flanger and the Phaser', () => {
  it('are the ones `mod_lfo.h` computes', () => {
    expect(sweepWave(0, 0.25)).toBeCloseTo(1, 9)
    expect(sweepWave(0, 0.75)).toBeCloseTo(-1, 9)
    expect(sweepWave(1, 0)).toBe(-1)
    expect(sweepWave(1, 0.5)).toBe(1)
    expect(sweepWave(1, 0.75)).toBe(0)
    expect(sweepWave(2, 0.75)).toBe(0.5)
    expect(sweepWave(3, 0.75)).toBe(-0.5)
    expect(sweepWave(4, 0.25)).toBe(1)
    expect(sweepWave(4, 0.75)).toBe(-1)
    // Random is the device's own: no formula follows it.
    expect(sweepWave(5, 0.3)).toBe(0)
    // A phase past the end of the cycle is the same place in the next one.
    expect(sweepWave(2, 1.75)).toBe(0.5)
  })

  it('mix a dry signal with a turned one as the devices do', () => {
    // Half and half, no feedback: in phase is untouched, half a turn is nothing.
    expect(mixedDb(0, 0, 0, 0.5)).toBeCloseTo(0, 9)
    expect(mixedDb(Math.PI, Math.PI, 0, 0.5)).toBeLessThan(-100)
    // A quarter wet leaves half: 6 dB down.
    expect(mixedDb(Math.PI, Math.PI, 0, 0.25)).toBeCloseTo(-6.02, 2)
    // Feedback 50 % doubles the wet where the loop is in phase: 0.5 + 0.5 · 2.
    expect(mixedDb(0, 0, 0.5, 0.5)).toBeCloseTo(20 * Math.log10(1.5), 6)
    // Negative feedback lifts the half turn instead: |0.5 − 0.5 · 2|... the wet alone is 1 / (1 − 0.5).
    expect(mixedDb(Math.PI, Math.PI, -0.5, 1)).toBeCloseTo(20 * Math.log10(2), 6)
  })
})

describe('the Flanger display', () => {
  it('has its notches at odd multiples of half the reciprocal of the delay', () => {
    // 2.5 ms: 200 Hz, 600 Hz, 1 kHz, with the peaks half way between.
    for (const hz of [200, 600, 1000, 1400])
      expect(flangerDb(hz, 2.5, 0, 0.5, RATE)).toBeLessThan(-60)
    for (const hz of [400, 800, 1200]) expect(flangerDb(hz, 2.5, 0, 0.5, RATE)).toBeCloseTo(0, 6)
    // A quarter wet: the notch is 6 dB.
    expect(flangerDb(200, 2.5, 0, 0.25, RATE)).toBeCloseTo(-6.02, 2)
    // Twice the delay, half the frequency.
    expect(flangerDb(100, 5, 0, 0.5, RATE)).toBeLessThan(-60)
  })

  it('sharpens with feedback, and turns over with its sign', () => {
    // Positive feedback lifts the multiples of 1 / delay, where the loop (a
    // sample longer than the delay) comes round in phase: 0.5 + 0.5 / (1 − 0.7).
    const peak = RATE / 121
    expect(flangerDb(peak, 2.5, 0.7, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.5 + 0.5 / 0.3), 1)
    // The notch stays between them, filled in a little: 0.5 − 0.5 / (1 + 0.7).
    expect(flangerDb(200, 2.5, 0.7, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.5 - 0.5 / 1.7), 0)
    // Negative feedback puts the peaks on the odd half multiples, where the
    // notches were (0.5 − 0.5 / (1 − 0.7) there), and takes from the multiples.
    expect(flangerDb(peak / 2, 2.5, -0.7, 0.5, RATE)).toBeCloseTo(
      20 * Math.log10(0.5 / 0.3 - 0.5),
      1,
    )
    expect(flangerDb(peak, 2.5, -0.7, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.5 + 0.5 / 1.7), 1)
    // Wet only, the peaks are the loop's own resonance: 1 / (1 − 0.9) is 20 dB.
    expect(flangerDb(peak, 2.5, 0.9, 1, RATE)).toBeCloseTo(20, 1)
  })

  it.each([
    ['no feedback', 0, 0.5],
    ['feedback 70 %', 70, 0.5],
    ['feedback −70 %', -70, 0.5],
    ['wet only, feedback 50 %', 50, 1],
    ['a quarter wet', 30, 0.25],
  ])('is the response of the device: %s', async (_name, feedback, mix) => {
    const response = await impulseResponse('flanger', FLANGER_PARAMS, {
      delayMs: 2.5,
      depth: 0,
      feedback,
      mix,
    })
    for (const hz of [50, 100, 200, 300, 400, 600, 1000, 3170, 5000, 10850, 15000]) {
      expectSameDb(
        flangerDb(hz, 2.5, feedback / 100, mix, RATE),
        responseDb(response, hz),
        `${hz} Hz`,
      )
    }
  })

  it('follows the delay the device reads at, for every shape', async () => {
    for (const shape of [0, 1, 2, 3, 4]) {
      const device = await loadWasmDevice('flanger', RATE)
      set(device, FLANGER_PARAMS, { delayMs: 2.5, depth: 50, rate: 1, shape, stereo: 90 })
      // Asleep the sweep keeps its place in the cycle.
      const block = new Float32Array(128)
      for (let i = 0; i < 123; i++) device.processBlock(block)
      const phase = meter(device, 0)
      expect(phase).toBeCloseTo(wrap((123 * 128) / RATE), 3)
      expect(meter(device, 1)).toBeCloseTo(
        flangerDelayMs(2.5, 50, sweepWave(shape, phase), RATE),
        3,
      )
      expect(meter(device, 2)).toBeCloseTo(
        flangerDelayMs(2.5, 50, sweepWave(shape, phase + 0.25), RATE),
        3,
      )
      // Awake, a 3 ms lag stands between the shape and the read point: nothing to a sine or a triangle.
      if (shape > 1) continue
      for (let i = 0; i < 40; i++) {
        hiss(block, i + 1)
        device.processBlock(block)
      }
      const awake = meter(device, 0)
      expect(
        Math.abs(meter(device, 1) - flangerDelayMs(2.5, 50, sweepWave(shape, awake), RATE)),
      ).toBeLessThan(0.03)
    }
  })

  it('never reads nearer than two samples', () => {
    expect(flangerDelayMs(0.5, 100, -1, RATE)).toBeCloseTo(2000 / RATE, 9)
    expect(flangerDelayMs(2.5, 50, 1, RATE)).toBeCloseTo(2.5 * 1.475, 9)
  })

  it('draws the comb where the delay is: the first notch a third of the way across at 2.5 ms', () => {
    const drawn = drawDisplay(flanger, FLANGER_PARAMS, { values: { feedback: 0 } })
    for (const hz of [200, 600, 1000]) {
      const x = xOfHz(hz, PLOT)
      const deepest = Math.max(
        ...points(drawn)
          .filter((point) => Math.abs(point.x - x) < 0.3)
          .map((point) => point.y),
      )
      expect(deepest, `the notch at ${hz} Hz runs off the foot`).toBeGreaterThan(PLOT.y + PLOT.h)
    }
    // Half way between two notches the line is where nothing is changed.
    const zero = PLOT.y + (24 / 60) * PLOT.h
    const between = points(drawn).filter((point) => Math.abs(point.x - xOfHz(400, PLOT)) < 0.6)
    expect(Math.min(...between.map((point) => Math.abs(point.y - zero)))).toBeLessThan(0.5)
  })

  it('stands where the device says its delay is, not where a clock of its own would have it', () => {
    const drawn = runDisplay(flanger, FLANGER_PARAMS, 2 / 30, {
      values: { feedback: 0, stereo: 0 },
      meters: { phase: 0, left: 5, right: 5 },
    })
    // The dot on the bar is the first notch: 100 Hz at 5 ms.
    const [now] = dots(drawn).filter((dot) => dot.r === 2.75)
    expect(now.x).toBeCloseTo(xOfHz(100, PLOT), 6)
    expect(now.y).toBe(RAIL)
    const deepest = Math.max(
      ...points(drawn)
        .filter((point) => Math.abs(point.x - xOfHz(100, PLOT)) < 0.3)
        .map((point) => point.y),
    )
    expect(deepest).toBeGreaterThan(PLOT.y + PLOT.h)
  })

  it('carries a reading forward by the shape until the next one arrives', () => {
    const at = (phase: number): number => flangerDelayMs(2.5, 50, sweepWave(0, phase), RATE)
    // The same reading for two more frames at Rate 1 Hz: the sweep is two thirtieths of a cycle on.
    const drawn = runDisplay(flanger, FLANGER_PARAMS, 4 / 30, {
      values: { rate: 1, stereo: 0 },
      meters: { phase: 0.1, left: at(0.1), right: at(0.1) },
    })
    const [now] = dots(drawn).filter((dot) => dot.r === 2.75)
    expect(now.x).toBeCloseTo(xOfHz(500 / at(0.1 + 2 / 30), PLOT), 4)
    // Random has no shape to carry it: the reading stands.
    const random = runDisplay(flanger, FLANGER_PARAMS, 4 / 30, {
      values: { rate: 1, stereo: 0, shape: 5 },
      meters: { phase: 0.1, left: 3.1, right: 3.1 },
    })
    expect(dots(random).find((dot) => dot.r === 2.75)?.x).toBeCloseTo(xOfHz(500 / 3.1, PLOT), 6)
  })

  it('has a point that is Delay across and Feedback up and down', () => {
    const view = {
      width: 128,
      height: 100,
      at: () => 0,
      value: (name: string) => FLANGER_PARAMS[name as keyof typeof FLANGER_PARAMS].default,
      spec: (name: string) => FLANGER_PARAMS[name as keyof typeof FLANGER_PARAMS],
    }
    const [point] = flanger.handles?.(view) ?? []
    // 2.5 ms: on the first notch, 200 Hz. 30 % of feedback: above the line where nothing is changed.
    expect(point.x).toBeCloseTo(xOfHz(200, PLOT), 6)
    expect(point.y).toBeLessThan(PLOT.y + (24 / 60) * PLOT.h)
    // To 100 Hz and onto the line: 5 ms, no feedback.
    const moved = point.drag(xOfHz(100, PLOT), PLOT.y + (24 / 60) * PLOT.h)
    expect(moved.delayMs).toBeCloseTo(5, 6)
    expect(moved.feedback).toBeCloseTo(0, 6)
  })
})

describe('the Phaser display', () => {
  it('tunes a stage as the device does', () => {
    for (const hz of [20, 100, 800, 5000, 12000]) {
      const t = Math.tan((Math.PI * hz) / RATE)
      expect(phaserCoefficient(hz, RATE)).toBeCloseTo((t - 1) / (t + 1), 3)
    }
    // Clamped at 10 Hz and at 0.45 of the sample rate, as in the device.
    expect(phaserCoefficient(1, RATE)).toBe(phaserCoefficient(10, RATE))
    expect(phaserCoefficient(23000, RATE)).toBe(phaserCoefficient(21600, RATE))
  })

  it('has a notch for every two stages, where the stages turn the sound half way round', () => {
    // Four stages on one frequency f: notches at f · tan(π/8) and f · tan(3π/8), before warping.
    const t = Math.tan((Math.PI * 800) / RATE)
    for (const part of [Math.tan(Math.PI / 8), Math.tan((3 * Math.PI) / 8)]) {
      const hz = (RATE / Math.PI) * Math.atan(t * part)
      expect(phaserDb(hz, 800, 4, 0, 0, 0.5, RATE)).toBeLessThan(-45)
    }
    expect(phaserDb(800 * Math.tan(Math.PI / 8), 800, 4, 0, 0, 0.5, RATE)).toBeLessThan(-30)
    // As many notches as half the stages, whatever Spread does.
    for (const stages of [4, 6, 8, 10, 12]) {
      for (const spread of [0, 0.3, 1]) {
        let notches = 0
        let before = 0
        let falling = false
        for (let step = 0; step <= 6000; step++) {
          const db = phaserDb(20 * Math.pow(1000, step / 6000), 800, stages, spread, 0, 0.5, RATE)
          if (db > before && falling && before < -25) notches += 1
          falling = db < before
          before = db
        }
        expect(notches, `${stages} stages, spread ${spread}`).toBe(stages / 2)
      }
    }
  })

  it('lifts with feedback what the chain leaves in phase, and with negative feedback the notches', () => {
    // At the foot of the spectrum the chain turns nothing: 0.5 + 0.5 / (1 − 0.6).
    expect(phaserDb(20, 2000, 6, 0, 0.6, 0.5, RATE)).toBeCloseTo(20 * Math.log10(1.75), 0)
    const t = Math.tan((Math.PI * 800) / RATE)
    const notch = (RATE / Math.PI) * Math.atan(t * Math.tan(Math.PI / 8))
    // In the notch the chain is half a turn round: 0.5 − 0.5 / (1 + 0.6) with
    // feedback, 0.5 − 0.5 / (1 − 0.6) against it, and at −90 % a peak of some
    // 13 dB where the notch was (a little under: the loop is a sample longer).
    expect(phaserDb(notch, 800, 4, 0, 0.6, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.1875), 0)
    expect(phaserDb(notch, 800, 4, 0, -0.6, 0.5, RATE)).toBeCloseTo(20 * Math.log10(0.75), 0)
    expect(phaserDb(notch, 800, 4, 0, -0.9, 0.5, RATE)).toBeGreaterThan(12)
  })

  it.each([
    ['its defaults', { stages: 1, spread: 30, feedback: 40, mix: 0.5 }, 6],
    ['four stages alike, no feedback', { stages: 0, spread: 0, feedback: 0, mix: 0.5 }, 4],
    [
      'twelve stages spread wide, negative feedback',
      { stages: 4, spread: 100, feedback: -60, mix: 0.5 },
      12,
    ],
    ['eight stages, wet only', { stages: 2, spread: 50, feedback: 80, mix: 1 }, 8],
  ])('is the response of the device: %s', async (_name, values, count) => {
    const response = await impulseResponse('phaser', PHASER_PARAMS, {
      ...values,
      centerHz: 800,
      depth: 0,
    })
    for (const hz of [30, 100, 250, 331, 500, 800, 1200, 1931, 3000, 6000, 12000, 18000]) {
      expectSameDb(
        phaserDb(hz, 800, count, values.spread / 100, values.feedback / 100, values.mix, RATE),
        responseDb(response, hz),
        `${hz} Hz`,
      )
    }
  })

  it('follows the frequency the device is swept to, for every shape', async () => {
    for (const shape of [0, 1, 2, 3, 4]) {
      const device = await loadWasmDevice('phaser', RATE)
      set(device, PHASER_PARAMS, { centerHz: 800, depth: 60, rate: 1, shape, stereo: 90 })
      const block = new Float32Array(128)
      for (let i = 0; i < 123; i++) device.processBlock(block)
      const phase = meter(device, 0)
      const swept = (at: number): number => 800 * Math.pow(2, sweepWave(shape, at) * 0.6 * 2.5)
      expect(meter(device, 1) / swept(phase)).toBeCloseTo(1, 3)
      expect(meter(device, 2) / swept(phase + 0.25)).toBeCloseTo(1, 3)
      if (shape > 1) continue
      for (let i = 0; i < 40; i++) {
        hiss(block, i + 1)
        device.processBlock(block)
      }
      expect(meter(device, 1) / swept(meter(device, 0))).toBeCloseTo(1, 1)
    }
  })

  it('draws the notches where the chain has them', () => {
    const drawn = drawDisplay(phaser, PHASER_PARAMS, {
      values: { stages: 0, spread: 0, feedback: 0 },
    })
    const t = Math.tan((Math.PI * 800) / RATE)
    for (const part of [Math.tan(Math.PI / 8), Math.tan((3 * Math.PI) / 8)]) {
      const x = xOfHz((RATE / Math.PI) * Math.atan(t * part), PLOT)
      const deepest = Math.max(
        ...points(drawn)
          .filter((point) => Math.abs(point.x - x) < 0.4)
          .map((point) => point.y),
      )
      expect(deepest).toBeGreaterThan(PLOT.y + PLOT.h)
    }
  })

  it('stands where the device says its sweep is, and carries it forward by the shape', () => {
    const drawn = runDisplay(phaser, PHASER_PARAMS, 2 / 30, {
      values: { stereo: 0 },
      meters: { phase: 0, left: 1600, right: 1600 },
    })
    const [now] = dots(drawn).filter((dot) => dot.r === 2.75)
    expect(now.x).toBeCloseTo(xOfHz(1600, PLOT), 6)
    expect(now.y).toBe(RAIL)
    const swept = (at: number): number => 800 * Math.pow(2, sweepWave(1, at) * 0.6 * 2.5)
    const later = runDisplay(phaser, PHASER_PARAMS, 4 / 30, {
      values: { stereo: 0, shape: 1, rate: 1 },
      meters: { phase: 0.3, left: swept(0.3), right: swept(0.3) },
    })
    expect(dots(later).find((dot) => dot.r === 2.75)?.x).toBeCloseTo(
      xOfHz(swept(0.3 + 2 / 30), PLOT),
      4,
    )
  })

  it('shows the range of the sweep: Depth 100 % is two and a half octaves each way', () => {
    const drawn = drawDisplay(phaser, PHASER_PARAMS, { values: { depth: 100, centerHz: 800 } })
    const ends = points(drawn).filter((point) => point.y === RAIL - 2.5 || point.y === RAIL + 2.5)
    const xs = [...new Set(ends.map((point) => point.x))].sort((a, b) => a - b)
    expect(xs.length).toBe(2)
    expect(Math.abs(xs[0] - xOfHz(800 / Math.pow(2, 2.5), PLOT))).toBeLessThanOrEqual(1)
    expect(Math.abs(xs[1] - xOfHz(800 * Math.pow(2, 2.5), PLOT))).toBeLessThanOrEqual(1)
  })
})

describe('the Rotary display', () => {
  it('swings a microphone as the device does', () => {
    // Horn Depth 0.6 at Distance 0.3: 0.6 · 0.75 · (1 − 0.18).
    const swing = rotarySwing('horn', 0.6, 0.3)
    expect(swing).toBeCloseTo(0.369, 6)
    expect(rotarySwing('drum', 0.5, 0.3)).toBeCloseTo(0.5 * 0.5 * 0.85, 9)
    // Facing the microphone it is the make-up alone, facing away 1 − swing of it.
    const makeup = 1 / Math.sqrt((1 - swing / 2) ** 2 + 0.125 * swing * swing)
    expect(makeup).toBeCloseTo(1.2109, 3)
    expect(rotaryGain('horn', 0, -1, swing, 0)).toBeCloseTo(makeup, 9)
    expect(rotaryGain('horn', 0.5, -1, swing, 0)).toBeCloseTo(makeup * (1 - swing), 9)
    // The make-up keeps the mean power of a whole turn where it was.
    let power = 0
    for (let step = 0; step < 360; step++)
      power += rotaryGain('horn', step / 360, 1, swing, 0.7) ** 2
    expect(power / 360).toBeCloseTo(1, 6)
  })

  it('has the microphones where the device has them', () => {
    // Full Spread: a fifth of a turn either side for the horn, half as far for the drum; the left is the lower angle.
    expect(rotaryGain('horn', -0.2, -1, 0.5, 1)).toBeCloseTo(rotaryGain('horn', 0, -1, 0.5, 0), 9)
    expect(rotaryGain('horn', 0.2, 1, 0.5, 1)).toBeCloseTo(rotaryGain('horn', 0, -1, 0.5, 0), 9)
    expect(rotaryGain('drum', -0.1, -1, 0.5, 1)).toBeCloseTo(rotaryGain('drum', 0, -1, 0.5, 0), 9)
    expect(rotaryGain('drum', 0.1, 1, 0.5, 1)).toBeCloseTo(rotaryGain('drum', 0, -1, 0.5, 0), 9)
  })

  /** Play a tone through the cabinet and keep, for each cycle of it, how loud each side was and where a rotor pointed. */
  async function turn(
    values: Readonly<Record<string, number>>,
    hz: number,
    seconds: number,
    angle: 0 | 1,
  ): Promise<{ device: WasmDeviceHarness; left: number[]; right: number[]; angles: number[] }> {
    const device = await loadWasmDevice('rotary', RATE)
    set(device, ROTARY_PARAMS, { drive: 0, mix: 1, ...values })
    // A block is a whole number of cycles of the tone, so its level is the same wherever it starts.
    const frames = 960
    const block = new Float32Array(frames)
    const left: number[] = []
    const right: number[] = []
    const angles: number[] = []
    for (let done = 0; done < seconds * RATE; done += frames) {
      for (let i = 0; i < frames; i++) block[i] = 0.25 * Math.sin(((done + i) * hz * TWO_PI) / RATE)
      device.processBlock(block)
      const rms = (pointer: number): number =>
        Math.sqrt(device.view(pointer, frames).reduce((sum, s) => sum + s * s, 0) / frames)
      left.push(rms(device.device.device_out_left()))
      right.push(rms(device.device.device_out_right()))
      // The reading is of the end of the block; its level is of the middle.
      angles.push(meter(device, angle))
    }
    return { device, left, right, angles }
  }

  it('gives the drum the level the device gives it, at the angle the device reports', async () => {
    const { left, right, angles } = await turn(
      { speed: 0, balance: 0, drumDepth: 1, distance: 0, spread: 1 },
      150,
      3.5,
      1,
    )
    const swing = rotarySwing('drum', 1, 0)
    const loudest = Math.max(...left.slice(25))
    const facing = rotaryGain('drum', 0, -1, swing, 0)
    // Half a block on from the middle of the block the drum has turned back by 0.67 Hz · 10 ms.
    const middle = 0.67 * (480 / RATE)
    for (let i = 25; i < left.length; i++) {
      const at = angles[i] + middle
      expect(left[i] / loudest).toBeCloseTo(rotaryGain('drum', at, -1, swing, 1) / facing, 1)
      expect(right[i] / loudest).toBeCloseTo(rotaryGain('drum', at, 1, swing, 1) / facing, 1)
    }
    // It swings the whole way the formula says: down to half at full Depth, close up.
    expect(Math.min(...left.slice(25)) / loudest).toBeCloseTo(0.5, 1)
  })

  it('has the horn loudest at each microphone when the device points it there', async () => {
    const { left, right, angles } = await turn(
      { speed: 0, balance: 1, hornDepth: 1, distance: 0, spread: 1 },
      3000,
      3.5,
      0,
    )
    const loudestAt = (levels: number[]): number => {
      let best = 25
      for (let i = 25; i < levels.length; i++) if (levels[i] > levels[best]) best = i
      // Back to the middle of the block: the horn's angle rises.
      return wrap(angles[best] - 0.8 * (480 / RATE))
    }
    const off = (a: number, b: number): number => Math.abs(wrap(a - b + 0.5) - 0.5)
    expect(off(loudestAt(left), -0.2)).toBeLessThan(0.02)
    expect(off(loudestAt(right), 0.2)).toBeLessThan(0.02)
  })

  it('reports the speeds the display takes for Slow and Fast, the horn rising and the drum falling', async () => {
    const slow = await turn({ speed: 0 }, 440, 1, 0)
    expect(meter(slow.device, 2)).toBeCloseTo(0.8, 5)
    expect(meter(slow.device, 3)).toBeCloseTo(0.67, 5)
    const step = (angles: number[], i: number): number =>
      wrap(angles[i] - angles[i - 1] + 0.5) - 0.5
    expect(step(slow.angles, 20)).toBeCloseTo(0.8 * (960 / RATE), 4)
    const drum = await turn({ speed: 0 }, 440, 1, 1)
    expect(step(drum.angles, 20)).toBeCloseTo(-0.67 * (960 / RATE), 4)
    const fast = await turn({ speed: 1, acceleration: 4 }, 440, 4, 0)
    expect(meter(fast.device, 2)).toBeCloseTo(6.7, 2)
    expect(meter(fast.device, 3)).toBeCloseTo(5.8, 2)
  })

  interface Kept {
    horn: { turn: number }
    drum: { turn: number }
  }

  /** The readings of a cabinet turning steadily, as they arrive: thirty times a second. */
  const turning =
    (horn: number, drum: number) =>
    (time: number): { meters: Record<string, number> } => {
      const heard = Math.floor(time * 30) / 30
      return {
        meters: {
          hornAngle: wrap(0.2 + horn * heard),
          drumAngle: wrap(0.37 - drum * heard),
          hornSpeed: horn,
          drumSpeed: drum,
        },
      }
    }

  it('says at rest what the rotors would do at the Speed it is set to', () => {
    expect(drawDisplay(rotary, ROTARY_PARAMS).words()).toEqual(['HORN  0.8 Hz', 'DRUM  0.7 Hz'])
    expect(drawDisplay(rotary, ROTARY_PARAMS, { values: { speed: 1 } }).words()).toEqual([
      'HORN  6.7 Hz',
      'DRUM  5.8 Hz',
    ])
    expect(drawDisplay(rotary, ROTARY_PARAMS, { values: { speed: 2 } }).words()).toEqual([
      'HORN  0.0 Hz',
      'DRUM  0.0 Hz',
    ])
  })

  it('turns each rotor with the device, a fast one never backwards', () => {
    const state = rotary.init?.() as Kept
    // Fast: the horn turns 0.22 of a turn between two readings.
    runDisplay(rotary, ROTARY_PARAMS, 2, { values: { speed: 1 }, state }, turning(6.7, 5.8))
    const seen = 2 - 1 / 60
    expect(Math.abs(state.horn.turn - (0.2 + 6.7 * seen))).toBeLessThan(0.3)
    expect(Math.abs(state.drum.turn - (0.37 - 5.8 * seen))).toBeLessThan(0.3)
  })

  it('marks at each microphone the level the formula gives for where the rotor points', () => {
    const state = rotary.init?.() as Kept
    const drawn = runDisplay(rotary, ROTARY_PARAMS, 1, { state }, turning(0.8, 0.67))
    // A rotor's scope on a plate at rest: 44 high, its foot the level of nothing and 1.5 two under its top.
    const level = (row: 0 | 1, gain: number): number => 4 + row * 48 + 44 - (gain / 1.5) * 42
    // Where a rotor points is where the device last said, carried on to the frame.
    const off = (a: number, b: number): number => Math.abs(wrap(a - b + 0.5) - 0.5)
    expect(off(state.horn.turn, 0.2 + 0.8 * (1 - 1 / 60))).toBeLessThan(0.04)
    expect(off(state.drum.turn, 0.37 - 0.67 * (1 - 1 / 60))).toBeLessThan(0.04)
    const marks = dots(drawn).filter((dot) => dot.r === 2.5)
    expect(marks.length).toBe(2)
    expect(marks[0].y).toBeCloseTo(
      level(0, rotaryGain('horn', state.horn.turn, -1, rotarySwing('horn', 0.6, 0.3), 0.7)),
      6,
    )
    expect(marks[1].y).toBeCloseTo(
      level(1, rotaryGain('drum', state.drum.turn, -1, rotarySwing('drum', 0.5, 0.3), 0.7)),
      6,
    )
    // No rotor is on its way to another speed: no arrow, only the horn and the drum's scoop are filled shapes.
    expect(drawn.calls.filter((call) => call.name === 'closePath').length).toBe(2)
  })

  it('shows a rotor on its way to another speed', () => {
    // Set to Fast, and the device says the rotors are not there yet.
    const drawn = runDisplay(rotary, ROTARY_PARAMS, 0.5, { values: { speed: 1 } }, turning(3, 1.2))
    expect(drawn.words()).toEqual(['HORN  3.0 Hz', 'DRUM  1.2 Hz'])
    expect(drawn.calls.filter((call) => call.name === 'closePath').length).toBe(4)
  })

  it('is at rest while the rotors stand: the device turns them only while it has sound', () => {
    const state = rotary.init?.() as Kept
    const drawn = runDisplay(rotary, ROTARY_PARAMS, 1, {
      values: { speed: 0 },
      state,
      meters: { hornAngle: 0.31, drumAngle: 0.62, hornSpeed: 6.7, drumSpeed: 5.8 },
    })
    // They take up again at the speed they had, and no arrow claims they are changing now.
    expect(drawn.words()).toEqual(['HORN  6.7 Hz', 'DRUM  5.8 Hz'])
    expect(drawn.calls.filter((call) => call.name === 'closePath').length).toBe(2)
    // And they point where the device has them, not where carrying on would have taken them.
    expect(state.horn.turn).toBeCloseTo(0.31, 6)
    expect(state.drum.turn).toBeCloseTo(0.62, 6)
  })
})
