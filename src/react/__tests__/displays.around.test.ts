// The truth of Around's display: what it draws against the device it stands
// for. The formulas the display is drawn from are checked against numbers
// worked out by hand and against the compiled device itself (what each ear
// gets of a tone at the place its reading reports), and the drawing against
// the formulas.

import { describe, expect, it } from 'vitest'

import { AROUND_PARAMS } from '../../dsp/devices/around.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, gainToDb, hzOfX, yOfDb, type Box } from '../components/display-kit'
import {
  AROUND_BASS_HZ,
  AROUND_FACES,
  AROUND_ITD_SEC,
  AROUND_PATHS,
  AROUND_TOP_HZ,
  AROUND_TURNS,
  aroundBoxes,
  aroundEar,
  aroundFarDelay,
  aroundLateSec,
  aroundNearGain,
  aroundPlace,
  aroundPoint,
  type AroundPlace,
} from '../components/displays/around'
import { type DisplayHandle } from '../components/plate-display'
import { drawDisplay, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const wrap = (cycles: number): number => cycles - Math.floor(cycles)

const around = AROUND_FACES.around.display

// The numbers of `cpp/devices/around/around.h` the display must agree with,
// copied here by hand so a change on either side shows:
//   kItdSeconds 0.00066, kPan 0.6 (12 dB at the full side), kNearDb 12,
//   kPathTurns 16, the top and foot of the scale the display draws (12, −30).
const ITD_SEC = 0.00066
const PAN = 0.6
const NEAR_DB = 12
const TURNS = 16
const TOP_DB = 12
const FOOT_DB = -30

type Values = Readonly<Record<string, number>>

function set(device: WasmDeviceHarness, values: Values): void {
  for (const [name, value] of Object.entries(values))
    device.set(AROUND_PARAMS[name as keyof typeof AROUND_PARAMS], value)
}

/** The device's place on its path, in turns of the path. */
function turnsOf(device: WasmDeviceHarness): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(0) * TURNS
}

/** The tones a parked source is measured with, each a whole number of cycles in a tenth of a second. */
const TONES = [150, 1000, 4000, 7500] as const
const SPAN = RATE / 10
const BLOCK = 120

interface Heard {
  /** Where the device says the source was, in turns. */
  turns: number
  /** The gain of each tone in the left ear and in the right. */
  left: number[]
  right: number[]
  /** How much later the first tone is in each ear than it went in, in seconds. */
  lateLeft: number
  lateRight: number
}

/**
 * Run the device on `tones` (a mono sound, so nothing is at the sides), fast
 * for `run` seconds so the source goes somewhere, then all but parked, and
 * measure what each ear gets there.
 */
async function hear(values: Values, run: number, tones: readonly number[] = TONES): Promise<Heard> {
  const device = await loadWasmDevice('around', RATE)
  set(device, { ...values, rate: 4 })
  const block = new Float32Array(BLOCK)
  let n = 0
  const feed = (): void => {
    for (let i = 0; i < BLOCK; i++, n++) {
      let sample = 0
      for (const hz of tones) sample += 0.1 * Math.sin((TWO_PI * hz * n) / RATE)
      block[i] = sample
    }
    device.processBlock(block)
  }
  for (let done = 0; done < run * RATE; done += BLOCK) feed()
  set(device, { rate: 0.01 })
  for (let done = 0; done < 0.3 * RATE; done += BLOCK) feed()
  const before = turnsOf(device)
  const sums = tones.map(() => [0, 0, 0, 0])
  const start = n
  for (let done = 0; done < SPAN; done += BLOCK) {
    const first = n
    feed()
    const left = device.view(device.device.device_out_left(), BLOCK)
    const right = device.view(device.device.device_out_right(), BLOCK)
    tones.forEach((hz, t) => {
      for (let i = 0; i < BLOCK; i++) {
        const w = (TWO_PI * hz * (first + i)) / RATE
        sums[t][0] += left[i] * Math.sin(w)
        sums[t][1] += left[i] * Math.cos(w)
        sums[t][2] += right[i] * Math.sin(w)
        sums[t][3] += right[i] * Math.cos(w)
      }
    })
  }
  expect(n - start).toBe(SPAN)
  const gain = (re: number, im: number): number => (Math.hypot(re, im) * 2) / SPAN / 0.1
  // A tone in·sin(wn − lag) gives sums (cos lag, −sin lag): the lag over the pitch is how late it is.
  const late = (re: number, im: number): number => Math.atan2(-im, re) / (TWO_PI * tones[0])
  return {
    turns: (before + turnsOf(device)) / 2,
    left: sums.map((sum) => gain(sum[0], sum[1])),
    right: sums.map((sum) => gain(sum[2], sum[3])),
    lateLeft: late(sums[0][0], sums[0][1]),
    lateRight: late(sums[0][2], sums[0][3]),
  }
}

