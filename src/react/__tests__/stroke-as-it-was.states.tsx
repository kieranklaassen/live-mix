// Three strokes that take no turns, as props: a plain one, one that repeats,
// and one with fades, a line and a selection. `stroke-as-it-was.ts` holds the
// markup each rendered to before `Stroke` knew of passes.

import { type WaveformPeaks } from '../../core/clips/peaks'
import { type StrokeProps } from '../components/Stroke'

const peaks: WaveformPeaks = {
  min: Float32Array.from({ length: 32 }, (_, index) => -Math.abs(Math.sin(index / 3))),
  max: Float32Array.from({ length: 32 }, (_, index) => Math.abs(Math.sin(index / 3))),
}

export const STROKES_AS_THEY_WERE: Record<'plain' | 'looping' | 'dressed', StrokeProps> = {
  plain: { width: 60, height: 20, peaks },
  looping: { width: 90, height: 24, brush: 2, name: 'Bells', repeats: 3, hits: [0], peaks },
  dressed: {
    width: 80,
    height: 40,
    brush: 5,
    name: 'Rain',
    kind: 'texture',
    peaks,
    fadeIn: 0.25,
    fadeOut: 0.1,
    selected: true,
    automation: {
      label: 'Level',
      points: [
        [0, 0.2],
        [1, 0.8],
      ],
    },
  },
}
