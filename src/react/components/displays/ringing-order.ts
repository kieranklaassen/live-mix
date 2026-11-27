// The display of Ringing Order: four rows, as the ringers ring them.
//
// Every ringer has a rope across the picture, the lowest at the foot. A rope is
// as thick as that ringer is loud in all the keys together, so a blow is a
// swelling that thins as it rings away, and where the rows overlap the ropes
// never part. A line in the accent goes from blow to blow of the key held
// longest: the order. At the left each rope comes from the pitch its ringer
// stands on. Under the ropes lies the covering tone, and under that the tower:
// every key's blows against the one clock, the drawn key's in the accent. The
// picture is a page of four rows that stands still while the clock goes over it,
// and turns when the clock has come to its end.
//
// Over the ropes are two points: the end of the first row, where the gap begins,
// sets Gap; the foot of the wedge, how long a ringer sounds from the shortest to the
// longest, sets Overlap. The rows are `ringing-order-rows.ts`.

import {
  INK,
  clamp,
  dot,
  fillBetween,
  fillRect,
  fillTo,
  ground,
  handle,
  lerp,
  rule,
  text,
  trace,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, type HeardLevel } from './instrument-parts'
import {
  RINGING_LANES,
  ringingLayout,
  ringingPitchY,
  ringingRope,
  ringingWedge,
  type RingingLayout,
} from './ringing-order-layout'
import {
  RINGING_METHODS,
  RINGING_PAGE,
  RINGING_PARAMS,
  RINGING_TOWERS,
  ringingBlows,
  ringingGhosts,
  ringingKeys,
  ringingLines,
  ringingPage,
  ringingSettings,
  ringingShown,
  ringingTail,
  type RingingKey,
  type RingingSettings,
} from './ringing-order-rows'
import {
  ringingOvers,
  ringingRopes,
  ringingShape,
  ringingThick,
  ringingVoiceOver,
} from './ringing-order-sound'

interface RingingState extends HeardLevel {
  /** The clock in rows since it started; null while nothing sounds. */
  clock: number | null
}

export function ringingHandles(view: DisplayView): readonly DisplayHandle[] {
  const { ropes, strip } = ringingLayout(view)
  const cell = ropes.w / RINGING_PAGE
  const wedge = ringingWedge(ropes)
  const most = view.spec('gap')?.max ?? 1.2
  const reset = (name: string) => () => ({ [name]: view.spec(name)?.default ?? 0 })
  return [
    {
      key: 'gap',
      name: 'Gap',
      x: ropes.x + cell / (1 + view.value('gap')),
      y: strip,
      drag: (x) => ({ gap: clamp(cell / Math.max(1, x - ropes.x) - 1, 0, most) }),
      reset: reset('gap'),
    },
    {
      key: 'overlap',
      name: 'Overlap',
      x: wedge.x + wedge.w * view.value('overlap'),
      y: strip,
      drag: (x) => ({ overlap: clamp((x - wedge.x) / wedge.w, 0, 1) }),
      reset: reset('overlap'),
    },
  ]
}

/** The keys there have been since the page began and the clock started: what rang on it is still to be seen. */
const keysOf = (set: RingingSettings, notes: readonly DisplayNote[], clock: number): RingingKey[] =>
  ringingKeys(set, notes, clock, (clock - ringingPage(set, clock).from) * set.row).filter(
    (key) => key.entry > 0 || (clock - key.off) * set.row < 1.01 * ringingTail(set),
  )

/** The clock on this frame: it starts with the first key that finds nothing sounding. */
function clockNow(frame: DisplayFrame<RingingState>, set: RingingSettings): number | null {
  const { state, notes, powered } = frame
  const keys = powered ? ringingKeys(set, notes, 0) : []
  if (keys.length === 0) state.clock = null
  else if (state.clock === null) state.clock = Math.max(...keys.map((key) => -key.entry))
  else state.clock += frame.dt / set.row
  return state.clock
}

