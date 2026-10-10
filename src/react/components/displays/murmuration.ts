// Murmuration's display: the flock seen from above. The listener is the dot
// at the middle of the foot, straight ahead is up, and every bird is drawn
// where the device has it: at its bearing, and as far out as it is, on a
// scale that is linear in metres from the listener to the far edge of the
// range. The far edge itself moves out as Range grows (on a scale of equal
// ratios, so one metre and sixty both fit), and the figure beside it is the
// delay of a bird at that edge.
//
// Where a bird is comes from `cpp/devices/murmuration/flock.h`, copied here
// formula for formula, and the one thing only the device knows, how long the
// flock has been flying, from its `flight` reading. Nothing is an impression:
// a dot is a bird's own delay and side, its size how near it is, its strength
// how loud Air leaves it, and its trail the last half second of its flight.

import { INK, clamp, dot, ground, handle, label, lerp, rule } from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The flight: flock.h ----------------------------------------------------

/** The constants of `flock.h`, by the names they have there. */
export const FLOCK = {
  /** kMaxBirds. */
  birds: 16,
  /** kPeriod: seconds of flight after which everything repeats, and where the reading wraps. */
  period: 1024,
  /** kSlotSeconds and kSlots: a wheel lasts one slot. */
  slotSeconds: 8,
  slots: 128,
  /** kDepthCycles, kSideCycles, kPathWeight, kDepthPhase, kSidePhase: the centre's path. */
  depthCycles: [47, 109],
  sideCycles: [61, 139],
  pathWeight: [0.62, 0.38],
  depthPhase: [0.11, 0.53],
  sidePhase: [0.29, 0.77],
  /** kHomeRadius, kGoldenTurn, kWander, kChurnCycles: the formation. */
  homeRadius: 0.78,
  goldenTurn: 0.381966,
  wander: 0.1,
  churnCycles: 64,
  /** kLeastSize: the flock's size at Together 1. */
  leastSize: 0.08,
  /** kSwoop, kBunch, kSwing, kTurnsEdge: a wheel. */
  swoop: 0.85,
  bunch: 0.6,
  swing: 0.5,
  turnsEdge: 0.15,
  /** kMaxDepthRate: the most a bird's depth changes per second of flight. */
  maxDepthRate: 1.63,
  /** kSoundSpeed, in metres a second. */
  soundSpeed: 343,
  /** kNearShare: the nearest a bird comes, as a share of Range. */
  nearShare: 0.125,
  /** kMaxRadialSpeed: half the speed of sound. */
  maxRadialSpeed: 171.5,
  /** kLevelRatio: a bird this many times the nearest distance away is as loud as the voice. */
  levelRatio: 4,
} as const

const TWO_PI = Math.PI * 2

/** `mix32` in flock.h, in whole numbers of 32 bits. */
function mix32(value: number): number {
  let z = value >>> 0
  z = (z ^ (z >>> 16)) >>> 0
  z = Math.imul(z, 0x7feb352d) >>> 0
  z = (z ^ (z >>> 15)) >>> 0
  z = Math.imul(z, 0x846ca68b) >>> 0
  return (z ^ (z >>> 16)) >>> 0
}

/** `chance`: a number in [0, 1) that belongs to a slot; `salt` picks which. */
export function flockChance(slot: number, salt: number): number {
  return (mix32((Math.imul(slot, 0x9e3779b1) + salt) >>> 0) >>> 8) / 16777216
}

/** `wave`: sin(2π (cycles · tau / kPeriod + offset)). */
const wave = (tau: number, cycles: number, offset: number): number =>
  Math.sin(TWO_PI * ((cycles * tau) / FLOCK.period + offset))

/** `size_of`: how much of the range the flock fills at a setting of Together. */
export function flockSize(together: number): number {
  const loose = clamp(1 - together, 0, 1)
  return FLOCK.leastSize + (1 - FLOCK.leastSize) * loose * Math.sqrt(loose)
}

