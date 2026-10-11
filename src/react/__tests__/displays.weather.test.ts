// The truth of the Weather display: what it draws against the device it
// stands for. The shapes and rates the display is drawn from are checked
// against the compiled device's own readings (a wave, a shadow, the drops a
// second, how far the level sinks, how often things come), the sample a still
// display shows against the device's weather over minutes, and the drawing
// against the formulas and the readings it is handed.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { WEATHER_PARAMS } from '../../dsp/devices/weather.gen'
import { PLAIN_COLOURS, crisp } from '../components/display-kit'
import {
  CLOUDS,
  DIP_DB,
  DIP_FULL_DB,
  RAIN,
  SHADE_DB,
  SURF,
  THUNDER,
  WEATHER_FACES,
  WEATHER_KINDS,
  WIND,
  cloudShape,
  heardDipDb,
  rainCover,
  rainDuckShare,
  rainFloor,
  rainRate,
  sampleWeather,
  surfShape,
  weatherColumns,
  weatherDash,
  weatherEvent,
  weatherLayout,
  weatherLull,
  weatherSpanSec,
  type WeatherKind,
} from '../components/displays/weather'
import { type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const BLOCK = 128
const BLOCK_SEC = BLOCK / RATE
const params: Readonly<Record<string, ParamSpec>> = WEATHER_PARAMS
const display: PlateDisplay = WEATHER_FACES.weather.display
const kindOf = (kind: WeatherKind): number => WEATHER_KINDS.indexOf(kind)

// --- The device ---------------------------------------------------------------

interface Readings {
  /** A reading for every block of 128 frames. */
  level: Float32Array
  gain: Float32Array
  top: Float32Array
  /** The counts when the run ended. */
  drops: number
  rolls: number
}

function meter(device: WasmDeviceHarness, index: number): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(index)
}

/** The device left out in a weather for `seconds`, under a quiet tone that keeps it awake. */
async function weatherRun(
  values: Readonly<Record<string, number>>,
  seconds: number,
): Promise<Readings> {
  const device = await loadWasmDevice('weather', RATE)
  for (const [name, value] of Object.entries(values)) device.set(params[name], value)
  const blocks = Math.round(seconds / BLOCK_SEC)
  const level = new Float32Array(blocks)
  const gain = new Float32Array(blocks)
  const top = new Float32Array(blocks)
  const block = new Float32Array(BLOCK)
  for (let n = 0; n < blocks; n++) {
    for (let i = 0; i < BLOCK; i++)
      block[i] = 0.05 * Math.sin(((n * BLOCK + i) * 2 * Math.PI * 220) / RATE)
    device.processBlock(block)
    level[n] = meter(device, 0)
    gain[n] = meter(device, 1)
    top[n] = meter(device, 5)
  }
  return { level, gain, top, drops: meter(device, 2), rolls: meter(device, 4) }
}

/** Ten minutes of each Kind's own time (Pace 4), at one Calm: run once and read by more than one test. */
const LONG = { pace: 4, seconds: 150, calm: 0.4 } as const
const longRuns = new Map<WeatherKind, Promise<Readings>>()
function longRun(kind: WeatherKind): Promise<Readings> {
  let run = longRuns.get(kind)
  if (!run) {
    run = weatherRun(
      { kind: kindOf(kind), force: 1, calm: LONG.calm, sway: 0, pace: LONG.pace },
      LONG.seconds,
    )
    longRuns.set(kind, run)
  }
  return run
}
/** Some of these run the compiled device for minutes of sound, and the rest draw hundreds of frames. */
const SLOW = 120_000

const meanOf = (values: ArrayLike<number>, from = 0, to = values.length): number => {
  let sum = 0
  for (let n = from; n < to; n++) sum += values[n]
  return sum / Math.max(1, to - from)
}

/** How many times a line goes up through `above` after having been under `below`. */
function risings(values: Iterable<number>, below: number, above: number): number {
  let count = 0
  let down = true
  for (const value of values) {
    if (down && value > above) {
      count += 1
      down = false
    } else if (!down && value < below) down = true
  }
  return count
}

// --- What was drawn -------------------------------------------------------------

interface Drawn {
  how: 'stroke' | 'fill'
  points: [number, number][]
  rects: [number, number, number, number][]
  arcs: [number, number, number][]
  colour: string
  alpha: number
  width: number
  dash: number[]
}

/** Every path a drawing stroked or filled, with what it was painted in. */
function pathsOf(drawn: RecordingContext): Drawn[] {
  const out: Drawn[] = []
  let points: [number, number][] = []
  let rects: [number, number, number, number][] = []
  let arcs: [number, number, number][] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let width = 1
  let dash: number[] = []
  for (const call of drawn.calls) {
    const args = call.args as number[]
    switch (call.name) {
      case 'beginPath':
        points = []
        rects = []
        arcs = []
        break
      case 'moveTo':
      case 'lineTo':
        points.push([args[0], args[1]])
        break
      case 'rect':
        rects.push([args[0], args[1], args[2], args[3]])
        break
      case 'arc':
        arcs.push([args[0], args[1], args[2]])
        break
      case 'set fillStyle':
        fill = String(call.args[0])
        break
      case 'set strokeStyle':
        stroke = String(call.args[0])
        break
      case 'set globalAlpha':
        alpha = Number(call.args[0])
        break
      case 'set lineWidth':
        width = Number(call.args[0])
        break
      case 'setLineDash':
        dash = [...(call.args[0] as number[])]
        break
      case 'stroke':
        out.push({ how: 'stroke', points, rects, arcs, colour: stroke, alpha, width, dash })
        break
      case 'fill':
        out.push({ how: 'fill', points, rects, arcs, colour: fill, alpha, width, dash })
        break
      default:
        break
    }
  }
  return out
}

interface Picture {
  /** The line of the weather, and the fill under it when Voice is up. */
  weather: [number, number][][]
  fills: Drawn[]
  /** The line under the band that hangs from the top: what the level loses. */
  band: [number, number][][]
  /** The line under the lighter band: what the top end loses. */
  far: [number, number][][]
  /** The upper line: the most the weather reaches. */
  ceiling: Drawn | undefined
  ticks: Drawn[]
  bolts: Drawn[]
  ring: [number, number, number] | undefined
  nowDot: [number, number, number] | undefined
}

