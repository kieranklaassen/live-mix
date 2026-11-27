// Where everything stands on Unsung Voice's display: pitch up, a root of time
// either way of now, and the two points that can be dragged on those scales.

import { INK, clamp, fillBetween, trace, type Box, type Point } from '../display-kit'
import { type DisplayFrame, type DisplayHandle, type DisplayView } from '../plate-display'
import { unsungSettings, type UnsungSettings } from './unsung-voice-bodies'
import { UNSUNG_FLOOR } from './unsung-voice-meetings'

/** Both halves of the staff reach this far from now. */
export const UNSUNG_SECONDS = 12
/** The ends of Register, and the pixels its head moves through between them. */
const CEILINGS = [600, 2800] as const
const SLIDES = 14

export interface UnsungLayout {
  head: number
  keys: Box
  staff: Box
  now: number
  foot: Box
}

export function unsungLayout(size: Pick<DisplayView, 'width' | 'height'>): UnsungLayout {
  const left = 5
  const wide = size.width - 10
  const foot: Box = { x: left, y: size.height - 9, w: wide, h: 4 }
  const keys: Box = { x: left, y: 17, w: Math.round(wide * 0.33), h: foot.y - 21 }
  const x = keys.x + keys.w + 3
  const staff: Box = { x, y: keys.y, w: left + wide - x, h: keys.h }
  return { head: 12, keys, staff, now: staff.x + staff.w / 2, foot }
}

/** Where the head of the register stands, and the Register a head there stands for. */
export function unsungTop(ceiling: number, staff: Box): number {
  const share = Math.log(ceiling / CEILINGS[0]) / Math.log(CEILINGS[1] / CEILINGS[0])
  return staff.y + 3 + SLIDES * (1 - share)
}
const ceilingOf = (y: number, staff: Box): number =>
  CEILINGS[0] * Math.pow(CEILINGS[1] / CEILINGS[0], 1 - (y - staff.y - 3) / SLIDES)

/** Where a pitch stands: as high as it has Hz, so a key's overtones are one step apart all the way up. */
export function unsungY(hz: number, ceiling: number, staff: Box): number {
  const foot = staff.y + staff.h
  return Math.max(staff.y, foot - (hz / ceiling) * (foot - unsungTop(ceiling, staff)))
}

/** How far from now so many seconds lie, and back. */
const reach = (staff: Box): number => (staff.w / 2 - 7) / Math.sqrt(UNSUNG_SECONDS)
export const unsungAway = (seconds: number, staff: Box): number =>
  reach(staff) * Math.sqrt(clamp(seconds, 0, UNSUNG_SECONDS))

/** Register stands where the staff begins, Pace and Lean where the line moves on. */
export function unsungHandles(view: DisplayView): readonly DisplayHandle[] {
  const at = unsungLayout(view)
  const { staff, now } = at
  const set = unsungSettings((name) => view.value(name))
  const bound = (name: keyof UnsungSettings, value: number): number =>
    clamp(value, view.spec(name)?.min ?? value, view.spec(name)?.max ?? value)
  const first = (name: keyof UnsungSettings): number => view.spec(name)?.default ?? set[name]
  const top = unsungTop(set.register, staff)
  const tall = unsungY(set.register * UNSUNG_FLOOR, set.register, staff) - top
  const middle = top + tall / 2
  return [
    {
      key: 'register',
      name: 'Register',
      x: staff.x + 4,
      y: top,
      drag: (_x, y) => ({ register: bound('register', ceilingOf(y, staff)) }),
      wheel: (steps) => ({ register: bound('register', set.register * Math.pow(2, steps / 24)) }),
      reset: () => ({ register: first('register') }),
    },
    {
      key: 'step',
      name: 'Pace and Lean',
      x: now + unsungAway(set.pace, staff),
      y: middle - (set.lean * tall) / 2,
      drag: (x, y) => ({
        pace: bound('pace', Math.max(0, (x - now) / reach(staff)) ** 2),
        lean: bound('lean', (2 * (middle - y)) / tall),
      }),
      reset: () => ({ pace: first('pace'), lean: first('lean') }),
    },
  ]
}

/** How thick a line of full level is, pixels. */
export const UNSUNG_RIBBON = 6

/** Where a line was, and how loud. */
export interface UnsungPlace {
  at: number
  hz: number
  level: number
}

/** A line's way as a ribbon, as thick as it is loud. */
export function unsungRibbon(
  frame: DisplayFrame,
  points: readonly { x: number; y: number; thick: number }[],
  colour: string,
): void {
  const of = (side: number): Point[] =>
    points.map(({ x, y, thick }) => [x, y + (side * Math.max(0.8, thick)) / 2])
  fillBetween(frame.ctx, of(-1), of(1), colour, INK.trace)
  trace(frame.ctx, of(0), { colour, width: 1 })
}

/** Left of now, where a line has been: a tone apart from the last begins anew. */
export function drawUnsungBeen(
  frame: DisplayFrame,
  at: UnsungLayout,
  places: readonly UnsungPlace[],
  set: UnsungSettings,
  gain: number,
  colour: string,
): void {
  let piece: { x: number; y: number; thick: number }[] = []
  let last: UnsungPlace | null = null
  const end = (): void => {
    const only = piece.length === 1 ? piece[0] : null
    unsungRibbon(frame, only ? [only, { ...only, x: only.x + 1 }] : piece, colour)
    piece = []
  }
  for (const place of places) {
    if (
      last &&
      (place.at - last.at > 0.25 || (set.glide <= 0.02 && Math.abs(place.hz / last.hz - 1) > 0.02))
    )
      end()
    last = place
    const x = at.now - unsungAway(frame.now - place.at, at.staff)
    const before = piece.at(-1)
    if (before && x - before.x < 0.4 && place !== places.at(-1)) continue
    piece.push({
      x,
      y: unsungY(place.hz, set.register, at.staff),
      thick: UNSUNG_RIBBON * Math.min(1, place.level * gain),
    })
  }
  end()
}
