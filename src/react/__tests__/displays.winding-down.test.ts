// The truth of the Winding Down display: the arithmetic it is drawn from
// against the compiled device at 48 kHz (a steady tone through it, read a
// sample at a time on both sides, and the place it reports), the drawing
// against that arithmetic and against the device's own output, the points
// that are dragged, and the timed draw: nothing on it turns back more than six
// times in any second, whatever the Rate.

import { describe, expect, it } from 'vitest'

import { WINDING_DOWN_PARAMS } from '../../dsp/devices/winding-down.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, fillRect, ground } from '../components/display-kit'
import {
  WINDING_BELOW,
  WINDING_DOWN_FACES,
  WINDING_DUTY,
  WINDING_MAX_HZ,
  WINDING_MIN_HZ,
  WINDING_SLOTS,
  windingBell,
  windingFloor,
  windingGainAt,
  windingHzOfX,
  windingLayers,
  windingLayout,
  windingOpen,
  windingSettings,
  windingShape,
  windingSlideText,
  windingSpan,
  windingSpanText,
  windingXOfHz,
  type WindingSettings,
} from '../components/displays/winding-down'
import { plateDisplay, type DisplayHandle, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  testLevel,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const display = WINDING_DOWN_FACES['winding-down'].display

type Values = Readonly<Record<string, number>>

const settingsOf = (values: Values = {}): WindingSettings =>
  windingSettings(
    (name) => values[name] ?? WINDING_DOWN_PARAMS[name as keyof typeof WINDING_DOWN_PARAMS].default,
  )

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('winding-down', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(WINDING_DOWN_PARAMS[name as keyof typeof WINDING_DOWN_PARAMS], value)
  return device
}

/** The device's place in the halving, as it reports it for its display. */
function placeOf(device: WasmDeviceHarness): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(0)
}

/** A device run on from where it stands, a sample count at a time, on a sound made from its own sample count. */
interface Running {
  device: WasmDeviceHarness
  /** Samples gone through it since it began. */
  gone: number
  input: (n: number) => number
}

/** Run `frames` more samples; what came out of the two sides if `keep`. */
function run(
  running: Running,
  frames: number,
  keep = true,
): { left: Float32Array; right: Float32Array } {
  const left = new Float32Array(keep ? frames : 0)
  const right = new Float32Array(keep ? frames : 0)
  const block = new Float32Array(128)
  for (let done = 0; done < frames; done += 128) {
    const count = Math.min(128, frames - done)
    for (let i = 0; i < count; i++) block[i] = running.input(running.gone + i)
    running.device.processBlock(block.subarray(0, count))
    if (keep) {
      left.set(running.device.view(running.device.device.device_out_left(), count), done)
      right.set(running.device.view(running.device.device.device_out_right(), count), done)
    }
    running.gone += count
  }
  return { left, right }
}

const TONE_HZ = 440
const TONE_AMP = 0.5

/**
 * The level the device gives a steady tone, a sample at a time on each side,
 * 1 being the tone as it came, with the place it reports: `skip` samples are
 * run first, then `frames` are read. The tone goes in once as a sine and once
 * as a cosine, each through a device of its own from its start; the device is
 * a gain and nothing else, so the size of the two outputs together is that
 * gain at that sample, with no averaging over time.
 */
async function toneLevels(
  values: Values,
  skip: number,
  frames: number,
): Promise<{ place: number; left: Float64Array; right: Float64Array }> {
  const sine: Running = {
    device: await deviceAt(values),
    gone: 0,
    input: (n) => TONE_AMP * Math.sin((TWO_PI * TONE_HZ * n) / RATE),
  }
  const cosine: Running = {
    device: await deviceAt(values),
    gone: 0,
    input: (n) => TONE_AMP * Math.cos((TWO_PI * TONE_HZ * n) / RATE),
  }
  run(sine, skip, false)
  run(cosine, skip, false)
  const place = placeOf(sine.device)
  expect(placeOf(cosine.device)).toBe(place)
  const a = run(sine, frames)
  const b = run(cosine, frames)
  const left = new Float64Array(frames)
  const right = new Float64Array(frames)
  for (let n = 0; n < frames; n++) {
    left[n] = Math.hypot(a.left[n], b.left[n]) / TONE_AMP
    right[n] = Math.hypot(a.right[n], b.right[n]) / TONE_AMP
  }
  return { place, left, right }
}

/**
 * When the lowest layer has made `turns` whole turns since the device began,
 * in seconds: every layer begins a pulse there, since each one's phase is the
 * lowest one's doubled. The device begins with the place at 0, so the lowest
 * layer runs at Rate / 4 and slows (or quickens) from there.
 *
 * The device adds a layer's rate up a sample at a time, each sample at the
 * rate it begins with, so what it has turned through after N samples is
 * Rate / 4 / sr x (1 - q^N) / (1 - q) with q = 2^(-1 / (H sr)) when slowing.
 * That is ln 2 / (2 H sr) more than the smooth sum the display draws (under
 * two parts in a million at the shortest Halving), which shows only as a
 * moment that comes early: layers that have slid t / H octaves start
 * together (2^(t / H) - 1) / 2 samples before the smooth sum says, 1.8
 * samples after 8.7 s at a Halving of 4 s. So the moment is worked out here
 * as the device adds it up, and the level from that moment on is held to the
 * display's smooth sum.
 */
function startTogether(turns: number, set: WindingSettings): number {
  const lowest = set.rate * Math.pow(2, -WINDING_BELOW)
  // 1 - q, with q what the rate is multiplied by each sample.
  const less = -Math.expm1((-set.way * Math.LN2) / (set.halving * RATE))
  const samples = Math.log1p((-turns * RATE * less) / lowest) / Math.log1p(-less)
  return samples / RATE
}

/** How far a reading is outside what is said for it a sample either side: nothing when it lies between them. */
function outside(heard: number, said: readonly number[]): number {
  return Math.max(Math.min(...said) - heard, heard - Math.max(...said), 0)
}

/** How high a line through points stands at `x`. */
function heightAt(points: readonly (readonly [number, number])[], x: number): number {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [from, to] = [points[i - 1], points[i]]
    if (x > to[0]) continue
    return to[0] === from[0]
      ? to[1]
      : from[1] + ((to[1] - from[1]) * (x - from[0])) / (to[0] - from[0])
  }
  return points[points.length - 1][1]
}

