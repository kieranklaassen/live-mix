// The display of Glints: sparks, where and when they sound.
//
// Across runs how far behind the playing a spark reads: now at the left, four
// seconds ago at the right. Up runs how fast it reads, a row for each speed
// the Pitch choice throws. A spark reads faster than the sound arrives, so it
// starts a way back and flies left as it catches up: that flight is the mark,
// with a point of light where it is reading now. The bands are where sparks
// may start: from the head start their Size needs, as far on as Scatter lets
// them. The device says which sparks it threw through display meters; while it
// says nothing the display throws a worked example from the settings alone.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  follow,
  ground,
  handle,
  label,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** Under this nothing sounds, as for the plate that draws the display. */
const QUIET = 1e-4

/**
 * `glints.h`: the speeds (`kNumRows` of them, from two up), and for each
 * Pitch choice the chance a spark takes each, summed along the row as
 * `kChance` has it.
 */
export const GLINTS_ROWS = 7
export const GLINTS_CHANCE: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1],
  [0.45, 0.7, 1, 1, 1, 1, 1],
  [0.24, 0.43, 0.59, 0.72, 0.83, 0.92, 1],
]
/** `glints.h`: which decimated copy a speed reads (`kRingOf`), how late each copy is in samples (`kLag`), and the samples kept clear of the write head in a copy (`kHeadRoom`). */
const GLINTS_RING_OF = [1, 2, 2, 3, 3, 3, 3] as const
const GLINTS_LAG = [0, 31, 93, 217] as const
const GLINTS_HEAD_ROOM = 12
/** `glints.h`: a spark's front edge at Sparkle 0 and at 1 in seconds, and the most of its length the edge takes. */
const GLINTS_SOFT_EDGE_SEC = 0.006
const GLINTS_SHARP_EDGE_SEC = 0.0003
const GLINTS_MOST_EDGE = 0.3
/** `glints.h`: how much Sparkle lifts a spark (`kSparkleLift`), and what a Trail of one gives back each time round (`kMaxFeedback`). */
const GLINTS_SPARKLE_LIFT = 1
const GLINTS_MAX_FEEDBACK = 0.85
/** `glints.h`, `throw_spark()`: what a spark's reading holds: lateness in steps of 2 ms, loudness in steps of 6 dB up from −42. */
const GLINTS_LATE_STEP_SEC = 0.002
const GLINTS_LOUD_STEPS = 7

/** The lateness the picture spans: the longest head start (the eighth harmonic at the longest Size) and the most Scatter after it. */
export const GLINTS_SPAN_SEC = 4.2
/** The lines of the time scale, in seconds back, and the ones that are named. */
const GLINTS_TIME_LINES = [0.25, 0.5, 1, 2, 4] as const
const GLINTS_TIME_NAMED = [1, 2] as const
/** Sparks the display keeps. */
const GLINTS_KEPT = 96
/** How long a spark's flight stays where it ended, fading. */
const GLINTS_GLOW_SEC = 1.2
/** How long after the device last threw or paced the picture stays its own before the worked example comes back. */
const GLINTS_LINGER_SEC = 2.5
/** The most repeats of a trail drawn, and the quietest one drawn. */
const GLINTS_ECHOES = 6
const GLINTS_ECHO_LEAST = 0.06
/** The slowest the worked example is thrown, so that one spark at least is in sight. */
const GLINTS_EXAMPLE_PACE = 1.2
/** How loud the worked example's sparks are, in steps of the reading. */
const GLINTS_EXAMPLE_LOUD = 5
/** How strongly a row's band is laid: the row the fewest sparks land on, and the one the most do. */
const GLINTS_BAND_LEAST = 0.1
const GLINTS_BAND_MOST = 0.2
/** The faintest a crowd of sparks is drawn, so that one of forty a second is still seen. */
const GLINTS_CROWD_LEAST = 0.4
/** How strongly a flight is laid under its point of light while the spark sounds, and just after. */
const GLINTS_FLIGHT = 0.7
const GLINTS_GLOW = 0.55
/** How far apart the two rings stand at the least, when both are on one row. */
const GLINTS_RING_GAP = 9

