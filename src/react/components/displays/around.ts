// The display of Around: the listener from above, nose at the top, the path
// the sound travels round the head and the sound itself as a dot on it, where
// the device has it now. Beside the head, what each ear gets of it: on a
// narrow display a bar an ear, on a wide one each ear's response over
// frequency. Everything drawn is the device's own maths (`around.h`), which
// `displays.around.test.ts` holds it to, against the compiled device.

import {
  INK,
  clamp,
  clipped,
  dbGrid,
  freqGrid,
  gainToDb,
  ground,
  handle,
  label,
  responsePoints,
  rule,
  text,
  trace,
  trackPhase,
  yOfDb,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

const TWO_PI = Math.PI * 2
const wrap = (cycles: number): number => cycles - Math.floor(cycles)

// --- The device's numbers: the constants of `around.h` ------------------------

/** The far ear's bass is this late at the full side with Head 1, in seconds: `kItdSeconds`. */
export const AROUND_ITD_SEC = 0.00066
/** How soon the delay leaves zero as the source leaves the middle: `kItdKnee`. */
const ITD_KNEE = 0.1
/** How far apart in level the ears go: `kPan` (12 dB at the full side). */
const PAN = 0.6
/** The most the far ear's high band is turned down, and where the bands split: `kShade`, `kShadeHz`. */
const SHADE = 0.8
const SHADE_HZ = 1000
/** The part of the delay the line gives; the split's own lag is the rest: `kLineSeconds`. */
const LINE_SEC = AROUND_ITD_SEC - SHADE / (TWO_PI * SHADE_HZ)
/** From behind: the shelf, its corner, the notch, its sharpness and depth: `kRear…`, `kNotch…`. */
const REAR_SHELF = 0.45
const REAR_HZ = 5000
const NOTCH_HZ = 7500
const NOTCH_Q = 3
const NOTCH_DEPTH = 0.5
/** Near: what the far side of the path costs in dB, and in bass under `kThinHz`: `kNearDb`, `kThin`. */
const NEAR_DB = 12
const THIN = 0.5
const THIN_HZ = 250
/** The path's clock wraps after this many turns, and the reading is its share of them: `kPathTurns`. */
export const AROUND_TURNS = 16

export const AROUND_PATHS = ['circle', 'eight', 'pendulum', 'wander'] as const
export type AroundPath = (typeof AROUND_PATHS)[number]

const sin = (cycles: number): number => Math.sin(cycles * TWO_PI)
const cos = (cycles: number): number => Math.cos(cycles * TWO_PI)

/**
 * Where a path has its source after `turns` turns, before Radius and Turn: x
 * to the right, y to the front, inside the unit disc. `path_point` in
 * `around.h`.
 */
export function aroundPoint(path: AroundPath, turns: number): [number, number] {
  const p = wrap(turns)
  switch (path) {
    case 'eight':
      return [sin(p), 0.5 * sin(2 * p)]
    case 'pendulum': {
      const swing = 0.25 * sin(p)
      return [sin(swing), cos(swing)]
    }
    case 'wander': {
      const t = wrap(turns / AROUND_TURNS)
      let x = 0.5 * sin(16 * t) + 0.3 * sin(9 * t) + 0.2 * sin(27 * t)
      let y = 0.5 * cos(13 * t) + 0.3 * cos(7 * t) + 0.2 * cos(23 * t)
      const reach = Math.hypot(x, y)
      if (reach > 1) {
        x /= reach
        y /= reach
      }
      return [x, y]
    }
    case 'circle':
      return [sin(p), cos(p)]
  }
}

/** Where the source is, and what Near makes of it. */
export interface AroundPlace {
  /** To the right (−1..1) and to the front, after Radius and Turn. */
  x: number
  y: number
  /** How far it is from the near point: 0 on the way to it, up to 1 opposite. */
  away: number
}

/** The source's place after `turns` turns: `control` in `around.h`. Turn is in degrees. */
export function aroundPlace(
  path: AroundPath,
  turns: number,
  radius: number,
  turnDeg: number,
): AroundPlace {
  const [ux, uy] = aroundPoint(path, turns)
  const px = ux * radius
  const py = uy * radius
  const away = Math.max(0, 0.5 * (Math.hypot(px, py) - py))
  const turn = turnDeg / 360
  return { x: px * cos(turn) + py * sin(turn), y: py * cos(turn) - px * sin(turn), away }
}

/** The far ear's delay as a share of the most, for a source `across` of the way to the other side: `far_delay`. */
export function aroundFarDelay(across: number): number {
  if (across <= 0) return 0
  return (across * across * (1 + ITD_KNEE)) / (across + ITD_KNEE)
}

/** What Near leaves of the source's level at a place: `near_gain`. */
export function aroundNearGain(place: AroundPlace, near: number): number {
  return Math.pow(10, (-near * place.away * NEAR_DB) / 20)
}

/** How late an ear's bass is, in seconds: the line's delay and the lag of the split. `side` is −1 for the left ear. */
export function aroundLateSec(side: -1 | 1, place: AroundPlace, head: number): number {
  const across = Math.max(0, -side * place.x)
  return head * (LINE_SEC * aroundFarDelay(across) + (SHADE * across) / (TWO_PI * SHADE_HZ))
}

type Complex = [number, number]
const times = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
]

