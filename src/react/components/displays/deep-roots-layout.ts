// Where things stand in the picture of Deep Roots: its scale of pitch, the keys
// and the tips across it, a root's way down, and the two points that are dragged.

import { clamp, follow, type Box, type Point } from '../display-kit'
import { type DisplayHandle, type DisplayView } from '../plate-display'
import { type DeepKey, type DeepRoot, type DeepState } from './deep-roots-growth'
import { hzOfKey } from './instrument-parts'

type Size = Pick<DisplayView, 'width' | 'height'>

/** The ends of the scale of pitch. */
export const DEEP_LOW_HZ = 26
export const DEEP_HIGH_HZ = 1200
/** The key Reach is drawn from: the highest of the chord at rest. */
export const DEEP_REACH_FROM = hzOfKey(76)

export interface DeepLayout {
  head: { left: number; right: number; baseline: number }
  /** The scale of pitch runs over its height; the keys stand across it. */
  pitch: Box
  /** The bass's partials end here, at the right. */
  partials: Box
  rail: number
  foot: Box
}

export function deepLayout(size: Size): DeepLayout {
  const [left, right] = [4, size.width - 4]
  const foot: Box = { x: left, y: size.height - 8, w: right - left, h: 4 }
  const top = 15
  const h = foot.y - 3 - top
  const wide = Math.round((right - left) * 0.11)
  const pitch = { x: left + 9, y: top, w: right - left - 9 - wide - 3, h }
  return {
    head: { left, right, baseline: 12 },
    pitch,
    partials: { x: right - wide, y: top, w: wide, h },
    rail: left + 3.5,
    foot,
  }
}

const SPAN = Math.log(DEEP_HIGH_HZ / DEEP_LOW_HZ)
/** Where a pitch stands; one off the scale stands at its edge. */
export const deepY = (hz: number, box: Box): number =>
  box.y + box.h * (1 - clamp(Math.log(Math.max(hz, 1) / DEEP_LOW_HZ) / SPAN, 0, 1))
export const deepHz = (y: number, box: Box): number =>
  DEEP_LOW_HZ * Math.exp(SPAN * clamp(1 - (y - box.y) / box.h, 0, 1))

/** A root's way from its key to its tip, as the soil lets it through. */
export function deepWay(soil: number, from: Point, to: Point, share: number): Point[] {
  const points: Point[] = []
  const steps = 12
  for (let i = 0; i <= Math.ceil(steps * share); i++) {
    const t = Math.min(i / steps, share)
    const bent = t * t * (3 - 2 * t)
    // Stone lets a root through in steps, chalk straight down its cracks; the others bend it.
    const across = soil === 4 ? Math.floor(t * 3 + 0.5) / 3 : soil === 3 ? t : bent
    points.push([from[0] + (to[0] - from[0]) * across, from[1] + (to[1] - from[1]) * t])
  }
  return points
}

/** Where the keys and the tips stand across the picture; they slide there when the chord changes. */
export function deepPlace(state: DeepState, box: Box, dt: number): number {
  const order = [...state.keys].sort((a, b) => a.hz - b.hz)
  const slot = box.w / Math.max(order.length, 1)
  const slide = (x: number, to: number): number => (x < 0 ? to : follow(x, to, dt, 0.12, 0.12))
  order.forEach((key, i) => (key.x = slide(key.x, box.x + (i + 0.5) * slot)))
  for (const root of state.roots) {
    const across = root.parents.filter((key) => key.x >= 0).map((key) => key.x)
    if (root.key && across.length <= 1) {
      // An octave goes straight down; a twelfth and the rest to a side by their place in the octave.
      const aside = Math.sin(2 * Math.PI * Math.log2(root.den / root.num))
      root.x = slide(root.x, root.key.x + aside * Math.min(slot, 26) * 0.42)
    } else if (across.length > 0) {
      const low = Math.min(...across)
      root.x = slide(root.x, (low + Math.max(...across)) / 2)
    }
  }
  return slot
}

/** The keys a root hangs from: those that lie above it, of a root above them all the highest. */
export function deepFeeders(root: DeepRoot, state: DeepState): DeepKey[] {
  const keys = root.parents.filter((key) => key.x >= 0 && state.keys.includes(key))
  const above = keys.filter((key) => key.hz > root.hz * 1.01)
  const highest = keys.reduce<DeepKey[]>(
    (top, key) => (key.hz > (top[0]?.hz ?? 0) ? [key] : top),
    [],
  )
  return above.length > 0 ? above : highest
}

export function deepHandles(view: DisplayView): [DisplayHandle, DisplayHandle] {
  const { pitch, rail, foot } = deepLayout(view)
  const bounded = (name: string, value: number): Record<string, number> => {
    const spec = view.spec(name)
    return { [name]: spec ? clamp(value, spec.min, spec.max) : value }
  }
  const from = (name: string) => () => bounded(name, view.spec(name)?.default ?? 0)
  const floor = view.value('floor')
  const reach = view.value('reach')
  return [
    {
      ...{ key: 'floor', name: 'Floor', x: foot.x + foot.w - 2, y: deepY(floor, pitch) },
      drag: (_x, y) => bounded('floor', deepHz(y, pitch)),
      wheel: (steps) => bounded('floor', floor * Math.pow(2, steps / 12)),
      reset: from('floor'),
    },
    {
      ...{ key: 'reach', name: 'Reach', x: rail, y: deepY(DEEP_REACH_FROM / 2 ** reach, pitch) },
      drag: (_x, y) => bounded('reach', Math.log2(DEEP_REACH_FROM / deepHz(y, pitch))),
      wheel: (steps) => bounded('reach', reach - steps * 0.1),
      reset: from('reach'),
    },
  ]
}
