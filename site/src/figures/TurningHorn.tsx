// A horn turning past two microphones, seen from above, beside what the left microphone hears
// of it against time. On the left the cabinet from over its top: the horn at the angle it has
// at the instant looked at, the two microphones where Spread puts them, and a line from the
// horn's mouth to each. On the right the values the lab reads at that microphone (the pitch, the
// loudness, left against right), a row each on one time axis, with a line at the same instant.
// The reader moves the instant; while the loop plays it is where the loop is.
//
// The picture is SVG, so the page as built carries it at the lab's starting values and it is
// there with scripts off; the control that moves the instant comes with the scripts.

import { useEffect, useMemo, useRef, useState } from 'react'
import { pagePlayer, useLab, waitingText } from '../lab/page.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** The lab's taps as they stood when the site was built, at its starting values. */
export interface BuiltTurn {
  /** The loop's length, in seconds. */
  seconds: number
  /** The horn's angle in turns, and the drum's, at instants spread evenly through the loop. */
  horn: number[]
  drum: number[]
  /** Each row's values at the same instants, by tap id. */
  rows: Record<string, number[]>
  /** How far each microphone stands from the front, in turns. */
  mic: number
}

interface Props {
  /** Control taps: where the horn points and where the drum points, in turns. */
  horn: TapRef
  drum: TapRef
  /** Control taps drawn against time, a row each. */
  rows: TapRef[]
  /** A curve tap of two points: where the two microphones stand, in turns from the front. */
  mics: TapRef
  built?: BuiltTurn
  /** The instant shown before the reader moves it, in seconds. */
  start?: number
  label: string
}

/** How many points a row is drawn with. */
export const POINTS = 480

/** `count` values of a tap, evenly through it. */
export function thinned(data: ArrayLike<number>, count = POINTS): number[] {
  const out: number[] = []
  if (data.length === 0) return out
  for (let k = 0; k < count; k += 1) out.push(data[Math.floor((k * data.length) / count)]!)
  return out
}