/** The kit's one-pole low pass at `cutHz` (`kit::OnePole`), at `hz`. */
function onePole(cutHz: number, hz: number, sampleRate: number): Complex {
  const a = Math.exp((-TWO_PI * cutHz) / sampleRate)
  const w = (TWO_PI * hz) / sampleRate
  const re = 1 - a * Math.cos(w)
  const im = a * Math.sin(w)
  const scale = (1 - a) / (re * re + im * im)
  return [re * scale, -im * scale]
}

/** The kit's `tan_prewarp`: a Padé form up to 0.7, the tangent past it. */
const tanPrewarp = (x: number): number =>
  x > 0.7 ? Math.tan(x) : (x * (15 - x * x)) / (15 - 6 * x * x)

/** The band pass the notch is made of (`kit::Svf::bandpass`, unity at its centre), at `hz`. */
function notchBand(hz: number, sampleRate: number): Complex {
  const w =
    Math.tan((Math.PI * Math.min(hz, sampleRate * 0.499)) / sampleRate) /
    tanPrewarp((Math.PI * NOTCH_HZ) / sampleRate)
  // (jw / Q) / (1 − w² + jw / Q)
  const re = 1 - w * w
  const im = w / NOTCH_Q
  const scale = im / (re * re + im * im)
  return [im * scale, re * scale]
}

/**
 * The gain an ear gets at `hz` from a source at `place`, mixed with the dry
 * sound as Mix has it: `process` in `around.h`, without the room and the side
 * of a stereo input. `side` is −1 for the left ear and 1 for the right.
 *
 *   source = (1 − thin·bass) · (1 − rear·shelf·top) · (1 − rear·depth·band)
 *   ear    = level · (low · e^(−jωτ) + (1 − shade) · (1 − low)) · source
 *   out    = (1 − mix) + mix · ear
 */
export function aroundEar(
  side: -1 | 1,
  place: AroundPlace,
  head: number,
  near: number,
  hz: number,
  sampleRate: number,
  mix = 1,
): number {
  const towards = side * place.x
  const across = Math.max(0, -towards)
  const level =
    (aroundNearGain(place, near) / Math.sqrt(1 + PAN * PAN * place.x * place.x)) *
    (1 + PAN * towards)
  const delay = head * LINE_SEC * aroundFarDelay(across)
  const shade = head * SHADE * across
  const rear = head * Math.max(0, -place.y)
  const thin = near * place.away * THIN

  const bass = onePole(THIN_HZ, hz, sampleRate)
  const top = onePole(REAR_HZ, hz, sampleRate)
  const band = notchBand(hz, sampleRate)
  let source: Complex = [1 - thin * bass[0], -thin * bass[1]]
  source = times(source, [1 - rear * REAR_SHELF * (1 - top[0]), rear * REAR_SHELF * top[1]])
  source = times(source, [1 - rear * NOTCH_DEPTH * band[0], -rear * NOTCH_DEPTH * band[1]])

  const low = onePole(SHADE_HZ, hz, sampleRate)
  const turn = -TWO_PI * hz * delay
  const late = times(low, [Math.cos(turn), Math.sin(turn)])
  const ear = times(
    [late[0] + (1 - shade) * (1 - low[0]), late[1] - (1 - shade) * low[1]],
    source,
  )
  return Math.hypot(1 - mix + mix * level * ear[0], mix * level * ear[1])
}

