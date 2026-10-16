// A picture of a sound's spectrum as it changes: time across, frequency up, level as colour.
// The lab lays it out in columns, one per frame of its short-time transform.

import { useLab, waitingText } from '../lab/page.ts'
import { SAMPLE_RATE } from '../lab/rate.ts'
import { EDGE, MONO, rgbOf, useCanvas } from './canvas.ts'
import { label as number, ticks } from './draw.ts'
import type { TapRef } from './roles.ts'

interface Props {
  tap: TapRef
  /** Decibels drawn as the background and as the brightest colour. */
  min?: number
  max?: number
  /** Hertz at the bottom row and the top row of the lab's picture; 0 to half the sample rate when left out. */
  rowMin?: number
  rowMax?: number
  /** Only rows up to this frequency are drawn. */
  top?: number
  height?: number
  label: string
}

export default function Spectrogram({
  tap,
  min = -90,
  max = 0,
  rowMin = 0,
  rowMax = SAMPLE_RATE / 2,
  top,
  height = 220,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const waiting = waitingText(state)
  const found = result?.taps[tap.id]
  const data = found?.channels_data[0]
  const columns = found?.columns ?? 0
  const hasData = !waiting && data !== undefined && columns > 0
  const shown = Math.min(top ?? rowMax, rowMax)

  const canvas = useCanvas(
    (context, width, fullHeight, c) => {
      const w = width - EDGE.left - EDGE.right
      const h = fullHeight - EDGE.top - EDGE.bottom
      if (w <= 0 || h <= 0) return
      context.font = MONO
      if (hasData && found && data) {
        const rows = Math.floor(data.length / columns)
        const rowsShown = Math.max(
          1,
          Math.round(((shown - rowMin) / (rowMax - rowMin)) * (rows - 1)) + 1,
        )
        const quiet = rgbOf(c.bg)
        const mid = rgbOf(c.role.ctl)
        const loud = rgbOf(c.role.out)
        const image = new ImageData(columns, rowsShown)
        for (let col = 0; col < columns; col += 1) {
          for (let row = 0; row < rowsShown; row += 1) {
            const unit = Math.min(1, Math.max(0, (data[col * rows + row]! - min) / (max - min)))
            const [from, to, t] =
              unit < 0.6 ? [quiet, mid, unit / 0.6] : [mid, loud, (unit - 0.6) / 0.4]
            const at = ((rowsShown - 1 - row) * columns + col) * 4
            image.data[at] = from[0] + (to[0] - from[0]) * t
            image.data[at + 1] = from[1] + (to[1] - from[1]) * t
            image.data[at + 2] = from[2] + (to[2] - from[2]) * t
            image.data[at + 3] = 255
          }
        }
        const small = document.createElement('canvas')
        small.width = columns
        small.height = rowsShown
        small.getContext('2d')?.putImageData(image, 0, 0)
        context.imageSmoothingEnabled = columns < w
        context.drawImage(small, EDGE.left, EDGE.top, w, h)
      }
      context.strokeStyle = c.line
      context.lineWidth = 1
      context.strokeRect(EDGE.left + 0.5, EDGE.top + 0.5, w - 1, h - 1)
      context.fillStyle = c.muted
      context.textAlign = 'right'
      context.textBaseline = 'middle'
      for (const value of ticks({ min: rowMin, max: shown }, Math.max(2, Math.round(h / 44)))) {
        context.fillText(
          number(value),
          EDGE.left - 6,
          EDGE.top + (1 - (value - rowMin) / (shown - rowMin)) * h,
        )
      }
      context.textAlign = 'center'
      context.textBaseline = 'top'
      const x0 = found?.x0 ?? 0
      const x1 = found?.x1 ?? 1
      for (const value of ticks({ min: x0, max: x1 }, Math.max(2, Math.round(w / 90)))) {
        context.fillText(
          number(value),
          EDGE.left + ((value - x0) / (x1 - x0 || 1)) * w,
          EDGE.top + h + 6,
        )
      }
    },
    [result, waiting, height, min, max, shown],
  )

  return (
    <div className="fig-plot" data-figure data-drawn={hasData ? '' : undefined}>
      <div className="fig-canvas" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label} />
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend key">
        <li>
          <i className="ramp" />
          {tap.name}: seconds across, hertz up, from {number(min)} dB (the page's colour) to{' '}
          {number(max)} dB
        </li>
      </ul>
    </div>
  )
}
