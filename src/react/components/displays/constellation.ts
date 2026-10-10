// Constellation's display: the sky. Time runs to the right from the note at
// the left edge, across one span to the last star and on into the passes
// Again makes of it; left is up and right is down; a dot is as big as its
// star is loud and as strong as it is bright. The places the pattern has that
// Stars has not lit are rings. Behind the stars the sound that went in drifts
// across as a glow, a span wide every span, and a star lights when it gets
// there. The last star is the point to drag: across is Span, up and down is
// Width, and the wheel lights or puts out a star. Where the picture is too
// low for Width to be set by hand on the star's own travel (a strip: 12 px),
// the hand goes further than the star, 24 px for the whole of Width, counted
// from where it took the star. A pass Again makes is drawn as bright as the
// first: what the loop's low-pass takes of it is not drawn.
//
// Where the stars stand is not read from the device: it is worked out here
// by the same sums as `cpp/devices/constellation/sky.h`, to the last bit
// where a bit decides (the random numbers, the wrap of the golden sequence),
// and the test beside this file holds the two to one table of numbers.

import { denormalizeParam } from '../../../core/params'
import {
  History,
  INK,
  clamp,
  clipped,
  ground,
  handle,
  label,
  lerp,
  rule,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The sky, as sky.h lays it out -------------------------------------------

/** How many places a sky has (`kPlaces`). */
export const PLACES = 12
/** The patterns in the order of the Pattern knob. */
const SPIRAL = 0
const CLUSTER = 1
const SCATTER = 2
const GATHER = 4

const f = Math.fround
// The constants of sky.h, as the floats they are there.
const TWO_PI = f(2 * Math.PI)
const ANCHOR_PAN = f(0.8)
const GOLDEN_TURN = f(0.38196601)
const GOLDEN_STEP = f(0.61803399)
const RATIO_LEAST = f(0.58)
const RATIO_RANGE = f(0.2)
const WARP_LEAST = f(0.14)
const WARP_RANGE = f(0.3)
const TWINKLE = f(0.3)
const SMALL_TWINKLE = f(0.15)
const FLAM_LEAST = f(0.022)
const FLAM_RANGE = f(0.028)
const SCATTER_FROM = f(0.05)
const SCATTER_FILL = f(0.9)
const SCATTER_NUDGE = f(0.012)
/** Fade takes this many octaves off the level and the corner of a star at the end of the span. */
const FADE_OCTAVES = 3
/** No star's low-pass stands lower, and none higher than Tone goes. */
const DARKEST_HZ = 150
const BRIGHTEST_HZ = 16000
/** Again counts for this much of itself in the share the passes take of the level (`kAgainKept`). */
const AGAIN_KEPT = 0.97
/** The wander: its period in seconds, its three parts, and how far it reaches. */
export const DRIFT_PERIOD_SEC = 1800
const DRIFT_TURNS = [97, 59, 163] as const
const DRIFT_TURNS_STEP = [13, 9, 21] as const
const DRIFT_WEIGHT = [0.5, 0.3, 0.2] as const
const DRIFT_SEC = 0.006
const DRIFT_SHARE = 0.5

/** One sky: for each place its time as a share of the span, its side (−1 left to 1 right) and its brightness. */
export interface Sky {
  time: Float32Array
  pan: Float32Array
  mag: Float32Array
}

/** `sky_seed`: the pattern and the seed through a mixing hash, in 32 bits. */
function skySeed(pattern: number, seed: number): number {
  let mixed = (Math.imul(pattern + 1, 0x9e3779b9) + Math.imul(seed, 0x85ebca6b)) >>> 0
  mixed = (mixed ^ (mixed >>> 16)) >>> 0
  mixed = Math.imul(mixed, 0x7feb352d) >>> 0
  mixed = (mixed ^ (mixed >>> 15)) >>> 0
  mixed = Math.imul(mixed, 0x846ca68b) >>> 0
  mixed = (mixed ^ (mixed >>> 16)) >>> 0
  return mixed === 0 ? 0x2545f491 : mixed
}

/** `kit::Rng` (xorshift32): `uniform` in [0, 1) and `bipolar` in [−1, 1), exact in a float. */
function rngOf(seed: number): { uniform(): number; bipolar(): number } {
  let state = seed >>> 0
  const uniform = (): number => {
    state = (state ^ (state << 13)) >>> 0
    state = (state ^ (state >>> 17)) >>> 0
    state = (state ^ (state << 5)) >>> 0
    return (state >>> 8) / 16777216
  }
  return { uniform, bipolar: () => uniform() * 2 - 1 }
}

/** `seed_share`: where a seed falls in a range, by the golden sequence. */
function seedShare(pattern: number, seed: number): number {
  const turn = (seed + 0.37 * (pattern + 1)) * 0.6180339887498949
  return f(turn - Math.floor(turn))
}

/** `lay_out`: the sky of a pattern (0..4) and a seed (1..16). */
export function layOut(pattern: number, seed: number): Sky {
  const sky: Sky = {
    time: new Float32Array(PLACES),
    pan: new Float32Array(PLACES),
    mag: new Float32Array(PLACES),
  }
  const rng = rngOf(skySeed(pattern, seed))
  const dir = rng.uniform() < 0.5 ? -1 : 1
  sky.time[0] = 1
  sky.pan[0] = dir * ANCHOR_PAN
  sky.mag[0] = 1
  if (pattern === SPIRAL || pattern === GATHER) {
    const ratio = f(RATIO_LEAST + f(RATIO_RANGE * seedShare(pattern, seed)))
    // Where the winding starts, by chance; then one twinkle a star.
    const turn = rng.uniform()
    let gap = 1
    for (let i = 1; i < PLACES; i++) {
      gap = f(gap * ratio)
      const wind = Math.sin(f(TWO_PI * f(turn + f(i * GOLDEN_TURN))))
      const twinkle = f(1 - f(TWINKLE * rng.uniform()))
      if (pattern === SPIRAL) {
        sky.time[i] = gap
        sky.pan[i] = wind
        sky.mag[i] = f(1 - f(f(0.04) * i)) * twinkle
      } else {
        sky.time[i] = 1 - gap
        sky.pan[i] = f(f(dir * ANCHOR_PAN) * f(1 - gap)) + f(gap * f(wind))
        sky.mag[i] = f(f(0.56) + f(f(0.04) * i)) * twinkle
      }
    }
  } else if (pattern === CLUSTER) {
    const groups = rng.uniform() < 0.5 ? 3 : 4
    const centre = [1, 0, 0, 0]
    const side = [dir * ANCHOR_PAN, 0, 0, 0]
    const behind = [0, 0, 0, 0]
    for (let g = 1; g < groups; g++) {
      centre[g] = f(f(g + f(0.5 * f(rng.uniform() - 0.5))) / groups)
      side[g] = f(f(0.9) * rng.bipolar())
    }
    for (let i = 1; i < PLACES; i++) {
      const g = i % groups
      const member = Math.floor(i / groups)
      if (member === 0) {
        sky.time[i] = centre[g]
        sky.pan[i] = side[g]
        sky.mag[i] = 0.9
      } else {
        behind[g] = f(behind[g] + f(FLAM_LEAST + f(FLAM_RANGE * rng.uniform())))
        sky.time[i] = centre[g] - behind[g]
        sky.pan[i] = clamp(f(side[g] + f(f(0.3) * rng.bipolar())), -1, 1)
        sky.mag[i] = 0.85 - 0.15 * member
      }
    }
    // A twinkle by chance, drawn after every time and side.
    for (let i = 1; i < PLACES; i++)
      sky.mag[i] = sky.mag[i] * f(1 - f(SMALL_TWINKLE * rng.uniform()))
  } else if (pattern === SCATTER) {
    const start = rng.uniform()
    for (let i = 1; i < PLACES; i++) {
      // Float by float: a place a hair under a whole number must wrap as it does in the device.
      let place = f(start + f(i * GOLDEN_STEP))
      place = f(place - Math.floor(place))
      sky.time[i] = f(f(SCATTER_FROM + f(SCATTER_FILL * place)) + f(SCATTER_NUDGE * rng.bipolar()))
      sky.pan[i] = rng.bipolar()
      sky.mag[i] = 0.45 + 0.55 * rng.uniform()
    }
  } else {
    // Ladder: the lower half of the seeds' shares bends the rungs late, the upper half early.
    const share = f(2 * seedShare(pattern, seed))
    const warp =
      share < 1
        ? f(f(1 + WARP_LEAST) + f(WARP_RANGE * share))
        : f(1 / f(f(1 + WARP_LEAST) + f(WARP_RANGE * f(share - 1))))
    // The walk: straight across to the last star's side, or out to the other side and back.
    const back = rng.uniform() < 0.5
    for (let i = 1; i < PLACES; i++) {
      let rung = 0
      let bit = 0.5
      let depth = 0
      for (let n = i; n > 0; n >>= 1) {
        if (n & 1) rung += bit
        bit *= 0.5
        depth += 1
      }
      sky.time[i] = Math.pow(rung, warp)
      const walk = back ? 4 * Math.abs(rung - 0.5) - 1 : 2 * rung - 1
      sky.pan[i] = f(dir * ANCHOR_PAN) * walk
      sky.mag[i] = f(1 - f(f(0.15) * depth)) * f(1 - f(SMALL_TWINKLE * rng.uniform()))
    }
  }
  return sky
}

// A sky is a pure function of two small whole numbers: each is laid out once.
const skies = new Map<number, Sky>()
function skyOf(pattern: number, seed: number): Sky {
  const key = pattern * 64 + seed
  let sky = skies.get(key)
  if (!sky) {
    sky = layOut(pattern, seed)
    skies.set(key, sky)
  }
  return sky
}

/** `fade_share`: what Fade leaves of a star at `time`, of its level and of its corner. */
export const fadeShare = (fade: number, time: number): number => 2 ** (-FADE_OCTAVES * fade * time)

/** `star_corner`: a star's low-pass corner in Hz. */
export const starCorner = (toneHz: number, share: number, mag: number): number =>
  Math.max(DARKEST_HZ, toneHz * share * (0.5 + 0.5 * mag))

/**
 * How loud each place sounds for a sound of one going in, wet only: the
 * pattern's brightness times what Fade leaves, for the first `stars` places,
 * scaled so their powers add to one (the device's `control()`).
 */
export function starLevels(sky: Sky, stars: number, fade: number): number[] {
  const levels: number[] = []
  let power = 0
  for (let k = 0; k < PLACES; k++) {
    const level = k < stars ? sky.mag[k] * fadeShare(fade, sky.time[k]) : 0
    levels.push(level)
    power += level * level
  }
  const scale = power > 0 ? 1 / Math.sqrt(power) : 0
  return levels.map((level) => level * scale)
}

/**
 * `again_share`: what goes into the line of a sound of one with so much of it
 * fed back. The passes share the level, so the first sky is this much fainter.
 */
export const againShare = (again: number): number => Math.sqrt(1 - (AGAIN_KEPT * again) ** 2)

/** `drift_at`: the wander of a star at `clock` (a share of the period), about −1..1. */
export function driftAt(star: number, clock: number): number {
  let sum = 0
  for (let part = 0; part < DRIFT_TURNS.length; part++) {
    const start = (star + 1) * 0.6180339887498949 * (part + 1)
    const turns = DRIFT_TURNS[part] + DRIFT_TURNS_STEP[part] * ((5 * star) % PLACES)
    const turn = start + turns * clock
    sum += DRIFT_WEIGHT[part] * Math.sin(2 * Math.PI * (turn - Math.floor(turn)))
  }
  return sum
}

/**
 * How far Drift moves a star's time, in seconds: up to 6 ms at 1, and never
 * more than half the star's own time.
 */
export const driftSeconds = (
  drift: number,
  time: number,
  spanSec: number,
  wander: number,
): number => drift * Math.min(DRIFT_SEC, DRIFT_SHARE * time * spanSec) * wander

// --- The picture ------------------------------------------------------------

/** Where the last star stands across the sky's room: at the shortest Span and at the longest. */
const NEAR = 0.2
const FAR = 0.72
/** The room left of the note, so a star close to it is a whole dot. */
const LEAD = 3
/** The pixels kept free above and below the furthest stars. */
const EDGE = 5
/** A dot's radius: this, and so much more for a star at full level. */
const DOT_LEAST = 0.6
/** Under this level a star is not a dot. */
const FAINT = 0.003
/** The ring of a place that is not sounding. */
const RING = 1.6
/** A wander of the full 6 ms is drawn this many pixels wide: far more than it is, so it can be seen. */
const WOBBLE_PX = 3
/** The level that went in is kept this long, in slots this fine. */
const PAST_SEC = 16
const SLOTS_PER_SEC = 60
/** How strongly the glow of the sound on its way is laid, at full scale. */
const GLOW_INK = 0.3
/** How strongly a dot is laid, from the darkest star to the brightest. */
const DARK_INK = 0.42
/** The one point the display has. */
const POINT = 'last'
/**
 * The least a hand travels up or down for the whole of Width. On a strip the
 * last star itself has 12 px between no width and all of it, too little to
 * set by hand: there the hand goes this far and the star follows at its own pace.
 */
const WIDTH_TRAVEL = 24

interface SkyState {
  /** The level going in over the last moments, for the glow and the lights. */
  past: History
}

/** The room the sky is drawn in: `ground`'s box, worked out without a canvas for the handle. */
const boxOf = (view: DisplayView): Box => ({ x: 4, y: 4, w: view.width - 8, h: view.height - 8 })

interface Scale {
  box: Box
  /** Where the note stands, and how many pixels one span is. */
  x0: number
  across: number
  /** The middle line, and how far up or down a star at one side stands. */
  mid: number
  reach: number
  /** The biggest a dot grows over `DOT_LEAST`. */
  grow: number
}

function scaleOf(view: DisplayView): Scale {
  const box = boxOf(view)
  const x0 = box.x + LEAD
  return {
    box,
    x0,
    across: lerp(NEAR, FAR, view.at('span')) * (box.w - LEAD),
    mid: box.y + box.h / 2,
    reach: box.h / 2 - EDGE,
    grow: clamp(box.h * 0.075, 2.8, 4.4),
  }
}

/** The whole numbers the knobs stand on. */
const starsOf = (view: DisplayView): number => clamp(Math.round(view.value('stars')), 1, PLACES)
const patternOf = (view: DisplayView): number => clamp(Math.round(view.value('pattern')), 0, 4)
const seedOf = (view: DisplayView): number => Math.max(1, Math.round(view.value('shuffle')))

/** A span as it is said: "240 ms", "2.4 s", "8 s". */
export function spanText(ms: number): string {
  const whole = Math.round(ms)
  if (whole < 1000) return `${whole} ms`
  return `${(Math.round(ms / 100) / 10).toFixed(1).replace(/\.0$/, '')} s`
}

function lastStar(view: DisplayView): DisplayHandle {
  const scale = scaleOf(view)
  const span = view.spec('span')
  const width = view.spec('width')
  const side = skyOf(patternOf(view), seedOf(view)).pan[0]
  const x = scale.x0 + scale.across
  const y = scale.mid + side * view.value('width') * scale.reach
  const room = scale.box.w - LEAD
  // How far the hand goes for the whole of Width: as far as the star does, or
  // WIDTH_TRAVEL where the picture gives the star less.
  const travel = Math.sign(side) * Math.max(Math.abs(side) * scale.reach, WIDTH_TRAVEL)
  return {
    key: POINT,
    name: 'Span and width',
    x,
    y,
    // Across is where the knob stands under its taper, so every span is in reach of the display.
    drag: (toX, toY, hold?: DisplayHold) => {
      // Up and down is counted from where the hand took the star and what Width was then.
      const from = hold ?? {}
      const fromY = (from.y ??= y)
      const fromWidth = (from.width ??= view.value('width'))
      return {
        span:
          !span || Math.abs(toX - x) < 1e-6
            ? view.value('span')
            : denormalizeParam(span, ((toX - scale.x0) / room - NEAR) / (FAR - NEAR)),
        width:
          Math.abs(toY - fromY) < 1e-6
            ? fromWidth
            : // Plus nought: the middle line is no width, and never a nought with a minus.
              clamp(fromWidth + (toY - fromY) / travel, width?.min ?? 0, width?.max ?? 1) + 0,
      }
    },
    wheel: (steps) => ({ stars: clamp(starsOf(view) + (steps > 0 ? 1 : -1), 1, PLACES) }),
    reset: () => ({
      span: span?.default ?? view.value('span'),
      width: width?.default ?? view.value('width'),
    }),
  }
}

function ring(frame: DisplayFrame, x: number, y: number, radius: number, alpha: number): void {
  const { ctx } = frame
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = frame.colours.ink
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

function disc(
  frame: DisplayFrame,
  x: number,
  y: number,
  radius: number,
  colour: string,
  alpha: number,
): void {
  const { ctx } = frame
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

const sky = plateDisplay<SkyState>({
  place: 'strip',
  params: ['span', 'stars', 'pattern', 'shuffle', 'fade', 'again', 'tone', 'drift', 'width', 'mix'],
  live: { signal: true, meters: true },
  info: 'The sky: time runs right across one span and on into the passes Again makes, left is up, and a dot is as big as its star is loud. A star lights as the sound reaches it. Drag the last star across for Span, up or down for Width, and turn the wheel on it for Stars. The wander of Drift is drawn large.',
  init: () => ({ past: new History(PAST_SEC, PAST_SEC * SLOTS_PER_SEC, 0, 'max') }),
  draw(frame) {
    const { ctx, colours } = frame
    const box = ground(frame)
    const scale = scaleOf(frame)
    const { x0, mid, reach } = scale
    const right = box.x + box.w

    const spanMs = frame.value('span')
    // The span the device stands on now: on its way to the knob while it glides.
    const reading = frame.hasMeter('span') ? frame.meter('span') : 0
    const nowMs = reading >= 1 ? reading : spanMs
    const spanSec = nowMs / 1000
    const across = scale.across * clamp(nowMs / spanMs, 0.02, 50)
    const stars = starsOf(frame)
    const field = skyOf(patternOf(frame), seedOf(frame))
    const fade = frame.value('fade')
    const again = frame.value('again')
    const tone = frame.value('tone')
    const drift = frame.value('drift')
    const width = frame.value('width')
    // Equal power: what Mix lets out of the stars.
    const wet = Math.sin((frame.value('mix') * Math.PI) / 2)
    const levels = starLevels(field, stars, fade)
    const share = againShare(again)
    const clock = frame.meter('clock') / DRIFT_PERIOD_SEC

    const running = frame.powered && frame.signal !== null
    const past = frame.state.past
    if (running && frame.signal) {
      past.push(frame.now, (frame.signal.input ?? frame.signal.output).peak)
    }
    /** How loud the sound was that went in `seconds` ago: the loudest of the moments about it. */
    const heard = (seconds: number): number => {
      if (!running || seconds < 0 || seconds >= PAST_SEC - 0.1) return 0
      const slot = Math.round(seconds * SLOTS_PER_SEC)
      let most = 0
      for (let back = Math.max(0, slot - 1); back <= slot + 2; back++)
        most = Math.max(most, past.at(back))
      return Number.isFinite(most) ? most : 0
    }

    clipped(ctx, box, () => {
      // The sound on its way: what went in so long ago stands so far to the right.
      if (running && wet > 0) {
        for (let x = x0; x < right; x += 2) {
          const level = heard(((x + 1 - x0) / across) * spanSec)
          if (level < 0.004) continue
          ctx.globalAlpha = GLOW_INK * Math.sqrt(Math.min(1, level))
          ctx.fillStyle = colours.accent
          ctx.fillRect(x, box.y, 2, box.h)
        }
        ctx.globalAlpha = 1
      }

      // The middle, the note, and the end of each pass of the sky.
      rule(ctx, box.x, mid, right, mid, { colour: colours.ink, alpha: INK.grid })
      rule(ctx, x0, box.y, x0, box.y + box.h, { colour: colours.ink, alpha: INK.rule })
      for (let pass = 1; x0 + pass * across < right; pass++) {
        const x = x0 + pass * across
        rule(ctx, x, box.y, x, box.y + box.h, {
          colour: colours.ink,
          alpha: pass === 1 ? INK.rule : INK.grid,
          dash: [2, 2],
        })
      }
      // Seconds along the foot, and tenths where they are wide enough to count.
      const perSecond = across / spanSec
      const foot = box.y + box.h
      if (perSecond >= 6) {
        for (let n = 1; x0 + n * perSecond < right; n++) {
          const x = x0 + n * perSecond
          rule(ctx, x, foot - 3, x, foot, { colour: colours.ink, alpha: INK.back })
        }
      }
      if (perSecond >= 60) {
        for (let n = 1; x0 + (n * perSecond) / 10 < right; n++) {
          if (n % 10 === 0) continue
          const x = x0 + (n * perSecond) / 10
          rule(ctx, x, foot - 1.5, x, foot, { colour: colours.ink, alpha: INK.rule })
        }
      }

      for (let k = 0; k < PLACES; k++) {
        const time = field.time[k]
        const y = mid + field.pan[k] * width * reach
        const wander = driftSeconds(drift, time, spanSec, driftAt(k, clock))
        // The wander is a few milliseconds: drawn as it is it would not move a pixel.
        const nudge = (wander / DRIFT_SEC) * WOBBLE_PX
        if (k >= stars) {
          ring(frame, x0 + time * across, y, RING, INK.rule)
          continue
        }
        const corner = starCorner(tone, fadeShare(fade, time), field.mag[k])
        const bright = clamp(
          Math.log(corner / DARKEST_HZ) / Math.log(BRIGHTEST_HZ / DARKEST_HZ),
          0,
          1,
        )
        const ink = lerp(DARK_INK, 1, bright)
        // This pass and the ones Again makes of it, each a span later and as much lower;
        // the first is lower by the share the passes take of the level.
        let level = levels[k] * wet * share
        for (let pass = 0; pass < 24; pass++) {
          const x = x0 + (pass + time) * across + nudge
          if (x - scale.grow - DOT_LEAST > right) break
          if (pass > 0 && level < FAINT) break
          if (level < FAINT) {
            // Lit, and not let out: Mix is down. The place is still there to read.
            ring(frame, x, y, RING + 0.6, INK.back)
            break
          }
          const radius = DOT_LEAST + scale.grow * Math.sqrt(Math.min(1, level))
          disc(frame, x, y, radius, colours.ink, ink)
          const lit = Math.sqrt(Math.min(1, heard((pass + time) * spanSec)))
          if (lit > 0.06) {
            disc(frame, x, y, radius + 1.5, colours.accent, 0.35 * lit)
            disc(frame, x, y, radius, colours.accent, lit)
          }
          level *= again
        }
      }
    })

    // The last star is the point: its ring stands round its dot, where Span will have it.
    const point = lastStar(frame)
    const own = levels[0] * wet * share
    const radius = own < FAINT ? 0 : DOT_LEAST + scale.grow * Math.sqrt(Math.min(1, own))
    handle(frame, point.x, point.y, {
      hot: frame.hot === POINT,
      radius: Math.max(3.5, radius + 2),
    })
    if (radius > 0) {
      const corner = starCorner(tone, fadeShare(fade, 1), 1)
      const bright = clamp(
        Math.log(corner / DARKEST_HZ) / Math.log(BRIGHTEST_HZ / DARKEST_HZ),
        0,
        1,
      )
      disc(frame, point.x, point.y, radius, colours.ink, lerp(DARK_INK, 1, bright))
      const lit = Math.sqrt(Math.min(1, heard(spanSec)))
      if (lit > 0.06) disc(frame, point.x, point.y, radius, colours.accent, lit)
    }
    label(frame, spanText(nowMs), right - 1, box.y + 8, 'right')
  },
  handles: (view) => [lastStar(view)],
})

export const CONSTELLATION_FACES: Readonly<Record<string, PlateFace>> = {
  constellation: { display: sky, face: ['span', 'stars', 'again', 'mix'] },
}