/** Every whole circle a drawing makes: the rim, the head, the source, then the two points. */
function dots(drawn: RecordingContext): { x: number; y: number; r: number }[] {
  return drawn.calls
    .filter((call) => call.name === 'arc' && call.args[3] === 0 && call.args[4] === TWO_PI)
    .map((call) => ({
      x: call.args[0] as number,
      y: call.args[1] as number,
      r: call.args[2] as number,
    }))
}

interface Stroke {
  colour: string
  alpha: number
  width: number
  dashed: boolean
  points: { x: number; y: number }[]
}

/** Every line a drawing strokes, with what it was stroked in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const all: Stroke[] = []
  let path: { x: number; y: number }[] = []
  let colour = ''
  let alpha = 1
  let width = 1
  let dashed = false
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'set lineWidth') width = call.args[0] as number
    else if (call.name === 'setLineDash') dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'stroke') all.push({ colour, alpha, width, dashed, points: path })
  }
  return all
}

/** Every rectangle filled, with the colour and the strength it was filled in. */
function rects(
  drawn: RecordingContext,
): { x: number; y: number; w: number; h: number; colour: string; alpha: number }[] {
  const all: { x: number; y: number; w: number; h: number; colour: string; alpha: number }[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      all.push({ x, y, w, h, colour, alpha })
    }
  }
  return all
}

const WIDE = 204
const at = (place: Partial<AroundPlace>): AroundPlace => ({ x: 0, y: 0, away: 0, ...place })

