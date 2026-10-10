// The display of Weather: the weather itself over the last seconds, running
// to the left with now at its right end. From the foot rises how strong the
// weather is (the gust, the shadow, how thick the rain falls, the wave), as
// the device reports it; from the top hangs what that takes from the sound's
// level. Drops are ticks and a roll of thunder is a bolt, each where it fell.
// While the device sleeps the display shows a sample of the weather the
// knobs ask for, made here by the same rules the device makes its own by
// (`weather_models.h`): the same swells, shadows and waves from another
// stream of chance.

import { denormalizeParam } from '../../../core/params'
import { History, INK, clamp, dot, follow, ground, handle, lerp, rule } from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

export const WEATHER_KINDS = ['wind', 'clouds', 'rain', 'surf', 'storm'] as const
export type WeatherKind = (typeof WEATHER_KINDS)[number]
/** What comes and goes in a weather: thunder is the storm's, with the wind's gusts. */
export type WeatherPart = 'wind' | 'clouds' | 'rain' | 'surf' | 'thunder'

// The numbers below are those of `cpp/devices/weather/weather_models.h` (the
// structs Wind, Clouds, Rain, Surf and Thunder) and of `weather.h` (kDipDb),
// under the names they have there. Times are in seconds of the weather's own
// time, which Pace runs faster or slower than the clock.

/** Wind: kRise, kFall, kHoldMin, kHoldSpan, kSizeMin, kGapMin, kGapMax and the first wait of `Wind::init`. */
export const WIND = {
  rise: 0.12,
  fall: 1.8,
  holdMin: 0.3,
  holdSpan: 0.9,
  sizeMin: 0.45,
  gapMin: 0.6,
  gapMax: 20,
  firstWait: 0.25,
} as const

/** Clouds: kLengthMin, kLengthSpan, kEdge, kDepthMin, kGapMin, kGapMax, kThin, kThinHz and the first wait and phases of `Clouds::init`. */
export const CLOUDS = {
  lengthMin: 4,
  lengthSpan: 8,
  edge: 0.3,
  depthMin: 0.65,
  gapMin: 1,
  gapMax: 30,
  thin: 0.2,
  thinHz: [0.13, 0.21],
  thinPhase: [0, 0.37],
  firstWait: 0.15,
} as const

/** Rain: kRate, kRise, kFall, kHoldMin, kHoldSpan, kShowerMin, kGapMin, kGapMax, kFloor, kSheetFloor, kSizeMin, kDuckSeconds and the first wait of `Rain::init`. */
export const RAIN = {
  rate: 24,
  rise: 1.2,
  fall: 2.5,
  holdMin: 2,
  holdSpan: 5,
  showerMin: 0.6,
  gapMin: 1.5,
  gapMax: 24,
  floor: 0.55,
  sheetFloor: 0.2,
  sizeMin: 0.35,
  duckSeconds: 0.035,
  firstWait: 0.1,
} as const

/** Surf: kWave, kJitter, kGather, kBreak, kDraw, kLand, kGatherTo, kHeightMin, kGapMax. */
export const SURF = {
  wave: 7,
  jitter: 0.2,
  gather: 0.5,
  break: 0.08,
  draw: 0.14,
  land: 0.1,
  gatherTo: 0.5,
  heightMin: 0.6,
  gapMax: 14,
} as const

/** Thunder: kGapMin, kGapMax, kDecay (seconds by the clock) and the first wait of `Thunder::init`. */
export const THUNDER = { gapMin: 6, gapMax: 30, decay: 1.6, firstWait: 0.35 } as const

/** `kDipDb`: how far a whole gust, shadow, drop or wave takes the level down at Force 1 and Exposure 1, in dB. */
export const DIP_DB = { wind: 10, clouds: 6, rain: 12, surf: 14 } as const

/** `kLongestLull` and `kLullMean`: a lull is never more than three means, and the division brings the mean back to 1. */
const LONGEST_LULL = 3
const LULL_MEAN = 0.950213

/** How much of the past each Kind shows, in seconds by the clock: a few of its events at Pace 1. */
const SPAN_SEC: Readonly<Record<WeatherKind, number>> = {
  wind: 8,
  clouds: 32,
  rain: 12,
  surf: 24,
  storm: 8,
}

