// The display of Warp, the effect that moves every partial by a curve: pitch
// in across, pitch out upward, both on a scale of equal octaves, so the
// diagonal is a sound left alone and the line is the device's own curve,
// pinned where the pivot is. The ink is the setting; the second colour is now:
// the pivot the device has put on the note being played, the curves of the
// two sides as Drift and Width have them, and the loudest partials, each
// drawn from where it was to where it lands.

import {
  FREQ_MAX,
  FREQ_MIN,
  INK,
  clamp,
  clipped,
  crisp,
  dot,
  fillRect,
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
/** `kSameNote`: a partial is taken as a note's own from this far under the note's pivot. */
const WARP_SAME_NOTE = 0.03
/** `kMarks`: the device reports its six loudest partials. */
const WARP_MARKS = 6
/** How many octaves over the pivot the Stretch handle stands on the curve. */
const WARP_HANDLE_OCTAVES = 3
/** A partial quieter than this against full scale is not drawn, and one at full scale is drawn whole. */
const WARP_MARK_FLOOR_DB = -60
/** The least a mark that is drawn at all is drawn with. */
const WARP_MARK_LEAST = 0.3
/** How much ink lies over the part of the picture where Follow puts a pivot on every note. */
const WARP_FOLLOW_SHADE = 0.07
const WARP_PIN_RADIUS = 2.5
const WARP_MARK_RADIUS = 2

/**
 * Where a partial at `hz` lands, as `Warp::frame` in `warp.h` moves it: `o`
 * octaves from the pivot it goes to `o` times the exponent, the exponent
 * weighted by Lean (up, the far partials move most; down, the near ones),
 * and Shift is added after. The device writes it as a ratio so that no move
 * is exactly none; the place is the same.
 */
export function warpedHz(
  hz: number,
  pivotHz: number,
  stretch: number,
  lean: number,
  shiftSt: number,
): number {
  const octaves = Math.log2(hz / pivotHz)
  const x = octaves / WARP_LEAN_OCTAVES
  const r = (x * x) / (1 + x * x)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  return hz * 2 ** (octaves * (2 ** stretch - 1) * weight + shiftSt / 12)
}

/** The picture: pitch in across and pitch out upward, both from 20 Hz to 20 kHz. */
function warpBox(view: Size): Box {
  return { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
}

/** Where a pitch out stands, past the picture's edges too: the foot is 20 Hz and the top 20 kHz. */
const yOfOut = (hz: number, box: Box): number =>
  box.y + box.h - (Math.log(Math.max(hz, 1e-3) / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * box.h

const outOfY = (y: number, box: Box): number =>
  FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** ((box.y + box.h - y) / box.h)

/** What Mix lets through of the warped sound, as a gain: the device mixes at equal power. */
const warpWet = (view: DisplayView): number =>
  Math.sin(0.5 * Math.PI * clamp(view.value('mix'), 0, 1))

function warpHandles(view: DisplayView): DisplayHandle[] {
  const box = warpBox(view)
  const foot = box.y + box.h
  const pivot = view.value('pivot')
  const stretch = view.value('stretch')
  const lean = view.value('lean')
  const shift = view.value('shift')
  // The Stretch handle stands on the setting's curve three octaves over the pivot.
  const at = pivot * 2 ** WARP_HANDLE_OCTAVES
  const lands = warpedHz(at, pivot, stretch, lean, shift)
  const half = WARP_HANDLE_OCTAVES / WARP_LEAN_OCTAVES
  const r = (half * half) / (1 + half * half)
  const weight = lean >= 0 ? 1 - lean * (1 - r) : 1 + lean * r
  return [
    {
      key: 'stretch',
      name: 'Stretch',
      x: xOfHz(at, box),
      y: clamp(yOfOut(lands, box), box.y, foot),
      // Up and down: the Stretch whose curve passes under the hand at this pitch in. A curve that
      // leaves the picture has its point waiting at the edge; it is taken there and moves from
      // where the curve lies, as far past as it lay at the press.
      drag: (_x: number, y: number, hold?: DisplayHold) => {
        const kept = hold ?? {}
        const lies = yOfOut(lands, box)
        kept.past ??= lies - clamp(lies, box.y, foot)
        const to = y + kept.past
        if (Math.abs(to - lies) < 1e-9) return { stretch }
        const octaves = Math.log2(outOfY(to, box) / pivot) - shift / 12
        const exponent = 1 + (octaves / WARP_HANDLE_OCTAVES - 1) / weight
        return { stretch: exponent > 0.5 ? Math.min(1, Math.log2(exponent)) : -1 }
      },
      reset: () => ({ stretch: view.spec('stretch')?.default ?? 0.3 }),
    },
    {
      key: 'pivot',
      name: 'Pivot',
      x: xOfHz(pivot, box),
      y: clamp(yOfOut(pivot * 2 ** (shift / 12), box), box.y, foot),
      // Across: the pivot is the pitch in under the hand.
      drag: (x: number) => ({
        pivot:
          Math.abs(x - xOfHz(pivot, box)) < 1e-9
            ? pivot
            : clamp(hzOfX(x, box), view.spec('pivot')?.min ?? 20, view.spec('pivot')?.max ?? 2000),
      }),
      reset: () => ({ pivot: view.spec('pivot')?.default ?? 20 }),
    },
  ]
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
  info: 'Pitch in runs across and pitch out runs up, so the diagonal is no change and the line is the curve the partials are moved along. The second colour is now: the pivot on the note played and the loudest partials, each from where it was to where it lands. Drag the rings to set Stretch and Pivot.',
  init: () => ({ curve: [], left: [], right: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = warpBox(frame)
    const foot = box.y + box.h
    const right = box.x + box.w
    const pivot = frame.value('pivot')
    const stretch = frame.value('stretch')
    const lean = frame.value('lean')
    const shift = frame.value('shift')
    const wet = warpWet(frame)
    const dry = Math.cos(0.5 * Math.PI * clamp(frame.value('mix'), 0, 1))

    // With Follow on, every note at or over the Pivot setting gets a pivot of its own: that part of
    // the picture is shaded, and the setting's curve is the one for what lies under the lowest note.
    if (frame.value('follow') >= 0.5) {
      const from = xOfHz(pivot, box)
      fillRect(
        ctx,
        { x: from, y: box.y, w: right - from, h: box.h },
        colours.ink,
        WARP_FOLLOW_SHADE,
      )
    }
    // The scale: a line up and a line across at 100 Hz, 1 kHz and 10 kHz, and the diagonal, where
    // a pitch comes out as it went in.
    freqGrid(frame, box)
    for (const hz of [100, 1000, 10000]) {
      const y = yOfOut(hz, box)
      rule(ctx, box.x, y, right, y, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, box.x, foot, right, box.y, { colour: colours.ink, alpha: INK.rule, dash: [2, 3] })

    const count = Math.max(2, Math.floor(box.w / 2) + 1)
    const curveOf = (list: Spot[], around: number, amount: number): Spot[] => {
      const points = sized(list, count)
      for (let i = 0; i < count; i++) {
        const x = box.x + (i / (count - 1)) * box.w
        points[i][0] = x
        points[i][1] = clamp(
          yOfOut(warpedHz(hzOfX(x, box), around, amount, lean, shift), box),
          box.y - 200,
          foot + 200,
        )
      }
      return points
    }

    // Now: what the device reports while it runs. A reading that is no pitch (none has come yet)
    // leaves the setting in its place.
    const running = frame.powered && frame.signal !== null && frame.hasMeter('stretchNow')
    const readPivot = frame.meter('pivotNow')
    const pivotNow = Number.isFinite(readPivot) && readPivot > 1 ? readPivot : pivot
    const readStretch = frame.meter('stretchNow')
    const stretchNow = Number.isFinite(readStretch) ? clamp(readStretch, -1.2, 1.2) : stretch
    const spread = frame.value('width') * WARP_WIDTH_DEPTH

    // With Follow on and a note played, the device's curve is in two parts (`Warp::pivot_for`): a
    // partial more than `kSameNote` under the lowest note's pivot is moved around the Pivot setting,
    // and from there upward the notes have pivots of their own. The seam is where the parts meet.
    const noted = running && pivotNow > pivot * (1 + WARP_SAME_NOTE)
    const seam = noted ? xOfHz(pivotNow * (1 - WARP_SAME_NOTE), box) : box.x - 1
    const whole: Box = { x: box.x - 1, y: box.y - 1, w: box.w + 2, h: box.h + 2 }
    const under: Box = { ...whole, w: seam - whole.x }
    const over: Box = { ...whole, x: seam, w: whole.x + whole.w - seam }
    state.curve = curveOf(state.curve, pivot, stretch)
    const strong = lerp(INK.rule, 1, wet)

    if (running && wet > 0.02) {
      // The curves of the two sides, pinned on the pivot in use, and the pivot itself.
      state.left = curveOf(state.left, pivotNow, stretchNow - spread)
      state.right = curveOf(state.right, pivotNow, stretchNow + spread)
      clipped(ctx, over, () => {
        trace(ctx, state.left, { colour: colours.accent, width: 1, alpha: wet })
        trace(ctx, state.right, { colour: colours.accent, width: 1, alpha: wet })
        dot(
          ctx,
          xOfHz(pivotNow, box),
          yOfOut(pivotNow * 2 ** (shift / 12), box),
          WARP_PIN_RADIUS,
          colours.accent,
          { alpha: wet },
        )
      })
    }
    // The setting's curve lies over them, so the second colour shows where now has left it. Where
    // the notes have their own pivots it stands back: nothing played is moved along it there.
    if (noted) {
      clipped(ctx, under, () => {
        trace(ctx, state.curve, { colour: colours.ink, width: 1.5, alpha: strong })
      })
      clipped(ctx, over, () => {
        trace(ctx, state.curve, {
          colour: colours.ink,
          width: 1,
          alpha: Math.min(strong, INK.rule),
        })
      })
    } else {
      clipped(ctx, whole, () => {
        trace(ctx, state.curve, { colour: colours.ink, width: 1.5, alpha: strong })
      })
    }

    clipped(ctx, whole, () => {
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
        const was = yOfOut(from, box)
        const lands = clamp(yOfOut(to, box), box.y - 200, foot + 200)
        // What Mix leaves of the partial where it was, on the diagonal; and in the second colour
        // the way it is moved and where it lands, as strong as Mix lets the warped sound be heard.
        if (dry * strength > 0.05) dot(ctx, x, was, 1.5, colours.ink, { alpha: dry * strength })
        if (wet * strength > 0.05) {
          rule(ctx, x, was, x, lands, { colour: colours.accent, alpha: wet * strength })
          dot(ctx, x, lands, WARP_MARK_RADIUS, colours.accent, { alpha: wet * strength })
        }
      }
    })

    const handles = warpHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    // The axes by name; the handle under the pointer says its setting where "out" stands.
    label(frame, 'in', right - 2, foot - 3, 'right')
    const said =
      frame.hot === 'stretch'
        ? `Stretch ${signed(stretch, 2)}`
        : frame.hot === 'pivot'
          ? `Pivot ${hzText(pivot)}`
          : 'out'
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