describe('the maths the display of Around is drawn from', () => {
  it('puts each path where its formula has it', () => {
    const point = (path: (typeof AROUND_PATHS)[number], turns: number): string =>
      aroundPoint(path, turns)
        .map((v) => (Math.round(v * 1000) / 1000 + 0).toFixed(3))
        .join(' ')
    // Circle: in front at the start, to the right a quarter turn on, behind after half.
    expect(point('circle', 0)).toBe('0.000 1.000')
    expect(point('circle', 0.25)).toBe('1.000 0.000')
    expect(point('circle', 0.5)).toBe('0.000 -1.000')
    expect(point('circle', 3.25)).toBe('1.000 0.000')
    // Figure of eight: through the head, half as deep as it is wide, crossing at each half turn.
    expect(point('eight', 0.125)).toBe('0.707 0.500')
    expect(point('eight', 0.375)).toBe('0.707 -0.500')
    expect(point('eight', 0.5)).toBe('0.000 0.000')
    expect(point('eight', 0.625)).toBe('-0.707 0.500')
    // Pendulum: in front, out to each side and back, never behind.
    expect(point('pendulum', 0)).toBe('0.000 1.000')
    expect(point('pendulum', 0.25)).toBe('1.000 0.000')
    expect(point('pendulum', 0.75)).toBe('-1.000 0.000')
    expect(point('pendulum', 0.125)).toBe(
      `${Math.sin(0.25 * Math.SQRT1_2 * TWO_PI).toFixed(3)} ${Math.cos(0.25 * Math.SQRT1_2 * TWO_PI).toFixed(3)}`,
    )
    // Wander: three slow turns a side, in front at the start, the same again after sixteen turns.
    expect(point('wander', 0)).toBe('0.000 1.000')
    expect(point('wander', 4)).toBe(
      `${(0.5 * 0 + 0.3 * 1 + 0.2 * -1).toFixed(3)} ${(0.5 * 0 + 0.3 * 0 + 0.2 * 0).toFixed(3)}`,
    )
    expect(point('wander', 5.3 + AROUND_TURNS)).toBe(point('wander', 5.3))
    for (const path of AROUND_PATHS)
      for (let turns = 0; turns < AROUND_TURNS; turns += 0.037) {
        const [x, y] = aroundPoint(path, turns)
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(1 + 1e-9)
      }
    expect(AROUND_TURNS).toBe(TURNS)
  })

  it('brings the path in with Radius, turns it with Turn and knows how far the near point is', () => {
    // In front at half the way out, turned a quarter to the right: at the right, and still nearest.
    const right = aroundPlace('circle', 0, 0.5, 90)
    expect(right.x).toBeCloseTo(0.5, 9)
    expect(right.y).toBeCloseTo(0, 9)
    expect(right.away).toBeCloseTo(0, 9)
    // Half a turn on: opposite the near point, wherever Turn has put it.
    for (const turn of [0, 90, -120])
      expect(aroundPlace('circle', 0.5, 1, turn).away).toBeCloseTo(1, 9)
    expect(aroundPlace('circle', 0.25, 1, 0).away).toBeCloseTo(0.5, 9)
    expect(aroundPlace('circle', 0.5, 0.6, 0).away).toBeCloseTo(0.6, 9)
    // Turn −90 carries the front to the left; 180 to the back.
    expect(aroundPlace('circle', 0, 1, -90).x).toBeCloseTo(-1, 9)
    expect(aroundPlace('circle', 0, 1, 180).y).toBeCloseTo(-1, 9)
    // Radius 0 is the middle of the head on every path.
    for (const path of AROUND_PATHS) {
      const middle = aroundPlace(path, 0.3, 0, 40)
      expect(Math.hypot(middle.x, middle.y)).toBe(0)
    }
  })

  it('works the cues out as the header does', () => {
    expect(AROUND_ITD_SEC).toBe(ITD_SEC)
    // The delay: none in the middle, all of it at the side, 0.25 · 1.1 / 0.6 half way.
    expect(aroundFarDelay(0)).toBe(0)
    expect(aroundFarDelay(1)).toBeCloseTo(1, 12)
    expect(aroundFarDelay(0.5)).toBeCloseTo(0.4583333, 6)
    // The far ear's bass at the full side: 0.66 ms late with Head 1, half that at a half, the near ear never.
    const side = at({ x: 1 })
    expect(aroundLateSec(-1, side, 1)).toBeCloseTo(ITD_SEC, 9)
    expect(aroundLateSec(-1, side, 0.5)).toBeCloseTo(ITD_SEC / 2, 9)
    expect(aroundLateSec(1, side, 1)).toBe(0)
    expect(aroundLateSec(-1, at({ x: -1 }), 1)).toBe(0)
    // Near: nothing at the near point, 12 dB opposite it, 6 dB a quarter turn on.
    expect(gainToDb(aroundNearGain(at({ away: 1 }), 1))).toBeCloseTo(-NEAR_DB, 9)
    expect(gainToDb(aroundNearGain(at({ away: 0.5 }), 1))).toBeCloseTo(-NEAR_DB / 2, 9)
    expect(aroundNearGain(at({ away: 0 }), 1)).toBe(1)
    expect(aroundNearGain(at({ away: 1 }), 0)).toBe(1)
    // With Head 0 the ears differ in level alone: (1 ± 0.6) / √1.36 at the side, 12 dB apart at any pitch.
    for (const hz of [100, 1000, 9000]) {
      const near = aroundEar(1, side, 0, 0, hz, RATE)
      const far = aroundEar(-1, side, 0, 0, hz, RATE)
      expect(near).toBeCloseTo((1 + PAN) / Math.sqrt(1 + PAN * PAN), 9)
      expect(far).toBeCloseTo((1 - PAN) / Math.sqrt(1 + PAN * PAN), 9)
      expect(gainToDb(near / far)).toBeCloseTo(12.04, 2)
    }
    // In front nothing is done to either ear, and Mix 0 leaves the sound as it came from anywhere.
    for (const hz of [100, 1000, 9000]) {
      expect(aroundEar(-1, at({ y: 1 }), 1, 0, hz, RATE)).toBeCloseTo(1, 9)
      expect(aroundEar(-1, at({ x: 1, y: -0.5, away: 1 }), 1, 1, hz, RATE, 0)).toBe(1)
    }
    // With Head 1 the far ear loses its top: the high band is left at a fifth (−14 dB) under the
    // 12 dB, give or take what leaks of the late low band; the harness measured 24.8 dB over 4 to 12 kHz.
    let nearPower = 0
    let farPower = 0
    for (let hz = 4000; hz <= 12000; hz += 125) {
      nearPower += aroundEar(1, side, 1, 0, hz, RATE) ** 2
      farPower += aroundEar(-1, side, 1, 0, hz, RATE) ** 2
    }
    const top = 10 * Math.log10(farPower / nearPower)
    expect(top).toBeLessThan(-23.5)
    expect(top).toBeGreaterThan(-26)
    // From straight behind both ears are alike, and duller where the notch is than in the bass.
    const behind = at({ y: -1 })
    expect(aroundEar(-1, behind, 1, 0, 7500, RATE)).toBeCloseTo(
      aroundEar(1, behind, 1, 0, 7500, RATE),
      12,
    )
    expect(gainToDb(aroundEar(1, behind, 1, 0, 250, RATE))).toBeGreaterThan(-0.1)
    expect(gainToDb(aroundEar(1, behind, 1, 0, 7500, RATE))).toBeLessThan(-7)
  })
})

