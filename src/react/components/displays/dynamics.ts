// Displays of the devices that turn the level down: what a compressor or a
// limiter is set to do, and what it is doing to the sound right now.

import {
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dot,
  fillBetween,
  fillTo,
  gainToDb,
  ground,
  handle,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
} from '../display-kit'
import { plateDisplay, type DisplayView, type PlateFace } from '../plate-display'

/** The levels a dynamics display spans, top to foot. */
const TOP_DB = 0
const FOOT_DB = -60
/** How much of the past a dynamics display keeps, in seconds. */
const PAST_SEC = 6

/**
 * The Ambient Compressor's curve, as `ambient_comp.h` has it: the reduction in
 * dB (0 or below) the device moves towards at a detector level. `over` is the
 * level above the threshold, `slope` is 1 / ratio − 1, `knee` its width in dB.
 */
function softKnee(levelDb: number, thresholdDb: number, ratio: number, kneeDb: number): number {
  const over = levelDb - thresholdDb
  const slope = 1 / ratio - 1
  if (2 * over >= kneeDb) return slope * over
  if (2 * over > -kneeDb) {
    const into = over + 0.5 * kneeDb
    return (slope * into * into) / (2 * kneeDb)
  }
  return 0
}

/** What comes out for what goes in, in dB: the reduction, the make-up and the dry part of Mix. */
function compressed(inDb: number, reductionDb: number, makeupDb: number, mix: number): number {
  const applied = 1 - mix + mix * Math.pow(10, (reductionDb + makeupDb) / 20)
  return inDb + gainToDb(applied)
}

interface CompState {
  /** The level going in, dB. */
  input: History
  /** The gain taken off, dB (0 or below). */
  reduction: History
  /** The latest level going in, for the mark on the curve. */
  level: number
}

interface CompBoxes {
  curve: Box
  past: Box
}

/** The curve at the left, the last seconds at the right, on one scale of levels. */
function compBoxes(view: Pick<DisplayView, 'width' | 'height'>): CompBoxes {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const curve = { ...all, w: Math.round(all.w * 0.4) }
  return { curve, past: { ...all, x: curve.x + curve.w + 4, w: all.w - curve.w - 4 } }
}

const xOfDb = (db: number, box: Box): number =>
  box.x + ((clamp(db, FOOT_DB, TOP_DB) - FOOT_DB) / (TOP_DB - FOOT_DB)) * box.w
const yOf = (db: number, box: Box): number =>
  yOfDb(clamp(db, FOOT_DB, TOP_DB + 6), box, TOP_DB, FOOT_DB)
/** Where a handle stands at that level: on the curve, and never off the display. */
const handleY = (db: number, box: Box): number => clamp(yOf(db, box), box.y, box.y + box.h)
const dbOfX = (x: number, box: Box): number =>
  FOOT_DB + clamp((x - box.x) / box.w, 0, 1) * (TOP_DB - FOOT_DB)