/** The parts of a drawing of this display, told apart by how each is drawn. */
function pictureOf(drawn: RecordingContext, width = 184, height = 48): Picture {
  const lay = weatherLayout({ width, height })
  const all = pathsOf(drawn)
  const long = (path: Drawn): boolean => path.points.length > 8 && path.arcs.length === 0
  const lines = all.filter((path) => path.how === 'stroke' && long(path))
  const arcs = all.flatMap((path) => path.arcs)
  return {
    weather: lines.filter((path) => path.width === 1.5).map((path) => path.points),
    fills: all.filter(
      (path) => path.how === 'fill' && long(path) && path.points[0][1] === lay.foot,
    ),
    band: lines.filter((path) => path.width === 1).map((path) => path.points),
    far: lines.filter((path) => path.width === 0.75).map((path) => path.points),
    ceiling: all.find(
      (path) =>
        path.how === 'stroke' &&
        path.points.length === 2 &&
        path.points[0][0] === lay.now &&
        path.points[1][0] === lay.left,
    ),
    ticks: all.filter((path) => path.how === 'fill' && path.rects.length > 0),
    bolts: all.filter(
      (path) =>
        path.how === 'stroke' &&
        path.points.length > 0 &&
        path.points.length % 4 === 0 &&
        path.points.length <= 64 * 4 &&
        path.points[0][1] === lay.laneTop &&
        path.points[1][1] !== lay.laneTop,
    ),
    ring: arcs.find((arc) => arc[2] === 3.5 || arc[2] === 4.5),
    nowDot: arcs.find((arc) => arc[2] === 2.5),
  }
}

/** The display run for `seconds` on the readings `each` gives for a moment (seconds from the start). */
function live(
  values: Readonly<Record<string, number>>,
  seconds: number,
  each: (time: number) => Record<string, number>,
  options: FrameOptions = {},
): RecordingContext {
  return runDisplay(display, params, seconds, { values, ...options }, (time) => ({
    meters: { level: 0, gain: 1, drops: 0, gate: 1, rolls: 0, top: 1, ...each(time) },
  }))
}

const LAY = weatherLayout({ width: 184, height: 48 })

// --- The formulas against the device --------------------------------------------

