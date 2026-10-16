// One value against another: a transfer curve, a window's shape, a frame of samples, a filter's
// response the lab worked out. The lab says what the first and the last point stand at.

import { useLab, waitingText } from '../lab/page.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from '../lab/rate.ts'
import { AUDIBLE, markValues, rangeOf, roomyAxis, type MarkRef } from './draw.ts'
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
  /**
   * Curves drawn as a dot on a stem for each point: every one (`stems`), or those of the taps
   * named by id (`stems="frame"`, or a list), the others staying lines.
   */
  stems?: boolean | string | readonly string[]
  /**
   * Lines drawn across (`lines`) or up (`uprights`) the picture, each with its name: at a
   * control's value ([id, name]), at a fixed number ([number, name]) or at the first point of a
   * tap ([id, name, 'tap']). The wrapper makes them from "threshold 0.5:Half" (draw.ts, markRefs).
   */
  lines?: MarkRef[]
  uprights?: MarkRef[]
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
  const stemmed = (id: string) =>
    props.stems === true ||
    (typeof props.stems === 'string' ? props.stems.split(/[\s,]+/) : props.stems || []).includes(id)
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
      stems: stemmed(tap.id),
      dashed: tap.origin === 'lesson' && taps.length > 1 && tap !== taps[0],
    }
  })
  const xAxis = {
    // Before the lab has answered there is no range to read; a logarithmic axis cannot start at 0.
    min: props.xMin ?? (Number.isFinite(x0) ? x0 : props.xLog ? AUDIBLE.min : 0),
    max: props.xMax ?? (Number.isFinite(x1) ? x1 : props.xLog ? AUDIBLE.max : 1),
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
  const tapValue = (id: string) => result?.taps[id]?.channels_data[0]?.[0]
  const marks: Mark[] = [
    ...markValues(lines, state.values, tapValue).map(({ value, text }) => ({ y: value, text })),
    ...markValues(uprights, state.values, tapValue).map(({ value, text }) => ({ x: value, text })),
  ]
  const followed = follow ? result?.taps[follow]?.channels_data[0] : undefined
  const cursor = followed
    ? (seconds: number) =>
        followed[
          Math.min(followed.length - 1, Math.floor((seconds * SAMPLE_RATE) / CONTROL_PERIOD))
        ] ?? null
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