const ambientComp = plateDisplay<CompState>({
  place: 'window',
  columns: 2,
  params: ['threshold', 'ratio', 'knee', 'makeup', 'mix'],
  live: { meters: true, signal: true },
  info: 'Left, the curve: the level going in runs across, the level coming out runs up, and the mark is the sound now. Right, the last six seconds: the level going in, and in the second colour what the compressor took off it.',
  init: () => ({
    input: new History(PAST_SEC, 70, FOOT_DB, 'max'),
    reduction: new History(PAST_SEC, 70, 0, 'min'),
    level: FOOT_DB,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { curve, past } = compBoxes(frame)
    const threshold = frame.value('threshold')
    const ratio = frame.value('ratio')
    const knee = frame.value('knee')
    const makeup = frame.value('makeup')
    const mix = frame.value('mix')
    const out = (inDb: number, reduction = softKnee(inDb, threshold, ratio, knee)): number =>
      compressed(inDb, reduction, makeup, mix)

    // What is happening: the level going in and the gain coming off, into the past.
    const reduction = frame.signal ? Math.min(0, frame.meter('reduction')) : 0
    if (frame.signal) {
      const input = frame.signal.input
        ? gainToDb(frame.signal.input.rms)
        : // Without the level going in, work back from what comes out.
          gainToDb(frame.signal.output.rms) -
          gainToDb(1 - mix + mix * Math.pow(10, (reduction + makeup) / 20))
      state.level = input
      state.input.push(frame.now, input)
      state.reduction.push(frame.now, reduction)
    }

    // Left: the curve.
    dbGrid(frame, curve, TOP_DB, FOOT_DB, 20)
    clipped(ctx, curve, () => {
      rule(ctx, curve.x, curve.y + curve.h, curve.x + curve.w, curve.y, {
        colour: colours.ink,
        alpha: INK.grid,
        dash: [2, 2],
      })
      const points: [number, number][] = []
      for (let x = 0; x <= curve.w; x += 1) {
        const inDb = FOOT_DB + (x / curve.w) * (TOP_DB - FOOT_DB)
        points.push([curve.x + x, yOf(out(inDb), curve)])
      }
      fillTo(ctx, points, curve.y + curve.h, colours.ink, INK.fill)
      trace(ctx, points, { colour: colours.ink })
    })

    // Right: the last seconds, on the same scale of levels.
    dbGrid(frame, past, TOP_DB, FOOT_DB, 20)
    clipped(ctx, past, () => {
      const going = state.input.points(past, (db) => yOf(db, past))
      const held: [number, number][] = going.map(([x], i) => [
        x,
        yOf(state.input.at(going.length - 1 - i) + state.reduction.at(going.length - 1 - i), past),
      ])
      fillTo(ctx, going, past.y + past.h, colours.ink, INK.fill)
      fillBetween(ctx, going, held, colours.accent, 0.9)
      trace(ctx, held, { colour: colours.ink, width: 1.25 })
    })

    // The threshold, across both: the curve bends at it and the level crosses it.
    const thresholdY = yOf(threshold, past)
    rule(ctx, curve.x, thresholdY, past.x + past.w, thresholdY, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [3, 2],
    })

    // The sound now, on the curve: where it goes in, and where the gain has it come out.
    if (frame.signal && state.level > FOOT_DB) {
      dot(
        ctx,
        xOfDb(state.level, curve),
        yOf(out(state.level, reduction), curve),
        2.5,
        colours.accent,
        {
          ring: colours.ink,
        },
      )
    }
    for (const point of compHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
    // How much is off now, as a number: the one figure a compressor is watched by.
    text(
      frame,
      reduction < -0.05 ? `−${(-reduction).toFixed(1)}` : '0.0',
      past.x + past.w - 1,
      past.y + 8,
      {
        align: 'right',
        size: 9,
      },
    )
  },
  handles: compHandles,
})

function compHandles(view: DisplayView) {
  const { curve } = compBoxes(view)
  const threshold = view.value('threshold')
  const ratio = view.value('ratio')
  const knee = view.value('knee')
  const makeup = view.value('makeup')
  const mix = view.value('mix')
  const out = (inDb: number): number =>
    compressed(inDb, softKnee(inDb, threshold, ratio, knee), makeup, mix)
  return [
    {
      key: 'threshold',
      name: 'Threshold',
      x: xOfDb(threshold, curve),
      y: handleY(out(threshold), curve),
      // The threshold lies on the diagonal, so it is taken along it: across
      // and up each say a threshold, and the drag sets the one between them.
      drag: (x: number, y: number) => ({
        threshold: clamp(
          (dbOfX(x, curve) + dbOfY(y, curve, TOP_DB, FOOT_DB) - (out(threshold) - threshold)) / 2,
          -60,
          0,
        ),
      }),
      reset: () => ({ threshold: view.spec('threshold')?.default ?? -24 }),
    },
    {
      key: 'ratio',
      name: 'Ratio',
      x: curve.x + curve.w,
      y: handleY(out(TOP_DB), curve),
      // The end of the curve: pulled down it is a firmer hand, pulled up to the diagonal it is none.
      // The point stands on the mixed curve, so the make-up and the dry part of
      // Mix come off together: what they add where it stands now.
      drag: (_x: number, y: number) => {
        const wet = TOP_DB + softKnee(TOP_DB, threshold, ratio, knee)
        const top = dbOfY(y, curve, TOP_DB, FOOT_DB) - (out(TOP_DB) - wet)
        const span = TOP_DB - threshold
        const kept = clamp(top - threshold, span / 10, span)
        return { ratio: span > 0.5 ? clamp(span / kept, 1, 10) : ratio }
      },
      reset: () => ({ ratio: view.spec('ratio')?.default ?? 2 }),
    },
  ]
}

export const DYNAMICS_FACES: Readonly<Record<string, PlateFace>> = {
  'ambient-comp': {
    display: ambientComp,
    face: ['threshold', 'ratio', 'attack', 'release'],
  },
}