describe('the display of Around against the compiled device', () => {
  // Blur is 0 throughout: the room is not drawn, and `aroundEar` leaves it out.
  const cases: { name: string; values: Values; run: number }[] = [
    {
      name: 'a circle at the first settings',
      values: { path: 0, radius: 0.85, head: 0.7, near: 0.25, turn: 0, blur: 0, mix: 1 },
      run: 0.35,
    },
    {
      name: 'a figure of eight turned to the right, near and head full',
      values: { path: 1, radius: 1, head: 1, near: 1, turn: 90, blur: 0, mix: 1 },
      run: 0.8,
    },
    {
      name: 'a pendulum turned behind the left, half mixed',
      values: { path: 2, radius: 1, head: 0.5, near: 0.5, turn: -120, blur: 0, mix: 0.5 },
      run: 0.55,
    },
    {
      name: 'a wander',
      values: { path: 3, radius: 0.9, head: 1, near: 0.6, turn: 45, blur: 0, mix: 1 },
      run: 1.3,
    },
    {
      name: 'a circle with no head',
      values: { path: 0, radius: 1, head: 0, near: 0, turn: 0, blur: 0, mix: 1 },
      run: 0.45,
    },
    {
      name: 'a circle behind',
      values: { path: 0, radius: 1, head: 1, near: 0.3, turn: 0, blur: 0, mix: 1 },
      run: 0.62,
    },
  ]

  it('gives each ear what the device gives it, at the place the device reports', async () => {
    let apart = 0
    let duller = 0
    for (const { name, values, run } of cases) {
      const heard = await hear(values, run)
      const place = aroundPlace(AROUND_PATHS[values.path], heard.turns, values.radius, values.turn)
      // The device is where its clock has it: four turns a second while it ran, next to none after.
      expect(heard.turns, name).toBeGreaterThan(4 * run)
      expect(heard.turns, name).toBeLessThan(4 * run + 0.02)
      TONES.forEach((hz, t) => {
        const ears: [-1 | 1, number][] = [
          [-1, heard.left[t]],
          [1, heard.right[t]],
        ]
        for (const [side, device] of ears) {
          const model = aroundEar(side, place, values.head, values.near, hz, RATE, values.mix)
          const what = `${name}, ${side < 0 ? 'left' : 'right'} ear at ${hz} Hz: ${gainToDb(model)} against ${gainToDb(device)}`
          expect(gainToDb(model), what).toBeGreaterThan(-30)
          expect(Math.abs(gainToDb(model) - gainToDb(device)), what).toBeLessThan(0.5)
        }
      })
      apart = Math.max(apart, Math.abs(gainToDb(heard.left[0] / heard.right[0])))
      duller = Math.max(
        duller,
        gainToDb(heard.left[0] / heard.left[3]),
        gainToDb(heard.right[0] / heard.right[3]),
      )
    }
    // The places were worth measuring: somewhere the ears are far apart, and somewhere the top is well down.
    expect(apart).toBeGreaterThan(6)
    expect(duller).toBeGreaterThan(8)
  })

  it('says how late the far ear is as the device has it', async () => {
    // Started at the front of a path turned a quarter to the right: at the right, the left ear the far one.
    for (const head of [1, 0.5]) {
      const values = { path: 0, radius: 1, head, near: 0, turn: 90, blur: 0, mix: 1 }
      const heard = await hear(values, 0, [100])
      const place = aroundPlace('circle', heard.turns, 1, 90)
      expect(place.x).toBeGreaterThan(0.999)
      const late = heard.lateLeft - heard.lateRight
      expect(late).toBeGreaterThan(0.0006 * head)
      // The words are the delay of the lowest bass; at 100 Hz the split lags a hair less.
      expect(Math.abs(late - aroundLateSec(-1, place, head))).toBeLessThan(0.00002)
      expect(Math.abs(heard.lateRight)).toBeLessThan(0.00001)
    }
  })

  it('reads the clock of the device as turns of the path', async () => {
    const device = await loadWasmDevice('around', RATE)
    set(device, { rate: 2 })
    const block = new Float32Array(128).fill(0.25)
    for (let n = 0; n < RATE / 128; n++) device.processBlock(block)
    // Two turns a second for a second.
    expect(turnsOf(device)).toBeCloseTo(2, 2)
    // And on through silence: the place is kept by the clock, not by the sound.
    device.renderSilence(1.5)
    expect(turnsOf(device)).toBeCloseTo(5, 1)
  })
})

/** The display drawn with the source `turns` round its path, as the device's reading would have it. */
function draw(values: Values, turns: number, width?: number): RecordingContext {
  return drawDisplay(around, AROUND_PARAMS, { values, meters: { phase: turns / TURNS }, width })
}

const value = (values: Values, name: keyof typeof AROUND_PARAMS): number =>
  values[name] ?? AROUND_PARAMS[name].default

/** Where the display should have the source, and how large. */
function sourceAt(values: Values, turns: number, width = 128): { x: number; y: number; r: number } {
  const boxes = aroundBoxes({ width, height: 100 })
  const place = aroundPlace(
    AROUND_PATHS[value(values, 'path')],
    turns,
    value(values, 'radius'),
    value(values, 'turn'),
  )
  return {
    x: boxes.cx + boxes.reach * place.x,
    y: boxes.cy - boxes.reach * place.y,
    r: 2 + 2.5 * aroundNearGain(place, value(values, 'near')),
  }
}

