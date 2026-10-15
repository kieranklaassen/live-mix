// The truth of the Band Pulse display: the arithmetic it is drawn from against
// the compiled device (a tone through it at 48 kHz, read a sample at a time on
// both sides), the drawing against that arithmetic and against the device's
// own output, the points that are dragged, and the timed draw: nothing on it
// turns back more than six times in any second, whatever the Rate.

import { describe, expect, it } from 'vitest'

import { BAND_PULSE_PARAMS } from '../../dsp/devices/band-pulse.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import {
  INK,
  PLAIN_COLOURS,
  dbText,
  fillRect,
  ground,
  xOfHz,
  yOfDb,
} from '../components/display-kit'
import {
  BAND_PULSE_FACES,
  BAND_PULSE_FOOT_DB,
  BAND_PULSE_MARGIN,
  BAND_PULSE_MAX_HZ,
  BAND_PULSE_MIN_HZ,
  bandPulseBreaks,
  bandPulseDepthDb,
  bandPulseEdges,
  bandPulseFloor,
  bandPulseGain,
  bandPulseHeard,
  bandPulseLayout,
  bandPulseLevelAt,
  bandPulseOpen,
  bandPulseSettings,
  bandPulseShape,
  bandPulseSpan,
  bandPulseSpanText,
  type BandPulseSettings,
} from '../components/displays/band-pulse'
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
const display = BAND_PULSE_FACES['band-pulse'].display

// The device's own numbers, copied from `cpp/kit/beat.h` and `cpp/kit/band.h`.
/** `kit::ThreeBand::kMargin`: High is held half an octave over Low at the least. */
const MARGIN = 1.41421356

type Values = Readonly<Record<string, number>>

const settingsOf = (values: Values = {}): BandPulseSettings =>
  bandPulseSettings(
    (name) => values[name] ?? BAND_PULSE_PARAMS[name as keyof typeof BAND_PULSE_PARAMS].default,
    RATE,
  )

async function deviceAt(values: Values): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('band-pulse', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(BAND_PULSE_PARAMS[name as keyof typeof BAND_PULSE_PARAMS], value)
  return device
}

/** What the device makes of `seconds` of an input, from its start: its two sides. */
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

/**
 * How much of a tone at `hz` the device lets through, a sample at a time on
 * each side, 1 being the tone as it came. The tone goes in once as a sine and
 * once as a cosine, each through a device of its own from its start: the
 * split comes before the gain and nothing comes after it, so the two outputs
 * are the two parts of low + band x gain + high turning with the tone, and
 * their size is that sum's size at that sample, with no averaging over time.
 */
async function toneLevels(
  values: Values,
  hz: number,
  seconds: number,
): Promise<{ left: Float64Array; right: Float64Array }> {
  const amp = 0.5
  const sine = render(
    await deviceAt(values),
    seconds,
    (n) => amp * Math.sin((TWO_PI * hz * n) / RATE),
  )
  const cosine = render(
    await deviceAt(values),
    seconds,
    (n) => amp * Math.cos((TWO_PI * hz * n) / RATE),
  )
  const left = new Float64Array(sine.left.length)
  const right = new Float64Array(sine.left.length)
  for (let n = 0; n < left.length; n++) {
    left[n] = Math.hypot(sine.left[n], cosine.left[n]) / amp
    right[n] = Math.hypot(sine.right[n], cosine.right[n]) / amp
  }
  return { left, right }
}

const toDb = (gain: number): number => 20 * Math.log10(Math.max(gain, 1e-12))

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

/** The two lanes' lines, the left side's and the right side's, and the line on the frequency axis. */
function lines(drawn: RecordingContext): { upper: DrawnPath; lower: DrawnPath; curve: DrawnPath } {
  const strokes = drawnPaths(drawn).filter(
    (path) => path.kind === 'stroke' && path.colour === PLAIN_COLOURS.ink,
  )
  const [upper, lower] = strokes.filter((path) => path.width === 1.25)
  const [curve] = strokes.filter((path) => path.width === 1.5 && path.points.length > 2)
  return { upper, lower, curve }
}

/** The bar over the band: the one rectangle filled in the accent. */
function bar(drawn: RecordingContext): { x: number; y: number; w: number; h: number } {
  let colour = ''
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'fillRect' && colour === PLAIN_COLOURS.accent) {
      const [x, y, w, h] = call.args as number[]
      return { x, y, w, h }
    }
  }
  throw new Error('no bar over the band')
}

