// How much of each frequency a signal holds. For a sound, the average over the loop, worked out
// by the kit's transform in the lab; for a spectrum the lab computed, that spectrum as it is.

import { useLab, waitingText } from '../lab/page.ts'
import { SAMPLE_RATE } from '../lab/rate.ts'
import { AUDIBLE } from './draw.ts'
import Plot, { uprightsAt, type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

interface Props {
  taps: TapRef[]
  /** Decibels at the bottom and the top. */
  min?: number
  max?: number
  /** Hertz at the left and the right; the audible band when left out. */
  fMin?: number
  fMax?: number
  /** A linear frequency axis, where harmonics stand evenly. */
  linear?: boolean
  /** Controls whose value in hertz is drawn as an upright line: [id, name] pairs. */
  uprights?: [string, string][]
  height?: number
  label: string
}

export default function Spectrum({
  taps,
  min = -96,
  max = 0,
  fMin,
  fMax,
  linear,
  uprights = [],
  height,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  const series: Series[] = taps.map((tap) => {
    const found = result?.taps[tap.id]
    const base = { key: tap.id, name: tap.name, role: tap.role, unit: 'dB' }
    if (!found) return { ...base, x0: 0, x1: 1 }
    if (found.kind === 'audio') return { ...base, ys: found.spectrum, x0: 0, x1: SAMPLE_RATE / 2 }
    return { ...base, ys: found.channels_data[0], x0: found.x0, x1: found.x1, xLog: found.log }
  })
  const x = linear
    ? { min: fMin ?? 0, max: fMax ?? SAMPLE_RATE / 2, unit: 'Hz', title: 'hertz' }
    : { ...AUDIBLE, min: fMin ?? AUDIBLE.min, max: fMax ?? AUDIBLE.max, unit: 'Hz', title: 'hertz' }
  return (
    <Plot
      label={label}
      series={series}
      x={x}
      y={{ min, max, unit: 'dB', title: 'decibels' }}
      height={height}
      marks={uprightsAt(uprights, state.values)}
      waiting={waitingText(state)}
      stamp={result}
    />
  )
}