/** What the display draws: the bell's line, the six marks' stems, and the two lanes' lines. */
function lines(drawn: RecordingContext): {
  bell: DrawnPath
  stems: DrawnPath[]
  upper: DrawnPath
  lower: DrawnPath
} {
  const strokes = drawnPaths(drawn).filter((path) => path.kind === 'stroke')
  const ink = strokes.filter((path) => path.colour === PLAIN_COLOURS.ink)
  const [bell] = ink.filter((path) => path.width === 1.25)
  const [upper, lower] = ink.filter((path) => path.width === 1 && path.points.length > 2)
  const stems = strokes.filter(
    (path) =>
      path.colour === PLAIN_COLOURS.accent && path.width === 1.5 && path.points.length === 2,
  )
  return { bell, stems, upper, lower }
}

/** Where the marks' dots stand, in the order drawn. */
function dots(drawn: RecordingContext): [number, number][] {
  return drawn.calls
    .filter((call) => call.name === 'arc' && call.args[2] === 2)
    .map((call) => [call.args[0] as number, call.args[1] as number])
}

function handlesAt(values: Values = {}, size?: { width: number; height: number }) {
  const all = display.handles?.(viewOf(display, WINDING_DOWN_PARAMS, { values, ...size })) ?? []
  const byKey = (key: string): DisplayHandle => {
    const found = all.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  return { rate: byKey('rate'), layers: byKey('layers') }
}

describe('the arithmetic of the Winding Down display against the device', () => {
  it("keeps the device's own numbers", () => {
    // `WindingDown::kSlots`, `kBelow` and `kDuty` in winding_down.h.
    expect([WINDING_SLOTS, WINDING_BELOW, WINDING_DUTY]).toEqual([6, 2, 0.5])
  })

  it('shapes a pulse as the kit does: half on, a half cosine up from phase 0 and down from a half', () => {
    // Worked by hand. Four a second, an edge of 15 ms: 0.06 of the 250 ms period.
    const shape = windingShape(4, 0.015)
    expect(shape.duty).toBe(0.5)
    expect(shape.edge).toBeCloseTo(0.06, 12)
    expect(windingOpen(0, shape)).toBe(0)
    expect(windingOpen(0.015, shape)).toBeCloseTo(0.5 - 0.5 * Math.SQRT1_2, 12)
    expect(windingOpen(0.03, shape)).toBeCloseTo(0.5, 12)
    expect(windingOpen(0.06, shape)).toBe(1)
    expect(windingOpen(0.3, shape)).toBe(1)
    expect(windingOpen(0.5, shape)).toBeCloseTo(1, 12)
    expect(windingOpen(0.53, shape)).toBeCloseTo(0.5, 12)
    expect(windingOpen(0.56, shape)).toBeCloseTo(0, 12)
    expect(windingOpen(0.7, shape)).toBe(0)
    // A fast layer keeps its edge to a quarter of its own period: at 32 a
    // second 15 ms would be 0.48 of a period and is held to 0.25, 7.8 ms.
    expect(windingShape(32, 0.015).edge).toBe(0.25)
    expect(windingShape(16, 0.015).edge).toBeCloseTo(0.24, 12)
    expect(windingShape(0.5, 0.05).edge).toBeCloseTo(0.025, 12)
  })

  it('reads Depth as the kit does: (1 - Depth) squared is left where every layer is in its gap', () => {
    expect(windingFloor(0)).toBe(1)
    expect(windingFloor(0.7)).toBeCloseTo(0.09, 12)
    expect(windingFloor(0.5)).toBe(0.25)
    expect(windingFloor(1)).toBe(0)
  })

  it('weighs a layer by the bell: a raised cosine over Layers octaves, nothing from its ends out', () => {
    expect(windingBell(0, 4)).toBe(1)
    expect(windingBell(1, 4)).toBeCloseTo(0.5, 12)
    expect(windingBell(-1, 4)).toBeCloseTo(0.5, 12)
    expect(windingBell(0.5, 4)).toBeCloseTo(0.5 + 0.5 * Math.SQRT1_2, 12)
    expect(windingBell(2, 4)).toBe(0)
    expect(windingBell(-2.3, 4)).toBe(0)
    expect(windingBell(1, 2)).toBe(0)
    expect(windingBell(0.5, 2)).toBeCloseTo(0.5, 12)
    expect(windingBell(2, 5)).toBeCloseTo(0.5 + 0.5 * Math.cos(0.8 * Math.PI), 12)
  })

  it('reads the knobs as the device applies them', () => {
    const set = settingsOf({
      direction: 1,
      rate: 3,
      halving: 30,
      layers: 3,
      depth: 0.6,
      edge: 20,
      offset: 90,
    })
    expect(set).toEqual({
      way: -1,
      rate: 3,
      halving: 30,
      span: 3,
      floor: expect.closeTo(0.16, 12) as number,
      edge: 0.02,
      behind: 0.25,
    })
    expect(settingsOf().way).toBe(1)
    // Layers goes to the nearest whole number, a half upward, as `std::floor(value + 0.5f)` does.
    expect(settingsOf({ layers: 3.4 }).span).toBe(3)
    expect(settingsOf({ layers: 3.5 }).span).toBe(4)
  })

  it('places six layers an octave apart, each at Rate x 2^(slot - 2 - place), with weights that add to 1', () => {
    const set = settingsOf()
    // At the start of a halving, four layers under a bell four octaves wide:
    // 1, 2, 4, 8, 16 and 32 a second, of which 2, 4 and 8 sound (1 and 16 stand at the bell's feet).
    const first = windingLayers(0, set)
    expect(first.map((layer) => layer.hz)).toEqual([1, 2, 4, 8, 16, 32])
    expect(first.map((layer) => layer.octaves)).toEqual([-2, -1, 0, 1, 2, 3])
    first
      .map((layer) => layer.weight)
      .forEach((weight, slot) => expect(weight).toBeCloseTo([0, 0.25, 0.5, 0.25, 0, 0][slot], 12))
    // Half way through, four layers sound: 1.41, 2.83, 5.66 and 11.3 a second.
    const half = windingLayers(0.5, set)
    expect(half[1].hz).toBeCloseTo(Math.SQRT2, 12)
    expect(half[4].hz).toBeCloseTo(8 * Math.SQRT2, 12)
    const outer = (0.5 + 0.5 * Math.cos(0.75 * Math.PI)) / 2
    const inner = (0.5 + 0.5 * Math.cos(0.25 * Math.PI)) / 2
    half
      .map((layer) => layer.weight)
      .forEach((weight, slot) =>
        expect(weight).toBeCloseTo([0, outer, inner, inner, outer, 0][slot], 12),
      )
    for (const layers of [2, 3, 4, 5]) {
      for (let place = 0; place <= 1; place += 0.01) {
        const all = windingLayers(place, settingsOf({ layers }))
        expect(all.reduce((sum, layer) => sum + layer.weight, 0)).toBeCloseTo(1, 12)
        // As many sound as Layers says, one fewer at the instant one leaves as another comes in.
        const sounding = all.filter((layer) => layer.weight > 0).length
        expect([layers - 1, layers]).toContain(sounding)
      }
    }
    // At the end of a halving every layer is where the one a place under it began.
    const last = windingLayers(1, set)
    for (let slot = 1; slot < WINDING_SLOTS; slot++) {
      expect(last[slot].hz).toBeCloseTo(first[slot - 1].hz, 12)
      expect(last[slot].weight).toBeCloseTo(first[slot - 1].weight, 12)
    }
    // The lowest of them, dropped there, and the one that comes in on top are both silent.
    expect(last[0].weight).toBe(0)
    expect(first[WINDING_SLOTS - 1].weight).toBe(0)
  })

  it("gives the level the device's law gives: the floor, and above it the weighted sum of the pulses", () => {
    const set = settingsOf({ depth: 0.7, edge: 15 })
    // At the very start every layer begins to rise: the floor, 0.09.
    expect(windingGainAt(0, 0, set)).toBeCloseTo(0.09, 12)
    // 60 ms on, with a halving so long nothing has slid: 2 and 4 a second are on their tops, 8 a
    // second is 0.48 of the way through its period, still on. All three open: 1.
    const still = { ...set, halving: 1e9 }
    expect(windingGainAt(0.06, 0, still)).toBeCloseTo(1, 9)
    // 100 ms on, 8 a second is in its gap (0.8 of a period): 0.09 + 0.91 x 0.75.
    expect(windingGainAt(0.1, 0, still)).toBeCloseTo(0.09 + 0.91 * 0.75, 9)
    // 300 ms on: 2 a second is 0.6 of the way through its period, in its gap; 4 a second is 0.2
    // of the way through its second period, on; 8 a second 0.4 through its third, on.
    // 0.09 + 0.91 x (0.5 + 0.25).
    expect(windingGainAt(0.3, 0, still)).toBeCloseTo(0.09 + 0.91 * 0.75, 9)
    // The right side reads every layer Offset later in that layer's own cycle: a quarter of a
    // period behind, at 60 ms 2 a second has not begun (0.12 - 0.25), 4 a second neither
    // (0.24 - 0.25), and 8 a second is 0.23 of a period in, on its top.
    const behind = { ...still, behind: 0.25 }
    expect(windingGainAt(0.06, 0, behind, true)).toBeCloseTo(0.09 + 0.91 * 0.25, 9)
    expect(windingGainAt(0.06, 0, behind)).toBeCloseTo(1, 9)
    // With Depth at 0 the level is 1 wherever the pulses stand, and never over 1 at any setting.
    for (let t = 0; t < 1; t += 0.0137) {
      expect(windingGainAt(t, 0.3, settingsOf({ depth: 0 }))).toBeCloseTo(1, 12)
      expect(windingGainAt(t, 0.3, settingsOf({ depth: 1, layers: 5 }))).toBeLessThanOrEqual(1)
    }
  })

  it('slides inside the stretch it draws: a layer has turned through the sum of its falling rate', () => {
    // Halving in 4 s, the lowest layer starts at 1 a second (Rate 4). After 4 s it has made
    // 1 x 4 / ln 2 x (1 - 1/2) = 2.885 turns, not 4: so 4 a second, two places up, has made
    // 11.54 and is 0.54 of the way through a period, just past the top of its pulse.
    const set = { ...settingsOf({ halving: 4, layers: 2, depth: 1, edge: 2 }) }
    const turns = (4 / Math.LN2) * 0.5
    expect(turns).toBeCloseTo(2.885, 3)
    // By then the place is 1: under a bell two octaves wide only the layer that began at 8 a
    // second, now at 4, sounds. It has made 8 x 2.885 = 23.08 turns: 0.08 of a period in, on.
    expect(windingGainAt(4, 0, set)).toBeCloseTo(1, 9)
    // Quickening it is the other way: 1 x 4 / ln 2 x (2 - 1) = 5.771 turns in 4 s.
    const quicker = { ...set, way: -1 as const }
    const layers = windingLayers(-1, quicker)
    expect(layers.filter((layer) => layer.weight > 0).map((layer) => layer.hz)).toEqual([4])
    // The layer that began at 2 a second is at 4 now and has made 2 x 5.771 = 11.54 turns: off.
    expect(windingGainAt(4, 0, quicker)).toBeCloseTo(0, 9)
  })
})

describe('what the Winding Down display says is heard, against the device at 48 kHz', () => {
  it('reports its place in the halving: up from 0 when slowing, down from 1 when quickening', async () => {
    for (const [values, seconds] of [
      [{ halving: 20 }, 5],
      [{ halving: 4 }, 3],
      [{ halving: 4 }, 9],
      [{ halving: 8, direction: 1 }, 2],
      [{ halving: 8, direction: 1 }, 18],
    ] as [Values, number][]) {
      const set = settingsOf(values)
      const running: Running = { device: await deviceAt(values), gone: 0, input: () => 0.5 }
      expect(placeOf(running.device)).toBe(0)
      run(running, seconds * RATE, false)
      const said = (set.way * seconds) / set.halving
      expect(placeOf(running.device), JSON.stringify(values)).toBeCloseTo(
        said - Math.floor(said),
        5,
      )
    }
  })

  it('gives each side the level the device gives a steady tone, a sample at a time, from its start', async () => {
    const cases: Values[] = [
      {},
      { rate: 1, halving: 4, layers: 2, depth: 1, edge: 50 },
      { rate: 8, halving: 4, layers: 5, depth: 1, edge: 2, offset: 180 },
      { rate: 3, halving: 30, layers: 3, depth: 0.6, edge: 20, offset: 90 },
      { direction: 1, rate: 2, halving: 8, layers: 5, depth: 0.85, edge: 8, offset: 45 },
      { direction: 1, rate: 6, halving: 4, layers: 4, depth: 1, edge: 10, offset: 120 },
      // An edge of 50 ms is more than a quarter of a period from 5 a second up: the layers
      // at 8, 16 and 32 are held to a quarter of their own periods.
      { rate: 8, halving: 20, layers: 5, depth: 1, edge: 50, offset: 60 },
    ]
    for (const values of cases) {
      const set = settingsOf(values)
      // Twice the stretch the lanes show, so the slide inside it is held to the device too.
      const frames = Math.round(2 * windingSpan(set.rate) * RATE)
      const { place, left, right } = await toneLevels(values, 0, frames)
      expect(place).toBe(0)
      let worst = 0
      for (let n = 0; n < frames; n++) {
        worst = Math.max(
          worst,
          Math.abs(left[n] - windingGainAt(n / RATE, 0, set)),
          Math.abs(right[n] - windingGainAt(n / RATE, 0, set, true)),
        )
      }
      // (The worst of them reads 0.00014: the device adds its rate up a sample at a time.)
      expect(worst, JSON.stringify(values)).toBeLessThan(0.001)
    }
  })

  it('gives the same level later in the halving, from any moment the layers start together, at the place the device reports', async () => {
    const cases: { values: Values; turns: number[] }[] = [
      // Halving in 20 s from 1 a second at the lowest: 5 turns is 5.5 s in, 20 turns 34 s in, past a whole halving.
      { values: {}, turns: [5, 13, 20] },
      {
        values: { rate: 2, halving: 8, layers: 5, depth: 0.9, edge: 10, offset: 90 },
        turns: [1, 3, 5],
      },
      { values: { rate: 8, halving: 4, layers: 3, depth: 1, edge: 2 }, turns: [3, 9] },
      // Quickening, each layer that comes in underneath has half the phase of the one over it, so
      // the layers start together only on every second turn of the one over it: the counts are
      // even as many times over as layers have come in (two by 10 s, three by 22 s).
      {
        values: { direction: 1, rate: 2, halving: 8, layers: 5, depth: 0.85, edge: 8 },
        turns: [2, 8, 32],
      },
      {
        values: { direction: 1, rate: 6, halving: 30, layers: 2, depth: 1, edge: 4, offset: 60 },
        turns: [20, 80],
      },
    ]
    for (const { values, turns } of cases) {
      const set = settingsOf(values)
      const frames = Math.round(windingSpan(set.rate) * RATE)
      for (const count of turns) {
        const when = startTogether(count, set)
        const skip = Math.round(when * RATE)
        const { place, left, right } = await toneLevels(values, skip, frames)
        // The device's place is where the law puts it.
        const said = (set.way * skip) / RATE / set.halving
        expect(place).toBeCloseTo(said - Math.floor(said), 5)
        let worst = 0
        for (let n = 0; n < frames; n++) {
          const at = (skip + n) / RATE - when
          worst = Math.max(
            worst,
            outside(
              left[n],
              [-1, 0, 1].map((d) => windingGainAt(at + d / RATE, place, set)),
            ),
            outside(
              right[n],
              [-1, 0, 1].map((d) => windingGainAt(at + d / RATE, place, set, true)),
            ),
          )
        }
        // (The worst of them reads 0.0000004.)
        expect(worst, `${JSON.stringify(values)} after ${count} turns`).toBeLessThan(0.00002)
      }
    }
  }, 120_000)

  /** How strong the first partial of a pulse is, the pulse being 1 on its top: 2 / pi for a hard edge, less for a soft one. */
  function firstPartial(hz: number, edgeSeconds: number): number {
    const shape = windingShape(hz, edgeSeconds)
    let [re, im] = [0, 0]
    const parts = 8192
    for (let i = 0; i < parts; i++) {
      const phase = (i + 0.5) / parts
      const open = windingOpen(phase, shape)
      re += open * Math.cos(TWO_PI * phase)
      im += open * Math.sin(TWO_PI * phase)
    }
    return (2 * Math.hypot(re, im)) / parts
  }

  it("puts the layers where the sound's envelope has them: the strongest layer's rate and each layer's weight, at three places in a halving and past its end", async () => {
    // Full Depth, so the level is the weighted sum of the pulses and nothing
    // else; a hard edge; a Halving so long that a rate moves by a hundredth in
    // the two seconds that are read. Half on and half off, a pulse has no even
    // partials, so at a layer's rate nothing sounds but that layer.
    const values = { rate: 8, halving: 120, layers: 4, depth: 1, edge: 2 }
    const set = settingsOf(values)
    const running: Running = { device: await deviceAt(values), gone: 0, input: () => 0.5 }
    const STEP = 24
    const tick = STEP / RATE
    for (const middle of [20, 40, 100, 140]) {
      run(running, (middle - 1) * RATE - running.gone, false)
      const before = run(running, RATE).left
      const place = placeOf(running.device)
      const after = run(running, RATE).left
      // The level the device gave, every half millisecond, under a window that rises and falls.
      const count = (2 * RATE) / STEP
      const level = new Float64Array(count)
      const shade = new Float64Array(count)
      let [sum, weight] = [0, 0]
      for (let i = 0; i < count; i++) {
        let mean = 0
        for (let j = 0; j < STEP; j++) {
          const n = i * STEP + j
          mean += (n < RATE ? before[n] : after[n - RATE]) / 0.5
        }
        level[i] = mean / STEP
        shade[i] = 0.5 - 0.5 * Math.cos((TWO_PI * (i + 0.5)) / count)
        sum += shade[i] * level[i]
        weight += shade[i]
      }
      const rest = sum / weight
      /** How strongly the level pulses at `hz`, as the height of a sine. */
      const strength = (hz: number): number => {
        let [re, im] = [0, 0]
        for (let i = 0; i < count; i++) {
          const turn = TWO_PI * hz * (i + 0.5) * tick
          re += shade[i] * (level[i] - rest) * Math.cos(turn)
          im += shade[i] * (level[i] - rest) * Math.sin(turn)
        }
        return (2 * Math.hypot(re, im)) / weight
      }
      // The strongest pulsing in the sound, from 1.5 to 45 a second, found to a two hundredth of a hertz.
      let [best, bestHz] = [0, 0]
      for (let hz = 1.5; hz <= 45; hz += 0.05) {
        const found = strength(hz)
        if (found > best) [best, bestHz] = [found, hz]
      }
      for (let hz = bestHz - 0.05; hz <= bestHz + 0.05; hz += 0.005) {
        const found = strength(hz)
        if (found > best) [best, bestHz] = [found, hz]
      }
      // What the display says of the layers at the place the device reports.
      const said = windingLayers(place, set)
      const strongest = said.reduce((a, b) => (b.weight > a.weight ? b : a))
      expect(place).toBeCloseTo(middle / 120 - Math.floor(middle / 120), 5)
      expect(Math.abs(bestHz / strongest.hz - 1), `rate at ${middle} s`).toBeLessThan(0.003)
      // Each layer's weight, read off the sound an octave at a time from its strongest pulsing.
      let total = 0
      for (let octave = -2; octave <= 2; octave++) {
        const layer = said[strongest.slot + octave]
        const heard = strength(bestHz * Math.pow(2, octave)) / firstPartial(layer.hz, set.edge)
        total += heard
        expect(Math.abs(heard - layer.weight), `weight at ${middle} s, ${octave}`).toBeLessThan(
          0.01,
        )
      }
      expect(Math.abs(total - 1)).toBeLessThan(0.02)
      // (The rate reads within 0.0004 of the display's and the weights within 0.0015.)
    }
  }, 120_000)
})

describe('the Winding Down display', () => {
  // On a plate at rest beside two columns of knobs: 128 by 100.
  const size = { width: 128, height: 100 }
  const upright = { width: 204, height: 100 }

  it('is laid out from the size it is given: the rate axis above, its numbers, the lanes, a line of words', () => {
    expect(windingLayout(size)).toEqual({
      plot: { x: 8, y: 7, w: 112, h: 30 },
      scale: 47,
      lanes: { x: 15, y: 51, w: 107, h: 35 },
      mid: 68.5,
      lane: 17,
      base: 95,
      left: 6,
      right: 122,
    })
    expect(windingLayout(upright).plot).toEqual({ x: 8, y: 7, w: 188, h: 30 })
    expect(windingLayout(upright).lanes).toEqual({ x: 15, y: 51, w: 183, h: 35 })
    for (const shape of [size, upright, { width: 293, height: 100 }]) {
      const lay = windingLayout(shape)
      // The axis, its numbers (8 px on their line), the lanes and the words stand one under the other.
      expect(lay.plot.y + lay.plot.h).toBeLessThanOrEqual(lay.scale - 8)
      expect(lay.scale).toBeLessThan(lay.lanes.y)
      expect(lay.lanes.y + lay.lanes.h).toBeLessThanOrEqual(lay.base - 8)
      expect(lay.lanes.x + lay.lanes.w).toBe(shape.width - 6)
    }
  })

  it('lays the rate axis in equal octaves from an eighth of a hertz to 64, which holds every layer', () => {
    const { plot } = windingLayout(size)
    expect([WINDING_MIN_HZ, WINDING_MAX_HZ]).toEqual([0.125, 64])
    expect(windingXOfHz(0.125, plot)).toBe(plot.x)
    expect(windingXOfHz(64, plot)).toBeCloseTo(plot.x + plot.w, 9)
    // Nine octaves across: 1 Hz a third of the way, 8 Hz two thirds.
    expect(windingXOfHz(1, plot)).toBeCloseTo(plot.x + plot.w / 3, 9)
    expect(windingXOfHz(8, plot)).toBeCloseTo(plot.x + (2 * plot.w) / 3, 9)
    expect(windingHzOfX(windingXOfHz(5.3, plot), plot)).toBeCloseTo(5.3, 9)
    // The slowest a layer is kept at is Rate / 8 and the fastest Rate x 8: 0.125 to 64 Hz.
    for (const rate of [1, 8]) {
      for (const place of [0, 0.5, 1]) {
        for (const layer of windingLayers(place, settingsOf({ rate }))) {
          expect(layer.hz).toBeGreaterThanOrEqual(WINDING_MIN_HZ)
          expect(layer.hz).toBeLessThanOrEqual(WINDING_MAX_HZ)
        }
      }
    }
  })

  it('draws the bell over the rate axis: 1 at Rate, down to the axis half of Layers octaves either side', () => {
    for (const shape of [size, upright]) {
      const { plot } = windingLayout(shape)
      const foot = plot.y + plot.h
      for (const values of [
        {},
        { rate: 1, layers: 5 },
        { rate: 8, layers: 2 },
        { rate: 2.7, layers: 3 },
      ] as Values[]) {
        const set = settingsOf(values)
        const { bell } = lines(drawDisplay(display, WINDING_DOWN_PARAMS, { values, ...shape }))
        expect(bell.points[0][0]).toBeCloseTo(windingXOfHz(set.rate / 2 ** (set.span / 2), plot), 9)
        expect(bell.points[bell.points.length - 1][0]).toBeCloseTo(
          windingXOfHz(set.rate * 2 ** (set.span / 2), plot),
          9,
        )
        expect(bell.points[0][1]).toBeCloseTo(foot, 9)
        // Every point of the line is on the bell, and between its points the line is within a third of a pixel of it.
        const height = (x: number): number =>
          foot - windingBell(Math.log2(windingHzOfX(x, plot) / set.rate), set.span) * plot.h
        for (const [x, y] of bell.points) expect(Math.abs(y - height(x))).toBeLessThan(1e-6)
        for (let x = bell.points[0][0]; x <= bell.points[bell.points.length - 1][0]; x += 0.5)
          expect(Math.abs(heightAt(bell.points, x) - height(x))).toBeLessThan(0.34)
        // Its top is at Rate, on the top of the axis.
        expect(heightAt(bell.points, windingXOfHz(set.rate, plot))).toBeCloseTo(plot.y, 6)
      }
    }
  })

  it("stands a mark at each layer's rate, as high as the bell is there, at the place the device reports", () => {
    for (const shape of [size, upright]) {
      const { plot } = windingLayout(shape)
      const foot = plot.y + plot.h
      for (const values of [
        {},
        { rate: 1, layers: 5 },
        { rate: 8, layers: 2, direction: 1 },
      ] as Values[]) {
        const set = settingsOf(values)
        for (const place of [0, 0.25, 0.5, 0.9]) {
          const drawn = drawDisplay(display, WINDING_DOWN_PARAMS, {
            values,
            meters: { place },
            ...shape,
          })
          const { bell, stems } = lines(drawn)
          const tops = dots(drawn)
          const said = windingLayers(place, set)
          expect(stems.length).toBe(WINDING_SLOTS)
          expect(tops.length).toBe(WINDING_SLOTS)
          said.forEach((layer, slot) => {
            const x = windingXOfHz(layer.hz, plot)
            const y = foot - layer.bell * plot.h
            expect(tops[slot][0]).toBeCloseTo(x, 9)
            expect(tops[slot][1]).toBeCloseTo(y, 9)
            expect(stems[slot].points).toEqual([
              [tops[slot][0], foot],
              [tops[slot][0], tops[slot][1]],
            ])
            // A layer that sounds stands on the bell's line; one that does not, on the axis.
            if (layer.weight > 0) expect(Math.abs(heightAt(bell.points, x) - y)).toBeLessThan(0.34)
            else expect(y).toBe(foot)
            // As high as its weight: the heights of the marks are to each other as the weights.
            expect(layer.bell).toBeCloseTo(layer.weight * (set.span / 2), 9)
          })
          // An octave apart: each mark a ninth of the axis from the next.
          for (let slot = 1; slot < WINDING_SLOTS; slot++)
            expect(tops[slot][0] - tops[slot - 1][0]).toBeCloseTo(plot.w / 9, 9)
        }
      }
    }
    // With no reading the marks stand where a halving begins.
    const { plot } = windingLayout(size)
    expect(dots(drawDisplay(display, WINDING_DOWN_PARAMS, { ...size }))[2][0]).toBeCloseTo(
      windingXOfHz(4, plot),
      9,
    )
  })

  it("shows one to two pulses of a layer at the bell's centre over a round length of time, and writes it with the slide", () => {
    const spans = [1, 1.9, 2, 3.9, 4, 7.9, 8].map((rate) => windingSpanText(windingSpan(rate)))
    expect(spans).toEqual(['1 s', '1 s', '500 ms', '500 ms', '250 ms', '250 ms', '125 ms'])
    for (let rate = 1; rate <= 8; rate *= 1.013) {
      const pulses = windingSpan(rate) * rate
      expect(pulses).toBeGreaterThanOrEqual(1 - 1e-9)
      expect(pulses).toBeLessThan(2)
    }
    expect(windingSlideText({ way: 1, halving: 20 })).toBe('÷2 in 20 s')
    expect(windingSlideText({ way: -1, halving: 4 })).toBe('×2 in 4 s')
    expect(windingSlideText({ way: 1, halving: 7.46 })).toBe('÷2 in 7.5 s')
    expect(windingSlideText({ way: -1, halving: 120 })).toBe('×2 in 120 s')
    expect(drawDisplay(display, WINDING_DOWN_PARAMS, { ...size }).words()).toEqual([
      '1',
      '8',
      'Hz',
      'L',
      'R',
      '÷2 in 20 s',
      '250 ms',
    ])
    expect(
      drawDisplay(display, WINDING_DOWN_PARAMS, {
        values: { direction: 1, rate: 2, halving: 8 },
      }).words(),
    ).toEqual(['1', '8', 'Hz', 'L', 'R', '×2 in 8 s', '500 ms'])
  })

  it("draws each side's lane as the level the law gives, the right side behind by Offset, at the place the device reports", () => {
    const cases: Values[] = [
      {},
      { rate: 1, halving: 4, layers: 2, depth: 1, edge: 50, offset: 90 },
      { rate: 8, halving: 4, layers: 5, depth: 1, edge: 2, offset: 180 },
      { direction: 1, rate: 2, halving: 8, layers: 5, depth: 0.85, edge: 8, offset: 45 },
    ]
    for (const shape of [size, upright]) {
      const { lanes, mid, lane } = windingLayout(shape)
      for (const values of cases) {
        const set = settingsOf(values)
        const span = windingSpan(set.rate)
        for (const place of [0, 0.37]) {
          const { upper, lower } = lines(
            drawDisplay(display, WINDING_DOWN_PARAMS, { values, meters: { place }, ...shape }),
          )
          for (const [line, right] of [
            [upper, false],
            [lower, true],
          ] as const) {
            expect(line.points.length).toBe(2 * lanes.w + 1)
            expect(line.points[0][0]).toBeCloseTo(lanes.x, 9)
            expect(line.points[line.points.length - 1][0]).toBeCloseTo(lanes.x + lanes.w, 9)
            for (const [x, y] of line.points) {
              const level = windingGainAt(((x - lanes.x) / lanes.w) * span, place, set, right)
              const said = right ? mid + 0.5 + level * lane : mid - 0.5 - level * lane
              expect(Math.abs(y - said)).toBeLessThan(1e-6)
            }
          }
          // With no Offset the two lanes are one picture, mirrored in the middle line.
          if (!values.offset)
            upper.points.forEach(([, y], i) =>
              expect(lower.points[i][1] - mid).toBeCloseTo(mid - y, 9),
            )
        }
      }
    }
    // With Depth at 0 both lanes lie on their outer lines: nothing is turned down.
    const { mid, lane } = windingLayout(size)
    const flat = lines(drawDisplay(display, WINDING_DOWN_PARAMS, { values: { depth: 0 }, ...size }))
    for (const [, y] of flat.upper.points) expect(y).toBeCloseTo(mid - 0.5 - lane, 9)
    for (const [, y] of flat.lower.points) expect(y).toBeCloseTo(mid + 0.5 + lane, 9)
  })

  it('draws in the lanes the level that comes out of the device on a steady tone, both sides, at the place it reports', async () => {
    // Two a second, halving in 8 s: the lanes are half a second long. The
    // device is read from where its lowest layer has made three turns, 8.5 s
    // in and a little past a whole halving.
    const values = { rate: 2, halving: 8, layers: 5, depth: 0.9, edge: 10, offset: 90 }
    const set = settingsOf(values)
    const span = windingSpan(set.rate)
    const when = startTogether(3, set)
    const skip = Math.round(when * RATE)
    const { place, left, right } = await toneLevels(values, skip, Math.round(span * RATE) + 2)
    expect(place).toBeGreaterThan(0.05)
    expect(place).toBeLessThan(0.07)
    for (const shape of [size, upright]) {
      const { lanes, mid, lane } = windingLayout(shape)
      const { upper, lower } = lines(
        drawDisplay(display, WINDING_DOWN_PARAMS, { values, meters: { place }, ...shape }),
      )
      const heard = (side: Float64Array, x: number): number =>
        side[Math.max(0, Math.round((when + ((x - lanes.x) / lanes.w) * span) * RATE) - skip)]
      let worst = 0
      for (let x = lanes.x + 0.5; x <= lanes.x + lanes.w - 0.5; x += 0.5) {
        for (const [line, side, sign] of [
          [upper, left, -1],
          [lower, right, 1],
        ] as const) {
          const drawn = (sign * (heightAt(line.points, x) - mid) - 0.5) / lane
          worst = Math.max(
            worst,
            outside(drawn, [heard(side, x - 0.3), heard(side, x), heard(side, x + 0.3)]),
          )
        }
      }
      // Within a fifth of a pixel of a lane 17 px high.
      expect(worst).toBeLessThan(0.2 / lane)
    }
  })
})

describe('the points of the Winding Down display', () => {
  const size = { width: 128, height: 100 }
  const { plot } = windingLayout(size)
  const x = (hz: number): number => windingXOfHz(hz, plot)

  it("stands Rate on the bell's top and Layers at its upper foot", () => {
    const { rate, layers } = handlesAt({}, size)
    expect([rate.name, layers.name]).toEqual(['Rate', 'Layers'])
    expect([rate.x, rate.y]).toEqual([x(4), plot.y])
    // Four layers: the bell ends two octaves over Rate, at 16 a second, on the axis.
    expect(layers.x).toBeCloseTo(x(16), 9)
    expect(layers.y).toBe(plot.y + plot.h)
    const { bell } = lines(drawDisplay(display, WINDING_DOWN_PARAMS, { ...size }))
    expect(heightAt(bell.points, rate.x)).toBeCloseTo(rate.y, 6)
    expect(bell.points[bell.points.length - 1][0]).toBeCloseTo(layers.x, 9)
    // The widest bell at the highest Rate ends at 45 a second, still on the axis.
    const most = handlesAt({ rate: 8, layers: 5 }, size).layers
    expect(most.x).toBeCloseTo(x(8 * 2 ** 2.5), 9)
    expect(most.x).toBeLessThan(plot.x + plot.w)
    expect(handlesAt({ rate: 1, layers: 2 }, size).layers.x).toBeCloseTo(x(2), 9)
  })

  it('draws its points where they stand', () => {
    for (const values of [{}, { rate: 1.7, layers: 5, direction: 1 }] as Values[]) {
      const drawn = drawDisplay(display, WINDING_DOWN_PARAMS, { values, ...size })
      const rings = drawn.calls
        .filter((call) => call.name === 'arc' && call.args[2] === 3.5)
        .map((call) => [call.args[0], call.args[1]])
      const { rate, layers } = handlesAt(values, size)
      expect(rings).toEqual([
        [rate.x, rate.y],
        [layers.x, layers.y],
      ])
    }
  })

  it('moves Rate across the rate axis, inside its range', () => {
    const { rate } = handlesAt({}, size)
    expect(rate.drag(x(2), 0).rate).toBeCloseTo(2, 9)
    expect(rate.drag(x(6.3), 50).rate).toBeCloseTo(6.3, 9)
    expect(Object.keys(rate.drag(x(2), 0))).toEqual(['rate'])
    expect(rate.drag(0, 0)).toEqual({ rate: 1 })
    expect(rate.drag(size.width, 0)).toEqual({ rate: 8 })
    // Taken and not moved it stays where it is, and a double press puts it back.
    const other = handlesAt({ rate: 2.5 }, size).rate
    expect(other.drag(other.x, other.y)).toEqual({ rate: 2.5 })
    expect(other.reset?.()).toEqual({ rate: 4 })
  })

  it('moves Layers by the foot of the bell: half an octave from Rate for each layer, in whole ones', () => {
    const { layers } = handlesAt({}, size)
    // Rate is 4: a foot at 8 a second is two layers, at 11.3 three, at 16 four, at 22.6 five.
    expect(layers.drag(x(8), 0)).toEqual({ layers: 2 })
    expect(layers.drag(x(11.3), 0)).toEqual({ layers: 3 })
    expect(layers.drag(x(13), 0)).toEqual({ layers: 3 })
    expect(layers.drag(x(14), 0)).toEqual({ layers: 4 })
    expect(layers.drag(x(22.6), 0)).toEqual({ layers: 5 })
    expect(layers.drag(size.width, 0)).toEqual({ layers: 5 })
    expect(layers.drag(0, 0)).toEqual({ layers: 2 })
    expect(layers.drag(layers.x, layers.y)).toEqual({ layers: 4 })
    expect(layers.reset?.()).toEqual({ layers: 4 })
    // It is measured from the Rate the bell is at.
    const low = handlesAt({ rate: 1, layers: 3 }, size).layers
    expect(low.x).toBeCloseTo(x(2 ** 1.5), 9)
    expect(low.drag(x(4), 0)).toEqual({ layers: 4 })
  })
})

describe('the Winding Down display in time', () => {
  const wrap = (cycles: number): number => cycles - Math.floor(cycles)

  /**
   * A display drawn as the plate draws it for two seconds at 30 frames a
   * second, with the device's own pulses in the sound's level and its place
   * in the halving in the reading it is handed, from `from` on: every number
   * of every frame, in the order drawn (each coordinate, each width, each
   * strength an ink is laid at).
   */
  function timed(shown: PlateDisplay, values: Values, from = 0): number[][] {
    const set = settingsOf(values)
    const state = shown.init?.()
    const frames: number[][] = []
    for (let n = 0; n < 60; n++) {
      const time = n / 30
      // The level the device gives at this moment, as the law has it from a start together.
      const level = windingGainAt(time, from, set)
      const signal = { ...testSignal(0.5, 0.35 * level), right: testLevel(0.35 * level) }
      const drawn = drawDisplay(shown, WINDING_DOWN_PARAMS, {
        values,
        meters: { place: wrap(from + (set.way * time) / set.halving) },
        signal,
        state,
        now: 10 + time,
        dt: n === 0 ? 0 : 1 / 30,
      })
      frames.push(drawn.numbers().map(({ value }) => value))
    }
    return frames
  }

  /**
   * The most times anything drawn turns back within any one second: each
   * number of a frame is followed from frame to frame, and so is how many
   * numbers a frame has (a mark that comes and goes). A step of less than a
   * millionth of a pixel is no step.
   */
  function mostTurns(frames: readonly (readonly number[])[], fps = 30): number {
    const slots = Math.max(...frames.map((frame) => frame.length))
    let most = 0
    for (let slot = -1; slot < slots; slot++) {
      const series = frames.map((frame) => (slot < 0 ? frame.length : (frame[slot] ?? 0)))
      const turns: number[] = []
      let way = 0
      for (let n = 1; n < series.length; n++) {
        const move = series[n] - series[n - 1]
        if (Math.abs(move) < 1e-6) continue
        const step = Math.sign(move)
        if (way !== 0 && step !== way) turns.push(n)
        way = step
      }
      for (let first = 0; first < turns.length; first++) {
        let last = first
        while (last < turns.length && turns[last] - turns[first] < fps) last++
        most = Math.max(most, last - first)
      }
    }
    return most
  }

  /** What the display must never be: a patch as bright as the sound is loud now. */
  const flashing = plateDisplay({
    place: 'window',
    columns: 2,
    params: ['rate'],
    live: { signal: true },
    info: 'A patch that is as bright as the sound is loud at this moment.',
    draw(frame) {
      ground(frame)
      const level = (frame.signal?.output.peak ?? 0) / 0.35
      fillRect(frame.ctx, { x: 10, y: 10, w: 20, h: 20 }, frame.colours.ink, level)
    },
  })

  it('is counted rightly: a patch that follows the pulses turns back far more than six times a second', () => {
    // Six a second seen at 30 frames a second is five frames a pulse: up and down twelve times.
    expect(mostTurns(timed(flashing, { rate: 6, depth: 1 }))).toBe(12)
    // Eight a second is up and down sixteen times, with two layers or with five.
    expect(mostTurns(timed(flashing, { rate: 8, depth: 1, layers: 5 }))).toBe(16)
    expect(mostTurns(timed(flashing, { rate: 8, depth: 1, layers: 2 }))).toBe(16)
    // At four a second the layer at eight is in the level too: ten times.
    expect(mostTurns(timed(flashing, { rate: 4, depth: 1 }))).toBe(10)
  })

  it.each([1, 6, 8])(
    'never turns back more than six times in any second at a Rate of %d, with layers up to 45 a second',
    (rate) => {
      const settings: Values[] = [
        {},
        { layers: 5, depth: 1, edge: 2, offset: 180 },
        { layers: 2, depth: 1, edge: 50, offset: 90 },
        { layers: 5, depth: 1, edge: 2, direction: 1 },
        { layers: 3, depth: 0.5, edge: 10, offset: 120, direction: 1 },
      ]
      // The shortest Halving is the fastest the picture ever moves, and the
      // longest hardly moves it. From 0.9 of a halving the place passes its
      // end within the two seconds (or, quickening, from 0.1 its start).
      const runs: [Values, number][] = []
      for (const values of settings) {
        const turned = values.direction ? 0.1 : 0.9
        runs.push(
          [{ ...values, rate, halving: 4 }, 0.45],
          [{ ...values, rate, halving: 4 }, turned],
        )
      }
      for (const values of settings.slice(0, 2))
        runs.push(
          [{ ...values, rate, halving: 20 }, 0.99],
          [{ ...values, rate, halving: 120 }, 0.3],
        )
      for (const [values, from] of runs) {
        const frames = timed(display, values, from)
        expect(frames.length).toBe(60)
        expect(frames[0].length).toBeGreaterThan(400)
        // Every frame draws the same marks: nothing comes and goes.
        for (const frame of frames) expect(frame.length).toBe(frames[0].length)
        // (The most that is counted at any of them is four: the far end of a lane at the shortest Halving.)
        expect(mostTurns(frames), `${JSON.stringify(values)} from ${from}`).toBeLessThanOrEqual(6)
      }
    },
  )

  it('slides its marks with the place the device reports, carried on between two readings, and stands still when off', () => {
    // Halving in 4 s, read for a second: every mark goes a quarter of an octave down the axis.
    const values = { halving: 4 }
    const { plot } = windingLayout({ width: 128, height: 100 })
    const state = display.init?.()
    const seen: number[] = []
    let reading = 0.2
    for (let n = 0; n <= 30; n++) {
      // A reading comes every third frame, as when frames outrun the readings.
      if (n % 3 === 0) reading = 0.2 + n / 30 / 4
      const drawn = drawDisplay(display, WINDING_DOWN_PARAMS, {
        values,
        meters: { place: reading },
        state,
        now: 10 + n / 30,
        dt: n === 0 ? 0 : 1 / 30,
      })
      seen.push(dots(drawn)[2][0])
    }
    const said = (n: number): number => windingXOfHz(4 * 2 ** -(0.2 + n / 30 / 4), plot)
    seen.forEach((x, n) => {
      expect(Math.abs(x - said(n)), `frame ${n}`).toBeLessThan(0.02)
      if (n > 0) expect(x).toBeLessThan(seen[n - 1])
    })
    expect(seen[0] - seen[30]).toBeCloseTo(plot.w / 9 / 4, 1)
    // Quickening, they go up the axis.
    const up = display.init?.()
    const quick = [0, 1].map(
      (n) =>
        dots(
          drawDisplay(display, WINDING_DOWN_PARAMS, {
            values: { halving: 4, direction: 1 },
            meters: { place: 0.6 - n / 30 / 4 },
            state: up,
            now: 10 + n / 30,
            dt: n === 0 ? 0 : 1 / 30,
          }),
        )[2][0],
    )
    expect(quick[1]).toBeGreaterThan(quick[0])
    // Switched off, the picture stands on the reading and is not carried on.
    const off = display.init?.()
    const still = [0, 1, 2].map(
      (n) =>
        dots(
          drawDisplay(display, WINDING_DOWN_PARAMS, {
            values,
            meters: { place: 0.2 },
            state: off,
            powered: false,
            now: 10 + n / 30,
            dt: n === 0 ? 0 : 1 / 30,
          }),
        )[2][0],
    )
    expect(still).toEqual([still[0], still[0], still[0]])
    // A reading that is not a number, or outside 0 to 1, still draws.
    for (const place of [Number.NaN, -6, 7.25]) {
      const drawn = drawDisplay(display, WINDING_DOWN_PARAMS, { meters: { place } })
      for (const { value } of drawn.numbers()) expect(Number.isFinite(value)).toBe(true)
    }
  })
})
