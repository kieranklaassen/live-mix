// The truth of the Currents display: the waves it draws against the compiled
// device (its sound through a tone, and the places in their cycles its waves
// report), its numbers against the ones in the device's header, the drawing
// against those waves, and each ring against the parameter it sets.

import { describe, expect, it } from 'vitest'

import { CURRENTS_DESCRIPTOR, CURRENTS_PARAMS } from '../../dsp/devices/currents.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { type ParamSpec } from '../../core/params'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  CURRENTS,
  CURRENTS_FACES,
  CYCLE_TOP,
  currentsGain,
  currentsHeard,
  currentsLaneY,
  currentsLayout,
  currentsPhases,
  currentsRatio,
  currentsReach,
  currentsSeed,
  currentsStart,
  currentsTrim,
  currentsTurn,
  currentsWave,
  cycleText,
} from '../components/displays/currents'
import { type DisplayHandle } from '../components/plate-display'
import { drawDisplay, viewOf, type FrameOptions, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const display = CURRENTS_FACES.currents.display

// From cpp/devices/currents/currents.h, by the names they have there.
const kMaxBands = 6
const kPhaseWrap = 4096
const kTopHz = 6400
const kSpread = 6.2831853
const kSideRatio = 0.618034
const kTurn = 0.5
const kBreak = 0.42
const kWander = 0.6
const kSkew = 0.2
const kLeastTurn = 0.06
const kTrimDepth = 0.6
const kLevelStart = 0.35
const kLevelStep = 0.618034
const kSideStart = 0.25
const kSideStep = 0.381966
const kLevelSeed = 0x51c0ffee
const kSideSeed = 0x0dd5ea51
/** `centre_hz` in the header: the bands stand evenly in pitch, the lowest half a step over Low Hold, the highest at `kTopHz`. */
const centreHz = (lowHold: number, count: number, band: number): number =>
  lowHold * Math.pow(Math.max(kTopHz / lowHold, 2), (band + 0.5) / (count - 0.5))

type Values = Readonly<Record<string, number>>
const SPECS: Readonly<Record<string, ParamSpec>> = CURRENTS_PARAMS

function set(device: WasmDeviceHarness, values: Values): void {
  for (const [name, value] of Object.entries(values)) device.set(SPECS[name], value)
}

/** The device's twelve readings by name, as a plate is handed them. */
function readings(device: WasmDeviceHarness): Record<string, number> {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  const all: Record<string, number> = {}
  for (let band = 0; band < kMaxBands; band++) {
    all[`level${band + 1}`] = read(band)
    all[`side${band + 1}`] = read(kMaxBands + band)
  }
  return all
}

const phasesOf = (meters: Record<string, number>) =>
  currentsPhases({ meter: (name) => meters[name] ?? 0 })

/** Readings for a picture: every wave somewhere in its cycles, none at 0. */
const SOMEWHERE: Record<string, number> = {
  level1: 3.35,
  level2: 5.1,
  level3: 7.9,
  level4: 11.2,
  level5: 17.6,
  level6: 22.3,
  side1: 2.25,
  side2: 3.4,
  side3: 5.05,
  side4: 7.3,
  side5: 10.9,
  side6: 14.15,
}

interface Fill {
  colour: string
  alpha: number
  points: { x: number; y: number }[]
}

/** Every area a drawing fills from a path of straight lines, with what it was filled in. */
function fills(drawn: RecordingContext): Fill[] {
  const all: Fill[] = []
  let path: { x: number; y: number }[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fill' && path.length > 0) all.push({ colour, alpha, points: path })
  }
  return all
}

/** Every line a drawing strokes through more than two points: the curves. */
function curves(drawn: RecordingContext): { x: number; y: number }[][] {
  const all: { x: number; y: number }[][] = []
  let path: { x: number; y: number }[] = []
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'stroke' && path.length > 2) all.push(path)
  }
  return all
}

/** The rectangles a drawing fills in the accent: the marks at now, lowest band first. */
function nowMarks(drawn: RecordingContext): { x: number; y: number; w: number; h: number }[] {
  const all: { x: number; y: number; w: number; h: number }[] = []
  let colour = ''
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'fillRect' && colour === PLAIN_COLOURS.accent) {
      const [x, y, w, h] = call.args as number[]
      all.push({ x, y, w, h })
    }
  }
  return all
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

/** The streams of a drawing, lowest band first: the part that has passed, as its two edges over the same x. */
function streams(drawn: RecordingContext): { x: number[]; upper: number[]; lower: number[] }[] {
  return fills(drawn)
    .filter((fill) => fill.colour === PLAIN_COLOURS.ink && fill.alpha === INK.text)
    .map((fill) => {
      const half = fill.points.length / 2
      const upper = fill.points.slice(0, half)
      const lower = fill.points.slice(half).reverse()
      return {
        x: upper.map((at) => at.x),
        upper: upper.map((at) => at.y),
        lower: lower.map((at) => at.y),
      }
    })
}

const view = (options: FrameOptions = {}) => viewOf(display, CURRENTS_PARAMS, options)
const handlesAt = (options: FrameOptions = {}): readonly DisplayHandle[] =>
  display.handles?.(view(options)) ?? []
const ringOf = (key: string, options: FrameOptions = {}): DisplayHandle => {
  const ring = handlesAt(options).find((handle) => handle.key === key)
  if (!ring) throw new Error(`no ring for ${key}`)
  return ring
}

