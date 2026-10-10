// The display of Distance, against the device: its arithmetic against the
// constants and formulas of `cpp/devices/distance/distance.h` and against
// what the compiled device does to an impulse, each mark against that
// arithmetic, each handle against its parameter, and what moves against the
// device's own readings.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { DISTANCE_METERS, DISTANCE_PARAMS } from '../../dsp/devices/distance.gen'
import { INK, PLAIN_COLOURS, gainToDb } from '../components/display-kit'
import {
  BRIGHT_HZ,
  DIM,
  DISTANCE,
  DISTANCE_FACES,
  LAMP_FOOT_DB,
  ROOM_HAZE,
  SIZE_FLOOR_DB,
  airCorner,
  airGain,
  airKept,
  bendCents,
  bendText,
  layoutOf,
  metresOf,
  metresText,
  placeOfMetres,
  fallOf,
  lateGain,
  reflections,
  roomLevel,
  roomWidth,
  sceneOf,
  sideGain,
  walkOf,
} from '../components/displays/distance'
import { type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const P = DISTANCE_PARAMS
const M = DISTANCE_METERS
const RATE = 48000
const display = DISTANCE_FACES.distance.display
const params = stockDescriptors().get('distance')?.params ?? {}
const { ink, accent, plate: ground } = PLAIN_COLOURS

// --- Copied from cpp/devices/distance/distance.h (the public constants of
// `class Distance`); the display must use these and no others. ---
const K = {
  kFarMetres: 32,
  kOctaves: 5,
  kSoundSpeed: 343,
  kAirHz: 1500,
  kAirPoleRatio: 1.5571,
  kNarrowestRoom: 4,
  kEarHeight: 1.5,
  kCeilingBase: 2.4,
  kCeilingSlope: 0.3,
  kRoomLevelSmall: 0.5,
  kRoomLevelLarge: 0.25,
  kFall: 0.35,
  kEarlyPower: 0.5,
  // What the room is made up by for the low cut on its way in (not drawn: the haze is the room's
  // level with pink noise in it, which the make-up restores).
  kSendMakeup: 1.0639,
  kSendCutHz: 40,
  kImageAcross: [0, 0, -1.14, 0.86, -1.14, 0.86, -2, 2.86],
  kImageUp: [1, 2, 0, 0, 2, 1, 0, 0],
  kImageKeeps: [0.35, 0.7, 0.7, 0.7, 0.49, 0.245, 0.49, 0.343],
} as const

// --- Reading what was drawn -------------------------------------------------

interface Path {
  points: [number, number][]
  arcs: number[][]
  fill: string | null
  stroke: string | null
  /** How strongly it was filled, and how strongly drawn. */
  alpha: number
  lineWidth: number
}

/** Every path put on the canvas, with what it was painted in. */
function pathsOf(drawn: RecordingContext): Path[] {
  const paths: Path[] = []
  let now: Path | null = null
  let fillStyle = ''
  let strokeStyle = ''
  let alpha = 1
  let lineWidth = 1
  for (const { name, args } of drawn.calls) {
    const numbers = args as number[]
    if (name === 'set fillStyle') fillStyle = String(args[0])
    else if (name === 'set strokeStyle') strokeStyle = String(args[0])
    else if (name === 'set globalAlpha') alpha = numbers[0]
    else if (name === 'set lineWidth') lineWidth = numbers[0]
    else if (name === 'beginPath') {
      now = { points: [], arcs: [], fill: null, stroke: null, alpha: 1, lineWidth: 1 }
      paths.push(now)
    } else if (!now) continue
    else if (name === 'moveTo' || name === 'lineTo') now.points.push([numbers[0], numbers[1]])
    else if (name === 'arc') now.arcs.push(numbers)
    else if (name === 'fill') {
      now.fill = fillStyle
      now.alpha = alpha
    } else if (name === 'stroke') {
      now.stroke = strokeStyle
      now.lineWidth = lineWidth
      if (now.fill === null) now.alpha = alpha
    }
  }
  return paths
}

interface Round {
  x: number
  y: number
  r: number
  alpha: number
}
const whole = (path: Path): boolean =>
  path.arcs.length === 1 && path.arcs[0][3] === 0 && path.arcs[0][4] === Math.PI * 2
const round = (path: Path): Round => ({
  x: path.arcs[0][0],
  y: path.arcs[0][1],
  r: path.arcs[0][2],
  alpha: path.alpha,
})

/** What the picture is made of, each kind by how it is painted. */
function marksOf(drawn: RecordingContext) {
  const paths = pathsOf(drawn)
  const upright = (path: Path): boolean =>
    path.points.length === 2 && path.points[0][0] === path.points[1][0]
  const level = (path: Path): boolean =>
    path.points.length === 2 && path.points[0][1] === path.points[1][1]
  return {
    /** The direct sound: the one whole dot in the accent with a line of ink round it. */
    dots: paths
      .filter((path) => whole(path) && path.fill === accent && path.stroke === ink)
      .filter((path) => path.lineWidth === 1)
      .map(round),
    /** The diffuse room: a dot of ink laid as a fill. */
    haze: paths
      .filter((path) => whole(path) && path.fill === ink && path.alpha === INK.fill)
      .map(round),
    /** The first reflections: dots of ink laid as a mark. */
    early: paths
      .filter((path) => whole(path) && path.fill === ink && path.alpha === INK.text)
      .map(round),
    /** The points that can be taken: rings of ink on the plate (in the accent while one is hot). */
    rings: paths
      .filter((path) => whole(path) && path.stroke === ink && path.lineWidth === 1.5)
      .map((path) => ({ ...round(path), fill: path.fill })),
    /** The width: the upright line of ink laid as a mark. */
    bars: paths
      .filter((path) => upright(path) && path.stroke === ink && path.alpha === INK.text)
      .map((path) => ({
        x: path.points[0][0],
        top: Math.min(path.points[0][1], path.points[1][1]),
        foot: Math.max(path.points[0][1], path.points[1][1]),
      })),
    /** The scale's ticks: upright lines of ink that stand back. */
    ticks: paths
      .filter((path) => upright(path) && path.stroke === ink && path.alpha === INK.back)
      .map((path) => path.points[0][0]),
    /** Where the source is on the scale: the upright line in the accent. */
    nows: paths
      .filter((path) => upright(path) && path.stroke === accent)
      .map((path) => path.points[0][0]),
    /** The walk: the thick level line. */
    walks: paths
      .filter((path) => level(path) && path.stroke === ink && path.lineWidth === 3)
      .map((path) => ({ from: path.points[0][0], to: path.points[1][0], y: path.points[0][1] })),
    /** The listener's lamp: the half round in the accent, by how strongly it is lit. */
    lamps: paths.filter((path) => !whole(path) && path.arcs.length === 1 && path.fill === accent),
    /** The listener: the half round in ink. */
    ears: paths.filter((path) => !whole(path) && path.arcs.length === 1 && path.stroke === ink),
  }
}

/** Where the words stand: each `fillText` with its place. */
const wordsAt = (drawn: RecordingContext): { words: string; x: number; y: number }[] =>
  drawn.calls
    .filter((call) => call.name === 'fillText')
    .map((call) => ({
      words: String(call.args[0]),
      x: Number(call.args[1]),
      y: Number(call.args[2]),
    }))

const SIZES: [number, number][] = [
  [224, 48],
  [184, 48],
  [204, 100],
  [424, 48],
]

/** A frame's readings as the device gives them when the source stands at a place. */
const at = (position: number, bend = 1): Pick<FrameOptions, 'meters'> => ({
  meters: { position, bend },
})

const draw = (options: FrameOptions = {}) => drawDisplay(display, params, options)

/** Of the scale's line, how much is 1 m to 32 m: the rest is for the images behind a far source. */
const SCALE_SHARE = 0.86

/**
 * Where so many metres stand on the scale that was drawn. Its line starts at
 * 1 m and runs on past 32 m, which stands `SCALE_SHARE` of the way along; a
 * doubling is the same step everywhere.
 */
function xOfMetres(drawn: RecordingContext, metres: number): number {
  const lines = pathsOf(drawn).filter(
    (path) =>
      path.points.length === 2 &&
      path.points[0][1] === path.points[1][1] &&
      path.stroke === ink &&
      path.alpha === INK.rule &&
      path.lineWidth === 1,
  )
  expect(lines, "the scale's line").toHaveLength(1)
  const [from, to] = [lines[0].points[0][0], lines[0].points[1][0]]
  return from + (Math.log2(metres) / 5) * SCALE_SHARE * (to - from)
}

function handles(values: Record<string, number> = {}, size: Partial<FrameOptions> = {}) {
  const found = display.handles?.(viewOf(display, params, { values, ...size })) ?? []
  const by = (key: string) => {
    const one = found.find((candidate) => candidate.key === key)
    if (!one) throw new Error(`distance has no handle ${key}`)
    return one
  }
  return { distance: by('distance'), near: by('near'), far: by('far') }
}

// --- The arithmetic ---------------------------------------------------------

describe("the display's arithmetic is the device's", () => {
  it('uses the constants of distance.h', () => {
    expect(DISTANCE.farMetres).toBe(K.kFarMetres)
    expect(DISTANCE.octaves).toBe(K.kOctaves)
    expect(DISTANCE.soundSpeed).toBe(K.kSoundSpeed)
    expect(DISTANCE.airHz).toBe(K.kAirHz)
    expect(DISTANCE.airPoleRatio).toBe(K.kAirPoleRatio)
    expect(DISTANCE.narrowestRoom).toBe(K.kNarrowestRoom)
    expect(DISTANCE.earHeight).toBe(K.kEarHeight)
    expect(DISTANCE.ceilingBase).toBe(K.kCeilingBase)
    expect(DISTANCE.ceilingSlope).toBe(K.kCeilingSlope)
    expect(DISTANCE.roomLevelSmall).toBe(K.kRoomLevelSmall)
    expect(DISTANCE.roomLevelLarge).toBe(K.kRoomLevelLarge)
    expect(DISTANCE.fall).toBe(K.kFall)
    expect(DISTANCE.earlyPower).toBe(K.kEarlyPower)
    expect([...DISTANCE.imageAcross]).toEqual([...K.kImageAcross])
    expect([...DISTANCE.imageUp]).toEqual([...K.kImageUp])
    expect([...DISTANCE.imageKeeps]).toEqual([...K.kImageKeeps])
  })

  it('has the place run from 1 m to 32 m in doublings, and back', () => {
    // metres(place) = 2^(kOctaves · place)
    expect(metresOf(0)).toBe(1)
    expect(metresOf(0.4)).toBeCloseTo(4, 12)
    expect(metresOf(1)).toBeCloseTo(32, 12)
    for (const place of [0, 0.13, 0.5, 0.77, 1])
      expect(placeOfMetres(metresOf(place))).toBeCloseTo(place, 12)
  })

  it("has the air's corner fall as the square root of the way, from none at 1 m to 1500 Hz", () => {
    // air_corner = kAirHz / sqrt(air² · (d − 1) / (kFarMetres − 1))
    expect(airCorner(1, 32)).toBeCloseTo(1500, 9)
    expect(airCorner(0.5, 32)).toBeCloseTo(3000, 9)
    expect(airCorner(1, 8.75)).toBeCloseTo(3000, 9)
    expect(airCorner(1, 1)).toBe(Infinity)
    expect(airCorner(0, 32)).toBe(Infinity)
    // Two poles at kAirPoleRatio times the corner are 3 dB down at the corner.
    for (const corner of [1500, 3000, 6000])
      expect(gainToDb(airGain(corner, corner, 192000))).toBeCloseTo(-3.01, 1)
    expect(airGain(Infinity, 12000, RATE)).toBe(1)
    // What is left of pink noise: all of it in clear air, less the lower the corner.
    expect(airKept(Infinity)).toBe(1)
    expect(airKept(1500)).toBeLessThan(airKept(3000))
    expect(airKept(3000)).toBeLessThan(airKept(12000))
    expect(airKept(1500)).toBeGreaterThan(0.5)
  })

  it('has the sides close as the angle a pair of sources is seen under', () => {
    // side_gain = atan(1 / d^width) · 4 / π, and 1 where that would be more.
    expect(sideGain(0, 1)).toBe(1)
    expect(sideGain(1, 0)).toBe(1)
    expect(sideGain(0.6, 1)).toBeCloseTo((Math.atan(1 / 8) * 4) / Math.PI, 12)
    expect(sideGain(1, 0.5)).toBeCloseTo((Math.atan(1 / Math.sqrt(32)) * 4) / Math.PI, 12)
    let last = 1
    for (let place = 0.05; place <= 1; place += 0.05) {
      const now = sideGain(place, 0.5)
      expect(now).toBeLessThan(last)
      last = now
    }
  })

  it('has the room 4 m to 40 m wide and its level fall by half', () => {
    expect(roomWidth(0)).toBe(4)
    expect(roomWidth(0.5)).toBeCloseTo(4 * Math.sqrt(10), 12)
    expect(roomWidth(1)).toBeCloseTo(40, 12)
    expect(roomLevel(0)).toBe(0.5)
    expect(roomLevel(1)).toBeCloseTo(0.25, 12)
  })

  it('has each reflection come from its image: so long a path, so loud, from that side', () => {
    // At 8 m in a room 4·sqrt(10) m wide, seen at half width (8^0.5).
    const d = 8
    const w = 4 * Math.sqrt(10)
    const seen = Math.sqrt(8)
    const ceiling = 2 * (2.4 + 0.3 * w - 1.5)
    const floor = 3
    const share = 1 - 1 / d
    const got = reflections(0.6, 0.5, 0.5)
    expect(got).toHaveLength(8)
    // The floor: straight ahead, 3 m off the line.
    expect(got[0].path).toBeCloseTo(Math.hypot(d, floor), 9)
    expect(got[0].gain).toBeCloseTo((share * 0.35) / Math.hypot(d, floor), 9)
    expect(got[0].bearing).toBe(0)
    // The ceiling.
    expect(got[1].path).toBeCloseTo(Math.hypot(d, ceiling), 9)
    // The right wall, 0.86 of the width off, and the left, 1.14 of it.
    expect(got[3].path).toBeCloseTo(Math.hypot(d, 0.86 * w), 9)
    expect(got[3].gain).toBeCloseTo((share * 0.7) / Math.hypot(d, 0.86 * w), 9)
    expect(got[3].bearing).toBeCloseTo((0.86 * w) / Math.hypot(seen, 0.86 * w), 9)
    expect(got[2].bearing).toBeCloseTo((-1.14 * w) / Math.hypot(seen, 1.14 * w), 9)
    // A wall and the ceiling, a wall and the floor, and the two second walls.
    expect(got[4].path).toBeCloseTo(Math.hypot(d, 1.14 * w, ceiling), 9)
    expect(got[5].path).toBeCloseTo(Math.hypot(d, 0.86 * w, floor), 9)
    expect(got[6].path).toBeCloseTo(Math.hypot(d, 2 * w), 9)
    expect(got[7].path).toBeCloseTo(Math.hypot(d, 2.86 * w), 9)
    // At 1 m there is no room in the sound at all.
    for (const tap of reflections(0, 0.5, 0.5)) expect(tap.gain).toBe(0)
  })

  it('walks Wander either side of Distance and never past 1 m or 32 m', () => {
    for (const [distance, wander, near, far] of [
      [0.4, 0.25, 0.275, 0.525],
      [0.1, 0.6, 0, 0.4],
      [0.9, 0.6, 0.6, 1],
      [0.5, 0, 0.5, 0.5],
      [0.5, 1, 0, 1],
    ]) {
      const walk = walkOf(distance, wander)
      expect(walk.near).toBeCloseTo(near, 12)
      expect(walk.far).toBeCloseTo(far, 12)
    }
    expect(walkOf(0.1, 0.6).near).toBe(0)
    expect(walkOf(0.9, 0.6).far).toBe(1)
  })
})

// --- The compiled device ----------------------------------------------------

type Settings = Readonly<Record<string, number>>

/** What the compiled device answers to one sample, with the knobs set before it. */
async function answer(settings: Settings, frames: number, left = 1, right = left) {
  const h = await loadWasmDevice('distance')
  for (const [name, value] of Object.entries(settings)) h.set(P[name as keyof typeof P], value)
  const out = { left: new Float32Array(frames), right: new Float32Array(frames) }
  for (let from = 0; from < frames; from += 128) {
    const count = Math.min(128, frames - from)
    const inLeft = new Float32Array(count)
    const inRight = new Float32Array(count)
    if (from === 0) {
      inLeft[0] = left
      inRight[0] = right
    }
    h.processBlock(inLeft, inRight)
    out.left.set(h.view(h.device.device_out_left(), count), from)
    out.right.set(h.view(h.device.device_out_right(), count), from)
  }
  return out
}

/** When the direct sound arrives: its way at the speed of sound, a whole sample at rest. */
const arrival = (place: number): number =>
  Math.round(((metresOf(place) - 1) / K.kSoundSpeed) * RATE)

/** How long after it a reflection arrives, in samples. */
const lagOf = (place: number, path: number): number =>
  ((path - metresOf(place)) / K.kSoundSpeed) * RATE

const sum = (data: Float32Array, from: number, to: number): number => {
  let total = 0
  for (let n = from; n < to; n++) total += data[n]
  return total
}

describe('what the display draws is what the compiled device does', () => {
  const still = { wander: 0 }

  it('the dot: the direct sound is as loud as the display has it, at every Level', async () => {
    for (const place of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      for (const level of [0, 0.5, 1]) {
        const set = { room: 0.5, air: 0, level, width: 0.5 }
        const scene = sceneOf(place, set, RATE)
        const out = await answer({ ...still, distance: place, ...set }, 8192)
        const when = arrival(place)
        // In clear air it is one sample, when its way at the speed of sound says.
        expect(out.left[when], `at ${place}, Level ${level}`).toBeCloseTo(scene.direct, 4)
        expect(out.right[when]).toBeCloseTo(scene.direct, 4)
        if (when > 0) expect(Math.abs(out.left[when - 1])).toBeLessThan(1e-6)
      }
    }
    // With no Level it is the inverse of the distance and the fall of the whole on top (8^-1.35),
    // with all of it louder by what was lost, and half way the fall is half given back.
    expect(sceneOf(0.6, { room: 0.5, air: 0, level: 0, width: 0.5 }, RATE).direct).toBeCloseTo(
      Math.pow(8, -1.35),
      12,
    )
    expect(fallOf(0.6)).toBeCloseTo(Math.pow(8, -0.35), 12)
    const half = sceneOf(0.6, { room: 0.5, air: 0, level: 0.5, width: 0.5 }, RATE)
    const whole = sceneOf(0.6, { room: 0.5, air: 0, level: 1, width: 0.5 }, RATE)
    expect(half.lift).toBeCloseTo(Math.sqrt(whole.lift * fallOf(0.6)), 12)
    expect(sceneOf(0.6, { room: 0.5, air: 0, level: 1, width: 0.5 }, RATE).lift).toBeGreaterThan(2)
  })

  it('the dot: Level makes up for what the air takes too', async () => {
    for (const [place, air] of [
      [0.4, 0.5],
      [0.6, 1],
      [0.8, 1],
    ]) {
      const set = { room: 0.5, air, level: 1, width: 0.5 }
      const scene = sceneOf(place, set, RATE)
      const out = await answer({ ...still, distance: place, ...set }, 4096)
      const when = arrival(place)
      // The air smears the sample; all of it is there before the floor answers.
      const floor = Math.floor(lagOf(place, reflections(place, 0.5, 0.5)[0].path))
      expect(sum(out.left, when, when + floor - 1), `at ${place}`).toBeCloseTo(scene.direct, 3)
      expect(scene.lift).toBeGreaterThan(
        sceneOf(place, { ...set, air: 0 }, RATE).lift * (1 + 0.02 * air),
      )
    }
  })

  it('the brightness: the air takes of the highs what the display dims the dot by', async () => {
    for (const [place, air] of [
      [0.4, 0.5],
      [0.6, 0.5],
      [0.6, 1],
      [0.8, 1],
    ]) {
      const set = { room: 0.5, air, level: 0, width: 0.5 }
      const scene = sceneOf(place, set, RATE)
      const out = await answer({ ...still, distance: place, ...set }, 4096)
      const when = arrival(place)
      const floor = Math.floor(lagOf(place, reflections(place, 0.5, 0.5)[0].path))
      let re = 0
      let im = 0
      for (let n = 0; n < floor - 1; n++) {
        const w = (2 * Math.PI * BRIGHT_HZ * n) / RATE
        re += out.left[when + n] * Math.cos(w)
        im -= out.left[when + n] * Math.sin(w)
      }
      expect(Math.hypot(re, im) / scene.direct, `at ${place}, Air ${air}`).toBeCloseTo(
        scene.bright,
        3,
      )
      expect(scene.bright).toBeLessThan(1)
    }
    // Farther and with more Air it is darker.
    const bright = (place: number, air: number): number =>
      sceneOf(place, { room: 0.5, air, level: 0, width: 0.5 }, RATE).bright
    expect(bright(0.8, 1)).toBeLessThan(bright(0.6, 1))
    expect(bright(0.6, 1)).toBeLessThan(bright(0.6, 0.5))
    expect(bright(0, 1)).toBe(1)
  })

  it('the bar: the sides are closed as far as the display has them', async () => {
    for (const [place, width] of [
      [0.4, 0.5],
      [0.6, 1],
      [1, 0.5],
      [1, 0],
    ]) {
      const set = { room: 0.5, air: 0, level: 0.5, width }
      const scene = sceneOf(place, set, RATE)
      // One side alone: what comes out on that side and on the other.
      const out = await answer({ ...still, distance: place, ...set }, 8192, 1, 0)
      const when = arrival(place)
      const [same, cross] = [out.left[when], out.right[when]]
      expect((same - cross) / (same + cross), `at ${place}, Width ${width}`).toBeCloseTo(
        scene.side,
        4,
      )
    }
  })

  it('the small dots: each first reflection is as late, as loud and as far to a side', async () => {
    for (const [place, room, width] of [
      [0.6, 0.5, 0.5],
      [0.4, 0.2, 1],
    ]) {
      const set = { room, air: 0, level: 0.5, width }
      const scene = sceneOf(place, set, RATE)
      // The diffuse room answers from the right wall's reflection on. Each side of it is sent its
      // own side of the input and, narrowed, some of the other: the whole of a sample that is the
      // same on both sides, and the display's `side` of one that is opposite on the two. The
      // reflections are of the middle, so the opposite sample has none. Taking the answer to the
      // opposite sample, over `side`, from the answer to the same sample leaves the reflections
      // alone (the right side of the opposite sample is its left turned over).
      const same = await answer({ ...still, distance: place, ...set }, 8192)
      const opposite = await answer({ ...still, distance: place, ...set }, 8192, 1, -1)
      expect(scene.side).toBeGreaterThan(0.2)
      const leftAt = (n: number): number => same.left[n] - opposite.left[n] / scene.side
      const rightAt = (n: number): number => same.right[n] + opposite.right[n] / scene.side
      const when = arrival(place)
      // Floor, ceiling, left wall, right wall, right wall and floor.
      for (const k of [0, 1, 2, 3, 5]) {
        const tap = scene.early[k]
        const lag = Math.floor(lagOf(place, tap.path))
        // It lands between two samples and is shared between them.
        const left = leftAt(when + lag) + leftAt(when + lag + 1)
        const right = rightAt(when + lag) + rightAt(when + lag + 1)
        const what = `at ${place} in room ${room}, reflection ${k}`
        expect(Math.hypot(left, right), what).toBeCloseTo(tap.gain, 4)
        expect((right * right - left * left) / (right * right + left * left), what).toBeCloseTo(
          tap.bearing,
          3,
        )
        // Nothing just before it.
        expect(Math.abs(leftAt(when + lag - 2)), what).toBeLessThan(1e-6)
      }
    }
  })

  it('the haze: the diffuse room is as loud as the display has it, in every room, at every Level', async () => {
    // A tone on the left with its opposite on the right has no middle, so there are no
    // reflections in it, and with Width 0 all of it goes on: the direct sound, which is the tone
    // as late as its way and as loud as the dot, and the diffuse room. The room is an allpass, so
    // once the tone is held the room comes out as loud as its gain: the display's level, the
    // make-up for the low cut, and what the cut leaves at the tone.
    const hz = 500
    const cut = hz / Math.hypot(hz, K.kSendCutHz)
    const tone = (n: number): number => (n < 0 ? 0 : 0.25 * Math.sin((2 * Math.PI * hz * n) / RATE))
    for (const place of [0.4, 0.8, 1]) {
      for (const room of [0, 0.5, 1]) {
        for (const level of [0, 0.5, 1]) {
          const set = { room, air: 0, level, width: 0 }
          const scene = sceneOf(place, set, RATE)
          expect(scene.side).toBe(1)
          const h = await loadWasmDevice('distance')
          const settings: Settings = { ...still, distance: place, decay: 0.3, ...set }
          for (const [name, value] of Object.entries(settings)) h.set(P[name as keyof typeof P], value)
          const when = arrival(place)
          let power = 0
          let counted = 0
          for (let block = 0; block < 900; block++) {
            const left = new Float32Array(128)
            const right = new Float32Array(128)
            for (let n = 0; n < 128; n++) {
              left[n] = tone(block * 128 + n)
              right[n] = -left[n]
            }
            h.processBlock(left, right)
            if (block < 600) continue
            const out = h.view(h.device.device_out_left(), 128)
            for (let n = 0; n < 128; n++) {
              const rest = out[n] - scene.direct * tone(block * 128 + n - when)
              power += rest * rest
            }
            counted += 128
          }
          const heard = Math.sqrt(power / counted) / (0.25 * Math.SQRT1_2)
          const what = `at ${place} in room ${room}, Level ${level}`
          expect(heard / (K.kSendMakeup * cut * scene.room), what).toBeGreaterThan(0.97)
          expect(heard / (K.kSendMakeup * cut * scene.room), what).toBeLessThan(1.03)
        }
      }
    }
    // The room has its level, its share of the sound (none at 1 m) and nothing else in it.
    expect(lateGain(0, 0.5)).toBe(0)
    expect(lateGain(0.6, 0.5)).toBeCloseTo(0.5 * Math.sqrt(0.5) * (1 - 1 / 8), 12)
    expect(sceneOf(0.6, { room: 0.5, air: 0, level: 0, width: 0.5 }, RATE).room).toBeCloseTo(
      lateGain(0.6, 0.5) * fallOf(0.6),
      12,
    )
  })

  const meter = (h: Awaited<ReturnType<typeof loadWasmDevice>>, name: keyof typeof M): number =>
    (h.device as unknown as { device_meter(index: number): number }).device_meter(M[name].id)

  it('the readings: the device says where the source is and how its pitch is bent', async () => {
    expect(Object.keys(M)).toEqual(['position', 'bend'])
    for (const spec of Object.values(M)) expect(spec.display).toBe(true)

    // Standing still: where Distance has it, with no bend.
    const h = await loadWasmDevice('distance')
    h.set(P.wander, 0)
    h.set(P.distance, 0.4)
    h.feedTone(0.5, 440, 0.3)
    expect(meter(h, 'position')).toBeCloseTo(0.4, 6)
    expect(meter(h, 'bend')).toBe(1)

    // Moved away: it goes there, and its pitch is down while it goes.
    h.set(P.distance, 0.8)
    let lowest = 1
    let before = meter(h, 'position')
    for (let n = 0; n < 40; n++) {
      h.feedTone(0.02, 440, 0.3)
      const now = meter(h, 'position')
      expect(now).toBeGreaterThanOrEqual(before)
      before = now
      lowest = Math.min(lowest, meter(h, 'bend'))
    }
    expect(lowest).toBeLessThan(0.99)
    expect(bendCents(lowest)).toBeLessThan(-17)
    h.feedTone(3, 440, 0.3)
    // It arrives: not nearly there, there.
    expect(meter(h, 'position')).toBe(Math.fround(0.8))
    expect(meter(h, 'bend')).toBe(1)
  })

  it('the readings: Wander walks it between the two ends the display marks', async () => {
    const h = await loadWasmDevice('distance')
    h.set(P.distance, 0.3)
    h.set(P.wander, 0.8)
    h.set(P.rate, 1)
    const walk = walkOf(0.3, 0.8)
    let [low, high] = [1, 0]
    let [bentUp, bentDown] = [false, false]
    let before = NaN
    let told = 0
    for (let n = 0; n < 1500; n++) {
      h.feedTone(0.02, 440, 0.3)
      const now = meter(h, 'position')
      const bend = meter(h, 'bend')
      expect(now).toBeGreaterThanOrEqual(walk.near)
      expect(now).toBeLessThanOrEqual(walk.far)
      low = Math.min(low, now)
      high = Math.max(high, now)
      if (bend < 0.9995) bentDown = true
      if (bend > 1.0005) bentUp = true
      // While it goes steadily one way (and is not held at 1 m): leaving, the pitch is
      // down; coming, it is up.
      if (Math.abs(now - before) > 0.01 && Math.min(now, before) > 0.01) {
        expect(Math.sign(1 - bend), `at ${now} from ${before}`).toBe(Math.sign(now - before))
        told += 1
      }
      before = now
    }
    // Half a minute of it covers nearly the whole walk.
    expect(low).toBeLessThan(walk.near + 0.1)
    expect(high).toBeGreaterThan(walk.far - 0.1)
    expect(bentUp && bentDown).toBe(true)
    expect(told).toBeGreaterThan(100)
  })
})

// --- The picture ------------------------------------------------------------

describe('the picture of Distance', () => {
  it('has a scale of doublings from 1 m to 32 m, with room behind it, at every size', () => {
    for (const [width, height] of SIZES) {
      const drawn = draw({ width, height, ...at(0.4) })
      const layout = layoutOf({ width, height })
      const ticks = [...new Set(marksOf(drawn).ticks)].sort((a, b) => a - b)
      expect(ticks, `${width} by ${height}`).toHaveLength(6)
      const words = wordsAt(drawn).filter(({ y }) => y > layout.rulerY)
      expect(words.map((word) => word.words)).toEqual(['1', '2', '4', '8', '16', '32 m'])
      for (const [k, word] of words.entries()) {
        // A doubling is the same step everywhere (a tick is set on a whole pixel), and each
        // number stands under its tick.
        expect(Math.abs(ticks[k] - xOfMetres(drawn, Math.pow(2, k)))).toBeLessThanOrEqual(1)
        expect(Math.abs(word.x + 0.5 - ticks[k])).toBeLessThan(0.01)
        expect(word.y).toBeLessThanOrEqual(height - 4)
        // The numbers do not run into one another (the harness sets a glyph 5 px wide).
        if (k > 0) {
          const room = (5 * (word.words.length + words[k - 1].words.length)) / 2 + 2
          expect(word.x - words[k - 1].x, `${width}: ${word.words}`).toBeGreaterThan(room)
        }
      }
      expect(words[5].x + 10, `${width}: "32 m" ends inside`).toBeLessThan(width - 4)
      // Behind 32 m there is still picture, for the images of a far source.
      expect(width - 4 - ticks[5]).toBeGreaterThan(12)
      expect(ticks[0]).toBeGreaterThan(layout.earX + 6)
    }
  })

  it('puts the dot where the device says the source is, on the scale and on the line', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      for (const place of [0, 0.25, 0.4, 0.8, 0.97, 1]) {
        const drawn = draw({ width, height, values: { distance: 0.6 }, ...at(place) })
        const marks = marksOf(drawn)
        expect(marks.dots, `${width} by ${height} at ${place}`).toHaveLength(1)
        expect(marks.dots[0].x).toBeCloseTo(xOfMetres(drawn, Math.pow(32, place)), 6)
        expect(marks.dots[0].y).toBe(layout.axisY)
        // The same place on the scale, in the accent.
        expect(marks.nows).toHaveLength(1)
        expect(marks.nows[0]).toBeCloseTo(marks.dots[0].x, 6)
        // The words say it in metres, on a patch of the plate.
        const said = metresText(Math.pow(32, place))
        expect(drawn.words()).toContain(said)
        // (At 32 m they are the scale's own last words, which stand on nothing.)
        if (place < 1) expect(patchUnder(drawn, said, ground)).not.toBeNull()
      }
    }
    expect(metresText(1)).toBe('1.0 m')
    expect(metresText(5.44)).toBe('5.4 m')
    expect(metresText(9.96)).toBe('10 m')
    expect(metresText(31.6)).toBe('32 m')
  })

  it('makes the dot as large as the direct sound is loud', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      const sized = (place: number, level: number): number =>
        marksOf(draw({ width, height, values: { level, wander: 0 }, ...at(place) })).dots[0].r
      // At 1 m it is as loud as it came in: the largest there is.
      expect(sized(0, 0)).toBeCloseTo(layout.full, 12)
      expect(layout.full).toBeGreaterThanOrEqual(3.5)
      // With no Level it loses 6 dB a doubling against the room and 2.1 dB more for the fall of
      // the whole: so much of the way to the floor.
      for (const place of [0.2, 0.4, 0.6, 0.8, 1]) {
        const db = -20 * (1 + K.kFall) * Math.log10(Math.pow(32, place))
        const share = Math.max(0, 1 - db / SIZE_FLOOR_DB)
        expect(sized(place, 0)).toBeCloseTo(layout.least + (layout.full - layout.least) * share, 6)
      }
      // Level gives it back: larger again, and never larger than it came in.
      expect(sized(0.8, 0.5)).toBeGreaterThan(sized(0.8, 0))
      expect(sized(0.8, 1)).toBeGreaterThan(sized(0.8, 0.5))
      expect(sized(0.8, 1)).toBeLessThanOrEqual(layout.full)
      expect(sized(1, 0)).toBeGreaterThanOrEqual(layout.least)
    }
  })

  it('makes the dot as bright as the air leaves the sound at 4 kHz', () => {
    expect(BRIGHT_HZ).toBe(4000)
    const lit = (place: number, air: number): number =>
      marksOf(draw({ values: { air }, ...at(place) })).dots[0].alpha
    // Two one-pole low-passes at kAirPoleRatio times the corner, as `process` runs them.
    const expected = (place: number, air: number): number => {
      const amount = (air * air * (Math.pow(32, place) - 1)) / 31
      const keep = Math.exp(
        (-2 * Math.PI * K.kAirPoleRatio * (K.kAirHz / Math.sqrt(amount))) / RATE,
      )
      const w = (2 * Math.PI * 4000) / RATE
      return DIM + ((1 - DIM) * (1 - keep) ** 2) / (1 - 2 * keep * Math.cos(w) + keep * keep)
    }
    for (const [place, air] of [
      [0.4, 0.5],
      [0.6, 1],
      [1, 1],
      [1, 0.3],
    ])
      expect(lit(place, air), `at ${place}, Air ${air}`).toBeCloseTo(expected(place, air), 9)
    // In clear air, and at 1 m, it is at its brightest.
    expect(lit(1, 0)).toBe(1)
    expect(lit(0, 1)).toBe(1)
    expect(lit(1, 1)).toBeLessThan(0.6)
    expect(lit(1, 1)).toBeGreaterThanOrEqual(DIM)
  })

  it('draws the width as a bar through the dot: the whole height at 1 m, closing with distance', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      const bar = (place: number, value: number) => {
        const drawn = draw({ width, height, values: { width: value }, ...at(place) })
        const marks = marksOf(drawn)
        expect(marks.bars).toHaveLength(1)
        expect(Math.abs(marks.bars[0].x - marks.dots[0].x)).toBeLessThanOrEqual(0.5)
        return marks.bars[0]
      }
      const open = bar(0, 0.5)
      expect(open.top).toBeCloseTo(layout.axisY - layout.spread, 9)
      expect(open.foot).toBeCloseTo(layout.axisY + layout.spread, 9)
      expect(open.top).toBeGreaterThanOrEqual(4)
      expect(open.foot).toBeLessThan(layout.rulerY - 3)
      for (const [place, value] of [
        [0.6, 1],
        [1, 0.5],
        [1, 0],
      ]) {
        const seen = Math.pow(Math.pow(32, place), value)
        const side = Math.min(1, (Math.atan(1 / seen) * 4) / Math.PI)
        const got = bar(place, value)
        expect((got.foot - got.top) / 2, `at ${place}, Width ${value}`).toBeCloseTo(
          side * layout.spread,
          9,
        )
      }
    }
  })

  it('draws each first reflection where its image stands, as large as it is loud', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      const set = { room: 0.3, air: 0.5, level: 0.5, width: 0.5 }
      const drawn = draw({ width, height, values: set, ...at(0.4) })
      const marks = marksOf(drawn)
      const scene = sceneOf(0.4, set, RATE)
      expect(marks.early, `${width} by ${height}`).toHaveLength(8)
      for (const [k, dot] of marks.early.entries()) {
        const tap = scene.early[k]
        const share = Math.min(1, Math.max(0, 1 - gainToDb(tap.gain) / SIZE_FLOOR_DB))
        expect(dot.r, `reflection ${k}`).toBeCloseTo(
          layout.least + (layout.full - layout.least) * share,
          9,
        )
        // As far away as its path is long, unless that is past the picture: then at its edge.
        expect(dot.x).toBeCloseTo(Math.min(xOfMetres(drawn, tap.path), width - 4 - dot.r), 6)
        // As far up (to the left) or down (to the right) as it is heard.
        expect(dot.y).toBeCloseTo(layout.axisY + tap.bearing * layout.spread, 9)
        // The whole dot is in the picture, above the scale.
        expect(dot.y - dot.r).toBeGreaterThanOrEqual(4)
        expect(dot.y + dot.r).toBeLessThan(layout.rulerY - 2)
        expect(dot.x + dot.r).toBeLessThanOrEqual(width - 4 + 1e-9)
        expect(dot.x).toBeGreaterThan(marks.dots[0].x)
      }
      // The floor and the ceiling are straight ahead, the walls to their sides.
      expect(marks.early[0].y).toBe(layout.axisY)
      expect(marks.early[1].y).toBe(layout.axisY)
      expect(marks.early[2].y).toBeLessThan(layout.axisY)
      expect(marks.early[3].y).toBeGreaterThan(layout.axisY)
    }
    // In a room 40 m wide the second walls' images are 80 m and more away, past the picture:
    // they wait at its edge.
    const wide = marksOf(draw({ values: { room: 1 }, ...at(0.4) }))
    const waiting = wide.early.filter((dot) => Math.abs(dot.x + dot.r - (184 - 4)) < 1e-9)
    expect(waiting).toHaveLength(2)
    expect(waiting).toEqual([wide.early[6], wide.early[7]])
  })

  it('has the room gain on the direct sound as the source recedes, from nothing at 1 m', () => {
    const layout = layoutOf({ width: 184, height: 48 })
    const close = marksOf(draw({ ...at(0) }))
    expect(close.early).toHaveLength(0)
    expect(close.haze).toHaveLength(0)
    let last = -Infinity
    const early: number[] = []
    for (const place of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const set = { room: 0.5, air: 0.5, level: 0.5, width: 0.5 }
      const marks = marksOf(draw({ values: set, ...at(place) }))
      const scene = sceneOf(place, set, RATE)
      // The haze: round the source, as large as the diffuse room is loud.
      expect(marks.haze).toHaveLength(1)
      expect(marks.haze[0].x).toBe(marks.dots[0].x)
      expect(marks.haze[0].y).toBe(layout.axisY)
      const level = 0.5 * Math.pow(0.5, 0.5) * (1 - 1 / Math.pow(32, place)) * scene.lift
      expect(scene.room).toBeCloseTo(level, 12)
      const share = Math.min(1, Math.max(0, 1 - gainToDb(level) / SIZE_FLOOR_DB))
      expect(marks.haze[0].r).toBeCloseTo(
        ROOM_HAZE * (layout.least + (layout.full - layout.least) * share),
        9,
      )
      // Against the dot it grows with every step (by itself it does not: at this Level the whole
      // gets quieter on the way out, and the haze with it).
      const against = marks.haze[0].r / ROOM_HAZE - marks.dots[0].r
      expect(against).toBeGreaterThan(last)
      expect(scene.room / scene.direct).toBeCloseTo(
        0.5 * Math.pow(0.5, 0.5) * (Math.pow(32, place) - 1),
        9,
      )
      last = against
      early.push(
        marks.early.reduce((total, dot) => total + dot.r * dot.r, 0) /
          (marks.dots[0].r * marks.dots[0].r),
      )
    }
    // With the loudness held the haze itself grows on the way out, up to the size of a sound as
    // loud as it came in, and never shrinks.
    const held = [0.1, 0.3, 0.5, 0.7, 0.9].map(
      (place) =>
        marksOf(draw({ values: { room: 0.5, air: 0, level: 1, width: 0.5 }, ...at(place) })).haze[0]
          .r,
    )
    for (let n = 1; n < held.length; n++) expect(held[n]).toBeGreaterThan(held[n - 1])
    expect(held[4]).toBeLessThanOrEqual(ROOM_HAZE * layout.full)
    // The reflections: more ink against the dot's with every step away.
    for (let n = 1; n < early.length; n++) expect(early[n]).toBeGreaterThan(early[n - 1])
    expect(early[4]).toBeGreaterThan(early[0] * 1.5)
  })

  it('marks the walk on the scale: from its near end to its far end', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      for (const [distance, wander] of [
        [0.4, 0.25],
        [0.1, 0.6],
        [0.9, 0.6],
        [0.5, 1],
      ]) {
        const drawn = draw({ width, height, values: { distance, wander }, ...at(distance) })
        const marks = marksOf(drawn)
        const near = Math.max(0, distance - wander / 2)
        const far = Math.min(1, distance + wander / 2)
        expect(marks.walks).toHaveLength(1)
        expect(marks.walks[0].y).toBe(layout.rulerY)
        expect(marks.walks[0].from).toBeCloseTo(xOfMetres(drawn, Math.pow(32, near)), 6)
        expect(marks.walks[0].to).toBeCloseTo(xOfMetres(drawn, Math.pow(32, far)), 6)
      }
      // With no Wander there is no walk to mark.
      expect(marksOf(draw({ width, height, values: { wander: 0 }, ...at(0.4) })).walks).toEqual([])
    }
  })

  it('says how far the pitch is bent while the source moves, and nothing while it stands', () => {
    expect(bendText(bendCents(1))).toBe('0 ct')
    expect(bendText(bendCents(0.99))).toBe('−17 ct')
    expect(bendText(bendCents(1.01))).toBe('+17 ct')
    expect(draw({ ...at(0.4, 1) }).words()).toContain('4.0 m')
    expect(draw({ ...at(0.4, 0.99) }).words()).toContain('4.0 m −17 ct')
    expect(draw({ ...at(0.4, 1.01) }).words()).toContain('4.0 m +17 ct')
    const moving = draw({ ...at(0.4, 0.99) })
    expect(patchUnder(moving, '4.0 m −17 ct', ground)).not.toBeNull()
    // The words stand in the corner the source is set away from.
    const wordAt = (distance: number) =>
      wordsAt(draw({ values: { distance }, ...at(distance) })).find(({ y }) => y < 20)
    expect(wordAt(0.3)?.x).toBeGreaterThan(150)
    expect(wordAt(0.8)?.x).toBeLessThan(20)
  })

  it('stands at Distance while the device says nothing, and while it is switched off', () => {
    const where = (options: FrameOptions): number => marksOf(draw(options)).dots[0].x
    const knob = draw({ values: { distance: 0.6 }, ...at(0.6) })
    const there = xOfMetres(knob, 8)
    // No readings yet: the device reports a bend of 1 at rest, never 0.
    expect(where({ values: { distance: 0.6 }, meters: { position: 0, bend: 0 } })).toBeCloseTo(
      there,
      6,
    )
    expect(where({ values: { distance: 0.6 }, meters: {} })).toBeCloseTo(there, 6)
    expect(where({ values: { distance: 0.6 }, ...at(0.2), powered: false })).toBeCloseTo(there, 6)
    // With them, the dot is where the device says, and the ring stays where the knob is.
    const walked = draw({ values: { distance: 0.6 }, ...at(0.2) })
    const marks = marksOf(walked)
    expect(marks.dots[0].x).toBeCloseTo(xOfMetres(walked, 2), 6)
    expect(marks.rings.some((ring) => Math.abs(ring.x - there) < 1e-6)).toBe(true)
  })

  it('lights the listener by what arrives', () => {
    const layout = layoutOf({ width: 184, height: 48 })
    const heard = marksOf(draw({ ...at(0.4), signal: testSignal(0.5, 0.35) }))
    expect(heard.ears).toHaveLength(1)
    expect(heard.ears[0].arcs[0][0]).toBe(layout.earX)
    expect(heard.ears[0].arcs[0][1]).toBe(layout.axisY)
    expect(heard.lamps).toHaveLength(1)
    expect(heard.lamps[0].alpha).toBeCloseTo(1 - gainToDb(0.35) / LAMP_FOOT_DB, 9)
    const louder = marksOf(draw({ ...at(0.4), signal: testSignal(0.5, 0.9) }))
    expect(louder.lamps[0].alpha).toBeGreaterThan(heard.lamps[0].alpha)
    expect(marksOf(draw({ ...at(0.4), signal: testSignal(0, 0) })).lamps).toEqual([])
    expect(marksOf(draw({ ...at(0.4) })).lamps).toEqual([])
  })
})

