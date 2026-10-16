// The grains a device started, as a cloud: time across, and down the picture how far behind the
// write point each grain reads. A grain is a bead: as long as it sounds, as thick as its window
// is open, lying level when it reads at the speed of the recording, climbing towards the write
// point when it reads faster and falling away when it reads slower or backwards.
//
// The lab lays the grains out as a picture of six rows, one column a grain: when it starts (s),
// how long it lasts (s), how far behind it starts reading (ms), its speed (below zero:
// backwards), its gain, and 1 for a grain to pick out.

import { useEffect, useRef } from 'react'
import { pagePlayer, useLab, waitingText } from '../lab/page.ts'
import { EDGE, drawGrid, useCanvas } from './canvas.ts'
import { label as number, loopAxis, roomyAxis } from './draw.ts'
import { linesAt } from './Plot.tsx'
import { ROLE_VAR, type TapRef } from './roles.ts'

interface Props {
  tap: TapRef
  /** Where the stretch shown starts and how long it is, in seconds. The whole loop when left out. */
  from?: number
  span?: number
  /** Controls in milliseconds drawn as a level line across the picture: [id, name] pairs. */
  lines?: [string, string][]
  /** Milliseconds behind at the bottom of the picture; fitted to the grains when left out. */
  max?: number
  height?: number
  label: string
}

const ROWS = 6
/** Points along each edge of a bead. */
const STEPS = 12

