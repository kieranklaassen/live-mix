// The truth of the Pulses display: the arithmetic it is drawn from against
// the compiled device (its sound through a constant and a tone, and the
// readings it reports), and the drawing against that arithmetic: the lanes,
// the bars, the mark for now, the lead and the time, and the points that are
// dragged.

import { describe, expect, it } from 'vitest'

import { PULSES_PARAMS } from '../../dsp/devices/pulses.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  PULSES_FACES,
  PULSES_MOST,
  pulsesComesRound,
  pulsesGate,
  pulsesHeard,
  pulsesHeardHigh,
  pulsesLayout,
  pulsesMakeup,
  pulsesMeanSquare,
  pulsesMeetSeconds,
  pulsesRamp,
  pulsesRounds,
  pulsesSecondPlace,
  pulsesSettings,
  pulsesShape,
  pulsesSounds,
  pulsesTimeText,
  type PulsesSettings,
} from '../components/displays/pulses'
import { type DisplayHandle } from '../components/plate-display'
import { drawDisplay, runDisplay, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const display = PULSES_FACES.pulses.display

// The device's own numbers, copied from `cpp/devices/pulses/pulses.h`.
/** `kMaxDrift`: the second gate is at most an eighth faster. */
const MAX_DRIFT = 0.125
/** `kMinEdgeSeconds`: the hardest edge takes 5 ms. */
const MIN_EDGE_SEC = 0.005
/** `kAccentDrop`: Accent takes up to 0.7 off every step but the first. */
const ACCENT_DROP = 0.7
/** `kMaxMakeup`: the pulsed sound is made up by 4 dB at the most. */
const MAX_MAKEUP = 1.5848932

type Values = Readonly<Record<string, number>>

const settingsOf = (values: Values = {}): PulsesSettings =>
  pulsesSettings(
    (name) => values[name] ?? PULSES_PARAMS[name as keyof typeof PULSES_PARAMS].default,
  )

const wrap = (cycles: number): number => cycles - Math.floor(cycles)

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('pulses', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(PULSES_PARAMS[name as keyof typeof PULSES_PARAMS], value)
  return device
}

/** What the device makes of `seconds` of an input, a sample at a time: its two sides. */
function render(
  device: WasmDeviceHarness,
  seconds: number,
  input: (n: number) => number,
): { left: Float32Array; right: Float32Array } {
  const total = Math.round(seconds * RATE)
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const block = new Float32Array(128)
  for (let done = 0; done < total; done += 128) {
    const frames = Math.min(128, total - done)
    for (let i = 0; i < frames; i++) block[i] = input(done + i)
    device.processBlock(block.subarray(0, frames))
    left.set(device.view(device.device.device_out_left(), frames), done)
    right.set(device.view(device.device.device_out_right(), frames), done)
  }
  return { left, right }
}

function reading(device: WasmDeviceHarness, index: number): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(index)
}

/** What the display's arithmetic says each side lets through after `n` samples from the start. */
function modelAt(n: number, set: PulsesSettings): [number, number] {
  const gone = (n * set.rate) / RATE
  const first = pulsesGate(gone % set.steps, set)
  const second = pulsesGate(pulsesSecondPlace(gone, 0, set), set, true)
  return [pulsesHeard(first, second, set), pulsesHeard(second, first, set)]
}

interface Stroke {
  colour: string
  alpha: number
  width: number
  points: { x: number; y: number }[]
}

/** Every line a drawing strokes, with what it was stroked in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const all: Stroke[] = []
  let path: { x: number; y: number }[] = []
  let colour = ''
  let alpha = 1
  let width = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'set lineWidth') width = call.args[0] as number
    else if (call.name === 'stroke' && path.length > 1)
      all.push({ colour, alpha, width, points: path })
  }
  return all
}

/** How high a line through points stands at `x`. */
function heightAt(points: readonly { x: number; y: number }[], x: number): number {
  if (x <= points[0].x) return points[0].y
  for (let i = 1; i < points.length; i++) {
    const [from, to] = [points[i - 1], points[i]]
    if (x > to.x) continue
    return to.x === from.x ? to.y : from.y + ((to.y - from.y) * (x - from.x)) / (to.x - from.x)
  }
  return points[points.length - 1].y
}

/**
 * How far a line through points is from (x, y): up or down from where the
 * line runs within a third of a pixel either side, so that an edge too steep
 * to say how high it is at one place is held to where it stands.
 */
function apart(points: readonly { x: number; y: number }[], x: number, y: number): number {
  const heights = [heightAt(points, x - 0.34), heightAt(points, x), heightAt(points, x + 0.34)]
  for (const at of points) if (Math.abs(at.x - x) <= 0.34) heights.push(at.y)
  const low = Math.min(...heights)
  const high = Math.max(...heights)
  return y < low ? low - y : y > high ? y - high : 0
}

/** Every whole circle a drawing has, with what it was filled in. */
function dots(drawn: RecordingContext): { x: number; y: number; r: number; colour: string }[] {
  const all: { x: number; y: number; r: number; colour: string }[] = []
  let colour = ''
  let last: { x: number; y: number; r: number } | null = null
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'arc' && call.args[3] === 0 && call.args[4] === TWO_PI)
      last = { x: call.args[0] as number, y: call.args[1] as number, r: call.args[2] as number }
    else if (call.name === 'fill' && last) {
      all.push({ ...last, colour })
      last = null
    }
  }
  return all
}

/** The bars: every rectangle two pixels high filled in the ink, with how strongly. */
function bars(drawn: RecordingContext): { x: number; y: number; w: number; alpha: number }[] {
  const all: { x: number; y: number; w: number; alpha: number }[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fillRect' && colour === PLAIN_COLOURS.ink && call.args[3] === 2)
      all.push({
        x: call.args[0] as number,
        y: call.args[1] as number,
        w: call.args[2] as number,
        alpha,
      })
  }
  return all
}

/** The two lanes' lines: the upper and the lower. */
function laneLines(drawn: RecordingContext): [Stroke, Stroke] {
  const [upper, lower] = strokes(drawn).filter(
    (stroke) => stroke.colour === PLAIN_COLOURS.ink && stroke.width === 1.25,
  )
  return [upper, lower]
}

/** The mark for now: the one upright line in the accent. */
function nowLine(drawn: RecordingContext): number {
  const [line] = strokes(drawn).filter((stroke) => stroke.colour === PLAIN_COLOURS.accent)
  return line.points[0].x
}

