// The stages of a technique in the signal's order, once, under the lesson's opening.

import Stage from './Stage.tsx'
import type { TapRef } from './roles.ts'

export default function StageStrip({ taps }: { taps: TapRef[] }) {
  return (
    <ol className="stages">
      {taps.map((tap, index) => (
        <Stage key={tap.id} tap={tap} step={index + 1} />
      ))}
    </ol>
  )
}
