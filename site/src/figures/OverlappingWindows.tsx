// The windows of frames that overlap, one thin line for each frame, and over them the one line
// they add up to. The lab gives the family as a picture (a column for each frame's window, a row
// for each instant) and the sum as a curve over the same stretch of time.

import { useLab, waitingText } from '../lab/page.ts'
import { EDGE, drawGrid, useCanvas } from './canvas.ts'
import { label as number, rangeOf, toUnit } from './draw.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

interface Props {
  /** A frames tap: each column is one frame's window across the stretch shown. */
  windows: TapRef
  /** A curve tap: all of them added. */
  sum: TapRef
  min?: number
  max?: number
  /** A word or two for the time axis. */
  xTitle?: string
  height?: number
  label: string
}

export default function OverlappingWindows({
  windows,
  sum,
  min = 0,
  max = 1.5,
  xTitle,
  height = 220,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const waiting = waitingText(state)
  const family = result?.taps[windows.id]
  const total = result?.taps[sum.id]
  const each = family?.channels_data[0]
  const all = total?.channels_data[0]
  const columns = family?.columns ?? 0
  const hasData = !waiting && each !== undefined && all !== undefined && columns > 0
  const [lowest, highest] = all && all.length > 0 ? rangeOf(all) : [0, 0]
  const flat = Math.abs(highest - lowest) < 1e-4

  const canvas = useCanvas(
    (context, width, fullHeight, c) => {
      const w = width - EDGE.left - EDGE.right
      const h = fullHeight - EDGE.top - EDGE.bottom
      if (w <= 0 || h <= 0) return
      const x = { min: total?.x0 ?? 0, max: total?.x1 ?? 1 }
      const y = { min, max }
      const px = (value: number) => EDGE.left + toUnit(x, value) * w
      const py = (value: number) => EDGE.top + (1 - toUnit(y, value)) * h

      drawGrid(context, c, w, h, { axis: x, at: px }, { axis: y, at: py })
      if (xTitle) {
        context.fillStyle = c.muted
        context.textAlign = 'right'
        context.textBaseline = 'bottom'
        context.fillText(xTitle, EDGE.left + w - 6, EDGE.top + h - 4)
      }
      if (!hasData || !each || !all) return

      context.save()
      context.beginPath()
      context.rect(EDGE.left, EDGE.top, w, h)
      context.clip()
      context.lineJoin = 'round'
      const rows = Math.floor(each.length / columns)
      const across = (i: number, n: number) => EDGE.left + (n > 1 ? i / (n - 1) : 0) * w

      // Each frame's window, where it is not zero.
      context.strokeStyle = c.role[windows.role]
      context.lineWidth = 1.2
      for (let col = 0; col < columns; col += 1) {
        context.beginPath()
        let pen = false
        for (let row = 0; row < rows; row += 1) {
          const value = each[col * rows + row]!
          const before = row > 0 ? each[col * rows + row - 1]! : 0
          const after = row + 1 < rows ? each[col * rows + row + 1]! : 0
          if (value <= 0 && before <= 0 && after <= 0) {
            pen = false
            continue
          }
          if (pen) context.lineTo(across(row, rows), py(value))
          else context.moveTo(across(row, rows), py(value))
          pen = true
        }
        context.stroke()
      }

      // And what they add up to.
      context.strokeStyle = c.role[sum.role]
      context.lineWidth = 2.2
      context.beginPath()
      for (let i = 0; i < all.length; i += 1) {
        if (i === 0) context.moveTo(across(i, all.length), py(all[i]!))
        else context.lineTo(across(i, all.length), py(all[i]!))
      }
      context.stroke()
      context.restore()
    },
    [result, waiting, height, min, max],
  )

  return (
    <div className="fig-plot" data-figure data-drawn={hasData ? '' : undefined}>
      <div className="fig-canvas" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label} />
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend">
        <li>
          <i style={{ background: `var(${ROLE_VAR[windows.role]})` }} />
          {windows.name}
        </li>
        <li>
          <i style={{ background: `var(${ROLE_VAR[sum.role]})` }} />
          {sum.name}
          {hasData && <b>{flat ? number(highest) : `${number(lowest)} to ${number(highest)}`}</b>}
        </li>
      </ul>
    </div>
  )
}
