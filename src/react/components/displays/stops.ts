// The display of Stops: six drawbars standing at their pitches. The sound
// that came in is the second from the left; the five ranks stand where
// `stops.h` puts their copies of it, an octave below and a fifth, an octave,
// a twelfth and two octaves above. The scale across is pitch, an octave the
// same width everywhere, laid about the loudest note the device hears; the
// scale upward is level, with the sound going in at the top.
//
// Every figure here is `cpp/devices/stops/stops.h`'s own: the drawbars' law,
// the shutters of Swell, the curve of Tone and the law of Mix. Detune moves a
// rank by 14 cents at most, under a pixel at this size: it is not drawn.

import {
  INK,
  clamp,
  clipped,
  fillRect,
  follow,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  trace,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Size = Pick<DisplayView, 'width' | 'height'>
type Spot = [number, number]

/**
 * The six drawbars from the lowest to the highest: the parameter, the multiple
 * of a partial's frequency its copy sounds at (`kRatio` of `stops.h`; the
 * unison is the sound itself), the device's reading of how loud it sounds,
 * and the word under it.
 */
export const STOPS = [
  { param: 'sub', ratio: 0.5, meter: 'subLevel', name: 'Sub', word: 'sub' },
  { param: 'unison', ratio: 1, meter: 'unisonLevel', name: 'Unison', word: 'uni' },
  { param: 'fifth', ratio: 1.5, meter: 'fifthLevel', name: 'Fifth', word: '5th' },
  { param: 'octave', ratio: 2, meter: 'octaveLevel', name: 'Octave', word: '8ve' },
  { param: 'twelfth', ratio: 3, meter: 'twelfthLevel', name: 'Twelfth', word: '12th' },
  { param: 'fifteenth', ratio: 4, meter: 'fifteenthLevel', name: 'Fifteenth', word: '15th' },
] as const

// `stops.h`: Tone under the middle rolls the ranks off above `kPivotHz` by up
// to `kDarkSlopeDb` an octave; over the middle it tilts them about `kBrightHz`
// by up to `kBrightSlopeDb` an octave, between `kBrightCutDb` down and
// `kBrightLiftDb` up. The shutters of Swell take up to `kShutterDb` away and
// roll off above the pivot by up to `kShutterSlopeDb` an octave.
const PIVOT_HZ = 400
const DARK_SLOPE_DB = 12
const BRIGHT_HZ = 1500
const BRIGHT_SLOPE_DB = 4
const BRIGHT_CUT_DB = 8
const BRIGHT_LIFT_DB = 6
const SHUTTER_SLOPE_DB = 6
const SHUTTER_DB = 24
// The ranks fade out to nothing at the top of hearing (`kTopFadeFromHz` to
// `kTopFadeToHz`, or these shares of the Nyquist frequency when that is
// lower) and at the bottom (`kLowFadeFromHz` to `kLowFadeToHz`).
const TOP_FADE_FROM_HZ = 16000
const TOP_FADE_TO_HZ = 20000
const TOP_FADE_FROM = 0.8
const TOP_FADE_TO = 0.92
const LOW_FADE_FROM_HZ = 18
const LOW_FADE_TO_HZ = 28

/** `Stops::tone_db`: what Tone and the shutters' slope do to a rank's partial at `hz`, in dB. */
export function stopsToneDb(hz: number, tone: number, swell: number): number {
  const dark = tone < 0.5 ? 1 - 2 * tone : 0
  const bright = tone > 0.5 ? 2 * tone - 1 : 0
  const above = hz > PIVOT_HZ ? Math.log2(hz / PIVOT_HZ) : 0
  const tilt = clamp(
    BRIGHT_SLOPE_DB * bright * Math.log2(Math.max(hz, 1) / BRIGHT_HZ),
    -BRIGHT_CUT_DB,
    BRIGHT_LIFT_DB,
  )
  return Math.max(-96, tilt - (DARK_SLOPE_DB * dark + SHUTTER_SLOPE_DB * (1 - swell)) * above)
}

/**
 * What a rank drawn full keeps of a partial that lands at `hz`, as a gain:
 * the shutters (`snapshot`), Tone (`build_tone`) and the fades at the two
 * ends of hearing (`build_tone` and `frame`). The device reads Tone at the
 * bin the partial lands in, 12 Hz wide; here it is read at the pitch itself.
 */
export function stopsPassed(hz: number, tone: number, swell: number, sampleRate: number): number {
  if (!(hz > LOW_FADE_FROM_HZ)) return 0
  const nyquist = sampleRate / 2
  const from = Math.min(TOP_FADE_FROM_HZ, TOP_FADE_FROM * nyquist)
  const to = Math.min(TOP_FADE_TO_HZ, TOP_FADE_TO * nyquist)
  const x = clamp((hz - from) / (to - from), 0, 1)
  const top = 1 - x * x * (3 - 2 * x)
  const low = Math.min(1, (hz - LOW_FADE_FROM_HZ) / (LOW_FADE_TO_HZ - LOW_FADE_FROM_HZ))
  const shutters = Math.pow(10, (-SHUTTER_DB * (1 - swell)) / 20)
  return shutters * Math.pow(10, stopsToneDb(hz, tone, swell) / 20) * top * low
}

/**
 * The drawbars' law (`snapshot`): a rank's level is its position to the power
 * 1.5, and when the five together pass the power of one full rank, all are
 * turned down by the same amount. In the order of `STOPS`; the unison is not
 * a rank, and its place holds its position as it is.
 */
export function stopsDrawn(view: Pick<DisplayView, 'value'>): number[] {
  const drawn = STOPS.map(({ param }) => {
    const position = clamp(view.value(param), 0, 1)
    return param === 'unison' ? position : position * Math.sqrt(position)
  })
  let power = 0
  STOPS.forEach(({ param }, i) => {
    if (param !== 'unison') power += drawn[i] * drawn[i]
  })
  const together = power > 1 ? 1 / Math.sqrt(power) : 1
  return drawn.map((level, i) => (STOPS[i].param === 'unison' ? level : level * together))
}

/**
 * How much of each stop comes out for a partial at `note` Hz, as a gain on
 * the sound going in, in the order of `STOPS`. The mix law of `process`: the
 * wet side is the unison with the ranks, crossed with the dry sound in a
 * straight line, so the sound itself comes out at 1 - Mix x (1 - Unison) and
 * a rank at Mix times its level.
 */
export function stopsHeard(
  view: Pick<DisplayView, 'value'>,
  note: number,
  sampleRate: number,
): number[] {
  const mix = clamp(view.value('mix'), 0, 1)
  const tone = view.value('tone')
  const swell = view.value('swell')
  return stopsDrawn(view).map((level, i) =>
    STOPS[i].param === 'unison'
      ? 1 - mix * (1 - level)
      : mix * level * stopsPassed(note * STOPS[i].ratio, tone, swell, sampleRate),
  )
}

/** The note the picture is drawn for until one has been heard. */
export const STOPS_REST_HZ = 220
/** A stop sounding at this level or under is not lit; at full scale it is lit whole. */
export const STOPS_LIT_FLOOR_DB = -54
/** How strongly a stop's colour is laid while it is silent, and while it sounds at full scale. */
export const STOPS_SET_ALPHA = 0.35
export const STOPS_LIT_ALPHA = 0.9

export interface StopsLayout {
  box: Box
  /** Where no level stands, and where the level of the sound going in does. */
  base: number
  top: number
  /** Pixels per octave, and where the sound itself (the unison) stands. */
  perOctave: number
  unison: number
  /** How wide a drawbar is drawn. */
  wide: number
}

export function stopsLayout(view: Size): StopsLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  // Room for half a word at either end, and for a line of words under the
  // bars, clear of a handle that stands at nothing.
  const left = box.x + 10
  const right = box.x + box.w - 12
  const perOctave = (right - left) / 3
  return {
    box,
    base: box.y + box.h - 12,
    top: box.y + 4,
    perOctave,
    unison: left + perOctave,
    wide: clamp(Math.round(perOctave * 0.16), 5, 11),
  }
}