export interface GlintsSpark {
  /** Which speed: 0 is twice as fast. */
  row: number
  /** −1 left to 1 right. */
  pan: number
  /** Seconds behind the playing it began to read. */
  late: number
  /** 0..7: how loud what it reads was. */
  loud: number
}

interface KeptSpark extends GlintsSpark {
  /** Seconds it lasts, and how much of that its front edge takes. */
  length: number
  edge: number
  born: number
}

interface GlintsState {
  sparks: KeptSpark[]
  next: number
  /** The device's count of sparks at the last reading; null before the first. */
  count: number | null
  /** When the device last threw a spark or kept a pace. */
  lastAt: number
  /** The pace as the gauge shows it. */
  pace: number
}

export interface GlintsLayout {
  /** The pace, at the left. */
  gauge: Box
  /** Where the sparks fly. */
  field: Box
  /** The highest row and the lowest. */
  top: number
  bottom: number
}

export function glintsLayout(view: Pick<DisplayView, 'width' | 'height'>): GlintsLayout {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  // Room above the highest row and under the lowest for a ring and a spark thrown to one side.
  const edge = clamp(all.h * 0.14, 5, 12)
  return {
    gauge: { x: all.x, y: all.y, w: 5, h: all.h },
    field: { x: all.x + 23, y: all.y, w: all.w - 26, h: all.h },
    top: all.y + edge,
    bottom: all.y + all.h - edge,
  }
}

/** Where a lateness stands: the cube root across, so the first half second has half the width, where most sparks start. */
export const glintsX = (late: number, layout: GlintsLayout): number =>
  layout.field.x + Math.cbrt(clamp(late, 0, GLINTS_SPAN_SEC) / GLINTS_SPAN_SEC) * layout.field.w
export const glintsLateAt = (x: number, layout: GlintsLayout): number =>
  GLINTS_SPAN_SEC * Math.pow(clamp((x - layout.field.x) / layout.field.w, 0, 1), 3)

/** The Pitch choice a view is set to. */
const setOf = (view: Pick<DisplayView, 'value'>): number =>
  clamp(Math.round(view.value('pitch')), 0, GLINTS_CHANCE.length - 1)

/** The chance a spark of a Pitch choice takes a row. */
export function glintsChance(set: number, row: number): number {
  const sums = GLINTS_CHANCE[clamp(Math.round(set), 0, GLINTS_CHANCE.length - 1)]
  return sums[row] - (row > 0 ? sums[row - 1] : 0)
}

/** The rows a Pitch choice throws, lowest first. */
export function glintsRows(set: number): number[] {
  const rows: number[] = []
  for (let row = 0; row < GLINTS_ROWS; row++) if (glintsChance(set, row) > 0) rows.push(row)
  return rows
}

/** The row a draw of the dice (0..1) lands on: `throw_spark()`. */
export function glintsRowOf(set: number, pick: number): number {
  const sums = GLINTS_CHANCE[clamp(Math.round(set), 0, GLINTS_CHANCE.length - 1)]
  let row = 0
  while (row < GLINTS_ROWS - 1 && pick >= sums[row]) row += 1
  return row
}

/** Octaves the rows of a Pitch choice run over: one for the choices up to two octaves, two for Overtones. */
const octavesOf = (set: number): number => (set >= 4 ? 2 : 1)

/** Where a row stands: equal steps for equal intervals, twice as fast on the lowest line. */
export function glintsY(row: number, set: number, layout: GlintsLayout): number {
  const up = clamp(Math.log2((row + 2) / 2) / octavesOf(set), 0, 1)
  return layout.bottom - up * (layout.bottom - layout.top)
}

/** How far up or down in its row a spark thrown hard to one side stands: under half the way to the nearest row. */
export function glintsReach(set: number, layout: GlintsLayout): number {
  const nearest = set >= 4 ? Math.log2(8 / 7) : Math.log2(4 / 3)
  return Math.min(5, (0.4 * nearest * (layout.bottom - layout.top)) / octavesOf(set))
}

/** The stretch a spark keeps clear of the write head, in seconds: `room` in `throw_spark()`. */
export function glintsRoom(row: number, sampleRate = 48000): number {
  const ring = GLINTS_RING_OF[clamp(row, 0, GLINTS_ROWS - 1)]
  return (GLINTS_LAG[ring] + GLINTS_HEAD_ROOM * (1 << ring)) / sampleRate
}

