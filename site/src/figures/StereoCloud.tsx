// Left against right, as a cloud of dots. Each dot is one sample of a sound that has two
// channels: how far across is its left channel, how far up is its right. A sound that is the
// same on both sides lies along the diagonal; one that is on the left alone lies along the line
// across; and how far the cloud leaves the diagonal is how wide the sound is. The diagonal and
// the line that crosses it are the axes of mid and of side: the same picture, turned an eighth
// of a turn.
//
// The picture is SVG. The page as built carries it as the lab stood when the site was built, so
// it is there with scripts off. With `live` it follows the running lab, and while the loop
// plays the last few hundredths of a second are drawn over the cloud.

import { useEffect, useRef } from 'react'
import { pagePlayer, useLab } from '../lab/page.ts'
import { SAMPLE_RATE } from '../lab/rate.ts'
import { ROLE_VAR, type TapRef } from './roles.ts'

/** The clouds as they stood when the site was built: for each tap, dots as left, right, left... */
export interface BuiltCloud {
  /** How far the picture reaches each way from its middle, in the sound's own units. */
  reach: number
  dots: Record<string, number[]>
}

interface Props {
  /** Sound taps of two channels, drawn in this order: the last lies on top. */
  taps: TapRef[]
  built?: BuiltCloud
  /** Follow the lab as it runs. Left out, the picture stays as it was built. */
  live?: boolean
  label: string
}

/** How many dots a cloud is drawn with. */
export const DOTS = 1000
/** The least a picture reaches, so that silence is a dot in the middle and not a division by 0. */
const LEAST_REACH = 0.02
/** The side of the picture, and the room round the square the dots lie in, in SVG units. */
const SIDE = 320
const ROOM = 14
/** How much of the loop the dots drawn over the cloud cover while it plays, and how many there are. */
const TRAIL_SECONDS = 0.04
const TRAIL_DOTS = 96

/** `count` samples of a pair of channels, evenly through the loop, as left, right, left... */
export function cloudDots(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
  count = DOTS,
): number[] {
  const length = Math.min(left.length, right.length)
  const dots: number[] = []
  if (length === 0) return dots
  for (let k = 0; k < count; k += 1) {
    const i = Math.min(length - 1, Math.floor(((k + 0.5) * length) / count))
    dots.push(left[i]!, right[i]!)
  }
  return dots
}

/** How far a picture must reach to hold every dot of every cloud in it. */
export function reachOf(clouds: ArrayLike<number>[]): number {
  let most = LEAST_REACH
  for (const dots of clouds) {
    for (let i = 0; i < dots.length; i += 1) most = Math.max(most, Math.abs(dots[i]!))
  }
  return most * 1.04
}

const span = SIDE - 2 * ROOM
const across = (value: number, reach: number) => ROOM + ((value / reach + 1) / 2) * span
const up = (value: number, reach: number) => ROOM + ((1 - value / reach) / 2) * span
const inside = (place: number) => Math.min(SIDE - ROOM, Math.max(ROOM, place))

/** Dots as the path of an SVG: a stroke of no length with round ends is a dot. */
function pathOf(dots: ArrayLike<number>, reach: number): string {
  let d = ''
  for (let i = 0; i + 1 < dots.length; i += 2) {
    const x = inside(across(dots[i]!, reach))
    const y = inside(up(dots[i + 1]!, reach))
    d += `M${x.toFixed(1)} ${y.toFixed(1)}h.01`
  }
  return d
}

const MONO = { fontFamily: 'var(--lm-font-mono)', fontSize: 10, fill: 'var(--lm-muted)' } as const
const OVER_DOTS = {
  ...MONO,
  paintOrder: 'stroke',
  stroke: 'var(--lm-bg)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
} as const

