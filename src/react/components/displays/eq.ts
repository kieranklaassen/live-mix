// Displays of the devices that shape the spectrum: the curve the device is
// set to, drawn from the same filters the sound goes through, over the
// spectrum of what comes out of it.

import { filterTypeAt, type FilterType } from '../../../core/devices/native/Filter'
import {
  FLOOR_DB,
  INK,
  biquad,
  biquadDb,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dbText,
  dot,
  fillBetween,
  fillRect,
  fillTo,
  follow,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  responsePoints,
  rule,
  spectrum,
  text,
  trace,
  xOfHz,
  yOfDb,
  type Biquad,
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

/** The spectrum behind a curve runs from full scale at the top down to this at the foot. */
const SPECTRUM_FOOT_DB = -84

const curveBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})

type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** A parameter's range, or `fallback` for a name the device lacks. */
function rangeOf(view: DisplayView, param: string, fallback: [number, number]): [number, number] {
  const spec = view.spec(param)
  return spec ? [spec.min, spec.max] : fallback
}

/** Where a parameter starts, or `fallback` for a name the device lacks. */
const startOf = (view: DisplayView, param: string, fallback: number): number =>
  view.spec(param)?.default ?? fallback

/** A curve as this family draws it: filled to the line where nothing is changed, and traced, in the ink. */
function curve(frame: Paint, points: readonly Point[], zeroY: number): void {
  fillTo(frame.ctx, points, zeroY, frame.colours.ink, INK.fill)
  trace(frame.ctx, points, { colour: frame.colours.ink })
}

/**
 * A response curve that also has a point at each of `through`: a narrow peak
 * or notch falls between two of the kit's points, which are two pixels apart,
 * and would be drawn short of its top or its foot.
 */
function responseThrough(
  box: Box,
  db: (hz: number) => number,
  topDb: number,
  bottomDb: number,
  through: readonly number[],
): Point[] {
  const points = responsePoints(box, db, topDb, bottomDb)
  for (const hz of through) {
    const x = xOfHz(hz, box)
    const y = yOfDb(clamp(db(hz), bottomDb - 24, topDb + 24), box, topDb, bottomDb)
    const after = points.findIndex((point) => point[0] > x)
    points.splice(after === -1 ? points.length : after, 0, [x, y])
  }
  return points
}

/**
 * What second-order filters in series do to a frequency, in dB: the sum of
 * the kit's `biquadDb` over them, with the sines and cosines of the frequency
 * taken once for all of them. Clear can have twenty filters in the path.
 */
