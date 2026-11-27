// How Night Drum's display is drawn: where its parts stand, the skin in its
// modes, the body under it with the second skin at its foot, and the ladder of
// overtones. What it draws is `night-drum.ts`' to say.

import { INK, clamp, clipped, fillTo, rule, trace, type Box, type Point } from '../display-kit'
import { type DisplayFrame, type DisplayView } from '../plate-display'
import {
  NIGHT_MODES,
  nightBody,
  nightBodyGain,
  nightHand,
  nightOther,
  nightShape,
  type NightMode,
  type NightRead,
} from './night-drum-law'

type Paint = Pick<DisplayFrame, 'ctx' | 'colours' | 'width' | 'height'>

/** How many swings a second the note itself is slowed to; the highest mode swings under three. */
const SLOW_HZ = 0.3
/** The ladder: octaves over the key, and dB under its loudest bar. */
const OCTAVE_LOW = -1.15
const OCTAVE_HIGH = 3.3
const BAR_DB = 36
/** The line across the skin that the hand and the load stand on, off level so that it is seen. */
export const NIGHT_AXIS = -0.06 * 2 * Math.PI
/** How flat the skin lies, and its rows: the lines are every fourth. */
const FLAT = 0.44
const ROWS = 36

/** How deep each body is against the room there is, and how wide it is on the way down. */
const PROFILES: readonly { depth: number; at: (t: number) => number }[] = [
  { depth: 0.28, at: () => 1 },
  {
    depth: 1,
    at: (t) =>
      0.8 +
      0.2 * Math.cos(Math.PI * Math.min(1, 6 * t)) +
      0.22 * Math.sin(Math.PI * t) -
      0.1 * t * t,
  },
  { depth: 0.86, at: (t) => Math.sqrt(1 - 0.86 * t * t) },
  { depth: 1.2, at: (t) => 1 - 0.5 * Math.sin(Math.PI * 0.62 * t) },
  { depth: 0.28, at: () => 1 },
]

/** Where the skin, the ladder and the foot stand. */
export function nightLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const wide = Math.round((width - 8) * 0.31)
  const ladder: Box = { x: width - 5 - wide, y: 17, w: wide, h: height - 29 }
  const left: Box = { x: 5, y: 17, w: ladder.x - 14, h: height - 29 }
  const rx = Math.min(left.w / 2, left.h * 0.62)
  const ry = rx * FLAT
  const tall = rx * 0.34
  return {
    ladder,
    left,
    skin: { x: left.x + left.w / 2, y: left.y + tall * 0.4 + ry - 1, rx, ry },
    tall,
    foot: { x: 4, y: height - 8, w: width - 8, h: 4 },
  }
}

/** Where a ratio to the key stands on the ladder. */
export function nightY(ratio: number, { y, h }: Box): number {
  const up = Math.log2(Math.max(ratio, 1e-3))
  return y + h - ((up - OCTAVE_LOW) / (OCTAVE_HIGH - OCTAVE_LOW)) * h
}

/** How long the bar of a level is. */
export function nightBar(level: number, { w }: Box): number {
  return clamp(1 + (20 * Math.log10(Math.abs(level) + 1e-9)) / BAR_DB, 0, 1) * w
}

/** The middle of the load on the axis of the hand, and its radius, in radii of the skin. */
export const nightLoadAt = (read: NightRead): readonly [number, number] => [
  -0.28 * read('offCentre'),
  0.5 * read('load'),
]

/** A place on the skin at rest, `along` the axis of the hand and `across` it, in radii. */
export function nightOnSkin(
  view: Pick<DisplayView, 'width' | 'height'>,
  along: number,
  across = 0,
): Point {
  const { skin } = nightLayout(view)
  const [cos, sin] = [Math.cos(NIGHT_AXIS), Math.sin(NIGHT_AXIS)]
  return [
    skin.x + (along * cos - across * sin) * skin.rx,
    skin.y - (along * sin + across * cos) * skin.ry,
  ]
}

/** How high the skin stands at a place in radii (x to the right, y away), at most 1 either way. */
export type NightRelief = (x: number, y: number) => number

/**
 * The skin as its modes stand at `time`, each as large as `sizes` has it.
 * `angle` is where the hand came down, in turns: the hand lies on the axis.
 */
