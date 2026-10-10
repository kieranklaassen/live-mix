// Skipping Stone's display: the throw seen from the side, mirrored in the
// water. The sound is thrown from the mark at the left and time runs to the
// right. Each arc is one skip: as wide as its gap, and as high as its landing
// is loud, on the left side above the water line and on the right side below
// it, so a throw that crosses the stereo field leans from one to the other.
// An arc is drawn fainter the duller Sink has made its landing. A ring lies
// where each skip lands, wider the more of it Ripple has turned into rings.
// With Again the next throw goes on from the last landing. While sound runs,
// what the device holds is laid along the arcs in the second colour where it
// is in its flight, and a ring lights as its landing sounds.

import {
  INK,
  clamp,
  clipped,
  gainToDb,
  ground,
  handle,
  label,
  lerp,
  rule,
  text,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { Tape, deviceClock, tick, type DeviceClock } from './loops'

// --- The throw, as skipping_stone.h has it -----------------------------------

/** skipping_stone.h `kMaxLandings`, `kMinGapSeconds`, `kMaxThrowSeconds`, `kSinkOctaves`. */
export const MOST_LANDINGS = 16
export const MIN_GAP_SEC = 0.002
export const MAX_THROW_SEC = 20
export const SINK_OCTAVES = 0.6

const f32 = Math.fround

/**
 * When each of the sixteen landings would come, in seconds after the sound,
 * and how many are played: `SkippingStone::landings`, in the device's own
 * single precision, so the two agree on a throw that ends on the edge.
 */
export function throwOf(
  firstMs: number,
  bounce: number,
  skips: number,
): { seconds: number[]; count: number } {
  const seconds: number[] = []
  const ratio = f32(bounce)
  let gap = f32(f32(firstMs) * f32(0.001))
  let at = 0
  let count = 0
  for (let k = 0; k < MOST_LANDINGS; k++) {
    if (k > 0) gap = f32(gap * ratio)
    at = f32(at + gap)
    seconds.push(at)
    if (count === k && k < skips && gap >= f32(MIN_GAP_SEC) && at <= MAX_THROW_SEC) count = k + 1
  }
  return { seconds, count }
}

/** One landing as the device plays it (`retarget()` in skipping_stone.h). */
export interface Landing {
  /** Seconds after the sound. */
  at: number
  /** Its gain against the first landing: Loss, skip by skip. */
  gain: number
  /** Its share of that gain on each side: where Throw has carried it, at equal power. */
  left: number
  right: number
  /** The share of its power that Ripple has turned into rings. */
  rings: number
  /** How many octaves Sink has lowered the corner of its low-passes. */
  octaves: number
}

export interface Thrown {
  landings: Landing[]
  /** The second landing: the one played, or where it would come if the throw ended before it. */
  second: Landing
  /** When the last landing comes, in seconds: the length of the throw. */
  total: number
  /** The gain of what comes out wet, by Mix at equal power. */
  wet: number
  /** The gain of the next throw against this one. */
  again: number
}

/** The throw the knobs ask for. */
export function thrownOf(view: Pick<DisplayView, 'value'>): Thrown {
  const skips = clamp(Math.round(view.value('skips')), 1, MOST_LANDINGS)
  const { seconds, count } = throwOf(view.value('first'), view.value('bounce'), skips)
  const flight = seconds[count - 1] - seconds[0]
  const lost = Math.pow(10, -view.value('loss') / 20)
  const sharp = 1 - view.value('ripple')
  const landings: Landing[] = []
  for (let k = 0; k < count; k++) {
    // The stone crosses at a steady speed: a landing sits where the time since the first puts it.
    const across = flight > 0 ? (2 * (seconds[k] - seconds[0])) / flight - 1 : 0
    const angle = ((clamp(view.value('throw') * across, -1, 1) + 1) * Math.PI) / 4
    landings.push({
      at: seconds[k],
      gain: Math.pow(lost, k),
      left: Math.cos(angle),
      right: Math.sin(angle),
      rings: 1 - Math.pow(sharp, k),
      octaves: view.value('sink') * SINK_OCTAVES * k,
    })
  }
  return {
    landings,
    second: landings[1] ?? {
      at: seconds[1],
      gain: lost,
      left: Math.SQRT1_2,
      right: Math.SQRT1_2,
      rings: 1 - sharp,
      octaves: view.value('sink') * SINK_OCTAVES,
    },
    total: seconds[count - 1],
    wet: Math.sin((clamp(view.value('mix'), 0, 1) * Math.PI) / 2),
    again: view.value('again'),
  }
}

// --- The picture -------------------------------------------------------------

/** From the top of a side down to the water line, in dB: a landing this far under full scale lies flat. */
export const RANGE_DB = 30
/** A level as a share of a side's height. */
export const heightOf = (level: number): number => clamp(1 + gainToDb(level) / RANGE_DB, 0, 1)

/**
 * The seconds across the picture. The scale has steps, so that within one a
 * longer gap is a wider arc, pixel for millisecond; the step is the shortest
 * that holds the whole throw with a little room after it.
 */
const SPANS = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32] as const
const FILL = 0.92
export function spanOf(total: number): number {
  for (const span of SPANS) if (span * FILL >= total) return span
  return SPANS[SPANS.length - 1]
}

