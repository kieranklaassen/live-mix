// A delay line as a ring: a few slots in a circle, a head that writes and a head that reads, and
// one click sent round. On the left the ring after the step looked at: what every slot holds as
// a bar from the inside edge, the slot just written marked W and the slot just read marked R. On
// the right the same run against time: what the write head wrote and what the read head read at
// every step, with a line at the step looked at. The reader steps through it, or lets it run.
//
// The picture is SVG, so the page as built carries it at the lab's starting values and it is
// there with scripts off; the buttons that step it come with the scripts.

import { useEffect, useState } from 'react'
import { useLab, waitingText } from '../lab/page.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** The lab's three taps as they stood when the site was built, at its starting values. */
export interface BuiltRing {
  /** What each slot holds after each step: a step's slots one after another. */
  slots: number[]
  /** How many steps the run has. */
  steps: number
  /** For each step, the slot written and what was written there. */
  writeSlot: number[]
  written: number[]
  /** For each step, the slot read and what was read there. */
  readSlot: number[]
  read: number[]
}

interface Props {
  /** A frames tap: every slot after every step, a column a step. */
  slots: TapRef
  /** Curve taps of two rows: the slot the head stood on at each step, and its value there. */
  write: TapRef
  read: TapRef
  built?: BuiltRing
  /** The step shown before the reader moves it. */
  start?: number
  label: string
}

