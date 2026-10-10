// The display of the Prism: when each colour of the sound comes back.
//
// Frequency runs upward and the wait runs across, on a scale of equal ratios
// from 10 ms to 10 s. The line is the device's own curve: the delay of every
// row of the picture by the formula of `cpp/devices/prism/prism.h`, read as
// the device reads it: at the middle of the strip of the spectrum the row lies
// in, so the lowest notes are seen to share one wait. Right of
// it stand the repeats, each a whole wait later and as much fainter as
// Feedback and Tilt make that colour by then. While sound runs, what went in
// is drawn where it is by now: so long ago across, so strong, octave by
// octave from the device's seven readings. It travels to the right, and where
// it meets a line it is coming out at that moment, in the second colour.
//
// The device throws a sound forward when it goes in, so a sound keeps the
// wait the curve gave it then. The display keeps the curve with each reading
// for the same reason: a knob turned moves only what comes after.

import {
  INK,
  TEXT_LEAST,
  clamp,
  clipped,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  trace,
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

// --- The device's numbers: `cpp/devices/prism/prism.h` ----------------------

/** `kLowHz` and `kOctaves`: the curve runs over seven octaves from 60 Hz; below and above, the ends go on. */
export const PRISM_LOW_HZ = 60
export const PRISM_OCTAVES = 7
/** `kFirstShare`: with Fan whole the first colour comes at an eighth of Time. */
export const PRISM_FIRST_SHARE = 0.125
/** `kLeastSeconds`: no colour comes sooner than this. */
export const PRISM_LEAST_SEC = 0.024
/**
 * `kStripHz`, `kStripBins` and the frame of `Stft<2048, 512>`: the curve is
 * read at the middle of a strip so wide, or four bins of the frame where that
 * is more, and everything under two strips' width is the first colour.
 */
export const PRISM_STRIP_HZ = 100
export const PRISM_STRIP_BINS = 4
export const PRISM_FRAME = 2048
/** The rate the points are worked out at when no one says: a strip is 100 Hz wide at every rate up to 51.2 kHz. */
export const PRISM_NOMINAL_RATE = 48000
/** `kBendBase`: Bend raises the order to the power 4 to the minus Bend. */
export const PRISM_BEND_BASE = 4
/** `kTiltDb`, `kDarkFromHz`, `kThinFromHz`: what a pass loses per octave, above 250 Hz one way and under 4 kHz the other. */
export const PRISM_TILT_DB = 6
export const PRISM_DARK_FROM_HZ = 250
export const PRISM_THIN_FROM_HZ = 4000
/** `Stft<2048, 512>`: a repeat comes a whole number of hops of 512 samples after the one before. */
export const PRISM_HOP = 512
/** `kZones`: the readings `flow1` to `flow7`, an octave of the curve's axis each. */
export const PRISM_ZONES = 7
export const PRISM_METERS = ['flow1', 'flow2', 'flow3', 'flow4', 'flow5', 'flow6', 'flow7'] as const

/** The settings the curve is made from, in the parameters' own units. */
export interface PrismSettings {
  /** Milliseconds. */
  time: number
  fan: number
  /** 0 Rising, 1 Falling, 2 Peak, 3 Valley, 4 Scatter. */
  shape: number
  bend: number
  bands: number
  smear: number
  shuffle: number
  feedback: number
  tilt: number
}

/** Where a frequency lies along the axis run on past its ends: 0 at 60 Hz, 1 seven octaves up. */
export const prismAxis = (hz: number): number =>
  Math.log2(Math.max(hz, 1e-3) / PRISM_LOW_HZ) / PRISM_OCTAVES

/** Where a frequency lies on the curve's axis: 0 at 60 Hz, 1 seven octaves up, and held there beyond. */
export const prismPlace = (hz: number): number => clamp(prismAxis(hz), 0, 1)

/** The frequency at a place on the axis, on past its two ends. */
export const prismHz = (place: number): number => PRISM_LOW_HZ * Math.pow(2, PRISM_OCTAVES * place)

/** `Prism::strip_width`: how wide a strip is at a sample rate, in Hz. */
export const prismStripWidth = (sampleRate: number): number =>
  Math.max(PRISM_STRIP_HZ, (PRISM_STRIP_BINS * sampleRate) / PRISM_FRAME)

/** `Prism::strip_hz`: the frequency the curve is read at for a frequency, the middle of its strip. */
export function prismStripHz(hz: number, sampleRate: number): number {
  const width = prismStripWidth(sampleRate)
  return hz < 2 * width ? PRISM_LOW_HZ : (Math.floor(hz / width) + 0.5) * width
}

/**
 * `place_` in `Prism::init`: where on the axis the curve is read for a place
 * on it, which may lie past the axis's ends as the picture's rows do.
 */
export const prismStripPlace = (place: number, sampleRate: number): number =>
  prismPlace(prismStripHz(prismHz(place), sampleRate))

const wholeBands = (bands: number): number => clamp(Math.round(bands), 2, 48)

/**
 * Scatter's deal, as `Prism::rebuild` makes it: the bands take the evenly
 * spaced orders 0 to 1, shuffled by `kit::Rng` (a 32-bit xorshift) seeded
 * from the Shuffle number. The order of each band, lowest band first.
 */
export function prismDeal(bands: number, shuffle: number): number[] {
  const count = wholeBands(bands)
  const deal = Array.from({ length: count }, (_, band) => band)
  let state = (Math.imul(0x9e3779b9, Math.round(shuffle)) + 0x7f4a7c15) >>> 0
  if (state === 0) state = 0x2545f491
  for (let band = count - 1; band > 0; band--) {
    state = (state ^ (state << 13)) >>> 0
    state = (state ^ (state >>> 17)) >>> 0
    state = (state ^ (state << 5)) >>> 0
    const other = state % (band + 1)
    const kept = deal[band]
    deal[band] = deal[other]
    deal[other] = kept
  }
  return deal.map((order) => order / (count - 1))
}

/**
 * `Prism::order_at` before Bend: the order of arrival, 0 first to 1 last, of
 * a place on the axis. Bands cuts the axis into steps, Smear lets the place
 * run on between them, the Shape says which end comes first.
 */
export function prismBase(
  place: number,
  settings: PrismSettings,
  deal?: readonly number[],
): number {
  const bands = wholeBands(settings.bands)
  const steps = bands - 1
  const u = clamp(place, 0, 1)
  const step = Math.floor(u * steps + 0.5) / steps
  const at = step + clamp(settings.smear, 0, 1) * (u - step)
  const shape = clamp(Math.round(settings.shape), 0, 4)
  let base = at
  if (shape === 1) base = 1 - at
  else if (shape === 2) base = 1 - Math.abs(2 * at - 1)
  else if (shape === 3) base = Math.abs(2 * at - 1)
  else if (shape === 4) {
    const orders = deal ?? prismDeal(bands, settings.shuffle)
    const position = at * steps
    const below = clamp(Math.floor(position), 0, bands - 2)
    base = orders[below] + (orders[below + 1] - orders[below]) * (position - below)
  }
  return clamp(base, 0, 1)
}

/** The power Bend raises the order to: 1 at the middle, a quarter and four at its ends. */
export const prismPower = (bend: number): number => Math.pow(PRISM_BEND_BASE, -bend)

/** `Prism::order_at`: the order of arrival of a place, bent. */
export const prismOrder = (
  place: number,
  settings: PrismSettings,
  deal?: readonly number[],
): number => Math.pow(prismBase(place, settings, deal), prismPower(settings.bend))

/** The wait of a colour that arrives in that order, in seconds, before the device's floor. */
export const prismWaitOf = (order: number, settings: PrismSettings): number =>
  (settings.time / 1000) * (1 - clamp(settings.fan, 0, 1) * (1 - PRISM_FIRST_SHARE) * (1 - order))

/**
 * `Prism::rebuild`: how long a frequency waits, in seconds. The order is that
 * of the strip the frequency lies in.
 */
export const prismDelayOfHz = (
  hz: number,
  settings: PrismSettings,
  deal?: readonly number[],
  sampleRate: number = PRISM_NOMINAL_RATE,
): number =>
  Math.max(
    PRISM_LEAST_SEC,
    prismWaitOf(prismOrder(prismPlace(prismStripHz(hz, sampleRate)), settings, deal), settings),
  )

/** How long a place on the axis waits, in seconds: a row of the picture, or a point on it. */
export const prismDelaySec = (
  place: number,
  settings: PrismSettings,
  deal?: readonly number[],
  sampleRate: number = PRISM_NOMINAL_RATE,
): number => prismDelayOfHz(prismHz(place), settings, deal, sampleRate)

/**
 * `Prism::rebuild`: what is left of a colour after one more pass. Feedback,
 * less what Tilt takes: 6 dB an octave above 250 Hz at one end, 6 dB an
 * octave under 4 kHz at the other. Never a gain.
 */
export function prismLoopGain(hz: number, feedback: number, tilt: number): number {
  let lostDb = 0
  if (tilt < 0) lostDb = -tilt * PRISM_TILT_DB * Math.max(0, Math.log2(hz / PRISM_DARK_FROM_HZ))
  else lostDb = tilt * PRISM_TILT_DB * Math.max(0, Math.log2(PRISM_THIN_FROM_HZ / hz))
  return clamp(feedback, 0, 1) * Math.pow(10, -lostDb / 20)
}

/**
 * How long after one return of a colour the next one comes: its wait to the
 * nearest whole hop (`hops_` in `Prism::rebuild`), and never under one hop.
 */
export const prismAgainSec = (delaySec: number, sampleRate: number): number =>
  (Math.max(1, Math.floor((delaySec * sampleRate) / PRISM_HOP + 0.5)) * PRISM_HOP) / sampleRate

/** How many times a colour that went in `seconds` ago has come out by now. */
export const prismPassesBy = (seconds: number, delaySec: number, againSec: number): number =>
  seconds < delaySec ? 0 : 1 + Math.floor((seconds - delaySec) / againSec)

/** `kit::equal_power`: the gain Mix gives what the device makes. */
export const prismWet = (mix: number): number => Math.sin(clamp(mix, 0, 1) * (Math.PI / 2))

// --- The picture's two scales -----------------------------------------------

/** The wait runs across on a scale of equal ratios between these two. */
export const PRISM_MIN_SEC = 0.01
export const PRISM_MAX_SEC = 10
const DECADES = Math.log10(PRISM_MAX_SEC / PRISM_MIN_SEC)
/** An octave under 60 Hz and one over 7.7 kHz are in the picture, so the ends are seen to go on. */
export const PRISM_PAD = 1 / PRISM_OCTAVES
/** The strip along the foot where the scale's words stand. */
const FOOT = 10

export interface PrismLayout {
  box: Box
  /** Where the curve is drawn: the wait across, the frequency upward. */
  plot: Box
  /** Rows of the picture: one for each pixel of height, top row first. */
  rows: number
}

export function prismLayout(view: Pick<DisplayView, 'width' | 'height'>): PrismLayout {
  // The box `ground` hands back, worked out without a canvas for the handles.
  const box = { x: 4, y: 4, w: Math.max(8, view.width - 8), h: Math.max(8, view.height - 8) }
  const plot = { x: box.x, y: box.y, w: box.w, h: Math.max(4, box.h - FOOT) }
  return { box, plot, rows: Math.max(2, Math.round(plot.h)) }
}

/** Where a wait lies across the plot, on past its two ends. */
export const prismX = (seconds: number, plot: Box): number =>
  plot.x + (Math.log10(Math.max(seconds, 1e-6) / PRISM_MIN_SEC) / DECADES) * plot.w
export const prismSecAt = (x: number, plot: Box): number =>
  PRISM_MIN_SEC * Math.pow(10, (DECADES * (x - plot.x)) / plot.w)
/** Where a place on the curve's axis lies up the plot. */
export const prismY = (place: number, plot: Box): number =>
  plot.y + plot.h * (1 - (place + PRISM_PAD) / (1 + 2 * PRISM_PAD))
export const prismPlaceAt = (y: number, plot: Box): number =>
  (1 - (y - plot.y) / plot.h) * (1 + 2 * PRISM_PAD) - PRISM_PAD

/** The middle of a row of the picture, top row first; with `per`, of one of so many slices to a row. */
export const prismRowY = (row: number, layout: PrismLayout, per = 1): number =>
  layout.plot.y + ((row + 0.5) / (layout.rows * per)) * layout.plot.h

/** Which of the seven readings a place belongs to: `zone_` in `Prism::init`, the ends taking what lies beyond. */
export const prismZone = (place: number): number =>
  clamp(Math.floor(clamp(place, 0, 1) * PRISM_ZONES), 0, PRISM_ZONES - 1)

function settingsOf(view: Pick<DisplayView, 'value'>): PrismSettings {
  return {
    time: view.value('time'),
    fan: view.value('fan'),
    shape: view.value('shape'),
    bend: view.value('bend'),
    bands: view.value('bands'),
    smear: view.value('smear'),
    shuffle: view.value('shuffle'),
    feedback: view.value('feedback'),
    tilt: view.value('tilt'),
  }
}

// --- The points -------------------------------------------------------------

/**
 * How far Bend can take the wait of a colour of that order (before bending)
 * with Fan whole: the lesser of the two ways, as the logarithm of the ratio of
 * waits, which is distance across the picture. A colour in the middle of the
 * order has nearly three quarters of its way on one side; one that comes at a
 * fifth of the order has as far to go either way.
 */
export function prismBendRoom(base: number): number {
  const wait = (order: number): number => 1 - (1 - PRISM_FIRST_SHARE) * (1 - order)
  const here = wait(base)
  return Math.min(
    Math.log(wait(Math.pow(base, prismPower(1))) / here),
    Math.log(here / wait(Math.pow(base, prismPower(-1)))),
  )
}

/**
 * Where the three points stand on the axis. Each is at the middle of a band,
 * where Smear changes nothing: Time on the band that comes last (the highest
 * of them), Fan on the band that comes first (the lowest), Bend on the band
 * with the most room to be bent both ways (`prismBendRoom`). With no such
 * band (two bands have only a first and a last) Bend stands a quarter of the
 * way up the lowest step, where Smear lets it be bent. A band's order
 * is read where the device reads it, at the middle of the strip the band's
 * middle lies in, so the bands the lowest strip has swallowed count as it.
 */
export function prismPoints(
  settings: PrismSettings,
  deal: readonly number[] = prismDeal(settings.bands, settings.shuffle),
  sampleRate: number = PRISM_NOMINAL_RATE,
): { last: number; first: number; middle: number } {
  const steps = wholeBands(settings.bands) - 1
  let last = 0
  let first = 0
  let middle = -1
  let most = -1
  let least = 2
  let room = 0
  for (let band = 0; band <= steps; band++) {
    const base = prismBase(prismStripPlace(band / steps, sampleRate), settings, deal)
    if (base >= most) {
      most = base
      last = band
    }
    if (base < least) {
      least = base
      first = band
    }
  }
  for (let band = 0; band <= steps; band++) {
    if (band === last || band === first) continue
    const base = prismBase(prismStripPlace(band / steps, sampleRate), settings, deal)
    if (base <= 1e-6 || base >= 1 - 1e-6) continue
    if (prismBendRoom(base) > room + 1e-9) {
      room = prismBendRoom(base)
      middle = band
    }
  }
  return {
    last: last / steps,
    first: first / steps,
    middle: middle < 0 ? 0.25 / steps : middle / steps,
  }
}

/**
 * A point whose setting lies where the picture does not reach is drawn at the
 * picture's edge, and a hand that takes it there moves the setting from where
 * it lies: as far past the hand as it lay at the press, kept in the hold the
 * plate hands to every `drag` of one hand. `standing` is where the point is
 * drawn, `placeOf` where a setting lies on the scale run on past the picture,
 * `settingAt` the setting at a place on it. A hand that has not moved gets
 * the setting back as it was.
 */
function carried(
  hold: DisplayHold | undefined,
  setting: number,
  hand: number,
  standing: number,
  placeOf: (setting: number) => number,
  settingAt: (place: number) => number,
): number {
  const lies = placeOf(setting)
  const kept = hold ?? {}
  kept.past ??= lies - standing
  const to = hand + kept.past
  return Math.abs(to - lies) < 1e-9 ? setting : settingAt(to)
}

function prismHandles(view: DisplayView): DisplayHandle[] {
  const { plot } = prismLayout(view)
  const settings = settingsOf(view)
  const deal = prismDeal(settings.bands, settings.shuffle)
  // A frame knows the rate the device runs at; a hand on the plate goes by the usual one.
  const rate = 'sampleRate' in view ? (view as DisplayFrame).sampleRate : PRISM_NOMINAL_RATE
  const points = prismPoints(settings, deal, rate)
  /** Where the device reads the curve for a point: the middle of its strip. */
  const read = (place: number): number => prismStripPlace(place, rate)
  const seconds = settings.time / 1000
  const spread = clamp(settings.fan, 0, 1) * (1 - PRISM_FIRST_SHARE)
  const range = (name: string, low: number, high: number): [number, number] => [
    view.spec(name)?.min ?? low,
    view.spec(name)?.max ?? high,
  ]
  const standing = (place: number): number =>
    clamp(prismX(prismDelaySec(place, settings, deal, rate), plot), plot.x, plot.x + plot.w)

  // Time: the wait of the band that comes last is put under the hand.
  const lastShare = 1 - spread * (1 - prismOrder(read(points.last), settings, deal))
  const [timeMin, timeMax] = range('time', 30, 4000)
  // Fan: the wait of the band that comes first is put under the hand.
  const firstOrder = prismOrder(read(points.first), settings, deal)
  const reach = (1 - PRISM_FIRST_SHARE) * (1 - firstOrder)
  // Bend: the wait of the band with most room to be bent is put under the hand.
  const base = prismBase(read(points.middle), settings, deal)
  const bends = spread > 1e-6 && base > 1e-6 && base < 1 - 1e-6
  const [bendMin, bendMax] = range('bend', -1, 1)
  const waitAtBend = (bend: number): number =>
    seconds * (1 - spread * (1 - Math.pow(base, prismPower(bend))))

  return [
    {
      key: 'time',
      name: 'Time',
      x: standing(points.last),
      y: prismY(points.last, plot),
      drag: (x, _y, hold) => ({
        time: carried(
          hold,
          settings.time,
          x,
          standing(points.last),
          (time) => prismX((time / 1000) * lastShare, plot),
          (place) => clamp((1000 * prismSecAt(place, plot)) / lastShare, timeMin, timeMax),
        ),
      }),
      reset: () => ({ time: view.spec('time')?.default ?? 600 }),
    },
    {
      key: 'fan',
      name: 'Fan',
      x: standing(points.first),
      y: prismY(points.first, plot),
      drag: (x, _y, hold) => ({
        fan: carried(
          hold,
          settings.fan,
          x,
          standing(points.first),
          (fan) => prismX(seconds * (1 - clamp(fan, 0, 1) * reach), plot),
          (place) =>
            reach > 1e-6
              ? clamp((1 - prismSecAt(place, plot) / seconds) / reach, 0, 1)
              : settings.fan,
        ),
      }),
      reset: () => ({ fan: view.spec('fan')?.default ?? 1 }),
    },
    {
      key: 'bend',
      name: 'Bend',
      x: standing(points.middle),
      y: prismY(points.middle, plot),
      drag: (x, _y, hold) => ({
        bend: bends
          ? carried(
              hold,
              settings.bend,
              x,
              standing(points.middle),
              (bend) => prismX(waitAtBend(bend), plot),
              (place) => {
                // The order that waits so long, then the power that gives the band that order.
                const order = 1 - (1 - prismSecAt(place, plot) / seconds) / spread
                const low = Math.pow(base, prismPower(bendMin))
                const high = Math.pow(base, prismPower(bendMax))
                // Past what bending can do, the end of its range itself.
                if (order <= Math.min(low, high)) return low < high ? bendMin : bendMax
                if (order >= Math.max(low, high)) return low < high ? bendMax : bendMin
                return clamp(
                  -Math.log(Math.log(order) / Math.log(base)) / Math.log(PRISM_BEND_BASE),
                  bendMin,
                  bendMax,
                )
              },
            )
          : settings.bend,
      }),
      // The curve gives Bend little room across, so the wheel sets it finely.
      wheel: (steps) => ({ bend: clamp(settings.bend + 0.05 * steps, bendMin, bendMax) }),
      reset: () => ({ bend: view.spec('bend')?.default ?? 0 }),
    },
  ]
}

// --- What is drawn ----------------------------------------------------------

/**
 * The curve as the picture has it: a wait and a loss for each row, top row
 * first, or for each of several slices to a row.
 */
export interface PrismCurve {
  /** Seconds each row waits. */
  delay: Float32Array
  /** Seconds from one return of each row to the next. */
  again: Float32Array
  /** What one more pass leaves of each row. */
  loop: Float32Array
  /** Which of the seven readings each row belongs to. */
  zone: Uint8Array
}

export function prismCurve(
  settings: PrismSettings,
  layout: PrismLayout,
  sampleRate: number,
  per = 1,
): PrismCurve {
  const { plot } = layout
  const rows = layout.rows * per
  const deal = prismDeal(settings.bands, settings.shuffle)
  const delay = new Float32Array(rows)
  const again = new Float32Array(rows)
  const loop = new Float32Array(rows)
  const zone = new Uint8Array(rows)
  for (let row = 0; row < rows; row++) {
    const place = prismPlaceAt(prismRowY(row, layout, per), plot)
    delay[row] = prismDelaySec(place, settings, deal, sampleRate)
    again[row] = prismAgainSec(delay[row], sampleRate)
    loop[row] = prismLoopGain(prismHz(place), settings.feedback, settings.tilt)
    zone[row] = prismZone(place)
  }
  return { delay, again, loop, zone }
}

/**
 * The lines are worked out at so many slices to a row of the picture: with
 * forty eight scattered bands a band is little more than a row high, and a
 * line through the rows' middles alone would miss where each one reaches.
 */
export const PRISM_LINE_PER = 4

/** Repeats are drawn as far as this many waits. */
export const PRISM_PASSES = 8

/**
 * How strongly a repeat's line is drawn where the repeat comes out at
 * `strength` (1 is the first return at full Mix): the ink of a line that
 * stands back, by the root of the strength, in steps of a twentieth. Under a
 * hundredth (40 dB down) it is not drawn.
 */
export const prismRepeatAlpha = (strength: number): number =>
  Math.round(INK.back * Math.sqrt(clamp(strength, 0, 1)) * 20) / 20

/** The level under which sound on its way is not drawn, and the span of levels above it, in dB. */
export const PRISM_FLOW_FLOOR_DB = -60
export const PRISM_FLOW_SPAN_DB = 50
/** Sound on its way is drawn in so many shades, the strongest so strong in the ink. */
export const PRISM_SHADES = 8
export const PRISM_TRANSIT_ALPHA = 0.32

/** The shade, 0 to `PRISM_SHADES`, of a sound of that strength (1 is a full-scale sine). */
export const prismShade = (strength: number): number =>
  Math.round(
    clamp((gainToDb(strength) - PRISM_FLOW_FLOOR_DB) / PRISM_FLOW_SPAN_DB, 0, 1) * PRISM_SHADES,
  )

/** Readings kept: ten seconds of them at thirty a second, and some to spare. */
const KEPT = 384
/** Two readings further apart than this are a pause, and nothing is drawn between them. */
const PAUSE_SEC = 0.25

interface PrismState {
  /** The settings and the size the curve was last made from. */
  made: number[]
  curve: PrismCurve | null
  /** When each reading was taken, the seven levels of each, and the curve that stood then. */
  times: Float64Array
  levels: Float32Array
  curves: (PrismCurve | null)[]
  /** Where the next reading goes, and how many are kept. */
  head: number
  count: number
  /** What is coming out now, as x, y, width, height and shade, for after the lines are drawn. */
  lit: number[]
  /** The seven levels of the column being drawn. */
  column: Float32Array
  /** The lines as they were last worked out. */
  lines: PrismLine[]
}

interface PrismLine {
  points: Point[]
  alpha: number
  width: number
}

const timeWords = (seconds: number): string =>
  seconds < 0.9995 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(2)} s`

/**
 * The curve and its repeats as lines, the furthest repeat first and the curve
 * last. A repeat is drawn row by row as strong as that colour comes out then,
 * so Tilt is seen to wear one end of it away.
 */
function linesOf(curve: PrismCurve, layout: PrismLayout, wet: number): PrismLine[] {
  const { plot } = layout
  const rows = curve.delay.length
  const per = rows / layout.rows
  const lines: PrismLine[] = []
  for (let pass = PRISM_PASSES; pass >= 2; pass--) {
    let run: Point[] = []
    let runAlpha = 0
    for (let row = 0; row < rows; row++) {
      const alpha = prismRepeatAlpha(wet * Math.pow(curve.loop[row], pass - 1))
      const point: Point = [
        prismX(curve.delay[row] + (pass - 1) * curve.again[row], plot),
        prismRowY(row, layout, per),
      ]
      if (alpha !== runAlpha) {
        if (runAlpha > 0) {
          // The stretch runs on to the row where the next begins, so the line has no gap.
          if (alpha > 0) run.push(point)
          lines.push({ points: run, alpha: runAlpha, width: 1 })
        }
        run = []
        runAlpha = alpha
      }
      if (alpha > 0) run.push(point)
    }
    if (runAlpha > 0) lines.push({ points: run, alpha: runAlpha, width: 1 })
  }
  const main: Point[] = []
  for (let row = 0; row < rows; row++)
    main.push([prismX(curve.delay[row], plot), prismRowY(row, layout, per)])
  lines.push({ points: main, alpha: INK.trace, width: 1.5 })
  return lines
}

/** A mark of what is coming out now is drawn this much past its place each way, so it covers the line. */
export const PRISM_LIT_GROW = 1

/**
 * The sound on its way. Each column of the plot is a stretch of time ago;
 * the readings taken in it say how strong each octave went in then, and the
 * curve that stood then says, row by row, how often that sound has come out
 * since and whether it comes out in this very stretch. On its way it is drawn
 * in the ink at once; coming out, it is kept for `lit`, drawn over the lines.
 */
function drawFlow(frame: DisplayFrame<PrismState>, layout: PrismLayout, wet: number): void {
  const { ctx, colours, state } = frame
  const { plot, rows } = layout
  state.lit.length = 0
  if (state.count === 0 || wet <= 1e-4) return
  const columns = Math.max(1, Math.floor(plot.w / 2))
  const span = plot.w / columns
  const rowHeight = plot.h / rows
  const slot = (back: number): number => (state.head - 1 - back + 2 * KEPT) % KEPT
  const age = (back: number): number => frame.now - state.times[slot(back)]
  const level = state.column
  let back = 0
  ctx.fillStyle = colours.ink
  for (let c = 0; c < columns; c++) {
    const x = plot.x + c * span
    const from = prismSecAt(x, plot)
    const to = prismSecAt(x + span, plot)
    while (back < state.count && age(back) < from) back++
    let of = -1
    if (back < state.count && age(back) < to) {
      // The readings taken in this stretch: the highest of them, by the curve of the newest.
      of = slot(back)
      level.fill(0)
      for (let b = back; b < state.count && age(b) < to; b++) {
        const at = slot(b) * PRISM_ZONES
        for (let zone = 0; zone < PRISM_ZONES; zone++)
          level[zone] = Math.max(level[zone], state.levels[at + zone])
      }
    } else {
      // None: the stretch lies between two readings and takes the nearer one,
      // or is newer than the newest and takes that. Across a pause, nothing.
      let pick = -1
      if (back === 0) pick = age(0) - to < PAUSE_SEC ? 0 : -1
      else if (back < state.count && age(back) - age(back - 1) < PAUSE_SEC) {
        const middle = prismSecAt(x + span / 2, plot)
        pick = age(back) - middle < middle - age(back - 1) ? back : back - 1
      }
      if (pick < 0) continue
      of = slot(pick)
      for (let zone = 0; zone < PRISM_ZONES; zone++)
        level[zone] = state.levels[of * PRISM_ZONES + zone]
    }
    const curve = state.curves[of]
    if (curve?.delay.length !== rows) continue
    // Rows that are alike are drawn as one: a shade on its way (above 0) or coming out (below).
    let runTop = 0
    let runKind = 0
    for (let row = 0; row <= rows; row++) {
      let kind = 0
      const entered = row < rows ? level[curve.zone[row]] * wet : 0
      if (entered > 0) {
        const done = prismPassesBy(from, curve.delay[row], curve.again[row])
        const shade = prismShade(done > 0 ? entered * Math.pow(curve.loop[row], done) : entered)
        kind = prismPassesBy(to, curve.delay[row], curve.again[row]) > done ? -shade : shade
      }
      if (kind === runKind) continue
      const y = plot.y + runTop * rowHeight
      const tall = (row - runTop) * rowHeight
      if (runKind > 0) {
        ctx.globalAlpha = (PRISM_TRANSIT_ALPHA * runKind) / PRISM_SHADES
        ctx.fillRect(x, y, span, tall)
      } else if (runKind < 0) {
        state.lit.push(
          x - PRISM_LIT_GROW,
          y - PRISM_LIT_GROW,
          span + 2 * PRISM_LIT_GROW,
          tall + 2 * PRISM_LIT_GROW,
          -runKind,
        )
      }
      runKind = kind
      runTop = row
    }
  }
  ctx.globalAlpha = 1
}

/** The lines of the scales: two waits across and three frequencies up, with the words of four of them. */
const SCALE_SEC: readonly (readonly [number, string])[] = [
  [0.1, '100 ms'],
  [1, '1 s'],
]
/** The room the words of a frequency take at the left of the plot. */
const LABEL_ROOM = 34
const SCALE_HZ: readonly (readonly [number, string])[] = [
  [100, '100 Hz'],
  [1000, '1 kHz'],
  [10000, ''],
]

const display = plateDisplay<PrismState>({
  place: 'window',
  columns: 2,
  params: ['time', 'fan', 'shape', 'bend', 'bands', 'smear', 'shuffle', 'feedback', 'tilt', 'mix'],
  // The picture reaches ten seconds back.
  live: { meters: true, settle: 10 },
  info: 'When each colour of the sound comes back: frequency runs upward, the wait runs across from 10 ms to 10 s. The line is the delay curve, the fainter lines its repeats. Sound travels right from the moment it goes in and lights up where it comes out. Drag the points for Time, Fan and Bend.',
  init: () => ({
    made: [],
    curve: null,
    times: new Float64Array(KEPT),
    levels: new Float32Array(KEPT * PRISM_ZONES),
    curves: Array.from({ length: KEPT }, () => null),
    head: 0,
    count: 0,
    lit: [],
    column: new Float32Array(PRISM_ZONES),
    lines: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = prismLayout(frame)
    const { box, plot } = layout
    const settings = settingsOf(frame)
    const wet = frame.spec('mix') ? prismWet(frame.value('mix')) : 1

    // The curve moves only when a setting does, so it is worked out only then.
    const made: number[] = [
      settings.time,
      settings.fan,
      settings.shape,
      settings.bend,
      settings.bands,
      settings.smear,
      settings.shuffle,
      settings.feedback,
      settings.tilt,
      wet,
      frame.width,
      frame.height,
      frame.sampleRate,
    ]
    if (!state.curve || made.some((value, i) => value !== state.made[i])) {
      state.curve = prismCurve(settings, layout, frame.sampleRate)
      state.lines = linesOf(
        prismCurve(settings, layout, frame.sampleRate, PRISM_LINE_PER),
        layout,
        wet,
      )
      state.made = made
    }

    // What goes in, octave by octave, with the curve it goes in under. The
    // device goes on taking sound in while Mix is at nothing, so the readings
    // are kept then too; switched off or standing still, nothing is on its way.
    if (frame.powered && frame.dt > 0 && frame.hasMeter(PRISM_METERS[0])) {
      const at = state.head
      state.times[at] = frame.now
      for (let zone = 0; zone < PRISM_ZONES; zone++) {
        const reading = frame.meter(PRISM_METERS[zone])
        state.levels[at * PRISM_ZONES + zone] = reading > 0 ? Math.min(reading, 4) : 0
      }
      state.curves[at] = state.curve
      state.head = (at + 1) % KEPT
      state.count = Math.min(KEPT, state.count + 1)
    } else state.count = 0

    // The scales.
    const foot = plot.y + plot.h
    for (const [seconds, words] of SCALE_SEC) {
      const x = prismX(seconds, plot)
      rule(ctx, x, plot.y, x, foot, { colour: colours.ink, alpha: INK.grid })
      text(frame, words, x, box.y + box.h - 1, { align: 'center', alpha: TEXT_LEAST })
    }
    const lineOf = (hz: number): number => Math.round(prismY(prismAxis(hz), plot))
    for (const [hz] of SCALE_HZ)
      rule(ctx, plot.x, lineOf(hz), plot.x + plot.w, lineOf(hz), {
        colour: colours.ink,
        alpha: INK.grid,
      })
    rule(ctx, plot.x, foot, plot.x + plot.w, foot, { colour: colours.ink, alpha: INK.rule })

    clipped(ctx, plot, () => {
      drawFlow(frame, layout, wet)
      for (const line of state.lines)
        trace(ctx, line.points, { colour: colours.ink, width: line.width, alpha: line.alpha })
      // What is coming out at this moment, over the line it comes out on.
      ctx.fillStyle = colours.accent
      for (let i = 0; i < state.lit.length; i += 5) {
        ctx.globalAlpha = state.lit[i + 4] / PRISM_SHADES
        ctx.fillRect(state.lit[i], state.lit[i + 1], state.lit[i + 2], state.lit[i + 3])
      }
      ctx.globalAlpha = 1
    })

    // The words stand on patches: sound runs under them.
    const handles = prismHandles(frame)
    // At the left, unless the curve begins there: then at the right, where it has not come yet.
    const right = handles[1].x < plot.x + LABEL_ROOM
    for (const [hz, words] of SCALE_HZ)
      if (words)
        label(
          frame,
          words,
          right ? plot.x + plot.w - 2 : plot.x + 2,
          lineOf(hz) - 2,
          right ? 'right' : 'left',
        )
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // The point in hand, in words, along the top at the end away from it.
    const hot = handles.find((point) => point.key === frame.hot)
    if (hot) {
      const bend = settings.bend
      const value =
        hot.key === 'time'
          ? timeWords(settings.time / 1000)
          : hot.key === 'fan'
            ? `${Math.round(clamp(settings.fan, 0, 1) * 100)} %`
            : `${bend > 0.005 ? '+' : bend < -0.005 ? '−' : ''}${Math.abs(bend).toFixed(2)}`
      const left = hot.x > plot.x + plot.w / 2
      label(
        frame,
        `${hot.name}  ${value}`,
        left ? plot.x + 3 : plot.x + plot.w - 3,
        plot.y + 8,
        left ? 'left' : 'right',
      )
    }
  },
  handles: prismHandles,
})

export const PRISM_FACES: Readonly<Record<string, PlateFace>> = {
  prism: {
    display,
    face: ['time', 'shape', 'feedback', 'mix'],
  },
}
