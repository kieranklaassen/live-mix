// Taps stacked on one time axis, a lane each: the sound going in, what the device works out
// along the way, the sound coming out. A sound is drawn as the space between its smallest and
// largest sample, every sound to one scale so that two can be compared by eye; a value is drawn
// as a line in a range of its own. A sound named in `own` is drawn to its own peak, and says
// its range as a value does, for a lab where one sound is far larger than the others. Each lane
// is named beside it, as the lab names the signal; in a narrow column the name stands above its
// lane, in one line, where beside it a long name would run to five. A sound of two channels is
// drawn by its left, and its lane says so; with `channels="both"` it has a lane for each.

import { useEffect, useMemo, useRef, useState } from 'react'
import { pagePlayer, useLab, waitingText } from '../lab/page.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { MONO, plateText, useCanvas } from './canvas.ts'
import {
  label as number,
  laneRows,
  loopAxis,
  minMaxColumns,
  peakOf,
  rangeOf,
  roomyAxis,
  soundPeaks,
  tickLabels,
  ticks,
  toUnit,
} from './draw.ts'
import { valueWithUnit } from '../lib/parts.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** A lane's height, the room between two lanes, and the row of numbers under the last. */
const LANE = 64
const GAP = 3
const AXIS = 18
/** The row a lane's name takes over its lane, where the names stand above. */
const NAME = 20
/** The names stand above their lanes in a figure narrower than this, in pixels. */
const NARROW = 480

/** A sound's own scale as its lane says it: its peak to two figures, below nothing and above. */
function ownRange(peak: number): string {
  const size = +peak.toPrecision(2)
  return `${number(-size)} to ${number(size)}`
}

interface Props {
  taps: TapRef[]
  /** The bottom and the top of a value's lane, by tap id; fitted to the signal when left out. */
  ranges?: Record<string, [number, number]>
  /** A control drawn as a dashed line across a value's lane: [control id, its name] by tap id. */
  lines?: Record<string, [string, string]>
  /** Sounds drawn each to its own peak, by tap id, and not to the scale the other sounds share. */
  own?: string[]
  /** Where the stretch shown starts and how long it is, in seconds. The whole loop when left out. */
  from?: number
  span?: number
  /** `both` gives each channel of a sound that has two a lane of its own; left out, its left. */
  channels?: 'left' | 'both'
  label: string
}

