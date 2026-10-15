// A signal against time: one line per tap, over the whole loop or a stretch of it.

import { useLab, waitingText } from '../lab/page.ts'
import { peakOf, roomyAxis } from './draw.ts'
import Plot, { type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

const RATE = 48_000

interface Props {
  taps: TapRef[]
  /** Where the stretch shown starts and how long it is, in seconds. The whole loop when left out. */
  from?: number
  span?: number
  /** Fit the height to the loudest sample; otherwise full scale is the top. */
  fit?: boolean
  /** Draw each sample as a stalk: for a stretch short enough to count them. */
  stems?: boolean
  channel?: number
  height?: number
  label: string
}

export default function Wave({
  taps,
  from = 0,
  span,
  fit,
  stems,
  channel = 0,
  height,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const seconds = result ? result.frames / RATE : 4
  const length = span ?? seconds - from
  // A stretch shorter than a fifth of a second, near the loop's start, reads better in milliseconds.
  const scale = length < 0.2 && from < 1 ? 1000 : 1
  let peak = 0
  const series: Series[] = taps.map((tap) => {
    const data =
      result?.taps[tap.id]?.channels_data[channel] ?? result?.taps[tap.id]?.channels_data[0]
    if (!data) return { key: tap.id, name: tap.name, role: tap.role, x0: 0, x1: 1 }
    const a = Math.max(0, Math.floor(from * RATE))
    const b = Math.min(data.length, Math.ceil((from + length) * RATE) + 1)
    const ys = data.subarray(a, b)
    peak = Math.max(peak, peakOf(ys))
    return {
      key: tap.id,
      name: tap.name,
      role: tap.role,
      ys,
      x0: (a / RATE) * scale,
      x1: ((b - 1) / RATE) * scale,
      stems,
    }
  })
  const y = fit ? roomyAxis(-(peak || 1), peak || 1) : { min: -1, max: 1 }
  return (
    <Plot
      label={label}
      series={series}
      x={{
        min: from * scale,
        max: (from + length) * scale,
        unit: scale === 1 ? 's' : 'ms',
        title: scale === 1 ? 'seconds' : 'milliseconds',
      }}
      y={y}
      height={height}
      waiting={waitingText(state)}
      cursor={(at) => at * scale}
      stamp={result}
    />
  )
}
