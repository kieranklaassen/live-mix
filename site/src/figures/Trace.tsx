// A value the device works out, against time: a level, a gain, a delay time. One point for every
// sixteen samples, the rate at which the engine's devices compute their controls.

import { useLab, waitingText } from '../lab/page.ts'
import { rangeOf, roomyAxis } from './draw.ts'
import Plot, { type Mark, type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

const RATE = 48_000

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
  const seconds = result ? result.frames / RATE : 4
  const length = span ?? seconds - from
  const scale = length < 0.2 && from < 1 ? 1000 : 1
  let lo = Infinity
  let hi = -Infinity
  const series: Series[] = taps.map((tap) => {
    const found = result?.taps[tap.id]
    const data = found?.channels_data[0]
    if (!found || !data)
      return { key: tap.id, name: tap.name, role: tap.role, x0: 0, x1: 1, unit: tap.unit }
    // A control tap has a point every sixteen samples; an audio tap one a sample.
    const step = found.kind === 'control' ? 16 : 1
    const [a, b] = rangeOf(data)
    lo = Math.min(lo, a)
    hi = Math.max(hi, b)
    return {
      key: tap.id,
      name: tap.name,
      role: tap.role,
      ys: data,
      x0: 0,
      x1: (((data.length - 1) * step) / RATE) * scale,
      unit: tap.unit,
    }
  })
  const marks: Mark[] = lines.flatMap(([id, name]) => {
    const value = state.values[id]
    return value === undefined ? [] : [{ y: value, text: name }]
  })
  const auto = roomyAxis(Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : 1)
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
      y={{
        min: min ?? auto.min,
        max: max ?? auto.max,
        unit: unit ?? taps[0]?.unit,
        title: unit ?? taps[0]?.unit,
      }}
      height={height}
      marks={marks}
      waiting={waitingText(state)}
      cursor={(at) => at * scale}
      stamp={result}
    />
  )
}
