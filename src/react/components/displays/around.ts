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

/** The ears are this far apart in time in the bass at the full side with Head 1, in seconds: `kItdSeconds`. */
export const AROUND_ITD_SEC = 0.00066
/** How far apart in level the ears go: `kPan` (12 dB at the full side). */
const PAN = 0.6
/** The most the far ear's band over the split is turned down: `kShade`. */
const SHADE = 0.8
/** Where the bands split, set so that the far ear's own lag is `kItdSeconds` at the full side: `kShadeHz`, 193 Hz. */
export const AROUND_SHADE_HZ = SHADE / (TWO_PI * AROUND_ITD_SEC)
/** The most the far ear's lateness may change in a second, as a share (ten cents): `kBend`, `kShadeSpeed`. */
const BEND = 0.0057929
const SHADE_SPEED = BEND * TWO_PI * AROUND_SHADE_HZ
/** The fastest a path's point moves, in disc radii a turn: `kPathSpeed`. */
const PATH_SPEED = { circle: 6.2832, eight: 8.8858, pendulum: 9.8696, wander: 6.4 } as const
/** What the back takes away: the shelf, its corner, the band, its sharpness and depth: `kTop…`, `kNotch…`. */
const TOP_SHELF = 0.28
const TOP_HZ = 5000
const NOTCH_HZ = 7500
const NOTCH_Q = 3
const NOTCH_DEPTH = 0.33
/** Near: the dB lost opposite the near point, how much of the way in the near point counts, and the bass lost under `kThinHz`: `kNearDb`, `kNearer`, `kThin`. */
const NEAR_DB = 9.5
const NEARER = 0.99
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
  /** How far it is from the head (0..1), and from the near point: 0 on the way to it, up to `reach` opposite. */
  reach: number
  away: number
  /** How far out its path lies: Radius as the knob has it. */
  radius: number
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
  const reach = Math.hypot(px, py)
  const away = Math.max(0, 0.5 * (reach - py))
  const turn = turnDeg / 360
  return {
    x: px * cos(turn) + py * sin(turn),
    y: py * cos(turn) - px * sin(turn),
    reach,
    away,
    radius,
  }
}

/**
 * What a source that counts as `radius` out is turned down by, so that the
 * ear it is at never gets more than came in: one over that ear's gain at the
 * full side of such a path. 1 at 0, 0.729 (2.75 dB) at 1. `trim`.
 */
export function aroundTrim(radius: number): number {
  return Math.sqrt(1 + PAN * PAN * radius * radius) / (1 + PAN * radius)
}

/** What Near takes from the source's level away from the near point, in dB. `near_db`. */
export function aroundNearDb(place: AroundPlace, near: number): number {
  return -near * NEAR_DB * place.away
}

/**
 * How far out a source counts as being for the level law: its path's whole
 * Radius with Near at 0, and towards the near point less, down to nearly its
 * own distance from the middle line. Never less than that distance, so the
 * ear the source is at never gets more than came in. `counted_out`.
 */
export function aroundCountedOut(place: AroundPlace, near: number): number {
  if (place.radius <= 1e-6) return 0
  const nearer = NEARER * near * Math.max(0, 1 - place.away / place.radius)
  const across = place.x * place.x
  return Math.sqrt(across + (1 - nearer) * Math.max(0, place.radius * place.radius - across))
}

/** The level the source is carried at, before the ears share it out: `carried` in `control`. */
export function aroundCarried(place: AroundPlace, near: number): number {
  return aroundTrim(aroundCountedOut(place, near)) * Math.pow(10, aroundNearDb(place, near) / 20)
}

/**
 * How much of the shadow a path keeps at its speed: all of it until the far
 * ear's lateness would change faster than ten cents of pitch. `shade_kept`,
 * with the speed `control` gives it: Rate times Radius times the path's own.
 */
export function aroundShadeKept(
  path: AroundPath,
  rate: number,
  radius: number,
  head: number,
): number {
  const wanted = head * SHADE * rate * radius * PATH_SPEED[path]
  return wanted > SHADE_SPEED ? SHADE_SPEED / wanted : 1
}

/** What the two ears are given of a source at `place`: `control` in `around.h`. Index 0 is the left ear. */
export interface AroundEars {
  /** The level of each ear. */
  gain: [number, number]
  /** What each ear's band over the split is multiplied by: under 1 for the far ear, 1 for the near. */
  tilt: [number, number]
}

