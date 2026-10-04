// Displays of the devices that shape the spectrum: the curve the device is
// set to, drawn from the same filters the sound goes through, over the
// spectrum of what comes out of it.

import {
  INK,
  biquad,
  biquadDb,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dbText,
  fillTo,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  responsePoints,
  spectrum,
  text,
  trace,
  xOfHz,
  yOfDb,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
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

export const EQ_FACES: Readonly<Record<string, PlateFace>> = {
  'parametric-eq': {
    display: parametricEq,
    face: ['lowCut', 'highCut'],
  },
}
