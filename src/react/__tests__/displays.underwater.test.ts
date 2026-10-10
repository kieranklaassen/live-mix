// The truth of Underwater's display: every mark against the device's own
// arithmetic (`cpp/devices/underwater/underwater.h`, whose constants are
// copied below) and against the compiled device, each handle against the
// parameter it sets, and everything live against the reading it is drawn from.

import { describe, expect, it } from 'vitest'

import { UNDERWATER_METERS, UNDERWATER_PARAMS } from '../../dsp/devices/underwater.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS, hzText } from '../components/display-kit'
import { type DisplayHandle, type DisplayView } from '../components/plate-display'
import { PLATE_PALETTES } from '../components/plate-palettes'
import {
  UNDERWATER_FACES,
  UNDERWATER_LIGHT_DEPTH,
  UNDERWATER_SPAN_SEC,
  underwaterBendCents,
  underwaterBubbleRadius,
  underwaterCorner,
  underwaterCount,
  underwaterDepthOfCorner,
  underwaterDepthY,
  underwaterFlight,
  underwaterFlightSeconds,
  underwaterHeld,
  underwaterHumpDb,
  underwaterImmersion,
  underwaterLayout,
  underwaterSide,
  underwaterSurface,
} from '../components/displays/underwater'
import {
  displaySize,
  drawDisplay,
  metersOf,
  patchUnder,
  runDisplay,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

// --- The device's numbers, from `cpp/devices/underwater/underwater.h` ---------

const SR = 48000
/** `kTopHz`, `kDeepHz`: the corner of the water's low-pass at Depth 0 and 1. */
const TOP_HZ = 16000
const DEEP_HZ = 300
/** `kSurfaceDepth`: the share of Depth it takes to go under. */
const SURFACE_DEPTH = 0.1
/** `kBodyTopHz`, `kBodyDeepHz`, `kBodyGain`, `kBodyTrim`: the body's centre, its ring, and its level trim. */
const BODY_TOP_HZ = 520
const BODY_DEEP_HZ = 250
const BODY_GAIN = 3
const BODY_TRIM = 0.3
/** `kLightSplitHz`: the light flickers what lies over this. */
const LIGHT_SPLIT_HZ = 2200
/** `kRippleRatio`, `kSwellShare`, `kRippleShare`: the surface. */
const RIPPLE_RATIO = 0.381966
const SWELL_SHARE = 0.75
const RIPPLE_SHARE = 0.25
/** `kBend`: the bend at full Waver, 45 cents as a ratio less one. `kMaxSwingSeconds`: the delay's longest half swing. */
const BEND = 0.026334
const MAX_SWING_SEC = 0.035
/** `kSqueezeThreshold`. */
const SQUEEZE_THRESHOLD = 0.02
/** `kMostBubbles`, `kSmallHz`, `kLargeHz`, `kFlightRiseOctaves`, `kStrayOctaves`. */
const MOST_BUBBLES = 12
const SMALL_HZ = 2400
const LARGE_HZ = 420
const FLIGHT_RISE_OCTAVES = 0.8
const STRAY_OCTAVES = 0.35
/** `kFlightSmallSeconds`, `kFlightLargeSeconds`: a flight's time constant; none of it comes later than three. */
const FLIGHT_SMALL_SEC = 0.07
const FLIGHT_LARGE_SEC = 0.27

const display = UNDERWATER_FACES.underwater.display
const { plate, ink, accent } = PLAIN_COLOURS

/** The strip as a plate at rest hands it, as the bench's plate does, the upright plate's shape, and a size nobody planned for. */
const REST = displaySize(display)
const SIZES: readonly [number, number][] = [
  [REST.width, REST.height],
  [224, 48],
  [204, 100],
  [320, 140],
]

type Values = Record<string, number>

const view = (values: Values = {}, size: readonly [number, number] = SIZES[0]): DisplayView =>
  viewOf(display, UNDERWATER_PARAMS, { values, width: size[0], height: size[1] })

function handleOf(
  key: string,
  values: Values = {},
  size: readonly [number, number] = SIZES[0],
): DisplayHandle {
  const found = display.handles?.(view(values, size)).find((h) => h.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

/** Readings as a running device gives them: all of them there, the squeeze off. */
const readings = (more: Record<string, number> = {}): Record<string, number> => ({
  ...metersOf(UNDERWATER_METERS),
  squeeze: 1,
  ...more,
})

/** One frame of a running display on a fresh state: what it reads is what it shows. */
const draw = (
  values: Values = {},
  meters: Record<string, number> = {},
  options: FrameOptions = {},
): RecordingContext =>
  drawDisplay(display, UNDERWATER_PARAMS, {
    values,
    meters: readings(meters),
    signal: testSignal(0.5, 0),
    dt: 1 / 30,
    ...options,
  })

// --- Reading what was drawn --------------------------------------------------

interface Mark {
  kind: 'stroke' | 'fill' | 'clip' | 'fillRect'
  /** Which path it was laid on: a path filled and then stroked is one thing. */
  path: number
  points: [number, number][]
  arcs: { x: number; y: number; r: number }[]
  ellipses: { x: number; y: number; rx: number; ry: number }[]
  rect: [number, number, number, number] | null
  alpha: number
  fill: string
  stroke: string
  width: number
  dash: number[]
}

function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  const style = { alpha: 1, fill: '', stroke: '', width: 1, dash: [] as number[] }
  let path = 0
  let points: [number, number][] = []
  let arcs: Mark['arcs'] = []
  let ellipses: Mark['ellipses'] = []
  for (const call of drawn.calls) {
    const args = call.args as number[]
    switch (call.name) {
      case 'set globalAlpha':
        style.alpha = args[0]
        break
      case 'set fillStyle':
        style.fill = String(call.args[0])
        break
      case 'set strokeStyle':
        style.stroke = String(call.args[0])
        break
      case 'set lineWidth':
        style.width = args[0]
        break
      case 'setLineDash':
        style.dash = [...(call.args[0] as number[])]
        break
      case 'beginPath':
        path += 1
        points = []
        arcs = []
        ellipses = []
        break
      case 'moveTo':
      case 'lineTo':
        points.push([args[0], args[1]])
        break
      case 'arc':
        arcs.push({ x: args[0], y: args[1], r: args[2] })
        break
      case 'ellipse':
        ellipses.push({ x: args[0], y: args[1], rx: args[2], ry: args[3] })
        break
      case 'stroke':
      case 'fill':
      case 'clip':
        marks.push({ kind: call.name, path, points, arcs, ellipses, rect: null, ...style })
        break
      case 'fillRect':
        marks.push({
          kind: 'fillRect',
          path: -1,
          points: [],
          arcs: [],
          ellipses: [],
          rect: [args[0], args[1], args[2], args[3]],
          ...style,
        })
        break
      default:
        break
    }
  }
  return marks
}

/** The surface: the one long line. */
const surfaceLine = (marks: Mark[]): Mark => {
  const line = marks.find((mark) => mark.kind === 'stroke' && mark.points.length > 20)
  if (!line) throw new Error('no surface drawn')
  return line
}

/** The water under it: the rows laid inside the clip. */
const waterRows = (marks: Mark[]): Mark[] =>
  marks.filter(
    (mark) => mark.kind === 'fillRect' && mark.fill === ink && (mark.rect?.[3] ?? 9) <= 2,
  )

/** The rays of light. */
const rays = (marks: Mark[]): Mark[] =>
  marks.filter(
    (mark) => mark.kind === 'stroke' && mark.points.length === 2 && mark.stroke === accent,
  )

/** The squeeze marks at the right edge. */
const squeezeMarks = (marks: Mark[], width: number): Mark[] =>
  marks.filter(
    (mark) =>
      mark.kind === 'stroke' &&
      mark.points.length === 2 &&
      mark.stroke === ink &&
      mark.dash.length === 0 &&
      Math.abs(mark.points[1][0] - (width - 4)) < 1e-9 &&
      Math.abs(mark.points[0][0] - (width - 11)) < 1e-9,
  )

/** The sound itself, and the rings of the body round it. */
const lens = (marks: Mark[]): Mark => {
  const found = marks.find(
    (mark) => mark.kind === 'fill' && mark.ellipses.length === 1 && mark.fill === plate,
  )
  if (!found) throw new Error('no sound drawn')
  return found
}
const lensOutline = (marks: Mark[]): Mark => {
  const found = marks.find(
    (mark) => mark.kind === 'stroke' && mark.ellipses.length === 1 && mark.width === 1.5,
  )
  if (!found) throw new Error('the sound has no outline')
  return found
}
const bodyRings = (marks: Mark[]): Mark[] =>
  marks.filter((mark) => mark.kind === 'stroke' && mark.ellipses.length === 1 && mark.width === 1)

const stroked = (marks: Mark[]): Set<number> =>
  new Set(marks.filter((mark) => mark.kind === 'stroke').map((mark) => mark.path))
const filled = (marks: Mark[]): Set<number> =>
  new Set(marks.filter((mark) => mark.kind === 'fill').map((mark) => mark.path))

/** Bubbles on their way: dots in the second colour with no ring. */
const risingBubbles = (marks: Mark[]): Mark[] => {
  const ringed = stroked(marks)
  return marks.filter(
    (mark) =>
      mark.kind === 'fill' &&
      mark.arcs.length === 1 &&
      mark.fill === accent &&
      !ringed.has(mark.path),
  )
}

/** The flight the settings would send: rings with nothing in them. */
const flightRings = (marks: Mark[]): Mark[] => {
  const full = filled(marks)
  return marks.filter(
    (mark) => mark.kind === 'stroke' && mark.arcs.length === 1 && !full.has(mark.path),
  )
}

/** The mark of where the surface is now, over the sound: a dot in the second colour with a ring of ink. */
const surfaceDot = (marks: Mark[]): Mark | undefined => {
  const ringed = new Set(
    marks.filter((mark) => mark.kind === 'stroke' && mark.width === 1).map((mark) => mark.path),
  )
  return marks.find(
    (mark) =>
      mark.kind === 'fill' &&
      mark.arcs.length === 1 &&
      mark.fill === accent &&
      ringed.has(mark.path),
  )
}

// --- The compiled device ------------------------------------------------------

const PLAIN: Values = {
  waver: 0,
  bubbles: 0,
  resonance: 0,
  surface: 0,
  pressure: 0,
  width: 1,
  mix: 1,
}

async function device(values: Values): Promise<WasmDeviceHarness> {
  const host = await loadWasmDevice('underwater', SR)
  for (const [name, value] of Object.entries(values))
    host.set(UNDERWATER_PARAMS[name as keyof typeof UNDERWATER_PARAMS], value)
  return host
}

const reading = (host: WasmDeviceHarness, name: keyof typeof UNDERWATER_METERS): number =>
  host.device.device_meter?.(UNDERWATER_METERS[name].id) ?? Number.NaN

/** Runs `left` and `right` through the device a block at a time; what comes out, both sides. */
function render(
  host: WasmDeviceHarness,
  left: Float32Array,
  right: Float32Array = left,
): { left: Float32Array; right: Float32Array } {
  const out = { left: new Float32Array(left.length), right: new Float32Array(left.length) }
  for (let done = 0; done < left.length; done += 128) {
    const frames = Math.min(128, left.length - done)
    host.processBlock(left.subarray(done, done + frames), right.subarray(done, done + frames))
    out.left.set(host.view(host.device.device_out_left(), frames), done)
    out.right.set(host.view(host.device.device_out_right(), frames), done)
  }
  return out
}

const sine = (hz: number, seconds: number, gain: number): Float32Array =>
  Float32Array.from(
    { length: Math.floor(seconds * SR) },
    (_, i) => gain * Math.sin((2 * Math.PI * hz * i) / SR),
  )

/** A struck note after a moment of nothing: one attack. */
const pluck = (seconds = 2.5): Float32Array =>
  Float32Array.from({ length: Math.floor((0.2 + seconds) * SR) }, (_, i) => {
    const t = i / SR - 0.2
    return t < 0 ? 0 : 0.5 * Math.sin(2 * Math.PI * 330 * t) * Math.exp(-t / 0.12)
  })

const rms = (x: Float32Array, from = 0): number => {
  let sum = 0
  for (let i = from; i < x.length; i++) sum += x[i] * x[i]
  return Math.sqrt(sum / Math.max(1, x.length - from))
}

const decibels = (gain: number): number => 20 * Math.log10(Math.max(gain, 1e-12))

/** How much of a steady tone at `hz` the device passes at these settings, as a gain. */
async function passes(values: Values, hz: number): Promise<number> {
  const host = await device(values)
  const tone = sine(hz, 1, 0.25)
  const out = render(host, tone)
  return rms(out.left, SR / 2) / rms(tone, SR / 2)
}

/** The highest pitch a sine of `hz` is bent to, in cents over itself, read from its rising crossings. */
function sharpestCents(x: Float32Array, hz: number, from: number): number {
  const crossings: number[] = []
  for (let i = Math.max(1, from); i < x.length; i++)
    if (x[i - 1] < 0 && x[i] >= 0) crossings.push(i - 1 + x[i - 1] / (x[i - 1] - x[i]))
  const cycles = 20
  let highest = 0
  for (let i = cycles; i < crossings.length; i++)
    highest = Math.max(highest, (cycles * SR) / (crossings[i] - crossings[i - cycles]))
  return 1200 * Math.log2(highest / hz)
}

describe('the underwater display', () => {
  it('is a strip under the four knobs a player reaches for, reading only what the device has', () => {
    expect(Object.keys(UNDERWATER_FACES)).toEqual(['underwater'])
    expect(display.place).toBe('strip')
    expect(UNDERWATER_FACES.underwater.face).toEqual(['depth', 'waver', 'bubbles', 'mix'])
    for (const name of display.params ?? []) expect(UNDERWATER_PARAMS).toHaveProperty(name)
    // Every reading it is drawn from is one the device reports to a display.
    for (const name of ['swell', 'ripple', 'bubbles', 'pitch', 'squeeze', 'light'] as const)
      expect(UNDERWATER_METERS[name].display).toBe(true)
    expect(display.handles?.(view()).map((h) => h.key)).toEqual(['depth', 'waver'])
  })

  it('stays on the display at every size it is handed', () => {
    const deep = { depth: 1, waver: 1, bubbles: 1, bubbleSize: 1, resonance: 1, surface: 1 }
    const shallow = { depth: 0.15, waver: 1, bubbles: 1, bubbleSize: 0, surface: 1, pressure: 1 }
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      // The surface at its highest leaves the ring whole; the sound at its deepest is whole too.
      expect(layout.surfaceY - layout.swell).toBeGreaterThanOrEqual(5)
      expect(layout.deepY + layout.ry).toBeLessThanOrEqual(height - 4)
      expect(layout.deepY - layout.surfaceY).toBeGreaterThan(height * 0.4)
      expect(layout.perSec * UNDERWATER_SPAN_SEC).toBeCloseTo(width - 8, 9)
      for (const values of [deep, shallow, {}]) {
        for (const handle of display.handles?.(view(values, size)) ?? []) {
          expect(handle.x).toBeGreaterThanOrEqual(5)
          expect(handle.x).toBeLessThanOrEqual(width - 5)
          expect(handle.y).toBeGreaterThanOrEqual(5)
          expect(handle.y).toBeLessThanOrEqual(height - 5)
        }
        const marks = marksOf(
          draw(values, { swell: 0.25, ripple: 0.25, light: 1 }, { width, height }),
        )
        for (const mark of marks) {
          for (const [x, y] of mark.points) {
            expect(x).toBeGreaterThanOrEqual(0)
            expect(x).toBeLessThanOrEqual(width)
            expect(y).toBeGreaterThanOrEqual(0)
            expect(y).toBeLessThanOrEqual(height)
          }
          for (const arc of mark.arcs) {
            expect(arc.x - arc.r).toBeGreaterThanOrEqual(0)
            expect(arc.x + arc.r).toBeLessThanOrEqual(width)
            expect(arc.y - arc.r).toBeGreaterThanOrEqual(0)
            expect(arc.y + arc.r).toBeLessThanOrEqual(height)
          }
        }
        const sound = lens(marks).ellipses[0]
        expect(sound.y - sound.ry).toBeGreaterThanOrEqual(0)
        expect(sound.y + sound.ry).toBeLessThanOrEqual(height - 4)
      }
    }
  })
})

describe('Depth: the sound at its depth, in water that takes the highs', () => {
  it('says the corner the device puts its low-pass at', async () => {
    expect(underwaterCorner(0)).toBe(TOP_HZ)
    expect(underwaterCorner(1)).toBeCloseTo(DEEP_HZ, 9)
    expect(underwaterCorner(0.5)).toBeCloseTo(Math.sqrt(TOP_HZ * DEEP_HZ), 6)
    for (const depth of [0.2, 0.55, 0.9])
      expect(underwaterDepthOfCorner(underwaterCorner(depth))).toBeCloseTo(depth, 9)
    // The compiled device: a tone at the corner the display names is 3 dB down, and it is the water that took it.
    for (const depth of [0.5, 0.75, 1]) {
      const hz = underwaterCorner(depth)
      expect(decibels(await passes({ ...PLAIN, depth }, hz))).toBeCloseTo(-3.01, 0)
      expect(decibels(await passes({ ...PLAIN, depth: 0 }, hz))).toBeCloseTo(0, 3)
    }
  })

  it('goes under over the first tenth of Depth, as the device does', async () => {
    expect(underwaterImmersion(0)).toBe(0)
    expect(underwaterImmersion(SURFACE_DEPTH / 2)).toBeCloseTo(0.5, 9)
    expect(underwaterImmersion(SURFACE_DEPTH)).toBe(1)
    expect(underwaterImmersion(1)).toBe(1)
    // Half under, the device plays half of what the water took: far over the corner that is half the sound.
    const depth = SURFACE_DEPTH / 2
    const high = await passes({ ...PLAIN, depth }, 15000)
    const dark = await passes({ ...PLAIN, depth: 1 }, 15000)
    expect(dark).toBeLessThan(1e-4)
    // At 15 kHz the corner (12.6 kHz here) has turned what it passes round, so it is the levels that are held.
    expect(high).toBeGreaterThan(0.35)
    expect(high).toBeLessThan(1 - 0.5 * underwaterImmersion(depth) + 0.2)
  })

  it('makes the water as shallow as Mix: the corner is where Depth times Mix puts it', async () => {
    // Part way, the dry sound is not blended back over the muffled one (the two would cancel at the
    // corner): the low-pass stands at the corner of a shallower Depth, and the response only falls.
    for (const [depth, mix] of [
      [1, 0.5],
      [0.8, 0.75],
      [0.65, 0.5],
    ]) {
      const hz = underwaterCorner(depth * mix)
      expect(decibels(await passes({ ...PLAIN, depth, mix }, hz))).toBeCloseTo(-3.01, 0)
      let before = 1
      for (const octaves of [-2, -1, -0.5, 0, 0.5, 1, 2]) {
        const now = await passes({ ...PLAIN, depth, mix }, hz * Math.pow(2, octaves))
        expect(now).toBeLessThan(before + 0.005)
        before = now
      }
    }
    expect(await passes({ ...PLAIN, depth: 1, mix: 0 }, 8000)).toBeCloseTo(1, 6)
  })

  it('hangs the sound at its Depth, and the handle is the sound', () => {
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      for (const depth of [0, 0.3, 0.55, 1]) {
        const handle = handleOf('depth', { depth }, size)
        const y = layout.surfaceY + depth * (layout.deepY - layout.surfaceY)
        expect(underwaterDepthY(layout, depth)).toBeCloseTo(y, 9)
        expect(handle.x).toBeCloseTo(layout.soundX, 9)
        expect(handle.y).toBeCloseTo(y, 9)
        const sound = lens(marksOf(draw({ depth }, {}, { width, height }))).ellipses[0]
        expect(sound.x).toBeCloseTo(layout.soundX, 9)
        expect(sound.y).toBeCloseTo(y, 9)
      }
    }
  })

  it('is dragged to where it is let go: the value whose picture is under the hand', () => {
    for (const size of SIZES) {
      const layout = underwaterLayout({ width: size[0], height: size[1] })
      for (const from of [0, 0.55, 1]) {
        const held = handleOf('depth', { depth: from }, size)
        for (const to of [0, 0.1, 0.42, 0.77, 1]) {
          const there = handleOf('depth', { depth: to }, size)
          expect(held.drag(there.x, there.y).depth).toBeCloseTo(to, 9)
          // Across does not matter: it is a depth.
          expect(held.drag(there.x + 40, there.y).depth).toBeCloseTo(to, 9)
        }
        // Pressed and not moved, it stays to the last digit.
        expect(held.drag(held.x, held.y).depth).toBe(from)
        // Past the picture it stops at the ends of the knob.
        expect(held.drag(held.x, layout.surfaceY - 30).depth).toBe(0)
        expect(held.drag(held.x, layout.deepY + 30).depth).toBe(1)
      }
    }
    const handle = handleOf('depth', { depth: 0.5 })
    expect(handle.wheel?.(1).depth).toBeCloseTo(0.48, 9)
    expect(handle.wheel?.(-1).depth).toBeCloseTo(0.52, 9)
    expect(handleOf('depth', { depth: 1 }).wheel?.(-3).depth).toBe(1)
    expect(handle.reset?.().depth).toBe(UNDERWATER_PARAMS.depth.default)
  })

  it('darkens the water downward, and only as far as Mix lets it be heard', () => {
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      const rows = waterRows(marksOf(draw({}, {}, { width, height })))
      expect(rows.length).toBeGreaterThan(height / 4)
      let last = 0
      let lastAlpha = 1
      for (const row of rows) {
        const [x, y, w, h] = row.rect ?? [0, 0, 0, 0]
        expect(x).toBe(4)
        expect(w).toBe(width - 8)
        // Whole rows, none laid twice and none left bare.
        expect(Number.isInteger(y)).toBe(true)
        if (last > 0) expect(y).toBe(last)
        last = y + h
        // Darker by how far down: the plate's light ink is laid 0.34 thick at the surface and 0.04 where
        // Depth 1 hangs, on a plate that is the dark of deep water.
        const under = Math.min(
          1,
          Math.max(0, (y + 1 - layout.surfaceY) / (layout.deepY - layout.surfaceY)),
        )
        expect(row.alpha).toBeCloseTo(0.04 + 0.3 * (1 - under), 9)
        expect(row.alpha).toBeLessThanOrEqual(lastAlpha)
        lastAlpha = row.alpha
      }
      expect(last).toBe(height - 4)
      expect(lastAlpha).toBeCloseTo(0.04, 9)
    }
    // The wash darkens downward only on a plate darker than its ink: the skin is one.
    const light = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const skin = PLATE_PALETTES.underwater
    expect(light(skin.ink)).toBeGreaterThan(light(skin.plate))
    // And each of its two colours can be read on the plate: the ink at 7 to 1 or more, the second colour at 4.5.
    const against = (hex: string): number => (light(hex) + 0.05) / (light(skin.plate) + 0.05)
    expect(against(skin.ink)).toBeGreaterThanOrEqual(7)
    expect(against(skin.accent)).toBeGreaterThanOrEqual(4.5)
    // Half the water in the mix is water half as dark; none is none, and no water is drawn.
    const whole = waterRows(marksOf(draw({ mix: 1 })))
    const half = waterRows(marksOf(draw({ mix: 0.5 })))
    expect(half).toHaveLength(whole.length)
    half.forEach((row, i) => expect(row.alpha).toBeCloseTo(whole[i].alpha / 2, 9))
    const none = marksOf(draw({ mix: 0 }))
    expect(waterRows(none)).toHaveLength(0)
    expect(none.some((mark) => mark.kind === 'clip')).toBe(false)
  })

  it('says the corner in hertz while Depth is in hand, on a patch', () => {
    for (const depth of [0.1, 0.55, 1]) {
      const drawn = draw({ depth }, {}, { hot: 'depth' })
      const words = hzText(underwaterCorner(depth))
      expect(drawn.words()).toEqual([words])
      expect(patchUnder(drawn, words, plate)).not.toBeNull()
    }
    expect(draw().words()).toEqual([])
    // Part way in the mix the corner is the one the device has then: where Depth times Mix puts it.
    expect(underwaterCorner(1, 0.5)).toBeCloseTo(underwaterCorner(0.5), 9)
    expect(underwaterCorner(0.7, 0)).toBe(TOP_HZ)
    expect(draw({ depth: 1, mix: 0.5 }, {}, { hot: 'depth' }).words()).toEqual([
      hzText(underwaterCorner(0.5)),
    ])
    // On the upright plate too, and with the sound hard against the right there is still room for it.
    const drawn = draw({ depth: 1 }, {}, { hot: 'depth', width: 204, height: 100 })
    expect(drawn.words()).toEqual(['300 Hz'])
  })
})

