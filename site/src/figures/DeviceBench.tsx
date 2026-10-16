// The real device, running live through the engine behind its own plate, on the same loop. The
// engine is loaded only when the reader opens the bench, and opening it makes no sound.

import { lazy, Suspense, useState } from 'react'
import { labStore, useLab } from '../lab/page.ts'
import { BENCH } from '../lab/store.ts'

export interface BenchProps {
  device: string
  name: string
  params: Record<string, number | string | boolean>
  /** An effect on the loop, a device that puts out only its wet sound, or an instrument that plays. */
  as: 'insert' | 'send' | 'instrument'
  /** The lesson's recipe for the device's impulse, where it takes one. */
  impulse?: { seconds: number; seed: number }
}

const BenchPlate = lazy(() => import('./BenchPlate.tsx'))

export default function DeviceBench(props: BenchProps) {
  const state = useLab()
  const [open, setOpen] = useState(false)
  const sounding = state.playing && state.sounding === BENCH
  const ready = state.status === 'ready' && state.result !== undefined

  if (!open) {
    return (
      <div className="bench" data-bench={props.device}>
        <button type="button" className="button" disabled={!ready} onClick={() => setOpen(true)}>
          Open {props.name}
        </button>
        <p className="bench-note">
          This loads the engine and builds the device. It makes no sound until you press Listen.
        </p>
      </div>
    )
  }
  return (
    <div className="bench" data-bench={props.device} data-open="">
      <div className="bench-bar">
        <button
          type="button"
          className="button"
          aria-pressed={sounding}
          disabled={!state.benchOpen}
          onClick={() => (sounding ? labStore().stop() : labStore().listen(BENCH))}
        >
          {sounding
            ? 'Stop'
            : props.as === 'instrument'
              ? `Play ${props.name}`
              : `Listen through ${props.name}`}
        </button>
      </div>
      <div className="bench-plate">
        <Suspense fallback={<p className="bench-note">Loading the engine…</p>}>
          <BenchPlate {...props} />
        </Suspense>
      </div>
    </div>
  )
}