// --- The points --------------------------------------------------------------

describe('the points of Distance', () => {
  it('are drawn where they are taken: the source on its line, the ends of its walk on the scale', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      const values = { distance: 0.6, wander: 0.3 }
      const drawn = draw({ width, height, values, ...at(0.55) })
      const points = handles(values, { width, height })
      const rings = marksOf(drawn).rings
      expect(rings).toHaveLength(3)
      for (const point of Object.values(points))
        expect(
          rings.some((ring) => ring.x === point.x && ring.y === point.y),
          `${width} by ${height}: ${point.key} is drawn where it is`,
        ).toBe(true)
      expect(points.distance.x).toBeCloseTo(xOfMetres(drawn, 8), 6)
      expect(points.distance.y).toBe(layout.axisY)
      expect(points.near.x).toBeCloseTo(xOfMetres(drawn, Math.pow(32, 0.45)), 6)
      expect(points.far.x).toBeCloseTo(xOfMetres(drawn, Math.pow(32, 0.75)), 6)
      expect(points.near.y).toBe(layout.rulerY)
      expect(points.far.y).toBe(layout.rulerY)
      // The ring of Distance is larger than the largest dot, so the dot never hides it.
      const ring = rings.find((one) => one.x === points.distance.x && one.y === points.distance.y)
      expect(ring?.r).toBeGreaterThan(layout.full)
      // The one in hand is filled with the accent.
      const hot = marksOf(draw({ width, height, values, ...at(0.55), hot: 'far' })).rings
      expect(hot.filter((one) => one.fill === accent)).toHaveLength(1)
      expect(hot.find((one) => one.fill === accent)?.x).toBe(points.far.x)
    }
  })

  it('Distance: dragged to so many metres, the source is that far', () => {
    for (const [width, height] of SIZES) {
      const drawn = draw({ width, height, ...at(0.4) })
      const point = handles({}, { width, height }).distance
      for (const [metres, place] of [
        [1, 0],
        [2, 0.2],
        [8, 0.6],
        [16, 0.8],
        [32, 1],
      ]) {
        const set = point.drag(xOfMetres(drawn, metres), 0)
        expect(Object.keys(set)).toEqual(['distance'])
        expect(set.distance, `${width}: to ${metres} m`).toBeCloseTo(place, 6)
        // And taken there, it stands there.
        const moved = handles({ distance: set.distance }, { width, height }).distance
        expect(moved.x).toBeCloseTo(xOfMetres(drawn, metres), 6)
      }
      // Past the ends it stops at 1 m and at 32 m; up and down do nothing.
      expect(point.drag(-40, 20).distance).toBe(0)
      expect(point.drag(width + 40, 20).distance).toBe(1)
      expect(point.drag(point.x, -30).distance).toBeCloseTo(0.4, 9)
      expect(point.reset?.()).toEqual({ distance: 0.4 })
    }
  })

  it('Wander: an end dragged to a place walks the source that far either side', () => {
    for (const [width, height] of SIZES) {
      const values = { distance: 0.5, wander: 0.2 }
      const drawn = draw({ width, height, values, ...at(0.5) })
      const points = handles(values, { width, height })
      // The far end to 16 m (0.8): 0.3 either side. The near end to 2 m (0.2): the same.
      expect(points.far.drag(xOfMetres(drawn, 16), 0, {}).wander).toBeCloseTo(0.6, 6)
      expect(points.near.drag(xOfMetres(drawn, 2), 0, {}).wander).toBeCloseTo(0.6, 6)
      for (const key of ['near', 'far'] as const) {
        const set = points[key].drag(points[key].x, points[key].y, {})
        expect(Object.keys(set)).toEqual(['wander'])
        expect(set.wander).toBeCloseTo(0.2, 9)
        expect(points[key].reset?.()).toEqual({ wander: 0.25 })
      }
      // Taken there, the ends stand there.
      const moved = handles({ distance: 0.5, wander: 0.6 }, { width, height })
      expect(moved.far.x).toBeCloseTo(xOfMetres(drawn, 16), 6)
      expect(moved.near.x).toBeCloseTo(xOfMetres(drawn, 2), 6)
      // Onto the source closes the walk; no further than the whole way.
      expect(points.far.drag(points.distance.x, 0, {}).wander).toBeCloseTo(0, 9)
      expect(points.far.drag(width + 500, 0, {}).wander).toBe(1)
    }
  })

  it('Wander: a walk of nothing is opened from either end, either way', () => {
    const values = { distance: 0.5, wander: 0 }
    const drawn = draw({ values, ...at(0.5) })
    const points = handles(values)
    expect(points.near.x).toBe(points.far.x)
    expect(points.near.x).toBeCloseTo(points.distance.x, 9)
    expect(points.near.y).not.toBe(points.distance.y)
    for (const key of ['near', 'far'] as const)
      for (const metres of [2, 16])
        expect(points[key].drag(xOfMetres(drawn, metres), 0, {}).wander).toBeCloseTo(0.6, 6)
  })

  it('Wander: an end past 1 m or 32 m waits at the edge and is moved from where the setting lies', () => {
    for (const [width, height] of SIZES) {
      const layout = layoutOf({ width, height })
      const step = (layout.farX - layout.nearX) / 10
      // At 0.1 with a Wander of 0.6 the near end would stand at −0.2: it waits at 1 m.
      let values = { distance: 0.1, wander: 0.6 }
      const drawn = draw({ width, height, values, ...at(0.1) })
      let point = handles(values, { width, height }).near
      expect(point.x).toBeCloseTo(xOfMetres(drawn, 1), 6)
      const hold: DisplayHold = {}
      // Pressed and not moved, nothing changes.
      expect(point.drag(point.x, point.y, hold).wander).toBeCloseTo(0.6, 9)
      const from = point.x
      // Moved a tenth of the scale towards the source, the walk closes by a fifth: no jump.
      // The plate asks for the handles again at every move; the hold is the same hand's.
      let wander = point.drag(from + step, point.y, hold).wander
      expect(wander).toBeCloseTo(0.4, 6)
      values = { distance: 0.1, wander }
      point = handles(values, { width, height }).near
      expect(point.x).toBeCloseTo(from, 6)
      wander = point.drag(from + 2 * step, point.y, hold).wander
      expect(wander).toBeCloseTo(0.2, 6)
      // Now the end is on the picture, at the setting, and the hand is still that far off it.
      values = { distance: 0.1, wander }
      point = handles(values, { width, height }).near
      expect(point.x).toBeCloseTo(from, 6)
      expect(point.drag(from + 2.5 * step, point.y, hold).wander).toBeCloseTo(0.1, 6)

      // The far end the same, at 0.9: it would stand at 1.2 and waits at 32 m.
      const far = handles({ distance: 0.9, wander: 0.6 }, { width, height }).far
      expect(far.x).toBeCloseTo(xOfMetres(drawn, 32), 6)
      const other: DisplayHold = {}
      expect(far.drag(far.x, far.y, other).wander).toBeCloseTo(0.6, 9)
      expect(far.drag(far.x - step, far.y, other).wander).toBeCloseTo(0.4, 6)
    }
  })
})
