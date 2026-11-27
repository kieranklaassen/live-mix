// The display of Standing Water: the pool from above, the circle it is read
// along, and what is read there.
//
// The pool shows the reading over the whole surface as the tallest key's water
// stands now: crests for Height, the side that leans for Slope, the light on
// the floor for Caustic. A key strikes it (rings run out), the figure swells
// as Lag and Shake let it, and goes as Calm lets it. The circle is the one that
// key is read along, with a ring for every other held key; Stray carries it off
// over the figure and Drift says how fast. The point beside the middle sets
// Circle. Under the pool are two cycles of what is read, the same mark running
// along both. At the right Shake fills a glass against the mark of Threshold,
// which can be dragged: what stands over it is what the figure grows from.
//
// The arithmetic is in `standing-water-parts.ts` and `standing-water-cycle.ts`,
// which key is shown in `standing-water-keys.ts`.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillTo,
  ground,
  handle,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, pitchName } from './instrument-parts'
import { CYCLE_POINTS, waterCycle } from './standing-water-cycle'
import { moveKeys, type KeyWater, type PoolState } from './standing-water-keys'
import {
  WATER_READINGS,
  waterCircle,
  waterFigure,
  waterKnob,
  waterPast,
  waterRadius,
  waterReading,
  waterRipples,
  waterSettled,
  waterShaken,
  waterSill,
  waterStrength,
  type Ask,
  type Water,
} from './standing-water-parts'
import { contour, drawSplash, ring, shore, waterField } from './standing-water-pool'

type Size = Pick<DisplayView, 'width' | 'height'>

/** The top of the glass: Shake full under the hardest touch. */
const GLASS = 1.12
/** How far into the ink the pool lies. */
const DEEP = 0.84
/** The touch and the key the plate shows at rest. */
const REST_HZ = 261.6256
const REST_TOUCH = 0.7
/** How often the mark goes round its circle: the pitch is too fast to see. */
const READ_HZ = 0.35
/** The contours of the reading, as shares of the way from still water to the brightest. */
const CONTOURS = [0.14, 0.36, 0.64] as const

export interface WaterLayout {
  head: { left: number; right: number; baseline: number }
  pool: Box
  glass: Box
  cycle: Box
  foot: Box
}

export function waterLayout(size: Size): WaterLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const tall = Math.round(box.h * 0.19)
  const cycle: Box = { x: box.x, y: foot.y - 3 - tall, w: box.w, h: tall }
  const top = box.y + 12
  const h = cycle.y - 3 - top
  return {
    head: { left: box.x, right: box.x + box.w, baseline: box.y + 8 },
    pool: { x: box.x, y: top, w: box.w - 11, h },
    glass: { x: box.x + box.w - 7, y: top, w: 6, h },
    cycle,
    foot,
  }
}

/** Pixels of a radian of the ripple: the widest circle of a figure fills the pool from shore to shore. */
export const waterScale = (ask: Ask, pool: Box): number =>
  pool.h / 2 / (waterFigure(ask).high * 0.84)

/** Where an amount of shaking stands in the glass. */
export const waterGlassY = (amount: number, glass: Box): number =>
  glass.y + glass.h * (1 - clamp(amount / GLASS, 0, 1))

/** Where the reading is now, on its circle and on its cycle. */
function mark(frame: DisplayFrame, x: number, y: number): void {
  dot(frame.ctx, x, y, 4, frame.colours.plate, { ring: frame.colours.ink })
  dot(frame.ctx, x, y, 2.25, frame.colours.accent)
}

/** A place of the pool by chance, the same every time. */
const speck = (k: number): number => {
  const x = Math.sin(k * 91.17 + 4.1) * 43758.5453
  return x - Math.floor(x)
}

