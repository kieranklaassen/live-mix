// The display of Spread (`cpp/devices/spread/spread.h`): width by frequency.
// Frequency runs across and width upward. The line is the gain the device
// gives the sides at each frequency, worked out from the same three region
// split the sound goes through; the bars behind it are how wide the sound
// coming out is in each band, the sides against the middle, taken from the
// two sides the plate hears. Three points set the regions' widths and two set
// the splits.

import {
  INK,
  clamp,
  clipped,
  fillBetween,
  fillRect,
  follow,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
  rule,
  trace,
  xOfHz,
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

// --- The curve, as `spread.h` makes it ----------------------------------------

/** `kSpreadOctaves`: how far each stage stands from the split at Slope 0. */
export const SPREAD_STAGE_OCTAVES = 1
/** `kTopOfRange`: no stage is tuned above this share of the sample rate. */
export const SPREAD_TOP_OF_RANGE = 0.45

/** The six settings the curve is made from, in the parameters' own units. */
export interface SpreadCurve {
  low: number
  mid: number
  high: number
  lowHz: number
  highHz: number
  slope: number
}

type Complex = readonly [number, number]

const mul = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
]

/** The low, band (times k) and high outputs of a Butterworth state variable filter at `corner`, heard at `hz`. */
function split(hz: number, corner: number, sampleRate: number): [Complex, Complex, Complex] {
  const tuned = Math.min(corner, SPREAD_TOP_OF_RANGE * sampleRate)
  // The filter is the bilinear transform of its analogue: frequencies are warped by the tangent.
  const w =
    Math.tan((Math.PI * Math.min(hz, 0.499 * sampleRate)) / sampleRate) /
    Math.tan((Math.PI * tuned) / sampleRate)
  const re = 1 - w * w
  const im = Math.SQRT2 * w
  const inverse = 1 / (re * re + im * im)
  const lp: Complex = [re * inverse, -im * inverse]
  return [lp, mul([0, im], lp), [-w * w * lp[0], -w * w * lp[1]]]
}

/** One stage of the curve: `Stage::process`, with l, m and h the square roots of the widths. */
function stage(
  hz: number,
  lowHz: number,
  highHz: number,
  l: number,
  m: number,
  h: number,
  sampleRate: number,
): Complex {
  const [lpA, bpA, hpA] = split(hz, lowHz, sampleRate)
  const [lpB, bpB, hpB] = split(hz, highHz, sampleRate)
  const lm = Math.sqrt(l * m)
  const mh = Math.sqrt(m * h)
  const rest = Math.cbrt(l * m * h)
  const shelf: Complex = [
    l * lpA[0] + lm * bpA[0] + m * hpA[0],
    l * lpA[1] + lm * bpA[1] + m * hpA[1],
  ]
  const low = mul(lpB, shelf)
  const high = mul(hpA, [mh * bpB[0] + h * hpB[0], mh * bpB[1] + h * hpB[1]])
  const left = mul([lpA[0] + bpA[0], lpA[1] + bpA[1]], [bpB[0] + hpB[0], bpB[1] + hpB[1]])
  return [low[0] + high[0] + rest * left[0], low[1] + high[1] + rest * left[1]]
}

/** The gain the device gives the sides at `hz`: 0 is mono there, 1 as it came, 2 twice as wide. */
export function spreadGain(hz: number, set: SpreadCurve, sampleRate: number): number {
  const apart = Math.pow(2, SPREAD_STAGE_OCTAVES * (1 - set.slope))
  const l = Math.sqrt(Math.max(0, set.low))
  const m = Math.sqrt(Math.max(0, set.mid))
  const h = Math.sqrt(Math.max(0, set.high))
  const one = stage(hz, set.lowHz / apart, set.highHz / apart, l, m, h, sampleRate)
  const two = stage(hz, set.lowHz * apart, set.highHz * apart, l, m, h, sampleRate)
  const both = mul(one, two)
  return Math.hypot(both[0], both[1])
}

/**
 * What Make at 1 puts beside a mono sound at `hz`, its sides against its
 * middle: the same curve for what each width has over 1 (`aim` in `spread.h`).
 */
