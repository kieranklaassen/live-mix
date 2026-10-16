// A fader's scale, marked twice: in decibels along the bottom and, along the top, in the number
// each of those decibels multiplies a sound by. On it stand the sounds the lab measured over the
// whole loop, a row each: a bar as far as the sound's level, and a tick where its tallest sample
// is. A marker on the top edge stands at the gain the output is multiplied by. The numbers are
// the lab's own checks, and a table under the picture prints them.

import { useLab, waitingText } from '../lab/page.ts'
import { EDGE, MONO, useCanvas } from './canvas.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

export interface ScaleRow {
  /** The sound the row is of: its name and its colour. */
  tap: TapRef
  /** The lab's checks that hold the row's numbers, by id: its tallest sample and its level, in dB. */
  peak: string
  level: string
  /** And its loudness, which is printed and not drawn: it is not a height against full scale. */
  loudness?: string
}

interface Props {
  rows: ScaleRow[]
  /** The check that holds the gain, in dB, and what the key calls it. */
  gain: string
  gainName: string
  /** The decibels at the left and the right edge. */
  min?: number
  max?: number
  height?: number
  label: string
}

/** The numbers the top edge is marked with, the first ones written first where room is short. */
const TIMES = [1, 0.1, 0.01, 0.001, 2, 0.5, 4, 0.25, 0.125]
const DIGIT = 6
const BAR = 16

const signed = (value: number, digits = 1) => value.toFixed(digits).replace('-', '−')
const dbOf = (times: number) => 20 * Math.log10(times)

