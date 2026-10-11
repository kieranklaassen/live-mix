// The display of Lift, the device that turns the quiet end up: the curve it
// is set to, with the sound riding it, and the lift each part of the sound is
// getting now. Every line is the device's own formula (`cpp/devices/lift/lift.h`).

import {
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dbToGain,
  dot,
  fillBetween,
  fillRect,
  fillTo,
  gainToDb,
  ground,
  handle,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/**
 * The levels the curve spans. Close enough that a dB is more than a pixel and
 * the bend has room for a hand; a Floor further down than the foot stands at
 * the picture's edge and is moved from where it lies.
 */
const TOP_DB = 0
const FOOT_DB = -78
/** The most lift there is (Limit's top): what the bars span. */
const BARS_DB = 30
/** How much of the past the wide shape keeps, in seconds. */
const PAST_SEC = 6
/** `Lift::kLetGoDb`: so far under the floor the lift is gone again. */
const LET_GO_DB = 12
/** The three parts the device judges apart, low to high. */
const PARTS = [0, 1, 2] as const
const PART_METERS = ['liftLow', 'liftMid', 'liftHigh'] as const

/**
 * `Lift::curve`: the lift in dB (0 or more) the device moves towards for a
 * level in dB. Over the threshold there is none; under it the sound is carried
 * `amount` of the way up to the threshold, by `limit` at most; under the floor
 * the lift lets go over 12 dB.
 */
function liftCurve(
  level: number,
  threshold: number,
  amount: number,
  floor: number,
  limit: number,
): number {
  if (level >= threshold) return 0
  const foot = Math.min(floor, threshold)
  let lift = amount * (threshold - Math.max(level, foot))
  if (lift > limit) lift = limit
  if (level < foot) lift *= 1 - (foot - level) / LET_GO_DB
  return Math.max(0, lift)
}

/** `Lift::weight`: how much of the lift a part takes (0 lows, 1 middle, 2 highs) at a Focus of −1..1. */
function liftWeight(part: number, focus: number): number {
  if (part === 0) return focus > 0 ? 1 - focus : 1
  if (part === 2) return focus < 0 ? 1 + focus : 1
  return 1 - 0.5 * Math.abs(focus)
}

/** The settings the picture is drawn from. */
interface Lift {
  threshold: number
  amount: number
  floor: number
  limit: number
  split: number
  focus: number
  sides: number
  /** Hear is on Lift only: the sound itself is taken out and what was added is left. */
  alone: boolean
  mix: number
}

function liftOf(view: DisplayView): Lift {
  return {
    threshold: view.value('threshold'),
    amount: view.value('amount'),
    floor: view.value('floor'),
    limit: view.value('limit'),
    split: view.value('split'),
    focus: view.value('focus'),
    sides: view.value('sides'),
    alone: view.value('hear') >= 0.5,
    mix: view.value('mix'),
  }
}

/**
 * What a lift of so many dB does to the level that comes out, in dB, as
 * `Lift::process` mixes it: the sound (or none of it, on Lift only) and what
 * the lift added, crossed with the untouched sound by Mix.
 */
function leavesDb(lift: Lift, db: number): number {
  return gainToDb(1 + lift.mix * ((lift.alone ? -1 : 0) + dbToGain(db) - 1))
}

/**
 * What a lift of so many dB adds, as a lift on the sound: the same added
 * sound whatever Hear is on, less of it as Mix comes down, none at nothing.
 */
function addsDb(lift: Lift, db: number): number {
  return gainToDb(1 + lift.mix * (dbToGain(db) - 1))
}

/** The least any part takes of the lift the most lifted one gets: the far side of Focus, in the middle of the image. */
function leastShare(lift: Lift): number {
  return (1 - Math.abs(lift.focus)) * (1 - lift.sides)
}

interface LiftBoxes {
  curve: Box
  /** The last seconds: only where the display is wide enough for them. */
  past: Box | null
  /** The figure and the three bars. */
  side: Box
  bars: Box
}

const GAP = 4

/**
 * The curve at the left, as wide as it is high where there is room (a dB
 * across is then a dB up), the bars at the right, and between them the last
 * seconds when the display is wide enough to have them.
 */
function liftBoxes(view: Pick<DisplayView, 'width' | 'height'>): LiftBoxes {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const barsWide = clamp(Math.round(all.w * 0.25), 24, 32)
  const room = all.w - barsWide - GAP
  const square = Math.min(room, all.h)
  const pastWide = room - square - GAP
  const curve: Box = { ...all, w: pastWide >= 40 ? square : room }
  const side: Box = { ...all, x: all.x + all.w - barsWide, w: barsWide }
  return {
    curve,
    past: pastWide >= 40 ? { ...all, x: curve.x + curve.w + GAP, w: pastWide } : null,
    side,
    bars: { ...side, y: side.y + 12, h: side.h - 12 },
  }
}

const xOfDb = (db: number, box: Box): number =>
  box.x + ((clamp(db, FOOT_DB, TOP_DB) - FOOT_DB) / (TOP_DB - FOOT_DB)) * box.w
const dbOfX = (x: number, box: Box): number =>
  FOOT_DB + clamp((x - box.x) / box.w, 0, 1) * (TOP_DB - FOOT_DB)
/** Where a level stands: never off the display, so a curve that falls to silence runs along the foot. */
const yOf = (db: number, box: Box): number =>
  yOfDb(clamp(db, FOOT_DB, TOP_DB), box, TOP_DB, FOOT_DB)
/** Where a lift stands on the bars: none at the foot, 30 dB at the top. */
const barY = (db: number, box: Box): number =>
  box.y + box.h - (clamp(db, 0, BARS_DB) / BARS_DB) * box.h

/** Under this a sound going in is too quiet to tell what was done to it. */
const QUIET = 1e-6

/** A lift as the one figure the device is watched by: "+6.2", and "0.0" when there is none. */
const liftText = (db: number): string => (db > 0.05 ? `+${db.toFixed(1)}` : '0.0')

/**
 * The level the Amount point stands at: the floor, the corner of the curve,
 * where the lift is greatest and the whole of Amount moves it furthest (all
 * the way from the diagonal to the threshold's line). It stays on the picture
 * where the floor lies under its foot, and clear of the threshold's point.
 */
function amountLevel(lift: Lift): number {
  return Math.min(Math.max(lift.floor, FOOT_DB + 10), lift.threshold - 8)
}

/** A level for a place across, also past the picture's edges: where a hand has gone to. */
const dbPast = (x: number, box: Box): number => FOOT_DB + ((x - box.x) / box.w) * (TOP_DB - FOOT_DB)

function liftHandles(view: DisplayView): DisplayHandle[] {
  const { curve } = liftBoxes(view)
  const lift = liftOf(view)
  const { threshold, amount, floor, limit } = lift
  /** The level that comes out for a level going in, for the most lifted part of the sound. */
  const out = (level: number): number =>
    level + leavesDb(lift, liftCurve(level, threshold, amount, floor, limit))
  const at = amountLevel(lift)
  /** Where the curve would stand over the Amount point with no Limit in its way, at an Amount. */
  const free = (candidate: number): number =>
    Math.max(
      FOOT_DB,
      at + leavesDb(lift, liftCurve(at, threshold, candidate, floor, Number.POSITIVE_INFINITY)),
    )
  return [
    {
      key: 'threshold',
      name: 'Threshold',
      // Where the line the sound is lifted towards meets the level going in.
      x: xOfDb(threshold, curve),
      y: yOf(threshold, curve),
      // It lies on the diagonal, so it is taken along it: across and up each
      // say a threshold, and the drag sets the one between them.
      drag: (x: number, y: number) => ({
        threshold: clamp(
          (dbOfX(x, curve) + dbOfY(y, curve, TOP_DB, FOOT_DB)) / 2,
          view.spec('threshold')?.min ?? -48,
          view.spec('threshold')?.max ?? -12,
        ),
      }),
      reset: () => ({ threshold: view.spec('threshold')?.default ?? -22 }),
    },
    {
      key: 'amount',
      name: 'Amount',
      x: xOfDb(at, curve),
      y: yOf(out(at), curve),
      // The bend of the curve: pulled up towards the threshold's line it is
      // more lift, pulled down to the diagonal it is none. The drag sets the
      // Amount whose curve is under the hand. Where Limit holds the curve
      // down the point waits on it, and moves from where the Amount lies: as
      // far past as it lay at the press.
      drag: (_x: number, y: number, hold?: DisplayHold) => {
        const kept = hold ?? {}
        kept.past ??= free(amount) - clamp(out(at), FOOT_DB, TOP_DB)
        const to = dbOfY(y, curve, TOP_DB, FOOT_DB) + kept.past
        if (Math.abs(to - free(amount)) < 1e-9) return { amount }
        const none = free(0)
        const most = free(1)
        // With no room between the floor and the threshold, or next to none
        // of the lift in the mix, the whole of Amount moves the point by less
        // than a pixel: no travel for a hand, and the knob sets it.
        if (most - none < (TOP_DB - FOOT_DB) / curve.h) return { amount }
        if (to <= none) return { amount: 0 }
        if (to >= most) return { amount: 1 }
        let low = 0
        let high = 1
        for (let round = 0; round < 48; round++) {
          const mid = (low + high) / 2
          if (free(mid) < to) low = mid
          else high = mid
        }
        return { amount: (low + high) / 2 }
      },
      reset: () => ({ amount: view.spec('amount')?.default ?? 0.7 }),
    },
    {
      key: 'floor',
      name: 'Floor',
      // The level under which the curve lets go: at the foot of its upright,
      // on the scale of levels going in. A floor further down than the
      // picture stands at its edge, and moves from where it lies: as far past
      // the edge as it lay at the press.
      x: xOfDb(floor, curve),
      y: curve.y + curve.h,
      drag: (x: number, _y: number, hold?: DisplayHold) => {
        const kept = hold ?? {}
        kept.past ??= floor - clamp(floor, FOOT_DB, TOP_DB)
        return {
          floor: clamp(
            dbPast(x, curve) + kept.past,
            view.spec('floor')?.min ?? -90,
            view.spec('floor')?.max ?? -40,
          ),
        }
      },
      reset: () => ({ floor: view.spec('floor')?.default ?? -48 }),
    },
  ]
}

interface LiftState {
  /** The level the device's detector reads, dB. */
  level: History
  /** That level with what the lift put on top of it, dB. */
  lifted: History
  /** The level that comes out, dB: on Lift only it is what was added alone, which can lie under what went in. */
  out: History
}

const liftDisplay = plateDisplay<LiftState>({
  place: 'window',
  columns: 2,
  params: ['threshold', 'amount', 'floor', 'split', 'focus', 'sides', 'limit', 'hear', 'mix'],
  live: { meters: true, signal: true },
  info: 'The curve: level in runs across, level out runs up, and the mark is the sound now. Drag the point on the diagonal for Threshold, the bend for Amount, the one at the foot for Floor. The bars are the lift on lows, middle and highs, paler where only the sides get it; a line marks the most each can get.',
  init: () => ({
    level: new History(PAST_SEC, 80, FOOT_DB, 'max'),
    lifted: new History(PAST_SEC, 80, FOOT_DB, 'max'),
    out: new History(PAST_SEC, 80, FOOT_DB, 'max'),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { curve, past, side, bars } = liftBoxes(frame)
    const lift = liftOf(frame)
    const { threshold, amount, floor, limit } = lift
    const share = leastShare(lift)

    // What is happening: the level the device reads and the lift on each part.
    const running = frame.signal !== null
    const parts = PART_METERS.map((name) => (running ? clamp(frame.meter(name), 0, BARS_DB) : 0))
    const most = Math.max(...parts)
    const level = running ? clamp(frame.meter('level'), FOOT_DB, TOP_DB) : FOOT_DB
    // What the device did to the sound as a whole: the level it reads coming
    // out against the level it reads going in, both the mean power of the
    // two sides, so what Sides gives the sides alone is counted. The parts
    // are lifted by different amounts, so no one lift reading says it. From a
    // device that does not report what comes out, it is measured at the
    // plate (the middle of the image alone), or where the plate was not told
    // what feeds the device, it is the lift of the part lifted most.
    const heard = running && frame.hasMeter('out') ? frame.meter('out') : Number.NaN
    const input = frame.signal?.input
    const done =
      Number.isFinite(heard) && heard > FOOT_DB && level > FOOT_DB
        ? heard - level
        : frame.signal && input && input.rms > QUIET
          ? gainToDb(frame.signal.output.rms) - gainToDb(input.rms)
          : leavesDb(lift, most)
    if (running) {
      state.level.push(frame.now, level)
      state.lifted.push(frame.now, level + Math.max(0, done))
      state.out.push(frame.now, level + done)
    } else if (!frame.powered) {
      // Switched off it does nothing, and the seconds before are not what it is doing.
      for (const history of [state.level, state.lifted, state.out]) history.clear()
    }

    // Left: the curve, for the part of the sound that is lifted most, and
    // under it the part that is lifted least where Focus or Sides part them.
    const foot = curve.y + curve.h
    dbGrid(frame, curve, TOP_DB, FOOT_DB, 24)
    clipped(ctx, curve, () => {
      rule(ctx, curve.x, foot, curve.x + curve.w, curve.y, {
        colour: colours.ink,
        alpha: INK.grid,
        dash: [2, 2],
      })
      const main: Point[] = []
      const over: Point[] = []
      const even: Point[] = []
      const back: Point[] = []
      for (let x = 0; x <= curve.w; x += 1) {
        const inDb = FOOT_DB + (x / curve.w) * (TOP_DB - FOOT_DB)
        const up = liftCurve(inDb, threshold, amount, floor, limit)
        const out = inDb + leavesDb(lift, up)
        main.push([curve.x + x, yOf(out, curve)])
        over.push([curve.x + x, yOf(Math.max(out, inDb), curve)])
        even.push([curve.x + x, yOf(inDb, curve)])
        back.push([curve.x + x, yOf(inDb + leavesDb(lift, up * share), curve)])
      }
      fillTo(ctx, main, foot, colours.ink, INK.fill)
      // What the lift puts on top of the sound.
      fillBetween(ctx, over, even, colours.ink, INK.fill)
      if (share < 1) trace(ctx, back, { colour: colours.ink, alpha: INK.back, width: 1 })
      trace(ctx, main, { colour: colours.ink })
    })

    // Middle, where there is room: the last seconds on the same scale of levels.
    if (past) {
      dbGrid(frame, past, TOP_DB, FOOT_DB, 24)
      clipped(ctx, past, () => {
        const going = state.level.points(past, (db) => yOf(db, past))
        const lifted = state.lifted.points(past, (db) => yOf(db, past))
        fillTo(ctx, going, past.y + past.h, colours.ink, INK.fill)
        fillBetween(ctx, lifted, going, colours.accent, 0.9)
        trace(
          ctx,
          state.out.points(past, (db) => yOf(db, past)),
          { colour: colours.ink, width: 1.25 },
        )
      })
    }

    // The threshold, the line the quiet end is lifted towards, and the floor under which it lets go.
    const thresholdY = yOf(threshold, curve)
    rule(ctx, curve.x, thresholdY, (past ?? curve).x + (past ?? curve).w, thresholdY, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [3, 2],
    })
    const points = liftHandles(frame)
    if (floor >= FOOT_DB) {
      const floorX = xOfDb(floor, curve)
      const corner = yOf(
        floor + leavesDb(lift, liftCurve(floor, threshold, amount, floor, limit)),
        curve,
      )
      rule(ctx, floorX, foot, floorX, corner, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [3, 2],
      })
    }

    // The sound now: across, the level the device reads going in; up, the level it comes out at.
    if (running && level > FOOT_DB) {
      dot(ctx, xOfDb(level, curve), yOf(level + done, curve), 2.5, colours.accent, {
        ring: colours.ink,
      })
    }
    for (const point of points) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // Right: the lift on lows, middle and highs. With Split at nothing they
    // rise as one and stand as one block; the more they are judged apart, the
    // further apart they stand.
    const gap = 3 * clamp(lift.split, 0, 1)
    const wide = (bars.w - 2 * gap) / 3
    const footOf = Math.min(floor, threshold)
    const reach = footOf < threshold ? Math.min(limit, amount * (threshold - footOf)) : 0
    for (const db of [10, 20]) {
      const y = barY(db, bars)
      rule(ctx, bars.x, y, bars.x + bars.w, y, { colour: colours.ink, alpha: INK.grid })
    }
    for (const part of PARTS) {
      const x = bars.x + part * (wide + gap)
      const base = bars.y + bars.h
      fillRect(ctx, { x, y: bars.y, w: wide, h: bars.h }, colours.ink, INK.fill)
      // What the sides get, and in it what the middle of the image gets too.
      const all = barY(addsDb(lift, parts[part]), bars)
      const both = barY(addsDb(lift, parts[part] * (1 - lift.sides)), bars)
      fillRect(ctx, { x, y: all, w: wide, h: both - all }, colours.accent, 0.4)
      fillRect(ctx, { x, y: both, w: wide, h: base - both }, colours.accent, 0.9)
      // The most this part can be lifted as it is set.
      const top = barY(addsDb(lift, liftWeight(part, lift.focus) * reach), bars)
      rule(ctx, x, top, x + wide, top, { colour: colours.ink, alpha: INK.text })
    }
    text(frame, liftText(addsDb(lift, most)), side.x + side.w - 1, side.y + 8, {
      align: 'right',
      size: 9,
    })
  },
  handles: liftHandles,
})

export const LIFT_FACES: Readonly<Record<string, PlateFace>> = {
  lift: {
    display: liftDisplay,
    face: ['threshold', 'amount', 'rise', 'split'],
  },
}