export default function StereoCloud({ taps, built, live = false, label }: Props) {
  const state = useLab()
  const result = live ? state.result : undefined
  const trail = useRef<SVGPathElement | null>(null)

  const clouds = taps.map((tap) => {
    const found = result?.taps[tap.id]
    const left = found?.channels_data[0]
    const right = found?.channels_data[1]
    return left && right ? cloudDots(left, right) : (built?.dots[tap.id] ?? [])
  })
  const fresh = live && taps.some((tap) => result?.taps[tap.id]?.channels_data[1])
  const reach = fresh ? reachOf(clouds) : (built?.reach ?? reachOf(clouds))
  const has = clouds.some((dots) => dots.length > 0)
  const top = taps[taps.length - 1]
  const playing = live && state.playing

  // While the loop plays: the last few hundredths of a second of the cloud that lies on top.
  useEffect(() => {
    const path = trail.current
    if (!path) return
    const sound = top ? result?.taps[top.id] : undefined
    const left = sound?.channels_data[0]
    const right = sound?.channels_data[1]
    if (!playing || !left || !right || left.length === 0) {
      path.setAttribute('d', '')
      return
    }
    let frame = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      const seconds = pagePlayer().position()
      if (seconds === null) {
        path.setAttribute('d', '')
        return
      }
      const end = Math.floor(seconds * SAMPLE_RATE)
      const step = Math.max(1, Math.floor((TRAIL_SECONDS * SAMPLE_RATE) / TRAIL_DOTS))
      const dots: number[] = []
      for (let k = TRAIL_DOTS - 1; k >= 0; k -= 1) {
        const i = (((end - k * step) % left.length) + left.length) % left.length
        dots.push(left[i]!, right[i]!)
      }
      path.setAttribute('d', pathOf(dots, reach))
    }
    move()
    return () => cancelAnimationFrame(frame)
  }, [playing, result, top, reach])

  const lo = ROOM
  const hi = SIDE - ROOM
  const middle = SIDE / 2
  return (
    <div
      className="stereo-cloud"
      data-figure
      data-drawn={has ? '' : undefined}
      style={{ maxWidth: '24rem', margin: '0 auto' }}
    >
      <svg
        viewBox={`0 0 ${SIDE} ${SIDE}`}
        role="img"
        aria-label={label}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <rect
          x={lo}
          y={lo}
          width={span}
          height={span}
          fill="none"
          stroke="var(--sig-grid)"
          strokeWidth={1}
        />
        <line
          x1={lo}
          y1={middle}
          x2={hi}
          y2={middle}
          stroke="var(--lm-grid-line)"
          strokeWidth={1}
        />
        <line
          x1={middle}
          y1={lo}
          x2={middle}
          y2={hi}
          stroke="var(--lm-grid-line)"
          strokeWidth={1}
        />
        {/* The line that crosses the diagonal: a sound that is one side turned over lies here. */}
        <line
          x1={lo}
          y1={lo}
          x2={hi}
          y2={hi}
          stroke="var(--lm-muted)"
          strokeWidth={1}
          strokeDasharray="1 5"
        />
        {/* The diagonal: a sound that is the same on both sides lies here. */}
        <line
          x1={lo}
          y1={hi}
          x2={hi}
          y2={lo}
          stroke="var(--lm-muted)"
          strokeWidth={1}
          strokeDasharray="5 4"
        />
        {taps.map((tap, at) => (
          <path
            key={tap.id}
            d={pathOf(clouds[at]!, reach)}
            fill="none"
            stroke={`var(${ROLE_VAR[tap.role]})`}
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.55}
          />
        ))}
        <path
          ref={trail}
          fill="none"
          stroke="var(--lm-text)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <text x={hi - 4} y={middle - 5} textAnchor="end" style={OVER_DOTS}>
          left channel
        </text>
        <text x={middle + 5} y={lo + 12} style={OVER_DOTS}>
          right channel
        </text>
        <text x={hi - 6} y={lo + 24} textAnchor="end" style={OVER_DOTS}>
          mid
        </text>
        <text x={hi - 6} y={hi - 18} textAnchor="end" style={OVER_DOTS}>
          side
        </text>
      </svg>
      <ul className="fig-legend key" style={{ paddingLeft: ROOM }}>
        {taps.map((tap) => (
          <li key={tap.id}>
            <i style={{ background: `var(${ROLE_VAR[tap.role]})` }} />
            {tap.name}
          </li>
        ))}
        <li>
          <i className="dashed" style={{ background: 'var(--lm-muted)' }} />
          Left and right the same
        </li>
      </ul>
    </div>
  )
}
