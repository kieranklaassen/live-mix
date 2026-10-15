// One value against another: a transfer curve, a window's shape, a frame of samples, a filter's
// response the lab worked out. The lab says what the first and the last point stand at.

import { useLab, waitingText } from '../lab/page.ts'
import { rangeOf, roomyAxis } from './draw.ts'
import Plot, { type Mark, type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

interface Props {
  taps: TapRef[]
  /** A word or two for each axis, and the unit its values are in. */
  xTitle?: string
  yTitle?: string
  xUnit?: string
  yUnit?: string
  min?: number
  max?: number
  xMin?: number
  xMax?: number
  /** A logarithmic x axis, for a response against frequency. */
  xLog?: boolean
  stems?: boolean
  /** Controls drawn as a line across (`lines`) or up (`uprights`) the picture: [id, name] pairs. */
  lines?: [string, string][]
  uprights?: [string, string][]
  /** A control tap whose value, as the loop plays, is where a dot rides the first curve. */
  follow?: string
  /** Draw the line y = x, for a curve of level out against level in. */
  diagonal?: boolean
  height?: number
  label: string
}

export default function Curve(props: Props) {
  const { taps, lines = [], uprights = [], follow } = props
  const state = useLab()
  const result = state.result
  let lo = Infinity
  let hi = -Infinity
  let x0 = Infinity
  let x1 = -Infinity
  const series: Series[] = taps.map((tap) => {
    const found = result?.taps[tap.id]
    const data = found?.channels_data[0]
    if (!found || !data)
      return { key: tap.id, name: tap.name, role: tap.role, x0: 0, x1: 1, unit: tap.unit }
    const [a, b] = rangeOf(data)
    lo = Math.min(lo, a)
    hi = Math.max(hi, b)
    x0 = Math.min(x0, found.x0)
    x1 = Math.max(x1, found.x1)
    return {
      key: tap.id,
      name: tap.name,
      role: tap.role,
      ys: data,
      x0: found.x0,
      x1: found.x1,
      xLog: found.log,
      unit: tap.unit,
      stems: props.stems,
      dashed: tap.origin === 'lesson' && taps.length > 1 && tap !== taps[0],
    }
  })
  const xAxis = {
    min: props.xMin ?? (Number.isFinite(x0) ? x0 : 0),
    max: props.xMax ?? (Number.isFinite(x1) ? x1 : 1),
    log: props.xLog,
    unit: props.xUnit,
    title: props.xTitle,
  }
  if (props.diagonal) {
    series.push({
      key: 'diagonal',
      name: 'No change',
      role: 'in',
      ys: [xAxis.min, xAxis.max],
      x0: xAxis.min,
      x1: xAxis.max,
      dashed: true,
    })
  }
  const auto = roomyAxis(Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : 1)
  const marks: Mark[] = [
    ...lines.flatMap(([id, name]) =>
      state.values[id] === undefined ? [] : [{ y: state.values[id], text: name }],
    ),
    ...uprights.flatMap(([id, name]) =>
      state.values[id] === undefined ? [] : [{ x: state.values[id], text: name }],
    ),
  ]
  const followed = follow ? result?.taps[follow]?.channels_data[0] : undefined
  const cursor = followed
    ? (seconds: number) =>
        followed[Math.min(followed.length - 1, Math.floor((seconds * 48_000) / 16))] ?? null
    : undefined
  return (
    <Plot
      label={props.label}
      series={series}
      x={xAxis}
      y={{
        min: props.min ?? auto.min,
        max: props.max ?? auto.max,
        unit: props.yUnit ?? taps[0]?.unit,
        title: props.yTitle,
      }}
      height={props.height}
      marks={marks}
      waiting={waitingText(state)}
      cursor={cursor}
      dot={followed !== undefined}
      stamp={result}
    />
  )
}