export function aroundEars(place: AroundPlace, head: number, near: number, kept = 1): AroundEars {
  const level = aroundCarried(place, near) / Math.sqrt(1 + PAN * PAN * place.x * place.x)
  const gain: [number, number] = [level * (1 - PAN * place.x), level * (1 + PAN * place.x)]
  const depth = head * SHADE * kept
  // What an ear loses over the split: the far ear only.
  return {
    gain,
    tilt: [1 - depth * Math.max(0, place.x), 1 - depth * Math.max(0, -place.x)],
  }
}

/**
 * How far apart in time the ears are in the bass, in seconds, and which is
 * late: the far ear's lag, the split's own. `side` of the late ear is −1 for
 * the left.
 */
export function aroundLateSec(
  place: AroundPlace,
  head: number,
  near: number,
  kept = 1,
): { side: -1 | 1; seconds: number } {
  const { tilt } = aroundEars(place, head, near, kept)
  const seconds = (tilt[1] - tilt[0]) / (TWO_PI * AROUND_SHADE_HZ)
  return { side: seconds >= 0 ? -1 : 1, seconds: Math.abs(seconds) }
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
 * The gain an ear gets of its own channel at `hz` from a source at `place`,
 * mixed with the dry sound as Mix has it: `process` in `around.h`, without
 * the room. `side` is −1 for the left ear and 1 for the right; `kept` is how
 * much of the shadow the path's speed leaves (`aroundShadeKept`).
 *
 *   source = (1 − thin·bass) · (1 − dull·shelf·top) · (1 − dull·depth·band)
 *   ear    = gain · (low + tilt · (1 − low)) · source
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
  kept = 1,
): number {
  const e = side < 0 ? 0 : 1
  const ears = aroundEars(place, head, near, kept)
  const level = ears.gain[e]
  const tilt = ears.tilt[e]
  // How far behind the source is: nothing in front, its whole distance straight behind. `behind`.
  const dull = head * Math.max(0, 0.5 * (place.reach - place.y))
  const thin = near * place.away * THIN

  const bass = onePole(THIN_HZ, hz, sampleRate)
  const top = onePole(TOP_HZ, hz, sampleRate)
  const band = notchBand(hz, sampleRate)
  let source: Complex = [1 - thin * bass[0], -thin * bass[1]]
  source = times(source, [1 - dull * TOP_SHELF * (1 - top[0]), dull * TOP_SHELF * top[1]])
  source = times(source, [1 - dull * NOTCH_DEPTH * band[0], -dull * NOTCH_DEPTH * band[1]])

  const low = onePole(AROUND_SHADE_HZ, hz, sampleRate)
  const ear = times([low[0] + tilt * (1 - low[0]), low[1] - tilt * low[1]], source)
  return Math.hypot(1 - mix + mix * level * ear[0], mix * level * ear[1])
}

// --- Layout -----------------------------------------------------------------

/** Under this width there is room for a bar an ear; from it, for each ear's response. */
const WIDE = 190
/** The level at the top and the foot of the bars and of the response, in dB. */
const TOP_DB = 12
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
/** The lateness words and their patch take this much of the plot's top or foot, in px. */
const LABEL_ROOM = 12
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

/** Which way the clock runs: 1 clockwise, −1 anticlockwise (`kDirection`). */
const wayOf = (view: DisplayView): 1 | -1 => (view.value('direction') >= 0.5 ? -1 : 1)

