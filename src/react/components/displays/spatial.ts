// Displays of the devices that place a sound: its width, its balance and its level.
//
// All three stand on one view, the stereo field as the listener has it: a half
// disc where straight up is the middle, the two diagonals are the left and the
// right side alone, and flat along the foot is one side against the other. The
// sound is a cloud of points on it, one for each pair of samples; under it a
// scale says how alike the two sides are, and two bars their levels. What the
// knobs are set to is drawn on the same field in the ink, from each device's
// own formula, so the plate explains itself with no sound at all.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  follow,
  gainToDb,
  ground,
  handle,
  rule,
  text,
  trace,
  type Box,
  type Point,
  type StrokeStyle,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

const EIGHTH = Math.PI / 4
const HALF = Math.SQRT1_2

// --- The field --------------------------------------------------------------

/** Points the cloud keeps: two frames of the sound, so it holds its shape between them. */
const CLOUD = 320
const CLOUD_PER_FRAME = CLOUD / 2
/** The foot of the level bars, dB. */
const BARS_FOOT_DB = -48

export interface Field {
  /** The listener: the middle of the disc's foot. */
  cx: number
  cy: number
  /** The disc's radius. */
  r: number
  /** The scale of how alike the two sides are, under the disc. */
  alike: Box
  /** The left and the right side's level. */
  bars: readonly [Box, Box]
  /** The bars stand at the right of the disc; else they lie under it. */
  upright: boolean
}

/**
 * Where the disc, the scale and the bars stand: the bars at the right where
 * the display is wide, under the scale where it is not, whichever leaves the
 * disc larger.
 */
export function fieldOf(view: Pick<DisplayView, 'width' | 'height'>): Field {
  const w = view.width - 8
  const h = view.height - 8
  const beside = Math.min((w - 17) / 2, h - 14)
  const under = Math.min(w / 2, h - 27)
  const upright = beside >= under
  const r = Math.max(6, Math.floor(upright ? beside : under))
  if (upright) {
    const top = 4 + Math.max(0, (h - (r + 14)) / 2)
    const cx = 4 + (w - 17) / 2
    const bar = (n: number): Box => ({ x: 4 + w - 12 + n * 7, y: top, w: 5, h: r + 14 })
    return {
      cx,
      cy: top + r,
      r,
      alike: { x: cx - r, y: top + r + 5, w: 2 * r, h: 9 },
      bars: [bar(0), bar(1)],
      upright,
    }
  }
  const top = 4 + Math.max(0, (h - (r + 27)) / 2)
  const cx = 4 + w / 2
  const bar = (n: number): Box => ({ x: cx - r, y: top + r + 18 + n * 5, w: 2 * r, h: 4 })
  return {
    cx,
    cy: top + r,
    r,
    alike: { x: cx - r, y: top + r + 5, w: 2 * r, h: 9 },
    bars: [bar(0), bar(1)],
    upright,
  }
}

/** A place on the field: `across` and `up` in radii from the listener. */
const place = (field: Field, across: number, up: number, scale = field.r): Point => [
  field.cx + across * scale,
  field.cy - up * scale,
]

/** A place at an angle off straight up (radians, right is positive), so far from the listener in pixels. */
const ray = (field: Field, angle: number, length: number): Point =>
  place(field, Math.sin(angle), Math.cos(angle), length)

/** The box the half disc stands in: what is set is drawn inside it. */
const discBox = (field: Field): Box => ({
  x: field.cx - field.r - 1,
  y: field.cy - field.r - 1,
  w: 2 * field.r + 2,
  h: field.r + 2,
})

