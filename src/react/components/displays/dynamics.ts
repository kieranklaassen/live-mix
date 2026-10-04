// Displays of the devices that turn the level down: what a compressor or a
// limiter is set to do, and what it is doing to the sound right now.

import {
  FLOOR_DB,
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dbText,
  dbToGain,
  dot,
  fillBetween,
  fillRect,
  fillTo,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayLevel,
  type DisplaySignal,
  type DisplayView,
  type PlateDisplay,
  type PlateFace,
} from '../plate-display'

/** The levels a dynamics display spans, top to foot. */
const TOP_DB = 0
const FOOT_DB = -60
/** How much of the past a dynamics display keeps, in seconds. */
const PAST_SEC = 6

/**
 * A compressor as its display needs it: the reduction it settles at for a
 * level going in, and what a reduction does to the level with all that comes
 * after it (the make-up, the dry part of a mix), both in dB.
 */
interface CompModel {
  reduction(inDb: number): number
  gain(reductionDb: number): number
}

interface CompState {
  /** The level going in, dB. */
  input: History
  /**
   * What the reduction took off what comes out, dB (0 or below): the reduction
   * itself, less whatever of it the dry part of a mix lets back in.
   */
  reduction: History
  /** The level coming out, dB: with the make-up and the dry part of a mix. */
  output: History
  /** The latest level going in, for the mark on the curve. */
  level: number
  /** The reduction on the frame before. */
  last: number
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

/** Under this a sound is too quiet to tell what was done to it. */
const QUIET = 1e-4

/** A reduction as the one figure a compressor is watched by: "−3.2", and "0.0" when nothing is off. */
const reductionText = (db: number): string => (db < -0.05 ? `−${(-db).toFixed(1)}` : '0.0')

/**
 * A device that is switched off does nothing to the sound, and the seconds
 * before it was switched off are not what it is doing: its past is let go.
 */
function forget(...past: readonly History[]): void {
  for (const history of past) history.clear()
}

/**
 * The display of a compressor: its curve with the sound riding it, and the
 * last seconds with the gain it took off. What differs from one compressor
 * to the next is its model, the level its detector reads and its handles.
 */
function compDisplay(options: {
  /** How many columns of knobs stand beside it (default 2). */
  columns?: 1 | 2
  params: readonly string[]
  info: string
  /** The level the line across both halves stands at: where the curve bends. */
  threshold: (view: DisplayView) => number
  /** What the detector reads: the device's own kind of level. */
  level: 'rms' | 'peak'
  model: (view: DisplayView) => CompModel
  /** False for a device that reports no `reduction` reading: it is not asked for one. */
  metered?: boolean
  /**
   * Where the figure stands. A detector that reads peaks has its levels up at
   * the top of the past, so its figure stands at the foot, on a patch; one
   * that reads RMS seldom gets that high and keeps the figure at the top.
   */
  figure?: 'top' | 'foot'
  /**
   * The reduction now, where the device's own `reduction` reading is not the
   * whole answer or there is none: worked out from the frame and the sound.
   * `last` is the reduction on the frame before. Left out, the reading is used.
   */
  reduction?: (frame: DisplayFrame, signal: DisplaySignal, model: CompModel, last: number) => number
  handles: (view: DisplayView) => DisplayHandle[]
}): PlateDisplay {
  const levelOf = (level: DisplayLevel): number => gainToDb(level[options.level])
  // About a slot a pixel across the half that shows the past.
  const slots = options.columns === 1 ? 100 : 70
  return plateDisplay<CompState>({
    place: 'window',
    columns: options.columns ?? 2,
    params: options.params,
    live: options.metered === false ? { signal: true } : { meters: true, signal: true },
    info: options.info,
    init: () => ({
      input: new History(PAST_SEC, slots, FOOT_DB, 'max'),
      reduction: new History(PAST_SEC, slots, 0, 'min'),
      output: new History(PAST_SEC, slots, FOOT_DB, 'max'),
      level: FOOT_DB,
      last: 0,
    }),
    draw(frame) {
      const { ctx, colours, state } = frame
      ground(frame)
      const { curve, past } = compBoxes(frame)
      const threshold = options.threshold(frame)
      const model = options.model(frame)
      const out = (inDb: number, reduction = model.reduction(inDb)): number =>
        inDb + model.gain(reduction)

      // What is happening: the level going in and the gain coming off, into the past.
      const reduction = !frame.signal
        ? 0
        : options.reduction
          ? Math.min(0, options.reduction(frame, frame.signal, model, state.last))
          : Math.min(0, frame.meter('reduction'))
      state.last = reduction
      // What that reduction comes to in what is heard: behind a mix that lets
      // the dry sound through it is less, and with Mix at nothing it is none.
      const taken = Math.min(0, model.gain(reduction) - model.gain(0))
      if (frame.signal) {
        const input = frame.signal.input
          ? levelOf(frame.signal.input)
          : // Without the level going in, work back from what comes out.
            levelOf(frame.signal.output) - model.gain(reduction)
        state.level = input
        state.input.push(frame.now, input)
        state.reduction.push(frame.now, taken)
        state.output.push(frame.now, input + model.gain(reduction))
      } else if (!frame.powered) {
        forget(state.input, state.reduction, state.output)
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
          yOf(
            state.input.at(going.length - 1 - i) + state.reduction.at(going.length - 1 - i),
            past,
          ),
        ])
        fillTo(ctx, going, past.y + past.h, colours.ink, INK.fill)
        fillBetween(ctx, going, held, colours.accent, 0.9)
        // The level coming out: under the level going in by what was taken
        // off, and over it again by the make-up.
        trace(
          ctx,
          state.output.points(past, (db) => yOf(db, past)),
          { colour: colours.ink, width: 1.25 },
        )
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
      for (const point of options.handles(frame)) {
        handle(frame, point.x, point.y, { hot: frame.hot === point.key })
      }
      // How much is off now, as a number: the one figure a compressor is watched by.
      if (options.figure === 'top') {
        text(frame, reductionText(taken), past.x + past.w - 1, past.y + 8, {
          align: 'right',
          size: 9,
        })
      } else {
        reductionFigure(frame, past, taken)
      }
    },
    handles: options.handles,
  })
}