/** The setting of Together at which the flock fills so much of the range: `flockSize` backwards. */
export function togetherOfSize(size: number): number {
  const loose = clamp((size - FLOCK.leastSize) / (1 - FLOCK.leastSize), 0, 1)
  return 1 - Math.pow(loose, 2 / 3)
}

/** What the whole flock shares at a moment of flight: `Flight`. */
export interface FlockFlight {
  /** The centre's depth in the range, 0 nearest to 1 farthest. */
  u: number
  /** The centre's side, -1 left to 1 right. */
  v: number
  /** How much of the range the flock fills. */
  size: number
  /** How far round the formation has turned, in cycles. */
  twist: number
  /** How far into a wheel the flock is, 0..1. */
  wheel: number
}

/** How whole the wheel of a slot is at a setting of Turns, 0..1: `flight`, `amount`. */
export function wheelAmount(slot: number, turns: number): number {
  const wrapped = ((slot % FLOCK.slots) + FLOCK.slots) % FLOCK.slots
  return clamp(((1 + FLOCK.turnsEdge) * turns - flockChance(wrapped, 0x51)) / FLOCK.turnsEdge, 0, 1)
}

/** `flight`: the centre, the size and the turn of the flock at flight time `tau`. */
export function flockFlight(tau: number, together: number, turns: number): FlockFlight {
  const w = FLOCK.pathWeight
  let u =
    0.5 +
    0.5 *
      (w[0] * wave(tau, FLOCK.depthCycles[0], FLOCK.depthPhase[0]) +
        w[1] * wave(tau, FLOCK.depthCycles[1], FLOCK.depthPhase[1]))
  let v =
    w[0] * wave(tau, FLOCK.sideCycles[0], FLOCK.sidePhase[0]) +
    w[1] * wave(tau, FLOCK.sideCycles[1], FLOCK.sidePhase[1])
  let size = flockSize(together)
  let twist = (FLOCK.churnCycles * tau) / FLOCK.period
  const slots = tau / FLOCK.slotSeconds
  const whole = Math.floor(slots)
  const slot = ((whole % FLOCK.slots) + FLOCK.slots) % FLOCK.slots
  const amount = wheelAmount(slot, turns)
  let wheel = 0
  if (amount > 0) {
    const half = Math.sin(Math.PI * (slots - whole))
    wheel = amount * half * half
    const toU = flockChance(slot, 0xa7)
    const toV = 2 * flockChance(slot, 0x3d) - 1
    const way = flockChance(slot, 0xc9) < 0.5 ? -1 : 1
    u += (toU - u) * FLOCK.swoop * wheel
    v += (toV - v) * FLOCK.swoop * wheel
    size *= 1 - FLOCK.bunch * wheel
    twist += way * FLOCK.swing * wheel
  }
  return { u, v, size, twist, wheel }
}

/** Where one bird is: `Place`. */
export interface FlockPlace {
  /** Depth in the range, 0 nearest to 1 farthest. */
  u: number
  /** Side, -1 left to 1 right, before Spread. */
  v: number
  /** Height, 0..1. */
  h: number
}

/** `place`: one bird at flight time `tau`, in a flock that is flying `flight`. */
export function flockPlace(bird: number, tau: number, flight: FlockFlight): FlockPlace {
  const turn = (bird * FLOCK.goldenTurn + flight.twist) * TWO_PI
  const radius = FLOCK.homeRadius * Math.sqrt((bird + 0.5) / FLOCK.birds)
  const ownU =
    radius * Math.cos(turn) +
    FLOCK.wander * wave(tau, 233 + 29 * ((7 * bird) % 16), bird * 0.618034 + 0.1)
  const ownV =
    radius * Math.sin(turn) +
    FLOCK.wander * wave(tau, 241 + 31 * ((5 * bird + 3) % 16), bird * 0.754878 + 0.6)
  return {
    u: flight.u * (1 - flight.size) + flight.size * (0.5 + 0.5 * ownU),
    v: flight.v * (1 - flight.size) + flight.size * ownV,
    h: 0.5 + 0.5 * wave(tau, 71 + 9 * ((3 * bird + 1) % 16), bird * 0.445 + 0.3),
  }
}