const SIDE = 300
const MIDDLE = { x: SIDE / 2, y: 132 }
const SWEEP = 58 // the circle the horn's mouth runs round
const AWAY = 126 // how far from the middle a microphone is drawn
const STRIP = { width: 440, height: 300, left: 12, right: 12, top: 8 }
const ROW_GAP = 26
const MONO = { fontFamily: 'var(--lm-font-mono)', fontSize: 11, fill: 'var(--lm-muted)' } as const
const hair = { fill: 'none', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' } as const

const role = (name: keyof typeof ROLE_VAR) => `var(${ROLE_VAR[name]})`
/** A value as the key prints it: one decimal, and no "−0.0". */
const said = (value: number) => {
  const text = value.toFixed(1)
  return (text === '-0.0' ? '0.0' : text).replace('-', '−')
}

/** A point `radius` from the middle at `turns` from the front: the front is down the picture. */
const place = (radius: number, turns: number) => ({
  x: MIDDLE.x + radius * Math.sin(2 * Math.PI * turns),
  y: MIDDLE.y + radius * Math.cos(2 * Math.PI * turns),
})

export default function TurningHorn({ horn, drum, rows, mics, built, start = 0, label }: Props) {
  const state = useLab()
  const result = state.result
  const liveHorn = result?.taps[horn.id]?.channels_data[0]
  const live = liveHorn !== undefined && liveHorn.length > 0

  const seconds = live ? (liveHorn.length * CONTROL_PERIOD) / SAMPLE_RATE : (built?.seconds ?? 0)
  const drawn = useMemo(() => {
    const read = (tap: TapRef) => thinned(result?.taps[tap.id]?.channels_data[0] ?? [])
    if (!live) return built
    const mic = result?.taps[mics.id]?.channels_data[0]?.[1] ?? 0
    return {
      seconds,
      horn: read(horn),
      drum: read(drum),
      rows: Object.fromEntries(rows.map((tap) => [tap.id, read(tap)])),
      mic,
    }
  }, [live, result, built, horn, drum, rows, mics, seconds])
  const has = drawn !== undefined && drawn.horn.length > 1 && seconds > 0
  const count = has ? drawn.horn.length : 1

  // The instant looked at: the reader's, or the loop's own while it plays.
  const [asked, setAsked] = useState(start)
  const [heard, setHeard] = useState<number | null>(null)
  const playing = state.playing
  useEffect(() => {
    if (!playing) {
      setHeard(null)
      return
    }
    let frame = 0
    let last = -1
    const follow = () => {
      frame = requestAnimationFrame(follow)
      const now = pagePlayer().position()
      // A new picture when the loop has moved on by a hundredth of a second.
      if (now !== null && Math.abs(now - last) >= 0.01) {
        last = now
        setHeard(now)
      }
    }
    follow()
    return () => cancelAnimationFrame(frame)
  }, [playing])
  const at = Math.min(Math.max(heard ?? asked, 0), Math.max(0, seconds - 1e-6))
  const index = has ? Math.min(count - 1, Math.floor((at / seconds) * count)) : 0

  // ---- the view from above ----
  const hornAt = has ? drawn.horn[index]! : 0
  const drumAt = has ? drawn.drum[index]! : 0
  const mic = has ? drawn.mic : 0
  const mouth = place(SWEEP, hornAt)
  const throat = place(8, hornAt + 0.5)
  const lip = [place(SWEEP, hornAt - 0.035), place(SWEEP, hornAt + 0.035)] as const
  const sides = [
    { name: 'left', turns: -mic },
    { name: 'right', turns: mic },
  ]
  const baffle = [place(24, drumAt - 0.09), place(24, drumAt + 0.09)] as const

  // ---- the rows against time ----
  // The rows are drawn as wide as the page gives them, so their lettering keeps its size on a
  // narrow screen. Until scripts run they are drawn at the width the page was built with.
  const strip = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(STRIP.width)
  useEffect(() => {
    const box = strip.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(([entry]) => {
      if (entry) setWide(Math.round(Math.min(900, Math.max(240, entry.contentRect.width))))
    })
    watch.observe(box)
    return () => watch.disconnect()
  }, [])
  const plotW = wide - STRIP.left - STRIP.right
  const rowH = (STRIP.height - STRIP.top - 34 - (rows.length - 1) * ROW_GAP) / rows.length
  const lanes = useMemo(
    () =>
      rows.map((tap, n) => {
        const values = has ? (drawn.rows[tap.id] ?? []) : []
        let lo = Infinity
        let hi = -Infinity
        for (const value of values) {
          lo = Math.min(lo, value)
          hi = Math.max(hi, value)
        }
        if (!(hi > lo)) {
          lo = (Number.isFinite(lo) ? lo : 0) - 1
          hi = lo + 2
        }
        const top = STRIP.top + 14 + n * (rowH + ROW_GAP)
        const bottom = top + rowH - 14
        const y = (value: number) => bottom - ((value - lo) / (hi - lo)) * (bottom - top)
        const d = values
          .map(
            (value, k) =>
              `${k === 0 ? 'M' : 'L'}${(STRIP.left + (k / (values.length - 1)) * plotW).toFixed(1)},${y(value).toFixed(1)}`,
          )
          .join('')
        return { tap, values, lo, hi, top, bottom, y, d }
      }),
    [rows, has, drawn, rowH, plotW],
  )
  const cursor = STRIP.left + (has ? index / (count - 1) : 0) * plotW
  // The rows' ranges are lettering in the picture, which a screen reader is not read: its words
  // for the picture say them too.
  const spoken = has
    ? `${label}. ${lanes
        .map(
          ({ tap, lo, hi }) =>
            `${tap.name} runs from ${said(lo)} to ${said(hi)}${tap.unit ? ` ${tap.unit}` : ''}`,
        )
        .join('; ')}`
    : label

  const waiting = has ? undefined : waitingText(state)
  return (
    <div className="fig-plot" data-figure data-drawn={has ? '' : undefined}>
      <div className="controls">
        <label
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem 0.8rem',
            fontSize: '0.86rem',
          }}
        >
          <span>The instant shown</span>
          <input
            type="range"
            min={0}
            max={Math.max(0.01, Number(seconds.toFixed(2)))}
            step={0.01}
            value={Number(at.toFixed(2))}
            disabled={!has || playing}
            onChange={(event) => setAsked(Number(event.currentTarget.value))}
            style={{ flex: '1 1 12rem', minWidth: 0, minHeight: 28 }}
          />
          <output
            aria-live="off"
            style={{ fontFamily: 'var(--lm-font-mono)', fontSize: '0.78rem' }}
          >
            {playing ? `${at.toFixed(2)} s, with the loop` : `${at.toFixed(2)} s`}
          </output>
        </label>
      </div>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'center' }}
        role="img"
        aria-label={spoken}
      >
        <svg
          viewBox={`0 0 ${SIDE} ${SIDE}`}
          style={{ flex: '5 1 220px', minWidth: 0, maxWidth: 360, display: 'block' }}
          aria-hidden="true"
        >
          <circle
            cx={MIDDLE.x}
            cy={MIDDLE.y}
            r={SWEEP}
            style={{ ...hair, stroke: 'var(--sig-grid)', strokeDasharray: '2 4' }}
          />
          <circle
            cx={MIDDLE.x}
            cy={MIDDLE.y}
            r={24}
            style={{ ...hair, stroke: 'var(--sig-grid)' }}
          />
          {has && (
            <>
              {sides.map((one) => {
                const stand = place(AWAY, one.turns)
                const name = place(AWAY + 20, one.turns)
                return (
                  <g key={one.name}>
                    <path
                      d={`M${mouth.x.toFixed(1)},${mouth.y.toFixed(1)}L${stand.x.toFixed(1)},${stand.y.toFixed(1)}`}
                      style={{ ...hair, stroke: 'var(--lm-muted)', strokeDasharray: '4 3' }}
                    />
                    <circle
                      cx={stand.x}
                      cy={stand.y}
                      r={6}
                      style={{ fill: 'var(--lm-bg)', stroke: 'var(--lm-text)', strokeWidth: 1.5 }}
                    />
                    <text
                      x={name.x}
                      y={name.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={MONO}
                    >
                      {one.name}
                    </text>
                  </g>
                )
              })}
              <path
                d={`M${baffle[0].x.toFixed(1)},${baffle[0].y.toFixed(1)}A24,24 0 0 0 ${baffle[1].x.toFixed(1)},${baffle[1].y.toFixed(1)}`}
                style={{
                  fill: 'none',
                  stroke: role(drum.role),
                  strokeWidth: 5,
                  strokeLinecap: 'round',
                }}
              />
              <path
                d={`M${throat.x.toFixed(1)},${throat.y.toFixed(1)}L${lip[0].x.toFixed(1)},${lip[0].y.toFixed(1)}L${lip[1].x.toFixed(1)},${lip[1].y.toFixed(1)}Z`}
                style={{ fill: role(horn.role), opacity: 0.9 }}
              />
              <circle cx={mouth.x} cy={mouth.y} r={3.5} style={{ fill: 'var(--lm-text)' }} />
            </>
          )}
          <text x={MIDDLE.x} y={SIDE - 6} textAnchor="middle" style={MONO}>
            the front of the cabinet
          </text>
        </svg>
        {/* The box keeps one height, so the page below does not move when the rows are drawn
            again at the width the screen gives them. */}
        <div ref={strip} style={{ flex: '7 1 280px', minWidth: 0, height: STRIP.height }}>
          <svg
            viewBox={`0 0 ${wide} ${STRIP.height}`}
            style={{ display: 'block', width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            {lanes.map(({ tap, lo, hi, top, bottom, y, d }) => (
              <g key={tap.id}>
                <text x={STRIP.left} y={top - 6} style={{ ...MONO, fill: 'var(--lm-text)' }}>
                  {tap.name}
                </text>
                <text x={STRIP.left + plotW} y={top - 6} textAnchor="end" style={MONO}>
                  {`${said(lo)} to ${said(hi)}${tap.unit ? ` ${tap.unit}` : ''}`}
                </text>
                <path
                  d={`M${STRIP.left},${top}H${STRIP.left + plotW}M${STRIP.left},${bottom}H${STRIP.left + plotW}`}
                  style={{ ...hair, stroke: 'var(--lm-grid-line)' }}
                />
                {lo < 0 && hi > 0 && (
                  <path
                    d={`M${STRIP.left},${y(0).toFixed(1)}H${STRIP.left + plotW}`}
                    style={{ ...hair, stroke: 'var(--sig-grid)', strokeDasharray: '2 4' }}
                  />
                )}
                {has && (
                  <path d={d} style={{ ...hair, stroke: role(tap.role), strokeWidth: 1.8 }} />
                )}
              </g>
            ))}
            {has &&
              lanes.map(({ tap, top, bottom, y, values }) => (
                <g key={tap.id}>
                  <path
                    d={`M${cursor.toFixed(1)},${top - 3}V${bottom + 3}`}
                    style={{ ...hair, stroke: 'var(--lm-text)', strokeDasharray: '3 3' }}
                  />
                  <circle
                    cx={cursor}
                    cy={y(values[index] ?? 0)}
                    r={3.5}
                    style={{ fill: role(tap.role), stroke: 'var(--lm-bg)', strokeWidth: 1 }}
                  />
                </g>
              ))}
            {[0, 0.25, 0.5, 0.75, 1].map((share) => (
              <text
                key={share}
                x={STRIP.left + share * plotW}
                y={STRIP.height - 18}
                textAnchor={share === 0 ? 'start' : share === 1 ? 'end' : 'middle'}
                style={MONO}
              >
                {Number((share * seconds).toFixed(2))}
              </text>
            ))}
            <text x={STRIP.left + plotW} y={STRIP.height - 3} textAnchor="end" style={MONO}>
              seconds
            </text>
          </svg>
        </div>
      </div>
      {waiting && <p style={{ color: 'var(--lm-muted)', fontSize: '0.86rem' }}>{waiting}</p>}
      <ul className="fig-legend key" style={{ paddingLeft: 0 }}>
        <li>
          <i style={{ background: role(horn.role), height: 8 }} />
          {horn.name}
          {has && <b>{`${hornAt.toFixed(2)} of a turn`}</b>}
        </li>
        <li>
          <i style={{ background: role(drum.role), height: 5 }} />
          {drum.name}
        </li>
        {lanes.map(({ tap, values }) => (
          <li key={tap.id}>
            <i style={{ background: role(tap.role) }} />
            {tap.name}
            {has && <b>{`${said(values[index] ?? 0)}${tap.unit ? ` ${tap.unit}` : ''}`}</b>}
          </li>
        ))}
        <li>
          <i className="dashed" style={{ background: 'var(--lm-muted)' }} />
          From the horn's mouth to a microphone
        </li>
      </ul>
    </div>
  )
}