/** The least a spark starts behind the playing, in seconds: its head start, so that reading `row + 2` times as fast it ends where the sound has only just arrived. */
export function glintsLeast(row: number, sizeMs: number, sampleRate = 48000): number {
  return (row + 1) * sizeMs * 0.001 + glintsRoom(row, sampleRate)
}

/** How far behind the playing a spark starts for a draw of the dice (0..1): Scatter by the draw's square on top of the least. */
export function glintsLate(row: number, sizeMs: number, scatterMs: number, wait: number): number {
  return glintsLeast(row, sizeMs) + scatterMs * 0.001 * wait * wait
}

/** How much of a spark's length its front edge takes: `edge` in `throw_spark()`. */
export function glintsEdge(sparkle: number, lengthSec: number): number {
  const seconds =
    GLINTS_SOFT_EDGE_SEC * Math.pow(GLINTS_SHARP_EDGE_SEC / GLINTS_SOFT_EDGE_SEC, sparkle)
  return Math.min(GLINTS_MOST_EDGE, seconds / Math.max(1e-4, lengthSec))
}

/** A spark's window at `phase` (0..1) of its life: `render()`, a smooth step up over the edge and a fall by the square after it. */
export function glintsWindow(phase: number, edge: number): number {
  if (!(phase >= 0 && phase < 1)) return 0
  if (phase < edge) {
    const t = phase / edge
    return t * t * (3 - 2 * t)
  }
  const fall = 1 - (phase - edge) / (1 - edge)
  return fall * fall
}

/** Sparks a second: `control()`, Density all the way with Follow at nothing, and with Follow up as much of it as the playing is loud and bright (0..1). */
export function glintsPace(density: number, followed: number, playing: number): number {
  return density * (1 - followed + followed * clamp(playing, 0, 1))
}

/** How far the device turns sparks down where they overlap: `throw_spark()`, by the square root of how many sound at once. */
export function glintsCrowd(density: number, lengthSec: number): number {
  return Math.min(1, 1 / Math.sqrt(Math.max(1e-6, density * lengthSec)))
}

/** What one of the device's spark readings says: `throw_spark()` packs the row, the side, the lateness and the loudness into one number. Null for a reading that is not one. */
export function glintsSpark(reading: number): GlintsSpark | null {
  if (!Number.isFinite(reading) || reading < 0 || reading >= 16777216) return null
  const code = Math.floor(reading)
  const row = code & 7
  if (row >= GLINTS_ROWS) return null
  return {
    row,
    pan: ((code >> 3) & 63) / 31.5 - 1,
    late: ((code >> 9) & 4095) * GLINTS_LATE_STEP_SEC,
    loud: (code >> 21) & 7,
  }
}

