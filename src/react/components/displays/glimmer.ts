// Glimmer's display: lights on water. From 20 Hz at the left to 20 kHz at the
// right, every band stands as tall as its gain now: the left side above the
// water line, the right side below it as the left's reflection, so Apart is
// read as how far the reflection differs. The water (the ink) is the part of
// a band's gain that stays while its light is out; the second colour is what
// its light adds now. A faint line marks the crests, a dashed one the sound
// untouched. At the right end is a ruler of Rate, with a lamp in its ring
// that flashes once a cycle. While an attack passes round the flicker (the
// device reports by how much) the water is as level as Mix taken down by that.
//
// Nothing here is an impression: the device keeps no state per band, so its
// gains are a law of its clock and its knobs, and the display works the same
// law out from the clock the device reports (`glimmer.h`, whose constants
// are copied below).

import {
  FREQ_MAX,
  INK,
  PHASE_STANDS_SEC,
  clamp,
  dot,
  fillRect,
  freqGrid,
  ground,
  handle,
  hzOfX,
  label,
  lerp,
  rule,
  trace,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplaySignal,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The law, as `cpp/devices/glimmer/glimmer.h` has it ------------------------

/** `Stft<2048, 512>`: a bin is the sample rate over this. */
const FRAME = 2048
/** `kBroadHz`, `kFineHz`: a band's width at the bottom at Grain 0 and at Grain 1. */
const BROAD_HZ = 120
const FINE_HZ = 47
/** `kBroadKneeHz`, `kFineKneeHz`: where bands begin to widen with frequency. */
const BROAD_KNEE_HZ = 200
const FINE_KNEE_HZ = 4000
/** `kEdgeShare`: of the way between two bands' centres, the part where their gains blend. */
const EDGE_SHARE = 0.5
/** `kLeanLowHz`, `kLeanOctaves`: the stretch of pitch Lean takes depth away along. */
const LEAN_LOW_HZ = 100
const LEAN_OCTAVES = 6
/** `kMidHz`: where Outward's two waves start. `kWaveCells`: bands to one wave. */
const MID_HZ = 800
const WAVE_CELLS = 6
/** `kMaxLift`: no band is lifted by more (+6 dB). */
const MAX_LIFT = 2
/** `kWaveApart`: of a cycle between the two sides at Apart 1, on the waves. */
const WAVE_APART = 1 / 3
/** `kOverlapPoints`: a cycle in so many points, for a flash's overlap with itself. */
const OVERLAP_POINTS = 96
/** `kGlintPlateau`, `kGlintReach`: the flash at Soft 0, in cycles either side of its middle. */
const GLINT_PLATEAU = 0.06
const GLINT_REACH = 0.14
/** `kClockWrap`: the clock counts cycles of Rate up to here and starts again. */
export const GLIMMER_CLOCK_WRAP = 4096
/** `kSpeedLowest`, `kSpeedSpan`: on Scatter a band runs at 45 to 91 sixty-fourths of Rate. */
const SPEED_LOWEST = 45
const SPEED_SPAN = 47
/** `kSeedPhase`, `kSeedSpeed`, `kSeedApart`, `kSeedVary`. */
const SEED_PHASE = 0x51ed270b
const SEED_SPEED = 0x2f0b4c87
const SEED_APART = 0x6c8e9cf5
const SEED_VARY = 0x1b873593
/**
 * How long after its clock a frame's gains are heard, in samples: a frame is
 * centred 1024 samples before it ends, and comes out a latency (2304) later.
 */
const HEARD_LATE = 2304 - FRAME / 2

const SCATTER = 0
const UPWARD = 1
const DOWNWARD = 2
const OUTWARD = 3

/** `hash()`: two numbers stirred into one, in 32 bits. */
export function glimmerHash(a: number, b: number): number {
  let h = Math.imul(a, 0x9e3779b1) ^ Math.imul((b + 0x7f4a7c15) | 0, 0x85ebca6b)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  h = Math.imul(h, 0x297a2d39)
  h ^= h >>> 15
  return h >>> 0
}

/** `unit()`: 0 to 1 from a hash. */
const unit = (h: number): number => (h >>> 8) / 16777216

/** How the bands lie for a Grain: a band's width at the bottom, the knee, and bands per e-fold above it. */
export interface GlimmerBands {
  width: number
  knee: number
  scale: number
}

/** `layout()`: the bands for a Grain. A band is never narrower than two bins. */
export function glimmerBands(grain: number, sampleRate = 48000): GlimmerBands {
  const width = Math.max((2 * sampleRate) / FRAME, BROAD_HZ * Math.pow(FINE_HZ / BROAD_HZ, grain))
  const knee = BROAD_KNEE_HZ * Math.pow(FINE_KNEE_HZ / BROAD_KNEE_HZ, grain)
  return { width, knee, scale: knee / width }
}

/** Where a frequency lies among the bands: band j is centred on j. */
export const glimmerPlace = (hz: number, bands: GlimmerBands): number =>
  bands.scale * Math.log(1 + Math.max(0, hz) / bands.knee)

/** The centre of band j, in Hz. */
export const glimmerCentre = (j: number, bands: GlimmerBands): number =>
  bands.knee * (Math.exp(j / bands.scale) - 1)

/** How much of the band above a place between two bands takes: level about each centre, half a cosine between. */
export function glimmerBlend(between: number): number {
  const t = clamp((between - 0.5 * (1 - EDGE_SHARE)) / EDGE_SHARE, 0, 1)
  return 0.5 - 0.5 * Math.cos(Math.PI * t)
}

/** The share of Depth a band at `hz` keeps under Lean. */
export function glimmerShare(hz: number, lean: number): number {
  const place = hz > LEAN_LOW_HZ ? Math.min(1, Math.log2(hz / LEAN_LOW_HZ) / LEAN_OCTAVES) : 0
  return lean >= 0 ? 1 - lean * (1 - place) : 1 + lean * place
}

/** The flash for a Soft: full within `a` cycles of its middle, nothing past `b`. */
export function glimmerFlash(soft: number): { a: number; b: number } {
  return { a: GLINT_PLATEAU * (1 - soft), b: GLINT_REACH + (0.5 - GLINT_REACH) * soft }
}

/**
 * The lift of a band of depth `d`: what keeps its power over a cycle at the
 * input's, and never more than 2. The mean of the light and of its square
 * are in closed form, with the flashes' heights under Vary in them.
 */
export function glimmerLift(d: number, soft: number, vary: number): number {
  const { a, b } = glimmerFlash(soft)
  const mean = (a + b) * (1 - 0.5 * vary)
  const square = (1.25 * a + 0.75 * b) * (1 - vary + (vary * vary) / 3)
  const still = 1 - d
  return Math.min(MAX_LIFT, 1 / Math.sqrt(still * still + 2 * d * still * mean + d * d * square))
}

/**
 * `light()`: a band's light at a phase in cycles (never wrapped), 0 to 1. The
 * flash, as tall as the hash of the band and the cycle's number says;
 * `period` is how many of the band's cycles go by while the clock wraps.
 */
export function glimmerLight(
  phase: number,
  j: number,
  period: number,
  soft: number,
  vary: number,
): number {
  const { a, b } = glimmerFlash(soft)
  const cycle = Math.floor(phase)
  const x = Math.abs(phase - cycle - 0.5)
  if (x >= b) return 0
  let m = x <= a ? 1 : 0.5 + 0.5 * Math.cos((Math.PI * (x - a)) / (b - a))
  if (vary > 0) {
    const number = ((cycle % period) + period) % period
    m *= 1 - vary * unit(glimmerHash((j ^ SEED_VARY) >>> 0, number))
  }
  return m
}

/** What the knobs say, as the law reads them. */
export interface GlimmerSettings {
  depth: number
  pattern: number
  lean: number
  soft: number
  vary: number
  apart: number
}

/** A band's phase in cycles at clock `theta`, and its period: `prepare()`, a pattern at a time. */
export function glimmerPhase(
  j: number,
  theta: number,
  pattern: number,
  apart: number,
  bands: GlimmerBands,
  side: 0 | 1,
): { phase: number; period: number } {
  if (pattern === SCATTER) {
    const speed = SPEED_LOWEST + (glimmerHash(j, SEED_SPEED) % SPEED_SPAN)
    const off = side === 1 ? apart * (unit(glimmerHash(j, SEED_APART)) - 0.5) : 0
    return {
      phase: unit(glimmerHash(j, SEED_PHASE)) + (theta * speed) / 64 + off,
      period: speed * 64,
    }
  }
  const behind =
    pattern === UPWARD
      ? j / WAVE_CELLS
      : pattern === DOWNWARD
        ? -j / WAVE_CELLS
        : Math.abs(j - glimmerPlace(MID_HZ, bands)) / WAVE_CELLS
  return {
    phase: theta - behind + (side === 1 ? WAVE_APART * apart : 0),
    period: GLIMMER_CLOCK_WRAP,
  }
}

/** One band as the device has it now: its depth under Lean, its lift, its light and its gain. */
export interface GlimmerBand {
  depth: number
  lift: number
  light: number
  gain: number
}

/** Band j at clock `theta` on one side: `prepare()`. */
export function glimmerBand(
  j: number,
  theta: number,
  settings: GlimmerSettings,
  bands: GlimmerBands,
  side: 0 | 1 = 0,
): GlimmerBand {
  const depth = settings.depth * glimmerShare(glimmerCentre(j, bands), settings.lean)
  const lift = glimmerLift(depth, settings.soft, settings.vary)
  const pattern = clamp(Math.round(settings.pattern), SCATTER, OUTWARD)
  // With Apart at nothing the right side is the left's very gains.
  const { phase, period } = glimmerPhase(j, theta, pattern, settings.apart, bands, side)
  const light = glimmerLight(phase, j, period, settings.soft, settings.vary)
  return { depth, lift, light, gain: lift * (1 - depth + depth * light) }
}

/** `flash()`: the unit flash at `x` of a cycle (0 to 1, its middle at a half). */
function unitFlash(x: number, a: number, b: number): number {
  const off = Math.abs(x - 0.5)
  if (off >= b) return 0
  return off <= a ? 1 : 0.5 + 0.5 * Math.cos((Math.PI * (off - a)) / (b - a))
}

/** `overlap()`: the mean over a cycle of a flash times itself `lag` of a cycle on, over 96 points as the device sums it. */
export function glimmerOverlap(lag: number, soft: number): number {
  const { a, b } = glimmerFlash(soft)
  let sum = 0
  for (let i = 0; i < OVERLAP_POINTS; i++) {
    const x = (i + 0.5) / OVERLAP_POINTS
    const on = x + lag
    sum += unitFlash(x, a, b) * unitFlash(on - Math.floor(on), a, b)
  }
  return sum / OVERLAP_POINTS
}

/** A flash's overlap with itself as far on as two neighbouring bands of a wave are apart. */
export interface GlimmerOverlaps {
  /** A sixth of a cycle on: any two neighbours of a wave. */
  wave: number
  /** As far on as the two bands either side of Outward's middle are apart, and the lower of those two. */
  middle: number
  cell: number
}

/** `overlap_wave_`, `overlap_middle_`, `middle_cell_`: worked out once for a Soft and a Grain. */
export function glimmerOverlaps(settings: GlimmerSettings, bands: GlimmerBands): GlimmerOverlaps {
  const middle = glimmerPlace(MID_HZ, bands)
  const cell = Math.floor(middle)
  return {
    wave: glimmerOverlap(1 / WAVE_CELLS, settings.soft),
    middle: glimmerOverlap(Math.abs(2 * (middle - cell) - 1) / WAVE_CELLS, settings.soft),
    cell,
  }
}

/**
 * What the join of two bands of depths `dUnder` and `dOver` is raised by half
 * way between them, when a flash of one overlaps a flash of the other by
 * `overlap` of a cycle (on a wave; on Scatter the two lights are independent).
 * Two gains that move apart from one another join to less power than either
 * has; the device raises the join by what it loses.
 */
export function glimmerRaiseOf(
  dUnder: number,
  dOver: number,
  settings: GlimmerSettings,
  overlap: number,
): number {
  const { a, b } = glimmerFlash(settings.soft)
  const mean = (a + b) * (1 - 0.5 * settings.vary)
  const square = (1.25 * a + 0.75 * b) * (1 - settings.vary + (settings.vary * settings.vary) / 3)
  const pattern = clamp(Math.round(settings.pattern), SCATTER, OUTWARD)
  // Two bands' flashes are each as tall as they like under Vary.
  const heights = (1 - 0.5 * settings.vary) * (1 - 0.5 * settings.vary)
  const lights = pattern === SCATTER ? mean * mean : heights * overlap
  const part = (d: number): { floor: number; swing: number; level: number } => {
    const still = 1 - d
    const power = still * still + 2 * d * still * mean + d * d * square
    const lift = Math.min(MAX_LIFT, 1 / Math.sqrt(power))
    return { floor: lift * still, swing: lift * d, level: lift * Math.sqrt(power) }
  }
  const under = part(dUnder)
  const over = part(dOver)
  const together =
    under.floor * over.floor +
    (under.floor * over.swing + over.floor * under.swing) * mean +
    under.swing * over.swing * lights
  const lost = clamp(1 - together / (under.level * over.level), 0, 0.99)
  return 1 / Math.sqrt(1 - 0.5 * lost) - 1
}

/** `raise_[j]`: what the join of band j and the next is raised by, half way between them. */
export function glimmerRaise(
  j: number,
  settings: GlimmerSettings,
  bands: GlimmerBands,
  overlaps: GlimmerOverlaps = glimmerOverlaps(settings, bands),
): number {
  const pattern = clamp(Math.round(settings.pattern), SCATTER, OUTWARD)
  const depth = (cell: number): number =>
    settings.depth * glimmerShare(glimmerCentre(cell, bands), settings.lean)
  return glimmerRaiseOf(
    depth(j),
    depth(j + 1),
    settings,
    pattern === OUTWARD && j === overlaps.cell ? overlaps.middle : overlaps.wave,
  )
}

/**
 * The tallest a gain can stand: the crest of a band with all of Depth, or the
 * join of two such bands both at their crests, which is raised. The picture's edge.
 */
export function glimmerTallest(settings: GlimmerSettings): number {
  const lift = glimmerLift(settings.depth, settings.soft, settings.vary)
  const raise = glimmerRaiseOf(
    settings.depth,
    settings.depth,
    settings,
    glimmerOverlap(1 / WAVE_CELLS, settings.soft),
  )
  return Math.min(MAX_LIFT, lift * (1 + raise))
}

/** `frame()`: the gain at `t` of the way from one band to the next: their join, raised, and never over the cap. */
export const glimmerJoin = (under: number, over: number, t: number, raise: number): number =>
  Math.min(MAX_LIFT, lerp(under, over, t) * (1 + 4 * t * (1 - t) * raise))

// --- The picture ------------------------------------------------------------------

/** The most bands the display works out: what lies under 20 kHz at the finest Grain, and two more. */
const BANDS_MOST = 202
/** The sound's level that counts as nothing and as all there, on the analyser's scale, dB. */
const HEARD_FOOT_DB = -84
const HEARD_TOP_DB = -24
/** How much sound a band is taken to have while none can be read: at rest, in a test. */
const HEARD_AT_REST = 0.45
/** How strongly the water is laid: where nothing sounds, and where the sound is at its fullest. */
const BODY_LEAST = 0.1
const BODY_MOST = 0.36
/** The same for the light on it, and how much of that its reflection keeps. */
const LIGHT_LEAST = 0.45
const LIGHT_MOST = 1
const REFLECTION = 0.6
/** The room the ruler of Rate takes at the display's right end, and how far its ends stand from top and foot. */
const RULER_ROOM = 13
const RULER_INSET = 7
const RULER_MARKS_HZ = [0.1, 1, 10]
/** How far the picture stands off the display's top and foot (a ring's room). */
const FIELD_TOP = 6.5
const FIELD_FOOT = 5
/** Of the picture's height, what the left side takes above the water line; the right side has the rest below. */
const UPPER_SHARE = 0.68
/** How far in from the picture's end the Depth ring stands. */
const DEPTH_INSET = 7

type Spot = [number, number]

export interface GlimmerLayout {
  /** The picture: the spectrum across, the left side above `water` and the right below. */
  field: Box
  /** The water line, and how tall the tallest crest stands above it and hangs below. */
  water: number
  up: number
  down: number
  /** The ruler of Rate: where it stands, and where the lowest Rate and the highest lie on it. */
  rulerX: number
  rulerFoot: number
  rulerTop: number
}

export function glimmerLayout(view: Pick<DisplayView, 'width' | 'height'>): GlimmerLayout {
  const field: Box = {
    x: 4,
    y: FIELD_TOP,
    w: view.width - 8 - RULER_ROOM,
    h: view.height - FIELD_TOP - FIELD_FOOT,
  }
  const up = field.h * UPPER_SHARE
  return {
    field,
    water: field.y + up,
    up,
    down: field.h - up,
    rulerX: view.width - 4 - RULER_ROOM / 2,
    rulerFoot: view.height - RULER_INSET,
    rulerTop: RULER_INSET,
  }
}

const settingsOf = (view: Pick<DisplayView, 'value'>): GlimmerSettings => ({
  depth: clamp(view.value('depth'), 0, 1),
  pattern: view.value('pattern'),
  lean: clamp(view.value('lean'), -1, 1),
  soft: clamp(view.value('soft'), 0, 1),
  vary: clamp(view.value('vary'), 0, 1),
  apart: clamp(view.value('apart'), 0, 1),
})

/**
 * A gain as Mix lets it be heard, against the tallest crest as Mix lets that
 * be heard: how far a point stands from the water line, 0 on it and 1 at the
 * picture's edge. The dry sound and the wet are in step, so Mix is a straight
 * line between 1 and the gain.
 */
export const glimmerHeight = (gain: number, top: number, mix: number): number =>
  (1 + mix * (gain - 1)) / (1 + mix * (top - 1))

/**
 * How high the water's edge stands at `hz` with Depth at `depth`: the dip of
 * the band there, or of the join of the two it lies between, against the
 * tallest a gain can stand. What the picture draws in that column.
 */
export function glimmerDipAt(
  depth: number,
  hz: number,
  settings: GlimmerSettings,
  bands: GlimmerBands,
  mix: number,
): number {
  const now = { ...settings, depth }
  const place = glimmerPlace(hz, bands)
  const j = Math.floor(place)
  const trough = (cell: number): number => {
    const d = depth * glimmerShare(glimmerCentre(cell, bands), settings.lean)
    return glimmerLift(d, settings.soft, settings.vary) * (1 - d)
  }
  const edge = glimmerJoin(
    trough(j),
    trough(j + 1),
    glimmerBlend(place - j),
    glimmerRaise(j, now, bands),
  )
  return glimmerHeight(edge, glimmerTallest(now), mix)
}

/** The Depth whose water's edge at `hz` stands at `height`: found by halving, as the edge only falls while Depth rises. */
export function glimmerDepthAt(
  height: number,
  hz: number,
  settings: GlimmerSettings,
  bands: GlimmerBands,
  mix: number,
): number {
  if (height >= 1) return 0
  if (height <= glimmerDipAt(1, hz, settings, bands, mix)) return 1
  let low = 0
  let high = 1
  for (let n = 0; n < 30; n++) {
    const middle = (low + high) / 2
    if (glimmerDipAt(middle, hz, settings, bands, mix) > height) low = middle
    else high = middle
  }
  return (low + high) / 2
}

/**
 * How many columns the picture is drawn in, a pixel each, and the middle of
 * the one a point lies in (the lower one, for a point on the line between two).
 */
const columnsOf = (field: Box): number => Math.max(2, Math.round(field.w))
function columnMiddle(x: number, field: Box): number {
  const columns = columnsOf(field)
  const step = field.w / columns
  return field.x + (clamp(Math.ceil((x - field.x) / step) - 1, 0, columns - 1) + 0.5) * step
}

/**
 * How far the Depth ring travels: with the dip while Mix leaves it room, and
 * never less than it would at this much Mix. With little Mix the dip has next
 * to nowhere to go, and Depth is still to be set by hand: at 0.75 the ring has
 * over 20 px on a strip 48 high at any Soft and Vary.
 */
export const DEPTH_TRAVEL_LEAST = 0.75
const depthTravel = (view: Pick<DisplayView, 'value'>): number =>
  Math.max(DEPTH_TRAVEL_LEAST, clamp(view.value('mix'), 0, 1))

/** Where a Rate lies along the ruler, 0 at the lowest and 1 at the highest. */
const rateAt = (hz: number, low: number, high: number): number =>
  clamp(Math.log(Math.max(hz, low) / low) / Math.log(high / low), 0, 1)

function glimmerHandles(view: DisplayView): DisplayHandle[] {
  const { field, water, up, rulerX, rulerFoot, rulerTop } = glimmerLayout(view)
  const settings = settingsOf(view)
  const { depth, lean } = settings
  const travel = depthTravel(view)
  // A view has no sample rate: the bands as they lie at 48 kHz (at 96 kHz the finest are wider, and
  // the ring may stand a pixel off the edge where its column is a join).
  const bands = glimmerBands(clamp(view.value('grain'), 0, 1))
  // The Depth ring stands on the water's edge of its own column, at the end where the bands keep all of Depth.
  const depthX = lean >= 0 ? field.x + field.w - DEPTH_INSET : field.x + DEPTH_INSET
  const depthHz = hzOfX(columnMiddle(depthX, field), field)
  const rate = view.spec('rate')
  const low = rate?.min ?? 0.03
  const high = rate?.max ?? 12
  const depthSpec = view.spec('depth')
  return [
    {
      // Up the ruler is faster, by equal steps for equal ratios.
      key: 'rate',
      name: 'Rate',
      x: rulerX,
      y: rulerFoot - rateAt(view.value('rate'), low, high) * (rulerFoot - rulerTop),
      drag: (_x, y) => ({
        rate: low * Math.pow(high / low, clamp((rulerFoot - y) / (rulerFoot - rulerTop), 0, 1)),
      }),
      reset: () => ({ rate: rate?.default ?? 1 }),
    },
    {
      // On the dip of the bands that keep all of Depth: the top of the spectrum, or its bottom when Lean is to the left.
      key: 'depth',
      name: 'Depth',
      x: depthX,
      y: water - glimmerDipAt(depth, depthHz, settings, bands, travel) * up,
      drag: (_x, y) => ({
        depth: clamp(
          glimmerDepthAt((water - y) / up, depthHz, settings, bands, travel),
          depthSpec?.min ?? 0,
          depthSpec?.max ?? 1,
        ),
      }),
      reset: () => ({ depth: depthSpec?.default ?? 0.65 }),
    },
  ]
}

interface GlimmerState {
  /** The device's clock as it is shown, in cycles; the reading of it last taken in, and how long that has stood. */
  theta: number
  reading: number
  stood: number
  /** Every band now: its crest (its lift), its trough, its gain on each side, and what its join with the next is raised by. */
  crest: Float64Array
  trough: Float64Array
  gain: [Float64Array, Float64Array]
  raise: Float64Array
  /** The line of the crests, a point a pixel, written again on every frame. */
  top: Spot[]
}

/** A line of so many points, kept from frame to frame so that none is made while it runs. */
function fit(line: Spot[], count: number): Spot[] {
  while (line.length < count) line.push([0, 0])
  line.length = count
  return line
}

const wrapClock = (cycles: number): number =>
  cycles - GLIMMER_CLOCK_WRAP * Math.floor(cycles / GLIMMER_CLOCK_WRAP)

/**
 * The clock on this frame from a reading that comes less often than frames
 * do: carried on at Rate between two readings, and brought half way to a new
 * one that is near, as the kit's `trackPhase` does for a phase. The same
 * reading for `PHASE_STANDS_SEC` means the device is not running (the engine
 * is stopped): then the clock stands on the reading.
 */
export function glimmerTrack(
  clock: { theta: number; reading: number; stood: number },
  reading: number,
  rate: number,
  dt: number,
): void {
  const carried = wrapClock(clock.theta + rate * dt)
  if (reading !== clock.reading) {
    const half = GLIMMER_CLOCK_WRAP / 2
    const ahead = wrapClock(carried - reading + half) - half
    const near = Math.abs(ahead) < Math.max(0.02, rate / 20)
    clock.theta = near ? wrapClock(carried - ahead * 0.5) : wrapClock(reading)
    clock.reading = reading
    clock.stood = 0
    return
  }
  clock.stood += dt
  clock.theta = clock.stood >= PHASE_STANDS_SEC ? wrapClock(reading) : carried
}

/** A rate as it is said: "0.05 Hz", "2.2 Hz", "12 Hz". */
const rateText = (hz: number): string =>
  `${hz < 0.995 ? hz.toFixed(2) : hz < 9.95 ? hz.toFixed(1) : hz.toFixed(0)} Hz`

/**
 * How much sound there is between two frequencies, 0 to 1, from the output's
 * spectrum: the loudest bin between them, or between two bins where a bin is
 * wider than that.
 */
function heard(signal: DisplaySignal | null, fromHz: number, toHz: number): number {
  const bins = signal?.spectrum
  const binHz = signal?.binHz ?? 0
  if (!bins || !(binHz > 0) || bins.length < 2) return HEARD_AT_REST
  let db = -Infinity
  if (toHz - fromHz < binHz) {
    const at = clamp((fromHz + toHz) / 2 / binHz, 1, bins.length - 1)
    const below = Math.floor(at)
    db = lerp(bins[below], bins[Math.min(bins.length - 1, below + 1)], at - below)
  } else {
    const first = clamp(Math.ceil(fromHz / binHz), 1, bins.length - 1)
    const last = clamp(Math.floor(toHz / binHz), first, bins.length - 1)
    for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
  }
  if (!Number.isFinite(db)) return 0
  return clamp((db - HEARD_FOOT_DB) / (HEARD_TOP_DB - HEARD_FOOT_DB), 0, 1)
}

/** The clock whose gains are heard now: the device's, less the time a frame takes to come out. */
export const glimmerHeardClock = (theta: number, rate: number, sampleRate: number): number =>
  theta - (rate * HEARD_LATE) / sampleRate

function glimmerDraw(frame: DisplayFrame<GlimmerState>): void {
  const { ctx, colours, state } = frame
  ground(frame)
  const { field, water, up, down, rulerX, rulerFoot, rulerTop } = glimmerLayout(frame)
  const settings = settingsOf(frame)
  // An attack passes round the flicker: while one does, the device turns its output to the dry
  // sound by so much (its `pass` reading), which is Mix taken down by as much.
  const pass =
    frame.powered && frame.hasMeter('pass') ? clamp(frame.meter('pass'), 0, 1) : 0
  const mix = clamp(frame.value('mix'), 0, 1) * (1 - pass)
  const rate = frame.value('rate')
  const bands = glimmerBands(clamp(frame.value('grain'), 0, 1), frame.sampleRate)

  // The device's clock; a plate that is switched off shows what it would do, standing.
  if (frame.powered && frame.hasMeter('clock'))
    glimmerTrack(state, frame.meter('clock'), rate, frame.dt)
  const theta = glimmerHeardClock(state.theta, rate, frame.sampleRate)

  // Every band under 20 kHz, and the one above the last, as the device has them now.
  const count = Math.min(BANDS_MOST, Math.floor(glimmerPlace(FREQ_MAX, bands)) + 2)
  const two = settings.apart > 0
  const overlaps = glimmerOverlaps(settings, bands)
  for (let j = 0; j < count; j++) {
    const left = glimmerBand(j, theta, settings, bands, 0)
    state.crest[j] = left.lift
    state.trough[j] = left.lift * (1 - left.depth)
    state.gain[0][j] = left.gain
    state.gain[1][j] = two ? glimmerBand(j, theta, settings, bands, 1).gain : left.gain
    state.raise[j] = glimmerRaise(j, settings, bands, overlaps)
  }
  // The tallest a gain can stand is the picture's edge.
  const tallest = glimmerTallest(settings)
  const heightOf = (gain: number): number => glimmerHeight(gain, tallest, mix)

  freqGrid(frame, field)

  // A column a pixel. The water in the ink, as far from the line as the band's
  // dip; what its light adds now in the accent: the left side above the line,
  // the right side below it as the left's reflection.
  const columns = columnsOf(field)
  const step = field.w / columns
  const top = fit(state.top, columns)
  for (let i = 0; i < columns; i++) {
    const x = field.x + (i + 0.5) * step
    const place = glimmerPlace(hzOfX(x, field), bands)
    const j = Math.min(count - 2, Math.floor(place))
    const t = glimmerBlend(place - j)
    // Between two bands the device joins their gains and raises the join by what it would lose.
    const raise = state.raise[j]
    const dip = heightOf(glimmerJoin(state.trough[j], state.trough[j + 1], t, raise))
    const left = heightOf(glimmerJoin(state.gain[0][j], state.gain[0][j + 1], t, raise))
    const right = heightOf(glimmerJoin(state.gain[1][j], state.gain[1][j + 1], t, raise))
    top[i][0] = x
    top[i][1] = water - heightOf(glimmerJoin(state.crest[j], state.crest[j + 1], t, raise)) * up
    const sound = heard(frame.signal, hzOfX(x - step / 2, field), hzOfX(x + step / 2, field))
    const column = field.x + i * step
    const light = lerp(LIGHT_LEAST, LIGHT_MOST, sound)
    fillRect(
      ctx,
      { x: column, y: water - dip * up, w: step, h: dip * (up + down) },
      colours.ink,
      lerp(BODY_LEAST, BODY_MOST, sound),
    )
    fillRect(
      ctx,
      { x: column, y: water - left * up, w: step, h: (left - dip) * up },
      colours.accent,
      light,
    )
    fillRect(
      ctx,
      { x: column, y: water + dip * down, w: step, h: (right - dip) * down },
      colours.accent,
      light * REFLECTION,
    )
  }

  // The sound untouched (a gain of 1), dashed, and the crests, faint: both on the left side's half.
  const untouched = water - heightOf(1) * up
  rule(ctx, field.x, untouched, field.x + field.w, untouched, {
    colour: colours.ink,
    alpha: INK.back,
    dash: [2, 3],
  })
  trace(ctx, top, { colour: colours.ink, width: 1, alpha: INK.rule })
  // The water line itself, which the two sides meet on.
  rule(ctx, field.x, water, field.x + field.w, water, { colour: colours.ink, alpha: INK.back })

  // The ruler of Rate, with a mark at 0.1, 1 and 10 Hz.
  const spec = frame.spec('rate')
  const low = spec?.min ?? 0.03
  const high = spec?.max ?? 12
  rule(ctx, rulerX, rulerTop, rulerX, rulerFoot, { colour: colours.ink, alpha: INK.rule })
  for (const hz of RULER_MARKS_HZ) {
    if (hz < low || hz > high) continue
    const y = rulerFoot - rateAt(hz, low, high) * (rulerFoot - rulerTop)
    rule(ctx, rulerX - 2.5, y, rulerX + 2.5, y, { colour: colours.ink, alpha: INK.back })
  }

  for (const point of glimmerHandles(frame)) {
    const hot = frame.hot === point.key
    handle(frame, point.x, point.y, { hot })
    if (point.key !== 'rate') continue
    // The lamp in the Rate ring: lit as a band is that flashes once a cycle, by the same clock.
    const lamp = glimmerLight(theta, 0, GLIMMER_CLOCK_WRAP, settings.soft, 0)
    if (!hot && lamp > 0) dot(ctx, point.x, point.y, 2, colours.accent, { alpha: lamp })
    // The Rate in words while the ring is under the pointer or in hand, on a patch over the picture.
    if (hot)
      label(frame, rateText(rate), point.x - 8, clamp(point.y + 3, 12, frame.height - 5), 'right')
  }
}

const display = plateDisplay<GlimmerState>({
  place: 'strip',
  params: ['depth', 'rate', 'grain', 'pattern', 'lean', 'soft', 'vary', 'apart', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'The spectrum from low to high, each band as tall as its gain now: the left side above the line, the right below it as a reflection. The second colour is what the light adds, the dashed line the sound untouched. An attack levels the water as it passes. Drag the rings for Rate and Depth.',
  init: () => ({
    theta: 0,
    reading: Number.NaN,
    stood: 0,
    crest: new Float64Array(BANDS_MOST),
    trough: new Float64Array(BANDS_MOST),
    gain: [new Float64Array(BANDS_MOST), new Float64Array(BANDS_MOST)],
    raise: new Float64Array(BANDS_MOST),
    top: [],
  }),
  draw: glimmerDraw,
  handles: glimmerHandles,
})

export const GLIMMER_FACES: Readonly<Record<string, PlateFace>> = {
  glimmer: { display, face: ['depth', 'rate', 'grain', 'pattern'] },
}
