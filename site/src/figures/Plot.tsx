// The picture every figure of lines is made of: axes, a grid, one line per signal, a key that
// names each line as the lab does, a readout under the pointer, and a line that moves with the
// loop while it plays. Wave, Trace, Curve and Spectrum each say what to draw; this draws it.

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { pagePlayer, useLab } from '../lab/page.ts'
import { EDGE, MONO, drawGrid, plateText, topEdge, useCanvas } from './canvas.ts'
import { valueWithUnit } from '../lib/parts.ts'
import { fromUnit, minMaxPlaced, namePlaces, toUnit, wholePixel, type Axis } from './draw.ts'
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
  /**
   * A word or two for the axis, written outside the plotted area: the x axis's at the right of the
   * row of numbers under the picture, the y axis's over the picture's top left corner.
   */
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
  // The plotted area starts a row lower where the y axis has a title, which stands in that row.
  const top = topEdge(y.title)

  const canvas = useCanvas(
    (context, width, fullHeight, c) => {
      const w = width - EDGE.left - EDGE.right
      const h = fullHeight - top - EDGE.bottom
      if (w <= 0 || h <= 0) return
      const px = (value: number) => EDGE.left + toUnit(x, value) * w
      const py = (value: number) => top + (1 - toUnit(y, value)) * h

      // The grid writes the axes' titles too, outside the plotted area: no line can run under one.
      drawGrid(
        context,
        c,
        w,
        h,
        { axis: x, at: px, title: x.title },
        { axis: y, at: py, title: y.title },
        top,
      )
      if (waiting) return
      context.save()
      context.beginPath()
      context.rect(EDGE.left, top, w, h)
      context.clip()

      // An upright line's name stands beside it, a row lower where it would run into another's.
      const uprights = marks.filter((mark) => mark.y === undefined && mark.x !== undefined)
      const places = namePlaces(
        uprights.map((mark) => ({
          at: Math.round(px(mark.x!)) + 0.5 - EDGE.left,
          wide: context.measureText(mark.text).width,
        })),
        w,
      )

      // A dashed line's label is written after the lines, so that none runs through it.
      const labels: (() => void)[] = []
      for (const mark of marks) {
        context.strokeStyle = c.muted
        context.setLineDash([3, 3])
        context.beginPath()
        if (mark.y !== undefined) {
          const at = Math.round(py(mark.y)) + 0.5
          context.moveTo(EDGE.left, at)
          context.lineTo(EDGE.left + w, at)
          context.stroke()
          labels.push(() => {
            context.textAlign = 'right'
            context.textBaseline = at - top > 16 ? 'bottom' : 'top'
            plateText(context, c, mark.text, EDGE.left + w - 6, at + (at - top > 16 ? -3 : 3))
          })
        } else if (mark.x !== undefined) {
          const at = Math.round(px(mark.x)) + 0.5
          context.moveTo(at, top)
          context.lineTo(at, top + h)
          context.stroke()
          const place = places[uprights.indexOf(mark)]!
          labels.push(() => {
            context.textAlign = 'left'
            context.textBaseline = 'top'
            plateText(context, c, mark.text, EDGE.left + place.left, top + 5 + place.row * 15)
          })
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
            // On a whole pixel: a stem between two is spread over both, and reads fainter.
            const at = wholePixel(px(xOf(i)))
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
      context.setLineDash([])
      context.font = MONO
      for (const write of labels) write()
      context.restore()
    },
    [
      props.stamp,
      waiting,
      x.min,
      x.max,
      x.log,
      x.title,
      y.min,
      y.max,
      y.title,
      height,
      JSON.stringify(marks),
    ],
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
      const h = box.clientHeight - top - EDGE.bottom
      const left = EDGE.left + unit * w
      bar.style.display = 'block'
      bar.style.transform = `translateX(${left}px)`
      const first = series[0]
      const value = dot && first && at !== null ? valueAt(first, at) : undefined
      if (point && value !== undefined) {
        point.style.display = 'block'
        const down = top + (1 - Math.min(1, Math.max(0, toUnit(y, value)))) * h
        point.style.transform = `translate(${left}px, ${down}px)`
      } else if (point) point.style.display = 'none'
    }
    move()
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, hasData, props.stamp, x.min, x.max, y.min, y.max, top])

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
        <div ref={line} className="fig-playhead" style={{ display: 'none', top }} />
        {dot && <div ref={spot} className="fig-dot" style={{ display: 'none' }} />}
        {hover !== null && hasData && (
          <div className="fig-hover" style={{ left: hoverLeft, top }} />
        )}
        {waiting && (
          <p className="fig-waiting" style={{ top }}>
            {waiting}
          </p>
        )}
      </div>
      {/* The key: a swatch and a name for each line, the name the lab gives the signal. */}
      <ul className="fig-legend key">
        {series.map((one) => {
          const value = hover === null ? undefined : valueAt(one, hover)
          return (
            <li key={one.key}>
              <i
                style={{ background: `var(${ROLE_VAR[one.role]})` }}
                className={one.dashed ? 'dashed' : undefined}
              />
              {one.name}
              {value !== undefined && <b>{valueWithUnit(value, one.unit ?? y.unit ?? '')}</b>}
            </li>
          )
        })}
        {hover !== null && hasData && (
          <li className="at">at {valueWithUnit(hover, x.unit ?? '')}</li>
        )}
      </ul>
    </div>
  )
}