export function spreadMade(hz: number, set: SpreadCurve, sampleRate: number): number {
  return spreadGain(
    hz,
    {
      ...set,
      low: Math.max(0, set.low - 1),
      mid: Math.max(0, set.mid - 1),
      high: Math.max(0, set.high - 1),
    },
    sampleRate,
  )
}

/** The curve's settings as a view has them. */
export function spreadCurveOf(view: Pick<DisplayView, 'value'>): SpreadCurve {
  return {
    low: view.value('low'),
    mid: view.value('mid'),
    high: view.value('high'),
    lowHz: view.value('lowHz'),
    highHz: view.value('highHz'),
    slope: view.value('slope'),
  }
}

// --- How wide the sound is, band by band -----------------------------------------

/** Bands a third of an octave wide, the first centred on 40 Hz and the last on 12.7 kHz. */
export const SPREAD_BANDS = 26
const BAND_FIRST_HZ = 40
/** Under this power (a tone of -70 dBFS) a band holds nothing to measure. */
const BAND_FLOOR = 1e-7

/** The edges of band `n`, in Hz. */
export function spreadBand(n: number): [number, number] {
  const centre = BAND_FIRST_HZ * Math.pow(2, n / 3)
  return [centre / Math.pow(2, 1 / 6), centre * Math.pow(2, 1 / 6)]
}

/** What the display keeps between frames. */
interface SpreadState {
  /** Work space for the transform: the middle in the real part, the sides in the imaginary. */
  re: Float32Array
  im: Float32Array
  /** Each band's width as drawn, and how much of a sound there is in it (0 to 1). */
  width: Float32Array
  lit: Float32Array
  /** What was measured on the last frame, before it is smoothed. */
  measured: Float32Array
  power: Float32Array
}

/** An in-place radix-2 transform of `re + i·im`, `re.length` a power of two. */
function transform(re: Float32Array, im: Float32Array): void {
  const size = re.length
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const r = re[i]
      re[i] = re[j]
      re[j] = r
      const m = im[i]
      im[i] = im[j]
      im[j] = m
    }
  }
  for (let span = 2; span <= size; span <<= 1) {
    const turn = (-2 * Math.PI) / span
    const stepRe = Math.cos(turn)
    const stepIm = Math.sin(turn)
    for (let start = 0; start < size; start += span) {
      let wRe = 1
      let wIm = 0
      for (let k = 0; k < span >> 1; k++) {
        const a = start + k
        const b = a + (span >> 1)
        const tRe = re[b] * wRe - im[b] * wIm
        const tIm = re[b] * wIm + im[b] * wRe
        re[b] = re[a] - tRe
        im[b] = im[a] - tIm
        re[a] += tRe
        im[a] += tIm
        const next = wRe * stepRe - wIm * stepIm
        wIm = wRe * stepIm + wIm * stepRe
        wRe = next
      }
    }
  }
}

/**
 * The sides against the middle in each band of one window of sound: `width[n]`
 * is their ratio as levels (0 for a mono sound, 1 where the sides are as loud
 * as the middle) and `power[n]` the band's power, middle and sides together
 * (1 for a full-scale tone). One transform does both: the middle is its real
 * part and the sides its imaginary part, and the two spectra are told apart by
 * the bins that mirror each other.
 */