describe("the Currents display's numbers", () => {
  it('are the ones in the header of the device', () => {
    expect(CURRENTS).toEqual({
      maxBands: kMaxBands,
      phaseWrap: kPhaseWrap,
      spread: kSpread,
      sideRatio: kSideRatio,
      turn: kTurn,
      break: kBreak,
      wander: kWander,
      skew: kSkew,
      leastTurn: kLeastTurn,
      trimDepth: kTrimDepth,
      levelStart: kLevelStart,
      levelStep: kLevelStep,
      sideStart: kSideStart,
      sideStep: kSideStep,
      levelSeed: kLevelSeed,
      sideSeed: kSideSeed,
      seedStep: 0x01000193,
    })
    // `seed_of`: a seed for each band, another for its side wave, all in 32 bits.
    expect(currentsSeed(0, false)).toBe(kLevelSeed)
    expect(currentsSeed(2, true)).toBe((kSideSeed + 2 * 0x01000193) >>> 0)
  })

  it('give a plain wave from trough to crest and back, the crest where Shape puts it', () => {
    // Without Chance every cycle is the same: −1 at its start, 1 at the turn, half cosines between.
    expect(currentsTurn(0)).toBe(0.5)
    expect(currentsTurn(1)).toBeCloseTo(0.92, 9)
    for (const turn of [0.5, 0.605, 0.92]) {
      expect(currentsWave(7, turn, 0, 1)).toBeCloseTo(-1, 9)
      expect(currentsWave(7 + turn, turn, 0, 1)).toBeCloseTo(1, 9)
      expect(currentsWave(7 + turn / 2, turn, 0, 1)).toBeCloseTo(0, 9)
      expect(currentsWave(7 + turn + (1 - turn) / 2, turn, 0, 1)).toBeCloseTo(0, 9)
      expect(currentsWave(7 + turn / 4, turn, 0, 1)).toBeCloseTo(-Math.SQRT1_2, 9)
    }
    // A place past the end of the count is the same place at its start.
    expect(currentsWave(kPhaseWrap + 3.3, 0.5, 1, 99)).toBeCloseTo(currentsWave(3.3, 0.5, 1, 99), 9)
  })

  it('keep Chance inside what the header allows it', () => {
    // A trough no higher than −1 + kWander, a crest no lower than 1 − kWander, and a wave with no step in it.
    let last = currentsWave(0, 0.5, 1, currentsSeed(3, false))
    let lowest = 1
    let highest = -1
    for (let n = 1; n <= 40000; n++) {
      const now = currentsWave(n / 1000, 0.5, 1, currentsSeed(3, false))
      expect(Math.abs(now - last)).toBeLessThan(0.03)
      last = now
      lowest = Math.min(lowest, now)
      highest = Math.max(highest, now)
    }
    expect(lowest).toBeGreaterThanOrEqual(-1)
    expect(lowest).toBeLessThan(-0.95)
    expect(highest).toBeLessThanOrEqual(1)
    expect(highest).toBeGreaterThan(0.95)
    // Each cycle's crest is its own: of forty, the lowest stands well under the highest, none under 1 − kWander.
    const crests: number[] = []
    for (let cycle = 0; cycle < 40; cycle++) {
      let crest = -1
      for (let n = 0; n < 400; n++)
        crest = Math.max(crest, currentsWave(cycle + n / 400, 0.5, 1, currentsSeed(3, false)))
      crests.push(crest)
    }
    expect(Math.min(...crests)).toBeGreaterThanOrEqual(1 - kWander - 1e-9)
    expect(Math.max(...crests) - Math.min(...crests)).toBeGreaterThan(0.3)
  })

  it('give the gain the header gives: untouched at the crest of a still band, the power of a cycle kept', () => {
    expect(currentsTrim(0)).toBe(1)
    // Past kTrimDepth the crest goes no higher: at full Depth it is the one at Depth 0.6.
    expect(CURRENTS.trimDepth).toBe(kTrimDepth)
    expect(currentsTrim(kTrimDepth)).toBeCloseTo(1 / Math.sqrt(0.7 * 0.7 + 0.125 * 0.36), 9)
    expect(currentsTrim(1)).toBe(currentsTrim(kTrimDepth))
    expect(currentsTrim(0.8)).toBe(currentsTrim(kTrimDepth))
    expect(currentsGain(1, -1)).toBe(0)
    expect(currentsGain(0.6, 1)).toBeCloseTo(currentsTrim(0.6), 9)
    expect(currentsGain(0.6, -1)).toBeCloseTo(currentsTrim(0.6) * 0.4, 9)
    // Over one plain cycle the mean of the gain squared is 1 up to kTrimDepth, and under 1 past it.
    for (const depth of [0.3, 0.6, 1]) {
      let power = 0
      for (let n = 0; n < 1000; n++)
        power += currentsGain(depth, currentsWave(n / 1000, 0.5, 0, 1)) ** 2 / 1000
      if (depth <= kTrimDepth) expect(power).toBeCloseTo(1, 3)
      else expect(power).toBeCloseTo(currentsTrim(kTrimDepth) ** 2 * 0.375, 3)
    }
    // The top of the large cycle stands over the highest crest there is.
    expect(CYCLE_TOP).toBeGreaterThan(currentsTrim(1))
    // A centred sound: both sides alike with the side wave at rest, all on one side with it at its end.
    expect(currentsHeard(0.6, 1, 1, 1, 0).left).toBeCloseTo(currentsTrim(0.6), 9)
    expect(currentsHeard(0.6, 1, 1, 1, 0).right).toBeCloseTo(currentsTrim(0.6), 9)
    expect(currentsHeard(0, 1, 1, 0, -1).left).toBeCloseTo(Math.SQRT2, 9)
    expect(currentsHeard(0, 1, 1, 0, -1).right).toBeCloseTo(0, 9)
    // Mix is the share of the way from the sound as it came.
    expect(currentsHeard(1, 1, 0, -1, 1)).toEqual({ left: 1, right: 1 })
    expect(currentsHeard(1, 0, 0.5, -1, 0).left).toBeCloseTo(0.5, 9)
    // Tide: all bands at one speed at 0, the highest kSpread times the lowest at 1.
    expect(currentsRatio(0, 5, 4)).toBe(1)
    expect(currentsRatio(1, 5, 4)).toBeCloseTo(kSpread, 6)
    expect(currentsRatio(1, 5, 2)).toBeCloseTo(Math.sqrt(kSpread), 6)
    expect(currentsRatio(0.5, 3, 5)).toBeCloseTo(Math.sqrt(kSpread), 6)
  })
})