export default function GrainCloud({
  tap,
  from = 0,
  span,
  lines = [],
  max,
  height = 220,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const waiting = waitingText(state)
  const found = result?.taps[tap.id]
  const data = found?.channels_data[0]
  const count = found?.columns ?? 0
  const hasData = !waiting && data !== undefined && count > 0
  const { seconds, length } = loopAxis(result, from, span)
  const playing = state.playing
  const line = useRef<HTMLDivElement | null>(null)

  const marks = linesAt(lines, state.values)

  // The deepest any grain reads, over the whole loop, so the scale holds still as the stretch moves.
  let deepest = 0
  let picked = false
  if (data) {
    for (let g = 0; g < count; g += 1) {
      const lasts = data[g * ROWS + 1]!
      const behind = data[g * ROWS + 2]!
      const rate = data[g * ROWS + 3]!
      deepest = Math.max(deepest, behind, behind - (rate - 1) * lasts * 1000)
      if (data[g * ROWS + 5] === 1) picked = true
    }
  }
  for (const mark of marks) deepest = Math.max(deepest, mark.y)
  const bottom = max ?? roomyAxis(0, Math.max(deepest, 1)).max

  const canvas = useCanvas(
    (context, width, fullHeight, c) => {
      const w = width - EDGE.left - EDGE.right
      const h = fullHeight - EDGE.top - EDGE.bottom
      if (w <= 0 || h <= 0) return
      const px = (at: number) => EDGE.left + ((at - from) / length) * w
      const py = (behind: number) => EDGE.top + (behind / bottom) * h

      drawGrid(
        context,
        c,
        w,
        h,
        { axis: { min: from, max: from + length }, at: px },
        { axis: { min: 0, max: bottom }, at: py },
      )
      context.fillStyle = c.muted
      context.textAlign = 'left'
      context.textBaseline = 'top'
      context.fillText('the write point: now', EDGE.left + 6, EDGE.top + 5)
      context.textBaseline = 'bottom'
      context.fillText('ms behind it', EDGE.left + 6, EDGE.top + h - 4)
      context.textAlign = 'right'
      context.fillText('seconds', EDGE.left + w - 6, EDGE.top + h - 4)

      if (!hasData || !data) return
      context.save()
      context.beginPath()
      context.rect(EDGE.left, EDGE.top, w, h)
      context.clip()

      for (const mark of marks) {
        const at = Math.round(py(mark.y)) + 0.5
        context.strokeStyle = c.muted
        context.setLineDash([3, 3])
        context.beginPath()
        context.moveTo(EDGE.left, at)
        context.lineTo(EDGE.left + w, at)
        context.stroke()
        context.setLineDash([])
      }

      // Thick enough to see a bead's shape, thin enough for a spray of them to stay apart.
      const fat = Math.max(3, Math.min(8, h / 22))
      const bead = (g: number) => {
        const start = data[g * ROWS]!
        const lasts = data[g * ROWS + 1]!
        const behind = data[g * ROWS + 2]!
        const rate = data[g * ROWS + 3]!
        if (start + lasts < from || start > from + length) return
        const x0 = px(start)
        const x1 = px(start + lasts)
        // Reading faster than the recording runs, a grain gains on the write point.
        const y0 = py(behind)
        const y1 = py(behind - (rate - 1) * lasts * 1000)
        if (x1 - x0 < 2.5) {
          context.fillRect(
            x0,
            Math.min(y0, y1) - fat * 0.6,
            Math.max(1, x1 - x0),
            Math.abs(y1 - y0) + fat * 1.2,
          )
          return
        }
        context.beginPath()
        for (let k = 0; k <= STEPS; k += 1) {
          const part = k / STEPS
          const open = 0.5 - 0.5 * Math.cos(2 * Math.PI * part)
          const x = x0 + (x1 - x0) * part
          const y = y0 + (y1 - y0) * part - fat * open
          if (k === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        for (let k = STEPS; k >= 0; k -= 1) {
          const part = k / STEPS
          const open = 0.5 - 0.5 * Math.cos(2 * Math.PI * part)
          context.lineTo(x0 + (x1 - x0) * part, y0 + (y1 - y0) * part + fat * open)
        }
        context.closePath()
        context.fill()
      }
      context.fillStyle = c.role[tap.role]
      context.globalAlpha = 0.55
      for (let g = 0; g < count; g += 1) if (data[g * ROWS + 5] !== 1) bead(g)
      context.globalAlpha = 1
      context.fillStyle = c.role.alt
      for (let g = 0; g < count; g += 1) if (data[g * ROWS + 5] === 1) bead(g)

      // The lines' names, over the beads, each on a patch of the page so it can be read.
      context.textAlign = 'right'
      context.textBaseline = 'middle'
      for (const mark of marks) {
        const wide = context.measureText(mark.text).width
        const at = Math.max(EDGE.top + 8, Math.min(EDGE.top + h - 8, py(mark.y) - fat - 9))
        context.fillStyle = c.bg
        context.globalAlpha = 0.85
        context.fillRect(EDGE.left + w - 9 - wide, at - 7, wide + 6, 14)
        context.globalAlpha = 1
        context.fillStyle = c.muted
        context.fillText(mark.text, EDGE.left + w - 6, at)
      }
      context.restore()
    },
    [result, waiting, from, length, bottom, height, JSON.stringify(marks)],
  )

  // The line that moves with the loop.
  useEffect(() => {
    const bar = line.current
    if (!bar) return
    if (!playing || !hasData) {
      bar.style.display = 'none'
      return
    }
    let frame = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      const box = canvas.current
      const at = pagePlayer().position()
      const unit = at === null ? NaN : (at - from) / length
      if (!box || !(unit >= 0 && unit <= 1)) {
        bar.style.display = 'none'
        return
      }
      bar.style.display = 'block'
      bar.style.transform = `translateX(${EDGE.left + unit * (box.clientWidth - EDGE.left - EDGE.right)}px)`
    }
    move()
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, hasData, result, from, length])

  const each = seconds > 0 ? count / seconds : 0
  return (
    <div className="fig-plot" data-figure data-drawn={hasData ? '' : undefined}>
      <div className="fig-canvas" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label} />
        <div ref={line} className="fig-playhead" style={{ display: 'none' }} />
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend">
        <li>
          <i style={{ background: `var(${ROLE_VAR[tap.role]})` }} />A grain: as long as it sounds,
          as thick as its window is open
        </li>
        {picked && (
          <li>
            <i style={{ background: `var(${ROLE_VAR.alt})` }} />
            The grain looked at
          </li>
        )}
        {hasData && (
          <li className="at">
            <b>{count}</b> grains in the loop, <b>{number(Math.round(each * 10) / 10)}</b> a second
          </li>
        )}
      </ul>
    </div>
  )
}