// --- Ambient Compressor -----------------------------------------------------

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

/** The Ambient Compressor: the soft knee, then the make-up and the dry part of Mix. */
function ambientCompModel(view: DisplayView): CompModel {
  const threshold = view.value('threshold')
  const ratio = view.value('ratio')
  const knee = view.value('knee')
  const makeup = view.value('makeup')
  const mix = view.value('mix')
  return {
    reduction: (inDb) => softKnee(inDb, threshold, ratio, knee),
    gain: (reduction) => gainToDb(1 - mix + mix * Math.pow(10, (reduction + makeup) / 20)),
  }
}

function ambientCompHandles(view: DisplayView): DisplayHandle[] {
  const { curve } = compBoxes(view)
  const threshold = view.value('threshold')
  const ratio = view.value('ratio')
  const model = ambientCompModel(view)
  const out = (inDb: number): number => inDb + model.gain(model.reduction(inDb))
  /** The level a point stands at: with Make-up the curve can leave the top, and its points wait at the edge. */
  const shown = (level: number): number => clamp(level, FOOT_DB, TOP_DB)
  return [
    {
      key: 'threshold',
      name: 'Threshold',
      x: xOfDb(threshold, curve),
      y: handleY(out(threshold), curve),
      // The threshold lies on the diagonal, so it is taken along it: across
      // and up each say a threshold, and the drag sets the one between them.
      // Measured from where the point stands, so that taking it moves nothing.
      drag: (x: number, y: number) => ({
        threshold: clamp(
          (dbOfX(x, curve) +
            dbOfY(y, curve, TOP_DB, FOOT_DB) -
            (shown(out(threshold)) - threshold)) /
            2,
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
        const wet = TOP_DB + model.reduction(TOP_DB)
        const top = dbOfY(y, curve, TOP_DB, FOOT_DB) - (shown(out(TOP_DB)) - wet)
        const span = TOP_DB - threshold
        const kept = clamp(top - threshold, span / 10, span)
        return { ratio: span > 0.5 ? clamp(span / kept, 1, 10) : ratio }
      },
      reset: () => ({ ratio: view.spec('ratio')?.default ?? 2 }),
    },
  ]
}

const ambientComp = compDisplay({
  params: ['threshold', 'ratio', 'knee', 'makeup', 'mix'],
  info: 'Left, the curve: the level going in runs across, the level coming out runs up, and the mark is the sound now. Right, the last six seconds: the level going in, in the second colour what the compressor took off it, and the line is the level coming out.',
  threshold: (view) => view.value('threshold'),
  level: 'rms',
  model: ambientCompModel,
  figure: 'top',
  handles: ambientCompHandles,
})

// --- Compressor -------------------------------------------------------------

/**
 * The compressor node's static curve, as the Web Audio specification defines
 * it for `DynamicsCompressorNode`: a level under the threshold passes as it
 * is, one over `threshold + knee` rises by 1 / ratio dB a dB, and between the
 * two lies a smooth knee. The specification leaves the knee's shape to the
 * browser; this is the one the browsers share, an exponential approach whose
 * steepness `k` is searched for so the knee ends at the slope of the ratio
 * (the same fifteen steps between 0.1 and 10 000). Linear in, linear out.
 */
export function nodeCurve(
  thresholdDb: number,
  kneeDb: number,
  ratio: number,
): (level: number) => number {
  const threshold = dbToGain(thresholdDb)
  const kneeEndDb = thresholdDb + kneeDb
  const kneeEnd = dbToGain(kneeEndDb)
  const slope = 1 / ratio
  const knee = (x: number, k: number): number =>
    x < threshold ? x : threshold + (1 - Math.exp(-k * (x - threshold))) / k
  const slopeAt = (x: number, k: number): number => {
    if (x < threshold) return 1
    const next = x * 1.001
    return (gainToDb(knee(next, k)) - gainToDb(knee(x, k))) / (gainToDb(next) - gainToDb(x))
  }
  let low = 0.1
  let high = 10000
  let k = 5
  for (let i = 0; i < 15; i++) {
    // A steeper knee flattens sooner: too flat at its end means k is too high.
    if (slopeAt(kneeEnd, k) < slope) high = k
    else low = k
    k = Math.sqrt(low * high)
  }
  const kneeEndOutDb = gainToDb(knee(kneeEnd, k))
  return (level) =>
    level < kneeEnd
      ? knee(level, k)
      : dbToGain(kneeEndOutDb + slope * (gainToDb(level) - kneeEndDb))
}

/**
 * The gain the node adds behind its curve, in dB, as the specification has it:
 * what the curve takes off a full-scale level, turned round and raised to 0.6.
 */
export function nodeMakeupDb(curve: (level: number) => number): number {
  return -0.6 * gainToDb(curve(1))
}

/**
 * The Compressor: the node's curve, its own make-up and the device's Make-up
 * behind it. The node's `reduction` reading is the curve's part alone.
 */
function nodeCompModel(view: DisplayView): CompModel {
  const curve = nodeCurve(view.value('threshold'), view.value('knee'), view.value('ratio'))
  const makeup = nodeMakeupDb(curve) + view.value('makeupDb')
  return {
    reduction: (inDb) => gainToDb(curve(dbToGain(inDb))) - inDb,
    gain: (reduction) => reduction + makeup,
  }
}

function nodeCompHandles(view: DisplayView): DisplayHandle[] {
  const { curve } = compBoxes(view)
  const threshold = view.value('threshold')
  const knee = view.value('knee')
  const ratio = view.value('ratio')
  const model = nodeCompModel(view)
  const out = (inDb: number): number => inDb + model.gain(model.reduction(inDb))
  const kneeSpec = view.spec('knee')
  // The display ends at −60 dB and the knob goes on below that: the point of
  // a threshold down there waits where the curve comes on to the display.
  const bend = Math.max(threshold, FOOT_DB)
  /** The level a point stands at, which is on the display also when the curve is over its top. */
  const shown = (level: number): number => clamp(level, FOOT_DB, TOP_DB)
  /** Where the bend of the curve would stand at another threshold: the node's make-up moves with it. */
  const bendAt = (candidate: number): number =>
    shown(candidate + nodeMakeupDb(nodeCurve(candidate, knee, ratio)) + view.value('makeupDb'))
  // No point for Ratio: the node makes up for most of what a ratio takes off,
  // so the whole of the knob moves the end of the curve by a few pixels (four
  // at the defaults), which is no travel for a hand. Ratio is a knob on the face.
  return [
    {
      key: 'threshold',
      name: 'Threshold',
      x: xOfDb(bend, curve),
      y: handleY(out(bend), curve),
      // Taken along the diagonal, as the Ambient Compressor's is: across and
      // up each say a threshold, and the drag sets the one between them. A
      // threshold under the display stays where it is until its point is
      // pulled in.
      drag: (x, y) => {
        const across = dbOfX(x, curve)
        const up = dbOfY(y, curve, TOP_DB, FOOT_DB)
        let along = (across + up - shown(out(bend)) + bend) / 2
        if (along <= FOOT_DB + 1e-6) return { threshold: Math.min(threshold, FOOT_DB) }
        // The make-up changes with the threshold, and with it how high the
        // bend stands: a few rounds settle on the threshold whose point is
        // where the hand is.
        for (let round = 0; round < 8; round++) {
          const at = clamp(along, FOOT_DB, TOP_DB)
          along = (across + up - bendAt(at) + at) / 2
        }
        return { threshold: clamp(along, FOOT_DB, TOP_DB) }
      },
      // The wheel widens and narrows the knee above the threshold.
      wheel: (steps) => ({
        knee: clamp(knee + 2 * steps, kneeSpec?.min ?? 0, kneeSpec?.max ?? 40),
      }),
      reset: () => ({
        threshold: view.spec('threshold')?.default ?? -24,
        knee: kneeSpec?.default ?? 30,
      }),
    },
  ]
}

/**
 * The node's own reading. A node that is fed silence stops running, and its
 * reading stays where it stopped, a little under zero; nothing is taken off
 * silence, so in silence the figure is zero.
 */
function nodeReduction(frame: DisplayFrame, signal: DisplaySignal): number {
  const heard = signal.input ?? signal.output
  return heard.peak < QUIET ? 0 : frame.meter('reduction')
}

const nodeComp = compDisplay({
  params: ['threshold', 'knee', 'ratio', 'makeupDb'],
  info: 'Left, the curve: level in runs across, level out runs up, and the mark is the sound now. Right, the last six seconds: the level going in, in the second colour what the compressor took off, and the line is the level coming out with its make-up. The wheel over the threshold point sets the knee.',
  threshold: (view) => view.value('threshold'),
  level: 'peak',
  model: nodeCompModel,
  reduction: nodeReduction,
  handles: nodeCompHandles,
})

// --- FET Limiter ------------------------------------------------------------

/**
 * Where the FET Limiter's compressor starts, for a sound that is the same on
 * both sides: `fet-limiter.dsp` reads the level as |left| + |right| and bends
 * at −6 dB of that, which is 12 dB under full scale on each side.
 */
const FET_THRESHOLD_DB = -6 - gainToDb(2)
const FET_RATIO = 4
/**
 * How fast the compressor's gain comes back, in dB a second. Its follower
 * lets the level fall with a time constant of 0.5 s, which is 20 / (0.5 ln 10)
 * dB a second, and the 4:1 curve gives back three quarters of that.
 */
const FET_RELEASE_DB_PER_SEC = ((1 - 1 / FET_RATIO) * 20) / (0.5 * Math.LN10)
/** The ceiling behind the compressor, as `fet-limiter.dsp` has it: straight to half scale, then a tanh knee that never passes full scale. */
function fetCeiling(level: number): number {
  return level > 0.5 ? 0.5 + 0.5 * Math.tanh((level - 0.5) / 0.5) : level
}

/**
 * The FET Limiter: Input gain drives the sound into a fixed 4:1 curve, the
 * ceiling rounds off what is still over half scale, and Output gain follows.
 * Its reduction is what the two stages take off the driven sound together.
 */
function fetModel(view: DisplayView): CompModel {
  const drive = view.value('inputGain')
  const trim = view.value('outputGain')
  return {
    reduction: (inDb) => {
      const driven = inDb + drive
      const held = driven - (1 - 1 / FET_RATIO) * Math.max(0, driven - FET_THRESHOLD_DB)
      return gainToDb(fetCeiling(dbToGain(held))) - driven
    },
    gain: (reduction) => reduction + drive + trim,
  }
}

/**
 * The device reports no reduction, so it is read off the sound: what comes
 * out against what goes in, less the two gains. In silence there is nothing
 * to read and the figure goes home as the compressor's gain does, at a steady
 * rate in dB. Without the level going in, it is the curve's reduction at the
 * level that would come out as loud as this.
 */
function fetReduction(
  frame: DisplayFrame,
  signal: DisplaySignal,
  model: CompModel,
  last: number,
): number {
  if (!signal.input) {
    const wanted = gainToDb(signal.output.peak)
    let low = FLOOR_DB
    let high = 40
    for (let i = 0; i < 20; i++) {
      const middle = (low + high) / 2
      if (middle + model.gain(model.reduction(middle)) < wanted) low = middle
      else high = middle
    }
    return model.reduction((low + high) / 2)
  }
  if (signal.input.rms < QUIET) return Math.min(0, last + FET_RELEASE_DB_PER_SEC * frame.dt)
  return gainToDb(signal.output.rms) - gainToDb(signal.input.rms) - model.gain(0)
}

function fetHandles(view: DisplayView): DisplayHandle[] {
  const { curve } = compBoxes(view)
  const spec = view.spec('inputGain')
  const model = fetModel(view)
  const bend = FET_THRESHOLD_DB - view.value('inputGain')
  return [
    {
      key: 'drive',
      name: 'Input gain',
      x: xOfDb(bend, curve),
      y: handleY(bend + model.gain(model.reduction(bend)), curve),
      // The bend of the curve: more gain going in brings it to quieter sound, so it is pulled left.
      drag: (x) => ({
        inputGain: clamp(FET_THRESHOLD_DB - dbOfX(x, curve), spec?.min ?? 0, spec?.max ?? 40),
      }),
      reset: () => ({ inputGain: spec?.default ?? 0 }),
    },
  ]
}

const fetLimiter = compDisplay({
  columns: 1,
  params: ['inputGain', 'outputGain'],
  info: 'Left, the curve: level in runs across, level out runs up, and the mark is the sound now. Pull the point left to drive the sound harder into the limiter. Right, the last six seconds: the level going in, in the second colour what the limiter took off, and the line is the level coming out.',
  threshold: (view) => FET_THRESHOLD_DB - view.value('inputGain'),
  level: 'peak',
  model: fetModel,
  metered: false,
  reduction: fetReduction,
  handles: fetHandles,
})

// --- What the gain riders share ---------------------------------------------

/**
 * A gain in dB (0 or below) as a depth under the top of a box that spans
 * `spanDb` of level: a dB of gain taken off hangs as far down as a dB of
 * level stands up, so what hangs and what is left never meet.
 */
const hangY = (db: number, box: Box, spanDb: number): number =>
  box.y + clamp(-db / spanDb, 0, 1) * box.h

/** The gain taken off over the last seconds, hanging from the top of a box in the second colour. */
function curtain(
  frame: Pick<DisplayFrame, 'ctx' | 'colours'>,
  box: Box,
  gain: History,
  spanDb: number,
  alpha = 0.9,
): void {
  const edge = gain.points(box, (db) => hangY(db, box, spanDb))
  fillTo(frame.ctx, edge, box.y, frame.colours.accent, alpha)
}

/** How much is off now, as a number at the foot of the last seconds, where what hangs from the top does not reach. */
function reductionFigure(frame: DisplayFrame, box: Box, db: number): void {
  label(frame, reductionText(db), box.x + box.w - 2, box.y + box.h - 2, 'right', 9)
}

/** A level line that can be dragged up and down: dashed across its box, with its handle at the left end. */
function levelLine(frame: DisplayFrame, box: Box, y: number, key: string, words: string): void {
  rule(frame.ctx, box.x, y, box.x + box.w, y, {
    colour: frame.colours.ink,
    alpha: frame.hot === key ? INK.text : INK.back,
    dash: [3, 2],
  })
  handle(frame, box.x + LINE_HANDLE_IN, y, { hot: frame.hot === key })
  // In hand, the line says where it stands.
  if (frame.hot === key) {
    const under = y < box.y + 14
    label(frame, words, box.x + LINE_HANDLE_IN + 8, under ? y + 11 : y - 4)
  }
}
/** How far in from the left end of its line a line's handle stands. */
const LINE_HANDLE_IN = 6

// --- Ambient Limiter --------------------------------------------------------

/**
 * A limiter is watched in its last few dB, and Gain can bring the sound in
 * over full scale: its display spans 36 dB of level, from 6 dB over full scale.
 */
const LIMIT_TOP_DB = 6
const LIMIT_FOOT_DB = -30

interface LimiterState {
  /** The level arriving at the ceiling, after Gain, dB. */
  arriving: History
  /** The level that leaves, dB. */
  leaving: History
  /** The gain taken off, dB (0 or below): both stages, and the ride's share of it. */
  reduction: History
  ride: History
  /** The reduction now. */
  now: number
}

const limiterBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})
const limitY = (db: number, box: Box): number =>
  yOfDb(clamp(db, LIMIT_FOOT_DB, LIMIT_TOP_DB), box, LIMIT_TOP_DB, LIMIT_FOOT_DB)