describe('the sound: its sides, the squeeze on it, and the body round it', () => {
  it('is as wide as the device leaves its sides', async () => {
    expect(underwaterSide(0, 0)).toBe(1)
    expect(underwaterSide(1, 0)).toBe(0)
    expect(underwaterSide(0.6, 1)).toBe(1)
    expect(underwaterSide(0.6, 0.5)).toBeCloseTo(0.7, 9)
    // The compiled device, fed a sound that is all side: what is left of it.
    const left = sine(100, 1, 0.2)
    const right = left.map((sample) => -sample)
    const sideOf = async (depth: number, width: number): Promise<number> => {
      const out = render(await device({ ...PLAIN, depth, width }), left, right)
      const side = out.left.map((sample, i) => 0.5 * (sample - out.right[i]))
      return rms(side, SR / 2)
    }
    for (const [depth, width] of [
      [0.4, 0],
      [0.8, 0.25],
      [1, 0.5],
      [1, 0],
    ]) {
      const whole = await sideOf(depth, 1)
      expect((await sideOf(depth, width)) / whole).toBeCloseTo(underwaterSide(depth, width), 2)
    }

    // The lens: its half width goes from all of it to 0.35 of it as the sides go.
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      for (const [depth, wide] of [
        [0.6, 1],
        [0.6, 0.5],
        [1, 0],
      ]) {
        const sound = lens(marksOf(draw({ depth, width: wide }, {}, { width, height }))).ellipses[0]
        expect(sound.rx).toBeCloseTo(layout.rx * (0.35 + 0.65 * underwaterSide(depth, wide)), 9)
      }
    }
    // Half in the mix, half the narrowing is heard; with none of it the sound is drawn whole.
    const layout = underwaterLayout(REST)
    const half = lens(marksOf(draw({ depth: 1, width: 0, mix: 0.5 }))).ellipses[0]
    expect(half.rx).toBeCloseTo(layout.rx * (0.35 + 0.65 * 0.5), 9)
    const dry = lens(marksOf(draw({ depth: 1, width: 0, mix: 0 }))).ellipses[0]
    expect(dry.rx).toBeCloseTo(layout.rx, 9)
  })

  it('is as tall as the device says its squeeze leaves it', async () => {
    expect(underwaterHeld(0, 1)).toBe(1)
    expect(underwaterHeld(1, 0)).toBe(1)
    expect(underwaterHeld(1, 1)).toBeCloseTo(Math.sqrt(SQUEEZE_THRESHOLD), 9)
    // The compiled device on a full-scale tone reports what the formula says a full-scale sound is held to.
    for (const [pressure, depth] of [
      [1, 1],
      [0.5, 0.6],
      [1, 0.3],
    ]) {
      const host = await device({ ...PLAIN, depth, pressure })
      render(host, sine(100, 1, 1))
      expect(reading(host, 'squeeze')).toBeGreaterThan(underwaterHeld(pressure, depth) - 0.002)
      expect(reading(host, 'squeeze')).toBeLessThan(underwaterHeld(pressure, depth) + 0.015)
    }
    // With nothing to squeeze it reports no squeeze.
    const quiet = await device({ ...PLAIN, depth: 1, pressure: 1 })
    render(quiet, sine(100, 0.5, 0.01))
    expect(reading(quiet, 'squeeze')).toBe(1)

    // The lens follows the reading: its half height is that share of its own.
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      for (const squeeze of [1, 0.6, 0.15]) {
        const drawn = runDisplay(display, UNDERWATER_PARAMS, 2, {
          meters: readings({ squeeze }),
          signal: testSignal(0.5, 0),
          width,
          height,
        })
        expect(lens(marksOf(drawn)).ellipses[0].ry).toBeCloseTo(layout.ry * squeeze, 3)
      }
    }
    // Half in the mix it is half as squeezed; with none of the water it is not squeezed at all.
    const layout = underwaterLayout(REST)
    const run = (mix: number): number =>
      lens(
        marksOf(
          runDisplay(display, UNDERWATER_PARAMS, 2, {
            values: { mix },
            meters: readings({ squeeze: 0.4 }),
            signal: testSignal(0.5, 0),
          }),
        ),
      ).ellipses[0].ry
    expect(run(0.5)).toBeCloseTo(layout.ry * 0.7, 3)
    expect(run(0)).toBeCloseTo(layout.ry, 9)
    // A reading that is no gain is no squeeze, and a display that is not running shows none.
    expect(lens(marksOf(draw({}, { squeeze: Number.NaN }))).ellipses[0].ry).toBeCloseTo(
      layout.ry,
      9,
    )
    const still = drawDisplay(display, UNDERWATER_PARAMS, { meters: readings({ squeeze: 0.2 }) })
    expect(lens(marksOf(still)).ellipses[0].ry).toBeCloseTo(layout.ry, 9)
  })

  it('marks how deep the squeeze reaches each quarter of a full one', () => {
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      const at = (values: Values): number[] =>
        squeezeMarks(marksOf(draw(values, {}, { width, height })), width).map(
          (mark) => mark.points[0][1],
        )
      // Pressure times Depth is the squeeze: a mark where it is a quarter, a half, three quarters.
      const full = at({ pressure: 1 })
      expect(full).toHaveLength(3)
      full.forEach((y, k) =>
        expect(Math.abs(y - underwaterDepthY(layout, (k + 1) / 4))).toBeLessThanOrEqual(0.5),
      )
      const half = at({ pressure: 0.5 })
      expect(half).toHaveLength(2)
      expect(Math.abs(half[0] - underwaterDepthY(layout, 0.5))).toBeLessThanOrEqual(0.5)
      expect(Math.abs(half[1] - underwaterDepthY(layout, 1))).toBeLessThanOrEqual(0.5)
      expect(at({ pressure: 0.2 })).toHaveLength(0)
      expect(at({ pressure: 0 })).toHaveLength(0)
      expect(at({ pressure: 1, mix: 0 })).toHaveLength(0)
    }
    // The marks the sound has gone under are the strong ones.
    const marks = squeezeMarks(marksOf(draw({ pressure: 1, depth: 0.55 })), REST.width)
    expect(marks.map((mark) => mark.alpha)).toEqual([INK.trace, INK.trace, INK.rule])
  })

  it('rings the sound once for every 3 dB of the hump the device raises', async () => {
    expect(underwaterHumpDb(0, 1)).toBe(0)
    expect(underwaterHumpDb(1, 0)).toBe(0)
    expect(underwaterHumpDb(1, 1)).toBeCloseTo(20 * Math.log10(1 + BODY_GAIN), 9)
    // The compiled device at the body's centre, against itself with no Body: the hump, less the trim it is given.
    for (const [resonance, depth] of [
      [1, 0.3],
      [0.5, 0.8],
      [1, 1],
    ]) {
      const hz = BODY_TOP_HZ * Math.pow(BODY_DEEP_HZ / BODY_TOP_HZ, depth)
      const ring = BODY_GAIN * resonance * depth
      const raised =
        (await passes({ ...PLAIN, depth, resonance }, hz)) / (await passes({ ...PLAIN, depth }, hz))
      const trim = decibels(1 / (1 + BODY_TRIM * ring))
      expect(decibels(raised) - trim).toBeCloseTo(underwaterHumpDb(resonance, depth), 0)
      expect(Math.abs(decibels(raised) - trim - underwaterHumpDb(resonance, depth))).toBeLessThan(
        0.25,
      )
    }

    const count = (values: Values): Mark[] => bodyRings(marksOf(draw(values)))
    expect(count({ resonance: 0 })).toHaveLength(0)
    expect(count({ resonance: 1, depth: 0 })).toHaveLength(0)
    // 12 dB at the most: four rings.
    const most = count({ resonance: 1, depth: 1 })
    expect(most).toHaveLength(4)
    for (const ringMark of most) expect(ringMark.alpha).toBeCloseTo(INK.back, 9)
    // The defaults raise 4.4 dB: one whole ring and 0.47 of the next.
    const usual = count({})
    const hump = underwaterHumpDb(0.4, 0.55)
    expect(hump).toBeCloseTo(4.4, 1)
    expect(usual).toHaveLength(2)
    expect(usual[0].alpha).toBeCloseTo(INK.back, 9)
    expect(usual[1].alpha).toBeCloseTo(INK.back * (hump / 3 - 1), 9)
    // They lie round the sound, each further out, and Mix takes them with the water.
    const sound = lens(marksOf(draw({}))).ellipses[0]
    usual.forEach((ringMark, k) => {
      expect(ringMark.ellipses[0].x).toBe(sound.x)
      expect(ringMark.ellipses[0].y).toBe(sound.y)
      expect(ringMark.ellipses[0].rx).toBeCloseTo(sound.rx + 3 * (k + 1), 9)
      expect(ringMark.ellipses[0].ry).toBeCloseTo(sound.ry + 2.2 * (k + 1), 9)
    })
    expect(count({ resonance: 1, depth: 1, mix: 0.5 })[0].alpha).toBeCloseTo(INK.back / 2, 9)
    expect(count({ resonance: 1, depth: 1, mix: 0 })).toHaveLength(0)
  })

  it('cuts the rings of a sound on the bottom at the floor of the water', () => {
    for (const [width, height] of SIZES) {
      const marks = marksOf(draw({ resonance: 1, depth: 1 }, {}, { width, height }))
      const rings = bodyRings(marks)
      expect(rings).toHaveLength(4)
      // Left alone the widest would run on past the water, into the display's edge.
      const widest = rings[3].ellipses[0]
      expect(widest.y + widest.ry).toBeGreaterThan(height - 4)
      // They are laid inside a cut that is the water's own box, the one after the cut of the surface.
      const cuts = marks.filter((mark) => mark.kind === 'clip')
      expect(cuts).toHaveLength(2)
      expect(cuts[1].points).toEqual([
        [4, 4],
        [width - 4, 4],
        [width - 4, height - 4],
        [4, height - 4],
      ])
      expect(marks.indexOf(cuts[1])).toBeLessThan(marks.indexOf(rings[0]))
    }
    // With no Body there is no ring and nothing to cut.
    const plain = marksOf(draw({ resonance: 0, depth: 1 }))
    expect(plain.filter((mark) => mark.kind === 'clip')).toHaveLength(1)
  })

  it('lights with the sound coming out, and is an outline of dashes with none of the water in the mix', () => {
    const lit = (output: number): Mark[] => {
      const drawn = runDisplay(display, UNDERWATER_PARAMS, 1, {
        meters: readings(),
        signal: testSignal(0.5, output),
      })
      const marks = marksOf(drawn)
      const path = lens(marks).path
      return marks.filter(
        (mark) => mark.kind === 'fill' && mark.path === path && mark.fill === accent,
      )
    }
    expect(lit(0)).toHaveLength(0)
    const loud = lit(0.5)
    const soft = lit(0.01)
    expect(loud).toHaveLength(1)
    expect(soft).toHaveLength(1)
    expect(loud[0].alpha).toBeGreaterThan(soft[0].alpha)
    expect(loud[0].alpha).toBeLessThanOrEqual(0.85)
    expect(lensOutline(marksOf(draw({}))).dash).toEqual([])
    expect(lensOutline(marksOf(draw({ mix: 0 }))).dash).toEqual([2, 2])
    expect(lensOutline(marksOf(draw({ mix: 0 }))).stroke).toBe(ink)
  })
})