function drawPool(
  frame: DisplayFrame<PoolState>,
  ask: Ask,
  at: WaterLayout,
  key: KeyWater | null,
  water: Water,
): void {
  const { ctx, colours, state } = frame
  const { pool } = at
  const live = key !== null
  const strength = waterStrength(ask, water)
  const ripples = waterRipples(ask, water)
  const circle = waterCircle(ask, water, strength)
  const scale = waterScale(ask, pool)
  const [midX, midY] = [pool.x + pool.w / 2, pool.y + pool.h / 2]
  ctx.save()
  shore(ctx, ask, pool)
  ctx.globalAlpha = DEEP
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.clip()

  const cell = pool.w * pool.h > 9000 ? 2 : 1.5
  const columns = Math.ceil(pool.w / cell) + 1
  const count = columns * (Math.ceil(pool.h / cell) + 1)
  const place = (n: number): readonly [number, number] => [
    ((n % columns) * cell - pool.w / 2) / scale,
    (Math.floor(n / columns) * cell - pool.h / 2) / scale,
  ]
  const field = waterField(ask, ripples, strength, circle, place, count)
  CONTOURS.forEach((level, n) => {
    ctx.beginPath()
    contour(ctx, field, columns, level, { x: pool.x, y: pool.y, w: cell, h: cell })
    ctx.globalAlpha = (live ? [0.5, 0.65, 1] : [0.3, 0.4, 0.6])[n]
    ctx.fillStyle = colours.plate
    ctx.fill()
  })
  // Air on the waves.
  const specks = Math.round((ask('foam') * pool.w * pool.h) / 70)
  for (let k = 0; k < specks; k++) {
    const [px, py] = [pool.x + speck(2 * k) * pool.w, pool.y + speck(2 * k + 1) * pool.h]
    dot(ctx, px, py, 0.6, colours.plate, { alpha: 0.8 })
  }

  // Circle as the knob has it; over it the circles of the keys, each on its own water.
  const rest = waterRadius(waterFigure(ask), ask('circle')) * scale
  ring(frame, midX, midY, rest, colours.ink, 0.6, live ? 1 : 3.5)
  ring(frame, midX, midY, rest, colours.plate, live ? INK.back : 1, live ? 1 : 1.5)
  if (!live) drawSplash(frame, ask, midX, midY, water)
  for (const other of state.keys) {
    const tall = waterStrength(ask, other.water)
    const [ox, oy, r] = waterCircle(ask, other.water, tall)
    const [x, y] = [midX + ox * scale, midY + oy * scale]
    drawSplash(frame, ask, x, y, other.water)
    const alpha = other.held ? 1 : Math.min(1, 2 * tall)
    if (other === key || alpha < 0.02) continue
    ring(frame, x, y, r * scale, colours.ink, 0.6 * alpha, 2.5)
    ring(frame, x, y, r * scale, colours.plate, alpha)
  }
  if (live) {
    const [x, y, r] = [midX + circle[0] * scale, midY + circle[1] * scale, circle[2] * scale]
    ring(frame, x, y, r, colours.ink, 1, 5.5)
    ring(frame, x, y, r, colours.plate, 1, 3.75)
    ring(frame, x, y, r, colours.accent, 1, 1.75)
    const turn = frame.now * READ_HZ * Math.PI * 2
    mark(frame, x + r * Math.cos(turn), y + r * Math.sin(turn))
  }
  ctx.restore()
  shore(ctx, ask, pool)
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
  const { wave } = waterCycle(ask, water, ripples, circle, strength)
  drawCycle(frame, at.cycle, wave, strength, live)
}

function drawCycle(
  frame: DisplayFrame,
  box: Box,
  wave: Float64Array,
  strength: number,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const level = strength > 0 ? (1.28 * strength) / (strength + 0.28) : 0
  let peak = 1.6
  for (const v of wave) peak = Math.max(peak, Math.abs(v))
  const mid = box.y + box.h / 2
  const points: Point[] = []
  for (let i = 0; i <= CYCLE_POINTS; i += 4) {
    const v = (wave[i % CYCLE_POINTS] / peak) * Math.min(1, level)
    points.push([box.x + (i / CYCLE_POINTS) * box.w, mid - v * (box.h / 2 - 1)])
  }
  rule(ctx, box.x, mid, box.x + box.w, mid, { colour: colours.ink, alpha: INK.grid })
  const half = box.x + box.w / 2
  rule(ctx, half, box.y, half, box.y + box.h, { colour: colours.ink, alpha: INK.rule })
  clipped(ctx, box, () => {
    fillTo(ctx, points, mid, colours.ink)
    trace(ctx, points, { colour: colours.ink, width: 1.5 })
  })
  if (!live) return
  const run = (frame.now * READ_HZ) % 2
  const [x, y] = points[Math.round((run / 2) * (CYCLE_POINTS / 4)) % points.length]
  mark(frame, x, y)
}