/** Where a stop stands: its ratio in octaves from the unison. */
export const xOfStop = (ratio: number, layout: StopsLayout): number =>
  layout.unison + Math.log2(ratio) * layout.perOctave

/** Where a level stands: a gain of 1 at `top`, and a little more as far as the box goes. */
export const yOfStopLevel = (gain: number, layout: StopsLayout): number =>
  Math.max(layout.box.y + 1, layout.base - Math.max(0, gain) * (layout.base - layout.top))

function stopsHandles(view: DisplayView): DisplayHandle[] {
  const layout = stopsLayout(view)
  const span = layout.base - layout.top
  return STOPS.map(({ param, ratio, name }): DisplayHandle => ({
    key: param,
    name,
    x: xOfStop(ratio, layout),
    y: layout.base - clamp(view.value(param), 0, 1) * span,
    drag: (_x, y) => ({ [param]: clamp((layout.base - y) / span, 0, 1) }),
    reset: () => ({ [param]: view.spec(param)?.default ?? 0 }),
  }))
}

interface StopsState {
  /** The loudest partial the device heard last, Hz; 0 until there has been one. */
  note: number
  /** How far each stop is lit, 0..1, in the order of `STOPS`. */
  lit: number[]
  curve: Spot[]
}

/**
 * How far a stop is lit, 0..1: the level it comes out at now on a scale of
 * decibels, from `STOPS_LIT_FLOOR_DB` to full scale. `reading` is the device's
 * own (the amplitude the stop sounds at before Mix) and `out` what Mix makes
 * of it.
 */
