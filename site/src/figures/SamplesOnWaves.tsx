// A few samples, each a dot on a stalk, and the continuous waves that pass through them: what
// the samples were taken from, and whatever else they could as well have been taken from.
// Both are curves the lab worked out; this draws the first kind as lines and the second as stalks.
// With `spectrum` it draws a second picture beside the first: how much of each frequency the
// loop of that sound holds, on an even axis that runs to the sample rate, with an upright at
// half the rate and one at each control named, each with its name beside it. Nothing sampled
// stands past the first upright. The plot keeps two names off each other: the one that would run
// into the other is written a row lower (`namePlaces` in draw.ts).

import { useLab, waitingText } from '../lab/page.ts'
import { SAMPLE_RATE } from '../lab/rate.ts'
import Plot, { uprightsAt, type Series } from './Plot.tsx'
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
  /** A sound whose spectrum is drawn beside the samples. */
  spectrum?: TapRef
  /** Controls in hertz drawn as an upright line in the spectrum: [id, name] pairs. */
  uprights?: [string, string][]
}

export default function SamplesOnWaves({
  waves,
  samples,
  xTitle = 'samples',
  min = -1.25,
  max = 1.25,
  height,
  label,
  spectrum,
  uprights = [],
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
  const dots = (
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
  if (!spectrum) return dots
  return (
    <div className="samples-beside-spectrum">
      {dots}
      <Plot
        label={`The spectrum of ${spectrum.name}, with an upright at half the sample rate`}
        series={[
          {
            key: spectrum.id,
            name: spectrum.name,
            role: spectrum.role,
            unit: 'dB',
            ys: result?.taps[spectrum.id]?.spectrum,
            x0: 0,
            x1: SAMPLE_RATE / 2,
          },
        ]}
        x={{ min: 0, max: SAMPLE_RATE, unit: 'Hz', title: 'hertz' }}
        y={{ min: -100, max: 6, unit: 'dB', title: 'decibels' }}
        height={height}
        marks={[
          { x: SAMPLE_RATE / 2, text: 'half the sample rate' },
          ...uprightsAt(uprights, state.values),
        ]}
        waiting={waitingText(state)}
        stamp={result}
      />
    </div>
  )
}