export function spreadWidths(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  state: Pick<SpreadState, 're' | 'im' | 'measured' | 'power'>,
): void {
  const { re, im, measured, power } = state
  const size = re.length
  const from = Math.max(0, Math.min(left.length, right.length) - size)
  for (let i = 0; i < size; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size)
    const l = left[from + i] ?? 0
    const r = right[from + i] ?? 0
    re[i] = hann * 0.5 * (l + r)
    im[i] = hann * 0.5 * (l - r)
  }
  transform(re, im)
  // A full-scale tone on a bin reads size/4 there and half that beside it: 1 as a power.
  const scale = 16 / (1.5 * size * size)
  const binHz = sampleRate / size
  for (let n = 0; n < SPREAD_BANDS; n++) {
    const [lowHz, highHz] = spreadBand(n)
    let first = Math.ceil(lowHz / binHz)
    let last = Math.ceil(highHz / binHz) - 1
    // A band narrower than a bin takes the bin nearest its centre.
    if (last < first) first = last = Math.round(Math.sqrt(lowHz * highHz) / binHz)
    first = Math.max(1, first)
    last = Math.min(size / 2 - 1, Math.max(first, last))
    let middle = 0
    let sides = 0
    for (let k = first; k <= last; k++) {
      const aRe = re[k]
      const aIm = im[k]
      const bRe = re[size - k]
      const bIm = im[size - k]
      // M[k] = (Z[k] + conj Z[-k]) / 2 and S[k] = (Z[k] - conj Z[-k]) / 2i.
      middle += 0.25 * ((aRe + bRe) * (aRe + bRe) + (aIm - bIm) * (aIm - bIm))
      sides += 0.25 * ((aRe - bRe) * (aRe - bRe) + (aIm + bIm) * (aIm + bIm))
    }
    power[n] = (middle + sides) * scale
    measured[n] = middle > 0 ? Math.sqrt(sides / middle) : sides > 0 ? Infinity : 0
  }
}

// --- The picture -----------------------------------------------------------------

/** The width scale runs a little past 0 and 2, so a point at the end of its travel is whole. */
export const SPREAD_TOP_WIDTH = 2.2
export const SPREAD_FOOT_WIDTH = -0.2
/** The bars come up at once and sink slowly, as a meter does. */
const BAR_RISE_SEC = 0.06
const BAR_FALL_SEC = 0.5
/** Safe holding by less than this is not drawn. */
const HELD_LEAST_DB = -0.1

export const spreadBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})

/** Where a width stands in the box: 2 near the top, 0 near the foot. */
export function spreadY(width: number, box: Box): number {
  return box.y + ((SPREAD_TOP_WIDTH - width) / (SPREAD_TOP_WIDTH - SPREAD_FOOT_WIDTH)) * box.h
}

export function spreadWidthOfY(y: number, box: Box): number {
  return SPREAD_TOP_WIDTH - ((y - box.y) / box.h) * (SPREAD_TOP_WIDTH - SPREAD_FOOT_WIDTH)
}

/** A curve across the box as points, one every second pixel and one on each split. */
function curvePoints(
  box: Box,
  set: SpreadCurve,
  sampleRate: number,
  scale = 1,
  gain: typeof spreadGain = spreadGain,
): Point[] {
  const points: Point[] = []
  const at = (x: number): Point => [x, spreadY(scale * gain(hzOfX(x, box), set, sampleRate), box)]
  for (let x = 0; x <= box.w; x += 2) points.push(at(box.x + x))
  for (const hz of [set.lowHz, set.highHz]) {
    const x = xOfHz(hz, box)
    const after = points.findIndex((point) => point[0] > x)
    points.splice(after === -1 ? points.length : after, 0, at(x))
  }
  return points
}

type Region = 'low' | 'mid' | 'high'
const REGION_NAMES: Readonly<Record<Region, string>> = { low: 'Low', mid: 'Mid', high: 'High' }

/** Where a parameter starts, or `fallback` for a name the device lacks. */
const startOf = (view: DisplayView, param: string, fallback: number): number =>
  view.spec(param)?.default ?? fallback

function rangeOf(view: DisplayView, param: string, fallback: [number, number]): [number, number] {
  const spec = view.spec(param)
  return spec ? [spec.min, spec.max] : fallback
}

/**
 * The handles are asked for without the frame, so without the sample rate: a
 * split's point is then placed by the curve at 48 kHz. Drawn, it stands on the
 * curve of the rate the device runs at, which lies within a pixel of it.
 */
const SPLIT_RATE = 48000