export function seriesDb(filters: readonly Biquad[], hz: number, sampleRate: number): number {
  const w = (2 * Math.PI * hz) / sampleRate
  const cos1 = Math.cos(w)
  const cos2 = Math.cos(2 * w)
  const sin1 = Math.sin(w)
  const sin2 = Math.sin(2 * w)
  let power = 1
  for (const filter of filters) {
    const numRe = filter.b0 + filter.b1 * cos1 + filter.b2 * cos2
    const numIm = filter.b1 * sin1 + filter.b2 * sin2
    const denRe = 1 + filter.a1 * cos1 + filter.a2 * cos2
    const denIm = filter.a1 * sin1 + filter.a2 * sin2
    power *= (numRe * numRe + numIm * numIm) / (denRe * denRe + denIm * denIm)
  }
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/** A width as a knob says it: "Q 0.71", "Q 12". */
const qText = (q: number): string => `Q ${q.toFixed(q < 10 ? 2 : 1).replace(/\.?0+$/, '')}`

/** Words at a corner of a display. */
interface Caption {
  words: string
  /** The side of the head of the display it stands at when no point is in its way. */
  side: 'left' | 'right'
  size?: number
  /** A second, fainter line with it. */
  note?: string
}

/** The corners in the order a caption tries them: its own side of the head, the other side, then the foot. */
const CORNERS = {
  left: ['head left', 'head right', 'foot left', 'foot right'],
  right: ['head right', 'head left', 'foot right', 'foot left'],
} as const
type Corner = (typeof CORNERS.left)[number]

/** Whether words so wide and so deep can stand in a corner of `box` with no point under them. */
function cornerFree(
  corner: Corner,
  box: Box,
  points: readonly { x: number; y: number }[],
  width: number,
  depth: number,
): boolean {
  const from = corner.endsWith('left') ? box.x + 2 : box.x + box.w - 2 - width
  const head = corner.startsWith('head')
  for (const point of points) {
    // A point in hand is 5 px to its rim.
    const across = point.x > from - 5 && point.x < from + width + 5
    const inside = head ? point.y < box.y + depth + 5 : point.y > box.y + box.h - depth - 5
    if (across && inside) return false
  }
  return true
}

/**
 * The words on a display, kept clear of its points: a point at the top of
 * its travel stands where the words are, and under it they cannot be read.
 * Each caption takes the first corner that has no point in it and no caption
 * before it; the one given first chooses first.
 */
function captions(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  box: Box,
  points: readonly { x: number; y: number }[],
  items: readonly (Caption | null)[],
): void {
  let taken = ''
  for (const item of items) {
    if (!item) continue
    const size = item.size ?? 8
    frame.ctx.font = `${size}px ${frame.fontFamily}`
    let width = frame.ctx.measureText(item.words).width
    if (item.note) width = Math.max(width, frame.ctx.measureText(item.note).width)
    // How far in from the head or the foot the words reach: a line, or two.
    const depth = item.note ? 21 : 12
    let corner: Corner = CORNERS[item.side][0]
    for (const tried of CORNERS[item.side]) {
      if (taken.includes(tried) || !cornerFree(tried, box, points, width, depth)) continue
      corner = tried
      break
    }
    taken += corner
    const left = corner.endsWith('left')
    const head = corner.startsWith('head')
    const x = left ? box.x + 2 : box.x + box.w - 2
    const y = head ? box.y + 8 : box.y + box.h - 3
    const align = left ? 'left' : 'right'
    text(frame, item.words, x, y, { align, size })
    // The note is the inner line: under the words at the head, over them at the foot.
    if (item.note) text(frame, item.note, x, head ? y + 9 : y - 9, { align, alpha: INK.back })
  }
}

// --- Parametric EQ ----------------------------------------------------------

const PARAMETRIC_BANDS = [1, 2, 3, 4] as const
/** A little past the bands' ±18 dB, so a point at the end of its travel is whole. */
const PARAMETRIC_DB = 20

/**
 * The Parametric EQ's curve: `ParametricEq.ts` puts a high-pass, four peaking
 * filters and a low-pass in series, each a Web Audio biquad. The two cuts are
 * built with `Q = √½`, which Web Audio reads as dB for a cut.
 */
function parametricDb(view: DisplayView, sampleRate: number): (hz: number) => number {
  const filters = [
    biquad('highpass', view.value('lowCut'), Math.SQRT1_2, 0, sampleRate, true),
    ...PARAMETRIC_BANDS.map((n) =>
      biquad(
        'peaking',
        view.value(`band${n}Freq`),
        view.value(`band${n}Q`),
        view.value(`band${n}Gain`),
        sampleRate,
      ),
    ),
    biquad('lowpass', view.value('highCut'), Math.SQRT1_2, 0, sampleRate, true),
  ]
  return (hz) => filters.reduce((sum, filter) => sum + biquadDb(filter, hz, sampleRate), 0)
}

function parametricHandles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  const zero = yOfDb(0, box, PARAMETRIC_DB, -PARAMETRIC_DB)
  const range = (param: string, fallback: [number, number]): [number, number] => {
    const spec = view.spec(param)
    return spec ? [spec.min, spec.max] : fallback
  }
  const cut = (param: 'lowCut' | 'highCut', name: string): DisplayHandle => {
    const [min, max] = range(param, [20, 20000])
    return {
      key: param,
      name,
      x: xOfHz(view.value(param), box),
      y: zero,
      drag: (x) => ({ [param]: clamp(hzOfX(x, box), min, max) }),
      reset: () => ({ [param]: view.spec(param)?.default ?? view.value(param) }),
    }
  }
  return [
    cut('lowCut', 'Low cut'),
    ...PARAMETRIC_BANDS.map((n): DisplayHandle => {
      const [freq, gain, q] = [`band${n}Freq`, `band${n}Gain`, `band${n}Q`]
      const [gainMin, gainMax] = range(gain, [-18, 18])
      const [qMin, qMax] = range(q, [0.1, 10])
      return {
        key: `band${n}`,
        name: `Band ${n}`,
        x: xOfHz(view.value(freq), box),
        y: yOfDb(view.value(gain), box, PARAMETRIC_DB, -PARAMETRIC_DB),
        drag: (x, y) => ({
          [freq]: hzOfX(x, box),
          [gain]: clamp(dbOfY(y, box, PARAMETRIC_DB, -PARAMETRIC_DB), gainMin, gainMax),
        }),
        // The wheel narrows and widens the band.
        wheel: (steps) => ({ [q]: clamp(view.value(q) * Math.pow(1.2, steps), qMin, qMax) }),
        reset: () => ({ [gain]: 0, [q]: view.spec(q)?.default ?? 1 }),
      }
    }),
    cut('highCut', 'High cut'),
  ]
}

const parametricEq = plateDisplay({
  place: 'window',
  columns: 1,
  params: [
    'lowCut',
    'highCut',
    ...PARAMETRIC_BANDS.flatMap((n) => [`band${n}Freq`, `band${n}Gain`, `band${n}Q`]),
  ],
  live: { spectrum: true },
  info: 'The curve the EQ is set to, from 20 Hz at the left to 20 kHz at the right, over the spectrum of what comes out. Each point is a band: across is its frequency, up and down its gain, and the wheel its width. The two points on the middle line are the low and the high cut.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const box = curveBox(frame)
    const zero = yOfDb(0, box, PARAMETRIC_DB, -PARAMETRIC_DB)
    freqGrid(frame, box)
    dbGrid(frame, box, PARAMETRIC_DB, -PARAMETRIC_DB, 6)
    clipped(ctx, box, () => {
      // The sound, in the second ink: it is what is happening; the curve is what is set.
      spectrum(frame, box, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.5 })
      const points = responsePoints(
        box,
        parametricDb(frame, frame.sampleRate),
        PARAMETRIC_DB,
        -PARAMETRIC_DB,
      )
      fillTo(ctx, points, zero, colours.ink, INK.fill)
      trace(ctx, points, { colour: colours.ink })
    })
    const handles = parametricHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    const hot = handles.find((point) => point.key === frame.hot)
    if (hot) {
      // The point in hand, in words: a band's frequency and gain, a cut's frequency.
      const band = /^band(\d)$/.exec(hot.key)?.[1]
      const words = band
        ? `${hzText(frame.value(`band${band}Freq`))}  ${dbText(frame.value(`band${band}Gain`))}`
        : `${hot.name}  ${hzText(frame.value(hot.key))}`
      text(frame, words, box.x + 2, box.y + 8)
    }
  },
  handles: parametricHandles,
})