/** `flight_rate`: seconds of flight per second: Speed, held back for a long range. */
export function flightRate(speed: number, range: number): number {
  return Math.min(
    speed,
    FLOCK.maxRadialSpeed / (range * (1 - FLOCK.nearShare) * FLOCK.maxDepthRate),
  )
}

/** `delay_seconds`: how late a bird at depth `u` of a range in metres is heard. */
export function birdDelaySec(range: number, u: number): number {
  return (range * (FLOCK.nearShare + (1 - FLOCK.nearShare) * u)) / FLOCK.soundSpeed
}

/** `pan`: where a bird is heard between the sides, −1 to 1: the sine of its bearing. */
export function birdPan(v: number, spread: number): number {
  return Math.sin((clamp(spread * v, -1, 1) * Math.PI) / 2)
}

/** `loudness`: a bird's gain at depth `u`, the inverse of its distance to the power Air. */
export function birdLoudness(u: number, air: number): number {
  return Math.pow((1 + (1 / FLOCK.nearShare - 1) * u) / FLOCK.levelRatio, -air)
}

// --- The sky ----------------------------------------------------------------

/** Where the far edge stands at the least Range, as a share of the sky's radius; at the most it is the rim. */
const EDGE_LEAST = 0.55
/** How much of the last moments a trail holds, in seconds, and in how many steps. */
const TRAIL_SEC = 0.5
const TRAIL_STEPS = 6
/** How many slots ahead the row of wheels shows. */
const WHEELS_AHEAD = 8
/** A reading that has stood this long means the device is not being run. */
const STANDS_SEC = 0.15
/** The least the Together bar stands to the left of straight ahead, as a share of a quarter turn, so a closed fan does not hide it. */
const KNOT_LEAST = 0.14
/** How far the display's own count of the flight may be from a reading before it gives way, in seconds of flight. */
const SLACK_SEC = 0.25

/** How much taller than it is wide the sky may be drawn, where the display is narrow: depth is what is heard as time. */
const DEEPEST = 1.5

/**
 * The sky as it lies on the display: the listener, and how far the far edge
 * reaches at the most Range, to the sides and straight ahead. Where the
 * display is narrower than it is high the sky is drawn deeper than wide.
 */
export interface Sky {
  cx: number
  cy: number
  rx: number
  ry: number
}

export function skyOf(view: Pick<DisplayView, 'width' | 'height'>): Sky {
  const cy = view.height - 8
  const high = Math.max(8, cy - 8)
  const rx = Math.max(8, Math.min(view.width / 2 - 8, high))
  return { cx: view.width / 2, cy, rx, ry: Math.min(high, DEEPEST * rx) }
}

/** How far out the far edge is drawn, as a share of the sky: equal steps for equal ratios of Range. */
export function edgeShare(range: number, least: number, most: number): number {
  const along = Math.log(clamp(range, least, most) / least) / Math.log(most / least)
  return EDGE_LEAST + (1 - EDGE_LEAST) * along
}

/** The Range whose far edge is that share of the sky out: `edgeShare` backwards. */
export function rangeOfShare(share: number, least: number, most: number): number {
  const along = clamp((share - EDGE_LEAST) / (1 - EDGE_LEAST), 0, 1)
  return least * Math.pow(most / least, along)
}

/**
 * A place in the sky in pixels: `edge` is the far edge's share of the sky,
 * `depth` the share of the range (0 the nearest a bird comes, 1 the far edge),
 * `side` −1 to 1 as the device pans it, so a quarter turn to the left or the
 * right of straight ahead at the ends.
 */
export function skyPoint(sky: Sky, edge: number, depth: number, side: number): [number, number] {
  const out = edge * (FLOCK.nearShare + (1 - FLOCK.nearShare) * depth)
  const bearing = (clamp(side, -1, 1) * Math.PI) / 2
  return [sky.cx + sky.rx * out * Math.sin(bearing), sky.cy - sky.ry * out * Math.cos(bearing)]
}