const SIDE = 360
const MIDDLE = SIDE / 2
const INNER = 64
const OUTER = 128
const STRIP = { width: 420, height: 300, left: 34, right: 12 }
/** The two rows of the strip: the top and the bottom of each. */
const ROWS = [
  { top: 30, bottom: 124 },
  { top: 168, bottom: 262 },
] as const
const MONO = { fontFamily: 'var(--lm-font-mono)', fontSize: 11, fill: 'var(--lm-muted)' } as const
const hair = { fill: 'none', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' } as const

const role = (name: keyof typeof ROLE_VAR) => `var(${ROLE_VAR[name]})`
/** A value as the key prints it: as few digits as say it. */
const said = (value: number) => String(Number(value.toFixed(3)))

export default function DelayRing({ slots, write, read, built, start = 12, label }: Props) {
  const state = useLab()
  const result = state.result
  const liveSlots = result?.taps[slots.id]
  const liveWrite = result?.taps[write.id]?.channels_data
  const liveRead = result?.taps[read.id]?.channels_data
  const live = liveSlots && liveSlots.columns > 0 && liveWrite?.[1] && liveRead?.[1]

  const steps = live ? liveSlots.columns : (built?.steps ?? 0)
  const held: ArrayLike<number> = live ? liveSlots.channels_data[0]! : (built?.slots ?? [])
  const writeSlot: ArrayLike<number> = live ? liveWrite![0]! : (built?.writeSlot ?? [])
  const written: ArrayLike<number> = live ? liveWrite![1]! : (built?.written ?? [])
  const readSlot: ArrayLike<number> = live ? liveRead![0]! : (built?.readSlot ?? [])
  const readValue: ArrayLike<number> = live ? liveRead![1]! : (built?.read ?? [])
  const has = steps > 1 && held.length >= steps
  const count = has ? Math.round(held.length / steps) : 16
  const last = Math.max(0, steps - 1)

  const [asked, setStep] = useState(start)
  const [running, setRunning] = useState(false)
  const step = Math.min(asked, last)
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setStep((now) => Math.min(last, now + 1)), 380)
    return () => clearInterval(timer)
  }, [running, last])
  // A run stops by itself at the last step.
  useEffect(() => {
    if (running && step >= last) setRunning(false)
  }, [running, step, last])

  // The tallest thing in the run: a bar of that height fills its slot.
  let top = 1
  for (let i = 0; i < held.length; i += 1) top = Math.max(top, Math.abs(held[i]!))
  for (let n = 0; n < steps; n += 1) top = Math.max(top, Math.abs(written[n] ?? 0))
  // Up to the next half, so that the number beside the strip is a short one.
  top = Math.ceil(top * 2 - 1e-6) / 2

  // ---- the ring ----
  const turn = (2 * Math.PI) / count
  const point = (radius: number, angle: number) =>
    `${(MIDDLE + radius * Math.cos(angle)).toFixed(1)},${(MIDDLE + radius * Math.sin(angle)).toFixed(1)}`
  const middleOf = (slot: number) => slot * turn - Math.PI / 2
  const sector = (slot: number, from: number, to: number, inset = 0) => {
    const a0 = middleOf(slot) - turn / 2 + inset
    const a1 = middleOf(slot) + turn / 2 - inset
    return `M${point(to, a0)}A${to},${to} 0 0 1 ${point(to, a1)}L${point(from, a1)}A${from},${from} 0 0 0 ${point(from, a0)}Z`
  }
  const at = (radius: number, slot: number) => ({
    x: MIDDLE + radius * Math.cos(middleOf(slot)),
    y: MIDDLE + radius * Math.sin(middleOf(slot)),
  })
  const writing = Math.round(writeSlot[step] ?? 0)
  const reading = Math.round(readSlot[step] ?? 0)

  // ---- the strip ----
  const plotW = STRIP.width - STRIP.left - STRIP.right
  const sx = (n: number) => STRIP.left + (last > 0 ? n / last : 0) * plotW
  const sy = (row: (typeof ROWS)[number], value: number) =>
    row.bottom - (Math.min(top, Math.max(0, value)) / top) * (row.bottom - row.top - 16)
  const lines = [
    { tap: write, values: written, row: ROWS[0], colour: role(write.role) },
    { tap: read, values: readValue, row: ROWS[1], colour: role(read.role) },
  ]
  const rounds: number[] = []
  for (let n = 0; n <= last; n += count) rounds.push(n)

  const waiting = has ? undefined : waitingText(state)

  return (
    <div className="fig-plot" data-figure data-drawn={has ? '' : undefined}>
      <div className="controls">
        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            className="button quiet"
            disabled={!has || (step === 0 && !running)}
            onClick={() => {
              setRunning(false)
              setStep(0)
            }}
          >
            To the start
          </button>
          <button
            type="button"
            className="button quiet"
            disabled={!has || step <= 0}
            onClick={() => {
              setRunning(false)
              setStep(Math.max(0, step - 1))
            }}
          >
            Back a step
          </button>
          <button
            type="button"
            className="button quiet"
            disabled={!has || step >= last}
            onClick={() => {
              setRunning(false)
              setStep(Math.min(last, step + 1))
            }}
          >
            On a step
          </button>
          <button
            type="button"
            className="button quiet"
            disabled={!has}
            aria-pressed={running}
            onClick={() => {
              if (!running && step >= last) setStep(0)
              setRunning(!running)
            }}
          >
            {running ? 'Stop' : 'Run'}
          </button>
          <output
            aria-live="off"
            style={{ fontFamily: 'var(--lm-font-mono)', fontSize: '0.78rem', marginLeft: 'auto' }}
          >
            {`step ${step} of ${last}`}
          </output>
        </div>
      </div>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'center' }}
        role="img"
        aria-label={label}
      >
        <svg
          viewBox={`0 0 ${SIDE} ${SIDE}`}
          style={{ flex: '5 1 240px', minWidth: 0, maxWidth: 400, display: 'block' }}
          aria-hidden="true"
        >
          {has &&
            Array.from({ length: count }, (_, slot) => {
              const value = held[step * count + slot] ?? 0
              const tall = (Math.min(top, Math.abs(value)) / top) * (OUTER - INNER)
              const name = at(OUTER + 11, slot)
              const inside = at(INNER - 13, slot)
              return (
                <g key={slot}>
                  <path
                    d={sector(slot, INNER, OUTER)}
                    style={{ ...hair, stroke: 'var(--sig-grid)', fill: 'var(--lm-panel)' }}
                  />
                  {tall > 0.5 && (
                    <path
                      d={sector(slot, INNER, INNER + tall, 0.035)}
                      style={{ fill: role(slots.role), opacity: 0.85 }}
                    />
                  )}
                  <text
                    x={name.x}
                    y={name.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ ...MONO, fontSize: 10 }}
                  >
                    {slot}
                  </text>
                  {value !== 0 && (
                    <text
                      x={inside.x}
                      y={inside.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ ...MONO, fontSize: 10, fill: 'var(--lm-text)' }}
                    >
                      {said(value)}
                    </text>
                  )}
                </g>
              )
            })}
          {has &&
            [
              { slot: writing, letter: 'W', colour: role(write.role) },
              { slot: reading, letter: 'R', colour: role(read.role) },
            ].map(({ slot, letter, colour }) => {
              const mark = at(OUTER + 40, slot)
              return (
                <g key={letter}>
                  <path d={sector(slot, OUTER + 21, OUTER + 29, 0.02)} style={{ fill: colour }} />
                  <path
                    d={sector(slot, INNER, OUTER)}
                    style={{ ...hair, stroke: colour, strokeWidth: 2.4 }}
                  />
                  <text
                    x={mark.x}
                    y={mark.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ ...MONO, fontSize: 13, fontWeight: 700, fill: colour }}
                  >
                    {letter}
                  </text>
                </g>
              )
            })}
          {has && (
            <>
              <text
                x={MIDDLE}
                y={MIDDLE - 9}
                textAnchor="middle"
                dominantBaseline="middle"
                style={MONO}
              >
                after step
              </text>
              <text
                x={MIDDLE}
                y={MIDDLE + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ ...MONO, fontSize: 20, fill: 'var(--lm-text)' }}
              >
                {step}
              </text>
            </>
          )}
        </svg>
        <svg
          viewBox={`0 0 ${STRIP.width} ${STRIP.height}`}
          style={{ flex: '7 1 280px', minWidth: 0, display: 'block' }}
          aria-hidden="true"
        >
          {/* Where the write head comes round to slot 0 again. */}
          {has &&
            rounds.map((n) => (
              <g key={n}>
                {ROWS.map((row) => (
                  <path
                    key={row.top}
                    d={`M${sx(n)},${row.top}V${row.bottom}`}
                    style={{ ...hair, stroke: 'var(--lm-grid-line)' }}
                  />
                ))}
                <text x={sx(n)} y={ROWS[1].bottom + 15} textAnchor="middle" style={MONO}>
                  {n}
                </text>
              </g>
            ))}
          <text x={STRIP.left + plotW} y={ROWS[1].bottom + 31} textAnchor="end" style={MONO}>
            steps, one a sample
          </text>
          {lines.map(({ tap, values, row, colour }) => (
            <g key={tap.id}>
              <path
                d={`M${STRIP.left},${row.bottom}H${STRIP.left + plotW}`}
                style={{ ...hair, stroke: 'var(--sig-grid)' }}
              />
              <text x={STRIP.left} y={row.top - 8} style={MONO}>
                {tap.name}: its value at each step
              </text>
              <text
                x={STRIP.left - 6}
                y={row.bottom}
                textAnchor="end"
                dominantBaseline="middle"
                style={MONO}
              >
                0
              </text>
              <text
                x={STRIP.left - 6}
                y={sy(row, top)}
                textAnchor="end"
                dominantBaseline="middle"
                style={MONO}
              >
                {said(top)}
              </text>
              {has &&
                Array.from({ length: steps }, (_, n) => {
                  const value = values[n] ?? 0
                  if (value === 0) return null
                  return (
                    <g key={n} style={{ opacity: n <= step ? 1 : 0.28 }}>
                      <path
                        d={`M${sx(n)},${row.bottom}V${sy(row, value)}`}
                        style={{ ...hair, stroke: colour, strokeWidth: 2 }}
                      />
                      <circle cx={sx(n)} cy={sy(row, value)} r={3} style={{ fill: colour }} />
                    </g>
                  )
                })}
            </g>
          ))}
          {has &&
            ROWS.map((row) => (
              <path
                key={row.top}
                d={`M${sx(step)},${row.top}V${row.bottom + 3}`}
                style={{ ...hair, stroke: 'var(--lm-text)', strokeDasharray: '3 3' }}
              />
            ))}
        </svg>
      </div>
      {waiting && <p style={{ color: 'var(--lm-muted)', fontSize: '0.86rem' }}>{waiting}</p>}
      <ul className="fig-legend key" style={{ paddingLeft: 0 }}>
        <li>
          <i style={{ background: role(slots.role), height: 8 }} />
          {slots.name}
        </li>
        <li>
          <i style={{ background: role(write.role) }} />
          {write.name}, W{has && <b>{`slot ${writing} takes ${said(written[step] ?? 0)}`}</b>}
        </li>
        <li>
          <i style={{ background: role(read.role) }} />
          {read.name}, R{has && <b>{`slot ${reading} gives ${said(readValue[step] ?? 0)}`}</b>}
        </li>
      </ul>
    </div>
  )
}