// --- Filter -----------------------------------------------------------------

/** A little past the ±24 dB of the shelves and the peak, so a point at the end of its travel is whole. */
export const FILTER_DB = 27

const FILTER_NAMES: Readonly<Record<FilterType, string>> = {
  lowpass: 'Low pass',
  highpass: 'High pass',
  bandpass: 'Band pass',
  lowshelf: 'Low shelf',
  highshelf: 'High shelf',
  peaking: 'Peak',
  notch: 'Notch',
  allpass: 'All pass',
}

/** The types whose Q is the height of the peak at the cutoff, in dB. */
const isCut = (kind: FilterType): boolean => kind === 'lowpass' || kind === 'highpass'
/** The types Gain acts on; the others take no notice of it. */
const hasGain = (kind: FilterType): boolean =>
  kind === 'lowshelf' || kind === 'highshelf' || kind === 'peaking'

/**
 * The Filter's one biquad: `Filter.ts` is a Web Audio `BiquadFilterNode` whose
 * type, frequency, Q and gain are the four parameters. For a low or a high
 * pass Web Audio reads Q as dB, so the curve stands Q dB high at the cutoff.
 */
function filterBiquad(view: DisplayView, sampleRate: number): Biquad {
  const kind = filterTypeAt(view.value('type'))
  return biquad(
    kind,
    view.value('frequency'),
    view.value('q'),
    view.value('gain'),
    sampleRate,
    isCut(kind),
  )
}

/**
 * How far a second-order filter turns a frequency, in turns: 0 at the low end
 * and down to −1 at the top for an all-pass, which is all an all-pass does.
 */
export function biquadTurns(filter: Biquad, hz: number, sampleRate: number): number {
  const w = (2 * Math.PI * hz) / sampleRate
  const cos1 = Math.cos(w)
  const cos2 = Math.cos(2 * w)
  const sin1 = Math.sin(w)
  const sin2 = Math.sin(2 * w)
  const num = Math.atan2(
    -(filter.b1 * sin1 + filter.b2 * sin2),
    filter.b0 + filter.b1 * cos1 + filter.b2 * cos2,
  )
  const den = Math.atan2(
    -(filter.a1 * sin1 + filter.a2 * sin2),
    1 + filter.a1 * cos1 + filter.a2 * cos2,
  )
  const turns = (num - den) / (2 * Math.PI)
  return turns > 1e-9 ? turns - 1 : turns
}

/** Where Q stands on the height of a box for the types whose point cannot ride the curve: wide at the foot, narrow at the top. */
function yOfQ(q: number, box: Box, min: number, max: number): number {
  return box.y + box.h * (1 - Math.log(clamp(q, min, max) / min) / Math.log(max / min))
}

function qOfY(y: number, box: Box, min: number, max: number): number {
  return min * Math.pow(max / min, clamp(1 - (y - box.y) / box.h, 0, 1))
}

function filterHandles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  const kind = filterTypeAt(view.value('type'))
  const [hzMin, hzMax] = rangeOf(view, 'frequency', [20, 20000])
  const [qMin, qMax] = rangeOf(view, 'q', [0.1, 20])
  const x = xOfHz(view.value('frequency'), box)
  const frequency = (at: number): number => clamp(hzOfX(at, box), hzMin, hzMax)
  if (hasGain(kind)) {
    const [gainMin, gainMax] = rangeOf(view, 'gain', [-24, 24])
    const peak = kind === 'peaking'
    return [
      {
        key: 'point',
        name: FILTER_NAMES[kind],
        x,
        y: yOfDb(view.value('gain'), box, FILTER_DB, -FILTER_DB),
        drag: (toX, toY) => ({
          frequency: frequency(toX),
          gain: clamp(dbOfY(toY, box, FILTER_DB, -FILTER_DB), gainMin, gainMax),
        }),
        // The wheel narrows and widens the peak; a shelf has no width to set.
        ...(peak && {
          wheel: (steps: number) => ({
            q: clamp(view.value('q') * Math.pow(1.2, steps), qMin, qMax),
          }),
        }),
        reset: (): Readonly<Record<string, number>> =>
          peak ? { gain: 0, q: startOf(view, 'q', Math.SQRT1_2) } : { gain: 0 },
      },
    ]
  }
  const cut = isCut(kind)
  return [
    {
      key: 'point',
      name: FILTER_NAMES[kind],
      x,
      // A cut's point rides the curve: Q is the height of the peak there. The
      // others are 0 dB (or nothing) at their centre whatever Q is, so their
      // point shows Q by how high it stands.
      y: cut
        ? yOfDb(view.value('q'), box, FILTER_DB, -FILTER_DB)
        : yOfQ(view.value('q'), box, qMin, qMax),
      drag: (toX, toY) => ({
        frequency: frequency(toX),
        q: cut
          ? clamp(dbOfY(toY, box, FILTER_DB, -FILTER_DB), qMin, qMax)
          : qOfY(toY, box, qMin, qMax),
      }),
      reset: () => ({
        frequency: startOf(view, 'frequency', 1000),
        q: startOf(view, 'q', Math.SQRT1_2),
      }),
    },
  ]
}

