// A filter's zeros and poles on the plane, beside the response they make. On the left the unit
// circle, where every frequency is a point: the zeros as rings, the poles as crosses, and a point
// that the reader moves along the circle, joined to each of them. On the right the filter's
// measured curve, with a dot at that frequency whose height is worked out from the lengths of the
// lines alone: the size of b0, times the distances to the zeros, over the distances to the
// poles. The plane is drawn close up, round the part of the circle the roots stand by, and a
// small whole circle in its corner says where that part is.
//
// The picture is SVG, so the page as built carries it at the lab's starting values and it is
// there with scripts off; the control that moves the point comes with the running lab.

import { useId, useState } from 'react'
import { useLab, waitingText } from '../lab/page.ts'
import { SAMPLE_RATE } from '../lab/rate.ts'
import { label as numberLabel, ticks, toUnit, type Axis } from './draw.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** The lab's two taps as they stood when the site was built, at its starting values. */
export interface BuiltRoots {
  roots: number[]
  response: number[]
  x0: number
  x1: number
}

interface Props {
  /** A curve tap of nine values: two zeros and two poles, each as (across, up), then b0. */
  roots: TapRef
  /** A curve tap: the filter's level in dB against hertz. */
  response: TapRef
  built?: BuiltRoots
  label: string
}

interface Point {
  re: number
  im: number
}

/** The side of the plane's picture, and the size of the curve's, in the units of their own SVG. */
const SIDE = 300
const CURVE = { width: 420, height: 300, left: 36, right: 8, top: 8, bottom: 22 }
const HZ: Axis = { min: 20, max: 20_000, log: true }
const DB: Axis = { min: -13, max: 13 }
/** The control's steps along its logarithmic range. */
const STEPS = 600
const MONO = { fontFamily: 'var(--lm-font-mono)', fontSize: 10, fill: 'var(--lm-muted)' } as const

const role = (name: keyof typeof ROLE_VAR) => `var(${ROLE_VAR[name]})`
const hertz = (hz: number) => `${Math.round(hz).toLocaleString('en-GB')} Hz`
const signed = (db: number) => `${db < 0 ? '−' : '+'}${Math.abs(db).toFixed(1)} dB`
/** A frequency's point on the circle. */
const onCircle = (hz: number): Point => {
  const angle = (2 * Math.PI * hz) / SAMPLE_RATE
  return { re: Math.cos(angle), im: Math.sin(angle) }
}
const apart = (a: Point, b: Point) => Math.hypot(a.re - b.re, a.im - b.im)

/** The part of the plane drawn: its centre, and half of its side. */
function windowOn(roots: Point[]): { centre: Point; half: number; whole: boolean } {
  const least = Math.min(...roots.map((root) => Math.hypot(root.re, root.im)))
  const upper = roots[2]!.im >= 0 ? roots[2]! : roots[3]!
  const angle = Math.atan2(upper.im, upper.re)
  // Wide enough to tell a zero from a pole, and to hold the circle from 0 Hz to an octave over
  // the poles' own frequency, so that the point looked at stays in the picture round them.
  const reach = 1.15 * 2 * Math.sin(Math.abs(angle) / 2)
  const half = Math.min(1.3, Math.max(0.03, 2.2 * (1 - least), reach))
  if (half > 0.85) return { centre: { re: 0, im: 0 }, half: 1.3, whole: true }
  // Round the place where the upper pole's angle meets the circle, a little way inside it.
  const radius = (1 + least) / 2
  return {
    centre: { re: radius * Math.cos(angle), im: radius * Math.sin(angle) },
    half,
    whole: false,
  }
}