describe('the Currents display against the compiled device', () => {
  it('starts its waves where the device starts them', async () => {
    const device = await loadWasmDevice('currents', RATE)
    const start = currentsStart()
    const meters = readings(device)
    for (let band = 0; band < kMaxBands; band++) {
      const level = kLevelStart + band * kLevelStep
      const side = kSideStart + band * kSideStep
      expect(start.level[band]).toBeCloseTo(level - Math.floor(level), 9)
      expect(start.side[band]).toBeCloseTo(side - Math.floor(side), 9)
      expect(meters[`level${band + 1}`]).toBeCloseTo(start.level[band], 5)
      expect(meters[`side${band + 1}`]).toBeCloseTo(start.side[band], 5)
    }
    // And a plate that has had no reading yet (every one of them 0) stands there too.
    expect(phasesOf({})).toEqual(start)
    expect(phasesOf(SOMEWHERE).level[2]).toBe(7.9)
  })

  it('turns each band as fast as the device does', async () => {
    for (const { bands, tide, rate } of [
      { bands: 5, tide: 0.5, rate: 1 },
      { bands: 6, tide: 1, rate: 0.5 },
      { bands: 3, tide: 0.25, rate: 2 },
    ]) {
      const device = await loadWasmDevice('currents', RATE)
      set(device, { bands, tide, rate })
      const before = readings(device)
      const block = new Float32Array(128).fill(0.1)
      const blocks = 1500
      for (let n = 0; n < blocks; n++) device.processBlock(block)
      const after = readings(device)
      const seconds = (blocks * 128) / RATE
      for (let band = 0; band < kMaxBands; band++) {
        const turned = rate * currentsRatio(tide, bands, band) * seconds
        expect(after[`level${band + 1}`] - before[`level${band + 1}`]).toBeCloseTo(turned, 2)
        expect(after[`side${band + 1}`] - before[`side${band + 1}`]).toBeCloseTo(
          turned * kSideRatio,
          2,
        )
      }
    }
  })

  it('says what a centred tone at a band comes out as on each side, cycle after cycle', async () => {
    // Three narrow bands, the tone at the middle one's centre, where the band alone decides
    // what is heard. Chance at full: every cycle has its own trough, crest and turn, so the
    // waves here are the device's only if the numbers behind them are the device's.
    for (const values of [
      { depth: 1, sway: 0.7, chance: 1, shape: 0.6, mix: 1 },
      { depth: 0.6, sway: 1, chance: 0.4, shape: 0, mix: 0.5 },
    ]) {
      const settings = { ...values, bands: 3, focus: 1, lowHold: 120, rate: 2, tide: 0.5 }
      const device = await loadWasmDevice('currents', RATE)
      set(device, settings)
      const hz = centreHz(120, 3, 1)
      const w = (TWO_PI * hz) / RATE
      const input = new Float32Array(128)
      let sample = 0
      /** One block of the tone, and what came out of it against what went in: [left, right, in]. */
      const run = (): [number, number, number] => {
        let left = 0
        let right = 0
        let power = 0
        for (let i = 0; i < 128; i++) input[i] = 0.25 * Math.sin(w * (sample + i))
        device.processBlock(input)
        const outLeft = device.view(device.device.device_out_left(), 128)
        const outRight = device.view(device.device.device_out_right(), 128)
        for (let i = 0; i < 128; i++) {
          left += outLeft[i] * input[i]
          right += outRight[i] * input[i]
          power += input[i] * input[i]
        }
        sample += 128
        return [left, right, power]
      }
      let worst = 0
      let lowest = Infinity
      let highest = 0
      let before = run()
      // Six seconds: nineteen cycles of the band's level wave and twelve of its side wave.
      for (let n = 0; n < 2250; n++) {
        const meters = readings(device)
        const after = run()
        const left = (before[0] + after[0]) / (before[2] + after[2])
        const right = (before[1] + after[1]) / (before[2] + after[2])
        before = after
        if (n < 20) continue
        // The picture's own way from the readings to the two edges of a stream, at now.
        const phases = phasesOf(meters)
        const heard = currentsHeard(
          settings.depth,
          settings.sway,
          settings.mix,
          currentsWave(
            phases.level[1],
            currentsTurn(settings.shape),
            settings.chance,
            currentsSeed(1, false),
          ),
          currentsWave(phases.side[1], kTurn, settings.chance, currentsSeed(1, true)),
        )
        worst = Math.max(worst, Math.abs(heard.left - left), Math.abs(heard.right - right))
        lowest = Math.min(lowest, heard.left)
        highest = Math.max(highest, heard.left)
      }
      // The band's neighbours reach its centre a little: a few hundredths of a gain that runs from 0 to 2.
      expect(worst).toBeLessThan(0.06)
      expect(highest - lowest).toBeGreaterThan(values.depth * values.mix)
    }
  }, 60000)
})

