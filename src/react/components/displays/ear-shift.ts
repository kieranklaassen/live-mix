// The display of Ear Shift: a band of the sound moved up by half of Beat in the
// left ear and down by half of Beat in the right. Above, a frequency axis: how
// much of each frequency is shifted, a hump between Low and High whose two
// rings set them, with the two edges written under it. In the middle, a note
// well inside the band as each ear gets it, on a scale of hertz either side of
// the note that is stretched near the middle so that a quarter of a hertz can
// be seen: the left ear's copy stands above the note and the right ear's below
// it by the hertz written, and beside each stands the other ear's copy as tall
// as Ears lets it in. Below, a time axis a few beats long: the level of that
// note in each ear, over the level the two ears make together, which is what a
// mono fold or two speakers give.
//
// Nothing here moves. The device reports no readings, so the picture is drawn
// from the controls alone and stands still at every Beat: the beat is a shape
// over time, never a light that goes on and off.
//
// Everything is the device's own arithmetic: the shift and the ears are
// `cpp/devices/ear-shift/ear_shift.h` with `kit::ear_gains` of `cpp/kit/beat.h`,
// the split is `cpp/kit/band.h` (`ThreeBand`) on the sections of
// `cpp/kit/filters.h` (`Svf`).

import {
  INK,
  clamp,
  fillRect,
  fillTo,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  rule,
  text,
  trace,
  xOfHz,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's numbers (`ear_shift.h`, `beat.h`, `band.h`, `filters.h`) -----

/** `kit::ThreeBand::kLeastHz`: the lowest the lower edge is held to. */
const LEAST_HZ = 20
/** `kit::ThreeBand::kMargin`: High is held at least half an octave over Low. */
export const EAR_SHIFT_MARGIN = 1.41421356
/** `kit::ThreeBand::kMostOfRate`: both edges stay under this share of the sample rate. */
const MOST_OF_RATE = 0.45
/** `Svf::set`: a section is tuned no lower than this, and no higher than 0.49 of the sample rate. */
const SECTION_LEAST_HZ = 5
const SECTION_MOST_OF_RATE = 0.49

/** `kit::ThreeBand::set`: where the two edges end up, High at least half an octave over Low. */
export function earShiftEdges(
  low: number,
  high: number,
  sampleRate = 48000,
): { low: number; high: number } {
  const top = MOST_OF_RATE * sampleRate
  const held = clamp(low, LEAST_HZ, top / EAR_SHIFT_MARGIN)
  return { low: held, high: clamp(high, held * EAR_SHIFT_MARGIN, top) }
}

/** `tan_prewarp`: the tangent as the kit works it out, a ratio of two polynomials up to 0.7 and the true one above. */
function tanPrewarp(x: number): number {
  if (x > 0.7) return Math.tan(x)
  const x2 = x * x
  return (x * (15 - x2)) / (15 - 6 * x2)
}

/** `Svf::set`: the section's `g` for a crossover, with the frequency held as the section holds it. */
const sectionG = (hz: number, sampleRate: number): number =>
  tanPrewarp(
    (Math.PI * clamp(hz, SECTION_LEAST_HZ, SECTION_MOST_OF_RATE * sampleRate)) / sampleRate,
  )

/**
 * `kit::ThreeBand::process` as a response: how much of a tone at `hz` goes
 * through the shifter, 0 to 1. Each crossover is two sections of Q 0.7071 in a
 * row, so with w the tone against the crossover as the sections warp it the
 * high pass passes w to the fourth over 1 + w to the fourth and the low pass 1
 * over that; the band is the lower crossover's high pass through the upper
 * one's low pass. The three parts are in phase and add up to 1, so the rest
 * of the tone, 1 less this, passes unshifted: on an edge a tone is half
 * shifted, half an octave inside four fifths.
 */
export function earShiftBandShare(
  hz: number,
  low: number,
  high: number,
  sampleRate = 48000,
): number {
  const tone = Math.tan((Math.PI * clamp(hz, 0, 0.499 * sampleRate)) / sampleRate)
  const wl = (tone / sectionG(low, sampleRate)) ** 4
  const wh = (tone / sectionG(high, sampleRate)) ** 4
  return wl / (1 + wl) / (1 + wh)
}

/**
 * `EarShift::apply(kBeat)`: the clock turns at half of Beat, and the left ear's
 * band is moved up by that many hertz and the right ear's down. In hertz from
 * where the note was.
 */
export function earShiftHertz(beat: number): { left: number; right: number } {
  return { left: 0.5 * beat, right: -0.5 * beat }
}

/** `kit::ear_gains`: how much of an ear is its own copy, and how much the other ear's. */
export function earShiftShares(ears: number): { same: number; other: number } {
  const e = clamp(ears, 0, 1)
  return { same: 0.5 + 0.5 * e, other: 0.5 - 0.5 * e }
}

/**
 * `EarShift::process`: the level of a tone in one ear, `beats` after the clock
 * stood at its crest, 1 being the tone as it came. The band's part of it is
 * I cos θ ± Ears Q sin θ with θ half a turn a beat, and the rest of it,
 * 1 less `share`, passes beside that in phase. The two ears have the same
 * level; what differs between them is which way the phase turns. With the
 * whole tone in the band it is level at Ears 1 and falls to nothing once a
 * beat at Ears 0.
 */
export function earShiftEarLevel(beats: number, ears: number, share = 1): number {
  const turn = Math.PI * beats
  const e = clamp(ears, 0, 1)
  return Math.hypot(1 - share + share * Math.cos(turn), share * e * Math.sin(turn))
}

/**
 * The level of the two ears together (a mono fold, or two speakers in the
 * air): the mid of `EarShift::process` is the rest and I cos θ at every Ears,
 * so a tone in the band falls to nothing once a beat whatever Ears says.
 */
export function earShiftFoldLevel(beats: number, share = 1): number {
  return Math.abs(1 - share + share * Math.cos(Math.PI * beats))
}

/** The device's knobs as it applies them. */
export interface EarShiftSettings {
  beat: number
  ears: number
  /** The band's edges as the split holds them. */
  low: number
  high: number
}

export function earShiftSettings(
  value: (name: string) => number,
  sampleRate = 48000,
): EarShiftSettings {
  const edges = earShiftEdges(value('low'), value('high'), sampleRate)
  return { beat: value('beat'), ears: clamp(value('ears'), 0, 1), low: edges.low, high: edges.high }
}

// --- The words ------------------------------------------------------------------

/** A shift as it is written: "+3 Hz", "−0.25 Hz", "+12.5 Hz", with a real minus. */
export function earShiftHertzText(hz: number): string {
  const size = Math.abs(hz)
  const digits = size >= 10 ? 1 : 2
  const figure = size.toFixed(digits).replace(/\.?0+$/, '')
  return `${hz < 0 ? '−' : '+'}${figure} Hz`
}

/** The lengths of time the time axis may show, in seconds. */
const SPANS = [0.05, 0.1, 0.2, 0.5, 1, 2, 4] as const
/** The time axis shows at least this many whole beats. */
const SHOWN_BEATS = 2

/** How long a time the time axis shows: the shortest of the round ones that holds two beats, so two to five stand across. */
export function earShiftSpan(beat: number): number {
  for (const span of SPANS) if (span * beat >= SHOWN_BEATS - 1e-9) return span
  return SPANS[SPANS.length - 1]
}

/** A span as it is written: "50 ms", "500 ms", "2 s". */
export const earShiftSpanText = (seconds: number): string =>
  seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${Math.round(seconds)} s`

// --- Where things stand -------------------------------------------------------

/** The frequency axis: equal octaves from 30 Hz to 4 kHz, an octave under the lowest Low and over the highest High. */
export const EAR_SHIFT_MIN_HZ = 30
export const EAR_SHIFT_MAX_HZ = 4000
/** The scale of the middle picture reaches this many hertz either side of the note: half of the fastest Beat. */
export const EAR_SHIFT_REACH_HZ = 20
/** And is stretched near the note: even steps up to about this many hertz, equal steps for equal ratios well beyond. */
const SCALE_KNEE_HZ = 0.5
/** The hertz marked on that scale, either side of the note. */
export const EAR_SHIFT_SCALE_MARKS = [1, 10, 20] as const

export interface EarShiftLayout {
  /** The frequency axis: its top is a tone wholly shifted, its foot one not shifted at all. */
  plot: Box
  /** The line the two edges are written on, and the two ends of every line of words. */
  base: number
  left: number
  right: number
  /** The note as each ear gets it: the scale's two ends, the lines the two ears stand on and how tall a whole copy is. */
  scale: { x: number; w: number }
  leftFoot: number
  rightFoot: number
  tall: number
  /** The time axis: its top is the tone as it came, its foot silence. */
  time: Box
}

/** Laid out from the size it is given: the frequency axis above, the two ears in the middle, the time axis below. */
export function earShiftLayout(view: Pick<DisplayView, 'width' | 'height'>): EarShiftLayout {
  const { width, height } = view
  const left = 6
  const right = width - 6
  const plot: Box = {
    x: left,
    y: 7,
    w: Math.max(8, right - left),
    h: Math.max(12, Math.round(height * 0.24)),
  }
  const base = plot.y + plot.h + 10
  // The words of the lower half stand in a column at the left: "L +0.25 Hz" is the longest.
  const column = 48
  const across = { x: left + column, w: Math.max(8, right - left - column) }
  const timeTall = Math.max(10, Math.round(height * 0.18))
  const time: Box = { x: across.x, y: height - 6 - timeTall, w: across.w, h: timeTall }
  const top = base + 4
  const tall = Math.max(4, Math.floor((time.y - 5 - top - 2) / 2))
  return {
    plot,
    base,
    left,
    right,
    scale: across,
    leftFoot: top + tall + 0.5,
    rightFoot: top + 2 * tall + 2.5,
    tall,
    time,
  }
}

/** How high a share of a tone stands on the frequency axis. */
export const earShiftShareY = (share: number, plot: Box): number =>
  plot.y + (1 - clamp(share, 0, 1)) * plot.h

/** How much of each frequency is shifted, as a line across the frequency axis. */
export function earShiftCurvePoints(
  set: EarShiftSettings,
  layout: EarShiftLayout,
  sampleRate = 48000,
): Point[] {
  const { plot } = layout
  const count = Math.max(2, Math.ceil(plot.w / 1.5))
  const points: Point[] = []
  for (let i = 0; i <= count; i++) {
    const x = plot.x + (i / count) * plot.w
    const hz = hzOfX(x, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
    points.push([x, earShiftShareY(earShiftBandShare(hz, set.low, set.high, sampleRate), plot)])
  }
  return points
}

/**
 * Where so many hertz above the note (or below it) stand on the middle
 * picture's scale: the note in the middle, `EAR_SHIFT_REACH_HZ` at either end,
 * and equal steps for equal ratios once well away from the note, so that a
 * quarter of a hertz and twenty are both told from the note.
 */
export function earShiftScaleX(hz: number, layout: EarShiftLayout): number {
  const { scale } = layout
  const size = Math.min(Math.abs(hz), EAR_SHIFT_REACH_HZ)
  const out = Math.log(1 + size / SCALE_KNEE_HZ) / Math.log(1 + EAR_SHIFT_REACH_HZ / SCALE_KNEE_HZ)
  return scale.x + 0.5 * scale.w + Math.sign(hz) * out * (0.5 * scale.w - 3)
}

/** One copy of the note in one ear: where it stands on the scale, how many hertz from the note, and how much of the ear it is. */
export interface EarShiftCopy {
  ear: 'left' | 'right'
  hz: number
  share: number
  x: number
  /** The line it stands on, and its top. */
  foot: number
  top: number
}

/**
 * The note as each ear gets it: its own copy (up in the left ear, down in the
 * right) and the other ear's, each as tall as its share of the ear. At Ears 1
 * an ear has its own copy alone; at Ears 0 both ears have both at half, which
 * is one beat in the air.
 */
export function earShiftCopies(set: EarShiftSettings, layout: EarShiftLayout): EarShiftCopy[] {
  const hertz = earShiftHertz(set.beat)
  const { same, other } = earShiftShares(set.ears)
  const copy = (ear: 'left' | 'right', hz: number, share: number): EarShiftCopy => {
    const foot = ear === 'left' ? layout.leftFoot : layout.rightFoot
    return { ear, hz, share, x: earShiftScaleX(hz, layout), foot, top: foot - share * layout.tall }
  }
  return [
    copy('left', hertz.left, same),
    copy('left', hertz.right, other),
    copy('right', hertz.right, same),
    copy('right', hertz.left, other),
  ]
}

/** How high a level stands on the time axis: the tone as it came along the top, silence along the foot. */
export const earShiftLevelY = (level: number, time: Box): number =>
  time.y + (1 - clamp(level, 0, 1)) * time.h

/**
 * A level over the time the time axis shows, as a line: read about every
 * pixel and a half, and at every crest and every null of the beat so that a
 * null reaches the foot. The clock stands at a crest at the left end.
 */
function timePoints(
  set: EarShiftSettings,
  layout: EarShiftLayout,
  level: (beats: number) => number,
): Point[] {
  const { time } = layout
  const beats = earShiftSpan(set.beat) * set.beat
  const count = Math.max(2, Math.ceil(time.w / 1.5))
  const reads: number[] = []
  for (let i = 0; i <= count; i++) reads.push((i / count) * beats)
  for (let half = 1; half < 2 * beats; half++) reads.push(0.5 * half)
  reads.sort((a, b) => a - b)
  // A crest or a null that an even reading already fell on is read once.
  const once = reads.filter((at, i) => i === 0 || at - reads[i - 1] > 1e-9)
  return once.map((at): Point => [time.x + (at / beats) * time.w, earShiftLevelY(level(at), time)])
}

/** The level of a note well inside the band in each ear, over the time the time axis shows. */
export const earShiftEarPoints = (set: EarShiftSettings, layout: EarShiftLayout): Point[] =>
  timePoints(set, layout, (beats) => earShiftEarLevel(beats, set.ears))

/** The level the two ears make together, over the same time. */
export const earShiftFoldPoints = (set: EarShiftSettings, layout: EarShiftLayout): Point[] =>
  timePoints(set, layout, (beats) => earShiftFoldLevel(beats))

// --- The points ---------------------------------------------------------------

/** The sample rate a frame knows; a view that is no frame is read at 48 kHz. */
const rateOf = (view: DisplayView): number => {
  const rate = (view as { sampleRate?: number }).sampleRate
  return typeof rate === 'number' && rate > 0 ? rate : 48000
}

/**
 * Two points: Low and High, the rings on the line of the frequency axis at
 * the two edges of the band, each moved across. High stands where the split
 * holds it, half an octave over Low at the least.
 */
function earShiftHandles(view: DisplayView): DisplayHandle[] {
  const layout = earShiftLayout(view)
  const sampleRate = rateOf(view)
  const set = earShiftSettings((name) => view.value(name), sampleRate)
  const { plot } = layout
  const edge = (key: 'low' | 'high', name: string, held: number): DisplayHandle => {
    const spec = view.spec(key)
    const value = view.value(key)
    const x = xOfHz(held, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
    return {
      key,
      name,
      x,
      y: earShiftShareY(earShiftBandShare(held, set.low, set.high, sampleRate), plot),
      drag: (toX) => ({
        [key]:
          Math.abs(toX - x) < 1e-6
            ? value
            : clamp(
                hzOfX(toX, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ),
                spec?.min ?? held,
                spec?.max ?? held,
              ),
      }),
      reset: () => ({ [key]: spec?.default ?? value }),
    }
  }
  return [edge('low', 'Low', set.low), edge('high', 'High', set.high)]
}

// --- The display --------------------------------------------------------------

const earShift = plateDisplay({
  place: 'window',
  columns: 1,
  params: ['beat', 'ears', 'low', 'high'],
  info: 'Above, how much of each frequency is shifted: the rings set Low and High. In the middle a note as each ear gets it, up in the left and down in the right by the hertz written, with as much of the other copy as Ears lets in. Below, its level in each ear over the two together, for the time written.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const layout = earShiftLayout(frame)
    const set = earShiftSettings((name) => frame.value(name), frame.sampleRate)
    const { plot, scale, time, tall } = layout

    // --- How much of each frequency is shifted ---
    freqGrid(frame, plot, EAR_SHIFT_MIN_HZ, EAR_SHIFT_MAX_HZ)
    rule(ctx, plot.x, plot.y, plot.x + plot.w, plot.y, { colour: colours.ink, alpha: INK.grid })
    const curve = earShiftCurvePoints(set, layout, frame.sampleRate)
    fillTo(ctx, curve, plot.y + plot.h, colours.ink)
    rule(ctx, plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    trace(ctx, curve, { colour: colours.ink, width: 1.5 })
    // The band's two edges, as the split holds them.
    text(frame, hzText(set.low), layout.left, layout.base, { alpha: INK.text })
    text(frame, hzText(set.high), layout.right, layout.base, { align: 'right', alpha: INK.text })

    // --- A note as each ear gets it ---
    const hertz = earShiftHertz(set.beat)
    const middle = earShiftScaleX(0, layout)
    for (const foot of [layout.leftFoot, layout.rightFoot]) {
      rule(ctx, scale.x, foot, scale.x + scale.w, foot, { colour: colours.ink, alpha: INK.rule })
      for (const mark of EAR_SHIFT_SCALE_MARKS) {
        for (const side of [-1, 1]) {
          const x = earShiftScaleX(side * mark, layout)
          rule(ctx, x, foot - 1.5, x, foot + 1.5, { colour: colours.ink, alpha: INK.rule })
        }
      }
    }
    // The note as it came in: both ears' copies are told from it.
    rule(ctx, middle, layout.leftFoot - tall, middle, layout.rightFoot + 1.5, {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [2, 2],
    })
    for (const copy of earShiftCopies(set, layout)) {
      if (copy.foot - copy.top < 0.25) continue
      fillRect(
        ctx,
        { x: copy.x - 1, y: copy.top, w: 2, h: copy.foot - copy.top },
        colours.ink,
        // An ear's own copy in full ink, the other ear's standing back a little.
        copy.hz === (copy.ear === 'left' ? hertz.left : hertz.right) ? 1 : INK.text,
      )
    }
    text(frame, `L ${earShiftHertzText(hertz.left)}`, layout.left, layout.leftFoot - 2.5, {
      alpha: INK.text,
    })
    text(frame, `R ${earShiftHertzText(hertz.right)}`, layout.left, layout.rightFoot - 2.5, {
      alpha: INK.text,
    })

    // --- The level over time: each ear, over the two together ---
    const span = earShiftSpan(set.beat)
    const beats = span * set.beat
    const foot = time.y + time.h
    rule(ctx, time.x, time.y, time.x + time.w, time.y, { colour: colours.ink, alpha: INK.grid })
    const fold = earShiftFoldPoints(set, layout)
    fillTo(ctx, fold, foot, colours.ink)
    rule(ctx, time.x, foot, time.x + time.w, foot, { colour: colours.ink, alpha: INK.rule })
    // A tick at every crest of the beat.
    for (let beat = 0; beat <= beats + 1e-9; beat++) {
      const x = time.x + (beat / beats) * time.w
      rule(ctx, x, foot - 2.5, x, foot + 2.5, { colour: colours.ink, alpha: INK.rule })
    }
    trace(ctx, fold, { colour: colours.ink, width: 1, alpha: INK.back })
    trace(ctx, earShiftEarPoints(set, layout), { colour: colours.ink, width: 1.5 })
    text(frame, earShiftSpanText(span), layout.left, time.y + 0.5 * time.h + 3, {
      alpha: INK.text,
    })

    for (const point of earShiftHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: earShiftHandles,
})

export const EAR_SHIFT_FACES: Readonly<Record<string, PlateFace>> = {
  // Low and High are the points on the display.
  'ear-shift': {
    display: earShift,
    face: ['beat', 'ears'],
  },
}