export default function PolesAndZeros({ roots, response, built, label }: Props) {
  const state = useLab()
  const result = state.result
  const live = result?.taps[roots.id]?.channels_data[0]
  const curveTap = result?.taps[response.id]
  const values: ArrayLike<number> | undefined = live ?? built?.roots
  const curve: ArrayLike<number> | undefined = curveTap?.channels_data[0] ?? built?.response
  const x0 = curveTap?.x0 ?? built?.x0 ?? HZ.min
  const x1 = curveTap?.x1 ?? built?.x1 ?? HZ.max
  const has = Boolean(values && values.length >= 9 && curve && curve.length > 1)
  const [hz, setHz] = useState(1000)
  const id = useId()
  // An id that a reference inside the SVG can carry.
  const clip = `plane${id.replace(/[^a-zA-Z0-9]/g, '')}`

  const points: Point[] = []
  for (let k = 0; k < 4; k += 1) {
    points.push({ re: values?.[2 * k] ?? 0, im: values?.[2 * k + 1] ?? 0 })
  }
  const b0 = Math.abs(values?.[8] ?? 1)
  const probe = onCircle(hz)
  const lengths = points.map((root) => apart(probe, root))
  const zeros = lengths[0]! * lengths[1]!
  const poles = lengths[2]! * lengths[3]!
  const size = poles > 0 ? (b0 * zeros) / poles : 1
  const db = 20 * Math.log10(Math.max(size, 1e-9))

  // ---- the plane ----
  const { centre, half, whole } = windowOn(points)
  const scale = SIDE / (2 * half)
  const px = (point: Point) => (point.re - centre.re + half) * scale
  const py = (point: Point) => (centre.im + half - point.im) * scale
  const inside = (point: Point, room = 0) =>
    px(point) >= room && px(point) <= SIDE - room && py(point) >= room && py(point) <= SIDE - room
  // The frequencies whose points on the circle are in the picture.
  let lowest = Infinity
  let highest = -Infinity
  for (let step = 0; step <= 2400; step += 1) {
    const at = (step / 2400) * (SAMPLE_RATE / 2)
    if (inside(onCircle(at))) {
      lowest = Math.min(lowest, at)
      highest = Math.max(highest, at)
    }
  }
  const marks = highest > lowest ? ticks({ min: lowest, max: highest }, 4) : []
  const origin = { re: 0, im: 0 }
  const cross = 5

  // ---- the curve ----
  const plotW = CURVE.width - CURVE.left - CURVE.right
  const plotH = CURVE.height - CURVE.top - CURVE.bottom
  const cx = (at: number) => CURVE.left + toUnit(HZ, at) * plotW
  const cy = (value: number) =>
    CURVE.top + (1 - Math.min(1, Math.max(0, toUnit(DB, value)))) * plotH
  let path = ''
  if (curve) {
    const n = curve.length
    for (let p = 0; p < n; p += 1) {
      const at = x0 * Math.pow(x1 / x0, p / (n - 1))
      path += `${p === 0 ? 'M' : 'L'}${cx(at).toFixed(1)},${cy(curve[p]!).toFixed(1)}`
    }
  }

  const waiting = has ? undefined : waitingText(state)
  const place = Math.round((Math.log(hz / HZ.min) / Math.log(HZ.max / HZ.min)) * STEPS)
  const hair = { fill: 'none', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' } as const

  return (
    <div className="fig-plot" data-figure data-drawn={has ? '' : undefined}>
      {result && (
        <div className="controls">
          <div className="control" data-control="looked-at">
            <label className="control-name" htmlFor={id}>
              Frequency looked at
            </label>
            <output className="control-value" htmlFor={id}>
              {hertz(hz)}
            </output>
            <input
              id={id}
              type="range"
              min={0}
              max={STEPS}
              step={1}
              value={place}
              onChange={(event) => {
                const next = HZ.min * Math.pow(HZ.max / HZ.min, Number(event.target.value) / STEPS)
                setHz(Number(next.toPrecision(3)))
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'flex-start' }}
        role="img"
        aria-label={label}
      >
        <svg
          viewBox={`0 0 ${SIDE} ${SIDE}`}
          style={{ flex: '5 1 230px', minWidth: 0, maxWidth: 420, display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clip}>
              <rect width={SIDE} height={SIDE} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`}>
            {/* The level line through the centre, and the circle of frequencies. */}
            <path
              d={`M${px({ re: -2, im: 0 })},${py(origin)}H${px({ re: 2, im: 0 })}`}
              style={{ ...hair, stroke: 'var(--lm-grid-line)' }}
            />
            <circle
              cx={px(origin)}
              cy={py(origin)}
              r={scale}
              style={{ ...hair, stroke: 'var(--lm-muted)', strokeWidth: 1.4 }}
            />
            {has &&
              marks.map((at) => {
                const on = onCircle(at)
                const out = { re: on.re * (1 + 16 / scale), im: on.im * (1 + 16 / scale) }
                const tick = { re: on.re * (1 + 5 / scale), im: on.im * (1 + 5 / scale) }
                return (
                  <g key={at}>
                    <path
                      d={`M${px(on)},${py(on)}L${px(tick)},${py(tick)}`}
                      style={{ ...hair, stroke: 'var(--lm-muted)' }}
                    />
                    {inside(out, 12) && (
                      <text
                        x={px(out)}
                        y={py(out)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={MONO}
                      >
                        {numberLabel(at)}
                      </text>
                    )}
                  </g>
                )
              })}
            {has && (
              <>
                {/* From the frequency looked at to each zero and each pole. */}
                {points.map((root, k) => (
                  <path
                    key={k}
                    d={`M${px(probe)},${py(probe)}L${px(root)},${py(root)}`}
                    style={{ ...hair, stroke: role(k < 2 ? 'alt' : 'alt2'), strokeWidth: 1.4 }}
                  />
                ))}
                {points.slice(0, 2).map((zero, k) => (
                  <circle
                    key={k}
                    cx={px(zero)}
                    cy={py(zero)}
                    r={cross}
                    style={{ ...hair, stroke: role('alt'), strokeWidth: 2, fill: 'var(--lm-bg)' }}
                  />
                ))}
                {points.slice(2).map((pole, k) => (
                  <path
                    key={k}
                    d={`M${px(pole) - cross},${py(pole) - cross}l${2 * cross},${2 * cross}m0,${-2 * cross}l${-2 * cross},${2 * cross}`}
                    style={{ ...hair, stroke: role('alt2'), strokeWidth: 2 }}
                  />
                ))}
                <circle cx={px(probe)} cy={py(probe)} r={4.5} style={{ fill: role('ctl') }} />
              </>
            )}
          </g>
          <rect
            x={0.5}
            y={0.5}
            width={SIDE - 1}
            height={SIDE - 1}
            style={{ ...hair, stroke: 'var(--sig-grid)' }}
          />
          <text x={SIDE - 6} y={14} textAnchor="end" style={MONO}>
            hertz, round the circle
          </text>
          {has && !whole && (
            // Where on the whole circle the picture is.
            <g>
              <rect
                x={6}
                y={6}
                width={64}
                height={64}
                style={{ ...hair, fill: 'var(--lm-panel)', stroke: 'var(--sig-grid)' }}
              />
              <path d="M10,38H66" style={{ ...hair, stroke: 'var(--lm-grid-line)' }} />
              <circle cx={38} cy={38} r={24} style={{ ...hair, stroke: 'var(--lm-muted)' }} />
              <rect
                x={38 + (centre.re - half) * 24}
                y={38 - (centre.im + half) * 24}
                width={2 * half * 24}
                height={2 * half * 24}
                style={{ ...hair, stroke: 'var(--lm-text)', strokeWidth: 1.4 }}
              />
              <circle
                cx={38 + probe.re * 24}
                cy={38 - probe.im * 24}
                r={2.4}
                style={{ fill: role('ctl') }}
              />
            </g>
          )}
        </svg>
        <svg
          viewBox={`0 0 ${CURVE.width} ${CURVE.height}`}
          style={{ flex: '7 1 280px', minWidth: 0, display: 'block' }}
          aria-hidden="true"
        >
          {ticks(DB, 4).map((value) => (
            <g key={value}>
              <path
                d={`M${CURVE.left},${cy(value)}H${CURVE.left + plotW}`}
                style={{ ...hair, stroke: value === 0 ? 'var(--sig-grid)' : 'var(--lm-grid-line)' }}
              />
              <text
                x={CURVE.left - 6}
                y={cy(value)}
                textAnchor="end"
                dominantBaseline="middle"
                style={MONO}
              >
                {numberLabel(value)}
              </text>
            </g>
          ))}
          {[100, 1000, 10_000].map((at) => (
            <g key={at}>
              <path
                d={`M${cx(at)},${CURVE.top}V${CURVE.top + plotH}`}
                style={{ ...hair, stroke: 'var(--lm-grid-line)' }}
              />
              <text x={cx(at)} y={CURVE.top + plotH + 13} textAnchor="middle" style={MONO}>
                {numberLabel(at)}
              </text>
            </g>
          ))}
          <rect
            x={CURVE.left + 0.5}
            y={CURVE.top + 0.5}
            width={plotW - 1}
            height={plotH - 1}
            style={{ ...hair, stroke: 'var(--sig-grid)' }}
          />
          <text x={CURVE.left + plotW - 6} y={CURVE.top + plotH - 7} textAnchor="end" style={MONO}>
            hertz
          </text>
          <text x={CURVE.left + 6} y={CURVE.top + 13} style={MONO}>
            decibels
          </text>
          {has && (
            <>
              <path
                d={`M${cx(hz)},${CURVE.top}V${CURVE.top + plotH}`}
                style={{ ...hair, stroke: 'var(--lm-muted)', strokeDasharray: '3 3' }}
              />
              <path
                d={path}
                style={{ ...hair, stroke: role('out'), strokeWidth: 1.8, strokeLinejoin: 'round' }}
              />
              <circle cx={cx(hz)} cy={cy(db)} r={4.5} style={{ fill: role('ctl') }} />
            </>
          )}
        </svg>
      </div>
      {waiting && <p style={{ color: 'var(--lm-muted)', fontSize: '0.86rem' }}>{waiting}</p>}
      <ul className="fig-legend key" style={{ paddingLeft: 0 }}>
        <li>
          <i style={{ background: role('alt') }} />
          Zeros{has && <b>{`${lengths[0]!.toFixed(3)} and ${lengths[1]!.toFixed(3)} away`}</b>}
        </li>
        <li>
          <i style={{ background: role('alt2') }} />
          Poles{has && <b>{`${lengths[2]!.toFixed(3)} and ${lengths[3]!.toFixed(3)} away`}</b>}
        </li>
        <li>
          <i style={{ background: role('ctl') }} />
          At {hertz(hz)}
          {has && (
            <b>
              {`${b0.toFixed(3)} × ${zeros.toFixed(4)} ÷ ${poles.toFixed(4)} = ${size.toFixed(3)}, which is ${signed(db)}`}
            </b>
          )}
        </li>
        <li>
          <i style={{ background: role('out') }} />
          {response.name}, measured
        </li>
      </ul>
    </div>
  )
}