export function nightRelief(
  sizes: readonly number[],
  modes: readonly NightMode[],
  angle: number,
  time: number,
): NightRelief {
  const live = NIGHT_MODES.map(([m, , , , , , side], k) => ({
    k,
    m,
    side,
    size: sizes[k] * Math.cos(2 * Math.PI * SLOW_HZ * modes[k].ratio * time),
    most: Math.abs(sizes[k]),
  })).filter(({ most }) => most > 0.004)
  return (x, y) => {
    const radius = Math.hypot(x, y)
    const turn = Math.atan2(y, x) - NIGHT_AXIS + 2 * Math.PI * angle
    let z = 0
    for (const { k, m, side, size } of live)
      z += size * nightShape(k, radius) * (side ? Math.sin(m * turn) : Math.cos(m * turn))
    return clamp(z, -1, 1)
  }
}

/** The ellipse of a level of the drum, from one turn to another. */
export function nightArc(x: number, y: number, rx: number, ry: number, from = 0, to = 1): Point[] {
  return Array.from({ length: 33 }, (_, i): Point => {
    const turn = 2 * Math.PI * (from + ((to - from) * i) / 32)
    return [x + rx * Math.cos(turn), y + ry * Math.sin(turn)]
  })
}

/** A shape filled as it stands. */
function fill({ ctx }: Paint, points: readonly Point[], colour: string, alpha: number): void {
  if (alpha <= 0) return
  fillTo(ctx, points, points[0][1], colour, alpha)
}

/** The body, lit inside by the level, and the second skin at its foot. */
export function drawNightBody(frame: Paint, read: NightRead, level: number): void {
  const { ctx, colours } = frame
  const { skin, left } = nightLayout(frame)
  const profile = PROFILES[clamp(Math.round(read('cavity')), 0, 4)]
  const size = Math.pow(2, -read('cavityTune') / 54)
  const footR = profile.at(1) * skin.rx
  const most = left.y + left.h - skin.y - footR * FLAT
  const deep = most * Math.min(1, (profile.depth * size) / 1.26)
  const wall = (side: number): Point[] =>
    Array.from({ length: 21 }, (_, i): Point => [
      skin.x + side * profile.at(i / 20) * skin.rx,
      skin.y + (deep * i) / 20,
    ])
  const foot = nightArc(skin.x, skin.y + deep, footR, footR * FLAT, 0, 0.5)
  if (nightBody(read).name !== 'None') {
    const outline = [...wall(1), ...foot, ...wall(-1).reverse()]
    fill(frame, outline, colours.ink, INK.fill)
    fill(frame, outline, colours.accent, 0.55 * Math.sqrt(clamp(level, 0, 1)))
    for (const line of [wall(1), wall(-1), foot])
      trace(ctx, line, { colour: colours.ink, width: 1.25, alpha: INK.text })
  }
  const other = read('otherSkin')
  if (other > 0.01)
    fill(
      frame,
      nightArc(skin.x, skin.y + deep, footR * 0.92, footR * 0.92 * FLAT),
      colours.ink,
      0.12 + 0.6 * other,
    )
}

/** The pale skin with its dark centre, and the thread across it. */
export function drawNightSkin(
  frame: Paint,
  read: NightRead,
  relief: NightRelief,
  level: number,
): void {
  const { ctx, colours } = frame
  const { skin, tall } = nightLayout(frame)
  const up = (x: number, y: number): Point => [
    skin.x + x * skin.rx,
    skin.y - y * skin.ry - tall * relief(x, y),
  ]
  fill(frame, nightArc(skin.x, skin.y, skin.rx, skin.ry), colours.ink, 1)
  const lines: Point[][] = []
  for (let row = 1; row < ROWS; row += 1) {
    const y = 1 - (2 * row) / ROWS
    const half = Math.sqrt(1 - y * y)
    const points = Array.from({ length: 27 }, (_, i) => up(half * (-1 + i / 13), y))
    // The skin between two rows: what stands up is seen over what lies behind it.
    trace(ctx, points, { colour: colours.ink, width: (2.6 * skin.ry) / ROWS + 0.6 })
    if (row % 4 === 2) lines.push(points)
  }
  const [middle, radius] = nightLoadAt(read)
  if (radius > 0.01) {
    const [cos, sin] = [Math.cos(NIGHT_AXIS), Math.sin(NIGHT_AXIS)]
    const load = Array.from({ length: 33 }, (_, i): Point => {
      const turn = (2 * Math.PI * i) / 32
      const x = middle * cos + radius * Math.cos(turn)
      return up(x, middle * sin + radius * Math.sin(turn))
    })
    fill(frame, load, colours.plate, 1)
    ctx.save()
    ctx.beginPath()
    for (const [x, y] of load) ctx.lineTo(x, y)
    ctx.closePath()
    ctx.clip()
    for (const line of lines) trace(ctx, line, { colour: colours.ink, width: 0.8, alpha: INK.rule })
    ctx.restore()
  }
  for (const line of lines) trace(ctx, line, { colour: colours.plate, width: 0.9, alpha: 0.5 })
  trace(ctx, nightArc(skin.x, skin.y, skin.rx, skin.ry), { colour: colours.ink, width: 1.25 })
  const thread = read('thread')
  if (thread > 0.01) {
    const shake = 0.6 + thread * (0.6 + 2.6 * clamp(level, 0, 1))
    const line = Array.from({ length: 41 }, (_, i): Point => {
      const x = -0.88 + (1.76 * i) / 40
      return [
        skin.x + x * skin.rx,
        skin.y + 0.46 * skin.ry + (i % 2 ? shake : -shake) * (1 - x * x),
      ]
    })
    trace(ctx, line, { colour: colours.accent, width: 1.1 })
  }
}