/** A number in 0..1 that is the same every time for the same spark and draw: the worked example's dice. */
function dice(index: number, draw: number): number {
  let h = Math.imul(index + 1, 374761393) ^ Math.imul(draw + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** The gain Mix gives the sparks: `kit::equal_power`, the sine of Mix quarter turns. */
const wetGain = (view: Pick<DisplayView, 'value'>): number =>
  Math.sin(clamp(view.value('mix'), 0, 1) * (Math.PI / 2))

/** Where a pace stands on the gauge: equal steps for equal ratios over Density's range. */
export function glintsPaceY(pace: number, view: DisplayView, layout: GlintsLayout): number {
  const spec = view.spec('density')
  const least = spec?.min ?? 0.2
  const most = spec?.max ?? 40
  const up = Math.log(clamp(pace, least, most) / least) / Math.log(most / least)
  return layout.gauge.y + layout.gauge.h * (1 - up)
}

function glintsHandles(view: DisplayView): DisplayHandle[] {
  const layout = glintsLayout(view)
  const set = setOf(view)
  const rows = glintsRows(set)
  const low = rows[0]
  const high = rows[rows.length - 1]
  const size = view.value('size')
  const scatter = view.value('scatter')
  const sizeSpec = view.spec('size')
  const scatterSpec = view.spec('scatter')
  // Size stands where the highest row's sparks start at the least, for they need the longest head start.
  const sizeX = glintsX(glintsLeast(high, size), layout)
  // Scatter stands where the lowest row's sparks start at the most. With no
  // Scatter on a single row that is where Size stands, so it is drawn a little
  // clear of it and moved from where the setting lies.
  const leastLow = glintsLeast(low, size)
  const scatterAt = glintsX(leastLow + scatter * 0.001, layout)
  const scatterX = low === high ? Math.max(scatterAt, sizeX + GLINTS_RING_GAP) : scatterAt
  return [
    {
      key: 'size',
      name: 'Size',
      x: sizeX,
      y: glintsY(high, set, layout),
      drag: (x) => ({
        size: clamp(
          ((glintsLateAt(x, layout) - glintsRoom(high)) / (high + 1)) * 1000,
          sizeSpec?.min ?? 8,
          sizeSpec?.max ?? 300,
        ),
      }),
      reset: () => ({ size: sizeSpec?.default ?? 70 }),
    },
    {
      key: 'scatter',
      name: 'Scatter',
      x: scatterX,
      y: glintsY(low, set, layout),
      drag: (x, _y, hold) => {
        const kept = hold ?? {}
        kept.clear ??= scatterX - scatterAt
        return {
          scatter: clamp(
            (glintsLateAt(x - kept.clear, layout) - leastLow) * 1000,
            scatterSpec?.min ?? 0,
            scatterSpec?.max ?? 2000,
          ),
        }
      },
      reset: () => ({ scatter: scatterSpec?.default ?? 350 }),
    },
  ]
}

/** A point of light: a cross whose arms Sparkle lengthens about a core it tightens. */
function glint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  sparkle: number,
  colour: string,
  alpha: number,
): void {
  const arm = size * (0.6 + 0.9 * sparkle)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - arm, y)
  ctx.lineTo(x + arm, y)
  ctx.moveTo(x, y - arm)
  ctx.lineTo(x, y + arm)
  ctx.stroke()
  dot(ctx, x, y, size * (0.9 - 0.5 * sparkle), colour, { alpha })
}

