// Taps stacked on one time axis, a lane each: the sound going in, what the device works out
// along the way, the sound coming out. A sound is drawn as the space between its smallest and
// largest sample, every sound to one scale so that two can be compared by eye; a value is drawn
// as a line in a range of its own. Each lane is named beside it, as the lab names the signal.

import { useEffect, useMemo, useRef } from 'react'
import { pagePlayer, useLab, waitingText } from '../lab/page.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { MONO, useCanvas } from './canvas.ts'
import {
  label as number,
  loopAxis,
  minMaxColumns,
  peakOf,
  rangeOf,
  roomyAxis,
  ticks,
  toUnit,
  withUnit,
} from './draw.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** A lane's height, the room between two lanes, and the row of numbers under the last. */
const LANE = 64
const GAP = 3
const AXIS = 18

interface Props {
  taps: TapRef[]
  /** The bottom and the top of a value's lane, by tap id; fitted to the signal when left out. */
  ranges?: Record<string, [number, number]>
  /** A control drawn as a dashed line across a value's lane: [control id, its name] by tap id. */
  lines?: Record<string, [string, string]>
  /** Where the stretch shown starts and how long it is, in seconds. The whole loop when left out. */
  from?: number
  span?: number
  label: string
}

export default function Lanes({ taps, ranges = {}, lines = {}, from = 0, span, label }: Props) {
  const state = useLab()
  const result = state.result
  const waiting = waitingText(state)
  const { length, scale, x } = loopAxis(result, from, span)
  const playhead = useRef<HTMLDivElement | null>(null)

  // What each lane holds, and the range it is drawn in.
  const lanes = useMemo(() => {
    const found = taps.map((tap) => {
      const data = result?.taps[tap.id]
      const ys = data?.channels_data[0]
      if (!data || !ys || ys.length === 0) return { tap }
      // A value has a point for every sixteen samples; a sound has one for each.
      const rate = SAMPLE_RATE / (data.kind === 'control' ? CONTROL_PERIOD : 1)
      const a = Math.max(0, Math.floor(from * rate))
      const b = Math.min(ys.length, Math.ceil((from + length) * rate) + 1)
      return { tap, ys, a, b }
    })
    // Every sound to the scale of the loudest of them.
    const peak = Math.max(
      1e-6,
      ...found.map((one) =>
        one.ys && one.tap.kind === 'audio' ? peakOf(one.ys, one.a, one.b) : 0,
      ),
    )
    return found.map((one) => {
      if (one.tap.kind === 'audio') return { ...one, min: -peak, max: peak }
      const given = ranges[one.tap.id]
      if (given) return { ...one, min: given[0], max: given[1] }
      const [lo, hi] = one.ys ? rangeOf(one.ys, one.a, one.b) : [0, 1]
      return { ...one, ...roomyAxis(lo, hi) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, taps, from, length, JSON.stringify(ranges)])
  const hasData = !waiting && lanes.some((lane) => lane.ys !== undefined)
  const marks = taps.map((tap) => {
    const line = lines[tap.id]
    const value = line && state.values[line[0]]
    return line && value !== undefined ? { name: line[1], value } : undefined
  })

  const height = taps.length * LANE + (taps.length - 1) * GAP + AXIS
  const canvas = useCanvas(
    (context, width, _height, c) => {
      context.font = MONO
      const xTicks = ticks(x, Math.max(2, Math.round(width / 90)))
      lanes.forEach((lane, index) => {
        const top = index * (LANE + GAP)
        context.fillStyle = c.sunken
        context.fillRect(0, top, width, LANE)
        // The time axis's lines run through every lane.
        context.strokeStyle = c.grid
        context.lineWidth = 1
        for (const value of xTicks) {
          const at = Math.round(toUnit(x, value) * width) + 0.5
          context.beginPath()
          context.moveTo(at, top)
          context.lineTo(at, top + LANE)
          context.stroke()
        }
        const { ys, a, b } = lane
        if (waiting || !ys || a === undefined || b === undefined) return
        const colour = c.role[lane.tap.role]
        const pad = 3
        const py = (value: number) =>
          top + pad + (1 - Math.min(1, Math.max(0, toUnit(lane, value)))) * (LANE - 2 * pad)
        context.save()
        context.beginPath()
        context.rect(0, top, width, LANE)
        context.clip()

        if (lane.tap.kind === 'audio') {
          const ends = minMaxColumns(ys, a, b, Math.max(1, Math.floor(width)))
          context.fillStyle = colour
          for (let col = 0; col < Math.floor(width); col += 1) {
            const lo = ends[2 * col]!
            const hi = ends[2 * col + 1]!
            if (Number.isNaN(lo)) continue
            context.fillRect(col, py(hi), 1, Math.max(1, py(lo) - py(hi)))
          }
        } else {
          const mark = marks[index]
          if (mark) {
            const at = Math.round(py(mark.value)) + 0.5
            context.strokeStyle = c.muted
            context.setLineDash([3, 3])
            context.beginPath()
            context.moveTo(0, at)
            context.lineTo(width, at)
            context.stroke()
            context.setLineDash([])
            context.fillStyle = c.muted
            context.textAlign = 'right'
            context.textBaseline = at - top > 16 ? 'bottom' : 'top'
            context.fillText(mark.name, width - 5, at + (at - top > 16 ? -3 : 3))
          }
          context.strokeStyle = colour
          context.lineWidth = 1.6
          context.lineJoin = 'round'
          context.beginPath()
          for (let i = a; i < b; i += 1) {
            const at = ((i - a) / Math.max(1, b - 1 - a)) * width
            if (i === a) context.moveTo(at, py(ys[i]!))
            else context.lineTo(at, py(ys[i]!))
          }
          context.stroke()
        }
        context.restore()
      })

      // One row of numbers for all of the lanes.
      const base = taps.length * (LANE + GAP) - GAP
      context.fillStyle = c.muted
      context.textBaseline = 'top'
      let lastEnd = -Infinity
      for (const value of xTicks) {
        const text = number(value)
        const half = context.measureText(text).width / 2
        const at = Math.min(width - half, Math.max(half, toUnit(x, value) * width))
        if (at - half <= lastEnd + 6) continue
        context.textAlign = 'center'
        context.fillText(text, at, base + 5)
        lastEnd = at + half
      }
      context.textAlign = 'right'
      if (width - context.measureText(x.title).width - 6 > lastEnd + 6) {
        context.fillText(x.title, width, base + 5)
      }
    },
    [lanes, waiting, x.min, x.max, height, JSON.stringify(marks)],
  )

  // The line that moves with the loop: only while sound does.
  const playing = state.playing
  useEffect(() => {
    const bar = playhead.current
    if (!bar) return
    if (!playing || !hasData) {
      bar.style.display = 'none'
      return
    }
    let frame = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      const seconds = pagePlayer().position()
      const unit = seconds === null ? NaN : toUnit(x, seconds * scale)
      const width = canvas.current?.clientWidth
      if (!width || !(unit >= 0 && unit <= 1)) {
        bar.style.display = 'none'
        return
      }
      bar.style.display = 'block'
      bar.style.transform = `translateX(${unit * width}px)`
    }
    move()
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, hasData, x.min, x.max, scale])

  return (
    <div className="lanes" data-figure data-drawn={hasData ? '' : undefined}>
      {/* The key: every lane named beside it, in the colour it is drawn in. */}
      <ul className="lanes-names key">
        {lanes.map((lane) => (
          <li key={lane.tap.id} style={{ height: LANE }}>
            <span className="lanes-name">
              <i style={{ background: `var(${ROLE_VAR[lane.tap.role]})` }} />
              {lane.tap.name}
            </span>
            {lane.tap.kind !== 'audio' && (
              <span className="lanes-range">
                {number(lane.min)} to {withUnit(lane.max, lane.tap.unit)}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="lanes-picture" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label} />
        <div
          ref={playhead}
          className="fig-playhead lanes-playhead"
          style={{ display: 'none', height: height - AXIS }}
        />
        {waiting && <p className="lanes-waiting">{waiting}</p>}
      </div>
    </div>
  )
}