const filter = plateDisplay({
  place: 'window',
  columns: 1,
  params: ['type', 'frequency', 'q', 'gain'],
  live: { spectrum: true },
  info: 'The curve of the filter type that is set, from 20 Hz to 20 kHz, over the spectrum of what comes out. Drag the point: across is the frequency, up and down the resonance, or the gain of a shelf or a peak. The dashed line of All pass is the phase.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const box = curveBox(frame)
    const zero = yOfDb(0, box, FILTER_DB, -FILTER_DB)
    const kind = filterTypeAt(frame.value('type'))
    const biquadNow = filterBiquad(frame, frame.sampleRate)
    freqGrid(frame, box)
    dbGrid(frame, box, FILTER_DB, -FILTER_DB, 12)
    const [point] = filterHandles(frame)
    clipped(ctx, box, () => {
      spectrum(frame, box, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.5 })
      if (kind === 'allpass') {
        // Nothing is louder or quieter: what moves is the phase, from none at
        // the top of the box to a whole turn at its foot, half a turn at the centre.
        const turned: Point[] = []
        for (let x = 0; x <= box.w; x += 2) {
          const turns = biquadTurns(biquadNow, hzOfX(box.x + x, box), frame.sampleRate)
          turned.push([box.x + x, box.y - turns * box.h])
        }
        trace(ctx, turned, { colour: colours.ink, width: 1, alpha: INK.back, dash: [3, 2] })
      }
      curve(
        frame,
        responseThrough(
          box,
          (hz) => biquadDb(biquadNow, hz, frame.sampleRate),
          FILTER_DB,
          -FILTER_DB,
          [frame.value('frequency')],
        ),
        zero,
      )
      // The point off the curve is tied to it by a line at its frequency.
      if (!isCut(kind) && kind !== 'peaking')
        rule(ctx, point.x, zero, point.x, point.y, { colour: colours.ink, alpha: INK.rule })
    })
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    const height = hasGain(kind) ? dbText(frame.value('gain')) : qText(frame.value('q'))
    captions(
      frame,
      box,
      [point],
      [
        // The point in hand, in words.
        frame.hot === point.key
          ? { words: `${hzText(frame.value('frequency'))}  ${height}`, side: 'left' }
          : null,
        // The type in words: its knob has only a position to show.
        {
          words: FILTER_NAMES[kind],
          side: 'right',
          note: kind === 'allpass' ? 'phase 0° to −360°' : undefined,
        },
      ],
    )
  },
  handles: filterHandles,
})

// --- EQ Three ---------------------------------------------------------------

/** A little past the bands' ±15 dB. */
export const EQ3_DB = 18

/** The three bands as `Eq3.ts` builds them: a low shelf, a peak and a high shelf in series. */
const EQ3_BANDS = [
  { key: 'low', name: 'Low', kind: 'lowshelf', freq: 'lowFreq', gain: 'lowGain' },
  { key: 'mid', name: 'Mid', kind: 'peaking', freq: 'midFreq', gain: 'midGain' },
  { key: 'high', name: 'High', kind: 'highshelf', freq: 'highFreq', gain: 'highGain' },
] as const

/** One biquad per band, each a Web Audio biquad; only the peak has a Q. */
function eq3Filters(view: DisplayView, sampleRate: number): Biquad[] {
  return EQ3_BANDS.map((band) =>
    biquad(band.kind, view.value(band.freq), view.value('midQ'), view.value(band.gain), sampleRate),
  )
}

function eq3Handles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  const [qMin, qMax] = rangeOf(view, 'midQ', [0.3, 5])
  return EQ3_BANDS.map((band): DisplayHandle => {
    const [hzMin, hzMax] = rangeOf(view, band.freq, [20, 20000])
    const [gainMin, gainMax] = rangeOf(view, band.gain, [-15, 15])
    const peak = band.kind === 'peaking'
    return {
      key: band.key,
      name: band.name,
      x: xOfHz(view.value(band.freq), box),
      y: yOfDb(view.value(band.gain), box, EQ3_DB, -EQ3_DB),
      drag: (x, y) => ({
        [band.freq]: clamp(hzOfX(x, box), hzMin, hzMax),
        [band.gain]: clamp(dbOfY(y, box, EQ3_DB, -EQ3_DB), gainMin, gainMax),
      }),
      // The wheel narrows and widens the middle band; a shelf has no width to set.
      ...(peak && {
        wheel: (steps: number) => ({
          midQ: clamp(view.value('midQ') * Math.pow(1.2, steps), qMin, qMax),
        }),
      }),
      reset: () => (peak ? { [band.gain]: 0, midQ: startOf(view, 'midQ', 1) } : { [band.gain]: 0 }),
    }
  })
}