function spreadHandles(view: DisplayView, sampleRate = SPLIT_RATE): DisplayHandle[] {
  const box = spreadBox(view)
  const set = spreadCurveOf(view)
  // A region's point stands in the middle of its region, at the width it is set to.
  const middles: Readonly<Record<Region, number>> = {
    low: Math.sqrt(20 * set.lowHz),
    mid: Math.sqrt(set.lowHz * set.highHz),
    high: Math.sqrt(set.highHz * 20000),
  }
  const region = (key: Region): DisplayHandle => {
    const [min, max] = rangeOf(view, key, [0, 2])
    return {
      key,
      name: REGION_NAMES[key],
      x: xOfHz(middles[key], box),
      y: spreadY(set[key], box),
      drag: (_x, y) => ({ [key]: clamp(spreadWidthOfY(y, box), min, max) }),
      reset: () => ({ [key]: startOf(view, key, 1) }),
    }
  }
  // A split's point stands on the curve at the split and moves across; the wheel sets the slope.
  const splitPoint = (key: 'lowHz' | 'highHz', name: string): DisplayHandle => {
    const [min, max] = rangeOf(view, key, key === 'lowHz' ? [40, 800] : [1000, 12000])
    const [slopeMin, slopeMax] = rangeOf(view, 'slope', [0, 1])
    return {
      key,
      name,
      x: xOfHz(set[key], box),
      y: spreadY(clamp(spreadGain(set[key], set, sampleRate), 0, 2), box),
      drag: (x) => ({ [key]: clamp(hzOfX(x, box), min, max) }),
      wheel: (steps) => ({ slope: clamp(set.slope + 0.1 * steps, slopeMin, slopeMax) }),
      reset: () => ({ [key]: startOf(view, key, set[key]) }),
    }
  }
  return [
    region('low'),
    splitPoint('lowHz', 'Low split'),
    region('mid'),
    splitPoint('highHz', 'High split'),
    region('high'),
  ]
}

/** Hear the two sides and move each band's bar towards what was measured. False when there is nothing to hear. */
function listen(frame: DisplayFrame<SpreadState>): boolean {
  const { state, dt } = frame
  const left = frame.signal?.left
  const right = frame.signal?.right
  if (!frame.powered || !left || !right) {
    state.lit.fill(0)
    return false
  }
  spreadWidths(left.wave, right.wave, frame.sampleRate, state)
  for (let n = 0; n < SPREAD_BANDS; n++) {
    const sounding = state.power[n] > BAND_FLOOR
    const target = clamp(state.measured[n], 0, SPREAD_TOP_WIDTH)
    if (dt <= 0) {
      // A still draw, or the first frame: the bars stand where the sound is.
      state.lit[n] = sounding ? 1 : 0
      if (sounding) state.width[n] = target
      continue
    }
    // A band that was dark starts at what it measures; one that is lit moves to it.
    if (sounding)
      state.width[n] =
        state.lit[n] > 0 ? follow(state.width[n], target, dt, BAR_RISE_SEC, BAR_FALL_SEC) : target
    state.lit[n] = follow(state.lit[n], sounding ? 1 : 0, dt, BAR_RISE_SEC, BAR_FALL_SEC)
  }
  return true
}

/** The corners words can stand in, as [left end, baseline, alignment]. */
type Corner = 'head left' | 'head right' | 'foot left' | 'foot right'

/** Put words in the first of `corners` that has no point under it and is not `taken`; says which it took. */
function wordsAt(
  frame: DisplayFrame<SpreadState>,
  box: Box,
  points: readonly { x: number; y: number }[],
  words: string,
  corners: readonly Corner[],
  taken: readonly Corner[] = [],
): Corner | null {
  frame.ctx.font = `8px ${frame.fontFamily}`
  const wide = frame.ctx.measureText(words).width
  for (const corner of corners) {
    if (taken.includes(corner)) continue
    const left = corner.endsWith('left')
    const head = corner.startsWith('head')
    const from = left ? box.x + 2 : box.x + box.w - 2 - wide
    const free = points.every(
      (point) =>
        point.x < from - 6 ||
        point.x > from + wide + 6 ||
        (head ? point.y > box.y + 17 : point.y < box.y + box.h - 17),
    )
    if (!free) continue
    label(
      frame,
      words,
      left ? box.x + 2 : box.x + box.w - 2,
      head ? box.y + 8 : box.y + box.h - 3,
      left ? 'left' : 'right',
    )
    return corner
  }
  return null
}

/** A width as it is said: "mono" at nothing, else the gain on the sides. */
const widthText = (width: number): string => (width < 0.005 ? 'mono' : `×${width.toFixed(2)}`)

