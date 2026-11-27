// The arithmetic of Flame Organ's display: which harmonic a flame at a place,
// with a lag, makes a tube sing, and where that is drawn. It is the device's
// own (`stand` and `steer` in `cpp/devices/flame-organ/flame_organ.h`).

import { clamp, lerp, type Box } from '../display-kit'
import { type DisplayHandle, type DisplayView } from '../plate-display'

// --- The device's numbers ------------------------------------------------------

/** `kTubes`, as Tube counts them. */
export const FLAME_TUBES = ['Open', 'Half closed', 'Flared', 'Narrow', 'Double'] as const
export const CLOSED = 1
export const FLARED = 2
export const NARROW = 3
export const DOUBLE = 4
export const COAL = 3
/** `Fuel::slow`: the harmonic up to which a flame of this fuel can follow. */
const FUEL_SLOW = [2.4, 1.5, 5.5, 1.3]
/** `kModes`, `kTwin`, `kHighest`. */
const MODES = 12
export const TWIN = 8
const HIGHEST = 5.5
export const FLAME_LAG = [0.05, 0.45] as const
export const FLAME_PLACE = [0.03, 0.45] as const

/** `tube_ratio`: which harmonic of the key a mode is. */
export function flameRatio(tube: number, mode: number): number {
  if (tube === CLOSED) return 2 * mode + 1
  if (tube === NARROW) return mode < 4 ? mode + 1 : 2 * mode - 2
  return mode + 1
}

export const turn = (turns: number): number => Math.sin(2 * Math.PI * turns)
const gentle = (x: number): number => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * `FlameOrgan::stand`: what each mode of the key's pipe takes of the flame's
 * heat and gives back, over what the one that sings does: 1 is the singer,
 * under 0 is damped. `sings` is that one's harmonic.
 */
export function flameStand(tube: number, fuel: number, lag: number, place: number) {
  const modes = tube === DOUBLE ? TWIN : MODES
  const tilt = clamp(1 - 5 * place, -1.2, 0.9)
  const closed = tube === CLOSED
  let power = 0
  const rows = Array.from({ length: modes }, (_, m) => {
    const n = flameRatio(tube, m)
    const across = turn(0.5 * n * place)
    const along = turn(0.5 * n * place + 0.25)
    const more = Math.pow(2, tilt * Math.log2(n))
    const shape = (closed ? along : across) * more
    const seen = (closed ? across : along) / more / (1 + (n / FUEL_SLOW[fuel]) ** 2)
    power += (shape * shape) / n
    return { n, shape, seen, sine: turn(n * lag) }
  })
  const level = 1 / Math.sqrt(Math.max(power, 1e-4))
  let singer = 0
  let best = -1
  rows.forEach((row, m) => {
    row.shape *= level
    const k = row.shape * row.seen
    const claim =
      (Math.abs(k) * Math.max(0.02, k >= 0 ? row.sine : -row.sine) + 1e-5) * (m === 0 ? 1.08 : 1)
    if (row.n <= HIGHEST && claim > best) [best, singer] = [claim, m]
  })
  const s = rows[singer]
  const own = s.shape >= 0 ? Math.max(s.shape, 0.05) : Math.min(s.shape, -0.05)
  const most = Math.max(0.02, Math.abs(own * s.seen * s.sine))
  return {
    /** The mode that sings, its harmonic, and what each mode is fed. */
    singer,
    sings: s.n,
    fed: rows.map((row, m) => (m === singer ? 1 : (row.shape * row.seen * row.sine) / most)),
  }
}

/** Where the second flame stands (`place2` in `steer`). */
export function flamePlace2(place: number, between: number): number {
  return lerp(place, clamp(0.46 - 0.95 * place, 0.05, 0.42), Math.min(1, 0.05 + 2.4 * between))
}

/** How strongly two flames hear each other (`couple` in `steer`), 0 to 0.9. */
export const flameCouple = (second: number, between: number): number =>
  0.9 * (1 - between) ** 3 * Math.min(1, 2 * second)