// --- Layout -----------------------------------------------------------------

/** Under this width there is room for a bar an ear; from it, for each ear's response. */
const WIDE = 190
/** The level at the top and the foot of the bars and of the response, in dB. */
const TOP_DB = 6
const FOOT_DB = -30
/** The response runs from here to here, in Hz. */
const MIN_HZ = 100
const MAX_HZ = 16000
/** What a bar shows (the bass) and its mark (the top), in Hz. */
export const AROUND_BASS_HZ = 150
export const AROUND_TOP_HZ = 4000
/** The dot's tail is where the source was this long ago, no longer than so much of a turn. */
const TAIL_SEC = 0.5
const TAIL_MOST = 0.6
/** How much of Wander's walk is drawn behind the dot, in turns. */
const WALK_TURNS = 1.25

export interface AroundBoxes {
  /** The head's centre, from above. */
  cx: number
  cy: number
  /** Where a path of Radius 1 lies, the rim the Turn point runs on, and the head's size. */
  reach: number
  rim: number
  skull: number
  /** The two bars (left ear, right ear) of a narrow display; null on a wide one. */
  bars: readonly [Box, Box] | null
  /** The response of a wide display; null on a narrow one. */
  plot: Box | null
}

export function aroundBoxes(view: Pick<DisplayView, 'width' | 'height'>): AroundBoxes {
  const { width, height } = view
  const wide = width >= WIDE
  const most = Math.max(10, Math.min((height - 8) / 2, wide ? height / 2 : (width - 44) / 2))
  const cx = wide ? 5 + most : width / 2
  const cy = height / 2
  const column = (x: number): Box => ({ x: x - 2.5, y: 16, w: 5, h: Math.max(8, height - 32) })
  return {
    cx,
    cy,
    reach: most - 11,
    rim: most - 4,
    skull: Math.max(3.5, (most - 11) * 0.17),
    bars: wide ? null : [column(cx - most - 11), column(cx + most + 11)],
    plot: wide
      ? { x: cx + most + 10, y: 8, w: Math.max(20, width - cx - most - 16), h: height - 16 }
      : null,
  }
}

/** A place in the device's disc as a point of the display: the front is up. */
function onScreen(boxes: AroundBoxes, x: number, y: number): Point {
  return [boxes.cx + boxes.reach * x, boxes.cy - boxes.reach * y]
}

const pathOf = (view: DisplayView): AroundPath =>
  AROUND_PATHS[clamp(Math.round(view.value('path')), 0, AROUND_PATHS.length - 1)]

/**
 * The two points of the display. Radius stands on the path a quarter turn on
 * from the near point (where every path but Wander passes at its widest) and
 * is dragged in and out along that line. Turn stands on the rim at the near
 * point and is dragged round the head.
 */
