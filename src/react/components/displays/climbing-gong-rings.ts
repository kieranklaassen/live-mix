// The rings of Climbing Gong's display: where a tone and a time stand on the
// half gong, and how a level is drawn there.

import { INK, clamp, fillBetween, lerp, type Box, type Point } from '../display-kit'
import { type DisplayFrame, type DisplayView } from '../plate-display'
import { GONG_STEPS } from './climbing-gong-law'

/** The hub, where the key's ring stands, as a share of the gong. */
export const GONG_HUB = 0.17
/** A tone this far under a full stroke's ground is no thicker than its ring. */
export const GONG_FLOOR_DB = -46
/** The thickest ring, in pixels. */
const THICK = 6

export interface GongLayout {
  cx: number
  cy: number
  rx: number
  ry: number
  head: number
  words: number
  foot: Box
}

export function gongLayout(size: Pick<DisplayView, 'width' | 'height'>): GongLayout {
  const cy = size.height - 19
  return {
    cx: size.width / 2,
    cy,
    rx: size.width / 2 - 6,
    ry: cy - 8,
    head: 12,
    words: size.height - 10,
    foot: { x: 4, y: size.height - 7, w: size.width - 8, h: 3 },
  }
}

/** Where a place from the hub (0) to the rim (1) stands, so far round the gong. */
export function gongPoint(at: GongLayout, out: number, turn: number): Point {
  const far = lerp(GONG_HUB, 1, out)
  const angle = Math.PI * turn
  return [at.cx - at.rx * far * Math.cos(angle), at.cy - at.ry * far * Math.sin(angle)]
}

/** How far out a tone's ring is, on a metal whose highest tone has the ratio `top`. */
export const gongOut = (ratio: number, top: number): number =>
  clamp(Math.log(ratio) / Math.log(top), 0, 1)

/** How thick each ring may be, in pixels: never so thick that it runs into the one beside it. */
export function gongRooms(outs: readonly number[], at: GongLayout): number[] {
  return outs.map((out) => {
    let gap = 1
    for (const other of outs) if (other !== out) gap = Math.min(gap, Math.abs(other - out))
    return clamp(0.8 * gap * (1 - GONG_HUB) * at.ry, 1, THICK)
  })
}

/** How much of its full thickness a level has. */
export function gongShare(level: number): number {
  if (!(level > 0)) return 0
  return clamp(1 - (20 * Math.log10(level)) / GONG_FLOOR_DB, 0, 1)
}

/** One tone from a step of the round to another, as thick as it is loud at each, up to `room`. */
export function drawRing(
  frame: Pick<DisplayFrame, 'ctx'>,
  at: GongLayout,
  out: number,
  room: number,
  from: number,
  to: number,
  level: (step: number) => number,
  colour: string,
): void {
  const outer: Point[] = []
  const inner: Point[] = []
  for (let i = from; i <= to; i++) {
    const half = (0.5 * room * gongShare(level(i))) / at.ry / (1 - GONG_HUB)
    outer.push(gongPoint(at, out + half, i / GONG_STEPS))
    inner.push(gongPoint(at, out - half, i / GONG_STEPS))
  }
  fillBetween(frame.ctx, outer, inner, colour, INK.trace)
}

/** The hill of a rung over its stretch of the gong, as high as the rung is alight. */
export function drawHill(
  frame: Pick<DisplayFrame, 'ctx'>,
  at: GongLayout,
  low: number,
  high: number,
  from: number,
  to: number,
  level: (step: number) => number,
  colour: string,
  roar: number,
): void {
  const outer: Point[] = []
  const inner: Point[] = []
  for (let i = from; i <= to; i++) {
    outer.push(gongPoint(at, lerp(low, high, gongShare(level(i))), i / GONG_STEPS))
    inner.push(gongPoint(at, low, i / GONG_STEPS))
  }
  fillBetween(frame.ctx, outer, inner, colour, lerp(0.1, 0.6, roar))
}
