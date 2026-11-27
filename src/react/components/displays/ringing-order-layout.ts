// Where everything in the Ringing Order display stands, and the places of its
// two points along the line over the ropes.

import { clamp, type Box } from '../display-kit'
import { type DisplayView } from '../plate-display'
import { RINGING_PAGE } from './ringing-order-rows'

/** How many keys the tower shows. */
export const RINGING_LANES = 4
/** The pitches a rope can come from, in octaves over the key. */
const OCTAVES = [-1.2, 5.2] as const

export interface RingingLayout {
  head: number
  /** The line over the ropes, with the two points on it. */
  strip: number
  fan: Box
  ropes: Box
  cover: Box
  lanes: Box
  foot: Box
}

export function ringingLayout({
  width,
  height,
}: Pick<DisplayView, 'width' | 'height'>): RingingLayout {
  const x = 6
  const w = width - 2 * x
  const gutter = Math.round(clamp(width * 0.09, 11, 20))
  const right = x + gutter
  const wide = w - gutter
  const foot = { x, y: height - 8, w, h: 4 }
  const lanes = { x: right, y: foot.y - 2 * RINGING_LANES - 4, w: wide, h: 2 * RINGING_LANES + 1 }
  const cover = { x: right, y: lanes.y - 8, w: wide, h: 5 }
  const ropes = { x: right, y: 25, w: wide, h: cover.y - 26 }
  return { head: 12, strip: 18, fan: { ...ropes, x, w: gutter }, ropes, cover, lanes, foot }
}

/** Where a rope runs, the lowest ringer's at the foot. */
export const ringingRope = (i: number, n: number, box: Box): number =>
  box.y + (box.h * (n - 0.5 - i)) / n

/** Where a pitch stands in the fan. */
export const ringingPitchY = (octave: number, box: Box): number =>
  box.y + box.h * (1 - clamp((octave - OCTAVES[0]) / (OCTAVES[1] - OCTAVES[0]), 0, 1))

/** Where the wedge over the ropes stands: from the second row to the end. */
export const ringingWedge = (box: Box): { x: number; w: number } => {
  const x = box.x + (box.w / RINGING_PAGE) * 1.35
  return { x, w: box.x + box.w - 4 - x }
}