describe('Waver: the surface that moves the sound', () => {
  it('is the device’s own swell and ripple, three to one', () => {
    expect(underwaterSurface(0.25, 0.25)).toBeCloseTo(1, 9)
    expect(underwaterSurface(0.75, 0.75)).toBeCloseTo(-1, 9)
    expect(underwaterSurface(0.25, 0)).toBeCloseTo(SWELL_SHARE, 9)
    expect(underwaterSurface(0, 0.25)).toBeCloseTo(RIPPLE_SHARE, 9)
    expect(underwaterSurface(0, 0.5)).toBeCloseTo(0, 9)
  })

  it('keeps the time the device keeps, awake and asleep', async () => {
    // The device's two readings turn at Swell and at 0.382 of it, in sound and in silence alike.
    for (const input of [sine(220, 1, 0.2), new Float32Array(SR)]) {
      const host = await device({ ...PLAIN, depth: 0.5, waver: 0.5, rate: 0.7 })
      render(host, input.subarray(0, 128 * 10))
      const swell = reading(host, 'swell')
      const ripple = reading(host, 'ripple')
      const blocks = 150
      render(host, input.subarray(0, 128 * blocks))
      const seconds = (128 * blocks) / SR
      const turned = (now: number, then: number): number => (((now - then) % 1) + 1) % 1
      expect(turned(reading(host, 'swell'), swell)).toBeCloseTo((0.7 * seconds) % 1, 4)
      expect(turned(reading(host, 'ripple'), ripple)).toBeCloseTo(
        (0.7 * RIPPLE_RATIO * seconds) % 1,
        4,
      )
    }
  })

  it('draws the surface from the readings: under the sound is now, to its right what has passed', () => {
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      for (const values of [
        { waver: 1, rate: 0.5, depth: 0.5 },
        { waver: 0.35, rate: 2.2, depth: 0.3 },
        { waver: 0.8, rate: 0.05, depth: 1, mix: 0.5 },
        { waver: 0.6, rate: 0.3, depth: 0.05 },
      ] as Values[]) {
        const swell = 0.3
        const ripple = 0.7
        const marks = marksOf(draw(values, { swell, ripple }, { width, height }))
        const line = surfaceLine(marks)
        const heard = (values.mix ?? 1) * underwaterImmersion(values.depth)
        const tall = layout.swell * values.waver * heard
        expect(line.points[0][0]).toBe(4)
        expect(line.points[line.points.length - 1][0]).toBeCloseTo(width - 4, 9)
        // Fine enough for the fastest swell: more than twenty points to a wave.
        expect(line.points[1][0] - line.points[0][0]).toBeLessThanOrEqual(1)
        for (const [x, y] of line.points) {
          const ago = ((x - layout.soundX) / layout.perSec) * values.rate
          const expected =
            layout.surfaceY - tall * underwaterSurface(swell - ago, ripple - ago * RIPPLE_RATIO)
          expect(y).toBeCloseTo(expected, 9)
          expect(Math.abs(y - layout.surfaceY)).toBeLessThanOrEqual(tall + 1e-9)
        }
        expect(line.stroke).toBe(ink)
        expect(line.alpha).toBe(INK.trace)
        // Over the sound, the mark of where the surface is this moment.
        const now = surfaceDot(marks)
        expect(now?.arcs[0].x).toBeCloseTo(layout.soundX, 9)
        expect(now?.arcs[0].y).toBeCloseTo(
          layout.surfaceY - tall * underwaterSurface(swell, ripple),
          9,
        )
        // The water is cut to the same line.
        const cut = marks.find((mark) => mark.kind === 'clip')
        expect(cut?.points.slice(0, line.points.length)).toEqual(line.points)
      }
    }
  })

  it('lies flat where nothing of the waver is heard, and still follows the device', () => {
    const layout = underwaterLayout(REST)
    for (const values of [{ waver: 0 }, { depth: 0, waver: 1 }, { mix: 0, waver: 1 }] as Values[]) {
      const marks = marksOf(draw(values, { swell: 0.25, ripple: 0.25 }))
      for (const [, y] of surfaceLine(marks).points) expect(y).toBeCloseTo(layout.surfaceY, 9)
    }
    // Out of the water or out of the mix there is no mark of the moment either.
    expect(surfaceDot(marksOf(draw({ depth: 0 })))).toBeUndefined()
    expect(surfaceDot(marksOf(draw({ mix: 0 })))).toBeUndefined()

    // Read through a second at Mix 0, the surface is where the device has it the frame Mix comes back.
    const state = display.init?.()
    const rate = 0.8
    runDisplay(
      display,
      UNDERWATER_PARAMS,
      1,
      { values: { mix: 0, waver: 1, rate }, state, signal: testSignal(0.5, 0) },
      (time) => ({ meters: readings({ swell: (0.1 + rate * time) % 1, ripple: 0.4 }) }),
    )
    const swell = (0.1 + rate * 1) % 1
    const back = drawDisplay(display, UNDERWATER_PARAMS, {
      values: { mix: 1, waver: 1, rate },
      meters: readings({ swell, ripple: 0.4 }),
      signal: testSignal(0.5, 0),
      state,
      now: 11,
      dt: 1 / 30,
    })
    const now = surfaceDot(marksOf(back))
    const expected = layout.surfaceY - layout.swell * underwaterSurface(swell, 0.4)
    // The ripple was carried forward a second at its own rate from a reading that stood: it is where it was read.
    expect(Math.abs((now?.arcs[0].y ?? 0) - expected)).toBeLessThan(0.6)
  })

  it('moves with the readings and stands still when the device is off', () => {
    const rate = 1
    const each = (time: number): Partial<FrameOptions> => ({
      meters: readings({ swell: (rate * time) % 1, ripple: (rate * RIPPLE_RATIO * time) % 1 }),
    })
    const values = { waver: 1, rate }
    const at = (seconds: number, powered = true): number =>
      surfaceDot(
        marksOf(
          runDisplay(
            display,
            UNDERWATER_PARAMS,
            seconds,
            { values, signal: testSignal(0.5, 0), powered },
            each,
          ),
        ),
      )?.arcs[0].y ?? Number.NaN
    const layout = underwaterLayout(REST)
    // A quarter of a second on, the swell is at its crest: the surface over the sound has risen by most of the swell.
    const frames = (seconds: number): number => (Math.round(seconds * 30) - 1) / 30
    for (const seconds of [0.25, 0.5, 0.8]) {
      const time = frames(seconds)
      const expected =
        layout.surfaceY - layout.swell * underwaterSurface(rate * time, rate * RIPPLE_RATIO * time)
      expect(Math.abs(at(seconds) - expected)).toBeLessThan(0.35)
    }
    expect(at(0.25)).toBeLessThan(at(0.75))
    // Bypassed it is drawn at rest: the surface where a still picture has it, whatever the readings were.
    expect(at(0.25, false)).toBeCloseTo(layout.surfaceY, 9)
    expect(at(0.8, false)).toBeCloseTo(layout.surfaceY, 9)
  })

  it('says the bend the device makes: 45 cents at full Waver, less at the slowest swells', async () => {
    const steepest = (rate: number): number =>
      2 * Math.PI * rate * (SWELL_SHARE + RIPPLE_SHARE * RIPPLE_RATIO)
    expect(underwaterBendCents(1, 1, 0.5)).toBeCloseTo(1200 * Math.log2(1 + BEND), 6)
    expect(underwaterBendCents(1, 1, 0.5)).toBeCloseTo(45, 1)
    expect(underwaterBendCents(1, 3, 1)).toBeCloseTo(45, 1)
    expect(underwaterBendCents(0, 1, 0.5)).toBe(0)
    expect(underwaterBendCents(1, 1, 0)).toBe(0)
    // Under 0.14 Hz the delay's swing stops at 35 ms and the bend is what that gives.
    expect(BEND / steepest(0.15)).toBeLessThan(MAX_SWING_SEC)
    expect(BEND / steepest(0.05)).toBeGreaterThan(MAX_SWING_SEC)
    expect(underwaterBendCents(1, 0.05, 1)).toBeCloseTo(
      1200 * Math.log2(1 + MAX_SWING_SEC * steepest(0.05)),
      9,
    )
    expect(underwaterBendCents(1, 0.05, 1)).toBeCloseTo(16, 0)

    // The compiled device bending a sine: the sharpest it goes over fourteen seconds of surface.
    const tone = sine(1000, 14, 0.3)
    for (const waver of [1, 0.5]) {
      const out = render(await device({ ...PLAIN, depth: 0.5, waver, rate: 1 }), tone)
      const cents = sharpestCents(out.left, 1000, SR)
      expect(Math.abs(cents - underwaterBendCents(waver, 1, 0.5))).toBeLessThan(1.5)
    }
    const flat = render(await device({ ...PLAIN, depth: 0.5, waver: 0, rate: 1 }), tone)
    expect(Math.abs(sharpestCents(flat.left, 1000, SR))).toBeLessThan(0.05)

    // Part way in the mix the dry sound rides the same surface: the whole sound is bent, as far as Mix says.
    expect(underwaterBendCents(1, 1, 0.5, 0)).toBe(0)
    expect(underwaterBendCents(1, 1, 0.5, 0.5)).toBeCloseTo(1200 * Math.log2(1 + BEND / 2), 9)
    expect(underwaterBendCents(1, 1, 0.5, 1)).toBe(underwaterBendCents(1, 1, 0.5))
    for (const mix of [0.5, 0.25]) {
      const out = render(await device({ ...PLAIN, depth: 0.5, waver: 1, rate: 1, mix }), tone)
      const cents = sharpestCents(out.left, 1000, SR)
      expect(Math.abs(cents - underwaterBendCents(1, 1, 0.5, mix))).toBeLessThan(1.5)
    }
  })

  it('runs the ring across for Waver, up the slope of how high the surface gets', () => {
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      const across = layout.waverTo - layout.waverFrom
      // Room to set it by hand: sixty pixels or more for the whole of Waver, not the 8 the swell is tall on a strip.
      expect(across).toBeGreaterThanOrEqual(60)
      // Clear of the sound and of the rings its body draws round it, and whole at the edge.
      expect(layout.waverFrom - 5).toBeGreaterThanOrEqual(layout.soundX + layout.rx + 12)
      expect(layout.waverTo + 5).toBeLessThanOrEqual(width - 4)
      for (const waver of [0, 0.35, 0.8, 1]) {
        const handle = handleOf('waver', { waver }, size)
        expect(handle.x).toBeCloseTo(layout.waverFrom + waver * across, 9)
        // Heard in full, the ring is at the crest: the highest this surface gets.
        expect(handle.y).toBeCloseTo(layout.surfaceY - waver * layout.swell, 9)
        const marks = marksOf(draw({ waver }, { swell: 0.25, ripple: 0.25 }, { width, height }))
        const crest = Math.min(...surfaceLine(marks).points.map(([, y]) => y))
        expect(crest).toBeGreaterThanOrEqual(handle.y - 1e-9)
        // The dashed slope it runs up: from the surface at rest to the top of the swell, and the ring is on it.
        const slope = marks.find(
          (m) => m.kind === 'stroke' && m.points.length === 2 && m.dash.length === 2,
        )
        expect(slope?.points[0][0]).toBeCloseTo(layout.waverFrom, 9)
        expect(slope?.points[0][1]).toBeCloseTo(layout.surfaceY, 9)
        expect(slope?.points[1][0]).toBeCloseTo(layout.waverTo, 9)
        expect(slope?.points[1][1]).toBeCloseTo(layout.surfaceY - layout.swell, 9)
        expect(slope?.alpha).toBe(INK.grid)
        const [[x0, y0], [x1, y1]] = slope?.points ?? [
          [0, 0],
          [1, 1],
        ]
        expect(handle.y).toBeCloseTo(y0 + ((handle.x - x0) / (x1 - x0)) * (y1 - y0), 9)
      }
      for (const settings of [
        {},
        { mix: 0 },
        { depth: 0 },
        { mix: 0.3, depth: 0.05 },
      ] as Values[]) {
        for (const from of [0, 0.35, 1]) {
          const held = handleOf('waver', { ...settings, waver: from }, size)
          for (const to of [0, 0.2, 0.5, 0.93, 1]) {
            const there = handleOf('waver', { ...settings, waver: to }, size)
            expect(held.drag(there.x, there.y).waver).toBeCloseTo(to, 9)
            // Only across counts: the hand may stray up or down.
            expect(held.drag(there.x, there.y + 30).waver).toBeCloseTo(to, 9)
            expect(held.drag(there.x, there.y - 30).waver).toBeCloseTo(to, 9)
          }
          expect(held.drag(held.x, held.y).waver).toBe(from)
          expect(held.drag(width + 60, held.y).waver).toBe(1)
          expect(held.drag(-60, held.y).waver).toBe(0)
          expect(held.drag(layout.soundX, held.y).waver).toBe(0)
        }
      }
      // A pixel of the hand is a small step of Waver: under two hundredths.
      const middle = handleOf('waver', { waver: 0.5 }, size)
      expect(Math.abs(middle.drag(middle.x + 1, middle.y).waver - 0.5)).toBeLessThan(0.02)
      // Where the waver is not heard the ring still climbs: half the swell.
      const unheard = handleOf('waver', { waver: 1, mix: 0 }, size)
      expect(unheard.y).toBeCloseTo(layout.surfaceY - layout.swell / 2, 9)
      expect(unheard.x).toBeCloseTo(layout.waverTo, 9)
    }
    const handle = handleOf('waver', { waver: 0.5 })
    expect(handle.wheel?.(1).waver).toBeCloseTo(0.52, 9)
    expect(handle.wheel?.(-1).waver).toBeCloseTo(0.48, 9)
    expect(handleOf('waver', { waver: 0 }).wheel?.(-2).waver).toBe(0)
    expect(handle.reset?.().waver).toBe(UNDERWATER_PARAMS.waver.default)
  })

  it('says the bend in cents while Waver is in hand, on a patch that stays on the display', () => {
    for (const values of [
      { waver: 1, rate: 1 },
      { waver: 0.35, rate: 0.3 },
      { waver: 1, rate: 0.05 },
      { waver: 1, depth: 0 },
      { waver: 1, rate: 1, mix: 0.5 },
      { waver: 0, rate: 1 },
    ] as Values[]) {
      for (const size of SIZES) {
        const [width, height] = size
        const drawn = draw(values, {}, { hot: 'waver', width, height })
        const cents = underwaterBendCents(
          values.waver,
          values.rate ?? UNDERWATER_PARAMS.rate.default,
          values.depth ?? UNDERWATER_PARAMS.depth.default,
          values.mix ?? UNDERWATER_PARAMS.mix.default,
        )
        const words = `${Math.round(cents)} ct`
        expect(drawn.words()).toEqual([words])
        const patch = patchUnder(drawn, words, plate)
        expect(patch).not.toBeNull()
        expect(patch?.x ?? -1).toBeGreaterThanOrEqual(0)
        expect((patch?.x ?? 0) + (patch?.w ?? width + 1)).toBeLessThanOrEqual(width)
      }
    }
    expect(draw({ waver: 1, rate: 1 }, {}, { hot: 'waver' }).words()).toEqual(['45 ct'])
    expect(draw({ waver: 1, depth: 0 }, {}, { hot: 'waver' }).words()).toEqual(['0 ct'])
    // Half in the mix, the whole sound is bent half as far: the dry sound rides the same surface.
    expect(draw({ waver: 1, rate: 1, mix: 0.5 }, {}, { hot: 'waver' }).words()).toEqual(['23 ct'])
  })
})