describe('the shapes the Weather display draws from, against the device', { timeout: SLOW }, () => {
  it('has the wave the device has: it gathers, breaks and draws back', async () => {
    const run = await weatherRun({ kind: kindOf('surf'), force: 1, calm: 0, sway: 0 }, 9)
    // The first wave starts as the device wakes and is over when the reading is back at nothing.
    let top = 0
    for (let n = 0; n < run.level.length; n++) if (run.level[n] > run.level[top]) top = n
    // It is over where the reading stops falling: the next wave gathers as this one lands.
    let end = top
    while (end + 1 < run.level.length && run.level[end + 1] < run.level[end]) end += 1
    expect(end + 1).toBeLessThan(run.level.length)
    expect(run.level[end]).toBeLessThan(1e-3)
    const length = (end + 1) * BLOCK_SEC
    const height = run.level[top]
    expect(length).toBeGreaterThan(SURF.wave * (1 - SURF.jitter) - 0.05)
    expect(length).toBeLessThan(SURF.wave * (1 + SURF.jitter) + 0.05)
    expect(height).toBeGreaterThanOrEqual(SURF.heightMin - 0.01)
    expect(height).toBeLessThanOrEqual(1)
    let worst = 0
    for (let n = 0; n < end; n++) {
      const model = height * surfShape(((n + 1) * BLOCK_SEC) / length)
      worst = Math.max(worst, Math.abs(run.level[n] - model))
    }
    expect(worst, 'the reading against the shape').toBeLessThan(0.02)
    // The shape by hand: half way up when it starts to break, whole when it has, gone at its end.
    expect(surfShape(SURF.gather)).toBeCloseTo(SURF.gatherTo, 6)
    expect(surfShape(SURF.gather + SURF.break)).toBeCloseTo(1, 6)
    expect(surfShape(SURF.gather / 2)).toBeCloseTo(SURF.gatherTo / 4, 6)
    expect(surfShape(1)).toBe(0)
  })

  it('has the shadow the device has: over in a third of its length, lying, and gone', async () => {
    const pace = 2
    const run = await weatherRun({ kind: kindOf('clouds'), force: 1, calm: 0, sway: 0, pace }, 8)
    let start = 0
    while (start < run.level.length && run.level[start] === 0) start += 1
    // It has ended where the reading is back at nothing after having been up.
    let end = start
    while (end < run.level.length && run.level[end] < 0.3) end += 1
    while (end < run.level.length && run.level[end] > 1e-4) end += 1
    expect(end).toBeLessThan(run.level.length)
    // The first shadow comes after kFirstWait of the lull.
    expect(start * BLOCK_SEC * pace).toBeCloseTo(CLOUDS.firstWait * weatherLull('clouds', 0), 1)
    const length = (end - start) * BLOCK_SEC * pace
    expect(length).toBeGreaterThan(CLOUDS.lengthMin - 0.05)
    expect(length).toBeLessThan(CLOUDS.lengthMin + CLOUDS.lengthSpan + 0.05)
    let peak = 0
    for (let n = start; n < end; n++) peak = Math.max(peak, run.level[n])
    // Its depth, thinned by no more than kThin.
    expect(peak).toBeGreaterThan(CLOUDS.depthMin * (1 - CLOUDS.thin) - 0.01)
    expect(peak).toBeLessThanOrEqual(1)
    for (let n = start; n < end; n++) {
      const shape = cloudShape((n - start + 0.5) * BLOCK_SEC * pace, length)
      // While it lies it thins and thickens by a fifth, so the reading is the shape within that.
      expect(run.level[n]).toBeGreaterThan(peak * shape * (1 - CLOUDS.thin) - 0.02)
      expect(run.level[n]).toBeLessThan(peak * shape * (1 + 1.5 * CLOUDS.thin) + 0.02)
    }
    expect(cloudShape(CLOUDS.edge * 10, 10)).toBe(1)
    expect(cloudShape((CLOUDS.edge * 10) / 2, 10)).toBeCloseTo(0.5, 6)
    expect(cloudShape(10, 10)).toBe(0)
  })

  it('sinks the level by what the display says a gust, a shadow and a wave take', async () => {
    const force = 0.8
    const exposure = 0.7
    for (const kind of ['wind', 'clouds', 'surf'] as const) {
      const run = await weatherRun(
        { kind: kindOf(kind), force, exposure, calm: 0, sway: 0, pace: kind === 'wind' ? 1 : 2 },
        12,
      )
      let worst = 0
      let deepest = 0
      for (let n = 8; n < run.level.length; n++) {
        // The reading is Force times the cover; the dip is Force times Exposure times kDipDb times the cover.
        const model = exposure * DIP_DB[kind] * run.level[n]
        const dip = -20 * Math.log10(run.gain[n])
        worst = Math.max(worst, Math.abs(dip - model))
        deepest = Math.max(deepest, dip)
      }
      // The gain glides for 5 ms behind a gust that flutters; a shadow and a wave move slowly.
      expect(worst, `${kind}: the gain against the level`).toBeLessThan(kind === 'wind' ? 0.6 : 0.2)
      expect(deepest, `${kind}: there was something to compare`).toBeGreaterThan(1.5)
    }
  })

  it('drops as many drops a second as the display counts on, and ducks the level about that far', async () => {
    const force = 0.6
    const pace = 1.5
    const exposure = 1
    const seconds = 60
    const run = await weatherRun(
      { kind: kindOf('rain'), force, pace, exposure, calm: 0.2 },
      seconds,
    )
    let expected = 0
    let cover = 0
    let model = 0
    for (let n = 0; n < run.level.length; n++) {
      // The reading in rain is Force times how thick it falls.
      const density = run.level[n] / force
      expect(density).toBeGreaterThan(rainFloor(0.2) - 0.01)
      expect(density).toBeLessThanOrEqual(1.001)
      const rate = rainRate(force, pace, density)
      expected += rate * BLOCK_SEC
      model += rainCover(rate)
      // The gain is Force times Exposure times kDipDb down for a whole cover.
      cover += (-20 * Math.log10(run.gain[n])) / (force * exposure * DIP_DB.rain)
    }
    expect(run.drops / expected, `${run.drops} drops for ${expected}`).toBeGreaterThan(0.9)
    expect(run.drops / expected).toBeLessThan(1.1)
    // The mean of the ducks: the display's is that of a steady fall, the device's of drops that come by chance.
    const ratio = cover / model
    expect(ratio, 'the mean duck against the display').toBeGreaterThan(0.75)
    expect(ratio).toBeLessThan(1.1)
    expect(rainRate(1, 1, 1)).toBe(RAIN.rate)
  })

  it('takes from the top end what the display says a gust, a shadow and a wave take', async () => {
    const force = 0.8
    const exposure = 0.7
    for (const kind of ['wind', 'clouds', 'surf'] as const) {
      const run = await weatherRun(
        { kind: kindOf(kind), force, exposure, calm: 0, sway: 0, pace: kind === 'wind' ? 1 : 2 },
        12,
      )
      let worst = 0
      let deepest = 0
      for (let n = 8; n < run.level.length; n++) {
        // The reading is Force times the cover; the shelves' depth is Force times Exposure times kShadeDb times the cover.
        const model = exposure * SHADE_DB[kind] * run.level[n]
        const shade = -20 * Math.log10(run.top[n])
        worst = Math.max(worst, Math.abs(shade - model))
        deepest = Math.max(deepest, shade)
      }
      expect(worst, `${kind}: the top end against the level`).toBeLessThan(
        kind === 'wind' ? 0.9 : 0.3,
      )
      expect(deepest, `${kind}: there was something to compare`).toBeGreaterThan(4)
    }
    // Asleep the reading is 1: nothing is taken.
    const device = await loadWasmDevice('weather', RATE)
    expect(meter(device, 5)).toBe(1)
  })

  it('ducks no further under a thick rain than the display says: a drop keeps less of its duck', async () => {
    // `Rain::duck_share`: all of it for a sparse rain, and the ducks together never over kDuckMean.
    expect(rainDuckShare(0)).toBe(1)
    expect(rainDuckShare(1)).toBeGreaterThan(0.99)
    const meanSize = RAIN.sizeMin + (1 - RAIN.sizeMin) / 3
    for (const rate of [24, 96, 400, 5000]) {
      const piled = rate * RAIN.duckSeconds * meanSize * rainDuckShare(rate)
      expect(piled).toBeLessThan(RAIN.duckMean)
      expect(rainCover(rate)).toBeCloseTo(1 - Math.exp(-piled), 9)
      expect(rainCover(rate)).toBeLessThan(1 - Math.exp(-RAIN.duckMean))
    }
    // The thickest rain there is: Force 1 at Pace 4, with no lull.
    const run = await weatherRun(
      { kind: kindOf('rain'), force: 1, pace: 4, exposure: 1, calm: 0 },
      30,
    )
    let cover = 0
    let model = 0
    for (let n = 0; n < run.level.length; n++) {
      model += rainCover(rainRate(1, 4, run.level[n]))
      cover += (-20 * Math.log10(run.gain[n])) / DIP_DB.rain
    }
    const ratio = cover / model
    expect(ratio, 'the mean duck against the display').toBeGreaterThan(0.75)
    expect(ratio).toBeLessThan(1.1)
    // And the level is under 3 dB down on average, where each drop's whole duck would have it near 9.
    expect((cover / run.level.length) * DIP_DB.rain).toBeLessThan(3)
  })

  it('has waves, shadows and thunder as often as the dashes say', async () => {
    const { pace, seconds, calm } = LONG
    // Surf: one wave and one lull to a period.
    const surf = await longRun('surf')
    const waves = risings(surf.level, 0.03, 0.3)
    const wavePeriod = weatherEvent('surf') + weatherLull('surf', calm)
    expect(weatherLull('surf', 0.6)).toBeCloseTo(SURF.gapMax * 0.36, 6)
    expect((seconds * pace) / waves / wavePeriod, `${waves} waves`).toBeGreaterThan(0.85)
    expect((seconds * pace) / waves / wavePeriod).toBeLessThan(1.15)

    const clouds = await longRun('clouds')
    const shadows = risings(clouds.level, 0.03, 0.3)
    const shadowPeriod = weatherEvent('clouds') + weatherLull('clouds', calm)
    expect((seconds * pace) / shadows / shadowPeriod, `${shadows} shadows`).toBeGreaterThan(0.85)
    expect((seconds * pace) / shadows / shadowPeriod).toBeLessThan(1.15)

    const storm = await longRun('storm')
    const every = (seconds * pace) / storm.rolls
    expect(every / weatherLull('thunder', calm), `${storm.rolls} rolls`).toBeGreaterThan(0.7)
    expect(every / weatherLull('thunder', calm)).toBeLessThan(1.4)
    expect(weatherLull('thunder', 0)).toBe(THUNDER.gapMin)
    expect(weatherLull('thunder', 1)).toBeCloseTo(THUNDER.gapMax, 6)
    expect(weatherLull('wind', 0)).toBe(WIND.gapMin)
    expect(weatherLull('wind', 1)).toBeCloseTo(WIND.gapMax, 6)
    expect(weatherLull('rain', 0.5)).toBeCloseTo(Math.sqrt(RAIN.gapMin * RAIN.gapMax), 6)
    expect(weatherLull('clouds', 1)).toBeCloseTo(CLOUDS.gapMax, 6)
    expect(weatherEvent('wind')).toBeCloseTo(0.75, 6)
    expect(weatherEvent('clouds')).toBeCloseTo(8, 6)
    expect(weatherEvent('rain')).toBeCloseTo(4.5, 6)
  }, 60000)

  it('shows at rest a sample of the same weather the device makes', async () => {
    // Different streams of chance, the same rules: over ten minutes of the
    // weather's own time the two are as strong on average and as often up.
    const { calm } = LONG
    for (const kind of WEATHER_KINDS) {
      const run = await longRun(kind)
      const steps = 240000
      const sample = sampleWeather(kind, calm, 2400, steps, 7)
      const device = meanOf(run.level)
      const drawn = meanOf(sample.level, 0, steps)
      expect(drawn / device, `${kind}: mean ${drawn} against ${device}`).toBeGreaterThan(0.82)
      expect(drawn / device, `${kind}: mean ${drawn} against ${device}`).toBeLessThan(1.18)
      // How much of the time it stands above a third: the lulls are as long.
      const above = (values: ArrayLike<number>, count: number): number => {
        let up = 0
        for (let n = 0; n < count; n++) if (values[n] > 1 / 3) up += 1
        return up / count
      }
      const deviceUp = above(run.level, run.level.length)
      const drawnUp = above(sample.level, steps)
      expect(
        Math.abs(drawnUp - deviceUp),
        `${kind}: up ${drawnUp} against ${deviceUp}`,
      ).toBeLessThan(0.08)
    }
  }, 60000)

  it('samples a storm as the wind with rain in sheets and thunder between', () => {
    const steps = 120000
    const storm = sampleWeather('storm', 0, 1200, steps, 3)
    const wind = sampleWeather('wind', 0, 1200, steps, 3)
    for (let n = 0; n < steps; n += 997) {
      // The same gusts from the same seed: the storm's reading is the rain on them.
      expect(storm.density[n]).toBeCloseTo(
        RAIN.sheetFloor + (1 - RAIN.sheetFloor) * wind.level[n],
        5,
      )
      expect(storm.level[n]).toBe(storm.density[n])
      expect(storm.dip[n]).toBeCloseTo(DIP_DB.wind * wind.level[n], 4)
      expect(wind.density[n]).toBe(0)
    }
    expect(wind.rolls).toEqual([])
    expect(1200 / storm.rolls.length / THUNDER.gapMin).toBeGreaterThan(0.8)
    expect(1200 / storm.rolls.length / THUNDER.gapMin).toBeLessThan(1.25)
    // A gust is never larger than 1 nor, once up, smaller than kSizeMin of it.
    let most = 0
    for (let n = 0; n < steps; n++) most = Math.max(most, wind.level[n])
    expect(most).toBeGreaterThan(0.9)
    expect(most).toBeLessThanOrEqual(1)
  })
})