const eq3 = plateDisplay({
  place: 'window',
  columns: 1,
  params: ['lowGain', 'lowFreq', 'midGain', 'midFreq', 'midQ', 'highGain', 'highFreq'],
  live: { spectrum: true },
  info: 'The curve of the three bands together, from 20 Hz to 20 kHz, over the spectrum of what comes out. Each point is a band: up and down is its gain, across is where it sits, and the wheel sets the width of the middle one. The band in hand is drawn alone as a dashed line.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const box = curveBox(frame)
    const zero = yOfDb(0, box, EQ3_DB, -EQ3_DB)
    const filters = eq3Filters(frame, frame.sampleRate)
    freqGrid(frame, box)
    dbGrid(frame, box, EQ3_DB, -EQ3_DB, 6)
    const handles = eq3Handles(frame)
    const hot = handles.findIndex((point) => point.key === frame.hot)
    clipped(ctx, box, () => {
      spectrum(frame, box, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.5 })
      curve(
        frame,
        responseThrough(box, (hz) => seriesDb(filters, hz, frame.sampleRate), EQ3_DB, -EQ3_DB, [
          frame.value('midFreq'),
        ]),
        zero,
      )
      // The band in hand, alone: what this point adds to the curve.
      if (hot >= 0)
        trace(
          ctx,
          responseThrough(
            box,
            (hz) => biquadDb(filters[hot], hz, frame.sampleRate),
            EQ3_DB,
            -EQ3_DB,
            [frame.value(EQ3_BANDS[hot].freq)],
          ),
          { colour: colours.ink, width: 1, alpha: INK.back, dash: [3, 2] },
        )
    })
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (hot >= 0) {
      const band = EQ3_BANDS[hot]
      const words = `${hzText(frame.value(band.freq))}  ${dbText(frame.value(band.gain))}`
      captions(frame, box, handles, [{ words, side: 'left' }])
    }
  },
  handles: eq3Handles,
})

// --- Ambient EQ -------------------------------------------------------------

/** A little past the tone controls' ±12 dB. */
export const AMBIENT_DB = 15

/**
 * A stage of `kit::Svf` (cpp/kit/filters.h), which the Ambient EQ's two cuts
 * are made of: the analog second-order response at the frequency the tangent
 * warps to, in dB.
 */