function aroundHandles(view: DisplayView): DisplayHandle[] {
  const boxes = aroundBoxes(view)
  const { cx, cy, reach, rim } = boxes
  const radius = view.value('radius')
  const turnDeg = view.value('turn')
  const turn = (turnDeg / 360) * TWO_PI
  const radiusSpec = view.spec('radius')
  const turnSpec = view.spec('turn')
  const most = radiusSpec?.max ?? 1
  // The path's own right, turned with it.
  const across: Point = [Math.cos(turn), Math.sin(turn)]
  const radiusAt: Point = [cx + reach * radius * across[0], cy + reach * radius * across[1]]
  const turnAt: Point = [cx + rim * Math.sin(turn), cy - rim * Math.cos(turn)]
  const same = (at: Point, x: number, y: number): boolean =>
    Math.abs(x - at[0]) < 1e-6 && Math.abs(y - at[1]) < 1e-6
  return [
    {
      key: 'radius',
      name: 'Radius',
      x: radiusAt[0],
      y: radiusAt[1],
      drag: (toX, toY) => {
        if (same(radiusAt, toX, toY)) return { radius }
        const along = ((toX - cx) * across[0] + (toY - cy) * across[1]) / reach
        return { radius: clamp(along, radiusSpec?.min ?? 0, most) }
      },
      reset: () => ({ radius: radiusSpec?.default ?? radius }),
    },
    {
      key: 'turn',
      name: 'Turn',
      x: turnAt[0],
      y: turnAt[1],
      drag: (toX, toY) => {
        // At the very middle there is no direction to read.
        if (same(turnAt, toX, toY) || Math.hypot(toX - cx, toY - cy) < 1) return { turn: turnDeg }
        const degrees = (Math.atan2(toX - cx, cy - toY) * 180) / Math.PI
        return { turn: clamp(degrees, turnSpec?.min ?? -180, turnSpec?.max ?? 180) }
      },
      reset: () => ({ turn: turnSpec?.default ?? 0 }),
    },
  ]
}

interface AroundState {
  track: PhaseTrack | null
}

/** Where the source is on its path now, in turns of the clock: the device's reading, carried between two of them. */
function turnsNow(frame: DisplayFrame<AroundState>): number {
  if (!frame.hasMeter('phase')) return 0
  const reading = wrap(frame.meter('phase'))
  if (!frame.powered || frame.dt <= 0) {
    frame.state.track = null
    return reading * AROUND_TURNS
  }
  frame.state.track = trackPhase(
    frame.state.track,
    reading,
    frame.value('rate') / AROUND_TURNS,
    frame.dt,
  )
  return frame.state.track.phase * AROUND_TURNS
}

/** A stretch of the path as points of the display, from `from` to `to` turns. */
function stretch(
  boxes: AroundBoxes,
  frame: DisplayView,
  path: AroundPath,
  from: number,
  to: number,
  steps: number,
): Point[] {
  const radius = frame.value('radius')
  const turn = frame.value('turn')
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const place = aroundPlace(path, from + ((to - from) * i) / steps, radius, turn)
    points.push(onScreen(boxes, place.x, place.y))
  }
  return points
}