export const weatherSpanSec = (kind: WeatherKind): number => SPAN_SEC[kind]

/** The mean lull between two events at a Calm, as each model's `gap(calm)` has it. */
export function weatherLull(part: WeatherPart, calm: number): number {
  switch (part) {
    case 'wind':
      return WIND.gapMin * Math.pow(WIND.gapMax / WIND.gapMin, calm)
    case 'clouds':
      return CLOUDS.gapMin * Math.pow(CLOUDS.gapMax / CLOUDS.gapMin, calm)
    case 'rain':
      return RAIN.gapMin * Math.pow(RAIN.gapMax / RAIN.gapMin, calm)
    case 'surf':
      return SURF.gapMax * calm * calm
    case 'thunder':
      return THUNDER.gapMin * Math.pow(THUNDER.gapMax / THUNDER.gapMin, calm)
  }
}

/** How long one event lasts on average: a gust's or a shower's hold, a shadow's length, a wave. */
export function weatherEvent(part: Exclude<WeatherPart, 'thunder'>): number {
  switch (part) {
    case 'wind':
      return WIND.holdMin + WIND.holdSpan / 2
    case 'clouds':
      return CLOUDS.lengthMin + CLOUDS.lengthSpan / 2
    case 'rain':
      return RAIN.holdMin + RAIN.holdSpan / 2
    case 'surf':
      return SURF.wave
  }
}

/** The part of a Kind whose events the upper line's dashes are as long as. */
const partOf = (kind: WeatherKind): Exclude<WeatherPart, 'thunder'> =>
  kind === 'storm' ? 'wind' : kind

const smoothstep = (x: number): number => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

/** `Clouds::shape`: the shadow over one place `at` seconds after it arrives, for a shadow `span` seconds long. */
export function cloudShape(at: number, span: number): number {
  if (at <= 0 || at >= span) return 0
  const edge = CLOUDS.edge * span
  if (at < edge) return smoothstep(at / edge)
  if (at > span - edge) return smoothstep((span - at) / edge)
  return 1
}

/** `Surf::shape`: a wave's height at `at` (0..1 of its length): it gathers, breaks and draws back. */
export function surfShape(at: number): number {
  if (at <= 0 || at >= 1) return 0
  if (at < SURF.gather) {
    const t = at / SURF.gather
    return SURF.gatherTo * t * t
  }
  if (at < SURF.gather + SURF.break)
    return SURF.gatherTo + (1 - SURF.gatherTo) * smoothstep((at - SURF.gather) / SURF.break)
  return (
    Math.exp(-(at - SURF.gather - SURF.break) / SURF.draw) *
    (1 - smoothstep((at - (1 - SURF.land)) / SURF.land))
  )
}

/** `Rain::floor`: how thick the rain falls between two showers, as a share of their thickest. */
export const rainFloor = (calm: number): number => RAIN.floor * (1 - calm) * (1 - calm)

/** Drops a second by the clock, as `Rain::step` counts them down: kRate times Force, Pace and how thick it falls. */
export const rainRate = (force: number, pace: number, density: number): number =>
  RAIN.rate * force * pace * density

/** The mean size of a drop: kSizeMin and the rest by the square of an even chance. */
const DROP_SIZE = RAIN.sizeMin + (1 - RAIN.sizeMin) / 3

/**
 * How far the drops have the level down on average, as a share of a whole
 * duck: each adds its size to a duck that dies in kDuckSeconds, and the cover
 * is one less the exponential of that (`Rain::step`).
 */
export const rainCover = (dropsPerSecond: number): number =>
  1 - Math.exp(-dropsPerSecond * RAIN.duckSeconds * DROP_SIZE)

/**
 * What is heard of a dip of `dipDb` at a Mix, in dB down: the device mixes the
 * sound under the weather with the dry sound, straight across.
 */
export function heardDipDb(dipDb: number, mix: number): number {
  const gain = 1 - mix * (1 - Math.pow(10, -dipDb / 20))
  return gain > 1e-6 ? -20 * Math.log10(gain) : 120
}