function handlesAt(values: Values = {}, size?: { width: number; height: number }) {
  const all = display.handles?.(viewOf(display, PULSES_PARAMS, { values, ...size })) ?? []
  const byKey = (key: string): DisplayHandle => {
    const found = all.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  return { edge: byKey('edge'), end: byKey('length') }
}

describe('the arithmetic of the Pulses display against the device', () => {
  it('spreads the steps that sound as the device does', () => {
    // Worked by hand: (index * fill) % steps < fill.
    const pattern = (fill: number, steps: number): string =>
      Array.from({ length: steps }, (_, index) =>
        pulsesSounds(index, fill, steps) ? 'x' : '.',
      ).join('')
    expect(pattern(3, 8)).toBe('x..x..x.')
    expect(pattern(5, 8)).toBe('x.x.xx.x')
    expect(pattern(2, 5)).toBe('x..x.')
    expect(pattern(7, 16)).toBe('x..x.x.x..x.x.x.')
    expect(pattern(4, 4)).toBe('xxxx')
    // Fill past Steps is all of them, and Shift past Steps comes round.
    const set = settingsOf({ steps: 4, fill: 9, shift: 9 })
    expect([set.steps, set.fill, set.shift]).toEqual([4, 4, 1])
  })

  it('shapes a pulse as the device does: a raised cosine up, a hold, the same down', () => {
    // Length 0.8 of a step with a rise of 0.2: half way up the rise is half open.
    expect(pulsesShape(0, 0.8, 0.2)).toBe(0)
    expect(pulsesShape(0.1, 0.8, 0.2)).toBeCloseTo(0.5, 12)
    expect(pulsesShape(0.05, 0.8, 0.2)).toBeCloseTo(0.5 - 0.5 * Math.cos(Math.PI / 4), 12)
    expect(pulsesShape(0.2, 0.8, 0.2)).toBe(1)
    expect(pulsesShape(0.5, 0.8, 0.2)).toBe(1)
    expect(pulsesShape(0.7, 0.8, 0.2)).toBeCloseTo(0.5, 12)
    expect(pulsesShape(0.8, 0.8, 0.2)).toBe(0)
    expect(pulsesShape(0.95, 0.8, 0.2)).toBe(0)
    // Edge takes the rise from half the pulse to the hardest edge, 5 ms whatever the Rate.
    expect(pulsesRamp(0, 0.8, 0.02)).toBeCloseTo(0.4, 12)
    expect(pulsesRamp(0.5, 0.8, 0.02)).toBeCloseTo(0.2, 12)
    expect(pulsesRamp(1, 0.8, MIN_EDGE_SEC * 4)).toBeCloseTo(0.02, 12)
    // A pulse shorter than two of the hardest edges is all edge.
    expect(pulsesRamp(1, 0.1, MIN_EDGE_SEC * 20 * 2)).toBeCloseTo(0.05, 12)
  })

  it('reads the knobs as the device applies them', () => {
    const set = settingsOf({ drift: 0.5, floor: 0.5, apart: 0.4, accent: 1 })
    expect(set.faster).toBeCloseTo(MAX_DRIFT * 0.125, 12)
    expect(set.floor).toBeCloseTo(0.25, 12)
    expect(set.same).toBeCloseTo(0.7, 12)
    expect(set.others).toBeCloseTo(1 - ACCENT_DROP, 12)
    expect(settingsOf({ drift: 1 }).faster).toBe(MAX_DRIFT)
    expect(settingsOf({ drift: 0 }).faster).toBe(0)
  })

  it('makes the pulsed sound up as the device does: to the level it came in at, by 4 dB at the most', () => {
    expect(PULSES_MOST).toBe(MAX_MAKEUP)
    expect(20 * Math.log10(PULSES_MOST)).toBeCloseTo(4, 5)
    // Worked by hand. Every step of two, all swell, a side each, Floor 0.5 (a
    // quarter left): a pulse's mean is a half and its mean square three
    // eighths, so the gain's mean square is 1/16 + 2 * 1/4 * 3/4 * 1/2 + 9/16 * 3/8.
    const throb = settingsOf({ steps: 2, fill: 2, edge: 0, length: 1, floor: 0.5, accent: 0 })
    expect(pulsesMeanSquare(throb)).toBeCloseTo(1 / 16 + 3 / 16 + 27 / 128, 12)
    expect(throb.makeup).toBeCloseTo(1 / Math.sqrt(59 / 128), 12)
    // One step of four, a hard pulse half a step long, over silence: an eighth
    // of the time open (less a quarter of a 5 ms rise at each end), which is
    // far more than 4 dB to make up.
    const sparse = settingsOf({ steps: 4, fill: 1, edge: 1, length: 0.5, floor: 0, rate: 4 })
    expect(pulsesMeanSquare(sparse)).toBeCloseTo((0.5 - 1.25 * 0.02) / 4, 12)
    expect(sparse.makeup).toBe(MAX_MAKEUP)
    // Floor at full is no gate at all, and nothing is made up.
    expect(settingsOf({ floor: 1 }).makeup).toBeCloseTo(1, 12)
    expect(pulsesMakeup(1)).toBe(1)
    // Both gates in the middle. Locked, they are one gate; drifting, what the
    // two share is the product of their means, so less comes through and more
    // is made up; a step apart with one step of two sounding they never meet.
    const middle = { steps: 2, fill: 1, edge: 0, length: 1, floor: 0.7, accent: 0, apart: 0 }
    const one = pulsesMeanSquare(settingsOf({ ...middle, drift: 0, apart: 1 }))
    expect(pulsesMeanSquare(settingsOf({ ...middle, drift: 0 }))).toBeCloseTo(one, 12)
    const up = 1 - 0.49
    expect(pulsesMeanSquare(settingsOf({ ...middle, drift: 0.5 }))).toBeCloseTo(
      0.49 * 0.49 + 2 * 0.49 * up * 0.25 + up * up * (0.5 * (0.375 / 2) + 0.5 * 0.25 * 0.25),
      12,
    )
    expect(pulsesMeanSquare(settingsOf({ ...middle, drift: 0, shift: 1 }))).toBeCloseTo(
      0.49 * 0.49 + 2 * 0.49 * up * 0.25 + up * up * (0.5 * (0.375 / 2)),
      12,
    )
  })

  it('lets through what the device lets through, a sample at a time, on both sides', async () => {
    const settings: Values[] = [
      {},
      {
        rate: 9,
        steps: 5,
        fill: 3,
        drift: 1,
        shift: 2,
        edge: 0.8,
        length: 0.45,
        floor: 0.3,
        apart: 0.6,
        accent: 0.7,
        mix: 0.8,
      },
      // Every step, the hardest edge, the fastest: the second gate's edge is as long in time.
      { rate: 20, steps: 16, fill: 16, drift: 0.7, edge: 1, length: 1, floor: 0, accent: 0 },
      { rate: 3, steps: 2, fill: 5, shift: 9, drift: 0.9, edge: 0, length: 0.9, apart: 0 },
      // Made up by less than the most: a high Floor; a canon in the middle; and the gates locked.
      { rate: 6, floor: 0.85, drift: 0.8, apart: 0.3 },
      { rate: 5, steps: 8, fill: 4, shift: 1, drift: 0, apart: 0.2, floor: 0.8, accent: 0.5 },
      { rate: 7, steps: 4, fill: 3, drift: 0, edge: 0.6, length: 1, floor: 0.6, mix: 0.6 },
    ]
    for (const values of settings) {
      const device = await deviceAt(values)
      const set = settingsOf(values)
      const { left, right } = render(device, 3, () => 0.5)
      let worst = 0
      // From 10 ms in: Shade's low pass starts empty and takes a few milliseconds to hold a constant.
      for (let n = 480; n < left.length; n++) {
        const [l, r] = modelAt(n, set)
        worst = Math.max(worst, Math.abs(left[n] / 0.5 - l), Math.abs(right[n] / 0.5 - r))
      }
      expect(worst, JSON.stringify(values)).toBeLessThan(0.002)
    }
  })

  it('takes the top of the sound away between pulses by as much as Shade says', async () => {
    // One pulse in two steps, half a second each: open at 0.1 s, closed from 0.5 s.
    const values = {
      rate: 2,
      steps: 2,
      fill: 1,
      drift: 0,
      apart: 0,
      edge: 1,
      length: 0.5,
      floor: 0.5,
      shade: 0.5,
      accent: 0,
    }
    const device = await deviceAt(values)
    const set = settingsOf(values)
    // 12 kHz, far above the 400 Hz the device dulls to: four samples a cycle, so every other one is a crest.
    const { left } = render(device, 1, (n) => 0.5 * Math.sin((TWO_PI * 12000 * n) / RATE))
    const crest = (from: number, to: number): number => {
      let most = 0
      for (let n = Math.round(from * RATE); n < Math.round(to * RATE); n++)
        most = Math.max(most, Math.abs(left[n]))
      return most / 0.5
    }
    // One pulse in two steps over a quarter of the sound is made up by the most.
    expect(set.makeup).toBe(MAX_MAKEUP)
    expect(crest(0.08, 0.2)).toBeCloseTo(pulsesHeardHigh(1, set), 2)
    expect(pulsesHeardHigh(1, set)).toBe(MAX_MAKEUP)
    // A quarter is left of the whole sound and half of that of its top.
    expect(pulsesHeardHigh(0, set)).toBeCloseTo(0.125 * MAX_MAKEUP, 12)
    // (A 30th of the top still comes through the 400 Hz pole at 12 kHz, a quarter turn late.)
    expect(Math.abs(crest(0.6, 0.9) - 0.125 * MAX_MAKEUP)).toBeLessThan(0.01)
    expect(pulsesHeard(0, 0, set)).toBeCloseTo(0.25 * MAX_MAKEUP, 12)
  })

  it('reports where the first gate is and what the second has gained, as the display takes them', async () => {
    const values = { rate: 16, steps: 4, fill: 3, drift: 0.5 }
    const device = await deviceAt(values)
    const set = settingsOf(values)
    // The second gate gains a whole pattern in 16 s: 4 steps at 16 a second, a 64th faster.
    expect(pulsesMeetSeconds(0, set)).toBeCloseTo(16, 9)
    render(device, 4.03, () => 0.5)
    const gone = (Math.round(4.03 * RATE) * set.rate) / RATE
    expect(reading(device, 0)).toBeCloseTo(wrap(gone / set.steps), 4)
    expect(reading(device, 1)).toBeCloseTo((gone * set.faster) / set.steps, 5)
    // From there the display counts what is left of the 16 s.
    expect(pulsesMeetSeconds(reading(device, 1) * set.steps, set)).toBeCloseTo(16 - 4.03, 2)
    // And when that time has gone the two are in the same place: nothing gained.
    render(device, 16 - 4.03, () => 0.5)
    expect(Math.abs(wrap(reading(device, 1) + 0.5) - 0.5)).toBeLessThan(1e-4)
    // With a Shift of one step the second gate starts ahead and has less to gain.
    expect(pulsesMeetSeconds(1, set)).toBeCloseTo(12, 9)
    expect(pulsesMeetSeconds(1, settingsOf({ drift: 0 }))).toBe(Infinity)
  })

  it('knows how far the second gate has to gain for the two sides to sound the same', () => {
    // Accent marks the first step, so only a whole pattern brings the two together.
    expect(pulsesComesRound(settingsOf({ steps: 8, fill: 4 }))).toBe(8)
    expect(pulsesComesRound(settingsOf({ steps: 2, fill: 2, accent: 0.01 }))).toBe(2)
    // With no Accent the pattern itself comes round sooner where Fill and Steps share a divisor.
    expect(pulsesComesRound(settingsOf({ steps: 8, fill: 4, accent: 0 }))).toBe(2)
    expect(pulsesComesRound(settingsOf({ steps: 16, fill: 12, accent: 0 }))).toBe(4)
    expect(pulsesComesRound(settingsOf({ steps: 2, fill: 2, accent: 0 }))).toBe(1)
    expect(pulsesComesRound(settingsOf({ steps: 6, fill: 9, accent: 0 }))).toBe(1)
    expect(pulsesComesRound(settingsOf({ steps: 8, fill: 5, accent: 0 }))).toBe(8)
    expect(pulsesComesRound(settingsOf({ steps: 7, fill: 4, accent: 0 }))).toBe(7)
    // 4 of 8 with no Accent, at 4 steps a second and an eighth faster: two steps are gained in 4 s.
    const even = settingsOf({ steps: 8, fill: 4, accent: 0, drift: 1 })
    expect(pulsesMeetSeconds(0, even)).toBeCloseTo(4, 9)
    expect(pulsesMeetSeconds(1.5, even)).toBeCloseTo(1, 9)
    expect(pulsesMeetSeconds(7, even)).toBeCloseTo(2, 9)
  })

  // What follows is held to the device's sound itself: a constant through the
  // compiled device, and how far apart its two sides are over each round of
  // the pattern. Where that falls to nothing the gates have met.
  async function meetings(
    values: Values,
    seconds: number,
  ): Promise<{ met: number[]; said: { at: number; left: number }[] }> {
    const device = await deviceAt(values)
    const set = settingsOf(values)
    const round = Math.round((set.steps / set.rate) * RATE)
    const hop = 2400
    const block = new Float32Array(128).fill(0.5)
    const total = Math.round(seconds * RATE)
    // The running sum of how far apart the sides are, so any stretch is two readings of it.
    const sums = new Float64Array(Math.floor(total / hop) + 1)
    const said: { at: number; left: number }[] = []
    let sum = 0
    for (let done = 0; done < total; done += 128) {
      if (done % RATE === 0)
        said.push({
          at: done / RATE,
          left: pulsesMeetSeconds(set.shift + reading(device, 1) * set.steps, set),
        })
      device.processBlock(block)
      const left = device.view(device.device.device_out_left(), 128)
      const right = device.view(device.device.device_out_right(), 128)
      for (let i = 0; i < 128; i++) {
        if ((done + i) % hop === 0) sums[(done + i) / hop] = sum
        sum += Math.abs(left[i] - right[i])
      }
    }
    // How far apart over the round about each hop, and where that is least and near nothing.
    const rounds = Math.round(round / hop)
    const apartAt = (n: number): number => (sums[n + rounds] - sums[n]) / (rounds * hop)
    const count = Math.floor(total / hop) - rounds
    let most = 0
    for (let n = 0; n < count; n++) most = Math.max(most, apartAt(n))
    // The gates go on gaining through the round measured over, so the least is
    // not nothing: each stretch under an eighth of the most is one meeting, at its lowest.
    const met: number[] = []
    let least = -1
    for (let n = rounds; n < count; n++) {
      const here = apartAt(n)
      if (here < 0.125 * most) {
        if (least < 0 || here < apartAt(least)) least = n
      } else if (least >= 0) {
        met.push(((least + rounds / 2) * hop) / RATE)
        least = -1
      }
    }
    return { met, said }
  }

  it('counts down to the moment the two sides are the same again, to the second, over ten minutes', async () => {
    // At its defaults: 8 steps at 4 a second, the second gate a 64th faster.
    const { met, said } = await meetings({}, 600)
    expect(met.length).toBe(4)
    met.forEach((at, n) => expect(Math.abs(at - 128 * (n + 1))).toBeLessThan(0.5))
    // Every second of the ten minutes the time written is the time there was left.
    let worst = 0
    for (const { at, left } of said) {
      const next = met.find((time) => time > at + 0.5) ?? 128 * 5
      if (next - at > 1) worst = Math.max(worst, Math.abs(at + left - next))
    }
    expect(worst).toBeLessThan(0.5)
    expect(said[0].left).toBeCloseTo(128, 6)
    expect(pulsesTimeText(said[1].left)).toBe('2:07')
    expect(pulsesTimeText(said[599].left)).toBe('0:41')
  }, 300_000)

  it('counts down to the nearer moment where the pattern comes round within itself', async () => {
    // 4 of 8 with no Accent is the same two steps on: with Drift at a half the
    // second gate gains a step in 16 s, so the sides are the same every 32 s,
    // a quarter of the time a whole pattern takes.
    const values = { steps: 8, fill: 4, accent: 0, drift: 0.5 }
    const every = 2 / (4 * 0.125 * 0.125)
    expect(every).toBe(32)
    const { met, said } = await meetings(values, 140)
    expect(met.length).toBe(4)
    met.forEach((at, n) => expect(Math.abs(at - every * (n + 1))).toBeLessThan(0.5))
    let worst = 0
    for (const { at, left } of said) {
      const next = met.find((time) => time > at + 0.5)
      if (next !== undefined && next - at > 1) worst = Math.max(worst, Math.abs(at + left - next))
    }
    expect(worst).toBeLessThan(0.5)
    expect(pulsesTimeText(said[1].left)).toBe('0:31')
    // With the first step marked, only every fourth of those is a meeting.
    const marked = await meetings({ ...values, accent: 1 }, 140)
    expect(marked.met.length).toBe(1)
    expect(Math.abs(marked.met[0] - 4 * every)).toBeLessThan(0.5)
    expect(marked.said[0].left).toBeCloseTo(4 * every, 6)
    expect(pulsesTimeText(marked.said[1].left)).toBe('2:07')
  }, 300_000)

  it('says a time shortly, and never with a fraction in one glyph', () => {
    expect(pulsesTimeText(0)).toBe('0:00')
    expect(pulsesTimeText(42.4)).toBe('0:42')
    expect(pulsesTimeText(128)).toBe('2:08')
    expect(pulsesTimeText(3599.4)).toBe('59:59')
    expect(pulsesTimeText(5400)).toBe('1.5 h')
    expect(pulsesTimeText(36000)).toBe('10 h')
    expect(pulsesTimeText(3 * 86400)).toBe('3 d')
    expect(pulsesTimeText(1e9)).toBe('> 99 d')
  })
})

describe('the Pulses display', () => {
  // On a plate at rest under four knobs: 224 by 48.
  const size = { width: 224, height: 48 }

  it('is laid out from the size it is given', () => {
    // 224 by 48: the pulse 49 by 36 from (6, 6), the lanes 145 by 25 from (67, 7) about 19.5.
    expect(pulsesLayout(size)).toEqual({
      zoom: { x: 6, y: 6, w: 49, h: 36 },
      divider: 62,
      lanes: { x: 67, y: 7, w: 145, h: 25 },
      mid: 19.5,
      lane: 12,
      bar: { x: 70, w: 116, y: 40.5 },
      right: 220,
      base: 43,
    })
    // Upright, 204 by 100: the same parts, the lanes three times as high.
    const upright = pulsesLayout({ width: 204, height: 100 })
    expect(upright.zoom).toEqual({ x: 6, y: 6, w: 45, h: 88 })
    expect(upright.lanes).toEqual({ x: 63, y: 7, w: 129, h: 77 })
    expect(upright.lane).toBe(38)
    for (const shape of [size, { width: 204, height: 100 }, { width: 184, height: 48 }]) {
      const lay = pulsesLayout(shape)
      // The pulse, the line and the lanes stand side by side, and everything is on the display.
      expect(lay.zoom.x + lay.zoom.w).toBeLessThan(lay.divider)
      expect(lay.divider).toBeLessThan(lay.lanes.x)
      expect(lay.lanes.x + lay.lanes.w).toBeLessThanOrEqual(shape.width - 4)
      expect(lay.lanes.y + lay.lanes.h + 3).toBeLessThan(lay.bar.y - 2.5)
      expect(lay.bar.y + 2.5).toBeLessThanOrEqual(shape.height - 4)
      expect(lay.zoom.y + lay.zoom.h).toBe(shape.height - 6)
    }
  })

  it('shows eight steps or more, a short pattern as many times over as that takes', () => {
    expect([2, 3, 4, 5, 7, 8, 9, 16].map((steps) => pulsesRounds(steps, 4))).toEqual([
      4, 3, 2, 2, 2, 1, 1, 1,
    ])
    expect(pulsesRounds(8, 10)).toBe(1)
  })

  it('shows sixteen or more past ten steps a second, so the mark crosses in 0.8 s or more', () => {
    expect([2, 3, 5, 8, 9, 16].map((steps) => pulsesRounds(steps, 10.5))).toEqual([
      8, 6, 4, 2, 2, 1,
    ])
    const { lanes } = pulsesLayout(size)
    for (const [rate, steps] of [
      [20, 8],
      [20, 2],
      [11, 7],
      [10, 8],
      [20, 16],
    ]) {
      const crossing = (pulsesRounds(steps, rate) * steps) / rate
      expect(crossing).toBeGreaterThanOrEqual(0.8)
      // At 30 frames a second that is under 7 px a frame across the 145 px of the lanes.
      expect(lanes.w / crossing / 30).toBeLessThan(7)
    }
    // The steps are ticked on the middle line: 17 ticks for 8 steps at 20 a second.
    const { mid } = pulsesLayout(size)
    const ticks = (rate: number): number =>
      strokes(drawDisplay(display, PULSES_PARAMS, { values: { rate }, ...size })).filter(
        (stroke) =>
          stroke.points.length === 2 &&
          stroke.alpha === INK.rule &&
          stroke.points[0].x === stroke.points[1].x &&
          Math.abs((stroke.points[0].y + stroke.points[1].y) / 2 - mid) < 1e-9,
      ).length
    expect(ticks(20)).toBe(17)
    expect(ticks(4)).toBe(9)
  })

  it('draws each side as the device lets it through, the right side ahead by what the second gate has gained: this time across from the mark on, the next time behind it', () => {
    const cases: [Values, { place: number; lead: number }][] = [
      [{}, { place: 0, lead: 0 }],
      [{}, { place: 0.4, lead: 0.3 }],
      [
        { steps: 16, fill: 7, drift: 1, shift: 5, apart: 0.6, accent: 0.8 },
        { place: 0.7, lead: 0.55 },
      ],
      [
        { steps: 3, fill: 2, drift: 0.8, mix: 0.6, floor: 0.2, length: 1, edge: 0 },
        { place: 0.2, lead: 0.9 },
      ],
      [
        { steps: 2, fill: 1, shift: 1, drift: 0 },
        { place: 0.5, lead: 0 },
      ],
    ]
    for (const shape of [size, { width: 204, height: 100 }]) {
      const { lanes, mid, lane } = pulsesLayout(shape)
      for (const [values, meters] of cases) {
        const set = settingsOf(values)
        const total = pulsesRounds(set.steps, set.rate) * set.steps
        const drawn = drawDisplay(display, PULSES_PARAMS, { values, meters, ...shape })
        const [upper, lower] = laneLines(drawn)
        // What the second gate had gained when the first was at the lanes' left
        // end this time across, and what it will have gained there the next time.
        const now = meters.place * set.steps
        const lead = meters.lead * set.steps - now * set.faster
        const next = lead + total * set.faster
        const nowX = lanes.x + (now / total) * lanes.w
        const heard = (x: number, side: 0 | 1, ahead: number): number => {
          const gone = ((x - lanes.x) / lanes.w) * total
          const first = pulsesGate(gone % set.steps, set)
          const second = pulsesGate(
            (((gone * (1 + set.faster) + set.shift + ahead) % set.steps) + set.steps) % set.steps,
            set,
            true,
          )
          return side === 0 ? pulsesHeard(first, second, set) : pulsesHeard(second, first, set)
        }
        for (const [line, side] of [
          [upper, 0],
          [lower, 1],
        ] as const) {
          const height = (x: number, ahead: number): number =>
            side === 0
              ? mid - 0.5 - (heard(x, side, ahead) / MAX_MAKEUP) * lane
              : mid + 0.5 + (heard(x, side, ahead) / MAX_MAKEUP) * lane
          expect(line.points[0].x).toBeCloseTo(lanes.x, 9)
          expect(line.points[line.points.length - 1].x).toBeCloseTo(lanes.x + lanes.w, 9)
          // Every point of the line is on the device's level there: behind the
          // mark the next time across, from the mark on this one, and at the
          // mark itself one or the other.
          for (const at of line.points) {
            const off =
              at.x < nowX - 1e-9
                ? apart([at], at.x, height(at.x, next))
                : at.x > nowX + 1e-9
                  ? apart([at], at.x, height(at.x, lead))
                  : Math.min(
                      apart([at], at.x, height(at.x, next)),
                      apart([at], at.x, height(at.x, lead)),
                    )
            expect(off).toBeLessThan(1e-6)
          }
          // Between its points the line is the level too: at every half pixel
          // across, but for the pixel the mark stands on.
          let worst = 0
          for (let x = lanes.x; x <= lanes.x + lanes.w; x += 0.5) {
            if (Math.abs(x - nowX) < 0.85) continue
            worst = Math.max(worst, apart(line.points, x, height(x, x < nowX ? next : lead)))
          }
          expect(worst, `${JSON.stringify(values)} side ${side}`).toBeLessThan(0.5)
        }
      }
    }
  })

  it('is the same on both sides with no Drift and no Shift, and with the gates in the middle', () => {
    const mirrored = (values: Values, meters: { place: number; lead: number }): void => {
      const { mid } = pulsesLayout(size)
      const [upper, lower] = laneLines(
        drawDisplay(display, PULSES_PARAMS, { values, meters, ...size }),
      )
      upper.points.forEach((at, i) => expect(lower.points[i].y - mid).toBeCloseTo(mid - at.y, 9))
    }
    mirrored({ drift: 0 }, { place: 0.3, lead: 0 })
    mirrored({ apart: 0, drift: 1, shift: 3 }, { place: 0.3, lead: 0.4 })
  })

  it('draws only what Mix lets be heard, and keeps the pattern in its bars', () => {
    const { lanes, mid, lane } = pulsesLayout(size)
    const meters = { place: 0.3, lead: 0.2 }
    const dry = drawDisplay(display, PULSES_PARAMS, { values: { mix: 0 }, meters, ...size })
    const [upper, lower] = laneLines(dry)
    // The sound as it came on both sides, all the way across: 1 of the 1.585 a lane holds.
    for (const at of upper.points) expect(at.y).toBeCloseTo(mid - 0.5 - lane / MAX_MAKEUP, 9)
    for (const at of lower.points) expect(at.y).toBeCloseTo(mid + 0.5 + lane / MAX_MAKEUP, 9)
    // Half the Mix is half as deep. At the defaults Floor leaves 0.65 squared
    // and the make-up is at its most: between pulses stands half the sound as
    // it came and half of 1.585 * 0.4225 of it.
    expect(settingsOf().makeup).toBe(MAX_MAKEUP)
    const half = drawDisplay(display, PULSES_PARAMS, { values: { mix: 0.5 }, meters, ...size })
    const lowest = Math.max(...laneLines(half)[0].points.map((at) => at.y))
    expect(lowest).toBeCloseTo(
      mid - 0.5 - ((0.5 + 0.5 * MAX_MAKEUP * 0.4225) / MAX_MAKEUP) * lane,
      6,
    )
    // And the top of the first step's pulse half the sound and half of it made up.
    const highest = Math.min(...laneLines(half)[0].points.map((at) => at.y))
    expect(highest).toBeCloseTo(mid - 0.5 - ((0.5 + 0.5 * MAX_MAKEUP) / MAX_MAKEUP) * lane, 6)
    // The bars are the pattern itself and stand as they stood: five of eight steps over the upper lane.
    const over = (drawn: RecordingContext) => bars(drawn).filter((bar) => bar.y === lanes.y - 3)
    expect(over(dry)).toEqual(over(drawDisplay(display, PULSES_PARAMS, { meters, ...size })))
    expect(over(dry).length).toBe(5)
  })

  it("lays a bar over each step a gate sounds, as long as its pulse, the second gate's ahead and a little shorter", () => {
    const values = { steps: 8, fill: 3, length: 0.6, drift: 1, shift: 2 }
    const meters = { place: 0.5, lead: 0.25 }
    const set = settingsOf(values)
    const { lanes } = pulsesLayout(size)
    const step = lanes.w / 8
    const drawn = drawDisplay(display, PULSES_PARAMS, { values, meters, ...size })
    // The first gate: steps 0, 3 and 6 of x..x..x., each 0.6 of a step, the first the strongest.
    const first = bars(drawn).filter((bar) => bar.y === lanes.y - 3)
    expect(first.map((bar) => (bar.x - lanes.x) / step)).toEqual([0, 3, 6])
    for (const bar of first) expect(bar.w).toBeCloseTo(0.6 * step, 9)
    expect(first.map((bar) => bar.alpha)).toEqual([1, INK.back, INK.back])
    // The second gate goes an eighth faster: its steps are 8/9 as long, and it
    // was 2 steps of Shift and what it had gained ahead at the lanes' left end.
    // The mark is half way across: from there on the bars are this crossing's,
    // behind it the next one's, a step further ahead (an eighth of eight).
    const second = bars(drawn).filter((bar) => bar.y === lanes.y + lanes.h + 1)
    const lead = meters.lead * 8 - meters.place * 8 * set.faster
    const expected: { from: number; to: number }[] = []
    for (const [low, top, ahead] of [
      [0, 4, lead + 1],
      [4, 8, lead],
    ]) {
      for (const at of [-8, -5, -2, 0, 3, 6, 8, 11, 14]) {
        const from = (at - set.shift - ahead) / (1 + set.faster)
        const to = from + 0.6 / (1 + set.faster)
        if (Math.min(top, to) > Math.max(low, from))
          expected.push({ from: Math.max(low, from), to: Math.min(top, to) })
      }
    }
    expect(second.length).toBe(expected.length)
    second.forEach((bar, i) => {
      expect((bar.x - lanes.x) / step).toBeCloseTo(expected[i].from, 9)
      expect(bar.w / step).toBeCloseTo(expected[i].to - expected[i].from, 9)
    })
    // A bar begins where its pulse does: the lower line leaves the level between pulses there.
    const [, lower] = laneLines(drawn)
    const rest = Math.min(...lower.points.map((at) => at.y))
    for (const bar of second.filter(
      (one) => one.x > lanes.x && Math.abs(one.x - (lanes.x + 4 * step)) > 1e-6,
    )) {
      const before = lower.points.filter((at) => at.x <= bar.x + 1e-9).pop()
      const after = lower.points.find((at) => at.x > bar.x + 2)
      expect(before?.y).toBeCloseTo(rest, 6)
      expect(after?.y).toBeGreaterThan(rest + 0.5)
    }
  })

  it("marks now where the device says the first gate is, with each side's level on it", () => {
    const { lanes, mid, lane } = pulsesLayout(size)
    for (const [values, meters] of [
      [{}, { place: 0.4, lead: 0.3 }],
      [
        { steps: 16, fill: 7, drift: 1, apart: 0.5 },
        { place: 0.9, lead: 0.1 },
      ],
    ] as [Values, { place: number; lead: number }][]) {
      const set = settingsOf(values)
      const drawn = drawDisplay(display, PULSES_PARAMS, { values, meters, ...size })
      const x = lanes.x + meters.place * lanes.w
      expect(nowLine(drawn)).toBeCloseTo(Math.floor(x) + 0.5, 9)
      const first = pulsesGate(meters.place * set.steps, set)
      const second = pulsesGate(
        (meters.place * set.steps + set.shift + meters.lead * set.steps) % set.steps,
        set,
        true,
      )
      const marks = dots(drawn).filter(
        (dot) => dot.colour === PLAIN_COLOURS.accent && dot.r === 2.5,
      )
      expect(marks[0].x).toBeCloseTo(x, 9)
      expect(marks[0].y).toBeCloseTo(
        mid - 0.5 - (pulsesHeard(first, second, set) / MAX_MAKEUP) * lane,
        6,
      )
      expect(marks[1].x).toBeCloseTo(x, 9)
      expect(marks[1].y).toBeCloseTo(
        mid + 0.5 + (pulsesHeard(second, first, set) / MAX_MAKEUP) * lane,
        6,
      )
    }
  })

  it('follows the place the device reports while it runs, round after round of a short pattern', () => {
    // Two steps at 4 a second: a round in half a second, four of them across the lanes.
    const values = { steps: 2, fill: 1, rate: 4 }
    const { lanes } = pulsesLayout(size)
    const reported = (time: number) => ({
      meters: { place: wrap(0.1 + 2 * (Math.floor(time * 30 + 1e-9) / 30)), lead: 0 },
    })
    const seen: number[] = []
    for (const seconds of [0.2, 0.45, 0.7, 1.2, 1.7, 2.2]) {
      const drawn = runDisplay(display, PULSES_PARAMS, seconds, { values, ...size }, reported)
      seen.push((nowLine(drawn) - lanes.x) / lanes.w)
    }
    // After t seconds the gate has gone 2t rounds from 0.1 of one, of the four across.
    const expected = [0.2, 0.45, 0.7, 1.2, 1.7, 2.2].map((seconds) =>
      wrap((0.1 + 2 * (seconds - 1 / 30)) / 4),
    )
    seen.forEach((at, i) => expect(Math.abs(at - expected[i])).toBeLessThan(0.02))
    // A device that stands (it is switched off, the engine stopped) leaves the mark on its reading.
    const stood = runDisplay(display, PULSES_PARAMS, 0.6, {
      values,
      meters: { place: 0.3, lead: 0 },
      ...size,
    })
    expect((nowLine(stood) - lanes.x) / lanes.w).toBeCloseTo(0.3 / 4, 2)
  })

  it('redraws the lower lane only at the mark: ahead of it nothing moves through a crossing, and nothing jumps when the mark comes round', () => {
    // The device's two readings move together: the lead by `faster` of what the place moves.
    const values = { drift: 1 }
    const set = settingsOf(values)
    const { lanes } = pulsesLayout(size)
    const lowerAt = (place: number, round = 0) =>
      laneLines(
        drawDisplay(display, PULSES_PARAMS, {
          values,
          meters: { place, lead: wrap(0.2 + (round + place) * set.faster) },
          ...size,
        }),
      )[1].points
    const early = lowerAt(0.1)
    const late = lowerAt(0.6)
    // From the later mark on, both drawings are this crossing: the same line.
    const from = lanes.x + 0.6 * lanes.w + 1
    for (let x = from; x <= lanes.x + lanes.w; x += 0.5)
      expect(heightAt(late, x)).toBeCloseTo(heightAt(early, x), 6)
    // Up to the earlier mark both are the next crossing: the same line again.
    for (let x = lanes.x; x < lanes.x + 0.1 * lanes.w - 1; x += 0.5)
      expect(heightAt(late, x)).toBeCloseTo(heightAt(early, x), 6)
    // Between the two marks the lane has been drawn again, a step further on
    // (an eighth of the eight steps across): it is not the line it was.
    let changed = 0
    for (let x = lanes.x + 0.1 * lanes.w + 1; x < lanes.x + 0.6 * lanes.w - 1; x += 0.5)
      changed = Math.max(changed, Math.abs(heightAt(late, x) - heightAt(early, x)))
    expect(changed).toBeGreaterThan(2)
    // The mark at the very end of a crossing and at the start of the next: the same picture.
    const ending = lowerAt(0.9999)
    const starting = lowerAt(0.0001, 1)
    for (let x = lanes.x + 1; x < lanes.x + lanes.w - 1; x += 0.5)
      expect(Math.abs(heightAt(starting, x) - heightAt(ending, x))).toBeLessThan(0.05)
  })

  it('counts the lead through one pattern on the line below, and writes the time until the gates meet', () => {
    const { bar } = pulsesLayout(size)
    const lead = (drawn: RecordingContext): number => {
      const [mark] = dots(drawn).filter(
        (dot) => dot.colour === PLAIN_COLOURS.accent && dot.y === bar.y,
      )
      return (mark.x - bar.x) / bar.w
    }
    // At its defaults a pattern is gained in 8 / (4 * 0.125 / 8) = 128 s.
    const start = drawDisplay(display, PULSES_PARAMS, { meters: { place: 0, lead: 0 }, ...size })
    expect(lead(start)).toBe(0)
    expect(start.words()).toEqual(['L', 'R', '2:08'])
    const part = drawDisplay(display, PULSES_PARAMS, {
      meters: { place: 0.6, lead: 0.75 },
      ...size,
    })
    expect(lead(part)).toBeCloseTo(0.75, 9)
    expect(part.words()).toContain('0:32')
    // A Shift of 2 of 8 steps is a quarter of the way there already.
    const shifted = drawDisplay(display, PULSES_PARAMS, {
      values: { shift: 2 },
      meters: { place: 0, lead: 0.5 },
      ...size,
    })
    expect(lead(shifted)).toBeCloseTo(0.75, 9)
    expect(shifted.words()).toContain('0:32')
    // With no Drift the second gate stays where Shift put it, and no time is written.
    const held = drawDisplay(display, PULSES_PARAMS, {
      values: { drift: 0, shift: 4 },
      meters: { place: 0.2, lead: 0 },
      ...size,
    })
    expect(lead(held)).toBeCloseTo(0.5, 9)
    expect(held.words()).toEqual(['L', 'R'])
    // A tick for each step of the pattern, the two ends longer.
    const ticks = strokes(start).filter(
      (stroke) =>
        stroke.points.length === 2 &&
        stroke.points[0].x === stroke.points[1].x &&
        Math.abs((stroke.points[0].y + stroke.points[1].y) / 2 - bar.y) < 1e-9,
    )
    expect(ticks.length).toBe(9)
    expect(ticks.map((tick) => tick.points[1].y - tick.points[0].y)).toEqual([
      5, 3, 3, 3, 3, 3, 3, 3, 5,
    ])
    // 4 of 8 with no Accent sounds the same every two steps of lead: a longer
    // tick at each of those, and the time is to the nearest of them. Three
    // steps ahead, one is left to gain: 1 / (4 * 0.125) s at full Drift.
    const even = drawDisplay(display, PULSES_PARAMS, {
      values: { fill: 4, accent: 0, drift: 1 },
      meters: { place: 0, lead: 3 / 8 },
      ...size,
    })
    const evenTicks = strokes(even).filter(
      (stroke) =>
        stroke.points.length === 2 &&
        stroke.points[0].x === stroke.points[1].x &&
        Math.abs((stroke.points[0].y + stroke.points[1].y) / 2 - bar.y) < 1e-9,
    )
    expect(evenTicks.map((tick) => tick.points[1].y - tick.points[0].y)).toEqual([
      5, 3, 5, 3, 5, 3, 5, 3, 5,
    ])
    expect(lead(even)).toBeCloseTo(3 / 8, 9)
    expect(even.words()).toContain('0:02')
    // The same with the first step marked: five steps are left to gain.
    const marked = drawDisplay(display, PULSES_PARAMS, {
      values: { fill: 4, accent: 0.5, drift: 1 },
      meters: { place: 0, lead: 3 / 8 },
      ...size,
    })
    expect(marked.words()).toContain('0:10')
  })

  it('draws one pulse enlarged: the whole sound made up, and its top that Shade takes away', () => {
    const { zoom } = pulsesLayout(size)
    for (const values of [
      {},
      { edge: 1, length: 0.3, floor: 0, shade: 1, rate: 20 },
      { edge: 0, length: 1, floor: 0.8, shade: 0.3, mix: 0.4 },
      { edge: 0.4, length: 0.9, floor: 0.9, fill: 7 },
    ] as Values[]) {
      const set = settingsOf(values)
      const ramp = pulsesRamp(set.edge, set.length, MIN_EDGE_SEC * set.rate)
      const drawn = drawDisplay(display, PULSES_PARAMS, { values, ...size })
      const [whole] = strokes(drawn).filter(
        (stroke) => stroke.width === 1.5 && stroke.points.length > 2,
      )
      const [high] = strokes(drawn).filter(
        (stroke) => stroke.width === 1 && stroke.alpha === INK.back && stroke.points.length > 2,
      )
      for (const [line, top] of [
        [whole, false],
        [high, true],
      ] as const) {
        const height = (x: number): number => {
          const open = pulsesShape((x - zoom.x) / zoom.w, set.length, ramp)
          const heard = top ? pulsesHeardHigh(open, set) : pulsesHeard(open, open, set)
          // The top of the pulse's box is the most the sound is made up by.
          return zoom.y + (1 - heard / MAX_MAKEUP) * zoom.h
        }
        expect(line.points[0].x).toBe(zoom.x)
        expect(line.points[line.points.length - 1].x).toBe(zoom.x + zoom.w)
        for (const at of line.points) expect(at.y).toBeCloseTo(height(at.x), 6)
        // Between its points the line is the pulse too: at every half pixel across.
        let worst = 0
        for (let x = zoom.x; x <= zoom.x + zoom.w; x += 0.5)
          worst = Math.max(worst, apart(line.points, x, height(x)))
        expect(worst, JSON.stringify(values)).toBeLessThan(0.5)
      }
    }
    // A line across at the level the sound came in at: 1 of 1.585 up the box.
    const level = zoom.y + (1 - 1 / MAX_MAKEUP) * zoom.h
    const across = strokes(drawDisplay(display, PULSES_PARAMS, { ...size })).filter(
      (stroke) =>
        stroke.points.length === 2 &&
        stroke.alpha === INK.rule &&
        stroke.points[0].x === zoom.x &&
        stroke.points[1].x === zoom.x + zoom.w,
    )
    expect(across.length).toBe(1)
    expect(Math.abs(across[0].points[0].y - level)).toBeLessThanOrEqual(0.5)
    // Where less than 4 dB is taken away the pulse stands under the top by what is not made up.
    const high = settingsOf({ floor: 0.9, fill: 7 })
    expect(high.makeup).toBeLessThan(MAX_MAKEUP - 0.2)
    expect(high.makeup).toBeGreaterThan(1)
    // With no Shade the top is the whole and is not drawn apart.
    const plain = drawDisplay(display, PULSES_PARAMS, { values: { shade: 0 }, ...size })
    expect(
      strokes(plain).filter(
        (stroke) => stroke.width === 1 && stroke.alpha === INK.back && stroke.points.length > 2,
      ),
    ).toEqual([])
  })
})

describe('the points of the Pulses display', () => {
  const size = { width: 224, height: 48 }
  const { zoom } = pulsesLayout(size)
  /** How high a level stands in the enlarged pulse: 1 is the sound as it came, the top the most it is made up by. */
  const levelY = (heard: number): number => zoom.y + (1 - heard / MAX_MAKEUP) * zoom.h

  it('stands Edge where the rise ends on the top of the pulse, and Length and Floor where the pulse ends', () => {
    const { edge, end } = handlesAt({}, size)
    // At 4 steps a second the rise is 0.85 of half the 0.85 the pulse lasts.
    expect(edge.name).toBe('Edge')
    expect(edge.x).toBeCloseTo(6 + 0.85 * 0.425 * 49, 9)
    // The pulse is made up by the most, so its top is the top of the box.
    expect(edge.y).toBeCloseTo(6, 9)
    // The pulse ends 0.85 of the way across, on what is left between pulses: 0.65 squared of the top.
    expect(end.name).toBe('Length and Floor')
    expect(end.x).toBeCloseTo(6 + 0.85 * 49, 9)
    expect(end.y).toBeCloseTo(6 + (1 - 0.4225) * 36, 9)
    // The line drawn passes through both: all open from the one, down to the level at the other.
    const drawn = drawDisplay(display, PULSES_PARAMS, { ...size })
    const [whole] = strokes(drawn).filter(
      (stroke) => stroke.width === 1.5 && stroke.points.length > 2,
    )
    const firstOpen = whole.points.find((at) => at.y <= zoom.y + 1e-9)
    expect(Math.abs((firstOpen?.x ?? 0) - edge.x)).toBeLessThanOrEqual(0.5)
    const closed = whole.points.find((at) => at.x >= end.x)
    expect(closed?.y).toBeCloseTo(end.y, 9)
    // Both rings are drawn where they stand, larger while under the pointer.
    expect(dots(drawn)).toContainEqual({
      x: edge.x,
      y: edge.y,
      r: 3.5,
      colour: PLAIN_COLOURS.plate,
    })
    expect(dots(drawn)).toContainEqual({ x: end.x, y: end.y, r: 3.5, colour: PLAIN_COLOURS.plate })
    const hot = drawDisplay(display, PULSES_PARAMS, { hot: 'length', ...size })
    expect(dots(hot)).toContainEqual({ x: end.x, y: end.y, r: 4.5, colour: PLAIN_COLOURS.accent })
  })

  it('stands both rings on the line drawn where less than the most is made up, and at less than full Mix', () => {
    for (const values of [
      { floor: 0.9, fill: 7 },
      { floor: 0.8, edge: 0.5, mix: 0.7 },
      { floor: 1 },
      { steps: 2, fill: 2, edge: 0, length: 1, floor: 0.55, apart: 0, drift: 0, accent: 0 },
    ] as Values[]) {
      const set = settingsOf(values)
      const { edge, end } = handlesAt(values, size)
      expect(edge.y).toBeCloseTo(levelY(1 - set.mix + set.mix * set.makeup), 9)
      expect(end.y).toBeCloseTo(levelY(1 - set.mix + set.mix * set.makeup * set.floor), 9)
      const drawn = drawDisplay(display, PULSES_PARAMS, { values, ...size })
      const [whole] = strokes(drawn).filter(
        (stroke) => stroke.width === 1.5 && stroke.points.length > 2,
      )
      expect(Math.min(...whole.points.map((at) => at.y))).toBeCloseTo(edge.y, 6)
      expect(Math.max(...whole.points.map((at) => at.y))).toBeCloseTo(end.y, 6)
    }
  })

  it('leaves every knob where it is when a point is only taken', () => {
    for (const values of [
      {},
      { edge: 1, rate: 20, length: 0.1 },
      { edge: 0.93, length: 0.4, floor: 0.07, mix: 0.2 },
      { edge: 0, length: 1, floor: 1 },
      { floor: 0.9, fill: 8 },
    ] as Values[]) {
      const { edge, end } = handlesAt(values, size)
      const now = (name: 'edge' | 'length' | 'floor'): number =>
        values[name] ?? PULSES_PARAMS[name].default
      expect(edge.drag(edge.x, edge.y)).toEqual({ edge: now('edge') })
      // Only across counts for Edge.
      expect(edge.drag(edge.x, edge.y + 30)).toEqual({ edge: now('edge') })
      expect(end.drag(end.x, end.y)).toEqual({ length: now('length'), floor: now('floor') })
      // Across alone leaves Floor, down alone leaves Length.
      expect(end.drag(end.x - 3, end.y).floor).toBe(now('floor'))
      expect(end.drag(end.x, end.y - 3).length).toBe(now('length'))
    }
  })

  it('sets what lies under the hand: dragged there, the point stands there', () => {
    // Edge, to places along the top between the hardest edge and the middle of the pulse.
    for (const values of [{}, { length: 1, rate: 1 }, { length: 0.4, rate: 12 }] as Values[]) {
      const length = values.length ?? 0.85
      const least = MIN_EDGE_SEC * (values.rate ?? 4)
      for (const share of [0.1, 0.33, 0.5, 0.8, 1]) {
        const x = zoom.x + (least + share * (length / 2 - least)) * zoom.w
        const { edge } = handlesAt(values, size)
        const set = edge.drag(x, edge.y)
        expect(handlesAt({ ...values, ...set }, size).edge.x).toBeCloseTo(x, 9)
      }
    }
    // Length and Floor, to places about the pulse, between the level the sound
    // came in at (all Floor) and what Mix leaves of it with none: at full Mix
    // and at less, where the make-up is at its most and where it is not. The
    // ring stands on what is heard between pulses, so the Floor found is the
    // one that leaves that much once it is made up, at the Length the hand is at.
    for (const base of [
      {},
      { fill: 8, edge: 0.6 },
      { steps: 2, fill: 2, apart: 0, drift: 0 },
    ] as Values[]) {
      for (const mix of [1, 0.75, 0.3, 0]) {
        const reach = Math.max(0.5, mix)
        const top = levelY(1)
        const foot = levelY(1 - reach)
        for (const [x, share] of [
          [12, 1],
          [30, 0.6],
          [48.5, 0.02],
          [55, 0.35],
          [20, 0],
        ]) {
          const y = top + share * (foot - top)
          const { end } = handlesAt({ ...base, mix }, size)
          const set = end.drag(x, y)
          const there = handlesAt({ ...base, mix, ...set }, size).end
          expect(there.x).toBeCloseTo(x, 9)
          expect(there.y, JSON.stringify({ base, mix, x, share })).toBeCloseTo(y, 6)
        }
      }
    }
    // Worked by hand: 24.5 px of 49 across is Length 0.5; 27 px of 36 down is a
    // quarter of the top, and with the make-up at its most there (half a step
    // of pulse over a quarter) that is a quarter left: Floor a half.
    const { end } = handlesAt({}, size)
    expect(end.drag(6 + 24.5, 6 + 27).length).toBeCloseTo(0.5, 12)
    expect(settingsOf({ length: 0.5, floor: 0.5 }).makeup).toBe(MAX_MAKEUP)
    expect(end.drag(6 + 24.5, 6 + 27).floor).toBeCloseTo(0.5, 9)
    // Where less is made up the same place is more Floor: every step sounding
    // on a floor of 0.81 makes up by less than a fifth, so the level between
    // pulses that the hand is at takes a higher Floor than its height alone says.
    const full = handlesAt({ fill: 8 }, size).end
    const high = full.drag(full.x, levelY(0.9)).floor
    const made = settingsOf({ fill: 8, floor: high })
    expect(made.makeup).toBeLessThan(1.2)
    expect(made.makeup * made.floor).toBeCloseTo(0.9, 9)
    expect(high * high).toBeGreaterThan(0.9 / MAX_MAKEUP + 0.1)
    // And Edge 0.5 is a rise of a quarter of the pulse: 0.2125 of a step.
    expect(handlesAt({}, size).edge.drag(6 + 0.2125 * 49, 6).edge).toBeCloseTo(0.5, 12)
  })

  it('stops at the ends however far a point is dragged, and a double press gives the defaults', () => {
    const { edge, end } = handlesAt({}, size)
    expect(edge.drag(-900, 6)).toEqual({ edge: 1 })
    expect(edge.drag(900, 6)).toEqual({ edge: 0 })
    expect(end.drag(-900, -900)).toEqual({ length: 0.1, floor: 1 })
    expect(end.drag(900, 900)).toEqual({ length: 1, floor: 0 })
    const moved = handlesAt({ edge: 0.9, length: 0.2, floor: 0.9 }, size)
    expect(moved.edge.reset?.()).toEqual({ edge: 0.15 })
    expect(moved.end.reset?.()).toEqual({ length: 0.85, floor: 0.65 })
  })

  it('stands Edge on the hardest edge there is, and takes harder from the hand left of it', () => {
    // At 20 steps a second 5 ms is a tenth of a step: no rise is shorter, whatever Edge says.
    const hard = handlesAt({ edge: 1, rate: 20 }, size).edge
    expect(hard.x).toBeCloseTo(6 + 0.1 * 49, 9)
    expect(handlesAt({ edge: 0.8, rate: 20 }, size).edge.x).toBeCloseTo(6 + 0.1 * 49, 9)
    // Left of it Edge goes on to its end, so the knob is not left short of it.
    expect(hard.drag(6, 6)).toEqual({ edge: 1 })
    expect(handlesAt({ edge: 0.5, rate: 20 }, size).edge.drag(6 + 0.02 * 49, 6).edge).toBeCloseTo(
      1 - 0.02 / 0.425,
      12,
    )
  })

  it('keeps Floor within reach under half the Mix, where little of it is heard', () => {
    // Over a half the ring is on the level drawn; under it, where it stood at a half.
    const level = (mix: number): number => {
      const drawn = drawDisplay(display, PULSES_PARAMS, { values: { mix, floor: 0 }, ...size })
      const [whole] = strokes(drawn).filter(
        (stroke) => stroke.width === 1.5 && stroke.points.length > 2,
      )
      return Math.max(...whole.points.map((at) => at.y))
    }
    expect(handlesAt({ mix: 0.8, floor: 0 }, size).end.y).toBeCloseTo(level(0.8), 9)
    // With no Floor, what is left between pulses is what Mix lets by of the sound as it came.
    expect(level(0.8)).toBeCloseTo(levelY(0.2), 9)
    for (const mix of [0.5, 0.3, 0])
      expect(handlesAt({ mix, floor: 0 }, size).end.y).toBeCloseTo(levelY(0.5), 9)
    expect(level(0)).toBeCloseTo(levelY(1), 9)
    // There the ring's way is from half the sound up to all of it. Where a
    // quarter is left and made up by the most, it stands on half and half of
    // 1.585 quarters: Floor a half.
    const dry = handlesAt({ mix: 0 }, size).end
    expect(dry.drag(dry.x, levelY(0.5 + 0.5 * MAX_MAKEUP * 0.25)).floor).toBeCloseTo(0.5, 9)
    expect(dry.drag(dry.x, 900).floor).toBe(0)
    expect(dry.drag(dry.x, -900).floor).toBe(1)
  })

  it('keeps both rings whole on the display at every setting and size', () => {
    // Lit, a ring takes 5.25 px about its middle.
    for (const shape of [size, { width: 184, height: 48 }, { width: 204, height: 100 }]) {
      for (const values of [
        {},
        { edge: 1, length: 0.1, floor: 0, rate: 0.25 },
        { edge: 0, length: 1, floor: 1, rate: 20 },
        { edge: 1, length: 1, floor: 0, mix: 0 },
      ] as Values[]) {
        const { edge, end } = handlesAt(values, shape)
        for (const point of [edge, end]) {
          expect(point.x).toBeGreaterThanOrEqual(5.25)
          expect(point.x).toBeLessThanOrEqual(shape.width - 5.25)
          expect(point.y).toBeGreaterThanOrEqual(5.25)
          expect(point.y).toBeLessThanOrEqual(shape.height - 5.25)
        }
      }
    }
  })
})