export function svfDb(
  kind: 'lowpass' | 'highpass',
  cutHz: number,
  q: number,
  hz: number,
  sampleRate: number,
): number {
  const g = Math.tan((Math.PI * clamp(cutHz, 5, sampleRate * 0.49)) / sampleRate)
  const w = Math.tan((Math.PI * Math.min(hz, sampleRate * 0.499)) / sampleRate) / g
  const w2 = w * w
  const power = (kind === 'lowpass' ? 1 : w2 * w2) / ((1 - w2) * (1 - w2) + (w2 / q) * (1 / q))
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/** The Qs of the two stages that make the Low cut a fourth-order Butterworth (`kLowCutQ`). */
const AMBIENT_LOW_CUT_Q = [0.5412, 1.3066] as const

/** The four tone controls of `ambient_eq.h`, each at a fixed place: two shelves and two bells of Q 0.7. */
const AMBIENT_TONES = [
  { param: 'low', name: 'Low', kind: 'lowshelf', hz: 120 },
  { param: 'body', name: 'Body', kind: 'peaking', hz: 320 },
  { param: 'presence', name: 'Presence', kind: 'peaking', hz: 3000 },
  { param: 'air', name: 'Air', kind: 'highshelf', hz: 9000 },
] as const
const AMBIENT_BELL_Q = 0.7

/** Whether the Low cut and the High cut are in circuit: the device takes each out at the end of its range. */
function ambientCutsIn(view: DisplayView): [boolean, boolean] {
  return [
    view.value('lowCut') > (view.spec('lowCut')?.min ?? 20),
    view.value('highCut') < (view.spec('highCut')?.max ?? 20000),
  ]
}

/**
 * What the Ambient EQ is set to, before Clear: `ambient_eq.h` runs a low cut
 * (24 dB an octave), the four tone stages and a high cut (12 dB an octave) in
 * series. A cut at the end of its range is out of circuit, as in the device.
 */
function ambientToneDb(view: DisplayView, sampleRate: number): (hz: number) => number {
  const lowCut = view.value('lowCut')
  const highCut = view.value('highCut')
  const [lowCutIn, highCutIn] = ambientCutsIn(view)
  const tones = AMBIENT_TONES.filter((tone) => view.value(tone.param) !== 0).map((tone) =>
    biquad(tone.kind, tone.hz, AMBIENT_BELL_Q, view.value(tone.param), sampleRate),
  )
  return (hz) => {
    let db = seriesDb(tones, hz, sampleRate)
    if (lowCutIn)
      for (const q of AMBIENT_LOW_CUT_Q) db += svfDb('highpass', lowCut, q, hz, sampleRate)
    if (highCutIn) db += svfDb('lowpass', highCut, Math.SQRT1_2, hz, sampleRate)
    return db
  }
}

/**
 * Clear's bands as `lay_out_bands` has them: four half an octave wide from
 * 45 Hz, then thirds of an octave from 180 Hz, each cut by a peak at its
 * centre with the Q whose width is the band.
 */
export const CLEAR_BANDS: readonly { hz: number; q: number }[] = Array.from(
  { length: 23 },
  (_, k) => {
    const octaves = k < 4 ? 0.5 : 1 / 3
    const low = k < 4 ? 45 * Math.pow(2, 0.5 * k) : 180 * Math.pow(2, (k - 4) / 3)
    return {
      hz: low * Math.pow(2, 0.5 * octaves),
      q: Math.pow(2, 0.5 * octaves) / (Math.pow(2, octaves) - 1),
    }
  },
)
/** The two lowest bands are never cut, and no band by more than this at Clear 1 (`kMaxExcessDb`). */
const CLEAR_FROM_HZ = 90
const CLEAR_TO_HZ = 180 * Math.pow(2, 19 / 3)
const CLEAR_MOST_DB = 12
/** The device's readings that carry the cuts: five bands to a reading, one digit in base 25 each, in half dB. */
const CLEAR_READINGS = ['cuts1', 'cuts2', 'cuts3', 'cuts4', 'cuts5'] as const
const CLEAR_PER_READING = 5
const CLEAR_STEPS = 25

/** The cut of every band, in dB (0 or below), out of the device's five readings. */
export function clearCuts(reading: (name: string) => number, into: Float32Array): Float32Array {
  for (let r = 0; r < CLEAR_READINGS.length; r++) {
    let packed = Math.round(reading(CLEAR_READINGS[r]))
    if (!(packed > 0)) packed = 0
    for (let i = 0; i < CLEAR_PER_READING; i++) {
      const band = r * CLEAR_PER_READING + i
      if (band >= into.length) break
      const steps = packed % CLEAR_STEPS
      packed = (packed - steps) / CLEAR_STEPS
      into[band] = steps > 0 ? -steps / 2 : 0
    }
  }
  return into
}

interface AmbientState {
  /** Each band's cut as the device last reported it, and as it is drawn: the half-dB steps eased. */
  read: Float32Array
  cuts: Float32Array
}

function ambientHandles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  // A cut's point stands where the cut has taken 3 dB: on its own curve, and
  // clear of the tone points, which rest on the middle line at fixed places
  // inside the cut's travel and would lie under it there. At the end of its
  // range the cut is out of circuit and its point is on the middle line, as
  // the curve is.
  const [lowCutIn, highCutIn] = ambientCutsIn(view)
  const cut = (param: 'lowCut' | 'highCut', name: string, inCircuit: boolean): DisplayHandle => {
    const [min, max] = rangeOf(view, param, [20, 20000])
    return {
      key: param,
      name,
      x: xOfHz(view.value(param), box),
      y: yOfDb(inCircuit ? -3 : 0, box, AMBIENT_DB, -AMBIENT_DB),
      drag: (x) => ({ [param]: clamp(hzOfX(x, box), min, max) }),
      reset: () => ({ [param]: startOf(view, param, view.value(param)) }),
    }
  }
  return [
    cut('lowCut', 'Low cut', lowCutIn),
    ...AMBIENT_TONES.map((tone): DisplayHandle => {
      const [min, max] = rangeOf(view, tone.param, [-12, 12])
      return {
        key: tone.param,
        name: tone.name,
        // Where a tone control sits is the device's; only its gain is set.
        x: xOfHz(tone.hz, box),
        y: yOfDb(view.value(tone.param), box, AMBIENT_DB, -AMBIENT_DB),
        drag: (_x, y) => ({
          [tone.param]: clamp(dbOfY(y, box, AMBIENT_DB, -AMBIENT_DB), min, max),
        }),
        reset: () => ({ [tone.param]: 0 }),
      }
    }),
    cut('highCut', 'High cut', highCutIn),
  ]
}