/** How far a key wants to lift in a mood of 0 to 1 (`wants` in `steer`). */
export const flameWants = (lift: number, mood: number): number =>
  gentle((mood - (1.02 - lift * (1.8 - 0.4 * lift))) / 0.36)

/** The share of its time a key spends lifted by itself, over all its moods. */
export function flameLifted(lift: number): number {
  let time = 0
  for (let i = 0; i < 20; i++) time += flameWants(lift, (i + 0.5) / 20) / 20
  return time
}

/** What the modes are fed as a key lifts to the second of them (`stand`). */
export function flameFed(tube: number, stand: ReturnType<typeof flameStand>, lift: number) {
  return stand.fed.map((k, m) => {
    if (m === 1) return lerp(k, 1, lift)
    const below = flameRatio(tube, m) < flameRatio(tube, 1)
    return (
      k * (1 - lift * (below ? 1 : 0.6)) * (m === stand.singer && lift > 0.5 ? 2 - 2 * lift : 1)
    )
  })
}

/** How a flame may burn at this Flicker, the least and the most of 1 (`flicker` in `steer`). */
export function flameFlicker(flicker: number): [number, number] {
  const much = 1.1 * flicker ** 1.25
  return [Math.max(0.06, 1 - much), 1 + much]
}

/** How tall a flame burns for a key this hard (`tall` in `steer`). */
export const flameTall = (flame: number, gain: number): number =>
  clamp(flame * (0.4 + 0.86 * gain), 0, 1.15)

/** What the display reads off the knobs. */
export function flameSet(view: Pick<DisplayView, 'value'>) {
  const of = (name: string): number => view.value(name)
  return {
    tube: clamp(Math.round(of('tube')), 0, 4),
    fuel: clamp(Math.round(of('fuel')), 0, 3),
    flame: of('flame'),
    lag: of('lag'),
    place: of('place'),
    second: of('secondFlame'),
    between: of('between'),
    flicker: of('flicker'),
    roar: of('roar'),
    draught: of('draught'),
    lift: of('lift'),
  }
}
export type FlameSet = ReturnType<typeof flameSet>

// --- The picture ---------------------------------------------------------------

/** A knob is drawn as a key this hard would burn. */
export const REST_GAIN = 0.7
/** The furthest a gust carries Lag and Place, with Draught at the top (`draught_`, `steer`). */
export const GUST_LAG = 0.09 * 1.45
export const GUST_PLACE = 0.13 * 1.45
/** How strongly the land of harmonic n is inked. */
export const FLAME_LAND = [0, 0.02, 0.2, 0.36, 0.12, 0.48]

export function flameLayout(size: Pick<DisplayView, 'width' | 'height'>) {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const tubes: Box = { x: box.x, y: box.y, w: Math.round(clamp(box.w * 0.33, 34, 72)), h: 84 }
  const left = tubes.x + tubes.w + 6
  const w = box.x + box.w - left
  return {
    foot,
    tubes: { ...tubes, h: foot.y - 4 - tubes.y },
    head: { x: left, right: left + w, baseline: box.y + 8 },
    bars: { x: left, y: box.y + 12, w, h: 20 },
    map: { x: left, y: box.y + 36, w, h: foot.y - 4 - (box.y + 36) },
  }
}

export const flameMapX = (lag: number, map: Box): number =>
  map.x + ((lag - FLAME_LAG[0]) / (FLAME_LAG[1] - FLAME_LAG[0])) * map.w
export const flameMapY = (place: number, map: Box): number =>
  map.y + map.h - ((place - FLAME_PLACE[0]) / (FLAME_PLACE[1] - FLAME_PLACE[0])) * map.h
export const flameLagOf = (x: number, map: Box): number =>
  clamp(lerp(FLAME_LAG[0], FLAME_LAG[1], (x - map.x) / map.w), ...FLAME_LAG)
export const flamePlaceOf = (y: number, map: Box): number =>
  clamp(lerp(FLAME_PLACE[0], FLAME_PLACE[1], (map.y + map.h - y) / map.h), ...FLAME_PLACE)