export default function FaderScale({
  rows,
  gain,
  gainName,
  min = -60,
  max = 12,
  height = 190,
  label,
}: Props) {
  const state = useLab()
  const checks = state.result?.checks
  const hasData = checks !== undefined
  const waiting = waitingText(state)
  const read = (id: string | undefined) => (id && checks ? checks[id] : undefined)
  const gainDb = read(gain)
  const numbers = rows.map((row) => [read(row.peak), read(row.level), read(row.loudness)])

  const canvas = useCanvas(
    (context, width, tall, c) => {
      const left = EDGE.left
      const w = width - EDGE.left - EDGE.right
      const top = 30
      const bottom = tall - EDGE.bottom
      const at = (db: number) => left + (w * (Math.min(max, Math.max(min, db)) - min)) / (max - min)
      context.font = MONO
      context.lineWidth = 1

      // The decibels, along the bottom: a line up the picture every 6, a number every 12.
      context.textAlign = 'center'
      context.textBaseline = 'top'
      for (let db = Math.ceil(min / 6) * 6; db <= max; db += 6) {
        const x = Math.round(at(db)) + 0.5
        context.strokeStyle = db === 0 ? c.line : c.grid
        context.beginPath()
        context.moveTo(x, top)
        context.lineTo(x, bottom)
        context.stroke()
        if (db % 12 === 0) {
          context.fillStyle = c.muted
          context.fillText(db === 0 ? '0 dB' : signed(db, 0), x, bottom + 6)
        }
      }
      context.strokeStyle = c.line
      context.strokeRect(left + 0.5, top + 0.5, w - 1, bottom - top - 1)

      // The numbers to multiply by, along the top, each over its own decibels.
      context.textBaseline = 'bottom'
      const taken: [number, number][] = []
      for (const times of TIMES) {
        const db = dbOf(times)
        if (db < min || db > max) continue
        const x = Math.round(at(db)) + 0.5
        context.strokeStyle = c.muted
        context.beginPath()
        context.moveTo(x, top - 5)
        context.lineTo(x, top)
        context.stroke()
        const text = `×${times}`
        const half = (text.length * DIGIT) / 2
        const from = Math.max(left - 30, Math.min(x - half, width - 2 * half - 1))
        if (taken.some(([a, b]) => from < b + 5 && from + 2 * half > a - 5)) continue
        taken.push([from, from + 2 * half])
        context.fillStyle = c.muted
        context.textAlign = 'left'
        context.fillText(text, from, top - 7)
      }
      if (!checks) return

      // The sounds, a row each.
      const room = (bottom - top) / rows.length
      rows.forEach((row, index) => {
        const [peak, level] = numbers[index]!
        if (peak === undefined || level === undefined) return
        const middle = top + room * (index + 0.5)
        const end = at(level)
        const tick = at(peak)
        context.fillStyle = c.role[row.tap.role]
        context.globalAlpha = 0.38
        context.fillRect(left + 1, middle - BAR / 2, Math.max(0, end - left - 1), BAR)
        context.globalAlpha = 1
        // A hairline from the end of the bar to the tick: how far the peak stands over the level.
        context.fillRect(end, middle - 0.5, Math.max(0, tick - end), 1)
        context.fillRect(tick - 1, middle - BAR / 2 - 4, 2, BAR + 8)
        context.textBaseline = 'middle'
        if (level > min) {
          const text = signed(level)
          context.textAlign = 'right'
          context.fillStyle = c.muted
          if (end - left > text.length * DIGIT + 10) context.fillText(text, end - 5, middle)
        }
        if (peak > min) {
          // Over the hairline, to the left of the tick: the gain's marker never stands there.
          const text = signed(peak)
          const wide = text.length * DIGIT
          context.textAlign = 'left'
          context.fillStyle = c.muted
          context.fillText(text, Math.max(tick - wide - 5, left + 3), middle - BAR / 2 - 7)
        }
      })

      // The gain: a marker on the top edge, pointing down at its decibels.
      if (gainDb !== undefined) {
        const x = at(gainDb)
        context.fillStyle = c.role.ctl
        context.beginPath()
        context.moveTo(x - 6, top - 6)
        context.lineTo(x + 6, top - 6)
        context.lineTo(x, top + 5)
        context.closePath()
        context.fill()
        context.fillRect(x - 0.5, top, 1, bottom - top)
      }
    },
    [checks, min, max, height, rows.length],
  )

  const shut = gainDb !== undefined && gainDb <= min - 60
  return (
    <div className="fig-plot fader-scale" data-figure data-drawn={hasData ? '' : undefined}>
      <div className="fig-canvas" style={{ height }}>
        <canvas ref={canvas} role="img" aria-label={label} />
        {waiting && <p className="fig-waiting">{waiting}</p>}
      </div>
      <ul className="fig-legend key">
        {rows.map((row) => (
          <li key={row.tap.id}>
            <i style={{ background: `var(${ROLE_VAR[row.tap.role]})` }} />
            {row.tap.name}
          </li>
        ))}
        <li>
          <i style={{ background: `var(${ROLE_VAR.ctl})` }} />
          {gainName}
        </li>
        <li>a bar reaches the level, a tick stands at the tallest sample</li>
      </ul>
      {hasData && (
        <table className="fader-scale-numbers">
          <thead>
            <tr>
              <th scope="col">Over the whole loop</th>
              <th scope="col">Tallest sample</th>
              <th scope="col">Level</th>
              <th scope="col">Loudness</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const [peak, level, loudness] = numbers[index]!
              const quiet = peak === undefined || peak <= -100
              return (
                <tr key={row.tap.id}>
                  <th scope="row">{row.tap.name}</th>
                  <td>{quiet ? 'silent' : `${signed(peak)} dB`}</td>
                  <td>{quiet || level === undefined ? '' : `${signed(level)} dB`}</td>
                  <td>{quiet || loudness === undefined ? '' : `${signed(loudness)} LUFS`}</td>
                </tr>
              )
            })}
            {gainDb !== undefined && (
              <tr>
                <th scope="row">{gainName}</th>
                <td colSpan={3}>
                  {shut
                    ? 'shut: times 0'
                    : `${signed(gainDb)} dB, which is times ${(10 ** (gainDb / 20)).toPrecision(3)}`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