describe('what the display of Around draws from above', () => {
  it('has the source where the reading of the device puts it, larger the nearer it is', () => {
    for (const path of [0, 1, 2, 3])
      for (const turns of [0, 0.25, 0.6, 3.4, 9.9, 15.2])
        for (const width of [128, WIDE]) {
          const values = { path, radius: 0.8, turn: 30, near: 0.7 }
          const [rim, head, source] = dots(draw(values, turns, width))
          const want = sourceAt(values, turns, width)
          expect(source.x).toBeCloseTo(want.x, 6)
          expect(source.y).toBeCloseTo(want.y, 6)
          expect(source.r).toBeCloseTo(want.r, 6)
          // The head is in the middle of the rim, nose up, and the source never leaves the rim.
          expect([head.x, head.y]).toEqual([rim.x, rim.y])
          expect(Math.hypot(source.x - rim.x, source.y - rim.y) + source.r).toBeLessThan(rim.r + 1)
        }
    // In front on a circle is straight above the head; a quarter turn on, to its right.
    const boxes = aroundBoxes({ width: 128, height: 100 })
    const front = dots(draw({ path: 0, radius: 1, turn: 0 }, 0))[2]
    expect(front.x).toBeCloseTo(boxes.cx, 6)
    expect(front.y).toBeCloseTo(boxes.cy - boxes.reach, 6)
    const right = dots(draw({ path: 0, radius: 1, turn: 0 }, 0.25))[2]
    expect(right.x).toBeCloseTo(boxes.cx + boxes.reach, 6)
    expect(right.y).toBeCloseTo(boxes.cy, 6)
    // Near 1: full size at the near point, a quarter of the way to nothing less opposite it.
    expect(dots(draw({ path: 0, radius: 1, near: 1 }, 0))[2].r).toBeCloseTo(4.5, 6)
    expect(dots(draw({ path: 0, radius: 1, near: 1 }, 0.5))[2].r).toBeCloseTo(2 + 2.5 * 0.2512, 3)
  })

  it('draws each path through the places its formula gives', () => {
    const boxes = aroundBoxes({ width: 128, height: 100 })
    for (const path of [0, 1, 2]) {
      const values = { path, radius: 0.7, turn: -50, near: 1 }
      const pieces = strokes(draw(values, 1.3)).filter(
        (stroke) => stroke.colour === PLAIN_COLOURS.ink && stroke.points.length === 3,
      )
      expect(pieces).toHaveLength(48)
      pieces.forEach((piece, i) => {
        piece.points.forEach((point, k) => {
          const place = aroundPlace(AROUND_PATHS[path], (i + k / 2) / 48, 0.7, -50)
          expect(point.x).toBeCloseTo(boxes.cx + boxes.reach * place.x, 6)
          expect(point.y).toBeCloseTo(boxes.cy - boxes.reach * place.y, 6)
        })
      })
      // Stronger where Near has the source closer: the start of the path against the place furthest
      // off (behind on the circle, the back of a loop of the eight, the side on the pendulum).
      const alphas = pieces.map((piece) => piece.alpha)
      const furthest = [24, 18, 12][path]
      expect(alphas[0]).toBeGreaterThan(alphas[furthest] + 0.2)
      const even = strokes(draw({ ...values, near: 0 }, 1.3))
        .filter((stroke) => stroke.colour === PLAIN_COLOURS.ink && stroke.points.length === 3)
        .map((piece) => piece.alpha)
      expect(new Set(even).size).toBe(1)
    }
    // Wander has no closed path: the last of its walk, ending under the source.
    const values = { path: 3, radius: 0.9, turn: 20 }
    const drawn = draw(values, 7.7)
    const walk = strokes(drawn).filter(
      (stroke) => stroke.colour === PLAIN_COLOURS.ink && stroke.points.length === 17,
    )
    expect(walk).toHaveLength(5)
    const source = dots(drawn)[2]
    const end = walk[4].points[16]
    expect(end.x).toBeCloseTo(source.x, 6)
    expect(end.y).toBeCloseTo(source.y, 6)
    const begin = sourceAt(values, 7.7 - 1.25)
    expect(walk[0].points[0].x).toBeCloseTo(begin.x, 6)
    expect(walk[0].points[0].y).toBeCloseTo(begin.y, 6)
    for (let i = 1; i < 5; i++) expect(walk[i].alpha).toBeGreaterThan(walk[i - 1].alpha)
  })

  it('trails the source by where it was half a second ago', () => {
    for (const [rate, back] of [
      [0.2, 0.1],
      [1, 0.5],
      [4, 0.6],
    ]) {
      const values = { path: 0, rate, radius: 1 }
      const drawn = draw(values, 2.2)
      const tail = strokes(drawn).filter((stroke) => stroke.colour === PLAIN_COLOURS.accent)
      expect(tail).toHaveLength(1)
      const from = sourceAt(values, 2.2 - back)
      const to = sourceAt(values, 2.2)
      expect(tail[0].points[0].x).toBeCloseTo(from.x, 6)
      expect(tail[0].points[0].y).toBeCloseTo(from.y, 6)
      expect(tail[0].points[24].x).toBeCloseTo(to.x, 6)
      expect(tail[0].points[24].y).toBeCloseTo(to.y, 6)
    }
  })
})