// --- The drawing ----------------------------------------------------------------

describe('what the Weather display draws', { timeout: SLOW }, () => {
  it('lays out from the size it is given', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
      [184, 48],
      [405, 48],
    ]) {
      const lay = weatherLayout({ width, height })
      expect(lay.now).toBe(width - 9)
      expect(lay.foot).toBe(height - 6)
      expect(lay.laneTop).toBe(6)
      expect(lay.sky).toBe(height - 12)
      expect(lay.shade).toBe(Math.round((height - 8) * 0.4))
      // The ring is whole on the display wherever Force and Pace put it: 4.5 px and half its line.
      expect(lay.laneTop).toBeGreaterThanOrEqual(5.25)
      expect(height - lay.foot).toBeGreaterThanOrEqual(5.25)
      expect(lay.ringFrom).toBeGreaterThanOrEqual(5.25)
      expect(width - lay.ringTo).toBeGreaterThanOrEqual(5.25)
      const drawn = pictureOf(drawDisplay(display, params, { width, height }), width, height)
      expect(drawn.weather[0][0][0]).toBe(lay.left)
      expect(drawn.weather[0].at(-1)?.[0]).toBeCloseTo(lay.now, 6)
      expect(drawn.weather[0].length).toBe(weatherColumns(lay) + 1)
    }
  })

  it("draws the upper line at Force, dashed by the weather's own rhythm", () => {
    for (const force of [0, 0.25, 0.5, 1]) {
      for (const mix of [1, 0.4, 0]) {
        const drawn = pictureOf(drawDisplay(display, params, { values: { force, mix } }))
        // Mix does not move it: the knobs are still to be read with nothing of the weather let through.
        expect(drawn.ceiling?.points[0][1]).toBe(crisp(LAY.foot - force * LAY.sky))
        expect(drawn.ring?.[1]).toBeCloseTo(LAY.foot - force * LAY.sky, 6)
      }
    }
    for (const kind of WEATHER_KINDS) {
      for (const [pace, calm] of [
        [1, 0.3],
        [2, 0.3],
        [0.5, 0.8],
      ]) {
        const drawn = pictureOf(
          drawDisplay(display, params, { values: { kind: kindOf(kind), pace, calm } }),
        )
        const part = kind === 'storm' ? 'wind' : kind
        const perSecond = LAY.wide / weatherSpanSec(kind) / pace
        const dash = weatherDash(kind, pace, calm, LAY)
        expect(dash?.[0]).toBeCloseTo(
          Math.min(4 * LAY.wide, Math.max(1.5, weatherEvent(part) * perSecond)),
          6,
        )
        expect(dash?.[1]).toBeCloseTo(
          Math.min(4 * LAY.wide, weatherLull(part, calm) * perSecond),
          6,
        )
        expect(drawn.ceiling?.dash).toEqual([...(dash ?? [])])
      }
    }
    // Twice the Pace, half the dash; surf at Calm 0 has no lull, so no gap.
    const slow = weatherDash('wind', 1, 0.3, LAY)
    const fast = weatherDash('wind', 2, 0.3, LAY)
    expect((fast?.[0] ?? 0) * 2).toBeCloseTo(slow?.[0] ?? 0, 6)
    expect((fast?.[1] ?? 0) * 2).toBeCloseTo(slow?.[1] ?? 0, 6)
    expect(slow?.[0]).toBeCloseTo((0.75 * LAY.wide) / 8, 6)
    expect(weatherDash('surf', 1, 0, LAY)).toBeUndefined()
    expect(
      pictureOf(drawDisplay(display, params, { values: { kind: kindOf('surf'), calm: 0 } })).ceiling
        ?.dash,
    ).toEqual([])
  })

  it('has one ring for Force, by height, and Pace, across', () => {
    const at = (values: Record<string, number>) => {
      const [ring] = display.handles?.(viewOf(display, params, { values })) ?? []
      return ring
    }
    const ring = at({})
    expect(ring.name).toBe('Force and Pace')
    expect(ring.x).toBeCloseTo((LAY.ringFrom + LAY.ringTo) / 2, 6)
    expect(ring.y).toBeCloseTo(LAY.foot - 0.5 * LAY.sky, 6)
    expect(at({ pace: 0.25 }).x).toBeCloseTo(LAY.ringFrom, 6)
    expect(at({ pace: 4 }).x).toBeCloseTo(LAY.ringTo, 6)
    // Pace is on its own scale of equal ratios: twice as fast is a quarter of the way across.
    expect(at({ pace: 2 }).x - ring.x).toBeCloseTo((LAY.ringTo - LAY.ringFrom) / 4, 6)
    expect(at({ force: 1 }).y).toBe(LAY.laneTop)
    expect(at({ force: 0 }).y).toBe(LAY.foot)
    // Taken and not moved it sets what is set, to the last digit.
    expect(ring.drag(ring.x, ring.y)).toEqual({ force: 0.5, pace: 1 })
    const odd = at({ force: 0.3137, pace: 2.7181 })
    expect(odd.drag(odd.x, odd.y)).toEqual({ force: 0.3137, pace: 2.7181 })
    // Moved, it sets what it is moved to: and back again from where that puts it.
    for (const [force, pace] of [
      [0, 0.25],
      [1, 4],
      [0.75, 0.5],
      [0.2, 3],
    ]) {
      const there = at({ force, pace })
      const set = ring.drag(there.x, there.y)
      expect(set.force).toBeCloseTo(force, 6)
      expect(set.pace).toBeCloseTo(pace, 6)
    }
    // Up alone moves Force alone, across alone Pace alone.
    expect(ring.drag(ring.x, ring.y - 9)).toEqual({ force: 0.5 + 9 / LAY.sky, pace: 1 })
    expect(ring.drag(ring.x + 20, ring.y).force).toBe(0.5)
    expect(ring.drag(ring.x + 20, ring.y).pace).toBeGreaterThan(1)
    // Past the display it stops at the ends of the two knobs.
    expect(ring.drag(-80, 400)).toEqual({ force: 0, pace: 0.25 })
    expect(ring.drag(900, -300)).toEqual({ force: 1, pace: 4 })
    expect(at({ force: 0.9, pace: 3 }).reset?.()).toEqual({ force: 0.5, pace: 1 })

    // It is drawn where it stands, and lit in the accent when it is under the pointer.
    const cold = drawDisplay(display, params, {})
    expect(pictureOf(cold).ring).toEqual([ring.x, ring.y, 3.5])
    const hot = drawDisplay(display, params, { hot: 'force' })
    expect(pictureOf(hot).ring).toEqual([ring.x, ring.y, 4.5])
    const filled = (drawn: RecordingContext): string | undefined =>
      pathsOf(drawn).find((path) => path.how === 'fill' && path.arcs.length === 1)?.colour
    expect(filled(cold)).toBe(PLAIN_COLOURS.plate)
    expect(filled(hot)).toBe(PLAIN_COLOURS.accent)
  })

  it('shows at rest a sample of the weather the knobs ask for, under the upper line', () => {
    for (const kind of WEATHER_KINDS) {
      for (const force of [0.5, 1]) {
        const values = { kind: kindOf(kind), force, calm: 0.2 }
        const drawn = pictureOf(drawDisplay(display, params, { values }))
        expect(drawn.weather.length, `${kind}: one line of weather`).toBe(1)
        expect(drawn.nowDot, `${kind}: nothing is happening now`).toBeUndefined()
        const ys = drawn.weather[0].map(([, y]) => y)
        const top = Math.min(...ys)
        // Never above what Force lets it reach, and somewhere near it: no event is under kSizeMin.
        expect(top, `${kind} at Force ${force}`).toBeGreaterThanOrEqual(
          LAY.foot - force * LAY.sky - 1e-6,
        )
        expect(top, `${kind} at Force ${force}`).toBeLessThan(LAY.foot - 0.4 * force * LAY.sky)
        expect(Math.max(...ys)).toBeLessThanOrEqual(LAY.foot + 1e-6)
        // Now stands where the weather is up.
        expect(ys.at(-1), `${kind}: an event at now`).toBeLessThan(LAY.foot - 0.3 * force * LAY.sky)
      }
    }
    // Force is the height: the same weather twice as high.
    const half = pictureOf(drawDisplay(display, params, { values: { force: 0.5 } })).weather[0]
    const whole = pictureOf(drawDisplay(display, params, { values: { force: 1 } })).weather[0]
    for (let c = 0; c < half.length; c += 7)
      expect(LAY.foot - whole[c][1]).toBeCloseTo(2 * (LAY.foot - half[c][1]), 4)
    // Pace is how much weather goes by in the span: waves at Calm 0 are 7 s apart, and half that at Pace 2.
    const waves = (pace: number): number => {
      const line = pictureOf(
        drawDisplay(display, params, { values: { kind: kindOf('surf'), calm: 0, pace, force: 1 } }),
      ).weather[0]
      return risings(
        line.map(([, y]) => (LAY.foot - y) / LAY.sky),
        0.1,
        0.4,
      )
    }
    const span = weatherSpanSec('surf')
    expect(Math.abs(waves(1) - span / SURF.wave)).toBeLessThanOrEqual(1)
    expect(Math.abs(waves(2) - (2 * span) / SURF.wave)).toBeLessThanOrEqual(1.5)
    // Calm is the lulls: more of the line lies on the foot.
    const lying = (calm: number): number =>
      pictureOf(
        drawDisplay(display, params, { values: { kind: kindOf('clouds'), calm, pace: 4 } }),
      ).weather[0].filter(([, y]) => y > LAY.foot - 0.5).length
    expect(lying(0.9)).toBeGreaterThan(lying(0) + 20)
  })

  it('fills the weather as Voice is turned up and hangs the band as far as Exposure and Mix let it', () => {
    const still = (values: Record<string, number>): Picture =>
      pictureOf(
        drawDisplay(display, params, { values: { kind: kindOf('surf'), calm: 0, ...values } }),
      )
    expect(still({ voice: 0 }).fills.length).toBe(0)
    const quiet = still({ voice: 0.2 }).fills[0]
    const loud = still({ voice: 1 }).fills[0]
    expect(quiet.colour).toBe(PLAIN_COLOURS.ink)
    expect(loud.alpha).toBeGreaterThan(quiet.alpha * 2)
    expect(loud.alpha).toBeLessThanOrEqual(0.5)

    // The band: the deepest it hangs is the whole wave's dip as it is heard.
    const deepest = (values: Record<string, number>): number => {
      const band = still(values).band
      if (band.length === 0) return 0
      return Math.max(...band[0].map(([, y]) => y)) - LAY.top
    }
    expect(deepest({ exposure: 0 })).toBe(0)
    expect(deepest({ force: 0 })).toBe(0)
    expect(deepest({ mix: 0 })).toBe(0)
    const full = deepest({ force: 1, exposure: 1 })
    // A wave is between kHeightMin and 1 high, and a whole one takes kDipDb.
    expect(full).toBeGreaterThan(((SURF.heightMin * DIP_DB.surf) / DIP_FULL_DB) * LAY.shade - 0.01)
    expect(full).toBeLessThanOrEqual((DIP_DB.surf / DIP_FULL_DB) * LAY.shade + 1e-6)
    expect(deepest({ force: 1, exposure: 0.5 })).toBeCloseTo(full / 2, 4)
    expect(deepest({ force: 0.5, exposure: 1 })).toBeCloseTo(full / 2, 4)
    // Mix lets less of the dip be heard, by the device's straight mix of the two sounds.
    const dip = (full / LAY.shade) * DIP_FULL_DB
    expect(deepest({ force: 1, exposure: 1, mix: 0.5 })).toBeCloseTo(
      (heardDipDb(dip, 0.5) / DIP_FULL_DB) * LAY.shade,
      4,
    )
    expect(heardDipDb(6.0206, 1)).toBeCloseTo(6.0206, 6)
    expect(heardDipDb(6.0206, 0.5)).toBeCloseTo(-20 * Math.log10(0.75), 4)
    expect(heardDipDb(12, 0)).toBeCloseTo(0, 9)
    // And the weather itself is as high as Mix lets it be heard.
    const dry = still({ force: 1, mix: 0 }).weather[0]
    expect(dry.every(([, y]) => y === LAY.foot)).toBe(true)
    const halfMix = still({ force: 1, mix: 0.5 }).weather[0]
    const allMix = still({ force: 1, mix: 1 }).weather[0]
    for (let c = 0; c < allMix.length; c += 5)
      expect(LAY.foot - halfMix[c][1]).toBeCloseTo((LAY.foot - allMix[c][1]) / 2, 4)
  })

  it('draws rain as ticks, as many as the fall asks for, and thunder as bolts in a storm', () => {
    const ticks = (values: Record<string, number>): number =>
      pictureOf(drawDisplay(display, params, { values })).ticks.reduce(
        (sum, path) => sum + path.rects.length,
        0,
      )
    expect(ticks({ kind: kindOf('wind') })).toBe(0)
    expect(ticks({ kind: kindOf('rain'), force: 0 })).toBe(0)
    expect(ticks({ kind: kindOf('rain'), mix: 0 })).toBe(0)
    // A light slow rain: about as many ticks as drops fall in the span.
    const calm = 0
    const slow = { kind: kindOf('rain'), force: 0.1, pace: 0.5, calm }
    const span = weatherSpanSec('rain')
    const least = rainRate(0.1, 0.5, rainFloor(calm)) * span
    const most = rainRate(0.1, 0.5, 1) * span
    expect(ticks(slow)).toBeGreaterThan(least * 0.8)
    expect(ticks(slow)).toBeLessThan(most * 1.2)
    expect(ticks({ ...slow, force: 0.3 })).toBeGreaterThan(ticks(slow) * 2)
    for (const path of pictureOf(drawDisplay(display, params, { values: slow })).ticks) {
      expect(path.colour).toBe(PLAIN_COLOURS.ink)
      for (const [x, y, w, h] of path.rects) {
        expect(x).toBeGreaterThanOrEqual(LAY.left)
        expect(x).toBeLessThanOrEqual(LAY.now)
        expect(y).toBeGreaterThanOrEqual(LAY.laneTop)
        expect(y + h).toBeLessThanOrEqual(LAY.foot + 1e-6)
        expect([w, h]).toEqual([1, 3])
      }
    }
    const storm = pictureOf(
      drawDisplay(display, params, { values: { kind: kindOf('storm'), calm: 0, pace: 4 } }),
    )
    // Thunder comes every 6 s of the weather's time at Calm 0: 32 of them go by in the span at Pace 4.
    const bolts = storm.bolts.reduce((sum, path) => sum + path.points.length / 4, 0)
    expect(bolts).toBeGreaterThanOrEqual(3)
    expect(bolts).toBeLessThanOrEqual(9)
    expect(storm.ticks.length).toBeGreaterThan(0)
    // Thunder is the weather's own sound and nothing else: with Voice down there is none to draw.
    expect(
      pictureOf(
        drawDisplay(display, params, {
          values: { kind: kindOf('storm'), calm: 0, pace: 4, voice: 0 },
        }),
      ).bolts.length,
    ).toBe(0)
  })

  it('hangs a lighter band as far as the top end is taken down, further than the level', () => {
    const still = (values: Record<string, number>): Picture =>
      pictureOf(
        drawDisplay(display, params, { values: { kind: kindOf('clouds'), calm: 0, ...values } }),
      )
    const deepest = (lines: [number, number][][]): number =>
      lines.length === 0 ? 0 : Math.max(...lines[0].map(([, y]) => y)) - LAY.top
    // At rest: a whole shadow takes kDipDb from the level and kShadeDb more from the top.
    expect(still({ exposure: 0 }).far.length).toBe(0)
    expect(still({ mix: 0 }).far.length).toBe(0)
    const full = still({ force: 1, exposure: 1 })
    const whole = DIP_DB.clouds + SHADE_DB.clouds
    expect(whole).toBe(DIP_FULL_DB)
    expect(deepest(full.far)).toBeCloseTo((whole / DIP_DB.clouds) * deepest(full.band), 3)
    expect(deepest(full.far)).toBeGreaterThan(
      CLOUDS.depthMin * (1 - CLOUDS.thin) * LAY.shade - 0.01,
    )
    expect(deepest(full.far)).toBeLessThanOrEqual(LAY.shade + 1e-6)
    expect(deepest(still({ force: 1, exposure: 0.5 }).far)).toBeCloseTo(deepest(full.far) / 2, 3)
    // Column for column it is the level's band, as much deeper as the shelves are.
    for (let c = 0; c < full.far[0].length; c += 7) {
      expect(full.far[0][c][1] - LAY.top).toBeCloseTo(
        (whole / DIP_DB.clouds) * (full.band[0][c][1] - LAY.top),
        3,
      )
    }
    // In a storm the wind's shelves; in rain the drops', a third of their duck again.
    for (const [kind, ratio] of [
      ['wind', (DIP_DB.wind + SHADE_DB.wind) / DIP_DB.wind],
      ['surf', (DIP_DB.surf + SHADE_DB.surf) / DIP_DB.surf],
      ['rain', (DIP_DB.rain + SHADE_DB.rain) / DIP_DB.rain],
    ] as const) {
      const drawn = still({ kind: kindOf(kind), force: 1, exposure: 1 })
      expect(deepest(drawn.far), kind).toBeCloseTo(ratio * deepest(drawn.band), 3)
    }
    // Running: the reading `top` under the reading `gain`, as it is heard at that Mix.
    for (const [gain, top, mix] of [
      [0.7, 0.2, 1],
      [0.9, 0.5, 1],
      [0.7, 0.2, 0.5],
      [0.5, 0.01, 1],
    ]) {
      const drawn = pictureOf(live({ force: 1, mix }, 3, () => ({ level: 0.5, gain, top })))
      const heard = heardDipDb(-20 * Math.log10(gain * top), mix)
      const hangs = (Math.min(heard, DIP_FULL_DB) / DIP_FULL_DB) * LAY.shade
      expect(drawn.far[0].at(-1)?.[1]).toBeCloseTo(LAY.top + hangs, 4)
      expect(drawn.far[0].at(-1)?.[1]).toBeGreaterThan(drawn.band[0].at(-1)?.[1] ?? Infinity)
    }
    // Where the top end loses no more than the level there is one band, and a reading not yet there takes nothing.
    expect(
      pictureOf(live({ force: 1 }, 3, () => ({ level: 0.5, gain: 0.6, top: 1 }))).far.length,
    ).toBe(0)
    expect(
      pictureOf(live({ force: 1 }, 3, () => ({ level: 0.5, gain: 0.6, top: 0 }))).far.length,
    ).toBe(0)
  })

  it("follows the device's readings while it runs: the weather, the level under it and now", () => {
    for (const [level, gain, mix] of [
      [0.4, 0.7, 1],
      [0.9, 0.3, 1],
      [0.4, 0.7, 0.5],
      [0.6, 0.5, 0],
    ]) {
      const drawn = pictureOf(live({ force: 1, mix }, 3, () => ({ level, gain })))
      // The sample has given way to the device's own weather.
      expect(drawn.weather.length).toBe(1)
      const line = drawn.weather[0]
      const y = LAY.foot - level * mix * LAY.sky
      expect(line.at(-1)?.[1]).toBeCloseTo(y, 4)
      expect(drawn.nowDot?.[0]).toBe(LAY.now)
      expect(drawn.nowDot?.[1]).toBeCloseTo(y, 4)
      // Three seconds of it, and nothing before that.
      const since = LAY.now - (3 / weatherSpanSec('wind')) * LAY.wide
      for (const [x, at] of line) {
        if (x > since + 3) expect(at).toBeCloseTo(y, 4)
        if (x < since - 3) expect(at).toBe(LAY.foot)
      }
      const heard = heardDipDb(-20 * Math.log10(gain), mix)
      const hangs = (Math.min(heard, DIP_FULL_DB) / DIP_FULL_DB) * LAY.shade
      if (hangs > 0.25) expect(drawn.band[0].at(-1)?.[1]).toBeCloseTo(LAY.top + hangs, 4)
      else expect(drawn.band.length).toBe(0)
    }
    // The accent is the mark for now and nothing else of the weather.
    const paths = pathsOf(live({}, 2, () => ({ level: 0.3, gain: 0.8 })))
    const accents = paths.filter((path) => path.colour === PLAIN_COLOURS.accent)
    expect(accents.length).toBe(1)
    expect(accents[0].arcs[0][2]).toBe(2.5)
    // A reading the device cannot give (before the first arrives, or a bad one) draws nothing wild.
    const odd = pictureOf(live({ force: 1 }, 1, () => ({ level: 7, gain: -3 })))
    expect(odd.weather[0].at(-1)?.[1]).toBe(LAY.laneTop)
    expect(odd.band.length).toBe(0)
  })

  it('draws a tick where each reading says drops fell, and a bolt where thunder rolled', () => {
    const span = weatherSpanSec('rain')
    // One drop at 1 s, three at once at 2 s, and the count starting again at 3 s.
    const drops = (time: number): number => (time < 1 ? 5 : time < 2 ? 6 : time < 3 ? 9 : 2)
    const drawn = pictureOf(
      live({ kind: kindOf('rain') }, 4, (time) => ({ drops: drops(time), level: 0.3 })),
    )
    const rects = drawn.ticks.flatMap((path) => path.rects)
    // One for the one, two for the three (no more than two a reading), none for the count that fell back.
    expect(rects.length).toBe(3)
    const xs = [...new Set(rects.map(([x]) => Math.round(x * 100) / 100))].sort((a, b) => a - b)
    const xAt = (age: number): number => LAY.now - (age / span) * LAY.wide
    // The run ends one frame short of 4 s.
    const end = 4 - 1 / 30
    expect(xs[0]).toBeCloseTo(xAt(end - 1), 1)
    expect(xs[1]).toBeCloseTo(xAt(end - 2), 1)
    expect(drawn.ticks.every((path) => path.colour === PLAIN_COLOURS.ink)).toBe(true)
    // A drop that fell this moment is in the accent.
    const fresh = pictureOf(
      live({ kind: kindOf('rain') }, 2, (time) => ({ drops: time < 1.95 ? 0 : 1 })),
    )
    expect(fresh.ticks.map((path) => path.colour)).toEqual([PLAIN_COLOURS.accent])
    // The device counts up to 2^20 and starts again: that is drops, not a new device.
    const wrapped = pictureOf(
      live({ kind: kindOf('rain') }, 2, (time) => ({ drops: time < 1 ? (1 << 20) - 1 : 0 })),
    )
    expect(wrapped.ticks.flatMap((path) => path.rects).length).toBe(1)
    // With nothing of the weather let through there are none.
    const dry = pictureOf(
      live({ kind: kindOf('rain'), mix: 0 }, 2, (time) => ({ drops: time < 1 ? 0 : 1 })),
    )
    expect(dry.ticks.length).toBe(0)

    const rolled = pictureOf(
      live({ kind: kindOf('storm') }, 4, (time) => ({ rolls: time < 1 ? 0 : 1, level: 0.3 })),
    )
    expect(rolled.bolts.length).toBe(1)
    expect(rolled.bolts[0].colour).toBe(PLAIN_COLOURS.ink)
    const stormSpan = weatherSpanSec('storm')
    expect(rolled.bolts[0].points[0][0] - 1.5).toBeCloseTo(
      LAY.now - ((end - 1) / stormSpan) * LAY.wide,
      1,
    )
    // While it still rolls (kDecay) it is in the accent.
    const rolling = pictureOf(
      live({ kind: kindOf('storm') }, 2, (time) => ({ rolls: time < 1 ? 0 : 1, level: 0.3 })),
    )
    expect(rolling.bolts.map((path) => path.colour)).toEqual([PLAIN_COLOURS.accent])
  })

  it('goes back to the sample once the weather has stopped and run off the display', () => {
    const span = weatherSpanSec('wind')
    const state = display.init?.()
    const run = (seconds: number, start: number, gate: number, level: number): Picture =>
      pictureOf(
        runDisplay(display, params, seconds, {
          state,
          now: start,
          meters: { level, gain: 1, drops: 0, gate, rolls: 0 },
        }),
      )
    const at = run(2, 100, 1, 0.5)
    expect(at.weather.length).toBe(1)
    expect(at.nowDot).toBeDefined()
    // Asleep: what there was runs off to the left, with no mark for now.
    const leaving = run(span / 2, 102, 0, 0)
    expect(leaving.weather.length).toBe(1)
    expect(leaving.nowDot).toBeUndefined()
    expect(leaving.weather[0].at(-1)?.[1]).toBe(LAY.foot)
    expect(Math.min(...leaving.weather[0].map(([, y]) => y))).toBeCloseTo(
      LAY.foot - 0.5 * LAY.sky,
      4,
    )
    // And once it has all gone, the sample again, as on a display that never ran.
    const gone = run(span / 2 + 4, 102 + span / 2, 0, 0)
    const fresh = pictureOf(drawDisplay(display, params, {}))
    expect(gone.weather).toEqual(fresh.weather)
    // Switched off it shows the sample and nothing of what it did.
    const busy = display.init?.()
    runDisplay(display, params, 2, {
      state: busy,
      meters: { level: 0.5, gain: 1, drops: 0, gate: 1, rolls: 0 },
    })
    const off = pictureOf(drawDisplay(display, params, { state: busy, powered: false }))
    expect(off.weather).toEqual(fresh.weather)
    expect(off.nowDot).toBeUndefined()
  })

  it('follows the compiled device frame by frame', async () => {
    const device = await loadWasmDevice('weather', RATE)
    const values = { kind: kindOf('storm'), force: 0.9, pace: 2, calm: 0, exposure: 1 }
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    const state = display.init?.()
    const frames = RATE / 30
    const block = new Float32Array(BLOCK)
    let fell = 0
    let rolled = 0
    let drops = 0
    let rolls = 0
    /** The last few readings, newest first: a column of the picture takes in two or three of them. */
    const levels: number[] = []
    const gains: number[] = []
    const highs: number[] = []
    let dulled = 0
    let last: RecordingContext | null = null
    let highest = 0
    let sample = 0
    const seconds = 6
    for (let n = 0; n < seconds * 30; n++) {
      for (let done = 0; done < frames; done += BLOCK) {
        const now = Math.min(BLOCK, frames - done)
        for (let i = 0; i < now; i++)
          block[i] = 0.05 * Math.sin(((sample + i) * 2 * Math.PI * 220) / RATE)
        device.processBlock(block.subarray(0, now))
        sample += now
      }
      const meters = {
        level: meter(device, 0),
        gain: meter(device, 1),
        drops: meter(device, 2),
        gate: meter(device, 3),
        rolls: meter(device, 4),
        top: meter(device, 5),
      }
      // The first frame that runs takes the counts as they stand; from then on each reading adds its own.
      if (n > 1) {
        fell += Math.min(2, meters.drops - drops)
        rolled += meters.rolls > rolls ? 1 : 0
      }
      drops = meters.drops
      rolls = meters.rolls
      if (n > 0) {
        levels.unshift(meters.level)
        gains.unshift(meters.gain)
        highs.unshift(meters.gain * meters.top)
      }
      last = drawDisplay(display, params, {
        values,
        meters,
        state,
        now: 50 + n / 30,
        dt: n === 0 ? 0 : 1 / 30,
      })
      if (n > 4 && n % 3 === 0) {
        const drawn = pictureOf(last)
        // Now is where the device says the weather stands: the highest of the
        // last readings, as many as the last column of the picture takes in.
        const y = drawn.weather.at(-1)?.at(-1)?.[1] ?? NaN
        const nearest = (heights: number[]): number =>
          Math.min(...heights.map((height) => Math.abs(y - height)))
        expect(
          nearest([1, 2, 3, 4].map((k) => LAY.foot - Math.max(...levels.slice(0, k)) * LAY.sky)),
          `frame ${n}`,
        ).toBeLessThan(1e-3)
        // Never over what Force allows.
        expect(meters.level).toBeLessThanOrEqual(0.9 + 1e-6)
        highest = Math.max(highest, meters.level)
        if (drawn.band.length > 0) {
          const hangs = (gain: number): number =>
            LAY.top + (Math.min(DIP_FULL_DB, -20 * Math.log10(gain)) / DIP_FULL_DB) * LAY.shade
          const band = drawn.band.at(-1)?.at(-1)?.[1] ?? NaN
          expect(
            Math.min(
              ...[1, 2, 3, 4].map((k) => Math.abs(band - hangs(Math.min(...gains.slice(0, k))))),
            ),
            `frame ${n}`,
          ).toBeLessThan(1e-3)
          // And the lighter band where the device has the top end: its level's gain times `top`.
          if (drawn.far.length > 0) {
            const far = drawn.far.at(-1)?.at(-1)?.[1] ?? NaN
            expect(
              Math.min(
                ...[1, 2, 3, 4].map((k) => Math.abs(far - hangs(Math.min(...highs.slice(0, k))))),
              ),
              `frame ${n}`,
            ).toBeLessThan(1e-3)
            dulled += 1
          }
        }
      }
    }
    expect(dulled).toBeGreaterThan(20)
    expect(highest).toBeGreaterThan(0.4)
    if (!last) throw new Error('nothing was drawn')
    const end = pictureOf(last)
    // Every drop the device counted in the six seconds is a tick, two at the most for one reading.
    expect(end.ticks.flatMap((path) => path.rects).length).toBe(fell)
    expect(fell).toBeGreaterThan(50)
    expect(end.bolts.reduce((sum, path) => sum + path.points.length / 4, 0)).toBe(rolled)
    expect(rolled).toBeGreaterThan(0)
  })
})