/** How much of the shadow the path's speed leaves, by the knobs as they stand. */
const keptOf = (view: DisplayView): number =>
  aroundShadeKept(pathOf(view), view.value('rate'), view.value('radius'), view.value('head'))

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
        // Over the head there is no direction to read: a hand crossing it
        // would swing the path half round in a pixel or two.
        if (same(turnAt, toX, toY) || Math.hypot(toX - cx, toY - cy) < boxes.skull + 1)
          return { turn: turnDeg }
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
    (wayOf(frame) * frame.value('rate')) / AROUND_TURNS,
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
  const way = wayOf(frame)

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
      const from = turns - way * WALK_TURNS * (1 - i / pieces)
      trace(ctx, stretch(boxes, frame, path, from, from + (way * WALK_TURNS) / pieces, 16), {
        colour: colours.ink,
        width: 1.5,
        alpha: INK.grid + ((INK.trace - INK.grid) * (i + 1)) / pieces,
      })
    }
  } else {
    // The path, stronger where Near has the source closer: each piece by the
    // level the source is carried at there, against the most of any piece.
    const pieces = 48
    const carried = Array.from({ length: pieces }, (_, i) =>
      aroundCarried(aroundPlace(path, (i + 0.5) / pieces, radius, turn), near),
    )
    const nearest = Math.max(...carried)
    for (let i = 0; i < pieces; i++) {
      trace(ctx, stretch(boxes, frame, path, i / pieces, (i + 1) / pieces, 2), {
        colour: colours.ink,
        width: 1.5,
        alpha: INK.rule + (INK.trace - INK.rule) * clamp(carried[i] / nearest, 0, 1),
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

  // The source: a tail over where it was half a second ago (behind it, either
  // way round), and the dot, larger the louder the source is carried (the
  // nearer it is, and the less far out its path lies) and only as full as
  // Mix lets it be heard.
  const mix = frame.value('mix')
  const tail = clamp(frame.value('rate') * TAIL_SEC, 0, TAIL_MOST)
  trace(ctx, stretch(boxes, frame, path, turns - way * tail, turns, 24), {
    colour: colours.accent,
    width: 2.5,
    alpha: Math.max(INK.rule, mix),
  })
  const place = aroundPlace(path, turns, radius, turn)
  const [x, y] = onScreen(boxes, place.x, place.y)
  const size = 2 + 2.5 * aroundCarried(place, near)
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
  rule(
    ctx,
    turnPoint.x,
    turnPoint.y,
    cx + (turnPoint.x - cx) * inward,
    cy + (turnPoint.y - cy) * inward,
    {
      colour: colours.ink,
      width: 1.5,
    },
  )
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
  const kept = keptOf(frame)
  bars.forEach((bar, i) => {
    const side = i === 0 ? -1 : 1
    const level = (hz: number): number =>
      aroundEar(side, place, head, near, hz, frame.sampleRate, mix, kept)
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
  const kept = keptOf(frame)
  freqGrid(frame, plot, MIN_HZ, MAX_HZ)
  dbGrid(frame, plot, TOP_DB, FOOT_DB, 12)
  const db = (side: -1 | 1, hz: number): number =>
    gainToDb(aroundEar(side, place, head, near, hz, frame.sampleRate, mix, kept))
  const right = responsePoints(plot, (hz) => db(1, hz), TOP_DB, FOOT_DB, MIN_HZ, MAX_HZ)
  const left = responsePoints(plot, (hz) => db(-1, hz), TOP_DB, FOOT_DB, MIN_HZ, MAX_HZ)
  clipped(ctx, plot, () => {
    trace(ctx, right, { colour: colours.ink, width: 1.5, dash: [3, 2] })
    trace(ctx, left, { colour: colours.ink, width: 1.5 })
  })
  // A letter at the bass end of each line, the louder ear's over its line.
  const foot = plot.y + plot.h
  const at = (side: -1 | 1): number => yOfDb(db(side, MIN_HZ), plot, TOP_DB, FOOT_DB)
  const leftOver = at(-1) <= at(1)
  const stand = (y: number, over: boolean): number =>
    clamp(over ? y - 4 : y + 11, plot.y + 9, foot - 2)
  label(frame, 'L', plot.x + 3, stand(at(-1), leftOver))
  label(frame, 'R', plot.x + 3, stand(at(1), !leftOver))
  // How late the far ear's bass is against the near ear's: along the top,
  // unless a line climbs that high; then along the foot. (No ear is given
  // more than came in, so no line passes 0 dB and the top is free.)
  const late = aroundLateSec(place, head, near, kept)
  if (mix > 0 && late.seconds >= 0.000005) {
    const words = `${late.side < 0 ? 'L' : 'R'} ${(late.seconds * 1000).toFixed(2)} ms late`
    const highest = Math.min(...right.map((point) => point[1]), ...left.map((point) => point[1]))
    const y = highest > plot.y + LABEL_ROOM ? plot.y + 8 : foot - 2
    label(frame, words, plot.x + plot.w - 3, y, 'right')
  }
}

const around = plateDisplay<AroundState>({
  place: 'window',
  columns: 2,
  params: ['path', 'rate', 'direction', 'radius', 'head', 'near', 'turn', 'mix'],
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