const ambientEq = plateDisplay<AmbientState>({
  place: 'window',
  columns: 1,
  params: ['lowCut', 'low', 'body', 'presence', 'air', 'highCut', 'clear'],
  live: { meters: true, spectrum: true },
  info: 'The curve the tone controls and the two cuts are set to, over the spectrum of what comes out, with a point to drag for each. In the second colour, what Clear is taking off each band right now, and the deepest cut in dB in the corner. The dotted line is how far Clear may reach.',
  init: () => ({
    read: new Float32Array(CLEAR_BANDS.length),
    cuts: new Float32Array(CLEAR_BANDS.length),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = curveBox(frame)
    const zero = yOfDb(0, box, AMBIENT_DB, -AMBIENT_DB)
    const running = frame.signal !== null && frame.powered

    // What Clear is taking off, band by band, from the device.
    let cutting = false
    if (running) clearCuts((name) => frame.meter(name), state.read)
    for (let band = 0; band < state.cuts.length; band++) {
      state.cuts[band] = running
        ? follow(state.cuts[band], state.read[band], frame.dt, 0.06, 0.06)
        : 0
      if (state.cuts[band] < -0.05) cutting = true
    }

    freqGrid(frame, box)
    dbGrid(frame, box, AMBIENT_DB, -AMBIENT_DB, 6)
    clipped(ctx, box, () => {
      spectrum(frame, box, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.5 })
      const tone = ambientToneDb(frame, frame.sampleRate)
      // A point at each cut's own frequency, where its handle stands on the curve.
      const corners = [frame.value('lowCut'), frame.value('highCut')]
      const set = responseThrough(box, tone, AMBIENT_DB, -AMBIENT_DB, corners)
      // How far Clear may take a band down from the curve: Clear times 12 dB,
      // over the bands it works on.
      const reach = frame.value('clear') * CLEAR_MOST_DB
      if (reach > 0) {
        const depth = (reach / (2 * AMBIENT_DB)) * box.h
        const from = xOfHz(CLEAR_FROM_HZ, box)
        const to = xOfHz(CLEAR_TO_HZ, box)
        trace(
          ctx,
          set.filter(([x]) => x >= from && x <= to).map(([x, y]): Point => [x, y + depth]),
          { colour: colours.ink, width: 1, alpha: INK.back, dash: [1, 3] },
        )
      }
      if (cutting) {
        // The curve as it stands now: each band's cut is a peak at its centre
        // one band wide, the same biquad the device designs.
        const cuts: Biquad[] = []
        const through = [...corners]
        CLEAR_BANDS.forEach((band, k) => {
          if (state.cuts[k] >= -0.05) return
          cuts.push(biquad('peaking', band.hz, band.q, state.cuts[k], frame.sampleRate))
          through.push(band.hz)
        })
        const now = responseThrough(
          box,
          (hz) => tone(hz) + seriesDb(cuts, hz, frame.sampleRate),
          AMBIENT_DB,
          -AMBIENT_DB,
          through,
        )
        fillTo(ctx, set, zero, colours.ink, INK.fill)
        fillBetween(ctx, set, now, colours.accent, 0.9)
        trace(ctx, now, { colour: colours.ink, width: 1 })
        trace(ctx, set, { colour: colours.ink })
      } else {
        curve(frame, set, zero)
      }
    })
    const handles = ambientHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    const hot = handles.find((point) => point.key === frame.hot)
    const value = hot ? frame.value(hot.key) : 0
    const cut = hot?.key === 'lowCut' || hot?.key === 'highCut'
    // The deepest cut Clear is making, as a number: the one figure it is watched by.
    const deepest = running ? Math.min(0, frame.meter('reduction')) : 0
    captions(frame, box, handles, [
      hot ? { words: `${hot.name}  ${cut ? hzText(value) : dbText(value)}`, side: 'left' } : null,
      { words: dbText(deepest), side: 'right', size: 9 },
    ])
  },
  handles: ambientHandles,
})

// --- Auto Filter ------------------------------------------------------------

/** From over the resonance at its highest (Q 25 is 28 dB) down past three octaves of a 12 dB slope. */
export const AUTO_TOP_DB = 30
export const AUTO_FOOT_DB = -42
/** How far the envelope and the LFO move the cutoff at 100 %, in octaves (`kEnvOctaves`, `kLfoOctaves`). */
const AUTO_ENV_OCTAVES = 5
const AUTO_LFO_OCTAVES = 3
const AUTO_MIN_HZ = 20
const AUTO_MAX_HZ = 20000

const AUTO_TYPES = ['lowpass', 'highpass', 'bandpass', 'notch', 'peak'] as const

/**
 * What the Auto Filter does to a frequency with its cutoff at `cutoffHz`, in
 * dB. Ported from `SvfTptTone::magnitude` and `AutoFilter::filter`: the analog
 * response at the frequency the tangent warps to, at twice the sample rate;
 * each type a weighting of low, band and high; 24 dB as two stages at √Q; and
 * the dry sound, which the device keeps in time with the wet, added by Mix.
 * It is kept as a complex number because the two add with their phases.
 */
export function autoFilterDb(
  setting: { type: number; steep: boolean; q: number; mix: number },
  cutoffHz: number,
  sampleRate: number,
): (hz: number) => number {
  const type = AUTO_TYPES[clamp(Math.round(setting.type), 0, AUTO_TYPES.length - 1)]
  const rate = 2 * sampleRate
  const g = Math.tan(
    (Math.PI * clamp(cutoffHz, AUTO_MIN_HZ, Math.min(AUTO_MAX_HZ, 0.45 * rate))) / rate,
  )
  const k = 1 / (setting.steep ? Math.sqrt(setting.q) : setting.q)
  const { mix, steep } = setting
  return (hz) => {
    const w = Math.tan((Math.PI * Math.min(hz, 0.49 * rate)) / rate) / g
    const w2 = w * w
    // One stage is (its type's numerator) / (1 − w² + j·k·w).
    const denRe = 1 - w2
    const denIm = k * w
    const den = denRe * denRe + denIm * denIm
    const numRe =
      type === 'lowpass'
        ? 1
        : type === 'highpass'
          ? -w2
          : type === 'notch'
            ? 1 - w2
            : type === 'peak'
              ? 1 + w2
              : 0
    const numIm = type === 'bandpass' ? k * w : 0
    let re = (numRe * denRe + numIm * denIm) / den
    let im = (numIm * denRe - numRe * denIm) / den
    if (steep) [re, im] = [re * re - im * im, 2 * re * im]
    const outRe = 1 - mix + mix * re
    const outIm = mix * im
    const power = outRe * outRe + outIm * outIm
    return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
  }
}

