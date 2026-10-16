// The picture every figure of lines is made of: axes, a grid, one line per signal, a readout
// under the pointer, and a line that moves with the loop while it plays. Wave, Trace, Curve and
// Spectrum each say what to draw; this draws it.

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { pagePlayer, useLab } from '../lab/page.ts'
import { EDGE, MONO, useCanvas } from './canvas.ts'
import { fromUnit, label, minMaxPlaced, ticks, toUnit, withUnit, type Axis } from './draw.ts'
import { ROLE_VAR, type Role } from './roles.ts'

export interface Series {
  key: string
  name: string
  role: Role
  /** The points, standing evenly from `x0` to `x1`. Left out while there is nothing to draw. */
  ys?: ArrayLike<number>
  x0: number
  x1: number
  /** The points stand in even ratios from `x0` to `x1`, as a response against frequency does. */
  xLog?: boolean
  unit?: string
  /** Each point as a stalk from zero, for a signal shown sample by sample. */
  stems?: boolean
  dashed?: boolean
}

export interface PlotAxis extends Axis {
  unit?: string
  /** A word or two printed in the corner of the picture. */
  title?: string
}

/** A straight line across the picture at a value: a threshold, a cutoff. */
export interface Mark {
  x?: number
  y?: number
  text: string
}

/** A line across the picture at the value of each control named: [id, name] pairs. */
export const linesAt = (controls: [string, string][], values: Record<string, number>) =>
  controls.flatMap(([id, name]) =>
    values[id] === undefined ? [] : [{ y: values[id], text: name }],
  )

/** A line up the picture at the value of each control named: [id, name] pairs. */
export const uprightsAt = (controls: [string, string][], values: Record<string, number>) =>
  controls.flatMap(([id, name]) =>
    values[id] === undefined ? [] : [{ x: values[id], text: name }],
  )

interface Props {
  /** What the picture shows, for a reader who cannot see it. */
  label: string
  series: Series[]
  x: PlotAxis
  y: PlotAxis
  height?: number
  marks?: Mark[]
  /** Said in place of the picture while the lab has none to give. */
  waiting?: string
  /** Where on the x axis the moving line stands when the loop is `seconds` in; null hides it. */
  cursor?: (seconds: number) => number | null
  /** Put a dot on the first line where the moving line crosses it. */
  dot?: boolean
  /** Changes when the data does. */
  stamp: unknown
}

function valueAt(series: Series, x: number): number | undefined {
  const ys = series.ys
  if (!ys || ys.length === 0) return undefined
  if (ys.length === 1 || series.x1 === series.x0) return ys[0]
  const place =
    (series.xLog
      ? Math.log(x / series.x0) / Math.log(series.x1 / series.x0)
      : (x - series.x0) / (series.x1 - series.x0)) *
    (ys.length - 1)
  if (place < -0.5 || place > ys.length - 0.5) return undefined
  return ys[Math.min(ys.length - 1, Math.max(0, Math.round(place)))]
}