describe('what the display of Around draws of the two ears', () => {
  it('gives a narrow display a bar an ear: the bass as the bar, the top as the mark', () => {
    const { bars, plot } = aroundBoxes({ width: 128, height: 100 })
    expect(plot).toBeNull()
    if (!bars) throw new Error('a narrow display has bars')
    const y = (gain: number, bar: Box): number =>
      Math.min(bar.y + bar.h, Math.max(bar.y, yOfDb(gainToDb(gain), bar, TOP_DB, FOOT_DB)))
    for (const values of [
      { path: 0, radius: 1, head: 1, near: 0.5, turn: 0, mix: 1 },
      { path: 1, radius: 0.8, head: 0.4, near: 1, turn: 140, mix: 0.6 },
      { path: 3, radius: 1, head: 0.9, near: 0, turn: -70, mix: 1 },
    ])
      for (const turns of [0.2, 0.45, 0.8, 6.1]) {
        const drawn = draw(values, turns)
        const place = aroundPlace(AROUND_PATHS[values.path], turns, values.radius, values.turn)
        bars.forEach((bar, i) => {
          const side = i === 0 ? -1 : 1
          const level = (hz: number): number =>
            aroundEar(side, place, values.head, values.near, hz, RATE, values.mix)
          const [whole, filled] = rects(drawn).filter((r) => r.x === bar.x && r.w === bar.w)
          expect([whole.y, whole.h]).toEqual([bar.y, bar.h])
          expect(filled.y).toBeCloseTo(y(level(AROUND_BASS_HZ), bar), 6)
          expect(filled.y + filled.h).toBeCloseTo(bar.y + bar.h, 6)
          const [mark] = rects(drawn).filter((r) => r.x === bar.x - 2 && r.h === 2)
          expect(mark.colour).toBe(PLAIN_COLOURS.accent)
          expect(mark.y + 1).toBeCloseTo(y(level(AROUND_TOP_HZ), bar), 6)
        })
      }
    // At the right with no head: the right ear 2.75 dB up and the left 9.3 down, and written so.
    const words = draw({ path: 0, radius: 1, head: 0, near: 0 }, 0.25).words()
    expect(words).toEqual(['−9', 'L', '+3', 'R'])
    // In front both ears have the sound as it came.
    expect(draw({ path: 0, radius: 1, head: 1, near: 1 }, 0).words()).toEqual(['0', 'L', '0', 'R'])
  })

  it('gives a wide display each ear over frequency, the right ear dashed', () => {
    const { bars, plot } = aroundBoxes({ width: WIDE, height: 100 })
    expect(bars).toBeNull()
    if (!plot) throw new Error('a wide display has a plot')
    const values = { path: 0, radius: 1, head: 1, near: 0.4, turn: 0, mix: 1 }
    for (const turns of [0.25, 0.4, 0.7]) {
      const drawn = draw(values, turns, WIDE)
      const place = aroundPlace('circle', turns, 1, 0)
      const curves = strokes(drawn).filter(
        (stroke) => stroke.points.length === Math.floor(plot.w / 2) + 1,
      )
      expect(curves.map((curve) => curve.dashed)).toEqual([true, false])
      curves.forEach((curve, i) => {
        const side = i === 0 ? 1 : -1
        for (const point of curve.points) {
          const hz = hzOfX(point.x, plot, 100, 16000)
          const db = gainToDb(aroundEar(side, place, 1, 0.4, hz, RATE))
          const wanted = yOfDb(
            Math.min(TOP_DB + 24, Math.max(FOOT_DB - 24, db)),
            plot,
            TOP_DB,
            FOOT_DB,
          )
          expect(point.y).toBeCloseTo(wanted, 6)
        }
      })
      // The far ear is the lower line in the bass, and its lateness is written out.
      const lower = turns < 0.5 ? 1 : 0
      expect(curves[lower].points[0].y).toBeGreaterThan(curves[1 - lower].points[0].y)
      const late = aroundLateSec(turns < 0.5 ? -1 : 1, place, 1)
      expect(drawn.words()).toContain(
        `${turns < 0.5 ? 'L' : 'R'} ${(late * 1000).toFixed(2)} ms late`,
      )
    }
    // At the full right with Head 1 the left ear is 0.66 ms late; with Head 0, or in front, no ear is.
    expect(draw(values, 0.25, WIDE).words()).toEqual(['L', 'R', 'L 0.66 ms late'])
    expect(
      draw({ ...values, head: 0 }, 0.25, WIDE)
        .words()
        .join(' '),
    ).not.toContain('late')
    expect(draw(values, 0, WIDE).words().join(' ')).not.toContain('late')
  })

  it('draws only what Mix lets be heard, and goes on reading the device at Mix 0', () => {
    const values = { path: 0, radius: 1, head: 1, near: 1, turn: 0, mix: 0 }
    // Narrow: both ears as the sound came in, bass and top alike.
    const { bars, cx, cy, reach } = aroundBoxes({ width: 128, height: 100 })
    const drawn = draw(values, 0.3)
    expect(drawn.words()).toEqual(['0', 'L', '0', 'R'])
    bars?.forEach((bar) => {
      const zero = yOfDb(0, bar, TOP_DB, FOOT_DB)
      expect(rects(drawn).filter((r) => r.x === bar.x && r.w === bar.w)[1].y).toBeCloseTo(zero, 6)
      const mark = rects(drawn).find((r) => r.x === bar.x - 2 && r.h === 2)
      expect((mark?.y ?? NaN) + 1).toBeCloseTo(zero, 6)
    })
    // Wide: two flat lines on 0 dB and no lateness.
    const { plot } = aroundBoxes({ width: WIDE, height: 100 })
    if (!plot) throw new Error('a wide display has a plot')
    const wide = draw(values, 0.3, WIDE)
    const curves = strokes(wide).filter(
      (stroke) => stroke.points.length === Math.floor(plot.w / 2) + 1,
    )
    expect(curves).toHaveLength(2)
    for (const curve of curves)
      for (const point of curve.points)
        expect(point.y).toBeCloseTo(yOfDb(0, plot, TOP_DB, FOOT_DB), 6)
    expect(wide.words()).toEqual(['L', 'R'])
    // The source is still where the device has it, drawn hollow: its colour is laid on at Mix's strength.
    for (const mix of [0, 0.5, 1]) {
      const calls = draw({ ...values, mix }, 0.3).calls
      const source = dots(draw({ ...values, mix }, 0.3))[2]
      expect(source.x).toBeCloseTo(cx + reach * Math.sin(0.3 * TWO_PI), 6)
      expect(source.y).toBeCloseTo(cy - reach * Math.cos(0.3 * TWO_PI), 6)
      const arcs = calls.flatMap((call, n) => (call.name === 'arc' ? [n] : []))
      const after = calls.slice(arcs[2], arcs[3])
      const accent = after.findIndex(
        (call) => call.name === 'set fillStyle' && call.args[0] === PLAIN_COLOURS.accent,
      )
      expect(accent).toBeGreaterThan(0)
      expect(after[accent - 1]).toEqual({ name: 'set globalAlpha', args: [mix] })
      expect(after[accent + 1].name).toBe('fill')
    }
  })
})