const autoSetting = (view: DisplayView) => ({
  type: view.value('type'),
  steep: view.value('slope') >= 0.5,
  q: view.value('resonance'),
  mix: view.value('mix'),
})

/** The lowest and the highest cutoff the envelope and the LFO can take the filter to, in Hz. */
export function autoFilterSweep(
  cutoffHz: number,
  envAmount: number,
  lfoAmount: number,
): [number, number] {
  const env = (envAmount / 100) * AUTO_ENV_OCTAVES
  const lfo = (lfoAmount / 100) * AUTO_LFO_OCTAVES
  return [
    clamp(cutoffHz * Math.pow(2, Math.min(0, env) - lfo), AUTO_MIN_HZ, AUTO_MAX_HZ),
    clamp(cutoffHz * Math.pow(2, Math.max(0, env) + lfo), AUTO_MIN_HZ, AUTO_MAX_HZ),
  ]
}

function autoFilterHandles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  const [hzMin, hzMax] = rangeOf(view, 'cutoffHz', [AUTO_MIN_HZ, AUTO_MAX_HZ])
  const [qMin, qMax] = rangeOf(view, 'resonance', [0.5, 25])
  return [
    {
      key: 'cutoff',
      name: 'Cutoff',
      // Where the knobs have the filter: the cutoff across, and Q as the
      // height it gives a low or a high pass at the cutoff.
      x: xOfHz(view.value('cutoffHz'), box),
      y: yOfDb(20 * Math.log10(view.value('resonance')), box, AUTO_TOP_DB, AUTO_FOOT_DB),
      drag: (x, y) => ({
        cutoffHz: clamp(hzOfX(x, box), hzMin, hzMax),
        resonance: clamp(Math.pow(10, dbOfY(y, box, AUTO_TOP_DB, AUTO_FOOT_DB) / 20), qMin, qMax),
      }),
      reset: () => ({
        cutoffHz: startOf(view, 'cutoffHz', 1000),
        resonance: startOf(view, 'resonance', Math.SQRT1_2),
      }),
    },
  ]
}

const autoFilter = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['type', 'slope', 'cutoffHz', 'resonance', 'envAmount', 'lfoAmount', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'The curve of the filter where it stands now, moving as the envelope and the LFO move it, over the spectrum of what comes out; the shaded span is how far they can take the cutoff. The point is where the knobs have it: across is the cutoff, up and down the resonance. What Drive adds is not drawn.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const box = curveBox(frame)
    const zero = yOfDb(0, box, AUTO_TOP_DB, AUTO_FOOT_DB)
    const set = frame.value('cutoffHz')
    const [low, high] = autoFilterSweep(set, frame.value('envAmount'), frame.value('lfoAmount'))
    const swept = high > low
    // Where the filter stands is the device's to say: its own reading of the
    // cutoff after the envelope and the LFO. At rest it is where the knob has it.
    const reading = frame.meter('cutoff')
    const moving = swept && frame.signal !== null && frame.powered && reading > 0
    const now = moving ? clamp(reading, AUTO_MIN_HZ, AUTO_MAX_HZ) : set
    const response = autoFilterDb(autoSetting(frame), now, frame.sampleRate)

    freqGrid(frame, box)
    dbGrid(frame, box, AUTO_TOP_DB, AUTO_FOOT_DB, 12)
    if (swept) {
      // The span the cutoff can be taken over.
      const from = xOfHz(low, box)
      const to = xOfHz(high, box)
      fillRect(ctx, { x: from, y: box.y, w: to - from, h: box.h }, colours.ink, INK.fill * 0.75)
    }
    clipped(ctx, box, () => {
      spectrum(frame, box, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.5 })
      curve(frame, responseThrough(box, response, AUTO_TOP_DB, AUTO_FOOT_DB, [now]), zero)
    })
    const [point] = autoFilterHandles(frame)
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (moving) {
      // The cutoff now, riding the curve.
      dot(
        ctx,
        xOfHz(now, box),
        clamp(yOfDb(response(now), box, AUTO_TOP_DB, AUTO_FOOT_DB), box.y, box.y + box.h),
        2.5,
        colours.accent,
        { ring: colours.ink },
      )
    }
    if (frame.hot === point.key) {
      const words = `${hzText(set)}  ${qText(frame.value('resonance'))}`
      captions(frame, box, [point], [{ words, side: 'left' }])
    }
  },
  handles: autoFilterHandles,
})

export const EQ_FACES: Readonly<Record<string, PlateFace>> = {
  'parametric-eq': {
    display: parametricEq,
    face: ['lowCut', 'highCut'],
  },
  filter: {
    display: filter,
    face: ['type', 'q'],
  },
  eq3: {
    display: eq3,
    face: ['midFreq', 'midQ'],
  },
  'ambient-eq': {
    display: ambientEq,
    face: ['clear', 'clearTime'],
  },
  'auto-filter': {
    display: autoFilter,
    face: ['type', 'envAmount', 'lfoAmount', 'lfoRateHz'],
    // "Env Amount" and "LFO Amount" take two lines, and the second stands
    // against the knob below; the one word says which of the two moves the cutoff.
    labels: { envAmount: 'Env', lfoAmount: 'LFO' },
  },
}
