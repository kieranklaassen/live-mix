// A few samples, each a dot on a stalk, and the continuous waves that pass through them: what
// the samples were taken from, and whatever else they could as well have been taken from.
// Both are curves the lab worked out; this draws the first kind as lines and the second as stalks.

import { useLab, waitingText } from '../lab/page.ts'
import Plot, { type Series } from './Plot.tsx'
import type { TapRef } from './roles.ts'

interface Props {
  /** Curves with many points to a sample, drawn as lines. */
  waves: TapRef[]
  /** Curves with one point to a sample, drawn as stalks. */
  samples: TapRef[]
  /** A word or two for the x axis, which counts samples. */
  xTitle?: string
  min?: number
  max?: number
  height?: number
  label: string
}

export default function SamplesOnWaves({
  waves,
  samples,
  xTitle = 'samples',
  min = -1.25,
  max = 1.25,
  height,
  label,
}: Props) {
  const state = useLab()
  const result = state.result
  let x0 = Infinity
  let x1 = -Infinity
  const one = (tap: TapRef, stems: boolean): Series => {
    const found = result?.taps[tap.id]
    const data = found?.channels_data[0]
    if (!found || !data) return { key: tap.id, name: tap.name, role: tap.role, x0: 0, x1: 1 }
    x0 = Math.min(x0, found.x0)
    x1 = Math.max(x1, found.x1)
    return {
      key: tap.id,
      name: tap.name,
      role: tap.role,
      ys: data,
      x0: found.x0,
      x1: found.x1,
      stems,
    }
  }
  // The waves first, so the samples stand on top of them.
  const series = [...waves.map((tap) => one(tap, false)), ...samples.map((tap) => one(tap, true))]
  return (
    <Plot
      label={label}
      series={series}
      x={{
        min: Number.isFinite(x0) ? x0 : 0,
        max: Number.isFinite(x1) ? x1 : 1,
        title: xTitle,
      }}
      y={{ min, max }}
      height={height}
      waiting={waitingText(state)}
      stamp={result}
    />
  )
}