/** `skyPoint` backwards: how far out a pixel is, as a share of the sky, and its side (past ±1 behind the listener). */
export function skyPlace(sky: Sky, x: number, y: number): { out: number; side: number } {
  const dx = (x - sky.cx) / sky.rx
  const dy = (sky.cy - y) / sky.ry
  return { out: Math.hypot(dx, dy), side: Math.atan2(dx, dy) / (Math.PI / 2) }
}

/** The side the Together bar stands at: the fan's left edge, or `KNOT_LEAST` when the fan is narrower. */
const knotSide = (spread: number): number => Math.max(KNOT_LEAST, clamp(spread, 0, 1))

const rangeEnds = (view: DisplayView): [number, number] => {
  const spec = view.spec('range')
  return [spec?.min ?? 1, spec?.max ?? 60]
}

/**
 * The two points of the sky. The one at the right end of the far edge is
 * Range and Spread at once: out and in is how far the flock flies, round the
 * listener how far to the sides it goes. The one on the left edge is
 * Together: it stands as far into the range as the flock is deep, so pulled
 * out to the far edge the birds scatter over all of it. With the fan closed
 * it keeps a little to the left, where it can still be taken.
 */
function murmurationHandles(view: DisplayView): DisplayHandle[] {
  const sky = skyOf(view)
  const [least, most] = rangeEnds(view)
  const range = view.value('range')
  const spread = view.value('spread')
  const together = view.value('together')
  const edge = edgeShare(range, least, most)
  const [cornerX, cornerY] = skyPoint(sky, edge, 1, spread)
  const [knotX, knotY] = skyPoint(sky, edge, flockSize(together), -knotSide(spread))
  const spreadSpec = view.spec('spread')
  const togetherSpec = view.spec('together')
  return [
    {
      key: 'together',
      name: 'Together',
      x: knotX,
      y: knotY,
      drag: (toX, toY) => {
        if (Math.abs(toX - knotX) < 1e-6 && Math.abs(toY - knotY) < 1e-6) return { together }
        const { out } = skyPlace(sky, toX, toY)
        const size = (out / edge - FLOCK.nearShare) / (1 - FLOCK.nearShare)
        return {
          together: clamp(togetherOfSize(size), togetherSpec?.min ?? 0, togetherSpec?.max ?? 1),
        }
      },
      reset: () => ({ together: togetherSpec?.default ?? together }),
    },
    {
      key: 'range',
      name: 'Range and Spread',
      x: cornerX,
      y: cornerY,
      drag: (toX, toY) => {
        if (Math.abs(toX - cornerX) < 1e-6 && Math.abs(toY - cornerY) < 1e-6)
          return { range, spread }
        // Round to the right of straight ahead, in quarter turns; behind the listener it is the end it is nearer.
        const { out, side } = skyPlace(sky, toX, toY)
        return {
          range: rangeOfShare(out, least, most),
          spread: clamp(side < -1.5 ? 1 : side, spreadSpec?.min ?? 0, spreadSpec?.max ?? 1),
        }
      },
      reset: () => ({
        range: view.spec('range')?.default ?? range,
        spread: spreadSpec?.default ?? spread,
      }),
    },
  ]
}

export interface MurmurationState {
  /** The flight time the display has counted to, in seconds; null until it has drawn. */
  tau: number | null
  /** The device's last reading, and for how long it has stood. */
  reading: number
  stood: number
}

/** The shortest way from one flight time to another, across the wrap at kPeriod. */
const shortWay = (seconds: number): number =>
  seconds - FLOCK.period * Math.round(seconds / FLOCK.period)

/**
 * The flight time on this frame. A reading comes thirty times a second; in
 * between the display counts on at the rate the flock flies, and gives way to
 * a reading that is not where it counted to. A reading that stands means the
 * device is not being run, and the flock stands with it.
 */
