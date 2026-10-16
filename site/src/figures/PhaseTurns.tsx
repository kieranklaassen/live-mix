// A filter's phase against frequency, counted in half turns: how far round it has turned each
// frequency, where 1 is 180 degrees. A half turn is what matters when the filtered signal is
// added back to the one that went in (an odd number of them cancels), so the grid stands on
// half turns, chosen levels are marked across the picture in degrees, and the frequencies a
// tap lists are marked up it.

import { useLab, waitingText } from '../lab/page.ts'
import { label as number } from './draw.ts'
import Plot, { type Mark, type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

const HALF_TURN = 180

interface Props {
  /** Curve taps holding a phase in degrees. */
  taps: TapRef[]
  /** Phases, in degrees, marked with a line across the picture. */
  levels?: number[]
  /** Mark every odd multiple of 180 degrees the first curve reaches. */
  oddTurns?: boolean
  /** The id of a curve tap whose values are frequencies in hertz, each marked with a line up the picture. */
  crossings?: string
  /** Controls whose value in hertz is drawn as an upright line: [id, name] pairs. */
  uprights?: [string, string][]
  height?: number
  label: string
}

export default function PhaseTurns({
  taps,
  levels = [],
  oddTurns,
  crossings,
  uprights = [],
  height = 240,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  let lowest = 0
  let x0 = 20
  let x1 = 20_000
  const series: Series[] = taps.map((tap, index) => {
    const found = result?.taps[tap.id]
    const data = found?.channels_data[0]
    const base = { key: tap.id, name: tap.name, role: tap.role, unit: 'half turns' }
    if (!found || !data) return { ...base, x0, x1 }
    const ys = Float32Array.from(data, (degrees) => degrees / HALF_TURN)
    if (index === 0) {
      for (const value of ys) lowest = Math.min(lowest, value)
      x0 = found.x0
      x1 = found.x1
    }
    return {
      ...base,
      ys,
      x0: found.x0,
      x1: found.x1,
      xLog: found.log,
      dashed: tap.origin === 'lesson' && index > 0,
    }
  })
  // Whole half turns, with room above and below for the words in the corners.
  const turns = Math.max(1, Math.ceil(-lowest - 0.02))
  const room = turns / 6

  const marks: Mark[] = levels.map((degrees) => ({
    y: degrees / HALF_TURN,
    text: `${number(degrees)}°`,
  }))
  if (oddTurns) {
    for (let odd = 1; odd <= turns; odd += 2)
      marks.push({ y: -odd, text: `${number(-odd * HALF_TURN)}°` })
  }
  const places = crossings ? result?.taps[crossings]?.channels_data[0] : undefined
  if (places) {
    // Two can carry their frequency, in hertz as the axis is; more would write over each other.
    for (const hz of places) marks.push({ x: hz, text: places.length <= 2 ? number(hz) : '' })
  }
  for (const [id, name] of uprights) {
    const value = state.values[id]
    if (value !== undefined) marks.push({ x: value, text: name })
  }

  return (
    <Plot
      label={label}
      series={series}
      x={{ min: x0, max: x1, log: true, unit: 'Hz', title: 'hertz' }}
      y={{
        min: -turns - room,
        max: room,
        unit: 'half turns',
        title: 'half turns',
      }}
      height={height}
      marks={marks}
      waiting={waitingText(state)}
      stamp={result}
    />
  )
}