describe('the Currents display', () => {
  // On a plate at rest (184 by 48 in this harness): the cycle 55 wide from (4, 6), the streams from x 65.
  it('lays itself out from the size it is given', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
      [184, 48],
      [405, 48],
    ]) {
      const lay = currentsLayout(view({ width, height, values: { bands: 6 } }))
      expect(lay.cycle.x).toBe(4)
      expect(lay.cycle.w).toBeGreaterThanOrEqual(48)
      expect(lay.cycle.w).toBeLessThanOrEqual(72)
      expect(lay.cycle.y + lay.cycle.h).toBe(height - 6)
      expect(lay.lanes.x).toBeGreaterThan(lay.cycle.x + lay.cycle.w)
      expect(lay.lanes.x + lay.lanes.w).toBe(width - 4)
      expect(lay.lanes.y + lay.lanes.h).toBe(height - 3)
      expect(lay.laneHeight * 6).toBeCloseTo(height - 6, 9)
      // Now stands seven tenths of the way across the streams.
      expect(lay.nowX).toBeCloseTo(lay.lanes.x + 0.7 * lay.lanes.w, 9)
      // The lowest band at the foot.
      expect(currentsLaneY(lay, 0)).toBeCloseTo(height - 3 - lay.laneHeight / 2, 9)
      expect(currentsLaneY(lay, 5)).toBeCloseTo(3 + lay.laneHeight / 2, 9)
    }
  })

  it('draws a stream for each band the device has in use', () => {
    for (const bands of [3, 4, 5, 6]) {
      const drawn = drawDisplay(display, CURRENTS_PARAMS, { values: { bands }, meters: SOMEWHERE })
      expect(streams(drawn)).toHaveLength(bands)
      expect(nowMarks(drawn)).toHaveLength(bands)
    }
  })

  it('draws each stream from the waves: its upper edge the left, its lower edge the right', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
    ]) {
      for (const values of [
        {},
        { depth: 1, sway: 1, tide: 1, chance: 1, bands: 6, shape: 0.8, rate: 0.7 },
        { depth: 0.4, sway: 0.2, mix: 0.5, bands: 3, rate: 0.02 },
      ] as Values[]) {
        const options = { width, height, values, meters: SOMEWHERE }
        const at = view(options)
        const lay = currentsLayout(at)
        const drawn = drawDisplay(display, CURRENTS_PARAMS, options)
        const all = streams(drawn)
        const marks = nowMarks(drawn)
        expect(all).toHaveLength(lay.bands)
        // The top of a lane is a crest at Depth 1 gone all the way to one side.
        const unit = lay.laneHeight / 2 / (currentsTrim(1) * Math.SQRT2)
        const turn = currentsTurn(at.value('shape'))
        all.forEach((stream, band) => {
          const middle = currentsLaneY(lay, band)
          const ratio = currentsRatio(at.value('tide'), lay.bands, band)
          const edges = (x: number): { upper: number; lower: number } => {
            // So many cycles of the lowest band from now: its cycle is `periodPx` long.
            const cycles = (x - lay.nowX) / lay.periodPx
            const heard = currentsHeard(
              at.value('depth'),
              at.value('sway'),
              at.value('mix'),
              currentsWave(
                SOMEWHERE[`level${band + 1}`] + cycles * ratio,
                turn,
                at.value('chance'),
                currentsSeed(band, false),
              ),
              currentsWave(
                SOMEWHERE[`side${band + 1}`] + cycles * ratio * kSideRatio,
                kTurn,
                at.value('chance'),
                currentsSeed(band, true),
              ),
            )
            return { upper: middle - heard.left * unit, lower: middle + heard.right * unit }
          }
          // The past runs from the left end of the streams to now, a point to the pixel.
          expect(stream.x[0]).toBe(lay.lanes.x)
          expect(stream.x[stream.x.length - 1]).toBeCloseTo(lay.nowX, 9)
          expect(stream.x.length).toBeGreaterThan(lay.nowX - lay.lanes.x)
          stream.x.forEach((x, n) => {
            const { upper, lower } = edges(x)
            expect(stream.upper[n]).toBeCloseTo(upper, 6)
            expect(stream.lower[n]).toBeCloseTo(lower, 6)
            // A stream keeps to its lane.
            expect(stream.upper[n]).toBeGreaterThanOrEqual(middle - lay.laneHeight / 2 - 1e-6)
            expect(stream.lower[n]).toBeLessThanOrEqual(middle + lay.laneHeight / 2 + 1e-6)
          })
          // The mark at now: from the left's level to the right's, in the accent.
          const now = edges(lay.nowX)
          const mark = marks[band]
          expect(mark.x).toBeCloseTo(lay.nowX - 1, 9)
          expect(mark.w).toBe(2)
          expect(mark.y + mark.h / 2).toBeCloseTo((now.upper + now.lower) / 2, 6)
          expect(mark.h).toBeCloseTo(Math.max(1.5, now.lower - now.upper), 6)
        })
      }
    }
  })

  it('runs the streams to the left as the waves turn, one cycle of the lowest band in the space the Rate ring marks', () => {
    const values = { chance: 1, sway: 0.8, tide: 0.7, bands: 4 }
    const at = view({ values })
    const lay = currentsLayout(at)
    // The ring stands on the lowest stream, one of its cycles before now.
    const ring = ringOf('rate', { values })
    expect(ring.x).toBeCloseTo(lay.nowX - lay.periodPx, 9)
    expect(ring.y).toBeCloseTo(currentsLaneY(lay, 0), 9)
    // Turn every wave by what it turns while the lowest goes 10 px: the picture is the same, 10 px to the left.
    const cycles = 10 / lay.periodPx
    const later: Record<string, number> = {}
    for (let band = 0; band < kMaxBands; band++) {
      const ratio = currentsRatio(values.tide, values.bands, band)
      later[`level${band + 1}`] = SOMEWHERE[`level${band + 1}`] + cycles * ratio
      later[`side${band + 1}`] = SOMEWHERE[`side${band + 1}`] + cycles * ratio * kSideRatio
    }
    const first = streams(drawDisplay(display, CURRENTS_PARAMS, { values, meters: SOMEWHERE }))
    const second = streams(drawDisplay(display, CURRENTS_PARAMS, { values, meters: later }))
    expect(second).toHaveLength(4)
    let moved = 0
    second.forEach((stream, band) => {
      for (let n = 0; n + 10 < first[band].x.length - 1; n++) {
        expect(stream.upper[n]).toBeCloseTo(first[band].upper[n + 10], 6)
        expect(stream.lower[n]).toBeCloseTo(first[band].lower[n + 10], 6)
        moved = Math.max(moved, Math.abs(stream.upper[n] - first[band].upper[n]))
      }
    })
    expect(moved).toBeGreaterThan(0.5)
    // The time one cycle of the lowest band takes is written out.
    expect(drawDisplay(display, CURRENTS_PARAMS, { meters: SOMEWHERE }).words()).toEqual(['10 s'])
    expect(
      drawDisplay(display, CURRENTS_PARAMS, { values: { rate: 2 }, meters: SOMEWHERE }).words(),
    ).toEqual(['0.5 s'])
    expect(cycleText(1 / 0.4)).toBe('2.5 s')
    expect(cycleText(200)).toBe('200 s')
  })

  it('draws one plain cycle large: its trough at the Depth ring, its crest at the Shape ring', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
    ]) {
      for (const values of [
        {},
        { depth: 1, shape: 1 },
        { depth: 0.3, shape: 0, mix: 0.6 },
      ] as Values[]) {
        const options = { width, height, values: { chance: 0, ...values }, meters: SOMEWHERE }
        const at = view(options)
        const lay = currentsLayout(at)
        const drawn = drawDisplay(display, CURRENTS_PARAMS, options)
        const [cycle] = curves(drawn)
        const depth = at.value('depth')
        const mix = at.value('mix')
        // A gain of 0 at the foot of the cycle's box, CYCLE_TOP at its top; a phase from 5 px in to 5 px in.
        const yOf = (gain: number) => lay.cycle.y + lay.cycle.h * (1 - gain / CYCLE_TOP)
        const xOf = (phase: number) => lay.cycle.x + 5 + phase * (lay.cycle.w - 10)
        const heard = (m: number) => 1 + mix * (currentsGain(depth, m) - 1)
        expect(cycle[0].x).toBeCloseTo(xOf(0), 9)
        expect(cycle[cycle.length - 1].x).toBeCloseTo(xOf(1), 9)
        for (const point of cycle) {
          const phase = (point.x - xOf(0)) / (lay.cycle.w - 10)
          expect(point.y).toBeCloseTo(
            yOf(heard(currentsWave(phase, currentsTurn(at.value('shape')), 0, 1))),
            6,
          )
        }
        // The lowest and the highest it gets.
        expect(Math.max(...cycle.map((point) => point.y))).toBeCloseTo(yOf(heard(-1)), 6)
        expect(Math.min(...cycle.map((point) => point.y))).toBeLessThan(yOf(heard(1)) + 0.5)
        const depthRing = ringOf('depth', options)
        const shapeRing = ringOf('shape', options)
        expect(depthRing.x).toBeCloseTo(xOf(0), 9)
        if (mix >= 0.5) expect(depthRing.y).toBeCloseTo(yOf(heard(-1)), 9)
        expect(shapeRing.x).toBeCloseTo(xOf(kTurn + kBreak * at.value('shape')), 9)
        expect(shapeRing.y).toBeCloseTo(yOf(heard(1)), 9)
        // No Chance, nothing shaded.
        expect(
          fills(drawn).filter(
            (fill) => fill.alpha === INK.fill && fill.colour === PLAIN_COLOURS.ink,
          ),
        ).toHaveLength(0)
      }
    }
  })

  it('shades what Chance takes off a cycle, and marks where the lowest band is in its own', () => {
    const values = { chance: 1, depth: 0.8, shape: 0.5 }
    const at = view({ values })
    const lay = currentsLayout(at)
    const drawn = drawDisplay(display, CURRENTS_PARAMS, { values, meters: SOMEWHERE })
    const yOf = (gain: number) => lay.cycle.y + lay.cycle.h * (1 - gain / CYCLE_TOP)
    const xOf = (phase: number) => lay.cycle.x + 5 + phase * (lay.cycle.w - 10)
    const [shade] = fills(drawn).filter(
      (fill) => fill.alpha === INK.fill && fill.colour === PLAIN_COLOURS.ink,
    )
    // The shade is where a cycle can go: at every place across it, from the highest any cycle
    // gets there to the lowest (`currentsReach`), through the gain the device gives.
    const half = shade.points.length / 2
    const upper = shade.points.slice(0, half)
    const lower = shade.points.slice(half).reverse()
    expect(upper[0].x).toBeCloseTo(xOf(0), 9)
    expect(upper[half - 1].x).toBeCloseTo(xOf(1), 9)
    for (let n = 0; n < half; n++) {
      const phase = (upper[n].x - xOf(0)) / (lay.cycle.w - 10)
      const [low, high] = currentsReach(phase, currentsTurn(0.5), 1)
      expect(lower[n].x).toBeCloseTo(upper[n].x, 9)
      expect(upper[n].y).toBeCloseTo(yOf(currentsGain(0.8, high)), 6)
      expect(lower[n].y).toBeCloseTo(yOf(currentsGain(0.8, low)), 6)
    }
    // It reaches from the deepest trough to the highest crest.
    const ys = shade.points.map((point) => point.y)
    expect(Math.max(...ys)).toBeCloseTo(yOf(currentsGain(0.8, -1)), 6)
    expect(Math.min(...ys)).toBeCloseTo(yOf(currentsGain(0.8, 1)), 6)
    // The dot: the lowest band's place in its cycle and the gain its own wave gives there.
    const [mark] = dots(drawn).filter((dot) => dot.r === 2.5)
    expect(mark.x).toBeCloseTo(lay.cycle.x + 5 + 0.35 * (lay.cycle.w - 10), 6)
    expect(mark.y).toBeCloseTo(
      yOf(currentsGain(0.8, currentsWave(3.35, currentsTurn(0.5), 1, currentsSeed(0, false)))),
      6,
    )
    // It follows the reading.
    const later = drawDisplay(display, CURRENTS_PARAMS, {
      values,
      meters: { ...SOMEWHERE, level1: 8.75 },
    })
    expect(dots(later).find((dot) => dot.r === 2.5)?.x).toBeCloseTo(
      lay.cycle.x + 5 + 0.75 * (lay.cycle.w - 10),
      6,
    )
  })

  it('draws only what Mix lets be heard, and still shows the device at Mix 0', () => {
    const values = { mix: 0, depth: 0.9, sway: 1, shape: 0.7 }
    const at = view({ values })
    const lay = currentsLayout(at)
    const drawn = drawDisplay(display, CURRENTS_PARAMS, { values, meters: SOMEWHERE })
    const unit = lay.laneHeight / 2 / (currentsTrim(1) * Math.SQRT2)
    // Every stream runs level, as wide as the sound that came.
    streams(drawn).forEach((stream, band) => {
      for (const y of stream.upper) expect(y).toBeCloseTo(currentsLaneY(lay, band) - unit, 9)
      for (const y of stream.lower) expect(y).toBeCloseTo(currentsLaneY(lay, band) + unit, 9)
    })
    // The cycle lies level where the sound is untouched.
    const [cycle] = curves(drawn)
    const unity = lay.cycle.y + lay.cycle.h * (1 - 1 / CYCLE_TOP)
    for (const point of cycle) expect(point.y).toBeCloseTo(unity, 9)
    // The rings still stand where the settings are: Depth as far down as half a Mix shows it.
    const depthRing = ringOf('depth', { values })
    expect(depthRing.y).toBeCloseTo(
      lay.cycle.y + lay.cycle.h * (1 - (1 + 0.5 * (currentsGain(0.9, -1) - 1)) / CYCLE_TOP),
      9,
    )
    expect(ringOf('depth', { values: { ...values, depth: 0.2 } }).y).toBeLessThan(depthRing.y - 2)
    expect(ringOf('shape', { values }).x).toBeCloseTo(
      lay.cycle.x + 5 + (kTurn + kBreak * 0.7) * (lay.cycle.w - 10),
      9,
    )
    // With nothing set to move a band, every stream is level at any Mix.
    const still = drawDisplay(display, CURRENTS_PARAMS, {
      values: { depth: 0, sway: 0 },
      meters: SOMEWHERE,
    })
    streams(still).forEach((stream, band) => {
      for (const y of stream.upper) expect(y).toBeCloseTo(currentsLaneY(lay, band) - unit, 9)
    })
  })

  it('stands where the device starts until the first reading comes', () => {
    const start = currentsStart()
    const meters: Record<string, number> = {}
    const none: Record<string, number> = {}
    for (let band = 0; band < kMaxBands; band++) {
      meters[`level${band + 1}`] = start.level[band]
      meters[`side${band + 1}`] = start.side[band]
      none[`level${band + 1}`] = 0
      none[`side${band + 1}`] = 0
    }
    const told = drawDisplay(display, CURRENTS_PARAMS, { meters }).print()
    expect(drawDisplay(display, CURRENTS_PARAMS, { meters: none }).print()).toBe(told)
    expect(drawDisplay(display, CURRENTS_PARAMS, {}).print()).toBe(told)
  })
})

