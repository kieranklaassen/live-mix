// Melt's display: pitch against age. A sound comes in at the left, waits out
// Solid as it was played, and from that corner on droops (or lifts) to the
// right as it rings: the line is where its pitch has got to, the band round
// the line how far it has smeared, and both fade as it dies away. The line is
// the highs and the band the lows, so Dim shows as the one going before the
// other. What is lit is the sound that is in the tail now, each stretch
// placed by how long ago it came in.
//
// Every number here is the device's own (`cpp/devices/melt/melt.h`): a line
// of the network moves the pitch, takes off level and colour, and smears, in
// proportion to its own length, so all of them are functions of age.

import {
  History,
  INK,
  clamp,
  crisp,
  fillRect,
  ground,
  handle,
  label,
  rule,
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

// --- The device's numbers, from melt.h --------------------------------------

/** kLineSeconds: the four lines at Size's middle scale. */
export const MELT_LINE_SEC = [0.0437, 0.0539, 0.0613, 0.0719] as const
/** kMinScale and kMaxScale: what Size runs the lines between. */
export const MELT_MIN_SCALE = 0.45
export const MELT_MAX_SCALE = 4.5
/** kTravelShare: how far a line's head slides before it hands over, as a share of the line. */
export const MELT_TRAVEL_SHARE = 0.4
/** kAllpassSeconds and kBlurGain: the allpass in each line, and its gain at Blur 1. */
export const MELT_ALLPASS_SEC = [0.0071, 0.0097, 0.0119, 0.0137] as const
export const MELT_BLUR_GAIN = 0.7
/** kDimDbPerSecond: what Dim at 1 takes off its side of the spectrum, in dB a second. */
export const MELT_DIM_DB_PER_SEC = 36
/** kTurnCents: Sag from minus this to plus this cross-fades Dim from the highs to the lows. */
export const MELT_TURN_CENTS = 10
/** kTideShare and kOwnShare: how much of the rate Drip's two drifts move at Drip 1. */
export const MELT_TIDE_SHARE = 1.4
export const MELT_OWN_SHARE = 0.5

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/** Where the tail's pitch is, in cents, once a sound has rung for `rung` seconds past Solid. */
export const meltCents = (sag: number, rung: number): number => sag * Math.max(0, rung)

/** The tail's level then, in dB: Hold is its time to 60 dB down. */
export const meltLevelDb = (hold: number, rung: number): number =>
  (-60 * Math.max(0, rung)) / Math.max(hold, 1e-3)

/**
 * What Dim takes off on top of that, in dB a second: `dark` off the highs,
 * `thin` off the lows. A sinking tail darkens, a rising one thins, and round
 * Sag 0 the two cross-fade.
 */
export function meltColour(sag: number, dim: number): { dark: number; thin: number } {
  const whole = MELT_DIM_DB_PER_SEC * dim * dim
  const down = clamp(0.5 - sag / (2 * MELT_TURN_CENTS), 0, 1)
  return { dark: whole * down, thin: whole * (1 - down) }
}

/**
 * How long one trip round the network takes at this Size, in seconds: the
 * mean of the four lines, each with its head half way along its travel and
 * its allpass.
 */
export function meltPassSec(size: number): number {
  const scale = MELT_MIN_SCALE * Math.pow(MELT_MAX_SCALE / MELT_MIN_SCALE, clamp(size, 0, 1))
  return mean(MELT_LINE_SEC) * scale * (1 + MELT_TRAVEL_SHARE / 2) + mean(MELT_ALLPASS_SEC)
}

/**
 * How far one pass through line `line` spreads a click, in seconds: the
 * second moment of its allpass's response about its mean delay, which for a
 * length M and a gain g is M g sqrt(2 / (1 - g squared)).
 */
export function meltAllpassSmearSec(line: number, blur: number): number {
  const gain = MELT_BLUR_GAIN * clamp(blur, 0, 1)
  return MELT_ALLPASS_SEC[line] * gain * Math.sqrt(2 / (1 - gain * gain))
}

/**
 * How far a sound is smeared that has passed line n `passes[n]` times, in
 * seconds. An allpass holds each pitch back by its own amount, the same on
 * every pass, so the passes through one line add as they are (twice through
 * it is twice the spread); different lines hold back different pitches, and
 * their spreads add as squares.
 */
export function meltWaySmearSec(passes: readonly number[], blur: number): number {
  let squares = 0
  passes.forEach((count, line) => {
    squares += (count * meltAllpassSmearSec(line, blur)) ** 2
  })
  return Math.sqrt(squares)
}

/**
 * How far the allpasses have smeared a sound after `rung` seconds, in
 * seconds. By then it has made N = rung / pass trips, each through one of
 * the four lines as the mixing falls, so it has passed each line N / 4 times
 * give or take: the mean square of that count is N squared / 16 + 3 N / 16.
 * The smear of the ways it can have taken, by `meltWaySmearSec`, is then
 * the root of the lines' mean square spread times (N squared + 3 N) / 4. It
 * is one line's spread after one trip and grows in step with age after
 * that, not as its root.
 */
export function meltSmearSec(rung: number, size: number, blur: number): number {
  const trips = Math.max(0, rung) / meltPassSec(size)
  const square = mean(MELT_ALLPASS_SEC.map((_, line) => meltAllpassSmearSec(line, blur) ** 2))
  return Math.sqrt((square * (trips * trips + 3 * trips)) / 4)
}

/** The furthest Drip can take the rate from what Sag says, as a share of it: the rate stays between none and twice. */
export const meltReach = (drip: number): number =>
  Math.min(1, clamp(drip, 0, 1) * (MELT_TIDE_SHARE + MELT_OWN_SHARE))

// --- The scales --------------------------------------------------------------

/** The oldest sound on the picture: the longest Solid and the longest Hold, in seconds. */
export const MELT_AGE_MOST = 21
/** The age scale is even up to about here and then draws in, so Solid has room beside twenty seconds of Hold. */
const AGE_KNEE = 0.6
/** The furthest a tail can slide before it is gone: the most Sag for the longest Hold, in cents. */
export const MELT_CENTS_MOST = 2000
/** The pitch scale is even up to about here and then draws in, so a few cents show beside an octave and a half. */
const CENTS_KNEE = 25

const AGE_SPAN = Math.log1p(MELT_AGE_MOST / AGE_KNEE)
const CENTS_SPAN = Math.asinh(MELT_CENTS_MOST / CENTS_KNEE)

/** The picture's own box: inside the ground, with room for a point to stand whole at either end. */
export function meltPlot(view: Pick<DisplayView, 'width' | 'height'>): Box {
  return { x: 9, y: 7, w: Math.max(8, view.width - 19), h: Math.max(8, view.height - 14) }
}

/** Where a sound so old stands across the plot. */
export const meltX = (plot: Box, age: number): number =>
  plot.x + (plot.w * Math.log1p(clamp(age, 0, MELT_AGE_MOST) / AGE_KNEE)) / AGE_SPAN

/** The age that stands there. */
export const meltAgeAt = (plot: Box, x: number): number =>
  AGE_KNEE * Math.expm1(clamp((x - plot.x) / plot.w, 0, 1) * AGE_SPAN)

/** Where a pitch so many cents from the played one stands: up is sharp, the played pitch in the middle. */
export const meltY = (plot: Box, cents: number): number =>
  plot.y +
  (plot.h / 2) *
    (1 - Math.asinh(clamp(cents, -MELT_CENTS_MOST, MELT_CENTS_MOST) / CENTS_KNEE) / CENTS_SPAN)

/** The cents that stand there. */
export const meltCentsAt = (plot: Box, y: number): number =>
  CENTS_KNEE * Math.sinh(clamp(1 - (y - plot.y) / (plot.h / 2), -1, 1) * CENTS_SPAN)

/** The pitches ruled across the picture, in cents from the played one, and the ages ticked along it, in seconds. */
export const MELT_PITCH_MARKS = [-1200, -100, 100, 1200] as const
export const MELT_AGE_MARKS = [1, 5, 20] as const

/** How strongly a level is drawn: full at 0 dB, gone at 60 dB down, which is where the tail ends. */
export const meltShown = (db: number): number => clamp(1 + db / 60, 0, 1)

/** The smear at which the band is as wide as it gets, in seconds, and how wide that is, as a share of the plot's height each way. */
export const MELT_SMEAR_FULL_SEC = 0.25
export const MELT_BAND_SHARE = 0.24
/** Half the band's width in pixels for a smear: by the smear, up to its widest. */
export const meltBand = (plot: Box, smearSec: number): number =>
  plot.h * MELT_BAND_SHARE * clamp(smearSec / MELT_SMEAR_FULL_SEC, 0, 1)

/** How much of the line is left when none of the tail is in the mix: its shape is still there to read. */
export const MELT_UNHEARD = 0.35
/** How strongly the band is laid at full level, against the line. */
export const MELT_BAND_INK = 0.6
/** Half the line's thickness, and half the lit line's, in pixels. */
export const MELT_LINE_HALF = 0.8
export const MELT_LIT_HALF = 1.3
/** How far the dry sound's mark stands either side of the played pitch at Mix 0, as a share of the plot's height, over the 2 px it always has. */
export const MELT_DRY_SHARE = 0.16
/** A sound this loud is lit in full, and one 54 dB under it not at all. */
const LIT_TOP_DB = -6
const LIT_RANGE_DB = 54
export const meltLit = (level: number): number =>
  level > 1e-6 ? clamp(1 + (20 * Math.log10(level) - LIT_TOP_DB) / LIT_RANGE_DB, 0, 1) : 0

/** The past the display keeps: as old as the oldest sound it can show, a slot every 50 ms. */
const PAST_SEC = MELT_AGE_MOST
const SLOTS = 420
const SLOT_SEC = PAST_SEC / SLOTS

interface MeltState {
  /** The level that came in. */
  heard: History
  /** The rate the device said it was sliding at, against Sag: 1 is as set. */
  rate: History
  /** For each slot back from now, how many seconds' worth of Sag the tail has slid since. */
  slid: Float32Array
}

/**
 * One stretch of the tail as a filled shape: from one point to the next, so
 * far above and below each, kept between `top` and `foot`. Stretches laid end
 * to end meet without the beads that stroked pieces leave where their round
 * ends overlap.
 */
function ribbon(
  ctx: DisplayFrame['ctx'],
  from: Point,
  to: Point,
  fromHalf: number,
  toHalf: number,
  colour: string,
  alpha: number,
  top: number,
  foot: number,
): void {
  ctx.beginPath()
  ctx.moveTo(from[0], clamp(from[1] - fromHalf, top, foot))
  ctx.lineTo(to[0], clamp(to[1] - toHalf, top, foot))
  ctx.lineTo(to[0], clamp(to[1] + toHalf, top, foot))
  ctx.lineTo(from[0], clamp(from[1] + fromHalf, top, foot))
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

const centsText = (cents: number): string => {
  const whole = Math.round(cents)
  return `${whole > 0 ? '+' : whole < 0 ? '−' : ''}${Math.abs(whole)} ct`
}
const secondsText = (seconds: number): string =>
  seconds < 9.95 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s`

/** What the picture is set to, in the units it is drawn in. */
function settings(view: DisplayView) {
  return {
    sag: view.value('sag'),
    hold: view.value('hold'),
    solid: view.value('solid') / 1000,
    size: view.value('size'),
    blur: view.value('blur'),
    dim: view.value('dim'),
    drip: view.value('drip'),
    mix: view.value('mix'),
  }
}

/**
 * The two points: the end of the line, where the tail is gone (across is
 * Hold, up and down how far it has slid by then, which with Hold is Sag), and
 * the corner where the melt starts (Solid). Both stand where the settings put
 * them, so they hold still while Drip moves the line.
 */
function meltHandles(view: DisplayView): DisplayHandle[] {
  const plot = meltPlot(view)
  const { sag, hold, solid } = settings(view)
  const sagSpec = view.spec('sag')
  const holdSpec = view.spec('hold')
  const solidSpec = view.spec('solid')
  const endX = meltX(plot, solid + hold)
  const endY = meltY(plot, meltCents(sag, hold))
  return [
    {
      key: 'end',
      name: 'Sag and Hold',
      x: endX,
      y: endY,
      drag: (toX, toY) => {
        if (Math.abs(toX - endX) < 1e-6 && Math.abs(toY - endY) < 1e-6) return { sag, hold }
        // The tail ends under the hand: so old, and so far from where it began.
        const held = clamp(meltAgeAt(plot, toX) - solid, holdSpec?.min ?? 0.4, holdSpec?.max ?? 20)
        return {
          hold: held,
          sag: clamp(meltCentsAt(plot, toY) / held, sagSpec?.min ?? -100, sagSpec?.max ?? 100),
        }
      },
      reset: () => ({ sag: sagSpec?.default ?? sag, hold: holdSpec?.default ?? hold }),
    },
    {
      key: 'solid',
      name: 'Solid',
      x: meltX(plot, solid),
      y: meltY(plot, 0),
      drag: (toX) => ({
        solid: clamp(meltAgeAt(plot, toX) * 1000, solidSpec?.min ?? 0, solidSpec?.max ?? 1000),
      }),
      reset: () => ({ solid: solidSpec?.default ?? solid * 1000 }),
    },
  ]
}

/**
 * The marks of the two scales: the played pitch, a semitone and an octave
 * either way, and 1, 5 and 20 seconds. The seconds stand on the edge the tail
 * heads for, the foot for one that sinks and the top for one that lifts,
 * which leaves the other edge to the words.
 */
function drawScale(frame: DisplayFrame, plot: Box, lifts: boolean): void {
  const { ctx, colours } = frame
  const right = plot.x + plot.w
  for (const cents of MELT_PITCH_MARKS) {
    const y = meltY(plot, cents)
    rule(ctx, plot.x, y, right, y, { colour: colours.ink, alpha: INK.grid })
  }
  const middle = meltY(plot, 0)
  rule(ctx, plot.x, middle, right, middle, { colour: colours.ink, alpha: INK.rule })
  const edge = lifts ? plot.y : plot.y + plot.h
  for (const age of MELT_AGE_MARKS) {
    const x = meltX(plot, age)
    rule(ctx, x, edge - 3, x, edge + 3, { colour: colours.ink, alpha: INK.back })
  }
}

const melt = plateDisplay<MeltState>({
  place: 'strip',
  params: ['sag', 'hold', 'solid', 'size', 'blur', 'dim', 'drip', 'mix'],
  live: { meters: true, signal: true, settle: PAST_SEC + 1 },
  info: 'Pitch against age. A sound waits out Solid at the left, then droops or lifts as it rings: the line is its highs, the band its lows and its blur, and both fade with its level. Lit is the sound in the tail now. Drag the end for Sag and Hold, the corner for Solid.',
  init: () => ({
    heard: new History(PAST_SEC, SLOTS, 0, 'max'),
    rate: new History(PAST_SEC, SLOTS, 1),
    slid: new Float32Array(SLOTS + 1),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const plot = meltPlot(frame)
    const { sag, hold, solid, size, blur, dim, drip, mix } = settings(frame)
    const wet = Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)
    const dry = Math.cos((clamp(mix, 0, 1) * Math.PI) / 2)
    const colour = meltColour(sag, dim)
    const middle = meltY(plot, 0)
    const signal = frame.powered ? frame.signal : null

    // The past: what came in, and how fast the device said the tail was sliding.
    if (signal) {
      const level = (signal.input ?? signal.output).rms
      state.heard.push(frame.now, Number.isFinite(level) ? level : 0)
      const wander = frame.hasMeter('wander') ? frame.meter('wander') : 0
      state.rate.push(frame.now, Number.isFinite(wander) ? clamp(1 + wander, 0, 2) : 1)
      let sum = 0
      for (let back = 0; back < SLOTS; back++) {
        state.slid[back] = sum
        sum += state.rate.at(back) * SLOT_SEC
      }
      state.slid[SLOTS] = sum
    }
    /** How many seconds' worth of Sag a sound has slid that entered the lines `rung` seconds ago. */
    const slidOver = (rung: number): number => {
      if (!signal) return rung
      const at = clamp(rung / SLOT_SEC, 0, SLOTS)
      const whole = Math.min(SLOTS - 1, Math.floor(at))
      return state.slid[whole] + (state.slid[whole + 1] - state.slid[whole]) * (at - whole)
    }

    drawScale(frame, plot, sag > 0)

    // Drip's reach: the tail falls somewhere between these two.
    const reach = meltReach(drip)
    if (reach > 0 && sag !== 0) {
      for (const factor of [1 - reach, 1 + reach]) {
        const points: Point[] = []
        for (let n = 0; n <= 24; n++) {
          const rung = (hold * n) / 24
          points.push([meltX(plot, solid + rung), meltY(plot, meltCents(sag * factor, rung))])
        }
        trace(ctx, points, { colour: colours.ink, width: 1, alpha: INK.rule, dash: [1, 3] })
      }
    }

    // The sound as it was played, waiting out Solid: not heard from the tail yet.
    const cornerX = meltX(plot, solid)
    if (cornerX - plot.x > 0.5) {
      rule(ctx, plot.x, middle, cornerX, middle, { colour: colours.ink, alpha: INK.back, width: 2 })
    }

    // The tail, in stretches about 3 px long: the band (lows, as wide as the
    // smear), the line (highs), and over them what is sounding there now.
    const endX = meltX(plot, solid + hold)
    const count = Math.round(clamp((endX - cornerX) / 3, 6, 96))
    const xs: number[] = []
    const ys: number[] = []
    const halves: number[] = []
    for (let n = 0; n <= count; n++) {
      // Whole pixels between the two ends, so neighbours share an edge exactly.
      const along = cornerX + ((endX - cornerX) * n) / count
      const x = n === 0 || n === count ? along : Math.round(along)
      const rung = Math.max(0, meltAgeAt(plot, x) - solid)
      xs.push(x)
      ys.push(meltY(plot, meltCents(sag, slidOver(rung))))
      halves.push(meltBand(plot, meltSmearSec(rung, size, blur)))
    }
    const shown = MELT_UNHEARD + (1 - MELT_UNHEARD) * wet
    // The band stays inside the ground's own line.
    const top = 1.5
    const foot = frame.height - 1.5
    for (let n = 0; n < count; n++) {
      const rung = Math.max(0, meltAgeAt(plot, (xs[n] + xs[n + 1]) / 2) - solid)
      const level = meltLevelDb(hold, rung)
      const lows = meltShown(level - colour.thin * rung)
      const highs = meltShown(level - colour.dark * rung)
      const from: Point = [xs[n], ys[n]]
      const to: Point = [xs[n + 1], ys[n + 1]]
      const band = MELT_BAND_INK * shown * lows
      if (band > 0.01 && (halves[n] > MELT_LINE_HALF || halves[n + 1] > MELT_LINE_HALF)) {
        ribbon(ctx, from, to, halves[n], halves[n + 1], colours.ink, band, top, foot)
      }
      const line = shown * highs
      if (line > 0.01) {
        ribbon(ctx, from, to, MELT_LINE_HALF, MELT_LINE_HALF, colours.ink, line, top, foot)
      }
      if (signal) {
        // The sound that came in so long ago, as loud as the tail still has it.
        const back = Math.round((solid + rung) / SLOT_SEC)
        const lit =
          back < SLOTS
            ? wet * meltLit(state.heard.at(back) * Math.pow(10, level / 20)) * Math.max(lows, highs)
            : 0
        if (lit > 0.02) {
          ribbon(ctx, from, to, MELT_LIT_HALF, MELT_LIT_HALF, colours.accent, lit, top, foot)
        }
      }
    }

    // The dry sound: now, at the pitch it is played, as much of it as Mix leaves.
    const stub = 2 + plot.h * MELT_DRY_SHARE * dry
    fillRect(
      ctx,
      { x: crisp(plot.x) - 1.5, y: middle - stub, w: 2, h: 2 * stub },
      colours.ink,
      INK.text,
    )
    if (signal) {
      const now = meltLit((signal.input ?? signal.output).rms) * dry
      if (now > 0.02) {
        fillRect(
          ctx,
          { x: crisp(plot.x) - 1.5, y: middle - stub, w: 2, h: 2 * stub },
          colours.accent,
          now,
        )
      }
    }

    // In words, on the side the tail does not go to: how far it slides in
    // how long, or Solid while its corner is in hand.
    const words =
      frame.hot === 'solid'
        ? `${Math.round(solid * 1000)} ms`
        : `${centsText(meltCents(sag, hold))} in ${secondsText(hold)}`
    label(frame, words, plot.x + plot.w + 3, sag > 0 ? plot.y + plot.h + 3 : plot.y + 4, 'right')

    for (const point of meltHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: meltHandles,
})

export const MELT_FACES: Readonly<Record<string, PlateFace>> = {
  melt: {
    display: melt,
    face: ['sag', 'hold', 'blur', 'mix'],
  },
}