describe('the two points of the display of Around', () => {
  const handlesAt = (values: Values, width = 128): DisplayHandle[] =>
    around.handles?.(viewOf(around, AROUND_PARAMS, { values, width })) ?? []

  it('stands Radius on the path a quarter turn on, and Turn on the rim at the near point', () => {
    for (const width of [128, WIDE]) {
      const boxes = aroundBoxes({ width, height: 100 })
      for (const turn of [0, 45, 90, -135, 180])
        for (const radius of [0.2, 0.85, 1]) {
          const values = { path: 0, radius, turn }
          const [radiusPoint, turnPoint] = handlesAt(values, width)
          expect([radiusPoint.key, turnPoint.key]).toEqual(['radius', 'turn'])
          const quarter = sourceAt(values, 0.25, width)
          expect(radiusPoint.x).toBeCloseTo(quarter.x, 6)
          expect(radiusPoint.y).toBeCloseTo(quarter.y, 6)
          // The near point of the path, carried out to the rim.
          const near = aroundPlace('circle', 0, 1, turn)
          expect(turnPoint.x).toBeCloseTo(boxes.cx + boxes.rim * near.x, 6)
          expect(turnPoint.y).toBeCloseTo(boxes.cy - boxes.rim * near.y, 6)
          // They are what the drawing shows as its last two circles.
          const drawn = dots(draw(values, 0, width))
          expect([drawn[3].x, drawn[3].y]).toEqual([turnPoint.x, turnPoint.y])
          expect([drawn[4].x, drawn[4].y]).toEqual([radiusPoint.x, radiusPoint.y])
        }
    }
  })

  it('sets Radius to the place dragged to along its line: drag there, value there', () => {
    for (const turn of [0, 70, -160])
      for (const from of [0.85, 0.1])
        for (const to of [0, 0.3, 0.62, 1]) {
          const before = { path: 1, radius: from, turn }
          const [handle] = handlesAt(before)
          const target = handlesAt({ ...before, radius: to })[0]
          const dragged = handle.drag(target.x, target.y, {})
          expect(Object.keys(dragged)).toEqual(['radius'])
          expect(dragged.radius).toBeCloseTo(to, 9)
        }
    const [handle] = handlesAt({ radius: 0.5, turn: 0 })
    const boxes = aroundBoxes({ width: 128, height: 100 })
    // Past the edge of the path it stays at 1, past the head at 0; off the line only the part along it counts.
    expect(handle.drag(boxes.cx + boxes.reach * 3, boxes.cy, {}).radius).toBe(1)
    expect(handle.drag(boxes.cx - 20, boxes.cy, {}).radius).toBe(0)
    expect(handle.drag(boxes.cx + boxes.reach * 0.4, boxes.cy - 17, {}).radius).toBeCloseTo(0.4, 9)
    // Taken and not moved, it holds what it had to the last digit.
    for (const radius of [0, 0.123456789, 0.85, 1]) {
      const [held] = handlesAt({ radius, turn: 33 })
      expect(held.drag(held.x, held.y, {})).toEqual({ radius })
    }
    expect(handle.reset?.()).toEqual({ radius: AROUND_PARAMS.radius.default })
  })

  it('sets Turn to the direction dragged to round the head, whatever the distance', () => {
    const boxes = aroundBoxes({ width: 128, height: 100 })
    for (const from of [0, 120])
      for (const to of [-170, -90, -20, 0, 45, 90, 179]) {
        const turn = handlesAt({ turn: from })[1]
        for (const out of [0.3, 1, 1.4]) {
          const angle = (to / 360) * TWO_PI
          const x = boxes.cx + boxes.rim * out * Math.sin(angle)
          const y = boxes.cy - boxes.rim * out * Math.cos(angle)
          const dragged = turn.drag(x, y, {})
          expect(Object.keys(dragged)).toEqual(['turn'])
          expect(dragged.turn).toBeCloseTo(to, 6)
        }
        // Drag there, value there: the point then stands where the hand was on the rim.
        const target = handlesAt({ turn: to })[1]
        expect(turn.drag(target.x, target.y, {}).turn).toBeCloseTo(to, 6)
      }
    // Taken and not moved it holds, at the ends of its travel too; in the very middle there is no direction.
    for (const degrees of [-180, -37.5, 0, 180]) {
      const [, held] = handlesAt({ turn: degrees })
      expect(held.drag(held.x, held.y, {})).toEqual({ turn: degrees })
      expect(held.drag(boxes.cx, boxes.cy, {})).toEqual({ turn: degrees })
    }
    expect(handlesAt({ turn: 77 })[1].reset?.()).toEqual({ turn: 0 })
  })
})