describe('Surface: light on the water', () => {
  it('reaches as deep as the water passes what the light flickers', async () => {
    expect(underwaterCorner(UNDERWATER_LIGHT_DEPTH)).toBeCloseTo(LIGHT_SPLIT_HZ, 6)
    expect(UNDERWATER_LIGHT_DEPTH).toBeCloseTo(0.499, 2)
    // The compiled device: its flicker reading stays between -1 and 1, moves in sound and stands at 0 asleep.
    const host = await device({ ...PLAIN, depth: 0.3, surface: 1 })
    let low = 1
    let high = -1
    const tone = sine(5000, 0.5, 0.2)
    for (let done = 0; done + 128 <= tone.length; done += 128) {
      host.processBlock(tone.subarray(done, done + 128))
      low = Math.min(low, reading(host, 'light'))
      high = Math.max(high, reading(host, 'light'))
    }
    expect(low).toBeGreaterThanOrEqual(-1)
    expect(high).toBeLessThanOrEqual(1)
    expect(high - low).toBeGreaterThan(1)
    host.renderSilence(6)
    expect(reading(host, 'light')).toBe(0)
  })

  it('draws rays as bright as Surface is heard, flickering with the device', () => {
    for (const size of SIZES) {
      const [width, height] = size
      const layout = underwaterLayout({ width, height })
      const reach = underwaterDepthY(layout, UNDERWATER_LIGHT_DEPTH)
      const lit = (values: Values, light: number, seconds = 0.5): Mark[] =>
        rays(
          marksOf(
            runDisplay(display, UNDERWATER_PARAMS, seconds, {
              values,
              meters: readings({ light }),
              signal: testSignal(0.5, 0),
              width,
              height,
            }),
          ),
        )
      const bright = lit({ surface: 1, waver: 0 }, 1)
      expect(bright).toHaveLength(5)
      for (const ray of bright) {
        // From the surface down to where the light is lost, leaning, and all of it on the display.
        expect(ray.points[0][1]).toBeCloseTo(layout.surfaceY, 9)
        expect(ray.points[1][1]).toBeCloseTo(reach, 9)
        expect(ray.points[1][0]).toBeGreaterThan(ray.points[0][0])
        expect(ray.points[1][0]).toBeLessThanOrEqual(width - 4)
        expect(ray.alpha).toBeCloseTo(1, 9)
      }
      // The flicker: with the reading at its lowest the rays are out, at rest they are at half.
      for (const ray of lit({ surface: 1 }, -1)) expect(ray.alpha).toBeCloseTo(0, 9)
      for (const ray of lit({ surface: 1 }, 0)) expect(ray.alpha).toBeCloseTo(0.5, 9)
      for (const ray of lit({ surface: 0.3 }, 1)) expect(ray.alpha).toBeCloseTo(0.3, 9)
      // Heard only as far as the sound is under and in the mix; and with the water half as deep in the
      // mix, the light reaches twice as far down the Depths (here to the bottom).
      for (const ray of lit({ surface: 1, mix: 0.5 }, 1)) {
        expect(ray.alpha).toBeCloseTo(0.5, 9)
        expect(ray.points[1][1]).toBeCloseTo(
          underwaterDepthY(layout, Math.min(1, UNDERWATER_LIGHT_DEPTH / 0.5)),
          9,
        )
      }
      for (const ray of lit({ surface: 1, mix: 0.8 }, 1))
        expect(ray.points[1][1]).toBeCloseTo(
          underwaterDepthY(layout, UNDERWATER_LIGHT_DEPTH / 0.8),
          9,
        )
      for (const ray of lit({ surface: 1, depth: 0.05 }, 1)) expect(ray.alpha).toBeCloseTo(0.5, 9)
      expect(lit({ surface: 0 }, 1)).toHaveLength(0)
      expect(lit({ surface: 1, mix: 0 }, 1)).toHaveLength(0)
      expect(lit({ surface: 1, depth: 0 }, 1)).toHaveLength(0)
    }
    // Each ray is a reading of its own: the newest on the first, the one before on the next.
    const state = display.init?.()
    const lights = [0.9, -0.2, 0.4, 1, -1]
    let drawn: RecordingContext | null = null
    lights.forEach((light, n) => {
      drawn = drawDisplay(display, UNDERWATER_PARAMS, {
        values: { surface: 1 },
        meters: readings({ light }),
        signal: testSignal(0.5, 0),
        state,
        now: 10 + n / 30,
        dt: 1 / 30,
      })
    })
    if (!drawn) throw new Error('nothing drawn')
    const alphas = rays(marksOf(drawn)).map((ray) => ray.alpha)
    const newestFirst = [...lights].reverse()
    // (The readings are kept as single floats.)
    alphas.forEach((alpha, r) =>
      expect(alpha).toBeCloseTo(Math.max(0, 0.5 + 0.5 * newestFirst[r]), 6),
    )
    // Not running, the rays stand at half: what Surface is, without the flicker.
    const still = rays(
      marksOf(drawDisplay(display, UNDERWATER_PARAMS, { values: { surface: 0.8 } })),
    )
    expect(still).toHaveLength(5)
    for (const ray of still) expect(ray.alpha).toBeCloseTo(0.4, 9)
  })
})

