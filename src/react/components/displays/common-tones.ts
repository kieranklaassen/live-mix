// The display of Common Tones: the sound now against the sound Ago before,
// third octave by third octave, with what the device lets through filled in.
//
// The device reports three levels for each of 24 third octaves from 62.5 Hz:
// now, then (the past it compares with) and let through (the wet sound, with
// the make-up it was given), each as the amplitude of a sine that would read
// the same. Now is a pale column,
// then a mark across it with the leeway Strict gives standing over the mark
// as a shade, and what is let through fills the column as far as Mix lets it
// be heard. Along the top, how far back then is. While no sound has come it
// shows a worked example from the settings alone: a held note, a note that
// has stopped and a note that has just begun, through the device's own gain.

import {
  INK,
  clamp,
  dbOfY,
  dbToGain,
  fillRect,
  follow,
  freqGrid,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  yOfDb,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** `common_tones.h`: kBands third octaves from kBandLowHz, so the last one ends at 16 kHz. */
export const TONES_BANDS = 24
export const TONES_LOW_HZ = 62.5
export const TONES_HIGH_HZ = TONES_LOW_HZ * Math.pow(2, TONES_BANDS / 3)
/** kMaxLeewayDb: at Strict 0 a bin may be this much louder than it was and still count whole. */
export const TONES_MAX_LEEWAY_DB = 24
/** The scale the levels are drawn on: 60 dB, from half of full scale at the top. */
export const TONES_TOP_DB = -6
export const TONES_FOOT_DB = -66
/** Where the leeway's own mark stands on that scale: the foot of the point that sets Strict. */
export const TONES_GAUGE_DB = -54
/** Under this nothing sounds, as for the plate that draws the display. */
const QUIET = 1e-4
/** How long after the last sound the readings stay before the worked example comes back, seconds. */
const TONES_REST_SEC = 0.5
/** The marks on the ruler of Ago, ms. */
const TONES_RULER_MS = [100, 1000]

/** The meters, by band: `now1`..`now24`, `then1`..`then24`, `heard1`..`heard24`. */
const TONES_NOW = Array.from({ length: TONES_BANDS }, (_, band) => `now${band + 1}`)
const TONES_THEN = Array.from({ length: TONES_BANDS }, (_, band) => `then${band + 1}`)
const TONES_HEARD = Array.from({ length: TONES_BANDS }, (_, band) => `heard${band + 1}`)
const TONES_METERS = [TONES_NOW, TONES_THEN, TONES_HEARD]

/** `apply(kStrict)`: the leeway in dB, 24 at Strict 0 and none at 1. */
export const tonesLeewayDb = (strict: number): number =>
  TONES_MAX_LEEWAY_DB * (1 - clamp(strict, 0, 1))

/** `apply(kFloor)`: the gain of what is turned down; the bottom of the knob is nothing at all. */
export const tonesFloorGain = (floorDb: number, minDb = -36): number =>
  floorDb <= minDb + 0.01 ? 0 : dbToGain(floorDb)

/**
 * The gain `frame()` gives a bin that is `now` loud and was `then` loud (both
 * amplitudes): whole while now is within the leeway of then, and from there
 * the limit over now in power; Changes is what that leaves; Floor is the
 * gain of what is turned down.
 */
export function tonesGain(
  now: number,
  then: number,
  strict: number,
  changes: boolean,
  floorGain: number,
): number {
  const a = now * now
  const limit = Math.pow(10, 0.1 * tonesLeewayDb(strict)) * then * then
  const common = a > limit ? limit / a : 1
  const share = changes ? 1 - common : common
  return floorGain + (1 - floorGain) * share
}

/** Where Ago stands along its ruler, 0..1: the knob's own travel, equal steps for equal ratios. */
export const tonesAgoAt = (ms: number, minMs = 50, maxMs = 8000): number =>
  clamp(Math.log(ms / minMs) / Math.log(maxMs / minMs), 0, 1)

/** Ago in words: "350 ms", "2.0 s". */
export const tonesAgoText = (ms: number): string =>
  ms < 999.5 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`

/**
 * The worked example, in dB per band: a held note and its overtones (the
 * same then and now), a note that has stopped (loud then, dying now), a note
 * that has just begun (loud now, not there then), over a hiss that falls with
 * frequency.
 */
export const TONES_EXAMPLE_THEN_DB = [
  -50, -44, -12, -40, -42, -18, -40, -24, -28, -36, -14, -38, -40, -22, -42, -44, -30, -46, -48,
  -50, -52, -54, -56, -58,
]
export const TONES_EXAMPLE_NOW_DB = [
  -50, -44, -12, -40, -42, -18, -40, -24, -28, -36, -34, -14, -38, -40, -22, -44, -44, -30, -48,
  -50, -52, -54, -56, -58,
]

export interface TonesLayout {
  /** The ruler of Ago along the top. */
  ruler: Box
  /** The bands. */
  box: Box
  /** The middle of the leeway's mark, right of the bands. */
  gaugeX: number
}

export function tonesLayout(view: Pick<DisplayView, 'width' | 'height'>): TonesLayout {
  const box = { x: 4, y: 17, w: view.width - 19, h: view.height - 21 }
  return {
    ruler: { x: 6, y: 4, w: view.width - 12, h: 8 },
    box,
    gaugeX: box.x + box.w + 6.5,
  }
}

/** Where a level in dB stands in the bands, kept inside them. */
export const tonesY = (db: number, box: Box): number =>
  clamp(yOfDb(db, box, TONES_TOP_DB, TONES_FOOT_DB), box.y, box.y + box.h)

/** A band's left and right edges in whole pixels, a pixel of ground between it and the next. */
export function tonesBandX(band: number, box: Box): [left: number, right: number] {
  const left = Math.round(box.x + (band / TONES_BANDS) * box.w)
  const right = Math.round(box.x + ((band + 1) / TONES_BANDS) * box.w) - 1
  return [left, Math.max(left + 1, right)]
}

function tonesHandles(view: DisplayView): DisplayHandle[] {
  const { ruler, box, gaugeX } = tonesLayout(view)
  const ago = view.spec('ago')
  const minMs = ago?.min ?? 50
  const maxMs = ago?.max ?? 8000
  const perDb = box.h / (TONES_TOP_DB - TONES_FOOT_DB)
  return [
    {
      key: 'ago',
      name: 'Ago',
      x: ruler.x + tonesAgoAt(view.value('ago'), minMs, maxMs) * ruler.w,
      y: ruler.y + ruler.h / 2,
      drag: (x) => ({
        ago: minMs * Math.pow(maxMs / minMs, clamp((x - ruler.x) / ruler.w, 0, 1)),
      }),
      reset: () => ({ ago: ago?.default ?? 350 }),
    },
    {
      key: 'strict',
      name: 'Leeway',
      x: gaugeX,
      // As far over the mark as a band may rise over its past and still count whole.
      y:
        yOfDb(TONES_GAUGE_DB, box, TONES_TOP_DB, TONES_FOOT_DB) -
        tonesLeewayDb(view.value('strict')) * perDb,
      drag: (_x, y) => ({
        strict: clamp(
          1 - (dbOfY(y, box, TONES_TOP_DB, TONES_FOOT_DB) - TONES_GAUGE_DB) / TONES_MAX_LEEWAY_DB,
          0,
          1,
        ),
      }),
      reset: () => ({ strict: view.spec('strict')?.default ?? 0.6 }),
    },
  ]
}

interface TonesState {
  /** The three levels of each band, eased so they do not flicker: now, then, let through. */
  levels: Float32Array
  /** When a band last read over the foot of the scale, on the frame clock; null before any has. */
  soundAt: number | null
  /** The worked example's levels, amplitudes, as the settings make them. */
  example: Float32Array
}

/** The worked example's three levels per band, amplitudes, into `out`: now, then, let through. */
export function tonesExample(
  strict: number,
  changes: boolean,
  floorGain: number,
  out: Float32Array = new Float32Array(3 * TONES_BANDS),
): Float32Array {
  for (let band = 0; band < TONES_BANDS; band++) {
    const now = dbToGain(TONES_EXAMPLE_NOW_DB[band])
    const then = dbToGain(TONES_EXAMPLE_THEN_DB[band])
    out[band] = now
    out[TONES_BANDS + band] = then
    out[2 * TONES_BANDS + band] = now * tonesGain(now, then, strict, changes, floorGain)
  }
  return out
}

const commonTones = plateDisplay<TonesState>({
  place: 'window',
  columns: 2,
  params: ['ago', 'keep', 'strict', 'floor', 'mix'],
  live: { meters: true },
  info: 'Third octaves from 62 Hz to 16 kHz. Each pale column is the sound now, the mark across it is the sound Ago before, and the filling is what is let through. Drag the point along the top to set Ago, and the point at the right to set how far a band may rise over its past and still count.',
  init: () => ({
    levels: new Float32Array(3 * TONES_BANDS),
    soundAt: null,
    example: new Float32Array(3 * TONES_BANDS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { ruler, box, gaugeX } = tonesLayout(frame)
    const foot = box.y + box.h
    const strict = clamp(frame.value('strict'), 0, 1)
    const changes = frame.value('keep') >= 0.5
    const floorGain = tonesFloorGain(frame.value('floor'), frame.spec('floor')?.min ?? -36)
    // Mix is a straight cross-fade: the wet sound is heard at Mix times its level.
    const wet = frame.spec('mix') ? clamp(frame.value('mix'), 0, 1) : 1
    const heard = wet > QUIET
    const leewayDb = tonesLeewayDb(strict)

    // The device is followed whatever Mix is, so nothing is missed while it is unheard.
    const running = frame.powered && frame.dt > 0 && frame.hasMeter(TONES_NOW[0])
    if (running) {
      const least = dbToGain(TONES_FOOT_DB)
      for (let row = 0; row < 3; row++) {
        for (let band = 0; band < TONES_BANDS; band++) {
          const at = row * TONES_BANDS + band
          const reading = frame.meter(TONES_METERS[row][band])
          const level = Number.isFinite(reading) ? clamp(reading, 0, 4) : 0
          state.levels[at] = follow(state.levels[at], level, frame.dt, 0.02, 0.12)
          if (state.levels[at] > least) state.soundAt = frame.now
        }
      }
    } else if (!frame.powered) {
      state.levels.fill(0)
      state.soundAt = null
    }
    const live =
      frame.powered && state.soundAt !== null && frame.now - state.soundAt < TONES_REST_SEC
    // At rest, a worked example of what the settings do; with none of it in the mix they do nothing.
    const levels = live ? state.levels : tonesExample(strict, changes, floorGain, state.example)
    const shown = live || heard

    freqGrid(frame, box, TONES_LOW_HZ, TONES_HIGH_HZ)
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
    if (shown) {
      for (let band = 0; band < TONES_BANDS; band++) {
        const [left, right] = tonesBandX(band, box)
        const wide = right - left
        const now = tonesY(gainToDb(levels[band]), box)
        const thenDb = gainToDb(levels[TONES_BANDS + band])
        const then = tonesY(thenDb, box)
        // The sound now: a pale column.
        if (foot - now > 0.25)
          fillRect(ctx, { x: left, y: now, w: wide, h: foot - now }, colours.ink, INK.fill * 1.5)
        if (!heard) continue
        // What is let through, as loud as Mix leaves it: in the second colour
        // while it is the device's own reading, in the ink while it is the example.
        const through = tonesY(gainToDb(levels[2 * TONES_BANDS + band] * wet), box)
        if (foot - through > 0.25)
          fillRect(
            ctx,
            { x: left, y: through, w: wide, h: foot - through },
            live ? colours.accent : colours.ink,
            live ? 0.9 : 0.55,
          )
        // The sound then: a mark, and over it the leeway a band may rise by and still count whole.
        if (thenDb > TONES_FOOT_DB) {
          const limit = tonesY(thenDb + leewayDb, box)
          if (then - limit > 0.25)
            fillRect(ctx, { x: left, y: limit, w: wide, h: then - limit }, colours.ink, INK.fill)
          fillRect(ctx, { x: left, y: Math.round(then) - 1, w: wide, h: 1 }, colours.ink, 1)
        }
      }
    }

    // Ago: a ruler of time back from now, and a bar as long as Ago.
    const agoSpec = frame.spec('ago')
    const minMs = agoSpec?.min ?? 50
    const maxMs = agoSpec?.max ?? 8000
    const base = ruler.y + ruler.h
    rule(ctx, ruler.x, base, ruler.x + ruler.w, base, { colour: colours.ink, alpha: INK.rule })
    for (const ms of [minMs, ...TONES_RULER_MS, maxMs]) {
      const x = ruler.x + tonesAgoAt(ms, minMs, maxMs) * ruler.w
      rule(ctx, x, base - 2, x, base + 2, { colour: colours.ink, alpha: INK.rule })
    }
    const handles = tonesHandles(frame)
    const [agoPoint, strictPoint] = handles
    if (agoPoint.x > ruler.x + 0.5)
      fillRect(ctx, { x: ruler.x, y: base - 3, w: agoPoint.x - ruler.x, h: 3 }, colours.ink, 0.85)
    // Right of the point while there is room; else left of it.
    const words = tonesAgoText(frame.value('ago'))
    ctx.font = `8px ${frame.fontFamily}`
    const right = agoPoint.x + 7 + ctx.measureText(words).width <= ruler.x + ruler.w
    text(frame, words, right ? agoPoint.x + 7 : agoPoint.x - 7, ruler.y + 6, {
      align: right ? 'left' : 'right',
    })

    // The leeway's own mark: a band's mark and shade, with the point that sets Strict on top.
    const gaugeFoot = yOfDb(TONES_GAUGE_DB, box, TONES_TOP_DB, TONES_FOOT_DB)
    const gaugeTop = yOfDb(TONES_GAUGE_DB + TONES_MAX_LEEWAY_DB, box, TONES_TOP_DB, TONES_FOOT_DB)
    rule(ctx, gaugeX, gaugeFoot, gaugeX, gaugeTop, { colour: colours.ink, alpha: INK.rule })
    if (gaugeFoot - strictPoint.y > 0.25)
      fillRect(
        ctx,
        { x: gaugeX - 3, y: strictPoint.y, w: 6, h: gaugeFoot - strictPoint.y },
        colours.ink,
        INK.fill * 1.5,
      )
    fillRect(ctx, { x: gaugeX - 4, y: Math.round(gaugeFoot) - 1, w: 8, h: 1 }, colours.ink, 1)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // Which side is let through; or, with the leeway in hand, how much it is. Over the
    // highest bands, which seldom reach the top.
    label(
      frame,
      frame.hot === 'strict'
        ? `${strictPoint.name}  ${leewayDb.toFixed(1)} dB`
        : changes
          ? 'CHANGES'
          : 'COMMON',
      box.x + box.w - 3,
      box.y + 8,
      'right',
    )
  },
  handles: tonesHandles,
})

export const COMMON_TONES_FACES: Readonly<Record<string, PlateFace>> = {
  'common-tones': {
    display: commonTones,
    face: ['ago', 'keep', 'ring', 'mix'],
  },
}