describe('the display of Around while the device runs', () => {
  /** The angle of the drawn source round the head, in turns, on a circle of Radius 1. */
  const shown = (drawn: RecordingContext): number => {
    const [rim, , source] = dots(drawn)
    return wrap(Math.atan2(source.x - rim.x, rim.y - source.y) / TWO_PI)
  }

  it('carries the source on between two readings, and stands still with the power off', () => {
    for (const rate of [0.2, 1, 4]) {
      const values = { path: 0, rate, radius: 1, turn: 0 }
      const state = around.init?.()
      let worst = 0
      for (let n = 0; n < 240; n++) {
        const time = n / 60
        // The device reports thirty times a second; the display draws sixty.
        const read = Math.floor(time * 30 + 1e-9) / 30
        const drawn = drawDisplay(around, AROUND_PARAMS, {
          values,
          meters: { phase: wrap((3.1 + rate * read) / TURNS) },
          state,
          now: 10 + time,
          dt: n === 0 ? 0 : 1 / 60,
        })
        const off = wrap(shown(drawn) - (3.1 + rate * time) + 0.5) - 0.5
        if (n > 30) worst = Math.max(worst, Math.abs(off))
      }
      // Holding each reading for its two frames would be off by a sixtieth of Rate: 0.067 of a turn at 4 Hz.
      expect(worst).toBeLessThan(rate / 200 + 0.002)
    }
    // Power off: the reading as it stands, however long the frame.
    const off = drawDisplay(around, AROUND_PARAMS, {
      values: { path: 0, rate: 4, radius: 1 },
      meters: { phase: 0.3 / TURNS },
      powered: false,
      dt: 0.5,
    })
    expect(shown(off)).toBeCloseTo(0.3, 6)
    // A device that reports no place is drawn at the start of its path.
    expect(
      shown(drawDisplay(around, AROUND_PARAMS, { values: { path: 0, radius: 1 } })),
    ).toBeCloseTo(0, 6)
  })
})