describe("the Currents display's rings", () => {
  it('are Depth, Shape and Rate, each lit in the accent when it is taken', () => {
    expect(handlesAt().map((handle) => handle.key)).toEqual(['depth', 'shape', 'rate'])
    expect(handlesAt().map((handle) => handle.name)).toEqual(['Depth', 'Shape', 'Rate'])
    for (const ring of handlesAt()) {
      const drawn = drawDisplay(display, CURRENTS_PARAMS, { meters: SOMEWHERE, hot: ring.key })
      const lit = dots(drawn).filter((dot) => dot.r === 4.5)
      expect(lit).toHaveLength(1)
      expect(lit[0].x).toBeCloseTo(ring.x, 9)
      expect(lit[0].y).toBeCloseTo(ring.y, 9)
    }
  })

  it('set Depth to the one whose trough is under the hand', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
    ]) {
      for (const mix of [1, 0.7, 0.2]) {
        const options = { width, height, values: { mix } }
        const ring = ringOf('depth', options)
        const lay = currentsLayout(view(options))
        // Where it stands it holds the setting to the last digit.
        expect(ring.drag(ring.x, ring.y, {})).toEqual({ depth: 0.6 })
        const top = ringOf('depth', { ...options, values: { mix, depth: 0 } }).y
        const foot = ringOf('depth', { ...options, values: { mix, depth: 1 } }).y
        expect(foot).toBeGreaterThan(top + 0.2 * lay.cycle.h)
        for (const share of [0.1, 0.35, 0.6, 0.9]) {
          const y = top + share * (foot - top)
          const { depth } = ring.drag(ring.x + 30, y, {})
          expect(depth).toBeGreaterThan(0)
          expect(depth).toBeLessThan(1)
          expect(ringOf('depth', { ...options, values: { mix, depth } }).y).toBeCloseTo(y, 4)
        }
        // Past either end of its travel is the end.
        expect(ring.drag(ring.x, top - 20, {}).depth).toBeCloseTo(0, 6)
        expect(ring.drag(ring.x, foot + 40, {}).depth).toBeCloseTo(1, 6)
        expect(ring.reset?.()).toEqual({ depth: 0.6 })
      }
    }
  })

  it('set Shape to the one whose crest is under the hand', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
    ]) {
      const options = { width, height }
      const ring = ringOf('shape', options)
      const lay = currentsLayout(view(options))
      expect(ring.drag(ring.x, ring.y, {})).toEqual({ shape: 0.25 })
      const from = ringOf('shape', { ...options, values: { shape: 0 } }).x
      const to = ringOf('shape', { ...options, values: { shape: 1 } }).x
      expect(to - from).toBeCloseTo(kBreak * (lay.cycle.w - 10), 9)
      for (const share of [0.1, 0.5, 0.8]) {
        const x = from + share * (to - from)
        const { shape } = ring.drag(x, ring.y - 20, {})
        expect(shape).toBeCloseTo(share, 9)
        expect(ringOf('shape', { ...options, values: { shape } }).x).toBeCloseTo(x, 9)
      }
      expect(ring.drag(from - 30, ring.y, {})).toEqual({ shape: 0 })
      expect(ring.drag(to + 30, ring.y, {})).toEqual({ shape: 1 })
      expect(ring.reset?.()).toEqual({ shape: 0.25 })
    }
  })

  it('set Rate to the one whose cycle ends under the hand', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
      [405, 48],
    ]) {
      const options = { width, height }
      const ring = ringOf('rate', options)
      const lay = currentsLayout(view(options))
      const past = lay.nowX - lay.lanes.x
      expect(ring.drag(ring.x, ring.y, {})).toEqual({ rate: 0.1 })
      // A cycle of the slowest Rate is nine tenths of the past long, one of the fastest three tenths, and
      // the ring goes evenly along the knob between: it never leaves the streams.
      const slow = ringOf('rate', { ...options, values: { rate: 0.005 } }).x
      const fast = ringOf('rate', { ...options, values: { rate: 2 } }).x
      expect(slow).toBeCloseTo(lay.nowX - past * 0.9, 9)
      expect(fast).toBeCloseTo(lay.nowX - past * 0.3, 9)
      expect(slow).toBeGreaterThan(lay.lanes.x)
      for (const share of [0.15, 0.5, 0.85]) {
        const x = slow + share * (fast - slow)
        const { rate } = ring.drag(x, 0, {})
        // So far along the knob: 0.005 Hz to 2 Hz on its taper.
        expect(rate).toBeCloseTo(0.005 * Math.pow(400, share), 6)
        expect(ringOf('rate', { ...options, values: { rate } }).x).toBeCloseTo(x, 6)
      }
      // Nearer to now is faster.
      expect(ring.drag(ring.x + 8, ring.y, {}).rate).toBeGreaterThan(0.1)
      expect(ring.drag(ring.x - 8, ring.y, {}).rate).toBeLessThan(0.1)
      expect(ring.drag(lay.lanes.x - 20, ring.y, {}).rate).toBeCloseTo(0.005, 9)
      expect(ring.drag(lay.nowX + 20, ring.y, {}).rate).toBeCloseTo(2, 9)
      expect(ring.reset?.()).toEqual({ rate: 0.1 })
    }
  })
})

