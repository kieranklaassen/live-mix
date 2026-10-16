// A value the device works out, against time: a level, a gain, a delay time. One point for every
// sixteen samples, the rate at which the engine's devices compute their controls.

import { useMemo } from 'react'
import { useLab, waitingText } from '../lab/page.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { loopAxis, rangeOf, roomyAxis } from './draw.ts'
import Plot, { linesAt, type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

interface Props {
  taps: TapRef[]
  min?: number
  max?: number
  unit?: string
  from?: number
  span?: number
  /** Controls whose value is drawn as a level line across the picture: [id, name] pairs. */
  lines?: [string, string][]
  height?: number
  label: string
}

export default function Trace({
  taps,
  min,
  max,
  unit,
  from = 0,
  span,
  lines = [],
  height,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const { scale, x } = loopAxis(result, from, span)
  const fitted = min === undefined || max === undefined
  const { series, lo, hi } = useMemo(() => {
    let lo = Infinity
    let hi = -Infinity
    const series: Series[] = taps.map((tap) => {
      const found = result?.taps[tap.id]
      const data = found?.channels_data[0]
      if (!found || !data)
        return { key: tap.id, name: tap.name, role: tap.role, x0: 0, x1: 1, unit: tap.unit }
      const step = found.kind === 'control' ? CONTROL_PERIOD : 1
      if (fitted) {
        const [a, b] = rangeOf(data)
        lo = Math.min(lo, a)
        hi = Math.max(hi, b)
      }
      return {
        key: tap.id,
        name: tap.name,
        role: tap.role,
        ys: data,
        x0: 0,
        x1: (((data.length - 1) * step) / SAMPLE_RATE) * scale,
        unit: tap.unit,
      }
    })
    return { series, lo, hi }
  }, [result, taps, scale, fitted])
  const auto = roomyAxis(Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : 1)
  return (
    <Plot
      label={label}
      series={series}
      x={x}
      y={{
        min: min ?? auto.min,
        max: max ?? auto.max,
        unit: unit ?? taps[0]?.unit,
        title: unit ?? taps[0]?.unit,
      }}
      height={height}
      marks={linesAt(lines, state.values)}
      waiting={waitingText(state)}
      cursor={(at) => at * scale}
      stamp={result}
    />
  )
}