/** The listener from above: the path, the head, the source and the two points. */
function drawAbove(frame: DisplayFrame<AroundState>, boxes: AroundBoxes, turns: number): void {
  const { ctx, colours } = frame
  const { cx, cy, rim, skull } = boxes
  const path = pathOf(frame)
  const radius = frame.value('radius')
  const turn = frame.value('turn')
  const near = frame.value('near')

  // The rim the Turn point runs on.
  ctx.beginPath()
  ctx.arc(cx, cy, rim, 0, TWO_PI)
  ctx.globalAlpha = INK.grid
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1

  if (path === 'wander') {
    // No closed path: the edge of the ground it walks on, and the last of its walk, fainter the older.
    trace(ctx, stretch(boxes, frame, 'circle', 0, 1, 72), {
      colour: colours.ink,
      width: 1,
      alpha: INK.rule,
      dash: [2, 3],
    })
    const pieces = 5
    for (let i = 0; i < pieces; i++) {
      const from = turns - WALK_TURNS * (1 - i / pieces)
      trace(ctx, stretch(boxes, frame, path, from, from + WALK_TURNS / pieces, 16), {
        colour: colours.ink,
        width: 1.5,
        alpha: INK.grid + ((INK.trace - INK.grid) * (i + 1)) / pieces,
      })
    }
  } else {
    // The path, stronger where Near has the source closer.
    const pieces = 48
    for (let i = 0; i < pieces; i++) {
      const middle = aroundPlace(path, (i + 0.5) / pieces, radius, turn)
      trace(ctx, stretch(boxes, frame, path, i / pieces, (i + 1) / pieces, 2), {
        colour: colours.ink,
        width: 1.5,
        alpha: INK.rule + (INK.trace - INK.rule) * aroundNearGain(middle, near),
      })
    }
  }

  // The head: nose to the front, an ear each side.
  ctx.fillStyle = colours.ink
  ctx.beginPath()
  ctx.moveTo(cx, cy - skull - 3.5)
  ctx.lineTo(cx + 2.5, cy - skull + 0.5)
  ctx.lineTo(cx - 2.5, cy - skull + 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(cx - skull - 1.5, cy - 2, 1.5, 4)
  ctx.fillRect(cx + skull, cy - 2, 1.5, 4)
  ctx.beginPath()
  ctx.arc(cx, cy, skull, 0, TWO_PI)
  ctx.fillStyle = colours.plate
  ctx.fill()
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1.5
  ctx.stroke()

  // The source: a tail over where it was half a second ago, and the dot,
  // larger the nearer it is and only as full as Mix lets it be heard.
  const mix = frame.value('mix')
  const tail = clamp(frame.value('rate') * TAIL_SEC, 0, TAIL_MOST)
  trace(ctx, stretch(boxes, frame, path, turns - tail, turns, 24), {
    colour: colours.accent,
    width: 2.5,
    alpha: Math.max(INK.rule, mix),
  })
  const place = aroundPlace(path, turns, radius, turn)
  const [x, y] = onScreen(boxes, place.x, place.y)
  const size = 2 + 2.5 * aroundNearGain(place, near)
  ctx.beginPath()
  ctx.arc(x, y, size, 0, TWO_PI)
  ctx.fillStyle = colours.plate
  ctx.fill()
  ctx.globalAlpha = mix
  ctx.fillStyle = colours.accent
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.stroke()

  // The two points: Turn on the rim with a mark towards the head, Radius on the path.
  const [radiusPoint, turnPoint] = aroundHandles(frame)
  const inward = (rim - 6) / rim
  rule(ctx, turnPoint.x, turnPoint.y, cx + (turnPoint.x - cx) * inward, cy + (turnPoint.y - cy) * inward, {
    colour: colours.ink,
    width: 1.5,
  })
  handle(frame, turnPoint.x, turnPoint.y, { hot: frame.hot === turnPoint.key, radius: 3 })
  handle(frame, radiusPoint.x, radiusPoint.y, { hot: frame.hot === radiusPoint.key, radius: 3 })
}

/** A level in whole dB with a real minus: "+3", "−9", "0". */
const wholeDb = (gain: number): string => {
  const db = Math.round(gainToDb(gain))
  return `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db)}`
}

/** A bar an ear: its bass as the bar, its top as a mark across it, the bass in dB over it. */
function drawBars(
  frame: DisplayFrame<AroundState>,
  bars: readonly [Box, Box],
  place: AroundPlace,
): void {
  const { ctx, colours } = frame
  const head = frame.value('head')
  const near = frame.value('near')
  const mix = frame.value('mix')
  bars.forEach((bar, i) => {
    const side = i === 0 ? -1 : 1
    const level = (hz: number): number =>
      aroundEar(side, place, head, near, hz, frame.sampleRate, mix)
    const y = (gain: number): number =>
      clamp(yOfDb(gainToDb(gain), bar, TOP_DB, FOOT_DB), bar.y, bar.y + bar.h)
    const bass = level(AROUND_BASS_HZ)
    const middle = bar.x + bar.w / 2
    ctx.globalAlpha = INK.grid
    ctx.fillStyle = colours.ink
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h)
    ctx.globalAlpha = 1
    ctx.fillRect(bar.x, y(bass), bar.w, bar.y + bar.h - y(bass))
    // Where the sound came in: 0 dB.
    rule(ctx, bar.x - 2, y(1), bar.x + bar.w + 2, y(1), { colour: colours.ink, alpha: INK.back })
    const top = y(level(AROUND_TOP_HZ))
    ctx.fillStyle = colours.accent
    ctx.fillRect(bar.x - 2, top - 1, bar.w + 4, 2)
    text(frame, wholeDb(bass), middle, bar.y - 5, { align: 'center' })
    text(frame, side < 0 ? 'L' : 'R', middle, bar.y + bar.h + 10, { align: 'center' })
  })
}