describe('the Currents display, second check', () => {
  it('shades every place a cycle can go: no wave of any band ever leaves the reach, and the reach is tight', () => {
    for (const chance of [0, 0.3, 1]) {
      for (const shape of [0, 0.25, 1]) {
        const turn = currentsTurn(shape)
        const most = new Array<number>(101).fill(-Infinity)
        const least = new Array<number>(101).fill(Infinity)
        for (const band of [0, 3, 5]) {
          for (const side of [false, true]) {
            const seed = currentsSeed(band, side)
            for (let cycle = 0; cycle < kPhaseWrap; cycle += 1) {
              for (let n = 0; n <= 100; n += 4) {
                const at = Math.min(n / 100, 0.999999)
                const m = currentsWave(cycle + at, turn, chance, seed)
                const [low, high] = currentsReach(at, turn, chance)
                if (m < low - 1e-9 || m > high + 1e-9)
                  throw new Error(
                    `Chance ${chance}, Shape ${shape}: cycle ${cycle} at ${at} is ${m}, outside ${low}..${high}`,
                  )
                most[n] = Math.max(most[n], m)
                least[n] = Math.min(least[n], m)
              }
            }
          }
        }
        // Tight: over all those cycles the waves come near both edges of it.
        for (let n = 0; n <= 100; n += 4) {
          const [low, high] = currentsReach(Math.min(n / 100, 0.999999), turn, chance)
          expect(high - most[n], `Chance ${chance}, Shape ${shape}, at ${n}: top`).toBeLessThan(
            0.25,
          )
          expect(least[n] - low, `Chance ${chance}, Shape ${shape}, at ${n}: foot`).toBeLessThan(
            0.25,
          )
        }
      }
    }
    // Without Chance the reach is the plain wave itself.
    for (let n = 0; n < 50; n++) {
      const [low, high] = currentsReach(n / 50, currentsTurn(0.25), 0)
      expect(low).toBeCloseTo(currentsWave(n / 50, currentsTurn(0.25), 0, 1), 9)
      expect(high).toBeCloseTo(low, 9)
    }
  }, 60000)

  it('keeps the dot of the lowest band inside the shade, whatever cycle it is in', () => {
    // As first drawn the shade ran from the plain cycle to the smallest one, and a cycle whose
    // crest came early or late carried the dot out of it.
    const values = { chance: 1, depth: 0.8, shape: 0.5 }
    let outside = 0
    for (let n = 0; n < 400; n++) {
      const level1 = 1 + n * 0.3137
      const drawn = drawDisplay(display, CURRENTS_PARAMS, {
        values,
        meters: { ...SOMEWHERE, level1 },
      })
      const [shade] = fills(drawn).filter(
        (fill) => fill.alpha === INK.fill && fill.colour === PLAIN_COLOURS.ink,
      )
      const [mark] = dots(drawn).filter((dot) => dot.r === 2.5)
      const half = shade.points.length / 2
      const upper = shade.points.slice(0, half)
      const lower = shade.points.slice(half).reverse()
      // The shade's two edges at the dot, between the two points either side of it.
      let at = upper.findIndex((point) => point.x >= mark.x)
      if (at <= 0) at = 1
      const t = (mark.x - upper[at - 1].x) / (upper[at].x - upper[at - 1].x)
      const top = upper[at - 1].y + t * (upper[at].y - upper[at - 1].y)
      const foot = lower[at - 1].y + t * (lower[at].y - lower[at - 1].y)
      // (y grows downwards; half a pixel for the straight runs between points)
      if (mark.y < top - 0.5 || mark.y > foot + 0.5) outside += 1
    }
    expect(outside).toBe(0)
  })

  it('writes the time of a cycle in the corner of the large cycle, where it covers no stream', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
      [184, 48],
    ]) {
      for (const values of [{}, { rate: 0.005 }, { rate: 2, bands: 6 }] as Values[]) {
        const options = { width, height, values, meters: SOMEWHERE }
        const lay = currentsLayout(view(options))
        const drawn = drawDisplay(display, CURRENTS_PARAMS, options)
        const written = drawn.calls.filter((call) => call.name === 'fillText')
        expect(written).toHaveLength(1)
        const [words, x, y] = written[0].args as [string, number, number]
        // The harness measures a letter as 5 px wide, and `label` stands the words on a patch 2 px wider each side.
        const right = x + words.length * 5 + 2
        expect(x - 2).toBeGreaterThanOrEqual(lay.cycle.x)
        expect(right).toBeLessThanOrEqual(lay.cycle.x + lay.cycle.w)
        expect(right).toBeLessThan(lay.lanes.x)
        expect(y - 8).toBeGreaterThanOrEqual(0)
        // Written before the wave and the dot are drawn, so that neither is ever covered by its patch.
        const order = drawn.calls.map((call) => call.name)
        let points = 0
        const wave = order.findIndex((name) => {
          if (name === 'beginPath') points = 0
          else if (name === 'lineTo') points += 1
          return name === 'stroke' && points > 2
        })
        expect(wave).toBeGreaterThan(0)
        expect(order.indexOf('fillText')).toBeLessThan(wave)
        expect(order.indexOf('fillText')).toBeLessThan(order.indexOf('arc'))
        // Clear of the Depth ring where it stands highest, at Depth 0 on the untouched line.
        const ring = ringOf('depth', { ...options, values: { ...values, depth: 0 } })
        expect(ring.y - 3.5).toBeGreaterThan(y)
      }
    }
  })

  it('gives the Shape ring room to travel and the streams the height there is', () => {
    for (const [width, height] of [
      [224, 48],
      [204, 100],
    ]) {
      const lay = currentsLayout(view({ width, height }))
      const from = ringOf('shape', { width, height, values: { shape: 0 } }).x
      const to = ringOf('shape', { width, height, values: { shape: 1 } }).x
      // As first laid out the ring travelled 16 px at 224 wide and under 15 at 204.
      expect(to - from).toBeGreaterThanOrEqual(21)
      expect(lay.lanes.y + lay.lanes.h).toBeLessThanOrEqual(height - 3)
      expect(lay.lanes.h / 6).toBeGreaterThanOrEqual(height === 48 ? 7 : 15)
      // The Depth ring travels from the untouched line down to silence: 24 px at the least.
      const still = ringOf('depth', { width, height, values: { depth: 0 } }).y
      const full = ringOf('depth', { width, height, values: { depth: 1 } }).y
      expect(full - still).toBeGreaterThanOrEqual(23.9)
      expect(full).toBeLessThanOrEqual(height - 4)
    }
  })
})