function handlesAt(values: Values = {}, size?: { width: number; height: number }) {
  const all = display.handles?.(viewOf(display, BAND_PULSE_PARAMS, { values, ...size })) ?? []
  const byKey = (key: string): DisplayHandle => {
    const found = all.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  return { offset: byKey('offset'), low: byKey('low'), high: byKey('high') }
}

describe('the arithmetic of the Band Pulse display against the device', () => {
  it('shapes a pulse as the kit does: a half cosine up from phase 0, a top, the same down from Duty', () => {
    // Worked by hand. Eight a second, Duty a half, an edge of 12 ms: 0.096 of the 125 ms period.
    const shape = bandPulseShape(8, 0.5, 0.012)
    expect(shape.duty).toBe(0.5)
    expect(shape.edge).toBeCloseTo(0.096, 12)
    expect(bandPulseOpen(0, shape)).toBe(0)
    expect(bandPulseOpen(0.024, shape)).toBeCloseTo(0.5 - 0.5 * Math.SQRT1_2, 12)
    expect(bandPulseOpen(0.048, shape)).toBeCloseTo(0.5, 12)
    expect(bandPulseOpen(0.096, shape)).toBe(1)
    expect(bandPulseOpen(0.3, shape)).toBe(1)
    // The fall begins at Duty: half way down half an edge later, so the pulse
    // is on for Duty of the period between its two half heights.
    expect(bandPulseOpen(0.5, shape)).toBeCloseTo(1, 12)
    expect(bandPulseOpen(0.548, shape)).toBeCloseTo(0.5, 12)
    expect(bandPulseOpen(0.596, shape)).toBeCloseTo(0, 12)
    expect(bandPulseOpen(0.7, shape)).toBe(0)
    expect(bandPulseOpen(0.999, shape)).toBe(0)
    // An edge is held to half of the shorter of the on time and the gap: at 40
    // a second and half Duty no edge is longer than a quarter of a period,
    // 6.25 ms, and with Duty at 0.1 or 0.9 than a twentieth, 1.25 ms.
    expect(bandPulseShape(40, 0.5, 0.05).edge).toBeCloseTo(0.25, 12)
    expect(bandPulseShape(40, 0.1, 0.002).edge).toBeCloseTo(0.05, 12)
    expect(bandPulseShape(40, 0.9, 0.002).edge).toBeCloseTo(0.05, 12)
    expect(bandPulseShape(0.5, 0.5, 0.05).edge).toBeCloseTo(0.025, 12)
  })

  it('reads a pulse where it turns: at its four corners, and along its edges about every pixel and a half', () => {
    const shape = bandPulseShape(8, 0.5, 0.012)
    // A period 27 px wide: an edge is 2.6 px and is drawn in two parts.
    const coarse = bandPulseBreaks(shape, 27)
    expect(coarse.length).toBe(6)
    ;[0, 0.048, 0.096, 0.5, 0.548, 0.596].forEach((at, i) => expect(coarse[i]).toBeCloseTo(at, 12))
    // 90 px wide, the edge is 8.6 px and is read at seven places.
    const fine = bandPulseBreaks(shape, 90)
    expect(fine.length).toBe(14)
    expect([fine[0], fine[7]]).toEqual([0, 0.5])
    expect(fine[6]).toBeCloseTo(0.096, 12)
    expect(fine[13]).toBeCloseTo(0.596, 12)
    // Never in more than 24 parts, however wide.
    expect(bandPulseBreaks(shape, 5000).length).toBe(50)
  })

  it('reads Depth as the kit does: the gap is left (1 - Depth) squared, and a pulse only turns down', () => {
    expect(bandPulseFloor(0)).toBe(1)
    expect(bandPulseFloor(0.6)).toBeCloseTo(0.16, 12)
    expect(bandPulseFloor(0.5)).toBe(0.25)
    expect(bandPulseFloor(1)).toBe(0)
    expect(bandPulseGain(0, 0.16)).toBe(0.16)
    expect(bandPulseGain(0.5, 0.16)).toBeCloseTo(0.58, 12)
    expect(bandPulseGain(1, 0.16)).toBe(1)
    // With Depth at 0 the level is 1 wherever the pulse stands.
    for (const open of [0, 0.3, 1]) expect(bandPulseGain(open, bandPulseFloor(0))).toBe(1)
  })

  it('reads the knobs as the device applies them', () => {
    const set = settingsOf({ rate: 5, depth: 0.7, duty: 0.4, edge: 15, offset: 90 })
    expect(set.rate).toBe(5)
    expect(set.shape.duty).toBe(0.4)
    expect(set.shape.edge).toBeCloseTo(0.075, 12)
    expect(set.floor).toBeCloseTo(0.09, 12)
    expect(set.behind).toBe(0.25)
    expect([set.low, set.high]).toEqual([200, 1000])
    // The right side reads the same clock a quarter of a period later.
    expect(bandPulseLevelAt(0.3, set)).toBe(1)
    expect(bandPulseLevelAt(0.3, set, true)).toBeCloseTo(
      bandPulseGain(bandPulseOpen(0.05, set.shape), 0.09),
      12,
    )
    expect(bandPulseLevelAt(0.1, set, true)).toBeCloseTo(0.09, 12)
  })

  it('holds the top of the band half an octave over its bottom, as the split does', () => {
    expect(BAND_PULSE_MARGIN).toBe(MARGIN)
    expect(bandPulseEdges(200, 1000)).toEqual({ low: 200, high: 1000 })
    expect(bandPulseEdges(400, 400).high).toBeCloseTo(400 * MARGIN, 9)
    expect(bandPulseEdges(400, 600)).toEqual({ low: 400, high: 600 })
    expect(settingsOf({ low: 400, high: 400 }).high).toBeCloseTo(565.685, 2)
  })
})

describe('what the Band Pulse display says is heard, against the device at 48 kHz', () => {
  it('gives the band the level the device gives it, a sample at a time, on both sides', async () => {
    // A tone at the middle of the band; `whole` where the band is four octaves
    // wide, so that almost nothing of the tone lies outside it and the level
    // law shows whole.
    const cases: { values: Values; hz: number; whole?: boolean }[] = [
      { values: { low: 100, high: 1600 }, hz: 400, whole: true },
      {
        values: { rate: 3, depth: 1, duty: 0.25, edge: 50, offset: 90, low: 100, high: 1600 },
        hz: 400,
        whole: true,
      },
      // The fastest and the shortest: the edge is held to 1.25 ms, the sides take turns.
      {
        values: { rate: 40, depth: 1, duty: 0.1, edge: 2, offset: 180, low: 100, high: 1600 },
        hz: 400,
        whole: true,
      },
      // The edge asked for is 50 ms and is held to 6.25 ms; the band as it starts.
      { values: { rate: 40, depth: 0.8, edge: 50, offset: 120 }, hz: 447 },
      // High under its least: the split holds it half an octave over Low.
      {
        values: { rate: 13.7, depth: 0.3, duty: 0.9, edge: 5, offset: 37, low: 400, high: 400 },
        hz: 476,
      },
      { values: { rate: 0.5, depth: 0.45, duty: 0.35, edge: 50, offset: 60 }, hz: 447 },
    ]
    for (const { values, hz, whole } of cases) {
      const set = settingsOf(values)
      const { left, right } = await toneLevels(values, hz, 2.6)
      let worst = 0
      let offLaw = 0
      // From 0.1 s in: the split starts empty and takes some tens of milliseconds to hold a tone.
      for (let n = 4800; n < left.length; n++) {
        const gone = (n * set.rate) / RATE
        const [l, r] = [bandPulseLevelAt(gone, set), bandPulseLevelAt(gone, set, true)]
        worst = Math.max(
          worst,
          Math.abs(left[n] - bandPulseHeard(hz, l, set.low, set.high, RATE)),
          Math.abs(right[n] - bandPulseHeard(hz, r, set.low, set.high, RATE)),
        )
        offLaw = Math.max(offLaw, Math.abs(left[n] - l), Math.abs(right[n] - r))
      }
      // (The worst of them all reads 5e-6.)
      expect(worst, JSON.stringify(values)).toBeLessThan(2e-5)
      // Four octaves wide, the tone at the middle is the level law itself, to a hundredth.
      if (whole) expect(offLaw, JSON.stringify(values)).toBeLessThan(0.01)
    }
  })

  it('leaves of each frequency what the device leaves in a gap', async () => {
    // One pulse every two seconds, on for a tenth of it: from 0.25 s to 2 s is gap.
    const slow = { rate: 0.5, duty: 0.1, edge: 50 }
    const cases: { values: Values; tones: number[] }[] = [
      {
        values: { ...slow, depth: 1 },
        tones: [50, 100, 141, 200, 300, 447, 700, 1000, 1414, 2000, 4000, 9000],
      },
      { values: { ...slow, depth: 1, low: 60, high: 4000 }, tones: [30, 60, 490, 4000, 8000] },
      { values: { ...slow, depth: 1, low: 300, high: 600 }, tones: [212, 300, 424, 600, 849] },
      { values: { ...slow, depth: 0.5 }, tones: [200, 447, 1000] },
      { values: { ...slow, depth: 1, low: 400, high: 400 }, tones: [400, 476, 566] },
    ]
    for (const { values, tones } of cases) {
      const set = settingsOf(values)
      for (const hz of tones) {
        const { left, right } = await toneLevels(values, hz, 2.3)
        const said = bandPulseHeard(hz, set.floor, set.low, set.high, RATE)
        // In the gap, both sides, every hundredth sample of half a second.
        for (let n = RATE; n < 1.5 * RATE; n += 100) {
          for (const heard of [left[n], right[n]])
            expect(Math.abs(heard - said), `${JSON.stringify(values)} at ${hz} Hz`).toBeLessThan(
              5e-5,
            )
        }
        // And on the top of the next pulse the tone is as it came: the three parts add up to it.
        for (let n = Math.round(2.06 * RATE); n < 2.19 * RATE; n += 100)
          expect(Math.abs(left[n] - 1), `${JSON.stringify(values)} at ${hz} Hz, on`).toBeLessThan(
            5e-5,
          )
        expect(bandPulseHeard(hz, 1, set.low, set.high, RATE)).toBeCloseTo(1, 9)
      }
    }
  }, 120_000)

  it('says how deep a gap is where the checker measured it: only as deep as the band is wide', () => {
    // With the edges as they start (200 Hz and 1 kHz) and Depth at full, a
    // tone at the middle falls to 2 / (1 + r squared) with r = 5: 22.3 dB.
    const set = settingsOf({ depth: 1 })
    // The checker read 22.5 dB off the device.
    expect(Math.abs(bandPulseDepthDb(set, RATE) - toDb(2 / 26))).toBeLessThan(0.3)
    expect(bandPulseDepthDb(set, RATE)).toBeCloseTo(-22.5, 1)
    // A tone at Low or at High only halves, and one an octave outside moves about half a decibel.
    expect(Math.abs(toDb(bandPulseHeard(200, 0, 200, 1000, RATE)) + 6)).toBeLessThan(0.5)
    expect(Math.abs(toDb(bandPulseHeard(1000, 0, 200, 1000, RATE)) + 6)).toBeLessThan(0.5)
    expect(Math.abs(toDb(bandPulseHeard(100, 0, 200, 1000, RATE)))).toBeLessThan(0.7)
    expect(Math.abs(toDb(bandPulseHeard(2000, 0, 200, 1000, RATE)))).toBeLessThan(0.7)
    // A band an octave wide dips 9 dB, and four octaves are needed for 40 dB.
    expect(bandPulseDepthDb(settingsOf({ depth: 1, low: 300, high: 600 }), RATE)).toBeCloseTo(-9, 0)
    expect(bandPulseDepthDb(settingsOf({ depth: 1, low: 100, high: 1600 }), RATE)).toBeLessThan(-40)
    // With Depth at 0 nothing is taken away anywhere.
    expect(bandPulseDepthDb(settingsOf({ depth: 0 }), RATE)).toBeCloseTo(0, 9)
  })
})

describe('the Band Pulse display', () => {
  // On a plate at rest beside two columns of knobs: 128 by 100.
  const size = { width: 128, height: 100 }
  const upright = { width: 204, height: 100 }

  it('is laid out from the size it is given: the lanes above, a line of words, the frequency axis below', () => {
    expect(bandPulseLayout(size)).toEqual({
      lanes: { x: 15, y: 7, w: 107, h: 35 },
      mid: 24.5,
      lane: 17,
      base: 51,
      left: 6,
      right: 122,
      bar: 54,
      plot: { x: 6, y: 58, w: 116, h: 36 },
    })
    expect(bandPulseLayout(upright).lanes).toEqual({ x: 15, y: 7, w: 183, h: 35 })
    expect(bandPulseLayout(upright).plot).toEqual({ x: 6, y: 58, w: 192, h: 36 })
    for (const shape of [size, upright, { width: 293, height: 100 }]) {
      const lay = bandPulseLayout(shape)
      // The lanes, the words (8 px on their line), the bar and the axis stand one under the other.
      expect(lay.lanes.y + lay.lanes.h).toBeLessThanOrEqual(lay.base - 8)
      expect(lay.base).toBeLessThan(lay.bar)
      expect(lay.bar + 2).toBeLessThan(lay.plot.y)
      expect(lay.plot.y + lay.plot.h).toBe(shape.height - 6)
      expect(lay.lanes.x + lay.lanes.w).toBe(shape.width - 6)
    }
  })

  it('shows two to five whole pulses over a round length of time, and writes that time', () => {
    const spans = [0.5, 0.9, 1, 2, 3.9, 4, 8, 9.9, 10, 20, 39, 40].map((rate) =>
      bandPulseSpanText(bandPulseSpan(rate)),
    )
    expect(spans).toEqual([
      '4 s',
      '4 s',
      '2 s',
      '1 s',
      '1 s',
      '500 ms',
      '500 ms',
      '500 ms',
      '200 ms',
      '100 ms',
      '100 ms',
      '50 ms',
    ])
    for (let rate = 0.5; rate <= 40; rate *= 1.013) {
      const pulses = bandPulseSpan(rate) * rate
      expect(pulses).toBeGreaterThanOrEqual(2 - 1e-9)
      expect(pulses).toBeLessThan(5)
    }
    // Written between the two pictures, after the depth of the gap at the band's middle. As it
    // starts, a thirteenth of the tone lies outside the band and 0.16 is left of the rest:
    // 0.077 + 0.16 x 0.923 is 0.22, 13 dB down.
    const drawn = drawDisplay(display, BAND_PULSE_PARAMS, { ...size })
    expect(drawn.words()).toEqual(['L', 'R', '−13.0 dB', '500 ms'])
    expect(
      drawDisplay(display, BAND_PULSE_PARAMS, { values: { rate: 40, depth: 1 } }).words(),
    ).toEqual(['L', 'R', '−22.5 dB', '50 ms'])
    // A tick on the middle line where each period begins: five for four pulses.
    const { mid } = bandPulseLayout(size)
    const ticks = (rate: number): number =>
      drawnPaths(drawDisplay(display, BAND_PULSE_PARAMS, { values: { rate }, ...size })).filter(
        (path) =>
          path.kind === 'stroke' &&
          path.points.length === 2 &&
          path.alpha === INK.rule &&
          path.points[0][0] === path.points[1][0] &&
          Math.abs((path.points[0][1] + path.points[1][1]) / 2 - mid) < 1e-9,
      ).length
    expect(ticks(8)).toBe(5)
    expect(ticks(0.5)).toBe(3)
    expect(ticks(9.9)).toBe(5)
    expect(ticks(40)).toBe(3)
  })

  it("draws each side's lane as the level the band is given, the right side behind by Offset", () => {
    const cases: Values[] = [
      {},
      { rate: 3, depth: 1, duty: 0.25, edge: 50, offset: 90 },
      { rate: 40, depth: 1, duty: 0.1, edge: 2, offset: 180 },
      { rate: 13.7, depth: 0.3, duty: 0.9, edge: 5, offset: 37 },
      { rate: 0.5, depth: 0.8, duty: 0.5, edge: 50, offset: 120 },
    ]
    for (const shape of [size, upright]) {
      const { lanes, mid, lane } = bandPulseLayout(shape)
      for (const values of cases) {
        const set = settingsOf(values)
        const pulses = bandPulseSpan(set.rate) * set.rate
        const { upper, lower } = lines(
          drawDisplay(display, BAND_PULSE_PARAMS, { values, ...shape }),
        )
        for (const [line, right] of [
          [upper, false],
          [lower, true],
        ] as const) {
          const height = (x: number): number => {
            const level = bandPulseLevelAt(((x - lanes.x) / lanes.w) * pulses, set, right)
            return right ? mid + 0.5 + level * lane : mid - 0.5 - level * lane
          }
          expect(line.points[0][0]).toBeCloseTo(lanes.x, 9)
          expect(line.points[line.points.length - 1][0]).toBeCloseTo(lanes.x + lanes.w, 9)
          // Every point of the line is on the level there, and between its
          // points the line is the level too: at every half pixel across,
          // within half a pixel of where it runs a third of a pixel either side.
          for (const [x, y] of line.points) expect(Math.abs(y - height(x))).toBeLessThan(1e-6)
          let worst = 0
          for (let x = lanes.x; x <= lanes.x + lanes.w; x += 0.5) {
            const said = [height(x - 0.34), height(x), height(x + 0.34)]
            const y = heightAt(line.points, x)
            worst = Math.max(worst, Math.min(...said) - y, y - Math.max(...said))
          }
          expect(worst, `${JSON.stringify(values)} ${right ? 'right' : 'left'}`).toBeLessThan(0.5)
        }
        // With no Offset the two lanes are one picture, mirrored in the middle line.
        if (!values.offset)
          upper.points.forEach(([, y], i) =>
            expect(lower.points[i][1] - mid).toBeCloseTo(mid - y, 9),
          )
      }
    }
  })

  it('draws in the lanes the level that comes out of the device: a tone at the middle of a four octave band, both sides', async () => {
    // Eight a second, so the lanes are four pulses long; the device is read
    // four pulses after its start, when the split holds the tone.
    const values = { rate: 8, depth: 1, duty: 0.4, edge: 12, offset: 90, low: 100, high: 1600 }
    const { left, right } = await toneLevels(values, 400, 1.02)
    for (const shape of [size, upright]) {
      const { lanes, mid, lane } = bandPulseLayout(shape)
      const { upper, lower } = lines(drawDisplay(display, BAND_PULSE_PARAMS, { values, ...shape }))
      const heard = (side: Float64Array, x: number): number =>
        side[Math.round((0.5 + ((x - lanes.x) / lanes.w) * 0.5) * RATE)]
      let worst = 0
      for (let x = lanes.x + 0.5; x <= lanes.x + lanes.w - 0.5; x += 0.5) {
        for (const [line, side, sign] of [
          [upper, left, -1],
          [lower, right, 1],
        ] as const) {
          const drawn = (sign * (heightAt(line.points, x) - mid) - 0.5) / lane
          const said = [heard(side, x - 0.34), heard(side, x), heard(side, x + 0.34)]
          worst = Math.max(worst, Math.min(...said) - drawn, drawn - Math.max(...said))
        }
      }
      // Within half a pixel of a lane 17 px high, and the hundredth of the tone that lies outside the band.
      expect(worst).toBeLessThan(0.5 / lane + 0.01)
    }
  })

  it('draws on the frequency axis what a gap leaves of each frequency, the sound as it came along the top', () => {
    const cases: Values[] = [
      {},
      { depth: 1 },
      { depth: 1, low: 60, high: 4000 },
      { depth: 1, low: 300, high: 600 },
      { depth: 0.5, low: 400, high: 400 },
      { depth: 0 },
    ]
    for (const shape of [size, upright]) {
      const { plot } = bandPulseLayout(shape)
      for (const values of cases) {
        const set = settingsOf(values)
        const { curve } = lines(drawDisplay(display, BAND_PULSE_PARAMS, { values, ...shape }))
        const height = (x: number): number => {
          const hz =
            BAND_PULSE_MIN_HZ *
            Math.pow(BAND_PULSE_MAX_HZ / BAND_PULSE_MIN_HZ, (x - plot.x) / plot.w)
          const db = Math.max(
            BAND_PULSE_FOOT_DB,
            toDb(bandPulseHeard(hz, set.floor, set.low, set.high, RATE)),
          )
          return plot.y + (db / BAND_PULSE_FOOT_DB) * plot.h
        }
        expect(curve.points[0][0]).toBe(plot.x)
        expect(curve.points[curve.points.length - 1][0]).toBeCloseTo(plot.x + plot.w, 9)
        for (const [x, y] of curve.points) expect(Math.abs(y - height(x))).toBeLessThan(1e-6)
        let worst = 0
        for (let x = plot.x; x <= plot.x + plot.w; x += 0.5)
          worst = Math.max(worst, Math.abs(heightAt(curve.points, x) - height(x)))
        expect(worst, JSON.stringify(values)).toBeLessThan(0.5)
        // Nothing stands over the level the sound came in at, or under the foot.
        for (const [, y] of curve.points) {
          expect(y).toBeGreaterThanOrEqual(plot.y - 1e-9)
          expect(y).toBeLessThanOrEqual(plot.y + plot.h + 1e-9)
        }
      }
      // With Depth at 0 the line lies along the top: nothing is taken away.
      const flat = lines(
        drawDisplay(display, BAND_PULSE_PARAMS, { values: { depth: 0 }, ...shape }),
      )
      for (const [, y] of flat.curve.points) expect(y).toBeCloseTo(plot.y, 6)
    }
  })

  it('draws on the frequency axis what the device leaves of a tone in a gap', async () => {
    const values = { rate: 0.5, duty: 0.1, edge: 50, depth: 1 }
    const { plot } = bandPulseLayout(size)
    const { curve } = lines(drawDisplay(display, BAND_PULSE_PARAMS, { values, ...size }))
    for (const hz of [60, 141, 200, 447, 1000, 1414, 3000]) {
      const { left } = await toneLevels(values, hz, 1.3)
      // One second in is the middle of a gap.
      const heardDb = Math.max(BAND_PULSE_FOOT_DB, toDb(left[RATE]))
      const x = xOfHz(hz, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
      const drawnDb = (BAND_PULSE_FOOT_DB * (heightAt(curve.points, x) - plot.y)) / plot.h
      // A pixel of the axis is 1.3 dB: the line is read to under half of one.
      expect(Math.abs(drawnDb - heardDb), `${hz} Hz`).toBeLessThan(0.6)
    }
    // The depth written is the device's at the middle of the band.
    const middle = await toneLevels(values, Math.sqrt(200 * 1000), 1.3)
    expect(drawDisplay(display, BAND_PULSE_PARAMS, { values, ...size }).words()).toContain(
      dbText(toDb(middle.left[RATE])),
    )
  })

  it('lays a bar over the band that is pulsed, from Low to High as the split holds them', () => {
    const { plot, bar: barY } = bandPulseLayout(size)
    const x = (hz: number): number => xOfHz(hz, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)
    const over = bar(drawDisplay(display, BAND_PULSE_PARAMS, { ...size }))
    expect(over.x).toBeCloseTo(x(200), 9)
    expect(over.x + over.w).toBeCloseTo(x(1000), 9)
    expect([over.y, over.h]).toEqual([barY, 2])
    // 200 Hz to 1 kHz is 2.32 of the 8.64 octaves across.
    expect(over.w / plot.w).toBeCloseTo(Math.log2(5) / Math.log2(400), 9)
    const held = bar(
      drawDisplay(display, BAND_PULSE_PARAMS, { values: { low: 400, high: 400 }, ...size }),
    )
    expect(held.x).toBeCloseTo(x(400), 9)
    expect(held.x + held.w).toBeCloseTo(x(400 * MARGIN), 6)
  })
})

describe('the points of the Band Pulse display', () => {
  const size = { width: 128, height: 100 }
  const { lanes, mid, lane, plot } = bandPulseLayout(size)
  const x = (hz: number): number => xOfHz(hz, plot, BAND_PULSE_MIN_HZ, BAND_PULSE_MAX_HZ)

  it("stands Offset where the right side's first pulse begins to rise, and Low and High on the line at the band's edges", () => {
    const { offset, low, high } = handlesAt({}, size)
    expect([offset.name, low.name, high.name]).toEqual(['Offset', 'Low', 'High'])
    // With no Offset the right side begins with the left, at the lanes' left end, on the level of a gap.
    expect(offset.x).toBe(lanes.x)
    expect(offset.y).toBeCloseTo(mid + 0.5 + 0.16 * lane, 9)
    // A quarter of a period behind, of the four periods across: a sixteenth of the way.
    const quarter = handlesAt({ offset: 90 }, size).offset
    expect(quarter.x).toBeCloseTo(lanes.x + lanes.w / 16, 9)
    const { lower, curve } = lines(
      drawDisplay(display, BAND_PULSE_PARAMS, { values: { offset: 90 }, ...size }),
    )
    expect(heightAt(lower.points, quarter.x)).toBeCloseTo(quarter.y, 6)
    // The right side's lane leaves the gap's level there: level before it, rising after.
    expect(heightAt(lower.points, quarter.x - 2)).toBeCloseTo(quarter.y, 6)
    expect(heightAt(lower.points, quarter.x + 3)).toBeGreaterThan(quarter.y + 0.5)
    expect(low.x).toBeCloseTo(x(200), 9)
    expect(high.x).toBeCloseTo(x(1000), 9)
    expect(Math.abs(heightAt(curve.points, low.x) - low.y)).toBeLessThan(0.3)
    expect(Math.abs(heightAt(curve.points, high.x) - high.y)).toBeLessThan(0.3)
    // At full Depth a tone at Low or at High halves: the rings stand 6 dB down, an eighth of the way to the foot.
    const full = handlesAt({ depth: 1 }, size)
    for (const ring of [full.low, full.high])
      expect(Math.abs(ring.y - yOfDb(-6, plot, 0, BAND_PULSE_FOOT_DB))).toBeLessThan(0.4)
    // With Depth at 0 they stand on the top line, and Offset's ring on the level of the whole band.
    const none = handlesAt({ depth: 0 }, size)
    expect(none.low.y).toBeCloseTo(plot.y, 6)
    expect(none.high.y).toBeCloseTo(plot.y, 6)
    expect(none.offset.y).toBeCloseTo(mid + 0.5 + lane, 9)
  })

  it('draws its points where they stand', () => {
    for (const values of [{}, { offset: 120, depth: 1, low: 90, high: 3000 }] as Values[]) {
      const drawn = drawDisplay(display, BAND_PULSE_PARAMS, { values, ...size })
      const rings = drawn.calls
        .filter((call) => call.name === 'arc' && call.args[2] === 3.5)
        .map((call) => [call.args[0], call.args[1]])
      const { offset, low, high } = handlesAt(values, size)
      expect(rings).toEqual([
        [offset.x, offset.y],
        [low.x, low.y],
        [high.x, high.y],
      ])
    }
  })

  it('moves Offset by time: to the right is later, by half a period at the most', () => {
    // Eight a second: four periods across, so half a period is an eighth of the lanes.
    const { offset } = handlesAt({}, size)
    expect(offset.drag(lanes.x + lanes.w / 16, 0)).toEqual({ offset: 90 })
    expect(offset.drag(lanes.x + lanes.w / 12, 0).offset).toBeCloseTo(120, 9)
    expect(offset.drag(lanes.x + lanes.w / 8, 0).offset).toBeCloseTo(180, 9)
    expect(offset.drag(lanes.x + lanes.w, 0)).toEqual({ offset: 180 })
    expect(offset.drag(0, 0)).toEqual({ offset: 0 })
    // One pulse every two seconds: two periods across, so half a period is a quarter of the lanes.
    const slow = handlesAt({ rate: 0.5, offset: 45 }, size).offset
    expect(slow.x).toBeCloseTo(lanes.x + lanes.w / 16, 9)
    expect(slow.drag(lanes.x + lanes.w / 4, 0).offset).toBeCloseTo(180, 9)
    // Taken and not moved it stays where it is, and a double press puts it back.
    expect(slow.drag(slow.x, slow.y)).toEqual({ offset: 45 })
    expect(slow.reset?.()).toEqual({ offset: 0 })
  })

  it('moves Low and High across the frequency axis, each inside its own range', () => {
    const { low, high } = handlesAt({}, size)
    expect(low.drag(x(100), 0).low).toBeCloseTo(100, 6)
    expect(Object.keys(low.drag(x(100), 0))).toEqual(['low'])
    expect(low.drag(0, 0)).toEqual({ low: 60 })
    expect(low.drag(x(2000), 0)).toEqual({ low: 400 })
    expect(high.drag(x(2500), 0).high).toBeCloseTo(2500, 6)
    expect(Object.keys(high.drag(x(2500), 0))).toEqual(['high'])
    expect(high.drag(size.width, 0)).toEqual({ high: 4000 })
    expect(high.drag(0, 0)).toEqual({ high: 400 })
    expect(low.drag(low.x, low.y)).toEqual({ low: 200 })
    expect(high.drag(high.x, high.y)).toEqual({ high: 1000 })
    expect(low.reset?.()).toEqual({ low: 200 })
    expect(high.reset?.()).toEqual({ high: 1000 })
  })

  it('stands High where the split holds it, and leaves its setting alone when it is taken and not moved', () => {
    const { high } = handlesAt({ low: 400, high: 400 }, size)
    expect(high.x).toBeCloseTo(x(400 * MARGIN), 6)
    expect(high.drag(high.x, high.y)).toEqual({ high: 400 })
    // Moved, it sets the frequency under the hand.
    expect(high.drag(x(800), 0).high).toBeCloseTo(800, 6)
  })
})

describe('the Band Pulse display in time', () => {
  const wrap = (cycles: number): number => cycles - Math.floor(cycles)

  /**
   * A display drawn as the plate draws it for two seconds at 30 frames a
   * second, with the device's own pulse at `rate` in the sound's level and in
   * the readings it is handed: every number of every frame, in the order
   * drawn (each coordinate, each width, each strength an ink is laid at).
   */
  function timed(shown: PlateDisplay, rate: number, values: Values = {}): number[][] {
    const set = settingsOf({ ...values, rate })
    const state = shown.init?.()
    const frames: number[][] = []
    for (let n = 0; n < 60; n++) {
      const time = n / 30
      const level = bandPulseLevelAt(time * rate, set)
      const signal = { ...testSignal(0.5, 0.35 * level), right: testLevel(0.35 * level) }
      const drawn = drawDisplay(shown, BAND_PULSE_PARAMS, {
        values: { ...values, rate },
        meters: { place: wrap(time * rate), level },
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
   * numbers a frame has (a mark that comes and goes).
   */
  function mostTurns(frames: readonly (readonly number[])[], fps = 30): number {
    const slots = Math.max(...frames.map((frame) => frame.length))
    let most = 0
    for (let slot = -1; slot < slots; slot++) {
      const series = frames.map((frame) => (slot < 0 ? frame.length : (frame[slot] ?? 0)))
      const turns: number[] = []
      let way = 0
      for (let n = 1; n < series.length; n++) {
        const step = Math.sign(series[n] - series[n - 1])
        if (step === 0) continue
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

  it('is counted rightly: a patch that follows the pulse turns back far more than six times a second', () => {
    // Six a second seen at 30 frames a second is five frames a pulse: up and down twelve times.
    expect(mostTurns(timed(flashing, 6))).toBe(12)
    expect(mostTurns(timed(flashing, 10))).toBe(20)
    // Forty a second is seen as ten: a frame is one and a third periods.
    expect(mostTurns(timed(flashing, 40))).toBe(20)
    // A swell every two seconds turns once a second, which is slow enough to follow.
    expect(mostTurns(timed(flashing, 0.5))).toBeLessThanOrEqual(1)
  })

  it('never turns back more than six times in any second, at half a pulse a second, six, ten and forty', () => {
    const settings: Values[] = [
      {},
      { depth: 1, duty: 0.1, edge: 2, offset: 180 },
      { depth: 1, duty: 0.9, edge: 50, offset: 90, low: 60, high: 4000 },
    ]
    for (const rate of [0.5, 6, 10, 40]) {
      for (const values of settings) {
        const frames = timed(display, rate, values)
        expect(frames.length).toBe(60)
        expect(frames[0].length).toBeGreaterThan(100)
        expect(mostTurns(frames), `${rate} a second ${JSON.stringify(values)}`).toBeLessThanOrEqual(
          6,
        )
        // It is drawn from the controls alone, so in fact nothing on it moves at all.
        for (const frame of frames) expect(frame).toEqual(frames[0])
      }
    }
  })
})