/** Each ear's response over frequency: the left a line, the right dashed. */
function drawResponse(frame: DisplayFrame<AroundState>, plot: Box, place: AroundPlace): void {
  const { ctx, colours } = frame
  const head = frame.value('head')
  const near = frame.value('near')
  const mix = frame.value('mix')
  freqGrid(frame, plot, MIN_HZ, MAX_HZ)
  dbGrid(frame, plot, TOP_DB, FOOT_DB, 12)
  const db = (side: -1 | 1, hz: number): number =>
    gainToDb(aroundEar(side, place, head, near, hz, frame.sampleRate, mix))
  clipped(ctx, plot, () => {
    trace(ctx, responsePoints(plot, (hz) => db(1, hz), TOP_DB, FOOT_DB, MIN_HZ, MAX_HZ), {
      colour: colours.ink,
      width: 1.5,
      dash: [3, 2],
    })
    trace(ctx, responsePoints(plot, (hz) => db(-1, hz), TOP_DB, FOOT_DB, MIN_HZ, MAX_HZ), {
      colour: colours.ink,
      width: 1.5,
    })
  })
  // A letter at the bass end of each line, the louder ear's over its line.
  const foot = plot.y + plot.h
  const at = (side: -1 | 1): number => yOfDb(db(side, MIN_HZ), plot, TOP_DB, FOOT_DB)
  const leftOver = at(-1) <= at(1)
  const stand = (y: number, over: boolean): number =>
    clamp(over ? y - 4 : y + 11, plot.y + 9, foot - 2)
  label(frame, 'L', plot.x + 3, stand(at(-1), leftOver))
  label(frame, 'R', plot.x + 3, stand(at(1), !leftOver))
  // How late the far ear's bass is.
  const late = [aroundLateSec(-1, place, head), aroundLateSec(1, place, head)]
  const far = late[0] >= late[1] ? 0 : 1
  if (mix > 0 && late[far] >= 0.000005) {
    const words = `${far === 0 ? 'L' : 'R'} ${(late[far] * 1000).toFixed(2)} ms late`
    label(frame, words, plot.x + plot.w - 3, foot - 3, 'right')
  }
}

const around = plateDisplay<AroundState>({
  place: 'window',
  columns: 2,
  params: ['path', 'rate', 'radius', 'head', 'near', 'turn', 'mix'],
  live: { meters: true, fps: 60 },
  info: 'Your head from above, nose at the top, and the sound as the dot on its path, larger where it is nearer. Beside it is what each ear gets: the bass as a bar with the top as a mark, or both ears over frequency where there is room. Drag the point on the path for Radius and the one on the rim for Turn.',
  init: () => ({ track: null }),
  draw(frame) {
    ground(frame)
    const boxes = aroundBoxes(frame)
    const turns = turnsNow(frame)
    drawAbove(frame, boxes, turns)
    const place = aroundPlace(pathOf(frame), turns, frame.value('radius'), frame.value('turn'))
    if (boxes.bars) drawBars(frame, boxes.bars, place)
    if (boxes.plot) drawResponse(frame, boxes.plot, place)
  },
  handles: aroundHandles,
})

export const AROUND_FACES: Readonly<Record<string, PlateFace>> = {
  around: {
    display: around,
    face: ['path', 'rate', 'radius', 'head'],
  },
}