export default function Plot(props: Props) {
  const { series, x, y, marks = [], waiting, cursor, dot } = props
  const height = props.height ?? 200
  const playing = useLab().playing
  const [hover, setHover] = useState<number | null>(null)
  const line = useRef<HTMLDivElement | null>(null)
  const spot = useRef<HTMLDivElement | null>(null)
  const hasData = !waiting && series.some((one) => one.ys && one.ys.length > 0)

  const canvas = useCanvas(
    (context, width, fullHeight, c) => {
      const w = width - EDGE.left - EDGE.right
      const h = fullHeight - EDGE.top - EDGE.bottom
      if (w <= 0 || h <= 0) return
      const px = (value: number) => EDGE.left + toUnit(x, value) * w
      const py = (value: number) => EDGE.top + (1 - toUnit(y, value)) * h

      // The grid and its numbers.
      context.font = MONO
      context.lineWidth = 1
      context.textBaseline = 'middle'
      context.textAlign = 'right'
      for (const value of ticks(y, Math.max(2, Math.round(h / 44)))) {
        const at = Math.round(py(value)) + 0.5
        context.strokeStyle = value === 0 ? c.line : c.grid
        context.beginPath()
        context.moveTo(EDGE.left, at)
        context.lineTo(EDGE.left + w, at)
        context.stroke()
        context.fillStyle = c.muted
        context.fillText(label(value), EDGE.left - 6, at)
      }
      context.textBaseline = 'top'
      context.textAlign = 'center'
      const xTicks = ticks(x, Math.max(2, Math.round(w / 90)))
      let lastLabelEnd = -Infinity
      for (const value of xTicks) {
        const at = Math.round(px(value)) + 0.5
        context.strokeStyle = c.grid
        context.beginPath()
        context.moveTo(at, EDGE.top)
        context.lineTo(at, EDGE.top + h)
        context.stroke()
        const text = label(value)
        const half = context.measureText(text).width / 2
        if (at - half > lastLabelEnd + 6 && at + half <= width) {
          context.fillStyle = c.muted
          context.fillText(text, at, EDGE.top + h + 6)
          lastLabelEnd = at + half
        }
      }
      context.strokeStyle = c.line
      context.strokeRect(EDGE.left + 0.5, EDGE.top + 0.5, w - 1, h - 1)
      context.fillStyle = c.muted
      context.textBaseline = 'top'
      context.textAlign = 'left'
      if (y.title) context.fillText(y.title, EDGE.left + 6, EDGE.top + 5)
      context.textAlign = 'right'
      context.textBaseline = 'bottom'
      if (x.title) context.fillText(x.title, EDGE.left + w - 6, EDGE.top + h - 4)

      if (waiting) return
      context.save()
      context.beginPath()
      context.rect(EDGE.left, EDGE.top, w, h)
      context.clip()

      for (const mark of marks) {
        context.strokeStyle = c.muted
        context.setLineDash([3, 3])
        context.beginPath()
        if (mark.y !== undefined) {
          const at = Math.round(py(mark.y)) + 0.5
          context.moveTo(EDGE.left, at)
          context.lineTo(EDGE.left + w, at)
          context.stroke()
          context.setLineDash([])
          context.fillStyle = c.muted
          context.textAlign = 'right'
          context.textBaseline = at - EDGE.top > 16 ? 'bottom' : 'top'
          context.fillText(mark.text, EDGE.left + w - 6, at + (at - EDGE.top > 16 ? -3 : 3))
        } else if (mark.x !== undefined) {
          const at = Math.round(px(mark.x)) + 0.5
          context.moveTo(at, EDGE.top)
          context.lineTo(at, EDGE.top + h)
          context.stroke()
          context.setLineDash([])
          context.fillStyle = c.muted
          const left = at - EDGE.left > w / 2
          context.textAlign = left ? 'right' : 'left'
          context.textBaseline = 'top'
          context.fillText(mark.text, at + (left ? -5 : 5), EDGE.top + 18)
        }
        context.setLineDash([])
      }

      for (const one of series) {
        const ys = one.ys
        if (!ys || ys.length === 0) continue
        const colour = c.role[one.role]
        const n = ys.length
        const xOf = (i: number) =>
          n === 1
            ? one.x0
            : one.xLog
              ? one.x0 * Math.pow(one.x1 / one.x0, i / (n - 1))
              : one.x0 + ((one.x1 - one.x0) * i) / (n - 1)
        context.strokeStyle = colour
        context.fillStyle = colour
        context.lineJoin = 'round'
        context.setLineDash(one.dashed ? [5, 4] : [])

        // How many points are in view decides how they are drawn.
        let first = 0
        let last = n - 1
        if (!x.log && !one.xLog && one.x1 !== one.x0 && n > 1) {
          const at = (value: number) => ((value - one.x0) / (one.x1 - one.x0)) * (n - 1)
          const a = at(x.min)
          const b = at(x.max)
          first = Math.max(0, Math.floor(Math.min(a, b)) - 1)
          last = Math.min(n - 1, Math.ceil(Math.max(a, b)) + 1)
        }
        const inView = last - first + 1
        if (inView <= 0) continue

        if (inView > 3 * w) {
          // More points than pixels: each pixel column holds the least and the most of its points.
          const columns = Math.max(1, Math.floor(w))
          const ends = minMaxPlaced(ys, (i) => toUnit(x, xOf(i)), columns, first, last + 1)
          const filled: number[] = []
          for (let col = 0; col < columns; col += 1)
            if (!Number.isNaN(ends[2 * col])) filled.push(col)
          if (filled.length === 0) continue
          const at = (col: number) => EDGE.left + ((col + 0.5) / columns) * w
          context.beginPath()
          filled.forEach((col, k) => {
            const top = py(ends[2 * col + 1]!)
            if (k === 0) context.moveTo(at(col), top)
            else context.lineTo(at(col), top)
          })
          for (let k = filled.length - 1; k >= 0; k -= 1) {
            const col = filled[k]!
            context.lineTo(at(col), py(ends[2 * col]!))
          }
          context.closePath()
          context.globalAlpha = 0.85
          context.fill()
          context.globalAlpha = 1
          context.lineWidth = 1
          context.stroke()
          continue
        }

        if (one.stems) {
          const zero = py(Math.min(Math.max(0, y.min), y.max))
          context.lineWidth = 1
          for (let i = first; i <= last; i += 1) {
            const at = px(xOf(i))
            const top = py(ys[i]!)
            context.beginPath()
            context.moveTo(at, zero)
            context.lineTo(at, top)
            context.stroke()
            if (inView < w / 5) {
              context.beginPath()
              context.arc(at, top, 2.2, 0, Math.PI * 2)
              context.fill()
            }
          }
          continue
        }

        context.lineWidth = 1.6
        context.beginPath()
        let pen = false
        for (let i = first; i <= last; i += 1) {
          const value = ys[i]!
          const at = px(xOf(i))
          if (!Number.isFinite(value) || !Number.isFinite(at)) {
            pen = false
            continue
          }
          if (pen) context.lineTo(at, py(value))
          else context.moveTo(at, py(value))
          pen = true
        }
        context.stroke()
        if (inView < w / 8) {
          for (let i = first; i <= last; i += 1) {
            context.beginPath()
            context.arc(px(xOf(i)), py(ys[i]!), 2.2, 0, Math.PI * 2)
            context.fill()
          }
        }
      }
      context.restore()
    },
    [props.stamp, waiting, x.min, x.max, x.log, y.min, y.max, height, JSON.stringify(marks)],
  )

  // The line that moves with the loop.
  useEffect(() => {
    const bar = line.current
    const point = spot.current
    if (!bar) return
    if (!playing || !cursor || !hasData) {
      bar.style.display = 'none'
      if (point) point.style.display = 'none'
      return
    }
    let frame = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      const box = canvas.current
      const seconds = pagePlayer().position()
      const at = seconds === null ? null : cursor(seconds)
      const unit = at === null ? NaN : toUnit(x, at)
      if (!box || !(unit >= 0 && unit <= 1)) {
        bar.style.display = 'none'
        if (point) point.style.display = 'none'
        return
      }
      const w = box.clientWidth - EDGE.left - EDGE.right
      const h = box.clientHeight - EDGE.top - EDGE.bottom
      const left = EDGE.left + unit * w
      bar.style.display = 'block'
      bar.style.transform = `translateX(${left}px)`
      const first = series[0]
      const value = dot && first && at !== null ? valueAt(first, at) : undefined
      if (point && value !== undefined) {
        point.style.display = 'block'
        const top = EDGE.top + (1 - Math.min(1, Math.max(0, toUnit(y, value)))) * h
        point.style.transform = `translate(${left}px, ${top}px)`
      } else if (point) point.style.display = 'none'
    }
    move()
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, hasData, props.stamp, x.min, x.max, y.min, y.max])

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const unit = (event.clientX - box.left - EDGE.left) / (box.width - EDGE.left - EDGE.right)
    setHover(unit >= 0 && unit <= 1 ? fromUnit(x, unit) : null)
  }
  const hoverLeft =
    hover === null
      ? undefined
      : `calc(${EDGE.left}px + ${toUnit(x, hover)} * (100% - ${EDGE.left + EDGE.right}px))`

  return (
    <div className="fig-plot" data-figure data-drawn={hasData ? '' : undefined}>
      <div
        className="fig-canvas"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <canvas ref={canvas} role="img" aria-label={props.label} />
        <div ref={line} className="fig-playhead" style={{ display: 'none' }} />
        {dot && <div ref={spot} className="fig-dot" style={{ display: 'none' }} />}
        {hover !== null && hasData && <div className="fig-hover" style={{ left: hoverLeft }} />}
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend">
        {series.map((one) => {
          const value = hover === null ? undefined : valueAt(one, hover)
          return (
            <li key={one.key}>
              <i
                style={{ background: `var(${ROLE_VAR[one.role]})` }}
                className={one.dashed ? 'dashed' : undefined}
              />
              {one.name}
              {value !== undefined && <b>{withUnit(value, one.unit ?? y.unit ?? '')}</b>}
            </li>
          )
        })}
        {hover !== null && hasData && <li className="at">at {withUnit(hover, x.unit ?? '')}</li>}
      </ul>
    </div>
  )
}