export interface NightSounding {
  hz: number
  modes: readonly NightMode[]
  /** The level of each bar as it rings now, on the scale of the bars; empty at rest. */
  lit: readonly number[]
  /** The ratio the tension has moved the whole skin by. */
  bent: number
}

/** The overtones against the harmonics, through the body. */
export function drawNightLadder(frame: Paint, read: NightRead, now: NightSounding): void {
  const { ctx, colours } = frame
  const { ladder } = nightLayout(frame)
  const right = ladder.x + ladder.w
  for (let n = 1; n <= 8; n += 1) {
    const y = nightY(n, ladder)
    rule(ctx, ladder.x, y, right, y, { colour: colours.ink, alpha: n === 1 ? INK.back : INK.grid })
  }
  // The body: a curve over the scale of pitch, read across.
  const curve = Array.from({ length: 41 }, (_, i) => {
    const ratio = Math.pow(2, OCTAVE_LOW + ((OCTAVE_HIGH - OCTAVE_LOW) * i) / 40)
    return { y: nightY(ratio, ladder), gain: nightBodyGain(read, now.hz * ratio) }
  })
  const most = Math.max(1e-9, ...curve.map(({ gain }) => gain))
  const across = curve.map(({ y, gain }): Point => [ladder.x + nightBar(gain / most, ladder), y])
  fill(
    frame,
    [[ladder.x, ladder.y + ladder.h], ...across, [ladder.x, ladder.y]],
    colours.ink,
    INK.fill,
  )
  clipped(ctx, { ...ladder, x: ladder.x - 4, w: ladder.w + 5 }, () => {
    const bar = (y: number, long: number, colour: string, width: number, alpha = 1): void =>
      trace(
        ctx,
        [
          [ladder.x, y],
          [ladder.x + long, y],
        ],
        { colour, width, alpha },
      )
    now.modes.forEach(({ ratio, level, ring }, k) => {
      const y = nightY(ratio, ladder)
      const long = nightBar(level, ladder)
      if (long <= 0) return
      const live = now.lit.length > 0
      bar(y, long, colours.ink, 1, live ? INK.text : 1)
      const later = ladder.x + nightBar(level * Math.pow(10, -3 / ring), ladder)
      rule(ctx, later, y - 1.5, later, y + 1.5, { colour: colours.ink, alpha: INK.text })
      const lit = live ? nightBar(now.lit[k], ladder) : 0
      if (lit > 0) bar(nightY(ratio * now.bent, ladder), lit, colours.accent, 2)
    })
    nightOther(read).forEach((ratio, j) => {
      const long = ladder.w * 0.24 * read('otherSkin') * [1, 0.65, 0.42, 0.28][j]
      const y = nightY(ratio, ladder)
      const marks: Point[] = [
        [right - long, y],
        [right, y],
      ]
      if (long > 0.3) trace(ctx, marks, { colour: colours.ink, width: 2 })
    })
    const bend = read('bend') * nightHand(read).bend
    const to = nightY(Math.pow(2, bend / 12), ladder)
    rule(ctx, ladder.x - 2, nightY(1, ladder), ladder.x - 2, to, {
      colour: colours.ink,
      alpha: INK.text,
    })
  })
}