/** How long a tube is drawn, as a share of the room: a half closed one is half as long for the same key. */
export const flameLength = (tube: number): number => (tube === CLOSED || tube === DOUBLE ? 0.5 : 1)
/** How tall a flame of so much is drawn. */
const FLAME_LEAST = 6
const FLAME_MORE = 22
export const flameHigh = (tall: number): number => FLAME_LEAST + FLAME_MORE * tall
export const flameOfHigh = (high: number): number => (high - FLAME_LEAST) / FLAME_MORE
/** The share of a tube's length that is under its flame. */
export const flameShare = (tube: number, place: number): number =>
  tube === CLOSED ? 2 * place : place

/** A tube as it is drawn: its middle, its foot, its length, and half its width. */
export interface FlameTube {
  x: number
  foot: number
  long: number
  half: number
}

/** The two tubes: the second stands further off as Between opens. */
export function flameTubes(tube: number, between: number, room: Box): [FlameTube, FlameTube] {
  const half = tube === NARROW ? 3.6 : tube === FLARED ? 5.4 : 6.6
  const x = room.x + 8
  const away = room.w - 37
  const both = { foot: room.y + room.h, long: room.h * flameLength(tube), half }
  return [
    { ...both, x },
    { ...both, x: x + 15 + away * clamp(between, 0, 1), half: half * 0.85 },
  ]
}

/** How far from its middle the tube's wall is, so far up it. */
export const flameWall = (tube: number, half: number, up: number): number =>
  tube === FLARED ? half * (0.75 + 0.7 * up ** 3) : half

/** The air in a tube, so far up it, where harmonic n sings: its pressure, -1 to 1. */
export const flameAir = (tube: number, n: number, up: number): number =>
  tube === CLOSED ? Math.cos((Math.PI * n * up) / 2) : Math.sin(Math.PI * n * up)

/** The map of one tube and fuel, a harmonic to a pixel, and the widest spot of each one's land. */
export function flameMap(tube: number, fuel: number, map: Box) {
  const cols = Math.ceil(map.w)
  const rows = Math.ceil(map.h)
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const place = flamePlaceOf(map.y + r + 0.5, map)
      return flameStand(tube, fuel, flameLagOf(map.x + c + 0.5, map), place).sings
    }),
  )
  const names = [1, 2, 3, 4, 5].flatMap((n) => {
    let [most, x, y] = [4, -1, -1]
    for (let r = 4; r < rows - 4; r++)
      for (let c = 3; c < cols - 3; c++) {
        let d = 0
        const own = (dr: number, dc: number) => cells[r + dr]?.[c + dc] === n
        while (d < 24 && own(0, -d) && own(0, d) && own(-d, 0) && own(d, 0)) d++
        if (d > most) [most, x, y] = [d, map.x + c + 0.5, map.y + r + 0.5]
      }
    return x < 0 ? [] : [{ n, x, y }]
  })
  return { cells, names }
}

/** The point of Lag and Place on the map, and Flame on the wall of its tube. */
export function flameHandles(view: DisplayView): [DisplayHandle, DisplayHandle] {
  const { map, tubes } = flameLayout(view)
  const set = flameSet(view)
  const [first] = flameTubes(set.tube, set.between, tubes)
  const base = first.foot - flameShare(set.tube, set.place) * first.long
  const start = (name: string): number => view.spec(name)?.default ?? 0
  return [
    {
      key: 'lag',
      name: 'Lag and Place',
      x: flameMapX(set.lag, map),
      y: flameMapY(set.place, map),
      drag: (x, y) => ({ lag: flameLagOf(x, map), place: flamePlaceOf(y, map) }),
      reset: () => ({ lag: start('lag'), place: start('place') }),
    },
    {
      key: 'flame',
      name: 'Flame',
      x: first.x - first.half,
      y: base - flameHigh(set.flame),
      drag: (_x, y) => ({ flame: clamp(flameOfHigh(base - y), 0, 1) }),
      wheel: (steps) => ({ flame: clamp(set.flame + 0.02 * steps, 0, 1) }),
      reset: () => ({ flame: start('flame') }),
    },
  ]
}