/** A stream of even chances from a seed, the same every time. */
function chances(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A number 0..1 that is the same for the same `n` and has nothing to do with its neighbours'. */
function scatter(n: number): number {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/** `lull()`: the length of a lull in units of its mean. */
const lullOf = (chance: () => number): number =>
  Math.min(LONGEST_LULL, -Math.log(Math.max(chance(), 1e-6))) / LULL_MEAN

/** A stretch of weather, a value for each step of it. */
export interface WeatherSample {
  /** How strong the weather is, 0..1, before Force: what the device's `level` reading is at Force 1. */
  level: Float32Array
  /** How far it has the level down at Force 1 and Exposure 1, in dB, the drops' own ducks apart. */
  dip: Float32Array
  /** How thick the rain falls, 0..1; 0 where it does not rain. */
  density: Float32Array
  /** The steps at which thunder rolls. */
  rolls: number[]
}

/**
 * A stretch of a Kind's weather at a Calm, from the moment the device wakes:
 * `seconds` of the weather's own time in `steps` steps, by the rules of
 * `weather_models.h` and with a stream of chance of its own (`seed`). The
 * flutter on a gust and the lean to a side are left out; everything that
 * times and sizes an event is there.
 */
export function sampleWeather(
  kind: WeatherKind,
  calm: number,
  seconds: number,
  steps: number,
  seed = 1,
  into?: WeatherSample,
): WeatherSample {
  const sample: WeatherSample =
    into && into.level.length >= steps
      ? into
      : {
          level: new Float32Array(steps),
          dip: new Float32Array(steps),
          density: new Float32Array(steps),
          rolls: [],
        }
  sample.rolls.length = 0
  const chance = chances(seed)
  // Thunder has a stream of its own, as in the device: a storm's gusts are the wind's.
  const thunderChance = chances(seed ^ 0x5bd1e995)
  const dt = seconds / steps
  const windy = kind === 'wind' || kind === 'storm'
  // A swell (`Swell::step`): the wind's gust or the rain's shower.
  const swell = windy
    ? { ...WIND, size: WIND.sizeMin, gap: weatherLull('wind', calm) }
    : { ...RAIN, size: RAIN.showerMin, gap: weatherLull('rain', calm) }
  const rise = 1 - Math.exp(-dt / swell.rise)
  const fall = 1 - Math.exp(-dt / swell.fall)
  let wait: number = swell.firstWait
  let hold = 0
  let size = 0
  let swollen = 0
  // A shadow or a wave: how far into it, how long it is (0 between two) and how deep or high.
  const lull = weatherLull(kind === 'surf' ? 'surf' : 'clouds', calm)
  let pause: number = kind === 'surf' ? 0 : CLOUDS.firstWait
  let along = 0
  let length = 0
  let depth = 0
  const phase: [number, number] = [CLOUDS.thinPhase[0], CLOUDS.thinPhase[1]]
  const thunder = weatherLull('thunder', calm)
  let roll: number = THUNDER.firstWait
  const low = rainFloor(calm)

  for (let n = 0; n < steps; n++) {
    let level = 0
    let dip = 0
    let density = 0
    if (windy || kind === 'rain') {
      if (hold > 0) hold -= dt
      else {
        wait -= dt / Math.max(swell.gap, 1e-3)
        if (wait <= 0) {
          size = swell.size + (1 - swell.size) * chance()
          hold = swell.holdMin + swell.holdSpan * chance()
          chance() // where the event stands, which the display does not show
          wait = lullOf(chance)
        }
      }
      const drive = hold > 0 ? size : 0
      swollen += (drive - swollen) * (drive > swollen ? rise : fall)
      if (kind === 'wind') {
        level = swollen
        dip = DIP_DB.wind * swollen
      } else if (kind === 'storm') {
        // The rain comes in sheets on the gusts, and the reading is the thicker of the two.
        density = RAIN.sheetFloor + (1 - RAIN.sheetFloor) * swollen
        level = density
        dip = DIP_DB.wind * swollen
        roll -= dt / thunder
        if (roll <= 0) {
          roll = lullOf(thunderChance)
          sample.rolls.push(n)
        }
      } else {
        density = low + (1 - low) * swollen
        level = density
      }
    } else if (kind === 'clouds') {
      for (let i = 0; i < 2; i++) {
        phase[i] += CLOUDS.thinHz[i] * dt
        if (phase[i] >= 1) phase[i] -= 1
      }
      if (length <= 0) {
        pause -= dt / lull
        if (pause <= 0) {
          length = CLOUDS.lengthMin + CLOUDS.lengthSpan * chance()
          depth = CLOUDS.depthMin + (1 - CLOUDS.depthMin) * chance()
          chance() // which side it comes from
          pause = lullOf(chance)
          along = 0
        }
      }
      if (length > 0) {
        along += dt
        const thin =
          1 -
          CLOUDS.thin *
            (0.5 + 0.25 * (Math.sin(2 * Math.PI * phase[0]) + Math.sin(2 * Math.PI * phase[1])))
        level = depth * thin * cloudShape(along, length)
        dip = DIP_DB.clouds * level
        if (along >= length) length = 0
      }
    } else {
      let waiting = false
      if (length <= 0) {
        // At Calm 0 there is no lull: the next wave gathers as this one lands.
        if (lull > 1e-3) {
          pause -= dt / lull
          waiting = pause > 0
        }
        if (!waiting) {
          length = SURF.wave * (1 + SURF.jitter * (2 * chance() - 1))
          depth = SURF.heightMin + (1 - SURF.heightMin) * chance()
          chance() // which side it runs from
          pause = lullOf(chance)
          along = 0
        }
      }
      if (!waiting) {
        along += dt
        level = depth * surfShape(Math.min(1, along / length))
        dip = DIP_DB.surf * level
        if (along >= length) length = 0
      }
    }
    sample.level[n] = level
    sample.dip[n] = dip
    sample.density[n] = density
  }
  return sample
}

// --- The picture ------------------------------------------------------------

/** How many readings a second are kept, and for how long: the longest span. */
const SLOTS_PER_SEC = 30
const KEPT_SEC = 32
const KEPT_SLOTS = KEPT_SEC * SLOTS_PER_SEC
/** A point of a line for every so many pixels, and no more points than this. */
const COLUMN_PX = 1.5
const MOST_COLUMNS = 400
/** The sample a still display shows: so many steps are in view at Pace 4, and half as many again are made, to choose a moment from. */
const SAMPLE_IN_VIEW = 4096
const SAMPLE_STEPS = 6144
/** The fastest Pace: the span at that Pace is what `SAMPLE_IN_VIEW` steps cover. */
const PACE_MOST = 4
/** A dip this deep fills the upper band, in dB. */
export const DIP_FULL_DB = 16
/** How many falls of drops and rolls of thunder are remembered. */
const MARKS = 512
const ROLLS = 32
/** No more ticks than this for the drops of one reading: more than that is one curtain of rain. */
const TICKS_MOST = 2
/** A tick and a bolt are in the accent for this long after they fall, in seconds. */
const FRESH_SEC = 0.15
/** The device counts drops and rolls up to here and starts again (`& 0xFFFFF`). */
const COUNT_WRAP = 1 << 20

export interface WeatherLayout {
  /** The line the upper band hangs from: where the sound is untouched. */
  top: number
  /** How far down the upper band goes for a dip of `DIP_FULL_DB`. */
  shade: number
  /** The highest the weather rises, at Force 1, and the line it stands on. */
  laneTop: number
  foot: number
  /** The height between the two. */
  sky: number
  /** The oldest moment shown and now. */
  left: number
  now: number
  wide: number
  /** Where the ring stands at the slowest and the fastest Pace. */
  ringFrom: number
  ringTo: number
}

/** Where things stand on a display of that size. */
export function weatherLayout(view: Pick<DisplayView, 'width' | 'height'>): WeatherLayout {
  // The box `ground` leaves: three pixels inside its line.
  const x = 4
  const y = 4
  const w = view.width - 8
  const h = view.height - 8
  // The band hangs over the top of the weather's own room: the two meet only
  // where a strong weather is let far into the sound.
  const shade = Math.round(h * 0.3)
  // The ring is whole on the display when it stands on the foot or at the top.
  const foot = y + h - 2
  const laneTop = y + 2
  const now = x + w - 5
  return {
    top: y,
    shade,
    laneTop,
    foot,
    sky: foot - laneTop,
    left: x,
    now,
    wide: now - x,
    ringFrom: x + 6,
    ringTo: now - 8,
  }
}

/** How many steps a line across the display has. */
export const weatherColumns = (lay: WeatherLayout): number =>
  clamp(Math.floor(lay.wide / COLUMN_PX), 2, MOST_COLUMNS)

/** The lengths of a dash and a gap of the upper line, in pixels: an event and a lull at that Pace; no gap where there is no lull. */
export function weatherDash(
  kind: WeatherKind,
  pace: number,
  calm: number,
  lay: WeatherLayout,
): readonly [number, number] | undefined {
  const perSecond = lay.wide / SPAN_SEC[kind] / Math.max(pace, 1e-3)
  const part = partOf(kind)
  const gap = weatherLull(part, calm) * perSecond
  if (gap < 1) return undefined
  return [clamp(weatherEvent(part) * perSecond, 1.5, 4 * lay.wide), Math.min(gap, 4 * lay.wide)]
}

interface WeatherState {
  /** The device's `level` and `gain` readings as they came. */
  level: History
  gain: History
  /** When drops fell and how many at once, and when thunder rolled: rings, written at the head. */
  dropAt: Float64Array
  dropMany: Uint8Array
  dropHead: number
  rollAt: Float64Array
  rollHead: number
  /** The counts last read; null until one is. */
  drops: number | null
  rolls: number | null
  /** Whether there is weather of the device's own to show, when it was last on, and how much of the sample shows (1 at rest). */
  live: boolean
  lastOn: number
  rest: number
  /** The sample, what it was made from and the step that stands at now. */
  sample: WeatherSample
  made: string
  sampleNow: number
  /** The two lines of one picture, a height for each column. */
  up: Float32Array
  down: Float32Array
}

/** One ring for Force, by height, and Pace, across: on the line the weather reaches at its most. */
function weatherHandles(view: DisplayView): DisplayHandle[] {
  const lay = weatherLayout(view)
  const force = view.value('force')
  const pace = view.value('pace')
  const forceSpec = view.spec('force')
  const paceSpec = view.spec('pace')
  const x = lerp(lay.ringFrom, lay.ringTo, clamp(view.at('pace'), 0, 1))
  const y = lay.foot - clamp(force, 0, 1) * lay.sky
  return [
    {
      key: 'force',
      name: 'Force and Pace',
      x,
      y,
      drag: (toX, toY) => ({
        force:
          Math.abs(toY - y) < 1e-6
            ? force
            : clamp((lay.foot - toY) / lay.sky, forceSpec?.min ?? 0, forceSpec?.max ?? 1),
        pace:
          Math.abs(toX - x) < 1e-6 || !paceSpec
            ? pace
            : denormalizeParam(
                paceSpec,
                clamp((toX - lay.ringFrom) / (lay.ringTo - lay.ringFrom), 0, 1),
              ),
      }),
      reset: () => ({ force: forceSpec?.default ?? force, pace: paceSpec?.default ?? pace }),
    },
  ]
}

/** How far a count has gone on since it was last read; 0 where it started again. */
function counted(now: number, before: number): number {
  const more = (((now - before) % COUNT_WRAP) + COUNT_WRAP) % COUNT_WRAP
  return more < COUNT_WRAP / 2 ? Math.floor(more) : 0
}

/** The two lines of a picture: the band from the top and the weather from the foot, filled as Voice says. */
function paint(
  frame: DisplayFrame<WeatherState>,
  lay: WeatherLayout,
  columns: number,
  alpha: number,
  fill: number,
): void {
  const { ctx, colours, state } = frame
  const { up, down } = state
  const step = lay.wide / columns
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  let deepest = lay.top
  for (let c = 0; c <= columns; c++) if (down[c] > deepest) deepest = down[c]
  if (deepest > lay.top + 0.25) {
    ctx.beginPath()
    ctx.moveTo(lay.left, lay.top)
    for (let c = 0; c <= columns; c++) ctx.lineTo(lay.left + c * step, down[c])
    ctx.lineTo(lay.now, lay.top)
    ctx.closePath()
    ctx.globalAlpha = INK.fill * alpha
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(lay.left, down[0])
    for (let c = 1; c <= columns; c++) ctx.lineTo(lay.left + c * step, down[c])
    ctx.globalAlpha = INK.back * alpha
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
  }
  if (fill > 0) {
    ctx.beginPath()
    ctx.moveTo(lay.left, lay.foot)
    for (let c = 0; c <= columns; c++) ctx.lineTo(lay.left + c * step, up[c])
    ctx.lineTo(lay.now, lay.foot)
    ctx.closePath()
    ctx.globalAlpha = fill * alpha
    ctx.fillStyle = colours.ink
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(lay.left, up[0])
  for (let c = 1; c <= columns; c++) ctx.lineTo(lay.left + c * step, up[c])
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** A bolt: where thunder rolled. */
function bolt(ctx: CanvasRenderingContext2D, x: number, top: number, high: number): void {
  ctx.moveTo(x + 1.5, top)
  ctx.lineTo(x - 1.5, top + high * 0.55)
  ctx.lineTo(x + 1.5, top + high * 0.45)
  ctx.lineTo(x - 1, top + high)
}

/** The tick of a drop: where across, and at a height that is its own. */
function tick(ctx: CanvasRenderingContext2D, lay: WeatherLayout, x: number, which: number): void {
  ctx.rect(x, lay.laneTop + scatter(which) * Math.max(0, lay.sky - 3), 1, 3)
}

const weather = plateDisplay<WeatherState>({
  place: 'strip',
  params: ['kind', 'force', 'pace', 'calm', 'exposure', 'voice', 'mix'],
  // The longest span is 32 seconds: it runs on until what it shows has gone by.
  live: { meters: true, fps: 30, settle: 36 },
  info: 'The weather over the last seconds, now at the right. The shape that rises is the gust, shadow, shower or wave, filled as Voice is turned up; the band above is what it takes from the level. A dash of the upper line is one of them long and a gap one lull. The ring sets Force and Pace.',
  init: () => ({
    level: new History(KEPT_SEC, KEPT_SLOTS, 0, 'max'),
    gain: new History(KEPT_SEC, KEPT_SLOTS, 1, 'min'),
    dropAt: new Float64Array(MARKS).fill(-Infinity),
    dropMany: new Uint8Array(MARKS),
    dropHead: 0,
    rollAt: new Float64Array(ROLLS).fill(-Infinity),
    rollHead: 0,
    drops: null,
    rolls: null,
    live: false,
    lastOn: -Infinity,
    rest: 1,
    sample: {
      level: new Float32Array(SAMPLE_STEPS),
      dip: new Float32Array(SAMPLE_STEPS),
      density: new Float32Array(SAMPLE_STEPS),
      rolls: [],
    },
    made: '',
    sampleNow: SAMPLE_STEPS - 1,
    up: new Float32Array(MOST_COLUMNS + 1),
    down: new Float32Array(MOST_COLUMNS + 1),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = weatherLayout(frame)
    const kind = WEATHER_KINDS[clamp(Math.round(frame.value('kind')), 0, 4)] ?? 'wind'
    const force = clamp(frame.value('force'), 0, 1)
    const pace = clamp(frame.value('pace'), 0.01, PACE_MOST)
    const calm = clamp(frame.value('calm'), 0, 1)
    const reach = force * clamp(frame.value('exposure'), 0, 1)
    const voice = clamp(frame.value('voice'), 0, 1)
    const mix = clamp(frame.value('mix'), 0, 1)
    const span = SPAN_SEC[kind]
    const columns = weatherColumns(lay)
    const step = lay.wide / columns
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('gate')

    if (running) {
      const level = clamp(frame.meter('level'), 0, 1)
      const gain = frame.meter('gain')
      state.level.push(frame.now, level)
      // Until the first reading arrives the gain reads 0, which is no gain the device ever has.
      state.gain.push(frame.now, gain > 0 ? Math.min(gain, 1) : 1)
      if (frame.meter('gate') > 0 || level > 0) {
        state.live = true
        state.lastOn = frame.now
      } else if (state.live && frame.now - state.lastOn > span + 0.5) {
        // All of it has run off the left end.
        state.live = false
      }
      state.rest = follow(state.rest, state.live ? 0 : 1, frame.dt, 0.5, 0.12)
      const drops = frame.meter('drops')
      const fell = state.drops === null ? 0 : counted(drops, state.drops)
      state.drops = drops
      if (fell > 0) {
        state.dropAt[state.dropHead] = frame.now
        state.dropMany[state.dropHead] = Math.min(fell, 255)
        state.dropHead = (state.dropHead + 1) % MARKS
      }
      const rolls = frame.meter('rolls')
      const rolled = state.rolls === null ? 0 : counted(rolls, state.rolls)
      state.rolls = rolls
      if (rolled > 0) {
        state.rollAt[state.rollHead] = frame.now
        state.rollHead = (state.rollHead + 1) % ROLLS
      }
    }
    // Switched off it shows what it would do, and nothing of what it did.
    const rest = frame.powered ? state.rest : 1
    const fill = voice > 0 ? lerp(0.12, 0.5, voice) : 0
    const shadeOf = (dipDb: number): number =>
      lay.top + clamp(heardDipDb(dipDb, mix) / DIP_FULL_DB, 0, 1) * lay.shade
    const high = Math.min(lay.sky, 16)
    const tickAlpha = mix > 0 ? lerp(0.3, INK.text, mix) : 0

    rule(ctx, lay.left, lay.top, lay.now, lay.top, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, lay.left, lay.foot, lay.now, lay.foot, { colour: colours.ink, alpha: INK.rule })

    if (rest > 0.01) {
      // A sample of this weather: made again only when the Kind or Calm moves.
      const made = `${kind} ${calm.toFixed(4)}`
      if (made !== state.made) {
        const seconds = (SPAN_SEC[kind] * PACE_MOST * SAMPLE_STEPS) / SAMPLE_IN_VIEW
        sampleWeather(
          kind,
          calm,
          seconds,
          SAMPLE_STEPS,
          WEATHER_KINDS.indexOf(kind) + 1,
          state.sample,
        )
        // Now is put where the weather last stood high, so the picture has an event at its right end.
        let most = 0
        for (let n = SAMPLE_IN_VIEW; n < SAMPLE_STEPS; n++)
          if (state.sample.level[n] > most) most = state.sample.level[n]
        state.sampleNow = SAMPLE_STEPS - 1
        for (let n = SAMPLE_STEPS - 1; n >= SAMPLE_IN_VIEW && most > 0; n--) {
          if (state.sample.level[n] >= 0.85 * most) {
            state.sampleNow = n
            break
          }
        }
        state.made = made
      }
      const { sample } = state
      // So many of the sample's steps to a column: all that are in view at this Pace over the columns.
      const per = ((pace / PACE_MOST) * SAMPLE_IN_VIEW) / columns
      const raining = kind === 'rain' || kind === 'storm'
      for (let c = 0; c <= columns; c++) {
        const centre = state.sampleNow - (columns - c) * per
        let level: number
        let dip: number
        if (per <= 1) {
          const at = clamp(centre, 0, SAMPLE_STEPS - 1)
          const below = Math.floor(at)
          const above = Math.min(SAMPLE_STEPS - 1, below + 1)
          level = lerp(sample.level[below], sample.level[above], at - below)
          dip = lerp(sample.dip[below], sample.dip[above], at - below)
        } else {
          // The highest of the steps a column takes in, so a short gust keeps its height.
          const first = clamp(Math.ceil(centre - per / 2), 0, SAMPLE_STEPS - 1)
          const last = clamp(Math.floor(centre + per / 2), first, SAMPLE_STEPS - 1)
          level = 0
          dip = 0
          for (let n = first; n <= last; n++) {
            if (sample.level[n] > level) level = sample.level[n]
            if (sample.dip[n] > dip) dip = sample.dip[n]
          }
        }
        if (raining) {
          const density = sample.density[clamp(Math.round(centre), 0, SAMPLE_STEPS - 1)]
          dip += DIP_DB.rain * rainCover(rainRate(force, pace, density))
        }
        state.up[c] = lay.foot - force * level * mix * lay.sky
        state.down[c] = shadeOf(reach * dip)
      }
      paint(frame, lay, columns, rest, fill)
      if (raining && tickAlpha > 0) {
        ctx.beginPath()
        let any = false
        for (let c = 0; c < columns; c++) {
          const at = clamp(Math.round(state.sampleNow - (columns - c) * per), 0, SAMPLE_STEPS - 1)
          const fall = rainRate(force, pace, sample.density[at]) * (span / columns)
          const many = Math.min(TICKS_MOST, Math.floor(fall + scatter(at)))
          for (let k = 0; k < many; k++) {
            tick(ctx, lay, lay.left + c * step, at * 4 + k)
            any = true
          }
        }
        if (any) {
          ctx.globalAlpha = tickAlpha * rest
          ctx.fillStyle = colours.ink
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }
      if (kind === 'storm' && mix > 0 && voice > 0) {
        ctx.beginPath()
        let any = false
        for (const roll of sample.rolls) {
          const back = (state.sampleNow - roll) / per
          if (back < 0 || back > columns) continue
          bolt(ctx, lay.now - back * step, lay.laneTop, high)
          any = true
        }
        if (any) {
          ctx.globalAlpha = INK.text * rest
          ctx.strokeStyle = colours.ink
          ctx.lineWidth = 1.25
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
    }

    if (rest < 0.99) {
      const shown = 1 - rest
      // So many readings to a column; the highest weather and the lowest gain among them.
      const per = (span * SLOTS_PER_SEC) / columns
      for (let c = 0; c <= columns; c++) {
        const from = (columns - c) * per
        const first = Math.min(KEPT_SLOTS - 1, Math.floor(from))
        const last = clamp(Math.ceil(from + per) - 1, first, KEPT_SLOTS - 1)
        let most = 0
        let least = 1
        for (let slot = first; slot <= last; slot++) {
          const level = state.level.at(slot)
          if (level > most) most = level
          const gain = state.gain.at(slot)
          if (gain < least) least = gain
        }
        state.up[c] = lay.foot - most * mix * lay.sky
        state.down[c] = shadeOf(least > 1e-6 ? -20 * Math.log10(least) : 120)
      }
      paint(frame, lay, columns, shown, fill)
      if (tickAlpha > 0) {
        // The drops, each reading's where it fell: the older ones in the ink, the ones falling now in the accent.
        for (const fresh of [false, true]) {
          ctx.beginPath()
          let any = false
          for (let i = 0; i < MARKS; i++) {
            const many = state.dropMany[i]
            const age = frame.now - state.dropAt[i]
            if (many === 0 || age < 0 || age > span || age < FRESH_SEC !== fresh) continue
            for (let k = 0; k < Math.min(many, TICKS_MOST); k++) {
              tick(ctx, lay, lay.now - (age / span) * lay.wide, i * 4 + k)
              any = true
            }
          }
          if (!any) continue
          ctx.globalAlpha = (fresh ? 1 : tickAlpha) * shown
          ctx.fillStyle = fresh ? colours.accent : colours.ink
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }
      if (mix > 0 && voice > 0) {
        for (const fresh of [false, true]) {
          ctx.beginPath()
          let any = false
          for (let i = 0; i < ROLLS; i++) {
            const age = frame.now - state.rollAt[i]
            if (age < 0 || age > span || age < THUNDER.decay !== fresh) continue
            bolt(ctx, lay.now - (age / span) * lay.wide, lay.laneTop, high)
            any = true
          }
          if (!any) continue
          ctx.globalAlpha = (fresh ? 1 : INK.text) * shown
          ctx.strokeStyle = fresh ? colours.accent : colours.ink
          ctx.lineWidth = fresh ? 1.5 : 1.25
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
    }

    // The most the weather reaches, which is Force; its dashes are the weather's own rhythm.
    const [point] = weatherHandles(frame)
    const ceiling = lay.foot - force * lay.sky
    rule(ctx, lay.now, ceiling, lay.left, ceiling, {
      colour: colours.ink,
      alpha: INK.back,
      dash: weatherDash(kind, pace, calm, lay),
    })
    // Where the weather stands now.
    if (rest < 0.99 && state.live && frame.meter('gate') > 0) {
      dot(ctx, lay.now, state.up[columns], 2.5, colours.accent, { ring: colours.ink })
    }
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: weatherHandles,
})

export const WEATHER_FACES: Readonly<Record<string, PlateFace>> = {
  // Force and Pace are the ring on the display.
  weather: {
    display: weather,
    face: ['kind', 'exposure', 'voice', 'calm'],
  },
}