/** An arc of the disc about the listener, from one angle off straight up to another (radians, right is positive). */
function arc(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  field: Field,
  radius: number,
  from: number,
  to: number,
  alpha: number,
  dash?: readonly [number, number],
): void {
  if (radius <= 0) return
  const { ctx } = frame
  ctx.beginPath()
  ctx.arc(field.cx, field.cy, radius, from - Math.PI / 2, to - Math.PI / 2)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = frame.colours.ink
  ctx.lineWidth = 1
  ctx.setLineDash(dash ? [...dash] : [])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/** A shape filled in the ink and, given a line, drawn round with it. */
function shape(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  points: readonly Point[],
  alpha: number,
  line?: StrokeStyle,
): void {
  if (points.length < 3) return
  const { ctx } = frame
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = frame.colours.ink
  ctx.fill()
  if (line) {
    ctx.globalAlpha = line.alpha ?? 1
    ctx.strokeStyle = line.colour
    ctx.lineWidth = line.width ?? 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** The empty field: the foot, the rim, the middle and the two sides. */
function drawField(frame: DisplayFrame, field: Field): void {
  const { ctx, colours } = frame
  const { cx, cy, r } = field
  rule(ctx, cx - r, cy, cx + r, cy, { colour: colours.ink, alpha: INK.rule })
  arc(frame, field, r, -Math.PI / 2, Math.PI / 2, INK.rule)
  rule(ctx, cx, cy, cx, cy - r, { colour: colours.ink, alpha: INK.grid })
  for (const side of [-1, 1]) {
    const [x, y] = place(field, side * HALF, HALF)
    trace(
      ctx,
      [
        [cx, cy],
        [x, y],
      ],
      { colour: colours.ink, alpha: INK.grid, width: 1 },
    )
    if (r >= 30) {
      // The letter stands inside the rim, under the end of its line.
      const [tx, ty] = ray(field, side * (EIGHTH + 0.2), r - 8)
      text(frame, side < 0 ? 'L' : 'R', tx, ty + 3, { align: 'center', alpha: INK.back })
    }
  }
}

interface Scope {
  /** The cloud: each point across and up in radii, the newest written over the oldest. */
  across: Float32Array
  up: Float32Array
  head: number
  count: number
  /** How alike the two sides are, −1..1, and whether there is sound to say it of. */
  alike: number
  heard: boolean
  /** The two sides' levels, dB. */
  left: number
  right: number
  /** The shapes of what is set, and what they were made from: made again only when that moves. */
  made: string
  shapes: Point[][]
}

const scope = (): Scope => ({
  across: new Float32Array(CLOUD),
  up: new Float32Array(CLOUD),
  head: 0,
  count: 0,
  alike: 0,
  heard: false,
  left: BARS_FOOT_DB,
  right: BARS_FOOT_DB,
  made: '',
  shapes: [],
})

/** The shapes of what is set, kept from frame to frame while `made` stays the same. */
function shapesOf(state: Scope, made: string, make: () => Point[][]): Point[][] {
  if (state.made !== made) {
    state.shapes = make()
    state.made = made
  }
  return state.shapes
}

/**
 * How far from the listener a pair of samples of that size stands, 0..1: the
 * cube root, so a quiet sound is still a shape and a loud one stays on the
 * disc. Both sides at full scale reach the rim.
 */
const reach = (size: number): number => (size >= 1 ? 1 : Math.cbrt(size))

/**
 * Where a pair of samples stands: half their sum is up, half their difference
 * is across, and a pair under the foot is its own opposite above it (the line
 * through the listener is the same line).
 */
function pairAt(left: number, right: number, out: { across: number; up: number }): void {
  let across = (right - left) / 2
  let up = (left + right) / 2
  if (up < 0) {
    across = -across
    up = -up
  }
  const size = Math.sqrt(across * across + up * up)
  const scale = size > 1e-9 ? reach(size) / size : 0
  out.across = across * scale
  out.up = up * scale
}

const pair = { across: 0, up: 0 }

/** Take this frame's sound into the scope: the cloud, how alike the sides are, and their levels. */
function listen(frame: DisplayFrame, state: Scope): void {
  const left = frame.signal?.left
  const right = frame.signal?.right
  if (!left || !right) {
    state.count = 0
    state.heard = false
    state.left = BARS_FOOT_DB
    state.right = BARS_FOOT_DB
    return
  }
  const a = left.wave
  const b = right.wave
  const length = Math.min(a.length, b.length)
  const step = Math.max(1, Math.floor(length / CLOUD_PER_FRAME))
  let ll = 0
  let rr = 0
  let lr = 0
  for (let i = 0; i < length; i++) {
    const l = a[i]
    const r = b[i]
    ll += l * l
    rr += r * r
    lr += l * r
    if (i % step === 0 && Number.isFinite(l) && Number.isFinite(r)) {
      pairAt(l, r, pair)
      state.across[state.head] = pair.across
      state.up[state.head] = pair.up
      state.head = (state.head + 1) % CLOUD
      if (state.count < CLOUD) state.count++
    }
  }
  // The correlation of the two sides over the window; of silence nothing is said.
  const power = ll * rr
  state.heard = Number.isFinite(power) && power > 1e-14
  if (state.heard) {
    const alike = clamp(lr / Math.sqrt(power), -1, 1)
    state.alike = frame.dt > 0 ? follow(state.alike, alike, frame.dt, 0.12, 0.12) : alike
  }
  // The levels jump up and sink back, as a meter does.
  state.left = follow(state.left, Math.max(BARS_FOOT_DB, gainToDb(left.peak)), frame.dt, 0, 0.3)
  state.right = follow(state.right, Math.max(BARS_FOOT_DB, gainToDb(right.peak)), frame.dt, 0, 0.3)
}

/** The cloud, in the accent: it is the sound now. One path for all of it. */
function drawCloud(frame: DisplayFrame, field: Field, state: Scope): void {
  if (state.count === 0) return
  const { ctx } = frame
  ctx.beginPath()
  for (let i = 0; i < state.count; i++) {
    ctx.rect(
      field.cx + state.across[i] * field.r - 0.6,
      field.cy - state.up[i] * field.r - 0.6,
      1.2,
      1.2,
    )
  }
  ctx.globalAlpha = 0.9
  ctx.fillStyle = frame.colours.accent
  ctx.fill()
  ctx.globalAlpha = 1
}

/** How alike the two sides are: a scale from −1 (one against the other) to +1 (the same), and a mark. */
function drawAlike(frame: DisplayFrame, field: Field, state: Scope): void {
  const { ctx, colours } = frame
  const box = field.alike
  const words = box.w >= 60
  const from = box.x + (words ? 16 : 2)
  const to = box.x + box.w - (words ? 16 : 2)
  const y = box.y + box.h / 2
  rule(ctx, from, y, to, y, { colour: colours.ink, alpha: INK.rule })
  for (const at of [0, 0.5, 1]) {
    const x = from + at * (to - from)
    rule(ctx, x, y - (at === 0.5 ? 3 : 2), x, y + (at === 0.5 ? 3 : 2), {
      colour: colours.ink,
      alpha: INK.back,
    })
  }
  if (words) {
    text(frame, '−1', box.x, y + 3, { alpha: INK.back })
    text(frame, '+1', box.x + box.w, y + 3, { align: 'right', alpha: INK.back })
  }
  if (frame.signal && state.heard) {
    dot(ctx, from + ((state.alike + 1) / 2) * (to - from), y, 2.5, colours.accent, {
      ring: colours.ink,
    })
  }
}

/** Where a level stands along a bar. */
const along = (db: number, topDb: number): number =>
  clamp((db - BARS_FOOT_DB) / (topDb - BARS_FOOT_DB), 0, 1)

/** The two sides' levels as bars in dB, the left one first; a notch at full scale where the bars go past it. */
function drawBars(frame: DisplayFrame, field: Field, state: Scope, topDb = 0): void {
  const { ctx, colours } = frame
  field.bars.forEach((bar, n) => {
    fillRect(ctx, bar, colours.ink, INK.grid)
    const level = along(n === 0 ? state.left : state.right, topDb)
    if (frame.signal && level > 0) {
      fillRect(
        ctx,
        field.upright
          ? { ...bar, y: bar.y + bar.h * (1 - level), h: bar.h * level }
          : { ...bar, w: bar.w * level },
        colours.ink,
        0.75,
      )
    }
  })
  if (topDb > 0) barMark(frame, field, 0, topDb, INK.back, 0)
}

/** A line across both bars at a level, standing `past` pixels proud of them. */
function barMark(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  field: Field,
  db: number,
  topDb: number,
  alpha: number,
  past: number,
  width = 1,
): void {
  const { ctx, colours } = frame
  const [first, second] = field.bars
  const at = along(db, topDb)
  if (field.upright) {
    const y = first.y + first.h * (1 - at)
    rule(ctx, first.x - past, y, second.x + second.w + past, y, {
      colour: colours.ink,
      alpha,
      width,
    })
    return
  }
  const x = first.x + first.w * at
  rule(ctx, x, first.y - past, x, second.y + second.h + past, {
    colour: colours.ink,
    alpha,
    width,
  })
}

// --- Stereo Widener ---------------------------------------------------------

/** What the Stereo Widener's width sets, as `StereoWidener::updateParameters` and `process` have it. */
export interface Widening {
  /** The gain on the difference of the two sides above the bass: 0 mono, 1 as it came, 2.5 at the top. */
  side: number
  /** The gain on their sum, turned down as the sides come up. */
  mid: number
  /** How much of the difference the bass under 200 Hz keeps. */
  bass: number
  /** How much of each side is its copy through the allpasses (from three quarters up). */
  blur: number
  /** How much of the right side is its copy 0.8 ms late (from 0.85 up). */
  late: number
}

export function widening(width: number): Widening {
  const w = clamp(width, 0, 1)
  const side = w <= 0.5 ? w * 2 : 1 + (w - 0.5) * 2 * 1.5
  return {
    side,
    mid: 1 / Math.sqrt(0.5 * (1 + side * side)),
    bass: Math.max(0.3, 1 - w * 0.7),
    blur: w <= 0.75 ? 0 : (w - 0.75) * 4,
    late: w <= 0.85 ? 0 : (w - 0.85) / 0.15,
  }
}

/** The width that gives that gain on the difference: the way back through `widening`. */
const widthOfSide = (side: number): number => {
  const s = clamp(side, 0, 2.5)
  return s <= 1 ? s / 2 : 0.5 + (s - 1) / 3
}

/** The widest the fan gets, in fan radii: the corner at full width, and a little room for the handle. */
const WIDENER_SPAN = 2.5 * HALF + 0.1
/** The bass is drawn at this much of the fan's size, so it stands inside it. */
const WIDENER_BASS = 0.55

/** The radius of the field as it came, in pixels: the fan at Width one half. */
const widenerUnit = (field: Field): number => field.r / WIDENER_SPAN

/**
 * A fan: what becomes of the field as it came (every place from the left
 * side to the right at one level) when its difference is multiplied by
 * `side` and its sum by `mid`. From the listener up one edge, along the arc
 * and back down the other.
 */
function fan(field: Field, side: number, mid: number, unit: number): Point[] {
  const points: Point[] = [[field.cx, field.cy]]
  for (let n = -12; n <= 12; n++) {
    const angle = (n / 12) * EIGHTH
    points.push(place(field, side * Math.sin(angle), mid * Math.cos(angle), unit))
  }
  return points
}

/** Where the fan's right corner stands: the right side alone, after the widening. */
function widenerCorner(field: Field, width: number): Point {
  const { side, mid } = widening(width)
  return place(field, side * HALF, mid * HALF, widenerUnit(field))
}

function widenerHandles(view: DisplayView): DisplayHandle[] {
  const field = fieldOf(view)
  const [x, y] = widenerCorner(field, view.value('width'))
  return [
    {
      key: 'width',
      name: 'Width',
      x,
      y,
      // The corner moves out as the sides come up, evenly in each half of the
      // knob's travel: how far across it is taken says the width.
      drag: (toX) => ({
        width: widthOfSide((toX - field.cx) / (widenerUnit(field) * HALF)),
      }),
      reset: () => ({ width: view.spec('width')?.default ?? 0.5 }),
    },
  ]
}

const stereoWidener = plateDisplay<Scope>({
  place: 'window',
  columns: 1,
  params: ['width'],
  live: { stereo: true },
  info: 'The stereo field from where you sit: up is the middle, the diagonals are left and right, and the cloud is the sound. The fan is what Width makes of it, and the small fan what is left of the bass. Past the two marks on its path the sides are blurred apart, then the right comes late.',
  init: scope,
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const field = fieldOf(frame)
    const unit = widenerUnit(field)
    const width = frame.value('width')
    const set = widening(width)
    listen(frame, state)
    drawField(frame, field)
    // The field as it came: where the fan stands at one half.
    arc(frame, field, unit, -EIGHTH, EIGHTH, INK.back, [2, 2])

    const [path, beyond, bass, points, top, roundLeft, roundRight] = shapesOf(
      state,
      `${frame.width} ${frame.height} ${width}`,
      () => {
        // The path the corner takes from mono to the widest: plain up to
        // three quarters, where the allpasses come in, and dotted beyond.
        const path: Point[] = []
        const beyond: Point[] = []
        for (let n = 0; n <= 40; n++) {
          const point = widenerCorner(field, n / 40)
          if (n <= 30) path.push(point)
          if (n >= 30) beyond.push(point)
        }
        // The arc of the fan run on round to the foot, each way.
        const round = (sign: number): Point[] => {
          const points: Point[] = []
          for (let n = 12; n <= 24; n++) {
            const angle = (n / 12) * EIGHTH
            points.push(
              place(field, sign * set.side * Math.sin(angle), set.mid * Math.cos(angle), unit),
            )
          }
          return points
        }
        const points = fan(field, set.side, set.mid, unit)
        return [
          path,
          beyond,
          fan(field, set.bass, 1, unit * WIDENER_BASS),
          points,
          points.slice(1),
          round(-1),
          round(1),
        ]
      },
    )
    // Up to the first mark the fan is a plain balance of sum and difference;
    // the second is where the late copy comes in.
    trace(ctx, path, { colour: colours.ink, alpha: INK.back, width: 1 })
    trace(ctx, beyond, { colour: colours.ink, alpha: INK.back, width: 1, dash: [1, 3] })
    for (const at of [0.75, 0.85]) {
      const [x, y] = widenerCorner(field, at)
      rule(ctx, x, y - 3, x, y + 3, { colour: colours.ink, alpha: INK.text })
    }

    // The bass under 200 Hz: its sum as it came, its difference narrowed as Width rises.
    shape(frame, bass, INK.fill, { colour: colours.ink, alpha: INK.back, width: 1 })

    // The fan. Its edges are sharp while it is a plain balance; as the
    // allpasses come in they fade, and the arc runs on round to the foot.
    shape(frame, points, INK.fill)
    trace(ctx, top, { colour: colours.ink })
    const edge = { colour: colours.ink, alpha: 1 - 0.75 * set.blur, width: 1.5 }
    const [from, to] = [top[0], top[top.length - 1]]
    rule(ctx, field.cx, field.cy, from[0], from[1], edge)
    rule(ctx, field.cx, field.cy, to[0], to[1], edge)
    if (set.blur > 0) {
      clipped(ctx, discBox(field), () => {
        for (const round of [roundLeft, roundRight]) {
          trace(ctx, round, {
            colour: colours.ink,
            alpha: 0.25 + 0.75 * set.blur,
            width: 1.5,
            dash: [1, 3],
          })
        }
      })
    }

    drawCloud(frame, field, state)
    drawAlike(frame, field, state)
    drawBars(frame, field, state)
    for (const point of widenerHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }

    // In words, in the corners the disc leaves free: how wide, and what is added past the marks.
    if (field.r >= 40) {
      const left = field.cx - field.r
      const right = field.cx + field.r
      const top = field.cy - field.r + 7
      const wide =
        width < 0.005
          ? 'MONO'
          : width < 0.495
            ? 'NARROW'
            : width <= 0.505
              ? 'NORMAL'
              : width <= 0.75
                ? 'WIDE'
                : 'EXTRA'
      text(frame, wide, left, top)
      if (set.blur > 0) text(frame, 'BLUR', right, top, { align: 'right' })
      if (set.late > 0) text(frame, 'LATE', right, top + 9, { align: 'right' })
    }
  },
  handles: widenerHandles,
})

// --- Utility ----------------------------------------------------------------

/**
 * What `Utility.ts` does to a pair of sides after the polarity: Width fades
 * each side against half the sum of the two, then the panner leans the pair
 * by the Web Audio law for a sound with two sides (towards the right, the
 * left side is turned down and handed over to the right; and the other way).
 * A sound that reaches the device on one channel is panned by the other law
 * of that node, 3 dB down on each side in the middle; the plate is not told
 * which it has, and the cloud and the bars show what came of it either way.
 */
export function utilityPair(
  left: number,
  right: number,
  width: number,
  pan: number,
): [number, number] {
  const mono = (left + right) / 2
  const l = width * left + (1 - width) * mono
  const r = width * right + (1 - width) * mono
  if (pan <= 0) {
    const turn = ((pan + 1) * Math.PI) / 2
    return [l + r * Math.cos(turn), r * Math.sin(turn)]
  }
  const turn = (pan * Math.PI) / 2
  return [l * Math.cos(turn), r + l * Math.sin(turn)]
}

/** The furthest the utility's fan reaches, in fan radii: the middle panned hard to one side is √2. */
const UTILITY_SPAN = 1.5
/** The bars of the utility run up to the top of its gain. */
const UTILITY_TOP_DB = 12

const utilityUnit = (field: Field): number => field.r / UTILITY_SPAN

/** Where a pair of sides stands on the field after the utility, the field as it came being one fan radius. */
function utilityAt(field: Field, left: number, right: number, width: number, pan: number): Point {
  const [l, r] = utilityPair(left, right, width, pan)
  return place(field, (r - l) * HALF, (l + r) * HALF, utilityUnit(field))
}

/** The angle off straight up of the right side alone, after the utility. */
function utilityEdge(width: number, pan: number): number {
  const [l, r] = utilityPair(0, 1, width, pan)
  return Math.atan2(r - l, r + l)
}

/** The angle off straight up of a place on the display; under the foot it is flat to its side. */
const angleOf = (field: Field, x: number, y: number): number =>
  Math.atan2(x - field.cx, Math.max(1e-6, field.cy - y))

function utilityHandles(view: DisplayView): DisplayHandle[] {
  const field = fieldOf(view)
  const width = view.value('width')
  const pan = view.value('pan')
  const [panX, panY] = ray(field, pan * EIGHTH, field.r)
  const [widthX, widthY] = utilityAt(field, 0, 1, width, pan)
  return [
    {
      key: 'pan',
      name: 'Pan',
      x: panX,
      y: panY,
      // The middle leans an eighth of a turn for the whole of Pan, evenly.
      drag: (x, y) => ({ pan: clamp(angleOf(field, x, y) / EIGHTH, -1, 1) }),
      reset: () => ({ pan: view.spec('pan')?.default ?? 0 }),
    },
    {
      key: 'width',
      name: 'Width',
      x: widthX,
      y: widthY,
      // The fan's right edge: the width that puts it where it is taken, found
      // by halving, as the edge only ever moves out as the width rises. Panned
      // hard to a side the edge does not move at all, and the width stays.
      drag: (x, y) => {
        const narrow = utilityEdge(0, pan)
        const wide = utilityEdge(1, pan)
        if (wide - narrow < 1e-3) return { width }
        const angle = clamp(angleOf(field, x, y), narrow, wide)
        let low = 0
        let high = 1
        for (let n = 0; n < 16; n++) {
          const middle = (low + high) / 2
          if (utilityEdge(middle, pan) < angle) low = middle
          else high = middle
        }
        return { width: (low + high) / 2 }
      },
      reset: () => ({ width: view.spec('width')?.default ?? 1 }),
    },
  ]
}

const utility = plateDisplay<Scope>({
  place: 'window',
  columns: 2,
  params: ['gainDb', 'pan', 'width', 'polarity'],
  live: { stereo: true },
  info: 'The stereo field from where you sit: up is the middle, the diagonals are left and right, and the cloud is the sound. The fan is the field after Width, leaning with Pan: take its edge or the point on the rim. The bars are the two sides in dB and the line across them is Gain.',
  init: scope,
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const field = fieldOf(frame)
    const width = frame.value('width')
    const pan = frame.value('pan')
    listen(frame, state)
    drawField(frame, field)
    // The field as it came.
    arc(frame, field, utilityUnit(field), -EIGHTH, EIGHTH, INK.back, [2, 2])

    // The fan: every place from the left side to the right, after Width and Pan.
    const [points] = shapesOf(state, `${frame.width} ${frame.height} ${width} ${pan}`, () => {
      const points: Point[] = [[field.cx, field.cy]]
      for (let n = 0; n <= 24; n++) {
        const turn = (n / 24) * (Math.PI / 2)
        points.push(utilityAt(field, Math.cos(turn), Math.sin(turn), width, pan))
      }
      return [points]
    })
    shape(frame, points, INK.fill, { colour: colours.ink })
    // The lean: where the middle goes.
    const [panX, panY] = ray(field, pan * EIGHTH, field.r)
    trace(
      ctx,
      [
        [field.cx, field.cy],
        [panX, panY],
      ],
      { colour: colours.ink, width: 1, alpha: INK.text },
    )

    drawCloud(frame, field, state)
    drawAlike(frame, field, state)
    drawBars(frame, field, state, UTILITY_TOP_DB)
    // Gain, as a fader beside its meter: at its lowest the channel is silent.
    barMark(frame, field, frame.value('gainDb'), UTILITY_TOP_DB, 1, 2, 2)
    for (const point of utilityHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }

    if (field.r >= 40) {
      const top = field.cy - field.r + 7
      const flipped = Math.round(frame.value('polarity')) === 1
      const narrow = width < 0.005 ? 'MONO' : ''
      text(frame, `${flipped ? 'Ø ' : ''}${narrow}`, field.cx - field.r, top)
      const amount = Math.round(Math.abs(pan) * 100)
      text(frame, amount === 0 ? 'C' : `${amount}${pan < 0 ? 'L' : 'R'}`, field.cx + field.r, top, {
        align: 'right',
      })
    }
  },
  handles: utilityHandles,
})

// --- Stereo Detune ----------------------------------------------------------

/** The right copy's delay as a multiple of the left's (`kRightDelayRatio`). */
const DETUNE_RIGHT_RATIO = 1.4
/**
 * How far either side of its delay a copy's read head travels, ms: a splice
 * aims this far behind it (`kLandMs`) and is made this far ahead (`kSoftMs`).
 * It lands where the waveform fits, so the head is not held to the rail.
 */
const DETUNE_TRAVEL_MS = 7.5
/** What Drift at full adds to a copy's delay either way, ms (`kDriftDelayMs`). */
const DETUNE_DRIFT_MS = 1.5
/** The delay at the rim, ms: past the latest a copy's head can be. */
const DETUNE_RIM_MS = 120

/**
 * How far from the listener a copy so late stands, 0..1: by the square root,
 * so the short delays the device is mostly set to have room to be seen moving.
 */
export const detuneReach = (ms: number): number => Math.sqrt(clamp(ms / DETUNE_RIM_MS, 0, 1))

/** A copy's angle off straight up: Width at full puts the sharp one on the left side and the flat one on the right. */
export const detuneAngle = (side: 0 | 1, width: number): number =>
  (side === 0 ? -1 : 1) * EIGHTH * width

/** Cents as they are said: "+9 ct", "−12 ct", "0 ct". */
const centsText = (cents: number): string => {
  const whole = Math.round(cents)
  return `${whole > 0 ? '+' : whole < 0 ? '−' : ''}${Math.abs(whole)} ct`
}

const stereoDetune = plateDisplay<Scope>({
  place: 'window',
  columns: 2,
  params: ['detune', 'delay', 'drift', 'feedback', 'width', 'mix'],
  live: { meters: true, stereo: true },
  info: 'The stereo field from where you sit, with the sound as a cloud. The beads are the two copies, sharp on the left and flat on the right, further out the later they are: each creeps along its rail as its pitch shifts, then jumps back. The numbers are their detune now, the dots beyond their repeats.',
  init: scope,
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const field = fieldOf(frame)
    const { r } = field
    const detune = frame.value('detune')
    const delay = frame.value('delay')
    const drift = frame.value('drift')
    const feedback = frame.value('feedback')
    const width = frame.value('width')
    const mix = frame.value('mix')
    // The device's own readings, once the first has come: a head is never at no delay.
    const live = frame.powered && frame.hasMeter('delayLeft') && frame.meter('delayLeft') > 0
    listen(frame, state)
    drawField(frame, field)
    // The dry sound, where and when it was: at the listener, at its part of the mix.
    const dry = Math.cos((mix * Math.PI) / 2)
    ctx.beginPath()
    ctx.arc(field.cx, field.cy, 1.5 + 3 * dry, Math.PI, 2 * Math.PI)
    ctx.globalAlpha = INK.text
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1
    drawCloud(frame, field, state)

    for (const side of [0, 1] as const) {
      const angle = detuneAngle(side, width)
      const centre = delay * (side === 0 ? 1 : DETUNE_RIGHT_RATIO)
      const at = (ms: number): Point => ray(field, angle, r * detuneReach(ms))
      // The rail: the head's travel either side of the Delay, a little longer with Drift,
      // and a mark across it at the Delay itself. A copy that is not detuned stays on the mark.
      const travel = (detune > 0 ? DETUNE_TRAVEL_MS : 0) + drift * DETUNE_DRIFT_MS
      trace(ctx, [at(centre - travel), at(centre + travel)], {
        colour: colours.ink,
        width: 1,
        alpha: INK.text,
      })
      arc(frame, field, r * detuneReach(centre), angle - 0.24, angle + 0.24, INK.text)
      const cents = live
        ? frame.meter(side === 0 ? 'centsLeft' : 'centsRight')
        : side === 0
          ? detune
          : -detune
      const late = live ? frame.meter(side === 0 ? 'delayLeft' : 'delayRight') : centre
      const hold = live ? clamp(frame.meter(side === 0 ? 'holdLeft' : 'holdRight'), 0, 1) : 1
      // Each time round the copy is as late again, and that much quieter.
      for (let pass = 2; pass <= 4 && feedback > 0.01; pass++) {
        if (late * pass > DETUNE_RIM_MS) break
        const [x, y] = at(late * pass)
        dot(ctx, x, y, 2.5 - 0.4 * pass, colours.ink, { alpha: Math.pow(feedback, pass - 1) })
      }
      // The copy now: as loud as Mix and the level hold have it.
      const [x, y] = at(late)
      dot(ctx, x, y, 1.5 + 2.5 * Math.sin((mix * Math.PI) / 2) * hold, colours.accent, {
        ring: colours.ink,
      })
      if (r >= 40) {
        text(frame, centsText(cents), field.cx + (side === 0 ? -r : r), field.cy - r + 7, {
          align: side === 0 ? 'left' : 'right',
        })
      }
    }
    drawAlike(frame, field, state)
    drawBars(frame, field, state)
  },
})

export const SPATIAL_FACES: Readonly<Record<string, PlateFace>> = {
  'stereo-widener': {
    display: stereoWidener,
    face: ['width'],
  },
  utility: {
    display: utility,
    face: ['gainDb', 'pan', 'width', 'polarity'],
  },
  'stereo-detune': {
    display: stereoDetune,
    face: ['detune', 'delay', 'width', 'mix'],
  },
}