function drawRopes(
  frame: DisplayFrame<RingingState>,
  at: RingingLayout,
  set: RingingSettings,
  keys: readonly RingingKey[],
  clock: number | null,
): void {
  const { ctx, colours } = frame
  const { ropes, fan } = at
  const key = ringingShown(keys)
  const n = set.ringers
  const { from, to } = ringingPage(set, clock ?? 0)
  const chord = keys.filter((each) => each.off === Infinity).map((each) => each.hz)
  const overs = ringingOvers(set, key.hz, clock === null ? [] : chord)
  const x = (time: number): number => ropes.x + ((time - from) / (to - from)) * ropes.w
  const y = (i: number): number => ringingRope(i, n, ropes)
  const room = (ropes.h / n) * 0.46
  // The rows: where each begins, and the gap after it.
  for (let row = 0; row < RINGING_PAGE; row += 1) {
    const begins = x(from + row * (1 + set.gap))
    const ends = x(from + row * (1 + set.gap) + 1)
    rule(ctx, begins, ropes.y, begins, at.lanes.y + at.lanes.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const next = x(from + (row + 1) * (1 + set.gap))
    fillRect(ctx, { x: ends, y: ropes.y, w: next - ends, h: ropes.h }, colours.ink, 0.07)
  }
  const steps = Math.floor(ropes.w / 1.5) + 1
  const levels = ringingRopes(set, clock === null ? [key] : keys, from, to, steps)
  const now =
    clock === null ? steps - 1 : clamp(((clock - from) / (to - from)) * (steps - 1), 0, steps - 1)
  const cut = Math.floor(now)
  for (let i = 0; i < n; i += 1) {
    const middle = y(i)
    const from0 = ringingPitchY(Math.log2(overs[i] * ringingVoiceOver(set)), fan)
    trace(
      ctx,
      [
        [fan.x + 4, from0],
        [ropes.x, middle],
      ],
      { colour: colours.ink, width: 0.8, alpha: INK.back },
    )
    rule(ctx, fan.x, from0, fan.x + 4, from0, { colour: colours.ink, width: 1.4 })
    rule(ctx, ropes.x, middle, ropes.x + ropes.w, middle, { colour: colours.ink, alpha: INK.rule })
    const thick = levels[i].map((level) => ringingThick(level) * room)
    const edge = (side: number, a: number, b: number): Point[] =>
      thick
        .slice(a, b)
        .map((t, s): Point => [
          lerp(ropes.x, ropes.x + ropes.w, (a + s) / (steps - 1)),
          middle + side * t,
        ])
    fillBetween(ctx, edge(-1, 0, cut + 1), edge(1, 0, cut + 1), colours.ink, 0.9)
    fillBetween(ctx, edge(-1, cut, steps), edge(1, cut, steps), colours.ink, 0.4)
  }
  // The order.
  const { blows } = ringingBlows(set, key, from, to)
  const shown = blows.filter((blow) => blow.time >= from && blow.ringer < n)
  const width = set.method === 3 ? 0.9 : 1.3
  for (const line of ringingLines(set, shown)) {
    const points = line.map((blow): Point => [x(blow.time), y(blow.ringer)])
    const done = line.filter((blow) => clock === null || blow.time <= clock).length
    // A seam of the plate's colour under it, so it is read where it runs over a rope.
    trace(ctx, points.slice(0, done), { colour: colours.plate, width: width + 1.8, alpha: 0.75 })
    trace(ctx, points.slice(Math.max(0, done - 1)), { colour: colours.accent, width, alpha: 0.38 })
    trace(ctx, points.slice(0, done), { colour: colours.accent, width })
  }
  for (const blow of shown) {
    const rung = clock === null || blow.time <= clock
    const size = 0.8 + 1.3 * ringingThick(blow.gain)
    dot(ctx, x(blow.time), y(blow.ringer), blow.entry ? 0.8 : size, colours.accent, {
      alpha: rung ? 1 : 0.5,
    })
  }
  if (clock !== null) {
    const here = ropes.x + (now / (steps - 1)) * ropes.w
    rule(ctx, here, ropes.y - 2, here, at.lanes.y + at.lanes.h, {
      colour: colours.ink,
      alpha: INK.text,
    })
    for (let i = 0; i < n; i += 1) {
      const big = ringingThick(levels[i][Math.round(now)])
      if (big > 0.12) dot(ctx, here, y(i), 1 + 2 * big, colours.accent, { ring: colours.plate })
    }
  }
}

/** The covering tone: a band as thick as it is loud, touched again at every row of the key. */
function drawCover(
  frame: DisplayFrame<RingingState>,
  at: RingingLayout,
  set: RingingSettings,
): void {
  const { ctx, colours } = frame
  const { cover } = at
  const foot = cover.y + cover.h
  const size = Math.min(1, set.cover * (0.35 + 0.65 * set.cover) * 1.25)
  const fall = clamp(0.45 * set.row, 0.05, 4) / set.row
  const whole = 1 + set.gap
  const points: Point[] = []
  for (let px = 0; px <= cover.w; px += 1.5) {
    const into = ((px / cover.w) * RINGING_PAGE) % 1
    const accent = 0.8 + 0.5 * Math.exp((-into * whole) / fall)
    points.push([cover.x + px, foot - (cover.h * Math.sqrt(size) * accent) / 1.3])
  }
  rule(ctx, cover.x, foot, cover.x + cover.w, foot, { colour: colours.ink, alpha: INK.rule })
  if (size > 0) fillTo(ctx, points, foot, colours.ink, INK.back)
}

/** The keys the tower has room for: the one drawn, and the newest of the others. */
const lanesOf = (keys: readonly RingingKey[], shown: RingingKey): RingingKey[] => [
  shown,
  ...keys.filter((key) => key !== shown).slice(1 - RINGING_LANES),
]

/** The tower: a lane for each key with its blows on the one clock. */
function drawTower(
  frame: DisplayFrame<RingingState>,
  at: RingingLayout,
  set: RingingSettings,
  keys: readonly RingingKey[],
  clock: number | null,
): void {
  const { ctx, colours } = frame
  const { lanes } = at
  const { from, to } = ringingPage(set, clock ?? 0)
  const shown = ringingShown(keys)
  for (const [lane, key] of (clock === null ? keys : lanesOf(keys, shown)).entries()) {
    const y = lanes.y + 2 * lane + 1
    const { blows, fronts } = ringingBlows(set, key, from, to)
    const colour = key === shown ? colours.accent : colours.ink
    for (const blow of blows) {
      if (blow.time < from || blow.entry || blow.time > key.off) continue
      const back = (fronts.filter((each) => each.time <= blow.time).at(-1)?.front ?? 1) < 1
      const rung = clock === null || blow.time <= clock
      const alpha = (rung ? 1 : 0.5) * (back ? 0.5 : 1)
      const x = lanes.x + ((blow.time - from) / (to - from)) * (lanes.w - 2)
      fillRect(ctx, { x, y: y - 0.75, w: 2, h: 1.5 }, colour, alpha)
    }
  }
}

function draw(frame: DisplayFrame<RingingState>): void {
  const { ctx, colours, state } = frame
  ground(frame)
  const at = ringingLayout(frame)
  const set = ringingSettings((name) => frame.value(name))
  const clock = clockNow(frame, set)
  const keys = clock === null ? ringingGhosts() : keysOf(set, frame.notes, clock)
  text(frame, RINGING_METHODS[set.method], at.foot.x, at.head)
  text(frame, RINGING_TOWERS[set.tower], at.foot.x + at.foot.w, at.head, { align: 'right' })
  const [gap, overlap] = ringingHandles(frame)
  const wedge = ringingWedge(at.ropes)
  rule(ctx, at.ropes.x, at.strip, gap.x, at.strip, { colour: colours.ink, width: 1.4 })
  rule(ctx, at.ropes.x, at.strip - 3, at.ropes.x, at.strip + 3, { colour: colours.ink })
  // The wedge is a blow: how soon it comes in, then how far it reaches.
  const shape = ringingShape(set, { ringer: 0, gain: 1, back: false, entry: false, pace: 1 }, 1)
  const rise =
    wedge.x + (overlap.x - wedge.x) * clamp(shape.attack / (shape.attack + shape.length), 0, 0.8)
  const tip: Point[] = [
    [wedge.x, at.strip + 3],
    [rise, at.strip - 4],
    [overlap.x, at.strip + 3],
  ]
  fillTo(ctx, tip, at.strip + 3, colours.ink, INK.back)
  rule(ctx, wedge.x, at.strip + 3, wedge.x + wedge.w, at.strip + 3, {
    colour: colours.ink,
    alpha: INK.rule,
  })
  drawRopes(frame, at, set, keys, clock)
  drawCover(frame, at, set)
  drawTower(frame, at, set, keys, clock)
  handle(frame, gap.x, gap.y, { hot: frame.hot === 'gap', radius: 2.5 })
  handle(frame, overlap.x, overlap.y, { hot: frame.hot === 'overlap', radius: 2.5 })
  levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
}

export const RINGING_ORDER_FACES: Record<string, PlateFace> = {
  'ringing-order': {
    display: plateDisplay<RingingState>({
      place: 'window',
      columns: 2,
      params: RINGING_PARAMS,
      live: { signal: true, notes: true, fps: 30, settle: 12 },
      info: 'Four rows. Each rope is one overtone of the keys, as thick as it is loud, and the line goes from blow to blow of one key in the order they ring. Under the ropes are the covering tone and the blows of every key in the tower. Drag the points for Gap and Overlap.',
      init: () => ({ heard: [], shown: 0, clock: null }),
      draw,
      handles: ringingHandles,
    }),
    face: ['method', 'voice', 'row', 'series'],
    labels: { row: 'Row', cover: 'Cover' },
    sections: [
      ['ringers', 'method', 'row', 'gap', 'overlap', 'weight', 'swing'],
      ['voice', 'series', 'body', 'tilt', 'bite', 'beat', 'muffle'],
      ['tower', 'crossing', 'place'],
      ['cover', 'attack', 'release', 'volume'],
    ],
  },
}