/** How faint the arc of the dullest landing is drawn, and how many octaves down that is. */
const DULLEST = 0.35
const DULL_OCTAVES = 5
/** How strongly an arc is laid for a landing whose corner has fallen so many octaves. */
export const inkOf = (octaves: number): number =>
  lerp(INK.trace, DULLEST, clamp(octaves / DULL_OCTAVES, 0, 1))

/** Half the width of a landing's ring, in pixels: a dot with nothing in the rings, widest with all of it there. */
const RING_LEAST = 1.5
const RING_MOST = 5.5
export const ringOf = (share: number): number =>
  RING_LEAST + RING_MOST * Math.sqrt(clamp(share, 0, 1))

/** No more throws than this are drawn after the first. */
const MOST_THROWS = 6
/** The sound in its flight is laid in so many strengths. */
const STRENGTHS = 4
/** The longest throw and a little more: how much of what the device wrote is kept. */
const KEPT_SEC = MAX_THROW_SEC + 1

interface Lay {
  box: Box
  /** Where the sound is thrown from, and where the picture ends. */
  hand: number
  right: number
  reach: number
  /** The water line, and how high a side is. */
  water: number
  rise: number
}

function layOf(size: Pick<DisplayView, 'width' | 'height'>): Lay {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  // Room for the letters of the two sides where the picture is wide enough to carry them.
  const hand = box.x + (box.w >= 120 ? 9 : 3)
  const right = box.x + box.w - 2
  const water = Math.round(box.y + box.h / 2)
  const rise = Math.max(2, Math.min(water - box.y, box.y + box.h - water) - 1)
  return { box, hand, right, reach: right - hand, water, rise }
}

const xOf = (seconds: number, lay: Lay, span: number): number =>
  lay.hand + (seconds / span) * lay.reach
const secondsOf = (x: number, lay: Lay, span: number): number => ((x - lay.hand) / lay.reach) * span

/** How high a flight stands over the water at `u` of its way: a throw from the hand falls, a skip rises and falls. */
const flightOf = (u: number, falls: boolean): number => (falls ? 1 - u * u : 4 * u * (1 - u))

/** Where the three points stand on a scale of `span` seconds. */
function pointsOf(
  thrown: Thrown,
  lay: Lay,
  span: number,
): { first: Point; bounce: Point; loss: Point; up: boolean; side: number } {
  const one = thrown.landings[0]
  const two = thrown.second
  const x1 = xOf(one.at, lay, span)
  const x2 = xOf(two.at, lay, span)
  // The second landing's arc is taken on the side it is louder on.
  const up = two.left >= two.right
  const side = up ? two.left : two.right
  const tall = heightOf(thrown.wet * two.gain * side) * lay.rise
  // A landing past the picture's edge (a point in hand keeps the scale) has its point at the edge.
  const edge = (x: number): number => clamp(x, lay.hand, lay.right)
  return {
    first: [edge(x1), lay.water],
    bounce: [edge(x2), lay.water],
    loss: [edge((x1 + x2) / 2), lay.water + (up ? -tall : tall)],
    up,
    side,
  }
}

