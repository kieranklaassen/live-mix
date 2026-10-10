// The display of Warp, the effect that moves every partial by a curve: pitch
// across, and upward how far a partial is moved, in octaves, sharp over the
// middle line and flat under it. The middle line is a sound left alone and
// the curve is the device's own, through nought where the pivot is. The ink is
// the setting; the second colour is now: the lowest note the device has put a
// pivot on, the curves of the two sides as Drift and Width have them, and the
// loudest partials, each a stem from the middle line to how far it is moved.

import {
  FREQ_MAX,
  FREQ_MIN,
  INK,
  clamp,
  clipped,
  crisp,
  dot,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
  lerp,
  rule,
  trace,
  xOfHz,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Size = Pick<DisplayView, 'width' | 'height'>
/** A point of a trace kept between frames, so drawing makes no new arrays. */
type Spot = [number, number]

const spots = (count: number): Spot[] => Array.from({ length: count }, (): Spot => [0, 0])
/** The same list when it already has so many points: a new one only when the display changes size. */
const sized = (list: Spot[], count: number): Spot[] => (list.length === count ? list : spots(count))

/** A number with its sign, the minus a real one: "+0.30", "−1.00". */
const signed = (value: number, digits: number): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`

/** `kLeanOctaves` of `warp.h`: Lean's weight is halfway at this many octaves from the pivot. */
const WARP_LEAN_OCTAVES = 2
/** `kWidthDepth`: at full Width the left side's Stretch is this much under the setting and the right's as much over. */
const WARP_WIDTH_DEPTH = 0.04
/** `kMarks`: the device reports its six loudest partials. */
const WARP_MARKS = 6
/** How many octaves of move the picture holds either way of none. */
export const WARP_REACH_OCTAVES = 2
/**
 * How many octaves over the pivot the Stretch handle stands on the curve. At
 * two, Lean weighs the move by a half at either end of its range, so the
 * handle travels an octave and a half at the least between the ends of Stretch.
 */
export const WARP_HANDLE_OCTAVES = 2
/**
 * With Follow on every note played is its own pivot and the Pivot knob is not
 * used: the setting's curve is drawn for a note at this pitch, A2.
 */
export const WARP_EXAMPLE_HZ = 110
/** A partial quieter than this against full scale is not drawn, and one at full scale is drawn whole. */
const WARP_MARK_FLOOR_DB = -60
/** The least a mark that is drawn at all is drawn with. */
const WARP_MARK_LEAST = 0.3
const WARP_PIN_RADIUS = 2.5
const WARP_MARK_RADIUS = 2

/**
 * How far a partial at `hz` is moved, in octaves, as `Warp::frame` in `warp.h`
 * moves it: `o` octaves from the pivot it goes to `o` times the exponent, the
 * exponent weighted by Lean (up, the far partials move most; down, the near
 * ones), and Shift is added after. With `follow` the pivot is a note: what
 * lies at it or under it is no overtone of it and only Shift moves it.
 */
export function warpMove(
  hz: number,
  pivotHz: number,
  stretch: number,
  lean: number,
  shiftSt: number,
  follow = false,
): number {
  if (follow && hz <= pivotHz) return shiftSt / 12
  const octaves = Math.log2(hz / pivotHz)
  const x = octaves / WARP_LEAN_OCTAVES
  const r = (x * x) / (1 + x * x)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  return octaves * (2 ** stretch - 1) * weight + shiftSt / 12
}

/** Where a partial at `hz` lands: its own pitch, moved. */
export function warpedHz(
  hz: number,
  pivotHz: number,
  stretch: number,
  lean: number,
  shiftSt: number,
): number {
  return hz * 2 ** warpMove(hz, pivotHz, stretch, lean, shiftSt)
}

/** The picture: pitch across from 20 Hz to 20 kHz, the move upward, two octaves either way. */
function warpBox(view: Size): Box {
  return { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
}

/** Where a move stands, past the picture's edges too: no move is the middle line. */
const yOfMove = (octaves: number, box: Box): number =>
  box.y + box.h / 2 - (octaves / (2 * WARP_REACH_OCTAVES)) * box.h

const moveOfY = (y: number, box: Box): number =>
  ((box.y + box.h / 2 - y) / box.h) * 2 * WARP_REACH_OCTAVES

/** What Mix lets through of the warped sound, as a gain: the device mixes at equal power. */
const warpWet = (view: DisplayView): number =>
  Math.sin(0.5 * Math.PI * clamp(view.value('mix'), 0, 1))

/** The pivot the setting's curve is drawn about: the knob, or with Follow on the example note. */
const warpPivot = (view: DisplayView): number =>
  view.value('follow') >= 0.5 ? WARP_EXAMPLE_HZ : view.value('pivot')

function warpHandles(view: DisplayView): DisplayHandle[] {
  const box = warpBox(view)
  const foot = box.y + box.h
  const follow = view.value('follow') >= 0.5
  const pivot = warpPivot(view)
  const stretch = view.value('stretch')
  const lean = view.value('lean')
  const shift = view.value('shift')
  // The Stretch handle stands on the setting's curve two octaves over the pivot.
  const at = pivot * 2 ** WARP_HANDLE_OCTAVES
  const lies = yOfMove(warpMove(at, pivot, stretch, lean, shift), box)
  const half = WARP_HANDLE_OCTAVES / WARP_LEAN_OCTAVES
  const r = (half * half) / (1 + half * half)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  const handles: DisplayHandle[] = [
    {
      key: 'stretch',
      name: 'Stretch',
      x: xOfHz(at, box),
      y: clamp(lies, box.y, foot),
      // Up and down: the Stretch whose curve passes under the hand at this pitch. A curve that
      // leaves the picture has its point waiting at the edge; it is taken there and moves from
      // where the curve lies, as far past as it lay at the press.
      drag: (_x: number, y: number, hold?: DisplayHold) => {
        const kept = hold ?? {}
        kept.past ??= lies - clamp(lies, box.y, foot)
        const to = y + kept.past
        if (Math.abs(to - lies) < 1e-9) return { stretch }
        const octaves = moveOfY(to, box) - shift / 12
        const exponent = 1 + octaves / (WARP_HANDLE_OCTAVES * weight)
        return { stretch: exponent > 0.5 ? Math.min(1, Math.log2(exponent)) : -1 }
      },
      reset: () => ({ stretch: view.spec('stretch')?.default ?? 0.3 }),
    },
  ]
  // The Pivot knob is the pivot only while Follow is off: with it on there is nothing to take.
  if (!follow) {
    handles.push({
      key: 'pivot',
      name: 'Pivot',
      x: xOfHz(pivot, box),
      y: clamp(yOfMove(shift / 12, box), box.y, foot),
      // Across: the pivot is the pitch under the hand.
      drag: (x: number) => ({
        pivot:
          Math.abs(x - xOfHz(pivot, box)) < 1e-9
            ? pivot
            : clamp(hzOfX(x, box), view.spec('pivot')?.min ?? 20, view.spec('pivot')?.max ?? 2000),
      }),
      reset: () => ({ pivot: view.spec('pivot')?.default ?? 220 }),
    })
  }
  return handles
}

interface WarpState {
  /** The setting's curve, and the curves of the two sides as they are now. */
  curve: Spot[]
  left: Spot[]
  right: Spot[]
}

const warp = plateDisplay<WarpState>({
  place: 'window',
  columns: 2,
  // Drift shows only in the curves of now, which the device reports (`stretchNow`): the shared test
  // runs a display on readings that stand still and would not see it follow, so Drift is not one of
  // `params`. Tone changes levels, not places, and is not drawn.
  params: ['stretch', 'pivot', 'follow', 'lean', 'shift', 'width', 'mix'],
  live: { meters: true, signal: true },
  info: 'Pitch runs across. Up is how far a partial is moved, sharp over the dashed line and flat under it. The curve is the setting; the second colour is the note played now and its loudest partials. Drag the rings for Stretch and, with Follow off, Pivot. With Follow on the curve is for a note at 110 Hz.',
  init: () => ({ curve: [], left: [], right: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = warpBox(frame)
    const foot = box.y + box.h
    const right = box.x + box.w
    const follow = frame.value('follow') >= 0.5
    const pivot = warpPivot(frame)
    const stretch = frame.value('stretch')
    const lean = frame.value('lean')
    const shift = frame.value('shift')
    const wet = warpWet(frame)
    const dry = Math.cos(0.5 * Math.PI * clamp(frame.value('mix'), 0, 1))
    const none = yOfMove(0, box)

    // The scale: a line up at 100 Hz, 1 kHz and 10 kHz, a line across an octave sharp and an octave
    // flat, and the dashed middle line, where a pitch comes out as it went in.
    freqGrid(frame, box)
    for (const octaves of [-1, 1]) {
      const y = yOfMove(octaves, box)
      rule(ctx, box.x, y, right, y, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, box.x, none, right, none, { colour: colours.ink, alpha: INK.rule, dash: [2, 3] })

    const count = Math.max(2, Math.floor(box.w / 2) + 1)
    const curveOf = (list: Spot[], around: number, amount: number): Spot[] => {
      const points = sized(list, count)
      for (let i = 0; i < count; i++) {
        const x = box.x + (i / (count - 1)) * box.w
        points[i][0] = x
        points[i][1] = clamp(
          yOfMove(warpMove(hzOfX(x, box), around, amount, lean, shift, follow), box),
          box.y - 200,
          foot + 200,
        )
      }
      return points
    }

    // Now: what the device reports while it runs. With Follow on the pivot it reports is the lowest
    // note it has one on, and no pitch while it has none: then nothing is being moved and no curve
    // of now is drawn. With Follow off it is the knob, and a reading that is no pitch leaves the
    // knob in its place.
    const running = frame.powered && frame.signal !== null && frame.hasMeter('stretchNow')
    const readPivot = frame.meter('pivotNow')
    const noted = Number.isFinite(readPivot) && readPivot > 1
    const pivotNow = noted ? readPivot : pivot
    const readStretch = frame.meter('stretchNow')
    const stretchNow = Number.isFinite(readStretch) ? clamp(readStretch, -1.2, 1.2) : stretch
    const spread = frame.value('width') * WARP_WIDTH_DEPTH
    const whole: Box = { x: box.x - 1, y: box.y - 1, w: box.w + 2, h: box.h + 2 }
    const strong = lerp(INK.rule, 1, wet)

    clipped(ctx, whole, () => {
      if (running && wet > 0.02 && (noted || !follow)) {
        // The curves of the two sides, through nought at the pivot in use, and the pivot itself.
        state.left = curveOf(state.left, pivotNow, stretchNow - spread)
        state.right = curveOf(state.right, pivotNow, stretchNow + spread)
        trace(ctx, state.left, { colour: colours.accent, width: 1, alpha: wet })
        trace(ctx, state.right, { colour: colours.accent, width: 1, alpha: wet })
        dot(ctx, xOfHz(pivotNow, box), yOfMove(shift / 12, box), WARP_PIN_RADIUS, colours.accent, {
          alpha: wet,
        })
      }
      // The setting's curve lies over them, so the second colour shows where now has left it.
      state.curve = curveOf(state.curve, pivot, stretch)
      trace(ctx, state.curve, { colour: colours.ink, width: 1.5, alpha: strong })
      // With Follow on it is the curve of one note, and the note is marked where the ring of the
      // Pivot would stand.
      if (follow) {
        dot(ctx, xOfHz(pivot, box), yOfMove(shift / 12, box), WARP_MARK_RADIUS, colours.ink, {
          alpha: strong,
        })
      }

      if (!running) return
      for (let mark = 1; mark <= WARP_MARKS; mark++) {
        const level = frame.meter(`partial${mark}Level`)
        const from = frame.meter(`partial${mark}In`)
        const to = frame.meter(`partial${mark}Out`)
        if (!(level > 0 && from >= FREQ_MIN && from <= FREQ_MAX && to > 0)) continue
        const db = gainToDb(level)
        if (!(db > WARP_MARK_FLOOR_DB) || !Number.isFinite(to)) continue
        const strength = lerp(WARP_MARK_LEAST, 1, clamp(1 - db / WARP_MARK_FLOOR_DB, 0, 1))
        const x = crisp(xOfHz(from, box))
        const lands = clamp(yOfMove(Math.log2(to / from), box), box.y - 200, foot + 200)
        // What Mix leaves of the partial where it was, on the middle line; and in the second colour
        // how far it is moved, as strong as Mix lets the warped sound be heard.
        if (dry * strength > 0.05) dot(ctx, x, none, 1.5, colours.ink, { alpha: dry * strength })
        if (wet * strength > 0.05) {
          rule(ctx, x, none, x, lands, { colour: colours.accent, alpha: wet * strength })
          dot(ctx, x, lands, WARP_MARK_RADIUS, colours.accent, { alpha: wet * strength })
        }
      }
    })

    const handles = warpHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    // The axes by name; the handle under the pointer says its setting where "sharp" stands.
    label(frame, 'pitch in', right - 2, foot - 3, 'right')
    label(frame, 'flat', box.x + 2, foot - 3)
    const said =
      frame.hot === 'stretch'
        ? `Stretch ${signed(stretch, 2)}`
        : frame.hot === 'pivot'
          ? `Pivot ${hzText(pivot)}`
          : 'sharp'
    label(frame, said, box.x + 2, box.y + 8)
  },
  handles: warpHandles,
})

export const WARP_FACES: Readonly<Record<string, PlateFace>> = {
  warp: {
    display: warp,
    face: ['stretch', 'lean', 'drift', 'mix'],
  },
}