export const stopsLit = (reading: number, out: number): number =>
  clamp(1 - gainToDb(Math.max(0, reading) * Math.max(0, out)) / STOPS_LIT_FLOOR_DB, 0, 1)

const stops = plateDisplay<StopsState>({
  place: 'strip',
  // Speak, Chiff and Detune are not drawn as figures: Speak shows in how
  // late a rank lights after the sound itself.
  params: ['sub', 'unison', 'fifth', 'octave', 'twelfth', 'fifteenth', 'tone', 'swell', 'mix'],
  live: { meters: true, signal: true },
  info: 'Six drawbars at their pitches, your own sound second from the left: drag a bar to draw that stop. The colour in a bar is how much of the stop comes out for the loudest note, after Tone, Swell and Mix, and it lights as the stop speaks. The line is what Tone and Swell leave of a rank at each pitch.',
  init: () => ({ note: 0, lit: STOPS.map(() => 0), curve: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = stopsLayout(frame)
    const { box, base, perOctave, unison, wide } = layout
    // The device reports the loudest partial it finds, and nothing in silence.
    const running = frame.powered && frame.signal !== null && frame.hasMeter('note')
    const reading = running ? frame.meter('note') : 0
    if (Number.isFinite(reading) && reading > 20) {
      // The reading steps from note to note of a chord; the picture follows it over a moment.
      state.note =
        state.note > 0 && frame.dt > 0
          ? Math.exp(follow(Math.log(state.note), Math.log(reading), frame.dt, 0.05, 0.05))
          : reading
    }
    const note = state.note > 0 ? state.note : STOPS_REST_HZ
    rule(ctx, box.x, base, box.x + box.w, base, { colour: colours.ink, alpha: INK.rule })

    // What Tone and Swell leave of a rank at each pitch, before its drawbar and Mix.
    const tone = frame.value('tone')
    const swell = frame.value('swell')
    const count = Math.max(2, Math.floor(box.w / 2) + 1)
    if (state.curve.length !== count) state.curve = Array.from({ length: count }, (): Spot => [0, 0])
    for (let i = 0; i < count; i++) {
      const x = box.x + (i / (count - 1)) * box.w
      const hz = note * 2 ** ((x - unison) / perOctave)
      state.curve[i][0] = x
      state.curve[i][1] = yOfStopLevel(stopsPassed(hz, tone, swell, frame.sampleRate), layout)
    }
    clipped(ctx, box, () => trace(ctx, state.curve, { colour: colours.ink, width: 1, alpha: INK.back }))

    const heard = stopsHeard(frame, note, frame.sampleRate)
    const mix = clamp(frame.value('mix'), 0, 1)
    const handles = stopsHandles(frame)
    STOPS.forEach(({ param, meter, word }, i) => {
      const centre = handles[i].x
      const x = Math.round(centre - wide / 2)
      const set = handles[i].y
      // What is set, in the ink: the drawbar as far as it is drawn.
      fillRect(ctx, { x, y: set, w: wide, h: base - set }, colours.ink, INK.fill * 1.5)
      // In the second ink, how much of the stop comes out: pale while it is
      // silent, stronger the louder it sounds now. With no sound to read (a
      // still picture, a plate that is off) it is whole.
      const now = running
        ? stopsLit(frame.meter(meter), param === 'unison' ? heard[i] : mix)
        : 1
      state.lit[i] =
        running && frame.dt > 0 ? follow(state.lit[i], now, frame.dt, 0.02, 0.3) : now
      const out = yOfStopLevel(heard[i], layout)
      fillRect(
        ctx,
        { x, y: out, w: wide, h: base - out },
        colours.accent,
        STOPS_SET_ALPHA + (STOPS_LIT_ALPHA - STOPS_SET_ALPHA) * state.lit[i],
      )
      rule(ctx, x, set, x + wide, set, { colour: colours.ink, width: 1.5 })
      text(frame, word, centre, frame.height - 5, {
        align: 'center',
        alpha: param === 'unison' ? 1 : INK.text,
      })
    })

    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    const hot = handles.findIndex((point) => point.key === frame.hot)
    if (hot >= 0) {
      // The setting in hand, beside its handle: on the left for the last bar.
      const last = hot === handles.length - 1
      const at = handles[hot]
      const words = `${Math.round(frame.value(at.key) * 100)}%`
      const y = clamp(at.y + 3, box.y + 9, base - 2)
      if (last) label(frame, words, at.x - wide / 2 - 5, y, 'right')
      else label(frame, words, at.x + wide / 2 + 5, y)
    }
  },
  handles: stopsHandles,
})

export const STOPS_FACES: Readonly<Record<string, PlateFace>> = {
  stops: {
    display: stops,
    face: ['sub', 'octave', 'speak', 'mix'],
  },
}