interface StoneState {
  clock: DeviceClock
  /** The level the device wrote to its ring, by the device's own time. */
  tape: Tape
  /** The scale the picture was last drawn on with no point in hand: a point in hand keeps it. */
  span: number | null
}

/** The marks of the scale at the foot: seconds, tenths and hundredths, as many as have room. */
function drawScale(frame: DisplayFrame, lay: Lay, span: number): void {
  const { ctx, colours } = frame
  const foot = lay.box.y + lay.box.h
  let coarsest = true
  ctx.fillStyle = colours.ink
  for (const unit of [10, 1, 0.1, 0.01]) {
    const gap = (unit / span) * lay.reach
    if (gap > lay.reach || gap < 6) continue
    ctx.globalAlpha = coarsest ? INK.back : INK.rule
    for (let n = 1; lay.hand + n * gap <= lay.right + 0.5; n++) {
      // A finer mark does not stand where a coarser one does.
      if (!coarsest && n % 10 === 0) continue
      ctx.fillRect(Math.round(lay.hand + n * gap), foot - (coarsest ? 3 : 2), 1, coarsest ? 3 : 2)
    }
    coarsest = false
  }
  ctx.globalAlpha = 1
}

/** One flight of one side as a line: from `from` to `to` across, `tall` pixels high at its top (down for the right side). */
function flightPoints(
  from: number,
  to: number,
  water: number,
  tall: number,
  falls: boolean,
): Point[] {
  const steps = clamp(Math.ceil((to - from) / 2), 2, 48)
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    points.push([from + (to - from) * u, water - tall * flightOf(u, falls)])
  }
  return points
}