describe('Bubbles', () => {
  it('counts what the device sends up from an attack', async () => {
    expect(underwaterCount(0)).toBe(0)
    expect(underwaterCount(0.01)).toBe(1)
    expect(underwaterCount(1)).toBe(MOST_BUBBLES)
    const note = pluck()
    for (const bubbles of [0, 0.05, 0.25, 0.4, 0.75, 1]) {
      const host = await device({ ...PLAIN, depth: 0.6, bubbles })
      render(host, note)
      expect(reading(host, 'bubbles')).toBe(underwaterCount(bubbles))
    }
    // A held tone sends none after the one its start sends.
    const host = await device({ ...PLAIN, depth: 0.6, bubbles: 1 })
    render(host, sine(330, 1, 0.3))
    const started = reading(host, 'bubbles')
    render(host, sine(330, 2, 0.3))
    expect(reading(host, 'bubbles')).toBe(started)
  })

  it('draws the flight the settings would send: as many, the later the higher and the smaller', async () => {
    for (const [bubbles, size] of [
      [0.4, 0.45],
      [1, 0],
      [0.1, 1],
    ]) {
      const flight = underwaterFlight(bubbles, size)
      const centre = SMALL_HZ * Math.pow(LARGE_HZ / SMALL_HZ, size)
      expect(flight).toHaveLength(underwaterCount(bubbles))
      flight.forEach((bubble, i) => {
        expect(bubble.late).toBeGreaterThan(0)
        expect(bubble.late).toBeLessThan(3)
        expect(bubble.hz).toBeCloseTo(
          centre * Math.pow(2, (FLIGHT_RISE_OCTAVES * bubble.late) / 3),
          6,
        )
        if (i > 0) expect(bubble.late).toBeGreaterThan(flight[i - 1].late)
      })
      // The compiled device's bubbles are pitched about the same centre: within the flight's rise and its stray.
      const host = await device({ ...PLAIN, depth: 0.6, bubbles, bubbleSize: size })
      render(host, pluck())
      const pitch = reading(host, 'pitch')
      expect(pitch).toBeGreaterThanOrEqual(centre * Math.pow(2, -STRAY_OCTAVES) * 0.999)
      expect(pitch).toBeLessThanOrEqual(
        centre * Math.pow(2, FLIGHT_RISE_OCTAVES + STRAY_OCTAVES) * 1.001,
      )

      for (const frameSize of SIZES) {
        const [width, height] = frameSize
        const layout = underwaterLayout({ width, height })
        const marks = marksOf(draw({ bubbles, bubbleSize: size }, {}, { width, height }))
        const rings = flightRings(marks)
        expect(rings).toHaveLength(flight.length)
        const sound = lens(marks).ellipses[0]
        rings.forEach((ringMark, i) => {
          const bubble = ringMark.arcs[0]
          expect(bubble.r).toBeCloseTo(underwaterBubbleRadius(flight[i].hz, layout.unit), 9)
          // Between the sound and the surface, the later the nearer the surface.
          expect(bubble.y).toBeLessThanOrEqual(sound.y - sound.ry)
          expect(bubble.y).toBeGreaterThanOrEqual(layout.surfaceY)
          if (i > 0) expect(bubble.y).toBeLessThan(rings[i - 1].arcs[0].y)
          expect(ringMark.stroke).toBe(ink)
          expect(ringMark.alpha).toBeCloseTo(INK.back, 9)
        })
      }
    }
    // Low is large: a bubble an octave down is drawn bigger, and the sizes stop at the ends of the range.
    expect(underwaterBubbleRadius(420, 1)).toBeCloseTo(2.6, 9)
    expect(underwaterBubbleRadius(4200, 1)).toBeCloseTo(0.8, 9)
    expect(underwaterBubbleRadius(100, 1)).toBeCloseTo(2.6, 9)
    expect(underwaterBubbleRadius(9000, 1)).toBeCloseTo(0.8, 9)
    expect(underwaterBubbleRadius(800, 1)).toBeGreaterThan(underwaterBubbleRadius(1600, 1))
    expect(underwaterBubbleRadius(420, 1.6)).toBeCloseTo(2.6 * 1.6, 9)
    // No Bubbles, no flight; out of the water or the mix, none either.
    expect(flightRings(marksOf(draw({ bubbles: 0 })))).toHaveLength(0)
    expect(flightRings(marksOf(draw({ bubbles: 1, depth: 0 })))).toHaveLength(0)
    expect(flightRings(marksOf(draw({ bubbles: 1, mix: 0 })))).toHaveLength(0)
    expect(flightRings(marksOf(draw({ bubbles: 1, mix: 0.25 })))[0].alpha).toBeCloseTo(
      INK.back * 0.5,
      9,
    )
  })

  it('sends a bubble up for each one the device counts, the size its pitch says', () => {
    const layout = underwaterLayout(REST)
    const run = (
      counts: number[],
      pitch: number,
      values: Values = {},
    ): { marks: Mark[]; state: unknown } => {
      const state = display.init?.()
      let drawn: RecordingContext | null = null
      counts.forEach((count, n) => {
        drawn = drawDisplay(display, UNDERWATER_PARAMS, {
          values,
          meters: readings({ bubbles: count, pitch }),
          signal: testSignal(0.5, 0),
          state,
          now: 10 + n / 30,
          dt: 1 / 30,
        })
      })
      if (!drawn) throw new Error('nothing drawn')
      return { marks: marksOf(drawn), state }
    }
    // The first reading is where the count stands, not bubbles.
    expect(risingBubbles(run([7], 420).marks)).toHaveLength(0)
    expect(risingBubbles(run([7, 7, 7], 420).marks)).toHaveLength(0)
    // Three more counted, three on their way, each the size of the pitch read with them.
    const three = risingBubbles(run([7, 10], 420).marks)
    expect(three).toHaveLength(3)
    const sound = lens(run([7, 10], 420).marks).ellipses[0]
    for (const bubble of three) {
      expect(bubble.arcs[0].r).toBeCloseTo(underwaterBubbleRadius(420, layout.unit), 9)
      expect(bubble.arcs[0].y).toBeLessThanOrEqual(sound.y - sound.ry)
      expect(bubble.arcs[0].y).toBeGreaterThanOrEqual(layout.surfaceY)
      expect(bubble.fill).toBe(accent)
    }
    expect(risingBubbles(run([7, 10], 3000).marks)[0].arcs[0].r).toBeCloseTo(
      underwaterBubbleRadius(3000, layout.unit),
      9,
    )
    // They add up, and the count going round its end is still three more.
    expect(risingBubbles(run([7, 10, 12, 12, 13], 420).marks)).toHaveLength(6)
    expect(risingBubbles(run([65534, 1], 420).marks)).toHaveLength(3)
    // A count that starts again (a device made anew) is not a flight.
    expect(risingBubbles(run([40, 2], 420).marks)).toHaveLength(0)
    expect(risingBubbles(run([2, 30], 420).marks)).toHaveLength(0)

    // They rise for as long as a flight takes to come up at this Bubble Size (three of the device's time
    // constants), at one speed: so far up the water for so much of that time, and then they are gone.
    expect(underwaterFlightSeconds(0)).toBeCloseTo(3 * FLIGHT_SMALL_SEC, 9)
    expect(underwaterFlightSeconds(1)).toBeCloseTo(3 * FLIGHT_LARGE_SEC, 9)
    for (const bubbleSize of [0, 0.45, 1]) {
      const span = underwaterFlightSeconds(bubbleSize)
      const { state, marks } = run([7, 10], 420, { bubbleSize })
      const born = lens(marks).ellipses[0]
      const foot = born.y - born.ry - 1
      const column = foot - layout.surfaceY - 1
      const later = (seconds: number): Mark[] =>
        risingBubbles(
          marksOf(
            drawDisplay(display, UNDERWATER_PARAMS, {
              values: { bubbleSize },
              meters: readings({ bubbles: 10, pitch: 420 }),
              signal: testSignal(0.5, 0),
              state,
              now: 10 + 1 / 30 + seconds,
              dt: 1 / 30,
            }),
          ),
        )
      for (const share of [0.25, 0.5, 0.9]) {
        const risen = later(share * span)
        expect(risen).toHaveLength(3)
        for (const bubble of risen) expect(bubble.arcs[0].y).toBeCloseTo(foot - share * column, 6)
      }
      expect(later(span + 0.01)).toHaveLength(0)
    }

    // With none of the water in the mix none are drawn, the count is still read, and none arrive late.
    const dry = run([7, 10, 12], 420, { mix: 0 })
    expect(risingBubbles(dry.marks)).toHaveLength(0)
    const back = marksOf(
      drawDisplay(display, UNDERWATER_PARAMS, {
        meters: readings({ bubbles: 12, pitch: 420 }),
        signal: testSignal(0.5, 0),
        state: dry.state,
        now: 10.2,
        dt: 1 / 30,
      }),
    )
    expect(risingBubbles(back)).toHaveLength(0)
    const more = marksOf(
      drawDisplay(display, UNDERWATER_PARAMS, {
        meters: readings({ bubbles: 13, pitch: 420 }),
        signal: testSignal(0.5, 0),
        state: dry.state,
        now: 10.25,
        dt: 1 / 30,
      }),
    )
    expect(risingBubbles(more)).toHaveLength(1)
    // Out of the water the device sends none that are heard, and none are drawn.
    expect(risingBubbles(run([7, 10], 420, { depth: 0 }).marks)).toHaveLength(0)

    // Just under the surface there is no water over the sound: its bubbles stay at the surface, none in
    // the air over it, and they are as faint as the little of them the device lets be heard.
    for (const depth of [0.02, 0.05, 0.1]) {
      const shallow = run([7, 10], 420, { depth, bubbles: 1 }).marks
      const risen = risingBubbles(shallow)
      expect(risen).toHaveLength(3)
      for (const bubble of risen) {
        expect(bubble.arcs[0].y).toBeGreaterThanOrEqual(layout.surfaceY)
        expect(bubble.alpha).toBeCloseTo(0.9 * Math.min(1, 2 * underwaterImmersion(depth)), 9)
      }
      const rings = flightRings(shallow)
      expect(rings.length).toBeGreaterThan(0)
      for (const ringMark of rings)
        expect(ringMark.arcs[0].y).toBeGreaterThanOrEqual(layout.surfaceY)
    }
  })

  it('follows the compiled device: a struck note sends its flight up the display', async () => {
    const host = await device({ depth: 0.6, bubbles: 0.5 })
    const note = pluck(1.2)
    const state = display.init?.()
    const values = { depth: 0.6, bubbles: 0.5 }
    let seen = 0
    let most = 0
    // Thirty readings a second, as the plate takes them.
    const hop = SR / 30
    for (let done = 0; done + hop <= note.length; done += hop) {
      render(host, note.subarray(done, done + hop))
      const marks = marksOf(
        drawDisplay(display, UNDERWATER_PARAMS, {
          values,
          meters: {
            swell: reading(host, 'swell'),
            ripple: reading(host, 'ripple'),
            bubbles: reading(host, 'bubbles'),
            pitch: reading(host, 'pitch'),
            squeeze: reading(host, 'squeeze'),
            light: reading(host, 'light'),
          },
          signal: testSignal(0.5, 0.2),
          state,
          now: 10 + done / SR,
          dt: 1 / 30,
        }),
      )
      const rising = risingBubbles(marks).length
      most = Math.max(most, rising)
      if (done < 0.2 * SR) expect(rising).toBe(0)
      seen = reading(host, 'bubbles')
    }
    expect(seen).toBe(underwaterCount(0.5))
    // A bubble is on its way for as long as the flight takes to come: the first are up when the last start,
    // so some of the flight is on the display at once and seldom all of it.
    expect(most).toBeGreaterThanOrEqual(2)
    expect(most).toBeLessThanOrEqual(underwaterCount(0.5))
  })
})