function limiterHandles(view: DisplayView): DisplayHandle[] {
  const box = limiterBox(view)
  const spec = view.spec('ceiling')
  return [
    {
      key: 'ceiling',
      name: 'Ceiling',
      x: box.x + LINE_HANDLE_IN,
      y: limitY(view.value('ceiling'), box),
      drag: (_x, y) => ({
        ceiling: clamp(
          dbOfY(y, box, LIMIT_TOP_DB, LIMIT_FOOT_DB),
          spec?.min ?? -12,
          spec?.max ?? 0,
        ),
      }),
      reset: () => ({ ceiling: spec?.default ?? -1 }),
    },
  ]
}

const ambientLimiter = plateDisplay<LimiterState>({
  place: 'window',
  columns: 2,
  params: ['ceiling', 'gain'],
  live: { meters: true, signal: true },
  info: 'The last six seconds, around full scale: the sound arriving after Gain, and filled in what leaves under the ceiling, the line that can be dragged. From the top hangs the gain taken off, solid for the slow ride and lighter for the brickwall that catches the moments.',
  init: () => ({
    arriving: new History(PAST_SEC, 120, FLOOR_DB, 'max'),
    leaving: new History(PAST_SEC, 120, FLOOR_DB, 'max'),
    reduction: new History(PAST_SEC, 120, 0, 'min'),
    ride: new History(PAST_SEC, 120, 0, 'min'),
    now: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = limiterBox(frame)
    const ceiling = frame.value('ceiling')
    const span = LIMIT_TOP_DB - LIMIT_FOOT_DB

    state.now = frame.signal ? Math.min(0, frame.meter('reduction')) : 0
    if (frame.signal) {
      const leaving = gainToDb(frame.signal.output.peak)
      state.leaving.push(frame.now, leaving)
      // Without the level going in, what arrived is what left with the reduction put back.
      state.arriving.push(
        frame.now,
        frame.signal.input
          ? gainToDb(frame.signal.input.peak) + frame.value('gain')
          : leaving - state.now,
      )
      state.reduction.push(frame.now, state.now)
      // The ride is part of the whole; a device that does not report it apart is drawn as one.
      state.ride.push(
        frame.now,
        frame.hasMeter('ride') ? clamp(frame.meter('ride'), state.now, 0) : state.now,
      )
    } else if (!frame.powered) {
      forget(state.arriving, state.leaving, state.reduction, state.ride)
    }

    dbGrid(frame, box, LIMIT_TOP_DB, LIMIT_FOOT_DB, 12)
    clipped(ctx, box, () => {
      const leaving = state.leaving.points(box, (db) => limitY(db, box))
      const arriving = state.arriving.points(box, (db) => limitY(db, box))
      fillTo(ctx, leaving, box.y + box.h, colours.ink, INK.fill)
      // What arrived over what leaves: the part the limiter held back.
      const over = arriving.map(([x, y], i): Point => [x, Math.min(y, leaving[i][1])])
      fillBetween(ctx, over, leaving, colours.ink, INK.back)
      curtain(frame, box, state.reduction, span, 0.45)
      curtain(frame, box, state.ride, span)
      // Over what hangs: more than 6 dB off reaches down to the level that leaves.
      trace(ctx, leaving, { colour: colours.ink, width: 1.25 })
    })
    levelLine(frame, box, limitY(ceiling, box), 'ceiling', dbText(ceiling))
    reductionFigure(frame, box, state.now)
  },
  handles: limiterHandles,
})

// --- What a shape in time shares --------------------------------------------

/** The levels a gain rider's display spans: its gain hangs on the same scale. */
const SPAN_DB = TOP_DB - FOOT_DB

/** A gain over time as its display draws it at the left: the level it leaves of a full-scale sound, filled in from the foot. */
function gainShape(frame: DisplayFrame, box: Box, points: readonly Point[]): void {
  const { ctx, colours } = frame
  dbGrid(frame, box, TOP_DB, FOOT_DB, 20)
  clipped(ctx, box, () => {
    fillTo(ctx, points, box.y + box.h, colours.ink, INK.fill)
    trace(ctx, points, { colour: colours.ink })
  })
}

/**
 * The gain between what goes in and what comes out, in dB, read off the two
 * levels; null when the level going in is unknown or too quiet to tell.
 */
function gainBetween(signal: DisplaySignal): number | null {
  if (!signal.input || signal.input.rms < QUIET) return null
  return gainToDb(signal.output.rms) - gainToDb(signal.input.rms)
}

// --- Sidechain Ducker -------------------------------------------------------

/** The key the ducker's shape is drawn for: a voice at −12 dB RMS, which Key scale at its default takes to full depth. */
const DUCK_KEY = 0.25
/** Points along the shape, and steps of the device's own arithmetic between two of them. */
const DUCK_POINTS = 96
const DUCK_STEPS = 8

interface Duck {
  /** The gain in dB at each point along the span. */
  gains: Float32Array
  /** The span in seconds, and when in it the key starts and stops. */
  span: number
  from: number
  to: number
}

/**
 * How long the shape is and when its key sounds: a moment of rest first, the
 * key until the gain has arrived (three time constants of Attack and of the
 * gain's own smoothing, half a second at the least), then Hold, and Release
 * until the envelope is as good as gone.
 */
function duckSpan(view: DisplayView): Pick<Duck, 'span' | 'from' | 'to'> {
  const attack = view.value('attackMs') / 1000
  const hold = view.value('holdMs') / 1000
  const release = view.value('releaseMs') / 1000
  const smooth = view.value('timeConstant')
  const on = Math.max(0.5, 3 * (attack + smooth))
  const back =
    hold + release * (3 + Math.log(Math.max(1, DUCK_KEY * view.value('gainScale')))) + 3 * smooth
  const from = 0.1 * (on + back)
  return { span: from + on + back, from, to: from + on }
}

/**
 * One duck, as `DuckerKernel.renderGain` makes it: the key's level followed
 * with Attack while it rises, held for Hold after it falls and then let go
 * with Release; the gain aimed at `1 − min(envelope · scale, 1) · depth` and
 * smoothed with the gain time constant. The key sounds long enough for the
 * gain to arrive, and the span ends when it is back.
 */
export function duck(view: DisplayView, into: Float32Array): Duck {
  const depth = view.value('depth')
  const attack = view.value('attackMs') / 1000
  const hold = view.value('holdMs') / 1000
  const release = view.value('releaseMs') / 1000
  const scale = view.value('gainScale')
  const smooth = view.value('timeConstant')
  const { span, from, to } = duckSpan(view)
  const dt = span / (DUCK_POINTS * DUCK_STEPS)
  const attackCoef = 1 - Math.exp(-dt / attack)
  const releaseCoef = 1 - Math.exp(-dt / release)
  const gainCoef = 1 - Math.exp(-dt / smooth)
  let envelope = 0
  let holdLeft = 0
  let gain = 1
  for (let i = 0; i < DUCK_POINTS; i++) {
    into[i] = gainToDb(gain)
    for (let step = 0; step < DUCK_STEPS; step++) {
      const time = (i * DUCK_STEPS + step) * dt
      const key = time >= from && time < to ? DUCK_KEY : 0
      if (key > envelope) {
        envelope += (key - envelope) * attackCoef
        holdLeft = hold
      } else if (holdLeft > 0) {
        holdLeft -= dt
      } else {
        envelope += (key - envelope) * releaseCoef
      }
      gain += (1 - Math.min(envelope * scale, 1) * depth - gain) * gainCoef
    }
  }
  return { gains: into, span, from, to }
}

/** How far the key drives the duck, 0 to 1, as the device has it: the follower on the key times Key scale, and no further than all the way. */
const duckDrive = (envelope: number, scale: number): number => clamp(envelope * scale, 0, 1)

/** How thick the bar of the key is, in pixels, by how far it drives the duck: it stands in the margin over the display, which is 3 pixels. */
const keyBar = (drive: number): number => 3 * drive

interface DuckerState {
  /** The level going in and the level coming out, dB. */
  arriving: History
  leaving: History
  /** The gain the ducker has on the sound, dB (0 or below). */
  gain: History
  /** How far the key drives the duck, 0 to 1. */
  key: History
  /** When a key last sounded, on the frame's clock; null for never. */
  keyed: number | null
  /** No key has sounded for as long as the display looks back: it says so. */
  unkeyed: boolean
  now: number
  /** Whether the gain can be told at all: from a reading, or from the level going in. */
  known: boolean
  /** The shape at the left, and what it was made from. */
  shape: Float32Array
  made: string
  duck: Duck | null
}

/** The floor the gain is set to reach, in dB, and where its handle stands: at the foot it is silence. */
const duckFloorDb = (depth: number): number => gainToDb(1 - depth)

function duckerHandles(view: DisplayView): DisplayHandle[] {
  const { curve } = compBoxes(view)
  const foot = curve.y + curve.h
  const { span, to } = duckSpan(view)
  return [
    {
      key: 'depth',
      name: 'Depth',
      // Where the key stops: the duck is at its deepest there.
      x: curve.x + (to / span) * curve.w,
      y: hangY(duckFloorDb(view.value('depth')), curve, SPAN_DB),
      // The floor of the duck: lower is deeper, and at the foot of the display the sound is gone.
      drag: (_x, y) => ({
        depth:
          y >= foot - 0.5
            ? 1
            : clamp(1 - dbToGain(-(clamp(y, curve.y, foot) - curve.y) * (SPAN_DB / curve.h)), 0, 1),
      }),
      reset: () => ({ depth: view.spec('depth')?.default ?? 0.68 }),
    },
  ]
}

const DUCKER_PARAMS = [
  'depth',
  'attackMs',
  'holdMs',
  'releaseMs',
  'gainScale',
  'timeConstant',
] as const

const ducker = plateDisplay<DuckerState>({
  place: 'window',
  columns: 2,
  params: DUCKER_PARAMS,
  live: { meters: true, signal: true },
  info: 'Left, one duck as it is set: the gain while a key at −12 dB sounds for the length of the bar, then held and let back. The point on its floor is Depth. Right, the last six seconds: the bar along the top is the key, under it hangs the gain taken off, and below are the levels going in and coming out.',
  init: () => ({
    arriving: new History(PAST_SEC, 70, FLOOR_DB, 'max'),
    leaving: new History(PAST_SEC, 70, FLOOR_DB, 'max'),
    gain: new History(PAST_SEC, 70, 0, 'min'),
    key: new History(PAST_SEC, 70, 0, 'max'),
    keyed: null,
    unkeyed: false,
    now: 0,
    known: false,
    shape: new Float32Array(DUCK_POINTS),
    made: '',
    duck: null,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { curve, past } = compBoxes(frame)

    // The device's own readings, both linear: the gain it has on the sound and
    // its follower on the key. A ducker that reports neither is read off the sound.
    const metered = frame.hasMeter('gain')
    const keyed = frame.hasMeter('envelope')
    if (frame.signal) {
      // Without a reading, the gain between the two levels, which stays where
      // it was while the sound is too quiet to tell.
      const read = metered ? gainToDb(frame.meter('gain')) : gainBetween(frame.signal)
      state.known = metered || frame.signal.input !== null
      state.now = Math.min(0, read ?? state.now)
      const leaving = gainToDb(frame.signal.output.rms)
      state.leaving.push(frame.now, leaving)
      state.arriving.push(
        frame.now,
        frame.signal.input ? gainToDb(frame.signal.input.rms) : leaving - state.now,
      )
      state.gain.push(frame.now, state.now)
      if (keyed) {
        const drive = duckDrive(frame.meter('envelope'), frame.value('gainScale'))
        state.key.push(frame.now, drive)
        if (drive > 0) state.keyed = frame.now
        state.unkeyed = state.keyed === null || frame.now - state.keyed > PAST_SEC
      }
    } else {
      state.now = 0
      if (!frame.powered) forget(state.leaving, state.arriving, state.gain, state.key)
    }

    // Left: one duck as it is set.
    const made = DUCKER_PARAMS.map((name) => frame.value(name).toPrecision(5)).join(' ')
    if (made !== state.made || !state.duck) {
      state.duck = duck(frame, state.shape)
      state.made = made
    }
    const { gains, span, from, to } = state.duck
    const points: Point[] = []
    for (let i = 0; i < DUCK_POINTS; i++) {
      points.push([curve.x + (i / (DUCK_POINTS - 1)) * curve.w, hangY(gains[i], curve, SPAN_DB)])
    }
    gainShape(frame, curve, points)
    // While the key sounds: a bar over the top the gain hangs from, as thick
    // as that key drives the duck, and never too thin to show when it sounds.
    const bar = Math.max(1, keyBar(duckDrive(DUCK_KEY, frame.value('gainScale'))))
    fillRect(
      ctx,
      {
        x: curve.x + (from / span) * curve.w,
        y: curve.y - bar,
        w: ((to - from) / span) * curve.w,
        h: bar,
      },
      colours.ink,
      INK.text,
    )

    // Right: the last seconds.
    dbGrid(frame, past, TOP_DB, FOOT_DB, 20)
    clipped(ctx, past, () => {
      const leaving = state.leaving.points(past, (db) => yOf(db, past))
      fillTo(ctx, leaving, past.y + past.h, colours.ink, INK.fill)
      curtain(frame, past, state.gain, SPAN_DB)
      // Over what hangs: the level going in is not turned down, and can stand in it.
      trace(
        ctx,
        state.arriving.points(past, (db) => yOf(db, past)),
        {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
        },
      )
      trace(ctx, leaving, { colour: colours.ink, width: 1.25 })
    })
    // The key that does the ducking, where the device reports it: the same
    // bar as at the left, over the top the gain hangs from.
    if (keyed) {
      const bar = state.key.points(past, (drive) => past.y - keyBar(drive))
      fillTo(ctx, bar, past.y, colours.ink, INK.text)
      // A ducker nothing keys does nothing, whatever its shape says: where the
      // key's bar would run, the display says that there is none.
      if (state.unkeyed) label(frame, 'no key', past.x + 2, past.y + 9)
    }
    // The floor Depth sets, across both: the shape rests on it, and what hangs reaches it under a full key.
    const floorY = hangY(duckFloorDb(frame.value('depth')), curve, SPAN_DB)
    rule(ctx, curve.x, floorY, past.x + past.w, floorY, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [3, 2],
    })
    for (const point of duckerHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
    if (state.known || !frame.signal) reductionFigure(frame, past, state.now)
  },
  handles: duckerHandles,
})

// --- Swell ------------------------------------------------------------------

/** How steeply the Swell's exponential rise bends, as `swell.h` has it. */
const SWELL_STEEPNESS = 5
/** The ramp's states, as the device reports them. */
const SWELL_CLOSED = 0
const SWELL_RISING = 2
const SWELL_OPEN = 3
const SWELL_FALLING = 4
/** How much of the shape's width the open stretch between rise and fall takes. */
const SWELL_OPEN_PART = 0.14

/** The rise as a function of the ramp's position, `Swell::shape`: a line, an exponential, or between the two. */
export function swellShape(position: number, curve: number): number {
  if (position <= 0) return 0
  if (position >= 1) return 1
  const exponential = (Math.exp(SWELL_STEEPNESS * position) - 1) / (Math.exp(SWELL_STEEPNESS) - 1)
  return position + (exponential - position) * curve
}

/**
 * The gain on the sound at a ramp position, in dB: the floor Depth sets
 * (`(1 − depth)²`) up to unity along the shape, and the dry part of Mix beside it.
 */
function swellGainDb(view: DisplayView, position: number): number {
  const open = 1 - view.value('depth')
  const floor = open * open
  return swellAppliedDb(view, floor + (1 - floor) * swellShape(position, view.value('curve')))
}

/** What a gain on the swelled sound comes to once Mix has let the untouched sound in beside it. */
function swellAppliedDb(view: DisplayView, gain: number): number {
  const mix = view.value('mix')
  return gainToDb(1 - mix + mix * gain)
}

/**
 * Where the rise ends and the fall begins across the shape, as parts of its
 * width. Rise and fall share what the open stretch leaves by their lengths;
 * neither gets less than a twelfth of it, so a short one can still be seen.
 */
function swellParts(view: DisplayView): { riseEnd: number; fallStart: number } {
  const attack = view.value('attack')
  const release = view.value('release')
  const rise = clamp(attack / (attack + release), 1 / 12, 11 / 12) * (1 - SWELL_OPEN_PART)
  return { riseEnd: rise, fallStart: rise + SWELL_OPEN_PART }
}

interface SwellState {
  /** The level going in and the level coming out, dB. */
  arriving: History
  leaving: History
  /** The gain on the sound, dB (0 or below). */
  gain: History
  now: number
  /** The ramp's state and position on the frame before; −1 before the first reading. */
  stage: number
  position: number
}

function swellHandles(view: DisplayView): DisplayHandle[] {
  const { past } = compBoxes(view)
  const spec = view.spec('sensitivity')
  return [
    {
      key: 'sensitivity',
      name: 'Sensitivity',
      x: past.x + LINE_HANDLE_IN,
      y: handleY(view.value('sensitivity'), past),
      // The knob goes on under the display's −60 dB: a line down there waits at
      // the foot, and stays where it is until it is pulled back in.
      drag: (_x, y) => {
        const level = dbOfY(y, past, TOP_DB, FOOT_DB)
        const sensitivity = view.value('sensitivity')
        return {
          sensitivity: clamp(
            level <= FOOT_DB + 1e-6 ? Math.min(level, sensitivity) : level,
            spec?.min ?? -70,
            Math.min(spec?.max ?? -10, TOP_DB),
          ),
        }
      },
      reset: () => ({ sensitivity: spec?.default ?? -40 }),
    },
  ]
}

const swell = plateDisplay<SwellState>({
  place: 'window',
  columns: 2,
  params: ['attack', 'release', 'depth', 'curve', 'mix', 'sensitivity'],
  live: { meters: true, signal: true },
  info: 'Left, one swell as it is set: the gain rising from its floor over Attack and falling back over Release, with a mark where it is now. Right, the last six seconds: the notes arriving, what comes out, and from the top the gain not yet given back. The line is Sensitivity.',
  init: () => ({
    arriving: new History(PAST_SEC, 70, FLOOR_DB, 'max'),
    leaving: new History(PAST_SEC, 70, FLOOR_DB, 'max'),
    gain: new History(PAST_SEC, 70, 0, 'min'),
    now: 0,
    stage: -1,
    position: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { curve, past } = compBoxes(frame)
    const metered = frame.hasMeter('gain')

    const stage = metered ? Math.round(frame.meter('state')) : -1
    const position = metered ? clamp(frame.meter('position'), 0, 1) : 0
    if (frame.signal) {
      // The device's own gain; one that does not report it is read off the two
      // levels. Shut and waiting in silence it holds nothing back from anyone,
      // so nothing hangs until there is sound. Shut over a sound that stays
      // under Sensitivity it holds that sound at its floor, and that hangs.
      const waiting =
        stage === SWELL_CLOSED && (!frame.signal.input || frame.signal.input.peak < QUIET)
      const read = metered
        ? waiting
          ? 0
          : swellAppliedDb(frame, clamp(frame.meter('gain'), 0, 1))
        : (gainBetween(frame.signal) ?? 0)
      state.now = Math.min(0, read)
      state.arriving.push(
        frame.now,
        frame.signal.input ? gainToDb(frame.signal.input.peak) : FLOOR_DB,
      )
      state.leaving.push(frame.now, gainToDb(frame.signal.output.peak))
      // A rise that began since the frame before began at the floor
      // (`Swell::trigger` takes the gain there first), and the gain leaves it
      // faster than the readings come: so every note is seen to start there,
      // not only the ones a reading happened to catch.
      const begun =
        stage === SWELL_RISING &&
        state.stage !== -1 &&
        (state.stage !== SWELL_RISING || position < state.position)
      if (begun) state.gain.push(frame.now, swellGainDb(frame, 0))
      state.gain.push(frame.now, state.now)
      state.stage = stage
      state.position = position
    } else if (!frame.powered) {
      forget(state.arriving, state.leaving, state.gain)
      state.now = 0
    }

    // Left: one swell as it is set, from the floor up, open, and down again.
    const { riseEnd, fallStart } = swellParts(frame)
    const points: Point[] = []
    for (let x = 0; x <= curve.w; x += 1) {
      const t = x / curve.w
      const position =
        t < riseEnd ? t / riseEnd : t < fallStart ? 1 : 1 - (t - fallStart) / (1 - fallStart)
      points.push([curve.x + x, hangY(swellGainDb(frame, position), curve, SPAN_DB)])
    }
    gainShape(frame, curve, points)

    // Right: the last seconds.
    dbGrid(frame, past, TOP_DB, FOOT_DB, 20)
    clipped(ctx, past, () => {
      const leaving = state.leaving.points(past, (db) => yOf(db, past))
      fillTo(ctx, leaving, past.y + past.h, colours.ink, INK.fill)
      curtain(frame, past, state.gain, SPAN_DB)
      trace(
        ctx,
        state.arriving.points(past, (db) => yOf(db, past)),
        {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
        },
      )
      trace(ctx, leaving, { colour: colours.ink, width: 1.25 })
    })
    const sensitivity = frame.value('sensitivity')
    levelLine(frame, past, handleY(sensitivity, past), 'sensitivity', dbText(sensitivity))

    // Where the swell is now, on its shape: along the rise, open, or along the
    // fall. Shut, nothing is under way and there is no mark.
    if (frame.signal && metered && stage !== SWELL_CLOSED) {
      const t =
        stage === SWELL_RISING
          ? position * riseEnd
          : stage === SWELL_OPEN
            ? (riseEnd + fallStart) / 2
            : stage === SWELL_FALLING
              ? fallStart + (1 - position) * (1 - fallStart)
              : 0
      // Its height is the gain itself, which also covers the dive before a rise.
      const gain = swellAppliedDb(frame, clamp(frame.meter('gain'), 0, 1))
      dot(ctx, curve.x + t * curve.w, hangY(gain, curve, SPAN_DB), 2.5, colours.accent, {
        ring: colours.ink,
      })
    }
  },
  handles: swellHandles,
})

export const DYNAMICS_FACES: Readonly<Record<string, PlateFace>> = {
  'ambient-comp': {
    display: ambientComp,
    face: ['threshold', 'ratio', 'attack', 'release'],
  },
  compressor: {
    display: nodeComp,
    face: ['threshold', 'ratio', 'attack', 'release'],
  },
  'ambient-limiter': {
    display: ambientLimiter,
    face: ['ceiling', 'gain', 'release', 'ride'],
  },
  'fet-limiter': {
    display: fetLimiter,
    face: ['inputGain', 'outputGain'],
  },
  ducker: {
    display: ducker,
    face: ['depth', 'attackMs', 'holdMs', 'releaseMs'],
  },
  swell: {
    display: swell,
    face: ['attack', 'release', 'depth', 'curve'],
  },
}