const spread = plateDisplay<SpreadState>({
  place: 'window',
  columns: 1,
  params: ['low', 'mid', 'high', 'lowHz', 'highHz', 'slope', 'make'],
  live: { meters: true, stereo: true },
  info: 'Frequency runs across and width up. The line is the width each part of the sound is given; the bars are how wide the sound coming out is there, its sides against its middle. Drag a point up or down for a region, across for a split, and turn the wheel on a split for the slope. Dashed: what Make adds.',
  init: () => ({
    re: new Float32Array(2048),
    im: new Float32Array(2048),
    width: new Float32Array(SPREAD_BANDS),
    lit: new Float32Array(SPREAD_BANDS),
    measured: new Float32Array(SPREAD_BANDS),
    power: new Float32Array(SPREAD_BANDS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = spreadBox(frame)
    const set = spreadCurveOf(frame)
    const right = box.x + box.w
    const zero = spreadY(0, box)
    const one = spreadY(1, box)
    freqGrid(frame, box)
    // Mono at the foot, twice as wide at the top, and as it came between them.
    rule(ctx, box.x, zero, right, zero, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, box.x, spreadY(2, box), right, spreadY(2, box), {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, box.x, one, right, one, { colour: colours.ink, alpha: INK.rule })
    const running = listen(frame)
    const held = running && frame.hasMeter('held') ? Math.min(0, frame.meter('held')) : 0
    clipped(ctx, box, () => {
      // The sound, in the accent: what is happening. A lit band with no sides is a line on the foot.
      if (running)
        for (let n = 0; n < SPREAD_BANDS; n++) {
          if (state.lit[n] < 0.02) continue
          const [lowHz, highHz] = spreadBand(n)
          const x = xOfHz(lowHz, box)
          const y = Math.min(spreadY(state.width[n], box), zero - 1.5)
          fillRect(
            ctx,
            { x: x + 0.5, y, w: xOfHz(highHz, box) - x - 1, h: zero - y },
            colours.accent,
            0.6 * state.lit[n],
          )
        }
      // The curve, in the ink: what is set. Filled to the line where nothing is changed.
      const points = curvePoints(box, set, frame.sampleRate)
      fillBetween(
        ctx,
        points,
        [
          [box.x, one],
          [right, one],
        ],
        colours.ink,
        INK.fill,
      )
      // What Make puts beside a mono sound, its sides against its middle: only where a region is over 1.
      const make = frame.value('make')
      if (make > 0 && Math.max(set.low, set.mid, set.high) > 1)
        trace(ctx, curvePoints(box, set, frame.sampleRate, make, spreadMade), {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
          dash: [2, 2],
        })
      trace(ctx, points, { colour: colours.ink })
      // Safe at work: the curve as the sides get it now, held down by what the device reports.
      if (held < HELD_LEAST_DB)
        trace(ctx, curvePoints(box, set, frame.sampleRate, Math.pow(10, held / 20)), {
          colour: colours.accent,
          width: 1,
        })
    })
    const handles = spreadHandles(frame, frame.sampleRate)
    // The point in hand, in words, on the side away from it; then the scale in two words, where there is room.
    const taken: Corner[] = []
    const hot = handles.find((point) => point.key === frame.hot)
    if (hot) {
      const words =
        hot.key === 'lowHz' || hot.key === 'highHz'
          ? `${hot.name}  ${hzText(set[hot.key])}`
          : `${hot.name}  ${widthText(set[hot.key as Region])}`
      const away: readonly Corner[] =
        hot.x > box.x + box.w / 2
          ? ['head left', 'foot left', 'head right', 'foot right']
          : ['head right', 'foot right', 'head left', 'foot left']
      const took = wordsAt(frame, box, handles, words, away)
      if (took) taken.push(took)
    }
    for (const [words, corner] of [
      ['wide', 'head right'],
      ['mono', 'foot right'],
    ] as const)
      wordsAt(frame, box, handles, words, [corner], taken)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: (view) => spreadHandles(view),
})

export const SPREAD_FACES: Readonly<Record<string, PlateFace>> = {
  spread: {
    display: spread,
    face: ['high', 'make'],
  },
}
