// Where everything stands in the display of Slow Accord: its parts, its scale
// of time, the line of every partial, and how far off its line one is drawn.

import { clamp, type Box, type Point } from '../display-kit'
import { type DisplayView } from '../plate-display'
import { accordPath, type AccordKey, type AccordSettings } from './slow-accord-ways'

type Size = Pick<DisplayView, 'width' | 'height'>

/** The end of the scale of time, seconds from the strike, and where it stops being even. */
export const ACCORD_SECONDS = 24
const EVEN_SECONDS = 0.15
/** An overtone this far off its tone stands half as far off its line as any can. */
const HALF_CENTS = 90

export interface AccordLayout {
  head: number
  lines: Box
  leftBars: number
  rightBars: number
  bar: number
  band: Box
  foot: Box
}

export function accordLayout(size: Size): AccordLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const bar = Math.round(clamp(box.w * 0.12, 10, 22))
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const x = box.x + bar + 2
  const w = box.w - 2 * bar - 4
  const band: Box = { x, y: foot.y - 18, w, h: 15 }
  // A line may stand over the topmost place by a little: that much is left free under the head.
  const top = box.y + 22
  return {
    head: box.y + 8,
    lines: { x, y: top, w, h: band.y - 3 - top },
    leftBars: x - 2,
    rightBars: x + w + 2,
    bar,
    band,
    foot,
  }
}

/** Where a time after the strike stands across the lines, and back. */
export function accordX(seconds: number, box: Box): number {
  const whole = Math.log1p(ACCORD_SECONDS / EVEN_SECONDS)
  return box.x + (Math.log1p(clamp(seconds, 0, ACCORD_SECONDS) / EVEN_SECONDS) / whole) * box.w
}
export function accordSeconds(x: number, box: Box): number {
  const whole = Math.log1p(ACCORD_SECONDS / EVEN_SECONDS)
  return EVEN_SECONDS * Math.expm1(clamp((x - box.x) / box.w, 0, 1) * whole)
}

/** The height of every partial's line: in the order of the metal, the lowest at the foot. */
export function accordLines(key: AccordKey, box: Box): number[] {
  const order = key.metal.map((_, k) => k).sort((a, b) => key.metal[a] - key.metal[b] || a - b)
  const gap = box.h / order.length
  const lines: number[] = []
  order.forEach((k, i) => (lines[k] = box.y + box.h - (i + 0.5) * gap))
  return lines
}

/** How far off its line a partial stands, in pixels upwards, when it is so many octaves over its tone. */
export function accordOff(octaves: number, gap: number): number {
  const cents = 1200 * octaves
  return (Math.min(gap / 2 + 6, 12) * cents) / (Math.abs(cents) + HALF_CENTS)
}

/** The way of one partial as it is drawn: onto its place, and what it wanders after that. */
export function accordWay(
  set: AccordSettings,
  key: AccordKey,
  k: number,
  y: number,
  at: AccordLayout,
): { onto: Point[]; after: Point[] } {
  const gap = at.lines.h / key.metal.length
  const point = (seconds: number, place: number): Point => [
    accordX(seconds, at.lines),
    y - accordOff(place - key.line[k], gap),
  ]
  const onto: Point[] = [point(0, key.metal[k])]
  const after: Point[] = []
  let place = key.metal[k]
  for (const [n, leg] of key.legs[k].entries()) {
    const start = leg.start - key.on
    if (start >= ACCORD_SECONDS) break
    const points = n === 0 ? onto : after
    if (n === 1) onto.push(point(start, place))
    const wide = accordX(start + leg.span, at.lines) - accordX(start, at.lines)
    const steps = Math.round(clamp(wide, 3, 24))
    for (let i = 0; i <= steps; i++)
      points.push(point(start + (leg.span * i) / steps, accordPath(set, leg, i / steps)))
    place = leg.to
  }
  ;(after.length > 0 ? after : onto).push(point(ACCORD_SECONDS, place))
  return { onto, after }
}