const glints = plateDisplay<GlintsState>({
  place: 'strip',
  params: [
    'density',
    'pitch',
    'size',
    'scatter',
    'follow',
    'sparkle',
    'spread',
    'trail',
    'trailTime',
    'mix',
  ],
  live: { meters: true },
  info: 'Each spark flies left from how far back in the playing it starts to where it has caught up, on the row of its speed, up in the row for left and down for right. The bands are where sparks may start: drag the rings for Size and Scatter. The bar at the left is sparks a second.',
  init: () => ({
    sparks: Array.from({ length: GLINTS_KEPT }, () => ({
      row: 0,
      pan: 0,
      late: 0,
      loud: 0,
      length: 0,
      edge: 0,
      born: Number.NEGATIVE_INFINITY,
    })),
    next: 0,
    count: null,
    lastAt: Number.NEGATIVE_INFINITY,
    pace: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = glintsLayout(frame)
    const { gauge, field } = layout
    const set = setOf(frame)
    const rows = glintsRows(set)
    const size = frame.value('size')
    const scatter = frame.value('scatter')
    const density = frame.value('density')
    const followed = frame.value('follow')
    const sparkle = frame.value('sparkle')
    const spread = frame.value('spread')
    const gap = frame.value('trailTime') * 0.001
    const feedback = frame.value('trail') * GLINTS_MAX_FEEDBACK
    const length = size * 0.001
    const reach = glintsReach(set, layout)
    const wet = wetGain(frame)
    const heard = wet > QUIET

    // What the device reports: the sparks it threw since the last reading, and its pace.
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('sparks')
    if (running) {
      const reading = frame.meter('sparks')
      const count = Number.isFinite(reading) && reading >= 0 ? Math.floor(reading) : null
      if (count !== null && state.count !== null && count > state.count) {
        // The device keeps its newest four: more than that between two readings and the rest are lost.
        const fresh = Math.min(4, count - state.count)
        for (let back = fresh - 1; back >= 0; back--) {
          const spark = glintsSpark(frame.meter(`spark${back + 1}`))
          // What the device throws unheard is followed and not kept as something heard.
          if (!spark || !heard) continue
          const kept = state.sparks[state.next]
          state.next = (state.next + 1) % GLINTS_KEPT
          kept.row = spark.row
          kept.pan = spark.pan
          kept.late = spark.late
          kept.loud = spark.loud
          kept.length = length
          kept.edge = glintsEdge(sparkle, length)
          kept.born = frame.now
        }
        state.lastAt = frame.now
      }
      if (count !== null) state.count = count
      const pace = frame.meter('pace')
      const paced = Number.isFinite(pace) && pace > 0 ? pace : 0
      if (paced > 0) state.lastAt = frame.now
      state.pace = follow(state.pace, paced, frame.dt, 0.03, 0.15)
    }
    const live = frame.powered && heard && frame.now - state.lastAt < GLINTS_LINGER_SEC

    // The time scale: a quarter of a second back, and each line twice as far as the one before.
    for (const seconds of GLINTS_TIME_LINES) {
      const x = glintsX(seconds, layout)
      rule(ctx, x, field.y, x, field.y + field.h, { colour: colours.ink, alpha: INK.grid })
    }

    // The rows. One the Pitch choice throws has a line from now out to where
    // its sparks start, and a band over where they start: from the least, as
    // far on as Scatter lets them, as high as Spread throws them to the sides,
    // and stronger the more of the sparks land on it.
    const most = Math.max(...rows.map((row) => glintsChance(set, row)))
    const scaleTop = set >= 4 ? GLINTS_ROWS - 1 : 2
    for (let row = 0; row <= scaleTop; row++) {
      const y = glintsY(row, set, layout)
      const chance = glintsChance(set, row)
      if (chance <= 0) {
        rule(ctx, field.x, y, field.x + field.w, y, {
          colour: colours.ink,
          alpha: INK.grid,
          dash: [1, 3],
        })
        continue
      }
      const from = glintsX(glintsLeast(row, size, frame.sampleRate), layout)
      const to = glintsX(glintsLeast(row, size, frame.sampleRate) + scatter * 0.001, layout)
      rule(ctx, field.x, y, from, y, { colour: colours.ink, alpha: INK.rule })
      const half = 1 + spread * reach
      fillRect(
        ctx,
        { x: from, y: y - half, w: Math.max(1.5, to - from), h: half * 2 },
        colours.ink,
        GLINTS_BAND_LEAST + (GLINTS_BAND_MOST - GLINTS_BAND_LEAST) * (chance / most),
      )
    }

    // The pace: Density's range upward, the stretch Follow lets the playing
    // move the pace over, a line at Density, and the pace the device keeps now.
    fillRect(ctx, gauge, colours.ink, INK.grid)
    const full = glintsPaceY(density, frame, layout)
    const idle = glintsPaceY(glintsPace(density, followed, 0), frame, layout)
    fillRect(
      ctx,
      { x: gauge.x, y: full, w: gauge.w, h: Math.max(1, idle - full) },
      colours.ink,
      INK.back,
    )
    rule(ctx, gauge.x, full, gauge.x + gauge.w + 2, full, { colour: colours.ink })
    if (live && state.pace > 0) {
      const y = glintsPaceY(state.pace, frame, layout)
      fillRect(ctx, { x: gauge.x, y: y - 1, w: gauge.w + 2, h: 2 }, colours.accent)
    }

    // A spark and the repeats its trail gives it. Each is a flight from where
    // it began to read to where it reads now, with a point of light there
    // while it sounds; afterwards the flight stays a moment and fades. A
    // repeat is the same sound that much later, so it stands that much
    // further back, and on the other side, for the trail crosses.
    // As strong as Mix lets the sparks be heard, and fainter where the device turns a crowd down.
    const strong = (0.4 + 0.6 * wet) * Math.max(GLINTS_CROWD_LEAST, glintsCrowd(density, length))
    const mark = (spark: KeptSpark | GlintsSpark, age: number, colour: string): void => {
      const lasts = 'length' in spark ? spark.length : length
      const edge = 'edge' in spark ? spark.edge : glintsEdge(sparkle, length)
      if (!(age >= 0) || !(lasts > 0)) return
      const y = glintsY(spark.row, set, layout)
      const travel = (spark.row + 1) * lasts
      const loud = 0.45 + (0.55 * spark.loud) / GLINTS_LOUD_STEPS
      let gain = 1
      for (let echo = 0; echo <= GLINTS_ECHOES; echo++) {
        const since = age - echo * gap
        const began = spark.late + echo * gap
        if (since < 0 || began - travel > GLINTS_SPAN_SEC || gain < GLINTS_ECHO_LEAST) break
        if (since < lasts + GLINTS_GLOW_SEC) {
          const sounding = since < lasts
          const phase = Math.min(1, since / lasts)
          const window = sounding ? glintsWindow(phase, edge) : 0
          const fade = sounding
            ? GLINTS_FLIGHT
            : GLINTS_GLOW * (1 - (since - lasts) / GLINTS_GLOW_SEC)
          const side = (echo % 2 === 0 ? spark.pan : -spark.pan) * reach
          const from = glintsX(began, layout)
          const at = glintsX(began - travel * phase, layout)
          // (never shorter than a pixel and a half: the shortest spark is still to be seen)
          const to = Math.min(at, from - 1.5)
          ctx.globalAlpha = strong * gain * fade
          ctx.fillStyle = colour
          ctx.fillRect(to, y + side - 0.5, from - to, 1)
          ctx.globalAlpha = 1
          // The point of light: as large as the spark's window is open while it sounds, and
          // afterwards a small one where it ended, fading with its flight.
          glint(
            ctx,
            at,
            y + side,
            (1.6 + 3 * window) * loud * (0.5 + 0.5 * gain),
            sparkle * GLINTS_SPARKLE_LIFT,
            colour,
            strong * gain * (sounding ? 1 : fade),
          )
        }
        gain *= feedback
      }
    }
    clipped(ctx, { x: field.x - 2, y: field.y, w: field.w + 4, h: field.h }, () => {
      if (live) {
        for (const spark of state.sparks) mark(spark, frame.now - spark.born, colours.accent)
        return
      }
      if (!heard) return
      // At rest, the sparks of the last moments as the settings throw them
      // while something plays, each drawn as `throw_spark()` draws one, the
      // newest still sounding.
      const pace = Math.max(density, GLINTS_EXAMPLE_PACE)
      const many = clamp(Math.ceil(pace * (length + GLINTS_GLOW_SEC)), 1, GLINTS_KEPT)
      const example: GlintsSpark = { row: 0, pan: 0, late: 0, loud: GLINTS_EXAMPLE_LOUD }
      for (let i = 0; i < many; i++) {
        const depth = dice(i, 3)
        example.row = glintsRowOf(set, dice(i, 0))
        example.late = glintsLate(example.row, size, scatter, dice(i, 1))
        example.pan = spread * (dice(i, 2) < 0.5 ? -1 : 1) * (1 - depth * depth * depth)
        mark(
          example,
          0.15 * length + (i === 0 ? 0 : (i - 0.5 + 0.5 * dice(i, 4)) / pace),
          colours.ink,
        )
      }
    })

    // The names: the speeds thrown beside their rows where there is room, and the seconds on the time scale.
    // The octaves first, then what stands between them where it is clear of every name already there.
    const named: number[] = []
    for (const row of [0, 2, 6, 1, 4, 3, 5]) {
      if (glintsChance(set, row) <= 0) continue
      const y = glintsY(row, set, layout)
      if (named.some((other) => Math.abs(y - other) < 9)) continue
      named.push(y)
      text(frame, `×${row + 2}`, field.x - 3, y + 3, { align: 'right' })
    }
    const lowest = glintsY(0, set, layout)
    for (const seconds of GLINTS_TIME_NAMED) {
      label(frame, `${seconds} s`, glintsX(seconds, layout) + 3, lowest - reach - 3)
    }

    for (const point of glintsHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
  },
  handles: glintsHandles,
})

export const GLINTS_FACES: Readonly<Record<string, PlateFace>> = {
  glints: {
    display: glints,
    face: ['density', 'pitch', 'sparkle', 'mix'],
  },
}