const skippingStone = plateDisplay<StoneState>({
  place: 'strip',
  params: ['first', 'bounce', 'skips', 'loss', 'sink', 'throw', 'ripple', 'again', 'mix'],
  live: { meters: true, settle: 12 },
  info: 'The throw from the side, mirrored in the water: the left side above, the right below. An arc is a skip, as wide as its gap and as high as it is loud, and the sound runs along them in colour. Drag the first landing for First, the second for Bounce, the arc between for Loss.',
  init: () => ({ clock: deviceClock(), tape: new Tape(KEPT_SEC), span: null }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = layOf(frame)
    const { box, hand, right, water, rise } = lay
    const thrown = thrownOf(frame)
    const { landings, total, wet } = thrown
    const fit = spanOf(total)
    // A point in hand keeps the scale it was taken on, so it stays under the pointer.
    if (!frame.dragging || state.span === null) state.span = fit
    const span = state.span

    // skipping_stone.h `meter`: 0, the level it just wrote to its ring; 1, its running time, -1 asleep.
    const reading = frame.powered && frame.hasMeter('clock')
    const ran = reading ? frame.meter('clock') : -1
    const awake = ran >= 0
    tick(state.clock, frame.now, ran, awake, true)
    if (awake) state.tape.push(state.clock.time, frame.meter('level'))
    else state.tape.clear()

    drawScale(frame, lay, span)
    rule(ctx, box.x, water, box.x + box.w, water, { colour: colours.ink, alpha: INK.rule })

    clipped(ctx, { x: box.x, y: box.y, w: box.w, h: box.h }, () => {
      // The throws: the first from the hand, and with Again each next one from the last landing.
      const last = landings[landings.length - 1]
      for (let n = 0; n <= MOST_THROWS; n++) {
        const start = n * total
        const level = wet * Math.pow(thrown.again, n)
        if (n > 0 && (xOf(start, lay, span) >= right || heightOf(level) <= 0)) break
        let from = xOf(start, lay, span)
        for (let k = 0; k < landings.length; k++) {
          const landing = landings[k]
          const to = xOf(start + landing.at, lay, span)
          if (from > right) break
          const ink = inkOf(n * last.octaves + landing.octaves)
          for (const [side, sign] of [
            [landing.left, 1],
            [landing.right, -1],
          ] as const) {
            const tall = heightOf(level * landing.gain * side) * rise
            if (tall <= 0) continue
            ctx.beginPath()
            const points = flightPoints(from, to, water, sign * tall, n === 0 && k === 0)
            for (let i = 0; i < points.length; i++) {
              if (i === 0) ctx.moveTo(points[i][0], points[i][1])
              else ctx.lineTo(points[i][0], points[i][1])
            }
            ctx.globalAlpha = ink
            ctx.strokeStyle = colours.ink
            ctx.lineWidth = n === 0 ? 1.5 : 1
            ctx.lineJoin = 'round'
            ctx.stroke()
          }
          // The ring where it lands, on the water.
          const wide = ringOf(landing.rings)
          ctx.beginPath()
          ctx.ellipse(to, water, wide, Math.max(1, wide * 0.45), 0, 0, Math.PI * 2)
          ctx.globalAlpha = n === 0 ? INK.text : INK.back
          ctx.strokeStyle = colours.ink
          ctx.lineWidth = 1
          ctx.stroke()
          from = to
        }
      }
      ctx.globalAlpha = 1

      if (awake && wet > 0) {
        // The sound in its flight: what was written `age` seconds ago is that
        // far along the throw, as loud as the landing it flies to will be.
        const perPixel = span / lay.reach
        const end = Math.min(right, xOf(total, lay, span))
        const lit: number[][] = Array.from({ length: STRENGTHS }, () => [])
        let k = 0
        for (let x = hand + 1; x <= end; x += 2) {
          const age = secondsOf(x, lay, span)
          while (k < landings.length - 1 && landings[k].at < age) k += 1
          const landing = landings[k]
          const before = k === 0 ? 0 : landings[k - 1].at
          const u = clamp((age - before) / Math.max(1e-9, landing.at - before), 0, 1)
          const heard = state.tape.over(Math.max(0, age - perPixel), age + perPixel)
          if (!(heard > 0)) continue
          const over = flightOf(u, k === 0)
          for (const [side, sign] of [
            [landing.left, 1],
            [landing.right, -1],
          ] as const) {
            const loud = heightOf(heard * wet * landing.gain * side)
            if (loud <= 0) continue
            const tall = heightOf(wet * landing.gain * side) * rise
            lit[Math.min(STRENGTHS - 1, Math.floor(loud * STRENGTHS))].push(
              x,
              water - sign * tall * over,
            )
          }
        }
        ctx.fillStyle = colours.accent
        for (let strength = 0; strength < STRENGTHS; strength++) {
          const marks = lit[strength]
          if (marks.length === 0) continue
          ctx.globalAlpha = (strength + 1) / STRENGTHS
          for (let i = 0; i < marks.length; i += 2)
            ctx.fillRect(marks[i] - 1, marks[i + 1] - 1, 2, 2)
        }
        // A ring lights as its landing sounds.
        for (const landing of landings) {
          const x = xOf(landing.at, lay, span)
          if (x > right) break
          const loud = heightOf(
            state.tape.over(Math.max(0, landing.at - perPixel), landing.at + perPixel) *
              wet *
              landing.gain,
          )
          if (loud <= 0) continue
          const wide = ringOf(landing.rings)
          ctx.beginPath()
          ctx.ellipse(x, water, wide, Math.max(1, wide * 0.45), 0, 0, Math.PI * 2)
          ctx.globalAlpha = loud
          ctx.fillStyle = colours.accent
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
    })

    // The hand: the level thrown now, either way from the water; at rest, a mark where the throw starts.
    const thrownNow = awake ? heightOf(state.tape.over(0, 1 / 30)) * rise : 0
    if (thrownNow >= 1) {
      ctx.fillStyle = colours.accent
      ctx.fillRect(hand - 1, water - thrownNow, 2, 2 * thrownNow)
    } else {
      rule(ctx, hand, water - 3, hand, water + 4, { colour: colours.ink, alpha: INK.back })
    }
    if (box.w >= 120) {
      text(frame, 'L', box.x + 1, box.y + 7, { alpha: INK.text })
      text(frame, 'R', box.x + 1, box.y + box.h - 1, { alpha: INK.text })
    }

    const points = pointsOf(thrown, lay, span)
    const hot = frame.hot
    // The rail the Loss point runs on: from the water to where its arc stands with nothing lost.
    const top = water + (points.up ? -1 : 1) * heightOf(wet * points.side) * rise
    rule(ctx, points.loss[0], water, points.loss[0], top, {
      colour: colours.ink,
      alpha: hot === 'loss' ? INK.back : INK.grid,
    })
    handle(frame, points.first[0], points.first[1], { hot: hot === 'first' })
    handle(frame, points.bounce[0], points.bounce[1], { hot: hot === 'bounce' })
    handle(frame, points.loss[0], points.loss[1], { hot: hot === 'loss', radius: 3 })

    const first = frame.value('first')
    const words =
      hot === 'bounce'
        ? `×${frame.value('bounce').toFixed(2)}`
        : hot === 'loss'
          ? `${frame.value('loss').toFixed(1)} dB`
          : first >= 1000
            ? `${(first / 1000).toFixed(2)} s`
            : `${Math.round(first)} ms`
    label(frame, words, box.x + box.w - 1, box.y + 7, 'right')
  },
  handles: (view) => {
    const lay = layOf(view)
    const thrown = thrownOf(view)
    const fit = spanOf(thrown.total)
    const points = pointsOf(thrown, lay, fit)
    const first = view.value('first')
    const bounce = view.value('bounce')
    const loss = view.value('loss')
    const firstSpec = view.spec('first')
    const bounceSpec = view.spec('bounce')
    const lossSpec = view.spec('loss')
    /** The scale a hand moves on: the one the point was taken on, for as long as it is held. */
    const scale = (hold?: DisplayHold): number => {
      if (!hold) return fit
      hold.span ??= fit
      return hold.span
    }
    const handles: DisplayHandle[] = [
      {
        key: 'first',
        name: 'First',
        x: points.first[0],
        y: points.first[1],
        drag: (x: number, _y: number, hold?: DisplayHold) => {
          const span = scale(hold)
          if (Math.abs(x - points.first[0]) < 1e-6) return { first }
          return {
            first: clamp(
              secondsOf(x, lay, span) * 1000,
              firstSpec?.min ?? 20,
              firstSpec?.max ?? 2000,
            ),
          }
        },
        reset: () => ({ first: firstSpec?.default ?? first }),
      },
      {
        key: 'bounce',
        name: 'Bounce',
        x: points.bounce[0],
        y: points.bounce[1],
        // The second landing comes First x (1 + Bounce) after the sound.
        drag: (x: number, _y: number, hold?: DisplayHold) => {
          const span = scale(hold)
          if (Math.abs(x - points.bounce[0]) < 1e-6) return { bounce }
          return {
            bounce: clamp(
              (secondsOf(x, lay, span) * 1000 - first) / first,
              bounceSpec?.min ?? 0.5,
              bounceSpec?.max ?? 1.5,
            ),
          }
        },
        reset: () => ({ bounce: bounceSpec?.default ?? bounce }),
      },
      {
        key: 'loss',
        name: 'Loss',
        x: points.loss[0],
        y: points.loss[1],
        // The top of the second landing's arc: Loss under where it stands with nothing lost.
        drag: (_x: number, y: number, hold?: DisplayHold) => {
          const none = gainToDb(thrown.wet * points.side)
          // With next to nothing of the skips in the mix the arc lies on the water: no travel for a hand.
          if (none <= -RANGE_DB + 1) return { loss }
          // An arc under the foot of the scale waits on the water line: it is
          // taken there and moves from where it lies, as far under as it lay.
          const kept = hold ?? {}
          kept.past ??= Math.min(0, none - loss + RANGE_DB)
          if (Math.abs(y - points.loss[1]) < 1e-6) return { loss }
          const over = points.up ? lay.water - y : y - lay.water
          const to = (clamp(over / lay.rise, 0, 1) - 1) * RANGE_DB + kept.past
          return { loss: clamp(none - to, lossSpec?.min ?? 0, lossSpec?.max ?? 12) }
        },
        reset: () => ({ loss: lossSpec?.default ?? loss }),
      },
    ]
    return handles
  },
})

export const SKIPPING_STONE_FACES: Readonly<Record<string, PlateFace>> = {
  'skipping-stone': {
    display: skippingStone,
    face: ['first', 'skips', 'ripple', 'mix'],
  },
}