export default function Lanes({
  taps,
  ranges = {},
  lines = {},
  own = [],
  from = 0,
  span,
  channels = 'left',
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const waiting = waitingText(state)
  const { length, scale, x } = loopAxis(result, from, span)
  const playhead = useRef<HTMLDivElement | null>(null)

  // Whether the names stand above their lanes: by the figure's own width, so that it holds in
  // a narrow column of a wide page as on a phone.
  const root = useRef<HTMLDivElement | null>(null)
  const [above, setAbove] = useState(false)
  useEffect(() => {
    const box = root.current
    if (!box) return
    const sizes = new ResizeObserver(() => setAbove(box.clientWidth < NARROW))
    sizes.observe(box)
    return () => sizes.disconnect()
  }, [])
  /** From one lane's top to the next, and where the first lane starts. */
  const lead = above ? NAME : 0
  const pitch = lead + LANE + GAP

  // What each lane holds, and the range it is drawn in.
  const lanes = useMemo(() => {
    const found = laneRows(taps, channels).map((row) => {
      const { tap } = row
      const data = result?.taps[tap.id]
      const ys = data?.channels_data[row.channel]
      if (!data || !ys || ys.length === 0)
        return { ...row, ys: undefined, a: undefined, b: undefined }
      // A value has a point for every sixteen samples; a sound has one for each.
      const rate = SAMPLE_RATE / (data.kind === 'control' ? CONTROL_PERIOD : 1)
      const a = Math.max(0, Math.floor(from * rate))
      const b = Math.min(ys.length, Math.ceil((from + length) * rate) + 1)
      return { ...row, ys, a, b }
    })
    // Every sound to the scale of the loudest of them, but one named in `own` to its own. The
    // two channels of one sound share a scale: the larger of their peaks.
    const loudest = new Map<string, number>()
    for (const one of found) {
      if (one.tap.kind !== 'audio') continue
      const peak = one.ys ? peakOf(one.ys, one.a, one.b) : 0
      loudest.set(one.tap.id, Math.max(peak, loudest.get(one.tap.id) ?? 0))
    }
    const peaks = soundPeaks(
      [...loudest].map(([id, peak]) => ({ id, peak })),
      own,
    )
    return found.map((one) => {
      if (one.tap.kind === 'audio') {
        const peak = peaks[one.tap.id]!
        return { ...one, min: -peak, max: peak, ranged: own.includes(one.tap.id) }
      }
      const given = ranges[one.tap.id]
      if (given) return { ...one, min: given[0], max: given[1], ranged: true }
      const [lo, hi] = one.ys ? rangeOf(one.ys, one.a, one.b) : [0, 1]
      return { ...one, ...roomyAxis(lo, hi), ranged: true }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, taps, channels, from, length, JSON.stringify(ranges), own.join(' ')])
  const hasData = !waiting && lanes.some((lane) => lane.ys !== undefined)
  const marks = lanes.map(({ tap }) => {
    const line = lines[tap.id]
    const value = line && state.values[line[0]]
    return line && value !== undefined ? { name: line[1], value } : undefined
  })

  const height = lanes.length * pitch - GAP + AXIS
  const canvas = useCanvas(
    (context, width, _height, c) => {
      context.font = MONO
      const xTicks = ticks(x, Math.max(2, Math.round(width / 90)))
      lanes.forEach((lane, index) => {
        const top = index * pitch + lead
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
          // The dashed line's label, after the line it could be struck out by.
          if (mark) {
            const at = Math.round(py(mark.value)) + 0.5
            context.textAlign = 'right'
            context.textBaseline = at - top > 16 ? 'bottom' : 'top'
            plateText(context, c, mark.name, width - 5, at + (at - top > 16 ? -3 : 3), c.sunken)
          }
        }
        context.restore()
      })

      // One row of numbers for all of the lanes. What they count stands at the row's right
      // end, and a number that would run into it is left out.
      const base = lanes.length * pitch - GAP
      context.fillStyle = c.muted
      context.textBaseline = 'top'
      const titleStart = width - context.measureText(x.title).width
      let lastEnd = -Infinity
      const xText = tickLabels(xTicks)
      for (const [index, value] of xTicks.entries()) {
        const text = xText[index]!
        const half = context.measureText(text).width / 2
        const at = Math.min(width - half, Math.max(half, toUnit(x, value) * width))
        if (at - half <= lastEnd + 6 || at + half >= titleStart - 6) continue
        context.textAlign = 'center'
        context.fillText(text, at, base + 5)
        lastEnd = at + half
      }
      context.textAlign = 'right'
      context.fillText(x.title, width, base + 5)
    },
    [lanes, waiting, x.min, x.max, height, above, JSON.stringify(marks)],
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
    <div
      ref={root}
      className="lanes"
      data-names={above ? 'above' : undefined}
      data-figure
      data-drawn={hasData ? '' : undefined}
    >
      {/* The key: every lane named beside it, or above it, in the colour it is drawn in. */}
      <ul className="lanes-names key">
        {lanes.map((lane) => {
          // Under the name: which side a sound of two channels is drawn by, and a lane's range.
          const range = !lane.ranged
            ? undefined
            : lane.tap.kind === 'audio'
              ? ownRange(lane.max)
              : `${number(lane.min)} to ${valueWithUnit(lane.max, lane.tap.unit)}`
          const under = [lane.side, range].filter(Boolean).join(', ')
          return (
            <li key={lane.key} style={{ height: lead + LANE }}>
              <span className="lanes-name">
                <i style={{ background: `var(${ROLE_VAR[lane.tap.role]})` }} />
                {lane.name}
              </span>
              {under && <span className="lanes-range">{under}</span>}
            </li>
          )
        })}
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