export function followFlight(
  state: MurmurationState,
  reading: number,
  rate: number,
  dt: number,
): number {
  if (state.tau === null) {
    state.tau = reading
    state.reading = reading
    state.stood = 0
    return reading
  }
  const counted = state.tau + rate * dt
  if (reading !== state.reading) {
    const off = shortWay(reading - counted)
    state.tau = Math.abs(off) < SLACK_SEC ? counted + off * 0.5 : reading
    state.reading = reading
    state.stood = 0
  } else {
    state.stood += dt
    state.tau = state.stood >= STANDS_SEC ? reading : counted
  }
  state.tau -= FLOCK.period * Math.floor(state.tau / FLOCK.period)
  return state.tau
}

/** How much of the flock is heard at a setting of Mix: the wet side of an equal-power mix. */
const heardOf = (mix: number): number => Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)

/** A delay as it is said: "3.6 ms", "29 ms", "175 ms". */
export const delayText = (seconds: number): string => {
  const ms = seconds * 1000
  return `${ms < 9.95 ? ms.toFixed(1).replace(/\.0$/, '') : Math.round(ms)} ms`
}

const murmuration = plateDisplay<MurmurationState>({
  place: 'window',
  columns: 2,
  params: ['birds', 'range', 'speed', 'together', 'turns', 'air', 'spread', 'mix'],
  live: { meters: true },
  info: 'The flock from above: you are the dot at the foot, each bird a copy of the sound, as far out as it is late, bigger when near, fainter where Air quietens it. The figure is the delay at the far edge, the marks the wheels to come. The ring on the edge sets Range and Spread, the other Together.',
  init: () => ({ tau: null, reading: 0, stood: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const sky = skyOf(frame)
    const [least, most] = rangeEnds(frame)
    const range = frame.value('range')
    const spread = frame.value('spread')
    const together = frame.value('together')
    const turns = frame.value('turns')
    const air = frame.value('air')
    const birds = clamp(Math.round(frame.value('birds')), 1, FLOCK.birds)
    const rate = flightRate(frame.value('speed'), range)
    const heard = heardOf(frame.value('mix'))
    const edge = edgeShare(range, least, most)
    const near = edge * FLOCK.nearShare
    // Still, or switched off: the flock where it was last seen, or where the device says.
    const reading = frame.hasMeter('flight') ? frame.meter('flight') : 0
    const tau =
      frame.powered && frame.dt > 0
        ? followFlight(state, reading, rate, frame.dt)
        : (state.tau ?? reading)

    // The sky the flock may fly in: from the nearest a bird comes out to Range, as far round as Spread.
    // Canvas angles run clockwise from the right; straight ahead is up.
    const open = (spread * Math.PI) / 2
    const from = -Math.PI / 2 - open
    const to = -Math.PI / 2 + open
    ctx.beginPath()
    ctx.ellipse(sky.cx, sky.cy, sky.rx * edge, sky.ry * edge, 0, from, to)
    ctx.ellipse(sky.cx, sky.cy, sky.rx * near, sky.ry * near, 0, to, from, true)
    ctx.closePath()
    ctx.globalAlpha = INK.ground
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
    rule(ctx, sky.cx - sky.rx - 4, sky.cy, sky.cx + sky.rx + 4, sky.cy, {
      colour: colours.ink,
      alpha: INK.grid,
    })

    // The flock now, and where it holds together: the patch of sky it fills.
    const flight = flockFlight(tau, together, turns)
    const lowU = flight.u * (1 - flight.size)
    const midV = flight.v * (1 - flight.size)
    const lowTurn = -Math.PI / 2 + (clamp(midV - flight.size, -1, 1) * spread * Math.PI) / 2
    const highTurn = -Math.PI / 2 + (clamp(midV + flight.size, -1, 1) * spread * Math.PI) / 2
    const inner = edge * (FLOCK.nearShare + (1 - FLOCK.nearShare) * lowU)
    const outer = edge * (FLOCK.nearShare + (1 - FLOCK.nearShare) * (lowU + flight.size))
    ctx.beginPath()
    ctx.ellipse(sky.cx, sky.cy, sky.rx * outer, sky.ry * outer, 0, lowTurn, highTurn)
    ctx.ellipse(sky.cx, sky.cy, sky.rx * inner, sky.ry * inner, 0, highTurn, lowTurn, true)
    ctx.closePath()
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Each bird: the last half second behind it, then the bird, in the accent as far as Mix lets it be heard.
    const step = (TRAIL_SEC * rate) / TRAIL_STEPS
    const flights: FlockFlight[] = []
    for (let back = 0; back <= TRAIL_STEPS; back++)
      flights.push(back === 0 ? flight : flockFlight(tau - back * step, together, turns))
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = colours.ink
    ctx.globalAlpha = INK.back
    ctx.beginPath()
    for (let bird = 0; bird < birds; bird++) {
      for (let back = TRAIL_STEPS; back >= 0; back--) {
        const place = flockPlace(bird, tau - back * step, flights[back])
        const [x, y] = skyPoint(sky, edge, place.u, place.v * spread)
        if (back === TRAIL_STEPS) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    // The farthest first, so a near bird lies over a far one.
    const loudest = birdLoudness(0, air)
    for (let pass = 0; pass < 2; pass++) {
      for (let bird = 0; bird < birds; bird++) {
        const place = flockPlace(bird, tau, flight)
        if (place.u > 0.5 !== (pass === 0)) continue
        const [x, y] = skyPoint(sky, edge, place.u, place.v * spread)
        const strength = lerp(0.45, 1, birdLoudness(place.u, air) / loudest)
        const size = lerp(3, 1.3, place.u)
        if (heard > 0.02) {
          dot(ctx, x, y, size, colours.accent, { alpha: strength * lerp(0.5, 1, heard) })
        } else {
          // Mix 0: the flock flies and nothing of it is heard.
          dot(ctx, x, y, size, colours.ink, { alpha: INK.back * strength })
        }
      }
    }

    // The listener.
    dot(ctx, sky.cx, sky.cy, 2, colours.ink)

    if (sky.rx >= 40) {
      // The delay at the far edge, and the wheels to come: this slot first, a tall mark a whole wheel.
      label(frame, delayText(range / FLOCK.soundSpeed), 5, 12)
      const slot = Math.floor(tau / FLOCK.slotSeconds)
      const right = frame.width - 5
      for (let ahead = 0; ahead < WHEELS_AHEAD; ahead++) {
        const amount = wheelAmount(slot + ahead, turns)
        const x = right - (WHEELS_AHEAD - 1 - ahead) * 3 - 1
        const tall = 1 + Math.round(6 * amount)
        const now = ahead === 0 && flight.wheel > 0 && heard > 0.02
        ctx.globalAlpha = now ? 1 : amount > 0 ? INK.text : INK.back
        ctx.fillStyle = now ? colours.accent : colours.ink
        ctx.fillRect(x - 1, 12 - tall, 2, tall)
      }
      ctx.globalAlpha = 1
    }

    // Together: how deep into the range the flock reaches, along the left edge.
    const [knot, corner] = murmurationHandles(frame)
    const [footX, footY] = skyPoint(sky, edge, 0, -knotSide(spread))
    ctx.beginPath()
    ctx.moveTo(footX, footY)
    ctx.lineTo(knot.x, knot.y)
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 2
    ctx.stroke()
    handle(frame, knot.x, knot.y, { hot: frame.hot === knot.key })
    handle(frame, corner.x, corner.y, { hot: frame.hot === corner.key })
  },
  handles: murmurationHandles,
})

export const MURMURATION_FACES: Readonly<Record<string, PlateFace>> = {
  // Range, Spread and Together are the points on the display.
  murmuration: {
    display: murmuration,
    face: ['birds', 'speed', 'turns', 'mix'],
  },
}