describe('the Currents presets, second check', () => {
  const presets = CURRENTS_DESCRIPTOR.presets ?? {}
  const preset = (name: string): Values => {
    const values = presets[name]
    if (!values) throw new Error(`no preset ${name}`)
    return values
  }
  /** `seconds` of `input` through the device on `values`, 128 samples at a time: what `each` makes of every block. */
  async function through(
    values: Values,
    seconds: number,
    input: (sample: number) => number,
    each: (dry: Float32Array, left: Float32Array, right: Float32Array) => void,
  ): Promise<void> {
    const device = await loadWasmDevice('currents', RATE)
    set(device, values)
    const dry = new Float32Array(128)
    const blocks = Math.floor((seconds * RATE) / 128)
    for (let n = 0; n < blocks; n++) {
      for (let i = 0; i < 128; i++) dry[i] = input(n * 128 + i)
      device.processBlock(dry)
      each(
        dry,
        device.view(device.device.device_out_left(), 128),
        device.view(device.device.device_out_right(), 128),
      )
    }
  }
  const between = (values: number[], low: number, high: number): number => {
    const sorted = [...values].sort((a, b) => a - b)
    const at = (share: number): number => sorted[Math.round(share * (sorted.length - 1))]
    return at(high) - at(low)
  }

  it('never chops a held tone at the fastest band, nor turns it over', async () => {
    // As first tuned "Flutter" took a tone at the top band from 1.67 of its level to under none of
    // it (turned over) inside 16 ms, twelve times a second: a held 6.4 kHz tone lost 42 % of its
    // power to sidebands. The level here is the output against the input, a block at a time.
    const w = (TWO_PI * kTopHz) / RATE
    for (const name of Object.keys(presets)) {
      const levels: number[] = []
      await through(
        preset(name),
        4,
        (sample) => 0.25 * Math.sin(w * sample),
        (dry, left, right) => {
          let out = 0
          let power = 0
          for (let i = 0; i < 128; i++) {
            out += (left[i] + right[i]) * dry[i]
            power += 2 * dry[i] * dry[i]
          }
          levels.push(out / power)
        },
      )
      let fall = 0
      for (let n = 40; n + 6 < levels.length; n++) fall = Math.max(fall, levels[n] - levels[n + 6])
      expect(fall, `${name}: the largest fall inside 16 ms`).toBeLessThan(0.8)
      expect(Math.min(...levels.slice(40)), `${name}: the lowest level`).toBeGreaterThan(0)
    }
  })

  it('"Ripples" moves a note that falls between two of its bands', async () => {
    // As first tuned (Focus 0.6, Depth 0.5) such a note moved 2.4 dB in level and 3.6 dB from side to side.
    const values = preset('Ripples')
    const hz = Math.sqrt(centreHz(120, 6, 1) * centreHz(120, 6, 2))
    const w = (TWO_PI * hz) / RATE
    const level: number[] = []
    const side: number[] = []
    let left = 0
    let right = 0
    let dry = 0
    let blocks = 0
    await through(
      values,
      16,
      (sample) => 0.25 * Math.sin(w * sample),
      (input, outLeft, outRight) => {
        for (let i = 0; i < 128; i++) {
          left += outLeft[i] * outLeft[i]
          right += outRight[i] * outRight[i]
          dry += input[i] * input[i]
        }
        blocks += 1
        if (blocks % 8 !== 0) return
        // The first second is the device settling.
        if (blocks * 128 > RATE) {
          level.push(10 * Math.log10((left + right) / (2 * dry)))
          side.push(10 * Math.log10(left / right))
        }
        left = right = dry = 0
      },
    )
    expect(between(level, 0.05, 0.95)).toBeGreaterThan(4.5)
    expect(between(side, 0.05, 0.95)).toBeGreaterThan(6)
  })

  it('"Undertow" does not take a dense sound down out of hearing', async () => {
    // As first tuned (Depth 0.9, four bands from 20 Hz) two dozen notes fell 14.5 dB at the worst moment of 200 s.
    const tones = Array.from({ length: 24 }, (_, k) => ({
      w: (TWO_PI * 80 * Math.pow(2, k / 4)) / RATE,
      phase: k * 1.7,
    }))
    let out = 0
    let dry = 0
    let blocks = 0
    let lowest = Infinity
    let highest = -Infinity
    await through(
      preset('Undertow'),
      200,
      (sample) => {
        let sum = 0
        for (const tone of tones) sum += Math.sin(tone.w * sample + tone.phase)
        return 0.03 * sum
      },
      (input, left, right) => {
        for (let i = 0; i < 128; i++) {
          out += left[i] * left[i] + right[i] * right[i]
          dry += 2 * input[i] * input[i]
        }
        blocks += 1
        // A quarter of a second at a time, after the first second.
        if (blocks % 94 !== 0) return
        if (blocks * 128 > RATE) {
          const db = 10 * Math.log10(out / dry)
          lowest = Math.min(lowest, db)
          highest = Math.max(highest, db)
        }
        out = dry = 0
      },
    )
    expect(lowest).toBeGreaterThan(-9)
    expect(highest).toBeLessThan(3.2)
  }, 60000)
})
