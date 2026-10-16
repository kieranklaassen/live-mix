// The bins of one frame as turning vectors. Each bin is a vector of a length and a starting angle
// that turns a whole number of times across the frame; laid tip to tail, the height their chain
// reaches at sample n is the frame's value there. On the left the chain, on the right the frame
// and what the chain rebuilds, on one scale, so the tip can be carried across to the curve.

import { useEffect, useId, useState } from 'react'
import { useLab, waitingText } from '../lab/page.ts'
import { SAMPLE_RATE } from '../lab/rate.ts'
import { EDGE, MONO, useCanvas } from './canvas.ts'
import { label as numberLabel, minMaxColumns, peakOf, ticks } from './draw.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

const GAP = 14
/** How long the chain takes to turn through the whole frame, in milliseconds. */
const SWEEP_MS = 12_000

interface Props {
  /** The bins as the lab keeps them: real parts and imaginary parts, bin 0 to bin N/2. */
  real: TapRef
  imag: TapRef
  /** The N samples the bins were made from, and the same rebuilt from the bins kept. */
  frame: TapRef
  rebuilt: TapRef
  /** The control that says how many bins are kept: [id, name]. */
  count: [string, string]
  height?: number
  label: string
}

export default function TurningVectors({
  real,
  imag,
  frame,
  rebuilt,
  count,
  height = 300,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const re = result?.taps[real.id]?.channels_data[0]
  const im = result?.taps[imag.id]?.channels_data[0]
  const xs = result?.taps[frame.id]?.channels_data[0]
  const ys = result?.taps[rebuilt.id]?.channels_data[0]
  const size = xs?.length ?? 0
  const has = Boolean(re && im && xs && ys && size > 1 && re.length === size / 2 + 1)
  const kept = Math.min(
    Math.max(1, Math.round(state.values[count[0]] ?? 1)),
    has ? size / 2 + 1 : 1,
  )
  // Where in the frame the chain is shown, 0 to 1, so it keeps its place when the frame's length changes.
  const [place, setPlace] = useState(0.47)
  const [turning, setTurning] = useState(false)
  const n = has ? Math.min(size - 1, Math.round(place * (size - 1))) : 0
  const id = useId()

  useEffect(() => {
    if (!turning || !has) return
    let frameId = 0
    let last = performance.now()
    const step = (now: number) => {
      frameId = requestAnimationFrame(step)
      const moved = (now - last) / SWEEP_MS
      last = now
      setPlace((at) => (at + moved) % 1)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [turning, has])

  // The chain at sample n: one vector for each bin kept. A bin and its mirror turn opposite ways
  // and their sideways parts cancel, so the pair is drawn as one vector of twice the length.
  let tip = 0
  const chain: number[] = [0, 0]
  const lengths: number[] = []
  if (has && re && im) {
    let across = 0
    for (let k = 0; k < kept; k += 1) {
      const alone = k === 0 || k === size / 2
      const length = ((alone ? 1 : 2) * Math.hypot(re[k]!, im[k]!)) / size
      const angle = (2 * Math.PI * k * n) / size + Math.atan2(im[k]!, re[k]!)
      tip += length * Math.cos(angle)
      across += length * Math.sin(angle)
      chain.push(across, tip)
      lengths.push(length)
    }
  }

  const canvas = useCanvas(
    (context, width, fullHeight, c) => {
      const h = fullHeight - EDGE.top - EDGE.bottom
      const room = width - EDGE.left - EDGE.right - GAP
      if (h <= 0 || room <= 40) return
      const turnW = Math.min(h, Math.round(room * 0.42))
      const waveW = room - turnW
      const turnX = EDGE.left
      const waveX = EDGE.left + turnW + GAP
      const mid = EDGE.top + h / 2
      const peak = has && xs && ys ? Math.max(peakOf(xs), peakOf(ys), 1e-6) : 1
      const scale = h / 2 / (peak * 1.15)
      const py = (value: number) => mid - value * scale
      const px = (sample: number) => waveX + (sample / Math.max(1, size - 1)) * waveW

      // The grid: one scale for both halves.
      context.font = MONO
      context.lineWidth = 1
      context.textBaseline = 'middle'
      context.textAlign = 'right'
      for (const value of ticks({ min: -peak * 1.15, max: peak * 1.15 }, 4)) {
        const at = Math.round(py(value)) + 0.5
        context.strokeStyle = value === 0 ? c.line : c.grid
        context.beginPath()
        context.moveTo(turnX, at)
        context.lineTo(waveX + waveW, at)
        context.stroke()
        context.fillStyle = c.muted
        context.fillText(numberLabel(value), EDGE.left - 6, at)
      }
      context.strokeStyle = c.line
      context.strokeRect(turnX + 0.5, EDGE.top + 0.5, turnW - 1, h - 1)
      context.strokeRect(waveX + 0.5, EDGE.top + 0.5, waveW - 1, h - 1)
      context.fillStyle = c.muted
      context.textBaseline = 'top'
      context.textAlign = 'left'
      context.fillText('the vectors', turnX + 6, EDGE.top + 5)
      context.fillText('the frame', waveX + 6, EDGE.top + 5)
      if (!has || !xs || !ys) return

      // Milliseconds under the frame.
      const lastMs = ((size - 1) / SAMPLE_RATE) * 1000
      context.textAlign = 'center'
      for (const value of ticks({ min: 0, max: lastMs }, Math.max(2, Math.round(waveW / 70)))) {
        const at = waveX + (value / lastMs) * waveW
        const text = numberLabel(value)
        const half = context.measureText(text).width / 2
        if (at + half <= width) context.fillText(text, Math.max(at, waveX + half), EDGE.top + h + 6)
      }
      context.textAlign = 'right'
      context.textBaseline = 'bottom'
      context.fillText('milliseconds', waveX + waveW - 6, EDGE.top + h - 4)

      // The frame and what the bins kept rebuild.
      const line = (data: Float32Array, colour: string, weight: number) => {
        context.strokeStyle = colour
        context.fillStyle = colour
        context.lineWidth = weight
        context.lineJoin = 'round'
        const columns = Math.max(1, Math.floor(waveW))
        context.beginPath()
        if (data.length > 2 * columns) {
          const ends = minMaxColumns(data, 0, data.length, columns)
          for (let col = 0; col < columns; col += 1) {
            const at = waveX + ((col + 0.5) / columns) * waveW
            if (col === 0) context.moveTo(at, py(ends[1]!))
            context.lineTo(at, py(ends[2 * col + 1]!))
            context.lineTo(at, py(ends[2 * col]!))
          }
        } else {
          for (let i = 0; i < data.length; i += 1) {
            if (i === 0) context.moveTo(px(i), py(data[i]!))
            else context.lineTo(px(i), py(data[i]!))
          }
        }
        context.stroke()
      }
      context.save()
      context.beginPath()
      context.rect(waveX, EDGE.top, waveW, h)
      context.clip()
      line(xs, c.role.in, 1.4)
      line(ys, c.role.out, 1.6)
      context.restore()

      // The chain, with the real axis pointing up: a vector at angle 0 stands upright.
      const centre = turnX + turnW / 2
      const cx = (across: number) => centre - across * scale
      context.save()
      context.beginPath()
      context.rect(turnX, EDGE.top, turnW, h)
      context.clip()
      // The circle each of the longer vectors turns on.
      context.strokeStyle = c.line
      context.lineWidth = 1
      let circles = 0
      for (let k = 0; k < lengths.length && circles < 14; k += 1) {
        const radius = lengths[k]! * scale
        if (k === 0 || radius < 5) continue
        context.beginPath()
        context.arc(cx(chain[2 * k]!), py(chain[2 * k + 1]!), radius, 0, Math.PI * 2)
        context.stroke()
        circles += 1
      }
      context.strokeStyle = c.role.ctl
      context.fillStyle = c.role.ctl
      context.lineWidth = 2
      context.lineJoin = 'round'
      context.beginPath()
      for (let p = 0; p < chain.length; p += 2) {
        if (p === 0) context.moveTo(cx(chain[p]!), py(chain[p + 1]!))
        else context.lineTo(cx(chain[p]!), py(chain[p + 1]!))
      }
      context.stroke()
      // A dot at the tail of every vector long enough to see.
      for (let k = 0; k < lengths.length; k += 1) {
        if (lengths[k]! * scale < 4) continue
        context.beginPath()
        context.arc(cx(chain[2 * k]!), py(chain[2 * k + 1]!), 2.4, 0, Math.PI * 2)
        context.fill()
      }
      context.restore()

      // From the tip across to the frame, at the sample shown.
      const tipX = Math.min(turnX + turnW, Math.max(turnX, cx(chain[chain.length - 2]!)))
      const tipY = py(tip)
      const sampleX = px(n)
      context.strokeStyle = c.muted
      context.lineWidth = 1
      context.setLineDash([3, 3])
      context.beginPath()
      context.moveTo(tipX, Math.round(tipY) + 0.5)
      context.lineTo(sampleX, Math.round(tipY) + 0.5)
      context.moveTo(Math.round(sampleX) + 0.5, EDGE.top)
      context.lineTo(Math.round(sampleX) + 0.5, EDGE.top + h)
      context.stroke()
      context.setLineDash([])
      context.fillStyle = c.role.out
      for (const at of [tipX, sampleX]) {
        context.beginPath()
        context.arc(at, tipY, 3.5, 0, Math.PI * 2)
        context.fill()
      }
    },
    [result, kept, n, height, has],
  )

  const waiting = waitingText(state)
  return (
    <div className="fig-plot" data-figure data-drawn={has ? '' : undefined}>
      <div className="controls">
        <div className="control" data-control="sample">
          <label className="control-name" htmlFor={id}>
            Sample shown
          </label>
          <output className="control-value" htmlFor={id}>
            {has ? `${n} of ${size}` : '0'}
          </output>
          <input
            id={id}
            type="range"
            min={0}
            max={Math.max(1, size - 1)}
            step={1}
            value={n}
            disabled={!has}
            onChange={(event) => {
              setTurning(false)
              setPlace(Number(event.target.value) / Math.max(1, size - 1))
            }}
          />
        </div>
        <div className="control" role="group" aria-label="Turn the vectors through the frame">
          <span className="control-name">Through the frame</span>
          <span className="control-choices">
            <button
              type="button"
              role="switch"
              aria-checked={turning}
              disabled={!has}
              onClick={() => setTurning((on) => !on)}
            >
              {turning ? 'Stop' : 'Turn'}
            </button>
          </span>
        </div>
      </div>
      <div className="fig-canvas" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label} />
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend key">
        <li>
          <i style={{ background: `var(${ROLE_VAR.ctl})` }} />
          {kept} {kept === 1 ? 'vector' : 'vectors'}, tip to tail
        </li>
        <li>
          <i style={{ background: `var(${ROLE_VAR.in})` }} />
          {frame.name}
        </li>
        <li>
          <i style={{ background: `var(${ROLE_VAR.out})` }} />
          {rebuilt.name}
          {has && <b>{numberLabel(tip)}</b>}
        </li>
      </ul>
    </div>
  )
}