function drawGlass(
  frame: DisplayFrame,
  ask: Ask,
  at: WaterLayout,
  touch: number,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const { glass } = at
  const foot = glass.y + glass.h
  const full = waterGlassY(waterShaken(ask('shake'), touch), glass)
  const sill = waterGlassY(waterSill(ask('threshold')), glass)
  fillRect(ctx, glass, colours.ink, INK.fill)
  const under = Math.max(full, sill)
  fillRect(ctx, { ...glass, y: under, h: foot - under }, colours.ink, INK.back)
  if (waterPast(ask, touch) > 0)
    fillRect(ctx, { ...glass, y: full, h: sill - full }, live ? colours.accent : colours.ink)
  rule(ctx, glass.x - 2, sill, glass.x + glass.w + 1, sill, { colour: colours.ink })
}

export function waterHandles(view: DisplayView): readonly DisplayHandle[] {
  const ask: Ask = (name) => view.value(name)
  const { pool, glass } = waterLayout(view)
  const at = waterFigure(ask)
  const scale = waterScale(ask, pool)
  const [midX, midY] = [pool.x + pool.w / 2, pool.y + pool.h / 2]
  const r = waterRadius(at, ask('circle')) * scale * Math.SQRT1_2
  return [
    {
      key: 'circle',
      name: 'Circle',
      x: midX + r,
      y: midY - r,
      drag: (x, y) => ({ circle: waterKnob(at, Math.hypot(x - midX, y - midY) / scale) }),
      wheel: (steps) => ({ circle: clamp(ask('circle') + steps * 0.02, 0, 1) }),
      reset: () => ({ circle: view.spec('circle')?.default ?? 0.4 }),
    },
    {
      key: 'threshold',
      name: 'Threshold',
      x: glass.x + glass.w / 2,
      y: waterGlassY(waterSill(ask('threshold')), glass),
      drag: (_x, y) => ({
        threshold: clamp(((1 - (y - glass.y) / glass.h) * GLASS) / waterSill(1), 0, 1),
      }),
      wheel: (steps) => ({ threshold: clamp(ask('threshold') + steps * 0.02, 0, 1) }),
      reset: () => ({ threshold: view.spec('threshold')?.default ?? 0.2 }),
    },
  ]
}

const standingWater = plateDisplay<PoolState>({
  place: 'window',
  columns: 2,
  params: [
    ...['pattern', 'reading', 'pool', 'shake', 'threshold', 'lag', 'circle', 'depth', 'layers'],
    ...['thickness', 'unrest', 'drift', 'stray', 'below', 'splash', 'stone', 'foam', 'calm'],
  ],
  live: { signal: true, notes: true },
  info: 'The pool from above, lit as Reading says, and the circle its key is read along; drag its point to set Circle. Below, two cycles of what is read there. Right, Shake in a glass against the mark of Threshold, which can be dragged: what stands over it feeds the figure.',
  init: () => ({ keys: [], seen: null, since: 0, heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const ask: Ask = (name) => frame.value(name)
    const at = waterLayout(frame)
    const key = moveKeys(frame, ask)
    const played = key?.water
    const water = played ?? waterSettled(ask, REST_HZ, REST_TOUCH)
    text(frame, waterFigure(ask).name, at.head.left, at.head.baseline)
    const reads = WATER_READINGS[waterReading(ask)]
    const words = played ? `${reads}  ${pitchName(played.hz)}` : reads
    text(frame, words, at.head.right, at.head.baseline, { align: 'right' })
    drawPool(frame, ask, at, key, water)
    drawGlass(frame, ask, at, water.velocity, key !== null)
    for (const point of waterHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 2.5 })
    levelFoot(frame, at.foot, meanOutShare(frame.state, frame, 1))
  },
  handles: (view) => waterHandles(view),
})

export const STANDING_WATER_FACES: Readonly<Record<string, PlateFace>> = {
  'standing-water': {
    display: standingWater,
    face: ['pattern', 'reading', 'shake', 'depth'],
    sections: [
      ['pattern', 'reading', 'pool', 'circle', 'depth', 'layers'],
      ['shake', 'threshold', 'lag', 'thickness', 'below', 'calm'],
      ['unrest', 'drift', 'stray', 'splash', 'stone', 'foam'],
      ['width', 'volume'],
    ],
  },
}
